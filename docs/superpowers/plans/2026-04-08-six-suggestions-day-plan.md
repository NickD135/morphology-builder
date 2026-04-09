# Six Suggestions — One-Day Implementation Plan

> **For Claude:** This is a self-execution plan. Work tasks in order, top to bottom. After each task's final commit + push, stop, post a one-line status to the user, and wait for "go" before starting the next task. Each task is independently shippable — if the day runs out, stop cleanly between tasks, never mid-task.

**Goal:** Ship six small, high-leverage product/UX improvements to Word Labs across one working day, one at a time, with a commit + push between each.

**Architecture:** Pure additive changes to the existing vanilla-HTML/CSS/JS codebase. No new dependencies, no build step, no framework. All new CSS goes into `wordlab-common.css` (the shared stylesheet). Per-page edits are minimal and surgical.

**Tech Stack:** Vanilla HTML/CSS/JS, no build, deployed via Vercel auto-deploy on push to `main`.

**Hard constraints (apply to every task):**
- Gate every animation behind `body.low-stim` AND `@media (prefers-reduced-motion: reduce)`.
- Animate `transform` and `opacity` only — never `width`/`height`/`margin`/`top`/`left` (use `transform: scaleX()` for progress bars).
- No layout shift on hover/state-change.
- Never block or delay a `recordAttempt`/`student_progress` write for a visual flourish.
- **No `innerHTML` with anything that isn't a constant literal.** Use `createElement` + `textContent` + `appendChild`. This matches the Phase 7.15 XSS hardening pass and keeps the security hook happy.
- Test on a narrow viewport (Chrome DevTools, 360px width) before committing anything visual.

**Order rationale:** Lowest-risk single-file wins first to build momentum. The heaviest task (mobile scientist × multiple game pages) is last so it lands when warmed up and can be parked between game pages without leaving anything broken.

---

## File Structure

| File | Role | Tasks that touch it |
|---|---|---|
| `wordlab-common.css` | All new shared classes (`.wlEmpty`, `.wlSkeleton`, `.wlProgressBar`, `.wlHeatLegend`, `.wlScreen`) | 1, 2, 3, 4, 6 |
| `dashboard.html` | Heatmap legend pill, heatmap cell tooltips, skeleton loader on first paint | 1, 4, 5 |
| `phoneme-mode.html` | First round-progress-bar implementation | 2 |
| `breakdown-mode.html`, `syllable-mode.html`, `mission-mode.html`, `meaning-mode.html`, `sound-sorter.html`, `root-lab.html` | Round progress bar rollout + mobile scientist | 2, 7 |
| `class-setup.html`, `flashcard-mode.html`, `speed-mode.html` | `.wlEmpty` ports | 3 |
| `about.html`, `pricing.html` | Screenshot markup (4 images, captions) | 6 |
| `breakdown-mode.html` (proto) then 7 other game pages | Mobile-scientist override block | 7 |

---

## Task 1 — Heatmap colour-scale legend pill — WON'T DO (2026-04-09)

**Decision after visual review:** Skipped. Every heatmap cell already displays the numeric
accuracy percentage inside it (e.g. "28%", "99%", "85%"), so the red→amber→green colour scale
is already self-decoding — the first cell a teacher looks at teaches the mapping instantly.
A legend exists to decode colours when colour is the only signal; here it would add visual
noise to the already-dense card header ("Who Needs Attention" flags, "Activity Matrix" title,
drill-in hint, column group labels) in exchange for information the dashboard already carries.
No teacher feedback has ever asked for it. Leave it out.

**Why (original rationale, kept for history):** Single file, lowest risk, biggest
sales-enablement-per-minute. A teacher demoing the dashboard to a deputy principal can point
at it.

**Files:**
- Modify: `dashboard.html` (CSS block near `.heatmap` styles around line 86–92, and the `gdBuildHeatmapCard` function around line 643+)

- [ ] **Step 1.1: Add the `.wlHeatLegend` styles to `dashboard.html`'s existing style block, immediately after the `.heatmap td.student-name:hover` rule (around line 239).**

```css
.wlHeatLegend{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:rgba(99,102,241,.10);border:1px solid rgba(99,102,241,.25);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-secondary);white-space:nowrap;}
.wlHeatLegend-swatch{display:inline-block;width:14px;height:14px;border-radius:4px;border:1px solid rgba(255,255,255,.15);}
.wlHeatLegend-swatch.lo{background:#dc2626;}
.wlHeatLegend-swatch.mid{background:#d97706;}
.wlHeatLegend-swatch.hi{background:#16a34a;}
@media (max-width:640px){.wlHeatLegend{font-size:9px;padding:5px 10px;gap:6px;}}
```

