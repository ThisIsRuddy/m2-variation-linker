const { createClient } = require('./httpClient');

// Two clients sharing the same auth: the synchronous REST API and the
// asynchronous bulk API. Both read config from the environment at load time.
const headers = { Authorization: 'Bearer ' + process.env.MAGE_TOKEN };

const api = createClient({ baseURL: process.env.MAGE_URI + '/rest/V1', headers });
const bulk = createClient({ baseURL: process.env.MAGE_URI + '/rest/async/bulk/V1', headers });

module.exports = { api, bulk };
