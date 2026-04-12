# Wave 3 — Extension Data Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete `wordlab-extension-data.js` entirely — all four remaining games (Meaning Mode, Mission Mode, Flashcard, Speed Builder) consume `window.MORPHEMES` from `data.js` directly, with extension mode as pure `+1 stage` filtering.

**Architecture:** Content migration first (extension morphemes into data.js as stage:null), then code refactors per game. Meaning Mode is a clean swap to window.MORPHEMES. Mission Mode decorates prefixes/suffixes with a meaningPattern lookup and derives BASES/SUFFIX_BASES from valid-combos.json. Flashcard and Speed are trivial delete-the-override jobs.

**Tech Stack:** Vanilla JS, no build system. `data.js` provides `window.MORPHEMES`. `valid-combos.json` provides morpheme relationship data.

**Spec:** `docs/superpowers/specs/2026-04-12-wave-3-extension-retirement-design.md`

**Spec correction:** Mission Mode PREFIXES and SUFFIXES have `meaningPattern` fields (e.g. `"towards {base}"`) not in data.js. `allowedPos` IS in data.js. `meaningPattern` is NOT derivable and needs a decoration lookup. The plan handles this in Task 5.

---

### Task 1: Pre-flight audit — find data.js gaps

Before migrating, verify which morphemes from the game inline arrays are NOT already in `data.js`. Any gaps must be filled in Task 2 alongside the extension content.

**Files:**
- Read: `data.js` (lines 1-664)
- Read: `meaning-mode.html` (lines 331-343)
- Read: `mission-mode.html` (lines 755-756, 759-857, 888-1068)
- Read: `wordlab-extension-data.js` (lines 240-432)

- [ ] **Step 1: Write a Node script to extract and diff morpheme IDs**

Create `scripts/audit-wave3-gaps.js` that:

1. Parses all morpheme IDs from `data.js` (PREFIXES, SUFFIXES, CORE_BASES, ANGLO_BASE_LIST, LATIN_BASE_LIST, GREEK_BASE_LIST) using regex `id\s*:\s*["']([^"']+)["']`
2. Parses morpheme IDs from `wordlab-extension-data.js` (EXT_MEANING_PREFIXES, EXT_MEANING_SUFFIXES, EXT_MEANING_BASES, EXT_MISSION_BASES, EXT_MISSION_SUFFIX_BASES) — use bracket-depth matching to find array boundaries for multi-line arrays
3. Parses morpheme IDs from `meaning-mode.html` inline arrays (PREFIXES, SUFFIXES, BASES on lines 331-343)
4. Parses morpheme IDs from `mission-mode.html` inline arrays (PREFIXES, SUFFIXES on lines 755-756; SUFFIX_BASES lines 759-857; BASES lines 888-1068)
5. Reports which IDs from each source are missing from `data.js`

Print output grouped by source:
```
=== Extension arrays missing from data.js ===
EXT_MEANING_PREFIXES: 60 total, N missing
  Missing: ambi, ante, apo, ...

=== Meaning Mode inline missing from data.js ===
PREFIXES: 40 total, N missing
...

=== TOTAL GAPS: N morphemes need adding to data.js ===
```

- [ ] **Step 2: Run the audit**

Run: `node scripts/audit-wave3-gaps.js`

Record the missing IDs — they feed into Task 2.

- [ ] **Step 3: Commit**

```bash
git add scripts/audit-wave3-gaps.js
git commit -m "chore: add Wave 3 pre-flight gap audit script"
```

---

### Task 2: Content migration — extension + gap morphemes into data.js

Migrate all missing morphemes into `data.js` as `stage:null`. Content-only change — no game code changes.

**Files:**
- Modify: `data.js`
- Read: `wordlab-extension-data.js`
- Read: Task 1 audit output

- [ ] **Step 1: Write a migration script**

Create `scripts/migrate-ext-to-data.js` that:

1. Reads each `EXT_MEANING_*` and `EXT_MISSION_*` array from `wordlab-extension-data.js`
2. Includes any meaning-mode/mission-mode inline morphemes found missing in Task 1
3. For each missing morpheme, outputs insertion code for `data.js`:
   - Strips game-specific fields (`meaningPattern`, `validPrefixes`, `validSuffixes`)
   - Sets `stage: null`
   - Groups: prefixes to PREFIXES, suffixes to SUFFIXES, Greek/Latin bases to GREEK_BASE_LIST, Anglo bases to ANGLO_BASE_LIST
4. Prints insertion code to stdout grouped by target array

- [ ] **Step 2: Run and review**

