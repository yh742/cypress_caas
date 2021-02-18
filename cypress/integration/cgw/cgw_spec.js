import { REGEX_TABLE, SEED } from "../../support/const"

describe('for VZMODE', () => {

    before(() => {
        // check if enough seed value exists for testing
        if (!SEED.VEH || SEED.SW.length <= 0 || 
                SEED.ADM.length <= 0 || SEED.VEH.length <= 0 ) {
            this.skip()
        }
    })

    describe('the cgw token endpoint', () => {
        let tokenMap = {}
        const ENTITYID = '1234'
        before(()=>{
            cy.resetDB()
            cy.cgwFlush()
            cy.getToken(SEED.SW[0], 'sw').its('body').then((body) => {
                tokenMap.sw = body.token
                cy.cgwSetToken(body.token)
            })
            // assume the veh client grabbed a token already
            cy.getToken(SEED.VEH[0], 'veh').its('body').then((body) => {
                tokenMap.veh = body.token
                cy.cgwSetMEC(body.mec)
            })
            cy.getToken(SEED.ADM[0], 'admin').its('body').then((body) => tokenMap.admin = body.token)
        })

        it('return not found for mapping token <-> entityid with invalid json fields', () => {
            // mismatch token and entity type
            for (const entity in tokenMap) {
                let badEntity = entity == "veh"? "sw": entity == "sw"? "admin": "veh"
                cy.cgwMapToken(
                    badEntity,
                    ENTITYID,
                    tokenMap[entity],
                    false
                ).its('status').should('equal', 404)
            }
        })

        it("return OK or conflict when mapping entities", () => {
            // try mapping the entities
            for (const entity in tokenMap) {
                cy.cgwMapToken(
                    entity,
                    ENTITYID,
                    tokenMap[entity],
                )
            }
            
            // this should return 409 if we try to remap the entities
            for (const entity in tokenMap) {
                cy.cgwMapToken(
                    entity,
                    ENTITYID,
                    tokenMap[entity],
                    false
                ).should((response)=> {
                    expect(response.status).to.equal(409)
                    expect(response.body.entityid).to.equal(ENTITYID)
                })
            }
        })
    })

    describe("the cgw validate endpoint", () => {
        let tokenMap = {}
        const ENTITYID = '1234'
        before(()=>{
            cy.resetDB()
            cy.cgwFlush()
            cy.getToken(SEED.SW[0], 'sw').its('body').then((body) => {
                tokenMap.sw = body.token
                cy.cgwSetToken(body.token)
            })
            // assume the veh client grabbed a token already
            cy.getToken(SEED.VEH[0], 'veh').its('body').then((body) => {
                tokenMap.veh = body.token
                cy.cgwSetMEC(body.mec)
            })
            cy.getToken(SEED.ADM[0], 'admin').its('body').then((body) => {
                tokenMap.admin = body.token
                for (const entity in tokenMap) {
                    cy.cgwMapToken(
                        entity,
                        ENTITYID,
                        tokenMap[entity],
                    )
                }
            })
        })

        it('returns forbidden if validation fails', ()=> {
            for (const entity in tokenMap) {
                let badEntity = entity == "veh"? "sw": entity == "sw"? "admin": "veh"
                cy.cgwValidateToken(
                    badEntity,
                    ENTITYID,
                    tokenMap[entity],
                    false,
                ).its('status').should('equal', 403)
            }
            for (const entity in tokenMap) {
                cy.cgwValidateToken(
                    entity,
                    '123',
                    tokenMap[entity],
                    false,
                ).its('status').should('equal', 403)
            }
        })

        it('returns OK for validating entities', ()=> {
            for (const entity in tokenMap) {
                cy.cgwValidateToken(
                    entity,
                    ENTITYID,
                    tokenMap[entity],
                ).its('status').should('equal', 200)
            }
        })
    })

    describe('the disconnect endpoint', ()=> {
        const ENTITYID = '1234'
        const DEREGISTRATION = 135
        const IDLE = 152

        before(()=>{
            cy.resetDB()
            cy.cgwFlush()
            cy.getToken(SEED.SW[0], 'sw').its('body').then((body) => {
                cy.cgwSetToken(body.token)
            })
        })

        let currentToken
        beforeEach(()=> {
            cy.getToken(SEED.VEH[0], 'veh').its('body').then((body) => {
                currentToken = body.token
                cy.cgwSetMEC(body.mec)
                cy.cgwMapToken('veh', ENTITYID, body.token)
            })
        })

        it('returns not found if entityid cannot be located', ()=> {
            cy.cgwDisconnect('veh', '2345', DEREGISTRATION, false)
                .its('status').should('equal', 404)
            cy.cgwDisconnect('sw', ENTITYID, DEREGISTRATION, false)
                .its('status').should('equal', 404)
        })

        it('returns OK for disconnecting due to deregistration', ()=> {
            cy.cgwDisconnect('veh', ENTITYID, DEREGISTRATION)
                .its('status').should('equal', 200)
            // entityid should show be empty since its disassociated
            cy.visit('/showdb')
            cy.contains(currentToken).parent().children().eq(4)
                .invoke('text').should('equal', '')
        })

        it('returns OK for disconnecting due to idle', ()=> {
            cy.cgwDisconnect('veh', ENTITYID, IDLE)
                .its('status').should('equal', 200)
            // entityid should show be empty since its disassociated
            cy.visit('/showdb')
            cy.contains(currentToken).parent().children().eq(4)
                .invoke('text').should('equal', '')
        })

    })

})

