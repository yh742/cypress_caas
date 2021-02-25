import { SCEF_URL } from "./const"

const URL = 'http://' + SCEF_URL

Cypress.Commands.add('scefTriggerHandover', (sub, cellID, failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: URL + `/${sub}`,
        method: "PUT",
        body: {
            cellID
        }
    })
})