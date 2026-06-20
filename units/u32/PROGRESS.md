# Unit 32 — Progress Log

Topic: **2D Space & Area** — symmetry, regular/irregular polygons, transformations (2DS-01, L1–3)
+ composite-figure / parallelogram / triangle area by rearrangement (2DS-02/03, L4–8), plus factors
(MR-01, L5). Stage 3 Year B. Source: `SOLO Units/SOLO Units/Unit 32/DoE Unit 32.zip`.

This task = the **Deliverable B / resources pipeline** (Stages 0–5 → `units/u32/`).

## ✅ STATUS: COMPLETE (2026-06-20) — 12 outcomes (R1–R4 · Y1–Y5 · G1–G3)

| Stage | Output | Status |
|---|---|---|
| 0 | `00_rubric_draft.md` | ✅ 12 SC; banded 4 Red / 5 Yellow / 3 Green |
| 1 | `01_mapping_review.md` | ✅ verbatim NESA content points + DoE lessons; Green = no DoE lesson |
| 2 | program docx (+pdf) | ✅ page 1 fits, 12-row record clean, 12 cards (4-col grid), 18pp incl. merged appendix |
| 3 | `03_resources_staged.csv` | ✅ 41 rows, 3–4/outcome, every URL live-verified (oEmbed + curl), no within-outcome dups |
| 4 | `04_insert.sql` | ✅ `unit_id='u32'`, scope global, class_id NULL — not executed |
| 5 | `Unit32_Resource_Appendix.docx` | ✅ standalone 3-page appendix |

### Band decision (for Nick)
Unit 32 is the **mirror of Unit 29**: ~90% content group **B** (transformations + area by rearrangement);
only symmetry/polygons (2DS-01 A) and factors (MR-01 A) are group A. A strict A→Red/B→Yellow split
would give ~2 Red / 7 Yellow, so banded by **SOLO cognitive demand** (recall/vocabulary → Red,
applying/spatial-reasoning → Yellow), content-group letter shown per outcome. **Confirm/override.**

### Green = Stage 4 Area `MA4-ARE-C-01` (the formal formulas)
G1 A=lb & A=bh (rectangle/parallelogram) · G2 A=½bh (triangle) · G3 composite area by dissection.
Stage 3 finds area by *rearrangement*; Stage 4 = the formulas — clean extension.

### Verification
17 YouTube videos oEmbed-verified (Math with Mr. J, Twinkl, Mr Morley Maths, IconMath, Virtual
Elementary School, etc.); 10 Corbettmaths PDFs + 4 Maths-is-Fun interactives curl-verified (200).
docx well-formed; 12 four-col grids; 12 Activate + 12 Check; 61 hyperlinks; appendix + checklist present.

Outstanding: Nick runs `04_insert.sql`.

### Outcome → Mini Lesson map
R1→1 R2→2 R3→3 Y1→4 R4→5 Y2→6 Y3→7 Y4→8 Y5→9 G1→10 G2→11 G3→12

---

## Session 2026-06-20 — Deliverable A (in-app SOLO Tracker build) — COMPLETE

Built the playable in-app unit in `solo/index.html` (2D Shapes & Area). All 12
outcomes (R1–R4 · Y1–Y5 · G1–G3 — no Y6) authored across every data structure;
inserted after u31.

- UNITS u32: 12 outcomes × 10 Show questions, banded red→yellow→green
- PRETESTS 12×2; PRACTICE (Know) 12×(example[4]+9 Q); LEARN (Grow) 12 lessons, 3-step hint ladder on every try-it
- BEYOND u32: 10 Stage-4 area resources + 4 book projects (Area Architect, Composite Shape Challenge, Transformation Station, Factors & Shapes)
- UC teal theme (#14b8a6) + student gating updated
- RESOURCES DB-canonical (41 rows verified) — 0 hardcoded u32 keys

Verification: Node-eval all blocks (MC answer ∈ options, no dups, all area
arithmetic re-checked, 3-hint ladders); Playwright 0 console errors; window.UNITS
live with u32 (12 outcomes). BEYOND website links HTTP 200 (one 404 Maths-is-Fun
triangle-area URL swapped for the working parallelogram page). Committed + pushed.
