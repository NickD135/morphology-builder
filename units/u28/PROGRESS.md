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
- Commit policy: nothing committed yet this session (awaiting Nicholas's go-ahead). When committing solo work the repo convention is direct to `main` (Vercel auto-deploys); co-author `Claude Opus 4.8`.
