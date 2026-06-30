# Parent Tier — Session Log

> Running log for the parent-owned account tier. **Newest entry at the top.**
> Read this after `PARENT_TIER.md` at the start of every session. Update it *as part of*
> the work, not afterwards.

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
