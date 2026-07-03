# Word Study Full-Pool Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate full six-stage Word Study data for all 3,687 Morpheme-Builder-make-able words, gated by automated invariants, so every buildable word is studyable.

**Architecture:** A Node prep script builds a manifest (word + morphemes + part-meanings + stage + any reuse-first splits) from `valid-combos.json` + `data.js` + the existing syllable/phoneme pools. An in-session Workflow fans ~30-word batches to agents that author meaning/sentences/synonym/phonemes and fetch syllable divisions from howmanysyllables.com, returning schema-validated JSON. A Node assembler re-checks every entry against shared invariants, writes `word-study-data.js` (shipped) + `word-study-rejects.json` (failures). Only `word-study.html` loads the data; `morpheme-builder.html` drops the dependency.

**Tech Stack:** Vanilla JS, Node (no deps beyond built-ins), the Workflow tool for generation, WebFetch for howmanysyllables.com, Playwright MCP for live grading.

## Global Constraints

- No build system, no npm deps — plain Node built-ins and vanilla browser JS only.
- Entry shape (unchanged from v1, plus `partMeanings` and new `syllablesSource`): `{ word, stage, morphemes:{prefix,base,suffix1,suffix2}, syllables:[], phonemes:[], meaning, meaningDistractors:[2], sentences:{correct, wrong:[2]}, synonym, synonymDistractors:[2], partMeanings:{}, syllablesSource:"hms"|"pool"|"agent" }`.
- Empty morpheme slots are `""` (not null) — matches existing v1 data (`"suffix2":""`).
- Stage order (least→most advanced): `["s2e","s2l","s3e","s3l","s4"]`. A word's `stage` = the most-advanced stage among its non-empty morphemes.
- Phoneme grapheme model: graphemes concatenate to the spelling; split-digraph magic-e is encoded `"a_e"` (vowel + `_e`); the letter multiset of `phonemes.join('').replace(/_/g,'')` must equal the word's letters. (Verbatim from `word-study-harness.html`.)
- Syllable authority: fetch `https://www.howmanysyllables.com/syllables/<word>` for every 2+ syllable word; site division wins; on failure fall back to agent split + set `syllablesSource:"agent"` and reject-list-flag it. 1-syllable words: `syllables:[word]`, `syllablesSource:"agent"` (no fetch).
- No runtime AI in the shipped app — all generation is offline/at-build; the app only reads the static file + Supabase `word_corrections` overrides.
- Branch `feat/word-study`, commit per task, local-only (do NOT push — main auto-deploys).
- Reject-list, never silently drop: any word failing a hard invariant goes to `word-study-rejects.json`.

---

### Task 1: Shared invariants module (TDD)

Extract the canonical invariants from `tests/manual/word-study-harness.html` (lines 34–90) into a Node module the assembler and any re-check share, so they agree by construction.

**Files:**
- Create: `scripts/word-study/invariants.js`
- Test: `scripts/word-study/invariants.test.js`

**Interfaces:**
- Produces: `validateEntry(entry) -> { ok:boolean, fails:string[] }`, plus named checks `checkMorphemes`, `checkSyllables`, `checkPhonemes`, `checkMeaning`, `checkSentences`, `checkSynonym` each `-> {ok, msg}`. Module works in Node (`module.exports`) AND browser (`window.WSInvariants`).

- [ ] **Step 1: Write the failing test**

