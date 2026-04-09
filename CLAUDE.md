# Word Labs — Claude Working Document

> Read this at the start of every session. It is the source of truth for what this project is,
> where it is going, and exactly what needs to be done next.

---

## 1. What This Project Is

**Word Labs** is a browser-based morphology and phonics educational tool built for upper primary
classrooms (ages 9–12, UK Key Stage 2). It was built by Nicholas Deeney, a primary school teacher.

The goal is to turn it into a **commercial SaaS product sold to schools** — subscription-based,
privacy-law-compliant, multi-tenant, with proper teacher auth and a payment layer.

**Owner:** Nicholas Deeney — Australian primary school teacher
**Target market:** Australian primary schools (and NZ/UK later)
**Currency:** AUD
**Legal jurisdiction:** Australian Privacy Act 1988 + Australian Consumer Law (not GDPR, though
  similar principles apply — worth being GDPR-compatible for future UK/EU expansion)
**Key compliance:** Australian Privacy Principles (APPs), notifiable data breaches scheme
**Pricing model:** Teacher subscription (individual) + custom school quotes (no fixed price)
**Supabase region:** Should be `ap-southeast-2` (Sydney) for data sovereignty —
  current project may be in US; check and migrate if needed

**GitHub repo:** `NickD135/morphology-builder`
**Supabase project ref:** `kdpavfrzmmzknqfpodrl` (Sydney, ap-southeast-2)
**Supabase URL:** `https://kdpavfrzmmzknqfpodrl.supabase.co`
**Old Supabase (deprecated):** `qutsbcfkgiihcwaktsaz` (Singapore — do not use, migration completed 2026-03-25)
**Local dev:** `python3 -m http.server 8080 --bind 0.0.0.0`
**Live URL:** https://wordlabs.app (also https://morphology-builder.vercel.app)

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Pages | Static HTML files | No build system — served directly |
| Styling | Inline CSS per page | Lexend font from Google Fonts |
| Data layer | `wordlab-data.js` (IIFE module) | Shared across all pages |
| Database | Supabase (PostgreSQL) | Anon key used client-side |
| Auth | ❌ None yet | Hardcoded password `MorphemeLab` in HTML |
| Hosting | Currently Codespaces only | Needs Vercel deployment |
| Edge functions | Supabase Edge (Deno) | `polish-item`, `create-checkout`, `stripe-webhook`, `send-feedback`, `create-portal-session`, `get-subscription`, `analyze-words` |
| Canvas | Fabric.js 5.3.1 | Used in `item-creator.html` only |
| Build scripts | Node.js (local) | `scripts/build-valid-combos.js` generates morpheme combo JSON |
| Payments | Stripe (live) | ABN + "Word Labs Education" sole trader |
| Transactional email | Resend | Free tier, domain verified, sends from notifications@wordlabs.app |

---

## 3. All Pages & Their Purpose

| File | Who uses it | What it does |
|---|---|---|
| `landing.html` | Everyone | Home page — activity cards, scientist character display, login UI |
| `morpheme-builder.html` | Students | Morpheme Builder — click morpheme tiles to explore building words; pre-computed viability, no drag-and-drop |
| `index.html` | — | Redirects to `landing.html` |
| `mission-mode.html` | Students | Prefix/suffix drag game with fuel bar, start screen login |
| `meaning-mode.html` | Students | Match morphemes to their meanings, fuel bar |
| `breakdown-mode.html` | Students | Type prefix/base/suffix of a given word under time pressure |
| `phoneme-mode.html` | Students | Split words into phonemes (Starter/Level Up/Challenge) |
| `syllable-mode.html` | Students | Chop words into syllables |
| `sound-sorter.html` | Students | Choose correct grapheme for a sound |
| `speed-mode.html` | Students | Build words against the clock |
| `flashcard-mode.html` | Students | Flip through morpheme meaning flashcards |
| `root-lab.html` | Students | Explore word roots and etymology |
| `word-refinery.html` | Students | Arrange words along a cline from Tier 1 everyday to Tier 3 specialist |
| `scientist.html` | Students | Dress their scientist character, view badges, spend quarks in shop |
| `dashboard.html` | Teachers | Heatmaps per student/activity, intervention flags, reward system |
| `class-setup.html` | Teachers | Create classes, add/remove students, manage codes |
| `item-creator.html` | Teachers | Draw or AI-generate custom shop items (lab coats, hats, etc.) |
| `account.html` | Teachers | Account settings — plan status, change password, school name, subscription management, delete account |
| `teacher-login.html` | Teachers | Email/password login + create account (with school name), forgot-password flow |
| `teacher-signup.html` | Teachers | Email/password signup, creates school + teacher records |
| `about.html` | Everyone | Research base, syllabus alignment, activities overview, references |

---

## 4. Shared JavaScript Modules

| File | Purpose |
|---|---|
| `wordlab-data.js` | IIFE — Supabase client, session login/logout, `recordAttempt`, class CRUD, character/badge logic, CSV export |
| `wordlab-scientist.js` | SVG scientist character builder (`WLScientist.buildSVG(options, mood)`) |
| `wordlab-effects.js` | Visual particle effects for the scientist (aura, galaxy, electric, etc.) |
| `wordlab-audio.js` | Sound effects |
| `wordlab-extension-data.js` | Extended content for extension mode students |
| `wordlab-teacher.js` | Teacher Mode for game pages — no XP, no timer, word count picker, rich feedback, Next button |
| `wordlab-help.js` | First-visit instruction popup + floating ? help button on all game pages |
| `wordlab-hints.js` | "Need Advice" scientist hints + support mode toggle + speech bubble UI |
| `data.js` | Static morpheme/word content data |

---

## 5. Database Schema (Supabase)

```sql
classes (
  id uuid PK,
  name text,
  class_code text UNIQUE,
  teacher_password text,       -- ⚠️ plain text, no real auth yet
  settings jsonb,
  created_at timestamptz
)

students (
  id uuid PK,
  class_id uuid FK→classes,
  name text,
  student_code text UNIQUE,   -- 4-char code students use to log in
  extension_mode boolean
)

student_progress (
  id uuid PK,
  student_id uuid FK→students,
  activity text,               -- see activity keys below
  category text,               -- see category formats below
  correct integer,
  total integer,
  total_time bigint,
  is_extension boolean,
  updated_at timestamptz,
  UNIQUE(student_id, activity, category)
)

student_character (
  student_id uuid PK FK→students,
  quarks integer,              -- in-game currency
  xp integer,
  badges jsonb,                -- array of badge IDs earned
  scientist jsonb,             -- outfit/accessory choices
  stats jsonb                  -- sessions, totalAnswered, bestStreak etc.
)

shop_items (
  id uuid PK,
  name text,
  item_type text,              -- coat | head | face | background
  image_data text,             -- ⚠️ base64 PNG stored in DB (should move to Storage)
  rarity text,                 -- common | rare | epic | legendary
  unlock_method text,
  quark_cost integer,
  is_active boolean,
  available_from date,
  available_until date,
  milestone_type text,
  milestone_threshold integer,
  secret_code text,
  limited_days integer,
  release_date timestamptz,
  created_at timestamptz
)
```

schools (
  id uuid PK,
  name text,
  plan text,                   -- 'trial' | 'active' | 'expired' | 'payment_failed' | 'teacher'
  trial_ends_at timestamptz,
  stripe_customer_id text,
  student_limit integer,
  created_at timestamptz
)

teachers (
  id uuid PK,
  auth_user_id uuid,           -- FK to Supabase auth.users
  school_id uuid FK→schools,
  email text,
  plan text,
  created_at timestamptz
)

class_word_lists (
  id uuid PK,
  class_id uuid FK→classes,
  name text,
  words jsonb,                 -- array of word objects with breakdown data
  games jsonb DEFAULT '["breakdown"]',  -- which games: breakdown, syllable, phoneme
  created_at timestamptz,
  updated_at timestamptz
)

word_list_assignments (
  id uuid PK,
  word_list_id uuid FK→class_word_lists ON DELETE CASCADE,
  student_id uuid FK→students ON DELETE CASCADE,
  assigned_at timestamptz,
  UNIQUE(word_list_id, student_id)
)

-- Note: school_id has been added to classes and shop_items tables

---

## 6. Activity Keys & Category Formats

These must match exactly between `recordAttempt()` calls and dashboard COLUMNS:

| Activity key | Category format | Example |
|---|---|---|
| `phoneme-splitter` | Level name | `"Starter"` / `"Level up"` / `"Challenge"` |
| `syllable-splitter` | Syllable count | `"2 syllables"` / `"3 syllables"` / `"4+ syllables"` |
| `breakdown-blitz` | The word itself | `"unhappiness"` |
| `mission-mode` | `type:id` | `"prefix:re"` / `"suffix:ing"` |
| `meaning-mode` | `type:id` | `"prefix:re"` / `"suffix:ing"` |
| `sound-sorter` | Sound/grapheme | varies |

---

## 7. Current Auth Situation (Important)

**Students:** Log in by selecting their class code then their name. Session stored in
`sessionStorage` as `wordlab_session_v1`. No password.

**Teachers:** Two separate hardcoded password gates:
- `class-setup.html` — checks `val === 'MorphemeLab'` in JS
- `item-creator.html` — same check
- `dashboard.html` — uses `verifyPassword(classId, pw)` which reads `teacher_password` from the
  `classes` table (plain text comparison)

**This is the #1 thing to fix before selling to schools.**

---

## 8. Known Technical Debt

1. **Anon key is public** in HTML source — students with DevTools can read/write any row
2. **No school isolation** — all classes/students visible to anyone with the anon key
3. **`image_data` stored as base64 in DB** — will bloat the database and slow shop loads as more items are created; needs to move to Supabase Storage
4. **`recordAttempt` has a race condition** — does SELECT then UPSERT; two fast answers can lose one quark/XP increment
5. **Hardcoded passwords in HTML source** — `MorphemeLab` visible to anyone
6. **No deployment pipeline** — no Vercel/Netlify, no custom domain, runs in Codespaces
7. **No error boundary** — if Supabase is down, pages fail silently
8. **`teacher_password` stored plain text** in `classes` table

---

## 9. Content Reference

### Prefixes (35)
`ad, anti, con, contra, de, dis, en, em, ex, e, extra, fore, hyper, in, inter, mal, mega, micro,
mid, mis, multi, non, ob, over, post, pre, pro, re, semi, sub, super, trans, un, under, a`

### Suffixes (22)
`er, or, ing, ed, ly, ful, less, ness, ment, ion, able, ish, ist, ive, ous, al, hood, ship, ity,
ance, ent, ic`

### Breakdown Blitz words (42)
`unhappiness, careless, replaying, disagreement, teacher, preview, rebuild, movement, helpful,
powerless, return, transport, submarine, nonfiction, running, significant, happiness, unhelpful,
rewrite, preheat, forecast, foresee, multitask, hyperactive, malfunction, semicircle, semifinal,
microphone, megaphone, midpoint, midnight, extraordinary, enable, encourage, empower, construct,
atypical, progress, export, observe, contradict, proactive`

---

## 10. Coding Conventions

- **No build system** — pure HTML/CSS/JS, no npm, no bundler, no TypeScript on the frontend
- **No frameworks** — vanilla JS only
- **Supabase CDN** loaded via `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">`
- **`wordlab-data.js` loaded BEFORE inline game scripts** on every page
- **Font:** Lexend from Google Fonts, weights 300–900
- **Colour palette:**
  - Indigo: `#4338ca` / `#6366f1` / soft `#eef2ff`
  - Teal: `#0d9488`
  - Amber: `#d97706`
  - Green: `#16a34a`
  - Bad/error: `#dc2626`
