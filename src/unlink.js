const path = require('path');

const parseCsvFile = require('./lib/parseCsvFile');
const secondsElapsedSince = require('./lib/secondsElapsedSince');
const variationUnlinker = require('./operations/variationUnlinker');

const getParentSkusFromFile = async () => {
    const rows = await parseCsvFile(path.resolve(__dirname, '../data/unlink.csv'));
    const parentSkus = rows.map((row) => row['parent_sku']);
    console.log('Parents to reset:', parentSkus.length);
    return parentSkus;
};

const execute = async () => {
    const start = process.hrtime();

    const parentSkus = await getParentSkusFromFile();
    await variationUnlinker.unlink(parentSkus);

    console.log(`Finished! - time taken: ${secondsElapsedSince(start)}s.`);
};

execute()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
