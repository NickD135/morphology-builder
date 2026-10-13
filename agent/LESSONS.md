# Lessons from Nicholas's reviews

Updated every run from merged, closed and commented agent PRs. Record what he valued, what he rejected and why, and any standing preferences he states in comments. Future runs weigh their choice of work by this file.

- PR #20 (Syllable Splitter: explain why each chop goes there, fix the marks, keyboard chops, no auto-advance on wrong) was merged within minutes, no comments. Signal: explanatory "why" feedback plus small bug fixes in a game is the kind of change he takes.
- PR #18 (Breakdown Blitz "why" panel, energy pause, data fixes) was closed unmerged, no comment, about 6 minutes after #20 merged, with a merge conflict in the shared agent/ files. Most likely closed because of the conflict, not the content, but not certain. Do not resubmit it as is; if revisited, keep it small (why panel and no auto-advance only, no game balance change like the energy pause) and base it on current main.
- Run 5 (2026-10-12): still no human comments on #22 or #23. Redid Breakdown Blitz as the small version the #18 lesson suggested, to test whether the content itself is welcome.
- Run 6 (2026-10-12): #22, #23 and #24 still had no human review, so the run held (hard rule 2). Four runs in one day outpaced review; a held run is the expected outcome when the stack is three deep.
- **Standing instruction (stated 2026-10-12): hold only once 10 agent PRs are open and unreviewed** (hard rule 2 raised from 3 to 10 by Nicholas). He reviews in batches: after run 6 he merged #22, #23 and #24 together.
- Run 7 (2026-10-13): #22, #23 and #24 were all merged together without comments. Signal: "why" feedback in games (now in Syllable, Phoneme and Breakdown) and whole-unit SOLO fixes are both welcome. No rejections so far apart from #18, which was most likely a conflict.
- Run 8 (2026-10-13): #25 (game headers, polish track) merged about 2.5 hours after opening, no comments. Signal: polish fixes that are checked at several screen sizes are welcome too.
- Run 9 (2026-10-13): #26 (Sound Sorter) got a structured "Reviewer verdict: NEEDS CHANGES" comment posted from Nicholas's account (a reviewer agent: Must fix / Checks / Worth a look). Treat its Must fix items as his review and fix them on the same branch before opening anything new. It checks the work independently (it recounted the line totals and reproduced a crash with a 150 ms second tap), so test fast repeated input and report counts that add up.
- **Australian English pronunciation is checked.** Any feedback that names a sound in a model word must hold for Australian speakers: bath, fast, calf and aunt have the AR sound; haunt, launch, author, dinosaur have the OR sound; tour varies. When a game shows example words, sweep every example it can show, not just the rules.
- Two agent PRs that both edit agent/LOG.md, BACKLOG.md and LESSONS.md will conflict. One open agent PR at a time is safer.

- Run 4 was requested on demand for SOLO Unit 31. Signal: he wants SOLO units reviewed one at a time against the playbook framing, not only Word Labs games.

- **Standing preference (stated 2026-10-12): fix a SOLO problem across the whole unit at once, for consistency,** not one outcome per run. For example: give every u31 outcome fresh Know numbers in one PR.
- **Permission (stated 2026-10-12): the agent may check and change the SOLO `resources` table in Supabase.** It is written into hard rule 3a, and is limited to that table. Changes are always delivered as a SQL file for him to run, never written directly (his choice).

## Working notes (operational, not taste)

- GitHub: `gh api repos/NickD135/...` is refused in this sandbox; use the GitHub MCP tools with owner `nicholasd-art`.
- Screenshots: the brief now says push them to the orphan `agent-screenshots` branch, never to the work branch. Old ones remain under `agent/screenshots/` from run 2.
- Mock mode works: drive game globals with `page.evaluate` (e.g. set `currentWord`, `boundaries`, then call `checkAnswer()`) to get deterministic wrong answers for screenshots.
- SOLO in mock mode: the Grow button only shows when an outcome has resources. Units whose resources live only in the DB need fake rows: `__WL_MOCK__.add('resources', [...])` before `s.loginSolo()`.
- SOLO Know skips its worked example when the outcome has a Grow lesson, so Know `example`/`exampleVisual` are rarely seen. Put scaffolds on the questions (`visual`, `hint`, `why`).
- When two agent PRs are open, stack the second branch on the first and target the PR at the first branch, so the agent/ files do not conflict.
- `solo/UNIT_REVIEW_PLAYBOOK.md` tells you to curl Supabase for resource rows. Since 2026-10-12 this is allowed for the `resources` table only (hard rule 3a).
- Supabase REST and most outbound HTTPS are blocked by the sandbox egress proxy. WebFetch works for YouTube oEmbed and for most worksheet sites, so verify resources with WebFetch, not curl.
- Mock mode sweeps: a 13 page sweep at one size takes about 2 minutes, so run one viewport per command (the shell times out at 5 minutes).
- Offline docx: only docx 9.7.1 is available (`NODE_PATH=/opt/npm-tools/node_modules`). The u31 program built with it to the same 20 pages.
- `checkAnswer()` style functions in games can be driven through real clicks and `keyboard.press('Enter')` in mock mode; doing so caught that Sound Sorter tiles were not focusable at all. Try a keyboard pass on every game touched.
- Fast double taps: drive `checkAnswer()` twice 150 ms apart (and with real `page.click`) in mock mode; delayed `setTimeout` resets are where these games break.
