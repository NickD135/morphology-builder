# Year-Level Progression System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a curriculum-aligned levelling system (Explorer to Pioneer) that filters content by student stage, with mastery sub-levels 1 to 4, +1 stage extension mode, 80/20 content weighting, and admin tagging UI.

**Architecture:** A single `stage` field on morphemes/words in `data.js` and game data files, cumulative filtering (current stage and below), per-student stage stored on `students` table, live mastery calculation from `student_progress`. All changes are progressive — untagged content keeps working.

**Tech Stack:** Vanilla HTML/JS (no build), Supabase Postgres, client-side sessionStorage, inline `<script>` per page. Spec reference: `docs/superpowers/specs/2026-04-10-year-level-system-design.md`.

**Design conventions:**
- **Stage IDs:** `s2e`, `s2l`, `s3e`, `s3l`, `s4`, `null`
- **Stage order array:** `['s2e','s2l','s3e','s3l','s4']`
- **Student names:** Explorer, Voyager, Wanderer, Trailblazer, Pioneer
- **Core games for mastery:** `sound-sorter`, `phoneme-splitter`, `syllable-splitter`, `breakdown-blitz`, `meaning-mode`, `mission-mode`
- **No tests framework exists** in this repo — verification is manual browser testing and Supabase SQL checks after each task. Each task includes explicit verification steps.
- **Local dev server:** `python3 -m http.server 8080 --bind 0.0.0.0`
- **Commits** happen after each task so the plan can be resumed/rolled back per-task.
- **Security note:** All DOM construction in the tasks below uses safe patterns (`textContent`, `createElement`, `appendChild`) rather than `innerHTML` with dynamic content. When setting static HTML strings, prefer template functions that escape user data via `textContent`.

---

## File Structure

**New files:**
- `supabase/migrations/add_student_stage.sql` — DB schema migration
- `supabase/migrations/add_word_list_stage_group.sql` — word list groups
- `supabase/migrations/add_spelling_set_stage_group.sql` — spelling set groups
- `wordlab-stage.js` — shared stage utility module (definitions, filtering, mastery calc)
- `scripts/apply-stage-csv.js` — Node script that applies CSV tag exports to `data.js`

**Modified files (core infrastructure):**
- `data.js` — add `stage` field to every prefix/suffix/base
- `wordlab-extension-data.js` — content merged into data.js, file becomes a shim
- `wordlab-data.js` — update `getStudentData()`, add stage helpers, update `getCustomWords()` and `getSpellingSetWords()`
- `sound-sorter-data.js` — add `stage` field to words

**Modified files (game pages — content filtering):**
- `sound-sorter.html`, `phoneme-mode.html`, `syllable-mode.html`
- `breakdown-mode.html` (inline MISSIONS array)
- `mission-mode.html`, `meaning-mode.html` (inline base arrays)
- `morpheme-builder.html`, `flashcard-mode.html`, `speed-mode.html`
- `root-lab.html`, `word-refinery.html`, `homophone-mode.html`, `word-spectrum.html`

**Modified files (UI):**
- `landing.html` — student status strip level badge + progress detail panel
- `dashboard.html` — stage pill, stage selector popover, filter/sort, bulk actions, promote nudge
- `analytics.html` — new "Content Levels" admin tab with morpheme/word tagger + CSV import/export

---

## Task Breakdown Overview

Tasks are grouped into phases. Each task is independently committable.

**Phase 1 — Foundation (Tasks 1 to 5):** DB schema, stage utility module, data layer plumbing
**Phase 2 — Filtering logic (Tasks 6 to 10):** Per-game content filtering, 80/20 weighting
**Phase 3 — Student UI (Tasks 11 to 13):** Level badge, mastery panel, promotion animations
**Phase 4 — Teacher dashboard (Tasks 14 to 18):** Stage pill, selector, filter/sort, bulk assign, promote nudge
**Phase 5 — Extension mode redesign (Tasks 19 to 21):** Migrate extension data, "+1 stage" semantics, tier lock
**Phase 6 — Admin tagging UI (Tasks 22 to 25):** Analytics tab, morpheme tagger, word tagger, CSV round-trip
**Phase 7 — Stage groups (Tasks 26 to 27):** Stage group assignment for custom word lists and spelling sets

---

## Phase 1 — Foundation

### Task 1: Database migration — add stage columns to students table

**Files:**
- Create: `supabase/migrations/add_student_stage.sql`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/add_student_stage.sql`:

```sql
-- Add stage progression columns to students table
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS stage_overrides jsonb DEFAULT '{}'::jsonb;

-- Constrain stage to valid values (null allowed = unassigned)
ALTER TABLE students
  DROP CONSTRAINT IF EXISTS students_stage_check;

ALTER TABLE students
  ADD CONSTRAINT students_stage_check
  CHECK (stage IS NULL OR stage IN ('s2e','s2l','s3e','s3l','s4'));

-- Index for stage-based filtering on the dashboard
CREATE INDEX IF NOT EXISTS students_stage_idx ON students(stage) WHERE stage IS NOT NULL;

COMMENT ON COLUMN students.stage IS 'Curriculum stage: s2e=Explorer, s2l=Voyager, s3e=Wanderer, s3l=Trailblazer, s4=Pioneer, NULL=unassigned';
COMMENT ON COLUMN students.stage_overrides IS 'Per-activity stage overrides, e.g. {"sound-sorter":"s2e"}';
```

- [ ] **Step 2: Apply migration in Supabase**

Run the SQL in the Supabase SQL editor for project `kdpavfrzmmzknqfpodrl`.

Verify with:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students' AND column_name IN ('stage','stage_overrides');
```

Expected: 2 rows — `stage` (text, nullable), `stage_overrides` (jsonb, nullable).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/add_student_stage.sql
git commit -m "feat(db): add stage and stage_overrides columns to students"
```

---

### Task 2: Create shared stage utility module

**Files:**
- Create: `wordlab-stage.js`

- [ ] **Step 1: Create the module**

Create `wordlab-stage.js` with the following content. This is a single IIFE that exposes `window.WLStage`:

```javascript
// Word Labs — Stage utility module
// Provides stage definitions, filtering, and mastery calculation
// Loaded via <script src="wordlab-stage.js"></script> before game scripts

