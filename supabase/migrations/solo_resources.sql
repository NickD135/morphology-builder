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
  created_by  uuid NOT NULL,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT class_required_for_class_scope
    CHECK (scope = 'global' OR class_id IS NOT NULL)
);

-- Enable RLS on the table
ALTER TABLE solo_resources ENABLE ROW LEVEL SECURITY;

-- Anyone can select (students, teachers, anonymous)
CREATE POLICY "solo_resources_select"
  ON solo_resources FOR SELECT USING (true);

-- Only creator can insert
CREATE POLICY "solo_resources_insert"
  ON solo_resources FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only creator can update
CREATE POLICY "solo_resources_update"
  ON solo_resources FOR UPDATE
  USING (auth.uid() = created_by);

-- Only creator can delete
CREATE POLICY "solo_resources_delete"
  ON solo_resources FOR DELETE
  USING (auth.uid() = created_by);
