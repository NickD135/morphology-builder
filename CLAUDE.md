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
**Supabase project ref:** `qutsbcfkgiihcwaktsaz`
**Supabase URL:** `https://qutsbcfkgiihcwaktsaz.supabase.co`
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
| Edge functions | Supabase Edge (Deno) | One function: `polish-item` (AI item polish) |
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
| `scientist.html` | Students | Dress their scientist character, view badges, spend quarks in shop |
| `dashboard.html` | Teachers | Heatmaps per student/activity, intervention flags, reward system |
| `class-setup.html` | Teachers | Create classes, add/remove students, manage codes |
| `item-creator.html` | Teachers | Draw or AI-generate custom shop items (lab coats, hats, etc.) |

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

**⚠️ No `school_id` on any table yet — all schools share one flat namespace. This MUST be added before going multi-tenant.**

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
- [ ] `students` — can only access via class they own (Phase 2 — needs school_id)
- [ ] `student_progress` — scoped to teacher's students (Phase 2)
- [ ] `student_character` — same (Phase 2)
- [ ] `shop_items` — teacher-scoped (Phase 2)
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
- [ ] Dashboard queries — students scoped via class→school chain (RLS handles this at DB level)

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
- [ ] Add "export class data" CSV function (teachers may need this)
- [ ] Consider: do you need an ABN? For selling to schools yes — register as sole trader or company
- [ ] Consider: Australian schools often pay via purchase order — build this into Stripe flow

---

### PHASE 6 — Infrastructure Hardening

#### 6.1 Move shop item images to Supabase Storage
- [ ] Create a `shop-items` storage bucket in Supabase (public read)
- [ ] Update `publishItem()` in `item-creator.html` — upload canvas PNG to Storage, store URL instead of base64
- [ ] Update `useAIVersion()` — same
- [ ] Update all `shop_items` queries — `image_data` becomes `image_url`
- [ ] Write migration to move existing base64 items to Storage
- [ ] Remove `image_data` column, add `image_url` column

#### 6.2 Fix the `recordAttempt` race condition
- [ ] Rewrite to use a single atomic upsert with SQL arithmetic: `correct = correct + 1`
- [ ] Use Postgres RPC function (`supabase.rpc('increment_progress', {...})`) so the increment is atomic
- [ ] Test with rapid-fire correct answers — confirm no count loss

#### 6.3 Error handling
- [ ] Wrap all Supabase calls in consistent try/catch with user-visible fallback (not silent console.warn)
- [ ] Add offline detection — show "No internet connection" banner if fetch fails
- [ ] Add retry logic for transient failures (exponential backoff, max 3 retries)

#### 6.4 Performance
- [ ] Audit `wordlab-data.js` — consolidate multiple sequential Supabase calls into single joins where possible
- [ ] Add loading states to dashboard so it doesn't appear blank while fetching
- [ ] Lazy-load `wordlab-effects.js` and `wordlab-scientist.js` only on pages that need them

---

### PHASE 7 — Product Improvements (do alongside sales)

#### 7.1 Teacher dashboard upgrades
- [ ] Add "Last active" column showing when each student last played
- [ ] Add per-student "activity breakdown" modal — click a student to see all their scores
- [ ] Add class-level summary: average accuracy, most-played activity, most-missed morpheme
- [ ] Export to CSV for parents evening / reports

#### 7.2 Content expansion
- [ ] Add more words to Breakdown Blitz (currently 42 — aim for 100+)
- [ ] Add more prefixes/suffixes to Mission and Meaning modes
- [ ] Add difficulty levels to Speed Builder and Mission Mode
- [ ] Teacher ability to add custom word lists per class

#### 7.3 Student experience
- [ ] "Daily goal" system — e.g. "Answer 20 questions today" with streak tracker
- [ ] Weekly XP leaderboard (opt-in, per class only)
- [ ] Notification when a badge is newly earned (popup/animation)
- [ ] Home screen shows "Welcome back, [name]! You have X quarks"

#### 7.4 Mobile polish
- [ ] Full audit of all game pages on mobile (320px–480px)
- [ ] Mission Mode drag-and-drop on touch devices
- [ ] Breakdown Blitz keyboard handling on mobile
- [ ] Ensure scientist page shop renders cleanly on small screens

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