- [ ] **Step 1.2: Inject the legend pill into the heatmap card header. In `dashboard.html` find `gdBuildHeatmapCard` (search for `gd-heatmapCard-header`). After the title element is created/appended, append a legend node built with safe DOM methods.**

```javascript
function buildHeatLegend() {
  var legend = document.createElement('div');
  legend.className = 'wlHeatLegend';

  var label = document.createElement('span');
  label.textContent = 'Accuracy';
  legend.appendChild(label);

  var tiers = [
    { cls: 'lo',  title: 'Below 60%' },
    { cls: 'mid', title: '60–84%' },
    { cls: 'hi',  title: '85% or above' }
  ];
  tiers.forEach(function(t) {
    var sw = document.createElement('span');
    sw.className = 'wlHeatLegend-swatch ' + t.cls;
    sw.title = t.title;
    legend.appendChild(sw);
  });

  return legend;
}
```

Then in `gdBuildHeatmapCard`, after the header element exists:

```javascript
header.appendChild(buildHeatLegend());
```

(Adjust `header` to whatever the existing local variable is — it's the element with class `gd-heatmapCard-header`.)

- [ ] **Step 1.3: Verify in browser.**

Run: `python3 -m http.server 8080 --bind 0.0.0.0` (if not already running). Open `http://localhost:8080/dashboard.html`, log in as teacher, switch to a Game Data tab. Confirm the legend pill appears in the header of every heatmap card and the swatches have hover tooltips.

- [ ] **Step 1.4: Commit + push.**

```bash
git add dashboard.html
git commit -m "feat(dashboard): add accuracy legend pill to heatmap cards

Small sales-enablement polish — gives teachers a self-explanatory
colour key when demoing the dashboard to school leaders. Built with
safe DOM methods, no innerHTML."
git push origin main
```

- [ ] **Step 1.5: Stop. Post status to user: "Task 1 done — legend pill live on dashboard. Ready for Task 2?"**

---

## Task 2 — Round progress bar (~1 hour total, ~7 commits)

**Why:** Pacing clarity for kids. Small CSS + JS, big "I know how far I am" win. Roll out to one game first, validate, then ripple.

**Files:**
- Modify: `wordlab-common.css` (add `.wlProgressBar` shared class)
- Modify: `phoneme-mode.html` (first implementation)
- Modify: `breakdown-mode.html`, `syllable-mode.html`, `mission-mode.html`, `meaning-mode.html`, `sound-sorter.html`, `root-lab.html` (rollout — only the games with the round picker)

### Task 2A — Shared CSS class

- [ ] **Step 2A.1: Append to the end of `wordlab-common.css`:**

```css
/* ─────────── Round progress bar ─────────── */
.wlProgressBar{position:relative;width:100%;max-width:520px;height:4px;border-radius:999px;background:rgba(255,255,255,.14);margin:0 auto 14px;overflow:hidden;}
.wlProgressBar-fill{position:absolute;inset:0;transform-origin:left center;transform:scaleX(0);background:linear-gradient(90deg,#6366f1 0%,#22d3ee 100%);border-radius:999px;transition:transform .25s cubic-bezier(.4,0,.2,1);}
.wlProgressBar[hidden]{display:none;}
@media (prefers-reduced-motion: reduce){.wlProgressBar-fill{transition:none;}}
body.low-stim .wlProgressBar-fill{background:#6366f1;transition:none;}
```

- [ ] **Step 2A.2: Commit shared CSS only.**

```bash
git add wordlab-common.css
git commit -m "feat(common): add .wlProgressBar shared class for round pacing"
git push origin main
```

### Task 2B — Phoneme Splitter implementation (the proving ground)

- [ ] **Step 2B.1: Add the progress bar markup to `phoneme-mode.html` immediately above the game zone.**

Find the `.round-picker` element (search for `id="roundPicker"`, around line 402). Inside the same `.hud`/`.gameWrap` parent, immediately above the first input/answer container, add a static literal:

```html
<div class="wlProgressBar" id="roundProgress" hidden><div class="wlProgressBar-fill" id="roundProgressFill"></div></div>
```

This is a static literal in HTML source, not innerHTML at runtime — safe.

- [ ] **Step 2B.2: Wire it up in the existing JS. Search for where the round starts (look for code that reads from `roundPicker` or a `roundLength`/`wordsPerRound` variable). At round start, unhide the bar; on each correct answer, advance it.**

Add to the round-start function:

```javascript
var pb = document.getElementById('roundProgress');
if (pb) {
  pb.hidden = false;
  document.getElementById('roundProgressFill').style.transform = 'scaleX(0)';
}
```

Add to the function called on each correct (or each completed word — match whatever the existing round counter uses):

```javascript
var fill = document.getElementById('roundProgressFill');
if (fill && roundTarget > 0) {
  var pct = Math.min(1, roundProgress / roundTarget);
  fill.style.transform = 'scaleX(' + pct + ')';
}
```

(Use the actual variable names from the file — search for `roundLength`, `wordsCompleted`, `roundCount` to find them.)

- [ ] **Step 2B.3: Hide in Teacher Mode.** Find the existing `// Hide round picker in teacher mode` block (around line 1113 in phoneme-mode.html) and add the progress bar to the same hide logic:

```javascript
var pb = document.getElementById('roundProgress');
if (pb) pb.hidden = true;
```

- [ ] **Step 2B.4: Test in browser.** Open phoneme-mode, log in as student, start a 10-word round. Confirm the bar fills smoothly across 10 correct answers. Skip a word — confirm it does NOT advance (skips don't count). Then test as teacher mode — confirm bar stays hidden.

- [ ] **Step 2B.5: Commit + push.**

```bash
git add phoneme-mode.html
git commit -m "feat(phoneme-mode): add round progress bar above game zone"
git push origin main
```

### Task 2C — Roll out to other round-based games

- [ ] **Step 2C.1: For each of these games, repeat steps 2B.1–2B.3 (markup + JS wire-up + teacher-mode hide). One commit per game so any single rollout can be reverted if it breaks.**

Games to update (in order):
1. `breakdown-mode.html`
2. `syllable-mode.html`
3. `sound-sorter.html`
4. `root-lab.html`
5. `mission-mode.html`
6. `meaning-mode.html`

For each: find the round picker, find the round-progress counter variable, add markup + 3 JS hooks (start, advance, teacher-mode hide), test at 360px width, commit:

```bash
git add <game>.html
git commit -m "feat(<game>): add round progress bar"
git push origin main
```

- [ ] **Step 2C.2: After all 6 commits pushed, post status: "Task 2 done — round progress bar live on 7 games. Ready for Task 3?"**

---

## Task 3 — `.wlEmpty` shared class + 6 ports (~1 hour)

**Why:** The Spelling Sets empty state is gorgeous. Lift it into a reusable class, port the plain-text empty states.

**Files:**
- Modify: `wordlab-common.css` (add `.wlEmpty*` classes)
- Modify: `class-setup.html`, `flashcard-mode.html`, `speed-mode.html`, `dashboard.html`

### Task 3A — Extract pattern to common CSS

- [ ] **Step 3A.1: Append to `wordlab-common.css`:**

```css
/* ─────────── Empty state ─────────── */
.wlEmpty{position:relative;background:linear-gradient(135deg,#1e293b 0%,#243352 100%);border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:60px 32px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.2);overflow:hidden;}
.wlEmpty::before{content:'';position:absolute;top:-50%;left:50%;transform:translateX(-50%);width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 60%);pointer-events:none;}
.wlEmpty-illus{position:relative;z-index:1;width:96px;height:96px;border-radius:24px;background:linear-gradient(135deg,#6366f1 0%,#22d3ee 100%);display:flex;align-items:center;justify-content:center;font-size:46px;margin:0 auto 22px;box-shadow:0 16px 36px rgba(99,102,241,.35);animation:wlEmptyFloat 4s ease-in-out infinite;}
.wlEmpty-title{position:relative;z-index:1;font-size:24px;font-weight:900;color:#f1f5f9;letter-spacing:-.02em;margin:0 0 10px;}
.wlEmpty-sub{position:relative;z-index:1;font-size:14px;color:#94a3b8;font-weight:600;max-width:440px;margin:0 auto 24px;line-height:1.6;}
.wlEmpty-cta{position:relative;z-index:1;display:inline-flex;align-items:center;gap:10px;border:none;background:#6366f1;color:#fff;font-family:'Lexend',sans-serif;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:.06em;padding:14px 28px;border-radius:14px;box-shadow:0 12px 28px rgba(99,102,241,.35);cursor:pointer;transition:transform .15s;}
.wlEmpty-cta:hover{transform:translateY(-3px);}
.wlEmpty.light{background:linear-gradient(135deg,#f8fafc 0%,#eef2ff 100%);border-color:rgba(99,102,241,.18);}
.wlEmpty.light .wlEmpty-title{color:#1e293b;}
.wlEmpty.light .wlEmpty-sub{color:#64748b;}
@keyframes wlEmptyFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
@media (prefers-reduced-motion: reduce){.wlEmpty-illus{animation:none;}}
body.low-stim .wlEmpty-illus{animation:none;}
```

- [ ] **Step 3A.2: Commit shared CSS.**

```bash
git add wordlab-common.css
git commit -m "feat(common): extract .wlEmpty class from spelling-sets empty state"
git push origin main
```

### Task 3B — Port stark empty states

- [ ] **Step 3B.1: `class-setup.html` — replace the "No classes yet" plain text.**

Search for the literal string `No classes yet` in `class-setup.html`. Replace the entire surrounding empty container's HTML markup (in the source file, not at runtime) with this static literal:

```html
<div class="wlEmpty light">
  <div class="wlEmpty-illus">🧪</div>
  <div class="wlEmpty-title">No classes yet</div>
  <div class="wlEmpty-sub">Create your first class to start adding students and exploring activities together.</div>
  <button class="wlEmpty-cta" id="emptyCreateClassBtn">Create a class →</button>
</div>
```

Wire `#emptyCreateClassBtn` to the same handler as the existing "Create class" tab button:

```javascript
var ecb = document.getElementById('emptyCreateClassBtn');
if (ecb) ecb.addEventListener('click', function() {
  // call the same function the existing "Create" tab button uses
  // e.g. switchTab('create') or whatever the file already exposes
});
```

- [ ] **Step 3B.2: Test in browser.** Sign in as a brand-new teacher (or temporarily delete your only class). Confirm the empty state appears and the button switches to the create tab.

- [ ] **Step 3B.3: Commit + push.**

```bash
git add class-setup.html
git commit -m "feat(class-setup): friendly empty state for zero classes"
git push origin main
```

- [ ] **Step 3B.4: `flashcard-mode.html` — replace "Build a deck to begin your flashcards."**

Search for `Build a deck` in `flashcard-mode.html`. Replace the surrounding container with this static literal:

```html
<div class="wlEmpty">
  <div class="wlEmpty-illus">🃏</div>
  <div class="wlEmpty-title">No deck yet</div>
  <div class="wlEmpty-sub">Pick some morphemes from the bank and build your first flashcard deck. Then flip through to learn what each one means.</div>
</div>
```

Test, commit, push:

```bash
git add flashcard-mode.html
git commit -m "feat(flashcard-mode): friendly empty state when no deck built"
git push origin main
```

- [ ] **Step 3B.5: `speed-mode.html` — replace "No words submitted yet."**

Search for `No words submitted yet`. Replace with this static literal:

```html
<div class="wlEmpty">
  <div class="wlEmpty-illus">⚡</div>
  <div class="wlEmpty-title">Round not started</div>
  <div class="wlEmpty-sub">Type a real English word using the morpheme tiles and hit Submit. Each correct word earns points and time.</div>
</div>
```

Test, commit, push:

```bash
git add speed-mode.html
git commit -m "feat(speed-mode): friendly empty state before first submission"
git push origin main
```

- [ ] **Step 3B.6: `dashboard.html` — port any remaining stark empty states. Search for "No data", "haven't played", "No students", "No words". For each one that's currently rendered as plain text, replace with a `.wlEmpty` block.**

If the empty state is built from JS (not static HTML), build it with safe DOM methods:

```javascript
function buildEmptyState(emoji, title, sub) {
  var wrap = document.createElement('div');
  wrap.className = 'wlEmpty';

  var illus = document.createElement('div');
  illus.className = 'wlEmpty-illus';
  illus.textContent = emoji;
  wrap.appendChild(illus);

  var t = document.createElement('div');
  t.className = 'wlEmpty-title';
  t.textContent = title;
  wrap.appendChild(t);

  var s = document.createElement('div');
  s.className = 'wlEmpty-sub';
  s.textContent = sub;
  wrap.appendChild(s);

  return wrap;
}
```

Then call it like: `container.appendChild(buildEmptyState('📊', 'No data yet', 'Once your students start playing, their results will appear here.'));`

Commit:

```bash
git add dashboard.html
git commit -m "feat(dashboard): friendly empty states across heatmap and student panels"
git push origin main
```

- [ ] **Step 3B.7: Post status: "Task 3 done — empty states unified across 4 files. Ready for Task 4?"**

---

## Task 4 — Loading skeleton on dashboard heatmap (~45 min)

**Why:** School WiFi is slow. A blank dashboard during the first 1–3 seconds reads as broken. Skeleton = trust signal.

**Files:**
- Modify: `wordlab-common.css` (add `.wlSkeleton`)
- Modify: `dashboard.html` (use skeleton during heatmap initial load)

### Task 4A — Shared skeleton class

- [ ] **Step 4A.1: Append to `wordlab-common.css`:**

```css
/* ─────────── Skeleton loader ─────────── */
.wlSkeleton{position:relative;border-radius:8px;background:rgba(99,102,241,.10);overflow:hidden;}
.wlSkeleton::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.08) 50%,transparent 100%);transform:translateX(-100%);animation:wlSkelShimmer 1.6s ease-in-out infinite;}
.wlSkeletonRow{display:flex;gap:8px;align-items:center;margin-bottom:8px;}
.wlSkeletonRow .wlSkeleton{height:20px;}
.wlSkeleton.name{width:140px;flex-shrink:0;}
.wlSkeleton.cell{flex:1;min-width:32px;}
.wlSkeletonWrap{padding:18px;}
@keyframes wlSkelShimmer{0%{transform:translateX(-100%);}60%,100%{transform:translateX(100%);}}
@media (prefers-reduced-motion: reduce){.wlSkeleton::after{animation:none;}}
body.low-stim .wlSkeleton::after{animation:none;}
```

- [ ] **Step 4A.2: Commit shared CSS.**

```bash
git add wordlab-common.css
git commit -m "feat(common): add .wlSkeleton shimmer loader class"
git push origin main
```

### Task 4B — Apply to heatmap initial render

- [ ] **Step 4B.1: In `dashboard.html`, add a small helper near the top of the dashboard JS block (built with safe DOM methods, no innerHTML):**

```javascript
function wlBuildSkeletonHeatmap(rows, cols) {
  rows = rows || 6;
  cols = cols || 8;
  var wrap = document.createElement('div');
  wrap.className = 'wlSkeletonWrap';
  for (var r = 0; r < rows; r++) {
    var row = document.createElement('div');
    row.className = 'wlSkeletonRow';

    var name = document.createElement('div');
    name.className = 'wlSkeleton name';
    row.appendChild(name);

    for (var c = 0; c < cols; c++) {
      var cell = document.createElement('div');
      cell.className = 'wlSkeleton cell';
      row.appendChild(cell);
    }
    wrap.appendChild(row);
  }
  return wrap;
}
```

- [ ] **Step 4B.2: Find where the heatmap card is first painted on dashboard load (search for `gdBuildHeatmapCard` calls and the parent container that holds them). Before the async data fetch resolves, append the skeleton to that container:**

```javascript
// Before the data fetch:
var c = document.getElementById('heatmapContainer'); // or whatever the actual id is
if (c) {
  while (c.firstChild) c.removeChild(c.firstChild);
  c.appendChild(wlBuildSkeletonHeatmap(6, 8));
}
```

The existing data-render path will then clear and replace the container once results arrive — no further wiring needed.

- [ ] **Step 4B.3: Test in browser.** Reload the dashboard with DevTools network throttling set to "Slow 3G". Confirm the shimmer rows appear briefly, then resolve into real data with no flash of bare layout.

- [ ] **Step 4B.4: Commit + push.**

```bash
git add dashboard.html
git commit -m "feat(dashboard): skeleton loader on heatmap initial paint"
git push origin main
```

- [ ] **Step 4B.5: Post status: "Task 4 done — skeleton loader on dashboard. Ready for Task 5?"**

---

## Task 5 — Heatmap cell tooltips (~45 min)

**Why:** Teachers can't parse a coloured cell without context. One sentence on hover = self-explanatory dashboard.

**Files:**
- Modify: `dashboard.html`

- [ ] **Step 5.1: Find the cell-build code in `dashboard.html` (search for the function that creates `.heatmap td` cells with the accuracy class). It should already have access to: correct count, total count, last attempt date.**

Add a `title` attribute (native browser tooltip — zero JS, zero positioning bugs, accessible to screen readers, no innerHTML risk) when building each cell:

```javascript
var corr = cellData.correct || 0;
var tot  = cellData.total || 0;
var pct  = tot ? Math.round(100 * corr / tot) : 0;
var last = cellData.last_attempted_at
  ? new Date(cellData.last_attempted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  : 'never';
td.title = corr + ' of ' + tot + ' correct (' + pct + '%) · last attempt ' + last;
```

(Adapt the field names to whatever the existing cell-build code reads — `correct` / `total` / `last_attempted_at` / `updated_at`.)

- [ ] **Step 5.2: Test in browser.** Hover over several cells in the heatmap. Confirm the native tooltip shows after ~500ms with `"X of Y correct (Z%) · last attempt 3 Apr"`. Hover over an empty cell — confirm it shows `"0 of 0 correct (0%) · last attempt never"`.

- [ ] **Step 5.3: Commit + push.**

```bash
git add dashboard.html
git commit -m "feat(dashboard): native title tooltips on heatmap cells

Hover any cell to see X/Y correct, accuracy %, and date of last attempt.
Uses native title attribute — zero JS, accessible to screen readers."
git push origin main
```

- [ ] **Step 5.4: Post status: "Task 5 done — heatmap tooltips live. Ready for Task 6?"**

---

## Task 6 — Four screenshots into about + pricing pages (~30 min of markup; user supplies images)

**Why:** Procurement is calendar-driven. NSW DoE reviewers and Term 4 buyers scan, they don't read. One screenshot per claim converts.

**Files:**
- Create: `assets/screens/dashboard-heatmap.png`, `assets/screens/game-mid-round.png`, `assets/screens/scientist-character.png`, `assets/screens/worksheet-preview.png` (user takes these)
- Modify: `about.html`, `pricing.html`, `wordlab-common.css`

- [ ] **Step 6.1: Add `.wlScreen` class to `wordlab-common.css`:**

```css
/* ─────────── Inline screenshot ─────────── */
.wlScreen{display:block;max-width:720px;width:100%;margin:24px auto 6px;border-radius:14px;border:1px solid rgba(99,102,241,.18);box-shadow:0 18px 48px rgba(15,23,42,.18);background:#fff;}
.wlScreenCaption{display:block;max-width:720px;margin:0 auto 32px;text-align:center;font-size:13px;color:#64748b;font-weight:600;font-style:italic;}
@media (max-width:640px){.wlScreen{border-radius:10px;margin:18px auto 6px;}}
```

Commit the CSS-only change first:

```bash
git add wordlab-common.css
git commit -m "feat(common): add .wlScreen class for inline marketing screenshots"
git push origin main
```

- [ ] **Step 6.2: Create the assets folder and stop for the user to supply screenshots.**

```bash
mkdir -p /workspaces/morphology-builder/assets/screens
```

Stop and post: **"Task 6 needs 4 screenshots from you, saved into `assets/screens/`:**
1. **`dashboard-heatmap.png`** — your teacher dashboard with a real(ish) class showing colour variation
2. **`game-mid-round.png`** — any game page mid-round, scientist visible, progress bar showing
3. **`scientist-character.png`** — the My Scientist customisation page with a dressed character
4. **`worksheet-preview.png`** — one of the worksheet generators with a generated PDF preview

**Reply when they're in the folder, and I'll wire them into about.html and pricing.html."**

- [ ] **Step 6.3: After user confirms images exist, in `about.html`, find the "What is Word Labs" / hero section. Immediately after the intro paragraph block, insert this static literal markup:**

```html
<img src="assets/screens/dashboard-heatmap.png" class="wlScreen" alt="Teacher dashboard showing a class heatmap with student names and colour-coded accuracy cells across each activity." loading="lazy">
<span class="wlScreenCaption">The teacher dashboard — every student, every activity, at a glance.</span>
```

Then after the "Activities" / "13 activities" section:

```html
<img src="assets/screens/game-mid-round.png" class="wlScreen" alt="A Word Labs game in progress, with the scientist character reacting to a correct answer." loading="lazy">
<span class="wlScreenCaption">Each activity is built around explicit, research-grounded morphology and phonics practice.</span>
```

Then in the "Differentiation" or scientist-mention section:

```html
<img src="assets/screens/scientist-character.png" class="wlScreen" alt="The My Scientist customisation page showing a dressed character, badges, and the in-game shop." loading="lazy">
<span class="wlScreenCaption">Students earn quarks and customise their scientist — the engagement loop that brings them back.</span>
```

Then in the "Resources" / teacher resources section:

```html
<img src="assets/screens/worksheet-preview.png" class="wlScreen" alt="A printable worksheet generated from a Word Labs word list, ready for classroom use." loading="lazy">
<span class="wlScreenCaption">324 teaching slide decks and 9 worksheet generators — online, offline, all under one roof.</span>
```

- [ ] **Step 6.4: In `pricing.html`, add ONE screenshot only — the dashboard heatmap — immediately above the plan grid:**

```html
<img src="assets/screens/dashboard-heatmap.png" class="wlScreen" alt="Teacher dashboard preview." loading="lazy">
<span class="wlScreenCaption">What you and your colleagues will see every morning.</span>
```

- [ ] **Step 6.5: Test in browser.** Open about.html and pricing.html. Confirm images load, captions are aligned, no horizontal scroll on mobile (resize to 360px). Confirm `loading="lazy"` is present on every image.

- [ ] **Step 6.6: Commit + push.**

```bash
git add about.html pricing.html assets/screens/
git commit -m "feat(marketing): inline screenshots on about + pricing pages

Four screenshots wired into about.html (dashboard, game, scientist, worksheet)
and one onto pricing.html (dashboard). Lazy-loaded, captioned, mobile-safe.
Aimed at procurement reviewers who scan rather than read."
git push origin main
```

- [ ] **Step 6.7: Post status: "Task 6 done — screenshots live. Ready for the big one — Task 7 (mobile scientist)?"**

---

## Task 7 — Mobile scientist on game pages (~1.5–2 hrs, 8 commits)

**Why:** The scientist is the personality vehicle. It's `display:none` below 700px on every game page. Chromebook portrait mode = personality vacuum. This is the suggestion that fixes a regression rather than adding polish.

**Strategy:** Prototype on `breakdown-mode.html` first. Once it feels right on a real phone, the same CSS override block works on the other 7 game pages with near-zero JS changes.

**Files:**
- Modify: `breakdown-mode.html` (prototype)
- Modify: `phoneme-mode.html`, `syllable-mode.html`, `mission-mode.html`, `meaning-mode.html`, `sound-sorter.html`, `homophone-mode.html`, `flashcard-mode.html`

### Task 7A — Prototype on Breakdown Blitz

- [ ] **Step 7A.1: In `breakdown-mode.html`, find the existing mobile media query (around line 168) that hides `.scientist-stage` and `.lab-scene`. The current rule is approximately:**

```css
@media(max-width:700px){.lab-scene{display:none;}body{...}.scientist-stage,.scene-prop-left{display:none!important;}}
```

Replace ONLY the `.scientist-stage` part of the rule. The full replacement for that media query block becomes:

```css
@media(max-width:700px){
  .lab-scene{display:none;}
  body{background:linear-gradient(160deg,#1a1a2e 0%,#2d2d3a 60%,#7f1d1d 100%)!important;overflow-y:auto!important;}
  .wrap{width:calc(100vw - 24px)!important;position:relative!important;top:auto;bottom:auto;left:auto;transform:none;justify-content:flex-start!important;padding-top:88px!important;}
  .scene-prop-left{display:none!important;}
  /* Mobile scientist: shrink, pin top-right, keep reactions */
  .scientist-stage{position:fixed!important;top:60px!important;right:8px!important;bottom:auto!important;left:auto!important;width:72px!important;height:auto!important;z-index:30!important;display:flex!important;}
  .scientist-stage #sciCharWrap{transform:scale(.55);transform-origin:top right;}
  .scientist-stage #petCharWrap{display:none!important;}
}
```

- [ ] **Step 7A.2: Test on a phone-width viewport.** Open Chrome DevTools, set viewport to 360×740. Reload `breakdown-mode.html`, log in as a student, start a round. Confirm:
  - The scientist appears in the top-right corner (shrunken).
  - On a correct answer, `sciJump` animation still plays.
  - On a wrong answer, `sciShake` animation still plays.
  - The scientist does NOT overlap the input card or the round progress bar.
  - Scrolling the page does NOT move the scientist (it's `position: fixed`).
  - The pet (if any) is hidden — too small to make sense.

If it overlaps the input on landscape phones, bump `top` from `60px` to `64px` and reduce scale from `.55` to `.50`.

- [ ] **Step 7A.3: Commit + push the prototype.**

```bash
git add breakdown-mode.html
git commit -m "feat(breakdown-mode): keep scientist visible on mobile

Replaces the display:none mobile rule with a shrunken top-right pinned
character (~40px wide) that still plays sci-correct/sci-wrong reactions.
The scientist is the product's personality vehicle — losing it on a
Chromebook in portrait was the single biggest delight regression."
git push origin main
```

- [ ] **Step 7A.4: Post status: "Task 7A done — mobile scientist prototype on Breakdown Blitz. Test it on your phone and tell me if the size/position is right before I roll out to the other 7 games."**

### Task 7B — Roll out to other game pages — PARKED (2026-04-09)

**Status:** Prototype shipped on breakdown-mode.html (commits `f25fbad`, `f78d0ca`, `ff15499`
bottom-right position). Nick tested on a real phone and gave a qualified thumbs-up:
*"yeah that works. it feels a little messy on the phone but it always will because we're
using so much smaller space. lets leave it for now."*

Decision: leave the rollout parked rather than replicate a layout Nick finds "a little
messy" across 7 more pages. The underlying compromise is that the 360px portrait viewport
genuinely doesn't have room for both the game UI and the scientist character at a
recognisable size — no amount of CSS nudging will fully fix that. Revisit when there's
appetite for a mobile design rethink (e.g. condensed game HUDs, collapsible scientist
tray, or a dedicated mobile layout pass).

**Bonus fix that landed while prototyping:** scientist-load race condition on 11 game
pages. `wordlab-scientist.js` has `defer` (from the Phase 7.16 defer rollout), so the
inline scientist-loader IIFE on each page was running before `WLScientist` was defined
and silently early-returning — the scientist only got painted when the first answer
triggered a reaction and re-rendered it as a side effect. Fixed by awaiting
DOMContentLoaded when WLScientist isn't ready yet. Applied to: breakdown, phoneme,
syllable, sound-sorter, meaning, speed, root-lab, flashcard, word-refinery, word-spectrum,
homophone. mission-mode was already inside a DOMContentLoaded handler and unaffected.
This was a real latent bug that had been masking itself as "slow scientist load" for
several weeks; worth keeping regardless of Task 7's fate.

- [ ] **Step 7B.1: Wait for user confirmation that the prototype feels right on a real phone. If they want a tweak (bigger/smaller/different corner), apply it to breakdown-mode first, commit, then proceed.**

- [ ] **Step 7B.2: For each remaining game page in this order, apply the same pattern. ONE commit per file so any single page can be reverted independently.**

Pages, in rollout order (lowest-risk first):

1. `phoneme-mode.html`
2. `syllable-mode.html`
3. `sound-sorter.html`
4. `mission-mode.html`
5. `meaning-mode.html`
6. `homophone-mode.html`
7. `flashcard-mode.html`

For each file:
- Find the existing `@media(max-width:700px)` block (or whichever breakpoint hides `.scientist-stage`).
- Find the line that sets `.scientist-stage{display:none}`.
- Replace it with the same shrinker rule from Step 7A.1 (the `.scientist-stage{position:fixed!important;...}` block plus the `#sciCharWrap` scale rule).
- If the page does NOT have a `.scientist-stage` element at all (e.g. flashcard-mode might use a different wrapper name), skip it and add it to a "needs custom work" note in the final status message — don't try to invent the markup.
- Test at 360px width — confirm scientist appears, reactions fire, no overlap.
- Commit:

```bash
git add <game>.html
git commit -m "feat(<game>): keep scientist visible on mobile"
git push origin main
```

- [ ] **Step 7B.3: After all 7 pushes complete, post final status: "Task 7 done. All six suggestions shipped. Want a quick recap of what changed today?"**

---

## Self-Review

**Spec coverage check:**
- Suggestion #1 (mobile scientist) → Task 7 ✓
- Suggestion #2 (empty states) → Task 3 ✓
- Suggestion #3 (round progress bar) → Task 2 ✓
- Suggestion #4 (loading skeletons) → Task 4 ✓
- Suggestion #5a (heatmap tooltips) → Task 5 ✓
- Suggestion #5b (heatmap legend) → Task 1 ✓
- Suggestion #6 (screenshots in info pages) → Task 6 ✓
- Suggestion #7 (skipped — pushed back on)

**Constraint check:**
- Every animation gated behind `body.low-stim` AND `prefers-reduced-motion` ✓
- Only `transform`/`opacity` animated (progress bar uses `scaleX`, scientist uses existing `scale`/keyframes, skeleton uses `transform: translateX`) ✓
- No layout shift (all hover effects use `transform` only) ✓
- No `innerHTML` with dynamic content — all DOM building uses `createElement`/`textContent`/`appendChild`; static literals only used in source HTML files ✓
- No new dependencies, no build step ✓
- Per-task commits with push between tasks ✓

**Stop-points:** Every task ends with a commit, push, status post, and "Ready for next?" gate. The user can bail at any point without leaving anything broken.
