# Lab Shop — Phase 2: Animated Worlds + 7 New Effects (Design Spec)

**Date:** 2026-06-30
**Status:** Approved design, pending implementation plan
**Phase 1 reference:** `docs/superpowers/specs/2026-06-29-lab-shop-reskin-design.md` (§11 Future phases)
**Mockup reference:** `docs/superpowers/specs/2026-06-29-lab-shop-mockup.html` (`WORLDS` block, `fx(...)` effect list)

---

## 1. Background & Motivation

Phase 1 reskinned `scientist.html` into the Lab Shop (dressing-room + shop) wired to the existing
SVG character and data layer. It deliberately deferred two genuinely-new content systems to Phase 2:

- **Animated worlds** — a backdrop scene behind the character (the reserved-but-unused `background`
  concept). Net-new architecture.
- **~7 new particle effects** — the effects catalogue currently has 18; the mockup defines ~25.

This spec covers **both**, built together. Both extend systems that already exist and already render
the character's cosmetics across all 14 character-bearing pages, so the risk is contained.

**Owner decisions (this session):**
- Build **both** pieces as one Phase 2.
- Worlds appear **everywhere the character appears** (not just the dressing-room stage).
- Worlds are **gradient + subtle themed motion** (low-stim / reduced-motion → static gradient only).
- The 3 highest-rarity effects (Laser Grid, Quark Rain, Black Hole) must be **richer and more
  in-depth** than the commons — matching the existing Divine/Quantum/Vortex bar.

---

## 2. Goal

Add 8 animated world backdrops and 7 new particle effects to the Lab Shop, wired entirely to the
**existing data layer**, **existing effects engine pattern**, and **existing multi-page cosmetic
rendering** (`_startEquippedEffect` / `_effectTargets`). Ship as one coherent piece.

**Non-goals (explicitly out of scope):**
- SVG hair, pet expansion, porting mockup art into the SVG renderer — these stay **Phase 3**.
- Any change to `WLScientist.buildSVG`'s 80×120 character SVG (worlds are a *stage sibling*, not in
  the character SVG).
- Any database schema migration (the `scientist` jsonb gains a `world` key with no DDL).
- Repurposing the existing teacher-custom `item_type:'background'` slot (it is a *frontmost in-SVG
  overlay*, semantically the opposite of a behind-the-character backdrop).

---

## 3. Architectural decisions

| # | Decision | Reason |
|---|---|---|
| D1 | New 7 effects go **only** in `wordlab-effects.js` (`EFFECTS` + `fx*` + `_fns`). | Shop pill, cards, preview, equip, persistence, multi-page render, and the low-stim guard are all data-driven off `WLEffects.EFFECTS`. Zero downstream changes. |
| D2 | Worlds get a **new module `wordlab-worlds.js`** (`WLWorlds`), lifecycle-identical to `WLEffects`. | Reuses a proven start/stop/preview + state-map + teardown pattern; keeps worlds isolated and independently testable; avoids bloating `wordlab-effects.js`. |
| D3 | A world renders as a **contained rounded "scene panel"** behind the character (its own positioned child), **not** full-bleed. | Full-bleed would clash with each game page's own background palette. A framed diorama looks intentional on every surface. |
| D4 | Worlds render on the **large** character surfaces only: scientist.html stage, `.scientist-stage` (game pages), `#hubSciAvatar` (landing). **Excluded:** the ~40px header pill `#wlScientistWidget`. | A backdrop behind a tiny top-bar pill reads as noise. |
| D5 | New persisted field **`scientist.world`** (string id, default `null`). | Mirrors how `scientist.effect` is stored/loaded. No DDL — it's a jsonb key. |
| D6 | `WLScientist.buildSVG` is **not modified**. The world is appended as a stage sibling behind `.lab-charwrap` / the avatar. | Keeps the character renderer single-purpose; no ripple to other pages' character rendering. |
| D7 | Low-stim / reduced-motion **suppresses world drift particles but keeps the static gradient**, and the **Worlds pill stays visible** (unlike Effects/Dances pills which are hidden). | A calm static gradient is not a sensory problem; students on low-stim should still get a backdrop. |
| D8 | The 3 premium effects ship **lighter equipped-variant / richer preview-variant**. | Equipped effects run continuously on game pages — perf budget. Preview (shop click) can be richer. Matches the existing `intense` flag convention. |

