# Unit 38 — Progress Log

**Topic:** Chance & Data (collect/tabulate data; probability as fractions; frequency vs probability;
random generators; observed vs expected & randomness; fairness; sampling with replacement; interpreting
& comparing data displays; bias & misleading media data). Stage 3 Year B. Source: `DoE Unit 38.zip` (8 lessons).

**Outcomes (13):** R1–R4, Y1–Y6, G1–G3.
- R1 collect data · R2 organise data in tables · R3 probability as a fraction · R4 frequency & probability
- Y1 random generators · Y2 observed vs expected · Y3 fairness · Y4 sampling with replacement ·
  Y5 interpret/compare data displays · Y6 bias & misleading media data
- G1 sample space & P(event) (`MA4-PRO-C-01`) · G2 relative frequency & complementary events
  (`MA4-PRO-C-01`) · G3 classify data & choose graphs (`MA4-DAT-C-01`)

**Band rule applied (2026-06-20):** all Data A content → Red (R1, R2). R3/R4 are group B but
foundational/single-step → Red (allowed). Applying group-B chance & data → Yellow. Green = Stage 4 Core.

## Session — 2026-06-20 — Deliverable B (Stages 0–5) COMPLETE

- **Stage 0** rubric → `00_rubric_draft.md`. SC from the per-lesson Syllabus LI/SC tables; A/B from the DoE
  "Outcomes and content" grid (Table 22). 13 outcomes.
- **Stage 1** mapping → `01_mapping_review.md`. Verbatim NESA content points + DoE lessons; all 17 core SC
  mapped. Stage 4 codes verified against the syllabus PDF (PRO p.67, DAT p.64).
- **Stage 2** program docx → `Maths_S3_YearB_Unit38_SOLO_Full_Program.docx` (+ .pdf). LibreOffice round-trip
  clean; page 1 fits one page; Outcome Teaching Record on page 2 with Year A/B labels; hands-on lesson cards
  render with the "Physical materials needed" strip; tblGrid sanity OK (1-col wrappers + 4-col card grids).
- **Stage 3** resources → `03_resources_staged.csv`. 39 resources (13 outcomes × 3). **All verified:**
  26 YouTube videos oEmbed-verified live with matching titles; 9 Corbettmaths worksheets curl HTTP 200.
  No duplicate URLs within any outcome. **All labels comma-free** (avoids the u37 CSV-parse pitfall).
- **Stage 4** SQL → `04_insert.sql`. 39 rows, `unit_id='u38'`, scope='global'. Generated from the CSV with
  CSV parsing + apostrophe escaping + strict 7-field validation (0 malformed). **NOT executed.**
- **Stage 5** appendix → `Unit38_Resource_Appendix.docx` (standalone) + merged into the program.

**Committed:** Deliverable B output in `units/u38/`.

### ⏸ GATE — waiting on Nick
SQL `units/u38/04_insert.sql` is ready to run in Supabase (expect **39 rows** for `unit_id='u38'`).
After it's inserted, confirm the row count, then start **Deliverable A** (in-app unit in `solo/index.html`).
Resources are **DB-canonical** for u38 — do NOT hardcode a RESOURCES block.

## Next (Deliverable A — not started)
- Author 6 data structures in `solo/index.html` keyed `u38` / `u38_oid`: UNITS, PRETESTS, PRACTICE,
  BEYOND, LEARN (+ UC colour theme distinct from u24–u37, gating list). RESOURCES from the DB (no hardcode).
- Gate: 0 console errors via Playwright before adding the UNITS entry + committing once.
