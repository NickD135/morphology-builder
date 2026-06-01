# Grow Guided Lesson — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Grow section into a full-screen, coach-led guided lesson (Hook → Learn → Try-in-book → Reflect) with self-checked bookwork, seeded on u26_r5; and remove the bookwork gate from Know.

**Architecture:** All changes are in the single file `solo/index.html` (React via in-browser Babel, vanilla — no build, no test framework). A new `view==="learn"` full-screen screen pages through four stages driven by new top-level state. Lesson content lives as data in the existing `LEARN` object. The worked-example step-reveal and the reflection note are extracted into small reusable components (`WorkedExample`, `NoteField`) shared by the existing `LearnCard` and the new lesson. The `Coach` component is reused throughout.

**Tech Stack:** HTML + React 18 (UMD) + Babel standalone, inline styles, CSS keyframes in the head `<style>`. Verification: Node (`node -e`) for data shape; a local `python3 -m http.server` + Playwright MCP for compile/visual checks.

**Spec:** `docs/superpowers/specs/2026-06-01-solo-grow-guided-lesson-design.md`

---

## Verification conventions (used by every task)

- **Parse check (data):**
  ```bash
  cd /workspaces/morphology-builder
  node -e "const fs=require('fs');const h=fs.readFileSync('solo/index.html','utf8');const m=h.match(/var LEARN = \{[\s\S]*?\n\};\s*\n/);eval(m[0]);/* asserts here */"
  ```
- **Compile check (UI):** start server once, then Playwright navigate and read console errors.
  ```bash
  cd /workspaces/morphology-builder
  nohup python3 -m http.server 8099 --bind 127.0.0.1 >/tmp/solo.log 2>&1 &
  sleep 1.5; curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8099/solo/index.html   # expect 200
  ```
  Then via Playwright MCP: `browser_navigate http://127.0.0.1:8099/solo/index.html` → expect **0 errors** (a favicon 404 is fine).
- **Render check (a component/view in isolation):** Playwright `browser_evaluate` that mounts the component/forces state into a fixed overlay div, then `browser_take_screenshot`, then Read the PNG. Remove the overlay and any PNG/`.playwright-mcp` artifacts afterward.
- **Commit** at the end of each task. Do **not** push until Task 8.

---

## Task 1: Extend the LEARN schema for u26_r5

**Files:** Modify `solo/index.html` (the `var LEARN = {` block, entry `u26_r5`).

- [ ] **Step 1: Replace the `u26_r5` entry** with the extended lesson content (keep `watch` and `workedExample`; add `journey`, `hook`, `tryIt`, `reflect`; drop the old top-level `intro`/`note` — `note` moves under `reflect`).

```js
  u26_r5:{
    journey:"Decimals",
    hook:{
      question:"Two price tags in a shop: one says $5.5 and the other says $5.50. Is one a better deal, or are they exactly the same? Write your gut answer in your book.",
      revealLabel:"Show what's really going on",
      reveal:"They're exactly the same amount of money! The 0 on the end of $5.50 doesn't add anything — it's just there to make the price look tidy. By the end of this lesson you'll know exactly why.",
    },
    watch:{
      count:1,
      prompts:[
        "Write the rule in your own words: what happens to a decimal's value when you add a zero on the end (e.g. 0.5 → 0.50)?",
        "Write three decimals that are all equal, like 0.4 = 0.40 = 0.400.",
        "Write 4.30 and 4.3 — explain in one sentence why they are the same.",
      ],
    },
    workedExample:{
      problem:"Are 0.6, 0.60 and 0.600 the same value?",
      steps:[
        "Look at the first decimal place (tenths): all three have 6 tenths.",
        "0.60 adds a hundredths digit of 0, and 0.600 adds a thousandths digit of 0 — those zeros add nothing.",
        "Zeros on the END of a decimal are just placeholders, so they don't change the value.",
        "So 0.6 = 0.60 = 0.600. (But 0.06 is different — that zero is NOT on the end, so it changes the value.)",
      ],
    },
    tryIt:[
      {question:"Write 6.3400 without any unnecessary trailing zeros.",answer:"6.34",explain:"Drop only the zeros on the very end — the 3 and the 4 must stay."},
      {question:"True or false: 0.30 is bigger than 0.3?",answer:"False — they're equal.",explain:"The extra 0 is just a placeholder; it doesn't change the value."},
      {question:"A ribbon is labelled 1.40 m. Write that length more simply.",answer:"1.4 m",explain:"The end zero adds nothing, so 1.40 m = 1.4 m."},
    ],
    reflect:{
      prompt:"In your book, finish this sentence in your own words: \"A zero on the end of a decimal doesn't change its value because…\"",
      note:"what did you learn about trailing zeros?",
    },
  },
```

