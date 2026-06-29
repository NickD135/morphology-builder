# Lab Shop Reskin — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `scientist.html`'s look and interaction to match the design-feature "Lab Shop" mockup — a single-screen, two-pane dressing-room + shop — wired entirely to the existing SVG character and data layer, with no schema, `WLScientist`, or owned-item changes.

**Architecture:** Build the new screen in a parallel file `scientist-new.html` so the live page is never broken mid-build; swap it over `scientist.html` only in the final task. Reuse the existing catalogue + data functions; extract the inline catalogue into a shared `wordlab-shop-data.js` so the new page and the catalogue have one source of truth. The character is rendered by the existing `WLScientist.buildSVG` (no CSS character). Dances, Badges, and Custom items become category "pills" in the shop rail.

**Tech Stack:** Vanilla HTML/CSS/JS (no build step, no framework, no new dependencies). Supabase JS (CDN). Existing modules: `wordlab-data.js`, `wordlab-scientist.js`, `wordlab-effects.js`, `wordlab-audio.js`, `wordlab-common.css`. Fonts: Lexend (existing) + Fredoka (accent, added). Verification via the Playwright MCP browser tools against a local `python3 -m http.server 8080`.

## Global Constraints

Copied verbatim from the spec (`docs/superpowers/specs/2026-06-29-lab-shop-reskin-design.md`). Every task's requirements implicitly include these:

- **No build system.** Pure HTML/CSS/JS. No npm, no bundler, no framework. (CLAUDE.md §10)
- **No new dependencies.** Reuse `getScientist`, `saveScientist`, `purchase`, `WLEffects`, `WLScientist.buildSVG`, and the existing `shop_items` query only.
- **No changes** to `wordlab-scientist.js`, `wordlab-effects.js`, the database schema, or any owned-item data. Existing student outfits must keep working unchanged.
- **One renderer:** the character is the real `WLScientist.buildSVG` SVG. Do NOT port the mockup's CSS-div character.
- **Phase 1 category pills only:** `Colours · Patterns · Head · Face · Wings · Effects · Dances · Badges · Custom`. Do NOT add Hair, Worlds, or expanded Pets.
- **Typography:** Lexend is the body/UI font. Fredoka (weight 600) is an accent only on display numerals (stat values, LVL, shop title, item prices). Do NOT add Nunito.
- **Exact visual values:** use the literal palette/metrics/keyframes/reactions in spec §12 and the verbatim mockup at `docs/superpowers/specs/2026-06-29-lab-shop-mockup.html`. Do not approximate.
- **Low-stim** (`body.low-stim`): no particle bursts, spin, speech bubble, or floating-card animations; Effects + Dances pills hidden. Everything still equips, instantly.
- **Accessibility (WCAG 2.1 AA):** pills/cards are real `<button>`s; `aria-current` on active pill; descriptive `aria-label`s; modals are `role="dialog"`, focus-trapped, Esc-to-close, restore focus on close; `aria-live` on quark balance + not-enough message; no colour-only meaning; honour `prefers-reduced-motion`.
- **Mobile:** panes stack vertically under ~760px; pills wrap; grid tightens; touch targets ≥ 44px; verified at 320–480px.
- **Australian English** in all user-facing copy ("Colours", "Customise").
- **XSS-safe:** never inject student names, item names, or DB strings via raw `innerHTML` — use `textContent` or the existing `escapeHtml()` helper. (CLAUDE.md security audit)

---

## File Structure

| File | Create/Modify | Responsibility |
|---|---|---|
| `scientist-new.html` | Create (then becomes `scientist.html` in Task 13) | The entire new single-screen Lab Shop page: layout, CSS, render + interaction logic. |
| `wordlab-shop-data.js` | Create | Shared catalogue data (coat colours, patterns, heads, faces, wings, dances) extracted verbatim from the existing `scientist.html` `SHOP` object, exposed as `window.WLShopData`. Effects come from `WLEffects.EFFECTS`. |
| `scientist.html` | Modify (Task 13 only) | Replaced wholesale by the verified `scientist-new.html`. |
| `vercel.json` | Modify (Task 13 only, if needed) | No change expected (same filename); verify no per-path rule references the temp file. |

**Why a parallel file:** `scientist.html` is linked by name across the app and is live. Building in `scientist-new.html` keeps the real page working until the final verified swap, and gives every task a directly-loadable artifact (`/scientist-new.html`).

---

## Task 0: Environment + test session

**Files:** none (setup only).

- [ ] **Step 1: Confirm branch**

Run: `git -C /workspaces/morphology-builder branch --show-current`
Expected: `lab-shop-reskin`. If not, run `git checkout lab-shop-reskin`.

- [ ] **Step 2: Start the local server (background)**

Run: `python3 -m http.server 8080 --bind 0.0.0.0` in the repo root, in the background.
Expected: server serves the repo at `http://localhost:8080/`.

- [ ] **Step 3: Identify a test student session**

Open `http://localhost:8080/landing.html` in the Playwright browser. Log in as an existing test student (class code + student name) — the project's known test student is "Test 2 / Voyager 1". After login, confirm `sessionStorage` contains `wordlab_session_v1`.

Run (Playwright `browser_evaluate`): `() => sessionStorage.getItem('wordlab_session_v1')`
Expected: a non-null JSON string with a `studentId`. Record it — every later task reuses this session by navigating to `/scientist-new.html` in the same browser context.

- [ ] **Step 4: Capture a baseline screenshot of the current page**

