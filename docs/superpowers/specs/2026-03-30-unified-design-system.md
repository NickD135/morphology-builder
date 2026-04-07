# Unified Design System — Word Labs

**Date:** 2026-03-30
**Goal:** Standardise all UI chrome (headers, panels, buttons, pills, spacing, typography) across every page so the site feels like one app, while preserving per-game themed backdrops and accent colours.

**Constraint:** Accessibility must be maintained — skip links, ARIA labels, colour contrast, keyboard navigation, support mode, low-stim mode all remain untouched.

---

## 1. Design Tokens

### 1.1 Header Bar

Every page uses the same header structure. Two colour variants: **dark** (over themed scene backdrops) and **light** (class-setup, scientist, spelling-test).

| Property | Dark variant | Light variant |
|---|---|---|
| padding | `10px 20px` | `10px 20px` |
| background | `rgba(var(--header-rgb), 0.85)` + `backdrop-filter: blur(12px)` | `rgba(255,255,255,0.93)` + `backdrop-filter: blur(12px)` |
| border-bottom | `1px solid rgba(255,255,255,0.1)` | `1px solid #e2e8f0` |
| box-shadow | none | `0 1px 2px rgba(15,23,42,0.05)` |
| position | `sticky; top:0; z-index:20` | same |

`--header-rgb` is set per page to tint the header to match the scene (e.g. `10,5,25` for phoneme's purple scene, `18,8,2` for meaning's library).

### 1.2 Brand Mark

| Property | Value |
|---|---|
| Icon size | `36×36px` |
| Icon border-radius | `10px` |
| Icon background | `var(--accent)` (per-game accent colour) |
| Icon font-size | `16px` |
| Icon box-shadow | `0 8px 16px rgba(0,0,0,0.15)` |
| h1 font-size | `15px` |
| h1 font-weight | `900` |
| h1 letter-spacing | `-.02em` |
| h1 colour (dark) | `#fff` |
| h1 colour (light) | `#312e81` |
| .sub font-size | `10px` |
| .sub letter-spacing | `.25em` |
| .sub font-weight | `900` |
| .sub colour (dark) | `rgba(255,255,255,0.7)` |
| .sub colour (light) | `var(--accent)` |

### 1.3 Panels

| Property | Value |
|---|---|
| border | `2px solid rgba(var(--accent-rgb), 0.25)` |
| border-radius | `20px` |
| box-shadow (on dark scenes) | `0 16px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.6)` |
| box-shadow (on light bg) | `0 12px 24px rgba(15,23,42,0.06)` |
| panelInner padding | `28px` |

### 1.4 Pills

| Property | Value |
|---|---|
| min-height | `32px` |
| padding | `6px 14px` |
| border-radius | `999px` |
| font-size | `12px` |
| font-weight | `800` |
| .score background | `var(--accent)` |
| .streak background | `var(--orange-soft)` |

### 1.5 Buttons

| Property | topBtn | primaryBtn | secondaryBtn |
|---|---|---|---|
| padding | `7px 13px` | `14px 28px` | `12px 20px` |
| border-radius | `10px` | `16px` | `16px` |
| font-size | `11px` | `13px` | `13px` |
| letter-spacing | `.12em` | `.08em` | `.08em` |
| font-weight | `800` | `900` | `800` |
| text-transform | `uppercase` | `uppercase` | `uppercase` |

### 1.6 panelTitle (section labels)

| Property | Value |
|---|---|
| font-size | `11px` |
| font-weight | `900` |
| text-transform | `uppercase` |
| letter-spacing | `.22em` |
| color | `var(--accent)` |

### 1.7 Spacing Scale

Only these values used for margins, padding, and gaps:
`4, 8, 12, 16, 20, 24, 28, 32, 48px`

### 1.8 Border-Radius Scale

| Use | Value |
|---|---|
| Small elements (buttons, icons, inputs) | `10px` |
| Medium elements (input cards, small containers) | `16px` |
| Large elements (panels, modals) | `20px` |
| Circular (pills, avatars) | `999px` |

---

## 2. Per-Game Accent Colours

Each game sets `--accent`, `--accent-rgb`, and `--header-rgb` as CSS custom properties. Everything else is standardised.