---

## 4. Component A — The 7 new effects

Added to `wordlab-effects.js`: one `EFFECTS` entry + one `fx<Name>(el, intense)` function + one
`_fns` registration each. Every function follows the existing discipline:
`_ensureRelative(el)` → `_injectStyle(id, css)` (dedup) → spawn via `_makeParticle` / `_addNode` →
loop via `_addInterval` / `_addRAF` with an `if (!_active.has(el)) return;` guard so `stop(el)` halts
it cleanly. Particles stay in the **z-index 7–13** band. Any novel teardown need (body-appended node,
added class, canvas) must be cleared in `stop()` (see how `pixel` clears `wlfx-pixelated` + its
body filter).

### 4.1 Catalogue (live quark scale)

The mockup's 60–900 prices are from an older economy; these map onto the live scale (commons 350–500,
rare 600–900, epic 1000–1500, legendary 2000+). **Costs are tunable** before/after ship.

| id | name | icon | color | rarity | cost | motion summary |
|---|---|---|---|---|---|---|
| `hearts-fx` | Hearts | 💖 | `#f9417f` | common | 450 | hearts rise & fade |
| `snow` | Snowfall | ❄️ | `#dff4ff` | common | 400 | snowflakes drift down, gentle sway |
| `petals` | Cherry Petals | 🌸 | `#ffb7d5` | rare | 700 | petals tumble/rotate as they fall |
| `smoke` | Lab Smoke | 💨 | `#cbd5e1` | rare | 700 | soft smoke plumes rise & dissipate |
| `lasers` | Laser Grid | 🔺 | `#ff3cc8` | epic | 1200 | **premium — see 4.2** |
| `quark-rain` | Quark Rain | ⚛️ | `#b9a6ff` | epic | 1300 | **premium — see 4.2** |
| `blackhole` | Black Hole | 🕳️ | `#9b7bff` | legendary | 2500 | **premium — see 4.2** |

The 4 commons/rares (`hearts-fx`, `snow`, `petals`, `smoke`) are straightforward single-layer particle
streams in the spirit of the existing `bubbles`/`frost`/`confetti`.

### 4.2 Premium effects (must match the Divine/Quantum/Vortex richness bar)

These are multi-layer. Reference richness: `fxDivine` (rotating conic-ray halo + pulsing glow + rising
sparkles), `fxQuantum` (chromatic-aberration drop-shadows + dimensional glow oval + portal rings +
flicker + bursts).

**🔺 Laser Grid (`lasers`, epic)** — synthwave targeting scene:
- A perspective grid panel in the backdrop that scrolls toward the viewer.
- A bright horizontal **scan-line** sweeping vertically over the character on a cycle.
- Crossing **diagonal beams** that fire periodically: thin hot white core + magenta/cyan glow, brief
  afterglow fade.
- Small **impact sparks** where beams terminate.
- Subtle magenta/cyan **rim glow** on the character (`drop-shadow` filter).
- Equipped variant: fewer beams, slower cadence. Preview: denser, faster.

**⚛️ Quark Rain (`quark-rain`, epic)** — depth-layered particle-physics shower:
- Falling glowing quark glyphs in the three colour-charge hues (red `#ff4d6d`, green `#4dff88`,
  blue `#4db8ff`) with vertical **motion-blur streaks**.
- **Depth:** small/dim particles = background layer; large/bright = foreground layer.
- Occasional **heavy particle** that falls slower with a trailing tail and a **splash-burst** of tiny
  sparks at the floor line.
- A faint **collision flash** at random intervals.
- Equipped variant: lower spawn rate, fewer heavies. Preview: richer.

**🕳️ Black Hole (`blackhole`, legendary)** — the grail, most elaborate:
- Central **dark sphere** with a rotating **accretion-disk** ring (conic gradient orange→violet→cyan).
- **Gravitational-lensing** halo glow around the sphere.
- A **starfield + particles spiralling inward** with decaying orbital radius, vanishing at the centre
  (the signature "everything gets sucked in" motion).
- Occasional **polar jet** flares top/bottom.
- Subtle **space-warp pulse** on the character (scale/blur breathing).
- Equipped variant: fewer in-fall particles, calmer pulse. Preview: full intensity.

