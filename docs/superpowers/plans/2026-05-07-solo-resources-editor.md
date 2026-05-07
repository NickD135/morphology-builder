# Solo Tracker — Resource Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-tier Supabase-backed resource editor to the Solo Tracker so admins can add global resources (videos, links, PDFs, practice questions) per outcome, teachers can add class-specific resources, and students see all of them merged in the Grow panel.

**Architecture:** A single new `solo_resources` Supabase table stores global and class-scoped resources (links + MC questions). Teachers manage resources via a new "Resources" tab in their unit rubric view. Students see hardcoded `RESOURCES` + Supabase rows merged and rendered in an updated Grow panel with a mini quiz for question-type resources.

**Tech Stack:** React 18 UMD (in-browser JSX via Babel), Supabase JS v2, single-file SPA at `solo/index.html`

---

## File Map

| File | Change |
|---|---|
| `supabase/migrations/solo_resources.sql` | CREATE TABLE + RLS (new file) |
| `solo/index.html` | All JS/JSX changes — state vars, functions, teacher UI, student Grow panel |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/solo_resources.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/solo_resources.sql

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

ALTER TABLE solo_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solo_resources_select"
  ON solo_resources FOR SELECT USING (true);

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

- [ ] **Step 2: Run the migration**

Go to Supabase dashboard → SQL Editor → paste and run the above SQL.

Expected: No errors. The `solo_resources` table appears under Table Editor.

- [ ] **Step 3: Verify the table**

In SQL Editor run:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'solo_resources' ORDER BY ordinal_position;
```

Expected: 11 rows — id, unit_id, outcome_id, type, label, url, question, scope, class_id, created_by, sort_order, created_at.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/solo_resources.sql
git commit -m "feat(solo): solo_resources table + RLS migration"
```

---

## Task 2: State variables, constants, and login/logout wiring

**Files:**
- Modify: `solo/index.html`

**Context:** The app is a single-file React SPA. All state lives in the `App()` function starting at line 1792. Module-level constants (`ff`, `Sb`, `Pb`) are at lines 1766–1768. `doLogin()` is at line 1853; `doLogout()` is at line 1922.

- [ ] **Step 1: Add ADMIN_EMAIL constant at module scope**

Find line 1766 (the `const ff=` line) and add the constant above it:

```js
const ADMIN_EMAIL="nickdeeney135@gmail.com";
const ff="'Lexend',sans-serif";
```

- [ ] **Step 2: Add new state variables inside App()**

Find line 1836 (the last existing state variable, `const [practiceScore,...]`). Add these 9 new state variables immediately after it:

```js
  const [teacherEmail,setTeacherEmail]=useState("");
  // Set from session.user.email after teacher login — used for admin check

  const [soloResources,setSoloResources]=useState([]);
  // All resources for the currently-selected unit

  const [resourceTab,setResourceTab]=useState("rubric");
  // "rubric" | "resources" — which teacher tab is active

  const [resourceOutcome,setResourceOutcome]=useState(null);
  // The outcome ID currently selected in the Resources tab left panel

  const [addingResource,setAddingResource]=useState(false);
  // Whether the add-resource form is expanded

  const [addingToGlobal,setAddingToGlobal]=useState(false);
  // Admin only: true = new resource goes to global scope

  const [newResType,setNewResType]=useState("video");
  const [newResLabel,setNewResLabel]=useState("");
  const [newResUrl,setNewResUrl]=useState("");
  const [newResQ,setNewResQ]=useState({text:"",options:[
    {text:"",correct:true},
    {text:"",correct:false},
    {text:"",correct:false},
    {text:"",correct:false}
  ]});
  // Question builder state

  const [quizState,setQuizState]=useState({});
  // { [o.id]: { idx: number, answered: number|null } }
```

- [ ] **Step 3: Set teacherEmail in doLogin()**

Find line 1864–1865 (inside `doLogin()`, inside the `if(loginMode==="teacher")` branch):