Run: `node scripts/migrate-ext-to-data.js`

Confirm counts match expectations (~154 from extension + any inline gaps).

- [ ] **Step 3: Insert into data.js**

Copy output into appropriate locations:
- New prefixes: end of `PREFIXES` array (before `];`)
- New suffixes: end of `SUFFIXES` array (before `];`)
- New bases: end of appropriate `*_BASE_LIST` array

- [ ] **Step 4: Rebuild valid-combos.json**

Run in background: `node scripts/build-valid-combos.js`

Expected: count >= 3,966.

- [ ] **Step 5: Verify data.js loads**

Run: `node -e "require('./data.js')"` — should exit cleanly.

- [ ] **Step 6: Commit**

```bash
git add data.js valid-combos.json scripts/migrate-ext-to-data.js
git commit -m "content(stage): migrate extension morphemes into data.js (Wave 3 Phase 1)"
```

---

### Task 3: Flashcard + Speed Builder cleanup

Delete the extension overrides. Both games already consume `window.MORPHEMES` from `data.js`.

**Files:**
- Modify: `flashcard-mode.html` (lines 358, 361-363)
- Modify: `speed-mode.html` (lines 459-461)

- [ ] **Step 1: Edit flashcard-mode.html**

Delete line 358 — the conditional script injection for extension data (the line that uses `sessionStorage.getItem('wl_extension_mode')` to conditionally load the extension script).

Delete lines 361-363 — the MORPHEMES override block that replaces window.MORPHEMES with WL_EXTENSION content.

Leave line 364 intact: `const DATA = window.MORPHEMES || { prefixes: [], suffixes: [], bases: [] };`

**Verify:** Grep for `filterByStage|weightByStage` in flashcard-mode.html. If neither is called anywhere, add stage filtering where the deck is built from DATA:
```js
const filteredPrefixes = WordLabData.weightByStage(DATA.prefixes, 'flashcard-mode');
```
(Same for suffixes and bases.)

- [ ] **Step 2: Edit speed-mode.html**

Delete lines 459-461 — the extension override inside DOMContentLoaded that replaces window.MORPHEMES.

Leave lines 462+ intact (rawData reads from window.MORPHEMES).

Same verification — ensure stage filtering is applied.

- [ ] **Step 3: Smoke test**

Open both games in browser, normal + extension mode. No console errors. Cards/words appear correctly.

- [ ] **Step 4: Commit**

```bash
git add flashcard-mode.html speed-mode.html
git commit -m "refactor(flashcard,speed): remove extension override, use unified data.js"
```

---

### Task 4: Meaning Mode refactor

Replace inline PREFIXES/SUFFIXES/BASES with reads from `window.MORPHEMES`. No special fields.

**Files:**
- Modify: `meaning-mode.html`

**Key lines:**
- 320: `<script defer src="wordlab-data.js">`
- 328: `<script>` (non-deferred inline block)
- 331: `let PREFIXES=[...40 entries...];`
- 332: `let SUFFIXES=[...55 entries...];`
- 334-341: Extension splice-swap handler
- 343: `let BASES=[...180+ entries...];`
- 355: `var _origMeanPfx = PREFIXES.slice(), ...`
- 520: `WordLabData.weightByStage(getActiveMorphemePool(), 'meaning-mode')` — already handles stage

**Timing:** `data.js` sets `window.MORPHEMES` synchronously. Meaning Mode does NOT currently load `data.js`. Must add it BEFORE the inline `<script>` block (non-deferred so it runs before the inline code).

- [ ] **Step 1: Add data.js script tag**

After line 327 (last deferred script tag), before the inline `<script>` at line 328:

```html
<script src="data.js"></script>
```

- [ ] **Step 2: Replace inline arrays with window.MORPHEMES reads**

Replace line 331 (`let PREFIXES=[...];`) with:
```js
  let PREFIXES = (window.MORPHEMES && window.MORPHEMES.prefixes) ? window.MORPHEMES.prefixes.map(function(p){ return {id:p.id, stage:p.stage, form:p.form, meaning:p.meaning}; }) : [];
```

Replace line 332 (`let SUFFIXES=[...];`) with:
```js
  let SUFFIXES = (window.MORPHEMES && window.MORPHEMES.suffixes) ? window.MORPHEMES.suffixes.map(function(s){ return {id:s.id, stage:s.stage, form:s.form, meaning:s.meaning}; }) : [];
```

Replace line 343 (`let BASES=[...];`) with:
```js
  let BASES = (window.MORPHEMES && window.MORPHEMES.bases) ? window.MORPHEMES.bases.map(function(b){ return {id:b.id, stage:b.stage, form:b.form, meaning:b.meaning}; }) : [];
```

