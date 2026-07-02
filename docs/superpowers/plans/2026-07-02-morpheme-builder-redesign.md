# Morpheme Builder Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Morpheme Builder show the full morpheme set students learn in Flashcards, hide non-buildable tiles as you build, mark above-level tiles, collapse the 2nd suffix slot until needed, add a persistent search, and expand content so each prefix builds 4–5 real words.

**Architecture:** Evolve `morpheme-builder.html` in place — keep its accurate combo/spelling engine, change only which morphemes show and how tiles present. Then expand `data.js` bases + `dictionary.txt` and regenerate `valid-combos.json` via the existing `scripts/build-valid-combos.js`.

**Tech Stack:** Vanilla JS (no build system, no framework), served as static HTML; `data.js` IIFE exposing `window.MORPHEMES`; `wordlab-data.js` / `wordlab-stage.js` helpers; Node.js for the offline combo build; Playwright for browser verification.

**Spec:** `docs/superpowers/specs/2026-07-02-morpheme-builder-redesign-design.md`

## Global Constraints

- **No build system / no framework.** Pure HTML/CSS/vanilla JS. No npm packages added to the frontend.
- **Script load order:** `data.js` is loaded with `defer` and the inline builder script runs inside `DOMContentLoaded`; `window.MORPHEMES`, `WordLabData`, `WLStage` are available at `init()` time.
- **XSS safety:** build tiles/rule steps with DOM methods (`createElement`/`textContent`) or `escapeHtml()` — never interpolate morpheme/user strings into `innerHTML`.
- **Accessibility:** WCAG 2.1 AA — every tile is a focusable `<button>` with a descriptive `aria-label`; the ✦ above-level marker must be conveyed in the label, not colour only; search field labelled.
- **Low-stim / reduced-motion:** under `body.low-stim` OR `@media (prefers-reduced-motion: reduce)`, no tile fade animation and no idle scientist bob.
- **No scoring:** the builder records nothing (no `recordAttempt`, no dashboard surface). Do not add any.
- **Content rules:** real English words only, **Australian spelling**, appropriate for ages 9–12. No junk/obscure/clinical padding of `dictionary.txt`.
- **Mobile:** 320–480px must keep working — tiles wrap, 44px minimum touch targets.

### Standard local-verify recipe (used by every UI task)

Local browser caching can serve stale JS and mask edits. Always verify with a fresh load:

1. Serve the repo root: `python3 -m http.server 8080 --bind 0.0.0.0` (run in background from `/workspaces/morphology-builder`).
2. In Playwright, navigate with a **unique cache-bust query** every time: `http://localhost:8080/morpheme-builder.html?v=<random>`.
3. Simulate a staged, logged-in student by setting session + stage **before** interacting, then re-render:
   ```js
   sessionStorage.setItem('wordlab_session_v1', JSON.stringify({classId:'a05e407f-32b5-48cd-977f-e4835e13011f', studentId:'eb7d0ff1-6b9f-4582-a41b-c069a95d1967', studentName:'Test 2', started:Date.now()}));
   sessionStorage.setItem('wl_stage','s2e');   // early stage 2 — a low stage, to prove the gate is gone
   ```
   (Test 2 / class RKZULS is a designated test account — never touch real students.)
4. Reload with the cache-bust query and read state via `browser_evaluate`.

---

## Stream A — Builder UI (`morpheme-builder.html`)

### Task A1: Show all morphemes (remove the level gate)

**Files:**
- Modify: `morpheme-builder.html:217-219` (data loading), add a `STUDENT_STAGE` capture nearby.

**Interfaces:**
- Produces: `PREFIXES`, `SUFFIXES`, `BASES` now the **full** `window.MORPHEMES.*` arrays (each item retains its `stage` field). New module-scope `STUDENT_STAGE` (string stage id or `null`) consumed by Task A2.

- [ ] **Step 1: Observe the current (broken) behaviour**

