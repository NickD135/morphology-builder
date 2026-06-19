# Word Labs SOLO Tracker — Unit Generation Pipeline Spec

This document is the durable handoff between chat-based planning (Claude in
claude.ai) and execution (Claude Code in this repo). It encodes the
structure, rules, and verification gates established across Units 24–27
so that generating Stage 3 Year B units becomes a repeatable, checkable
pipeline rather than a from-scratch judgement call each time.

**Ground truth principle:** every SOLO outcome ultimately answers to a
NSW Mathematics K-10 Syllabus (2022) content point — not to a DoE lesson,
not to a resource, not to this spec. DoE units and slides are *evidence*
that a content point is being taught well; they are not the target.
Where Green-band outcomes extend beyond Stage 3, they map to Stage 4
syllabus content points explicitly, not to vague "extension" framing.

---

## 0. Repo layout and git tracking

Two physically separate locations, with different tracking rules:

```
SOLO Units/                          ← SOURCE material. Gitignored.
  DoE Unit {NN}.docx
  DoE Slides {NN}.pptx
  Syllabus/
    Maths K-10 Syllabus 2022.pdf

units/                                ← PIPELINE OUTPUT. Tracked in git.
  u{NN}/
    PROGRESS.md
    00_rubric_draft.md
    01_mapping_review.md
    03_resources_staged.csv
    Maths_S3_YearB_Unit{NN}_SOLO_Full_Program.docx
    Unit{NN}_Resource_Appendix.docx

docs/
  SOLO_PIPELINE_SPEC.md               ← this file. Tracked.

scripts/
  build_program_template.js           ← the program template engine. Tracked.
```

**`SOLO Units/` is gitignored** — add `SOLO Units/` to `.gitignore`. NESA
syllabus content and NSW DoE unit/slide material aren't Nicholas's to
redistribute via a public GitHub repo, even though they're fine for
Claude Code to read locally as reference material. This folder needs to
exist physically in the Codespace for the pipeline to work, but should
never be pushed.

**`units/` is tracked, including `PROGRESS.md`.** Every stage's output —
the rubric draft, the mapping review, the resources staging CSV, the
program docx, the appendix docx, and the per-unit `PROGRESS.md` log —
gets committed normally. None of this is copyrighted source material;
it's Word Labs' own generated output, and keeping it in git is what
makes a unit's build genuinely resumable across sessions, machines, and
Codespace rebuilds. A `PROGRESS.md` that only exists as an uncommitted
file in a working directory provides none of its intended protection —
it can vanish under exactly the kind of "lost session" conditions it's
meant to guard against. Commit progress logs the same way you'd commit
any other generated artifact.

---

## 1. Inputs per unit

1. **NESA Mathematics K-10 Syllabus (2022)** — Stage 3 content points for
   the relevant strand(s), and Stage 4 content points for Green-band
   outcomes that extend past Stage 3.
2. **NSW DoE Mathematics Stage 3 Year B unit document(s)** (.docx) — for
   the matching unit number, downloaded from the DoE portal.
3. **NSW DoE matching lesson slides** (.pptx) — same unit, all lessons.
4. **Existing Supabase `resources` table** — to check what (if anything)
   already exists for this `unit_id` before generating new rows.

The rubric itself is **not** a separate input — it doesn't exist yet at
this point. It's the output of Stage 0 below. Units 24–27 had rubrics
already authored (by Nicholas's AP, using a similar manual prompting
process) and pasted directly into chat; from Unit 28 onward the rubric
is generated from the DoE unit document as Stage 0, then the rest of
the pipeline proceeds exactly as before.

---

## 2. Stage 0 — Rubric extraction and band classification (NEW — replaces manual rubric authoring)

This stage reproduces, as an automated and verifiable process, what
Nicholas's AP was previously doing by hand via a 3-prompt sequence in
EduChat against the DoE unit document. It is the **forward** process —
extract success criteria from the DoE unit, then classify each one
against the syllabus — as opposed to Stage 1, which maps an
already-existing rubric *backward* onto syllabus content points.

