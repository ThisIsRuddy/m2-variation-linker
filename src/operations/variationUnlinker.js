const { api, bulk } = require('../lib/magento');
const secondsElapsedSince = require('../lib/secondsElapsedSince');
const waitForBulkRequest = require('../lib/waitForBulkRequest');
const writeJSONFile = require('../lib/writeJSONFile');

/**
 * Resets configurable parents back to plain simple products. Two bulk steps:
 *   1. remove every configurable option from each parent
 *   2. convert each parent's product type to "simple"
 *
 * @param {string[]} parentSkus
 */

const getExistingOptions = async (parentSku) => {
    console.log('Fetching options:', parentSku);
    const { data } = await api.get(`/configurable-products/${parentSku}/options/all`);
    return data.map((option) => ({ sku: parentSku, id: option.id }));
};

const removeOptions = async (parentSkus) => {
    const start = process.hrtime();

    const perParent = await Promise.all(parentSkus.map(getExistingOptions));
    const payload = perParent.flat();
    await writeJSONFile(
        'UnlinkOptionsPayload.json',
        payload,
        'Saved the payload for unlinking options ./temp/UnlinkOptionsPayload.json',
    );

    console.log('Removing options:', payload.length);
    const { data } = await bulk.delete('/configurable-products/bySku/options/byId', {
        data: payload,
    });
    console.log(`Bulk options request sent - took ${secondsElapsedSince(start)}s.`);

    const response = await waitForBulkRequest(data.bulk_uuid);
    await writeJSONFile(
        'UnlinkOptionsResponse.json',
        response,
        'Saved the response from unlinking options ./temp/UnlinkOptionsResponse.json',
    );
};

const convertToSimple = async (parentSkus) => {
    const start = process.hrtime();

    const payload = parentSkus.map((sku) => ({ product: { sku, type_id: 'simple' } }));
    await writeJSONFile(
        'ConvertItemsPayload.json',
        payload,
        'Saved the payload for converting items ./temp/ConvertItemsPayload.json',
    );

    console.log('Converting parents to simple:', parentSkus.length);
    const { data } = await bulk.post('/products', payload);
    console.log(`Bulk convert request sent - took ${secondsElapsedSince(start)}s.`);

    const response = await waitForBulkRequest(data.bulk_uuid);
    await writeJSONFile(
        'ConvertItemsResponse.json',
        response,
        'Saved the response from converting items ./temp/ConvertItemsResponse.json',
    );
};

const unlink = async (parentSkus) => {
    await removeOptions(parentSkus);
    await convertToSimple(parentSkus);
};

module.exports = { unlink };
