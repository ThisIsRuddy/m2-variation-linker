# POPULATE_PRODUCT

End-to-end spec for filling in placeholder product pages on daylong.co.uk
(headless Magento 2 storefront) — description, short description, SEO meta,
size guide, and images — via the Magento REST API, reusing the CLI pattern in
`src/`.

This document is the brief the **`product-content`** agent is built from. It is
written to be executed repeatably for any configurable product whose page is a
placeholder, not just the four below.

---

## 0. Status — executed 2026-07-02

**Text content is LIVE in production for all four products.** Researched from
official manufacturer sources (medi.de; Össur; Enovis/DonJoy), authored into
`products/*.md`, pushed via `npm run content:prod`, and read back from the API to
confirm (`description`, `short_description`, `meta_title`, `meta_description` set;
no `[Insert …]` placeholders remain). Prior values are backed up in
`temp/content-backup.json`. The headless storefront caches its data endpoint
~20 min at the CDN, so public PDPs refresh on their next revalidation.

**Images are also LIVE** (2026-07-02): supplier images are cleared for use;
sourced direct manufacturer image URLs, uploaded to each configurable parent via
`npm run media:prod` (hero = image/small_image/thumbnail + gallery extras). medi
shipped 1 image; OA Ease / both DonJoy 2 each. Verified in each product's media
gallery.

The workflow is now wrapped as the **`product-content` agent**
(`.claude/agents/product-content.md`).

**Built** (reuses the `src/` pattern):

- `src/populateContent.js` + `src/operations/productContent.js` — parse
  `products/*.md` (status `reviewed`) → PUT text fields → `temp/ContentReport.json`;
  `DRY_RUN=1` supported.
- `src/populateMedia.js` + `src/operations/productMedia.js` — download supplier
  images → base64 → `POST /products/{sku}/media`. Skips a product that already has
  images (`FORCE=1` to override); `DRY_RUN=1` validates the downloads only.
- `src/populateSizeGuides.js` + `src/operations/productSizeGuide.js` — upsert the
  size-guide **CMS block** (`/rest/V1/cmsBlock`) and set the product's `size_guide`
  to the block id. `DRY_RUN=1` previews.
- `src/operations/productContent.test.js` — parser self-check (`node …test.js`).
- npm scripts: `content:prod|stag|local`, `media:prod|stag|local`, `sizeguide:prod|stag|local`.

**All four products are now fully populated** — description, short_description,
meta, images and size guide are all live. Size guides are CMS blocks #799–802,
created and linked via `sizeguide:prod` (see §5). Nothing owner-gated remains.

**Per-product research caveats:**

- **medi Soft OA Light** — per-size cm ranges are from a medi *retailer*
  (e-medicalbroker); verify against medi's own chart when building the size chart.
- **OA Ease (Össur)** — the Össur IFU (contraindications, step-by-step fitting) was
  inaccessible; those specifics were deliberately omitted.
