# Lab Shop Reskin — Phase 1 Design

**Date:** 2026-06-29
**Page:** `scientist.html`
**Status:** Approved design, pending spec review → implementation plan

---

## 1. Background & Motivation

A "Lab Shop" redesign was produced in Claude's design feature (a React/`x-dc` artifact
that draws the character with CSS `<div>`s). It is visually excellent: a single-screen,
two-pane "dressing room + shop" with a stats card, category pills, rarity badges,
floating item cards, confirm/insufficient-funds modals, a "Surprise me" randomiser, and
live scientist reactions.

The mockup cannot be embedded as-is: Word Labs is vanilla JS (no build, no React), and its
canonical character is an **SVG** rendered by `WLScientist.buildSVG`, used on every game
page, the dashboard, the leaderboard, and the header pill. Students already own outfits
keyed to SVG accessory IDs.

A catalogue comparison shows the mockup is **~90% a reskin of items that already exist**:

| Category | Mockup | Existing | Verdict |
|---|---|---|---|
| Coat colours | 24 | 24 | ~Identical IDs |
| Patterns | 10 | 10 | **Exact match** |
| Head | 21 | 26 | Existing is a superset |
| Face | 15 | 18 | Existing is a superset |
| Wings | 6 | 5 | Mockup adds 1 |
| Effects | ~26 | 18 | Mockup adds ~7 |
| Hair | 13 | 0 | **Net new** |
| Worlds | 8 animated | reserved field, unused | **Net new** |
| Pets | 25 (emoji) | 9 (SVG, hidden) | Different approach |

Only **hair**, **animated worlds**, and the **pet expansion** are genuinely new. Therefore
the redesign is split into phases, and this spec covers **Phase 1 only**.

## 2. Goal (Phase 1)

Rebuild the look and interaction of `scientist.html` to match the mockup, wired entirely to
the **existing data layer** and the **existing SVG character**. Ship as a single, complete,
low-risk piece.

**Non-goals / explicitly out of scope for Phase 1:**

- Hair (new SVG category) — Phase 3.
- Animated "worlds" background system — Phase 2.
- Pet expansion / un-hiding pets — Phase 3.
- The ~7 new particle effects — Phase 2.
- The mockup's CSS-div character — **rejected permanently** (see §9).
- Any change to `WLScientist`, `wordlab-effects.js`, the database schema, or owned-item data.

## 3. Architectural Decisions

### 3.1 One renderer: keep the SVG character (rejected: CSS character)

The single source of truth for the character remains `WLScientist.buildSVG`. The shop's
left-pane "stage" renders the **real SVG character**, not the mockup's CSS art.

Rationale (upgradability):
- The SVG character is already universal (games, dashboard, leaderboard, header). New
  categories added to it appear everywhere for free.
- Adopting CSS would force either a full-app migration (re-keying every student's owned
  items) or **two renderers** kept in sync forever — the maintenance trap that makes future
  upgrades slower, not faster.
- SVG scales cleanly across the full size range (header pill → big stage) via `viewBox`;
  a CSS character needs hand-managed `transform: scale` at each size.
- SVG is a serialisable string — cheap to inject, cache, and reuse in lists.

The mockup's *visual style* may be ported **into SVG** in Phase 3 (same dimensional coat,
nicer hair shapes), using the mockup's CSS as a visual reference. One renderer, upgraded art.

### 3.2 Single-screen unified layout (rejected: keep tabbed UI)

The existing tabbed structure (My Scientist / Badges / Lab Shop / Dances / Effects / Custom)
is replaced by the mockup's single screen: character + stats always visible on the left, a
category-pill shop on the right. Dances and Badges become category pills (§4.3) so nothing
is lost.

## 4. Components

### 4.1 Top bar
Brand + "MY SCIENTIST" label · live quarks pill · student name · Home link. Reuses the
existing header/nav and the existing header pill data. Quark balance is an `aria-live`
region that "pops" on change.

### 4.2 Left pane — Stage + Stats (~50% width)
- **Stage:** the real `WLScientist.buildSVG(scientist, mood)` output, centred on a glowing
  podium with an idle-bob animation. On equip/buy it reacts: spin + particle burst + speech
  bubble (all suppressed in low-stim — §6).
- **Stats card:** level, title, XP bar with labels, and a 4-stat grid:
  **Correct · Accuracy · Sessions · Badges**, sourced from the existing
  `student_character.stats` (`totalCorrect`, `totalAnswered` → accuracy, `sessions`,
  `badges.length`). Every stat has a text label (never colour-only).

### 4.3 Right pane — Shop (~50% width)
- **Header:** title, "N in {Category}" count, the "Spend quarks…" line, and a
  **🎲 Surprise me** button that randomises equipped items among those already owned
  (mirrors mockup `randomizeOutfit`, owned-only).
