export const REGEX = {
    RFC3339: /^([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([\+|\-]([01][0-9]|2[0-3]):[0-5][0-9]))$/,
    HOST: /^(?:(?:(?:[a-zA-z\-]+)\:\/{1,3})?(?:[a-zA-Z0-9])(?:[a-zA-Z0-9\-\.]){1,61}(?:\.[a-zA-Z]{2,})+|\[(?:(?:(?:[a-fA-F0-9]){1,4})(?::(?:[a-fA-F0-9]){1,4}){7}|::1|::)\]|(?:(?:[0-9]{1,3})(?:\.[0-9]{1,3}){3}))(?:\:[0-9]{1,5})?$/,
    TOKEN: /[A-Za-z0-9=+/]+\.[A-Za-z0-9=+/]+/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/,
}

export const REGEX_TABLE = {
    'token': REGEX.TOKEN,
    'mec': REGEX.HOST,
    'requested': REGEX.RFC3339,
    'issued': REGEX.RFC3339,
    'expires': REGEX.RFC3339,
    'subscriptionID': REGEX.UUID
}

export const INVALID_TOKEN = 'MzQwNjc0Mjg2NzAzMTE3ODE1NTY='+
    '.NmI2ZDRlM2NkZjk2MGMyYjdhZmRkY2YyYjIxODhiNDcwMzYzYzYxMzU4YTg4YmRjMTk5MTZmOThlYTA1YjQ0NA=='

export const SEED = {
    ADM: ['1234'],
    SW: ['9999'],
    VEH: ['17814140001', '18008001111', '19009001111'],
    MEC: ['132.197.249.120', '194.0.0.2', '194.0.0.3', '194.0.0.4'],
}

    // Created a http://verizon.sentacaconsulting.com/test/resetdb
    // 	⁃	Reset clears all the tables of all data
    // 	⁃	Also runs initdb which seeds the database
    // 	⁃	Sets up 4 mecs ( 194.0.0.1 to 194.0.0.4 ) these are just text values can be anything
    // 	⁃	Sets up 10 cells  ( 311-480-770300 through 309 ) 
    // 	⁃	Sets up admin msisdn = 1234
    // 	⁃	Sets up sw msisdn = 9999
    // 	⁃	Sets up veh msisdn ( 17814140001, 18008001111,19009001111 ) 