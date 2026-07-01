const { createClient } = require('./httpClient');

const instance = createClient({
    baseURL: process.env.MAGE_URI + '/rest/V1',
    headers: {
        'Authorization': 'Bearer ' + process.env.MAGE_TOKEN
    }
});

module.exports = instance;
