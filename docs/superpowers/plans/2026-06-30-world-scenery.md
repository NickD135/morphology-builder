# World Scenery (Plan 1 of 2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each of the 8 worlds a bespoke, hand-authored animated SVG scene (fish, foliage, planets, lava, etc.) rendered behind the character, replacing the plain text-glyph drift.

**Architecture:** A `SCENES` map (keyed by world id) in `wordlab-worlds.js` holds, per world, a static SVG props string + a list of sprite descriptors. A `_buildScene` helper injects the props layer and places sprites **once** as children of the `.wlworld` panel, animated with **infinite CSS keyframe loops** (negative `animation-delay` spreads them out). No per-frame JS and no respawn intervals — so teardown is just the existing panel removal in `stop()`. Low-stim/reduced-motion renders the static props but skips sprites.

**Tech Stack:** Vanilla JS (no build), inline SVG strings, CSS keyframe animations. Verification via Playwright MCP + a Node integrity script.

## Global Constraints

- No build system, no npm, no frameworks — static files only; all SVG is hand-authored, trusted (no user input).
- This is **Plan 1 of 2** (spec `docs/superpowers/specs/2026-06-30-worlds-scenery-effect-depth-design.md`). It is additive to `wordlab-worlds.js` ONLY — do not touch `wordlab-effects.js`, the effect-depth work (Plan 2), the character SVG, or the DB.
- Worlds render behind the character; the `.wlworld` panel is z-index 0 within the stage. Internal scene layer order: wall (panel bg) < floor/glow (z 1) < scene props (z 2) < sprites (z 3).
- Sprites are placed ONCE with **infinite CSS animations** + negative `animation-delay`; NO `setInterval`/RAF for scenery. Teardown is the existing `stop()` panel removal — do not add new intervals to `_active`.
- Low-stim / reduced-motion: build the static props, **skip sprite creation**. The module's `_calmMotion()` is the gate; the existing `body.low-stim .wlworld *{animation:none}` + `@media(prefers-reduced-motion:reduce)` CSS stays.
- One world renders at a time (the equipped one). Keep sprite counts modest (≈4–12 nodes/world).
- Verification: **no-cache server + cache-bust + test account** — see `reference_local_verify_js_cache` memory. Defeat the JS cache (no-store server, `fetch('/wordlab-worlds.js',{cache:'reload'})` to repopulate) and set the Test 2 session (classId `a05e407f-32b5-48cd-977f-e4835e13011f`, studentId `ec4c1e84-bba0-495a-aa7e-e0ba20a0858b`) BEFORE navigating.
- All 8 SCENES ids must exactly match the WORLDS keys: `lab, galaxy, underwater, sunset, forest, neon, candy, volcano`.

**Current module shape (read before starting):** `wordlab-worlds.js` — `WORLDS` catalogue (keys above; each has `name,cost,rarity,drift,wall,floor,grid,glow`), `_active`/`_state`/`stop` (removes the panel + clears intervals), `rnd`/`rndInt`, `_calmMotion()`, `_injectStyle()` (CSS + keyframes, id `wlworlds-css`), `_buildPanel(w)` (panel+floor+glow), `_driftSpawner(panel,theme)` (TO BE REMOVED in Task 1), `_render(id,el,intense)` (calls `_buildPanel` then the drift block), `start/preview/stop/wallOf/WORLDS` export.

---

## Task 1: Scene engine + Aquatic reference scene

**Files:**
- Modify: `wordlab-worlds.js` — extend `_injectStyle`; add `SCENES` (Aquatic only) + `_placeSprites` + `_buildScene`; rewrite `_render`'s drift block; delete `_driftSpawner`.
- Modify: `tests/test-worlds-catalogue.js` — extend to assert SCENES integrity.

