# Dashboard Stage-Aware Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Replace the dashboard Overview with a stage-grouped student heatmap, add a two-tier drill-down for stage-grouped games (Game overview then Stage detail), and a global toggle for current-level vs historical data.

**Architecture:** All changes in dashboard.html (inline JS/CSS). New rendering functions parallel the existing gdBuild pattern, returning HTML strings written to the gdMain element. Navigation extended from 2 states (overview/activity) to 4 (overview/game-stage/stage-detail/activity-flat). A new getCategoryStage helper maps student_progress categories to content stages.

**Tech Stack:** Vanilla JS, inline CSS, Supabase client. No build system. dashboard.html is the only file modified.

**Spec:** docs/superpowers/specs/2026-04-12-dashboard-stage-overhaul-design.md

---

## Existing Code Reference

Key functions and locations in dashboard.html (6,191 lines):

- `_gdState` (line 1898): `{ view:'overview', activity:null }` — navigation state
- `gdShowOverview()` (line 2028): sets state, calls gdRenderOverview
- `gdShowActivity(key)` (line 2035): sets state, calls gdRenderActivityDetail
- `gdRenderSidebar()` (line 1991): rebuilds sidebar with onclick handlers
- `gdRenderOverview()` (line 2059): writes pulse + attention + matrix cards to gdMain
- `gdBuildPulseCard()` (line 2063): class summary stats
- `gdBuildAttentionCard()` (line 2151): flagged students
- `gdBuildMatrixCard()` (line 2292): activity matrix table (the current overview heatmap)
- `gdBuildHeatmapCard(activityKey, meta)` (line 2529): per-game detail heatmap
- `gdRenderActivityDetail(activityKey)` (line 2461): full activity view (hero + flags + heatmap)
- `gdRefresh()`: re-renders current view after state changes
- `showStudentProfile(id)` (line 2786): student profile modal
- `_gdBuildStagePillHtml(student)` (line 2242): renders stage badge
- `COLUMNS` (line 1152): static column definitions per game
- `GD_GROUPS` (line 1860): game groups (Phonics/Morphology/Vocabulary/Other)
- `_gdActivities()` (line 1883): flat list of all activities
- `THRESHOLD_PCT = 70`, `THRESHOLD_ATTEMPTS = 3` (line 1250)
- `dashboardMode` / `extensionData` / `toggleDashboardMode()` (lines 1264-1306): base/ext toggle
- `currentClass.students[i].results[activity][category]`: student progress data shape
- Stage constants from wordlab-stage.js: `WLStage.STAGE_ORDER`, `WLStage.STAGE_NAMES`, `WLStage.visibleStages()`, `WLStage.stageIndex()`
- Content rendering writes to `document.getElementById('gdMain')` via string assignment
- Accuracy color logic: 100 green #166534, 90 #16a34a, 80 #4ade80, 70 #86efac, 60 #fef08a, 50 #fde047, 40 #fb923c, 30 #ef4444, below #991b1b
- Group tint CSS classes: gd-col-phonics (cyan rgba 34,211,238,.135), gd-col-morphology (indigo rgba 165,180,252,.135), gd-col-vocab (amber rgba 251,191,36,.135), gd-col-other (pink rgba 244,114,182,.135)
- Stage colors used by _gdBuildStagePillHtml: s2e=#4338ca, s2l=#0891b2, s3e=#d97706, s3l=#7c3aed, s4=#16a34a
- Games that are stage-grouped: phoneme-splitter, syllable-splitter, breakdown-blitz, meaning-mode, mission-mode, root-lab
- Games that are NOT stage-grouped: sound-sorter, homophone-hunter, word-spectrum, word-refinery, speed-mode

---

### Task 1: getCategoryStage() helper function

The foundation. Maps (activity, category) to curriculum stage. All subsequent tasks depend on this.

**Files:** Modify dashboard.html — add after COLUMNS constant (after line ~1251)

- [ ] **Step 1: Add _buildCategoryStageMap() and getCategoryStage()**

After THRESHOLD_ATTEMPTS (line ~1251), add:

