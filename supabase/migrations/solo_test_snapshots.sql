-- supabase/migrations/solo_test_snapshots.sql
-- Stores each completed pre/post test sitting as an immutable snapshot.
-- First snapshot for a (student, unit) pair is the pre-test;
-- subsequent snapshots are post-tests.

CREATE TABLE solo_test_snapshots (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  unit_id      text        NOT NULL,
  by_outcome   jsonb       NOT NULL,  -- {outcomeId: {short, correct, total, passed, band}}
  passed_count int         NOT NULL,
  total_count  int         NOT NULL,
  taken_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE solo_test_snapshots ENABLE ROW LEVEL SECURITY;

-- Open read: teachers need to see all students' snapshots for their class
CREATE POLICY "solo_snapshots_select" ON solo_test_snapshots
  FOR SELECT USING (true);

-- Open insert: students are anonymous users (no auth.uid())
CREATE POLICY "solo_snapshots_insert" ON solo_test_snapshots
  FOR INSERT WITH CHECK (true);

-- Primary query pattern: student_id + unit_id ordered by taken_at
CREATE INDEX IF NOT EXISTS idx_solo_snapshots_student
  ON solo_test_snapshots (student_id, unit_id, taken_at);