- **SVG scientist** uses `viewBox="0 0 80 120"` — all item overlays must use this viewBox
- When modifying `wordlab-data.js`, always check that `recordAttempt` category strings still match dashboard COLUMNS keys
- Edge functions live in `supabase/functions/` and are deployed with `supabase functions deploy <name>`

---

## 11. THE ROADMAP

This is the master checklist. Work through phases in order. Do not skip ahead.
Check items off as they are completed.

---

### PHASE 0 — Foundation (Do before any other phase)

#### 0.1 Vercel Deployment
- [x] Create `vercel.json` at repo root — cleanUrls, root redirect to /landing, security headers
- [x] Create `.gitignore` — excludes node_modules, screenshots, package-lock.json
- [x] Nicholas: go to vercel.com → "Add New Project" → import `NickD135/morphology-builder`
- [x] Vercel settings: Framework = Other, Build Command = (leave blank), Output = (leave blank)
- [x] Click Deploy — live at https://morphology-builder.vercel.app
- [x] Confirm auto-deploy on push to `main` works ✅
- [ ] Test all pages load on Vercel URL (especially check wordlab-data.js loads correctly)

#### 0.2 Custom Domain
- [x] Purchased `wordlabs.app` via Cloudflare Registrar
- [x] Added A record and CNAME in Cloudflare DNS (proxy off — grey cloud)
- [x] Added domain in Vercel: Project Settings → Domains
- [x] DNS propagated and verified ✅
- [x] Updated `site_url` in Supabase → Auth → URL Configuration → https://wordlabs.app
- [x] Supabase project transferred to personal account (away from school Google account)

