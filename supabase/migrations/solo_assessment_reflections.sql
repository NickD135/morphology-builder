-- End-of-assessment student reflections for the SOLO tracker (solo/index.html).
-- Separate from solo_reflections (lesson/Grow reflections) so the two never collide.
-- Open RLS, consistent with the other solo_* tables (lightweight tracker, anon access).

create table if not exists public.solo_assessment_reflections (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  class_id uuid,
  unit_id text not null,
  outcome_id text not null,
  score_correct int,
  score_total int,
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique (student_id, unit_id, outcome_id)
);

create index if not exists solo_assessment_reflections_unit_idx
  on public.solo_assessment_reflections (unit_id);
create index if not exists solo_assessment_reflections_student_idx
  on public.solo_assessment_reflections (student_id);

alter table public.solo_assessment_reflections enable row level security;

drop policy if exists "solo_assessment_reflections open" on public.solo_assessment_reflections;
create policy "solo_assessment_reflections open"
  on public.solo_assessment_reflections
  for all
  using (true)
  with check (true);
