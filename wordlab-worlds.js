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
      .wlworld-floor{ position:absolute; left:0; right:0; bottom:0; height:34%; z-index:1; }
      .wlworld-glow{ position:absolute; left:50%; bottom:18%; width:60%; height:40%; transform:translateX(-50%); border-radius:50%; filter:blur(14px); z-index:1; }
      .wlworld-scene{ position:absolute; inset:0; z-index:2; }
      .wlworld-scene svg{ width:100%; height:100%; display:block; }
      .wlw-sprite{ position:absolute; z-index:3; will-change:transform; }
      .wlw-sprite svg{ width:100%; height:auto; display:block; overflow:visible; }
      .wlw-swim   { left:0; animation:wlwSwim linear infinite; }
      .wlw-fall   { animation:wlwFall linear infinite; }
      .wlw-rise   { animation:wlwRise linear infinite; }
      .wlw-bob    { animation:wlwBob ease-in-out infinite; }
      .wlw-sway   { transform-origin:50% 100%; animation:wlwSway ease-in-out infinite; }
      .wlw-pulse  { animation:wlwPulse ease-in-out infinite; }
      .wlw-twinkle{ animation:wlwTwinkle ease-in-out infinite; }
      @keyframes wlwSwim { from{transform:translateX(-30%)} to{transform:translateX(130%)} }
      @keyframes wlwFall { from{transform:translateY(-15%) rotate(0deg)} to{transform:translateY(115%) rotate(var(--r,360deg))} }
      @keyframes wlwRise { 0%{transform:translateY(115%);opacity:0} 12%{opacity:1} 88%{opacity:1} 100%{transform:translateY(-15%);opacity:0} }
      @keyframes wlwBob  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7%)} }
      @keyframes wlwSway { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
      @keyframes wlwPulse{ 0%,100%{opacity:.45} 50%{opacity:1} }
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
    floor.style.backgroundImage =
      `repeating-linear-gradient(90deg, ${w.grid} 0 1px, transparent 1px 24px),`+
      `linear-gradient(180deg, ${w.floor}, rgba(0,0,0,.25))`;
    const glow = document.createElement('div'); glow.className='wlworld-glow';
    glow.style.background = `radial-gradient(circle, ${w.glow}, rgba(0,0,0,0) 70%)`;
    panel.appendChild(floor); panel.appendChild(glow);
    return panel;
  }

  // ── Scenes: static SVG props + animated sprites, per world ─────
  // anim ∈ swim|fall|rise|bob|sway|pulse|twinkle. dur/size/top/left are [min,max].
  // swim ignores left (the keyframe traverses); fall/rise/bob use left for x.
  const SCENES = {
    underwater: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<g fill="#0a3d63">'+
            '<path d="M6 100 q3-22 1-34 q5 12 7 0 q1 18-2 34Z"/>'+
            '<path d="M16 100 q2-16 0-26 q4 9 6-1 q1 16-2 27Z"/>'+
            '<path d="M88 100 q-3-26 0-40 q5 14 8 1 q1 22-3 39Z"/>'+
          '</g>'+
          '<g stroke="rgba(190,245,255,.18)" stroke-width="2" fill="none">'+
            '<line x1="30" y1="0" x2="38" y2="60"/><line x1="62" y1="0" x2="56" y2="55"/>'+
          '</g>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 24 14"><path d="M2 7 Q9 1 16 7 Q9 13 2 7Z" fill="#ffb454"/><path d="M16 7 l6-4 0 8Z" fill="#ff9a3c"/><circle cx="6" cy="6" r="1" fill="#3a2a10"/></svg>',
          n:4, anim:'swim', dur:[7,12], size:[9,15], top:[18,68], flip:true },
        { svg:'<svg viewBox="0 0 20 12"><path d="M2 6 Q8 1 14 6 Q8 11 2 6Z" fill="#7fd6ff"/><path d="M14 6 l5-3 0 6Z" fill="#5bbfe8"/></svg>',
          n:3, anim:'swim', dur:[9,15], size:[6,10], top:[30,80], flip:true },
        { svg:'<svg viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="rgba(200,245,255,.7)"/></svg>',
          n:5, anim:'rise', dur:[5,9], size:[2,4], left:[10,90] }
      ]
    }
  };

  // Place a sprite group ONCE; infinite CSS loop + negative delay spreads them out.
  function _placeSprites(panel, sp){
    for(let i=0;i<sp.n;i++){
      const wrap = document.createElement('div');
      wrap.className = 'wlw-sprite wlw-'+sp.anim;
      const dur = rnd(sp.dur[0], sp.dur[1]);
      let css = `width:${rnd(sp.size[0],sp.size[1]).toFixed(1)}%;`+
                `animation-duration:${dur.toFixed(2)}s;animation-delay:${(-rnd(0,dur)).toFixed(2)}s;`;
      if (sp.top)  css += `top:${rnd(sp.top[0],sp.top[1]).toFixed(1)}%;`;
      if (sp.left) css += `left:${rnd(sp.left[0],sp.left[1]).toFixed(1)}%;`;
      if (sp.anim==='fall') css += `--r:${rndInt(180,540)}deg;`;
      wrap.style.cssText = css;
      // Inner holder carries any static flip so it never fights the animation transform.
      const inner = document.createElement('div');
      if (sp.flip && rndInt(0,2)) inner.style.transform = 'scaleX(-1)';
      inner.innerHTML = sp.svg;
      wrap.appendChild(inner);
      panel.appendChild(wrap);
    }
  }

  // Build a world's scene into the panel. Static props always; sprites only when not calm.
  function _buildScene(panel, id, calm){
    const sc = SCENES[id];
    if(!sc) return;                       // worlds without a scene yet: gradient+floor only
    if(sc.props){
      const layer = document.createElement('div');
      layer.className = 'wlworld-scene';
      layer.innerHTML = sc.props;         // trusted, hand-authored SVG
      panel.appendChild(layer);
    }
    if(!calm && sc.sprites){ sc.sprites.forEach(sp => _placeSprites(panel, sp)); }
  }

  function _render(id, el, intense){
    stop(el);
    const w = WORLDS[id]; if(!w) return;
    _injectStyle(); _ensurePositioned(el);
    const panel = _buildPanel(w);
    el.insertBefore(panel, el.firstChild);    // behind everything else in el
    const s = _state(el); s.panel = panel;
    _buildScene(panel, id, _calmMotion());
  }
  function _ensurePositioned(el){ if(getComputedStyle(el).position==='static') el.style.position='relative'; }

  function start(id, el){ if(!el) return; _render(id, el, false); }
  function preview(id, el){ if(!el) return; _render(id, el, true); }
  function wallOf(id){ return (WORLDS[id] && WORLDS[id].wall) || 'transparent'; }

  return { start, stop, preview, WORLDS, wallOf };
})();
