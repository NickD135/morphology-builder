# Unit 37 — Progress Log

**Topic:** Multiplicative Relations & Measurement (products/factors/primes, area model, area of
rectangles/parallelograms/triangles, volume of rectangular prisms cm³/m³, efficient multiplication,
volume problems). Stage 3 Year B. Source: `DoE Unit 37.zip` (8 lessons).

**Outcomes (14):** R1–R6, Y1–Y5, G1–G3.
- R1 products & factors · R2 prime/composite · R3 area model · R4 rectangle area (m²) · R5 same
  perimeter/different dimensions · R6 volume of rect prisms (layers, cm³)
- Y1 area of parallelogram · Y2 area of triangle · Y3 volume in m³ · Y4 efficient multi-digit
  multiplication · Y5 volume problems
- G1 area formulas & composite figures (`MA4-ARE-C-01`) · G2 volume of prisms V=Ah (`MA4-VOL-C-01`)
  · G3 prime factorisation & divisibility (`MA4-IND-C-01`)

**Band rule applied (2026-06-20 policy):** all Section/Group A content points → Red (R1–R5 are all
group A). R6 is group B but foundational/single-step → Red (allowed). Applying group-B work →
Yellow. Green = Stage 4 Core.

## Session 1 — 2026-06-20 — Deliverable B (Stages 0–5) COMPLETE

- **Stage 0** rubric → `00_rubric_draft.md`. SC extracted from the per-lesson Syllabus LI/SC tables;
  A/B read from the DoE "Outcomes and content" grid (Table 24). 14 outcomes.
- **Stage 1** mapping → `01_mapping_review.md`. Verbatim NESA content points + DoE lessons; all 22
  core SC mapped. Stage 4 codes verified against the syllabus PDF (ARE p.59, VOL p.61, IND p.54).
- **Stage 2** program docx → `Maths_S3_YearB_Unit37_SOLO_Full_Program.docx` (+ .pdf). Built from
  `unit_data_37.js`. LibreOffice round-trip clean; page 1 fits one page (trimmed content-point lines
  after first build overflowed 2 lines); Outcome Teaching Record on page 2 with Year A/B labels;
  lesson cards render correctly. tblGrid sanity checked (1-col wrappers around 4-col card grids).
- **Stage 3** resources → `03_resources_staged.csv`. 42 resources (14 outcomes × 3). **All verified:**
  28 YouTube videos oEmbed-verified live with matching titles; 13 Corbettmaths worksheets curl HTTP 200.
  No duplicate URLs within any outcome.
- **Stage 4** SQL → `04_insert.sql`. 42 rows, `unit_id='u37'`, scope='global'. Generated from the CSV.
  **NOT executed — Nick runs it in Supabase.**
- **Stage 5** appendix → `Unit37_Resource_Appendix.docx` (standalone) + merged into the program.

**Committed:** Deliverable B output in `units/u37/`.

### ⏸ GATE — waiting on Nick
SQL `units/u37/04_insert.sql` is ready to run in Supabase (expect **42 rows** for `unit_id='u37'`).
After it's inserted, confirm the row count (`SELECT count(*) FROM resources WHERE unit_id='u37'`),
then start **Deliverable A** (in-app unit in `solo/index.html`). Resources are **DB-canonical** for
u37 — do NOT hardcode a RESOURCES block; the app reads the DB and it overrides hardcoded resources.

## Next (Deliverable A — not started)
- Author 6 data structures in `solo/index.html` keyed `u37` / `u37_oid`: UNITS, PRETESTS, PRACTICE,
  BEYOND, LEARN (+ UC colour theme, gating lists). RESOURCES come from the DB (no hardcode).
- Colour theme: pick one distinct from u24 blue / u25 green / u26 purple / u27 orange / u28 cyan /
  u36. (Suggest a warm/rose or amber not yet used — confirm against existing UC entries.)
- Gate: 0 console errors via Playwright before adding the UNITS entry + committing once.
