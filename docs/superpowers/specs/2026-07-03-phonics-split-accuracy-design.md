# Phonics Split Accuracy — Syllable, Phoneme & Sound Sorter Remediation

**Date:** 2026-07-03
**Status:** Approved design (brainstormed with Nick)
**Owner:** Nicholas Deeney (teacher — linguistic authority on all conventions here)

## Problem

Kids are struggling to be accurate in **Sound Sorter** and **Syllable Splitter**,
"especially after learning their rules for where to split syllables." A mechanical
audit of the three phonics games found real, concrete faults — not just fuzzy
inaccuracy:

| Game | Data location | Count | Finding |
|---|---|---|---|
| Syllable Splitter | `syllable-mode.html` `WORDS[]` | 172 | 0 rejoin errors, but splits need auditing against a vowel-sound rule; the **on-screen rule #3 is wrong** |
| Phoneme Splitter | `phoneme-mode.html` `WORDS[]` | 174 | **50 words are unwinnable** — answers stored as phonetic sounds the letter-grouping UI can never produce; plus non-grapheme boxes (`thr`, `ock`, `age`, `ine`) |
| Sound Sorter | `sound-sorter-data.js` `SOUND_SORTER_WORDS[]` | 1,692 | Mostly sound; 57 `a_e`/`e_e` "mismatches" are intentional; needs a linguistic spot-audit of target graphemes/distractors |

The `word_corrections` Supabase override table holds **1 row** — irrelevant. All
authoritative data is in the three JS files, so all fixes are code-side.

### Why the phoneme game is broken

`checkAnswer()` sets `units = word.split("")` (individual letters), lets the child
**merge adjacent letters** into grapheme boxes, then checks
`JSON.stringify(groupedLetters) === JSON.stringify(word.phonemes)`. The answer array
must therefore be a **contiguous partition of the word's own letters**. 50 entries
violate this (`write → r·igh·t`, `scheme → sch·ee·m`, `queue → k·yoo`, …) — the child
literally cannot select those boxes, so every attempt is marked wrong.

## Conventions (the linguistic source of truth)

### Syllable division — vowel-sound based (Nick's ruling)

Applied in priority order:

1. **One vowel *sound* per syllable.**
2. **Digraphs/blends representing one sound are never split** (`sh ch th wh ck ng ph`
   and vowel teams `ai ee oa …`). They count as a single consonant/vowel unit for the
   rules below.
3. **Common affixes usually form their own syllable** (morpheme boundary wins for
   productive affixes): `re·play`, `un·kind`, `help·ful`, `jump·ing`, `teach·er`,
   `sad·ness`.
4. **VC/CV** — two consonants between vowels → split between them:
   `but·ter`, `hap·py`, `gar·den`, `pen·cil`, `bas·ket`. Doubled consonants are a
   subset (`rab·bit`, `mit·ten`).
5. **One consonant between vowels — depends on the first vowel's sound:**
   - First vowel **long / open** → **V/CV**: `o·pen`, `ti·ger`, `pa·per`, `ro·bot`,
     `ba·sic`.
   - First vowel **short / closed** → **VC/V**: `lem·on`, `cab·in`, `rob·in`,
     `sev·en`, `plan·et`, `wag·on`.
6. **Consonant + `le`** takes the preceding consonant → `ta·ble`, `ap·ple`,
   `lit·tle`, `pur·ple`, `bun·dle`.

**On-screen rule text fix** (`syllable-mode.html`): rule #3 currently reads
"A single consonant between vowels usually goes with the next syllable: o·pen."
Replace with a two-part open/closed rule:
> "One consonant between vowels: if the first vowel is **long** it joins the next
> syllable (**o·pen, ti·ger**); if the first vowel is **short** it stays (**lem·on,
> cab·in**)."

Add a rule for consonant+le if space allows.

### Phoneme game — grapheme-grouping model

A **grapheme** = the letter(s) that spell one phoneme. Every answer box is a real
grapheme of the spelled word:

- **Single** letters: `c a t`.
- **Digraphs** (2 letters, 1 sound): `sh ch th wh ck ng ai ee oa oo ou ow oi er ar or`.
  Silent-letter pairs are digraphs too: `kn`(/n/), `wr`(/r/), `gn`(/n/), `mb`(/m/),
  `ph`(/f/), `wh`.
