import { REGEX_TABLE, SEED, INVALID_TOKEN } from "../../support/const"

describe('for a sw entity', () => {

    before(function() {
        // check if enough seed value exists for testing
        if (!SEED.VEH || SEED.SW.length <= 0 || 
                SEED.ADM.length <= 0 || SEED.VEH.length <= 0 ) {
            this.skip()
        }
    })

    describe('the create token endpoint', () => {
        
        let initToken
        const INVALID_MSI = '2144213242'
        const EXPECTED_FLDS = ['expires', 'issued', 'requested', 'token']
        before(()=> {
            // reset database
            cy.resetDB()
        })

        it('issues a token for valid client', () => {
            cy.getToken(SEED.SW[0], 'sw').then((response) => {
                // check response and json body
                expect(response.status).to.eq(200)
                for (const prop of EXPECTED_FLDS) {
                    expect(response.body).property(prop).to.match(REGEX_TABLE[prop])
                }

                // check expiry date is a later time
                expect(Date.parse(response.body.expires)).to.be.greaterThan(Date.now())
                initToken = response.body.token

                // check DB values
                cy.visit('/showdb')
                // only one token is created
                cy.get('tr:has(td)').should('have.lengthOf', 1)
                // check that mec and subscription fields are empty
                cy.get('tr>td:nth-child(3)').invoke('text').should('equal', '')
                cy.get('tr>td:nth-child(4)').invoke('text').should('equal', '')
            })
        })

        it('issues the same token when called twice', () => {        
            // reauthenticate and check if first token is revoked
            cy.getToken(SEED.SW[0], 'SW').then((response) => {
                for (const prop of EXPECTED_FLDS) {
                    expect(response.body).property(prop).to.match(REGEX_TABLE[prop])
                }
                expect(response.body).property('token').to.equal(initToken)
            })
        })

        it('returns unauthorized access as invalid entity', () => {
            cy.getToken(SEED.SW[0], 'veh', false).its('status').should('equal', 401)
        })
        
        it('returns unauthorized access for invalid user', () => {
            cy.getToken(INVALID_MSI, 'sw', false).its('status').should('equal', 401)
        })

    })

    describe('the refresh token endpoint', () => {
        
        let bToken 
        before(()=> {
            cy.resetDB()
            cy.getToken(SEED.SW[0], 'sw').its('body').then((body) => bToken = body.token)
        })

        it('returns conflicts', () => {
            cy.refreshToken(bToken, false).its('status').should('equal', 409)
        })

        it('returns unauthorized for invalid tokens', () => {
            cy.refreshToken(INVALID_TOKEN, false).its('status').should('equal', 401)
        })

    })

    describe('the map/validate/delete entity endpoints', () => {

        let tokenMap = {
            'veh': '',
            'admin': '',
            'sw': ''
        }
        const ENTITYID = '1234'
        // bearer token is SW entity
        let bearerToken
        before(()=> {
            cy.resetDB()
            // assign all the tokens we need here
            cy.getToken(SEED.SW[0], 'sw').its('body.token').then((t) => {
                tokenMap.sw = t
                bearerToken = tokenMap.sw
            })
            cy.getToken(SEED.ADM[0], 'admin').its('body.token').then((t) => tokenMap.admin = t)
            cy.getToken(SEED.VEH[0], 'veh').its('body.token').then((t) => tokenMap.veh = t)
        })

        it('return not found for mapping token <-> entityid with invalid json fields', () => {

            //  wrong mec 
            cy.mapEntity(bearerToken, tokenMap.veh, 'veh', ENTITYID, 
                SEED.MEC[1], false).its('status').should('equal', 404)

            // mismatch token and entity type
            for (const entity in tokenMap) {
                cy.mapEntity(bearerToken, tokenMap[entity], 
                    entity == "veh"? "sw": entity == "sw"? "admin": "veh", 
                    ENTITYID, SEED.MEC[0], false).its('status').should('equal', 404)
            }
        })

        it('return success or conflict based on if entityid mapped', () => {
            
            // check this for all 3 entity types
            for (const entity in tokenMap) {
                cy.mapEntity(bearerToken, tokenMap[entity], entity, ENTITYID, 
                    SEED.MEC[0], false).its('status').should('equal', 200)
            }

            // if we try to map another entity, 409 should be thrown
            // and entity/entityid should be returned
            for (const entity in tokenMap) {
                cy.mapEntity(bearerToken, tokenMap[entity], entity, '4567', 
                    SEED.MEC[0], false).should((response)=> {
                        expect(response.status).to.equal(409)
                        expect(response.body.entityid).to.equal(ENTITYID)
                        // should only return entity/entityid, no token fields
                        expect(response.body.token).to.not.exist
                    })
            }
        })

        it('return failure for validating invalid token fields', () => {
            // invalid token case
            cy.validateToken(bearerToken, 'invalid', entity, 
                ENTITYID, SEED.MEC[0], false).its('status').should('equal', 401)
            // wrong mec case
            cy.validateToken(bearerToken, vehToken, 'veh', 
                ENTITYID, SEED.MEC[2], false).its('status').should('equal', 401)

            for (const entity in tokenMap) {
                // mismatched token and entity 
                cy.validateToken(bearerToken, tokenMap[entity], 
                    entity == "veh"? "sw": entity == "sw"? "admin": "veh",
                    ENTITYID, SEED.MEC[0], false).its('status').should('equal', 401)
                // wrong entityid 
                cy.validateToken(bearerToken, tokenMap[entity], entity, 
                    '2345', SEED.MEC[0], false).its('status').should('equal', 401)
            }
        })

        it('return success for validating valid token/entityid', () => {
            for (const entity in tokenMap) {
                cy.validateToken(bearerToken, tokenMap[entity], entity,  
                    ENTITYID, SEED.MEC[0], false).its('status').should('equal', 200)
            }
        })

        it('return not found for deleting entities with invalid json fields', () => {
            // invalid token case
            cy.deleteEntity(bearerToken, 'invalid', entity, 
                ENTITYID, SEED.MEC[0], false).its('status').should('equal', 404)
            // wrong mec case
            cy.deleteEntity(bearerToken, vehToken, 'veh', 
                ENTITYID, SEED.MEC[2], false).its('status').should('equal', 404)

            for (const entity in tokenMap) {
                // mismatched token and entity 
                cy.deleteEntity(bearerToken, tokenMap[entity], 
                    entity == "veh"? "sw": entity == "sw"? "admin": "veh",
                    ENTITYID, SEED.MEC[0], false).its('status').should('equal', 404)
                // wrong entityid 
                cy.deleteEntity(bearerToken, tokenMap[entity], entity, 
                    '2345', SEED.MEC[0], false).its('status').should('equal', 404)
            }
        })

        it('return success for deleting entityid', () => {
            for (const entity in tokenMap) {
                cy.deleteEntity(bearerToken, tokenMap[entity], entity, ENTITYID, 
                    SEED.MEC[0], false).its('status').should('equal', 204)
            }
        })
    })

    // revoking the token as a SW entity
    describe('the revoke endpoint', () => {

        let tokenMap = {
            'veh': '',
            'admin': '',
            'sw': ''
        }

        // bearer token is SW entity
        let bearerToken
        before(()=> {
            cy.resetDB()
            // assign all the tokens we need here
            cy.getToken(SEED.SW[0], 'sw').its('body.token').then((t) => {
                tokenMap.sw = t
                bearerToken = tokenMap.sw
            })
            cy.getToken(SEED.ADM[0], 'admin').its('body.token').then((t) => tokenMap.admin = t)
            cy.getToken(SEED.VEH[0], 'veh').its('body.token').then((t) => tokenMap.veh = t)
        })

        it('returns not found for revoke invalid json input', () => {
            cy.revoke(bearerToken, INVALID_TOKEN, 'veh', false).its('status').should('equal', 404)
            for (const entity in tokenMap) { 
                cy.revoke(bearerToken, tokenMap[entity], 
                    entity == "veh"? "sw": entity == "sw"? "admin": "veh", false).its('status').should('equal', 404)
            }
        })

        it('returns OK for revoking token', () => {
            for (const entity in tokenMap) { 
                cy.revoke(bearerToken, tokenMap[entity], entity, false)
                    .its('status').should('equal', 200)
            }
            cy.visit('/showdb')
            cy.get('tr>td:nth-child(5)').should('have.length', 3)
                .each((ele)=>{
                    expect(ele[0]).property('innerText').to.equal('UseAnotherServer')
                })
        })
    })

    //non of this should be available for SW clients
    describe('the admin endpoints', () => {

        let bToken
        const NEW_MSI = '2144213242'
        before(()=> {
            cy.resetDB()
            cy.getToken(SEED.SW[0], 'sw').its('body.token').then((t) => bToken = t)
        })

        it('return unauthorized  for listing tokens', () => {
            cy.adminListToken(bearerToken, false)
                .its('status').should('equal', 401)
        })

        it('return unauthorized for adding token', () => {
            cy.adminAddToken(bToken, SEED.VEH[0], 'veh', false)
                .its('status').should('equal', 401)
        })

        it('return unauthorized for listing account', () => {
            cy.adminListAcct(bToken, false).its('status').should('equal', 401)
        })

        it('return unauthorized for adding an account', () => {
            cy.adminAddAcct(bToken, NEW_MSI, 'veh', 'verizon', false).its('status')
                .should('equal', 401)
        })

        it('return unauthorized for updating account info', () => {
            cy.adminUpdateAcct(bToken, SEED.VEH[1], 'veh', 'sentaca', false)
                .its('status').should('equal', 401)
        })

        it('return unauthorized for listing subscriptions', () => {
            cy.adminListSub(bToken, false).its('status').should('equal', 401)
        })

        it('return unauthorized for listing mec mapping', () => {
            cy.adminListMec(bToken, false).its('status').should('equal', 401)
        })

        it('return unauthorized for updating mec mapping', () => {
            cy.adminUpdateMec(bToken, SEED.MEC[0], ['123214'], [], false)
                .its('status').should('equal', 401)
        })

        it('return unauthorized for removing mec mapping', () => {
            cy.adminDeleteMap(bToken, SEED.MEC[0], false).its('status').should('equal', 401)
        })

        it('return unauthorized for deleting account', () => {
            cy.adminDelAcct(bToken, SEED.VEH[1], 'veh', 'verizon', false)
                .its('status').should('equal', 401)
        })

        it('return unauthorized for revoking token', () => {
            cy.adminRevoke(bToken, bToken, 'veh', false).its('status').should('equal', 401)
        })

    })

})