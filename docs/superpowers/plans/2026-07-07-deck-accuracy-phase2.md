# Teaching Deck Accuracy — Phase 2 (Deterministic Deck Generation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Regenerate all ~360 morpheme teaching decks with content DERIVED from the now-hardened `word-study-data.js` + `valid-combos.json` (verified syllables/phonemes/morphemes/definitions/sentences, real matrices, no repeated focus words), replacing the current AI-invented content. A deck that fails a hard validation gate is not emitted.

**Architecture:** Keep the PPTX renderer `wordlabs-deck-generator.js` (`buildDeck(DATA, outPath)`) unchanged. Replace only how the per-morpheme `DATA` object is produced: a new pure builder assembles it from verified data. Zero AI/fable — every fact and even the example sentences come from `word-study-data.js`. A validation gate runs before each PPTX is written; a batch runner regenerates all decks with per-batch commits.

**Tech Stack:** Node.js, `pptxgenjs` (already a dep, used by the existing renderer), `word-study-data.js`, `valid-combos.json`, `data.js` (`window.MORPHEMES` for morpheme meanings), the existing `scripts/word-study/invariants.js`.

## Global Constraints

- **Zero AI generation.** All deck content is derived from verified data. No Claude/fable calls, no `generate-all-decks.js` prompt path.
- **Hard validation gate per deck** (`validateDeckData`): for every focus word — `syllables.join('') === word` and phoneme join (magic-e aware, reuse `invariants.checkSyllables`/`checkPhonemes`); every matrix prefix×base and base×suffix pairing must correspond to a real word in `valid-combos.json`; NO focus word repeated across day 1/2/3. Fail → do not emit that deck; log it to the state file.
- **No repeats:** day 1/2/3 focus words drawn from one deduped per-deck pool.
- **Renderer untouched:** do not modify `wordlabs-deck-generator.js`'s slide-drawing code. `DATA` must match the schema it consumes (see Task 1).
- **Resumability:** batch runner tracks per-morpheme state in `scripts/deck-accuracy/state-decks.json` (`pending|generated|FAILED:<reason>`); commit after every batch of 20; re-runs skip `generated`.
- **Australian English**, ages 7–12. Output decks to `output/` with the existing filename convention (`wordlabs-<morpheme><-prefix|-suffix|>-3day.pptx`).

## DATA schema the renderer consumes (from wordlabs-deck-generator.js:13-123)
```
{ morpheme, type:'base'|'prefix'|'suffix', meaning, origin,
  prefixes:[str], suffixes:[str],                          // matrix columns
  examples:[{word, definition}],
  trueOrFalse:[{statement, answer:bool}],
  day1Sentences:[str],
  day2:{ sentence, punctuationCount, words:[ {word, morphemes:[{part,meaning}], syllables:"a/b/c", phonemes:[{g,s?}] } ] },
  day3:{ sentence, punctuationCount, words:[ ...same shape ] } }
```

## word-study entry shape (verified source, per word)
`{ word, morphemes:{prefix,base,suffix1,suffix2}, partMeanings:{<part>:<meaning>}, syllables:[str], phonemes:[str], meaning, sentences:{correct, wrong:[2]} }`

---

## Task 1: Deck-data builder — helpers (pure, TDD)

**Files:**
- Create: `scripts/deck-accuracy/deck-data.js`
- Test: `scripts/deck-accuracy/deck-data.test.js`

**Interfaces:**
- Produces:
  - `wsToDeckWord(ws) -> {word, morphemes:[{part,meaning}], syllables:string, phonemes:[{g}]}` — converts one word-study entry to the renderer's word shape (syllables joined with `/`; phonemes mapped `s=>({g:s})`; morphemes from `ws.morphemes` parts in order prefix,base,suffix1,suffix2 (skip empty) each `{part, meaning: ws.partMeanings[part]||''}`).
  - `matrixFor(morpheme, type, words) -> {prefixes:[str], suffixes:[str]}` — derived from WORD-STUDY words (surface forms, so real by construction; `valid-combos.json` uses base IDs and is NOT used here). For a base: distinct `morphemes.prefix` and `morphemes.suffix1` of words whose `morphemes.base===morpheme`. For a prefix (renderer puts base words in the `prefixes` field): distinct `morphemes.base` (→prefixes field) and `morphemes.suffix1` of words whose `morphemes.prefix===morpheme`. For a suffix (renderer puts base words in the `suffixes` field): distinct `morphemes.prefix` (→prefixes field) and `morphemes.base` (→suffixes field) of words whose `morphemes.suffix1===morpheme || morphemes.suffix2===morpheme`. Cap each list at 6.

