# Unit 28 — Progress Log

Topic: Position (Cartesian plane, Lessons 1–4 / `MA3-GM-01`) + Chance (Lessons 5–8 / `MA3-CHAN-01`).
Stage 3 Year B. Source: `SOLO Units/SOLO Units/Unit 28/DoE Unit 28.zip`.
Rubric (background source): `SOLO Units/u28/00_rubric_draft.md`.

---

## ✅ STATUS: COMPLETE (2026-06-19)

Both deliverables shipped and verified; 12 outcomes (R1–R3 · Y1–Y6 · G1–G3).

- **Deliverable A — in-app SOLO content** (`solo/index.html`): all six data structures (UNITS, PRETESTS, PRACTICE, LEARN, RESOURCES, BEYOND) + UC theme + gating. Live (commit on `main`, Vercel auto-deploys). Verified: node-eval clean, Playwright 0 console errors.
- **Deliverable B — teacher program docx** (`units/u28/Maths_S3_YearB_Unit28_SOLO_Full_Program.docx` + `.pdf`): 18 pages (overview · 12-row Outcome Teaching Record · 12 lesson cards · 3-page resource appendix with worksheet checklist). Confirmed by Nick to render correctly in **Microsoft Word** and the PDF.
- **Engine fixes made along the way** (`scripts/build_program_template.js`, benefit all future units): valid multi-column table grids (fixed the Word "100+ pages" bug), `cantSplit` rows + `pbPara()` page breaks (no fragments/blank pages), density tuning for 12-outcome units, and `buildAppendix()`.

Confirmed resources all link-verified (oEmbed/curl). Nothing outstanding for Unit 28. Session logs below are the detailed trail.

## Session 1 — 2026-06-19

**Stage 0 — complete + APPROVED.**
- Extracted success criteria from the DoE unit doc (they live in LI/SC *tables*, not under a "Students can" heading — noted in the rewritten spec).
- Drafted 12 outcomes: 3 Red, 6 Yellow, 3 Green.
- Nicholas's decisions:
  - Band rule confirmed: content group **A → Red** (Year 5 consolidation), **B → Yellow** (Year 6 home year).
  - Green uses **Stage 4 group A** content only (dropped Probability B complementary events from G3).
  - Modality tags = author's discretion (informational for the in-app build).
  - **Deliverables: BOTH** — in-app `solo/index.html` content (primary) AND the teacher program docx.
- Rewrote `docs/SOLO_PIPELINE_SPEC.md` to match the real code (was claude.ai-authored against a wrong mental model — it described a docx-only pipeline and called Grow/Know/Show "not yet built"). New spec documents the six `solo/index.html` data structures as Deliverable A and the program docx as Deliverable B.

**Stopped:** clean checkpoint after Stage 0 + spec rewrite. No content authored in `solo/index.html` yet, so zero risk to the live app / student data.

**Next (build plan, in order):**
1. Gap-analysis table — confirm every rubric SC maps to an outcome (mostly carried from Stage 0).
2. Choose resource canonicality for u28 (DB vs hardcoded `RESOURCES`) — check `resources?unit_id=eq.u28` first.
3. In-app build (`solo/index.html`), per outcome R1→G3: `UNITS` (10 Show Qs) · `PRETESTS` (2) · `PRACTICE` (example + ~9 Know Qs) · verified `RESOURCES` (2–4, oEmbed/curl) · `LEARN` Grow lesson (Hook→Learn→Try→Reflect, 3-step hint ladder on every try-it). Plus `BEYOND` (Stage 4 A projects), `UC` colour theme, tab gating.
4. Verify: maths-check scripts on all 6 blocks; Playwright 0-console-errors gate.
5. Program docx (Deliverable B): author `units/u28/unit_data.js` → `build_program_template.js` → LibreOffice convert → `validate.py`.

**Notes / open items for next session:**
- This is a 12-outcome unit — comparable to Unit 26 (the gold standard). Expect the in-app authoring + verification to span multiple sessions; checkpoint by outcome code per spec §8.
- Commit policy: when committing solo work the repo convention is direct to `main` (Vercel auto-deploys); co-author `Claude Opus 4.8`.

## Session 2 — 2026-06-19 — IN-APP BUILD COMPLETE ✅

