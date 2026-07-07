# Teaching Deck Accuracy — Phase 1 (Harden Split Data) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every syllable and grapheme-phoneme split in `word-study-data.js` provably correct — syllables authority-backed by howmanysyllables.com, phonemes QA-checked — so Phase 2 deck generation can derive perfect decks from it.

**Architecture:** Phase 1a is a deterministic HTTP scraper (no LLM) that re-verifies the 1,187 `agent`-sourced syllable splits against howmanysyllables.com. Phase 1b is a deterministic linter that flags suspicious grapheme-phoneme splits, then a fable 5 workflow re-derives only the flagged ones. All writes are gated by the existing `scripts/word-study/invariants.js` and happen in small committed batches with a checkpoint file.

**Tech Stack:** Node.js (no deps beyond `https`), the existing `scripts/word-study/invariants.js` and `taught-graphemes.json`, the Workflow tool with `model: 'fable'` for phoneme QA, Playwright not required.

## Global Constraints

- **Resumability first (usage limits):** every batch commits its data change + updates `docs/superpowers/notes/2026-07-07-deck-accuracy-progress.md` in the same commit. Scripts are idempotent — re-running skips work already recorded in the state file.
- **Batch sizes:** 50 words per batch for the syllable scraper; ≤40 words per fable batch for phoneme QA.
- **No silent changes:** a split is only overwritten if the new one passes `invariants` join-back (de-split === word). Failures are left as-is and recorded as exceptions in the state file, never silently kept as "verified".
- **Politeness:** ≥1200 ms delay between howmanysyllables.com requests.
- **`word-study-data.js` format:** header comment lines 1–2, `window.WORD_STUDY_WORDS = [`, then **one JSON object per line**, then `];`. Preserve this exactly (line-oriented edits, compact JSON, `ensure_ascii=false` equivalent). `phonemes` is an **array of grapheme strings** (e.g. `["a","b","u_e","s","d"]`); `syllables` is an **array of strings** (e.g. `["re","con","struc","tion"]`); `syllablesSource` is `"hms" | "agent" | "pool"`.
- **Australian English** throughout.

---

## File Structure

- `scripts/deck-accuracy/hms.js` — pure helpers: parse howmanysyllables HTML → division; validate join-back. (new)
- `scripts/deck-accuracy/hms.test.js` — unit tests for the pure helpers. (new)
- `scripts/deck-accuracy/fetch-hms-syllables.js` — batched scraper runner; reads/writes `word-study-data.js`, maintains state. (new)
- `scripts/deck-accuracy/state-syllables.json` — `{ "<word>": "hms" | "no-hms-entry" | "trivial-1syl" }`. (generated, committed)
- `scripts/deck-accuracy/phoneme-lint.js` — pure: flag suspicious grapheme splits using `taught-graphemes.json`. (new)
- `scripts/deck-accuracy/phoneme-lint.test.js` — unit tests. (new)
- `scripts/deck-accuracy/flagged-phonemes.json` — output of the linter (words needing fable QA). (generated, committed)
- `scripts/deck-accuracy/phoneme-qa.workflow.js` — fable 5 Workflow script; re-derives flagged phoneme splits. (new)
- `scripts/deck-accuracy/apply-phoneme-qa.js` — merges workflow output into `word-study-data.js` under the invariants gate. (new)
- `docs/superpowers/notes/2026-07-07-deck-accuracy-progress.md` — human checkpoint. (new)
- Modified: `word-study-data.js` (syllable + phoneme corrections only).

---

## Task 1: Syllable HTML parser (pure, TDD)

**Files:**
- Create: `scripts/deck-accuracy/hms.js`
- Test: `scripts/deck-accuracy/hms.test.js`

**Interfaces:**
- Produces: `parseDivisions(html) -> string[]` (all `Answer_Red` span contents, lowercased, trimmed); `pickDivision(html, word) -> string[] | null` (the division whose de-hyphenated form equals `word`, as an array of syllable strings, else `null`).

- [ ] **Step 1: Write the failing test**
```js
// scripts/deck-accuracy/hms.test.js
const assert = require('assert');
const { parseDivisions, pickDivision } = require('./hms');
const html = '<span class="Answer_Red" data-nosnippet>re-con-struc-tion</span> junk ' +
             '<span class="Answer_Red" data-nosnippet>ree-kun-struhk-shun</span>';
assert.deepStrictEqual(parseDivisions(html), ['re-con-struc-tion','ree-kun-struhk-shun']);
assert.deepStrictEqual(pickDivision(html, 'reconstruction'), ['re','con','struc','tion']);
assert.strictEqual(pickDivision(html, 'nothere'), null);            // no division joins to the word
assert.strictEqual(pickDivision('<p>no spans</p>', 'x'), null);
console.log('hms.test OK');
```

