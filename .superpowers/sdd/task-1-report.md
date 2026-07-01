# Task 1 report — Pet redesign (9 SVGs, soft-plush dimensional pass)

**Status:** DONE
**Scope:** `wordlab-scientist.js` (`PET_SVGS` + `buildPetSVG`) + new
`tests/manual/pet-redesign-harness.html`. No other files touched.

## What was implemented

### `wordlab-scientist.js`

1. **New module-scope counter + helpers**, added right after `let _sciSeq = 0;` (mirrors the
   character's uid pattern):
   - `let _petSeq = 0;`
   - `_petGrad(id, base)` — builds a `radialGradient` (`cx="38%" cy="30%" r="78%"`, stops at
     0%/58%/100%) using `_mix(base,'#FFFFFF',0.30)` for the highlight and `_mix(base,'#000000',0.22)`
     for the shade — same stop layout as the character's `sk${uid}` skin gradient, for visual
     consistency.
   - `_petShadow(rx)` — a ground-contact ellipse (`cx="40" cy="73" ry="3" fill="rgba(0,0,0,0.18)"`).

2. **`PET_SVGS` restructured from an object of strings to an object of template functions**
   `(uid) => svgString`, one per id (`cat, ginger_cat, puppy, bird, frog, owl, dragon, horse,
   hamster` — all 9 ids unchanged). Each pet:
   - Gets 1–2 `_petGrad()`-built radial gradients (a `Body` gradient for the main hue, an `Acc`
     gradient for the secondary/accent hue e.g. cat paws, dragon wings/horns, owl head-vs-body),
     ids suffixed `${uid}` (e.g. `petGcatBody_p7`, `petGdragAcc_p12`).
   - A `_petShadow()` ground ellipse drawn first (so it sits behind the body).
   - A soft belly/chest highlight overlay (`fill="#fff"` or a warm cream, low opacity).
   - A cheek-blush pair on every pet that has a face (all except the pure side-profile horse,
     which still has one).
   - Retained every species-defining feature named in the brief: cat/ginger_cat ears+whiskers+tail
     (+ tabby stripes for ginger), puppy floppy ears+snout+tongue, bird wing+beak+legs+crown
     feathers, frog wide grin+bulgy eyes+front/back legs, owl facial-disc+ear-tufts+wings+feet,
     dragon wings+snout+belly-scales+horns+spines+little flame, horse mane+muzzle+ears+hooves,
     hamster cheek-pouches+tiny ears+whiskers.
   - Eyes keep (or gained) a white catch-light dot.
   - Geometry (coordinates) is otherwise unchanged from the original flat shapes — "chunkier/
     cuter" is achieved through the added shading/highlight/shadow layers rather than resizing,
     to avoid any risk of clipping inside the frozen `0 0 80 80` viewBox. This is a deliberate
     simplification vs. a literal reading of "rounder/chunkier" — flagged in Concerns below.

3. **`buildPetSVG(petId, reaction)`** rewritten to:
   ```js
   function buildPetSVG(petId, reaction) {
     if (!petId || petId === 'none' || !PET_SVGS[petId]) return '';
     const uid = '_p' + (++_petSeq);
     return PET_SVGS[petId](uid);
   }
   ```
   Signature and export (`buildPetSVG` in the returned object, line ~1230, unchanged) preserved
   exactly — every external caller keeps working. `reaction` remains unused (no-op), as specified.
   Added an explicit `petId === 'none'` check (previously only implicit via `!PET_SVGS['none']`,
   which was already falsy/undefined — behaviour unchanged, just now explicit and documented).

### Bug found and fixed during verification: horse legs

The first draft used `stroke="url(#${body})"` (a gradient) on the horse's 4 leg `<line>` elements,
each with `x1 === x2` (a perfectly vertical line). A `radialGradient` in the default
`objectBoundingBox` units degenerates on a zero-width bounding box — Chromium rendered the legs as
a garbled yellow/orange smear instead of brown legs, and the head/neck S-curve (unchanged from the
original) read poorly at this size, so the whole pet failed the "reads as its species" check on
first screenshot review.

**Fix:** rewrote `horse` as a chibi/pony redesign — big round body, a short thick neck (filled
path, not a thin curve), a bigger round head, and 4 **flat-shaded** (`_mix('#92400e','#000000',0.55)`,
not gradient) rounded-rect legs with separate dark hoof rects, plus a thicker mane stroke and a
leaf-shaped tail. This is the one pet where I deviated from "preserve original coordinates" — the
original horse's thin-line silhouette (naturalistic side-profile) didn't read well as a plush
companion icon at 110px, let alone 44px, even before the gradient bug. Re-screenshotted after the
fix; it now clearly reads as a pony (round body, 4 legs, mane, muzzle, ears, eye with catch-light).

**Lesson applied elsewhere:** double-checked every other pet's gradient-stroked shape (cat/
ginger_cat tail, dragon tail) — all of those have non-degenerate bounding boxes (curved paths with
real width and height), confirmed fine both by code inspection and by zoomed screenshot crops.

