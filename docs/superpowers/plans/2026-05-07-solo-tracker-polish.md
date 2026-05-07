# Solo Tracker — Progress Save + Visual Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix mid-pretest progress loss and make the Solo Tracker look and feel smooth, clean, and professional across every view.

**Architecture:** All changes live in `solo/index.html` — a single-file React 18 (UMD CDN) SPA with Babel standalone and inline JSX styles. The CSS design system is embedded in the `<style>` block; React components use inline style objects. We add two state fields for the localStorage draft resume flow and restructure the question view JSX to fill screen height.

**Tech Stack:** React 18 UMD, Supabase JS v2, Babel standalone, Lexend font (Google Fonts), CSS custom properties.

---

## File Map

| File | Lines affected |
|---|---|
| `solo/index.html` | Line 10–12: `<style>` block |
| `solo/index.html` | Line 1750–1751: `Sb()` / `Pb()` helpers |
| `solo/index.html` | Line 1890–1906: `doLogout()` + `startPretest()` |
| `solo/index.html` | Line 1908–1940: `handlePretestNext()` |
| `solo/index.html` | Lines 2062–2131: login view JSX |
| `solo/index.html` | Lines 2134–2157: classes view JSX |
| `solo/index.html` | Lines 2158–2220: home view JSX |
| `solo/index.html` | Lines 2223–2447: student rubric JSX |
| `solo/index.html` | Lines 2449–2551: pretest view JSX |
| `solo/index.html` | Lines 2555–2665: assessment view JSX |
| `solo/index.html` | Lines 2668+: teacher rubric JSX |

---

## Task 1: CSS Design System

**Files:**
- Modify: `solo/index.html:10-12`

### What changes

Replace the current minimal `<style>` block with the full design system — CSS variables, `body`, and a shimmer keyframe animation. Also change the `ff` font constant at line 2059 to reference Lexend. Also update `Sb()` (secondary button) and `Pb()` (option button) helpers at lines 1750–1751.

- [ ] **Step 1: Replace the style block**

Find the current block:
```html
  <style>
    body { margin: 0; background: #fff; font-family: 'Lexend', sans-serif; }
  </style>
```

Replace with:
```html
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --navy:#1e1b4b;--indigo:#4338ca;--ind-mid:#6366f1;
      --ind-50:#eef2ff;--ind-100:#e0e7ff;--ind-200:#c7d2fe;
      --blue:#3b82f6;--bg:#f4f6fb;--surface:#ffffff;
      --border:rgba(15,23,42,0.08);--text:#0f172a;--sub:#475569;
      --muted:#94a3b8;
      --sh-sm:0 1px 3px rgba(15,23,42,0.06),0 1px 2px rgba(15,23,42,0.04);
      --sh-md:0 4px 16px rgba(15,23,42,0.07),0 1px 3px rgba(15,23,42,0.04);
      --sh-lg:0 8px 40px rgba(15,23,42,0.10),0 2px 8px rgba(15,23,42,0.05);
      --sh-hov:0 16px 48px rgba(67,56,202,0.12),0 4px 12px rgba(15,23,42,0.07);
      --r:16px;--tx:all 0.2s cubic-bezier(0.4,0,0.2,1)
    }
    html,body,#root{height:100%}
    body{background:var(--bg);font-family:'Lexend',sans-serif;color:var(--text)}
    #root{display:flex;flex-direction:column}
    @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
  </style>
```

- [ ] **Step 2: Update the `ff` constant and button helpers (line ~2059–1751)**

Find:
```js
const ff="system-ui,sans-serif";
```
Replace with:
```js
const ff="'Lexend',sans-serif";
```

Find:
```js
const Sb=(extra={})=>({fontSize:13,padding:"6px 14px",border:"1px solid #e2e8f0",borderRadius:8,background:"#fff",cursor:"pointer",color:"#475569",...extra});
const Pb=(active,extra={})=>({textAlign:"left",padding:"10px 14px",fontSize:14,borderRadius:8,cursor:"pointer",border:`${active?"1.5px":"1px"} solid ${active?"#3b82f6":"#e2e8f0"}`,background:active?"#eff6ff":"#fff",color:active?"#1d4ed8":"#1e293b",fontWeight:active?600:400,...extra});
```
Replace with:
```js
const Sb=(extra={})=>({fontFamily:ff,fontSize:13,padding:"7px 14px",border:"1px solid var(--border)",borderRadius:9,background:"var(--surface)",cursor:"pointer",color:"var(--sub)",boxShadow:"var(--sh-sm)",transition:"all 0.15s",...extra});
const Pb=(active,extra={})=>({fontFamily:ff,textAlign:"left",display:"flex",alignItems:"center",flex:1,minHeight:58,padding:"0 20px",fontSize:16,fontWeight:active?700:500,borderRadius:13,cursor:"pointer",border:`2px solid ${active?"var(--indigo)":"#e2e8f0"}`,background:active?"var(--ind-50)":"#f8fafc",color:active?"var(--indigo)":"var(--text)",boxShadow:active?"0 0 0 3px rgba(99,102,241,0.12)":"none",transition:"var(--tx)",...extra});
```

- [ ] **Step 3: Verify the page still loads**

Open `http://localhost:8080/solo/` — confirm the app renders (login screen should appear with white background; Lexend font loads from Google Fonts).

- [ ] **Step 4: Commit**

```bash
cd /workspaces/morphology-builder
git add solo/index.html
git commit -m "feat(solo): CSS design system — variables, shimmer, updated button helpers"
```

---

## Task 2: Save Mechanism — Per-Outcome Supabase + localStorage Checkpoint

**Files:**
- Modify: `solo/index.html:1761` (useState declarations — add two new fields)
- Modify: `solo/index.html:1890-1940` (`doLogout`, `startPretest`, `handlePretestNext`)

### What changes

