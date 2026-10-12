# Lessons from Nicholas's reviews

Updated every run from merged, closed and commented agent PRs. Record what he valued, what he rejected and why, and any standing preferences he states in comments. Future runs weigh their choice of work by this file.

- PR #20 (Syllable Splitter: explain why each chop goes there, fix the marks, keyboard chops, no auto-advance on wrong) was merged within minutes, no comments. Signal: explanatory "why" feedback plus small bug fixes in a game is the kind of change he takes.
- PR #18 (Breakdown Blitz "why" panel, energy pause, data fixes) was closed unmerged, no comment, about 6 minutes after #20 merged, with a merge conflict in the shared agent/ files. Most likely closed because of the conflict, not the content, but not certain. Do not resubmit it as is; if revisited, keep it small (why panel and no auto-advance only, no game balance change like the energy pause) and base it on current main.
- Two agent PRs that both edit agent/LOG.md, BACKLOG.md and LESSONS.md will conflict. One open agent PR at a time is safer.

- Run 4 was requested on demand for SOLO Unit 31. Signal: he wants SOLO units reviewed one at a time against the playbook framing, not only Word Labs games.

- **Standing preference (stated 2026-10-12): fix a SOLO problem across the whole unit at once, for consistency,** not one outcome per run. For example: give every u31 outcome fresh Know numbers in one PR.
- **Permission (stated 2026-10-12): the agent may check and change the SOLO `resources` table in Supabase.** It is written into hard rule 3a, and is limited to that table.

## Working notes (operational, not taste)

- GitHub: `gh api repos/NickD135/...` is refused in this sandbox; use the GitHub MCP tools with owner `nicholasd-art`.
- Screenshots: the brief now says push them to the orphan `agent-screenshots` branch, never to the work branch. Old ones remain under `agent/screenshots/` from run 2.
- Mock mode works: drive game globals with `page.evaluate` (e.g. set `currentWord`, `boundaries`, then call `checkAnswer()`) to get deterministic wrong answers for screenshots.
- SOLO in mock mode: the Grow button only shows when an outcome has resources. Units whose resources live only in the DB need fake rows: `__WL_MOCK__.add('resources', [...])` before `s.loginSolo()`.
- SOLO Know skips its worked example when the outcome has a Grow lesson, so Know `example`/`exampleVisual` are rarely seen. Put scaffolds on the questions (`visual`, `hint`, `why`).
- When two agent PRs are open, stack the second branch on the first and target the PR at the first branch, so the agent/ files do not conflict.
- `solo/UNIT_REVIEW_PLAYBOOK.md` tells you to curl Supabase for resource rows. Since 2026-10-12 this is allowed for the `resources` table only (hard rule 3a).
