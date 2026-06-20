# Unit 40 — Progress Log

**Topic:** Integers, Decimals, Percentages & the Cartesian Plane (compare/order decimals; integers on a
number line; benchmark FDP & finding 10%; ×/÷ decimals by powers of 10; Cartesian coordinates in 4
quadrants; percentage discounts; add/subtract decimals & multistep word problems; multiplying decimals with
estimation; order of operations). Stage 3 Year B. Source: `DoE Unit 40.zip` (8 lessons).

**Outcomes (13):** R1–R5, Y1–Y5, G1–G3.
- R1 compare/order decimals · R2 integers on a number line · R3 benchmark FDP & 10% ·
  R4 ×/÷ decimals by powers of 10 · R5 the Cartesian coordinate system (4 quadrants)
- Y1 percentage discounts · Y2 add/subtract decimals · Y3 multistep word problems ·
  Y4 multiply decimals (mental & estimate) · Y5 order of operations & brackets
- G1 add/subtract/order integers (`MA4-INT-C-01`) · G2 percentages of quantities & change
  (`MA4-FRC-C-01`) · G3 plot points & linear relationships (`MA4-LIN-C-01`)

**Band rule applied (2026-06-20):** RN-A decimals (R1) + GM-A Cartesian system (in R5) → Red (mandatory).
R2/R3/R4 are group B but foundational/single-step → Red. Applying group-B work → Yellow. Green = Stage 4 Core.

> **SESSION NOTE (self-approved, Nick away):** Nick authorised self-approving all gates this session and will
> review on return. Green spreads across the three strongest Stage 4 anchors (integers, percentages,
> Cartesian/linear). R5 folds the GM-A grid-map-vs-number-plane concept (mandatory Red) with GM-B coordinate
> reading. Documented for review.

## Session — 2026-06-20 — Deliverable B (Stages 0–5) COMPLETE

- **Stage 0** rubric → `00_rubric_draft.md` (13 outcomes; A/B from the DoE "Outcomes and content" grid T26).
- **Stage 1** mapping → `01_mapping_review.md` (verbatim NESA points + DoE lessons; all 18 SC mapped;
  Stage 4 INT/FRC/LIN codes verified against the syllabus PDF).
- **Stage 2** program docx → `Maths_S3_YearB_Unit40_SOLO_Full_Program.docx` (+ .pdf). Page 1 fits one page
  (7 syllabus outcomes — dense but complete); Outcome Teaching Record on page 2 with Year A/B labels;
  hands-on number-line/coordinate lessons render with materials strips.
- **Stage 3** resources → `03_resources_staged.csv`. 39 resources (13 × 3). **All verified:** 24 videos
  oEmbed-verified live; worksheets curl HTTP 200. No within-outcome dup URLs; labels comma-free.
- **Stage 4** SQL → `04_insert.sql`. 39 rows validated (0 malformed). **NOT executed.**
- **Stage 5** appendix → `Unit40_Resource_Appendix.docx` (standalone) + merged into the program.

### ⚠️ RESOURCES = CODE-CANONICAL for u40 (Nick away)
Deliverable A will **hardcode** the RESOURCES block in `solo/index.html` (the u26/u27 pattern) so the unit is
fully functional now whether or not the SQL is run. `04_insert.sql` holds the **identical** rows for optional
DB promotion later (if run, DB rows override the identical hardcoded ones — no behaviour change; if Nick
prefers DB-canonical, delete the hardcoded u40 RESOURCES block after inserting, as was done for u39).

## Session 2 — 2026-06-20 — Deliverable A COMPLETE (code-canonical)

Authored all six structures in `solo/index.html` (keyed `u40` / `u40_oid`):
- UNITS (13 outcomes, 10 Show Q each), PRETESTS (2 each), PRACTICE/Know (example + ~9 each),
  BEYOND (Stage 4 links + 4 projects), LEARN/Grow (13 lessons, 3-step hint ladder on every tryIt),
  and a **hardcoded RESOURCES block** (code-canonical).
- UC theme `u40` = violet (`#8b5cf6`, distinct from u37 slate / u38 emerald / u39 stone); gating updated.

**Resource canonicality:** Initially shipped CODE-CANONICAL (hardcoded RESOURCES, DB empty). **Update
(same session): Nick then inserted `04_insert.sql`** — DB confirmed to hold **39 u40 rows identical to the
verified CSV**. To avoid the both-sources anti-pattern (DB rows win → hardcoded block becomes dead code), the
**hardcoded u40 RESOURCES block was removed**, leaving u40 **DB-canonical** like u37/u38/u39. Re-verified: all
six blocks eval clean and Playwright shows 0 code console errors after removal.

**Verification (gate passed):** Node-eval structure OK (13 outcomes, all 6 blocks incl. RESOURCES with ≥2
per outcome, MC answer∈options, no dup options, 3-hint ladders). Auto-arithmetic OK for all input questions
**except** the Y5 order-of-operations items, which the naive left-to-right checker false-flags — those answers
(2 + 3 × 4 = 14, 10 − 2 × 3 = 4, 6 + 8 ÷ 2 = 10, 3 × 4 + 5 = 17) are correct by BIDMAS and were hand-verified.
Playwright load: 0 code console errors (favicon 404 + Babel notice only).

**Committed.** Unit 40 fully complete (both deliverables). **All four units (37–40) done.**
