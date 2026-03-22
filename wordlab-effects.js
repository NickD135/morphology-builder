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
    el.style.animation = '';
    // Also clear styles applied to nested character wrap (shimmer, rainbow)
    const wrap = el.querySelector && el.querySelector('#sciCharWrap');
    if (wrap) { wrap.style.boxShadow = ''; wrap.style.animation = ''; }
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

  // shimmer — pulsing oval glow cycling indigo→teal→purple
  function fxShimmer(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-shimmer', `
      @keyframes wlfxShimmer {
        0%   { box-shadow:0 0 22px 8px rgba(99,102,241,0.85),  0 0 48px 12px rgba(99,102,241,0.3); }
        33%  { box-shadow:0 0 22px 8px rgba(20,184,166,0.85),  0 0 48px 12px rgba(20,184,166,0.3); }
        66%  { box-shadow:0 0 22px 8px rgba(168,85,247,0.85),  0 0 48px 12px rgba(168,85,247,0.3); }
        100% { box-shadow:0 0 22px 8px rgba(99,102,241,0.85),  0 0 48px 12px rgba(99,102,241,0.3); }
      }
    `);
    // Use an oval div so the glow is always circular regardless of container shape
    const glow = _makeParticle(`
      left:50%; top:50%;
      width:148px; height:192px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      animation:wlfxShimmer ${intense ? '1.5s' : '3s'} ease infinite;
      z-index:8;
    `);
    _addNode(el, glow);
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

  // aura — colour-cycling oval energy ring around the character (not the stage rectangle)
  function fxAura(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-aura', `
      @keyframes wlfxAuraColor {
        0%   { border-color:#6366f1; box-shadow:0 0 18px 5px rgba(99,102,241,0.8),0 0 36px rgba(99,102,241,0.35); }
        25%  { border-color:#0d9488; box-shadow:0 0 18px 5px rgba(13,148,136,0.8),0 0 36px rgba(13,148,136,0.35); }
        50%  { border-color:#a855f7; box-shadow:0 0 18px 5px rgba(168,85,247,0.8),0 0 36px rgba(168,85,247,0.35); }
        75%  { border-color:#f59e0b; box-shadow:0 0 18px 5px rgba(245,158,11,0.8),0 0 36px rgba(245,158,11,0.35); }
        100% { border-color:#6366f1; box-shadow:0 0 18px 5px rgba(99,102,241,0.8),0 0 36px rgba(99,102,241,0.35); }
      }
    `);
    // Oval ring centred on the character.
    // z-index:8 ensures it's above the SVG content (which sits at z-index:1 on scientist.html)
    // but below #sciCharWrap (z-index:20) on game pages so the character stays on top.
    const ring = _makeParticle(`
      left:50%; top:50%;
      width:152px; height:198px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      border:3px solid #6366f1;
      animation:wlfxAuraColor ${intense ? '1.5s' : '3s'} linear infinite;
      z-index:8;
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
      _addNode(el, svg);
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
        _addNode(el, sp);
        setTimeout(() => { try { sp.parentNode && sp.parentNode.removeChild(sp); } catch {} }, 500);
      }

      // Flash glow
      const prev = el.style.boxShadow;
      el.style.boxShadow = '0 0 32px 8px rgba(147,197,253,0.85), 0 0 64px rgba(147,197,253,0.4)';
      setTimeout(() => { if (_active.has(el)) el.style.boxShadow = prev || ''; }, 480);
    }

    flashLightning();
    _addInterval(el, flashLightning, intense ? 550 : rndInt(900, 1300));
  }

  // rainbow — hue-rotate glow cycles all colours using an oval div
  function fxRainbow(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-rainbow', `
      @keyframes wlfxRainbowGlow {
        0%   { box-shadow:0 0 26px 8px rgba(239,68,68,0.9),  0 0 56px rgba(239,68,68,0.45); }
        16%  { box-shadow:0 0 26px 8px rgba(249,115,22,0.9), 0 0 56px rgba(249,115,22,0.45); }
        33%  { box-shadow:0 0 26px 8px rgba(234,179,8,0.9),  0 0 56px rgba(234,179,8,0.45); }
        50%  { box-shadow:0 0 26px 8px rgba(34,197,94,0.9),  0 0 56px rgba(34,197,94,0.45); }
        66%  { box-shadow:0 0 26px 8px rgba(99,102,241,0.9), 0 0 56px rgba(99,102,241,0.45); }
        83%  { box-shadow:0 0 26px 8px rgba(168,85,247,0.9), 0 0 56px rgba(168,85,247,0.45); }
        100% { box-shadow:0 0 26px 8px rgba(239,68,68,0.9),  0 0 56px rgba(239,68,68,0.45); }
      }
    `);
    // Oval div so glow follows the character shape, not the container rectangle
    const glow = _makeParticle(`
      left:50%; top:50%;
      width:148px; height:192px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      animation:wlfxRainbowGlow ${intense ? '2s' : '4s'} linear infinite;
      z-index:8;
    `);
    _addNode(el, glow);
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
    _addNode(el, nebula);

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
      _addNode(el, star);
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

  // quantum — dimensional phasing: chromatic aberration, glow, portal rings, particle bursts, flicker
  function fxQuantum(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-quantum', `
      @keyframes wlfxFlicker { 0%{opacity:1} 10%{opacity:0} 20%{opacity:1} 30%{opacity:0.15} 40%{opacity:1} 50%{opacity:0} 60%{opacity:0.85} 70%{opacity:1} 100%{opacity:1} }
      @keyframes wlfxPortal { 0%{transform:translate(-50%,-50%) scale(1.5);opacity:0} 20%{opacity:0.9} 80%{opacity:0.6} 100%{transform:translate(-50%,-50%) scale(0.05);opacity:0} }
      @keyframes wlfxDimension { 0%,100%{box-shadow:0 0 22px 8px rgba(167,139,250,0.75),0 0 44px rgba(167,139,250,0.3)} 50%{box-shadow:0 0 32px 12px rgba(99,102,241,0.9),0 0 64px rgba(99,102,241,0.45)} }
      @keyframes wlfxQPart { 0%{opacity:0;transform:translate(-50%,-50%)} 15%{opacity:1} 100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy)))} }
    `);

    // Strong chromatic aberration filter
    el.style.filter = `drop-shadow(3px 0 4px rgba(239,68,68,0.65)) drop-shadow(-3px 0 4px rgba(99,102,241,0.65)) drop-shadow(0 0 10px rgba(167,139,250,0.55))`;

    // Oval dimensional glow oval behind the character
    const glow = _makeParticle(`
      left:50%; top:50%;
      width:152px; height:198px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      animation:wlfxDimension ${intense ? '1.5s' : '2.5s'} ease infinite;
      z-index:8;
    `);
    _addNode(el, glow);

    // Dimensional flicker
    _addInterval(el, () => {
      if (!_active.has(el)) return;
      el.style.animation = 'wlfxFlicker 0.55s ease';
      setTimeout(() => { if (_active.has(el)) el.style.animation = ''; }, 650);
    }, intense ? 1800 : rndInt(2800, 4500));

    // Portal rings — more frequent, more visible
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
      _addNode(el, ring);
      setTimeout(() => { try { ring.parentNode && ring.parentNode.removeChild(ring); } catch {} }, 1100);
    }, intense ? 550 : 1200);

    // Dimensional particle burst
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
        _addNode(el, p);
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
    _addNode(el, blob1);
    _addNode(el, blob2);
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

  // vortex — spinning orbital particles forming a vortex funnel
  function fxVortex(el, intense) {
    _ensureRelative(el);
    _injectStyle('wlfx-vortex', `
      @keyframes wlfxVortexSpin  { 0%{transform:rotate(0deg)   translateX(var(--r)) rotate(0deg)}   100%{transform:rotate(360deg)  translateX(var(--r)) rotate(-360deg)} }
      @keyframes wlfxVortexSpinR { 0%{transform:rotate(0deg)   translateX(var(--r)) rotate(0deg)}   100%{transform:rotate(-360deg) translateX(var(--r)) rotate(360deg)} }
      @keyframes wlfxVortexCore  { 0%,100%{box-shadow:0 0 14px 5px rgba(129,140,248,0.9),0 0 28px rgba(129,140,248,0.45)} 50%{box-shadow:0 0 22px 8px rgba(167,139,250,0.95),0 0 44px rgba(167,139,250,0.55)} }
      @keyframes wlfxVortexPull  { 0%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(1.5)} 20%{opacity:0.9} 100%{opacity:0;transform:translate(0,0) scale(0.2)} }
    `);

    // Core energy ball
    const core = _makeParticle(`
      left:50%; top:50%;
      width:18px; height:18px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      background:radial-gradient(circle,#e0e7ff,#818cf8);
      animation:wlfxVortexCore ${intense?'1s':'2s'} ease infinite;
      z-index:13;
    `);
    _addNode(el, core);

    // Orbital rings at 3 radii with different speeds/colours
    const rings = [
      {r:'30px', dur:intense?'0.9s':'1.8s',  anim:'wlfxVortexSpin',  color:'#818cf8', sz:5},
      {r:'50px', dur:intense?'1.4s':'2.8s',  anim:'wlfxVortexSpinR', color:'#a78bfa', sz:4},
      {r:'68px', dur:intense?'2s':'4s',       anim:'wlfxVortexSpin',  color:'#6366f1', sz:3},
      {r:'40px', dur:intense?'1.1s':'2.2s',  anim:'wlfxVortexSpinR', color:'#c4b5fd', sz:3},
      {r:'58px', dur:intense?'1.7s':'3.4s',  anim:'wlfxVortexSpin',  color:'#7c3aed', sz:4},
    ];
    const startAngles = [0, 72, 144, 216, 288];
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
      _addNode(el, orbit);
    });

    // Occasional particle pull-in streaks
    function spawnPull() {
      if (!_active.has(el)) return;
      const w = el.offsetWidth || 160, h = el.offsetHeight || 200;
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
      _addNode(el, p);
      setTimeout(() => { try { p.parentNode && p.parentNode.removeChild(p); } catch {} }, 1200);
    }
    for (let i = 0; i < 4; i++) setTimeout(() => spawnPull(), i * 200);
    _addInterval(el, spawnPull, intense ? 180 : 350);
  }

  // ── Effect map ────────────────────────────────────────────────
  const _fns = {
    sparkle: fxSparkle, shimmer: fxShimmer, bubbles: fxBubbles,
    starfield: fxStarfield, aura: fxAura, fire: fxFire, frost: fxFrost,
    electric: fxElectric, rainbow: fxRainbow, matrix: fxMatrix,
    galaxy: fxGalaxy, pixel: fxPixel, radioactive: fxRadioactive,
    confetti: fxConfetti, divine: fxDivine, quantum: fxQuantum,
    aurora: fxAurora, vortex: fxVortex,
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