### 0a. Extract success criteria

For every lesson in the DoE unit document, find the subheading
"Students can" and extract each dot point underneath it verbatim,
**without** the "Students can" prefix and **without** separating output
by lesson at this stage (matching the original manual prompt exactly —
this gives a flat pool of success-criteria statements ready for
classification, not a lesson-by-lesson list).

### 0b. Classify each success criterion against syllabus content points

For each extracted success criterion, identify which Stage 3 syllabus
sub-strand and content point it belongs to, choosing from the full
sub-strand list:

- Represents Numbers A or B
- Additive Relations A or B
- Multiplicative Relations A or B
- Representing Quantity Fractions A or B
- Geometric Measure A or B
- Two-dimensional Spatial Structure A or B
- Three-dimensional Spatial Structure A or B
- Non-Spatial Measurement A or B
- Data A or B
- Chance A or B

**Important — this is a content-area split (A/B), not a year split.**
Each NSW Mathematics K-10 (2022) sub-strand is itself divided into "A"
and "B" content groups within Stage 3 — these are not the same thing as
"Year A" / "Year B" of the two-year stage cycle. Do not conflate them.
The actual **band rule** is about *which year of the Stage 3 cycle* the
content point's sub-strand grouping is taught in, relative to the
program being built:

- **Red** = the success criterion's content point is associated with
  **Stage 3 Year A** content (prior-year material, folded into a Year B
  program for consolidation — Stage 3 is taught as one continuous
  two-year span, so a Year B program still needs Year A content
  represented for students who need it).
- **Yellow** = the success criterion's content point is associated with
  **Stage 3 Year B** content (the home-year content for the program
  being built).
- **Green** = goes beyond Stage 3 entirely; classified against **Stage
  4** content points instead (see 0c below).

Record, per success criterion: the verbatim text, the sub-strand (e.g.
"Multiplicative Relations A"), the Year A/B determination, and the
resulting Red/Yellow band.

**Year A/B determination must be checked against the syllabus document
or scope-and-sequence, not guessed from sub-strand letter alone** — the
content-group letter (A/B) and the teaching-year letter (Year A/Year B)
are independent axes and conflating them was the single easiest mistake
to make reading this prompt sequence for the first time. Confirm against
NESA's actual Year A/Year B content allocation, not inferred.

### 0c. Flag hands-on / concrete-materials content

Not every success criterion converts cleanly into a written mini-lesson
with a worksheet. Content involving area, volume, 2D/3D shape properties,
angles, mass, capacity, and similar spatial/measurement concepts is
often genuinely better taught through manipulation of physical materials
(grid paper and counting squares, nets and folding, balance scales,
measuring jugs, geoboards, construction materials, body-scale movement
for angle/direction) than through a worksheet or video alone — and for
some of these, a hands-on activity is closer to *necessary* than
optional, because the underlying spatial reasoning doesn't transfer
reliably from a 2D diagram on a page.

For each success criterion extracted in 0a, tag whether it is:

- **Written/digital-appropriate** — can be taught and practised
  effectively through explanation, diagrams, and written/digital
  practice (most Number, Additive Relations, Data content).
- **Hands-on-required** — genuinely needs physical manipulation to
  build the underlying concept (most Geometric Measure, 2D/3D Spatial
  Structure, some Non-Spatial Measurement — e.g. constructing nets,
  comparing capacity by pouring, measuring area by tiling, exploring
  angle by physical rotation).
- **Hands-on-preferred** — works adequately in written/digital form but
  is meaningfully strengthened by a physical or manipulative component
  (e.g. fraction concepts with fraction tiles, place value with MAB
  blocks, decimal magnitude with a metre-long number line on the floor).

This tag is a flag for Stage 2, not a judgement that gets discarded —
see the lesson-structure note below.

### 0d. Green band — Stage 4 extension

For sub-strands or success criteria that represent the most advanced
content in the unit, generate the "next steps" using genuine **Stage 4**
content from the NSW syllabus — quoting the actual Stage 4 content point,
not just labelling something "extension." This matches the original
third prompt in the manual process (which was run per sub-strand, e.g.
"next steps for Geometric Measure using Stage 4 content").

