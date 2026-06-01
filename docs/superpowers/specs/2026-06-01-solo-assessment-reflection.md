# SOLO Tracker — End-of-Assessment Reflection

**Date:** 2026-06-01
**Status:** Approved design, ready to build
**File touched:** `solo/index.html` (single-file React-via-Babel app) + one Supabase migration

## Problem

After a student finishes a **Show** assessment (per-outcome), they see a results
screen (X/Y correct or "All correct ⭐") and leave. There's no moment of
metacognition — reflecting *right after seeing the result* is where the real
learning consolidation happens, and it gives the teacher gap data they can't get
from a score alone.

The lesson (Grow) reflection already exists, but it's a different moment
(before/around the teaching, not after proving it). We want a reflection at the
assessment results screen.

## Goals

- Prompt a short, **structured** reflection on the assessment results screen.
- **Adapt the prompts to the result** so there are no dead questions:
  - **Missed some:** ✅ one thing I did well · ❓ the bit that tripped me up · ➡️ what I'll do next time
  - **All correct:** ⭐ the trick that worked · ➡️ something harder I want to try next
- **Optional / skippable** — never block leaving the results screen (these are
  lower-frequency Show assessments, so a little reflection is justified, but a kid
  who wants to move on isn't trapped).
- **Teacher-visible** on the dashboard, separate from the lesson reflection, with
  the structured strands shown so the teacher can scan a class's "what didn't
  click" / "what to do next".
- Explicit **"Send to my teacher"** button (consistent with the lesson NoteField
  pattern shipped 2026-06-01) — deliberate submit, clear confirmation.

## Non-goals

- No grading or effect on outcome completion (reflection is formative).
- No required reflection / no gating of navigation.
- No change to the existing lesson reflection (`solo_reflections`) — kept fully
  separate to avoid disturbing a just-shipped, working path.

## Data

New table, mirroring the open-RLS pattern of the other `solo_*` tables:

```sql
create table if not exists solo_assessment_reflections (
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
```

`answers` holds only the keys relevant to the result:
- missed some → `{ didWell, trippedUp, nextStep }`
- all correct → `{ trick, stretch }`

One row per student per outcome (re-taking overwrites via the unique key, like a
current snapshot — matches how the dashboard shows the latest reflection).

## Architecture

- **Student write:** a new `AssessmentReflect` component rendered inside the
  `view==="assessment"` results block (`if(results){…}`), below the per-question
  list and above the Rubric / Try Again buttons. It reads `results.allCorrect` to
  pick the prompt set, keeps each answer in local state, mirrors a localStorage
  draft, and on **Send** upserts to `solo_assessment_reflections`
  (`onConflict:"student_id,unit_id,outcome_id"`). Real-student gate via the same
  UUID regex used by `NoteField`; preview/teacher shows "Saved to this device".
- **Teacher read:** extend `loadReflections(unitId)` to also fetch
  `solo_assessment_reflections` for the class students into a new
  `asmtReflections` state keyed `${student_id}_${outcome_id}` → `{answers,
  score_correct, score_total}`.
- **Teacher display:** in the per-outcome "Completion by outcome" row, add a
  second panel button **"📋 N assessment reflection(s)"** beside the existing
  "💭" lesson panel. Expanded, each student's card shows the structured strands
  with friendly labels and their score.
- **No DB writes block navigation;** record-first (the assessment completion is
  already recorded before the results screen renders).

## Constraints

- Vanilla JS only, no build, no new libraries.
- Animation via existing gated `lc-check` only; respect `prefers-reduced-motion`
  + `body.low-stim`.
- No layout shift; fast on a low-end Chromebook.
- Open RLS consistent with existing `solo_*` tables (this is the lightweight solo
  tracker with anon access, not the main multi-tenant app).

## Build order

1. Migration SQL → `supabase/migrations/solo_assessment_reflections.sql` (Nick
   runs it in the Supabase SQL editor).
2. `AssessmentReflect` component + render on the results screen.
3. Extend `loadReflections` + `asmtReflections` state.
4. Teacher dashboard "📋" panel.
5. Verify (parse + Babel compile via Playwright, 0 console errors), commit, push.

## Deferred

- Per-strand class-level rollups (e.g. a single "what didn't click" column across
  the whole class) — the data shape (`answers` jsonb) supports it later.
- Surfacing the assessment reflection back to the student over time.
