# products/

Authored content for placeholder product pages, ready to push to Magento via the
REST CLI. See **`../POPULATE_PRODUCT.md`** for the full workflow.

## Layout

- `_template.md` — copy this to start a new product.
- `_manifest.md` — the target list + status tracker.
- `_reference/action-reliever.md` — the captured "good" page structure. Reference
  only; **do not publish** it.
- `<slug>.md` — one file per product (single source of truth for its content).

## File format

YAML frontmatter (machine-readable fields) + HTML in fenced ```html blocks under
`## description`, `## short_description`, `## size_guide` headings.

## Lifecycle

`status: draft` → owner reviews & sets `reviewed` → CLI writes to Magento → `published`.
The CLI only writes files marked `reviewed`. Every factual claim must trace to a
URL in `sources:`. UK English throughout.
