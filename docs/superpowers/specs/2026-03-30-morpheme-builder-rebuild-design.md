# Morpheme Builder Rebuild — Design Spec

**Date:** 2026-03-30
**Goal:** Rebuild the Morpheme Builder as a lag-free exploratory sandbox matching the unified design system, with pre-computed viability and simplified click-to-place interaction.

---

## 1. What It Is

An exploratory tool (not a scored game) where students click morpheme tiles into 4 builder slots (prefix, base, suffix1, suffix2) to discover how English words are constructed. The system hides non-viable tiles so students only see options that form real words, and explains the spelling rules applied when building each word.

No scoring. No timer. No rounds. No recordAttempt(). Pure sandbox.

---

## 2. Interaction Model

### Placing tiles
- Student clicks a tile in the bank → it goes into the correct slot (prefix tiles → prefix slot, base tiles → base slot, suffix tiles → suffix slot)
- If that slot is already occupied, the new tile replaces the old one
- Only one prefix, one base, and up to two suffixes can be placed at a time

### Removing tiles
- Click an occupied slot → removes the tile, returns it to the bank
- "Clear All" button empties all slots

### Viability
- Only tiles that can form valid words with the current selection are shown
- Non-viable tiles are hidden entirely (not greyed out)
- When builder is empty, all tiles show (everything is viable)
- As the student builds, banks narrow to only the options that work
- Viability updates are instant (Map/Set lookup, no computation)

### No drag-and-drop
Click-to-place only. Simpler, works on all devices, no fiddly targeting.

---

## 3. Layout

### Desktop (two-panel)

```
[=== HEADER (fixed dark, unified design system) ================]
|                           |                                    |
|   BUILDER PANEL           |   TILE BANK                        |
|                           |                                    |
|   [pre-] [BASE] [-suf]   |   [Prefixes] [Bases] [Suffixes]   |
|          [-suf2]          |   [search filter...............]   |
|                           |                                    |
|   Built word: "unhappy"   |   [un-]  [re-]  [dis-]  [pre-]   |
|   Meaning: not + happy    |   [mis-] [over-] [sub-]  ...      |
|                           |                                    |
|   SPELLING RULES          |                                    |
|   (step-by-step)          |                                    |
|                           |                                    |
|   DEFINITION              |                                    |
|   (auto-fetched)          |                                    |
|                           |                                    |
|   EALD TRANSLATION        |                                    |
|   (if enabled)            |                                    |
[===============================================================]
```

### Mobile (stacked)
- Builder panel on top (slots, word, meaning)
- Tile bank below (tabbed, scrollable)
- Spelling rules and definition below builder

### Design system compliance
- Dark fixed header with `--accent:#4338ca; --accent-rgb:67,56,202; --header-rgb:4,4,20;`
- 36px brand icon, 15px h1
- Panels: 2px border with accent tint, 20px radius
- Standard pills, topBtn, hud styles
- Lexend font throughout
- Respects low-stim mode (no animations, muted colours)
- Respects support mode

---

## 4. Tile Bank

### Tabs
Three tabs: **Prefixes** | **Bases** | **Suffixes**
- Only one tab visible at a time
- Tab count badges show number of available tiles (e.g. "Bases (142)")
- Bases tab open by default (since base is required to build any word)
- Active tab uses accent colour

### Search filter
- Text input at top of each tab
- Filters tiles by morpheme form or meaning
- Debounced 150ms

### Tile display
- Tiles are clickable pills with the morpheme text
- Colour-coded by type: blue for prefix, green for base, orange for suffix (matching existing convention)
- Tile shows the display form (e.g. "un-", "happy", "-ness")
- Tiles hidden when non-viable with current selection
- When a tile is placed in the builder, it disappears from the bank

### Tile ordering
- Alphabetical within each tab
- Extension mode tiles mixed in (not separated)

---

## 5. Builder Panel

### Slots
4 slots in a horizontal row:
- `[prefix]` — blue border/background
- `[BASE]` — green border/background, larger (base is central)
- `[suffix1]` — orange border/background
- `[suffix2]` — orange border/background, slightly muted

Empty slots show dashed border + label text. Occupied slots show the morpheme as a solid pill.

### Built word display
- Large text (clamp 24px-48px) showing the computed word
- Green text colour when it's a real dictionary word
- Muted colour when combination doesn't form a real word
- Morpheme boundaries shown with colour coding (prefix in blue, base in green, suffixes in orange)

