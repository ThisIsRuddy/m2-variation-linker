const magento = require('../lib/magento');
const magentoBulk = require('../lib/magento-bulk');

const secondsElapsedSince = require("../lib/secondsElapsedSince");
const toChunks = require("../lib/toChunks");
const wait = require("../lib/wait");
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

            if (!unique[attrCode].option.values.includes(option.value))
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

    async getOptionsPayloads(attrCodes, relationships) {
        const jobs = relationships.map(async (r) => await this._getOptionsPayload(attrCodes, r));
        const results = await Promise.all(jobs);
        return results.flat();
    }

    async _isBulkRequestComplete(bid) {
        console.log('Checking bulk options request:', bid);

        const uri = `/bulk/${bid}/status`;
        const {
            data: {
                operations_list
            }
        } = await magento.get(uri);

        const isDone = !operations_list.some(op => op.status === 4);
        if (!isDone) {
            await wait(10000);
            return await this._isBulkRequestComplete(bid);
        }

        return isDone;
    }

    async linkOptions(attrCodes, relationships) {
        const uri = `/configurable-products/bySku/options`;
        const payload = await this.getOptionsPayloads(attrCodes, relationships);

        console.log('Posting options:', relationships.length);
        const {data: {bulk_uuid}} = await magentoBulk.post(uri, payload);

        return bulk_uuid;
    }

    async setupOptions(attrCodes, relationships) {
        const start = process.hrtime();

        const bulk_uuid = await this.linkOptions(attrCodes, relationships);
        console.log(`Bulk options request sent - took ${secondsElapsedSince(start)}s.`);

        await this._isBulkRequestComplete(bulk_uuid);

        return 'Ready for linking';
    }
}

module.exports = new OptionsManager();
