# SOLO Unit Review & Visual-Upgrade Playbook

> **Purpose:** A repeatable runbook for taking ONE SOLO unit and bringing it to the standard set on
> Unit 27 (2026-06-21): fine-tooth-comb alignment audit → resource verification & curation → SQL →
> assessment fixes → visuals audit → build visuals → verify → ship.
>
> **How to use:** Point Claude Code at this file and give it the unit. Example prompt:
> *"Follow `solo/UNIT_REVIEW_PLAYBOOK.md` for unit u28. Here is the rubric: <paste rubric text>."*
>
> Everything lives in **one file**: `solo/index.html` (React-via-Babel, no build system).
> Run a local server with `python3 -m http.server 8080 --bind 0.0.0.0`.

---

## The framing (read this first — it sets the bar)

This tracker is **used independently by upper-primary students (Year 6, ~ages 11–12)**. They work
through it on their own, in their books. That means:

- **Every resource must match its outcome EXACTLY.** A video or PDF that is "close" or "related"
  throws students off — if it doesn't match what the outcome asks them to do, **replace it with an
  exact match or remove it.** No loose/generic resources.
- **Wording must be self-explanatory for an 11-year-old working alone** — no teacher present to
  explain. Short sentences, plain language, Australian spelling/context (AUD, km/kg, GST 10%).
- **Resources, tests, Know practice and Grow must all teach the SAME thing the rubric names.** If the
  rubric says "use the area model", the test must make them use the area model, the Grow must model
  it, and the resources must show it.
- **Concepts that are spatial/visual must have visuals** — explaining in text alone fails students
  without strong visual-spatial reasoning.

When a rubric point bundles **two genuinely different skills** (e.g. "area model AND algorithm"),
consider **splitting it into two outcomes** so each can be assessed and taught on its own.

---

## Inputs required before starting

1. **Unit id** — `uNN` (e.g. `u28`).
2. **The rubric text** — Nick pastes the unit's success criteria as text (he can't upload files).
   This is the **source of truth** for alignment.
3. **Year level / band intent** if not obvious from the rubric.

---

## Key facts & invariants (do not violate)

- **Six data structures in `solo/index.html`, each keyed by unit:**
  1. `var UNITS = [ … ]` — `{id:"uNN", name, subtitle, outcomes:[{id, band:"red|yellow|green", short, label, questions:[10]}]}`. **Renders by band then array order.**
  2. `var PRETESTS = { uNN:[{outcomeId, short, questions:[2]}] }` — 2 Qs; both right auto-ticks the outcome. **Pretest = post-test (same questions).**
  3. `var PRACTICE = { uNN_oid:{example:[…], exampleVisual?:{}, questions:[~9]} }` — the **Know** tab.
  4. `var RESOURCES = { uNN_oid:[{label,url,type:"video|worksheet|website"}] }` — **fallback only** (see DB rule below).
  5. `var BEYOND = { uNN:{resources, projects} }`.
  6. `var LEARN = { uNN_oid:{journey, hook, watch, workedExample, tryIt, reflect} }` — the **Grow** guided lesson.
  Also: `UC` needs the unit's colour theme; the rubric-tab gating lists unit ids (`unit.id==="uNN"`).
