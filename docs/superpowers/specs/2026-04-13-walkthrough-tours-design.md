# Walkthrough Tours — Design Spec

**Date:** 2026-04-13
**Goal:** Guided spotlight walkthrough for teachers (dashboard) and students (landing page) on first visit, with replay button.

---

## Architecture

### Shared module: `wordlab-tour.js`

Single file handles: overlay, spotlight cutout, tooltip card, step sequencing, scroll-into-view, localStorage tracking.

**Spotlight technique:** Full-page overlay with `box-shadow: 0 0 0 9999px rgba(0,0,0,0.75)` on a positioned element that matches the target's bounding rect. This creates the "everything dark except this element" effect without clip-path complexity.

**Tooltip card:** Positioned relative to the spotlight. Contains: step title, description text, step counter pill ("3 of 12"), Back/Next buttons, Skip link. Smooth transition between steps.

**Positioning:** Tooltip appears below, above, left, or right of the target based on available space. Auto-detects best position if not specified. Target scrolls into view with `scrollIntoView({ behavior: 'smooth', block: 'center' })`.

**Triggers:**
- Auto-start on first visit: `localStorage.getItem('wl_tour_seen_[page]')` — if not set, starts after 1.5s
- Replay: callable via `WLTour.start(steps)` from a button
- Skip at any point: sets localStorage key so it won't auto-trigger again
- Low-stim: if `body.low-stim` is active, filter out steps tagged `lowStimHide: true`

**Step schema:**
```js
{
  target: '#selector',      // CSS selector for highlighted element
  title: 'Step title',      // Bold heading
  text: 'Description...',   // 1-3 sentences
  position: 'bottom',       // bottom | top | left | right | auto
  lowStimHide: false         // skip this step in low-stim mode
}
```

---

## Teacher Tour (dashboard.html) — 15 steps

### Welcome & layout
1. **Welcome** (no target — centred card)
   "Welcome to your Word Labs dashboard! This quick tour will show you how everything works. You can replay it anytime."

2. **Class selector** → topbar class name
   "Your classes appear here. Click to switch between them. Each class has its own data, settings, and spelling sets."

3. **Stats bar** → horizontal stats strip
   "A snapshot of your class: overall accuracy, most-played game, most-missed morpheme, and how many students were active today."

### Settings & controls
4. **Settings strip** → settings row
   "Control your class here. Set a Focus Game for 2x rewards, toggle Low-stim mode for sensory-sensitive students, and switch between base and extension content."

5. **Levels button** → stage management button
   "Assign curriculum levels to students. Words, morphemes, and sounds in every game are matched to the student's level — content grows with them as they progress through year groups."

### Understanding the data
6. **Game tabs** → tab bar
   "Each tab shows progress for one game. Word Labs covers morphology (word parts), phonics (sounds and spelling), and vocabulary (word meaning and register)."

7. **Heatmap** → first visible heatmap table
   "Green cells = strong (80%+). Amber = developing. Red = needs support. Dash = not attempted yet. Click any column header to drill down into specific words or morphemes."

8. **Student row** → first student name cell
   "Click a student's name to see their full profile: scores across all games, level, XP, badges, and check-in history."

9. **EXT/SUP badges** → first EXT or SUP badge
   "Toggle Extension mode (harder content) or Support mode (scaffolding and slower timers) per student. You can also set these per-activity."

### Game types explained
10. **Game types — Morphology** (no target — centred card)
    "**Morphology games** teach word structure: Breakdown Blitz (decompose words into prefix + base + suffix), Mission Mode (match morphemes to words), Meaning Match-Up (match morphemes to their meanings), Root Lab (explore etymology), and Morpheme Builder (free exploration)."

11. **Game types — Phonics** (no target — centred card)
    "**Phonics games** teach sounds and spelling patterns: Phoneme Splitter (split words into individual sounds), Syllable Splitter (chop into syllables), and Sound Sorter (identify the correct grapheme for a sound)."

12. **Game types — Vocabulary** (no target — centred card)
    "**Vocabulary games** build word knowledge: Word Spectrum (synonyms, antonyms, shades of meaning), The Refinery (arrange words from everyday to specialist), Homophone Hunter (pick the right spelling in context), and Flashcards (quick morpheme review)."

