# SOLO `plot` Question Type — Interactive Coordinate Plotting (Unit 28)

**Date:** 2026-06-21
**File touched:** `solo/index.html` (single-file React-via-Babel app, no build system)
**Unit:** u28 (Position & Chance), Position outcomes R1 / Y1 / Y2 / Y3 / G1
**Status:** Approved (design) — pending implementation plan

---

## 1. Goal

Add a new **interactive answer type** to the SOLO tracker: students place a point on a
Cartesian plane as their answer (instead of choosing MC or typing). It is a **first-class graded
type** — used in Know practice, the pretest, and the Show assessment — so plotting (the actual
rubric skill, MA3-GM-01 "plot and label points") is assessed by *doing*, not by multiple choice.

Plus a lighter second deliverable: add display-only `q.visual` diagrams to more individual
Know/Show questions across u28 wherever they aid comprehension.

## 2. Context (existing architecture)

The SOLO app already supports interactive answer types beyond `mc`/`input`/`truefalse`/`order`:
`shade`, `numberline`, `match`, `partition`. Each:
- stores custom answer state in the per-flow answer object,
- is graded through one shared `checkAnswer(given, q)` function (~line 14843),
- is described through `fmtGiven(given, q)` (~14862) and seeded by `initAns(q)` (~14870).

There are **separate answer-input flows**, each with its own answer state object and reset logic:
- **Know practice** — `practiceAns` (~17646)
- **Pretest** — `pretestAns` (~18006)
- **Show review** — `reviewAns` (~18166)
- A fourth `ans` flow (~18312) — confirm during implementation whether it renders graded questions
  (if so, wire `plot` there too; if it is unrelated, skip).

The pure-display `Visual({spec})` component (~15040) already has a `coordinateGrid` type (built
2026-06-21) with the grid math (px/py mapping, axes, numbered lines, points, arrows). `plot` reuses
that math but is a **separate interactive component** — `Visual` stays display-only.

## 3. Data shape

A new question object type, consistent with existing types:

```js
{ type:"plot",
  text:"Plot the point (3, 5).",
  plane:{ min:0, max:8, step:1 },                       // min:-5 → four-quadrant; step:0.5 → half-grid (G1)
  answer:{ x:3, y:5 },                                  // the target lattice point
  markers:[{ x:2, y:3, label:"start", color:"grey" }],  // optional: fixed, non-interactive context points
  caption:"…" }                                         // optional helper caption
```

- **R1** — `plane:{min:0,max:8,step:1}`, no markers. Plot a given coordinate, first quadrant.
- **Y1** — `plane:{min:-5,max:5,step:1}`. Plot a given coordinate in any quadrant (incl. negatives).
- **Y2 / Y3** — `plane:{min:-5,max:5,step:1}` + a grey `markers` start point. The question asks the
  student to plot where the point *lands* after a translation (Y2) or reflection (Y3). `answer` is
  the resulting point.
- **G1** — `plane:{min:0,max:8,step:0.5}` (or four-quadrant), to place half-grid points like (2.5, 3).

## 4. `PlotGrid` interactive component

`PlotGrid({ plane, markers, value, onChange, disabled, reveal })`

- Renders the grid (reusing the `coordinateGrid` mapping: `px(x)`, `py(y)`, numbered lines, bold
  axes that appear when `min < 0`), draws any fixed `markers`, and the student's placed point.
- **Tap/click:** a pointer event on the SVG computes the nearest lattice point at `step` (clamped to
  `[min, max]`) and calls `onChange({x, y})`. Primary interaction; works on tablets.
- **Keyboard:** the grid is focusable (`tabIndex=0`, `role="application"`, descriptive
  `aria-label`). Arrow keys move a crosshair cursor by one `step` (clamped); Enter/Space drops the
  point at the cursor. A visually-hidden `aria-live="polite"` region announces the cursor position
  ("cursor at 3, 5") and placement ("plotted (3, 5)"). Uses the existing `focus-visible` ring from
  `wordlab-common.css`.
- **`disabled`/`reveal` (post-submit):** read-only. Shows the student's point as green ✓ if correct,
  red ✗ if wrong, **and** the correct answer point in green with its label — the same "see the
  answer above" reveal the other types use.
- Low-stim aware only insofar as it inherits app styles; no sounds/particles are added here.

## 5. Grading & feedback

- `checkAnswer`: add
  `if(q.type==="plot") return !!given && Number(given.x)===q.answer.x && Number(given.y)===q.answer.y;`
  (exact match on both coordinates).
- `fmtGiven`: `if(q.type==="plot") return given ? \`(${given.x}, ${given.y})\` : "(blank)";`
- `initAns`: add `plot:null` to the returned state object.
- Per flow: `isAnswered` → `plot!==null`; `given` builder → `reviewAns.plot` (etc.); reset logic adds
  `plot:null`; on reveal, render `PlotGrid` with `disabled reveal`.

## 6. Content plan

Add **~10–14 plot questions** spread across R1, Y1, Y2, Y3, G1, **mixed into** Know + Show (and a
couple of pretests) **alongside** the existing MC/input items — not wholesale replacement, so the
read-coordinates and reasoning skills remain assessed too. Rough split:
- R1: ~3 (Know + Show + 1 pretest), first-quadrant whole points.
- Y1: ~3, four-quadrant whole points.
- Y2: ~2, plot the translated point (start marker shown).
- Y3: ~2, plot the reflected point (start marker shown).
- G1: ~2, half-grid points (step 0.5).

Every `plot` question's `answer` must be a lattice point reachable at its `plane.step`. Verify each
target arithmetic (for Y2/Y3, the result of the named transformation).

## 7. Second deliverable — more display visuals

A lighter content pass: add `q.visual` (display `coordinateGrid` / `spinner` / `dice` / `counterBag`)
to more individual Know and Show questions across u28 where a diagram aids an independent Year 6
reader. Structure-only on assessment questions (no answer revealed); worked forms only in Grow/Know
explanations — same rule already applied.

## 8. Out of scope (YAGNI)

- Multi-point plotting (plot several points / a whole line) — single point only for v1.
- Plotting in other units — u28 only for now (the type is generic, so reuse later is free).
- Making `Visual` itself interactive.
- Drawing the connecting line for linear relationships (G1 plots a single point only).

## 9. Verification

1. **Parse gate** — node-eval UNITS/PRETESTS/PRACTICE/LEARN clean.
2. **Render gate** — load the real app in Playwright, 0 console errors (favicon 404 only).
3. **Visual gate** — harness screenshot of `PlotGrid` in empty, placed, and reveal (correct/wrong)
   states across first-quadrant, four-quadrant, and half-grid planes.
4. **Manual interaction** — Playwright click-through: a plot question in Know and in Show places a
   point by click, grades correctly, reveals the answer, and is reachable/placeable by keyboard.

## 10. Delivery

SOLO work commits direct to `main` (Vercel auto-deploys). Code changes (new type + content) reach
students on deploy; no SQL or program-docx changes (resources unchanged). Co-author: Claude Opus 4.8.
