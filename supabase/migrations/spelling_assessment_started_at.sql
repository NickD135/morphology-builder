-- Track when each check-in was started so repeated check-ins on the same set
-- can be distinguished (students' completion flags use this timestamp)
ALTER TABLE class_spelling_sets ADD COLUMN IF NOT EXISTS assessment_started_at timestamptz;
