# Unit 30 — Progress Log

Topic: **Angles & Time** — measure/create/classify angles + angle relationships (GM-03, Lessons 1–5)
+ 12/24-hour time, elapsed time & duration (NSM-02, Lessons 6–8). Stage 3 Year B.
Source: `SOLO Units/SOLO Units/Unit 30/DoE Unit 30.zip` → `Mathematics-Stage3-Unit30.docx`.

This task = the **Deliverable B / resources pipeline** (Stages 0–5 → `units/u30/`), not the in-app build.

---

## ✅ STATUS: COMPLETE (2026-06-19)

All five stages done and verified; **13 outcomes** (R1–R4 · Y1–Y6 · G1–G3).

| Stage | Output | Status |
|---|---|---|
| 0 | `00_rubric_draft.md` | ✅ 18 SC extracted; banded 4 Red / 6 Yellow / 3 Green |
| 1 | `01_mapping_review.md` | ✅ every outcome → verbatim NESA content point + DoE lesson; Green = "no DoE lesson" |
| 2 | `Maths_S3_YearB_Unit30_SOLO_Full_Program.docx` (+ `.pdf`) | ✅ page 1 fits, 13-row record clean, 13 cards (4-col grid), 19pp incl. merged appendix |
| 3 | `03_resources_staged.csv` | ✅ 42 rows, 3–4 per outcome, **every URL verified live** (oEmbed + curl), zero within-outcome dups |
| 4 | `04_insert.sql` | ✅ DELETE+INSERT, `unit_id='u30'`, `scope='global'`, `class_id=NULL` — **not executed** |
| 5 | `Unit30_Resource_Appendix.docx` | ✅ standalone 3-page landscape appendix |

### Band decision
Unit 30 **fits the validated A→Red / B→Yellow rule cleanly** (unlike Unit 29): it pairs the A and B
content groups of both strands — Geometric Measure A (measure/create/classify angles) + B (angle
relationships); Non-spatial Measure A (12/24-hour convert & timetables) + B (elapsed time & duration).
Applied straight; no SC moved bands.

### Green = Stage 4 group A, all `MA4-ANG-C-01` (Angle relationships)
- G1 — complementary, supplementary, vertically opposite angles
- G2 — find unknown angles using angle relationships, with reasons
- G3 — corresponding / alternate / co-interior angles on parallel lines (transversal)
> **Green is angle-only.** NSW Stage 4 has **no Time focus area** (time is a Stage 3 terminal topic),
> so there is no Stage 4 A content point to cite for a "time" Green outcome — documented, not fabricated.

### Build notes
- Program docx has the resource appendix **merged** (`resource_appendix_attached: true`); standalone
  `Unit30_Resource_Appendix.docx` also emitted (Stage 5). Follows Unit 28/29 precedent.
- WM descriptions + `syllabus_strands_summary` kept short from the outset (the Unit 29 page-1 overflow
  lesson) → page 1 fits first time.

### Verification evidence
- 21 YouTube videos oEmbed-verified live (Math with Mr. J, Corbettmaths, TutWay, Dr Frost Maths,
  Mr Mathematics, Miacademy, eSpark, Cognito); 7 Corbettmaths PDFs + 4 Maths-is-Fun interactives
  curl-verified (HTTP 200).
- `document.xml` well-formed; 13 four-column lesson-card grids; 13 Activate + 13 Check steps;
  59 working hyperlinks; appendix + worksheet checklist present; no blank/orphan pages.

Outstanding: Nick runs `04_insert.sql` in Supabase.

---

## Outcome → Mini Lesson map
R1→1 R2→2 R3→3 Y1→4 Y2→5 Y3→6 Y4→7 G1→8 G2→9 G3→10 R4→11 Y5→12 Y6→13
(DoE order: Angles cluster L1-5 first with the Stage-4 angle Green cards beside it, then Time cluster L6-8.)

---

## Session 2026-06-20 — Deliverable A (in-app SOLO Tracker build) — COMPLETE

Built the playable in-app unit in `solo/index.html` (Angles & Time), matching the
Unit 28 / Unit 26 gold standard. All 13 outcomes (R1–R4 · Y1–Y6 · G1–G3) authored
across every data structure; inserted after u29.

- UNITS u30: 13 outcomes × 10 Show questions, subtitle "Angles & Time", banded red→yellow→green
- PRETESTS u30: 13 × 2; PRACTICE (Know): 13 × (example[4]+9 Q); LEARN (Grow): 13 lessons, 3-step hint ladder on every try-it
- BEYOND u30: 11 Stage-4 angle resources + 4 book projects (Angle Detective, Parallel Lines & Transversals, Timetable Master, Angles All Around)
- UC fuchsia theme (#d946ef) + student gating updated
- RESOURCES: DB-canonical (42 rows verified) — 0 hardcoded u30 keys

Verification: Node-eval of all blocks (MC answer ∈ options, no dups, arithmetic/time
conversions checked, 3-hint ladders, ≥7 practice Qs); Playwright 0 real console errors
(only favicon 404 + Babel warning); window.UNITS confirmed live with u30; 3 new
Maths-is-Fun BEYOND links HTTP 200. Committed + pushed to main.
