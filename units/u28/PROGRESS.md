# Unit 28 — Progress Log

Topic: Position (Cartesian plane, Lessons 1–4 / `MA3-GM-01`) + Chance (Lessons 5–8 / `MA3-CHAN-01`).
Stage 3 Year B. Source: `SOLO Units/SOLO Units/Unit 28/DoE Unit 28.zip`.
Rubric (background source): `SOLO Units/u28/00_rubric_draft.md`.

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

**Remaining (Deliverable B, optional):** the teacher program docx (`units/u28/unit_data.js` → `build_program_template.js` → LibreOffice → `validate.py`). Not started — the in-app content (Deliverable A, primary) is shipped.

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
