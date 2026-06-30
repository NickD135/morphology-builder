# PARENT_TIER.md — Parent-Owned Account Tier

> **READ THIS FIRST every session, then read `docs/parent-tier-session-log.md` before
> touching anything.** This is the canonical spec for the parent-owned account tier.
> It overrides assumptions; if reality and this doc disagree, fix the doc as part of the work.

Status: **SCAFFOLD complete; §8 decisions locked.** No schema, auth, or UI work has begun.
P1 (schema plan) is unblocked. Branch `feature/parent-tier`. Created 2026-06-30.

---

## 1. What we are building and why

Word Labs today is a **school product**: a teacher (Supabase Auth user) owns a school,
creates classes, and adds learner records (the `students` table). Learners log in with a
class code + a short personal code — there is no per-learner auth identity.

We are adding a **parent-owned account tier** that sits *alongside* the school product on
the same codebase and the same learner record:

- A **parent/guardian** signs up with their own email + password (Supabase Auth).
- They create one or more **children** as learner records — with **no school attached**.
- They see a parent dashboard of their child/children's progress and manage billing
  themselves (consumer subscription, separate from school seat licensing).
- The existing games, progress tracking, scientist, etc. all work unchanged for these
  learners.

The point is **one learner record, two ways to reach it**: via a teacher's class, or via a
guardian link — or, in future, both at once (a child who uses Word Labs at school *and* at
home).

---

## 2. Decided account model (DO NOT REDESIGN)

These decisions are locked by the project owner. Do not propose alternatives.

1. **The `students` table is the single unit of progress.** A parent's child is a normal
   `students` row. **Do NOT create a parallel "home student" / "home learner" concept.**
2. New tables to add:
   - **`guardians`** — one row per parent auth user (parallel to `teachers`).
   - **`guardian_links`** — join table linking a guardian to a learner (`students.id`),
     many-to-many (a guardian can have several children; a child *could* later be linked
     to two guardians, e.g. separated parents).
   - **`account_type`** flag — distinguishes school-owned vs parent-owned learners (exact
     placement TBD in the schema plan; likely on `students`, possibly a nullable
     `school_id`/`class_id` being the signal instead — to be decided in the migration plan,
     not here).
3. A learner is **visible** via **teacher class membership OR a guardian link** — combined
   RLS, not an either/or rewrite of the existing school policies.
4. A parent **must** be able to create a child with **no school and no class attached.**
   Today `students.class_id` is the anchor for school RLS; parent-owned learners will not
   have one, so the schema plan must handle a null/absent class without breaking existing
   school queries.
5. **Parent-tier billing is separate** from school seat licensing. Different Stripe
   product(s)/price(s); do not reuse the school annual price logic.

---

## 3. Existing model — facts the plan must respect

Pulled from current migrations (`supabase/migrations/`) on 2026-06-30:

- **Teachers** use the Supabase Auth `authenticated` role. Linked via
  `teachers.auth_user_id = auth.uid()`, `teachers.school_id → schools.id`.
  Helper: `get_my_school_id()` (SECURITY DEFINER) returns the caller's school.
  - Note: a legacy `teacher_accounts` table (email + `password_hash`) exists from
    `phase1_subscriptions.sql` but the live auth path is Supabase Auth via `teachers`.
    Do not build on `teacher_accounts`.
- **Learners (`students`)** use the **anon** role. They have **no auth identity**. Login is
  server-side via the `verify_student_login(class_id, student_id, code)` SECURITY DEFINER
  RPC, so the `student_code` column is never exposed to the client.
- **Student writes** (`student_progress`, quarks/XP, scientist) go through SECURITY DEFINER
  RPCs (`increment_progress`, atomic purchase/save) — RLS does not block them. Direct
  anon SELECT on these tables is currently open (`USING (true)`).
- **School RLS** (`rls_student_tables.sql`): teacher INSERT/UPDATE/DELETE on `students`,
  `student_progress`, `student_character`, `shop_items` is scoped to
  `class_id IN (SELECT id FROM classes WHERE school_id = get_my_school_id())`.
