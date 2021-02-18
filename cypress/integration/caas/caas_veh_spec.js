import { REGEX_TABLE, SEED, INVALID_TOKEN } from "../../support/const"

describe('for a veh entity', () => {

    before(function() {
        // check if enough seed value exists for testing
        if (!SEED.VEH || SEED.SW.length <= 0 || 
                SEED.ADM.length <= 0 || SEED.VEH.length <= 0 ) {
            this.skip()
        }
    })

    describe('the create token endpoint', () => {
        
        const INVALID_MSI = '2144213242'
        const EXPECTED_FLDS = ['expires', 'issued', 'mec', 'requested', 'token']
        let revokedToken
        before(()=> {
            // reset database
            cy.resetDB()
        })

        it.only('returns unauthorized access as invalid entity', () => {
            cy.getToken(SEED.VEH[0], 'sw', false).its('status').should('equal', 401)
            cy.getToken('', 'sw', false).its('status').should('equal', 401)
        })
        
        it('returns unauthorized access for invalid user', () => {
            cy.getToken(INVALID_MSI, 'VEH', false).its('status').should('equal', 401)
        })

        it.only('get a token using certificate (e.g. http header)', () => {
            const HEADER = `Hash=c290036e09db2ff7061dfc91e732c277f83c5b3ac6afff1ed7c981ac9fb5e494;Subject="CN=${SEED.VEH[1]}"`
            const HEADER2 = `By=http://frontend.lyft.com;Hash=468ed33be74eee6556d90c0149c1309e9ba61d6425303443c0748a02dd8de688;` + 
                `Subject="/C=US/ST=CA/L=San Francisco/OU=Lyft/CN=${SEED.VEH[2]}";URI=http://testclient.lyft.com;DNS=lyft.com;DNS=www.lyft.com`
            cy.getTokenHeader(HEADER, 'veh', false).then((response) => {
                    expect(response.status).to.equal(200)
            })
            cy.getTokenHeader(HEADER2, 'veh', false).then((response) => {
                expect(response.status).to.equal(200)
        })
        })

        it('issues a token for valid client', () => {
            cy.getToken(SEED.VEH[0], 'veh').then((response) => {
                // check response and json body
                expect(response.status).to.eq(200)
                for (const prop of EXPECTED_FLDS) {
                    expect(response.body).property(prop).to.match(REGEX_TABLE[prop])
                }

                // check expiry date is a later time
                expect(Date.parse(response.body.expires)).to.be.greaterThan(Date.now())
                revokedToken = response.body.token

                // check subscription id exists on /showdb
                cy.visit('/showdb')
                cy.get('tr:has(td)').should('have.lengthOf', 1)
                cy.get('tr>td:nth-child(4)').invoke('text').should('match', REGEX_TABLE['subscriptionID'])

            })
        })

        it('issues another new token if a valid client tries to reauthenticate', () => {
            // reauthenticate and check if first token is revoked
            cy.getToken(SEED.VEH[0], 'veh').then((response) => {
                for (const prop of EXPECTED_FLDS) {
                    expect(response.body).property(prop).to.match(REGEX_TABLE[prop])
                }
                expect(response.body).property('token').to.not.equal(revokedToken)
                cy.visit('/showdb')
                // the first token should have a subscription ID
                cy.get('tbody:first>tr>td:nth-child(4)').invoke('text')
                    .should('match', REGEX_TABLE['subscriptionID'])
                // the original token should be revoked with reason code 'reauthenticate'
                cy.contains(revokedToken).parent().children().eq(4)
                    .invoke('text').should('equal', 'Reauthenticate')
            })
        })

    })

    describe('the refresh token endpoint', () => {

        let initResponse = {}
        before(()=> {
            cy.resetDB()
            cy.getToken(SEED.VEH[0], 'veh').its('body').then((body) => {
                initResponse = {
                    token: body.token,
                    requested: Date.parse(body.requested),
                    issued: Date.parse(body.issued),
                    expires: Date.parse(body.expires),
                }
            })
        })

        it('can refresh previous token', () => {
            cy.refreshToken(initResponse.token).then((response) => {
                // check response and json body
                expect(response.status).to.eq(200)
                for (const prop in response.body) {
                    expect(response.body).property(prop).to.match(REGEX_TABLE[prop])
                }
                
                // token should differ than initial token and date should be later date
                expect(response.body.token).to.not.equal(initResponse.token)
                expect(Date.parse(response.body.requested)).to.be.greaterThan(initResponse.requested)
                expect(Date.parse(response.body.expires)).to.be.greaterThan(initResponse.expires)
                expect(Date.parse(response.body.issued)).to.be.greaterThan(initResponse.issued)


                // check subscription id exists on new token in /showdb
                cy.visit('/showdb')
                cy.contains(response.body.token).parent().
                    children().eq(3).invoke('text').should('match', REGEX_TABLE['subscriptionID'])
            })
        })

        it('returns unauthorized for invalid tokens', () => {
            cy.refreshToken(INVALID_TOKEN, false).its('status').should('equal', 401)
        })

    })

    // non of this should be available for VEH clients
    describe('the admin endpoints', () => {

        let bToken
        const NEW_MSI = '2144213242'

        before(()=> {
            cy.resetDB()
            cy.getToken(SEED.VEH[0], 'veh').its('body.token').then((t) => bToken = t)
        })

        it('return unauthorized for adding token', () => {
            cy.adminAddToken(bToken, SEED.VEH[1], 'veh', false)
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

        it('return unauthorized for adding mec mapping', () => {
            cy.adminAddMec(bToken, [{
                'mec': '192.168.0.1',
                'cell': ['123214'], 
                'ta': ['4324234'],
                }], false).its('status').should('equal', 401)
        })

        it('return unauthorized for removing mec mapping', () => {
            cy.adminDeleteMec(bToken, SEED.MEC[0], false).its('status').should('equal', 401)
        })

        it('return unauthorized for deleting account', () => {
            cy.adminDelAcct(bToken, SEED.VEH[1], 'veh', 'verizon', false)
                .its('status').should('equal', 401)
        })

        it('return unauthorized for revoking token', () => {
            cy.adminRevoke(bToken, bToken, 'veh', false).its('status').should('equal', 401)
        })

    })

    // non of this should be available for VEH clients
    describe('the sw/admin endpoints', () => {

        let bToken
        const ENTITYID = '1234'
        before(()=> {
            cy.resetDB()
            cy.getToken(SEED.VEH[0], 'veh').its('body.token').then((t) => bToken = t)
        })

        it('return unauthorized for listing tokens', () => {
            cy.adminListToken(bToken, false)
                .its('status').should('equal', 401)
        })

        it('return unauthorized for mapping entityid', () => {
            cy.mapEntity(bToken, bToken, 'veh', ENTITYID, 
                SEED.MEC[0], false).its('status').should('equal', 401)
        })

        it('return unauthorized for validating token', () => {
            cy.validateToken(bToken, bToken, 'veh', 
                ENTITYID, SEED.MEC[0], false).its('status').should('equal', 401)
        })

        it('return unauthorized for deleting entityid', () => {
            cy.deleteEntity(bToken, bToken, 'veh', ENTITYID, 
                SEED.MEC[0], false).its('status').should('equal', 401)
        })

        it('return unauthorized for revoking token', () => {
            cy.revoke(bToken, bToken, 'veh', false).its('status').should('equal', 401)
        })

    })

})