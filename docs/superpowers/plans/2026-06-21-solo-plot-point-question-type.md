# SOLO Plot-Point Question Type — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a graded `plot` question type to the SOLO tracker — students place a point on a Cartesian plane (tap/click + arrow-key cursor) as their answer — and use it across Unit 28 Position outcomes, plus add more display visuals to u28 Know/Show questions.

**Architecture:** New interactive `PlotQ` component (mirrors the existing `NumberLineQ`/`MatchQ`/`PartitionQ` pattern: `{q, ans, setAns}`, stores into a per-flow answer-state field `plot`), a read-only `PlotReveal` for post-submit feedback, and a shared `gridGeom`/`GridBase` helper. Grading goes through the one existing `checkAnswer(given, q)`. The pure-display `Visual` component is left untouched.

**Tech Stack:** Single file `solo/index.html` — React 18 via in-browser Babel, no build system, no test framework. Verification is the three SOLO gates (Node parse-eval, Playwright 0-console-errors render, visual harness screenshot) plus a Playwright interaction click-through.

## Global Constraints

- **One file:** all changes are in `solo/index.html`. No new files, no npm, no bundler.
- **No partial exposure:** commit locally per task; **push to `main` only in the final task**, after all gates pass (pushing auto-deploys to students via Vercel).
- **Outcome IDs are DB keys** — never renumber existing question/outcome IDs.
- **Unicode** minus `−`, `×`, `÷` in any displayed text; coordinates written `(x, y)` with a space.
- **WCAG 2.1 AA:** the plot grid must be fully keyboard-operable (arrow keys + Enter/Space) and expose an `aria-live` position announcement. Reuse the app's `focus-visible` styling.
- **Assessment integrity:** graded `plot` questions never pre-show the answer point; the correct point appears only in the post-submit `PlotReveal`.
- **Existing answer-state shape (verbatim):** `{input:"",option:"",orderSeq:[],shadedCells:[],nlPlaced:{},matchPairs:{},partitionShaded:[]}`. This plan adds the field `plot:null` to it everywhere it appears.
- **Verify gates (copy-paste):**
  - Parse: `node - <<'EOF' … EOF` block from Task 1 Step 2.
  - Render: serve `python3 -m http.server 8091 --bind 127.0.0.1` then Playwright-load `http://127.0.0.1:8091/solo/index.html`, expect **0 console errors** (favicon 404 only).
  - Co-author trailer on every commit: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## File Structure

| Symbol | Location (approx.) | Responsibility |
|---|---|---|
| `checkAnswer(given,q)` | `solo/index.html:14843` | add `plot` grading branch |
| `fmtGiven(given,q)` | `:14862` | add `plot` formatting branch |
| `initAns(q)` | `:14870` | add `plot:null` |
| 9 answer-state reset literals | `:15688,15702,15724,15735,16728,16766,16772,17558,17701` | add `plot:null` |
| `gridGeom(plane)` + `GridBase({g})` | new, just before `function NumberLineQ` (`:14647`) | shared coordinate geometry + grid/axes render |
| `PlotQ({q,ans,setAns})` | new, after `GridBase` | interactive plotting widget |
| `PlotReveal({q,given})` | new, after `PlotQ` | read-only answer reveal |
| Know practice render | `:17642–17688` | render `PlotQ` + reveal; `practiceCan()` |
| Pretest render + can/given | around `:18006` | render `PlotQ` + reveal; isAnswered + given |
| Show review render + can/given | `:16116–16137`, `:18166` | render `PlotQ` + reveal; isAnswered + given |
| `ans` flow | `:15688`, `:18312` | confirm whether it grades; wire if so |
| `UNITS`/`PRETESTS`/`PRACTICE` u28 | Position blocks | add the `plot` content questions |

---

### Task 1: Grading core — `plot` in checkAnswer / fmtGiven / initAns / all reset literals

**Files:**
- Modify: `solo/index.html` (`checkAnswer` ~14843, `fmtGiven` ~14862, `initAns` ~14870, nine reset literals listed above)