### Spelling & word lists
13. **Spelling sets** → spelling sets tab/area
    "Create spelling check-in sets, run dictation assessments, and track which words each student gets right or wrong. Focus words from check-ins automatically feed into practice games."

14. **Word lists** → word lists button
    "Add custom word lists that feed into 6 practice games. AI analyses your words to generate morpheme breakdowns, syllable splits, and phoneme data automatically."

### Wrap-up
15. **Replay reminder** → tour replay button (once placed)
    "That's the tour! You can replay it anytime by clicking this button. If you need help, check the Teacher Guide in the menu."

---

## Student Tour (landing.html) — 12 steps

### Welcome
1. **Welcome** (no target — centred card)
   "Welcome to Word Labs! You're a scientist who studies words. Let's show you around your lab."

2. **Your scientist** → scientist display area
   "This is your scientist! As you play games and earn XP, you'll level up and unlock new ranks — from Quark Cadet all the way to Lab Director."

3. **Quarks** → quarks stat pill
   "Quarks are your lab currency. Earn them by playing games. Spend them in the Scientist Shop on lab coats, accessories, and dance moves."
   `lowStimHide: true`

4. **XP and level** → level/XP area
   "Every correct answer earns XP. Fill the bar to level up. Harder questions are worth more."

### Daily engagement
5. **Daily challenges** → challenges area
   "Three new challenges every day — easy, medium, and hard — plus a weekly challenge. Complete them for bonus quarks."
   `lowStimHide: true`

6. **Streak** → streak flame
   "Play for 10+ minutes each day to build your streak. The flame grows bigger the longer you keep it going!"
   `lowStimHide: true`

### Games explained
7. **Game cards overview** → game grid area
   "These are your games. Each one practises different word skills. Try them all — you get bonus rewards for playing a variety!"

8. **Game types — word building** (no target — centred card)
   "Some games focus on **word parts**: breaking words into prefixes, bases, and suffixes, matching morphemes to meanings, and building words from scratch. These help you understand how words are constructed."

9. **Game types — sounds & spelling** (no target — centred card)
   "Other games focus on **sounds**: splitting words into phonemes, chopping syllables, sorting graphemes, and hunting homophones. These help you become a stronger speller."

10. **Game types — vocabulary** (no target — centred card)
    "And some games build your **word power**: arranging synonyms from everyday to specialist, exploring shades of meaning, and reviewing with flashcards."

11. **Featured game** → featured game card (gold glow)
    "The glowing game gives you 2x quarks and XP! It changes based on which skills you need to practise most."
    `lowStimHide: true`

12. **Level progression** (no target — centred card)
    "As your teacher moves you to higher levels, the words in your games get more challenging. You'll always be practising words that match your year group. Good luck, scientist!"

---

## Visual Design

- **Overlay:** `rgba(15, 23, 42, 0.8)` (navy, matches the app)
- **Spotlight:** 8px padding around target, 8px border-radius, subtle indigo glow (`0 0 20px rgba(99,102,241,0.4)`)
- **Tooltip card:** `background: #1e293b`, `border: 1px solid #334155`, `border-radius: 12px`, max-width 380px, `box-shadow: 0 20px 40px rgba(0,0,0,0.4)`
- **Title:** 16px bold, `#e2e8f0`
- **Body text:** 14px, `#94a3b8`, line-height 1.5
- **Step counter:** Small pill `#6366f1` background, white text, "3 of 12"
- **Buttons:** Next = indigo solid (`#6366f1`), Back = ghost border, Skip = text-only link
- **Transitions:** Spotlight position animates 300ms ease, tooltip fades 200ms
- **Mobile:** Tooltip always below target on screens <600px, full-width with 16px padding

---

## Files

| File | Action |
|------|--------|
| `wordlab-tour.js` | **Create** — shared tour engine |
| `dashboard.html` | **Modify** — add teacher tour steps, replay button, auto-start |
| `landing.html` | **Modify** — add student tour steps, replay button, auto-start |

---

## Out of scope
- Per-game-page tours (games already have WLHelp instruction popups)
- Tour analytics/tracking to Supabase
- Multi-language tour content