- [ ] **Step 2: Parse check.**

```bash
cd /workspaces/morphology-builder
node -e "const fs=require('fs');const h=fs.readFileSync('solo/index.html','utf8');const m=h.match(/var LEARN = \{[\s\S]*?\n\};\s*\n/);eval(m[0]);const r=LEARN.u26_r5;console.log('hook',!!r.hook,'tryIt',r.tryIt.length,'reflect',!!r.reflect,'journey',r.journey);if(!(r.hook&&r.tryIt.length===3&&r.reflect&&r.reflect.note))throw new Error('schema incomplete');console.log('OK');"
```
Expected: `hook true tryIt 3 reflect true journey Decimals` then `OK`.

- [ ] **Step 3: Commit.**

```bash
git add solo/index.html && git commit -m "feat(solo): extend LEARN schema with hook/tryIt/reflect for u26_r5"
```

> Note: `u26_r8` keeps its old-shape LEARN entry (no `hook`) and continues to render via the inline `LearnCard` — that path is unchanged. Only outcomes whose `LEARN[key].hook` exists launch the new lesson (wired in Task 6).

---

## Task 2: Extract `WorkedExample` component from `LearnCard`

**Why:** the lesson's Learn stage and the existing `LearnCard` both need the step-reveal worked example. Extract it so there's one implementation.

**Files:** Modify `solo/index.html` — add a component just above `function LearnCard(`, and replace the worked-example block inside `LearnCard`.

- [ ] **Step 1: Add the `WorkedExample` component** immediately before `function LearnCard({learn,outcomeKey,studentId}){`.

```js
function WorkedExample({we,title="📝 Worked example — follow along in your book"}){
  const ff2="'Lexend',sans-serif";
  const [revealed,setRevealed]=useState(0);
  const done=revealed>=we.steps.length;
  return(
    <div className={"lc-card"+(done?" lc-done":"")} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:8,marginBottom:8}}>
        <p style={{fontSize:12,fontWeight:700,color:"var(--indigo)",margin:0}}>{title}</p>
        {revealed>0&&<span style={{fontSize:11,color:"var(--muted)",fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>Step {Math.min(revealed,we.steps.length)} of {we.steps.length}</span>}
      </div>
      <p style={{fontSize:13,fontWeight:600,color:"var(--text)",margin:"0 0 10px"}}>{we.problem}</p>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {we.steps.slice(0,revealed).map((s,i)=>(
          <div key={i} className="lc-step" style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <span className="lc-badge" style={{flexShrink:0,width:18,height:18,borderRadius:"50%",background:"var(--ind-50)",color:"var(--indigo)",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>{i+1}</span>
            <span style={{fontSize:12,color:"var(--text)",lineHeight:1.5}}>{s}</span>
          </div>
        ))}
      </div>
      {!done
        ?<button onClick={()=>setRevealed(r=>r+1)} style={{marginTop:revealed>0?10:0,fontFamily:ff2,fontSize:12,fontWeight:600,padding:"7px 14px",background:"var(--ind-50)",color:"var(--indigo)",border:"1px solid var(--ind-200)",borderRadius:8,cursor:"pointer"}}>{revealed===0?"Show me the first step":"Show next step"}</button>
        :<p style={{margin:"10px 0 0",fontSize:12,fontWeight:600,color:"#16a34a"}}><span className="lc-check" style={{marginRight:3}}>✓</span>That's the full method.</p>}
    </div>
  );
}
```

