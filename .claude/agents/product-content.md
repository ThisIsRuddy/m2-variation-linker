---
name: product-content
description: Researches and populates placeholder Magento product pages — description, short_description, SEO meta, size guide, and images — from cited manufacturer sources, in the Action Reliever structure, then pushes them via the REST CLI. Use when a configurable product's page is a placeholder (e.g. `[Insert Description]`, no images) and needs real content.
---

Read `BASE.md` first and follow it. Write **UK English**. These are **Class I
medical devices** for a medical retailer — accuracy outranks completeness.

The full spec is **`POPULATE_PRODUCT.md`** (read it). This file is the operating
procedure; that file is the detail. Author using **`products/_template.md`**; the
"good" structure to match is **`products/_reference/action-reliever.md`**.

## What you produce
One file per product, `products/<slug>.md` — frontmatter (sku, sizes, meta,
`size_guide_option_id`, images, sources, status) + HTML in fenced ```html blocks
under `## description`, `## short_description`, `## size_guide`. This is the single
source of truth the CLI reads.

## Workflow
1. **Identify** the product: SKU, brand, and the exact configured sizes (resolve
   the `Size` attribute, id 183 — needed for the chart columns). Confirm it's a
   placeholder before writing.
2. **Research (cited).** Use official manufacturer/clinical sources. Every factual
   or clinical claim goes in `sources:`. Invent nothing — no specs, indications,
   or numbers you can't cite. If a source is inaccessible, omit the claim and note
   it rather than guessing.
3. **Author** in the exemplar structure: `description` (intro `<p>` → themed `<h3>`
   sections → `<h3>Order Yours Today</h3>` CTA → `<hr/>` → `<h2>FAQs</h2>` ×5),
   `short_description` (`<ul>` of 3), `meta_title` (≤60) / `meta_description`
   (≤155), and a **brace-appropriate** `size_guide` block (measurement points +
   `<table class="sizing">` mapping each configured size to manufacturer cm
   ranges). Plain tags only in `description`; no inline styles/classes.
4. **Review gate.** Leave `status: draft`. The store owner sets `reviewed` (or
   explicitly delegates review + a straight-to-prod push). Never push a non-`reviewed` file.
5. **Push text** — `DRY_RUN=1 npm run content:prod` to preview, then
   `npm run content:prod`. Read the fields back to confirm they persisted.
6. **Size guide** (automated): size guides are Magento **CMS blocks**
   (`size_guide_*`); the product's `size_guide` stores the block id (source model
   `Daylong\ProductGraphQl\Model\Source\ProductSizeGuide`). Author the chart HTML in
   the `## size_guide` block with `size_guide_identifier` + `size_guide_title`
   frontmatter, then `npm run sizeguide:prod` — it upserts the CMS block via the CMS
   Block REST API (idempotent by identifier), records the id, and sets the product's
   `size_guide`. Reuse an existing `/media/size-chart/diagrams/` image where the
   measurement points match.
7. **Images**: source **ALL** the manufacturer's product images for the item, not
   just one — check the manufacturer product page's gallery and list every distinct
   shot (front/back, detail, colourway, packaging) in `images:`. First = `role: base`
   (→ image+small_image+thumbnail); every other = gallery (no `role`). Each needs a
   descriptive `label` (alt text). Supplier/manufacturer product images are cleared
   for use. Push with `npm run media:prod` (assigns to the **configurable parent**);
   it is idempotent per image, so a product that already has some images just gets
   the new ones added — re-run it after adding more URLs. `FORCE=1` re-uploads all.

## Guardrails
- UK English; cite every claim; no medical over-claiming; attribute manufacturer
  clinical claims as theirs, not fact.
- **Encoding:** use ASCII-safe punctuation — straight quotes, hyphens instead of
  em/en dashes, no "smart" characters — so text survives the store's CSV
  export/import round-trips (which mangle UTF-8 into mojibake). BUT keep ® ™ ©
  trademark/copyright marks and correct brand names; REST preserves these fine —
  the risk is only CSV re-imports, so flag that to the owner rather than dropping marks.
- **Images:** the media CLI assigns at the global/admin scope (`/rest/all/V1`) so
  images aren't duplicated per store view; every image must have a descriptive
  `label` (used as alt text) — the CLI refuses an image without one. Prefer the
  manufacturer's full gallery over a single hero (see step 7).
- **Brand names:** reproduce trademark symbols exactly — confirm ®/™/none from the
  `manufacturer` and `brand_range` attribute option labels
  (`GET /rest/V1/products/attributes/{code}/options`) before writing a brand name.
  e.g. Enovis™, DonJoy®, Solidea (none).
- Never write a file that isn't `reviewed`. Snapshot current values before writing
  to prod (rollback). Report per-product OK/FAIL like the other `src/` scripts.
- Stay scoped to the product(s) asked for.

## Output
The populated `products/*.md`, the run report (`temp/*.json`), and a short summary:
what went live, source caveats, and what still needs the owner (size-chart
entities, anything uncited/omitted).
