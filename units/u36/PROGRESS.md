# Unit 36 — Progress Log

Topic: **Fractions & Chance** — the whole and different-sized wholes, benchmark FDP equivalence, fractions
of whole numbers, comparing/ordering fractions with related denominators (area & number-line models), the
complement principle (subtract a unit fraction from a whole), adding/subtracting fractions with related
denominators, fraction word problems, and chance using fractions/decimals/percentages. Stage 3 Year B.
Source: `DoE Unit 36.zip` → `Mathematics-Stage3-Unit36.docx`.

This task = the **Deliverable B / resources pipeline** (Stages 0–5 → `units/u36/`).

## ✅ STATUS: Deliverable B COMPLETE (2026-06-20) — 13 outcomes (R1–R4 · Y1–Y6 · G1–G3)

| Stage | Output | Status |
|---|---|---|
| 0 | `00_rubric_draft.md` | ✅ 15 core SC; banded 4 Red / 6 Yellow / 3 Green |
| 1 | `01_mapping_review.md` | ✅ verbatim NESA content points + DoE lessons; Green = no DoE lesson |
| 2 | program docx (+pdf) | ✅ page 1 fits, 13-row record clean, 13 cards, 19pp incl. merged appendix, **0 blank pages** |
| 3 | `03_resources_staged.csv` | ✅ 39 rows, 3/outcome, every URL live-verified (oEmbed + curl), no within-outcome dups |
| 4 | `04_insert.sql` | ✅ `unit_id='u36'`, scope global, class_id NULL — **NOT executed** (Nick runs it) |
| 5 | `Unit36_Resource_Appendix.docx` | ✅ standalone appendix |

### ⏳ NEXT: Nick runs `units/u36/04_insert.sql` in Supabase (39 rows), confirms row count → then Deliverable A.

### Band decision (for Nick) — A/B split is GENUINE here
Unlike Units 33–35 (≈all content group B, banded by cognitive demand), Unit 36's DoE SC tables explicitly
label **"Representing quantity fractions A"** content (the whole, different-sized wholes, complement
principle) and **"B"** content (build whole, related denominators, equivalence, word problems). So the
**A→Red / B→Yellow** mapping is used here, supported by both the syllabus labels and cognitive demand.
Chance B (Y6) sits in Yellow (applying). Confirm/override.

### Overlap note
Benchmark FDP + finding 10% overlap Units 24/35 (FDP is revisited across Year-B units). Unit 36's
distinctive content: *different-sized wholes, related denominators (area model), the complement principle,
fraction word problems, and chance with fractions*.

### Green = Stage 4 Fractions `MA4-FRC-C-01` + Probability `MA4-PRO-C-01`
G1 add/subtract fractions with different denominators · G2 multiply fractions · G3 sample space &
complementary events (P(not A) = 1 − P(A)). Both Stage 4 codes verified in the NSW K-10 Syllabus (2022).

### Verification
26 YouTube videos oEmbed-verified live (mostly Math with Mr. J; plus Maths with Mrs B, Organic Chemistry
Tutor, Corbettmaths, Partners in Prime, Math and Stats Help) — exact titles/authors logged. All Corbettmaths
PDFs + 2 Maths-is-Fun interactives curl-verified HTTP 200. docx well-formed (22 tables, 114 hyperlinks);
page 1 one page; 13-row record clean; 0 blank pages.

### Outcome → Mini Lesson map (teaching sequence)
R1→1 Y1→2 R2→3 R3→4 Y2→5 Y3→6 R4→7 Y4→8 Y5→9 Y6→10 G1→11 G2→12 G3→13

---

## ✅ Deliverable A (in-app SOLO Tracker build) — COMPLETE (2026-06-20)

Built the playable in-app unit in `solo/index.html` (Fractions & Chance). All 13 outcomes
(R1–R4 · Y1–Y6 · G1–G3) authored across every data structure; inserted after u35.

- UNITS u36: 13 outcomes × 10 Show questions, banded red→yellow→green
- PRETESTS 13×2; PRACTICE (Know) 13×(example[4]+9 Q); LEARN (Grow) 13 lessons, 3-step hint ladder on every try-it
- BEYOND u36: 9 Stage-4 resources + 4 book projects (Fraction Chef, Probability Detective, Fraction Wall Builder, FDP Master)
- UC **pink** theme (#ec4899) + student gating list updated (||unit.id==="u36")
- RESOURCES **DB-canonical** (39 rows verified live in Supabase) — 0 hardcoded u36 keys

**Verification:** SQL confirmed live in Supabase (39 rows, all 13 outcomes, 26 video + 13 worksheet).
Node-eval all blocks (MC answer ∈ options, no dup options, ≥8 Know Qs, full LEARN schema with 3-hint
ladders on every try-it); every answer re-derived by hand (fractions of numbers, complement, compare/order
related denominators, add/subtract related & unlike denominators, multiply fractions, probability &
complementary events). Playwright load → React mounts, normal login landing, 0 real console errors (only an
environmental favicon 404). window.UNITS live with u36 (13 outcomes), 13 units total.

Both deliverables for Unit 36 are now complete. **All three units (34, 35, 36) are done — both deliverables each.**