- [ ] **Step 3: Delete extension splice-swap**

Delete lines 334-342 (the DOMContentLoaded handler that splices WL_EXTENSION content into PREFIXES/SUFFIXES/BASES).

- [ ] **Step 4: Verify existing code still works**

Line 355 (`_origMeanPfx` etc.) — no change needed, `.slice()` on the new arrays works identically.

Lines 356-450 (custom morphemes + spelling sets) — no change needed, they mutate PREFIXES/SUFFIXES/BASES by form matching. Verify no references to `WL_EXTENSION` remain.

Line 520 (`weightByStage`) — no change needed.

- [ ] **Step 5: Smoke test**

Open meaning-mode.html: all 3 morpheme types work in normal and extension mode. No console errors.

- [ ] **Step 6: Commit**

```bash
git add meaning-mode.html
git commit -m "refactor(meaning): consume window.MORPHEMES directly, delete inline arrays"
```

---

### Task 5: Mission Mode — extract meaningPattern lookups

Extract `meaningPattern` strings from Mission Mode's inline PREFIXES/SUFFIXES into compact lookup objects before the full refactor.

**Files:**
- Modify: `mission-mode.html` (lines 755-756)

- [ ] **Step 1: Write extraction script**

Create `scripts/extract-meaning-patterns.js` that:
1. Reads `mission-mode.html`
2. Extracts `id` and `meaningPattern` from PREFIXES (line 755) and SUFFIXES (line 756) via regex `id:"([^"]+)"[^}]*?meaningPattern:"([^"]+)"`
3. Outputs two JS objects: `MISSION_PREFIX_PATTERNS` and `MISSION_SUFFIX_PATTERNS`

- [ ] **Step 2: Run and review**

Run: `node scripts/extract-meaning-patterns.js`

Expected: ~40 prefix patterns, ~55 suffix patterns.

- [ ] **Step 3: Replace inline PREFIXES/SUFFIXES with lookups + placeholders**

Replace line 755 (the entire `let PREFIXES=[...];` long line) with:
```js
  const MISSION_PREFIX_PATTERNS = {
    "ad": "towards {base}",
    "anti": "against {base}",
    "de": "remove or undo {base}",
    ... // all patterns from extraction script output
  };
  let PREFIXES = [];
```

Replace line 756 (the entire `let SUFFIXES=[...];` long line) with:
```js
  const MISSION_SUFFIX_PATTERNS = {
    "s": "more than one {base}",
    "es": "more than one {base}",
    "ed": "the past form of {base}; already happened",
    ... // all patterns from extraction script output
  };
  let SUFFIXES = [];
```

- [ ] **Step 4: Commit**

```bash
git add scripts/extract-meaning-patterns.js mission-mode.html
git commit -m "refactor(mission): extract meaningPattern lookup tables from inline arrays"
```

---

### Task 6: Mission Mode — full refactor

Wire Mission Mode to consume `window.MORPHEMES` + `valid-combos.json`. Replace BASES/SUFFIX_BASES, simplify isRealWord, consolidate async init.

**Files:**
- Modify: `mission-mode.html`

**Key lines:**
- PREFIXES/SUFFIXES: empty `[]` + MISSION_*_PATTERNS lookups (from Task 5)
- 759-857: SUFFIX_BASES (99 entries with `validSuffixes`)
- 888-1068: BASES (~180 entries with `validPrefixes`)
- 1071-1080: Extension splice-swap
- 1257-1272: weightByStage setTimeout(50) handler
- 1309: `isRealWord` (dictionary lookup)
- 1340: `buildTargetMeaning()` uses `meaningPattern` with fallback

**Mission Mode does NOT load `data.js`.** Must add it.

- [ ] **Step 1: Add data.js script tag**

Add non-deferred `<script src="data.js"></script>` before the inline `<script>` containing the arrays.

- [ ] **Step 2: Populate PREFIXES/SUFFIXES from window.MORPHEMES + decoration**

Replace `let PREFIXES = [];` (from Task 5) with:
```js
  let PREFIXES = (window.MORPHEMES && window.MORPHEMES.prefixes) ? window.MORPHEMES.prefixes.map(function(p) {
    return {
      id: p.id, stage: p.stage, form: p.form, meaning: p.meaning,
      meaningPattern: MISSION_PREFIX_PATTERNS[p.id] || p.meaning + ' {base}',
      allowedPos: p.allowedPos || ['noun','adj','verb']
    };
  }) : [];
```

