const path = require('path');
const csv = require('csvtojson');

const secondsElapsedSince = require('./lib/secondsElapsedSince');
const productsManager = require('./classes/ProductsManager');
const optionsManager = require('./classes/OptionsManager');
const relationManager = require('./classes/RelationManager');

const parseCSVFromFile = async (filePath) => {
    const actualFilePath = path.resolve(__dirname + '/' + filePath);
    return csv().fromFile(actualFilePath);
}

const getRelationsFromFile = async () => {
    const rows = await parseCSVFromFile('../data/link.csv');

    const results = rows.reduce((acc, curr) => {

        const parentSku = curr['parent_sku'];

        if (!acc[parentSku]) acc[parentSku] = {
            parentSku,
            children: []
        };

        acc[parentSku].children.push(curr.sku);

        return acc;
    }, {});

    const values = Object.values(results);
    console.log('Parsed relations:', values.length);

    return values;
}

const getAttributesFromFile = async () => {
    const rows = await parseCSVFromFile('../data/attributes.csv');

    const results = rows.map((r) => r.attribute_code);
    console.log('Parsed variation attributes:', results.join(', '));

    return results;
}

const execute = async () => {
    const start = process.hrtime();

    const relationships = await getRelationsFromFile();
    const variationAttrCodes = await getAttributesFromFile();

    await productsManager.convertItems(relationships);
    await optionsManager.link(variationAttrCodes, relationships);
    await relationManager.link(relationships);

    console.log(`Finished! - time taken: ${secondsElapsedSince(start)}s.`);
}

execute()
    .catch(err => console.error(err))
    .finally(() => process.exit(0));
