// ═══════════════════════════════════════════════════════════════
// WORD LAB — Scientist Character Module
// Exposes: WLScientist.inject(), react(), refresh(), buildSVG(), openProfile()
// ═══════════════════════════════════════════════════════════════

const WLScientist = (() => {

  // ── Streak flame SVG builder ─────────────────────────────────
  function _buildStreakFlame(cx, cy, streakDays) {
    // Flame grows from tiny (1 day) to massive (30+ days)
    // Scale: 0.5 at day 1, up to 2.0 at day 30
    var days = Math.max(streakDays || 0, 1);
    var scale = Math.min(0.5 + (days - 1) * 0.055, 2.2);
    var h = 8 * scale;  // flame height
    var w = 5 * scale;  // flame width

    // Colour intensifies: orange → deep orange → red → blue-white core at 30+
    var outerColor, innerColor, coreColor;
    if (days >= 30) {
      outerColor = '#dc2626'; innerColor = '#f59e0b'; coreColor = '#93c5fd';
    } else if (days >= 14) {
      outerColor = '#dc2626'; innerColor = '#f97316'; coreColor = '#fef08a';
    } else if (days >= 7) {
      outerColor = '#f97316'; innerColor = '#fbbf24'; coreColor = '#fef9c3';
    } else {
      outerColor = '#fb923c'; innerColor = '#fcd34d'; coreColor = '#fef9c3';
    }

    // Animation speed increases with streak (slower flicker = calmer, faster = intense)
    var animDur = days >= 30 ? '0.3s' : days >= 14 ? '0.5s' : days >= 7 ? '0.8s' : '1.2s';
    var animName = 'streakFlame' + Math.round(cx) + Math.round(cy);

    // Glow radius grows with streak
    var glowR = Math.min(3 + days * 0.3, 12);
    var glowOpacity = Math.min(0.15 + days * 0.01, 0.45);

    var svg = '';
    // Glow
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + glowR + '" fill="' + outerColor + '" opacity="' + glowOpacity + '"/>';
    // Outer flame
    svg += '<path d="M' + cx + ',' + (cy - h) +
      ' C' + (cx - w * 0.6) + ',' + (cy - h * 0.4) +
      ' ' + (cx - w) + ',' + (cy + 1) +
      ' ' + cx + ',' + (cy + 3) +
      ' C' + (cx + w) + ',' + (cy + 1) +
      ' ' + (cx + w * 0.6) + ',' + (cy - h * 0.4) +
      ' ' + cx + ',' + (cy - h) +
      'Z" fill="' + outerColor + '" opacity="0.9">' +
      '<animateTransform attributeName="transform" type="scale" values="1,1;1.05,1.08;0.97,1.02;1,1" dur="' + animDur + '" repeatCount="indefinite" additive="sum" origin="' + cx + ' ' + (cy + 3) + '"/>' +
      '</path>';
    // Inner flame
    var ih = h * 0.65, iw = w * 0.55;
    svg += '<path d="M' + cx + ',' + (cy - ih) +
      ' C' + (cx - iw) + ',' + (cy - ih * 0.3) +
      ' ' + (cx - iw) + ',' + (cy + 1) +
      ' ' + cx + ',' + (cy + 2) +
      ' C' + (cx + iw) + ',' + (cy + 1) +
      ' ' + (cx + iw) + ',' + (cy - ih * 0.3) +
      ' ' + cx + ',' + (cy - ih) +
      'Z" fill="' + innerColor + '" opacity="0.95">' +
      '<animateTransform attributeName="transform" type="scale" values="1,1;0.95,1.1;1.06,0.96;1,1" dur="' + animDur + '" repeatCount="indefinite" additive="sum"/>' +
      '</path>';
    // Core (only visible at 7+ days)
    if (days >= 7) {
      var ch = ih * 0.45, cw = iw * 0.5;
      svg += '<ellipse cx="' + cx + '" cy="' + (cy - ch * 0.3) + '" rx="' + cw + '" ry="' + ch + '" fill="' + coreColor + '" opacity="0.85">' +
        '<animate attributeName="ry" values="' + ch + ';' + (ch * 1.15) + ';' + (ch * 0.9) + ';' + ch + '" dur="' + animDur + '" repeatCount="indefinite"/>' +
        '</ellipse>';
    }
    // Sparks at 14+ days
    if (days >= 14) {
      svg += '<circle cx="' + (cx - w * 0.4) + '" cy="' + (cy - h * 0.8) + '" r="0.8" fill="#fef08a" opacity="0.8">' +
        '<animate attributeName="cy" values="' + (cy - h * 0.8) + ';' + (cy - h * 1.2) + ';' + (cy - h * 0.8) + '" dur="0.6s" repeatCount="indefinite"/>' +
        '<animate attributeName="opacity" values="0.8;0;0.8" dur="0.6s" repeatCount="indefinite"/>' +
        '</circle>';
      svg += '<circle cx="' + (cx + w * 0.3) + '" cy="' + (cy - h * 0.7) + '" r="0.6" fill="#fef08a" opacity="0.7">' +
        '<animate attributeName="cy" values="' + (cy - h * 0.7) + ';' + (cy - h * 1.1) + ';' + (cy - h * 0.7) + '" dur="0.8s" repeatCount="indefinite"/>' +
        '<animate attributeName="opacity" values="0.7;0;0.7" dur="0.8s" repeatCount="indefinite"/>' +
        '</circle>';
    }
    // Extra sparks at 30+ days
    if (days >= 30) {
      svg += '<circle cx="' + (cx + w * 0.5) + '" cy="' + (cy - h * 0.9) + '" r="0.7" fill="#93c5fd" opacity="0.9">' +
        '<animate attributeName="cy" values="' + (cy - h * 0.9) + ';' + (cy - h * 1.4) + ';' + (cy - h * 0.9) + '" dur="0.5s" repeatCount="indefinite"/>' +
        '<animate attributeName="opacity" values="0.9;0;0.9" dur="0.5s" repeatCount="indefinite"/>' +
        '</circle>';
    }
    return svg;
  }

  // ── Badge pin helper ─────────────────────────────────────────
  function _buildBadgePins(scientist) {
    var pins = (scientist && scientist.displayBadges) || [];
    if (!pins.length) return '';
    var allBadges = [];
    if (typeof WordLabData !== 'undefined') {
      allBadges = [].concat(WordLabData.ALL_BADGES || [], WordLabData.LEGENDARY_BADGES || []);
    }
    var svgParts = [];

    // Streak flame — rendered separately at a dedicated spot (upper-right coat)
    var hasFlame = pins.indexOf('streak_flame') !== -1;
    if (hasFlame) {
      var streakDays = 0;
      try {
        if (typeof WordLabData !== 'undefined') {
          streakDays = WordLabData.updateDailyStreak().count || 0;
        }
      } catch(e) {}
      svgParts.push(_buildStreakFlame(56, 72, Math.max(streakDays, 1)));
    }

    // Regular badge pins (excluding streak_flame)
    var regularPins = pins.filter(function(id) { return id !== 'streak_flame'; });
    var positions = [{x:24, y:70}, {x:24, y:80}, {x:24, y:90}];
    for (var i = 0; i < Math.min(regularPins.length, 3); i++) {
      var badge = allBadges.find(function(b) { return b.id === regularPins[i]; });
      if (!badge) continue;
      var px = positions[i].x, py = positions[i].y;
      svgParts.push(
        '<circle cx="' + px + '" cy="' + py + '" r="5.5" fill="#eef2ff" stroke="#a5b4fc" stroke-width="0.8"/>' +
        '<text x="' + px + '" y="' + (py + 2.5) + '" text-anchor="middle" font-size="6.5" dominant-baseline="middle">' + badge.icon + '</text>'
      );
    }
    return svgParts.join('');
  }

  // ── Skin-tone colour mixer ───────────────────────────────────
  function _mix(hex, hex2, t) {
    const parse = h => {
      h = (h || '').replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return null;
      const n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const a = parse(hex) || [253, 188, 180];   // fallback = default skin
    const b = parse(hex2) || [0, 0, 0];
    const m = i => Math.round(a[i] + (b[i] - a[i]) * t);
    return '#' + [m(0), m(1), m(2)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // ── Per-instance unique id counter ──────────────────────────
  let _sciSeq = 0;
  let _petSeq = 0;

  // ── Pet gradient/shadow helpers (soft-plush dimensional pass) ─
  function _petGrad(id, base) {
    const hi = _mix(base, '#FFFFFF', 0.30);
    const lo = _mix(base, '#000000', 0.22);
    return `<radialGradient id="${id}" cx="38%" cy="30%" r="78%">` +
      `<stop offset="0%" stop-color="${hi}"/>` +
      `<stop offset="58%" stop-color="${base}"/>` +
      `<stop offset="100%" stop-color="${lo}"/>` +
      `</radialGradient>`;
  }
  function _petShadow(rx) {
    return `<ellipse cx="40" cy="73" rx="${rx || 16}" ry="3" fill="rgba(0,0,0,0.18)"/>`;
  }

  // ── SVG builder ──────────────────────────────────────────────
  function buildSVG(scientist, reaction) {
    scientist = scientist || {};
    reaction  = reaction  || 'neutral';
    const uid = '_s' + (++_sciSeq);
    const skin       = scientist.skinTone    || '#FDBCB4';
    const HI   = _mix(skin, '#FFFFFF', 0.32);
    const LO   = _mix(skin, '#2E1D14', 0.24);
    const FLAT = _mix(skin, '#2E1D14', 0.10);
    const coat       = scientist.coatColor   || '#ffffff';
    const pattern    = scientist.coatPattern || 'plain';
    const headAcc    = scientist.head        || null;
    const faceAcc    = scientist.face        || null;
    const wingsAcc   = scientist.wings       || null;
    const customSlots = scientist.customSlots || {};

    // Hair — style id + colour (both optional; hair=null keeps today's bare head)
    const hair       = scientist.hair        || null;
    const hairColor  = scientist.hairColor   || '#3B2A1E';
    const hairHi     = _mix(hairColor, '#FFFFFF', 0.30);
    const hairLo     = _mix(hairColor, '#000000', 0.30);
    const hairActive = !!(hair && hair !== 'none');
    const hairGradDef = hairActive
      ? `<linearGradient id="hairG${uid}" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0%" stop-color="${hairHi}" stop-opacity="1"/>` +
        `<stop offset="55%" stop-color="${hairColor}" stop-opacity="1"/>` +
        `<stop offset="100%" stop-color="${hairLo}" stop-opacity="1"/>` +
        `</linearGradient>`
      : '';

    // Coat fill — plain, rainbow gradient, or patterned
    // 'rainbow' is not a valid SVG colour so we build a linearGradient instead
    const isRainbow = coat === 'rainbow';
    const isHolo    = coat === 'holographic';
    const coatBase  = isRainbow ? `url(#coatRainbow${uid})` : isHolo ? `url(#coatHolo${uid})` : coat;

    const defsContent = [
      isRainbow
        ? `<linearGradient id="coatRainbow${uid}" x1="0%" y1="0%" x2="100%" y2="100%">` +
          `<stop offset="0%"   stop-color="#f87171"/>` +
          `<stop offset="20%"  stop-color="#fb923c"/>` +
          `<stop offset="40%"  stop-color="#facc15"/>` +
          `<stop offset="60%"  stop-color="#4ade80"/>` +
          `<stop offset="80%"  stop-color="#60a5fa"/>` +
          `<stop offset="100%" stop-color="#a78bfa"/>` +
          `</linearGradient>`
        : '',
      isHolo
        ? `<linearGradient id="coatHolo${uid}" x1="0%" y1="0%" x2="100%" y2="100%">` +
          `<stop offset="0%"   stop-color="#c4b5fd"/>` +
          `<stop offset="25%"  stop-color="#93c5fd"/>` +
          `<stop offset="50%"  stop-color="#86efac"/>` +
          `<stop offset="75%"  stop-color="#fde68a"/>` +
          `<stop offset="100%" stop-color="#fda4af"/>` +
          `</linearGradient>`
        : '',
      pattern === 'stripes'
        ? `<pattern id="cp${uid}" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${coatBase}"/><line x1="0" y1="0" x2="8" y2="8" stroke="rgba(0,0,0,0.12)" stroke-width="2"/></pattern>`
        : '',
      pattern === 'molecules'
        ? `<pattern id="cp${uid}" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${coatBase}"/><circle cx="7" cy="7" r="2" fill="rgba(0,0,0,0.1)"/><circle cx="2" cy="2" r="1.2" fill="rgba(0,0,0,0.08)"/><circle cx="12" cy="12" r="1.2" fill="rgba(0,0,0,0.08)"/></pattern>`
        : '',
      pattern === 'stars'
        ? `<pattern id="cp${uid}" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${coatBase}"/><text x="2" y="10" font-size="8" opacity="0.18">★</text></pattern>`
        : '',
      pattern === 'dots'
        ? `<pattern id="cp${uid}" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${coatBase}"/><circle cx="5" cy="5" r="2.5" fill="rgba(0,0,0,0.1)"/></pattern>`
        : '',
      pattern === 'chevrons'
        ? `<pattern id="cp${uid}" x="0" y="0" width="12" height="8" patternUnits="userSpaceOnUse"><rect width="12" height="8" fill="${coatBase}"/><path d="M0,4 L6,0 L12,4" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="1.5"/></pattern>`
        : '',
      pattern === 'hearts'
        ? `<pattern id="cp${uid}" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${coatBase}"/><path d="M6,10 C2,7 0,4 3,2 C5,1 6,3 6,3 C6,3 7,1 9,2 C12,4 10,7 6,10Z" fill="rgba(0,0,0,0.08)"/></pattern>`
        : '',
      pattern === 'lightning'
        ? `<pattern id="cp${uid}" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${coatBase}"/><path d="M8,1 L5,6 L8,6 L4,13" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1.2"/></pattern>`
        : '',
      pattern === 'dna'
        ? `<pattern id="cp${uid}" x="0" y="0" width="10" height="20" patternUnits="userSpaceOnUse"><rect width="10" height="20" fill="${coatBase}"/><path d="M2,0 Q5,5 8,10 Q5,15 2,20" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="1"/><path d="M8,0 Q5,5 2,10 Q5,15 8,20" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="1"/><line x1="3" y1="5" x2="7" y2="5" stroke="rgba(0,0,0,0.06)" stroke-width="0.8"/><line x1="3" y1="15" x2="7" y2="15" stroke="rgba(0,0,0,0.06)" stroke-width="0.8"/></pattern>`
        : '',
      pattern === 'plaid'
        ? `<pattern id="cp${uid}" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${coatBase}"/><line x1="0" y1="4" x2="12" y2="4" stroke="rgba(0,0,0,0.08)" stroke-width="2"/><line x1="0" y1="10" x2="12" y2="10" stroke="rgba(0,0,0,0.06)" stroke-width="1"/><line x1="4" y1="0" x2="4" y2="12" stroke="rgba(0,0,0,0.08)" stroke-width="2"/><line x1="10" y1="0" x2="10" y2="12" stroke="rgba(0,0,0,0.06)" stroke-width="1"/></pattern>`
        : '',
    ].filter(Boolean).join('');

    // Galaxy halo gradient + any extra defs
    const galaxyDef = headAcc === 'galaxy_halo'
      ? `<linearGradient id="galaxyGrad${uid}" x1="0%" y1="0%" x2="100%"><stop offset="0%" stop-color="#a78bfa"/><stop offset="33%" stop-color="#f472b6"/><stop offset="66%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#60a5fa"/></linearGradient>` : '';
    const shadeDefs =
      `<radialGradient id="sk${uid}" cx="38%" cy="30%" r="78%"><stop offset="0%" stop-color="${HI}"/><stop offset="58%" stop-color="${skin}"/><stop offset="100%" stop-color="${LO}"/></radialGradient>` +
      `<linearGradient id="hs${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#462D26" stop-opacity="0"/><stop offset="62%" stop-color="#462D26" stop-opacity="0"/><stop offset="100%" stop-color="#462D26" stop-opacity="0.22"/></linearGradient>` +
      `<radialGradient id="hh${uid}" cx="32%" cy="26%" r="55%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.42"/><stop offset="60%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="cs${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#322A5C" stop-opacity="0"/><stop offset="55%" stop-color="#322A5C" stop-opacity="0"/><stop offset="100%" stop-color="#322A5C" stop-opacity="0.13"/></linearGradient>`;
    const allDefs = defsContent + galaxyDef + shadeDefs + hairGradDef;
    const coatFillDef = allDefs ? `<defs>${allDefs}</defs>` : '';
    const coatFillRef = ['stripes','molecules','stars','dots','chevrons','hearts','lightning','dna','plaid'].includes(pattern) ? `url(#cp${uid})` : coatBase;

    // Wings (render behind body)
    const wingsSVG = {
      // ── angel_wings: soft cloth/feather — white→indigo matte gradient + subtle highlight streak ──
      angel_wings:  `<g opacity="0.85"><defs><linearGradient id="angelWG${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#f0f4ff"/><stop offset="55%" stop-color="#c7d2fe"/><stop offset="100%" stop-color="#818cf8"/></linearGradient></defs><path d="M14,70 Q-8,50 -4,30 Q0,20 10,25 Q16,30 14,50 Z" fill="url(#angelWG${uid})" stroke="#c7d2fe" stroke-width="1"><animate attributeName="opacity" values="0.85;0.6;0.85" dur="3s" repeatCount="indefinite"/></path><path d="M66,70 Q88,50 84,30 Q80,20 70,25 Q64,30 66,50 Z" fill="url(#angelWG${uid})" stroke="#c7d2fe" stroke-width="1"><animate attributeName="opacity" values="0.85;0.6;0.85" dur="3s" repeatCount="indefinite"/></path><path d="M14,65 Q-2,48 2,35 Q6,28 12,32" fill="#f1f5f9" opacity="0.5"/><path d="M66,65 Q82,48 78,35 Q74,28 68,32" fill="#f1f5f9" opacity="0.5"/><ellipse cx="2" cy="27" rx="5" ry="2" fill="rgba(255,255,255,0.32)" transform="rotate(30 2 27)"/><ellipse cx="78" cy="27" rx="5" ry="2" fill="rgba(255,255,255,0.32)" transform="rotate(-30 78 27)"/></g>`,
      // ── fire_wings: energy — amber→orange→ember matte gradient, two-tone outer/inner ──
      fire_wings:   `<g><defs><linearGradient id="fireWOG${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#fbbf24"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#c2410c"/></linearGradient><linearGradient id="fireWIG${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs><path d="M14,72 Q-6,52 -2,34 Q2,24 12,30 Q16,36 14,55 Z" fill="url(#fireWOG${uid})" opacity="0.8"><animate attributeName="opacity" values="0.8;0.5;0.8" dur="0.6s" repeatCount="indefinite"/></path><path d="M14,68 Q0,50 4,38 Q8,32 14,38" fill="url(#fireWIG${uid})" opacity="0.6"><animate attributeName="opacity" values="0.6;0.3;0.6" dur="0.4s" repeatCount="indefinite"/></path><path d="M66,72 Q86,52 82,34 Q78,24 68,30 Q64,36 66,55 Z" fill="url(#fireWOG${uid})" opacity="0.8"><animate attributeName="opacity" values="0.8;0.5;0.8" dur="0.6s" repeatCount="indefinite"/></path><path d="M66,68 Q80,50 76,38 Q72,32 66,38" fill="url(#fireWIG${uid})" opacity="0.6"><animate attributeName="opacity" values="0.6;0.3;0.6" dur="0.4s" repeatCount="indefinite"/></path><path d="M14,70 Q2,56 6,42" fill="none" stroke="#fef08a" stroke-width="1" opacity="0.4"/><path d="M66,70 Q78,56 74,42" fill="none" stroke="#fef08a" stroke-width="1" opacity="0.4"/></g>`,
      // ── crystal_wings: translucent energy — light lavender→violet gradient; fill-opacity anim still multiplies correctly ──
      crystal_wings:`<g opacity="0.75"><defs><linearGradient id="crystWG${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ede9fe"/><stop offset="50%" stop-color="#c4b5fd"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs><path d="M14,72 Q-4,48 2,30 Q6,22 14,28 Q18,36 14,56 Z" fill="url(#crystWG${uid})" stroke="#a78bfa" stroke-width="1"><animate attributeName="fill-opacity" values="0.7;0.4;0.7" dur="2.5s" repeatCount="indefinite"/></path><path d="M66,72 Q84,48 78,30 Q74,22 66,28 Q62,36 66,56 Z" fill="url(#crystWG${uid})" stroke="#a78bfa" stroke-width="1"><animate attributeName="fill-opacity" values="0.7;0.4;0.7" dur="2.5s" repeatCount="indefinite"/></path><ellipse cx="4" cy="34" rx="3" ry="5" fill="rgba(255,255,255,0.22)" transform="rotate(15 4 34)"/><ellipse cx="76" cy="34" rx="3" ry="5" fill="rgba(255,255,255,0.22)" transform="rotate(-15 76 34)"/><circle cx="4" cy="40" r="1.5" fill="#e0e7ff"><animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite"/></circle><circle cx="76" cy="40" r="1.5" fill="#e0e7ff"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.2s" repeatCount="indefinite"/></circle><circle cx="0" cy="50" r="1" fill="#fde68a"><animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.8s" repeatCount="indefinite"/></circle><circle cx="80" cy="50" r="1" fill="#fde68a"><animate attributeName="opacity" values="0.1;0.8;0.1" dur="1.8s" repeatCount="indefinite"/></circle></g>`,
      // ── shadow_wings: dark energy/cloth — indigo→deep dark gradient, very subtle highlight ──
      shadow_wings: `<g opacity="0.7"><defs><linearGradient id="shadowWG${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#312e81"/><stop offset="60%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#0c0826"/></linearGradient></defs><path d="M14,72 Q-8,48 -2,28 Q2,18 12,26 Q18,34 14,54 Z" fill="url(#shadowWG${uid})" stroke="#312e81" stroke-width="1"><animate attributeName="opacity" values="0.7;0.4;0.7" dur="2s" repeatCount="indefinite"/></path><path d="M66,72 Q88,48 82,28 Q78,18 68,26 Q62,34 66,54 Z" fill="url(#shadowWG${uid})" stroke="#312e81" stroke-width="1"><animate attributeName="opacity" values="0.7;0.4;0.7" dur="2s" repeatCount="indefinite"/></path><path d="M14,66 Q0,50 6,38" fill="none" stroke="#4338ca" stroke-width="1" opacity="0.4"><animate attributeName="stroke-opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite"/></path><path d="M66,66 Q80,50 74,38" fill="none" stroke="#4338ca" stroke-width="1" opacity="0.4"><animate attributeName="stroke-opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite"/></path><ellipse cx="0" cy="30" rx="4" ry="2" fill="rgba(255,255,255,0.1)" transform="rotate(25 0 30)"/><ellipse cx="80" cy="30" rx="4" ry="2" fill="rgba(255,255,255,0.1)" transform="rotate(-25 80 30)"/></g>`,
    };
    const wingsRendered = wingsAcc && wingsSVG[wingsAcc] ? wingsSVG[wingsAcc] : '';

    // Hair — front layer (over shaded scalp, under face) + back layer (behind head, over coat)
    // Reusable snug "cap" silhouette shared by several styles — hairline stays well above cy32
    // at the eye x-centres (34/46) so the face always reads clearly.
    const HAIR_CAP = `<path d="M18,40 Q17,25 25,18 Q32,13 40,13 Q48,13 55,18 Q63,25 62,40 Q59,27 52,28 Q46,23 40,23 Q34,23 28,28 Q21,27 18,40 Z" fill="url(#hairG${uid})"/>`;
    const hairSVG = {
      none: '',
      short: `${HAIR_CAP}`,
      tousled: `${HAIR_CAP}<circle cx="30" cy="14" r="4" fill="url(#hairG${uid})"/><circle cx="40" cy="9" r="4.5" fill="url(#hairG${uid})"/><circle cx="50" cy="14" r="4" fill="url(#hairG${uid})"/>`,
      side_part: `${HAIR_CAP}<path d="M46,11 Q53,8 57,14 Q51,13 46,15 Z" fill="url(#hairG${uid})"/><path d="M29,13 L35,20" stroke="${hairLo}" stroke-width="1.1" fill="none" opacity="0.55"/>`,
      bob: `${HAIR_CAP}<path d="M19,24 Q15,26 15,37 Q15,49 20,53 Q23,49 22,37 Q22,28 19,24 Z" fill="url(#hairG${uid})"/><path d="M61,24 Q65,26 65,37 Q65,49 60,53 Q57,49 58,37 Q58,28 61,24 Z" fill="url(#hairG${uid})"/>`,
      curly: `<circle cx="25" cy="26" r="4.6" fill="url(#hairG${uid})"/><circle cx="23" cy="18" r="4.6" fill="url(#hairG${uid})"/><circle cx="29" cy="12" r="5" fill="url(#hairG${uid})"/><circle cx="36" cy="9" r="5" fill="url(#hairG${uid})"/><circle cx="44" cy="9" r="5" fill="url(#hairG${uid})"/><circle cx="51" cy="12" r="5" fill="url(#hairG${uid})"/><circle cx="57" cy="18" r="4.6" fill="url(#hairG${uid})"/><circle cx="55" cy="26" r="4.6" fill="url(#hairG${uid})"/>`,
      afro: `<path d="M13,44 Q5,10 40,6 Q75,10 67,44 Q61,23 53,26 Q47,19 40,20 Q33,19 27,26 Q19,23 13,44 Z" fill="url(#hairG${uid})"/>`,
      spiky: `${HAIR_CAP}<polygon points="24,16 26,4 29,17" fill="url(#hairG${uid})"/><polygon points="33,13 36,2 38,14" fill="url(#hairG${uid})"/><polygon points="42,13 45,2 47,14" fill="url(#hairG${uid})"/><polygon points="51,16 54,4 56,17" fill="url(#hairG${uid})"/>`,
      mohawk: `<polygon points="34,18 37,2 40,18" fill="url(#hairG${uid})"/><polygon points="38,17 41,0 43,17" fill="url(#hairG${uid})"/><polygon points="41,18 44,2 47,18" fill="url(#hairG${uid})"/><rect x="16" y="30" width="3" height="8" rx="1.5" fill="url(#hairG${uid})"/><rect x="61" y="30" width="3" height="8" rx="1.5" fill="url(#hairG${uid})"/>`,
      ponytail: `${HAIR_CAP}`,
      bun: `${HAIR_CAP}`,
      long: `${HAIR_CAP}`,
    };
    const hairBackSVG = {
      ponytail: `<path d="M58,22 Q70,26 68,44 Q66,60 60,70 Q64,55 62,40 Q60,28 55,20 Z" fill="url(#hairG${uid})"/><ellipse cx="58" cy="23" rx="4" ry="3" fill="url(#hairG${uid})"/>`,
      bun: `<circle cx="46" cy="10" r="6" fill="url(#hairG${uid})"/><circle cx="46" cy="10" r="6" fill="none" stroke="${hairLo}" stroke-width="0.8" opacity="0.5"/>`,
      long: `<path d="M17,20 Q10,40 12,60 Q13,72 18,78 Q14,60 16,40 Q17,28 20,20 Z" fill="url(#hairG${uid})"/><path d="M63,20 Q70,40 68,60 Q67,72 62,78 Q66,60 64,40 Q63,28 60,20 Z" fill="url(#hairG${uid})"/>`,
    };
    const hairFront = hair && hairSVG[hair] ? hairSVG[hair] : '';
    const hairBack  = hair && hairBackSVG[hair] ? hairBackSVG[hair] : '';

    // Emotion layers
    const eyes = {
      neutral:  `<circle cx="34" cy="36" r="3.5" fill="#1e1b4b"/><circle cx="46" cy="36" r="3.5" fill="#1e1b4b"/><circle cx="35.2" cy="34.8" r="1.1" fill="#fff"/><circle cx="47.2" cy="34.8" r="1.1" fill="#fff"/>`,
      happy:    `<path d="M31,36 Q34,32 37,36" stroke="#1e1b4b" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M43,36 Q46,32 49,36" stroke="#1e1b4b" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
      excited:  `<circle cx="34" cy="36" r="4.5" fill="#1e1b4b"/><circle cx="46" cy="36" r="4.5" fill="#1e1b4b"/><circle cx="35.5" cy="34.5" r="1.6" fill="#fff"/><circle cx="47.5" cy="34.5" r="1.6" fill="#fff"/>`,
      wrong:    `<path d="M31,34 Q34,38 37,34" stroke="#1e1b4b" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M43,34 Q46,38 49,34" stroke="#1e1b4b" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    };
    const brows = {
      neutral:  `<path d="M30,29 Q34,27 38,29" stroke="#7c4a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M42,29 Q46,27 50,29" stroke="#7c4a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
      happy:    `<path d="M30,28 Q34,26 38,28" stroke="#7c4a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M42,28 Q46,26 50,28" stroke="#7c4a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
      excited:  `<path d="M30,27 L34,25 L38,27" stroke="#7c4a2a" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M42,27 L46,25 L50,27" stroke="#7c4a2a" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      wrong:    `<path d="M30,31 Q34,29 38,31" stroke="#7c4a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M42,31 Q46,29 50,31" stroke="#7c4a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    };
    const mouths = {
      neutral:  `<path d="M35,44 Q40,47 45,44" stroke="#b83232" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
      happy:    `<path d="M33,44 Q40,50 47,44" stroke="#b83232" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      excited:  `<path d="M33,44 Q40,52 47,44" stroke="#b83232" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
      wrong:    `<path d="M35,48 Q40,44 45,48" stroke="#b83232" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    };

    // Sparkles for excited
    const sparkles = reaction === 'excited'
      ? `<g opacity="0.85"><text x="57" y="22" font-size="10">✦</text><text x="4" y="28" font-size="7">✦</text><text x="62" y="38" font-size="6">✦</text></g>`
      : '';
    // Dizzy for wrong
    const dizzy = reaction === 'wrong'
      ? `<path d="M55,18 Q60,14 58,20 Q62,16 56,22" stroke="#dc2626" stroke-width="1.5" fill="none" stroke-linecap="round"/>` : '';

    // Head accessories
    const headAccSVG = {
      // ── goggles_head: metal/plastic band — gradient + highlight ellipse ──
      goggles_head: `<defs><linearGradient id="gogBG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#b8c7d4"/><stop offset="50%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#64748b"/></linearGradient></defs><rect x="22" y="20" width="36" height="12" rx="6" fill="url(#gogBG${uid})" opacity="0.7"/><circle cx="34" cy="26" r="5" fill="none" stroke="#64748b" stroke-width="2.5"/><circle cx="46" cy="26" r="5" fill="none" stroke="#64748b" stroke-width="2.5"/><line x1="39" y1="26" x2="41" y2="26" stroke="#64748b" stroke-width="2"/><ellipse cx="26" cy="22" rx="4" ry="1.5" fill="rgba(255,255,255,0.38)"/>`,
      // ── grad_cap: dark cloth — gradient on mortar board + brim, soft highlight ──
      grad_cap:     `<defs><linearGradient id="gcG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3730a3"/><stop offset="100%" stop-color="#14113a"/></linearGradient><linearGradient id="gcBG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4338ca"/><stop offset="100%" stop-color="#1e1b4b"/></linearGradient></defs><rect x="24" y="15" width="32" height="5" rx="2" fill="url(#gcG${uid})"/><polygon points="40,8 18,17 40,17 62,17" fill="url(#gcBG${uid})"/><line x1="56" y1="17" x2="58" y2="26" stroke="#6366f1" stroke-width="1.5"/><circle cx="58" cy="27" r="2.5" fill="#6366f1"/><ellipse cx="34" cy="13" rx="6" ry="1.5" fill="rgba(255,255,255,0.18)" transform="rotate(-25 34 13)"/>`,
      // ── top_hat: dark cloth — single gradient, highlight on crown face ──
      top_hat:      `<defs><linearGradient id="thG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2d2a70"/><stop offset="100%" stop-color="#0d0c25"/></linearGradient></defs><rect x="28" y="6" width="24" height="16" rx="2" fill="url(#thG${uid})"/><rect x="20" y="20" width="40" height="4" rx="2" fill="url(#thG${uid})"/><ellipse cx="33" cy="9" rx="5" ry="1.8" fill="rgba(255,255,255,0.16)"/>`,
      // ── hard_hat: yellow plastic — gradient crown + brim + specular ──
      hard_hat:     `<defs><linearGradient id="hhHG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fde68a"/><stop offset="50%" stop-color="#eab308"/><stop offset="100%" stop-color="#a16207"/></linearGradient><linearGradient id="hhBG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#d97706"/><stop offset="100%" stop-color="#92400e"/></linearGradient></defs><path d="M22,24 Q40,10 58,24 Z" fill="url(#hhHG${uid})"/><rect x="18" y="22" width="44" height="5" rx="2" fill="url(#hhBG${uid})"/><ellipse cx="32" cy="15" rx="7" ry="2.5" fill="rgba(255,255,255,0.38)" transform="rotate(-12 32 15)"/>`,
      // ── beanie: soft cloth — matte gradient, no specular ──
      beanie:       `<defs><linearGradient id="bnG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#818cf8"/><stop offset="60%" stop-color="#6366f1"/><stop offset="100%" stop-color="#4338ca"/></linearGradient><linearGradient id="bnBG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4f46e5"/><stop offset="100%" stop-color="#3730a3"/></linearGradient></defs><path d="M21,28 Q21,10 40,10 Q59,10 59,28 Z" fill="url(#bnG${uid})"/><rect x="18" y="26" width="44" height="5" rx="3" fill="url(#bnBG${uid})"/><circle cx="40" cy="10" r="5" fill="#818cf8"/><ellipse cx="28" cy="16" rx="6" ry="2" fill="rgba(255,255,255,0.22)" transform="rotate(-20 28 16)"/>`,
      // ── crown: metal/gem — stronger gradient + specular polygon + gem specular dot ──
      crown:        `<defs><linearGradient id="crnG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fde68a"/><stop offset="50%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></linearGradient></defs><polygon points="40,8 28,20 32,16 40,20 48,16 52,20" fill="url(#crnG${uid})"/><circle cx="40" cy="9" r="2.5" fill="#fcd34d"/><circle cx="28" cy="20" r="2" fill="#fcd34d"/><circle cx="52" cy="20" r="2" fill="#fcd34d"/><polygon points="37,11 34,16 36,14" fill="rgba(255,255,255,0.42)"/><circle cx="39.5" cy="8.2" r="0.9" fill="rgba(255,255,255,0.75)"/>`,
      // ── donut_crown: colorful donuts — gradient on band only (donuts too small at 44px) ──
      donut_crown:  `<defs><linearGradient id="dnCG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#6d28d9"/></linearGradient></defs><rect x="22" y="19" width="36" height="5" rx="2" fill="url(#dnCG${uid})"/><circle cx="29" cy="14" r="5.5" fill="#92400e"/><circle cx="29" cy="14" r="2.8" fill="${skin}"/><circle cx="27" cy="12" r="0.9" fill="#fbbf24"/><circle cx="31" cy="12" r="0.9" fill="#f87171"/><circle cx="30" cy="16.5" r="0.9" fill="#6ee7b7"/><circle cx="40" cy="8.5" r="6.5" fill="#f472b6"/><circle cx="40" cy="8.5" r="3.2" fill="${skin}"/><circle cx="37.5" cy="6.5" r="1" fill="#fbbf24"/><circle cx="42.5" cy="6.5" r="1" fill="#a78bfa"/><circle cx="40" cy="12" r="1" fill="#6ee7b7"/><circle cx="51" cy="14" r="5.5" fill="#f87171"/><circle cx="51" cy="14" r="2.8" fill="${skin}"/><circle cx="49" cy="12" r="0.9" fill="#a78bfa"/><circle cx="53" cy="12" r="0.9" fill="#fbbf24"/><circle cx="51" cy="16.5" r="0.9" fill="#6ee7b7"/>`,
      // ── party_hat: paper/cloth — gradient top-to-base, soft highlight stripe ──
      party_hat:    `<defs><linearGradient id="phG${uid}" x1="40" y1="5" x2="40" y2="23" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#fb7185"/><stop offset="100%" stop-color="#be185d"/></linearGradient></defs><polygon points="40,5 27,23 53,23" fill="url(#phG${uid})"/><line x1="40" y1="5" x2="30" y2="23" stroke="#fbbf24" stroke-width="2" opacity="0.6"/><line x1="40" y1="5" x2="50" y2="23" stroke="#60a5fa" stroke-width="2" opacity="0.6"/><ellipse cx="40" cy="23" rx="13" ry="2.5" fill="#a21caf" opacity="0.8"/><circle cx="40" cy="5" r="2.5" fill="#fbbf24"/><path d="M52,20 Q58,15 56,9" stroke="#fbbf24" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M28,20 Q22,15 24,9" stroke="#4ade80" stroke-width="1.5" fill="none" stroke-linecap="round"/><ellipse cx="36" cy="10" rx="3" ry="5" fill="rgba(255,255,255,0.18)" transform="rotate(-5 36 10)"/>`,
      // ── wizard_hat: cloth — matte gradient brim + body, no specular ──
      wizard_hat:   `<defs><linearGradient id="wzG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6d28d9"/><stop offset="100%" stop-color="#2e1065"/></linearGradient><linearGradient id="wzBG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5b21b6"/><stop offset="100%" stop-color="#2e1065"/></linearGradient></defs><ellipse cx="40" cy="21" rx="16" ry="4" fill="url(#wzBG${uid})"/><polygon points="40,2 26,22 54,22" fill="url(#wzG${uid})"/><circle cx="36" cy="12" r="1.8" fill="#fbbf24"/><circle cx="44" cy="9" r="1.3" fill="#a5f3fc" opacity="0.9"/><circle cx="46" cy="16" r="1.5" fill="#fbbf24" opacity="0.85"/><circle cx="32" cy="16" r="1.2" fill="#a5f3fc" opacity="0.9"/><ellipse cx="36" cy="8" rx="3" ry="5" fill="rgba(255,255,255,0.14)" transform="rotate(-5 36 8)"/>`,
      // ── flower_crown: gradient on main orange flower + highlight dot on pink ──
      flower_crown: `<defs><linearGradient id="flOG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fdba74"/><stop offset="100%" stop-color="#ea580c"/></linearGradient></defs><path d="M21,25 Q31,13 40,13 Q49,13 59,25" stroke="#16a34a" stroke-width="2.5" fill="none"/><circle cx="27" cy="19" r="3.5" fill="#fda4af"/><circle cx="27" cy="19" r="1.6" fill="#fef9c3"/><circle cx="40" cy="13" r="4" fill="url(#flOG${uid})"/><circle cx="40" cy="13" r="1.8" fill="#fef9c3"/><circle cx="53" cy="19" r="3.5" fill="#c4b5fd"/><circle cx="53" cy="19" r="1.6" fill="#fef9c3"/><circle cx="33" cy="15" r="2.5" fill="#86efac"/><circle cx="33" cy="15" r="1.1" fill="#fef9c3"/><circle cx="47" cy="15" r="2.5" fill="#7dd3fc"/><circle cx="47" cy="15" r="1.1" fill="#fef9c3"/><ellipse cx="26" cy="17.5" rx="2.5" ry="1" fill="rgba(255,255,255,0.4)"/>`,
      // ── halo: metal/gem ring — specular arc + bright dot (no gradient needed on stroke) ──
      halo:         `<ellipse cx="40" cy="11" rx="15" ry="4" fill="none" stroke="#fbbf24" stroke-width="2.5"/><ellipse cx="40" cy="11" rx="15" ry="4" fill="rgba(251,191,36,0.12)"/><line x1="33" y1="11" x2="34" y2="20" stroke="#fbbf24" stroke-width="1.5" opacity="0.45"/><line x1="47" y1="11" x2="46" y2="20" stroke="#fbbf24" stroke-width="1.5" opacity="0.45"/><ellipse cx="29" cy="9.5" rx="4.5" ry="1" fill="rgba(255,255,255,0.52)" transform="rotate(-20 29 9.5)"/><circle cx="27.5" cy="9" r="0.9" fill="rgba(255,255,255,0.8)"/>`,
      // ── ninja_headband: dark cloth — gradient band, soft highlight strip ──
      ninja_headband:`<defs><linearGradient id="njG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2d2b6e"/><stop offset="100%" stop-color="#0f0e2e"/></linearGradient></defs><rect x="18" y="23" width="44" height="7" rx="3" fill="url(#njG${uid})"/><rect x="18" y="23" width="44" height="2.5" rx="1.5" fill="#3730a3" opacity="0.6"/><circle cx="40" cy="26.5" r="4" fill="#ef4444"/><circle cx="40" cy="26.5" r="2" fill="#dc2626" opacity="0.7"/><path d="M57,26 Q62,22 61,17" stroke="#1e1b4b" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M57,30 Q63,28 62,23" stroke="#1e1b4b" stroke-width="2.5" fill="none" stroke-linecap="round"/><ellipse cx="28" cy="24" rx="8" ry="1.2" fill="rgba(255,255,255,0.14)"/>`,
      // ── space_helmet: glass/metal — radial gradient fill + specular ellipse + dot ──
      space_helmet: `<defs><radialGradient id="spHG${uid}" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.28"/><stop offset="60%" stop-color="#93c5fd" stop-opacity="0.15"/><stop offset="100%" stop-color="#3b82f6" stop-opacity="0.22"/></radialGradient></defs><ellipse cx="40" cy="32" rx="26" ry="26" fill="url(#spHG${uid})" stroke="#93c5fd" stroke-width="2"/><ellipse cx="40" cy="32" rx="23" ry="23" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/><ellipse cx="32" cy="24" rx="4" ry="6" fill="rgba(255,255,255,0.15)" transform="rotate(-15 32 24)"/><ellipse cx="24" cy="20" rx="5" ry="3" fill="rgba(255,255,255,0.32)" transform="rotate(-20 24 20)"/><circle cx="22" cy="18" r="1.3" fill="rgba(255,255,255,0.65)"/>`,
      // ── chef_hat: white cloth — matte gradient, soft fabric highlight ──
      chef_hat:     `<defs><linearGradient id="chfG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#cbd5e1"/></linearGradient><linearGradient id="chfBG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#b8c4d0"/></linearGradient></defs><ellipse cx="40" cy="22" rx="14" ry="3" fill="url(#chfBG${uid})"/><rect x="28" y="8" width="24" height="16" rx="12" fill="url(#chfG${uid})" stroke="#e2e8f0" stroke-width="1"/><ellipse cx="40" cy="6" rx="10" ry="6" fill="#ffffff"/><ellipse cx="34" cy="9" rx="4" ry="2" fill="rgba(255,255,255,0.65)"/>`,
      // ── pirate_hat: dark cloth — gradient crown + brim, soft left-side highlight ──
      pirate_hat:   `<defs><linearGradient id="pirG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2d2b6e"/><stop offset="100%" stop-color="#0d0c25"/></linearGradient><linearGradient id="pirBG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4b5563"/><stop offset="100%" stop-color="#1f2937"/></linearGradient></defs><path d="M18,24 Q24,8 40,6 Q56,8 62,24 Z" fill="url(#pirG${uid})"/><path d="M20,24 Q40,20 60,24" fill="url(#pirG${uid})"/><rect x="18" y="22" width="44" height="4" rx="2" fill="url(#pirBG${uid})"/><path d="M36,10 L38,16 L34,16 Z" fill="#fbbf24" opacity="0.9"/><path d="M40,10 L42,16 L38,16 Z" fill="#fbbf24" opacity="0.9"/><ellipse cx="29" cy="11" rx="5" ry="2.5" fill="rgba(255,255,255,0.14)" transform="rotate(-15 29 11)"/>`,
      // ── headphones: plastic/metal — gradient cups + gradient cushions, specular ellipses ──
      headphones:   `<defs><linearGradient id="hpBG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#374151"/><stop offset="100%" stop-color="#111827"/></linearGradient><linearGradient id="hpCG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#818cf8"/><stop offset="100%" stop-color="#4338ca"/></linearGradient></defs><path d="M18,36 Q18,16 40,16 Q62,16 62,36" fill="none" stroke="#374151" stroke-width="3"/><rect x="12" y="32" width="10" height="14" rx="5" fill="url(#hpBG${uid})"/><rect x="58" y="32" width="10" height="14" rx="5" fill="url(#hpBG${uid})"/><rect x="14" y="34" width="6" height="10" rx="3" fill="url(#hpCG${uid})"/><rect x="60" y="34" width="6" height="10" rx="3" fill="url(#hpCG${uid})"/><ellipse cx="15" cy="35" rx="2" ry="1.5" fill="rgba(255,255,255,0.32)"/><ellipse cx="61" cy="35" rx="2" ry="1.5" fill="rgba(255,255,255,0.32)"/>`,
      // ── cat_ears: soft — gradient outer ears, highlight stripe on each ──
      cat_ears:     `<defs><linearGradient id="catEG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fb87c4"/><stop offset="100%" stop-color="#db2777"/></linearGradient></defs><polygon points="22,24 18,8 32,20" fill="url(#catEG${uid})"/><polygon points="23,22 20,12 30,20" fill="#fda4af"/><polygon points="58,24 62,8 48,20" fill="url(#catEG${uid})"/><polygon points="57,22 60,12 50,20" fill="#fda4af"/><ellipse cx="22" cy="15" rx="2" ry="3.5" fill="rgba(255,255,255,0.3)" transform="rotate(-15 22 15)"/><ellipse cx="58" cy="15" rx="2" ry="3.5" fill="rgba(255,255,255,0.3)" transform="rotate(15 58 15)"/>`,
      // ── bunny_ears: soft — gradient outer ears, highlight on upper tips ──
      bunny_ears:   `<defs><linearGradient id="bunG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fecdd3"/><stop offset="100%" stop-color="#f9a8b8"/></linearGradient></defs><ellipse cx="30" cy="8" rx="5" ry="14" fill="url(#bunG${uid})" transform="rotate(-10 30 8)"/><ellipse cx="30" cy="8" rx="3" ry="11" fill="#fce7f3" transform="rotate(-10 30 8)"/><ellipse cx="50" cy="8" rx="5" ry="14" fill="url(#bunG${uid})" transform="rotate(10 50 8)"/><ellipse cx="50" cy="8" rx="3" ry="11" fill="#fce7f3" transform="rotate(10 50 8)"/><ellipse cx="29" cy="1" rx="2" ry="3.5" fill="rgba(255,255,255,0.42)" transform="rotate(-10 29 1)"/><ellipse cx="51" cy="1" rx="2" ry="3.5" fill="rgba(255,255,255,0.42)" transform="rotate(10 51 1)"/>`,
      // ── dino_spikes: rigid — gradient on all three, highlight on tallest center spike ──
      dino_spikes:  `<defs><linearGradient id="dinG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#86efac"/><stop offset="100%" stop-color="#16a34a"/></linearGradient><linearGradient id="dinCG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4ade80"/><stop offset="100%" stop-color="#15803d"/></linearGradient></defs><polygon points="28,20 32,6 36,20" fill="url(#dinG${uid})"/><polygon points="36,18 40,2 44,18" fill="url(#dinCG${uid})"/><polygon points="44,20 48,6 52,20" fill="url(#dinG${uid})"/><ellipse cx="32" cy="10" rx="1.5" ry="3.5" fill="rgba(255,255,255,0.35)" transform="rotate(-8 32 10)"/>`,
      // ── unicorn_horn: magical/gem — gradient + specular sliver + tip dot ──
      unicorn_horn: `<defs><linearGradient id="uniG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f3abff"/><stop offset="50%" stop-color="#e879f9"/><stop offset="100%" stop-color="#a21caf"/></linearGradient></defs><polygon points="40,0 36,18 44,18" fill="url(#uniG${uid})"/><line x1="38" y1="14" x2="42" y2="12" stroke="#fbbf24" stroke-width="1" opacity="0.7"/><line x1="37" y1="10" x2="43" y2="8" stroke="#c4b5fd" stroke-width="1" opacity="0.7"/><line x1="38" y1="6" x2="42" y2="4" stroke="#fbbf24" stroke-width="1" opacity="0.7"/><circle cx="40" cy="1" r="1.5" fill="#fbbf24"/><ellipse cx="38.5" cy="7" rx="1" ry="4" fill="rgba(255,255,255,0.42)" transform="rotate(-5 38.5 7)"/><circle cx="38" cy="1.5" r="0.8" fill="rgba(255,255,255,0.72)"/>`,
      // ── propeller_cap: cloth cap + metal propeller — gradient cap + brim, soft highlight ──
      propeller_cap:`<defs><linearGradient id="prpG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f87171"/><stop offset="100%" stop-color="#b91c1c"/></linearGradient><linearGradient id="prpBG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#dc2626"/><stop offset="100%" stop-color="#991b1b"/></linearGradient></defs><path d="M23,24 Q23,16 40,16 Q57,16 57,24 Z" fill="url(#prpG${uid})"/><rect x="20" y="22" width="40" height="4" rx="2" fill="url(#prpBG${uid})"/><circle cx="40" cy="16" r="2" fill="#94a3b8"/><line x1="34" y1="12" x2="46" y2="12" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/><line x1="37" y1="9" x2="43" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/><ellipse cx="30" cy="18.5" rx="5" ry="2" fill="rgba(255,255,255,0.24)" transform="rotate(-15 30 18.5)"/>`,
      // ── tiara: metal/gem — gradient base band + specular dots on each gem ──
      tiara:        `<defs><linearGradient id="tiaBG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#d946ef"/><stop offset="100%" stop-color="#7e22ce"/></linearGradient></defs><path d="M24,22 L28,14 L33,20 L40,10 L47,20 L52,14 L56,22" fill="none" stroke="#e879f9" stroke-width="2"/><circle cx="40" cy="10" r="2.5" fill="#c084fc"/><circle cx="28" cy="14" r="1.5" fill="#f0abfc"/><circle cx="52" cy="14" r="1.5" fill="#f0abfc"/><rect x="24" y="21" width="32" height="3" rx="1.5" fill="url(#tiaBG${uid})"/><circle cx="39.5" cy="9.2" r="0.9" fill="rgba(255,255,255,0.7)"/><circle cx="27.5" cy="13.5" r="0.7" fill="rgba(255,255,255,0.6)"/><circle cx="51.5" cy="13.5" r="0.7" fill="rgba(255,255,255,0.6)"/>`,
      // ── viking_helmet: metal — gradient dome + brim + specular ellipse + dot ──
      viking_helmet:`<defs><linearGradient id="vikG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a8a29e"/><stop offset="50%" stop-color="#78716c"/><stop offset="100%" stop-color="#44403c"/></linearGradient><linearGradient id="vikBG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#79726d"/><stop offset="100%" stop-color="#3b3330"/></linearGradient></defs><path d="M20,28 Q20,14 40,12 Q60,14 60,28 Z" fill="url(#vikG${uid})"/><rect x="18" y="26" width="44" height="4" rx="2" fill="url(#vikBG${uid})"/><path d="M20,24 Q14,16 10,6" stroke="#fef3c7" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M60,24 Q66,16 70,6" stroke="#fef3c7" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="30" cy="16" rx="5" ry="2.5" fill="rgba(255,255,255,0.28)" transform="rotate(-15 30 16)"/><circle cx="28.5" cy="14.5" r="1.3" fill="rgba(255,255,255,0.48)"/>`,
      // ── antenna: metal pole gradient stroke + static specular over animated tip ──
      antenna:      `<defs><linearGradient id="antLG${uid}" x1="40" y1="18" x2="40" y2="2" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#64748b"/><stop offset="100%" stop-color="#b0bec5"/></linearGradient></defs><line x1="40" y1="18" x2="40" y2="2" stroke="url(#antLG${uid})" stroke-width="1.5"/><circle cx="40" cy="2" r="3.5" fill="#4ade80"><animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite"/></circle><circle cx="39" cy="1" r="1" fill="rgba(255,255,255,0.55)"/>`,
      // ── ANIMATED LEGENDARY HEAD ITEMS ──
      // ── flame_crown: gradient on outer polygon fill; all <animate> untouched ──
      flame_crown:  `<defs><linearGradient id="flmG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fde68a"/><stop offset="50%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#d97706"/></linearGradient></defs><polygon points="40,4 28,18 32,13 36,18 40,8 44,18 48,13 52,18" fill="url(#flmG${uid})"><animate attributeName="d" values="M40,4 L28,18 L32,13 L36,18 L40,8 L44,18 L48,13 L52,18;M40,2 L28,18 L33,11 L37,18 L40,6 L43,18 L47,11 L52,18;M40,4 L28,18 L32,13 L36,18 L40,8 L44,18 L48,13 L52,18" dur="0.4s" repeatCount="indefinite" attributeType="XML"/></polygon><polygon points="40,7 31,18 35,14 40,18 45,14 49,18" fill="#ef4444" opacity="0.8"><animate attributeName="opacity" values="0.8;0.5;0.8" dur="0.3s" repeatCount="indefinite"/></polygon><polygon points="40,10 35,18 40,15 45,18" fill="#fef08a" opacity="0.9"><animate attributeName="opacity" values="0.9;0.6;0.9" dur="0.5s" repeatCount="indefinite"/></polygon>`,
      // ── ice_crown: gradient on main polygon + base band; all <animate> untouched; specular triangle ──
      ice_crown:    `<defs><linearGradient id="iceCG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#bfdbfe"/><stop offset="50%" stop-color="#93c5fd"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient><linearGradient id="iceBG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#2563eb"/></linearGradient></defs><polygon points="40,6 26,20 33,16 40,20 47,16 54,20" fill="url(#iceCG${uid})" opacity="0.8"/><polygon points="40,6 26,20 33,16 40,20 47,16 54,20" fill="none" stroke="#bfdbfe" stroke-width="1.5"><animate attributeName="stroke-opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/></polygon><circle cx="30" cy="16" r="1.5" fill="#e0f2fe"><animate attributeName="r" values="1.5;2;1.5" dur="1.5s" repeatCount="indefinite"/></circle><circle cx="40" cy="8" r="2" fill="#dbeafe"><animate attributeName="r" values="2;2.8;2" dur="2s" repeatCount="indefinite"/></circle><circle cx="50" cy="16" r="1.5" fill="#e0f2fe"><animate attributeName="r" values="1.5;2;1.5" dur="1.8s" repeatCount="indefinite"/></circle><rect x="24" y="19" width="32" height="3" rx="1.5" fill="url(#iceBG${uid})"/><polygon points="35,8 40,6 38,11" fill="rgba(255,255,255,0.4)"/>`,
      // ── galaxy_halo: already uses url(#galaxyGrad${uid}) rainbow gradient — left intact ──
      galaxy_halo:  `<ellipse cx="40" cy="14" rx="18" ry="5" fill="none" stroke="url(#galaxyGrad${uid})" stroke-width="2.5"><animateTransform attributeName="transform" type="rotate" values="0 40 14;360 40 14" dur="8s" repeatCount="indefinite"/></ellipse><circle cx="26" cy="14" r="1.5" fill="#fbbf24"><animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite"/></circle><circle cx="54" cy="14" r="1" fill="#a78bfa"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/></circle><circle cx="40" cy="9" r="1.2" fill="#f472b6"><animate attributeName="opacity" values="1;0.4;1" dur="0.9s" repeatCount="indefinite"/></circle>`,
    };
    // Face accessories
    const faceAccSVG = {
      // ── glasses: lens radial gradient fills + glint ellipse on left lens ──
      glasses:        `<defs><radialGradient id="glsLG${uid}" cx="35%" cy="32%" r="65%"><stop offset="0%" stop-color="#dbeafe" stop-opacity="0.30"/><stop offset="100%" stop-color="#94a3b8" stop-opacity="0.05"/></radialGradient></defs><circle cx="34" cy="36" r="6" fill="url(#glsLG${uid})"/><circle cx="46" cy="36" r="6" fill="url(#glsLG${uid})"/><circle cx="34" cy="36" r="6" fill="none" stroke="#374151" stroke-width="1.8"/><circle cx="46" cy="36" r="6" fill="none" stroke="#374151" stroke-width="1.8"/><line x1="40" y1="36" x2="40" y2="36" stroke="#374151" stroke-width="1.8"/><line x1="27" y1="34" x2="28" y2="36" stroke="#374151" stroke-width="1.5"/><line x1="52" y1="34" x2="53" y2="36" stroke="#374151" stroke-width="1.5"/><ellipse cx="31.5" cy="33.5" rx="1.5" ry="0.9" fill="rgba(255,255,255,0.48)" transform="rotate(-20 31.5 33.5)"/>`,
      // ── monocle: lens radial gradient fill + glint ──
      monocle:        `<defs><radialGradient id="monLG${uid}" cx="35%" cy="32%" r="65%"><stop offset="0%" stop-color="#fef3c7" stop-opacity="0.28"/><stop offset="100%" stop-color="#78350f" stop-opacity="0.06"/></radialGradient></defs><circle cx="46" cy="36" r="7" fill="url(#monLG${uid})"/><circle cx="46" cy="36" r="7" fill="none" stroke="#78350f" stroke-width="2"/><line x1="51" y1="41" x2="54" y2="48" stroke="#78350f" stroke-width="1.5"/><ellipse cx="43.5" cy="33.5" rx="2" ry="1.1" fill="rgba(255,255,255,0.45)" transform="rotate(-20 43.5 33.5)"/>`,
      // ── safety_goggles: lens gradient fill + glint ──
      safety_goggles: `<defs><linearGradient id="sgG${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#dbeafe"/><stop offset="100%" stop-color="#60a5fa"/></linearGradient></defs><rect x="26" y="30" width="28" height="12" rx="6" fill="url(#sgG${uid})" opacity="0.5" stroke="#3b82f6" stroke-width="1.5"/><line x1="20" y1="36" x2="26" y2="36" stroke="#3b82f6" stroke-width="1.5"/><line x1="54" y1="36" x2="60" y2="36" stroke="#3b82f6" stroke-width="1.5"/><ellipse cx="32" cy="32" rx="5" ry="2" fill="rgba(255,255,255,0.42)" transform="rotate(-5 32 32)"/>`,
      // ── mask: gradient fill top-to-bottom + subtle glint ──
      mask:           `<defs><linearGradient id="mskG${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#cbd5e1"/></linearGradient></defs><rect x="28" y="42" width="24" height="12" rx="4" fill="url(#mskG${uid})" stroke="#94a3b8" stroke-width="1.2"/><line x1="28" y1="46" x2="52" y2="46" stroke="#94a3b8" stroke-width="0.8"/><line x1="28" y1="50" x2="52" y2="50" stroke="#94a3b8" stroke-width="0.8"/><ellipse cx="35" cy="44" rx="4" ry="1.2" fill="rgba(255,255,255,0.45)"/>`,
      // ── sunglasses: dark diagonal gradient fills + enhanced glint ──
      sunglasses:     `<defs><linearGradient id="sglG${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#312e81"/><stop offset="100%" stop-color="#0f0e2e"/></linearGradient></defs><rect x="25" y="32" width="12" height="8" rx="3" fill="url(#sglG${uid})" opacity="0.9"/><rect x="43" y="32" width="12" height="8" rx="3" fill="url(#sglG${uid})" opacity="0.9"/><line x1="37" y1="36" x2="43" y2="36" stroke="#374151" stroke-width="2"/><line x1="19" y1="34" x2="25" y2="36" stroke="#374151" stroke-width="1.8"/><line x1="55" y1="36" x2="61" y2="34" stroke="#374151" stroke-width="1.8"/><rect x="25" y="32" width="12" height="4" rx="2" fill="rgba(255,255,255,0.08)"/><ellipse cx="28.5" cy="33.8" rx="2.5" ry="1" fill="rgba(255,255,255,0.22)" transform="rotate(-8 28.5 33.8)"/>`,
      // ── star_sticker: left flat — too small at 44px to benefit from gradient (spec §4) ──
      star_sticker:   `<path d="M51,37 L52.5,41.5 L57.2,41.5 L53.4,44.2 L54.8,48.8 L51,46.1 L47.2,48.8 L48.6,44.2 L44.8,41.5 L49.5,41.5 Z" fill="#fbbf24" opacity="0.95"/>`,
      // ── magnifying_glass: radial gradient lens fill + keep existing glint ──
      magnifying_glass:`<defs><radialGradient id="magLG${uid}" cx="35%" cy="32%" r="65%"><stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.4"/><stop offset="100%" stop-color="#3b82f6" stop-opacity="0.12"/></radialGradient></defs><circle cx="45" cy="37" r="8" fill="none" stroke="#374151" stroke-width="2.2"/><circle cx="45" cy="37" r="6.5" fill="url(#magLG${uid})"/><line x1="51" y1="43" x2="58" y2="52" stroke="#374151" stroke-width="3" stroke-linecap="round"/><circle cx="43" cy="34.5" r="1.8" fill="white" opacity="0.65"/>`,
      // ── eye_patch: dark gradient + subtle upper-left sheen ──
      eye_patch:      `<defs><linearGradient id="epG${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#312e81"/><stop offset="100%" stop-color="#0f0e2e"/></linearGradient></defs><ellipse cx="34" cy="36" rx="6" ry="5" fill="url(#epG${uid})"/><line x1="28" y1="34" x2="18" y2="30" stroke="#1e1b4b" stroke-width="1.5"/><line x1="40" y1="34" x2="62" y2="30" stroke="#1e1b4b" stroke-width="1.5"/><ellipse cx="31" cy="33.5" rx="2.5" ry="1.2" fill="rgba(255,255,255,0.16)" transform="rotate(-15 31 33.5)"/>`,
      // ── moustache: left flat — small brown curves, too small at 44px (spec §4) ──
      moustache:      `<path d="M32,46 Q28,42 24,44 Q28,46 32,46 Z" fill="#78350f"/><path d="M48,46 Q52,42 56,44 Q52,46 48,46 Z" fill="#78350f"/><path d="M32,46 Q40,48 48,46" fill="#78350f"/>`,
      // ── round_glasses: lens radial gradient fills + glint ellipse on left lens ──
      round_glasses:  `<defs><radialGradient id="rglLG${uid}" cx="35%" cy="32%" r="65%"><stop offset="0%" stop-color="#fef3c7" stop-opacity="0.30"/><stop offset="100%" stop-color="#78350f" stop-opacity="0.05"/></radialGradient></defs><circle cx="33" cy="36" r="7" fill="url(#rglLG${uid})"/><circle cx="47" cy="36" r="7" fill="url(#rglLG${uid})"/><circle cx="33" cy="36" r="7" fill="none" stroke="#78350f" stroke-width="2"/><circle cx="47" cy="36" r="7" fill="none" stroke="#78350f" stroke-width="2"/><line x1="40" y1="36" x2="40" y2="36" stroke="#78350f" stroke-width="2"/><line x1="26" y1="34" x2="20" y2="32" stroke="#78350f" stroke-width="1.5"/><line x1="54" y1="34" x2="60" y2="32" stroke="#78350f" stroke-width="1.5"/><ellipse cx="30" cy="33.5" rx="1.8" ry="1" fill="rgba(255,255,255,0.44)" transform="rotate(-20 30 33.5)"/>`,
      // ── bandaid: left flat — small rotated rect at corner of face (spec §4) ──
      bandaid:        `<rect x="48" y="40" width="12" height="6" rx="2" fill="#fcd34d" transform="rotate(-20 54 43)"/><circle cx="51" cy="42" r="0.6" fill="#92400e" opacity="0.4"/><circle cx="54" cy="42" r="0.6" fill="#92400e" opacity="0.4"/><circle cx="57" cy="42" r="0.6" fill="#92400e" opacity="0.4"/>`,
      // ── blush: left flat — intentionally soft semi-transparent marks (spec §4) ──
      blush:          `<ellipse cx="26" cy="42" rx="5" ry="3" fill="#fda4af" opacity="0.4"/><ellipse cx="54" cy="42" rx="5" ry="3" fill="#fda4af" opacity="0.4"/>`,
      // ── face_paint: left flat — stroke-only path, no fill surface to gradient (spec §4) ──
      face_paint:     `<path d="M50,30 L54,36 L50,36 L54,42" stroke="#fbbf24" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      // ── bubble_gum: radial gradient on bubble + keep existing glint ──
      bubble_gum:     `<defs><radialGradient id="bgmG${uid}" cx="42%" cy="35%" r="60%"><stop offset="0%" stop-color="#fce7f3"/><stop offset="60%" stop-color="#f472b6"/><stop offset="100%" stop-color="#db2777"/></radialGradient></defs><circle cx="40" cy="52" r="6" fill="url(#bgmG${uid})" opacity="0.7"/><circle cx="38" cy="50" r="2" fill="rgba(255,255,255,0.3)"/>`,
      // ── nose_bandage: left flat — very small rect over nose bridge (spec §4) ──
      nose_bandage:   `<rect x="33" y="38" width="14" height="6" rx="2" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.8"/>`,
      // ── ANIMATED LEGENDARY FACE ITEMS ──
      // ── laser_eyes: radial gradient on eye circles; all <animate> untouched ──
      laser_eyes:     `<defs><radialGradient id="lsrEG${uid}" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#fca5a5"/><stop offset="100%" stop-color="#dc2626"/></radialGradient></defs><line x1="34" y1="36" x2="10" y2="50" stroke="#ef4444" stroke-width="2" opacity="0.7"><animate attributeName="opacity" values="0.7;0.2;0.7" dur="0.15s" repeatCount="indefinite"/></line><line x1="46" y1="36" x2="70" y2="50" stroke="#ef4444" stroke-width="2" opacity="0.7"><animate attributeName="opacity" values="0.7;0.2;0.7" dur="0.15s" repeatCount="indefinite"/></line><circle cx="34" cy="36" r="3" fill="url(#lsrEG${uid})" opacity="0.5"><animate attributeName="r" values="3;4;3" dur="0.3s" repeatCount="indefinite"/></circle><circle cx="46" cy="36" r="3" fill="url(#lsrEG${uid})" opacity="0.5"><animate attributeName="r" values="3;4;3" dur="0.3s" repeatCount="indefinite"/></circle>`,
      // ── diamond_monocle: gradient lens fill + glint; all <animate> untouched ──
      diamond_monocle:`<defs><radialGradient id="dmLG${uid}" cx="35%" cy="32%" r="65%"><stop offset="0%" stop-color="#fef3c7" stop-opacity="0.32"/><stop offset="100%" stop-color="#f59e0b" stop-opacity="0.08"/></radialGradient></defs><circle cx="46" cy="36" r="7.5" fill="url(#dmLG${uid})" stroke="#fbbf24" stroke-width="2.5"/><circle cx="46" cy="36" r="5" fill="rgba(251,191,36,0.08)"/><line x1="51" y1="42" x2="55" y2="50" stroke="#fbbf24" stroke-width="2"/><path d="M43,33 L46,29 L49,33 L46,37 Z" fill="#e0f2fe" opacity="0.6"><animate attributeName="opacity" values="0.6;0.9;0.6" dur="1.5s" repeatCount="indefinite"/></path><circle cx="43" cy="34" r="0.8" fill="#fff" opacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite"/></circle><ellipse cx="43.5" cy="33.5" rx="1.8" ry="1" fill="rgba(255,255,255,0.35)" transform="rotate(-20 43.5 33.5)"/>`,
      // ── glowing_mask: gradient on main fill rect; all <animate> untouched ──
      glowing_mask:   `<defs><linearGradient id="glmG${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#3730a3"/></linearGradient></defs><rect x="26" y="42" width="28" height="12" rx="5" fill="url(#glmG${uid})" opacity="0.85"><animate attributeName="opacity" values="0.85;0.6;0.85" dur="2s" repeatCount="indefinite"/></rect><rect x="26" y="42" width="28" height="12" rx="5" fill="none" stroke="#818cf8" stroke-width="1.5"><animate attributeName="stroke-opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/></rect><line x1="30" y1="47" x2="50" y2="47" stroke="#a5b4fc" stroke-width="0.6" opacity="0.5"/><line x1="30" y1="50" x2="50" y2="50" stroke="#a5b4fc" stroke-width="0.6" opacity="0.5"/>`,
    };

    const customImg = t => customSlots['_img_'+t] && customSlots[t]
      ? `<image href="${customSlots['_img_'+t]}" x="-10" y="0" width="100" height="120" preserveAspectRatio="none"/>`
      : '';

    return `<svg viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
  ${coatFillDef}
  <!-- Ground contact shadow -->
  <ellipse cx="40" cy="119" rx="22" ry="3.2" fill="rgba(0,0,0,0.24)"/>
  <!-- Wings (behind body) -->
  ${wingsRendered}
  <!-- Body / Lab coat -->
  <rect x="14" y="60" width="52" height="58" rx="10" fill="${coatFillRef}" stroke="#e2e8f0" stroke-width="1"/>
  <!-- Custom coat overlay: on top of coat colour, under collar/pocket/face details -->
  ${customImg('coat')}
  <!-- Coat form-shade + sheen (over coat fill, under collar/pocket/badges) -->
  <rect x="14" y="60" width="52" height="58" rx="10" fill="url(#cs${uid})"/>
  <path d="M19,66 Q21,90 22,112" stroke="rgba(255,255,255,0.5)" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round"/>
  <!-- Coat collar -->
  <polygon points="40,62 30,78 40,84" fill="white" opacity="0.35"/>
  <polygon points="40,62 50,78 40,84" fill="white" opacity="0.35"/>
  <!-- Pocket -->
  <rect x="18" y="78" width="12" height="9" rx="3" fill="none" stroke="#e2e8f0" stroke-width="1.2"/>
  <line x1="22" y1="80" x2="22" y2="87" stroke="#a5b4fc" stroke-width="1" opacity="0.6"/>
  <!-- Badge pins -->
  ${_buildBadgePins(scientist)}
  <!-- Neck -->
  <rect x="33" y="54" width="14" height="10" rx="3" fill="${FLAT}"/>
  <!-- Hair (behind-head layer — over coat/neck, behind ears+head) -->
  ${hairBack}
  <!-- Ears (flat, behind head) -->
  <ellipse cx="18" cy="40" rx="4.5" ry="5.5" fill="${FLAT}"/>
  <ellipse cx="62" cy="40" rx="4.5" ry="5.5" fill="${FLAT}"/>
  <!-- Head -->
  <ellipse cx="40" cy="38" rx="22" ry="22" fill="url(#sk${uid})"/>
  <ellipse cx="40" cy="38" rx="22" ry="22" fill="url(#hs${uid})"/>
  <ellipse cx="40" cy="38" rx="22" ry="22" fill="url(#hh${uid})"/>
  <!-- Hair (front layer — over shaded scalp, under face) -->
  ${hairFront}
  <!-- Face -->
  ${(brows[reaction]||brows.neutral)}
  ${(eyes[reaction]||eyes.neutral)}
  <ellipse cx="40" cy="41" rx="2" ry="1.5" fill="rgba(0,0,0,0.12)"/>
  ${(mouths[reaction]||mouths.neutral)}
  <!-- Blush -->
  <ellipse cx="28" cy="43.5" rx="4.2" ry="2.6" fill="#fca5a5" opacity="0.32"/>
  <ellipse cx="52" cy="43.5" rx="4.2" ry="2.6" fill="#fca5a5" opacity="0.32"/>
  <!-- Head accessory -->
  ${headAcc && headAccSVG[headAcc] ? headAccSVG[headAcc] : ''}
  <!-- Face accessory -->
  ${faceAcc && faceAccSVG[faceAcc] ? faceAccSVG[faceAcc] : ''}
  ${sparkles}${dizzy}
  <!-- Custom head / face / background overlays -->
  ${customImg('head')}${customImg('face')}${customImg('background')}
</svg>`;
  }

  // ── Pet SVG builder (larger standalone pets) ─────────────────
  const PET_SVGS = {
    cat: (uid) => {
      const body = 'petGcatBody' + uid, acc = 'petGcatAcc' + uid;
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>${_petGrad(body, '#6b7280')}${_petGrad(acc, '#9ca3af')}</defs>
      ${_petShadow(17)}
      <!-- Tail -->
      <path d="M22,52 Q10,40 14,30 Q16,26 18,30" stroke="url(#${body})" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <!-- Body -->
      <ellipse cx="40" cy="54" rx="18" ry="14" fill="url(#${body})"/>
      <ellipse cx="38" cy="60" rx="9" ry="5.5" fill="#fff" opacity=".2"/>
      <!-- Front paws -->
      <ellipse cx="28" cy="66" rx="5" ry="3" fill="url(#${acc})"/>
      <ellipse cx="52" cy="66" rx="5" ry="3" fill="url(#${acc})"/>
      <!-- Head -->
      <circle cx="40" cy="30" r="16" fill="url(#${body})"/>
      <!-- Ears -->
      <polygon points="28,18 22,2 34,14" fill="url(#${body})"/>
      <polygon points="52,18 58,2 46,14" fill="url(#${body})"/>
      <polygon points="29,17 24,5 33,14" fill="#f9a8d4" opacity=".4"/>
      <polygon points="51,17 56,5 47,14" fill="#f9a8d4" opacity=".4"/>
      <!-- Cheek blush -->
      <ellipse cx="27" cy="34" rx="3.4" ry="2.1" fill="#f9a8d4" opacity=".3"/>
      <ellipse cx="53" cy="34" rx="3.4" ry="2.1" fill="#f9a8d4" opacity=".3"/>
      <!-- Eyes -->
      <ellipse cx="33" cy="28" rx="4" ry="4.5" fill="#fbbf24"/>
      <ellipse cx="47" cy="28" rx="4" ry="4.5" fill="#fbbf24"/>
      <ellipse cx="33" cy="28" rx="2" ry="3.5" fill="#1e1b4b"/>
      <ellipse cx="47" cy="28" rx="2" ry="3.5" fill="#1e1b4b"/>
      <circle cx="32" cy="26.3" r="1.1" fill="#fff" opacity=".85"/>
      <circle cx="46" cy="26.3" r="1.1" fill="#fff" opacity=".85"/>
      <!-- Nose -->
      <path d="M38,34 L40,36 L42,34 Z" fill="#f9a8d4"/>
      <!-- Mouth -->
      <path d="M40,36 L40,38" stroke="#4b5563" stroke-width=".8"/>
      <path d="M37,39 Q40,41 43,39" stroke="#4b5563" stroke-width=".8" fill="none"/>
      <!-- Whiskers -->
      <line x1="24" y1="32" x2="10" y2="29" stroke="#cbd5e1" stroke-width=".7"/>
      <line x1="24" y1="35" x2="10" y2="36" stroke="#cbd5e1" stroke-width=".7"/>
      <line x1="56" y1="32" x2="70" y2="29" stroke="#cbd5e1" stroke-width=".7"/>
      <line x1="56" y1="35" x2="70" y2="36" stroke="#cbd5e1" stroke-width=".7"/>
      <!-- Chest marking -->
      <ellipse cx="40" cy="50" rx="8" ry="6" fill="#fff" opacity=".22"/>
    </svg>`;
    },
    ginger_cat: (uid) => {
      const body = 'petGgingerBody' + uid, acc = 'petGgingerAcc' + uid;
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>${_petGrad(body, '#f97316')}${_petGrad(acc, '#fb923c')}</defs>
      ${_petShadow(17)}
      <path d="M22,52 Q10,40 14,30 Q16,26 18,30" stroke="url(#${body})" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="40" cy="54" rx="18" ry="14" fill="url(#${body})"/>
      <ellipse cx="38" cy="60" rx="9" ry="5.5" fill="#fff" opacity=".18"/>
      <ellipse cx="28" cy="66" rx="5" ry="3" fill="url(#${acc})"/>
      <ellipse cx="52" cy="66" rx="5" ry="3" fill="url(#${acc})"/>
      <circle cx="40" cy="30" r="16" fill="url(#${body})"/>
      <polygon points="28,18 22,2 34,14" fill="url(#${body})"/>
      <polygon points="52,18 58,2 46,14" fill="url(#${body})"/>
      <polygon points="29,17 24,5 33,14" fill="#fed7aa" opacity=".4"/>
      <polygon points="51,17 56,5 47,14" fill="#fed7aa" opacity=".4"/>
      <!-- Tabby stripes -->
      <path d="M32,22 L36,18" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M48,22 L44,18" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M40,20 L40,16" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Cheek blush -->
      <ellipse cx="27" cy="34" rx="3.4" ry="2.1" fill="#fda4af" opacity=".3"/>
      <ellipse cx="53" cy="34" rx="3.4" ry="2.1" fill="#fda4af" opacity=".3"/>
      <ellipse cx="33" cy="28" rx="4" ry="4.5" fill="#22c55e"/>
      <ellipse cx="47" cy="28" rx="4" ry="4.5" fill="#22c55e"/>
      <ellipse cx="33" cy="28" rx="2" ry="3.5" fill="#1e1b4b"/>
      <ellipse cx="47" cy="28" rx="2" ry="3.5" fill="#1e1b4b"/>
      <circle cx="32" cy="26.3" r="1.1" fill="#fff" opacity=".85"/>
      <circle cx="46" cy="26.3" r="1.1" fill="#fff" opacity=".85"/>
      <path d="M38,34 L40,36 L42,34 Z" fill="#f9a8d4"/>
      <path d="M40,36 L40,38" stroke="#9a3412" stroke-width=".8"/>
      <path d="M37,39 Q40,41 43,39" stroke="#9a3412" stroke-width=".8" fill="none"/>
      <line x1="24" y1="32" x2="10" y2="29" stroke="#fed7aa" stroke-width=".7"/>
      <line x1="24" y1="35" x2="10" y2="36" stroke="#fed7aa" stroke-width=".7"/>
      <line x1="56" y1="32" x2="70" y2="29" stroke="#fed7aa" stroke-width=".7"/>
      <line x1="56" y1="35" x2="70" y2="36" stroke="#fed7aa" stroke-width=".7"/>
      <ellipse cx="40" cy="50" rx="8" ry="6" fill="#fef3c7" opacity=".2"/>
    </svg>`;
    },
    puppy: (uid) => {
      const body = 'petGpupBody' + uid, acc = 'petGpupAcc' + uid;
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>${_petGrad(body, '#a16207')}${_petGrad(acc, '#78350f')}</defs>
      ${_petShadow(19)}
      <!-- Floppy ears (behind head) -->
      <ellipse cx="20" cy="26" rx="8" ry="14" fill="url(#${acc})" transform="rotate(-15,20,26)"/>
      <ellipse cx="60" cy="26" rx="8" ry="14" fill="url(#${acc})" transform="rotate(15,60,26)"/>
      <!-- Tail -->
      <path d="M58,50 Q68,42 64,34 Q62,30 60,34" stroke="url(#${body})" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <!-- Body -->
      <ellipse cx="40" cy="54" rx="20" ry="15" fill="url(#${body})"/>
      <ellipse cx="38" cy="60" rx="11" ry="6" fill="#fde8c8" opacity=".28"/>
      <ellipse cx="28" cy="68" rx="5" ry="3" fill="url(#${acc})"/>
      <ellipse cx="52" cy="68" rx="5" ry="3" fill="url(#${acc})"/>
      <!-- Head -->
      <circle cx="40" cy="30" r="17" fill="url(#${body})"/>
      <!-- Eye patches -->
      <circle cx="33" cy="28" r="6" fill="url(#${acc})" opacity=".55"/>
      <!-- Cheek blush -->
      <ellipse cx="29" cy="34" rx="3.2" ry="2" fill="#fca5a5" opacity=".28"/>
      <ellipse cx="55" cy="34" rx="3.2" ry="2" fill="#fca5a5" opacity=".28"/>
      <!-- Eyes -->
      <circle cx="33" cy="28" r="4.5" fill="#fff"/>
      <circle cx="47" cy="28" r="4.5" fill="#fff"/>
      <circle cx="34" cy="28" r="2.5" fill="#1e1b4b"/>
      <circle cx="48" cy="28" r="2.5" fill="#1e1b4b"/>
      <circle cx="34.6" cy="26.8" r="1" fill="#fff"/>
      <circle cx="48.6" cy="26.8" r="1" fill="#fff"/>
      <!-- Nose -->
      <ellipse cx="40" cy="36" rx="4" ry="3" fill="#1e1b4b"/>
      <ellipse cx="39.2" cy="34.8" rx="1.4" ry="1" fill="#fff" opacity=".4"/>
      <!-- Mouth -->
      <path d="M40,39 L40,42" stroke="#78350f" stroke-width="1"/>
      <path d="M36,43 Q40,47 44,43" stroke="#78350f" stroke-width="1" fill="none"/>
      <!-- Tongue -->
      <path d="M38,43 Q40,48 42,43" fill="#ef4444" opacity=".7"/>
    </svg>`;
    },
    bird: (uid) => {
      const body = 'petGbirdBody' + uid, acc = 'petGbirdAcc' + uid;
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>${_petGrad(body, '#3b82f6')}${_petGrad(acc, '#2563eb')}</defs>
      ${_petShadow(13)}
      <!-- Wings (behind body) -->
      <path d="M26,40 Q10,30 14,46 Q16,52 26,50" fill="url(#${acc})" opacity=".9"/>
      <path d="M54,40 Q70,30 66,46 Q64,52 54,50" fill="url(#${acc})" opacity=".9"/>
      <path d="M16,38 Q20,42 18,46" stroke="#1d4ed8" stroke-width=".8" fill="none"/>
      <path d="M64,38 Q60,42 62,46" stroke="#1d4ed8" stroke-width=".8" fill="none"/>
      <!-- Body -->
      <ellipse cx="40" cy="46" rx="14" ry="16" fill="url(#${body})"/>
      <ellipse cx="40" cy="52" rx="8" ry="10" fill="#dbeafe" opacity=".45"/>
      <!-- Legs -->
      <line x1="34" y1="60" x2="34" y2="72" stroke="#f59e0b" stroke-width="2.5"/>
      <line x1="46" y1="60" x2="46" y2="72" stroke="#f59e0b" stroke-width="2.5"/>
      <path d="M30,72 L34,72 L38,72" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
      <path d="M42,72 L46,72 L50,72" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
      <!-- Head -->
      <circle cx="40" cy="24" r="13" fill="url(#${body})"/>
      <!-- Crown feathers -->
      <circle cx="36" cy="12" r="2" fill="url(#${acc})"/>
      <circle cx="40" cy="10" r="2.5" fill="url(#${body})"/>
      <circle cx="44" cy="12" r="2" fill="url(#${acc})"/>
      <!-- Cheek blush -->
      <ellipse cx="33" cy="27" rx="2.6" ry="1.7" fill="#fda4af" opacity=".3"/>
      <!-- Beak -->
      <polygon points="52,26 62,22 52,30" fill="#f59e0b"/>
      <line x1="52" y1="26" x2="60" y2="26" stroke="#d97706" stroke-width=".5"/>
      <!-- Eye -->
      <circle cx="46" cy="22" r="4" fill="#fff"/>
      <circle cx="47" cy="22" r="2" fill="#1e1b4b"/>
      <circle cx="47.6" cy="21" r=".8" fill="#fff"/>
    </svg>`;
    },
    frog: (uid) => {
      const body = 'petGfrogBody' + uid, acc = 'petGfrogAcc' + uid;
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>${_petGrad(body, '#22c55e')}${_petGrad(acc, '#16a34a')}</defs>
      ${_petShadow(21)}
      <!-- Back leg hint -->
      <ellipse cx="18" cy="52" rx="6" ry="10" fill="url(#${acc})" opacity=".4" transform="rotate(-20,18,52)"/>
      <ellipse cx="62" cy="52" rx="6" ry="10" fill="url(#${acc})" opacity=".4" transform="rotate(20,62,52)"/>
      <!-- Body -->
      <ellipse cx="40" cy="48" rx="22" ry="16" fill="url(#${body})"/>
      <ellipse cx="40" cy="53" rx="13" ry="9" fill="#dcfce7" opacity=".4"/>
      <!-- Front legs -->
      <ellipse cx="22" cy="60" rx="7" ry="3.5" fill="url(#${acc})"/>
      <ellipse cx="58" cy="60" rx="7" ry="3.5" fill="url(#${acc})"/>
      <circle cx="17" cy="60" r="1.5" fill="#15803d"/>
      <circle cx="20" cy="62" r="1.5" fill="#15803d"/>
      <circle cx="60" cy="62" r="1.5" fill="#15803d"/>
      <circle cx="63" cy="60" r="1.5" fill="#15803d"/>
      <!-- Head -->
      <ellipse cx="40" cy="32" rx="20" ry="14" fill="url(#${body})"/>
      <!-- Bulging eyes -->
      <circle cx="26" cy="20" r="8" fill="url(#${body})"/>
      <circle cx="54" cy="20" r="8" fill="url(#${body})"/>
      <circle cx="26" cy="20" r="5.5" fill="#fff"/>
      <circle cx="54" cy="20" r="5.5" fill="#fff"/>
      <circle cx="27" cy="19" r="2.5" fill="#1e1b4b"/>
      <circle cx="55" cy="19" r="2.5" fill="#1e1b4b"/>
      <circle cx="27.7" cy="17.8" r=".9" fill="#fff"/>
      <circle cx="55.7" cy="17.8" r=".9" fill="#fff"/>
      <!-- Wide smile -->
      <path d="M26,38 Q40,46 54,38" stroke="#15803d" stroke-width="2" fill="none"/>
      <!-- Blush -->
      <ellipse cx="24" cy="36" rx="3.5" ry="2" fill="#f87171" opacity=".25"/>
      <ellipse cx="56" cy="36" rx="3.5" ry="2" fill="#f87171" opacity=".25"/>
      <!-- Nostrils -->
      <circle cx="36" cy="30" r="1.2" fill="#15803d"/>
      <circle cx="44" cy="30" r="1.2" fill="#15803d"/>
    </svg>`;
    },
    owl: (uid) => {
      const body = 'petGowlBody' + uid, acc = 'petGowlAcc' + uid;
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>${_petGrad(body, '#78350f')}${_petGrad(acc, '#92400e')}</defs>
      ${_petShadow(19)}
      <!-- Wings -->
      <path d="M22,44 Q12,36 16,54 Q18,60 24,58" fill="url(#${body})"/>
      <path d="M58,44 Q68,36 64,54 Q62,60 56,58" fill="url(#${body})"/>
      <!-- Body -->
      <ellipse cx="40" cy="52" rx="18" ry="18" fill="url(#${body})"/>
      <!-- Belly feathers -->
      <ellipse cx="40" cy="56" rx="12" ry="12" fill="#fde8c8" opacity=".3"/>
      <path d="M34,48 Q40,44 46,48" stroke="#92400e" stroke-width=".8" fill="none" opacity=".4"/>
      <path d="M32,54 Q40,50 48,54" stroke="#92400e" stroke-width=".8" fill="none" opacity=".4"/>
      <path d="M34,60 Q40,56 46,60" stroke="#92400e" stroke-width=".8" fill="none" opacity=".4"/>
      <!-- Feet -->
      <path d="M32,68 L30,74 M32,68 L32,74 M32,68 L34,74" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
      <path d="M48,68 L46,74 M48,68 L48,74 M48,68 L50,74" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
      <!-- Head -->
      <ellipse cx="40" cy="28" rx="20" ry="18" fill="url(#${acc})"/>
      <!-- Ear tufts -->
      <polygon points="22,14 16,0 30,12" fill="url(#${acc})"/>
      <polygon points="58,14 64,0 50,12" fill="url(#${acc})"/>
      <polygon points="23,14 18,3 29,12" fill="#fde68a" opacity=".3"/>
      <polygon points="57,14 62,3 51,12" fill="#fde68a" opacity=".3"/>
      <!-- Facial disc -->
      <circle cx="30" cy="26" r="9" fill="#fef3c7" opacity=".65"/>
      <circle cx="50" cy="26" r="9" fill="#fef3c7" opacity=".65"/>
      <!-- Eyes -->
      <circle cx="30" cy="26" r="6" fill="#f59e0b"/>
      <circle cx="50" cy="26" r="6" fill="#f59e0b"/>
      <circle cx="30" cy="26" r="3" fill="#1e1b4b"/>
      <circle cx="50" cy="26" r="3" fill="#1e1b4b"/>
      <circle cx="31.1" cy="24.4" r="1.1" fill="#fff" opacity=".85"/>
      <circle cx="51.1" cy="24.4" r="1.1" fill="#fff" opacity=".85"/>
      <!-- Beak -->
      <polygon points="40,32 37,38 43,38" fill="#f59e0b"/>
    </svg>`;
    },
    dragon: (uid) => {
      const body = 'petGdragBody' + uid, acc = 'petGdragAcc' + uid;
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>${_petGrad(body, '#7c3aed')}${_petGrad(acc, '#8b5cf6')}</defs>
      ${_petShadow(18)}
      <!-- Wings (behind body) -->
      <path d="M20,38 Q6,24 10,42 Q12,48 22,46" fill="url(#${acc})" opacity=".85"/>
      <path d="M56,38 Q70,24 66,42 Q64,48 54,46" fill="url(#${acc})" opacity=".85"/>
      <path d="M10,30 L16,38" stroke="#7c3aed" stroke-width=".8"/><path d="M10,36 L16,42" stroke="#7c3aed" stroke-width=".8"/>
      <path d="M66,30 L60,38" stroke="#7c3aed" stroke-width=".8"/><path d="M66,36 L60,42" stroke="#7c3aed" stroke-width=".8"/>
      <!-- Tail -->
      <path d="M56,54 Q66,48 64,40 Q62,36 58,40" stroke="url(#${body})" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <polygon points="58,38 62,34 56,42" fill="url(#${acc})"/>
      <!-- Body -->
      <ellipse cx="38" cy="52" rx="18" ry="14" fill="url(#${body})"/>
      <!-- Belly -->
      <ellipse cx="38" cy="55" rx="10" ry="7" fill="#ddd6fe" opacity=".3"/>
      <path d="M32,50 Q38,48 44,50" stroke="#6d28d9" stroke-width=".6" fill="none" opacity=".4"/>
      <path d="M33,54 Q38,52 43,54" stroke="#6d28d9" stroke-width=".6" fill="none" opacity=".4"/>
      <!-- Spines -->
      <circle cx="40" cy="42" r="2" fill="url(#${acc})"/><circle cx="40" cy="47" r="1.8" fill="url(#${acc})"/><circle cx="40" cy="51" r="1.5" fill="url(#${acc})"/>
      <!-- Feet -->
      <ellipse cx="28" cy="64" rx="5" ry="3" fill="url(#${acc})"/>
      <ellipse cx="48" cy="64" rx="5" ry="3" fill="url(#${acc})"/>
      <!-- Head -->
      <circle cx="40" cy="28" r="15" fill="url(#${body})"/>
      <!-- Horns -->
      <polygon points="28,16 22,0 34,14" fill="url(#${acc})"/>
      <polygon points="52,16 58,0 46,14" fill="url(#${acc})"/>
      <!-- Cheek blush -->
      <ellipse cx="30" cy="32" rx="3" ry="1.9" fill="#fda4af" opacity=".28"/>
      <ellipse cx="50" cy="32" rx="3" ry="1.9" fill="#fda4af" opacity=".28"/>
      <!-- Little flame -->
      <path d="M40,14 Q38,8 40,4 Q42,8 40,14" fill="#ef4444" opacity=".6"/>
      <path d="M40,14 Q39,10 40,7 Q41,10 40,14" fill="#fbbf24" opacity=".5"/>
      <!-- Eyes -->
      <ellipse cx="33" cy="26" rx="4" ry="4.5" fill="#fbbf24"/>
      <ellipse cx="47" cy="26" rx="4" ry="4.5" fill="#fbbf24"/>
      <ellipse cx="33" cy="26" rx="2" ry="3.5" fill="#1e1b4b"/>
      <ellipse cx="47" cy="26" rx="2" ry="3.5" fill="#1e1b4b"/>
      <ellipse cx="32" cy="24.5" rx=".9" ry="1.3" fill="#fff" opacity=".75"/>
      <ellipse cx="46" cy="24.5" rx=".9" ry="1.3" fill="#fff" opacity=".75"/>
      <!-- Nostrils -->
      <ellipse cx="36" cy="34" rx="1.5" ry="1" fill="#5b21b6"/>
      <ellipse cx="44" cy="34" rx="1.5" ry="1" fill="#5b21b6"/>
      <!-- Mouth -->
      <path d="M34,38 Q40,41 46,38" stroke="#5b21b6" stroke-width="1.2" fill="none"/>
    </svg>`;
    },
    horse: (uid) => {
      // Chibi/pony proportions (big round body+head, short thick neck, stubby
      // legs). Legs/mane/tail use a FLAT mixed shade rather than a gradient —
      // a radialGradient on a thin near-zero-width stroke degenerates badly.
      const body = 'petGhorseBody' + uid, acc = 'petGhorseAcc' + uid;
      const maneShade = _mix('#92400e', '#000000', 0.55);
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>${_petGrad(body, '#92400e')}${_petGrad(acc, '#c2874f')}</defs>
      ${_petShadow(22)}
      <!-- Tail -->
      <path d="M16,48 Q6,42 10,32 Q12,27 15,31 Q13,38 18,44" fill="${maneShade}"/>
      <!-- Legs -->
      <rect x="18" y="58" width="7" height="15" rx="3.5" fill="${maneShade}"/>
      <rect x="30" y="60" width="7" height="15" rx="3.5" fill="${maneShade}"/>
      <rect x="43" y="60" width="7" height="15" rx="3.5" fill="${maneShade}"/>
      <rect x="53" y="58" width="7" height="15" rx="3.5" fill="${maneShade}"/>
      <!-- Hooves -->
      <rect x="17.5" y="70" width="8" height="4" rx="2" fill="#2d1a06"/>
      <rect x="29.5" y="72" width="8" height="4" rx="2" fill="#2d1a06"/>
      <rect x="42.5" y="72" width="8" height="4" rx="2" fill="#2d1a06"/>
      <rect x="52.5" y="70" width="8" height="4" rx="2" fill="#2d1a06"/>
      <!-- Body -->
      <ellipse cx="36" cy="50" rx="23" ry="15" fill="url(#${body})"/>
      <ellipse cx="33" cy="56" rx="13" ry="6.5" fill="#fde8c8" opacity=".2"/>
      <!-- Neck -->
      <path d="M46,44 Q57,40 57,27 Q57,19 49,17 Q42,19 42,29 Q42,38 46,44 Z" fill="url(#${body})"/>
      <!-- Mane -->
      <path d="M45,12 Q49,16 46,20 Q50,23 47,27 Q51,30 47,34" stroke="${maneShade}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
      <!-- Head -->
      <ellipse cx="53" cy="20" rx="13" ry="11" fill="url(#${body})"/>
      <!-- Ears -->
      <polygon points="45,10 42,2 49,9" fill="url(#${body})"/>
      <polygon points="53,8 56,0 59,8" fill="url(#${body})"/>
      <polygon points="45.5,9 43,4 48,8" fill="#fde68a" opacity=".3"/>
      <!-- Muzzle -->
      <ellipse cx="60" cy="23" rx="6.5" ry="5" fill="url(#${acc})"/>
      <!-- Nostril -->
      <circle cx="63" cy="23" r="1.1" fill="#5c3410"/>
      <!-- Cheek blush -->
      <ellipse cx="55" cy="26" rx="2.8" ry="1.8" fill="#fda4af" opacity=".3"/>
      <!-- Eye -->
      <circle cx="58" cy="16" r="3.2" fill="#1e1b4b"/>
      <circle cx="58.8" cy="14.8" r="1.1" fill="#fff"/>
    </svg>`;
    },
    hamster: (uid) => {
      const body = 'petGhamBody' + uid, acc = 'petGhamAcc' + uid;
      return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>${_petGrad(body, '#f5d0a9')}${_petGrad(acc, '#e7c9a5')}</defs>
      ${_petShadow(21)}
      <!-- Ears (behind head) -->
      <ellipse cx="24" cy="18" rx="7" ry="9" fill="url(#${body})"/>
      <ellipse cx="56" cy="18" rx="7" ry="9" fill="url(#${body})"/>
      <ellipse cx="24" cy="18" rx="4.5" ry="6" fill="#fce7f3"/>
      <ellipse cx="56" cy="18" rx="4.5" ry="6" fill="#fce7f3"/>
      <!-- Body -->
      <ellipse cx="40" cy="52" rx="20" ry="16" fill="url(#${body})"/>
      <ellipse cx="40" cy="57" rx="12" ry="7" fill="#fff" opacity=".2"/>
      <!-- Front paws -->
      <ellipse cx="30" cy="64" rx="5" ry="3" fill="url(#${acc})"/>
      <ellipse cx="50" cy="64" rx="5" ry="3" fill="url(#${acc})"/>
      <!-- Head -->
      <circle cx="40" cy="30" r="18" fill="url(#${body})"/>
      <!-- Cheek pouches -->
      <ellipse cx="24" cy="36" rx="8" ry="6" fill="#fde68a" opacity=".35"/>
      <ellipse cx="56" cy="36" rx="8" ry="6" fill="#fde68a" opacity=".35"/>
      <!-- Cheek blush -->
      <ellipse cx="25" cy="33" rx="3.4" ry="2.1" fill="#fda4af" opacity=".3"/>
      <ellipse cx="55" cy="33" rx="3.4" ry="2.1" fill="#fda4af" opacity=".3"/>
      <!-- Eyes -->
      <circle cx="32" cy="28" r="4" fill="#1e1b4b"/>
      <circle cx="48" cy="28" r="4" fill="#1e1b4b"/>
      <circle cx="33.1" cy="26.6" r="1.3" fill="#fff"/>
      <circle cx="49.1" cy="26.6" r="1.3" fill="#fff"/>
      <!-- Nose -->
      <ellipse cx="40" cy="34" rx="2" ry="1.5" fill="#f9a8d4"/>
      <!-- Mouth -->
      <path d="M38,36 Q40,38 42,36" stroke="#d4a373" stroke-width=".8" fill="none"/>
      <!-- Whiskers -->
      <line x1="26" y1="34" x2="14" y2="32" stroke="#e7c9a5" stroke-width=".6"/>
      <line x1="26" y1="36" x2="14" y2="37" stroke="#e7c9a5" stroke-width=".6"/>
      <line x1="54" y1="34" x2="66" y2="32" stroke="#e7c9a5" stroke-width=".6"/>
      <line x1="54" y1="36" x2="66" y2="37" stroke="#e7c9a5" stroke-width=".6"/>
      <!-- Back marking -->
      <path d="M30,20 Q40,16 50,20" stroke="#d4a373" stroke-width="2" fill="none" opacity=".3"/>
    </svg>`;
    },
  };

  function buildPetSVG(petId, reaction) {
    if (!petId || petId === 'none' || !PET_SVGS[petId]) return '';
    const uid = '_p' + (++_petSeq);
    return PET_SVGS[petId](uid);
  }

  // ── Pet stage injection ─────────────────────────────────────
  function _injectPetStage(sd) {
    const petId = sd && sd.scientist && sd.scientist.pet;
    document.querySelectorAll('#petCharWrap').forEach(el => {
      const tank = el.closest('.pet-tank');
      if (petId && petId !== 'none') {
        el.innerHTML = buildPetSVG(petId);
        el.classList.add('pet-idle');
        el.style.display = '';
        if (tank) tank.style.display = '';
      } else {
        el.innerHTML = '';
        el.style.display = 'none';
        if (tank) tank.style.display = 'none';
      }
    });
  }

  function _petReact(type) {
    document.querySelectorAll('#petCharWrap').forEach(el => {
      el.classList.remove('pet-correct','pet-wrong','pet-streak','pet-idle');
      if (type === 'correct') {
        el.classList.add('pet-correct');
        setTimeout(() => { el.classList.remove('pet-correct'); el.classList.add('pet-idle'); }, 800);
      } else if (type === 'wrong') {
        el.classList.add('pet-wrong');
        setTimeout(() => { el.classList.remove('pet-wrong'); el.classList.add('pet-idle'); }, 700);
      } else if (type === 'streak') {
        el.classList.add('pet-streak');
        setTimeout(() => { el.classList.remove('pet-streak'); el.classList.add('pet-idle'); }, 1200);
      }
    });
  }

  // ── Widget ────────────────────────────────────────────────────
  let _widgetEl = null;
  let _crownActive = null; // null = unchecked, true/false = cached result

  async function _checkCrown() {
    if (_crownActive !== null) return _crownActive;
    _crownActive = false;
    if (typeof WordLabData === 'undefined') return false;
    try {
      const session = WordLabData.getSession();
      if (session && session.classId) {
        const enabled = await WordLabData.getClassCrownEnabled(session.classId);
        if (enabled) {
          const leaderId = await WordLabData.getClassLeader(session.classId);
          _crownActive = !!(leaderId && leaderId === session.studentId);
        }
      }
    } catch {}
    return _crownActive;
  }

  function _effectTargets() {
    const targets = [];
    if (_widgetEl) targets.push(_widgetEl);
    // In-game scientist stage (present on all game pages)
    const stage = document.querySelector('.scientist-stage');
    if (stage) targets.push(stage);
    // Big scientist card on scientist.html
    const big = document.getElementById('sciSVGBig');
    if (big) targets.push(big);
    // Landing page student avatar in status strip
    const hubAvatar = document.getElementById('hubSciAvatar');
    if (hubAvatar) targets.push(hubAvatar);
    return targets;
  }

  function _startEquippedEffect(sd) {
    if (typeof WLEffects === 'undefined') return;
    const effectId = sd && sd.scientist && sd.scientist.effect;
    _effectTargets().forEach(el => {
      if (effectId) WLEffects.start(effectId, el);
      else WLEffects.stop(el);
    });
  }

  // World backdrop targets = effect targets MINUS the tiny surfaces (the header
  // widget and the 44px landing hub avatar) where a backdrop is invisible.
  function _worldTargets() {
    var hub = document.getElementById('hubSciAvatar');
    return _effectTargets().filter(el => el !== _widgetEl && el !== hub);
  }

  function _startEquippedWorld(sd) {
    if (typeof WLWorlds === 'undefined') return;
    const worldId = sd && sd.scientist && sd.scientist.world;
    _worldTargets().forEach(el => {
      if (worldId) WLWorlds.start(worldId, el);
      else WLWorlds.stop(el);
    });
  }

  async function inject() {
    if (_widgetEl) return;
    if (typeof WordLabData === 'undefined') return;
    const sd = await WordLabData.getStudentData();
    if (!sd) return;

    const el = document.createElement('div');
    el.id = 'wlScientistWidget';
    el.style.cssText = 'display:inline-flex;align-items:center;gap:8px;background:#fff;border:2px solid #e2e8f0;border-radius:20px;padding:5px 12px 5px 5px;cursor:pointer;font-family:Lexend,sans-serif;transition:box-shadow .15s;flex-shrink:0;';
    el.title = 'My Scientist';
    el.addEventListener('mouseenter', () => el.style.boxShadow = '0 4px 12px rgba(67,56,202,.15)');
    el.addEventListener('mouseleave', () => el.style.boxShadow = '');
    el.addEventListener('click', openProfile);
    _widgetEl = el;
    _renderWidget('neutral');

    // Insert before wlPillSlot's parent, or before wlPillSlot itself
    const slot = document.getElementById('wlPillSlot');
    if (slot) {
      slot.parentNode.insertBefore(el, slot);
    } else {
      const hdr = document.querySelector('.headerInner, .hud, header');
      if (hdr) hdr.insertBefore(el, hdr.firstChild);
    }

    // Cache dance moves for react()
    _cachedDances = (sd.scientist && sd.scientist.dances) || {};
    _startEquippedEffect(sd);
    _startEquippedWorld(sd);
    _injectPetStage(sd);

    // Restart effect when student logs in during this session
    if (typeof WordLabData !== 'undefined' && WordLabData._pick) {
      const _origPick = WordLabData._pick.bind(WordLabData);
      WordLabData._pick = async function(sid, sname, cid) {
        _origPick(sid, sname, cid);
        // After pick, re-fetch data and restart effect
        setTimeout(async () => {
          const newSd = await WordLabData.getStudentData();
          _startEquippedEffect(newSd);
          _startEquippedWorld(newSd);
        }, 500);
      };
    }
  }

  async function _renderWidget(reaction) {
    if (!_widgetEl) return;
    if (typeof WordLabData === 'undefined') return;
    const sd = await WordLabData.getStudentData();
    if (!sd) return;
    _cachedDances = (sd.scientist && sd.scientist.dances) || {};
    if (await _checkCrown()) {
      sd.scientist = Object.assign({}, sd.scientist, { head: 'donut_crown' });
    }
    const lvl = sd.level;

    _widgetEl.innerHTML = `
      <div id="wlSciAvatar" style="width:44px;height:44px;flex-shrink:0;overflow:visible;">${buildSVG(sd.scientist, reaction)}</div>
      <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
        <div style="font-size:11px;font-weight:900;color:#312e81;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px;">${lvl.title}</div>
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="font-size:11px;font-weight:800;color:#4338ca;">⚛️ ${sd.quarks}</span>
          <div style="width:50px;height:5px;background:#e2e8f0;border-radius:999px;overflow:hidden;">
            <div style="height:100%;width:${lvl.progress}%;background:linear-gradient(90deg,#4338ca,#6366f1);border-radius:999px;transition:width .3s;"></div>
          </div>
          <span style="font-size:9px;color:#94a3b8;font-weight:700;">Lv${lvl.level}</span>
        </div>
      </div>`;
  }

  function refresh(reaction) {
    _renderWidget(reaction || 'neutral');
  }

  // ── Dance Moves System ───────────────────────────────────────
  const DANCE_ANIMS = {
    // Correct tier
    bounce:    { keyframes: null, duration: 300 }, // default — handled inline
    nod:       { keyframes: 'wlDanceNod', duration: 500 },
    wink:      { keyframes: 'wlDanceWink', duration: 500 },
    // 3-streak
    default3:  { keyframes: null, duration: 400 },
    spin:      { keyframes: 'wlDanceSpin', duration: 600 },
    hop:       { keyframes: 'wlDanceHop', duration: 700 },
    // 5-streak
    default5:  { keyframes: null, duration: 500 },
    backflip:  { keyframes: 'wlDanceBackflip', duration: 700 },
    moonwalk:  { keyframes: 'wlDanceMoonwalk', duration: 900 },
    wave:      { keyframes: 'wlDanceWave', duration: 800 },
    // 10-streak
    default10: { keyframes: null, duration: 600 },
    rocket:    { keyframes: 'wlDanceRocket', duration: 1000 },
    disco:     { keyframes: 'wlDanceDisco', duration: 1000 },
    breakdance:{ keyframes: 'wlDanceBreakdance', duration: 900 },
    // 15-streak
    default15: { keyframes: null, duration: 700 },
    fireworks: { keyframes: 'wlDanceFireworks', duration: 1000 },
    victory:   { keyframes: 'wlDanceVictory', duration: 1000 },
    supersaiyan:{ keyframes: 'wlDanceSuperSaiyan', duration: 1200 },
    // 30+ legendary
    default30: { keyframes: null, duration: 800 },
    portal:    { keyframes: 'wlDancePortal', duration: 1200 },
    quantum:   { keyframes: 'wlDanceQuantum', duration: 1500 },
    supernova: { keyframes: 'wlDanceSupernova', duration: 1200 },
  };

  var _cachedDances = {};

  function _getStreakTier(streak) {
    if (streak >= 30) return 'streak30';
    if (streak >= 15) return 'streak15';
    if (streak >= 10) return 'streak10';
    if (streak >= 5) return 'streak5';
    if (streak >= 3) return 'streak3';
    return 'correct';
  }

  function _playDance(danceId) {
    var anim = danceId ? DANCE_ANIMS[danceId] : null;
    if (!anim || !anim.keyframes) return 0;
    var animCSS = anim.keyframes + ' ' + anim.duration + 'ms ease forwards';
    // Apply to all scientist targets: header widget avatar + game stage
    var targets = [];
    var av = document.getElementById('wlSciAvatar');
    if (av) targets.push(av);
    var stage = document.getElementById('sciCharWrap');
    if (stage) targets.push(stage);
    if (!targets.length) return 0;
    targets.forEach(function(el) {
      // Override idle animation with the dance
      el.style.animation = 'none';
      el.offsetHeight; // force reflow
      el.style.animation = animCSS;
    });
    setTimeout(function() {
      targets.forEach(function(el) {
        if (!el || !el.parentNode) return;
        // Restore idle animation on the game stage, clear on widget
        if (el.id === 'sciCharWrap') {
          el.style.animation = '';
        } else {
          el.style.animation = '';
        }
      });
    }, anim.duration + 50);
    return anim.duration;
  }

  // Update stage scientist SVG mood (the big one on game pages)
  function _updateStageMood(reaction) {
    var stage = document.getElementById('sciCharWrap');
    if (!stage) return;
    try {
      if (typeof WordLabData === 'undefined') return;
      var sd = WordLabData.getStudentData();
      if (sd && sd.then) {
        sd.then(function(data) {
          if (data && stage.parentNode) {
            stage.innerHTML = buildSVG(data.scientist || {}, reaction || 'neutral');
          }
        });
      }
    } catch(e) {}
  }

  function _previewDance(danceId) {
    _renderWidget('excited');
    _updateStageMood('excited');
    var dur = _playDance(danceId);
    setTimeout(function() {
      _renderWidget('neutral');
      _updateStageMood('neutral');
    }, Math.max(dur + 100, 500));
  }

  // ── Reactions ─────────────────────────────────────────────────
  function _defaultBounce(targets, yPx, scale, duration) {
    targets.forEach(function(el) {
      if (!el) return;
      // Pause idle animation during bounce
      if (el.id === 'sciCharWrap') { el.style.animation = 'none'; }
      el.style.transition = 'transform ' + Math.round(duration * 0.5) + 'ms ease';
      el.style.transform = 'translateY(' + yPx + 'px) scale(' + scale + ')';
    });
    setTimeout(function() {
      targets.forEach(function(el) {
        if (!el) return;
        el.style.transform = '';
        // Restore idle animation
        if (el.id === 'sciCharWrap') { el.style.animation = ''; }
      });
    }, duration);
  }

  function _isLowStim() {
    return typeof WordLabData !== 'undefined' && WordLabData.isLowStimMode();
  }

  function react(type, extras) {
    if (_isLowStim()) return; // suppress all animations in low-stim mode
    extras = extras || {};
    var streak = extras.streak || 0;
    var avatar = document.getElementById('wlSciAvatar');
    var stage = document.getElementById('sciCharWrap');
    var allTargets = [avatar, stage].filter(Boolean);
    _petReact(type);

    // Remove any leftover stage CSS classes
    if (stage) stage.classList.remove('sci-correct', 'sci-wrong', 'sci-streak');

    if (type === 'correct') {
      _renderWidget('happy');
      _updateStageMood('happy');
      // Play equipped correct dance or default bounce
      var correctDance = _cachedDances.correct || null;
      var danceTime = _playDance(correctDance);
      if (!danceTime) {
        _defaultBounce(allTargets, -6, 1.08, 300);
        danceTime = 300;
      }
      // Quark pop
      if (extras.quarksEarned > 0) _showQuarkPop(extras.quarksEarned);
      // Badge toasts
      if (extras.newBadges && extras.newBadges.length) {
        extras.newBadges.forEach((id, i) => setTimeout(() => _showBadgeToast(id), i * 1800));
      }
      setTimeout(function() { _renderWidget('neutral'); _updateStageMood('neutral'); }, Math.max(danceTime + 100, 700));

    } else if (type === 'wrong') {
      _renderWidget('wrong');
      _updateStageMood('wrong');
      // Shake both widget and stage
      var shakeTargets = [_widgetEl, stage].filter(Boolean);
      shakeTargets.forEach(function(el) {
        el.style.animation = 'wlShake .4s ease';
      });
      setTimeout(function() {
        shakeTargets.forEach(function(el) { if (el) el.style.animation = ''; });
      }, 450);
      setTimeout(function() { _renderWidget('neutral'); _updateStageMood('neutral'); }, 600);

    } else if (type === 'streak') {
      var tier = _getStreakTier(streak);
      var mood = streak >= 10 ? 'excited' : 'happy';
      _renderWidget(mood);
      _updateStageMood(mood);
      var tierDance = _cachedDances[tier] || null;
      var dur = _playDance(tierDance);
      // Default streak animation if no dance equipped
      if (!dur) {
        var defaultScale = 1.05 + Math.min(streak, 30) * 0.005;
        var defaultY = -6 - Math.min(streak, 30) * 0.5;
        _defaultBounce(allTargets, defaultY, defaultScale, 400);
        dur = 400;
      }
      setTimeout(function() { _renderWidget('neutral'); _updateStageMood('neutral'); }, Math.max(dur + 100, 900));
    }
  }

  function _showQuarkPop(n) {
    if (!_widgetEl || _isLowStim()) return;
    const rect = _widgetEl.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.textContent = `+${n} ⚛️`;
    pop.style.cssText = `position:fixed;left:${rect.left + 20}px;top:${rect.top - 10}px;font-family:Lexend,sans-serif;font-size:13px;font-weight:900;color:#4338ca;pointer-events:none;z-index:9999;animation:wlPopUp .8s ease forwards;`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 850);
  }

  function _showBadgeToast(badgeId) {
    if (_isLowStim()) return;
    const all = [...(WordLabData.ALL_BADGES||[]), ...(WordLabData.LEGENDARY_BADGES||[])];
    const badge = all.find(b => b.id === badgeId);
    if (!badge) return;
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#312e81;color:#fff;font-family:Lexend,sans-serif;font-size:14px;font-weight:800;padding:12px 24px;border-radius:16px;z-index:9999;animation:wlSlideUp .5s ease;box-shadow:0 8px 24px rgba(49,46,129,.4);display:flex;align-items:center;gap:8px;`;
    toast.innerHTML = `<span style="font-size:20px;">${badge.icon}</span><div><div>Badge unlocked!</div><div style="font-size:12px;opacity:.85;">${badge.label}</div></div>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.transition='opacity .4s'; toast.style.opacity='0'; }, 2800);
    setTimeout(() => toast.remove(), 3300);
  }

  function openProfile() {
    window.location.href = 'scientist.html';
  }

  // ── CSS animations ────────────────────────────────────────────
  function _injectCSS() {
    if (document.getElementById('wlSciCSS')) return;
    const s = document.createElement('style');
    s.id = 'wlSciCSS';
    s.textContent = `
      @keyframes wlPopUp   { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-40px)} }
      @keyframes wlSlideUp { 0%{opacity:0;transform:translateX(-50%) translateY(20px)} 100%{opacity:1;transform:translateX(-50%) translateY(0)} }
      @keyframes wlShake   { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
      /* Dance move keyframes */
      @keyframes wlDanceNod { 0%,100%{transform:rotate(0) translateY(0)} 25%{transform:rotate(-4deg) translateY(-3px)} 75%{transform:rotate(4deg) translateY(-3px)} }
      @keyframes wlDanceWink { 0%,100%{transform:scale(1) rotate(0)} 40%{transform:scale(1.12) rotate(-3deg)} 70%{transform:scale(0.95) rotate(2deg)} }
      @keyframes wlDanceSpin { 0%{transform:rotate(0) scale(1)} 50%{transform:rotate(180deg) scale(0.85)} 100%{transform:rotate(360deg) scale(1)} }
      @keyframes wlDanceHop { 0%,100%{transform:translateY(0)} 20%{transform:translateY(-18px) scale(1.05)} 40%{transform:translateY(-4px)} 60%{transform:translateY(-14px) scale(1.03)} 80%{transform:translateY(-2px)} }
      @keyframes wlDanceBackflip { 0%{transform:translateY(0) scale(1)} 25%{transform:translateY(-20px) scale(1.1)} 50%{transform:translateY(-25px) rotate(180deg) scale(0.8)} 75%{transform:translateY(-10px) rotate(300deg) scale(0.9)} 100%{transform:translateY(0) rotate(360deg) scale(1)} }
      @keyframes wlDanceMoonwalk { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-18px)} 40%{transform:translateX(-10px) translateY(-4px)} 60%{transform:translateX(18px)} 80%{transform:translateX(10px) translateY(-4px)} }
      @keyframes wlDanceWave { 0%,100%{transform:rotate(0)} 15%{transform:rotate(-12deg)} 30%{transform:rotate(12deg)} 45%{transform:rotate(-8deg)} 60%{transform:rotate(8deg)} }
      @keyframes wlDanceRocket { 0%{transform:translateY(0) scale(1)} 30%{transform:translateY(-35px) scale(1.2)} 50%{transform:translateY(-35px) scale(1.2)} 80%{transform:translateY(5px) scale(0.95)} 100%{transform:translateY(0) scale(1)} }
      @keyframes wlDanceDisco { 0%{transform:scale(1);filter:hue-rotate(0deg)} 25%{transform:scale(1.1) rotate(-5deg);filter:hue-rotate(90deg)} 50%{transform:scale(1) rotate(5deg);filter:hue-rotate(180deg)} 75%{transform:scale(1.1) rotate(-3deg);filter:hue-rotate(270deg)} 100%{transform:scale(1);filter:hue-rotate(360deg)} }
      @keyframes wlDanceBreakdance { 0%{transform:rotate(0) scale(1)} 25%{transform:rotate(90deg) scale(0.8)} 50%{transform:rotate(180deg) scale(1.1)} 75%{transform:rotate(270deg) scale(0.8)} 100%{transform:rotate(360deg) scale(1)} }
      @keyframes wlDanceFireworks { 0%{transform:scale(1);opacity:1} 20%{transform:scale(1.5);opacity:1} 40%{transform:scale(0.7);opacity:0.8} 60%{transform:scale(1.3);opacity:1} 80%{transform:scale(0.9)} 100%{transform:scale(1)} }
      @keyframes wlDanceVictory { 0%{transform:rotate(0) translateY(0)} 25%{transform:rotate(-15deg) translateY(-12px)} 50%{transform:rotate(15deg) translateY(-20px)} 75%{transform:rotate(-10deg) translateY(-8px)} 100%{transform:rotate(0) translateY(0)} }
      @keyframes wlDanceSuperSaiyan { 0%{transform:scale(1);filter:brightness(1)} 20%{transform:scale(1.15);filter:brightness(1.5) saturate(1.5)} 50%{transform:scale(1.2);filter:brightness(1.8) saturate(2)} 80%{transform:scale(1.1);filter:brightness(1.3)} 100%{transform:scale(1);filter:brightness(1)} }
      @keyframes wlDancePortal { 0%{transform:scale(1) rotate(0)} 35%{transform:scale(0) rotate(180deg)} 65%{transform:scale(0) rotate(180deg)} 100%{transform:scale(1) rotate(360deg)} }
      @keyframes wlDanceQuantum { 0%{transform:translate(0,0) scale(1);filter:none} 15%{transform:translate(-4px,3px) scale(1.05);filter:hue-rotate(60deg)} 30%{transform:translate(4px,-3px) scale(0.95);filter:hue-rotate(120deg)} 45%{transform:translate(-3px,-4px) scale(1.1);filter:hue-rotate(200deg)} 60%{transform:translate(3px,4px) scale(0.9);filter:hue-rotate(280deg)} 75%{transform:translate(-2px,2px) scale(1.05);filter:hue-rotate(340deg)} 100%{transform:translate(0,0) scale(1);filter:none} }
      @keyframes wlDanceSupernova { 0%{transform:scale(1);filter:brightness(1)} 20%{transform:scale(1.8);filter:brightness(2) saturate(3)} 40%{transform:scale(0.3);filter:brightness(0.5)} 60%{transform:scale(1.4);filter:brightness(1.5)} 100%{transform:scale(1);filter:brightness(1)} }
      #sciCharWrap { position:relative; z-index:20; }
      #wlSciAvatar { position:relative; z-index:20; }
      .pet-tank {
        background:rgba(200,230,255,.12);
        border:2px solid rgba(100,180,255,.3);
        border-radius:16px;
        padding:10px;
        box-shadow:inset 0 0 20px rgba(100,180,255,.08), 0 4px 12px rgba(0,0,0,.1);
        backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px);
        display:flex; align-items:center; justify-content:center;
        position:relative; overflow:hidden;
        margin-bottom:8px;
        z-index:25;
      }
      .pet-tank::before {
        content:''; position:absolute; top:4px; left:10%; right:10%; height:3px;
        background:rgba(255,255,255,.25); border-radius:2px;
      }
      .pet-tank::after {
        content:''; position:absolute; bottom:0; left:0; right:0; height:30%;
        background:linear-gradient(0deg, rgba(100,180,255,.06) 0%, transparent 100%);
        border-radius:0 0 14px 14px;
      }
      .pet-tank-label {
        position:absolute; bottom:4px; left:0; right:0; text-align:center;
        font-size:7px; font-weight:900; letter-spacing:.12em; text-transform:uppercase;
        color:rgba(100,180,255,.5); z-index:1;
      }
      #petCharWrap { width:160px; height:160px; transition:transform .2s; z-index:26; }
      #petCharWrap svg { width:100%; height:100%; }
      #petCharWrap.pet-idle { animation:petIdle 2.5s ease-in-out infinite; }
      #petCharWrap.pet-correct { animation:petJump .6s ease-out; }
      #petCharWrap.pet-wrong { animation:petSad .5s ease-out; }
      #petCharWrap.pet-streak { animation:petDance .6s ease-in-out 2; }
      @keyframes petIdle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      @keyframes petJump { 0%{transform:translateY(0) scale(1)} 30%{transform:translateY(-18px) scale(1.15)} 60%{transform:translateY(-4px) scale(.95)} 100%{transform:translateY(0) scale(1)} }
      @keyframes petSad { 0%{transform:rotate(0)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} 100%{transform:rotate(0)} }
      @keyframes petDance { 0%,100%{transform:rotate(-10deg) scale(1.05)} 50%{transform:rotate(10deg) scale(1.05)} }
    `;
    document.head.appendChild(s);
  }

  // ── Auto-inject ───────────────────────────────────────────────
  _injectCSS();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  return { inject, react, refresh, buildSVG, buildPetSVG, openProfile, _restartEffects: _startEquippedEffect, _injectPetStage, _previewDance, DANCE_ANIMS };

})();
