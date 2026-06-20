# Unit 29 — Progress Log

Topic: **3D Space & Volume** — prisms, pyramids, nets, views, skeletal models (3DS-01, Lessons 1–4)
+ decimals to thousandths, capacity equivalence, appropriate units, recording to 3 dp, displacement
(3DS-02 / RN-02, Lessons 5–8). Stage 3 Year B.
Source: `SOLO Units/SOLO Units/Unit 29/DoE Unit 29.zip` → `Mathematics-Stage3-Unit29.docx`.

This task = the **Deliverable B / resources pipeline** (Stages 0–5 producing files in `units/u29/`),
NOT the in-app `solo/index.html` build.

---

## ✅ STATUS: COMPLETE (2026-06-19)

All five stages done and verified; **13 outcomes** (R1–R4 · Y1–Y6 · G1–G3).

| Stage | Output | Status |
|---|---|---|
| 0 | `00_rubric_draft.md` | ✅ 14 SC extracted from LI/SC tables; banded 4 Red / 6 Yellow / 3 Green |
| 1 | `01_mapping_review.md` | ✅ every outcome → verbatim NESA content point + DoE lesson; Green = "no DoE lesson" |
| 2 | `Maths_S3_YearB_Unit29_SOLO_Full_Program.docx` (+ `.pdf`) | ✅ page 1 fits, 13-row record clean, 13 lesson cards (4-col grid), 19pp incl. merged appendix |
| 3 | `03_resources_staged.csv` | ✅ 45 rows, 3–4 per outcome, **every URL verified live** (oEmbed + curl), zero within-outcome dups |
| 4 | `04_insert.sql` | ✅ DELETE+INSERT, `unit_id='u29'`, `scope='global'`, `class_id=NULL` — **not executed** (Nick runs it) |
| 5 | `Unit29_Resource_Appendix.docx` | ✅ standalone 3-page landscape appendix (Units 24-27 format) |

### Key Stage 0 decision (for Nick's review)
Unit 29's syllabus content is **~90% content group A** (only "Construct prisms and pyramids",
`MA3-3DS-01` B, is group B). A strict A→Red / B→Yellow split (the Unit 28 rule) would give
~10 Red / 1 Yellow — no usable SOLO progression. So Unit 29 is banded by **SOLO cognitive demand**
within the Stage 3 content (recall→Red, applying/reasoning→Yellow), with the content-group letter
shown per outcome in `00_rubric_draft.md`. **This is the one judgement call to confirm/override.**

### Green = Stage 4 group A, all `MA4-VOL-C-01` (Volume)
- G1 — V = base area × height (V = Ah) for prisms with uniform cross-section
- G2 — convert metric units of volume & capacity (1 cm³ = 1 mL, 1 m³ = 1000 L)
- G3 — represent prisms from different 2D views; identify uniform cross-section
> Excluded: **surface area of prisms** = Stage 5 (`MA5-ARE-C-01`); **cm³-layer volume** = Stage 3 B
> (`MA3-3DS-01` B Volume) — neither is a valid Stage 4 A Green outcome.

### Build notes
- **Merged + standalone appendix both produced.** Following Unit 28's reviewed precedent, the program
  docx has the resource appendix merged at the end (`resource_appendix_attached: true`), AND a separate
  `Unit29_Resource_Appendix.docx` is emitted for the task's Stage 5. Nick can use either.
- **Layout fix made in unit data (not the template):** the long `syllabus_strands_summary` + the long
  Working Mathematically descriptions pushed page 1's resources citation onto page 2. Shortened both →
  page 1 fits on one page. (Verified via LibreOffice round-trip render.)
- **Engine changes (benefit all future units):** exported `buildAppendix` from
  `scripts/build_program_template.js`; added `scripts/build_appendix_standalone.js` (renders the shared
  appendix as its own landscape docx, dropping the leading page break).

### Verification evidence
- 28 YouTube videos oEmbed-verified live (Math with Mr. J, Corbettmaths, TutWay, Miacademy, Manocha
  Academy, etc.); 10 Corbettmaths PDFs + 4 Maths-is-Fun interactives curl-verified (HTTP 200).
- `document.xml` well-formed; 13 four-column lesson-card grids (the Word "100+ pages" bug guard);
  13 Activate + 13 Check steps (all cards complete); 63 working hyperlinks; appendix + worksheet
  checklist present; no blank/orphan pages.

Nothing outstanding for Unit 29 except Nick's Stage-0 band confirmation + running `04_insert.sql`.

---

## Outcome → Mini Lesson map
R1→1 R2→2 Y1→3 Y2→4 Y3→5 G3→6 R3→7 R4→8 Y4→9 Y5→10 Y6→11 G1→12 G2→13
(DoE teaching order: 3D-space cluster L1-4 first, then decimal/capacity/volume cluster L5-8, with each
Green Stage-4 card placed beside the Stage-3 work it extends.)

---

## Session 2026-06-20 — Deliverable A (in-app SOLO Tracker build) — COMPLETE

Built the playable in-app unit in `solo/index.html`, matching the Unit 28 / Unit 26
gold standard. All 13 outcomes (R1–R4 · Y1–Y6 · G1–G3) fully authored across every
data structure. Inserted u29 right after u28 in each block.

| Structure | Status |
|---|---|
| `UNITS` u29 | ✅ 13 outcomes × 10 Show questions each; subtitle "3D Space, Volume & Capacity"; banded red→yellow→green |
| `PRETESTS` u29 | ✅ 13 entries × 2 questions (both-correct auto-tick) |
| `PRACTICE` u29_* (Know) | ✅ 13 keys, each example[4] + 9 questions |
| `LEARN` u29_* (Grow) | ✅ 13 full guided lessons (journey/hook/watch/workedExample/tryIt/reflect); **every tryIt has a 3-step hint ladder** |
| `BEYOND` u29 | ✅ 11 Stage-4 resources + 4 multi-step book projects (Box Designer, Displacement Lab, Capacity Converter, Architect's Views) |
| `UC` u29 | ✅ rose theme `#f43f5e` (distinct from u24 blue / u25 green / u26 purple / u27 orange / u28 cyan) |
| student gating | ✅ `||unit.id==="u29"` added to the pre/post-test gating list |

**RESOURCES: DB-canonical — NOT hardcoded.** Verified 45 rows in the Supabase
`resources` table for u29 (3–4 per outcome, all 13 outcomes) before building; left the
hardcoded `RESOURCES` block with zero u29 keys so the DB set wins. The DB rows were
already URL-verified in Deliverable B (do not re-verify).

**Verification gate passed:**
- Node-eval of all six blocks out of the HTML: MC answer ∈ options + no duplicate
  options; truefalse/input/order well-formed; arithmetic & metric conversions checked;
  3-hint ladder present on every tryIt; ≥3 example lines + ≥9 practice Qs per outcome;
  0 hardcoded u29 RESOURCES.
- Playwright load of `solo/index.html`: **0 real console errors** (only an environmental
  favicon 404 + the standard in-browser-Babel warning). `window.UNITS` confirmed live
  with u29 (13 outcomes) + all structures present.
- 3 new Maths-is-Fun BEYOND website links curl-verified HTTP 200.

Committed direct to `main` (Vercel auto-deploys). Co-author: Claude Opus 4.8.

**Deliverable A is complete. Nothing outstanding for the in-app unit.**
