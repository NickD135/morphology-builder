# Built-in Item Dimensional Pass (Design Spec)

**Date:** 2026-07-01
**Status:** Approved-by-delegation (user asked to finish Phase 3 autonomously overnight; this is the deferred follow-up of the already-approved character art-port spec `2026-07-01-character-art-port-design.md`).
**Sub-project of:** Phase 3 (art port). Sub-project 1 (character base shading) is DONE. This is sub-project 2.

---

## 1. Background & goal

The base character now has "Option A soft plush" dimensional shading, but the ~40 built-in item overlays (head accessories, face accessories, wings, coat patterns) are still flat, so the figure reads slightly inconsistent (soft body + flat sticker hat). This pass gives the built-in items a matching, restrained dimensional treatment — **the same language as the base**: soft form via gradients, a gentle highlight, occasional contact shadow — without changing any item's silhouette, position, or size.

**Goal:** Restyle the built-in items to read dimensional and consistent with the shaded base, with **zero geometry change** (frozen anchors preserved), no new dependencies, no motion added/removed, and no regression to reactions, coats, or the character.

---

## 2. Non-goals
- **No teacher custom items** — `customImg`/`customSlots` artwork is teacher-drawn and left exactly as-is (align, don't restyle). Only the built-in inline SVG items are touched.
- **No new items**, no renames, no cost changes, no catalogue change (`wordlab-shop-data.js` untouched).
- **No silhouette/position/size change** to any item — same coordinates, same viewBox regions. Depth is added *within* each item's existing shapes.
- **No animation change** — the animated legendary items (flame_crown, ice_crown, galaxy_halo, laser_eyes, etc.) keep their existing `<animate>`/`<animateTransform>`; we only enrich their static fills, never touch timing.
- Not the character (done), not hair, not pets (separate sub-projects).

---

## 3. Architectural decisions

| # | Decision | Reason |
|---|---|---|
| D1 | Edit the inline SVG item strings **in place** in `wordlab-scientist.js` (`headAccSVG`, `faceAccSVG`, `wingsSVG`, and the coat `<pattern>` defs). | That's where the items live; each is a self-contained trusted SVG string. |
| D2 | Depth = **replace flat solid fills with a gradient** and/or **add a thin highlight/shade sub-shape** *inside* the item's existing outline. No shape's `cx/cy/x/y/width/height/points/d` changes. | Frozen-geometry guarantee: overlays stay aligned to the (unchanged) head/coat anchors, teacher customs unaffected. |
| D3 | Gradients are **per-item, uid-suffixed** using the existing per-call `uid` (Task-1 infra of sub-project 1). Any new `<defs>` gradient an item needs is appended to the item string with an id like `hatGrad${uid}` and injected into `allDefs`, OR defined inline within the returned SVG. | Same anti-collision rule as the base; two characters on one page must not share item gradient ids. |
| D4 | **Restraint over realism.** A 2-3 stop linear/radial gradient + one soft highlight per item is the ceiling. Items must still read at 44px and must not fight the base or the face. | These are small accents on a 80×120 figure; over-shading muddies at small sizes (same reason the base uses gradients not filters). |
| D5 | **No SVG filters**, no motion added. Static shading only (low-stim safe). | Consistency with the base + performance across 18+ surfaces. |
| D6 | **Batch by category** (heads, faces, wings, patterns) so each batch is independently reviewable and a bad batch can be redone without touching others. | ~40 items is too much for one reviewable unit; category batches are natural seams. |

---

## 4. The shading recipe (applied per item, restrained)
For each built-in item, apply whichever of these suit its shape — **without moving anything**:
1. **Volume gradient:** replace the item's main flat `fill="#solid"` with a 2-3 stop gradient (lighter toward top-left, base, slightly darker toward bottom-right) using the item's own hue. Keep the exact same silhouette.
2. **Highlight:** add one thin, low-opacity light shape (a small ellipse/line/`rgba(255,255,255,.x)`) on the item's upper-left, inside its outline.
3. **Contact/occlusion:** where an item meets the head/coat (hat brim on the head, goggles strap), a subtle darker sliver (`rgba(0,0,0,.12-.2)`) at the seam.
4. **Metal/gem items** (crown, tiara, monocle, medals): a brighter specular dot + a slightly stronger gradient to read as metal/gem.
5. **Cloth/soft items** (beanie, party hat, wings): a soft matte gradient only, no hard specular.
Animated items: enrich the **static** fills the same way; never touch the animation.

## 5. Constraints (inherited)
- Vanilla JS, no build, no new deps. No DB change (`wordlab-shop-data.js` untouched).
- Frozen anchors — verified by re-rendering every item over the (unchanged) head/coat and confirming alignment (harness screenshots + the sub-project-1 accessory sweep still passes).
- Legible at 44px; static only; per-instance unique gradient ids.
- Reactions, coats (plain/pattern/rainbow/holo), the base shading, and `customImg` overlays all still compose.

## 6. Files touched
| File | Change |
|---|---|
| `wordlab-scientist.js` | In-place dimensional enrichment of `headAccSVG` (18), `faceAccSVG` (~20), `wingsSVG` (4), coat `<pattern>` defs (9). Any new gradient ids uid-suffixed. |
| `tests/manual/item-dimensional-pass-harness.html` | New. Renders every built-in item on the character (large + 44px), asserts each still renders + no item introduced a shared/duplicate gradient id + a couple of animated items still contain their `<animate>`. Screenshots per batch. |

## 7. Verification (synthetic harness, no login)
- Render **every** head/face/wing/pattern item on the shaded character at large + 44px; assert 0 render errors, and that two characters wearing the same item on one page don't share gradient ids (isolation).
- Assert animated items (flame_crown, ice_crown, galaxy_halo, laser_eyes, glowing_mask, antenna) still contain their animation elements (no accidental removal).
- Screenshot each batch for the morning visual-review checklist; confirm silhouettes unchanged vs the pre-pass baseline.
- Merge **local, not pushed**.

## 8. Open items
- Exact per-item gradient stops are an implementation detail tuned during the batch (recipe §4 governs restraint). Logged in the morning checklist for the user's eye.
- If a specific item looks worse shaded (e.g. a tiny face sticker), leaving it flat is acceptable — note it.
