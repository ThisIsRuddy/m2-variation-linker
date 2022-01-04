const magento = require('../lib/magento');
const magentoBulk = require('../lib/magento-bulk');
const toChunks = require("../lib/toChunks");
const writeJSONFile = require("../lib/writeJSONFile");
const secondsElapsedSince = require("../lib/secondsElapsedSince");
const waitForBulkRequest = require("../lib/waitForBulkRequest");
const attributesRepo = require("../classes/AttributesRepository");

class OptionsManager {

    async _getSimpleProducts(parentSku, skus) {
        const start = process.hrtime();
        const uri = `/products/?searchCriteria[filterGroups][1][filters][0][field]=sku&searchCriteria[filterGroups][1][filters][0][value]=${skus.join(',')}&searchCriteria[filterGroups][1][filters][0][conditionType]=in&fields=items[id,sku,name,custom_attributes]`;

        console.log('Fetching children:', parentSku, skus.length);
        const {data: {items}} = await magento.get(uri);

        console.log(`Retrieved children - took ${secondsElapsedSince(start)}s.`);
        return items;
    }

    async _batchGetSimpleProducts(parentSku, skus) {
        const chunks = toChunks(skus, 2000);
        console.log('Children chunks:', chunks.length);
        const jobs = chunks.map(async (skusChunk) => await this._getSimpleProducts(parentSku, skusChunk));
        const results = await Promise.all(jobs);
        return results.flat();
    }

    async _getUniqueOptionsPayload(attrCodes, parentSku, simples) {

        const allOptions = simples.map(({custom_attributes}) => {
            return custom_attributes.filter(attr => attrCodes.includes(attr.attribute_code));
        }).flat();

        let unique = {};
        for (const option of allOptions) {
            const attrCode = option.attribute_code;
            const attribute = await attributesRepo.get(attrCode);

            if (!unique[attrCode])
                unique[attrCode] = {
                    sku: parentSku,
                    option: {
                        attribute_id: attribute.attribute_id,
                        label: attribute.default_frontend_label,
                        position: attribute.position,
                        values: []
                    }
                };

            if (!unique[attrCode].option.values.some((o => o.value_index === parseInt(option.value))))
                unique[attrCode].option.values.push({
                    value_index: parseInt(option.value)
                });
        }

        return Object.values(unique);
    }

    async _getOptionsPayload(attrCodes, relationships) {
        const {parentSku, children} = relationships;
        const simples = await this._batchGetSimpleProducts(parentSku, children);
        return await this._getUniqueOptionsPayload(attrCodes, parentSku, simples);
    }

    async _getOptionsPayloads(attrCodes, relationships) {
        const jobs = relationships.map(async (r) => await this._getOptionsPayload(attrCodes, r));
        const results = await Promise.all(jobs);
        return results.flat();
    }

    async _linkOptions(attrCodes, relationships) {
        const uri = `/configurable-products/bySku/options`;
        const payload = await this._getOptionsPayloads(attrCodes, relationships);

        await writeJSONFile("LinkOptionsPayload.json", payload, "Saved the payload for linking options ./temp/LinkOptionsPayload.json");

        console.log('Posting options:', relationships.length);
        const {data: {bulk_uuid}} = await magentoBulk.post(uri, payload);

        return bulk_uuid;
    }

    async _getExistingOptions(parentSku) {
        const start = process.hrtime();
        const uri = `/configurable-products/${parentSku}/options/all`;

        console.log('Fetching options:', parentSku);
        const {data} = await magento.get(uri);

        console.log(`Retrieved options - took ${secondsElapsedSince(start)}s -`, data.length);
        return data;
    }

    async _getUnlinkPayload(parentSkus) {

        const jobs = parentSkus.map(async sku => {
            const options = await this._getExistingOptions(sku);
            return options.map(o => ({
                sku: sku,
                id: o.id
            }));
        })

        const payloads = await Promise.all(jobs);
        return payloads.flat();
    }

    async _unlinkOptions(parentSkus) {
        const uri = `/configurable-products/bySku/options/byId`;
        const payload = await this._getUnlinkPayload(parentSkus);

        await writeJSONFile("UnlinkOptionsPayload.json", payload, "Saved the payload for unlinking options ./temp/UnlinkOptionsPayload.json");

        console.log('Removing options:', payload.length);
        const {data: {bulk_uuid}} = await magentoBulk.delete(uri, {
            data: payload
        });

        return bulk_uuid;
    }

    async link(attrCodes, relationships) {
        const start = process.hrtime();

        const bulk_uuid = await this._linkOptions(attrCodes, relationships);
        console.log(`Bulk options request sent - took ${secondsElapsedSince(start)}s.`);

        const response = await waitForBulkRequest(bulk_uuid);
        await writeJSONFile("LinkOptionsResponse.json", response, "Saved the response from linking options ./temp/LinkOptionsResponse.json");
    }

    async unlink(parentSkus) {
        const start = process.hrtime();

        const bulk_uuid = await this._unlinkOptions(parentSkus);
        console.log(`Bulk options request sent - took ${secondsElapsedSince(start)}s.`);

        const response = await waitForBulkRequest(bulk_uuid);
        await writeJSONFile("UnlinkOptionsResponse.json", response, "Saved the response from unlinking options ./temp/UnlinkOptionsResponse.json");
    }
}

module.exports = new OptionsManager();
