-- supabase/migrations/solo_hidden_students.sql
-- Lets teachers exclude students from a maths group view without deleting them.
-- A row here means the student is hidden from that class's SOLO tracker view.

CREATE TABLE solo_hidden_students (
  class_id   uuid NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, student_id)
);

ALTER TABLE solo_hidden_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solo_hidden_select" ON solo_hidden_students
  FOR SELECT USING (true);

CREATE POLICY "solo_hidden_insert" ON solo_hidden_students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "solo_hidden_delete" ON solo_hidden_students
  FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_solo_hidden_class
  ON solo_hidden_students (class_id);
