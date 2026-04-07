-- ═══════════════════════════════════════════════════════════════
-- RLS Tightening: class_word_lists, class_spelling_sets,
--                 spelling_set_assignments, spelling_check_in_results
--
-- Problem: These tables had overly permissive write policies.
--   - class_word_lists: any authenticated user could write (no school scoping)
--   - class_spelling_sets: anon could write (should be teacher-only)
--   - spelling_set_assignments: anon could write (should be teacher-only)
--   - spelling_check_in_results: anyone could delete (should be teacher-only)
--
-- Fix: Scope all teacher writes via class_id → classes.school_id chain
--      using the existing get_my_school_id() helper.
--
-- Run this in Supabase SQL Editor AFTER rls_student_tables.sql
-- (which creates the get_my_school_id() function).
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1. CLASS_WORD_LISTS — scope writes to teacher's school
-- ───────────────────────────────────────────────────────────────

-- Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert word lists" ON class_word_lists;
DROP POLICY IF EXISTS "Authenticated users can update word lists" ON class_word_lists;
DROP POLICY IF EXISTS "Authenticated users can delete word lists" ON class_word_lists;

-- New: teacher can only insert word lists for classes in their school
CREATE POLICY "Teachers insert word lists in own school"
  ON class_word_lists FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND class_id IN (
      SELECT id FROM classes WHERE school_id = get_my_school_id()
    )
  );

-- New: teacher can only update word lists for classes in their school
CREATE POLICY "Teachers update word lists in own school"
  ON class_word_lists FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND class_id IN (
      SELECT id FROM classes WHERE school_id = get_my_school_id()
    )
  );

-- New: teacher can only delete word lists for classes in their school
CREATE POLICY "Teachers delete word lists in own school"
  ON class_word_lists FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND class_id IN (
      SELECT id FROM classes WHERE school_id = get_my_school_id()
    )
  );


-- ───────────────────────────────────────────────────────────────
-- 2. CLASS_SPELLING_SETS — remove anon access, scope to school
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "spelling_sets_insert" ON class_spelling_sets;
DROP POLICY IF EXISTS "spelling_sets_update" ON class_spelling_sets;
DROP POLICY IF EXISTS "spelling_sets_delete" ON class_spelling_sets;

CREATE POLICY "Teachers insert spelling sets in own school"
  ON class_spelling_sets FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND class_id IN (
      SELECT id FROM classes WHERE school_id = get_my_school_id()
    )
  );

CREATE POLICY "Teachers update spelling sets in own school"
  ON class_spelling_sets FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND class_id IN (
      SELECT id FROM classes WHERE school_id = get_my_school_id()
    )
  );

CREATE POLICY "Teachers delete spelling sets in own school"
  ON class_spelling_sets FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND class_id IN (
      SELECT id FROM classes WHERE school_id = get_my_school_id()
    )
  );


-- ───────────────────────────────────────────────────────────────
-- 3. SPELLING_SET_ASSIGNMENTS — remove anon access, scope to school
--    Scoped via spelling_set → class_spelling_sets.class_id → classes.school_id
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "spelling_assignments_insert" ON spelling_set_assignments;
DROP POLICY IF EXISTS "spelling_assignments_update" ON spelling_set_assignments;
DROP POLICY IF EXISTS "spelling_assignments_delete" ON spelling_set_assignments;

CREATE POLICY "Teachers insert spelling assignments in own school"
  ON spelling_set_assignments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND spelling_set_id IN (
      SELECT ss.id FROM class_spelling_sets ss
      JOIN classes c ON ss.class_id = c.id
      WHERE c.school_id = get_my_school_id()
    )
  );

CREATE POLICY "Teachers update spelling assignments in own school"
  ON spelling_set_assignments FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND spelling_set_id IN (
      SELECT ss.id FROM class_spelling_sets ss
      JOIN classes c ON ss.class_id = c.id
      WHERE c.school_id = get_my_school_id()
    )
  );

CREATE POLICY "Teachers delete spelling assignments in own school"
  ON spelling_set_assignments FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND spelling_set_id IN (
      SELECT ss.id FROM class_spelling_sets ss
      JOIN classes c ON ss.class_id = c.id
      WHERE c.school_id = get_my_school_id()
    )
  );


-- ───────────────────────────────────────────────────────────────
-- 4. SPELLING_CHECK_IN_RESULTS
--    INSERT stays open (anon students submit their own results).
--    DELETE tightened to teacher's school only.
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Teachers can delete check-in results" ON spelling_check_in_results;

CREATE POLICY "Teachers delete check-in results in own school"
  ON spelling_check_in_results FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND spelling_set_id IN (
      SELECT ss.id FROM class_spelling_sets ss
      JOIN classes c ON ss.class_id = c.id
      WHERE c.school_id = get_my_school_id()
    )
  );