Replace `let SUFFIXES = [];` with:
```js
  let SUFFIXES = (window.MORPHEMES && window.MORPHEMES.suffixes) ? window.MORPHEMES.suffixes.map(function(s) {
    return {
      id: s.id, stage: s.stage, form: s.form, meaning: s.meaning,
      meaningPattern: MISSION_SUFFIX_PATTERNS[s.id] || s.meaning + ' {base}',
      allowedPos: s.allowedPos || ['noun','adj','verb']
    };
  }) : [];
```

- [ ] **Step 3: Delete inline SUFFIX_BASES and BASES**

Delete lines 759-857 (`let SUFFIX_BASES=[...]`) and lines 888-1068 (`let BASES=[...]`). Replace with:
```js
  let SUFFIX_BASES = [];
  let BASES = [];
```

- [ ] **Step 4: Add valid-combos.json fetch and BASES derivation**

Add a DOMContentLoaded handler after the `let BASES = [];`:

```js
  var _missionDataReady = false;
  document.addEventListener('DOMContentLoaded', function() {
    fetch('valid-combos.json')
      .then(function(r) { return r.json(); })
      .then(function(combos) {
        var prefixMap = {};
        var suffixMap = {};
        combos.forEach(function(c) {
          if (c.p) {
            if (!prefixMap[c.b]) prefixMap[c.b] = new Set();
            prefixMap[c.b].add(c.p);
          }
          if (c.s1) {
            if (!suffixMap[c.b]) suffixMap[c.b] = new Set();
            suffixMap[c.b].add(c.s1);
          }
          if (c.s2) {
            if (!suffixMap[c.b]) suffixMap[c.b] = new Set();
            suffixMap[c.b].add(c.s2);
          }
        });

        var allBases = (window.MORPHEMES && window.MORPHEMES.bases) || [];
        var newBases = [];
        var newSuffixBases = [];
        allBases.forEach(function(m) {
          var vp = prefixMap[m.id];
          if (vp && vp.size > 0) {
            newBases.push({
              id: m.id, stage: m.stage, form: m.form,
              meaning: m.meaning, pos: m.pos || ['verb','noun'],
              validPrefixes: Array.from(vp)
            });
          }
          var vs = suffixMap[m.id];
          if (vs && vs.size > 0) {
            newSuffixBases.push({
              id: m.id, stage: m.stage, form: m.form,
              meaning: m.meaning, pos: m.pos || ['verb','noun'],
              validSuffixes: Array.from(vs)
            });
          }
        });

        BASES.splice(0, BASES.length, ...newBases);
        SUFFIX_BASES.splice(0, SUFFIX_BASES.length, ...newSuffixBases);

        // Apply stage weighting
        if (typeof WordLabData !== 'undefined' && WordLabData.weightByStage) {
          try {
            var fp = WordLabData.weightByStage(PREFIXES.slice(), 'mission-mode');
            PREFIXES.splice(0, PREFIXES.length, ...fp);
            var fs = WordLabData.weightByStage(SUFFIXES.slice(), 'mission-mode');
            SUFFIXES.splice(0, SUFFIXES.length, ...fs);
            var fsb = WordLabData.weightByStage(SUFFIX_BASES.slice(), 'mission-mode');
            SUFFIX_BASES.splice(0, SUFFIX_BASES.length, ...fsb);
            var fb = WordLabData.weightByStage(BASES.slice(), 'mission-mode');
            BASES.splice(0, BASES.length, ...fb);
          } catch(e) { console.warn('stage filter error', e); }
        }

        // Custom morphemes + spelling sets merge here (moved from separate handler)
        // ... (move existing code from lines ~1091-1185 here)

        _missionDataReady = true;
      })
      .catch(function(e) {
        console.warn('Failed to load valid-combos.json:', e);
        _missionDataReady = true;
      });
  });
```

- [ ] **Step 5: Guard game start**

Find the function that starts gameplay. Add at the top:
```js
if (!_missionDataReady) {
  setTimeout(function() { startGame(); }, 100);
  return;
}
```

- [ ] **Step 6: Delete extension splice-swap**

Delete lines 1071-1080 (the DOMContentLoaded handler with WL_EXTENSION splicing + isRealWord override).

- [ ] **Step 7: Replace isRealWord**

Replace line 1309:
```js
  function isRealWord(prefix,base){if(!dictWords||dictWords.size===0)return true;return dictWords.has((prefix.form+base.form).toLowerCase());}
```
With:
```js
  function isRealWord(prefix,base){return !!(base.validPrefixes && base.validPrefixes.includes(prefix.id));}
```

