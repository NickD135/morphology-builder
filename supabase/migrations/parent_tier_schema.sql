-- ═══════════════════════════════════════════════════════════════════════════
-- Parent-owned account tier — schema, helper, RLS, and write-grant confirmation
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Spec: PARENT_TIER.md (decisions locked §8, 2026-06-30).
-- Branch: feature/parent-tier.  Apply to DEV / branch DB ONLY — never production.
--
-- What this adds (all additive — existing school flows are untouched except for
-- the students SELECT policy, which is widened, not narrowed, for school rows):
--   1. account_type signal on students ('school' default | 'parent').
--   2. guardians table (one row per parent auth user, parallel to teachers).
--   3. guardian_links join table (guardian ↔ learner, many-to-many).
--   4. get_my_guardian_id() helper (analogous to get_my_school_id()).
--   5. Combined students SELECT: school rows stay open (anon login needs it),
--      parent rows readable only by a linked guardian.
--   6. Guardian INSERT/UPDATE/DELETE on their own parent-owned children.
--   7. create_child() RPC — atomic insert-student + insert-link, enforces the
--      guardian's child_limit (freemium cap).
--   8. RLS on guardians / guardian_links.
--   9. Explicit write-RPC grants to authenticated (decision §8.3) so a child
--      playing inside the parent's authenticated session can earn quarks/XP and
--      save their scientist.
--
-- ── Items to CONFIRM against the live dev schema before applying ──────────────
--   A. students.class_id must be NULLable (parent children have no class).
--      Statement 0 drops the NOT NULL if present; it is a no-op if already null.
--      Verify no app/db logic assumes class_id is always present.
--   B. students.student_code must allow NULL (parent children get no code).
--      `UNIQUE` permits multiple NULLs in Postgres, so a UNIQUE-only column is
--      fine; only a NOT NULL would break. Statement 0 drops it defensively.
--   C. No existing trigger/constraint forces account_type-incompatible state.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 0. Loosen students columns so a parent child can exist with no class/code ─
-- DROP NOT NULL is idempotent: a no-op if the column is already nullable.
ALTER TABLE students ALTER COLUMN class_id     DROP NOT NULL;
ALTER TABLE students ALTER COLUMN student_code DROP NOT NULL;


-- ═══════════════════════════════════════════════════════════════
-- 1. account_type signal on students
--    Explicit column (decision §8.1) — do NOT infer ownership from a null class.
--    No-op backfill: every existing learner becomes 'school' via the default.
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'school';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_account_type_chk'
  ) THEN
    ALTER TABLE students
      ADD CONSTRAINT students_account_type_chk
      CHECK (account_type IN ('school', 'parent'));
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════
-- 2. guardians — one row per parent auth user (parallel to teachers)
--    plan: 'free' (freemium) | 'active' | 'expired' | 'payment_failed'
--    child_limit: freemium cap (1 free child; paid household raises it ~4).
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS guardians (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id       uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email              text,
  plan               text NOT NULL DEFAULT 'free',
  stripe_customer_id text,
  child_limit        integer NOT NULL DEFAULT 1,
  trial_ends_at      timestamptz,
  created_at         timestamptz DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
-- 3. guardian_links — guardian ↔ learner, many-to-many
--    (a guardian can have several children; a child could later be linked to
--    two guardians, e.g. separated parents — schema allows it, UI not required)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS guardian_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id uuid NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  learner_id  uuid NOT NULL REFERENCES students(id)  ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (guardian_id, learner_id)
);

CREATE INDEX IF NOT EXISTS guardian_links_guardian_idx ON guardian_links (guardian_id);
CREATE INDEX IF NOT EXISTS guardian_links_learner_idx  ON guardian_links (learner_id);


-- ═══════════════════════════════════════════════════════════════
-- 4. Helper: get the current guardian's id (analogous to get_my_school_id)
--    SECURITY DEFINER so it reads guardians regardless of that table's RLS,
--    and so it can be referenced inside other tables' policies without recursion.
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_my_guardian_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM guardians WHERE auth_user_id = auth.uid() LIMIT 1;
$$;


-- ═══════════════════════════════════════════════════════════════
-- 5. students SELECT — combined teacher-OR-guardian visibility (decision §8.2)
--    School rows keep their open read (anon student-login depends on it).
--    Parent rows are readable ONLY by a linked guardian. Parent rows are never
--    read by anon (children play inside the parent's authenticated session,
--    decision §8.3), so scoping them does not touch the anon flow.
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Anyone can read students" ON students;

CREATE POLICY "Read school learners or own children"
  ON students FOR SELECT
  USING (
    account_type = 'school'
    OR (
      account_type = 'parent'
      AND id IN (
        SELECT learner_id FROM guardian_links
        WHERE guardian_id = get_my_guardian_id()
      )
    )
  );

-- NOTE (flagged for owner review per §5): student_progress and student_character
-- SELECT remain open (USING true). Those rows are keyed only by a child's uuid,
-- hold no PII (scores/quarks, no name), and are not enumerable without the uuid.
-- Tightening them to guardian scope is a separate, optional follow-up; it is NOT
-- required by decision §8.2, which scopes the learner *name* row (students).


