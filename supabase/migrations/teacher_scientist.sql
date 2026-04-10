-- Add scientist jsonb column to teachers table
-- Stores the teacher's scientist character customisation (same format as student_character.scientist)
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS scientist jsonb DEFAULT '{}';
