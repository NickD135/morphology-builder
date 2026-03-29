/* ──────────────────────────────────────────────────────────────
   wordlab-hints.js  —  "Need Advice" scientist hint system
   Loaded AFTER wordlab-data.js and wordlab-scientist.js.
   Provides a "Need Advice" button below the scientist that gives
   progressive hints: first click = strategy, second = specific clue.
   Also provides a student support-mode toggle on game pages.
   ────────────────────────────────────────────────────────────── */
var WLHints = (function() {
  'use strict';

  var _config = null;
  var _hintCount = 0;  // resets per question
  var _bubbleEl = null;
  var _adviceBtnEl = null;
  var _supportToggleEl = null;
  var _bubbleTimer = null;

  // ── CSS ────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('wlHintsCSS')) return;
    var s = document.createElement('style');
    s.id = 'wlHintsCSS';
    s.textContent = [
      // Speech bubble
      '.wlh-bubble {',
      '  position:absolute; bottom:100%; left:50%; transform:translateX(-50%);',
      '  background:#1e293b; color:#e0e7ff; border:1.5px solid rgba(99,102,241,.3);',
      '  border-radius:14px; padding:10px 14px; max-width:220px; min-width:160px;',
      '  font-size:12px; font-weight:600; line-height:1.4; text-align:center;',
      '  box-shadow:0 8px 24px rgba(0,0,0,.4); z-index:100;',
      '  opacity:0; transform:translateX(-50%) translateY(8px); transition:all .25s ease-out;',
      '  pointer-events:auto;',
      '}',
      '.wlh-bubble.show {',
      '  opacity:1; transform:translateX(-50%) translateY(-8px);',
      '}',
      '.wlh-bubble::after {',
      '  content:""; position:absolute; top:100%; left:50%; transform:translateX(-50%);',
      '  border:8px solid transparent; border-top-color:#1e293b;',
      '}',
      '.wlh-bubble-speak {',
      '  background:none; border:none; color:#a5b4fc; font-size:14px;',
      '  cursor:pointer; padding:2px 4px; margin-left:4px; vertical-align:middle;',
      '}',
      '.wlh-bubble-speak:hover { color:#c7d2fe; }',
      // Need Advice button
      '.wlh-advice-btn {',
      '  display:block; margin:12px auto 0; padding:8px 18px;',
      '  background:rgba(99,102,241,.2); color:#c7d2fe;',
      '  border:2px solid rgba(99,102,241,.35); border-radius:12px;',
      '  font-family:inherit; font-size:12px; font-weight:800;',
      '  cursor:pointer; transition:all .15s;',
      '  box-shadow:0 2px 8px rgba(67,56,202,.2);',
      '}',
      '.wlh-advice-btn:hover { background:rgba(99,102,241,.3); color:#e0e7ff; border-color:#6366f1; transform:translateY(-1px); box-shadow:0 4px 12px rgba(67,56,202,.3); }',
      // Support mode toggle
      '.wlh-support-toggle {',
      '  position:fixed; bottom:20px; right:70px; z-index:9979;',
      '  display:flex; align-items:center; gap:6px;',
      '  background:rgba(30,41,59,.9); border:1.5px solid rgba(99,102,241,.2);',
      '  border-radius:12px; padding:5px 12px; cursor:pointer;',
      '  font-family:inherit; font-size:11px; font-weight:800; color:#94a3b8;',
      '  transition:all .15s; backdrop-filter:blur(8px);',
      '}',
      '.wlh-support-toggle:hover { border-color:#6366f1; color:#c7d2fe; }',
      '.wlh-support-toggle.active { border-color:#4338ca; color:#a5b4fc; background:rgba(67,56,202,.15); }',
      '.wlh-support-dot {',
      '  width:8px; height:8px; border-radius:50%; background:#475569; transition:background .15s;',
      '}',
      '.wlh-support-toggle.active .wlh-support-dot { background:#6366f1; }',
      // Visual scaffold styles
      'body.support-mode .wlh-scaffold-prefix { border-left:3px solid #7c3aed !important; }',
      'body.support-mode .wlh-scaffold-base { border-left:3px solid #4338ca !important; }',
      'body.support-mode .wlh-scaffold-suffix { border-left:3px solid #ea580c !important; }',
      // Hide advice button when not in support mode (but show for everyone on first few visits)
      '@media(max-width:480px) {',
      '  .wlh-support-toggle { right:60px; font-size:10px; padding:4px 10px; }',
      '}',
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── Need Advice button ─────────────────────────────────────
  function createAdviceBtn() {
    // Remove stale elements if they exist (scientist rebuild destroys them)
    var oldBubble = document.getElementById('wlhBubble');
    if (oldBubble) oldBubble.remove();
    var oldBtn = document.getElementById('wlhAdviceBtn');
    if (oldBtn) oldBtn.remove();

    // Prefer scientist-stage, but fall back to a fixed-position floating button
    // when scientist is hidden (e.g. mobile) or missing
    var stage = document.querySelector('.scientist-stage');
    var useFloat = !stage || getComputedStyle(stage).display === 'none';

    var parent = useFloat ? document.body : stage;

    // Create bubble (hidden initially)
    _bubbleEl = document.createElement('div');
    _bubbleEl.className = 'wlh-bubble';
    _bubbleEl.id = 'wlhBubble';
    if (useFloat) {
      _bubbleEl.style.cssText = 'position:fixed;bottom:62px;right:16px;left:auto;transform:none;z-index:10001;max-width:240px;';
    }
    parent.appendChild(_bubbleEl);

    // Create button
    _adviceBtnEl = document.createElement('button');
    _adviceBtnEl.className = 'wlh-advice-btn';
    _adviceBtnEl.id = 'wlhAdviceBtn';
    _adviceBtnEl.textContent = '💡 Need Advice';
    _adviceBtnEl.setAttribute('aria-label', 'Get a hint from the scientist');
    _adviceBtnEl.onclick = function() { giveHint(); };
    if (useFloat) {
      _adviceBtnEl.style.cssText += 'position:fixed;bottom:16px;right:16px;z-index:10000;margin:0;box-shadow:0 4px 16px rgba(67,56,202,.4);';
    }
    parent.appendChild(_adviceBtnEl);
  }

  // Re-attach if DOM elements were destroyed (e.g. by scientist SVG rebuild)
  function ensureAdviceBtn() {
    if (!document.getElementById('wlhAdviceBtn')) {
      createAdviceBtn();
    }
  }

  // ── Support mode toggle ────────────────────────────────────
  function createSupportToggle() {
    if (_supportToggleEl) return;
    var isOn = typeof WordLabData !== 'undefined' && WordLabData.isSupportMode();
    // Check if teacher locked it on (stored in sessionStorage by loadSupportMode)
    var teacherSet = false;
    try { teacherSet = sessionStorage.getItem('wl_support_teacher') === 'true'; } catch(e) {}

    var btn = document.createElement('button');
    btn.className = 'wlh-support-toggle';
    btn.id = 'wlhSupportToggle';
    if (isOn) btn.classList.add('active');

    if (teacherSet) {
      // Teacher enabled — show as locked on, student can't disable
      btn.innerHTML = '<span class="wlh-support-dot"></span> Support (set by teacher)';
      btn.title = 'Support mode is enabled by your teacher';
      btn.style.cursor = 'default';
      btn.style.opacity = '0.7';
    } else {
      btn.innerHTML = '<span class="wlh-support-dot"></span> Support';
      btn.title = 'Toggle support mode — slower timers, hints, fewer options';
      btn.setAttribute('aria-label', 'Toggle support mode');
      btn.onclick = function() {
        var nowOn = !(typeof WordLabData !== 'undefined' && WordLabData.isSupportMode());
        if (typeof WordLabData !== 'undefined' && WordLabData.setSupportMode) {
          WordLabData.setSupportMode(nowOn);
        }
        btn.classList.toggle('active', nowOn);
        window.location.reload();
      };
    }
    document.body.appendChild(btn);
    _supportToggleEl = btn;
  }

  // ── Hint logic ─────────────────────────────────────────────
  function giveHint() {
    if (!_config) return;
    _hintCount++;

    var text = '';
    if (_hintCount === 1 && _config.getStrategyHint) {
      text = _config.getStrategyHint();
    } else if (_config.getSpecificHint) {
      text = _config.getSpecificHint();
    } else if (_config.getStrategyHint) {
      text = _config.getStrategyHint();
    }

    if (!text) text = 'Try your best — you can do this!';
    showBubble(text);
  }

  function showBubble(text) {
    if (!_bubbleEl) return;
    clearTimeout(_bubbleTimer);

    var speakBtn = '<button class="wlh-bubble-speak" onclick="WLHints.speakHint()" title="Listen">🔊</button>';
    _bubbleEl.innerHTML = text + speakBtn;
    _bubbleEl.classList.add('show');

    // Auto-hide after 6 seconds
    _bubbleTimer = setTimeout(function() {
      _bubbleEl.classList.remove('show');
    }, 6000);
  }

  function hideBubble() {
    if (_bubbleEl) _bubbleEl.classList.remove('show');
    clearTimeout(_bubbleTimer);
  }

  function speakHint() {
    if (!_bubbleEl) return;
    var text = _bubbleEl.textContent.replace('🔊', '').trim();
    if (typeof WordLabData !== 'undefined' && WordLabData.speakInLanguage) {
      WordLabData.speakInLanguage(text, 'en-AU');
    }
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * register({ getStrategyHint, getSpecificHint })
   * Called by each game to provide hint functions for the current question.
   * getStrategyHint() → general tip string
   * getSpecificHint() → clue about the current answer
   */
  function register(config) {
    _config = config || {};
    _hintCount = 0;
    injectCSS();

    // Create UI elements (delay to ensure scientist is rendered)
    setTimeout(function() {
      createAdviceBtn();
    }, 600);
    if (!_supportToggleEl) {
      createSupportToggle();
    }
  }

  /** Call this when a new question loads to reset hint counter */
  function resetHints() {
    _hintCount = 0;
    hideBubble();
    ensureAdviceBtn();
  }

  /** Update hint functions (call when question changes) */
  function updateHints(strategyFn, specificFn) {
    if (_config) {
      _config.getStrategyHint = strategyFn;
      _config.getSpecificHint = specificFn;
    }
    _hintCount = 0;
    hideBubble();
  }

  return {
    register: register,
    resetHints: resetHints,
    updateHints: updateHints,
    speakHint: speakHint,
    showBubble: showBubble,
    hideBubble: hideBubble
  };

})();