### 0e. Output

A draft rubric in the same flat Red/Yellow/Green format Nicholas has
been pasting into chat for Units 24–27 — title, one-line student-voice
descriptor (the extracted "Students can" wording), band, **and the
modality tag from 0c** — written to `units/u{NN}/00_rubric_draft.md`,
grouped by band with the source content point cited next to each line
for review.

**Gate:** Nicholas reviews the drafted rubric — checking in particular
that Year A/B band assignment is correct, that Green's Stage 4 content
points are real and appropriately pitched, and that modality tags look
right (especially anything tagged "written/digital-appropriate" that's
actually about shape, space, or measurement — that's the likeliest
mis-tag) — before Stage 1 mapping runs. Because Stage 1 mapping depends
entirely on Stage 0's output, an error here propagates through the
whole pipeline, so this gate matters at least as much as the Stage 1
gate that follows.

---

## 4. Stage 1 — Outcome-to-syllabus mapping (human checkpoint)

For every rubric outcome (Rn, Yn, Gn) — now sourced from the Stage 0
approved draft rubric rather than pasted manually:

1. Identify the exact NESA content point(s) it corresponds to. Quote the
   content point text, not a paraphrase, and record which Syllabus
   strand/sub-strand it's from (e.g. "RN-A", "Data B", "AR-B"). For units
   that went through Stage 0, this content point is already recorded
   against each success criterion in `00_rubric_draft.md` — Stage 1 here
   is mostly a confirmation pass plus the DoE-lesson lookup in point 3,
   rather than mapping from scratch. For older units (24–27) or any
   rubric pasted manually without going through Stage 0, do the full
   content-point identification here as originally specified.
2. For Green-band outcomes, identify the Stage 4 content point(s) it
   extends into. Don't write "extended (Stage 4)" without naming the
   actual content point — Stage 0c should already have done this; carry
   it forward rather than re-deriving it.
3. Search the DoE unit document for a lesson (or lessons) that teaches
   this content point. Record the lesson number and a one-line summary
   of what in that lesson actually addresses it. It's fine for an
   outcome to have **no** DoE lesson — that's normal for Green band —
   but say so explicitly rather than silently inventing a link.
4. Where one DoE lesson covers multiple rubric outcomes, or one rubric
   outcome draws from multiple lessons, record that explicitly (this
   happened constantly in Units 24–27 — e.g. R1+R2 sharing Lesson 1).

**Output:** a mapping table (outcome → content point → DoE lesson →
one-line justification) written to a review file
(`units/u{NN}/01_mapping_review.md`) **before** any program document
or lesson content is generated.

**Gate:** Nicholas reviews and approves the mapping table before Stage 2
runs. Disagreements here are cheap to fix; disagreements found after
full lesson content is written are expensive.

---

## 5. Stage 2 — Program document generation

Once mapping is approved, generate the two-page program + mini lesson
sequence using the established structure:

### Document structure (landscape A4)
- **Page 1** — two-column: outcomes/content points/teaching model (left),
  Working Mathematically/differentiation/pre-test/post-test/resources
  (right).
- **Page 2** — Outcome Teaching Record: one row per outcome in sequence
  (not teaching-calendar order), with content point text, mini-lesson
  reference, sign/date columns.
- **Pages 3+** — Mini Lesson Sequence: one card per lesson — banner,
  duration/outcomes/syllabus metadata, DoE link bar (only if a real DoE
  source exists — never fabricate one), LI/SC, 4-step teaching
  structure, vocab, differentiation, assessment, teaching-notes field.

### Hands-on / concrete-materials lessons

For any outcome tagged "hands-on-required" or "hands-on-preferred" in
Stage 0c, the lesson card's 4-step teaching structure should reflect
that explicitly — don't default to the same Activate/Model/Guided
practice/Check shape built around a worksheet or digital example. In
practice this means:

