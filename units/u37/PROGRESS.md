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

## Session 2 — 2026-06-20 — Deliverable A COMPLETE

SQL confirmed inserted in Supabase (REST API check via anon key: **42 rows**, exactly 3 per outcome
— 2 video + 1 worksheet — across all 14 outcomes; both `JoAnn's` apostrophes stored correctly).
Resources are DB-canonical: **no hardcoded RESOURCES block** for u37 (verified 0 `u37_` keys in the
RESOURCES var).

Authored all six data structures in `solo/index.html` (keyed `u37` / `u37_oid`):
- **UNITS** — u37 entry, 14 outcomes (R1–R6, Y1–Y5, G1–G3), 10 Show questions each.
- **PRETESTS** — `u37` block, 2 per outcome.
- **PRACTICE** (Know) — 14 `u37_oid` entries, example[4] + ~9 questions each.
- **BEYOND** — `u37` (Stage 4 links + 4 projects ×5–6 tasks).
- **LEARN** (Grow) — 14 full lessons, 3-step hint ladder on every tryIt.
- **UC** colour theme `u37` = slate (`#475569` dot — distinct from the 13 saturated hues in use);
  added `||unit.id==="u37"` to the student gating list.

**Verification (gate passed):**
- Node-eval of the extracted blocks: structure OK (6 blocks, 14 outcomes, MC answer∈options, no dup
  options, 3-hint ladders, counts), and **all 148 input questions pass arithmetic checks**.
- Playwright load of `solo/index.html`: page compiles + React mounts; **0 code console errors**
  (only the environmental `favicon.ico` 404 + standard in-browser Babel notice, present on every load).

**Committed** to `solo/index.html`. Unit 37 fully complete (both deliverables).

## Session 3 — 2026-06-22 — Visuals/interactive pass (UNIT_REVIEW_PLAYBOOK)

u37 was built before the visual-upgrade playbook pass applied to u27–u36. Resources were already
DB-verified/canonical (42 rows) and alignment was sound, so this pass was purely Phase 5/6 visuals.

Added (all using existing, shipped Visual/Interactive components — no new types):
- **Grow (LEARN):** worked `visual` on the workedExample of all 11 spatial outcomes (r3,r4,r5,r6,
  y1,y2,y3,y4,y5,g1,g2) + 2 interactive widgets — `interactive` area model on **r3** and
  `interactive` volume builder on **r6**.
- **Know (PRACTICE):** worked `exampleVisual` on the same 11 spatial outcomes + 1 structure-only
  question visual (r3 q1).
- **Show (UNITS):** 14 structure-only question visuals (areaModel showProducts:false, areaShape
  rect/parallelogram/triangle, prismVolume, polygon house, solid3d triPrism) across r3,r4,r5,r6,
  y1,y2,y3,g1,g2 — structure-only per the assessment-integrity rule.
- **Pre/post test (PRETESTS):** 4 structure-only visuals (r3 areaModel, r4 rect, r6 prism, y1 parallelogram).
- g3 (prime factorisation / index notation) left without a visual — not spatial.

**Verify (3 gates passed):** Node parse of UNITS/PRETESTS/PRACTICE/LEARN OK; u37 areaModel &
prismVolume specs arithmetic-checked against answers; app render gate 0 code console errors
(favicon 404 only); standalone Visual harness rendered all 9 u37 spec families correctly (eyeballed),
then harness deleted. No resource changes → no SQL and no program-doc resync needed.

## Next
Unit 38 — visuals/interactive pass (same playbook Phase 5/6).
