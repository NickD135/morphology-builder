# Principal Landing Page — Design Spec

**Date:** 2026-04-09
**Author:** Nicholas Deeney (via brainstorming session with Claude)
**Status:** Design approved, awaiting implementation plan

---

## 1. Purpose

Create a dedicated landing page aimed at **school principals, literacy coordinators, and assistant principals** — the people who decide whether Word Labs gets whitelisted, trialled, and adopted at an Australian primary school. The existing `landing.html` is optimised for logged-in students and teachers browsing the activity catalogue. It does not serve a principal who has never seen the product before and needs to make a judgement in 60 seconds.

Context from the 2026-04-09 EdConnect call (see `project_nsw_procurement_reality.md`): NSW schools can buy directly for purchases under $10k without central DoE approval. The SaaS Risk Assessment track is *trust-building, not gatekeeping*. This means a principal's due-diligence process is now the critical path to first revenue — so the landing page needs to be the single best surface for that process.

## 2. Audience

**Primary:** Principals scanning the page in 60 seconds on a school laptop. Typically a non-specialist IT reader who needs to satisfy themselves that Word Labs is (a) aligned to the NSW syllabus, (b) safe for student data, (c) something their teachers would actually use, and (d) affordable.

**Secondary:** Literacy coordinators and assistant principals who forward the link to their principal with a "can we try this?" note. These are the *internal champions*. They need enough detail to justify the forward without requiring a call first.

**Tertiary:** School IT / privacy officers doing compliance review. They don't read the marketing copy — they download the School Information Pack and check the paperwork. The page's job for them is to make the pack frictionless to find.

## 3. Non-goals

- Not a replacement for `landing.html`, `about.html`, or `pricing.html`. It supplements them, linking out where depth is needed.
- Not a case-study or testimonials page. Word Labs currently has no pilot case studies (see Phase 9.5). We will not fabricate social proof.
- Not a lead capture form. The School Information Pack downloads directly with no email gate. No CRM integration.
- Not a backend change. The 3-month trial is marketing copy only — the signup flow remains as-is (12-month free window). See `project_trial_period_change.md` for the eventual backend change.

## 4. URL and file location

- **Path:** `/for-schools.html`
- **Rationale:** `/for-principals` is too narrow (alienates APs and literacy coordinators). `/schools` is ambiguous with the database `schools` table and too generic. `/for-schools` is conventional marketing-page vocabulary and works for all three audience tiers.
- **File:** `for-schools.html` at repo root, matching all other marketing pages (`about.html`, `pricing.html`, `faq.html`, etc.).

## 5. Page structure (Lean — 5 sections)

Matches Option A from the brainstorming visual companion.

### 5.1 Hero

**Headline (H1):**
> Word Labs for schools

**Subheadline (lede paragraph):**
> Word Labs is a browser-based structured literacy platform for Years 2–6, built by a practising NSW primary teacher. It gives your students 13 evidence-based activities across phonics, morphology and spelling, and your teachers a real-time dashboard plus 324 ready-to-project teaching slide decks — all aligned to the NSW English K–10 Syllabus.

**CTAs (two buttons, horizontally stacked on desktop, vertically on mobile):**
- **Primary (filled indigo):** "📦 Download the School Information Pack" → `edbuy-docs/school-information-pack.zip`
- **Secondary (ghost outline):** "Start a 3-month free trial" → `teacher-login.html?signup=1`

**Visual treatment:** Same dark navy hero band as `landing.html` / `pricing.html`. A single hero screenshot on the right side at desktop widths, stacked below on mobile. Use the existing `assets/screens/dashboard-overview.png` as the hero screenshot — it's the strongest single visual of teacher value and it's already committed.

### 5.2 Students + Teachers (dual panel)

Two side-by-side cards on desktop, stacked on mobile. Same `.wlScreen`-based screenshot component already used on `about.html` and `pricing.html`.

**Left panel — "What your students do":**
- Heading: "What your students do"
- Body (2 sentences): *"Students practise phonological, orthographic, and morphological knowledge through 13 gamified activities — Morpheme Builder, Breakdown Blitz, Phoneme Splitter, Syllable Splitter, Sound Sorter, Meaning Match-Up, Mission Mode, Root Lab, Word Spectrum, The Refinery, Homophone Hunter, Flashcards, and Speed Builder. Each activity targets a specific skill that transfers directly to spelling accuracy and reading comprehension."*
- Screenshot: a student-facing game page. Use `assets/screens/root-lab.png` (already committed from the about page redesign).

