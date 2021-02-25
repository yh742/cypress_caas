import { MQTT_URL } from "./const"

const URL = 'http://' + MQTT_URL 

Cypress.Commands.add('mqttConnect', (EntityID, Token, ID, failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: URL + `/connect`,
        method: "POST",
        body: {
            EntityID,
            Token,
            ID
        }
    })
})

Cypress.Commands.add('mqttPublish', (EntityID, Token, ID, Message, Topic, failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: URL + `/connect/clients/publish`,
        method: "POST",
        body: {
            Message,
            Topic,
            EntityID,
            Token,
            ID
        }
    })
})

Cypress.Commands.add('mqttReset', (failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: URL + `/flush`,
        method: "POST",
    })
})

Cypress.Commands.add('mqttListConnected', (failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: URL + `/connect/clients`,
        method: "GET",

    })
})

Cypress.Commands.add('mqttListDisconnected', (failOnStatusCode = true) => {
    return cy.request({
        failOnStatusCode: failOnStatusCode,
        url: URL + `/disconnect/clients`,
        method: "GET",
    })
})