# Dashboard Stage-Aware Overhaul — Design Spec

**Date:** 2026-04-12
**Status:** Approved
**Approach:** Three-tier drill-down (Overview → Game overview → Stage detail) replacing the current Summary tab, with existing sidebar and game heatmaps preserved.

---

## Goal

Transform the teacher dashboard so student performance is organized by curriculum stage (Explorer → Pioneer). Teachers see at a glance what level each student is at, how they're performing at that level across all games, and can drill into per-game detail filtered by stage. A global toggle lets teachers choose between current-level-only data and full historical data.

## Background

The stage system (shipped 2026-04-11) tags all content with `s2e`/`s2l`/`s3e`/`s3l`/`s4`. Students are assigned a stage by their teacher. Games filter content via `filterByStage`/`weightByStage`. As of 2026-04-12, all morphemes in data.js are tagged (zero `stage:null` entries). The dashboard currently shows a flat per-game heatmap with no stage awareness — all student data is mixed together regardless of level.

---

## Navigation Structure

Three-tier drill-down. The sidebar game list stays as-is. Only the main content area changes.

| Layer | What it shows | How to get there | Back |
|---|---|---|---|
| **Overview** | All students grouped by stage, 11 game columns (Phonics/Morphology/Vocabulary/Other groups), per-game accuracy at current level | Click "Overview" in sidebar | — |
| **Game overview** | All students, columns are stage groups (S2E, S2L, S3E, S3L, S4) showing aggregate accuracy per stage for that game | Click game icon in sidebar OR click column header from Overview | Click "Overview" in sidebar |
| **Stage detail** | Students filtered by toggle, columns are individual categories (words/morphemes/sounds) tagged at that stage | Click a stage group header from Game overview | Click game name breadcrumb or back arrow |

### Global controls (top bar, persistent across all views)

