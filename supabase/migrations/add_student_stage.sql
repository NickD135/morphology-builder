-- Add stage progression columns to students table
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS stage_overrides jsonb DEFAULT '{}'::jsonb;

-- Constrain stage to valid values (null allowed = unassigned)
ALTER TABLE students
  DROP CONSTRAINT IF EXISTS students_stage_check;

ALTER TABLE students
  ADD CONSTRAINT students_stage_check
  CHECK (stage IS NULL OR stage IN ('s2e','s2l','s3e','s3l','s4'));

-- Index for stage-based filtering on the dashboard
CREATE INDEX IF NOT EXISTS students_stage_idx ON students(stage) WHERE stage IS NOT NULL;

COMMENT ON COLUMN students.stage IS 'Curriculum stage: s2e=Explorer, s2l=Voyager, s3e=Wanderer, s3l=Trailblazer, s4=Pioneer, NULL=unassigned';
COMMENT ON COLUMN students.stage_overrides IS 'Per-activity stage overrides, e.g. {"sound-sorter":"s2e"}';
