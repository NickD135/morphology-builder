# Site Consistency and Professionalism — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify headers, footers, naming, titles, and accessibility across all non-game pages so the site looks professional and consistent for NSW DoE submission.

**Architecture:** Text replacements for naming/titles (Tasks 1–3), then accessibility fixes (Task 4), then footer standardisation across all pages (Task 5), then the largest change — unified dark header across all non-game pages (Tasks 6–9). Each task is a self-contained commit.

**Tech Stack:** HTML/CSS only — no build system, no JS changes, inline styles per page.

---

## Task 1: Activity and Feature Name Fixes

**Files:**
- Modify: `faq.html`
- Modify: `teacher-guide.html`
- Modify: `about.html`

- [ ] **Step 1: Fix "Meaning Mode" → "Meaning Match-Up" in faq.html**

Search for all instances of "Meaning Mode" in `faq.html` and replace with "Meaning Match-Up".

- [ ] **Step 2: Fix "Flashcard Mode" → "Flashcards" in faq.html**

Search for all instances of "Flashcard Mode" in `faq.html` and replace with "Flashcards".

- [ ] **Step 3: Fix "Meaning Mode" → "Meaning Match-Up" in teacher-guide.html**

Search for all instances of "Meaning Mode" in `teacher-guide.html` and replace with "Meaning Match-Up".

- [ ] **Step 4: Fix "Low-stimulation mode" → "Low-stim mode" in about.html**

Search for all instances of "Low-stimulation mode" in `about.html` and replace with "Low-stim mode".

- [ ] **Step 5: Verify no remaining instances across entire site**

Run:
```bash
grep -rni "Meaning Mode\|Flashcard Mode\|Low-stimulation mode" --include="*.html" /workspaces/morphology-builder/ | grep -v node_modules | grep -v docs/
```
Expected: No output (zero matches).

- [ ] **Step 6: Commit**

```bash
git add faq.html teacher-guide.html about.html
git commit -m "fix: standardise activity and feature names across site

Meaning Mode → Meaning Match-Up, Flashcard Mode → Flashcards,
Low-stimulation mode → Low-stim mode."
```

---

## Task 2: Page Title Standardisation

**Files:**
- Modify: `landing.html`
- Modify: `about.html`
- Modify: `privacy.html`
- Modify: `terms.html`
- Modify: `parent-privacy.html`
- Modify: `security-architecture.html`
- Modify: `incident-response.html`
- Modify: `data-agreement.html`
- Modify: `faq.html`
- Modify: `teacher-guide.html`

All titles must follow the pattern: `Word Labs – [Page Name]`

- [ ] **Step 1: Fix landing.html title**

Change `<title>Word Labs</title>` to `<title>Word Labs – Home</title>`.

- [ ] **Step 2: Fix about.html title**

Change `<title>About – Word Labs</title>` to `<title>Word Labs – About</title>`.

- [ ] **Step 3: Fix privacy.html title**

Change `<title>Privacy Policy – Word Labs</title>` to `<title>Word Labs – Privacy Policy</title>`.

- [ ] **Step 4: Fix terms.html title**

Change `<title>Terms of Service – Word Labs</title>` to `<title>Word Labs – Terms of Service</title>`.

- [ ] **Step 5: Fix parent-privacy.html title**

Check current title. If it reads `[Name] – Word Labs`, flip to `Word Labs – [Name]`.

- [ ] **Step 6: Fix security-architecture.html title**

Change `<title>Security Architecture – Word Labs</title>` to `<title>Word Labs – Security Architecture</title>`.

- [ ] **Step 7: Fix incident-response.html title**

Change `<title>Incident Response Plan – Word Labs</title>` to `<title>Word Labs – Incident Response Plan</title>`.

- [ ] **Step 8: Fix data-agreement.html title**

Change `<title>School Data Handling Agreement – Word Labs</title>` to `<title>Word Labs – Data Handling Agreement</title>`.

- [ ] **Step 9: Fix faq.html title**

Check current title. If it reads `FAQ – Word Labs`, change to `<title>Word Labs – FAQ</title>`.

