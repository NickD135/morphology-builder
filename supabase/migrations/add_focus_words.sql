-- Focus words for spelling check-ins (Phase 7.17)
-- Wrong words from check-ins are saved here and feed into practice games
-- until the teacher clears them.
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS focus_words jsonb DEFAULT '[]'::jsonb;