- [ ] **Step 1: Write the failing test**
```js
// scripts/deck-accuracy/deck-data.test.js
const assert = require('assert');
const { wsToDeckWord, matrixFor } = require('./deck-data');
const ws = { word:'reconstruction',
  morphemes:{prefix:'re',base:'construct',suffix1:'ion',suffix2:''},
  partMeanings:{re:'again',construct:'build',ion:'act or result of'},
  syllables:['re','con','struc','tion'], phonemes:['r','e','c','o','n','s','t','r','u','c','ti','o','n'] };
const dw = wsToDeckWord(ws);
assert.strictEqual(dw.syllables, 're/con/struc/tion');
assert.deepStrictEqual(dw.morphemes, [{part:'re',meaning:'again'},{part:'construct',meaning:'build'},{part:'ion',meaning:'act or result of'}]);
assert.deepStrictEqual(dw.phonemes.slice(0,2), [{g:'r'},{g:'e'}]);
const words = [
  {word:'a', morphemes:{prefix:'re', base:'x', suffix1:'ion', suffix2:''}},
  {word:'b', morphemes:{prefix:'un', base:'x', suffix1:'',    suffix2:''}},
  {word:'c', morphemes:{prefix:'',   base:'x', suffix1:'ed',  suffix2:''}},
];
const mx = matrixFor('x','base',words);
assert.ok(mx.prefixes.includes('re') && mx.prefixes.includes('un'));
assert.ok(mx.suffixes.includes('ion') && mx.suffixes.includes('ed'));
console.log('deck-data.test OK');
```

- [ ] **Step 2: Run to verify it fails**
Run: `node scripts/deck-accuracy/deck-data.test.js` → FAIL (module not found).

- [ ] **Step 3: Implement**
```js
// scripts/deck-accuracy/deck-data.js
function wsToDeckWord(ws){
  const m = ws.morphemes || {};
  const parts = [m.prefix, m.base, m.suffix1, m.suffix2].filter(Boolean);
  return {
    word: ws.word,
    morphemes: parts.map(p => ({ part: p, meaning: (ws.partMeanings && ws.partMeanings[p]) || '' })),
    syllables: (ws.syllables||[]).join('/'),
    phonemes: (ws.phonemes||[]).map(g => ({ g })),
  };
}
function matrixFor(morpheme, type, words){
  const col = new Set(), col2 = new Set();  // col -> prefixes field, col2 -> suffixes field
  for (const w of words){
    const m = w.morphemes || {};
    if (type === 'base' && m.base === morpheme){ if (m.prefix) col.add(m.prefix); if (m.suffix1) col2.add(m.suffix1); }
    else if (type === 'prefix' && m.prefix === morpheme){ if (m.base) col.add(m.base); if (m.suffix1) col2.add(m.suffix1); }
    else if (type === 'suffix' && (m.suffix1 === morpheme || m.suffix2 === morpheme)){ if (m.prefix) col.add(m.prefix); if (m.base) col2.add(m.base); }
  }
  return { prefixes: [...col].slice(0,6), suffixes: [...col2].slice(0,6) };
}
module.exports = { wsToDeckWord, matrixFor };
```

- [ ] **Step 4: Run to verify it passes** → `deck-data.test OK`.
- [ ] **Step 5: Commit**
```bash
git add scripts/deck-accuracy/deck-data.js scripts/deck-accuracy/deck-data.test.js
git commit -m "feat(deck-accuracy): deck-data builder helpers (word shape + matrix, pure)"
```

---

## Task 2: buildDeckData assembler + validation gate

**Files:**
- Modify: `scripts/deck-accuracy/deck-data.js` (add `buildDeckData`, `validateDeckData`)
- Modify: `scripts/deck-accuracy/deck-data.test.js` (add assembler/gate tests)

