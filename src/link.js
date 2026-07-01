const path = require('path');

const parseCsvFile = require('./lib/parseCsvFile');
const secondsElapsedSince = require('./lib/secondsElapsedSince');
const variationLinker = require('./operations/variationLinker');

const getRelationsFromFile = async () => {
    // Default to data/link.csv, but allow overriding per batch without
    // clobbering the file, e.g. LINK_FILE=data/link-juzo.csv yarn link:prod
    const linkFile = process.env.LINK_FILE
        ? path.resolve(process.cwd(), process.env.LINK_FILE)
        : path.resolve(__dirname, '../data/link.csv');
    console.log('Link file:', linkFile);

    const rows = await parseCsvFile(linkFile);
    const byParent = rows.reduce((acc, row) => {
        const parentSku = row['parent_sku'];
        if (!acc[parentSku]) acc[parentSku] = { parentSku, children: [] };
        acc[parentSku].children.push(row.sku);
        return acc;
    }, {});

    const relationships = Object.values(byParent);
    console.log('Parsed relations:', relationships.length);
    return relationships;
};

const getAttributesFromFile = async () => {
    const rows = await parseCsvFile(path.resolve(__dirname, '../data/attributes.csv'));
    const attrCodes = rows.map((row) => row.attribute_code);
    console.log('Parsed variation attributes:', attrCodes.join(', '));
    return attrCodes;
};

const execute = async () => {
    const start = process.hrtime();

    const relationships = await getRelationsFromFile();
    const variationAttrCodes = await getAttributesFromFile();

    // One synchronous save per parent (type + options + links together).
    // See variationLinker for why this replaces the old 3-pass bulk pipeline.
    await variationLinker.link(variationAttrCodes, relationships);

    console.log(`Finished! - time taken: ${secondsElapsedSince(start)}s.`);
};

execute()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
