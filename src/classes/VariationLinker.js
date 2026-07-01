const magento = require('../lib/magento');
const toChunks = require('../lib/toChunks');
const secondsElapsedSince = require('../lib/secondsElapsedSince');
const writeJSONFile = require('../lib/writeJSONFile');
const attributesRepo = require('./AttributesRepository');

/**
 * VariationLinker
 *
 * Links simple products to a configurable parent using SYNCHRONOUS, per-parent
 * saves rather than the async bulk queue.
 *
 * Why: the bulk API drops every operation onto a message queue that multiple
 * consumers drain in parallel with no ordering and no per-product locking.
 * Both the "options" and "addChild" steps do a full read-modify-write of the
 * *same* parent product, so when two operations for one parent are processed
 * concurrently you get lost updates and unique-key collisions on
 * catalog_product_super_attribute — surfacing as intermittent "duplicate
 * variation option" errors that clear up on re-run.
 *
 * Here every parent is handled by exactly ONE synchronous save that sets the
 * type, all configurable options and all child links together. Different
 * parents run concurrently (bounded pool), but two writes never target the
 * same parent, so the race cannot happen.
 */
class VariationLinker {

    constructor() {
        // How many DIFFERENT parents to process at once. Parents are
        // independent, so this is safe; tune to taste / server capacity.
        this.concurrency = 5;
    }

    _errMsg(err) {
        if (err && err.response) {
            const data = err.response.data;
            return (data && data.message)
                ? `${err.response.status}: ${data.message}`
                : `${err.response.status}: ${err.response.statusText || 'request failed'}`;
        }
        return err && err.message ? err.message : String(err);
    }

    /**
     * Fetch the child simple products (id + variation attribute values).
     * Chunked to keep the IN(...) list out of URL-length trouble.
     */
    async _getSimpleProducts(skus) {
        const chunks = toChunks(skus, 100);
        const items = [];
        for (const chunk of chunks) {
            const value = encodeURIComponent(chunk.join(','));
            const uri = `/products/`
                + `?searchCriteria[filterGroups][0][filters][0][field]=sku`
                + `&searchCriteria[filterGroups][0][filters][0][value]=${value}`
                + `&searchCriteria[filterGroups][0][filters][0][conditionType]=in`
                + `&fields=items[id,sku,custom_attributes]`;
            const {data} = await magento.get(uri);
            items.push(...(data.items || []));
        }
        return items;
    }

    /**
     * Build the configurable_product_options array (one entry per variation
     * attribute, with the union of value_indexes across all children).
     */
    async _buildOptions(attrCodes, simples) {
        const unique = {};

        for (const {custom_attributes} of simples) {
            const varAttrs = (custom_attributes || [])
                .filter(a => attrCodes.includes(a.attribute_code));

            for (const attr of varAttrs) {
                const code = attr.attribute_code;

                if (!unique[code]) {
                    const meta = await attributesRepo.get(code);
                    unique[code] = {
                        attribute_id: meta.attribute_id,
                        label: meta.default_frontend_label,
                        position: meta.position,
                        values: [],
                        _seen: new Set(),
                    };
                }

                const valueIndex = parseInt(attr.value, 10);
                if (!Number.isNaN(valueIndex) && !unique[code]._seen.has(valueIndex)) {
                    unique[code]._seen.add(valueIndex);
                    unique[code].values.push({value_index: valueIndex});
                }
            }
        }

        // Strip the internal _seen helper before returning.
        return Object.values(unique).map(({_seen, ...option}) => option);
    }

    /**
     * Link a single parent in ONE synchronous save: type + options + links.
     */
    async _linkParent(attrCodes, {parentSku, children}) {
        const start = process.hrtime();

        const simples = await this._getSimpleProducts(children);

        const foundBySku = new Set(simples.map(s => s.sku));
        const missing = children.filter(c => !foundBySku.has(c));

        const options = await this._buildOptions(attrCodes, simples);
        const links = simples.map(s => s.id);

        const payload = {
            product: {
                sku: parentSku,
                type_id: 'configurable',
                extension_attributes: {
                    configurable_product_options: options,
                    configurable_product_links: links,
                },
            },
        };

        await magento.put(`/products/${encodeURIComponent(parentSku)}`, payload);

        return {
            parentSku,
            optionCount: options.length,
            linkedCount: links.length,
            requested: children.length,
            missing,
            seconds: Number(secondsElapsedSince(start)),
        };
    }

    /**
     * Bounded-concurrency pool: at most `concurrency` parents in flight.
     */
    async _runPool(relationships, worker) {
        const results = new Array(relationships.length);
        let cursor = 0;

        const runners = Array.from(
            {length: Math.min(this.concurrency, relationships.length)},
            async () => {
                while (cursor < relationships.length) {
                    const index = cursor++;
                    const relation = relationships[index];
                    try {
                        results[index] = {ok: true, ...(await worker(relation))};
                    } catch (err) {
                        results[index] = {
                            ok: false,
                            parentSku: relation.parentSku,
                            requested: relation.children.length,
                            error: this._errMsg(err),
                        };
                    }
                    const r = results[index];
                    const status = r.ok
                        ? `OK    ${r.linkedCount}/${r.requested} linked, ${r.optionCount} opts${r.missing.length ? `, MISSING ${r.missing.length}` : ''}`
                        : `FAIL  ${r.error}`;
                    console.log(`[${index + 1}/${relationships.length}] ${r.parentSku}\t${status}`);
                }
            }
        );

        await Promise.all(runners);
        return results;
    }

    async link(attrCodes, relationships) {
        const start = process.hrtime();
        console.log(`Linking ${relationships.length} parents (concurrency ${this.concurrency})...`);

        const results = await this._runPool(relationships, (r) => this._linkParent(attrCodes, r));

        const summary = results.reduce((acc, r) => {
            if (r.ok) {
                acc.ok++;
                if (r.missing && r.missing.length) acc.withMissingChildren++;
            } else {
                acc.failed++;
                acc.errors[r.error] = (acc.errors[r.error] || 0) + 1;
            }
            return acc;
        }, {total: results.length, ok: 0, failed: 0, withMissingChildren: 0, errors: {}});

        await writeJSONFile('LinkReport.json', {summary, results},
            'Saved the link report ./temp/LinkReport.json');

        console.log(`\nVariation linking - took ${secondsElapsedSince(start)}s.`);
        console.log(JSON.stringify(summary, null, 2));

        return summary;
    }
}

module.exports = new VariationLinker();
