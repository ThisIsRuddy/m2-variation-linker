const { createClient } = require('./httpClient');

// Two clients sharing the same auth: the synchronous REST API and the
// asynchronous bulk API. Both read config from the environment at load time.
const headers = { Authorization: 'Bearer ' + process.env.MAGE_TOKEN };

const api = createClient({ baseURL: process.env.MAGE_URI + '/rest/V1', headers });
const bulk = createClient({ baseURL: process.env.MAGE_URI + '/rest/async/bulk/V1', headers });

// Admin/global scope ("all" store code). Writes here land on the default/"All
// Store Views" scope so every store view inherits them, rather than creating a
// per-store-view override. Used for media so images aren't duplicated across views.
const admin = createClient({ baseURL: process.env.MAGE_URI + '/rest/all/V1', headers });

module.exports = { api, bulk, admin };
