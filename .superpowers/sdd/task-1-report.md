# Task 1 Report — Head Accessories Dimensional Pass

**Status:** DONE
**Date:** 2026-07-01
**File modified:** `wordlab-scientist.js` (headAccSVG block)
**Harness:** `tests/manual/item-dimensional-pass-harness.html` (created)
**Screenshot:** `tests/manual/item-dimensional-pass-heads-screenshot.png`

---

## `window.__HEADS__` verbatim

```json
{
  "count": 26,
  "ids": [
    "goggles_head","grad_cap","top_hat","hard_hat","beanie","party_hat","wizard_hat",
    "space_helmet","chef_hat","pirate_hat","headphones","cat_ears","bunny_ears",
    "dino_spikes","unicorn_horn","propeller_cap","tiara","viking_helmet","antenna",
    "flower_crown","halo","ninja_headband","crown","flame_crown","ice_crown","galaxy_halo"
  ],
  "errors": [],
  "animatedIntact": true,
  "isolationOK": true,
  "PASS": true
}
```

---

## What changed per item

### Standard items — gradient + highlight

| Item | New gradient id(s) | Treatment |
|---|---|---|
| goggles_head | `gogBG${uid}` | Gray band light→mid→dark; highlight ellipse upper-left |
| grad_cap | `gcG${uid}`, `gcBG${uid}` | Mortarboard + brim each get distinct navy gradients; tilted highlight on brim |
| top_hat | `thG${uid}` | Single indigo-black diagonal on both rects; small highlight on crown face |
| hard_hat | `hhHG${uid}`, `hhBG${uid}` | Yellow crown bright→amber→ochre; brim darker amber→brown; specular ellipse |
| beanie | `bnG${uid}`, `bnBG${uid}` | Cloth matte lavender→indigo→navy + brim band; soft side highlight. **No specular (cloth rule)** |
| party_hat | `phG${uid}` (userSpaceOnUse) | Pink cone top-to-base gradient; highlight stripe on left face. **No specular (cloth rule)** |
| wizard_hat | `wzG${uid}`, `wzBG${uid}` | Brim + body deep-purple gradients; left-face highlight. **No specular (cloth rule)** |
| flower_crown | `flOG${uid}` | Orange central flower only gets gradient; highlight dot on pink flower. Other small flowers left flat (too small at 44px) |
| ninja_headband | `njG${uid}` | Dark indigo-black band gradient; soft strip highlight |
| space_helmet | `spHG${uid}` (radialGradient) | Glass radial ice-blue→transparent-blue; specular ellipse + bright dot upper-left. **Gem/glass rule** |
| chef_hat | `chfG${uid}`, `chfBG${uid}` | White cloth warm-white→slate body; darker brim; large fabric shine. **No specular (cloth rule)** |
| pirate_hat | `pirG${uid}`, `pirBG${uid}` | Navy crown + charcoal brim; tilted highlight left face |
| headphones | `hpBG${uid}`, `hpCG${uid}` | Cups near-black gradient; cushions lavender→indigo; specular ellipse each cup |
| cat_ears | `catEG${uid}` | Hot-pink→crimson diagonal; highlight ellipse on each ear |
| bunny_ears | `bunG${uid}` | Blush→deeper-blush diagonal; white highlight on tip of each ear |
| dino_spikes | `dinG${uid}`, `dinCG${uid}` | Side spikes light-green→dark; center spike mid-green; highlight on side spike |
| unicorn_horn | `uniG${uid}` | Pale-pink→magenta→plum; specular sliver + bright tip dot. **Gem rule** |
| propeller_cap | `prpG${uid}`, `prpBG${uid}` | Red cloth cap + darker brim; tilted highlight. **No specular (cloth rule)** |

### Metal / gem items — stronger gradient + specular dot

| Item | New gradient id(s) | Treatment |
|---|---|---|
| crown | `crnG${uid}` | Gold cream→amber→sienna; specular polygon on left prong + bright center gem dot |
| tiara | `tiaBG${uid}` | Base band magenta→deep-purple; specular dot on all 3 gem circles |
| viking_helmet | `vikG${uid}`, `vikBG${uid}` | Stone light-gray→mid→dark-brown; brim darker; specular ellipse + bright dot on dome |

### Highlight-only (no new gradient)

| Item | Treatment | Reason no gradient |
|---|---|---|
| halo | Specular arc ellipse + bright dot on ring upper-left | Ring has `fill="none"` (stroke-only); gradient on a zero-fill stroke at this size adds nothing |

### Animated legendary items — static fills enriched, animations verbatim

| Item | New gradient id(s) | Static change | All `<animate*>` verified untouched |
|---|---|---|---|
| flame_crown | `flmG${uid}` | Outer polygon: cream→amber→ochre replaces flat #f59e0b | `<animate attributeName="d">`, 2× `<animate attributeName="opacity">` |
| ice_crown | `iceCG${uid}`, `iceBG${uid}` | Crown polygon pale-blue→sky→blue; base band sky→royal; specular triangle | `<animate attributeName="stroke-opacity">`, 3× `<animate attributeName="r">` |
| galaxy_halo | — | **Left entirely intact** — already uses `url(#galaxyGrad${uid})` rainbow stroke defined in outer buildSVG scope | `<animateTransform>`, 3× `<animate attributeName="opacity">` |
| antenna | `antLG${uid}` (userSpaceOnUse) | Pole stroke: dark-gray→light-gray upward gradient; static specular dot atop animated tip | `<animate attributeName="opacity">` on tip circle |

### Items deliberately left flat (partial or entirely)

| Item | What was still enriched | Reason for flat remainder |
|---|---|---|
| donut_crown | Band only (`dnCG${uid}`) | 9 overlapping donut circles each ~5px at 44px; gradients on them would be invisible and muddy sprinkle colors |
| galaxy_halo | Nothing new | Already shaded by rainbow `galaxyGrad${uid}` — additional treatment would compete |

---

## Geometry freeze confirmation

Zero `cx/cy/x/y/width/height/points/d/rx/ry/transform/r` values changed on any existing shape. Only `fill` (and `stroke` on the antenna line) were replaced with `url(#...)` references. All new shapes (highlight ellipses, specular circles, specular polygons) are purely additive — inside each item's existing silhouette.

## Screenshot summary

- Status bar at top of harness shows green **✓ PASS**
- All 26 cards visible at 150px (dimensional items clearly legible) + 44px (items legible, silhouettes unchanged)
- Animated items (flame_crown, ice_crown, galaxy_halo, antenna) confirmed animating in browser
- Isolation test: two galaxy_halo instances shown side-by-side with confirmed distinct id sets
- No misalignment observed on any item at either size

## Gradient id namespace — no conflicts

Base character ids (all `${uid}`-suffixed): `sk`, `hs`, `hh`, `cs`, `coatRainbow`, `coatHolo`, `cp`, `galaxyGrad`.
No head item gradient uses any of those prefixes. All new ids use distinct 2–5 char prefixes (gogBG, gcG, gcBG, thG, hhHG, hhBG, bnG, bnBG, crnG, dnCG, phG, wzG, wzBG, flOG, njG, spHG, chfG, chfBG, pirG, pirBG, hpBG, hpCG, catEG, bunG, dinG, dinCG, uniG, prpG, prpBG, tiaBG, vikG, vikBG, antLG, flmG, iceCG, iceBG).
