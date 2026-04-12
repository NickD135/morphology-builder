-- word_corrections: teacher overrides for game word data
-- Only the teacher who created the correction can edit it.
-- All corrections are readable by anon (so games can load them).

CREATE TABLE IF NOT EXISTS word_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game text NOT NULL,
  word_key text NOT NULL,
  corrections jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(game, word_key)
);

-- Index for fast lookups by game
CREATE INDEX IF NOT EXISTS idx_word_corrections_game ON word_corrections(game);

-- RLS
ALTER TABLE word_corrections ENABLE ROW LEVEL SECURITY;

-- Anyone can read corrections (games need them via anon key)
CREATE POLICY "word_corrections_select" ON word_corrections
  FOR SELECT USING (true);

-- Only authenticated teachers can insert/update/delete
CREATE POLICY "word_corrections_insert" ON word_corrections
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT auth_user_id FROM teachers)
  );

CREATE POLICY "word_corrections_update" ON word_corrections
  FOR UPDATE USING (
    auth.uid() IN (SELECT auth_user_id FROM teachers)
  );

CREATE POLICY "word_corrections_delete" ON word_corrections
  FOR DELETE USING (
    auth.uid() IN (SELECT auth_user_id FROM teachers)
  );
