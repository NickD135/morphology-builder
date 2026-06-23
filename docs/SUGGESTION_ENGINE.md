# Suggestion Engine — Design Proposal

**Status:** Proposal for review — nothing built yet.
**Author:** Claude (audit + design), 2026-06-23
**Scope:** A fortnightly job that reads what's already logged, runs link health checks,
and commits a `SUGGESTIONS.md` to the repo flagging things worth Nick's attention across
the SOLO Tracker and Word Labs.

---

## 1. What this is

A single read-only Node script (`scripts/suggestion-engine.js`) run on a fortnightly
cron (GitHub Actions). It pulls the open-RLS Supabase tables with the **anon key**
(already public), parses the hardcoded data in `solo/index.html`, checks every resource
URL for liveness, and writes a dated, sectioned `SUGGESTIONS.md` at the repo root. It
**suggests** — it never edits content, the DB, or rubrics. Nick reads it and acts.

No service-role key is needed: every table the engine reads has `SELECT USING (true)`
(verified across `solo_*`, `resources`, `student_progress`). Writes stay impossible for
the anon key — appropriate for a suggestions-only tool.

---

## 2. Data actually being logged (audit findings)

| Source | What's captured | Useful for |
|---|---|---|
| `solo_show_attempts` | **One row per Show attempt.** `correct, total, passed`, and `answers` jsonb = `[{text, type, given, correct, ms}]` — **per-question text, the answer given, right/wrong, and time in ms** | Show fail rates by outcome **and by individual question**; guessing detection (already has `GUESS_QUICK_MS=4000` logic in-app) |
| `solo_test_snapshots` | Immutable pre/post sittings, `by_outcome:{correct,total,passed,band}` | Pre→post movement per outcome; outcomes that never shift |
| `solo_review_results` | Unit review sittings, `by_outcome:{passed,correct,total}` | Unit-level mastery after review |
| `solo_progress` | `outcome_key, completed (bool), updated_at` | Outcome completion counts; recency |
| `solo_reflections` | Grow **Reflect**-step text only, per `unit_id+outcome_id` | *Proxy* for "finished a Grow lesson" (see §4) |
| `solo_assessment_reflections` | End-of-Show reflection + `score_correct/total + answers` | End-of-assessment sentiment |
| `resources` (DB) + hardcoded `RESOURCES`/`BEYOND` in `solo/index.html` | `label, url, type` per `unit_id_outcome` | URL health checks |
| `student_progress` (Word Labs) | `activity, category, correct, total, total_time, updated_at` | Engagement: accuracy, volume, time, never-played activities |
| `student_character` | `xp, quarks, badges, stats, scientist` | Streaks, retention, badge distribution |

20 units live (`u21`–`u40`).

---

## 3. The four requested reports — feasibility

### A. Show question fail rates by outcome → calibration flags ✅ **Fully feasible**
`solo_show_attempts.answers` carries each question's `text` + `correct`, so we can compute
fail rate **per question**, not just per outcome. Flag rules:
- **Question too hard / mis-keyed:** a question with ≥70% fail rate across ≥N attempts while
  the rest of its outcome passes comfortably → likely a wrong answer key or ambiguous wording.
- **Outcome too hard:** outcome-wide first-attempt pass rate < ~30% (suspect band placement).
- **Question too easy:** ~100% pass with near-instant `ms` (no discrimination).
- **Guessing-driven failures:** reuse the in-app rule (median `ms` < 4s on failed attempts) to
  separate "genuinely hard" from "rushed" — a question only flagged hard when fails are *slow*.

### B. Grow lesson drop-off points → restructuring ⚠️ **Partial — needs instrumentation for the real version**
**Honest finding:** the Grow guided lesson (Hook→Learn→Try→Reflect + hint ladder) keeps all
step state in local React state. **Nothing about lesson progress is persisted** except the
final Reflect text in `solo_reflections` (and only if the student types something real).
- **What we CAN do now (proxy):** for each outcome, compare students who have Show attempts
  (engaged the outcome) against those with a `solo_reflections` row (reached Reflect). A large
  gap = students aren't finishing Grow. Coarse, but directional.
- **What we CAN'T do now:** which *step* they drop at, or hint-ladder usage. True drop-off needs
  a tiny `solo_lesson_events` table (`student_id, unit_id, outcome_id, step, hint_idx, ts`) — a
  fire-and-forget insert on each step advance. ~15 lines in `solo/index.html` + one migration.
- **Recommendation:** ship the proxy now; flag the instrumentation as a small follow-up so the
  fortnightly report gets real step-level drop-off from then on.

### C. Resource URL health → dead/paywalled links ✅ **Feasible** (this is the strongest section)
The app never checks liveness at runtime, but every URL lives in `resources` (DB) + the
hardcoded `RESOURCES`/`BEYOND` blocks. Reuse the spec's own §3.5 verification gate:
- **YouTube:** oEmbed API → exact title/author for live videos, error for dead/private. Batch ~12.
- **PDFs/websites:** `curl -L -A "Mozilla/5.0" -o /dev/null -w "%{http_code}"`. 404/410 → flag.
- **Paywall/soft-dead:** heuristic only (200 + body keywords like "subscribe"/"sign in", or a
  redirect to a login host). Reported as *suspected*, not definitive.
- Also flag **DB-vs-code conflicts** (a unit with both DB rows and hardcoded resources — the §3.4
  gotcha) and duplicate URLs within an outcome.

### D. Word Labs engagement patterns → investigate ✅ **Feasible**
From `student_progress` + `student_character`:
- Activities with near-zero plays (the 13 games) vs popular ones — content/visibility gaps.
- Accuracy outliers: activities sitting < ~40% (too hard / mis-pitched) or ~100% (too easy).
- Streak / retention decay (`stats`, daily streak fields) — engagement cliffs.
- Badge distribution — badges almost never earned (unreachable) or always earned (trivial).
Framed as "worth investigating," not auto-conclusions.

---

## 4. Honest limitations (so the report doesn't overclaim)

- **Grow drop-off is a proxy until instrumented** (§3B). The report will label it as such.
- **No per-student identity in suggestions** — fine, this is a content/calibration tool, not a
  student dashboard. Aggregates only; small-N outcomes (< ~10 attempts) get a "low confidence" tag.
- **Paywall detection is heuristic** — flagged for human check, never auto-removed.
- **Thresholds are guesses to start** (70% fail, 30% pass, 4s, N=10). First few reports will need
  Nick to tune them; they live as constants at the top of the script.

---

## 5. Mechanics

- **`scripts/suggestion-engine.js`** — Node, no new deps beyond `node-fetch`/built-in fetch.
- **Cron:** GitHub Action, `schedule: '0 6 1,15 * *'` (1st & 15th). Has network egress for
  oEmbed/curl + Supabase; commits `SUGGESTIONS.md` back to `main`.
- **Reads:** Supabase REST with anon key (env var); parses `solo/index.html` for hardcoded
  resources + question text via the existing `eval`-the-block approach from spec §3.6.
- **Output:** `SUGGESTIONS.md` at repo root — dated header, the four sections, each finding as a
  checklist line with the exact unit/outcome/question + the metric that triggered it, sorted by
  severity. Diff-friendly so Nick sees what's new since last fortnight.

---

## 6. Decisions (settled with Nick, 2026-06-23)

1. **Grow drop-off:** ✅ Proxy now, instrument as fast-follow. First report uses the
   "attempted Show but no reflection" proxy; a small `solo_lesson_events` table + step-advance
   inserts in `solo/index.html` land separately so later reports get real step-level drop-off.
2. **Runner:** ✅ GitHub Action on cron (`0 6 1,15 * *`), commits `SUGGESTIONS.md` to `main`.
3. **Section D scope:** ✅ Tight — never-played activities, accuracy outliers, streak/retention
   decay, badge distribution. No wider sweep.
4. **Thresholds:** ✅ Start with the §4 defaults (70% fail, 30% pass, 4s quick, N=10 low-confidence);
   tune from the first two reports.

Design is locked. Next step (on Nick's go-ahead): write the implementation plan / build the engine.