| Page | --accent | --accent-rgb | --header-rgb | Scene type |
|---|---|---|---|---|
| phoneme-mode | `#7c3aed` | `124,58,237` | `10,5,25` | Dark (studio) |
| syllable-mode | `#92400e` | `146,64,14` | `18,10,2` | Dark (workshop) |
| sound-sorter | `#0c4a6e` | `12,74,110` | `5,8,22` | Dark (scene) |
| mission-mode | `#16a34a` | `22,163,74` | `2,20,12` | Dark (lab) |
| breakdown-mode | `#dc2626` | `220,38,38` | `0,0,0` | Dark (explosion lab) |
| meaning-mode | `#6b3d10` | `107,61,16` | `18,8,2` | Dark (library) |
| speed-mode | `#1e3a5f` | `30,58,95` | `4,8,20` | Dark (rocket room) |
| flashcard-mode | `#78350f` | `120,53,15` | `20,10,3` | Dark (scene) |
| root-lab | `#b45309` | `180,83,9` | `20,10,3` | Dark (scene) |
| homophone-mode | `#9d174d` | `157,23,77` | `15,5,15` | Dark (scene) |
| word-refinery | `#92400e` | `146,64,14` | `13,7,0` | Dark (scene) |
| word-spectrum | `#0e7490` | `14,116,144` | `6,13,24` | Dark (scene) |
| scientist | `#4338ca` | `67,56,202` | N/A | Light |
| class-setup | `#4338ca` | `67,56,202` | N/A | Light |
| dashboard | `#4338ca` | `67,56,202` | N/A | Dark (navy) |
| spelling-test | `#4338ca` | `67,56,202` | N/A | Light |
| teacher-login | `#4338ca` | `67,56,202` | `13,11,26` | Dark (gradient) |
| landing | `#4338ca` | `67,56,202` | N/A | Dark (gradient) |

---

## 3. What the Accent Colour Controls

These are the ONLY properties that change per game:

- `.brandIcon` background
- `.pill.score` background
- `.panelTitle` color
- `.panel` border tint (via `rgba(var(--accent-rgb), 0.25)`)
- `.startBtn` / `.primaryBtn` background
- `.diffBtn.active` border + background tint
- Active/selected states on game-specific interactive elements

These NEVER change per game:
- Header layout, padding, structure
- Brand h1/sub size and weight
- Panel border-radius, shadow, padding
- Button shapes and sizes
- Pill shapes and sizes
- Spacing values

---

## 4. Pages Requiring Changes

### Heavy changes (structure differs significantly)
| Page | Changes needed |
|---|---|
| class-setup | Brand icon 50→36, h1 26→15, panel border 4px→2px, radius 28→20, topBtn padding 12px 16px→7px 13px |
| scientist | Brand icon 44→36, h1 20→15, radius 24→20, topBtn 10px 14px→7px 13px |
| dashboard | Brand icon 32→36, panel radius 16→20, border 1px→2px, topBtn font 9px→11px |
| spelling-test | Brand icon 40→36, standardise header padding |

### Light changes (mostly correct, just lock exact values)
| Page | Changes needed |
|---|---|
| phoneme-mode | Already close — verify pill padding 8px 16px→6px 14px, min-height 32px |
| syllable-mode | Same as phoneme — minor pill/padding tweaks |
| breakdown-mode | Same — minor pill tweaks |
| meaning-mode | Same |
| sound-sorter | Same |
| speed-mode | Pill padding 8px 14px→6px 14px |
| flashcard-mode | Verify all values match |
| mission-mode | Verify header padding, add brand if missing |
| root-lab | Verify header structure matches standard |
| homophone-mode | Verify header structure matches standard |
| word-refinery | Panel border 1px→2px, verify pills |
| word-spectrum | Panel border 1px→2px, verify pills |
| teacher-login | Brand h1 18→15, icon to 36px |
| landing | Minimal — verify header matches standard where applicable |

---

## 5. Implementation Approach

Work through pages in batches. For each page:
1. Set the three CSS custom properties (`--accent`, `--accent-rgb`, `--header-rgb`)
2. Update header CSS to match standard
3. Update brand mark CSS to match standard
4. Update panel CSS to match standard
5. Update pill/button CSS to match standard
6. Verify no visual regressions on the themed backdrop

No shared CSS file is created (project uses inline styles per page). The standard is enforced by using identical values across all pages.

Order of work:
- **Batch 1:** Game pages with dark scenes (phoneme, syllable, sound-sorter, breakdown, meaning, speed, flashcard, mission, root-lab, homophone, word-refinery, word-spectrum) — these are mostly close already
- **Batch 2:** Teacher/admin pages (class-setup, scientist, dashboard, spelling-test, teacher-login) — these need more structural changes
- **Batch 3:** Landing page — verify and align
