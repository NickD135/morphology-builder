# Shared CSS Extraction — `wordlab-common.css`

**Date:** 2026-04-02
**Status:** Approved

## Goal

Extract ~400 lines of CSS duplicated across 40+ HTML pages into a single `wordlab-common.css` file. Reduces maintenance burden and ensures visual consistency.

## What goes in the shared file

1. **Reset** — `* { box-sizing: border-box; }`, `button/input/select { font: inherit; }`
2. **CSS custom properties** — `:root` with all brand colours (indigo, teal, green, orange, etc.)
3. **Body base** — Lexend font family, line-height (pages override background/color as needed)
4. **Skip-to-content link** — `.skip-link` accessibility styles
5. **`.hidden` utility** — `display: none !important`
6. **Dark sticky header** — `.header`, `.headerInner`, `.brand`, `.brandIcon`, `.brandName`, `.topBtn` (glassmorphism blur 14px, sticky positioning)
7. **Game fixed header variant** — `.header--fixed` modifier for game pages (fixed position, 56px height)
8. **Dark footer** — `.footer`, `.footer-inner`, `.footer-brand`, `.footer-note`
9. **Light footer variant** — `.footer--light` for simple info pages
10. **Primary button** — `.btn-primary` base pattern
11. **Modal overlay** — `.overlay` base pattern

## What stays in each page

- Game-specific layouts, tiles, grids, fuel bars
- Page-specific components and responsive breakpoints
- Body background/color (varies between dark and light pages)
- Page-specific button variants

## Wiring

- Add `<link rel="stylesheet" href="wordlab-common.css">` before each page's `<style>` block
- Keep Google Fonts `<link>` in HTML (faster than CSS @import)
- Remove duplicated rules from each page's `<style>` block
- Pages override shared styles via their own `<style>` block (specificity: later wins)

## Scope

- ~47 HTML files updated
- No JS changes
- No HTML structure changes
- No visual changes (pixel-identical output)
