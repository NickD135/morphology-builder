# Lab Shop — Effect Depth / 3D Wrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make equipped effects wrap the scientist with front/back depth — particles pass behind *and* in front of the character, and the "border-glow" effects (aura, divine, shimmer, quantum, vortex) become a halo *around* the character instead of a rectangular box-shadow on the bounding box.

**Architecture:** Insert two positioned layers (`.wlfx-behind`, `.wlfx-front`) inside every effect mount element `el`, with their z-index computed **relative to the character's actual z-index in that `el`** (not fixed constants). Render functions opt particles into a layer via `_addNodeBehind` / `_addNodeFront`; `_addNode` aliases **front** so every un-migrated effect renders exactly as before the layer split. Migrate the orbit and border-glow effects to split across layers. Pure render change — no DB, no new deps.

**Tech Stack:** Vanilla JS (no build), CSS transforms/keyframes, `wordlab-effects.js` engine, Playwright for verification against a local no-cache server.

## Global Constraints

- **No build system** — pure HTML/CSS/JS, no npm/bundler/TypeScript. (CLAUDE.md §10)
- **No new dependencies.** (spec §2 non-goals)
- **No DB / data-model change** — `scientist.effect` field unchanged. (spec §2, §3 D-note)
- **Content count frozen:** 25 effects, no new/removed effects. (spec §2)
- **Back-compatible migration:** an un-migrated effect must render in front exactly as today; `_addNode(el, node)` MUST alias `_addNodeFront`. (spec §5.1 D4)
- **Low-stim / reduced-motion gating is unchanged:** `start()` still hard-returns when `WordLabData.isLowStimMode()` is true; layers only exist while an effect runs. (spec §5.4)
- **Teardown to zero:** after `stop(el)`, no `.wlfx-behind`/`.wlfx-front` nodes remain and the character's z-index/inline styles are restored. (spec §5.3)
- **Z-budget must stay coherent with worlds** on the shared `.scientist-stage`: world panel `.wlworld` z0 / floor z1 / scene z2 / sprite z3 < **behind-fx** < character (`#sciCharWrap` z20) < **front-fx**. (verified against `wordlab-worlds.js:50-55`, `wordlab-scientist.js:1050`)
- **Verification is manual/Playwright** against a local **no-cache** server — the JS cache fools reloads; use a no-store server + `fetch(cache:'reload')` and set the test session BEFORE navigating. Test account **Test 2** only, never real students. (memory `reference_local_verify_js_cache`, `project_test_accounts`; spec §8)

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `wordlab-effects.js` | Effect engine | Add layer scaffolding in `start()`/`preview()`; add `_ensureLayers`/`_addNodeBehind`/`_addNodeFront`; `_addNode`→front alias; migrate orbit + border-glow effects; extend `stop()` to tear down layers + restore character z. |
| `scientist.html` | Shop stage CSS | Give `.lab-charwrap svg` an explicit z so the behind-fx layer can sit beneath it. |
| `wordlab-scientist.js` | Game/other mounts | No logic change expected; verify `#sciCharWrap { z-index:20 }` (line ~1050) is present so behind-fx lands beneath it. CSS-only touch if a page overrides it. |
| `tests/manual/effect-depth-verify.md` | Verification runbook | New: the exact Playwright steps + DOM assertions used at each task's verify step (so re-runs are repeatable). |

The engine is one file; the risk is concentrated in `start()`/`stop()` (Task 1). Effect migrations (Tasks 2–4) are mechanical, one repeated transformation. Cross-page CSS + full regression sweep is Task 5.

---

## Key facts the implementer must know (verified from the codebase)

1. **`el` is a container, the character is a descendant.** Effects mount on:
   - Shop (`scientist.html`): `WL.charEl` = `.lab-charwrap` (`z-index:2`, line 221-226); the character SVG is a **direct child** with **no explicit z-index** (`.lab-charwrap svg`, line 227).
   - Everywhere else via `wordlab-scientist.js:_effectTargets()` (lines 697-710): `#wlScientistWidget` (header widget), `.scientist-stage` (game pages — contains `#sciCharWrap` at `z-index:20`), `#sciSVGBig` (scientist.html big card), `#hubSciAvatar` (landing 44px avatar).
