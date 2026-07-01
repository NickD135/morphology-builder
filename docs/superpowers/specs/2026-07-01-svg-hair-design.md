# SVG Hair (Design Spec)

**Date:** 2026-07-01
**Status:** Approved-by-delegation (user asked to finish Phase 3 autonomously overnight). Aesthetic/product choices below are conservative defaults, each flagged in the morning checklist for the owner's review.
**Sub-project of:** Phase 3 (art port). Sub-project 3 (character base shading) done; sub-project 2 (item dimensional pass) done. This is sub-project 3.

---

## 1. Background & goal

The scientist currently has a **bare head** (no hair). This adds a **Hair** cosmetic system: a set of hairstyles + a hair-colour palette, rendered as SVG on the head, consistent with the soft-plush dimensional language, without disturbing the frozen anchor geometry that all item overlays depend on.

**Goal:** Let students choose a hairstyle and hair colour; render it correctly layered (over the shaded scalp, under hats), shaded in the same soft language, at all sizes, with no regression to accessories, reactions, or the base.

---

## 2. Non-goals
- No re-proportioning; no viewBox/anchor change (head stays `cx40 cy38 r22`).
- No change to existing head/face/wings accessories or their coordinates.
- No DB migration — `hair` + `hairColor` are new keys on the existing `scientist` jsonb (the generic `save_scientist_field` RPC already accepts arbitrary keys, same as `world` did — no schema change).
- Not pets (separate sub-project 4).
- No per-hairstyle physics/animation — static SVG (low-stim safe).

---

## 3. Architectural decisions

| # | Decision | Reason |
|---|---|---|
| D1 | Two new `scientist` fields: **`hair`** (style id, e.g. `'short'`) and **`hairColor`** (hex). Both optional; default `hair=null` (bald, current look) and `hairColor='#3B2A1E'`. | Style + colour are independent axes; keeps existing characters unchanged (null hair = today's bare head). |
| D2 | Hairstyles are **hand-authored inline SVG** in a new `hairSVG` map in `buildSVG`, each shaped to the head ellipse, using `hairColor` (+ a derived shade/highlight via the existing `_mix`). | Same self-contained, no-asset pattern as accessories; shading matches the base. |
| D3 | **Draw order:** head fill → head shade/highlight overlays → **hair** → face → head accessory. | Hair sits on the scalp/frames the face (over the shaded head), the face reads on top (hair is top/sides, never over eyes/mouth), and hats/head accessories render **over** hair (a beanie covers hair, a tiara sits in front). |
| D4 | Two new shop categories: **`hair`** (style, mini-SVG preview like heads) and **`hairColor`** (swatch palette, like skin/colours). | Mirrors existing category machinery exactly (heads render pattern, skin/colours render swatch). |
| D5 | **Hairstyles are free**, **hair colours are free** (appearance/identity, low friction — same rationale as skin tones). | Kind default; flagged for owner to add costs later if desired. |
| D6 | Hair gradients/ids are **per-instance uid-suffixed** (reuse the `uid` in `buildSVG`). | Same anti-collision rule as the base + items; multiple characters per page. |
| D7 | Frozen anchors: hair shapes are authored relative to the (unchanged) head ellipse. Hats already sit at the same head coords, so **hair must not extend above/around where common hats sit** in a way that clips oddly — keep hair within a sensible scalp envelope; accept that full-cover hats (beanie, space_helmet) hide most hair (correct real-world behaviour). | Compatibility + natural layering. |

---

## 4. Content (v1 — conservative, flagged for review)
**Hairstyles (`hairSVG`), ~9** incl. a free `none`:
`none` (bald — default), `short`, `tousled`, `side_part`, `ponytail`, `bun`, `curly`, `long`, `spiky`, `afro`, `bob`, `mohawk`. (Author ~10-11; final list in the plan.) Each is a scalp cap + style-specific silhouette (fringe, sides, length) shaped to the top/sides of the head ellipse, never covering eyes (`cy≥30` region only at the hairline).

**Hair colours (`hairColor` swatch palette), ~12:** Black `#1A1A1A`, Dark Brown `#3B2A1E`, Brown `#6F4E37`, Chestnut `#8D5A3C`, Auburn `#8C3B2B`, Ginger `#C1502E`, Blonde `#D9B36A`, Platinum `#E8DCC0`, Grey `#9A9A9A`, plus fun: Blue `#3B82F6`, Pink `#F472B6`, Violet `#A855F7`, Mint `#5FC9A6`. All free.

## 5. Rendering (per hairstyle)
- Base hair shape filled with `hairColor`; a `_mix(hairColor,'#000',0.28)` under-shade at the nape/inner and a `_mix(hairColor,'#fff',0.30)` sheen on the top — via a uid-suffixed gradient `hairG${uid}`.
- Positioned relative to head (`cx40 cy38 r22`): hairline around `cy 18-30`, sides down to ~`cy 40`, longer styles (`long`, `ponytail`) extend to ~`cy 60-70` beside the neck/coat but **behind** the head sides. Long/back hair renders as a sub-shape **behind the head** (before the head fill) so it frames without covering the face.
- 44px legibility: silhouettes must read small (bold shapes, not fine strands).

## 6. Constraints (inherited)
- Vanilla JS, no build, no new deps, no DB migration. Frozen anchors. Per-instance uid ids. No filters, no motion (static). Legible at 44px. Reactions/accessories/coats/base all still compose. Low-stim safe.
- `WL.surprise` (surprise-me): **include hairstyle**, but **exclude hairColor** from randomisation is optional — decide in plan; leaning include both style+colour (hair is a fun cosmetic, unlike skin identity). Flag for review.

## 7. Files touched
| File | Change |
|---|---|
| `wordlab-scientist.js` | `buildSVG`: `hairSVG` map (~11 styles) rendered in the draw order (D3), incl. an optional behind-head layer for long styles; `hairColor` + `_mix` shading; uid-suffixed hair gradient. Default `hairColor` fallback. |
| `wordlab-shop-data.js` | `hairStyles` (list, for the Hair category, with icons) + `hairColors` (swatch palette). |
| `scientist.html` | Two new `WL.CATS` entries (`hair` style — mini-SVG preview like heads; `hairColor` — swatch like skin); swatch/preview wiring reuse; default `hairColor` at load so current shows equipped; optionally add hair to `WL.surprise`. |
| `tests/manual/svg-hair-harness.html` | New. Renders every style × sample colours on the character (large + 44px), incl. with hats over hair (beanie/tiara), reactions, and the two-instance isolation check. |

## 8. Verification (synthetic harness, no login)
- Render each hairstyle × 3 hair colours (natural + fun) at large + 44px; 0 render errors.
- Layering: render `short`/`long` WITH `beanie` (should cover) and WITH `tiara` (should sit in front of hair); confirm hats render over hair, face over hair, eyes never covered.
- Isolation: two characters with different hairstyles+colours on one page share no hair gradient id.
- Reactions still render; accessories still align; base unchanged.
- Screenshots for the morning checklist. Merge **local, not pushed**.

## 9. Open items (flagged for owner morning review)
- The exact hairstyle set + silhouettes (my conservative authored defaults).
- Free vs paid for styles/colours (defaulted free).
- Whether hair joins Surprise-me (defaulted: yes for both style+colour).
- Long-hair-behind-head layering vs any wings interaction (wings also render behind body — confirm no clash; hair-behind sits between wings and head).