```js
// scripts/word-study/invariants.test.js
const assert = require('assert');
const V = require('./invariants');

const good = {
  word:"unhelpful", stage:"s2e",
  morphemes:{prefix:"un",base:"help",suffix1:"ful",suffix2:""},
  syllables:["un","help","ful"],
  phonemes:["u","n","h","e","l","p","f","u","l"],
  meaning:"not giving help", meaningDistractors:["full of help","helping a lot"],
  sentences:{correct:"The unhelpful map got us lost.", wrong:["She was unhelpful and fixed it fast.","Thanks for being so unhelpful and kind."]},
  synonym:"useless", synonymDistractors:["helpful","kind"],
  partMeanings:{un:"not",help:"to help",ful:"full of"},
  syllablesSource:"agent"
};
// magic-e word: rejoin via letter-multiset, not string concat
const magicE = Object.assign({}, good, {
  word:"rewrite", morphemes:{prefix:"re",base:"write",suffix1:"",suffix2:""},
  syllables:["re","write"], phonemes:["r","e","wr","i_e","t"],
  meaning:"to write again", meaningDistractors:["to read","to erase"],
  sentences:{correct:"Please rewrite the messy note.", wrong:["Rewrite this apple.","The dog will rewrite loudly."]},
  synonym:"redo", synonymDistractors:["erase","read"],
  partMeanings:{re:"again or back",write:"to write"}
});

assert.deepStrictEqual(V.validateEntry(good), {ok:true, fails:[]});
assert.deepStrictEqual(V.validateEntry(magicE), {ok:true, fails:[]});

// bad: syllables don't rejoin
const badSyl = Object.assign({}, good, {syllables:["un","helped"]});
assert.strictEqual(V.validateEntry(badSyl).ok, false);
assert.ok(V.validateEntry(badSyl).fails.some(f=>/syll/i.test(f)));

// bad: phoneme letter-multiset mismatch
const badPho = Object.assign({}, good, {phonemes:["u","n","h","e","l","p","f","u"]}); // missing final l
assert.strictEqual(V.validateEntry(badPho).ok, false);

// bad: synonym equals a distractor
const badSyn = Object.assign({}, good, {synonymDistractors:["useless","kind"]});
assert.strictEqual(V.validateEntry(badSyn).ok, false);

// bad: a wrong sentence doesn't contain the word
const badSent = Object.assign({}, good, {sentences:{correct:"The unhelpful map got us lost.", wrong:["No target word here.","Also missing it."]}});
assert.strictEqual(V.validateEntry(badSent).ok, false);

console.log("invariants.test OK");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/word-study/invariants.test.js`
Expected: FAIL with "Cannot find module './invariants'".

- [ ] **Step 3: Write the module**

