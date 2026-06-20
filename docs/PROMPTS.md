# Word Labs SOLO Tracker — Claude Code Prompt Templates

This file contains the standard prompts for kicking off new unit builds in Claude Code.
Two deliverables per unit, run in order: Deliverable B first (teacher program + resources),
then Deliverable A (in-app SOLO Tracker content).

Replace `{NN}`, `{MM}`, `{PP}` with the actual unit numbers for the batch being built.

---

## Deliverable B — Teacher Program, Resources and SQL

Run this first. Produces the teacher program docx, verified resource CSV, SQL insert,
and resource appendix docx for each unit. Nothing goes live to students from this
deliverable — the SQL insert is written to a file for you to run in Supabase manually.

```
I want to build Units {NN}, {MM} and {PP} of the Word Labs SOLO Tracker completely
from start to finish. Please read `docs/SOLO_PIPELINE_SPEC.md` fully before starting,
then read `scripts/build_program_template.js` including the UNIT DATA SCHEMA comment
at the bottom.

The DoE source material is in `SOLO Units/`:
- `DoE Unit {NN}.docx` and `DoE Slides {NN}.pptx`
- `DoE Unit {MM}.docx` and `DoE Slides {MM}.pptx`
- `DoE Unit {PP}.docx` and `DoE Slides {PP}.pptx`

The NSW syllabus is in `SOLO Units/Syllabus/`.

Work through one unit at a time in order — complete Unit {NN} fully before starting
Unit {MM}.

For each unit run all stages in sequence without stopping for approval:

Stage 0 — Extract "Students can" success criteria from the DoE unit document. Read each
content point's syllabus content group (**Year A** or **Year B**) from the DoE unit's own
"Outcomes and content" grid (do NOT infer A/B from difficulty). Band by SOLO cognitive
demand — recall/single-step → Red, applying/multi-step → Yellow — with one hard rule:
**every Year A content point goes in Red, never Yellow** (Year B may be Red if simple or
Yellow if applying). Green = Stage 4 (must name the exact NESA Stage 4 content point, not
just "extension"). **Label every content point with its Year A/B group** in the rubric.
Tag each outcome as written/digital-appropriate, hands-on-required, or hands-on-preferred
per the spec. Write to `units/u{NN}/00_rubric_draft.md`. (See the band rule in
SOLO_PIPELINE_SPEC.md §0b — set 2026-06-20 after the Units 29–36 A/B audit.)

Stage 1 — Map every rubric outcome to its exact NESA content point (quoted verbatim,
not paraphrased) and the DoE lesson that addresses it (or explicitly note "no DoE lesson"
for Green). Write to `units/u{NN}/01_mapping_review.md`.

Stage 2 — Generate the program document using `scripts/build_program_template.js`. Write
a `unit_data_{NN}.js` matching the schema exactly. Run the LibreOffice conversion, run
`validate.py`, render pages 1-4 to images and confirm the layout looks correct —
specifically that page 1 fits on one page and the outcome teaching record fits cleanly.
If layout issues are found, fix the unit data (not the template) and rebuild before
continuing. Save the final docx to `units/u{NN}/`.

Stage 3 — Curate resources for every outcome. Fetch and confirm every URL live — no
search-snippet assumptions. Cross-reference difficulty against at least one other
Australian or NSW Year 6 source. For hands-on outcomes, prioritise technique
demonstration videos and recording/instruction sheets over written worksheets.
Deduplicate — do not list the same URL more than once per outcome. Write verified rows
only to `units/u{NN}/03_resources_staged.csv` using schema:
`unit_id, outcome_id, type, label, url, scope, class_id`
with `unit_id = 'u{NN}'` (u prefix), `scope = 'global'`, `class_id = null`.

Stage 4 — Write the SQL insert to `units/u{NN}/04_insert.sql`. Do not execute it —
I will run it in Supabase myself.

Stage 5 — Generate the resource appendix docx in the same landscape format as
Units 24-27. Save to `units/u{NN}/Unit{NN}_Resource_Appendix.docx`.

After completing all five stages for a unit, commit everything in `units/u{NN}/` to
git with message `Add Unit {NN} — full pipeline output` before starting the next unit.

Context limit rule — if you approach your context limit at any point, finish the current
atomic piece of work, write `units/u{NN}/PROGRESS.md` recording what's done by stage
and outcome, commit to git, and stop. A new session will read PROGRESS.md and resume
from exactly that point without redoing completed work.

Start with Unit {NN} Stage 0 now.
```

---

## Deliverable A — In-App SOLO Tracker Content

Run this after Deliverable B is complete and the SQL has been inserted into Supabase
for the unit. Produces the Grow / Know / Show in-app experience inside `solo/index.html`.

Before running this prompt, confirm:
- `units/u{NN}/00_rubric_draft.md` exists (approved rubric)
- `units/u{NN}/01_mapping_review.md` exists (approved mapping)
- `units/u{NN}/04_insert.sql` has been run in Supabase and the resources are live
- You know the total DB resource row count for the unit (check Supabase:
  `SELECT count(*) FROM resources WHERE unit_id = 'u{NN}'`)
- You know the exact outcome IDs and counts (e.g. R1–R4, Y1–Y6, G1–G3 = 13 outcomes)
- You know the Green band Stage 4 NESA content point code
- You have chosen a colour theme distinct from existing units:
  u24 blue / u25 green / u26 purple / u27 orange / u28 cyan

