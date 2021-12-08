const magento = require('../lib/magento');
const magentoBulk = require('../lib/magento-bulk');

const secondsElapsedSince = require("../lib/secondsElapsedSince");
const wait = require("../lib/wait");

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

    async setupVariations(relationships) {
        const start = process.hrtime();
        const bulk_uuid = await this._linkVariations(relationships)

        await this._isBulkRequestComplete(bulk_uuid);

        console.log(`Retrieved children - took ${secondsElapsedSince(start)}s.`);
        return 'Linking success!';
    }

    async _isBulkRequestComplete(bid) {
        console.log('Checking bulk relation request:', bid);

        const uri = `/bulk/${bid}/status`;

        const {
            data: {
                operations_list
            }
        } = await magento.get(uri);

        const isDone = !operations_list.some((op) => op.status === 4);
        if (!isDone) {
            await wait(10000);
            return await this._isBulkRequestComplete(bid);
        }

        return isDone;
    }
}

module.exports = new RelationManager();
