# Suggested Spelling Sets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let teachers browse morphemes and get auto-generated 5-level spelling lists (Explorer → Pioneer), progressively harder, so a single morpheme focus (e.g. `scope`) can be taught to a mixed-stage class with stage-appropriate word lists per student.

**Architecture:** New pure-logic module `wordlab-suggested-sets.js` (IIFE, mirrors `wordlab-stage.js` style) that builds morpheme → stage → word lists from existing `data.js` morpheme metadata and `valid-combos.json`. Dashboard gets a new **Suggested Sets** button inside the Spelling Sets area; clicking it opens a morpheme browser. Selecting a morpheme shows 5 pre-built lists side-by-side; each can be saved as a `class_spelling_sets` row and assigned to students at that stage via the existing `spelling_set_assignments` upsert. No new DB tables, no new edge functions.

**Tech Stack:** Vanilla JS (IIFE module pattern), Supabase (existing tables: `class_spelling_sets`, `spelling_set_assignments`, `students.stage`), existing `WLStage` utility. Node test harness for the pure logic (runs via plain `node tests/test-suggested-sets.js`, no runner required). All dashboard DOM construction uses `document.createElement` — no `innerHTML` for anything, per project XSS hygiene.

---

## Design summary (for context)

### Stage labels (already in `wordlab-stage.js`)

| Code | Name | Year | Index |
|------|------|------|-------|
| `s2e` | Explorer | ~Y3 | 0 |
| `s2l` | Voyager | ~Y4 | 1 |
| `s3e` | Wanderer | ~Y5 | 2 |
| `s3l` | Trailblazer | ~Y6 | 3 |
| `s4` | Pioneer | Beyond | 4 |

### Data sources

- **Morphemes:** `window.MORPHEMES.prefixes / bases / suffixes` from `data.js`. Each has `{id, stage, form, display, meaning, examples, ...}`. `stage` is the **home stage** — when the morpheme is typically taught.
- **Combos:** `valid-combos.json` — array of `{p, b, s1, s2, word}` where p/b/s1/s2 are morpheme ids (or `null`). 4,244 entries.

### Core algorithm

For a selected morpheme M (id + type), for each target stage T:

1. **Pool**: all combos in `valid-combos.json` that contain M.
2. **Score** each combo:
   - primary: `max(stageIndex(morpheme.stage))` across all morphemes in that combo
   - tiebreaker 1: word length (letters)
   - tiebreaker 2: number of morphemes in combo (1 → 4)
   - tiebreaker 3: alphabetical (first letter)
3. **Sort** ascending → easiest first.
4. **Size & window** from distance `d = stageIndex(T) - stageIndex(homeStage)`:

| Distance `d` | Size `N` | Window anchor |
|--------------|----------|---------------|
| `d ≤ -2` | 5 | start of pool (easiest) |
| `d == -1` | 7 | first 2/3 of pool |
| `d == 0` | 8 | pool centre |
| `d == +1` | 9 | pool upper third |
| `d ≥ +2` | 10 | end of pool (hardest) |

If `pool.length < size`, take the whole pool (level becomes shorter rather than padded).

Because windows slide forward as distance grows, adjacent levels **share some words** (overlap) — that's intentional: a mixed-stage class gets a consistent theme with level-appropriate difficulty.

### Persistence

Saving a suggested list uses the existing `class_spelling_sets` insert:

```js
await sb.from('class_spelling_sets').insert({
  class_id: currentClass.id,
  name: 'scope — Wanderer',
  set_number: nextNumber,
  words: ['scope', 'scoped', 'scopes', 'scoping', 'scopic', 'microscope', 'telescope']
}).select('id').single();
```

Words are saved as plain strings (same shape as `createSpellingSetPlain`). Teacher can later click the existing **Run AI Analysis** button on the set to add syllable/phoneme/morpheme breakdowns.

Assignment uses the existing upsert pattern:

```js
await sb.from('spelling_set_assignments').upsert(
  studentIds.map(id => ({ spelling_set_id: setId, student_id: id })),
  { onConflict: 'spelling_set_id,student_id' }
);
```

Students at the target stage are filtered in memory: `students.filter(s => s.stage === targetStage)`.

---

## File Structure

**New files:**
- `wordlab-suggested-sets.js` — pure logic module (`WLSuggested` namespace on `window`). No DOM, no Supabase. ~250–350 lines.
- `tests/test-suggested-sets.js` — Node-runnable test script. Requires `wordlab-suggested-sets.js` and fixture data, exits 0 on success, non-zero on any assertion failure.

**Modified files:**
- `dashboard.html` — adds `<script src="wordlab-suggested-sets.js" defer></script>`, a new **Suggested Sets** button in the spelling-sets top bar, modal markup (built via `document.createElement`), and wiring functions (`suggestedOpen`, `suggestedRenderGrid`, `suggestedSelectMorpheme`, `suggestedSaveLevel`).

**Not touched:**
- `valid-combos.json` — read-only.
- `wordlab-data.js` — no new helpers; dashboard uses Supabase client directly (consistent with existing `createSpellingSet` in `dashboard.html:6962`).
- `data.js` — no changes expected.

---

## Task 1: Scaffold module + morpheme index builder

**Files:**
- Create: `wordlab-suggested-sets.js`
- Create: `tests/test-suggested-sets.js`

- [ ] **Step 1: Create `wordlab-suggested-sets.js` scaffold**

Full file contents:

```js
// Word Labs — Suggested Spelling Sets module
// Pure logic (no DOM, no Supabase). Given morphemes + valid-combos, builds
// stage-graded word lists per morpheme. Loaded via <script> in dashboard.html.
//
// Public API (on window.WLSuggested):
//   buildMorphemeIndex(morphemes) → [{ id, type, display, meaning, homeStage, examples }]
//   getCombosForMorpheme(id, type, combos) → combo[]
//   scoreCombo(combo, stageMap) → number (lower = easier)
//   distanceConfig(distance) → { size: int, anchorRatio: float }
//   buildListForStage(sortedPool, homeStage, targetStage) → string[]  (words)
//   buildAllLevels(morphemeId, type, ctx) → { s2e: string[], s2l: string[], s3e: string[], s3l: string[], s4: string[], meta: {...} }
//     where ctx = { morphemes, combos } — morphemes is the flat object from data.js,
//     combos is the parsed valid-combos.json array

(function(global){
  'use strict';

  var STAGE_ORDER = ['s2e','s2l','s3e','s3l','s4'];

  function stageIndex(stage){
    return STAGE_ORDER.indexOf(stage);
  }

  function buildMorphemeIndex(morphemes){
    if (!morphemes) return [];
    var out = [];
    var typeMap = { prefixes: 'prefix', bases: 'base', suffixes: 'suffix' };
    Object.keys(typeMap).forEach(function(key){
      var list = morphemes[key] || [];
      list.forEach(function(m){
        out.push({
          id: m.id,
          type: typeMap[key],
          display: m.display || m.form || m.id,
          meaning: m.meaning || '',
          homeStage: m.stage || null,
          examples: Array.isArray(m.examples) ? m.examples : []
        });
      });
    });
    return out;
  }

  global.WLSuggested = {
    STAGE_ORDER: STAGE_ORDER,
    stageIndex: stageIndex,
    buildMorphemeIndex: buildMorphemeIndex
  };
})(typeof window !== 'undefined' ? window : global);
```

