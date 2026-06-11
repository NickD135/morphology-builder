# SOLO Show Attempt Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist every "Show" attempt (with per-question timing), reload them for the teacher, and flag outcomes where a student has 3+ quick failed attempts as likely guessing.

**Architecture:** New `solo_show_attempts` table (open RLS, mirrors `solo_test_snapshots`). Student-side insert on each Show completion; teacher-side lazy load when a student is opened. Guessing flag derived at read time. All teacher UI already exists — we light it up.

**Tech Stack:** Vanilla JS + React (UMD) inside `solo/index.html`, Supabase (PostgREST). No build, no JS test framework — verification is via live-DB curl and manual drive.

**Note:** there is no automated test harness for this file. "Verify" steps use curl against the live DB and the running app, consistent with how the row-cap and regression fixes in this session were verified.

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/solo_show_attempts.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/solo_show_attempts.sql
-- One row per completed "Show" attempt (the in-activity assessment).
-- Used by the teacher dashboard to show attempt history + a likely-guessing flag.
-- Open RLS mirrors solo_test_snapshots: students are anonymous (no auth.uid()).

CREATE TABLE solo_show_attempts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id    uuid        REFERENCES classes(id) ON DELETE CASCADE,
  unit_id     text        NOT NULL,
  outcome_id  text        NOT NULL,
  correct     int         NOT NULL,
  total       int         NOT NULL,
  passed      bool        NOT NULL,
  answers     jsonb       NOT NULL,   -- [{text, type, given, correct, ms}, ...]
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE solo_show_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solo_attempts_select" ON solo_show_attempts
  FOR SELECT USING (true);

CREATE POLICY "solo_attempts_insert" ON solo_show_attempts
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_solo_attempts_student
  ON solo_show_attempts (student_id, unit_id, created_at);
