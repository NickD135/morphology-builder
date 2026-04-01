# Word Labs — Site Consistency and Professionalism Spec

**Date:** 2026-04-01
**Author:** Nicholas Deeney + Claude
**Status:** Approved

---

## Goal

Bring clarity, consistency, and professionalism across the entire Word Labs website. The site is a commercial SaaS product being submitted to the NSW Department of Education Cyber Security team — it needs to look and feel trustworthy for school procurement teams, IT departments, and teachers.

---

## Scope

All non-game HTML pages (teacher tools, info pages, legal docs, marketing pages). Game pages are excluded — they have intentional per-game theming that stays as-is.

---

## 1. Activity Name Standardisation

Fix inconsistent game names across the site. These are the canonical names:

| Canonical Name | Fix needed |
|---|---|
| **Meaning Match-Up** | FAQ and teacher-guide currently say "Meaning Mode" — change to "Meaning Match-Up" |
| **Flashcards** | FAQ currently says "Flashcard Mode" — change to "Flashcards" |

All other 11 game names are already consistent: Morpheme Builder, Mission Mode, Breakdown Blitz, Phoneme Splitter, Syllable Splitter, Sound Sorter, Speed Builder, Root Lab, Homophone Hunter, Word Spectrum, The Refinery.

**Spelling Check-In** (the assessment tool) is also consistent everywhere.

### Files to update
- `faq.html` — "Meaning Mode" → "Meaning Match-Up", "Flashcard Mode" → "Flashcards"
- `teacher-guide.html` — check for any "Meaning Mode" → "Meaning Match-Up"

---

## 2. Feature Name Standardisation

| Canonical Name | Variations to fix |
|---|---|
| **Low-stim mode** | "Low-stimulation mode" used in some places on about.html — standardise to "Low-stim mode" everywhere |

Extension Mode, Support Mode, EALD, Teacher Mode, Spelling Check-In, Featured Game are all already consistent.

### Files to check
- `about.html` — find "Low-stimulation mode" → "Low-stim mode"

---

## 3. Page Title Standardisation

All pages use the format: **Word Labs – [Page Name]**

Brand first, en dash separator. This matches the majority of pages already.

| Current title | New title |
|---|---|
| `landing.html`: "Word Labs" | "Word Labs – Home" |
| `about.html`: if reversed | "Word Labs – About" |
| `privacy.html`: if reversed | "Word Labs – Privacy Policy" |
| `terms.html`: if reversed | "Word Labs – Terms of Service" |
| `parent-privacy.html`: if reversed | "Word Labs – Parent Privacy Summary" |
| `security-architecture.html`: if reversed | "Word Labs – Security Architecture" |
| `incident-response.html`: if reversed | "Word Labs – Incident Response Plan" |
| `data-agreement.html`: if reversed | "Word Labs – Data Handling Agreement" |
| `faq.html`: if reversed | "Word Labs – FAQ" |
| `teacher-guide.html`: if reversed | "Word Labs – Teacher Guide" |

All game pages already follow this pattern. Teacher tool pages (dashboard, class-setup, account, etc.) already follow this pattern.

### Files to update
- Any page where the title is "[Page Name] – Word Labs" → flip to "Word Labs – [Page Name]"
- `landing.html` → add " – Home" suffix

---

## 4. Unified Dark Header

All non-game pages get the same dark sticky header, matching the style used on about.html, faq.html, and teacher-guide.html:

- **Background:** Dark with glassmorphism blur (rgba dark + backdrop-filter: blur(12px))
- **Position:** Sticky, top: 0, z-index: 50
- **Left:** Brand icon (indigo square with lab emoji) + "Word Labs" text
- **Right:** "Home" link (all pages)
- **Teacher tool pages** (dashboard, class-setup, account, item-creator): keep their additional nav links (Dashboard, Setup, Account, Sign Out) but restyle into the dark header

### Pages that need header changes

**Currently light static headers → dark sticky:**
- `privacy.html`
- `terms.html`
- `data-agreement.html`
- `parent-privacy.html`
- `security-architecture.html`
- `incident-response.html`

**Currently light sticky headers → dark sticky:**
- `class-setup.html`
- `account.html`
- `onboarding.html`
- `item-creator.html`
- `scientist.html`
- `pricing.html`

**Currently dark but different style → standardise:**
- `teacher-login.html`
- `teacher-signup.html`
- `landing.html`
- `feedback.html`

**Already correct (reference implementations):**
- `about.html`
- `faq.html`
- `teacher-guide.html`
- `teacher-resources.html`

**Excluded (game pages — keep as-is):**
- All 14 game HTML files

### Header HTML template

Use the exact header structure from `about.html` as the reference. For teacher tool pages, add nav links to the right side in the same dark style.

---

## 5. Unified Footer

All non-game pages get the same footer:

```
Word Labs · Home · About · Privacy · Terms · Pricing · Contact
```

- Contact links to `mailto:nick@wordlabs.app`
- Style: centred text, light grey on dark or muted on light, 13px Lexend font-weight 700, top border separator
- Match the footer style from the legal document pages (clean, simple)

### Pages that need footer added
- `dashboard.html` — currently has no footer
- `item-creator.html` — currently has no footer
- `scientist.html` — currently has no footer (or incomplete)

### Pages that need footer links updated
- Any page missing links from the standard set
- Any page with different link ordering

### Excluded
- Game pages (students don't need legal links mid-game)

---

## 6. Accessibility Fixes

| Fix | Page |
|---|---|
| Add skip-to-content link | `landing.html` |
| Add skip-to-content link | `dashboard.html` |
| Fix inline SVG favicon → use `favicon.svg` | `spelling-test.html` |
| Fix sticky header → fixed header | `spelling-test.html` |

Skip link style (already standard across the site):
```css
.skip-link{position:absolute;top:-40px;left:0;background:#4338ca;color:#fff;padding:8px 16px;z-index:10000;font-weight:700;font-size:14px;border-radius:0 0 8px 0;transition:top .2s;}
.skip-link:focus{top:0;}
```

---

## 7. Not Touching

- Per-game accent colours (intentional theming)
- Game page headers/footers (separate student context)
- Dashboard navy background (#0f172a) — appropriate for data-heavy tool
- Page content/copy (already audited and clean)
- Australian English (already correct everywhere)
- Product name "Word Labs" (already consistent)
- Contact email nick@wordlabs.app (already consistent)
- CTA language (already consistent)

---

## Implementation Order

1. Activity + feature name fixes (small text changes, low risk)
2. Page title standardisation (small text changes, low risk)
3. Accessibility fixes (small, high value)
4. Unified footer (add to missing pages, standardise links)
5. Unified dark header (largest change — update all non-game page headers)

---

## Success Criteria

- Every non-game page has the same dark sticky header
- Every non-game page has the same footer with identical links
- All 13 game names + Spelling Check-In are consistent across every page
- All page titles follow "Word Labs – [Page Name]" format
- All pages have skip-to-content links
- Zero instances of "Meaning Mode", "Flashcard Mode", or "Low-stimulation mode"
