-- Stage-group targeting for custom word lists
-- Part of Phase 7 of the year-level system (see 2026-04-10-year-level-system-design.md)
-- A non-null stage_group means the list is automatically assigned to every
-- student currently at that stage. Individual word_list_assignments continue
-- to work in parallel.

ALTER TABLE class_word_lists
  ADD COLUMN IF NOT EXISTS stage_group text;

ALTER TABLE class_word_lists
  DROP CONSTRAINT IF EXISTS class_word_lists_stage_group_check;

ALTER TABLE class_word_lists
  ADD CONSTRAINT class_word_lists_stage_group_check
  CHECK (stage_group IS NULL OR stage_group IN ('s2e','s2l','s3e','s3l','s4'));

CREATE INDEX IF NOT EXISTS class_word_lists_stage_group_idx
  ON class_word_lists(stage_group)
  WHERE stage_group IS NOT NULL;

COMMENT ON COLUMN class_word_lists.stage_group IS
  'Auto-assign this list to every student at this stage. NULL = manual assignment only.';
