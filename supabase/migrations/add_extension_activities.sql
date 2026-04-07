-- Per-activity extension toggles (Phase 10.5 / 7.17)
-- Empty array = all activities (backward compatible with existing extension_mode boolean)
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS extension_activities jsonb DEFAULT '[]'::jsonb;