**Interfaces:**
- Produces: `checkAnswer(given,{type:"plot",answer:{x,y}})` returns true iff `given` is `{x,y}` matching `answer`. Answer-state objects gain `plot: {x:number,y:number} | null`.

- [ ] **Step 1: Add the grading + formatting + init branches**

In `checkAnswer`, immediately after the `partition` branch (the lines `if(q.type==="partition"){ … return given.length===q.target; }`), add:

```js
  if(q.type==="plot"){
    if(!given||typeof given!=="object")return false;
    return Number(given.x)===q.answer.x&&Number(given.y)===q.answer.y;
  }
```

In `fmtGiven`, after the `partition` line, add:

```js
  if(q.type==="plot")return given?`(${given.x}, ${given.y})`:"(blank)";
```

In `initAns`, change the returned object to include `plot:null` (append `,plot:null` before the closing `}`).

- [ ] **Step 2: Add `plot:null` to all nine reset literals**

For each of the nine occurrences, add `,plot:null` before the closing brace. Eight are the full literal `{input:"",option:"",orderSeq:[],shadedCells:[],nlPlaced:{},matchPairs:{},partitionShaded:[]}` (lines ~15702, 15724, 15735, 16728, 16766, 16772, 17558, 17701) → becomes `…,partitionShaded:[],plot:null}`. One is the **short** literal at ~15688 `{input:"",option:"",orderSeq:[],shadedCells:[]}` → becomes `{input:"",option:"",orderSeq:[],shadedCells:[],plot:null}`.

Use a careful find of `partitionShaded:[]}` (replace_all) for the eight, then the single short-literal edit separately.

- [ ] **Step 3: Parse gate**

Run:
```bash
cd /workspaces/morphology-builder
node - << 'EOF'
const fs=require('fs');const s=fs.readFileSync('solo/index.html','utf8');
function ex(decl,o,c){const i=s.indexOf(decl);let j=s.indexOf(o,i),d=0,k=j;for(;k<s.length;k++){if(s[k]===o)d++;else if(s[k]===c){d--;if(d===0){k++;break;}}}try{eval('('+s.slice(j,k)+')');return decl+' OK';}catch(e){return decl+' ERR '+e.message;}}
[['var UNITS = [','[',']'],['var PRETESTS = {','{','}'],['var PRACTICE = {','{','}'],['var LEARN = {','{','}']].forEach(a=>console.log(ex(...a)));
// unit-test checkAnswer in isolation:
const ca=s.slice(s.indexOf('function checkAnswer'),s.indexOf('function fmtGiven'));
const norm=x=>String(x).trim().toLowerCase().replace(/\s+/g," ");eval(ca);
console.log('plot exact', checkAnswer({x:3,y:5},{type:"plot",answer:{x:3,y:5}})===true);
console.log('plot wrong', checkAnswer({x:3,y:4},{type:"plot",answer:{x:3,y:5}})===false);
console.log('plot blank', checkAnswer(null,{type:"plot",answer:{x:3,y:5}})===false);
EOF
```
Expected: four `OK`, then three `true`.

- [ ] **Step 4: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): add plot answer type to grading core

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `gridGeom`, `GridBase`, `PlotQ`, `PlotReveal` components

**Files:**
- Modify: `solo/index.html` — insert immediately before `function NumberLineQ({q,ans,setAns}){` (~14647)

**Interfaces:**
- Produces:
  - `gridGeom(plane)` → `{min,max,step,n,cell,pad,S,W,H,px,py,x0,y0}` (px/py map data→SVG units).
  - `GridBase({g})` → `<g>` of gridlines, numbered axis labels, bold axes (auto when min<0).
  - `PlotQ({q,ans,setAns})` — interactive; reads `ans.plot`, writes `setAns(a=>({...a,plot:{x,y}}))`.
  - `PlotReveal({q,given})` — read-only; draws correct point (green ring) + student point.
- Consumes: `q.plane={min,max,step}`, `q.answer={x,y}`, optional `q.markers=[{x,y,label,color}]`.

