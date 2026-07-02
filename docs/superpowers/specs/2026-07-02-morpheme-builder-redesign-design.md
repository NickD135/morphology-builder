# Morpheme Builder Redesign — Design Spec

**Date:** 2026-07-02
**Owner:** Nicholas Deeney
**File under redesign:** `morpheme-builder.html` (Stream A) + `data.js` / `dictionary.txt` / `valid-combos.json` (Stream B)
**Approach:** Evolve the existing builder in place (keep the accurate combo/spelling engine; rework behaviour and feel on top). The "teaching wall" (all three banks visible at once) is explicitly out of scope for this pass — a possible later enhancement.

---

## 1. Problem & Goal

The Morpheme Builder was the game's original design and has become its weakest part. Symptoms:

- **Only a handful of prefixes appear.** Root cause: the bank is passed through `WordLabData.filterByStage(...)` (see `morpheme-builder.html:217-219`), which restricts morphemes to a logged-in student's curriculum stage. Flashcards, by contrast, show the full set (their stage filter is accidentally a no-op because `normalise*` drops the `stage` field).
- **Tiles vanish** when they can't combine (`renderTiles` does `if (!viableSet.has(m.id)) continue;` at `morpheme-builder.html:850`) — pedagogically confusing.
- **Coverage gap.** ~23 prefixes and ~24 suffixes that flashcards teach cannot build a single real word in the builder (all advanced Greek/Latin: `pseudo-`, `-phobia`, `-itis`, `cyber-`, …), plus a long tail with only 1–4 buildable words.

**Goal:** Make the builder show the same rich morpheme set students learn in Flashcards, make almost every tile actually build real words, and make the interaction smooth, discoverable, and equally good for whole-class teaching or independent exploration.

### Approved decisions (from brainstorming)

1. **Morpheme set:** Full flashcard set + maximum content push. Show all prefixes/suffixes; expand content so nearly all are buildable; accept that a few pure combining-form pairs may remain thin.
2. **Level filter:** Show everything to everyone; *highlight* the student's current level rather than gating.
3. **Non-linkable tiles:** Grey and demote (not hide), and keep them **clickable** — clicking swaps that slot's selection and re-forms the board.
4. **Suffix slots:** Support two suffixes; **hide the 2nd suffix slot until the first is placed**; one suffix is always sufficient.

---

## 2. Architecture (what stays, what changes)

**Stays (do not alter its correctness):**
- Combo index built from `valid-combos.json` — entries `{p, b, s1, s2, word}` (`morpheme-builder.html:284-311`).
- Viability math (`getViableCombos` / `getViableMorphemes`, lines 314-397).
- Spelling-rule engine (`applyPrefixRulesDetailed`, `applySuffixRulesDetailed`, chain — lines 442-594).
- Word display, meaning chain, dictionary lookup, TTS, EALD (lines 665-826).
- Data source `window.MORPHEMES` from `data.js` (`.prefixes`, `.suffixes`, `.bases`).

**Changes (Stream A — `morpheme-builder.html`):**
- **Remove the level gate on the bank.** Build `PREFIXES/SUFFIXES/BASES` from the full `MORPHEMES.*` arrays (no `filterByStage`). Keep each morpheme's `stage` field available for the level-highlight.
- **`renderTiles` reworked** from hide → grey-demote + reorder + FLIP animation (see §3).
- **Tile click** always sets/replaces its slot (swap semantics), including greyed tiles (see §3).
- **2nd suffix slot** rendered conditionally (see §4).
- **Search** made prominent (icon + clear) and query persists across tab switches (see §5).
- **Level highlight** marker on tiles above the student's stage (see §6).

**Changes (Stream B — content):**
- Expand `data.js` bases and `dictionary.txt`; rebuild `valid-combos.json` via `scripts/build-valid-combos.js` (see §7).

---

## 3. Bank behaviour: viable-first, grey-demote, clickable-swap, smooth motion

For the active tab, partition morphemes into **viable** (can extend the current selection into at least one real word) and **non-viable**, using the existing `getViableMorphemes()` result.

**Rendering & order:**
- Viable tiles: full type-colour (blue prefix / green base / orange suffix), sorted alphabetically by `form`, placed first.
- Non-viable tiles: a `is-dulled` state — reduced opacity (~0.4), desaturated (grayscale filter) — sorted alphabetically, placed after the viable group.
- When nothing is selected, *all* tiles are viable (full colour), alphabetical.
- A thin divider/label may separate the two groups (e.g. a faint "— won't link to your current word —" row). Optional; keep subtle.

**Smooth motion (FLIP):**
- On any selection change, record each tile's current rect (First), re-render to the new order (Last), invert with a transform, then play the transition so tiles glide to new positions.
- Under `body.low-stim` **or** `prefers-reduced-motion: reduce`, skip the animation — reorder instantly.

**Clickable-swap semantics:**
- Clicking **any** base tile (viable or dulled) sets `current.base` to it (replacing whatever was there) and re-renders. The board re-forms around the new base.
- Clicking **any** prefix tile sets/replaces `current.prefix`.
- Clicking **any** suffix tile fills the next open suffix slot (`suffix1` then `suffix2`); if both are full it replaces `suffix1` and clears `suffix2` (preserves current behaviour at `morpheme-builder.html:606-611`). Dulled suffixes are allowed — the resulting word simply shows as "not a real word yet" via the existing valid/invalid word display.
- Net effect: a student can always click anything; the builder never dead-ends.

