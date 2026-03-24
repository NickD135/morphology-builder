-- RLS Hardening: students, student_progress, student_character, shop_items
-- Run this in Supabase SQL Editor
--
-- Context:
--   Students use the anon role (no Supabase Auth — they log in via class code + name).
--   Teachers use the authenticated role (Supabase Auth).
--   Teacher → school link: teachers.auth_user_id = auth.uid(), teachers.school_id → schools.id
--   School → class link: classes.school_id = schools.id
--   Class → student link: students.class_id = classes.id

-- ═══════════════════════════════════════════════════════════════
-- Helper: get the current teacher's school_id
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_my_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT school_id FROM teachers WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 1. STUDENTS table
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Anyone can read students (anon needs this for student login flow)
CREATE POLICY "Anyone can read students"
  ON students FOR SELECT
  USING (true);

-- Only authenticated teachers can insert students into their school's classes
CREATE POLICY "Teachers insert students in own school"
  ON students FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND class_id IN (
      SELECT id FROM classes WHERE school_id = get_my_school_id()
    )
  );

-- Only authenticated teachers can update students in their school's classes
CREATE POLICY "Teachers update students in own school"
  ON students FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND class_id IN (
      SELECT id FROM classes WHERE school_id = get_my_school_id()
    )
  );

-- Only authenticated teachers can delete students in their school's classes
CREATE POLICY "Teachers delete students in own school"
  ON students FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND class_id IN (
      SELECT id FROM classes WHERE school_id = get_my_school_id()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 2. STUDENT_PROGRESS table
--    Writes happen via increment_progress() RPC (SECURITY DEFINER)
--    so RLS does not block those. Direct inserts/updates are blocked.
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- Anyone can read progress (students see own data, teachers see dashboard)
CREATE POLICY "Anyone can read student_progress"
  ON student_progress FOR SELECT
  USING (true);

-- No direct inserts from client — all writes go through increment_progress RPC
-- (SECURITY DEFINER bypasses RLS)

-- Only authenticated teachers can delete progress (class deletion cleanup)
CREATE POLICY "Teachers delete progress in own school"
  ON student_progress FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND student_id IN (
      SELECT s.id FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE c.school_id = get_my_school_id()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 3. STUDENT_CHARACTER table
--    Students (anon) need to read + upsert their own character.
--    We can't scope anon writes to "own" student because there's
--    no auth identity — but we allow INSERT/UPDATE and restrict DELETE.
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE student_character ENABLE ROW LEVEL SECURITY;

-- Anyone can read character data
CREATE POLICY "Anyone can read student_character"
  ON student_character FOR SELECT
  USING (true);

-- Anon and authenticated can insert character data
-- (students create their character record on first play)
CREATE POLICY "Anyone can insert student_character"
  ON student_character FOR INSERT
  WITH CHECK (true);

-- Anon and authenticated can update character data
-- (students save scientist outfit, earn quarks/XP, purchase items)
CREATE POLICY "Anyone can update student_character"
  ON student_character FOR UPDATE
  USING (true);

-- Only authenticated teachers can delete character data (class deletion cleanup)
CREATE POLICY "Teachers delete character in own school"
  ON student_character FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND student_id IN (
      SELECT s.id FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE c.school_id = get_my_school_id()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 4. SHOP_ITEMS table
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read shop items (students browse the shop)
CREATE POLICY "Anyone can read shop_items"
  ON shop_items FOR SELECT
  USING (true);

-- Only authenticated teachers can insert items for their school
CREATE POLICY "Teachers insert shop_items for own school"
  ON shop_items FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND school_id = get_my_school_id()
  );

-- Only authenticated teachers can update items for their school
CREATE POLICY "Teachers update shop_items for own school"
  ON shop_items FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND school_id = get_my_school_id()
  );

-- Only authenticated teachers can delete items for their school
CREATE POLICY "Teachers delete shop_items for own school"
  ON shop_items FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND school_id = get_my_school_id()
  );