- [ ] **Step 1: Insert the four definitions** (verbatim) before `NumberLineQ`:

```js
function gridGeom(plane){
  const min=plane.min,max=plane.max,step=plane.step||1,n=max-min;
  const cell=Math.max(26,Math.min(40,320/n)),pad=26,S=n*cell;
  const px=(x)=>pad+(x-min)*cell,py=(y)=>pad+(max-y)*cell;
  const x0=(min<=0&&max>=0)?px(0):pad,y0=(min<=0&&max>=0)?py(0):pad+S;
  return {min,max,step,n,cell,pad,S,W:S+2*pad,H:S+2*pad,px,py,x0,y0};
}
function GridBase({g}){
  const {min,max,pad,S,px,py,x0,y0}=g,items=[];
  for(let i=min;i<=max;i++){items.push(<line key={"v"+i} x1={px(i)} y1={pad} x2={px(i)} y2={pad+S} stroke="#e8edff" strokeWidth="1"/>);items.push(<line key={"h"+i} x1={pad} y1={py(i)} x2={pad+S} y2={py(i)} stroke="#e8edff" strokeWidth="1"/>);}
  for(let i=min;i<=max;i++){if(i===0)continue;items.push(<text key={"lx"+i} x={px(i)} y={y0+12} textAnchor="middle" fontSize="9" fill="#64748b">{i}</text>);items.push(<text key={"ly"+i} x={x0-6} y={py(i)+3} textAnchor="end" fontSize="9" fill="#64748b">{i}</text>);}
  items.push(<line key="axx" x1={x0} y1={pad} x2={x0} y2={pad+S} stroke="#334155" strokeWidth="1.8"/>);
  items.push(<line key="axy" x1={pad} y1={y0} x2={pad+S} y2={y0} stroke="#334155" strokeWidth="1.8"/>);
  items.push(<text key="xl" x={pad+S-2} y={y0-4} textAnchor="end" fontSize="9" fontWeight="700" fill="#334155">x</text>);
  items.push(<text key="yl" x={x0+4} y={pad+8} fontSize="9" fontWeight="700" fill="#334155">y</text>);
  return <g>{items}</g>;
}
const PLOT_COL={red:"#ef4444",blue:"#3b82f6",green:"#22c55e",yellow:"#eab308",purple:"#a855f7",orange:"#f97316",grey:"#94a3b8"};
function PlotQ({q,ans,setAns}){
  const g=gridGeom(q.plane||{min:0,max:8,step:1});
  const {min,max,step,pad,S,W,H,px,py}=g;
  const svgRef=useRef(null);
  const val=ans.plot;
  const [cursor,setCursor]=useState({x:val?val.x:((min<=0&&max>=0)?0:min),y:val?val.y:((min<=0&&max>=0)?0:min)});
  const [focused,setFocused]=useState(false);
  const snap=(v)=>{let k=Math.round((v-min)/step)*step+min;k=Math.round(k*1000)/1000;return Math.max(min,Math.min(max,k));};
  function place(x,y){const nx=snap(x),ny=snap(y);setCursor({x:nx,y:ny});setAns(a=>({...a,plot:{x:nx,y:ny}}));}
  function fromEvent(e){const r=svgRef.current.getBoundingClientRect();const sc=r.width/W;const cx=e.changedTouches?e.changedTouches[0].clientX:e.clientX,cy=e.changedTouches?e.changedTouches[0].clientY:e.clientY;place(min+((cx-r.left)/sc-pad)/g.cell,max-((cy-r.top)/sc-pad)/g.cell);}
  function onKey(e){let {x,y}=cursor;const k=e.key;if(k==="ArrowRight")x=snap(x+step);else if(k==="ArrowLeft")x=snap(x-step);else if(k==="ArrowUp")y=snap(y+step);else if(k==="ArrowDown")y=snap(y-step);else if(k==="Enter"||k===" "){e.preventDefault();place(cursor.x,cursor.y);return;}else return;e.preventDefault();setCursor({x,y});}
  const markers=(q.markers||[]).map((m,i)=><g key={"m"+i}><circle cx={px(m.x)} cy={py(m.y)} r="5" fill={PLOT_COL[m.color]||"#94a3b8"} opacity="0.85"/>{m.label&&<text x={px(m.x)+7} y={py(m.y)-6} fontSize="10" fontWeight="700" fill="#64748b">{m.label}</text>}</g>);
  const live=val?("Plotted at "+val.x+", "+val.y):("Cursor at "+cursor.x+", "+cursor.y+". Arrow keys move, Enter plots.");
  return(
    <div style={{position:"relative"}}>
      <p style={{fontSize:13,color:"#64748b",margin:"0 0 10px",fontStyle:"italic"}}>Tap the grid to plot your point — or use the arrow keys and Enter.</p>
      <svg ref={svgRef} viewBox={"0 0 "+W+" "+H} width="100%" style={{maxWidth:W,display:"block",margin:"0 auto",touchAction:"manipulation",cursor:"crosshair",borderRadius:8,outline:focused?"2px solid #4338ca":"none"}}
        tabIndex={0} role="application" aria-label={"Coordinate grid "+min+" to "+max+". "+live}
        onClick={fromEvent} onTouchEnd={e=>{e.preventDefault();fromEvent(e);}} onKeyDown={onKey} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}>
        <GridBase g={g}/>
        {markers}
        {focused&&<g><line x1={px(cursor.x)} y1={pad} x2={px(cursor.x)} y2={pad+S} stroke="#a5b4fc" strokeWidth="1" strokeDasharray="3 3"/><line x1={pad} y1={py(cursor.y)} x2={pad+S} y2={py(cursor.y)} stroke="#a5b4fc" strokeWidth="1" strokeDasharray="3 3"/></g>}
        {val&&<circle cx={px(val.x)} cy={py(val.y)} r="6" fill="#4338ca" stroke="#fff" strokeWidth="1.5"/>}
      </svg>
      <span aria-live="polite" style={{position:"absolute",width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0,0,0,0)",border:0}}>{live}</span>
    </div>
  );
}
function PlotReveal({q,given}){
  const g=gridGeom(q.plane||{min:0,max:8,step:1});
  const {W,H,px,py}=g;
  const correct=given&&Number(given.x)===q.answer.x&&Number(given.y)===q.answer.y;
  return(
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:8,margin:"4px 0"}}>
      <svg viewBox={"0 0 "+W+" "+H} width="100%" style={{maxWidth:W,display:"block",margin:"0 auto"}} role="img" aria-label={"Correct point at "+q.answer.x+", "+q.answer.y+(given?", your point at "+given.x+", "+given.y:"")}>
        <GridBase g={g}/>
        {given&&!correct&&<g><circle cx={px(given.x)} cy={py(given.y)} r="5" fill="#dc2626"/><text x={px(given.x)+7} y={py(given.y)+14} fontSize="9" fontWeight="700" fill="#dc2626">yours</text></g>}
        <circle cx={px(q.answer.x)} cy={py(q.answer.y)} r="6.5" fill={correct?"#16a34a":"none"} stroke="#16a34a" strokeWidth="2.5"/>
        <text x={px(q.answer.x)+8} y={py(q.answer.y)-7} fontSize="10" fontWeight="700" fill="#16a34a">({q.answer.x}, {q.answer.y})</text>
      </svg>
      <p style={{margin:"6px 0 0",textAlign:"center",fontSize:12,fontWeight:700,color:correct?"#16a34a":"#dc2626"}}>{correct?"Correct! ✓":"The green ring shows the correct spot."}</p>
    </div>
  );
}
```

