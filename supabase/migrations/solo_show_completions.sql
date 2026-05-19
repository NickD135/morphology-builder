-- supabase/migrations/solo_show_completions.sql
-- Stores teacher tick-offs for construct outcomes (Show tasks).
-- One row per student per outcome = teacher has verified the construct task.
-- Tick = insert. Untick = delete.

CREATE TABLE solo_show_completions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id    uuid        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  unit_id     text        NOT NULL,
  outcome_id  text        NOT NULL,
  ticked_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, unit_id, outcome_id)
);

ALTER TABLE solo_show_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solo_show_select" ON solo_show_completions
  FOR SELECT USING (true);

CREATE POLICY "solo_show_insert" ON solo_show_completions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "solo_show_delete" ON solo_show_completions
  FOR DELETE USING (true);

-- Primary query pattern: class + unit for teacher heatmap
CREATE INDEX IF NOT EXISTS idx_solo_show_class
  ON solo_show_completions (class_id, unit_id);
