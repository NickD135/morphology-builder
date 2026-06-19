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
