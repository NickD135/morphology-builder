# Word Study — capstone word-breakdown activity

**Date:** 2026-07-03
**Status:** Approved design (brainstormed with Nick)
**File(s):** new `word-study.html` + `word-study-data.js`; landing/dashboard integration.

## Purpose

A **capstone** activity that takes a *single* word deep, chaining the breakdowns students practise
in separate games (morphemes, syllables, phonemes) with meaning + vocabulary, on one word. This
"deep processing of one word across every level" is what the evidence favours — integrating
morphology + phonology + meaning rather than in isolation (see the vault's
`WordLabs Brain/Areas/Spelling evidence base` and `Spelling best practices and features`).

## Pedagogical sequence (approved: "structure-first, meaning woven in")

Informed by **Structured Word Inquiry** (Bowers & Kirby: morphology → etymology → phonology, with
meaning central and phonemes *last*), adapted to a concrete-first classroom flow:

1. **Morphemes** — split into prefix · base · suffix; **each part shows its meaning** (the SWI-based
   tweak: morphemes carry meaning, so meaning starts here, not only at the end).
2. **Syllables** — chop into beats.
3. **Phonemes** — group letters into grapheme sound-boxes (incl. split-digraph magic-e). Phonemes
   come after morphemes on purpose (morphology constrains grapheme choice — SWI).
4. **Meaning** — pick the correct meaning of the whole word.
5. **Correct use** — pick the sentence that uses the word correctly (of 3).
6. **Synonym** — pick the best synonym to swap in.

*(A stage 7 "write your own sentence" is explicitly out of v1.)* All six stages are graded
(XP/quarks like other games).

## Reused mechanics (consistency + less new code)

- Stage 1 → Breakdown Blitz style (prefix/base/suffix).
- Stage 2 → Syllable Splitter chop mechanic.
- Stage 3 → **Phoneme Splitter grapheme-grouping** model (`letters`+`boundaries`+`magic` — the one
  rebuilt 2026-07-03, split digraphs supported).
- Stage 4/5/6 → multiple-choice (Meaning Match-Up / Word Spectrum style).

Each stage: attempt → immediate feedback → advance; scientist reactions; the "Need Advice" hint +
support-mode option apply as elsewhere. Low-stim / reduced-motion respected. One word = one full
run; completing all 6 = word complete (reward + scientist celebration).

## Word selection

- **Pick a morpheme** (a prefix, base or suffix) → filter the pool to words containing it → random
  pick. Plus **"Surprise me"** → random word from the pool.
- Built from a morpheme→words index derived from each pool word's tagged morpheme IDs.

## Connected journey — Flashcards ↔ Morpheme Builder ↔ Word Study

The three activities share the **same morpheme/word spine** (`data.js` `window.MORPHEMES` +
`valid-combos.json`), so they blend into one arc:

> **Flashcards** (learn what a morpheme means) → **Morpheme Builder** (use morphemes to build a
> real make-able word) → **Word Study** (analyse that word deeply).

**Handoffs (navigation, minimal edits to existing pages):**
- **Morpheme Builder → Word Study:** when a built word is in the Word Study pool, show a
  **"🔬 Study this word"** action that opens Word Study on it.
- **Flashcards → Morpheme Builder:** on a morpheme card, a **"🧱 Build with this"** link that opens
  the Builder focused on that morpheme.
- **Word Study "pick a morpheme"** draws from the *same* morpheme set the Builder/Flashcards use, so
  a morpheme chosen here yields a genuine make-able word.

**Scale reality (agreed):** the *morpheme* dimension spans **all ~4,500 make-able words**
(valid-combos is verified). The full 6-stage graded deep-dive runs on the **curated, morpheme-tagged
pool** (drawn from valid-combos), because syllable/phoneme/meaning/sentence/synonym need verified
per-word data that can't be reliably auto-generated at 4,500-word scale (the 2026-07-03 error class).
The pool grows over time; the "🔬 Study this word" handoff appears only for words in the pool.

## Data model — curated & verified (`word-study-data.js`)

No runtime AI (avoids the syllable/phoneme error class fixed on 2026-07-03). Each entry:

```js
{
  word: "unhelpful",
  stage: "s2e",                                  // curriculum stage, for filtering
  morphemes: { prefix:"un", base:"help", suffix1:"ful", suffix2:null }, // IDs → meanings via window.MORPHEMES
  syllables: ["un","help","ful"],                // verified: rejoins to word
  phonemes:  ["u","n","h","e","l","p","f","u","l"], // grapheme model; rejoins (split digraphs as "a_e")
  meaning:   "not able or willing to help",      // authored
  meaningDistractors: ["...","..."],             // for stage 4 MC
  sentences: { correct:"The unhelpful map got us lost.", wrong:["...","..."] }, // stage 5
  synonym:   "useless",                          // stage 6 best answer
  synonymDistractors: ["...","..."]
}
```

**Field sourcing:**
- `morphemes` (+ part meanings) — from `valid-combos.json` grouping + `data.js` `window.MORPHEMES`
  (free, already verified).
- `syllables`, `phonemes` — from the `syllable-mode` / `phoneme-mode` pools where the word exists;
  otherwise **generated and verified** (rejoin invariant; syllables cross-checked against
  howmanysyllables.com per the 2026-07-03 method). Never runtime-AI.
- `meaning`, `sentences`, `synonym` (+ distractors) — **authored** (AI-drafted, then verified by
  me, editable by Nick). This is the main new-data cost and bounds the v1 pool size.

**v1 pool:** ~40–60 words, morpheme-tagged, chosen so the authored data is solid. Grows over time.

## Integration

- New `word-study.html` (follows the existing game-page chrome: `wordlab-common.css`, header,
  `wordlab-data.js` first, help/hints/teacher modules).
- Landing page **activity card**; dashboard **heatmap tab** (records via `recordAttempt` with a
  `word-study` activity key; **category = the word** — matches Breakdown Blitz's convention and
  enables word-level drill-down in the dashboard).
- XP/quarks + scientist reactions; Teacher Mode + round-based word count where they fit; EALD
  translation hook on the word (as other games).
- Stage-aware filtering (like other games): respect student stage; `filterByStage` safety net.
- **Handoffs (see Connected journey):** a small "🔬 Study this word" action in `morpheme-builder.html`
  (shown only for pool words) and a "🧱 Build with this" link in `flashcard-mode.html`. Both are
  additive navigation — no change to those pages' existing behaviour or data.

## Verification

Synthetic Playwright harness (no login), mirroring the phoneme rebuild: load the real page, drive
each stage for a sample of words, assert grading is correct (right answer passes, wrong fails) for
all 6 stages; assert the data invariants (syllables/phonemes rejoin; sentence has exactly one
correct; synonym answer ≠ distractors). Mobile 320–480px + low-stim checks. Zero failures = ship.

## Out of scope (v1)

- "Write your own sentence" stage (v2).
- Runtime AI generation / teacher-added words (later hybrid).
- Any change to the existing games' data.

## Success criteria

- A student picks a morpheme (or Surprise me), gets a real related word, and completes all six
  breakdown stages with correct grading throughout.
- All pool data verified (rejoin invariants pass; sentences/synonyms sane).
- Reads as one coherent "study this word deeply" flow, not six disconnected mini-games.
- Consistent with the WordLabs pattern (XP, dashboard, low-stim, EALD, stage-aware).
