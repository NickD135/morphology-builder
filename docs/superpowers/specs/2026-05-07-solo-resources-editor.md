# Solo Tracker — Resource Editor

**Date:** 2026-05-07  
**File changed:** `solo/index.html` (single-file React SPA — all changes here)  
**Migration:** `supabase/migrations/solo_resources.sql`

---

## Problem Being Solved

Resources for each outcome's "Grow" button are currently hardcoded in a static `RESOURCES` JS object inside `solo/index.html`. There is no way to add, edit, or remove them without touching the source code. Teachers cannot contribute class-specific resources for their students.

---

## Solution Overview

A two-tier resource system backed by Supabase:

- **Global resources** — added by the admin (nickdeeney135@gmail.com). Visible to every student across every class. Read-only for regular teachers.
- **Class resources** — added by individual teachers. Visible only to students in that teacher's class.

Students see all three sources merged together in the Grow panel: hardcoded `RESOURCES` + global Supabase resources + class Supabase resources.

Teachers manage resources through a new **Resources tab** in the teacher view (alongside the existing Rubric tab).

---

## 1. Database

### Table: `solo_resources`

```sql
CREATE TABLE solo_resources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     text NOT NULL,       -- 'u24', 'u25', 'u26', 'u27'
  outcome_id  text NOT NULL,       -- 'r1', 'r2', etc.
  type        text NOT NULL        -- 'video' | 'website' | 'pdf' | 'game' | 'question'
              CHECK (type IN ('video','website','pdf','game','question')),
  label       text NOT NULL,
  url         text,                -- null for type='question'
  question    jsonb,               -- null for link types
                                   -- { text: string, options: [{text: string, correct: boolean}] }
  scope       text NOT NULL        -- 'global' | 'class'
              CHECK (scope IN ('global','class')),
  class_id    uuid REFERENCES classes(id) ON DELETE CASCADE,
              -- null when scope='global'
  created_by  uuid NOT NULL,       -- auth.uid()
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT class_required_for_class_scope
    CHECK (scope = 'global' OR class_id IS NOT NULL)
);
```

### RLS Policies

```sql
ALTER TABLE solo_resources ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "solo_resources_select"
  ON solo_resources FOR SELECT USING (true);

-- Only the creator can insert/update/delete their own resources
CREATE POLICY "solo_resources_insert"
  ON solo_resources FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "solo_resources_update"
  ON solo_resources FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "solo_resources_delete"
  ON solo_resources FOR DELETE
  USING (auth.uid() = created_by);
```

---

## 2. State Changes in `solo/index.html`

### New state variables (add to `App()`)

```js
const [teacherEmail, setTeacherEmail] = useState("");
// Set from session.user.email after teacher login — used for admin check

const [soloResources, setSoloResources] = useState([]);
// All resources for the currently-selected unit, fetched once per unit load

const [resourceTab, setResourceTab] = useState("rubric");
// "rubric" | "resources" — controls which teacher tab is active

const [resourceOutcome, setResourceOutcome] = useState(null);
// The outcome currently selected in the Resources tab left panel (e.g. "r1")

const [addingResource, setAddingResource] = useState(false);
// Whether the add-resource form is expanded

const [newResType, setNewResType] = useState("video");
// Type picker state for the add form

const [newResLabel, setNewResLabel] = useState("");
const [newResUrl, setNewResUrl] = useState("");
const [newResQ, setNewResQ] = useState({text:"",options:[{text:"",correct:true},{text:"",correct:false},{text:"",correct:false},{text:"",correct:false}]});
// Question builder state

const [addingToGlobal, setAddingToGlobal] = useState(false);
// Admin only: true = new resource goes to global scope, false = class scope
// Teachers never see this toggle; their saves always go to class scope

const [quizState, setQuizState] = useState({});
// { [o.id]: { idx: number, answered: number|null } }
// e.g. { 'r1': { idx: 0, answered: null } }
// answered: null = not yet answered; number = option index chosen
```

### Set `teacherEmail` at login

In `doLogin()`, after `setIsTeacher(true)`:

```js
setTeacherEmail(session.user.email);
```

Clear it in `doLogout()`:

```js
setTeacherEmail("");
```

### Admin check helper (module-level constant)

```js
const ADMIN_EMAIL = "nickdeeney135@gmail.com";
```

Used as `teacherEmail === ADMIN_EMAIL` wherever admin privileges are needed.

---

## 3. Data Loading

### `loadResources(unitId, classId)`

