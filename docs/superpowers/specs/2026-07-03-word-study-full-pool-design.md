# Word Study — full make-able-word pool (v2)

**Date:** 2026-07-03
**Status:** Approved design (brainstormed with Nick)
**Supersedes:** the "v1 pool: ~40–60 words" decision in `2026-07-03-word-study-design.md`.
Everything else in that spec (the six stages, mechanics, integration, handoffs) still holds.
**Branch:** `feat/word-study` (local-only until Nick authorises a push — main auto-deploys).

## Why this reverses the v1 pool decision

v1 deliberately kept the six-stage deep-dive to a hand-verified 40–60 word pool, because
syllable/phoneme/meaning/sentence/synonym data "can't be reliably auto-generated at 4,500-word
scale (the 2026-07-03 error class)."

The product reason to overturn that: the intended arc is **Flashcards → Morpheme Builder → Word
Study**. If a student builds a word in the Builder and the "🔬 Study this word" button doesn't
appear, the arc dead-ends. Nick's requirement: **every word Morpheme Builder can build must be
studyable.**

We can now do this safely because the risk is bounded by an **automated invariant gate** plus a
**fix-in-place** correction path (below) — not by hand-verifying every word.

## Scope

- **All 3,687 unique make-able words** from `valid-combos.json` get full six-stage data.
  (4,502 was combo-entries-with-duplicates; 3,687 is unique words.)
- Stage 1 (morphemes) is already free & verified for all 3,687 — it *is* `valid-combos.json`.
- No filtering of "obscure" combos: the whole point is that the handoff never dead-ends.

## Quality gate: auto-verify + fix in place

We ship the whole pool. Bad data is kept out by:

1. **Hard invariants (automated, block a word from shipping):**
   - `syllables` rejoin to the word.
   - `phonemes` rejoin under the **grapheme model** (letters concatenate to the spelling;
     split-digraph `a_e` etc. expand correctly) — the exact invariant the phoneme rebuild and the
     existing `word-study-harness.html` already check.
   - exactly **one** correct sentence; both wrong sentences actually contain the word.
   - `synonym` ∉ `synonymDistractors`; `meaning` ∉ `meaningDistractors`.
   - `morphemes` match the `valid-combos.json` entry.
   - Failures get **one retry**, then are written to `word-study-rejects.json` and **never shipped
     silently** (no silent caps).
2. **Soft data (meaning wording, sentence naturalness, synonym choice):** trusted from generation,
   **corrected in place over time** via the existing owner content-editor (`content-editor.html` →
   `word_corrections` table → `applyCorrections()` patches the static defaults at load). No new
   machinery — this is the codebase's established static-default + Supabase-override pattern.

**Reuse-first (a mechanism, not a separate gate):** wherever a word already exists in the verified
phoneme-mode / syllable-mode / breakdown pools, its `syllables`/`phonemes` are taken from there
as-is (zero new risk). Only genuinely-new words get generated splits (still invariant-checked).

**Syllable authority — howmanysyllables.com (fetch every multi-syllable word; per the v1
2026-07-03 method):** reuse-first only covers ~34 words (the existing syllable pool is ~170 words
and barely overlaps the 3,687 make-able set), so this is the real syllable strategy for essentially
all of them. For every word **with 2+ syllables** (1-syllable words are skipped — nothing to
divide), the generating agent WebFetches `howmanysyllables.com/syllables/<word>` and takes the
**division it returns directly** (e.g. `un-hap-pi-ness`) as the `syllables` split — the
authoritative count *and* boundary, which the rejoin invariant alone cannot verify.
**Resilient / graceful degradation (required — ~3,650 fetches will likely rate-limit partway):**
if the fetch fails, 404s, or the site throttles, the agent falls back to its own syllabification,
still passes the rejoin invariant, and flags the word `syllables:unverified` in the review report
so those are re-checked/spot-checked later rather than silently trusted. Each shipped entry also
records `syllablesSource: "hms" | "pool" | "agent"` so the flagged surface is queryable.
(Confirmed live: the site is WebFetch-able and returns count + division; `unhappiness` →
`un-hap-pi-ness`, matching v1 data.)