- [ ] **Step 2: Run to verify it fails**

Run: `node scripts/deck-accuracy/hms.test.js`
Expected: FAIL — `Cannot find module './hms'`.

- [ ] **Step 3: Implement**
```js
// scripts/deck-accuracy/hms.js
function parseDivisions(html) {
  const out = [];
  const re = /class="Answer_Red"[^>]*>([^<]+)</g;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1].trim().toLowerCase());
  return out;
}
// Return the division (array of syllables) whose letters, de-hyphenated, equal `word`.
function pickDivision(html, word) {
  const target = String(word).toLowerCase();
  for (const d of parseDivisions(html)) {
    if (!/^[a-z]+(-[a-z]+)*$/.test(d)) continue;
    if (d.replace(/-/g, '') === target) return d.split('-');
  }
  return null;
}
module.exports = { parseDivisions, pickDivision };
```

- [ ] **Step 4: Run to verify it passes**

Run: `node scripts/deck-accuracy/hms.test.js`
Expected: `hms.test OK`.

- [ ] **Step 5: Commit**
```bash
git add scripts/deck-accuracy/hms.js scripts/deck-accuracy/hms.test.js
git commit -m "feat(deck-accuracy): howmanysyllables HTML parser (pure, tested)"
```

---

## Task 2: Batched syllable scraper runner

**Files:**
- Create: `scripts/deck-accuracy/fetch-hms-syllables.js`
- Create (generated): `scripts/deck-accuracy/state-syllables.json`
- Create: `docs/superpowers/notes/2026-07-07-deck-accuracy-progress.md`
- Modify: `word-study-data.js`

**Interfaces:**
- Consumes: `pickDivision` from `hms.js`; `require('../word-study/invariants.js')` (`api.checkSyllables`).
- Produces: CLI `node scripts/deck-accuracy/fetch-hms-syllables.js --batch 50` — processes up to 50 not-yet-stated `agent` words, fetches, validates, writes back, updates state; prints `{done, remaining}`.

- [ ] **Step 1: Write the runner**
```js
// scripts/deck-accuracy/fetch-hms-syllables.js
const fs = require('fs'), https = require('https'), path = require('path');
const { pickDivision } = require('./hms');
const inv = require('../word-study/invariants.js');
const WS = path.join(__dirname, '../../word-study-data.js');
const STATE = path.join(__dirname, 'state-syllables.json');
const BATCH = Number((process.argv.find(a=>a.startsWith('--batch='))||'--batch=50').split('=')[1]) || 50;

function loadWS(){ const t=fs.readFileSync(WS,'utf8'); const lines=t.split('\n');
  const rows=lines.map((l,i)=>{const m=l.match(/^  (\{.*\}),?$/); return m?{i,obj:JSON.parse(m[1])}:null;}).filter(Boolean);
  return {lines, rows}; }
function saveWS(lines){ fs.writeFileSync(WS, lines.join('\n')); }
function loadState(){ return fs.existsSync(STATE)?JSON.parse(fs.readFileSync(STATE,'utf8')):{}; }
function fetchHtml(word){ return new Promise((res,rej)=>{
  https.get('https://www.howmanysyllables.com/syllables/'+encodeURIComponent(word),
    {headers:{'User-Agent':'Mozilla/5.0 WordLabs-syllable-verify'}},
    r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej); }); }
const sleep = ms => new Promise(r=>setTimeout(r,ms));

(async () => {
  const state = loadState();
  const {lines, rows} = loadWS();
  const todo = rows.filter(r => (r.obj.syllablesSource==='agent') && !state[r.obj.word]);
  const single = todo.filter(r => (r.obj.syllables||[]).length <= 1);
  // 1-syllable agent words: split is the whole word, trivially correct.
  for (const r of single){ state[r.obj.word]='trivial-1syl'; }
  const multi = todo.filter(r => (r.obj.syllables||[]).length > 1).slice(0, BATCH);
  let changed = 0;
  for (const r of multi){
    let div=null;
    try { div = pickDivision(await fetchHtml(r.obj.word), r.obj.word); } catch(e){}
    if (div){
      const prev = r.obj.syllables; r.obj.syllables = div; r.obj.syllablesSource='hms';
      if (inv.checkSyllables(r.obj).ok){ lines[r.i] = '  '+JSON.stringify(r.obj)+ (lines[r.i].endsWith(',')?',':''); state[r.obj.word]='hms'; changed++; }
      else { r.obj.syllables=prev; r.obj.syllablesSource='agent'; state[r.obj.word]='no-hms-entry'; }
    } else { state[r.obj.word]='no-hms-entry'; }
    await sleep(1200);
  }
  saveWS(lines);
  fs.writeFileSync(STATE, JSON.stringify(state,null,0));
  const remaining = rows.filter(r => r.obj.syllablesSource==='agent' && (r.obj.syllables||[]).length>1 && !state[r.obj.word]).length;
  console.log(JSON.stringify({processed: multi.length, changed, trivial: single.length, remaining}));
})();
```
Note: the line-rewrite preserves the trailing comma. `JSON.stringify` on the row must reproduce the compact one-object-per-line format; verify in Step 3.