### 4.3 Low-stim / reduced-motion
No new work. `WLEffects.start()` already hard-returns under `WordLabData.isLowStimMode()`, and
scientist.html's `_calm()` gates every preview/equip entry point (checks `body.low-stim`,
`isLowStimMode()`, and `prefers-reduced-motion`). New effects inherit all of it.

---

## 5. Component B — Animated worlds

### 5.1 New module `wordlab-worlds.js` → `WLWorlds`
Public API mirrors `WLEffects`:
- `WLWorlds.start(worldId, el)` — tears down any prior world on `el`, builds the scene panel as a
  positioned child behind the character, starts drift only if motion is allowed (caller gates via
  `_calm()`; module also self-checks low-stim like `WLEffects.start`).
- `WLWorlds.stop(el)` — removes the panel + clears intervals/RAFs/styles for `el` (own state map).
- `WLWorlds.preview(worldId, el)` — richer variant for shop hover/equip if needed (parity with effects).
- `WLWorlds.WORLDS` — the catalogue (single source of truth).

The scene panel is a `position:absolute; inset:…; border-radius:…; z-index:0` (or negative) `<div>`
sized to sit **behind** the character within the target container, with:
- `wall` background gradient,
- a `floor` band + perspective `grid` lines,
- a soft `glow`,
- a **themed drift layer** (particles) chosen per world, suppressed under low-stim/reduced-motion.

### 5.2 Catalogue (8 worlds, gradients lifted verbatim from the mockup `WORLDS` block)

| id | name | drift theme | rarity | cost |
|---|---|---|---|---|
| `lab` | Lab | dust motes | common | **0 (free)** |
| `galaxy` | Galaxy | drifting stars | rare | 350 |
| `underwater` | Aquatic | rising bubbles | rare | 350 |
| `sunset` | Sunset | slow haze | rare | 400 |
| `forest` | Forest | floating leaves | rare | 400 |
| `neon` | Neon Grid | scan shimmer | epic | 500 |
| `candy` | Candy | floating sprinkles | epic | 500 |
| `volcano` | Volcano | rising embers | epic | 800 |

Mockup gradient values (`wall` / `floor` / `grid` / `glow`) are copied verbatim into the catalogue —
see the mockup `this.WORLDS` block. Costs tunable. Default equipped world = **none** (`world:null`)
which preserves today's plain dark stage (`#15131f` + podium glow).

### 5.3 Multi-surface rendering
Add `_startEquippedWorld(sd)` to `wordlab-scientist.js`, mirroring `_startEquippedEffect`:
- Reuse `_effectTargets()` **minus** the header widget (`_widgetEl`) → a `_worldTargets()` helper, OR
  filter inside `_startEquippedWorld`. Targets: `.scientist-stage`, `#hubSciAvatar`, and (on the
  scientist page) the stage — though the scientist page handles its own world in `renderStage`.
- Called from the same place(s) `_startEquippedEffect` is called (after character render/refresh).
- `wordlab-worlds.js` is added to the **same 14 pages** that load `wordlab-effects.js` (all game
  pages + landing + scientist), loaded **before** the inline scripts and after `wordlab-data.js`.

### 5.4 Low-stim / reduced-motion
- Worlds pill **stays visible** in low-stim (D7) — do **not** add `[data-cat="worlds"]` to the
  pill-hiding rule.
- The scene-panel **drift layer** is suppressed when `_calm()` is true (static gradient remains).
- Add the world-panel class to scientist.html's `body.low-stim … {animation:none!important}` kill-list
  and give it a paired `@media(prefers-reduced-motion:reduce)` rule.

---

## 6. Component C — Wiring (scientist.html + data layer)

### 6.1 Data layer (`wordlab-data.js`)
- `saveScientist(...)` — add `world` to the allowlisted fields it will persist (mirror `effect`).
- `getStudentData()` / `getClass()` — ensure the `scientist` jsonb round-trips `world` (it's a jsonb
  blob, so typically no column change; confirm no field-stripping allowlist on read).

### 6.2 Shop (`scientist.html`)
- **Pill:** add a 10th `WL.CATS` entry
  `{id:'worlds', label:'Worlds', icon:'🌍', field:'world', src:()=>WLShopData.worlds}`.
