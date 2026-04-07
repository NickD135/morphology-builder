# Unified Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardise all UI chrome (headers, panels, buttons, pills, spacing, typography) across every page so Word Labs feels like one cohesive app, while preserving per-game themed backdrops and accent colours.

**Architecture:** Each page keeps its inline CSS (no shared stylesheet). The standard is enforced by using identical token values everywhere. Per-game variation is limited to three CSS custom properties (`--accent`, `--accent-rgb`, `--header-rgb`) that control colour tinting only. Two header variants exist: dark (scene pages) and light (admin pages).

**Tech Stack:** Pure CSS edits across 18 HTML files. No build tools, no new dependencies.

**Accessibility constraint:** All existing skip links, ARIA labels, landmarks, keyboard navigation, contrast ratios, and low-stim/support mode guards must be preserved.

---

## File Map

All files are in `/workspaces/morphology-builder/`:

**Batch 1 — Dark scene game pages (already close to standard):**
- `phoneme-mode.html` — purple accent, dark studio scene
- `syllable-mode.html` — amber accent, dark workshop scene
- `sound-sorter.html` — sky-blue accent, dark scene
- `breakdown-mode.html` — red accent, explosion lab scene
- `meaning-mode.html` — brown accent, library scene
- `speed-mode.html` — navy accent, rocket room scene
- `flashcard-mode.html` — brown accent, dark scene

**Batch 2 — Dark scene game pages (non-standard class names):**
- `mission-mode.html` — green accent, uses `.site-header`/`.hdr-*` pattern
- `homophone-mode.html` — rose accent, uses `.site-header`/`.hdr-*` pattern
- `word-refinery.html` — amber accent, uses `.header` with `!important` overrides
- `word-spectrum.html` — cyan accent, uses `.header` with `!important` overrides
- `root-lab.html` — amber accent, currently light-bg page with old-style large brand

**Batch 3 — Light/admin pages (need most structural changes):**
- `class-setup.html` — indigo accent, light background
- `scientist.html` — indigo accent, light background, uses `.brandName`/`.brandSub`
- `dashboard.html` — indigo accent, navy dark theme
- `spelling-test.html` — indigo accent, light background
- `teacher-login.html` — indigo accent, dark gradient, uses `.brandName`

**Batch 4 — Landing page:**
- `landing.html` — indigo accent, dark gradient

---

## Standard Token Values (reference for all tasks)

### Dark Header (scene pages)
```css
.header{
  position:fixed; top:0; left:0; right:0; z-index:50;
  background:rgba(var(--header-rgb),.75); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  border-bottom:1px solid rgba(255,255,255,.1); padding:0;
}
.headerInner{
  padding:0 20px; height:56px; display:flex; align-items:center;
  justify-content:space-between; gap:12px; flex-wrap:wrap; max-width:none;
}
```

### Light Header (admin pages)
```css
.header{
  position:sticky; top:0; z-index:50;
  background:rgba(255,255,255,.93); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  border-bottom:1px solid #e2e8f0; box-shadow:0 1px 2px rgba(15,23,42,.05); padding:0;
}
.headerInner{
  padding:0 20px; height:56px; display:flex; align-items:center;
  justify-content:space-between; gap:12px; flex-wrap:wrap; max-width:none;
}
```

### Brand Mark (dark variant)
```css
.brandIcon{ width:36px; height:36px; border-radius:10px; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 8px 16px rgba(0,0,0,.15); flex:0 0 auto; }
.brandText h1{ margin:0; font-size:15px; font-weight:900; letter-spacing:-.02em; color:#f1f5f9; }
.brandText .sub{ font-size:9px; text-transform:uppercase; letter-spacing:.22em; color:rgba(255,255,255,.6); font-weight:800; display:block; margin-top:2px; }
```

### Brand Mark (light variant)
```css
.brandIcon{ width:36px; height:36px; border-radius:10px; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 8px 16px rgba(0,0,0,.1); flex:0 0 auto; }
.brandText h1{ margin:0; font-size:15px; font-weight:900; letter-spacing:-.02em; color:#312e81; }
.brandText .sub{ font-size:9px; text-transform:uppercase; letter-spacing:.22em; color:var(--accent); font-weight:800; display:block; margin-top:2px; }
```