**Interfaces:**
- Produces: `SCENES` (object keyed by world id → `{ props:string, sprites:Array<{svg,n,anim,dur:[min,max],size:[min,max],top?:[min,max],left?:[min,max],flip?:boolean}> }`); `_placeSprites(panel, sprite)`; `_buildScene(panel, id, calm)`. Sprite `anim` ∈ `swim|fall|rise|bob|sway|pulse|twinkle`.

- [ ] **Step 1: Extend the integrity test (RED)**

In `tests/test-worlds-catalogue.js`, before the final `console.log`, add a SCENES check:

```javascript
// Scene engine: SCENES must exist and (by end of Plan 1) cover all 8 worlds.
// Task 1 only adds 'underwater'; the per-world tasks add the rest. This block
// asserts the engine + at least the Aquatic reference scene are present.
if (!/\bSCENES\s*=/.test(src)) { console.error('MISSING SCENES map'); fail++; }
if (!src.includes('_buildScene')) { console.error('MISSING _buildScene'); fail++; }
if (!src.includes('_placeSprites')) { console.error('MISSING _placeSprites'); fail++; }
if (!/underwater\s*:\s*\{\s*props/.test(src.replace(/\s+/g,' '))) { console.error('MISSING underwater scene'); fail++; }
```

Run: `node tests/test-worlds-catalogue.js` → FAIL (MISSING SCENES map / _buildScene / _placeSprites / underwater scene).

- [ ] **Step 2: Extend `_injectStyle` with scene base CSS + keyframes**

In `wordlab-worlds.js`, replace the `s.textContent = \`…\`;` block inside `_injectStyle` (lines ~49–58) with this (keeps the existing rules, adds scene CSS + keyframes; drops the now-unused drift keyframes):