With the standard verify recipe (stage `s2e`), on a fresh load run:
```js
() => { /* switch to Prefixes tab, count tiles */
  document.getElementById('tabPrefixes').click();
  return document.querySelectorAll('#tilesContainer .tile').length;
}
```
Expected now: a small number (the s2e-visible subset, well under 107) — this is the "handful of prefixes" bug.

- [ ] **Step 2: Make the change**

Replace lines 217-219:
```js
  var PREFIXES = WordLabData.filterByStage(MORPHEMES.prefixes.slice(), 'morpheme-builder');
  var SUFFIXES = WordLabData.filterByStage(MORPHEMES.suffixes.slice(), 'morpheme-builder');
  var BASES = WordLabData.filterByStage(MORPHEMES.bases.slice(), 'morpheme-builder');
```
with:
```js
  // Show the full morpheme set (parity with Flashcards) — no level gate on the bank.
  var PREFIXES = MORPHEMES.prefixes.slice();
  var SUFFIXES = MORPHEMES.suffixes.slice();
  var BASES = MORPHEMES.bases.slice();
  // Student's curriculum stage — used ONLY to mark "above your level" tiles (Task A2), never to gate.
  var STUDENT_STAGE = (typeof WordLabData !== 'undefined' && WordLabData.getStudentStage)
    ? WordLabData.getStudentStage('morpheme-builder') : null;
```

- [ ] **Step 3: Verify all morphemes now show**

Reload (new cache-bust). Re-run the Step 1 count.
Expected: **107** prefix tiles (the full set). Also confirm Bases tab count is 412 and Suffixes 97:
```js
() => {
  const counts = {};
  ['tabBases','tabPrefixes','tabSuffixes'].forEach(id=>{ document.getElementById(id).click(); counts[id]=document.querySelectorAll('#tilesContainer .tile').length; });
  return counts;
}
```
Expected: `{tabBases:412, tabPrefixes:107, tabSuffixes:97}`.

- [ ] **Step 4: Commit**
```bash
git add morpheme-builder.html
git commit -m "feat(builder): show full morpheme set — remove level gate on the bank"
```

---

### Task A2: Above-level ✦ marker

**Files:**
- Modify: `morpheme-builder.html` — `renderTiles()` tile-building loop (around lines 876-905); add small CSS in the `<style>` block.

**Interfaces:**
- Consumes: `STUDENT_STAGE` (Task A1), `WLStage.isItemVisible`.
- Produces: an `isAboveLevel(m)` helper; a ✦ marker element + `.tile-stretch` class on above-level tiles.

- [ ] **Step 1: Add the helper (module scope, near other helpers ~line 421)**
```js
  /* A morpheme is "above the student's level" when a stage is set on both and
     WLStage says it is not yet visible at the student's stage (no extension). */
  function isAboveLevel(m) {
    if (!STUDENT_STAGE || !m || !m.stage) return false;
    if (typeof WLStage === 'undefined' || !WLStage.isItemVisible) return false;
    return !WLStage.isItemVisible(m.stage, STUDENT_STAGE, false);
  }
```

- [ ] **Step 2: Add CSS (in `<style>`, near `.tile-meaning` ~line 107)**
```css
    .tile-stretch{ position:relative; }
    .tile-stretch .tile-stretch-star{ position:absolute; top:3px; right:5px; font-size:10px; color:var(--accent); line-height:1; }
```

- [ ] **Step 3: Mark the tile in `renderTiles()`**

Inside the tile-building IIFE (after `btn.className = 'tile tile-' + type;`, ~line 879), add:
```js
        if (isAboveLevel(fm)) {
          btn.classList.add('tile-stretch');
          var star = document.createElement('span');
          star.className = 'tile-stretch-star';
          star.setAttribute('aria-hidden','true');
          star.textContent = '✦'; // ✦
          btn.appendChild(star);
        }
```
And extend the existing `aria-label` (line 883) so the marker isn't colour-only:
```js
        btn.setAttribute('aria-label', (fm.display || fm.form) + ', meaning: ' + (fm.meaning || '') + (isAboveLevel(fm) ? ' (above your level)' : ''));
```