- [ ] **Step 2: Visual gate (harness)**

Build a harness (same approach as the u28 visuals verification) that imports `gridGeom`, `GridBase`, `PlotReveal` and renders `PlotReveal` for: first-quadrant correct `{plane:{min:0,max:8,step:1},answer:{x:3,y:5}}` with `given:{x:3,y:5}`; four-quadrant wrong `{plane:{min:-5,max:5,step:1},answer:{x:-4,y:3}}` with `given:{x:4,y:3}`; half-grid `{plane:{min:0,max:8,step:0.5},answer:{x:2.5,y:3}}` with `given:{x:2.5,y:3}`. Extract the four new functions by name. Serve, navigate Playwright, **screenshot**, confirm each renders (axes, labels, green ring, red student point). Delete the harness + screenshot after.

- [ ] **Step 3: Render gate**

Serve and Playwright-load `http://127.0.0.1:8091/solo/index.html`. Expect **0 console errors** (the new components compile but aren't referenced yet — this catches JSX syntax errors).

- [ ] **Step 4: Commit**

```bash
git add solo/index.html
git commit -m "feat(solo): PlotQ/PlotReveal interactive coordinate components

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Wire `plot` into the Know-practice flow

**Files:**
- Modify: `solo/index.html` practice render (~17674–17688) and `practiceCan()` (search for `function practiceCan`).

**Interfaces:**
- Consumes: `PlotQ`, `PlotReveal` (Task 2); `checkAnswer` (Task 1).

- [ ] **Step 1: Render the widget.** After the `partition` line `{q.type==="partition"&&<PartitionQ key={`p${practiceIdx}`} q={q} ans={practiceAns} setAns={setPracticeAns}/>}`, add:

```js
                {q.type==="plot"&&<PlotQ key={`p${practiceIdx}`} q={q} ans={practiceAns} setAns={setPracticeAns}/>}
```

- [ ] **Step 2: Reveal on submit.** Inside the `{practiceSubmitted&&( … )}` block, just before the `<Coach …>` element, add:

```js
                {q.type==="plot"&&<PlotReveal q={q} given={practiceAns.plot}/>}
```

- [ ] **Step 3: Enable the Check button.** In `practiceCan()`, add a branch so plot counts as answered:

```js
    if(q.type==="plot")return practiceAns.plot!==null;
```
(place it alongside the other `q.type===` checks in that function).

- [ ] **Step 4: Render gate** — 0 console errors loading the app.

- [ ] **Step 5: Commit**
```bash
git add solo/index.html && git commit -m "feat(solo): wire plot type into Know practice flow

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Wire `plot` into the pretest flow

**Files:**
- Modify: `solo/index.html` pretest render (~18006) + its can/given logic (search near `pretestAns` for the `isAnswered`/`given` equivalents — pattern matches `reviewAns` at 16116–16137).

**Interfaces:** Consumes `PlotQ`/`PlotReveal`/`checkAnswer`.

- [ ] **Step 1: Render the widget** in the pretest question body, alongside the other `q.type==="…"` renderers, using `pretestAns`/`setPretestAns`:
```js
{q.type==="plot"&&<PlotQ key={`pt${pretestIdx}`} q={q} ans={pretestAns} setAns={setPretestAns}/>}
```
(use the loop index variable actually in scope — confirm its name when editing.)

- [ ] **Step 2: Reveal** in the pretest's post-answer branch:
```js
{q.type==="plot"&&<PlotReveal q={q} given={pretestAns.plot}/>}
```

- [ ] **Step 3: isAnswered + given.** In the pretest "can proceed" predicate add `if(q.type==="plot")return pretestAns.plot!==null;`. In its `given` builder add `else if(q.type==="plot")given=pretestAns.plot;` before the default `given=…input`.

- [ ] **Step 4: Render gate** — 0 console errors.

- [ ] **Step 5: Commit**
```bash
git add solo/index.html && git commit -m "feat(solo): wire plot type into pretest flow

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Wire `plot` into the Show-review flow (+ confirm/handle the `ans` flow)

**Files:**
- Modify: `solo/index.html` review can/given (`:16116–16137`), review render (~18166), and the `ans` flow (`:15688`, render ~18312).

**Interfaces:** Consumes `PlotQ`/`PlotReveal`/`checkAnswer`.

- [ ] **Step 1: Review isAnswered.** In the block at 16116–16122, add: `if(q.type==="plot")return reviewAns.plot!==null;`

- [ ] **Step 2: Review given.** In the block at 16130–16137, add before the final `else`: `else if(q.type==="plot")given=reviewAns.plot;`

- [ ] **Step 3: Review render + reveal.** In the review question body, add `{q.type==="plot"&&<PlotQ key={`rv${…idx}`} q={q} ans={reviewAns} setAns={setReviewAns}/>}` alongside the other renderers, and `{q.type==="plot"&&<PlotReveal q={q} given={reviewAns.plot}/>}` in its reveal branch.

- [ ] **Step 4: The `ans` flow.** Read the render at ~18312 (uses `ans`/`setAns`, reset at 15688). Determine whether it renders graded questions of arbitrary type (if it shows `q.type` widgets and calls `checkAnswer`). **If yes:** add the same render line `{q.type==="plot"&&<PlotQ … ans={ans} setAns={setAns}/>}`, a reveal, an isAnswered branch, and a given branch, mirroring Steps 1–3. **If it is not a graded-question renderer** (e.g. a one-off form), leave it — just confirm in the commit message which it was.

- [ ] **Step 5: Render gate** — 0 console errors.

- [ ] **Step 6: Commit**
```bash
git add solo/index.html && git commit -m "feat(solo): wire plot type into Show review (+ ans flow as applicable)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Add `plot` content questions across u28 Position outcomes

**Files:**
- Modify: `solo/index.html` — `UNITS` u28 (R1 ~1319, Y1 ~1355, Y2 ~1367, Y3 ~1379, G1 ~1427), `PRACTICE` (u28_r1 ~6372, u28_y1, u28_y2, u28_y3, u28_g1), `PRETESTS` u28 (~3795).

**Approach:** *Replace* one existing text question per slot with a `plot` version (keeps the ~10/~9/2 counts, "mixes throughout"). Each replacement keeps the same `id` where the object has one (UNITS/PRETESTS questions have `id`; PRACTICE questions do not). Every `answer` below is a valid lattice point at its `plane.step`; Y2/Y3 answers are the verified transformation result.

- [ ] **Step 1: R1 (first quadrant, `plane:{min:0,max:8,step:1}`).**
  - UNITS u28 R1, replace Q3 (`{id:3,type:"input",text:"A point is 5 across and 3 up from the origin. Write its coordinates.",…}`) with:
    `{id:3,type:"plot",text:"Plot the point (5, 3) on the grid.",plane:{min:0,max:8,step:1},answer:{x:5,y:3}},`
  - UNITS u28 R1, replace Q9 (`{id:9,type:"input",…(7, 7)…}`) with:
    `{id:9,type:"plot",text:"Plot the point (7, 7) on the grid.",plane:{min:0,max:8,step:1},answer:{x:7,y:7}},`
  - PRACTICE u28_r1, replace the question `{type:"input",text:"A point is 6 across and 2 up from the origin. Write its coordinates.",…}` with:
    `{type:"plot",text:"Plot the point (6, 2) on the grid.",plane:{min:0,max:8,step:1},answer:{x:6,y:2}},`
  - PRETESTS u28 r1, replace Q2 (`{id:2, type:"input", text:"A point is 5 across and 3 up from the origin. Write its coordinates.",…}`) with:
    `{id:2, type:"plot", text:"Plot the point (5, 3).", plane:{min:0,max:8,step:1}, answer:{x:5,y:3}}`

- [ ] **Step 2: Y1 (four quadrants, `plane:{min:-5,max:5,step:1}`).**
  - UNITS u28 Y1, replace Q5 (`{id:5,type:"mc",text:"Which coordinates describe a point 6 to the left and 5 down…",…}`) — note answer (−6,−5) is off a ±5 grid, so use a ±5-safe point. Replace with:
    `{id:5,type:"plot",text:"Plot the point (−4, 3) on the grid.",plane:{min:-5,max:5,step:1},answer:{x:-4,y:3}},`
  - PRACTICE u28_y1, replace `{type:"mc",text:"Which coordinates describe a point 3 left and 2 up from the origin?",…}` with:
    `{type:"plot",text:"Plot the point (−3, 2) on the grid.",plane:{min:-5,max:5,step:1},answer:{x:-3,y:2}},`
  - PRETESTS u28 y1, replace Q2 (`{id:2, type:"mc", text:"Which coordinates describe a point 6 to the left and 5 down…",…}`) with:
    `{id:2, type:"plot", text:"Plot the point (−2, −3).", plane:{min:-5,max:5,step:1}, answer:{x:-2,y:-3}}`

- [ ] **Step 3: Y2 (translate — plot the result, start marker shown).**
  - UNITS u28 Y2, replace Q1 (`{id:1,type:"mc",text:"The point (2, 3) is translated (slid) 4 units to the right.…",…}`) with:
    `{id:1,type:"plot",text:"The point (2, 3) is translated 4 units right. Plot where it lands.",plane:{min:0,max:8,step:1},markers:[{x:2,y:3,label:"start",color:"grey"}],answer:{x:6,y:3}},`
  - PRACTICE u28_y2, replace `{type:"input",text:"Translate (3, 2) by 5 units right. Write the new coordinates.",…}` with:
    `{type:"plot",text:"Translate (3, 2) by 5 units right. Plot where it lands.",plane:{min:0,max:8,step:1},markers:[{x:3,y:2,label:"start",color:"grey"}],answer:{x:8,y:2}},`

- [ ] **Step 4: Y3 (reflect — plot the result, start marker shown, `plane:{min:-5,max:5,step:1}`).**
  - UNITS u28 Y3, replace Q1 (`{id:1,type:"mc",text:"The point (3, 4) is reflected across the x-axis.…",…}`) with:
    `{id:1,type:"plot",text:"Reflect the point (3, 4) across the x-axis. Plot where it lands.",plane:{min:-5,max:5,step:1},markers:[{x:3,y:4,label:"start",color:"grey"}],answer:{x:3,y:-4}},`
  - PRACTICE u28_y3, replace `{type:"input",text:"Reflect (7, 4) across the x-axis. Write the new coordinates.",…}` with:
    `{type:"plot",text:"Reflect (4, 4) across the y-axis. Plot where it lands.",plane:{min:-5,max:5,step:1},markers:[{x:4,y:4,label:"start",color:"grey"}],answer:{x:-4,y:4}},`

- [ ] **Step 5: G1 (non-whole, `plane:{min:0,max:8,step:0.5}`).**
  - PRACTICE u28_g1, replace `{type:"truefalse",text:"True or false: the point (3.5, 2) can be plotted on the Cartesian plane.",…}` with:
    `{type:"plot",text:"Plot the point (2.5, 3) on the grid.",plane:{min:0,max:8,step:0.5},answer:{x:2.5,y:3}},`
  - UNITS u28 G1, replace Q8 (`{id:8,type:"input",text:"The point (1.5, 2) sits between which two whole numbers…",…}`) with:
    `{id:8,type:"plot",text:"Plot the point (1.5, 4) on the grid.",plane:{min:0,max:8,step:0.5},answer:{x:1.5,y:4}},`

- [ ] **Step 6: Parse gate** (Task 1 Step 3 block) — four `OK`, and re-confirm arithmetic: Y2 (2,3)+4 right=(6,3) ✓; (3,2)+5 right=(8,2) ✓; Y3 (3,4) across x=(3,−4) ✓; (4,4) across y=(−4,4) ✓. All on-grid.

- [ ] **Step 7: Render gate** — 0 console errors.

- [ ] **Step 8: Commit**
```bash
git add solo/index.html && git commit -m "content(solo u28): add interactive plot questions to Position outcomes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Add more display visuals to u28 Know/Show (second deliverable)

**Files:** Modify `solo/index.html` — `UNITS` u28 and `PRACTICE` u28 question objects.

**Approach:** Add `visual:{…}` (display `coordinateGrid`/`spinner`/`dice`/`counterBag`) to selected questions that currently have none, where a diagram helps an independent reader. Structure-only on Show/pretest (no answer revealed). Suggested additions (apply where the question names a concrete grid/spinner/dice/bag and lacks a visual):

- UNITS u28 R3 Q6 (`8 equal sections… P(any one)`) → `,visual:{type:"spinner",sections:[…8 grey…]}`
- UNITS u28 Y5 Q1 (`bag 3 red 1 blue`) → `,visual:{type:"counterBag",counters:[{color:"red",count:3},{color:"blue",count:1}]}`
- UNITS u28 G2 Q5/Q? dice/spinner items lacking a visual → matching `dice`/`spinner` spec.
- PRACTICE u28_r2/r3/y5/g2 question(s) describing a specific spinner/bag/dice and lacking a visual → matching spec.

Add 4–8 such visuals total. Keep every one structure-only on graded questions (the picture is the *setup*, never the answer). Re-use the colour names and section patterns from the existing u28 visuals.

- [ ] **Step 1:** Apply the additions above (each is a single `,visual:{…}` appended before the question object's closing `}`).
- [ ] **Step 2: Parse gate** — four `OK`.
- [ ] **Step 3: Render gate** — 0 console errors.
- [ ] **Step 4: Commit**
```bash
git add solo/index.html && git commit -m "content(solo u28): more display visuals on Know/Show questions

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Full verification + push