Navigate to `http://localhost:8080/scientist.html`, take a screenshot, save as reference (`/tmp/.../scratchpad/scientist-baseline.png`). This is the "before" for comparison and confirms the session renders a real character/quarks.

No commit (setup only).

---

## Task 1: New page skeleton — head, scripts, top bar, empty two-pane shell, auth boot

**Files:**
- Create: `scientist-new.html`

**Interfaces:**
- Consumes: `WordLabData.getStudentSession()`, `WordLabData.requireStudentAuth()` *(use the exact student-session guard the existing `scientist.html` uses — open `scientist.html` and copy its login/redirect boot verbatim)*, `WordLabData.getScientist()`, `WordLabData.getStudentData()`.
- Produces: global `WL` namespace object on `window` holding page state (`{ scientist, stats, quarks, owned, activeCat }`) and a `WL.boot()` entry point. Later tasks attach render functions to `WL`.

- [ ] **Step 1: Create the file with head + scripts**

Create `scientist-new.html`. In `<head>`: charset/viewport, `<title>Word Labs – My Scientist</title>`, the existing favicon link (copy from `scientist.html`), `wordlab-common.css`, the Lexend Google Fonts link (copy from `scientist.html`), and ADD Fredoka:
```html
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap" rel="stylesheet">
```
Before `</body>`, load scripts in the SAME order and with the SAME attributes as `scientist.html` (copy its `<script>` block verbatim): Supabase CDN, `wordlab-data.js`, `wordlab-scientist.js`, `wordlab-effects.js`, `wordlab-audio.js`, then a new inline `<script>` for this page's logic. Add `<script defer src="wordlab-shop-data.js"></script>` (created in Task 3 — a missing-file 404 is harmless until then; the page guards for `window.WLShopData`).

- [ ] **Step 2: Add the page CSS scaffold**

In a `<style>` block, define the layout scaffold and palette as CSS custom properties using the EXACT values from spec §12.2/§12.3. Minimum for this task:
```css
:root{
  --lab-bg:#15131f; --topbar:linear-gradient(180deg,#33324a,#2a2940);
  --brand:linear-gradient(135deg,#7b6bff,#5a39c7);
  --panel:linear-gradient(180deg,#faf3da,#f3e9c8); --panel-edge:#e5d49e;
  --accent:#5a39c7; --accent-2:#7b6bff;
}
.labshop{height:100vh;display:flex;flex-direction:column;background:var(--lab-bg);font-family:'Lexend',sans-serif;color:#3a3550;overflow:hidden;}
.lab-topbar{height:58px;flex:0 0 58px;background:var(--topbar);display:flex;align-items:center;padding:0 20px;gap:14px;border-bottom:2px solid rgba(0,0,0,.3);box-shadow:0 4px 18px rgba(0,0,0,.25);}
.lab-main{flex:1;min-height:0;display:flex;}
.lab-left{flex:1 1 50%;min-width:380px;display:flex;flex-direction:column;background:var(--lab-bg);}
.lab-shop-panel{flex:1 1 50%;min-width:420px;background:var(--panel);border-left:3px solid var(--panel-edge);display:flex;flex-direction:column;box-shadow:-10px 0 30px rgba(0,0,0,.2);}
.fred{font-family:'Fredoka',sans-serif;font-weight:600;}
```

- [ ] **Step 3: Add the body markup**

