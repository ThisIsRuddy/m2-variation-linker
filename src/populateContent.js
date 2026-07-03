const fs = require('fs');
const path = require('path');

const secondsElapsedSince = require('./lib/secondsElapsedSince');
const writeJSONFile = require('./lib/writeJSONFile');
const {
    parseProductFile,
    buildCustomAttributes,
    validate,
    updateProduct,
} = require('./operations/productContent');

// Writes description / short_description / meta_title / meta_description (and the
// size_guide option id, once set) for every products/*.md marked `reviewed`.
// Files whose name starts with `_` (templates, manifest, _reference/) are ignored.
// DRY_RUN=1 prints what would be sent without touching Magento.

const PRODUCTS_DIR = path.resolve(__dirname, '../products');
const DRY_RUN = !!process.env.DRY_RUN;

const errMsg = (err) => {
    if (err && err.response) {
        const data = err.response.data;
        return data && data.message
            ? `${err.response.status}: ${data.message}`
            : `${err.response.status}: ${err.response.statusText || 'request failed'}`;
    }
    return err && err.message ? err.message : String(err);
};

const execute = async () => {
    const start = process.hrtime();

    const files = fs
        .readdirSync(PRODUCTS_DIR)
        .filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md')
        .sort();

    console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Product files: ${files.length}`);

    const results = [];
    for (const file of files) {
        const parsed = await parseProductFile(path.join(PRODUCTS_DIR, file));
        const sku = parsed.sku || file;

        if (parsed.status !== 'reviewed') {
            console.log(`SKIP  ${file}\t(status: ${parsed.status || 'none'})`);
            results.push({ file, sku, ok: true, skipped: true, status: parsed.status });
            continue;
        }

        const problem = validate(parsed);
        if (problem) {
            console.log(`FAIL  ${file}\t${problem}`);
            results.push({ file, sku, ok: false, error: problem });
            continue;
        }

        const attrs = buildCustomAttributes(parsed);
        const codes = attrs.map((a) => a.attribute_code).join(', ');

        try {
            if (DRY_RUN) {
                console.log(`DRY   ${sku}\twould set: ${codes}`);
            } else {
                await updateProduct(sku, attrs);
                console.log(`OK    ${sku}\tset: ${codes}`);
            }
            results.push({ file, sku, ok: true, dryRun: DRY_RUN, attributes: codes });
        } catch (err) {
            console.log(`FAIL  ${sku}\t${errMsg(err)}`);
            results.push({ file, sku, ok: false, error: errMsg(err) });
        }
    }

    const summary = results.reduce(
        (acc, r) => {
            if (r.skipped) acc.skipped++;
            else if (r.ok) acc.written++;
            else acc.failed++;
            return acc;
        },
        { total: results.length, written: 0, skipped: 0, failed: 0, dryRun: DRY_RUN },
    );

    await writeJSONFile(
        'ContentReport.json',
        { summary, results },
        'Saved the content report ./temp/ContentReport.json',
    );

    console.log(`\nContent populate - took ${secondsElapsedSince(start)}s.`);
    console.log(JSON.stringify(summary, null, 2));
};

execute()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