describe('for CAAS', () => {
    describe("the cgw refresh endpoint", () => {
        const ENTITYID = '1234'
        let currentToken
        before(()=>{
            cy.resetDB()
            cy.cgwFlush()
            cy.getToken(SEED.SW[0], 'sw').its('body').then((body) => {
                cy.cgwSetToken(body.token)
            })
            cy.getToken(SEED.VEH[0], 'veh').its('body').then((body) => {
                currentToken = body.token
                cy.cgwSetMEC(body.mec)
                cy.cgwMapToken('veh', ENTITYID, body.token)
            })
        })

        it('should issue a refresh call to the cgw', ()=> {
            cy.refreshToken(currentToken).then((response) => {
                // check response and json body
                expect(response.status).to.eq(200)
                for (const prop in response.body) {
                    expect(response.body).property(prop).to.match(REGEX_TABLE[prop])
                }

                // check entityid exists on new token in /showdb
                cy.visit('/showdb')
                cy.contains(response.body.token).parent().
                    children().eq(4).invoke('text').should('equal', ENTITYID)

                // check if cache is updated on cgw
                cy.cgwValidateToken(
                    'veh',
                    ENTITYID,
                    response.body.token,
                ).its('status').should('equal', 200)
            })
        })
    })

    describe('the disconnect endpoint', ()=> {
        const ENTITYID = '1234'

        let bearerToken
        before(()=> {
            cy.resetDB()
            cy.cgwFlush()
            cy.getToken(SEED.SW[0], 'sw').its('body').then((body) => {
                cy.cgwSetToken(body.token)
            })
            cy.getToken(SEED.ADM[0], 'admin').its('body').then((body) => {
                bearerToken = body.token
                cy.adminAddAcct(bearerToken, SEED.EXP_VEH, 'veh', 'verizon')
            })
        })

        let currentToken
        let assignedMEC
        beforeEach(()=> {
            cy.cgwClearRequests()
            cy.getToken(SEED.VEH[0], 'veh').its('body').then((body) => {
                currentToken = body.token
                assignedMEC = body.mec
                cy.cgwSetMEC(body.mec)
                cy.cgwMapToken('veh', ENTITYID, body.token)
            })
        })

        it.only('disocnnects using a re-authenticate when grabbing a new token', ()=> {
            // get token again to trigger reauthenticate
            cy.getToken(SEED.VEH[0], 'veh').its('body').then(() => {
                // check that caas has revoke token due to reauthentication
                cy.visit('/showdb')
                cy.contains(currentToken).parent().children().eq(4)
                    .invoke('text').should('equal', 'Reauthenticate')

                //check that the old token is wiped from cache
                cy.cgwValidateToken(
                    'veh',
                    ENTITYID,
                    currentToken,
                    false,
                ).its('status').should('equal', 403)
            })

            cy.cgwGetRequests().then((response)=>{
                let reqs = response.body.filter(req => Object.keys(req) == "/cgw/v1/disconnect")
                expect(reqs).to.have.lengthOf(1)
                expect(reqs[0]["/cgw/v1/disconnect"]).to.have.property('reasonCode').to.equal(140)
            })
        })

        it.only('no disconnections when only cell tower changes', ()=> {
            cy.adminListMec(bearerToken, false).then((response) => {
                // need to find a new cell tower not assigned to current MEC
                const randInt = Math.floor(Math.random() * Math.floor(response.body.mecs[assignedMEC].cell.length))
                const cellID = response.body.mecs[assignedMEC].cell[randInt]

                // need to find subscription ID
                let subID
                cy.adminListSub(bearerToken, false, {'msisdn': SEED.VEH[0]}).its('body').then((body)=> {
                    subID = body.subscriptions[SEED.VEH[0]].subscriptionID
                    console.log(subID, cellID)
                    // trigger a handover to a new cell tower
                    cy.scefTriggerHandover(subID, cellID)

                    //check that the old token is wiped from cache
                    cy.cgwValidateToken(
                        'veh',
                        ENTITYID,
                        currentToken,
                        false,
                    ).its('status').should('equal', 200)
                    })
            })
        })

        it.only('disconnects using a handover when mec change occurs', ()=> {
            cy.adminListMec(bearerToken, false).then((response) => {
                // need to find a new cell tower not assigned to current MEC
                const newMEC = SEED.MEC.filter(mec => mec != assignedMEC)[0]
                const cellID = response.body.mecs[newMEC].cell[0]

                // need to find subscription ID
                let subID
                cy.adminListSub(bearerToken, false, {'msisdn': SEED.VEH[0]}).its('body').then((body)=> {
                    subID = body.subscriptions[SEED.VEH[0]].subscriptionID

                    // trigger a handover to a new cell tower
                    cy.scefTriggerHandover(subID, cellID)

                    //check that the old token is wiped from cache
                    cy.cgwValidateToken(
                        'veh',
                        ENTITYID,
                        currentToken,
                        false,
                    ).its('status').should('equal', 403)
                    })

                    // check that caas has revoke token due to reauthentication
                    cy.visit('/showdb')
                    cy.contains(currentToken).parent().children().eq(2)
                        .invoke('text').should('equal', newMEC)
                    cy.cgwGetRequests().then((response)=>{
                        let reqs = response.body.filter(req => Object.keys(req) == "/cgw/v1/disconnect")
                        expect(reqs).to.have.lengthOf(2)
                        expect(reqs[1]["/cgw/v1/disconnect"]).to.have.property('reasonCode').to.equal(156)
                        expect(reqs[1]["/cgw/v1/disconnect"]).to.have.property('nextServer').to.equal(newMEC)
                    })
            })
        })

        // TODO: maybe assign a special token with very short expiration time?
        it('disocnnects when token expires', ()=> {
            // get token again to trigger reauthenticate
            cy.getToken(SEED.EXP_VEH, 'veh').its('body').then((body) => {
                cy.cgwSetMEC(body.mec)
                cy.cgwMapToken('veh', ENTITYID, body.token)
                // cy.wait(6000)
                // // check that caas has revoke token due to reauthentication
                // cy.visit('/showdb')
                // cy.contains(currentToken).parent().children().eq(4)
                //     .invoke('text').should('equal', 'Reauthenticate')

                // //check that the old token is wiped from cache
                // cy.cgwValidateToken(
                //     'veh',
                //     ENTITYID,
                //     currentToken,
                //     false,
                // ).its('status').should('equal', 403)
                cy.cgwGetRequests().then((response)=>{
                    let reqs = response.body.filter(req => Object.keys(req) == "/cgw/v1/disconnect")
                    expect(reqs).to.have.lengthOf(1)
                    expect(reqs[0]["/cgw/v1/disconnect"]).to.have.property('reasonCode').to.equal(160)
                })
            })
        })
    })
})