If `dictWords` / `dictionary.txt` loading code is ONLY used by isRealWord, remove it too (saves a network request).

- [ ] **Step 8: Delete old weightByStage handler**

Delete lines 1257-1272 (the setTimeout(50) handler). This logic is now inside the fetch callback from Step 4.

- [ ] **Step 9: Move custom morpheme merge into fetch callback**

Move the body of the custom morpheme DOMContentLoaded handler (lines ~1091-1185) into the fetch `.then()` callback, after weightByStage but before `_missionDataReady = true`. This ensures custom morphemes merge into populated and weighted arrays.

Similarly move spelling set tracking code into or after the fetch callback.

- [ ] **Step 10: Smoke test**

Open mission-mode.html:
- Prefix mode: bases show, matching works, buildTargetMeaning readable
- Suffix mode: bases show, matching works
- Extension mode: more content visible
- Combining forms (phon, scope, graph) match valid prefixes
- Custom word lists work (if configured)
- No console errors

- [ ] **Step 11: Commit**

```bash
git add mission-mode.html
git commit -m "refactor(mission): derive BASES from valid-combos.json, consume window.MORPHEMES"
```

---

### Task 7: Delete wordlab-extension-data.js

All four games are off the extension file. Delete it and clean up references.

**Files:**
- Delete: `wordlab-extension-data.js`
- Modify: ~15 HTML files

- [ ] **Step 1: Verify no WL_EXTENSION usage remains**

Run: `grep -rn 'WL_EXTENSION' *.html *.js | grep -v wordlab-extension-data.js | grep -v scripts/ | grep -v docs/`

Expected: zero matches.

- [ ] **Step 2: Remove script tags from all HTML files**

Run: `grep -rn 'wordlab-extension-data' *.html`

For each match, delete the entire `<script>` line. Two patterns exist:
- Pattern A: `<script defer src="wordlab-extension-data.js"></script>`
- Pattern B: conditional script injection via sessionStorage check

Expected files (15): breakdown-mode, dashboard, flashcard-mode, homophone-mode, meaning-mode, mission-mode, morpheme-builder, phoneme-mode, root-lab, sound-sorter, speed-mode, syllable-mode, word-refinery, word-spectrum, worksheet-analysis.

- [ ] **Step 3: Delete the file**

```bash
rm wordlab-extension-data.js
```

- [ ] **Step 4: Final grep**

```bash
grep -rn 'WL_EXTENSION\|wordlab-extension-data' *.html *.js
```

Expected: zero matches.

Also check for direct sessionStorage reads that bypassed isExtensionMode():
```bash
grep -rn 'wl_extension_mode' *.html *.js | grep -v isExtensionMode
```

Fix any remaining references.

- [ ] **Step 5: Spot-check all 4 games**

Each in normal + extension mode, no console errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: delete wordlab-extension-data.js (Wave 3 complete)

All 4 remaining games (Meaning, Mission, Flashcard, Speed) now consume
window.MORPHEMES from data.js. Extension mode = +1 stage filter everywhere."
```

---

### Task 8: Full verification and cleanup

Final sweep.

- [ ] **Step 1: Verify valid-combos count**

Run: `node -e "console.log(require('./valid-combos.json').length)"`
Expected: >= 3,966.

- [ ] **Step 2: Full artifact grep**

```bash
grep -rn 'WL_EXTENSION\|wordlab-extension-data\|EXT_MEANING\|EXT_MISSION\|EXT_PREFIXES\|EXT_SUFFIXES\|EXT_BASES' *.html *.js
```

Zero matches in game files. Scripts/ and docs/ references are fine.

- [ ] **Step 3: Browser smoke test all 4 games**

| Game | Normal | Extension | Specific checks |
|---|---|---|---|
| Flashcard | Cards show | More cards | Deck builds |
| Speed Builder | Words generate | Expanded pool | Timer works |
| Meaning Match-Up | All 3 types | More morphemes | weightByStage at line 520 |
| Mission Mode | Prefix + suffix | Expanded pool | Combining forms; buildTargetMeaning |

- [ ] **Step 4: Clean up migration scripts (optional)**

```bash
rm scripts/audit-wave3-gaps.js scripts/migrate-ext-to-data.js scripts/extract-meaning-patterns.js
git add -A && git commit -m "chore: remove Wave 3 migration scripts"
```

- [ ] **Step 5: Update CLAUDE.md**

Add completion notes under Wave 3 section. Add new decisions to "Decisions Made & Why" table.
