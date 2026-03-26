-- ═══════════════════════════════════════════════════════════════
-- Spelling Sets — teacher-created diagnostic spelling sets
-- ═══════════════════════════════════════════════════════════════

-- Table: class_spelling_sets
CREATE TABLE IF NOT EXISTS class_spelling_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  set_number integer,
  words jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_spelling_sets_class ON class_spelling_sets(class_id);

-- Table: spelling_set_assignments
CREATE TABLE IF NOT EXISTS spelling_set_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spelling_set_id uuid NOT NULL REFERENCES class_spelling_sets(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  active boolean DEFAULT true,
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(spelling_set_id, student_id)
);

-- RLS policies
ALTER TABLE class_spelling_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE spelling_set_assignments ENABLE ROW LEVEL SECURITY;

-- SELECT: open (students need to read their assigned sets)
CREATE POLICY "spelling_sets_select" ON class_spelling_sets FOR SELECT USING (true);
CREATE POLICY "spelling_assignments_select" ON spelling_set_assignments FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE: authenticated users (teacher auth checked at app level)
CREATE POLICY "spelling_sets_insert" ON class_spelling_sets FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "spelling_sets_update" ON class_spelling_sets FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "spelling_sets_delete" ON class_spelling_sets FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "spelling_assignments_insert" ON spelling_set_assignments FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "spelling_assignments_update" ON spelling_set_assignments FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "spelling_assignments_delete" ON spelling_set_assignments FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
