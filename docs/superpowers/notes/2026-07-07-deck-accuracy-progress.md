# Deck Accuracy — Progress Checkpoint (2026-07-07)

Spec: docs/superpowers/specs/2026-07-07-teaching-deck-accuracy-design.md
Plan (Phase 1): docs/superpowers/plans/2026-07-07-deck-accuracy-phase1.md
Branch: feat/deck-accuracy-phase1

## Phase 1a — Syllables — ✅ COMPLETE (multi-source)
Sources ended up being TWO authoritative sites (the plan assumed one):
- howmanysyllables.com publishes a hyphenated DIVISION for only a subset; a COUNT for the rest.
- syllablecount.com added as a 2nd division source (owner-suggested; wordhelp.com refused connections from this host).
- Count-verification fallback: where no site gives a division, verify the split's LENGTH against the authoritative count.

Final `syllablesSource` breakdown (3522 words):
- hms  = 2405  (division-verified, howmanysyllables)
- sc   =  473  (division-verified, syllablecount)
- hms-count = 248 (count-verified — right count, split points = original AI split; "lean" per owner)
- pool =  35   (curated)
- agent 1-syllable (trivially correct) = 354
- agent multi-syllable UNRESOLVED = 7  → deferred to Phase 1b fable (scripts/deck-accuracy/syllable-residual.json)

0 syllable-invariant failures across all 3522 words.
State files: scripts/deck-accuracy/state-syllables.json (hms), state-sc.json (syllablecount).

## Phase 1b — Phonemes + 7 syllable residuals — ✅ COMPLETE
- Linter flagged 452 → found they were SYSTEMATIC (word-study used untaught `io` for -tion, split `n/g`).
- Deterministic rule-fix (fix-phonemes-rules.js) aligned to taught-graphemes.json: -tion/-sion/-cian → ti/si/ci+o/a+n
  (incl. inflections); word-final /ng/ → `ng`. 389 fixed, gated, 0 failures. Flagged 452 → 89.
- Fable QA (fable 5, 1 agent) on the 89 phonemes + 7 syllable residuals: 89 phoneme + 7 syllable applied,
  0 gate rejects. Flagged 89 → 28.
- The 28 residual flags are VERIFIED-CORRECT (linter false positives): valid graphemes absent from the
  taught-141 list (y_e, gue, sci, dg) or genuine separate n/g (angle, danger, congress). No action needed.

## Phase 1 — ✅ COMPLETE. Final: 0 invariant failures across 3522 words.
syllablesSource: hms 2405 + sc 473 (division-verified) · hms-count 248 (count-verified) · fable 7 · pool 35 · agent 354 (all 1-syllable, trivially correct).
Branch feat/deck-accuracy-phase1 — NOT merged, NOT pushed. Commits 95cf6cb..079f637.

## Phase 2 — Deck generation — NOT STARTED
Next: write the Phase 2 plan (rewrite generate-all-decks.js data layer to derive DATA from the now-hardened
word-study-data.js + valid-combos.json; matrices from real combos; no repeats; fable only for prose; hard
validation gate per deck; regenerate ~360 decks).

## Phase 2 — Deck generation — ✅ COMPLETE (branch feat/deck-accuracy-phase2)
Deterministic generation from hardened word-study data + word-study-derived matrices. ZERO AI/tokens.
- 333/360 decks regenerated: real matrices, verified syllable/phoneme splits, verified sentences,
  no repeated focus words across the week. Every generated deck passes validateDeckData; 12/12
  random re-validations green.
- 27 morphemes NOT regenerated (FAILED:insufficient-words, <3 verified words) — keep their existing
  decks (documented exceptions): bases remove, claus, thermo, phon, chrono, photo, aero, tele, gyro,
  endo, horo, stetho, kaleido, lingual, pod, violet, curricular, terrestrial, vore; prefixes em,
  hyper, hypo; suffixes hood, ious, eous, sion, pathy.
- No 404s: all 360 morphemes have a deck file on disk (333 new + 27 old).
- Tooling: scripts/deck-accuracy/deck-data.js (builder+gate), generate-decks-v2.js (runner), state-decks.json.
Branch feat/deck-accuracy-phase2 — NOT merged, NOT pushed.

## Phase 2b — Revive the 27 sparse morphemes (owner-requested)
- Type-fix (free): tele(22)/photo(8)/chrono(6)/horo(3) were real prefixes mislisted as bases → built as prefix content. pod/vore → suffix. remove(=re+move) skipped.
- +67 verified words generated (fable) for 13 feasible morphemes, authority-verified syllables + gated. word-study 3522→3589.
- -pathy family re-tagged X+pathy for consistency.
- **Result: 350/360 decks regenerated from verified data** (was 333). 9 genuinely infeasible keep old decks:
  claus, gyro, endo, stetho, kaleido, lingual, violet, curricular, terrestrial (English lacks 3+ real words). remove dropped.
- App-wide integration of the 67 new words:
  - ✅ Word Study game, teaching decks, spelling/Speed Builder (dictionary.txt)
  - ✅ Morpheme Builder: 11/67 buildable (valid-combos rebuilt 4353→4368; bound-root fixes preserved)
  - ⏳ FOLLOW-UP: remaining 56 need component bases (stat/neighbour/link…) added to data.js to build
  - ⏳ FOLLOW-UP (optional): seed the 13 morphemes' `examples` in data.js so new words surface in Flashcards/Meaning/Mission (morphemes already have 6+ examples, so already practisable)
Branch feat/deck-accuracy-phase2 — NOT merged/pushed.
