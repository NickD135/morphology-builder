# Spelling Feedback Feature — Design Spec

**Date:** 2026-05-08
**Status:** Approved

---

## Overview

A new "Spelling Feedback" view in the teacher dashboard that analyses a student's historical spelling check-in results and uses the Anthropic API to generate structured diagnostic feedback categorised by error type, with actionable next steps for the teacher.

---

## Architecture

### Two-part split (Approach B)

1. **Dashboard JS** — runs the Supabase query client-side, formats the history string, POSTs to the edge function.
2. **New Supabase Edge Function `spelling-feedback`** — receives `{ history: string }`, calls Anthropic, returns parsed JSON. Keeps the API key server-side.

This follows the same split as `analyze-words` / `analyze-morphemes`. The query logic lives in the dashboard where it's easy to iterate; the API key never touches the browser.

---

## Edge Function: `spelling-feedback`

**File:** `supabase/functions/spelling-feedback/index.ts`

**Auth:** Teacher session required. Passes `Authorization` header from the dashboard, verified via `supabase.auth.getUser()` — same pattern as `analyze-words`.

**CORS:** Restricted to the five allowed origins (wordlabs.app, morphology-builder.vercel.app, nickd135.github.io, localhost:8080, localhost:3000).

**Request body:**
```json
{ "history": "<formatted history string>" }
```

**Anthropic call:**
- Model: `claude-sonnet-4-20250514`
- `max_tokens`: 1500
- `anthropic-version`: `2023-06-01`

**System prompt:**
```
You are an expert literacy diagnostician working with Australian primary school teachers.
You will be given a student's spelling attempt history. Analyse the data and return a JSON
object only — no preamble, no markdown — with this exact structure:
{
  "summary": "2-3 sentence overall diagnostic summary",
  "strengths": [
    { "title": "short title", "detail": "explanation" }
  ],
  "improvements": [
    { "title": "short title", "detail": "explanation", "tag": "Persistent or Recent" }
  ],
  "nextSteps": "1-2 concrete teaching strategies the teacher can use this week"
}

When identifying patterns, categorise errors explicitly as: phonological (vowel sounds,
blends, digraphs), morphological (prefixes, suffixes, base words, inflectional endings),
or orthographic (silent letters, double consonants, common letter sequences). Name the
pattern type in each improvement's title (e.g. "Orthographic: double consonants",
"Morphological: -ed suffix dropping").

Tag each improvement as "Persistent" if the error pattern appears across older and recent
sessions, or "Recent" if it has emerged in the last 1-2 sessions.

Use Australian English spelling throughout.
```

**User message format:**
```
Student spelling history (oldest to most recent):
[date] | target: [word] | typed: [typed] | correct: [true/false]
```

**Response:** Returns the parsed JSON object as `{ feedback: { summary, strengths, improvements, nextSteps } }`.

**Error responses:**
- 401 if no/invalid auth token
- 400 if `history` is missing or empty
- 502 if Anthropic returns non-200
- 500 if Anthropic response cannot be parsed as JSON

---

## Supabase Query (Dashboard JS)

When a student is selected, run:

```sql
SELECT
  r.created_at,
  item->>'word'   AS target,
  item->>'typed'  AS attempt,
  (item->>'correct')::boolean AS correct
FROM spelling_check_in_results r,
     jsonb_array_elements(r.results) AS item
WHERE r.student_id = '[selected_student_id]'
ORDER BY r.created_at ASC;
```

The Supabase PostgREST JS client does not support lateral joins. Instead: fetch all `spelling_check_in_results` rows for the student (`select('created_at, results').eq('student_id', id)`), then expand each row's `results` array in JS, flattening to `{ created_at, target, attempt, correct }` entries.

**Session count aggregation (on view load):**
Fetch all `spelling_check_in_results` rows for students in the current class in one query (`select('student_id').in('student_id', studentIds)`), then count occurrences per `student_id` in JS. This gives session counts without N+1 queries and without needing GROUP BY.

---

## UI Structure

### Third view tab

Add a third button to the `.viewTabs` strip:

```html
<button class="viewTab" id="sfTabBtn" onclick="switchView('feedback', this)" role="tab" aria-selected="false">
  ✉ Spelling Feedback
</button>
```

Extend `switchView()` to toggle `#viewFeedback` alongside the existing two views.

### View container

```html
<div id="viewFeedback" class="hidden">
  <div id="sectionSpellingFeedback"></div>
</div>
```

Content rendered by `renderSpellingFeedbackTab()` when the tab is selected.

### Two-panel layout

Reuses `.ss-layout` CSS class (`display: grid; grid-template-columns: 280px 1fr; gap: 20px`).

#### Left panel — student list

- Header: "Students" label + student count badge (same style as `.ss-sidebar-title`)
- Each student row: indigo initials avatar (32px circle, font-size 12px bold) + student name + session count pill ("3 sessions" or "No data" dimmed). Initials: if name contains a space, use first char of each word (max 2); otherwise use first 2 chars of name. Both uppercased.
- Selected row: indigo background highlight (`.ss-sidebar-item.active` style)
- On click: load word history for that student into the right panel
- Loading state: subtle opacity while session counts are being fetched

#### Right panel — feedback area

Three sequential sections, all inside `.ss-main`:

**1. Word history list**

A scrollable table (max-height ~320px, overflow-y auto) with columns:
- Target word (bold)
- Student's attempt (monospace or distinct weight)
- ✓ / ✗ indicator (green `#4ade80` / red `#f87171`)
- Date (short format: "12 Apr")

Empty state (no check-in data): grey card — "No spelling check-in data yet for this student."

**2. Generate Feedback button**

```html
<button id="sfGenerateBtn">🔍 Generate Feedback</button>
```

- Disabled (visually dimmed) when no student selected or no history data
- On click → button shows spinner + text changes to "Analysing spelling patterns..."
- Button re-enables after response (success or error)

**3. Feedback output**

Four cards rendered from the JSON response:

| Card | Border colour | Content |
|------|--------------|---------|
| Summary | Indigo left border (`#6366f1`, 4px) | `summary` string |
| Strengths | Green left border (`#4ade80`, 4px) | One sub-card per `strengths[]` item: bold title + detail text |
| Improvements | Amber left border (`#fbbf24`, 4px) | One sub-card per `improvements[]` item: bold title + detail text + Persistent/Recent tag pill |
| Next Steps | Cyan left border (`#06b6d4`, 4px) | `nextSteps` string |

Tag pill styles:
- "Persistent" → red-tinted pill (`rgba(248,113,113,.15)`, colour `#f87171`)
- "Recent" → amber-tinted pill (`rgba(251,191,36,.15)`, colour `#fbbf24`)

Error state: red card — "Could not generate feedback. Please try again." with the raw error message below it in smaller muted text.

---

## Styling

All new styles follow existing dashboard conventions:

- Background: `var(--bg)` (`#0f172a`)
- Card surfaces: `var(--panel)` (`#1e293b`)
- Lines/borders: `var(--line)` (`rgba(255,255,255,.08)`)
- Accent: `var(--indigo)` (`#6366f1`) / `var(--indigo-2)` (`#818cf8`)
- Font: Lexend, inherited
- Border radius: 14–20px on cards, 999px on pills
- New CSS added inline in `<style>` block inside `dashboard.html`, prefixed `.sf-` to avoid collisions

---

## Error Handling Summary

| Scenario | Behaviour |
|----------|-----------|
| Student has no check-in history | Empty state message; Generate button disabled |
| Edge function returns 401 | Red error card: "Session expired. Please reload." |
| Edge function returns 502 | Red error card: "AI service unavailable. Try again." |
| Anthropic JSON parse failure | Red error card: "Could not parse AI response." |
| Network error | Red error card: "Network error. Check your connection." |

---

## Files Changed

1. `supabase/functions/spelling-feedback/index.ts` — new edge function
2. `dashboard.html` — third view tab, `viewFeedback` div, `switchView` update, `renderSpellingFeedbackTab()` function, `.sf-*` CSS

No new HTML files. No changes to `wordlab-data.js` or any other shared module.
