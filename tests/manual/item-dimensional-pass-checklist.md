# Item Dimensional Pass — Morning Review Checklist

**For:** Nicholas Deeney (product owner)
**Date:** 2026-07-01
**Branch:** `feat/item-dimensional-pass` (merged LOCAL — not yet pushed to production)
**Verified via:** Synthetic harness `tests/manual/item-dimensional-pass-harness.html`
(No login required — harness renders characters directly via `WLScientist.buildSVG`.)

---

## What Changed, by Category

### Head Accessories — 26 items enriched (+ 1 internal-only item)

All 26 purchasable head items received the dimensional recipe (2–3-stop gradient fill on the main
body, plus a thin highlight sub-shape inside the existing outline). No silhouette, position, or
size was changed. Animated items (flame_crown, ice_crown, galaxy_halo) had their
`<animate>`/`<animateTransform>` elements left exactly as they were — only the static fills
were enriched.

**Metal/gem/rigid items** (stronger gradient + specular dot):
goggles_head, hard_hat, crown, space_helmet, headphones, unicorn_horn, tiara, viking_helmet,
antenna, propeller_cap.

**Cloth/soft items** (matte gradient, no specular):
grad_cap, top_hat, beanie, party_hat, wizard_hat, chef_hat, pirate_hat, cat_ears, bunny_ears,
ninja_headband, dino_spikes.

**Organic/special** (gradient on main petal/band; soft):
flower_crown (gradient on orange flower + highlight dot), halo (specular arc + bright dot on the
stroke ring — see "Left Flat" note below for why no fill gradient was added).

**Animated legendaries:**
flame_crown (amber gradient on outer polygon fill; see "Eyeball These" below),
ice_crown (gradient on main polygon + base band, specular triangle),
galaxy_halo (already had a rainbow `#galaxyGrad${uid}` stroke — left intact).

**Internal-use item** (not in the shop, used for the birthday donut_crown feature):
donut_crown — band received a violet gradient; donut sprinkles (the small colored circles on each
donut) were left flat (too small at 44px to benefit; see "Left Flat" below).

---

### Face Accessories — 12 enriched, 6 left flat

**Enriched (12 items):**

| Item | Treatment |
|---|---|
| glasses | Lens radial gradient (cool tinted) + glint ellipse on left lens |
| monocle | Lens radial gradient + glint |
| safety_goggles | Lens gradient fill + glint |
| mask | Gradient fill top-to-bottom + subtle glint |
| sunglasses | Dark diagonal gradient fills + enhanced glint |
| eye_patch | Dark gradient on patch + subtle upper-left sheen |
| round_glasses | Lens radial gradient + glint ellipse |
| bubble_gum | Radial gradient on bubble + existing glint kept |
| magnifying_glass | Radial gradient lens fill + existing glint kept |
| laser_eyes *(animated)* | Radial gradient on eye circles; all `<animate>` untouched |
| diamond_monocle *(animated)* | Radial gradient lens fill + glint; all `<animate>` untouched |
| glowing_mask *(animated)* | Gradient on main fill rect; all `<animate>` untouched |

**Left flat (6 items) — see full explanation in "Items Deliberately Left Flat" below.**

---

### Wings — 4 items, all enriched with soft matte gradients

All 4 wings received soft matte (no hard specular) gradients. Existing opacity-pulse `<animate>`
elements were left untouched.

| Item | Gradient treatment |
|---|---|
| angel_wings | Soft white → indigo matte gradient + subtle highlight streak |
| fire_wings | Amber → orange → ember matte gradient, two-tone outer/inner feathers |
| crystal_wings | Light lavender → violet translucent gradient (fill-opacity animation still multiplies correctly) |
| shadow_wings | Indigo → deep dark gradient, very subtle highlight |

---

## Specifically Eyeball These

### 1. `diamond_monocle` — amber tint over the lens

The lens now has a `radialGradient` with `cx="35%" cy="32%"` and a light amber highlight
(`#fef3c7`, `stop-opacity: 0.32`). The secondary fill inside is `rgba(251,191,36,0.08)` — a
very faint amber wash.

**What to check:** The diamond-shaped inner facet (`<path d="M43,33 L46,29 L49,33 L46,37 Z">`)
and its glint animations should still sparkle clearly through the lens tint. If the amber wash
feels too heavy and dulls the diamond facet, the inner `stop-opacity` on the gradient could be
reduced from `0.32` to `0.18`.