#### 0.3 Environment variable strategy
- [ ] NOTE: Supabase ANON key is intentionally public (it's designed for client-side use)
      Security comes from RLS policies, not hiding the key. This is fine for now.
- [ ] Revisit this once Phase 1 (teacher auth) is complete — at that point we may want
      a thin server layer to keep teacher-specific operations off the client

---

### PHASE 1 — Teacher Authentication

This replaces the hardcoded `MorphemeLab` password with real Supabase Auth accounts.

#### 1.1 Database prep
- [x] Add `auth_user_id uuid` column to `classes` table (will link to Supabase auth.users)
- [x] Run migration in Supabase SQL editor
- [x] Create `teachers` table with plan/trial fields and RLS policies

#### 1.2 Teacher sign-up page (`teacher-signup.html`)
- [x] Create new page with email + password fields
- [x] Call `supabase.auth.signUp({ email, password })`
- [x] Redirect to `class-setup` on success; show "check your email" if confirmation required
- [x] Add email confirmation handling

#### 1.3 Teacher login page (`teacher-login.html`)
- [x] Create login page with email + password
- [x] Call `supabase.auth.signInWithPassword({ email, password })`
- [x] On success, redirect back to intended page (via ?returnTo= param)
- [x] Handle "forgot password" — call `supabase.auth.resetPasswordForEmail(email)`

#### 1.4 Auth session management in `wordlab-data.js`
- [x] Add `getTeacherSession()` — returns current Supabase auth session user
- [x] Add `requireTeacherAuth()` — redirects to `teacher-login` if no session
- [x] Add `teacherSignOut()` — calls `supabase.auth.signOut()` + redirects

#### 1.5 Protect teacher pages
- [x] `class-setup.html` — replaced hardcoded password gate with `requireTeacherAuth()`
- [x] `dashboard.html` — replaced password-per-class with `requireTeacherAuth()`
- [x] `item-creator.html` — replaced hardcoded password gate with `requireTeacherAuth()`
- [x] Removed all `const TEACHER_PASSWORD = 'MorphemeLab'` references

#### 1.6 Link classes to teachers
- [x] `createClass()` now attaches `auth_user_id` from current session
- [x] `getClasses()` filters by `auth_user_id` so teachers only see their own classes
- [x] Existing class linked via SQL UPDATE

#### 1.7 Update RLS policies
- [x] `classes` — SELECT open (students need it); INSERT/UPDATE/DELETE require auth.uid() = auth_user_id
- [x] `students` — SELECT open (anon login), INSERT/UPDATE/DELETE scoped to teacher's school
- [x] `student_progress` — SELECT open, writes via RPC only, DELETE scoped to teacher's school
- [x] `student_character` — SELECT/INSERT/UPDATE open (anon students), DELETE scoped to teacher's school
- [x] `shop_items` — SELECT open, INSERT/UPDATE/DELETE scoped to teacher's school
- [x] Test RLS by logging in as two different teacher accounts and confirming isolation
- [x] Tightened RLS on `class_word_lists`, `class_spelling_sets`, `spelling_set_assignments`, `spelling_check_in_results` — school-scoped via `get_my_school_id()` chain

#### 1.8 Navigation updates
- [x] Sign Out button added to `dashboard.html` and `class-setup.html` headers
- [x] Teacher email displayed in headers
- [x] Update `landing.html` — show "Teacher Login" link in header
- [x] Removed old password gate overlay HTML from all three teacher pages

---

### PHASE 2 — Multi-Tenancy (School Isolation)

#### 2.1 New `schools` table
- [x] Create `schools` table: `{ id, name, plan, trial_ends_at, stripe_customer_id, created_at }`
- [x] `teachers` table updated with `school_id FK→schools`
- [x] Signup flow creates school + teacher record automatically

#### 2.2 Add `school_id` to all data tables
- [x] Add `school_id uuid FK→schools` to `classes`
- [x] Add `school_id uuid FK→schools` to `shop_items`
- [x] Migration SQL run — existing rows linked to school

#### 2.3 Update all queries to scope by school
- [x] `getClasses()` — filters by `school_id` (via teacher record cache)
- [x] `createClass()` — includes `school_id` on insert
- [ ] `shop_items` queries — filter by `school_id` (Phase 6 — when shop is expanded)
- [x] Dashboard queries — students scoped via class→school chain (RLS handles this at DB level)

#### 2.4 Update RLS policies for school isolation
- [x] `classes` INSERT/UPDATE/DELETE — scoped to teacher's school_id
- [x] `schools` — teachers can only read/update their own school
- [x] `students`, `student_progress`, `student_character` — already scoped in `rls_student_tables.sql`

#### 2.5 School admin role
- [ ] Multi-teacher schools (Phase 8 — not needed until selling to larger schools)

---

### PHASE 3 — Subscription & Payments (Stripe)

#### 3.1 Stripe setup
- [x] Create Stripe account (sandbox mode)
- [x] Created product `Word Labs — School Annual` — AUD $299/year
- [x] Price ID: `price_1TDhljPlhyP7eUplp5zTRIEj`
- [x] ABN registered, business name "Word Labs Education" registered with ASIC
- [x] Stripe account activated for live payments
- [x] Live price IDs configured: School (`price_1TE0xlBMsuz4ocNGz0tNktiE`), Teacher (`price_1TE0xpBMsuz4ocNGywDADyqi`), Student Pack (`price_1TE0xpBMsuz4ocNGan0ITQVh`)
- [x] Live secret key, webhook secret, and student pack price ID set in Supabase secrets
- [x] Promo codes enabled at checkout (`allow_promotion_codes: true`)

#### 3.2 New Supabase Edge Function: `create-checkout`
- [x] Created `supabase/functions/create-checkout/index.ts`
- [x] Verifies teacher auth, creates/reuses Stripe customer, returns checkout URL
- [x] Deployed with `--no-verify-jwt` (function handles auth internally)

#### 3.3 New Supabase Edge Function: `stripe-webhook`
- [x] Created `supabase/functions/stripe-webhook/index.ts`
- [x] Handles `checkout.session.completed` → sets `plan = 'active'`, saves `stripe_customer_id`
- [x] Handles `customer.subscription.deleted` → sets `plan = 'expired'`
- [x] Handles `invoice.payment_failed` → sets `plan = 'payment_failed'`
- [x] Webhook registered in Stripe dashboard, secret stored in Supabase

#### 3.4 Pricing page (`pricing.html`)
- [x] Created pricing page with trial vs paid plan comparison
- [x] "Upgrade Now" redirects to dashboard where checkout runs (auth guaranteed)
- [x] Trial/upgrade banner on dashboard with inline checkout button
- [x] School Annual plan changed to "Custom pricing" with quote request form (modal)
- [x] Student pack stepper removed from Teacher plan for cleaner UX
- [x] Quote form submissions create GitHub issues + send email via Resend

#### 3.5 Trial & plan gating
- [x] Trial countdown banner shown when < 7 days remaining
- [x] Expired banner shown when trial ends
- [x] Payment failed banner shown on failed invoice
- [ ] Enforce class/student limits during trial (Phase 4 — low priority for now)

#### 3.6 Purchase order / invoice support
- [x] "Pay by invoice" option — noted on pricing page FAQ, directs to nick@wordlabs.app

#### 3.7 Email notifications
- [x] Resend account set up, domain `wordlabs.app` verified
- [x] `send-feedback` edge function sends email to nick@wordlabs.app via Resend
- [x] Feedback form and school quote form both trigger email notifications
- [x] `feedback` table created in Supabase with RLS policies
- [ ] Set up Cloudflare Email Routing for incoming mail to nick@wordlabs.app

---

### PHASE 4 — Onboarding

#### 4.1 Teacher onboarding flow
- [x] After sign-up, redirect to `/onboarding.html` (not straight to dashboard)
- [x] Step 1: "What's your school called?" → creates school record
- [x] Step 2: "Create your first class" → inline class creation (name + class code)
- [x] Step 3: "Add your students" → either type names or upload CSV
- [x] Step 4: "Here's how students log in" → show class code + student codes, printable sheet
- [x] Step 5: "Try an activity yourself" → link to any game page
- [x] Progress indicator across all steps
- [x] Can skip any step and come back via dashboard
- [x] New teachers redirected to onboarding from login page (checks for zero classes)
- [x] Bulk student insert via `addStudentsBulk()` (1 query instead of N)

#### 4.2 CSV student import
- [x] Add "Import from CSV" button in `class-setup.html` (create tab + manage tab per-class)
- [x] Accept CSV with one column: student first names (or first + last)
- [x] Preview parsed names before importing (confirm dialog with name list)
- [x] Bulk insert via `addStudentsBulk()` → `students.insert(rows)`
- [x] Show success count + any errors

#### 4.3 Printable login card
- [x] Generate a printable HTML sheet showing:
  - School/class name
  - URL to the site
  - Each student's name + their unique student code
- [x] "Print login cards" button in `class-setup.html` (upgraded from table to card grid)
- [x] Formatted for A4, 3 columns per page with `@page` CSS

---

### PHASE 5 — Legal & Compliance (Australian context)

#### 5.1 Privacy policy
- [x] Create `privacy.html`
- [x] Must comply with Australian Privacy Act 1988 and the 13 Australian Privacy Principles (APPs)
- [x] Covers: what data is collected (student first names, in-game progress only), why, how long kept, right to access/correct/delete
- [x] Specifically addresses children's data (ages 9–12) — school is the data controller, Word Labs is the processor
- [x] Notifiable Data Breaches scheme — state how breaches will be reported (within 30 days to OAIC)
- [x] Contact email for privacy requests
- [x] Link in footer of key pages (landing, pricing, signup, login)

#### 5.2 Terms of service
- [x] Create `terms.html`
- [x] Covers: what the service is, acceptable use, subscription terms, cancellation policy (Australian Consumer Law — 30 day refund right)
- [x] Governed by laws of Queensland
- [x] Link in footer and on sign-up page

#### 5.3 Cookie / storage notice
- [x] List all storage used (sessionStorage, localStorage, Supabase session cookies) — in privacy.html Section 12
- [x] No third-party tracking cookies — noted clearly in privacy policy
- [x] Add small banner on first visit (localStorage flag so it only shows once) — on landing.html

#### 5.4 Data Handling Agreement (equivalent to DPA)
- [x] Create `data-agreement.html` — printable/PDF-ready school data agreement
- [x] Schools' IT/privacy officers will ask for this before approving purchase
- [x] Covers: what data is held, where it's stored (Australia — Supabase Sydney region), retention & deletion policy, sub-processors (Supabase AU, Anthropic API for AI Polish feature only)
- [x] Link on pricing page FAQ — "view and print our School Data Handling Agreement"

#### 5.5 Australian Privacy compliance checks
- [x] Store data in Australia (Supabase Sydney region `ap-southeast-2`) — critical for government schools
- [x] Confirm only student first names stored — no surnames, no DOB, no email, no photos
- [x] Add data deletion: teacher deletes class → all student data deleted (cascade already in DB schema)
- [x] Add "export class data" CSV function — Export CSV button on dashboard
- [x] ABN registered as sole trader "Word Labs Education"
- [x] Purchase order support — noted on pricing page FAQ, directs to nick@wordlabs.app

---

### PHASE 6 — Infrastructure Hardening

#### 6.1 Move shop item images to Supabase Storage
- [x] Create a `shop-items` storage bucket in Supabase (public read)
- [x] Update `publishItem()` in `item-creator.html` — upload canvas PNG to Storage, store URL instead of base64
- [x] Update all `shop_items` queries — use `image_url` with `image_data` fallback
- [x] Add `image_url` column to `shop_items` table
- [ ] ~~Write migration to move existing base64 items to Storage~~ (not needed — fallback handles it)

#### 6.2 Fix the `recordAttempt` race condition
- [x] Rewrite to use a single atomic upsert with SQL arithmetic: `correct = correct + 1`
- [x] Use Postgres RPC function (`supabase.rpc('increment_progress', {...})`) so the increment is atomic
- [x] Test with rapid-fire correct answers — confirm no count loss (test script: `tests/test-rapid-fire-record-attempt.js`)

#### 6.3 Error handling
- [x] Add offline detection — show "No internet connection" banner if fetch fails
- [ ] Wrap all Supabase calls in consistent try/catch with user-visible fallback (stretch goal)
- [ ] Add retry logic for transient failures (stretch goal)

#### 6.4 Performance
- [x] Dashboard already has loading states
- [x] `wordlab-effects.js` already only loaded on scientist.html
- [x] `wordlab-scientist.js` needed on all game pages (no change needed)

---

### PHASE 7 — Product Improvements (do alongside sales)

#### 7.1 Teacher dashboard upgrades
- [x] Add "Last active" column showing when each student last played
- [x] Add per-student "activity breakdown" modal — click a student to see all their scores
- [x] Add class-level summary: average accuracy, most-played activity, most-missed morpheme
- [x] Export to CSV for parents evening / reports

#### 7.2 Content expansion
- [x] Add more words to Breakdown Blitz (63 → 122 words)
- [x] Added Homophone Hunter (24 standard + 12 extension homophone groups)
- [x] Added Word Spectrum (synonyms, antonyms, shades of meaning)
- [x] All prefixes/suffixes from data.js already in Mission and Meaning modes (44 suffixes, 35 prefixes)
- [x] Add difficulty levels to Speed Builder (easy/medium/hard timer presets) and Mission Mode (adjustable fuel drain, penalties, options)
- [x] Teacher ability to add custom word lists per class (Word Lists tab in dashboard, auto-loads in games)
- [x] Custom word lists expanded to work across Breakdown Blitz, Syllable Splitter, and Phoneme Splitter
- [x] AI-powered word analysis: teacher types words, AI generates clues, morpheme breakdowns, syllable splits, phoneme splits
- [x] Student assignment: word lists can be assigned to specific students for differentiation
- [x] Edge function `analyze-words` uses Claude API to analyze up to 30 words at once

#### 7.3 Student experience
- [x] "Daily goal" system — replaced with daily challenges system in status strip
- [x] Class XP leaderboard on landing page (top 5 in class, highlights current student)
- [x] Notification when a badge is newly earned (popup/animation) — already in WLScientist.react
- [x] Home screen shows "Welcome back, [name]!" with quarks, level, badges, challenges
- [x] Daily challenges: 3 per day (easy/medium/hard) + weekly challenge, randomised per student
- [x] Daily play streak tracking (10+ min/day) with animated flame badge
- [x] Streak flame grows/intensifies over 30 days, resets on break
- [x] Badge pins on scientist lab coat (up to 3 earned badges)
- [x] 22 purchasable dance moves across 6 streak tiers (correct → 30+ streak)
- [x] Dance moves play on both header widget and large game stage scientist

#### 7.4 Mobile polish
- [x] Full audit of all game pages on mobile (320px–480px)
- [x] Added 480px breakpoints to all 8 game pages (grids collapse, touch targets 44px+)
- [x] Ensure scientist page shop renders cleanly on small screens (grid minmax reduced)
- [x] Mission Mode uses click/tap buttons (not drag-and-drop) — works natively on touch devices
- [x] Breakdown Blitz mobile: smart Enter key progression (prefix→base→suffix1→suffix2→check), scrollIntoView for virtual keyboard

---

### PHASE 7.5 — Session 2026-03-24 Work

#### Dynamic URLs
- [x] All hardcoded `wordlabs.app` URLs replaced with `window.location.origin` / `window.location.host`
- [x] QR codes, login cards, printed sheets all use current domain
- [x] Stripe checkout success/cancel URLs use current domain
- [x] App works on GitHub Pages (`nickd135.github.io/morphology-builder/`)

#### Trial banner & auth fixes
- [x] `getTeacherRecord()` now auto-creates school + teacher records if missing
- [x] Trial banner shows on dashboard for trial accounts
- [x] RLS policies added for schools (INSERT, SELECT with just-created workaround)

#### Account settings (`account.html`)
- [x] Email, school name (editable), plan status with badge
- [x] Subscription renewal countdown (fetched from Stripe via `get-subscription` edge function)
- [x] Change password
- [x] Manage Subscription button → Stripe Customer Portal (`create-portal-session` edge function)
- [x] Delete account (double confirmation)

#### Dashboard improvements
- [x] Compact nav tabs — all fit without scrolling
- [x] Word Lists moved from tab bar to standalone button
- [x] Send XP added to existing reward modal (alongside quarks, effects, badges, items)
- [x] Pricing/upgrade links hidden for active subscribers on landing page
- [x] Account link added to dashboard and class-setup nav

#### Custom word lists expansion
- [x] Shared `getCustomWords(gameName)` loader in `wordlab-data.js`
- [x] Works across Breakdown Blitz, Syllable Splitter, Phoneme Splitter
- [x] Student assignment via `word_list_assignments` table
- [x] AI-powered word analysis via `analyze-words` edge function (Claude API)
- [x] Teacher types words → AI generates clues, morphemes, syllables, phonemes
- [x] Preview table before saving
- [x] Phonemes use actual graphemes (letters) from the word, not sound representations
- [x] AI auto-corrects misspelled words
- [x] Expanded to Sound Sorter, Mission Mode, Meaning Mode (custom lists now work in all 6 games)
- [x] Phoneme/syllable integration working end-to-end with student accounts

---

### PHASE 7.6 — Session 2026-03-24 (continued)

#### New activity: The Refinery (`word-refinery.html`)
- [x] Cline-based vocabulary game — arrange words from Tier 1 (everyday) → Tier 3 (specialist)
- [x] Two modes: Fill the Gap (supported) and Full Cline (independent/harder)
- [x] 30 base clines, 8 extension clines, 5 order-only clines
- [x] Draggable words with HTML5 drag-and-drop + touch support, tap-to-select fallback
- [x] Larger slot targets (48px track, pill-shaped drop zones)
- [x] XP/quarks via `recordAttempt('word-refinery', 'cline:category', ...)`, scientist reactions, audio
- [x] Extension mode: harder clines auto-loaded for extension students
- [x] Integrated: landing page card, dashboard heatmap tab, student profile, flags

#### Custom word list priority
- [x] New `priority` column on `class_word_lists` (DB migration: `add_word_list_priority.sql`)
- [x] Three modes: Mixed (shuffle with built-in), Custom first (list words then built-in), Custom only (replace built-in)
- [x] Priority selector on create form + colour-coded button on each list card to change
- [x] All three games (Breakdown, Syllable, Phoneme) respect priority setting

#### Dashboard improvements
- [x] Removed "Total Attempts" from summary row, student profile, and class summary
- [x] Moved accuracy & intervention flags from Summary tab into each individual activity tab
- [x] Added "Activity Data" header label above each heatmap table
- [x] Added Root Lab, Homophones, Word Spectrum to extension student profile
- [x] Compact student count + donut crown as small inline pills (right-aligned)
- [x] "← Classes" renamed to "← Switch Class"

#### Class setup improvements
- [x] Auto-generate 6-char alphanumeric class codes (no I/O/0/1 to avoid confusion)
- [x] Removed class code input field from class-setup and onboarding
- [x] Students expanded by default in Manage tab
- [x] Auto-switch to Create tab when no classes exist
- [x] Added `.hidden` CSS class (was missing, both tabs showed at once)
- [x] Class code shown in card metadata

#### Teacher auth & signup
- [x] School name field added to teacher-login.html Create Account form
- [x] New signups reverted to `plan: 'trial'` with 30-day window (was temporarily `active` for PL demo)

#### Fixes
- [x] Shop item publish: always include base64 `image_data` (fixes NOT NULL constraint)
- [x] Active Today pill: improved error handling, always updates display
- [x] Teacher guide: Extension Mode emoji 🧬→🔬, rewritten description

#### Pet system (built but hidden)
- [x] 9 SVG pets (cat, ginger cat, puppy, bird, frog, owl, dragon, horse, hamster)
- [x] Pet tank "glass terrarium" display, reactions (jump/shake/dance)
- [x] Shop section, equip/unequip, `pet` field in scientist data
- [x] **Currently hidden from all UI** — code preserved for future reactivation
- [ ] TODO: Redesign pets for better visual quality before re-enabling

#### About page (`about.html`)
- [x] Research base, three domains of spelling, NSW syllabus alignment, Australian Curriculum v9.0
- [x] Differentiation, HPGE, intervention documentation
- [x] Activities at a glance grid, references section
- [x] About link added to footers across 12+ pages

---

### PHASE 7.7 — Session 2026-03-26

#### Teaching slide decks (prefix/suffix)
- [x] Generated all 35 prefix + 22 suffix PPTX teaching decks via Claude API
- [x] Updated `generate-all-decks.js` with all morphemes and type-tagged filenames
- [x] Updated `teacher-resources.html` with all 254 decks (197 bases + 35 prefixes + 22 suffixes)

#### Daily challenges system
- [x] 3 daily challenges per student (easy/medium/hard) + weekly challenge
- [x] Randomised game types, seeded per student per day (deterministic)
- [x] Daily play streak tracking (10+ min/day to maintain streak)
- [x] Streak badges: 3-day, 7-day, 14-day, 30-day
- [x] Challenge toast notifications on all game pages
- [x] Compact challenges + animated streak flame in landing page status strip
- [x] Claim rewards with scientist animation

#### Scientist character upgrades
- [x] Badge pins: up to 3 earned badges pinnable on lab coat
- [x] Dynamic streak flame badge: grows/intensifies over 30 days, animated SVG
- [x] 22 purchasable dance moves across 6 tiers (correct, 3/5/10/15/30+ streaks)
- [x] Dances play on both header widget AND large game stage scientist
- [x] Fixed 3D rotation dances (Spin, Backflip) to use visible 2D transforms

#### Worksheet generators
- [x] Custom word list support added to 4 more generators (Phoneme, Syllable, Sound Sorter, Root Lab)
- [x] EALD translation support added to all 9 worksheet generators
- [x] Column widths rebalanced when translation column is present

#### Performance & data fixes
- [x] Morpheme Builder: pre-built valid word index replaces O(n^4) viability sweep
- [x] Dictionary: replaced 5,837-word auto-generated list with curated 20,220-word list
- [x] Sound Sorter: expanded from 233 to 349 words across all sounds
- [x] Extension Sound Sorter: expanded from 54 to 84 words with 30 French-origin words
- [x] Dashboard extension toggle: fixed missing `wordlab-extension-data.js` script tag
- [x] Dashboard base/extension data: `getClass()` now filters by `is_extension`
- [x] AI word analyzer (`analyze-words` edge function): improved error handling, redeployed
- [x] New signups reverted from `active` to 30-day `trial`
- [x] Leaderboard expanded from top 3 to top 5

---

### PHASE 7.8 — Session 2026-03-28

#### Game variety & engagement system
- [x] Variety bonus: bonus quarks/XP for playing different games each day (2nd game=+10q, 3rd=+15q, etc.)
- [x] "Try me!" nudges: green badges on game cards for games the student has never played
- [x] Variety explorer badges: Explorer (5 games/week), Adventurer (8), Grand Explorer (all 11)
- [x] Weekly game variety tracked in challenge data (`weekGames` array, resets each Monday)
- [x] Compact bonus pill strip on landing page (replaces full-width banners)
- [x] Bonus days: 2x XP & 1.5x quarks on weekends (Sat/Sun) and Wednesdays
- [x] Bonus day banner pill + toast notification on first correct answer

#### Featured Game system (unified)
- [x] Replaced separate "Game of the Week" (calendar rotation) and "Teacher Focus" (+50%) with one system
- [x] Auto mode: picks game each student has played least or has lowest accuracy in (personalised)
- [x] Teacher override: Focus Game selector on dashboard overrides auto-pick for the whole class
- [x] Both give 2x quarks & XP, same gold pulsing glow + "2x" badge on card
- [x] `getFeaturedGame()` / `loadFeaturedGame()` in wordlab-data.js (cached in localStorage, 5-min TTL)
- [x] Auto-pick queries `student_progress` table, scores by: never played > lowest accuracy > least played
- [x] Teacher focus stored in `classes.settings.focusGame` via `saveClassSettings()`
- [x] Gold pill in bonus strip shows "⭐ 2x [Game]" (auto) or "🎯 2x [Game] (teacher pick)"

#### Item creator improvements
- [x] Removed highlight zone overlay (dashed rectangle barrier) for all item types
- [x] True eraser: uses `destination-out` compositing instead of white paint
- [x] Eraser strokes preserved in undo/redo history (`globalCompositeOperation` serialized)
- [x] Brush size/colour preview dot next to size slider (updates in real-time)
- [x] Text tool preview: shows sample text in current font size and colour before clicking
- [x] Text tool edit fix: clicking existing text enters edit mode instead of creating duplicate

#### Landing page changes
- [x] Root Lab moved from Explore doorway cards to Play game grid
- [x] Spelling Test card removed — only appears via full-screen takeover when teacher starts check-in

#### Speed Builder end-of-round overlay
- [x] Full-screen overlay with score, word count, longest word
- [x] Contextual icon/title based on performance (🔬/⚡/⭐/🏆)
- [x] "Play Again" and "Home" buttons
- [x] Animated card pop-in with blurred backdrop

#### Low-stim mode
- [x] Per-class toggle on teacher dashboard (stored in `classes.settings.lowStimMode`)
- [x] Suppresses: sounds, particle effects, scientist reactions/dances, confetti, streak flames
- [x] Hides: bonus pills, leaderboard, daily challenges, quark/streak counters, try-me badges
- [x] Central guards in `wordlab-audio.js`, `wordlab-effects.js`, `wordlab-scientist.js`
- [x] Global CSS injected from `wordlab-data.js` via `body.low-stim` class
- [x] Setting loaded from DB on login + refreshed on landing page load
- [x] Game mechanics and progress tracking continue normally (data still recorded)

---

### PHASE 7.9 — Session 2026-03-28 (continued)

#### Low-stim mode (extended)
- [x] Dances and Effects tabs hidden on scientist page in low-stim mode
- [x] Particle Effect section hidden on My Scientist customisation panel
- [x] Pricing/upgrade links hidden for students on active school plans

#### Dashboard visual refactor
- [x] Slim dark topbar with class name, email, labelled icon buttons (Setup, Account, Home, Export, Sign Out)
- [x] Horizontal stats bar: class accuracy, most played, most missed, active today, students
- [x] Compact settings strip: Focus Game selector, Low-stim toggle, Base/Extension toggle, Word Lists button
- [x] Game subtabs restyled as pills (larger, 12px font, wrap naturally)
- [x] Summary table: Extension/Reward/Last Active collapsed into sticky name cell
- [x] Lighter blue header row across summary table columns
- [x] Full navy dark theme matching landing page
- [x] Spelling set tabs as pill buttons with word count badges
- [x] Spelling set student assignment: clickable name pills (replaces checkboxes)
- [x] Spelling set action buttons: plain white text links
- [x] Heatmap cells tightened (42x22px)
- [x] All modals, inputs, panels updated for dark backgrounds

#### Data & performance fixes
- [x] Batched student_progress queries (5 students per batch, 50k limit) — fixes data loss for large classes
- [x] Morpheme Builder: in-place bank tile patching via `patchBanks()` — eliminates innerHTML rebuild lag
- [x] Morpheme Builder: deferred viability computation via requestAnimationFrame
- [x] Total XP shown under XP bar on My Scientist page
- [x] Fixed corrupted `<meta charset>` tag in word-refinery.html

#### Documentation updates
- [x] Privacy policy: fixed 3-char code, added Google Cloud TTS + Resend as sub-processors
- [x] Data handling agreement: fixed ABN, 3-char codes, added Google Cloud + Resend sub-processors
- [x] FAQ: complete rewrite (Getting Started, Features, Pricing, Students sections)
- [x] Pricing: updated to 13 activities, added all missing feature highlights
- [x] Terms: updated service description with current feature set
- [x] Teacher guide: added Low-stim, EALD, Spelling Sets sections; fixed custom word list scope (6 games)
- [x] About page: added Teacher Resources section (254 slide decks, 9 worksheet generators, EALD translations)
- [x] About page: added Low-stim mode description under Differentiation
- [x] About page: corrected 3-day slide deck breakdown (dictation + morpheme/syllable/phoneme splits)

---

### PHASE 7.10 — Session 2026-03-28 (evening)

#### Teacher Mode for game pages
- [x] New `wordlab-teacher.js` shared module
- [x] Activates when teacher opens games from teacher landing (NOT "View as Student")
- [x] No XP/quarks awarded (recordAttempt skipped)
- [x] No timers (fuel drain and countdowns disabled)
- [x] Word count picker at start (5/10/15/20/30/All)
- [x] No auto-advance — teacher clicks Next to proceed (for class discussion)
- [x] Rich feedback explaining why answers are right or wrong on every game
- [x] Scientist reactions preserved for visual engagement
- [x] Gamified UI hidden (score, streak, fuel bar, bonus pills)
- [x] Phoneme Splitter: green overlay shows correct split positions on wrong answers
- [x] Syllable Splitter: green labels above correct syllable groups on wrong answers
- [x] Speed Builder: untimed exploration with End Round button

#### Teacher landing page updates
- [x] All 13 activity cards added to teacher landing (was only 3 classroom tools)
- [x] Heading: "Activities to Use With Your Class"
- [x] Custom activity card ordering matching teacher preference
- [x] Root Lab description: "Identify morphemes, then unlock the meaning"
- [x] Mission Mode description: "Match morphemes to the rest of their word"

#### Audio improvements
- [x] All TTS now uses Google Cloud Australian voice (en-AU-Neural2-A) first
- [x] Browser TTS fallback picks best Australian voice available
- [x] Spelling test upgraded to cloud TTS for clearer dictation

#### Content expansion
- [x] Sound Sorter: 344 → 1,662 words across all 33 sounds (~20 per level per sound)
- [x] Root Lab Challenge tier: 8 → 20 words (Latin/Greek roots)
- [x] Worksheet generators synced with expanded word pools
- [x] Split digraph display fix (a_e, i_e etc. show correctly in Sound Sorter)

#### Instruction popups + help system
- [x] New `wordlab-help.js` shared module
- [x] Automatic instruction popup on first visit to each game (localStorage tracked)
- [x] Floating ? help button always visible during gameplay
- [x] 4-step instruction cards per game with custom content
- [x] "Listen to instructions" TTS button for accessibility

#### Support Mode (differentiation & scaffolding)
- [x] New `support_mode` column on students table (migration SQL)
- [x] `isSupportMode()` / `setSupportMode()` / `loadSupportMode()` in wordlab-data.js
- [x] Teacher per-student SUP toggle on dashboard (like EXT badge)
- [x] Teacher-set support can't be disabled by students
- [x] Student self-serve toggle on game pages (sessionStorage, resets on logout)
- [x] Fuel drain rate × 0.5 (half speed) in support mode
- [x] Correct answer refill × 1.5, wrong penalty × 0.5
- [x] Speed Builder: +50% time per round
- [x] Multi-choice games: 2 options instead of 3-4
- [x] Visual scaffolds: phoneme/syllable count badges, colour-coded tiles, part count hints
- [x] New `wordlab-hints.js` shared module
- [x] "Need Advice" button below scientist character
- [x] First click: general strategy hint in speech bubble
- [x] Second click: specific clue about current question
- [x] TTS option on each hint (speaker icon)
- [x] Hint counter resets per question

#### Word of the Week
- [x] Curated list of 52 morphology-rich words in wordlab-data.js
- [x] Auto-rotates weekly (one per week, cycling yearly)
- [x] Showcase card in student Explore section (doorway-card style)
- [x] Colour-coded morpheme pills + syllable breakdown
- [x] Feeds into Breakdown Blitz, Syllable Splitter, Phoneme Splitter as priority word

#### PPT viewer for Teacher Resources
- [x] Client-side PPTX viewer using JSZip (no external services)
- [x] View button on each slide deck card
- [x] Extracts text with formatting + images from PPTX
- [x] Arrow key navigation, Escape to close

#### Other fixes
- [x] Active Today counter: fixed UTC vs local timezone mismatch
- [x] New signups: plan changed to 'active' with 1-year window
- [x] Worksheet Generators tab moved beside Teaching Slides in Teacher Resources
- [x] Dashboard: Word Lists button renamed to "Custom Word Lists for Practise"

---

### PHASE 7.12 — Session 2026-03-31

#### Morpheme Builder content expansion
- [x] Added 7 new Greek combining-form prefixes: `tele-` (far), `peri-` (around), `gyro-` (circle), `endo-` (within), `horo-` (time), `stetho-` (chest), `kaleido-` (beautiful form)
- [x] Scope base expanded from 5 → 22 unique words: scope, telescope, microscope, periscope, horoscope, gyroscope, endoscope, stethoscope, kaleidoscope + plurals + derived forms (telescoped, telescoping, telescopic, microscopic)
- [x] `tele-` prefix generates 21 combos across multiple bases (telegraph, telegram, telephones, telescope, television, etc.)
- [x] `peri-` prefix generates periscope, perimeter combos
- [x] Total valid combos: 1,744 → 1,998 (+254 new words, ~15% increase)
- [x] 81 words added to dictionary.txt for new combos

#### Build script spelling rule fixes
- [x] Fixed CVC doubling incorrectly applying to Latin/Greek bound roots (phon→phonnes, duc→ducc, vis→viss)
- [x] Added `skipCVC` parameter to `applySuffix` for latin/greek group bases
- [x] Added CVC candidate fallback for multi-syllable words (tries both doubled and undoubled, keeps whichever is in dictionary) — fixes visit→visitted, market→marketted etc.
- [x] Added -le + -ly spelling rule (responsible + ly → responsibly, not responsiblely)
- [x] All three fixes applied to both `scripts/build-valid-combos.js` and `morpheme-builder.html`

#### Biggest base improvements
- `vis` (see): 2 → 32 words (vision, visible, invisible, advised, revised, supervised, television, etc.)
- `scope` (look): 5 → 22 words (all 9 scope instruments + derived forms)
- `duc` (lead): 1 → 15 words (educate, produce, reduce, conduct, induce, etc.)
- `behave`: 2 → 10 words
- `visit`: 3 → 10 words
- `phon` (sound): 2 → 8 words (phones, telephones, microphones, megaphones, etc.)
- `sec` (cut): 2 → 8 words (secure, security, etc.)

---

### PHASE 10 — NSW Spelling Diagnostic Integration

Integrating the NSW Department of Education Spelling Diagnostic Assessment (Sets 1–7)
into Word Labs as a structured spelling progression system.

#### 10.1 Spelling sets data
- [x] ~~Created `spelling-sets.js` with NSW DoE data~~ — removed (trademarked content)
- [x] Pivoted to teacher-input system — teachers create/import their own diagnostic sets

#### 10.2 Diagnostic dashboard tab
- [x] New "Spelling Sets" tab on teacher dashboard
- [x] Set sub-tabs: one per created set + "New Set" button
- [x] Heatmap per set: words as columns, students as rows (like Breakdown Blitz)
- [x] Multi-select student assignment with checkboxes (select all/none/save)
- [x] AI word analysis integration — "Generate Breakdowns" button on set creation
- [x] "Save without AI" option for quick plain-word sets
- [x] Edit words, rename set, delete set
- [x] "Run AI Analysis" button on existing plain-word sets
- [x] AI-analyzed badge vs words-only badge on each set
- [x] Historical assignments preserved (active/completed tracking)
- [x] Historical view UI — completed students shown at 0.6 opacity with "completed" badge + re-assign button; all check-in sessions viewable as tabs
- [x] Progress tracking across sets visible in student profile — check-in scores, pre→post change, cross-set timeline

#### 10.3 Activity word prioritisation
- [x] `getSpellingSetWords()` in wordlab-data.js loads assigned set words
- [x] `recordSpellingAttempt()` dual-tracks progress to game + spelling set heatmap
- [x] Words feed into: Breakdown Blitz, Phoneme Splitter, Syllable Splitter, Sound Sorter
- [x] Spelling set words prepended (highest priority) in each game
- [x] Feed into Meaning Mode and Mission Mode — morphemes extracted, matched, prioritised; results tracked per morpheme back to spelling set heatmap
- [x] Feed into Root Lab — words converted to Root Lab format with morpheme meanings; results tracked per word

#### 10.4 Spelling Check-In (audio dictation assessment)
- [x] New `spelling-test.html` — audio dictation spelling test
- [x] Google Cloud TTS for clear pronunciation (Australian English, falls back to browser TTS)
- [x] AI-generated hint/clue shown between listen button and input box
- [x] Instant feedback: correct (green) / wrong (red + correction shown)
- [x] Results summary with score and per-word breakdown
- [x] Progress tracked to spelling set heatmap on dashboard
- [x] Teacher triggers: "Start Check-In Now" / "Schedule" / "Stop Check-In"
- [x] Landing page takeover: full-screen modal when check-in is active
- [x] Activity card on landing page + navigation drawer
- [x] Pre/post test comparison view on dashboard — Compare tab shows first vs last check-in with ✗→✓ indicators and % change arrows
- [x] Automatic set progression — green banner when students score 80%+, one-click advance to next set
- [x] Focus words — wrong check-in words persist in student's practice games until teacher clears them; amber badge on dashboard with view/remove modal

#### 10.5 Per-activity extension toggle
- [x] Added `extension_activities` jsonb column on students table (alongside existing `extension_mode` boolean)
- [x] `isExtensionMode(activity)` checks per-activity when activity param provided; empty array = all (backward compatible)
- [x] All 13 game pages pass their activity key to `isExtensionMode()`
- [x] Dashboard EXT badge opens popover with global toggle + 13 per-activity toggles
- [x] `getStudentData()` and `getClass()` select `extension_activities` from database

#### 10.6 Assimilated prefixes
- [x] Updated `data.js` altForms: ad (+ag,an,ar), con (+col,cor,co)
- [x] Meaning Mode and Mission Mode show altForms in small text on prefix tiles

---

### PHASE 7.11 — Session 2026-03-29

#### Signup & onboarding fixes
- [x] Fixed new signups getting `trial` instead of `active` plan (teacher-login.html `ensureSchoolAndTeacher` was using wrong plan)
- [x] School name from signup metadata now used (was hardcoded to 'My School')
- [x] Email verification redirect now goes to `teacher-login.html?confirmed=1` with green success banner
- [x] Both signup paths (teacher-signup.html and teacher-login.html) pass `emailRedirectTo` and `school_name` metadata
- [x] wordlab-data.js auto-create fallback also reads school name from user metadata
- [x] Signup notification email sent to nick@wordlabs.app via send-feedback edge function (fire-and-forget)

#### Dashboard & class setup improvements
- [x] Summary table header: "Toggle EXT / SUP · Give rewards" label under Student column
- [x] Support mode toggle button added to class-setup.html (teal when active, beside Extension button)

#### Teacher resources
- [x] PPT viewer: fullscreen mode via Fullscreen API
- [x] PPT viewer: click left half = back, right half = forward (PowerPoint-style navigation)
- [x] Escape exits fullscreen first, then closes viewer

#### Landing page refresh (logged-out visitors)
- [x] Updated pitch cards: 13 activities, differentiation (ext/sup/low-stim), customisable worksheets, Australian compliance
- [x] All 13 activity cards in "Try the Activities" section
- [x] New "Find Out More" section: About, FAQ, Teacher Guide, Parent Privacy, Pricing, Data Agreement
- [x] Updated footer with full info links
- [x] CTA updated to "Get Started Free"

#### Site-wide consistency audit
- [x] Consistent headers across 8 info pages (brand + Home link)
- [x] FAQ side drawer replaced with simple header
- [x] Pricing page: replaced 30-day trial with free early access (12 months)
- [x] upgrade.html: replaced with redirect to pricing.html
- [x] Terms: updated trial language to early access, fixed malformed Privacy Policy link
- [x] Page titles standardised to en dash (–) separator across all pages
- [x] Fixed wrong titles: Mission Mode (was "Prefix Power-Up"), Morpheme Builder (was "Morphology Builder")
- [x] Worksheet titles standardised to "Word Labs – X Worksheet"
- [x] Footer fixes: parent-privacy, privacy, pricing, landing (student + teacher footers)
- [x] spelling-test.html: added skip-to-content link
- [x] Fixed 2 missing .html extensions on redirects (pricing → teacher-login, teacher-login → onboarding)
- [x] feedback.html header updated to new standard

#### FAQ & documentation updates
- [x] Added "What is Support Mode?" to FAQ
- [x] Added "How do I set up translations for a student?" to FAQ
- [x] Updated pricing FAQ to reflect free early access
- [x] Added Teacher Mode, Featured Game, Spelling Check-In to FAQ
- [x] Updated resource count to 254 decks
- [x] Support Mode section added to teacher guide (new section 7)
- [x] General support response time softened (no specific time commitment)

#### Support mode & extension mode fixes
- [x] meaning-mode.html: skip penalty now halved in support mode (was hardcoded)
- [x] breakdown-mode.html: skip penalty now halved in support mode (was hardcoded)
- [x] homophone-mode.html: Mode 3 fix modal now caps at 2 options in support mode
- [x] root-lab.html: extension mode now adds 10 harder academic words (was cosmetic badge only)
- [x] 10 extension root-lab words added to wordlab-extension-data.js (circumnavigation, pseudoscience, etc.)

#### Need Advice button & support toggle
- [x] Need Advice button: attaches under scientist when visible, floats fixed bottom-right on mobile
- [x] Support toggle: no longer reloads the page (updates CSS class live)
- [x] Both available to all users, not just support mode

#### Round-based word count system
- [x] Students choose 10/15/20/25/30 words per round (default 15)
- [x] Added to 7 games: phoneme, syllable, sound-sorter, root-lab, mission, meaning, breakdown
- [x] Untimed games: completion overlay after N answers with accuracy + Play Again / Try Another Game
- [x] Fuel-bar games: completing round = win condition, fuel out = loss
- [x] Round picker hidden in Teacher Mode (teacher has own word count picker)
- [x] Skips don't count toward round total
- [x] Instructions updated (WLHelp popup + audioText) in all 7 games
- [x] Teacher guide, FAQ, and About page updated to document the round system

#### Fuel drain adjustments
- [x] Word Spectrum: slowed by 20% (0.2 → 0.167/tick, ~110s → ~132s)
- [x] Word Refinery: slowed by 20% (0.18 → 0.15/tick, ~122s → ~147s)

---

### PHASE 7.13 — Session 2026-04-01

#### NSW DET Cyber Security submission
- [x] Drafted and sent SaaS Risk Assessment request email to EdConnect / NSW DET Cyber Security team
- [x] Email verified against codebase — all 27 factual claims confirmed accurate
- [x] Created `security-architecture.html` — public HTML version of security architecture doc (printable, PDF-ready)
- [x] Created `incident-response.html` — public HTML version of incident response plan (printable, PDF-ready)
- [x] Both pages match `data-agreement.html` styling (Lexend font, print-friendly, A4 @page CSS)
- [x] Documentation URLs included: privacy, terms, data-agreement, parent-privacy, teacher-guide, security-architecture, incident-response

#### Copyright and branding cleanup
- [x] Removed all "Spelling Diagnostic Sets" references → "Spelling Check-In Sets" (7 instances across 5 files)
- [x] Removed all NSW DoE / "Focus on Spelling" / "Triple Word Theory" references from about.html and teacher-resources.html
- [x] Removed NSW DoE citation from references section (kept NESA syllabus citations — public curriculum documents)
- [x] NESA syllabus quotes wrapped in `<q>` tags with `(NESA, 2022)` inline citations
- [x] HPGE policy reference genericised ("schools' obligation" instead of naming NSW DoE policy)
- [x] Added Fabric.js MIT license attribution comment in item-creator.html

#### About page content additions
- [x] Added "Teacher-led or student-led" section — explains Teacher Mode vs Student Mode
- [x] Added "Online and offline, connected" section — ties slide decks, worksheets, and digital activities together
- [x] Updated slide deck heading to "254 teaching slide decks — one for every morpheme"

#### Site consistency and professionalism overhaul
- [x] Activity names standardised: "Meaning Mode" → "Meaning Match-Up", "Flashcard Mode" → "Flashcards" (across FAQ, teacher guide, about, dashboard, analytics)
- [x] Feature names standardised: "Low-stimulation mode" → "Low-stim mode" (across about, terms)
- [x] Page titles standardised: all non-game pages now "Word Labs – [Page Name]" format (10 pages updated)
- [x] Unified dark sticky header across all 21 non-game pages (glassmorphism blur, indigo brand icon, consistent nav)
- [x] Unified footer across all 21 non-game pages: Home · About · Privacy · Terms · Pricing · Contact
- [x] Added footers to 5 pages that had none (dashboard, item-creator, scientist, onboarding, teacher-signup)
- [x] Accessibility: skip links confirmed on all pages, spelling-test.html favicon and header fixed
- [x] Dashboard brand icon standardised to 🧪, header aligned with site-wide glassmorphism style

---

### PHASE 7.14 — Session 2026-04-01 (continued)

#### Morpheme Builder content expansion
- [x] Added 45 new Anglo bases to `data.js`: play, work, read, think, kind, hope, fear, thank, harm, taste, doubt, count, start, stop, hold, fill, print, heat, paint, load, order, spell, clean, sharp, bright, fair, safe, deep, weak, soft, dark, sweet, quick, slow, warm, fresh, hard, price, cover, land, test, grace, comfort, agree, colour
- [x] Added 644 missing dictionary words for both new and existing bases
- [x] Rebuilt `valid-combos.json`: 1,998 → 2,958 valid combos (+48%), 200 → 245 bases, avg 12.1 combos per base
- [x] Existing weak bases improved: trust 7→21, excite 4→10, friend 4→8, react 6→11, watch 6→9
- [x] New bases range: 7–29 combos each (count=29, play=23, test=21, cover=19, read=16)
- [x] Greek combining forms (micro, thermo, chron, aero) remain at 1–2 combos — they're primarily prefixes

#### Game content expansion (new bases pushed into other games)
- [x] Breakdown Blitz: 122 → 205 words (+68%) — playful, rework, unthinkable, fearless, discount, priceless, discovery, disgraceful, etc.
- [x] Mission Mode: +25 prefix-compatible bases (cover, test, load, order, heat, count, agree, etc.) + 32 suffix-compatible bases (fear, harm, taste, doubt, sharp, deep, weak, soft, sweet, etc.)
- [x] Meaning Mode: +38 bases for meaning-matching gameplay
- [x] Speed Builder: automatically benefits from new bases in data.js

#### AI word analysis — editable preview
- [x] Preview table cells are now inline-editable inputs (click any cell to correct)
- [x] Works in both word list creation and spelling check-in set creation
- [x] Syllables/phonemes edited with · (middle dot) separator
- [x] Changes update `_wlAnalyzedWords` / `_ssAnalyzedWords` on blur — saved data reflects teacher corrections
- [x] Built with DOM methods (no innerHTML) for XSS safety
- [x] Suffix column split into Suffix 1 and Suffix 2 for clarity

#### Spelling check-in fixes
- [x] Fixed post-completion takeover loop: students who finished the check-in no longer see the full-screen modal when returning to landing page (checks sessionStorage completion key)
- [x] Added "📋 Print Word List" button on spelling sets — opens numbered word list in new tab with Print button, set name, class, date
- [ ] Teacher-led mode has no real-time sync — students can advance independently (would need Supabase Realtime for true lockstep)

---

### PHASE 7.15 — Session 2026-04-02

#### Spelling check-in fixes (from classroom testing)
- [x] Teacher-led mode: all students now see words in same order (was randomly shuffled per student)
- [x] Main heatmap shows latest check-in session ✓/✗ results instead of cumulative averages
- [x] Added `assessment_started_at` column — each new check-in start resets completion flags
- [x] Students can now take repeated check-ins on the same spelling set
- [x] Score column added to spelling set heatmap
- [x] Label shows which check-in is being displayed ("Showing: Latest Check-In")

#### Stage 2/3 curriculum morpheme expansion
- [x] Gap analysis against Australian Curriculum Stage 2 and Stage 3 morphology strand
- [x] Added 5 new prefixes: `be-` (to make), `hypo-` (under), `circum-` (around), `uni-` (one/single), `arch-` (chief)
- [x] Added 11 new suffixes: `-age`, `-ory`, `-ary`, `-ise` (Aus spelling), `-ious`, `-eous`, `-ative`, `-tion`, `-sion`, `-ation`, `-pathy`
- [x] Added 2 Latin roots: `grad` (step/go, 11 combos), `mot` (move, 27 combos)
- [x] Dictionary expanded by 85 words for new morpheme combinations
- [x] Morpheme Builder: 2,958 to 3,172 valid combos (+214, +7.2%), 247 bases, 47 prefixes, 55 suffixes
- [x] Breakdown Blitz: +29 new words using new morphemes (befriend, uniform, universal, circumspect, coverage, motion, promotion, gradual, informative, etc.)
- [x] Mission Mode: new prefixes + suffixes + bases with validPrefixes/validSuffixes for matching
- [x] Meaning Mode: new prefixes + suffixes for meaning matching
- [x] Flashcards: automatically picks up changes via data.js

#### Full site audit: security (26 of 30 issues fixed)
- [x] XSS: escaped all innerHTML with user data across 20 files (student names, word clues, morpheme meanings)
- [x] Edge functions: added auth to 5 unauthenticated functions (polish-item, speak-word, translate-words, generate-translated-deck, send-feedback)
- [x] Edge functions: restricted CORS from wildcard to 5 allowed origins on all 11 client-facing functions
- [x] Edge functions: send-feedback rate limiting (1 per email per 5 minutes), HTML injection fix in email template
- [x] Edge functions: Stripe redirect URL validation in create-checkout and create-portal-session
- [x] Edge functions: removed API key prefix logging in analyze-words
- [x] Student login: server-side code verification via verify_student_login Postgres RPC (codes no longer sent to client)
- [x] CSP: restricted CDN script-src to specific package paths, added form-action self, frame-ancestors none
- [x] CSP: removed inline event handlers from auth pages (teacher-login, teacher-signup, account) replacing 13 handlers with addEventListener
- [x] CSP: confirmed zero eval or dynamic code evaluation in codebase
- [x] Updated security-architecture.html to reflect new CSP posture

#### Full site audit: data integrity
- [x] purchase() race condition fixed with atomic Postgres RPC using SELECT FOR UPDATE row locking
- [x] saveScientist() race condition fixed with jsonb_set RPC for targeted field updates
- [x] speed-mode added to dashboard heatmap tabs with dynamic column discovery
- [x] Triple-duplicated support_mode in 3 SELECT queries fixed
- [x] Student localStorage cleaned up on logout (challenges, featured game, crown, check-in keys)

#### Full site audit: performance
- [x] Landing page: 10 sequential Supabase queries reduced to 2 parallel Promise.all batches (2-3s to 0.5-1s)
- [x] Cache-control headers: JS 1hr, JSON/TXT 1day, fonts 1yr immutable, HTML must-revalidate
- [x] Sound Sorter data extracted to shared JS file (sound-sorter.html 529KB to 72KB, worksheet 483KB to 28KB)
- [x] select(*) replaced with explicit columns on 4 student_character queries
- [x] 6 game pages: replaced 200ms polling intervals with event-driven _showTeacherNext() calls
- [x] item-creator: replaced 3s canvas.toDataURL() timer with debounced Fabric.js event listeners
- [x] Added defer to 166 external script tags across 39 pages
- [x] Mobile breakpoints added to mission-mode, meaning-mode, root-lab (480px, 44px touch targets)

#### Remaining technical debt (deferred, requires dedicated sessions)
- [ ] Consolidate morpheme data into single source file (currently duplicated in data.js, mission-mode.html, meaning-mode.html, dashboard.html)
- [x] Extract shared CSS to wordlab-common.css (604 lines removed across 38 files — reset, skip-link, header, footer, variables)
- [x] Make deleteClass() atomic via Postgres transaction RPC (`atomic_delete_class.sql` + fixed missing CASCADE on daily_usage)
- [ ] Split wordlab-data.js monolith (2,500+ lines: data, UI, auth, challenges, EALD, shop)

---

### PHASE 7.16 — Session 2026-04-02 (evening)

#### Shared CSS extraction
- [x] Created `wordlab-common.css` (200 lines): reset, CSS variables, skip-link, header (both naming conventions), footer, buttons, overlay
- [x] Linked from 37 HTML pages, removed 604 lines of duplicated CSS
- [x] CSS cache headers added to vercel.json (1hr, matching JS)
- [x] Worksheet pages intentionally excluded (different UI)

#### Security hardening
- [x] Tightened RLS on 4 tables: `class_word_lists`, `class_spelling_sets`, `spelling_set_assignments`, `spelling_check_in_results` — all writes now school-scoped via `get_my_school_id()` (migration: `rls_tighten_word_lists_spelling.sql`)
- [x] Fixed XSS: unescaped class names in landing.html teacher dropdown
- [x] Removed inline onclick handlers from spelling-test.html (5 handlers → addEventListener)
- [x] Atomic deleteClass RPC replaces 4 sequential client-side DELETEs (migration: `atomic_delete_class.sql`)
- [x] Fixed missing ON DELETE CASCADE on `daily_usage.student_id`

#### Accessibility (WCAG 2.1 AA)
- [x] Universal `focus-visible` indicators added to wordlab-common.css — all buttons, links, inputs, tabindexed elements across all pages
- [x] Added `aria-live="polite"` to spelling-test feedback area
- [x] Rapid-fire recordAttempt test script created (`tests/test-rapid-fire-record-attempt.js`)

#### Mobile/touch UX
- [x] Breakdown Blitz: smart Enter key progression (prefix→base→suffix1→suffix2→check), scrollIntoView for virtual keyboard
- [x] Homophone Mode: full touch drag support for Mode 2 (ghost element, drop detection, touchcancel cleanup)
- [x] Mission Mode: documented as click/tap buttons (no drag-and-drop — works natively on touch)

#### Performance
- [x] Preconnect hints for Google Fonts, Supabase, jsDelivr on landing page
- [x] Replaced last `select('*')` in dashboard.html reward function with explicit columns
- [x] CSS cache headers in vercel.json
- [x] Teacher resources: search input debounced (200ms) to prevent re-rendering 254 cards on every keystroke

#### Error handling & robustness
- [x] Scientist page: all 10 saveScientist/purchase functions wrapped in try-catch with user feedback
- [x] 4 game pages: scientist character loading handles errors gracefully (falls back to default SVG)
- [x] class-setup.html: addStudent/removeStudent wrapped in try-catch
- [x] Landing page: leaderboard shows friendly message for single-student classes
- [x] Landing page: empty daily challenges shows placeholder text
- [x] Onboarding: role="alert" + aria-live on error messages, Enter key support for forms
- [x] Onboarding: mobile responsive breakpoints (600px — card padding, font sizes, progress dots)

---

### PHASE 7.17 — Session 2026-04-03

#### Vercel deployment fix
- [x] Fixed font cache header regex pattern in vercel.json (`(?:woff|woff2|...)` not supported by Vercel path matching)
- [x] Split into separate `.woff` and `.woff2` entries — Vercel auto-deploy working again

#### Landing page fixes
- [x] Removed `defer` from Supabase SDK and wordlab-data.js script tags (missed in commit 6572195)
- [x] Wrapped Supabase query builder in `Promise.resolve()` for `.catch()` support (thenable but not a Promise)
- [x] "My Scientist" link text colour changed to `#e0e7ff` to match other stat pills
- [x] Streak stat pill now shows daily play streak only (was falling back to `bestStreak` — answer streak)

#### Spelling set integration — all 9 games
- [x] Mission Mode: morphemes extracted from spelling words, prioritised, results tracked per morpheme back to heatmap
- [x] Meaning Match-Up: same morpheme extraction and tracking pattern
- [x] Root Lab: spelling words converted to Root Lab format with morpheme meanings from existing pool
- [x] All 3 new integrations use module-scope tracking functions to avoid closure scoping issues

#### Teaching slide decks — 70 new decks (254 → 324 total)
- [x] 5 new prefixes: be-, hypo-, circum-, uni-, arch-
- [x] 11 new suffixes: -age, -ory, -ary, -ise, -ious, -eous, -ative, -sion, -ation, -pathy
- [x] 9 Greek/Latin roots: tele, peri, gyro, endo, horo, stetho, kaleido, grad, mot
- [x] 45 Anglo bases: play, work, read, think, kind, hope, etc.
- [x] Updated teacher-resources.html, about.html, faq.html with new counts (324 decks)

#### Student profile — spelling set progress
- [x] Check-in scores shown per set (latest score, or pre→post with % change arrow)
- [x] Cross-set progress timeline when 2+ sets have check-in data

#### Focus words system
- [x] New `focus_words` jsonb column on students table
- [x] Wrong words from check-ins automatically saved as focus words (spelling-test.html)
- [x] Focus words feed into all practice games via `getSpellingSetWords()` pipeline
- [x] Dashboard: amber 🔄 badge with count on student rows in spelling set heatmap
- [x] Focus words modal: view word list with morpheme parts + dates, remove individual words or clear all
- [x] `getFocusWords()`, `addFocusWords()`, `removeFocusWords()`, `clearFocusWords()` in wordlab-data.js

#### Auto-progression
- [x] Green banner on spelling set heatmap when students score 80%+ in latest check-in
- [x] Shows student names + scores, one-click "Advance to [Next Set]" button
- [x] Dismiss button to hide banner without action
- [x] `ssAutoAdvance()` completes current assignments and creates new ones on next set

#### Per-activity extension toggles
- [x] New `extension_activities` jsonb column on students table
- [x] `isExtensionMode(activity)` accepts optional activity parameter for per-activity checks
- [x] Empty `extension_activities` = all activities (backward compatible with existing `extension_mode` boolean)
- [x] All 13 game pages updated with activity-specific calls (e.g. `isExtensionMode('phoneme-splitter')`)
- [x] Dashboard EXT badge opens popover with global toggle + 13 per-activity toggles
- [x] Save writes both `extension_mode` and `extension_activities` to database
- [x] `getStudentData()` and `getClass()` select `extension_activities`; cleared on logout

---

### PHASE 7.20 — Session 2026-04-07

#### Phase A site audit continuation (dark theme port)
- [x] `class-setup.html` — ported to navy + indigo dashboard theme (dark panels, 48px inputs, 52px buttons, indigo accents, pill-tab navigation, dark wlmBtn modals, dark teacher auth gate modal, dark error banners)
- [x] `account.html` — same treatment plus `dangerBtn` variant on the delete-account card
- [x] Both pages now consistent with the rest of the teacher journey (landing → teacher-login → teacher-signup → onboarding → dashboard → class-setup → account)

#### Unified design system plan (`docs/superpowers/plans/2026-03-30-unified-design-system.md`)
Whole plan (Tasks 1–18) closed in one session. Most tasks were already shipped via `wordlab-common.css` (Phase 7.16) — the plan predates that extraction. Actual work was consolidating the chrome CSS on seven game pages that had dual declarations (a clean design-system block AND a legacy `!important` override block that was winning the cascade).

- [x] `phoneme-mode.html` — lifted purple accent tints (`#e9d5ff`, `#c4b5fd`) into the clean block, deleted 11-line legacy `!important` chrome block. `!important` count 54 → 44.
- [x] `syllable-mode.html` — amber hud tint (`#fde68a`, `#fbbf24`), legacy block deleted. 45 → 35.
- [x] `sound-sorter.html` — sky hud tint (`#bae6fd`, `#e0f2fe`). 42 → 38.
- [x] `breakdown-mode.html` — red sub tint (`#fca5a5`). 23 → 19.
- [x] `meaning-mode.html` — parchment hud tint (`#f5e6c8`, `#c8a060`). 67 → 61.
- [x] `speed-mode.html` — structural dedupe, no color tinting needed. 40 → 38.
- [x] `mission-mode.html` — emerald hud tint (`#d1fae5`, `#6ee7b7`), solid `#065f46` for `.pill.score`. 32 → 25.
- [x] `root-lab.html` — dropped unnecessary `!important` on scene-specific `.headerInner` and `.hud` overrides (cascade order was enough). Chrome `!important` count → 0.
- [x] `scientist.html` — added `--accent` tokens and tightened inline `.brandSub` override (11px/700/.1em → 9px/800/.22em) so it matches the common.css header.
- [x] Plan Tasks 7 (flashcard), 9 (homophone), 10 (word-refinery), 11 (word-spectrum), 12 (root-lab), 13 (class-setup), 15 (dashboard), 16 (spelling-test), 17 (teacher-login), 18 (landing) — all verified as already on-spec or no-op (inherited from `wordlab-common.css`).
- [x] Every remaining `!important` on the swept pages is now either in a mobile `@media` block (legit responsive override) or on a gameplay element (game-zone, bubbleBtn, modeSel, flashSuccess, feedback states, etc.) — explicitly out of scope for the plan.
- [x] Plan + spec documents committed to `docs/superpowers/{plans,specs}/2026-03-30-unified-design-system.md` as a historical record.

#### Teaching slide decks — 68 missing files committed
- [x] The Phase 7.14/7.15 expansion (45 new Anglo bases + 5 new prefixes + 11 new suffixes + 7 Greek combining forms) generated 68 new `.pptx` decks via `scripts/generate-all-decks.js`, but the files were only in Codespaces — never committed to git. Teachers clicking Preview or Download from `teacher-resources.html` were hitting 404s on Vercel.
- [x] All 68 decks committed in `output/` (~68MB). Total tracked deck count now 323, matching the 324 figure displayed in `teacher-resources.html` / `about.html` / `faq.html`.

#### Housekeeping
- [x] Cleaned `supabase/migrations/secure_student_login.sql` — stripped 23 lines of browser-extension console error output that had been accidentally appended after the final `GRANT`.

---

### PHASE 9 — NSW Department of Education Approval

Full checklist document: `docs/nsw-doe-approval-checklist.md`

**What's already done:**
- ✅ Data sovereignty — Supabase migrated to Sydney (ap-southeast-2) on 2026-03-25
- ✅ Privacy policy (`privacy.html`) — covers APPs, children's data, notifiable breaches
- ✅ Terms of service (`terms.html`)
- ✅ Data handling agreement (`data-agreement.html`)
- ✅ Teacher auth via Supabase Auth (email/password, hashed)
- ✅ Student data minimisation (first names only, no PII)
- ✅ Data deletion (cascade on class delete)
- ✅ HTTPS everywhere (Supabase + Vercel)
- ✅ Encryption at rest (Supabase default)
- ✅ ABN registered, business name registered

**What still needs doing (in priority order):**

#### 9.1 WCAG 2.1 AA accessibility (BIGGEST GAP — do first)
- [x] Add skip-to-content links on all pages (all 34 HTML pages)
- [x] Audit all images for descriptive ALT text
- [x] Add ARIA labels to all forms, buttons, and navigation elements
- [x] Keyboard navigation audit — all interactive elements reachable and usable without mouse
- [x] Add keyboard alternatives for drag-and-drop games (Morpheme Builder, Speed Builder, Refinery, Homophone Mode)
- [x] Error messages clearly described and associated with form fields (aria-live regions added)
- [x] Add ARIA landmarks (role="banner", role="main", role="navigation") to all pages
- [x] Add aria-live regions for dynamic content (scores, feedback, errors) across all game/teacher pages
- [x] Colour contrast audit — fixed #94a3b8→#64748b on light backgrounds, #cbd5e1→#64748b, #64748b→#94a3b8 on dark backgrounds
- [x] Ensure text is resizable without loss of content — dashboard cells changed from fixed to min-width/min-height
- [x] Ensure no content relies solely on colour to convey meaning — added ✓/✗ icons to history items, input cards, zone cards; ⚠ to flagged dashboard cells
- [ ] Test with screen readers (VoiceOver on Mac, NVDA on Windows) — requires manual testing

#### 9.2 Security audit & hardening
- [x] XSS audit — reviewed all pages; added `escapeHtml()` to all innerHTML user data injection points
- [x] CSRF audit — JWT-based auth (not cookies) inherently mitigates CSRF; documented in security architecture
- [x] Write security architecture document — `docs/security-architecture.md` (data flow, encryption, auth, RLS, sub-processors)
- [x] Write incident response plan — `docs/incident-response-plan.md` (NDB scheme, OAIC notification, templates)
- [x] Added Content-Security-Policy header to `vercel.json`
- [x] Fixed open redirect vulnerability in `returnTo` parameter (teacher-login.html)
- [ ] Arrange external penetration testing (can be done later, but document readiness)

#### 9.3 NSW-specific privacy compliance
- [x] Review NSW Privacy and Personal Information Protection Act 1998 (PPIP Act) — privacy.html updated with PPIP Act references, IPP alignment
- [x] Create parent-facing privacy summary — `parent-privacy.html` (print-friendly, linked from pricing FAQ + privacy policy)
- [x] Clarify parent/guardian consent requirements for students under 16 — Section 5.1 added to privacy.html (IPP 2, school authority, parental consent process)
- [x] Update privacy.html and data-agreement.html with NSW-specific language — PPIP Act s.9, s.18, s.19 references; NSW IPC as complaint body; IPP compliance in data agreement

#### 9.4 Support & documentation
- [x] Write formal teacher guide — `teacher-guide.html` rewritten with full setup, activities, dashboard, word lists, troubleshooting FAQ, support info
- [x] Document support channels — included in teacher guide (email nick@wordlabs.app, 24h response on school days)
- [x] Create incident reporting process for teachers — included in teacher guide + incident response plan

#### 9.5 Formal approval process
- [x] Email sent to EdConnect / NSW DET Cyber Security team requesting SaaS Risk Assessment (2026-04-01)
- [x] Email included: product overview, data collection summary, data sovereignty, security measures, compliance frameworks, all 7 documentation URLs, firewall whitelisting domains
- [x] ABN included: 62 528 046 944
- [x] Contact emails provided: nick@wordlabs.app, nickdeeney135@gmail.com
- [ ] Await response from DET Cyber Security team — SaaS Risk Assessment form expected
- [ ] Complete SaaS Risk Assessment with all supporting documentation
- [ ] Submit documentation package: privacy policy, security architecture, support plan, data agreement
- [ ] Undergo technical review by DET
- [ ] Complete Privacy Impact Assessment (if required by DET)
- [ ] Run formal pilot program with 3–5 NSW teachers (structured feedback collection)
- [ ] Obtain written approval for wider rollout

---

### PHASE 7.21 — Session 2026-04-09

#### Principal landing page (`for-schools.html`)
- [x] `for-schools.html` principal landing page shipped — hero, dual panel, trust pillars, pack download, pricing cards
- [x] School Information Pack ZIP (7 PDFs) committed at `edbuy-docs/school-information-pack.zip`
- [x] "For schools" footer link added across 17 marketing/info pages (10 pattern-A + 7 pattern-B)
- [x] "For schools" card added to landing.html Find Out More (logged-out) and Information (teacher) sections
- [x] Accessibility: skip link, ARIA landmarks, alt text, aria-current, single h1
- [x] Mobile: single-column layout at <= 700px, no horizontal scroll at 360px
- [x] Open Graph / Twitter Card meta tags for social sharing
- [x] Hero layout: stacked (centred text + full-width dashboard screenshot below)
- [x] CTA buttons use neutral "Start your free trial" (no conflicting trial length)

#### Landing page fixes
- [x] Teacher name in header changed from dark indigo (#312e81) to readable white (#e0e7ff)

---

### PHASE 8 — Growth & Integrations (Later)

- [ ] Google Classroom integration (roster import via Google API)
- [ ] SCORM export (lets schools plug Word Labs into their LMS)
- [ ] Multi-Academy Trust (MAT) accounts — one billing account, many schools
- [ ] Teacher-to-teacher sharing of custom item designs
- [ ] White-labelling option for large MAT contracts
- [ ] Public marketing site (separate from the app) with demo video, testimonials, pricing
- [ ] In-app "refer a colleague" flow (free month for referrals)
- [ ] Analytics dashboard for Nicholas — see which schools are active, churn signals, popular activities
- [ ] Automated security monitoring edge function (`security-audit`) — daily/weekly cron via pg_cron, checks failed login spikes, unusual data volume, RLS violations, emails summary via Resend. Build when reaching 20+ schools.

---

## 12. Session Start Checklist

At the start of each working session, do this:

1. Read this file
2. Check recent git log: `git log --oneline -10`
3. Confirm current branch is `main` and up to date: `git status`
4. Identify which roadmap item we're working on
5. If it's a big change, write the plan in plain language before touching code
6. After completing work: commit, push, update the checklist above (tick completed items)

---

## 13. Decisions Made & Why

| Decision | Reason |
|---|---|
| No build system | Keeps it simple for a non-JS-engineer owner; easy to hand off |
| Supabase over Firebase | Better SQL, better RLS, built-in edge functions, generous free tier |
| Stripe for payments | Industry standard, handles VAT/invoicing, works with purchase orders |
| Per-school annual pricing | Simplest for school procurement — one invoice per year |
| Trial = 30 days, 1 class | Low friction to start, enough to run a real pilot, easy upsell |
| Store teacher password per class (currently) | Legacy — being replaced by Supabase Auth in Phase 1 |
| Fabric.js for item creator | Best canvas library for this use case, good SVG support |
| AUD pricing | Owner is Australian, primary market is Australian schools |
| Supabase Sydney region | Australian schools (especially government) require data stored in Australia |
| Australian Privacy Act over GDPR | Primary legal framework; build GDPR-compatible anyway for future expansion |
| .com.au or .app domain | .com.au signals Australian business; .app is clean global alternative |
| GitHub Pages as temp deployment | School blocks wordlabs.app and Vercel — GitHub Pages works on school network |
| Dynamic URLs over hardcoded | All URLs use `window.location.origin` so the app works on any domain |
| AI for word analysis | Teachers shouldn't need linguistics knowledge to create word lists |
| Claude API model: `claude-sonnet-4-6` | Only model available on Nick's Anthropic workspace (no date suffix) |
| Grapheme-based phonemes | Phoneme splits use actual letters from the word, not IPA sounds, to match the game |
| Auto-generated class codes | 6-char random codes prevent collisions as platform scales; teachers don't choose codes |
| Word list priority system | Teachers control whether custom words replace, precede, or mix with built-in words |
| Pet system hidden | Built full pet companion system but visual quality needs work; code preserved for later |
| Active plan for PL demo | Temporary: new signups get `active` plan so teachers don't see trial banners during PL session |
| Supabase Singapore → Sydney migration | NSW DoE requires Australian data centres; migrated 2026-03-25 with full data transfer |
| Unified Featured Game system | Replaced separate GOTW (calendar) + teacher focus (+50%) with one system — auto-picks per student's weakest game, teacher can override; both give 2x |
| Bonus days on Wed/Sat/Sun | Encourages play on quieter days; Wednesday breaks up the school week; weekends reward voluntary practice |
| Spelling Test card hidden by default | Only relevant during active check-ins; avoids confusion when no assessment is running |
| True eraser (destination-out) | White paint eraser left visible marks on transparent exports; compositing eraser removes pixels properly |
| Low-stim mode per-class | Sensory accommodations for neurodiverse students; schools expect this for procurement; per-class is simpler than per-student and teachers can split into groups |
| Dashboard navy dark theme | Matches landing page aesthetic; provides visual consistency across the product |
| Batched progress queries (5 per batch) | Single query with .limit(10000) was silently dropping data for large classes; batching by 5 students with 50k limit per batch scales to any class size |
| patchBanks() in-place tile updates | Full innerHTML rebuild of 300+ tiles on every morpheme add/remove caused visible lag; patching CSS classes in-place eliminates DOM destruction |
| Summary table columns collapsed | Extension toggle, reward button, last active moved into sticky name cell; removes 3 columns of horizontal scroll |
| Teacher Mode on game pages (not preview) | "View as Student" shows normal gamified experience; teacher landing opens games in teaching tool mode — clearer distinction for teachers |
| Client-side PPTX viewer | External viewers (Google Docs, Office Online) blocked by Vercel headers and school firewalls; JSZip parses PPTX locally with zero external dependencies |
| Sound Sorter ~20 words per level | Was only 3-5 per sound per level — students were seeing the same words repeatedly; expanded to 1,662 total |
| Support mode per-student + self-serve | Teachers can pre-set it (persists in DB, student can't disable); students can also toggle it on themselves (sessionStorage only, temporary) |
| WOTW curated 52-word list | Auto-rotates weekly; teacher doesn't need to manage it; feeds into games as priority word |
| New signups get active plan for 1 year | Temporary — free access during early adoption phase |
| Round-based word count (10–30) | Gives every game a natural end point; encourages students to explore different activities instead of sitting in one forever; student choice of round length supports autonomy |
| Need Advice button for all users | Originally support-mode only; making it universal helps all students without stigma; floats fixed on mobile when scientist is hidden |
| Support toggle no reload | Page reload disrupted gameplay mid-round; now toggles CSS class live; some features (option counts, drain rates) apply from next question onwards |
| Fuel drain +20% for Spectrum/Refinery | These games require more reading and thinking time than other fuel-bar games; students were running out before engaging properly |
| Signup notification email | Fire-and-forget via existing send-feedback edge function; lets Nick know immediately when a teacher signs up without adding infrastructure |
| Consistent info page headers | All info pages use same layout (brand + Home link); dark pages match teacher-guide blur style; light pages use clean white header |
| upgrade.html → pricing.html redirect | upgrade.html was orphaned with completely wrong plan names and prices; redirect avoids confusion |
| Greek combining-form prefixes (tele, peri, gyro, endo, horo, stetho, kaleido) | These are bound morphemes that combine with Greek bases (especially scope); added as prefixes because the build script's dictionary check prevents nonsense combos — only real English words pass |
| CVC doubling skip for Latin/Greek roots | Bound roots like phon, duc, vis don't follow English CVC doubling (stressed final syllable); skipping prevents "phonnes", "ducc", "viss" |
| CVC candidate generation for multi-syllable words | English CVC doubling depends on stress (admit→admitted but visit→visited); build script tries both forms and keeps whichever is in dictionary |
| Security docs as public HTML pages | Markdown docs in /docs not accessible to NSW DET reviewers; converted to styled HTML pages matching data-agreement.html for direct linking in submission email |
| Removed NSW DoE branding from site | "Focus on Spelling", "Triple Word Theory", HPGE policy name removed to avoid any appearance of copying or deriving from NSW DoE intellectual property; NESA syllabus citations kept (public curriculum documents) |
| "Meaning Match-Up" as canonical game name | Was inconsistently called "Meaning Mode" in some places; "Match-Up" is more descriptive and student-friendly |
| Unified dark header across all pages | Professional consistency for school procurement review; glassmorphism blur matches the landing page aesthetic; teacher tool pages keep functional nav links in the dark style |
| Standard footer link set | Home · About · Privacy · Terms · Pricing · Contact on every page; schools and IT teams expect easy access to legal docs from any page |
| Email sent via EdConnect | NSW DET's public contact point; asked to forward to Cyber Security team since no direct email available |
| 45 new Anglo bases (play, work, read, kind, hope, etc.) | Common everyday words kids know; highly productive with existing prefix/suffix system (8–29 combos each); fills the gap where many bases had only 1–4 valid words |
| Dictionary expansion (644 words) | Build script validates against dictionary; many real English words (unfriendly, excitable, chronically, etc.) were missing, artificially limiting combo counts |
| Editable AI preview table | AI word analysis sometimes gets syllable/phoneme splits wrong; teachers need authority over content before it's saved and practised by students |
| DOM-based preview rendering | Previous innerHTML approach risked XSS from AI-generated content; DOM methods (createElement/appendChild) are safe by default |
| Print Word List as new-tab page | Teachers need a numbered word list for teacher-led spelling check-ins; new tab with Print button is simpler than PDF generation and works offline |
| No real-time sync for teacher-led check-in | True lockstep (teacher controls which word all students see) would need Supabase Realtime subscriptions — significant complexity; current mode works for most classrooms where teacher says "ready, next" verbally |
| Focus words as student-level data | Stored on `students.focus_words` (not per-set) so they persist even after advancing sets; teacher controls when to clear them |
| Auto-progression at 80% threshold | Not fully automatic — shows a suggestion banner that the teacher accepts or dismisses; teachers want control over when students move on |
| Per-activity extension via popover | EXT badge click opens a modal with global + 13 per-activity toggles; avoids cluttering the summary table with 13 columns |
| extension_activities empty = all | Backward compatible: existing students with `extension_mode=true` and no `extension_activities` get extension everywhere, same as before |
| Spelling set morpheme tracking per-morpheme | Mission/Meaning modes quiz on morphemes not words, so results are tracked against all spelling words containing that morpheme (e.g. getting `un-` right counts for unhappy, unkind, unfair) |
| Vercel font header split | Vercel path matching doesn't support regex alternation `(?:...)` — split into separate entries per format |
| Hardcoded per-page hud tint colours (not new tokens) | When consolidating the chrome CSS in Phase 7.20, each game page wanted its hud text in an accent-tinted off-white (purple `#e9d5ff`, amber `#fde68a`, emerald `#d1fae5`, etc.) that isn't a simple alpha of the page's `--accent`. Introducing new `--hud-text` / `--hud-bg` tokens would either require defining them on every page (just moving the hardcoding one step deeper) or a shared stylesheet rewrite. Hardcoding the 2–3 tinted colours per page inside the page's own `<style>` block is simpler, co-located with the rest of the page, and the "unified" part of the design system is structural (selectors, sizes, spacing) not literal colour values. |
| Phase A dark theme extends beyond the original scope | Original Phase A was teacher-signup + onboarding (commit 50b6512). On continuation, `class-setup.html` and `account.html` still had light-bg panels that made the teacher journey jump themes. Ported them in Phase 7.20 to close the loop — the whole teacher flow (landing → login → signup → onboarding → dashboard → class-setup → account) is now one continuous navy + indigo surface. |
| Principal landing page (for-schools.html) | Direct-to-principal sales page with pack download + trial CTA. Marketing copy says "3-month trial" but backend still grants 12 months; see project_trial_period_change.md for the planned flip. |