- [ ] **Step 2: Replace the worked-example block inside `LearnCard`** (the `{we&&(<div className={"lc-card"+(done?" lc-done":"")} ...>…</div>)}` block) with:

```js
      {we&&(<div className="lc-card" style={{marginBottom:10,animationDelay:"160ms"}}><WorkedExample we={we}/></div>)}
```

Also remove the now-unused `const done=revealed>=we.steps.length;` and the `const [revealed,setRevealed]=useState(0);` from `LearnCard` **only if** they are no longer referenced elsewhere in `LearnCard` (the note/intro/watch blocks do not use them). Leave `we` defined (`const we=learn.workedExample;`).

- [ ] **Step 3: Compile check** (server already running, or start it). Playwright navigate → expect 0 errors. Then render the r8 inline card to confirm the refactor didn't break it:

```js
// browser_evaluate
() => { let h=document.getElementById('t');if(h)h.remove();h=document.createElement('div');h.id='t';h.style.cssText='position:fixed;top:0;left:0;width:540px;padding:16px;background:#eef2ff;z-index:99999';document.body.appendChild(h);ReactDOM.createRoot(h).render(React.createElement(window.LearnCard,{learn:window.LEARN.u26_r8,outcomeKey:'u26_r8',studentId:'t'}));return {ok:typeof window.WorkedExample==='function'}; }
```
Screenshot `#t`, Read it, confirm the worked example renders and "Show me the first step" reveals steps. Remove `#t` and artifacts.

- [ ] **Step 4: Commit.**

```bash
git add solo/index.html && git commit -m "refactor(solo): extract WorkedExample component shared by LearnCard"
```

---

## Task 3: Extract `NoteField` component from `LearnCard`

**Files:** Modify `solo/index.html` — add component above `WorkedExample`, replace the note block in `LearnCard`.

- [ ] **Step 1: Add `NoteField`** above `WorkedExample`.

```js
function NoteField({outcomeKey,studentId,label}){
  const ff2="'Lexend',sans-serif";
  const noteKey="solo_note_"+(studentId||"anon")+"_"+outcomeKey;
  const [note,setNote]=useState(function(){try{return localStorage.getItem(noteKey)||"";}catch(e){return "";}});
  const [saved,setSaved]=useState(false);
  function save(v){setNote(v);try{localStorage.setItem(noteKey,v);}catch(e){}setSaved(true);}
  return(
    <div>
      <label style={{display:"block",fontSize:12,fontWeight:700,color:"var(--indigo)",margin:"0 0 6px"}}>{label}</label>
      <textarea value={note} onChange={e=>save(e.target.value)} rows={2} placeholder="Type one thing you learned…"
        style={{width:"100%",boxSizing:"border-box",fontFamily:ff2,fontSize:13,padding:"8px 10px",border:"1px solid var(--border)",borderRadius:8,resize:"vertical",color:"var(--text)"}}/>
      {saved&&note.trim()&&<span style={{fontSize:11,color:"#16a34a",fontWeight:600}}><span className="lc-check" style={{marginRight:3}}>✓</span>Saved to this device</span>}
    </div>
  );
}
```

- [ ] **Step 2: Replace the note block inside `LearnCard`** (`{learn.note&&(<div ...><label …/><textarea …/>…</div>)}`) with:

```js
      {learn.note&&(
        <div className="lc-card" style={{...cardBox,marginBottom:0,animationDelay:"240ms"}}>
          <NoteField outcomeKey={outcomeKey} studentId={studentId} label={"✍️ Your turn — "+learn.note}/>
        </div>
      )}
```
Remove the now-unused `noteKey`/`note`/`savedFlash`/`saveNote` locals from `LearnCard`.

- [ ] **Step 3: Compile check** — Playwright navigate, 0 errors; render r8 LearnCard again, confirm the note box still types and shows "Saved". Clean up artifacts.

