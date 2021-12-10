const magentoBulk = require('../lib/magento-bulk');

const secondsElapsedSince = require("../lib/secondsElapsedSince");
const waitForBulkRequest = require("../lib/waitForBulkRequest");

class RelationManager {

    async _linkVariations(relationships) {
        const uri = `/configurable-products/bySku/child`;

        const payload = relationships.map(({parentSku, children}) => {
            return children.map((cs) => ({
                sku: parentSku,
                childSku: cs
            }));
        }).flat();

        console.log('Linking children:', payload.length);
        const {data: {bulk_uuid}} = await magentoBulk.post(uri, payload);

        return bulk_uuid;
    }

    async link(relationships) {
        const start = process.hrtime();
        const bulk_uuid = await this._linkVariations(relationships)

        await waitForBulkRequest(bulk_uuid);

        console.log(`Retrieved children - took ${secondsElapsedSince(start)}s.`);
        return 'Linking success!';
    }
}

module.exports = new RelationManager();