- [ ] **Step 4: Verify**

Standard recipe with `wl_stage='s2e'`, Prefixes tab:
```js
() => { document.getElementById('tabPrefixes').click();
  const stars = document.querySelectorAll('#tilesContainer .tile-stretch').length;
  const total = document.querySelectorAll('#tilesContainer .tile').length;
  return {total, stars}; }
```
Expected: `total:107`, `stars` > 0 (advanced prefixes marked). Then set `wl_stage` to `''` (logged-out): expected `stars:0`.

- [ ] **Step 5: Commit**
```bash
git add morpheme-builder.html
git commit -m "feat(builder): mark above-level morphemes with a stretch star"
```

---

### Task A3: Collapse the 2nd suffix slot until needed

**Files:**
- Modify: `morpheme-builder.html` — `renderSlots()` (lines 641-646) / `renderOneSlot` usage.

**Interfaces:**
- Consumes: `current.suffix1`, `current.suffix2` state.
- Produces: 2nd suffix slot hidden unless `current.suffix1` is set.

- [ ] **Step 1: Hide/show the 2nd slot in `renderSlots()`**

Replace `renderSlots()` (lines 641-646) with:
```js
  function renderSlots() {
    renderOneSlot(elSlotPrefix, current.prefix, 'prefix', 'prefix');
    renderOneSlot(elSlotBase, current.base, 'base', 'base');
    renderOneSlot(elSlotSuffix1, current.suffix1, 'suffix', 'suffix1');
    // 2nd suffix slot only appears once a first suffix is placed.
    if (current.suffix1) {
      elSlotSuffix2.style.display = '';
      renderOneSlot(elSlotSuffix2, current.suffix2, 'suffix', 'suffix2');
    } else {
      elSlotSuffix2.style.display = 'none';
    }
  }
```

- [ ] **Step 2: Verify**

Standard recipe:
```js
() => {
  const s2 = document.getElementById('slotSuffix2');
  const before = getComputedStyle(s2).display;                 // expect 'none' (nothing placed)
  // place a base then a suffix via the UI
  document.getElementById('tabBases').click();
  document.querySelector('#tilesContainer .tile').click();      // a base
  document.getElementById('tabSuffixes').click();
  document.querySelector('#tilesContainer .tile').click();      // a suffix -> suffix1
  const after = getComputedStyle(document.getElementById('slotSuffix2')).display; // expect '' (visible)
  return {before, after};
}
```
Expected: `before:'none'`, `after` not `'none'`. Confirm clearing suffix1 collapses it again (click the suffix1 slot to remove).

- [ ] **Step 3: Commit**
```bash
git add morpheme-builder.html
git commit -m "feat(builder): reveal 2nd suffix slot only after the first suffix"
```

---

### Task A4: Search — icon, clear button, persist across tabs

**Files:**
- Modify: `morpheme-builder.html` — search HTML (line 185), `.filter-input` CSS (lines 94-96), `switchTab()` (lines 917-929), `init()` filter wiring (lines 943-952).

**Interfaces:**
- Consumes: `filterText`, `renderTiles`, `activeTab`.
- Produces: persistent `filterText` across tab switches; a clear (×) control; tab-aware placeholder.

- [ ] **Step 1: Replace the search input markup (line 185)**
```html
        <div class="search-wrap">
          <span class="search-icon" aria-hidden="true">&#128269;</span>
          <input type="text" class="filter-input" id="filterInput" placeholder="Search bases..." aria-label="Search morphemes">
          <button type="button" class="search-clear" id="searchClear" aria-label="Clear search" hidden>&times;</button>
        </div>
```