- [ ] **Step 4: Commit.**

```bash
git add solo/index.html && git commit -m "refactor(solo): extract NoteField component shared by LearnCard"
```

---

## Task 4: Add lesson state and helpers

**Files:** Modify `solo/index.html` — add state near the other practice state (`const [practiceBookwork…`), add functions near `startPractice`.

- [ ] **Step 1: Add state** after the `practiceBookwork` line (use the existing `const { useState } = React;` already in scope):

```js
  const [learnUnit,setLearnUnit]=useState(null);
  const [learnOutcome,setLearnOutcome]=useState(null);
  const [learnStage,setLearnStage]=useState("hook"); // hook|learn|try|reflect
  const [learnTryIdx,setLearnTryIdx]=useState(0);
  const [learnHookRevealed,setLearnHookRevealed]=useState(false);
  const [learnTryRevealed,setLearnTryRevealed]=useState(false);
```

- [ ] **Step 2: Add helpers** just above `function startPractice(`:

```js
  function startLesson(unit,outcome){
    setLearnUnit(unit);setLearnOutcome(outcome);
    setLearnStage("hook");setLearnTryIdx(0);
    setLearnHookRevealed(false);setLearnTryRevealed(false);
    setExpandedResource(null);
    setView("learn");
  }
  function learnNextTry(){
    const t=(LEARN[`${learnUnit.id}_${learnOutcome.id}`]||{}).tryIt||[];
    if(learnTryIdx<t.length-1){setLearnTryIdx(i=>i+1);setLearnTryRevealed(false);}
    else{setLearnStage("reflect");}
  }
```

