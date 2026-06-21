# SOLO Tracker — Build Progress & Handoff

Top-level index for the Stage 3 Year B SOLO unit builds. Per-unit detail lives in each
`units/u{NN}/PROGRESS.md`. The pipeline + conventions are in `docs/SOLO_PIPELINE_SPEC.md`.

> **Two deliverables, don't conflate them:**
> - **Deliverable B** = the teacher program docx + verified resources (rubric → mapping → docx →
>   resources CSV/SQL/appendix), output to `units/u{NN}/`.
> - **Deliverable A** = the in-app playable content in `solo/index.html` (Grow / Know / Show,
>   pre-tests, practice, Beyond, LEARN guided lessons). This is what students actually use.

---

## Status (as of 2026-06-20)

| Unit | Topic | Deliverable B (program + resources) | Deliverable A (in-app Grow/Know/Show) | Resources in Supabase `resources` table |
|---|---|---|---|---|
| u28 | Position & Chance | ✅ complete | ✅ complete (built earlier) | code-canonical (no DB rows) |
| u29 | 3D Space & Volume | ✅ complete | ✅ complete (committed 2c5b299) | ✅ 45 rows (SQL run) |
| u30 | Angles & Time | ✅ complete | ✅ complete (committed fed940d) | ✅ 42 rows (SQL run) |
| u31 | Number: Place Value, %, Multiplicative | ✅ complete | ✅ complete (committed 714566f) | ✅ 46 rows (SQL run) |
| u32 | 2D Space & Area | ✅ complete | ✅ complete (committed e0d1dc9) | ✅ rows (SQL run) |
| u33 | Multiplicative Strategies, Rates & Order of Ops | ✅ complete | ✅ complete (committed 409268a) | ✅ rows (SQL run) |
| u34 | Measurement: Mass, Length, Perimeter & Decimals | ✅ complete | ✅ complete (committed cd6c1fe) | ✅ 42 rows (SQL run) |
| u35 | Add/Subtract Strategies, Decimals & Percentages | ✅ complete | ✅ complete (committed eaac609) | ✅ 42 rows (SQL run) |
| u36 | Fractions & Chance | ✅ complete | ✅ complete (committed 2e82b23) | ✅ 39 rows (SQL run) |
| u37 | Multiplicative Relations & Measurement | ✅ complete (6f14253) | ✅ complete (dd1b7ba) | ✅ 42 rows (SQL run) |
| u38 | Chance & Data | ✅ complete (db0aec8) | ✅ complete (521c679) | ✅ 39 rows (SQL run) |
| u39 | Time, Transformations & Angles | ✅ complete (d112a65) | ✅ complete (456c62c) | ✅ 39 rows (SQL run) |
| u40 | Integers, Decimals, Percentages & the Cartesian Plane | ✅ complete (36d90d1) | ✅ complete (0d5c566) | ✅ 39 rows (SQL run; hardcoded block removed) |

### Units 21–23 — Year B early units (Place Value/Decimals · Add-Subtract/Decimals · Length/Time)

| Unit | Topic | Stage 3 resources (DB) | Deliverable B (docx) | Deliverable A (in-app) |
|---|---|---|---|---|
| u21 | Place Value, Decimals & Powers of 10 | ✅ 31 rows (SQL run + verified) | ✅ complete (cbebbf0) | ✅ complete (e969f5e) |
| u22 | Add/Subtract Strategies & Decimals | ✅ 35 rows (SQL run + verified) | ✅ complete (749990f) | ✅ complete |
| u23 | Length & Time | ✅ 38 rows (SQL run + verified) | ✅ complete (e1c627b) | ✅ complete |

> u21–u23 banded by **cognitive demand** (A-heavy early Year B units — see `feedback_solo_band_a_heavy_units`).
> Resources are **DB-canonical** (do NOT hardcode RESOURCES for these in `solo/index.html`). **All three
> (u21, u22, u23) done end-to-end 2026-06-21** — Stage 3 resources + Deliverable B + Deliverable A complete.

### Session 2026-06-21 — also shipped (UI polish on the home unit-card grid)
- **Equal-height unit cards** (`f4ad502`): cards are now a flex column with `body flex:1`, so the
  Pre-test/Post-test footer (student) and review-controls strip (teacher) sit flush at the bottom of
  every card instead of floating with a gap on shorter cards.
- **Progress bar + Highlight/Hide + band pills pinned to the bottom** (`e0ccc2b`): post-header content is
  wrapped in a `margin-top:auto` block, so the progress bar and Red/Yellow/Green pills land consistently
  just above the footer line regardless of how long each unit's subtitle is.
- Both verified via Playwright (0 code console errors) and pushed to `main`.

**Outcome counts:** u29 = 13 (4R/6Y/3G) · u30 = 13 · u31 = 13 · u32 = 12 (4R/5Y/3G) · u33 = 13 · u34 = 13 (4R/6Y/3G) · u35 = 13 (4R/6Y/3G) · u36 = 13 (4R/6Y/3G) · u37 = 14 (6R/5Y/3G) · u38 = 13 (4R/6Y/3G) · u39 = 13 (4R/6Y/3G) · u40 = 13 (5R/5Y/3G).