### HUD (pills & buttons — dark variant)
```css
.hud{ display:flex; gap:8px; align-items:center; flex-wrap:nowrap; overflow-x:auto; }
.hud::-webkit-scrollbar{ display:none; }
.pill{ display:inline-flex; align-items:center; justify-content:center; min-height:32px; border:1px solid rgba(var(--accent-rgb),.3); border-radius:999px; background:rgba(var(--accent-rgb),.12); padding:6px 14px; font-size:12px; font-weight:800; color:rgba(255,255,255,.85); white-space:nowrap; flex-shrink:0; }
.pill.score{ background:rgba(var(--accent-rgb),.45); color:#fff; border-color:transparent; }
.pill.streak{ background:rgba(251,146,60,.15); color:#fed7aa; border-color:rgba(251,146,60,.3); }
.topBtn{ border:none; background:rgba(255,255,255,.1); color:rgba(255,255,255,.85); font-weight:800; font-size:11px; text-transform:uppercase; letter-spacing:.12em; padding:7px 13px; border-radius:10px; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; flex-shrink:0; transition:all .15s; }
.topBtn:hover{ background:rgba(255,255,255,.18); }
```

### HUD (pills & buttons — light variant)
```css
.hud{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.pill{ display:inline-flex; align-items:center; justify-content:center; min-height:32px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; padding:6px 14px; font-size:12px; font-weight:800; color:#334155; }
.pill.score{ background:var(--accent); color:#fff; border-color:transparent; }
.pill.streak{ background:#fff7ed; color:#9a3412; border-color:#fed7aa; }
.topBtn{ border:none; background:#0f172a; color:#fff; font-weight:800; font-size:11px; text-transform:uppercase; letter-spacing:.12em; padding:7px 13px; border-radius:10px; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; gap:4px; }
.topBtn:hover{ background:#000; }
```

### Login Button (dark variant)
```css
#wlLoginBtn{ border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.08); color:rgba(255,255,255,.85); font-weight:800; font-size:11px; padding:7px 13px; border-radius:10px; cursor:pointer; font-family:'Lexend',sans-serif; white-space:nowrap; flex-shrink:0; }
```

### Login Button (light variant)
```css
#wlLoginBtn{ border:1px solid #e2e8f0; background:#fff; color:#334155; font-weight:800; font-size:11px; padding:7px 13px; border-radius:10px; cursor:pointer; font-family:'Lexend',sans-serif; }
```

### Panels (dark scene)
```css
.panel{ background:rgba(255,255,255,.92); border:2px solid rgba(var(--accent-rgb),.2); border-radius:20px; box-shadow:0 16px 48px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.6); overflow:hidden; }
.panelInner{ padding:28px; }
.panelTitle{ margin:0 0 12px 0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.22em; color:var(--accent); }
```

### Panels (light bg)
```css
.panel{ background:#fff; border:2px solid #e2e8f0; border-radius:20px; box-shadow:0 12px 24px rgba(15,23,42,.06); overflow:hidden; }
.panelInner{ padding:28px; }
.panelTitle{ margin:0 0 12px 0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.22em; color:var(--accent); }
```

### Primary/Secondary Buttons
```css
.primaryBtn{ border:none; background:var(--accent); color:#fff; font-weight:900; font-size:13px; padding:14px 28px; border-radius:16px; cursor:pointer; text-transform:uppercase; letter-spacing:.08em; box-shadow:0 10px 20px rgba(var(--accent-rgb),.2); transition:all .15s; }
.primaryBtn:hover{ filter:brightness(.9); transform:translateY(-1px); }
.secondaryBtn{ border:2px solid #e2e8f0; background:#fff; color:#334155; font-weight:800; font-size:13px; padding:12px 20px; border-radius:16px; cursor:pointer; text-transform:uppercase; letter-spacing:.08em; transition:all .15s; }
.secondaryBtn:hover{ background:#f8fafc; }
```

### Start Button
```css
.startBtn{ border:none; background:var(--accent); color:#fff; font-weight:900; font-size:16px; letter-spacing:.08em; padding:18px 48px; border-radius:20px; cursor:pointer; text-transform:uppercase; box-shadow:0 16px 32px rgba(var(--accent-rgb),.24); transition:all .15s; }
.startBtn:hover{ filter:brightness(.9); transform:translateY(-2px); }
```

