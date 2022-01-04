const magentoBulk = require('../lib/magento-bulk');

const secondsElapsedSince = require("../lib/secondsElapsedSince");
const waitForBulkRequest = require("../lib/waitForBulkRequest");
const writeJSONFile = require("../lib/writeJSONFile");

class RelationManager {

    async _linkVariations(relationships) {
        const uri = `/configurable-products/bySku/child`;

        const payload = relationships.map(({parentSku, children}) => {
            return children.map((cs) => ({
                sku: parentSku,
                childSku: cs
            }));
        }).flat();

        await writeJSONFile("LinkVariationsPayload.json", payload, "Saved the payload for linking variations ./temp/LinkVariationsPayload.json");

        console.log('Linking children:', payload.length);
        const {data: {bulk_uuid}} = await magentoBulk.post(uri, payload);

        return bulk_uuid;
    }

    async link(relationships) {
        const start = process.hrtime();
        const bulk_uuid = await this._linkVariations(relationships)

        const response = await waitForBulkRequest(bulk_uuid);
        await writeJSONFile("LinkVariationsResponse.json", response, "Saved the response from linking variations ./temp/LinkVariationsResponse.json");

        console.log(`Retrieved children - took ${secondsElapsedSince(start)}s.`);
        return 'Linking success!';
    }
}

module.exports = new RelationManager();
