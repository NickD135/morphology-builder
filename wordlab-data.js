// ═══════════════════════════════════════════════════════════════
// WORD LAB — Shared Data Layer v3
// ═══════════════════════════════════════════════════════════════

const WordLabData = (() => {

  const STORAGE_KEY = 'wordlab_data_v1';
  const SESSION_KEY = 'wordlab_session_v1';

  // ── Storage ──────────────────────────────────────────────────
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { classes:{} }; }
    catch { return { classes:{} }; }
  }
  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }
  function loadSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
  }
  function saveSession(s) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
  }

  // ── Classes ───────────────────────────────────────────────────
  function createClass(name, password, students) {
    const data = load();
    const id = 'class_' + Date.now();
    data.classes[id] = {
      id, name, password, created: Date.now(),
      students: students.map(n => ({
        id: 'student_' + Math.random().toString(36).slice(2),
        name: n.trim(), results: {}
      }))
    };
    save(data);
    return id;
  }
  function getClasses() { return Object.values(load().classes); }
  function getClass(id) { return load().classes[id] || null; }
  function verifyPassword(id, pw) { const c = getClass(id); return c && c.password === pw; }
  function addStudent(classId, name) {
    const data = load();
    if (!data.classes[classId]) return;
    data.classes[classId].students.push({
      id: 'student_' + Math.random().toString(36).slice(2),
      name: name.trim(), results: {}
    });
    save(data);
  }
  function removeStudent(classId, studentId) {
    const data = load();
    if (!data.classes[classId]) return;
    data.classes[classId].students = data.classes[classId].students.filter(s => s.id !== studentId);
    save(data);
  }

  // ── Session ───────────────────────────────────────────────────
  function startSession(classId, studentId, studentName) {
    saveSession({ classId, studentId, studentName, started: Date.now() });
  }
  function getSession() { return loadSession(); }
  function endSession() { try { sessionStorage.removeItem(SESSION_KEY); } catch {} }

  // ── Recording ─────────────────────────────────────────────────
  function recordAttempt(activity, category, correct, timeMs) {
    const session = loadSession();
    if (!session) return;
    const data = load();
    const cls = data.classes[session.classId];
    if (!cls) return;
    const student = cls.students.find(s => s.id === session.studentId);
    if (!student) return;
    if (!student.results[activity]) student.results[activity] = {};
    if (!student.results[activity][category])
      student.results[activity][category] = { correct:0, total:0, totalTime:0, attempts:[] };
    const r = student.results[activity][category];
    r.total++;
    if (correct) r.correct++;
    r.totalTime += (timeMs || 0);
    r.attempts.push({ correct, timeMs: timeMs||0, ts: Date.now() });
    if (r.attempts.length > 50) r.attempts = r.attempts.slice(-50);
    save(data);
  }

  // ── Analytics ─────────────────────────────────────────────────
  function getAccuracy(r) {
    if (!r || r.total === 0) return null;
    return Math.round((r.correct / r.total) * 100);
  }
  function getAvgTime(r) {
    if (!r || r.total === 0) return null;
    return Math.round(r.totalTime / r.total);
  }
  function isIntervention(r, threshold=70, min=3) {
    if (!r || r.total < min) return false;
    return getAccuracy(r) < threshold;
  }

  // ── Export ────────────────────────────────────────────────────
  function exportCSV(classId) {
    const cls = getClass(classId);
    if (!cls) return '';
    const activities = ['sound-sorter','phoneme-splitter','syllable-splitter','meaning-mode','mission-mode'];
    const rows = [['Student','Activity','Category','Correct','Total','Accuracy %','Avg Time (ms)']];
    cls.students.forEach(student => {
      activities.forEach(activity => {
        Object.entries(student.results[activity] || {}).forEach(([cat, r]) => {
          rows.push([student.name, activity, cat, r.correct, r.total,
            getAccuracy(r) ?? '', getAvgTime(r) ?? '']);
        });
      });
    });
    return rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  }

  // ── Login UI ──────────────────────────────────────────────────
  // Call once per page inside DOMContentLoaded.
  // Injects the overlay into the body and exposes window.wlShowLogin() globally.
  function initLoginUI(opts) {
    opts = opts || {};
    var accent     = opts.accentColor || '#4338ca';
    var accentSoft = opts.accentSoft  || '#eef2ff';
    var accentLine = opts.accentLine  || '#c7d2fe';
    var accentText = opts.accentText  || '#312e81';

    // Don't inject twice
    if (document.getElementById('wlOverlay')) return;

    // CSS
    var style = document.createElement('style');
    style.textContent =
      '.wl-ov{position:fixed;inset:0;background:rgba(15,23,42,.65);z-index:9999;display:flex;align-items:center;justify-content:center;}' +
      '.wl-ov.wl-hide{display:none;}' +
      '.wl-box{background:#fff;border-radius:28px;padding:32px;max-width:440px;width:90vw;box-shadow:0 40px 80px rgba(15,23,42,.25);text-align:center;font-family:\'Lexend\',sans-serif;}' +
      '.wl-icon{font-size:44px;margin-bottom:10px;}' +
      '.wl-title{font-size:22px;font-weight:900;color:#312e81;margin:0 0 6px;}' +
      '.wl-sub{color:#64748b;font-size:14px;font-weight:700;margin-bottom:20px;}' +
      '.wl-sel{width:100%;border:2px solid #e2e8f0;border-radius:14px;padding:12px 14px;font-size:14px;outline:none;margin-bottom:12px;font-family:\'Lexend\',sans-serif;font-weight:700;}' +
      '.wl-sel:focus{border-color:' + accent + ';}' +
      '.wl-list{display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto;margin-bottom:14px;text-align:left;}' +
      '.wl-sbtn{border:2px solid #e2e8f0;background:#fff;border-radius:14px;padding:12px 16px;font-weight:800;font-size:14px;cursor:pointer;color:#312e81;transition:all .15s;font-family:\'Lexend\',sans-serif;width:100%;text-align:left;}' +
      '.wl-sbtn:hover{border-color:' + accent + ';background:' + accentSoft + ';color:' + accentText + ';}' +
      '.wl-skip{border:none;background:none;color:#94a3b8;font-size:12px;font-weight:700;cursor:pointer;text-decoration:underline;font-family:\'Lexend\',sans-serif;}' +
      '.wl-no{color:#94a3b8;font-size:13px;font-weight:700;padding:8px 0;}';
    document.head.appendChild(style);

    // Overlay
    var ov = document.createElement('div');
    ov.id = 'wlOverlay';
    ov.className = 'wl-ov wl-hide'; // always start hidden — button controls it
    ov.innerHTML =
      '<div class="wl-box">' +
        '<div class="wl-icon">👋</div>' +
        '<div class="wl-title">Who are you?</div>' +
        '<div class="wl-sub">Pick your class and name — your results will be saved.</div>' +
        '<select class="wl-sel" id="wlClassSel" onchange="WordLabData._loadStudents()"><option value="">Select class...</option></select>' +
        '<div class="wl-list" id="wlStudentList"></div>' +
        '<button class="wl-skip" onclick="WordLabData._skip()">Skip — play without saving results</button>' +
      '</div>';
    document.body.appendChild(ov);

    // Populate classes
    var classes = getClasses();
    var sel = document.getElementById('wlClassSel');
    if (classes.length) {
      classes.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c.id; opt.textContent = c.name;
        sel.appendChild(opt);
      });
      if (classes.length === 1) {
        sel.value = classes[0].id;
        WordLabData._loadStudents();
      }
    } else {
      document.getElementById('wlStudentList').innerHTML =
        '<div class="wl-no">No classes set up yet. Ask your teacher to set one up, or skip.</div>';
    }

    // Global show function — always works, no scope issues
    window.wlShowLogin = function() {
      document.getElementById('wlOverlay').classList.remove('wl-hide');
    };

    // Update any pill slot with current session
    var session = loadSession();
    _updatePill(session ? session.studentName : null);
  }

  function _updatePill(name) {
    var slot = document.getElementById('wlPillSlot');
    if (!slot) return;
    if (name) {
      slot.innerHTML = '<span style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:800;color:#4338ca;cursor:pointer;font-family:Lexend,sans-serif;" onclick="wlShowLogin()">👤 ' + name + '</span>';
    }
  }

  // Called from overlay dropdown
  function _loadStudents() {
    var classId = document.getElementById('wlClassSel').value;
    var list = document.getElementById('wlStudentList');
    if (!classId) { list.innerHTML = ''; return; }
    var cls = getClass(classId);
    if (!cls) { list.innerHTML = ''; return; }
    list.innerHTML = cls.students
      .slice()
      .sort(function(a,b){ return a.name.localeCompare(b.name); })
      .map(function(s) {
        return '<button class="wl-sbtn" onclick="WordLabData._pick(\'' + s.id + '\',\'' +
          s.name.replace(/'/g,"\\'") + '\',\'' + classId + '\')">' + s.name + '</button>';
      }).join('');
  }

  function _pick(studentId, studentName, classId) {
    startSession(classId, studentId, studentName);
    document.getElementById('wlOverlay').classList.add('wl-hide');
    _updatePill(studentName);
    // Hide the plain login button if present
    var btn = document.getElementById('wlLoginBtn');
    if (btn) btn.style.display = 'none';
  }

  function _skip() {
    document.getElementById('wlOverlay').classList.add('wl-hide');
  }

  return {
    createClass, getClasses, getClass, verifyPassword,
    addStudent, removeStudent,
    startSession, getSession, endSession,
    recordAttempt,
    getAccuracy, getAvgTime, isIntervention,
    exportCSV, initLoginUI,
    _loadStudents, _pick, _skip,
    load, save
  };

})();