- [ ] **Step 2: Add CSS (replace the `.filter-input` block, lines 94-96)**
```css
    .search-wrap{ position:relative; margin:12px 16px 0; }
    .search-icon{ position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:13px; opacity:.6; pointer-events:none; }
    .filter-input{ display:block; width:100%; box-sizing:border-box; border:2px solid var(--line); border-radius:10px; padding:8px 34px; font-size:13px; font-weight:600; color:var(--text); background:#fff; transition:border-color .15s; }
    .filter-input:focus{ border-color:var(--accent); outline:none; box-shadow:0 0 0 4px rgba(var(--accent-rgb),.12); }
    .filter-input::placeholder{ color:var(--muted); font-weight:600; }
    .search-clear{ position:absolute; right:8px; top:50%; transform:translateY(-50%); border:none; background:transparent; color:var(--muted); font-size:18px; line-height:1; cursor:pointer; width:24px; height:24px; border-radius:50%; }
    .search-clear:hover{ color:var(--bad); }
    .search-clear:focus{ outline:3px solid var(--indigo-2); outline-offset:2px; }
```

- [ ] **Step 3: Stop wiping the query on tab switch + update placeholder**

Replace `switchTab()` (lines 917-929):
```js
  function switchTab(tab) {
    activeTab = tab;
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      var isActive = tabs[i].dataset.tab === tab;
      tabs[i].classList.toggle('active', isActive);
      tabs[i].setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
    // Query persists across tabs; only update the placeholder.
    var label = tab === 'prefixes' ? 'prefixes' : (tab === 'suffixes' ? 'suffixes' : 'bases');
    elFilterInput.placeholder = 'Search ' + label + '...';
    renderTiles();
    updateTabCounts();
  }
```

- [ ] **Step 4: Wire the clear button + toggle its visibility (in `init()`, replace the filter block lines 943-952)**
```js
    var filterTimeout;
    var searchClear = document.getElementById('searchClear');
    elFilterInput.addEventListener('input', function() {
      clearTimeout(filterTimeout);
      var val = this.value;
      if (searchClear) searchClear.hidden = !val;
      filterTimeout = setTimeout(function() { filterText = val; renderTiles(); }, 150);
    });
    if (searchClear) {
      searchClear.addEventListener('click', function() {
        elFilterInput.value = ''; filterText = ''; searchClear.hidden = true;
        elFilterInput.focus(); renderTiles();
      });
    }
```

- [ ] **Step 5: Verify persistence**
```js
() => {
  const inp = document.getElementById('filterInput');
  inp.value='port'; inp.dispatchEvent(new Event('input',{bubbles:true}));
  return new Promise(r=>setTimeout(()=>{
    document.getElementById('tabBases').click();
    const basesMatch = document.querySelectorAll('#tilesContainer .tile').length;
    document.getElementById('tabSuffixes').click();
    // query should still be 'port' after switching tabs
    r({queryAfterSwitch: document.getElementById('filterInput').value, basesMatch});
  }, 250));
}
```
Expected: `queryAfterSwitch:'port'` (persisted), `basesMatch` ≥ 1.

- [ ] **Step 6: Commit**
```bash
git add morpheme-builder.html
git commit -m "feat(builder): search icon + clear button + persist query across tabs"
```

---

### Task A5: Subtle tile fade-in (motion), low-stim/reduced-motion off

**Files:**
- Modify: `morpheme-builder.html` — CSS `<style>` block only.

**Interfaces:**
- Produces: `.tile` fade-in; gated off under low-stim and reduced-motion.

- [ ] **Step 1: Add CSS (near the `.tile` rules ~line 103)**
```css
    @keyframes tileIn { from { opacity:0; transform:translateY(3px); } to { opacity:1; transform:none; } }
    .tile{ animation:tileIn .18s ease both; }
    body.low-stim .tile{ animation:none; }
    @media (prefers-reduced-motion: reduce){ .tile{ animation:none; } }
```

- [ ] **Step 2: Verify no errors + low-stim off**

Standard recipe: load, switch tabs, confirm no console errors and tiles render. Then set `sessionStorage.setItem('wl_low_stim','true')`, reload, confirm `getComputedStyle(document.querySelector('.tile')).animationName === 'none'`.

- [ ] **Step 3: Commit**
```bash
git add morpheme-builder.html
git commit -m "feat(builder): subtle tile fade-in, disabled under low-stim/reduced-motion"
```

---

### Task A6: End-to-end builder verification (deployed-shape smoke)