- **Category pill rail (Phase 1 set):**
  `Colours · Patterns · Head · Face · Wings · Effects · Dances · Badges · Custom`.
  Pills are real `<button>`s with `aria-current`. *(Hair, Worlds, expanded Pets are absent.)*
  - **Custom** = teacher-made `shop_items` (DB-driven), preserving that feature.
  - **Badges** pill shows a non-purchasable view: earned badges + the existing
    "pin up to 3 to the lab coat" feature.
  - **Dances** pill shows the existing 22 dances grouped by streak tier, purchasable.
- **Item grid:** responsive `grid-template-columns: repeat(auto-fill, minmax(156px, 1fr))`.

### 4.4 Item card
Floating animation; rarity badge (top-left) for rare/epic/legendary; equipped ✓ (top-right);
a **preview**; name; price (⚛ + cost, or FREE); action button (**Get it / Equip / ✓ Equipped**).

**Previews:**
- Colours → colour swatch. Patterns → pattern swatch (reuse existing pattern CSS).
- Head / Face / Wings → **mini real-SVG scientist** showing only that item equipped
  (reuses `WLScientist.buildSVG` with a minimal scientist object → 100% accurate to worn result).
- Effects / Dances → icon + name.

Cards are `<button>`s with descriptive `aria-label` (e.g. "Lab Blue, 50 quarks, owned").

### 4.5 Modals
- **Confirm purchase:** item preview, name, price, "balance after", Cancel / Buy & Equip.
- **Not enough quarks:** friendly message with shortfall, back-to-spelling button.
Both are `role="dialog"`, focus-trapped, Esc-to-close, overlay-click-to-close. The
not-enough message uses `aria-live`.

## 5. Data Flow (all existing functions — no new backend)

- Load: `WordLabData.getScientist()` (+ existing stats/quarks from `getStudentData`).
- Custom items: existing `shop_items` query in `scientist.html`.
- Select item:
  - **Owned** → `saveScientist({ <field>: id })`, update live SVG, trigger reaction.
  - **Not owned, affordable** → confirm modal → `WordLabData.purchase(key, cost)` →
    on success `saveScientist(...)` to add to `owned` + equip → reaction.
  - **Not owned, unaffordable** → not-enough modal.
- Effects equip: existing `applyEffect` / `WLEffects.start`.
- Field mapping is unchanged: `coatColor`, `coatPattern`, `head`, `face`, `wings`, `effect`,
  `dances.<tier>`, `displayBadges`, `customSlots.<type>` (+ `_img_<type>`).

## 6. Low-stim mode

In `body.low-stim`: no particle bursts, no spin, no speech bubble, no floating-card
animations; Effects and Dances pills hidden (existing rule). Every item still equips —
calmly and instantly. `WLEffects` already self-suppresses in low-stim.

## 7. Accessibility (WCAG 2.1 AA)

- Pills and cards are real buttons; full keyboard operability; `focus-visible` (already global).
- `aria-current` on the active pill; descriptive `aria-label`s on cards.
- Modals: focus trap, Esc, restore focus to the triggering card on close.
- `aria-live` on quark balance and the not-enough message.
- No information conveyed by colour alone (rarity also has a text label; equipped also has ✓).
- Respects `prefers-reduced-motion` for the decorative animations (in addition to low-stim).

## 8. Mobile / responsive

Two panes stack vertically under ~760px: character stage on top (reduced height), shop
below. Pills wrap. Grid `minmax` tightens. Touch targets ≥ 44px. Verified at 320–480px.

## 9. Constraints honoured

Vanilla JS, no build step, no new dependencies. Reuses `getScientist`, `saveScientist`,
`purchase`, `WLEffects`, `WLScientist.buildSVG`, and the existing `shop_items` query. No
schema or data migration. Existing owned outfits keep working unchanged.

## 10. Verification

Drive the running app with Playwright as a test student:
1. Load the page; confirm character, stats, and quark balance render from real data.
2. Switch through every category pill; confirm correct grids and counts.
3. Equip a free/owned item; confirm live SVG updates and `saveScientist` persists.
4. Buy a paid item; confirm confirm-modal → quark deduction → equip → persistence.
5. Attempt an unaffordable item; confirm not-enough modal.
6. Run Surprise me; confirm only owned items are chosen.
7. Toggle low-stim; confirm animations/particles/pills suppressed but equipping still works.
8. Check 320px and 760px widths for layout integrity and keyboard/Esc behaviour on modals.

## 11. Future phases (not in this spec)

- **Phase 2 — Animated worlds** behind the character (light up the reserved `background`
  field) + the ~7 new effects.
- **Phase 3 — New content:** SVG hair (one category at a time), pet expansion, and porting
  the mockup's art style into the SVG renderer.

---

## 12. Visual reference — exact values lifted from the mockup