- **Sort:** Level (default — groups students by stage) or Name (alphabetical, no grouping)
- **Show past level data:** Checkbox toggle (off by default)
  - Off: Overview/Game overview show only current-stage accuracy. Stage detail shows only students currently AT that stage.
  - On: All views show cumulative accuracy across all stages at-and-below. Stage detail shows students at that stage AND above (anyone who has data for that stage's content).
- **Export:** Exports the current view as CSV, respecting toggle/sort state.

---

## Layer 1: Overview

Replaces the current "Overview" pulse card. Shows every student in the class with a compact heatmap row.

### Layout

Matches the existing matrix card style (`gd-matrixCard` with `gd-matrixTable`).

**Header rows:**
1. Group headers: `PHONICS` (cyan `#22d3ee`, 3 cols) | `MORPHOLOGY` (indigo `#a5b4fc`, 4 cols) | `VOCABULARY` (amber `#fbbf24`, 3 cols) | `OTHER` (pink `#f472b6`, 1 col) — same colored backgrounds as existing (`rgba(r,g,b,.135)`)
2. Icon row: 22px emoji per game (🔤 🔊 ✂️ | 🧩 🧠 ⚡ 🧫 | 📡 🧲 ⚗️ | 🏎️) — clickable, navigates to that game's Game overview

**Column set:**
- Student name (sticky left, same `gd-studentCell` style with name + EXT/SUP/🎁 badges)
- Level pill (stage code + mastery sub-level, green + ↑ when ready to promote)
- 11 game columns with group tint backgrounds

**Row grouping (when sorted by Level):**
Students are grouped under stage headers. Each header shows:
- Stage badge (e.g. `S2E` in indigo pill)
- Stage name (e.g. "Explorer")
- Student count (right-aligned, muted)

Stage header colors:
- S2E Explorer: `#6366f1` (indigo)
- S2L Voyager: `#06b6d4` (cyan)
- S3E Wanderer: `#f59e0b` (amber)
- S3L Trailblazer: `#8b5cf6` (purple)
- S4 Pioneer: `#16a34a` (green)
- Not assigned: `#64748b` (gray)

**Cell content:**
- Accuracy % in a colored pill (same green→yellow→red scale as existing heatmaps)
- Only counts `student_progress` rows where the category is tagged at the student's current stage (or at-and-below when toggle is on)
- Dash `—` for games the student hasn't played at this level
- Red outline + accuracy for intervention flags (below `THRESHOLD_PCT` after `THRESHOLD_ATTEMPTS`)

**When sorted by Name:**
No stage group headers. Students listed alphabetically. Level pill still visible per row.

### Data computation

For each student, for each game:
1. Get the student's current stage
2. Get all `student_progress` rows for that game
3. Get the COLUMNS for that game (from the existing `COLUMNS` constant)
4. Determine which columns are tagged at the student's stage (or at-and-below if toggle is on)
5. Sum `correct/total` across those columns only
6. Display as accuracy %

The stage of a column/category is determined by:
- For morpheme-based games (Meaning, Mission): the morpheme's `stage` field in data.js, matched via the category string (e.g. `prefix:re` → look up `re` in PREFIXES → `stage: "s2e"`)
- For word-based games (Breakdown, Phoneme, Syllable): the word's `stage` field in the game's inline word array
- For Sound Sorter: the word's `stage` field in `sound-sorter-data.js`
- For games without stage-tagged categories (Speed Builder, Word Spectrum, Homophone Hunter): show aggregate accuracy across all categories (no stage filtering)

---

## Layer 2: Game Overview

Shown when teacher clicks a game icon column from Overview or selects a game in the sidebar.

### Layout for stage-grouped games

Games with stage-tagged categories: Phoneme Splitter, Syllable Splitter, Breakdown Blitz, Meaning Match-Up, Mission Mode, Root Lab.

**Columns:** One column per stage (S2E, S2L, S3E, S3L, S4) — showing aggregate accuracy for all categories at that stage.

**Rows:** All students (or grouped by stage if sorted by Level).

**Cell behavior:**
- Shows accuracy % for all categories tagged at that stage, same color scale
- Cells for stages ABOVE the student's current stage: dimmed (opacity 0.3) with no data or a dash
- Cells for the student's current stage: full brightness, this is the "active" data
- Cells for stages BELOW the student's current stage:
  - Toggle off: dimmed or hidden (teacher only cares about current level)
  - Toggle on: shown at full brightness (historical data visible)

**Clicking a stage column header** → drills into Stage detail for that stage.

### Layout for non-stage games

Games without stage-tagged categories: Sound Sorter, Homophone Hunter, Word Spectrum, Word Refinery, Speed Builder.

Sound Sorter categories are sound names (e.g. "Long A") which span all stages — the words within each sound are stage-tagged but the category itself isn't. Similarly, Homophone Hunter uses mode categories, Word Spectrum uses `synonym/antonym/spectrum`, and Word Refinery uses cline categories.

These skip the stage-grouping tier and go directly to a flat heatmap (same as the current per-game detail view). Columns are the game's existing categories.

The student rows still show the level pill, but columns aren't stage-filtered.

---

## Layer 3: Stage Detail

Shown when teacher clicks a stage column header from the Game overview.

### Layout

**Breadcrumb:** `Game Name > Stage Name` (e.g. "Breakdown Blitz > S2L Voyager") — clicking the game name goes back to Game overview.

**Columns:** Individual categories tagged at the selected stage. For Breakdown Blitz, these are the specific words tagged `s2l`. For Meaning Match-Up, these are morpheme categories (`prefix:re`, `suffix:ing`, etc.) tagged `s2l`.

**Rows (controlled by toggle):**
- Toggle off: Only students currently assigned to this stage
- Toggle on: All students who have data for this stage's categories (at-stage and above — a Wanderer student has data for s2l content because it's cumulative)

**Cell content:** Same as existing heatmap cells — accuracy %, attempt count if below threshold, intervention flags.

This is essentially the existing per-game heatmap filtered to a single stage's categories and (optionally) a single stage's students.

---

## "Show Past Level Data" Toggle — Detailed Behavior

| View | Toggle OFF (default) | Toggle ON |
|---|---|---|
| **Overview** cells | Accuracy computed from current-stage categories only | Accuracy computed from all at-and-below categories |
| **Overview** rows | All students shown (grouped by stage) | All students shown (grouped by stage) |
| **Game overview** cells below current stage | Dimmed / dash | Full brightness, shows historical accuracy |
| **Game overview** cells at current stage | Full brightness | Full brightness |
| **Game overview** cells above current stage | Dimmed / dash | Dimmed / dash |
| **Stage detail** rows | Only students AT this stage | Students AT this stage + students ABOVE (who have historical data) |
| **Stage detail** cells | Current data only | All data for these categories regardless of when earned |

---

## Student Profile Modal

Clicking a student name from any view opens the existing profile modal. No structural changes — but the profile should also organize its sections by stage if the student has been promoted.

**Enhancement (minimal):** Add a stage history summary at the top of the profile:
- Current stage pill (same as overview)
- If "show past level data" is on, show per-stage accuracy summary (one line per past stage: "S2E Explorer: 85% across 6 games")

