/* ──────────────────────────────────────────────────────────────
   wordlab-teacher.js  —  Teacher Mode for game pages
   Loaded AFTER wordlab-data.js on every game page.
   When a teacher is in preview mode, this module:
     - Hides gamified UI (score, streak, fuel, timer)
     - Shows a word-count picker before the game starts
     - Disables auto-advance (teacher clicks Next)
     - Skips recordAttempt (no XP/quarks)
     - Shows rich feedback explaining why answers are right/wrong
     - Tracks word count and shows a non-gamified end screen
   ────────────────────────────────────────────────────────────── */
var WLTeacher = (function() {
  'use strict';

  var _active = (typeof WordLabData !== 'undefined' && WordLabData.isTeacherPreview());
  var _wordLimit = Infinity;
  var _wordsDone = 0;
  var _wordsCorrect = 0;
  var _gameName = '';
  var _onReady = null; // resolve for init promise
  var _feedbackPanel = null;
  var _progressEl = null;

  // ── CSS injection ──────────────────────────────────────────
  function injectCSS() {
    var style = document.createElement('style');
    style.textContent = [
      // Hide gamified elements
      'body.teacher-mode #fuelBar, body.teacher-mode #fuelLabel,',
      'body.teacher-mode .fuel-pill, body.teacher-mode .fuel-bar-track,',
      'body.teacher-mode .fuel-row, body.teacher-mode .fuel-track,',
      'body.teacher-mode .bar, body.teacher-mode .barFill,',
      'body.teacher-mode [id="fuelBar"], body.teacher-mode [id="fuelLabel"],',
      'body.teacher-mode .pill.score, body.teacher-mode .pill.streak,',
      'body.teacher-mode .hud-pill.score, body.teacher-mode .hud-pill.streak,',
      'body.teacher-mode #scoreDisplay, body.teacher-mode #streakDisplay,',
      'body.teacher-mode #scorePill, body.teacher-mode #streakPill,',
      'body.teacher-mode .bonus-pill, body.teacher-mode .countdown-display,',
      'body.teacher-mode .countdown-time, body.teacher-mode #timerPill,',
      'body.teacher-mode .fuel-bar-fill {',
      '  display: none !important;',
      '}',
      // Hide the fuel wrapper divs (parents that contain the bar labels)',
      'body.teacher-mode .hud > div:has(#fuelBar),',
      'body.teacher-mode .hud > div:has(#fuelLabel) {',
      '  display: none !important;',
      '}',
      // Teacher progress pill
      '.wlt-progress {',
      '  display: inline-flex; align-items: center; gap: 6px;',
      '  background: rgba(99,102,241,.15); color: #a5b4fc;',
      '  font-size: 12px; font-weight: 800; padding: 4px 12px;',
      '  border-radius: 999px; letter-spacing: .03em;',
      '}',
      // Word count picker overlay
      '.wlt-overlay {',
      '  position: fixed; inset: 0; z-index: 9999;',
      '  background: rgba(15,23,42,.85); backdrop-filter: blur(8px);',
      '  display: flex; align-items: center; justify-content: center;',
      '}',
      '.wlt-picker {',
      '  background: #1e293b; border-radius: 20px; padding: 32px 36px;',
      '  max-width: 420px; width: 90%; text-align: center;',
      '  box-shadow: 0 20px 60px rgba(0,0,0,.5);',
      '  border: 1px solid rgba(255,255,255,.08);',
      '}',
      '.wlt-picker h2 {',
      '  color: #e0e7ff; font-size: 20px; font-weight: 900; margin: 0 0 6px;',
      '}',
      '.wlt-picker p {',
      '  color: #94a3b8; font-size: 13px; margin: 0 0 20px; font-weight: 600;',
      '}',
      '.wlt-picker-grid {',
      '  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;',
      '}',
      '.wlt-pick-btn {',
      '  background: #334155; color: #e0e7ff; border: 2px solid transparent;',
      '  border-radius: 12px; padding: 14px 8px; font-size: 16px;',
      '  font-weight: 900; cursor: pointer; transition: all .15s;',
      '  font-family: inherit;',
      '}',
      '.wlt-pick-btn:hover {',
      '  background: #4338ca; border-color: #6366f1;',
      '  transform: translateY(-2px); box-shadow: 0 4px 16px rgba(67,56,202,.4);',
      '}',
      // Feedback panel
      '.wlt-feedback {',
      '  background: rgba(30,41,59,.95); border: 1px solid rgba(255,255,255,.1);',
      '  border-radius: 14px; padding: 16px 20px; margin-top: 14px;',
      '  text-align: left; display: none;',
      '}',
      '.wlt-feedback.show { display: block; }',
      '.wlt-feedback-title {',
      '  font-size: 14px; font-weight: 900; margin-bottom: 6px;',
      '}',
      '.wlt-feedback-title.correct { color: #4ade80; }',
      '.wlt-feedback-title.wrong { color: #f87171; }',
      '.wlt-feedback-body {',
      '  font-size: 13px; font-weight: 600; color: #cbd5e1; line-height: 1.5;',
      '}',
      '.wlt-feedback-body b { color: #e0e7ff; }',
      // Next button override — make it more prominent for teachers
      'body.teacher-mode #nextRow, body.teacher-mode #nextWordBtn,',
      'body.teacher-mode .next-row, body.teacher-mode .nextBtn {',
      '  display: flex !important; opacity: 1 !important;',
      '}',
      // End screen
      '.wlt-end-overlay {',
      '  position: fixed; inset: 0; z-index: 9998;',
      '  background: rgba(15,23,42,.9); backdrop-filter: blur(8px);',
      '  display: flex; align-items: center; justify-content: center;',
      '}',
      '.wlt-end-card {',
      '  background: #1e293b; border-radius: 20px; padding: 36px 40px;',
      '  max-width: 440px; width: 90%; text-align: center;',
      '  box-shadow: 0 20px 60px rgba(0,0,0,.5);',
      '  border: 1px solid rgba(255,255,255,.08);',
      '}',
      '.wlt-end-card h2 { color: #e0e7ff; font-size: 22px; font-weight: 900; margin: 0 0 8px; }',
      '.wlt-end-card .wlt-end-stat {',
      '  font-size: 48px; font-weight: 900; color: #6366f1; margin: 12px 0;',
      '}',
      '.wlt-end-card .wlt-end-sub {',
      '  font-size: 14px; font-weight: 700; color: #94a3b8; margin-bottom: 20px;',
      '}',
      '.wlt-end-btn {',
      '  background: #4338ca; color: #fff; border: none; border-radius: 12px;',
      '  padding: 12px 28px; font-size: 15px; font-weight: 800;',
      '  cursor: pointer; font-family: inherit; transition: all .15s;',
      '}',
      '.wlt-end-btn:hover { background: #4f46e5; transform: translateY(-2px); }',
      // Phoneme/syllable green overlay labels
      '.wlt-correct-label {',
      '  position: absolute; top: -20px; left: 50%; transform: translateX(-50%);',
      '  background: #16a34a; color: #fff; font-size: 10px; font-weight: 800;',
      '  padding: 1px 6px; border-radius: 6px; white-space: nowrap;',
      '  pointer-events: none; z-index: 10;',
      '}',
      '.wlt-correct-bracket {',
      '  position: absolute; top: -6px; left: 50%; transform: translateX(-50%);',
      '  width: 0; height: 0; border-left: 5px solid transparent;',
      '  border-right: 5px solid transparent; border-top: 5px solid #16a34a;',
      '  pointer-events: none; z-index: 10;',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Word count picker ──────────────────────────────────────
  function showPicker() {
    return new Promise(function(resolve) {
      var overlay = document.createElement('div');
      overlay.className = 'wlt-overlay';
      var picker = document.createElement('div');
      picker.className = 'wlt-picker';
      picker.innerHTML = '<h2>Teacher Mode</h2>' +
        '<p>How many questions would you like to go through?</p>' +
        '<div class="wlt-picker-grid"></div>';
      var grid = picker.querySelector('.wlt-picker-grid');
      [5, 10, 15, 20, 30, 'All'].forEach(function(n) {
        var btn = document.createElement('button');
        btn.className = 'wlt-pick-btn';
        btn.textContent = n === 'All' ? 'All' : n;
        btn.onclick = function() {
          overlay.remove();
          resolve(n === 'All' ? Infinity : n);
        };
        grid.appendChild(btn);
      });
      overlay.appendChild(picker);
      document.body.appendChild(overlay);
    });
  }

  // ── Progress pill ──────────────────────────────────────────
  function createProgressPill() {
    var pill = document.createElement('span');
    pill.className = 'wlt-progress';
    pill.id = 'wltProgress';
    updateProgressPill(pill);
    // Try to insert into HUD
    var hud = document.querySelector('.hud, .hud-bar, [role="navigation"]');
    if (hud) {
      hud.insertBefore(pill, hud.firstChild);
    }
    _progressEl = pill;
    return pill;
  }

  function updateProgressPill(el) {
    el = el || _progressEl;
    if (!el) return;
    if (_wordLimit === Infinity) {
      el.textContent = 'Q ' + (_wordsDone + 1);
    } else {
      el.textContent = (_wordsDone + 1) + ' / ' + _wordLimit;
    }
  }

  // ── Feedback panel ─────────────────────────────────────────
  function createFeedbackPanel() {
    var panel = document.createElement('div');
    panel.className = 'wlt-feedback';
    panel.id = 'wltFeedback';
    // Try to insert after the game card / feedback area
    var anchor = document.getElementById('feedbackBanner') ||
                 document.getElementById('feedback') ||
                 document.querySelector('.game-card') ||
                 document.querySelector('.card');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(panel, anchor.nextSibling);
    } else {
      // Fallback: append to main content area
      var main = document.querySelector('[role="main"]') || document.body;
      main.appendChild(panel);
    }
    _feedbackPanel = panel;
    return panel;
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * init({ game: 'breakdown' })
   * Returns a Promise that resolves with the word count.
   */
  function init(opts) {
    if (!_active) return Promise.resolve(Infinity);
    opts = opts || {};
    _gameName = opts.game || '';
    _wordsDone = 0;
    _wordsCorrect = 0;

    document.body.classList.add('teacher-mode');
    injectCSS();

    // Skip word count picker if requested (e.g. speed-mode uses End Round button instead)
    if (opts.skipPicker) {
      _wordLimit = Infinity;
      createFeedbackPanel();
      return Promise.resolve(Infinity);
    }

    return showPicker().then(function(count) {
      _wordLimit = count;
      createProgressPill();
      createFeedbackPanel();
      return count;
    });
  }

  /**
   * Call after each answer is checked.
   * correct: boolean
   * feedbackHTML: string of explanation HTML
   */
  function onAnswer(correct, feedbackHTML) {
    if (!_active) return;
    _wordsDone++;
    if (correct) _wordsCorrect++;
    updateProgressPill();

    if (_feedbackPanel && feedbackHTML) {
      _feedbackPanel.innerHTML =
        '<div class="wlt-feedback-title ' + (correct ? 'correct' : 'wrong') + '">' +
        (correct ? 'Why this is correct' : 'Why this is incorrect') +
        '</div>' +
        '<div class="wlt-feedback-body">' + feedbackHTML + '</div>';
      _feedbackPanel.classList.add('show');
    }
  }

  /** Hide feedback panel (call on loadQuestion / next word) */
  function clearFeedback() {
    if (_feedbackPanel) {
      _feedbackPanel.classList.remove('show');
      _feedbackPanel.innerHTML = '';
    }
  }

  /** Returns true if word limit has been reached */
  function shouldEnd() {
    return _active && _wordsDone >= _wordLimit;
  }

  /** Show non-gamified end screen */
  function showEndScreen(stats) {
    if (!_active) return;
    stats = stats || {};
    var correct = stats.correct != null ? stats.correct : _wordsCorrect;
    var total = stats.total != null ? stats.total : _wordsDone;
    var pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    var overlay = document.createElement('div');
    overlay.className = 'wlt-end-overlay';
    overlay.innerHTML =
      '<div class="wlt-end-card">' +
        '<h2>Session Complete</h2>' +
        '<div class="wlt-end-stat">' + correct + ' / ' + total + '</div>' +
        '<div class="wlt-end-sub">' + pct + '% accuracy</div>' +
        '<button class="wlt-end-btn" id="wltEndHome">Back to Home</button>' +
        '&nbsp;&nbsp;' +
        '<button class="wlt-end-btn" id="wltEndAgain" style="background:#334155;">Play Again</button>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById('wltEndHome').onclick = function() {
      window.location.href = 'landing.html';
    };
    document.getElementById('wltEndAgain').onclick = function() {
      window.location.reload();
    };
  }

  // ── Expose ─────────────────────────────────────────────────
  return {
    get active() { return _active; },
    init: init,
    onAnswer: onAnswer,
    clearFeedback: clearFeedback,
    shouldEnd: shouldEnd,
    showEndScreen: showEndScreen,
    get wordsDone() { return _wordsDone; },
    get wordsCorrect() { return _wordsCorrect; }
  };

})();
