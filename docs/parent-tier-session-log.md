# Parent Tier — Session Log

> Running log for the parent-owned account tier. **Newest entry at the top.**
> Read this after `PARENT_TIER.md` at the start of every session. Update it *as part of*
> the work, not afterwards.

---

## 2026-06-30 — P3.5 adaptive levelling drafted

> **Cross-codespace sync:** all on branch `feature/parent-tier`. New file
> `placement-check.html` + edits to `wordlab-data.js`, `landing.html`, `parent-home.html`,
> plus these docs. If you are reading this in the *other* codespace, `git pull` the branch
> before continuing — the code below won't exist locally until you do. No DB migration was
> added, so nothing to apply on the dev project.

Parent-owned children have no teacher to set their curriculum stage, so they are now placed
and re-levelled automatically from how much they get correct. Owner picked the **quick
placement check** for initial placement (recorded as `PARENT_TIER.md` §8.6). All built on the
existing `wordlab-stage.js` engine — no schema change, no new RPC.

- **`placement-check.html`** (new) — first-play check for a child whose `stage` is `NULL`.
  12 questions, 3 per probed stage (`s2e/s2l/s3e/s3l`), "what does <morpheme> mean?" MCQ built
  from `window.MORPHEMES` (prefixes + suffixes that have a meaning + stage), 2 distractor
  meanings from the pool. Placement = **first stage failed** (`<2/3`), walking easiest→hardest;
  pass all → `s3l`. Conservative on purpose: auto-promotion fixes under-placement, and there
  is no demotion to fix over-placement. "Skip — start at the beginning" sets `s2e`. Runs only
  inside a guardian-play session (else bounces to `parent-home.html`); writes via
  `setChildStage`, then → `landing.html`.
- **`wordlab-data.js`** — new "Adaptive levelling (parent tier)" block:
  - `setChildStage(studentId, stage)` — direct `students.stage` UPDATE (allowed by the
    guardian UPDATE policy in `parent_tier_schema.sql`); refreshes `_childrenCache` + `wl_stage`.
  - `maybeAdvanceChild(studentId, currentStage)` — recomputes a promotion signal and moves the
    child up if warranted. Uses a per-stage **baseline** snapshot of core-game totals stored in
    `student_character.stats.autoLevel` (re-anchored on entry to a stage and on each promotion),
    so promotion is judged on attempts made *since entering the current stage* — no cascade up
    several stages on banked easy answers. Promotes when, since baseline, `≥50` new attempts
    across `≥2` of the 6 `WLStage.CORE_GAMES` at `≥80%` accuracy. Capped at `s3l` (never
    auto-into `s4`). **No demotion.** Returns `{promoted, from, to, fromName, toName}` or null.
    Both exported.
  - Why accuracy-as-proxy: once a stage is set, `weightPool()` already serves ~80% current-stage
    content, so core-game accuracy ≈ current-stage mastery. Simpler and self-contained vs.
    rebuilding the dashboard's `getCategoryStage`/`calcMastery` map (which needs a breakdown-words
    fetch). Noted as tunable; revisit with pilot data.
- **`landing.html`** — after `getStudentData()` caches `wl_stage`, if `isGuardianPlay()` it
  calls `maybeAdvanceChild` and, on promotion, shows a 🚀 "Level up!" celebration overlay
  (`showLevelUpCelebration`, DOM-built). Runs once per return to landing (i.e. after each round).
- **`parent-home.html`** — loads `wordlab-stage.js`; the child card "Level" pill now shows the
  friendly stage name (Explorer/Voyager/…) instead of the XP number, or "Finding level" when
  unplaced; Play button reads "Find level & play" and routes unplaced children to the check.

Write paths verified against migrations: `student_character` UPDATE is `USING(true)` (covers
the authenticated guardian); `students` UPDATE for parent-owned rows is the guardian policy.

Static verification: `node --check` clean on `wordlab-data.js`; inline scripts in
`placement-check.html`, `parent-home.html`, `landing.html` parse. **Not done:** in-browser E2E
(deferred to P6). Manual flow to verify: add child → Play → 12-question check sets a stage →
play a few rounds at high accuracy → on return to landing, confirm `students.stage` advanced
and the Level-up overlay shows; confirm it does NOT advance again immediately (baseline reset).

---

## 2026-06-30 — P3 create-a-child + parent dashboard drafted

Owner confirmed `parent_tier_schema.sql` was applied to the dev DB. Built the create-a-child
flow and the real parent dashboard. Still dark-launched/unlinked per §3a.

- **`wordlab-data.js`** — new "Guardian children" block: `getMyChildren()` (queries
  `guardian_links` → `students` by id, NOT `students` directly, because the combined SELECT
  policy also returns school learners), `createChild(name)` (wraps the `create_child` RPC;
  maps the `child_limit` error to `reason:'limit'`), `getChildSummary(studentId)` (quarks /
  xp / level / badges / overall accuracy from `student_progress`), and the play handoff
  trio `enterChildPlay` / `exitChildPlay` / `isGuardianPlay` (sets `wl_guardian_play` in
  sessionStorage + a classless `startSession(null, id, name)`). All exported.