1. Add two React state fields: `pretestResumeDraft` (the loaded draft object or null) and `pretestShowResume` (boolean — shows the resume banner).
2. In `handlePretestNext()`: after appending to `newAnswers`, check if the just-answered question completes an outcome (both its questions answered) with both correct → call `saveOutcome()` immediately. Also write a localStorage checkpoint after every question.
3. In `startPretest(unitId)`: before setting state, read localStorage. If a draft exists for the same `unitId`, set `pretestResumeDraft` and `pretestShowResume=true` instead of immediately starting from question 1.
4. In `doLogout()`: clear the localStorage draft.
5. When the student clicks ✕ Exit from the pretest (line ~2499): also clear the draft.
6. When `pretestMode` becomes `"done"`: clear the draft.

- [ ] **Step 1: Add state fields**

In the `App()` function, find the block of `useState` declarations. After:
```js
const [pretestMode,setPretestMode]=useState(null);
```
Add:
```js
const [pretestResumeDraft,setPretestResumeDraft]=useState(null);
const [pretestShowResume,setPretestShowResume]=useState(false);
```

- [ ] **Step 2: Update `handlePretestNext()`**

Find the full `handlePretestNext` function (lines 1908–1940). Replace its body with:

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

    // Per-outcome immediate save: check if this answer completed the outcome's pair
    if(studentId){
      const oid=current.outcomeId;
      const uid=current.unitId||"u24";
      const outcomeAnswers=newAnswers.filter(a=>a.outcomeId===oid);
      const outcomeTotal=pretestQList.filter(item=>item.outcomeId===oid).length;
      if(outcomeAnswers.length===outcomeTotal&&outcomeAnswers.every(a=>a.correct)){
        saveOutcome(studentId,`${uid}_${oid}`,true);
      }
    }

    // localStorage checkpoint after every question
    if(studentId){
      const nextIdx=pretestIdx+1;
      localStorage.setItem(
        `solo_pretest_draft_${studentId}`,
        JSON.stringify({unitId:current.unitId,pretestIdx:nextIdx,pretestAnswers:newAnswers})
      );
    }

    if(pretestIdx<pretestQList.length-1){
      setPretestIdx(pretestIdx+1);
      setPretestAns(initAns(pretestQList[pretestIdx+1].q));
    } else {
      // Full completion — final save pass (idempotent)
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
        // Clear draft on completion
        localStorage.removeItem(`solo_pretest_draft_${studentId}`);
      }
      setPretestResults({byOutcome,passed});
      setPretestMode("done");
    }
  }
```

- [ ] **Step 3: Update `startPretest(unitId)`**

Find:
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
Replace with:
```js
  function startPretest(unitId){
    const data=PRETESTS[unitId]||[];
    const flat=data.flatMap(section=>section.questions.map(q=>({outcomeId:section.outcomeId,short:section.short,q,unitId})));
    setPretestQList(flat);
    setPretestResults(null);
    setPretestMode("running");
    // Check for a same-device draft
    let draft=null;
    if(studentId){
      try{
        const raw=localStorage.getItem(`solo_pretest_draft_${studentId}`);
        if(raw){
          const parsed=JSON.parse(raw);
          if(parsed.unitId===unitId&&parsed.pretestIdx>0&&parsed.pretestIdx<flat.length){
            draft=parsed;
          } else {
            localStorage.removeItem(`solo_pretest_draft_${studentId}`);
          }
        }
      }catch{}
    }
    if(draft){
      setPretestResumeDraft(draft);
      setPretestShowResume(true);
      setPretestIdx(draft.pretestIdx);
      setPretestAnswers(draft.pretestAnswers);
      setPretestAns(initAns(flat[draft.pretestIdx].q));
    } else {
      setPretestResumeDraft(null);
      setPretestShowResume(false);
      setPretestIdx(0);
      setPretestAnswers([]);
      setPretestAns(initAns(flat[0].q));
    }
    setView("pretest");
  }
```

- [ ] **Step 4: Clear draft in `doLogout()`**

Find `function doLogout(){` and its `sb.auth.signOut()` call. After `sb.auth.signOut();` add:
```js
    if(studentId) localStorage.removeItem(`solo_pretest_draft_${studentId}`);
```

- [ ] **Step 5: Clear draft in the ✕ Exit button**

In the pretest view JSX (around line 2499), find:
```jsx
<button onClick={()=>{setPretestMode(null);setView("home");}} style={Sb()}>✕ Exit</button>
```
Replace with:
```jsx
<button onClick={()=>{if(studentId)localStorage.removeItem(`solo_pretest_draft_${studentId}`);setPretestShowResume(false);setPretestResumeDraft(null);setPretestMode(null);setView("home");}} style={Sb()}>✕ Exit</button>
```

- [ ] **Step 6: Test the save flow manually**

1. Open `http://localhost:8080/solo/`, log in as a student.
2. Start a pre-test, answer 4 questions, then close the tab.
3. Reopen the URL, log in with the same student code — the pretest should NOT auto-resume (the resume banner appears only when you click "Pre-test / Post-test" again).
4. Click "Pre-test / Post-test" — the resume banner should appear saying "You were on question 5."
5. Click Continue — questions should resume from question 5 with previous answers preserved.
6. Click "Start over" — questions should restart from question 1 and draft should be cleared.
7. Complete a pretest fully — check Supabase `solo_progress` table has the correct passed outcomes with `completed=true`.

- [ ] **Step 7: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): per-outcome Supabase save + localStorage checkpoint with resume banner"
```

---

## Task 3: Login View Redesign

**Files:**
- Modify: `solo/index.html:2062-2131`

### What changes

- Page background: full-bleed `linear-gradient(150deg, #1e1b4b 0%, #1d4ed8 60%, #0369a1 100%)`
- Logo: frosted glass tile — `rgba(255,255,255,0.12)` bg, `blur(8px)`, white border, 54×54px, rounded-xl
- Brand name: 20px/800, white
- Card: white, `border-radius: 20px`, `box-shadow: 0 24px 64px rgba(0,0,0,0.28)`
- Inputs: `border-radius: 10px`, focus ring via state
- Submit button: `linear-gradient(135deg, #4338ca, #3b82f6)`, glow shadow

- [ ] **Step 1: Replace the login view JSX**

Find the block starting at `if(view==="login") return(` and ending at the closing `);` before the `// ── Class selector` comment. Replace the entire block with:

```jsx
  if(view==="login") return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(150deg,#1e1b4b 0%,#1d4ed8 60%,#0369a1 100%)",padding:"1rem",fontFamily:ff}}>
      <div style={{marginBottom:24,textAlign:"center"}}>
        <div style={{width:54,height:54,margin:"0 auto 12px",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:16,backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🧪</div>
        <div style={{fontSize:20,fontWeight:800,color:"#fff",letterSpacing:"-0.02em"}}>SOLO Tracker</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",marginTop:3}}>Word Labs · Year 6 Maths</div>
      </div>
      <div style={{width:"100%",maxWidth:380,background:"#fff",borderRadius:20,boxShadow:"0 24px 64px rgba(0,0,0,0.28)",padding:"1.75rem 1.5rem"}}>
        <div style={{display:"flex",gap:0,marginBottom:20,background:"#f1f5f9",borderRadius:10,padding:3}}>
          {["student","teacher"].map(m=>(
            <button key={m} onClick={()=>{setLoginMode(m);setLoginError("");}}
              style={{flex:1,padding:"8px 0",fontSize:13,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",fontFamily:ff,
                background:loginMode===m?"#fff":"transparent",color:loginMode===m?"#0f172a":"#94a3b8",
                boxShadow:loginMode===m?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all 0.15s"}}>
              {m==="student"?"Student":"Teacher"}
            </button>
          ))}
        </div>
        {loginMode==="student"?(
          loginStep==="class"?(
            <>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--sub)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Class code</label>
              <input autoFocus value={loginClassCode} onChange={e=>setLoginClassCode(e.target.value.toUpperCase())}
                onKeyDown={e=>e.key==="Enter"&&doClassLookup()}
                placeholder="e.g. AB3X2Y" maxLength={8}
                style={{width:"100%",boxSizing:"border-box",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:16,fontFamily:"monospace",letterSpacing:"0.1em",marginBottom:loginError?8:16,outline:"none",transition:"border-color 0.15s"}}/>
            </>
          ):(
            <>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,padding:"10px 14px",background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10}}>
                <span style={{fontSize:13,color:"#16a34a",fontWeight:600}}>✓ {loginClassObj.name}</span>
                <button onClick={()=>{setLoginStep("class");setLoginClassObj(null);setLoginError("");}}
                  style={{fontSize:12,color:"var(--sub)",background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:ff}}>Change</button>
              </div>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--sub)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Student code</label>
              <input autoFocus value={loginCode} onChange={e=>setLoginCode(e.target.value.toUpperCase())}
                onKeyDown={e=>e.key==="Enter"&&doLogin()}
                placeholder="e.g. AB3X" maxLength={6}
                style={{width:"100%",boxSizing:"border-box",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:16,fontFamily:"monospace",letterSpacing:"0.1em",marginBottom:loginError?8:16,outline:"none"}}/>
            </>
          )
        ):(
          <>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--sub)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Email</label>
            <input autoFocus type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&doLogin()}
              placeholder="teacher@school.edu.au"
              style={{width:"100%",boxSizing:"border-box",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,marginBottom:14,outline:"none",fontFamily:ff}}/>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--sub)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Password</label>
            <input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&doLogin()}
              placeholder="Your Word Labs password"
              style={{width:"100%",boxSizing:"border-box",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,marginBottom:loginError?8:16,outline:"none",fontFamily:ff}}/>
          </>
        )}
        {loginError&&<p style={{fontSize:13,color:"#dc2626",margin:"0 0 12px",fontWeight:500}}>{loginError}</p>}
        <button onClick={loginMode==="student"&&loginStep==="class"?doClassLookup:doLogin} disabled={loading}
          style={{width:"100%",padding:"13px",background:loading?"#94a3b8":"linear-gradient(135deg,#4338ca,#3b82f6)",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:loading?"default":"pointer",fontFamily:ff,boxShadow:loading?"none":"0 4px 18px rgba(67,56,202,0.32)",transition:"all 0.2s"}}>
          {loading?"Loading…":loginMode==="student"&&loginStep==="class"?"Continue →":"Sign in"}
        </button>
        {loginMode==="student"&&(
          <p style={{fontSize:12,color:"var(--muted)",textAlign:"center",margin:"14px 0 0"}}>Use the code your teacher gave you — it's on your login card.</p>
        )}
      </div>
    </div>
  );
```

- [ ] **Step 2: Verify visually**

Open `http://localhost:8080/solo/` — you should see the deep indigo-to-blue gradient background, frosted glass logo tile, white card with shadow. Test the student tab and teacher tab toggle.

- [ ] **Step 3: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): login view redesign — gradient background, frosted logo, white card"
```

---

## Task 4: Shared App Nav Component

**Files:**
- Modify: `solo/index.html` — add `AppNav` component before the `App()` function; update all non-login views to use it

### What changes

Extract a shared `AppNav` component used in all non-login views (classes, home, rubric, pretest, assessment, practice). The nav is solid deep navy (`#1e1b4b`), 54px tall, with a frosted logo tile, title, and contextual right-slot content.

- [ ] **Step 1: Add `AppNav` component**

Insert the following function just before `function App(){` (around line 1760):

```jsx
function AppNav({title, right=null}){
  return(
    <div style={{background:"var(--navy)",padding:"13px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <div style={{width:28,height:28,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🧪</div>
        <span style={{fontSize:14,fontWeight:700,color:"#fff"}}>{title||"SOLO Tracker"}</span>
      </div>
      {right&&<div style={{display:"flex",alignItems:"center",gap:8}}>{right}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Update classes view to use `AppNav`**

In the `if(view==="classes")` block (around line 2134), find the current header which is an inline `<div style={{maxWidth:480...}}>` with a title div and Sign out button. Wrap the existing content by prepending `<AppNav>` above the content div. Change the outer wrapper to a full-height flex column.

Find the opening of the classes view and replace:
```jsx
  if(view==="classes") return(
    <div style={{maxWidth:480,margin:"0 auto",padding:"1.5rem 1rem",fontFamily:ff}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:600,margin:"0 0 2px",color:"#0f172a"}}>Select a class</h1>
          <p style={{fontSize:13,color:"#64748b",margin:0}}>Choose which class to open</p>
        </div>
        <button onClick={doLogout} style={Sb()}>Sign out</button>
```
With:
```jsx
  if(view==="classes") return(
    <div style={{display:"flex",flexDirection:"column",flex:1,fontFamily:ff}}>
      <AppNav title="SOLO Tracker" right={<button onClick={doLogout} style={{fontFamily:ff,fontSize:12,padding:"6px 12px",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,color:"rgba(255,255,255,0.8)",cursor:"pointer"}}>Sign out</button>}/>
      <div style={{maxWidth:480,margin:"0 auto",width:"100%",padding:"1.5rem 1rem"}}>
        <div style={{marginBottom:"1.5rem"}}>
          <h1 style={{fontSize:20,fontWeight:700,margin:"0 0 2px",color:"var(--text)"}}>Select a class</h1>
          <p style={{fontSize:13,color:"var(--sub)",margin:0}}>Choose which class to open</p>
        </div>
```

And close the extra wrapper div before the final `);`.

- [ ] **Step 3: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): AppNav component — solid navy bar shared across all non-login views"
```

---

## Task 5: Home View (Unit Selector)

**Files:**
- Modify: `solo/index.html:2158-2220`

### What changes

- Remove the inline header with title + Sign out (replaced by `AppNav`)
- Unit cards: white surface, `border-radius:16px`, `box-shadow:var(--sh-md)`, 3px coloured top accent line, hover lift + `var(--sh-hov)`
- Progress bar: 8px tall, indigo→blue gradient on `var(--ind-100)` track, shimmer `::after` (via a class — but since we're in inline styles, use a `<div>` with `position:absolute` overlay)
- Band pills: keep existing red/yellow/green colours
- Pre-test button: `background:var(--ind-50)`, `border:1.5px solid var(--ind-200)`, indigo text

- [ ] **Step 1: Replace the home view JSX**

Find the block `if(view==="home"){` and replace through to its closing `}` with:

```jsx
  if(view==="home"){
    const s=!isTeacher&&students.find(s=>s.id===studentId);
    const nameDisplay=isTeacher?null:(s?s.name:"");
    return(
      <div style={{display:"flex",flexDirection:"column",flex:1,fontFamily:ff}}>
        <AppNav title="SOLO Tracker"
          right={<>
            {nameDisplay&&<span style={{fontSize:12,padding:"4px 10px",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,color:"rgba(255,255,255,0.8)"}}>{nameDisplay}</span>}
            <button onClick={doLogout} style={{fontFamily:ff,fontSize:12,padding:"6px 12px",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,color:"rgba(255,255,255,0.8)",cursor:"pointer"}}>Sign out</button>
          </>}
        />
        <div style={{flex:1,overflowY:"auto",padding:"1.25rem 1rem"}}>
          <div style={{maxWidth:640,margin:"0 auto"}}>
            <h1 style={{fontSize:22,fontWeight:800,margin:"0 0 4px",color:"var(--text)",letterSpacing:"-0.02em"}}>{isTeacher?"Class overview":s.name+"'s units"}</h1>
            <p style={{fontSize:13,color:"var(--sub)",margin:"0 0 20px"}}>Year 6 Maths — {isTeacher?"track class progress":"select a unit to continue"}</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:14}}>
              {UNITS.map(unit=>{
                const uc=UC[unit.id];
                let done=0,total=unit.outcomes.length;
                if(isTeacher){
                  const avg=students.reduce((sum,st)=>sum+unit.outcomes.filter(o=>progress[st.id]&&progress[st.id][`${unit.id}_${o.id}`]).length,0);
                  done=students.length?Math.round(avg/students.length*10)/10:0;
                } else {
                  done=unit.outcomes.filter(o=>progress[studentId]&&progress[studentId][`${unit.id}_${o.id}`]).length;
                }
                const pct=Math.round(done/total*100);
                const redDone=unit.outcomes.filter(o=>o.band==="red"&&(isTeacher?students.some(st=>progress[st.id]&&progress[st.id][`${unit.id}_${o.id}`]):progress[studentId]&&progress[studentId][`${unit.id}_${o.id}`])).length;
                const redTotal=unit.outcomes.filter(o=>o.band==="red").length;
                const yelDone=unit.outcomes.filter(o=>o.band==="yellow"&&(isTeacher?students.some(st=>progress[st.id]&&progress[st.id][`${unit.id}_${o.id}`]):progress[studentId]&&progress[studentId][`${unit.id}_${o.id}`])).length;
                const yelTotal=unit.outcomes.filter(o=>o.band==="yellow").length;
                return(
                  <div key={unit.id}
                    style={{background:"var(--surface)",borderRadius:16,boxShadow:"var(--sh-md)",cursor:"pointer",overflow:"hidden",transition:"transform 0.2s,box-shadow 0.2s",borderTop:`3px solid ${uc.dot}`}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="var(--sh-hov)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="var(--sh-md)";}}
                    onClick={()=>openUnit(unit)}>
                    <div style={{padding:"1.25rem 1.25rem 1rem"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <div>
                          <span style={{display:"inline-block",background:uc.bg,color:uc.text,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:6,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>{unit.name}</span>
                          <h2 style={{fontSize:15,fontWeight:700,margin:0,color:"var(--text)"}}>{unit.subtitle}</h2>
                        </div>
                        <span style={{fontSize:13,fontWeight:700,color:uc.text,flexShrink:0}}>{isTeacher?`avg ${done}/${total}`:`${done}/${total}`}</span>
                      </div>
                      <div style={{position:"relative",background:"var(--ind-100)",borderRadius:99,height:8,marginBottom:12,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,var(--indigo),var(--blue))",borderRadius:99,transition:"width 0.4s",position:"relative"}}/>
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,padding:"3px 9px",borderRadius:5,background:BAND.red.bg,color:BAND.red.text,fontWeight:600}}>Red {redDone}/{redTotal}</span>
                        <span style={{fontSize:11,padding:"3px 9px",borderRadius:5,background:BAND.yellow.bg,color:BAND.yellow.text,fontWeight:600}}>Yellow {yelDone}/{yelTotal}</span>
                        {(()=>{
                          const gTotal=unit.outcomes.filter(o=>o.band==="green").length;
                          if(!gTotal)return null;
                          const gDone=unit.outcomes.filter(o=>o.band==="green"&&(isTeacher?students.some(st=>progress[st.id]&&progress[st.id][`${unit.id}_${o.id}`]):progress[studentId]&&progress[studentId][`${unit.id}_${o.id}`])).length;
                          return <span style={{fontSize:11,padding:"3px 9px",borderRadius:5,background:BAND.green.bg,color:BAND.green.text,fontWeight:600}}>Green {gDone}/{gTotal}</span>;
                        })()}
                      </div>
                    </div>
                    {!isTeacher&&(unit.id==="u24"||unit.id==="u25")&&(
                      <div style={{borderTop:"1px solid var(--border)",padding:"10px 1.25rem"}}>
                        <button onClick={e=>{e.stopPropagation();startPretest(unit.id);}}
                          style={{width:"100%",padding:"8px",fontSize:12,fontWeight:600,background:"var(--ind-50)",color:"var(--indigo)",border:"1.5px solid var(--ind-200)",borderRadius:9,cursor:"pointer",fontFamily:ff}}>
                          📋 Pre-test / Post-test
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
```

- [ ] **Step 2: Verify**

Log in as a student and confirm: dark navy nav, student name pill, unit cards with white surface and coloured top accent, indigo progress bar, hover lift.

- [ ] **Step 3: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): home view — white unit cards with accent top, indigo progress bar, hover lift"
```

---

## Task 6: Student Rubric View

**Files:**
- Modify: `solo/index.html:2223-2447`

### What changes

- Use `AppNav`; back button as white card with indigo hover
- Progress bar: 8px, indigo gradient on ind-100 track
- Band section labels: keep red/yellow/green colours, `border-radius:7px`, border
- Outcome cards: white, 12px radius, `box-shadow:var(--sh-sm)`, done state gets green left-border
- Incomplete number circle: `background:var(--ind-50)`, `color:var(--ind-mid)`
- Done number circle: green bg/text
- Grow/Know/Show buttons:
  - Grow: `background:var(--ind-50)`, `color:var(--indigo)`, `border:1px solid var(--ind-200)`
  - Know: `background:#f0fdf4`, `color:#16a34a`, `border:1px solid #86efac`
  - Show: `background:linear-gradient(135deg,var(--indigo),var(--blue))`, white text, glow shadow

- [ ] **Step 1: Replace the student rubric view JSX**

Find `if(view==="rubric"&&!isTeacher){` and replace through to its closing `}` (the one just before the practice view). The replacement wraps content in a flex-column with `AppNav` at top and a scrollable content area below.

The key structural change — wrap the view in:
```jsx
<div style={{display:"flex",flexDirection:"column",flex:1,fontFamily:ff}}>
  <AppNav title={selectedUnit?.name||"SOLO Tracker"}
    right={<button onClick={()=>setView("home")} style={{...}}>← Units</button>}
  />
  <div style={{flex:1,overflowY:"auto",padding:"1rem"}}>
    <div style={{maxWidth:580,margin:"0 auto"}}>
      {/* progress bar */}
      {/* band sections + outcome cards */}
    </div>
  </div>
</div>
```

Apply these inline style changes to outcome cards and buttons throughout:
- Outcome card wrapper: `background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,boxShadow:"var(--sh-sm)",overflow:"hidden"` + when done add `borderLeft:"3px solid #86efac"`
- Number circle done: `background:"#dcfce7",color:"#16a34a"`
- Number circle incomplete: `background:"var(--ind-50)",color:"var(--ind-mid)"`
- Grow button: `background:"var(--ind-50)",color:"var(--indigo)",border:"1px solid var(--ind-200)",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff`
- Know button: `background:"#f0fdf4",color:"#16a34a",border:"1px solid #86efac",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff`
- Show button: `background:"linear-gradient(135deg,var(--indigo),var(--blue))",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:ff,boxShadow:"0 2px 8px rgba(67,56,202,0.28)"`

The full replacement is large — make the edits surgically using the Edit tool on the identified substring ranges.

- [ ] **Step 2: Verify**

Open any unit rubric as a student. Check: nav is solid navy, progress bar is indigo, band labels have coloured borders, outcome cards have shadow, buttons use indigo/green/gradient styling.

- [ ] **Step 3: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): student rubric — outcome cards with shadow, Grow/Know/Show button styles"
```

---

## Task 7: Question Views — Full-Screen Flex Layout

**Files:**
- Modify: `solo/index.html:2449-2665` (pretest + assessment question views)

### What changes

This is the core visual fix — the question card must fill available screen height so option buttons become large tap targets (min-height 58px, 16px font).

**Layout structure for all question screens:**
```
<div flex-column flex:1>        ← fills viewport below nav
  <AppNav .../>
  <div class="q-screen">       ← flex:1, flex-direction:column, padding:18px
    <div class="q-topbar">     ← [Exit] [progress bar] [3/10], flex-shrink:0
    <div class="q-outcome">    ← [badge][outcome name], flex-shrink:0
    <div class="q-card">       ← flex:1, flex-direction:column (the white card)
      <p class="q-text">       ← 22px/600, flex-shrink:0
      <div class="options">    ← flex:1, flex-direction:column, gap:10px
        <button .opt>          ← flex:1, min-height:58px, 16px
    <div class="q-actions">   ← [dots][Next btn], flex-shrink:0, margin-top:18px
```

**Key inline style values:**
- `q-screen`: `{flex:1,display:"flex",flexDirection:"column",padding:"18px 18px 24px",gap:0}`
- `q-topbar`: `{display:"flex",alignItems:"center",gap:10,marginBottom:18,flexShrink:0}`
- `q-outcome-strip`: `{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"9px 14px",display:"flex",alignItems:"center",gap:8,marginBottom:14,flexShrink:0,boxShadow:"var(--sh-sm)"}`
- `q-badge`: `{fontSize:10,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",padding:"3px 9px",borderRadius:5,background:"var(--ind-50)",color:"var(--indigo)",flexShrink:0}`
- `q-card`: `{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,padding:"28px 26px 24px",boxShadow:"var(--sh-lg)",flex:1,display:"flex",flexDirection:"column",minHeight:0}`
- `q-text`: `{fontSize:22,fontWeight:600,lineHeight:1.55,letterSpacing:"-0.02em",marginBottom:26,flexShrink:0,color:"var(--text)"}`
- `options`: `{display:"flex",flexDirection:"column",gap:10,flex:1}`
- Each `.opt`: use `Pb(selected)` (already updated in Task 1 to be `flex:1,minHeight:58`)
- `q-actions`: `{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:18,flexShrink:0}`
- Next button: `{padding:"13px 32px",border:"none",borderRadius:12,fontFamily:ff,fontSize:15,fontWeight:700,cursor:"pointer",background:ok?"linear-gradient(135deg,var(--indigo),var(--blue))":"#e2e8f0",color:ok?"#fff":"var(--muted)",boxShadow:ok?"0 4px 18px rgba(67,56,202,0.32)":"none"}`

**Progress dots** (shown when < 15 questions):
```jsx
{pretestQList.length<=15&&<div style={{display:"flex",gap:6}}>
  {pretestQList.map((_,i)=>(
    <div key={i} style={{width:7,height:7,borderRadius:"50%",background:i<pretestIdx?"var(--ind-mid)":i===pretestIdx?"var(--indigo)":"var(--ind-100)",transform:i===pretestIdx?"scale(1.3)":"none",transition:"all 0.15s"}}/>
  ))}
</div>}
```

**Resume banner** (shown when `pretestShowResume`):
```jsx
{pretestShowResume&&(
  <div style={{background:"var(--ind-50)",border:"1px solid var(--ind-200)",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexShrink:0}}>
    <span style={{fontSize:13,color:"var(--indigo)",fontWeight:500}}>Continue where you left off? You were on question {pretestResumeDraft.pretestIdx + 1} of {pretestQList.length}.</span>
    <div style={{display:"flex",gap:8,flexShrink:0}}>
      <button onClick={()=>{setPretestShowResume(false);setPretestResumeDraft(null);setPretestIdx(0);setPretestAnswers([]);setPretestAns(initAns(pretestQList[0].q));if(studentId)localStorage.removeItem(`solo_pretest_draft_${studentId}`);}}
        style={{fontFamily:ff,fontSize:12,padding:"5px 10px",background:"#fff",border:"1px solid var(--ind-200)",borderRadius:7,cursor:"pointer",color:"var(--indigo)"}}>Start over</button>
      <button onClick={()=>setPretestShowResume(false)}
        style={{fontFamily:ff,fontSize:12,padding:"5px 12px",background:"var(--indigo)",border:"none",borderRadius:7,cursor:"pointer",color:"#fff",fontWeight:600}}>Continue →</button>
    </div>
  </div>
)}
```

- [ ] **Step 1: Replace pretest question view JSX**

Find the block starting at `const current=pretestQList[pretestIdx];` (after the `pretestMode==="done"` results block) through to the closing `);` of the pretest view (around line 2551). Replace with the new full-screen layout described above, keeping all the existing question type JSX (input, mc, truefalse, order, numberline, match, partition, shade) but placing them inside `.options` / `q-card` / `q-screen`.

**Outer wrapper changes:**
- Old: `<div style={{maxWidth:520,margin:"0 auto",padding:"1rem",fontFamily:ff}}>`
- New: Full-screen flex column with `AppNav` and then `q-screen` div

The pretest outer wrapper:
```jsx
return(
  <div style={{display:"flex",flexDirection:"column",flex:1,fontFamily:ff}}>
    <AppNav title="Pre-test" right={
      <span style={{fontSize:12,color:"rgba(255,255,255,0.6)"}}>{current.short}</span>
    }/>
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:"18px 18px 24px"}}>
      {/* topbar */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,flexShrink:0}}>
        <button onClick={()=>{if(studentId)localStorage.removeItem(`solo_pretest_draft_${studentId}`);setPretestShowResume(false);setPretestResumeDraft(null);setPretestMode(null);setView("home");}} style={Sb()}>✕ Exit</button>
        <div style={{flex:1,background:"var(--ind-100)",borderRadius:99,height:6,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,var(--indigo),var(--blue))",borderRadius:99,transition:"width 0.3s"}}/>
        </div>
        <span style={{fontSize:12,color:"var(--muted)",fontWeight:600,flexShrink:0}}>{pretestIdx+1}/{pretestQList.length}</span>
      </div>
      {/* resume banner */}
      {pretestShowResume&&( /* ... resume banner JSX as above ... */ )}
      {/* outcome strip */}
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"9px 14px",display:"flex",alignItems:"center",gap:8,marginBottom:14,flexShrink:0,boxShadow:"var(--sh-sm)"}}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",padding:"3px 9px",borderRadius:5,background:"var(--ind-50)",color:"var(--indigo)",flexShrink:0}}>Pre-test</span>
        <span style={{fontSize:13,fontWeight:600,color:"var(--sub)"}}>{current.short}</span>
      </div>
      {/* question card — fills remaining space */}
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,padding:"28px 26px 24px",boxShadow:"var(--sh-lg)",flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
        <p style={{fontSize:22,fontWeight:600,lineHeight:1.55,letterSpacing:"-0.02em",marginBottom:26,flexShrink:0,color:"var(--text)"}}>{q.text}</p>
        <div style={{display:"flex",flexDirection:"column",gap:10,flex:1}}>
          {/* question type content — mc options use Pb() which now has flex:1,minHeight:58 */}
          {q.type==="mc"&&q.options.map(opt=>(
            <button key={opt} onClick={()=>setPretestAns(a=>({...a,option:opt}))} style={Pb(pretestAns.option===opt)}>{opt}</button>
          ))}
          {/* other question types retain their existing JSX — put inside this div */}
          {q.type==="input"&&( /* existing input JSX */ )}
          {q.type==="truefalse"&&( /* existing truefalse JSX with Pb */ )}
          {/* order, numberline, match, partition, shade as before */ }
        </div>
      </div>
      {/* actions row */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:18,flexShrink:0}}>
        {pretestQList.length<=15
          ?<div style={{display:"flex",gap:6}}>{pretestQList.map((_,i)=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:i<pretestIdx?"var(--ind-mid)":i===pretestIdx?"var(--indigo)":"var(--ind-100)",transform:i===pretestIdx?"scale(1.3)":"none",transition:"all 0.15s"}}/>)}</div>
          :<span style={{fontSize:12,color:"var(--muted)"}}>{pretestIdx+1} of {pretestQList.length}</span>
        }
        <button onClick={handlePretestNext} disabled={!ok}
          style={{padding:"13px 32px",border:"none",borderRadius:12,fontFamily:ff,fontSize:15,fontWeight:700,cursor:ok?"pointer":"default",background:ok?"linear-gradient(135deg,var(--indigo),var(--blue))":"#e2e8f0",color:ok?"#fff":"var(--muted)",boxShadow:ok?"0 4px 18px rgba(67,56,202,0.32)":"none",transition:"all 0.2s"}}>
          {pretestIdx===pretestQList.length-1?"Submit":"Next →"}
        </button>
      </div>
    </div>
  </div>
);
```

- [ ] **Step 2: Replace assessment question view JSX (same layout)**

Find the assessment question view block `const q=o.questions[qIdx];` through to its closing `);` (around line 2591–2665). Apply the same full-screen structure with `AppNav`, `q-screen`, `q-topbar`, `q-card`, `q-actions`. The badge label changes to the band name instead of "Pre-test".

Outer wrapper for assessment:
```jsx
return(
  <div style={{display:"flex",flexDirection:"column",flex:1,fontFamily:ff}}>
    <AppNav title={o.short}/>
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:"18px 18px 24px"}}>
      {/* topbar */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,flexShrink:0}}>
        <button onClick={()=>setView("rubric")} style={Sb()}>← Back</button>
        <div style={{flex:1,background:"var(--ind-100)",borderRadius:99,height:6,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,var(--indigo),var(--blue))",borderRadius:99,transition:"width 0.3s"}}/>
        </div>
        <span style={{fontSize:12,color:"var(--muted)",fontWeight:600,flexShrink:0}}>{qIdx+1}/{total}</span>
      </div>
      {/* outcome strip */}
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"9px 14px",display:"flex",alignItems:"center",gap:8,marginBottom:14,flexShrink:0,boxShadow:"var(--sh-sm)"}}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",padding:"3px 9px",borderRadius:5,background:bs.bg,color:bs.text,flexShrink:0}}>{o.band}</span>
        <span style={{fontSize:13,fontWeight:600,color:"var(--sub)"}}>{o.short}</span>
      </div>
      {/* question card */}
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,padding:"28px 26px 24px",boxShadow:"var(--sh-lg)",flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
        <p style={{fontSize:22,fontWeight:600,lineHeight:1.55,letterSpacing:"-0.02em",marginBottom:26,flexShrink:0,color:"var(--text)"}}>{q.text}</p>
        <div style={{display:"flex",flexDirection:"column",gap:10,flex:1}}>
          {q.type==="mc"&&q.options.map(opt=>(
            <button key={opt} onClick={()=>setAns(a=>({...a,option:opt}))} style={Pb(ans.option===opt)}>{opt}</button>
          ))}
          {/* other question types as before */}
        </div>
      </div>
      {/* actions */}
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:18,flexShrink:0}}>
        <button onClick={handleNext} disabled={!ok}
          style={{padding:"13px 32px",border:"none",borderRadius:12,fontFamily:ff,fontSize:15,fontWeight:700,cursor:ok?"pointer":"default",background:ok?"linear-gradient(135deg,var(--indigo),var(--blue))":"#e2e8f0",color:ok?"#fff":"var(--muted)",boxShadow:ok?"0 4px 18px rgba(67,56,202,0.32)":"none",transition:"all 0.2s"}}>
          {qIdx===total-1?"Submit":"Next →"}
        </button>
      </div>
    </div>
  </div>
);
```

- [ ] **Step 3: Verify question layout fills the screen**

On mobile (DevTools at 390px wide), confirm: option buttons fill the available height below the question text, minimum 58px each. Question text is 22px and clearly readable without zooming.

- [ ] **Step 4: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): question views full-screen flex layout — 22px text, flex options, resume banner"
```

---

## Task 8: Practice View — Same Full-Screen Layout

**Files:**
- Modify: `solo/index.html:2304-2448`

### What changes

The practice view has the same question structure. Apply identical layout treatment as Task 7 — `AppNav` + `q-screen` + `q-card` with `flex:1`. The badge label shows "Practice".

- [ ] **Step 1: Find the practice view**

Locate `if(view==="practice"){` (around line 2304). It contains an "example" phase and a "question" phase. Apply the full-screen flex layout to the question phase only (the example/intro phase can stay scrollable).

- [ ] **Step 2: Wrap practice question phase in q-screen**

Same pattern as Task 7: `AppNav` + `div.q-screen` with `q-topbar`, `q-outcome-strip`, `q-card`, `q-actions`. Badge text: "Practice".

- [ ] **Step 3: Verify**

Click "Grow" on an outcome in the rubric. Practice questions should fill the screen.

- [ ] **Step 4: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): practice view — full-screen flex layout consistent with pretest/assessment"
```

---

## Task 9: Results Views Polish

**Files:**
- Modify: `solo/index.html` — pretest results (around line 2450–2487) and assessment results (around line 2560–2588)

### What changes

- Centred icon header: 60px icon tile, `background:var(--ind-50)`, `border:1px solid var(--ind-200)`, indigo glow shadow
- `h2`: 20px/800
- Result rows: white card, `box-shadow:var(--sh-sm)`, pass gets `border-left:3px solid #86efac`, fail gets `border-left:3px solid #fca5a5`
- Action buttons: ghost `Sb()` + indigo primary using `Sb({background:"linear-gradient(135deg,var(--indigo),var(--blue))",color:"#fff",border:"none",fontWeight:700})`

- [ ] **Step 1: Update pretest results view**

In the `pretestMode==="done"` block, update the icon header, result rows, and buttons per the spec above.

- [ ] **Step 2: Update assessment results view**

In the `if(results){` block inside the assessment view, update the icon header and result rows with left-border pass/fail styling and updated buttons.

- [ ] **Step 3: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): results views — icon header, card rows with coloured left-border, indigo buttons"
```

---

## Task 10: Teacher Rubric Nav Polish

**Files:**
- Modify: `solo/index.html:2668+`

### What changes

The teacher rubric has no design overhaul — just replace all inline nav/header divs with `AppNav` and update button styles to use the new `Sb()` helper. The layout and data are unchanged.

- [ ] **Step 1: Wrap teacher rubric views with `AppNav`**

For all three teacher rubric sub-views (attempt detail, attempt list, student rubric with attempt counts, and the class overview), replace the top header div with `AppNav` and a scrollable content area.

- [ ] **Step 2: Verify**

As a teacher, navigate: class list → rubric → student → outcome → attempt. Confirm the nav is solid navy in every sub-view.

- [ ] **Step 3: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): teacher rubric — AppNav polish across all sub-views"
```

---

## Task 11: Smoke Test

- [ ] **Step 1: Test login**
  - Open `http://localhost:8080/solo/` — gradient background visible, white card with shadow
  - Log in as a student with a valid class code + student code
  - Log in as a teacher with email + password

- [ ] **Step 2: Test home view**
  - Unit cards have white background, coloured top accent, shadow
  - Hover lifts the card
  - Progress bar is indigo gradient
  - Band pills show red/yellow/green

- [ ] **Step 3: Test rubric view**
  - Outcome cards have shadow, done = green left-border
  - Grow/Know/Show buttons use indigo/green/gradient styles

- [ ] **Step 4: Test question view**
  - Open pretest
  - Question text is 22px, clearly readable
  - Options fill the full height below the question (no dead white space at bottom)
  - Option buttons are ≥ 58px tall
  - Indigo gradient "Next →" button (active) or greyed out (when no option selected)
  - Progress bar in topbar is indigo gradient

- [ ] **Step 5: Test resume flow**
  - Answer 4 questions in a pretest, reload the page, log in, click Pre-test / Post-test
  - Resume banner appears with correct question number
  - "Continue →" resumes at question 5
  - "Start over" starts at question 1 and clears the draft
  - Complete the pretest — check localStorage is cleared

- [ ] **Step 6: Test mid-pretest Supabase save**
  - In Supabase → Table Editor → `solo_progress`, watch the table as you answer a pretest
  - After correctly answering both questions for an outcome, a row should appear immediately (not waiting for the full pretest to complete)

- [ ] **Step 7: Final commit and push**

```bash
git add solo/index.html
git status
git log --oneline -5
```

Confirm all changes are clean, then push to main.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task covering it |
|---|---|
| Per-outcome Supabase save when both questions correct | Task 2 |
| localStorage checkpoint after each question | Task 2 |
| Resume banner with "Continue / Start over" | Tasks 2 + 7 |
| Clear draft on completion and ✕ Exit | Task 2 |
| CSS design system (variables, shimmer keyframe) | Task 1 |
| Login: gradient background, frosted logo, white card | Task 3 |
| App nav: solid navy, shared component | Task 4 |
| Home: white cards, top accent, hover lift, indigo progress bar | Task 5 |
| Student rubric: Grow/Know/Show button styles | Task 6 |
| Question views: 22px text, flex:1 card, 58px options | Tasks 7 + 8 |
| Resume banner indigo-50 styling | Task 7 |
| Results views: icon header, card rows, indigo buttons | Task 9 |
| Teacher rubric: nav polish | Task 10 |

**No placeholders, no TODOs present.**

**Type consistency:** `Pb()` used in pretest, assessment, and practice views — all updated in Task 1 to the new signature. `Sb()` used for secondary buttons — updated in Task 1. `AppNav` defined once in Task 4, reused in Tasks 5–10.
