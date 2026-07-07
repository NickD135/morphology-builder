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

## Phase 1b — Phonemes (fable QA) + 7 syllable residuals — NOT STARTED
- [ ] Task 4: phoneme linter → flagged-phonemes.json
- [ ] Task 5: fable QA on flagged phonemes + the 7 syllable-residual words; apply under invariants gate
- Next: run Task 4 (linter) to produce the flagged phoneme list, then size the fable batch.

## Phase 2 — Deck generation — NOT STARTED (separate plan)
