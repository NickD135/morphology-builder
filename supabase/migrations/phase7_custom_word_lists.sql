-- Phase 7: Custom Word Lists
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS class_word_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  words jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookup by class
CREATE INDEX IF NOT EXISTS idx_word_lists_class ON class_word_lists(class_id);

-- RLS: anyone can read (students need to load lists), authenticated can write
ALTER TABLE class_word_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read word lists" ON class_word_lists
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert word lists" ON class_word_lists
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update word lists" ON class_word_lists
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete word lists" ON class_word_lists
  FOR DELETE USING (auth.role() = 'authenticated');