Add the skip-link (copy the project's standard from another page), then:
```html
<div class="labshop">
  <header class="lab-topbar" role="banner">
    <!-- brand + MY SCIENTIST label (static); quark pill (#quarkPill, aria-live=polite); student name (#studentName); Home link to landing.html -->
  </header>
  <main class="lab-main" role="main">
    <section class="lab-left" aria-label="Your scientist">
      <div id="stage" class="lab-stage"></div>
      <div id="statsCard" class="lab-stats"></div>
    </section>
    <section class="lab-shop-panel" aria-label="Lab Shop">
      <div id="shopHeader"></div>
      <nav id="pillRail" aria-label="Shop categories"></nav>
      <div id="itemGrid" class="lab-grid" role="list"></div>
    </section>
  </main>
</div>
```
Build the top-bar inner markup with the exact styles from the mockup top bar (spec §12.2 row 2-3): brand tile (`--brand`), "Word Labs" (Fredoka) + "MY SCIENTIST" label, the quark pill, student name pill, Home pill. Use `textContent` for the student name.

- [ ] **Step 4: Add the boot script**

In the page's inline `<script>`:
```js
const WL = window.WL = { scientist:null, stats:null, quarks:0, owned:[], activeCat:'colours' };
WL.boot = async function(){
  // Reuse the EXACT student-auth guard from scientist.html (redirect to landing if no session).
  const data = await WordLabData.getStudentData();   // { quarks, xp, badges, stats, scientist }
  WL.scientist = data.scientist; WL.stats = data.stats || {};
  WL.quarks = data.quarks || 0; WL.owned = (data.scientist.owned)||[];
  document.getElementById('studentName').textContent = WordLabData.getStudentSession().name || 'Scientist';
  WL.renderQuarks();
};
WL.renderQuarks = function(){ document.getElementById('quarkValue').textContent = (WL.quarks||0).toLocaleString('en-AU'); };
document.addEventListener('DOMContentLoaded', WL.boot);
```
*(Open `scientist.html` to copy the exact `getStudentData`/session field names if they differ — match them precisely.)*

- [ ] **Step 5: Verify in the browser**

Navigate Playwright to `http://localhost:8080/scientist-new.html` (same context as the Task 0 session). Take a screenshot.
Expected: dark page, top bar with brand, the student's real name, and the real quark balance; two empty panes (left dark, right parchment). No JS console errors (`browser_console_messages` shows none).

- [ ] **Step 6: Commit**

```bash
git add scientist-new.html
git commit -m "feat(lab-shop): new page skeleton — top bar, two-pane shell, auth boot"
```

---

## Task 2: Left stage — real SVG character on podium + stats card

**Files:**
- Modify: `scientist-new.html`

**Interfaces:**
- Consumes: `WLScientist.buildSVG(scientist, mood)` (returns an SVG string), `WL.scientist`, `WL.stats`.
- Produces: `WL.renderStage()`, `WL.renderStats()`, and `WL.charEl` (the DOM node wrapping the SVG, used by Task 9 reactions).

- [ ] **Step 1: Add stage + stats CSS**

Add CSS for `.lab-stage` (relative, flex:1, centered, lab-coloured radial glow podium using `ringPulse`) and `.lab-stats` (the parchment stats card, `linear-gradient(180deg,#faf3da,#f0e4c0)`, border-top `3px solid #e5d49e`, padding `13px 16px 15px`). Add the keyframes from spec §12.4 (`idleBob`, `ringPulse`, `floatY`) wrapped so they are disabled under reduced-motion/low-stim:
```css
@keyframes idleBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes ringPulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.55}50%{transform:translate(-50%,-50%) scale(1.12);opacity:.9}}
.lab-bob{animation:idleBob 4s ease-in-out infinite;}
@media (prefers-reduced-motion:reduce){.lab-bob{animation:none;}}
body.low-stim .lab-bob{animation:none;}
```

- [ ] **Step 2: Implement renderStage()**

```js
WL.renderStage = function(){
  const stage = document.getElementById('stage');
  stage.innerHTML = '';
  const podium = document.createElement('div'); podium.className = 'lab-podium';
  const wrap = document.createElement('div'); wrap.className = 'lab-charwrap lab-bob';
  wrap.innerHTML = WLScientist.buildSVG(WL.scientist, 'neutral'); // trusted: our own SVG builder
  WL.charEl = wrap;
  stage.appendChild(podium); stage.appendChild(wrap);
};
```
Style `.lab-charwrap` to scale the SVG to a good stage size (the SVG viewBox is `0 0 80 120`; set a fixed width e.g. 180px). Position the podium glow ellipse behind it per the mockup (radial `rgba(240,200,90,.7)` → transparent, `ringPulse`).

- [ ] **Step 3: Implement renderStats()**

Build the stats card with exact mockup structure (spec §12.2 stats rows): a LVL badge (`linear-gradient(135deg,#ffd24a,#e0a02a)`, Fredoka value), title + "XP to next" line, XP bar (track `#e7d7a6`, fill `linear-gradient(90deg,#8a7bff,#6d4ad6)`), and a 4-tile grid: **Correct · Accuracy · Sessions · Badges**. Source values from real data:
```js
WL.renderStats = function(){
  const s = WL.stats||{}, badges = (WL.scientist.displayBadges||[]);
  const correct = s.totalCorrect||0, answered = s.totalAnswered||0;
  const acc = answered ? Math.round(correct/answered*100) : 0;
  const sessions = s.sessions||0;
  const badgeCount = (WL.allBadges||[]).length; // see note
  // level/title/xp: reuse the EXACT level + title logic from scientist.html (copy its helper).
  // Build tiles with textContent only. Each tile: number (Fredoka, category colour) + LABEL.
};
```
**Note:** for the level, title, and badge count, open `scientist.html` and copy its existing level/title computation and badge-count source verbatim (do not invent a new formula). Stat number colours: Correct `#3f8a4a`, Accuracy `#6d4ad6`, Sessions `#2f8fd8`, Badges `#e0a02a`; labels `#8a6a2a`. Every tile has a text label (never colour-only).

- [ ] **Step 4: Call them from boot**

Add `WL.renderStage(); WL.renderStats();` to the end of `WL.boot()`.

- [ ] **Step 5: Verify**

Reload `/scientist-new.html`. Screenshot.
Expected: the student's real SVG scientist centred on a glowing podium with a gentle bob; the stats card shows their real Correct/Accuracy/Sessions/Badges, level, title, and a partly-filled XP bar. Compare character against the Task 0 baseline — it must be the SAME character/outfit. No console errors.

- [ ] **Step 6: Commit**

```bash
git add scientist-new.html
git commit -m "feat(lab-shop): left stage with real SVG character + stats card"
```

---

## Task 3: Shared catalogue module (`wordlab-shop-data.js`)

**Files:**
- Create: `wordlab-shop-data.js`
- Reference: `scientist.html` (the existing `SHOP` object, ~lines 629–773)

**Interfaces:**
- Produces: `window.WLShopData` with arrays: `colours`, `patterns`, `heads`, `faces`, `wings`, `dances` (each item keeping its existing fields: `id`, `name`, `cost`/`free`, `legendary`, `rarity`, badge-gate fields, `tier` for dances, etc.), plus helper `WLShopData.rarityOf(item)`.

- [ ] **Step 1: Extract the catalogue verbatim**

Open `scientist.html`, locate the inline `SHOP` object (coat colours, patterns, heads, faces, wings) and the dances definition. Copy each array VERBATIM into `wordlab-shop-data.js` as:
```js
(function(){
  const SHOP = { /* paste the exact colours/patterns/heads/faces/wings arrays here */ };
  const DANCES = [ /* paste the exact dances list (with tier + cost) here */ ];
  window.WLShopData = {
    colours: SHOP.colours, patterns: SHOP.patterns, heads: SHOP.heads,
    faces: SHOP.faces, wings: SHOP.wings, dances: DANCES,
    rarityOf(item){ /* return item.rarity || (item.legendary?'legendary':'common') — match scientist.html's existing rarity logic */ }
  };
})();
```
Do not alter ids, names, costs, or gating — the new page must produce identical owned-item keys.

- [ ] **Step 2: Verify the module loads**

Reload `/scientist-new.html`. In Playwright `browser_evaluate`: `() => Object.keys(window.WLShopData).map(k=>Array.isArray(window.WLShopData[k])?k+':'+window.WLShopData[k].length:k)`
Expected: `colours:24, patterns:10, heads:26, faces:18, wings:5, dances:22` (counts per the Explore map — confirm against the real arrays). No console errors.

- [ ] **Step 3: Commit**

```bash
git add wordlab-shop-data.js scientist-new.html
git commit -m "feat(lab-shop): extract shared catalogue into wordlab-shop-data.js"
```

---

## Task 4: Category pills + swatch grids (Colours, Patterns) with live equip

**Files:**
- Modify: `scientist-new.html`

**Interfaces:**
- Consumes: `WLShopData`, `WordLabData.saveScientist(updates)`, `WL.scientist`, `WL.owned`.
- Produces: `WL.CATS` (the pill definitions), `WL.setCategory(catId)`, `WL.renderPills()`, `WL.renderGrid()`, `WL.renderShopHeader()`, `WL.equip(catId,id)`, `WL.cardEl(item, catId)` (returns a card `<button>`). The card builder is reused by later category tasks.

- [ ] **Step 1: Define categories + field map**

```js
WL.CATS = [
  {id:'colours', label:'Colours', icon:'🎨', field:'coatColor', src:()=>WLShopData.colours},
  {id:'patterns',label:'Patterns',icon:'▦', field:'coatPattern', src:()=>WLShopData.patterns},
  {id:'heads',   label:'Head',   icon:'🎩', field:'head',  src:()=>WLShopData.heads},
  {id:'faces',   label:'Face',   icon:'👓', field:'face',  src:()=>WLShopData.faces},
  {id:'wings',   label:'Wings',  icon:'🪽', field:'wings', src:()=>WLShopData.wings},
  {id:'effects', label:'Effects',icon:'✨', field:'effect', src:()=>WL.effectList()},   // Task 6
  {id:'dances',  label:'Dances', icon:'💃', src:()=>WLShopData.dances},                  // Task 6
  {id:'badges',  label:'Badges', icon:'🏅'},                                             // Task 7
  {id:'custom',  label:'Custom', icon:'🎨'}                                              // Task 8
];
```
*(Confirm the field names `coatColor`, `coatPattern`, `head`, `face`, `wings`, `effect` against `scientist.html`/the scientist jsonb — they must match exactly.)*

- [ ] **Step 2: Render pills**

`WL.renderPills()` builds a `<button>` per category into `#pillRail`, with the exact active/inactive styles from spec §12.2 (active `linear-gradient(135deg,#7b6bff,#5a39c7)` white text; inactive bg `#fffdf2` border `2px solid #e5d49e` text `#7a5a1e`), `aria-current="true"` on the active one, icon + label. Clicking calls `WL.setCategory(id)`.

- [ ] **Step 3: Render shop header**

`WL.renderShopHeader()` builds the "🛍️ Lab Shop" title (Fredoka 25px `#4a3416`), the "N in {Category}" count, the "Spend quarks…" line, and the "🎲 Surprise me" button (wired in Task 10; render it now, no-op handler).

- [ ] **Step 4: Card builder + swatch preview**

```js
WL.cardEl = function(item, cat){
  const owned = item.free || item.cost===0 || WL.owned.includes(WL.ownKey(cat,item));
  const equipped = WL.scientist[cat.field] === item.id;
  const btn = document.createElement('button');
  btn.className = 'lab-card' + (equipped?' is-equipped':'');
  btn.setAttribute('role','listitem');
  // preview (swatch for colours/patterns — see Step 5), name (textContent), price (FREE/⚛cost),
  // rarity badge (top-left) when rare/epic/legendary, equipped ✓ (top-right),
  // action label: equipped?'✓ Equipped':owned?'Equip':'Get it'.
  btn.setAttribute('aria-label', `${item.name}, ${item.free?'free':item.cost+' quarks'}, ${equipped?'equipped':owned?'owned':'not owned'}`);
  btn.onclick = ()=>WL.select(cat, item);   // WL.select defined in Task 9; for now alias to WL.equip when owned
  return btn;
};
```
Define `WL.ownKey(cat,item)` to produce the SAME owned-array key the existing page uses (open `scientist.html` — colours/patterns/heads/faces/wings store the bare `item.id` in `owned`; match it exactly). Swatch CSS per spec §12.2 item card + §12.6 (reuse existing pattern CSS for pattern swatches so previews match the worn coat — copy the pattern background definitions from `wordlab-scientist.js`/`scientist.html`).

- [ ] **Step 5: Grid + setCategory + equip**

```js
WL.renderGrid = function(){
  const cat = WL.CATS.find(c=>c.id===WL.activeCat);
  const grid = document.getElementById('itemGrid'); grid.innerHTML='';
  if(!cat.src){ return; } // badges/custom handled in later tasks
  cat.src().forEach(it=> grid.appendChild(WL.cardEl(it, cat)));
};
WL.setCategory = function(id){ WL.activeCat=id; WL.renderPills(); WL.renderShopHeader(); WL.renderGrid(); };
WL.equip = async function(cat, item){
  WL.scientist[cat.field] = item.id;
  await WordLabData.saveScientist({ [cat.field]: item.id });
  WL.renderStage(); WL.renderGrid();
  WL.react();   // Task 9 (define a no-op WL.react now)
};
WL.select = (cat,item)=>{ const owned = item.free||item.cost===0||WL.owned.includes(WL.ownKey(cat,item)); if(owned) WL.equip(cat,item); };
WL.react = WL.react || function(){};
```
Call `WL.renderPills(); WL.renderShopHeader(); WL.renderGrid();` at the end of `WL.boot()`.

- [ ] **Step 6: Verify**

Reload. Screenshot. Click the Patterns pill, screenshot. Click an owned colour swatch (e.g. the free Classic White / current colour), confirm the left character's coat updates live. In `browser_evaluate`, confirm `WL.scientist.coatColor` changed and reload the page to confirm it PERSISTED (saveScientist worked).
Expected: pills render with correct active styling; grids show swatch cards with name/price/button; equipping an owned colour updates the SVG and persists. No console errors.

- [ ] **Step 7: Commit**

```bash
git add scientist-new.html
git commit -m "feat(lab-shop): category pills + colour/pattern grids with live equip"
```

---

## Task 5: Mini-SVG previews for Head / Face / Wings

**Files:**
- Modify: `scientist-new.html`

**Interfaces:**
- Consumes: `WLScientist.buildSVG`, `WL.cardEl` (from Task 4).
- Produces: `WL.miniPreview(cat, item)` returning an SVG-string node showing only that accessory on a neutral base scientist.

- [ ] **Step 1: Implement miniPreview**

```js
WL.miniPreview = function(cat, item){
  // Minimal scientist: default skin/coat, only the one accessory field set.
  const base = { skinTone:WL.scientist.skinTone, coatColor:'#ffffff', coatPattern:'plain',
                 head:null, face:null, wings:null };
  if(item.id && item.id!=='none') base[cat.field] = item.id;
  const div = document.createElement('div'); div.className='lab-mini';
  div.innerHTML = WLScientist.buildSVG(base, 'neutral'); // trusted SVG
  return div;
};
```
Style `.lab-mini` so the SVG is sized to the card preview area (~64–70px tall) and, for `face`, cropped/zoomed to the head if needed (a `transform: scale()` + `overflow:hidden` wrapper is fine).

- [ ] **Step 2: Use it in cardEl**

In `WL.cardEl`, when `cat.id` is `heads`/`faces`/`wings` and `item.id!=='none'`, use `WL.miniPreview(cat,item)` for the preview; the `none` item shows a 🚫 glyph. Colours/patterns keep swatches.

- [ ] **Step 3: Verify**

Reload, click Head pill → screenshot, click Face → screenshot, click Wings → screenshot.
Expected: each accessory card shows a tiny real scientist wearing exactly that item; equipping one updates the big character to match the preview. No console errors.

- [ ] **Step 4: Commit**

```bash
git add scientist-new.html
git commit -m "feat(lab-shop): accurate mini-SVG previews for head/face/wings"
```

---

## Task 6: Effects + Dances pills

**Files:**
- Modify: `scientist-new.html`

**Interfaces:**
- Consumes: `WLEffects.EFFECTS` (effect catalogue: id, name, cost, rarity, requires), `WLShopData.dances`, the existing `applyEffect`/dance-equip logic in `scientist.html`.
- Produces: `WL.effectList()` (array adapter over `WLEffects.EFFECTS`), effect + dance equip handlers, `WL.equipEffect(id)`, `WL.equipDance(item)`.

- [ ] **Step 1: Effect adapter + equip**

```js
WL.effectList = function(){
  return Object.entries(WLEffects.EFFECTS).map(([id,e])=>({ id, name:e.name, cost:e.cost||0, free:(e.cost||0)===0, rarity:e.rarity, requires:e.requires }));
};
WL.equipEffect = async function(id){
  WL.scientist.effect = (id==='none'?null:id);
  await WordLabData.saveScientist({ effect: WL.scientist.effect });
  WL.renderGrid();
  // preview the effect on the stage unless low-stim:
  if(!WordLabData.isLowStimMode() && id!=='none'){ WLEffects.stop(WL.charEl); WLEffects.start(id, WL.charEl); }
  else { WLEffects.stop(WL.charEl); }
};
```
Effects route through `WL.select`/buy flow like other paid items; the effect preview only plays when owned + equipped. Render effect previews in cards as an icon (reuse the existing effect emoji mapping from `scientist.html` if present, else a generic ✨) — not the heavy live effect.

- [ ] **Step 2: Dances grid**

Dances render grouped by tier (the existing 6 tiers). Each dance card shows name + cost + Equip/Get it, and on equip writes `WL.scientist.dances[tier]=id` via `saveScientist({ dances: {...} })`. **Copy the exact dance tier keys and equip persistence shape from `scientist.html`** so saved data matches.

- [ ] **Step 3: Wire into select/equip**

Extend `WL.select` so `cat.id==='effects'` routes to the buy-or-`equipEffect` path and `cat.id==='dances'` routes to buy-or-`equipDance`. Keep the owned check using the existing owned keys (`effect_<id>`, `dance_<id>` — confirm against `scientist.html`).

- [ ] **Step 4: Verify**

Reload, click Effects pill → screenshot; equip an owned effect → confirm it plays on the character (when not low-stim). Click Dances → screenshot; equip an owned dance → confirm `WL.scientist.dances` updated and persists on reload.
Expected: both grids render; equips persist; effect preview plays. No console errors.

- [ ] **Step 5: Commit**

```bash
git add scientist-new.html
git commit -m "feat(lab-shop): effects + dances category pills"
```

---

## Task 7: Badges pill (earned + pin-to-coat)

**Files:**
- Modify: `scientist-new.html`

**Interfaces:**
- Consumes: the existing badge catalogue + earned-badge + "pin up to 3 to lab coat" logic in `scientist.html` (`displayBadges`), `WordLabData.saveScientist`.
- Produces: `WL.renderBadges()` (called by `renderGrid` when `activeCat==='badges'`), `WL.togglePin(badgeId)`.

- [ ] **Step 1: Port the badge view**

Open `scientist.html`'s Badges tab. Copy its earned-badge rendering and the pin/unpin logic (max 3 `displayBadges`, plus the streak flame) into `WL.renderBadges()`, restyled to the parchment grid. Earned badges show their icon + name; locked ones show a dimmed/locked state with a text label (not colour-only). Pinning calls `saveScientist({ displayBadges:[...] })` and re-renders the stage so pins appear on the coat.

- [ ] **Step 2: Route renderGrid**

In `WL.renderGrid`, when `WL.activeCat==='badges'`, call `WL.renderBadges()` instead of the card loop.

- [ ] **Step 3: Verify**

Reload, click Badges → screenshot. Pin an earned badge → confirm it appears on the character's coat and persists on reload; confirm the 3-pin cap is enforced.
Expected: badges render; pinning works and persists; cap enforced. No console errors.

- [ ] **Step 4: Commit**

```bash
git add scientist-new.html
git commit -m "feat(lab-shop): badges pill with pin-to-coat"
```

---

## Task 8: Custom pill (teacher-made `shop_items`)

**Files:**
- Modify: `scientist-new.html`

**Interfaces:**
- Consumes: the existing `shop_items` load + milestone-unlock + `equipCustomItem` logic in `scientist.html` (the `select('id, name, item_type, rarity, ...image_url, image_data')` query and `customSlots` write).
- Produces: `WL.loadCustom()` (async, fills `WL.customItems`), `WL.renderCustom()`, `WL.equipCustom(item)`.

- [ ] **Step 1: Port the custom load + render**

Copy the exact `shop_items` query, the active/seasonal/limited filtering, and the milestone auto-unlock logic from `scientist.html` into `WL.loadCustom()`. Render cards with the item image (`image_url` with `image_data` base64 fallback) as the preview, name (`escapeHtml`/`textContent`), rarity badge, and price/unlock state. Equipping writes `customSlots[item_type]` + `_img_<type>` via the existing `equipCustomItem` flow (copy it verbatim) and re-renders the stage.

- [ ] **Step 2: Route + lazy load**

In `WL.renderGrid`, when `activeCat==='custom'`, render from `WL.customItems` (call `WL.loadCustom()` once, then render). If there are no custom items, show a friendly empty message.

- [ ] **Step 3: Verify**

Reload, click Custom. If the test class has custom items, equip one and confirm the overlay appears on the character and persists; if none, confirm the empty message shows. No console errors.

- [ ] **Step 4: Commit**

```bash
git add scientist-new.html
git commit -m "feat(lab-shop): custom teacher-made items pill"
```

---

## Task 9: Buying flow — confirm + not-enough modals, purchase, reactions

**Files:**
- Modify: `scientist-new.html`

**Interfaces:**
- Consumes: `WordLabData.purchase(key, cost)` (atomic; returns `{success, quarks, reason}`), `WL.charEl`, `WL.equip`/`equipEffect`/`equipDance`/`equipCustom`.
- Produces: `WL.select` (full version), `WL.confirmBuy()`, `WL.openConfirm(cat,item)`, `WL.openNotEnough(item)`, `WL.react()`, `WL.spin()`, `WL.burst()`, `WL.popQuark()`, `WL.shakeBalance()`, `WL.speech(text)`.

- [ ] **Step 1: Modal markup + CSS**

Add two hidden modal containers (`#confirmModal`, `#notEnoughModal`) with the exact mockup styling (spec §12.2 modal rows; `overlayFade`/`modalPop` keyframes from §12.4). Each: `role="dialog"`, `aria-modal="true"`, a labelled heading, the item preview (reuse swatch/mini/emoji/image preview), price, "balance after", and buttons. Implement a focus trap, Esc-to-close, overlay-click-to-close, and focus restore to the triggering card.

- [ ] **Step 2: Full select + purchase**

```js
WL.select = function(cat, item){
  const cost = item.cost||0, free = item.free||cost===0;
  const owned = free || WL.owned.includes(WL.ownKey(cat,item));
  if(owned){ WL.equipFor(cat,item); return; }
  if(WL.quarks < cost){ WL.openNotEnough(item); WL.shakeBalance(); return; }
  WL.openConfirm(cat,item);
};
WL.confirmBuy = async function(){
  const {cat,item} = WL.pending; const cost=item.cost||0;
  const res = await WordLabData.purchase(WL.ownKey(cat,item), cost);
  if(!res || !res.success){ WL.closeConfirm(); WL.openNotEnough(item); return; }
  WL.quarks = res.quarks; WL.owned.push(WL.ownKey(cat,item)); WL.renderQuarks(); WL.popQuark();
  WL.closeConfirm(); WL.equipFor(cat,item);
};
```
`WL.equipFor(cat,item)` dispatches to `equip`/`equipEffect`/`equipDance`/`equipCustom` by `cat.id`. **Confirm `WordLabData.purchase` adds the key to `owned` itself or whether the page must `saveScientist({owned})` — match `scientist.html`'s existing pattern exactly** (per the Explore map, the page pushes to `owned` and the equip persists the field).

- [ ] **Step 3: Reactions (low-stim / reduced-motion aware)**

Implement `WL.react()` to set a happy mood + random speech phrase (spec §12.5 phrase list), then `WL.spin()` + `WL.burst()`. Port `spin`/`burst`/`popQuark`/`shakeBalance` from the mockup JS (spec §12.5) using the Web Animations API on `WL.charEl`/`#quarkPill`/a burst layer. Guard:
```js
const calm = ()=> (WordLabData.isLowStimMode && WordLabData.isLowStimMode()) || matchMedia('(prefers-reduced-motion:reduce)').matches;
WL.react = function(){ if(calm()) return; WL.speech(/*random*/); WL.spin(); WL.burst(); };
```

- [ ] **Step 4: Verify**

Reload. Equip an OWNED item → confirm spin/burst/speech play (and confirm NONE play after toggling low-stim — Task 11 covers the toggle, but you can set `document.body.classList.add('low-stim')` to spot-check). Click an UNOWNED affordable item → confirm modal → Buy & Equip → quarks decrease and persist, item equips. Click an UNOWNED unaffordable item → not-enough modal + balance shake. Press Esc → modal closes and focus returns to the card.
Expected: all flows work; purchases persist; reactions respect calm-mode. No console errors.

- [ ] **Step 5: Commit**

```bash
git add scientist-new.html
git commit -m "feat(lab-shop): buy/not-enough modals, atomic purchase, scientist reactions"
```

---

## Task 10: Surprise me (randomise owned)

**Files:**
- Modify: `scientist-new.html`

**Interfaces:**
- Consumes: `WLShopData`, `WL.owned`, `WL.equipFor`, `WordLabData.saveScientist`.
- Produces: `WL.surprise()`.

- [ ] **Step 1: Implement**

```js
WL.surprise = async function(){
  const updates = {};
  [['colours','coatColor'],['patterns','coatPattern'],['heads','head'],['faces','face'],['wings','wings']]
    .forEach(([catId,field])=>{
      const cat = WL.CATS.find(c=>c.id===catId);
      const ownedItems = cat.src().filter(it=> it.free||it.cost===0||WL.owned.includes(WL.ownKey(cat,it)));
      if(ownedItems.length){ const pick = ownedItems[Math.floor(Math.random()*ownedItems.length)]; updates[field]=pick.id; WL.scientist[field]=pick.id; }
    });
  await WordLabData.saveScientist(updates);
  WL.renderStage(); WL.renderGrid();
  if(!calm()){ WL.speech('Surprise! 🎲'); WL.spin(); WL.burst(); }
};
```
Wire it to the "🎲 Surprise me" button. Randomise only OWNED items, only among the visual outfit fields (not effects/dances/badges/custom).

- [ ] **Step 2: Verify**

Reload, click Surprise me a few times → the character changes to different owned combinations; reload confirms the last combo persisted; under low-stim no animation plays.
Expected: works, persists, calm-aware. No console errors.

- [ ] **Step 3: Commit**

```bash
git add scientist-new.html
git commit -m "feat(lab-shop): Surprise me randomiser (owned items only)"
```

---

## Task 11: Low-stim, reduced-motion & accessibility pass

**Files:**
- Modify: `scientist-new.html`

**Interfaces:** none new — hardening existing behaviour.

- [ ] **Step 1: Low-stim CSS + load**

Ensure `body.low-stim` hides the Effects and Dances pills (and any bonus chrome), and disables all decorative animations (`floatY`, `idleBob`, `ringPulse`, card float, reactions). Load low-stim state on boot the same way `scientist.html` does (copy its low-stim load call) and apply `body.low-stim`.
```css
body.low-stim .lab-card,body.low-stim .lab-bob,body.low-stim .lab-podium{animation:none!important;}
body.low-stim #pill-effects,body.low-stim #pill-dances{display:none;}
```

- [ ] **Step 2: Accessibility sweep**

Verify/add: `role="banner"`/`main`/nav landmarks; pills + cards are real `<button>`s reachable by Tab with visible `focus-visible` (inherited from `wordlab-common.css`); `aria-current="true"` on active pill; descriptive `aria-label`s on cards; `#quarkPill` has `aria-live="polite"`; the not-enough message has `aria-live="assertive"`; modals trap focus, support Esc, and restore focus. No information by colour alone (rarity + equipped have text/icon).

- [ ] **Step 3: Verify**

Reload. With Playwright: Tab through pills and cards (confirm focus ring + activation via Enter/Space). Open a modal, Tab (focus stays inside), Esc (closes, focus returns). Then in `browser_evaluate` set `document.body.classList.add('low-stim')` and re-render → confirm Effects/Dances pills hidden and no animations; equipping still works. Screenshot both states.
Expected: full keyboard operability; low-stim suppresses motion + hides Effects/Dances but equipping works. No console errors.

- [ ] **Step 4: Commit**

```bash
git add scientist-new.html
git commit -m "feat(lab-shop): low-stim, reduced-motion, and WCAG AA hardening"
```

---

## Task 12: Mobile / responsive

**Files:**
- Modify: `scientist-new.html`

**Interfaces:** none new.

- [ ] **Step 1: Add responsive CSS**

```css
@media (max-width:760px){
  .lab-main{flex-direction:column;overflow-y:auto;}
  .lab-left,.lab-shop-panel{min-width:0;flex:none;}
  .lab-left{height:auto;} .lab-stage{min-height:230px;}
  .lab-shop-panel{border-left:none;border-top:3px solid var(--panel-edge);box-shadow:none;}
  #itemGrid{grid-template-columns:repeat(auto-fill,minmax(128px,1fr));}
}
.lab-card,.lab-pill{min-height:44px;}
```
Ensure the top bar wraps/condenses gracefully and the page scrolls (not 100vh-locked) on small screens.

- [ ] **Step 2: Verify**

Resize the Playwright viewport to 360×740 and 320×640. Screenshot each. Confirm: panes stack (character on top, shop below), no horizontal scroll, pills wrap, cards ≥44px tappable, modals fit.
Expected: clean stacked layout at 320–480px. No console errors.

- [ ] **Step 3: Commit**

```bash
git add scientist-new.html
git commit -m "feat(lab-shop): mobile responsive layout (stacks under 760px)"
```

---

## Task 13: Swap into `scientist.html` + full regression

**Files:**
- Modify: `scientist.html` (replaced), delete `scientist-new.html`
- Reference: `vercel.json`

**Interfaces:** none — this is the cutover.

- [ ] **Step 1: Pre-swap full regression on the new page**

On `/scientist-new.html`, run the full checklist in one pass (screenshot each): character renders; stats correct; every pill (Colours, Patterns, Head, Face, Wings, Effects, Dances, Badges, Custom) renders; equip a free item; buy a paid item (persists); not-enough modal; Surprise me; pin a badge; low-stim; mobile. Confirm zero console errors throughout.

- [ ] **Step 2: Swap the file**

```bash
git mv scientist-new.html scientist.html.new && git rm scientist.html && git mv scientist.html.new scientist.html
```
(Equivalently: overwrite `scientist.html` with the new file's contents and remove the temp file.) Then update the `<title>` already set; ensure no internal self-reference points to `scientist-new.html` (grep):
```bash
grep -rn "scientist-new" /workspaces/morphology-builder --include=*.html --include=*.js
```
Expected: no matches.

- [ ] **Step 3: Verify the live path**

Navigate to `http://localhost:8080/scientist.html`. Re-run the smoke checklist (character, one equip, one buy, low-stim, mobile). Confirm it matches the pre-swap behaviour and that links from `landing.html` reach it.
Expected: the real page is now the new Lab Shop, fully working. No console errors.

- [ ] **Step 4: Confirm no orphaned outfits**

Log in as a SECOND existing student who owns several items; confirm their previously-owned colours/patterns/heads/faces/wings/effects/dances/badges all still show as owned and equip correctly (proves the owned-key mapping is unchanged).
Expected: existing outfits intact.

- [ ] **Step 5: Commit**

```bash
git add scientist.html
git commit -m "feat(lab-shop): swap reskinned Lab Shop into scientist.html"
```

- [ ] **Step 6: Update the roadmap**

In `CLAUDE.md`, add a short Phase entry noting the Lab Shop reskin shipped (single-screen layout, real SVG character, Dances/Badges/Custom as pills) and that Phase 2 (animated worlds) / Phase 3 (hair, pets, art port) remain. Commit:
```bash
git add CLAUDE.md && git commit -m "docs: record Lab Shop reskin (Phase 1) in roadmap"
```

---

## Self-Review

**Spec coverage:**
- Top bar / quarks → Task 1. Stage + stats → Task 2. Pills (all 9) → Tasks 4,6,7,8. Swatch + mini-SVG previews → Tasks 4,5. Buying flow + modals + reactions → Task 9. Surprise me → Task 10. Low-stim + a11y → Task 11. Mobile → Task 12. Exact visual values → every UI task references spec §12 + mockup file. One-renderer (SVG) → Tasks 2,5. Catalogue reuse → Task 3. Swap/regression/orphan check → Task 13. ✓ All spec sections map to a task.
- **Deferred (correctly absent):** Hair, animated Worlds, expanded Pets, the ~7 new effects, the CSS character — per spec §2.

**Placeholder scan:** No "TBD/TODO". Where exact existing values are needed (catalogue arrays, level/title formula, owned-key shape, dance tiers, custom-item flow, auth boot), tasks instruct copying VERBATIM from the named source file with its location — these are stable committed references, not sibling tasks.

**Type consistency:** `WL` namespace functions are named consistently across tasks (`renderStage`, `renderStats`, `renderGrid`, `renderPills`, `cardEl`, `miniPreview`, `select`, `equip`/`equipFor`, `ownKey`, `react`, `surprise`). `cat.field` names (`coatColor`/`coatPattern`/`head`/`face`/`wings`/`effect`) match the scientist jsonb per the Explore map and are re-confirmed against `scientist.html` in Task 4.

**Open verification dependency:** several tasks say "confirm/copy exact value from `scientist.html`." This is deliberate — the new page must reproduce existing owned-item keys and persistence shapes exactly, and those are the authoritative source. The executor opens that file at those steps.