- **DonJoy OA Reaction Web** — sources conflicted on offload adjustability (copy
  uses the manufacturer's wording); brace weight is unpublished (omitted).
- **DonJoy OA Clima-Flex** — clinical claims (4-Points-of-Leverage, ACL strain) are
  stated as DonJoy's own wording, not as independent fact.

**Post-launch fixes (2026-07-02):**

- Descriptions showed mojibake (`Yes â€" the`) after a CSV import round-trip mangled
  the non-ASCII. Confirmed via probe that the REST client round-trips UTF-8 cleanly;
  the corruption was the CSV path. Re-authored the pushed text as ASCII-safe (em/en
  dashes → hyphens) and re-pushed; verified clean. **Kept ® and ™** (owner's
  instruction) — stored correctly via REST.
- Images had been created at both default and retail_view scope with inconsistent
  labels. Media CLI now writes at the global/admin scope (`/rest/all/V1`) and
  requires a label. Existing images were normalised by the owner; not re-uploaded.

## 1. Scope — the placeholder products

Sourced from `/shop-by-condition/osteoarthritis`. All four are **configurable**
knee braces whose variations (orientation / size / colour) are already set up in
Magento; only the *content* is missing.

| Product | SKU | Brand | Sizes | Current state |
|---|---|---|---|---|
| medi Soft OA Light Knee Brace for Osteoarthritis | `ME-SFT-OA-LI-KNEE` | medi (`brand_range` 1818) | 6 (XS–XXL) | `[Insert Description]`, 0 images, no size guide |
| OA Ease Knee Brace | `OS-FF-OA-EASE` | Össur (`brand_range` 1817) | 7 | `[Insert Description]`, 0 images, no size guide |
| DonJoy OA Reaction Web Knee Brace for Osteoarthritis | `DJ-OA-REACT-KNEE` | DonJoy / Enovis (`brand_range` 122) | 7 | `[Insert Description]`, 0 images, no size guide |
| DonJoy OA Clima-Flex Knee Brace for Osteoarthritis | `DJ-OA-CLIMA-KNEE` | DonJoy / Enovis (`brand_range` 122) | 7 | `[Insert Description]`, 0 images, no size guide |

> Size **labels** live in the `Size` attribute (id 183). Resolved per product:
> medi `XS–XXL`; OA Ease `X-Small … XXX-Large`; both DonJoy `XS … XXXL`.
> The "Current state" column above is the *as-found* condition — text content is
> now live (see §0).

The reference "good" page is **Action Reliever** (`TH-ACT-RELIEVER`), captured
verbatim in `products/_reference/action-reliever.md`.

---

## 2. What "content" means — the fields (from the Action Reliever exemplar)

The storefront reads these Magento product attributes. Confirmed field types:

| Field | Attribute | Type | REST-writable? | Notes |
|---|---|---|---|---|
| Main description | `description` | HTML (textarea) | ✅ direct | Rich HTML, see structure below |
| Key features | `short_description` | HTML (textarea) | ✅ direct | `<ul>` of 3 bullets |
| SEO title | `meta_title` | text/varchar | ✅ direct | New — Action Reliever has none set |
| SEO description | `meta_description` | textarea/varchar | ✅ direct | New — Action Reliever has none set |
| Size guide | `size_guide` | **select** (varchar) | ⚠️ id only | Value = option id (e.g. `713`). Content is **not** on the product — see §5 |
| Images | media gallery + `image`/`small_image`/`thumbnail` | media | ✅ via media endpoint | Base64 upload — see §6 |

### 2.1 `description` — HTML pattern

Order used by Action Reliever (replicate it):

```
<p>            intro / hook — condition + who it's for + top-line benefit
<h3>…</h3><p>  themed benefit section (e.g. "Dynamic Off-Loading System")
<h3>…</h3><p>  themed benefit section ("Ease of Use")
<h3>…</h3><p>  themed benefit section ("Comfort")
<h3>Order Yours Today</h3><p>   CTA paragraph
<hr/>
<h2>FAQs</h2>
<h3>question?</h3><p>answer   ×5
```

Plain tags only — `<p> <h2> <h3> <ul> <li> <hr/>`. No inline styles, no classes.

### 2.2 `short_description` — HTML pattern

```
<ul><li>feature 1</li><li>feature 2</li><li>feature 3</li></ul>
```

### 2.3 `meta_title` / `meta_description`

UK English, ≤60 chars / ≤155 chars respectively, include brand + "knee brace"
+ "osteoarthritis" where natural. New best-practice fields the store owner opted
into; not present on the exemplar.

---

## 3. Content sourcing rules (non-negotiable)

These are **class I medical devices**. Content must be trustworthy.

- **Research + cite.** Every factual/clinical claim traces to an official
  manufacturer or clinical source. Record source URLs in the product file's
  `sources:` list. No invented specifications, indications, or numbers.
- **UK English** throughout (colour, personalised, …).
- **No medical over-claiming.** Describe intended use and features; avoid curative
  or absolute clinical promises beyond what the manufacturer states.
- **Human verification before publish.** The store owner reviews each product file
  (`status: draft → reviewed`) before any REST write. (For the first four, the
  owner delegated this and authorised a straight-to-prod push — content is grounded
  in cited official sources and awaits owner spot-check; see §0 caveats.)
- Match Daylong's voice: warm, practical, benefit-led (see the exemplar).
- **Encoding:** author in ASCII-safe punctuation (straight quotes, hyphens instead
  of em/en dashes) so text survives the store's CSV export/import round-trips, which
  mangle UTF-8 into mojibake. Keep ® ™ © trademark marks and correct brand names —
  REST preserves them; only CSV re-imports are the risk (flag it to the owner).

⚠️ The exemplar's size-guide intro literally says "compression hosiery" even
though it's a knee brace (a copied template). **Write brace-appropriate intro
copy for the new size guides** — don't inherit that error.

---

## 4. `products/` directory — authoring format

One Markdown file per product; YAML frontmatter for machine-readable fields, HTML
in fenced ```html blocks under known `##` headings. Human-reviewable **and**
script-parseable (single source of truth).

```
products/
  README.md                 how this dir works
  _template.md              empty skeleton to copy
  _manifest.md              the target list + status tracker
  _reference/
    action-reliever.md      the captured "good" exemplar (do not publish)
  medi-soft-oa-light.md     ← one per product
  oa-ease.md
  donjoy-oa-reaction-web.md
  donjoy-oa-clima-flex.md
```

Per-product file shape (see `_template.md` for the full skeleton):

```markdown
---
sku: ME-SFT-OA-LI-KNEE
slug: medi-soft-oa-light-knee-brace-for-osteoarthritis
name: medi Soft OA Light Knee Brace for Osteoarthritis
brand: medi
sizes: [XS, S, M, L, XL, XXL]
meta_title: "…"
meta_description: "…"
size_guide_option_id:        # filled after the size chart is created in admin (§5)
images:                      # source URLs to approve, then upload (§6)
  - role: base            # base = image+small_image+thumbnail; extra = gallery only
    source: https://…
    label: "…"
sources:
  - https://…               # every claim above traces here
status: draft               # draft → reviewed → published
---

## description
​```html
<p>…</p><h3>…</h3>…
​```

## short_description
​```html
<ul><li>…</li></ul>
​```

## size_guide
​```html
<div> … measurement points + <table class="sizing"> … </div>
​```
```

---

## 5. Size guide — CMS blocks (automated)

**How it works:** size guides are Magento **CMS/static blocks** with a
`size_guide_*` identifier (e.g. `size_guide_action_reliever` = block #713). The
`size_guide` product attribute is a **select** backed by a dynamic source model
(`Daylong\ProductGraphQl\Model\Source\ProductSizeGuide`) that lists those blocks as
options where **option value == block id**. The product stores the **block id**;
the frontend renderer maps it to the block's HTML in "Find your size". Diagrams are
served from `/media/size-chart/diagrams/{l,s}/…png`.

**So no custom module or bespoke API is needed** — the standard CMS Block REST API
does everything:

1. **Author** (agent): write the chart HTML in the product file's `## size_guide`
   block — measurement points + a `<table class="sizing">` mapping each configured
   size to the **manufacturer's** cm ranges — with `size_guide_identifier` and
   `size_guide_title` in frontmatter. Reuse an existing diagram in
   `/media/size-chart/diagrams/` where the measurement points match (the four OA
   braces reuse `thigh-cf-cd.png`).
2. **Upsert + link** (`npm run sizeguide:prod`): `POST`/`PUT /rest/V1/cmsBlock`
   creates or updates the block (idempotent by identifier), writes the returned id
   into the file's `size_guide_option_id`, and sets the product's `size_guide` to
   that id. `DRY_RUN=1` previews. A leading `Owner:` note comment in the block is
   stripped before publish.

Rendered structure to match (from block #713) — captured in
`products/_reference/action-reliever.md`:

```html
<div>
  <h2>Sizing Guide</h2>
  <p>intro …</p>
  <div class="sizeGrid">
    <div><h3>Where to measure?</h3><h4>1. Choosing a Size</h4>
      <p>Circumference measurements in cm for the following points:</p>
      <ul><li>cF - Thigh - …</li><li>cD - Calf - …</li></ul></div>
    <div><div class="measurement-image"><a class="zoom-image size-diagram"
      href="/media/size-chart/diagrams/l/NAME.png">
      <img src="/media/size-chart/diagrams/s/NAME.png"><span>Click to enlarge</span></a></div></div>
  </div>
  <div class="scroller"><div>
    <table class="sizing sizing--scroll" data-scroller=""><caption>1. Size Chart</caption>
      <thead><tr><th scope="col">Circumference</th><th>1</th>…</tr></thead>
      <tbody>
        <tr><td data-title="Circumference">cF</td><td data-title="1">38 - 41cm</td>…</tr>
        <tr><td data-title="Circumference">cD</td>…</tr>
      </tbody>
    </table>
  </div></div>
</div>
```

> Live: blocks #799–802 created for the four braces and linked (2026-07-02).

---

## 6. Images — assignment (implemented)

**Sourcing:** collect **all** of the manufacturer's product photos for the item —
the hero plus every distinct gallery/detail/colourway/packaging shot on the
manufacturer product page, not just one alternate. List every direct image URL in
the product file's `images:` block, each with its own `label`. Supplier images are
cleared for use.

**Assignment via REST** (`POST /rest/V1/products/{sku}/media`):

```jsonc
// download the approved source image, base64-encode it, then:
{
  "entry": {
    "media_type": "image",
    "label": "medi Soft OA Light Knee Brace",
    "position": 1,
    "disabled": false,
    "types": ["image", "small_image", "thumbnail"],   // hero only; extra images omit types
    "content": {
      "base64_encoded_data": "…",
      "type": "image/png",                              // or image/jpeg
      "name": "medi-soft-oa-light.png"
    }
  }
}
```

- First (hero) image gets `types: [image, small_image, thumbnail]`; additional
  gallery images send an empty `types` array.
- Assign to the **configurable parent** (the storefront shows the parent gallery),
  matching how the exemplar carries its 2 images on the parent.
- Assign at the **global/admin scope** (`/rest/all/V1`, the `admin` client in
  `magento.js`) so the image applies to all store views as one entry — not a
  per-store-view override. (Posting at a store-view scope creates duplicate
  default + retail_view entries.)
- Every image **must carry a descriptive `label`** (used as alt text); the CLI
  rejects an image without one.
- Response returns the new media entry id; the file lands under
  `/media/catalog/product/…`.

Implemented in `src/populateMedia.js` (`npm run media:prod`), which reads each
file's `images:` block, downloads + base64-encodes the source, and POSTs it. Each
image uploads under a deterministic name (`{slug}-{n}.{ext}`), so the step is
**idempotent per image**: images already on the product (matched by that name) are
skipped and only new ones are added — so you can add more URLs to a file later and
re-run `media:prod` to append just those, with no duplicate hero. `FORCE=1`
re-uploads every listed image regardless. Text/hero pushed live for all four on
2026-07-02; full galleries added 2026-07-03.

---

## 7. REST API reference (matches `src/lib/magento.js`)

- Auth: `Authorization: Bearer ${MAGE_TOKEN}`, base `${MAGE_URI}/rest/V1`.
- Env-scoped like the existing scripts (`.env.production` etc.). Decision:
  **publish straight to production** after the product file is `reviewed`.

**Write text fields** — one synchronous save per product (same shape as
`variationLinker`):

```jsonc
PUT /rest/V1/products/{sku}
{
  "product": {
    "sku": "ME-SFT-OA-LI-KNEE",
    "custom_attributes": [
      { "attribute_code": "description",       "value": "<p>…</p>…" },
      { "attribute_code": "short_description", "value": "<ul>…</ul>" },
      { "attribute_code": "meta_title",        "value": "…" },
      { "attribute_code": "meta_description",  "value": "…" },
      { "attribute_code": "size_guide",        "value": "714" }   // once minted (§5)
    ]
  }
}
```

Only the attributes present in the payload are touched; variations/links are left
alone. Store scope: default (all views) unless a per-store view difference is
required.

---

## 8. CLI command design (mirrors `src/`)

Reuse the existing conventions — `createClient` HTTP wrapper, per-env npm scripts,
a thin entry script + an `operations/` module, a JSON run report in `./temp`.

- `src/populateContent.js` — ✅ **built**. Entry: read `products/*.md`, act only on
  `status: reviewed`, build the custom_attributes payload, `PUT /products/{sku}`,
  write `ContentReport.json`. Any file not `reviewed` is skipped; `DRY_RUN=1`
  prints the plan without writing.
- `src/operations/productContent.js` — ✅ **built**. Dependency-free parser
  (frontmatter + fenced-HTML sections) → payload; `updateProduct(sku, attrs)`.
- `src/operations/productContent.test.js` — ✅ **built**. Parser self-check.
- `src/operations/productMedia.js` + `src/populateMedia.js` — ✅ **built**.
  `fetchImage` (download → base64) + `uploadImage` (`POST /products/{sku}/media`);
  entry skips products that already have images (`FORCE=1` overrides).
- `src/operations/productSizeGuide.js` + `src/populateSizeGuides.js` — ✅ **built**.
  `upsertBlock` (`POST`/`PUT /rest/V1/cmsBlock`, idempotent by identifier) then link
  the product's `size_guide` to the block id.
- `package.json` scripts (mirror `link:*`): `content:` ✅, `media:` ✅ and
  `sizeguide:prod|stag|local` ✅ added.

Build order: **text fields first** (done — live), then image upload, then the
size-guide link once option ids exist.

Lifecycle note: files are left `reviewed` (not flipped to `published`) after the
text push, so re-running `content:prod` also pushes each `size_guide` option id
once it's minted. Re-writing the same text is idempotent/harmless.

Non-negotiables carried from the codebase: validate the file parsed (sku + at
least `description`) before any write; never write a `draft`; report per-product
OK/FAIL like `variationLinker` does.

---

## 9. The `product-content` agent (`.claude/agents/product-content.md`)

✅ **Created** — `.claude/agents/product-content.md`. It encodes the procedure
below; this document is its detailed reference.

- **Input:** a product URL, SKU, or the manifest.
- **Steps:** research (cited) → author `products/<slug>.md` (description,
  short_description, meta, size-guide HTML draft, image source URLs) in the
  exemplar structure → stop for human review → on `reviewed`, run the CLI to PUT
  text + size-guide option + upload approved images.
- **Guardrails:** UK English; cite every claim; medical accuracy; never publish a
  `draft`; size-guide content creation is admin/owner's step unless an API is
  confirmed; confirm image rights.
- **Output:** populated product file + a run report; a short summary of what was
  written and what still needs the owner (size-chart entities, image approval).

---

## 10. Open items

- [x] Size labels per product resolved (§1): medi `XS–XXL`; OA Ease `X-Small … XXX-Large`; DonJoy `XS … XXXL`.
- [x] Manufacturer sizing charts located + cited for all four (see per-product caveats in §0).
- [x] Text fields (description/short/meta) authored, pushed live, and verified for all four.
- [x] Images sourced + uploaded live for all four (`media:prod`); supplier images cleared for use.
- [x] `product-content` agent created (§9) and its size-guide step automated.
- [x] Size guides created as CMS blocks (#799–802) and linked, via `sizeguide:prod` (§5) — no custom API needed.

All four products are fully populated and the workflow is end-to-end. Optional
follow-ups only: bespoke measurement diagrams (currently reuse `thigh-cf-cd.png`),
and verifying medi's cm ranges against medi's own chart.