Called when a teacher selects a unit (or when a student opens a unit's rubric). Fetches all resources for the unit — both global and the student's/teacher's class.

```js
async function loadResources(unitId, classId) {
  const {data} = await sb
    .from("solo_resources")
    .select("*")
    .eq("unit_id", unitId)
    .or(`scope.eq.global,class_id.eq.${classId}`)
    .order("sort_order");
  setSoloResources(data || []);
}
```

Call this:
- In the teacher view: when a unit card is clicked (alongside existing `loadClass` / progress load)
- In the student view: when `setSelectedUnit` is called and `view` becomes `"rubric"`

For the student's `classId`, use `loginClassObj.id`.  
For the teacher's `classId`, use `selectedClassId`.

---

## 4. Teacher UI — Resources Tab

### Tab bar in teacher unit rubric view

The teacher rubric view currently has `AppNav` with a "← All units" back button. Add two pill tabs in the nav right slot:

```
[Rubric]  [📚 Resources]
```

`resourceTab` state controls which panel is shown. When switching tabs, preserve the selected outcome.

### Resources tab layout

```
┌─────────────────────────────────────────────────────┐
│  AppNav: "Unit 24 — Fractions"   [Rubric] [Resources]│
├─────────────┬───────────────────────────────────────┤
│ Left panel  │ Right panel                           │
│ (130px)     │                                       │
│             │  ── Global (all classes) ──           │
│ r1 Compare  │  [resource row]  [resource row]       │
│    (2 res)  │  + Add  ← admin only                 │
│             │                                       │
│ r2 Order    │  ── Your class ──                    │
│    (0 res)  │  (empty state or resource rows)       │
│             │  + Add resource                       │
│ r3 Add      │                                       │
│    (1 res)  │                                       │
└─────────────┴───────────────────────────────────────┘
```

Clicking an outcome in the left panel sets `resourceOutcome`. Right panel re-renders for that outcome.

`resourceOutcome` defaults to the first outcome in the unit when the Resources tab is first opened.

### Resource row (read-only display)

```
[icon] Label text                              [✕ delete — own resources only]
       type badge · url domain (or "Question")
```

Icons: 📹 video · 🌐 website · 📄 pdf · 🎮 game · ❓ question

Teachers can delete their own class resources. Admin can delete global resources. Neither can delete the other's.

### Add resource form

Appears below the "Your class" section (or "Global" section for admin) when "+ Add resource" is clicked.

```
Type: [📹 Video] [🌐 Website] [📄 PDF] [🎮 Game] [❓ Question]

(for link types)
Label: ___________________________
URL:   ___________________________

(for question type)
Question: ________________________

Option A: ________________________  ◉ Correct
Option B: ________________________  ○
Option C: ________________________  ○
Option D: ________________________  ○

[Cancel]  [Save]
```

On Save, insert into `solo_resources` with the appropriate `scope` and `class_id`, then re-fetch via `loadResources()`.

For link types: `url` required, `question` null.  
For question type: `url` null, `question = {text, options:[{text,correct}]}`. Exactly one option must have `correct: true`.

### `saveResource()`

```js
async function saveResource() {
  const isAdmin = teacherEmail === ADMIN_EMAIL;
  const base = {
    unit_id: selectedUnit.id,
    outcome_id: resourceOutcome,
    type: newResType,
    label: newResLabel.trim(),
    scope: isAdmin && addingToGlobal ? "global" : "class",
    class_id: isAdmin && addingToGlobal ? null : selectedClassId,
    created_by: (await sb.auth.getSession()).data.session.user.id,
    sort_order: soloResources.filter(r => r.outcome_id === resourceOutcome).length,
  };
  const payload = newResType === "question"
    ? {...base, question: newResQ}
    : {...base, url: newResUrl.trim()};
  await sb.from("solo_resources").insert(payload);
  await loadResources(selectedUnit.id, selectedClassId);
  setAddingResource(false);
  setNewResLabel(""); setNewResUrl(""); setNewResType("video");
  setNewResQ({text:"",options:[{text:"",correct:true},{text:"",correct:false},{text:"",correct:false},{text:"",correct:false}]});
}
```

`addingToGlobal` is a boolean state variable (default false) that the admin sees as a toggle: "Add to: [Global] [Your class]". Teachers don't see this toggle — their additions always go to `scope='class'`.

### `deleteResource(id)`

```js
async function deleteResource(id) {
  await sb.from("solo_resources").delete().eq("id", id);
  setSoloResources(prev => prev.filter(r => r.id !== id));
}
```

---

## 5. Student View — Grow Panel

### Merged resource list

When a student expands the Grow panel for an outcome, show:

```js
const resKey = `${selectedUnit.id}_${o.id}`;
const hardcoded = RESOURCES[resKey] || [];
const dynamic = soloResources.filter(r => r.outcome_id === o.id);
const allResources = [
  ...hardcoded.map(r => ({...r, _source: "hardcoded"})),
  ...dynamic.map(r => ({...r, _source: "db"})),
];
```

Separate questions from links:

```js
const links = allResources.filter(r => r.type !== "question");
const questions = allResources.filter(r => r.type === "question");
```

Render links first as tappable cards, then questions as a mini quiz (if any exist).

### Link cards

```
[📹] Comparing unit fractions on a number line   →
     youtube.com

[📄] Khan Academy worksheet                      →
     khanacademy.org
```

Each is an `<a>` with `target="_blank"`.

### Mini quiz (MC questions)

If `questions.length > 0`, render a quiz section below the links:

```
─── Practice questions ───

[Question 1 of 2]

What is 1/4 compared to 1/2?

  A  1/4 is bigger
  B  1/4 is smaller    ← selected (indigo border)
  C  They are equal
  D  Can't compare

[Check answer]
```

After checking: green feedback on correct option, red on selected wrong option + show correct. A "Next →" button advances to the next question. After the last question, show "All done! 🎉" with a "Try again" button that resets `quizState` for this outcome.

Quiz state tracked in `quizState[o.id]` = `{idx, answered}`. `answered` is null (not yet answered) or the index of the option the student chose (compare against the correct option's index to determine right/wrong).

No score recording — this is untracked practice.

---

## 6. Grow Button Visibility

Currently the Grow button only renders when `res.length > 0` (hardcoded resources exist). Update this check:

```js
const hasResources =
  (RESOURCES[resKey]||[]).length > 0 ||
  soloResources.some(r => r.outcome_id === o.id);
```

Grow button renders when `hasResources` is true.

---

## 7. Files

| File | Change |
|---|---|
| `solo/index.html` | New state vars, `loadResources()`, `saveResource()`, `deleteResource()`, Resources tab UI, merged Grow panel, mini quiz |
| `supabase/migrations/solo_resources.sql` | CREATE TABLE + RLS policies |

No new files beyond the migration. No changes to existing game data or scoring logic.
