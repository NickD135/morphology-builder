# Year-Level Progression System — Design Spec

**Date:** 2026-04-10
**Status:** Approved
**Author:** Claude + Nicholas Deeney

---

## 1. Overview

Add a curriculum-aligned levelling system to Word Labs so that content is targeted to each student's developmental stage. Teachers set a student's stage; the system filters built-in content accordingly. Students see a gamified progression (Explorer 1–4, Voyager 1–4, etc.) rather than curriculum labels.

### Goals

- Students see age-appropriate content rather than the full pool
- Teachers can differentiate by setting individual student stages
- Extension mode becomes "+1 stage" instead of a separate content pool
- Students are motivated to play across all core games to level up
- Untagged content continues to work — nothing breaks during the mapping rollout
- Custom word lists and spelling sets bypass stage filtering entirely

---

## 2. Stage Definitions

Five stages, mapped to Australian Curriculum stages but presented to students with gamified names:

| Internal ID | Curriculum Mapping       | Student Name   | EXT Gives Access To                |
|-------------|--------------------------|----------------|------------------------------------|
| `s2e`       | Stage 2 Early (~Year 3)  | Explorer       | Voyager content + Challenge tier   |
| `s2l`       | Stage 2 Late (~Year 4)   | Voyager        | Wanderer content + Challenge tier  |
| `s3e`       | Stage 3 Early (~Year 5)  | Wanderer       | Trailblazer content + Challenge tier |
| `s3l`       | Stage 3 Late (~Year 6)   | Trailblazer    | Pioneer content + Challenge tier   |
| `s4`        | Beyond curriculum        | Pioneer        | Already at top — EXT has no effect |

Plus:
- **`null` (unassigned)** — content not yet tagged. Shows at all levels. Displayed as "Decide Later" in admin UI.
- A student with **no stage set** sees all content (same as today). No level badge shown.

Teachers see real curriculum labels on the dashboard. Students only see the gamified names.

---

## 3. Sub-Levels (Mastery)

Within each stage, students progress through sub-levels 1–4 based on accuracy across 6 core games:

| Sub-Level | Mastery Range | Example          |
|-----------|---------------|------------------|
| 1         | 0–25%         | Explorer 1       |
| 2         | 25–50%        | Explorer 2       |
| 3         | 50–75%        | Explorer 3       |
| 4         | 75–100%       | Explorer 4       |

### Mastery calculation

- **Measured across 6 core games only:** Sound Sorter, Phoneme Splitter, Syllable Splitter, Breakdown Blitz, Meaning Match-Up, Mission Mode
- **Overall mastery** = average accuracy across all 6 games
- **Only counts attempts against tagged content** at the student's current stage — existing progress data from before tagging does not contribute
- Sub-level is **calculated live** from `student_progress` data, not stored in the database
- A student who ignores a game gets 0% for it, capping their overall mastery — this is deliberate, to encourage variety

### Other games

Speed Builder, Morpheme Builder, Root Lab, Word Refinery, Homophone Hunter, Word Spectrum, and Flashcards still filter content by the student's stage, but do NOT contribute to the mastery calculation.

---

## 4. Extension Mode Redesign

Extension mode changes from "load a separate content pool" to "+1 stage":

- A student on Explorer with EXT enabled sees Explorer + Voyager content
- A student on Trailblazer with EXT enabled sees Trailblazer + Pioneer content
- A student on Pioneer with EXT has no effect (already at top)
- Per-activity EXT toggles continue to work — "+1 stage" applies only to toggled games

### Challenge tier lock

