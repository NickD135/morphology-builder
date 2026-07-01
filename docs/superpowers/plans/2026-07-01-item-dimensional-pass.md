# Built-in Item Dimensional Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Give the ~40 built-in inline SVG items (head/face/wings accessories) a restrained dimensional treatment matching the shaded base character, with zero geometry change.

**Architecture:** In-place enrichment of the item SVG strings in `wordlab-scientist.js` — replace flat fills with per-item uid-suffixed gradients + add thin highlight/occlusion sub-shapes *inside* each item's existing outline. No silhouette/position/size change. No motion/filters added.

**Tech Stack:** Vanilla JS, inline SVG, Playwright + no-cache server for verification.

**Spec:** `docs/superpowers/specs/2026-07-01-item-dimensional-pass-design.md`

## Global Constraints
- Vanilla JS, no build, no new deps, no DB change (`wordlab-shop-data.js` untouched).
- **Frozen geometry:** no item's `cx/cy/x/y/width/height/points/d/rx/ry/transform` changes — depth is added only via gradient fills + new sub-shapes inside the existing outline.
- **Teacher custom items (`customImg`/`customSlots`) untouched.**
- **Animated items keep their `<animate>`/`<animateTransform>` exactly** — enrich static fills only, never touch timing/values.
- Per-item gradient ids **uid-suffixed** (reuse the per-call `uid` already in `buildSVG`); any new `<defs>` gradient appended to `allDefs` or defined inline in the item string. No two characters on a page may share an item gradient id.
- No SVG filters, no motion added. Static only (low-stim safe). Legible at 44px. Restraint: ≤3-stop gradient + one highlight + optional seam-occlusion per item (spec §4).
- Verification = synthetic harness (no login); merge **local, not pushed**.
- **Coat patterns are NOT re-shaded** — the base coat form-shade+sheen overlay (sub-project 1) already adds depth over patterns; re-tiling risks artifacts. Out of scope.

## Key facts (from `wordlab-scientist.js`)
- Items live in three object literals inside `buildSVG`: `headAccSVG` (18 keys: goggles_head, grad_cap, top_hat, hard_hat, beanie, party_hat, wizard_hat, flower_crown, halo, ninja_headband, space_helmet, chef_hat, pirate_hat, headphones, cat_ears, bunny_ears, dino_spikes, unicorn_horn, propeller_cap, tiara, viking_helmet, antenna, + animated: flame_crown, ice_crown, galaxy_halo — count ~24), `faceAccSVG` (~20 incl. animated laser_eyes, diamond_monocle, glowing_mask), `wingsSVG` (4: angel_wings, fire_wings, crystal_wings, shadow_wings).
- Each value is a trusted inline SVG string (safe to edit). `uid` is in scope inside `buildSVG`.
- Draw order: accessories render on TOP of the shaded head/face; wings render behind the body. Unchanged.

## The recipe (apply per item, restrained — spec §4)
1. Replace the item's main flat `fill="#solid"` with a 2-3 stop gradient (lighter top-left → base → slightly darker bottom-right), same hue, via a uid-suffixed `<linearGradient>`/`<radialGradient>` prepended to the item string (`<defs>…</defs>` inside the item, ids like `<key>G${uid}`).
2. Add ONE thin low-opacity highlight sub-shape (ellipse/line, `rgba(255,255,255,.35-.5)`) on the upper-left, inside the outline.
3. Optional seam occlusion (`rgba(0,0,0,.12-.2)`) where the item meets the head/coat.
4. Metal/gem items (crown, tiara, monocle, medals, viking/space helmet): a brighter specular dot + stronger gradient. Cloth/soft (beanie, party_hat, chef_hat, wings): soft matte gradient only.
5. Animated items: enrich static fills only; leave every `<animate*>` untouched.
Keep every coordinate identical. If an item is too small to benefit (tiny face stickers: star_sticker, bandaid, face_paint, bubble_gum), leaving it flat is acceptable — note it.

---

## Task 1: Head accessories batch
**Files:** Modify `wordlab-scientist.js` (`headAccSVG`). Create `tests/manual/item-dimensional-pass-harness.html`.