```js
// scripts/word-study/invariants.js
(function(root){
  var VOWELS = ['a','e','i','o','u'];
  function multiset(s){ return s.toLowerCase().split('').sort().join(''); }

  function checkMorphemes(w){
    var ids = ['prefix','base','suffix1','suffix2']
      .map(function(k){ return w.morphemes[k]; }).filter(Boolean);
    var missing = ids.filter(function(id){ return !w.partMeanings || !w.partMeanings[id]; });
    if(missing.length) return {ok:false, msg:'partMeanings missing: '+missing.join(',')};
    return {ok:true, msg:ids.join('·')};
  }
  function checkSyllables(w){
    if(!Array.isArray(w.syllables) || !w.syllables.length) return {ok:false,msg:'no syllables'};
    if(w.syllables.join('') !== w.word) return {ok:false,msg:'join="'+w.syllables.join('')+'" ≠ word'};
    var noVowel = w.syllables.filter(function(s){ return !/[aeiouy]/i.test(s); });
    if(noVowel.length) return {ok:false,msg:'syllable without vowel: '+noVowel.join(',')};
    return {ok:true, msg:w.syllables.join('·')};
  }
  function checkPhonemes(w){
    if(!Array.isArray(w.phonemes) || !w.phonemes.length) return {ok:false,msg:'no phonemes'};
    var hasMagic = w.phonemes.some(function(p){ return /_e$/.test(p); });
    if(!hasMagic && w.phonemes.join('') !== w.word) return {ok:false,msg:'join="'+w.phonemes.join('')+'" ≠ word'};
    var flat = w.phonemes.join('').replace(/_/g,'');
    if(multiset(flat) !== multiset(w.word)) return {ok:false,msg:'letter multiset ≠ word'};
    var badMagic = w.phonemes.filter(function(p){ return /_e$/.test(p) && VOWELS.indexOf(p[0])===-1; });
    if(badMagic.length) return {ok:false,msg:'magic-e not on vowel: '+badMagic.join(',')};
    return {ok:true, msg:w.phonemes.join('·')};
  }
  function checkMeaning(w){
    if(!w.meaning || !Array.isArray(w.meaningDistractors) || w.meaningDistractors.length!==2) return {ok:false,msg:'meaning/distractors shape'};
    if(w.meaningDistractors.indexOf(w.meaning)!==-1) return {ok:false,msg:'meaning == a distractor'};
    return {ok:true,msg:'ok'};
  }
  function checkSentences(w){
    var s = w.sentences||{};
    if(!s.correct || !Array.isArray(s.wrong) || s.wrong.length!==2) return {ok:false,msg:'sentence shape'};
    var all = [s.correct].concat(s.wrong);
    var re = new RegExp('\\b'+w.word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
    var missing = all.filter(function(t){ return !re.test(t); });
    if(missing.length) return {ok:false,msg:'sentence missing the word'};
    return {ok:true,msg:'ok'};
  }
  function checkSynonym(w){
    if(!w.synonym || !Array.isArray(w.synonymDistractors) || w.synonymDistractors.length!==2) return {ok:false,msg:'synonym shape'};
    if(w.synonymDistractors.indexOf(w.synonym)!==-1) return {ok:false,msg:'synonym == a distractor'};
    return {ok:true,msg:'ok'};
  }
  function validateEntry(w){
    var fails = [];
    [['morphemes',checkMorphemes],['syllables',checkSyllables],['phonemes',checkPhonemes],
     ['meaning',checkMeaning],['sentences',checkSentences],['synonym',checkSynonym]]
      .forEach(function(pair){ var r=pair[1](w); if(!r.ok) fails.push(pair[0]+': '+r.msg); });
    return {ok:fails.length===0, fails:fails};
  }
  var api = {validateEntry:validateEntry, checkMorphemes:checkMorphemes, checkSyllables:checkSyllables,
    checkPhonemes:checkPhonemes, checkMeaning:checkMeaning, checkSentences:checkSentences, checkSynonym:checkSynonym};
  if(typeof module!=='undefined' && module.exports) module.exports = api;
  if(root) root.WSInvariants = api;
})(typeof window!=='undefined'?window:null);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/word-study/invariants.test.js`
Expected: `invariants.test OK`

- [ ] **Step 5: Commit**

```bash
git add scripts/word-study/invariants.js scripts/word-study/invariants.test.js
git commit -m "feat(word-study): shared invariants module for full-pool generation"
```

---

### Task 2: Manifest builder (the agent work-list)

**Files:**
- Create: `scripts/word-study/build-manifest.js`
- Output (generated, git-ignored): `scripts/word-study/manifest.json`
- Modify: `.gitignore` (add `scripts/word-study/manifest.json`, `scripts/word-study/raw-generated.json`, `word-study-rejects.json`)

**Interfaces:**
- Produces `manifest.json`: `[{ word, stage, morphemes:{prefix,base,suffix1,suffix2}, partMeanings:{}, reuse:{ syllables?:[], phonemes?:[] } }]`, one per unique make-able word.

- [ ] **Step 1: Write the builder**