- **Cards:** world cards render a **mini gradient swatch** preview (reuse the `_colourBg`-style
  approach; a world's `wall` gradient as the thumb). Generic `WL.cardEl` path handles them since the
  category has a `field` + `src`.
- **Ownership key:** worlds use a bare `id` ownKey (default) — confirm `WL.ownKey` needs no special
  case, or add `worlds → 'world_'+id` for namespace safety (decide in plan; effects use `'effect_'`).
- **Equip:** new `WL.equipWorld(id)` mirroring `WL.equipEffect`: set `WL.scientist.world`, persist via
  `saveScientist({world})`, re-render grid, then `WLWorlds.stop(stage)` + (`!_calm()` ?
  `WLWorlds.start(id, stage)` : keep static). Toggle behaviour: clicking the equipped world re-equips
  `null`/none (like effects toggle to `'none'`).
- **Stage:** `WL.renderStage` appends the world panel behind `.lab-charwrap`/podium (the stage's
  `innerHTML` is wiped each render, so the world must be re-applied on every `renderStage`, exactly
  like the effect restart already is).

### 6.3 CSS
- World-panel base class (positioning, radius, overflow) in scientist.html `<style>` (and a shared
  rule the module can rely on, or fully inline-styled by the module for portability across the 14
  pages — **prefer module-injected styles** so non-scientist pages need no new CSS).

---

## 7. Files touched

| File | Change |
|---|---|
| `wordlab-effects.js` | +7 `EFFECTS` entries, +7 `fx*` functions, +7 `_fns` registrations; extend `stop()` if a premium effect needs novel teardown. |
| `wordlab-worlds.js` | **New module.** `WLWorlds` (start/stop/preview/WORLDS) + injected styles + 8-world catalogue. |
| `wordlab-shop-data.js` | +`worlds` array; export it. |
| `wordlab-scientist.js` | +`_startEquippedWorld` (+ `_worldTargets`); call alongside `_startEquippedEffect`. |
| `wordlab-data.js` | `saveScientist` persists `world`; confirm read round-trips it. |
| `scientist.html` | +`worlds` pill in `WL.CATS`; +`WL.equipWorld`; world card swatch; `renderStage` world layer; low-stim CSS for the panel; `<script src="wordlab-worlds.js">`. |
| 13 other character pages | Add `<script src="wordlab-worlds.js">` (the same set that loads `wordlab-effects.js`). |

---

## 8. Verification

Local server `python3 -m http.server 8080`, Playwright as the **test account only** (Test 2,
`ec4c1e84-…`, via `WordLabData.startSession`). **Cache-bust** every reload (`?cb=N`) — a stale cache
masked Phase 1's polish this session.

1. **Effects — each of the 7:** open scientist.html → Effects pill → click each new effect → confirm
   it previews on the stage character, persists (`scientist.effect`), and the premium 3 visibly
   layer (scan-line/beams; depth + splash; accretion disk + in-fall). Switch effect → confirm the
   old one tears down (no leaked nodes; inspect `el.children`).
2. **Worlds — each of the 8:** Worlds pill → click each → confirm the scene panel renders behind the
   character with the right gradient + drift; persists (`scientist.world`); toggling re-equips none.
3. **Everywhere:** equip a world + an effect, then load a game page (e.g. `breakdown-mode.html`) and
   `landing.html` → confirm the world renders behind `.scientist-stage` / `#hubSciAvatar` and the
   effect plays, with no clash with the page background.
4. **Low-stim:** enable low-stim → Effects/Dances pills hidden, **Worlds pill still shown**; equip a
   world → gradient shows, **no drift**; equip nothing animates. Same for OS `prefers-reduced-motion`.
5. **Teardown / perf:** rapidly switch worlds and effects; confirm `WLWorlds.stop`/`WLEffects.stop`
   leave no orphaned nodes/intervals (check `_active` maps + DOM child counts). Confirm a game page
   with an equipped world+effect stays smooth.
6. **Mobile:** scientist.html < 760px stacked layout — world panel scales to the stacked stage; game
   pages 320–480px — backdrop doesn't overflow.

---

## 9. Open items to resolve in the implementation plan
- Exact world scene-panel sizing/inset per surface (stage vs game `.scientist-stage` vs hub avatar).
- Whether `WL.ownKey` namespaces worlds (`'world_'+id`) or uses bare id.
- Final premium-effect particle counts for the equipped (non-intense) variant to hold perf on game
  pages.
- Final quark costs (effects + worlds) — placeholder values above.
