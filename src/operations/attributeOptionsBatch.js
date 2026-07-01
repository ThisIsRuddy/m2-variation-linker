/**
 * Applies one attribute-option operation to every row of a parsed CSV,
 * collecting per-row successes and errors into a summary (one bad row never
 * aborts the batch).
 *
 * @param {Array<Record<string, string>>} rows
 * @param {(row: Record<string, string>) => Promise<void>} apply
 */
const runAttributeOptions = async (rows, apply) => {
    const results = { errors: [], success: 0, error: 0, total: rows.length };

    for (const row of rows) {
        try {
            console.log('Saving attribute option:', row.attribute_code, row.label, row.value);
            await apply(row);
            results.success++;
        } catch (e) {
            console.error(e.message);
            results.error++;
            results.errors.push({ option: row, error: e.message });
        }
    }

    console.log(JSON.stringify(results, null, 2));
    return results;
};

module.exports = runAttributeOptions;