```js
// scripts/word-study/build-manifest.js
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../');
const R = f => path.join(ROOT, f);

// 1. morpheme id -> meaning, from data.js (needs a window shim)
global.window = {};
require(R('data.js'));
const M = global.window.MORPHEMES; // { prefixes:[], suffixes:[], bases:[] }
const MEANING = {};
const STAGE = {};
['prefixes','suffixes','bases'].forEach(group => (M[group]||[]).forEach(m => {
  MEANING[m.id] = m.meaning; STAGE[m.id] = m.stage;
}));

// 2. extract inline WORDS arrays from the game pages (trusted local code)
function extractArray(file, name){
  const s = fs.readFileSync(R(file),'utf8');
  const i = s.indexOf('const '+name+' = [');
  const start = s.indexOf('[', i);
  let d=0,j=start;
  for(; j<s.length; j++){ if(s[j]==='[')d++; else if(s[j]===']'){ d--; if(d===0){ j++; break; } } }
  return Function('return '+s.slice(start,j))();
}
const sylPool = {}; extractArray('syllable-mode.html','WORDS').forEach(w=>{ if(w.word&&w.syllables) sylPool[w.word]=w.syllables; });
const phoPool = {}; extractArray('phoneme-mode.html','WORDS').forEach(w=>{ if(w.word&&w.phonemes) phoPool[w.word]=w.phonemes; });

// 3. unique make-able words + their morpheme decomposition from valid-combos.json
const vc = require(R('valid-combos.json'));
const byWord = {};
(function walk(o){
  if(Array.isArray(o)) return o.forEach(walk);
  if(o && typeof o==='object'){
    if(o.word && !byWord[o.word]) byWord[o.word] = { prefix:o.p||'', base:o.b||'', suffix1:o.s1||'', suffix2:o.s2||'' };
    Object.values(o).forEach(walk);
  }
})(vc);

const STAGE_ORDER = ['s2e','s2l','s3e','s3l','s4'];
function wordStage(morphemes){
  const stages = ['prefix','base','suffix1','suffix2']
    .map(k=>morphemes[k]).filter(Boolean).map(id=>STAGE[id]).filter(Boolean);
  if(!stages.length) return 's2e';
  return stages.sort((a,b)=>STAGE_ORDER.indexOf(b)-STAGE_ORDER.indexOf(a))[0];
}

const manifest = Object.keys(byWord).sort().map(word => {
  const morphemes = byWord[word];
  const partMeanings = {};
  ['prefix','base','suffix1','suffix2'].forEach(k=>{
    const id = morphemes[k];
    if(id) partMeanings[id] = MEANING[id] || ('('+id+')'); // fallback marker, flagged later
  });
  const reuse = {};
  if(sylPool[word]) reuse.syllables = sylPool[word];
  if(phoPool[word]) reuse.phonemes = phoPool[word];
  return { word, stage: wordStage(morphemes), morphemes, partMeanings, reuse };
});

fs.writeFileSync(R('scripts/word-study/manifest.json'), JSON.stringify(manifest));
const missingMeaning = manifest.filter(m=>Object.values(m.partMeanings).some(v=>/^\(.*\)$/.test(v)));
console.log('manifest words:', manifest.length);
console.log('reuse syllables:', manifest.filter(m=>m.reuse.syllables).length, '| reuse phonemes:', manifest.filter(m=>m.reuse.phonemes).length);
console.log('words with an unresolved morpheme meaning:', missingMeaning.length, missingMeaning.slice(0,10).map(m=>m.word));
```

- [ ] **Step 2: Add generated artifacts to .gitignore**

Append to `.gitignore`:
```
scripts/word-study/manifest.json
scripts/word-study/raw-generated.json
word-study-rejects.json
```

- [ ] **Step 3: Run it and sanity-check output**

Run: `node scripts/word-study/build-manifest.js`
Expected: `manifest words: 3687`, reuse counts ~34/~39, and the unresolved-meaning list is empty or a short known set (if non-empty, note which morpheme ids are missing from `data.js` — they must be fixed there before generation, since part-meanings are stage 1).

- [ ] **Step 4: Commit (script only; manifest.json is git-ignored)**

```bash
git add scripts/word-study/build-manifest.js .gitignore
git commit -m "feat(word-study): manifest builder from valid-combos + data.js + reuse pools"
```

---

### Task 3: Generation workflow + assembler (run in-session)

This is the generative core. It runs the Workflow tool (in-session, Nick opted in) and then assembles.

**Files:**
- Create: `scripts/word-study/generate.workflow.js` (the workflow script, invoked via the Workflow tool)
- Create: `scripts/word-study/assemble.js`
- Create (generated): `word-study-rejects.json`
- Overwrite: `word-study-data.js`

