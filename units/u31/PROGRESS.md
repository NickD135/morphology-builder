# Unit 31 — Progress Log

Topic: **Number** — place value to 1 billion & decimals to thousandths (RN-01/RN-02, L1–2);
percentages (RN-03, L3); multiplicative patterns (MR-01, L4); multiplication & division (MR-01, L5–6);
multiply/divide decimals by powers of 10 (MR-01, L7); missing numbers (MR-02, L8). Stage 3 Year B.
Source: `SOLO Units/SOLO Units/Unit 31/DoE Unit 31.zip` → `Mathematics-Stage3-Unit31.docx`.

This task = the **Deliverable B / resources pipeline** (Stages 0–5 → `units/u31/`), not the in-app build.

---

## ✅ STATUS: COMPLETE (2026-06-19)

All five stages done and verified; **13 outcomes** (R1–R4 · Y1–Y6 · G1–G3).

| Stage | Output | Status |
|---|---|---|
| 0 | `00_rubric_draft.md` | ✅ 23 SC extracted; banded 4 Red / 6 Yellow / 3 Green |
| 1 | `01_mapping_review.md` | ✅ every outcome → verbatim NESA content point + DoE lesson; Green = "no DoE lesson" |
| 2 | `Maths_S3_YearB_Unit31_SOLO_Full_Program.docx` (+ `.pdf`) | ✅ page 1 fits, 13-row record clean, 13 cards (4-col grid), 19pp incl. merged appendix |
| 3 | `03_resources_staged.csv` | ✅ 46 rows, 3–4 per outcome, **every URL verified live** (oEmbed + curl), zero within-outcome dups |
| 4 | `04_insert.sql` | ✅ DELETE+INSERT, `unit_id='u31'`, `scope='global'`, `class_id=NULL` — **not executed** |
| 5 | `Unit31_Resource_Appendix.docx` | ✅ standalone 3-page landscape appendix |

### Band decision
Unit 31 **fits the validated A→Red / B→Yellow rule cleanly**: it pairs the A and B content groups
across both Number strands — Represents Numbers A (place value, decimals) + B (percentages);
Multiplicative Relations A (multiply, divide) + B (patterns, ×÷ powers of 10, number sentences).
Applied straight; no SC moved bands.

### Green = Stage 4 group A — three Number focus areas extending the unit's own work
- G1 — percentage of a quantity; percentage increase/decrease — `MA4-FRC-C-01` (extends Y1/Y2)
- G2 — order of operations with grouping symbols — `MA4-INT-C-01` (extends R3/R4/Y6)
- G3 — solve simple linear equations using pronumerals — `MA4-EQU-C-01` (extends Y6)

### Build notes
- Program docx has the resource appendix **merged** (`resource_appendix_attached: true`); standalone
  `Unit31_Resource_Appendix.docx` also emitted (Stage 5).
- **Page-1 layout fix (unit data, not template):** Unit 31 spans 5 Stage-3 outcomes → 7 syllabus-outcome
  rows + a long title initially overflowed page 1's left column. Shortened the unit title to
  "Number & Multiplicative Relations", condensed the outcome descriptors, and dropped the combined
  Stage-4 row from the top outcome list (Stage-4 codes still cited per-outcome in the record + cards)
  → page 1 fits. WM/strands summary kept short from the start.

### Verification evidence
- 28 YouTube videos oEmbed-verified live (mostly Math with Mr. J, plus Miacademy, NUMBEROCK,
  STEAMspirations, Easy Math with Mrs. Easley, Twinkl); 7 Corbettmaths PDFs + Maths-is-Fun interactives
  curl-verified (HTTP 200).
- `document.xml` well-formed; 13 four-column lesson-card grids; 13 Activate + 13 Check steps;
  63 working hyperlinks; appendix + worksheet checklist present; no blank/orphan pages.

Outstanding: Nick runs `04_insert.sql` in Supabase.

---

## Outcome → Mini Lesson map
R1→1 R2→2 Y1→3 Y2→4 G1→5 Y3→6 Y4→7 R3→8 R4→9 G2→10 Y5→11 Y6→12 G3→13
(DoE order L1-8, with each Stage-4 Green card placed beside the Stage-3 work it extends.)

---

## Session 2026-06-20 — Deliverable A (in-app SOLO Tracker build) — COMPLETE

