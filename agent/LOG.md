# Improvement agent log

One dated entry per run, newest first. A few lines each: what was worked on, the PR, and anything the next run should know.

## 2026-10-12 — run 6 (hold: no new PR)
Three agent PRs were open with no review from Nicholas (#22 Phoneme Splitter, #23 SOLO Unit 31, #24 Breakdown Blitz; stacked in that order, all mergeable). Hard rule 2 applies, so no new PR this run. No human comments to act on, so nothing to revise. This entry was added to the top of the stack (#24's branch) so it merges with the rest. Next run: check the stack first; if it is still unreviewed, hold again rather than stacking a fourth PR.

## 2026-10-12 — run 5 (student experience: Breakdown Blitz "why" feedback, small redo of #18)
Breakdown Blitz wrong answers now show a short Why list under the correct breakdown, one line per wrong box only: what the prefix, base or suffix is and what it means (meanings from `data.js`), a part typed in the wrong box ("You wrote ness in the prefix box…"), and the spelling change when the base looks different inside the word (y to i, dropped e, doubled consonant; checked against all 303 words, 18 trigger). A build line (un + happy + ness → unhappiness) closes it. Wrong answers no longer auto-advance after 3.5s; Next word gets focus so Enter continues. Fuel holds while the explanation is on screen (flagged in the PR; one line to revert). Kept small on purpose, per the #18 lesson: no data changes, no other balance changes. Stacked on PR #23 (which is stacked on #22) so the agent/ files do not conflict.

## 2026-10-12 — run 4, continued (whole of SOLO Unit 31, on Nicholas's request)
Nicholas asked for the whole unit to be audited and fixed at once, and gave permission for the SOLO `resources` table (hard rule 3a; SQL file only, he runs it). Added to PR #23:
- Know rewritten for all 13 outcomes: 130 questions, no overlap with Show, a hint and why line on each.
- Grow numbers moved off Show, with tighter hint ladders and new visuals.
- Six Show fixes, two of them real bugs: r3 Q6 wording was wrong, and y4 Q9 had two correct answers.
- Resources: an audit, `solo/u31_resources_fix.sql`, and a rebuilt program docx and appendix.

Supabase could not be read: the egress proxy blocks it. The resource SQL is therefore targeted, deleting only named rows by URL.

## 2026-10-12 — run 4 (on-demand: SOLO Unit 31)
Nicholas asked for Unit 31 this run (track rotation skipped). Walked Grow, Know and Show in mock mode as Ben and Chloe. Picked Y5 (× and ÷ decimals by powers of 10): it had no visual at all for a spatial idea, and Know reused 7 of 9 Show calculations. Added a place value chart visual (`pvShift`) and an interactive (`placeShift`) with a Mystery move challenge for early finishers, fresh Know and try-it numbers, a hint and why line on every Know question. Show untouched. Added `__WL_MOCK__.add()` to mock mode so the Grow button can be shown with fake resource rows. Branch is stacked on PR #22 so the agent/ files do not conflict; the PR targets that branch and retargets to main when #22 merges.

## 2026-10-12 — run 3 (student experience: Phoneme Splitter feedback)
Phoneme Splitter wrong answers now explain why, in student words, only for what the student got wrong: sounds they broke apart (digraph, vowel team, bossy r, double letters, silent letter, -tion ti), a magic-e they missed or marked wrongly, and boxes holding more than one sound. Wrong answers no longer auto-advance after 3s; Next word gets focus and scrolls into view, and the last word says See my results. Reset is disabled after Check (it reopened a marked word and allowed a second scored check). Fixed `plateau` data (pl was one phoneme). Gaps were already keyboard buttons, so the backlog item about that was closed. PR #18 (Breakdown Blitz) was closed unmerged after #20 merged, probably due to the agent/ file conflict; not redone this run.

## 2026-10-12 — run 2 (teaching practice: Syllable Splitter feedback)
Syllable Splitter wrong answers now say why each missed chop goes where it does, in student words, tagged with the numbered rule from the page's own Syllable rules panel (VC/CV, open/closed syllables, consonant-le, suffixes, vowel teams). Extra chops are named. Fixed the green/red marks never showing (an !important rule painted every line amber), added ✓/✗ so it is not colour alone, made chop gaps keyboard operable, stopped auto-advance after wrong answers, and blocked Clear chops after Check (it allowed double scoring). PR #18 (Breakdown Blitz) still open with no review. This PR touches the same agent/ files as #18, so the second to merge needs a small conflict fix.

## 2026-10-12 — setup
Agent brief, log, backlog, lessons and proposals files created. First scheduled run should start by filling in the student lens audit table in BACKLOG.md for the student activities and the SOLO Grow, Know, Show flow, then work on the lowest scoring surface.
