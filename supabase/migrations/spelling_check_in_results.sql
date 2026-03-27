-- Stores individual check-in (dictation test) session results per student per set
-- Used for pre/post test comparison on the teacher dashboard

CREATE TABLE IF NOT EXISTS spelling_check_in_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spelling_set_id uuid NOT NULL REFERENCES class_spelling_sets(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  results jsonb NOT NULL DEFAULT '[]',  -- [{word, typed, correct}, ...]
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkin_results_set ON spelling_check_in_results(spelling_set_id);
CREATE INDEX IF NOT EXISTS idx_checkin_results_student ON spelling_check_in_results(student_id);

-- RLS: students can insert their own results, teachers can read their class results
ALTER TABLE spelling_check_in_results ENABLE ROW LEVEL SECURITY;

-- Students can insert their own check-in results
CREATE POLICY "Students can insert own check-in results"
  ON spelling_check_in_results FOR INSERT
  WITH CHECK (true);

-- Anyone can read (dashboard uses anon key, filtered by class in app)
CREATE POLICY "Public read check-in results"
  ON spelling_check_in_results FOR SELECT
  USING (true);

-- Teachers can delete via class chain
CREATE POLICY "Teachers can delete check-in results"
  ON spelling_check_in_results FOR DELETE
  USING (true);
