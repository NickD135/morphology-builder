# SOLO Tracker — Rubric & Unit Specification

This document defines the exact structure every unit rubric must follow. Any new unit added to the tracker must match this specification precisely.

---

## Unit structure

Each unit has:
- A unique ID in the format `uXX` (e.g. `u24`, `u25`, `u26`, `u27`)
- A display name (e.g. `Unit 24`)
- A subtitle describing the topic (e.g. `Fractions`)
- A colour identity (background, border, text, dot, dark) used consistently across all UI elements for that unit
- A set of outcomes divided across three bands: Red, Yellow, Green

### Unit colour identities
| Unit | Theme |
|------|-------|
| u24 Fractions | Blue (indigo) |
| u25 Data | Green |
| u26 Representing Numbers & Decimals | Purple (violet) |
| u27 Multiplicative Relations | Orange |

Each new unit should be assigned a distinct colour that does not clash with existing units.

---

## Outcome bands

Every unit must have outcomes in three bands. The band determines the difficulty level and the visual colour of the label on the rubric.

| Band | Colour | Meaning |
|------|--------|---------|
| Red | Red | Foundation — all students must reach this |
| Yellow | Yellow/amber | On-level — expected achievement for the year group |
| Green | Green | Extension — Stage 4 / beyond year-level content |

The rubric displays bands in order: Red → Yellow → Green, top to bottom.

---

## Outcome structure

Each outcome must have the following fields:

```
id         Short code: r1, r2... for red; y1, y2... for yellow; g1, g2... for green
band       "red" | "yellow" | "green"
short      Display title shown on the rubric card (max ~50 characters)
label      Full description of the outcome (matches the NSW syllabus dot point)
questions  Array of 10 assessment questions for the Show assessment
```

### Outcome IDs
- Red outcomes: `r1`, `r2`, `r3` … in order
- Yellow outcomes: `y1`, `y2`, `y3` … in order
- Green outcomes: `g1`, `g2`, `g3` … in order
- The combined key used throughout the app is `unitId_outcomeId` — e.g. `u24_r1`

---

## Show assessment (10 questions per outcome)

Each outcome has exactly **10 questions** used for the Show (summative) assessment. Students must get at least **9 out of 10 correct** (one wrong allowed) to unlock the outcome.

### Question types available

| Type | Description |
|------|-------------|
| `mc` | Multiple choice — 4 options, exactly 1 correct |
| `truefalse` | True/False — displayed as two large buttons |
| `input` | Typed text answer — supports `answer` and optional `aliases` array |
| `order` | Click to build a sequence — `items` array, `answer` array in correct order |
| `numberline` | Place tokens on a number line — `tokens` array, `targets` object with `[min, max]` tolerance per token |
| `match` | Match left column to right column — `left`, `right`, `pairs` object |
| `partition` | Shade parts of a bar or circle — `parts` (total), `target` (how many to shade), `shape` ("bar" or "circle") |

### Question design rules
- Each set of 10 questions must use **at least 3 different question types**
- Questions must progress through the concept — don't just repeat the same operation 10 times
- Include at least one question targeting **common misconceptions** (e.g. a truefalse exposing a wrong idea)
- Include at least one **missing number / working backwards** question
- Include at least one **word problem or contextual question** where appropriate
- For visual outcomes (fractions on number line, shading, ordering) — use the interactive types (`numberline`, `partition`, `match`) for 2–3 of the 10 questions
- Australian English spelling and context throughout
- Year 5–6 appropriate numbers and scenarios

---

## Pre-test / Post-test (2 questions per outcome)

Every unit must have a pretest defined in the `PRETESTS` object, keyed by unit ID.

Each outcome in the pretest has:
- `outcomeId` — matches the outcome ID (r1, y2, g3 etc.)
- `short` — the outcome's short display name
- `questions` — exactly **2 questions**

### Pretest question rules
- Use only `mc`, `truefalse`, or `input` types (no interactive types — the pretest must be fast)
- Questions should be **diagnostic** — can the student do the core skill or not?
- Questions must be **different from the Show assessment questions** — do not reuse
- Getting both questions correct auto-ticks the outcome on the student's rubric
- Getting 0 or 1 correct leaves it unticked — student must Grow/Know before attempting Show

---

## Grow resources (videos, websites, games)

Each outcome should have at least **2 resources** in the `resources` Supabase table.

### Resource schema
```json
{
  "unit_id": "u24",
  "outcome_id": "r1",
  "type": "video",
  "label": "Descriptive title — Channel/Source name",
  "url": "https://...",
  "scope": "global",
  "class_id": null
}
```

### Resource types
| Type | Description |
|------|-------------|
| `video` | YouTube video — Math with Mr J preferred where available |
| `website` | Reference/explanation site — Math is Fun or Khan Academy preferred |
| `game` | Interactive practice game — IXL, Math Playground, NRich, Coolmath |
| `question` | In-app practice question (see Know section below) |

### Minimum resources per outcome
| Type | Minimum |
|------|---------|
| video | 1 (ideally 2 if Math with Mr J has relevant content) |
| website | 1 |
| game | 1 |
| question | 3–4 (for the Know section) |