**Files:** none (verification only).

- [ ] **Step 1: Full flow on a fresh local load (staged student)**

Confirm the whole interaction holds together:
```js
() => {
  const out = {};
  document.getElementById('tabPrefixes').click();
  out.allPrefixes = document.querySelectorAll('#tilesContainer .tile').length;      // 107
  // pick a base, then check prefixes narrow (hide-non-viable still works)
  document.getElementById('tabBases').click();
  [...document.querySelectorAll('#tilesContainer .tile')].find(t=>t.querySelector('.tile-form')?.textContent==='act')?.click();
  document.getElementById('tabPrefixes').click();
  out.viablePrefixesForAct = document.querySelectorAll('#tilesContainer .tile').length; // fewer than 107
  return out;
}
```
Expected: `allPrefixes:107` and `viablePrefixesForAct` < 107 (non-viable prefixes hidden — the mechanic we kept).

- [ ] **Step 2: Mobile check** — resize to 360px; confirm no horizontal page scroll and tiles wrap.

- [ ] **Step 3: Commit (if any tweaks were needed; otherwise skip).**

---

## Stream B — Content coverage (4–5 words per prefix)

### Task B1: Coverage-report script + capture BEFORE baseline

**Files:**
- Create: `scripts/combo-coverage.js`
- Create (output, committed): `docs/superpowers/notes/2026-07-02-combo-coverage-before.txt`

**Interfaces:**
- Produces: `node scripts/combo-coverage.js` prints, for prefixes and suffixes: id, buildable-word count, and bucket totals (0 / 1–3 / 4+), plus a list of every prefix/suffix below 4.

- [ ] **Step 1: Write the script**
```js
// scripts/combo-coverage.js — reports how many buildable words each prefix/suffix has.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');

// Load window.MORPHEMES from data.js in a sandbox.
const sandbox = { window:{}, document:{ createElement:()=>({}) } };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,'data.js'),'utf8'), sandbox);
const M = sandbox.window.MORPHEMES;

const combos = JSON.parse(fs.readFileSync(path.join(ROOT,'valid-combos.json'),'utf8'));
function tally(list, key){
  const count = {}; list.forEach(x=>count[x.id]=0);
  combos.forEach(c=>{ if(key==='p'){ if(c.p) count[c.p]=(count[c.p]||0)+1; }
    else { if(c.s1) count[c.s1]=(count[c.s1]||0)+1; if(c.s2) count[c.s2]=(count[c.s2]||0)+1; } });
  return count;
}
function report(name, list, key){
  const c = tally(list, key);
  const rows = list.map(x=>[x.form||x.id, c[x.id]||0]).sort((a,b)=>a[1]-b[1]);
  const b0 = rows.filter(r=>r[1]===0).length;
  const b13 = rows.filter(r=>r[1]>=1&&r[1]<=3).length;
  const b4 = rows.filter(r=>r[1]>=4).length;
  console.log(`\n=== ${name} (${list.length}) — buckets: 0=${b0}  1-3=${b13}  4+=${b4} ===`);
  console.log('BELOW TARGET (<4):');
  rows.filter(r=>r[1]<4).forEach(r=>console.log(`  ${r[0].padEnd(12)} ${r[1]}`));
}
console.log(`Total combos: ${combos.length}`);
report('PREFIXES', M.prefixes, 'p');
report('SUFFIXES', M.suffixes, 's');
```

- [ ] **Step 2: Run and capture the baseline**
```bash
node scripts/combo-coverage.js | tee docs/superpowers/notes/2026-07-02-combo-coverage-before.txt
```
Expected: prints total combos (~4244) and the two bucket summaries. Prefixes 4+ should be well under 107 (many at 0/1–3).

- [ ] **Step 3: Commit**
```bash
mkdir -p docs/superpowers/notes
git add scripts/combo-coverage.js docs/superpowers/notes/2026-07-02-combo-coverage-before.txt
git commit -m "chore(builder): combo-coverage report + before baseline"
```

---