- [ ] **Step 10: Fix teacher-guide.html title**

Check current title. If it reads `Teacher Guide – Word Labs`, change to `<title>Word Labs – Teacher Guide</title>`.

- [ ] **Step 11: Verify all non-game page titles follow the pattern**

Run:
```bash
grep -rn "<title>" --include="*.html" /workspaces/morphology-builder/ | grep -v node_modules | grep -v docs/ | grep -v "Word Labs –"
```
Expected: Only game pages (which have their own titles) should remain. All non-game pages should now match `Word Labs – *`.

- [ ] **Step 12: Commit**

```bash
git add landing.html about.html privacy.html terms.html parent-privacy.html security-architecture.html incident-response.html data-agreement.html faq.html teacher-guide.html
git commit -m "fix: standardise page titles to 'Word Labs – [Page Name]' format"
```

---

## Task 3: Accessibility Fixes

**Files:**
- Modify: `landing.html`
- Modify: `dashboard.html`
- Modify: `spelling-test.html`

- [ ] **Step 1: Add skip link to landing.html**

Add immediately after `<body>`:
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

Add to the CSS block (if not already present):
```css
.skip-link{position:absolute;top:-40px;left:0;background:#4338ca;color:#fff;padding:8px 16px;z-index:10000;font-weight:700;font-size:14px;border-radius:0 0 8px 0;transition:top .2s;}
.skip-link:focus{top:0;}
```

Add `id="main-content"` to the main content container element.

- [ ] **Step 2: Add skip link to dashboard.html**

Add immediately after `<body>`:
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

Add to the CSS block (if not already present):
```css
.skip-link{position:absolute;top:-40px;left:0;background:#4338ca;color:#fff;padding:8px 16px;z-index:10000;font-weight:700;font-size:14px;border-radius:0 0 8px 0;transition:top .2s;}
.skip-link:focus{top:0;}
```

Add `id="main-content"` to the main content area.

- [ ] **Step 3: Fix spelling-test.html favicon**

Change the inline SVG data URI favicon:
```html
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,...">
```
To the standard:
```html
<link rel="icon" href="favicon.svg" type="image/svg+xml">
```

- [ ] **Step 4: Fix spelling-test.html header positioning**

In the CSS for `.header`, change `position:sticky` to `position:fixed`. Add `padding-top:56px` (or the appropriate header height) to the body or main content wrapper to compensate.

- [ ] **Step 5: Commit**

```bash
git add landing.html dashboard.html spelling-test.html
git commit -m "fix: add skip links to landing/dashboard, fix spelling-test favicon and header"
```

---

## Task 4: Unified Footer

**Files:**
- Modify: All non-game HTML pages (approximately 21 files)

The standard footer HTML for dark-background pages:
```html
<footer class="footer" role="contentinfo">
  <div class="footer-inner">
    <span class="footer-brand">🧪 Word Labs</span>
    <span class="footer-note"><a href="landing.html">Home</a> · <a href="about.html">About</a> · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="pricing.html">Pricing</a> · <a href="mailto:nick@wordlabs.app">Contact</a></span>
  </div>
</footer>
```

The standard footer CSS for dark-background pages (from about.html):
```css
.footer{
  border-top:1px solid rgba(255,255,255,.06);
  background:#080716; margin-top:24px; position:relative; z-index:2;
}
.footer-inner{
  max-width:1200px; margin:0 auto;
  padding:20px 24px; display:flex; align-items:center;
  justify-content:space-between; gap:16px; flex-wrap:wrap;
}
.footer-brand{ font-size:14px; font-weight:800; color:#4338ca; }
.footer-note{ font-size:12px; color:#94a3b8; font-weight:600; }
.footer-note a{ color:#94a3b8; text-decoration:none; }
.footer-note a:hover{ color:#e0e7ff; }
```

For pages with light backgrounds that will become dark-header pages, the footer background colour will work because the footer sits at the bottom and is self-contained.