- **⚠️ Resources have TWO sources. The DB wins.** The app reads
  `unitResources[key].length>0 ? unitResources[key] : RESOURCES[key]` — i.e. rows in the Supabase
  **`resources` table override the hardcoded `RESOURCES`**, *per outcome key*. **Always check the DB
  first** (a unit can have rows for some outcomes and not others). Default approach (Nick's
  preference): **make the DB canonical** — produce SQL (delete + insert) and **delete that unit's
  hardcoded `RESOURCES` block** so there's one source. The app only READS the table; **all DB writes
  go through SQL Nick runs in the Supabase SQL editor** (the anon key can't write — RLS).
- **Outcome IDs are database keys** (`solo_progress`, `solo_show_completions`, `resources` all store
  `unit_id`+`outcome_id`). **NEVER renumber an existing ID** — students lose progress. To add an
  outcome, **APPEND a new id** (e.g. `r6`, `y7`). Band grouping keeps it in the right column
  regardless of array position; place it next to its sibling in the array for display order.
- **Outcome iteration is fully dynamic** (`outcomes.length`, `.filter(o=>o.band===…)`), so appending
  an outcome is safe — nothing hardcodes the list.
- **Question types:** `mc` (answer ∈ options, **no duplicate options**), `input` (+ `aliases[]` for
  equivalent forms — always add `$`, comma-grouped, decimal, fraction/mixed variants), `truefalse`
  (`"true"`/`"false"`), `order`. Use unicode minus `−` for negatives and `×` `÷` for operators.

---

## Supabase quick reference

```bash
URL="https://kdpavfrzmmzknqfpodrl.supabase.co"            # project ref: kdpavfrzmmzknqfpodrl (Sydney)
JWT=$(grep -oE "eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+" solo/index.html | head -1)  # anon key
# Read a unit's DB resource rows (READ ONLY — anon key cannot write):
curl -s "${URL}/rest/v1/resources?unit_id=eq.uNN&select=outcome_id,type,label,url,scope&order=outcome_id" \
  -H "apikey: $JWT" -H "Authorization: Bearer $JWT"
```
`resources` columns: `id, unit_id, outcome_id, type, label, url, scope('global'), class_id(null), question(null)`. No order column. The separate `solo_resources` table is teacher-added per-class — leave it alone; only touch `scope='global'` rows.

---

## PHASE 0 — Gather everything

1. Read this playbook + `solo/project_solo_unit_workflow` notes if present.
2. In `solo/index.html`, locate and read the unit's blocks: `grep -n 'uNN' solo/index.html` then read
   the `UNITS` outcomes, `PRETESTS`, `PRACTICE`, `RESOURCES`, `LEARN` (and `BEYOND`, `UC`).
3. Pull the unit's **DB** resource rows (command above). Note which outcomes have DB rows (those
   override code) and which fall back to code.
4. Map the pasted rubric: **one table row per success criterion → which outcome covers it.** Flag any
   criterion that is named in a label but never given its own outcome, and any outcome that **bundles
   two distinct skills** (split candidate).

## PHASE 1 — Fine-tooth-comb alignment audit (per outcome)

For **every** outcome check four things against the rubric label:
1. **Pre/post test** (PRETESTS) — do the 2 questions actually assess what the rubric names? (The
   classic failure: rubric says "use the area model" but the test is bare computation.)
2. **Know practice** (PRACTICE) — example + questions on-target and self-explanatory?
3. **Grow lesson** (LEARN) — hook/worked example/try-its teach exactly the rubric skill? Each `tryIt`
   has a 3-step `hints` ladder?
4. **Resources** — does each video/PDF teach *this* outcome (not a neighbour's topic)?

Also check, across the unit:
- **Independent-Year-6 readability** — flag any wording a child couldn't follow alone.
- **Content gaps** — rubric phrases like "more than one operation", "justify", "explain" that the
  questions never actually exercise.
- **Split candidates** — bundled skills that deserve two outcomes.

Produce a per-outcome verdict table: ✅ aligned / ⚠️ tighten / ❌ replace, with the specific fix.

## PHASE 2 — Resource verification & curation

**Verify what's there (mandatory — this is what makes it accurate):**
```bash
# Videos — YouTube oEmbed returns exact title+author for live videos, errors for dead/private.
# WebFetch CANNOT read YouTube titles (JS-rendered); WebSearch alone gives false negatives. Use oEmbed.
for id in VIDEO_ID_1 VIDEO_ID_2 …; do
  r=$(curl -s "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json")
  echo "$id :: $(echo "$r" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d["title"]," | ",d["author_name"])' 2>/dev/null || echo DEAD)"
done
# PDFs / websites — bulk check HTTP status:
for u in URL1 URL2 …; do echo "$(curl -s -o /dev/null -w '%{http_code}' -L -A 'Mozilla/5.0' "$u") :: $u"; done
```
**Curate against the rubric:** for each resource, confirm the *content* matches the outcome (not just
that it loads). For mismatches: **find a verified exact-match replacement, or remove it.** Source from
Math with Mr J, Corbettmaths (+ Corbettmaths PDF worksheets students print and do in books),
Mathspace, WorksheetCloud, Khan, Periwinkle; year 5/6 for red/yellow, year 7/Stage 4 for green. AU
topics (GST) → Eddie Woo. **No duplicate URLs within one outcome** (cross-outcome reuse is fine).
Re-verify every replacement (oEmbed/curl) before using it. Label each resource so it **names what it
teaches** (e.g. "Area Model (Box Method)…" vs "Standard Algorithm…").

## PHASE 3 — Build the resource SQL

Produce `solo/uNN_resources_fix.sql` that makes the DB the single source of truth:
```sql
BEGIN;
DELETE FROM resources WHERE unit_id = 'uNN' AND scope = 'global';
INSERT INTO resources (id, unit_id, outcome_id, type, label, url, scope, class_id, question) VALUES
(gen_random_uuid(),'uNN','r1','video','Label — names the method','https://…','global',NULL,NULL),
…  -- EVERY outcome, including unchanged ones, so the DB is complete
;
COMMIT;
-- Sanity: SELECT outcome_id,type,label FROM resources WHERE unit_id='uNN' AND scope='global' ORDER BY outcome_id;
```
Rules: use unicode `—` and `×` in labels; escape apostrophes by doubling; videos then worksheet per
outcome. Then **delete the unit's hardcoded `RESOURCES` block** from `solo/index.html` (the "backup")
so code and DB don't diverge — confirm the JSON object boundary stays valid afterwards. Nick runs the
SQL in the Supabase SQL editor.

## PHASE 3B — Sync the program document resources

The unit's **program document** (the teacher-facing Word doc + Resource Appendix in `units/uNN/`)
lists the same resources. Its appendix MUST match the curated set you just built — otherwise the
printed program points teachers at resources the tracker no longer uses.

The program docx is **data-driven from Unit 28 onward**: `units/uNN/unit_data.js` holds a
`resources: { r1:[{type,label,url}], … }` map (mirrors the SOLO tracker set), and
`scripts/build_program_template.js` renders the program + an attached Resource Appendix from it.

Steps:
1. **Update `units/uNN/unit_data.js`** — make its `resources` map identical to the final curated set
   (same labels/URLs as your SQL, including any split outcome like `r6`). Keep `resource_appendix_attached: true`.
2. **Rebuild:** `node scripts/build_program_template.js units/uNN/unit_data.js` → move the output docx
   into `units/uNN/`.
3. **Verify the docx properly** (per `project_solo_unit_workflow` memory — this is the real gate):
   `soffice --headless --convert-to pdf` then render pages with `pdftoppm -png` and **look** at page 1
   + the appendix pages. Also check every `<w:tblGrid>` column count matches its rows' spans (Word
   explodes on mismatched grids even when LibreOffice silently fixes them). Install if missing:
   `sudo apt-get install -y libreoffice-writer poppler-utils` (and `npm install docx@8`).