### Task B2: Revive everyday prefixes to 4–5 words

**Files:**
- Modify: `data.js` (add bases where needed — follow CORE_BASES object shape at `data.js:215`, or add to the ANGLO/LATIN/GREEK `*_BASE_LIST` + `*_BASE_INFO` maps).
- Modify: `dictionary.txt` (add real Australian-spelled words, one per line, alphabetical-ish; `#` comments allowed).
- Regenerate: `valid-combos.json` via `node scripts/build-valid-combos.js`.

**Interfaces:**
- Consumes: the build script's prefix+base+suffix→dictionary gate.
- Produces: everyday prefixes at 4+ buildable words.

**Method (repeat per prefix):** for a target prefix, list real, age-appropriate words that use it; for each word identify the base it needs; if the base is missing from `data.js`, add it; ensure the whole word exists in `dictionary.txt`; rebuild; re-check with the coverage script.

**Worked seed set** (add the bases named, and any of these words missing from `dictionary.txt`):

| Prefix | Target words | Bases needed |
|---|---|---|
| `mid` | midnight, midday, midpoint, midway, midfield, midweek | night, day, point, way, field, week |
| `non` | nonfiction, nonsense, nonstop, nonstick, nonfat | fiction, sense, stop, stick, fat |
| `semi` | semicircle, semifinal, semicolon, semisweet | circle, final, colon, sweet |
| `bi` | bicycle, biplane, bilingual, biannual | cycle, plane, lingual, annual |
| `tri` | triangle, tricycle, tripod, trident | angle, cycle, pod, dent |
| `mega` | megaphone, megabyte, megastar, megabit | phone, byte, star, bit |
| `mini` | minibus, minivan, miniskirt, minibeast | bus, van, skirt, beast |
| `ultra` | ultraviolet, ultrasound, ultramarine, ultralight | violet, sound, marine, light |
| `extra` | extraordinary, extracurricular, extraterrestrial | ordinary, curricular, terrestrial |
| `mal` | malfunction, malnutrition, maltreat, malformed | function, nutrition, treat, form (malformed = form + ed) |
| `post` | postscript, postwar, postgame, postgraduate | script, war, game, graduate |
| `omni` | omnivore, omnipresent, omnipotent | vore, present, potent |
| `contra` | contradict, contraband, contraflow, contradiction | dict, band, flow (contradiction = dict + ion) |

Notes: where a "base" is really a bound root (e.g. `dict`, `pone`, `vore`), it likely already exists — check `window.MORPHEMES.bases` first. Prefer words already common in Australian primary classrooms. Drop any candidate that isn't a single solid word (e.g. "extra time").

- [ ] **Step 1: Check which target words already build**

Add each prefix's target words; before editing, grep the dictionary to see what's missing:
```bash
for w in midnight midday midpoint midway nonfiction nonsense nonstop semicircle semifinal bicycle biplane triangle tricycle tripod megaphone megabyte minibus minivan ultraviolet ultrasound malfunction malnutrition postscript postpone omnivore contradict contrast; do
  grep -qx "$w" dictionary.txt && echo "have  $w" || echo "MISS  $w"; done
```

- [ ] **Step 2: Add missing bases to `data.js`**

For each base not already in `window.MORPHEMES.bases`, add a CORE-style entry (choose the array that fits its origin). Example shape (match `data.js:215`):
```js
{ id:"night", stage:"s2e", form:"night", meaning:"the dark part of a day", pos:["noun"], examples:["mid<u>night</u>","<u>night</u>time"] },
```
Verify the base isn't already present first:
```bash
node -e "const vm=require('vm'),fs=require('fs');const s={window:{},document:{createElement:()=>({})}};vm.createContext(s);vm.runInContext(fs.readFileSync('data.js','utf8'),s);const forms=new Set(s.window.MORPHEMES.bases.map(b=>b.form));['night','day','point','way','field','fiction','sense','stop','stick','circle','final','cycle','plane','angle','pod','phone','byte','bus','van','violet','sound','function','nutrition','script','vore','dict'].forEach(f=>console.log((forms.has(f)?'have ':'ADD  ')+f));"
```

