# Wave 3 — Extension Data Retirement

**Date:** 2026-04-12
**Status:** Approved
**Decided:** Option B+ (consume data.js directly, derive Mission Mode relationships from valid-combos.json)

---

## Goal

Delete `wordlab-extension-data.js` entirely. All four remaining games (Meaning Mode, Mission Mode, Flashcard Mode, Speed Builder) consume `window.MORPHEMES` from `data.js` directly, with extension mode acting purely as `+1 stage` runtime filtering — matching the semantic Waves 1 and 2 already established.

## Background

Waves 1 and 2 (shipped 2026-04-12) migrated 228 morphemes and 223 word-pool entries into the unified `data.js` and game files. The remaining four games still splice-swap their morpheme pools from `wordlab-extension-data.js` at load time:

- `flashcard-mode.html:362` — wholesale `window.MORPHEMES` override
- `speed-mode.html:460` — wholesale `window.MORPHEMES` override
- `meaning-mode.html:337-339` — `PREFIXES/SUFFIXES/BASES.splice(...)`
- `mission-mode.html:1073-1076` — `PREFIXES/SUFFIXES/SUFFIX_BASES/BASES.splice(...)`

## Design decision

Original options A (inline migration), B (extend data.js), C (hybrid decorator) were evaluated. On code inspection, `meaningPattern` — the field that motivated Option C — does not exist in `meaning-mode.html`. Meaning Mode's inline arrays are `{id, stage, form, meaning}` — identical to `data.js` shape. Mission Mode's per-base `validPrefixes`/`validSuffixes` are derivable from `valid-combos.json` (3,966 entries). This unlocks Option B+ — direct consumption of `data.js` with no decoration tables and no schema extensions.

---

## Phase 1 — Content migration

Move 154 unique extension morphemes from `wordlab-extension-data.js` into `data.js` as `stage:null`:

| Source array | Count | Destination in data.js |
|---|---|---|
| `EXT_MEANING_PREFIXES` | 53 | `PREFIXES` |
| `EXT_MEANING_SUFFIXES` | 38 | `SUFFIXES` |
| `EXT_MEANING_BASES` | 40 | appropriate base group (core/anglo/latin/greek) |
| `EXT_MISSION_BASES` | 9 | appropriate base group |
| `EXT_MISSION_SUFFIX_BASES` | 14 | appropriate base group |

Rules:

- All entries land as `stage:null` (visible at every stage under cumulative filter). Tag via spreadsheet in a follow-up session.
- Dedupe on insert — any morpheme already present by `id` is skipped.
- `EXT_MISSION_*` entries with `validPrefixes`/`validSuffixes` lose those fields on migration — that relationship data is recomputed in Phase 2 from `valid-combos.json`.
- Pre-flight check: diff meaning-mode.html inline array `id`s against `data.js` — any in the inline arrays but missing from data.js also land in data.js as part of this phase.

Verification:

- Rebuild `valid-combos.json` via `node scripts/build-valid-combos.js`. Count must be ≥ 3,966 (previous). No word regressions.

Commit: `content(stage): migrate 154 extension morphemes into data.js`

---

## Phase 2 — Mission & Meaning refactor

### Shared pattern (both games)

Delete inline `PREFIXES` and `SUFFIXES` arrays. Replace with filtered reads from `window.MORPHEMES`:

```js
const PREFIXES = WLStage.filterByStage(
  window.MORPHEMES.prefixes, WordLabData.getStudentStage('game-name')
);
const SUFFIXES = WLStage.filterByStage(
  window.MORPHEMES.suffixes, WordLabData.getStudentStage('game-name')
);
```

Then apply `weightByStage` as currently done (already present in both games at stage-filter blocks).

### Meaning Mode

Inline `BASES` also deletes — consumes `window.MORPHEMES.bases` the same way. Zero special fields. Zero decoration. The `_origMeanPfx`/`_origMeanSfx`/`_origMeanBas` backup copies (used for custom morpheme priority modes) become copies of the filtered `window.MORPHEMES` arrays.

Delete the extension splice-swap at lines 334–341.

Commit: `refactor(meaning): consume window.MORPHEMES directly, delete inline arrays`

### Mission Mode

`BASES` and `SUFFIX_BASES` become derived at startup via a new helper:

```js
// In wordlab-data.js (or inline in mission-mode.html)
WordLabData.deriveMissionBases = function(combosJson, allBases, stage) {
  // Group valid-combos by base
  var prefixMap = {};  // baseId → Set of valid prefix ids
  var suffixMap = {};  // baseId → Set of valid suffix ids
  combosJson.forEach(function(c) {
    if (c.p) {
      if (!prefixMap[c.b]) prefixMap[c.b] = new Set();
      prefixMap[c.b].add(c.p);
    }
    if (c.s1) {
      if (!suffixMap[c.b]) suffixMap[c.b] = new Set();
      suffixMap[c.b].add(c.s1);
    }
    if (c.s2) {
      if (!suffixMap[c.b]) suffixMap[c.b] = new Set();
      suffixMap[c.b].add(c.s2);
    }
  });

  // Join with morpheme data, split into prefix-compatible and suffix-compatible pools
  var bases = [];        // for prefix matching mode
  var suffixBases = [];  // for suffix matching mode
  allBases.forEach(function(m) {
    var vp = prefixMap[m.id];
    if (vp && vp.size > 0) {
      bases.push(Object.assign({}, m, { validPrefixes: Array.from(vp) }));
    }
    var vs = suffixMap[m.id];
    if (vs && vs.size > 0) {
      suffixBases.push(Object.assign({}, m, { validSuffixes: Array.from(vs) }));
    }
  });

  return { bases: bases, suffixBases: suffixBases };
};
```

Runtime flow:

1. Fetch `valid-combos.json` (add `<script>` or `fetch()` — ~250KB, cached by Vercel headers).
2. Call `deriveMissionBases()` with the JSON, filtered `window.MORPHEMES.bases`, and student stage.
3. Result populates module-scope `BASES` and `SUFFIX_BASES`.
4. `isRealWord` becomes the `validPrefixes`-based check **always** (line 1079 logic). The dictionary-lookup fallback (line 1309) is removed. Every base now has authoritative `validPrefixes`/`validSuffixes` from valid-combos.json.

Custom morphemes: the existing merge code at lines 1167–1185 keeps working — it mutates the derived arrays the same way it mutated the inline ones.

Delete the extension splice-swap at lines 1071–1080.

Commit: `refactor(mission): derive BASES from valid-combos.json, delete inline arrays + splice-swap`

---

## Phase 3 — Flashcard + Speed cleanup

Delete the `window.MORPHEMES = WL_EXTENSION.*` overrides:

- `flashcard-mode.html:362`
- `speed-mode.html:460`

After Phase 1, `data.js` has all the morphemes these games were swapping in. `filterByStage` handles the rest. Both games already call `filterByStage` or `weightByStage` on their morpheme pools.

Commit: `refactor(flashcard,speed): remove extension override, use unified data.js`

---

## Phase 4 — Final cleanup

1. Delete `wordlab-extension-data.js` entirely.
2. Remove `<script defer src="wordlab-extension-data.js">` from all game pages (grep `wordlab-extension-data` across `*.html`).
3. Visual smoke test: each of the four games loads with no console errors in both normal and extension mode.
4. Verify Morpheme Builder still works (sanity — it was Wave 1, but shares the pool).
5. Grep `WL_EXTENSION` across the repo — zero matches confirms full removal.

Commit: `chore: delete wordlab-extension-data.js (Wave 3 complete)`

---

## Testing approach

- **Phase 1:** rebuild valid-combos.json, verify count ≥ 3,966.
- **Phase 2:** manual click-test of Meaning Mode and Mission Mode in both normal and extension mode. Verify:
  - Combining-form bases (phon, scope, graph) still match valid prefixes in Mission Mode.
  - Extension students see more content than non-extension (the +1 stage filter).
  - Custom morphemes still merge correctly.
- **Phase 3:** click-test Flashcard and Speed Builder in both modes.
- **Phase 4:** `grep -r 'WL_EXTENSION' *.html *.js` — zero matches.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Meaning Mode inline BASES (~180 entries) not fully covered by data.js | Pre-flight diff of `id`s; any missing land in data.js as part of Phase 1 |
| valid-combos.json missing combining-form bases (phon, scope, etc.) | Wave 1 rebuild already added these (verified in project_current_status.md). Spot-check before refactor. |
| Custom morphemes integration breaks after array source changes | Mutation-based merge code unchanged — operates on derived arrays same as inline ones |
| 154 new entries untagged (stage:null) | Intentional. Untagged = visible everywhere under cumulative filter. Tag in next spreadsheet pass. |
| valid-combos.json load adds latency to Mission Mode startup | ~250KB file, gzipped ~40KB. Cached by Vercel (1hr JS cache headers). One-time fetch per page load. |
| BASES/SUFFIX_BASES derived from valid-combos miss bases with no combos | By design — bases without valid prefix/suffix combos can't be gameplay-matched. They're filtered out. |