- [ ] **Step 2: Create `tests/test-suggested-sets.js` with three assertions**

```js
// Run with: node tests/test-suggested-sets.js
// Exits 0 if all pass, 1 if any fail.

'use strict';

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var vm = require('vm');

// Load the module into a sandboxed context, mirroring the IIFE on window.
var fakeWindow = {};
var ctx = vm.createContext({ window: fakeWindow, global: fakeWindow });
var src = fs.readFileSync(path.join(__dirname, '..', 'wordlab-suggested-sets.js'), 'utf8');
vm.runInContext(src, ctx);
var WL = fakeWindow.WLSuggested;
if (!WL) throw new Error('WLSuggested not exported to window');

var passed = 0, failed = 0;
function test(name, fn){
  try { fn(); console.log('\u2713 ' + name); passed++; }
  catch(e){ console.error('\u2717 ' + name + '\n  ' + e.message); failed++; }
}

// --- Task 1 tests ---

test('buildMorphemeIndex flattens prefixes/bases/suffixes', function(){
  var idx = WL.buildMorphemeIndex({
    prefixes: [{ id:'un', stage:'s2e', display:'un-', meaning:'not', examples:['unhappy'] }],
    bases:    [{ id:'scope', stage:'s3l', display:'scope', meaning:'look at', examples:['telescope'] }],
    suffixes: [{ id:'ing', stage:'s2e', display:'-ing', meaning:'doing', examples:['running'] }]
  });
  assert.strictEqual(idx.length, 3);
  assert.strictEqual(idx[0].id, 'un');
  assert.strictEqual(idx[0].type, 'prefix');
  assert.strictEqual(idx[0].homeStage, 's2e');
  assert.strictEqual(idx[1].type, 'base');
  assert.strictEqual(idx[2].type, 'suffix');
});

test('buildMorphemeIndex tolerates missing fields', function(){
  var idx = WL.buildMorphemeIndex({ prefixes: [{ id:'x' }], bases: [], suffixes: [] });
  assert.strictEqual(idx.length, 1);
  assert.strictEqual(idx[0].homeStage, null);
  assert.deepStrictEqual(idx[0].examples, []);
});

test('buildMorphemeIndex handles null input', function(){
  assert.deepStrictEqual(WL.buildMorphemeIndex(null), []);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 3: Run tests**

Run: `node tests/test-suggested-sets.js`
Expected output ends with `3 passed, 0 failed` and exit code 0.

- [ ] **Step 4: Commit**

```bash
git add wordlab-suggested-sets.js tests/test-suggested-sets.js
git commit -m "feat(suggested-sets): scaffold WLSuggested module + morpheme index"
```

---

## Task 2: Combo pool retrieval for a morpheme

**Files:**
- Modify: `wordlab-suggested-sets.js`
- Modify: `tests/test-suggested-sets.js`

- [ ] **Step 1: Add failing tests to `tests/test-suggested-sets.js`**

Insert before the final `console.log` line:

```js
// --- Task 2 tests ---

var FIXTURE_COMBOS = [
  { p:null,   b:'scope', s1:null, s2:null, word:'scope' },
  { p:null,   b:'scope', s1:'s',  s2:null, word:'scopes' },
  { p:null,   b:'scope', s1:'ed', s2:null, word:'scoped' },
  { p:'tele', b:'scope', s1:null, s2:null, word:'telescope' },
  { p:'micro',b:'scope', s1:null, s2:null, word:'microscope' },
  { p:null,   b:'act',   s1:null, s2:null, word:'act' },
  { p:'re',   b:'act',   s1:null, s2:null, word:'react' },
  { p:null,   b:'act',   s1:'ing',s2:null, word:'acting' }
];

test('getCombosForMorpheme base — returns only combos with b === id', function(){
  var out = WL.getCombosForMorpheme('scope', 'base', FIXTURE_COMBOS);
  assert.strictEqual(out.length, 5);
  assert.ok(out.every(function(c){ return c.b === 'scope'; }));
});

test('getCombosForMorpheme prefix — returns only combos with p === id', function(){
  var out = WL.getCombosForMorpheme('re', 'prefix', FIXTURE_COMBOS);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].word, 'react');
});

test('getCombosForMorpheme suffix — matches s1 OR s2', function(){
  var combos = [
    { p:null, b:'act', s1:'ion', s2:null, word:'action' },
    { p:null, b:'nat', s1:'ion', s2:'s',  word:'nations' },
    { p:null, b:'act', s1:'ive', s2:'ion',word:'activation' }
  ];
  var out = WL.getCombosForMorpheme('ion', 'suffix', combos);
  assert.strictEqual(out.length, 3);
});