**Right panel — "What your teachers get":**
- Heading: "What your teachers get"
- Body (2 sentences): *"A real-time dashboard with accuracy heatmaps, intervention flags, and individual student profiles. 324 ready-to-project teaching slide decks, 9 printable worksheet generators, per-student differentiation (Extension, Support, Low-stim, and EALD modes across 48 languages), and a Spelling Check-In dictation tool — all designed to fit into a single structured spelling block."*
- Screenshot: `assets/screens/slide-decks.png`. (Using a second crop of the dashboard screenshot would have been nice but adds image-processing work; the slide-decks screenshot is already committed and illustrates the "324 teaching slide decks" claim directly.)

**Tertiary links below the panels:** "See the full activity list →" (about.html#activities), "See the teacher resources →" (teacher-resources.html).

### 5.3 Trust & Compliance

Single section with three horizontal pillars, followed by the School Information Pack download block. This is the most important section on the page for principals doing due diligence.

**Intro paragraph:**
> Word Labs was built by a practising NSW primary teacher and is designed to meet the compliance, data sovereignty, and syllabus alignment requirements of Australian primary schools.

**Three pillar cards (side by side on desktop):**

1. **🔒 Data sovereignty.**
   *"All student data is stored in Australia, in Supabase's Sydney data centre (ap-southeast-2). No student data ever leaves the country. Privacy Act 1988 compliant, aligned to the Australian Privacy Principles (APPs) and the NSW PPIP Act."*

2. **📘 NSW syllabus aligned.**
   *"Directly mapped to the NSW English K–10 Syllabus Stage 2 and Stage 3 spelling outcomes, the Australian Curriculum v9.0, and the NSW Literacy Continuum. Built around explicit instruction and structured literacy research."*

3. **🧑‍🏫 Built by a teacher.**
   *"Word Labs is designed, built, and maintained by Nicholas Deeney, a practising NSW public primary school teacher. Not a retrofit of a commercial product — every activity reflects what works in a real classroom."*

**School Information Pack block (full-width below the pillars):**

- Heading: "Download the School Information Pack"
- Subheading: "Everything your IT and leadership teams need to review Word Labs — all 7 compliance documents in one ZIP."
- Bullet list of contents:
  - Data Handling Agreement (PDF)
  - Security Architecture (PDF)
  - Incident Response Plan (PDF)
  - Privacy Policy (PDF)
  - Terms of Service (PDF)
  - Parent Privacy Summary (PDF)
  - Teacher Guide (PDF)
- Primary button: "📦 Download the pack (ZIP, ~2.2 MB)" → `edbuy-docs/school-information-pack.zip`
- Secondary (small text link list): "Or download documents individually:" followed by 7 inline links to each PDF in `edbuy-docs/`

### 5.4 Pricing + Trial CTA

**Intro:** *"Individual teachers get free access during our early adoption program. Whole-school pricing is quoted per school so you only pay for what you need."*

**Two cards side by side:**

**Card A — "Individual teacher":**
- Free 12-month trial
- All features, unlimited students per class
- For teachers who want to try Word Labs in their own classroom
- Button: "Start a 3-month free trial" → `teacher-login.html?signup=1`

*(Note the intentional under-promise in the button copy per section 3 and `project_trial_period_change.md`. The backend still grants 12 months.)*

**Card B — "Whole school":**
- Custom quote
- Dashboard access for every teacher in the school, unlimited students
- Pay by invoice, PO, or Stripe
- Button: "Get a quote" → `pricing.html#quote` (opens the existing school quote modal)

### 5.5 Footer

Standard `wordlab-common.css` footer, same as every other marketing page. No custom content.

## 6. School Information Pack ZIP

### 6.1 Contents

The ZIP bundles the same 7 PDFs already sitting in `edbuy-docs/` (committed 2026-04-09 in commit `3a887ea`). Those PDFs are generated from the print-styled HTML compliance pages via `chrome --headless --print-to-pdf`:

1. Word Labs - Data Handling Agreement.pdf
2. Word Labs - Security Architecture.pdf
3. Word Labs - Incident Response Plan.pdf
4. Word Labs - Privacy Policy.pdf
5. Word Labs - Terms of Service.pdf
6. Word Labs - Parent Privacy Summary.pdf
7. Word Labs - Teacher Guide.pdf

### 6.2 Generation

- Path: `edbuy-docs/school-information-pack.zip`
- Created via `zip -r school-information-pack.zip "Word Labs - "*.pdf` inside `edbuy-docs/`
- Committed to the repo — small (~2.2 MB) and changes infrequently
- Regenerate whenever any constituent PDF is updated (which happens when the underlying HTML compliance page is edited — e.g., the Security Architecture update earlier on 2026-04-09)

### 6.3 No README inside the ZIP

Plain ZIP of PDFs, no index file. The filename convention (`Word Labs - <Doc Name>.pdf`) is self-explanatory. Adding a README.txt creates sync burden with no meaningful reader benefit.

## 7. Navigation and discovery

The landing page is useless if nobody finds it. Linking from:

1. **Site header — new "For schools" link** on `landing.html` (logged-out view only — logged-in teachers and students don't need it). Positioned after "About" in the header nav. Desktop only initially — mobile nav is tight and the link can be added later.
2. **Standard footer link set** — add "For schools" to the existing footer on all marketing pages (`landing`, `about`, `pricing`, `faq`, `terms`, `privacy`, `data-agreement`, `parent-privacy`, `teacher-guide`, `security-architecture`, `incident-response`). `wordlab-common.css` defines footer *styles* only; the footer markup/content is duplicated in each HTML page, so this is a find-and-replace across ~11 files. One commit per logical group, same pattern as the Phase 7.13 footer standardisation.
3. **Pricing page cross-link** — add a small "School administrator? See our for-schools page →" banner at the top of `pricing.html` to redirect principals who land on pricing first.
4. **About page cross-link** — same idea, one-line banner at the top of `about.html`.
5. **Direct URL share** — Nick pastes `wordlabs.app/for-schools` into cold emails, EdBuy profile, LinkedIn posts, etc.

## 8. Visual treatment and design system

- **Reuse `wordlab-common.css`** for header, footer, skip link, buttons, focus-visible, and variables — no custom CSS duplication.
- **Dark navy theme** matching `landing.html` / `pricing.html` / `about.html` — the same `--header-rgb`, indigo accent, Lexend font.
- **Screenshots** via the existing `.wlScreen` class used on about/pricing. Lazy-loaded via `loading="lazy"`.
- **Two-button hero** matches the pattern on `landing.html` and `pricing.html`.
- **Trust pillars** use a 3-card grid matching the `.tier-grid` pattern from `about.html` — same component, just repointed.
- **School Information Pack download block** is a custom component unique to this page. Should be visually distinct enough that a principal scanning the page can find it in 5 seconds.

Implementation will invoke the `frontend-design` skill during the build phase to ensure the final page has genuine polish rather than just structural correctness.

## 9. Accessibility

- Skip-to-content link (via `wordlab-common.css`)
- ARIA landmarks (`role="banner"`, `role="main"`, `role="navigation"`)
- All images have descriptive alt text
- All buttons have explicit `type` attributes
- The ZIP download link has a clear accessible name (not just an icon)
- Keyboard-only navigation audited — every interactive element reachable and styled with `focus-visible`
- Colour contrast follows the existing page palette (already WCAG 2.1 AA per Phase 9.1)

## 10. What we will NOT do in this spec

The following are explicitly out of scope and listed here so scope creep can be refused cleanly:

- **Backend trial period change.** Still 12 months. See `project_trial_period_change.md`.
- **Calendly / booking widget.** No scheduling integration. "Contact" in the footer is sufficient.
- **Lead capture / CRM.** Pack download is unguarded.
- **Testimonials, case studies, logos.** Nothing to show yet.
- **A/B testing or analytics.** One version, shipped, observed informally.
- **Separate principal account type.** No new auth role.
- **Dynamic content / CMS.** Page is static HTML like every other page.

## 11. Downstream follow-ups (not this session)

Items this spec surfaces that deserve their own future work:

1. **Backend trial change** — when Nick is ready (per memory).
2. **Pilot case study template** — when the first pilot is running, we'll want a structured way to capture quotes and outcome data that can flow back onto this page as social proof.
3. **Mobile navigation** — if the "For schools" header link doesn't fit in the mobile nav drawer, revisit the landing page mobile nav as a separate task.
4. **Marketing site vs. app site split** — eventually the product and the marketing site should live on different domains or paths. Not today.

---

## 12. Approval

The five decisions made during brainstorming on 2026-04-09:

1. ✅ Primary CTA: download the School Information Pack (no email gate, direct ZIP).
2. ✅ Secondary CTA: "Start a 3-month free trial" linking to existing teacher signup.
3. ✅ Hero messaging: blend of teacher-built credibility and concrete product benefits.
4. ✅ Page structure: Lean (5 sections, ~1.5 screens of scroll).
5. ✅ Trial button target: `teacher-login.html?signup=1` (existing flow), with copy intentionally under-promising the 12-month backend grant.
