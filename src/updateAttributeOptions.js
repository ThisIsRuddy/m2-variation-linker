const path = require('path');

const parseCsvFile = require('./lib/parseCsvFile');
const secondsElapsedSince = require('./lib/secondsElapsedSince');
const runAttributeOptions = require('./operations/attributeOptionsBatch');
const { updateOption } = require('./operations/attributes');

const execute = async () => {
    const start = process.hrtime();

    const rows = await parseCsvFile(
        path.resolve(__dirname, '../data/update-attribute-options.csv'),
    );
    console.log('Attribute options to update:', rows.length);

    await runAttributeOptions(rows, (row) =>
        updateOption(
            row.attribute_code,
            row.sort_order,
            row.label,
            row.front_label,
            row.value,
            row.option_id,
        ),
    );

    console.log(`Finished! - time taken: ${secondsElapsedSince(start)}s.`);
};

execute()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