## Harness (`tests/manual/pet-redesign-harness.html`)

New file. Loads `wordlab-worlds.js`, `wordlab-shop-data.js`, `wordlab-scientist.js` (same load
order as the existing `skin-tones-harness.html`), each cache-busted with `?v=1`. Renders:
- All 9 pets at ~110px ("tank size").
- All 9 pets at 44px ("header-widget size").
- An isolation row: `cat` + `dragon` rendered together on one page.
- `noneEmpty` check: `buildPetSVG('none') === ''` and `buildPetSVG(null) === ''`.
- An extra (not in the brief's exact spec, added defensively) unknown-id check:
  `buildPetSVG('not_a_real_pet') === ''`.

Sets `window.__PETS__ = { ids, errors, isolationOK, noneEmpty, _isolationIdsA, _isolationIdsB }`.
Isolation uses the prefix `petG` — **documented here**: every gradient id emitted by `_petGrad()`
is of the form `petG<Species><Body|Acc>${uid}` (e.g. `petGcatBody_p7`), so `[id^="petG"]` selects
exactly the pet gradient defs. `isolationOK` = the two rendered pets' `petG…` id sets are disjoint
and both non-empty.

## Harness results (final, after the horse fix)

```json
{
  "ids": ["cat","ginger_cat","puppy","bird","frog","owl","dragon","horse","hamster"],
  "errors": [],
  "isolationOK": true,
  "noneEmpty": true,
  "_isolationIdsA": ["petGcatBody_p19","petGcatAcc_p19"],
  "_isolationIdsB": ["petGdragBody_p20","petGdragAcc_p20"]
}
```

- `errors.length === 0` — all 9 pets render at both sizes without throwing, plus the
  none/null/unknown-id checks pass.
- `isolationOK === true` — `cat` and `dragon` rendered together share no gradient id (each call's
  `uid` is unique via `_petSeq`).
- `noneEmpty === true`.

## Verification method

Per the task's Step 4 and project memory `reference_local_verify_js_cache.md`: served
`tests/manual/` via a **no-cache** Python HTTP server on `127.0.0.1:8092` (custom handler sending
`Cache-Control: no-store` on every response — the default `http.server` sends no cache headers,
which lets Chromium heuristically cache sub-resources like `wordlab-scientist.js` across reloads).
Used Playwright MCP: `browser_navigate` to `?cb=<n>` cache-busted harness URLs, `browser_evaluate`
to read `window.__PETS__` and to directly confirm `WLScientist.buildPetSVG('horse')` reflected the
post-fix source (checked for `petGhorseAcc` and the new `rx="3.5"` leg rects, and confirmed
`transferSize > 0` for the `wordlab-scientist.js` resource entry), `browser_take_screenshot` for
full-page PNGs.

Two navigate/evaluate/screenshot passes:
1. First pass: `__PETS__.errors` was already empty and `isolationOK`/`noneEmpty` both true — but a
   **visual** look at the screenshot showed the horse rendering as a garbled yellow-smear blob
   (the gradient-on-degenerate-bbox bug described above). The harness's programmatic checks alone
   would have passed this bug through, which is exactly why the task brief requires screenshotting
   and looking, not just trusting `__PETS__`.
2. Fixed the horse, re-served (server was already no-store, no restart needed — static files),
   re-navigated with a fresh `?cb=`, confirmed via `browser_evaluate` that the live page was
   running the new JS (not a cached copy), then re-screenshotted. `__PETS__.allPass`-equivalent
   fields all stayed green and the horse now reads clearly as a pony.

## Screenshots (not committed — `tests/manual/screenshots/` is gitignored per project convention)

- `tests/manual/screenshots/pet-redesign-tank-grid.png` — first pass, full page (9 pets at
  110px + 44px + isolation row + JSON results). Shows the horse bug.
- `tests/manual/screenshots/pet-redesign-tank-grid-v2.png` — final pass, same layout, horse fixed.

## Visual assessment (from the v2 screenshot + zoomed crops)

- **cat** — grey plush, ears/whiskers/tail/gold eyes all read clearly at both sizes. Radial
  highlight gives visible head/body volume.
- **ginger_cat** — orange with tabby stripe accents and green eyes, clearly distinct from `cat`
  at 44px (colour + eye colour are enough even though silhouette is shared).
  **Note:** `cat` and `ginger_cat` intentionally share the same body silhouette (same as the
  original) — this was not something this task was asked to change.
- **puppy** — floppy ears, snout, tongue, distinct from the cats; reads well at 44px.
  Zoomed crop confirms clean shading and a friendly expression.
  **Note:** `cat`/`ginger_cat`/`puppy` are the three most visually similar of the 9 (all
  quadruped-with-round-head-and-two-ears silhouette family) — differentiated mainly by colour,
  ear shape, and species markers (whiskers vs. floppy ears vs. tongue). This mirrors the original
  set's silhouette family and wasn't something the brief asked me to diverge from.
- **bird** — blue, wings, beak, legs, crown feathers all clear; reads well at 44px.
- **frog** — green, bulgy white-and-navy eyes, wide grin, legs; very legible, arguably the most
  immediately readable of the 9 at 44px.
- **owl** — brown, facial disc, ear tufts, wings, feet; reads clearly as an owl at both sizes.
- **dragon** — purple, wings, horns, spines, little flame, belly scales; zoomed crop confirms
  strong shading and a distinct silhouette from the cat family despite quadruped pose.
- **horse** — redesigned as a chibi pony (see Bug section above); zoomed crop confirms it now
  reads clearly as a horse: round body, 4 legs with hooves, short maned neck, head with ears,
  muzzle, and a catch-light eye. This is the pet I'm least confident about relative to a
  professional illustrator's pass, since it required the most departure from the original
  geometry, but it is a clear improvement over both the original flat art and the first
  (buggy) redesign attempt.
- **hamster** — tan, round, big cheek pouches, tiny ears, whiskers; very legible and cute at
  both sizes.

All 9 pass the "reads as its species, shaded not flat, legible at 44px" bar from the brief.

## Files changed
- `/workspaces/morphology-builder/wordlab-scientist.js` — `_petSeq` counter, `_petGrad`/
  `_petShadow` helpers, full `PET_SVGS` rewrite (9 template functions), `buildPetSVG` rewrite.
- `/workspaces/morphology-builder/tests/manual/pet-redesign-harness.html` — new synthetic harness.

## Self-review
- Confirmed the 9 pet **ids** are byte-identical to before (`cat, ginger_cat, puppy, bird, frog,
  owl, dragon, horse, hamster`) — no renames, no additions/removals.
- Confirmed `buildPetSVG`'s signature, its `null`/`'none'`/unknown-id → `''` behaviour, and its
  export name are all unchanged externally — only the internal implementation changed.
- Confirmed `viewBox="0 0 80 80"` on every pet, unchanged.
- Confirmed **no** `<filter>` and **no** `<animate>`/`<animateTransform>` anywhere in the new
  `PET_SVGS` (grep-checked).
- Confirmed every gradient id is uid-suffixed and there is no module-level id reuse across pets or
  across calls (isolation harness check + code inspection).
- Confirmed I did **not** touch `scientist.html`, `wordlab-shop-data.js`, `wordlab-data.js`, or
  `_injectPetStage()` — verified via `git diff --stat` showing only `wordlab-scientist.js` and the
  new harness file changed.
- `node --check wordlab-scientist.js` passes (ran twice: after the initial rewrite and after the
  horse fix).

## Concerns
- **"Rounder/chunkier" achieved via shading, not resizing.** I kept every pet's coordinate
  geometry at its original scale (except the horse, which needed a full redesign) rather than
  literally enlarging body/head radii, to avoid any risk of clipping inside the frozen 80×80
  viewBox without a careful per-pet margin audit. The plushness reads through the added radial
  gradients, ground shadow, belly highlights, and cheek blush. If a reviewer wants literal
  size increases too, that's a follow-up, not done here.
- **Horse is the one pet with materially different geometry from the original** — flagged above
  and in-code (a comment above the `horse` entry explains why). All other 8 pets kept their
  original silhouette/proportions.
- **`cat`/`ginger_cat`/`puppy` silhouette family** — three of the nine pets share a similar
  "round body + round head + two ears" base silhouette (inherited from the original set, not
  introduced by this task). They're still distinguishable by colour and species markers, but a
  future illustrator pass might want more silhouette variety across the whole set.
- This task did **not** touch the shop UI, `_injectPetStage()`, low-stim CSS, or any DB fields —
  those are explicitly out of scope per the brief and are follow-up tasks per the spec's §7 files
  list (`scientist.html`, `wordlab-shop-data.js`, `wordlab-data.js`).
