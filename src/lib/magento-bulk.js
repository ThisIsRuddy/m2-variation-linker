const axios = require('axios');

const instance = axios.create({
    baseURL: process.env.MAGE_URI + '/rest/async/bulk/V1',
    headers: {
        'Authorization': 'Bearer ' + process.env.MAGE_BULK_TOKEN
    }
});

module.exports = instance;
