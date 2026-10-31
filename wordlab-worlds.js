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
      .wlw-swim, .wlw-swim-rev { left:0; animation-timing-function:linear; animation-iteration-count:infinite; }
      .wlw-swim     { animation-name:wlwSwim; }
      .wlw-swim-rev { animation-name:wlwSwimRev; }
      .wlw-fall   { animation:wlwFall linear infinite; }
      .wlw-rise   { animation:wlwRise linear infinite; }
      .wlw-bob    { animation:wlwBob ease-in-out infinite; }
      .wlw-sway   { transform-origin:50% 100%; animation:wlwSway ease-in-out infinite; }
      .wlw-pulse  { animation:wlwPulse ease-in-out infinite; }
      .wlw-twinkle{ animation:wlwTwinkle ease-in-out infinite; }
      @keyframes wlwSwim { from{transform:translateX(-30%)} to{transform:translateX(130%)} }
      @keyframes wlwSwimRev { from{transform:translateX(130%)} to{transform:translateX(-30%)} }
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
          n:4, anim:'swim', dur:[7,12], size:[9,15], top:[18,68], flip:true, faces:'left' },
        { svg:'<svg viewBox="0 0 20 12"><path d="M2 6 Q8 1 14 6 Q8 11 2 6Z" fill="#7fd6ff"/><path d="M14 6 l5-3 0 6Z" fill="#5bbfe8"/></svg>',
          n:3, anim:'swim', dur:[9,15], size:[6,10], top:[30,80], flip:true, faces:'left' },
        { svg:'<svg viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="rgba(200,245,255,.7)"/></svg>',
          n:5, anim:'rise', dur:[5,9], size:[2,4], left:[10,90] }
      ]
    },
    forest: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<g>'+
            '<rect x="20" y="46" width="5" height="40" fill="#3a2a18"/>'+
            '<path d="M22 20 L10 52 L34 52Z M22 34 L13 60 L31 60Z" fill="#2f7a3a"/>'+
            '<rect x="70" y="40" width="6" height="46" fill="#3a2a18"/>'+
            '<path d="M73 14 L58 54 L88 54Z M73 30 L62 64 L84 64Z" fill="#357f3e"/>'+
            '<ellipse cx="46" cy="86" rx="20" ry="6" fill="#2d6a35"/>'+
          '</g>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 12 10"><path d="M6 0 C10 3 10 7 6 10 C2 7 2 3 6 0Z" fill="#e8b04a"/><path d="M6 1 V9" stroke="#a87a2a" stroke-width=".6"/></svg>',
          n:7, anim:'fall', dur:[5,9], size:[3,6], left:[6,92] },
        { svg:'<svg viewBox="0 0 12 10"><path d="M6 0 C10 3 10 7 6 10 C2 7 2 3 6 0Z" fill="#c75b39"/></svg>',
          n:4, anim:'fall', dur:[6,10], size:[3,5], left:[10,88] },
        { svg:'<svg viewBox="0 0 16 8"><path d="M1 6 Q4 2 7 5 Q10 1 15 5" stroke="#2a2a2a" stroke-width="1.4" fill="none"/></svg>',
          n:1, anim:'swim', dur:[14,18], size:[7,9], top:[12,24] }
      ]
    },
    galaxy: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<circle cx="78" cy="26" r="11" fill="#6a5acd"/>'+
          '<ellipse cx="78" cy="26" rx="18" ry="4" fill="none" stroke="rgba(180,160,255,.6)" stroke-width="1.5"/>'+
          '<circle cx="20" cy="60" r="6" fill="#8a6df0"/>'+
          '<circle cx="40" cy="18" r="3" fill="#b9a6ff"/>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 6 6"><circle cx="3" cy="3" r="1.4" fill="#fff"/></svg>',
          n:8, anim:'twinkle', dur:[2,4], size:[1.5,3], top:[5,90], left:[4,94] },
        { svg:'<svg viewBox="0 0 30 6"><path d="M0 3 H22" stroke="rgba(255,255,255,.85)" stroke-width="2" stroke-linecap="round"/><circle cx="25" cy="3" r="3" fill="#fff"/></svg>',
          n:1, anim:'swim', dur:[7,9], size:[14,18], top:[14,30] },
        { svg:'<svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="#4db8ff"/></svg>',
          n:1, anim:'bob', dur:[5,7], size:[7,9], top:[64,72], left:[55,62] }
      ]
    },
    volcano: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<path d="M28 100 L46 40 L54 40 L72 100Z" fill="#3a1a10"/>'+
          '<path d="M46 40 L54 40 L58 50 Q50 46 42 50Z" fill="#ff6a2a"/>'+
          '<path d="M0 100 L14 74 L30 100Z" fill="#2a120a"/>'+
          '<path d="M74 100 L88 70 L100 100Z" fill="#2a120a"/>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 6 6"><circle cx="3" cy="3" r="2" fill="#ff8a3c"/></svg>',
          n:7, anim:'rise', dur:[4,8], size:[1.5,3.5], left:[40,60] },
        { svg:'<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="rgba(255,120,40,.5)"/></svg>',
          n:1, anim:'pulse', dur:[2,3], size:[24,30], top:[30,36], left:[40,48] },
        { svg:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="rgba(120,120,120,.4)"/></svg>',
          n:3, anim:'rise', dur:[6,10], size:[8,14], left:[42,56] }
      ]
    },
    candy: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<g>'+
            '<rect x="14" y="40" width="7" height="50" rx="3" fill="#ff7fc0"/>'+
            '<rect x="14" y="40" width="7" height="50" rx="3" fill="url(#cstripe)" opacity=".5"/>'+
            '<rect x="80" y="48" width="7" height="42" rx="3" fill="#ff7fc0"/>'+
            '<circle cx="40" cy="86" r="8" fill="#ffd1ec"/><circle cx="58" cy="88" r="6" fill="#c8f0d8"/>'+
          '</g>'+
          '<defs><pattern id="cstripe" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="3" height="6" fill="#fff"/></pattern></defs>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 6 6"><rect width="6" height="6" rx="1.5" fill="#ff5aa0"/></svg>',
          n:5, anim:'fall', dur:[5,9], size:[2,4], left:[8,90] },
        { svg:'<svg viewBox="0 0 6 6"><rect width="6" height="6" rx="1.5" fill="#6ee7b7"/></svg>',
          n:4, anim:'fall', dur:[6,10], size:[2,4], left:[8,90] },
        { svg:'<svg viewBox="0 0 14 18"><circle cx="7" cy="6" r="6" fill="#ffb4dc"/><rect x="6.2" y="11" width="1.6" height="7" fill="#fff"/></svg>',
          n:2, anim:'bob', dur:[4,6], size:[8,11], top:[20,46], left:[30,66] }
      ]
    },
    sunset: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<circle cx="50" cy="58" r="16" fill="#ffd27a"/>'+
          '<path d="M0 78 Q30 66 56 78 Q80 88 100 76 L100 100 L0 100Z" fill="#c4546b"/>'+
          '<path d="M0 88 Q40 80 70 90 Q88 94 100 88 L100 100 L0 100Z" fill="#9c3f5a"/>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 30 12"><ellipse cx="10" cy="7" rx="9" ry="4" fill="rgba(255,255,255,.55)"/><ellipse cx="20" cy="6" rx="8" ry="4" fill="rgba(255,255,255,.5)"/></svg>',
          n:3, anim:'swim', dur:[16,26], size:[16,26], top:[14,40] },
        { svg:'<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="rgba(255,210,130,.5)"/></svg>',
          n:1, anim:'pulse', dur:[3,5], size:[30,36], top:[48,52], left:[42,46] }
      ]
    },
    neon: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<path d="M50 52 L4 100 M50 52 L96 100 M50 52 L24 100 M50 52 L76 100" stroke="rgba(255,60,200,.5)" stroke-width="1"/>'+
          '<line x1="0" y1="52" x2="100" y2="52" stroke="rgba(255,80,210,.8)" stroke-width="1.5"/>'+
          '<path d="M30 30 h40 v14 h-40Z" fill="none" stroke="#3cdcff" stroke-width="1.5" opacity=".7"/>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 10 10"><path d="M5 0 L10 5 L5 10 L0 5Z" fill="none" stroke="#ff3cc8" stroke-width="1.4"/></svg>',
          n:4, anim:'swim', dur:[8,14], size:[5,9], top:[10,44], flip:false },
        { svg:'<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.5" fill="none" stroke="#3cdcff" stroke-width="1.4"/></svg>',
          n:3, anim:'bob', dur:[3,5], size:[5,8], top:[14,42], left:[12,84] },
        { svg:'<svg viewBox="0 0 100 4"><rect width="100" height="4" fill="rgba(255,60,200,.5)"/></svg>',
          n:1, anim:'pulse', dur:[2,3], size:[100,100], top:[51,53], left:[0,0] }
      ]
    },
    lab: {
      props:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+
          '<rect x="0" y="40" width="100" height="3" fill="#cba23f" opacity=".5"/>'+
          '<g>'+
            '<path d="M18 60 l-3 22 q0 5 5 5 h8 q5 0 5-5 l-3-22Z" fill="rgba(120,220,255,.35)" stroke="#9ec9e0" stroke-width="1"/>'+
            '<rect x="20" y="56" width="8" height="5" fill="#9ec9e0"/>'+
            '<path d="M76 58 l-4 24 q0 5 5 5 h10 q5 0 5-5 l-4-24Z" fill="rgba(190,240,120,.35)" stroke="#bfe08a" stroke-width="1"/>'+
            '<rect x="78" y="54" width="9" height="5" fill="#bfe08a"/>'+
          '</g>'+
        '</svg>',
      sprites: [
        { svg:'<svg viewBox="0 0 5 5"><circle cx="2.5" cy="2.5" r="2" fill="rgba(120,220,255,.8)"/></svg>',
          n:4, anim:'rise', dur:[4,7], size:[1.5,3], left:[20,28] },
        { svg:'<svg viewBox="0 0 18 8"><circle cx="3" cy="4" r="3" fill="#7b6bff"/><circle cx="15" cy="4" r="3" fill="#3cdcff"/><line x1="6" y1="4" x2="12" y2="4" stroke="#9aa" stroke-width="1.2"/></svg>',
          n:3, anim:'swim', dur:[12,20], size:[8,12], top:[14,38] },
        { svg:'<svg viewBox="0 0 5 5"><circle cx="2.5" cy="2.5" r="2" fill="rgba(190,240,120,.8)"/></svg>',
          n:4, anim:'rise', dur:[4,7], size:[1.5,3], left:[78,87] }
      ]
    }
  };

  // Place a sprite group ONCE; infinite CSS loop + negative delay spreads them out.
  function _placeSprites(panel, sp){
    for(let i=0;i<sp.n;i++){
      const wrap = document.createElement('div');
      const dur = rnd(sp.dur[0], sp.dur[1]);
      let css = `width:${rnd(sp.size[0],sp.size[1]).toFixed(1)}%;`+
                `animation-duration:${dur.toFixed(2)}s;animation-delay:${(-rnd(0,dur)).toFixed(2)}s;`;
      if (sp.top)  css += `top:${rnd(sp.top[0],sp.top[1]).toFixed(1)}%;`;
      if (sp.left) css += `left:${rnd(sp.left[0],sp.left[1]).toFixed(1)}%;`;
      if (sp.anim==='fall') css += `--r:${rndInt(180,540)}deg;`;
      wrap.style.cssText = css;
      // Inner holder carries any static flip so it never fights the animation transform.
      const inner = document.createElement('div');
      if (sp.anim === 'swim') {
        // Travel a random direction; flip the art so its head faces the way it travels.
        // SVG art is authored facing RIGHT by default; faces:'left' marks left-drawn art (e.g. fish).
        const reverse = !!rndInt(0,2);                  // true => travels right->left
        wrap.className = 'wlw-sprite ' + (reverse ? 'wlw-swim-rev' : 'wlw-swim');
        const facesLeft = (sp.faces === 'left');
        const flip = reverse ? !facesLeft : facesLeft;  // orient head toward travel direction
        if (flip) inner.style.transform = 'scaleX(-1)';
      } else {
        wrap.className = 'wlw-sprite wlw-' + sp.anim;
      }
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