```js
      setClasses(cr||[]);
      setIsTeacher(true);
      setLoading(false);
      setView("classes");
```

Change to:

```js
      setClasses(cr||[]);
      setIsTeacher(true);
      setTeacherEmail(session?.user?.email||"");
      setLoading(false);
      setView("classes");
```

- [ ] **Step 4: Clear teacherEmail and new state in doLogout()**

Find line 1925 (the long `setView("login");setStudentId(null)...` line in `doLogout()`). Add the new resets at the end of that line, before the semicolon that closes it:

```js
setTeacherEmail("");setSoloResources([]);setResourceTab("rubric");setResourceOutcome(null);setAddingResource(false);setAddingToGlobal(false);setNewResType("video");setNewResLabel("");setNewResUrl("");setNewResQ({text:"",options:[{text:"",correct:true},{text:"",correct:false},{text:"",correct:false},{text:"",correct:false}]});setQuizState({});
```

Append this to line 1926 (same pattern as the existing `setExpandedResource(null)...` reset line).

- [ ] **Step 5: Verify in browser**

Run: `python3 -m http.server 8080 --bind 0.0.0.0` from the repo root.

Open http://localhost:8080/solo/ — app loads without JS errors in console. Log in as a teacher — no change in behaviour yet (just confirming no syntax errors).

- [ ] **Step 6: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): add resource editor state vars + teacherEmail wiring"
```

---

## Task 3: loadResources() function and call site

**Files:**
- Modify: `solo/index.html`

**Context:** `saveOutcome()` ends at line 1920. `openUnit()` is at line 2038. `loginClassObj` holds the student's resolved class `{id, name}`. `selectedClassId` holds the teacher's selected class ID.

- [ ] **Step 1: Add loadResources() after saveOutcome()**

Find line 1920 (the closing `}` of `saveOutcome()`). Add after it:

```js
  async function loadResources(unitId,classId){
    if(!classId){setSoloResources([]);return;}
    const {data}=await sb.from("solo_resources")
      .select("*")
      .eq("unit_id",unitId)
      .or(`scope.eq.global,class_id.eq.${classId}`)
      .order("sort_order");
    setSoloResources(data||[]);
  }
```

- [ ] **Step 2: Call loadResources() from openUnit()**

Find line 2038:
```js
  function openUnit(unit){setSelectedUnit(unit);setView("rubric");}
```

Change to:
```js
  function openUnit(unit){
    setSelectedUnit(unit);
    setView("rubric");
    setResourceTab("rubric");
    setResourceOutcome(unit.outcomes[0]?.id||null);
    const classId=isTeacher?selectedClassId:(loginClassObj?.id||null);
    loadResources(unit.id,classId);
  }
```

- [ ] **Step 3: Verify loadResources runs**

Open the app. Log in as a teacher, pick a class, click a unit. Open browser DevTools → Network tab. Confirm a request goes to Supabase for `solo_resources` with the correct `unit_id` filter. It will return an empty array (no rows yet) — that is correct.

- [ ] **Step 4: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): loadResources() fetches from Supabase on unit open"
```

---

## Task 4: saveResource() and deleteResource() functions

**Files:**
- Modify: `solo/index.html`

**Context:** Add these two functions after `loadResources()` (after line 1928 once Task 3 is done).

- [ ] **Step 1: Add saveResource() function**

After `loadResources()`, add:

