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
    divine:      { name:'Divine',       cost:0,    rarity:'legendary', icon:'✨', desc:'Golden light rays radiate behind you',    color:'#fbbf24', requiresBadge:'legend_morpheme' },
    quantum:     { name:'Quantum',      cost:0,    rarity:'legendary', icon:'🌀', desc:'You phase between dimensions',            color:'#a78bfa', requiresBadge:'legend_sessions' },
  };

  // ── State tracking ────────────────────────────────────────────
  const _active = new Map();

  function _state(el) {
    if (!_active.has(el)) _active.set(el, { intervals:[], rafs:[], nodes:[], styleIds:[] });
    return _active.get(el);
  }

  function _addNode(el, node) {
    el.appendChild(node);
    _state(el).nodes.push(node);
    return node;
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

  // shimmer — pulsing box-shadow glow cycling indigo→teal→purple
  function fxShimmer(el, intense) {
    _injectStyle('wlfx-shimmer', `
      @keyframes wlfxShimmer {
        0%   { box-shadow: 0 0 16px 4px rgba(99,102,241,0.6),  0 0 32px 8px rgba(99,102,241,0.2); }
        33%  { box-shadow: 0 0 16px 4px rgba(20,184,166,0.6),  0 0 32px 8px rgba(20,184,166,0.2); }
        66%  { box-shadow: 0 0 16px 4px rgba(168,85,247,0.6),  0 0 32px 8px rgba(168,85,247,0.2); }
        100% { box-shadow: 0 0 16px 4px rgba(99,102,241,0.6),  0 0 32px 8px rgba(99,102,241,0.2); }
      }
    `);
    const dur = intense ? '1.5s' : '3s';
    el.style.animation = `wlfxShimmer ${dur} ease infinite`;
    // Clean up on stop by storing ref
    const cleanup = _makeParticle('display:none;');
    _addNode(el, cleanup);
    const origStop = stop;
    _state(el).shimmerEl = el;
    _addInterval(el, () => {}, 999999); // dummy to keep state alive
    // Actually animate via direct style
    el.style.cssText += `;animation:wlfxShimmer ${dur} ease infinite;`;
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

  // starfield — tiny dots drift from top to bottom
  function fxStarfield(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-starfield', `
      @keyframes wlfxStarDrift {
        0%   { transform:translateY(-10px); opacity:0; }
        10%  { opacity:1; }
        90%  { opacity:0.6; }
        100% { transform:translateY(110%); opacity:0; }
      }
    `);
    const count = intense ? 30 : (mobile() ? 12 : 22);
    for (let i = 0; i < count; i++) {
      const sz = rndInt(2, 4);
      const p = _makeParticle(`
        left:${rnd(0,98)}%;top:0;
        width:${sz}px;height:${sz}px;border-radius:50%;
        background:rgba(${rndInt(180,255)},${rndInt(180,255)},255,${rnd(0.4,0.9).toFixed(2)});
        animation:wlfxStarDrift ${rnd(4,10).toFixed(1)}s linear ${rnd(0,8).toFixed(1)}s infinite;
        z-index:10;
      `);
      _addNode(el, p);
    }
  }

  // ── RARE EFFECTS ──────────────────────────────────────────────

  // aura — rotating colour ring around the container
  function fxAura(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-aura', `
      @keyframes wlfxAuraRot { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      @keyframes wlfxAuraColor {
        0%   { border-color:#6366f1; box-shadow:0 0 12px #6366f1,0 0 24px rgba(99,102,241,0.3); }
        25%  { border-color:#0d9488; box-shadow:0 0 12px #0d9488,0 0 24px rgba(13,148,136,0.3); }
        50%  { border-color:#a855f7; box-shadow:0 0 12px #a855f7,0 0 24px rgba(168,85,247,0.3); }
        75%  { border-color:#f59e0b; box-shadow:0 0 12px #f59e0b,0 0 24px rgba(245,158,11,0.3); }
        100% { border-color:#6366f1; box-shadow:0 0 12px #6366f1,0 0 24px rgba(99,102,241,0.3); }
      }
    `);
    const ring = _makeParticle(`
      inset:-6px;border-radius:inherit;
      border:3px solid #6366f1;
      animation:wlfxAuraColor ${intense ? '1.5s' : '3s'} linear infinite;
      z-index:0;border-radius:20px;
    `);
    _addNode(el, ring);
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

  // electric — lightning bolt SVGs flash at random positions
  function fxElectric(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-electric', `
      @keyframes wlfxBolt { 0%{opacity:0} 5%{opacity:1} 15%{opacity:0.8} 25%{opacity:1} 100%{opacity:0} }
    `);

    function flashLightning() {
      if (!_active.has(el)) return;
      const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      const x = rnd(5,75), y = rnd(5,60);
      const size = rndInt(20,40);
      svg.setAttribute('width', size);
      svg.setAttribute('height', size * 1.5);
      svg.style.cssText = `position:absolute;left:${x}%;top:${y}%;z-index:12;pointer-events:none;animation:wlfxBolt 0.4s ease forwards;filter:drop-shadow(0 0 4px #93c5fd);`;
      svg.innerHTML = `<polyline points="12,0 4,${size*0.5} 10,${size*0.5} 2,${size*1.4}" fill="none" stroke="#e0f2fe" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      _addNode(el, svg);
      // Also flash container
      const prev = el.style.boxShadow;
      el.style.boxShadow = '0 0 20px #93c5fd, 0 0 40px rgba(147,197,253,0.4)';
      setTimeout(() => { try { svg.parentNode && svg.parentNode.removeChild(svg); } catch {} el.style.boxShadow = prev || ''; }, 400);
    }

    flashLightning();
    _addInterval(el, flashLightning, intense ? 800 : rndInt(1200, 2000));
  }

  // rainbow — hue-rotate glow cycles all colours
  function fxRainbow(el, intense) {
    _injectStyle('wlfx-rainbow', `
      @keyframes wlfxRainbowGlow {
        0%   { box-shadow:0 0 18px 4px rgba(239,68,68,0.7),0 0 36px rgba(239,68,68,0.3); }
        16%  { box-shadow:0 0 18px 4px rgba(249,115,22,0.7),0 0 36px rgba(249,115,22,0.3); }
        33%  { box-shadow:0 0 18px 4px rgba(234,179,8,0.7),0 0 36px rgba(234,179,8,0.3); }
        50%  { box-shadow:0 0 18px 4px rgba(34,197,94,0.7),0 0 36px rgba(34,197,94,0.3); }
        66%  { box-shadow:0 0 18px 4px rgba(99,102,241,0.7),0 0 36px rgba(99,102,241,0.3); }
        83%  { box-shadow:0 0 18px 4px rgba(168,85,247,0.7),0 0 36px rgba(168,85,247,0.3); }
        100% { box-shadow:0 0 18px 4px rgba(239,68,68,0.7),0 0 36px rgba(239,68,68,0.3); }
      }
    `);
    el.style.animation = `wlfxRainbowGlow ${intense ? '2s' : '4s'} linear infinite`;
    _addInterval(el, () => {}, 999999);
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
    _addNode(el, canvas);

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
      @keyframes wlfxStarTwinkle { 0%,100%{opacity:0.3} 50%{opacity:1} }
    `);

    // Starfield background dots
    for (let i = 0; i < 15; i++) {
      const star = _makeParticle(`
        left:${rnd(5,95)}%;top:${rnd(5,95)}%;
        width:2px;height:2px;border-radius:50%;
        background:rgba(199,210,254,${rnd(0.4,0.9).toFixed(2)});
        animation:wlfxStarTwinkle ${rnd(1.5,3.5).toFixed(1)}s ease ${rnd(0,2).toFixed(1)}s infinite;
        z-index:8;
      `);
      _addNode(el, star);
    }

    // Orbiting planets
    const planets = [
      { color:'#f97316', sz:8,  r:'42%', dur:intense?'2s':'4s',   anim:'wlfxOrbit1' },
      { color:'#6366f1', sz:6,  r:'55%', dur:intense?'3s':'6s',   anim:'wlfxOrbit2' },
      { color:'#14b8a6', sz:5,  r:'35%', dur:intense?'1.5s':'3s', anim:'wlfxOrbit3' },
      { color:'#fbbf24', sz:4,  r:'65%', dur:intense?'4s':'8s',   anim:'wlfxOrbit1' },
    ];

    const cx = _makeParticle(`left:50%;top:50%;width:0;height:0;z-index:9;`);
    _addNode(el, cx);

    planets.forEach(p => {
      const orbit = _makeParticle(`
        left:50%;top:50%;width:0;height:0;z-index:9;
        --r:${p.r};
        animation:${p.anim} ${p.dur} linear infinite;
      `);
      const dot = _makeParticle(`
        width:${p.sz}px;height:${p.sz}px;border-radius:50%;
        background:radial-gradient(circle at 35% 35%,white,${p.color});
        box-shadow:0 0 6px ${p.color};
        transform:translate(-50%,-50%);
      `);
      orbit.appendChild(dot);
      _addNode(el, orbit);
    });
  }

  // pixel — coloured squares appear at edges + occasional dissolve
  function fxPixel(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-pixel', `
      @keyframes wlfxPixelPop { 0%{opacity:0;transform:scale(0)} 30%{opacity:1;transform:scale(1)} 70%{opacity:0.8} 100%{opacity:0} }
      @keyframes wlfxPixelDissolve { 0%{opacity:1} 50%{opacity:0.3} 100%{opacity:1} }
    `);
    const colors = ['#f472b6','#818cf8','#34d399','#fbbf24','#f97316','#60a5fa'];
    const max = mobile() ? 8 : 16;

    function spawnPixel() {
      if (!_active.has(el)) return;
      const w = el.offsetWidth, h = el.offsetHeight;
      const edge = rndInt(0, 4);
      let x, y;
      if (edge===0) { x=rnd(0,w); y=rnd(-8,8); }
      else if (edge===1) { x=rnd(w-8,w); y=rnd(0,h); }
      else if (edge===2) { x=rnd(0,w); y=rnd(h-8,h); }
      else { x=rnd(-8,8); y=rnd(0,h); }
      const p = _makeParticle(`
        left:${x}px;top:${y}px;
        width:${rndInt(3,6)}px;height:${rndInt(3,6)}px;
        background:${colors[rndInt(0,colors.length)]};
        animation:wlfxPixelPop ${rnd(0.8,1.6).toFixed(2)}s ease forwards;
        z-index:10;
      `);
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 1700);
    }

    for (let i = 0; i < max / 2; i++) setTimeout(() => spawnPixel(), i * 120);
    _addInterval(el, spawnPixel, intense ? 100 : 200);

    // Occasional dissolve
    _addInterval(el, () => {
      if (!_active.has(el)) return;
      el.style.transition = 'opacity 0.2s';
      el.style.animation = 'wlfxPixelDissolve 0.6s ease';
      setTimeout(() => { if (_active.has(el)) { el.style.animation = ''; } }, 700);
    }, intense ? 2000 : 3500);
  }

  // radioactive — green glow, floating particles, ☢ symbol
  function fxRadioactive(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-radioactive', `
      @keyframes wlfxGreenPulse {
        0%,100% { box-shadow:0 0 16px 4px rgba(74,222,128,0.6),0 0 32px rgba(74,222,128,0.25); }
        50%     { box-shadow:0 0 28px 8px rgba(74,222,128,0.85),0 0 56px rgba(74,222,128,0.4); }
      }
      @keyframes wlfxParticleFly {
        0%   { transform:translate(0,0); opacity:0.9; }
        100% { transform:translate(var(--dx),var(--dy)); opacity:0; }
      }
      @keyframes wlfxRadSymbol { 0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)} 20%{opacity:1;transform:translate(-50%,-50%) scale(1.2)} 80%{opacity:0.7} 100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)} }
    `);
    el.style.animation = `wlfxGreenPulse ${intense?'1s':'2s'} ease infinite`;

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
      _addNode(el, p);
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
      _addNode(el, sym);
      setTimeout(() => { try { sym.parentNode && sym.parentNode.removeChild(sym); } catch {} }, 1600);
    }, intense ? 1500 : 3000);
  }

  // ── LEGENDARY EFFECTS ─────────────────────────────────────────

  // divine — rotating golden rays + golden sparkles + warm glow
  function fxDivine(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-divine', `
      @keyframes wlfxRayRot { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      @keyframes wlfxGoldGlow {
        0%,100% { box-shadow:0 0 20px 6px rgba(251,191,36,0.55),0 0 48px rgba(251,191,36,0.2); }
        50%     { box-shadow:0 0 36px 10px rgba(251,191,36,0.8),0 0 72px rgba(251,191,36,0.35); }
      }
      @keyframes wlfxGoldSpark { 0%{opacity:0;transform:translateY(0)} 20%{opacity:1} 100%{opacity:0;transform:translateY(-60px)} }
    `);
    el.style.animation = `wlfxGoldGlow ${intense?'1.5s':'3s'} ease infinite`;

    // Rays behind
    const rays = _makeParticle(`
      inset:-20px;z-index:0;border-radius:inherit;
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
    _addNode(el, rays);

    // Gold sparkles float upward
    function spawnSpark() {
      if (!_active.has(el)) return;
      const p = _makeParticle(`
        left:${rnd(10,85)}%;bottom:${rnd(0,30)}%;
        font-size:${rndInt(8,16)}px;color:#fbbf24;
        text-shadow:0 0 8px #f59e0b;
        animation:wlfxGoldSpark ${rnd(1.5,2.8).toFixed(2)}s ease forwards;z-index:12;
      `);
      p.textContent = ['✦','★','✧','✸'][rndInt(0,4)];
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 2900);
    }
    _addInterval(el, spawnSpark, intense ? 200 : 450);
  }

  // quantum — flicker, chromatic aberration, portal rings
  function fxQuantum(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-quantum', `
      @keyframes wlfxFlicker { 0%{opacity:1} 10%{opacity:0} 20%{opacity:1} 30%{opacity:0.2} 40%{opacity:1} 50%{opacity:0} 60%{opacity:0.8} 70%{opacity:1} 100%{opacity:1} }
      @keyframes wlfxPortal { 0%{transform:translate(-50%,-50%) scale(1.4);opacity:0} 30%{opacity:0.7} 100%{transform:translate(-50%,-50%) scale(0.2);opacity:0} }
    `);

    // Chromatic aberration glow
    el.style.filter = `drop-shadow(2px 0 2px rgba(239,68,68,0.4)) drop-shadow(-2px 0 2px rgba(99,102,241,0.4))`;

    // Occasional flicker
    _addInterval(el, () => {
      if (!_active.has(el)) return;
      el.style.animation = 'wlfxFlicker 0.6s ease';
      setTimeout(() => { if (_active.has(el)) el.style.animation = ''; }, 700);
    }, intense ? 2500 : rndInt(4000, 6000));

    // Portal rings
    _addInterval(el, () => {
      if (!_active.has(el)) return;
      const ring = _makeParticle(`
        left:${rnd(20,70)}%;top:${rnd(20,70)}%;
        width:${rndInt(30,60)}px;height:${rndInt(30,60)}px;
        border-radius:50%;
        border:2px solid rgba(167,139,250,0.8);
        box-shadow:0 0 10px rgba(167,139,250,0.5);
        animation:wlfxPortal 1.2s ease forwards;z-index:12;
      `);
      _addNode(el, ring);
      setTimeout(() => { try { ring.parentNode && ring.parentNode.removeChild(ring); } catch {} }, 1300);
    }, intense ? 800 : 2000);
  }

  // ── Effect map ────────────────────────────────────────────────
  const _fns = {
    sparkle: fxSparkle, shimmer: fxShimmer, bubbles: fxBubbles,
    starfield: fxStarfield, aura: fxAura, fire: fxFire, frost: fxFrost,
    electric: fxElectric, rainbow: fxRainbow, matrix: fxMatrix,
    galaxy: fxGalaxy, pixel: fxPixel, radioactive: fxRadioactive,
    divine: fxDivine, quantum: fxQuantum,
  };

  // ── Public API ────────────────────────────────────────────────
  function start(effectId, el) {
    if (!el || !_fns[effectId]) return;
    stop(el);
    _state(el); // initialise state
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
    _fns[effectId](el, true);
  }

  return { start, stop, preview, EFFECTS };

})();
