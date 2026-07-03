# WordLabs Brain — a reasoning workspace in Obsidian

**Date:** 2026-07-03
**Owner:** Nicholas Deeney
**Lives in:** the `obsidian-vault` repo (git-synced), folder `WordLabs Brain/`, alongside the
existing `WordLabs Architecture/` code map.

## Purpose

A domain-specific reasoning workspace for building WordLabs (and SOLO) — not a generic
second-brain. It must do four jobs Nick chose: **reason** across the whole picture, **record
decisions**, **plan/prioritise**, and **organise knowledge** so it's findable. The
differentiator vs. off-the-shelf kits (e.g. claudesidian): it is **seeded on day one** from
what's already known — `CLAUDE.md` (esp. §13 "Decisions Made & Why" and the Phase roadmap),
the memory files, this session's work, and the code map — so it opens populated, not blank.

## Structure (`WordLabs Brain/`)

- **`WordLabs Brain.md`** — home/dashboard + map-of-content. Entry point: Now/Next snapshot,
  open questions, recent decisions, links to every area. Emoji-titled for findability.
- **`Areas/`** — evergreen reference notes (the well-rounded view), each cross-linked to the
  code map: `Product`, `Users` (teachers/students/schools + personas), `Pedagogy` (research
  base + syllabus), `Market` (competitors + positioning), `Business` (pricing, procurement,
  compliance, growth/churn), `SOLO`.
- **`Decisions/`** — one note per decision, seeded from `CLAUDE.md` §13. Template:
  *Context · Options considered · Decision · Why · Assumptions · Revisit-if · Date.*
- **`Roadmap.md`** — Now / Next / Later, seeded from the Phase checklist + open items.
- **`Ideas.md`** — raw idea inbox, triaged into Roadmap over time.
- **`Questions.md`** — open questions / the reasoning queue.
- **`Thinking/`** — analysis notes, created on demand when Nick asks to reason something
  through; seeded with one worked example.
- **`Inbox.md`** — quick capture; Claude triages entries into the right place.
- **`_Workflows.md`** — plain-language list of what Nick can ask for (no commands to memorise).

## Conventions

- **Format:** every note has YAML frontmatter `tags: [wordlabs-brain, <kind>]` so the graph and
  search can filter the brain from the code map. Kinds: `home, area, decision, roadmap, idea,
  question, thinking, inbox, workflow`.
- **Linking:** liberal `[[wikilinks]]` between brain notes and into the code map
  (`[[WordLabs Architecture]]`, `[[wordlab-data]]`, `[[solo]]`, tables, etc.) so reasoning
  connects to the actual code. This makes the graph one connected system.
- **Decision records** are append-only in spirit — supersede rather than delete; note
  "Revisit-if" triggers.

## How reasoning works (trigger: plain English)

No slash commands. Nick asks in natural language and Claude executes against the vault:

- *"think through whether to build X"* → Claude reads relevant `Areas/` + `Decisions/` +
  `Roadmap`, reasons (users, market, effort, compliance, second-order effects), returns a
  grounded recommendation with trade-offs, and writes a `Thinking/` note if useful.
- *"log that as a decision"* → creates a `Decisions/` record from the discussion.
- *"process my inbox"* → triages `Inbox.md` into Areas/Ideas/Decisions/Questions.
- *"weekly review"* → summarises what changed, surfaces open questions + stale items, proposes
  Now/Next updates.
- *"update the brain"* → refreshes Areas/Decisions/Roadmap from recent code changes or a session.

Claude keeps the vault current as work happens; the vault is the shared long-term memory.
`_Workflows.md` documents these so Nick has a menu without memorising anything.

## Integration & mechanics

- Same git-sync as the code map: Claude edits in the `/workspaces/obsidian-vault` clone,
  commits + pushes; the Obsidian Git plugin pulls to Nick's PC. Claude pulls before working.
- No dependency on claudesidian, no Node/pnpm scripts, no extra API keys, no in-vault command
  infrastructure. Pure Markdown + Claude.

## Out of scope

- Claude Code slash commands (chosen against — plain English instead).
- Adopting the claudesidian kit or its PARA structure.
- Any change to the code map (`WordLabs Architecture/`) beyond adding cross-links.

## Success criteria

- Opens populated (seeded from existing docs), not empty.
- Nick can ask a real strategic question and get a grounded, cross-cutting answer that cites the
  vault.
- Decisions and roadmap stay current with low friction.
- Graph view shows one connected system: brain ↔ code map.
