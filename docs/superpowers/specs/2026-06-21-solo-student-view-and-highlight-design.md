# SOLO Tracker — Student View + Highlight Units (design)

**Date:** 2026-06-21 · **File touched:** `solo/index.html` (only) · **Migration:** none.

Two teacher-facing features for the SOLO Tracker (`/solo`):
1. **Student View** — a teacher previews the app as a student (try pre/post-tests, see resources, explore
   units) without logging out; preview progress **persists** on a teacher-owned hidden student account.
2. **Highlight** — a per-unit teacher toggle that puts a green glow behind a unit card; **students see it**,
   so they can spot the unit they're up to while every unit stays open for revision/homework.

---

## Existing facts this design relies on (verified)

- The whole student-vs-teacher UI keys off two state vars: `isTeacher` (bool) and `studentId` (uuid|null).
- `hiddenUnits` persists in `classes.settings.soloHiddenUnits` (jsonb array of unit ids), read by **both**
  teacher (on class load) and student (on class-code login). Cards filter `isTeacher||!hiddenUnits.has(id)`.
- All SOLO progress tables declare `student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE`
  (`solo_show_completions`, `solo_show_attempts`, `solo_test_snapshots`; `solo_progress` follows the same
  convention) with fully-open RLS (`USING(true)` / `WITH CHECK(true)`). ⇒ persisted progress **must** hang
  off a real `students` row; can't be keyed to the teacher's auth id.
- `isRealStudent = /uuid/.test(studentId)` already gates reflections to device-local for non-uuid ids — not
  used here (we use a real uuid), but confirms the dual-source pattern.
- `saveShowAttempt` guards `if(!studentId||isTeacher)return;`. `saveOutcome` and the snapshot insert do **not**
  guard — fine, because the preview student is a real row, so those writes satisfy the FK and are *desired*.
- Teacher identity = `session.user.id`; teacher row in `teachers(auth_user_id, school_id, …)`.
- Unit cards render in the `home` view; the teacher's **Hide** button sits in a flex row in each card header;
  the card container is a single `<div>` with `boxShadow` + `borderTop`.

---

## Feature 1 — Student View

### Identity: persistent hidden "teacher" student (chosen approach)
- Deterministic lookup/provision: a single `students` row per teacher, found by
  `student_code = 'TP-' + first8(auth_user_id).toUpperCase()`.
  - On first Student View: if no row with that code exists, INSERT one
    `{ class_id: selectedClassId, name: '👤 Teacher preview', student_code: 'TP-XXXXXXXX' }`
    and add `{class_id, student_id}` to `solo_hidden_students`. RLS is open, so the authed teacher can insert.
  - **Prerequisite:** the Student View button lives in the teacher `home` view, which is only reachable after
    a class is selected, so `selectedClassId` is always set when provisioning runs.
  - On subsequent uses: reuse the found row.
  - If the row's class was deleted (cascade), it won't be found → re-provision in the current class.
- **Accepted tradeoff:** the row is real, so it shows in that class's roster in the *main* Word Labs
  class-setup page (clearly named). It is hidden from all SOLO dashboards/averages via `solo_hidden_students`
  (which already excludes it from `visibleStudents`). The user accepted this in exchange for persistence.

### Enter / exit (no reload, no re-login)
- New state: `previewMode` (bool), `teacherReturn` snapshot is unnecessary — class state (selectedClassId,
  students, classes, progress, hiddenUnits, highlightedUnits) stays in state untouched.
- **Enter** (`enterStudentView()`): ensure preview student exists → fetch its `solo_progress` into
  `progress[previewId]` → `setStudentId(previewId); setStudentName('Preview'); setIsTeacher(false);
  setPreviewMode(true); setView('home')`.
- **Exit** (`exitStudentView()`): `setPreviewMode(false); setIsTeacher(true); setStudentId(null);
  setView('home')`.
- **Entry button:** `👁 Student View` in the teacher `home` view nav (`AppNav` right cluster, beside Sign out).
- **Exit affordance:** a persistent slim bar at the top of every view while `previewMode` is true:
  *"👁 You're previewing as a student · ← Back to teacher"*. Shown app-wide (rendered near the top of the
  component return, gated on `previewMode`) so the teacher can always get back, even mid-test.

### Why no write-guards are needed
Because the preview identity is a **real** uuid student row: pretests (`saveOutcome`, snapshot insert),
Show attempts (`saveShowAttempt` — `isTeacher` is false in preview so it runs), and reflections
(`isRealStudent` true) all save normally to that hidden student. That's the desired persistence. The row is
excluded from every SOLO aggregate, so it can't pollute class data.

---

## Feature 2 — Highlight units

- New state `highlightedUnits` (Set of unit ids), loaded alongside `hiddenUnits` from
  `classes.settings.soloHighlightedUnits` in both the teacher class-load and the student class-login paths.
- `toggleHighlightUnit(unitId)` mirrors `toggleHideUnit`: flip membership, `setHighlightedUnits`, then
  `classes.update({ settings: {...cur.settings, soloHighlightedUnits: [...next]} })`.
- **Button:** `✨ Highlight` / `✨ Highlighted` beside Hide in the card header (teacher only), multiple allowed.
- **Glow:** when `highlightedUnits.has(unit.id)`, the card gets a green ring/outer glow
  (e.g. `boxShadow: '0 0 0 2px #86efac, 0 6px 20px rgba(34,197,94,0.35)'`) layered with the existing shadow,
  visible to **students** (the filter/glow read the same Set the teacher writes). Hover shadow logic updated
  so the green glow isn't lost on mouse-enter for highlighted cards.

---

## Verification
- Node-eval is N/A (UI change); the gate is **Playwright load → 0 code console errors** (favicon 404 +
  Babel notice excepted), confirming the JSX compiles.
- Behavioural checks via `browser_evaluate` against the live page where possible (glow style applied when a
  unit id is in the Set; highlight toggle writes the right settings key).
- Manual reasoning for the teacher/student round-trip (can't log in via Playwright — Supabase auth), plus a
  careful read that enter/exit only flips `isTeacher`/`studentId`/`previewMode` and never clears class state.

## Out of scope / YAGNI
- No schema migration. No new tables. No change to real-student behaviour, dashboards, or averages.
- Single-highlight mode (rejected — user chose multiple). Throwaway sandbox preview (rejected — user wants
  persistence).
