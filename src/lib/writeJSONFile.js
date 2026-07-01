const fsPromises = require('fs').promises;
const path = require('path');

const TEMP_DIR = './temp';

const writeJSONFile = async (fileName, data, msg) => {
    const json = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    await fsPromises.mkdir(TEMP_DIR, { recursive: true });
    await fsPromises.writeFile(path.join(TEMP_DIR, fileName), json);

    if (msg) console.log(msg);
};

module.exports = writeJSONFile;