- [ ] **Step 3: Compile check** — Playwright navigate, expect 0 errors, and confirm `typeof window.startLesson` is not needed (it's a closure, not global) — instead just confirm the app still mounts (0 errors).

- [ ] **Step 4: Commit.**

```bash
git add solo/index.html && git commit -m "feat(solo): lesson state + startLesson/learnNextTry helpers"
```

---

## Task 5: Render the lesson view (`view==="learn"`)

**Files:** Modify `solo/index.html` — add a new `if(view==="learn"){…}` block. Place it immediately **before** `if(view==="practice"){` so it follows the same screen pattern.

- [ ] **Step 1: Add the lesson screen.**

```js
  if(view==="learn"&&learnOutcome&&learnUnit){
    const key=`${learnUnit.id}_${learnOutcome.id}`;
    const L=LEARN[key]||{};
    const uc=UC[learnUnit.id]||{dark:"#1e3a8a"};
    const stages=["hook","learn","try","reflect"];
    const stageIdx=stages.indexOf(learnStage);
    const tryList=L.tryIt||[];
    const tryQ=tryList[learnTryIdx];
    const res=(unitResources[key]||[]).length>0?unitResources[key]:(RESOURCES[key]||[]);
    const big={fontSize:18,fontWeight:600,color:"var(--text)",lineHeight:1.5,margin:"0 0 4px"};
    const sub={fontSize:13,color:"var(--sub)",lineHeight:1.55,margin:0};
    const primaryBtn={fontFamily:ff,fontSize:14,fontWeight:700,padding:"11px 22px",border:"none",borderRadius:10,cursor:"pointer",background:"linear-gradient(135deg,var(--indigo),var(--blue))",color:"#fff",boxShadow:"0 3px 14px rgba(67,56,202,0.3)"};
    const ghostBtn={fontFamily:ff,fontSize:13,fontWeight:600,padding:"10px 18px",borderRadius:10,cursor:"pointer",background:"var(--ind-50)",color:"var(--indigo)",border:"1px solid var(--ind-200)"};
    return(
      <div style={{display:"flex",flexDirection:"column",flex:1,fontFamily:ff}}>
        <AppNav title="Lesson" right={<button onClick={()=>setView("rubric")} style={{fontFamily:ff,fontSize:12,padding:"6px 12px",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,color:"rgba(255,255,255,0.8)",cursor:"pointer"}}>✕ Close</button>}/>
        <div style={{flex:1,overflowY:"auto",padding:"18px"}}>
          <div style={{maxWidth:560,margin:"0 auto"}}>
            <div style={{marginBottom:18}}>
              <p style={{fontSize:12,color:"var(--sub)",margin:"0 0 8px",fontWeight:600}}>{learnOutcome.short}{L.journey?` · part of your ${L.journey} journey`:""}</p>
              <div style={{display:"flex",gap:6}}>
                {stages.map((s,i)=><div key={s} style={{flex:1,height:5,borderRadius:99,background:i<=stageIdx?"linear-gradient(90deg,var(--indigo),var(--blue))":"var(--ind-100)",transition:"background 0.3s"}}/>)}
              </div>
            </div>

            {learnStage==="hook"&&(
              <div>
                <Coach mood="think" reactKey="hook">
                  <p style={{fontSize:12,fontWeight:700,color:"var(--indigo)",margin:"0 0 4px"}}>Before we start 🤔</p>
                  <p style={big}>{L.hook.question}</p>
                  {learnHookRevealed&&<p style={{...sub,marginTop:8}}>{L.hook.reveal}</p>}
                </Coach>
                <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}>
                  {!learnHookRevealed
                    ?<button onClick={()=>setLearnHookRevealed(true)} style={primaryBtn}>{L.hook.revealLabel||"Show what's really going on"}</button>
                    :<>
                      <button onClick={()=>setLearnStage("learn")} style={ghostBtn}>It surprised me 😮</button>
                      <button onClick={()=>setLearnStage("learn")} style={primaryBtn}>Got it — let's learn →</button>
                    </>}
                </div>
              </div>
            )}

            {learnStage==="learn"&&(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <Coach mood="idle" reactKey="learn"><p style={{fontSize:13.5,fontWeight:600,margin:0,color:"var(--text)",lineHeight:1.5}}>Here's the idea. Watch, then follow the worked example with your book open.</p></Coach>
                {L.watch&&(
                  <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px"}}>
                    <p style={{fontSize:12,fontWeight:700,color:"var(--indigo)",margin:"0 0 8px"}}>📹 Watch &amp; note in your book</p>
                    <ol style={{margin:0,paddingLeft:18,display:"flex",flexDirection:"column",gap:5}}>
                      {L.watch.prompts.map((p,i)=><li key={i} style={{fontSize:12,color:"var(--text)",lineHeight:1.5}}>{p}</li>)}
                    </ol>
                    {res.length>0&&<div style={{display:"flex",flexDirection:"column",gap:6,marginTop:10}}>
                      {res.map((r,i)=>(
                        <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"var(--ind-50)",border:"1px solid var(--ind-200)",borderRadius:8,textDecoration:"none",color:"var(--text)"}}>
                          <span style={{fontSize:16,flexShrink:0}}>{TYPE_ICON[r.type]||"🌐"}</span>
                          <span style={{fontSize:12.5,fontWeight:600,flex:1}}>{r.label}</span><span style={{fontSize:11,color:"var(--muted)"}}>↗</span>
                        </a>
                      ))}
                    </div>}
                  </div>
                )}
                {L.workedExample&&<WorkedExample we={L.workedExample}/>}
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  <button onClick={()=>setLearnStage("hook")} style={ghostBtn}>← Back</button>
                  <button onClick={()=>setLearnStage("try")} style={primaryBtn}>Try it yourself →</button>
                </div>
              </div>
            )}

            {learnStage==="try"&&tryQ&&(
              <div>
                <Coach mood="idle" reactKey={"try"+learnTryIdx}>
                  <p style={{fontSize:11,fontWeight:700,color:"var(--muted)",margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Try it in your book · {learnTryIdx+1} of {tryList.length}</p>
                  <p style={big}>{tryQ.question}</p>
                  {!learnTryRevealed
                    ?<p style={{...sub,marginTop:6}}>Work it out in your maths book, then check yourself.</p>
                    :<div style={{marginTop:8}}><p style={{fontSize:14,fontWeight:700,color:"#16a34a",margin:"0 0 2px"}}>Answer: {tryQ.answer}</p><p style={sub}>{tryQ.explain}</p><p style={{...sub,marginTop:6,fontWeight:600}}>Tick it in your book if you got it.</p></div>}
                </Coach>
                <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}>
                  {!learnTryRevealed
                    ?<button onClick={()=>setLearnTryRevealed(true)} style={primaryBtn}>Show the answer</button>
                    :<>
                      <button onClick={learnNextTry} style={ghostBtn}>Not yet — that's ok</button>
                      <button onClick={learnNextTry} style={primaryBtn}>{learnTryIdx<tryList.length-1?"Got it — next →":"Got it →"}</button>
                    </>}
                </div>
              </div>
            )}

            {learnStage==="reflect"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <Coach mood="happy" reactKey="reflect">
                  <p style={{fontSize:12,fontWeight:700,color:"var(--indigo)",margin:"0 0 4px"}}>One last thing ✍️</p>
                  <p style={big}>{L.reflect.prompt}</p>
                </Coach>
                {L.reflect.note&&<div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px"}}><NoteField outcomeKey={key} studentId={studentId} label={"Your turn — "+L.reflect.note}/></div>}
                <Coach mood="happy" reactKey="reflect-close"><p style={{fontSize:13.5,fontWeight:600,margin:0,color:"var(--text)",lineHeight:1.5}}>Nice work — you've got {learnOutcome.short.toLowerCase()}. Ready to prove it?</p></Coach>
                <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
                  <button onClick={()=>setView("rubric")} style={ghostBtn}>Back to units</button>
                  <button onClick={()=>startPractice(learnUnit,learnOutcome)} style={primaryBtn}>Go to Know practice →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
```

- [ ] **Step 2: Compile check** — Playwright navigate, expect 0 errors.

- [ ] **Step 3: Render check each stage.** In the running app, force the lesson view and step through stages via `browser_evaluate` is hard (state is in a closure). Instead, verify by driving the real UI in a later manual pass; for now confirm the view block compiles (0 errors) and screenshot is deferred to Task 6 where the Grow button can launch it. (No isolated render — the view depends on App state.)

- [ ] **Step 4: Commit.**

```bash
git add solo/index.html && git commit -m "feat(solo): full-screen guided lesson view (hook/learn/try/reflect)"
```

---

## Task 6: Launch the lesson from the 📚 Grow button

**Files:** Modify `solo/index.html` — the 📚 Grow button in the student rubric outcome card.

- [ ] **Step 1: Change the Grow button onClick** so it launches the lesson when the outcome has a `hook`, else toggles the inline panel as today. Find:

```js
                                <button onClick={()=>setExpandedResource(isExpanded?null:resKey)}
```
Replace its `onClick` with:

```js
                                <button onClick={()=>{ if((LEARN[resKey]||{}).hook){startLesson(selectedUnit,o);} else {setExpandedResource(isExpanded?null:resKey);} }}
```

- [ ] **Step 2: Manual verification (real flow).** Server running, Playwright navigate. Because reaching the student rubric needs login, do a scoped check instead: confirm 0 console errors, and confirm the handler exists by evaluating that the deployed `App` source contains `startLesson(selectedUnit,o)`:

```bash
grep -c "startLesson(selectedUnit,o)" solo/index.html   # expect 1
```

- [ ] **Step 3: Render the lesson via forced state (smoke).** Acceptable proxy: temporarily expose `startLesson` for a screenshot is not possible (closure). Instead screenshot is covered by the live trial after deploy. Confirm compile (0 errors) is sufficient here.

- [ ] **Step 4: Commit.**

```bash
git add solo/index.html && git commit -m "feat(solo): 📚 Grow launches the guided lesson when one exists"
```

---

## Task 7: Remove the Know bookwork gate

**Files:** Modify `solo/index.html` — revert the bookwork-gate additions in the practice (`view==="practice"`, questions phase) flow.

- [ ] **Step 1: Remove the state.** Delete the line:

```js
  const [practiceBookwork,setPracticeBookwork]=useState(false);
```

- [ ] **Step 2: Remove the resets.** Delete every `setPracticeBookwork(false);` (in `startPractice`, in `nextPracticeQuestion`'s new-question branch, and in the done-screen "Try again" button onClick).

- [ ] **Step 3: Remove the derived vars.** Delete the three lines:

```js
    const needsBookwork=["input","mc","truefalse"].includes(q.type);
    const gateBookwork=needsBookwork&&!practiceBookwork&&!practiceSubmitted;
    const bookworkPrompt=q.type==="input"?...:...;
```

- [ ] **Step 4: Remove the gate render block** (the `{gateBookwork&&(<Coach …>…I've worked it out…</Coach>)}` block) and restore the answer area opener `{!practiceSubmitted&&!gateBookwork&&<>` back to `{!practiceSubmitted&&<>`.

- [ ] **Step 5: Restore the Check button condition** from `{!practiceSubmitted&&!gateBookwork&&(` back to `{!practiceSubmitted&&(`.

- [ ] **Step 6: Compile check + grep.**

```bash
grep -c "practiceBookwork\|gateBookwork\|bookworkPrompt" solo/index.html   # expect 0
```
Playwright navigate → 0 errors.

- [ ] **Step 7: Commit.**

```bash
git add solo/index.html && git commit -m "revert(solo): remove the Know per-question bookwork gate"
```

---

## Task 8: Full verification and ship

- [ ] **Step 1: Parse all data blocks.**

```bash
cd /workspaces/morphology-builder
node -e "const fs=require('fs');const h=fs.readFileSync('solo/index.html','utf8');['UNITS','PRETESTS','PRACTICE','RESOURCES','BEYOND','LEARN'].forEach(n=>{const op=n==='UNITS'?'\\\\[':'\\\\{',cl=n==='UNITS'?'\\\\]':'\\\\}';const re=new RegExp('var '+n+' = '+op+'[\\\\s\\\\S]*?'+cl+';\\\\s*\\\\n');const m=h.match(re);try{eval(m[0]);console.log(n,'OK');}catch(e){console.log(n,'ERR',e.message);}});"
```
Expected: all `OK`.

- [ ] **Step 2: Live smoke.** Playwright navigate `http://127.0.0.1:8099/solo/index.html` → 0 errors; confirm `window.WorkedExample`, `window.NoteField`, `window.Coach` are all `function`, and `window.LEARN.u26_r5.hook` is truthy.

- [ ] **Step 3: Stop server + clean artifacts.**

```bash
pkill -f "http.server 8099" 2>/dev/null; rm -rf .playwright-mcp *.png
```

- [ ] **Step 4: Push.**

```bash
git push origin main
```

- [ ] **Step 5: Live trial guidance.** Tell the user: hard-refresh, student view, Unit 26 → Trailing zeros → 📚 Grow to walk the new lesson; and confirm Know no longer gates each question.

---

## Self-review notes (filled by author)

- **Spec coverage:** Hook/Learn/Try/Reflect → Task 5; data schema → Task 1; reuse of Coach/worked-example/note → Tasks 2,3,5; launch + fallback → Task 6; Know cleanup → Task 7; constraints (vanilla, gated animations) → reuse of existing gated classes (`lc-*`, `coach-*`); formative self-checks (no DB) → Task 5 (buttons just advance); journey-light → Task 5 header + reflect close. All covered.
- **Deferred items** (real journey progress, teacher-visible reflections, rolling content to other outcomes) are intentionally not in this plan, per spec Non-goals/Deferred.
- **Type/name consistency:** `startLesson`, `learnNextTry`, `learnStage` values (`hook|learn|try|reflect`), `WorkedExample({we,title})`, `NoteField({outcomeKey,studentId,label})`, `LEARN[key].hook` launch condition — used consistently across tasks.
