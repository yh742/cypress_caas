import { REGEX_TABLE, SEED } from "../../support/const"

describe('for a admin entity', () => {

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
            cy.getToken(SEED.ADM[0], 'admin').then((response) => {
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
            cy.getToken(SEED.ADM[0], 'ADMIN').then((response) => {
                for (const prop of EXPECTED_FLDS) {
                    expect(response.body).property(prop).to.match(REGEX_TABLE[prop])
                }
                expect(response.body).property('token').to.equal(initToken)
            })
        })

        it('returns unauthorized access as invalid entity', () => {
            cy.getToken(SEED.ADM[0], 'sw', false).its('status').should('equal', 401)
        })
        
        it('returns unauthorized access for invalid user', () => {
            cy.getToken(INVALID_MSI, 'admin', false).its('status').should('equal', 401)
        })

    })

    describe('the refresh token endpoint', () => {
        
        let bearerToken 
        const INVALID_TOKEN = 
            'MzQwNjc0Mjg2NzAzMTE3ODE1NTY='+
            '.NmI2ZDRlM2NkZjk2MGMyYjdhZmRkY2YyYjIxODhiNDcwMzYzYzYxMzU4YTg4YmRjMTk5MTZmOThlYTA1YjQ0NA=='

        before(()=> {
            cy.resetDB()
            cy.getToken(SEED.ADM[0], 'admin').its('body').then((body) => bearerToken = body.token)
        })

        it('returns conflicts', () => {
            cy.refreshToken(bearerToken, false).its('status').should('equal', 409)
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
        let assignedMEC
        before(()=> {
            cy.resetDB()
            // assign all the tokens we need here
            cy.getToken(SEED.SW[0], 'sw').its('body.token').then((t) => tokenMap.sw = t)
            cy.getToken(SEED.ADM[0], 'admin').its('body.token').then((t) => {
                tokenMap.admin = t
                bearerToken = tokenMap.admin
            })
            cy.getToken(SEED.VEH[0], 'veh').its('body').then((b) => {
                tokenMap.veh = b.token
                assignedMEC = b.mec
            })
        })

        it('return not found for mapping token <-> entityid with invalid json fields', () => {
            //  wrong mec 
            cy.mapEntity(bearerToken, tokenMap.veh, 'veh', ENTITYID, 
                '192.0.1.1', false).its('status').should('equal', 404)

            // mismatch token and entity type
            for (const entity in tokenMap) {
                let badEntity = entity == "veh"? "sw": entity == "sw"? "admin": "veh"
                cy.mapEntity(bearerToken, tokenMap[entity], 
                    badEntity, ENTITYID, badEntity == 'veh'? assignedMEC: '', false).its('status').should('equal', 404)
            }
        })

        it('return success or conflict based on if entityid mapped', () => {
            cy.visit('/showdb')
            // check this for all 3 entity types
            for (const entity in tokenMap) {
                cy.mapEntity(bearerToken, tokenMap[entity], entity, ENTITYID, 
                    entity == 'veh'? assignedMEC: '', false).its('status').should('equal', 200)
            }

            // if we try to map another entity, 409 should be thrown
            // and entity/entityid should be returned
            for (const entity in tokenMap) {
                cy.mapEntity(bearerToken, tokenMap[entity], entity, '4567', 
                    entity == 'veh'? assignedMEC: '', false).should((response)=> {
                        expect(response.status).to.equal(409)
                        expect(response.body.entityid).to.equal(ENTITYID)
                        // should only return entity/entityid, no token fields
                        expect(response.body.token).to.not.exist
                    })
            }
        })

        it('return failure for validating invalid token fields', () => {
            // invalid token case
            cy.validateToken(bearerToken, 'invalid', 'veh', 
                ENTITYID, assignedMEC, false).its('status').should('equal', 401)
            // wrong mec case
            cy.validateToken(bearerToken, tokenMap['veh'], 'veh', 
                ENTITYID, assignedMEC == SEED.MEC[0]? SEED.MEC[1]: SEED.MEC[0], false).its('status').should('equal', 401)

            for (const entity in tokenMap) {
                // mismatched token and entity 
                cy.validateToken(bearerToken, tokenMap[entity], 
                    entity == "veh"? "sw": entity == "sw"? "admin": "veh",
                    ENTITYID, entity == 'veh'? assignedMEC: '', false).its('status').should('equal', 401)
                // wrong entityid 
                cy.validateToken(bearerToken, tokenMap[entity], entity, 
                    '2345', entity == 'veh'? assignedMEC: '', false).its('status').should('equal', 401)
            }
        })

        it('return success for validating valid token/entityid', () => {
            for (const entity in tokenMap) {
                cy.validateToken(bearerToken, tokenMap[entity], entity,  
                    ENTITYID, entity == 'veh'? assignedMEC: '', false).its('status').should('equal', 200)
            }
        })

        it('return not found for deleting entities with invalid json fields', () => {
            // invalid token case
            cy.deleteEntity(bearerToken, 'invalid', 'veh', 
                ENTITYID, assignedMEC, false).its('status').should('equal', 404)
            // wrong mec case
            cy.deleteEntity(bearerToken, tokenMap['veh'], 'veh', 
                ENTITYID, assignedMEC == SEED.MEC[0]? SEED.MEC[1]: SEED.MEC[0], false)
                .its('status').should('equal', 404)

            for (const entity in tokenMap) {
                // mismatched token and entity 
                cy.deleteEntity(bearerToken, tokenMap[entity], 
                    entity == "veh"? "sw": entity == "sw"? "admin": "veh",
                    ENTITYID, entity == 'veh'? assignedMEC: '', false).its('status').should('equal', 404)
                // wrong entityid 
                cy.deleteEntity(bearerToken, tokenMap[entity], entity, 
                    '2345', entity == 'veh'? assignedMEC: '', false).its('status').should('equal', 404)
            }
        })

        it('return success for deleting entityid', () => {
            for (const entity in tokenMap) {
                cy.deleteEntity(bearerToken, tokenMap[entity], entity, ENTITYID, 
                    entity == 'veh'? assignedMEC: '', false).its('status').should('equal', 204)
            }
        })
    })

    // revoking the token as a SW entity
    describe('the revoke endpoint', () => {

        let tokenMap = {
            'veh': '',
            'sw': '',
        }

        // bearer token is SW entity
        let bearerToken
        before(()=> {
            cy.resetDB()
            // assign all the tokens we need here
            cy.getToken(SEED.SW[0], 'sw').its('body.token').then((t) => tokenMap.sw = t)
            cy.getToken(SEED.ADM[0], 'admin').its('body.token').then((t) => {
                tokenMap.admin = t
                bearerToken = t
            })
            cy.getToken(SEED.VEH[0], 'veh').its('body.token').then((t) => tokenMap.veh = t)
        })

        it('returns not found for revoke invalid json input', () => {
            // invalid token 
            cy.revoke(bearerToken, 'invalid_token', 'veh', false).its('status').should('equal', 404)
            // mismatched token/entity
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

    describe('the admin account endpoints', () => {
        let bearerToken
        const testAccounts = {
            '12123412': 'sw',
            '23423124': 'admin',
            '34353534': 'veh',
        }
        // initial number of accounts based on SEED values
        const initialCount = SEED.SW.length + SEED.ADM.length + SEED.VEH.length
        before(()=> {
            cy.resetDB()
            cy.getToken(SEED.ADM[0], 'admin').its('body.token').then((t) => bearerToken = t)
        })
        
        it('return OK for listing account info', () => {
            cy.adminListAcct(bearerToken, '', false).then((response) => {
                expect(response).property('status').to.equal(200)
                expect(response).property('body').to.have.property('accounts')
                expect(Object.keys(response.body.accounts).length).to.equal(initialCount)
            })
        })

        it('returns bad request to adding an account with invalid entity', () => {
            cy.adminAddAcct(bearerToken, '12345', 'blah', 'verizon', false)
                .its('status').should('equal', 400)
        })

        it('return OK for adding an account', () => {
            for (const msisdn in testAccounts) {
                cy.adminAddAcct(bearerToken, msisdn, testAccounts[msisdn], 'verizon', false)
                    .its('status').should('equal', 200)
            }
            cy.adminListAcct(bearerToken, false).then((response) => {
                expect(response).property('status').to.equal(200)
                // should contain all the SEED accoutns and the 3 added in this block
                expect(response).property('body').to.have.property('accounts')
                expect(Object.keys(response.body.accounts).length)
                    .to.equal(initialCount + 3)
            })
        })

        it('return OK for listing account info with filters', () => {
            cy.adminListAcct(bearerToken, false, {'entity': 'admin'}).then((response) => {
                expect(response).property('status').to.equal(200)
                expect(response).property('body').to.have.property('accounts')
                expect(Object.keys(response.body.accounts).length).to.equal(2)
            })
            cy.adminListAcct(bearerToken, false, {'org': 'verizon'}).then((response) => {
                expect(response).property('status').to.equal(200)
                expect(response).property('body').to.have.property('accounts')
                expect(Object.keys(response.body.accounts).length).to.equal(3)
            })
            cy.adminListAcct(bearerToken, false, {'msisdn': SEED.ADM[0]}).then((response) => {
                expect(response).property('status').to.equal(200)
                expect(response).property('body').to.have.property('accounts')
                expect(Object.keys(response.body.accounts).length).to.equal(1)
            })
        })

        it('return not found for updating a non-existing account and invalid inputs', () => {
            // invalid msisdn
            cy.adminUpdateAcct(bearerToken, '999999', 'admin', 'verizon', false)
                .its('status').should('equal', 404)
        })

        it('return conflict for trying to update an account with token issued', () => {
            cy.adminUpdateAcct(bearerToken, SEED.ADM[0], 'admin', 'verizon', false)
                .its('status').should('equal', 409)
        })

        // update all test accounts to admin/sentaca
        it('return OK for updating account info', () => {
            for (const msisdn in testAccounts) {
                cy.adminUpdateAcct(bearerToken, msisdn, 'admin', 'sentaca', false)
                    .its('status').should('equal', 200)
            }
            // check if the test accounts were updated
            cy.adminListAcct(bearerToken, false).then((response) => {
                expect(response).property('status').to.equal(200)
                expect(response).property('body').to.have.property('accounts')
                for (const msisdn in testAccounts) {
                    expect(response.body.accounts).to.have.property(msisdn)
                    expect(response.body.accounts[msisdn]).property('organization').to.equal('sentaca')
                    expect(response.body.accounts[msisdn]).property('entity').to.equal('admin')
                }
            })
        })

        it('return not found for deleting a non-existent account and invalid inputs', () => {
            // delete an non existent account
            cy.adminDelAcct(bearerToken, '999999', 'veh', 'verizon', false)
                .its('status').should('equal', 404)
            for (const msisdn in testAccounts) {
                let entity = testAccounts[msisdn]
                // check that mismatch msisdn and entity type returns not found
                cy.adminDelAcct(bearerToken, msisdn, 
                    entity == "veh"? "sw": entity == "sw"? "admin": "veh", 'admin', false)
                    .its('status').should('equal', 404)
                // check that org mismatch returns not found 
                cy.adminDelAcct(bearerToken, msisdn, entity, 'acme', false)
                    .its('status').should('equal', 404)
            }
        })

        it('return conflict for deleting an account with token issued', () => {
            cy.adminDelAcct(bearerToken, SEED.ADM[0], 'admin', 'verizon', false)
                .its('status').should('equal', 409)
        })

        // // test were updated to admin/sentaca
        it('return no content for deleting accounts', () => {
            for (const msisdn in testAccounts) {
                cy.adminDelAcct(bearerToken, msisdn, 'admin', 'sentaca', false)
                .its('status').should('equal', 204)
            }
            cy.adminListAcct(bearerToken, false).then((response) => {
                expect(response).property('status').to.equal(200)
                // should contain all the SEED accoutns and the 3 added in this block
                expect(response).property('body').to.have.property('accounts')
                expect(Object.keys(response.body.accounts).length)
                    .to.equal(initialCount)
            })
        })
    })

    describe('the admin mec mapping endpoints', () => {

        let bearerToken
        let assignedMEC
        before(()=> {
            cy.resetDB()
            cy.getToken(SEED.ADM[0], 'admin').its('body.token').then((t) => bearerToken = t)
            cy.getToken(SEED.VEH[0], 'veh').its('body').then((b) => {
                assignedMEC = b.mec
            })
        })

        const NEW_ENTRIES = {
            'mec': '192.168.0.1',
            'cell': ['123214'], 
            'ta': ['4324234'],
        }

        const UPDATE_ENTRY = {
            'mec': SEED.MEC[0],
            'cell': ['123215'], 
            'ta': ['4324235'],
        }

        const OVERWRITE_ENTRY = {
            'mec': '192.168.0.2',
            'cell': ['123214'], 
            'ta': [],
        }

        it('return OK for listing mec mapping', () => {
            cy.adminListMec(bearerToken, false).then((response) => {
                expect(response).property('status').to.equal(200)
                expect(response).property('body').to.have.property('mecs')
                // the keys of the body should contain all the SEED MEC locations
                // {'194.0.0.1': {'cell':[], 'ta': []}}
                expect(response.body.mecs).to.have.all.keys(...SEED.MEC)
            })
        })

        it('return bad request for malformed json', () => {
            // try both updating and adding entries to the mec mapping in a list
            let badEntry = {...UPDATE_ENTRY, cell: '1231241'}
            cy.adminAddMec(bearerToken, [badEntry], false).its('status').should('equal', 400)
        })

        it('return OK for adding mec mapping', () => {
            // try adding new entries to the mec
            let entries = [NEW_ENTRIES, UPDATE_ENTRY]
            cy.adminAddMec(bearerToken, entries, false).its('status').should('equal', 200)
            cy.adminListMec(bearerToken, false).then((response) => {
                expect(response).property('status').to.equal(200)
            })
        })

        it('return conflict for adding existing mec/TA mapping', () => {
            // try adding existing cell entry to a new MEC, this should fail
            let entries = [OVERWRITE_ENTRY]
            cy.adminAddMec(bearerToken, entries, false).its('status').should('equal', 409)
        })

        it('return not found for removing non-existing mec', () => {
            cy.adminDeleteMec(bearerToken, '1234', false).its('status').should('equal', 404)
        })

        it('return OK for removing mec mapping', () => {
            cy.adminDeleteMec(bearerToken, NEW_ENTRIES.mec, false).its('status').should('equal', 204)
            
            cy.adminListMec(bearerToken, false).then((response) => {
                expect(response).property('status').to.equal(200)
                expect(response).property('body').to.have.property('mecs')
                expect(response.body.mecs).to.not.have.property(NEW_ENTRIES.mec)
            })
        })

        it('return conflict for removing mec with veh assigned', () => {
            cy.adminDeleteMec(bearerToken, assignedMEC, false).its('status').should('equal', 409)
        })
    })

    describe('the admin token endpoints', () => {
        let bearerToken
        let tokens = {'veh': '', 'sw': ''} 
        const TEST_ENTRIES = {'veh': SEED.VEH[0], 'sw': SEED.SW[0]} 
        const EXPECTED_FLDS = ['expires', 'issued', 'requested', 'token']
        before(()=> {
            cy.resetDB()
            cy.getToken(SEED.ADM[0], 'admin').its('body.token').then((t) => bearerToken = t)
        })

        it('return OK for listing tokens', () => {
            cy.adminListToken(bearerToken, false).its('status').should('equal', 200)
        })

        it('return unauthorized for adding mismatch token/entity', () => {
            // 401 vs 404?
            for (const entity in TEST_ENTRIES) {
                cy.adminAddToken(bearerToken, TEST_ENTRIES[entity], entity == 'sw'? 'veh': 'sw', false)
                    .its('status').should('equal', 401)
            }
        })

        it('return OK for adding token', () => {
            // add tokens to entries and check response body
            for (const entity in TEST_ENTRIES) {
                cy.adminAddToken(bearerToken, TEST_ENTRIES[entity], entity, false).then((response) => {
                    expect(response).property('status').to.equal(200)
                    for (const field of EXPECTED_FLDS) {
                        expect(response).property('body').property(field).to.match(REGEX_TABLE[field])
                    }
                    tokens[entity] = response.body.token
                })
            }

            // there should be three tokens that show up here now
            cy.adminListToken(bearerToken, false).then((response)=> {
                expect(response).property('status').to.equal(200)
                expect(response).property('body').to.have.property('tokens')
                expect(Object.keys(response.body.tokens).length).to.eq(3)
            })

            // check DB values
            cy.visit('/showdb')
            // check that mec and subscription for veh aren't empty
            cy.contains(TEST_ENTRIES['veh']).parent().children().eq(2)
                .invoke('text').should('match', REGEX_TABLE['mec'])
            cy.contains(TEST_ENTRIES['veh']).parent().children().eq(3)
                .invoke('text').should('match', REGEX_TABLE['subscriptionID'])
        })

        it('return OK for adding tokens again after initial token generation', () => {
            let lastToken = tokens['veh']
            // add tokens to entries and check response body
            for (const entity in TEST_ENTRIES) {
                cy.adminAddToken(bearerToken, TEST_ENTRIES[entity], entity, false).then((response) => {
                    expect(response).property('status').to.equal(200)
                    for (const field of EXPECTED_FLDS) {
                        expect(response).property('body').property(field).to.match(REGEX_TABLE[field])
                    }
                    // for veh tokens should be a new one, else token should stay the same 
                    if (entity == 'veh') {
                        expect(response.body.token).to.not.equal(tokens[entity])
                    } else {
                        expect(response.body.token).to.equal(tokens[entity])
                    }
                    tokens[entity] = response.body.token
                })
            }
            cy.visit('/showdb')
            // the first token should have a subscription ID
            cy.get('tbody:first>tr>td:nth-child(4)').invoke('text')
                   .should('match', REGEX_TABLE['subscriptionID'])
            // the original token should be revoked with reason code 'reauthenticate'
            cy.contains(lastToken).parent().children().eq(4)
                .invoke('text').should('equal', 'Reauthenticate')
        })

        //filterable by misisdn and mec
        it('return ok for listing token by filters', () => {
            cy.adminListToken(bearerToken, false, {'msisdn':SEED.SW[0]}).then((response)=> {
                expect(response).property('status').to.equal(200)
                expect(response).property('body').to.have.property('tokens')
                expect(Object.keys(response.body.tokens).length).to.eq(1)
            })
            cy.adminListToken(bearerToken, false, {'mec':SEED.MEC[0]}).then((response)=> {
                expect(response).property('status').to.equal(200)
                expect(response).property('body').to.have.property('tokens')
                expect(Object.keys(response.body.tokens).length).to.eq(1)
            })
        })

        it('return not found for non-existing msisdn subscription', () => {
            cy.adminListSub(bearerToken, false, {'msisdn': '123123'}).its('status').should('equal', 404)
        })

        it('return ok for listing subscriptions with or without filters', () => {
            // add another token that requires subscription first
            cy.adminAddToken(bearerToken, SEED.VEH[1], 'veh', false)
            // list should return both values
            cy.adminListSub(bearerToken, false).then((response) => {
                expect(response).property('status').to.equal(200)
                expect(response).property('body').to.have.property('subscriptions')
                expect(response.body.subscriptions).to.have.property(SEED.VEH[0])
                expect(response.body.subscriptions).to.have.property(SEED.VEH[1])
            })
            // filtering by msisdn should return one value
            cy.adminListSub(bearerToken, false, {'msisdn': SEED.VEH[0]}).then((response) => {
                expect(response).property('status').to.equal(200)
                expect(response).property('body').to.have.property('subscriptions')
                expect(response.body.subscriptions).to.have.property(SEED.VEH[0])
                expect(response.body.subscriptions).to.not.have.property(SEED.VEH[1])
            })
        })

        it('return not found for revoking mismatched tokens/entity', () => {
            for (const entity in tokens) {
                cy.adminRevoke(bearerToken, tokens[entity], 
                    entity == "veh"? "sw": entity == "sw"? "admin": "veh", false).its('status').should('equal', 404)
            }
        })

        it('return OK for revoking token', () => {
            for (const entity in tokens) {
                cy.adminRevoke(bearerToken, tokens[entity], entity, false).its('status').should('equal', 200)
            }
        })

    })

})