---

## Tasks

### Task 1: phoneme-mode.html

**Files:**
- Modify: `phoneme-mode.html`

This page uses purple accent and is already fairly close. Main changes: standardise header to fixed dark bar, brand icon from 50px area to 36px (already partially there), pill sizing, add CSS custom properties.

- [ ] **Step 1: Add CSS custom properties after `:root`**

Add these three lines inside the existing `:root` block:

```css
--accent:#7c3aed; --accent-rgb:124,58,237; --header-rgb:10,5,25;
```

- [ ] **Step 2: Replace `.header` CSS**

Replace the current:
```css
.header{ position:sticky; top:0; z-index:20; background:var(--bg); border-bottom:1px solid var(--line); box-shadow:0 1px 2px rgba(15,23,42,.05); }
```

With the dark header standard:
```css
.header{ position:fixed; top:0; left:0; right:0; z-index:50; background:rgba(var(--header-rgb),.75); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-bottom:1px solid rgba(255,255,255,.1); padding:0; }
```

- [ ] **Step 3: Replace `.headerInner` CSS**

Replace the current:
```css
.headerInner{ max-width:1100px; margin:0 auto; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
```

With:
```css
.headerInner{ padding:0 20px; height:56px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; max-width:none; }
```

- [ ] **Step 4: Replace `.brandIcon` CSS**

Replace the current:
```css
.brandIcon{ width:50px; height:50px; border-radius:14px; background:var(--purple); color:#fff; display:flex; align-items:center; justify-content:center; font-size:22px; box-shadow:0 12px 24px rgba(124,58,237,.2); }
```

With:
```css
.brandIcon{ width:36px; height:36px; border-radius:10px; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 8px 16px rgba(0,0,0,.15); flex:0 0 auto; }
```

- [ ] **Step 5: Replace brand text CSS**

Replace:
```css
.brand h1{ margin:0; font-size:26px; font-weight:900; letter-spacing:-.02em; color:#4c1d95; }
.brand .sub{ font-size:10px; text-transform:uppercase; letter-spacing:.25em; color:var(--purple); font-weight:900; margin-top:3px; display:block; }
```

With:
```css
.brand h1{ margin:0; font-size:15px; font-weight:900; letter-spacing:-.02em; color:#f1f5f9; }
.brand .sub{ font-size:9px; text-transform:uppercase; letter-spacing:.22em; color:rgba(255,255,255,.6); font-weight:800; display:block; margin-top:2px; }
```

- [ ] **Step 6: Replace `.hud` CSS**

Replace:
```css
.hud{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
```

With:
```css
.hud{ display:flex; gap:8px; align-items:center; flex-wrap:nowrap; overflow-x:auto; }
.hud::-webkit-scrollbar{ display:none; }
```

- [ ] **Step 7: Replace `.pill` CSS**

Replace:
```css
.pill{ display:inline-flex; align-items:center; justify-content:center; min-height:40px; border:1px solid var(--line); border-radius:999px; background:#fff; padding:8px 16px; font-size:13px; font-weight:800; color:#334155; }
.pill.score{ background:var(--purple); color:#fff; border-color:transparent; }
.pill.streak{ background:var(--orange-soft); color:var(--orange-text); border-color:var(--orange-line); }
```

With:
```css
.pill{ display:inline-flex; align-items:center; justify-content:center; min-height:32px; border:1px solid rgba(var(--accent-rgb),.3); border-radius:999px; background:rgba(var(--accent-rgb),.12); padding:6px 14px; font-size:12px; font-weight:800; color:rgba(255,255,255,.85); white-space:nowrap; flex-shrink:0; }
.pill.score{ background:rgba(var(--accent-rgb),.45); color:#fff; border-color:transparent; }
.pill.streak{ background:rgba(251,146,60,.15); color:#fed7aa; border-color:rgba(251,146,60,.3); }
```

- [ ] **Step 8: Replace `.topBtn` CSS**

Replace:
```css
.topBtn{ border:none; background:#0f172a; color:#fff; font-weight:800; font-size:12px; text-transform:uppercase; letter-spacing:.12em; padding:12px 16px; border-radius:14px; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; }
.topBtn:hover{ background:#000; }
```

