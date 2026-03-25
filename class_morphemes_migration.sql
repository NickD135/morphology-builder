-- Migration: Create class_morphemes and morpheme_set_assignments tables
-- Run this in Supabase SQL Editor

CREATE TABLE class_morphemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  morphemes jsonb NOT NULL DEFAULT '[]',
  games jsonb DEFAULT '["meaning","mission"]',
  priority text DEFAULT 'mixed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE class_morphemes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read class morphemes" ON class_morphemes
  FOR SELECT USING (true);

CREATE POLICY "Teachers can insert morphemes for own classes" ON class_morphemes
  FOR INSERT WITH CHECK (
    class_id IN (SELECT id FROM classes WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Teachers can update morphemes for own classes" ON class_morphemes
  FOR UPDATE USING (
    class_id IN (SELECT id FROM classes WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Teachers can delete morphemes for own classes" ON class_morphemes
  FOR DELETE USING (
    class_id IN (SELECT id FROM classes WHERE auth_user_id = auth.uid())
  );

-- Student assignment table for morpheme sets
CREATE TABLE morpheme_set_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  morpheme_set_id uuid REFERENCES class_morphemes(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(morpheme_set_id, student_id)
);

ALTER TABLE morpheme_set_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read morpheme assignments" ON morpheme_set_assignments
  FOR SELECT USING (true);

CREATE POLICY "Teachers can insert morpheme assignments" ON morpheme_set_assignments
  FOR INSERT WITH CHECK (
    morpheme_set_id IN (
      SELECT cm.id FROM class_morphemes cm
      JOIN classes c ON cm.class_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete morpheme assignments" ON morpheme_set_assignments
  FOR DELETE USING (
    morpheme_set_id IN (
      SELECT cm.id FROM class_morphemes cm
      JOIN classes c ON cm.class_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );
