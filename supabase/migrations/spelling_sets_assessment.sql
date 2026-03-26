-- Add assessment scheduling columns to class_spelling_sets
ALTER TABLE class_spelling_sets ADD COLUMN IF NOT EXISTS assessment_active boolean DEFAULT false;
ALTER TABLE class_spelling_sets ADD COLUMN IF NOT EXISTS assessment_scheduled_at timestamptz;