> The per-unit `units/u{NN}/PROGRESS.md` logs are authoritative. u29–u39 Deliverable A are live in
> `solo/index.html`. **Units 37–40 batch (2026-06-20):** u37/u38 DB-canonical (Nick inserted the SQL);
> u39 ended up DB-canonical (SQL was inserted — hardcoded block removed); u40 is code-canonical (SQL not
> inserted — hardcoded RESOURCES block; `04_insert.sql` ready for optional DB promotion). Units 38–40
> Deliverable B was self-approved per Nick's away-session instruction (see each unit's PROGRESS.md).

---

## Next actions

### 1. Run the two pending resource SQLs in Supabase (DB-canonical)
`units/u32/04_insert.sql` and `units/u33/04_insert.sql` — run in the Supabase SQL editor
(anon key can't write). u29–u31 SQLs are already run.

### 2. Build Deliverable A (in-app content) — one unit per session, start with u29
Resources for u29–u33 are **DB-canonical** (already in the `resources` table). The app reads that
table and it **overrides** any hardcoded `RESOURCES` block — so do **not** hardcode resources for
these units. Use the saved prompt below.

### 3. Finish Deliverable B for u34 and u35
Same 5-stage pipeline as u29–u33. **u34 is larger** — multi-strand (Mass `NSM-01` kg/g/tonnes, Length
`GM-02` m/km + perimeter-area, Additive Relations `AR-01` strategies + decimals, Fractions `RQF-02`
build-whole-from-part, daily percentages `RN-03`). u35 not yet inspected.

---

## Open decision (for Nick's review)
- **u29 banding** — banded by SOLO cognitive demand (not strict A→Red/B→Yellow) because the unit is
  ~90% syllabus content group A. Same call for **u32** (~90% group B) and **u33** (~95% group B).
  Documented at the top of each unit's `00_rubric_draft.md`. u30 and u31 fit the A→Red/B→Yellow rule
  cleanly. Adjust in the rubric file before any Deliverable A build reads it.

---

## SAVED PROMPT — build Deliverable A for a unit (paste into a fresh session)

Written for **u29**; to reuse for u30–u33, change every `u29`/`29`, the topic line, and the expected
DB row count (u30 = 42, u31 = 46, u32 = 41, u33 = 43).

```
Build the in-app SOLO Tracker content (Deliverable A) for Unit 29 — the playable
Grow / Know / Show experience authored as data inside solo/index.html. Deliverable B
(teacher program docx + verified resources) is already done; build the in-app unit now.

START HERE (read fully before writing code):
1. CLAUDE.md
2. docs/SOLO_PIPELINE_SPEC.md — Section 3 (Deliverable A) and 3.7 (finish gate).
3. Memories: project_solo_unit_workflow, project_solo_learn_card, project_solo_show_attempts,
   project_solo_row_cap.
4. APPROVED rubric + mapping: units/u29/00_rubric_draft.md and units/u29/01_mapping_review.md.
   Unit 29 = 13 outcomes (R1–R4 Red, Y1–Y6 Yellow, G1–G3 Green; 3D space + volume/capacity,
   Green = Stage 4 Volume MA4-VOL-C-01). Outcome IDs (r1..g3) are DB keys — never renumber.

GOLD STANDARD: match Unit 28 (most recent in-app unit) and Unit 26. Insert u29 right after
u28 in each structure. Every outcome needs pretest + practice + resources + a FULL Grow (LEARN)
lesson with a 3-step hint ladder on every try-it. No gaps.

AUTHOR ALL SIX STRUCTURES in solo/index.html (keyed u29 / u29_oid):
  UNITS (10 Show Qs/outcome) · PRETESTS (2/outcome) · PRACTICE (example + ~9 Know Qs) ·
  BEYOND (Stage-4 links + ~4 projects) · LEARN (full Grow lesson every outcome:
  journey/hook/watch/workedExample/tryIt[3-hint ladder]/reflect).
  Plus: add a u29 UC colour theme (distinct from u24 blue/u25 green/u26 purple/u27 orange/
  u28 cyan) and add ||unit.id==="u29" to the student gating lists.

RESOURCES — do not hardcode. u29 resources are already in the Supabase `resources` table
(DB-canonical) and OVERRIDE any hardcoded RESOURCES block. Verify first:
  GET https://kdpavfrzmmzknqfpodrl.supabase.co/rest/v1/resources?unit_id=eq.u29&select=outcome_id,type,label,url
  (anon key in solo/index.html). Expect 45 rows across all 13 outcomes. Use the same URLs for BEYOND.

CONVENTIONS (spec 3.3): mc (answer ∈ options, 4 opts, no dups), input (+aliases for
$/comma/decimal/fraction), truefalse, order. Unicode minus −. Australian context (AUD, GST 10%,
km/m/kg/g/mL/L, Aus spelling). This unit: capacities to 3 dp, V = base area × height (Green),
1 cm³ = 1 mL conversions.

GATE before commit (spec 3.6–3.7): node-eval blocks (MC answer ∈ options, no dup options,
arithmetic/conversions correct, 3-hint ladder on every tryIt, ≥2 DB resources/outcome); load
solo/index.html via Playwright → 0 console errors. NO PARTIAL EXPOSURE: author all 13 outcomes,
pass the 0-error gate, THEN add the UNITS entry and commit ONCE.

COMMIT direct to main (Vercel auto-deploys). Co-author: Claude Opus 4.8. If near context limit,
finish the current outcome, update units/u29/PROGRESS.md by outcome code, commit, stop. Do u29 only.
```
