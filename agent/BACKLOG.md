# Improvement agent backlog

## Student lens audit

Score each surface 1 (poor) to 4 (strong) on each lens from IMPROVEMENT_AGENT.md after walking through it as a Year 5/6 student. Work on the lowest totals first. Rescore a surface after changing it.

| Surface | Clear | Structured | Scaffolded | Engaging | Inclusive | Stretch | Total | Last audited |
|---|---|---|---|---|---|---|---|---|
| landing.html (student view) | | | | | | | | |
| morpheme-builder.html | 3 | 3 | 2 | 3 (was 2: 61 dead-end tiles) | 3 | 3 | 17 | 2026-10-15 (33 dead tiles now build words; 28 left for Nicholas) |
| flashcard-mode.html | | | | | | | | |
| word-study.html | | | | | | | | |
| mission-mode.html | 2 (clues still awkward for roots) | 3 | 3 (was 1: no why, auto-advance) | 3 | 3 (was 2: marks colour only) | 2 | 16 (was 13) | 2026-10-15 (real-word answers, false splits removed, fair options, why panel) |
| meaning-mode.html | 3 | 3 | 3 (was 2) | 3 | 3 (was 2: reading under time pressure, marks colour only) | 2 | 17 (was 15) | 2026-10-13 (why panel, fair options) |
| breakdown-mode.html | 3 | 3 | 3 (was 2) | 3 | 4 (was 3: lag on Chromebooks, low stim not applied) | 2 | 18 (was 17) | 2026-10-15 (typing lag fixed; low stim and reduced motion stop scene motion) |
| phoneme-mode.html | 3 | 3 | 3 (was 2) | 3 | 3 (was 2) | 2 | 17 (was 15) | 2026-10-12 |
| syllable-mode.html | 3 | 3 | 3 (was 2) | 3 | 3 (was 2) | 2 | 17 (was 15) | 2026-10-12 |
| sound-sorter.html | 3 | 3 | 3 (was 2) | 3 | 3 (was 1: no keyboard play) | 2 | 17 (was 14) | 2026-10-13 |
| speed-mode.html | | | | | | | | |
| root-lab.html | 3 (was 2: help text wrong) | 3 | 3 (was 2: no why, empty Analyse marked wrong) | 3 | 3 (was 2: meaning marks colour only, full-screen stamp in low stim) | 3 (typed Challenge with fair alternative splits) | 18 (was 14) | 2026-10-15 (why panel, nudge, alternative splits, last word waits) |
| homophone-mode.html | 3 | 3 | 3 (was 1: no why, auto-advance, right word shown in red) | 3 | 3 (was 2: marks colour only, no keyboard focus after answers) | 2 | 17 (was 14) | 2026-10-16 (why panel with meanings and memory tricks, 4 paragraph data bugs) |
| word-spectrum.html | | | | | | | | |
| word-refinery.html | | | | | | | | |
| spelling-test.html | | | | | | | | |
| SOLO: login and unit picker | | | | | | | | |
| SOLO: Grow (guided lesson), u31 | 4 | 4 | 4 | 3 | 3 | 3 | 21 | 2026-10-12 (whole unit reworked; g2 still has no visual) |
| SOLO: Know (practice), u31 | 4 | 3 | 4 | 3 | 3 | 3 | 20 | 2026-10-12 (whole unit: fresh numbers, hint + why on all 130, a challenge item per outcome) |
| SOLO: Show (assessment), u31 | 4 | 3 | n/a | 2 | 3 | n/a | | 2026-10-12 (Know overlap removed; 6 Show fixes) |
| SOLO: pre/post tests and reviews | | | | | | | | |

## Requested by Nicholas (do first)

