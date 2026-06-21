# Unit 21 — Progress Log

**Topic:** Number: Place Value, Decimals & Powers of 10. Stage 3 **Year B** (first Year B units — the "Year A" strings in the DoE docs are
prior-learning cross-references). Source: `DoE Unit 21.zip`, 8 lessons.

**Banding:** by **cognitive demand** (recall/single-step → Red, applying/multi-step → Yellow), per Nick's
2026-06-20 steer for these A-heavy early-Year-B units — see `feedback_solo_band_a_heavy_units`. A/B group
labelled on every content point. Green = Stage 4 Core.

## Session — 2026-06-20 — Deliverable B IN PROGRESS (Stages 0–1 complete)

- **Stage 0** rubric → `00_rubric_draft.md` ✅ (10 outcomes: R1–R3, Y1–Y4, G1–G3).
- **Stage 1** mapping → `01_mapping_review.md` ✅ (all SC mapped to verbatim NESA points + DoE lessons;
  Stage 4 codes verified against the syllabus PDF).
- **Stage 3 (resources) BLOCKED** — WebSearch tool outage on 2026-06-20. The verification gate requires
  every video/worksheet URL to be confirmed live (oEmbed/curl); finding new video IDs needs WebSearch.
  Worked the three rubrics ahead during the outage so resource curation can be done holistically across
  u21–u23 (they share place-value/decimal/measurement resources) once search recovers.

## Session — 2026-06-21 — Stage 3 resources COMPLETE ✅ (WebSearch recovered)
- WebSearch back online — resumed resource curation, done holistically across u21–u23.
- **Stage 3** → `03_resources_staged.csv` ✅ — **31 rows / 10 outcomes** (every outcome ≥2: video + worksheet,
  no duplicate URLs within an outcome). Reused verified URLs from u34/u35/u39/u40 where they fit; sourced
  new videos for place-value-to-millions (R1), expanded/non-standard form (Y1), estimating products (Y4),
  powers of 10 / index notation (G1).
- **Verification gate passed:** all 21 new + reused video IDs confirmed live via YouTube oEmbed (title +
  author match); all worksheet PDFs confirmed `200` via `curl`. Corbettmaths Indices PDF used for G1.
- **Stage 4 SQL** → `04_insert.sql` ✅ generated from the staged CSV (DB-canonical; apostrophes escaped).
  Confirmed `resources` table currently has **0** rows for u21 — these inserts are net-new; the `DELETE`
  is a safe no-op.

## Next (resume here)
- **Nick spot-checks `03_resources_staged.csv`**, then runs `units/u21/04_insert.sql` in the Supabase SQL
  editor (anon key can't write). Confirm the row count after insert. — **GATE: do NOT run SQL myself.**
- Then per unit: Stage 2 program docx → Stage 5 resource appendix.
- After SQL inserted + confirmed: Deliverable A (in-app Grow/Know/Show) — author all six structures in
  `solo/index.html` keyed `u21`, resources DB-canonical (do NOT hardcode).