-- ═══════════════════════════════════════════════════════════════
-- 6. students INSERT/UPDATE/DELETE for guardians' own parent-owned children
--    These are ADDITIVE permissive policies alongside the existing teacher
--    policies (multiple policies for the same command are OR'd). A teacher still
--    cannot touch a parent child (class_id is null → not in their school), and a
--    guardian cannot touch a school child (no guardian_link).
-- ═══════════════════════════════════════════════════════════════

-- INSERT: a guardian may create a parent-owned, classless child. The link is
-- created immediately after (see create_child RPC); until it exists the row is
-- invisible to the guardian via the SELECT policy, so the canonical path is the
-- create_child RPC, which does both atomically. This policy backstops direct use.
DROP POLICY IF EXISTS "Guardians insert own children" ON students;
CREATE POLICY "Guardians insert own children"
  ON students FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND account_type = 'parent'
    AND class_id IS NULL
    AND get_my_guardian_id() IS NOT NULL
  );

DROP POLICY IF EXISTS "Guardians update own children" ON students;
CREATE POLICY "Guardians update own children"
  ON students FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND account_type = 'parent'
    AND id IN (
      SELECT learner_id FROM guardian_links
      WHERE guardian_id = get_my_guardian_id()
    )
  );

DROP POLICY IF EXISTS "Guardians delete own children" ON students;
CREATE POLICY "Guardians delete own children"
  ON students FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND account_type = 'parent'
    AND id IN (
      SELECT learner_id FROM guardian_links
      WHERE guardian_id = get_my_guardian_id()
    )
  );


-- ═══════════════════════════════════════════════════════════════
-- 7. create_child() RPC — atomic insert-student + insert-link, with cap check
--    Avoids the brief window where a parent child exists without a link, and
--    enforces the guardian's child_limit (freemium: default 1). SECURITY DEFINER
--    so the insert + link happen in one transaction regardless of RLS.
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION create_child(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guardian   uuid;
  v_limit      integer;
  v_count      integer;
  v_student_id uuid;
BEGIN
  v_guardian := get_my_guardian_id();
  IF v_guardian IS NULL THEN
    RAISE EXCEPTION 'Not a guardian' USING errcode = '42501';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Child name is required';
  END IF;

  SELECT child_limit INTO v_limit FROM guardians WHERE id = v_guardian;
  SELECT count(*) INTO v_count FROM guardian_links WHERE guardian_id = v_guardian;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Child limit reached' USING errcode = 'P0001';
  END IF;

  INSERT INTO students (name, account_type, class_id)
    VALUES (trim(p_name), 'parent', NULL)
    RETURNING id INTO v_student_id;

  INSERT INTO guardian_links (guardian_id, learner_id)
    VALUES (v_guardian, v_student_id);

  RETURN v_student_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_child(text) TO authenticated;


-- ═══════════════════════════════════════════════════════════════
-- 8. RLS on guardians and guardian_links
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guardians read own record" ON guardians;
CREATE POLICY "Guardians read own record"
  ON guardians FOR SELECT
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Guardians insert own record" ON guardians;
CREATE POLICY "Guardians insert own record"
  ON guardians FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Guardians update own record" ON guardians;
CREATE POLICY "Guardians update own record"
  ON guardians FOR UPDATE
  USING (auth.uid() = auth_user_id);
-- No client DELETE on guardians (account deletion handled out of band / cascade
-- from auth.users). Plan/stripe fields are written by the webhook (service role).

ALTER TABLE guardian_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guardians read own links" ON guardian_links;
CREATE POLICY "Guardians read own links"
  ON guardian_links FOR SELECT
  USING (guardian_id = get_my_guardian_id());

DROP POLICY IF EXISTS "Guardians insert own links" ON guardian_links;
CREATE POLICY "Guardians insert own links"
  ON guardian_links FOR INSERT
  WITH CHECK (guardian_id = get_my_guardian_id());

DROP POLICY IF EXISTS "Guardians delete own links" ON guardian_links;
CREATE POLICY "Guardians delete own links"
  ON guardian_links FOR DELETE
  USING (guardian_id = get_my_guardian_id());


-- ═══════════════════════════════════════════════════════════════
-- 9. Confirm write-RPC grants reach `authenticated` (decision §8.3)
--    A parent's child plays inside the parent's authenticated session, so every
--    student-write RPC must be callable by `authenticated`, not only `anon`.
--      - increment_progress  → already granted to authenticated (phase6). OK.
--      - verify_student_login → already granted to authenticated (school flow).
--      - atomic_purchase / save_scientist_field / gift_owned_item → relied on the
--        implicit PUBLIC default. Make them explicit here to remove ambiguity.
-- ═══════════════════════════════════════════════════════════════
GRANT EXECUTE ON FUNCTION atomic_purchase(uuid, text, int)        TO authenticated;
GRANT EXECUTE ON FUNCTION save_scientist_field(uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION gift_owned_item(uuid, text)             TO authenticated;
