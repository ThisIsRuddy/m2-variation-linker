const fs = require('fs');
const path = require('path');

const secondsElapsedSince = require('./lib/secondsElapsedSince');
const writeJSONFile = require('./lib/writeJSONFile');
const { parseProductFile } = require('./operations/productContent');
const { fetchImage, getExistingMedia, uploadImage } = require('./operations/productMedia');

// Uploads the images listed in each products/*.md (status `reviewed`) to the
// configurable parent's media gallery. The first `role: base` image becomes the
// main image/small_image/thumbnail; the rest are gallery-only.
//
// Media POST is additive, so this is idempotent PER IMAGE: each listed image is
// uploaded under a deterministic name (`{slug}-{n}.{ext}`), and any image already
// present on the product (matched by that name) is skipped. So re-running after
// adding more images to a file uploads only the new ones - no duplicate hero.
// FORCE=1 re-uploads every listed image regardless of what's already there.
// DRY_RUN=1 downloads + validates the sources without writing to Magento.

const PRODUCTS_DIR = path.resolve(__dirname, '../products');
const DRY_RUN = !!process.env.DRY_RUN;
const FORCE = !!process.env.FORCE;

const slug = (sku) =>
    sku
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

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
            results.push({ file, sku, ok: true, skipped: 'status' });
            continue;
        }
        if (!parsed.images.length) {
            console.log(`SKIP  ${sku}\t(no images listed)`);
            results.push({ file, sku, ok: true, skipped: 'no-images' });
            continue;
        }

        try {
            // Deterministic upload names are the media basename (Magento stores
            // `/a/b/{name}`), so an image already on the product is one whose
            // `{slug}-{n}` base is present. FORCE=1 ignores this and re-uploads all.
            const present = FORCE
                ? new Set()
                : new Set(
                      (await getExistingMedia(sku)).map((e) =>
                          path.basename(e.file || '').replace(/\.[^.]+$/, ''),
                      ),
                  );

            const uploaded = [];
            let alreadyPresent = 0;
            for (let i = 0; i < parsed.images.length; i++) {
                const img = parsed.images[i];
                const label = (img.label || '').trim();
                if (!label)
                    throw new Error(
                        `image ${i + 1} has no label (add "label:" in the images block)`,
                    );

                const base = `${slug(sku)}-${i + 1}`;
                if (present.has(base)) {
                    console.log(`SKIP  ${sku}\t[${i + 1}] ${base} already present`);
                    alreadyPresent++;
                    continue;
                }

                const types = img.role === 'base' ? ['image', 'small_image', 'thumbnail'] : [];
                const fetched = await fetchImage(img.source);
                const name = `${base}.${fetched.ext}`;

                if (DRY_RUN) {
                    console.log(
                        `DRY   ${sku}\t[${i + 1}] ${fetched.mime} ${(fetched.bytes / 1024).toFixed(0)}KB -> ${name} types=[${types.join(',')}]`,
                    );
                } else {
                    const id = await uploadImage(sku, {
                        base64: fetched.base64,
                        mime: fetched.mime,
                        name,
                        label,
                        types,
                        position: i + 1,
                    });
                    console.log(`OK    ${sku}\t[${i + 1}] uploaded id ${id} (${name})`);
                }
                uploaded.push({ position: i + 1, name, role: img.role, bytes: fetched.bytes });
            }

            if (!uploaded.length && alreadyPresent) {
                console.log(`SKIP  ${sku}\tall ${alreadyPresent} image(s) already present`);
                results.push({ file, sku, ok: true, skipped: 'has-all-media' });
            } else {
                results.push({ file, sku, ok: true, dryRun: DRY_RUN, images: uploaded });
            }
        } catch (err) {
            console.log(`FAIL  ${sku}\t${errMsg(err)}`);
            results.push({ file, sku, ok: false, error: errMsg(err) });
        }
    }

    const summary = results.reduce(
        (acc, r) => {
            if (r.skipped) acc.skipped++;
            else if (r.ok) acc.uploaded++;
            else acc.failed++;
            return acc;
        },
        { total: results.length, uploaded: 0, skipped: 0, failed: 0, dryRun: DRY_RUN },
    );

    await writeJSONFile(
        'MediaReport.json',
        { summary, results },
        'Saved the media report ./temp/MediaReport.json',
    );

    console.log(`\nMedia populate - took ${secondsElapsedSince(start)}s.`);
    console.log(JSON.stringify(summary, null, 2));
};

execute()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
