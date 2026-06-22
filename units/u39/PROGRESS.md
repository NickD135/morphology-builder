# Unit 39 — Progress Log

**Topic:** Time, Transformations & Angles (classify/measure/draw angles; angle relationships
90°/180°/360°; identify angles in diagrams; translate/reflect/rotate & dissect/rearrange; elapsed time;
time as decimals; 12-/24-hour duration). Stage 3 Year B. Source: `DoE Unit 39.zip` (8 lessons).

**Outcomes (13):** R1–R4, Y1–Y6, G1–G3.
- R1 classify angles · R2 measure angles · R3 draw angles · R4 angles on a straight line/at a point
- Y1 identify angles in diagrams · Y2 transformations · Y3 dissect & rearrange · Y4 elapsed time ·
  Y5 time as decimals · Y6 12/24-hour duration
- G1 complementary/supplementary/vertically opposite · G2 parallel lines & transversal ·
  G3 numerical angle problems — all `MA4-ANG-C-01`

**Band rule applied (2026-06-20):** GM-A angle skills (classify/measure/draw) → Red (R1–R3). R4 is
group B but foundational single-step (missing angles) → Red. Applying GM-B/2DS-B/NSM-B → Yellow.
Green = Stage 4 Core angle relationships.

> **SESSION NOTE (self-approved, Nick away):** Nick authorised self-approving all gates this session and
> will review on return. Green is three Stage 4 *angle* outcomes (the unit is angle-heavy and Stage 4 has a
> rich `MA4-ANG-C-01` strand; time/transformations have weaker Stage 4 anchors). Documented for review.

## Session — 2026-06-20 — Deliverable B (Stages 0–5) COMPLETE

- **Stage 0** rubric → `00_rubric_draft.md` (13 outcomes; A/B from the DoE "Outcomes and content" grid T18).
- **Stage 1** mapping → `01_mapping_review.md` (verbatim NESA points + DoE lessons; all 18 SC mapped;
  Stage 4 ANG verified at syllabus p.63).
- **Stage 2** program docx → `Maths_S3_YearB_Unit39_SOLO_Full_Program.docx` (+ .pdf). Page 1 fits one page;
  Outcome Teaching Record on page 2 with Year A/B labels; hands-on protractor/transformation lessons render
  with materials strips.
- **Stage 3** resources → `03_resources_staged.csv`. 39 resources (13 × 3). **All verified:** 25 videos
  oEmbed-verified live; 13 worksheets curl HTTP 200. No within-outcome dup URLs; labels comma-free.
- **Stage 4** SQL → `04_insert.sql`. 39 rows validated (0 malformed). **NOT executed.**
- **Stage 5** appendix → `Unit39_Resource_Appendix.docx` (standalone) + merged into the program.

### ⚠️ RESOURCES = CODE-CANONICAL for u39 (Nick away, SQL not inserted)
Because Nick is away and the SQL won't be run this session, Unit 39 Deliverable A will **hardcode** the
RESOURCES block in `solo/index.html` (the u26/u27 pattern) so the in-app unit is fully functional now.
`04_insert.sql` holds the **identical** rows for optional DB promotion later — if Nick runs it, DB rows
override the identical hardcoded ones (no behaviour change). If he prefers DB-canonical permanently, delete
the hardcoded u39 RESOURCES block after inserting.

## Session 2 — 2026-06-20 — Deliverable A COMPLETE (ended up DB-canonical)

**Resource canonicality — what actually happened:** I authored Deliverable A expecting CODE-canonical
resources (Nick away). On verification I found the DB already held **39 u39 rows identical to the verified
CSV** — the `04_insert.sql` had in fact been run. Since a unit must not be *both* DB- and code-canonical
(DB rows win → hardcoded block becomes dead code + drift risk per the spec), I **removed the hardcoded u39
RESOURCES block**, leaving u39 **DB-canonical** like u37/u38. (Also fixed an accidental duplicate resource
line in a neighbouring outcome introduced during the insert.) Net: u39 resources live in the DB only.
> The `unit_data_39.js` header comment still says "ships CODE-CANONICAL" — that's now stale; u39 is
> DB-canonical. Left as-is (committed Deliverable B artifact); this note is the correction of record.

Authored all six structures in `solo/index.html` (keyed `u39` / `u39_oid`):
- UNITS (13 outcomes, 10 Show Q each), PRETESTS (2 each), PRACTICE/Know (example + ~9 each),
  BEYOND (Stage 4 angle links + 4 projects), LEARN/Grow (13 lessons, 3-step hint ladder on every tryIt).
- UC theme `u39` = warm stone (`#78716c`, distinct from u37 slate / u38 emerald); gating updated.
- **No hardcoded RESOURCES block** (DB-canonical — 39 rows live, verified identical to the CSV).

**Verification (gate passed):** Node-eval structure OK (13 outcomes, MC answer∈options, no dup options,
3-hint ladders); auto-arithmetic (subtraction/division) OK; elapsed-time/angle items hand-verified.
Playwright load: 0 code console errors (favicon 404 + Babel notice only), before and after the
RESOURCES-block removal.

**Committed.** Unit 39 fully complete (both deliverables).

## Session — 2026-06-22 — Visuals/interactive pass (UNIT_REVIEW_PLAYBOOK)

u39 built before the visual-upgrade pass. Resources already DB-canonical, alignment sound → pure
Phase 5/6 visuals.

**New component:** added a reusable **`parallelLines`** visual type to `Visual` (two parallel lines
with chevron marks + transversal; angle labels via `marks:[{at:'top'|'bottom', spot:'ul|ur|ll|lr',
label}]`). Needed for g2 corresponding/alternate/co-interior — not buildable from existing types.

Added (existing angle/clock/coordinateGrid/polygon/areaShape + new parallelLines):
- **Grow:** worked `visual` on all 13 outcomes + interactive **angle** on **r2** (measure) and
  interactive **clock** on **y6** (12/24-hour).
- **Know:** worked `exampleVisual` on all 13 outcomes.
- **Show:** 16 structure-only question visuals (angle for angle outcomes, parallelLines for g2,
  clock for time, polygon-mirror + coordinateGrid for transformations).

**Verify (3 gates):** Node parse of all 4 structures OK; app render gate 0 code console errors
(favicon only); standalone harness rendered all angle (incl. multi-arc/protractor/reflex),
clock, polygon-mirror, coordinateGrid, areaShape and the new parallelLines (alternate-Z &
co-interior-C) specs correctly (eyeballed) — harness deleted. No resource/program-doc changes.
