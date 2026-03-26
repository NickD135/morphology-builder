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
    // Look up badge icons
    var allBadges = [];
    if (typeof WordLabData !== 'undefined') {
      allBadges = [].concat(WordLabData.ALL_BADGES || [], WordLabData.LEGENDARY_BADGES || []);
    }
    // Pin positions on right side of coat chest
    var positions = [{x:48, y:70}, {x:56, y:78}, {x:48, y:86}];
    var svgParts = [];
    for (var i = 0; i < Math.min(pins.length, 3); i++) {
      var badgeId = pins[i];
      var px = positions[i].x, py = positions[i].y;

      // Special: streak flame badge
      if (badgeId === 'streak_flame') {
        var streakDays = 0;
        try {
          if (typeof WordLabData !== 'undefined') {
            streakDays = WordLabData.updateDailyStreak().count || 0;
          }
        } catch(e) {}
        svgParts.push(_buildStreakFlame(px, py, Math.max(streakDays, 1)));
        continue;
      }

      var badge = allBadges.find(function(b) { return b.id === badgeId; });
      if (!badge) continue;
      svgParts.push(
        '<circle cx="' + px + '" cy="' + py + '" r="5.5" fill="#eef2ff" stroke="#a5b4fc" stroke-width="0.8"/>' +
        '<text x="' + px + '" y="' + (py + 2.5) + '" text-anchor="middle" font-size="6.5" dominant-baseline="middle">' + badge.icon + '</text>'
      );
    }
    return svgParts.join('');
  }

  // ── SVG builder ──────────────────────────────────────────────
  function buildSVG(scientist, reaction) {
    scientist = scientist || {};
    reaction  = reaction  || 'neutral';
    const skin       = scientist.skinTone    || '#FDBCB4';
    const coat       = scientist.coatColor   || '#ffffff';
    const pattern    = scientist.coatPattern || 'plain';
    const headAcc    = scientist.head        || null;
    const faceAcc    = scientist.face        || null;
    const customSlots = scientist.customSlots || {};

    // Coat fill — plain, rainbow gradient, or patterned
    // 'rainbow' is not a valid SVG colour so we build a linearGradient instead
    const isRainbow = coat === 'rainbow';
    const coatBase  = isRainbow ? 'url(#coatRainbow)' : coat;

    const defsContent = [
      isRainbow
        ? `<linearGradient id="coatRainbow" x1="0%" y1="0%" x2="100%" y2="100%">` +
          `<stop offset="0%"   stop-color="#f87171"/>` +
          `<stop offset="20%"  stop-color="#fb923c"/>` +
          `<stop offset="40%"  stop-color="#facc15"/>` +
          `<stop offset="60%"  stop-color="#4ade80"/>` +
          `<stop offset="80%"  stop-color="#60a5fa"/>` +
          `<stop offset="100%" stop-color="#a78bfa"/>` +
          `</linearGradient>`
        : '',
      pattern === 'stripes'
        ? `<pattern id="cp" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${coatBase}"/><line x1="0" y1="0" x2="8" y2="8" stroke="rgba(0,0,0,0.12)" stroke-width="2"/></pattern>`
        : '',
      pattern === 'molecules'
        ? `<pattern id="cp" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${coatBase}"/><circle cx="7" cy="7" r="2" fill="rgba(0,0,0,0.1)"/><circle cx="2" cy="2" r="1.2" fill="rgba(0,0,0,0.08)"/><circle cx="12" cy="12" r="1.2" fill="rgba(0,0,0,0.08)"/></pattern>`
        : '',
      pattern === 'stars'
        ? `<pattern id="cp" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${coatBase}"/><text x="2" y="10" font-size="8" opacity="0.18">★</text></pattern>`
        : '',
    ].filter(Boolean).join('');

    const coatFillDef = defsContent ? `<defs>${defsContent}</defs>` : '';
    const coatFillRef = ['stripes','molecules','stars'].includes(pattern) ? 'url(#cp)' : coatBase;

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
      goggles_head: `<rect x="22" y="20" width="36" height="12" rx="6" fill="#94a3b8" opacity="0.7"/><circle cx="34" cy="26" r="5" fill="none" stroke="#64748b" stroke-width="2.5"/><circle cx="46" cy="26" r="5" fill="none" stroke="#64748b" stroke-width="2.5"/><line x1="39" y1="26" x2="41" y2="26" stroke="#64748b" stroke-width="2"/>`,
      grad_cap:     `<rect x="24" y="15" width="32" height="5" rx="2" fill="#1e1b4b"/><polygon points="40,8 18,17 40,17 62,17" fill="#312e81"/><line x1="56" y1="17" x2="58" y2="26" stroke="#6366f1" stroke-width="1.5"/><circle cx="58" cy="27" r="2.5" fill="#6366f1"/>`,
      top_hat:      `<rect x="28" y="6" width="24" height="16" rx="2" fill="#1e1b4b"/><rect x="20" y="20" width="40" height="4" rx="2" fill="#1e1b4b"/>`,
      hard_hat:     `<path d="M22,24 Q40,10 58,24 Z" fill="#eab308"/><rect x="18" y="22" width="44" height="5" rx="2" fill="#ca8a04"/>`,
      beanie:       `<path d="M21,28 Q21,10 40,10 Q59,10 59,28 Z" fill="#6366f1"/><rect x="18" y="26" width="44" height="5" rx="3" fill="#4338ca"/><circle cx="40" cy="10" r="5" fill="#818cf8"/>`,
      crown:        `<polygon points="40,8 28,20 32,16 40,20 48,16 52,20" fill="#f59e0b"/><circle cx="40" cy="9" r="2.5" fill="#fcd34d"/><circle cx="28" cy="20" r="2" fill="#fcd34d"/><circle cx="52" cy="20" r="2" fill="#fcd34d"/>`,
      donut_crown:  `<rect x="22" y="19" width="36" height="5" rx="2" fill="#7c3aed"/><circle cx="29" cy="14" r="5.5" fill="#92400e"/><circle cx="29" cy="14" r="2.8" fill="${skin}"/><circle cx="27" cy="12" r="0.9" fill="#fbbf24"/><circle cx="31" cy="12" r="0.9" fill="#f87171"/><circle cx="30" cy="16.5" r="0.9" fill="#6ee7b7"/><circle cx="40" cy="8.5" r="6.5" fill="#f472b6"/><circle cx="40" cy="8.5" r="3.2" fill="${skin}"/><circle cx="37.5" cy="6.5" r="1" fill="#fbbf24"/><circle cx="42.5" cy="6.5" r="1" fill="#a78bfa"/><circle cx="40" cy="12" r="1" fill="#6ee7b7"/><circle cx="51" cy="14" r="5.5" fill="#f87171"/><circle cx="51" cy="14" r="2.8" fill="${skin}"/><circle cx="49" cy="12" r="0.9" fill="#a78bfa"/><circle cx="53" cy="12" r="0.9" fill="#fbbf24"/><circle cx="51" cy="16.5" r="0.9" fill="#6ee7b7"/>`,
      party_hat:    `<polygon points="40,5 27,23 53,23" fill="#f472b6"/><line x1="40" y1="5" x2="30" y2="23" stroke="#fbbf24" stroke-width="2" opacity="0.6"/><line x1="40" y1="5" x2="50" y2="23" stroke="#60a5fa" stroke-width="2" opacity="0.6"/><ellipse cx="40" cy="23" rx="13" ry="2.5" fill="#a21caf" opacity="0.8"/><circle cx="40" cy="5" r="2.5" fill="#fbbf24"/><path d="M52,20 Q58,15 56,9" stroke="#fbbf24" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M28,20 Q22,15 24,9" stroke="#4ade80" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
      wizard_hat:   `<ellipse cx="40" cy="21" rx="16" ry="4" fill="#4c1d95"/><polygon points="40,2 26,22 54,22" fill="#5b21b6"/><circle cx="36" cy="12" r="1.8" fill="#fbbf24"/><circle cx="44" cy="9" r="1.3" fill="#a5f3fc" opacity="0.9"/><circle cx="46" cy="16" r="1.5" fill="#fbbf24" opacity="0.85"/><circle cx="32" cy="16" r="1.2" fill="#a5f3fc" opacity="0.9"/>`,
      flower_crown: `<path d="M21,25 Q31,13 40,13 Q49,13 59,25" stroke="#16a34a" stroke-width="2.5" fill="none"/><circle cx="27" cy="19" r="3.5" fill="#fda4af"/><circle cx="27" cy="19" r="1.6" fill="#fef9c3"/><circle cx="40" cy="13" r="4" fill="#fb923c"/><circle cx="40" cy="13" r="1.8" fill="#fef9c3"/><circle cx="53" cy="19" r="3.5" fill="#c4b5fd"/><circle cx="53" cy="19" r="1.6" fill="#fef9c3"/><circle cx="33" cy="15" r="2.5" fill="#86efac"/><circle cx="33" cy="15" r="1.1" fill="#fef9c3"/><circle cx="47" cy="15" r="2.5" fill="#7dd3fc"/><circle cx="47" cy="15" r="1.1" fill="#fef9c3"/>`,
      halo:         `<ellipse cx="40" cy="11" rx="15" ry="4" fill="none" stroke="#fbbf24" stroke-width="2.5"/><ellipse cx="40" cy="11" rx="15" ry="4" fill="rgba(251,191,36,0.12)"/><line x1="33" y1="11" x2="34" y2="20" stroke="#fbbf24" stroke-width="1.5" opacity="0.45"/><line x1="47" y1="11" x2="46" y2="20" stroke="#fbbf24" stroke-width="1.5" opacity="0.45"/>`,
      ninja_headband:`<rect x="18" y="23" width="44" height="7" rx="3" fill="#1e1b4b"/><rect x="18" y="23" width="44" height="2.5" rx="1.5" fill="#3730a3" opacity="0.6"/><circle cx="40" cy="26.5" r="4" fill="#ef4444"/><circle cx="40" cy="26.5" r="2" fill="#dc2626" opacity="0.7"/><path d="M57,26 Q62,22 61,17" stroke="#1e1b4b" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M57,30 Q63,28 62,23" stroke="#1e1b4b" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    };
    // Face accessories
    const faceAccSVG = {
      glasses:        `<circle cx="34" cy="36" r="6" fill="none" stroke="#374151" stroke-width="1.8"/><circle cx="46" cy="36" r="6" fill="none" stroke="#374151" stroke-width="1.8"/><line x1="40" y1="36" x2="40" y2="36" stroke="#374151" stroke-width="1.8"/><line x1="27" y1="34" x2="28" y2="36" stroke="#374151" stroke-width="1.5"/><line x1="52" y1="34" x2="53" y2="36" stroke="#374151" stroke-width="1.5"/>`,
      monocle:        `<circle cx="46" cy="36" r="7" fill="none" stroke="#78350f" stroke-width="2"/><line x1="51" y1="41" x2="54" y2="48" stroke="#78350f" stroke-width="1.5"/>`,
      safety_goggles: `<rect x="26" y="30" width="28" height="12" rx="6" fill="#bfdbfe" opacity="0.5" stroke="#3b82f6" stroke-width="1.5"/><line x1="20" y1="36" x2="26" y2="36" stroke="#3b82f6" stroke-width="1.5"/><line x1="54" y1="36" x2="60" y2="36" stroke="#3b82f6" stroke-width="1.5"/>`,
      mask:           `<rect x="28" y="42" width="24" height="12" rx="4" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.2"/><line x1="28" y1="46" x2="52" y2="46" stroke="#94a3b8" stroke-width="0.8"/><line x1="28" y1="50" x2="52" y2="50" stroke="#94a3b8" stroke-width="0.8"/>`,
      sunglasses:     `<rect x="25" y="32" width="12" height="8" rx="3" fill="#1e1b4b" opacity="0.9"/><rect x="43" y="32" width="12" height="8" rx="3" fill="#1e1b4b" opacity="0.9"/><line x1="37" y1="36" x2="43" y2="36" stroke="#374151" stroke-width="2"/><line x1="19" y1="34" x2="25" y2="36" stroke="#374151" stroke-width="1.8"/><line x1="55" y1="36" x2="61" y2="34" stroke="#374151" stroke-width="1.8"/><rect x="25" y="32" width="12" height="4" rx="2" fill="rgba(255,255,255,0.08)"/>`,
      star_sticker:   `<path d="M51,37 L52.5,41.5 L57.2,41.5 L53.4,44.2 L54.8,48.8 L51,46.1 L47.2,48.8 L48.6,44.2 L44.8,41.5 L49.5,41.5 Z" fill="#fbbf24" opacity="0.95"/>`,
      magnifying_glass:`<circle cx="45" cy="37" r="8" fill="none" stroke="#374151" stroke-width="2.2"/><circle cx="45" cy="37" r="6.5" fill="rgba(147,197,253,0.22)"/><line x1="51" y1="43" x2="58" y2="52" stroke="#374151" stroke-width="3" stroke-linecap="round"/><circle cx="43" cy="34.5" r="1.8" fill="white" opacity="0.65"/>`,
    };

    const customImg = t => customSlots['_img_'+t] && customSlots[t]
      ? `<image href="${customSlots['_img_'+t]}" x="-10" y="0" width="100" height="120" preserveAspectRatio="none"/>`
      : '';

    return `<svg viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
  ${coatFillDef}
  <!-- Body / Lab coat -->
  <rect x="14" y="60" width="52" height="58" rx="10" fill="${coatFillRef}" stroke="#e2e8f0" stroke-width="1"/>
  <!-- Custom coat overlay: on top of coat colour, under collar/pocket/face details -->
  ${customImg('coat')}
  <!-- Coat collar -->
  <polygon points="40,62 30,78 40,84" fill="white" opacity="0.35"/>
  <polygon points="40,62 50,78 40,84" fill="white" opacity="0.35"/>
  <!-- Pocket -->
  <rect x="18" y="78" width="12" height="9" rx="3" fill="none" stroke="#e2e8f0" stroke-width="1.2"/>
  <line x1="22" y1="80" x2="22" y2="87" stroke="#a5b4fc" stroke-width="1" opacity="0.6"/>
  <!-- Badge pins -->
  ${_buildBadgePins(scientist)}
  <!-- Neck -->
  <rect x="33" y="54" width="14" height="10" rx="3" fill="${skin}"/>
  <!-- Head -->
  <ellipse cx="40" cy="38" rx="22" ry="22" fill="${skin}"/>
  <!-- Ears -->
  <ellipse cx="18" cy="40" rx="4.5" ry="5.5" fill="${skin}"/>
  <ellipse cx="62" cy="40" rx="4.5" ry="5.5" fill="${skin}"/>
  <!-- Face -->
  ${(brows[reaction]||brows.neutral)}
  ${(eyes[reaction]||eyes.neutral)}
  <ellipse cx="40" cy="41" rx="2" ry="1.5" fill="rgba(0,0,0,0.12)"/>
  ${(mouths[reaction]||mouths.neutral)}
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
    cat: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <!-- Body -->
      <ellipse cx="40" cy="54" rx="18" ry="14" fill="#6b7280"/>
      <!-- Front paws -->
      <ellipse cx="28" cy="66" rx="5" ry="3" fill="#9ca3af"/>
      <ellipse cx="52" cy="66" rx="5" ry="3" fill="#9ca3af"/>
      <!-- Head -->
      <circle cx="40" cy="30" r="16" fill="#6b7280"/>
      <!-- Ears -->
      <polygon points="28,18 22,2 34,14" fill="#6b7280"/>
      <polygon points="52,18 58,2 46,14" fill="#6b7280"/>
      <polygon points="29,17 24,5 33,14" fill="#f9a8d4" opacity=".35"/>
      <polygon points="51,17 56,5 47,14" fill="#f9a8d4" opacity=".35"/>
      <!-- Eyes -->
      <ellipse cx="33" cy="28" rx="4" ry="4.5" fill="#fbbf24"/>
      <ellipse cx="47" cy="28" rx="4" ry="4.5" fill="#fbbf24"/>
      <ellipse cx="33" cy="28" rx="2" ry="3.5" fill="#1e1b4b"/>
      <ellipse cx="47" cy="28" rx="2" ry="3.5" fill="#1e1b4b"/>
      <ellipse cx="32" cy="26" rx="1" ry="1.5" fill="#fff" opacity=".7"/>
      <ellipse cx="46" cy="26" rx="1" ry="1.5" fill="#fff" opacity=".7"/>
      <!-- Nose -->
      <path d="M38,34 L40,36 L42,34 Z" fill="#f9a8d4"/>
      <!-- Mouth -->
      <path d="M40,36 L40,38" stroke="#4b5563" stroke-width=".8"/>
      <path d="M37,39 Q40,41 43,39" stroke="#4b5563" stroke-width=".8" fill="none"/>
      <!-- Whiskers -->
      <line x1="24" y1="32" x2="10" y2="29" stroke="#9ca3af" stroke-width=".7"/>
      <line x1="24" y1="35" x2="10" y2="36" stroke="#9ca3af" stroke-width=".7"/>
      <line x1="56" y1="32" x2="70" y2="29" stroke="#9ca3af" stroke-width=".7"/>
      <line x1="56" y1="35" x2="70" y2="36" stroke="#9ca3af" stroke-width=".7"/>
      <!-- Tail -->
      <path d="M22,52 Q10,40 14,30 Q16,26 18,30" stroke="#6b7280" stroke-width="4" fill="none" stroke-linecap="round"/>
      <!-- Chest marking -->
      <ellipse cx="40" cy="50" rx="8" ry="6" fill="#9ca3af" opacity=".3"/>
    </svg>`,
    ginger_cat: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="54" rx="18" ry="14" fill="#f97316"/>
      <ellipse cx="28" cy="66" rx="5" ry="3" fill="#fb923c"/>
      <ellipse cx="52" cy="66" rx="5" ry="3" fill="#fb923c"/>
      <circle cx="40" cy="30" r="16" fill="#f97316"/>
      <polygon points="28,18 22,2 34,14" fill="#f97316"/>
      <polygon points="52,18 58,2 46,14" fill="#f97316"/>
      <polygon points="29,17 24,5 33,14" fill="#fbbf24" opacity=".2"/>
      <polygon points="51,17 56,5 47,14" fill="#fbbf24" opacity=".2"/>
      <!-- Tabby stripes -->
      <path d="M32,22 L36,18" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M48,22 L44,18" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M40,20 L40,16" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round"/>
      <ellipse cx="33" cy="28" rx="4" ry="4.5" fill="#22c55e"/>
      <ellipse cx="47" cy="28" rx="4" ry="4.5" fill="#22c55e"/>
      <ellipse cx="33" cy="28" rx="2" ry="3.5" fill="#1e1b4b"/>
      <ellipse cx="47" cy="28" rx="2" ry="3.5" fill="#1e1b4b"/>
      <ellipse cx="32" cy="26" rx="1" ry="1.5" fill="#fff" opacity=".7"/>
      <ellipse cx="46" cy="26" rx="1" ry="1.5" fill="#fff" opacity=".7"/>
      <path d="M38,34 L40,36 L42,34 Z" fill="#f9a8d4"/>
      <path d="M40,36 L40,38" stroke="#9a3412" stroke-width=".8"/>
      <path d="M37,39 Q40,41 43,39" stroke="#9a3412" stroke-width=".8" fill="none"/>
      <line x1="24" y1="32" x2="10" y2="29" stroke="#fb923c" stroke-width=".7"/>
      <line x1="24" y1="35" x2="10" y2="36" stroke="#fb923c" stroke-width=".7"/>
      <line x1="56" y1="32" x2="70" y2="29" stroke="#fb923c" stroke-width=".7"/>
      <line x1="56" y1="35" x2="70" y2="36" stroke="#fb923c" stroke-width=".7"/>
      <path d="M22,52 Q10,40 14,30 Q16,26 18,30" stroke="#f97316" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="40" cy="50" rx="8" ry="6" fill="#fbbf24" opacity=".15"/>
    </svg>`,
    puppy: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="54" rx="20" ry="15" fill="#a16207"/>
      <ellipse cx="28" cy="68" rx="5" ry="3" fill="#92400e"/>
      <ellipse cx="52" cy="68" rx="5" ry="3" fill="#92400e"/>
      <circle cx="40" cy="30" r="17" fill="#a16207"/>
      <!-- Floppy ears -->
      <ellipse cx="20" cy="26" rx="8" ry="14" fill="#92400e" transform="rotate(-15,20,26)"/>
      <ellipse cx="60" cy="26" rx="8" ry="14" fill="#92400e" transform="rotate(15,60,26)"/>
      <!-- Eye patches -->
      <circle cx="33" cy="28" r="6" fill="#92400e" opacity=".3"/>
      <circle cx="47" cy="28" r="6" fill="#fff" opacity=".2"/>
      <!-- Eyes -->
      <circle cx="33" cy="28" r="4.5" fill="#fff"/>
      <circle cx="47" cy="28" r="4.5" fill="#fff"/>
      <circle cx="34" cy="28" r="2.5" fill="#1e1b4b"/>
      <circle cx="48" cy="28" r="2.5" fill="#1e1b4b"/>
      <circle cx="34.5" cy="27" r=".8" fill="#fff"/>
      <circle cx="48.5" cy="27" r=".8" fill="#fff"/>
      <!-- Nose -->
      <ellipse cx="40" cy="36" rx="4" ry="3" fill="#1e1b4b"/>
      <ellipse cx="40" cy="35" rx="1.5" ry="1" fill="#fff" opacity=".3"/>
      <!-- Mouth -->
      <path d="M40,39 L40,42" stroke="#78350f" stroke-width="1"/>
      <path d="M36,43 Q40,47 44,43" stroke="#78350f" stroke-width="1" fill="none"/>
      <!-- Tongue -->
      <path d="M38,43 Q40,48 42,43" fill="#ef4444" opacity=".7"/>
      <!-- Tail -->
      <path d="M58,50 Q68,42 64,34 Q62,30 60,34" stroke="#a16207" stroke-width="4" fill="none" stroke-linecap="round"/>
      <!-- Belly -->
      <ellipse cx="40" cy="56" rx="10" ry="6" fill="#d2b48c" opacity=".25"/>
    </svg>`,
    bird: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <!-- Body -->
      <ellipse cx="40" cy="46" rx="14" ry="16" fill="#3b82f6"/>
      <!-- Belly -->
      <ellipse cx="40" cy="50" rx="9" ry="12" fill="#93c5fd" opacity=".4"/>
      <!-- Head -->
      <circle cx="40" cy="24" r="13" fill="#3b82f6"/>
      <!-- Eye -->
      <circle cx="46" cy="22" r="4" fill="#fff"/>
      <circle cx="47" cy="22" r="2" fill="#1e1b4b"/>
      <circle cx="47.5" cy="21" r=".7" fill="#fff"/>
      <!-- Beak -->
      <polygon points="52,26 62,22 52,30" fill="#f59e0b"/>
      <line x1="52" y1="26" x2="60" y2="26" stroke="#d97706" stroke-width=".5"/>
      <!-- Wings -->
      <path d="M26,40 Q10,30 14,46 Q16,52 26,50" fill="#2563eb" opacity=".8"/>
      <path d="M54,40 Q70,30 66,46 Q64,52 54,50" fill="#2563eb" opacity=".8"/>
      <!-- Wing detail -->
      <path d="M16,38 Q20,42 18,46" stroke="#1d4ed8" stroke-width=".8" fill="none"/>
      <path d="M64,38 Q60,42 62,46" stroke="#1d4ed8" stroke-width=".8" fill="none"/>
      <!-- Legs -->
      <line x1="34" y1="60" x2="34" y2="72" stroke="#f59e0b" stroke-width="2.5"/>
      <line x1="46" y1="60" x2="46" y2="72" stroke="#f59e0b" stroke-width="2.5"/>
      <path d="M30,72 L34,72 L38,72" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
      <path d="M42,72 L46,72 L50,72" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
      <!-- Crown feathers -->
      <circle cx="36" cy="12" r="2" fill="#60a5fa"/>
      <circle cx="40" cy="10" r="2.5" fill="#3b82f6"/>
      <circle cx="44" cy="12" r="2" fill="#60a5fa"/>
    </svg>`,
    frog: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <!-- Body -->
      <ellipse cx="40" cy="48" rx="22" ry="16" fill="#16a34a"/>
      <!-- Belly -->
      <ellipse cx="40" cy="52" rx="14" ry="10" fill="#86efac" opacity=".3"/>
      <!-- Head -->
      <ellipse cx="40" cy="32" rx="20" ry="14" fill="#22c55e"/>
      <!-- Bulging eyes -->
      <circle cx="26" cy="20" r="8" fill="#22c55e"/>
      <circle cx="54" cy="20" r="8" fill="#22c55e"/>
      <circle cx="26" cy="20" r="5.5" fill="#fff"/>
      <circle cx="54" cy="20" r="5.5" fill="#fff"/>
      <circle cx="27" cy="19" r="2.5" fill="#1e1b4b"/>
      <circle cx="55" cy="19" r="2.5" fill="#1e1b4b"/>
      <circle cx="27.5" cy="18" r=".8" fill="#fff"/>
      <circle cx="55.5" cy="18" r=".8" fill="#fff"/>
      <!-- Wide smile -->
      <path d="M26,38 Q40,46 54,38" stroke="#15803d" stroke-width="2" fill="none"/>
      <!-- Blush -->
      <ellipse cx="24" cy="36" rx="3.5" ry="2" fill="#f87171" opacity=".2"/>
      <ellipse cx="56" cy="36" rx="3.5" ry="2" fill="#f87171" opacity=".2"/>
      <!-- Nostrils -->
      <circle cx="36" cy="30" r="1.2" fill="#15803d"/>
      <circle cx="44" cy="30" r="1.2" fill="#15803d"/>
      <!-- Front legs -->
      <ellipse cx="22" cy="60" rx="7" ry="3.5" fill="#16a34a"/>
      <ellipse cx="58" cy="60" rx="7" ry="3.5" fill="#16a34a"/>
      <!-- Toes -->
      <circle cx="17" cy="60" r="1.5" fill="#15803d"/>
      <circle cx="20" cy="62" r="1.5" fill="#15803d"/>
      <circle cx="60" cy="62" r="1.5" fill="#15803d"/>
      <circle cx="63" cy="60" r="1.5" fill="#15803d"/>
      <!-- Back leg hint -->
      <ellipse cx="18" cy="52" rx="6" ry="10" fill="#15803d" opacity=".3" transform="rotate(-20,18,52)"/>
      <ellipse cx="62" cy="52" rx="6" ry="10" fill="#15803d" opacity=".3" transform="rotate(20,62,52)"/>
    </svg>`,
    owl: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <!-- Body -->
      <ellipse cx="40" cy="52" rx="18" ry="18" fill="#78350f"/>
      <!-- Belly feathers -->
      <ellipse cx="40" cy="56" rx="12" ry="12" fill="#d2b48c" opacity=".3"/>
      <path d="M34,48 Q40,44 46,48" stroke="#92400e" stroke-width=".8" fill="none" opacity=".4"/>
      <path d="M32,54 Q40,50 48,54" stroke="#92400e" stroke-width=".8" fill="none" opacity=".4"/>
      <path d="M34,60 Q40,56 46,60" stroke="#92400e" stroke-width=".8" fill="none" opacity=".4"/>
      <!-- Head -->
      <ellipse cx="40" cy="28" rx="20" ry="18" fill="#92400e"/>
      <!-- Ear tufts -->
      <polygon points="22,14 16,0 30,12" fill="#92400e"/>
      <polygon points="58,14 64,0 50,12" fill="#92400e"/>
      <polygon points="23,14 18,3 29,12" fill="#b45309" opacity=".3"/>
      <polygon points="57,14 62,3 51,12" fill="#b45309" opacity=".3"/>
      <!-- Facial disc -->
      <circle cx="30" cy="26" r="9" fill="#fef3c7" opacity=".6"/>
      <circle cx="50" cy="26" r="9" fill="#fef3c7" opacity=".6"/>
      <!-- Eyes -->
      <circle cx="30" cy="26" r="6" fill="#f59e0b"/>
      <circle cx="50" cy="26" r="6" fill="#f59e0b"/>
      <circle cx="30" cy="26" r="3" fill="#1e1b4b"/>
      <circle cx="50" cy="26" r="3" fill="#1e1b4b"/>
      <circle cx="31" cy="24.5" r="1" fill="#fff" opacity=".7"/>
      <circle cx="51" cy="24.5" r="1" fill="#fff" opacity=".7"/>
      <!-- Beak -->
      <polygon points="40,32 37,38 43,38" fill="#f59e0b"/>
      <!-- Wings -->
      <path d="M22,44 Q12,36 16,54 Q18,60 24,58" fill="#78350f"/>
      <path d="M58,44 Q68,36 64,54 Q62,60 56,58" fill="#78350f"/>
      <!-- Feet -->
      <path d="M32,68 L30,74 M32,68 L32,74 M32,68 L34,74" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
      <path d="M48,68 L46,74 M48,68 L48,74 M48,68 L50,74" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    dragon: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <!-- Body -->
      <ellipse cx="38" cy="52" rx="18" ry="14" fill="#7c3aed"/>
      <!-- Belly -->
      <ellipse cx="38" cy="54" rx="10" ry="8" fill="#a78bfa" opacity=".25"/>
      <!-- Belly scales -->
      <path d="M32,50 Q38,48 44,50" stroke="#6d28d9" stroke-width=".6" fill="none" opacity=".4"/>
      <path d="M33,54 Q38,52 43,54" stroke="#6d28d9" stroke-width=".6" fill="none" opacity=".4"/>
      <!-- Head -->
      <circle cx="40" cy="28" r="15" fill="#7c3aed"/>
      <!-- Horns -->
      <polygon points="28,16 22,0 34,14" fill="#8b5cf6"/>
      <polygon points="52,16 58,0 46,14" fill="#8b5cf6"/>
      <!-- Eyes -->
      <ellipse cx="33" cy="26" rx="4" ry="4.5" fill="#fbbf24"/>
      <ellipse cx="47" cy="26" rx="4" ry="4.5" fill="#fbbf24"/>
      <ellipse cx="33" cy="26" rx="2" ry="3.5" fill="#1e1b4b"/>
      <ellipse cx="47" cy="26" rx="2" ry="3.5" fill="#1e1b4b"/>
      <ellipse cx="32" cy="24.5" rx=".8" ry="1.2" fill="#fff" opacity=".6"/>
      <ellipse cx="46" cy="24.5" rx=".8" ry="1.2" fill="#fff" opacity=".6"/>
      <!-- Nostrils -->
      <ellipse cx="36" cy="34" rx="1.5" ry="1" fill="#5b21b6"/>
      <ellipse cx="44" cy="34" rx="1.5" ry="1" fill="#5b21b6"/>
      <!-- Mouth -->
      <path d="M34,38 Q40,41 46,38" stroke="#5b21b6" stroke-width="1.2" fill="none"/>
      <!-- Little flame -->
      <path d="M40,14 Q38,8 40,4 Q42,8 40,14" fill="#ef4444" opacity=".6"/>
      <path d="M40,14 Q39,10 40,7 Q41,10 40,14" fill="#fbbf24" opacity=".5"/>
      <!-- Wings -->
      <path d="M20,38 Q6,24 10,42 Q12,48 22,46" fill="#8b5cf6" opacity=".8"/>
      <path d="M56,38 Q70,24 66,42 Q64,48 54,46" fill="#8b5cf6" opacity=".8"/>
      <path d="M10,30 L16,38" stroke="#7c3aed" stroke-width=".8"/><path d="M10,36 L16,42" stroke="#7c3aed" stroke-width=".8"/>
      <path d="M66,30 L60,38" stroke="#7c3aed" stroke-width=".8"/><path d="M66,36 L60,42" stroke="#7c3aed" stroke-width=".8"/>
      <!-- Spines -->
      <circle cx="40" cy="42" r="2" fill="#8b5cf6"/><circle cx="40" cy="47" r="1.8" fill="#8b5cf6"/><circle cx="40" cy="51" r="1.5" fill="#8b5cf6"/>
      <!-- Tail -->
      <path d="M56,54 Q66,48 64,40 Q62,36 58,40" stroke="#7c3aed" stroke-width="4" fill="none" stroke-linecap="round"/>
      <polygon points="58,38 62,34 56,42" fill="#8b5cf6"/>
      <!-- Feet -->
      <ellipse cx="28" cy="64" rx="5" ry="3" fill="#6d28d9"/>
      <ellipse cx="48" cy="64" rx="5" ry="3" fill="#6d28d9"/>
    </svg>`,
    horse: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <!-- Body -->
      <ellipse cx="36" cy="50" rx="22" ry="14" fill="#92400e"/>
      <!-- Head + neck -->
      <path d="M50,44 Q54,34 52,22 Q50,14 46,12 Q40,10 38,14 Q36,18 38,24 Q40,30 44,34 Q48,38 50,44" fill="#92400e"/>
      <!-- Muzzle -->
      <ellipse cx="42" cy="22" rx="6" ry="4" fill="#a16207"/>
      <!-- Nostril -->
      <circle cx="40" cy="22" r="1.2" fill="#78350f"/>
      <!-- Eye -->
      <circle cx="48" cy="18" r="3" fill="#1e1b4b"/>
      <circle cx="48.5" cy="17" r="1" fill="#fff"/>
      <!-- Ears -->
      <polygon points="46,10 44,2 50,8" fill="#92400e"/>
      <polygon points="50,10 52,2 54,8" fill="#92400e"/>
      <polygon points="47,10 45,4 49,8" fill="#b45309" opacity=".3"/>
      <!-- Mane -->
      <path d="M48,8 Q44,4 42,10 Q40,14 38,10 Q36,6 34,12 Q32,16 30,12 Q28,8 28,16 Q28,20 32,22" stroke="#4a2c0a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Legs -->
      <line x1="22" y1="60" x2="22" y2="74" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
      <line x1="32" y1="62" x2="32" y2="74" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
      <line x1="42" y1="62" x2="42" y2="74" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
      <line x1="50" y1="60" x2="50" y2="74" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
      <!-- Hooves -->
      <rect x="19" y="72" width="6" height="3" rx="1.5" fill="#4a2c0a"/>
      <rect x="29" y="72" width="6" height="3" rx="1.5" fill="#4a2c0a"/>
      <rect x="39" y="72" width="6" height="3" rx="1.5" fill="#4a2c0a"/>
      <rect x="47" y="72" width="6" height="3" rx="1.5" fill="#4a2c0a"/>
      <!-- Tail -->
      <path d="M14,48 Q6,42 8,34 Q10,28 12,32 Q14,36 12,40" stroke="#4a2c0a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M14,48 Q8,44 10,38" stroke="#4a2c0a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Belly -->
      <ellipse cx="36" cy="52" rx="12" ry="6" fill="#b45309" opacity=".15"/>
    </svg>`,
    hamster: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <!-- Body -->
      <ellipse cx="40" cy="52" rx="20" ry="16" fill="#f5d0a9"/>
      <!-- Head -->
      <circle cx="40" cy="30" r="18" fill="#f5d0a9"/>
      <!-- Ears -->
      <ellipse cx="24" cy="18" rx="7" ry="9" fill="#f5d0a9"/>
      <ellipse cx="56" cy="18" rx="7" ry="9" fill="#f5d0a9"/>
      <ellipse cx="24" cy="18" rx="4.5" ry="6" fill="#fce7f3"/>
      <ellipse cx="56" cy="18" rx="4.5" ry="6" fill="#fce7f3"/>
      <!-- Cheek pouches -->
      <ellipse cx="24" cy="36" rx="8" ry="6" fill="#fde68a" opacity=".3"/>
      <ellipse cx="56" cy="36" rx="8" ry="6" fill="#fde68a" opacity=".3"/>
      <!-- Eyes -->
      <circle cx="32" cy="28" r="4" fill="#1e1b4b"/>
      <circle cx="48" cy="28" r="4" fill="#1e1b4b"/>
      <circle cx="33" cy="26.5" r="1.3" fill="#fff"/>
      <circle cx="49" cy="26.5" r="1.3" fill="#fff"/>
      <!-- Nose -->
      <ellipse cx="40" cy="34" rx="2" ry="1.5" fill="#f9a8d4"/>
      <!-- Mouth -->
      <path d="M38,36 Q40,38 42,36" stroke="#d4a373" stroke-width=".8" fill="none"/>
      <!-- Whiskers -->
      <line x1="26" y1="34" x2="14" y2="32" stroke="#e7c9a5" stroke-width=".6"/>
      <line x1="26" y1="36" x2="14" y2="37" stroke="#e7c9a5" stroke-width=".6"/>
      <line x1="54" y1="34" x2="66" y2="32" stroke="#e7c9a5" stroke-width=".6"/>
      <line x1="54" y1="36" x2="66" y2="37" stroke="#e7c9a5" stroke-width=".6"/>
      <!-- Front paws -->
      <ellipse cx="30" cy="64" rx="5" ry="3" fill="#e7c9a5"/>
      <ellipse cx="50" cy="64" rx="5" ry="3" fill="#e7c9a5"/>
      <!-- Belly -->
      <ellipse cx="40" cy="54" rx="12" ry="8" fill="#fff" opacity=".15"/>
      <!-- Back marking -->
      <path d="M30,20 Q40,16 50,20" stroke="#d4a373" stroke-width="2" fill="none" opacity=".3"/>
    </svg>`,
  };

  function buildPetSVG(petId, reaction) {
    if (!petId || !PET_SVGS[petId]) return '';
    return PET_SVGS[petId];
  }

  // ── Pet stage injection ─────────────────────────────────────
  function _injectPetStage(sd) {
    // Pets hidden for now — keeping code for future use
    document.querySelectorAll('#petCharWrap').forEach(el => {
      el.style.display = 'none';
      const tank = el.closest('.pet-tank');
      if (tank) tank.style.display = 'none';
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

  function react(type, extras) {
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
    if (!_widgetEl) return;
    const rect = _widgetEl.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.textContent = `+${n} ⚛️`;
    pop.style.cssText = `position:fixed;left:${rect.left + 20}px;top:${rect.top - 10}px;font-family:Lexend,sans-serif;font-size:13px;font-weight:900;color:#4338ca;pointer-events:none;z-index:9999;animation:wlPopUp .8s ease forwards;`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 850);
  }

  function _showBadgeToast(badgeId) {
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