- [ ] **Step 1:** Apply the recipe to each `headAccSVG` entry (all ~24 keys incl. the 3 animated). Read each current SVG string, add a uid-suffixed gradient for its main fill + a highlight, keep all coordinates + any animations. Metal items (crown, tiara, viking_helmet, space_helmet, flame_crown, ice_crown) get specular; cloth items (beanie, party_hat, chef_hat, wizard_hat) get soft gradient only.
- [ ] **Step 2: Create the harness** `tests/manual/item-dimensional-pass-harness.html`: loads `../../wordlab-worlds.js` + `../../wordlab-shop-data.js` + `../../wordlab-scientist.js`; renders the character wearing EACH head item (iterate the head ids from `WLShopData.heads`) at large (150px) + 44px; writes `window.__HEADS__ = {count, errors:[], animatedIntact:bool, isolationOK:bool}`. `errors` = ids that threw or rendered no svg. `animatedIntact` = flame_crown/ice_crown/galaxy_halo still contain `<animate` or `<animateTransform`. `isolationOK` = two characters wearing the SAME animated item (e.g. galaxy_halo) don't share a gradient id (all `[id]` differ between the two svgs).
- [ ] **Step 3: Verify** — serve `cd /workspaces/morphology-builder && python3 -m http.server 8091 --bind 127.0.0.1 &`; Playwright MCP (`ToolSearch select:mcp__playwright__browser_navigate,mcp__playwright__browser_evaluate,mcp__playwright__browser_take_screenshot`; plugin variant if needed) → harness `?cb=<n>`; read `__HEADS__`. Require `errors.length===0 && animatedIntact && isolationOK`. Screenshot the head grid (large + 44px). Kill server. Confirm in report: silhouettes unchanged, items read dimensional, 44px legible.
- [ ] **Step 4: Commit** `feat(scientist): dimensional pass — head accessories` (+ trailers `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` / `Claude-Session: https://claude.ai/code/session_01DjZtyZpEo3SRyVoR3yuQRo`), harness included.

## Task 2: Face accessories batch
**Files:** Modify `wordlab-scientist.js` (`faceAccSVG`). Extend the harness.
- [ ] **Step 1:** Apply the recipe to each `faceAccSVG` entry (~20 incl. animated laser_eyes, diamond_monocle, glowing_mask). Glasses/goggles/monocle get a subtle lens gradient + a small glint highlight; soft stickers may stay flat if too small (note which). Keep coordinates + animations.
- [ ] **Step 2:** Extend harness → `window.__FACES__ = {count, errors:[], animatedIntact, isolationOK}` (animated = laser_eyes/glowing_mask/diamond_monocle contain `<animate`).
- [ ] **Step 3: Verify** as Task 1 (require errors 0, animatedIntact, isolationOK; screenshot face grid; confirm face features still read under the accessory).
- [ ] **Step 4: Commit** `feat(scientist): dimensional pass — face accessories` (+ trailers), harness included.

## Task 3: Wings batch
**Files:** Modify `wordlab-scientist.js` (`wingsSVG`). Extend the harness.
- [ ] **Step 1:** Apply a soft matte gradient (no hard specular) to each of the 4 wings, enriching the existing feather shapes; keep the existing `<animate>` opacity pulses. angel=soft white/indigo, fire=orange gradient, crystal=violet translucent, shadow=dark indigo.
- [ ] **Step 2:** Extend harness → `window.__WINGS__ = {count, errors:[], animatedIntact, isolationOK}`.
- [ ] **Step 3: Verify** as above (wings render behind body, still animate). Screenshot.
- [ ] **Step 4: Commit** `feat(scientist): dimensional pass — wings` (+ trailers).

## Task 4: Full item sweep + morning checklist
**Files:** Extend harness; only touch `wordlab-scientist.js` if a defect surfaces.
- [ ] **Step 1:** Render the FULL item set (heads + faces + wings) on the character across 2 skin tones (light + dark) + 2 reactions, large + 44px, in one grid; `window.__ITEMSWEEP__ = {cells, errors:[]}`.
- [ ] **Step 2: Verify + screenshot** every batch; assert 0 errors and `__HEADS__/__FACES__/__WINGS__` all pass. Write a `tests/manual/item-dimensional-pass-checklist.md` listing each item and one-line "what changed" for the user's morning review, plus any item deliberately left flat.
- [ ] **Step 3:** If a defect (misalignment, broken animation, shared id) surfaces, fix `wordlab-scientist.js`, re-run, note it.
- [ ] **Step 4: Commit** `test(scientist): full item dimensional-pass sweep + morning checklist` (+ trailers).

## Self-Review
- Spec §4 recipe → Tasks 1-3 per batch. Frozen geometry → no coordinate edits (verified by silhouette-unchanged screenshots + isolation/alignment). Animated items intact → `animatedIntact` assertions. Unique ids → `isolationOK`. Patterns descoped (documented). Teacher customs untouched (only the three inline objects edited). No filters/motion added.
- Placeholder scan: recipe is concrete; per-item stops tuned in-batch under the restraint ceiling (spec-sanctioned), logged in the checklist.