- [ ] **Step 2: Seed the checkpoint file**
```markdown
# Deck Accuracy — Progress Checkpoint (2026-07-07)

Spec: docs/superpowers/specs/2026-07-07-teaching-deck-accuracy-design.md
Plan (Phase 1): docs/superpowers/plans/2026-07-07-deck-accuracy-phase1.md

## Phase 1a — Syllables (howmanysyllables.com)
- [ ] agent multi-syllable words verified: 0 / ~1187 (see state-syllables.json)
- Next: run `node scripts/deck-accuracy/fetch-hms-syllables.js --batch=50` until remaining=0

## Phase 1b — Phonemes (fable QA)
- [ ] linter run, flagged count: TBD
- [ ] flagged words QA'd: 0 / TBD

## Phase 2 — Deck generation
- [ ] not started (separate plan)
```

- [ ] **Step 3: Dry-run one small batch and eyeball the file diff**

Run: `node scripts/deck-accuracy/fetch-hms-syllables.js --batch=3`
Expected: prints JSON like `{"processed":3,...,"remaining":<~1180s>}`. Then:
Run: `node -e "global.window={};require('./word-study-data.js');console.log('parses',window.WORD_STUDY_WORDS.length)"`
Expected: parses 3522. Then `git diff --stat word-study-data.js` shows only a few changed lines. If the whole file rewrote or JSON format drifted (spaces added), fix the line-rewrite before continuing.

- [ ] **Step 4: Commit the tooling + first batch**
```bash
git add scripts/deck-accuracy/ docs/superpowers/notes/2026-07-07-deck-accuracy-progress.md word-study-data.js
git commit -m "feat(deck-accuracy): syllable scraper + checkpoint; first batch verified"
```

---

## Task 3: Run Phase 1a to completion (batched, resumable)

**Files:** Modify `word-study-data.js`, `scripts/deck-accuracy/state-syllables.json`, checkpoint.

- [ ] **Step 1: Loop batches until drained.** Repeat until `remaining` is 0:
```bash
node scripts/deck-accuracy/fetch-hms-syllables.js --batch=50
```
After each run: `node scripts/word-study/invariants.test.js` (or the invariants check) stays green; then commit:
```bash
git add word-study-data.js scripts/deck-accuracy/state-syllables.json
git commit -m "chore(deck-accuracy): syllable batch (remaining=<N>)"
```
Update the checkpoint's "verified" count each time. **This is the natural stop/resume point if usage limits hit — the state file + checkpoint say exactly where to resume.**

- [ ] **Step 2: Final verification**
```bash
node -e "global.window={};require('./word-study-data.js');const W=window.WORD_STUDY_WORDS;
const bad=W.filter(w=>w.syllablesSource==='agent'&&(w.syllables||[]).length>1);
console.log('unverified multi-syllable remaining:', bad.length);
const st=require('./scripts/deck-accuracy/state-syllables.json');
console.log('no-hms-entry exceptions:', Object.values(st).filter(v=>v==='no-hms-entry').length);"
```
Expected: `unverified multi-syllable remaining: 0`. Record the `no-hms-entry` exceptions in the checkpoint (these are the documented, acceptable exceptions).

- [ ] **Step 3: Commit checkpoint update** (mark Phase 1a done).

---

## Task 4: Phoneme linter (pure, TDD)

**Files:**
- Create: `scripts/deck-accuracy/phoneme-lint.js`
- Test: `scripts/deck-accuracy/phoneme-lint.test.js`