- Relevant `students` columns already in use: `class_id`, `student_code`, `name`,
  `extension_mode`, `support_mode`, `eald_language`, `stage`, `scientist`, `focus_words`,
  plus assessment/spelling fields.

**Tension to resolve in the schema plan, not here:** SELECT on learner data is currently
wide open (`USING (true)`) because anon students need to read their own rows and there is no
identity to scope by. Introducing guardian-scoped *read* privacy is a real design question
(parents should not be able to enumerate other families' children). The schema plan must
state explicitly whether/how parent-owned learner reads get tightened without breaking the
anon student-login flow. **Flag for owner review.**

---

## 3a. Dark launch — NO public entry point until fully ready (owner directive 2026-06-30)

**Build everything in the background; expose nothing to the public until the whole tier is
set up and approved.** Specifically:

- **No parent purchase/upgrade button, pricing, or "create a parent account" link anywhere
  in the live public UI** (landing page, footers, pricing, for-schools, etc.) until the
  owner says it is ready to launch.
- Pages and flows can be built and committed, but must be **unlinked/unreferenced** from the
  public site — reachable only by direct URL for testing, ideally auth- or flag-gated.
- Stripe parent product/checkout can exist in **test mode**, but no live purchase path is
  surfaced to real users until launch sign-off.
- The work proceeds normally on `feature/parent-tier`; this is about **what the public can
  see/reach**, not about slowing the build.
- Launch (adding the public entry points) is a **separate, explicit owner go-ahead** — treat
  it as its own final phase, after P1–P6.

## 4. Scope

### In scope (this feature)
- `guardians`, `guardian_links` tables + `account_type` signal (migration files only,
  applied to **dev/branch DB**, never prod).
- Combined RLS so a learner is reachable by teacher OR guardian.
- Guardian-scoped helper(s) analogous to `get_my_school_id()`.
- Parent sign-up / login (Supabase Auth) and a parent dashboard.
- Create-a-child flow with **no school**.
- Parent-tier billing (separate Stripe product/price, checkout, webhook handling, plan
  state on `guardians`).
- A consumer-facing privacy policy / consent capture appropriate to the Australian Privacy
  Principles (see §5).
- Self-QA of the parent dashboard via Playwright against the **dev** environment.

### Explicitly out of scope (do not build without a new decision)
- Any change to how teachers/schools work today beyond *additive* RLS.
- Migrating existing school learners to parent ownership.
- Multi-guardian conflict resolution UX (the schema allows it; the UI does not need it yet).
- Linking an existing school learner to a parent (future; design later).
- Reworking the games themselves.

---

## 5. Australian privacy & compliance notes

The parent tier is a **consumer product under the Australian Privacy Principles (APPs)** —
**not** the NSW DoE school-supplier regime that governs the school product. Different rules.

- In the school product, the **school is the data controller** and consent flows through the
  school. In the parent tier, **the parent is the consenting party** for their own child's
  data. We capture that consent directly.
- A **consumer privacy policy** and **parent consent capture** are **in scope** and required
  before the parent tier ships. (`parent-privacy.html` exists already — review whether it is
  the school-context parent summary or fit for the consumer tier; likely needs a distinct
  consumer policy.)
- Data residency unchanged: Supabase Sydney (`ap-southeast-2`).
- Data minimisation: keep collecting **child first name only** + progress. No surname, DOB,
  email, or photo for the child. The parent's email lives on the `guardians`/auth record,
  not the child's.
- **Anything that touches child-data handling must be flagged for owner review** before it
  ships — not decided unilaterally.

---

## 6. Hard constraints (from CLAUDE.md — repeated here so they are never missed)

- This codespace shares the **LIVE** Supabase used by the schools product.
  **NEVER run a schema migration against production.** Dev project or a Supabase branch
  only. Every schema change is a **versioned migration file** in `supabase/migrations/`,
  never ad hoc.
- The Supabase MCP server is scoped to the **dev** project only. Do not reach production.
- Before any schema change: read current schema + RLS + migrations, **propose the
  migration, and WAIT for approval** before applying.
- All parent work stays on **`feature/parent-tier`**. Never commit to `main`.
- Australian English everywhere (code comments, UI copy, docs). No AI-style em-dash copy.
- Use plan mode (Superpowers) for schema/auth/RLS work before implementing.

---

## 7. Build order (proposed — confirm before starting each phase)

Each phase stops for review. Nothing below §7.1 has been started.

- **P0 — Scaffold (this commit):** branch, this spec, session log. ✅ done, awaiting review.
- **P1 — Schema plan (NEXT, unblocked):** read full live schema + RLS via the dev-scoped
  Supabase MCP, write the `guardians` / `guardian_links` / `account_type` migration as files
  per the §8 decisions, add a `get_my_guardian_id()` helper, implement the combined
  teacher-OR-guardian SELECT policy, and confirm student-write RPC grants cover the
  `authenticated` role (§8.3). **Approval gate before applying to dev.**
- **P2 — Auth:** parent sign-up / login pages + session handling.
- **P3 — Create-a-child + parent dashboard:** no-school learner creation, progress view.
- **P4 — Billing:** separate Stripe product, checkout, webhook, plan state.
- **P5 — Privacy/consent:** consumer privacy policy + consent capture.
- **P6 — QA:** Playwright self-QA on dev; accessibility pass.
- **P7 — Launch (separate owner go-ahead):** add the public entry points (parent
  signup/pricing/purchase links) only after explicit launch sign-off. See §3a — nothing
  public-facing is surfaced before this.

---

## 8. Decisions (locked by owner 2026-06-30)

These were the open questions; the owner accepted the recommended answers in full.

1. **`account_type` placement — DECIDED: explicit column on `students`.**
   Add `account_type text NOT NULL DEFAULT 'school'` (values `'school'` | `'parent'`).
   Do **not** infer ownership from "no class". Inference breaks once a learner is used at
   school *and* home (an allowed future state), and is fragile to hang RLS/billing on. The
   migration is a no-op backfill — every existing learner is already `'school'` via default.

2. **Parent-owned learner SELECT privacy — DECIDED: guardian-scoped from day one.**
   School learner rows keep their existing open SELECT (anon student login depends on it).
   Parent-owned rows (`account_type = 'parent'`) are readable **only** by a linked guardian.
   Combined SELECT policy shape: `account_type = 'school' OR (account_type = 'parent' AND id
   IN (SELECT learner_id FROM guardian_links WHERE guardian_id = get_my_guardian_id()))`.
   Needs a `get_my_guardian_id()` helper analogous to `get_my_school_id()`. Cleanly possible
   because of decision 3 — parent-owned rows are only ever read through an authenticated
   guardian session, so scoping them does not touch the anon flow.

3. **Child login — DECIDED: plays inside the parent's authenticated session (no code).**
   At home it is the parent's device/account: parent logs in, selects the child, hands over
   the device. School learners keep their existing class-code + personal-code login,
   untouched. (Per-child codes can be added later if a child needs their own device; out of
   scope for v1.) P1 must confirm the student-write RPCs (`increment_progress`, atomic
   purchase/save) are granted to the `authenticated` role, not only `anon`.

4. **Billing — DECIDED: freemium → flat household subscription.**
   Free tier: one child, capped (reuse the existing `daily_usage` infrastructure from
   `phase1_subscriptions.sql` to enforce caps). Paid: a single household plan covering up to
   ~4 children, monthly or annual. One new Stripe product, **separate** from school
   licensing. Plan state lives on `guardians`. Exact price point is the owner's call at P4.

5. **Consumer privacy policy — DECIDED: author a new separate policy.**
   Keep `parent-privacy.html` as the school-context summary (it names the *school* as data
   controller). Author a new consumer-tier privacy policy where the **parent** is the data
   controller and consent flows directly from them, with explicit parent-consent capture at
   child creation. Scheduled for P5.

---

## 9. Session log

The running log lives in **`docs/parent-tier-session-log.md`**. Update it **as part of**
each session's work, not after. Newest entry at the top.
