# Pet Redesign + Re-enable — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Redesign the 9 pet SVGs in the soft-plush dimensional language and re-enable the pet system end-to-end (shop category, on-stage render, low-stim), no backend change. **Spec:** `docs/superpowers/specs/2026-07-01-pet-redesign-design.md`.

**Tech:** Vanilla JS, inline SVG, `_mix` helper (in wordlab-scientist.js), Playwright + no-cache server.

## Global Constraints
- Vanilla JS, no build, no new deps, **no DB migration** (`pet` already persists via `save_scientist_field`; `atomic_purchase` is generic).
- **Keep the 9 ids/names/costs exactly** (backward-compat): `cat`(Grey Cat 120), `ginger_cat`(Ginger Cat 120), `puppy`(Puppy 150), `bird`(Bluebird 100), `frog`(Lab Frog 80), `owl`(Wise Owl 200), `dragon`(Baby Dragon 500 legendary), `horse`(Mini Horse 200), `hamster`(Hamster 100), plus `none`(free). Icons from the original: 🐱🐈🐶🐦🐸🦉🐉🐴🐹❌.
- **viewBox `0 0 80 80` unchanged** for every pet. Per-call **uid**-suffixed gradient ids (mirror `buildSVG`'s `'_s'+(++_sciSeq)` pattern; a `_petSeq` counter or reuse). **No `<filter>`, no `<animate>`** (static; motion is the existing CSS keyframes). Legible at tank size (~110px) + 44px.
- Reactions (`_petReact`/`react`), CSS keyframes, character `buildSVG`, and the shop must all still compose. `buildPetSVG` stays independent of `buildSVG`.
- Verification = synthetic harness (no login). Aesthetic choices are conservative defaults → screenshots + checklist for owner.
- Branch `feat/pet-redesign`; at the very end the controller merges to main **and pushes** (owner authorized this session — overrides the prior local-only convention).

## Interfaces (from recon — use these exact locations)
- `PET_SVGS` object: `wordlab-scientist.js:466-773` (9 pets, each `<svg viewBox="0 0 80 80">…flat single-fill shapes…</svg>`). `buildPetSVG(petId, reaction)`: `:775-778` returns `PET_SVGS[petId]` (reaction unused — keep no-op). Exported `:1230`. `_mix(hex,hex2,t)`: `wordlab-scientist.js:129`.
- `_injectPetStage(sd)`: `wordlab-scientist.js:780-788` — **currently gutted** (force-hides `#petCharWrap`/`.pet-tank`, never renders). Called from `inject()` at `:896`. Pre-hide version is in git at `258aaf5^` (renders `buildPetSVG(petId)` into `#petCharWrap`, toggles display by whether a pet is equipped).
- Reaction plumbing (leave as-is): `_petReact(type)` `:790-804`; called from `react()` `:1073`; low-stim early-return in `react()` `:1062-1067`. CSS keyframes injected `:1182-1217` (`.pet-tank`, `#petCharWrap.pet-idle/-correct/-wrong/-streak`, `petIdle/petJump/petSad/petDance`).
- Game pages already contain `<div id="petCharWrap" class="pet-idle"></div>` inside `.scientist-stage` (e.g. `breakdown-mode.html:254`, `mission-mode.html:666`, all 13 game pages).
- Shop `scientist.html`: `WL.CATS` array `~1302-1320` (current: colours, skin, hair, hairColor, patterns, heads, faces, wings, worlds, dances). Card preview branches `~1532-1570`; name-hidden `~1576`; confirm/not-enough modal previews `~2479/2555`; `WL.miniPreview` `~1433`; `renderStage` `~1081-1113`; `WL.surprise` `~2664`. `WL.equip` generic path normalises `'none'→null` and saves `WL.scientist[cat.field]`.
- Old `pets` catalogue (from git `861aba8` diff, for names/costs): none/cat 120/ginger_cat 120/puppy 150/bird 100/frog 80/owl 200/dragon 500 legendary/horse 200/hamster 100.
- Low-stim stylesheet: `wordlab-data.js:2936-2974` (has `.low-stim #sciCharWrap{animation:none!important}` at ~2951 — **no `#petCharWrap` equivalent**; add one).

---

## Task 1: Redesign the 9 pet SVGs
**Files:** Modify `wordlab-scientist.js` (`PET_SVGS` + `buildPetSVG`). Create `tests/manual/pet-redesign-harness.html`.
- [ ] **Step 1:** Convert `PET_SVGS` from flat single-fill shapes to **soft-plush shaded** art. Simplest structure: make each entry a **function `(uid) => svgString`** (or keep an object of template fns) and have `buildPetSVG(petId)` generate a uid (`'_p'+(++_petSeq)`) and call it. Each pet: body/head filled with a per-pet **radial gradient** `petG<part><uid>` (highlight `_mix(base,'#fff',0.3)` top-left → `base` → shade `_mix(base,'#000',0.22)` bottom); add a **ground contact shadow** ellipse (~`cx40 cy73 rx16 ry3 fill rgba(0,0,0,0.18)`); soft belly/cheek highlight; friendly eyes with a white catch-light dot; cheek blush where it suits. Keep the species features (cat ears/whiskers/tail, ginger stripes, puppy floppy ears, bird wing/beak, frog wide grin/legs, owl facial disc/tufts, dragon wings/snout/belly-scales, horse mane/muzzle, hamster cheeks/tiny ears). Rounder/chunkier/cuter than the originals. **viewBox stays `0 0 80 80`.** No `<filter>`/`<animate>`.
- [ ] **Step 2:** Keep `buildPetSVG(petId, reaction)` signature (reaction stays unused/no-op) and its export. Ensure `buildPetSVG(null|'none'|unknown)` returns `''` (as today).
- [ ] **Step 3: Harness** `tests/manual/pet-redesign-harness.html`: load `wordlab-worlds.js`+`wordlab-shop-data.js`+`wordlab-scientist.js` (cache-bust query per script). Render all 9 pets via `WLScientist.buildPetSVG(id)` at ~110px and 44px. Set `window.__PETS__ = {ids, errors:[], isolationOK, noneEmpty}`: `errors` = id that threw/empty; `noneEmpty` = `buildPetSVG('none')===''` and `buildPetSVG(null)===''`; `isolationOK` = two different pets rendered on the page share no `petG…`/gradient id (disjoint `[id^=petG]` sets — or whatever prefix you choose; document it).
- [ ] **Step 4: Verify** — serve `python3 -m http.server 8092 --bind 127.0.0.1 &` (kill after); Playwright MCP (`ToolSearch select:mcp__playwright__browser_navigate,mcp__playwright__browser_evaluate,mcp__playwright__browser_take_screenshot`) → harness `?cb=<n>`; read `__PETS__`; require `errors.length===0 && isolationOK && noneEmpty`. Screenshot the 9-pet grid (large) + 44px row. Confirm each pet reads as its species, shaded (not flat), legible at 44px. Fix code (not assertion) on failure.
- [ ] **Step 5: Commit** `feat(scientist): redesign 9 pet SVGs (soft-plush dimensional pass)` + trailers (`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` / `Claude-Session: https://claude.ai/code/session_01DjZtyZpEo3SRyVoR3yuQRo`).

## Task 2: Pet shop catalogue + category
**Files:** `wordlab-shop-data.js`, `scientist.html`. Extend harness.
- [ ] **Step 1:** `wordlab-shop-data.js`: add `SHOP.pets` = the 9 + `none` with original ids/names/costs/icons/rarity (`dragon` legendary). Expose `pets: SHOP.pets` in `window.WLShopData`.
- [ ] **Step 2:** `scientist.html` `WL.CATS`: add `{id:'pets', label:'Pets', icon:'🐾', field:'pet', src:function(){return WLShopData.pets;}}` (after `wings`, before `worlds`, or wherever reads best). Card preview: add a branch so pet cards render the **real pet SVG** (`WLScientist.buildPetSVG(item.id)` in a sized wrapper) — NOT `WL.miniPreview` (pets aren't the character); the `none` pet shows the 🚫 glyph like heads. Confirm/not-enough modal previews: render `buildPetSVG` too. Pets are **paid** (keep names shown; do NOT add to the name-hidden swatch list). Optionally add `['pets','pet']` to `WL.surprise` (owner call — default: include, since pets are cosmetic; but they're PAID so surprise only picks owned/free per the existing badge/owned filter — safe).
- [ ] **Step 3:** `renderStage` (`~1108`): after building the character `wrap`, if `WL.scientist.pet`, render a **podium companion** — a small element (e.g. `#petCharWrap`-classed, ~90px, `.pet-idle`) containing `WLScientist.buildPetSVG(WL.scientist.pet)` positioned beside/in front of the podium; append to `stage`. Respect `_calm()`/low-stim for the idle bob (the CSS rule from Task 3 handles it; don't add motion here). Ensure equipping/unequipping a pet re-renders (it calls `renderStage`).
- [ ] **Step 4: Verify** — extend harness `window.__PETSHOP__ = {exposed, count, hasNone}` asserting `WLShopData.pets` present, count 10 (9+none), each has id/name/cost. Run harness; require pass + `__PETS__` still green. (Full shop click-through needs login — note it; the CAT wiring mirrors heads.)
- [ ] **Step 5: Commit** `feat(scientist): re-enable Pets shop category + podium companion` + trailers.

## Task 3: Un-gut on-stage render (game pages) + low-stim
**Files:** `wordlab-scientist.js` (`_injectPetStage`), `wordlab-data.js` (low-stim CSS). Maybe `breakdown-mode.html`.
- [ ] **Step 1:** Restore `_injectPetStage(sd)` (`wordlab-scientist.js:780-788`) to the **pre-hide behaviour** (reference git `258aaf5^`): read `sd.scientist && sd.scientist.pet`; for each `#petCharWrap`, if a pet is equipped set `innerHTML = buildPetSVG(pet)` and show it (keep the `.pet-idle` class), else clear it and hide. Do NOT force-hide unconditionally. Keep it null-safe (no pet / no `#petCharWrap` → no error). Confirm it's still called from `inject()` (`:896`).
- [ ] **Step 2:** `wordlab-data.js` low-stim stylesheet (~2951, next to `.low-stim #sciCharWrap{animation:none!important}`): add `.low-stim #petCharWrap{animation:none!important}` so the idle bob stops in low-stim (recon found this gap). Reactions are already gated in `react()`.
- [ ] **Step 3:** `breakdown-mode.html:176` mobile `#petCharWrap{display:none!important}` — **leave as-is** (keep pet hidden on the mobile-pinned scientist to avoid clutter); note the decision in the checklist. (No edit unless you judge otherwise — if so, justify.)
- [ ] **Step 4: Verify** — extend harness with a game-stage sim: a `.scientist-stage` containing `#petCharWrap` + a fake `sd`; call the render path (or directly set innerHTML via `buildPetSVG`) and assert the pet appears; toggle a `body.low-stim` class and assert the idle animation computed-style is `none`. `window.__PETSTAGE__ = {rendered, lowStimStopsIdle}`. Run; require green + prior globals green. Screenshot a pet in a game-stage-shaped container.
- [ ] **Step 5: Commit** `feat(scientist): render equipped pet on game pages + low-stim idle gate` + trailers.

## Task 4: Full sweep + morning checklist
**Files:** Extend harness; production files only if a defect surfaces.
- [ ] **Step 1:** Extend harness into a final sweep `window.__PETSWEEP__ = {cells, errors:[]}`: all 9 pets × reaction classes (`pet-idle`,`pet-correct`,`pet-wrong`,`pet-streak`) applied to the wrapper (assert class applies + no render error), at tank + 44px; plus a low-stim pass. Assert isolation across a full 9-pet render (no shared gradient id).
- [ ] **Step 2: Verify + screenshot** every pet (large grid), a 44px row, a reaction row, and a `body.low-stim` render; resize 390px once. Assert 0 errors and all harness globals green. Write `tests/manual/pet-redesign-checklist.md` for the owner: the 9 pets + costs, the flagged decisions (redesigned silhouettes; podium-companion placement; costs unchanged; mobile hide kept; surprise-me inclusion), and any pet that reads awkwardly at 44px.
- [ ] **Step 3:** Fix any real defect (shared id, unshaded pet, low-stim bob still running, pet over the character/UI), re-run, note it. Else "no production fix needed."
- [ ] **Step 4: Commit** `test(scientist): pet redesign full sweep + morning checklist` + trailers.

## Self-Review
- Spec §3-§5 → Task 1 art (shaded + uid + viewBox frozen), Task 2 shop (mirrors heads; pet card renders real pet), Task 3 game-stage render + low-stim gate, Task 4 sweep. Ids/costs frozen (backward compat). uid isolation asserted. `none`/null=empty asserted. No DB migration, no filter/motion. Low-stim idle gate added (recon gap). Independent of `buildSVG`.
- Placeholder note: exact pet silhouettes authored by the implementer to the species hints; the checklist surfaces them for the owner.
