# SOLO Written Pre/Post Test Builder

A repeatable recipe for turning any unit's SOLO outcomes into a printable,
written-response pre/post test that looks identical to the Unit 27 one, ready to
drop into the unit folder.

Two files do the work:

- **`build_solo_assessment.js`** — the generator engine. Fixed house style. You
  edit only the `UNIT` and `BOXES` block at the top.
- **`SOLO_Assessment_Builder.md`** — this file. The process, the prompt, the
  scaffold catalogue and the style reference.

---

## The prompt

Paste this to Claude (or hand it the two files in Claude Code), filling in the
unit:

> Build a SOLO written pre/post test for **Unit \_\_ (\_\_\_\_\_\_\_\_\_\_)**, following
> `SOLO_Assessment_Builder.md` and using `build_solo_assessment.js` as the engine.
>
> 1. Find the unit's success criteria from its `unit_data.js` `outcomes[]` (or the
>    SOLO program / the Student rubric). Use the **same wording as the rubric**,
>    keep the Red/Yellow/Green grouping and the tracker codes, and follow the js if
>    multiplication is split into area-model and algorithm outcomes.
> 2. For each criterion write **2–4 written-response questions** with a matching
>    answer. No multiple choice. Year 5–6 context, Australian spelling, no Oxford
>    commas. Check every answer.
> 3. Pick the right scaffold per question from the catalogue (area model, working
>    box, table of values, blank grid, writing lines, inline blanks).
> 4. Put it all into the `BOXES` array in the engine, set `UNIT`, run it, then
>    validate and render-check. It must come out **6 pages** (Red/Yellow/Green test,
>    then the same for the answer key), one band per page.
> 5. Save as `Unit_NN_<Name>_PRE_POST_TEST.docx` in the unit folder.

---

## Process

### 1 — Locate the assessment
Pull the outcomes from, in order of preference: the unit's `unit_data.js`
(`outcomes[]`, each `{code, desc}`), the SOLO program doc, or the Student rubric.
There are 18 — six Red (R1–R6), six Yellow (Y1–Y6), six Green (G1–G6). The
**`sc` text must match the rubric** so the test, rubric and tracker line up.
If a unit splits an outcome (e.g. R1 area model vs R6 algorithm), follow the js.

### 2 — Write the questions
Per criterion, 2–4 items that a student writes answers to. Rules:
- **No multiple choice** — students need space to work and write.
- Year 5–6 contexts, Australian spelling, no Oxford commas, no AI-style hyphens.
- Every item needs a correct worked answer for the key. Double-check the maths.
- Diagnostic depth: enough to show whether the criterion is met, not a worksheet.

### 3 — Choose scaffolds
Match the question type to a builder (see catalogue). The scaffold is what makes
the test *written* rather than multiple choice — a grid to fill, a box to work in,
lines to write on.

### 4 — Build
Open `build_solo_assessment.js`. Set `UNIT` (number, name, outfile). Replace the
`BOXES` array with the unit's boxes. Run:

```bash
node build_solo_assessment.js
```

### 5 — Validate and render-check
```bash
F=/mnt/user-data/outputs/Unit_NN_<Name>_PRE_POST_TEST.docx
python /mnt/skills/public/docx/scripts/office/validate.py "$F"          # expect: All validations PASSED!
python /mnt/skills/public/docx/scripts/office/soffice.py --headless --convert-to pdf "$F"
pdfinfo "${F%.docx}.pdf" | grep Pages                                    # expect: 6
pdftoppm -jpeg -r 100 "${F%.docx}.pdf" /tmp/chk                          # eyeball pages 1 & 3
```
Confirm: 6 pages, each band on one page, questions spread (not bunched), answers
green on the key. If a band spills to a second page, see **Tuning** below.

### 6 — Name and place
`Unit_NN_<Name>_PRE_POST_TEST.docx`, dropped in the unit folder beside the rubric
and program.

---

## Scaffold catalogue