**Accessibility:**
- Every tile stays a `<button>`. Dulled tiles are **not** `disabled` (they're clickable). Their `aria-label` gains a suffix like " — no words with your current pick; click to build from this instead."
- After a re-render, announce the viable counts via the existing `aria-live` tab-count region (already present: `updateTabCounts`).

---

## 4. Slots & building

- Slots row: **Prefix · Base · Suffix** always present (empty = dashed placeholder, as today).
- **2nd suffix slot** (`slotSuffix2`) is rendered/visible **only when `current.suffix1` is set**. When `suffix1` is cleared, any `suffix2` promotes to `suffix1` (existing `removeSlot` logic at lines 616-623) and the 2nd slot collapses out of the layout (no reserved empty box).
- One suffix always builds a valid word where one exists; the second is purely additive.
- Word display, meaning chain (`prefix + base + suffix…`), spelling-rule step cards, dictionary definition, speak button, and EALD translation: **unchanged**.

---

## 5. Search

- Replace the plain input with a search field that has a leading 🔍 icon and a trailing × clear button.
- Placeholder reflects the active tab ("Search prefixes…", etc.).
- **Query persists across tab switches** (remove the `elFilterInput.value = ''` reset in `switchTab`, lines 925-926). Searching "port" then switching Bases→Suffixes keeps filtering.
- Filter matches `form`, `display`, and `meaning` (as today, line 857).
- Search interacts cleanly with grey-demote: matched tiles still partition viable-first / dulled-after.
- Optional nicety (include if cheap): when the active tab has 0 matches but another tab has some, show a one-line hint ("3 matches in Suffixes"). Not required for approval.

---

## 6. Level highlight

- Determine the student's stage via `WordLabData.getStudentStage('morpheme-builder')` (may be null when logged out or unstaged).
- Tiles whose `stage` is **above** the student's stage get a small ✦ corner marker meaning "stretch / above your level." Tiles at or below the student's level render normally (no marker).
- Logged-out / no stage set → no markers at all.
- The marker is static (no animation), fully compatible with low-stim, and never changes whether a tile is usable — everything remains clickable.
- Orthogonal to the viable/dulled state: a tile can be dulled *and* carry the ✦ marker; keep the marker visually lightweight so the two states don't clash.

---

## 7. Content push (Stream B)

**Objective:** revive the dead (23 prefixes, 24 suffixes) and thin (<5 combos) morphemes so the builder can make real words with them.

**Method:**
1. For each target prefix/suffix, identify real, age-appropriate English words (ages 9–12, **Australian spelling**) that use it — pairing with an existing base where possible, or a **new base added to `data.js`** where needed (e.g. treat a Greek combining root as a base so `pseudo + nym → pseudonym` can form).
2. Add any missing real words to `dictionary.txt` (the validity gate; ~21k words today). **Only genuine words** — no padding, no obscure/technical junk that a Year 3–6 child would never meet. Australian spellings.
3. Add/enrich bases in `data.js` (readable ids where practical, correct `stage`, `meaning`, `pos`, `examples`).
4. Rebuild `valid-combos.json` with `node scripts/build-valid-combos.js`.

**Target:** every prefix and suffix for which a real, age-appropriate word exists reaches **≥3 buildable words**.

**Honest ceiling:** some pure combining-form pairs and clinical/technical morphemes (`-emia`, `-uria`, `cyte`, `narco-`, `-cide`, …) may remain thin or dead because no age-appropriate everyday word exists, or because the word is two bound roots that don't fit prefix+base+suffix. These will be **listed explicitly** in the delivery notes and will simply render as the always-dulled tiles (the grey-demote UI handles them gracefully).

**Success metric / verification:**
- A **before/after coverage report**: count of prefixes and suffixes with 0 / 1–2 / 3+ buildable combos, and total combo count.
- A **dictionary-diff review**: every word added to `dictionary.txt` is a real, age-appropriate, correctly-(Australian)-spelled word.
- Spot-check a sample of newly-revived morphemes in the running builder.

---

## 8. Non-functional requirements

- **Accessibility (WCAG 2.1 AA):** dulled tiles remain focusable buttons with descriptive labels; reorder announced via existing aria-live counts; search field labelled; keyboard operable throughout; ✦ marker has an accessible-name equivalent (e.g. in the aria-label), not colour-only.
- **Low-stim / reduced-motion:** no FLIP animation, no idle scientist bob (already handled), instant reorder; ✦ marker and dulling are static and allowed.
- **Mobile (320–480px):** tiles wrap, tabs and search usable, 44px minimum touch targets (preserve current responsive rules).
- **No scoring / progress changes:** the builder records nothing today (pure exploration) — keep it that way; this is what makes it equally suitable for teacher-led board use and independent student exploration. No `recordAttempt`, no dashboard surface.
- **Performance:** FLIP measurement must not thrash layout on large banks (400+ bases); batch reads then writes. Combo index build is one-time on load (unchanged).
- **XSS/safety:** continue building tiles and rule steps via DOM methods / escaped morpheme data (unchanged from current implementation).

---

## 9. Out of scope (this pass)

- "Teaching wall" layout (all three banks visible simultaneously) — later enhancement.
- Any change to the spelling-rule correctness engine.
- Turning the builder into a scored game / dashboard integration.
- A wholesale external-dictionary import (rejected: junk-word risk hurts accuracy).

---

## 10. Deliverables

1. Reworked `morpheme-builder.html` implementing §3–§6, §8.
2. Expanded `data.js` (bases) and `dictionary.txt` (real words) per §7.
3. Regenerated `valid-combos.json`.
4. Before/after coverage report + list of any morphemes that remain dead and why.
