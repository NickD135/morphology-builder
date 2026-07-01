# Pet Redesign — Morning Checklist (for Nick)

Branch `feat/pet-redesign`, merged locally to `main` — **not pushed yet**. This is the
final verification pass before you take a look and decide when to push (push = live deploy).

## What changed

The 9 pet companions got a full soft-plush art redesign (rounder bodies, gradient shading,
matching the character's dimensional-shading style from the earlier art pass), and the
whole Pet system — previously built but hidden — is **re-enabled**:

- Pets shop category on `scientist.html` (a "Pets" pill alongside Colours/Head/Face/etc.)
- A pet companion renders on a podium next to the character, on the shop page and on
  every game page's scientist stage
- Pets react to correct/wrong/streak answers (little jump/sad-wobble/dance animations)

## The 9 pets + costs (unchanged from before)

| Pet | Cost | Rarity |
|---|---|---|
| Lab Frog | 80 | common |
| Bluebird | 100 | common |
| Hamster | 100 | common |
| Grey Cat | 120 | common |
| Ginger Cat | 120 | common |
| Puppy | 150 | common |
| Wise Owl | 200 | common |
| Mini Horse | 200 | common |
| Baby Dragon | 500 | **legendary** |

"None" (no pet equipped) is free — it's not a purchasable pet, just the default/removal option.
No pet is free to acquire; every real pet costs quarks, same as before the redesign.

## Decisions flagged for your review

1. **Redesigned silhouettes are new art, not a re-skin.** The original 9 pets were simpler
   shapes; these are fuller "soft-plush" bodies with proper shading (highlight + shadow
   gradients), matching the character redesign. Take a look at the screenshots below and
   confirm you're happy with the style before this goes live.
2. **Podium-companion placement** — the pet now sits beside the character on a small
   "tank" platform (glassy terrarium-style backdrop), both on the shop page and on game
   pages. This replaces the old hidden terrarium display that was never shown to students.
3. **Costs are unchanged** — same 9 price points as the original (hidden) pet system, so
   if any student previously had virtual currency history around pets, nothing breaks.
4. **Mobile hide on Breakdown Blitz kept** — on narrow screens (≤700px) the pet is hidden
   on `breakdown-mode.html` specifically (`.scientist-stage #petCharWrap{display:none}`)
   because that page pins the scientist to a small fixed corner badge on mobile and there's
   no room for a second character. Other game pages show the pet normally on mobile.
5. **Surprise-me includes pets** — the shop's "🎲 Surprise me" randomiser will also pick a
   random pet, but (like every other category) only from pets the student already owns or
   that are free — it never gifts an unowned pet.

## Pets that read a little awkwardly at 44px (header-widget size)

Honest take, from screenshots at both ~110px (shop podium) and 44px (header widget):

- **Mini Horse** — reads noticeably more "realistic quadruped" than the other 8 (longer
  body, thin legs, elongated neck) rather than the round plush-toy proportions the rest of
  the set uses. It's still recognisable as a horse and not broken, but it doesn't quite
  match the "cute blob" family feel of cat/frog/hamster/owl etc. Worth a look if you want
  full visual consistency across the set — not a blocker.
- **Baby Dragon** — the wings read as small rounded paddle/flipper shapes rather than
  classic pointy dragon wings at 44px; still clearly a dragon (purple, spikes, horns) but
  the wing silhouette is the softest read of the bunch at the smallest size.
- Everything else (cat, ginger cat, puppy, bird, frog, owl, hamster) reads clearly and
  cleanly at both sizes.

## What was verified this session (Task 4 — final sweep)

All checks automated and run headless via a Playwright harness
(`tests/manual/pet-redesign-harness.html`) — no login/Supabase needed:

- **All 9 pets render with zero errors**, including a `none`/`null` empty-string check and
  an unknown-id-returns-empty check
- **9 pets × 4 reaction classes** (`pet-idle`, `pet-correct`, `pet-wrong`, `pet-streak`)
  applied to the wrapper — 72 cells total (9 × 4 × 2 sizes), every one applied its class
  and rendered cleanly. 0 errors.
- **Low-stim mode** — with `body.low-stim` active, the idle bob animation computes to
  `none` (confirmed via `getComputedStyle`), matching the same suppression pattern used
  for the main character
- **Same-page isolation (strong check)** — all 9 pets rendered together on one page;
  every gradient id collected (`[id^="petG"]`) — **18 total, 18 unique, zero duplicates**.
  This confirms the earlier two-species spot-check generalises to the full set: no pet's
  gradients can visually bleed into another pet's colours when several are on the same
  page at once (e.g. a future "meet your classmates' pets" feature, or just two widget
  instances on one page).
- **Shop catalogue** — 10 entries exposed (9 pets + "none"), all with valid id/name/cost
- **Game-page stage + low-stim gate** — simulated `_injectPetStage` render path: pet
  renders into `#petCharWrap`, idle animation runs by default, low-stim class stops it
- **Mobile** — harness page itself reflows cleanly to a single column at 390px width, no
  horizontal scroll or clipping

**Result: 0 errors across every check. No production code fix was needed this session** —
Tasks 1–3's work held up under the full sweep.

Screenshots saved in `tests/manual/screenshots/`:
`pet-sweep-tank-grid.png`, `pet-sweep-44px-row.png`, `pet-sweep-reaction-row.png`,
`pet-sweep-low-stim.png`, `pet-sweep-mobile-390.png`.

## Still pending (needs a real logged-in pass, not just the synthetic harness)

- **Buy flow** — actually purchasing a pet in the live shop with a test student account
  (quark deduction, ownership persistence, equip/unequip)
- **Real low-stim on a live game page** — the harness simulates the CSS rule in isolation;
  worth confirming on an actual game page with low-stim toggled on for a class
- **Podium overlap with the shop's effect behind-layer** — the Lab Shop effect-depth work
  (Phase 7.28) added behind/front z-index layers around the character; worth a quick look
  that an equipped effect (aura, galaxy, etc.) doesn't visually clash with the pet podium
  when both are showing at once
