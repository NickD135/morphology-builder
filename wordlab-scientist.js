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

    // Coat fill — plain or patterned
    const patternDefs = {
      stripes:   `<defs><pattern id="cp" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${coat}"/><line x1="0" y1="0" x2="8" y2="8" stroke="rgba(0,0,0,0.12)" stroke-width="2"/></pattern></defs>`,
      molecules: `<defs><pattern id="cp" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${coat}"/><circle cx="7" cy="7" r="2" fill="rgba(0,0,0,0.1)"/><circle cx="2" cy="2" r="1.2" fill="rgba(0,0,0,0.08)"/><circle cx="12" cy="12" r="1.2" fill="rgba(0,0,0,0.08)"/></pattern></defs>`,
      stars:     `<defs><pattern id="cp" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${coat}"/><text x="2" y="10" font-size="8" opacity="0.18">★</text></pattern></defs>`,
    };
    const coatFillDef  = patternDefs[pattern] || '';
    const coatFillRef  = patternDefs[pattern] ? 'url(#cp)' : coat;

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
    };
    // Face accessories
    const faceAccSVG = {
      glasses:        `<circle cx="34" cy="36" r="6" fill="none" stroke="#374151" stroke-width="1.8"/><circle cx="46" cy="36" r="6" fill="none" stroke="#374151" stroke-width="1.8"/><line x1="40" y1="36" x2="40" y2="36" stroke="#374151" stroke-width="1.8"/><line x1="27" y1="34" x2="28" y2="36" stroke="#374151" stroke-width="1.5"/><line x1="52" y1="34" x2="53" y2="36" stroke="#374151" stroke-width="1.5"/>`,
      monocle:        `<circle cx="46" cy="36" r="7" fill="none" stroke="#78350f" stroke-width="2"/><line x1="51" y1="41" x2="54" y2="48" stroke="#78350f" stroke-width="1.5"/>`,
      safety_goggles: `<rect x="26" y="30" width="28" height="12" rx="6" fill="#bfdbfe" opacity="0.5" stroke="#3b82f6" stroke-width="1.5"/><line x1="20" y1="36" x2="26" y2="36" stroke="#3b82f6" stroke-width="1.5"/><line x1="54" y1="36" x2="60" y2="36" stroke="#3b82f6" stroke-width="1.5"/>`,
      mask:           `<rect x="28" y="42" width="24" height="12" rx="4" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.2"/><line x1="28" y1="46" x2="52" y2="46" stroke="#94a3b8" stroke-width="0.8"/><line x1="28" y1="50" x2="52" y2="50" stroke="#94a3b8" stroke-width="0.8"/>`,
    };

    return `<svg viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
  ${coatFillDef}
  <!-- Body / Lab coat -->
  <rect x="14" y="60" width="52" height="58" rx="10" fill="${coatFillRef}" stroke="#e2e8f0" stroke-width="1"/>
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
  <!-- Custom costume overlays: canvas 400x480, 40px margin, SVG x=-10,y=0 w=100,h=120 -->
  ${['coat','head','face','background'].map(t => customSlots['_img_'+t] && customSlots[t] ? `<image href="${customSlots['_img_'+t]}" x="-10" y="0" width="100" height="120" preserveAspectRatio="none"/>` : '').join('')}
</svg>`;
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

  return { inject, react, refresh, buildSVG, openProfile, _restartEffects: _startEquippedEffect };

})();
