# Unit 35 — Progress Log

Topic: **Addition & Subtraction Strategies, Decimals & Percentages** — efficient add/subtract of large
numbers and decimals to 3 dp, percentages of quantities & discounts (10/25/50%), estimation &
reasonableness, elapsed time, multi-step word problems. Stage 3 Year B, multi-strand. Source: `DoE Unit 35.docx`.

This task = the **Deliverable B / resources pipeline** (Stages 0–5 → `units/u35/`).

## ✅ STATUS: Deliverable B COMPLETE (2026-06-20) — 13 outcomes (R1–R4 · Y1–Y6 · G1–G3)

| Stage | Output | Status |
|---|---|---|
| 0 | `00_rubric_draft.md` | ✅ 17 core SC; banded 4 Red / 6 Yellow / 3 Green |
| 1 | `01_mapping_review.md` | ✅ verbatim NESA content points + DoE lessons; Green = no DoE lesson |
| 2 | program docx (+pdf) | ✅ page 1 fits, 13-row record clean, 13 cards, 18pp incl. merged appendix, **0 blank pages** |
| 3 | `03_resources_staged.csv` | ✅ 42 rows, 3–4/outcome, every URL live-verified (oEmbed + curl), no within-outcome dups |
| 4 | `04_insert.sql` | ✅ `unit_id='u35'`, scope global, class_id NULL — **NOT executed** (Nick runs it) |
| 5 | `Unit35_Resource_Appendix.docx` | ✅ standalone appendix |

### ⏳ NEXT: Nick runs `units/u35/04_insert.sql` in Supabase (42 rows), confirms row count → then Deliverable A.

### Band decision (for Nick)
Unit 35 core content is ~90% content group **B** (the new Year-6 add/subtract learning; the DoE unit's
prior-learning section confirms group-A basics — 10/25/50% benchmarks, decimal add/sub modelling — were
the prior year). Banded by **SOLO cognitive demand**, content-group letter shown per outcome. Same call as
Units 29, 32, 33, 34. Confirm/override.

### Multi-strand note
Weaves additive relations (`AR-01`), percentages/decimals (`RN-03`), time (`NSM-02`) and multi-step
(`MR-02`) around one big idea — *choosing efficient strategies for addition and subtraction*. The daily
inverse-operations / number-sentence warm-ups (`MR-02`) were **excluded as non-core** (revisited content
already given full outcomes in Units 31/33 — same call as Unit 33's excluded fraction warm-ups).

### Green = Stage 4 Percentages `MA4-FRC-C-01`
G1 any percentage of a quantity · G2 percentage increase/decrease incl. GST · G3 reverse percentage
(unitary method). Verified present in the NSW K-10 Syllabus (2022) Stage 4 outcomes list (p.52).

### Verification
26 YouTube videos oEmbed-verified live (Math with Mr. J for most; Miacademy, Corbettmaths, EasyTeaching,
Mr. Tom Teaches, Third Space Learning, Charlotte Dooley, Khan Academy) — exact titles/authors logged. All
Corbettmaths PDFs + 2 Maths-is-Fun interactives curl-verified HTTP 200. docx well-formed (22 tables, 122
hyperlinks); page 1 one page; 13-row record clean; 0 blank pages.

### Outcome → Mini Lesson map (teaching sequence)
Y1→1 R4→2 Y2→3 R2→4 R3→5 R1→6 Y4→7 Y5→8 Y3→9 Y6→10 G1→11 G2→12 G3→13

---

## ✅ Deliverable A (in-app SOLO Tracker build) — COMPLETE (2026-06-20)

Built the playable in-app unit in `solo/index.html` (Add & Subtract Strategies, Decimals & Percentages).
All 13 outcomes (R1–R4 · Y1–Y6 · G1–G3) authored across every data structure; inserted after u34.

- UNITS u35: 13 outcomes × 10 Show questions, banded red→yellow→green
- PRETESTS 13×2; PRACTICE (Know) 13×(example[4]+9 Q); LEARN (Grow) 13 lessons, 3-step hint ladder on every try-it
- BEYOND u35: 9 Stage-4 resources + 4 book projects (Smart Shopper, Working Backwards, Decimal Detective, Time Planner)
- UC **sky** theme (#0ea5e9) + student gating list updated (||unit.id==="u35")
- RESOURCES **DB-canonical** (42 rows verified live in Supabase) — 0 hardcoded u35 keys

**Verification:** SQL confirmed live in Supabase (42 rows, all 13 outcomes, 26 video + 16 worksheet).
Node-eval all blocks (MC answer ∈ options, no dup options, ≥8 Know Qs, full LEARN schema with 3-hint
ladders on every try-it); every numeric answer re-derived by hand (percentages, decimal add/sub, elapsed
time, estimation, multi-step money, reverse percentages incl. GST). Playwright load → React mounts, normal
login landing, 0 real console errors (only an environmental favicon 404). window.UNITS live with u35
(13 outcomes), 12 units total.

Both deliverables for Unit 35 are now complete. **Next: Unit 36 Deliverable B.**