With:
```css
.topBtn{ border:none; background:rgba(255,255,255,.1); color:rgba(255,255,255,.85); font-weight:800; font-size:11px; text-transform:uppercase; letter-spacing:.12em; padding:7px 13px; border-radius:10px; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; flex-shrink:0; transition:all .15s; }
.topBtn:hover{ background:rgba(255,255,255,.18); }
```

- [ ] **Step 9: Replace `.panel` CSS**

Replace:
```css
.panel{ background:var(--panel); border:4px solid var(--line); border-radius:28px; box-shadow:0 20px 28px rgba(15,23,42,.06); overflow:hidden; }
```

With:
```css
.panel{ background:rgba(255,255,255,.92); border:2px solid rgba(var(--accent-rgb),.2); border-radius:20px; box-shadow:0 16px 48px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.6); overflow:hidden; }
```

- [ ] **Step 10: Update `.panelTitle` colour**

Replace:
```css
.panelTitle{ margin:0 0 6px 0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.22em; color:var(--purple); }
```

With:
```css
.panelTitle{ margin:0 0 12px 0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.22em; color:var(--accent); }
```

- [ ] **Step 11: Update `.startBtn` to use accent**

Replace any hardcoded purple in `.startBtn`:
```css
.startBtn{ border:none; background:var(--accent); color:#fff; font-weight:900; font-size:16px; letter-spacing:.08em; padding:18px 48px; border-radius:20px; cursor:pointer; text-transform:uppercase; box-shadow:0 16px 32px rgba(var(--accent-rgb),.24); transition:all .15s; }
.startBtn:hover{ filter:brightness(.9); transform:translateY(-2px); }
```

- [ ] **Step 12: Update `#wlLoginBtn` inline style in HTML**

Find the `wlLoginBtn` button in the HTML body and replace its inline style with:
```html
style="border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:rgba(255,255,255,.85);font-weight:800;font-size:11px;padding:7px 13px;border-radius:10px;cursor:pointer;font-family:'Lexend',sans-serif;white-space:nowrap;flex-shrink:0;"
```

- [ ] **Step 13: Add body padding-top for fixed header**

Add to the `body` rule:
```css
padding-top:56px;
```

This compensates for the header changing from `sticky` to `fixed`.

- [ ] **Step 14: Update any remaining hardcoded purple references**

Search for `#7c3aed`, `#6d28d9`, `#4c1d95`, `var(--purple)` in game-specific UI elements (like `.diffBtn.active`, `.speakBtn`, `.round-btn.active`) and replace with `var(--accent)` or `rgba(var(--accent-rgb),...)` equivalents. Keep `--purple` defined in `:root` for these references if simpler, but update `.pill.score` and `.startIcon` background to `var(--accent)`.

- [ ] **Step 15: Verify and commit**

Open the page in the browser and verify:
- Header is fixed, dark, translucent over the scene
- Brand icon is 36px, brand name is 15px
- Pills are compact, tinted to accent
- Panels have 2px border, 20px radius
- All buttons are correctly sized
- Game still functions (start screen, difficulty select, gameplay, scoring)
- Accessibility: skip link still works, ARIA labels present, keyboard navigation works

```bash
git add phoneme-mode.html
git commit -m "style: unify phoneme-mode chrome to design system tokens"
```

---

### Task 2: syllable-mode.html

**Files:**
- Modify: `syllable-mode.html`

Amber accent. Same pattern as Task 1.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#92400e; --accent-rgb:146,64,14; --header-rgb:18,10,2;
```

- [ ] **Step 2: Replace `.header` with dark header standard** (same CSS as Task 1, Step 2)

- [ ] **Step 3: Replace `.headerInner`** (same as Task 1, Step 3)

- [ ] **Step 4: Replace `.brandIcon`** — same as Task 1 Step 4 standard

- [ ] **Step 5: Replace brand text** — same standard dark variant

- [ ] **Step 6: Replace `.hud`** — same as Task 1 Step 6

- [ ] **Step 7: Replace `.pill`** — same dark pill standard

- [ ] **Step 8: Replace `.topBtn`** — same dark topBtn standard

- [ ] **Step 9: Replace `.panel`** — same dark panel standard

- [ ] **Step 10: Replace `.panelTitle`** colour to `var(--accent)`

- [ ] **Step 11: Update `.startBtn`** — use `var(--accent)` and `rgba(var(--accent-rgb),...)`

- [ ] **Step 12: Update `#wlLoginBtn`** inline style — same dark login btn standard