4. **Commit the rebuilt docx + PDF** alongside the code changes.

⚠️ **Units before u28** (e.g. u27) have program docx that **predate the `unit_data.js` pipeline** — they
have no data source to regenerate from. For those, syncing the program doc means EITHER authoring a
full `units/uNN/unit_data.js` first (a larger task — the whole Deliverable-B program, not just
resources) OR editing the existing docx/appendix by hand. Flag this to Nick rather than attempting a
fragile in-place docx edit; treat it as a separate task.

## PHASE 4 — Assessment & content fixes (in code)

Apply the alignment fixes from Phase 1 to PRETESTS / UNITS questions / PRACTICE / LEARN:
- Reframe tests so they assess the rubric skill (e.g. give partial products and ask to combine).
- Add missing content the rubric names (e.g. two-step questions for "more than one operation").
- **Splitting an outcome:** keep the original ID (narrow its label/short), and **append a new id**
  with full coverage — UNITS (10 Qs), PRETESTS (2 Qs), PRACTICE (example + ~9 Qs), LEARN (complete
  Grow lesson with 3-step hint ladders). Add the new outcome's resources to the SQL (a small
  incremental `solo/uNN_<id>_split.sql` is fine). Verify all arithmetic and that MC answers ∈ options
  with no duplicates.

## PHASE 5 — Visuals audit (which outcomes benefit)

Go through every outcome and decide if a diagram unlocks it. Rule of thumb: **if the concept is
spatial, it needs a visual.** Common SOLO → visual mappings (extend as needed):

| Concept | Visual type |
|---|---|
| Area / box-method multiplication, distributive law a(b+c) | `areaModel` |
| Standard written (column) algorithm | `column` |
| Integers, repeated addition, jumps | `numberLine` |
| Tables of values, function machines, patterns/rules | `machine` |
| Missing-number / part–whole / two-step | `barModel` |
| Fractions, division-as-fraction, sharing | `fraction` / `sharing` |
| Coordinates (plot/translate/reflect) | `coordinateGrid` *(build for u28)* |
| Probability (spinners, dice, bags of counters) | `spinner` / `dice` / `counterBag` *(build for u28)* |
| Expected vs observed | bar chart *(build when needed)* |

Output a prioritised table: outcome → visual type → where it goes (questions / Grow / Know).

## PHASE 6 — Build & apply visuals

