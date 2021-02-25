import { CRS_URL } from "./const"

const URL = 'http://' + CRS_URL
const POST_STR = {"BSM": {"MsgSourceInfo":[{"EntityTypeOpt": "VEH", "EntitySubtypeOpt": "PSGR"}], "MsgFormat": "UPER","Sampled": false, "DistanceOpt": 50}, "ClientInformation": {"EntityType": "VEH", "EntitySubtype": "PSGR", "VendorID": "FORD"}}

Cypress.Commands.add('crsRegister', (bToken, failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: URL + '/registration',
        method: "POST",
        body: POST_STR,
        'auth': {
            'bearer': bToken
        }
    })
})

Cypress.Commands.add('crsDeregister', (bToken, entityid, failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: URL + '/registration/VEH/' + entityid,
        method: "DELETE",
        'auth': {
            'bearer': bToken
        }
    })
})