- [ ] **Step 13: Add `padding-top:56px` to body**

- [ ] **Step 14: Update remaining hardcoded amber references** to use `var(--accent)` where appropriate

- [ ] **Step 15: Verify and commit**
```bash
git add syllable-mode.html
git commit -m "style: unify syllable-mode chrome to design system tokens"
```

---

### Task 3: sound-sorter.html

**Files:**
- Modify: `sound-sorter.html`

Sky-blue/teal accent.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#0c4a6e; --accent-rgb:12,74,110; --header-rgb:5,8,22;
```

- [ ] **Steps 2–15: Apply identical dark header/brand/pill/panel/button standard as Task 1**

Replace all chrome CSS with the standard dark variants. Update any hardcoded teal/sky references to `var(--accent)`.

- [ ] **Step 16: Verify and commit**
```bash
git add sound-sorter.html
git commit -m "style: unify sound-sorter chrome to design system tokens"
```

---

### Task 4: breakdown-mode.html

**Files:**
- Modify: `breakdown-mode.html`

Red accent.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#dc2626; --accent-rgb:220,38,38; --header-rgb:0,0,0;
```

- [ ] **Steps 2–15: Apply identical dark standard as Task 1**

- [ ] **Step 16: Verify and commit**
```bash
git add breakdown-mode.html
git commit -m "style: unify breakdown-mode chrome to design system tokens"
```

---

### Task 5: meaning-mode.html

**Files:**
- Modify: `meaning-mode.html`

Brown accent.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#6b3d10; --accent-rgb:107,61,16; --header-rgb:18,8,2;
```

- [ ] **Steps 2–15: Apply identical dark standard as Task 1**

- [ ] **Step 16: Verify and commit**
```bash
git add meaning-mode.html
git commit -m "style: unify meaning-mode chrome to design system tokens"
```

---

### Task 6: speed-mode.html

**Files:**
- Modify: `speed-mode.html`

Navy/blue accent. Currently has oversized brand (28px h1, 50px icon) and wide 1500px container.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#1e3a5f; --accent-rgb:30,58,95; --header-rgb:4,8,20;
```

- [ ] **Steps 2–15: Apply identical dark standard as Task 1**

Note: `.wrap` max-width should stay as-is for speed-mode since the morpheme grid needs the horizontal space. Only the header chrome changes.

- [ ] **Step 16: Verify and commit**
```bash
git add speed-mode.html
git commit -m "style: unify speed-mode chrome to design system tokens"
```

---

### Task 7: flashcard-mode.html

**Files:**
- Modify: `flashcard-mode.html`

