# SOLO — Show Attempt Tracking & Guessing Flag

**Date:** 2026-06-11
**File touched:** `solo/index.html` (+ one Supabase migration)
**Status:** Approved, ready for implementation plan

## Problem

When a student completes a "Show" (the in-activity assessment opened via the
Show / Reassess button → `startOutcome` → `finalizeAssessment`), the per-question
results and pass/fail are computed and stashed in local `attempts` state, but:

- They are **never persisted** — the data dies with the browser session.
- The teacher-facing attempt UI already exists (`attempts[s.id]` → attempt list
  view and attempt detail view, ~lines 7590–7640) but always shows
  *"No attempts recorded this session"* because nothing is saved or reloaded.
- The latest attempt's answers persist to `solo_assessment_reflections`, but that
  table is an **upsert** (one row, overwritten each attempt) — so there is no
  history and no way to see multiple attempts or guessing.

Teacher need: *"see if students are having multiple attempts and if they are
guessing."*

## Goal

Persist every Show attempt and surface, in the existing teacher views:
- Full attempt **history** (count, pass/fail, exact answers each time).
- **Per-question timing.**
- An automatic **"⚡ likely guessing"** flag at the outcome level.

Out of scope: pre/post **test** attempts (`finishPretest`) — those are a separate,
teacher-run assessment and do not count as guessing attempts. No new screens.

## Storage approach

New table `solo_show_attempts`, **one row inserted per completed Show attempt**,
loaded **lazily** when the teacher opens a student (not at class load).

Rationale:
- Matches `solo_test_snapshots`: anon student INSERT, school-scoped teacher SELECT.
  Slots into existing RLS with no new pattern, one migration, no backfill.
- Lazy per-student load keeps the class dashboard fast and avoids the PostgREST
  1000-row cap (the bug fixed earlier this session) — attempts are never bulk-loaded.

Rejected alternatives:
- Reuse `solo_assessment_reflections` (upsert, bulk-loaded per unit) → tangles
  existing queries, reintroduces cap risk.
- jsonb array of attempts on a single row → write-race risk, hard to query.

## Data model

```sql
create table solo_show_attempts (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  class_id    uuid references classes(id) on delete cascade,
  unit_id     text not null,
  outcome_id  text not null,
  correct     int  not null,
  total       int  not null,
  passed      bool not null,
  answers     jsonb not null,   -- [{text, type, given, correct, ms}, ...]
  created_at  timestamptz not null default now()
);
create index on solo_show_attempts (student_id, unit_id);
```

- `answers[].ms` = milliseconds spent on that question (the only new capture).
- Per-attempt **`quick`** is derived at read time from the median of `answers[].ms`
  (no stored column).

## Timing capture

In the Show flow (`startOutcome` / `handleNext`):
- Stamp a question start time when each question is shown.
- On Next, record elapsed ms onto that answer; reset for the next question.
- `ms` flows into the existing `newAnswers` entries → `record.results` → the row.

## Guessing flag

Outcome-level, per student. Show **⚡ likely guessing** when:
- the student has **≥ 3 failed (not passed) attempts** at that outcome, AND
- those failed attempts are **quick** — median time-per-question under a
  threshold constant (default **4000 ms**), defined in one place for easy tuning.

Median (not mean) so a single long pause can't mask rapid-fire guessing. Passed
attempts never count toward the 3.

## Where it shows (existing UI, lit up)

1. Per-student outcome panel (attempt count already renders ~line 7763):
   `4 attempts` → `4 attempts ⚡` when flagged.
2. Attempt list for an outcome (built ~7624): add a small "⚡ quick" tag on quick
   attempts.
3. Attempt detail (built ~7593): show per-question seconds next to each question.

## Security / RLS

Mirror `solo_test_snapshots`:
- Students (anon) may INSERT rows.
- Teachers (authenticated) may SELECT rows only for their own school, via
  `class_id → classes` school chain (`get_my_school_id()` pattern).
- No change to any existing policy.

## Loading & state

- On teacher opening a student (teacher focus), fetch that student's attempts for
  the current unit and populate the existing `attempts[sid]` state shape
  (`{ [outcomeKey]: [record, ...] }`).
- Cleared on logout with other student data.

## Error handling & edge cases

- Attempt INSERT is **fire-and-forget**: a Show always completes and scores still
  save even if the insert fails. Worst case = one missing attempt row.
- "Finish now" / early-exit path records an attempt only where it already builds a
  scored result — no new partial-attempt concept.
- **Teacher "View as Student" attempts are NOT logged** (no `studentId` write path),
  so the teacher's own testing never pollutes a student's guessing flag.
- Capacity: per-student/per-unit read is tiny; revisit pagination only if a single
  student ever exceeds 1000 attempts (unrealistic).

## Verification

- Replicate an attempt insert against the live DB (anon) and confirm RLS allows it.
- Confirm a teacher read returns the inserted rows for the same class.
- Manually drive a Show, confirm a row appears with per-question `ms`, and that
  3 quick failed attempts flips the ⚡ flag on the outcome.
