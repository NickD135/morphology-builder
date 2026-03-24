// ═══════════════════════════════════════════════════════════════
// WORD LAB — Scientist Character Module
// Exposes: WLScientist.inject(), react(), refresh(), buildSVG(), openProfile()
// ═══════════════════════════════════════════════════════════════

const WLScientist = (() => {

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
    cat: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="40" rx="14" ry="12" fill="#6b7280"/>
      <circle cx="30" cy="22" r="12" fill="#6b7280"/>
      <polygon points="22,14 18,2 26,11" fill="#6b7280"/><polygon points="22,14 19,4 26,11" fill="#9ca3af" opacity=".4"/>
      <polygon points="38,14 42,2 34,11" fill="#6b7280"/><polygon points="38,14 41,4 34,11" fill="#9ca3af" opacity=".4"/>
      <circle cx="25" cy="20" r="3" fill="#fbbf24"/><circle cx="25" cy="20" r="1.2" fill="#1e1b4b"/>
      <circle cx="35" cy="20" r="3" fill="#fbbf24"/><circle cx="35" cy="20" r="1.2" fill="#1e1b4b"/>
      <ellipse cx="30" cy="26" rx="2" ry="1.2" fill="#f9a8d4"/>
      <line x1="18" y1="24" x2="8" y2="22" stroke="#9ca3af" stroke-width=".8"/>
      <line x1="18" y1="26" x2="8" y2="27" stroke="#9ca3af" stroke-width=".8"/>
      <line x1="42" y1="24" x2="52" y2="22" stroke="#9ca3af" stroke-width=".8"/>
      <line x1="42" y1="26" x2="52" y2="27" stroke="#9ca3af" stroke-width=".8"/>
      <path d="M16,48 Q10,38 14,42" stroke="#6b7280" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`,
    ginger_cat: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="40" rx="14" ry="12" fill="#f97316"/>
      <circle cx="30" cy="22" r="12" fill="#f97316"/>
      <polygon points="22,14 18,2 26,11" fill="#f97316"/><polygon points="22,14 19,4 26,11" fill="#fb923c" opacity=".5"/>
      <polygon points="38,14 42,2 34,11" fill="#f97316"/><polygon points="38,14 41,4 34,11" fill="#fb923c" opacity=".5"/>
      <circle cx="25" cy="20" r="3" fill="#16a34a"/><circle cx="25" cy="20" r="1.2" fill="#1e1b4b"/>
      <circle cx="35" cy="20" r="3" fill="#16a34a"/><circle cx="35" cy="20" r="1.2" fill="#1e1b4b"/>
      <ellipse cx="30" cy="26" rx="2" ry="1.2" fill="#f9a8d4"/>
      <line x1="18" y1="24" x2="8" y2="22" stroke="#ea580c" stroke-width=".8"/>
      <line x1="18" y1="26" x2="8" y2="27" stroke="#ea580c" stroke-width=".8"/>
      <line x1="42" y1="24" x2="52" y2="22" stroke="#ea580c" stroke-width=".8"/>
      <line x1="42" y1="26" x2="52" y2="27" stroke="#ea580c" stroke-width=".8"/>
      <path d="M25,35 L28,40 L32,40 L35,35" stroke="#ea580c" stroke-width="1.2" fill="none"/>
      <path d="M16,48 Q10,38 14,42" stroke="#f97316" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`,
    puppy: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="40" rx="15" ry="12" fill="#a16207"/>
      <circle cx="30" cy="22" r="13" fill="#a16207"/>
      <ellipse cx="18" cy="16" rx="7" ry="10" fill="#92400e" transform="rotate(-15,18,16)"/>
      <ellipse cx="42" cy="16" rx="7" ry="10" fill="#92400e" transform="rotate(15,42,16)"/>
      <circle cx="24" cy="20" r="3.5" fill="#fff"/><circle cx="24" cy="20" r="1.5" fill="#1e1b4b"/>
      <circle cx="36" cy="20" r="3.5" fill="#fff"/><circle cx="36" cy="20" r="1.5" fill="#1e1b4b"/>
      <ellipse cx="30" cy="27" rx="4" ry="2.5" fill="#1e1b4b"/>
      <path d="M26,31 Q30,37 34,31" stroke="#dc2626" stroke-width="1.5" fill="#ef4444" opacity=".7"/>
      <path d="M44,48 Q52,42 48,38" stroke="#a16207" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`,
    bird: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="36" rx="12" ry="10" fill="#3b82f6"/>
      <circle cx="30" cy="20" r="10" fill="#3b82f6"/>
      <circle cx="35" cy="17" r="3" fill="#fff"/><circle cx="35" cy="17" r="1.2" fill="#1e1b4b"/>
      <polygon points="40,20 50,17 40,24" fill="#f59e0b"/>
      <path d="M18,32 Q8,24 12,36" stroke="#2563eb" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M18,36 Q10,30 14,40" stroke="#2563eb" stroke-width="2" fill="none" stroke-linecap="round"/>
      <line x1="25" y1="46" x2="25" y2="54" stroke="#f59e0b" stroke-width="2"/>
      <line x1="35" y1="46" x2="35" y2="54" stroke="#f59e0b" stroke-width="2"/>
      <path d="M23,54 L25,54 L27,54" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M33,54 L35,54 L37,54" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
      <ellipse cx="30" cy="34" rx="6" ry="4" fill="#93c5fd" opacity=".3"/>
    </svg>`,
    frog: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="38" rx="16" ry="12" fill="#16a34a"/>
      <ellipse cx="30" cy="24" rx="16" ry="12" fill="#22c55e"/>
      <circle cx="22" cy="14" r="6" fill="#22c55e"/><circle cx="38" cy="14" r="6" fill="#22c55e"/>
      <circle cx="22" cy="14" r="3.5" fill="#fff"/><circle cx="38" cy="14" r="3.5" fill="#fff"/>
      <circle cx="22" cy="14" r="1.5" fill="#1e1b4b"/><circle cx="38" cy="14" r="1.5" fill="#1e1b4b"/>
      <path d="M24,28 Q30,32 36,28" stroke="#15803d" stroke-width="1.5" fill="none"/>
      <ellipse cx="22" cy="30" rx="2" ry="1" fill="#f87171" opacity=".3"/>
      <ellipse cx="38" cy="30" rx="2" ry="1" fill="#f87171" opacity=".3"/>
      <ellipse cx="16" cy="46" rx="6" ry="2.5" fill="#15803d" transform="rotate(-10,16,46)"/>
      <ellipse cx="44" cy="46" rx="6" ry="2.5" fill="#15803d" transform="rotate(10,44,46)"/>
    </svg>`,
    owl: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="38" rx="14" ry="13" fill="#78350f"/>
      <ellipse cx="30" cy="22" rx="15" ry="14" fill="#92400e"/>
      <circle cx="22" cy="20" r="7" fill="#fef3c7"/><circle cx="38" cy="20" r="7" fill="#fef3c7"/>
      <circle cx="22" cy="20" r="3.5" fill="#f59e0b"/><circle cx="38" cy="20" r="3.5" fill="#f59e0b"/>
      <circle cx="22" cy="20" r="1.5" fill="#1e1b4b"/><circle cx="38" cy="20" r="1.5" fill="#1e1b4b"/>
      <polygon points="30,26 27,32 33,32" fill="#f59e0b"/>
      <polygon points="18,10 14,2 24,10" fill="#92400e"/>
      <polygon points="42,10 46,2 36,10" fill="#92400e"/>
      <path d="M16,32 Q8,26 12,38" stroke="#78350f" stroke-width="2.5" fill="none"/>
      <path d="M44,32 Q52,26 48,38" stroke="#78350f" stroke-width="2.5" fill="none"/>
      <ellipse cx="30" cy="40" rx="8" ry="5" fill="#d2b48c" opacity=".35"/>
      <line x1="24" y1="50" x2="24" y2="56" stroke="#f59e0b" stroke-width="2"/>
      <line x1="36" y1="50" x2="36" y2="56" stroke="#f59e0b" stroke-width="2"/>
    </svg>`,
    dragon: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="40" rx="13" ry="10" fill="#7c3aed"/>
      <circle cx="30" cy="22" r="12" fill="#7c3aed"/>
      <polygon points="22,12 18,0 26,10" fill="#8b5cf6"/>
      <polygon points="38,12 42,0 34,10" fill="#8b5cf6"/>
      <circle cx="24" cy="20" r="3" fill="#fbbf24"/><circle cx="24" cy="20" r="1.2" fill="#1e1b4b"/>
      <circle cx="36" cy="20" r="3" fill="#fbbf24"/><circle cx="36" cy="20" r="1.2" fill="#1e1b4b"/>
      <path d="M26,28 Q30,31 34,28" stroke="#5b21b6" stroke-width="1.5" fill="none"/>
      <path d="M16,30 Q6,22 10,36" stroke="#7c3aed" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M44,30 Q54,22 50,36" stroke="#7c3aed" stroke-width="3" fill="none" stroke-linecap="round"/>
      <polygon points="30,10 28,16 32,16" fill="#ef4444" opacity=".7"/>
      <path d="M44,48 Q52,44 50,38" stroke="#7c3aed" stroke-width="3" fill="none" stroke-linecap="round"/>
      <polygon points="50,36 54,34 50,40" fill="#8b5cf6"/>
      <ellipse cx="22" cy="40" rx="3" ry="1.5" fill="#5b21b6" opacity=".3"/>
      <ellipse cx="38" cy="40" rx="3" ry="1.5" fill="#5b21b6" opacity=".3"/>
    </svg>`,
    horse: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="28" cy="38" rx="16" ry="12" fill="#92400e"/>
      <ellipse cx="38" cy="20" rx="10" ry="14" fill="#92400e" transform="rotate(15,38,20)"/>
      <polygon points="40,8 38,0 44,6" fill="#78350f"/>
      <polygon points="44,8 42,0 48,6" fill="#78350f"/>
      <circle cx="42" cy="16" r="2.5" fill="#1e1b4b"/><circle cx="42" cy="16" r=".8" fill="#fff"/>
      <ellipse cx="46" cy="22" rx="4" ry="2.5" fill="#78350f"/>
      <circle cx="47" cy="21" r="1" fill="#1e1b4b"/>
      <path d="M34,6 Q30,0 26,6 Q24,10 28,8 Q30,4 32,8 Q34,10 36,6" stroke="#4a2c0a" stroke-width="1.8" fill="none"/>
      <line x1="18" y1="48" x2="18" y2="56" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
      <line x1="26" y1="50" x2="26" y2="56" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
      <line x1="32" y1="50" x2="32" y2="56" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
      <line x1="38" y1="48" x2="38" y2="56" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
      <path d="M14,38 Q6,34 8,42" stroke="#4a2c0a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </svg>`,
    hamster: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="38" rx="15" ry="11" fill="#f5d0a9"/>
      <circle cx="30" cy="22" r="13" fill="#f5d0a9"/>
      <ellipse cx="19" cy="14" rx="5" ry="7" fill="#f5d0a9"/>
      <ellipse cx="41" cy="14" rx="5" ry="7" fill="#f5d0a9"/>
      <ellipse cx="19" cy="14" rx="3" ry="4.5" fill="#fce7f3"/>
      <ellipse cx="41" cy="14" rx="3" ry="4.5" fill="#fce7f3"/>
      <circle cx="24" cy="20" r="2.8" fill="#1e1b4b"/><circle cx="24" cy="19" r=".9" fill="#fff"/>
      <circle cx="36" cy="20" r="2.8" fill="#1e1b4b"/><circle cx="36" cy="19" r=".9" fill="#fff"/>
      <ellipse cx="30" cy="26" rx="2" ry="1.2" fill="#f9a8d4"/>
      <ellipse cx="22" cy="28" rx="6" ry="4" fill="#fde68a" opacity=".25"/>
      <ellipse cx="38" cy="28" rx="6" ry="4" fill="#fde68a" opacity=".25"/>
      <line x1="20" y1="24" x2="10" y2="22" stroke="#e7c9a5" stroke-width=".8"/>
      <line x1="40" y1="24" x2="50" y2="22" stroke="#e7c9a5" stroke-width=".8"/>
    </svg>`,
  };

  function buildPetSVG(petId, reaction) {
    if (!petId || !PET_SVGS[petId]) return '';
    return PET_SVGS[petId];
  }

  // ── Pet stage injection ─────────────────────────────────────
  function _injectPetStage(sd) {
    const petId = sd && sd.scientist && sd.scientist.pet;
    // Update all pet wraps on the page
    document.querySelectorAll('#petCharWrap').forEach(el => {
      el.innerHTML = petId ? buildPetSVG(petId) : '';
      el.style.display = petId ? '' : 'none';
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

  // ── Reactions ─────────────────────────────────────────────────
  function react(type, extras) {
    extras = extras || {};
    const avatar = () => document.getElementById('wlSciAvatar');
    _petReact(type);

    if (type === 'correct') {
      _renderWidget('happy');
      // Bounce animation
      if (avatar()) {
        avatar().style.transition = 'transform .15s';
        avatar().style.transform  = 'translateY(-6px) scale(1.08)';
        setTimeout(() => { if (avatar()) { avatar().style.transform = ''; } }, 300);
      }
      // Quark pop
      if (extras.quarksEarned > 0) _showQuarkPop(extras.quarksEarned);
      // Badge toasts
      if (extras.newBadges && extras.newBadges.length) {
        extras.newBadges.forEach((id, i) => setTimeout(() => _showBadgeToast(id), i * 1800));
      }
      setTimeout(() => _renderWidget('neutral'), 700);

    } else if (type === 'wrong') {
      _renderWidget('wrong');
      if (_widgetEl) {
        _widgetEl.style.animation = 'wlShake .4s ease';
        setTimeout(() => { if (_widgetEl) _widgetEl.style.animation = ''; }, 450);
      }
      setTimeout(() => _renderWidget('neutral'), 600);

    } else if (type === 'streak') {
      _renderWidget('excited');
      setTimeout(() => _renderWidget('neutral'), 900);
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
      #sciCharWrap { position:relative; z-index:20; }
      #wlSciAvatar { position:relative; z-index:20; }
      #petCharWrap { width:80px; height:80px; transition:transform .2s; }
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

  return { inject, react, refresh, buildSVG, buildPetSVG, openProfile, _restartEffects: _startEquippedEffect, _injectPetStage };

})();
