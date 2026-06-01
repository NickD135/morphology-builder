-- Let teachers react to student reflections in the SOLO tracker.
-- Adds a small teacher_reaction (an emoji string) to both reflection tables.
-- Students see the reaction back on their rubric — a human "I saw your thinking" touch.

alter table public.solo_reflections
  add column if not exists teacher_reaction text;

alter table public.solo_assessment_reflections
  add column if not exists teacher_reaction text;
