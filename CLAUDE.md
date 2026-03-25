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
**School pricing:** ~AUD $299/school/year (adjust based on market feedback)
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
| Payments | Stripe (live) | ABN + "Word Labs Education" sole trader |
| Transactional email | Resend | Free tier, domain verified, sends from notifications@wordlabs.app |

---

## 3. All Pages & Their Purpose

| File | Who uses it | What it does |
|---|---|---|
| `landing.html` | Everyone | Home page — activity cards, scientist character display, login UI |
| `index.html` | Students | Morpheme Builder — drag prefix/base/suffix to build words |
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
- [ ] Test RLS by logging in as two different teacher accounts and confirming isolation

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
- [ ] `students`, `student_progress`, `student_character` — Phase 2 stretch (low priority while single-school)

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
- [ ] Test with rapid-fire correct answers — confirm no count loss

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
- [x] "Daily goal" system — 20 questions/day with progress bar on landing page
- [x] Class XP leaderboard on landing page (top 5 in class, highlights current student)
- [x] Notification when a badge is newly earned (popup/animation) — already in WLScientist.react
- [x] Home screen shows "Welcome back, [name]!" with quarks, level, badges, daily goal

#### 7.4 Mobile polish
- [x] Full audit of all game pages on mobile (320px–480px)
- [x] Added 480px breakpoints to all 8 game pages (grids collapse, touch targets 44px+)
- [x] Ensure scientist page shop renders cleanly on small screens (grid minmax reduced)
- [ ] Mission Mode drag-and-drop on touch devices (works via tap-to-select fallback)
- [ ] Breakdown Blitz keyboard handling on mobile (needs testing)

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
- [ ] TODO: Expand to Sound Sorter, Mission Mode, Meaning Mode (needs more data per word)
- [ ] TODO: Test phoneme/syllable integration end-to-end with student accounts

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
- [x] ⚠️ TEMPORARY: New signups get `plan: 'active'` (for PL demo 2026-03-25) — revert to `plan: 'trial'` with 30-day window after

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
- [ ] Contact NSW DoE ICT Directorate — request SaaS Risk Assessment form
- [ ] Complete SaaS Risk Assessment with all supporting documentation
- [ ] Submit documentation package: privacy policy, security architecture, support plan, data agreement
- [ ] Undergo technical review by DoE
- [ ] Complete Privacy Impact Assessment (if required by DoE)
- [ ] Run formal pilot program with 3–5 NSW teachers (structured feedback collection)
- [ ] Obtain written approval for wider rollout

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
