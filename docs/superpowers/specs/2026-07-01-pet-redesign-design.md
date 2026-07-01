# Pet Redesign + Re-enable (Design Spec)

**Date:** 2026-07-01
**Status:** Approved-by-delegation (owner asked to finish Phase 3 autonomously, then push). Aesthetic/product choices below are conservative defaults, each flagged in the morning checklist for review.
**Sub-project of:** Phase 3 (art port). Sub-project 4 (final).

---

## 1. Background & goal
Word Labs has a fully-built **pet companion system** that was hidden (and its shop UI later deleted in the Lab Shop reskin) because the pet artwork's visual quality lagged the rest of the app. The data model, save RPC (`save_scientist_field` accepts `pet`), purchase RPC (`atomic_purchase`, generic), reaction plumbing (`_petReact` via `react()`), and CSS animations (`petIdle/petJump/petSad/petDance`) are all still intact. Every game page still has an empty `#petCharWrap` div waiting for a pet.

**Goal:** (a) **redesign the 9 pet SVGs** in the same soft-plush dimensional language as the newly-shaded character, and (b) **re-enable** the system end-to-end — a Pets shop category, on-stage render on the scientist page + game pages, low-stim-safe.

---

## 2. Non-goals
- No change to the pet **ids/names/costs** (keep the original 9 so existing `owned` arrays / saved `pet` values stay valid).
- No new pets (the mockup's 25-emoji set is a different, disconnected direction — not pursued).
- No backend/RPC/migration change (data model already pet-ready).
- No pet audio (none exists; out of scope).
- No per-pet reaction art variants (reactions remain the existing CSS whole-body animations; `buildPetSVG`'s unused `reaction` param stays a no-op).
- No change to the character `buildSVG` or its frozen anchors — pets are a **separate** `buildPetSVG`/`PET_SVGS`, independent.

---

## 3. Architectural decisions
| # | Decision | Reason |
|---|---|---|
| D1 | **Keep the 9 ids** exactly: `cat, ginger_cat, puppy, bird, frog, owl, dragon, horse, hamster`. Redesign the SVG bodies only. | Backward-compat: saved `pet` values + `owned` entries keep working; costs/names unchanged. |
| D2 | Redesign each pet in the **soft-plush** language: body filled with a per-pet **radial gradient** (highlight top-left → base → shade bottom) via the existing `_mix` helper; soft belly/cheek highlight; a **ground contact shadow** ellipse; big friendly eyes with a white catch-light; optional cheek blush. Rounder, chunkier, toy-like proportions. | Matches the Phase-3 character shading; fixes the "flat single-fill" quality gap that got the system hidden. |
| D3 | **viewBox stays `0 0 80 80`** (unchanged) for every pet. No geometry contract change — the tank/inject/game-page `#petCharWrap` already expect it. | Drop-in; no CSS/layout ripple. |
| D4 | Gradient/def ids are **per-call uid-suffixed** (mirror `buildSVG`'s `_sciSeq` uid pattern). | Two pets could co-render (shop card preview + stage); avoid cross-pet gradient bleed. |
| D5 | **No `<filter>`, no in-SVG `<animate>`** — static art. Motion stays in the existing CSS keyframes (`pet-idle`/`-correct`/`-wrong`/`-streak`), which are already low-stim gated at the `react()` level. | Low-stim safe; consistent with the rest of the art. |
| D6 | **Re-enable UI:** (a) add a `pets` array back to `wordlab-shop-data.js`; (b) add a `pet` category to `scientist.html` `WL.CATS` (card preview renders the real `buildPetSVG`, not a mini character); (c) render the equipped pet on the scientist stage as a **small podium companion** beside the character (NOT the old "glass terrarium" chrome — the new Lab Shop is a podium aesthetic); (d) un-gut `_injectPetStage()` so game pages render the pet into their existing `#petCharWrap`. | Mirrors the working hair/heads category machinery; fits the reskinned shop. |
| D7 | **Low-stim:** add `body.low-stim #petCharWrap { animation:none !important; }` (+ the scientist-page pet container) — the idle bob is NOT currently gated (genuine gap found in recon). Reactions already gated via `react()`. | Sensory accommodation parity with the character. |
| D8 | Pets are **purchasable** (keep original costs: frog 80, bird/hamster 100, cat/ginger 120, puppy 150, owl/horse 200, dragon 500 legendary). `none` = free/unequip. | Pets are an aspirational quark sink (unlike free identity items like skin/hair); preserves the original economy. |

---

## 4. Content (the 9 pets — ids/names/costs FROZEN)
`none`(free) · `cat` Grey Cat 120 · `ginger_cat` Ginger Cat 120 · `puppy` Puppy 150 · `bird` Bluebird 100 · `frog` Lab Frog 80 · `owl` Wise Owl 200 · `dragon` Baby Dragon 500 (legendary) · `horse` Mini Horse 200 · `hamster` Hamster 100.

Each redesigned pet: shaded gradient body + head, soft highlight, contact shadow, friendly eyes w/ catch-light, species-defining features (cat ears+whiskers+tail, bird wing+beak, frog wide mouth+legs, owl facial disc, dragon wings+snout, horse mane, hamster cheeks, puppy floppy ears). Keep it cute/plush, legible at the tank size (~90–120px) and at 44px.

## 5. Rendering
- Per pet: `PET_SVGS[id]` is a function or template producing the `<svg viewBox="0 0 80 80">…</svg>` string with uid-suffixed gradient ids. (If kept as strings, wrap in a builder that injects a uid — simplest: `buildPetSVG` already exists; have it interpolate a uid into per-pet template functions.)
- Ground contact shadow ~`cy 72`, body radial highlight upper-left.
- 44px + tank-size legible; bold plush silhouettes.

## 6. Constraints (inherited)
Vanilla JS, no build, no new deps, NO DB migration. Per-call uid ids. No filter/motion. Low-stim safe (idle bob newly gated). Reactions/character/shop all still compose. Independent of `buildSVG` (separate renderer).

## 7. Files touched
| File | Change |
|---|---|
| `wordlab-scientist.js` | Redesign `PET_SVGS` (9, soft-plush + uid gradients); `buildPetSVG` injects uid; **un-gut `_injectPetStage()`** to render the equipped pet into `#petCharWrap` + toggle display. |
| `wordlab-shop-data.js` | Re-add `pets` array (9 + none, original names/costs/rarity/icons); expose in `WLShopData`. |
| `scientist.html` | `WL.CATS` `pet` entry (card/modal preview renders `buildPetSVG`); `renderStage` renders the equipped pet as a podium companion; equip wiring (pet field like head/face/wings, `none`→null). |
| `wordlab-data.js` | Low-stim CSS: `#petCharWrap` idle animation off. |
| `breakdown-mode.html` | Revisit the mobile `#petCharWrap{display:none!important}` rule (keep — avoids clutter on the mobile-pinned scientist; note in checklist). |
| `tests/manual/pet-redesign-harness.html` | New. Renders all 9 pets at tank + 44px, reaction classes, isolation (2 pets, no shared gradient id), low-stim. |

## 8. Verification (synthetic harness, no login)
- Render each pet at tank size (~110px) + 44px; 0 render errors.
- Isolation: two pets on one page share no gradient id.
- Reaction classes apply (pet-correct/-wrong/-streak) without error; idle bob present, and suppressed under `body.low-stim`.
- Shop card preview renders the real pet; equip sets `scientist.pet`; stage shows the companion.
- Screenshots (9-pet grid, 44px row, before/after) for the morning checklist. Then merge to main and **push** (owner authorized).

## 9. Open items (flagged for owner review)
- The redesigned pet silhouettes (my conservative plush defaults).
- Podium-companion placement + size on the scientist page (vs. the retired terrarium).
- Whether the mobile `#petCharWrap` hide on breakdown-mode should be lifted (defaulted: keep).
- Pet costs unchanged (defaulted: yes).