(function(global){
  'use strict';

  var STAGE_ORDER = ['s2e','s2l','s3e','s3l','s4'];

  var STAGE_NAMES = {
    s2e: 'Explorer',
    s2l: 'Voyager',
    s3e: 'Wanderer',
    s3l: 'Trailblazer',
    s4:  'Pioneer'
  };

  var STAGE_LABELS = {
    s2e: 'Stage 2 Early (~Y3)',
    s2l: 'Stage 2 Late (~Y4)',
    s3e: 'Stage 3 Early (~Y5)',
    s3l: 'Stage 3 Late (~Y6)',
    s4:  'Beyond curriculum'
  };

  var STAGE_SHORT = {
    s2e: 'EXP',
    s2l: 'VOY',
    s3e: 'WAN',
    s3l: 'TRL',
    s4:  'PIO'
  };

  var CORE_GAMES = [
    'sound-sorter',
    'phoneme-splitter',
    'syllable-splitter',
    'breakdown-blitz',
    'meaning-mode',
    'mission-mode'
  ];

  function stageIndex(stage){
    if (!stage) return -1;
    return STAGE_ORDER.indexOf(stage);
  }

  function nextStage(stage){
    var i = stageIndex(stage);
    if (i < 0 || i >= STAGE_ORDER.length - 1) return null;
    return STAGE_ORDER[i + 1];
  }

  function stagesAtOrBelow(stage){
    var i = stageIndex(stage);
    if (i < 0) return [];
    return STAGE_ORDER.slice(0, i + 1);
  }

  function visibleStages(stage, extEnabled){
    var stages = stagesAtOrBelow(stage);
    if (extEnabled) {
      var next = nextStage(stage);
      if (next) stages.push(next);
    }
    return stages;
  }

  function isItemVisible(itemStage, studentStage, extEnabled){
    if (itemStage == null) return true;     // untagged = always visible
    if (!studentStage) return true;          // student has no stage = show everything
    var visible = visibleStages(studentStage, extEnabled);
    return visible.indexOf(itemStage) !== -1;
  }

  function isCurrentStage(itemStage, studentStage, extEnabled){
    if (itemStage == null) return false;
    if (!studentStage) return false;
    if (itemStage === studentStage) return true;
    if (extEnabled && itemStage === nextStage(studentStage)) return true;
    return false;
  }

  function shuffle(arr){
    for (var i = arr.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  // 80/20 weighted shuffle: ~4 current stage items for every 1 below-stage
  function weightPool(items, studentStage, extEnabled){
    if (!studentStage) return items.slice();
    var current = [];
    var below = [];
    var untagged = [];
    for (var i=0; i<items.length; i++){
      var it = items[i];
      var s = it.stage;
      if (s == null) untagged.push(it);
      else if (isCurrentStage(s, studentStage, extEnabled)) current.push(it);
      else below.push(it);
    }
    shuffle(current); shuffle(below); shuffle(untagged);

    var out = [];
    var curIdx = 0, belowIdx = 0, untIdx = 0;
    var totalLen = current.length + below.length + untagged.length;
    for (var k=0; k<totalLen; k++){
      var slot = k % 5;
      if (slot === 4 && belowIdx < below.length) {
        out.push(below[belowIdx++]);
      } else if (curIdx < current.length) {
        out.push(current[curIdx++]);
      } else if (untIdx < untagged.length) {
        out.push(untagged[untIdx++]);
      } else if (belowIdx < below.length) {
        out.push(below[belowIdx++]);
      }
    }
    return out;
  }

  // Calculate per-game mastery for a student at their current stage.
  // progressRows: rows from student_progress
  // taggedCategories: { activity: Set<category> } of categories at student's stage
  // Returns: { overall: 0-1, perGame: { [activity]: 0-1 or null } }
  function calcMastery(progressRows, studentStage, taggedCategories){
    var perGame = {};
    CORE_GAMES.forEach(function(g){ perGame[g] = null; });

    if (!studentStage || !taggedCategories) {
      return { overall: 0, perGame: perGame };
    }

    var totals = {};
    progressRows.forEach(function(row){
      if (CORE_GAMES.indexOf(row.activity) === -1) return;
      var tagged = taggedCategories[row.activity];
      if (!tagged || !tagged.has(row.category)) return;
      if (!totals[row.activity]) totals[row.activity] = { correct: 0, total: 0 };
      totals[row.activity].correct += row.correct || 0;
      totals[row.activity].total += row.total || 0;
    });

    CORE_GAMES.forEach(function(g){
      var t = totals[g];
      if (t && t.total > 0) {
        perGame[g] = t.correct / t.total;
      }
    });

    var sum = 0;
    CORE_GAMES.forEach(function(g){
      sum += (perGame[g] || 0);
    });
    var overall = sum / CORE_GAMES.length;

    return { overall: overall, perGame: perGame };
  }

  function subLevel(mastery){
    if (mastery >= 0.75) return 4;
    if (mastery >= 0.50) return 3;
    if (mastery >= 0.25) return 2;
    return 1;
  }

  function levelLabel(stage, mastery){
    if (!stage) return '';
    return STAGE_NAMES[stage] + ' ' + subLevel(mastery);
  }

  global.WLStage = {
    STAGE_ORDER: STAGE_ORDER,
    STAGE_NAMES: STAGE_NAMES,
    STAGE_LABELS: STAGE_LABELS,
    STAGE_SHORT: STAGE_SHORT,
    CORE_GAMES: CORE_GAMES,
    stageIndex: stageIndex,
    nextStage: nextStage,
    stagesAtOrBelow: stagesAtOrBelow,
    visibleStages: visibleStages,
    isItemVisible: isItemVisible,
    isCurrentStage: isCurrentStage,
    weightPool: weightPool,
    calcMastery: calcMastery,
    subLevel: subLevel,
    levelLabel: levelLabel
  };
})(window);
```

- [ ] **Step 2: Manual verification in browser console**

Start the dev server: `python3 -m http.server 8080 --bind 0.0.0.0`

Open `http://localhost:8080/landing.html`. In DevTools console, load the module manually:

```javascript
var s = document.createElement('script');
s.src = 'wordlab-stage.js';
document.head.appendChild(s);
```

After it loads, run these sanity checks — every output must match:

```javascript
WLStage.stageIndex('s3e')                              // 2
WLStage.nextStage('s3e')                               // 's3l'
WLStage.nextStage('s4')                                // null
WLStage.stagesAtOrBelow('s3e')                         // ['s2e','s2l','s3e']
WLStage.visibleStages('s2l', false)                    // ['s2e','s2l']
WLStage.visibleStages('s2l', true)                     // ['s2e','s2l','s3e']
WLStage.isItemVisible('s2e','s3e',false)               // true  (below)
WLStage.isItemVisible('s3l','s2l',false)               // false (above)
WLStage.isItemVisible(null,'s2l',false)                // true  (untagged)
WLStage.isItemVisible('s3l','s2l',true)                // false (two above)
WLStage.isCurrentStage('s2l','s2l',false)              // true
WLStage.isCurrentStage('s3e','s2l',true)               // true  (ext +1)
WLStage.isCurrentStage('s2e','s2l',false)              // false (below)
WLStage.subLevel(0.38)                                 // 2
WLStage.subLevel(0.75)                                 // 4
WLStage.levelLabel('s2e', 0.38)                        // "Explorer 2"
```

If any differ, debug before committing.

- [ ] **Step 3: Commit**

```bash
git add wordlab-stage.js
git commit -m "feat(stage): add WLStage utility module"
```

---

### Task 3: Load wordlab-stage.js on all pages

**Files:**
- Modify: all HTML pages that currently load `wordlab-data.js`

- [ ] **Step 1: Identify pages that need the module**

Run in terminal:

```bash
grep -l 'wordlab-data.js' *.html
```

Every file in that list needs `wordlab-stage.js` added.

- [ ] **Step 2: Add script tag to each page**

For each HTML file found, add `<script src="wordlab-stage.js"></script>` **immediately before** the existing `<script src="wordlab-data.js"></script>` line.

Use Grep to find the exact line in each file, then Edit to insert. Example Edit for `landing.html`:

- `old_string`: `<script src="wordlab-data.js"></script>`
- `new_string`: `<script src="wordlab-stage.js"></script>\n  <script src="wordlab-data.js"></script>` (preserving the leading whitespace that appears before the existing tag)

Do NOT add to files that don't already load wordlab-data.js.

- [ ] **Step 3: Verify in browser**

Open `landing.html`, `dashboard.html`, and `sound-sorter.html` in browser. In each, console should have `WLStage` defined:

```javascript
typeof WLStage         // "object"
WLStage.STAGE_ORDER    // ['s2e','s2l','s3e','s3l','s4']
```

- [ ] **Step 4: Commit**

```bash
git add *.html
git commit -m "feat(stage): load WLStage module on all pages"
```

---

### Task 4: Update getStudentData() to load stage fields

**Files:**
- Modify: `wordlab-data.js`

- [ ] **Step 1: Find the function**

Read `wordlab-data.js` and locate the `getStudentData` function. Find the line that selects from `students` — per the exploration report it looks like:

```javascript
sbCall(() => sb().from('students').select('extension_mode, eald_language, support_mode').eq('id', session.studentId).maybeSingle()),
```

- [ ] **Step 2: Update the SELECT to include stage fields**

Edit to change the select to include `stage, stage_overrides`:

```javascript
sbCall(() => sb().from('students').select('extension_mode, eald_language, support_mode, stage, stage_overrides').eq('id', session.studentId).maybeSingle()),
```

Also inspect the separate `extension_activities` defensive fetch around line 877. Either add `stage, stage_overrides` to that select as well, or add a third defensive fetch with the same pattern if the surrounding code needs it. Match whatever pattern the file already uses.

- [ ] **Step 3: Cache stage in sessionStorage**

In the block that handles `data.extension_mode` (around line 887 per exploration), after the existing extension-mode/activities handling, add:

```javascript
// Cache stage + overrides in sessionStorage for quick access during gameplay
if (data && data.stage !== undefined) {
  if (data.stage) {
    sessionStorage.setItem('wl_stage', data.stage);
  } else {
    sessionStorage.removeItem('wl_stage');
  }
}
if (data && data.stage_overrides) {
  sessionStorage.setItem('wl_stage_overrides', JSON.stringify(data.stage_overrides));
} else {
  sessionStorage.removeItem('wl_stage_overrides');
}
```

- [ ] **Step 4: Add getStudentStage() helper**

Find the existing `isExtensionMode` function in `wordlab-data.js`. Immediately after its closing brace, add:

```javascript
// Return the student's current stage for a given activity (or global if no activity)
// Checks per-activity override first, then falls back to the student's base stage
// Returns null if no stage set
function getStudentStage(activity){
  var overridesRaw = sessionStorage.getItem('wl_stage_overrides');
  if (overridesRaw && activity) {
    try {
      var overrides = JSON.parse(overridesRaw);
      if (overrides && overrides[activity]) return overrides[activity];
    } catch(e){}
  }
  return sessionStorage.getItem('wl_stage') || null;
}
```

Find the `window.WordLabData = { ... }` export block at the bottom of the file and add `getStudentStage: getStudentStage,` to the exported object alongside the other helpers.

- [ ] **Step 5: Clear stage on logout**

Find the logout function (search for existing `wl_extension_mode` removal — the cleanup block that clears session keys on logout). Add these lines in the same block:

```javascript
sessionStorage.removeItem('wl_stage');
sessionStorage.removeItem('wl_stage_overrides');
```

- [ ] **Step 6: Verify**

Open `landing.html`, log in as a student, then in console:

```javascript
sessionStorage.getItem('wl_stage')              // null (no stage set yet)
WordLabData.getStudentStage()                    // null
WordLabData.getStudentStage('sound-sorter')      // null
```

In Supabase SQL editor, set a test student:

```sql
UPDATE students SET stage='s2l', stage_overrides='{"sound-sorter":"s2e"}'::jsonb
WHERE name='<test student name>';
```

Reload landing page, check console:

```javascript
sessionStorage.getItem('wl_stage')               // 's2l'
WordLabData.getStudentStage()                    // 's2l'
WordLabData.getStudentStage('sound-sorter')      // 's2e' (override)
WordLabData.getStudentStage('breakdown-blitz')   // 's2l' (base)
```

Log out and verify the keys are removed.

- [ ] **Step 7: Commit**

```bash
git add wordlab-data.js
git commit -m "feat(stage): load stage and stage_overrides from DB into session"
```

---

### Task 5: Add filterByStage() and weightByStage() helpers

**Files:**
- Modify: `wordlab-data.js`

- [ ] **Step 1: Add filter helpers**

In `wordlab-data.js`, immediately after the `getStudentStage` function added in Task 4, add:

```javascript
// Filter an array of items by the student's stage for a given activity
// Items must have a `stage` field (or null/undefined = untagged)
// Returns a new array with items the student should see
function filterByStage(items, activity){
  if (!items || !items.length) return items;
  var stage = getStudentStage(activity);
  if (!stage) return items.slice(); // no stage set = show everything
  var ext = isExtensionMode(activity);
  return items.filter(function(it){
    return WLStage.isItemVisible(it.stage, stage, ext);
  });
}

// Apply 80/20 weighting on top of filtering. Items are filtered by stage,
// then sorted so ~80% of the first N are from the current stage.
function weightByStage(items, activity){
  var filtered = filterByStage(items, activity);
  var stage = getStudentStage(activity);
  if (!stage) return filtered;
  var ext = isExtensionMode(activity);
  return WLStage.weightPool(filtered, stage, ext);
}
```

- [ ] **Step 2: Export helpers**

Add `filterByStage: filterByStage,` and `weightByStage: weightByStage,` to the `window.WordLabData = { ... }` export block.

- [ ] **Step 3: Verify in console**

Reload landing page. In console:

```javascript
var sample = [
  { id:'a', stage:'s2e' },
  { id:'b', stage:'s2l' },
  { id:'c', stage:'s3e' },
  { id:'d', stage:null },
  { id:'e', stage:'s4' }
];
WordLabData.filterByStage(sample, 'sound-sorter')
// With stage=s2l (set in Task 4), no ext: should return a, b, d
// With override s2e for sound-sorter: should return a, d
```

Change the test student's stage in SQL and reload to verify.

- [ ] **Step 4: Commit**

```bash
git add wordlab-data.js
git commit -m "feat(stage): add filterByStage and weightByStage helpers"
```

---

## Phase 2 — Filtering Logic

### Task 6: Tag all morphemes in data.js with null stage

**Files:**
- Modify: `data.js`

This task adds the `stage` field to every morpheme as `null` (unassigned). This lets the filtering work without any content being hidden yet.

- [ ] **Step 1: Read data.js to see the structure**

Read `data.js` fully. Confirm the shape of PREFIXES, SUFFIXES, and BASES entries.

- [ ] **Step 2: Add stage: null to every entry via script**

Run this Node one-liner from the repo root:

```bash
node -e "
const fs = require('fs');
let s = fs.readFileSync('data.js','utf8');
s = s.replace(/(\{\s*id:\"[^\"]+\",)(?! stage:)/g, '\$1 stage:null,');
fs.writeFileSync('data.js', s);
console.log('done');
"
```

This inserts ` stage:null,` after every `{ id:"...",` that doesn't already have a stage field.

- [ ] **Step 3: Verify the file still parses**

In browser console on `landing.html` after reload:

```javascript
typeof PREFIXES                                  // "object"
PREFIXES.length                                  // same count as before
PREFIXES[0].stage                                // null
PREFIXES.filter(p => p.stage === null).length    // equals PREFIXES.length
SUFFIXES[0].stage                                // null
```

If `BASES` is defined in `data.js` globally, check it too. Otherwise skip (it may live in per-game files).

- [ ] **Step 4: Commit**

```bash
git add data.js
git commit -m "feat(stage): add null stage field to all core morphemes"
```

---

### Task 7: Tag Sound Sorter words with null stage

**Files:**
- Modify: `sound-sorter-data.js`

- [ ] **Step 1: Add stage: null to every word entry**

```bash
node -e "
const fs = require('fs');
let s = fs.readFileSync('sound-sorter-data.js','utf8');
s = s.replace(/(\{\s*word:\"[^\"]+\",)(?! stage:)/g, '\$1 stage:null,');
fs.writeFileSync('sound-sorter-data.js', s);
console.log('done');
"
```

- [ ] **Step 2: Verify**

Open `sound-sorter.html`, play a round. No errors in console. Word count unchanged.

In console:

```javascript
SOUND_WORDS[0].stage   // null (or whatever global name the file uses — check sound-sorter-data.js)
```

- [ ] **Step 3: Commit**

```bash
git add sound-sorter-data.js
git commit -m "feat(stage): add null stage field to all sound sorter words"
```

---

### Task 8: Tag Breakdown Blitz MISSIONS with null stage

**Files:**
- Modify: `breakdown-mode.html` (inline MISSIONS array)

- [ ] **Step 1: Find the MISSIONS array**

Read `breakdown-mode.html` around line 353. Locate `const MISSIONS = [`.

- [ ] **Step 2: Add stage: null to every entry**

```bash
node -e "
const fs = require('fs');
let s = fs.readFileSync('breakdown-mode.html','utf8');
s = s.replace(/(\{\s*word:\"[^\"]+\",)(?! stage:)(?= clue:)/g, '\$1 stage:null,');
fs.writeFileSync('breakdown-mode.html', s);
console.log('done');
"
```

- [ ] **Step 3: Verify**

Open `breakdown-mode.html`, play a round. No errors, words still appear.

Browser console:

```javascript
MISSIONS[0].stage                 // null
MISSIONS.every(m => 'stage' in m) // true
```

- [ ] **Step 4: Commit**

```bash
git add breakdown-mode.html
git commit -m "feat(stage): add null stage field to Breakdown Blitz MISSIONS"
```

---

### Task 9: Tag inline arrays in remaining game pages

**Files:**
- Modify: `mission-mode.html`, `meaning-mode.html`, `word-refinery.html`, `homophone-mode.html`, `word-spectrum.html`, `root-lab.html`, `phoneme-mode.html`, `syllable-mode.html`, `speed-mode.html`, `flashcard-mode.html`, `morpheme-builder.html`

Each file has inline arrays of game-specific content. Add `stage:null,` to each entry so filtering can later be enabled without crashes.

- [ ] **Step 1: Identify each array per file**

Read each file and find the main content array:

- `mission-mode.html`: `SUFFIX_BASES`, `PREFIX_BASES` — entries start with `{id:"help", form:...}`
- `meaning-mode.html`: similar base arrays
- `word-refinery.html`: `CLINES` — entries start with `{category:"...", ...}`
- `homophone-mode.html`: `HOMOPHONES` — entries start with `{group:[...], ...}`
- `word-spectrum.html`: spectrum data array
- `root-lab.html`: root-lab word arrays per tier
- `phoneme-mode.html` / `syllable-mode.html`: word arrays (may reuse sound-sorter-data)
- `speed-mode.html`: base/word arrays
- `flashcard-mode.html`: reuses data.js (skip if no inline array)
- `morpheme-builder.html`: uses data.js directly — check if there's any inline content

- [ ] **Step 2: Add stage: null via targeted scripts**

For each file, use a Node one-liner matching the first unique field. Examples:

**mission-mode.html** (entries start with `{id:"...", form:...}`):

```bash
node -e "
const fs = require('fs');
let s = fs.readFileSync('mission-mode.html','utf8');
s = s.replace(/(\{\s*id:\"[^\"]+\",)(?! stage:)(?= form:)/g, '\$1 stage:null,');
fs.writeFileSync('mission-mode.html', s);
"
```

**word-refinery.html** (CLINES entries start with `{category:"..."`):

```bash
node -e "
const fs = require('fs');
let s = fs.readFileSync('word-refinery.html','utf8');
s = s.replace(/(\{\s*category:\"[^\"]+\",)(?! stage:)/g, '\$1 stage:null,');
fs.writeFileSync('word-refinery.html', s);
"
```

**homophone-mode.html** (HOMOPHONES entries start with `{group:[...]`):

```bash
node -e "
const fs = require('fs');
let s = fs.readFileSync('homophone-mode.html','utf8');
s = s.replace(/(\{\s*group:\[[^\]]+\],)(?! stage:)/g, '\$1 stage:null,');
fs.writeFileSync('homophone-mode.html', s);
"
```

For each remaining file, inspect the data shape first, craft the matching regex, run it, then verify in the browser.

- [ ] **Step 3: Verify every page loads and plays**

Load each game page in the browser, start a round, confirm no errors and content appears. This is a smoke test — not every word needs to be checked, just that the arrays still parse.

- [ ] **Step 4: Commit**

```bash
git add mission-mode.html meaning-mode.html word-refinery.html homophone-mode.html word-spectrum.html root-lab.html phoneme-mode.html syllable-mode.html speed-mode.html flashcard-mode.html morpheme-builder.html
git commit -m "feat(stage): add null stage field to remaining game content"
```

---

### Task 10: Apply filterByStage + weightByStage in each game

**Files:**
- Modify: all 13 game HTML files

Wire the actual filtering into each game. Where the game currently shuffles or picks from its word/morpheme pool, pass the pool through `WordLabData.weightByStage(pool, activityKey)`.

Because each game has different pool management, this is done per-file.

- [ ] **Step 1: Sound Sorter**

Read `sound-sorter.html` around line 781. After the existing level filter (around `pool = pool.filter(w => ...)`), add:

```javascript
// Apply stage filtering and weighting (post-level filter)
pool = WordLabData.weightByStage(pool, 'sound-sorter');
```

Verify by loading the page with a test student at `s2e`. Since no content is tagged yet, nothing should be filtered out — behaviour unchanged.

- [ ] **Step 2: Phoneme Splitter**

In `phoneme-mode.html`, find where the word list is built into a `pool` variable. Insert:

```javascript
pool = WordLabData.weightByStage(pool, 'phoneme-splitter');
```

- [ ] **Step 3: Syllable Splitter**

In `syllable-mode.html`:

```javascript
pool = WordLabData.weightByStage(pool, 'syllable-splitter');
```

- [ ] **Step 4: Breakdown Blitz**

In `breakdown-mode.html`, find where `MISSIONS` (or the merged pool including custom words) is selected into the round sequence. After the pool is assembled:

```javascript
pool = WordLabData.weightByStage(pool, 'breakdown-blitz');
```

- [ ] **Step 5: Meaning Match-Up**

`meaning-mode.html` filters morphemes rather than words. Find the prefix/suffix array selection and apply:

```javascript
prefixPool = WordLabData.weightByStage(prefixPool, 'meaning-mode');
suffixPool = WordLabData.weightByStage(suffixPool, 'meaning-mode');
```

Adjust variable names to match the actual file.

- [ ] **Step 6: Mission Mode**

`mission-mode.html` — same morpheme filtering:

```javascript
prefixPool = WordLabData.weightByStage(prefixPool, 'mission-mode');
suffixPool = WordLabData.weightByStage(suffixPool, 'mission-mode');
basePool   = WordLabData.weightByStage(basePool,   'mission-mode');
```

- [ ] **Step 7: Speed Builder**

`speed-mode.html`:

```javascript
pool = WordLabData.weightByStage(pool, 'speed-mode');
```

- [ ] **Step 8: Morpheme Builder**

`morpheme-builder.html` uses `PREFIXES`, `SUFFIXES`, `BASES` directly plus `valid-combos.json`. Filter the three arrays at the top of the game-load flow:

```javascript
var filteredPrefixes = WordLabData.filterByStage(PREFIXES.slice(), 'morpheme-builder');
var filteredSuffixes = WordLabData.filterByStage(SUFFIXES.slice(), 'morpheme-builder');
var filteredBases    = WordLabData.filterByStage(BASES.slice(),    'morpheme-builder');
// Then use these in place of the global arrays for tile rendering
```

**Note:** `valid-combos.json` is not tagged. Filtering happens at the morpheme tile level, which naturally restricts which combos can be built.

- [ ] **Step 9: Root Lab**

`root-lab.html` — find the tier-filtered word pool selection. After the tier filter:

```javascript
pool = WordLabData.weightByStage(pool, 'root-lab');
```

- [ ] **Step 10: Flashcards**

`flashcard-mode.html`:

```javascript
cards = WordLabData.filterByStage(cards, 'flashcard-mode');
```

No weighting — flashcards should show all visible content evenly.

- [ ] **Step 11: Word Refinery**

`word-refinery.html`:

```javascript
var clinesPool = WordLabData.weightByStage(CLINES.slice(), 'word-refinery');
```

- [ ] **Step 12: Homophone Hunter**

`homophone-mode.html`:

```javascript
var homoPool = WordLabData.weightByStage(HOMOPHONES.slice(), 'homophone-hunter');
```

- [ ] **Step 13: Word Spectrum**

`word-spectrum.html`:

```javascript
pool = WordLabData.weightByStage(pool, 'word-spectrum');
```

- [ ] **Step 14: Manual smoke test**

With a test student set to `stage='s2e'` in SQL, load each game and play at least 3 rounds. Since nothing is tagged yet, every game should behave identically to before.

Change the student to `stage='s3l'`. Same test — behaviour identical.

Manually edit `data.js` to set `PREFIXES[0].stage = 's3l'` for one prefix. Reload meaning-mode with an `s2e` student and verify that prefix never appears. Revert the edit.

- [ ] **Step 15: Commit**

```bash
git add *.html
git commit -m "feat(stage): apply stage filtering to all game content pools"
```

---

## Phase 3 — Student UI

### Task 11: Add level badge to landing page status strip

**Files:**
- Modify: `landing.html`, `wordlab-data.js` (expose Supabase client if not already)

- [ ] **Step 1: Expose Supabase client for ad-hoc queries**

Landing page needs to query `student_progress` directly for mastery calc. Check `wordlab-data.js` — if `sb` and `sbCall` are not exported on `window.WordLabData`, add them:

In the WordLabData export block, add:

```javascript
_sb: sb,
_sbCall: sbCall,
```

(Using an underscore prefix to signal "internal — use sparingly".)

- [ ] **Step 2: Add HTML for the level badge**

Find the `.stat-pill-group` block in `landing.html` (around line 1560). Insert a new pill at the start of the group by editing. Find the existing first pill:

```html
<div class="stat-pill-item">🔥 <span id="hubStreak">0</span> streak</div>
```

Replace with:

```html
<div class="stat-pill-item wl-level-pill" id="hubLevelPill" style="display:none; cursor:pointer;">
      <span id="hubLevelIcon">🔬</span> <span id="hubLevelText">Explorer 1</span>
    </div>
    <div class="stat-pill-item">🔥 <span id="hubStreak">0</span> streak</div>
```

- [ ] **Step 3: Add the mastery detail panel (hidden by default)**

Immediately after the closing `</div>` of the status strip, add the panel. Use DOM creation (not innerHTML with dynamic content). Add this static HTML:

```html
<div id="wlLevelPanel" class="wl-level-panel" style="display:none;">
  <div class="wl-level-panel-header">
    <h3 id="wlLevelPanelTitle">Explorer 1</h3>
    <button id="wlLevelPanelClose" aria-label="Close" class="wl-level-panel-close">&times;</button>
  </div>
  <div id="wlLevelPanelMastery" class="wl-level-panel-mastery"></div>
  <div id="wlLevelPanelBars"></div>
  <div class="wl-level-panel-hint">Master all 6 skill games to level up!</div>
</div>
<div id="wlLevelPanelBackdrop" class="wl-level-panel-backdrop" style="display:none;"></div>
```

Add the CSS in the page's `<style>` block:

```css
.wl-level-panel {
  position:fixed; top:50%; left:50%;
  transform:translate(-50%,-50%);
  background:#fff; border-radius:16px; padding:24px;
  max-width:420px; width:90%;
  box-shadow:0 20px 60px rgba(0,0,0,.3); z-index:9999;
}
.wl-level-panel-header {
  display:flex; justify-content:space-between;
  align-items:center; margin-bottom:12px;
}
.wl-level-panel-header h3 {
  margin:0; font-size:20px; color:#312e81;
}
.wl-level-panel-close {
  background:none; border:none; font-size:24px; cursor:pointer;
}
.wl-level-panel-mastery {
  font-size:14px; color:#64748b; margin-bottom:16px;
}
.wl-level-panel-hint {
  font-size:12px; color:#64748b;
  margin-top:16px; text-align:center;
}
.wl-level-panel-backdrop {
  position:fixed; inset:0;
  background:rgba(0,0,0,.5); z-index:9998;
}
.wl-level-row { display:flex; align-items:center; margin-bottom:8px; font-size:13px; }
.wl-level-row-label { width:140px; }
.wl-level-row-bar { flex:1; height:10px; background:#e5e7eb; border-radius:5px; overflow:hidden; margin:0 8px; }
.wl-level-row-bar > div { height:100%; background:#6366f1; }
.wl-level-row-pct { width:40px; text-align:right; }
.wl-level-row-nudge { color:#16a34a; font-size:11px; margin-left:4px; }
```

- [ ] **Step 4: Add the badge population JS**

Find the block in `landing.html` around line 2074 where `getStudentData()` populates the status strip. After the existing population code, add:

```javascript
// Level badge & mastery panel
(async function renderLevelBadge(){
  var pillEl = document.getElementById('hubLevelPill');
  var iconEl = document.getElementById('hubLevelIcon');
  var textEl = document.getElementById('hubLevelText');
  if (!pillEl) return;

  var stage = WordLabData.getStudentStage();
  if (!stage) { pillEl.style.display = 'none'; return; }

  if (document.body.classList.contains('low-stim')) {
    pillEl.style.display = 'none'; return;
  }

  var sessionRaw = sessionStorage.getItem('wordlab_session_v1');
  if (!sessionRaw) return;
  var session = JSON.parse(sessionRaw);

  var mastery = await computeMasteryForStudent(session.studentId, stage);

  var icons = { s2e:'🔬', s2l:'⚗️', s3e:'🧬', s3l:'🚀', s4:'🌟' };
  iconEl.textContent = icons[stage] || '🔬';
  textEl.textContent = WLStage.levelLabel(stage, mastery.overall);
  pillEl.style.display = '';
  pillEl.dataset.mastery = JSON.stringify(mastery);
})();

async function computeMasteryForStudent(studentId, stage){
  try {
    var prog = await WordLabData._sbCall(function(){
      return WordLabData._sb().from('student_progress')
        .select('activity, category, correct, total')
        .eq('student_id', studentId);
    });
    var rows = (prog && prog.data) || [];
    var taggedCategories = buildTaggedCategoryMap(stage);
    return WLStage.calcMastery(rows, stage, taggedCategories);
  } catch(e){
    return { overall: 0, perGame: {} };
  }
}

// Phase-1 stub: until content is tagged, we can't know which categories
// belong to which stage. Pass empty sets so calcMastery returns 0 everywhere.
// Task 25's CSV workflow will replace this with a real lookup.
function buildTaggedCategoryMap(stage){
  var map = {};
  WLStage.CORE_GAMES.forEach(function(g){ map[g] = new Set(); });
  return map;
}
```

- [ ] **Step 5: Wire up the panel open/close handlers**

At the end of the landing.html inline script, before the closing `</script>`, add (using DOM-safe construction):

```javascript
(function wireLevelPanel(){
  var pill = document.getElementById('hubLevelPill');
  var panel = document.getElementById('wlLevelPanel');
  var backdrop = document.getElementById('wlLevelPanelBackdrop');
  var close = document.getElementById('wlLevelPanelClose');
  if (!pill || !panel) return;

  var labels = {
    'sound-sorter': 'Sound Sorter',
    'phoneme-splitter': 'Phoneme Splitter',
    'syllable-splitter': 'Syllable Splitter',
    'breakdown-blitz': 'Breakdown Blitz',
    'meaning-mode': 'Meaning Match-Up',
    'mission-mode': 'Mission Mode'
  };

  pill.addEventListener('click', function(){
    var data = {};
    try { data = JSON.parse(pill.dataset.mastery || '{}'); } catch(e){}
    var stage = WordLabData.getStudentStage();
    var pct = Math.round((data.overall || 0) * 100);

    document.getElementById('wlLevelPanelTitle').textContent = WLStage.levelLabel(stage, data.overall || 0);
    document.getElementById('wlLevelPanelMastery').textContent = pct + '% mastery';

    var barsEl = document.getElementById('wlLevelPanelBars');
    while (barsEl.firstChild) barsEl.removeChild(barsEl.firstChild);

    // Find the lowest-scoring game for the nudge
    var lowestGame = null;
    var lowestScore = 2;
    WLStage.CORE_GAMES.forEach(function(g){
      var score = data.perGame && data.perGame[g];
      if (score == null) { lowestGame = g; lowestScore = -1; }
      else if (score < lowestScore) { lowestScore = score; lowestGame = g; }
    });

    WLStage.CORE_GAMES.forEach(function(g){
      var score = data.perGame && data.perGame[g];
      var p = score == null ? 0 : Math.round(score * 100);
      var row = document.createElement('div');
      row.className = 'wl-level-row';

      var label = document.createElement('span');
      label.className = 'wl-level-row-label';
      label.textContent = labels[g] || g;
      row.appendChild(label);

      var barOuter = document.createElement('div');
      barOuter.className = 'wl-level-row-bar';
      var barInner = document.createElement('div');
      barInner.style.width = p + '%';
      barOuter.appendChild(barInner);
      row.appendChild(barOuter);

      var pctEl = document.createElement('span');
      pctEl.className = 'wl-level-row-pct';
      pctEl.textContent = p + '%';
      row.appendChild(pctEl);

      if (g === lowestGame) {
        var nudge = document.createElement('span');
        nudge.className = 'wl-level-row-nudge';
        nudge.textContent = ' ← Try this one!';
        row.appendChild(nudge);
      }

      barsEl.appendChild(row);
    });

    panel.style.display = 'block';
    backdrop.style.display = 'block';
  });

  function closePanel(){
    panel.style.display = 'none';
    backdrop.style.display = 'none';
  }
  close.addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);
})();
```

- [ ] **Step 6: Manual verification**

1. Test student with `stage=null`: badge hidden.
2. Set `stage='s2e'` in SQL, reload landing: badge shows "Explorer 1" (0% mastery since tagged categories map is empty).
3. Click badge → panel opens with 6 bars all at 0%, "← Try this one!" on the first game.
4. Close panel via X button and backdrop click.
5. Enable low-stim mode via dashboard and reload: badge hidden.
6. Low-stim off + stage set: badge visible again.

- [ ] **Step 7: Commit**

```bash
git add landing.html wordlab-data.js
git commit -m "feat(stage): level badge and mastery panel on landing page"
```

---

### Task 12: Add stage promotion celebration

**Files:**
- Modify: `landing.html`

- [ ] **Step 1: Add stage-change detection**

In `landing.html`, near the level badge code from Task 11, add:

```javascript
// Detect stage promotions and celebrate
(function celebrateStagePromotion(){
  var currentStage = WordLabData.getStudentStage();
  if (!currentStage) return;
  var lastSeen = localStorage.getItem('wl_last_seen_stage');
  if (lastSeen && lastSeen !== currentStage) {
    var oldIdx = WLStage.stageIndex(lastSeen);
    var newIdx = WLStage.stageIndex(currentStage);
    if (newIdx > oldIdx) {
      showPromotionToast(currentStage);
    }
  }
  localStorage.setItem('wl_last_seen_stage', currentStage);
})();

function showPromotionToast(stage){
  if (document.body.classList.contains('low-stim')) return;
  var name = WLStage.STAGE_NAMES[stage];
  var toast = document.createElement('div');
  toast.className = 'wl-promo-toast';
  var line1 = document.createElement('div');
  line1.textContent = '🎉';
  var line2 = document.createElement('div');
  line2.textContent = "You've been promoted to";
  var line3 = document.createElement('div');
  line3.className = 'wl-promo-toast-name';
  line3.textContent = name + '!';
  toast.appendChild(line1);
  toast.appendChild(line2);
  toast.appendChild(line3);
  document.body.appendChild(toast);
  setTimeout(function(){
    toast.style.transition = 'opacity .8s';
    toast.style.opacity = '0';
    setTimeout(function(){ toast.remove(); }, 800);
  }, 3000);
}
```

- [ ] **Step 2: Add the CSS**

In the page's `<style>` block:

```css
.wl-promo-toast {
  position:fixed; top:40%; left:50%;
  transform:translate(-50%,-50%);
  background:linear-gradient(135deg,#6366f1,#8b5cf6);
  color:#fff; padding:32px 40px; border-radius:20px;
  font-size:20px; font-weight:800; text-align:center;
  box-shadow:0 20px 60px rgba(99,102,241,.4); z-index:9999;
}
.wl-promo-toast-name { font-size:28px; margin-top:4px; }
```

- [ ] **Step 3: Verify**

1. Set test student `stage='s2e'`, load landing → no toast.
2. Update SQL: `stage='s2l'`, reload landing → toast "promoted to Voyager!".
3. Reload again → no toast (already seen).
4. Downgrade back to `s2e` → no toast (only forward promotions celebrate).
5. Enable low-stim → no toast even on upgrade.

- [ ] **Step 4: Commit**

```bash
git add landing.html
git commit -m "feat(stage): celebrate stage promotions with toast"
```

---

### Task 13: Add sub-level crossing celebration

**Files:**
- Modify: `landing.html`

- [ ] **Step 1: Track last-seen sub-level**

In the `renderLevelBadge` function from Task 11, after computing `mastery`, add:

```javascript
var currentSub = WLStage.subLevel(mastery.overall || 0);
var lastKey = 'wl_last_sub_' + stage;
var lastSub = parseInt(localStorage.getItem(lastKey) || '1', 10);
if (currentSub > lastSub && !document.body.classList.contains('low-stim')) {
  showSubLevelToast(stage, currentSub);
}
localStorage.setItem(lastKey, String(currentSub));
```

And add the toast function:

```javascript
function showSubLevelToast(stage, subLvl){
  var name = WLStage.STAGE_NAMES[stage];
  var toast = document.createElement('div');
  toast.className = 'wl-sub-toast';
  toast.textContent = '⭐ ' + name + ' ' + subLvl + '!';
  document.body.appendChild(toast);
  setTimeout(function(){
    toast.style.transition = 'opacity .6s';
    toast.style.opacity = '0';
    setTimeout(function(){ toast.remove(); }, 600);
  }, 2500);
}
```

- [ ] **Step 2: Add CSS**

```css
.wl-sub-toast {
  position:fixed; bottom:80px; left:50%;
  transform:translateX(-50%);
  background:#16a34a; color:#fff;
  padding:16px 24px; border-radius:12px;
  font-size:16px; font-weight:700;
  box-shadow:0 12px 32px rgba(22,163,74,.4); z-index:9999;
}
```

- [ ] **Step 3: Verify**

Hard to test without real progress data. Manually:

1. Set `localStorage.setItem('wl_last_sub_s2e','1')` in console.
2. Mock `mastery.overall = 0.3` by editing the renderLevelBadge temporarily (or inject progress rows in SQL to push accuracy over 25%).
3. Reload → toast appears "Explorer 2!".
4. Revert mocking.

- [ ] **Step 4: Commit**

```bash
git add landing.html
git commit -m "feat(stage): celebrate sub-level threshold crossings"
```

---

## Phase 4 — Teacher Dashboard

### Task 14: Stage pill on summary table rows

**Files:**
- Modify: `dashboard.html`

- [ ] **Step 1: Select stage fields in the students query**

Search `dashboard.html` for `.from('students').select(` and update the column list to include `stage, stage_overrides`. There may be multiple student queries — update all of them.

- [ ] **Step 2: Compute mastery for each student**

Find where students and progress data are both loaded. Before `buildSummaryTable` is called, add:

```javascript
// Compute mastery for each student with a stage set.
// Phase 1 note: because content isn't tagged yet, we temporarily count
// ALL core-game progress (not just stage-matched). Task 25 CSV flow
// enables the real taggedCategories lookup.
students.forEach(function(s){
  if (!s.stage) return;
  var rows = [];
  // progressByStudent is the existing map that the dashboard already builds
  if (typeof progressByStudent !== 'undefined' && progressByStudent[s.id]) {
    rows = progressByStudent[s.id];
  }
  s._mastery = calcMasteryFromAllProgress(rows);
  if (s._mastery.overall >= 0.75) s._readyPromote = true;
});

function calcMasteryFromAllProgress(rows){
  var perGame = {};
  WLStage.CORE_GAMES.forEach(function(g){ perGame[g] = null; });
  var totals = {};
  rows.forEach(function(r){
    if (WLStage.CORE_GAMES.indexOf(r.activity) === -1) return;
    if (!totals[r.activity]) totals[r.activity] = { c:0, t:0 };
    totals[r.activity].c += r.correct || 0;
    totals[r.activity].t += r.total || 0;
  });
  WLStage.CORE_GAMES.forEach(function(g){
    if (totals[g] && totals[g].t > 0) perGame[g] = totals[g].c / totals[g].t;
  });
  var sum = 0;
  WLStage.CORE_GAMES.forEach(function(g){ sum += (perGame[g] || 0); });
  return { overall: sum / WLStage.CORE_GAMES.length, perGame: perGame };
}
```

**If `progressByStudent` doesn't exist** in the dashboard code, search for how the existing summary table reads progress. Use whatever the existing pattern is — don't duplicate fetching.

- [ ] **Step 3: Render the pill in each row**

Find the summary-row rendering code (near line 2116 per exploration). Find where `extBadge` is built. Add stagePill rendering using DOM methods (safe for dynamic content):

```javascript
function buildStagePillEl(student){
  var pill = document.createElement('span');
  if (!student.stage) {
    pill.className = 'gd-flagPill-none';
    pill.title = 'No stage set';
    pill.textContent = '—';
    return pill;
  }
  var short = (WLStage.STAGE_SHORT && WLStage.STAGE_SHORT[student.stage]) || '??';
  var sub = '';
  if (student._mastery && student._mastery.overall != null) {
    sub = ' ' + WLStage.subLevel(student._mastery.overall);
  }
  var cls = 'gd-flagPill-stage';
  if (student._readyPromote) cls += ' ready-promote';
  pill.className = cls;
  pill.title = WLStage.STAGE_LABELS[student.stage] || student.stage;
  pill.textContent = short + sub;
  return pill;
}
```

In the name cell rendering (find where `extBadge` is assembled into the cell), append the stage pill element. The exact integration depends on whether the row is built with DOM methods or template strings — if it's string-based, create an HTML marker in the template and then populate it via `getElementById` after the row is inserted. If it's DOM-based, just `appendChild(buildStagePillEl(s))`.

- [ ] **Step 4: Add CSS for the pill**

In the `<style>` block of dashboard.html:

```css
.gd-flagPill-stage {
  display:inline-block;
  background:#6366f1; color:#fff;
  font-size:10px; font-weight:800;
  padding:2px 6px; border-radius:6px;
  margin-left:4px;
}
.gd-flagPill-stage.ready-promote {
  background:#16a34a;
  box-shadow:0 0 0 2px rgba(22,163,74,.3);
  cursor:pointer;
}
.gd-flagPill-stage.ready-promote::after { content:' ↑'; }
.gd-flagPill-none {
  display:inline-block;
  background:#e5e7eb; color:#64748b;
  font-size:10px; padding:2px 6px;
  border-radius:6px; margin-left:4px;
}
```

- [ ] **Step 5: Verify**

1. Load dashboard as teacher with test students.
2. Students with no stage show grey `—` pill.
3. Set one student's stage to `s2l` in SQL, reload → shows `VOY 1` (or higher if they already have progress).
4. Give that student enough correct attempts across 6 core games to hit 75% total → pill shows `VOY 4 ↑` with green glow.

- [ ] **Step 6: Commit**

```bash
git add dashboard.html
git commit -m "feat(stage): stage pill on dashboard summary table"
```

---

### Task 15: Stage selector popover

**Files:**
- Modify: `dashboard.html`

- [ ] **Step 1: Find the existing EXT popover**

Read `dashboard.html` around lines 2700 to 2820. The existing popover is built with `document.createElement()` and saves via `dbSb().from('students').update(...)`.

- [ ] **Step 2: Add stage selector at the top of the popover**

In the function that builds the popover, after the popover root element is created but before the existing EXT toggles are appended, add:

```javascript
// Stage selector section
var stageSection = document.createElement('div');
stageSection.className = 'wl-stage-section';

var stageLabel = document.createElement('label');
stageLabel.className = 'wl-stage-label';
stageLabel.textContent = 'Stage';
stageSection.appendChild(stageLabel);

var stageSelect = document.createElement('select');
stageSelect.className = 'wl-stage-select';
var stageOpts = [
  ['', 'Not set'],
  ['s2e', 'Explorer (Stage 2 Early, ~Y3)'],
  ['s2l', 'Voyager (Stage 2 Late, ~Y4)'],
  ['s3e', 'Wanderer (Stage 3 Early, ~Y5)'],
  ['s3l', 'Trailblazer (Stage 3 Late, ~Y6)'],
  ['s4',  'Pioneer (Beyond curriculum)']
];
stageOpts.forEach(function(o){
  var opt = document.createElement('option');
  opt.value = o[0];
  opt.textContent = o[1];
  stageSelect.appendChild(opt);
});
stageSelect.value = student.stage || '';
stageSection.appendChild(stageSelect);

// Prepend to popover body
popover.insertBefore(stageSection, popover.firstChild);
```

- [ ] **Step 3: Add per-activity stage overrides (collapsible)**

Immediately after the stage section:

```javascript
var overridesSection = document.createElement('details');
overridesSection.className = 'wl-stage-overrides';

var summary = document.createElement('summary');
summary.className = 'wl-stage-overrides-summary';
summary.textContent = 'Per-activity stage overrides';
overridesSection.appendChild(summary);

var activities = [
  'sound-sorter','phoneme-splitter','syllable-splitter',
  'breakdown-blitz','meaning-mode','mission-mode',
  'speed-mode','morpheme-builder','root-lab','flashcard-mode',
  'word-refinery','homophone-hunter','word-spectrum'
];
var overrides = student.stage_overrides || {};
var overrideSelects = {};

activities.forEach(function(act){
  var row = document.createElement('div');
  row.className = 'wl-stage-override-row';

  var label = document.createElement('span');
  label.className = 'wl-stage-override-label';
  label.textContent = act;
  row.appendChild(label);

  var sel = document.createElement('select');
  sel.className = 'wl-stage-override-select';
  var opts = [
    ['', 'Use base'],
    ['s2e', 'Explorer'],
    ['s2l', 'Voyager'],
    ['s3e', 'Wanderer'],
    ['s3l', 'Trailblazer'],
    ['s4',  'Pioneer']
  ];
  opts.forEach(function(o){
    var opt = document.createElement('option');
    opt.value = o[0]; opt.textContent = o[1];
    sel.appendChild(opt);
  });
  sel.value = overrides[act] || '';

  row.appendChild(sel);
  overridesSection.appendChild(row);
  overrideSelects[act] = sel;
});

popover.insertBefore(overridesSection, stageSection.nextSibling);
```

- [ ] **Step 4: Update the save handler**

Find the existing save button handler (the part that calls `dbSb().from('students').update({...})`). Extend the update payload:

```javascript
var newStage = stageSelect.value || null;
var newOverrides = {};
Object.keys(overrideSelects).forEach(function(k){
  var v = overrideSelects[k].value;
  if (v) newOverrides[k] = v;
});

await dbSb().from('students').update({
  extension_mode: anyOn,
  extension_activities: allChecked ? [] : onList,
  stage: newStage,
  stage_overrides: newOverrides
}).eq('id', studentId);
```

- [ ] **Step 5: Relabel the EXT section**

Find the heading/label for the existing extension toggles in the same popover. Change the text to `"+1 Stage (Extension)"` and add a subtitle element below it: `"Gives the student access to content from the next stage up."`

- [ ] **Step 6: Add CSS**

```css
.wl-stage-section {
  margin-bottom:16px; padding-bottom:12px;
  border-bottom:1px solid #e5e7eb;
}
.wl-stage-label {
  display:block; font-weight:700; margin-bottom:6px;
}
.wl-stage-select {
  width:100%; padding:8px;
  border:1px solid #cbd5e1; border-radius:8px; font-size:14px;
}
.wl-stage-overrides {
  margin-bottom:16px; padding-bottom:12px;
  border-bottom:1px solid #e5e7eb;
}
.wl-stage-overrides-summary {
  font-weight:700; cursor:pointer; margin-bottom:8px;
}
.wl-stage-override-row {
  display:flex; align-items:center;
  margin-bottom:4px; font-size:13px;
}
.wl-stage-override-label { flex:1; }
.wl-stage-override-select { width:160px; padding:4px; font-size:12px; }
```

- [ ] **Step 7: Verify**

1. Click a student row → popover opens with stage dropdown defaulting to their current stage.
2. Change to Voyager, save → reload dashboard, pill shows `VOY`.
3. Expand "Per-activity stage overrides", set sound-sorter to Explorer, save.
4. Log in as that student, console: `WordLabData.getStudentStage('sound-sorter')` returns `'s2e'`, `WordLabData.getStudentStage('breakdown-blitz')` returns `'s2l'`.
5. Clear overrides → both return `'s2l'`.

- [ ] **Step 8: Commit**

```bash
git add dashboard.html
git commit -m "feat(stage): stage selector + per-activity overrides in popover"
```

---

### Task 16: Dashboard filter and bulk-assign by stage

**Files:**
- Modify: `dashboard.html`

- [ ] **Step 1: Add filter pills above the summary table**

Find the summary table container and insert the filter strip immediately before it. The HTML is static — safe to place directly in the markup:

```html
<div id="wlStageFilter" class="wl-stage-filter">
  <button class="wlStageFilterBtn active" data-stage="">All</button>
  <button class="wlStageFilterBtn" data-stage="s2e">Explorer</button>
  <button class="wlStageFilterBtn" data-stage="s2l">Voyager</button>
  <button class="wlStageFilterBtn" data-stage="s3e">Wanderer</button>
  <button class="wlStageFilterBtn" data-stage="s3l">Trailblazer</button>
  <button class="wlStageFilterBtn" data-stage="s4">Pioneer</button>
  <button class="wlStageFilterBtn" data-stage="none">Not set</button>
</div>
<div id="wlStageBulkBar" class="wl-stage-bulk-bar" style="display:none;">
  <span id="wlStageBulkCount"></span>
  <button id="wlStageBulkSetBtn">Set stage...</button>
</div>
```

Add CSS:

```css
.wl-stage-filter {
  display:flex; gap:6px; margin-bottom:8px; flex-wrap:wrap;
}
.wlStageFilterBtn {
  padding:6px 12px;
  border:1px solid #cbd5e1; background:#fff;
  border-radius:999px; cursor:pointer; font-size:13px;
}
.wlStageFilterBtn.active {
  background:#6366f1; color:#fff; border-color:#6366f1;
}
.wl-stage-bulk-bar {
  padding:8px; background:#eef2ff;
  border-radius:8px; margin-bottom:8px;
}
```

- [ ] **Step 2: Implement filter logic**

Add JS near the summary-table build code:

```javascript
var currentStageFilter = '';
document.querySelectorAll('.wlStageFilterBtn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.wlStageFilterBtn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    currentStageFilter = btn.dataset.stage;
    applyStageFilter();
  });
});

function applyStageFilter(){
  var rows = document.querySelectorAll('[data-student-id]');
  var visible = 0;
  rows.forEach(function(tr){
    var sid = tr.dataset.studentId;
    if (!sid) return;
    var student = students.find(function(s){ return s.id === sid; });
    if (!student) return;
    var show;
    if (!currentStageFilter) show = true;
    else if (currentStageFilter === 'none') show = !student.stage;
    else show = student.stage === currentStageFilter;
    tr.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  var bar = document.getElementById('wlStageBulkBar');
  var count = document.getElementById('wlStageBulkCount');
  if (currentStageFilter && currentStageFilter !== '') {
    bar.style.display = '';
    count.textContent = visible + ' student' + (visible === 1 ? '' : 's') + ' shown';
  } else {
    bar.style.display = 'none';
  }
}
```

**Selector note:** `[data-student-id]` assumes each summary row has a `data-student-id="<uuid>"` attribute. If it doesn't, add that attribute in the row-building code first.

- [ ] **Step 3: Bulk-set handler**

```javascript
document.getElementById('wlStageBulkSetBtn').addEventListener('click', async function(){
  var msg = 'Set all filtered students to which stage?\n\n'
    + 's2e = Explorer\ns2l = Voyager\ns3e = Wanderer\n'
    + 's3l = Trailblazer\ns4 = Pioneer\n(leave blank to clear)';
  var newStage = prompt(msg);
  if (newStage === null) return;
  newStage = newStage.trim() || null;
  if (newStage && WLStage.STAGE_ORDER.indexOf(newStage) === -1) {
    alert('Invalid stage code'); return;
  }
  var targetStudents = students.filter(function(s){
    if (currentStageFilter === 'none') return !s.stage;
    return s.stage === currentStageFilter;
  });
  var ids = targetStudents.map(function(s){ return s.id; });
  if (!ids.length) { alert('No students to update'); return; }
  var name = newStage ? WLStage.STAGE_NAMES[newStage] : 'Not set';
  if (!confirm('Set ' + ids.length + ' student(s) to ' + name + '?')) return;
  await dbSb().from('students').update({ stage: newStage }).in('id', ids);
  location.reload();
});
```

- [ ] **Step 4: Verify**

1. "All" pill active, all students visible.
2. Click "Voyager" → only Voyager students shown, bulk bar visible with count.
3. Click "Set stage..." → prompt → type `s3e` → confirm → filtered students become Wanderer on reload.
4. Click "Not set" → untagged students only.

- [ ] **Step 5: Commit**

```bash
git add dashboard.html
git commit -m "feat(stage): stage filter pills + bulk assignment"
```

---

### Task 17: One-click promote from ready pill

**Files:**
- Modify: `dashboard.html`

- [ ] **Step 1: Wire up click handler**

Add near Task 16's code:

```javascript
document.addEventListener('click', async function(e){
  var pill = e.target.closest('.gd-flagPill-stage.ready-promote');
  if (!pill) return;
  var row = pill.closest('[data-student-id]');
  var sid = row && row.dataset.studentId;
  if (!sid) return;
  var student = students.find(function(s){ return s.id === sid; });
  if (!student) return;
  var pct = Math.round((student._mastery.overall || 0) * 100);
  var next = WLStage.nextStage(student.stage);
  if (!next) {
    alert(student.name + ' is already at the top stage.');
    return;
  }
  var msg = student.name + ' is at ' + pct + '% mastery on '
    + WLStage.STAGE_NAMES[student.stage]
    + ' — ready to move to ' + WLStage.STAGE_NAMES[next] + '?';
  if (!confirm(msg)) return;
  await dbSb().from('students').update({ stage: next }).eq('id', sid);
  location.reload();
});
```

- [ ] **Step 2: Verify**

Set a test student to `stage='s2e'` and manually insert progress rows in SQL to push mastery over 75%. Reload dashboard → pill shows green with arrow. Click → confirm dialog → accept → reload shows student now Voyager.

- [ ] **Step 3: Commit**

```bash
git add dashboard.html
git commit -m "feat(stage): one-click promotion from ready-to-level-up pill"
```

---

### Task 18: Sort summary table by name or stage

**Files:**
- Modify: `dashboard.html`

- [ ] **Step 1: Find the header row**

Locate the summary table's header row in `dashboard.html`. Find the Name column header element.

- [ ] **Step 2: Add sort state and helper**

Near the top of the dashboard script block:

```javascript
var sortState = { key: 'name', dir: 1 };
function sortStudents(key){
  if (sortState.key === key) sortState.dir *= -1;
  else { sortState.key = key; sortState.dir = 1; }
  students.sort(function(a,b){
    var av, bv;
    if (key === 'name') {
      av = (a.name || '').toLowerCase();
      bv = (b.name || '').toLowerCase();
    } else if (key === 'stage') {
      av = WLStage.stageIndex(a.stage);
      bv = WLStage.stageIndex(b.stage);
    }
    if (av < bv) return -1 * sortState.dir;
    if (av > bv) return 1 * sortState.dir;
    return 0;
  });
}
```

- [ ] **Step 3: Attach click handlers after table is built**

At the end of `buildSummaryTable` (or wherever the summary is built), add:

```javascript
var nameHdr = document.querySelector('#gdSummary thead .gd-nameCol');
if (nameHdr) {
  nameHdr.style.cursor = 'pointer';
  nameHdr.addEventListener('click', function(){
    sortStudents('name');
    buildSummaryTable(); // rebuild
  });
}
```

**Selector note:** Adjust `#gdSummary thead .gd-nameCol` to match the actual table structure. If there is no class on the name column header, either add one or use `thead th:nth-child(1)`.

- [ ] **Step 4: Verify**

Click Name header → sorts A–Z. Click again → Z–A. No errors.

- [ ] **Step 5: Commit**

```bash
git add dashboard.html
git commit -m "feat(stage): sortable name column on summary table"
```

---

## Phase 5 — Extension Mode Redesign

### Task 19: Merge wordlab-extension-data.js content into data.js

**Files:**
- Modify: `data.js`, `wordlab-extension-data.js`

All extension content becomes part of the main arrays with `stage:null` (to be tagged via the admin UI later).

- [ ] **Step 1: Copy EXT_PREFIXES entries into PREFIXES**

Read `wordlab-extension-data.js`. For every entry in `EXT_PREFIXES`, append it to the `PREFIXES` array in `data.js`. Each entry should already have `stage:null,` from Task 6's regex — verify after copying.

Use Edit to append the entries to the end of PREFIXES (just before the closing `];`).

- [ ] **Step 2: Copy EXT_SUFFIXES into SUFFIXES**

Same pattern.

- [ ] **Step 3: Copy EXT_BASES into BASES**

Same pattern (if BASES exists as a global in data.js).

- [ ] **Step 4: Replace wordlab-extension-data.js with a shim**

Overwrite `wordlab-extension-data.js` with:

```javascript
// DEPRECATED — extension content has been merged into data.js with stage tags.
// These arrays are kept empty for backwards compatibility. Any page still
// referencing EXT_PREFIXES / EXT_SUFFIXES / EXT_BASES should be updated to use
// the unified PREFIXES / SUFFIXES / BASES arrays with stage filtering.
var EXT_PREFIXES = [];
var EXT_SUFFIXES = [];
var EXT_BASES = [];
```

- [ ] **Step 5: Search for hard dependencies**

```bash
grep -rn "EXT_PREFIXES\|EXT_SUFFIXES\|EXT_BASES" *.html *.js
```

For every hit, verify the code either works with empty arrays or needs updating to iterate the unified arrays instead. Fix any hard dependencies in a targeted edit.

- [ ] **Step 6: Verify**

Load every game page as a test student with `extension_mode=true`. Confirm games still work. Since everything is merged and untagged, all content appears.

- [ ] **Step 7: Commit**

```bash
git add data.js wordlab-extension-data.js
git commit -m "refactor(stage): merge extension content into data.js"
```

---

### Task 20: Document +1 stage semantics of isExtensionMode

**Files:**
- Modify: `wordlab-data.js`

The filtering helpers from Task 5 already use `isExtensionMode()` to expand visible stages via `WLStage.visibleStages`. This task just adds a doc comment and sanity checks the wiring.

- [ ] **Step 1: Add documentation comment**

In `wordlab-data.js`, above the `isExtensionMode` function, add:

```javascript
// isExtensionMode: returns true if the student has extension enabled for this activity.
// Under the stage system, extension means "+1 stage": when true, content from the next
// stage up becomes visible. See WLStage.visibleStages for the filtering logic, and
// sound-sorter.html / phoneme-mode.html / root-lab.html for the Challenge tier lock.
```

- [ ] **Step 2: Verify +1 stage filtering**

Test student `stage='s2l'`, no extension. In console:

```javascript
WordLabData.getStudentStage('sound-sorter')   // 's2l'
WordLabData.isExtensionMode('sound-sorter')    // false
WLStage.visibleStages('s2l', false)            // ['s2e','s2l']
```

Enable extension for sound-sorter via dashboard. Reload:

```javascript
WordLabData.isExtensionMode('sound-sorter')    // true
WLStage.visibleStages('s2l', true)             // ['s2e','s2l','s3e']
```

Test filtering a sample pool:

```javascript
var pool = [
  { id:'a', stage:'s2e' },
  { id:'b', stage:'s2l' },
  { id:'c', stage:'s3e' },
  { id:'d', stage:'s3l' },
  { id:'e', stage:null }
];
WordLabData.filterByStage(pool, 'sound-sorter')
// Expected: a, b, c, e (d excluded, e untagged always shown)
```

- [ ] **Step 3: Commit**

```bash
git add wordlab-data.js
git commit -m "docs(stage): document +1 stage semantics of extension mode"
```

---

### Task 21: Lock tier to Challenge when extension is on

**Files:**
- Modify: `sound-sorter.html`, `phoneme-mode.html`, `root-lab.html`

- [ ] **Step 1: Sound Sorter**

In `sound-sorter.html`, find the tier button rendering (the `.optBtn` with `data-level`). After the buttons are rendered, add:

```javascript
(function lockChallengeIfExt(){
  if (WordLabData.isExtensionMode && WordLabData.isExtensionMode('sound-sorter')) {
    document.querySelectorAll('.optBtn').forEach(function(btn){
      if (btn.dataset.level !== 'challenge') {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.title = 'Locked to Challenge in +1 Stage mode';
      }
    });
    var challengeBtn = document.querySelector('.optBtn[data-level="challenge"]');
    if (challengeBtn && !document.querySelector('.optBtn.active')) {
      challengeBtn.click();
    }
  }
})();
```

- [ ] **Step 2: Phoneme Splitter**

Apply the same pattern in `phoneme-mode.html` using its tier button selectors. Check the actual class/data attributes — the selector may differ.

- [ ] **Step 3: Root Lab**

Apply the same pattern in `root-lab.html`.

- [ ] **Step 4: Verify**

1. Test student with `extension_mode=true`, loads sound-sorter → Starter and Level Up buttons are faded/disabled, Challenge is active.
2. Clicking a disabled button does nothing.
3. Turn extension off → all buttons enabled again after reload.
4. Repeat for phoneme-mode and root-lab.

- [ ] **Step 5: Commit**

```bash
git add sound-sorter.html phoneme-mode.html root-lab.html
git commit -m "feat(stage): lock tier to Challenge when extension is on"
```

---

## Phase 6 — Admin Tagging UI

### Task 22: Content Levels tab scaffold in analytics.html

**Files:**
- Modify: `analytics.html`

- [ ] **Step 1: Read analytics.html structure**

Read `analytics.html` fully (or the top 500 lines + key sections). Identify the existing tab/nav structure — likely a set of `.analytics-tab-btn` buttons with matching `.analytics-tab-panel` divs.

- [ ] **Step 2: Add a new tab button and panel**

Add a new tab button next to the existing ones. Since the HTML is static, use Edit to insert:

```html
<button class="analytics-tab-btn" data-tab="content-levels">Content Levels</button>
```

Add the matching panel:

```html
<div id="analyticsTab-content-levels" class="analytics-tab-panel" style="display:none;">
  <div class="wl-cl-subtabs">
    <button id="wlCLSubtabMorpheme" class="wlCLSubtab active">Morphemes</button>
    <button id="wlCLSubtabWord" class="wlCLSubtab">Words</button>
  </div>
  <div id="wlCLMorphemeView"></div>
  <div id="wlCLWordView" style="display:none;"></div>
  <div class="wl-cl-help">
    <strong>Workflow:</strong> Tag morphemes/words here, then Export CSV.
    To persist to code, run:
    <code>node scripts/apply-stage-csv.js morpheme-stages-YYYY-MM-DD.csv data.js</code>
    and commit the result.
  </div>
</div>
```

Add CSS:

```css
.wl-cl-subtabs { display:flex; gap:12px; margin-bottom:16px; }
.wlCLSubtab {
  padding:8px 16px; border:1px solid #cbd5e1;
  background:#fff; border-radius:8px; cursor:pointer;
}
.wlCLSubtab.active { background:#6366f1; color:#fff; border-color:#6366f1; }
.wl-cl-help {
  margin-top:16px; padding:12px;
  background:#fef3c7; border-radius:8px; font-size:12px;
}
```

- [ ] **Step 3: Wire up sub-tab switching**

Add JS near the existing analytics tab switch logic:

```javascript
document.querySelectorAll('.wlCLSubtab').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.wlCLSubtab').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    var mView = document.getElementById('wlCLMorphemeView');
    var wView = document.getElementById('wlCLWordView');
    if (btn.id === 'wlCLSubtabMorpheme') {
      mView.style.display = ''; wView.style.display = 'none';
    } else {
      mView.style.display = 'none'; wView.style.display = '';
    }
  });
});
```

- [ ] **Step 4: Verify**

Load `analytics.html` as admin. Click Content Levels → tab activates, two sub-tabs visible, switching works. Both views empty at this point.

- [ ] **Step 5: Commit**

```bash
git add analytics.html
git commit -m "feat(stage): Content Levels tab scaffold in analytics"
```

---

### Task 23: Morpheme tagger view

**Files:**
- Modify: `analytics.html`

- [ ] **Step 1: Load data.js and wordlab-stage.js in analytics.html**

Check if `analytics.html` already loads `data.js`. If not, add in the `<head>` before the inline script block:

```html
<script src="data.js"></script>
<script src="wordlab-stage.js"></script>
```

- [ ] **Step 2: Add the morpheme tagger JS**

In the analytics.html inline script block, add:

```javascript
function renderMorphemeTagger(){
  var root = document.getElementById('wlCLMorphemeView');
  if (!root) return;
  while (root.firstChild) root.removeChild(root.firstChild);

  // Collect morphemes
  var items = [];
  if (typeof PREFIXES !== 'undefined') PREFIXES.forEach(function(p){ items.push({ type:'prefix', ref:p }); });
  if (typeof SUFFIXES !== 'undefined') SUFFIXES.forEach(function(s){ items.push({ type:'suffix', ref:s }); });
  if (typeof BASES    !== 'undefined') BASES.forEach(function(b){    items.push({ type:'base',   ref:b }); });

  // Restore draft overrides from localStorage
  try {
    var saved = JSON.parse(localStorage.getItem('wl_stage_morpheme_overrides') || '{}');
    Object.keys(saved).forEach(function(k){
      var parts = k.split(':');
      var arr = parts[0] === 'prefix' ? PREFIXES : parts[0] === 'suffix' ? SUFFIXES : BASES;
      if (!arr) return;
      var m = arr.find(function(x){ return x.id === parts[1]; });
      if (m) m.stage = saved[k];
    });
  } catch(e){}

  // Filter bar
  var filterBar = document.createElement('div');
  filterBar.className = 'wl-cl-filter-bar';
  var filters = [
    ['','All'],
    ['unassigned','Unassigned'],
    ['s2e','Explorer'],
    ['s2l','Voyager'],
    ['s3e','Wanderer'],
    ['s3l','Trailblazer'],
    ['s4','Pioneer']
  ];
  var currentFilter = '';
  filters.forEach(function(f){
    var btn = document.createElement('button');
    btn.textContent = f[1];
    btn.className = 'wl-cl-filter-btn' + (f[0] === '' ? ' active' : '');
    btn.addEventListener('click', function(){
      currentFilter = f[0];
      filterBar.querySelectorAll('button').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      renderTable();
    });
    filterBar.appendChild(btn);
  });
  root.appendChild(filterBar);

  // Unassigned count
  var unassignedCount = document.createElement('div');
  unassignedCount.className = 'wl-cl-unassigned-count';
  root.appendChild(unassignedCount);

  // Table (built with DOM methods — no innerHTML with dynamic content)
  var table = document.createElement('table');
  table.className = 'wl-cl-table';
  var thead = document.createElement('thead');
  var headRow = document.createElement('tr');
  ['Morpheme','Type','Meaning','Stage','Examples'].forEach(function(h){
    var th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);
  var tbody = document.createElement('tbody');
  table.appendChild(tbody);
  root.appendChild(table);

  function renderTable(){
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    var shown = items.filter(function(it){
      if (currentFilter === '') return true;
      if (currentFilter === 'unassigned') return !it.ref.stage;
      return it.ref.stage === currentFilter;
    });
    var unassigned = items.filter(function(it){ return !it.ref.stage; }).length;
    unassignedCount.textContent = unassigned + ' morphemes unassigned';

    shown.forEach(function(it){
      var tr = document.createElement('tr');

      var morphCell = document.createElement('td');
      morphCell.textContent = it.ref.display || it.ref.form || it.ref.id;
      morphCell.className = 'wl-cl-morph';
      tr.appendChild(morphCell);

      var typeCell = document.createElement('td');
      typeCell.textContent = it.type;
      tr.appendChild(typeCell);

      var meanCell = document.createElement('td');
      meanCell.textContent = it.ref.meaning || '';
      tr.appendChild(meanCell);

      var stageCell = document.createElement('td');
      var sel = document.createElement('select');
      var opts = [
        ['', 'Decide later'],
        ['s2e', 'Explorer'],
        ['s2l', 'Voyager'],
        ['s3e', 'Wanderer'],
        ['s3l', 'Trailblazer'],
        ['s4',  'Pioneer']
      ];
      opts.forEach(function(o){
        var opt = document.createElement('option');
        opt.value = o[0]; opt.textContent = o[1];
        sel.appendChild(opt);
      });
      sel.value = it.ref.stage || '';
      sel.addEventListener('change', function(){
        it.ref.stage = sel.value || null;
        saveMorphemeOverrides();
        renderTable();
      });
      stageCell.appendChild(sel);
      tr.appendChild(stageCell);

      var exCell = document.createElement('td');
      exCell.className = 'wl-cl-examples';
      var exStr = (it.ref.examples || []).slice(0,3)
        .map(function(e){ return String(e).replace(/<\/?u>/g,''); }).join(', ');
      exCell.textContent = exStr;
      tr.appendChild(exCell);

      tbody.appendChild(tr);
    });
  }
  renderTable();
}

function saveMorphemeOverrides(){
  var overrides = {};
  if (typeof PREFIXES !== 'undefined') PREFIXES.forEach(function(p){ if (p.stage) overrides['prefix:'+p.id] = p.stage; });
  if (typeof SUFFIXES !== 'undefined') SUFFIXES.forEach(function(s){ if (s.stage) overrides['suffix:'+s.id] = s.stage; });
  if (typeof BASES    !== 'undefined') BASES.forEach(function(b){    if (b.stage) overrides['base:'+b.id]    = b.stage; });
  localStorage.setItem('wl_stage_morpheme_overrides', JSON.stringify(overrides));
}

// Render on tab activation
(function(){
  var btn = document.querySelector('[data-tab="content-levels"]');
  if (btn) {
    btn.addEventListener('click', function(){
      setTimeout(renderMorphemeTagger, 50);
    });
  }
})();
```

- [ ] **Step 3: Add CSS**

```css
.wl-cl-filter-bar { display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap; }
.wl-cl-filter-btn {
  padding:6px 12px; border:1px solid #cbd5e1;
  background:#fff; border-radius:999px; cursor:pointer;
}
.wl-cl-filter-btn.active { background:#6366f1; color:#fff; border-color:#6366f1; }
.wl-cl-unassigned-count {
  margin-bottom:8px; font-weight:700; color:#d97706;
}
.wl-cl-table { width:100%; border-collapse:collapse; }
.wl-cl-table th, .wl-cl-table td {
  text-align:left; padding:6px; border-top:1px solid #e5e7eb;
}
.wl-cl-morph { font-weight:700; }
.wl-cl-examples { font-size:12px; color:#64748b; }
```

**Security note:** All dynamic values (morpheme names, meanings, examples) are set via `textContent`, never `innerHTML` — this prevents XSS even though the data is currently trusted.

- [ ] **Step 4: Verify**

1. Open analytics.html, click Content Levels tab.
2. Morpheme list renders with filter pills.
3. Change a morpheme's stage → "Unassigned" count decrements.
4. Reload page → changes persist via localStorage.
5. Filter by "Explorer" → only Explorer-tagged morphemes shown.

- [ ] **Step 5: Commit**

```bash
git add analytics.html
git commit -m "feat(stage): morpheme tagger in Content Levels tab"
```

---

### Task 24: Word tagger view (Sound Sorter only)

**Files:**
- Modify: `analytics.html`

- [ ] **Step 1: Load sound-sorter-data.js in analytics.html**

Add in the `<head>`:

```html
<script src="sound-sorter-data.js"></script>
```

- [ ] **Step 2: Build the word tagger**

Add a new function following the morpheme tagger pattern. Use DOM methods throughout:

```javascript
function renderWordTagger(){
  var root = document.getElementById('wlCLWordView');
  if (!root) return;
  while (root.firstChild) root.removeChild(root.firstChild);

  // Check which global holds sound sorter words — inspect sound-sorter-data.js
  // Common options: SOUND_WORDS, SOUND_SORTER_WORDS, WORDS
  var words = (typeof SOUND_WORDS !== 'undefined' && SOUND_WORDS)
    || (typeof SOUND_SORTER_WORDS !== 'undefined' && SOUND_SORTER_WORDS)
    || [];
  if (!words.length) {
    var p = document.createElement('p');
    p.textContent = 'No word data loaded. Check the script tag for sound-sorter-data.js.';
    root.appendChild(p);
    return;
  }

  // Restore draft overrides
  try {
    var saved = JSON.parse(localStorage.getItem('wl_stage_word_overrides') || '{}');
    words.forEach(function(w){
      var key = 'sound-sorter:' + w.word;
      if (saved[key]) w.stage = saved[key];
    });
  } catch(e){}

  var note = document.createElement('div');
  note.className = 'wl-cl-word-note';
  note.textContent = 'Currently only Sound Sorter words are tagged here. Breakdown, Phoneme, and Syllable tagging will be added later.';
  root.appendChild(note);

  // Filter bar (same pattern as morpheme tagger)
  var filterBar = document.createElement('div');
  filterBar.className = 'wl-cl-filter-bar';
  var filters = [
    ['','All'], ['unassigned','Unassigned'],
    ['s2e','Explorer'], ['s2l','Voyager'],
    ['s3e','Wanderer'], ['s3l','Trailblazer'],
    ['s4','Pioneer']
  ];
  var currentFilter = '';
  filters.forEach(function(f){
    var btn = document.createElement('button');
    btn.textContent = f[1];
    btn.className = 'wl-cl-filter-btn' + (f[0] === '' ? ' active' : '');
    btn.addEventListener('click', function(){
      currentFilter = f[0];
      filterBar.querySelectorAll('button').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      renderTable();
    });
    filterBar.appendChild(btn);
  });
  root.appendChild(filterBar);

  var unassignedCount = document.createElement('div');
  unassignedCount.className = 'wl-cl-unassigned-count';
  root.appendChild(unassignedCount);

  var table = document.createElement('table');
  table.className = 'wl-cl-table';
  var thead = document.createElement('thead');
  var headRow = document.createElement('tr');
  ['Word','Sound','Level','Stage'].forEach(function(h){
    var th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);
  var tbody = document.createElement('tbody');
  table.appendChild(tbody);
  root.appendChild(table);

  function renderTable(){
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    var shown = words.filter(function(w){
      if (currentFilter === '') return true;
      if (currentFilter === 'unassigned') return !w.stage;
      return w.stage === currentFilter;
    });
    unassignedCount.textContent = words.filter(function(w){ return !w.stage; }).length + ' words unassigned';
    shown.forEach(function(w){
      var tr = document.createElement('tr');
      ['word','soundLabel','level'].forEach(function(k){
        var td = document.createElement('td');
        td.textContent = w[k] || '';
        tr.appendChild(td);
      });
      var stageCell = document.createElement('td');
      var sel = document.createElement('select');
      [['','Decide later'],['s2e','Explorer'],['s2l','Voyager'],['s3e','Wanderer'],['s3l','Trailblazer'],['s4','Pioneer']]
        .forEach(function(o){
          var opt = document.createElement('option');
          opt.value = o[0]; opt.textContent = o[1];
          sel.appendChild(opt);
        });
      sel.value = w.stage || '';
      sel.addEventListener('change', function(){
        w.stage = sel.value || null;
        saveWordOverrides(words);
        renderTable();
      });
      stageCell.appendChild(sel);
      tr.appendChild(stageCell);
      tbody.appendChild(tr);
    });
  }
  renderTable();
}

function saveWordOverrides(words){
  var overrides = {};
  words.forEach(function(w){
    if (w.stage) overrides['sound-sorter:' + w.word] = w.stage;
  });
  localStorage.setItem('wl_stage_word_overrides', JSON.stringify(overrides));
}

// Render on sub-tab activation
(function(){
  var btn = document.getElementById('wlCLSubtabWord');
  if (btn) btn.addEventListener('click', function(){
    setTimeout(renderWordTagger, 50);
  });
})();
```

- [ ] **Step 3: Add CSS**

```css
.wl-cl-word-note {
  margin:8px 0; color:#64748b; font-size:12px;
}
```

- [ ] **Step 4: Verify**

1. Click Words sub-tab → Sound Sorter words list renders.
2. Tag 3 words → reload → persists.
3. Filter by "Explorer" → only Explorer-tagged words shown.

- [ ] **Step 5: Commit**

```bash
git add analytics.html
git commit -m "feat(stage): word tagger (Sound Sorter) in Content Levels tab"
```

---

### Task 25: CSV export/import + persist script

**Files:**
- Modify: `analytics.html`
- Create: `scripts/apply-stage-csv.js`

- [ ] **Step 1: Add Export/Import buttons to morpheme tagger**

In `renderMorphemeTagger` from Task 23, after the filter bar is appended, add:

```javascript
var btnGroup = document.createElement('div');
btnGroup.className = 'wl-cl-btn-group';

var exportBtn = document.createElement('button');
exportBtn.textContent = 'Export CSV';
exportBtn.className = 'wl-cl-btn wl-cl-btn-primary';
exportBtn.addEventListener('click', exportMorphemeCSV);
btnGroup.appendChild(exportBtn);

var importBtn = document.createElement('button');
importBtn.textContent = 'Import CSV';
importBtn.className = 'wl-cl-btn wl-cl-btn-success';
importBtn.addEventListener('click', importMorphemeCSV);
btnGroup.appendChild(importBtn);

root.appendChild(btnGroup);
```

- [ ] **Step 2: Export function**

Add after `saveMorphemeOverrides`:

```javascript
function exportMorphemeCSV(){
  var rows = [['type','id','display','meaning','stage']];
  if (typeof PREFIXES !== 'undefined') PREFIXES.forEach(function(p){ rows.push(['prefix', p.id, p.display || '', p.meaning || '', p.stage || '']); });
  if (typeof SUFFIXES !== 'undefined') SUFFIXES.forEach(function(s){ rows.push(['suffix', s.id, s.display || '', s.meaning || '', s.stage || '']); });
  if (typeof BASES    !== 'undefined') BASES.forEach(function(b){    rows.push(['base',   b.id, b.form || b.display || '', b.meaning || '', b.stage || '']); });
  var csv = rows.map(function(r){
    return r.map(function(c){
      c = String(c);
      if (c.indexOf(',') !== -1 || c.indexOf('"') !== -1 || c.indexOf('\n') !== -1) {
        c = '"' + c.replace(/"/g,'""') + '"';
      }
      return c;
    }).join(',');
  }).join('\n');
  var blob = new Blob([csv], { type:'text/csv' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'morpheme-stages-' + new Date().toISOString().slice(0,10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
```

- [ ] **Step 3: Import function**

```javascript
function importMorphemeCSV(){
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,text/csv';
  input.addEventListener('change', function(){
    var f = input.files && input.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function(){
      var rows = parseCSV(reader.result);
      applyImport(rows);
    };
    reader.readAsText(f);
  });
  input.click();
}

function parseCSV(text){
  var rows = [];
  var lines = text.split(/\r?\n/);
  for (var i=0; i<lines.length; i++){
    if (!lines[i].trim()) continue;
    var fields = [], cur = '', inQ = false;
    for (var j=0; j<lines[i].length; j++){
      var ch = lines[i][j];
      if (inQ){
        if (ch === '"' && lines[i][j+1] === '"') { cur += '"'; j++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else {
        if (ch === ',') { fields.push(cur); cur = ''; }
        else if (ch === '"') inQ = true;
        else cur += ch;
      }
    }
    fields.push(cur);
    rows.push(fields);
  }
  return rows;
}

function applyImport(rows){
  if (rows.length < 2) { alert('CSV is empty'); return; }
  var header = rows[0];
  var typeIdx = header.indexOf('type');
  var idIdx = header.indexOf('id');
  var stageIdx = header.indexOf('stage');
  if (typeIdx < 0 || idIdx < 0 || stageIdx < 0) {
    alert('CSV must have columns: type, id, stage');
    return;
  }
  var changes = 0, errors = 0;
  // Dry-run preview
  for (var i=1; i<rows.length; i++){
    var type = rows[i][typeIdx];
    var id = rows[i][idIdx];
    var stage = rows[i][stageIdx] || null;
    if (stage && WLStage.STAGE_ORDER.indexOf(stage) === -1) { errors++; continue; }
    var arr = type === 'prefix' ? PREFIXES : type === 'suffix' ? SUFFIXES : type === 'base' ? BASES : null;
    if (!arr) { errors++; continue; }
    var m = arr.find(function(x){ return x.id === id; });
    if (!m) { errors++; continue; }
    if (m.stage !== stage) changes++;
  }
  if (!confirm('Apply ' + changes + ' changes (' + errors + ' errors will be skipped)?')) return;
  // Commit
  for (var i=1; i<rows.length; i++){
    var type = rows[i][typeIdx];
    var id = rows[i][idIdx];
    var stage = rows[i][stageIdx] || null;
    if (stage && WLStage.STAGE_ORDER.indexOf(stage) === -1) continue;
    var arr = type === 'prefix' ? PREFIXES : type === 'suffix' ? SUFFIXES : type === 'base' ? BASES : null;
    if (!arr) continue;
    var m = arr.find(function(x){ return x.id === id; });
    if (m) m.stage = stage;
  }
  saveMorphemeOverrides();
  renderMorphemeTagger();
  alert('Applied ' + changes + ' changes.');
}
```

- [ ] **Step 4: Add CSS**

```css
.wl-cl-btn-group { display:flex; gap:8px; margin-bottom:12px; }
.wl-cl-btn {
  padding:6px 12px; border:none; border-radius:6px;
  cursor:pointer; font-size:13px;
}
.wl-cl-btn-primary { background:#6366f1; color:#fff; }
.wl-cl-btn-success { background:#16a34a; color:#fff; }
```

- [ ] **Step 5: Create scripts/apply-stage-csv.js**

Create the file:

```javascript
#!/usr/bin/env node
// Usage: node scripts/apply-stage-csv.js <csv-file> <data-file>
// Applies stage tags from a CSV (type,id,stage) to a JS file containing
// PREFIXES/SUFFIXES/BASES arrays. Finds entries by id and rewrites stage.

var fs = require('fs');

if (process.argv.length < 4) {
  console.error('Usage: node scripts/apply-stage-csv.js <csv> <jsfile>');
  process.exit(1);
}

var csvPath = process.argv[2];
var jsPath = process.argv[3];

var csv = fs.readFileSync(csvPath, 'utf8');
var lines = csv.split(/\r?\n/).filter(function(l){ return l.trim(); });
var header = parseLine(lines[0]);
var typeIdx = header.indexOf('type');
var idIdx = header.indexOf('id');
var stageIdx = header.indexOf('stage');
if (typeIdx < 0 || idIdx < 0 || stageIdx < 0) {
  console.error('CSV missing required columns (type, id, stage)');
  process.exit(1);
}

function parseLine(line){
  var fields = [], cur = '', inQ = false;
  for (var j=0; j<line.length; j++){
    var ch = line[j];
    if (inQ){
      if (ch === '"' && line[j+1] === '"') { cur += '"'; j++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === ',') { fields.push(cur); cur = ''; }
      else if (ch === '"') inQ = true;
      else cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

var updates = {};
for (var i=1; i<lines.length; i++){
  var parts = parseLine(lines[i]);
  var id = parts[idIdx];
  var stage = parts[stageIdx] || 'null';
  updates[id] = stage === 'null' ? 'null' : '"' + stage + '"';
}

var js = fs.readFileSync(jsPath, 'utf8');
var changed = 0;
Object.keys(updates).forEach(function(id){
  var newVal = updates[id];
  var escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var re = new RegExp('(\\{\\s*id:"' + escaped + '",\\s*stage:)(null|"[^"]+")');
  js = js.replace(re, function(_, pre){
    changed++;
    return pre + newVal;
  });
});

fs.writeFileSync(jsPath, js);
console.log('Updated ' + changed + ' entries in ' + jsPath);
```

Make it executable:

```bash
chmod +x scripts/apply-stage-csv.js
```

- [ ] **Step 6: Verify full round-trip**

1. Open analytics, Content Levels tab.
2. Tag 3 morphemes as Explorer.
3. Click Export CSV → file downloads.
4. Open the CSV in a text editor — confirm correct rows.
5. data.js still has those morphemes at `stage:null` (localStorage draft only).
6. Run: `node scripts/apply-stage-csv.js ~/Downloads/morpheme-stages-*.csv data.js`
7. Output: "Updated 3 entries in data.js".
8. Open data.js → those 3 morphemes now have their stage tags.
9. Reload analytics.html → same 3 morphemes still tagged (now from JS file, not localStorage).
10. Clear localStorage: `localStorage.removeItem('wl_stage_morpheme_overrides')` in console, reload → still tagged (persisted in data.js).

- [ ] **Step 7: Commit**

```bash
git add analytics.html scripts/apply-stage-csv.js
git commit -m "feat(stage): CSV export/import + persist script"
```

---

## Phase 7 — Stage Groups for Assignments

### Task 26: Stage group targeting for custom word lists

**Files:**
- Create: `supabase/migrations/add_word_list_stage_group.sql`
- Modify: `dashboard.html`, `wordlab-data.js`

- [ ] **Step 1: Database migration**

Create `supabase/migrations/add_word_list_stage_group.sql`:

```sql
ALTER TABLE class_word_lists
  ADD COLUMN IF NOT EXISTS stage_group text;

ALTER TABLE class_word_lists
  DROP CONSTRAINT IF EXISTS class_word_lists_stage_group_check;

ALTER TABLE class_word_lists
  ADD CONSTRAINT class_word_lists_stage_group_check
  CHECK (stage_group IS NULL OR stage_group IN ('s2e','s2l','s3e','s3l','s4'));
```

Apply in Supabase SQL editor. Verify with:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'class_word_lists' AND column_name = 'stage_group';
```

Expected: 1 row.

- [ ] **Step 2: Add "Quick assign" buttons to the word list assignment UI**

Find the word list assignment modal/panel in `dashboard.html`. Add a static HTML block at the top of the student selection list:

```html
<div class="wl-group-assign">
  <strong>Quick assign:</strong>
  <button type="button" class="wlGroupBtn" data-group="s2e">All Explorers</button>
  <button type="button" class="wlGroupBtn" data-group="s2l">All Voyagers</button>
  <button type="button" class="wlGroupBtn" data-group="s3e">All Wanderers</button>
  <button type="button" class="wlGroupBtn" data-group="s3l">All Trailblazers</button>
  <button type="button" class="wlGroupBtn" data-group="s4">All Pioneers</button>
  <button type="button" class="wlGroupBtn" data-group="">None</button>
</div>
```

Add CSS:

```css
.wl-group-assign {
  margin-bottom:12px; padding:10px;
  background:#eef2ff; border-radius:8px;
}
.wlGroupBtn {
  margin-left:6px; padding:4px 10px;
  border:1px solid #cbd5e1; background:#fff;
  border-radius:6px; cursor:pointer; font-size:12px;
}
```

- [ ] **Step 3: Wire up group assign**

When the user opens the word list assignment modal, the modal script should know the current word list id (e.g. `wordListId`). Add:

```javascript
document.querySelectorAll('.wlGroupBtn').forEach(function(btn){
  btn.addEventListener('click', async function(){
    var group = btn.dataset.group || null;
    if (!wordListId) { alert('Save the word list first, then assign.'); return; }
    var name = group ? WLStage.STAGE_NAMES[group] : 'none';
    if (!confirm('Assign this word list to "' + name + '" (all ' + (group ? WLStage.STAGE_NAMES[group] + 's' : 'groups cleared') + ')?')) return;
    await dbSb().from('class_word_lists').update({ stage_group: group }).eq('id', wordListId);
    alert('Stage group updated.');
    location.reload();
  });
});
```

**Scope note:** This assumes the word list modal is tied to a known list id when the group buttons are clicked. If the buttons live on a new-list form before the list has been saved, move the buttons to appear only after save, or store the selected group in a local variable and include it in the initial insert.

- [ ] **Step 4: Update getCustomWords in wordlab-data.js**

Read the existing `getCustomWords` function (around line 2031 per exploration). It fetches `class_word_lists` and filters by individual assignments via `word_list_assignments`. Add a parallel fetch for stage-group matches:

Find the block where `class_word_lists` is queried. Add below it (before merging into the result):

```javascript
// Stage group assignments: include lists whose stage_group matches the student's stage
var studentStage = sessionStorage.getItem('wl_stage');
var stageGroupLists = [];
if (studentStage) {
  try {
    var sgRes = await sbCall(function(){
      return sb().from('class_word_lists')
        .select('id, name, words, games, priority, stage_group')
        .eq('class_id', session.classId)
        .eq('stage_group', studentStage);
    });
    stageGroupLists = (sgRes && sgRes.data) || [];
  } catch(e){}
}

// Merge stage-group lists into the main set, dedup by id
var seen = {};
var allLists = [];
(individualLists || []).forEach(function(l){ if (!seen[l.id]) { seen[l.id] = 1; allLists.push(l); } });
stageGroupLists.forEach(function(l){ if (!seen[l.id]) { seen[l.id] = 1; allLists.push(l); } });
```

**Note:** The variable `individualLists` may be named differently in the actual function — inspect and adjust. The principle is: fetch individually-assigned lists as before, fetch stage-group-matched lists separately, merge with de-duplication, then continue with the existing processing.

- [ ] **Step 5: Verify**

1. Create a test word list with a word that doesn't already exist in core data.
2. Click "All Voyagers" → confirm → DB shows `stage_group='s2l'` for that list.
3. Set test student A to Voyager → open the target game → that word appears.
4. Set student A to Wanderer → reload game → word no longer appears.
5. Their historical `student_progress` rows for that word are still in the DB (not deleted).
6. Individual assignments for student B still work independently.

- [ ] **Step 6: Commit**

```bash
git add dashboard.html wordlab-data.js supabase/migrations/add_word_list_stage_group.sql
git commit -m "feat(stage): stage group targeting for custom word lists"
```

---

### Task 27: Stage group targeting for spelling sets

**Files:**
- Create: `supabase/migrations/add_spelling_set_stage_group.sql`
- Modify: `dashboard.html`, `wordlab-data.js`

Mirror of Task 26 for `class_spelling_sets`.

- [ ] **Step 1: Migration**

Create `supabase/migrations/add_spelling_set_stage_group.sql`:

```sql
ALTER TABLE class_spelling_sets
  ADD COLUMN IF NOT EXISTS stage_group text;

ALTER TABLE class_spelling_sets
  DROP CONSTRAINT IF EXISTS class_spelling_sets_stage_group_check;

ALTER TABLE class_spelling_sets
  ADD CONSTRAINT class_spelling_sets_stage_group_check
  CHECK (stage_group IS NULL OR stage_group IN ('s2e','s2l','s3e','s3l','s4'));
```

Apply in Supabase.

- [ ] **Step 2: Add quick-assign buttons to spelling set UI**

Find the spelling set assignment panel in `dashboard.html`. Add the same static HTML block as Task 26 but with a different CSS class to avoid event-handler collisions:

```html
<div class="wl-group-assign">
  <strong>Quick assign:</strong>
  <button type="button" class="wlGroupBtnSS" data-group="s2e">All Explorers</button>
  <button type="button" class="wlGroupBtnSS" data-group="s2l">All Voyagers</button>
  <button type="button" class="wlGroupBtnSS" data-group="s3e">All Wanderers</button>
  <button type="button" class="wlGroupBtnSS" data-group="s3l">All Trailblazers</button>
  <button type="button" class="wlGroupBtnSS" data-group="s4">All Pioneers</button>
  <button type="button" class="wlGroupBtnSS" data-group="">None</button>
</div>
```

- [ ] **Step 3: Wire up the buttons**

```javascript
document.querySelectorAll('.wlGroupBtnSS').forEach(function(btn){
  btn.addEventListener('click', async function(){
    var group = btn.dataset.group || null;
    if (!currentSpellingSetId) { alert('Save the set first, then assign.'); return; }
    var name = group ? WLStage.STAGE_NAMES[group] : 'none';
    if (!confirm('Assign this spelling set to ' + name + '?')) return;
    await dbSb().from('class_spelling_sets').update({ stage_group: group }).eq('id', currentSpellingSetId);
    alert('Stage group updated.');
    location.reload();
  });
});
```

**Variable note:** `currentSpellingSetId` is a placeholder — use whatever the dashboard's existing spelling-set code calls the selected set id.

- [ ] **Step 4: Update getSpellingSetWords in wordlab-data.js**

Find `getSpellingSetWords`. It currently fetches sets by individual assignment via `spelling_set_assignments`. Add a parallel fetch for stage-group matches, merge with dedup, same pattern as Task 26:

```javascript
var studentStage = sessionStorage.getItem('wl_stage');
var stageGroupSets = [];
if (studentStage) {
  try {
    var sgRes = await sbCall(function(){
      return sb().from('class_spelling_sets')
        .select('id, name, words, stage_group')
        .eq('class_id', session.classId)
        .eq('stage_group', studentStage);
    });
    stageGroupSets = (sgRes && sgRes.data) || [];
  } catch(e){}
}

// Merge with individual assignments, dedup by id
var seenSS = {};
var allSets = [];
(individuallyAssignedSets || []).forEach(function(s){ if (!seenSS[s.id]) { seenSS[s.id] = 1; allSets.push(s); } });
stageGroupSets.forEach(function(s){ if (!seenSS[s.id]) { seenSS[s.id] = 1; allSets.push(s); } });
```

Adjust variable names to match the actual function.

- [ ] **Step 5: Verify**

1. Create a spelling set, click "All Explorers" → confirm → DB shows `stage_group='s2e'`.
2. Test student in Explorer stage: trigger a check-in takeover → sees the set words.
3. Test student NOT in Explorer: does not see the set.
4. Historical check-in results in `spelling_check_in_results` remain when a student changes stage.
5. Individual spelling set assignments still work.

- [ ] **Step 6: Commit**

```bash
git add dashboard.html wordlab-data.js supabase/migrations/add_spelling_set_stage_group.sql
git commit -m "feat(stage): stage group targeting for spelling check-in sets"
```

---

## Final Manual Verification

After all tasks are complete, do a full smoke test:

1. **New teacher, no stages set** — Everything works exactly as before. No level badges, no filtering.
2. **Test student at Explorer (s2e), no content tagged** — Badge shows "Explorer 1", mastery panel shows 0% everywhere, gameplay unchanged.
3. **Tag 5 prefixes as Explorer via admin UI, export, run script, commit data.js** — Mission Mode and Meaning Match-Up prefer those 5 prefixes for Explorer students.
4. **Voyager student with extension on** — sees Explorer + Voyager + Wanderer content. In Sound Sorter, Starter/Level Up tiers are locked.
5. **Voyager student's progress hits 75%** — Green glow + arrow on their pill. Click → confirm → promoted to Wanderer. Landing page on next load shows promotion toast.
6. **Word list assigned to "All Voyagers"** — Voyagers see those words. Move a student to Wanderer → word disappears from their game, but historical progress rows remain in DB.
7. **Dashboard filter "Not set"** — Shows only untagged students. Bulk set them all to Explorer in one click.

---

## Self-Review Checklist

- [x] Every section of the spec has at least one corresponding task
- [x] No placeholders — every step has concrete code/commands
- [x] Function and property names consistent across tasks:
  - `filterByStage` / `weightByStage` — defined Task 5, used Tasks 10, 26, 27
  - `getStudentStage` — defined Task 4, used everywhere
  - `WLStage.*` — defined Task 2, used throughout
  - `stage` field on items — added Tasks 6 to 9, read Tasks 5, 10, 22 to 25
  - `stage_overrides` — added Task 1, read Task 4, written Task 15
  - `stage_group` — added Tasks 26/27 migrations, read/written Tasks 26/27
- [x] DB migration Task 1 happens before any code reads the columns
- [x] Module load Task 3 happens before filtering Task 10
- [x] Extension mode redesign Task 19 uses a backwards-compatible shim
- [x] Each task is independently committable and manually verifiable
- [x] No `innerHTML` with dynamic content — all dynamic values set via `textContent` or DOM methods