1. `_buildCategoryStageMap()` that returns an object `{ activity: { category: stageString } }`:
   - For phoneme-splitter, syllable-splitter, root-lab: static map `Starter->s2e, Level up->s2l, Challenge->s3e, Mixed->null`
   - For meaning-mode, mission-mode: iterate `window.MORPHEMES.prefixes/suffixes/bases`, build lookup `prefix:id -> m.stage`, `suffix:id -> m.stage`, `base:id -> m.stage`
   - For breakdown-blitz: initialize empty (loaded async)
   - For sound-sorter, homophone-hunter, word-spectrum, word-refinery, speed-mode: empty (no stage mapping)

2. `getCategoryStage(activity, category)` — memoized accessor using `_categoryStageCache`

- [ ] **Step 2: Add _loadBreakdownStages()**

Fetches breakdown-mode.html, regex-extracts `word` and `stage` fields from the inline WORDS array, populates `_categoryStageCache['breakdown-blitz']`. Handle both field orderings in regex. Call at end of renderDashboard().

- [ ] **Step 3: Add _gdStudentActAccByStage(student, activityKey, stages)**

Computes accuracy filtered to categories matching given stages array. `stages=null` means all data. Respects `dashboardMode` (base vs extension). Returns percentage or null.

- [ ] **Step 4: Verify in console**

Test getCategoryStage returns correct values for different activity types.

- [ ] **Step 5: Commit**

---

### Task 2: Extend navigation state and controls bar

**Files:** Modify dashboard.html — _gdState, navigation functions, controls HTML

- [ ] **Step 1: Extend _gdState**

Add `stageDetail:null` to state object. Add `_gdSortBy = 'level'` and `_gdShowPast = false` globals.

- [ ] **Step 2: Add gdShowGameStage(activityKey) and gdShowStageDetail(activityKey, stage)**

New navigation functions that set state and call render functions (render functions built in Tasks 3-5).

- [ ] **Step 3: Define STAGE_GROUPED_GAMES constant**

`['phoneme-splitter','syllable-splitter','breakdown-blitz','meaning-mode','mission-mode','root-lab']`

Modify gdShowActivity: if activityKey is in STAGE_GROUPED_GAMES, delegate to gdShowGameStage instead.

- [ ] **Step 4: Add controls bar with Sort/Toggle/Export**

Add or replace the controls strip with: view title span, Sort Level/Name buttons, Show past level data checkbox, Export button. Wire _gdToggleSort(), _gdTogglePast(), gdExportCurrentView() handlers.

- [ ] **Step 5: Update gdRefresh() for new view states**

Add game-stage and stage-detail cases.

- [ ] **Step 6: Update gdRenderSidebar() active state**

Check for view===game-stage and view===stage-detail in addition to view===activity when determining which sidebar item is active.

- [ ] **Step 7: Commit**

---

### Task 3: Layer 1 — Overview (stage-grouped student heatmap)

Replaces pulse+attention+matrix with one stage-grouped overview table.

**Files:** Modify dashboard.html — new gdBuildStageOverview(), modify gdRenderOverview()

- [ ] **Step 1: Add CSS for stage group rows**

Add to style block: .gd-stageGroupRow styling (colored text, badge, count), .gd-stageBadge, .gd-stageCount, .gd-cell-dim (opacity 0.25).

- [ ] **Step 2: Write gdBuildStageOverview()**

Returns HTML table string with:
- Group header row: PHONICS (3 col, cyan) | MORPHOLOGY (4 col, indigo) | VOCABULARY (3 col, amber) | OTHER (1 col, pink) using existing gd-col-* tint classes
- Icon row: 22px emoji per game from GD_GROUPS, onclick navigates to game view
- When _gdSortBy===level: students grouped under stage headers (badge + name + count), ordered by WLStage.STAGE_ORDER, "not assigned" last
- When _gdSortBy===name: alphabetical, no group headers
- Student rows: sticky name cell with badges (reuse gd-studentCell pattern), level pill (reuse _gdBuildStagePillHtml), 11 accuracy cells
- Each cell: _gdStudentActAccByStage with stages=[student.stage] when !_gdShowPast, null when _gdShowPast (for non-stage games always null)
- Cell colors: same accuracy scale as existing heatmap
- Intervention flags: red outline when acc < THRESHOLD_PCT and total >= THRESHOLD_ATTEMPTS
- Dash for null accuracy (no data)

