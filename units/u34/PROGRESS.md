# Unit 34 — Progress Log

Topic: **Measurement — Mass, Length, Perimeter & Decimals** — metric mass (g/kg/tonnes), metric length
(mm/cm/m/km), perimeter of rectangles (same-area comparisons), decimal notation to 3 dp, decimal add/sub
word problems, plus daily FDP equivalence and build-the-whole-from-a-part. Stage 3 Year B, multi-strand.
Source: `DoE Unit 34.docx`.

This task = the **Deliverable B / resources pipeline** (Stages 0–5 → `units/u34/`).

## ✅ STATUS: Deliverable B COMPLETE (2026-06-20) — 13 outcomes (R1–R4 · Y1–Y6 · G1–G3)

| Stage | Output | Status |
|---|---|---|
| 0 | `00_rubric_draft.md` | ✅ 16 core SC; banded 4 Red / 6 Yellow / 3 Green |
| 1 | `01_mapping_review.md` | ✅ verbatim NESA content points + DoE lessons; Green = no DoE lesson |
| 2 | program docx (+pdf) | ✅ page 1 fits, 13-row record clean, 13 cards, 18pp incl. merged appendix, **0 blank pages** |
| 3 | `03_resources_staged.csv` | ✅ 42 rows, 3–4/outcome, every URL live-verified (25 videos oEmbed + worksheets curl 200), no within-outcome dups |
| 4 | `04_insert.sql` | ✅ `unit_id='u34'`, scope global, class_id NULL — **NOT executed** (Nick runs it) |
| 5 | `Unit34_Resource_Appendix.docx` | ✅ standalone appendix |

### ⏳ NEXT: Nick runs `units/u34/04_insert.sql` in Supabase (42 rows), confirms row count → then Deliverable A.

### Band decision (for Nick)
Unit 34 core content is ~90% content group **B** (the new Year-6 measurement learning; the DoE unit's
prior-learning section confirms group-A measurement was last year). Banded by **SOLO cognitive demand**
(recall/single procedure → Red, applying/multi-step/word problems → Yellow), content-group letter shown
per outcome. Same call as Units 29, 32 and 33. Confirm/override.

### Multi-strand note
Unlike single-strand Units 29–33, Unit 34 weaves **mass · length · perimeter · decimals** around one big
idea ("what needs to be measured determines the unit"). Outcomes span NSM (mass), GM (length/perimeter),
RN/RQF (decimals + FDP + build-the-whole) and AR (decimal add/sub). Daily-number-sense strands (FDP, build-
the-whole) are explicitly taught/assessed here so they were KEPT as outcomes (R1, R4) — contrast Unit 33
where fraction warm-ups were excluded as non-core.

### Green = Stage 4 Area `MA4-ARE-C-01` + Length `MA4-LEN-C-01`
G1 area of triangles & parallelograms · G2 composite area + area-unit conversion · G3 composite perimeter
& circumference (C = πd). Both Stage 4 codes verified present in the NSW K-10 Syllabus (2022) outcomes list.

### Verification
25 YouTube videos oEmbed-verified live (Math with Mr. J for most; Miacademy, Corbettmaths, Partners in
Prime, Miss Hutchison for the rest) — exact titles/authors logged. All Corbettmaths PDFs + 2 Maths-is-Fun
interactives curl-verified HTTP 200. docx well-formed (22 tables, 128 hyperlinks); page 1 one page; 13-row
record clean; 0 blank pages (Mini Lesson 1 trimmed so header+L1 share page 3 without stranding the spacer).

### Outcome → Mini Lesson map (teaching sequence)
R1→1 R2→2 Y1→3 R3→4 Y6→5 R4→6 Y3→7 Y4→8 Y5→9 Y2→10 G1→11 G2→12 G3→13

---

## ✅ Deliverable A (in-app SOLO Tracker build) — COMPLETE (2026-06-20)

Built the playable in-app unit in `solo/index.html` (Measurement — Mass, Length, Perimeter & Decimals).
All 13 outcomes (R1–R4 · Y1–Y6 · G1–G3) authored across every data structure; inserted after u33.

- UNITS u34: 13 outcomes × 10 Show questions, banded red→yellow→green
- PRETESTS 13×2; PRACTICE (Know) 13×(example[4]+9 Q); LEARN (Grow) 13 lessons, 3-step hint ladder on every try-it
- BEYOND u34: 10 Stage-4 resources + 4 book projects (Area Architect, Circle Investigator, Measurement Master, Same Area Different Perimeter)
- UC **lime** theme (#84cc16) + student gating list updated (||unit.id==="u34")
- RESOURCES **DB-canonical** (42 rows verified live in Supabase) — 0 hardcoded u34 keys

**Verification:** SQL confirmed live in Supabase (42 rows, all 13 outcomes, 26 video + 16 worksheet).
Node-eval all blocks (MC answer ∈ options, no dup options, ≥8 Know Qs, full LEARN schema with 3-hint
ladders on every try-it); every numeric answer re-derived by hand (mass/length conversions, perimeter,
area incl. triangle/parallelogram/composite, circumference π≈3.14, decimal add/sub, build-the-whole).
Playwright load → React mounts, normal login landing, 0 real console errors (only an environmental
favicon 404). window.UNITS live with u34 (13 outcomes), 11 units total.

Both deliverables for Unit 34 are now complete. **Next: Unit 35 Deliverable B.**
