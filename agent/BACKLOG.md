# Improvement agent backlog

## Student lens audit

Score each surface 1 (poor) to 4 (strong) on each lens from IMPROVEMENT_AGENT.md after walking through it as a Year 5/6 student. Work on the lowest totals first. Rescore a surface after changing it.

| Surface | Clear | Structured | Scaffolded | Engaging | Inclusive | Stretch | Total | Last audited |
|---|---|---|---|---|---|---|---|---|
| landing.html (student view) | | | | | | | | |
| morpheme-builder.html | | | | | | | | |
| flashcard-mode.html | | | | | | | | |
| word-study.html | | | | | | | | |
| mission-mode.html | | | | | | | | |
| meaning-mode.html | 3 | 3 | 3 (was 2) | 3 | 3 (was 2: reading under time pressure, marks colour only) | 2 | 17 (was 15) | 2026-10-13 (why panel, fair options) |
| breakdown-mode.html | 3 | 3 | 3 (was 2) | 3 | 3 (was 2) | 2 | 17 (was 15) | 2026-10-13 (7 wrong answer splits fixed; splits now tested) |
| phoneme-mode.html | 3 | 3 | 3 (was 2) | 3 | 3 (was 2) | 2 | 17 (was 15) | 2026-10-12 |
| syllable-mode.html | 3 | 3 | 3 (was 2) | 3 | 3 (was 2) | 2 | 17 (was 15) | 2026-10-12 |
| sound-sorter.html | 3 | 3 | 3 (was 2) | 3 | 3 (was 1: no keyboard play) | 2 | 17 (was 14) | 2026-10-13 |
| speed-mode.html | | | | | | | | |
| root-lab.html | | | | | | | | |
| homophone-mode.html | | | | | | | | |
| word-spectrum.html | | | | | | | | |
| word-refinery.html | | | | | | | | |
| spelling-test.html | | | | | | | | |
| SOLO: login and unit picker | | | | | | | | |
| SOLO: Grow (guided lesson), u31 | 4 | 4 | 4 | 3 | 3 | 3 | 21 | 2026-10-12 (whole unit reworked; g2 still has no visual) |
| SOLO: Know (practice), u31 | 4 | 3 | 4 | 3 | 3 | 3 | 20 | 2026-10-12 (whole unit: fresh numbers, hint + why on all 130, a challenge item per outcome) |
| SOLO: Show (assessment), u31 | 4 | 3 | n/a | 2 | 3 | n/a | | 2026-10-12 (Know overlap removed; 6 Show fixes) |
| SOLO: pre/post tests and reviews | | | | | | | | |

## Ideas queue

Add ideas found while working. Keep each to one line with the surface and the lens it serves.

- **Other SOLO units: check for Know practice repeating Show questions.** It did in u31 (fixed 2026-10-12), so other units probably have it too. Run `validate.js`-style checks unit by unit, one whole unit per PR (fair assessment)
- SOLO u31 g3: an interactive balance scale for "do the same to both sides" (bar models were added as a static scaffold) (Scaffolded, Stretch)
- SOLO u31 resource gaps with no verified exact match yet: r2 end zeros, r3 factorising, y3 building a table of multiples (Resources)
- Commit a shared u31 validator under tests/ (MC answer in options, arithmetic, no Know/Show overlap) and generalise it to all units (code health)
- SOLO Know: add `hint` and `why` to every question in u31, in the same whole-unit PR as the fresh numbers (most show only "Check your working and have another go") (Scaffolded)
- SOLO: reuse the new `pvShift` / `placeShift` visuals in u21 (powers of 10, one-tenth of) and u40 where decimals × ÷ powers of 10 appear (Scaffolded)