- Morpheme Builder dead tiles: done in run 19 (PR stacked on #30). **Waiting on Nicholas** for the 28 tiles still left: hide, keep, or suggest words. The list with reasons is in the PR.

## Ideas queue

- Root Lab: the 46 Challenge words are 2/3 of the pool and many are s4 (photosynthesis, antidisestablishment); Mixed for an s3e student is mostly typing. Check the Challenge share per stage with `weightByStage` and consider more Level Up words (Structured, Stretch)
- Root Lab Challenge: other words where a student could defensibly split differently (demonstration de + monstr + ation vs demonstrate + ion, communication) still only accept the listed alternatives; extend `alts` with Nicholas's convention (same question as Breakdown Blitz psychology) (Teaching practice)
- Round complete overlays in the other games (Phoneme, Syllable, Sound Sorter, Mission, Meaning, Breakdown): check whether focus moves to Play Again; in Root Lab it stayed behind the overlay until run 21 (Inclusive, keyboard)
- Root Lab: the CASE HISTORY and INVESTIGATION PROTOCOL panels use an em dash and "Each correct zone = +10 pts"; rewrite the protocol in plain Year 5 language (Clear)
- Root Lab: Need Advice step 2 now names the first part's meaning word, which gives the base away on bases ("think jump"); a gentler step 2 and a third step would suit the ladder used in other games (Scaffolded)
- Root Lab Teacher Mode: `_showTeacherNext` lived inside the DOMContentLoaded handler, so checkAnswer threw in Teacher Mode (fixed run 20 by showing the button directly); check the other games for the same pattern (code health)
- Morpheme Builder (run 19): 22 built words already on main have no Word Study page (watcher, taker, takers, constructor, misspelled, photos…) and the 115 new words from run 19 have none either. Word Study now says so; the real fix is running the scripts/word-study/ pipeline for them (Teaching practice)
- Morpheme Builder junk that builds today on main: believeable, missy, philly, phillies, moby, dems, regs, reged, vac, vids, secs. Add them to EXCLUDE_WORDS in scripts/build-valid-combos.js with Nicholas, alongside moving Mission Mode's `_MX_FALSE_SPLITS` into the build (Teaching practice)
- Build rule: base + es where base + s gives the same word (theatres, spheres, makes) and y + ty / y + fy (humanity, brevity) are false splits all through valid-combos.json. Run 19 blocked only the new ones; a general rule in scripts/build-valid-combos.js would remove the rest. Check every removal (Teaching practice)
- Build rule: y → i is applied to Greek forms (poly + hedron → "polihedron", oxy + gen → "oxigen"), so polyhedron and oxygen can never build. A Greek-only exception would revive the oxy base (Teaching practice)
- Morpheme Builder: 15 tiles only build words with a partner one stage up (cred and aud need s2l; kinesis, hedron, litho, ortho, gyro, geno need s4). Re-stage or add a word at the tile's own stage (Scaffolded)
- word-phoneme-data.json is stale against its generator (regenerating changes 338 entries), so new combo words have no syllable/phoneme data for suggested sets. Check with Nicholas before regenerating (code health)

Add ideas found while working. Keep each to one line with the surface and the lens it serves.

- Homophone Hunter Transmission: only the homophones are clickable and they have extra space around them, so the wrong words are easy to spot without reading. Make every word clickable (most are "already right") so students have to read (Teaching practice, Stretch)
- Homophone Hunter Transmission: after a wrong pick the panel names the right word, so the next click on it earns full XP; consider no XP for a word fixed after a reveal (Engaging, fairness)
- Homophone Hunter data: many `why` lines use em dashes and adult words ("Verb — it will influence", "An entitlement or privilege", "Climate conditions"); rewrite in Year 5 words. The why panel already turns " — " into ": " (Clear)
- Homophone Hunter: the 77 meanings in `_HH_MEANING` could also feed Need Advice step 2 instead of `q.why`, which often gives the answer away ("The bags belong to them") (Scaffolded)
- Homophone Hunter: pairs that sound different in Australian English are taught as homophones (pour/paw/poor, hour/our, descent/dissent, council/counsel for some speakers); check each with Nicholas (Teaching practice)
- Homophone Hunter: a read-aloud button on the why panel, as in the backlog for other games (Inclusive)

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
- All fuel/round games: check whether wrong answers auto-advance before students can read the explanation (fixed in Syllable Splitter run 2, Phoneme Splitter run 3, Breakdown Blitz run 5). Sound Sorter fixed run 8, Meaning Match-Up run 11. Mission Mode fixed run 15. Root Lab checked run 20 (wrong answers never auto-advanced, but the last word of a round did jump to the results). Homophone Hunter fixed run 22. All 13 games with rounds now checked
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
- data.js examples: several are wrong or not words and also show in Flashcards: `irrepairable`, `overask`, `badger` (bad), `history-maker`; `-ative` uses creative (create + ive); many base examples underline the suffix not the base (`ask<u>ed</u>`, `repair<u>ed</u>`). Fix in data.js in one data PR, then drop the matching entries from `_MM_SKIP_EXAMPLES` in meaning-mode.html (Teaching practice)
- data.js: suitability check of s4 examples (homicide, suicide, necromancy, narcotic, monogamy, sociopath). Meaning Match-Up skips them as model words, but Flashcards still shows them (Clear)
- Meaning Match-Up: Support Mode label repeats the type ("Which prefix means: PREFIX"); show it once (Clear, polish)
- Meaning Match-Up: Need Advice ladder is strategy then first letter; a third step could give an example word with the morpheme hidden (un___ → "_happy") (Scaffolded)
- data.js: American spelling `anemia` under -emia; use anaemia (Clear)
- data.js examples that use another meaning of the morpheme (fastness, breakfast, contraband, submerge, recollect, jumper, miniature, building for -ing; remerge and outjump are real but unusual) are skipped in Meaning Match-Up only; Flashcards and worksheets still show them. Fix at source in data.js with Nicholas (Teaching practice)
- data.js: odd extension model morphemes -URIA (glycosuria) and -ASE (amylase), and American `anemia` (Clear)
- Meaning Match-Up: bases still have a few near-synonym pairs the starts-with rule misses (SEE/VIEW/WATCH vs SPEC/SPECT); add them to `_MM_SAME_MEANING` (it exists since run 14) once checked by hand. Longer term, a `sameAs` field in data.js would let Mission Mode and Flashcards share the list (Teaching practice)
- Other games that look morphemes up by id (Mission Mode, Flashcards, dashboard getCategoryStage): check en, pod, phone, vore are typed correctly (code health)
- Meaning Match-Up: a read-aloud button on the why panel for students who read below level (Inclusive)
- **Mission Mode clues (next):** the target meaning is built from pattern + base meaning, which reads badly for bound roots and multi-sense prefixes (the 15 in- "into" words got hand-written clues in run 17; still "dis + miss = not or opposite of send", "a + spect = not or without look", "a person who mins", "full of phon"). Real fix: use each answer word's own meaning from word-study-data.js (3,589 words; load it lazily or extract a small meanings file with a script) and only offer pairs that have one (Teaching practice, Clear)
- valid-combos.json false splits: Mission Mode now skips 248 pairs in `_MX_FALSE_SPLITS` (run 16), but Morpheme Builder and Word Study still offer them. Move the list into scripts/build-valid-combos.js (blocklist) with Nicholas, rebuild, then delete the page-level list. Earlier note: min + ing (mining), min + er (miner), tri + es (tries), ver + y (very), terr + y (terry), phil + ly (philly), dem + s, corp + s, sec + ure (secure), fin + ance, man + age (manage), man + ure, ten + ure. Fix in scripts/build-valid-combos.js blocklist with Nicholas, then rebuild (Teaching practice)
- Mission Mode: _MX_SAME_MEANING duplicates meaning-mode.html's list; move both to one shared helper (or a sameAs field in data.js) so they cannot drift (code health)
- Mission Mode Teacher Mode still uses the old one-line feedback; reuse _mxBuildWhy there (Clear)
- Mission Mode: allow a same-meaning distractor only when it makes no word with the base (UN-/DIS-/IN- for HAPPY), with a panel line "a good meaning, but dis + happy is not a word". Restores the hardest useful question and keeps a teacher's set of "not" prefixes playable. Ask Nicholas first: #28's reviews asked for one right answer by meaning (Teaching practice, Stretch)
- Mission Mode: -S clue on verbs reads "more than one see / organise / believe"; use "he or she {base}s" when the base is only a verb (Clear)
- data.js suffix meanings miss common senses: -en has no past participle sense (seen, taken), -ent/-ant are only "person or thing that" (potent, vacant, expectant, lucent are describing words; skipped in Mission Mode run 17), and over- is only "too much" (oversee, overnight skipped). Add the senses in data.js with Nicholas, then Mission Mode can use those words again (Teaching practice)
- All game pages: scene props animate opacity on SVG children (`<ellipse style="animation:propGlow">`), which repaints the whole prop on the main thread every frame. Counts: phoneme 4, meaning 3, mission 3, sound-sorter 3, homophone 2, syllable/root-lab/refinery/spectrum 1. Fixed in Breakdown run 18 (one overlay svg animated as a whole); port the same pattern (Polish, Inclusive)
- All game pages: decorative scene motion (particles, steam, props) is not stopped by low stim or `prefers-reduced-motion`. Breakdown fixed run 18; port the same CSS block to the other 12 games (Inclusive)
- Sound Sorter: the game panel also has `backdrop-filter: blur(8px)` over drifting particles; in Breakdown removing it took idle frames from about 20 to 60 fps in headless. Measure and remove if the panel is near opaque (Polish)
- wordlab-data.js: turning low stim on mid-session via `loadLowStimMode()` adds the class but not the `#wlLowStimCSS` stylesheet (only added at page load). Low risk; check if teachers toggle it during lessons (Inclusive)
- Breakdown Blitz: unload is taught as un- "not"; in unload, untie, unlock un- means "reverse the action". Same sense issue as Mission Mode run 17 (Clear)