**Interfaces:**
- Each agent returns `{ entries: [ { word, syllables, phonemes, meaning, meaningDistractors:[2], sentences:{correct,wrong:[2]}, synonym, synonymDistractors:[2], syllablesSource } ] }` (morphemes/partMeanings/stage come from the manifest, re-merged at assembly).

- [ ] **Step 1: Author the workflow script**

Write `scripts/word-study/generate.workflow.js`. It receives the manifest via `args`, batches it ~30/agent, and each agent gets an explicit prompt. Key prompt requirements per agent (embed verbatim):
  - "For each word, author British/Australian-English child-friendly (ages 9–12) data."
  - Meaning + exactly 2 plausible-but-wrong `meaningDistractors`.
  - `sentences.correct` uses the word correctly; `sentences.wrong` = exactly 2 sentences that CONTAIN the word but use it incorrectly (wrong meaning/part of speech). All three must contain the word.
  - `synonym` (single best word) + exactly 2 `synonymDistractors` that are NOT synonyms.
  - Phonemes in the grapheme model: graphemes concatenate to the spelling; split-digraph magic-e as `"a_e"`. If the word has no reuse phoneme, generate it; the letter multiset must equal the word.
  - Syllables: if `reuse.syllables` present, use it and set `syllablesSource:"pool"`. Else if the word is 1 syllable, `syllables:[word]`, `syllablesSource:"agent"`. Else WebFetch `https://www.howmanysyllables.com/syllables/<word>`, take the hyphenated division exactly, set `syllablesSource:"hms"`; on any fetch failure, syllabify yourself and set `syllablesSource:"agent"`.
  - Return strictly via the provided JSON schema (enforced by the `schema` option).

Skeleton (fill the schema + prompt inline; keep phases named for progress):

```js
export const meta = {
  name: 'word-study-generate',
  description: 'Author + syllable-verify full six-stage Word Study data for all make-able words',
  phases: [{ title: 'Generate' }],
}
const BATCH = 30;
const items = args; // the manifest array, passed in via Workflow args
const batches = [];
for(let i=0;i<items.length;i+=BATCH) batches.push(items.slice(i,i+BATCH));
const SCHEMA = { /* JSON Schema: { entries: [ {word, syllables[], phonemes[], meaning, meaningDistractors[2], sentences{correct,wrong[2]}, synonym, synonymDistractors[2], syllablesSource enum} ] } */ };
const results = await parallel(batches.map((b,idx)=> ()=>
  agent(
    'Author Word Study data for these words. Rules:\n'+
    '<all the verbatim rules above>\n\n'+
    'Words (JSON): '+JSON.stringify(b.map(w=>({word:w.word, stage:w.stage, reuse:w.reuse})))+
    '\nReturn ONLY the schema object.',
    { label:'gen:'+idx, phase:'Generate', schema: SCHEMA }
  )
));
return results.filter(Boolean).flatMap(r=>r.entries);
```

- [ ] **Step 2: Run the workflow (main loop, via the Workflow tool)**

