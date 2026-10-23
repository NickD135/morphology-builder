/**
 * wordlab-tour.js — Guided spotlight walkthrough system
 *
 * Usage:
 *   WLTour.start(steps)           — begin a tour
 *   WLTour.autoStart(page, steps) — start on first visit only
 *
 * Step schema:
 *   { target: '#selector', title: 'Title', text: 'Body', position: 'bottom', lowStimHide: false }
 *   target = null for centred "info" cards (no spotlight)
 */
var WLTour = (function () {
  'use strict';

  var _steps = [];
  var _current = 0;
  var _overlay = null;
  var _spotlight = null;
  var _tooltip = null;
  var _active = false;
  var _cssInjected = false;

  // ── CSS ──────────────────────────────────────────────────────
  function injectCSS() {
    if (_cssInjected) return;
    _cssInjected = true;
    var style = document.createElement('style');
    style.textContent = [
      '.wlt-overlay{position:fixed;top:0;left:0;width:100%;height:100%;z-index:99990;pointer-events:auto;}',
      '.wlt-spotlight{position:fixed;z-index:99991;border-radius:8px;box-shadow:0 0 0 9999px rgba(15,23,42,0.82),0 0 24px 4px rgba(99,102,241,0.35);pointer-events:none;transition:top .35s ease,left .35s ease,width .35s ease,height .35s ease;}',
      '.wlt-tooltip{position:fixed;z-index:99992;background:#1e293b;border:1px solid #334155;border-radius:14px;max-width:380px;width:calc(100vw - 32px);padding:22px 24px 18px;box-shadow:0 20px 40px rgba(0,0,0,0.45);transition:opacity .25s ease,transform .25s ease;opacity:0;transform:translateY(8px);font-family:Lexend,system-ui,sans-serif;}',
      '.wlt-tooltip.visible{opacity:1;transform:translateY(0);}',
      '.wlt-tooltip.centred{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.95);max-width:420px;}',
      '.wlt-tooltip.centred.visible{transform:translate(-50%,-50%) scale(1);}',
      '.wlt-title{font-size:17px;font-weight:800;color:#e2e8f0;margin:0 0 8px;line-height:1.3;}',
      '.wlt-text{font-size:14px;color:#94a3b8;line-height:1.6;margin:0 0 16px;}',
      '.wlt-text strong{color:#c7d2fe;font-weight:700;}',
      '.wlt-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;}',
      '.wlt-counter{font-size:11px;font-weight:700;background:#6366f1;color:#fff;padding:3px 10px;border-radius:99px;white-space:nowrap;letter-spacing:.02em;}',
      '.wlt-btns{display:flex;gap:8px;align-items:center;}',
      '.wlt-btn{padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:background .15s,transform .1s;font-family:Lexend,system-ui,sans-serif;}',
      '.wlt-btn:active{transform:scale(0.96);}',
      '.wlt-btn-next{background:#6366f1;color:#fff;}',
      '.wlt-btn-next:hover{background:#818cf8;}',
      '.wlt-btn-back{background:transparent;color:#94a3b8;border:1px solid #475569;}',
      '.wlt-btn-back:hover{background:rgba(99,102,241,0.1);color:#c7d2fe;}',
      '.wlt-skip{background:none;border:none;color:#64748b;font-size:12px;cursor:pointer;padding:4px 0;margin-top:6px;text-align:center;display:block;width:100%;font-family:Lexend,system-ui,sans-serif;}',
      '.wlt-skip:hover{color:#94a3b8;text-decoration:underline;}',
      '.wlt-arrow{position:absolute;width:14px;height:14px;background:#1e293b;border:1px solid #334155;transform:rotate(45deg);z-index:-1;}',
      '.wlt-arrow-top{bottom:-8px;left:calc(50% - 7px);border-top:none;border-left:none;}',
      '.wlt-arrow-bottom{top:-8px;left:calc(50% - 7px);border-bottom:none;border-right:none;}',
      '.wlt-arrow-left{right:-8px;top:calc(50% - 7px);border-top:none;border-right:none;}',
      '.wlt-arrow-right{left:-8px;top:calc(50% - 7px);border-bottom:none;border-left:none;}',
      '@media(max-width:600px){.wlt-tooltip{max-width:calc(100vw - 24px);padding:18px 16px 14px;}.wlt-title{font-size:15px;}.wlt-text{font-size:13px;}.wlt-btn{padding:7px 14px;font-size:12px;}}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── DOM helpers ──────────────────────────────────────────────
  function createEl(tag, cls) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }

  function removeAll() {
    if (_overlay) { _overlay.remove(); _overlay = null; }
    if (_spotlight) { _spotlight.remove(); _spotlight = null; }
    if (_tooltip) { _tooltip.remove(); _tooltip = null; }
    _active = false;
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', reposition);
    window.removeEventListener('scroll', reposition, true);
  }

  // ── Positioning ─────────────────────────────────────────────
  function getRect(selector) {
    if (!selector) return null;
    var el = document.querySelector(selector);
    if (!el) return null;
    return el.getBoundingClientRect();
  }

  function bestPosition(rect) {
    if (!rect) return 'bottom';
    var spaceBelow = window.innerHeight - rect.bottom;
    var spaceAbove = rect.top;
    if (spaceBelow >= 220) return 'bottom';
    if (spaceAbove >= 220) return 'top';
    if (window.innerWidth - rect.right >= 400) return 'right';
    if (rect.left >= 400) return 'left';
    return 'bottom';
  }

  function positionTooltip(rect, pos) {
    if (!_tooltip) return;
    var oldArrow = _tooltip.querySelector('.wlt-arrow');
    if (oldArrow) oldArrow.remove();

    if (!rect) {
      _tooltip.classList.add('centred');
      _tooltip.style.top = '';
      _tooltip.style.left = '';
      return;
    }

    _tooltip.classList.remove('centred');
    var PAD = 14;
    var tRect = _tooltip.getBoundingClientRect();
    var arrow = createEl('div', 'wlt-arrow');
    var top, left;

    if (pos === 'bottom') {
      top = rect.bottom + PAD;
      left = Math.max(16, Math.min(rect.left + rect.width / 2 - tRect.width / 2, window.innerWidth - tRect.width - 16));
      arrow.classList.add('wlt-arrow-bottom');
      arrow.style.left = Math.max(20, Math.min(rect.left + rect.width / 2 - left - 7, tRect.width - 28)) + 'px';
    } else if (pos === 'top') {
      top = rect.top - tRect.height - PAD;
      left = Math.max(16, Math.min(rect.left + rect.width / 2 - tRect.width / 2, window.innerWidth - tRect.width - 16));
      arrow.classList.add('wlt-arrow-top');
      arrow.style.left = Math.max(20, Math.min(rect.left + rect.width / 2 - left - 7, tRect.width - 28)) + 'px';
    } else if (pos === 'right') {
      top = Math.max(16, rect.top + rect.height / 2 - tRect.height / 2);
      left = rect.right + PAD;
      arrow.classList.add('wlt-arrow-right');
    } else {
      top = Math.max(16, rect.top + rect.height / 2 - tRect.height / 2);
      left = rect.left - tRect.width - PAD;
      arrow.classList.add('wlt-arrow-left');
    }

    _tooltip.style.top = Math.max(8, top) + 'px';
    _tooltip.style.left = Math.max(8, left) + 'px';
    _tooltip.appendChild(arrow);
  }

  function positionSpotlight(rect) {
    if (!_spotlight) return;
    if (!rect) { _spotlight.style.display = 'none'; return; }
    var PAD = 8;
    _spotlight.style.display = 'block';
    _spotlight.style.top = (rect.top - PAD) + 'px';
    _spotlight.style.left = (rect.left - PAD) + 'px';
    _spotlight.style.width = (rect.width + PAD * 2) + 'px';
    _spotlight.style.height = (rect.height + PAD * 2) + 'px';
  }

  var _repositionTimer = null;
  function reposition() {
    if (_repositionTimer) return;
    _repositionTimer = setTimeout(function () {
      _repositionTimer = null;
      if (!_active || !_steps[_current]) return;
      var step = _steps[_current];
      var rect = getRect(step.target);
      positionSpotlight(rect);
      positionTooltip(rect, step.position === 'auto' || !step.position ? bestPosition(rect) : step.position);
    }, 50);
  }

  // ── Render step ─────────────────────────────────────────────
  function renderStep() {
    var step = _steps[_current];
    if (!step) { end(); return; }

    // Scroll target into view
    if (step.target) {
      var el = document.querySelector(step.target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(function () {
      var rect = getRect(step.target);
      positionSpotlight(rect);

      _tooltip.classList.remove('visible');
      var pos = step.position === 'auto' || !step.position ? bestPosition(rect) : step.position;

      // Build tooltip
      while (_tooltip.firstChild) _tooltip.removeChild(_tooltip.firstChild);

      var title = createEl('div', 'wlt-title');
      title.textContent = step.title || '';

      var text = createEl('div', 'wlt-text');
      // Step text is hardcoded content from our own tour definitions — safe to render HTML for <strong> tags
      text.innerHTML = step.text || '';

      var footer = createEl('div', 'wlt-footer');
      var counter = createEl('span', 'wlt-counter');
      counter.textContent = (_current + 1) + ' of ' + _steps.length;

      var btns = createEl('div', 'wlt-btns');

      if (_current > 0) {
        var backBtn = createEl('button', 'wlt-btn wlt-btn-back');
        backBtn.textContent = 'Back';
        backBtn.addEventListener('click', prev);
        btns.appendChild(backBtn);
      }

      var isLast = _current === _steps.length - 1;
      var nextBtn = createEl('button', 'wlt-btn wlt-btn-next');
      nextBtn.textContent = isLast ? 'Done' : 'Next';
      nextBtn.addEventListener('click', isLast ? end : next);
      btns.appendChild(nextBtn);

      footer.appendChild(counter);
      footer.appendChild(btns);

      _tooltip.appendChild(title);
      _tooltip.appendChild(text);
      _tooltip.appendChild(footer);

      if (!isLast) {
        var skipBtn = createEl('button', 'wlt-skip');
        skipBtn.textContent = 'Skip tour';
        skipBtn.addEventListener('click', end);
        _tooltip.appendChild(skipBtn);
      }

      positionTooltip(rect, pos);
      requestAnimationFrame(function () { _tooltip.classList.add('visible'); });
    }, step.target ? 400 : 80);
  }

  // ── Navigation ──────────────────────────────────────────────
  function next() { if (_current < _steps.length - 1) { _current++; renderStep(); } }
  function prev() { if (_current > 0) { _current--; renderStep(); } }

  function end() {
    if (_steps._tourPage) {
      try { localStorage.setItem('wl_tour_seen_' + _steps._tourPage, '1'); } catch (e) { }
    }
    removeAll();
  }

  function onKey(e) {
    if (!_active) return;
    if (e.key === 'Escape') end();
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { if (_current < _steps.length - 1) next(); else end(); }
    else if (e.key === 'ArrowLeft') prev();
  }

  // ── Public API ──────────────────────────────────────────────
  function start(steps, page) {
    if (_active) removeAll();
    if (!steps || !steps.length) return;
    injectCSS();

    var isLowStim = document.body.classList.contains('low-stim');
    var filtered = isLowStim ? steps.filter(function (s) { return !s.lowStimHide; }) : steps.slice();
    if (!filtered.length) return;

    _steps = filtered;
    _steps._tourPage = page || null;
    _current = 0;
    _active = true;

    _overlay = createEl('div', 'wlt-overlay');
    _overlay.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); });
    document.body.appendChild(_overlay);

    _spotlight = createEl('div', 'wlt-spotlight');
    document.body.appendChild(_spotlight);

    _tooltip = createEl('div', 'wlt-tooltip');
    document.body.appendChild(_tooltip);

    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    renderStep();
  }

  function autoStart(page, steps) {
    var key = 'wl_tour_seen_' + page;
    try { if (localStorage.getItem(key)) return; } catch (e) { }
    setTimeout(function () { start(steps, page); }, 1500);
  }

  return { start: start, autoStart: autoStart };
})();