**Interfaces:**
- Consumes: `scripts/word-study/taught-graphemes.json` (array of 141 valid grapheme strings, incl. split digraphs like `a_e`); `scripts/word-study/invariants.js` (`checkPhonemes` — magic-e aware, returns `{ok,msg}`).
- Produces: `flagWord(entry, taught) -> string[]` — reasons a word's phoneme split is suspicious (empty array = looks fine). Reasons: `"joinback-fail"` (fails the magic-e-aware `inv.checkPhonemes` structural check), `"unknown-grapheme:<g>"` (a multi-letter grapheme not in the taught set), `"split-digraph-broken"` (adjacent single letters that form a known digraph, e.g. `s`,`h` where `sh` is expected).

- [ ] **Step 1: Write the failing test**
```js
// scripts/deck-accuracy/phoneme-lint.test.js
const assert = require('assert');
const { flagWord } = require('./phoneme-lint');
const taught = ['a','b','c','d','e','s','h','sh','t','r','u_e','i','o','n','p'];
assert.deepStrictEqual(flagWord({word:'ship', phonemes:['sh','i','p']}, taught), []);
assert.ok(flagWord({word:'ship', phonemes:['s','h','i','p']}, taught).includes('split-digraph-broken'));
assert.ok(flagWord({word:'cat', phonemes:['c','a']}, taught).includes('joinback-fail'));
// magic-e word must NOT be flagged as joinback-fail (invariants strips the _)
assert.deepStrictEqual(flagWord({word:'abused', phonemes:['a','b','u_e','s','d']}, taught), []);
console.log('phoneme-lint.test OK');
```

- [ ] **Step 2: Run to verify it fails**