Brown accent. Currently has 50px icon, 24px h1, 1200px wrap.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#78350f; --accent-rgb:120,53,15; --header-rgb:20,10,3;
```

- [ ] **Steps 2–15: Apply identical dark standard as Task 1**

- [ ] **Step 16: Verify and commit**
```bash
git add flashcard-mode.html
git commit -m "style: unify flashcard-mode chrome to design system tokens"
```

---

### Task 8: mission-mode.html

**Files:**
- Modify: `mission-mode.html`

Green accent. Uses `.site-header` / `.hdr-*` class names. Need to rename classes to standard `.header` / `.headerInner` / `.brandIcon` / `.brandText` pattern OR update the existing `.hdr-*` classes to match standard values. **Rename to standard** for consistency.

- [ ] **Step 1: Add CSS custom properties to `:root` (or create `:root` block if missing)**

```css
--accent:#16a34a; --accent-rgb:22,163,74; --header-rgb:2,20,12;
```

- [ ] **Step 2: Replace `.site-header` CSS with `.header` standard dark**

Remove the entire `.site-header` block and replace with:
```css
.header{ position:fixed; top:0; left:0; right:0; z-index:50; background:rgba(var(--header-rgb),.75); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-bottom:1px solid rgba(255,255,255,.1); padding:0; }
.headerInner{ padding:0 20px; height:56px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; max-width:none; }
```

- [ ] **Step 3: Replace `.hdr-brand`/`.hdr-icon`/`.hdr-title`/`.hdr-sub` CSS**

Remove those blocks and add standard brand CSS:
```css
.brand{ display:flex; align-items:center; gap:8px; flex-shrink:0; }
.brandIcon{ width:36px; height:36px; border-radius:10px; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 8px 16px rgba(0,0,0,.15); flex:0 0 auto; }
.brandText h1{ margin:0; font-size:15px; font-weight:900; letter-spacing:-.02em; color:#f1f5f9; }
.brandText .sub{ font-size:9px; text-transform:uppercase; letter-spacing:.22em; color:rgba(255,255,255,.6); font-weight:800; display:block; margin-top:2px; }
```

- [ ] **Step 4: Replace `.hud-pill` and `.hdr-btn` CSS** with standard `.pill` and `.topBtn` dark variants

- [ ] **Step 5: Update HTML structure** — rename elements:

Change `<header class="site-header"` to `<header class="header"`. Add a `<div class="headerInner">` wrapper inside. Rename `.hdr-brand` div to `.brand`, `.hdr-icon` to `.brandIcon`, rename title/sub wrappers to `.brandText h1` / `.brandText .sub`. Rename `.hdr-pills` to `.hud`. Rename `.hud-pill` classes to `.pill`. Rename `.hdr-btn` to `.topBtn`.

- [ ] **Step 6: Update `#wlLoginBtn`** inline style to dark standard

- [ ] **Step 7: Add `padding-top:56px` to body or the main content area**

- [ ] **Step 8: Replace `.panel` CSS** if present — use dark panel standard

- [ ] **Step 9: Verify and commit**
```bash
git add mission-mode.html
git commit -m "style: unify mission-mode chrome to design system tokens"
```

---

### Task 9: homophone-mode.html

**Files:**
- Modify: `homophone-mode.html`

Rose accent. Same `.site-header`/`.hdr-*` renaming needed as Task 8.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#9d174d; --accent-rgb:157,23,77; --header-rgb:12,8,20;
```

- [ ] **Steps 2–9: Same class rename and CSS replacement as Task 8**

Use rose accent values instead of green.

- [ ] **Step 10: Verify and commit**
```bash
git add homophone-mode.html
git commit -m "style: unify homophone-mode chrome to design system tokens"
```

---

### Task 10: word-refinery.html

**Files:**
- Modify: `word-refinery.html`

Amber accent. Currently uses `.header` with `!important` overrides. Remove all `!important` and replace with clean standard values.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#92400e; --accent-rgb:146,64,14; --header-rgb:13,7,0;
```

- [ ] **Step 2: Replace entire `.header` block** — remove all `!important` declarations, use clean dark header standard

- [ ] **Step 3: Replace `.headerInner`** — remove `!important`, use standard

- [ ] **Step 4: Replace `.brandIcon`, `.brandText h1`, `.brandText .sub`** — remove `!important`, use dark brand standard

- [ ] **Step 5: Replace `.pill`, `.topBtn`, `#wlLoginBtn`** — remove `!important`, use dark standard

- [ ] **Step 6: Verify and commit**
```bash
git add word-refinery.html
git commit -m "style: unify word-refinery chrome to design system tokens"
```

---

### Task 11: word-spectrum.html

**Files:**
- Modify: `word-spectrum.html`

Cyan accent. Same `!important` cleanup as Task 10.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#0e7490; --accent-rgb:14,116,144; --header-rgb:6,13,24;
```

- [ ] **Steps 2–6: Same `!important` cleanup and standard replacement as Task 10**

- [ ] **Step 7: Verify and commit**
```bash
git add word-spectrum.html
git commit -m "style: unify word-spectrum chrome to design system tokens"
```

---

### Task 12: root-lab.html

**Files:**
- Modify: `root-lab.html`

Amber accent. Currently a light-bg page with old-style large brand (50px icon, 26px h1). If root-lab has a themed scene, use dark variant. If it's a plain light page, use light variant. Check the page and apply the appropriate standard.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#b45309; --accent-rgb:180,83,9; --header-rgb:20,10,3;
```

- [ ] **Step 2: Determine variant** — check if root-lab has a dark scene backdrop. If yes, apply dark header/brand/pill standard. If light bg, apply light standard.

- [ ] **Steps 3–14: Apply appropriate standard** (dark or light) following same pattern as Task 1 or Task 13

- [ ] **Step 15: Verify and commit**
```bash
git add root-lab.html
git commit -m "style: unify root-lab chrome to design system tokens"
```

---

### Task 13: class-setup.html

**Files:**
- Modify: `class-setup.html`

Indigo accent, light background. Biggest changes: icon 50→36, h1 22→15, panel border 4px→2px, radius 28→20.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#4338ca; --accent-rgb:67,56,202;
```

- [ ] **Step 2: Update `.header`** to light standard:

```css
.header{ position:sticky; top:0; z-index:50; background:rgba(255,255,255,.93); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-bottom:1px solid #e2e8f0; box-shadow:0 1px 2px rgba(15,23,42,.05); padding:0; }
```

- [ ] **Step 3: Update `.headerInner`** — remove `max-width`, set `height:56px`, `padding:0 20px`

Replace:
```css
.headerInner{ max-width:1100px; margin:0 auto; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
```
With:
```css
.headerInner{ padding:0 20px; height:56px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; max-width:none; }
```

- [ ] **Step 4: Replace `.brandIcon`**:

```css
.brandIcon{ width:36px; height:36px; border-radius:10px; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 8px 16px rgba(0,0,0,.1); flex:0 0 auto; }
```

- [ ] **Step 5: Replace `.brandText h1` and `.brandText .sub`** — light variant:

```css
.brandText h1{ margin:0; font-size:15px; font-weight:900; letter-spacing:-.02em; color:#312e81; }
.brandText .sub{ font-size:9px; text-transform:uppercase; letter-spacing:.22em; color:var(--accent); font-weight:800; display:block; margin-top:2px; }
```

- [ ] **Step 6: Replace `.topBtn`** — light variant

- [ ] **Step 7: Replace `.panel`** — light panel standard (2px border, 20px radius)

- [ ] **Step 8: Update `.panelTitle`** colour to `var(--accent)`

- [ ] **Step 9: Verify and commit**
```bash
git add class-setup.html
git commit -m "style: unify class-setup chrome to design system tokens"
```

---

### Task 14: scientist.html

**Files:**
- Modify: `scientist.html`

Indigo accent, light background. Uses `.brandName`/`.brandSub` instead of `.brandText h1`/`.brandText .sub`. Either rename classes or just update the CSS values to match standard.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#4338ca; --accent-rgb:67,56,202;
```

- [ ] **Step 2: Update `.header`** — already close, just verify it matches light standard

- [ ] **Step 3: Update `.brandIcon`** — 44→36, radius 12→10

Replace:
```css
.brandIcon{ width:44px; height:44px; border-radius:12px; background:var(--indigo); color:#fff; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 8px 20px rgba(67,56,202,.22); }
```
With:
```css
.brandIcon{ width:36px; height:36px; border-radius:10px; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 8px 16px rgba(0,0,0,.1); flex:0 0 auto; }
```

- [ ] **Step 4: Update `.brandName`** — 20→15

Replace:
```css
.brandName{ font-size:20px; font-weight:900; color:#312e81; letter-spacing:-.02em; }
```
With:
```css
.brandName{ font-size:15px; font-weight:900; color:#312e81; letter-spacing:-.02em; }
```

- [ ] **Step 5: Update `.brandSub`** — 9px is fine, update letter-spacing to `.22em`

- [ ] **Step 6: Update `.headerInner`** — set `height:56px`, `padding:0 20px`, remove `max-width`

- [ ] **Step 7: Verify and commit**
```bash
git add scientist.html
git commit -m "style: unify scientist chrome to design system tokens"
```

---

### Task 15: dashboard.html

**Files:**
- Modify: `dashboard.html`

Indigo accent, navy dark theme. Dashboard has a unique dense layout that's intentional — keep the overall dark navy aesthetic but standardise the brand mark and panel corners.

- [ ] **Step 1: Add CSS custom properties to `:root`** (or update existing)

```css
--accent:#4338ca; --accent-rgb:67,56,202;
```

- [ ] **Step 2: Update `.brandIcon`** — 32→36, radius 8→10

Replace:
```css
.brandIcon{ width:32px; height:32px; border-radius:8px; background:var(--indigo); color:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; }
```
With:
```css
.brandIcon{ width:36px; height:36px; border-radius:10px; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; flex:0 0 auto; }
```

- [ ] **Step 3: Update `.brandText h1`** — 15px is correct, verify

- [ ] **Step 4: Update `.brandText .sub`** — letter-spacing `.2em`→`.22em`, font-weight `800`→`800` (OK)

- [ ] **Step 5: Update `.panel`** — radius 16→20, border 1px→2px

Replace:
```css
.panel{ background:var(--panel); border:1px solid var(--line); border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,.2); margin-bottom:16px; }
```
With:
```css
.panel{ background:var(--panel); border:2px solid var(--line); border-radius:20px; box-shadow:0 4px 12px rgba(0,0,0,.2); margin-bottom:16px; }
```

- [ ] **Step 6: Update `.topBtn` font-size** — 9px→11px

- [ ] **Step 7: Update headerInner** — add `height:56px` if not already set

- [ ] **Step 8: Verify and commit**
```bash
git add dashboard.html
git commit -m "style: unify dashboard chrome to design system tokens"
```

---

### Task 16: spelling-test.html

**Files:**
- Modify: `spelling-test.html`

Indigo accent, light background.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#4338ca; --accent-rgb:67,56,202;
```

- [ ] **Step 2: Update `.header`** — apply light standard with `height:56px`, `padding:0 20px`

- [ ] **Step 3: Update `.brandIcon`** — 40→36, radius 11→10

- [ ] **Step 4: Update `.brandText h1`** — 18→15

- [ ] **Step 5: Update `.brandText .sub`** — letter-spacing `.22em` is correct, verify font-weight 800

- [ ] **Step 6: Verify and commit**
```bash
git add spelling-test.html
git commit -m "style: unify spelling-test chrome to design system tokens"
```

---

### Task 17: teacher-login.html

**Files:**
- Modify: `teacher-login.html`

Indigo accent, dark gradient. Uses `.brandName` without sub text.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#4338ca; --accent-rgb:67,56,202; --header-rgb:13,11,26;
```

- [ ] **Step 2: Update `.header`** — apply dark header standard (replace `rgba(13,11,26,.92)` with `rgba(var(--header-rgb),.75)`)

- [ ] **Step 3: Update `.brandIcon`** — 36px is correct, verify `font-size:16px`, `border-radius:10px`

- [ ] **Step 4: Update `.brandName`** — 18→15

- [ ] **Step 5: Update headerInner** — add `height:56px`, `padding:0 20px`

- [ ] **Step 6: Verify and commit**
```bash
git add teacher-login.html
git commit -m "style: unify teacher-login chrome to design system tokens"
```

---

### Task 18: landing.html

**Files:**
- Modify: `landing.html`

Indigo accent. Landing page has a custom hero section and complex layout. Only standardise the header bar and any shared chrome elements — leave the hero, activity cards, and page-specific content as-is.

- [ ] **Step 1: Add CSS custom properties to `:root`**

```css
--accent:#4338ca; --accent-rgb:67,56,202;
```

- [ ] **Step 2: Check header** — landing may have a custom transparent header that works well for the hero. If the header uses the same brand mark pattern, standardise icon (36px) and h1 (15px). If landing's header is fundamentally different (e.g. no brand icon, just text), leave it as-is.

- [ ] **Step 3: Verify and commit**
```bash
git add landing.html
git commit -m "style: unify landing chrome to design system tokens"
```

---

### Task 19: Final audit

- [ ] **Step 1: Open every page and verify header consistency**

Check each page in the browser. The header bar should look identical in structure across all pages — same height, same brand size, same pill sizes, same button sizes. Only the accent colour tint should differ.

- [ ] **Step 2: Spot-check panel consistency**

Verify panels have consistent 2px border, 20px radius across at least 5 different pages.

- [ ] **Step 3: Test accessibility**

On at least 3 pages, verify:
- Skip link still works (Tab from page load)
- Screen reader landmarks present
- Keyboard navigation through game controls works
- Colour contrast passes (especially the new translucent pills on dark backgrounds)

- [ ] **Step 4: Test mobile**

On at least 3 game pages, resize to 375px width. Verify:
- Header doesn't overflow
- Pills scroll horizontally
- Brand mark doesn't get cut off

- [ ] **Step 5: Final commit**

If any small fixes were needed during audit:
```bash
git add -A
git commit -m "style: final audit fixes for unified design system"
```