**Files:** none (verification only), then push.

- [ ] **Step 1: Parse gate** — run the Task 1 Step 3 block, expect four `OK` + three `true`.

- [ ] **Step 2: Visual gate** — re-run the PlotReveal harness from Task 2 Step 2; confirm screenshots render correctly; delete harness + screenshot.

- [ ] **Step 3: Render gate** — Playwright-load the app, **0 console errors**.

- [ ] **Step 4: Manual interaction (Playwright).** Drive a real plot question end-to-end:
  - Navigate to u28 → R1 → Know practice; reach the "Plot the point (6, 2)" question.
  - Click the grid near (6, 2); confirm a point appears and **Check answer** enables.
  - Submit; confirm `PlotReveal` shows green ✓ and "Correct!".
  - Repeat in the Show flow for a UNITS plot question; confirm a wrong click shows the red "yours" point + green ring + "see the answer".
  - Keyboard check: Tab to the grid, press arrows + Enter; confirm the point moves and places, and the `aria-live` text updates.
  - Record pass/fail for each in the task notes. Any fail → fix before pushing.

- [ ] **Step 5: Push**
```bash
git push origin main
```
Then confirm `git log --oneline -1` matches the pushed HEAD.

---

## Self-Review

**Spec coverage:** graded `plot` type everywhere (Tasks 1,3,4,5) ✓; R1/Y1/Y2/Y3/G1 incl. non-whole (Task 6) ✓; tap/click + arrow-key cursor + aria-live (Task 2 `PlotQ`) ✓; reveal with student+correct point (Task 2 `PlotReveal`, wired Tasks 3–5) ✓; markers for translate/reflect (Task 6 Y2/Y3) ✓; second visuals deliverable (Task 7) ✓; three gates + manual interaction (Task 8) ✓; no SQL/docx (resources unchanged) ✓.

**Placeholder scan:** Task 5 Step 4 leaves the `ans`-flow wiring conditional on reading that flow — this is a genuine, bounded investigation (the flow's role can't be assumed), with explicit yes/no handling, not a vague placeholder.

**Type consistency:** `plot` answer state is `{x,y}|null` throughout; `checkAnswer` compares `Number(given.x)===q.answer.x`; `PlotQ` writes `setAns(a=>({...a,plot:{x:nx,y:ny}}))`; reveals read `…Ans.plot`. `gridGeom`/`GridBase`/`PlotQ`/`PlotReveal` names are consistent across tasks. Component interface `{q,ans,setAns}` matches `NumberLineQ`.
