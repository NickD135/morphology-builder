-- Add scientist jsonb column to teachers table
-- Stores the teacher's scientist character customisation (same format as student_character.scientist)
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS scientist jsonb DEFAULT '{}';

-- Ensure teachers can update their own scientist field
-- (may already exist from earlier setup — DROP IF EXISTS to be safe)
DROP POLICY IF EXISTS "Teachers can update own record" ON teachers;
CREATE POLICY "Teachers can update own record" ON teachers
  FOR UPDATE USING (auth.uid() = auth_user_id);
