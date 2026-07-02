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

1. **Morpheme set:** Full flashcard set + content push. Show all prefixes/suffixes; expand content so nearly all are buildable; accept that a few pure combining-form pairs may remain thin.
2. **Level filter:** Show everything to everyone; *highlight* the student's current level rather than gating.
3. **Non-linkable tiles:** **Hidden** while a selection is active (keeps the current mechanic — simpler than greying/demoting). To change direction, the student clears a slot (existing behaviour), which brings the full list back.
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
- **`renderTiles`:** keep the current hide-non-viable mechanic (`if (!viableSet.has(m.id)) continue;`), with a subtle fade-in for cleanliness (see §3).
- **2nd suffix slot** rendered conditionally (see §4).
- **Search** made prominent (icon + clear) and query persists across tab switches (see §5).
- **Level highlight** marker on tiles above the student's stage (see §6).

**Changes (Stream B — content):**
- Expand `data.js` bases and `dictionary.txt`; rebuild `valid-combos.json` via `scripts/build-valid-combos.js` (see §7).

---

## 3. Bank behaviour: show-all, hide-non-viable, change-by-clearing

For the active tab, show every morpheme that is **viable** (can extend the current selection into at least one real word), using the existing `getViableMorphemes()` result. Non-viable morphemes are **hidden** while a selection is active — this keeps the current, simple mechanic.

**Rendering:**
- Tiles shown in the current type-colour (blue prefix / green base / orange suffix), sorted alphabetically by `form`.
- When **nothing** is selected, *all* morphemes show (no level gate) — this is the change that fixes "only a handful of prefixes."
- As tiles appear on a selection change, a subtle fade-in keeps it feeling clean. Under `body.low-stim` **or** `prefers-reduced-motion: reduce`, no fade — render instantly.
- Live viable counts continue to show on each tab via `updateTabCounts` (already present), so the student can see e.g. "Prefixes (12)" for the current base even before switching tabs.

**Changing direction (no clickable-greyed needed):**
- Placing a tile of a type that's already filled replaces that slot (existing `placeTile` behaviour), as long as the new tile is visible (i.e. viable).
- To pick something that *isn't* currently viable, the student **clears a slot** — click the filled slot to remove it (existing `removeSlot` behaviour) — which brings the full list back. Simple and already implemented.

**Accessibility:**
- Every visible tile stays a `<button>` with its `form` + `meaning` label (unchanged).
- Viable counts announced via the existing `aria-live` tab-count region (`updateTabCounts`).

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
- Search interacts cleanly with hide-non-viable: it filters within the currently-viable set.
- Optional nicety (include if cheap): when the active tab has 0 matches but another tab has some, show a one-line hint ("3 matches in Suffixes"). Not required for approval.

---

## 6. Level highlight

- Determine the student's stage via `WordLabData.getStudentStage('morpheme-builder')` (may be null when logged out or unstaged).
- Tiles whose `stage` is **above** the student's stage get a small ✦ corner marker meaning "stretch / above your level." Tiles at or below the student's level render normally (no marker).
- Logged-out / no stage set → no markers at all.
- The marker is static (no animation), fully compatible with low-stim, and never changes whether a tile is usable — everything remains clickable.
- Independent of viability: a visible tile carries the ✦ marker based only on its `stage` vs the student's; keep the marker visually lightweight.

---

## 7. Content push (Stream B)

**Objective:** revive the dead (23 prefixes, 24 suffixes) and thin (<5 combos) morphemes so the builder can make real words with them.

**Method:**
1. For each target prefix/suffix, identify real, age-appropriate English words (ages 9–12, **Australian spelling**) that use it — pairing with an existing base where possible, or a **new base added to `data.js`** where needed (e.g. treat a Greek combining root as a base so `pseudo + nym → pseudonym` can form).
2. Add any missing real words to `dictionary.txt` (the validity gate; ~21k words today). **Only genuine words** — no padding, no obscure/technical junk that a Year 3–6 child would never meet. Australian spellings.
3. Add/enrich bases in `data.js` (readable ids where practical, correct `stage`, `meaning`, `pos`, `examples`).
4. Rebuild `valid-combos.json` with `node scripts/build-valid-combos.js`.

**Target:** **prefixes are the priority** — aim for **4–5 buildable words per prefix**, drawing on real, age-appropriate words. Where a prefix genuinely can't reach 4–5 with age-appropriate vocabulary (e.g. rare combining forms), get it as high as real words allow and note it. Suffixes get the same 4–5 aim where real words exist, after prefixes.

**Honest ceiling:** some pure combining-form pairs and clinical/technical morphemes (`-emia`, `-uria`, `cyte`, `narco-`, `-cide`, …) may remain thin or dead because no age-appropriate everyday word exists, or because the word is two bound roots that don't fit prefix+base+suffix. These will be **listed explicitly** in the delivery notes. With the hide-non-viable model they simply won't surface as options once a selection narrows the list (and a dead affix picked on its own yields an empty bank until the student clears it) — no broken or misleading UI.

**Success metric / verification:**
- A **before/after coverage report**: count of prefixes and suffixes with 0 / 1–3 / 4+ buildable combos, and total combo count.
- A **dictionary-diff review**: every word added to `dictionary.txt` is a real, age-appropriate, correctly-(Australian)-spelled word.
- Spot-check a sample of newly-revived morphemes in the running builder.

---

## 8. Non-functional requirements

- **Accessibility (WCAG 2.1 AA):** visible tiles are focusable buttons with descriptive labels; viable counts announced via existing aria-live counts; search field labelled; keyboard operable throughout; ✦ marker has an accessible-name equivalent (e.g. in the aria-label), not colour-only.
- **Low-stim / reduced-motion:** no fade animation, no idle scientist bob (already handled), instant render; ✦ marker is static and allowed.
- **Mobile (320–480px):** tiles wrap, tabs and search usable, 44px minimum touch targets (preserve current responsive rules).
- **No scoring / progress changes:** the builder records nothing today (pure exploration) — keep it that way; this is what makes it equally suitable for teacher-led board use and independent student exploration. No `recordAttempt`, no dashboard surface.
- **Performance:** rendering the full bank (400+ bases) with no level gate must stay smooth; the fade-in is CSS-only. Combo index build is one-time on load (unchanged).
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