These are copied verbatim from the design-feature mockup (`Lab Shop.dc.html`) so the build
matches it precisely. The implementation should use these literal values, not approximations.
Everything here is plain CSS — the mockup's React/`x-dc`/`DCLogic` framework is NOT used.
The character-building JS (`buildHair`/`buildHead`/`buildFace`/`buildWings`/`buildParticles`/
`buildEffectLayer`/`buildWorldDecor`) is NOT used in Phase 1 (we render the real SVG character;
worlds/effects/hair are Phase 2/3) — keep the original mockup file as the reference for those.

### 12.1 Fonts
- Headings, numbers, buttons: **Fredoka**, weight 600 (already? — add via Google Fonts).
- Body: **Nunito** (400/600/700/800). *(Note: the live app standard is Lexend — confirm in
  §12.7 whether to use the mockup's Fredoka/Nunito or keep Lexend. Default: keep Lexend for
  consistency, treat Fredoka/Nunito as optional.)*

### 12.2 Palette
| Token | Value |
|---|---|
| App / stage background | `#15131f` |
| Top bar | `linear-gradient(180deg,#33324a,#2a2940)`; border-bottom `2px solid rgba(0,0,0,.3)`; shadow `0 4px 18px rgba(0,0,0,.25)` |
| Brand icon tile | `linear-gradient(135deg,#7b6bff,#5a39c7)` |
| Quark pill | bg `rgba(123,107,255,.16)`, border `1.5px solid rgba(150,135,255,.4)`; orb `radial-gradient(circle at 35% 30%,#b9a6ff,#6d4ad6)` |
| Stats card | `linear-gradient(180deg,#faf3da,#f0e4c0)`, border-top `3px solid #e5d49e` |
| Stat tile | bg `#fffdf2`, border `1.5px solid #ecdba6`, radius 13px; label `#8a6a2a` |
| Stat numbers | Correct `#3f8a4a` · Accuracy `#6d4ad6` · Sessions `#2f8fd8` · Badges `#e0a02a` |
| LVL badge | `linear-gradient(135deg,#ffd24a,#e0a02a)` |
| XP bar | track `#e7d7a6`; fill `linear-gradient(90deg,#8a7bff,#6d4ad6)` |
| Shop panel | `linear-gradient(180deg,#faf3da,#f3e9c8)`, border-left `3px solid #e5d49e`, shadow `-10px 0 30px rgba(0,0,0,.2)` |
| Shop title / subtext | title `#4a3416`; subtext `#9a7a3a`; meta `#8a6a2a` |
| Surprise-me button | `linear-gradient(135deg,#ffb43c,#f5841f)`, border `2px solid #e0741a`, shadow `0 4px 10px rgba(245,132,31,.4)` |
| Pill (active) | `linear-gradient(135deg,#7b6bff,#5a39c7)`, border `2px solid #5a39c7`, shadow `0 4px 12px rgba(90,57,199,.35)`, text `#fff` |
| Pill (inactive) | bg `#fffdf2`, border `2px solid #e5d49e`, text `#7a5a1e` |
| Item card | bg `linear-gradient(180deg,#fdf7e0,#f6edcf)`, border `2px solid #ecdba6`, radius 18px, shadow `0 6px 14px rgba(120,80,20,.12)` |
| Item card (equipped) | border `2px solid #b9a6ff`, bg `linear-gradient(180deg,#fff8e6,#f3ead0)`, shadow `0 8px 18px rgba(90,57,199,.18)` |
| Item card (legendary) | border `2px solid #e0a02a`, shadow `0 8px 20px rgba(224,160,42,.28), inset 0 0 16px rgba(255,210,90,.2)` |
| Item card (epic) | border `2px solid #cf9ae8`, shadow `0 8px 18px rgba(177,79,216,.2)` |
| Rarity badge colours | legendary `#e0a02a` · epic `#b14fd8` · rare `#2f8fd8` · common `#8a8aa0` |
| Card button | bg `#fff`, color `#5a39c7`, border `2px solid #b9a6ff`, shadow `0 3px 0 #d9ccff` |
| Card button (equipped) | bg `#e7e0fb`, color `#5a39c7`, border `2px solid #cabdf5` |
| Price / FREE text | price `#6e4f1e`; FREE `#3f8a4a` |
| Modal card | `linear-gradient(180deg,#fffdf4,#f7eecf)`, border `3px solid #e5d49e`, radius 24px |
| Modal "Buy & Equip" | `linear-gradient(135deg,#7b6bff,#5a39c7)`, shadow `0 5px 0 #4226a8` |
| Not-enough modal | border `3px solid #f0b8a0`, title `#c0392b` |
| Equipped ✓ chip | `linear-gradient(135deg,#7b6bff,#5a39c7)`, white ✓, shadow `0 3px 8px rgba(90,57,199,.5)` |
| Podium glow (lab) | `rgba(240,200,90,.7)` |