2. **On `.scientist-stage` the world panel is a sibling of the character** (`WLWorlds.start(worldId, stage)`), so behind-fx must clear the world sprite z (z3) yet stay below the character (z20).
3. **Existing per-particle `z-index:6..13`** in effect cssText only orders particles *within their layer* once layers become stacking contexts — they need not be changed.
4. **Effects that currently set `el.style.boxShadow`** directly: `electric` (line 352-354, transient flash), and the border-glow group via animated keyframes on a **child node** are: `shimmer` (child glow, line 152-160), `aura` (child ring, line 240-249). `divine`, `quantum`, `vortex` use `box-shadow` keyframes — confirm each during migration (Task 2). `stop()` already clears `el.style.boxShadow` (line 83).
5. **`_active` is keyed by `el`** and tracks `{intervals, rafs, nodes, styleIds}` (line 38-43). Nodes are appended to `el` today; after Task 1 they append to a layer that is itself a tracked node, so teardown still removes everything.

---

## Task 1: Layer scaffolding + behind/front helpers + teardown

**Files:**
- Modify: `wordlab-effects.js` — add helpers after `_addNode` (line 45-49); extend `stop()` (line 77-93); call `_ensureLayers` in `start()` (line 1224) and `preview()` (line 1238).
- Create: `tests/manual/effect-depth-verify.md`

**Interfaces:**
- Produces:
  - `_ensureLayers(el)` → `{behind: HTMLElement, front: HTMLElement}`. Idempotent (reuses existing layers on the same `el`). Sets the character's z-index if unset. Both layers are `position:absolute; inset:0; pointer-events:none; border-radius:inherit;` and are tracked in `_state(el).nodes`.
  - `_addNodeFront(el, node)` → appends `node` to the front layer, returns `node`.
  - `_addNodeBehind(el, node)` → appends `node` to the behind layer, returns `node`.
  - `_addNode(el, node)` → **aliases `_addNodeFront`** (back-compat).
- Consumes: existing `_state(el)`, `_ensureRelative(el)`.

**Design of `_ensureLayers` (resolves spec §9 "exact character z-index per page"):**
- Character node = `el.querySelector('#sciCharWrap') || el.querySelector(':scope > svg') || el.querySelector('svg')`.
- Read the character's numeric z-index via `getComputedStyle`. If it is `auto`/`NaN`, set the character to `position:relative` (if static) and `z-index:5`, and record that we set it (so teardown can restore). Call the resolved number `cz`.
- `behind.style.zIndex = Math.max(cz - 1, 4)` — guarantees it clears world sprites (z3) on `.scientist-stage` while staying below the character.
- `front.style.zIndex = cz + 1`.
- If no character node is found (e.g. layer not yet populated), fall back to `cz = 5`.

- [ ] **Step 1: Write the verification runbook** (this is the "test" — no JS unit harness exists in this repo; verification is Playwright DOM assertion per spec §8)

Create `tests/manual/effect-depth-verify.md`:

````markdown
# Effect Depth — Verification Runbook

Server (no-cache), from repo root:
```bash
python3 - <<'PY'
import http.server, socketserver
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store, max-age=0')
        super().end_headers()
socketserver.TCPServer(("0.0.0.0",8091), H).serve_forever()
PY
```

Playwright (Test 2 session set BEFORE navigating; every reload cache-busts):

1. Set `sessionStorage['wordlab_session_v1']` to the Test 2 student session, then `browser_navigate` to `http://localhost:8091/scientist.html?cb=<ts>`.
2. Equip an effect, then assert layers exist and are ordered:
   ```js
   const el = document.querySelector('.lab-charwrap');
   const b = el.querySelector('.wlfx-behind'), f = el.querySelector('.wlfx-front');
   const cz = +getComputedStyle(el.querySelector('svg')).zIndex || 5;
   return { hasBehind: !!b, hasFront: !!f,
            behindZ: +getComputedStyle(b).zIndex, charZ: cz, frontZ: +getComputedStyle(f).zIndex,
            ordered: (+getComputedStyle(b).zIndex < cz) && (cz < +getComputedStyle(f).zIndex) };
   ```
   Expect `hasBehind && hasFront && ordered === true`.
