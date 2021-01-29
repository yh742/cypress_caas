// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add("resetDB", () => {

    // Created a http://verizon.sentacaconsulting.com/test/resetdb
    // 	⁃	Reset clears all the tables of all data
    // 	⁃	Also runs initdb which seeds the database
    // 	⁃	Sets up 4 mecs ( 194.0.0.1 to 194.0.0.4 ) these are just text values can be anything
    // 	⁃	Sets up 10 cells  ( 311-480-770300 through 309 ) 
    // 	⁃	Sets up admin msisdn = 1234
    // 	⁃	Sets up sw msisdn = 9999
    // 	⁃	Sets up veh msisdn ( 17814140001, 18008001111,19009001111 ) 

    return cy.request('/test/resetdb')
})

Cypress.Commands.add('getToken', (msisdn, entity, failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: '/caas/v1/token',
        method: "POST",
        body: {
            msisdn: msisdn,
            entity: entity,
        }
    })
})

function BearerRequests(url, method, bToken, body, failOnStatus, qs = {}) {
    return cy.request({
        failOnStatusCode: failOnStatus,
        url: url,
        method: method, 
        body: body,
        qs: qs,
        'auth': {
            'bearer': bToken
        }
    })
}

Cypress.Commands.add('refreshToken', (bearerToken, failOnStatus = true) => {
    return BearerRequests('/caas/v1/token/refresh', 'POST', 
        bearerToken, {}, failOnStatus)
})

Cypress.Commands.add('validateToken', 
    (bearerToken, token, entity, entityid, mec, failOnStatus = true) => {
        return BearerRequests('/caas/v1/token/validate', 'POST',
            bearerToken, {
                token,
                entity,
                entityid,
                mec
            }, failOnStatus)
    }
)

Cypress.Commands.add('mapEntity', 
    (bearerToken, token, entity, entityid, mec, failOnStatus = true) => {
        return BearerRequests('/caas/v1/token/entity', 'POST',
            bearerToken, {
                token,
                entity,
                entityid,
                mec
            }, failOnStatus)
    }
)

Cypress.Commands.add('deleteEntity', 
    (bearerToken, token, entity, entityid, mec, failOnStatus = true) => {
        return BearerRequests('/caas/v1/token/entity/delete', 'POST',
            bearerToken, {
                token,
                entity,
                entityid,
                mec
            }, failOnStatus)
    }
)

Cypress.Commands.add('revoke', (bearerToken, token, entity, failOnStatus = true) => {
    return BearerRequests('/caas/v1/token/revoke', 'POST',
        bearerToken, {
            token,
            entity,
        }, failOnStatus)
})

// Admin token commands
Cypress.Commands.add('adminAddToken', (bearerToken, msisdn, entity, failOnStatus = true) => {
    return BearerRequests('/caas/v1/admin/token', 'POST',
        bearerToken, {
            msisdn,
            entity,
        }, failOnStatus)
})

Cypress.Commands.add('adminRevoke', (bearerToken, token, entity, failOnStatus = true) => {
    return BearerRequests('/caas/v1/admin/token/revoke', 'POST',
        bearerToken, {
            token,
            entity,
        }, failOnStatus)
})

Cypress.Commands.add('adminListToken', (bearerToken, failOnStatus = true, qs = {}) => {
    return BearerRequests('/caas/v1/admin/token/list', 'GET',
        bearerToken, {}, failOnStatus, qs)
})


// Admin account related commands
Cypress.Commands.add('adminListAcct', (bearerToken, failOnStatus = true, qs = {}) => {
    return BearerRequests('/caas/v1/admin/account/list', 'GET',
        bearerToken, {}, failOnStatus, qs)
})

Cypress.Commands.add('adminAddAcct', 
    (bearerToken, msisdn, entity, org, failOnStatus = true) => {
        return BearerRequests('/caas/v1/admin/accounts/add', 'POST', 
            bearerToken, {msisdn, entity, org}, failOnStatus)
})

Cypress.Commands.add('adminDelAcct', 
    (bearerToken, msisdn, entity, org, failOnStatus = true) => {
        return BearerRequests('/caas/v1/admin/accounts/delete', 'POST', 
            bearerToken, {msisdn, entity, org}, failOnStatus)
})

Cypress.Commands.add('adminUpdateAcct', 
    (bearerToken, msisdn, entity, org, failOnStatus = true) => {
        return BearerRequests(`/caas/v1/admin/accounts/update`, 'POST', 
            bearerToken, {msisdn, entity, org}, failOnStatus )
    }
)

// Admin SCEF/location related commands
Cypress.Commands.add('adminListSub', (bearerToken, failOnStatus = true, qs={}) => {
    return BearerRequests(`/caas/v1/admin/location/subscription/list`, 'GET', 
        bearerToken, {}, failOnStatus, qs)
})

Cypress.Commands.add('adminListMec', (bearerToken, failOnStatus = true) => {
    return BearerRequests(`/caas/v1/admin/location/mec/list`, 'GET', 
        bearerToken, {}, failOnStatus)
})

Cypress.Commands.add('adminDeleteMec', (bearerToken, mec, failOnStatus = true) => {
    return BearerRequests(`/caas/v1/admin/location/mec/delete`, 'POST', 
        bearerToken, {mec}, failOnStatus)
})

Cypress.Commands.add('adminUpdateMec', (bearerToken, mecList, failOnStatus = true) => {
    return BearerRequests(`/caas/v1/admin/location/mec/update`, 'POST', 
        bearerToken, mecList, failOnStatus)
})

