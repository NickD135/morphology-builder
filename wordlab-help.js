/* ──────────────────────────────────────────────────────────────
   wordlab-help.js  —  First-visit instruction popup + help button
   Loaded AFTER wordlab-data.js on every game page.
   Shows an instruction popup on first visit, then provides a
   persistent help (?) button to re-open instructions at any time.
   ────────────────────────────────────────────────────────────── */
var WLHelp = (function() {
  'use strict';

  var _config = null;
  var _popupEl = null;
  var _helpBtnEl = null;
  var _speaking = false;

  // ── CSS ────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('wlHelpCSS')) return;
    var style = document.createElement('style');
    style.id = 'wlHelpCSS';
    style.textContent = [
      '.wlh-overlay {',
      '  position:fixed; inset:0; z-index:9990;',
      '  background:rgba(15,23,42,.88); backdrop-filter:blur(10px);',
      '  display:flex; align-items:center; justify-content:center;',
      '  padding:16px; animation:wlhFadeIn .25s ease-out;',
      '}',
      '@keyframes wlhFadeIn { from{opacity:0} to{opacity:1} }',
      '.wlh-card {',
      '  background:#1e293b; border-radius:24px; padding:32px 28px;',
      '  max-width:520px; width:100%; max-height:90vh; overflow-y:auto;',
      '  box-shadow:0 24px 64px rgba(0,0,0,.5);',
      '  border:1px solid rgba(99,102,241,.15);',
      '  animation:wlhPop .3s ease-out;',
      '}',
      '@keyframes wlhPop { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }',
      '.low-stim .wlh-overlay { animation:none; }',
      '.low-stim .wlh-card { animation:none; }',
      '.wlh-emoji { font-size:48px; text-align:center; margin-bottom:8px; }',
      '.wlh-title {',
      '  font-size:22px; font-weight:900; color:#e0e7ff;',
      '  text-align:center; margin-bottom:4px;',
      '}',
      '.wlh-sub {',
      '  font-size:13px; font-weight:600; color:#94a3b8;',
      '  text-align:center; margin-bottom:20px;',
      '}',
      '.wlh-steps { display:flex; flex-direction:column; gap:10px; margin-bottom:20px; }',
      '.wlh-step {',
      '  display:flex; align-items:flex-start; gap:12px;',
      '  background:rgba(255,255,255,.04); border-radius:14px;',
      '  padding:12px 14px; border:1px solid rgba(99,102,241,.1);',
      '}',
      '.wlh-step-num {',
      '  flex-shrink:0; width:32px; height:32px; border-radius:10px;',
      '  background:#4338ca; color:#fff; font-weight:900; font-size:14px;',
      '  display:flex; align-items:center; justify-content:center;',
      '}',
      '.wlh-step-icon {',
      '  flex-shrink:0; width:32px; height:32px;',
      '  display:flex; align-items:center; justify-content:center;',
      '  font-size:20px;',
      '}',
      '.wlh-step-text { flex:1; min-width:0; }',
      '.wlh-step-title {',
      '  font-size:14px; font-weight:800; color:#e0e7ff; margin-bottom:2px;',
      '}',
      '.wlh-step-desc {',
      '  font-size:12px; font-weight:600; color:#94a3b8; line-height:1.4;',
      '}',
      '.wlh-actions {',
      '  display:flex; flex-direction:column; align-items:center; gap:10px;',
      '}',
      '.wlh-go-btn {',
      '  background:#4338ca; color:#fff; border:none; border-radius:14px;',
      '  padding:14px 36px; font-size:16px; font-weight:900;',
      '  cursor:pointer; font-family:inherit; transition:all .15s;',
      '  width:100%; max-width:280px;',
      '}',
      '.wlh-go-btn:hover { background:#4f46e5; transform:translateY(-2px); }',
      '.wlh-listen-btn {',
      '  background:rgba(99,102,241,.12); color:#a5b4fc; border:1.5px solid rgba(99,102,241,.25);',
      '  border-radius:12px; padding:10px 20px; font-size:13px; font-weight:800;',
      '  cursor:pointer; font-family:inherit; transition:all .15s;',
      '  display:inline-flex; align-items:center; gap:6px;',
      '}',
      '.wlh-listen-btn:hover { background:rgba(99,102,241,.2); border-color:#6366f1; }',
      '.wlh-listen-btn.speaking { background:rgba(220,38,38,.15); color:#f87171; border-color:rgba(220,38,38,.3); }',
      // Floating help button
      '.wlh-float {',
      '  position:fixed; bottom:20px; right:20px; z-index:9980;',
      '  width:44px; height:44px; border-radius:50%;',
      '  background:#4338ca; color:#fff; border:2px solid rgba(255,255,255,.2);',
      '  font-size:20px; font-weight:900; cursor:pointer;',
      '  display:flex; align-items:center; justify-content:center;',
      '  box-shadow:0 4px 16px rgba(67,56,202,.4);',
      '  transition:all .15s; font-family:inherit;',
      '}',
      '.wlh-float:hover { transform:scale(1.1); box-shadow:0 6px 24px rgba(67,56,202,.5); }',
      '@media(max-width:480px) {',
      '  .wlh-card { padding:24px 18px; }',
      '  .wlh-title { font-size:18px; }',
      '  .wlh-float { width:38px; height:38px; font-size:17px; bottom:14px; right:14px; }',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Build popup HTML ───────────────────────────────────────
  function buildPopup() {
    var overlay = document.createElement('div');
    overlay.className = 'wlh-overlay';
    overlay.id = 'wlhOverlay';

    var card = document.createElement('div');
    card.className = 'wlh-card';

    // Emoji + title
    card.innerHTML =
      '<div class="wlh-emoji">' + (_config.emoji || '🎮') + '</div>' +
      '<div class="wlh-title">How to Play</div>' +
      '<div class="wlh-sub">' + escH(_config.title || 'Game') + '</div>';

    // Steps
    var stepsDiv = document.createElement('div');
    stepsDiv.className = 'wlh-steps';
    (_config.steps || []).forEach(function(step, i) {
      var stepEl = document.createElement('div');
      stepEl.className = 'wlh-step';
      stepEl.innerHTML =
        '<div class="wlh-step-icon">' + (step.icon || (i + 1)) + '</div>' +
        '<div class="wlh-step-text">' +
          '<div class="wlh-step-title">' + escH(step.title) + '</div>' +
          '<div class="wlh-step-desc">' + escH(step.desc) + '</div>' +
        '</div>';
      stepsDiv.appendChild(stepEl);
    });
    card.appendChild(stepsDiv);

    // Actions
    var actions = document.createElement('div');
    actions.className = 'wlh-actions';

    // Listen button
    if (_config.audioText) {
      var listenBtn = document.createElement('button');
      listenBtn.className = 'wlh-listen-btn';
      listenBtn.id = 'wlhListenBtn';
      listenBtn.innerHTML = '🔊 Listen to instructions';
      listenBtn.onclick = function() { toggleAudio(); };
      actions.appendChild(listenBtn);
    }

    // Got it button
    var goBtn = document.createElement('button');
    goBtn.className = 'wlh-go-btn';
    goBtn.textContent = "Got it, let's play!";
    goBtn.onclick = function() { closePopup(); };
    actions.appendChild(goBtn);

    card.appendChild(actions);
    overlay.appendChild(card);

    // Close on backdrop click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePopup();
    });

    return overlay;
  }

  // ── Show / close popup ─────────────────────────────────────
  function showPopup() {
    if (_popupEl) _popupEl.remove();
    _popupEl = buildPopup();
    document.body.appendChild(_popupEl);
    // Trap Escape key
    document.addEventListener('keydown', _escHandler);
  }

  function closePopup() {
    stopAudio();
    if (_popupEl) { _popupEl.remove(); _popupEl = null; }
    document.removeEventListener('keydown', _escHandler);
    // Mark as seen
    if (_config && _config.game) {
      try { localStorage.setItem('wl_help_seen_' + _config.game, '1'); } catch(e) {}
    }
  }

  function _escHandler(e) {
    if (e.key === 'Escape') closePopup();
  }

  // ── Audio ──────────────────────────────────────────────────
  function toggleAudio() {
    var btn = document.getElementById('wlhListenBtn');
    if (_speaking) {
      stopAudio();
      if (btn) { btn.innerHTML = '🔊 Listen to instructions'; btn.classList.remove('speaking'); }
    } else {
      if (typeof WordLabData !== 'undefined' && WordLabData.speakInLanguage && _config.audioText) {
        WordLabData.speakInLanguage(_config.audioText, 'en-AU');
        _speaking = true;
        if (btn) { btn.innerHTML = '⏹ Stop'; btn.classList.add('speaking'); }
        // Auto-reset after estimated duration (rough: 10 chars/sec)
        var dur = Math.max((_config.audioText.length / 10) * 1000, 5000);
        setTimeout(function() {
          _speaking = false;
          if (btn) { btn.innerHTML = '🔊 Listen to instructions'; btn.classList.remove('speaking'); }
        }, dur);
      }
    }
  }

  function stopAudio() {
    _speaking = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  // ── Floating help button ───────────────────────────────────
  function createFloatBtn() {
    if (_helpBtnEl) return;
    var btn = document.createElement('button');
    btn.className = 'wlh-float';
    btn.id = 'wlhFloatBtn';
    btn.textContent = '?';
    btn.title = 'How to play';
    btn.setAttribute('aria-label', 'How to play — open instructions');
    btn.onclick = function() { showPopup(); };
    document.body.appendChild(btn);
    _helpBtnEl = btn;
  }

  // ── Helpers ────────────────────────────────────────────────
  function escH(t) {
    var d = document.createElement('div');
    d.textContent = t || '';
    return d.innerHTML;
  }

  // ── Public API ─────────────────────────────────────────────
  function init(config) {
    _config = config || {};
    injectCSS();
    createFloatBtn();

    // Show popup on first visit
    var key = 'wl_help_seen_' + (_config.game || 'unknown');
    var seen = false;
    try { seen = !!localStorage.getItem(key); } catch(e) {}
    if (!seen) {
      // Small delay so the page renders first
      setTimeout(showPopup, 400);
    }
  }

  return {
    init: init,
    show: showPopup,
    close: closePopup
  };

})();