```
Build the in-app SOLO Tracker content (Deliverable A) for Unit {NN} — the playable
Grow / Know / Show experience students and teachers actually use, authored as data
inside solo/index.html. I have already completed Deliverable B for this unit (the
teacher program docx + verified resources); now I want the in-app unit built.

START HERE (read fully before writing code):
1. CLAUDE.md (project rules).
2. docs/SOLO_PIPELINE_SPEC.md — especially Section 3 (Deliverable A) and Section 3.7
   (finish gate). This is the source of truth.
3. The recalled memories project_solo_unit_workflow, project_solo_learn_card,
   project_solo_show_attempts, project_solo_row_cap.
4. The APPROVED rubric and mapping for this unit:
   - units/u{NN}/00_rubric_draft.md   (outcomes, bands, content points)
   - units/u{NN}/01_mapping_review.md  (verbatim NESA content points per outcome)
   These are already approved — build to them. Unit {NN} has {OUTCOME_COUNT} outcomes
   ({OUTCOME_IDS} — e.g. R1–R4 Red, Y1–Y6 Yellow, G1–G3 Green: {UNIT_CONTENT_FOCUS},
   Green = Stage 4 {STAGE4_CODE}). Keep the exact outcome IDs — they are database keys;
   never renumber.

GOLD STANDARD: match the most recently built in-app unit. Insert u{NN} right after
u{PREV} in each data structure. Every outcome must have a pretest + practice + resources
+ a FULL Grow (LEARN) lesson with a 3-step hint ladder on every try-it. No gaps.

AUTHOR ALL SIX DATA STRUCTURES in solo/index.html (all keyed uNN / uNN_oid):
  - UNITS    — {id:"u{NN}", name, subtitle, outcomes:[{OUTCOME_COUNT} × {id,band,short,label,questions:[10]}]}
  - PRETESTS — u{NN}:[{outcomeId, short, questions:[2]}]
  - PRACTICE — u{NN}_oid:{example:[3–5 strings], questions:[~9]}
  - BEYOND   — u{NN}:{resources:[Stage 4 links], projects:[~4 × {icon,title,description,tasks:[5–6]}]}
  - LEARN    — u{NN}_oid:{journey, hook, watch, workedExample, tryIt:[{question,answer,explain,hints:[3]}], reflect}
  Plus: add a u{NN} entry to the UC colour theme ({CHOSEN_COLOUR}, distinct from
  existing units), and add ||unit.id==="u{NN}" to the student gating lists.

RESOURCES — IMPORTANT:
  Unit {NN}'s resources are already in the Supabase `resources` table (DB-canonical —
  inserted via units/u{NN}/04_insert.sql). The app reads that table and it OVERRIDES
  the hardcoded RESOURCES block. So DO NOT hardcode a RESOURCES block for u{NN} — it
  would be ignored, and duplicating risks drift. Verify the DB rows first:
    GET https://kdpavfrzmmzknqfpodrl.supabase.co/rest/v1/resources?unit_id=eq.u{NN}&select=outcome_id,type,label,url
    (anon key is in solo/index.html / wordlab-data.js). Expect {RESOURCE_ROW_COUNT} rows
    across all {OUTCOME_COUNT} outcomes.
  Use those same URLs for the BEYOND Stage 4 links too.

QUESTION CONVENTIONS (spec 3.3): mc (answer ∈ options[], 4 options, no dup options),
input (answer + aliases[] for $/comma/decimal/fraction variants), truefalse, order.
Unicode minus −. Australian context (AUD, GST 10%, km/m/kg/g/mL/L, Aus spelling).
{UNIT_SPECIFIC_QUESTION_NOTES}

VERIFICATION GATE before committing (spec 3.6–3.7):
  - Node-eval each of the data blocks out of the HTML: MC answer ∈ options + no dup
    options; arithmetic/conversions correct; 3-hint ladder present on every tryIt;
    ≥2 resources per outcome (from DB).
  - Load solo/index.html via Playwright → 0 console errors is the real gate.
  - NO PARTIAL EXPOSURE: the instant u{NN} enters the UNITS array it shows to students.
    So author all {OUTCOME_COUNT} outcomes across all structures, pass the 0-console-errors
    gate, THEN add the UNITS entry and commit ONCE.

Co-author line: Claude Opus 4.8.

If you approach the context limit mid-build, finish the current outcome, update
units/u{NN}/PROGRESS.md with what's done by outcome code (and that resources are
DB-canonical — don't re-verify), commit, and stop. Do Unit {NN} only this session.
```

---

## Placeholders reference

When filling in Deliverable A for a new unit, replace these:

| Placeholder | Where to find it |
|---|---|
| `{NN}` | Unit number |
| `{PREV}` | Previous unit number (for insertion order) |
| `{OUTCOME_COUNT}` | Total outcomes — count rows in `00_rubric_draft.md` |
| `{OUTCOME_IDS}` | e.g. "R1–R4, Y1–Y6, G1–G3" |
| `{UNIT_CONTENT_FOCUS}` | e.g. "3D space + volume/capacity" |
| `{STAGE4_CODE}` | NESA Stage 4 code from Green outcomes in `01_mapping_review.md` |
| `{RESOURCE_ROW_COUNT}` | Run `SELECT count(*) FROM resources WHERE unit_id = 'u{NN}'` in Supabase |
| `{CHOSEN_COLOUR}` | Pick one not already used: u24 blue, u25 green, u26 purple, u27 orange, u28 cyan |
| `{UNIT_SPECIFIC_QUESTION_NOTES}` | Any unit-specific question conventions (e.g. decimal places, unit conversions) |
