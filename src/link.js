const path = require('path');
const parseCsvFile = require('./lib/parseCsvFile');

const secondsElapsedSince = require('./lib/secondsElapsedSince');
const variationLinker = require('./classes/VariationLinker');

const parseCSVFromFile = async (filePath) => {
    const actualFilePath = path.resolve(__dirname + '/' + filePath);
    return parseCsvFile(actualFilePath);
}

const getRelationsFromFile = async () => {
    // Default to data/link.csv, but allow overriding per batch without
    // clobbering the file, e.g. LINK_FILE=data/link-juzo.csv yarn link:prod
    const linkFile = process.env.LINK_FILE
        ? path.resolve(process.cwd(), process.env.LINK_FILE)
        : path.resolve(__dirname, '../data/link.csv');
    const rows = await parseCsvFile(linkFile);
    console.log('Link file:', linkFile);

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

    // One synchronous save per parent (type + options + links together).
    // See VariationLinker for why this replaces the old 3-pass bulk pipeline.
    await variationLinker.link(variationAttrCodes, relationships);

    console.log(`Finished! - time taken: ${secondsElapsedSince(start)}s.`);
}

execute()
    .catch(err => console.error(err))
    .finally(() => process.exit(0));