3. Unequip / equip a different effect, then assert zero leftovers:
   ```js
   const el = document.querySelector('.lab-charwrap');
   return { behindNodes: el.querySelectorAll('.wlfx-behind').length,
            frontNodes: el.querySelectorAll('.wlfx-front').length };
   ```
   After stop → both `0`. After switching to another effect → both `1` (idempotent, single pair).
````

- [ ] **Step 2: Add the helpers** — insert after `_addNode` (after line 49 in `wordlab-effects.js`)

```javascript
  // ── Depth layers (behind / front of the character) ────────────
  // el is a container; the character (SVG or #sciCharWrap) is a descendant.
  // Layer z-index is computed RELATIVE to the character's z so it works on
  // both scientist.html (svg auto-z) and game pages (#sciCharWrap z-index:20).
  function _ensureLayers(el) {
    const st = _state(el);
    if (st._layers && st._layers.behind.isConnected && st._layers.front.isConnected) {
      return st._layers;
    }
    _ensureRelative(el);
    const charEl = el.querySelector('#sciCharWrap')
                || el.querySelector(':scope > svg')
                || el.querySelector('svg');
    let cz = charEl ? parseInt(getComputedStyle(charEl).zIndex, 10) : NaN;
    if (charEl && (isNaN(cz))) {
      if (getComputedStyle(charEl).position === 'static') charEl.style.position = 'relative';
      charEl.style.zIndex = '5';
      cz = 5;
      st._charZFixed = charEl;      // remember so stop() can restore
    }
    if (isNaN(cz)) cz = 5;
    const mk = (cls, z) => {
      const d = document.createElement('div');
      d.className = cls;
      d.style.cssText = `position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:${z};`;
      el.appendChild(d);
      st.nodes.push(d);
      return d;
    };
    const behind = mk('wlfx-behind', Math.max(cz - 1, 4));
    const front  = mk('wlfx-front',  cz + 1);
    st._layers = { behind, front };
    return st._layers;
  }

  function _addNodeFront(el, node) {
    _ensureLayers(el).front.appendChild(node);
    _state(el).nodes.push(node);
    return node;
  }
  function _addNodeBehind(el, node) {
    _ensureLayers(el).behind.appendChild(node);
    _state(el).nodes.push(node);
    return node;
  }
```

- [ ] **Step 3: Make `_addNode` alias front** — replace the body of `_addNode` (lines 45-49)

```javascript
  function _addNode(el, node) {
    return _addNodeFront(el, node);   // back-compat: un-migrated effects render in front
  }
```

- [ ] **Step 4: Extend `stop()` to tear down layers and restore character z** — in `stop()` (line 77-93), after the existing `el.classList.remove('wlfx-pixelated');` line and before `_active.delete(el);`, add:

```javascript
    // Restore a character z-index we set in _ensureLayers
    if (state._charZFixed) { try { state._charZFixed.style.zIndex = ''; } catch {} }
    // Layer containers are tracked in state.nodes and already removed above;
    // clear the cached handle so a fresh start rebuilds them.
    state._layers = null;
```

Note: the layer `<div>`s are pushed to `state.nodes`, so the existing `state.nodes.forEach(... removeChild ...)` (line 82) already removes them. This step only clears the cached handles and restores z.

- [ ] **Step 5: Ensure layers exist on start/preview** — in `start()` after `_state(el); // initialise state` (line 1228) add `_ensureLayers(el);`. Do the same in `preview()` after its `_state(el);` (line 1241). (Belt-and-braces — helpers also lazily create them, but this guarantees a clean pair even for effects that never call an `_addNode*`.)

- [ ] **Step 6: Give the shop-stage SVG an explicit z** — in `scientist.html`, edit `.lab-charwrap svg` (line 227-231) to add `position:relative; z-index:2;` so the behind layer (which will compute `cz-1 = 1`, clamped to `max(1,4)=4`... see note) sits beneath it.