All six `solo/index.html` data structures authored for u28 (12 outcomes: R1-R3, Y1-Y6, G1-G3), committed in one go per the no-partial-exposure rule:
- `UNITS` u28 — 12 outcomes × 10 Show questions (120 Qs). Position (Cartesian) + Chance.
- `PRETESTS` u28 — 2 questions per outcome (24).
- `PRACTICE` u28_* — example block + ~9 questions each.
- `LEARN` u28_* — full Grow lesson each (journey/hook/watch/workedExample/tryIt with 3-step hint ladder/reflect).
- `RESOURCES` u28_* — 3-4 each. **Every URL verified**: 19+ YouTube via oEmbed (Math with Mr J, mrmaisonet, FuseSchool, Corbettmaths, MME, Mashup Math, Partners in Prime, etc.); Corbettmaths PDFs via curl (coordinates-pdf1/2, reflections, translations, probability, relative-frequency, listing-outcomes, drawing-linear-graphs).
- `BEYOND` u28 — Stage 4 A resources (verified) + 4 multi-step projects (coordinate map, game designer, linear patterns, relative-frequency experiment).
- `UC` u28 — cyan/Cartesian theme `{bg:#ecfeff,…}`. Student gating updated (`||unit.id==="u28"`).

**Verification gate PASSED:** node-eval of all 6 blocks clean; MC answers ∈ options + no dup options; 3-hint ladder on every tryIt; ≥2 resources/outcome, no dup URLs within an outcome. Playwright load of `solo/index.html` → React app rendered, 0 JS/compile errors (only an environmental favicon 404 + the expected in-browser-Babel warning).

**Canonicality:** CODE-canonical (zero `resources?unit_id=eq.u28` DB rows) — no Supabase seed needed.

**Deliverable B (teacher program docx) — DONE this session too.**
- Authored `units/u28/unit_data.js` (schema per `build_program_template.js`): 12 mini-lessons, one per outcome, in teaching order (Position cluster R1·Y1·Y2·Y3·G1, then Chance cluster R2·R3·Y4·Y5·Y6·G2·G3); page-2 Outcome Teaching Record in band/code order.
- DoE lesson links mapped (Position L1-4, Chance L5-8); Green G1/G2/G3 marked "Original mini lesson" (no DoE source — not fabricated). Hands-on flags + materials set for R2, Y2, Y3, Y4, Y6 per Stage 0c modality tags (spinners, grid paper, mirror, counters, tally sheets).
- Built `Maths_S3_YearB_Unit28_SOLO_Full_Program.docx` via `node scripts/build_program_template.js` (docx v8 installed locally).
- **Validation:** LibreOffice/`soffice` is NOT installed in this Codespace, so the spec's docx→docx round-trip + `validate.py` could not run. Instead verified: `word/document.xml` well-formed XML; all 12 outcome codes + all 4 syllabus codes (MA3-GM-01, MA3-CHAN-01, MA4-LIN-C-01, MA4-PRO-C-01) present; 12 Activate + 12 Check steps (all cards have the full 4-step structure); page-1 (Working Mathematically, pre/post-test), page-2 (Outcome Teaching Record), Mini Lesson Sequence, strand-abbreviation footer all present; all band shading colours rendered. **Open item:** Nicholas should spot-read the docx in Word/LibreOffice — table-rendering nuances only surface after a real Word open (the Deliverable B gate per spec §6).

Both deliverables for Unit 28 are now complete.

## Session 3 — 2026-06-19 — docx layout fixes (LibreOffice round-trip)

Installed LibreOffice + poppler in the Codespace and ran the spec's docx→PDF round-trip. The first docx had real layout faults that only surface in a true Word/LibreOffice render (exactly what the spec warns about): page-1 overview overflowed onto page 2 with fragmented half-empty table cells, a blank page 2, and the 12-row Outcome Teaching Record spilling its last row + footer. Fixed in the **shared engine** (`scripts/build_program_template.js`) so every future dense unit benefits — not hand-edited:

- **`cantSplit: true`** on Outcome Teaching Record rows (+ repeating header), Working Mathematically rows, and the blank pre/post-test rows → table rows never fragment mid-cell across a page break.
- **`pbPara()`** helper (paragraph `pageBreakBefore: true`) replaces the three free-standing `PageBreak` paragraphs → a full page no longer orphans an empty paragraph onto the next page (this was the blank-page-2 cause).
- **Page-1 density**: widened left column 6000→6700 DXA; trimmed section-heading lead spacing, inter-section spacers, content-point bullet spacing, header height, and outcomes/WM/blank-cell padding so the denser 13-content-point + 12-outcome overview fits one page.
- **Record density**: reduced row padding + banner height so all 12 rows + the NESA footer fit on a single page.

