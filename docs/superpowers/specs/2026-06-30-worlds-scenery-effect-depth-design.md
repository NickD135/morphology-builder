# Worlds Scenery + Effect Depth (Design Spec)

**Date:** 2026-06-30
**Status:** Approved design, pending implementation plans
**Builds on:** Phase 2 (`docs/superpowers/specs/2026-06-30-lab-shop-phase2-worlds-effects-design.md`) — the worlds + effects systems shipped 2026-06-30, merged to local `main`.

---

## 1. Background & Motivation

Phase 2 shipped 8 animated world backdrops and 7 new effects. On review, two visual gaps surfaced:

1. **Worlds are bare.** The backdrop is a gradient + floor + grid + a simple **text-glyph drift** (emoji/dots floating up or down, in `_driftSpawner`). The user wants **bespoke SVG scenery** per world — e.g. fish *swimming* in Aquatic, trees and falling leaves in Forest — to make each world a place, not a gradient.
2. **Effects read flat.** Every effect renders particles in a **single layer in front of the character**, and several "effects" (aura, divine, shimmer, quantum, vortex) are really a **box-shadow glow on the bounding box** that reads as a rectangular **border**, not energy around the character. The user wants effects to **wrap around the character in 3D** — particles passing behind *and* in front.

This spec covers both as **two independent components**, built and shipped as **two phases**.

**Owner decisions (this session):**
- World scenery: **all 8 worlds get bespoke animated SVG scenery** (not a subset).
- Effect depth: **engine-wide behind/front split** (not just the worst offenders).

---

## 2. Goal

Make the equipped world a lively hand-authored scene behind the character, and make equipped effects wrap the character with front/back depth — both inheriting the existing low-stim / reduced-motion gating, with no regression to Phase 2 behaviour and no new dependencies (vanilla JS, no build).

