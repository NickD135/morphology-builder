-- Add assessment mode column: 'student' (TTS self-paced) or 'teacher' (teacher reads aloud)
ALTER TABLE class_spelling_sets ADD COLUMN IF NOT EXISTS assessment_mode text DEFAULT 'student';
