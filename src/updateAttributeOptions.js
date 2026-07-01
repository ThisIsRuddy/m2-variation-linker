const path = require('path');
const csv = require('csvtojson');

const secondsElapsedSince = require('./lib/secondsElapsedSince');
const attributesRepo = require('./classes/AttributesRepository');

const parseCSVFromFile = async (filePath) => {
    const actualFilePath = path.resolve(__dirname + '/' + filePath);
    return csv().fromFile(actualFilePath);
}

const execute = async () => {
    const start = process.hrtime();

    const attributeOptions = await parseCSVFromFile('../data/update-attribute-options.csv');
    console.log('Attribute options to update:', attributeOptions.length);

    const results = {
        errors: [],
        success: 0,
        error: 0,
        total: attributeOptions.length,
    }
    for (const option of attributeOptions) {
        try {
            console.log('Saving colour option:', option.attribute_code, option.label, option.value);
            await attributesRepo._updateAttributeOption(
                option.attribute_code,
                option.sort_order,
                option.label,
                option.front_label,
                option.value,
                option.option_id
            );
            results.success++;
        } catch (e) {
            console.error(e.message);
            results.error++;
            results.errors.push({
                option,
                error: e.message,
            })
        }
    }

    console.log(JSON.stringify(results, null, 2));
    console.log(`Finished! - time taken: ${secondsElapsedSince(start)}s.`);
}

execute()
    .catch(err => console.error(err))
    .finally(() => process.exit(0));
