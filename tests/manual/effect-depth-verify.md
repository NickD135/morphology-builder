# Effect Depth — Verification Results

**Task 5 sweep run:** 2026-07-01  
**Branch:** `feat/effect-depth`  
**Harness:** `tests/manual/effect-depth-sweep.html` (login-free, no Supabase)  
**Server:** `python3 -m http.server 8091 --bind 127.0.0.1` (no-cache)  
**Driver:** Playwright MCP

---

## Prior harness (Tasks 1–4)

`tests/manual/effect-depth-harness.html` — **106/106 assertions PASS**  
(Layer ordering, idempotency, stop teardown, z-restore, T2 border-glow halos, T3 orbit wrap, T4 premium depth — all confirmed clean.)

---

## Full 25-Effect Sweep — Shop Container (`.lab-charwrap`, svg z=6)

| Effect | Total nodes | Behind | Front | BoxShadow OK | Stop OK | BS after | Anim after | RESULT |
|---|---|---|---|---|---|---|---|---|
| sparkle | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| shimmer | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| bubbles | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| starfield | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| aura | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| fire | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| frost | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| electric | ✓¹ | ✓¹ | ✓¹ | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| rainbow | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| matrix | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| galaxy | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| pixel | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| radioactive | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| confetti | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| divine | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| quantum | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| aurora | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| vortex | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| hearts-fx | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| snow | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| petals | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| smoke | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| lasers | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| quark-rain | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| blackhole | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |

¹ `electric` creates all its initial nodes synchronously (sparks + flash glow), but they self-destruct at 500ms. The harness performs a sync peek right after `start()` to capture them before the 900ms async wait. The effect correctly populates both layers (4 behind + 3 front at t=0). Interval fires at 900–1300ms so a 900ms async wait alone misses the gap; the peek resolves this timing sensitivity. No change to production code needed.

---

## Full 25-Effect Sweep — Game Container (`.scientist-stage`, `#sciCharWrap` z=20)

| Effect | Total nodes | Behind | Front | BoxShadow OK | Stop OK | BS after | Anim after | RESULT |
|---|---|---|---|---|---|---|---|---|
| sparkle | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| shimmer | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| bubbles | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| starfield | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| aura | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| fire | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| frost | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| electric | ✓¹ | ✓¹ | ✓¹ | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| rainbow | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| matrix | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| galaxy | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| pixel | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| radioactive | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| confetti | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| divine | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| quantum | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| aurora | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| vortex | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ PASS |
| hearts-fx | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| snow | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| petals | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| smoke | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| lasers | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| quark-rain | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |
| blackhole | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✅ PASS |

**25/25 effects pass on both containers. 50/50 rows total.**

---

## World + Effect Z-Coherence

World running: **galaxy** (`.wlworld` z=0, floor z=1, scene z=2, sprites z=3)  
Character: `#sciCharWrap` (z=20, injected by `wordlab-scientist.js` CSS)

| Effect | world sprite z | behind z | char z | front z | order | above sprites | RESULT |
|---|---|---|---|---|---|---|---|
| aura | 3 | 19 | 20 | 21 | ✓ | ✓ (19>3) | ✅ PASS |
| galaxy | 3 | 19 | 20 | 21 | ✓ | ✓ (19>3) | ✅ PASS |
| blackhole | 3 | 19 | 20 | 21 | ✓ | ✓ (19>3) | ✅ PASS |

Budget confirmed: **worldSprite(3) < behind(19) < char(20) < front(21)**. Behind fx clears world sprites by 16 z-units.

---

## Low-Stim Gate

| Test | Config | Result |
|---|---|---|
| `WLEffects.start('galaxy', el)` with `WordLabData.isLowStimMode() = true` | Hard-return before layer creation | ✅ PASS — 0 layers in DOM |

`start()` returns immediately; `_ensureLayers` is never called; no `.wlfx-*` nodes created.

---

## Rapid-Switch Teardown

6 effects started 200ms apart (`sparkle → aura → galaxy → electric → divine → blackhole`), then 600ms settle:

| Behind layers | Front layers | Result |
|---|---|---|
| 1 | 1 | ✅ PASS — exactly one pair, no accumulation |

---

## Mobile (390×844)

Aura + galaxy equipped on `.lab-charwrap` at 390px viewport:

| scrollWidth | noOverflow | layers | Result |
|---|---|---|---|
| 390px | true | 2 (1 behind + 1 front) | ✅ PASS |

No horizontal scroll. Effects don't break layout.

---

## Visual Screenshots

**Aura:** Dark background with soft indigo gradient halo radiating BEHIND the character circle. Character SVG ("AURA preview" text on blue circle) sits clearly in the foreground. The halo is a circular glow in the `.wlfx-behind` layer, NOT a rectangular box-shadow border. ✅ Correct depth.

**Blackhole:** Deep dark background. Character circle ("BLACKHOLE" text on purple disc) is fully visible in the foreground. The black hole halo gradient is visible in the background layer. ✅ Character renders above the blackhole disk/halo.

---

## Per-Page Character Z-Index Override Audit

Grep confirmed: **no HTML page sets `#sciCharWrap` z-index via inline style or per-page CSS**. The only source of z=20 is `wordlab-scientist.js`'s injected `<style>` tag:
```css
#sciCharWrap { position:relative; z-index:20; }
```
This is uniform across all 18 game pages. No per-page fix required.

---

## Summary

| Category | Result |
|---|---|
| Prior harness (Tasks 1–4) | ✅ 106/106 assertions pass |
| Effect sweep — shop container | ✅ 25/25 |
| Effect sweep — game container | ✅ 25/25 |
| Total effect rows | ✅ 50/50 |
| Z-coherence (aura/galaxy/blackhole) | ✅ All pass (3<19<20<21) |
| Low-stim gate | ✅ 0 layers when low-stim |
| Rapid-switch teardown | ✅ Exactly 1 behind + 1 front |
| Mobile 390px | ✅ No overflow, layers ordered |
| Production fix needed | None |
| Per-page z-index override | None found |
