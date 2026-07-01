# Character Art Port — Dimensional Base Shading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the scientist character soft dimensional volume (Option A — soft plush) by adding SVG shading layers to `WLScientist.buildSVG`, with every anchor frozen so all item overlays + teacher custom items stay pixel-aligned.

**Architecture:** Additive gradient/shape layers only, woven into the existing draw order. Skin gradient derived from the user's `skinTone`. Per-instance unique `<defs>` ids to prevent cross-contamination between multiple characters on one page. No SVG filters, no motion, no DB change.

**Tech Stack:** Vanilla JS (no build), inline SVG, Playwright + a local no-cache server for verification (no Supabase/login).

**Spec:** `docs/superpowers/specs/2026-07-01-character-art-port-design.md`

## Global Constraints

- **No build system** — vanilla HTML/CSS/JS, no npm/bundler/TS. No new dependencies. No DB/data-model change. (spec §2, §7)
- **Freeze every anchor:** `viewBox="0 0 80 120"` and all coordinates unchanged — head `cx40 cy38 r22`, eyes `34/46,cy36`, coat rect `14,60,52,58 rx10`, neck `33,54,14,10`, ears `cx18/62 cy40`, pocket, collar, badge region. Ears change **fill + draw order only**, never position. (spec §D1, §6)
- **Shade the HEAD with a radial gradient; ears + neck are FLAT** (slightly darker, no per-object gradient); **ears render behind the head.** (spec §D3)
- **Skin gradient stops derived from `skinTone`** and correct for any tone incl. dark: `HI` always lighter, `LO` always darker than base. (spec §D4, §5.1)
- **Coat depth = overlay shapes over the coat fill**, never change the coat fill (must survive plain/pattern/rainbow/holographic). (spec §D5)
- **Unique per-instance def ids:** a module counter suffixes EVERY def id (`sk/hs/hh/cs` AND existing `coatRainbow/coatHolo/cp/galaxyGrad`) and every `url(#…)` reference. (spec §D6)
- **No SVG filters** (`feGaussianBlur`/`feDropShadow`) — gradient/shape layers only, crisp at 44px. (spec §D7)
- **Static shading = low-stim safe; add NO motion.** (spec §D8)
- **Gradient stops use `stop-color` + `stop-opacity`** (not `rgba()` inside `stop-color`) for SVG robustness; shape `fill`/`stroke` may use `rgba(...)` (already used in the codebase, e.g. `wordlab-scientist.js:323`).
- Verification is **synthetic harness** (Playwright + no-cache server, no Supabase/login); merge stays **local, not pushed**. (spec §9)

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `wordlab-scientist.js` | Character renderer | `buildSVG`: module uid counter; `_mix` helper + `HI/LO/FLAT` derivation; `sk/hs/hh/cs` defs; suffix ALL def ids + refs with uid; insert ground-shadow/coat-shade/coat-sheen/head-shade/head-hi/blush layers; head fill→skin radial, ears+neck→`FLAT`, ears moved behind head. |
| `tests/manual/character-art-port-harness.html` | Verification | **New.** Renders the §9 matrix via `WLScientist.buildSVG`, self-checks, screenshots. |

The whole production change is in one function (`buildSVG`). Tasks split by risk: Task 1 = the id-uniqueness refactor (no visual change, de-risked alone); Task 2 = head/skin shading; Task 3 = coat + ground + blush; Task 4 = full matrix sweep + screenshots.

---

## Key facts (verified from `wordlab-scientist.js`)

