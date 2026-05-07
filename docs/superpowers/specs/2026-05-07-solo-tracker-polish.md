# Solo Tracker — Progress Save + Visual Polish

**Date:** 2026-05-07
**File changed:** `solo/index.html` (single-file React SPA — all changes are here)

---

## Problems Being Solved

1. **Progress loss during pretest**: `saveOutcome()` only fires when the entire pretest finishes. A tab close or device swap mid-way through a 34-question pretest loses every answer.
2. **Visual quality**: The tracker looks functional but plain — white background, minimal hierarchy, small question text that students were zooming in on.

---

## 1. Save Mechanism

### 1a. Per-outcome Supabase save (cross-device resilience)

**What changes in `handlePretestNext()`:**

Currently the function collects all answers and only calls `saveOutcome()` once at the very end when `pretestMode === "done"`. Change it to also save immediately whenever an outcome's pair of questions is completed correctly:

```
after appending to newAnswers:
  find the outcome that was just completed (both its questions now answered)
  if that outcome's two answers are both correct → call saveOutcome() right now
  continue collecting remaining answers as before
  at the end, still call saveOutcome() for any passed outcomes (idempotent upsert, no harm)
```

This means a student who finishes 8 of 34 questions — having passed 4 outcomes — already has those 4 outcomes banked in Supabase, visible on any device they log into next.

### 1b. localStorage checkpoint (same-device tab-crash resilience)

**On each question submission in `handlePretestNext()`**, before advancing the index, write:

```js
localStorage.setItem(
  `solo_pretest_draft_${studentId}`,
  JSON.stringify({ unitId, pretestIdx: pretestIdx + 1, pretestAnswers: newAnswers })
)
```

**On `startPretest(unitId)`**, before initialising state, check:

```js
const draft = localStorage.getItem(`solo_pretest_draft_${studentId}`)
```

If a draft exists for the same `unitId`, show a small resume banner inside the pretest view:

> **"Continue where you left off? You were on question 8 of 34."**  
> [Continue] [Start over]

"Start over" clears the draft and begins from question 1. "Continue" restores `pretestIdx` and `pretestAnswers` from the draft.

**Clear the draft** in two places:
- On successful completion (`pretestMode = "done"`)
- When the student clicks ✕ Exit (clean exit — they chose to leave)

**Note on shared devices:** localStorage only helps on the same device/browser. The per-outcome Supabase save (1a) is the cross-device solution. localStorage is a bonus for tab crashes on the same machine.

---

## 2. Visual Design System

All styles are applied inside the `<style>` block at the top of `solo/index.html`. No external CSS file — the app is a single self-contained file.

### CSS variables (add to `:root`)

