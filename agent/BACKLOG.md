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
| meaning-mode.html | | | | | | | | |
| breakdown-mode.html | | | | | | | | |
| phoneme-mode.html | 3 | 3 | 3 (was 2) | 3 | 3 (was 2) | 2 | 17 (was 15) | 2026-10-12 |
| syllable-mode.html | 3 | 3 | 3 (was 2) | 3 | 3 (was 2) | 2 | 17 (was 15) | 2026-10-12 |
| sound-sorter.html | | | | | | | | |
| speed-mode.html | | | | | | | | |
| root-lab.html | | | | | | | | |
| homophone-mode.html | | | | | | | | |
| word-spectrum.html | | | | | | | | |
| word-refinery.html | | | | | | | | |
| spelling-test.html | | | | | | | | |
| SOLO: login and unit picker | | | | | | | | |
| SOLO: Grow (guided lesson), u31 | 3 | 4 | 3 | 3 | 3 | 2 | 18 | 2026-10-12 (u31 y5 now has chart + interactive; r4, y6, g2, g3 still text only) |
| SOLO: Know (practice), u31 | 3 | 3 | 2 | 2 | 3 | 2 | 15 | 2026-10-12 (most outcomes: one generic retry line, no hints; y5 fixed) |
| SOLO: Show (assessment), u31 | 3 | 3 | n/a | 2 | 3 | n/a | | 2026-10-12 (fairness risk: Know repeats Show questions) |
| SOLO: pre/post tests and reviews | | | | | | | | |

## Ideas queue

Add ideas found while working. Keep each to one line with the surface and the lens it serves.

- **SOLO u31 (and probably every unit): Know practice repeats Show questions word for word.** Exact text matches in u31: r1 4/9, r3 6/9, r4 6/9, y2 6/9, g1 6/9, g2 7/9 (y5 fixed in run 4). Students can memorise Show answers in Know. Give each outcome fresh Know numbers, one outcome per run, highest overlap first (fair assessment)
- SOLO u31 r4 (divide with remainders): no visual; add a sharing or grouping visual for the remainder, and a word-problem decision step (round up, round down, or keep the remainder) (Scaffolded)
- SOLO u31 g3 (solve equations): a balance-scale visual or interactive for "do the same to both sides" (Scaffolded, Stretch)
- SOLO Know: add `hint` and `why` to every question in u31 (most show only "Check your working and have another go") (Scaffolded)
- SOLO: reuse the new `pvShift` / `placeShift` visuals in u21 (powers of 10, one-tenth of) and u40 where decimals × ÷ powers of 10 appear (Scaffolded)

- Phoneme Splitter: data errors found in run 3: `conscientious` and `omniscient` list `t·i` / `sc·i` where `ti`/`sci` say /sh/; `baguette` and `guerrilla` treat the final e and `gu` inconsistently; review all Challenge words against `taught-graphemes.json` (Teaching practice)
- Phoneme Splitter: Need Advice ladder is strategy then phoneme count; add a third step that names the first multi-letter sound to keep together, reusing `_graphemeReason` (Scaffolded)
- Phoneme and Syllable Splitter: a read-aloud button on the "why" panel for students who read below level (Inclusive)
- At 1024px wide, game page headers wrap and the HUD pills overlap the brand row (seen on phoneme-mode); check all game headers at tablet width (polish)
- Syllable Splitter: the Need Advice ladder is clap, then count; add a third step that names the rule for the first break, using `_syllableBreakReason` (Scaffolded)
- Syllable Splitter: at 768px the game column is very narrow and long words wrap across three lines; check the tablet layout (Inclusive, polish)
- All fuel/round games: check whether wrong answers auto-advance before students can read the explanation (fixed in Syllable Splitter run 2 and Phoneme Splitter run 3; Breakdown Blitz still auto-advances since PR #18 was closed)
- Help popups describe controls but give no worked example ("I do"); add one modelled example per game (Scaffolded, Clear)
- SOLO: `units/SOLO_PROGRESS.md` status header is out of date (resources track)
- SOLO: dead or conflicting resource links listed in `SUGGESTIONS.md` (resources track)