Run: `node scripts/deck-accuracy/phoneme-lint.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**
```js
// scripts/deck-accuracy/phoneme-lint.js
const inv = require('../word-study/invariants.js');
const DIGRAPHS = ['sh','ch','th','ph','wh','ck','ng','qu'];
function flagWord(entry, taught){
  const reasons = [];
  const ph = entry.phonemes || [];
  const taughtSet = new Set(taught);
  // structural check via the real invariants (magic-e aware: strips '_', multiset match)
  if (!inv.checkPhonemes(entry).ok) reasons.push('joinback-fail');
  for (const g of ph) if (g.length > 1 && !taughtSet.has(g)) reasons.push('unknown-grapheme:'+g);
  // adjacent single letters that form a known digraph => likely wrongly split
  for (let i=0;i<ph.length-1;i++){
    if (ph[i].length===1 && ph[i+1].length===1 && DIGRAPHS.includes((ph[i]+ph[i+1]).toLowerCase()))
      reasons.push('split-digraph-broken');
  }
  return [...new Set(reasons)];
}
module.exports = { flagWord };
```

- [ ] **Step 4: Run to verify it passes**

Run: `node scripts/deck-accuracy/phoneme-lint.test.js`
Expected: `phoneme-lint.test OK`.

- [ ] **Step 5: Generate the flagged list + commit**
```bash
node -e "global.window={};require('./word-study-data.js');const {flagWord}=require('./scripts/deck-accuracy/phoneme-lint');
const taught=require('./scripts/word-study/taught-graphemes.json');
const flagged=window.WORD_STUDY_WORDS.map(w=>({word:w.word,phonemes:w.phonemes,reasons:flagWord(w,taught)})).filter(x=>x.reasons.length);
require('fs').writeFileSync('scripts/deck-accuracy/flagged-phonemes.json', JSON.stringify(flagged,null,0));
console.log('flagged for phoneme QA:', flagged.length);"
git add scripts/deck-accuracy/phoneme-lint.js scripts/deck-accuracy/phoneme-lint.test.js scripts/deck-accuracy/flagged-phonemes.json
git commit -m "feat(deck-accuracy): phoneme linter + flagged-word list for QA"
```
Record the flagged count in the checkpoint. **If the flagged count is small (<~150), Phase 1b is cheap.**

---

## Task 5: Phoneme QA fable workflow + apply

**Files:**
- Create: `scripts/deck-accuracy/phoneme-qa.workflow.js`
- Create: `scripts/deck-accuracy/apply-phoneme-qa.js`
- Modify: `word-study-data.js`

**Interfaces:**
- Consumes: `scripts/deck-accuracy/flagged-phonemes.json`.
- Produces (workflow result, written to `scripts/deck-accuracy/phoneme-qa-out.json`): array of `{word, phonemes: string[]}` — fable's corrected grapheme split. `apply-phoneme-qa.js` merges each under the `invariants.checkPhonemes` gate.

- [ ] **Step 1: Write the Workflow script** (run via the Workflow tool, `model: 'fable'`, batches of ≤40)

The workflow reads `flagged-phonemes.json`, pipelines the words in batches; each agent gets a batch and returns, per word, the correct **grapheme** split (actual letters from the word, digraphs/split-digraphs kept whole, join-back = word) using a `STRUCTURED` schema `{ results: [{word, phonemes:[string]}] }`. Concatenate all batches to `phoneme-qa-out.json`. (The Workflow tool call is made at execution time; this file documents the prompt + schema so the run is reproducible.)
```js
// scripts/deck-accuracy/phoneme-qa.workflow.js  (documentation of the fable QA run)
// meta.name: 'phoneme-qa'; model: 'fable'; batch <=40 words.
// Per word, agent returns grapheme phonemes: actual letters from the word, ONE per sound,
// digraphs (sh, ch, th, ph, ng, ck) and split digraphs (a_e, i_e, o_e) kept whole,
// silent letters attached to their grapheme; join of phonemes === word (lowercase).
// Output merged to scripts/deck-accuracy/phoneme-qa-out.json as {results:[{word,phonemes}]}.
```

- [ ] **Step 2: Write the applier**
```js
// scripts/deck-accuracy/apply-phoneme-qa.js
const fs=require('fs'), path=require('path');
const inv=require('../word-study/invariants.js');
const WS=path.join(__dirname,'../../word-study-data.js');
const out=JSON.parse(fs.readFileSync(path.join(__dirname,'phoneme-qa-out.json'),'utf8'));
const byWord=new Map(out.map(r=>[r.word, r.phonemes]));
const lines=fs.readFileSync(WS,'utf8').split('\n');
let applied=0, rejected=0;
for (let i=0;i<lines.length;i++){
  const m=lines[i].match(/^  (\{.*\}),?$/); if(!m) continue;
  const obj=JSON.parse(m[1]); const np=byWord.get(obj.word);
  if(!np) continue;
  const prev=obj.phonemes; obj.phonemes=np;
  if(inv.checkPhonemes(obj).ok){ lines[i]='  '+JSON.stringify(obj)+(lines[i].endsWith(',')?',':''); applied++; }
  else { obj.phonemes=prev; rejected++; }
}
fs.writeFileSync(WS, lines.join('\n'));
console.log(JSON.stringify({applied, rejected}));
```

- [ ] **Step 3: Execute (batched, committed)**

Run the Workflow tool with the `phoneme-qa` script over `flagged-phonemes.json` (fable, ≤40/batch). Then:
```bash
node scripts/deck-accuracy/apply-phoneme-qa.js
node -e "global.window={};require('./word-study-data.js');console.log('parses',window.WORD_STUDY_WORDS.length)"
git add word-study-data.js scripts/deck-accuracy/phoneme-qa-out.json scripts/deck-accuracy/phoneme-qa.workflow.js scripts/deck-accuracy/apply-phoneme-qa.js
git commit -m "fix(deck-accuracy): phoneme QA corrections (applied=<N>, rejected=<M>)"
```
Update the checkpoint. If the workflow is interrupted, `phoneme-qa-out.json` holds completed batches — resume by running remaining flagged words only.

---

## Task 6: Phase 1 sign-off

**Files:** checkpoint only.

- [ ] **Step 1: Full invariants sweep**
```bash
node -e "global.window={};require('./word-study-data.js');const inv=require('./scripts/word-study/invariants.js');
const W=window.WORD_STUDY_WORDS;let bad=0;W.forEach(w=>{if(!inv.validateEntry(w).ok){bad++;}});
console.log('entries failing invariants:', bad);"
```
Expected: `0`.

- [ ] **Step 2: Update checkpoint** — mark Phase 1a + 1b complete, list any `no-hms-entry` / QA-rejected exceptions, set "Next: Phase 2 plan". Commit.

---

## Self-Review Notes

- **Spec coverage:** §Phase 1a → Tasks 1–3. §Phase 1b → Tasks 4–5. §invariants gate → gating in Tasks 2/5, sweep in Task 6. §Resumability/checkpoint → Task 2 Step 2 + committed state files + per-batch commits throughout. §thin-coverage/exceptions → recorded as `no-hms-entry` in Task 3, QA-rejected in Task 5.
- **Interfaces:** `pickDivision`/`parseDivisions` (Task 1) consumed in Task 2; `flagWord` (Task 4) consumed in Task 4 Step 5; `checkSyllables`/`checkPhonemes`/`validateEntry` from existing `invariants.js`.
- **Usage-limit safety:** Phase 1a is 100% deterministic (no tokens). Only Task 5 uses fable, scoped to the linter-flagged subset. Every batch commits + updates the checkpoint.
- **Phase 2** (deterministic deck generation from the hardened data) is a separate plan, written after Phase 1 lands.