Invoke `Workflow({ scriptPath:'scripts/word-study/generate.workflow.js', args:<manifest JSON array> })`. Read `scripts/word-study/manifest.json` first and pass its parsed contents as `args`. When it completes, persist the flattened return to `scripts/word-study/raw-generated.json` (Write the tool's returned array). If the run is interrupted, resume with `resumeFromRunId` (unchanged batches return cached).

- [ ] **Step 3: Write the assembler**

```js
// scripts/word-study/assemble.js
const fs=require('fs'), path=require('path');
const ROOT=path.resolve(__dirname,'../../'), R=f=>path.join(ROOT,f);
const V=require('./invariants');
const manifest=JSON.parse(fs.readFileSync(R('scripts/word-study/manifest.json'),'utf8'));
const raw=JSON.parse(fs.readFileSync(R('scripts/word-study/raw-generated.json'),'utf8'));
const genByWord={}; raw.forEach(e=>{ genByWord[e.word]=e; });

const shipped=[], rejects=[];
manifest.forEach(m=>{
  const g=genByWord[m.word];
  if(!g){ rejects.push({word:m.word, reason:'no generated entry'}); return; }
  const entry={
    word:m.word, stage:m.stage, morphemes:m.morphemes,
    syllables: (m.reuse&&m.reuse.syllables) || g.syllables,
    phonemes:  (m.reuse&&m.reuse.phonemes)  || g.phonemes,
    meaning:g.meaning, meaningDistractors:g.meaningDistractors,
    sentences:g.sentences, synonym:g.synonym, synonymDistractors:g.synonymDistractors,
    partMeanings:m.partMeanings,
    syllablesSource: (m.reuse&&m.reuse.syllables) ? 'pool' : (g.syllablesSource||'agent'),
  };
  const v=V.validateEntry(entry);
  if(v.ok) shipped.push(entry);
  else rejects.push({word:m.word, reason:v.fails.join(' | ')});
});

// stable output: sorted by word
shipped.sort((a,b)=>a.word<b.word?-1:1);
const header='// ═══ WORD STUDY — full make-able-word pool (v2) — see docs/superpowers/specs/2026-07-03-word-study-full-pool-design.md\n'+
  '// Auto-generated: '+shipped.length+' words. Invariant-verified. Fixes flow via content-editor (word_corrections).\n'+
  'window.WORD_STUDY_WORDS = [\n';
const body=shipped.map(e=>'  '+JSON.stringify(e)).join(',\n');
fs.writeFileSync(R('word-study-data.js'), header+body+'\n];\n');
fs.writeFileSync(R('word-study-rejects.json'), JSON.stringify(rejects,null,2));

const unverified=shipped.filter(e=>e.syllablesSource==='agent'&&e.syllables.length>1).length;
console.log('shipped:',shipped.length,'| rejects:',rejects.length,'| syllables:unverified(multi):',unverified);
```

- [ ] **Step 4: Run the assembler**

Run: `node scripts/word-study/assemble.js`
Expected: `shipped: <N> | rejects: <M> | ...`, with N close to 3,687. Review `word-study-rejects.json`; re-run the workflow (`resumeFromRunId`) or hand-fix specific words if rejects are more than a small tail.

- [ ] **Step 5: Verify the shipped file loads and self-checks in Node**

Run:
```bash
node -e 'global.window={};require("/workspaces/morphology-builder/word-study-data.js");const V=require("/workspaces/morphology-builder/scripts/word-study/invariants.js");const w=window.WORD_STUDY_WORDS;const bad=w.filter(e=>!V.validateEntry(e).ok);console.log("total",w.length,"invariant-fail",bad.length);'
```
Expected: `total <N> invariant-fail 0` (shipped set is 100% green by construction).

- [ ] **Step 6: Commit**

```bash
git add scripts/word-study/generate.workflow.js scripts/word-study/assemble.js word-study-data.js
git commit -m "feat(word-study): generate + assemble full make-able-word pool (invariant-gated)"
```

---

### Task 4: Extend the harness to the full shipped set

**Files:**
- Modify: `tests/manual/word-study-harness.html`

- [ ] **Step 1: Point the harness at the shipped file and assert 100% green**

Ensure the harness loads `../../word-study-data.js` and runs its existing `check*` functions over every entry in `window.WORD_STUDY_WORDS` (not a 40-word slice). Add a summary line: `PASS N/N` and turn the page heading red if any fail.

- [ ] **Step 2: Open the harness and confirm**

Run: `python3 -m http.server 8080 --bind 0.0.0.0` (from repo root), then load `http://localhost:8080/tests/manual/word-study-harness.html`.
Expected: `PASS N/N` (N = shipped count), zero red rows. (This is a second, independent invariant implementation cross-checking the assembler — belt and braces.)

- [ ] **Step 3: Commit**

```bash
git add tests/manual/word-study-harness.html
git commit -m "test(word-study): harness validates the full shipped pool"
```

---

### Task 5: Morpheme Builder drops the dependency; 🔬 shown for any buildable word

**Files:**
- Modify: `morpheme-builder.html`

- [ ] **Step 1: Remove the `word-study-data.js` script tag**

Delete the `<script ... src="word-study-data.js">` include from `morpheme-builder.html`.

- [ ] **Step 2: Make the 🔬 handoff unconditional for a valid built word**

Find where the "🔬 Study this word" action is gated on pool membership (a lookup into `WORD_STUDY_WORDS`). Replace that condition with the existing "is this a valid built word" check the Builder already computes (the same signal that makes a built word count as real). The handoff still links to `word-study.html?word=<word>`. Since the pool = all make-able words, every valid built word is studyable.

- [ ] **Step 3: Verify in the browser**

With the http.server running, load `http://localhost:8080/morpheme-builder.html`, build a word that was NOT in the old 40 (e.g. `darkness` → `dark`+`ness`, or `disagreements`), and confirm the 🔬 action appears and opens `word-study.html` on that word. Confirm no console error about `WORD_STUDY_WORDS` being undefined.

- [ ] **Step 4: Commit**

```bash
git add morpheme-builder.html
git commit -m "feat(word-study): Builder always offers Study for buildable words; drop data dependency"
```

---

### Task 6: Live grading spot-check + docs

**Files:**
- Modify: `docs/superpowers/specs/2026-07-03-word-study-design.md` (note v2 supersedes the pool-size line)
- Modify: `CLAUDE.md` (add a Phase note), memory `project_word_study.md`

- [ ] **Step 1: Playwright live-grade a sample across pattern types**

Using the Playwright MCP against the local server, load `word-study.html?word=<w>` for a sample covering: magic-e (`rewrite`), digraph (`teacher`), doubling (`running`), 4-syllable (`disagreement`), and 2 newly-generated words not in v1. For each, drive all six stages: correct answer advances, a wrong answer does not, zero console errors. Record pass/fail.

- [ ] **Step 2: Update the v1 spec pointer**

In `docs/superpowers/specs/2026-07-03-word-study-design.md`, add a top note: `> SUPERSEDED (pool size) by 2026-07-03-word-study-full-pool-design.md — the deep-dive now spans all make-able words.`

- [ ] **Step 3: Update CLAUDE.md + memory**

Add a Phase entry summarising: full pool generated (N words), invariant-gated, howmanysyllables.com syllable authority, Builder handoff unconditional, rejects tracked in `word-study-rejects.json`, `<count>` flagged `syllables:unverified`. Update `project_word_study.md` memory to note v2 shipped to `feat/word-study` local-only.

- [ ] **Step 4: Commit**

```bash
git add docs/ CLAUDE.md
git commit -m "docs(word-study): record full-pool v2 generation + supersede v1 pool size"
```

---

## Self-Review

**Spec coverage:** scope (all 3,687) → Tasks 2–3; quality gate/invariants → Tasks 1,3,4; reuse-first → Task 2; syllable authority (fetch every multi-syllable) → Task 3 prompt; one static file + Builder drops dep → Tasks 3,5; dashboard untouched → (no task needed, confirmed); fix-in-place via content-editor → unchanged existing machinery (noted, no task); harness over full set → Task 4; verification → Tasks 4,6. All covered.

**Placeholder scan:** the workflow SCHEMA and agent prompt in Task 3 Step 1 are described as "fill inline" — that is genuine authored content the implementer writes at run time from the listed verbatim rules, not a hidden requirement; every rule it must encode is enumerated. No other placeholders.

**Type consistency:** `validateEntry -> {ok,fails}` used identically in Tasks 1,3,5. Entry shape identical across manifest merge (Task 3) and invariants (Task 1). `syllablesSource` values `pool|hms|agent` consistent across Tasks 2,3. Empty slots `""` consistent with Global Constraints and v1 data.