- **Trigraphs** (3 letters, 1 sound): `igh tch dge air ear ure`.
- **Quadgraphs** (4 letters, 1 sound): `ough augh eigh`.
- **Split digraphs** (NEW): vowel + silent-`e` spanning intervening consonant(s),
  written with an underscore: `a_e i_e o_e u_e e_e`. Example: `cake → c · a_e · k`,
  `write → wr · i_e · t`, `scheme → sch · e_e · m`.

Every re-encoded answer must satisfy: **removing the `_` from split digraphs and
concatenating all boxes reproduces the exact spelled word.** (For `a_e`, the `a` sits
at its position and the `e` is the word's trailing/silent e; the letters between them
are their own boxes.)

## Workstreams

### ① Syllable Splitter  (do first — quick win, named pain point)

1. Fix on-screen rule #3 text (above).
2. Re-audit all 172 `syllables[]` against the convention. Produce a **reviewable
   change list** (`word: old → new — reason`) for Nick to sign off before shipping.
   Expected majority of changes: short-vowel words currently split V/CV that should be
   VC/V.
3. Apply approved changes to `syllable-mode.html`; verify every split still rejoins to
   its word; push to `main`.

### ② Phoneme Splitter  (biggest lift — UI upgrade + full re-encode)

**UI upgrade — split digraphs.** The current model is `units[]` (letters) +
`splits[]` (boolean gaps) + adjacent-merge. Extend it so a child can **link a vowel
box to a later silent-`e` box** into one split-digraph grapheme spanning the
consonant(s) between them:

- Data contract: a split-digraph box is stored/compared as `"a_e"` (etc.). The
  grouping function and grader must produce and accept these.
- Interaction: a way to tie the vowel and the trailing `e` (e.g. a "link to magic-e"
  affordance on the vowel box, or dragging the vowel onto the `e`) — exact interaction
  chosen during planning; must be keyboard-accessible and touch-friendly (WCAG 2.1 AA,
  44px targets), and honour low-stim (no decorative motion required to use it).
- Preview + feedback + green-line "correct answer" display must render split digraphs
  as one chip labelled `a_e`.

**Data re-encode.** Rewrite all 174 `phonemes[]` to the grapheme-grouping model:
fix the 50 unwinnable words, split the non-grapheme boxes (`thr → th·r`,
`ock → o·ck`, `age → a·ge` where `ge` is soft-g /j/), and use split digraphs where
they apply. Verify the concatenation invariant for every word.

**Verification.** Synthetic Playwright harness (no login/Supabase), mirroring the
recent Lab Shop harnesses: render each word, script the correct grouping (incl. a
split digraph), assert it grades correct; assert a deliberately-wrong grouping grades
wrong; check preview chips, low-stim, and 320–480px mobile. This is the gate before
push.

### ③ Sound Sorter  (largest volume, lowest severity — do last)

Linguistic audit of the 1,692 entries. For each: is the **target `grapheme`** the
correct spelling of the stated `sound` in that word, are `before`/`after` placing the
blank correctly, and are the `distractors` plausible alternatives for that sound?
Confirm the 57 `a_e`/`e_e` entries are intentionally folding the silent-e into the
grapheme. Produce a **reviewable flag list** (only the entries that look wrong) for
Nick before shipping. Volume makes a full manual pass impractical, so the pass is
rule-assisted (programmatic reconstruction + grapheme/sound plausibility checks
surface candidates; Nick adjudicates the flagged subset). Log anything the pass
deliberately does not cover — no silent truncation.

## Change-review process (applies to ① and ③)

Data-correctness changes touch pedagogy, so Nick is the authority. For each audit
workstream I bring a concise `old → new — reason` list for sign-off **before** editing
the data file. The phoneme UI upgrade (②) is code Nick can't easily eyeball, so it is
gated on the synthetic harness instead, with a short owner checklist for a later
logged-in visual pass.

## Out of scope

- No change to the `word_corrections` DB table or the content-editor.
- No change to Sound Sorter's single-blank mechanic or the `a_e` grapheme convention it
  already uses.
- Custom teacher word lists / spelling sets (AI-generated splits) are not re-audited
  here — separate concern.
- Games other than these three.

## Verification summary

- **Invariants (all workstreams):** syllable/phoneme boxes reconstruct the exact word
  (split digraphs after removing `_`); Sound Sorter `before+grapheme+after` reconstructs
  the word (split-digraph entries excepted, as today).
- **Phoneme UI:** synthetic harness proves a split-digraph answer grades correct and is
  reachable by keyboard and touch.
- **Ship discipline:** each workstream is its own commit(s) to `main`; audits ship only
  after Nick signs off the change list.
