# Unit 23 — Progress Log

**Topic:** Length & Time. Stage 3 **Year B** (first Year B units — the "Year A" strings in the DoE docs are
prior-learning cross-references). Source: `DoE Unit 23.zip`, 8 lessons.

**Banding:** by **cognitive demand** (recall/single-step → Red, applying/multi-step → Yellow), per Nick's
2026-06-20 steer for these A-heavy early-Year-B units — see `feedback_solo_band_a_heavy_units`. A/B group
labelled on every content point. Green = Stage 4 Core.

## Session — 2026-06-20 — Deliverable B IN PROGRESS (Stages 0–1 complete)

- **Stage 0** rubric → `00_rubric_draft.md` ✅ (12 outcomes: R1–R4, Y1–Y5, G1–G3).
- **Stage 1** mapping → `01_mapping_review.md` ✅ (all SC mapped to verbatim NESA points + DoE lessons;
  Stage 4 codes verified against the syllabus PDF).
- **Stage 3 (resources) BLOCKED** — WebSearch tool outage on 2026-06-20. The verification gate requires
  every video/worksheet URL to be confirmed live (oEmbed/curl); finding new video IDs needs WebSearch.
  Worked the three rubrics ahead during the outage so resource curation can be done holistically across
  u21–u23 (they share place-value/decimal/measurement resources) once search recovers.

## Session — 2026-06-21 — Stage 3 resources COMPLETE ✅ (WebSearch recovered)
- WebSearch back online — resumed resource curation, done holistically across u21–u23.
- **Stage 3** → `03_resources_staged.csv` ✅ — **38 rows / 12 outcomes** (every outcome ≥2: video + worksheet,
  no duplicate URLs within an outcome). Reused verified u34 length/perimeter/area + u39/u35 time/elapsed
  resources; new for measuring length (R1), reading timetables (Y5), speed–distance–time (G2) and
  distance–time graphs (G3) — Corbettmaths Speed-Distance-Time + Distance-Time-Graphs PDFs.
- **Verification gate passed:** all video IDs confirmed live via YouTube oEmbed (title + author match);
  all worksheet PDFs confirmed `200` via `curl`.
- **Stage 4 SQL** → `04_insert.sql` ✅ generated from the staged CSV (DB-canonical; apostrophes escaped).
  Confirmed `resources` table currently has **0** rows for u23 — net-new inserts; `DELETE` is a safe no-op.

## Session — 2026-06-21 (cont.) — SQL inserted ✅
- Nick ran `04_insert.sql` in Supabase. DB verified: **38 rows / 12 outcomes** (24 video, 14 worksheet).
  Resources are now DB-canonical for u23. Stage 3 fully closed.

## Next (resume here)
- Per unit: Stage 2 program docx (`unit_data.js` → `build_program_template.js` → LibreOffice round-trip) →
  Stage 5 resource appendix.
- After SQL inserted + confirmed: Deliverable A (in-app Grow/Know/Show) — author all six structures in
  `solo/index.html` keyed `u23`, resources DB-canonical (do NOT hardcode).