```css
--navy:    #1e1b4b;   /* nav background */
--indigo:  #4338ca;   /* primary accent */
--ind-mid: #6366f1;   /* secondary accent */
--ind-50:  #eef2ff;   /* tinted background chips, hover states */
--ind-100: #e0e7ff;   /* progress bar tracks */
--ind-200: #c7d2fe;   /* borders on indigo elements */
--blue:    #3b82f6;   /* gradient end colour */
--bg:      #f4f6fb;   /* page background — light indigo tint */
--surface: #ffffff;
--border:  rgba(15,23,42,0.08);
--text:    #0f172a;
--sub:     #475569;
--muted:   #94a3b8;
--sh-sm:   0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
--sh-md:   0 4px 16px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.04);
--sh-lg:   0 8px 40px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.05);
--sh-hov:  0 16px 48px rgba(67,56,202,0.12), 0 4px 12px rgba(15,23,42,0.07);
--r:       16px;
--tx:      all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

### `body`
- `background: var(--bg)` — the light indigo tint pervades every screen

---

## 3. View-by-View Changes

### Login view

**Layout:** Full-bleed deep gradient background, white card centred.

```
background: linear-gradient(150deg, #1e1b4b 0%, #1d4ed8 60%, #0369a1 100%)
```

- Logo: frosted glass tile (`rgba(255,255,255,0.12)` bg, `blur(8px)`, white border), 54×54px, rounded-xl
- Brand name: 20px/800, white
- Card: white, `border-radius: 20px`, `box-shadow: 0 24px 64px rgba(0,0,0,0.28)`
- Inputs: `border-radius: 10px`, focus ring `rgba(99,102,241,0.13)`, smooth transition
- Submit button: `linear-gradient(135deg, #4338ca, #3b82f6)`, glow shadow

### App nav (shared across all non-login screens)

```
background: var(--navy)   /* #1e1b4b — solid, not gradient */
padding: 13px 18px
```

- Logo: `rgba(255,255,255,0.15)` bg, white border, 28×28px
- Title: 14px/700, white
- Student name pill: `rgba(255,255,255,0.1)` bg, muted white text
- Sign out: ghost, low-opacity white

### Home view (unit selector)

- Page title (`h1` + subtitle) sits at top of scroll area, no gradient hero
- Unit cards: white, `border-radius: 16px`, `box-shadow: var(--sh-md)`, 3px coloured top-line accent
- Hover: `transform: translateY(-2px)`, `box-shadow: var(--sh-hov)`
- Progress bar track: `var(--ind-100)` (indigo-100), fill: `linear-gradient(90deg, --indigo, --blue)` with shimmer `::after` animation
- Band pills: existing red/yellow/green colours kept
- Pre-test button: `background: var(--ind-50)`, `border: 1.5px solid var(--ind-200)`, indigo text

### Rubric view (student)

- Back button: white card style with indigo hover
- Page title + progress bar directly in scroll area (no gradient hero)
- Progress bar: 8px tall, indigo gradient fill on indigo-100 track
- Band section labels: existing colours, `border-radius: 7px`, `border: 1px solid`
- Outcome cards: white, 12px radius, `box-shadow: var(--sh-sm)`, done state gets green border
- Incomplete outcome number circle: `background: var(--ind-50)`, `color: var(--ind-mid)`
- Done number circle: green bg/text
- Action buttons (Grow/Know/Show): as per approved mockup
  - Grow: indigo-50 bg, indigo text, ind-200 border
  - Know: green-50 bg, green text, green border
  - Show: indigo→blue gradient, white text, subtle glow shadow (band-coloured for yellow/green bands)

### Pretest / Assessment / Practice question view

**This is the biggest change.** The question card must fill available screen height.

**Layout structure:**
```
nav (fixed height)
  └─ q-screen (flex:1, flex-direction:column, padding 18px)
       ├─ topbar: [Exit btn] [progress bar] [3/10]   (flex-shrink:0)
       ├─ outcome strip: [Pre-test badge] [outcome name]   (flex-shrink:0)
       ├─ q-card (flex:1, flex-direction:column)
       │    ├─ question text: 22px, font-weight:600, line-height:1.55
       │    └─ options (flex:1, flex-direction:column, gap:10px)
       │         └─ each option: flex:1, min-height:58px, 16px text, 20px side padding
       └─ actions row: [progress dots] [Next button]   (flex-shrink:0)
```

Key values:
- Question text: `font-size: 22px`, `font-weight: 600`, `letter-spacing: -0.02em`
- Option buttons: `flex: 1`, `min-height: 58px`, `font-size: 16px`, `border-radius: 13px`, `border: 2px solid`
- Selected state: indigo border + indigo-50 bg + glow ring `0 0 0 3px rgba(99,102,241,0.12)`
- Next button: indigo→blue gradient, 13px top/bottom padding, 32px side padding

This structure means the 4 option buttons fill whatever space is left below the question text — large tap targets on any screen size, no zooming needed.

### Pretest results view

- Centred icon header (📋, 60px, indigo-50 bg, ind-200 border, indigo glow shadow)
- `h2`: 20px/800
- Result rows: white card style, `box-shadow: var(--sh-sm)`, pass gets green border + bg, fail gets red border
- Action buttons: ghost style + indigo primary

### Resume banner (new — appears at top of pretest when draft detected)

Shown above the first question if a localStorage draft is found:

```
[blue info strip]
  "Continue where you left off? You were on question 8."
  [Start over] [Continue →]
```

Styled as a soft indigo-50 banner with indigo border, dismisses when either button is pressed.

---

## 4. Unchanged

- All question logic, answer checking, scoring — unchanged
- `saveOutcome()` function — unchanged (called more often, not differently)
- Teacher rubric view — gets the same nav/card polish but layout unchanged
- Supabase schema — no new tables
- All game data (UNITS, PRETESTS, PRACTICE, RESOURCES) — unchanged

---

## 5. Files

| File | Change |
|---|---|
| `solo/index.html` | All changes — CSS variables, login, nav, home, rubric, question, results views; save logic in `handlePretestNext` and `startPretest` |

No new files. No database migrations.
