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
| SOLO: Grow (guided lesson) | | | | | | | | |
| SOLO: Know (practice) | | | | | | | | |
| SOLO: Show (assessment) | | | | | | | | |
| SOLO: pre/post tests and reviews | | | | | | | | |

## Ideas queue

Add ideas found while working. Keep each to one line with the surface and the lens it serves.

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
