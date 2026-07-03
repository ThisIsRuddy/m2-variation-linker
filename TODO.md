# TODO — size_guide end-to-end ✅ DONE (2026-07-02)

Completed the same day — **no custom API was needed.** Size guides turned out to be
Magento **CMS/static blocks** (`size_guide_*`), with the product's `size_guide`
attribute storing the block id (dynamic source model
`Daylong\ProductGraphQl\Model\Source\ProductSizeGuide`). The standard CMS Block
REST API does everything.

What shipped:

- `src/operations/productSizeGuide.js` + `src/populateSizeGuides.js` — upsert a
  size-guide CMS block via `/rest/V1/cmsBlock` (idempotent by identifier) and set
  the product's `size_guide` to the block id. `npm run sizeguide:prod|stag|local`,
  `DRY_RUN=1` supported.
- Created + linked blocks for all four OA braces: **#799–802**, reusing the existing
  `thigh-cf-cd.png` measurement diagram. Verified each product's `size_guide` points
  at its block and each block renders the sizing table.
- `product-content` agent step 6 is now automated; `POPULATE_PRODUCT.md` §5 rewritten.

All four products are fully populated end-to-end (text, images, size guide).

Optional follow-ups only: bespoke measurement diagrams instead of the reused one,
and verifying medi's cm ranges against medi's own chart. See `POPULATE_PRODUCT.md` §5.
