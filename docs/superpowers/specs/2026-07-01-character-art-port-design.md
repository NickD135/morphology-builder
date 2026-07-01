# Character Art Port — Dimensional Base Shading (Design Spec)

**Date:** 2026-07-01
**Status:** Approved design, pending implementation plan
**Sub-project of:** Phase 3 (Lab Shop character/item art port). This spec covers **only the base character**. SVG hair and pet redesign are separate sub-projects; the built-in item dimensional pass is a separate follow-up (see §3).

---

## 1. Background & motivation

The scientist character (`WLScientist.buildSVG` in `wordlab-scientist.js`) is a **flat 2D SVG** on `viewBox="0 0 80 120"` — an ellipse head, flat-fill coat, flat skin. It renders on 18+ surfaces (every game page's `.scientist-stage`, the header widget, the landing hub avatar + leaderboard, the shop stage, the dashboard loading screen, the teacher scientist). The Lab Shop mockup (`docs/superpowers/specs/2026-06-29-lab-shop-mockup.html`) shows a **dimensional** character, but achieves it with CSS (radial-gradients, drop-shadows, rounded-blob layering). A prior decision deliberately **kept the single SVG renderer** and rejected the CSS character (no cross-page ripple, no orphaned outfits). This sub-project makes the SVG character *look* dimensional while staying SVG.

The user reviewed three shading directions on the real silhouette in the visual companion and chose **Option A — soft plush (matte)**, with the **ears flattened** (the per-object skin gradient had made each ear read as a hemisphere).

---

## 2. Goal & non-goals

**Goal:** Give the base character soft dimensional volume — a warm radial-shaded head, gently shaded coat, flat ears, subtle blush and ground shadow — by adding SVG layers only, with **every anchor frozen** so all ~40 built-in item overlays and any teacher-made custom items stay pixel-aligned, and with **no regression** to reactions, accessories, patterns, wings, or low-stim.

**Non-goals (explicitly out of scope):**
- **Re-shading the built-in items** (accessories, wings, coat patterns, shop items) — a separate follow-up "item dimensional pass" sub-project. Interim: shaded base + flat items is accepted.
- **Re-proportioning** the character (rounder/chunkier body) — rejected; would orphan every overlay + teacher custom item.
- **Switching to a CSS character** — rejected previously.
- **SVG hair** and **pet redesign** — separate Phase 3 sub-projects.
- Any **DB / data-model change**. No change to `scientist` fields, `viewBox`, or item-creator. Pure render change.
- **Teacher-made custom items stay flat** (their artwork; not ours to restyle) — they must still *align*, not be restyled.

---

## 3. Scope & sequencing (decided with the user)

1. **This sub-project = base character only.** Ship it, review the look live.
2. **Then** a dedicated "built-in item dimensional pass" restyles the ~40 items in batches (safe & incremental *because* geometry is frozen here).
3. SVG hair and pet redesign follow as their own specs.

---

## 4. Architectural decisions

| # | Decision | Reason |
|---|---|---|
| D1 | **Freeze every anchor.** `viewBox 0 0 80 120` and all coordinates (head `cx40 cy38 r22`, eyes `34/46,cy36`, coat rect `14,60,52,58 rx10`, neck, ears, pocket, collar, badge-pin region) are **unchanged**. | All item overlays + teacher custom items reference these exact coordinates. Moving anything orphans them. |
| D2 | Depth is **additive SVG layers only** — generated gradients + semi-transparent overlay shapes woven into the existing draw order. No shape is deleted or moved. | Keeps the frozen contract; the shading is reversible and composes over existing fills/patterns. |
| D3 | **Radial skin gradient on the HEAD only.** Ears **and neck** use a **flat, slightly-darker** skin tone (no per-object gradient). Ears render **behind** the head. | A per-object radial gradient on a small ellipse renders a self-contained highlight→shadow = a "hemisphere". Flat ears/neck avoid that; behind-head placement hides the flat disc's inner edge and reads as natural recession. |
| D4 | Skin gradient stops are **derived from the user's `skinTone`** at render time (not hardcoded), and must darken/lighten correctly for **any** tone incl. dark skin. | `skinTone` is user-customisable. Hardcoded stops would break custom/dark tones. |
| D5 | Coat depth is added as **overlay shapes over the coat fill** (a form-shade + a left sheen), never by changing the coat fill. | The coat fill may be a colour, a `<pattern>`, or the rainbow/holographic gradient. Overlays composite on top of all of them without clobbering. |
| D6 | **Unique per-instance `<defs>` ids.** A module counter suffixes **every** def id (new skin/head/coat gradients AND the existing `coatRainbow`/`coatHolo`/`cp`/`galaxyGrad`) and every `url(#…)` reference. | `buildSVG` renders many times per page (leaderboard, header, hub, stage). Today two students with different skin tones — or different-coloured patterned coats — would both resolve the first shared `#id`, cross-contaminating. Per-instance ids fix this latent bug and are mandatory once skin gradients vary per tone. |
| D7 | Shading uses **gradient/shape layers, not SVG filters** (no `feGaussianBlur`/`feDropShadow`). | Crisp at 44px, zero per-frame cost across the many avatars a page renders; filters blur/soften unpredictably at small sizes and cost more. |
| D8 | Shading is **static** → inherently low-stim / reduced-motion safe; **no gating needed**. | Low-stim suppresses motion/particles, not static form. A calm shaded figure is fine. |

---

## 5. The shading model (Option A, exact)

All values are the approved Option-A treatment. `base` = the resolved `skinTone` (default `#FDBCB4`).

### 5.1 Derived colours (from `base`, §D4)
Implement a small `_mix(hex1, hex2, t)` (per-channel linear interpolation) and derive:
- `HI  = _mix(base, '#FFFFFF', 0.32)` — head highlight core.
- `LO  = _mix(base, '#2E1D14', 0.24)` — head radial outer shade (warm dark, guarantees *darker* than base for any tone, including dark skin).
- `FLAT = _mix(base, '#2E1D14', 0.10)` — flat ear/neck tone (subtle recession, no gradient).

### 5.2 Generated defs (each id suffixed with the per-instance uid — §D6)
- `sk{uid}` — `radialGradient cx=38% cy=30% r=78%`: `0%→HI`, `58%→base`, `100%→LO`.
- `hs{uid}` — head **form-shadow** overlay, `linearGradient x1=0 y1=0 x2=1 y2=1` (top-left→bottom-right): `0%` `rgba(70,45,38,0)`, `62%` `rgba(70,45,38,0)`, `100%` `rgba(70,45,38,0.22)`. (Alpha over any tone → directional shadow, tone-independent.)
- `hh{uid}` — head **highlight** overlay, `radialGradient cx=32% cy=26% r=55%`: `0%` `rgba(255,255,255,0.42)`, `60%` `rgba(255,255,255,0)`.
- `cs{uid}` — coat **form-shade** overlay, `linearGradient x1=0 y1=0 x2=0 y2=1` (vertical): `0%` `rgba(50,42,92,0)`, `55%` `rgba(50,42,92,0)`, `100%` `rgba(50,42,92,0.13)`.

### 5.3 Fixed overlay shapes (no gradient)
- **Ground shadow** (first child, behind everything): `<ellipse cx=40 cy=119 rx=22 ry=3.2 fill="rgba(0,0,0,0.24)"/>`.
- **Coat sheen** (after `cs` overlay): `<path d="M19,66 Q21,90 22,112" stroke="rgba(255,255,255,0.5)" stroke-width=3 fill=none opacity=0.5 stroke-linecap=round/>`.
- **Blush**: `<ellipse cx=28 cy=43.5 rx=4.2 ry=2.6 fill="#fca5a5" opacity=0.32/>` + mirror at `cx=52`.

### 5.4 Draw order (single `<svg>`, anchors frozen)
Insertions relative to the current renderer (`wordlab-scientist.js:297-332`) are marked **NEW** / **MOVED**:
1. `<defs>` — coat pattern/rainbow/holo/galaxy defs (existing, now uid-suffixed) **+ NEW** `sk/hs/hh/cs`.
2. **NEW** ground shadow ellipse.
3. Wings (`wingsRendered`) — unchanged.
4. Coat rect `fill=coatFillRef` — unchanged.
5. `customImg('coat')` — unchanged.
6. **NEW** coat form-shade `<rect 14,60,52,58 rx10 fill=url(#cs{uid})/>`.
7. **NEW** coat sheen path.
8. Collar polygons — unchanged.
9. Pocket — unchanged.
10. `_buildBadgePins(scientist)` — unchanged.
11. Neck `<rect 33,54,14,10 rx3 fill=FLAT/>` — fill **changed** flat→`FLAT` (was `skin`).
12. **MOVED** ears `<ellipse …>` ×2 with `fill=FLAT` — now rendered **before** the head (were after).
13. Head `<ellipse cx40 cy38 r22 fill=url(#sk{uid})/>` — fill **changed** to skin radial.
14. **NEW** head form-shadow `<ellipse cx40 cy38 r22 fill=url(#hs{uid})/>`.
15. **NEW** head highlight `<ellipse cx40 cy38 r22 fill=url(#hh{uid})/>`.
16. Face (brows/eyes/nose/mouth by reaction) — unchanged.
17. **NEW** blush ellipses (after face; low on the cheeks, does not touch eyes).
18. Head accessory — unchanged (still on top of head/shading).
19. Face accessory — unchanged.
20. `sparkles` / `dizzy` — unchanged.
21. `customImg('head' | 'face' | 'background')` — unchanged.

Everything an item overlay references (head, eyes, coat, pocket, collar, neck, ear positions) keeps its coordinates. Accessories/wings/custom images still compose in their existing z-order.

---

## 6. Compatibility contract (must hold)
- No coordinate in the frozen anchor set changes. (Ears change *fill* and *draw order*, not position.)
- Existing coat patterns (`stripes/molecules/stars/dots/chevrons/hearts/lightning/dna/plaid`), `rainbow`, `holographic`, and `galaxy_halo` still render — now via uid-suffixed ids.
- All 18 head accessories, 4 wings, ~20 face accessories, badge pins, and `customImg` overlays render unchanged.
- Reactions `neutral/happy/excited/wrong` unchanged (face layer on top of shading).
- Teacher custom items (`customSlots`) still align (they overlay at fixed `x=-10 y=0 w=100 h=120`).

---

## 7. Constraints
- **Small-size legibility:** must read at 44px (header widget, hub avatar, leaderboard rows). Verified in the companion for Option A. No filter blur (§D7).
- **Performance:** static gradients + shapes only; a handful of extra gradient defs per instance is negligible even with ~5 leaderboard avatars.
- **Low-stim:** no change needed — static shading is allowed (§D8). Do **not** add motion.
- **No new dependencies**, vanilla JS, no build.
- **WCAG:** character is decorative; face features keep their existing high-contrast colours (unchanged).

---

## 8. Files touched
| File | Change |
|---|---|
| `wordlab-scientist.js` | `buildSVG`: add `_mix` helper + per-instance uid counter; derive `HI/LO/FLAT`; add `sk/hs/hh/cs` defs; suffix **all** def ids + `url(#…)` refs; insert ground-shadow/coat-shade/coat-sheen/head-shade/head-hi/blush layers; change head fill→skin radial, ears+neck fill→`FLAT`, move ears behind head. |
| `tests/manual/character-art-port-harness.html` | **New.** Renders the matrix in §9 for visual + assertion review (no Supabase/login). |

No HTML page changes — every surface calls `buildSVG`, so the upgrade propagates automatically.

---

## 9. Verification (synthetic harness — no Supabase/login)
A standalone page that imports `wordlab-scientist.js` and renders `buildSVG` across a matrix, driven by the local no-cache server + Playwright, screenshotted for visual sign-off:
- **Reactions:** neutral, happy, excited, wrong.
- **Skin tones:** light (`#FDBCB4`), medium (`#C68642`), dark (`#5C3A29`) — assert `HI` is lighter and `LO` is darker than `base` for **each** (the derive-from-hex must not invert on dark tones).
- **Coat types:** plain colour, `rainbow`, `holographic`, and ≥3 patterns (`dots`, `dna`, `stripes`).
- **Accessories/wings:** a representative few (e.g. `goggles_head`, `wizard_hat`, `angel_wings`, `glasses`) — confirm they still sit correctly over the shaded head/coat.
- **Sizes:** each rendered at 44px and large.
- **Unique-id isolation (the D6 regression):** render **two** characters on one page with **different skin tones AND different patterned coats**; assert each uses its own gradient (distinct resolved fill / sampled pixel), proving no cross-instance `url(#id)` contamination.
- **Ears:** assert the ears are flat (no gradient fill) and read as ears, not hemispheres (visual).
Screenshots reviewed before merge. Merge stays **local, not pushed** (consistent with the rest of the Lab Shop line).

---

## 10. Open items / risks
- **Ground-shadow vs podium shadow:** the shop stage already has a podium shadow; the character's own ground shadow may faintly double there. Keep it (subtle) and confirm on the shop stage during visual review; drop the character ground shadow only if it visibly doubles.
- **Interim base/item mismatch:** shaded body next to flat items until the follow-up item pass — accepted (§2/§3).
- **`_mix` on unusual `skinTone` values:** guard for non-hex/short-hex values (fall back to `#FDBCB4`).
- Per-effect split ratios etc. are not relevant here (that was the effects sub-project).