**Screenshots for comparison:** `tests/manual/screenshots/faces-grid.png`

---

### 2. `flame_crown` — pre-existing `<animate attributeName="d">` on `<polygon>`

The outer flame polygon has:
```xml
<polygon points="40,4 28,18 ...">
  <animate attributeName="d" values="M40,4 L28,18...;..." dur="0.4s" repeatCount="indefinite"/>
</polygon>
```

SVG does **not** support animating the `d` attribute on `<polygon>` (only on `<path>`). This
`<animate>` element has always been a silent no-op in all browsers — the flame shape never
morphed the way it was intended to.

**This is NOT caused by this pass.** The gradient enrichment added in Task 1 only replaced the
flat fill with a gradient — it never touched the `<animate>` element. The polygon opacity pulses
on the inner flames still work correctly.

**Easy future fix** (one line): convert the outer polygon to a `<path>` with identical `d`
coordinates, then change the `<animate>` to use `attributeName="d"` with path `values` — or
alternatively animate `points` on the polygon instead.

---

## Items Deliberately Left Flat (and Why)

These items had no gradient added to their main fill, per spec §4 ("If an item is too small to
benefit… leaving it flat is acceptable"):

| Item | Reason left flat |
|---|---|
| `star_sticker` (face) | At 44px character height the star is ~5px across — a gradient would be invisible and might smear the shape |
| `moustache` (face) | Small curved strokes; no flat fill surface large enough to benefit |
| `bandaid` (face) | Tiny rotated rect at the corner of the face; gradient gain is negligible at 44px |
| `blush` (face) | Intentionally a semi-transparent soft blush mark (`opacity: 0.4`); adding a gradient would harden the softness effect |
| `face_paint` (face) | Stroke-only `<path>` (no `fill` attribute used); no fill surface to apply a gradient to |
| `nose_bandage` (face) | Very small rect over the nose bridge; already uses near-white `#f8fafc` which is the lightest possible surface |
| `donut_crown` sprinkles (head, internal) | The donut glazings (colored hole circles) are 0.9–1px radius specks at 44px — invisible to gradient |
| `halo` ring (head) | The ring is a `stroke`-only ellipse (no fill); gradient can only apply to fills; received a specular arc highlight on the stroke instead |

---

## Verification Summary (Synthetic Harness)

All four test suites passed with zero errors:

| Suite | Items | Errors | animatedIntact | isolationOK |
|---|---|---|---|---|
| `__HEADS__` | 26 | 0 | ✓ | ✓ |
| `__FACES__` | 18 | 0 | ✓ | ✓ |
| `__WINGS__` | 4 | 0 | ✓ | ✓ |
| `__ITEMSWEEP__` | 192 cells (48 items × 2 tones × 2 reactions) | 0 | — | — |

Screenshots captured:
- `tests/manual/screenshots/heads-grid.png` — head accessories at 150px + 44px
- `tests/manual/screenshots/faces-grid.png` — face accessories at 150px + 44px
- `tests/manual/screenshots/wings-grid.png` — wings at 150px + 44px
- `tests/manual/screenshots/sweep-heads-44px-row.png` — full sweep head grid (all tones + reactions)
- `tests/manual/screenshots/mobile-390x844.png` — harness at 390×844 viewport

---

## Architecture Guarantees

- **Geometry frozen:** no `cx/cy/x/y/width/height/points/d/rx/ry/transform` was changed on any item shape.
- **Animations preserved:** all `<animate>` and `<animateTransform>` elements are byte-for-byte identical to pre-pass.
- **ID isolation:** per-item gradient ids are suffixed with the per-call `uid` (e.g. `flmG${uid}`, `dnCG${uid}`), so two characters on the same page wearing the same item never share a gradient id.
- **Low-stim safe:** no motion or filter was added; all enrichments are static fill/shape changes.
- **Teacher custom items unaffected:** only the three inline object literals (`headAccSVG`, `faceAccSVG`, `wingsSVG`) in `wordlab-scientist.js` were modified. `customImg`/`customSlots` paths are untouched.
- **Merged LOCAL only — not pushed.** Push auto-deploys to production (wordlabs.app). Review first, then push.