```javascript
    s.textContent = `
      .wlworld{ position:absolute; inset:0; z-index:0; border-radius:inherit; overflow:hidden; pointer-events:none; }
      .wlworld-floor{ position:absolute; left:0; right:0; bottom:0; height:34%; z-index:1; }
      .wlworld-glow{ position:absolute; left:50%; bottom:18%; width:60%; height:40%; transform:translateX(-50%); border-radius:50%; filter:blur(14px); z-index:1; }
      .wlworld-scene{ position:absolute; inset:0; z-index:2; }
      .wlworld-scene svg{ width:100%; height:100%; display:block; }
      .wlw-sprite{ position:absolute; z-index:3; will-change:transform; }
      .wlw-sprite svg{ width:100%; height:auto; display:block; overflow:visible; }
      .wlw-swim   { left:0; animation:wlwSwim linear infinite; }
      .wlw-fall   { animation:wlwFall linear infinite; }
      .wlw-rise   { animation:wlwRise linear infinite; }
      .wlw-bob    { animation:wlwBob ease-in-out infinite; }
      .wlw-sway   { transform-origin:50% 100%; animation:wlwSway ease-in-out infinite; }
      .wlw-pulse  { animation:wlwPulse ease-in-out infinite; }
      .wlw-twinkle{ animation:wlwTwinkle ease-in-out infinite; }
      @keyframes wlwSwim { from{transform:translateX(-30%)} to{transform:translateX(130%)} }
      @keyframes wlwFall { from{transform:translateY(-15%) rotate(0deg)} to{transform:translateY(115%) rotate(var(--r,360deg))} }
      @keyframes wlwRise { 0%{transform:translateY(115%);opacity:0} 12%{opacity:1} 88%{opacity:1} 100%{transform:translateY(-15%);opacity:0} }
      @keyframes wlwBob  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7%)} }
      @keyframes wlwSway { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
      @keyframes wlwPulse{ 0%,100%{opacity:.45} 50%{opacity:1} }
      @keyframes wlwTwinkle { 0%,100%{opacity:.25} 50%{opacity:1} }
      @media(prefers-reduced-motion:reduce){ .wlworld *{ animation:none !important; } }
      body.low-stim .wlworld *{ animation:none !important; }
    `;
```

- [ ] **Step 3: Delete `_driftSpawner` and add `SCENES` + `_placeSprites` + `_buildScene`**

Delete the entire `_driftSpawner` function (lines ~76–94). In its place add:

```javascript
  // ── Scenes: static SVG props + animated sprites, per world ─────
  // anim ∈ swim|fall|rise|bob|sway|pulse|twinkle. dur/size/top/left are [min,max].
  // swim ignores left (the keyframe traverses); fall/rise/bob use left for x.
  const SCENES = {
    underwater: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<g fill="#0a3d63">'+
            '<path d="M6 100 q3-22 1-34 q5 12 7 0 q1 18-2 34Z"/>'+
            '<path d="M16 100 q2-16 0-26 q4 9 6-1 q1 16-2 27Z"/>'+
            '<path d="M88 100 q-3-26 0-40 q5 14 8 1 q1 22-3 39Z"/>'+
          '</g>'+
          '<g stroke="rgba(190,245,255,.18)" stroke-width="2" fill="none">'+
            '<line x1="30" y1="0" x2="38" y2="60"/><line x1="62" y1="0" x2="56" y2="55"/>'+
          '</g>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 24 14"><path d="M2 7 Q9 1 16 7 Q9 13 2 7Z" fill="#ffb454"/><path d="M16 7 l6-4 0 8Z" fill="#ff9a3c"/><circle cx="6" cy="6" r="1" fill="#3a2a10"/></svg>',
          n:4, anim:'swim', dur:[7,12], size:[9,15], top:[18,68], flip:true },
        { svg:'<svg viewBox="0 0 20 12"><path d="M2 6 Q8 1 14 6 Q8 11 2 6Z" fill="#7fd6ff"/><path d="M14 6 l5-3 0 6Z" fill="#5bbfe8"/></svg>',
          n:3, anim:'swim', dur:[9,15], size:[6,10], top:[30,80], flip:true },
        { svg:'<svg viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="rgba(200,245,255,.7)"/></svg>',
          n:5, anim:'rise', dur:[5,9], size:[2,4], left:[10,90] }
      ]
    }
  };

  // Place a sprite group ONCE; infinite CSS loop + negative delay spreads them out.
  function _placeSprites(panel, sp){
    for(let i=0;i<sp.n;i++){
      const wrap = document.createElement('div');
      wrap.className = 'wlw-sprite wlw-'+sp.anim;
      const dur = rnd(sp.dur[0], sp.dur[1]);
      let css = `width:${rnd(sp.size[0],sp.size[1]).toFixed(1)}%;`+
                `animation-duration:${dur.toFixed(2)}s;animation-delay:${(-rnd(0,dur)).toFixed(2)}s;`;
      if (sp.top)  css += `top:${rnd(sp.top[0],sp.top[1]).toFixed(1)}%;`;
      if (sp.left) css += `left:${rnd(sp.left[0],sp.left[1]).toFixed(1)}%;`;
      if (sp.anim==='fall') css += `--r:${rndInt(180,540)}deg;`;
      wrap.style.cssText = css;
      // Inner holder carries any static flip so it never fights the animation transform.
      const inner = document.createElement('div');
      if (sp.flip && rndInt(0,2)) inner.style.transform = 'scaleX(-1)';
      inner.innerHTML = sp.svg;
      wrap.appendChild(inner);
      panel.appendChild(wrap);
    }
  }

  // Build a world's scene into the panel. Static props always; sprites only when not calm.
  function _buildScene(panel, id, calm){
    const sc = SCENES[id];
    if(!sc) return;                       // worlds without a scene yet: gradient+floor only
    if(sc.props){
      const layer = document.createElement('div');
      layer.className = 'wlworld-scene';
      layer.innerHTML = sc.props;         // trusted, hand-authored SVG
      panel.appendChild(layer);
    }
    if(!calm && sc.sprites){ sc.sprites.forEach(sp => _placeSprites(panel, sp)); }
  }
```

- [ ] **Step 4: Rewrite the drift block in `_render`**

In `_render` (lines ~96–107), replace the `if (!_calmMotion()) { … _driftSpawner … }` block with a single call (note: `stop()` removing the panel tears down all sprites, so no interval tracking needed):

```javascript
  function _render(id, el, intense){
    stop(el);
    const w = WORLDS[id]; if(!w) return;
    _injectStyle(); _ensurePositioned(el);
    const panel = _buildPanel(w);
    el.insertBefore(panel, el.firstChild);    // behind everything else in el
    const s = _state(el); s.panel = panel;
    _buildScene(panel, id, _calmMotion());
  }
```

(`intense` is now unused by `_render`; leave the `start`/`preview` signatures as-is — `preview` still calls `_render(id,el,true)`.)

- [ ] **Step 5: Run the integrity test (GREEN for Task 1's scope)**

Run: `node tests/test-worlds-catalogue.js`
Expected: PASS — `OK — 8 worlds + full WLWorlds API present` (the SCENES block now finds the map, `_buildScene`, `_placeSprites`, and the `underwater` scene).

- [ ] **Step 6: Reviewer visual check (Playwright MCP)**

Start the **no-cache** server; `fetch('/wordlab-worlds.js',{cache:'reload'})`; set the Test 2 session; navigate `scientist.html?cb=s1`, open the Worlds pill, equip **Aquatic**. Evaluate:

```javascript
() => { const panel=document.querySelector('#stage .wlworld');
  return { scene: !!panel.querySelector('.wlworld-scene'),
           sprites: panel.querySelectorAll('.wlw-sprite').length,   // ~12
           swimmers: panel.querySelectorAll('.wlw-swim').length }; } // ~7
```
Expected: scene present, ~12 sprites, fish (swimmers) visibly traversing left↔right at varied depths, bubbles rising. Screenshot for sign-off. Then toggle low-stim on + re-equip → `.wlworld-scene` present, `.wlw-sprite` count **0** (sprites skipped), no motion.

- [ ] **Step 7: Commit**

```bash
git add wordlab-worlds.js tests/test-worlds-catalogue.js
git commit -m "feat(worlds): scene engine + Aquatic scene (swimming fish, bubbles, seaweed)"
```

---

## Task 2: Forest scene

**Files:** Modify `wordlab-worlds.js` — add `SCENES.forest`.
**Interfaces:** Consumes the Task 1 SCENES shape + `swim|fall|sway` anims.

- [ ] **Step 1: Add the Forest scene**

Add a `forest` entry to `SCENES` (after `underwater`):

```javascript
    forest: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<g>'+
            '<rect x="20" y="46" width="5" height="40" fill="#3a2a18"/>'+
            '<path d="M22 20 L10 52 L34 52Z M22 34 L13 60 L31 60Z" fill="#2f7a3a"/>'+
            '<rect x="70" y="40" width="6" height="46" fill="#3a2a18"/>'+
            '<path d="M73 14 L58 54 L88 54Z M73 30 L62 64 L84 64Z" fill="#357f3e"/>'+
            '<ellipse cx="46" cy="86" rx="20" ry="6" fill="#2d6a35"/>'+
          '</g>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 12 10"><path d="M6 0 C10 3 10 7 6 10 C2 7 2 3 6 0Z" fill="#e8b04a"/><path d="M6 1 V9" stroke="#a87a2a" stroke-width=".6"/></svg>',
          n:7, anim:'fall', dur:[5,9], size:[3,6], left:[6,92] },
        { svg:'<svg viewBox="0 0 12 10"><path d="M6 0 C10 3 10 7 6 10 C2 7 2 3 6 0Z" fill="#c75b39"/></svg>',
          n:4, anim:'fall', dur:[6,10], size:[3,5], left:[10,88] },
        { svg:'<svg viewBox="0 0 16 8"><path d="M1 6 Q4 2 7 5 Q10 1 15 5" stroke="#2a2a2a" stroke-width="1.4" fill="none"/></svg>',
          n:1, anim:'swim', dur:[14,18], size:[7,9], top:[12,24] }
      ]
    },
```

- [ ] **Step 2: Reviewer visual check (Playwright MCP)**

Cache-defeat + Test 2 session; equip **Forest**. Expect layered trees, tumbling leaves (green + amber) falling and rotating, a bird gliding across the top. `panel.querySelectorAll('.wlw-fall').length` ≈ 11. Screenshot.

- [ ] **Step 3: Commit**

```bash
git add wordlab-worlds.js
git commit -m "feat(worlds): Forest scene (trees, falling leaves, gliding bird)"
```

---

## Task 3: Galaxy scene

**Files:** Modify `wordlab-worlds.js` — add `SCENES.galaxy`.
**Interfaces:** Consumes Task 1 shape + `bob|twinkle|swim` anims.

- [ ] **Step 1: Add the Galaxy scene**

```javascript
    galaxy: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<circle cx="78" cy="26" r="11" fill="#6a5acd"/>'+
          '<ellipse cx="78" cy="26" rx="18" ry="4" fill="none" stroke="rgba(180,160,255,.6)" stroke-width="1.5"/>'+
          '<circle cx="20" cy="60" r="6" fill="#8a6df0"/>'+
          '<circle cx="40" cy="18" r="3" fill="#b9a6ff"/>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 6 6"><circle cx="3" cy="3" r="1.4" fill="#fff"/></svg>',
          n:8, anim:'twinkle', dur:[2,4], size:[1.5,3], top:[5,90], left:[4,94] },
        { svg:'<svg viewBox="0 0 30 6"><path d="M0 3 H22" stroke="rgba(255,255,255,.85)" stroke-width="2" stroke-linecap="round"/><circle cx="25" cy="3" r="3" fill="#fff"/></svg>',
          n:1, anim:'swim', dur:[7,9], size:[14,18], top:[14,30] },
        { svg:'<svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="#4db8ff"/></svg>',
          n:1, anim:'bob', dur:[5,7], size:[7,9], top:[64,72], left:[55,62] }
      ]
    },
```

- [ ] **Step 2: Reviewer visual check** — equip **Galaxy**: ringed planet top-right, twinkling stars, a comet streaking across, a small planet bobbing. Screenshot.

- [ ] **Step 3: Commit**

```bash
git add wordlab-worlds.js
git commit -m "feat(worlds): Galaxy scene (planets, twinkling stars, comet)"
```

---

## Task 4: Volcano scene

**Files:** Modify `wordlab-worlds.js` — add `SCENES.volcano`.
**Interfaces:** Consumes Task 1 shape + `rise|pulse` anims.

- [ ] **Step 1: Add the Volcano scene**

```javascript
    volcano: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<path d="M28 100 L46 40 L54 40 L72 100Z" fill="#3a1a10"/>'+
          '<path d="M46 40 L54 40 L58 50 Q50 46 42 50Z" fill="#ff6a2a"/>'+
          '<path d="M0 100 L14 74 L30 100Z" fill="#2a120a"/>'+
          '<path d="M74 100 L88 70 L100 100Z" fill="#2a120a"/>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 6 6"><circle cx="3" cy="3" r="2" fill="#ff8a3c"/></svg>',
          n:7, anim:'rise', dur:[4,8], size:[1.5,3.5], left:[40,60] },
        { svg:'<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="rgba(255,120,40,.5)"/></svg>',
          n:1, anim:'pulse', dur:[2,3], size:[24,30], top:[30,36], left:[40,48] },
        { svg:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="rgba(120,120,120,.4)"/></svg>',
          n:3, anim:'rise', dur:[6,10], size:[8,14], left:[42,56] }
      ]
    },
```

- [ ] **Step 2: Reviewer visual check** — equip **Volcano**: cone with glowing crater, embers rising from the crater, a pulsing lava glow, smoke wisps drifting up. Screenshot.

- [ ] **Step 3: Commit**

```bash
git add wordlab-worlds.js
git commit -m "feat(worlds): Volcano scene (cone, rising embers, lava glow, smoke)"
```

---

## Task 5: Candy scene

**Files:** Modify `wordlab-worlds.js` — add `SCENES.candy`.
**Interfaces:** Consumes Task 1 shape + `fall|swim|bob` anims.

- [ ] **Step 1: Add the Candy scene**

```javascript
    candy: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<g>'+
            '<rect x="14" y="40" width="7" height="50" rx="3" fill="#ff7fc0"/>'+
            '<rect x="14" y="40" width="7" height="50" rx="3" fill="url(#cstripe)" opacity=".5"/>'+
            '<rect x="80" y="48" width="7" height="42" rx="3" fill="#ff7fc0"/>'+
            '<circle cx="40" cy="86" r="8" fill="#ffd1ec"/><circle cx="58" cy="88" r="6" fill="#c8f0d8"/>'+
          '</g>'+
          '<defs><pattern id="cstripe" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="3" height="6" fill="#fff"/></pattern></defs>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 6 6"><rect width="6" height="6" rx="1.5" fill="#ff5aa0"/></svg>',
          n:5, anim:'fall', dur:[5,9], size:[2,4], left:[8,90] },
        { svg:'<svg viewBox="0 0 6 6"><rect width="6" height="6" rx="1.5" fill="#6ee7b7"/></svg>',
          n:4, anim:'fall', dur:[6,10], size:[2,4], left:[8,90] },
        { svg:'<svg viewBox="0 0 14 18"><circle cx="7" cy="6" r="6" fill="#ffb4dc"/><rect x="6.2" y="11" width="1.6" height="7" fill="#fff"/></svg>',
          n:2, anim:'bob', dur:[4,6], size:[8,11], top:[20,46], left:[30,66] }
      ]
    },
```

- [ ] **Step 2: Reviewer visual check** — equip **Candy**: candy-cane pillars + gumdrops, sprinkles (pink/green) falling, lollipops bobbing. Screenshot.

- [ ] **Step 3: Commit**

```bash
git add wordlab-worlds.js
git commit -m "feat(worlds): Candy scene (canes, falling sprinkles, bobbing lollipops)"
```

---

## Task 6: Sunset scene

**Files:** Modify `wordlab-worlds.js` — add `SCENES.sunset`.
**Interfaces:** Consumes Task 1 shape + `swim|pulse` anims.

- [ ] **Step 1: Add the Sunset scene**

```javascript
    sunset: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<circle cx="50" cy="58" r="16" fill="#ffd27a"/>'+
          '<path d="M0 78 Q30 66 56 78 Q80 88 100 76 L100 100 L0 100Z" fill="#c4546b"/>'+
          '<path d="M0 88 Q40 80 70 90 Q88 94 100 88 L100 100 L0 100Z" fill="#9c3f5a"/>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 30 12"><ellipse cx="10" cy="7" rx="9" ry="4" fill="rgba(255,255,255,.55)"/><ellipse cx="20" cy="6" rx="8" ry="4" fill="rgba(255,255,255,.5)"/></svg>',
          n:3, anim:'swim', dur:[16,26], size:[16,26], top:[14,40] },
        { svg:'<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="rgba(255,210,130,.5)"/></svg>',
          n:1, anim:'pulse', dur:[3,5], size:[30,36], top:[48,52], left:[42,46] }
      ]
    },
```

- [ ] **Step 2: Reviewer visual check** — equip **Sunset**: sun disc with a soft pulsing halo, layered hills, clouds drifting slowly across. Screenshot.

- [ ] **Step 3: Commit**

```bash
git add wordlab-worlds.js
git commit -m "feat(worlds): Sunset scene (sun glow, hills, drifting clouds)"
```

---

## Task 7: Neon Grid scene

**Files:** Modify `wordlab-worlds.js` — add `SCENES.neon`.
**Interfaces:** Consumes Task 1 shape + `swim|pulse|bob` anims.

- [ ] **Step 1: Add the Neon scene**

```javascript
    neon: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<path d="M50 52 L4 100 M50 52 L96 100 M50 52 L24 100 M50 52 L76 100" stroke="rgba(255,60,200,.5)" stroke-width="1"/>'+
          '<line x1="0" y1="52" x2="100" y2="52" stroke="rgba(255,80,210,.8)" stroke-width="1.5"/>'+
          '<path d="M30 30 h40 v14 h-40Z" fill="none" stroke="#3cdcff" stroke-width="1.5" opacity=".7"/>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 10 10"><path d="M5 0 L10 5 L5 10 L0 5Z" fill="none" stroke="#ff3cc8" stroke-width="1.4"/></svg>',
          n:4, anim:'swim', dur:[8,14], size:[5,9], top:[10,44], flip:false },
        { svg:'<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.5" fill="none" stroke="#3cdcff" stroke-width="1.4"/></svg>',
          n:3, anim:'bob', dur:[3,5], size:[5,8], top:[14,42], left:[12,84] },
        { svg:'<svg viewBox="0 0 100 4"><rect width="100" height="4" fill="rgba(255,60,200,.5)"/></svg>',
          n:1, anim:'pulse', dur:[2,3], size:[100,100], top:[51,53], left:[0,0] }
      ]
    },
```

- [ ] **Step 2: Reviewer visual check** — equip **Neon Grid**: perspective grid to a bright horizon, neon diamonds gliding, glowing rings bobbing, the horizon line pulsing. Screenshot.

- [ ] **Step 3: Commit**

```bash
git add wordlab-worlds.js
git commit -m "feat(worlds): Neon Grid scene (perspective grid, gliding shapes, pulse)"
```

---

## Task 8: Lab scene

**Files:** Modify `wordlab-worlds.js` — add `SCENES.lab`.
**Interfaces:** Consumes Task 1 shape + `rise|bob|swim` anims.

- [ ] **Step 1: Add the Lab scene**

```javascript
    lab: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<rect x="0" y="40" width="100" height="3" fill="#cba23f" opacity=".5"/>'+
          '<g>'+
            '<path d="M18 60 l-3 22 q0 5 5 5 h8 q5 0 5-5 l-3-22Z" fill="rgba(120,220,255,.35)" stroke="#9ec9e0" stroke-width="1"/>'+
            '<rect x="20" y="56" width="8" height="5" fill="#9ec9e0"/>'+
            '<path d="M76 58 l-4 24 q0 5 5 5 h10 q5 0 5-5 l-4-24Z" fill="rgba(190,240,120,.35)" stroke="#bfe08a" stroke-width="1"/>'+
            '<rect x="78" y="54" width="9" height="5" fill="#bfe08a"/>'+
          '</g>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 5 5"><circle cx="2.5" cy="2.5" r="2" fill="rgba(120,220,255,.8)"/></svg>',
          n:4, anim:'rise', dur:[4,7], size:[1.5,3], left:[20,28] },
        { svg:'<svg viewBox="0 0 18 8"><circle cx="3" cy="4" r="3" fill="#7b6bff"/><circle cx="15" cy="4" r="3" fill="#3cdcff"/><line x1="6" y1="4" x2="12" y2="4" stroke="#9aa" stroke-width="1.2"/></svg>',
          n:3, anim:'swim', dur:[12,20], size:[8,12], top:[14,38] },
        { svg:'<svg viewBox="0 0 5 5"><circle cx="2.5" cy="2.5" r="2" fill="rgba(190,240,120,.8)"/></svg>',
          n:4, anim:'rise', dur:[4,7], size:[1.5,3], left:[78,87] }
      ]
    },
```

- [ ] **Step 2: Reviewer visual check** — equip **Lab** (it's the free default): a shelf line, two glowing flasks, bubbles rising from each flask, molecule pairs drifting across. Screenshot.

- [ ] **Step 3: Commit**

```bash
git add wordlab-worlds.js
git commit -m "feat(worlds): Lab scene (shelf, bubbling flasks, drifting molecules)"
```

---

## Task 9: Full verification + integrity

**Files:** `tests/test-worlds-catalogue.js` (tighten to require all 8 scenes); verification only otherwise.

- [ ] **Step 1: Require all 8 scenes in the integrity test**

In `tests/test-worlds-catalogue.js`, replace the single `underwater` scene check from Task 1 with a loop over all ids:

```javascript
for (const id of IDS) {                       // IDS already lists all 8 world ids
  if (!new RegExp(id + '\\s*:\\s*\\{\\s*props').test(src.replace(/\\s+/g,' '))) {
    console.error('MISSING scene: ' + id); fail++;
  }
}
```

Run: `node tests/test-worlds-catalogue.js` → PASS (all 8 scenes present).

- [ ] **Step 2: Reviewer full sweep (Playwright MCP)**

Cache-defeat + Test 2 session. For each of the 8 worlds: equip it, confirm `.wlworld-scene` + the expected sprite anims render, screenshot. Then:
- **Teardown:** rapidly switch through all 8 worlds 3× via `WL.equipWorld(id)`; confirm exactly one `.wlworld` panel and no sprite accumulation (`document.querySelectorAll('.wlw-sprite').length` stays bounded to the current world's count, not growing).
- **Low-stim:** enable low-stim, equip 3 different worlds; each shows `.wlworld-scene` (static props) with `.wlw-sprite` count 0.
- **Mobile (390px):** equip Aquatic + Forest; scene contained within the stage, no horizontal scroll, sprites don't overflow the panel.
- **Game page:** on `breakdown-mode.html` with a world equipped, the scene renders behind the character on `.scientist-stage`.

- [ ] **Step 3: Commit (only if Step 2 surfaced tuning edits)**

```bash
git add wordlab-worlds.js
git commit -m "polish(worlds): tune scene props/sprites after visual review"
```

---

## Self-Review (plan author)

**Spec coverage** (against `2026-06-30-worlds-scenery-effect-depth-design.md` §4):
- §4.1 layering (wall<floor/glow<props<sprites) → Task 1 Step 2 CSS z-index (1/1/2/3). ✓
- §4.2 architecture (SCENES map, scene+sprite builder, injected keyframes, infinite-loop sprites, teardown via panel removal) → Task 1 Steps 2–4. ✓
- §4.3 per-world content (all 8) → Task 1 (underwater) + Tasks 2–8. ✓ (galaxy/volcano/candy/sunset/neon/lab/forest each map to the table.)
- §4.4 low-stim (static props, skip sprites) → Task 1 `_buildScene` calm branch + Tasks' reviewer low-stim checks + Task 9 Step 2. ✓
- §4.5 perf (one world at a time, bounded counts, stop() removes panel) → infinite-CSS sprites need no intervals; counts 8–14/world. ✓
- §4.1.5 optional foreground prop → intentionally deferred (spec §9 open item); not implemented this plan. Noted, not a gap.

**Placeholder scan:** No TBD/TODO/"handle edge cases". Every scene has complete SVG; the helper/engine code is complete and runnable. ✓

**Type/name consistency:** `SCENES`, `_buildScene(panel,id,calm)`, `_placeSprites(panel,sp)`, sprite keys `svg/n/anim/dur/size/top/left/flip`, anim classes `wlw-{swim,fall,rise,bob,sway,pulse,twinkle}` with matching `@keyframes wlw{Swim,Fall,Rise,Bob,Sway,Pulse,Twinkle}` — consistent across Task 1 CSS, `_placeSprites`, and all 8 SCENES entries. `_render` calls `_buildScene(panel,id,_calmMotion())`; `stop()` unchanged (panel removal covers sprites). ✓
