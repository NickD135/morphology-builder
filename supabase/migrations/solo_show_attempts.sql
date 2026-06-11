-- supabase/migrations/solo_show_attempts.sql
-- One row per completed "Show" attempt (the in-activity assessment).
-- Used by the teacher dashboard to show attempt history + a likely-guessing flag.
-- Open RLS mirrors solo_test_snapshots: students are anonymous (no auth.uid()).

CREATE TABLE solo_show_attempts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id    uuid        REFERENCES classes(id) ON DELETE CASCADE,
  unit_id     text        NOT NULL,
  outcome_id  text        NOT NULL,
  correct     int         NOT NULL,
  total       int         NOT NULL,
  passed      bool        NOT NULL,
  answers     jsonb       NOT NULL,   -- [{text, type, given, correct, ms}, ...]
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE solo_show_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solo_attempts_select" ON solo_show_attempts
  FOR SELECT USING (true);

CREATE POLICY "solo_attempts_insert" ON solo_show_attempts
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_solo_attempts_student
  ON solo_show_attempts (student_id, unit_id, created_at);