- Phoneme Splitter: data errors found in run 3: `conscientious` and `omniscient` list `t·i` / `sc·i` where `ti`/`sci` say /sh/; `baguette` and `guerrilla` treat the final e and `gu` inconsistently; review all Challenge words against `taught-graphemes.json` (Teaching practice)
- Phoneme Splitter: Need Advice ladder is strategy then phoneme count; add a third step that names the first multi-letter sound to keep together, reusing `_graphemeReason` (Scaffolded)
- Phoneme and Syllable Splitter: a read-aloud button on the "why" panel for students who read below level (Inclusive)
- Syllable Splitter: the Need Advice ladder is clap, then count; add a third step that names the rule for the first break, using `_syllableBreakReason` (Scaffolded)
- Game headers (done run 7): the widget's dance reactions can be clipped now the header controls are a scroll box (phoneme, flashcards and others already were); check a 10-streak dance on a Chromebook (polish)
- Homophone Hunter: no mute button or student name pill in the header at any width (its `wlPillSlot` sits before the widget but stays empty); check why (polish, Inclusive)
- Speed Builder at 768px: with the extra Base and Time pills the title truncates to "S…"; consider hiding the Base pill in the header on narrow screens (polish)
- Syllable Splitter: at 768px the game column is very narrow and long words wrap across three lines; check the tablet layout (Inclusive, polish)
- All fuel/round games: check whether wrong answers auto-advance before students can read the explanation (fixed in Syllable Splitter run 2, Phoneme Splitter run 3, Breakdown Blitz run 5). Sound Sorter fixed run 8, Meaning Match-Up run 11. Still to check: Mission Mode (1.5 s auto-advance on wrong), Root Lab, Homophone Hunter (2.2 to 2.8 s)
- Breakdown Blitz: the Why list can reach 5 lines when every box is wrong; consider showing the first two and a "Show more" for Ben (Clear)
- Help popups describe controls but give no worked example ("I do"); add one modelled example per game (Scaffolded, Clear)
- SOLO: `units/SOLO_PROGRESS.md` status header is out of date (resources track)
- SOLO: dead or conflicting resource links listed in `SUGGESTIONS.md` (resources track). Now fixable directly under hard rule 3a: check the live `resources` rows, fix them, and remove the conflicting hardcoded blocks
- Sound Sorter: Need Advice gives a strategy, then where the sound sits in the word; add a third step that names the position convention for this word (e.g. "at the end of a word, long a is usually ay"), reusing `_ssWhyNot` logic (Scaffolded)
- Sound Sorter: 190 distractors are never a spelling of the target sound anywhere in the game (e.g. "au" for Short A in calf, "nk" for NG in ring); review those distractor lists so every option is a real way to spell the sound (Teaching practice)
- Sound Sorter: check every other tile game for div "buttons" that cannot be reached by keyboard (Meaning Match-Up, Mission Mode, Root Lab) (Inclusive)
- Sound Sorter: some sound labels read awkwardly in feedback ("EAU = OH sound", "Diminutive -ette ending sound"); tidy `soundLabel` in `sound-sorter-data.js` (Clear)
- Sound Sorter data, Aus English check of the rest of the pool: oo-short "ou" words (gourmet, bouquet, tour, detour) and other trap-bath or au words outside the 13 fixed in run 9; consider whether "damn" belongs in the game at all (Teaching practice)
- Sound Sorter Teacher Mode feedback still says "/OR sound/ sound"; reuse `_ssSoundName` there (Clear, polish)
- SOLO resources: the dead u23 Beyond link (mathsisfun.com/geometry/triangle-area.html, 404) still needs a verified replacement. Candidates from search, not yet opened: mathsisfun.com/area.html (shapes incl. triangle) or the existing Mr J triangle video only. Needs a run where WebFetch can open pages (Resources)
- Breakdown Blitz: one fixed answer per word means "emotion + al" for emotional is marked 0 of 4, though it is a sensible split. Consider accepting a second valid analysis per word (an `alt` answers field), so students are not marked wrong for real morphology (Teaching practice, Scaffolded)
- Breakdown Blitz: 39 more words where the answer is a defensible split but differs from word-study (e.g. hyperactive hyper+active vs hyper+act+ive, psychology psych+ology vs psycho+logy). Pick one convention per pattern with Nicholas before changing (Teaching practice)
- data.js: the `a-` prefix examples include "asexual"; swap it for a more suitable Year 5/6 example (Clear)
- Run tests/test-breakdown-splits.js in any PR that touches Breakdown Blitz words; consider a similar rebuild check for Mission Mode and Root Lab pools (code health)
- Mission Mode: probably has the same "two right answers" risk as Meaning Match-Up (random distractors); reuse the shared-meaning check from meaning-mode.html, and add the why panel (Teaching practice, Scaffolded)
- data.js examples: several are wrong or not words and also show in Flashcards: `irrepairable`, `overask`, `badger` (bad), `history-maker`; `-ative` uses creative (create + ive); many base examples underline the suffix not the base (`ask<u>ed</u>`, `repair<u>ed</u>`). Fix in data.js in one data PR, then drop the matching entries from `_MM_SKIP_EXAMPLES` in meaning-mode.html (Teaching practice)
- data.js: suitability check of s4 examples (homicide, suicide, necromancy, narcotic, monogamy, sociopath). Meaning Match-Up skips them as model words, but Flashcards still shows them (Clear)
- Meaning Match-Up: Support Mode label repeats the type ("Which prefix means: PREFIX"); show it once (Clear, polish)
- Meaning Match-Up: Need Advice ladder is strategy then first letter; a third step could give an example word with the morpheme hidden (un___ → "_happy") (Scaffolded)
- data.js: American spelling `anemia` under -emia; use anaemia (Clear)
- data.js examples that use another meaning of the morpheme (fastness, breakfast, contraband, submerge, recollect, jumper, miniature) are skipped in Meaning Match-Up only; Flashcards and worksheets still show them. Fix at source in data.js with Nicholas (Teaching practice)
- data.js: odd extension model morphemes -URIA (glycosuria) and -ASE (amylase), and American `anemia` (Clear)
- Meaning Match-Up: bases still have a few near-synonym pairs the starts-with rule misses (SEE/VIEW/WATCH vs SPEC/SPECT); consider a small synonym list (Teaching practice)
- Other games that look morphemes up by id (Mission Mode, Flashcards, dashboard getCategoryStage): check en, pod, phone, vore are typed correctly (code health)
- Meaning Match-Up: a read-aloud button on the why panel for students who read below level (Inclusive)