- **`parent-home.html`** — rebuilt from placeholder into the dashboard: child cards (level,
  quarks, accuracy, badges loaded async), add-a-child modal that respects `child_limit`
  (free = 1, shows an upgrade note at the cap), empty state, Play button → `enterChildPlay`
  → `landing.html`. DOM-built (no innerHTML with user input).
- **`landing.html`** — `routeLayout()` now renders the student layout when
  `isGuardianPlay()` is set (not just teacher preview), so a child plays even though the
  parent's auth session is live. Added a teal guardian-play banner with the child's name and
  a "Done / Switch child" button (`exitChildPlay()` → `parent-home.html`). The existing
  teacher-preview banner is unaffected (separate flag, separate copy).

How play works: parent is `authenticated`; child plays classless inside that session.
Progress writes via `increment_progress` (granted to `authenticated` in P1); scientist
purchase/save via `atomic_purchase`/`save_scientist_field` (explicit `authenticated` grants
added in P1). `isStudentTeacher(null, …)` short-circuits to false, so a null class is safe.

Static verification: `node --check` clean on `wordlab-data.js`; inline scripts in
`parent-home.html` + `landing.html` parse; both pages serve 200. **Not done:** in-browser
E2E (Playwright Chrome not installed here; deferred to P6). Real flow to verify manually:
guardian signup (mind email-confirmation setting on dev) → add child → Play → answer a few
questions → confirm a `student_progress` row appears and quarks/XP rise → "Done" returns to
the dashboard with updated stats.

**Next (P4):** parent-tier billing — separate Stripe product, checkout, webhook, raise
`child_limit` / set `plan='active'` on the guardians row.

---

## 2026-06-30 — P2 parent auth drafted (dark-launched)

Built the parent-tier auth layer, mirroring the existing teacher auth. All unlinked from the
public site and `noindex` per §3a — reachable only by direct URL for testing.

