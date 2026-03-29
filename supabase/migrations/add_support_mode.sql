-- Add support_mode flag to students table for differentiation/scaffolding
-- When true: slower timers, fewer distractors, visual scaffolds, scientist hints

ALTER TABLE students ADD COLUMN IF NOT EXISTS support_mode BOOLEAN DEFAULT FALSE;
