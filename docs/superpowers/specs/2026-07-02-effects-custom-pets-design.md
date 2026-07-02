# Lab Shop follow-ups — effect visibility, custom-item override, six new pets

**Date:** 2026-07-02
**Status:** Approved (design)
**Context:** Classroom play-test feedback after Phase 3 (Lab Shop) shipped to production.
Three independent fixes/additions. No DB migration. Touches `wordlab-effects.js`,
`wordlab-scientist.js`, `wordlab-shop-data.js`, and (verify only) `scientist.html`.

---

## 1. Effect visibility — glow/aura family hides behind the character

### Problem
Phase 7.28 routed the glow/aura family entirely to the **behind** depth layer
(`_addNodeBehind`). On the shop podium and game stages the character SVG is opaque
and roughly fills its container, so a behind-only glow is almost fully occluded.
Several halos are also sized *smaller* than the character (e.g. `fxAura` ring is
152×198, `fxBlackhole` disk is small), so nothing spills past the silhouette and
the effect reads as "not there." Reported for aura-type glows and black hole.

### Fix — "wrap translucent" (chosen)
For the glow family, do **both**:
1. **Enlarge** the main saturated halo in the behind layer so it clearly radiates
   past the character silhouette (grow to comfortably exceed the character bounds —
   e.g. aura glow/ring up to ~1.4–1.6× so it peeks out all around).
2. **Add a low-opacity twin in the front layer** so the colour visibly drifts *over*
   the character as a soft veil (front twin ~0.25–0.4 opacity of the behind one).

Introduce a small helper to keep the behind halo and its front veil in sync so each
migrated effect stays DRY (a `_makeHalo(el, styleFn)`-style helper that emits the
saturated node behind and a dimmed twin in front, or equivalent). The premium
`blackhole` keeps its structured layers (disk/sphere/jets) but gains a translucent
front veil + enlarged behind halo so it's visibly present.

### Affected effects
The border-glow / radial-halo family: `aura`, `shimmer`, `divine`, `quantum`,
`vortex`, and premium `blackhole`. (Orbit effects — galaxy, electric, rainbow, etc.
— already wrap via `_addNodeWrap` and are out of scope; do not disturb them.)

### Constraints
- Low-stim / reduced-motion: `WLEffects.start` already hard-returns under `_calm()`;
  no new motion escapes it.
- Teardown: all new front nodes go through the tracked layer nodes so `stop()`
  removes them; no leaked intervals/RAF/nodes. Behind+front layer z-index math
  (relative to character z) is unchanged.
- Both container shapes (shop `.lab-charwrap` svg, game `#sciCharWrap`) must render
  the veil over the character and the halo around it.

### Verification
Reuse `tests/manual/effect-depth-sweep.html` (real `WLScientist.buildSVG` +
`WLWorlds.start` on shop-shaped and game-shaped containers): confirm each glow effect
shows a translucent veil over the character AND a halo spilling past the silhouette,
low-stim gates to zero layers, mobile 390px no overflow, rapid switch → single layer
pair.

---

## 2. Custom teacher-made pieces — overridable + always selectable

### Problem
`buildSVG` renders custom overlays **unconditionally**: custom `head`/`face` draw
*after* the regular accessory (so custom always wins), and custom `coat` draws on top
of any coat colour. There is no mutual exclusivity, so a student wearing a custom
shirt/head/face piece can equip a regular hat/coat and see no change — they are
"stuck." Custom pieces were never wired to override in the new Lab Shop.

### Fix — mutual exclusivity per slot
Slot mapping: custom `coat` ↔ regular `coatColor`(+`coatPattern`);
custom `head` ↔ regular `head`; custom `face` ↔ regular `face`;
custom `background` ↔ regular `world`.

- **`WL.equip`** (regular colours / patterns / heads / faces / worlds): after setting
  the regular field, **clear the matching custom slot** — set
  `customSlots[type] = null` and delete `customSlots['_img_'+type]` — and persist the
  updated `customSlots` in the same save. So equipping *any* regular item, including
  **"None"**, removes a stuck custom piece.
- **`WL.equipCustom`**: when equipping a custom item for a type, **clear the matching
  regular field** (`head`/`face` → null; `background` → `world` null; `coat` → leave
  the coat colour as the base the custom overlay sits on). Persist both.

### Fix — always selectable
Ensure the **Custom category lists items the student owns** (`owned` contains
`custom_<id>`) even if the teacher's active shop list has changed, so a stuck student
can always find and toggle their own piece off. Confirm the Custom category renders,
previews, and toggles in the new Lab Shop UI; fix any gap found.

### Constraints
- Preserve existing `equipCustom` toggle-off behaviour (clicking the equipped custom
  item unequips it).
- DOM-based rendering in the Custom grid stays XSS-safe (no `innerHTML` of item data).
- No change to `shop_items` schema or the Item Creator.

### Verification
As a test student who owns a custom head + custom coat: equip a regular hat → custom
head clears and the hat shows; equip "None" head → clean head; change coat colour →
custom coat clears. Re-equip a custom piece → the opposing regular field clears. Custom
tab lists owned pieces and toggles them.

---

## 3. Six new pets

Add six pets matching the existing 9 soft-plush dimensional style (viewBox
`0 0 80 80`, `_petGrad` radial body/acc gradients, `_petShadow` ground contact,
per-call `uid` so no cross-pet gradient-id bleed, no `<filter>`/`<animate>`, legible
at podium and ~90px game sizes).

| id | name | body palette (approx) | cost | rarity |
|---|---|---|---|---|
| `goldfish`      | Goldfish      | orange/gold            | 80  | common |
| `duck`          | Duck          | yellow + orange bill   | 100 | common |
| `bunny`         | Spotted Bunny | white + grey spots     | 120 | common |
| `goose`         | Goose         | white + orange bill    | 150 | common |
| `sealion`       | Sea Lion      | warm grey/brown        | 200 | common |
| `giraffe`       | Giraffe       | tan + brown patches    | 200 | common |

- Add each as a `(uid) => svgString` entry in `PET_SVGS` (`wordlab-scientist.js`).
- Add each to `SHOP.pets` (`wordlab-shop-data.js`) with id/name/cost/icon; none free,
  none legendary.
- `buildPetSVG` already guards unknown ids; the equipped pet renders on the podium
  (`scientist.html` Pets category) and on game pages via `_injectPetStage`. No new
  wiring beyond the two catalogue additions.
- Persist via existing `save_scientist_field` RPC (the `pet` field already exists);
  `atomic_purchase` is generic. **No DB migration.**

### Verification
Extend/reuse the pet harness (`tests/manual/pet-redesign-*`): all 15 pets render with
unique gradient ids, no console errors, readable at 80px and small sizes, purchasable
entries appear in the Pets category.

---

## Out of scope
- Orbit-family effects (already wrap correctly).
- Any change to the character `buildSVG` anchors/accessories beyond the custom-overlay
  precedence already described.
- Item Creator, `shop_items` schema, pricing logic, low-stim gating rules.
