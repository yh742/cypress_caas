const CGW_URL = 'http://132.197.249.120:8080'


Cypress.Commands.add('cgwClearRequests', (failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: CGW_URL + '/cgw/v1/debug/requests',
        method: "DELETE",
    })
})

Cypress.Commands.add('cgwGetRequests', (failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: CGW_URL + '/cgw/v1/debug/requests',
        method: "GET",
    })
})

Cypress.Commands.add('cgwFlush', (failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: CGW_URL + '/cgw/v1/debug/flush',
        method: "POST",
    })
})

Cypress.Commands.add('cgwSetToken', (token, failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: CGW_URL + '/cgw/v1/debug/token',
        method: "GET",
        qs: {
            token,
        }
    })
})

Cypress.Commands.add('cgwSetMEC', (mec, failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: CGW_URL + '/cgw/v1/debug/mec',
        method: "GET",
        qs: {
            mec,
        }
    })
})

Cypress.Commands.add('cgwMapToken', (entity, entityid, token, failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: CGW_URL + '/cgw/v1/token',
        method: "POST",
        body: {
            entity,
            entityid,
            token
        }
    })
})

Cypress.Commands.add('cgwValidateToken', (entity, entityid, token, failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: CGW_URL + '/cgw/v1/token/validate',
        method: "POST",
        body: {
            entity,
            entityid,
            token
        }
    })
})

Cypress.Commands.add('cgwRefreshToken', (entity, entityid, token, failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: CGW_URL + '/cgw/v1/token/refresh',
        method: "POST",
        body: {
            entity,
            entityid,
            token
        }
    })
})

Cypress.Commands.add('cgwDisconnect', (entity, entityid, reasonCode, failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: CGW_URL + '/cgw/v1/disconnect',
        method: "POST",
        body: {
            entity,
            entityid,
            reasonCode
        }
    })
})

