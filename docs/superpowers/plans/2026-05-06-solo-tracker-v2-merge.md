# SOLO Tracker v2 Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `solo-tracker-v2.jsx` into `solo/index.html`, adding touch support, doubled question bank, practice mode, resources panel, and multi-unit pretest — while keeping all existing Supabase login/progress code intact.

**Architecture:** All changes are in `solo/index.html`. The file is a single-page React app served as a static HTML with Babel transpilation. Changes fall into four layers: (1) two improved UI components, (2) three new/expanded data constants, (3) new practice-mode state + functions, (4) updated view renders.

**Tech Stack:** React 18 (UMD), Babel standalone, Supabase JS v2, plain HTML/CSS-in-JS

---

## File map

| File | Action | What changes |
|---|---|---|
| `solo/index.html` | Modify | All changes below — see tasks |
| `solo-tracker-v2.jsx` | Source only | Extract content from here, do NOT modify |

---

## Task 1: Touch support + `useIsMobile` hook

Two self-contained component changes that can be committed on their own.

**Files:**
- Modify: `solo/index.html:21` (React imports)
- Modify: `solo/index.html:49-101` (NumberLineQ)
- Modify: `solo/index.html:21` (after Frac, before NumberLineQ)

- [ ] **Step 1: Add `useEffect` to the React destructure**

At line 21, change:
```js
const { useState, useRef } = React;
```
to:
```js
const { useState, useRef, useEffect } = React;
```

- [ ] **Step 2: Add `useIsMobile` hook** (paste immediately after the `Frac` component, before `NumberLineQ`)

```js
function useIsMobile(){ const [m,setM]=useState(()=>window.innerWidth<640); useEffect(()=>{const h=()=>setM(window.innerWidth<640);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return m; }
```

- [ ] **Step 3: Replace `NumberLineQ` with touch-capable version**

Replace the entire `NumberLineQ` function (lines 49–101) with this version, which handles both mouse and touch events:

```js
function NumberLineQ({q,ans,setAns}){
  const lineRef=useRef(null);
  const [held,setHeld]=useState(null);
  const placed=ans.nlPlaced||{};
  const unplaced=q.tokens.filter(t=>placed[t]===undefined);

  function posFromEvent(e){
    const rect=lineRef.current.getBoundingClientRect();
    const clientX=e.touches?e.touches[0].clientX:e.changedTouches?e.changedTouches[0].clientX:e.clientX;
    return Math.max(0.02,Math.min(0.97,(clientX-rect.left)/rect.width));
  }
  function pickUp(token){
    if(held===token){setHeld(null);return;}
    if(placed[token]!==undefined){const np={...placed};delete np[token];setAns(a=>({...a,nlPlaced:np}));}
    setHeld(token);
  }
  function placeToken(e){
    if(!held)return;
    e.preventDefault();
    const pos=posFromEvent(e);
    setAns(a=>({...a,nlPlaced:{...(a.nlPlaced||{}),[held]:pos}}));
    setHeld(null);
  }
  return(
    <div>
      <p style={{fontSize:13,color:"#64748b",margin:"0 0 14px",fontStyle:"italic"}}>
        {held?<><strong style={{color:"#1e40af"}}>Tap the number line</strong> to place <strong style={{color:"#1e40af"}}>{held}</strong></>
          :"Tap a fraction to pick it up, then tap the number line to place it."}
      </p>
      <div style={{display:"flex",gap:10,marginBottom:28,flexWrap:"wrap",minHeight:52}}>
        {unplaced.map(t=>(
          <button key={t} onClick={()=>pickUp(t)} style={{padding:"10px 20px",background:held===t?"#1e40af":"#eff6ff",color:held===t?"#fff":"#1d4ed8",border:`2px solid ${held===t?"#1e40af":"#93c5fd"}`,borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:16,display:"flex",alignItems:"center",gap:4,minHeight:44,boxShadow:held===t?"0 2px 8px rgba(30,64,175,0.3)":"none",transform:held===t?"scale(1.05)":"scale(1)",transition:"all 0.15s"}}>
            <Frac v={t} s={14} c={held===t?"#fff":"#1d4ed8"}/>
          </button>
        ))}
        {unplaced.length===0&&<span style={{fontSize:13,color:"#94a3b8",alignSelf:"center"}}>All placed — tap a token to move it</span>}
      </div>
      <div style={{padding:"40px 20px 36px",cursor:held?"crosshair":"default",background:held?"#f0f9ff":"#f8fafc",borderRadius:12,border:`1.5px solid ${held?"#93c5fd":"#e2e8f0"}`,transition:"all 0.15s",touchAction:"none"}}
        onClick={placeToken} onTouchEnd={placeToken}>
        <div ref={lineRef} style={{position:"relative",height:4,background:"#334155",borderRadius:2}}>
          <div style={{position:"absolute",left:-8,top:-4,width:0,height:0,borderTop:"6px solid transparent",borderBottom:"6px solid transparent",borderRight:"10px solid #334155"}}/>
          <div style={{position:"absolute",right:-8,top:-4,width:0,height:0,borderTop:"6px solid transparent",borderBottom:"6px solid transparent",borderLeft:"10px solid #334155"}}/>
          {[0,0.25,0.5,0.75,1].map(p=>(
            <div key={p} style={{position:"absolute",left:`${p*100}%`,top:-6,transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{width:2,height:16,background:"#334155"}}/>
              <span style={{marginTop:4,fontSize:11,fontWeight:600,color:"#475569"}}>{p===0?"0":p===1?"1":""}</span>
            </div>
          ))}
          {Object.entries(placed).map(([t,pos])=>(
            <div key={t} onClick={e=>{e.stopPropagation();pickUp(t);}}
              style={{position:"absolute",left:`${pos*100}%`,top:-42,transform:"translateX(-50%)",background:"#1e40af",color:"#fff",padding:"5px 12px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",zIndex:2,boxShadow:"0 2px 6px rgba(30,64,175,0.35)",display:"flex",alignItems:"center",minHeight:36}}>
              <Frac v={t} s={12} c="#fff"/>
              <div style={{position:"absolute",left:"50%",top:"100%",marginLeft:-1,width:2,height:22,background:"#1e40af"}}/>
            </div>
          ))}
        </div>
      </div>
      {Object.keys(placed).length>0&&<p style={{fontSize:11,color:"#94a3b8",margin:"8px 0 0",textAlign:"center"}}>Tap a placed fraction to move it</p>}
    </div>
  );
}
```

- [ ] **Step 4: Commit Task 1**

```bash
git add solo/index.html
git commit -m "feat(solo): touch support + useIsMobile for NumberLineQ"
```

---

## Task 2: Data layer — expanded UNITS, PRETESTS, PRACTICE, RESOURCES

This swaps the question data and adds three new constants. The existing `PRETEST` array must be renamed/replaced with the `PRETESTS` object; the view code that references `PRETEST` is updated in Task 4.

**Files:**
- Modify: `solo/index.html` — UNITS block (lines 206–786), PRETEST block (lines 788–859), add PRACTICE and RESOURCES after

- [ ] **Step 1: Replace UNITS**

The UNITS block in `solo-tracker-v2.jsx` starts at line 194 (`const UNITS = [`) and ends at line 825 (the closing `];` before the PRETESTS block). Copy that entire block from `solo-tracker-v2.jsx` and replace the current UNITS block in `solo/index.html` (lines 206–786).

To get the exact v2 UNITS content:
```bash
sed -n '194,825p' solo-tracker-v2.jsx
```

Paste the output, replacing everything from `const UNITS = [` through the closing `];` in `solo/index.html`.

- [ ] **Step 2: Replace PRETEST with PRETESTS**

Remove the existing `PRETEST` array (lines 788–859 in current `solo/index.html`) and replace with the `PRETESTS` object from `solo-tracker-v2.jsx`:

```bash
sed -n '826,960p' solo-tracker-v2.jsx
```

Paste that block (it starts `const PRETESTS = {` and ends with `};`) in place of the old `const PRETEST = [...]`.

- [ ] **Step 3: Add PRACTICE constant**

Immediately after the PRETESTS block (after its closing `};`), paste the PRACTICE block from `solo-tracker-v2.jsx`:

```bash
sed -n '989,1583p' solo-tracker-v2.jsx
```

This is the block that starts `// ─── Practice question banks` and ends at `};` before the RESOURCES block.

- [ ] **Step 4: Add RESOURCES constant**

After PRACTICE, paste RESOURCES:

```bash
sed -n '1587,1789p' solo-tracker-v2.jsx
```

This starts `// ─── Resources` and ends at `};`.

- [ ] **Step 5: Verify the file structure is correct**

Check that these four constants appear in this order in `solo/index.html`:
```bash
grep -n "^const UNITS\|^const PRETESTS\|^const PRACTICE\|^const RESOURCES\|^// ─── Supabase" solo/index.html
```
Expected: UNITS → PRETESTS → PRACTICE → RESOURCES → Supabase setup (in that order).

- [ ] **Step 6: Commit Task 2**

```bash
git add solo/index.html
git commit -m "feat(solo): expanded question bank, PRETESTS/PRACTICE/RESOURCES data"
```

---

## Task 3: Practice state, functions, and updated pretest logic

Add practice-mode state variables to the App, add five new functions, update `startPretest` to accept a `unitId`, and fix `doLogout` to clear practice state.

**Files:**
- Modify: `solo/index.html` — App function body

- [ ] **Step 1: Add `isMobile` and new state variables to App**

In the App function, immediately after the existing `const [pretestResults,setPretestResults]=useState(null);` line, add:

```js
  const isMobile=useIsMobile();
  const [expandedResource,setExpandedResource]=useState(null);
  const [practiceOutcome,setPracticeOutcome]=useState(null);
  const [practiceUnit,setPracticeUnit]=useState(null);
  const [practicePhase,setPracticePhase]=useState("example");
  const [practiceIdx,setPracticeIdx]=useState(0);
  const [practiceAns,setPracticeAns]=useState({input:"",option:"",orderSeq:[],shadedCells:[],nlPlaced:{},matchPairs:{},partitionShaded:[]});
  const [practiceSubmitted,setPracticeSubmitted]=useState(false);
  const [practiceCorrect,setPracticeCorrect]=useState(false);
  const [practiceAttempts,setPracticeAttempts]=useState(0);
  const [practiceScore,setPracticeScore]=useState({correct:0,total:0});
```

- [ ] **Step 2: Update `startPretest` to accept unitId**

Replace the current `startPretest()` function with:

```js
  function startPretest(unitId){
    const data=PRETESTS[unitId]||[];
    const flat=data.flatMap(section=>section.questions.map(q=>({outcomeId:section.outcomeId,short:section.short,q,unitId})));
    setPretestQList(flat);
    setPretestIdx(0);
    setPretestAnswers([]);
    setPretestAns(initAns(flat[0].q));
    setPretestResults(null);
    setPretestMode("running");
    setView("pretest");
  }
```

- [ ] **Step 3: Update `handlePretestNext` for multi-unit auto-tick**

Replace the `handlePretestNext` function. The key change is that the auto-tick now reads `unitId` from the stored flat item so it works for u25 as well as u24:

```js
  function handlePretestNext(){
    const current=pretestQList[pretestIdx];
    const q=current.q;
    let given;
    if(q.type==="order")given=pretestAns.orderSeq;
    else if(q.type==="shade")given=pretestAns.shadedCells.filter(Boolean).length;
    else if(q.type==="numberline")given=pretestAns.nlPlaced;
    else if(q.type==="match")given=pretestAns.matchPairs;
    else if(q.type==="partition")given=pretestAns.partitionShaded;
    else if(q.type==="mc"||q.type==="truefalse")given=pretestAns.option;
    else given=pretestAns.input;
    const correct=checkAnswer(given,q);
    const newAnswers=[...pretestAnswers,{outcomeId:current.outcomeId,short:current.short,q,given,correct,unitId:current.unitId}];
    setPretestAnswers(newAnswers);
    if(pretestIdx<pretestQList.length-1){
      setPretestIdx(pretestIdx+1);
      setPretestAns(initAns(pretestQList[pretestIdx+1].q));
    } else {
      const byOutcome={};
      newAnswers.forEach(a=>{if(!byOutcome[a.outcomeId])byOutcome[a.outcomeId]={short:a.short,total:0,correct:0,wrong:[],unitId:a.unitId};byOutcome[a.outcomeId].total++;if(a.correct)byOutcome[a.outcomeId].correct++;else byOutcome[a.outcomeId].wrong.push(a.q.text);});
      const passed=Object.keys(byOutcome).filter(id=>byOutcome[id].correct===byOutcome[id].total);
      if(studentId){
        setProgress(p=>{
          const updated={...p[studentId]};
          passed.forEach(id=>{const uid=byOutcome[id].unitId||"u24";updated[`${uid}_${id}`]=true;});
          return{...p,[studentId]:updated};
        });
        passed.forEach(id=>saveOutcome(studentId,`${byOutcome[id].unitId||"u24"}_${id}`,true));
      }
      setPretestResults({byOutcome,passed});
      setPretestMode("done");
    }
  }
```

- [ ] **Step 4: Update `doLogout` to reset practice state**

Replace `doLogout` with a version that also clears the practice state:

```js
  function doLogout(){
    sb.auth.signOut();
    setView("login");setStudentId(null);setIsTeacher(false);setLoginClassCode("");setLoginClassObj(null);setLoginStep("class");setLoginCode("");setLoginEmail("");setLoginPassword("");setLoginError("");setSelectedUnit(null);setTeacherFocus(null);setStudents([]);setClasses([]);setSelectedClassId(null);setProgress({});setTimestamps({});setLoginMode("student");
    setExpandedResource(null);setPracticeOutcome(null);setPracticeUnit(null);setPracticePhase("example");setPracticeIdx(0);setPracticeSubmitted(false);setPracticeCorrect(false);setPracticeAttempts(0);setPracticeScore({correct:0,total:0});
  }
```

- [ ] **Step 5: Add practice functions**

Paste these five functions immediately after `canGo()` (before `const ff=...`):

```js
  function startPractice(unit,outcome){
    setPracticeUnit(unit);setPracticeOutcome(outcome);
    setPracticePhase("example");setPracticeIdx(0);
    setPracticeAns({input:"",option:"",orderSeq:[],shadedCells:[],nlPlaced:{},matchPairs:{},partitionShaded:[]});
    setPracticeSubmitted(false);setPracticeCorrect(false);setPracticeAttempts(0);
    setPracticeScore({correct:0,total:0});
    setView("practice");
  }

  function getPracticeData(){
    if(!practiceOutcome||!practiceUnit)return null;
    return PRACTICE[`${practiceUnit.id}_${practiceOutcome.id}`]||null;
  }

  function submitPracticeAnswer(){
    const pd=getPracticeData();if(!pd)return;
    const q=pd.questions[practiceIdx];
    let given;
    if(q.type==="order")given=practiceAns.orderSeq;
    else if(q.type==="shade")given=practiceAns.shadedCells.filter(Boolean).length;
    else if(q.type==="numberline")given=practiceAns.nlPlaced;
    else if(q.type==="match")given=practiceAns.matchPairs;
    else if(q.type==="partition")given=practiceAns.partitionShaded;
    else if(q.type==="mc"||q.type==="truefalse")given=practiceAns.option;
    else given=practiceAns.input;
    const correct=checkAnswer(given,q);
    setPracticeCorrect(correct);
    setPracticeSubmitted(true);
    setPracticeAttempts(a=>a+1);
    if(correct)setPracticeScore(s=>({correct:s.correct+1,total:s.total+1}));
    else if(practiceAttempts===0){}
    else setPracticeScore(s=>({...s,total:s.total+1}));
  }

  function nextPracticeQuestion(){
    const pd=getPracticeData();if(!pd)return;
    if(!practiceCorrect&&practiceAttempts===1){
      setPracticeAns({input:"",option:"",orderSeq:[],shadedCells:[],nlPlaced:{},matchPairs:{},partitionShaded:[]});
      setPracticeSubmitted(false);setPracticeCorrect(false);
      return;
    }
    if(practiceIdx<pd.questions.length-1){
      setPracticeIdx(i=>i+1);
      setPracticeAns({input:"",option:"",orderSeq:[],shadedCells:[],nlPlaced:{},matchPairs:{},partitionShaded:[]});
      setPracticeSubmitted(false);setPracticeCorrect(false);setPracticeAttempts(0);
    } else {
      if(!practiceCorrect)setPracticeScore(s=>({...s,total:s.total+1}));
      setPracticePhase("done");
    }
  }

  function practiceCan(){
    const pd=getPracticeData();if(!pd)return false;
    const q=pd.questions[practiceIdx];
    if(q.type==="input")return practiceAns.input.trim().length>0;
    if(q.type==="mc"||q.type==="truefalse")return practiceAns.option.length>0;
    if(q.type==="order")return practiceAns.orderSeq.length===q.items.length;
    if(q.type==="shade")return practiceAns.shadedCells.some(Boolean);
    if(q.type==="numberline")return q.tokens.every(t=>(practiceAns.nlPlaced||{})[t]!==undefined);
    if(q.type==="match")return q.left.every(l=>(practiceAns.matchPairs||{})[l]!==undefined);
    if(q.type==="partition")return(practiceAns.partitionShaded||[]).length>0;
    return false;
  }
```

- [ ] **Step 6: Commit Task 3**

```bash
git add solo/index.html
git commit -m "feat(solo): practice mode state + functions, multi-unit pretest"
```

---

## Task 4: Update views — rubric, practice, pretest, home

Four view changes. All reference variables/functions added in Task 3. **Do not commit until all four sub-steps are done** — the views reference each other's state.

**Files:**
- Modify: `solo/index.html` — view render sections

- [ ] **Step 1: Update home view pretest button (u25 support)**

In the "home" view, find this block (around line 1291):
```js
{unit.id==="u24"&&!isTeacher&&(
  <button onClick={e=>{e.stopPropagation();startPretest();}}
```
Replace with:
```js
{(unit.id==="u24"||unit.id==="u25")&&!isTeacher&&(
  <button onClick={e=>{e.stopPropagation();startPretest(unit.id);}}
```

Also update the green-band pill in home view to show for u25 as well. Find:
```js
{unit.id==="u24"&&(()=>{
```
Replace with:
```js
{(unit.id==="u24"||unit.id==="u25")&&(()=>{
  const gTotal=unit.outcomes.filter(o=>o.band==="green").length;
  if(!gTotal)return null;
```
(Adjust the closing IIFE to return `null` when gTotal is 0.)

- [ ] **Step 2: Update student rubric view with Grow/Know buttons**

Replace the entire student rubric view (the block starting `if(view==="rubric"&&!isTeacher)` through its closing `);`) with this version that adds the resources expand panel and practice button:

```js
  if(view==="rubric"&&!isTeacher){
    const s=students.find(s=>s.id===studentId);
    const prog=progress[studentId];
    const {done,total}=unitProgress(prog,selectedUnit.id);
    const pct=Math.round(done/total*100);
    const uc=UC[selectedUnit.id];
    return(
      <div style={{maxWidth:580,margin:"0 auto",padding:"1rem",fontFamily:ff}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem"}}>
          <div>
            <button onClick={()=>setView("home")} style={{...Sb(),marginBottom:6,display:"block"}}>← All units</button>
            <h1 style={{fontSize:18,fontWeight:600,margin:"0 0 2px",color:"#0f172a"}}>{s.name} · {selectedUnit.name}: {selectedUnit.subtitle}</h1>
            <p style={{fontSize:13,color:"#64748b",margin:0}}>{done} of {total} outcomes complete</p>
          </div>
        </div>
        <div style={{background:"#f1f5f9",borderRadius:6,height:6,marginBottom:"1.5rem",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:uc.dot,borderRadius:6,transition:"width 0.4s"}}/>
        </div>
        {["red","yellow","green"].filter(band=>selectedUnit.outcomes.some(o=>o.band===band)).map(band=>{
          const bs=BAND[band];
          return(
            <div key={band} style={{marginBottom:"1.5rem"}}>
              <span style={{display:"inline-block",background:bs.bg,color:bs.text,border:`1px solid ${bs.border}`,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:6,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>{band}</span>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {selectedUnit.outcomes.filter(o=>o.band===band).map((o,i)=>{
                  const isDone=prog[`${selectedUnit.id}_${o.id}`];
                  const resKey=`${selectedUnit.id}_${o.id}`;
                  const res=RESOURCES[resKey]||[];
                  const isExpanded=expandedResource===resKey;
                  return(
                    <div key={o.id} style={{background:"#fff",border:`1px solid ${isDone?"#86efac":"#e2e8f0"}`,borderRadius:10,overflow:"hidden"}}>
                      <div style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:isDone?"#dcfce7":"#f1f5f9",color:isDone?"#16a34a":"#94a3b8"}}>{isDone?"✓":i+1}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:13,fontWeight:600,margin:"0 0 1px",color:isDone?"#16a34a":"#1e293b"}}>{o.short}</p>
                          <p style={{fontSize:11,color:"#94a3b8",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.label}</p>
                        </div>
                        <div style={{display:"flex",gap:6,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                          {res.length>0&&(
                            <button onClick={()=>setExpandedResource(isExpanded?null:resKey)}
                              style={{fontSize:12,padding:"8px 12px",background:isExpanded?"#1e40af":"#f0f9ff",color:isExpanded?"#fff":"#1d4ed8",border:`1px solid ${isExpanded?"#1e40af":"#93c5fd"}`,borderRadius:7,cursor:"pointer",fontWeight:600,minHeight:40}}>
                              📚 Grow
                            </button>
                          )}
                          {PRACTICE[resKey]&&!isDone&&(
                            <button onClick={()=>{setExpandedResource(null);startPractice(selectedUnit,o);}}
                              style={{fontSize:12,padding:"8px 12px",background:"#f0fdf4",color:"#16a34a",border:"1px solid #86efac",borderRadius:7,cursor:"pointer",fontWeight:600,minHeight:40}}>
                              ✏️ Know
                            </button>
                          )}
                          {isDone?<span style={{fontSize:11,fontWeight:700,color:"#16a34a",alignSelf:"center"}}>Done ✓</span>
                            :<button onClick={()=>{setExpandedResource(null);startOutcome(o);}} style={{fontSize:12,padding:"8px 14px",background:uc.dark,color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,minHeight:40}}>Show</button>}
                        </div>
                      </div>
                      {isExpanded&&res.length>0&&(
                        <div style={{borderTop:"1px solid #f1f5f9",padding:"10px 14px",background:"#f8fafc"}}>
                          <p style={{fontSize:11,fontWeight:700,color:"#64748b",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Learning resources</p>
                          <div style={{display:"flex",flexDirection:"column",gap:6}}>
                            {res.map((r,ri)=>(
                              <a key={ri} href={r.url} target="_blank" rel="noreferrer"
                                style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,textDecoration:"none",color:"#1e293b"}}>
                                <span style={{fontSize:16,flexShrink:0}}>{r.type==="video"?"▶️":r.type==="worksheet"?"📄":"🎮"}</span>
                                <span style={{fontSize:13,fontWeight:500,flex:1}}>{r.label}</span>
                                <span style={{fontSize:11,color:"#94a3b8",flexShrink:0,textTransform:"capitalize"}}>{r.type}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
```

- [ ] **Step 3: Add practice view**

Paste the practice view immediately **after** the student rubric view block (before the `// ── Pre-test / Post-test` comment):

```js
  // ── Practice mode ────────────────────────────────────────────────────────
  if(view==="practice"){
    const pd=getPracticeData();
    const uc=practiceUnit?UC[practiceUnit.id]:{dot:"#3b82f6",dark:"#1e3a8a"};
    const bs=practiceOutcome?BAND[practiceOutcome.band]:BAND.red;

    if(practicePhase==="done"){
      const pct=Math.round(practiceScore.correct/practiceScore.total*100)||0;
      return(
        <div style={{maxWidth:520,margin:"0 auto",padding:"1rem",fontFamily:ff}}>
          <div style={{textAlign:"center",padding:"1.5rem 0 1.25rem"}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:pct>=80?"#dcfce7":"#fef9c3",border:`2px solid ${pct>=80?"#86efac":"#fcd34d"}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:22}}>
              {pct>=80?"🌟":"👍"}
            </div>
            <h2 style={{fontSize:18,fontWeight:600,margin:"0 0 4px",color:"#0f172a"}}>Practice complete!</h2>
            <p style={{fontSize:13,color:"#64748b",margin:"0 0 4px"}}>{practiceOutcome?.short}</p>
            <p style={{fontSize:22,fontWeight:700,color:pct>=80?"#16a34a":"#f59e0b",margin:"8px 0 0"}}>{practiceScore.correct}/{practiceScore.total} correct</p>
            {pct>=80
              ?<p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Great work — you're ready to try the Show assessment!</p>
              :<p style={{fontSize:13,color:"#64748b",margin:"4px 0 0"}}>Keep going — review the worked example and try again.</p>}
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>{setPracticePhase("example");setPracticeIdx(0);setPracticeScore({correct:0,total:0});setPracticeSubmitted(false);setPracticeCorrect(false);setPracticeAttempts(0);setPracticeAns({input:"",option:"",orderSeq:[],shadedCells:[],nlPlaced:{},matchPairs:{},partitionShaded:[]});}}
              style={Sb({fontWeight:600})}>Try again</button>
            <button onClick={()=>setView("rubric")} style={Sb({background:uc.dark,color:"#fff",border:"none",fontWeight:600})}>Back to rubric</button>
          </div>
        </div>
      );
    }

    if(practicePhase==="example"){
      return(
        <div style={{maxWidth:520,margin:"0 auto",padding:"1rem",fontFamily:ff}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"1.25rem"}}>
            <button onClick={()=>setView("rubric")} style={Sb()}>← Back</button>
            <div>
              <p style={{fontSize:12,fontWeight:600,margin:"0 0 2px",color:"#64748b"}}>{practiceUnit?.name}: {practiceUnit?.subtitle}</p>
              <p style={{fontSize:14,fontWeight:600,margin:0,color:"#0f172a"}}>{practiceOutcome?.short}</p>
            </div>
          </div>
          <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"1.5rem",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <span style={{fontSize:18}}>📖</span>
              <span style={{fontSize:13,fontWeight:700,color:"#0f172a",textTransform:"uppercase",letterSpacing:"0.05em"}}>Worked Example</span>
            </div>
            {(pd?.example||[]).map((line,i)=>(
              <p key={i} style={{fontSize:i===0?14:13,fontWeight:i===0?600:400,color:i===0?"#0f172a":"#475569",margin:"0 0 8px",lineHeight:1.6,paddingLeft:i>0?12:0,borderLeft:i>0?"2px solid #e2e8f0":"none"}}>
                {line}
              </p>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>setPracticePhase("questions")}
              style={{fontSize:14,padding:"10px 24px",background:uc.dark,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>
              Start practice →
            </button>
          </div>
        </div>
      );
    }

    if(!pd)return null;
    const q=pd.questions[practiceIdx];
    const total=pd.questions.length;
    const pct=Math.round(practiceIdx/total*100);
    const ok=practiceCan();
    const pool=q.type==="order"?q.items.filter(item=>!practiceAns.orderSeq.includes(item)):[];
    const showAnswer=practiceSubmitted&&!practiceCorrect&&practiceAttempts>=2;

    return(
      <div style={{maxWidth:520,margin:"0 auto",padding:"1rem",fontFamily:ff}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"1.25rem"}}>
          <button onClick={()=>setPracticePhase("example")} style={Sb()}>← Example</button>
          <div style={{flex:1}}>
            <p style={{fontSize:12,fontWeight:600,margin:"0 0 5px",color:"#64748b"}}>{practiceOutcome?.short} — Practice</p>
            <div style={{background:"#f1f5f9",borderRadius:4,height:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:bs.dot,borderRadius:4,transition:"width 0.3s"}}/>
            </div>
          </div>
          <span style={{fontSize:12,color:"#94a3b8",flexShrink:0}}>{practiceIdx+1}/{total}</span>
        </div>
        <div style={{background:"#fff",border:`1px solid ${practiceSubmitted?(practiceCorrect?"#86efac":"#fca5a5"):"#e2e8f0"}`,borderRadius:12,padding:"1.5rem",marginBottom:12,transition:"border-color 0.2s"}}>
          <p style={{fontSize:16,fontWeight:500,margin:"0 0 1.25rem",lineHeight:1.6,color:"#0f172a"}}>{q.text}</p>
          {!practiceSubmitted&&<>
            {q.type==="input"&&(
              <><input autoFocus type="text" value={practiceAns.input} onChange={e=>setPracticeAns(a=>({...a,input:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&ok&&submitPracticeAnswer()}
                placeholder="Type your answer" style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",border:"1.5px solid #cbd5e1",borderRadius:8,fontSize:16,outline:"none"}}/>
              <p style={{fontSize:11,color:"#94a3b8",margin:"6px 0 0"}}>Use fractions like 3/4 or whole numbers</p></>
            )}
            {q.type==="mc"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
              {q.options.map(opt=><button key={opt} onClick={()=>setPracticeAns(a=>({...a,option:opt}))} style={Pb(practiceAns.option===opt)}>{opt}</button>)}
            </div>}
            {q.type==="truefalse"&&<div style={{display:"flex",gap:12}}>
              {["true","false"].map(v=><button key={v} onClick={()=>setPracticeAns(a=>({...a,option:v}))} style={Pb(practiceAns.option===v,{flex:1,textAlign:"center",fontSize:15})}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>)}
            </div>}
            {q.type==="order"&&<div>
              <p style={{fontSize:12,color:"#64748b",margin:"0 0 8px"}}>Click to build your order:</p>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",minHeight:44,marginBottom:14,padding:8,background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",alignItems:"center"}}>
                {pool.length>0?pool.map(item=><button key={item} onClick={()=>setPracticeAns(a=>({...a,orderSeq:[...a.orderSeq,item]}))} style={{padding:"10px 16px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:14,fontWeight:500,color:"#1e293b",minHeight:44}}>{item}</button>)
                  :<span style={{fontSize:12,color:"#94a3b8"}}>All placed</span>}
              </div>
              {practiceAns.orderSeq.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                {practiceAns.orderSeq.map((item,i)=><span key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                  {i>0&&<span style={{color:"#cbd5e1"}}>→</span>}
                  <button onClick={()=>setPracticeAns(a=>({...a,orderSeq:a.orderSeq.filter((_,idx)=>idx!==i)}))} style={{padding:"10px 16px",borderRadius:8,border:"1.5px solid #bfdbfe",background:"#eff6ff",cursor:"pointer",fontSize:14,color:"#1d4ed8",fontWeight:600,minHeight:44}}>{item}</button>
                </span>)}
              </div>}
            </div>}
            {q.type==="numberline"&&<NumberLineQ key={`p${practiceIdx}`} q={q} ans={practiceAns} setAns={setPracticeAns}/>}
            {q.type==="match"&&<MatchQ key={`p${practiceIdx}`} q={q} ans={practiceAns} setAns={setPracticeAns}/>}
            {q.type==="partition"&&<PartitionQ key={`p${practiceIdx}`} q={q} ans={practiceAns} setAns={setPracticeAns}/>}
          </>}
          {practiceSubmitted&&(
            <div style={{padding:"12px",borderRadius:8,background:practiceCorrect?"#f0fdf4":"#fef2f2",border:`1px solid ${practiceCorrect?"#86efac":"#fca5a5"}`}}>
              <p style={{fontSize:14,fontWeight:600,margin:"0 0 4px",color:practiceCorrect?"#16a34a":"#dc2626"}}>
                {practiceCorrect?"✓ Correct!":practiceAttempts===1?"✗ Not quite — try again!":"✗ Incorrect"}
              </p>
              {!practiceCorrect&&practiceAttempts===1&&<p style={{fontSize:13,color:"#64748b",margin:0}}>Review your working and have another go.</p>}
              {showAnswer&&<p style={{fontSize:13,color:"#475569",margin:"4px 0 0"}}>The correct answer is: <strong style={{color:"#16a34a"}}>{q.answer}</strong>{q.aliases?.length?` (also accepted: ${q.aliases.join(", ")})`:""}.</p>}
            </div>
          )}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          {!practiceSubmitted&&<button onClick={submitPracticeAnswer} disabled={!ok}
            style={{fontSize:14,padding:"9px 22px",background:ok?uc.dark:"#e2e8f0",color:ok?"#fff":"#94a3b8",border:"none",borderRadius:8,cursor:ok?"pointer":"default",fontWeight:600}}>
            Check answer
          </button>}
          {practiceSubmitted&&<>
            {!practiceCorrect&&practiceAttempts===1&&<button onClick={()=>{setPracticeSubmitted(false);setPracticeAns({input:"",option:"",orderSeq:[],shadedCells:[],nlPlaced:{},matchPairs:{},partitionShaded:[]});}}
              style={Sb({fontWeight:600,borderColor:"#f59e0b",color:"#92400e"})}>Try again</button>}
            <button onClick={nextPracticeQuestion}
              style={{fontSize:14,padding:"9px 22px",background:uc.dark,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>
              {practiceIdx===total-1?"Finish":"Next →"}
            </button>
          </>}
        </div>
        <div style={{marginTop:12,display:"flex",justifyContent:"center",gap:5}}>
          {pd.questions.map((_,i)=>(
            <div key={i} style={{width:8,height:8,borderRadius:"50%",background:i<practiceIdx?"#22c55e":i===practiceIdx?bs.dot:"#e2e8f0"}}/>
          ))}
        </div>
      </div>
    );
  }
```

- [ ] **Step 4: Update pretest results to use `PRETESTS[activeUnitId]`**

In the pretest view's done-screen block, find the two references to `PRETEST` and update them:

```js
// OLD (two lines to find and change):
const allIds=PRETEST.map(s=>s.outcomeId);
// ...
const section=PRETEST.find(s=>s.outcomeId===id);

// NEW:
const activeUnitId=pretestQList[0]?.unitId||"u24";
const activePretestData=PRETESTS[activeUnitId]||[];
const allIds=activePretestData.map(s=>s.outcomeId);
// ...
const section=activePretestData.find(s=>s.outcomeId===id);
```

Also update the "Go to my rubric" button to navigate to the correct unit:
```js
// OLD:
<button onClick={()=>{setSelectedUnit(UNITS.find(u=>u.id==="u24"));setView("rubric");setPretestMode(null);}}

// NEW:
<button onClick={()=>{setSelectedUnit(UNITS.find(u=>u.id===activeUnitId));setView("rubric");setPretestMode(null);}}
```

- [ ] **Step 5: Verify no remaining references to old `PRETEST` constant**

```bash
grep -n "\bPRETEST\b" solo/index.html
```

Expected: only `PRETESTS` (with S) should appear. If bare `PRETEST` still appears, fix it.

- [ ] **Step 6: Commit Task 4**

```bash
git add solo/index.html
git commit -m "feat(solo): practice view, Grow/Know rubric buttons, multi-unit pretest results"
```

---

## Task 5: Smoke test

- [ ] **Step 1: Start the dev server**

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

- [ ] **Step 2: Student flow**
  - Open `http://localhost:8080/solo/`
  - Log in with class code → student code
  - Open Unit 24, open a Fractions rubric
  - Verify: "📚 Grow" appears on outcomes that have resources, "✏️ Know" appears on incomplete outcomes with practice data
  - Click "✏️ Know" → confirm worked example displays, then questions run with Check/Try again/Next flow
  - Click "📚 Grow" → confirm resource links expand below the outcome card
  - On a number line question: tap a token, tap the line — confirm it places (no drag required)

- [ ] **Step 3: Pre-test flow**
  - From home view, click "📋 Pre-test / Post-test" on Unit 24
  - Complete all questions → confirm results screen appears
  - Repeat for Unit 25 if available

- [ ] **Step 4: Teacher flow**
  - Log in as teacher → select a class → open a unit
  - Confirm the class grid still renders correctly
  - Confirm clicking a student name still opens their per-student rubric with attempt data

- [ ] **Step 5: Delete `solo-tracker-v2.jsx`** (no longer needed as source)

```bash
git rm solo-tracker-v2.jsx
git commit -m "chore: remove solo-tracker-v2.jsx source file after merge"
```
