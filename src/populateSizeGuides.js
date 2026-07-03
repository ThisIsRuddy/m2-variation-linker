const fs = require('fs');
const path = require('path');

const secondsElapsedSince = require('./lib/secondsElapsedSince');
const writeJSONFile = require('./lib/writeJSONFile');
const { parseProductFile, updateProduct } = require('./operations/productContent');
const { cleanContent, findBlock, upsertBlock } = require('./operations/productSizeGuide');

// For each products/*.md marked `reviewed` that has a ## size_guide block:
//   1. upsert its CMS block (identifier size_guide_*, content = the block HTML),
//   2. write the returned block id into the file's size_guide_option_id,
//   3. set the product's `size_guide` attribute to that block id.
// DRY_RUN=1 reports what it would do (incl. create vs update) without writing.

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

// Record the minted block id back into the file's size_guide_option_id line.
const writeOptionId = (file, id) => {
    const p = path.join(PRODUCTS_DIR, file);
    const t = fs.readFileSync(p, 'utf8');
    fs.writeFileSync(p, t.replace(/^size_guide_option_id:.*$/m, `size_guide_option_id: ${id}`));
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
            results.push({ file, sku, ok: true, skipped: 'status' });
            continue;
        }

        const content = cleanContent(parsed.size_guide || '');
        const identifier = parsed.size_guide_identifier;
        const title = parsed.size_guide_title;

        if (!identifier || !title || !content) {
            const why = !identifier
                ? 'missing size_guide_identifier'
                : !title
                  ? 'missing size_guide_title'
                  : 'empty ## size_guide block';
            console.log(`SKIP  ${sku}\t(${why})`);
            results.push({ file, sku, ok: true, skipped: why });
            continue;
        }

        try {
            if (DRY_RUN) {
                const existing = await findBlock(identifier);
                console.log(
                    `DRY   ${sku}\twould ${existing ? `update block #${existing.id}` : 'create block'} ${identifier} (${content.length} chars) and set size_guide`,
                );
                results.push({ file, sku, ok: true, dryRun: true, identifier });
                continue;
            }

            const { id, created } = await upsertBlock({ identifier, title, content });
            writeOptionId(file, id);
            await updateProduct(sku, [{ attribute_code: 'size_guide', value: String(id) }]);
            console.log(
                `OK    ${sku}\t${created ? 'created' : 'updated'} block #${id} ${identifier}, size_guide=${id}`,
            );
            results.push({ file, sku, ok: true, blockId: id, created, identifier });
        } catch (err) {
            console.log(`FAIL  ${sku}\t${errMsg(err)}`);
            results.push({ file, sku, ok: false, error: errMsg(err) });
        }
    }

    const summary = results.reduce(
        (acc, r) => {
            if (r.skipped) acc.skipped++;
            else if (r.ok) acc.done++;
            else acc.failed++;
            return acc;
        },
        { total: results.length, done: 0, skipped: 0, failed: 0, dryRun: DRY_RUN },
    );

    await writeJSONFile(
        'SizeGuideReport.json',
        { summary, results },
        'Saved the size-guide report ./temp/SizeGuideReport.json',
    );

    console.log(`\nSize-guide populate - took ${secondsElapsedSince(start)}s.`);
    console.log(JSON.stringify(summary, null, 2));
};

execute()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