Result verified via LibreOffice round-trip render: 17→15 pages, **no blank or orphan pages**. Page 1 = overview (clean), page 2 = full 12-row record + footer, pages 3-15 = lesson cards (band-coloured, [HANDS-ON] tags on R2/Y2/Y3/Y4/Y6, "Original mini lesson" with no DoE link on Green G1-G3). docx regenerated and re-validated (document.xml well-formed; 12 lesson cards; all codes present).

Tooling note: LibreOffice (`soffice`) + `poppler-utils` are now installed in this Codespace, so the spec's round-trip render step can run here going forward.

## Session 4 — 2026-06-19 — THE Word bug: malformed lesson-card table grid

Nick opened the docx in real Microsoft Word and got **100+ pages** with broken tables — while LibreOffice rendered 15 clean pages. Root cause found in the shared engine: `buildLessonCard()` built each card's table with `mkTable([PW], rows)` — a **one-column `<w:tblGrid>`** — but the card's rows use `columnSpan: 4` (banner, structure, DoE/materials strips) and 2-cell half-splits. That is malformed OOXML: the declared grid says 1 column while rows reference up to 4. **LibreOffice silently rebuilds the grid from the cells (looks fine); Word obeys the declared grid literally**, so every card's columns collapsed, row heights ballooned, and each of the 12 cards exploded across many pages → 100+.

Fix (shared engine, generalises to all units):
- Card table now uses a real 4-column grid `CARD_GRID = [M1, M2, LC−M1−M2, PW−LC]` = `[1600, 1600, 4319, 7519]` (sums to PW=15038). Column boundaries hit M1, M2, the page midpoint, and the end.
- Every row's column spans now sum to 4: full-width = `colSpan 4`; metadata = `1 + 1 + 2`; the three half-split rows (LI/SC, vocab/diff, assessment/notes) = `colSpan 3 + 1` (cols 1-3 reach the midpoint, col 4 is the second half). Added `columnSpan: 3` to each half-split's first header + body cell.

Verified: card `tblGrid`s are now 4 columns (widths 1600/1600/4319/7519, sum 15038); gridSpans 4/2/3 present; LibreOffice still renders 15 clean pages (no regression); document.xml well-formed. This is valid OOXML Word will respect.

Also committed the **PDF render** (`Maths_S3_YearB_Unit28_SOLO_Full_Program.pdf`, 15 pages) alongside the docx as a guaranteed-correct artifact. Page-1 outer/nested tables, the record (6-col), and banner tables were already grid-consistent — only the lesson-card table had the malformed grid.

## Session 5 — 2026-06-19 — Resource appendix attached

Nick confirmed the docx renders correctly in both Word and the PDF, then asked for the resource appendix at the bottom. Added it via the shared engine (`buildAppendix()`), Nicholas's "merged into the program file" workflow:

- `unit_data.js`: `resource_appendix_attached: true` + `resources` (per-outcome, keyed by lowercase code, mirroring the verified set in solo/index.html) + `beyond_resources` (Stage 4 links + Maths-is-Fun interactives).
- `buildAppendix()`: a banner, a **3-column resource table** (Type | Resource | clickable Link) with band-coloured per-outcome sub-headers and a "Beyond SOLO — Stage 4" group, then a **worksheet download checklist** (unique PDF worksheets, tick-boxes + links). Links use `ExternalHyperlink` (real, clickable). Grid kept strictly valid for Word — every row spans exactly 3 columns (resource rows = 3 cells; sub-headers = colSpan 3).
- Page-1 fix: the "See Appendix for Resources" pointer added a line that re-overflowed page 1, so the page-1 citation is now shortened (drops the long strand summary) when the appendix is attached — net-neutral, page 1 still fits.

Verified via round-trip: 18 pages (15 program + 3 appendix), document.xml well-formed, appendix table is a valid 3-col grid, 62 working hyperlinks, no blank/orphan pages. docx + refreshed PDF in `units/u28/`. Engine UNIT DATA SCHEMA doc updated with the new fields.

---

## Build kit (everything the authoring session needs — derived this session)

**Canonicality: CODE-canonical.** `resources?unit_id=eq.u28` returns `[]` (zero DB rows). So author `RESOURCES` in the hardcoded block; **no** Supabase rows, no staging-CSV/SQL step. (Aside: u27 unexpectedly has 51 DB rows — contradicts the 2026-06-01 "deleted" note; flagged to Nicholas, unrelated to u28.)

