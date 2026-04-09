# Principal Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a dedicated landing page (`for-schools.html`) for Australian primary school principals, literacy coordinators, and assistant principals doing due diligence on Word Labs, with a one-click School Information Pack download and cross-links from existing marketing pages.

**Architecture:** Single static HTML page at the repo root, matching the existing marketing page pattern (vanilla HTML + inline `<style>` block + shared `wordlab-common.css` for header/footer/variables). Full dark navy theme matching `landing.html`'s dark sections. Real product screenshots from `assets/screens/`. Prebuilt ZIP of the 7 existing compliance PDFs committed at `edbuy-docs/school-information-pack.zip`. Header and footer cross-links added across 11 marketing pages. No new JS, no backend changes, no new auth.

**Tech Stack:** Static HTML5, vanilla CSS, `wordlab-common.css` shared variables, Lexend from Google Fonts, Playwright for smoke testing.

**Reference artifacts from brainstorming session:**
- Spec: `docs/superpowers/specs/2026-04-09-principal-landing-page-design.md`
- Approved mockup: `.superpowers/brainstorm/221511-1775710629/content/for-schools-mockup.html` (not committed — the implementer should open this locally as a visual reference for the final layout, spacing, and content. Don't copy it verbatim — adapt it to use `wordlab-common.css` classes where possible instead of inline CSS duplication.)

---

## File Structure

**Create:**
- `for-schools.html` — the new landing page (~400 lines including inline CSS)
- `edbuy-docs/school-information-pack.zip` — bundled PDFs

**Modify:**
- `landing.html` — add "For schools" nav link in the logged-out header (single line change)
- 11 existing marketing pages — add "For schools" to their footer link set:
  - Pattern A footer (uses `<span class="footer-note">...</span>`): `about.html`, `faq.html`, `landing.html`, `teacher-guide.html`, `feedback.html`, `account.html`, `onboarding.html`, `teacher-login.html`, `teacher-signup.html`, `dashboard.html`
  - Pattern B footer (uses `<div class="footer">🧪 Word Labs · ...</div>`): `pricing.html`, `privacy.html`, `terms.html`, `data-agreement.html`, `parent-privacy.html`, `security-architecture.html`, `incident-response.html`

**Responsibilities:**
- `for-schools.html` — entire page, owns hero, dual panel, trust pillars, pack download block, pricing cards, footer. Content and presentation live together because the page is a single cohesive document.
- `school-information-pack.zip` — static asset, refreshed only when a constituent PDF changes.
- Footer updates — pure link additions, no structural changes.

---

## Task 1: Create the School Information Pack ZIP

**Files:**
- Create: `edbuy-docs/school-information-pack.zip`

- [ ] **Step 1.1: Verify all 7 source PDFs exist**

Run:
```bash
ls -lh edbuy-docs/*.pdf
```

Expected output: 7 files, one per compliance document (Data Handling Agreement, Security Architecture, Incident Response Plan, Privacy Policy, Terms of Service, Parent Privacy Summary, Teacher Guide). Total size around 2.2 MB.

If any PDF is missing, STOP and regenerate it first using the `chrome --headless --print-to-pdf` approach documented in commit `3a887ea`.

- [ ] **Step 1.2: Create the ZIP**

Run:
```bash
cd edbuy-docs && zip -j school-information-pack.zip "Word Labs - "*.pdf && cd ..
```

The `-j` flag strips directory prefixes so the ZIP contains the PDFs at the root, not nested under `edbuy-docs/`.

Expected output: `adding: Word Labs - Data Handling Agreement.pdf (deflated X%)` for each of the 7 PDFs.

- [ ] **Step 1.3: Verify the ZIP contents**

Run:
```bash
unzip -l edbuy-docs/school-information-pack.zip
```

Expected: exactly 7 entries, each named `Word Labs - <doc>.pdf`, no `edbuy-docs/` prefix, total around 2.2 MB.

- [ ] **Step 1.4: Commit**

```bash
git add edbuy-docs/school-information-pack.zip
git commit -m "docs(edbuy): bundle the 7 compliance PDFs as a single download pack

Adds edbuy-docs/school-information-pack.zip — a prebuilt ZIP of all
seven compliance PDFs that the upcoming principal landing page will
serve as its primary CTA download. Source PDFs are committed
separately in the same folder; this is just the bundle.

Regenerate with:
  cd edbuy-docs && zip -j school-information-pack.zip 'Word Labs - '*.pdf

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Scaffold `for-schools.html`

Create the page shell with head, header, empty main, and footer. This establishes the theme and layout without content, so we can verify it renders correctly before adding sections.

**Files:**
- Create: `for-schools.html`

- [ ] **Step 2.1: Write the initial file**

Create `for-schools.html` with:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <title>Word Labs – For Schools</title>
  <meta name="description" content="Word Labs is a browser-based structured literacy platform for Years 2–6, built by a practising NSW primary teacher. NSW syllabus aligned. Sydney data centre. Privacy Act compliant.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="wordlab-common.css">
  <style>
    :root{
      --navy:#0d0b1a;
      --navy-2:#141029;
      --navy-3:#1a1a2e;
      --indigo:#4338ca;
      --indigo-2:#6366f1;
      --indigo-soft:rgba(99,102,241,.12);
      --text-primary:#e0e7ff;
      --text-secondary:#94a3b8;
      --text-muted:#64748b;
      --line:rgba(255,255,255,.08);
      --good:#16a34a;
    }
    *{box-sizing:border-box;}
    html,body{background:var(--navy);color:var(--text-primary);font-family:'Lexend',sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;margin:0;padding:0;}
    a{color:inherit;text-decoration:none;}

    /* Header — uses the fixed variant from wordlab-common.css but with page-specific tweaks */
    .fs-header{position:sticky;top:0;z-index:50;background:rgba(13,11,26,.85);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--line);}
    .fs-headerInner{max-width:1200px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
    .fs-brand{display:flex;align-items:center;gap:10px;font-weight:900;font-size:16px;color:var(--text-primary);}
    .fs-brandIcon{width:36px;height:36px;background:linear-gradient(135deg,#4338ca,#6366f1);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:20px;}
    .fs-headerNav{display:flex;gap:20px;align-items:center;font-size:14px;font-weight:700;}
    .fs-headerNav a{color:var(--text-secondary);transition:color .15s;}
    .fs-headerNav a:hover{color:var(--text-primary);}
    .fs-headerNav a.current{color:var(--text-primary);border-bottom:2px solid var(--indigo-2);padding-bottom:2px;}

    /* Footer */
    .fs-footer{background:var(--navy-3);padding:40px 24px 30px;border-top:1px solid var(--line);text-align:center;}
    .fs-footer-note{font-size:12px;color:var(--text-muted);}
    .fs-footer-note a{color:var(--text-secondary);margin:0 6px;}
    .fs-footer-note a:hover{color:var(--text-primary);}

    @media(max-width:700px){
      .fs-headerInner{padding:12px 16px;gap:10px;}
      .fs-headerNav{gap:12px;font-size:12px;}
      .fs-headerNav a:not(.current):not(.fs-login){display:none;}
    }
  </style>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- HEADER -->
<header class="fs-header" role="banner">
  <div class="fs-headerInner">
    <a class="fs-brand" href="landing.html">
      <span class="fs-brandIcon">🧪</span>
      <span>Word Labs</span>
    </a>
    <nav class="fs-headerNav" role="navigation" aria-label="Main">
      <a href="landing.html">Home</a>
      <a href="about.html">About</a>
      <a href="for-schools.html" class="current" aria-current="page">For schools</a>
      <a href="pricing.html">Pricing</a>
      <a href="teacher-login.html" class="fs-login">Teacher Login</a>
    </nav>
  </div>
</header>

<main id="main-content" role="main">
  <!-- sections added in later tasks -->
</main>

<!-- FOOTER -->
<footer class="fs-footer" role="contentinfo">
  <p class="fs-footer-note">🧪 Word Labs Education · ABN 62 528 046 944 · <a href="landing.html">Home</a> · <a href="about.html">About</a> · <a href="for-schools.html">For schools</a> · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="pricing.html">Pricing</a> · <a href="mailto:nick@wordlabs.app">Contact</a></p>
</footer>

</body>
</html>
```

- [ ] **Step 2.2: Smoke test — page loads and renders**

Start the dev server if not already running:
```bash
python3 -m http.server 8080 --bind 127.0.0.1 &
```

Use Playwright to navigate to the page and check the console:
```
browser_navigate → http://127.0.0.1:8080/for-schools.html
browser_console_messages
```

Expected:
- Page title: `Word Labs – For Schools`
- Console: zero errors, zero warnings
- Header visible with nav links
- Footer visible at the bottom
- Main area empty (no content yet)

If there are console errors, fix them before proceeding.

- [ ] **Step 2.3: Commit**

```bash
git add for-schools.html
git commit -m "feat(for-schools): scaffold principal landing page shell

Creates for-schools.html with dark navy theme, Lexend typography,
sticky header with nav (Home, About, For schools [current],
Pricing, Teacher Login), main content area, and footer. Links
wordlab-common.css for skip-link and focus-visible styles. All
page-specific CSS uses the fs- prefix to avoid clashing with
existing class names.

Subsequent tasks fill in the hero, dual panel, trust pillars,
pack download block, and pricing cards.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Add hero section

**Files:**
- Modify: `for-schools.html`

- [ ] **Step 3.1: Add hero CSS to the `<style>` block**

Append the following rules immediately before the `@media(max-width:700px)` block:

```css
/* Hero */
.fs-hero{position:relative;padding:80px 24px 100px;border-bottom:1px solid var(--line);overflow:hidden;}
.fs-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(1200px 600px at 20% 0%,rgba(99,102,241,.18),transparent 60%),radial-gradient(900px 500px at 90% 40%,rgba(67,56,202,.12),transparent 60%);pointer-events:none;}
.fs-heroInner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1.05fr 0.95fr;gap:60px;align-items:center;position:relative;z-index:1;}
.fs-heroKicker{display:inline-block;background:var(--indigo-soft);color:var(--indigo-2);padding:6px 14px;border-radius:999px;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;border:1px solid rgba(99,102,241,.25);margin-bottom:20px;}
.fs-heroTitle{font-size:54px;font-weight:900;line-height:1.05;letter-spacing:-.015em;margin:0 0 24px;}
.fs-heroTitle span{background:linear-gradient(135deg,#6366f1,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent;}
.fs-heroLede{font-size:17px;color:var(--text-secondary);max-width:560px;margin:0 0 36px;line-height:1.7;}
.fs-heroCtas{display:flex;gap:12px;flex-wrap:wrap;}
.fs-btn{display:inline-flex;align-items:center;gap:8px;padding:15px 26px;border-radius:12px;font-family:'Lexend',sans-serif;font-weight:800;font-size:14px;letter-spacing:.01em;border:1px solid transparent;cursor:pointer;transition:transform .15s,box-shadow .15s;text-decoration:none;}
.fs-btn-primary{background:var(--indigo);color:#fff;box-shadow:0 8px 24px rgba(67,56,202,.35);}
.fs-btn-primary:hover{transform:translateY(-1px);box-shadow:0 12px 32px rgba(67,56,202,.45);color:#fff;}
.fs-btn-ghost{background:transparent;border-color:rgba(255,255,255,.2);color:var(--text-primary);}
.fs-btn-ghost:hover{border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.04);color:var(--text-primary);}
.fs-heroImgWrap{position:relative;}
.fs-heroImgWrap::before{content:'';position:absolute;inset:-20px;background:radial-gradient(500px 300px at 50% 50%,rgba(99,102,241,.25),transparent 70%);z-index:-1;}
.fs-heroImg{width:100%;border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.08);display:block;}
```

- [ ] **Step 3.2: Add hero mobile breakpoint inside the existing media query**

Extend the existing `@media(max-width:700px)` block to include:

```css
      .fs-hero{padding:48px 20px 60px;}
      .fs-heroInner{grid-template-columns:1fr;gap:40px;}
      .fs-heroTitle{font-size:36px;}
      .fs-heroLede{font-size:15px;}
      .fs-btn{padding:13px 20px;font-size:13px;}
```

- [ ] **Step 3.3: Add the hero markup inside `<main>`**

Replace the `<!-- sections added in later tasks -->` comment with:

```html
  <!-- HERO -->
  <section class="fs-hero" aria-labelledby="hero-title">
    <div class="fs-heroInner">
      <div>
        <span class="fs-heroKicker">★ For Australian primary schools</span>
        <h1 class="fs-heroTitle" id="hero-title">Structured literacy, <span>built by a teacher</span>.</h1>
        <p class="fs-heroLede">Word Labs is a browser-based structured literacy platform for Years 2–6, built by a practising NSW primary teacher. It gives your students 13 evidence-based activities across phonics, morphology and spelling, and your teachers a real-time dashboard plus 324 ready-to-project teaching slide decks — all aligned to the NSW English K–10 Syllabus.</p>
        <div class="fs-heroCtas">
          <a class="fs-btn fs-btn-primary" href="edbuy-docs/school-information-pack.zip" download>📦 Download the School Information Pack</a>
          <a class="fs-btn fs-btn-ghost" href="teacher-login.html?signup=1">Start a 3-month free trial</a>
        </div>
      </div>
      <div class="fs-heroImgWrap">
        <img class="fs-heroImg" src="assets/screens/dashboard-overview.png" alt="The Word Labs teacher dashboard showing a class heatmap with accuracy cells across every activity." loading="eager" width="1400" height="760">
      </div>
    </div>
  </section>
  <!-- sections added in later tasks -->
```

- [ ] **Step 3.4: Smoke test the hero**

In the running browser, reload `http://127.0.0.1:8080/for-schools.html` and verify:

```
browser_navigate → http://127.0.0.1:8080/for-schools.html
browser_console_messages
browser_take_screenshot (fullPage:true, filename: "for-schools-hero.png")
```

Expected:
- Zero console errors.
- Hero title *"Structured literacy, built by a teacher."* renders with the gradient on "built by a teacher".
- Both buttons visible — primary is filled indigo, secondary is ghost outline.
- Dashboard screenshot loads on the right-hand side.
- No horizontal scroll.

If the image does not load, check the file path with `curl -sI http://127.0.0.1:8080/assets/screens/dashboard-overview.png`.

- [ ] **Step 3.5: Commit**

```bash
git add for-schools.html
git commit -m "feat(for-schools): add hero section with dual CTAs

Hero headline 'Structured literacy, built by a teacher' with the
existing dashboard screenshot on the right. Two CTAs: primary
indigo button links to the School Information Pack ZIP with the
download attribute, secondary ghost button links to teacher
signup. Kicker pill 'For Australian primary schools' above the
headline.

Mobile breakpoint collapses to single column at <= 700px with
smaller font sizes and tighter padding.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Add the Students + Teachers dual panel

**Files:**
- Modify: `for-schools.html`

- [ ] **Step 4.1: Add dual panel CSS**

Append before the mobile media query:

```css
/* Section — shared */
.fs-section{padding:80px 24px;border-bottom:1px solid var(--line);}
.fs-sectionInner{max-width:1200px;margin:0 auto;}
.fs-sectionLabel{display:inline-block;font-size:11px;font-weight:900;letter-spacing:.18em;color:var(--indigo-2);text-transform:uppercase;margin-bottom:14px;}
.fs-sectionTitle{font-size:38px;font-weight:900;letter-spacing:-.01em;margin:0 0 18px;line-height:1.15;}
.fs-sectionIntro{font-size:16px;color:var(--text-secondary);max-width:680px;margin:0 0 48px;line-height:1.7;}

/* Dual panel */
.fs-dualPanel{display:grid;grid-template-columns:1fr 1fr;gap:32px;}
.fs-panel{background:var(--navy-2);border:1px solid var(--line);border-radius:20px;padding:36px;position:relative;overflow:hidden;}
.fs-panel h3{font-size:22px;font-weight:900;margin:0 0 14px;}
.fs-panel p{color:var(--text-secondary);margin:0 0 24px;font-size:14px;line-height:1.7;}
.fs-panelImg{width:100%;border-radius:12px;border:1px solid var(--line);display:block;}
.fs-panelLink{display:inline-flex;align-items:center;gap:6px;margin-top:16px;font-size:13px;font-weight:800;color:var(--indigo-2);text-decoration:none;}
.fs-panelLink:hover{color:var(--text-primary);}
```

Extend the mobile breakpoint:

```css
      .fs-section{padding:56px 20px;}
      .fs-sectionTitle{font-size:28px;}
      .fs-sectionIntro{font-size:14px;margin-bottom:32px;}
      .fs-dualPanel{grid-template-columns:1fr;gap:20px;}
      .fs-panel{padding:26px;}
```

- [ ] **Step 4.2: Add the dual panel markup**

Replace `<!-- sections added in later tasks -->` with:

```html
  <!-- STUDENTS + TEACHERS -->
  <section class="fs-section" aria-labelledby="dual-title">
    <div class="fs-sectionInner">
      <span class="fs-sectionLabel">What's inside</span>
      <h2 class="fs-sectionTitle" id="dual-title">One platform, two audiences.</h2>
      <p class="fs-sectionIntro">Students practise. Teachers teach, monitor, and intervene. Same data flows between them in real time — no exports, no extra admin.</p>
      <div class="fs-dualPanel">

        <article class="fs-panel">
          <h3>What your students do</h3>
          <p>Students practise phonological, orthographic, and morphological knowledge through 13 gamified activities — Morpheme Builder, Breakdown Blitz, Phoneme Splitter, Syllable Splitter, Sound Sorter, Meaning Match-Up, Mission Mode, Root Lab, Word Spectrum, The Refinery, Homophone Hunter, Flashcards, and Speed Builder. Each activity targets a specific skill that transfers directly to spelling accuracy and reading comprehension.</p>
          <img class="fs-panelImg" src="assets/screens/root-lab.png" alt="A Root Lab game mid-round, showing a word broken into its morphemes with the scientist character visible on the right." loading="lazy">
          <a class="fs-panelLink" href="about.html#activities">See the full activity list →</a>
        </article>

        <article class="fs-panel">
          <h3>What your teachers get</h3>
          <p>A real-time dashboard with accuracy heatmaps, intervention flags, and individual student profiles. 324 ready-to-project teaching slide decks, 9 printable worksheet generators, per-student differentiation (Extension, Support, Low-stim, and EALD modes across 48 languages), and a Spelling Check-In dictation tool — all designed to fit into a single structured spelling block.</p>
          <img class="fs-panelImg" src="assets/screens/slide-decks.png" alt="The Teacher Resources page showing a grid of downloadable PPTX teaching slide decks organised by morpheme type." loading="lazy">
          <a class="fs-panelLink" href="teacher-resources.html">See the teacher resources →</a>
        </article>

      </div>
    </div>
  </section>
  <!-- sections added in later tasks -->
```

- [ ] **Step 4.3: Smoke test the dual panel**

```
browser_navigate → http://127.0.0.1:8080/for-schools.html
browser_console_messages
```

Expected: zero errors, both panels visible, both screenshots load, panel links visible.

- [ ] **Step 4.4: Commit**

```bash
git add for-schools.html
git commit -m "feat(for-schools): add students + teachers dual panel

Two side-by-side cards below the hero. Left card describes the
13 student activities with a Root Lab screenshot and links to
about.html#activities. Right card describes the teacher
dashboard, 324 slide decks, differentiation modes, and spelling
check-in with the slide-decks screenshot and links to
teacher-resources.html.

Collapses to a single column at <= 700px.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Add the Trust & Compliance section with pack download

**Files:**
- Modify: `for-schools.html`

- [ ] **Step 5.1: Add trust section CSS**

Append before the mobile media query:

```css
/* Trust */
.fs-trust{background:var(--navy-2);}
.fs-pillars{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:56px;}
.fs-pillar{background:var(--navy-3);border:1px solid var(--line);border-radius:16px;padding:28px;transition:border-color .2s,transform .2s;}
.fs-pillar:hover{border-color:rgba(99,102,241,.4);transform:translateY(-2px);}
.fs-pillarIcon{font-size:32px;margin-bottom:12px;display:block;}
.fs-pillar h3{font-size:17px;font-weight:900;margin:0 0 10px;}
.fs-pillar p{font-size:13px;color:var(--text-secondary);line-height:1.65;margin:0;}

/* Pack download block */
.fs-pack{background:linear-gradient(135deg,rgba(67,56,202,.15),rgba(99,102,241,.08));border:1px solid rgba(99,102,241,.3);border-radius:20px;padding:44px;display:grid;grid-template-columns:1.2fr 1fr;gap:48px;align-items:center;}
.fs-pack h3{font-size:26px;font-weight:900;margin:0 0 12px;}
.fs-pack > div > p{color:var(--text-secondary);font-size:14px;margin:0 0 20px;line-height:1.7;}
.fs-packList{list-style:none;margin:0;padding:0;}
.fs-packList li{font-size:13px;color:var(--text-primary);padding:6px 0 6px 28px;position:relative;}
.fs-packList li::before{content:'📄';position:absolute;left:0;top:4px;}
.fs-packIndividual{font-size:11px;color:var(--text-muted);margin:20px 0 0;}
.fs-packIndividual a{color:var(--indigo-2);text-decoration:underline;margin-right:10px;white-space:nowrap;}
.fs-packIndividual a:hover{color:var(--text-primary);}
```

Extend the mobile breakpoint:

```css
      .fs-pillars{grid-template-columns:1fr;gap:16px;margin-bottom:36px;}
      .fs-pack{grid-template-columns:1fr;gap:28px;padding:28px;}
```

- [ ] **Step 5.2: Add the trust + pack markup**

Replace `<!-- sections added in later tasks -->` with:

```html
  <!-- TRUST + COMPLIANCE -->
  <section class="fs-section fs-trust" aria-labelledby="trust-title">
    <div class="fs-sectionInner">
      <span class="fs-sectionLabel">Trust &amp; Compliance</span>
      <h2 class="fs-sectionTitle" id="trust-title">Built for Australian schools.</h2>
      <p class="fs-sectionIntro">Word Labs is designed by a practising NSW primary teacher to meet the compliance, data sovereignty, and syllabus alignment requirements of Australian primary schools.</p>

      <div class="fs-pillars">
        <article class="fs-pillar">
          <span class="fs-pillarIcon" aria-hidden="true">🔒</span>
          <h3>Data sovereignty</h3>
          <p>All student data is stored in Australia, in Supabase's Sydney data centre (ap-southeast-2). No student data ever leaves the country. Privacy Act 1988 compliant, aligned to the Australian Privacy Principles and the NSW PPIP Act.</p>
        </article>
        <article class="fs-pillar">
          <span class="fs-pillarIcon" aria-hidden="true">📘</span>
          <h3>NSW syllabus aligned</h3>
          <p>Directly mapped to the NSW English K–10 Syllabus Stage 2 and Stage 3 spelling outcomes, the Australian Curriculum v9.0, and the NSW Literacy Continuum. Built around explicit instruction and structured literacy research.</p>
        </article>
        <article class="fs-pillar">
          <span class="fs-pillarIcon" aria-hidden="true">🧑‍🏫</span>
          <h3>Built by a teacher</h3>
          <p>Word Labs is designed, built, and maintained by Nicholas Deeney, a practising NSW public primary school teacher. Not a retrofit of a commercial product — every activity reflects what works in a real classroom.</p>
        </article>
      </div>

      <div class="fs-pack" id="pack">
        <div>
          <h3>📦 Download the School Information Pack</h3>
          <p>Everything your IT and leadership teams need to review Word Labs — seven compliance documents bundled into one ZIP.</p>
          <a class="fs-btn fs-btn-primary" href="edbuy-docs/school-information-pack.zip" download>📦 Download the pack (ZIP, ~2.2 MB)</a>
          <p class="fs-packIndividual">Or download individually: <a href="edbuy-docs/Word%20Labs%20-%20Data%20Handling%20Agreement.pdf">Data Handling Agreement</a> <a href="edbuy-docs/Word%20Labs%20-%20Security%20Architecture.pdf">Security Architecture</a> <a href="edbuy-docs/Word%20Labs%20-%20Incident%20Response%20Plan.pdf">Incident Response Plan</a> <a href="edbuy-docs/Word%20Labs%20-%20Privacy%20Policy.pdf">Privacy Policy</a> <a href="edbuy-docs/Word%20Labs%20-%20Terms%20of%20Service.pdf">Terms of Service</a> <a href="edbuy-docs/Word%20Labs%20-%20Parent%20Privacy%20Summary.pdf">Parent Privacy Summary</a> <a href="edbuy-docs/Word%20Labs%20-%20Teacher%20Guide.pdf">Teacher Guide</a></p>
        </div>
        <ul class="fs-packList">
          <li>Data Handling Agreement (PDF)</li>
          <li>Security Architecture (PDF)</li>
          <li>Incident Response Plan (PDF)</li>
          <li>Privacy Policy (PDF)</li>
          <li>Terms of Service (PDF)</li>
          <li>Parent Privacy Summary (PDF)</li>
          <li>Teacher Guide (PDF)</li>
        </ul>
      </div>
    </div>
  </section>
  <!-- sections added in later tasks -->
```

- [ ] **Step 5.3: Smoke test — trust section + pack download link**

```
browser_navigate → http://127.0.0.1:8080/for-schools.html
browser_console_messages
```

Expected: zero errors, three pillars visible side by side, pack block visible below with the gradient background.

Also verify the ZIP link resolves:
```bash
curl -sI http://127.0.0.1:8080/edbuy-docs/school-information-pack.zip | head -3
```

Expected: HTTP 200, Content-Type application/zip (or octet-stream).

If the ZIP returns 404, Task 1 was not completed.

- [ ] **Step 5.4: Commit**

```bash
git add for-schools.html
git commit -m "feat(for-schools): add trust pillars and School Information Pack block

Three trust pillars (data sovereignty, NSW syllabus aligned, built
by a teacher) in a 3-col grid, collapsing to a single column on
mobile. Below them, a full-width pack download block with a
gradient indigo background, a prominent 'Download the pack' button
linking to edbuy-docs/school-information-pack.zip, and individual
links to each of the 7 PDFs for principals who want just one doc.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Add the Pricing + Trial CTA section

**Files:**
- Modify: `for-schools.html`

- [ ] **Step 6.1: Add pricing CSS**

Append before the mobile media query:

```css
/* Pricing */
.fs-pricing{background:var(--navy);}
.fs-pricingGrid{display:grid;grid-template-columns:1fr 1fr;gap:28px;}
.fs-priceCard{background:var(--navy-2);border:1px solid var(--line);border-radius:20px;padding:36px;position:relative;}
.fs-priceCard.featured{border-color:rgba(99,102,241,.5);background:linear-gradient(180deg,rgba(67,56,202,.1),transparent 60%);}
.fs-priceCard .fs-price{font-size:14px;font-weight:900;color:var(--indigo-2);text-transform:uppercase;letter-spacing:.12em;margin:0 0 10px;}
.fs-priceCard h3{font-size:26px;font-weight:900;margin:0 0 10px;}
.fs-priceCard .fs-desc{font-size:14px;color:var(--text-secondary);margin:0 0 20px;line-height:1.6;}
.fs-priceFeatures{list-style:none;margin:0 0 28px;padding:0;}
.fs-priceFeatures li{font-size:13px;color:var(--text-primary);padding:8px 0 8px 26px;position:relative;border-top:1px solid var(--line);}
.fs-priceFeatures li:first-child{border-top:none;}
.fs-priceFeatures li::before{content:'✓';position:absolute;left:0;top:8px;color:var(--good);font-weight:900;}
.fs-priceBtn{width:100%;justify-content:center;}
```

Extend the mobile breakpoint:

```css
      .fs-pricingGrid{grid-template-columns:1fr;gap:20px;}
      .fs-priceCard{padding:28px;}
```

- [ ] **Step 6.2: Add the pricing markup**

Replace `<!-- sections added in later tasks -->` with:

```html
  <!-- PRICING + TRIAL CTA -->
  <section class="fs-section fs-pricing" aria-labelledby="pricing-title">
    <div class="fs-sectionInner">
      <span class="fs-sectionLabel">Pricing</span>
      <h2 class="fs-sectionTitle" id="pricing-title">Simple pricing. Free to try.</h2>
      <p class="fs-sectionIntro">Individual teachers get free access during our early adoption program. Whole-school pricing is quoted per school so you only pay for what you need.</p>

      <div class="fs-pricingGrid">

        <article class="fs-priceCard featured">
          <p class="fs-price">Individual teacher</p>
          <h3>Free 12-month trial</h3>
          <p class="fs-desc">For teachers who want to try Word Labs in their own classroom.</p>
          <ul class="fs-priceFeatures">
            <li>All 13 activities</li>
            <li>Unlimited students per class</li>
            <li>Full teacher dashboard and resources</li>
            <li>324 teaching slide decks + worksheet generators</li>
            <li>No credit card required</li>
          </ul>
          <a class="fs-btn fs-btn-primary fs-priceBtn" href="teacher-login.html?signup=1">Start a 3-month free trial</a>
        </article>

        <article class="fs-priceCard">
          <p class="fs-price">Whole school</p>
          <h3>Custom quote</h3>
          <p class="fs-desc">For schools that want dashboard access for every teacher and pay via one invoice.</p>
          <ul class="fs-priceFeatures">
            <li>Dashboard access for every teacher</li>
            <li>Unlimited students</li>
            <li>Pay by invoice, PO, or Stripe</li>
            <li>Priority support from Nick</li>
            <li>Printable login cards for every class</li>
          </ul>
          <a class="fs-btn fs-btn-ghost fs-priceBtn" href="pricing.html#quote">Get a quote</a>
        </article>

      </div>
    </div>
  </section>
```

- [ ] **Step 6.3: Smoke test the complete page**

```
browser_navigate → http://127.0.0.1:8080/for-schools.html
browser_console_messages
browser_take_screenshot (fullPage:true, filename:"for-schools-full.png")
```

Expected:
- Zero console errors, zero warnings.
- Full page renders end-to-end: hero → dual panel → trust pillars + pack → pricing → footer.
- Featured pricing card has a subtle indigo glow, the other is plain.
- No horizontal scroll.

Check the critical links all resolve:
```bash
for path in "edbuy-docs/school-information-pack.zip" "teacher-login.html" "pricing.html" "about.html" "teacher-resources.html"; do
  status=$(curl -sI "http://127.0.0.1:8080/$path" | head -1 | awk '{print $2}')
  echo "$status $path"
done
```

Expected: all 200.

- [ ] **Step 6.4: Commit**

```bash
git add for-schools.html
git commit -m "feat(for-schools): add pricing section with two CTA cards

Two-card pricing layout. Left card (featured, indigo glow) is
'Individual teacher - Free 12-month trial' with a feature list
and a primary CTA button 'Start a 3-month free trial' linking to
teacher signup. Right card is 'Whole school - Custom quote'
linking to the existing school quote modal on pricing.html.

The intentional mismatch between '12-month' in the card heading
and '3-month' on the button is documented in
project_trial_period_change.md — marketing under-promises while
the backend over-delivers, until Nick is ready to flip the switch.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Accessibility and mobile smoke test

**Files:**
- Test: `for-schools.html` (no modifications unless issues found)

- [ ] **Step 7.1: Accessibility check — landmarks and skip link**

```
browser_navigate → http://127.0.0.1:8080/for-schools.html
browser_evaluate → JS snippet below
```

Snippet:
```javascript
() => {
  const checks = {
    skipLink: !!document.querySelector('a.skip-link[href="#main-content"]'),
    mainHasId: !!document.getElementById('main-content'),
    bannerRole: !!document.querySelector('[role="banner"]'),
    mainRole: !!document.querySelector('[role="main"]'),
    navRole: !!document.querySelector('[role="navigation"]'),
    contentinfoRole: !!document.querySelector('[role="contentinfo"]'),
    h1Count: document.querySelectorAll('h1').length,
    allImagesHaveAlt: Array.from(document.images).every(img => img.alt && img.alt.trim().length > 0),
    currentPageAria: !!document.querySelector('[aria-current="page"]')
  };
  return checks;
}
```

Expected every value to be `true` except `h1Count` which should be exactly `1`.

- [ ] **Step 7.2: Mobile viewport check at 360px**

```
browser_resize (width:360, height:740)
browser_navigate → http://127.0.0.1:8080/for-schools.html
browser_evaluate → () => ({hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth})
browser_take_screenshot (filename:"for-schools-mobile.png", fullPage:true)
```

Expected: `{hasHorizontalScroll: false}`. Screenshot shows everything stacked in a single column, no content cut off at the right edge.

If there is horizontal scroll, find the offending element by running:
```javascript
() => {
  const all = document.querySelectorAll('*');
  const wider = Array.from(all).filter(el => el.scrollWidth > window.innerWidth);
  return wider.slice(0, 5).map(el => ({tag:el.tagName, cls:el.className, w:el.scrollWidth}));
}
```
and fix by adding `max-width:100%` or `overflow-wrap:anywhere` to the identified element.

- [ ] **Step 7.3: Resize back to desktop**

```
browser_resize (width:1440, height:900)
```

- [ ] **Step 7.4: Commit (only if Task 7 required fixes)**

If the checks in Steps 7.1 or 7.2 revealed issues that required edits to `for-schools.html`, commit them:

```bash
git add for-schools.html
git commit -m "fix(for-schools): accessibility and mobile polish

<describe what was fixed>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

If no fixes were needed, skip this commit.

---

## Task 8: Add "For schools" header link to landing.html

**Files:**
- Modify: `landing.html`

- [ ] **Step 8.1: Find the logged-out header nav**

Run:
```bash
grep -n "About.*Pricing\|Teacher Login" landing.html | head -10
```

This finds the nav link group for logged-out visitors. The existing links to About and Pricing should be siblings of where "For schools" will be inserted.

- [ ] **Step 8.2: Insert the "For schools" link**

Locate the pattern in `landing.html` that looks like `<a href="about.html">About</a>` in the header nav (there may be more than one nav — pick the one that shows to logged-out visitors — typically in the top header, not inside a drawer).

Insert a new link immediately after the About link. The exact edit depends on the existing markup; common pattern:

```html
<a href="about.html">About</a>
<a href="for-schools.html">For schools</a>
```

Use the Edit tool with exact old_string / new_string that includes enough context to be unique. If the nav has multiple instances (logged-out view and logged-in drawer), prefer adding to the logged-out view only.

- [ ] **Step 8.3: Smoke test**

```
browser_navigate → http://127.0.0.1:8080/landing.html
browser_console_messages
```

Expected: zero console errors. The new "For schools" link is visible in the logged-out header. Click it:
```
browser_evaluate → () => { document.querySelector('a[href="for-schools.html"]').click(); }
```
Expected: navigates to `for-schools.html`.

- [ ] **Step 8.4: Commit**

```bash
git add landing.html
git commit -m "feat(landing): add 'For schools' link to logged-out header nav

Direct entry point to the new principal landing page for anonymous
visitors. Shown in the top header nav alongside About, Pricing, and
Teacher Login.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Footer updates — Pattern A pages (common footer-note)

The Pattern A pages use the `<span class="footer-note">...<a>Home</a> · <a>About</a> · <a>Privacy</a> · <a>Terms</a> · <a>Pricing</a> · <a>Contact</a></span>` pattern from `wordlab-common.css`. Add "For schools" between "About" and "Privacy".

**Files:**
- Modify: `about.html`, `faq.html`, `landing.html`, `teacher-guide.html`, `feedback.html`, `account.html`, `onboarding.html`, `teacher-login.html`, `teacher-signup.html`, `dashboard.html`

- [ ] **Step 9.1: Verify the exact pattern on one file first**

Run:
```bash
grep -n "About.*Privacy" about.html
```

Expected: one line containing exactly `<a href="about.html">About</a> · <a href="privacy.html">Privacy</a>` (or equivalent). Use this exact string as the `old_string` for Edit.

- [ ] **Step 9.2: Apply the footer update to all 10 Pattern A files**

For each file, use the Edit tool with:

**old_string:**
```
<a href="about.html">About</a> · <a href="privacy.html">Privacy</a>
```

**new_string:**
```
<a href="about.html">About</a> · <a href="for-schools.html">For schools</a> · <a href="privacy.html">Privacy</a>
```

If a file doesn't match this exact pattern (e.g., it has different casing, spacing, or text colour styles inline), inspect it individually and adapt the edit. Do not use `replace_all` without verifying each file.

Apply to each file: `about.html`, `faq.html`, `landing.html`, `teacher-guide.html`, `feedback.html`, `account.html`, `onboarding.html`, `teacher-login.html`, `teacher-signup.html`, `dashboard.html`.

- [ ] **Step 9.3: Verify all 10 files updated**

```bash
grep -l "for-schools.html" about.html faq.html landing.html teacher-guide.html feedback.html account.html onboarding.html teacher-login.html teacher-signup.html dashboard.html
```

Expected: all 10 filenames listed. Any missing files need a manual fix.

- [ ] **Step 9.4: Commit**

```bash
git add about.html faq.html landing.html teacher-guide.html feedback.html account.html onboarding.html teacher-login.html teacher-signup.html dashboard.html
git commit -m "feat(footer): add 'For schools' link to 10 pattern-A pages

Adds the new for-schools.html to the standard footer link set on
every page that uses the common <span class='footer-note'> pattern
from wordlab-common.css. Positioned between About and Privacy so
it reads: Home · About · For schools · Privacy · Terms · Pricing
· Contact.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Footer updates — Pattern B pages (inline div footer)

Pattern B pages (pricing, privacy, terms, data-agreement, parent-privacy, security-architecture, incident-response) use an inline `<div class="footer">🧪 Word Labs · <a style="color:#64748b;">Home</a> · ...</div>` pattern with inline colour styles.

**Files:**
- Modify: `pricing.html`, `privacy.html`, `terms.html`, `data-agreement.html`, `parent-privacy.html`, `security-architecture.html`, `incident-response.html`

- [ ] **Step 10.1: Verify the exact pattern on one file**

```bash
grep -n "style=\"color:#64748b.*About" pricing.html
```

Expected: a line containing `<a href="about.html" style="color:#64748b;">About</a> · <a href="privacy.html" style="color:#64748b;">Privacy</a>`.

- [ ] **Step 10.2: Apply to each Pattern B file**

For each file, use the Edit tool with:

**old_string:**
```html
<a href="about.html" style="color:#64748b;">About</a> · <a href="privacy.html" style="color:#64748b;">Privacy</a>
```

**new_string:**
```html
<a href="about.html" style="color:#64748b;">About</a> · <a href="for-schools.html" style="color:#64748b;">For schools</a> · <a href="privacy.html" style="color:#64748b;">Privacy</a>
```

Apply to: `pricing.html`, `privacy.html`, `terms.html`, `data-agreement.html`, `parent-privacy.html`, `security-architecture.html`, `incident-response.html`.

If a file has a slightly different inline style (e.g., `color:#94a3b8`), inspect and adapt.

- [ ] **Step 10.3: Verify all 7 files updated**

```bash
grep -l "for-schools.html" pricing.html privacy.html terms.html data-agreement.html parent-privacy.html security-architecture.html incident-response.html
```

Expected: all 7 filenames listed.

- [ ] **Step 10.4: Commit**

```bash
git add pricing.html privacy.html terms.html data-agreement.html parent-privacy.html security-architecture.html incident-response.html
git commit -m "feat(footer): add 'For schools' link to 7 pattern-B pages

Adds the new for-schools.html to the inline-footer pattern used on
the legal / marketing pages that don't use wordlab-common.css's
.footer-note class. Same position as Pattern A — between About
and Privacy in the horizontal bullet-separated link list.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Final end-to-end smoke test

**Files:**
- Test: all modified pages

- [ ] **Step 11.1: Final Playwright walk-through of key navigation flows**

```
browser_navigate → http://127.0.0.1:8080/landing.html
browser_console_messages
```
Verify zero errors, "For schools" link visible in header nav and footer.

```
browser_navigate → http://127.0.0.1:8080/for-schools.html
browser_console_messages
```
Verify zero errors, page renders fully.

```
browser_navigate → http://127.0.0.1:8080/about.html
browser_console_messages
```
Verify zero errors and footer contains `For schools`.

```
browser_navigate → http://127.0.0.1:8080/pricing.html
browser_console_messages
```
Same — zero errors and footer contains `For schools`.

- [ ] **Step 11.2: Verify the ZIP download works end-to-end**

```bash
curl -s -o /tmp/pack-test.zip http://127.0.0.1:8080/edbuy-docs/school-information-pack.zip
unzip -l /tmp/pack-test.zip | tail -5
rm /tmp/pack-test.zip
```

Expected: 7 PDFs listed, total ~2.2 MB.

- [ ] **Step 11.3: Shut down the dev server**

```bash
pkill -f "http.server 8080" 2>/dev/null || true
```

- [ ] **Step 11.4: Update CLAUDE.md roadmap**

Add a bullet to the CLAUDE.md section 11 roadmap under a new Phase 7.21 heading (or Phase 9 if that's where sales-enablement work is living) noting:
- ✅ `for-schools.html` principal landing page shipped (2026-04-09)
- ✅ School Information Pack ZIP (7 PDFs) committed at `edbuy-docs/school-information-pack.zip`
- ✅ Footer cross-links added on 17 marketing pages

Also add a one-line entry under section 13 "Decisions Made & Why":
- "Principal landing page (for-schools.html) — direct-to-principal sales page with pack download + trial CTA. Marketing copy says '3-month trial' but backend still grants 12 months; see project_trial_period_change.md for the planned flip."

- [ ] **Step 11.5: Commit the CLAUDE.md update**

```bash
git add CLAUDE.md
git commit -m "docs(claude): log principal landing page ship in roadmap

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 11.6: Push everything**

```bash
git push origin main
```

---

## Spec Coverage Check

Every section and requirement from `docs/superpowers/specs/2026-04-09-principal-landing-page-design.md` maps to tasks above:

| Spec section | Task(s) |
|---|---|
| 5.1 Hero | Task 3 |
| 5.2 Students + Teachers | Task 4 |
| 5.3 Trust & Compliance + Pack | Task 5 (+ Task 1 for the ZIP) |
| 5.4 Pricing + Trial CTA | Task 6 |
| 5.5 Footer | Task 2 (scaffold) |
| 6. School Information Pack ZIP | Task 1 |
| 7. Navigation / discovery | Task 8 (header), Tasks 9–10 (footers) |
| 8. Visual treatment | Tasks 2–6 inline CSS + wordlab-common.css reuse |
| 9. Accessibility | Task 7 |
| 10. Out-of-scope | n/a |
| 11. Downstream follow-ups | Recorded in project memory, not this plan |
| 12. Approval | n/a |

All spec requirements are covered.

---

## Out-of-scope for this plan (as per spec section 10)

Explicitly NOT doing any of the following in these tasks — if encountered, defer:
- Backend trial period change (12-month → 3-month)
- Calendly / booking widget
- Lead capture / CRM integration
- Testimonials / case studies / logos
- Analytics / A/B testing
- New auth role for principals
- Dynamic content / CMS
- Mobile drawer rework on landing.html
