# SOLO Tracker — Grow as a Guided Lesson

**Date:** 2026-06-01
**Status:** Approved design, ready for implementation plan
**File touched:** `solo/index.html` (single-file React-via-Babel app)

## Problem

The Grow (learn) section is a thin inline panel — watch prompts, a worked example, a note box, and resource links. It doesn't pull students in or get them doing real thinking in their maths book. A recent attempt to drive bookwork by gating each Know practice question behind an "I've done it in my book" reveal made Know worse (it hid the question and felt like a chore).

The bookwork/thinking energy belongs in **Grow**, not bolted onto rapid practice. Grow should feel **connected, personal, and motivating** — a real lesson a Year 6 student *wants* to work through in their book.

## Goals

- Turn Grow into a full-screen, coach-led **guided lesson** the student pages through.
- Make the questions ones students *want* to answer — a blend of **curiosity hooks** and **real-life relevance**.
- Make it **personal** in the two senses the owner chose: the **coach feels like a teacher who knows them** (warm, reactive), and it's **tied to their journey** (their path through the unit).
- Put the **bookwork in Grow** via self-checked "try it" questions — work it in the book, reveal the method, self-mark. No typing on screen.
- Restore **Know** to clean on-screen practice (remove the per-question bookwork gate).

## Non-goals

- Grading or saving self-check results to the dashboard (self-checks are formative — for the student's own honesty).
- Real progress integration for "your journey" (a light path label + warm handoff now; wiring to actual mastery is a later enhancement).
- Teacher visibility of reflections (the reflection note still saves to the device via localStorage, as today).
- Building lesson content for every outcome up front (engine first, then content per outcome).

## The experience (four-stage flow)

Tapping **📚 Grow** on an outcome that has lesson content opens a full-screen lesson (mirrors how Know opens the practice screen). Header shows the outcome name + a path label (e.g. *"Trailing zeros · part of your Decimals journey"*) and four progress dots. The Coach is the constant guide. Stages, paged with Back/Next:

1. **Hook** — the coach poses a curiosity + real-life question; the student writes a gut prediction in their book. A reveal ("Show what's really going on") gives the surprise/answer and a light self-check (*Got it / It surprised me*).
2. **Learn** — the teaching: the resource video(s)/worksheet for the outcome + the existing step-reveal worked example, framed by the coach.
3. **Try it in your book** — one or more self-check questions. For each: question shown → student works it in their book → **Show the answer** reveals the answer + a one-line explanation → self-mark (*Got it / Look again*). No on-screen answer entry.
4. **Reflect** — a reflection prompt the student finishes in their book (+ the existing "one thing you learned" note box). The coach closes warmly and hands off: **Go to Know practice / Back to rubric**.

**Fallback:** for outcomes with no lesson content, 📚 Grow shows the resources inline exactly as it does today.

## Data schema

Lessons are pure content in the existing `LEARN` object, extended with `journey`, `hook`, `tryIt`, and `reflect`. The existing `watch` and `workedExample` are reused in the Learn stage. Adding a lesson to a new outcome is filling this in — no new code.

```js
LEARN.u26_r5 = {
  journey: "Decimals",
  hook: {
    question: "Two price tags: $5.5 and $5.50. One bigger, or the same? Write your gut answer.",
    reveal:   "Exactly the same amount! That end zero doesn't add anything — it's just there to look tidy.",
  },
  watch:         { /* existing prompts */ },
  workedExample: { /* existing problem + steps */ },
  tryIt: [
    { question: "Write 6.3400 without trailing zeros.", answer: "6.34",
      explain: "Drop only the end zeros — the 3 and 4 stay." },
    { question: "True or false: 0.30 is bigger than 0.3?", answer: "False — they're equal.",
      explain: "The extra 0 is just a placeholder." },
  ],
  reflect: {
    prompt: "Finish this in your book: 'A zero on the end of a decimal doesn't change the value because…'",
    note:   "what did you learn about trailing zeros?",
  },
};
```

## Architecture

- **New full-screen view** `view==="learn"` (launched by the 📚 Grow button when `LEARN[key]` exists; otherwise the current inline resources panel renders).
- **State** (alongside the existing practice state): `learnStage` (`hook` | `learn` | `try` | `reflect`), `learnTryIdx`, and per-stage reveal flags (hook revealed, current try-it revealed). Reset on lesson launch and on advancing.
- **Reuse**: the `Coach` component (warm voice, reactions, gated animations) and the worked-example step-reveal logic already in `LearnCard`. The Learn stage pulls the outcome's resources from the same source the rubric uses (`unitResources[key]` ?? `RESOURCES[key]`).
- **No DB writes** for the lesson (self-checks are formative). The reflection note continues to use the existing localStorage key.
- **Progress dots + Back/Next** drive paging; the final stage shows handoff buttons (Go to Know / Back).

## Know cleanup

Revert the per-question bookwork gate added previously: remove `practiceBookwork` state, the gate render block, and the gated conditions on the answer UI and Check button. Know returns to: question → answer → coach feedback (the coach feedback stays).

## Constraints

- Vanilla JS only (no build, no new libraries) — consistent with the rest of `solo/index.html`.
- All animation via CSS keyframes, `transform`/`opacity` only; gated behind `prefers-reduced-motion` and `body.low-stim` (reuse existing coach/lc gates).
- No layout shift; fast on a low-end Chromebook.
- Australian context, brand palette and Lexend font as elsewhere.

## Scope & build order

1. Build the lesson-flow engine: the `view==="learn"` screen, stages, coach, dots, self-check reveal, navigation, and the launch/fallback wiring on the Grow button.
2. Extend the `LEARN` schema and **seed "Trailing zeros" (u26_r5)** fully as the working prototype.
3. **Remove the Know bookwork gate.**
4. Ship → trial r5. If it lands, the rest is content-only: seed `u26_r8`, then other outcomes.

## Deferred (later enhancements)

- Wire "your journey" to real progress (mastered / next on the path).
- Persist reflections to Supabase so teachers see them on the dashboard (matches the earlier-noted Learn-card phase 2; needs a table under existing RLS).
- Roll lesson content across all outcomes.