- The **Model** and **Guided practice** steps name actual physical
  materials (grid paper, MAB blocks, geoboards, nets, measuring jugs,
  balance scales, string/rope for body-scale measurement, etc.) rather
  than only referencing a digital diagram or DoE slide.
- The **Resources** line lists the physical materials needed alongside
  any digital ones, since these need to be physically gathered before
  the lesson — this is genuinely different prep from "open the slide
  deck."
- The **Assessment** field, where the success criterion is inherently
  hands-on (e.g. "constructs a net for a given 3D object"), should
  describe what a student *produces or demonstrates physically*, not
  just a written response — a photo of constructed work, a
  teacher-observed demonstration, or a hands-on station checklist are
  often more appropriate than a worksheet mark.
- It's fine — expected, even — for some hands-on lessons to run longer
  than the standard 15–40 min mini-masterclass window, since setup and
  pack-up of materials takes real time. Don't compress duration just to
  match other lessons in the sequence.

This matters most for Geometric Measure, Two-/Three-dimensional Spatial
Structure, and parts of Non-Spatial Measurement (mass, capacity) — but
check the Stage 0c tag rather than assuming by strand name alone, since
some content within those strands (e.g. reading a scale, converting
units) is genuinely fine in written form.

### Build conventions (carried over from this session — see
`/mnt/skills/public/docx/SKILL.md` for the underlying docx-js rules)
- Landscape A4 content width: 15038 DXA (16838 − 900×2 margins).
- `ShadingType.CLEAR`, never `SOLID`.
- Tables need both `columnWidths` on the table and `width` on every cell.
- Band colours: Red `C00000`/`FCDBD9`, Yellow `7F6000`/`FFF9E6`,
  Green `375623`/`EBF3E6`, Navy header `1F3864`.
- Write the build script to disk via Python (not bash heredocs) to avoid
  encoding corruption — this bit us repeatedly.
- Convert via `soffice.py --headless --convert-to docx` and run
  `validate.py` before treating the file as done — table formatting
  issues only show up after LibreOffice round-trip.
- Term field on page 1 stays blank unless Nicholas confirms term
  placement for that unit.

**Output:** `Maths_S3_YearB_Unit{NN}_SOLO_Full_Program.docx`

---

## 6. Stage 3 — Resource curation (verification-gated, not best-effort)

This is the step where Unit 26 (Claude Code, with live fetch) clearly
beat Unit 27 (chat Claude, search-snippet-only). The difference is
**verification**, and it needs to be a mandatory gate, not a vibe.

For each outcome, target 2–3 videos + 1–2 worksheets (or websites/games
for units without worksheets, as in Units 24–25):

**For hands-on-required outcomes (per the Stage 0c tag),** don't force
the standard video+worksheet target — a worksheet can't substitute for
the physical activity itself. Instead prioritise: a short demonstration
video showing the *physical technique* (e.g. how to construct a net,
how to measure area by tiling, how to use a balance scale) over a
video that just talks through the concept on a slide; a simple printable
*instruction/recording sheet* for the hands-on task (what to build,
what to measure, where to record results) rather than a traditional
practice worksheet; and, where relevant, a materials list as part of the
resource entry so the teacher knows what to gather. It's fine for these
outcomes to end up with fewer or different resource types than the
written-content outcomes — that's the correct outcome, not a gap to
pad out with unrelated written practice.

1. **Fetch, don't assume.** Every URL must be actually retrieved
   (`web_fetch` / live request) and confirmed to resolve with content
   matching the claimed title — not just returned from a search snippet.