For legal/doc pages (`privacy.html`, `terms.html`, etc.) that have a light body background, use this adapted footer:
```html
<div class="footer">
  🧪 Word Labs · <a href="landing.html" style="color:#64748b;">Home</a> · <a href="about.html" style="color:#64748b;">About</a> · <a href="privacy.html" style="color:#64748b;">Privacy</a> · <a href="terms.html" style="color:#64748b;">Terms</a> · <a href="pricing.html" style="color:#64748b;">Pricing</a> · <a href="mailto:nick@wordlabs.app" style="color:#64748b;">Contact</a>
</div>
```
With the existing `.footer` CSS from those pages (light background, text-align center, border-top, muted colours).

- [ ] **Step 1: Add footer to dashboard.html**

Add the dark footer HTML before the closing `</body>` tag. Add the footer CSS to the style block.

- [ ] **Step 2: Add footer to item-creator.html**

Add the dark footer HTML before the closing `</body>` tag. Add the footer CSS to the style block.

- [ ] **Step 3: Add footer to scientist.html**

Add the dark footer HTML before the closing `</body>` tag. Add the footer CSS to the style block if not present.

- [ ] **Step 4: Update landing.html footers**

Landing has 3 footers (logged-out, student, teacher). Update all 3 to use the standard link set:
```
Home · About · Privacy · Terms · Pricing · Contact
```

- [ ] **Step 5: Update about.html footer**

Replace current footer links with the standard set. Current footer is missing Home and Pricing links.

- [ ] **Step 6: Update privacy.html footer**

Replace current footer links with the standard set:
```
Home · About · Privacy · Terms · Pricing · Contact
```

- [ ] **Step 7: Update terms.html footer**

Replace current footer links with the standard set.

- [ ] **Step 8: Update data-agreement.html footer**

Replace current footer links with the standard set.

- [ ] **Step 9: Update parent-privacy.html footer**

Replace current footer links with the standard set.

- [ ] **Step 10: Update security-architecture.html footer**

Replace current footer links with the standard set.

- [ ] **Step 11: Update incident-response.html footer**

Replace current footer links with the standard set.

- [ ] **Step 12: Update pricing.html footer**

Replace current footer links with the standard set.

- [ ] **Step 13: Update teacher-login.html footer**

Replace current footer (which has a copyright notice "© 2024") with the standard link set. Remove the copyright year.

- [ ] **Step 14: Update teacher-signup.html footer**

Add or update footer with the standard link set.

- [ ] **Step 15: Update onboarding.html footer**

Add or update footer with the standard link set.

- [ ] **Step 16: Update feedback.html footer**

Add or update footer with the standard link set.

- [ ] **Step 17: Update faq.html footer**

Check and update to standard link set.

- [ ] **Step 18: Update teacher-guide.html footer**

Check and update to standard link set.

- [ ] **Step 19: Update teacher-resources.html footer**

Check and update to standard link set.

- [ ] **Step 20: Update account.html footer**

Check and update to standard link set.

- [ ] **Step 21: Update class-setup.html footer**

Check and update to standard link set.

- [ ] **Step 22: Verify all non-game pages have standard footer**

Run:
```bash
grep -rn "Pricing" --include="*.html" /workspaces/morphology-builder/ | grep "footer\|Footer" | grep -v node_modules | grep -v docs/
```
Expected: Every non-game page's footer should now contain a "Pricing" link (one of the standard links).

- [ ] **Step 23: Commit**

```bash
git add *.html
git commit -m "fix: unify footer links across all non-game pages

Standard footer: Home · About · Privacy · Terms · Pricing · Contact"
```

---

## Task 5: Unified Dark Header — Legal/Document Pages

**Files:**
- Modify: `privacy.html`
- Modify: `terms.html`
- Modify: `data-agreement.html`
- Modify: `parent-privacy.html`
- Modify: `security-architecture.html`
- Modify: `incident-response.html`

These pages currently have light static headers. Replace with the dark sticky header from about.html.