Built the playable in-app unit in `solo/index.html` (Number — Place Value,
Percentages & Operations). All 13 outcomes (R1–R4 · Y1–Y6 · G1–G3) authored across
every data structure; inserted after u30.

- UNITS u31: 13 outcomes × 10 Show questions, banded red→yellow→green
- PRETESTS 13×2; PRACTICE (Know) 13×(example[4]+9 Q); LEARN (Grow) 13 lessons, 3-step hint ladder on every try-it
- BEYOND u31: 11 Stage-4 resources + 4 book projects (Smart Shopper, Order of Operations Challenge, Equation Solver, Big Numbers Small Numbers)
- UC amber theme (#f59e0b) + student gating updated
- RESOURCES DB-canonical (46 rows verified) — 0 hardcoded u31 keys

Verification: Node-eval all blocks (MC answer ∈ options, no dups, full arithmetic
re-check of ×÷/percentages/place-value/equations, 3-hint ladders); Playwright 0
console errors; window.UNITS live with u31; 3 new Maths-is-Fun BEYOND links HTTP 200.
Committed + pushed to main.

---

## Session 2026-10-12 — Y5 (× and ÷ decimals by powers of 10) visual upgrade (improvement agent, PR)

Y5 had no visual anywhere, although digits moving between places is a spatial idea. Its Know
practice also reused 7 of the 9 Show/post-test calculations (3.5 × 10, 4.2 ÷ 10, 25 ÷ 100…).

- New static visual `pvShift` (place value chart, before/after rows, fixed red decimal point,
  orange placeholder zeros) and new interactive `placeShift` (× / ÷ 10, 100, 1000 buttons plus a
  "Mystery move" challenge: work out which operation turned one number into another)
- Grow: hook reveal, worked example (now 4.7 × 100) and two try-its use the chart; try-its use
  fresh numbers (2.7 × 10, 6.3 ÷ 10, 0.8 × 1000) with hints that do not give the answer until step 3
- Know: 10 new questions with fresh numbers, a hint on every question, a `why` line, a chart on the
  first three (scaffold fades), a placeholder-zero item (6 ÷ 100), an "add a zero" misconception
  item (5.2 × 10 = 5.20?) and a challenge item (0.072 × ? = 72)
- Show and PRETESTS unchanged (outcome id unchanged; no new DB rows needed)
- Checked in mock mode (tests/mock) as Ben and Chloe, 1366 and 1024 px, low stim and reduced motion

---

## Session 2026-10-12 (later) — whole-unit audit (improvement agent, same PR)

Nicholas asked for all of Unit 31 to be audited with the same eye as Y5, and for SOLO fixes to be
made across a whole unit at once.

- **Know (all 13 outcomes):** 130 questions with fresh numbers. None repeats a Show or pre/post-test
  question (before: up to 7 of 9 per outcome did). Every question has a hint (shown after a wrong
  try) and a why line. Visual scaffolds on early questions (place value chart, area model, column
  layout, number line for remainders, bar models for missing numbers and equations). Each outcome
  ends with a Challenge item.
- **Grow (all 13):** worked examples, try-its and hooks moved off Show numbers. Hint ladders hold the
  answer back until step 3. y6 now models a two-operation sentence (the outcome says "more than
  one operation"). r4 hook has a number line for the remainder. g3 and y6 worked examples have bar
  models. r3 now explains what factorising means.
- **Show fixes:** r3 Q6 wording was wrong ("multiply by 25 twice"). y4 Q9 had two correct options.
  r1 had no partitioning question (added two). r4 only assessed rounding remainders up (added a
  round-down problem and a 3-digit sharing problem). y6 had no two-operation sentences (added two).
  g3 never assessed writing an equation (added one). y3 Q5 reworded. Pre/post tests unchanged.
- **Beyond:** projects no longer reuse Show values; US PEMDAS video replaced.
- **Resources:** `solo/u31_resources_fix.sql` (targeted delete/update/insert, for Nicholas to run).
  `unit_data_31.js` updated to match. Full program docx/pdf and Resource Appendix rebuilt
  (note: built with docx 9.7.1, the only version available offline; same 20 pages).
- Verified: a Node validator over the u31 data (MC answers are among their options, no duplicate
  options, arithmetic, missing-number and equation solutions, % of, remainders, 3 hints per
  try-it, no Show overlap); every Know question answered correctly in the browser in mock mode
  (130/130); every Grow lesson stepped through; no page errors.