2. **Content-match check.** The video/worksheet must visibly address the
   *specific* content point from Stage 1, not just the general topic.
   ("Order of Operations" worksheet ≠ automatically valid for "order of
   operations with integers" if it never touches negatives.)
3. **Difficulty/level cross-check.** Don't rely on a single source.
   Cross-reference against at least one other independent AU/NSW-context
   resource (e.g. another Australian teaching unit, a different
   publisher's Year 6 resource, or the DoE unit's own stated difficulty)
   to sanity-check that what's being offered is genuinely Year 6 / Stage
   3 level — not a Year 4 simplification or a Year 8 extension mislabeled
   as Green. This matters most for Green band, where there's no DoE
   anchor to check against.
4. **No silent duplicates.** Unit 24's data had the same video listed
   four times under one outcome — catch and dedupe this before writing
   to Supabase, not after.
5. **Record what couldn't be verified.** If a resource can't be
   confirmed (dead link, paywall, ambiguous match), it doesn't go in.
   Flag the gap in the review file rather than filling it with a
   plausible-but-unchecked guess.

**Output:** resource rows written to a **staging file**
(`units/u{NN}/03_resources_staged.csv`) in the exact schema below —
**not** inserted into Supabase directly.

```
unit_id, outcome_id, type, label, url, scope, class_id
```
- `type`: video / website / game / worksheet (worksheet only where the
  unit actually has them, per DoE — don't invent worksheets for units
  like 24/25 that don't have them)
- `scope`: "global", `class_id`: null
- `unit_id` format: `'u24'`, `'u25'` etc. — **always with the `u` prefix**,
  matching existing Supabase convention. (We hit this exact bug earlier:
  an insert without the prefix silently created orphaned rows.)

**Gate:** Nicholas spot-checks a sample (e.g. one full band, or every
5th row) from the staging CSV before Stage 4 promotes anything live.

---

## 7. Stage 4 — Promote to Supabase

Only after the Stage 3 gate is cleared:

```sql
DELETE FROM resources WHERE unit_id = 'u{NN}';

INSERT INTO resources (unit_id, outcome_id, type, label, url, scope, class_id)
VALUES (...);  -- from the approved staging CSV
```

Run the existing schema-check query first if there's any doubt the table
shape has changed:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'resources'
ORDER BY ordinal_position;
```

---

## 8. Stage 5 — Resource appendix

Generate the landscape resource appendix docx (full resource table +,
where applicable, a worksheet download reference table) using the format
established for Units 24–27. Worksheet PDFs themselves cannot be fetched
server-side (Corbettmaths returns 403 to non-browser requests) — the
appendix should produce a clean download checklist, and PDF merging with
divider pages happens only after Nicholas manually downloads and
re-uploads the worksheet files.

**Output:** `Unit{NN}_Resource_Appendix.docx`

---

## 9. Stage 6 — Grow / Know / Show content (not yet built — scope before automating)

This is named in the ask but hasn't been built yet for any unit, so it
shouldn't be treated as a solved part of the pipeline. Before automating:

- Pre/post-test design and Show-assessment question writing need the
  same syllabus-content-point anchor as everything else, plus genuine
  pedagogical judgement on distractor design and difficulty calibration
  that benefits from Nicholas's review every time, not just at the
  mapping stage.
- Recommend treating this as Stage 6, generated to a staging file with
  its own explicit review gate, once Stages 1–5 are running reliably
  across a few more units. Don't bolt it on as an unattended extension
  of Stage 4.

---

## 10. Review checkpoints summary

| Stage | Output | Gate before proceeding |
|---|---|---|
| 0 | Draft rubric (`00_rubric_draft.md`) | Nicholas approves Red/Yellow/Green band assignment and Stage 4 content points — only needed for units without an existing manually-authored rubric |
| 1 | Mapping review file | Nicholas approves outcome→syllabus→lesson mapping |
| 2 | Program docx | Validated via `validate.py`; spot-read by Nicholas |
| 3 | Resources staging CSV | Nicholas spot-checks sample; all rows fetch-verified |
| 4 | Supabase insert | Only after Stage 3 gate; uses `u{NN}` unit_id format |
| 5 | Resource appendix docx | — |
| 6 | Grow/Know/Show content | Not yet built — separate scoping needed |

The point of the gates isn't bureaucracy — it's that mapping errors and
unverified resources are cheap to catch at the review-file stage and
expensive to catch after they're live in the tracker across 20 units.

---

## 11. Context limits, checkpointing, and resuming mid-unit

A single unit's full run — Stage 0 through Stage 5 — is a lot of work
to fit in one context window, especially for a unit the size of Unit 26
(9 Red outcomes, 6 Green, 16+ lessons). It's realistic that a session
will hit its context limit partway through a stage, not just between
stages. Don't treat this as a failure state to avoid — treat it as a
normal occurrence to checkpoint cleanly around, the same way the human
review gates already break the pipeline into safe stopping points.

### Checkpoint before running out, not after

Claude Code should treat approaching its context limit (roughly the
**last ~3% of available context**, i.e. stop new work once ~97% used)
as a trigger to stop starting new work and instead:

1. **Finish the current atomic unit of work** if it's small (e.g. finish
   verifying the resource currently being checked) rather than cutting
   off mid-verification — but don't start a new outcome's resource
   search if there isn't room to finish it cleanly.
2. **Write a progress file** to `units/u{NN}/PROGRESS.md` (see format
   below) recording exactly what's done, what's in-flight, and what's
   next.
3. **Leave partial-stage output in a clearly partial state**, not a
   silently-incomplete one — e.g. if Stage 3 resource verification is
   12 of 20 outcomes through, the staging CSV should contain only the
   12 verified rows, and PROGRESS.md should say so explicitly rather
   than leaving a confusing half-empty CSV with no explanation.
4. **Commit the checkpoint.** `units/` is tracked (see Section 0) —
   commit PROGRESS.md and whatever partial Stage output exists before
   ending the session, not just write it to disk. An uncommitted
   checkpoint provides no protection against a Codespace rebuild or a
   fresh clone on another machine; the whole point of checkpointing is
   defeated if the checkpoint itself can be lost the same way the
   in-progress work could be.
5. **Stop.** Don't try to squeeze in "just one more" outcome — that's
   exactly the situation that produces the silent, unverified shortcuts
   this whole pipeline exists to avoid (see Stage 3's verification
   requirements above).

### PROGRESS.md format

A simple running log, append-only across sessions, living at
`units/u{NN}/PROGRESS.md` (tracked in git — see Section 0):

```markdown
# Unit {NN} — Progress Log

## Session 1 — {date}
- Stage 0: complete. Rubric drafted, awaiting Nicholas review.
- Stopped: context limit reached during Stage 0.

- Next: wait for Stage 0 gate approval before starting Stage 1.

## Session 2 — {date}
- Stage 0: approved by Nicholas (see commit/note).
- Stage 1: complete. Mapping table written to 01_mapping_review.md.
- Stage 2: complete. Program docx generated and validated.
- Stage 3: in progress — 12 of 20 outcomes resource-verified
  (R1-R9, Y1-Y3 done; Y4-Y5, G1-G6 not started).
- Stopped: context limit reached mid-Stage-3.
- Next: resume Stage 3 from outcome Y4. Do not re-verify R1-Y3 —
  already confirmed and staged in 03_resources_staged.csv.

## Session 3 — {date}
- Stage 3: complete. All 20 outcomes verified, staged.
- Stopped: handing to Nicholas for Stage 3 gate (spot-check).
- Next: awaiting approval before Stage 4 (Supabase promote).
```

The key habits this format is meant to enforce:

- **Always say what's verified vs not**, by outcome code, not just "made
  progress on resources." A future session (or Nicholas) needs to know
  precisely where the verified/unverified line sits without re-deriving
  it from the staging file's row count.
- **Always say what gate is being waited on**, if any — don't leave it
  ambiguous whether the next session should keep generating or should
  be blocked on human review.
- **Never silently re-do completed work.** If 12 outcomes are already
  verified and staged, the next session reads PROGRESS.md, trusts it,
  and starts at outcome 13 — re-verifying everything from scratch every
  session defeats the purpose of checkpointing and burns context doing
  duplicate work.
- **One PROGRESS.md per unit**, not a global one — keeps the resume
  context scoped to exactly the unit being worked on.

This applies within a stage too, not just between stages — e.g. Stage 0
should checkpoint by which lessons' success criteria have been
extracted and classified so far, Stage 5 by which lessons have had
their resource appendix entries written.
