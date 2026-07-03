# Plan — Phoneme Splitter split-digraph upgrade + re-encode (Workstream ①)

Spec: `docs/superpowers/specs/2026-07-03-phonics-split-accuracy-design.md`
File: `phoneme-mode.html` (all changes in one file) + a synthetic harness under `tests/manual/`.

## Current mechanic (as-is)

- `units[]` = letter groups (start as single letters); `splits[]` = booleans between units.
- Student clicks gaps to `toggleSplit`, or `mergeAt`/`splitUnit` to bond/break letters.
- `getPhonemes()` concatenates units across non-split gaps → phoneme groups.
- `checkAnswer()` = `JSON.stringify(getPhonemes()) === JSON.stringify(word.phonemes)`.
- **Cannot express a split digraph** (`a_e` is non-contiguous: a … k … e). This is why 50
  words were fudged into phonetic sounds that can never be selected.

## New model (to-be) — `letters` + `boundaries` + `magic`

Replace the `units`/`splits`/merge machinery with a cleaner, index-stable model:

- `letters[]` — the word's letters, immutable for the word.
- `boundaries[]` — length `letters.length-1`, boolean: is there a phoneme break after
  letter *i*. Default all `false` (whole word = one box, same starting UX as today: the
  child adds breaks). Clicking a gap toggles the boundary.
- `magic` — `Set` of letter indices that are a **silent-e linked to an earlier vowel**
  (a split digraph). Toggled by a "✨ magic-e" affordance shown only on an `e` that has a
  preceding vowel letter in the word. Index-stable because `letters` never mutates.

Drop the redundant `merge`/`splitUnit` affordances (leaving a gap unbroken already joins
letters — merge was duplicate, and inner-splits go away with it). Net child-facing model:
**click a gap = break/join; click a silent-e = mark magic-e.** Simpler and it's the only
model that can express split digraphs.

### `getPhonemes(letters, boundaries, magic)` algorithm

1. Partition `letters` into contiguous groups by `boundaries`, **skipping** any index in
   `magic` (silent-e letters don't form or join groups).
2. For each `magic` index j: find the nearest preceding vowel letter (a,e,i,o,u,y),
   skipping other magic indices; append `"_e"` to the phoneme string of the group that
   contains that vowel.
3. Return the ordered group strings. Example `cake` (`c|a|k|e`, magic={3}) → `["c","a_e","k"]`.

Invariant used in tests: for every word, the *intended* correct grouping produces exactly
`word.phonemes`, and concatenating the boxes (with `_` stripped) reproduces the word.

### Functions to change
- `loadWord` / `resetWord` — init `letters`, `boundaries`, `magic`.
- `render` — draw letters + gap toggles + magic-e toggles; a magic-e pair shows the vowel
  and its linked `e` connected (arc/underline) with the `e` greyed. Keep `wlAutoFitChop`.
- `getPhonemes`, `updatePreview` (chip render — split digraph is one `a_e` chip),
  `checkAnswer` (unchanged comparison, new getPhonemes).
- Remove `mergeAt`, `splitUnit`, inner-gap rendering.
- Accessibility: gaps and magic-e toggles are real `<button>`s, keyboard reachable,
  `aria-label`s ("insert sound break", "mark silent e"); 44px targets; low-stim safe
  (no decorative motion needed to operate).

## Data re-encode (all 174 `phonemes[]`)

Rewrite each answer to the grapheme model. Rules:
- Each box is a real grapheme: singles; digraphs (`sh ch th wh ck ng ph ai ee oa oo ou ow
  oi oy ar or er ir ur aw au ea ey`); silent-letter digraphs (`kn wr gn mb`); trigraphs
  (`igh tch dge air ear ure`); quadgraphs (`ough augh eigh`); **split digraphs** `a_e i_e
  o_e u_e e_e`.
- Fix the 50 unwinnable words (phonetic → grapheme). Fix non-grapheme boxes
  (`thr→th·r`, `ock→o·ck`, `age→a·ge`, `ine→…`).
- Plain silent-e that is NOT a split digraph (short-vowel `-ive`, `-le`, etc.) stays
  contiguous, attached to the preceding consonant (`creative → c·r·e·a·t·ive`? no — encode
  as real graphemes; the trailing silent e attaches: `…tive`→`t·i·ve`). Only *long-vowel*
  magic-e uses `V_e`.
- **Invariant check (hard gate):** strip `_`, concatenate all boxes → must equal the word,
  for all 174. Words that can't be cleanly graphemically segmented (genuinely irregular,
  e.g. `queue`, `silhouette`, `pneumonia`) get flagged and either fixed or removed rather
  than fudged.

## Verification — synthetic harness (no login/Supabase)

`tests/manual/phoneme-split-digraph-harness.html` loads the real `WORDS` + game functions
and, headless via Playwright:
- For each word, programmatically set the correct `boundaries`+`magic` and assert
  `checkAnswer` marks it correct; assert a deliberately-wrong config marks it wrong.
- Assert at least the split-digraph subset renders an `a_e` chip in preview and that the
  magic-e toggle is keyboard-operable.
- Low-stim: operable, no decorative motion. Mobile 320–480px: no overflow.
- Report pass/fail counts; zero failures is the gate to push.

## Ship
- One or two commits to `main`. Owner checklist (`tests/manual/…-checklist.md`) for a later
  logged-in visual pass (harness can't judge feel/aesthetics of the magic-e link).