test('getCombosForMorpheme returns [] for unknown id', function(){
  assert.deepStrictEqual(WL.getCombosForMorpheme('nope', 'base', FIXTURE_COMBOS), []);
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `node tests/test-suggested-sets.js`
Expected: `TypeError: WL.getCombosForMorpheme is not a function`, exit 1.

- [ ] **Step 3: Implement `getCombosForMorpheme`**

In `wordlab-suggested-sets.js`, add inside the IIFE before the `global.WLSuggested = ...` block:

```js
function getCombosForMorpheme(id, type, combos){
  if (!id || !combos) return [];
  return combos.filter(function(c){
    if (type === 'prefix') return c.p === id;
    if (type === 'base')   return c.b === id;
    if (type === 'suffix') return c.s1 === id || c.s2 === id;
    return false;
  });
}
```

Then add `getCombosForMorpheme: getCombosForMorpheme,` to the `global.WLSuggested = { ... }` export block (after `buildMorphemeIndex`).

- [ ] **Step 4: Run to confirm passing**

Run: `node tests/test-suggested-sets.js`
Expected: `7 passed, 0 failed`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add wordlab-suggested-sets.js tests/test-suggested-sets.js
git commit -m "feat(suggested-sets): add getCombosForMorpheme"
```

---

## Task 3: Difficulty scorer

**Files:**
- Modify: `wordlab-suggested-sets.js`
- Modify: `tests/test-suggested-sets.js`

A combo's score is `maxStageIdx * 1e6 + length * 1e3 + morphCount * 100 + firstChar/1000`. Sort ascending → easiest first.

- [ ] **Step 1: Add failing tests**

Insert before the final `console.log`:

```js
// --- Task 3 tests ---

var FIXTURE_STAGE_MAP = {
  prefix: { tele:'s3l', micro:'s3l', re:'s2e', un:'s2e' },
  base:   { scope:'s3l', act:'s2e' },
  suffix: { s:'s2e', ed:'s2e', ing:'s2e', ion:'s3e', ive:'s3e' }
};

test('scoreCombo returns a number', function(){
  var c = { p:null, b:'act', s1:null, s2:null, word:'act' };
  assert.strictEqual(typeof WL.scoreCombo(c, FIXTURE_STAGE_MAP), 'number');
});

test('scoreCombo — higher stage scores higher', function(){
  var easy = { p:null, b:'act', s1:null, s2:null, word:'act' };
  var hard = { p:'tele', b:'scope', s1:null, s2:null, word:'telescope' };
  assert.ok(WL.scoreCombo(hard, FIXTURE_STAGE_MAP) > WL.scoreCombo(easy, FIXTURE_STAGE_MAP));
});

test('scoreCombo — ties on stage broken by length', function(){
  var short = { p:null, b:'act', s1:null,  s2:null, word:'act' };
  var long  = { p:null, b:'act', s1:'ing', s2:null, word:'acting' };
  assert.ok(WL.scoreCombo(long, FIXTURE_STAGE_MAP) > WL.scoreCombo(short, FIXTURE_STAGE_MAP));
});

test('scoreCombo — unknown stage defaults to idx 0 (easiest)', function(){
  var unknown = { p:null, b:'xxxx', s1:null, s2:null, word:'xxxx' };
  var known = { p:null, b:'scope', s1:null, s2:null, word:'scope' };
  assert.ok(WL.scoreCombo(unknown, FIXTURE_STAGE_MAP) < WL.scoreCombo(known, FIXTURE_STAGE_MAP),
    'unknown bases should sort before known s3l bases');
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `node tests/test-suggested-sets.js`

- [ ] **Step 3: Implement `scoreCombo`**

Add inside the IIFE:

```js
function scoreCombo(combo, stageMap){
  if (!combo) return 0;
  var maxIdx = 0;
  var tryStage = function(id, kind){
    if (!id) return;
    var stage = stageMap[kind] && stageMap[kind][id];
    if (!stage) return;
    var idx = stageIndex(stage);
    if (idx > maxIdx) maxIdx = idx;
  };
  tryStage(combo.p,  'prefix');
  tryStage(combo.b,  'base');
  tryStage(combo.s1, 'suffix');
  tryStage(combo.s2, 'suffix');

  var morphCount = 0;
  if (combo.p)  morphCount++;
  if (combo.b)  morphCount++;
  if (combo.s1) morphCount++;
  if (combo.s2) morphCount++;
  var word = combo.word || '';
  var len = word.length;
  var firstChar = word.length ? word.charCodeAt(0) : 97;

  return maxIdx * 1e6 + len * 1e3 + morphCount * 100 + (firstChar / 1000);
}
```

Add `scoreCombo: scoreCombo,` to the export block.

- [ ] **Step 4: Run to confirm passing**

Run: `node tests/test-suggested-sets.js`
Expected: `11 passed, 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add wordlab-suggested-sets.js tests/test-suggested-sets.js
git commit -m "feat(suggested-sets): add scoreCombo difficulty function"
```

---

## Task 4: Distance config lookup

**Files:**
- Modify: `wordlab-suggested-sets.js`
- Modify: `tests/test-suggested-sets.js`

- [ ] **Step 1: Add failing tests**

```js
// --- Task 4 tests ---

test('distanceConfig — far below returns size 5 at easiest end', function(){
  assert.deepStrictEqual(WL.distanceConfig(-4), { size: 5, anchorRatio: 0.0 });
  assert.deepStrictEqual(WL.distanceConfig(-2), { size: 5, anchorRatio: 0.0 });
});

test('distanceConfig — d = -1 returns size 7 lower-biased', function(){
  var c = WL.distanceConfig(-1);
  assert.strictEqual(c.size, 7);
  assert.ok(c.anchorRatio > 0 && c.anchorRatio < 0.5);
});

test('distanceConfig — d = 0 returns size 8 centred', function(){
  assert.deepStrictEqual(WL.distanceConfig(0), { size: 8, anchorRatio: 0.5 });
});

test('distanceConfig — d = +1 returns size 9 upper-biased', function(){
  var c = WL.distanceConfig(1);
  assert.strictEqual(c.size, 9);
  assert.ok(c.anchorRatio > 0.5 && c.anchorRatio < 1.0);
});

test('distanceConfig — far above returns size 10 at hardest end', function(){
  assert.deepStrictEqual(WL.distanceConfig(2),  { size: 10, anchorRatio: 1.0 });
  assert.deepStrictEqual(WL.distanceConfig(4),  { size: 10, anchorRatio: 1.0 });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `node tests/test-suggested-sets.js`

- [ ] **Step 3: Implement `distanceConfig`**

```js
function distanceConfig(distance){
  if (distance <= -2) return { size: 5,  anchorRatio: 0.0 };
  if (distance === -1) return { size: 7,  anchorRatio: 0.3 };
  if (distance === 0)  return { size: 8,  anchorRatio: 0.5 };
  if (distance === 1)  return { size: 9,  anchorRatio: 0.7 };
  return { size: 10, anchorRatio: 1.0 };
}
```

Add to export block.

- [ ] **Step 4: Run to confirm passing**

Run: `node tests/test-suggested-sets.js`
Expected: `16 passed, 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add wordlab-suggested-sets.js tests/test-suggested-sets.js
git commit -m "feat(suggested-sets): add distanceConfig lookup"
```

---

## Task 5: List builder for one target stage

**Files:**
- Modify: `wordlab-suggested-sets.js`
- Modify: `tests/test-suggested-sets.js`

Window math: with pool length `L`, size `N`, anchorRatio `r`:
- `anchor = round(r * (L - 1))`
- `start = clamp(anchor - floor(N/2), 0, max(0, L - N))`
- `end = start + min(N, L)`
- return `pool.slice(start, end).map(c => c.word)`

If `L < N`, return the whole pool.

- [ ] **Step 1: Add failing tests**

```js
// --- Task 5 tests ---

function mockPool(n){
  var p = [];
  for (var i = 0; i < n; i++){
    p.push({ p:null, b:'x', s1:null, s2:null, word:'word'+i });
  }
  return p;
}

test('buildListForStage — far below picks easiest 5 from pool start', function(){
  var pool = mockPool(20);
  var list = WL.buildListForStage(pool, 's3l', 's2e');
  assert.deepStrictEqual(list, ['word0','word1','word2','word3','word4']);
});

test('buildListForStage — far above picks hardest 10 from pool end', function(){
  var pool = mockPool(20);
  var list = WL.buildListForStage(pool, 's2e', 's4');
  assert.deepStrictEqual(list, ['word10','word11','word12','word13','word14','word15','word16','word17','word18','word19']);
});

test('buildListForStage — same stage picks 8 centred', function(){
  // distance 0 → size 8, anchor 0.5. Pool 20: anchor=round(0.5*19)=10, start=10-4=6, end=14.
  var pool = mockPool(20);
  var list = WL.buildListForStage(pool, 's3e', 's3e');
  assert.strictEqual(list.length, 8);
  assert.strictEqual(list[0], 'word6');
  assert.strictEqual(list[7], 'word13');
});

test('buildListForStage — pool shorter than size returns whole pool', function(){
  var pool = mockPool(3);
  var list = WL.buildListForStage(pool, 's3l', 's2e');
  assert.strictEqual(list.length, 3);
});

test('buildListForStage — empty pool returns []', function(){
  assert.deepStrictEqual(WL.buildListForStage([], 's3e', 's3e'), []);
});

test('buildListForStage — adjacent levels overlap', function(){
  var pool = mockPool(20);
  var voy = WL.buildListForStage(pool, 's3e', 's2l'); // d = -1
  var wan = WL.buildListForStage(pool, 's3e', 's3e'); // d = 0
  var shared = voy.filter(function(w){ return wan.indexOf(w) !== -1; });
  assert.ok(shared.length > 0, 'adjacent levels should share at least one word');
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `node tests/test-suggested-sets.js`

- [ ] **Step 3: Implement `buildListForStage`**

```js
function buildListForStage(sortedPool, homeStage, targetStage){
  if (!sortedPool || sortedPool.length === 0) return [];
  var homeIdx = stageIndex(homeStage);
  var targetIdx = stageIndex(targetStage);
  if (homeIdx < 0) homeIdx = 2;
  if (targetIdx < 0) return sortedPool.map(function(c){ return c.word; });

  var distance = targetIdx - homeIdx;
  var cfg = distanceConfig(distance);
  var L = sortedPool.length;
  var N = Math.min(cfg.size, L);

  var anchor = Math.round(cfg.anchorRatio * (L - 1));
  var start = anchor - Math.floor(N / 2);
  start = Math.max(0, Math.min(start, L - N));
  var end = start + N;

  return sortedPool.slice(start, end).map(function(c){ return c.word; });
}
```

Add to export block.

- [ ] **Step 4: Run to confirm passing**

Run: `node tests/test-suggested-sets.js`
Expected: `22 passed, 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add wordlab-suggested-sets.js tests/test-suggested-sets.js
git commit -m "feat(suggested-sets): add buildListForStage with anchored window"
```

---

## Task 6: `buildAllLevels` orchestration

**Files:**
- Modify: `wordlab-suggested-sets.js`
- Modify: `tests/test-suggested-sets.js`

Public entry point: given a morpheme id + type + context, return `{s2e, s2l, s3e, s3l, s4, meta}`.

- [ ] **Step 1: Add failing tests**

```js
// --- Task 6 tests ---

var FIXTURE_MORPHEMES_FULL = {
  prefixes: [
    { id:'un',    stage:'s2e', display:'un-',    meaning:'not',     examples:[] },
    { id:'tele',  stage:'s3l', display:'tele-',  meaning:'far',     examples:[] },
    { id:'micro', stage:'s3l', display:'micro-', meaning:'small',   examples:[] }
  ],
  bases: [
    { id:'act',   stage:'s2e', display:'act',    meaning:'do',      examples:[] },
    { id:'scope', stage:'s3l', display:'scope',  meaning:'look at', examples:[] }
  ],
  suffixes: [
    { id:'s',   stage:'s2e', display:'-s',   meaning:'plural', examples:[] },
    { id:'ed',  stage:'s2e', display:'-ed',  meaning:'past',   examples:[] },
    { id:'ing', stage:'s2e', display:'-ing', meaning:'doing',  examples:[] },
    { id:'ion', stage:'s3e', display:'-ion', meaning:'state',  examples:[] }
  ]
};

var SCOPE_COMBOS = [
  { p:null,   b:'scope', s1:null, s2:null, word:'scope' },
  { p:null,   b:'scope', s1:'s',  s2:null, word:'scopes' },
  { p:null,   b:'scope', s1:'ed', s2:null, word:'scoped' },
  { p:null,   b:'scope', s1:'ing',s2:null, word:'scoping' },
  { p:'tele', b:'scope', s1:null, s2:null, word:'telescope' },
  { p:'tele', b:'scope', s1:'s',  s2:null, word:'telescopes' },
  { p:'micro',b:'scope', s1:null, s2:null, word:'microscope' },
  { p:'micro',b:'scope', s1:'s',  s2:null, word:'microscopes' }
];

test('buildAllLevels — returns 5 stage keys', function(){
  var res = WL.buildAllLevels('scope', 'base', {
    morphemes: FIXTURE_MORPHEMES_FULL,
    combos: SCOPE_COMBOS
  });
  ['s2e','s2l','s3e','s3l','s4'].forEach(function(s){
    assert.ok(Array.isArray(res[s]), s + ' present');
  });
});

test('buildAllLevels — s2e for s3l-home morpheme is 5 easiest', function(){
  var res = WL.buildAllLevels('scope', 'base', {
    morphemes: FIXTURE_MORPHEMES_FULL,
    combos: SCOPE_COMBOS
  });
  assert.strictEqual(res.s2e.length, 5);
  assert.ok(res.s2e.indexOf('scope') !== -1);
});

test('buildAllLevels — s3l for s3l-home morpheme uses whole pool when pool<=size', function(){
  var res = WL.buildAllLevels('scope', 'base', {
    morphemes: FIXTURE_MORPHEMES_FULL,
    combos: SCOPE_COMBOS
  });
  assert.strictEqual(res.s3l.length, 8);
});

test('buildAllLevels — meta carries homeStage + poolSize + morpheme', function(){
  var res = WL.buildAllLevels('scope', 'base', {
    morphemes: FIXTURE_MORPHEMES_FULL,
    combos: SCOPE_COMBOS
  });
  assert.strictEqual(res.meta.homeStage, 's3l');
  assert.strictEqual(res.meta.poolSize, 8);
  assert.strictEqual(res.meta.morpheme.id, 'scope');
});

test('buildAllLevels — unknown morpheme returns empty lists', function(){
  var res = WL.buildAllLevels('zzz', 'base', {
    morphemes: FIXTURE_MORPHEMES_FULL,
    combos: SCOPE_COMBOS
  });
  assert.deepStrictEqual(res.s2e, []);
  assert.strictEqual(res.meta.poolSize, 0);
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `node tests/test-suggested-sets.js`

- [ ] **Step 3: Implement `buildAllLevels`**

```js
function _buildStageMap(morphemes){
  var map = { prefix: {}, base: {}, suffix: {} };
  (morphemes.prefixes || []).forEach(function(m){ if (m.stage) map.prefix[m.id] = m.stage; });
  (morphemes.bases    || []).forEach(function(m){ if (m.stage) map.base[m.id]   = m.stage; });
  (morphemes.suffixes || []).forEach(function(m){ if (m.stage) map.suffix[m.id] = m.stage; });
  return map;
}

function _findMorpheme(id, type, morphemes){
  var key = type === 'prefix' ? 'prefixes' : type === 'base' ? 'bases' : 'suffixes';
  var list = morphemes[key] || [];
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function buildAllLevels(morphemeId, type, ctx){
  var morphemes = (ctx && ctx.morphemes) || { prefixes:[], bases:[], suffixes:[] };
  var combos = (ctx && ctx.combos) || [];
  var stageMap = _buildStageMap(morphemes);
  var morpheme = _findMorpheme(morphemeId, type, morphemes);
  var homeStage = morpheme && morpheme.stage ? morpheme.stage : null;

  var pool = getCombosForMorpheme(morphemeId, type, combos);
  pool.sort(function(a, b){
    return scoreCombo(a, stageMap) - scoreCombo(b, stageMap);
  });

  var out = {};
  STAGE_ORDER.forEach(function(s){
    out[s] = buildListForStage(pool, homeStage, s);
  });
  out.meta = {
    homeStage: homeStage,
    poolSize: pool.length,
    morpheme: morpheme ? {
      id: morpheme.id,
      type: type,
      display: morpheme.display || morpheme.id,
      meaning: morpheme.meaning || ''
    } : null
  };
  return out;
}
```

Add `buildAllLevels: buildAllLevels,` to the export block.

- [ ] **Step 4: Run to confirm passing**

Run: `node tests/test-suggested-sets.js`
Expected: `27 passed, 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add wordlab-suggested-sets.js tests/test-suggested-sets.js
git commit -m "feat(suggested-sets): add buildAllLevels orchestration"
```

---

## Task 7: Dashboard — load module, add entry button, modal scaffold

**Files:**
- Modify: `dashboard.html`

All dashboard UI code uses `document.createElement` (no `innerHTML`) per project XSS hygiene.

- [ ] **Step 1: Add `<script>` tag for the module**

In `dashboard.html`, find the `wordlab-stage.js` script tag (grep for `wordlab-stage.js`). Add the new module on the next line:

```html
<script src="wordlab-stage.js" defer></script>
<script src="wordlab-suggested-sets.js" defer></script>
```

- [ ] **Step 2: Add "Suggested Sets" button in the Spelling Sets top bar**

Find the existing `<button onclick="createSpellingSet()"` in `dashboard.html` (near line 6902). Locate its enclosing toolbar `<div>` and add, immediately before the `createSpellingSet` button, a sibling button:

```html
<button onclick="suggestedOpen()" id="suggestedOpenBtn"
        style="border:none;background:var(--indigo);color:#fff;font-weight:800;font-size:12px;padding:9px 14px;border-radius:10px;cursor:pointer;font-family:'Lexend',sans-serif;">
  Suggested Sets
</button>
```

(Leading emoji omitted — project style avoids emojis unless user requests.)

- [ ] **Step 3: Add the modal markup, built via DOM methods**

At the end of the main `<script>` block in `dashboard.html` (after the other top-level state variables and functions, before `</script>`), add:

```js
// --- Suggested Spelling Sets state ---
var _suggestedCombos = null;
var _suggestedIndex = null;
var _suggestedSelected = null;   // { id, type }
var _suggestedEdits = null;      // { s2e: [...], s2l: [...], ... }
var _suggestedModalEl = null;

function _suggestedBuildModal(){
  var overlay = document.createElement('div');
  overlay.id = 'suggestedModal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'suggestedTitle');
  overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:9000;background:rgba(15,23,42,0.82);backdrop-filter:blur(6px);padding:24px;overflow:auto;';

  var card = document.createElement('div');
  card.style.cssText = 'max-width:1100px;margin:0 auto;background:var(--navy-2);border:1px solid var(--line);border-radius:16px;padding:22px;color:var(--text);';

  var headerRow = document.createElement('div');
  headerRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;';

  var title = document.createElement('h2');
  title.id = 'suggestedTitle';
  title.style.cssText = 'margin:0;font-size:20px;font-weight:900;';
  title.textContent = 'Suggested Spelling Sets';

  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.style.cssText = 'border:none;background:transparent;color:var(--text-secondary);font-size:26px;cursor:pointer;line-height:1;';
  closeBtn.textContent = '\u00d7';
  closeBtn.onclick = function(){ suggestedClose(); };

  headerRow.appendChild(title);
  headerRow.appendChild(closeBtn);

  var bodyEl = document.createElement('div');
  bodyEl.id = 'suggestedBody';

  card.appendChild(headerRow);
  card.appendChild(bodyEl);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Close when clicking the overlay (not the card).
  overlay.addEventListener('click', function(e){
    if (e.target === overlay) suggestedClose();
  });

  return overlay;
}

async function suggestedOpen(){
  if (!_suggestedModalEl) _suggestedModalEl = _suggestedBuildModal();
  _suggestedModalEl.style.display = '';
  document.body.style.overflow = 'hidden';
  var body = document.getElementById('suggestedBody');
  body.textContent = 'Loading morphemes and combos\u2026';
  try {
    if (!_suggestedCombos) {
      var res = await fetch('valid-combos.json');
      _suggestedCombos = await res.json();
    }
    if (!_suggestedIndex) {
      if (!window.WLSuggested || !window.MORPHEMES) {
        throw new Error('Required modules not loaded (WLSuggested or MORPHEMES).');
      }
      _suggestedIndex = window.WLSuggested.buildMorphemeIndex(window.MORPHEMES);
    }
    suggestedRenderGrid();
  } catch(e){
    body.textContent = 'Error: ' + (e.message || e);
  }
}

function suggestedClose(){
  if (_suggestedModalEl) _suggestedModalEl.style.display = 'none';
  document.body.style.overflow = '';
  _suggestedSelected = null;
  _suggestedEdits = null;
}

function suggestedRenderGrid(){
  // stub — populated in Task 8
  var body = document.getElementById('suggestedBody');
  body.textContent = 'Loaded ' + _suggestedIndex.length + ' morphemes. Grid coming next.';
}
```

- [ ] **Step 4: Manual verification**

1. Run: `python3 -m http.server 8080 --bind 0.0.0.0`
2. Open `http://localhost:8080/dashboard.html`, log in, navigate to the Spelling Sets area.
3. Click **Suggested Sets** — modal opens and displays `Loaded N morphemes. Grid coming next.` (N ≈ 349).
4. Click the `×` or click the overlay backdrop — modal closes and background scrolling is restored.

- [ ] **Step 5: Commit**

```bash
git add dashboard.html
git commit -m "feat(suggested-sets): dashboard modal scaffold + entry button"
```

---

## Task 8: Dashboard — morpheme browser grid

**Files:**
- Modify: `dashboard.html`

- [ ] **Step 1: Replace the `suggestedRenderGrid` stub with the full implementation**

Locate `function suggestedRenderGrid()` (added in Task 7) and replace it entirely with:

```js
function suggestedRenderGrid(){
  var body = document.getElementById('suggestedBody');
  while (body.firstChild) body.removeChild(body.firstChild);

  // --- Controls row ---
  var controls = document.createElement('div');
  controls.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px;';

  var search = document.createElement('input');
  search.id = 'suggestedSearch';
  search.type = 'text';
  search.placeholder = 'Search morphemes\u2026';
  search.style.cssText = 'flex:1 1 240px;min-width:200px;padding:9px 12px;border-radius:10px;border:1px solid var(--line);background:var(--navy-3);color:var(--text);font-family:\'Lexend\',sans-serif;font-size:13px;';

  function _makeSelect(id, options){
    var sel = document.createElement('select');
    sel.id = id;
    sel.style.cssText = 'padding:9px 12px;border-radius:10px;border:1px solid var(--line);background:var(--navy-3);color:var(--text);font-size:13px;';
    options.forEach(function(opt){
      var o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      sel.appendChild(o);
    });
    return sel;
  }

  var typeFilter = _makeSelect('suggestedTypeFilter', [
    { value: 'all',    label: 'All types' },
    { value: 'prefix', label: 'Prefixes' },
    { value: 'base',   label: 'Bases' },
    { value: 'suffix', label: 'Suffixes' }
  ]);

  var stageFilter = _makeSelect('suggestedStageFilter', [
    { value: 'all', label: 'All stages' },
    { value: 's2e', label: 'Explorer (s2e)' },
    { value: 's2l', label: 'Voyager (s2l)' },
    { value: 's3e', label: 'Wanderer (s3e)' },
    { value: 's3l', label: 'Trailblazer (s3l)' },
    { value: 's4',  label: 'Pioneer (s4)' }
  ]);

  controls.appendChild(search);
  controls.appendChild(typeFilter);
  controls.appendChild(stageFilter);
  body.appendChild(controls);

  // --- Grid wrapper ---
  var gridWrap = document.createElement('div');
  gridWrap.id = 'suggestedGridWrap';
  gridWrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;max-height:60vh;overflow:auto;padding:4px;';
  body.appendChild(gridWrap);

  function _renderCards(){
    var q = (search.value || '').toLowerCase().trim();
    var tf = typeFilter.value;
    var sf = stageFilter.value;

    while (gridWrap.firstChild) gridWrap.removeChild(gridWrap.firstChild);

    var filtered = _suggestedIndex.filter(function(m){
      if (tf !== 'all' && m.type !== tf) return false;
      if (sf !== 'all' && m.homeStage !== sf) return false;
      if (q){
        var hay = (m.id + ' ' + m.display + ' ' + m.meaning).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (!filtered.length){
      var empty = document.createElement('div');
      empty.style.cssText = 'grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:24px;';
      empty.textContent = 'No morphemes match.';
      gridWrap.appendChild(empty);
      return;
    }

    filtered.forEach(function(m){
      var card = document.createElement('button');
      card.type = 'button';
      card.style.cssText = 'text-align:left;background:var(--navy-3);border:1px solid var(--line);border-radius:10px;padding:10px 12px;color:var(--text);cursor:pointer;font-family:\'Lexend\',sans-serif;display:flex;flex-direction:column;gap:4px;';
      card.addEventListener('mouseenter', function(){ card.style.borderColor = 'var(--indigo)'; });
      card.addEventListener('mouseleave', function(){ card.style.borderColor = 'var(--line)'; });

      var top = document.createElement('div');
      top.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:6px;';

      var disp = document.createElement('span');
      disp.style.cssText = 'font-weight:800;font-size:14px;';
      disp.textContent = m.display;

      var stageLabel = m.homeStage
        ? (window.WLStage.STAGE_SHORT[m.homeStage] || m.homeStage)
        : '\u2014';
      var pill = document.createElement('span');
      pill.style.cssText = 'font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;background:var(--navy-2);color:var(--text-secondary);white-space:nowrap;';
      pill.textContent = m.type.toUpperCase() + ' \u00b7 ' + stageLabel;

      top.appendChild(disp);
      top.appendChild(pill);

      var meaning = document.createElement('div');
      meaning.style.cssText = 'font-size:11px;color:var(--text-secondary);';
      meaning.textContent = m.meaning || '';

      card.appendChild(top);
      card.appendChild(meaning);

      card.addEventListener('click', function(){ suggestedSelectMorpheme(m.id, m.type); });
      gridWrap.appendChild(card);
    });
  }

  search.addEventListener('input', _renderCards);
  typeFilter.addEventListener('change', _renderCards);
  stageFilter.addEventListener('change', _renderCards);
  _renderCards();
}

function suggestedSelectMorpheme(id, type){
  // stub — populated in Task 9
  console.log('TODO: render detail for', id, type);
}
```

- [ ] **Step 2: Manual verification**

1. Reload dashboard, open **Suggested Sets**.
2. Confirm a scrollable grid of ~349 cards appears.
3. Type `scope` in the search — only scope-related morphemes show.
4. Change the type filter to **Bases** — only base cards show.
5. Change the stage filter to **Trailblazer (s3l)** — only s3l morphemes show.
6. Click any card — check DevTools console for `TODO: render detail for <id> <type>`.
7. Grid scrolls independently of the modal header.

- [ ] **Step 3: Commit**

```bash
git add dashboard.html
git commit -m "feat(suggested-sets): searchable morpheme browser grid"
```

---

## Task 9: Dashboard — morpheme detail view with 5 level columns

**Files:**
- Modify: `dashboard.html`

- [ ] **Step 1: Replace `suggestedSelectMorpheme` stub with the real renderer**

Locate `function suggestedSelectMorpheme(id, type)` (the stub added in Task 8) and replace it entirely with the following two functions:

```js
function suggestedSelectMorpheme(id, type){
  _suggestedSelected = { id: id, type: type };
  var result = window.WLSuggested.buildAllLevels(id, type, {
    morphemes: window.MORPHEMES,
    combos: _suggestedCombos
  });

  _suggestedEdits = {
    s2e: result.s2e.slice(),
    s2l: result.s2l.slice(),
    s3e: result.s3e.slice(),
    s3l: result.s3l.slice(),
    s4:  result.s4.slice()
  };

  var body = document.getElementById('suggestedBody');
  while (body.firstChild) body.removeChild(body.firstChild);

  var meta = result.meta.morpheme || { display: id, meaning: '' };
  var homeLbl = result.meta.homeStage
    ? (window.WLStage.STAGE_NAMES[result.meta.homeStage] + ' (' + result.meta.homeStage + ')')
    : 'unassigned';

  // --- Header row ---
  var header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:16px;';

  var headerH = document.createElement('h3');
  headerH.style.cssText = 'margin:0;font-size:22px;font-weight:900;';
  var typeLabel = type === 'prefix' ? ' (prefix)' : type === 'suffix' ? ' (suffix)' : ' (base)';
  headerH.textContent = meta.display + typeLabel;

  var headerMeaning = document.createElement('div');
  headerMeaning.style.cssText = 'color:var(--text-secondary);font-size:13px;';
  headerMeaning.textContent = (meta.meaning ? meta.meaning + ' \u00b7 ' : '')
    + 'home: ' + homeLbl + ' \u00b7 ' + result.meta.poolSize + ' combos';

  var back = document.createElement('button');
  back.type = 'button';
  back.style.cssText = 'margin-left:auto;border:1px solid var(--line);background:var(--navy-3);color:var(--text);font-weight:700;font-size:12px;padding:7px 12px;border-radius:8px;cursor:pointer;font-family:\'Lexend\',sans-serif;';
  back.textContent = '\u2190 Back to morphemes';
  back.addEventListener('click', function(){ suggestedRenderGrid(); });

  header.appendChild(headerH);
  header.appendChild(headerMeaning);
  header.appendChild(back);
  body.appendChild(header);

  // --- 5 level columns ---
  var grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:10px;';
  body.appendChild(grid);

  window.WLSuggested.STAGE_ORDER.forEach(function(stage){
    var col = document.createElement('div');
    col.style.cssText = 'background:var(--navy-3);border:1px solid var(--line);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px;min-height:260px;';

    var colTitle = document.createElement('div');
    colTitle.style.cssText = 'font-weight:900;font-size:14px;';
    colTitle.textContent = window.WLStage.STAGE_NAMES[stage];

    var colSub = document.createElement('div');
    colSub.style.cssText = 'font-size:11px;color:var(--text-secondary);';
    colSub.textContent = window.WLStage.STAGE_LABELS[stage];

    col.appendChild(colTitle);
    col.appendChild(colSub);

    var listWrap = document.createElement('div');
    listWrap.id = 'sugList-' + stage;
    listWrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;flex:1;';
    col.appendChild(listWrap);

    var assignBtn = document.createElement('button');
    assignBtn.type = 'button';
    assignBtn.style.cssText = 'margin-top:auto;border:none;background:var(--indigo);color:#fff;font-weight:800;font-size:12px;padding:9px;border-radius:9px;cursor:pointer;font-family:\'Lexend\',sans-serif;';
    assignBtn.textContent = 'Save & assign';
    assignBtn.addEventListener('click', (function(s){ return function(){ suggestedSaveLevel(s); }; })(stage));
    col.appendChild(assignBtn);

    grid.appendChild(col);
    suggestedRenderLevelList(stage);
  });
}

function suggestedRenderLevelList(stage){
  var wrap = document.getElementById('sugList-' + stage);
  if (!wrap) return;
  while (wrap.firstChild) wrap.removeChild(wrap.firstChild);

  var words = _suggestedEdits[stage] || [];
  if (!words.length){
    var empty = document.createElement('div');
    empty.style.cssText = 'color:var(--text-secondary);font-size:12px;font-style:italic;padding:6px 0;';
    empty.textContent = 'No words for this stage.';
    wrap.appendChild(empty);
    return;
  }

  words.forEach(function(w, i){
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;background:var(--navy-2);border-radius:6px;padding:5px 8px;';

    var label = document.createElement('span');
    label.style.cssText = 'flex:1;font-size:13px;';
    label.textContent = w;

    var del = document.createElement('button');
    del.type = 'button';
    del.setAttribute('aria-label', 'Remove ' + w);
    del.style.cssText = 'border:none;background:transparent;color:var(--text-secondary);font-size:16px;cursor:pointer;line-height:1;';
    del.textContent = '\u00d7';
    del.addEventListener('click', (function(idx){ return function(){
      _suggestedEdits[stage].splice(idx, 1);
      suggestedRenderLevelList(stage);
    }; })(i));

    row.appendChild(label);
    row.appendChild(del);
    wrap.appendChild(row);
  });
}

function suggestedSaveLevel(stage){
  // stub — populated in Task 10
  alert('TODO: save & assign ' + stage + ' — ' + (_suggestedEdits[stage] || []).join(', '));
}
```

- [ ] **Step 2: Manual verification**

1. Reload dashboard, open **Suggested Sets**, search `scope`, click the scope base card.
2. Confirm:
   - Header shows `scope (base) · look at · home: Trailblazer (s3l) · 22 combos` (numbers may differ with current data).
   - Five columns render, each with a distinct word list.
   - Explorer column ≈ 5 words (easiest), Pioneer column ≈ 10 words (hardest), overlap visible between adjacent columns.
3. Click `×` on a word — it disappears from that column only.
4. Click **← Back to morphemes** — grid re-renders.
5. Click **Save & assign** on any column — alert shows placeholder text.

- [ ] **Step 3: Commit**

```bash
git add dashboard.html
git commit -m "feat(suggested-sets): morpheme detail view with 5 level columns"
```

---

## Task 10: Dashboard — save level + assign to stage-matched students

**Files:**
- Modify: `dashboard.html`

Before implementing, find the variable name the dashboard uses for the loaded students of the current class. Grep `spelling_set_assignments.*upsert` in `dashboard.html` and look a few lines up — the existing code iterates a students list. In current code that array is typically named `students` or `_students` depending on the function scope. For Task 10, use the same identifier the nearby function uses (consistency beats a guess).

- [ ] **Step 1: Identify the students array variable**

Run: `grep -n "spelling_set_assignments" dashboard.html | head`
Open the file to the line numbers that come back and read 20 lines above each upsert call. Confirm which variable holds the current class's students (e.g. `students`, `_students`, `currentStudents`, etc.). Use that exact identifier in Step 2.

- [ ] **Step 2: Replace `suggestedSaveLevel` stub**

Replace the stub with (substituting `STUDENTS_VAR` for the variable you identified in Step 1):

```js
async function suggestedSaveLevel(stage){
  if (!currentClass) { alert('No class selected.'); return; }
  var words = (_suggestedEdits[stage] || []).filter(Boolean);
  if (!words.length) { alert('This list is empty \u2014 add some words first.'); return; }

  var allStudents = STUDENTS_VAR || [];
  var targets = allStudents.filter(function(s){ return s.stage === stage; });

  if (!targets.length){
    var proceed = confirm('No students are at ' + window.WLStage.STAGE_NAMES[stage] + ' in this class. Save the set without assigning?');
    if (!proceed) return;
  }

  var meta = _suggestedSelected || { id: 'unknown', type: 'base' };
  var nameEl = document.getElementById('sugName-' + stage);
  var fallbackName = meta.id + ' \u2014 ' + window.WLStage.STAGE_NAMES[stage];
  var setName = nameEl ? ((nameEl.value || '').trim() || fallbackName) : fallbackName;

  var maxNum = _spellingSets.reduce(function(m, s){ return Math.max(m, s.set_number || 0); }, 0);
  var setNumber = maxNum + 1;

  try {
    var insertRes = await dbSb().from('class_spelling_sets').insert({
      class_id: currentClass.id,
      name: setName,
      set_number: setNumber,
      words: words
    }).select('id').single();
    if (insertRes.error) throw insertRes.error;
    var setId = insertRes.data.id;

    if (targets.length){
      var rows = targets.map(function(s){ return { spelling_set_id: setId, student_id: s.id }; });
      var assignRes = await dbSb().from('spelling_set_assignments').upsert(rows, { onConflict: 'spelling_set_id,student_id' });
      if (assignRes.error) throw assignRes.error;
    }

    var msg = '"' + setName + '" saved with ' + words.length + ' words';
    msg += targets.length
      ? ' and assigned to ' + targets.length + ' ' + window.WLStage.STAGE_NAMES[stage] + ' student(s).'
      : '.';
    alert(msg);

    _activeSpellingSetId = setId;
    await renderSpellingSetsTab();
  } catch(e){
    alert('Error saving: ' + (e.message || e));
  }
}
```

- [ ] **Step 3: Manual verification**

1. In Supabase Studio (or via the dashboard Levels modal) ensure at least one student in `currentClass` has `stage = 's3l'`.
2. Open **Suggested Sets** → search `scope` → click it.
3. Click **Save & assign** on the Trailblazer column.
4. Expect an alert like `"scope — Trailblazer" saved with 7 words and assigned to 1 Trailblazer student(s).`
5. Close the modal → the Spelling Sets list now includes `scope — Trailblazer`, and the assigned student sees it in their next game round.
6. Repeat on a stage with zero matching students — confirm the "Save without assigning?" confirm dialog fires.

- [ ] **Step 4: Commit**

```bash
git add dashboard.html
git commit -m "feat(suggested-sets): save level as spelling set + assign to stage students"
```

---

## Task 11: Dashboard — per-column add-word input + editable set name

**Files:**
- Modify: `dashboard.html`

- [ ] **Step 1: Add a "+ add word" input above each level's word list**

In `suggestedRenderLevelList`, immediately after the `while (wrap.firstChild) wrap.removeChild(wrap.firstChild);` line, **before** the empty-state check, insert:

```js
var addRow = document.createElement('div');
addRow.style.cssText = 'display:flex;gap:4px;margin-bottom:4px;';

var addInput = document.createElement('input');
addInput.type = 'text';
addInput.placeholder = '+ add word';
addInput.style.cssText = 'flex:1;padding:5px 8px;border-radius:6px;border:1px solid var(--line);background:var(--navy-3);color:var(--text);font-size:12px;font-family:\'Lexend\',sans-serif;';
addInput.addEventListener('keydown', function(e){
  if (e.key !== 'Enter') return;
  var v = (addInput.value || '').trim().toLowerCase();
  if (!v) return;
  if (_suggestedEdits[stage].indexOf(v) === -1){
    _suggestedEdits[stage].push(v);
    suggestedRenderLevelList(stage);
  } else {
    addInput.value = '';
  }
});

addRow.appendChild(addInput);
wrap.appendChild(addRow);
```

- [ ] **Step 2: Add an editable set-name input to each column**

In `suggestedSelectMorpheme`, inside the `STAGE_ORDER.forEach` callback, after `col.appendChild(colSub);` and **before** `var listWrap = document.createElement('div');`, insert:

```js
var nameInput = document.createElement('input');
nameInput.type = 'text';
nameInput.id = 'sugName-' + stage;
nameInput.value = meta.display.replace(/-/g, '').trim() + ' \u2014 ' + window.WLStage.STAGE_NAMES[stage];
nameInput.style.cssText = 'padding:6px 8px;border-radius:6px;border:1px solid var(--line);background:var(--navy-2);color:var(--text);font-size:12px;font-family:\'Lexend\',sans-serif;';
col.appendChild(nameInput);
```

(`suggestedSaveLevel` in Task 10 already reads from `sugName-<stage>`, so no further change needed there.)

- [ ] **Step 3: Manual verification**

1. Open **Suggested Sets** → any morpheme.
2. Each column shows an editable set-name field at the top.
3. Type a word into the `+ add word` box on any column, press Enter — word appears in that column.
4. Edit the name field on one column, click Save & assign — confirm the saved set uses that edited name (check the Spelling Sets sidebar).

- [ ] **Step 4: Commit**

```bash
git add dashboard.html
git commit -m "feat(suggested-sets): add-word input + editable set name per level"
```

---

## Self-review checklist

**Spec coverage:**
- Browse morphemes → Task 7 (button + modal) + Task 8 (grid).
- Five levels, 7–10 words each, progressive overlapping → Tasks 4, 5, 6.
- Distance-modulated sizing → Task 4 (`distanceConfig`).
- Reuse existing assignment → Task 10 (`class_spelling_sets` + `spelling_set_assignments`).
- Edit before assigning → Tasks 9 (remove) and 11 (add + rename).
- Stage labelling (Explorer/Voyager/Wanderer/Trailblazer/Pioneer) → via `WLStage.STAGE_NAMES` throughout.
- Sparse-morpheme fallback → Task 5 (pool shorter than size returns whole pool).

**Placeholder scan:** No TBD/TODO left in shipped code. The `TODO` strings in Task 8 and Task 9 stubs are replaced in Tasks 9 and 10 respectively.

**Type consistency:**
- Morpheme type strings `'prefix' | 'base' | 'suffix'` (singular) — Task 1 (index), 2 (filter), 6 (`_findMorpheme`), 9 (display), 10 (set name).
- Stage codes `s2e | s2l | s3e | s3l | s4` via `WLStage.STAGE_ORDER` — Tasks 1, 5, 6, 9, 10.
- `_suggestedEdits` shape `{s2e, s2l, s3e, s3l, s4}` set in Task 9, read in Tasks 9, 10, 11.
- `_suggestedSelected` shape `{id, type}` set in Task 9, read in Task 10.
- DB columns (`class_spelling_sets.words`, `spelling_set_assignments.spelling_set_id`, `students.stage`) match existing dashboard usage.
- No `innerHTML` anywhere in the new dashboard code — consistent with project XSS hygiene.

---

## Risks & mitigations

1. **`window.MORPHEMES` / `WLStage` not loaded before modal opens.** Mitigated by `defer` on all three script tags in `dashboard.html` and the defensive check in `suggestedOpen`. If a race occurs, the user sees a clear error and can retry.
2. **Students-array variable name.** Task 10 Step 1 explicitly calls out verifying the correct identifier before coding. Using the wrong one causes the feature to silently "no students at this stage" — the Step 3 verification catches this.
3. **Very sparse morphemes (pool < 5).** Task 5 handles this by returning the whole pool — lists become shorter than 5 at the bottom end. Teacher can add extra words via Task 11's `+ add word` input.
4. **AI-analysis-dependent games (Breakdown/Meaning/Mission) won't use plain-word sets.** Acceptable: the existing **Run AI Analysis** button on each set handles this. Flag in release notes.
5. **Naming collision (`scope — Trailblazer` already exists).** `class_spelling_sets` has no unique constraint on `name`; teachers will see duplicates and can delete the old one. Acceptable v1.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-16-suggested-spelling-sets.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session with checkpoints for review.

Which approach?
