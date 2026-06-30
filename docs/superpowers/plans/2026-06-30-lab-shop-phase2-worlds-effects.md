# Lab Shop Phase 2 — Animated Worlds + 7 New Effects — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 animated world backdrops and 7 new particle effects (3 premium-tier) to the Lab Shop, rendered everywhere the scientist character appears.

**Architecture:** The 7 effects extend the existing data-driven `WLEffects` engine in `wordlab-effects.js` (catalogue + `fx*` render fn + `_fns` map) — everything downstream (shop cards, preview, equip, persistence, multi-page render, low-stim guard) picks them up automatically. Worlds get a **new sibling module `wordlab-worlds.js`** (`WLWorlds`) whose lifecycle mirrors `WLEffects`; a world is a contained, positioned "scene panel" rendered *behind* the character. Persistence reuses the generic `save_scientist_field` RPC via a new `scientist.world` jsonb key (no DDL). Multi-page rendering reuses the `_startEquippedEffect`/`_effectTargets` pattern in `wordlab-scientist.js`.

**Tech Stack:** Vanilla JS (no build, no bundler), CSS keyframes + a little RAF, Supabase jsonb persistence. Verification via Playwright MCP against `python3 -m http.server 8080` + a Node static-integrity script.

## Global Constraints

- No build system, no npm packages, no frameworks — vanilla JS only, served as static files.
- SVG character viewBox is `0 0 80 120`; **do not modify `WLScientist.buildSVG`** — worlds are a stage sibling, not in the character SVG.
- Particle effect nodes live in **z-index 7–13**; world scene-panel lives **behind** the character at **z-index 0** (character/podium ≥ 1).
- Every animation/motion entry point must be gated so `body.low-stim`, `WordLabData.isLowStimMode()`, and `prefers-reduced-motion` all suppress motion. `WLEffects.start()` already hard-returns under low-stim; `scientist.html`'s `_calm()` is the page-level gate.
- **Worlds differ from effects on low-stim:** the Worlds pill stays VISIBLE in low-stim and the static gradient still shows — only the drift particles are suppressed. (Effects/Dances pills are hidden.)
- Every render function must follow the teardown discipline: track spawned nodes/intervals/RAFs via `_addNode`/`_addInterval`/`_addRAF`, and bail inside every loop with `if (!_active.has(el)) return;`. Anything novel (added class, body-appended node, inline filter) must be cleared in `stop()`.
- All costs are in quarks on the live scale (commons 350–500, rare 600–900, epic 1000–1500, legendary 2000+). Values here are final-but-tunable.
- Verification reloads MUST cache-bust (`?cb=N`) — a stale cache masked Phase 1 polish. Use the **test account only**: classId `a05e407f-32b5-48cd-977f-e4835e13011f`, studentId `ec4c1e84-bba0-495a-aa7e-e0ba20a0858b`, via `WordLabData.startSession(classId, studentId, 'Test 2')`.

**Reference helper signatures in `wordlab-effects.js` (already exist — use, don't redefine):**
`_ensureRelative(el)` · `_injectStyle(id, css)` · `_makeParticle(styles)→div` · `_addNode(el,node)→node` · `_addInterval(el,fn,ms)→id` · `_addRAF(el,handle)` · `_updateRAF(el,old,new)` · `rnd(min,max)` · `rndInt(min,max)` · `mobile()→bool` · state guard `_active.has(el)`.

---

## Task 1: Four simple new effects (hearts, snow, petals, smoke)

**Files:**
- Modify: `wordlab-effects.js` — `EFFECTS` catalogue (after line 27), four `fx*` functions (before the `_fns` map ~line 930), and the `_fns` map (~lines 930–937).
- Create: `tests/test-effects-catalogue.js` (Node static-integrity check).

**Interfaces:**
- Produces: `EFFECTS['hearts-fx'|'snow'|'petals'|'smoke']` entries; `fxHearts`, `fxSnow`, `fxPetals`, `fxSmoke`; `_fns` keys `'hearts-fx','snow','petals','smoke'`. All consumed automatically by `WL.effectList()` in `scientist.html`.

- [ ] **Step 1: Write the failing integrity test**

Create `tests/test-effects-catalogue.js`:

```javascript
// Static integrity check: every new effect id has an EFFECTS entry, a _fns
// registration, and a fx function. No browser needed — parses the source text.
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'wordlab-effects.js'), 'utf8');

const NEW = ['hearts-fx', 'snow', 'petals', 'smoke', 'lasers', 'quark-rain', 'blackhole'];
const FN = { 'hearts-fx':'fxHearts', 'snow':'fxSnow', 'petals':'fxPetals', 'smoke':'fxSmoke',
             'lasers':'fxLasers', 'quark-rain':'fxQuarkRain', 'blackhole':'fxBlackhole' };

let fail = 0;
for (const id of NEW) {
  const inCatalogue = new RegExp(`['"]?${id.replace('-','\\-')}['"]?\\s*:\\s*\\{`).test(src)
                   || src.includes(`'${id}'`) || src.includes(`"${id}"`);
  const inFns = new RegExp(`['"]?${id}['"]?\\s*:\\s*${FN[id]}\\b`).test(src)
             || src.includes(`${id}: ${FN[id]}`) || src.includes(`'${id}': ${FN[id]}`);
  const hasFn = new RegExp(`function\\s+${FN[id]}\\s*\\(`).test(src);
  if (!inCatalogue) { console.error(`MISSING catalogue entry: ${id}`); fail++; }
  if (!inFns)       { console.error(`MISSING _fns mapping: ${id} -> ${FN[id]}`); fail++; }
  if (!hasFn)       { console.error(`MISSING function: ${FN[id]}`); fail++; }
}
if (fail) { console.error(`\n${fail} failure(s)`); process.exit(1); }
console.log(`OK — all ${NEW.length} new effects present in catalogue, _fns, and functions`);
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node tests/test-effects-catalogue.js`
Expected: FAIL — `MISSING catalogue entry: hearts-fx` etc. (none exist yet). This test also covers Tasks 2–4's premium effects, so it stays red until Task 4.

- [ ] **Step 3: Add the four catalogue entries**

In `wordlab-effects.js`, after the `vortex:` line (line 27), before the closing `};` of `EFFECTS` (line 28), add:

```javascript
    'hearts-fx': { name:'Hearts',        cost:450,  rarity:'common', icon:'💖', desc:'Hearts float up and fade around you',     color:'#f9417f', requiresBadge:null },
    snow:        { name:'Snowfall',      cost:400,  rarity:'common', icon:'❄️', desc:'Snowflakes drift gently down',            color:'#dff4ff', requiresBadge:null },
    petals:      { name:'Cherry Petals', cost:700,  rarity:'rare',   icon:'🌸', desc:'Cherry blossom petals tumble down',       color:'#ffb7d5', requiresBadge:null },
    smoke:       { name:'Lab Smoke',     cost:700,  rarity:'rare',   icon:'💨', desc:'Soft lab smoke curls up around you',      color:'#cbd5e1', requiresBadge:null },