- [ ] **Step 3: Replace gdRenderOverview() body**

Change to: `main content = gdBuildStageOverview()`

- [ ] **Step 4: Smoke test**

Verify overview renders with stage groups, sort works, toggle works, game icons navigate.

- [ ] **Step 5: Commit**

---

### Task 4: Layer 2 — Game Overview (stage-grouped columns)

**Files:** Modify dashboard.html — new gdBuildGameStageOverview(), gdRenderGameStage()

- [ ] **Step 1: Write gdBuildGameStageOverview(activityKey)**

Table with:
- Columns: student name + level pill + 5 stage columns (S2E through S4), each clickable (onclick gdShowStageDetail)
- Stage headers styled with stage colors, show stage short code + name
- Rows: grouped by stage or alphabetical
- Cells: aggregate accuracy across categories where getCategoryStage matches that stage
- Dimming: cells above student stage always dimmed. Cells below student stage dimmed unless _gdShowPast. Current stage full brightness.

- [ ] **Step 2: Write gdRenderGameStage(activityKey)**

Look up game icon+label from GD_GROUPS. Set main content and update view title.

- [ ] **Step 3: Smoke test**

Click stage-grouped game in sidebar, verify 5 stage columns with dimming.

- [ ] **Step 4: Commit**

---

### Task 5: Layer 3 — Stage Detail (individual categories)

**Files:** Modify dashboard.html — new gdBuildStageDetail(), gdRenderStageDetail()

- [ ] **Step 1: Write gdBuildStageDetail(activityKey, stage)**

Table with:
- Breadcrumb: clickable game name (onclick gdShowGameStage) + stage name
- Columns: categories from COLUMNS[activityKey] filtered to getCategoryStage===stage
- Category display: prefix:re shows "re-", suffix:ing shows "-ing", base:act shows "act", words show the word, levels show level name
- Rows: _gdShowPast===false only students at this stage; _gdShowPast===true students at this stage and above (WLStage.stageIndex comparison)
- Cells: per-category accuracy with colored pills and intervention flags (same pattern as existing gdBuildHeatmapCard cells)

- [ ] **Step 2: Write gdRenderStageDetail(activityKey, stage)**

Set main content, update view title with game + stage name.

- [ ] **Step 3: Smoke test**

From game overview click a stage column. Verify filtered columns, filtered students, breadcrumb navigation back.

- [ ] **Step 4: Commit**

---

### Task 6: Non-stage game fallback and sidebar polish

**Files:** Modify dashboard.html

- [ ] **Step 1: Verify non-stage games work**

Click Sound Sorter, Homophone, Spectrum, Refinery, Speed in sidebar. Each should show the existing flat heatmap via gdRenderActivityDetail (unchanged). The gdShowActivity routing from Task 2 should handle this.

- [ ] **Step 2: Verify sidebar highlights**

All 4 view states should correctly highlight the matching sidebar item. Fix if needed.

- [ ] **Step 3: Commit if changes needed**

---

### Task 7: Student profile stage summary

**Files:** Modify dashboard.html — showStudentProfile() (line 2786)

- [ ] **Step 1: Add stage summary to profile top**

Before existing game sections in the profile body: current stage pill + if _gdShowPast, per-stage accuracy summary across 6 core games.

- [ ] **Step 2: Verify and commit**

---

### Task 8: CSV Export

**Files:** Modify dashboard.html — new gdExportCurrentView()

- [ ] **Step 1: Write gdExportCurrentView()**

Based on _gdState.view, build CSV rows with appropriate columns. Download via Blob URL.

- [ ] **Step 2: Wire Export button and verify**

- [ ] **Step 3: Commit**

---

### Task 9: Full verification

- [ ] **Step 1: Full navigation flow test in browser**
- [ ] **Step 2: Playwright check for console errors**
- [ ] **Step 3: Verify preserved features (EXT/SUP, rewards, focus game, spelling sets, promotions)**
- [ ] **Step 4: Update CLAUDE.md with Phase 7.24 notes**
- [ ] **Step 5: Final commit**
