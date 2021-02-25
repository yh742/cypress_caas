
import { CGW_URL, SEED } from "../../support/const"

let bearerToken
// make sure resets to the actual location of the cgw instance
function reset() {
    // change the mec to the cgw location
    cy.resetDB()
    cy.getToken(SEED.ADM[0], 'admin').its('body').then((body) => {
        bearerToken = body.token
        cy.adminDeleteMec(bearerToken, SEED.MEC[0], false).its('status').should('equal', 204)
        cy.adminAddMec(bearerToken, [{
            'mec': CGW_URL,
            'cell': ['311-480-770300', '311-480-770301', '311-480-770302', '311-480-770303', '311-480-770304', '311-480-770305', '311-480-770306'], 
        }], false).its('status').should('equal', 200)
    })
}

describe("for VEH clients", ()=> {

    before(() => {
        // check if enough seed value exists for testing
        if (!SEED.VEH || SEED.SW.length <= 0 || 
                SEED.ADM.length <= 0 || SEED.VEH.length <= 0 ) {
            this.skip()
        }
    })

    describe("for registration endpoints", ()=> {
        let token
        let entityID
        before(()=>{
            reset()
            cy.mqttReset()
            cy.cgwFlush()
            cy.getToken(SEED.SW[0], 'sw').its('body').then((body) => {
                cy.cgwSetToken(body.token)
            })
            cy.getToken(SEED.VEH[0], 'veh').its('body').then((body) => {
                token = body.token
                cy.cgwSetMEC(body.mec)
            })
            // cy.getToken(SEED.VEH[1], 'veh').its('body').then((body) => {
            //     token = body.token
            //     cy.cgwSetMEC(body.mec)
            // })
        })

        it("register forbidden with an invalid token", ()=> {
            cy.crsRegister('123123', false).then((response)=> {
                expect(response.status).to.equal(401)
            })
        })

        it("registers OK with a token", ()=> {
            cy.crsRegister(token, false).then((response)=> {
                expect(response.status).to.equal(201)
                expect(response.body).to.have.property('ID')
                entityID = response.body.ID
            })
        })

        it("registers conflict with same token", ()=> {
            cy.crsRegister(token, false).then((response)=> {
                expect(response.status).to.equal(409)
            })
        })

        it("Unauthorized to connect to MQTT", ()=> {
            cy.mqttConnect(entityID.toString(), token + "1", "123", false).its('status').should('equal', 401)
        })

        it("OK to connect to MQTT", ()=> {
            cy.mqttConnect(entityID.toString(), token, "123").its('status').should('equal', 200)
            cy.mqttListConnected().its('body').should('include', 'VEH-' + entityID + "-" + 123)
        })
        
    })


    describe("for publishing messages", ()=> {

        let token
        let entityID
        let assignedMEC
        before(()=>{
            reset()
            cy.mqttReset()
            cy.cgwFlush()
            cy.getToken(SEED.SW[0], 'sw').its('body').then((body) => {
                cy.cgwSetToken(body.token)
            })
        })

        beforeEach(()=>{
            cy.getToken(SEED.VEH[0], 'veh').its('body').then((body) => {
                token = body.token
                assignedMEC = body.mec
                cy.cgwSetMEC(body.mec)
                cy.crsRegister(token, false).then((response)=> {
                    entityID = response.body.ID
                    cy.mqttConnect(entityID.toString(), token, "123")
                })
            })
        })

        it("OK to publish to client topics", ()=> {
            cy.mqttPublish(entityID.toString(), token, "123", "test message 1", 
                "VZCV2X/2/IN/VEH/PSGR/FORD/" + entityID.toString() + "/UPER/BSM")
        })

        it("not OK to publish to invalid client topics", ()=> {
            cy.mqttPublish(entityID.toString(), token, "123", "test message 2", 
                "VZCV2X/2/IN/VEH/PSGR/FORD/432/UPER/BSM")
            cy.wait(1000)
            cy.mqttListDisconnected().its('body').then((body)=>{
                let key = 'VEH-' + entityID + "-" + 123
                expect(body).to.have.property(key).to.equal(135)
            })
        })

        it("not OK to publish to out topics", ()=> {
            cy.mqttPublish(entityID.toString(), token, "123", "test message 4", 
                "VZCV2X/2/OUT/VEH/PSGR/FORD/" + entityID.toString() + "/UPER/BSM")
            cy.wait(1000)
            cy.mqttListDisconnected().its('body').then((body)=>{
                let key = 'VEH-' + entityID + "-" + 123
                expect(body).to.have.property(key).to.equal(135)
            })
        })

        it("not OK to publish to regional topics", ()=> {
            cy.mqttPublish(entityID.toString(), token, "123", "test message 5", "REGIONAL/1/VEH/PSGR/FORD")
            cy.wait(1000)
            cy.mqttListDisconnected().its('body').then((body)=>{
                let key = 'VEH-' + entityID + "-" + 123
                expect(body).to.have.property(key).to.equal(135)
            })
        })
    })

    // how do we test idle disconnection?
    describe("for disconnection scenarios", ()=> {
        let token
        let entityID
        before(()=>{
            reset()
            cy.mqttReset()
            cy.cgwFlush()
            cy.getToken(SEED.SW[0], 'sw').its('body').then((body) => {
                cy.cgwSetToken(body.token)
            })
        })

        let assignedMEC
        beforeEach(()=> {
            cy.getToken(SEED.VEH[0], 'veh').its('body').then((body) => {
                token = body.token
                assignedMEC = body.mec
                cy.cgwSetMEC(body.mec)
                cy.crsRegister(token, false).then((response)=> {
                    entityID = response.body.ID
                    cy.mqttConnect(entityID.toString(), token, "123")
                })
            })
        })

        it("disconnects with code 135 when manually deregistration occurs", ()=> {
            cy.crsDeregister(token, entityID).its('status').should('equal', 204)
            cy.wait(7000)
            cy.mqttListDisconnected().its('body').then((body)=>{
                let key = 'VEH-' + entityID + "-" + 123
                expect(body).to.have.property(key).to.equal(135)
            })
            
        })

        it('disocnnects using a re-authenticate when grabbing a new token', ()=> {
            // get token again to trigger reauthenticate
            cy.getToken(SEED.VEH[0], 'veh').its('body').then(() => {
                cy.wait(1000)
                cy.mqttListDisconnected().its('body').then((body)=>{
                    let key = 'VEH-' + entityID + "-" + 123
                    expect(body).to.have.property(key).to.equal(140)
                })
            })
        })

        it('disocnnects when token expires', ()=> {
            // get token again to trigger reauthenticate
            cy.expireToken(SEED.VEH[0]).then(() => {
                cy.wait(7000)
                cy.mqttListDisconnected().its('body').then((body)=>{
                    let key = 'VEH-' + entityID + "-" + 123
                    expect(body).to.have.property(key).to.equal(160)
                })
            })
        })

        it('disconnects using a handover when mec change occurs', ()=> {
            cy.adminListMec(bearerToken, false).then((response) => {
                // need to find a new cell tower not assigned to current MEC
                console.log(response.body.mecs)
                const newMEC = Object.keys(response.body.mecs).filter(mec => mec != assignedMEC)[0]
                const cellID = response.body.mecs[newMEC].cell[0]

                // need to find subscription ID
                let subID
                cy.adminListSub(bearerToken, false, {'msisdn': SEED.VEH[0]}).its('body').then((body)=> {
                    subID = body.subscriptions[SEED.VEH[0]].subscriptionID

                    // trigger a handover to a new cell tower
                    cy.scefTriggerHandover(subID, cellID)
                    cy.wait(7000)
                    cy.mqttListDisconnected().its('body').then((body)=>{
                        let key = 'VEH-' + entityID + "-" + 123
                        expect(body).to.have.property(key).to.equal(156)
                    })
                })
            })
        })
    })
})