**Interfaces:**
- Consumes: `wsToDeckWord`, `matrixFor`, `window.MORPHEMES` (from data.js — morpheme meaning/type), word-study words. (valid-combos.json is NOT needed — matrix comes from word-study surface forms.)
- Produces:
  - `buildDeckData(spec, ctx) -> DATA|null` where `spec={morpheme,type}` (surface form + 'base'|'prefix'|'suffix') and `ctx={words, morphemeMeaning}`. Selects focus words where the morpheme appears in the matching `morphemes` slot (base→`morphemes.base===morpheme`; prefix→`morphemes.prefix===morpheme`; suffix→`morphemes.suffix1===morpheme||morphemes.suffix2===morpheme`), dedupes into examples (up to 7) + day2 (2 words) + day3 (3 words) with NO overlap; each day sentence = the focus words' verified `sentences.correct` joined; definitions from `ws.meaning`; matrix from `matrixFor(morpheme,type,words)`; `meaning`/`origin`/`trueOrFalse`/`day1Sentences`/learning content templated from morpheme + partMeanings. Returns null if fewer than 3 distinct verified words exist for the morpheme.
  - `validateDeckData(data) -> {ok, errors:[str]}` — for each day word reconstruct `{word, syllables: str.split('/'), phonemes: g.map(x=>x.g)}` and require `invariants.checkSyllables(...).ok` and `invariants.checkPhonemes(...).ok`; require the day1/day2/day3 focus-word sets are pairwise disjoint (no repeats across the week); require `prefixes` and `suffixes` are non-empty. (Matrix entries are real by construction — they come from actual word-study words — so no valid-combos lookup is needed.)

- [ ] **Step 1: Write failing tests** (assemble a deck for a base with ≥5 word-study words; assert: examples/day2/day3 disjoint word sets; matrix non-empty; `validateDeckData(...).ok === true`; and a negative case where a hand-broken syllable split makes `.ok === false`). Full test code:
```js
const { buildDeckData, validateDeckData } = require('./deck-data');
global.window = {}; require('../../data.js');
const wsAll = (()=>{ global.window={}; require('../../word-study-data.js'); return window.WORD_STUDY_WORDS; })();
const ctx = { words: wsAll, morphemeMeaning: 'build' };
const data = buildDeckData({morpheme:'struct', type:'base'}, ctx);
const dayWords = new Set([...data.day2.words, ...data.day3.words].map(w=>w.word));
assert.strictEqual(dayWords.size, data.day2.words.length + data.day3.words.length); // no repeats across days
assert.ok(data.prefixes.length && data.suffixes.length);
assert.strictEqual(validateDeckData(data).ok, true);
const broken = JSON.parse(JSON.stringify(data)); broken.day2.words[0].syllables = 'zzz/zzz';
assert.strictEqual(validateDeckData(broken).ok, false);
console.log('assembler.test OK');
```
- [ ] **Step 2: Run → fails.**
- [ ] **Step 3: Implement `buildDeckData` + `validateDeckData`.** (Derive focus-word pool by scanning `ctx.words` for the morpheme in the matching `w.morphemes` slot; sort by stage then length; slice disjoint groups for examples/day2/day3; build each day's `words` via `wsToDeckWord` and its `sentence` by joining those words' `w.sentences.correct`; `validateDeckData` reuses `require('../word-study/invariants.js')` `checkSyllables`/`checkPhonemes` by reconstructing a `{word,syllables:str.split('/'),phonemes:g.map(x=>x.g)}` per day word, and checks the cross-day word-set disjointness + non-empty matrix.)
- [ ] **Step 4: Run → `assembler.test OK`.**
- [ ] **Step 5: Commit**
```bash
git add scripts/deck-accuracy/deck-data.js scripts/deck-accuracy/deck-data.test.js
git commit -m "feat(deck-accuracy): buildDeckData assembler + per-deck validation gate"
```

---

## Task 3: Batch runner — regenerate all decks (resumable)

**Files:**
- Create: `scripts/deck-accuracy/generate-decks-v2.js`
- Create (generated): `scripts/deck-accuracy/state-decks.json`

**Interfaces:**
- Consumes: `buildDeckData`/`validateDeckData`, the morpheme list extracted from `generate-all-decks.js` (its `ALL_MORPHEMES` — do NOT `require` that file: requiring runs its `main()` which needs `ANTHROPIC_API_KEY`. Instead read the file text and regex out every `{ morpheme: "X", type: "Y" }` entry, defaulting type to `"base"` when absent), `require('../../wordlabs-deck-generator').buildDeck`.
- Produces: CLI `node scripts/deck-accuracy/generate-decks-v2.js --batch=20` — builds/validates/writes up to 20 pending decks to `output/`, records state, prints `{generated, failed, remaining}`.

