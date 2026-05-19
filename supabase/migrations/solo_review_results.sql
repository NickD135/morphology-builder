-- supabase/migrations/solo_review_results.sql
-- Stores each student's Unit Review sitting.
-- review_key = ISO startedAt timestamp from classes.settings.soloActiveReview
-- so results from different review sessions are kept separate.

CREATE TABLE solo_review_results (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id     uuid        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  unit_id      text        NOT NULL,
  review_key   text        NOT NULL,
  by_outcome   jsonb       NOT NULL,  -- {outcomeId: {short, passed, correct, total}}
  passed_count int         NOT NULL,
  total_count  int         NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, review_key)
);

ALTER TABLE solo_review_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solo_review_select" ON solo_review_results
  FOR SELECT USING (true);

CREATE POLICY "solo_review_insert" ON solo_review_results
  FOR INSERT WITH CHECK (true);

-- Primary query pattern: class + unit + review_key for teacher heatmap
CREATE INDEX IF NOT EXISTS idx_solo_review_class
  ON solo_review_results (class_id, unit_id, review_key);