### Preferred video sources (in order)
1. **Math with Mr J** — use whenever he has a relevant video
2. **Khan Academy** — for gaps Mr J doesn't cover
3. **Matholia** — good for Australian curriculum-aligned content
4. **TED-Ed** — for conceptual/critical thinking outcomes (e.g. misleading graphs)
5. Other reputable maths channels as needed

### Preferred website sources
1. **Math is Fun** (mathsisfun.com) — clean, no ads, age-appropriate
2. **Khan Academy** (khanacademy.org) — deeper explanation

### Preferred game sources
1. **IXL** (au.ixl.com) — use Australian domain, year-level specific URLs
2. **Math Playground** (mathplayground.com)
3. **NRich** (nrich.maths.org) — especially for open-ended/rich tasks
4. **Coolmath Games** (coolmathgames.com)

---

## Know practice questions

Practice questions live in the `resources` table with `type: "question"`. They appear when the student taps the **Know** button on an outcome card.

### Question schema (stored as JSONB in the `question` column)
```json
{
  "text": "Question text here",
  "options": [
    {"text": "Option A", "correct": true},
    {"text": "Option B", "correct": false},
    {"text": "Option C", "correct": false},
    {"text": "Option D", "correct": false}
  ]
}
```

### Know question rules
- Exactly **4 options** per question
- Exactly **1 correct** option
- Types: multiple choice or true/false framing (true/false must still have 4 options with 2 plausible distractors)
- **Must not duplicate** questions already in the Show assessment
- **Must not duplicate** questions already in the Pre-test
- Should be slightly easier or more scaffolded than Show questions — these are for practice, not assessment
- Australian spelling and curriculum context
- Year 5–6 appropriate
- Minimum 3 questions per outcome, ideally 4

---

## Worksheet (PDF)

Each outcome should have one A4 PDF worksheet. Worksheets follow this layout:

1. **Header** — Word Labs branding, unit name, band colour label (RED / YELLOW / GREEN)
2. **Name and Date line**
3. **Learning intention box** — "We are learning to: [outcome label]" with left border in band colour
4. **Worked example box** — grey background, shows a step-by-step example of the concept
5. **Practice Questions** — 8–10 questions with dotted working space below each

### Worksheet question rules
- 8–10 questions total, fitting on one A4 page
- Must use worked example framing — questions build naturally from the example
- Visual supports where appropriate (fraction bars, number lines, data tables, graph grids)
- Questions progress from straightforward → applied → open-ended
- Final question should be a "challenge" or "explain your thinking" style question
- Must not duplicate Show or Know questions

### Worksheet naming convention
```
uXX_rY_short_description.pdf
uXX_yY_short_description.pdf
uXX_gY_short_description.pdf
```
Examples: `u24_r1_order_unit_fractions.pdf`, `u25_y2_misleading_representations.pdf`

Worksheets are hosted at `/solo/resources/` and linked in the `resources` table as `type: "worksheet"`.

---

## Teacher dashboard — what each outcome row shows

In the teacher student detail view, each outcome row displays:
- ✓ / blank indicator (green circle if done, grey if not)
- Outcome short name
- Attempt count and last score (if any attempts recorded)
- **Attempts** button — appears if the student has made at least one attempt; opens attempt history
- **✓ Mark / Unmark** button — allows teacher to manually override the outcome status

---

## Student rubric — what each outcome card shows

Each outcome card on the student rubric shows:
- Numbered circle (or green ✓ if complete)
- Outcome short title (green if complete, dark if not)
- Outcome full label (truncated, grey)
- **📚 Grow** button — appears if the outcome has at least one video, website or game resource; opens an expandable resource panel
- **✏️ Know** button — appears if the outcome has at least one practice question and the outcome is not yet complete
- **Show** button — appears if the outcome is not yet complete; launches the 10-question assessment
- **Done** label — replaces buttons when the outcome is complete

### Outcome card button rules
- All three buttons (Grow, Know, Show) can appear simultaneously on incomplete outcomes
- Completed outcomes show only "Done ✓" — no buttons
- Grow panel expands inline below the card; only one panel open at a time
- Know button disappears once an outcome is marked done (no point practising what's already shown)

---

## Summary checklist for adding a new unit

Before a unit is considered complete in the tracker, verify:

- [ ] Unit added to the `UNITS` array with correct id, name, subtitle
- [ ] Unit colour added to `UC` colour map
- [ ] All Red outcomes added with 10 Show questions each
- [ ] All Yellow outcomes added with 10 Show questions each
- [ ] All Green outcomes added with 10 Show questions each
- [ ] Show questions use at least 3 question types per outcome
- [ ] Pre-test added to `PRETESTS` with 2 questions per outcome
- [ ] Pre-test button visible on the unit home card
- [ ] Resources inserted into Supabase `resources` table: at least 1 video, 1 website, 1 game per outcome
- [ ] Know questions inserted into Supabase `resources` table: at least 3 per outcome
- [ ] Worksheets generated and hosted at `/solo/resources/uXX_*.pdf`
- [ ] Worksheet URLs added to Supabase `resources` table as `type: "worksheet"`
- [ ] Green band outcomes are Stage 4 level (extension beyond year group)
- [ ] All content uses Australian English spelling
- [ ] All content is appropriate for Year 5–6 (ages 10–12)