In games with difficulty tiers (Sound Sorter, Phoneme Splitter, Root Lab), EXT locks the tier selector to Challenge. This does not apply to Syllable Splitter (syllable count isn't difficulty) or Speed Builder (timer is gameplay, not content).

### Content migration

- `wordlab-extension-data.js` content gets redistributed into `data.js` with appropriate stage tags
- Content that is genuinely Stage 3 curriculum gets tagged `s3e` or `s3l`
- Content that is beyond the curriculum (Greek/Latin combining forms like `chrono-`, `crypto-`, `neuro-`, `pseudo-`) gets tagged `s4` (Pioneer)
- `wordlab-extension-data.js` is eventually absorbed into `data.js` and removed

---

## 5. Data Model

### 5.1 Morpheme tagging (data.js)

Add a `stage` field to every prefix, suffix, and base. The tag means **"introduced at this level"** — students see content from their stage and below (cumulative).

```js
// Prefixes
{ id: "re", form: "re", display: "re-", meaning: "again", stage: "s2e", ... }
{ id: "circum", form: "circum", display: "circum-", meaning: "around", stage: "s3e", ... }
{ id: "contra", form: "contra", display: "contra-", meaning: "against", stage: null, ... }
```

`stage: null` means unassigned — shows at all levels until tagged.

A Voyager student sees all `s2e` + `s2l` + `null` content. A Trailblazer sees `s2e` + `s2l` + `s3e` + `s3l` + `null`. No content is ever lost as students progress.

### 5.2 Word-level tagging

For games with fixed word pools (Sound Sorter, Breakdown Blitz, Phoneme Splitter, Syllable Splitter), add `stage` to individual word objects:

```js
// Sound Sorter
{ word: "ship", sound: "sh", level: "starter", stage: "s2e" }
// Breakdown Blitz
{ word: "circumnavigation", clue: "...", stage: "s3l" }
```

### 5.3 Student record (students table)

```sql
stage text              -- 's2e', 's2l', 's3e', 's3l', 's4', or null (no level set)
stage_overrides jsonb   -- per-activity overrides, e.g. {"sound-sorter":"s2e","breakdown-blitz":"s3e"}
```

No new tables needed. Sub-level is calculated live, not stored.

---

## 6. Game Filtering Logic

Content pipeline when a student opens a game:

1. **Custom word lists & spelling sets** — always loaded first, unfiltered (teacher's explicit choices)
2. **Built-in content** — filtered by student's stage (cumulative — current stage and below):
   - Content tagged at or below the student's stage → eligible pool
   - If EXT is on for this game → also include content tagged with the next stage up
   - Content with `stage: null` (untagged) → included at all levels
3. **Content weighting** — ~80% of content served is from the student's current stage, ~20% is revision from below-stage content. This keeps foundations sharp without letting students coast on easy material. Mastery calculation only counts current-stage attempts.
   - If EXT is on: the 80% draws from current stage + next stage up, the 20% revision draws from all stages below
4. **In-game tiers** (Starter/Level Up/Challenge) — work within the filtered pool, UNLESS EXT is on which locks to Challenge in applicable games

### Per-game behaviour

| Game              | Filters by       | Has tiers?           | EXT locks tier?                   |
|-------------------|------------------|----------------------|-----------------------------------|
| Sound Sorter      | word `stage`     | Yes (3 tiers)        | Yes -> Challenge                  |
| Phoneme Splitter  | word `stage`     | Yes (3 tiers)        | Yes -> Challenge                  |
| Syllable Splitter | word `stage`     | Yes (syllable count) | No (syllable count != difficulty)  |
| Breakdown Blitz   | word `stage`     | No                   | N/A                              |
| Meaning Match-Up  | morpheme `stage` | No                   | N/A                              |
| Mission Mode      | morpheme `stage` | No                   | N/A                              |
| Speed Builder     | morpheme `stage` | Yes (timer presets)  | No (timer is gameplay)            |
| Morpheme Builder  | morpheme `stage` | No                   | N/A                              |
| Root Lab          | word `stage`     | Yes (3 tiers)        | Yes -> Challenge                  |
| Flashcards        | morpheme `stage` | No                   | N/A                              |
| Word Refinery     | word `stage`     | No                   | N/A                              |
| Homophone Hunter  | word `stage`     | No                   | N/A                              |
| Word Spectrum     | word `stage`     | No                   | N/A                              |

---

## 7. Student-Facing UI

### Landing page status strip

Level badge added to existing status strip:

```
Explorer 2  |  145 quarks  |  3-day streak  |  ...
```

Students with no stage set see no badge.

### Progress detail (tap the badge)

Shows per-game mastery breakdown:

```
Explorer 2 — 38% mastery
Master all 6 skill games to level up!

Sound Sorter  ||||||||--  82%
Phoneme       ||||||----  61%
Syllable      |||||-----  54%
Breakdown     ||||------  41%
Meaning       ||--------  22%
Mission       ----------   0%  <- Try this one!
```

The lowest/unplayed game gets a "Try this one!" nudge connecting to existing "Try me!" badges on game cards.

### Sub-level progression

When a student crosses a threshold (e.g. Explorer 2 -> Explorer 3), show a celebration moment with scientist reaction — similar to badge-earned popup.

### Stage promotion

When the teacher changes a student's stage (e.g. Explorer -> Voyager), show a bigger moment on next login: "You've been promoted to Voyager!" with the new icon.

### Low-stim mode

Level badge hidden, no celebrations, progress still tracked silently.

---

## 8. Teacher Dashboard UI

### Stage badge on summary table

Each student row shows a compact pill: `EXP 2` or `VOY 3` or `TRL 4` with a green glow and arrow when they've hit the level-up threshold. Students with no stage show a grey `--` pill.

### Setting a student's stage

Click a student's name cell to access:
- **Stage selector** — dropdown: Not set, Explorer (S2E), Voyager (S2L), Wanderer (S3E), Trailblazer (S3L), Pioneer (S4)
- **EXT toggle** — relabelled "+1 Stage", same per-activity popover
- **Per-activity stage overrides** — same popover pattern as existing per-activity EXT toggles
- **SUP toggle** — unchanged

### Table sorting & filtering

- Column headers clickable to sort by name (A-Z / Z-A) or level (low-high / high-low)
- Filter pills above the table: `All | Explorer | Voyager | Wanderer | Trailblazer | Pioneer | Not set`
- Filtering shows only matching students + a bulk action bar: "Set stage..." / "Toggle EXT" / "Toggle SUP"

### Stage as targeting groups

Anywhere students are currently selected individually, add stage-group targeting:
- **Custom word lists** — assign to "All Voyagers" instead of selecting individuals
- **Spelling check-in sets** — assign to a stage group
- **Bulk stage assignment** — on class-setup or dashboard for start-of-year setup

### Dynamic group assignments

Stage group assignments are **live** — if a student moves from Voyager to Wanderer:
- They automatically lose Voyager group assignments
- They automatically gain Wanderer group assignments
- All progress data from previous assignments is **permanently preserved**
- Individual student assignments (explicit picks) are unaffected by stage changes

### Assignment priority

1. **Individual student assignments** — always stick, stage changes don't affect them
2. **Stage group assignments** — live, follow the student's current stage
3. **Whole class assignments** — as they work now

### Level-up nudge

When a student hits 75%+ average across the 6 core games at their stage:
- Pill gets green glow + arrow icon
- Click shows: "[Student] is at 78% mastery on Explorer — ready to move to Voyager?" with one-click "Promote" button

---

## 9. Content Tagging Admin UI

Accessible via a new tab in the analytics section (admin-only, not teacher-facing).

### Morpheme view

- Table: Morpheme, Type (prefix/suffix/base), Current Stage, Examples
- Filter pills: `All | Unassigned | Explorer | Voyager | Wanderer | Trailblazer | Pioneer`
- Click stage cell -> dropdown to assign
- Multi-select rows -> bulk assign
- Unassigned count shown prominently to track tagging progress

### Word view

- Filter by game (Sound Sorter, Breakdown Blitz, Phoneme, Syllable), then by stage/unassigned
- Same click-to-assign and bulk-assign pattern

### CSV import/export

- Export current mappings as CSV (morpheme/word, type, stage)
- Import from CSV for bulk updates after cross-syllabus research
- Preview before applying (same pattern as AI word analysis preview)

### Tagging workflow

1. Open curriculum docs (NSW, QLD, Australian Curriculum) side by side
2. Work through morphemes/words in analytics tab or via CSV in Google Sheets
3. Tag each item with a stage or leave as "Decide Later"
4. Import/save — games immediately respect the new tags
5. Iterate — progressively tag more content over time

---

## 10. Decisions Summary

| Decision | Rationale |
|---|---|
| 5 stages (not year levels) | Maps to Australian Curriculum stages; sub-levels within each stage give finer granularity for differentiation |
| Stages with sub-levels, not individual year levels | Curriculum docs are written in stages; sub-levels (1-4) provide the per-year granularity needed for differentiation |
| Gamified names (Explorer, Voyager, etc.) | Avoids stigma of students comparing year levels; feels like game progression |
| Sub-level from accuracy across 6 games | Encourages variety; prevents grinding one game to level up |
| Only tagged content counts for mastery | Clean slate; mastery reflects genuine competence at the student's stage, not historical data from untagged content |
| EXT = +1 stage | Replaces separate extension pool; extension is now relative to student's level, not absolute |
| Stage 4 (Pioneer) for beyond-curriculum | Gives genuinely advanced content a home; extends Year 6 students beyond Stage 3 |
| Untagged content shows at all levels | Nothing breaks during mapping rollout; progressive enhancement |
| Stage tag means "introduced at" (cumulative) | Students see current stage and below; no content lost on promotion; single tag per item, no multi-tagging needed |
| 80/20 content weighting | Current stage content prioritised (80%); below-stage revision (20%) reinforces foundations without inflating mastery |
| Custom content bypasses filtering | Teacher's explicit word list choices trump the system |
| Stage groups for assignment targeting | Natural grouping; reduces manual student-by-student selection |
| Live group assignments | Students get content for their current stage automatically; data preserved permanently |
| Admin tagging in analytics tab | Product-level content mapping; not a per-teacher feature |
| Teacher sets stage, sub-level is automatic | Teacher controls curriculum placement; mastery is objective measurement |
| Level-up nudge at 75% | Light suggestion, teacher decides; consistent with spelling set auto-progression pattern |