Replace:
```css
    .lab-charwrap svg{
      width:100%;
      height:auto;
      display:block;
    }
```
with:
```css
    .lab-charwrap svg{
      width:100%;
      height:auto;
      display:block;
      position:relative;
      z-index:6;
    }
```
Rationale: `.lab-charwrap` has no world panel inside it, so the behind layer only needs to sit under the SVG. With `cz=6`, behind = `max(5,4)=5`, front = `7`; the SVG (z6) sits cleanly between them.

- [ ] **Step 7: Run the runbook verify (scientist.html)**

Start the no-cache server, drive Playwright per `tests/manual/effect-depth-verify.md` Steps 1-3 with effect `aura`.
Expected: `ordered === true`; after stop, zero `.wlfx-*` leftovers; after switching effects, exactly one pair.

- [ ] **Step 8: Run the runbook verify (game page)**

Navigate to `http://localhost:8091/phoneme-mode.html?cb=<ts>` as Test 2, equip an effect via the header widget scientist, and assert against `el = document.querySelector('.scientist-stage')`, `charEl = #sciCharWrap`:
```js
const el = document.querySelector('.scientist-stage');
const b = el.querySelector('.wlfx-behind'), f = el.querySelector('.wlfx-front');
const cz = +getComputedStyle(el.querySelector('#sciCharWrap')).zIndex;
return { behindZ:+getComputedStyle(b).zIndex, charZ:cz, frontZ:+getComputedStyle(f).zIndex,
         behindAboveWorld: +getComputedStyle(b).zIndex > 3,
         ordered: +getComputedStyle(b).zIndex < cz && cz < +getComputedStyle(f).zIndex };
```
Expected: `charZ === 20`, `behindZ === 19`, `frontZ === 21`, `behindAboveWorld === true`, `ordered === true`.

- [ ] **Step 9: Commit**

```bash
git add wordlab-effects.js scientist.html tests/manual/effect-depth-verify.md
git commit -m "feat(effects): add behind/front depth layers to effect engine (back-compat front-alias)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01DjZtyZpEo3SRyVoR3yuQRo"
```

---

## Task 2: Migrate border-glow effects to halos (aura, shimmer, divine, quantum, vortex)

**Files:**
- Modify: `wordlab-effects.js` — functions `fxAura` (226-250), `fxShimmer` (140-161), `fxDivine`, `fxQuantum`, `fxVortex` (locate each by name).

**Interfaces:**
- Consumes: `_addNodeBehind`, `_addNodeFront` (Task 1).
- Produces: no new symbols; same function names/signatures `(el, intense)`.

**The transformation (applies to all five):** the glow that currently animates `box-shadow` on a **centred child oval** (or on `el` itself) becomes a **soft radial-gradient halo node placed in the BEHIND layer**, plus any existing sparkles kept in the FRONT layer. A `box-shadow` on an oval reads as a ring/rectangle in front; a `radial-gradient` div in the behind layer reads as light emanating from *around and behind* the character.

**Worked example — `fxShimmer` (replace the whole function, lines 140-161):**

```javascript
  // shimmer — soft colour-cycling halo of light behind the character
  function fxShimmer(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-shimmer', `
      @keyframes wlfxShimmerHue {
        0%   { background:radial-gradient(circle,rgba(99,102,241,0.55),rgba(99,102,241,0) 68%); }
        33%  { background:radial-gradient(circle,rgba(20,184,166,0.55),rgba(20,184,166,0) 68%); }
        66%  { background:radial-gradient(circle,rgba(168,85,247,0.55),rgba(168,85,247,0) 68%); }
        100% { background:radial-gradient(circle,rgba(99,102,241,0.55),rgba(99,102,241,0) 68%); }
      }
    `);
    const halo = _makeParticle(`
      left:50%; top:50%;
      width:190px; height:230px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      filter:blur(6px);
      animation:wlfxShimmerHue ${intense ? '1.5s' : '3s'} ease infinite;
    `);
    _addNodeBehind(el, halo);
  }
```

**Worked example — `fxAura` (replace the whole function, lines 226-250):** keep the visible ring but move it BEHIND and add a soft glow behind it; the ring now reads as energy circling the character rather than a box border.