- **`wordlab-data.js`** — new "Guardian (parent tier) Auth" block parallel to the teacher
  block: `getGuardianSession()`, `requireGuardianAuth(fallbackUrl='parent-login.html')`,
  `guardianSignOut()`, and `getGuardianRecord()` (cached; auto-creates the `guardians` row
  with freemium defaults `plan:'free'`/`child_limit:1` on first call; try/catch so it
  degrades gracefully when the schema isn't applied). All four exported.
- **`parent-login.html`** (new) — Log In / Create Account tabs, forgot-password, email-
  confirmed banner, open-redirect-safe `getReturnUrl()` (default `parent-home`). Register
  collects name + email + password only (no school-search machinery). `ensureGuardian()`
  creates the row on first login.
- **`parent-home.html`** (new) — minimal authed placeholder: `requireGuardianAuth()`, shows
  guardian email + plan pill + sign-out. Loads `wordlab-data.js` synchronously (not `defer`)
  so `WordLabData` is defined for the inline script. P3 replaces this with the real
  dashboard.

`node --check` clean on `wordlab-data.js`; inline scripts in both pages parse.

**Depends on P1:** the pages are inert until `parent_tier_schema.sql` is applied to the dev
DB (guardians table must exist). No public links added. No Stripe/billing yet.

**Next (P3):** create-a-child flow (uses the `create_child` RPC) + real parent dashboard
with per-child progress, replacing the `parent-home.html` placeholder.

---

## 2026-06-30 — P1 schema plan drafted (awaiting approval to apply)

Wrote the full P1 migration as a single versioned file:
**`supabase/migrations/parent_tier_schema.sql`**. Nothing applied to any DB — this is the
proposal at the approval gate. (No Supabase MCP connection was available this session, so
the committed migrations were used as the source of truth; the three "confirm against live
dev schema" items below must be checked before applying.)

What the migration does (per locked §8 decisions):
- **§8.1** `account_type text NOT NULL DEFAULT 'school'` on `students` + CHECK
  (`'school'|'parent'`). No-op backfill — existing learners default to `'school'`.
- **Tables** `guardians` (one per parent auth user; `plan` default `'free'`, `child_limit`
  default 1, `stripe_customer_id`, `trial_ends_at`) and `guardian_links`
  (guardian↔learner M:N, cascade both ways, indexed).
- **Helper** `get_my_guardian_id()` — SECURITY DEFINER, mirrors `get_my_school_id()`.
- **§8.2 combined SELECT** on `students`: replaced the open `USING (true)` with
  `account_type='school' OR (account_type='parent' AND id IN (guardian's links))`. School
  rows stay open (anon login depends on it); parent rows are guardian-scoped.
- **Guardian INSERT/UPDATE/DELETE** policies on `students` (additive alongside the teacher
  policies — they OR together; neither role can reach the other's learners).
- **`create_child(name)` RPC** — atomic insert-student + insert-link, enforces
  `child_limit` (freemium cap). Granted to `authenticated`.
- **RLS** on `guardians` (self-scoped by `auth.uid()`) and `guardian_links`
  (scoped by `get_my_guardian_id()`).
- **§8.3 write-grant confirmation:** `increment_progress` and `verify_student_login`
  already grant `authenticated`. `atomic_purchase` / `save_scientist_field` /
  `gift_owned_item` relied on the implicit PUBLIC default — made explicit in the migration.

Flagged for owner review before applying:
1. **Confirm against live dev schema** (no MCP this session): `students.class_id` and
   `students.student_code` are NULLable (migration drops NOT NULL defensively — no-op if
   already null); no trigger/constraint forces account_type-incompatible state.
2. **Child-data privacy (§5 flag):** `student_progress` / `student_character` SELECT stay
   open (`USING true`). Those rows hold no name/PII and aren't enumerable without the
   child's uuid, so decision §8.2 (which scopes the *name* row) is satisfied. Tightening
   them to guardian scope is an optional follow-up — **owner decision needed** on whether
   to do it now.

**NOT done / deliberately stopped:** migration not applied; no auth pages, no dashboard, no
billing. Stops at the approval gate.

**Next (after approval):** apply `parent_tier_schema.sql` to the dev/branch DB, smoke-test
`get_my_guardian_id()` + `create_child()` + the combined SELECT with two guardian sessions,
then proceed to P2 (parent sign-up / login).

---

## 2026-06-30 — Dark-launch directive + branch pushed

- Owner directive: **build the whole parent tier in the background, but expose NO public
  entry point** (no parent purchase/upgrade/signup links, pricing, etc.) until it is all set
  up and the owner gives explicit launch sign-off. Recorded as `PARENT_TIER.md` §3a and a
  new P7 launch phase. Pages may be built/committed but stay unlinked from the public site
  (direct-URL / flag-gated for testing); Stripe parent product stays test-mode until launch.
- Pushed `feature/parent-tier` to origin (upstream tracking set). No PR opened.

---

## 2026-06-30 — §8 decisions locked

Owner reviewed the five open questions and accepted the recommended answers in full
(recorded in `PARENT_TIER.md` §8). Summary:

1. `account_type` — explicit column on `students`, `DEFAULT 'school'`.
2. Parent-owned learner SELECT — guardian-scoped from day one (school rows stay open);
   needs `get_my_guardian_id()` helper + combined SELECT policy.
3. Child login — plays inside the parent's authenticated session, no code. School learners
   keep code login. P1 must confirm write-RPC grants reach `authenticated`.
4. Billing — freemium (reuse `daily_usage` caps) → flat household plan (~4 children),
   separate Stripe product, plan state on `guardians`.
5. Privacy — new separate consumer policy (parent as controller); keep `parent-privacy.html`
   as the school-context summary.

P1 (schema plan) is now unblocked.

---

## 2026-06-30 — P0 Scaffold

**Who/what:** Created the canonical spec and branch for the parent-owned account tier.

**Done:**
- Created branch `feature/parent-tier` off `main` (main was clean, up to date with origin).
- Authored `PARENT_TIER.md` — account model (locked decisions), existing-model facts pulled
  from current migrations, scope, AU privacy notes, hard constraints, proposed build order,
  and open questions for the owner.
- Created this session log.

**Context established (verified against `supabase/migrations/`):**
- Learner = `students` table, anon role, no auth identity. Login via
  `verify_student_login()` SECURITY DEFINER RPC.
- Teachers = Supabase Auth `authenticated`, linked via `teachers.auth_user_id`/`school_id`;
  helper `get_my_school_id()`. Legacy `teacher_accounts` table exists but is not the live
  auth path — do not build on it.
- Student writes go through SECURITY DEFINER RPCs; learner SELECT is currently open
  (`USING (true)`) because there is no anon identity to scope by. This is the main privacy
  tension for parent-owned learners (§3 of the spec).
- School RLS scopes teacher writes to `class_id IN (classes WHERE school_id = get_my_school_id())`.

**NOT done / deliberately stopped:** No schema, no RLS, no auth, no UI. Per the workflow,
P0 stops here for owner review before any schema or code work.

**Next session (P1 — schema plan):**
1. Read the *full live* schema + all RLS policies (not just migration files) via the
   dev-scoped Supabase MCP.
2. Resolve the open questions in `PARENT_TIER.md` §8 with the owner — especially
   `account_type` placement and parent-owned learner SELECT privacy.
3. Draft `guardians` / `guardian_links` / `account_type` migration as versioned files.
4. Document the combined teacher-OR-guardian RLS approach.
5. **Stop for approval before applying anything to the dev DB.**

**Open questions blocking P1:** see `PARENT_TIER.md` §8.