```js
  async function saveResource(){
    if(!newResLabel.trim()){return;}
    if(newResType!=="question"&&!newResUrl.trim()){return;}
    if(newResType==="question"&&(!newResQ.text.trim()||newResQ.options.some(o=>!o.text.trim()))){return;}
    const isAdmin=teacherEmail===ADMIN_EMAIL;
    const goGlobal=isAdmin&&addingToGlobal;
    const {data:{session}}=await sb.auth.getSession();
    const uid=session?.user?.id;
    if(!uid){return;}
    const base={
      unit_id:selectedUnit.id,
      outcome_id:resourceOutcome,
      type:newResType,
      label:newResLabel.trim(),
      scope:goGlobal?"global":"class",
      class_id:goGlobal?null:selectedClassId,
      created_by:uid,
      sort_order:soloResources.filter(r=>r.outcome_id===resourceOutcome).length,
    };
    const payload=newResType==="question"
      ?{...base,question:newResQ}
      :{...base,url:newResUrl.trim()};
    await sb.from("solo_resources").insert(payload);
    await loadResources(selectedUnit.id,selectedClassId);
    setAddingResource(false);
    setNewResLabel("");setNewResUrl("");setNewResType("video");
    setNewResQ({text:"",options:[{text:"",correct:true},{text:"",correct:false},{text:"",correct:false},{text:"",correct:false}]});
  }
```

- [ ] **Step 2: Add deleteResource() function**

After `saveResource()`, add:

```js
  async function deleteResource(id){
    await sb.from("solo_resources").delete().eq("id",id);
    setSoloResources(prev=>prev.filter(r=>r.id!==id));
  }
```

- [ ] **Step 3: Verify no syntax errors**

Reload http://localhost:8080/solo/ — no console errors.

- [ ] **Step 4: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): saveResource() and deleteResource() functions"
```

---

## Task 5: Teacher Resources tab UI

**Files:**
- Modify: `solo/index.html`

**Context:** The teacher unit rubric view starts at line 2967 (the `const uc=UC[selectedUnit.id];` line, which is the main class-overview view that shows the progress table). This is the view that needs the tab bar and the Resources panel. The `AppNav` for this view is at line 2970.

The Resources tab shows a two-column layout: left panel lists all outcomes; right panel shows global resources (read-only for teachers, editable for admin) and class resources (editable by teacher).

- [ ] **Step 1: Add tab pills to the teacher AppNav right slot**

Find line 2970:
```js
        <AppNav title={`${selectedUnit.name}: ${selectedUnit.subtitle}`} right={<><button onClick={()=>{setView("home");setTeacherFocus(null);}} ...>← All units</button><button onClick={doLogout} ...>Sign out</button></>}/>
