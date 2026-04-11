-- Stage-group targeting for spelling check-in sets
-- Mirror of add_word_list_stage_group.sql for class_spelling_sets.
-- Part of Phase 7 of the year-level system.

ALTER TABLE class_spelling_sets
  ADD COLUMN IF NOT EXISTS stage_group text;

ALTER TABLE class_spelling_sets
  DROP CONSTRAINT IF EXISTS class_spelling_sets_stage_group_check;

ALTER TABLE class_spelling_sets
  ADD CONSTRAINT class_spelling_sets_stage_group_check
  CHECK (stage_group IS NULL OR stage_group IN ('s2e','s2l','s3e','s3l','s4'));

CREATE INDEX IF NOT EXISTS class_spelling_sets_stage_group_idx
  ON class_spelling_sets(stage_group)
  WHERE stage_group IS NOT NULL;

COMMENT ON COLUMN class_spelling_sets.stage_group IS
  'Auto-assign this set to every student at this stage. NULL = manual assignment only.';
