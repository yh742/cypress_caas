const SCEF_URL = 'http://132.197.249.120:30200/vzmode_monte/subscriptions'

Cypress.Commands.add('scefTriggerHandover', (sub, cellID, failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: SCEF_URL + `/${sub}`,
        method: "PUT",
        body: {
            cellID
        }
    })
})