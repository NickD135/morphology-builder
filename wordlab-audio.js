// ═══════════════════════════════════════════════════════════════
// WORD LAB — Shared Audio & Animation Module
// Include this after wordlab-data.js on any game page.
// Exposes: WLAudio.correct(), wrong(), streak(n), tick(), stopTick(),
//          transition(el, cb), initSoundToggle()
// ═══════════════════════════════════════════════════════════════

const WLAudio = (() => {

  const PREF_KEY = 'wordlab_sound_v1';
  let ctx = null;
  let enabled = false;
  let tickInterval = null;
  let tickPlaying = false;

  // ── AudioContext (lazy init on first user gesture) ────────────
  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── Load preference ───────────────────────────────────────────
  function loadPref() {
    try { return localStorage.getItem(PREF_KEY) === 'on'; }
    catch { return false; }
  }
  function savePref(val) {
    try { localStorage.setItem(PREF_KEY, val ? 'on' : 'off'); } catch {}
  }

  enabled = loadPref();

  // ── Core tone generator ───────────────────────────────────────
  function tone(frequency, type, gainVal, duration, startTime, fadeOut) {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(gainVal, startTime);
    if (fadeOut) gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function chord(notes, type, gainVal, duration, delay) {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime + (delay || 0);
    notes.forEach((freq, i) => tone(freq, type, gainVal, duration, now + i * 0.06, true));
  }

  function _lowStim() {
    return typeof WordLabData !== 'undefined' && WordLabData.isLowStimMode();
  }

  // ── Sound effects ─────────────────────────────────────────────
  function correct() {
    if (!enabled || _lowStim()) return;
    const c = getCtx(); if (!c) return;
    const now = c.currentTime;
    // Bright ascending two-tone ding
    tone(523, 'sine', 0.3, 0.12, now, true);       // C5
    tone(784, 'sine', 0.35, 0.18, now + 0.1, true); // G5
  }

  function wrong() {
    if (!enabled || _lowStim()) return;
    const c = getCtx(); if (!c) return;
    const now = c.currentTime;
    // Low descending thud
    tone(220, 'sawtooth', 0.2, 0.15, now, true);
    tone(180, 'sawtooth', 0.15, 0.12, now + 0.08, true);
  }

  function streak(n) {
    if (!enabled || _lowStim()) return;
    const c = getCtx(); if (!c) return;
    const now = c.currentTime;
    if (n >= 10) {
      // Big fanfare
      chord([523, 659, 784], 'sine', 0.28, 0.22, 0);
      chord([659, 784, 1047], 'sine', 0.28, 0.28, 0.18);
      chord([784, 1047, 1319], 'sine', 0.25, 0.4, 0.38);
    } else if (n >= 5) {
      // Medium fanfare
      chord([523, 659, 784], 'sine', 0.25, 0.2, 0);
      chord([659, 784, 1047], 'sine', 0.25, 0.3, 0.2);
    } else if (n >= 3) {
      // Small chime
      chord([523, 659], 'sine', 0.22, 0.18, 0);
      tone(784, 'sine', 0.22, 0.22, now + 0.16, true);
    }
  }

  // ── Ticking (fuel bar tension) ────────────────────────────────
  function tick() {
    if (!enabled || _lowStim() || tickPlaying) return;
    tickPlaying = true;
    _doTick();
    tickInterval = setInterval(_doTick, 600);
  }

  function _doTick() {
    const c = getCtx(); if (!c) return;
    const now = c.currentTime;
    tone(1200, 'square', 0.08, 0.04, now, true);
  }

  function stopTick() {
    tickPlaying = false;
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
  }

  // ── Question transition ───────────────────────────────────────
  // Pass the element to animate and a callback to run at the midpoint
  function transition(el, cb, direction) {
    if (!el) { if (cb) cb(); return; }
    direction = direction || 'left';
    const out = direction === 'left' ? 'translateX(-18px)' : 'translateX(18px)';
    const inAnim = direction === 'left' ? 'translateX(18px)' : 'translateX(-18px)';

    el.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    el.style.opacity = '0';
    el.style.transform = out;

    setTimeout(() => {
      if (cb) cb();
      el.style.transition = 'none';
      el.style.opacity = '0';
      el.style.transform = inAnim;
      // Force reflow
      void el.offsetHeight;
      el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateX(0)';
    }, 190);
  }

  // ── Public setEnabled ─────────────────────────────────────────
  // Called by WordLabData._toggleAudio() when the pill toggle is clicked.
  // Also initialises the AudioContext on first call (requires prior user gesture).
  function setEnabled(val) {
    getCtx();
    enabled = !!val;
    savePref(enabled);
    if (enabled) correct();
    else stopTick();
  }

  return {
    correct, wrong, streak, tick, stopTick,
    transition,
    isEnabled: () => enabled,
    setEnabled
  };

})();