```

- [ ] **Step 2: Nick runs it in Supabase**

Paste the SQL into Supabase → SQL Editor → Run. (Anon key cannot create tables.)

- [ ] **Step 3: Verify the table exists (anon select returns empty, not 404)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://kdpavfrzmmzknqfpodrl.supabase.co/rest/v1/solo_show_attempts?select=id&limit=1" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```
Expected: `200` (a `404`/`400` means the table isn't there yet).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/solo_show_attempts.sql
git commit -m "feat(solo): solo_show_attempts table for Show attempt history"
```

---

### Task 2: Capture per-question timing in the Show flow

**Files:**
- Modify: `solo/index.html` — `startOutcome` (~5882), `handleNext` (~5883), `finishAssessmentNow` (~5925)

- [ ] **Step 1: Add a question-start ref**

Find the other refs in the `App` component (search `useRef(`). Add near the top of `App`:

```js
const qStartRef=useRef(0);
```

- [ ] **Step 2: Stamp start time in `startOutcome`**

```js
function startOutcome(o){setActiveOutcome(o);setQIdx(0);setAnswers([]);setAns(initAns(o.questions[0]));setResults(null);setExitOpen(false);qStartRef.current=Date.now();setView("assessment");}
```

- [ ] **Step 3: Record ms per answer in `handleNext`**

Change the newAnswer build and the advance so each answer carries `ms`:

```js
    const correct=checkAnswer(given,q);
    const ms=Date.now()-(qStartRef.current||Date.now());
    const newAnswers=[...answers,{q,given,correct,ms}];
    setAnswers(newAnswers);
    if(qIdx<activeOutcome.questions.length-1){setQIdx(qIdx+1);setAns(initAns(activeOutcome.questions[qIdx+1]));qStartRef.current=Date.now();}
    else{finalizeAssessment(newAnswers);}
```

- [ ] **Step 4: Pad early-finish answers with ms in `finishAssessmentNow`**

```js
  function finishAssessmentNow(){
    const o=activeOutcome;
    const acc=[...answers];
    for(let i=acc.length;i<o.questions.length;i++)acc.push({q:o.questions[i],given:null,correct:false,ms:0});
    finalizeAssessment(acc);
  }
```

- [ ] **Step 5: Verify in browser console (no commit yet)**

Run the app locally (`python3 -m http.server 8080`), log in as a student, do a Show, and in DevTools confirm `answers` entries now include an `ms` number. (Committed together with Task 3.)

---

### Task 3: Persist each attempt on completion

**Files:**
- Modify: `solo/index.html` — add `saveShowAttempt` near `saveTestSnapshot` (~5281); call it inside `finalizeAssessment` (~5917)

- [ ] **Step 1: Add `saveShowAttempt`**

Place after `testFailedSinceDone` (added earlier this session, ~5295):

```js
  // Persist one Show attempt. Fire-and-forget: never blocks the student's flow,
  // and never logs the teacher's own "View as Student" attempts.
  function saveShowAttempt(outcomeId,results,correct,total,passed){
    if(!studentId||isTeacher)return;
    try{
      sb.from("solo_show_attempts").insert({
        student_id:studentId,
        class_id:loginClassObj?.id||null,
        unit_id:selectedUnit.id,
        outcome_id:outcomeId,
        correct,total,passed,
        answers:results
      });
    }catch(e){}
  }
```

- [ ] **Step 2: Build results with ms and call it in `finalizeAssessment`**

The existing `record` block (~5917) already maps results. Update it to include `ms`, then persist:

```js
    if(studentId){
      const recResults=newAnswers.map(a=>({text:a.q.text,type:a.q.type,given:fmtGiven(a.given,a.q),correct:a.correct,ms:a.ms||0}));
      const record={ts:Date.now(),passed:allCorrect,correct:newAnswers.filter(a=>a.correct).length,total:newAnswers.length,results:recResults};
      setAttempts(prev=>({...prev,[studentId]:{...(prev[studentId]||{}),[key]:[...((prev[studentId]||{})[key]||[]),record]}}));
      saveShowAttempt(activeOutcome.id,recResults,record.correct,record.total,allCorrect);
    }
```

(`key` is already `${selectedUnit.id}_${activeOutcome.id}` in scope here.)

- [ ] **Step 3: Verify a row lands in the DB**

Drive a Show as a real student, then:
```bash
curl -s "https://kdpavfrzmmzknqfpodrl.supabase.co/rest/v1/solo_show_attempts?select=unit_id,outcome_id,correct,total,passed,created_at&order=created_at.desc&limit=3" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```
Expected: the attempt you just did, with sensible correct/total and an `answers` array containing `ms`.

- [ ] **Step 4: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): record per-question timing and persist Show attempts"
```

---

### Task 4: Reload a student's attempts when the teacher opens them

**Files:**
- Modify: `solo/index.html` — add a `useEffect` keyed on `teacherFocus` + `selectedUnit` (place near other `useEffect`s in `App`)

- [ ] **Step 1: Add the loader effect**

```js
  useEffect(()=>{
    if(!isTeacher||!teacherFocus||!selectedUnit)return;
    let cancelled=false;
    (async()=>{
      const rows=await sbFetchAll(()=>sb.from("solo_show_attempts")
        .select("outcome_id,correct,total,passed,answers,created_at")
        .eq("student_id",teacherFocus).eq("unit_id",selectedUnit.id)
        .order("created_at"));
      if(cancelled)return;
      const grouped={};
      (rows||[]).forEach(r=>{
        const k=`${selectedUnit.id}_${r.outcome_id}`;
        (grouped[k]=grouped[k]||[]).push({ts:Date.parse(r.created_at),passed:r.passed,correct:r.correct,total:r.total,results:r.answers||[]});
      });
      setAttempts(prev=>({...prev,[teacherFocus]:grouped}));
    })();
    return()=>{cancelled=true;};
  },[isTeacher,teacherFocus,selectedUnit]);
```

- [ ] **Step 2: Verify in the teacher view**

As the teacher, open the class → open the student you drove in Task 3 → open the outcome's attempt list. Expected: the attempt(s) now appear (not "No attempts recorded this session"), and the detail view shows each question + answer.

- [ ] **Step 3: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): load a student's Show attempts when teacher opens them"
```

---

### Task 5: Guessing flag + per-question seconds in the UI

**Files:**
- Modify: `solo/index.html` — add `outcomeGuessing` helper (near `testFailedSinceDone`, ~5295); use it where the attempt count renders (~7763); add "⚡ quick" tag in attempt list (~7637); add seconds in attempt detail (~7607)

- [ ] **Step 1: Add the helper + threshold constant**

```js
  const GUESS_QUICK_MS=4000; // median time-per-question below this = "quick"
  function attemptIsQuick(a){
    const t=(a.results||[]).map(r=>r.ms).filter(m=>typeof m==="number"&&m>0).sort((x,y)=>x-y);
    if(!t.length)return false;
    return t[Math.floor(t.length/2)]<GUESS_QUICK_MS;
  }
  // Outcome-level flag: 3+ failed attempts that were quick = likely guessing.
  function outcomeGuessing(list){
    const quickFailed=(list||[]).filter(a=>!a.passed&&attemptIsQuick(a));
    return quickFailed.length>=3;
  }
```

- [ ] **Step 2: Show ⚡ on the attempt count (per-student outcome panel, ~7763)**

Find `const n=(studentAttempts[key]||[]).length;` and the element that renders `n attempts`. Add beside it:

```js
                  const n=(studentAttempts[key]||[]).length;
                  const lastAttempt=(studentAttempts[key]||[]).slice(-1)[0];
                  const guessing=outcomeGuessing(studentAttempts[key]);
```
and in the JSX where the attempt count is shown, append when `guessing`:
```jsx
{guessing&&<span title="3+ quick failed attempts — may be guessing" style={{marginLeft:6,color:"#ea580c",fontWeight:700}}>⚡ likely guessing</span>}
```

- [ ] **Step 3: "⚡ quick" tag in the attempt list (~7637)**

In the attempt-list map (`[...outcomeAttempts].reverse().map((a,ri)=>{ ... }`), where each attempt row renders its time/score, add:

```jsx
{attemptIsQuick(a)&&<span style={{marginLeft:6,fontSize:11,fontWeight:700,color:"#ea580c"}}>⚡ quick</span>}
```

- [ ] **Step 4: Per-question seconds in attempt detail (~7607)**

In the `attempt.results.map((r,i)=>...)` block, next to the ✓/✗, show the seconds:

```jsx
{typeof r.ms==="number"&&r.ms>0&&<span style={{fontSize:11,color:"#94a3b8",marginLeft:6}}>{(r.ms/1000).toFixed(1)}s</span>}
```

- [ ] **Step 5: Verify**

Drive 3 quick wrong Show attempts on one outcome as a student (answer fast, get it wrong). As the teacher, open that student → confirm the outcome shows "⚡ likely guessing", each quick attempt shows "⚡ quick", and the detail view shows per-question seconds.

- [ ] **Step 6: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): likely-guessing flag and per-question timing in teacher view"
```

---

### Task 6: Final end-to-end verification + push

- [ ] **Step 1: Sanity-check the four touch points**

```bash
grep -n "saveShowAttempt\|qStartRef\|outcomeGuessing\|solo_show_attempts" solo/index.html
```
Expected: ref + save fn + insert + load effect + helper + UI all present.

- [ ] **Step 2: Confirm View-as-Student does NOT log**

As a teacher using "View as Student", do a Show, then check the latest rows — the teacher's attempt must NOT appear (guard is `!isTeacher`).

- [ ] **Step 3: Push**

```bash
git push origin main
```

---

## Self-Review

- **Spec coverage:** table (T1), timing capture (T2), persistence + no-teacher-logging (T3), lazy teacher load (T4), guessing flag + quick tag + seconds (T5), verification incl. View-as-Student guard (T3/T6). All spec sections covered.
- **Placeholders:** none — every code step is concrete.
- **Type consistency:** the in-memory attempt record shape `{ts,passed,correct,total,results:[{text,type,given,correct,ms}]}` is identical whether built in `finalizeAssessment` (T3) or reconstructed from the DB (T4), so the existing teacher UI and the new helpers read the same shape. `attemptIsQuick`/`outcomeGuessing` both read `a.results[].ms`. Threshold `GUESS_QUICK_MS` defined once.