**Non-goals (out of scope):**
- The Phase 3 character/item **art port** (re-rendering the SVG character + items in the mockup's dimensional style), SVG hair, pet expansion — explicitly a later phase.
- Any DB / data-model change. Scenery and effect-depth are pure render changes; the equipped `scientist.world` / `scientist.effect` fields are unchanged.
- New worlds or new effects (content count stays 8 worlds / 25 effects).

---

## 3. Architectural decisions

| # | Decision | Reason |
|---|---|---|
| D1 | Two components, **two implementation plans**, scenery first. | They touch different modules and have very different risk. Scenery is additive to `wordlab-worlds.js`; effect-depth refactors the shared `wordlab-effects.js` engine used on 18 pages. Independent ship points. |
| D2 | Scenery is **hand-authored inline SVG** in `wordlab-worlds.js`, one scene-builder per world. | Matches the existing self-contained, no-build, no-asset-loading pattern (gradients + drift already live inline). Vector scenes scale crisply and animate via CSS transforms. |
| D3 | Scenery animates with **CSS transforms only** (translate/rotate/scale), keyframes injected once. | Cheap, GPU-friendly; only one world renders at a time (the equipped one), so cost is bounded. No JS-per-frame loops needed for scenery. |
| D4 | Effect depth = engine inserts a **behind-layer + front-layer** around the character; render fns opt particles into a layer; `_addNode` defaults to **front**. | Back-compatible: untouched effects keep working unchanged. Only effects that should wrap route their back-half to the behind layer. |
| D5 | Border-glow effects (aura, divine, shimmer, quantum, vortex) become a **radial glow in the behind-layer + sparkles in front**, replacing `box-shadow` on `el`. | Removes the rectangular "border" look; produces energy *around* the character. |
| D6 | Low-stim / reduced-motion: scenery shows **static props, frozen sprites**; effects already hard-gate via `_calm()`/`isLowStimMode`. | Sensory-safe; a calm static diorama is fine, motion is not. Reuses existing gates. |

---

## 4. Component A — Bespoke world scenery

### 4.1 Layering (inside the existing `.wlworld` panel, all behind the character)
From back to front:
1. **Wall gradient** — existing (`panel.style.background = w.wall`).
2. **Mid scenery** — a static SVG layer of world props (seaweed, tree trunks, planets, mountains, flasks). New.
3. **Animated sprites** — a layer of moving SVG sprites (fish, leaves, clouds, embers). New.
4. **Floor** — existing (`.wlworld-floor`).
5. **(Optional) Foreground prop** — a thin SVG element (seaweed tips / grass / lab bench edge) rendered *in front of the character's feet* for diorama depth, where it suits the world. This is the one scenery element that sits in front of the character; implemented as a sibling appended after the character in the stage, or a high-z child of the panel clipped to the floor band.

### 4.2 Architecture
- New `SCENES` map keyed by world id, parallel to `WORLDS`:
  `SCENES[id] = { props: '<svg>…</svg>' , sprites: [ {svg, count, anim, durRange, ...} ], foreground?: '<svg>…</svg>' }`
  (exact shape finalised in the plan; `props` is a static SVG string, `sprites` describes repeated animated SVG sprites.)
- `_buildPanel(w)` extended (or a new `_buildScene(panel, world)`) to inject the mid scenery SVG and spawn the sprite layer.
- Sprite motion via injected CSS keyframes (e.g. `wlwFishSwim`, `wlwLeafFall`, `wlwCloudDrift`), staggered per sprite via inline `animation-delay` / `--*` custom props — same technique the current drift uses.
- Sprites that traverse (fish, clouds, comet) loop; sprites that fall (leaves, embers) respawn on a tracked interval like the current drift (so teardown via the existing `_active` intervals works unchanged).
- SVG is **trusted, hand-authored** strings (no user input) — safe to inject.

### 4.3 Per-world content (final list)
| World | Static props | Animated sprites |
|---|---|---|
| Aquatic (`underwater`) | seaweed clumps, sandy mound | schooling **fish** (varied paths/sizes), rising bubbles, light rays |
| Forest (`forest`) | layered tree silhouettes, bushes | **falling/tumbling leaves**, a flitting bird |
| Galaxy (`galaxy`) | distant planets, ringed planet | drifting stars, a comet streak |
| Volcano (`volcano`) | volcano cone, rock ledges | **rising embers**, lava glow pulse, smoke wisps |
| Candy (`candy`) | candy-cane pillars, gumdrops | floating sprinkles + lollipops, soft clouds |
| Sunset (`sunset`) | rolling hills, sun disc | slow-drifting clouds, shimmering sun glow |
| Neon Grid (`neon`) | horizon line, neon arch | pulsing grid, gliding neon shapes |
| Lab (`lab`) | shelves, bubbling flasks | floating molecules, rising flask bubbles |

### 4.4 Low-stim / reduced-motion
`_calmMotion()` (already in the module) true → build the **static** mid-scenery + props, **skip the sprite spawners** / freeze sprite animations (the injected CSS already kills `.wlworld *` animations under `body.low-stim` + `@media(prefers-reduced-motion:reduce)`). The diorama still reads; nothing moves.

### 4.5 Performance
One world rendered at a time; sprite counts bounded per world (~6–12 nodes). `WLWorlds.stop()` already removes the panel and clears intervals — extended only to ensure any new sprite intervals are tracked in the same `_active` state.

---

## 5. Component B — Effect depth / 3D wrap

### 5.1 The layer model
Today effects attach particles directly to the target element `el` (the character wrapper / `.scientist-stage`), all at z-index 7–13 — in front of the character SVG (z ~1–2). To wrap:

- On `WLEffects.start(id, el)`, the engine ensures two positioned containers exist inside `el`:
  - `.wlfx-behind` — z-index **4** (above the world panel at z 0–2, below the character).
  - `.wlfx-front` — z-index **11** (above the character).
- The **character** is bumped to a mid z-index (**5**) so it sits between the two layers. On the scientist stage the character is `.lab-charwrap` (already z 2 → adjust); on game pages it's `#sciCharWrap` inside `.scientist-stage`.
- Render functions add particles to **behind** or **front**. New helpers `_addNodeBehind(el, node)` / `_addNodeFront(el, node)`; existing `_addNode(el, node)` **aliases front** (back-compat — every current effect keeps rendering exactly as now until migrated).

### 5.2 Effect migration
- **Orbit effects** (aura, galaxy, vortex, electric, rainbow, radioactive, pixel, divine, quantum, the premium lasers/quark-rain/blackhole) split their orbiting particles so roughly half spawn behind, half in front → the wrap.
- **Border-glow effects** (aura, divine, shimmer, quantum, vortex): replace the `box-shadow` on `el` with a soft **radial-gradient glow element in `.wlfx-behind`** (a halo behind the character) plus the existing sparkles in `.wlfx-front`.
- **Fall/rise effects** (snow, petals, confetti, bubbles, fire, frost, hearts, smoke, quark-rain): can stay mostly front, but may seed a fraction behind for subtle depth (optional per effect).
- Migration is **incremental and back-compatible**: an unmigrated effect renders in front exactly as today.

### 5.3 Teardown
`stop(el)` extended to remove `.wlfx-behind` / `.wlfx-front` containers and restore the character's z-index, in addition to the existing node/interval/raf/inline-style cleanup. The two layers are created idempotently (reused if present) and torn down on stop.

### 5.4 Constraints inherited
- `start()` still hard-returns under low-stim; `_calm()` still gates preview/equip on scientist.html. No change to the gating — the layers only exist while an effect is running.
- Z-index budget stays coherent with worlds: world panel 0–2 < behind-fx 4 < character 5 < front-fx 11. The world scenery's optional foreground prop (§4.1.5) sits above the character near the floor — namespaced so it doesn't collide with front-fx.

---

## 6. Files touched

| File | Component | Change |
|---|---|---|
| `wordlab-worlds.js` | A | `SCENES` map (8 scenes) + scene/sprite builder + injected keyframes; `_render`/`_buildPanel` wire it; `stop()` covers new intervals. |
| `wordlab-effects.js` | B | behind/front layer setup in `start()`; `_addNodeBehind`/`_addNodeFront` (+ `_addNode` front alias); migrate orbit + border-glow effects; `stop()` tears down layers + restores z. |
| `scientist.html` | B (CSS) | character/layer z-index coherence on the shop stage (`.lab-charwrap`), if needed, so behind-fx sits behind it. |
| game pages (`.scientist-stage`) | B (CSS) | ensure `#sciCharWrap` z-index allows a behind-fx layer; verify no per-page override breaks it. |

(Scenery needs no HTML changes — it's all inside the worlds module. Effect-depth may need small CSS z-index touches where the character is mounted.)

---

## 7. Execution sequence (two plans)

1. **Plan 1 — World scenery** (Component A). Additive to `wordlab-worlds.js`. Ship + verify (each world rendered as the test student, low-stim, mobile) before starting Plan 2.
2. **Plan 2 — Effect depth** (Component B). Shared-engine refactor; migrate effects with the front-default back-compat; verify no regression to the 25 effects + the premium 3, on the shop stage and a game page.

---

## 8. Verification (both)

Local `python3` **no-cache** server (see `reference_local_verify_js_cache` — defeat the JS cache: no-store server + `fetch(cache:'reload')` to repopulate, set the test session BEFORE navigating). Test account only (Test 2). Cache-bust every reload.

- **Scenery:** equip each of the 8 worlds → the bespoke scene renders behind the character with its props + moving sprites; toggling/ switching worlds tears down cleanly (one panel, no sprite-node accumulation after rapid switches); low-stim → static scene, frozen sprites; mobile 390px → scene contained, no overflow.
- **Effect depth:** equip an orbit effect → particles visibly pass **behind and in front** of the character (sample a behind-layer node + a front-layer node); aura/divine/shimmer read as a glow **around** the character, not a rectangular border; switch through all 25 effects → none regress (still render, still tear down to zero leftover nodes); premium 3 still multi-layer; works on the shop stage AND a game-page `.scientist-stage`.

---

## 9. Open items for the plans
- Final `SCENES` entry shape (string props vs structured sprite descriptors) — decide in Plan 1.
- Per-effect behind/front particle split ratios — tune in Plan 2 during visual review.
- Whether the optional scenery foreground prop (§4.1.5) is worth it per world, or dropped to keep the floor uncluttered — decide per world in Plan 1.
- Exact character z-index touch points per page for the behind-fx layer — enumerate in Plan 2.