- [ ] **Step 3: Add missing whole words to `dictionary.txt`**

Append the `MISS` words from Step 1 (real, Australian spelling) to `dictionary.txt`.

- [ ] **Step 4: Rebuild and check**
```bash
node scripts/build-valid-combos.js
node scripts/combo-coverage.js | grep -A40 "PREFIXES"
```
Expected: `mid, non, semi, bi, tri, mega, mini, ultra, mal, post, omni, contra` now at 4+ (or the honest max — record any that can't reach it with age-appropriate words).

- [ ] **Step 5: Commit**
```bash
git add data.js dictionary.txt valid-combos.json
git commit -m "content(builder): everyday prefixes to 4-5 buildable words"
```

---

### Task B3: Revive Greek/Latin combining-form prefixes

**Files:** same as B2 (`data.js`, `dictionary.txt`, `valid-combos.json`).

**Interfaces:** Produces combining-form prefixes at 4+ where age-appropriate words exist.

**Method:** these often need a **combining-root base** (treat the second root as the base). Add the base, add the whole word, rebuild.

**Worked seed set:**

| Prefix | Target words | Bases needed |
|---|---|---|
| `micro` | microscope, microphone, microwave, microchip, microbe | scope, phone, wave, chip, be |
| `tele` | telephone, telescope, television, telegraph, teleport | phone, scope, vision, graph, port |
| `photo` | photograph, photocopy, photosynthesis, photogenic | graph, copy, synthesis, genic |
| `auto` | automatic, autograph, automobile, autopilot | matic, graph, mobile, pilot |
| `pseudo` | pseudonym, pseudoscience | nym, science |
| `cyber` | cyberspace, cyberbully, cybercrime, cybersafety | space, bully, crime, safety |
| `hydro` | hydrogen, hydroelectric, hydrofoil, hydroplane | gen, electric, foil, plane |
| `thermo` | thermometer, thermostat, thermodynamics | meter, stat, dynamics (thermo is hard — may stay at ~3; record if so) |
| `astro` | astronaut, astronomy, astrophysics, astrology | naut, nomy, physics, logy |
| `bio` | biology, biography, biosphere, biodegradable | logy, graphy, sphere, degradable |
| `geo` | geography, geology, geometry, geothermal | graphy, logy, metry, thermal |

Notes: many second roots (`scope`, `phone`, `graph`, `port`, `gen`, `logy`, `graphy`, `meter`, `nym`, `vision`) already exist as bases or suffixes — check first. If the word is a single bound-root pair with no separable everyday base (e.g. `narcolepsy`, `pneumonia`), leave it below target and record it (§ B5).

- [ ] **Step 1: Grep dictionary for the target words** (same pattern as B2 Step 1, with this word list).
- [ ] **Step 2: Add missing bases to `data.js`** (combining roots), verifying absence first (same node check as B2 Step 2).
- [ ] **Step 3: Add missing whole words to `dictionary.txt`.**
- [ ] **Step 4: Rebuild + check**
```bash
node scripts/build-valid-combos.js && node scripts/combo-coverage.js | grep -A60 "PREFIXES"
```
Expected: `micro, tele, photo, auto, pseudo, cyber, hydro, thermo, astro, bio, geo` at 4+ (or honest max).

- [ ] **Step 5: Commit**
```bash
git add data.js dictionary.txt valid-combos.json
git commit -m "content(builder): combining-form prefixes to 4-5 buildable words"
```

---

### Task B4: Suffix coverage pass (same 4–5 aim, after prefixes)

**Files:** same as B2.

**Interfaces:** Produces suffixes at 4+ where age-appropriate words exist.

**Method:** identical loop. Seed targets for the thin/dead suffixes:

| Suffix | Target words | Bases needed |
|---|---|---|
| `hood` | childhood, neighbourhood, brotherhood, falsehood | child, neighbour, brother, false |
| `ship` | friendship, hardship, ownership, membership, leadership | friend, hard, owner, member, leader |
| `ology`/`ologist` | biology/biologist, zoology/zoologist, geology/geologist | bio, zoo, geo |
| `phobia` | claustrophobia, arachnophobia, hydrophobia | claustro, arachno, hydro |
| `like` | childlike, lifelike, birdlike, dreamlike | child, life, bird, dream |
| `ward` | forward, backward, upward, homeward, eastward | for, back, up, home, east |
| `fy` | simplify, magnify, satisfy, terrify, purify | simpli, magni, satis, terri, puri |

Notes: `-ward`, `-like`, `-hood`, `-ship` are high-value everyday suffixes — prioritise these. `-phobia`/`-itis`/clinical suffixes may stay low; record them.

- [ ] **Step 1: Grep dictionary** for the target words.
- [ ] **Step 2: Add missing bases** to `data.js` (verify absence first).
- [ ] **Step 3: Add missing whole words** to `dictionary.txt`.
- [ ] **Step 4: Rebuild + check**
```bash
node scripts/build-valid-combos.js && node scripts/combo-coverage.js | grep -A60 "SUFFIXES"
```
Expected: `hood, ship, ward, like, fy, ology` at 4+ (or honest max).

- [ ] **Step 5: Commit**
```bash
git add data.js dictionary.txt valid-combos.json
git commit -m "content(builder): everyday suffixes to 4-5 buildable words"
```

---

### Task B5: Final coverage report, junk-word review, delivery notes

**Files:**
- Create: `docs/superpowers/notes/2026-07-02-combo-coverage-after.txt`
- Create: `docs/superpowers/notes/2026-07-02-builder-coverage-notes.md` (what improved; which morphemes remain below 4 and why).

- [ ] **Step 1: Capture the AFTER report**
```bash
node scripts/combo-coverage.js | tee docs/superpowers/notes/2026-07-02-combo-coverage-after.txt
```
Expected: prefix 4+ bucket dramatically larger than the before baseline; the "BELOW TARGET" prefix list is short and consists only of genuinely hard combining forms.

- [ ] **Step 2: Junk-word review**

Diff every word added to `dictionary.txt` and confirm each is a real, Australian-spelled, age-appropriate word:
```bash
git diff docs/superpowers/notes/2026-07-02-combo-coverage-before.txt >/dev/null 2>&1 || true
git log --oneline -6 -- dictionary.txt
git diff HEAD~4 -- dictionary.txt | grep '^+' | grep -v '^+++'
```
Read the added lines; remove any that aren't solid everyday words, then rebuild if you removed any.

- [ ] **Step 3: Write the delivery notes**

`docs/superpowers/notes/2026-07-02-builder-coverage-notes.md` — a short table of before/after bucket counts, total combo count before/after, and an explicit list of prefixes/suffixes still below 4 with a one-line reason each (e.g. "`narco-` — only clinical words, none age-appropriate").

- [ ] **Step 4: Spot-check in the running builder**

Standard verify recipe: pick 3 revived prefixes (e.g. `mid`, `micro`, `tele`), select each as a prefix, switch to Bases, confirm ≥4 viable bases produce valid words (word display shows green/valid).

- [ ] **Step 5: Commit**
```bash
git add docs/superpowers/notes/2026-07-02-combo-coverage-after.txt docs/superpowers/notes/2026-07-02-builder-coverage-notes.md
git commit -m "docs(builder): after coverage report + delivery notes"
```

---

## Self-Review Notes

- **Spec coverage:** §3 show-all + hide-non-viable → A1 (+ A6 confirms hide still works). §6 level highlight → A2. §4 collapsible 2nd suffix → A3. §5 search → A4. §3 clean motion → A5. §7 content push + coverage report + junk review + documented exceptions → B1–B5. §8 accessibility/low-stim/mobile/no-scoring → carried in Global Constraints and verified in A2/A5/A6.
- **No new scoring, no framework, DOM-safe rendering** preserved throughout.
- **Honest ceiling** for un-revivable morphemes is an explicit deliverable (B5), not a silent gap.