The reusable **`Visual({spec})`** component lives in `solo/index.html` just before `WorkedExample`
(inline SVG/HTML, no deps, accessible). See `project_solo_visual_engine` memory for the full spec.
Existing spec types & key params:
- `areaModel` `{top:[…], side:[…], showProducts, caption}`
- `column` `{a, b, showAnswer, caption}`
- `numberLine` `{min, max, step, jumps:[{from,to,label?}], points:[{at,label?}], caption}`
- `machine` `{op, inLabel, outLabel, rows:[[in,out]…], caption}`
- `barModel` `{totalLabel, parts:[{label,value}], caption}`
- `fraction` `{n, d}` (proper only) · `sharing` `{items, groups}` (handles improper)

**Adding a NEW visual type:** add a branch inside `Visual` and document its spec in the memory file.

**Wiring is already done** — add visuals as pure content by putting a field on the data:
- `q.visual` on any question object (covers Know, pre/post-test, Show — they share one render).
- `we.visual` on a LEARN `workedExample`; `tryQ.visual` on a `tryIt`; `L.hook.visual` on a hook.
- `pd.exampleVisual` on a PRACTICE block (the Know worked example).

**Assessment-integrity rule:** on **test/assessment questions** use the *structure-only* form (e.g.
`areaModel` with `showProducts:false`) so the visual scaffolds the method without giving the answer.
Use the *worked* form (`showProducts:true`, `showAnswer:true`) in Grow/Know explanations.

## PHASE 7 — Verify (all three gates)

1. **Parse gate** — extract each edited structure and eval in Node (catches syntax errors):
```bash
node - << 'EOF'
const fs=require('fs');const s=fs.readFileSync('solo/index.html','utf8');
function ex(decl,o,c){const i=s.indexOf(decl);let j=s.indexOf(o,i),d=0,k=j;for(;k<s.length;k++){if(s[k]===o)d++;else if(s[k]===c){d--;if(d===0){k++;break;}}}try{eval('('+s.slice(j,k)+')');return decl+' OK';}catch(e){return decl+' ERR '+e.message;}}
[['var UNITS = [','[',']'],['var PRETESTS = {','{','}'],['var PRACTICE = {','{','}'],['var LEARN = {','{','}']].forEach(a=>console.log(ex(...a)));
EOF
```
2. **Render gate** — serve and load in a headless browser; require **0 console errors** (a favicon 404
   is the only acceptable one — it's the Babel-compile gate for this no-test app).
3. **Visual gate** — extract the `Visual` function into a standalone harness using the SAME CDNs as the
   app (`react@18.3.1`, `@babel/standalone@7.23.9`, `<script type="text/babel" data-presets="react">`
   — unpkg + no presets fails with a bogus "import statement" error), render every spec you used, and
   **screenshot** to confirm each renders correctly. Delete the harness + screenshots afterwards.

## PHASE 8 — Deliver

- Send Nick the SQL file(s) to run in the Supabase SQL editor.
- Summarise: what was misaligned and how it's fixed, resources replaced (with verification note), any
  outcome split, visuals added and where, and the verification results.
- **Commit only when Nick approves.** SOLO work goes **direct to `main`** (Vercel auto-deploys).
  Co-author line: Claude Opus 4.8. Note that resource fixes reach students once the SQL is run; code
  fixes (tests, visuals, new outcomes) reach them once deployed.
- Update memory: tick the unit done; record anything non-obvious. Correct any stale memory you relied
  on (e.g. a wrong note about which units have DB resource rows).

---

## Decisions to put to Nick (use the question tool, don't guess)

These came up on u27 and will recur:
1. **Mismatched resources** — replace with verified exact matches (default) vs just remove?
2. **Edit the assessments too** (reframe tests / add missing content / split an outcome) vs resources only?
3. **Split a bundled outcome** into two (preserving IDs) — yes/no?
4. **Apply method** — produce SQL for Nick to run (default) vs connect Supabase MCP.
5. **Program document** — for pre-u28 units with no `unit_data.js`, do you want me to author one and
   regenerate the program docx (larger task), or leave the program doc for now?
6. **Commit & push** to main now — yes/no?

## Definition of done (the u27 bar)

Every outcome: pre/post test, Know practice, Grow lesson (with 3-step hint ladders) and resources all
match the rubric and read cleanly for an independent Year 6 student; every resource is verified live
and an exact topic match; spatial outcomes have visuals (structure-only in tests, worked in
explanations); all three verify gates pass; SQL delivered; **program document resources synced**
(`unit_data.js` updated + docx/appendix rebuilt and eyeballed, for u28+); memory updated.
