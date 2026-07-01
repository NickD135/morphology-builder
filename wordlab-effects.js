// ═══════════════════════════════════════════════════════════════
// WORD LAB — Particle Effects Module
// Exposes: WLEffects.start(id, el) / .stop(el) / .preview(id, el)
// ═══════════════════════════════════════════════════════════════

const WLEffects = (() => {

  // ── Catalogue ─────────────────────────────────────────────────
  const EFFECTS = {
    sparkle:     { name:'Sparkle',      cost:400,  rarity:'common',    icon:'✦',  desc:'Golden stars burst around you',           color:'#f59e0b', requiresBadge:null },
    shimmer:     { name:'Shimmer',      cost:400,  rarity:'common',    icon:'🌟', desc:'A pulsing rainbow glow follows you',       color:'#6366f1', requiresBadge:null },
    bubbles:     { name:'Bubbles',      cost:450,  rarity:'common',    icon:'🫧', desc:'Soft bubbles float up from your feet',     color:'#7dd3fc', requiresBadge:null },
    starfield:   { name:'Starfield',    cost:500,  rarity:'common',    icon:'⭐', desc:'Tiny stars drift past your scientist',     color:'#c7d2fe', requiresBadge:null },
    aura:        { name:'Aura',         cost:600,  rarity:'rare',      icon:'💫', desc:'A rotating energy ring orbits you',        color:'#818cf8', requiresBadge:null },
    fire:        { name:'Fire',         cost:700,  rarity:'rare',      icon:'🔥', desc:'Flames rise from your feet',              color:'#f97316', requiresBadge:null },
    frost:       { name:'Frost',        cost:700,  rarity:'rare',      icon:'❄️', desc:'Ice crystals drift around you',           color:'#bae6fd', requiresBadge:null },
    electric:    { name:'Electric',     cost:800,  rarity:'rare',      icon:'⚡', desc:'Lightning bolts flash around you',        color:'#93c5fd', requiresBadge:null },
    rainbow:     { name:'Rainbow',      cost:900,  rarity:'rare',      icon:'🌈', desc:'A rainbow glow cycles around you',        color:'#a78bfa', requiresBadge:null },
    matrix:      { name:'Matrix',       cost:1000, rarity:'epic',      icon:'🟩', desc:'Digital rain cascades over you',          color:'#00ff41', requiresBadge:null },
    galaxy:      { name:'Galaxy',       cost:1200, rarity:'epic',      icon:'🌌', desc:'Planets orbit your scientist',            color:'#818cf8', requiresBadge:null },
    pixel:       { name:'Pixel',        cost:1200, rarity:'epic',      icon:'🎮', desc:'You dissolve into pixels and reform',     color:'#f472b6', requiresBadge:null },
    radioactive: { name:'Radioactive',  cost:1500, rarity:'epic',      icon:'☢️', desc:'Radioactive energy radiates from you',    color:'#4ade80', requiresBadge:null },
    confetti:    { name:'Confetti',     cost:350,  rarity:'common',    icon:'🎉', desc:'Colourful confetti rains down around you', color:'#f472b6', requiresBadge:null },
    divine:      { name:'Divine',       cost:0,    rarity:'legendary', icon:'✨', desc:'Golden light rays radiate behind you',    color:'#fbbf24', requiresBadge:'legend_morpheme' },
    quantum:     { name:'Quantum',      cost:0,    rarity:'legendary', icon:'🌀', desc:'You phase between dimensions',            color:'#a78bfa', requiresBadge:'legend_sessions' },
    aurora:      { name:'Aurora',       cost:0,    rarity:'epic',      icon:'🌌', desc:'Northern lights shimmer around you',      color:'#34d399', requiresBadge:'all_activities' },
    vortex:      { name:'Vortex',       cost:0,    rarity:'legendary', icon:'🌪️', desc:'A spinning vortex of energy surrounds you', color:'#818cf8', requiresBadge:'legend_streak' },
    'hearts-fx': { name:'Hearts',        cost:450,  rarity:'common', icon:'💖', desc:'Hearts float up and fade around you',     color:'#f9417f', requiresBadge:null },
    snow:        { name:'Snowfall',      cost:400,  rarity:'common', icon:'❄️', desc:'Snowflakes drift gently down',            color:'#dff4ff', requiresBadge:null },
    petals:      { name:'Cherry Petals', cost:700,  rarity:'rare',   icon:'🌸', desc:'Cherry blossom petals tumble down',       color:'#ffb7d5', requiresBadge:null },
    smoke:       { name:'Lab Smoke',     cost:700,  rarity:'rare',   icon:'💨', desc:'Soft lab smoke curls up around you',      color:'#cbd5e1', requiresBadge:null },
    lasers:      { name:'Laser Grid',    cost:1200, rarity:'epic',   icon:'🔺', desc:'A synthwave laser grid sweeps over you',  color:'#ff3cc8', requiresBadge:null },
    'quark-rain':{ name:'Quark Rain',    cost:1300, rarity:'epic',   icon:'⚛️', desc:'Colour-charged quarks rain past you',     color:'#b9a6ff', requiresBadge:null },
    blackhole:   { name:'Black Hole',    cost:2500, rarity:'legendary', icon:'🕳️', desc:'A black hole bends space around you', color:'#9b7bff', requiresBadge:null },
  };

  // ── State tracking ────────────────────────────────────────────
  const _active = new Map();

  function _state(el) {
    if (!_active.has(el)) _active.set(el, { intervals:[], rafs:[], nodes:[], styleIds:[] });
    return _active.get(el);
  }

  function _addNode(el, node) {
    return _addNodeFront(el, node);   // back-compat: un-migrated effects render in front
  }

  // ── Depth layers (behind / front of the character) ────────────
  // el is a container; the character (SVG or #sciCharWrap) is a descendant.
  // Layer z-index is computed RELATIVE to the character's z so it works on
  // both scientist.html (svg auto-z) and game pages (#sciCharWrap z-index:20).
  function _ensureLayers(el) {
    const st = _state(el);
    if (st._layers && st._layers.behind.isConnected && st._layers.front.isConnected) {
      return st._layers;
    }
    _ensureRelative(el);
    const charEl = el.querySelector('#sciCharWrap')
                || el.querySelector(':scope > svg')
                || el.querySelector('svg');
    let cz = charEl ? parseInt(getComputedStyle(charEl).zIndex, 10) : NaN;
    if (charEl && (isNaN(cz))) {
      if (getComputedStyle(charEl).position === 'static') charEl.style.position = 'relative';
      charEl.style.zIndex = '5';
      cz = 5;
      st._charZFixed = charEl;      // remember so stop() can restore
    }
    if (isNaN(cz)) cz = 5;
    const mk = (cls, z) => {
      const d = document.createElement('div');
      d.className = cls;
      d.style.cssText = `position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:${z};`;
      el.appendChild(d);
      st.nodes.push(d);
      return d;
    };
    const behind = mk('wlfx-behind', Math.max(cz - 1, 4));
    const front  = mk('wlfx-front',  cz + 1);
    st._layers = { behind, front };
    return st._layers;
  }

  function _addNodeFront(el, node) {
    _ensureLayers(el).front.appendChild(node);
    _state(el).nodes.push(node);
    return node;
  }
  function _addNodeBehind(el, node) {
    _ensureLayers(el).behind.appendChild(node);
    _state(el).nodes.push(node);
    return node;
  }
  // Alternates particles between behind and front so orbiting effects wrap the character.
  // Deterministic: counter per el resets naturally when stop() deletes state.
  function _addNodeWrap(el, node) {
    const st = _state(el);
    st._wrapN = (st._wrapN || 0) + 1;
    return (st._wrapN % 2 === 0 ? _addNodeBehind : _addNodeFront)(el, node);
  }

  function _addInterval(el, fn, ms) {
    const id = setInterval(fn, ms);
    _state(el).intervals.push(id);
    return id;
  }

  function _addRAF(el, handle) {
    _state(el).rafs.push(handle);
  }

  function _updateRAF(el, oldHandle, newHandle) {
    const rafs = _state(el).rafs;
    const i = rafs.indexOf(oldHandle);
    if (i >= 0) rafs[i] = newHandle;
    else rafs.push(newHandle);
  }

  function _injectStyle(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── Stop / cleanup ────────────────────────────────────────────
  function stop(el) {
    if (!el || !_active.has(el)) return;
    const state = _active.get(el);
    state.intervals.forEach(clearInterval);
    state.rafs.forEach(cancelAnimationFrame);
    state.nodes.forEach(n => { try { n.parentNode && n.parentNode.removeChild(n); } catch {} });
    el.style.boxShadow = '';
    el.style.filter = '';
    el.style.outline = '';
    el.style.animation = '';
    // Also clear styles applied to nested character wrap (shimmer, rainbow)
    const wrap = el.querySelector && el.querySelector('#sciCharWrap');
    if (wrap) { wrap.style.boxShadow = ''; wrap.style.animation = ''; }
    // Clean up pixel effect class
    el.classList.remove('wlfx-pixelated');
    // Restore a character z-index we set in _ensureLayers
    if (state._charZFixed) { try { state._charZFixed.style.zIndex = ''; } catch {} }
    // Layer containers are tracked in state.nodes and already removed above;
    // clear the cached handle so a fresh start rebuilds them.
    state._layers = null;
    _active.delete(el);
  }

  // ── Helpers ───────────────────────────────────────────────────
  const mobile = () => window.innerWidth < 600;
  const rnd = (min, max) => Math.random() * (max - min) + min;
  const rndInt = (min, max) => Math.floor(rnd(min, max));

  function _makeParticle(styles) {
    const d = document.createElement('div');
    d.style.cssText = `position:absolute;pointer-events:none;${styles}`;
    return d;
  }

  function _ensureRelative(el) {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  }

  // ── COMMON EFFECTS ────────────────────────────────────────────

  // sparkle — white/gold stars ✦ appear, scale up, fade
  function fxSparkle(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-sparkle', `
      @keyframes wlfxSparkle { 0%{opacity:0;transform:scale(0) rotate(0deg)} 40%{opacity:1;transform:scale(1.2) rotate(20deg)} 100%{opacity:0;transform:scale(0.4) rotate(45deg)} }
    `);
    const count = intense ? 14 : (mobile() ? 5 : 10);
    const chars = ['✦','★','✧','✶','✸'];
    const colors = ['#fbbf24','#f59e0b','#fff','#fde68a','#c7d2fe'];
    let spawned = 0;

    function spawn() {
      if (!_active.has(el)) return;
      const p = _makeParticle(`
        left:${rnd(5,90)}%;top:${rnd(5,85)}%;font-size:${rndInt(10,20)}px;
        color:${colors[rndInt(0,colors.length)]};
        animation:wlfxSparkle ${rnd(0.8,1.6).toFixed(2)}s ease forwards;
        z-index:10;
      `);
      p.textContent = chars[rndInt(0, chars.length)];
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 1700);
    }

    spawn();
    _addInterval(el, spawn, intense ? 150 : 280);
  }

  // shimmer — soft colour-cycling halo of light behind the character
  function fxShimmer(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-shimmer', `
      @keyframes wlfxShimmerHue {
        0%   { background:radial-gradient(circle,rgba(99,102,241,0.55),rgba(99,102,241,0) 68%); }
        33%  { background:radial-gradient(circle,rgba(20,184,166,0.55),rgba(20,184,166,0) 68%); }
        66%  { background:radial-gradient(circle,rgba(168,85,247,0.55),rgba(168,85,247,0) 68%); }
        100% { background:radial-gradient(circle,rgba(99,102,241,0.55),rgba(99,102,241,0) 68%); }
      }
    `);
    const halo = _makeParticle(`
      left:50%; top:50%;
      width:190px; height:230px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      filter:blur(6px);
      animation:wlfxShimmerHue ${intense ? '1.5s' : '3s'} ease infinite;
    `);
    _addNodeBehind(el, halo);
  }

  // bubbles — semi-transparent circles float up
  function fxBubbles(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-bubbles', `
      @keyframes wlfxBubbleRise {
        0%   { transform:translateY(0) translateX(0);   opacity:0.7; }
        25%  { transform:translateY(-30%) translateX(8px); }
        50%  { transform:translateY(-55%) translateX(-6px); }
        75%  { transform:translateY(-78%) translateX(6px); }
        100% { transform:translateY(-105%) translateX(0); opacity:0; }
      }
    `);
    const max = intense ? 10 : (mobile() ? 4 : 7);

    function spawnBubble() {
      if (!_active.has(el)) return;
      const sz = rndInt(8, 14);
      const p = _makeParticle(`
        bottom:${rnd(0,15)}%;left:${rnd(10,80)}%;
        width:${sz}px;height:${sz}px;border-radius:50%;
        background:radial-gradient(circle at 35% 35%,rgba(255,255,255,0.9),rgba(125,211,252,0.3));
        border:1px solid rgba(125,211,252,0.6);
        animation:wlfxBubbleRise ${rnd(2.5,4.5).toFixed(2)}s ease forwards;
        z-index:10;
      `);
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 4600);
    }

    // Spawn staggered
    for (let i = 0; i < max; i++) setTimeout(() => spawnBubble(), i * 300);
    _addInterval(el, spawnBubble, intense ? 350 : 600);
  }

  // starfield — glowing stars drift from top to bottom
  function fxStarfield(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-starfield', `
      @keyframes wlfxStarDrift {
        0%   { transform:translateY(-12px); opacity:0; }
        8%   { opacity:1; }
        88%  { opacity:0.9; }
        100% { transform:translateY(115%); opacity:0; }
      }
    `);
    const count = intense ? 45 : (mobile() ? 18 : 32);
    for (let i = 0; i < count; i++) {
      const sz = rndInt(2, 5);
      const p = _makeParticle(`
        left:${rnd(0,97)}%;top:0;
        width:${sz}px;height:${sz}px;border-radius:50%;
        background:rgba(${rndInt(190,255)},${rndInt(200,255)},255,${rnd(0.8,1).toFixed(2)});
        box-shadow:0 0 ${sz + 2}px 1px rgba(180,210,255,0.9);
        animation:wlfxStarDrift ${rnd(3,8).toFixed(1)}s linear ${rnd(0,7).toFixed(1)}s infinite;
        z-index:10;
      `);
      _addNode(el, p);
    }
  }

  // ── RARE EFFECTS ──────────────────────────────────────────────

  // aura — colour-cycling energy ring + glow, wrapping behind the character
  function fxAura(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-aura', `
      @keyframes wlfxAuraColor {
        0%   { border-color:#6366f1; }
        25%  { border-color:#0d9488; }
        50%  { border-color:#a855f7; }
        75%  { border-color:#f59e0b; }
        100% { border-color:#6366f1; }
      }
      @keyframes wlfxAuraGlow {
        0%   { background:radial-gradient(circle,rgba(99,102,241,0.5),rgba(99,102,241,0) 66%); }
        25%  { background:radial-gradient(circle,rgba(13,148,136,0.5),rgba(13,148,136,0) 66%); }
        50%  { background:radial-gradient(circle,rgba(168,85,247,0.5),rgba(168,85,247,0) 66%); }
        75%  { background:radial-gradient(circle,rgba(245,158,11,0.5),rgba(245,158,11,0) 66%); }
        100% { background:radial-gradient(circle,rgba(99,102,241,0.5),rgba(99,102,241,0) 66%); }
      }
    `);
    const glow = _makeParticle(`
      left:50%; top:50%; width:200px; height:240px;
      transform:translate(-50%,-50%); border-radius:50%; filter:blur(8px);
      animation:wlfxAuraGlow ${intense ? '1.5s' : '3s'} linear infinite;
    `);
    _addNodeBehind(el, glow);
    const ring = _makeParticle(`
      left:50%; top:50%; width:152px; height:198px;
      transform:translate(-50%,-50%); border-radius:50%;
      border:3px solid #6366f1;
      animation:wlfxAuraColor ${intense ? '1.5s' : '3s'} linear infinite;
    `);
    _addNodeBehind(el, ring);
  }

  // fire — flame particles rising from bottom
  function fxFire(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-fire', `
      @keyframes wlfxFlame {
        0%   { transform:translateY(0) scaleX(1); opacity:0.9; }
        50%  { transform:translateY(-50%) scaleX(0.7) rotate(${rndInt(-15,15)}deg); opacity:0.7; }
        100% { transform:translateY(-100%) scaleX(0.2); opacity:0; }
      }
    `);
    const max = intense ? 20 : (mobile() ? 8 : 14);

    function spawnFlame() {
      if (!_active.has(el)) return;
      const h = rndInt(14, 26);
      const p = _makeParticle(`
        bottom:${rnd(-5,8)}%;left:${rnd(15,75)}%;
        width:${rndInt(10,18)}px;height:${h}px;border-radius:50% 50% 30% 30%;
        background:linear-gradient(180deg,#fef08a,#fb923c 40%,#ef4444);
        animation:wlfxFlame ${rnd(0.9,1.8).toFixed(2)}s ease forwards;
        z-index:10;
      `);
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 1900);
    }

    for (let i = 0; i < max / 2; i++) setTimeout(() => spawnFlame(), i * 100);
    _addInterval(el, spawnFlame, intense ? 80 : 130);
  }

  // frost — snowflake/crystal shapes drifting down
  function fxFrost(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-frost', `
      @keyframes wlfxFrost {
        0%   { transform:translateY(-10px) rotate(0deg); opacity:0; }
        10%  { opacity:0.9; }
        90%  { opacity:0.5; }
        100% { transform:translateY(110%) rotate(180deg); opacity:0; }
      }
    `);
    const flakes = ['❄','✦','*','·'];
    const max = intense ? 18 : (mobile() ? 7 : 12);
    for (let i = 0; i < max; i++) {
      const p = _makeParticle(`
        left:${rnd(5,90)}%;top:0;
        font-size:${rndInt(10,18)}px;
        color:rgba(${rndInt(180,255)},${rndInt(210,255)},255,0.9);
        animation:wlfxFrost ${rnd(3,7).toFixed(1)}s linear ${rnd(0,5).toFixed(1)}s infinite;
        z-index:10;text-shadow:0 0 4px rgba(125,211,252,0.8);
      `);
      p.textContent = flakes[rndInt(0, flakes.length)];
      _addNode(el, p);
    }
  }

  // electric — lightning bolts flash with sparks and electric glow
  function fxElectric(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-electric', `
      @keyframes wlfxBolt { 0%{opacity:0} 4%{opacity:1} 14%{opacity:0.9} 22%{opacity:1} 55%{opacity:0.5} 100%{opacity:0} }
      @keyframes wlfxElecSpark { 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(0)} }
    `);

    function spawnBolt() {
      if (!_active.has(el)) return;
      const x = rnd(5, 72), y = rnd(5, 55);
      const size = rndInt(28, 58);
      const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('width', size);
      svg.setAttribute('height', size * 1.6);
      svg.style.cssText = `position:absolute;left:${x}%;top:${y}%;z-index:12;pointer-events:none;` +
        `animation:wlfxBolt 0.5s ease forwards;` +
        `filter:drop-shadow(0 0 6px #bfdbfe) drop-shadow(0 0 2px #fff);`;
      svg.innerHTML =
        `<polyline points="14,0 4,${size*0.52} 12,${size*0.52} 2,${size*1.55}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<polyline points="14,0 4,${size*0.52} 12,${size*0.52} 2,${size*1.55}" fill="none" stroke="#93c5fd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>`;
      _addNodeWrap(el, svg);
      setTimeout(() => { try { svg.parentNode && svg.parentNode.removeChild(svg); } catch {} }, 520);
    }

    function flashLightning() {
      if (!_active.has(el)) return;
      const bolts = intense ? rndInt(2, 4) : rndInt(1, 3);
      for (let i = 0; i < bolts; i++) setTimeout(() => spawnBolt(), i * 55);

      // Electric spark dots
      const sparks = rndInt(3, 7);
      for (let i = 0; i < sparks; i++) {
        const sp = _makeParticle(`
          left:${rnd(15,78)}%;top:${rnd(10,72)}%;
          width:${rndInt(3,6)}px;height:${rndInt(3,6)}px;border-radius:50%;
          background:#e0f2fe;box-shadow:0 0 5px 1px #93c5fd;
          animation:wlfxElecSpark ${rnd(0.2,0.45).toFixed(2)}s ease forwards;z-index:12;
        `);
        _addNodeWrap(el, sp);
        setTimeout(() => { try { sp.parentNode && sp.parentNode.removeChild(sp); } catch {} }, 500);
      }

      // Flash glow — behind the character so it reads as an aura, not a box border
      const flash = _makeParticle(`
        left:50%;top:50%;width:180px;height:220px;transform:translate(-50%,-50%);
        border-radius:50%;filter:blur(6px);
        background:radial-gradient(circle,rgba(147,197,253,0.7),rgba(147,197,253,0) 65%);
        transition:opacity .48s ease;`);
      _addNodeBehind(el, flash);
      setTimeout(() => { try { flash.parentNode && flash.parentNode.removeChild(flash); } catch {} }, 500);
    }

    flashLightning();
    _addInterval(el, flashLightning, intense ? 550 : rndInt(900, 1300));
  }

  // rainbow — rays of rainbow light streaming down around the scientist
  function fxRainbow(el, intense) {
    _ensureRelative(el);
    var rayCount = intense ? 10 : 7;
    var colors = [
      'rgba(239,68,68,0.7)',   // red
      'rgba(249,115,22,0.7)',  // orange
      'rgba(234,179,8,0.7)',   // yellow
      'rgba(34,197,94,0.7)',   // green
      'rgba(59,130,246,0.7)',  // blue
      'rgba(99,102,241,0.7)',  // indigo
      'rgba(168,85,247,0.7)',  // violet
      'rgba(236,72,153,0.7)',  // pink
      'rgba(20,184,166,0.7)',  // teal
      'rgba(245,158,11,0.7)',  // amber
    ];
    _injectStyle('wlfx-rainbow', `
      @keyframes wlfxRayFall {
        0%   { opacity:0; transform:translateY(-40px) scaleY(0.3); }
        15%  { opacity:1; transform:translateY(0) scaleY(1); }
        85%  { opacity:1; transform:translateY(0) scaleY(1); }
        100% { opacity:0; transform:translateY(30px) scaleY(0.5); }
      }
      @keyframes wlfxRayShimmer {
        0%, 100% { opacity:0.5; }
        50%      { opacity:1; }
      }
    `);
    // Split rays across behind/front so they wrap around the character
    var containerCSS = 'left:50%;top:0;width:160px;height:100%;transform:translateX(-50%);overflow:hidden;';
    var containerBehind = _makeParticle(containerCSS);
    var containerFront  = _makeParticle(containerCSS);
    for (var i = 0; i < rayCount; i++) {
      var ray = document.createElement('div');
      var xPos = 10 + (i / (rayCount - 1)) * 80;
      var color = colors[i % colors.length];
      var delay = (i * 0.4).toFixed(1);
      var dur = intense ? '2.5' : '4';
      ray.style.cssText = 'position:absolute;pointer-events:none;' +
        'left:' + xPos + '%;top:0;' +
        'width:3px;height:100%;' +
        'background:linear-gradient(180deg, transparent 0%, ' + color + ' 20%, ' + color + ' 80%, transparent 100%);' +
        'border-radius:2px;' +
        'animation:wlfxRayFall ' + dur + 's ease-in-out ' + delay + 's infinite, wlfxRayShimmer ' + (intense ? '1.5' : '2.5') + 's ease-in-out ' + delay + 's infinite;' +
        'filter:blur(1px);';
      (i % 2 === 0 ? containerBehind : containerFront).appendChild(ray);
    }
    _addNodeBehind(el, containerBehind);
    _addNodeFront(el, containerFront);
  }

  // ── EPIC EFFECTS ──────────────────────────────────────────────

  // matrix — canvas-based character rain
  function fxMatrix(el, intense) {
    _ensureRelative(el);
    const canvas = document.createElement('canvas');
    const w = el.offsetWidth || 160;
    const h = el.offsetHeight || 200;
    canvas.width = w; canvas.height = h;
    canvas.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:${intense?0.85:0.7};z-index:11;border-radius:inherit;`;
    _addNodeBehind(el, canvas);

    const ctx = canvas.getContext('2d');
    const charSize = 10;
    const cols = Math.floor(w / charSize);
    const drops = new Array(cols).fill(0).map(() => rndInt(0, h / charSize));
    const katakana = 'ｦｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃ0123456789ABCDEF';

    let rafHandle;
    function draw() {
      if (!_active.has(el)) { cancelAnimationFrame(rafHandle); return; }
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${charSize}px monospace`;
      const count = mobile() ? Math.ceil(cols / 2) : cols;
      for (let i = 0; i < count; i++) {
        const char = katakana[rndInt(0, katakana.length)];
        ctx.fillStyle = i % 4 === 0 ? '#a0ffa0' : '#00ff41';
        ctx.fillText(char, i * charSize, drops[i] * charSize);
        if (drops[i] * charSize > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      rafHandle = requestAnimationFrame(draw);
      _updateRAF(el, rafHandle, rafHandle);
    }
    rafHandle = requestAnimationFrame(draw);
    _addRAF(el, rafHandle);
  }

  // galaxy — planets orbiting with CSS
  function fxGalaxy(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-galaxy', `
      @keyframes wlfxOrbit1 { 0%{transform:rotate(0deg) translateX(var(--r)) rotate(0deg)} 100%{transform:rotate(360deg) translateX(var(--r)) rotate(-360deg)} }
      @keyframes wlfxOrbit2 { 0%{transform:rotate(0deg) translateX(var(--r)) rotate(0deg)} 100%{transform:rotate(-360deg) translateX(var(--r)) rotate(360deg)} }
      @keyframes wlfxOrbit3 { 0%{transform:rotate(120deg) translateX(var(--r)) rotate(-120deg)} 100%{transform:rotate(480deg) translateX(var(--r)) rotate(-480deg)} }
      @keyframes wlfxStarTwinkle { 0%,100%{opacity:0.25} 50%{opacity:1} }
      @keyframes wlfxNebula { 0%,100%{opacity:0.18} 50%{opacity:0.35} }
    `);

    // Nebula glow behind the character
    const nebula = _makeParticle(`
      left:50%; top:50%;
      width:130px; height:160px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      background:radial-gradient(ellipse at center,
        rgba(99,102,241,0.3) 0%,
        rgba(168,85,247,0.18) 45%,
        transparent 72%);
      animation:wlfxNebula 3s ease infinite;
      z-index:8;
    `);
    _addNodeBehind(el, nebula);

    // More stars, brighter
    for (let i = 0; i < 28; i++) {
      const sz = rndInt(1, 3);
      const star = _makeParticle(`
        left:${rnd(5,95)}%;top:${rnd(5,95)}%;
        width:${sz}px;height:${sz}px;border-radius:50%;
        background:rgba(${rndInt(200,255)},${rndInt(200,255)},255,${rnd(0.6,1).toFixed(2)});
        box-shadow:0 0 3px rgba(200,210,255,0.9);
        animation:wlfxStarTwinkle ${rnd(1,3).toFixed(1)}s ease ${rnd(0,2.5).toFixed(1)}s infinite;
        z-index:8;
      `);
      _addNodeFront(el, star);
    }

    // Planets use PIXEL radii — % on a zero-size element resolves to 0px
    const planets = [
      { color:'#f97316', sz:10, r:'50px', dur:intense?'2.5s':'5s',   anim:'wlfxOrbit1' },
      { color:'#6366f1', sz:7,  r:'68px', dur:intense?'3.5s':'7s',   anim:'wlfxOrbit2' },
      { color:'#14b8a6', sz:6,  r:'38px', dur:intense?'1.8s':'3.5s', anim:'wlfxOrbit3' },
      { color:'#fbbf24', sz:5,  r:'82px', dur:intense?'4.5s':'9s',   anim:'wlfxOrbit1' },
      { color:'#f472b6', sz:4,  r:'56px', dur:intense?'2s':'4s',     anim:'wlfxOrbit2' },
    ];

    planets.forEach(p => {
      const orbit = _makeParticle(`
        left:50%;top:50%;width:0;height:0;z-index:9;
        --r:${p.r};
        animation:${p.anim} ${p.dur} linear infinite;
      `);
      const dot = _makeParticle(`
        width:${p.sz}px;height:${p.sz}px;border-radius:50%;
        background:radial-gradient(circle at 30% 30%,rgba(255,255,255,0.9),${p.color});
        box-shadow:0 0 8px 2px ${p.color};
        transform:translate(-50%,-50%);
      `);
      orbit.appendChild(dot);
      _addNodeWrap(el, orbit);
    });
  }

  // pixel — pixelates the scientist character using an inline SVG filter
  function fxPixel(el, intense) {
    _ensureRelative(el);
    var pixelSize = intense ? 5 : 8;

    // Create a hidden SVG with a pixelation filter if not already present
    var filterId = 'wlfxPixelFilter' + pixelSize;
    if (!document.getElementById(filterId)) {
      var svgNS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('width', '0');
      svg.setAttribute('height', '0');
      svg.style.cssText = 'position:absolute;pointer-events:none;';
      var defs = document.createElementNS(svgNS, 'defs');
      var filter = document.createElementNS(svgNS, 'filter');
      filter.setAttribute('id', filterId);
      // Pixelation via mosaic: blur then sharpen with displacement
      var feFlood = document.createElementNS(svgNS, 'feGaussianBlur');
      feFlood.setAttribute('in', 'SourceGraphic');
      feFlood.setAttribute('stdDeviation', String(pixelSize));
      feFlood.setAttribute('result', 'blur');
      var feMorph = document.createElementNS(svgNS, 'feMorphology');
      feMorph.setAttribute('in', 'blur');
      feMorph.setAttribute('operator', 'dilate');
      feMorph.setAttribute('radius', String(Math.round(pixelSize * 0.6)));
      feMorph.setAttribute('result', 'chunky');
      var feComp = document.createElementNS(svgNS, 'feComponentTransfer');
      feComp.setAttribute('in', 'chunky');
      var feFuncA = document.createElementNS(svgNS, 'feFuncA');
      feFuncA.setAttribute('type', 'discrete');
      feFuncA.setAttribute('tableValues', '0 1');
      feComp.appendChild(feFuncA);
      filter.appendChild(feFlood);
      filter.appendChild(feMorph);
      filter.appendChild(feComp);
      defs.appendChild(filter);
      svg.appendChild(defs);
      document.body.appendChild(svg);
    }

    _injectStyle('wlfx-pixel', `
      @keyframes wlfxPixelPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.92; }
      }
      .wlfx-pixelated {
        filter: url(#${filterId}) !important;
        image-rendering: pixelated !important;
        -webkit-filter: url(#${filterId}) !important;
      }
    `);

    // Apply the filter directly to the character element
    el.classList.add('wlfx-pixelated');
    el.style.animation = 'wlfxPixelPulse ' + (intense ? '1.5s' : '3s') + ' ease-in-out infinite';

    // Spawn coloured pixel particles around edges for extra visual flair
    var colors = ['#f472b6','#818cf8','#34d399','#fbbf24','#f97316','#60a5fa','#a78bfa','#fb7185'];
    function spawnPixel() {
      if (!_active.has(el)) return;
      var w = el.offsetWidth, h = el.offsetHeight;
      var edge = rndInt(0, 4);
      var x, y;
      if (edge===0) { x=rnd(10,w-10); y=rnd(-6,6); }
      else if (edge===1) { x=rnd(w-6,w); y=rnd(10,h-10); }
      else if (edge===2) { x=rnd(10,w-10); y=rnd(h-6,h); }
      else { x=rnd(-6,6); y=rnd(10,h-10); }
      var size = rndInt(4,8);
      var p = _makeParticle(
        'left:' + x + 'px;top:' + y + 'px;' +
        'width:' + size + 'px;height:' + size + 'px;' +
        'background:' + colors[rndInt(0,colors.length)] + ';' +
        'opacity:0;z-index:10;' +
        'animation:wlfxPixelPop ' + rnd(0.6,1.2).toFixed(2) + 's ease forwards;'
      );
      _addNodeWrap(el, p);
      setTimeout(function() { try { p.parentNode && p.parentNode.removeChild(p); } catch(e) {} }, 1300);
    }

    _injectStyle('wlfx-pixel-pop', `
      @keyframes wlfxPixelPop {
        0% { opacity:0; transform:scale(0); }
        30% { opacity:1; transform:scale(1.2); }
        70% { opacity:0.8; transform:scale(1); }
        100% { opacity:0; transform:scale(0.5); }
      }
    `);

    _addInterval(el, spawnPixel, intense ? 120 : 250);
  }

  // radioactive — green glow, floating particles, ☢ symbol
  function fxRadioactive(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-radioactive', `
      @keyframes wlfxGreenHalo {
        0%,100% { opacity:0.6; }
        50%     { opacity:1; }
      }
      @keyframes wlfxParticleFly {
        0%   { transform:translate(0,0); opacity:0.9; }
        100% { transform:translate(var(--dx),var(--dy)); opacity:0; }
      }
      @keyframes wlfxRadSymbol { 0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)} 20%{opacity:1;transform:translate(-50%,-50%) scale(1.2)} 80%{opacity:0.7} 100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)} }
    `);
    // Green pulsing halo — behind the character (replaces box-shadow keyframes on el)
    const radHalo = _makeParticle(`
      left:50%;top:50%;width:200px;height:240px;
      transform:translate(-50%,-50%);border-radius:50%;filter:blur(12px);
      background:radial-gradient(circle,rgba(74,222,128,0.7) 0%,rgba(74,222,128,0) 65%);
      animation:wlfxGreenHalo ${intense?'1s':'2s'} ease infinite;
    `);
    _addNodeBehind(el, radHalo);

    function spawnParticle() {
      if (!_active.has(el)) return;
      const angle = rnd(0, 360) * Math.PI / 180;
      const dist = rnd(40, 80);
      const p = _makeParticle(`
        left:50%;top:50%;
        width:5px;height:5px;border-radius:50%;
        background:#4ade80;box-shadow:0 0 4px #4ade80;
        --dx:${(Math.cos(angle)*dist).toFixed(0)}px;
        --dy:${(Math.sin(angle)*dist).toFixed(0)}px;
        animation:wlfxParticleFly ${rnd(1.2,2.2).toFixed(2)}s ease forwards;
        z-index:10;
      `);
      _addNodeWrap(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 2300);
    }

    _addInterval(el, spawnParticle, intense ? 200 : 400);

    // ☢ symbol flash
    _addInterval(el, () => {
      if (!_active.has(el)) return;
      const sym = _makeParticle(`
        left:${rnd(20,70)}%;top:${rnd(15,65)}%;font-size:${rndInt(16,28)}px;
        color:rgba(74,222,128,0.9);text-shadow:0 0 8px #4ade80;
        animation:wlfxRadSymbol 1.5s ease forwards;z-index:12;
      `);
      sym.textContent = '☢';
      _addNodeWrap(el, sym);
      setTimeout(() => { try { sym.parentNode && sym.parentNode.removeChild(sym); } catch {} }, 1600);
    }, intense ? 1500 : 3000);
  }

  // ── LEGENDARY EFFECTS ─────────────────────────────────────────

  // divine — rotating golden rays + golden sparkles + warm halo behind
  function fxDivine(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-divine', `
      @keyframes wlfxRayRot { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      @keyframes wlfxGoldHalo {
        0%,100% { background:radial-gradient(circle,rgba(251,191,36,0.5),rgba(251,191,36,0) 66%); }
        50%     { background:radial-gradient(circle,rgba(251,191,36,0.8),rgba(251,191,36,0) 66%); }
      }
      @keyframes wlfxGoldSpark { 0%{opacity:0;transform:translateY(0)} 20%{opacity:1} 100%{opacity:0;transform:translateY(-60px)} }
    `);

    // Behind-layer halo (replaces the box-shadow glow on el)
    const halo = _makeParticle(`
      left:50%; top:50%; width:200px; height:240px;
      transform:translate(-50%,-50%); border-radius:50%; filter:blur(8px);
      animation:wlfxGoldHalo ${intense?'1.5s':'3s'} ease infinite;
    `);
    _addNodeBehind(el, halo);

    // Rays — behind the character
    const rays = _makeParticle(`
      inset:-20px;border-radius:inherit;
      background:conic-gradient(
        from 0deg,transparent 0deg,rgba(251,191,36,0.22) 10deg,transparent 22deg,
        transparent 45deg,rgba(251,191,36,0.22) 55deg,transparent 67deg,
        transparent 90deg,rgba(251,191,36,0.22) 100deg,transparent 112deg,
        transparent 135deg,rgba(251,191,36,0.22) 145deg,transparent 157deg,
        transparent 180deg,rgba(251,191,36,0.22) 190deg,transparent 202deg,
        transparent 225deg,rgba(251,191,36,0.22) 235deg,transparent 247deg,
        transparent 270deg,rgba(251,191,36,0.22) 280deg,transparent 292deg,
        transparent 315deg,rgba(251,191,36,0.22) 325deg,transparent 337deg,
        transparent 360deg
      );
      animation:wlfxRayRot ${intense?'6s':'12s'} linear infinite;
    `);
    _addNodeBehind(el, rays);

    // Gold sparkles float upward — in front of the character
    function spawnSpark() {
      if (!_active.has(el)) return;
      const p = _makeParticle(`
        left:${rnd(10,85)}%;bottom:${rnd(0,30)}%;
        font-size:${rndInt(8,16)}px;color:#fbbf24;
        text-shadow:0 0 8px #f59e0b;
        animation:wlfxGoldSpark ${rnd(1.5,2.8).toFixed(2)}s ease forwards;z-index:12;
      `);
      p.textContent = ['✦','★','✧','✸'][rndInt(0,4)];
      _addNodeFront(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 2900);
    }
    _addInterval(el, spawnSpark, intense ? 200 : 450);
  }

  // quantum — dimensional phasing: chromatic aberration, behind-layer halo, portal rings, particle bursts, flicker
  function fxQuantum(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-quantum', `
      @keyframes wlfxFlicker { 0%{opacity:1} 10%{opacity:0} 20%{opacity:1} 30%{opacity:0.15} 40%{opacity:1} 50%{opacity:0} 60%{opacity:0.85} 70%{opacity:1} 100%{opacity:1} }
      @keyframes wlfxPortal { 0%{transform:translate(-50%,-50%) scale(1.5);opacity:0} 20%{opacity:0.9} 80%{opacity:0.6} 100%{transform:translate(-50%,-50%) scale(0.05);opacity:0} }
      @keyframes wlfxQuantumHalo {
        0%,100% { background:radial-gradient(circle,rgba(167,139,250,0.6),rgba(167,139,250,0) 66%); }
        50%     { background:radial-gradient(circle,rgba(99,102,241,0.8),rgba(99,102,241,0) 66%); }
      }
      @keyframes wlfxQPart { 0%{opacity:0;transform:translate(-50%,-50%)} 15%{opacity:1} 100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy)))} }
    `);

    // Strong chromatic aberration filter (not a glow — intentionally kept on el)
    el.style.filter = `drop-shadow(3px 0 4px rgba(239,68,68,0.65)) drop-shadow(-3px 0 4px rgba(99,102,241,0.65)) drop-shadow(0 0 10px rgba(167,139,250,0.55))`;

    // Behind-layer halo (replaces the wlfxDimension box-shadow oval)
    const halo = _makeParticle(`
      left:50%; top:50%;
      width:200px; height:240px;
      transform:translate(-50%,-50%);
      border-radius:50%; filter:blur(8px);
      animation:wlfxQuantumHalo ${intense ? '1.5s' : '2.5s'} ease infinite;
    `);
    _addNodeBehind(el, halo);

    // Dimensional flicker (opacity only — not a box-shadow; interval fires after assertion time)
    _addInterval(el, () => {
      if (!_active.has(el)) return;
      el.style.animation = 'wlfxFlicker 0.55s ease';
      setTimeout(() => { if (_active.has(el)) el.style.animation = ''; }, 650);
    }, intense ? 1800 : rndInt(2800, 4500));

    // Portal rings — front layer
    _addInterval(el, () => {
      if (!_active.has(el)) return;
      const sz = rndInt(40, 75);
      const ring = _makeParticle(`
        left:${rnd(25,65)}%;top:${rnd(25,65)}%;
        width:${sz}px;height:${sz}px;
        border-radius:50%;
        border:2px solid rgba(167,139,250,0.9);
        box-shadow:0 0 14px 3px rgba(167,139,250,0.65);
        animation:wlfxPortal 1.0s ease forwards;z-index:12;
      `);
      _addNodeFront(el, ring);
      setTimeout(() => { try { ring.parentNode && ring.parentNode.removeChild(ring); } catch {} }, 1100);
    }, intense ? 550 : 1200);

    // Dimensional particle burst — front layer
    _addInterval(el, () => {
      if (!_active.has(el)) return;
      const n = rndInt(3, 5);
      for (let i = 0; i < n; i++) {
        const angle = rnd(0, 360) * Math.PI / 180;
        const dist = rndInt(45, 85);
        const colors = ['#a78bfa','#818cf8','#c4b5fd','#e0e7ff','#7c3aed'];
        const p = _makeParticle(`
          left:50%; top:50%;
          width:${rndInt(3,6)}px; height:${rndInt(3,6)}px; border-radius:50%;
          background:${colors[rndInt(0,colors.length)]};
          box-shadow:0 0 6px 1px rgba(167,139,250,0.9);
          --dx:${(Math.cos(angle)*dist).toFixed(0)}px;
          --dy:${(Math.sin(angle)*dist).toFixed(0)}px;
          animation:wlfxQPart ${rnd(0.7,1.4).toFixed(2)}s ease forwards;z-index:12;
        `);
        _addNodeFront(el, p);
        setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 1500);
      }
    }, intense ? 280 : 550);
  }

  // confetti — coloured paper rectangles tumble down
  function fxConfetti(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-confetti', `
      @keyframes wlfxConfettiFall {
        0%   { transform:translateY(-12px) rotate(0deg);   opacity:1; }
        80%  { opacity:0.9; }
        100% { transform:translateY(115%) rotate(720deg); opacity:0; }
      }
    `);
    const colors = ['#f472b6','#fb923c','#facc15','#4ade80','#60a5fa','#a78bfa','#f87171','#34d399'];
    const max = intense ? 30 : (mobile() ? 12 : 20);
    for (let i = 0; i < max; i++) {
      const w = rndInt(5, 10), h = rndInt(3, 6);
      const p = _makeParticle(`
        left:${rnd(2,92)}%;top:${rnd(-5,10)}%;
        width:${w}px;height:${h}px;border-radius:1px;
        background:${colors[rndInt(0,colors.length)]};
        animation:wlfxConfettiFall ${rnd(2.5,5).toFixed(1)}s linear ${rnd(0,3).toFixed(1)}s infinite;
        z-index:10;
      `);
      _addNode(el, p);
    }
  }

  // aurora — undulating green/teal/blue waves behind the character
  function fxAurora(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-aurora', `
      @keyframes wlfxAuroraWave {
        0%   { transform:translate(-50%,-50%) scaleX(1)   scaleY(1);   opacity:0.45; filter:hue-rotate(0deg); }
        33%  { transform:translate(-50%,-50%) scaleX(1.1) scaleY(0.92); opacity:0.6;  filter:hue-rotate(40deg); }
        66%  { transform:translate(-50%,-50%) scaleX(0.92) scaleY(1.1); opacity:0.5;  filter:hue-rotate(-30deg); }
        100% { transform:translate(-50%,-50%) scaleX(1)   scaleY(1);   opacity:0.45; filter:hue-rotate(0deg); }
      }
      @keyframes wlfxAuroraWave2 {
        0%   { transform:translate(-50%,-50%) scaleX(0.9)  scaleY(1.1);  opacity:0.35; filter:hue-rotate(60deg); }
        50%  { transform:translate(-50%,-50%) scaleX(1.12) scaleY(0.88); opacity:0.55; filter:hue-rotate(120deg); }
        100% { transform:translate(-50%,-50%) scaleX(0.9)  scaleY(1.1);  opacity:0.35; filter:hue-rotate(60deg); }
      }
    `);
    // Outer aurora glow
    const blob1 = _makeParticle(`
      left:50%; top:50%;
      width:180px; height:220px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      background:radial-gradient(ellipse at center,
        rgba(52,211,153,0.55) 0%,
        rgba(16,185,129,0.3) 35%,
        rgba(56,189,248,0.2) 60%,
        transparent 80%);
      animation:wlfxAuroraWave ${intense?'2s':'4s'} ease infinite;
      z-index:7;
    `);
    const blob2 = _makeParticle(`
      left:50%; top:42%;
      width:140px; height:170px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      background:radial-gradient(ellipse at center,
        rgba(20,184,166,0.4) 0%,
        rgba(99,102,241,0.25) 45%,
        transparent 75%);
      animation:wlfxAuroraWave2 ${intense?'2.5s':'5s'} ease infinite;
      z-index:7;
    `);
    _addNodeBehind(el, blob1);
    _addNodeBehind(el, blob2);
    // Drifting light ribbons
    _injectStyle('wlfx-aurora-ribbon', `
      @keyframes wlfxRibbon { 0%{opacity:0;transform:translateY(0) scaleX(1)} 30%{opacity:0.7} 70%{opacity:0.5} 100%{opacity:0;transform:translateY(-80px) scaleX(1.4)} }
    `);
    function spawnRibbon() {
      if (!_active.has(el)) return;
      const p = _makeParticle(`
        left:${rnd(10,70)}%;bottom:${rnd(10,40)}%;
        width:${rndInt(20,45)}px;height:${rndInt(2,4)}px;
        border-radius:999px;
        background:linear-gradient(90deg,transparent,rgba(52,211,153,0.8),rgba(56,189,248,0.6),transparent);
        animation:wlfxRibbon ${rnd(2,3.5).toFixed(1)}s ease forwards;z-index:9;
      `);
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 3600);
    }
    for (let i = 0; i < 3; i++) setTimeout(() => spawnRibbon(), i * 600);
    _addInterval(el, spawnRibbon, intense ? 600 : 1100);
  }

  // vortex — spinning orbital particles forming a vortex funnel, wrapping behind and in front
  function fxVortex(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-vortex', `
      @keyframes wlfxVortexSpin  { 0%{transform:rotate(0deg)   translateX(var(--r)) rotate(0deg)}   100%{transform:rotate(360deg)  translateX(var(--r)) rotate(-360deg)} }
      @keyframes wlfxVortexSpinR { 0%{transform:rotate(0deg)   translateX(var(--r)) rotate(0deg)}   100%{transform:rotate(-360deg) translateX(var(--r)) rotate(360deg)} }
      @keyframes wlfxVortexHalo  {
        0%,100% { background:radial-gradient(circle,rgba(129,140,248,0.6),rgba(129,140,248,0) 66%); }
        50%     { background:radial-gradient(circle,rgba(167,139,250,0.85),rgba(167,139,250,0) 66%); }
      }
      @keyframes wlfxVortexPull  { 0%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(1.5)} 20%{opacity:0.9} 100%{opacity:0;transform:translate(0,0) scale(0.2)} }
    `);

    // Behind-layer halo (replaces the wlfxVortexCore box-shadow animation)
    const halo = _makeParticle(`
      left:50%; top:50%; width:200px; height:240px;
      transform:translate(-50%,-50%); border-radius:50%; filter:blur(8px);
      animation:wlfxVortexHalo ${intense?'1s':'2s'} ease infinite;
    `);
    _addNodeBehind(el, halo);

    // Core energy ball — front layer, static glow (no box-shadow animation)
    const core = _makeParticle(`
      left:50%; top:50%;
      width:18px; height:18px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      background:radial-gradient(circle,#e0e7ff,#818cf8);
      box-shadow:0 0 14px 5px rgba(129,140,248,0.7);
      z-index:13;
    `);
    _addNodeFront(el, core);

    // Orbital rings — alternating behind (even index) / front (odd index) so the vortex wraps
    const rings = [
      {r:'30px', dur:intense?'0.9s':'1.8s',  anim:'wlfxVortexSpin',  color:'#818cf8', sz:5},
      {r:'50px', dur:intense?'1.4s':'2.8s',  anim:'wlfxVortexSpinR', color:'#a78bfa', sz:4},
      {r:'68px', dur:intense?'2s':'4s',       anim:'wlfxVortexSpin',  color:'#6366f1', sz:3},
      {r:'40px', dur:intense?'1.1s':'2.2s',  anim:'wlfxVortexSpinR', color:'#c4b5fd', sz:3},
      {r:'58px', dur:intense?'1.7s':'3.4s',  anim:'wlfxVortexSpin',  color:'#7c3aed', sz:4},
    ];
    rings.forEach((ring, i) => {
      const orbit = _makeParticle(`
        left:50%;top:50%;width:0;height:0;z-index:10;
        --r:${ring.r};
        animation:${ring.anim} ${ring.dur} linear infinite;
        animation-delay:${(i*0.18).toFixed(2)}s;
      `);
      const dot = _makeParticle(`
        width:${ring.sz}px;height:${ring.sz}px;border-radius:50%;
        background:${ring.color};
        box-shadow:0 0 6px 2px ${ring.color};
        transform:translate(-50%,-50%);
      `);
      orbit.appendChild(dot);
      if (i % 2 === 0) {
        _addNodeBehind(el, orbit);
      } else {
        _addNodeFront(el, orbit);
      }
    });

    // Occasional particle pull-in streaks — front layer
    function spawnPull() {
      if (!_active.has(el)) return;
      const angle = rnd(0, 360) * Math.PI / 180;
      const dist = rnd(55, 90);
      const p = _makeParticle(`
        left:50%;top:50%;
        width:${rndInt(3,5)}px;height:${rndInt(3,5)}px;border-radius:50%;
        background:#c4b5fd;box-shadow:0 0 6px 2px rgba(167,139,250,0.8);
        --sx:${(Math.cos(angle)*dist).toFixed(0)}px;
        --sy:${(Math.sin(angle)*dist).toFixed(0)}px;
        animation:wlfxVortexPull ${rnd(0.6,1.1).toFixed(2)}s ease forwards;z-index:12;
      `);
      _addNodeFront(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 1200);
    }
    for (let i = 0; i < 4; i++) setTimeout(() => spawnPull(), i * 200);
    _addInterval(el, spawnPull, intense ? 180 : 350);
  }

  // hearts-fx — pink hearts rise from the feet and fade
  function fxHearts(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-hearts', `
      @keyframes wlfxHeartRise { 0%{opacity:0;transform:translateY(0) scale(.5)} 15%{opacity:1} 100%{opacity:0;transform:translateY(-90px) scale(1.1)} }
    `);
    function spawn() {
      if (!_active.has(el)) return;
      const p = _makeParticle(`
        left:${rnd(15,80)}%;bottom:${rnd(0,18)}%;font-size:${rndInt(12,22)}px;
        animation:wlfxHeartRise ${rnd(1.8,3.0).toFixed(2)}s ease forwards;z-index:11;`);
      p.textContent = ['💖','💗','💕','❤️'][rndInt(0,4)];
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 3100);
    }
    spawn();
    _addInterval(el, spawn, intense ? 240 : 460);
  }

  // snow — white flakes fall with a horizontal sway
  function fxSnow(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-snow', `
      @keyframes wlfxSnowFall { 0%{opacity:0;transform:translate(0,-10px)} 12%{opacity:1} 100%{opacity:.2;transform:translate(var(--sx,10px),130px)} }
    `);
    function spawn() {
      if (!_active.has(el)) return;
      const p = _makeParticle(`
        left:${rnd(2,95)}%;top:0;font-size:${rndInt(8,16)}px;color:#eaf6ff;
        text-shadow:0 0 5px rgba(190,235,255,.8);
        --sx:${rnd(-22,22).toFixed(0)}px;
        animation:wlfxSnowFall ${rnd(2.6,4.4).toFixed(2)}s linear forwards;z-index:10;`);
      p.textContent = ['❄','❅','❆','•'][rndInt(0,4)];
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 4600);
    }
    spawn();
    _addInterval(el, spawn, intense ? 130 : 240);
  }

  // petals — cherry blossom petals tumble (rotate) as they fall
  function fxPetals(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-petals', `
      @keyframes wlfxPetalFall { 0%{opacity:0;transform:translate(0,-10px) rotate(0deg)} 12%{opacity:1} 100%{opacity:.25;transform:translate(var(--px,18px),130px) rotate(var(--pr,320deg))} }
    `);
    function spawn() {
      if (!_active.has(el)) return;
      const p = _makeParticle(`
        left:${rnd(2,95)}%;top:0;font-size:${rndInt(11,18)}px;
        --px:${rnd(-30,30).toFixed(0)}px;--pr:${rndInt(200,520)}deg;
        animation:wlfxPetalFall ${rnd(2.8,4.6).toFixed(2)}s linear forwards;z-index:10;`);
      p.textContent = ['🌸','🌸','🌺','🏵️'][rndInt(0,4)];
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 4800);
    }
    spawn();
    _addInterval(el, spawn, intense ? 200 : 360);
  }

  // smoke — soft grey plumes rise, expand, and dissipate
  function fxSmoke(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-smoke', `
      @keyframes wlfxSmokeRise { 0%{opacity:0;transform:translateY(0) scale(.4)} 25%{opacity:.5} 100%{opacity:0;transform:translateY(-80px) scale(1.8)} }
    `);
    function spawn() {
      if (!_active.has(el)) return;
      const size = rndInt(14, 30);
      const p = _makeParticle(`
        left:${rnd(25,70)}%;bottom:${rnd(0,15)}%;width:${size}px;height:${size}px;
        border-radius:50%;background:radial-gradient(circle,rgba(203,213,225,.55),rgba(148,163,184,0) 70%);
        animation:wlfxSmokeRise ${rnd(2.4,3.8).toFixed(2)}s ease-out forwards;z-index:9;`);
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 4000);
    }
    spawn();
    _addInterval(el, spawn, intense ? 260 : 440);
  }

  // lasers — synthwave targeting scene: scrolling perspective grid + vertical
  // scan-line + firing diagonal beams + impact sparks + magenta/cyan rim glow.
  function fxLasers(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-lasers', `
      @keyframes wlfxGridScroll { 0%{background-position:0 0} 100%{background-position:0 26px} }
      @keyframes wlfxScan { 0%{top:-8%;opacity:0} 8%{opacity:1} 92%{opacity:1} 100%{top:104%;opacity:0} }
      @keyframes wlfxBeam { 0%{opacity:0;transform:scaleX(0)} 12%{opacity:1;transform:scaleX(1)} 70%{opacity:.5} 100%{opacity:0} }
      @keyframes wlfxSpark { 0%{opacity:1;transform:scale(.3)} 100%{opacity:0;transform:scale(1.6)} }
    `);
    el.style.filter = 'drop-shadow(2px 0 4px rgba(255,60,200,.55)) drop-shadow(-2px 0 4px rgba(60,220,255,.55))';

    // Perspective grid panel behind the character
    const grid = _makeParticle(`
      inset:0;z-index:6;border-radius:inherit;opacity:.55;
      background-image:
        linear-gradient(rgba(255,60,200,.35) 1px,transparent 1px),
        linear-gradient(90deg,rgba(60,220,255,.30) 1px,transparent 1px);
      background-size:26px 26px;
      animation:wlfxGridScroll ${intense?'0.7s':'1.3s'} linear infinite;`);
    _addNodeBehind(el, grid);

    // Vertical scan-line that sweeps over the character
    const scan = _makeParticle(`
      left:0;width:100%;height:7px;z-index:12;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent);
      box-shadow:0 0 12px 3px rgba(255,60,200,.7);
      animation:wlfxScan ${intense?'1.6s':'2.6s'} linear infinite;`);
    _addNodeFront(el, scan);

    // Periodic firing diagonal beams + impact spark
    function fireBeam() {
      if (!_active.has(el)) return;
      const y = rnd(15, 80), len = rnd(40, 90), ang = rnd(-35, 35);
      const beam = _makeParticle(`
        left:5%;top:${y}%;width:${len}%;height:2px;z-index:11;transform-origin:left center;
        transform:rotate(${ang}deg);
        background:linear-gradient(90deg,rgba(255,255,255,.95),${rndInt(0,2)?'#ff3cc8':'#3cdcff'});
        box-shadow:0 0 8px 1px rgba(255,60,200,.8);
        animation:wlfxBeam ${rnd(0.4,0.7).toFixed(2)}s ease-out forwards;`);
      _addNodeFront(el, beam);
      const spark = _makeParticle(`
        left:${5+len*Math.cos(ang*Math.PI/180)}%;top:${y+len*Math.sin(ang*Math.PI/180)*0.6}%;
        width:10px;height:10px;border-radius:50%;z-index:12;
        background:radial-gradient(circle,#fff,rgba(255,60,200,0) 70%);
        animation:wlfxSpark .4s ease-out forwards;`);
      _addNodeFront(el, spark);
      setTimeout(() => { [beam,spark].forEach(n=>{ try{ n.parentNode&&n.parentNode.removeChild(n);}catch{} }); }, 750);
    }
    _addInterval(el, fireBeam, intense ? 320 : 620);
  }

  // quark-rain — depth-layered particle shower in the 3 colour-charge hues,
  // with motion-blur streaks, occasional heavy particles that splash, and a
  // faint collision flash.
  function fxQuarkRain(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-quarkrain', `
      @keyframes wlfxQFall { 0%{opacity:0;transform:translateY(-12px)} 10%{opacity:1} 100%{opacity:.15;transform:translateY(132px)} }
      @keyframes wlfxQSplash { 0%{opacity:1;transform:translate(-50%,0) scale(.4)} 100%{opacity:0;transform:translate(-50%,-8px) scale(1.5)} }
      @keyframes wlfxQFlash { 0%,100%{opacity:0} 50%{opacity:.7} }
    `);
    const HUES = ['#ff4d6d', '#4dff88', '#4db8ff'];

    function spawn() {
      if (!_active.has(el)) return;
      const fg = rndInt(0, 3) === 0;              // ~1/3 foreground
      const hue = HUES[rndInt(0, 3)];
      const size = fg ? rndInt(13, 20) : rndInt(7, 11);
      const dur = fg ? rnd(1.0, 1.5) : rnd(1.6, 2.4);
      const p = _makeParticle(`
        left:${rnd(3,95)}%;top:0;font-size:${size}px;color:${hue};
        opacity:${fg?1:0.6};
        text-shadow:0 -6px 6px ${hue},0 0 8px ${hue};
        animation:wlfxQFall ${dur.toFixed(2)}s linear forwards;z-index:${fg?12:8};`);
      p.textContent = rndInt(0,2) ? '⚛' : '•';
      _addNodeWrap(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, dur*1000+200);
    }

    // Heavy particle: falls slower, trailing tail, splashes at the floor line
    function spawnHeavy() {
      if (!_active.has(el)) return;
      const hue = HUES[rndInt(0, 3)], x = rnd(15, 85);
      const p = _makeParticle(`
        left:${x}%;top:0;font-size:22px;color:${hue};z-index:13;
        text-shadow:0 -10px 10px ${hue},0 0 14px ${hue};
        animation:wlfxQFall 2.2s ease-in forwards;`);
      p.textContent = '⚛';
      _addNodeWrap(el, p);
      setTimeout(() => {
        if (!_active.has(el)) return;
        const splash = _makeParticle(`
          left:${x}%;bottom:2%;width:18px;height:8px;z-index:13;
          background:radial-gradient(circle,${hue},rgba(0,0,0,0) 70%);
          animation:wlfxQSplash .5s ease-out forwards;`);
        _addNodeFront(el, splash);
        setTimeout(() => { try { splash.parentNode && splash.parentNode.removeChild(splash); } catch {} }, 520);
      }, 2000);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 2300);
    }

    // Faint full-stage collision flash
    function flash() {
      if (!_active.has(el)) return;
      const f = _makeParticle(`
        inset:0;z-index:7;border-radius:inherit;
        background:radial-gradient(circle at ${rndInt(20,80)}% ${rndInt(20,80)}%,rgba(185,166,255,.5),rgba(0,0,0,0) 55%);
        animation:wlfxQFlash .5s ease forwards;`);
      _addNodeBehind(el, f);
      setTimeout(() => { try { f.parentNode && f.parentNode.removeChild(f); } catch {} }, 520);
    }

    spawn();
    _addInterval(el, spawn, intense ? 90 : 150);
    _addInterval(el, spawnHeavy, intense ? 900 : 1500);
    _addInterval(el, flash, intense ? 1300 : 2200);
  }

  // blackhole — central dark sphere, rotating accretion disk, lensing halo,
  // starfield + particles spiralling inward and vanishing, polar jet flares,
  // and a subtle space-warp pulse on the character.
  function fxBlackhole(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-blackhole', `
      @keyframes wlfxDiskSpin { 0%{transform:translate(-50%,-50%) rotate(0deg)} 100%{transform:translate(-50%,-50%) rotate(360deg)} }
      @keyframes wlfxHalo { 0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(1)} 50%{opacity:.9;transform:translate(-50%,-50%) scale(1.12)} }
      @keyframes wlfxWarp { 0%,100%{transform:scale(1)} 50%{transform:scale(.97)} }
      @keyframes wlfxJet { 0%{opacity:0;transform:translate(-50%,0) scaleY(.4)} 30%{opacity:.85} 100%{opacity:0;transform:translate(-50%,0) scaleY(1.4)} }
    `);
    el.style.animation = `wlfxWarp ${intense?'2s':'3.4s'} ease-in-out infinite`;

    // Lensing halo
    _addNodeBehind(el, _makeParticle(`
      left:50%;top:50%;width:130px;height:130px;border-radius:50%;z-index:6;
      background:radial-gradient(circle,rgba(155,123,255,.35),rgba(0,0,0,0) 65%);
      animation:wlfxHalo ${intense?'1.8s':'3s'} ease-in-out infinite;`));

    // Rotating accretion disk
    _addNodeBehind(el, _makeParticle(`
      left:50%;top:50%;width:120px;height:120px;border-radius:50%;z-index:7;
      background:conic-gradient(from 0deg,#ff8a3c,#9b7bff,#3cdcff,#9b7bff,#ff8a3c);
      mask:radial-gradient(circle,transparent 30%,#000 34%,#000 48%,transparent 52%);
      -webkit-mask:radial-gradient(circle,transparent 30%,#000 34%,#000 48%,transparent 52%);
      animation:wlfxDiskSpin ${intense?'2.2s':'4s'} linear infinite;`));

    // Central dark sphere
    _addNodeBehind(el, _makeParticle(`
      left:50%;top:50%;width:42px;height:42px;border-radius:50%;z-index:9;
      transform:translate(-50%,-50%);
      background:radial-gradient(circle at 40% 38%,#2a2440,#000 70%);
      box-shadow:0 0 16px 4px rgba(0,0,0,.7),inset 0 0 10px rgba(155,123,255,.5);`));

    // Polar jets (erupt from poles outward, in front of the character)
    function jet(topPct) {
      if (!_active.has(el)) return;
      const j = _makeParticle(`
        left:50%;top:${topPct}%;width:6px;height:34px;z-index:8;
        background:linear-gradient(${topPct<50?'0deg':'180deg'},rgba(60,220,255,.9),rgba(60,220,255,0));
        animation:wlfxJet .9s ease-out forwards;`);
      _addNodeFront(el, j);
      setTimeout(() => { try { j.parentNode && j.parentNode.removeChild(j); } catch {} }, 950);
    }
    _addInterval(el, () => { jet(30); jet(70); }, intense ? 1400 : 2400);

    // Inward-spiralling particles via one RAF loop
    const rect = () => el.getBoundingClientRect();
    const parts = [];
    function seed() {
      const r0 = rnd(55, 80), a0 = rnd(0, Math.PI * 2);
      const node = _makeParticle(`
        left:50%;top:50%;width:${rndInt(2,4)}px;height:${rndInt(2,4)}px;border-radius:50%;z-index:10;
        background:${['#fff','#b9a6ff','#3cdcff'][rndInt(0,3)]};box-shadow:0 0 6px currentColor;`);
      _addNodeBehind(el, node);
      parts.push({ node, r:r0, a:a0, v:rnd(0.35,0.7) });
    }
    for (let i = 0; i < (intense ? 26 : 16); i++) seed();
    let raf = 0;
    function tick() {
      if (!_active.has(el)) return;
      const { width:W, height:H } = rect();
      for (const p of parts) {
        p.r -= p.v; p.a += 0.06 + (60 - p.r) * 0.001;
        if (p.r < 6) { p.r = rnd(55, 82); p.a = rnd(0, Math.PI * 2); }
        const x = 50 + (p.r / W * 100) * Math.cos(p.a);
        const y = 50 + (p.r / H * 100) * Math.sin(p.a);
        p.node.style.left = x + '%'; p.node.style.top = y + '%';
        p.node.style.opacity = Math.max(0.1, p.r / 80);
      }
      const next = requestAnimationFrame(tick);
      _updateRAF(el, raf, next); raf = next;
    }
    raf = requestAnimationFrame(tick); _addRAF(el, raf);
  }

  // ── Effect map ────────────────────────────────────────────────
  const _fns = {
    sparkle: fxSparkle, shimmer: fxShimmer, bubbles: fxBubbles,
    starfield: fxStarfield, aura: fxAura, fire: fxFire, frost: fxFrost,
    electric: fxElectric, rainbow: fxRainbow, matrix: fxMatrix,
    galaxy: fxGalaxy, pixel: fxPixel, radioactive: fxRadioactive,
    confetti: fxConfetti, divine: fxDivine, quantum: fxQuantum,
    aurora: fxAurora, vortex: fxVortex,
    'hearts-fx': fxHearts, snow: fxSnow, petals: fxPetals, smoke: fxSmoke,
    lasers: fxLasers, 'quark-rain': fxQuarkRain, blackhole: fxBlackhole,
  };

  // ── Public API ────────────────────────────────────────────────
  function start(effectId, el) {
    if (!el || !_fns[effectId]) return;
    if (typeof WordLabData !== 'undefined' && WordLabData.isLowStimMode()) return;
    stop(el);
    _state(el); // initialise state
    _ensureLayers(el);
    _fns[effectId](el, false);

    // Pause on hidden page
    const visHandler = () => { if (document.hidden) stop(el); };
    document.addEventListener('visibilitychange', visHandler);
    // Store cleanup ref
    _state(el)._visHandler = visHandler;
  }

  function preview(effectId, el) {
    if (!el || !_fns[effectId]) return;
    stop(el);
    _state(el);
    _ensureLayers(el);
    _fns[effectId](el, true);
  }

  return { start, stop, preview, EFFECTS };

})();