**⚠️ No partial-unit exposure:** `hiddenUnits` is runtime teacher state, not a build flag. The instant `u28` enters the `UNITS` array it shows to students. → Author **all 12 outcomes** across all six structures, run the Playwright 0-console-errors gate, THEN add the `UNITS` entry + commit once. Don't commit a partial unit.

**Where each structure lives in `solo/index.html` (u27 is the reference; insert u28 right after u27 in each):**
| Structure | u27 block | Format (per u27_r1) |
|---|---|---|
| `var UNITS` | u27 obj starts line 695 | `{id:"u28",name:"Unit 28",subtitle:"Position & Chance",outcomes:[ {id:"r1",band:"red",short:"…",label:"…",questions:[10×{id,type,text,answer/options}]}, … ]}` |
| `var PRETESTS` | `u27:` at 1123 | `u28:[ {outcomeId:"r1",short:"…",questions:[2×{id,type,text,answer}]}, … ]` |
| `var PRACTICE` | `u27_r1:` at 2152 | `u28_r1:{example:[3-4 strings],questions:[~9×{type,text,answer/options}]}` |
| `var RESOURCES` | `u27_r1:` at 2667 | `u28_r1:[{label,url,type:"video"|"worksheet"|"website"}]` (2–4 each) |
| `var BEYOND` | `u27:` at 2852 | `u28:{resources:[Stage-4-A links],projects:[~4×{icon,title,description,tasks:[5-6]}]}` |
| `var LEARN` | `u27_r1:` at 3951 | `u28_r1:{journey,hook:{question,reveal},watch:{count,prompts:[3]},workedExample:{problem,steps:[~4]},tryIt:[3×{question,answer,explain,hints:[3]}],reflect:{prompt,note}}` |
| `const UC` | line 4167 | add `u28:{bg,border,text,dot,dark}` — **proposed teal/Cartesian theme:** `u28:{bg:"#ecfeff",border:"#67e8f9",text:"#0e7490",dot:"#06b6d4",dark:"#155e75"},` (cyan — distinct from u24 blue, u25 green, u26 purple, u27 orange) |
| student gating | line 6317 (`unit.id==="u24"||…`) | add `||unit.id==="u28"` so u28 gets the same student treatment as 24–27 |

**Question types:** `mc` (answer ∈ options[], 4 options, no dups), `input` (answer + `aliases[]` for `$`/comma/decimal/fraction variants), `truefalse` ("true"/"false"), `order` (items[]+answer[]). Unicode minus −. AUD/Aus spelling. For Cartesian outcomes, coordinates as text e.g. "(3, 5)" — `input` answers like "(3, 5)" need aliases "(3,5)".

**Outcomes to author (from approved rubric — codes are DB keys, do not renumber):**
- R1 first-quadrant plotting · R2 equally likely outcomes · R3 probabilities as fractions
- Y1 four quadrants · Y2 translate · Y3 reflect · Y4 build random generators · Y5 not-equally-likely · Y6 observed vs expected + sampling
- G1 linear relationships (Stage 4 A) · G2 sample space & P(event) (Stage 4 A) · G3 theoretical vs observed / relative frequency (Stage 4 A)

**Resource sourcing plan (verify EVERY url — oEmbed for YouTube, curl for PDFs, per spec §3.5):**
- Cartesian (R1/Y1/Y2/Y3): Math with Mr J "coordinate plane / four quadrants / plotting points", Corbettmaths "Coordinates" PDFs (`coordinates-pdf*.pdf`), reflections/translations videos. Mirror/fold demo video good for Y3.
- Chance (R2/R3/Y4/Y5/Y6): Math with Mr J / Corbettmaths "Probability" (`probability-pdf*.pdf`), spinner/relative-frequency videos. Eddie Woo for any AU framing.
- Green (G1/G2/G3 + BEYOND): Year 7 / Stage 4 — sample space, P(event)=fav/total, relative frequency via random number generator, plotting linear relationships.

**Verification gate before commit:** node-eval each of the 6 blocks (parse clean, MC answer∈options, no dup options, arithmetic correct); load `solo/index.html` via Playwright → **0 console errors**; confirm every outcome has pretest+practice+resources+full LEARN lesson with a 3-step hint ladder on every tryIt.