- [ ] **Step 1: Implement the runner** — extract ALL_MORPHEMES by regex from generate-all-decks.js text:
```js
const src = require('fs').readFileSync(require('path').join(__dirname,'../../generate-all-decks.js'),'utf8');
const listBody = src.slice(src.indexOf('ALL_MORPHEMES'), src.indexOf('\n]', src.indexOf('ALL_MORPHEMES')));
const ALL = [...listBody.matchAll(/morpheme:\s*"([^"]+)"(?:\s*,\s*type:\s*"([^"]+)")?/g)].map(m=>({morpheme:m[1], type:m[2]||'base'}));
```
Load words/MORPHEMES once. For each pending morpheme in the batch: `const data = buildDeckData({morpheme,type}, {words, morphemeMeaning})` (morphemeMeaning from `window.MORPHEMES`); if null → state `FAILED:insufficient-words`; else `const v = validateDeckData(data)`; if `!v.ok` → state `FAILED:`+v.errors[0]; else `buildDeck(data, 'output/'+filename(morpheme,type))` and state `generated`. Filename mirrors `generate-all-decks.js` convention (`wordlabs-<morpheme><-prefix|-suffix|>-3day.pptx`). Save `state-decks.json`; print counts.
- [ ] **Step 2: Dry-run 3 decks + open-check**
```bash
node scripts/deck-accuracy/generate-decks-v2.js --batch=3
node -e "const z=require('adm-zip'); const p=require('fs').readdirSync('output').find(f=>f.endsWith('-3day.pptx')); console.log('sample:',p); new z('output/'+p).getEntries().length && console.log('pptx opens OK');" 2>/dev/null || echo "(spot-open decks manually)"
```
Expected: `{generated:3,...}`; a regenerated deck opens as a valid pptx (zip).
- [ ] **Step 3: Commit runner + first batch**
```bash
git add scripts/deck-accuracy/generate-decks-v2.js scripts/deck-accuracy/state-decks.json output/
git commit -m "feat(deck-accuracy): deterministic deck batch runner; first 3 decks regenerated"
```

---

## Task 4: Generate all decks + reconcile failures

**Files:** `output/*.pptx`, `scripts/deck-accuracy/state-decks.json`, checkpoint.

- [ ] **Step 1: Loop to completion**
```bash
node scripts/deck-accuracy/generate-decks-v2.js --batch=20   # repeat until remaining=0, commit each batch
```
- [ ] **Step 2: Triage failures.** For every `FAILED:*` in `state-decks.json`: `insufficient-words` = morphemes with <3 verified words (record in checkpoint as decks intentionally not regenerated — keep the old deck or drop from teacher-resources listing); any gate failure = investigate (should be rare given Phase 1). Record the final list.
- [ ] **Step 3: Verify no repeats / real matrices across a 10-deck sample** with a scripted check (load each generated DATA via buildDeckData, re-run validateDeckData → all ok).
- [ ] **Step 4: Update `output/needs-regen.txt`** (clear regenerated entries) and the checkpoint (Phase 2 complete, list any skipped morphemes). Commit.

---

## Task 5: Teacher-resources reconciliation

**Files:** Modify `teacher-resources.html` only if the deck count/list changed.

- [ ] **Step 1:** If any morphemes were skipped (insufficient words), ensure `teacher-resources.html` doesn't link a now-missing deck (it lists decks in `TEACHING_DECKS`). Remove or hide entries with no file. Verify zero 404s: every `TEACHING_DECKS` entry has a matching `output/*.pptx`.
- [ ] **Step 2: Commit** any listing fix.

---

## Self-Review Notes
- **Spec coverage:** verified words/splits/morphemes/definitions → Task 1-2 (from word-study). Real matrices → `matrixFor` (Task 1) + gate (Task 2). No repeats → disjoint day pools + gate (Task 2). Hard gate, no-emit-on-fail → Task 2 gate + Task 3 runner. Regenerate all + document exceptions → Task 4. Renderer untouched → only `DATA` production changes.
- **Zero AI:** the whole pipeline is deterministic; even sentences come from word-study's verified `sentences.correct`. (If richer multi-word dictation sentences are wanted later, that is an additive fable step — out of scope here to keep token cost at zero.)
- **Resumability:** `state-decks.json` + per-batch commits, mirroring Phase 1.