The existing per-game breakdown sections within the profile remain unchanged.

---

## Existing Features Preserved

These current dashboard features continue to work unchanged:

- **Sidebar game list** with accuracy pills and flag counts
- **Settings strip** (Focus Game selector, Low-stim toggle, Custom Word Lists button)
- **EXT/SUP badges** on student names with popover controls
- **Reward button** (🎁) per student
- **Spelling Sets view** (separate tab, unaffected)
- **Class picker / login screen**
- **Loading screen** (lab analysis room)
- **Topbar** (class name, switch class, account, home, export, sign out)

---

## Data Model

No database schema changes needed. All data comes from existing tables:

- `student_progress` — `(student_id, activity, category, correct, total, total_time, is_extension)` — existing
- `students` — `stage` field (existing), `extension_activities` (existing)
- `classes` — `settings` jsonb (existing, for focus game, low-stim)

The stage of a category is determined client-side by looking up the category string against the stage-tagged content arrays (data.js morphemes, game inline word arrays, sound-sorter-data.js). This is a pure runtime computation — no new DB columns.

### Category-to-stage mapping

A new helper function is needed: `getCategoryStage(activity, category) → stage|null`

For each activity type:
- `sound-sorter`: Categories are sound names (e.g. "Long A") which span all stages — no per-category stage mapping. Show aggregate data, skip stage grouping.
- `phoneme-splitter`, `syllable-splitter`: Categories are difficulty levels ("Starter", "Level up", "Challenge"). Map: Starter→s2e, Level up→s2l, Challenge→s3e.
- `breakdown-blitz`: Categories are words. Each word in the inline array has a `stage` field. Direct lookup.
- `meaning-mode`, `mission-mode`: Categories are `type:id` strings (e.g. `prefix:re`). Look up the morpheme by id in `window.MORPHEMES` and read its `stage` field.
- `root-lab`: Categories are difficulty levels. Map: Starter→s2e, Level Up→s2l, Challenge→s3e.
- `homophone-hunter`, `word-spectrum`, `word-refinery`, `speed-mode`: No per-category stage mapping. Show aggregate data, skip stage grouping.

---

## CSS / Theming

All new UI uses the existing navy dark theme and design tokens:
- Background: `--panel` (`#1e293b`), `--bg` (`#0f172a`)
- Text: `--text` (`#e2e8f0`), `--muted` (`#94a3b8`)
- Accents: `--accent` (`#4338ca`), `--indigo` (`#6366f1`)
- Group tints: `rgba(34,211,238,.135)` cyan, `rgba(165,180,252,.135)` indigo, `rgba(251,191,36,.135)` amber, `rgba(244,114,182,.135)` pink
- Heatmap cells: same green→yellow→red accuracy color scale
- Stage headers: colored by stage (indigo, cyan, amber, purple, green, gray)
- Matrix card: `gd-matrixCard` styling with overflow-x scroll

No new CSS files. All styles inline or added to the existing `<style>` block in dashboard.html.

---

## Interactions

| Action | Result |
|---|---|
| Click "Overview" in sidebar | Show Layer 1 overview |
| Click game emoji column header (overview) | Navigate to Layer 2 game overview for that game |
| Click game in sidebar | Navigate to Layer 2 game overview for that game |
| Click stage column header (game overview) | Navigate to Layer 3 stage detail |
| Click breadcrumb game name (stage detail) | Navigate back to Layer 2 game overview |
| Click student name (any view) | Open student profile modal |
| Click level pill (any view) | Open promote/change stage dialog |
| Toggle "Sort by Level/Name" | Re-sort current view |
| Toggle "Show past level data" | Re-filter current view data |
| Click "Export" | Download CSV of current view |
| Click EXT/SUP badge | Open extension/support popover |
| Click 🎁 | Open reward modal |

---

## Scope Boundary

**In scope:**
- New Overview (Layer 1) replacing pulse card
- Game overview with stage-grouped columns (Layer 2) for 6 stage-grouped games
- Stage detail drill-down (Layer 3) for those 6 games
- Flat heatmap fallback for 5 non-stage games
- Global toggle, sort, export controls
- Student profile stage summary enhancement
- `getCategoryStage()` helper function

**Out of scope (future):**
- Mastery auto-promotion suggestions on the overview
- Stage history tracking (what stage a student was at when they earned a result)
- Per-student stage overrides on the overview (use existing popover)
- Spelling Sets stage awareness (separate tab, separate design)
- Mobile-specific layout changes (existing responsive patterns apply)
