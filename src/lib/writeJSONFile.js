const fsPromises = require('fs').promises;

const writeJSONFile = async (fileName, data, msg) => {
    const json = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    await fsPromises.writeFile('./temp/' + fileName, json);

    if (msg) console.log(msg);
}

module.exports = writeJSONFile;
