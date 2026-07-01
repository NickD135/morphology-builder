# SVG Hair System — Morning Checklist

For Nicholas. Read this before the eventual logged-in visual spot-check / push.
Everything below was verified with the automated harness
(`tests/manual/svg-hair-harness.html` → `window.__HAIR__`, `__HAIRSHOP__`,
`__HAIRSWEEP__`), not a human eyeball on the live shop yet.

## What shipped

- **12 hairstyles** (all FREE): None, Short, Tousled, Side Part, Bob, Curly,
  Afro, Spiky, Mohawk, Ponytail, Bun, Long.
- **13 hair colours** (all FREE): Black, Dark Brown, Brown, Chestnut, Auburn,
  Ginger, Blonde, Platinum, Grey, Blue, Pink, Violet, Mint.
- Two new shop pills on the Lab Shop: **Hair** and **Hair Colour**.
- Rendering lives in `wordlab-scientist.js` (`buildSVG`) — one renderer, so
  hair shows up everywhere the scientist is drawn (shop, header widget,
  landing page, dashboards, game pages, loading screen).

## Flagged decisions (confirm these match your intent)

- **Style and colour are both free.** No quark cost, no badge gate. Every
  student can pick any hairstyle/colour combination from day one.
- **Hair is included in "Surprise me."** The randomiser
  (`WL.surprise` in `scientist.html`) now rolls a random hairstyle *and* a
  random hair colour alongside coat colour/pattern/head/face/wings.
- **Long, Ponytail, and Bun render a "behind-head" sub-layer.** These three
  styles draw part of the hair (the tail/bun mass) *behind* the head/ears,
  and the rest in front, so they read as one continuous shape instead of a
  flat sticker. The other 9 styles (Short, Tousled, Side Part, Bob, Curly,
  Afro, Spiky, Mohawk) are front-only.
- **`none` / unset hair = bare head**, unchanged from before hair shipped.
  No behaviour change for any student who doesn't touch the new category.

## Layering sweep — what was tested

Automated sweep (`window.__HAIRSWEEP__`, 30 cells, 0 errors) rendered 5
styles that exercise every draw path — **Short** (front cap only),
**Long** and **Ponytail** (front + behind-head layer), **Afro** (large
front-only cap), **Mohawk** (thin/spiky, worst case for coverage) — each
combined with:

- **Beanie** (`head`) — a full-cover hat. Expect it to sit *over* the hair
  and mostly hide it.
- **Tiara** (`head`) — a low crown that sits *in front of* the hair on the
  forehead, without needing to cover the rest of the head.
- **Angel Wings** (`wings`) — a behind-body accessory. Expect hair-behind
  (Long/Ponytail) to stay layered cleanly in front of the wings, no
  clipping or shared-gradient bleed.

Every combination was rendered at both **neutral** and **excited**
reactions, and at both **150px** (shop-size) and **44px** (header-widget
size). The harness asserts, per cell:

1. No exception thrown, valid `<svg>` returned.
2. Eyes and mouth are still present in the output (face renders after hair
   — hair never occludes the face nodes).
3. Hats (`beanie`/`tiara`) render *after* the hair-front layer in the SVG
   source (hats over hair, not hidden under it).
4. Wings render *before* the hair-behind layer (wings stay behind the body,
   hair-behind stays layered correctly in front of them).

**Result: 30/30 cells passed, 0 errors.** Screenshots (gitignored, not in
git — regenerate locally with the harness if you want to see them again):
`tests/manual/.screenshots/task3-sweep-150.png` (large grid),
`tests/manual/.screenshots/task3-sweep-44.png` (44px row),
`tests/manual/.screenshots/task3-390px.png` (mobile-width, no
overflow/clipping), `tests/manual/.screenshots/task3-style-grid.png`
(full harness page).

## Honest read on the silhouettes

The 12 hairstyles are **conservative/schematic silhouettes**, not detailed
illustrations — consistent with the rest of the flat-shaded scientist art
style. A few things worth knowing before you show this to teachers:

- **Mohawk** is genuinely thin at 44px — the 3 spikes read as a faint dark
  ridge rather than a clearly "mohawk" shape at header-widget size. It's
  still legible with lighter hair colours (Platinum, Blonde) and fully
  clear at 150px.
- **Curly** and **Spiky** are built from repeated small shapes (circles /
  triangles) rather than a single silhouette — they read fine at 150px but
  soften into a slightly fuzzy blob at 44px, same as Mohawk.
- **Tiara + Mohawk**: the tiara sits low on the forehead by design, so the
  mohawk spikes poke up above it — this is intentional (tiara is a "low
  crown," not a full-cover hat) but worth a glance so it doesn't read as a
  bug.
- **Beanie** fully hides most styles as intended, including Afro and
  Mohawk — confirmed in the screenshots.
- No style put hair over the eyes/mouth in any of the 30 sweep cells, and
  no hat rendered underneath hair in any cell.

## Still pending

- **A real logged-in visual spot-check on the live shop** has not been
  done. The harness renders the same `WLScientist.buildSVG` function the
  live site uses, so behaviour should match — but it can't fully verify
  aesthetics, occlusion "feel," or how hair looks next to a real coat
  pattern/skin tone/effect a student has actually equipped. Worth a couple
  of minutes clicking through the Hair and Hair Colour pills on
  `scientist.html` before this goes out to real classes.
- Same caveat as the item-dimensional-pass checklist: teacher-made custom
  coats (via `item-creator.html`) haven't been checked with hair layered
  on top — low risk (hair renders on the head, coats are on the body) but
  untested combination.
