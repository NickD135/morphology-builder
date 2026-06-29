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
