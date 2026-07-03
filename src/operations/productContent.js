const fsPromises = require('fs').promises;

const { api } = require('../lib/magento');

/**
 * Parses a product content file (see products/_template.md): YAML-ish frontmatter
 * between `---` fences, then HTML in fenced ```html blocks under `## description`,
 * `## short_description`, `## size_guide` headings.
 *
 * Dependency-free on purpose (no YAML lib): we only need a handful of scalar
 * frontmatter keys plus the fenced HTML bodies.
 */

const PLACEHOLDER = /\[Insert (Short )?Description\]/i;

// Read one scalar frontmatter key. Quoted values win; otherwise an inline
// ` # comment` (YAML style) is stripped. Multi-line/array values are ignored -
// none of the keys we read are arrays.
const readKey = (frontmatter, key) => {
    const m = new RegExp(`^${key}:[ \\t]*(.*)$`, 'm').exec(frontmatter);
    return m ? scalar(m[1]) : '';
};

// Extract the ```html block that follows the `## <name>` heading.
const readSection = (body, name) => {
    const heading = new RegExp(`^##\\s+${name}\\s*$`, 'm').exec(body);
    if (!heading) return '';
    const after = body.slice(heading.index + heading[0].length);
    const next = after.search(/^##\s+/m);
    const slice = next === -1 ? after : after.slice(0, next);
    const fence = /```html\s*\n([\s\S]*?)\n```/.exec(slice);
    return fence ? fence[1].trim() : '';
};

// Read a scalar off one YAML-ish line ("key: value"): quoted value wins,
// otherwise an inline comment is stripped. Shared with the images block.
const scalar = (raw) => {
    const quote = raw.match(/^\s*(['"])([\s\S]*?)\1/);
    if (quote) return quote[2].trim();
    return raw.replace(/(^|\s)#.*$/, '').trim();
};

// Parse the `images:` frontmatter list into [{role, source, label}]. Kept
// dependency-free (targets exactly the shape in _template.md), so no YAML lib.
const parseImages = (frontmatter) => {
    const lines = frontmatter.split('\n');
    const start = lines.findIndex((l) => /^images:\s*$/.test(l));
    if (start === -1) return [];

    const entries = [];
    let cur = null;
    for (let i = start + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue;
        if (!/^\s/.test(line)) break; // dedent -> next top-level key

        const item = line.match(/^\s*-\s*(.*)$/); // list item start
        if (item) {
            if (cur) entries.push(cur);
            cur = {};
            const kv = item[1].match(/^([a-z_]+):\s*(.*)$/);
            if (kv) cur[kv[1]] = scalar(kv[2]);
            continue;
        }
        const kv = line.match(/^\s+([a-z_]+):\s*(.*)$/); // continuation key
        if (kv && cur) cur[kv[1]] = scalar(kv[2]);
    }
    if (cur) entries.push(cur);
    return entries.filter((e) => e.source);
};

const parseProductFile = async (filePath) => {
    const text = await fsPromises.readFile(filePath, 'utf8');
    const fm = /^---\s*\n([\s\S]*?)\n---\s*\n/.exec(text);
    const frontmatter = fm ? fm[1] : '';
    const body = fm ? text.slice(fm[0].length) : text;

    return {
        sku: readKey(frontmatter, 'sku'),
        status: readKey(frontmatter, 'status'),
        meta_title: readKey(frontmatter, 'meta_title'),
        meta_description: readKey(frontmatter, 'meta_description'),
        size_guide_option_id: readKey(frontmatter, 'size_guide_option_id'),
        size_guide_identifier: readKey(frontmatter, 'size_guide_identifier'),
        size_guide_title: readKey(frontmatter, 'size_guide_title'),
        description: readSection(body, 'description'),
        short_description: readSection(body, 'short_description'),
        size_guide: readSection(body, 'size_guide'),
        images: parseImages(frontmatter),
    };
};

/**
 * Turn a parsed file into the custom_attributes to write. Only fields that carry
 * a real value are included, so a partial file never blanks an existing field.
 * `size_guide` is a SELECT attribute - we send the option id, never the HTML
 * (the HTML block is the brief for creating the size chart in admin).
 */
const buildCustomAttributes = (parsed) => {
    const attrs = [];
    const add = (code, value) => {
        if (value && String(value).trim() !== '' && !PLACEHOLDER.test(value)) {
            attrs.push({ attribute_code: code, value: String(value) });
        }
    };
    add('description', parsed.description);
    add('short_description', parsed.short_description);
    add('meta_title', parsed.meta_title);
    add('meta_description', parsed.meta_description);
    add('size_guide', parsed.size_guide_option_id);
    return attrs;
};

// Validate at the trust boundary before any write.
const validate = (parsed) => {
    if (!parsed.sku) return 'missing sku';
    if (!parsed.description || PLACEHOLDER.test(parsed.description))
        return 'missing/placeholder description';
    return null;
};

const updateProduct = async (sku, customAttributes) => {
    const payload = { product: { sku, custom_attributes: customAttributes } };
    await api.put(`/products/${encodeURIComponent(sku)}`, payload);
};

module.exports = { parseProductFile, buildCustomAttributes, validate, updateProduct };
