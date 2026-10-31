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
      // The card is a column: the steps scroll inside .wlh-body and the
      // buttons stay pinned at the bottom, so "Got it" is always on screen
      // (on a 1366x768 Chromebook it used to sit below the fold on 12 of 14 games).
      '.wlh-card {',
      '  background:#1e293b; border-radius:24px;',
      '  max-width:520px; width:100%; max-height:90vh; max-height:90dvh;',
      '  display:flex; flex-direction:column; overflow:hidden;',
      '  box-shadow:0 24px 64px rgba(0,0,0,.5);',
      '  border:1px solid rgba(99,102,241,.15);',
      '  animation:wlhPop .3s ease-out;',
      '}',
      '.wlh-body { flex:1 1 auto; min-height:0; overflow-y:auto; padding:32px 28px 16px; }',
      '.wlh-card .wlh-actions { flex:0 0 auto; padding:14px 28px 22px; border-top:1px solid rgba(99,102,241,.12); }',
      '.wlh-card.wlh-more .wlh-actions { box-shadow:0 -14px 18px -10px rgba(0,0,0,.6); }',
      '.wlh-more-cue { display:none; font-size:13px; font-weight:700; color:#a5b4fc; }',
      '.wlh-card.wlh-more .wlh-more-cue { display:block; }',
      '.wlh-overlay:focus, .wlh-card:focus { outline:none; }',
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
      '.wlh-steps { display:flex; flex-direction:column; gap:10px; list-style:none; padding:0; margin:0 0 20px; }',
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
      '  font-size:15px; font-weight:800; color:#e0e7ff; margin-bottom:2px;',
      '}',
      '.wlh-step-desc {',
      '  font-size:13.5px; font-weight:600; color:#cbd5e1; line-height:1.45;',
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
      // Short, wide screens (Chromebooks, landscape tablets): a wider card
      // with the steps in two columns, so every step and the buttons fit
      // without scrolling.
      '@media (min-width:900px) and (max-height:860px) {',
      '  .wlh-card { max-width:860px; }',
      '  .wlh-body { padding:22px 28px 12px; }',
      '  .wlh-emoji { font-size:36px; margin-bottom:2px; }',
      '  .wlh-sub { margin-bottom:14px; }',
      '  .wlh-steps { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:6px; }',
      '  .wlh-card .wlh-actions { flex-direction:row; justify-content:center; flex-wrap:wrap; padding:12px 28px 16px; }',
      '  .wlh-card .wlh-actions .wlh-more-cue { flex-basis:100%; text-align:center; }',
      '}',
      '@media (max-height:600px) {',
      '  .wlh-emoji { display:none; }',
      '}',
      '@media (prefers-reduced-motion: reduce) {',
      '  .wlh-overlay, .wlh-card { animation:none; }',
      '  .wlh-go-btn, .wlh-float, .wlh-listen-btn { transition:none; }',
      '  .wlh-go-btn:hover, .wlh-float:hover { transform:none; }',
      '}',
      '.low-stim .wlh-go-btn:hover, .low-stim .wlh-float:hover { transform:none; }',
      '@media(max-width:480px) {',
      '  .wlh-body { padding:24px 18px 12px; }',
      '  .wlh-card .wlh-actions { padding:12px 18px 18px; }',
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
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', 'wlhTitle');
    card.setAttribute('aria-describedby', 'wlhSub');

    // Emoji + title (inside the scrolling body)
    var body = document.createElement('div');
    body.className = 'wlh-body';
    body.innerHTML =
      '<div class="wlh-emoji" aria-hidden="true">' + (_config.emoji || '🎮') + '</div>' +
      '<div class="wlh-title" id="wlhTitle">How to Play</div>' +
      '<div class="wlh-sub" id="wlhSub">' + escH(_config.title || 'Game') + '</div>';

    // Steps
    // Numbered steps in an ordered list, so the order is clear to everyone
    var stepsDiv = document.createElement('ol');
    stepsDiv.className = 'wlh-steps';
    (_config.steps || []).forEach(function(step, i) {
      var stepEl = document.createElement('li');
      stepEl.className = 'wlh-step';
      stepEl.innerHTML =
        '<div class="wlh-step-icon" aria-hidden="true">' + (step.icon || (i + 1)) + '</div>' +
        '<div class="wlh-step-text">' +
          '<div class="wlh-step-title">' + (i + 1) + '. ' + escH(step.title) + '</div>' +
          '<div class="wlh-step-desc">' + escH(step.desc) + '</div>' +
        '</div>';
      stepsDiv.appendChild(stepEl);
    });
    body.appendChild(stepsDiv);
    card.appendChild(body);

    // Actions
    var actions = document.createElement('div');
    actions.className = 'wlh-actions';

    // Shown only while some steps are still out of sight
    var cue = document.createElement('div');
    cue.className = 'wlh-more-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.textContent = '⬇ Scroll down to read every step';
    actions.appendChild(cue);

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
    goBtn.id = 'wlhGoBtn';
    goBtn.textContent = "Got it, let's play!";
    goBtn.onclick = function() { closePopup(); };
    actions.appendChild(goBtn);

    card.appendChild(actions);
    overlay.appendChild(card);

    // Close on backdrop click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePopup();
    });

    // Keys pressed in the popup stay in the popup: Enter on "Got it" must
    // not also reach the game's own key handlers behind it.
    overlay.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { e.preventDefault(); closePopup(); }
      else if (e.key === 'Tab') {
        // Wrap Tab and Shift+Tab around the popup's buttons
        var f = overlay.querySelectorAll('button');
        if (f.length) {
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && (document.activeElement === first || !overlay.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      e.stopPropagation();
    });

    body.addEventListener('scroll', function() { _updateMoreCue(card, body); });

    return overlay;
  }

  // ── Show / close popup ─────────────────────────────────────
  var _inerted = [];
  var _returnFocus = null;

  function _updateMoreCue(card, body) {
    var more = body.scrollTop + body.clientHeight < body.scrollHeight - 4;
    card.classList.toggle('wlh-more', more);
  }

  function showPopup() {
    if (_popupEl) _closeElement();
    else _returnFocus = document.activeElement;
    _popupEl = buildPopup();
    document.body.appendChild(_popupEl);
    // The game behind the popup cannot be clicked, tabbed to or typed into
    // until the popup closes (Tab stays inside the popup).
    Array.prototype.forEach.call(document.body.children, function(el) {
      if (el !== _popupEl && !el.inert && el.tagName !== 'SCRIPT') {
        el.inert = true;
        _inerted.push(el);
      }
    });
    // Escape still works if focus somehow ends up outside the popup
    document.addEventListener('keydown', _escHandler);
    var card = _popupEl.querySelector('.wlh-card');
    var body = _popupEl.querySelector('.wlh-body');
    _updateMoreCue(card, body);
    // Start keyboard and screen reader users on "Got it": Enter closes, Tab
    // reaches the steps' Listen button.
    var go = document.getElementById('wlhGoBtn');
    if (go) { try { go.focus({ preventScroll: true }); } catch (e) { go.focus(); } }
  }

  function _closeElement() {
    if (_popupEl) { _popupEl.remove(); _popupEl = null; }
    _inerted.forEach(function(el) { el.inert = false; });
    _inerted = [];
  }

  function closePopup() {
    stopAudio();
    var hadPopup = !!_popupEl;
    _closeElement();
    document.removeEventListener('keydown', _escHandler);
    // Put focus back where it was (the ? button, or the game's answer box)
    if (hadPopup) {
      var back = _returnFocus;
      _returnFocus = null;
      if (back && back !== document.body && document.contains(back) && typeof back.focus === 'function') {
        try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); }
      }
    }
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
      // Wait for DOM to be fully ready, then show after a short render delay
      function _schedulePopup() { setTimeout(showPopup, 600); }
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        _schedulePopup();
      } else {
        document.addEventListener('DOMContentLoaded', _schedulePopup);
      }
    }
  }

  return {
    init: init,
    // true while the instructions popup is on screen, so games can hold their timers
    isOpen: function() { return !!_popupEl; },
    show: showPopup,
    close: closePopup
  };

})();
