const magentoBulk = require('../lib/magento-bulk');
const secondsElapsedSince = require("../lib/secondsElapsedSince");
const waitForBulkRequest = require("../lib/waitForBulkRequest");
const writeJSONFile = require("../lib/writeJSONFile");

class ProductsManager {

    async _getBulkPayload(productType, parentsSkus) {
        return parentsSkus.map(ps => ({
            product: {
                sku: ps,
                type_id: productType
            }
        }));
    }

    async _convertProducts(productType, parentsSkus) {
        const uri = `/products`;
        const payload = await this._getBulkPayload(productType, parentsSkus);

        await writeJSONFile("ConvertItemsPayload.json", payload, "Saved the payload for converting items ./temp/ConvertItemsPayload.json");

        console.log('Posting conversions:', parentsSkus.length);
        const {data: {bulk_uuid}} = await magentoBulk.post(uri, payload);

        return bulk_uuid;
    }

    async convertItems(productType, relationships) {
        const start = process.hrtime();

        const parentsSkus = relationships.map(r => r.parentSku);
        console.log(`Converting parent products to '${productType}': ${parentsSkus.length}`);

        const bulk_uuid = await this._convertProducts(productType, parentsSkus);
        console.log(`Bulk convert products to '${productType}' request sent - took ${secondsElapsedSince(start)}s.`);

        const response = await waitForBulkRequest(bulk_uuid);
        await writeJSONFile("ConvertItemsResponse.json", response, "Saved the response from converting items ./temp/ConvertToConfigurablesResponse.json");
    }
}

module.exports = new ProductsManager();