- `buildSVG(scientist, reaction)` is at lines ~129-333 and is a **pure function** exported on `WLScientist` — the harness can call it directly with a plain object, no Supabase. `_buildBadgePins(scientist)` returns empty for an object with no badges.
- Existing def ids + refs to suffix:
  - `coatRainbow` — def `id="coatRainbow"` (~L148); ref `'url(#coatRainbow)'` in `coatBase` (~L144).
  - `coatHolo` — def `id="coatHolo"` (~L158); ref `'url(#coatHolo)'` (~L144).
  - `cp` — def `id="cp"` in **9** pattern branches (~L167-191); ref `'url(#cp)'` in `coatFillRef` (~L200).
  - `galaxyGrad` — def `id="galaxyGrad"` in `galaxyDef` (~L197); ref `url(#galaxyGrad)` inside `headAccSVG.galaxy_halo` (~L268).
- `allDefs = defsContent + galaxyDef;` (~L198) — the new `shadeDefs` string is appended here.
- Return template draw order (~L297-332): `coatFillDef` → wings → coat rect (`fill=coatFillRef`) → `customImg('coat')` → collar → pocket → badge pins → neck (`fill=skin`) → head (`fill=skin`) → ears (`fill=skin`) → face → head acc → face acc → sparkles/dizzy → custom overlays.
- `rgba()` in a shape `fill` already works here (L323 `fill="rgba(0,0,0,0.12)"`).

---

## Task 1: Per-instance unique def ids (refactor — no visual change)

**Files:**
- Modify: `wordlab-scientist.js` — add module counter; suffix the 4 existing def ids + their refs with a per-call uid.
- Create: `tests/manual/character-art-port-harness.html`

**Interfaces:**
- Produces: inside `buildSVG`, a `const uid` string unique per call; all existing def ids become `coatRainbow${uid}` / `coatHolo${uid}` / `cp${uid}` / `galaxyGrad${uid}` with matching refs. Later tasks add `sk/hs/hh/cs${uid}` using the same `uid`.

- [ ] **Step 1: Add the module counter** — near the top of the module (just inside the IIFE, before `function buildSVG`), add:

```javascript
  let _sciSeq = 0;
```

- [ ] **Step 2: Create the uid inside buildSVG** — after `reaction = reaction || 'neutral';` (~L131) add:

```javascript
    const uid = '_s' + (++_sciSeq);
```

- [ ] **Step 3: Suffix the coat gradient refs** — in `coatBase` (~L144) change:

```javascript
    const coatBase  = isRainbow ? `url(#coatRainbow${uid})` : isHolo ? `url(#coatHolo${uid})` : coat;
```

- [ ] **Step 4: Suffix the coat gradient def ids** — in the rainbow def change `id="coatRainbow"` → `id="coatRainbow${uid}"` and in the holo def change `id="coatHolo"` → `id="coatHolo${uid}"` (both are inside template literals, so `${uid}` interpolates).

- [ ] **Step 5: Suffix the pattern id (all 9 branches + the ref)** — replace every `<pattern id="cp"` with `<pattern id="cp${uid}"` (9 occurrences), and change `coatFillRef` (~L200):

```javascript
    const coatFillRef = ['stripes','molecules','stars','dots','chevrons','hearts','lightning','dna','plaid'].includes(pattern) ? `url(#cp${uid})` : coatBase;
```

- [ ] **Step 6: Suffix galaxyGrad (def + the galaxy_halo ref)** — in `galaxyDef` (~L197) change `id="galaxyGrad"` → `id="galaxyGrad${uid}"`; in `headAccSVG.galaxy_halo` (~L268) change `stroke="url(#galaxyGrad)"` → `stroke="url(#galaxyGrad${uid})"`.

- [ ] **Step 7: Create the verification harness** — `tests/manual/character-art-port-harness.html`:

```html
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Character art port harness</title>
<style>body{background:#1a1930;color:#e2e8f0;font-family:sans-serif;padding:16px}
.row{display:flex;gap:20px;flex-wrap:wrap;align-items:flex-end;margin:10px 0}
.cell{background:radial-gradient(120% 90% at 50% 30%,#2c2b45,#1a1930);border-radius:12px;padding:10px;text-align:center}
.cell svg{width:150px;height:225px;display:block}
.sm svg{width:44px;height:66px}
pre{background:#0f0e1c;padding:10px;border-radius:8px;white-space:pre-wrap}</style>
</head><body>
<h2>Character Art Port — Task 1 (unique ids)</h2>
<div id="stage"></div>
<pre id="results">running…</pre>
<script src="../../wordlab-scientist.js"></script>
<script>
(function(){
  const R = {};
  function svgOf(sci, rx){ const d=document.createElement('div'); d.innerHTML = WLScientist.buildSVG(sci, rx||'neutral'); return d.firstElementChild; }
  // Render a couple for eyeballing
  const stage = document.getElementById('stage');
  [['#FDBCB4','rainbow'],['#5C3A29','holographic'],['#C68642','dots']].forEach(([tone,coat])=>{
    const c=document.createElement('div'); c.className='cell';
    c.innerHTML = WLScientist.buildSVG({skinTone:tone, coatColor:coat, coatPattern:(coat==='dots'?'dots':'plain')},'happy');
    stage.appendChild(c);
  });
  // Isolation test: two instances, different pattern + tone, on the same page
  const a = svgOf({skinTone:'#FDBCB4', coatColor:'#ff0000', coatPattern:'dots'});
  const b = svgOf({skinTone:'#5C3A29', coatColor:'#00ff00', coatPattern:'stripes'});
  function ids(svg){ return [...svg.querySelectorAll('[id]')].map(n=>n.id); }
  function refs(svg){ return [...svg.querySelectorAll('*')].flatMap(n=>['fill','stroke'].map(a=>n.getAttribute(a)).filter(v=>v&&v.indexOf('url(#')===0).map(v=>v.slice(5,-1))); }
  const aIds=ids(a), bIds=ids(b);
  R.rainbowRenders = !!svgOf({coatColor:'rainbow'}).querySelector('linearGradient[id^=coatRainbow]');
  R.holoRenders    = !!svgOf({coatColor:'holographic'}).querySelector('linearGradient[id^=coatHolo]');
  R.patternRenders = !!svgOf({coatColor:'#f00',coatPattern:'dots'}).querySelector('pattern[id^=cp]');
  R.uidDiffers     = aIds.length>0 && bIds.length>0 && aIds.every(id=>!bIds.includes(id)); // no shared ids across instances
  R.aRefsResolve   = refs(a).every(r=>aIds.includes(r)); // every url(#..) points inside its own svg
  R.bRefsResolve   = refs(b).every(r=>bIds.includes(r));
  R.allPass = R.rainbowRenders&&R.holoRenders&&R.patternRenders&&R.uidDiffers&&R.aRefsResolve&&R.bRefsResolve;
  window.__T1__ = R;
  document.getElementById('results').textContent = JSON.stringify(R,null,2);
})();
</script></body></html>
```

- [ ] **Step 8: Run the harness**

```bash
cd /workspaces/morphology-builder && python3 -m http.server 8091 --bind 127.0.0.1 &
```
Drive with Playwright MCP (`ToolSearch select:mcp__playwright__browser_navigate,mcp__playwright__browser_evaluate`; `plugin_playwright` variant if that resolves) → `http://127.0.0.1:8091/tests/manual/character-art-port-harness.html?cb=<n>`, read `window.__T1__`.
Expected: `allPass === true` — rainbow/holo/pattern still render, two instances share **no** def ids, and every `url(#…)` ref resolves within its own SVG. Kill the server.

- [ ] **Step 9: Commit**

```bash
git add wordlab-scientist.js tests/manual/character-art-port-harness.html
git commit -m "refactor(scientist): unique per-instance <defs> ids in buildSVG (fixes cross-instance gradient contamination)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01DjZtyZpEo3SRyVoR3yuQRo"
```

---

## Task 2: Head/skin shading + flat ears & neck

**Files:**
- Modify: `wordlab-scientist.js` — add `_mix` helper (module scope), derive `HI/LO/FLAT`, add `sk/hs/hh` defs to `shadeDefs`, apply to head/ears/neck, move ears behind head.
- Modify: `tests/manual/character-art-port-harness.html` — add Task-2 assertions (`window.__T2__`).

**Interfaces:**
- Consumes: `uid` (Task 1).
- Produces: `_mix(hex1,hex2,t)`; `HI/LO/FLAT`; `sk${uid}` skin radial used by the head; head form-shadow `hs${uid}` + highlight `hh${uid}` overlays.

- [ ] **Step 1: Add the `_mix` helper** — module scope (near `_sciSeq`):

```javascript
  function _mix(hex, hex2, t) {
    const parse = h => {
      h = (h || '').replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return null;
      const n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const a = parse(hex) || [253, 188, 180];   // fallback = default skin
    const b = parse(hex2) || [0, 0, 0];
    const m = i => Math.round(a[i] + (b[i] - a[i]) * t);
    return '#' + [m(0), m(1), m(2)].map(v => v.toString(16).padStart(2, '0')).join('');
  }
```

- [ ] **Step 2: Derive shade colours** — inside buildSVG after `const skin = …` (~L132) add:

```javascript
    const HI   = _mix(skin, '#FFFFFF', 0.32);
    const LO   = _mix(skin, '#2E1D14', 0.24);
    const FLAT = _mix(skin, '#2E1D14', 0.10);
```

- [ ] **Step 3: Add the skin/head shade defs** — define `shadeDefs` (near `allDefs`, ~L198) and append it to `allDefs`:

```javascript
    const shadeDefs =
      `<radialGradient id="sk${uid}" cx="38%" cy="30%" r="78%"><stop offset="0%" stop-color="${HI}"/><stop offset="58%" stop-color="${skin}"/><stop offset="100%" stop-color="${LO}"/></radialGradient>` +
      `<linearGradient id="hs${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#462D26" stop-opacity="0"/><stop offset="62%" stop-color="#462D26" stop-opacity="0"/><stop offset="100%" stop-color="#462D26" stop-opacity="0.22"/></linearGradient>` +
      `<radialGradient id="hh${uid}" cx="32%" cy="26%" r="55%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.42"/><stop offset="60%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`;
```
Change `const allDefs = defsContent + galaxyDef;` → `const allDefs = defsContent + galaxyDef + shadeDefs;`

- [ ] **Step 4: Neck → flat** — in the return template change the neck rect fill:

```html
  <rect x="33" y="54" width="14" height="10" rx="3" fill="${FLAT}"/>
```

- [ ] **Step 5: Move ears BEFORE the head, fill FLAT; head → skin radial + overlays** — replace the current head+ears block:

```html
  <!-- Head -->
  <ellipse cx="40" cy="38" rx="22" ry="22" fill="${skin}"/>
  <!-- Ears -->
  <ellipse cx="18" cy="40" rx="4.5" ry="5.5" fill="${skin}"/>
  <ellipse cx="62" cy="40" rx="4.5" ry="5.5" fill="${skin}"/>
```
with (ears first, flat; head with radial; then form-shadow + highlight overlays):
```html
  <!-- Ears (flat, behind head) -->
  <ellipse cx="18" cy="40" rx="4.5" ry="5.5" fill="${FLAT}"/>
  <ellipse cx="62" cy="40" rx="4.5" ry="5.5" fill="${FLAT}"/>
  <!-- Head -->
  <ellipse cx="40" cy="38" rx="22" ry="22" fill="url(#sk${uid})"/>
  <ellipse cx="40" cy="38" rx="22" ry="22" fill="url(#hs${uid})"/>
  <ellipse cx="40" cy="38" rx="22" ry="22" fill="url(#hh${uid})"/>
```

- [ ] **Step 6: Extend the harness with Task-2 checks** — append a script block to `character-art-port-harness.html` writing `window.__T2__`:

```javascript
(function(){
  const R={};
  function svgOf(sci,rx){const d=document.createElement('div');d.innerHTML=WLScientist.buildSVG(sci,rx||'neutral');return d.firstElementChild;}
  function hex(h){h=h.replace('#','');const n=parseInt(h,16);return [(n>>16)&255,(n>>8)&255,n&255];}
  // HI lighter, LO darker than base — for light, medium, dark tones
  const tones=['#FDBCB4','#C68642','#5C3A29'];
  R.tonesOK = tones.every(t=>{
    const svg=svgOf({skinTone:t});
    const stops=[...svg.querySelectorAll(`radialGradient[id^=sk] stop`)].map(s=>s.getAttribute('stop-color'));
    if(stops.length<3) return false;
    const [hi,base,lo]=stops.map(hex), lum=c=>c[0]+c[1]+c[2];
    return lum(hi)>lum(base) && lum(lo)<lum(base);
  });
  // Ears are flat (no gradient fill), head uses the radial
  const s=svgOf({skinTone:'#FDBCB4'});
  const ears=[...s.querySelectorAll('ellipse')].filter(e=>e.getAttribute('cx')==='18'||e.getAttribute('cx')==='62');
  R.earsFlat = ears.length===2 && ears.every(e=>/^#/.test(e.getAttribute('fill')));
  R.headRadial = [...s.querySelectorAll('ellipse')].some(e=>e.getAttribute('cx')==='40'&&e.getAttribute('cy')==='38'&&/^url\(#sk/.test(e.getAttribute('fill')||''));
  // Reactions still render a mouth path (face intact over shading)
  R.reactionsOK = ['neutral','happy','excited','wrong'].every(rx=>svgOf({},rx).querySelector('path[stroke="#b83232"]'));
  R.allPass = R.tonesOK&&R.earsFlat&&R.headRadial&&R.reactionsOK;
  window.__T2__=R;
  const pre=document.createElement('pre');pre.textContent='T2 '+JSON.stringify(R,null,2);document.body.appendChild(pre);
})();
```

- [ ] **Step 7: Run the harness** — serve + Playwright as in Task 1; read `window.__T1__` and `window.__T2__`.
Expected: both `allPass === true`. `tonesOK` proves HI lighter / LO darker for light, medium **and dark** tones; `earsFlat` + `headRadial` prove the ear/head fix. Screenshot the light + dark-tone characters; confirm ears read flat (no hemispheres). Kill the server.

- [ ] **Step 8: Commit**

```bash
git add wordlab-scientist.js tests/manual/character-art-port-harness.html
git commit -m "feat(scientist): dimensional head shading + flat ears/neck (skin-tone-derived radial)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01DjZtyZpEo3SRyVoR3yuQRo"
```

---

## Task 3: Coat shade + sheen + ground shadow + blush

**Files:**
- Modify: `wordlab-scientist.js` — add `cs` def; insert coat form-shade + sheen, ground shadow, blush.
- Modify: `tests/manual/character-art-port-harness.html` — Task-3 assertions (`window.__T3__`).

**Interfaces:**
- Consumes: `uid`, `shadeDefs`.
- Produces: coat form-shade `cs${uid}` + sheen; ground-shadow ellipse; blush ellipses.

- [ ] **Step 1: Add the coat shade def** — append to `shadeDefs`:

```javascript
      + `<linearGradient id="cs${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#322A5C" stop-opacity="0"/><stop offset="55%" stop-color="#322A5C" stop-opacity="0"/><stop offset="100%" stop-color="#322A5C" stop-opacity="0.13"/></linearGradient>`
```

- [ ] **Step 2: Ground shadow (first child, behind wings)** — in the return template, immediately after `${coatFillDef}` and before the wings comment, insert:

```html
  <!-- Ground contact shadow -->
  <ellipse cx="40" cy="119" rx="22" ry="3.2" fill="rgba(0,0,0,0.24)"/>
```

- [ ] **Step 3: Coat form-shade + sheen** — immediately after `${customImg('coat')}` insert:

```html
  <!-- Coat form-shade + sheen (over coat fill, under collar/pocket/badges) -->
  <rect x="14" y="60" width="52" height="58" rx="10" fill="url(#cs${uid})"/>
  <path d="M19,66 Q21,90 22,112" stroke="rgba(255,255,255,0.5)" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round"/>
```

- [ ] **Step 4: Blush (after the mouth, before the head accessory)** — after the `${(mouths[reaction]||mouths.neutral)}` line insert:

```html
  <!-- Blush -->
  <ellipse cx="28" cy="43.5" rx="4.2" ry="2.6" fill="#fca5a5" opacity="0.32"/>
  <ellipse cx="52" cy="43.5" rx="4.2" ry="2.6" fill="#fca5a5" opacity="0.32"/>
```

- [ ] **Step 5: Extend the harness with Task-3 checks** — append a script writing `window.__T3__`:

```javascript
(function(){
  const R={};
  function svgOf(sci,rx){const d=document.createElement('div');d.innerHTML=WLScientist.buildSVG(sci,rx||'neutral');return d.firstElementChild;}
  // Coat overlays present AND coat fill still the pattern/rainbow/holo (overlay didn't replace fill)
  function coatRect(svg){return [...svg.querySelectorAll('rect')].find(r=>r.getAttribute('x')==='14'&&r.getAttribute('y')==='60'&&/(#|url\()/.test(r.getAttribute('fill')||'')&&r.getAttribute('stroke'));}
  const rainbow=svgOf({coatColor:'rainbow'});
  R.rainbowFillIntact = /url\(#coatRainbow/.test(coatRect(rainbow).getAttribute('fill'));
  const dots=svgOf({coatColor:'#f00',coatPattern:'dots'});
  R.patternFillIntact = /url\(#cp/.test(coatRect(dots).getAttribute('fill'));
  const s=svgOf({coatColor:'rainbow'});
  R.coatShadeOverlay = [...s.querySelectorAll('rect')].some(r=>/url\(#cs/.test(r.getAttribute('fill')||''));
  R.groundShadow = [...s.querySelectorAll('ellipse')].some(e=>e.getAttribute('cy')==='119');
  R.blush = [...s.querySelectorAll('ellipse')].filter(e=>e.getAttribute('cy')==='43.5').length===2;
  R.allPass=R.rainbowFillIntact&&R.patternFillIntact&&R.coatShadeOverlay&&R.groundShadow&&R.blush;
  window.__T3__=R;
  const pre=document.createElement('pre');pre.textContent='T3 '+JSON.stringify(R,null,2);document.body.appendChild(pre);
})();
```

- [ ] **Step 6: Run the harness** — serve + Playwright; read `__T1__/__T2__/__T3__`.
Expected: all `allPass === true` — coat overlays present **and** the coat fill is still the rainbow/pattern gradient (overlays didn't clobber the fill), ground shadow + blush present. Screenshot a plain, a rainbow, and a patterned coat. Kill the server.

- [ ] **Step 7: Commit**

```bash
git add wordlab-scientist.js tests/manual/character-art-port-harness.html
git commit -m "feat(scientist): coat form-shade + sheen, ground shadow, blush (completes Option A base shading)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01DjZtyZpEo3SRyVoR3yuQRo"
```

---

## Task 4: Full matrix sweep + screenshots

**Files:**
- Modify: `tests/manual/character-art-port-harness.html` — render the full §9 matrix + screenshot grid.
- Modify (only if the sweep reveals a real defect): `wordlab-scientist.js`.

**Interfaces:** verification only.

- [ ] **Step 1: Add a full render grid** — extend the harness to render `WLScientist.buildSVG` for the matrix, each at large (150px) and 44px, in labelled cells:
  - reactions: `neutral, happy, excited, wrong`
  - skin tones: `#FDBCB4` (light), `#C68642` (medium), `#5C3A29` (dark)
  - coats: plain `#6366f1`, `rainbow`, `holographic`, patterns `dots`/`dna`/`stripes`
  - accessories/wings (one per cell): `goggles_head`, `wizard_hat`, `space_helmet`, `angel_wings`, `glasses`, `galaxy_halo` (verifies the uid-suffixed galaxy gradient still animates/renders)
  Write a `window.__SWEEP__ = { cells: <count>, errors: [] }` that catches any `buildSVG` throw per cell.

- [ ] **Step 2: Run + screenshot** — serve + Playwright: navigate, assert `__SWEEP__.errors.length === 0` and `__T1__/__T2__/__T3__` all `allPass`. Take `browser_take_screenshot`s of: the light/medium/dark tone row, the rainbow + patterned coats, the accessory row (esp. `galaxy_halo` to confirm the suffixed gradient renders), and a 44px row. Resize to 390px and screenshot once (mobile legibility). Describe what the screenshots show in the report — confirm: ears read flat (no hemispheres), head has soft volume, coats keep their pattern/rainbow, accessories still align on the shaded head, 44px reads cleanly.

- [ ] **Step 3: If a real defect surfaces** (an accessory misaligned, a coat fill clobbered, a tone that inverts), fix `wordlab-scientist.js`, re-run, note it. If clean, note "no production fix needed."

- [ ] **Step 4: Commit**

```bash
git add tests/manual/character-art-port-harness.html wordlab-scientist.js
git commit -m "test(scientist): full character art-port matrix sweep + screenshots (reactions x tones x coats x accessories)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01DjZtyZpEo3SRyVoR3yuQRo"
```

---

## Self-Review (against spec §4-§9)

- **§D1 freeze anchors** → Tasks 2-3 change only fills, draw order (ears), and add layers; no coordinate moved. Verified by §9 accessory-alignment sweep (Task 4). ✔
- **§D3 head radial / flat ears+neck / ears behind head** → Task 2 Steps 4-5; asserted `earsFlat`/`headRadial`. ✔
- **§D4/§5.1 skin-tone-derived, correct for dark tones** → `_mix` (Task 2 Step 1); asserted `tonesOK` across light/medium/dark (Task 2 Step 6). ✔
- **§D5 coat overlays don't replace fill** → Task 3; asserted `rainbowFillIntact`/`patternFillIntact` (fill still `url(#coatRainbow…)`/`url(#cp…)`). ✔
- **§D6 unique per-instance ids** → Task 1; asserted `uidDiffers` + refs-resolve-within-svg across two instances. ✔
- **§D7 no filters** → only gradients/shapes added; grep would confirm no `<filter>` added. ✔
- **§D8 no motion** → no `<animate>` added by shading. ✔
- **stop-color+stop-opacity** → used in `hs/hh/cs` defs (Tasks 2-3). ✔
- **§9 matrix + isolation + dark tone + galaxy_halo** → Task 4 sweep. ✔
- **Placeholder scan:** all code concrete, exact insert points and values from spec §5. ✔
- **Type/name consistency:** `uid`, `_mix`, `HI/LO/FLAT`, `sk/hs/hh/cs${uid}` used identically across tasks. ✔

## Risks & mitigations
- **Missing an `id="cp"` occurrence** (9 of them) leaves a shared pattern id → cross-instance bleed. Mitigation: Task 1 isolation assertion renders two patterned coats and checks no shared ids; a missed one fails `uidDiffers`.
- **Ground shadow doubling with the shop podium shadow** (spec §10) — visual-review item in Task 4; drop the character ground shadow only if it visibly doubles on the shop stage.
- **Accessory misalignment** from the ears-behind-head move — Task 4 renders `space_helmet`/`goggles_head` (head-region items) to confirm they still sit correctly.
- Nothing pushed; local-only per the Lab Shop line.
