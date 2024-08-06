const path = require('path');
const csv = require('csvtojson');

const secondsElapsedSince = require('./lib/secondsElapsedSince');
const optionsManager = require('./classes/OptionsManager');
const productsManager = require("./classes/ProductsManager");

const parseCSVFromFile = async (filePath) => {
    const actualFilePath = path.resolve(__dirname + '/' + filePath);
    return csv().fromFile(actualFilePath);
}

const getParentsFromFile = async () => {
    const parents = await parseCSVFromFile('../data/unlink.csv');
    console.log('Parents to reset:', parents.length);
    return parents;
}

const execute = async () => {
    const start = process.hrtime();

    const parents = await getParentsFromFile();
    await optionsManager.unlink(parents.map(r => r['parent_sku']));
    await productsManager.convertItems('simple', parents);

    console.log(`Finished! - time taken: ${secondsElapsedSince(start)}s.`);
}

execute()
    .catch(err => console.error(err))
    .finally(() => process.exit(0));
