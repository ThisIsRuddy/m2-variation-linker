const fsPromises = require('fs').promises;

/**
 * Dependency-free CSV parser used to replace `csvtojson`. It covers the subset
 * of RFC 4180 the project's data files rely on, matching csvtojson's defaults:
 *
 *   - a leading UTF-8 BOM is stripped
 *   - `\r\n`, `\r` and `\n` line endings are all accepted
 *   - fields may be wrapped in double quotes to contain commas or newlines,
 *     and an escaped quote is written as `""`
 *   - unquoted field values are trimmed (csvtojson's `trim: true` default)
 *   - every value is returned as a string (no type coercion)
 *   - fully blank lines are skipped
 *
 * @param {string} text raw CSV text
 * @returns {string[][]} rows of string fields (first row is the header)
 */
const parseCsv = (text) => {
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM

    const rows = [];
    let record = [];
    let field = '';
    let quoted = false; // was the current field wrapped in quotes?
    let inQuotes = false; // are we currently inside a quoted section?
    const len = text.length;

    const endField = () => {
        record.push(quoted ? field : field.trim());
        field = '';
        quoted = false;
    };
    const endRecord = () => {
        endField();
        // Skip blank lines (a record that is a single empty field).
        if (!(record.length === 1 && record[0] === '')) rows.push(record);
        record = [];
    };

    for (let i = 0; i < len; i++) {
        const char = text[i];

        if (inQuotes) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } // escaped quote
                else inQuotes = false;
            } else {
                field += char;
            }
            continue;
        }

        if (char === '"') {
            inQuotes = true;
            quoted = true;
        } else if (char === ',') endField();
        else if (char === '\n') endRecord();
        else if (char === '\r') {
            if (text[i + 1] === '\n') i++;
            endRecord();
        } else field += char;
    }

    // Flush a trailing record when the file doesn't end in a newline.
    if (field !== '' || record.length > 0) endRecord();

    return rows;
};

/**
 * Reads a CSV file and returns an array of objects keyed by the header row,
 * mirroring `csvtojson().fromFile(path)`.
 *
 * @param {string} filePath absolute path to the CSV file
 * @returns {Promise<Array<Record<string, string>>>}
 */
const parseCsvFile = async (filePath) => {
    const text = await fsPromises.readFile(filePath, 'utf8');
    const rows = parseCsv(text);
    if (rows.length === 0) return [];

    const headers = rows[0];
    return rows.slice(1).map((row) => {
        const entry = {};
        headers.forEach((header, index) => {
            entry[header] = row[index] !== undefined ? row[index] : '';
        });
        return entry;
    });
};

module.exports = parseCsvFile;
