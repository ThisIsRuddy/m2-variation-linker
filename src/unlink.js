const path = require('path');
const csv = require('csvtojson');

const secondsElapsedSince = require('./lib/secondsElapsedSince');
const optionsManager = require('./classes/OptionsManager');

const parseCSVFromFile = async (filePath) => {
    const actualFilePath = path.resolve(__dirname + '/' + filePath);
    return csv().fromFile(actualFilePath);
}

const getParentsFromFile = async () => {
    const rows = await parseCSVFromFile('../data/unlink.csv');
    const parents = rows.map((r) => r['parent_sku']);
    console.log('Parents to reset:', parents.length);
    return parents;
}

const execute = async () => {
    const start = process.hrtime();

    const parents = await getParentsFromFile();
    await optionsManager.unlink(parents);

    console.log(`Finished! - time taken: ${secondsElapsedSince(start)}s.`);
}

execute()
    .catch(err => console.error(err))
    .finally(() => process.exit(0));