## Data architecture — one static file

- `word-study-data.js` grows 40 → 3,687 entries, **same entry shape** as v1
  (`word`, `stage`, `morphemes`, `syllables`, `phonemes`, `meaning`, `meaningDistractors`,
  `sentences{correct,wrong[]}`, `synonym`, `synonymDistractors`, `partMeanings`).
- ~2.5 MB raw, but repetitive JSON → **~400–500 KB gzipped/brotli over the wire** (Vercel), cached
  a day+. Acceptable, and **only `word-study.html` loads it.**
- **`morpheme-builder.html` drops its `word-study-data.js` dependency.** Pool = all buildable words,
  so every built word is studyable → the 🔬 button shows unconditionally (no pool lookup). Lighter.
- **`dashboard.html` is untouched** — it already discovers Word Study word-columns dynamically from
  recorded progress; it never loads the data file.
- Not sharded / not moved to Supabase. If parse time ever bites on old Chromebooks, shard later
  (YAGNI now).

## Generation pipeline — in-session workflow (Nick opted in)

Multi-agent orchestration via the Workflow tool (explicit opt-in this session), mirroring how
`analyze-words` batches ~30 words/call:

- **Source:** 3,687 words from `valid-combos.json`, morphemes pre-attached (stage 1 free);
  part-meanings from `data.js` `window.MORPHEMES`; word `stage` derived from its morphemes' stages
  (consistent with dashboard `getCategoryStage`).
- **Fan-out:** ~120 agent batches of ~30 words. Each agent authors, for its batch, the AI fields
  (meaning + 2 distractors; 3 sentences = 1 correct + 2 wrong; synonym + 2 distractors) and
  syllable/phoneme splits **only for words not covered by reuse-first**, returning validated
  structured JSON (schema-enforced). Each agent self-checks the invariants before returning.
- **Assembly:** agent returns are journaled (`journal.jsonl`); the main loop reads them, runs the
  **full invariant gate** again over the assembled set (belt-and-braces), reuses existing-pool
  splits, writes `word-study-data.js`, and emits `word-study-rejects.json` for any failures.
- Cost lands on this session's token budget (that's the opt-in trade); re-runnable for gap-fills.

## Verification

- Extend `tests/manual/word-study-harness.html` to run the data invariants across **all 3,687**
  (must be **3,687/3,687 green**), not just the original 40.
- Keep the existing live-grading Playwright pass: drive the real page for a sample spanning
  magic-e / digraph / doubling / multi-part words; right answer passes, wrong fails, 0 console
  errors, all six stages.
- Any invariant failure at assembly is a hard stop for that word (reject-listed), not a silent ship.
- Words flagged `syllables:unverified` (howmanysyllables.com unreachable at generation time) are
  listed for a later throttled re-check / spot-check — they may ship (rejoin still passed) but are
  tracked, not silently trusted.

## Unchanged from v1 (still in force)

- The six stages, their mechanics, scientist reactions, hint/support/low-stim/EALD behaviour.
- Landing card, dashboard heatmap tab (category = the word), Teacher Mode, round-based word count.
- Flashcards → Builder → Study handoffs (Builder→Study now unconditional; see architecture).
- No change to any *other* game's data.

## Out of scope (v2)

- "Write your own sentence" stage (still v3).
- Runtime AI / teacher-added Word Study words.
- Sharding / Supabase-hosting the pool (revisit only if parse time regresses).

## Success criteria

- Any word Morpheme Builder can build opens a full, correctly-graded six-stage Word Study run —
  with the standing goal of **full 3,687-word coverage**.
- **Every shipped entry passes the data invariants** (the harness over the shipped set is 100%
  green by construction). Words that fail are reject-listed and reported, never shipped silently;
  they are retried/regenerated (and, if needed, hand-fixed) until coverage is complete. Interim
  shipped-count may be <3,687 while rejects are worked off.
- Load stays acceptable (only `word-study.html` pays the cost; gzipped, cached).
- Fixes to soft data flow through the existing content-editor with no new plumbing.