The reference header CSS (add to each page's `<style>` block, replacing existing header styles):
```css
.header{
  position:sticky; top:0; z-index:50;
  background:rgba(13,11,26,.85);
  backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid rgba(255,255,255,.06);
}
.header-inner{
  max-width:1200px; margin:0 auto;
  padding:14px 24px;
  display:flex; align-items:center; justify-content:space-between; gap:16px;
}
.brand{ display:flex; align-items:center; gap:10px; text-decoration:none; }
.brand-icon{
  width:36px; height:36px; border-radius:10px;
  background:#4338ca; color:#fff;
  display:flex; align-items:center; justify-content:center;
  font-size:17px;
}
.brand-name{ font-size:18px; font-weight:900; color:#e0e7ff; letter-spacing:-.02em; }
.header-links{ display:flex; align-items:center; gap:16px; }
.header-links a{
  font-size:13px; font-weight:700; color:#94a3b8; text-decoration:none;
  transition:color .15s;
}
.header-links a:hover{ color:#e0e7ff; }
```

The reference header HTML:
```html
<header class="header" role="banner">
  <div class="header-inner">
    <a href="landing.html" class="brand">
      <div class="brand-icon">🧪</div>
      <span class="brand-name">Word Labs</span>
    </a>
    <nav class="header-links" role="navigation" aria-label="Main navigation">
      <a href="landing.html">Home</a>
    </nav>
  </div>
</header>
```

- [ ] **Step 1: Update privacy.html header**

Replace the existing header HTML and CSS with the reference dark header. Remove old `.screenHeader`, `.brand`, `.header-links` CSS rules and replace with the reference CSS above. Replace the header HTML with the reference HTML above.

- [ ] **Step 2: Update terms.html header**

Same changes as privacy.html — replace light header CSS and HTML with the dark reference.

- [ ] **Step 3: Update data-agreement.html header**

Replace the existing `<div class="screenHeader">` wrapper and its CSS with the dark reference header. Keep the print bar below the header.

- [ ] **Step 4: Update parent-privacy.html header**

Replace existing header CSS and HTML with the dark reference.

- [ ] **Step 5: Update security-architecture.html header**

Replace existing header CSS and HTML with the dark reference. Keep the print bar.

- [ ] **Step 6: Update incident-response.html header**

Replace existing header CSS and HTML with the dark reference. Keep the print bar.

- [ ] **Step 7: Commit**

```bash
git add privacy.html terms.html data-agreement.html parent-privacy.html security-architecture.html incident-response.html
git commit -m "fix: unified dark header on legal/document pages"
```

---

## Task 6: Unified Dark Header — Teacher Tool Pages

**Files:**
- Modify: `class-setup.html`
- Modify: `account.html`
- Modify: `onboarding.html`
- Modify: `item-creator.html`
- Modify: `scientist.html`

These pages have light sticky headers with nav links. Restyle to dark, keeping existing nav links.

The header CSS is the same as Task 5, but with additional styles for nav buttons:
```css
.header-links a, .header-links button{
  font-size:13px; font-weight:700; color:#94a3b8; text-decoration:none;
  transition:color .15s; background:none; border:none; cursor:pointer;
  font-family:inherit;
}
.header-links a:hover, .header-links button:hover{ color:#e0e7ff; }
```

- [ ] **Step 1: Update class-setup.html header**

Replace existing light header CSS with dark reference CSS. Update header HTML to use the reference structure. Keep the nav links (Dashboard, Account, Home, Sign Out) but style them as `.header-links a` elements in the dark theme.

- [ ] **Step 2: Update account.html header**

Replace existing light header CSS with dark reference CSS. Update header HTML structure. Keep nav links (Dashboard, Setup, Home, Sign Out). Change the brand icon from 👤 back to 🧪 for consistency — use subtitle text to indicate "Account Settings".

- [ ] **Step 3: Update onboarding.html header**

Replace existing `.topBar` CSS with dark reference header CSS. Update HTML structure. Keep minimal nav (just Home link).

- [ ] **Step 4: Update item-creator.html header**

Replace existing light header CSS with dark reference CSS. Update HTML structure. Keep nav links (My Scientist, Home).

- [ ] **Step 5: Update scientist.html header**

Replace existing light header CSS with dark reference CSS. Update HTML structure. Keep nav link (Home).

- [ ] **Step 6: Commit**

```bash
git add class-setup.html account.html onboarding.html item-creator.html scientist.html
git commit -m "fix: unified dark header on teacher tool pages"
```

---

## Task 7: Unified Dark Header — Auth and Marketing Pages

**Files:**
- Modify: `teacher-login.html`
- Modify: `teacher-signup.html`
- Modify: `landing.html`
- Modify: `feedback.html`
- Modify: `pricing.html`

These pages already have dark headers but with different styles. Standardise to match the reference.

- [ ] **Step 1: Update teacher-login.html header**

Replace existing dark header CSS/HTML with the reference. Keep "Home" nav link.

- [ ] **Step 2: Update teacher-signup.html header**

Add the reference dark header. Currently has no header (standalone card layout). Add the header above the card.

- [ ] **Step 3: Update landing.html header**

Replace existing light header with dark reference header. Keep the "Teacher Login" button in the nav alongside "Home". Style the login button to work on the dark background.

- [ ] **Step 4: Update feedback.html header**

Replace existing dark header CSS/HTML with the reference. Keep "Home" nav link.

- [ ] **Step 5: Update pricing.html header**

Replace existing light header CSS/HTML with the dark reference. Keep "Home" nav link.

- [ ] **Step 6: Commit**

```bash
git add teacher-login.html teacher-signup.html landing.html feedback.html pricing.html
git commit -m "fix: unified dark header on auth and marketing pages"
```

---

## Task 8: Unified Dark Header — Dashboard

**Files:**
- Modify: `dashboard.html`

The dashboard has a unique dark navy header with class name, email, and labelled icon buttons. This is the most complex header because it has functional nav (Setup, Account, Home, Export, Sign Out) and displays the class name and teacher email.

- [ ] **Step 1: Update dashboard.html header CSS**

Replace existing header CSS with the dark reference base, but keep the functional elements. The header background should use `rgba(13,11,26,.85)` with the blur effect to match other pages, while retaining the nav buttons.

- [ ] **Step 2: Update dashboard.html header HTML structure**

Restructure to use `.header` > `.header-inner` > `.brand` + `.header-links` pattern. Keep all functional elements (class name display, email, nav buttons) but style them in the dark theme to match the reference.

- [ ] **Step 3: Verify dashboard still functions correctly**

Open dashboard in browser. Confirm:
- Header displays correctly with dark theme
- Class name and teacher email still visible
- All nav buttons (Setup, Account, Home, Export, Sign Out) still work
- Tab navigation below header still functions

- [ ] **Step 4: Commit**

```bash
git add dashboard.html
git commit -m "fix: unified dark header on dashboard"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Verify all naming is consistent**

```bash
grep -rni "Meaning Mode\|Flashcard Mode\|Low-stimulation mode\|Spelling Diagnostic" --include="*.html" /workspaces/morphology-builder/ | grep -v node_modules | grep -v docs/
```
Expected: No output.

- [ ] **Step 2: Verify all titles follow the pattern**

```bash
grep -n "<title>" --include="*.html" -r /workspaces/morphology-builder/ | grep -v node_modules | grep -v docs/
```
Review output: every non-game page should start with "Word Labs – ".

- [ ] **Step 3: Verify all non-game pages have skip links**

```bash
grep -rL "skip-link\|skip_link" --include="*.html" /workspaces/morphology-builder/ | grep -v node_modules | grep -v docs/
```
Review output: only game pages should appear (they have their own skip links already).

- [ ] **Step 4: Verify all non-game pages have the standard footer links**

```bash
grep -rn "Pricing" --include="*.html" /workspaces/morphology-builder/ | grep -i "footer" | grep -v node_modules | grep -v docs/
```
Expected: Every non-game page footer contains a Pricing link.

- [ ] **Step 5: Push all changes**

```bash
git push
```

- [ ] **Step 6: Commit plan as complete**

Update the plan checkboxes and commit.