| Question / outcome type | Scaffold | Builder |
|---|---|---|
| Multiplication by partitioning | Area-model grid (partitions given, cells blank, Total line) | `areaModel(top, left, total, a)` |
| Standard written algorithm; any working/diagram | Bordered working box with a problem label | `algoBox(problem, answer, a)` (alias `workingBox`, pass `w,h` to resize) |
| Patterns, multiples, simple data | Table of values to complete | `tableOfValues(hLabel, headers, dLabel, data, a)` |
| Coordinate plane, place-value chart, hundreds-chart slice | Blank grid to plot/fill | `numberGrid(cols, rows, cellH, cellW)` |
| Computation / short answer | Inline answer blank | `qLine(text, ans, a, blankLen)` |
| Multi-step / word problem | Prompt + blank working lines + answer line | `q(text)` then `lines(n)` then `longAnswer(ans, a)` |
| Explain / justify | Full-width ruled line(s) | `longAnswer(ans, a)` or `lines(n)` |
| Plain instruction above questions | Italic grey line | `instr(text)` |

Need a diagram the kit doesn't have (number line, angle to measure, shape to
draw)? Add a small builder beside `numberGrid` following the same pattern — a
table of blank cells, or a `workingBox` sized for the task — and use it in a box.

---

## `BOXES` data format

Each box is one success criterion:

```js
{ band:"RED", code:"R3", sc:"determine factors and products, ...", build:(a)=>[
    instr("Answer the following."),
    qLine("a)  List all the factors of 24.", "1, 2, 3, 4, 6, 8, 12, 24", a, 40),
    qLine("b)  ...", "ans", a),
] }
```

- `band` — `"RED"`, `"YELLOW"` or `"GREEN"`.
- `code` — tracker code (also the coloured chip on the box).
- `sc` — success-criterion wording (matches the rubric).
- `build(a)` — returns an array of children. `a` is `false` on the test pass and
  `true` on the answer-key pass; the helpers fill answers (green) when `a` is true.

Worked examples for each scaffold are already in the engine's `BOXES` (the Unit 27
set) — copy the closest one and edit.

### `ORDER`
Controls the 2×3 grid order within each band (left→right, top→bottom). Put the
structure-heavy / most-formal outcome **last** so it lands bottom-right and isn't
crammed beside the first box — e.g. Unit 27 uses `R1,R2,R3,R4,R5,R6` so the
algorithm (R6) is last, not next to the area model (R1).

---

## House style (fixed — don't change)

- **Page** A4 portrait, 0.2 inch margins all round (288 twips), footer with page
  number + unit/syllabus reference.
- **Structure** one band per page; six boxes in a two-column 2×3 grid under a
  band bar; test is 3 pages (Red/Yellow/Green), answer key repeats for 3 more = 6.
- **Palette** (sampled from the SOLO programs):

  | Use | Hex |
  |---|---|
  | Title bar (navy) | `1F3864` |
  | Section / steel accents | `2E5F8A` |
  | Red band + chip | `C00000` |  
  | Yellow band + chip (gold) | `7F6000` |
  | Green band + chip | `375623` |
  | Red / Yellow / Green header tints | `FCDBD9` / `FFF9E6` / `EBF3E6` |
  | Grid header tint | `D6E4F0` |
  | Answer ink (green) | `375623` |
  | Borders (hairline ~0.2pt) | `BFBFBF` |
  | Info strip / answer-key strip | `F2F4F7` / `FFF9E6` |

- **Type** Arial throughout. Code chip 19 bold, success criterion 17 bold,
  questions 19, instructions 15 italic grey, band bar 22 bold white.
- **Answer key** a second full copy with answers in green and an "ANSWER KEY"
  strip; never printed for students.

---

## Tuning (only if a band overflows its page)

The box rows are stretched to fill the page and the questions are spaced to spread
down the box. Both sit just under their ceilings, so a longer-than-usual band can
tip onto a second page. Fixes, in order:

1. **Question spacing** — lower `Q_AFTER` (default `370`; ceiling ≈ `380`). Drop in
   steps of ~40 and rebuild until back to 6 pages.
2. **Row height** — lower `ROWH_PLAIN` (default `4740`; ceiling ≈ `4760`) and/or
   `ROWH_INFO` (default `4380`; ceiling ≈ `4400`).
3. **Content** — if one box is genuinely too tall, trim a sub-question or shorten a
   word problem rather than shrinking the whole band.

Re-run the validate + page-count check after any change. Target is always **6
pages, one band per page**.

---

## Quick checklist

- [ ] `sc` wording matches the rubric; codes and bands correct
- [ ] 2–4 written items per box, no multiple choice, answers verified
- [ ] right scaffold per question; structure-heavy outcome ordered last
- [ ] Australian spelling, no Oxford commas
- [ ] builds, validates, renders at **6 pages**, questions spread, answers green
- [ ] saved as `Unit_NN_<Name>_PRE_POST_TEST.docx` in the unit folder