```javascript
  // aura — colour-cycling energy ring + glow, wrapping behind the character
  function fxAura(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-aura', `
      @keyframes wlfxAuraColor {
        0%   { border-color:#6366f1; }
        25%  { border-color:#0d9488; }
        50%  { border-color:#a855f7; }
        75%  { border-color:#f59e0b; }
        100% { border-color:#6366f1; }
      }
      @keyframes wlfxAuraGlow {
        0%   { background:radial-gradient(circle,rgba(99,102,241,0.5),rgba(99,102,241,0) 66%); }
        25%  { background:radial-gradient(circle,rgba(13,148,136,0.5),rgba(13,148,136,0) 66%); }
        50%  { background:radial-gradient(circle,rgba(168,85,247,0.5),rgba(168,85,247,0) 66%); }
        75%  { background:radial-gradient(circle,rgba(245,158,11,0.5),rgba(245,158,11,0) 66%); }
        100% { background:radial-gradient(circle,rgba(99,102,241,0.5),rgba(99,102,241,0) 66%); }
      }
    `);
    const glow = _makeParticle(`
      left:50%; top:50%; width:200px; height:240px;
      transform:translate(-50%,-50%); border-radius:50%; filter:blur(8px);
      animation:wlfxAuraGlow ${intense ? '1.5s' : '3s'} linear infinite;
    `);
    _addNodeBehind(el, glow);
    const ring = _makeParticle(`
      left:50%; top:50%; width:152px; height:198px;
      transform:translate(-50%,-50%); border-radius:50%;
      border:3px solid #6366f1;
      animation:wlfxAuraColor ${intense ? '1.5s' : '3s'} linear infinite;
    `);
    _addNodeBehind(el, ring);
  }
```

- [ ] **Step 1: Migrate `fxShimmer`** — replace lines 140-161 with the worked example above.
- [ ] **Step 2: Migrate `fxAura`** — replace lines 226-250 with the worked example above.
- [ ] **Step 3: Migrate `fxDivine`** — read the current body; move its `box-shadow`/glow construct into a behind-layer `radial-gradient` halo (gold `rgba(251,191,36,*)`), keep its gold sparkles via `_addNodeFront`. Its existing "rays" node (grep `wlfxGoldRays`/line ~676 `inset:-20px;z-index:0`) → route to `_addNodeBehind`; the gold spark particles (`_addNode(el, p)` at ~702) → `_addNodeFront`.
- [ ] **Step 4: Migrate `fxQuantum`** — its `wlfxDimension` box-shadow keyframes (line ~714) become a behind-layer purple halo (`rgba(167,139,250,*)`/`rgba(99,102,241,*)`); any phase particles → `_addNodeFront`.
- [ ] **Step 5: Migrate `fxVortex`** — its glow/box-shadow → behind-layer halo; its spinning particles split (half `_addNodeBehind`, half `_addNodeFront`) so the vortex wraps.
- [ ] **Step 6: Verify (halo reads as glow, not border)**

For each of the 5 effects, on `scientist.html` (Test 2, no-cache):
```js
const el = document.querySelector('.lab-charwrap');
return { hasElBoxShadow: getComputedStyle(el).boxShadow !== 'none',
         behindChildren: el.querySelector('.wlfx-behind').childElementCount };
```
Expected: `hasElBoxShadow === false` (no rectangular box-shadow on the bounding box), `behindChildren >= 1` (halo present in the behind layer). Visually confirm via `browser_take_screenshot` the glow is around the character, not a rectangle.

- [ ] **Step 7: Commit**

```bash
git add wordlab-effects.js
git commit -m "feat(effects): border-glow effects become behind-layer halos (aura, shimmer, divine, quantum, vortex)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01DjZtyZpEo3SRyVoR3yuQRo"
```

---

## Task 3: Split orbit effects across behind/front (galaxy, electric, rainbow, radioactive, pixel)

**Files:**
- Modify: `wordlab-effects.js` — `fxGalaxy`, `fxElectric` (309-359), `fxRainbow` (362+), `fxRadioactive`, `fxPixel`.

**Interfaces:**
- Consumes: `_addNodeBehind`, `_addNodeFront`.
- Produces: same function names/signatures.

**The transformation:** particles that "orbit" or surround the character are split so **roughly half spawn behind, half in front**, producing the wrap. The simplest deterministic split: alternate by an index or a coin-flip per particle — `(_wrapCoin() ? _addNodeBehind : _addNodeFront)(el, node)`. Add this tiny helper once (in Task 1's block is fine, but if not present add it here):

```javascript
  function _addNodeWrap(el, node) {
    return (Math.random() < 0.5 ? _addNodeBehind : _addNodeFront)(el, node);
  }
```

**Per-effect edits:**
- **`fxGalaxy`** — the orbiting planet/orbit nodes (grep `_addNode(el, orbit)` ~line 515, `_addNode(el, star)` ~490, `_addNode(el, nebula)` ~477): route the **nebula** and half the **orbiting planets** to `_addNodeBehind`, the rest to `_addNodeFront`. Simplest: planets via `_addNodeWrap`, nebula via `_addNodeBehind`, drifting stars via `_addNodeFront`.
- **`fxElectric`** (309-359) — bolts (`_addNode(el, svg)` ~329) and sparks (`_addNode(el, sp)` ~347) → `_addNodeWrap` (lightning crackles both sides). Replace the transient `el.style.boxShadow` flash (lines 352-354) with a behind-layer flash node:
  ```javascript
      // Flash glow — behind the character so it reads as an aura, not a box border
      const flash = _makeParticle(`
        left:50%;top:50%;width:180px;height:220px;transform:translate(-50%,-50%);
        border-radius:50%;filter:blur(6px);
        background:radial-gradient(circle,rgba(147,197,253,0.7),rgba(147,197,253,0) 65%);
        transition:opacity .48s ease;`);
      _addNodeBehind(el, flash);
      setTimeout(() => { try { flash.parentNode && flash.parentNode.removeChild(flash); } catch {} }, 500);
  ```
  (Delete the `const prev = el.style.boxShadow; el.style.boxShadow = ...; setTimeout(... el.style.boxShadow = prev ...)` block.)
- **`fxRainbow`** — the rainbow rays → `_addNodeWrap` (rays pass front and back).
- **`fxRadioactive`** — its pulsing glow (box-shadow keyframes ~615-616, 667-668) → behind-layer green halo (`rgba(74,222,128,*)`); the radiating symbols/particles (`_addNode(el, p)` ~639, `_addNode(el, sym)` ~654) → `_addNodeWrap`.
- **`fxPixel`** — pixels dissolving/reforming → `_addNodeWrap` so some pixels are behind the character during the dissolve. Keep the `wlfx-pixelated` class on `el` as-is (stop() already removes it).

- [ ] **Step 1: Add `_addNodeWrap`** (if not already present) after `_addNodeBehind` in the Task 1 block.
- [ ] **Step 2: Migrate `fxGalaxy`** per the recipe above.
- [ ] **Step 3: Migrate `fxElectric`** — route bolts/sparks via `_addNodeWrap`; replace the box-shadow flash with the behind-layer flash node.
- [ ] **Step 4: Migrate `fxRainbow`** — rays via `_addNodeWrap`.
- [ ] **Step 5: Migrate `fxRadioactive`** — glow → behind halo; symbols/particles via `_addNodeWrap`.
- [ ] **Step 6: Migrate `fxPixel`** — pixels via `_addNodeWrap`.
- [ ] **Step 7: Verify the wrap (behind AND front populated)**

For each effect, on `scientist.html` (Test 2, no-cache), sample after ~1.5s of running:
```js
const el = document.querySelector('.lab-charwrap');
return { behind: el.querySelector('.wlfx-behind').childElementCount,
         front:  el.querySelector('.wlfx-front').childElementCount };
```
Expected: **both `> 0`** for galaxy, electric, rainbow, radioactive, pixel. `hasElBoxShadow === false` for electric/radioactive (no box-shadow on `el`).

- [ ] **Step 8: Commit**

```bash
git add wordlab-effects.js
git commit -m "feat(effects): orbit effects wrap the character (galaxy, electric, rainbow, radioactive, pixel)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01DjZtyZpEo3SRyVoR3yuQRo"
```

---

## Task 4: Verify premium multi-layer effects wrap (lasers, quark-rain, blackhole)

**Files:**
- Modify: `wordlab-effects.js` — `fxLasers`, `fxQuarkRain` (1090+), `fxBlackhole` (1138-1209).

**Interfaces:** consumes `_addNodeBehind`/`_addNodeFront`/`_addNodeWrap`; same signatures.

**The transformation:** these are already multi-layer *within their own render*, but all in front today. Give each a genuine behind element:
- **`fxLasers`** — the sweeping grid canvas/plane → `_addNodeBehind` (the grid should sweep behind the character); overlay sparkles → `_addNodeFront`.
- **`fxQuarkRain`** — falling quarks (`_addNode(el, p)` ~1105) → `_addNodeWrap` (some rain passes behind); the collision `flash` (~1125, currently `inset:0;z-index:7`) → `_addNodeBehind`; splashes → `_addNodeFront`.
- **`fxBlackhole`** — the lensing halo, accretion disk, and inward-spiralling particles (~1149-1208) → **behind** (the character is pulled into a hole *behind/around* it): route halo, disk, central sphere, and spiral `parts` nodes via `_addNodeBehind`; polar jets via `_addNodeFront`. Replace `el.style.animation = wlfxWarp` (line 1146) — keep it (it's a subtle character warp, acceptable) but confirm `stop()` clears `el.style.animation` (it does, line 86).

- [ ] **Step 1: Migrate `fxLasers`** per recipe.
- [ ] **Step 2: Migrate `fxQuarkRain`** per recipe.
- [ ] **Step 3: Migrate `fxBlackhole`** per recipe.
- [ ] **Step 4: Verify** — for each, on `scientist.html`, assert `behind > 0 && front >= 0` and that switching away tears down to zero `.wlfx-*` children. Screenshot blackhole to confirm the disk sits behind the character.
- [ ] **Step 5: Commit**

```bash
git add wordlab-effects.js
git commit -m "feat(effects): premium effects gain true depth (lasers, quark-rain, blackhole)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01DjZtyZpEo3SRyVoR3yuQRo"
```

---

## Task 5: Full regression sweep + cross-page z-coherence + low-stim/mobile

**Files:**
- Modify (only if a page overrides character z): `wordlab-scientist.js` (`#sciCharWrap` CSS ~line 1050), any game page with a `.scientist-stage` override.
- Verify only: all 25 effects, on the shop stage AND a game-page `.scientist-stage`.

**Interfaces:** none new — this is verification + targeted CSS fixes.

- [ ] **Step 1: Sweep all 25 effects on `scientist.html`** (Test 2, no-cache). For each effect id in `WLEffects.EFFECTS`, equip it, wait 1.2s, assert it (a) renders ≥1 node total across layers, (b) leaves no `el` box-shadow for the migrated set, then switch to the next and assert the previous left **zero** `.wlfx-*` nodes. Record a pass/fail table in `tests/manual/effect-depth-verify.md`.

Driver snippet (Playwright `browser_evaluate`, iterate ids from the page):
```js
const el = document.querySelector('.lab-charwrap');
const b = el.querySelector('.wlfx-behind'), f = el.querySelector('.wlfx-front');
return { total: (b?b.childElementCount:0) + (f?f.childElementCount:0),
         elBoxShadow: getComputedStyle(el).boxShadow };
```
Expected per effect: `total >= 1`. After stop between effects: `el.querySelectorAll('.wlfx-behind,.wlfx-front').length === 0`.

- [ ] **Step 2: Sweep on a game page** (`phoneme-mode.html`) — repeat Step 1 against `el = .scientist-stage`, `charEl = #sciCharWrap`. Confirm for at least aura, galaxy, blackhole that `behindZ(19) < 20 < frontZ(21)` and the character remains visible on top (screenshot). Confirms the world-panel/behind-fx/character/front-fx budget holds on the shared stage.

- [ ] **Step 3: Low-stim gate** — set low-stim on the Test 2 class (or `WordLabData.isLowStimMode()` true), reload, attempt to equip an effect. Assert `start()` hard-returns: `document.querySelectorAll('.wlfx-behind,.wlfx-front').length === 0` and no effect nodes. (spec §5.4 — unchanged behaviour.)

- [ ] **Step 4: Mobile 390px** — `browser_resize` to 390×844, equip aura + galaxy on `scientist.html`; assert no horizontal overflow (`document.documentElement.scrollWidth <= 390 + 1`) and layers still ordered. Screenshot.

- [ ] **Step 5: Teardown-under-rapid-switch** — equip→switch through 6 effects fast (200ms apart); after settling assert exactly one `.wlfx-behind` and one `.wlfx-front` remain and total effect nodes are bounded (no accumulation). (spec §8 "tear down to zero leftover nodes".)

- [ ] **Step 6: If any page override breaks the budget**, add the minimal CSS fix (e.g. ensure `#sciCharWrap { z-index:20 }` present, or bump a page's `.scientist-stage` child). Document the touch point in the runbook. If none needed, note "no per-page override required."

- [ ] **Step 7: Commit**

```bash
git add tests/manual/effect-depth-verify.md wordlab-scientist.js
git commit -m "test(effects): full 25-effect depth regression sweep + z-coherence verified (shop + game page + low-stim + mobile)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01DjZtyZpEo3SRyVoR3yuQRo"
```

---

## Self-Review (against spec §5, §7-9)

- **§5.1 layer model** → Task 1 (`_ensureLayers`, behind/front, character mid-z). ✔ (Resolves §9 "exact character z-index per page" via relative computation.)
- **§5.1 `_addNode` aliases front / new behind+front helpers** → Task 1 Steps 2-3. ✔
- **§5.2 orbit effects split** → Task 3 (galaxy, electric, rainbow, radioactive, pixel) + Task 4 (premium). ✔ (Resolves §9 "per-effect split ratios" → 50/50 via `_addNodeWrap`, tunable in review.)
- **§5.2 border-glow → halo** → Task 2 (aura, divine, shimmer, quantum, vortex). ✔
- **§5.2 fall/rise stay front** → satisfied by default (`_addNode`→front); no task needed (snow/petals/confetti/bubbles/fire/frost/hearts/smoke untouched). ✔
- **§5.3 teardown removes layers + restores z** → Task 1 Step 4. ✔
- **§5.4 low-stim/reduced-motion unchanged** → Task 5 Step 3 verifies `start()` hard-return. ✔
- **§6 files touched** — `wordlab-effects.js` (all tasks), `scientist.html` (Task 1 Step 6), game-page CSS (Task 5 Step 6 if needed). ✔
- **§8 verification** — no-cache server, Test 2, cache-bust, behind+front sampling, all 25 no-regress, premium multi-layer, shop + game page → Tasks 1,5. ✔
- **Placeholder scan:** infra code is complete; per-effect migrations name the exact current construct/line and the exact transformation with two full worked examples — mechanical repetition, executed against the live body per effect. No "TBD"/"handle edge cases". ✔
- **Type/name consistency:** `_ensureLayers`, `_addNodeBehind`, `_addNodeFront`, `_addNodeWrap` used identically across Tasks 1-5. ✔

## Risks & mitigations

- **Game-page effects move from behind→front by default.** Today un-migrated effects render behind `#sciCharWrap` (z20); after Task 1 `_addNode`→front puts them at z21 (in front). This is the spec's intended wrap direction (D4) but is a visible change on 18 pages. Mitigation: the orbit/premium effects split (half behind), and Task 5 Step 2 screenshots confirm the character stays legible. If "snow in front of the character" reads worse for a specific fall effect, route that effect's particles to `_addNodeBehind` (one-line change) — flagged for visual review, not a blocker.
- **Shared engine, 18 pages.** Mitigation: back-compat front-alias means an un-migrated effect is byte-for-byte equivalent except its parent is now `.wlfx-front` inside `el`; Task 5 sweeps all 25 on two page types before any push.
- **Nothing is deployed yet** (Lab Shop Phase 1+2 merged locally, not pushed). This plan also stays local per the session decision; verify locally, do not push.