```

Replace the `right` prop content to include tab pills between the two buttons:

```js
        <AppNav title={`${selectedUnit.name}: ${selectedUnit.subtitle}`} right={<>
          <button onClick={()=>{setView("home");setTeacherFocus(null);}} style={{fontFamily:ff,fontSize:12,padding:"6px 12px",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,color:"rgba(255,255,255,0.8)",cursor:"pointer"}}>← All units</button>
          <div style={{display:"flex",background:"rgba(255,255,255,0.1)",borderRadius:8,padding:2,gap:2}}>
            {["rubric","resources"].map(t=>(
              <button key={t} onClick={()=>setResourceTab(t)} style={{fontFamily:ff,fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",background:resourceTab===t?"#fff":"transparent",color:resourceTab===t?"var(--indigo)":"rgba(255,255,255,0.7)",transition:"all 0.15s"}}>
                {t==="rubric"?"Rubric":"📚 Resources"}
              </button>
            ))}
          </div>
          <button onClick={doLogout} style={{fontFamily:ff,fontSize:12,padding:"6px 12px",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,color:"rgba(255,255,255,0.8)",cursor:"pointer"}}>Sign out</button>
        </>}/>
```

- [ ] **Step 2: Wrap existing rubric content in a conditional**

Find line 2971 (the `<div style={{flex:1,overflowY:"auto"...` that wraps the table and progress bars). This div and everything inside it up to the closing `</div></div>` at line 3020 is the rubric content.

Wrap it:
```js
        {resourceTab==="rubric"&&(
          <div style={{flex:1,overflowY:"auto",padding:"1rem"}}>
            {/* ...existing table and completion bars... */}
          </div>
        )}
        {resourceTab==="resources"&&(
          <ResourcesPanel
            unit={selectedUnit}
            resources={soloResources}
            selectedOutcome={resourceOutcome}
            onSelectOutcome={setResourceOutcome}
            teacherEmail={teacherEmail}
            selectedClassId={selectedClassId}
            addingResource={addingResource}
            setAddingResource={setAddingResource}
            addingToGlobal={addingToGlobal}
            setAddingToGlobal={setAddingToGlobal}
            newResType={newResType} setNewResType={setNewResType}
            newResLabel={newResLabel} setNewResLabel={setNewResLabel}
            newResUrl={newResUrl} setNewResUrl={setNewResUrl}
            newResQ={newResQ} setNewResQ={setNewResQ}
            onSave={saveResource}
            onDelete={deleteResource}
          />
        )}
```

- [ ] **Step 3: Add the ResourcesPanel component**

Add this module-level component above `function AppNav(...)` (around line 1778). `TYPE_ICON` is defined first, then `GrowQuiz` (Task 7), then `ResourcesPanel`. Since Tasks 5 and 7 both add module-level components, add `ResourcesPanel` immediately — Task 7 will insert `GrowQuiz` above it later.

```js
const TYPE_ICON={video:"📹",website:"🌐",pdf:"📄",game:"🎮",question:"❓"};

function ResourcesPanel({unit,resources,selectedOutcome,onSelectOutcome,teacherEmail,selectedClassId,addingResource,setAddingResource,addingToGlobal,setAddingToGlobal,newResType,setNewResType,newResLabel,setNewResLabel,newResUrl,setNewResUrl,newResQ,setNewResQ,onSave,onDelete}){
  const ff2="'Lexend',sans-serif";
  const isAdmin=teacherEmail===ADMIN_EMAIL;

  const globalRes=resources.filter(r=>r.scope==="global"&&r.outcome_id===selectedOutcome);
  const classRes=resources.filter(r=>r.scope==="class"&&r.outcome_id===selectedOutcome);

  function ResourceRow({r,canDelete}){
    const domain=r.url?new URL(r.url).hostname.replace(/^www\./,""):"";
    return(
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:8}}>
        <span style={{fontSize:16,flexShrink:0}}>{TYPE_ICON[r.type]||"📎"}</span>
        <div style={{flex:1,minWidth:0}}>
          <p style={{margin:0,fontSize:13,fontWeight:500,color:"#0f172a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.label}</p>
          <p style={{margin:0,fontSize:11,color:"#94a3b8"}}>{r.type==="question"?"Practice question":domain}</p>
        </div>
        {canDelete&&(
          <button onClick={()=>onDelete(r.id)} style={{fontFamily:ff2,fontSize:11,padding:"3px 8px",background:"#fee2e2",color:"#dc2626",border:"1px solid #fca5a5",borderRadius:6,cursor:"pointer"}}>✕</button>
        )}
      </div>
    );
  }

  function AddForm({targetScope}){
    const types=["video","website","pdf","game","question"];
    return(
      <div style={{background:"#f8fafc",border:"1px dashed #c7d2fe",borderRadius:10,padding:"12px 14px",marginTop:8}}>
        {isAdmin&&(
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            {["class","global"].map(s=>(
              <button key={s} onClick={()=>setAddingToGlobal(s==="global")} style={{fontFamily:ff2,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,border:"1.5px solid",cursor:"pointer",borderColor:((addingToGlobal&&s==="global")||(!addingToGlobal&&s==="class"))?"var(--indigo)":"#e2e8f0",background:((addingToGlobal&&s==="global")||(!addingToGlobal&&s==="class"))?"var(--ind-50)":"#fff",color:((addingToGlobal&&s==="global")||(!addingToGlobal&&s==="class"))?"var(--indigo)":"#94a3b8"}}>
                {s==="global"?"🌐 Global":"🏫 Your class"}
              </button>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {types.map(t=>(
            <button key={t} onClick={()=>setNewResType(t)} style={{fontFamily:ff2,fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:6,border:"1.5px solid",cursor:"pointer",borderColor:newResType===t?"var(--indigo)":"#e2e8f0",background:newResType===t?"var(--ind-50)":"#fff",color:newResType===t?"var(--indigo)":"#64748b"}}>
              {TYPE_ICON[t]} {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
        <input value={newResLabel} onChange={e=>setNewResLabel(e.target.value)} placeholder="Label (e.g. Comparing fractions on a number line)" style={{fontFamily:ff2,width:"100%",padding:"8px 10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,marginBottom:8,boxSizing:"border-box"}}/>
        {newResType!=="question"&&(
          <input value={newResUrl} onChange={e=>setNewResUrl(e.target.value)} placeholder="URL (https://...)" style={{fontFamily:ff2,width:"100%",padding:"8px 10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,marginBottom:8,boxSizing:"border-box"}}/>
        )}
        {newResType==="question"&&(
          <div>
            <input value={newResQ.text} onChange={e=>setNewResQ(q=>({...q,text:e.target.value}))} placeholder="Question text" style={{fontFamily:ff2,width:"100%",padding:"8px 10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,marginBottom:8,boxSizing:"border-box"}}/>
            {newResQ.options.map((opt,i)=>(
              <div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:700,color:"#64748b",width:16,flexShrink:0}}>{String.fromCharCode(65+i)}</span>
                <input value={opt.text} onChange={e=>setNewResQ(q=>{const o=[...q.options];o[i]={...o[i],text:e.target.value};return {...q,options:o};})} placeholder={`Option ${String.fromCharCode(65+i)}`} style={{fontFamily:ff2,flex:1,padding:"6px 10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13}}/>
                <button onClick={()=>setNewResQ(q=>{const o=q.options.map((x,j)=>({...x,correct:j===i}));return {...q,options:o};})} style={{fontFamily:ff2,fontSize:11,padding:"4px 8px",borderRadius:6,border:"1.5px solid",cursor:"pointer",borderColor:opt.correct?"#16a34a":"#e2e8f0",background:opt.correct?"#f0fdf4":"#fff",color:opt.correct?"#16a34a":"#94a3b8",flexShrink:0}}>
                  {opt.correct?"✓ Correct":"Mark correct"}
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:6,marginTop:4}}>
          <button onClick={()=>{setAddingResource(false);setNewResLabel("");setNewResUrl("");setNewResType("video");}} style={{fontFamily:ff2,fontSize:12,padding:"7px 14px",background:"#f1f5f9",color:"#64748b",border:"1px solid #e2e8f0",borderRadius:8,cursor:"pointer"}}>Cancel</button>
          <button onClick={onSave} style={{fontFamily:ff2,fontSize:12,fontWeight:700,padding:"7px 16px",background:"linear-gradient(135deg,var(--indigo),var(--blue))",color:"#fff",border:"none",borderRadius:8,cursor:"pointer"}}>Save resource</button>
        </div>
      </div>
    );
  }

  return(
    <div style={{flex:1,display:"flex",minHeight:0,fontFamily:ff2}}>
      {/* Left panel — outcome list */}
      <div style={{width:140,flexShrink:0,borderRight:"1px solid var(--border)",overflowY:"auto",padding:"12px 8px"}}>
        <p style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 8px 4px"}}>Outcomes</p>
        {unit.outcomes.map(o=>{
          const count=resources.filter(r=>r.outcome_id===o.id).length;
          const sel=o.id===selectedOutcome;
          return(
            <button key={o.id} onClick={()=>onSelectOutcome(o.id)} style={{fontFamily:ff2,width:"100%",textAlign:"left",padding:"7px 10px",borderRadius:8,border:"none",cursor:"pointer",background:sel?"var(--ind-50)":"transparent",marginBottom:2}}>
              <p style={{margin:0,fontSize:12,fontWeight:sel?700:500,color:sel?"var(--indigo)":"#334155",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.short}</p>
              {count>0&&<p style={{margin:0,fontSize:10,color:sel?"var(--ind-mid)":"#94a3b8"}}>{count} resource{count!==1?"s":""}</p>}
            </button>
          );
        })}
      </div>

      {/* Right panel */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        {/* Global section */}
        <div style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <p style={{margin:0,fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em"}}>🌐 Global (all classes)</p>
            {globalRes.length===0&&<span style={{fontSize:11,color:"#cbd5e1"}}>— none yet</span>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {globalRes.map(r=><ResourceRow key={r.id} r={r} canDelete={isAdmin}/>)}
          </div>
          {isAdmin&&!addingResource&&(
            <button onClick={()=>{setAddingResource(true);setAddingToGlobal(true);}} style={{fontFamily:ff2,fontSize:12,padding:"7px 14px",background:"var(--ind-50)",color:"var(--indigo)",border:"1.5px dashed var(--ind-200)",borderRadius:8,cursor:"pointer",marginTop:8,fontWeight:600}}>+ Add global resource</button>
          )}
          {isAdmin&&addingResource&&addingToGlobal&&<AddForm targetScope="global"/>}
        </div>

        {/* Class section */}
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <p style={{margin:0,fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em"}}>🏫 Your class</p>
            {classRes.length===0&&<span style={{fontSize:11,color:"#cbd5e1"}}>— none yet</span>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {classRes.map(r=><ResourceRow key={r.id} r={r} canDelete={true}/>)}
          </div>
          {!addingResource&&(
            <button onClick={()=>{setAddingResource(true);setAddingToGlobal(false);}} style={{fontFamily:ff2,fontSize:12,padding:"7px 14px",background:"var(--ind-50)",color:"var(--indigo)",border:"1.5px dashed var(--ind-200)",borderRadius:8,cursor:"pointer",marginTop:8,fontWeight:600}}>+ Add class resource</button>
          )}
          {addingResource&&!addingToGlobal&&<AddForm targetScope="class"/>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify the Resources tab in browser**

Log in as a teacher → pick a class → click a unit → click "📚 Resources" tab.

Expected:
- Left panel shows all outcomes for the unit
- Right panel shows "Global" and "Your class" sections (both empty)
- "+ Add class resource" button is visible
- Admin login (nickdeeney135@gmail.com) also sees "+ Add global resource"

- [ ] **Step 5: Test adding a resource**

As admin, click "+ Add global resource" → pick "Video" → enter a label and a URL → click "Save resource".

Expected: resource appears in the Global section immediately. Reload the page, log back in, open the same unit — resource is still there (persisted in Supabase).

- [ ] **Step 6: Test deleting a resource**

Click the "✕" button on the resource you just added.

Expected: resource disappears from the list immediately. Reload to confirm it's gone from Supabase.

- [ ] **Step 7: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): ResourcesPanel component + teacher Resources tab"
```

---

## Task 6: Student Grow panel — merged resources + link cards

**Files:**
- Modify: `solo/index.html`

**Context:** The student rubric Grow panel is at lines 2340–2383. The current code reads hardcoded `RESOURCES` and renders a simple link list. Replace it with merged links + mini quiz.

- [ ] **Step 1: Update the Grow button visibility check**

Find line 2341–2342 and 2352:
```js
                      const res=RESOURCES[resKey]||[];
                      const isExpanded=expandedResource===resKey;
```
and:
```js
                              {res.length>0&&(
```

Change to:
```js
                      const res=RESOURCES[resKey]||[];
                      const dynRes=soloResources.filter(r=>r.outcome_id===o.id);
                      const allLinks=[
                        ...res.map(r=>({...r,_src:"hard"})),
                        ...dynRes.filter(r=>r.type!=="question").map(r=>({...r,_src:"db"})),
                      ];
                      const allQuestions=dynRes.filter(r=>r.type==="question");
                      const hasResources=allLinks.length>0||allQuestions.length>0;
                      const isExpanded=expandedResource===resKey;
```

and the button condition:
```js
                              {hasResources&&(
```

- [ ] **Step 2: Replace the expanded Grow panel content**

Find lines 2369–2383 (the `{isExpanded&&res.length>0&&(` block). Replace the entire block with:

```js
                          {isExpanded&&hasResources&&(
                            <div style={{borderTop:"1px solid var(--border)",padding:"12px 14px",background:"var(--ind-50)"}}>
                              {allLinks.length>0&&(
                                <>
                                  <p style={{fontSize:11,fontWeight:700,color:"var(--sub)",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Resources</p>
                                  <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:allQuestions.length>0?14:0}}>
                                    {allLinks.map((r,ri)=>(
                                      <a key={ri} href={r.url} target="_blank" rel="noreferrer"
                                        style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,textDecoration:"none",color:"var(--text)"}}>
                                        <span style={{fontSize:16,flexShrink:0}}>{r.type==="video"||r.type==="worksheet"?"📹":r.type==="pdf"?"📄":r.type==="game"?"🎮":"🌐"}</span>
                                        <span style={{fontSize:13,fontWeight:500,flex:1}}>{r.label}</span>
                                        <span style={{fontSize:11,color:"var(--muted)",flexShrink:0}}>↗</span>
                                      </a>
                                    ))}
                                  </div>
                                </>
                              )}
                              {allQuestions.length>0&&(
                                <GrowQuiz questions={allQuestions} outcomeId={o.id} quizState={quizState} setQuizState={setQuizState}/>
                              )}
                            </div>
                          )}
```

- [ ] **Step 3: Verify in browser as student**

Log in as a student → open a unit that has hardcoded resources in the `RESOURCES` object (e.g. unit u24). Tap Grow on an outcome.

Expected: link cards appear with ↗ icon. Tapping a card opens the URL in a new tab.

For an outcome that has both hardcoded links and a DB resource (add one as admin first), verify both appear merged.

- [ ] **Step 4: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): update Grow panel — merged hardcoded + Supabase resources"
```

---

## Task 7: Mini quiz component for student Grow panel

**Files:**
- Modify: `solo/index.html`

**Context:** Add `GrowQuiz` as a module-level component above `ResourcesPanel`. It uses `quizState` passed from App. `quizState` is keyed by `o.id` (e.g. `"r1"`).

- [ ] **Step 1: Add GrowQuiz component above ResourcesPanel**

```js
function GrowQuiz({questions,outcomeId,quizState,setQuizState}){
  const ff2="'Lexend',sans-serif";
  const state=quizState[outcomeId]||{idx:0,answered:null};
  const {idx,answered}=state;
  const q=questions[idx];

  function pickAnswer(i){
    if(answered!==null)return;
    setQuizState(prev=>({...prev,[outcomeId]:{idx,answered:i}}));
  }

  function next(){
    setQuizState(prev=>({...prev,[outcomeId]:{idx:idx+1,answered:null}}));
  }

  function reset(){
    setQuizState(prev=>({...prev,[outcomeId]:{idx:0,answered:null}}));
  }

  if(idx>=questions.length){
    return(
      <div style={{fontFamily:ff2,textAlign:"center",padding:"16px 0"}}>
        <p style={{fontSize:20,margin:"0 0 6px"}}>🎉</p>
        <p style={{fontSize:13,fontWeight:700,color:"#16a34a",margin:"0 0 10px"}}>All done!</p>
        <button onClick={reset} style={{fontFamily:ff2,fontSize:12,padding:"7px 16px",background:"var(--ind-50)",color:"var(--indigo)",border:"1.5px solid var(--ind-200)",borderRadius:8,cursor:"pointer",fontWeight:600}}>Try again</button>
      </div>
    );
  }

  const correctIdx=q.question.options.findIndex(o=>o.correct);
  const isCorrect=answered===correctIdx;

  return(
    <div style={{fontFamily:ff2}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <p style={{margin:0,fontSize:11,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:"0.05em"}}>Practice questions</p>
        <span style={{fontSize:11,color:"var(--muted)"}}>{idx+1} of {questions.length}</span>
      </div>
      <p style={{fontSize:14,fontWeight:600,color:"var(--text)",lineHeight:1.5,margin:"0 0 12px"}}>{q.question.text}</p>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
        {q.question.options.map((opt,i)=>{
          let bg="var(--surface)",border="1px solid #e2e8f0",color="var(--text)";
          if(answered!==null){
            if(i===correctIdx){bg="#f0fdf4";border="1.5px solid #86efac";color="#16a34a";}
            else if(i===answered&&!isCorrect){bg="#fef2f2";border="1.5px solid #fca5a5";color="#dc2626";}
          }
          return(
            <button key={i} onClick={()=>pickAnswer(i)}
              style={{fontFamily:ff2,textAlign:"left",padding:"10px 14px",borderRadius:10,cursor:answered!==null?"default":"pointer",background:bg,border,color,fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:10}}>
              <span style={{width:20,height:20,borderRadius:"50%",flexShrink:0,background:"rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{String.fromCharCode(65+i)}</span>
              <span style={{flex:1}}>{opt.text}</span>
              {answered!==null&&i===correctIdx&&<span style={{flexShrink:0,color:"#16a34a",fontWeight:700}}>✓</span>}
              {answered!==null&&i===answered&&!isCorrect&&<span style={{flexShrink:0,color:"#dc2626",fontWeight:700}}>✗</span>}
            </button>
          );
        })}
      </div>
      {answered!==null&&(
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{margin:0,fontSize:12,fontWeight:700,color:isCorrect?"#16a34a":"#dc2626"}}>
            {isCorrect?"Correct! ✓":"Not quite — see the answer above."}
          </p>
          {idx<questions.length-1
            ?<button onClick={next} style={{fontFamily:ff2,fontSize:12,fontWeight:700,padding:"7px 16px",background:"linear-gradient(135deg,var(--indigo),var(--blue))",color:"#fff",border:"none",borderRadius:8,cursor:"pointer"}}>Next →</button>
            :<button onClick={next} style={{fontFamily:ff2,fontSize:12,fontWeight:700,padding:"7px 16px",background:"#f0fdf4",color:"#16a34a",border:"1.5px solid #86efac",borderRadius:8,cursor:"pointer"}}>Finish ✓</button>
          }
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the mini quiz in browser**

As admin, add a question-type resource to an outcome (e.g. "Which is bigger: 1/4 or 1/2?" with options "1/4 is bigger", "1/4 is smaller", "They are equal", "Can't compare" — mark option B correct).

Log in as a student, open the same unit, tap Grow on that outcome.

Expected:
- "Practice questions" header with "1 of 1" counter
- Question text shown
- 4 option buttons (A/B/C/D)
- Tap an option — it locks in; green ✓ on correct, red ✗ on wrong choice
- "Finish ✓" button appears → tap → "All done! 🎉" with "Try again"
- "Try again" resets to question 1

- [ ] **Step 3: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): GrowQuiz mini quiz component for student Grow panel"
```

---

## Self-Review Checklist (done by plan author, not implementer)

**Spec coverage:**
- ✅ Task 1 — `solo_resources` table + RLS
- ✅ Task 2 — All 9 new state vars + `teacherEmail` wiring + `ADMIN_EMAIL` constant
- ✅ Task 3 — `loadResources()` + call from `openUnit()`
- ✅ Task 4 — `saveResource()` + `deleteResource()`
- ✅ Task 5 — `ResourcesPanel` component with left/right layout, global/class sections, add form, question builder
- ✅ Task 6 — Student Grow panel updated with merged links
- ✅ Task 7 — `GrowQuiz` mini quiz component
- ✅ Section 6 of spec (Grow button visibility) — covered in Task 6 Step 1

**Not covered (out of scope per spec):**
- Editing existing resources (spec says add/delete only)
- Score recording for quiz answers (spec says untracked practice)
