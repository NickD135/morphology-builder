-- supabase/migrations/solo_resources.sql
-- Create solo_resources table for storing curriculum resources (videos, websites, PDFs, games, questions)

CREATE TABLE solo_resources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     text NOT NULL,
  outcome_id  text NOT NULL,
  type        text NOT NULL CHECK (type IN ('video','website','pdf','game','question')),
  label       text NOT NULL,
  url         text,
  question    jsonb,
  scope       text NOT NULL CHECK (scope IN ('global','class')),
  class_id    uuid REFERENCES classes(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scope_class_id_consistency CHECK (
    (scope = 'class' AND class_id IS NOT NULL)
    OR (scope = 'global' AND class_id IS NULL)
  ),
  CONSTRAINT url_or_question_required CHECK (
    (type = 'question' AND question IS NOT NULL AND url IS NULL)
    OR (type != 'question' AND url IS NOT NULL AND question IS NULL)
  )
);

-- Enable RLS on the table
ALTER TABLE solo_resources ENABLE ROW LEVEL SECURITY;

-- Anyone can select (students, teachers, anonymous)
CREATE POLICY "solo_resources_select"
  ON solo_resources FOR SELECT USING (true);

-- Only creator can insert; only admin can set scope='global'
CREATE POLICY "solo_resources_insert"
  ON solo_resources FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (
      scope = 'class'
      OR (auth.jwt() ->> 'email') = 'nickdeeney135@gmail.com'
    )
  );

-- Only creator can update; only admin or class-scoped allowed
CREATE POLICY "solo_resources_update"
  ON solo_resources FOR UPDATE
  USING (auth.uid() = created_by AND scope = 'class');

-- Only creator can delete; only admin can delete global resources
CREATE POLICY "solo_resources_delete"
  ON solo_resources FOR DELETE
  USING (
    auth.uid() = created_by
    AND (
      scope = 'class'
      OR (auth.jwt() ->> 'email') = 'nickdeeney135@gmail.com'
    )
  );

-- Indexes for primary query pattern: WHERE unit_id = $1 AND (scope = 'global' OR class_id = $2) ORDER BY sort_order
CREATE INDEX IF NOT EXISTS idx_solo_resources_unit
  ON solo_resources (unit_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_solo_resources_class
  ON solo_resources (class_id)
  WHERE class_id IS NOT NULL;