### 12.3 Layout metrics
- Top bar: `height 58px` fixed; padding `0 20px`; gap 14px.
- Main: `display:flex`. Left pane `flex:1 1 50%; min-width:380px`. Shop pane `flex:1 1 50%; min-width:420px`.
- Stage: `flex:1; perspective:1300px`; floor plane `transform:rotateX(73deg)` with mask fade.
- Character wrap: `transform:scale(0.96); transform-origin:center bottom`.
- Stats card: padding `13px 16px 15px`; stat grid `repeat(4,1fr); gap 8px`; LVL badge 42px radius 13px.
- Shop header: padding `16px 24px 11px`; title 25px Fredoka.
- Pill rail: padding `13px 22px 8px`; `flex-wrap:wrap; gap 8px`; pill padding `8px 14px`, radius 999px, font 13.5px.
- Item grid: `repeat(auto-fill, minmax(156px, 1fr)); gap 14px`; container padding `8px 22px 26px`; `perspective:1100px`.
- Item card: padding `12px 12px 14px`; preview row height 70px; button padding `8px 0`, radius 11px.
- Modal: width 340px; padding `26px 24px 22px`; overlay `rgba(20,16,34,.55)` + `backdrop-filter:blur(3px)`.

### 12.4 Keyframes used in Phase 1 (copy verbatim)
```css
@keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
@keyframes idleBob   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes ringPulse { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.55} 50%{transform:translate(-50%,-50%) scale(1.12);opacity:.9} }
@keyframes speechPop { 0%{transform:translate(-50%,8px) scale(.6);opacity:0} 60%{transform:translate(-50%,-4px) scale(1.06);opacity:1} 100%{transform:translate(-50%,0) scale(1);opacity:1} }
@keyframes modalPop  { 0%{transform:scale(.82) translateY(14px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
@keyframes overlayFade { from{opacity:0} to{opacity:1} }
```
*(Card float duration in mockup: `floatY (3 + (id.length % 4) * 0.4)s` with `(id.length % 5) * 0.2s` delay — keeps cards out of sync. Honour `prefers-reduced-motion` and low-stim by disabling these.)*

### 12.5 Reaction behaviour (from mockup JS — reimplement in vanilla)
- **triggerReaction()** on equip/buy: set happy mood + a random speech phrase; run `spin()` + `burst()`; clear happy after 1000ms, clear speech after 2000ms.
- **spin():** `element.animate(...)` — 40% chance a translate-Y + rotateY(360deg) over 820ms `cubic-bezier(.34,1.56,.64,1)`; otherwise a double-hop over 660ms.
- **burst():** spawn 18 spans; glyphs `['✦','✧','★','✦','●']`; colours `['#f7d24a','#ff8fc4','#7df0ff','#b18bff','#7ed321','#ff9a4a']`; each flies out at a random angle, distance 50–145px, scaling 0.2→1.15 over 700–1050ms, then removed.
- **popQuark():** scale 1 → 1.16 → 1 over 420ms on successful buy.
- **shakeBalance():** translateX 0/-6/6/0 over 300ms on insufficient funds.
- **Speech phrases:** `['Looking sharp! ✨','Ooh, love it! 💜','Lab-tastic! 🧪','So cool! 😎','New look unlocked!','Spelling AND style!','Wowza! 🌟','Fresh fit! ⚡','Science of style!','Quark well spent!']`.
- **Surprise me:** randomise the equipped item in each category **from owned items only**; speech `'Surprise! 🎲'`; spin + burst.
- **All of the above is suppressed in low-stim and under `prefers-reduced-motion`** — equip happens instantly with no spin/burst/speech.

### 12.6 Pattern swatch CSS (matches existing — verify against `wordlab-scientist.js`)
The mockup's `PATTERN_CSS` (stripes/molecules/stars/dots/chevrons/hearts/lightning/dna/plaid)
must visually match the patterns the real SVG coat uses. Implementation should reuse the
existing pattern definitions where they already exist rather than the mockup's, to keep the
swatch preview consistent with the worn result.

### 12.7 Typography decision (resolved)
**Keep Lexend** as the body/UI font for site-wide consistency. Use **Fredoka** (weight 600)
only as an accent on the large stat numbers, the LVL value, the shop title, and item prices —
i.e. where the mockup uses Fredoka for "chunky" display numerals. Do **not** introduce Nunito.
Fredoka is loaded via Google Fonts alongside the existing Lexend link.

### 12.8 Mockup reference file
The original design-feature artifact is preserved in-repo at
`docs/superpowers/specs/2026-06-29-lab-shop-mockup.html` as the ground-truth visual reference
(especially for the Phase 2/3 `buildWorldDecor` / `buildEffectLayer` / `buildHair` functions).
It is a reference only — it is never served or linked from the app.
