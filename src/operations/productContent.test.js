const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { parseProductFile, buildCustomAttributes, validate } = require('./productContent');

// Self-check for the product-file parser. Run: node src/operations/productContent.test.js
// Covers the fiddly bits: comment-only frontmatter value, quoted values that
// contain the delimiter, fenced-HTML extraction, and placeholder rejection.

const FIXTURE = `---
sku: TEST-SKU
status: reviewed
meta_title: "Title | Brand"
meta_description: "Desc, with comma # not a comment"
size_guide_identifier: size_guide_test
size_guide_title: "Size Guide: Test"
size_guide_option_id:        # not yet minted
images:
  - role: base
    source: https://example.com/a.jpg?w=720&x=1
    label: "Hero"
  - role: extra
    source: https://example.com/b.png
    label: "Second"
---

## description
\`\`\`html
<p>Hello <b>world</b></p>
\`\`\`

## short_description
\`\`\`html
<ul><li>one</li></ul>
\`\`\`

## size_guide
\`\`\`html
<div>chart</div>
\`\`\`
`;

const run = async () => {
    const file = path.join(os.tmpdir(), `pc-test-${process.pid}.md`);
    fs.writeFileSync(file, FIXTURE);
    try {
        const p = await parseProductFile(file);

        assert.strictEqual(p.sku, 'TEST-SKU');
        assert.strictEqual(p.status, 'reviewed');
        assert.strictEqual(p.meta_title, 'Title | Brand');
        // quoted value keeps its '#' and comma; not treated as a comment
        assert.strictEqual(p.meta_description, 'Desc, with comma # not a comment');
        // comment-only value must resolve to empty (the bug that shipped size_guide)
        assert.strictEqual(p.size_guide_option_id, '');
        assert.strictEqual(p.description, '<p>Hello <b>world</b></p>');
        assert.strictEqual(p.short_description, '<ul><li>one</li></ul>');
        assert.strictEqual(p.size_guide, '<div>chart</div>');
        assert.strictEqual(p.size_guide_identifier, 'size_guide_test');
        assert.strictEqual(p.size_guide_title, 'Size Guide: Test');

        // images block parses into ordered objects; query string in URL survives
        assert.deepStrictEqual(p.images, [
            { role: 'base', source: 'https://example.com/a.jpg?w=720&x=1', label: 'Hero' },
            { role: 'extra', source: 'https://example.com/b.png', label: 'Second' },
        ]);

        const attrs = buildCustomAttributes(p);
        const codes = attrs.map((a) => a.attribute_code);
        assert.deepStrictEqual(codes, [
            'description',
            'short_description',
            'meta_title',
            'meta_description',
        ]);
        assert.ok(!codes.includes('size_guide'), 'empty size_guide must not be sent');

        assert.strictEqual(validate(p), null);

        // placeholder description is rejected and never sent
        const ph = { ...p, description: '[Insert Description]' };
        assert.ok(validate(ph), 'placeholder description must fail validation');
        assert.ok(!buildCustomAttributes(ph).some((a) => a.attribute_code === 'description'));

        console.log('productContent self-check: OK');
    } finally {
        fs.rmSync(file, { force: true });
    }
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
