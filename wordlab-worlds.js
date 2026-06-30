// ═══════════════════════════════════════════════════════════════
// WORD LAB — Animated Worlds (backdrop) Module
// Exposes: WLWorlds.start(id, el) / .stop(el) / .preview(id, el) / .WORLDS / .wallOf(id)
// A "world" is a contained scene panel rendered BEHIND the character.
// Gradients lifted verbatim from the Lab Shop mockup WORLDS block.
// ═══════════════════════════════════════════════════════════════
const WLWorlds = (() => {

  // ── Catalogue (single source of truth) ────────────────────────
  // drift: 'dust'|'stars'|'bubbles'|'haze'|'leaves'|'shimmer'|'sprinkles'|'embers'|'none'
  const WORLDS = {
    lab:        { name:'Lab',       cost:0,    rarity:'common', drift:'dust',
      wall:'linear-gradient(180deg,#fbf3da 0%,#f0e2ba 55%,#e6d3a0 100%)', floor:'#cba23f', grid:'rgba(120,80,20,.28)', glow:'rgba(240,200,90,.7)' },
    galaxy:     { name:'Galaxy',    cost:350,  rarity:'rare',   drift:'stars',
      wall:'radial-gradient(120% 90% at 50% 12%, #4a3a86 0%, #251a4d 50%, #120d2a 100%)', floor:'#1a1442', grid:'rgba(160,130,255,.32)', glow:'rgba(150,120,255,.75)' },
    underwater: { name:'Aquatic',   cost:350,  rarity:'rare',   drift:'bubbles',
      wall:'linear-gradient(180deg,#2bb6e0 0%,#157aaf 55%,#0a4d72 100%)', floor:'#0a3d63', grid:'rgba(190,245,255,.32)', glow:'rgba(120,220,255,.75)' },
    sunset:     { name:'Sunset',    cost:400,  rarity:'rare',   drift:'haze',
      wall:'linear-gradient(180deg,#ffc26a 0%,#ff8d6a 50%,#e8657d 100%)', floor:'#c4546b', grid:'rgba(255,255,255,.3)', glow:'rgba(255,200,120,.8)' },
    forest:     { name:'Forest',    cost:400,  rarity:'rare',   drift:'leaves',
      wall:'linear-gradient(180deg,#b6e08a 0%,#5fae46 50%,#2f7a3a 100%)', floor:'#2d6a35', grid:'rgba(255,255,255,.22)', glow:'rgba(190,240,120,.75)' },
    neon:       { name:'Neon Grid', cost:500,  rarity:'epic',   drift:'shimmer',
      wall:'linear-gradient(180deg,#241043 0%,#160a2e 55%,#0a0518 100%)', floor:'#170a30', grid:'rgba(255,60,200,.4)', glow:'rgba(255,80,210,.7)' },
    candy:      { name:'Candy',     cost:500,  rarity:'epic',   drift:'sprinkles',
      wall:'linear-gradient(180deg,#ffe0f0 0%,#ffb4dc 55%,#ff8fc4 100%)', floor:'#f08fc4', grid:'rgba(255,255,255,.45)', glow:'rgba(255,180,225,.85)' },
    volcano:    { name:'Volcano',   cost:800,  rarity:'epic',   drift:'embers',
      wall:'radial-gradient(120% 90% at 50% 18%, #7a2a18 0%, #3a120c 55%, #1a0805 100%)', floor:'#3a120c', grid:'rgba(255,120,40,.38)', glow:'rgba(255,120,40,.7)' }
  };

  // ── State / teardown (mirrors WLEffects) ──────────────────────
  const _active = new Map();
  function _state(el){ if(!_active.has(el)) _active.set(el,{panel:null,intervals:[],rafs:[]}); return _active.get(el); }
  function stop(el){
    if(!el || !_active.has(el)) return;
    const s = _active.get(el);
    s.intervals.forEach(clearInterval); s.rafs.forEach(cancelAnimationFrame);
    if(s.panel){ try{ s.panel.parentNode && s.panel.parentNode.removeChild(s.panel); }catch{} }
    _active.delete(el);
  }
  const rnd = (a,b)=>Math.random()*(b-a)+a;
  const rndInt = (a,b)=>Math.floor(rnd(a,b));
  function _calmMotion(){
    try { return (typeof WordLabData!=='undefined' && WordLabData.isLowStimMode && WordLabData.isLowStimMode())
      || window.matchMedia('(prefers-reduced-motion:reduce)').matches; } catch { return false; }
  }
  function _injectStyle(){
    if(document.getElementById('wlworlds-css')) return;
    const s=document.createElement('style'); s.id='wlworlds-css';
    s.textContent = `
      .wlworld{ position:absolute; inset:0; z-index:0; border-radius:inherit; overflow:hidden; pointer-events:none; }
      .wlworld-floor{ position:absolute; left:0; right:0; bottom:0; height:34%; }
      .wlworld-glow{ position:absolute; left:50%; bottom:18%; width:60%; height:40%; transform:translateX(-50%); border-radius:50%; filter:blur(14px); }
      @keyframes wlwDriftUp { 0%{opacity:0;transform:translateY(0)} 12%{opacity:1} 100%{opacity:0;transform:translateY(-90px)} }
      @keyframes wlwDriftDown { 0%{opacity:0;transform:translateY(-10px)} 12%{opacity:1} 100%{opacity:.2;transform:translateY(110px)} }
      @keyframes wlwTwinkle { 0%,100%{opacity:.25} 50%{opacity:1} }
      @media(prefers-reduced-motion:reduce){ .wlworld *{ animation:none !important; } }
      body.low-stim .wlworld *{ animation:none !important; }
    `;
    document.head.appendChild(s);
  }

  // ── Build the scene panel ─────────────────────────────────────
  function _buildPanel(w){
    const panel = document.createElement('div'); panel.className='wlworld'; panel.setAttribute('aria-hidden','true');
    panel.style.background = w.wall;
    const floor = document.createElement('div'); floor.className='wlworld-floor';
    floor.style.background = `linear-gradient(180deg, ${w.floor} 0%, rgba(0,0,0,.25) 100%)`;
    floor.style.backgroundImage =
      `repeating-linear-gradient(90deg, ${w.grid} 0 1px, transparent 1px 24px),`+
      `linear-gradient(180deg, ${w.floor}, rgba(0,0,0,.25))`;
    const glow = document.createElement('div'); glow.className='wlworld-glow';
    glow.style.background = `radial-gradient(circle, ${w.glow}, rgba(0,0,0,0) 70%)`;
    panel.appendChild(floor); panel.appendChild(glow);
    return panel;
  }

  // drift particle spawner per theme; returns an interval-fn or null
  function _driftSpawner(panel, theme){
    const glyphMap = { stars:['✦','·','✧'], bubbles:['○','◦','°'], leaves:['🍂','🍃'],
      sprinkles:['▪','●'], embers:['•','✦'], haze:['░'], dust:['·','•'], shimmer:['▪'] };
    const up = (theme==='bubbles'||theme==='embers'||theme==='dust'||theme==='haze');
    const colorMap = { stars:'#fff', bubbles:'rgba(200,245,255,.85)', leaves:'', sprinkles:'#fff',
      embers:'#ff8a3c', haze:'rgba(255,220,180,.5)', dust:'rgba(255,255,255,.6)', shimmer:'rgba(255,120,220,.8)' };
    if (theme==='none') return null;
    return function(){
      const p = document.createElement('div');
      const glyphs = glyphMap[theme]||['·'];
      p.textContent = glyphs[rndInt(0,glyphs.length)];
      p.style.cssText = `position:absolute;left:${rnd(3,95)}%;${up?'bottom:0':'top:0'};`+
        `font-size:${rndInt(7,15)}px;color:${colorMap[theme]||'inherit'};pointer-events:none;`+
        `animation:${theme==='stars'?'wlwTwinkle':(up?'wlwDriftUp':'wlwDriftDown')} ${rnd(2.2,4).toFixed(2)}s linear forwards;`;
      panel.appendChild(p);
      setTimeout(()=>{ try{ p.parentNode && p.parentNode.removeChild(p); }catch{} }, 4200);
    };
  }

  function _render(id, el, intense){
    stop(el);
    const w = WORLDS[id]; if(!w) return;
    _injectStyle(); _ensurePositioned(el);
    const panel = _buildPanel(w);
    el.insertBefore(panel, el.firstChild);    // behind everything else in el
    const s = _state(el); s.panel = panel;
    if (!_calmMotion()) {
      const fn = _driftSpawner(panel, w.drift);
      if (fn) { fn(); s.intervals.push(setInterval(fn, intense?260:460)); }
    }
  }
  function _ensurePositioned(el){ if(getComputedStyle(el).position==='static') el.style.position='relative'; }

  function start(id, el){ if(!el) return; _render(id, el, false); }
  function preview(id, el){ if(!el) return; _render(id, el, true); }
  function wallOf(id){ return (WORLDS[id] && WORLDS[id].wall) || 'transparent'; }

  return { start, stop, preview, WORLDS, wallOf };
})();
