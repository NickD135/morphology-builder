# Teaching Deck Accuracy — Design

**Date:** 2026-07-07
**Owner:** Nicholas Deeney
**Goal:** Make every downloadable teaching slide deck (~360 morpheme decks) provably correct: correct syllable splits, correct grapheme-phoneme splits, no repeated focus words across the 3-day week, and morpheme matrices that only show combinations that actually build real words. A deck must be *perfect or it does not ship*.

## Problem

Today each deck is 100% AI-invented. `generate-all-decks.js` prompts Sonnet per morpheme to make up example words, syllable splits, phoneme splits, weekly dictation words, and matrix morphemes from prose rules; `wordlabs-deck-generator.js` renders that into a PPTX. Consequences:

- Syllable / phoneme splits are LLM guesses — sometimes wrong.
- Matrix chips are arbitrary morphemes, not ones that genuinely combine (`.../needs-regen.txt` already flags 314/~360 decks).
- Each day is generated independently, so focus words repeat across the week.

## Sources of truth (already in-repo, now leveraged)

- **`valid-combos.json`** (freshly cleaned, 4,353 combos) — every *real* prefix+base+suffix combination. Ground truth for the matrix and for which words are real, with correct morpheme boundaries.
- **`word-study-data.js`** (3,522 words) — per word: morpheme breakdown, syllables, grapheme-phonemes, meaning, sentences, synonym. Invariant-checked (join-back = word). This becomes the deck data layer *after* Phase 1 hardens it.

## Architecture — two phases

Decks can only be as correct as the data they derive from, so we harden the data first.

### Phase 1 — Make the split data provably correct (operates on `word-study-data.js` at source)

**1a. Syllables → external authority.**
2,300 words are already verified against howmanysyllables.com (`syllablesSource:"hms"`); 1,187 are `agent` (unverified) and 35 `pool`. Re-fetch the 1,187 from howmanysyllables.com (reuse the existing hms fetch pattern used to build the current `hms` set), replace the split, retag `hms`. Where howmanysyllables has no entry, leave `agent` and record it in the checkpoint as a known exception. Outcome: syllable divisions are authority-backed.

**1b. Phonemes → fable 5 QA workflow.**
A fable 5 multi-agent pass over the grapheme-phoneme splits. Each word checked against AU phonics rules (digraphs and split digraphs kept whole: `sh`, `ch`, `a_e`, `igh`, etc.), join-back gated by `invariants.js`. Agreements pass untouched; disagreements are re-derived and the corrected split written back. Runs in batches (see Resumability).

Both 1a and 1b write back into `word-study-data.js` and must keep every `invariants.js` check green.

### Phase 2 — Deterministic deck generation (consumes hardened data)

Rewrite the **data layer** of `generate-all-decks.js` (the PPTX renderer `wordlabs-deck-generator.js` stays; only how `DATA` is produced changes):

- **Words, syllables, phonemes, morpheme breakdowns, definitions** ← pulled directly from hardened `word-study-data.js` for words containing the focus morpheme (via `morphemes.prefix/base/suffix1/suffix2`). No AI inventing facts. Definition = the verified `meaning` field.
- **Matrix** ← derived from `valid-combos.json`: chips are only morphemes that co-occur with the focus morpheme in a real combo. Accurate by construction.
- **No repeats** ← day 1/2/3 focus words drawn from one deduped per-deck pool; a word used once is removed from the pool.
- **Prose only** (multi-word dictation sentences, learning intention, true/false statements) ← fable 5. These aren't provable facts; the *words* inside them are already verified.

**Hard validation gate** (before any PPTX is written): syllable-join = word; phoneme-join = word; every matrix combo ∈ `valid-combos.json`; no focus word repeated across the week. Fail → the deck is not emitted and is logged for follow-up. No silent shipping of a flawed deck.

**Thin coverage** (96 bases + ~35 affixes with <4 verified words): use the verified words that exist; if too few for a full deck, list the morpheme in the checkpoint for a small targeted top-up — never pad with unverified words.

## Resumability & progress tracking (first-class — usage-limit safety)

A single human-readable checkpoint file — `docs/superpowers/notes/2026-07-07-deck-accuracy-progress.md` — is the source of truth for "where we are / where to go next". It records, per phase, counts of done / remaining and the next action. It is updated and committed at the end of every batch.

Machine-resumable state (so a re-run skips finished work):
- **1a:** `scripts/deck-accuracy/state-syllables.json` — `{word: "verified"|"no-hms-entry"}` per re-checked word.
- **1b:** phoneme QA batches processed, tracked like the existing `phoneme-batches/` pattern (batch N done/pending).
- **2:** `scripts/deck-accuracy/state-decks.json` — per morpheme: `pending | generated | FAILED_GATE(reason)`.

Discipline:
- Fixed batch sizes (e.g. 50 words / batch for 1a; workflow-sized batches for 1b; 20 decks / batch for 2).
- **Commit after every batch** with the count in the message, and update the checkpoint file in the same commit.
- Idempotent scripts: re-running resumes from state, never redoes committed work.
- The heavy fable workflows report what they covered and what they skipped (no silent truncation).

## Out of scope

- The PPTX visual design / layout (`wordlabs-deck-generator.js` rendering) — unchanged.
- EALD translated decks (`generate-translated-deck` edge function) — separate, unchanged.
- Changing the morpheme set or the 3-day pedagogical structure.

## Success criteria

- 0 syllable/phoneme join-back failures across all shipped decks.
- Every matrix combination builds a real word in `valid-combos.json`.
- No focus word repeats within any deck's week.
- 100% of syllable splits in shipped decks are `hms`-backed (or the word is documented as a no-authority-entry exception).
- The checkpoint file accurately reflects done/remaining at all times, so work can stop and resume cleanly.