```

- [ ] **Step 4: Add the four render functions**

In `wordlab-effects.js`, immediately before the `_fns` map declaration (~line 930), add:

```javascript
  // hearts-fx — pink hearts rise from the feet and fade
  function fxHearts(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-hearts', `
      @keyframes wlfxHeartRise { 0%{opacity:0;transform:translateY(0) scale(.5)} 15%{opacity:1} 100%{opacity:0;transform:translateY(-90px) scale(1.1)} }
    `);
    function spawn() {
      if (!_active.has(el)) return;
      const p = _makeParticle(`
        left:${rnd(15,80)}%;bottom:${rnd(0,18)}%;font-size:${rndInt(12,22)}px;
        animation:wlfxHeartRise ${rnd(1.8,3.0).toFixed(2)}s ease forwards;z-index:11;`);
      p.textContent = ['💖','💗','💕','❤️'][rndInt(0,4)];
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 3100);
    }
    spawn();
    _addInterval(el, spawn, intense ? 240 : 460);
  }

  // snow — white flakes fall with a horizontal sway
  function fxSnow(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-snow', `
      @keyframes wlfxSnowFall { 0%{opacity:0;transform:translate(0,-10px)} 12%{opacity:1} 100%{opacity:.2;transform:translate(var(--sx,10px),130px)} }
    `);
    function spawn() {
      if (!_active.has(el)) return;
      const p = _makeParticle(`
        left:${rnd(2,95)}%;top:0;font-size:${rndInt(8,16)}px;color:#eaf6ff;
        text-shadow:0 0 5px rgba(190,235,255,.8);
        --sx:${rnd(-22,22).toFixed(0)}px;
        animation:wlfxSnowFall ${rnd(2.6,4.4).toFixed(2)}s linear forwards;z-index:10;`);
      p.textContent = ['❄','❅','❆','•'][rndInt(0,4)];
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 4600);
    }
    spawn();
    _addInterval(el, spawn, intense ? 130 : 240);
  }

  // petals — cherry blossom petals tumble (rotate) as they fall
  function fxPetals(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-petals', `
      @keyframes wlfxPetalFall { 0%{opacity:0;transform:translate(0,-10px) rotate(0deg)} 12%{opacity:1} 100%{opacity:.25;transform:translate(var(--px,18px),130px) rotate(var(--pr,320deg))} }
    `);
    function spawn() {
      if (!_active.has(el)) return;
      const p = _makeParticle(`
        left:${rnd(2,95)}%;top:0;font-size:${rndInt(11,18)}px;
        --px:${rnd(-30,30).toFixed(0)}px;--pr:${rndInt(200,520)}deg;
        animation:wlfxPetalFall ${rnd(2.8,4.6).toFixed(2)}s linear forwards;z-index:10;`);
      p.textContent = ['🌸','🌸','🌺','🏵️'][rndInt(0,4)];
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 4800);
    }
    spawn();
    _addInterval(el, spawn, intense ? 200 : 360);
  }

  // smoke — soft grey plumes rise, expand, and dissipate
  function fxSmoke(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-smoke', `
      @keyframes wlfxSmokeRise { 0%{opacity:0;transform:translateY(0) scale(.4)} 25%{opacity:.5} 100%{opacity:0;transform:translateY(-80px) scale(1.8)} }
    `);
    function spawn() {
      if (!_active.has(el)) return;
      const size = rndInt(14, 30);
      const p = _makeParticle(`
        left:${rnd(25,70)}%;bottom:${rnd(0,15)}%;width:${size}px;height:${size}px;
        border-radius:50%;background:radial-gradient(circle,rgba(203,213,225,.55),rgba(148,163,184,0) 70%);
        animation:wlfxSmokeRise ${rnd(2.4,3.8).toFixed(2)}s ease-out forwards;z-index:9;`);
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 4000);
    }
    spawn();
    _addInterval(el, spawn, intense ? 260 : 440);
  }
```

- [ ] **Step 5: Register the four in `_fns`**

In the `_fns` object (~lines 930–937), add the four keys (e.g. after `confetti: fxConfetti,`):

```javascript
    'hearts-fx': fxHearts, snow: fxSnow, petals: fxPetals, smoke: fxSmoke,
```

- [ ] **Step 6: Re-run the integrity test (partial pass expected)**

Run: `node tests/test-effects-catalogue.js`
Expected: still FAIL, but ONLY for `lasers`, `quark-rain`, `blackhole` (Tasks 2–4). The four hearts/snow/petals/smoke errors must be gone.

- [ ] **Step 7: Behavioural check (reviewer, Playwright MCP)**

Start server (`python3 -m http.server 8080`), navigate `http://localhost:8080/scientist.html?cb=t1`, `WordLabData.startSession(...)` as Test 2, reload, open the Effects pill. For each of the four, evaluate:

```javascript
() => { const el = WL.charEl; const before = el.children.length;
  WLEffects.stop(el); WLEffects.preview('snow', el);
  return { id:'snow', spawnedSomething: el.children.length >= before }; }
```

Expected: each previews (child count grows), and switching to another effect calls `WLEffects.stop` leaving no leftover `wlfx`-class nodes (`el.querySelectorAll('[class^=wlfx]').length` returns to 0 after stop).

- [ ] **Step 8: Commit**

```bash
git add wordlab-effects.js tests/test-effects-catalogue.js
git commit -m "feat(lab-shop): add 4 simple effects — hearts, snow, petals, smoke"
```

---

## Task 2: Premium effect — Laser Grid (`lasers`, epic)

**Files:**
- Modify: `wordlab-effects.js` — `EFFECTS['lasers']` entry, `fxLasers`, `_fns` registration, and extend `stop()` (line 70) to clear the rim-glow filter (reuses existing `el.style.filter=''` — already cleared, so confirm no extra teardown needed).

**Interfaces:**
- Produces: `EFFECTS.lasers`, `fxLasers(el, intense)`, `_fns.lasers`.

- [ ] **Step 1: Add catalogue entry**

After the `smoke:` line in `EFFECTS`:

```javascript
    lasers:      { name:'Laser Grid',    cost:1200, rarity:'epic',   icon:'🔺', desc:'A synthwave laser grid sweeps over you',  color:'#ff3cc8', requiresBadge:null },
```

- [ ] **Step 2: Add `fxLasers`**

Before the `_fns` map:

```javascript
  // lasers — synthwave targeting scene: scrolling perspective grid + vertical
  // scan-line + firing diagonal beams + impact sparks + magenta/cyan rim glow.
  function fxLasers(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-lasers', `
      @keyframes wlfxGridScroll { 0%{background-position:0 0} 100%{background-position:0 26px} }
      @keyframes wlfxScan { 0%{top:-8%;opacity:0} 8%{opacity:1} 92%{opacity:1} 100%{top:104%;opacity:0} }
      @keyframes wlfxBeam { 0%{opacity:0;transform:scaleX(0)} 12%{opacity:1;transform:scaleX(1)} 70%{opacity:.5} 100%{opacity:0} }
      @keyframes wlfxSpark { 0%{opacity:1;transform:scale(.3)} 100%{opacity:0;transform:scale(1.6)} }
    `);
    el.style.filter = 'drop-shadow(2px 0 4px rgba(255,60,200,.55)) drop-shadow(-2px 0 4px rgba(60,220,255,.55))';

    // Perspective grid panel behind the character
    const grid = _makeParticle(`
      inset:0;z-index:6;border-radius:inherit;opacity:.55;
      background-image:
        linear-gradient(rgba(255,60,200,.35) 1px,transparent 1px),
        linear-gradient(90deg,rgba(60,220,255,.30) 1px,transparent 1px);
      background-size:26px 26px;
      animation:wlfxGridScroll ${intense?'0.7s':'1.3s'} linear infinite;`);
    _addNode(el, grid);

    // Vertical scan-line that sweeps over the character
    const scan = _makeParticle(`
      left:0;width:100%;height:7px;z-index:12;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent);
      box-shadow:0 0 12px 3px rgba(255,60,200,.7);
      animation:wlfxScan ${intense?'1.6s':'2.6s'} linear infinite;`);
    _addNode(el, scan);

    // Periodic firing diagonal beams + impact spark
    function fireBeam() {
      if (!_active.has(el)) return;
      const y = rnd(15, 80), len = rnd(40, 90), ang = rnd(-35, 35);
      const beam = _makeParticle(`
        left:5%;top:${y}%;width:${len}%;height:2px;z-index:11;transform-origin:left center;
        transform:rotate(${ang}deg);
        background:linear-gradient(90deg,rgba(255,255,255,.95),${rndInt(0,2)?'#ff3cc8':'#3cdcff'});
        box-shadow:0 0 8px 1px rgba(255,60,200,.8);
        animation:wlfxBeam ${rnd(0.4,0.7).toFixed(2)}s ease-out forwards;`);
      _addNode(el, beam);
      const spark = _makeParticle(`
        left:${5+len*Math.cos(ang*Math.PI/180)}%;top:${y+len*Math.sin(ang*Math.PI/180)*0.6}%;
        width:10px;height:10px;border-radius:50%;z-index:12;
        background:radial-gradient(circle,#fff,rgba(255,60,200,0) 70%);
        animation:wlfxSpark .4s ease-out forwards;`);
      _addNode(el, spark);
      setTimeout(() => { [beam,spark].forEach(n=>{ try{ n.parentNode&&n.parentNode.removeChild(n);}catch{} }); }, 750);
    }
    _addInterval(el, fireBeam, intense ? 320 : 620);
  }
```

- [ ] **Step 3: Register in `_fns`**

Add `lasers: fxLasers,` to the `_fns` map.

- [ ] **Step 4: Confirm `stop()` teardown**

`stop()` already resets `el.style.filter = ''` (line 77) and removes tracked nodes. `fxLasers` adds no class or body node, so no `stop()` change is needed. Verify by reading `stop()` (line 70) — confirm `el.style.filter=''` is present.

- [ ] **Step 5: Reviewer behavioural check (Playwright MCP)**

Navigate `scientist.html?cb=t2`, Effects pill → click Laser Grid. Evaluate after 1.5s:

```javascript
() => ({ grid: !!WL.charEl.querySelector('[style*="wlfxGridScroll"]'),
         scan: !!WL.charEl.querySelector('[style*="wlfxScan"]'),
         filter: WL.charEl.style.filter.includes('drop-shadow') })
```

Expected: `{grid:true, scan:true, filter:true}`, beams visibly fire, and after `WLEffects.stop(WL.charEl)` the filter clears (`WL.charEl.style.filter===''`) and grid/scan nodes are gone. Screenshot for visual sign-off.

- [ ] **Step 6: Commit**

```bash
git add wordlab-effects.js
git commit -m "feat(lab-shop): add premium Laser Grid effect"
```

---

## Task 3: Premium effect — Quark Rain (`quark-rain`, epic)

**Files:**
- Modify: `wordlab-effects.js` — `EFFECTS['quark-rain']`, `fxQuarkRain`, `_fns` registration.

**Interfaces:**
- Produces: `EFFECTS['quark-rain']`, `fxQuarkRain(el, intense)`, `_fns['quark-rain']`.

- [ ] **Step 1: Add catalogue entry**

After the `lasers:` line:

```javascript
    'quark-rain':{ name:'Quark Rain',    cost:1300, rarity:'epic',   icon:'⚛️', desc:'Colour-charged quarks rain past you',     color:'#b9a6ff', requiresBadge:null },
```

- [ ] **Step 2: Add `fxQuarkRain`**

Before the `_fns` map:

```javascript
  // quark-rain — depth-layered particle shower in the 3 colour-charge hues,
  // with motion-blur streaks, occasional heavy particles that splash, and a
  // faint collision flash.
  function fxQuarkRain(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-quarkrain', `
      @keyframes wlfxQFall { 0%{opacity:0;transform:translateY(-12px)} 10%{opacity:1} 100%{opacity:.15;transform:translateY(132px)} }
      @keyframes wlfxQSplash { 0%{opacity:1;transform:translate(-50%,0) scale(.4)} 100%{opacity:0;transform:translate(-50%,-8px) scale(1.5)} }
      @keyframes wlfxQFlash { 0%,100%{opacity:0} 50%{opacity:.7} }
    `);
    const HUES = ['#ff4d6d', '#4dff88', '#4db8ff'];

    function spawn() {
      if (!_active.has(el)) return;
      const fg = rndInt(0, 3) === 0;              // ~1/3 foreground
      const hue = HUES[rndInt(0, 3)];
      const size = fg ? rndInt(13, 20) : rndInt(7, 11);
      const dur = fg ? rnd(1.0, 1.5) : rnd(1.6, 2.4);
      const p = _makeParticle(`
        left:${rnd(3,95)}%;top:0;font-size:${size}px;color:${hue};
        opacity:${fg?1:0.6};
        text-shadow:0 -6px 6px ${hue},0 0 8px ${hue};
        animation:wlfxQFall ${dur.toFixed(2)}s linear forwards;z-index:${fg?12:8};`);
      p.textContent = rndInt(0,2) ? '⚛' : '•';
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, dur*1000+200);
    }

    // Heavy particle: falls slower, trailing tail, splashes at the floor line
    function spawnHeavy() {
      if (!_active.has(el)) return;
      const hue = HUES[rndInt(0, 3)], x = rnd(15, 85);
      const p = _makeParticle(`
        left:${x}%;top:0;font-size:22px;color:${hue};z-index:13;
        text-shadow:0 -10px 10px ${hue},0 0 14px ${hue};
        animation:wlfxQFall 2.2s ease-in forwards;`);
      p.textContent = '⚛';
      _addNode(el, p);
      setTimeout(() => {
        if (!_active.has(el)) return;
        const splash = _makeParticle(`
          left:${x}%;bottom:2%;width:18px;height:8px;z-index:13;
          background:radial-gradient(circle,${hue},rgba(0,0,0,0) 70%);
          animation:wlfxQSplash .5s ease-out forwards;`);
        _addNode(el, splash);
        setTimeout(() => { try { splash.parentNode && splash.parentNode.removeChild(splash); } catch {} }, 520);
      }, 2000);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 2300);
    }

    // Faint full-stage collision flash
    function flash() {
      if (!_active.has(el)) return;
      const f = _makeParticle(`
        inset:0;z-index:7;border-radius:inherit;
        background:radial-gradient(circle at ${rndInt(20,80)}% ${rndInt(20,80)}%,rgba(185,166,255,.5),rgba(0,0,0,0) 55%);
        animation:wlfxQFlash .5s ease forwards;`);
      _addNode(el, f);
      setTimeout(() => { try { f.parentNode && f.parentNode.removeChild(f); } catch {} }, 520);
    }

    spawn();
    _addInterval(el, spawn, intense ? 90 : 150);
    _addInterval(el, spawnHeavy, intense ? 900 : 1500);
    _addInterval(el, flash, intense ? 1300 : 2200);
  }
```

- [ ] **Step 3: Register in `_fns`**

Add `'quark-rain': fxQuarkRain,` to the `_fns` map.

- [ ] **Step 4: Reviewer behavioural check (Playwright MCP)**

Navigate `scientist.html?cb=t3`, Effects → Quark Rain. Evaluate after 2.5s that foreground (z-index 12/13) and background (z-index 8) particles coexist:

```javascript
() => { const ns=[...WL.charEl.querySelectorAll('div[style*="wlfxQFall"]')];
  const z = ns.map(n=>+n.style.zIndex);
  return { count:ns.length, hasFg:z.some(v=>v>=12), hasBg:z.some(v=>v<=8) }; }
```

Expected: particles present with both fg and bg layers; a splash appears at the floor line for heavies; `WLEffects.stop` clears all. Screenshot for sign-off.

- [ ] **Step 5: Commit**

```bash
git add wordlab-effects.js
git commit -m "feat(lab-shop): add premium Quark Rain effect"
```

---

## Task 4: Premium effect — Black Hole (`blackhole`, legendary)

**Files:**
- Modify: `wordlab-effects.js` — `EFFECTS['blackhole']`, `fxBlackhole`, `_fns` registration. Uses RAF for the inward spiral (track via `_addRAF`/`_updateRAF`).

**Interfaces:**
- Produces: `EFFECTS.blackhole`, `fxBlackhole(el, intense)`, `_fns.blackhole`.

- [ ] **Step 1: Add catalogue entry**

After the `'quark-rain':` line:

```javascript
    blackhole:   { name:'Black Hole',    cost:2500, rarity:'legendary', icon:'🕳️', desc:'A black hole bends space around you', color:'#9b7bff', requiresBadge:null },
```

- [ ] **Step 2: Add `fxBlackhole`**

Before the `_fns` map. The accretion disk + halo + jets are CSS; the inward-spiral particles use a single RAF loop that re-parents nothing (DOM nodes whose polar coords decay each frame):

```javascript
  // blackhole — central dark sphere, rotating accretion disk, lensing halo,
  // starfield + particles spiralling inward and vanishing, polar jet flares,
  // and a subtle space-warp pulse on the character.
  function fxBlackhole(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-blackhole', `
      @keyframes wlfxDiskSpin { 0%{transform:translate(-50%,-50%) rotate(0deg)} 100%{transform:translate(-50%,-50%) rotate(360deg)} }
      @keyframes wlfxHalo { 0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(1)} 50%{opacity:.9;transform:translate(-50%,-50%) scale(1.12)} }
      @keyframes wlfxWarp { 0%,100%{transform:scale(1)} 50%{transform:scale(.97)} }
      @keyframes wlfxJet { 0%{opacity:0;transform:translate(-50%,0) scaleY(.4)} 30%{opacity:.85} 100%{opacity:0;transform:translate(-50%,0) scaleY(1.4)} }
    `);
    el.style.animation = `wlfxWarp ${intense?'2s':'3.4s'} ease-in-out infinite`;

    // Lensing halo
    _addNode(el, _makeParticle(`
      left:50%;top:50%;width:130px;height:130px;border-radius:50%;z-index:6;
      background:radial-gradient(circle,rgba(155,123,255,.35),rgba(0,0,0,0) 65%);
      animation:wlfxHalo ${intense?'1.8s':'3s'} ease-in-out infinite;`));

    // Rotating accretion disk
    _addNode(el, _makeParticle(`
      left:50%;top:50%;width:120px;height:120px;border-radius:50%;z-index:7;
      background:conic-gradient(from 0deg,#ff8a3c,#9b7bff,#3cdcff,#9b7bff,#ff8a3c);
      mask:radial-gradient(circle,transparent 30%,#000 34%,#000 48%,transparent 52%);
      -webkit-mask:radial-gradient(circle,transparent 30%,#000 34%,#000 48%,transparent 52%);
      animation:wlfxDiskSpin ${intense?'2.2s':'4s'} linear infinite;`));

    // Central dark sphere
    _addNode(el, _makeParticle(`
      left:50%;top:50%;width:42px;height:42px;border-radius:50%;z-index:9;
      transform:translate(-50%,-50%);
      background:radial-gradient(circle at 40% 38%,#2a2440,#000 70%);
      box-shadow:0 0 16px 4px rgba(0,0,0,.7),inset 0 0 10px rgba(155,123,255,.5);`));

    // Polar jets
    function jet(topPct) {
      if (!_active.has(el)) return;
      const j = _makeParticle(`
        left:50%;top:${topPct}%;width:6px;height:34px;z-index:8;
        background:linear-gradient(${topPct<50?'0deg':'180deg'},rgba(60,220,255,.9),rgba(60,220,255,0));
        animation:wlfxJet .9s ease-out forwards;`);
      _addNode(el, j);
      setTimeout(() => { try { j.parentNode && j.parentNode.removeChild(j); } catch {} }, 950);
    }
    _addInterval(el, () => { jet(30); jet(70); }, intense ? 1400 : 2400);

    // Inward-spiralling particles via one RAF loop
    const rect = () => el.getBoundingClientRect();
    const parts = [];
    function seed() {
      const r0 = rnd(55, 80), a0 = rnd(0, Math.PI * 2);
      const node = _makeParticle(`
        left:50%;top:50%;width:${rndInt(2,4)}px;height:${rndInt(2,4)}px;border-radius:50%;z-index:10;
        background:${['#fff','#b9a6ff','#3cdcff'][rndInt(0,3)]};box-shadow:0 0 6px currentColor;`);
      _addNode(el, node);
      parts.push({ node, r:r0, a:a0, v:rnd(0.35,0.7) });
    }
    for (let i = 0; i < (intense ? 26 : 16); i++) seed();
    let raf = 0;
    function tick() {
      if (!_active.has(el)) return;
      const { width:W, height:H } = rect();
      for (const p of parts) {
        p.r -= p.v; p.a += 0.06 + (60 - p.r) * 0.001;
        if (p.r < 6) { p.r = rnd(55, 82); p.a = rnd(0, Math.PI * 2); }
        const x = 50 + (p.r / W * 100) * Math.cos(p.a);
        const y = 50 + (p.r / H * 100) * Math.sin(p.a);
        p.node.style.left = x + '%'; p.node.style.top = y + '%';
        p.node.style.opacity = Math.max(0.1, p.r / 80);
      }
      const next = requestAnimationFrame(tick);
      _updateRAF(el, raf, next); raf = next;
    }
    raf = requestAnimationFrame(tick); _addRAF(el, raf);
  }
```

- [ ] **Step 3: Register in `_fns`**

Add `blackhole: fxBlackhole,` to the `_fns` map.

- [ ] **Step 4: Confirm `stop()` clears the warp animation**

`stop()` resets `el.style.animation = ''` (line 79) which clears the `wlfxWarp` pulse, cancels RAFs, and removes tracked nodes. No extra teardown needed — verify by reading `stop()`.

- [ ] **Step 5: Re-run the integrity test (full pass now)**

Run: `node tests/test-effects-catalogue.js`
Expected: PASS — `OK — all 7 new effects present…`.

- [ ] **Step 6: Reviewer behavioural check (Playwright MCP)**

Navigate `scientist.html?cb=t4`, Effects → Black Hole. Evaluate after 2s:

```javascript
() => ({ warp: WL.charEl.style.animation.includes('wlfxWarp'),
         disk: !!WL.charEl.querySelector('[style*="wlfxDiskSpin"]'),
         spiralNodes: WL.charEl.querySelectorAll('div[style*="z-index:10"]').length }) // ~16
```

Expected: disk spins, particles visibly spiral inward and recycle, jets flare; `WLEffects.stop` clears animation + all nodes (`WL.charEl.style.animation===''`). Screenshot for sign-off.

- [ ] **Step 7: Commit**

```bash
git add wordlab-effects.js
git commit -m "feat(lab-shop): add premium Black Hole effect"
```

---

## Task 5: New module `wordlab-worlds.js` — WLWorlds engine + 8-world catalogue

**Files:**
- Create: `wordlab-worlds.js`.
- Create: `tests/test-worlds-catalogue.js` (Node static-integrity check).

**Interfaces:**
- Produces (global `WLWorlds`): `start(worldId, el)`, `stop(el)`, `preview(worldId, el)`, `WORLDS` (object keyed by id with `{name,cost,rarity,wall,floor,grid,glow,drift}`), and `wallOf(worldId)→css` (used by the shop swatch). `start` builds a `.wlworld` panel as a child of `el` behind the character; suppresses drift when `WordLabData.isLowStimMode()` is true (the static gradient still shows).

- [ ] **Step 1: Write the failing integrity test**

Create `tests/test-worlds-catalogue.js`:

```javascript
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'wordlab-worlds.js'), 'utf8');
const IDS = ['lab','galaxy','underwater','sunset','forest','neon','candy','volcano'];
let fail = 0;
for (const id of IDS) {
  if (!new RegExp(`\\b${id}\\s*:\\s*\\{`).test(src)) { console.error(`MISSING world: ${id}`); fail++; }
}
for (const api of ['start','stop','preview','WORLDS','wallOf']) {
  if (!src.includes(api)) { console.error(`MISSING api: ${api}`); fail++; }
}
if (fail) { console.error(`\n${fail} failure(s)`); process.exit(1); }
console.log(`OK — 8 worlds + full WLWorlds API present`);
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node tests/test-worlds-catalogue.js`
Expected: FAIL — file does not exist (`ENOENT`). (Create the file in Step 3, then it checks contents.)

- [ ] **Step 3: Create `wordlab-worlds.js`**

Gradients copied verbatim from the mockup `WORLDS` block (`docs/superpowers/specs/2026-06-29-lab-shop-mockup.html`). The module mirrors `WLEffects`' state/teardown shape.

```javascript
// ═══════════════════════════════════════════════════════════════
// WORD LAB — Animated Worlds (backdrop) Module
// Exposes: WLWorlds.start(id, el) / .stop(el) / .preview(id, el) / .WORLDS / .wallOf(id)
// A "world" is a contained scene panel rendered BEHIND the character.
// Gradients lifted verbatim from the Lab Shop mockup WORLDS block.
// ═══════════════════════════════════════════════════════════════
const WLWorlds = (() => {

  // ── Catalogue (single source of truth) ────────────────────────
  // drift: 'dust'|'stars'|'bubbles'|'haze'|'leaves'|'shimmer'|'sprinkles'|'embers'|'none'
  const WORLDS = {
    lab:        { name:'Lab',       cost:0,    rarity:'common', drift:'dust',
      wall:'linear-gradient(180deg,#fbf3da 0%,#f0e2ba 55%,#e6d3a0 100%)', floor:'#cba23f', grid:'rgba(120,80,20,.28)', glow:'rgba(240,200,90,.7)' },
    galaxy:     { name:'Galaxy',    cost:350,  rarity:'rare',   drift:'stars',
      wall:'radial-gradient(120% 90% at 50% 12%, #4a3a86 0%, #251a4d 50%, #120d2a 100%)', floor:'#1a1442', grid:'rgba(160,130,255,.32)', glow:'rgba(150,120,255,.75)' },
    underwater: { name:'Aquatic',   cost:350,  rarity:'rare',   drift:'bubbles',
      wall:'linear-gradient(180deg,#2bb6e0 0%,#157aaf 55%,#0a4d72 100%)', floor:'#0a3d63', grid:'rgba(190,245,255,.32)', glow:'rgba(120,220,255,.75)' },
    sunset:     { name:'Sunset',    cost:400,  rarity:'rare',   drift:'haze',
      wall:'linear-gradient(180deg,#ffc26a 0%,#ff8d6a 50%,#e8657d 100%)', floor:'#c4546b', grid:'rgba(255,255,255,.3)', glow:'rgba(255,200,120,.8)' },
    forest:     { name:'Forest',    cost:400,  rarity:'rare',   drift:'leaves',
      wall:'linear-gradient(180deg,#b6e08a 0%,#5fae46 50%,#2f7a3a 100%)', floor:'#2d6a35', grid:'rgba(255,255,255,.22)', glow:'rgba(190,240,120,.75)' },
    neon:       { name:'Neon Grid', cost:500,  rarity:'epic',   drift:'shimmer',
      wall:'linear-gradient(180deg,#241043 0%,#160a2e 55%,#0a0518 100%)', floor:'#170a30', grid:'rgba(255,60,200,.4)', glow:'rgba(255,80,210,.7)' },
    candy:      { name:'Candy',     cost:500,  rarity:'epic',   drift:'sprinkles',
      wall:'linear-gradient(180deg,#ffe0f0 0%,#ffb4dc 55%,#ff8fc4 100%)', floor:'#f08fc4', grid:'rgba(255,255,255,.45)', glow:'rgba(255,180,225,.85)' },
    volcano:    { name:'Volcano',   cost:800,  rarity:'epic',   drift:'embers',
      wall:'radial-gradient(120% 90% at 50% 18%, #7a2a18 0%, #3a120c 55%, #1a0805 100%)', floor:'#3a120c', grid:'rgba(255,120,40,.38)', glow:'rgba(255,120,40,.7)' }
  };

  // ── State / teardown (mirrors WLEffects) ──────────────────────
  const _active = new Map();
  function _state(el){ if(!_active.has(el)) _active.set(el,{panel:null,intervals:[],rafs:[]}); return _active.get(el); }
  function stop(el){
    if(!el || !_active.has(el)) return;
    const s = _active.get(el);
    s.intervals.forEach(clearInterval); s.rafs.forEach(cancelAnimationFrame);
    if(s.panel){ try{ s.panel.parentNode && s.panel.parentNode.removeChild(s.panel); }catch{} }
    _active.delete(el);
  }
  const rnd = (a,b)=>Math.random()*(b-a)+a;
  const rndInt = (a,b)=>Math.floor(rnd(a,b));
  function _calmMotion(){
    try { return (typeof WordLabData!=='undefined' && WordLabData.isLowStimMode && WordLabData.isLowStimMode())
      || window.matchMedia('(prefers-reduced-motion:reduce)').matches; } catch { return false; }
  }
  function _injectStyle(){
    if(document.getElementById('wlworlds-css')) return;
    const s=document.createElement('style'); s.id='wlworlds-css';
    s.textContent = `
      .wlworld{ position:absolute; inset:0; z-index:0; border-radius:inherit; overflow:hidden; pointer-events:none; }
      .wlworld-floor{ position:absolute; left:0; right:0; bottom:0; height:34%; }
      .wlworld-glow{ position:absolute; left:50%; bottom:18%; width:60%; height:40%; transform:translateX(-50%); border-radius:50%; filter:blur(14px); }
      @keyframes wlwDriftUp { 0%{opacity:0;transform:translateY(0)} 12%{opacity:1} 100%{opacity:0;transform:translateY(-90px)} }
      @keyframes wlwDriftDown { 0%{opacity:0;transform:translateY(-10px)} 12%{opacity:1} 100%{opacity:.2;transform:translateY(110px)} }
      @keyframes wlwTwinkle { 0%,100%{opacity:.25} 50%{opacity:1} }
      @media(prefers-reduced-motion:reduce){ .wlworld *{ animation:none !important; } }
      body.low-stim .wlworld *{ animation:none !important; }
    `;
    document.head.appendChild(s);
  }

  // ── Build the scene panel ─────────────────────────────────────
  function _buildPanel(w){
    const panel = document.createElement('div'); panel.className='wlworld'; panel.setAttribute('aria-hidden','true');
    panel.style.background = w.wall;
    const floor = document.createElement('div'); floor.className='wlworld-floor';
    floor.style.background = `linear-gradient(180deg, ${w.floor} 0%, rgba(0,0,0,.25) 100%)`;
    floor.style.backgroundImage =
      `repeating-linear-gradient(90deg, ${w.grid} 0 1px, transparent 1px 24px),`+
      `linear-gradient(180deg, ${w.floor}, rgba(0,0,0,.25))`;
    const glow = document.createElement('div'); glow.className='wlworld-glow';
    glow.style.background = `radial-gradient(circle, ${w.glow}, rgba(0,0,0,0) 70%)`;
    panel.appendChild(floor); panel.appendChild(glow);
    return panel;
  }

  // drift particle spawner per theme; returns an interval-fn or null
  function _driftSpawner(panel, theme){
    const glyphMap = { stars:['✦','·','✧'], bubbles:['○','◦','°'], leaves:['🍂','🍃'],
      sprinkles:['▪','●'], embers:['•','✦'], haze:['░'], dust:['·','•'], shimmer:['▪'] };
    const up = (theme==='bubbles'||theme==='embers'||theme==='dust'||theme==='haze');
    const colorMap = { stars:'#fff', bubbles:'rgba(200,245,255,.85)', leaves:'', sprinkles:'#fff',
      embers:'#ff8a3c', haze:'rgba(255,220,180,.5)', dust:'rgba(255,255,255,.6)', shimmer:'rgba(255,120,220,.8)' };
    if (theme==='none') return null;
    return function(){
      const p = document.createElement('div');
      const glyphs = glyphMap[theme]||['·'];
      p.textContent = glyphs[rndInt(0,glyphs.length)];
      p.style.cssText = `position:absolute;left:${rnd(3,95)}%;${up?'bottom:0':'top:0'};`+
        `font-size:${rndInt(7,15)}px;color:${colorMap[theme]||'inherit'};pointer-events:none;`+
        `animation:${theme==='stars'?'wlwTwinkle':(up?'wlwDriftUp':'wlwDriftDown')} ${rnd(2.2,4).toFixed(2)}s linear forwards;`;
      panel.appendChild(p);
      setTimeout(()=>{ try{ p.parentNode && p.parentNode.removeChild(p); }catch{} }, 4200);
    };
  }

  function _render(id, el, intense){
    stop(el);
    const w = WORLDS[id]; if(!w) return;
    _injectStyle(); _ensurePositioned(el);
    const panel = _buildPanel(w);
    el.insertBefore(panel, el.firstChild);    // behind everything else in el
    const s = _state(el); s.panel = panel;
    if (!_calmMotion()) {
      const fn = _driftSpawner(panel, w.drift);
      if (fn) { fn(); s.intervals.push(setInterval(fn, intense?260:460)); }
    }
  }
  function _ensurePositioned(el){ if(getComputedStyle(el).position==='static') el.style.position='relative'; }

  function start(id, el){ if(!el) return; _render(id, el, false); }
  function preview(id, el){ if(!el) return; _render(id, el, true); }
  function wallOf(id){ return (WORLDS[id] && WORLDS[id].wall) || 'transparent'; }

  return { start, stop, preview, WORLDS, wallOf };
})();
```

- [ ] **Step 4: Run the integrity test to confirm pass**

Run: `node tests/test-worlds-catalogue.js`
Expected: PASS — `OK — 8 worlds + full WLWorlds API present`.

- [ ] **Step 5: Reviewer smoke check (Playwright MCP, standalone)**

In any page that already loads it (after Task 7) or via a quick console eval on a blank container:

```javascript
() => { const d=document.createElement('div'); d.style.cssText='position:relative;width:300px;height:400px';
  document.body.appendChild(d); WLWorlds.start('galaxy', d);
  return { panel: !!d.querySelector('.wlworld'), behind: d.firstChild.className==='wlworld' }; }
```

Expected `{panel:true, behind:true}`. (Full visual sign-off happens in Task 7/8.)

- [ ] **Step 6: Commit**

```bash
git add wordlab-worlds.js tests/test-worlds-catalogue.js
git commit -m "feat(lab-shop): add WLWorlds module — 8 animated world backdrops"
```

---

## Task 6: Export worlds from `wordlab-shop-data.js`

**Files:**
- Modify: `wordlab-shop-data.js` — add a `worlds` array sourced from `WLWorlds.WORLDS`, add to the `window.WLShopData` export (line ~146).

**Interfaces:**
- Consumes: `WLWorlds.WORLDS` (Task 5) — but `wordlab-shop-data.js` may load before `wordlab-worlds.js`, so derive lazily.
- Produces: `WLShopData.worlds` → array of `{id,name,cost,free,rarity,wall}` for the shop grid.

- [ ] **Step 1: Add the `worlds` getter**

Inside the IIFE, before the `window.WLShopData = {…}` export, add a lazy builder (so load order doesn't matter):

```javascript
  function buildWorlds() {
    if (typeof WLWorlds === 'undefined' || !WLWorlds.WORLDS) return [];
    return Object.entries(WLWorlds.WORLDS).map(function (e) {
      var id = e[0], w = e[1];
      return { id:id, name:w.name, cost:w.cost||0, free:(w.cost||0)===0,
               rarity:w.rarity||'common', wall:w.wall };
    });
  }
```

- [ ] **Step 2: Export it**

Change the `window.WLShopData = { … }` object (line ~146) to add a `worlds` accessor. Since the file exports a plain object, expose worlds as a getter so it evaluates after `WLWorlds` exists:

```javascript
  window.WLShopData = Object.assign({}, window.WLShopData, {
    colours: colours, patterns: patterns, heads: heads, faces: faces,
    wings: wings, dances: dances, dancesByTier: dancesByTier, rarityOf: rarityOf,
    get worlds(){ return buildWorlds(); }
  });
```

(If the existing export is already a literal `window.WLShopData = { colours, … }`, replace it with this `Object.assign` form so the `worlds` getter is included; keep every existing key.)

- [ ] **Step 3: Reviewer check (Playwright MCP, after Task 7 load wiring)**

```javascript
() => ({ count: WLShopData.worlds.length, ids: WLShopData.worlds.map(w=>w.id) })
```

Expected: `count:8`, ids include all eight. Free Lab has `free:true`.

- [ ] **Step 4: Commit**

```bash
git add wordlab-shop-data.js
git commit -m "feat(lab-shop): expose worlds catalogue via WLShopData.worlds"
```

---

## Task 7: Wire the Worlds category into the scientist.html shop

**Files:**
- Modify: `scientist.html` — add `<script src="wordlab-worlds.js" defer></script>` next to the existing `wordlab-effects.js` tag; add the `worlds` entry to `WL.CATS` (line 1283–1293); add `worlds` to `WL.ownKey` (1319); add a worlds swatch branch to `WL.cardEl` preview (line 1508 block); add `WL.equipWorld` (next to `WL.equipEffect`, ~2296); add a `worlds` branch to `WL.equipFor` (2385); render the world layer in `WL.renderStage` (1072); add low-stim CSS for `.wlworld`.

**Interfaces:**
- Consumes: `WLWorlds.start/stop/wallOf`, `WLShopData.worlds`, `WL.scientist.world`, `_calm()`.
- Produces: `WL.equipWorld(id)`; a 10th pill `data-cat="worlds"`.

- [ ] **Step 1: Add the script tag**

Find the line loading effects (`<script src="wordlab-effects.js"…>`) and add directly after it:

```html
  <script src="wordlab-worlds.js" defer></script>
```

(Match the existing tag's attributes — if `wordlab-effects.js` has `defer`, use `defer`; load order: after `wordlab-data.js`, before the inline shop script. `wordlab-shop-data.js`'s lazy getter tolerates either order.)

- [ ] **Step 2: Add the `worlds` pill to `WL.CATS`**

In `WL.CATS` (lines 1283–1293), add after the `wings` entry:

```javascript
  {id:'worlds',  label:'Worlds',  icon:'🌍', field:'world',       src:()=>WLShopData.worlds },
```

- [ ] **Step 3: Namespace the ownKey for worlds**

In `WL.ownKey` (line 1319), add before the final `return item.id;`:

```javascript
  if (cat.id === 'worlds')  return 'world_'  + item.id;
```

- [ ] **Step 4: Add the worlds swatch branch in `WL.cardEl`**

In the preview block of `WL.cardEl` (line 1508), add a branch (place it after the `colours` branch, before `patterns`):

```javascript
  } else if (cat.id === 'worlds') {
    var ws = document.createElement('div');
    ws.className = 'lab-swatch';
    ws.style.background = WLWorlds.wallOf(item.id);
    preview.appendChild(ws);
```

- [ ] **Step 5: Add `WL.equipWorld`**

Immediately after `WL.equipEffect` (ends line 2313), add (mirrors equipEffect; passing `'none'` clears it):

```javascript
/* ── WL.equipWorld — sets scientist.world, persists, re-renders stage ──
 * Mirrors WL.equipEffect. The world panel is (re)built by renderStage, so we
 * simply re-render the stage after persisting. Static gradient shows even in
 * calm mode; renderStage suppresses drift via WLWorlds' own low-stim check. */
WL.equipWorld = async function(id) {
  WL.scientist.world = (id === 'none' ? null : id);
  try {
    await WordLabData.saveScientist({ world: WL.scientist.world });
  } catch(e) { console.error('[WL.equipWorld] saveScientist failed:', e); }
  WL.renderGrid();
  WL.renderStage();   // rebuilds podium + char + world panel from scientist.world
  WL.react();
};
```

- [ ] **Step 6: Add the `worlds` branch in `WL.equipFor`**

In `WL.equipFor` (line 2385), add before the final `else`:

```javascript
  } else if (cat.id === 'worlds') {
    var worldOn = WL.scientist && WL.scientist.world === item.id;
    WL.equipWorld(worldOn ? 'none' : item.id);
```

- [ ] **Step 7: Render the world layer in `WL.renderStage`**

In `WL.renderStage` (line 1072), after `stage.innerHTML = '';` (line 1077) and before building the podium, insert the world panel build. Also stop any prior world on the stage element. Add right after line 1077:

```javascript
  // World backdrop (Phase 2) — rendered behind podium + character.
  // WLWorlds manages its own panel node + drift interval keyed to `stage`.
  if (typeof WLWorlds !== 'undefined') {
    try { WLWorlds.stop(stage); } catch(e) {}
    if (WL.scientist && WL.scientist.world) {
      try { WLWorlds.start(WL.scientist.world, stage); } catch(e) {}
    }
  }
```

(WLWorlds inserts its `.wlworld` panel as `stage.firstChild` at z-index 0; the podium and character appended afterward sit above it. Ensure `.lab-podium` and `.lab-charwrap` have `z-index ≥ 1` — see Step 8.)

- [ ] **Step 8: Add CSS — stacking + low-stim**

In scientist.html's `<style>`, ensure the stage children sit above the world panel and the panel is killed for low-stim drift only. Add near the `.lab-podium`/`.lab-charwrap` rules:

```css
    #stage{ position:relative; }
    .lab-podium{ z-index:1; }
    .lab-charwrap{ z-index:2; }
    /* World drift suppressed in low-stim; gradient panel remains visible */
    body.low-stim .wlworld *{ animation:none !important; }
```

Do **NOT** add `[data-cat="worlds"]` to the `body.low-stim … {display:none}` pill-hiding rule (line 345–347) — the Worlds pill stays usable in low-stim.

- [ ] **Step 9: Reviewer verification (Playwright MCP) — persistence + equip + toggle**

Navigate `scientist.html?cb=t7`, start Test 2 session, reload. Open the Worlds pill (10th pill, 🌍). Then:

1. **Persistence round-trip (critical — proves the RPC accepts `world`):**
```javascript
async () => { await WordLabData.saveScientist({ world:'galaxy' });
  const sd = await WordLabData.getStudentData();
  return { saved: sd.scientist.world }; }   // expect 'galaxy'
```
If `saved` is `undefined`/`null`, the `save_scientist_field` RPC rejects unknown fields → STOP and add a DB migration (see §Risk below) before continuing.

2. **Equip + stage render:** click Galaxy → evaluate `!!document.querySelector('#stage .wlworld')` → expect `true`; the gradient shows behind the character. Click Galaxy again → world clears (`scientist.world` null, no `.wlworld`).
3. **Swatch:** world cards show the gradient swatch (not the ❓ icon).

Screenshot for visual sign-off.

- [ ] **Step 10: Commit**

```bash
git add scientist.html
git commit -m "feat(lab-shop): wire Worlds category into the scientist shop + stage"
```

**Risk note (Step 9.1):** `saveScientist` calls the generic `save_scientist_field(p_student_id, p_field, p_value)` RPC which does a `jsonb_set` on the `scientist` column — it is field-agnostic and should accept `world` with no change. The Step 9.1 check confirms this empirically. If (unexpectedly) the RPC has a server-side field allowlist, add a migration updating the RPC to permit `world`; this is the only scenario requiring a DB change.

---

## Task 8: Render worlds everywhere the character appears

**Files:**
- Modify: `wordlab-scientist.js` — add `_worldTargets()` and `_startEquippedWorld(sd)` (next to `_effectTargets`/`_startEquippedEffect`, lines 697–719); call `_startEquippedWorld(sd)` where `_startEquippedEffect(sd)` is called (lines 748 and 759).
- Modify: 13 other character pages — add `<script src="wordlab-worlds.js" defer></script>` next to their existing `wordlab-effects.js` tag.

**Interfaces:**
- Consumes: `WLWorlds.start/stop`, `sd.scientist.world`, `_effectTargets()`.
- Produces: worlds rendered on `.scientist-stage` (game pages) and `#hubSciAvatar` (landing), excluding the header pill.

- [ ] **Step 1: Add `_worldTargets` + `_startEquippedWorld` in wordlab-scientist.js**

After `_startEquippedEffect` (line 719), add:

```javascript
  // World backdrop targets = effect targets MINUS the tiny header widget.
  function _worldTargets() {
    return _effectTargets().filter(el => el !== _widgetEl);
  }

  function _startEquippedWorld(sd) {
    if (typeof WLWorlds === 'undefined') return;
    const worldId = sd && sd.scientist && sd.scientist.world;
    _worldTargets().forEach(el => {
      if (worldId) WLWorlds.start(worldId, el);
      else WLWorlds.stop(el);
    });
  }
```

- [ ] **Step 2: Call it alongside the effect starter**

At line 748 (`_startEquippedEffect(sd);`) add directly after:

```javascript
    _startEquippedWorld(sd);
```

And inside the `_pick` re-fetch closure at line 759 (`_startEquippedEffect(newSd);`) add directly after:

```javascript
          _startEquippedWorld(newSd);
```

- [ ] **Step 3: Add the script tag to the 13 other pages**

Add `<script src="wordlab-worlds.js" defer></script>` immediately after the `wordlab-effects.js` tag in each of:
`breakdown-mode.html`, `flashcard-mode.html`, `homophone-mode.html`, `landing.html`, `meaning-mode.html`, `mission-mode.html`, `morpheme-builder.html`, `phoneme-mode.html`, `root-lab.html`, `sound-sorter.html`, `speed-mode.html`, `syllable-mode.html`, `word-spectrum.html`.

Verify the set with: `grep -l "wordlab-effects.js" *.html` — every file listed (except scientist.html, done in Task 7) must gain the worlds tag. Confirm none missed:

```bash
comm -23 <(grep -l "wordlab-effects.js" *.html | sort) <(grep -l "wordlab-worlds.js" *.html | sort)
```
Expected: empty output (every effects page now also loads worlds).

- [ ] **Step 4: Reviewer verification (Playwright MCP) — everywhere**

With Test 2 having `world:'galaxy'` + an effect equipped (from Task 7), navigate `http://localhost:8080/breakdown-mode.html?cb=t8`, then `landing.html?cb=t8`. On each evaluate:

```javascript
() => ({ stageWorld: !!document.querySelector('.scientist-stage .wlworld'),
         hubWorld: !!(document.getElementById('hubSciAvatar') &&
                      document.getElementById('hubSciAvatar').querySelector('.wlworld')),
         headerHasWorld: !!(document.getElementById('wlScientistWidget') &&
                            document.getElementById('wlScientistWidget').querySelector('.wlworld')) })
```

Expected (breakdown-mode): `stageWorld:true`. Expected (landing): `hubWorld:true`. On **both**: `headerHasWorld:false` (header pill excluded). The world must not clash with / overflow the page background. Screenshot each.

- [ ] **Step 5: Commit**

```bash
git add wordlab-scientist.js breakdown-mode.html flashcard-mode.html homophone-mode.html landing.html meaning-mode.html mission-mode.html morpheme-builder.html phoneme-mode.html root-lab.html sound-sorter.html speed-mode.html syllable-mode.html word-spectrum.html
git commit -m "feat(lab-shop): render equipped world behind character on all pages"
```

---

## Task 9: Full verification pass — low-stim, mobile, teardown/perf

**Files:** none (verification + any fix-forward commits).

- [ ] **Step 1: Low-stim behaviour (Playwright MCP)**

Enable low-stim for the test class (or set `body.classList.add('low-stim')` + the sessionStorage flag), reload `scientist.html?cb=t9`. Verify:

```javascript
() => ({ effectsPillHidden: getComputedStyle([...document.querySelectorAll('[data-cat="effects"]')][0]).display === 'none',
         worldsPillVisible: getComputedStyle([...document.querySelectorAll('[data-cat="worlds"]')][0]).display !== 'none' })
```
Expected `{effectsPillHidden:true, worldsPillVisible:true}`. Equip a world → gradient panel shows, **no drift particles** spawn (panel has the floor+glow but no animated children after 1s). Equip an effect path stays suppressed (no particles).

- [ ] **Step 2: `prefers-reduced-motion` (Playwright MCP)**

Emulate reduced motion (Playwright: set media). Reload. Confirm worlds show static gradient, no drift; effects do not animate.

- [ ] **Step 3: Teardown / no leaks**

Rapidly switch among 4 worlds and 4 effects (10× each) on scientist.html, then:

```javascript
() => ({ worldPanels: document.querySelectorAll('.wlworld').length,   // expect 1 (or 0 if none equipped)
         effectNodes: WL.charEl.querySelectorAll('[class^=wlfx],[style*=wlfx]').length,
         stageChildren: document.getElementById('stage').children.length }) // podium+char+(world) ≤ 3
```
Expected: exactly one `.wlworld` (no accumulation), stage children ≤ 3, no runaway node growth. Switching effects leaves no orphaned particle nodes after `stop`.

- [ ] **Step 4: Mobile (Playwright MCP, 390×844 and 360×640)**

Resize to 390×844, reload `scientist.html?cb=t9m` — the stacked layout's stage shows the world panel scaled to the stage; no overflow. Resize a game page (`breakdown-mode.html`) to 360×640 — backdrop stays within `.scientist-stage`, no horizontal scroll.

- [ ] **Step 5: Premium effects visual sign-off**

Screenshot each of Laser Grid, Quark Rain, Black Hole previewing on the stage at desktop size; confirm each reads as a distinct, multi-layer "premium" effect (not a single particle stream). Tune particle counts/cadence in the relevant `fx*` function if any feels sparse or janky, then re-commit that file.

- [ ] **Step 6: Run both integrity tests**

```bash
node tests/test-effects-catalogue.js && node tests/test-worlds-catalogue.js
```
Expected: both print `OK`.

- [ ] **Step 7: Final commit (only if Step 5 tuning changed code)**

```bash
git add wordlab-effects.js
git commit -m "polish(lab-shop): tune premium effect density after visual review"
```

---

## Self-Review (completed by plan author)

**Spec coverage:**
- 7 effects (§4) → Tasks 1–4. The 3 premium effects (§4.2) → Tasks 2,3,4 individually, each multi-layer per the spec's bullets. ✓
- Worlds module + 8-world catalogue (§5.1–5.2) → Task 5. ✓
- Worlds everywhere via `_startEquippedWorld`/`_worldTargets`, header excluded (§5.3, D4) → Task 8. ✓
- Contained scene panel behind character (D3, D6) → Task 5 `.wlworld` (z-index 0, `insertBefore firstChild`) + Task 7 Step 8 stacking. ✓
- `scientist.world` persistence via generic RPC, no DDL (D5, §6.1) → Task 7 Step 9.1 round-trip check + risk note. ✓
- Shop wiring: pill, ownKey, swatch, equip (§6.2) → Task 7. ✓
- `WLShopData.worlds` (§6.3) → Task 6. ✓
- Low-stim keeps gradient + Worlds pill visible; drift suppressed (D7, §5.4) → Task 7 Step 8 + Task 9 Steps 1–2. ✓
- `buildSVG` untouched (D6) → no task modifies it. ✓
- Costs on live scale (§4.1, 5.2) → set in Tasks 1–5. ✓
- Verification incl. cache-bust + test account (§8) → throughout, Global Constraints. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to Task N". All code blocks are complete and runnable. ✓

**Type/name consistency:** `fxHearts/fxSnow/fxPetals/fxSmoke/fxLasers/fxQuarkRain/fxBlackhole` consistent between catalogue, `_fns`, and integrity test. `WLWorlds.start/stop/preview/WORLDS/wallOf` consistent across Tasks 5–8. `WL.equipWorld`, `_worldTargets`, `_startEquippedWorld`, `WL.scientist.world`, ownKey `'world_'+id`, pill `data-cat="worlds"` consistent across Tasks 6–9. ✓