### Meaning line
- Below the word: "not + happy + state of being" (each morpheme's meaning joined with +)
- Smaller text, muted colour

### Spelling rules panel
- Only visible when at least base + one affix is placed
- Shows step-by-step transformations:
  - "hope + ful → drop silent e → hopeful"
  - "happy + ness → y changes to i → happiness"
  - "run + ing → double the n → running"
- Each step is a labelled card/row
- Clear, educational, age-appropriate language

### Dictionary definition
- Auto-fetched from dictionaryapi.dev when a valid word is formed
- Debounced 300ms after word stabilises
- Shows: word, part of speech, definition (first 1-2 senses)
- Loading state while fetching
- "No definition found" fallback

### EALD translation
- If student has EALD language set, show translation below definition
- Uses existing WordLabData.getTranslations() and speak buttons
- Follows existing EALD patterns from other game pages

---

## 6. Pre-computed Word Index

### Build script: `scripts/build-valid-combos.js`
- Node script, run offline (not at runtime)
- Reads morpheme data from `data.js` (and `wordlab-extension-data.js` for ext version)
- Iterates all combinations: prefix(0-1) × base(1) × suffix1(0-1) × suffix2(0-1)
- For each combo, applies spelling rules (same logic as current `computeWord()`)
- Checks result against the dictionary file
- Outputs two files:
  - `valid-combos.json` — standard morpheme set
  - `valid-combos-ext.json` — standard + extension morphemes

### Data format
```json
[
  { "p": null, "b": "happy", "s1": null, "s2": null, "word": "happy" },
  { "p": "un", "b": "happy", "s1": null, "s2": null, "word": "unhappy" },
  { "p": "un", "b": "happy", "s1": "ness", "s2": null, "word": "unhappiness" },
  { "p": null, "b": "happy", "s1": "ly", "s2": null, "word": "happily" }
]
```

### Runtime loading
- Page fetches the appropriate JSON on load
- Parses into multiple lookup Maps:
  - `byBase: Map<baseId, Set<comboIndex>>`
  - `byPrefix: Map<prefixId, Set<comboIndex>>`
  - `bySuffix: Map<suffixId, Set<comboIndex>>`
- Viability = set intersection of the Maps for current selection
- Result: viable morpheme IDs for each bank, computed in microseconds

### Size estimate
- ~3,000-8,000 valid combinations
- JSON ~100-300KB uncompressed, ~20-50KB gzipped
- Loads in <100ms on any connection

---

## 7. Spelling Rules Engine

Port the existing logic from `morpheme-builder.html`:
- `computeWord()` — applies suffix rules to base + suffixes
- `applySuffixRulesDetailed()` — returns step-by-step explanation

Rules handled:
- Silent e dropping (hope + ful → hopeful)
- Y to I change (happy + ness → happiness)
- Consonant doubling (run + ing → running)
- No change (help + ful → helpful)

These functions are well-tested in the current version. Extract them into a clean module within the page script.

---

## 8. Integration

### Scripts loaded (in order)
1. `wordlab-data.js` — session, EALD, support mode, low-stim
2. `wordlab-scientist.js` — scientist widget in header
3. `wordlab-effects.js` — particle effects (skipped in low-stim)
4. `wordlab-audio.js` — sound effects (skipped in low-stim)
5. `wordlab-help.js` — first-visit help popup
6. `wordlab-hints.js` — Need Advice button
7. `data.js` — morpheme data (ALL_PREFIXES, ALL_BASES, ALL_SUFFIXES)
8. `wordlab-extension-data.js` — loaded conditionally for extension students

### WordLabData API used
- `isExtensionMode()` — choose which combo file to load
- `isSupportMode()` — simplified UI hints
- `getEALDLanguage()` / `getTranslations()` / `buildEALDSpeakButtons()` — translation features
- `initLoginUI()` — login button in header
- `escapeHtml()` — XSS protection
- `speakInLanguage()` / `preloadTTS()` — pronounce the built word
- `isLowStimMode()` — suppress animations

### Scientist widget
- Shows in header via standard `wlPillSlot` pattern
- No reactions needed (no scoring = no correct/wrong events)
- Still shows the student's scientist character

### No recordAttempt()
This is an exploration tool, not a scored activity. No progress tracking needed.

---

## 9. Accessibility

- Skip-to-content link
- ARIA landmarks: banner (header), main (content)
- Tile bank tabs: `role="tablist"`, `role="tab"`, `role="tabpanel"`
- Tiles: `role="button"`, `aria-label="prefix un, meaning not"`
- Builder slots: `role="button"`, `aria-label="prefix slot, contains un"` or `"prefix slot, empty"`
- Keyboard: Tab through tiles and slots, Enter/Space to place/remove
- Focus moves to placed slot after clicking a tile
- `aria-live="polite"` on word display, spelling rules, definition areas
- Colour is never the only indicator (tiles also have type labels)
- Minimum 44px touch targets on tiles

---

## 10. File Structure

All in `/workspaces/morphology-builder/`:

| File | Purpose |
|---|---|
| `morpheme-builder.html` | The rebuilt page (replaces current, ~1500 lines target) |
| `valid-combos.json` | Pre-computed standard word combinations |
| `valid-combos-ext.json` | Pre-computed extension word combinations |
| `scripts/build-valid-combos.js` | Node script to generate the JSON files |

The old `morpheme-builder.html` is replaced entirely. No new shared JS files needed — the page-specific logic stays inline (matching the project convention).

---

## 11. What's NOT Included

- No scoring / XP / quarks
- No recordAttempt() / progress tracking
- No round system / word count picker
- No fuel bar / timer
- No drag-and-drop
- No "greyed out" tiles (hidden instead)
- No side drawer mobile menu
- No base type filter tabs (Latin/Greek/Anglo) — search filter handles this
- No dictionary panel as separate section — inline under the word
