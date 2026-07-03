# Manifest — placeholder products to populate

Source: `/shop-by-condition/osteoarthritis`. All configurable; variations already
set up; only content is missing. Status legend: ☐ todo · ☑ done.

**Fully populated and LIVE (2026-07-02)** — text via `npm run content:prod`,
supplier images via `npm run media:prod`, size guides via `npm run sizeguide:prod`
(CMS blocks #799–802). Nothing owner-gated remains.

Images: medi shipped 1 image; the others 2 each. Size guides reuse the existing
`thigh-cf-cd.png` measurement diagram.

| File | SKU | Brand | Sizes | Description | Short desc | Meta | Size guide | Images |
|---|---|---|---|:-:|:-:|:-:|:-:|:-:|
| `medi-soft-oa-light.md` | `ME-SFT-OA-LI-KNEE` | medi | 6 (XS–XXL) | ☑ | ☑ | ☑ | ☑ | ☑ |
| `oa-ease.md` | `OS-FF-OA-EASE` | Össur | 7 (XS–3XL) | ☑ | ☑ | ☑ | ☑ | ☑ |
| `donjoy-oa-reaction-web.md` | `DJ-OA-REACT-KNEE` | DonJoy / Enovis | 7 (XS–XXXL) | ☑ | ☑ | ☑ | ☑ | ☑ |
| `donjoy-oa-clima-flex.md` | `DJ-OA-CLIMA-KNEE` | DonJoy / Enovis | 7 (XS–XXXL) | ☑ | ☑ | ☑ | ☑ | ☑ |

Reference (not published): `_reference/action-reliever.md` — `TH-ACT-RELIEVER`,
`size_guide` option `713`.

## Status: complete

All four are fully populated end-to-end (description, short_description, meta,
images, size guide) via the `content:prod` / `media:prod` / `sizeguide:prod`
commands. Optional polish only: bespoke measurement diagrams (currently reuse
`thigh-cf-cd.png`) and verifying medi's cm ranges against medi's own chart.
