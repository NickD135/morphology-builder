// ═══════════════════════════════════════════════════════════════
// WORD LAB — Shared Data Layer v2
// ═══════════════════════════════════════════════════════════════

const WordLabData = (() => {

  const STORAGE_KEY = 'wordlab_data_v1';
  // Session uses sessionStorage so it auto-clears when browser/tab closes
  // but persists across page navigations within the same session
  const SESSION_KEY = 'wordlab_session_v1';

  // ── Load / save class data ───────────────────────────────────
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { classes: {} };
    } catch { return { classes: {} }; }
  }

  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }

  // ── Session — uses sessionStorage so it persists across pages
  //    but clears automatically when the browser/tab is closed ──
  function loadSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function saveSession(session) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
  }

  function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  }

  // ── Class management ─────────────────────────────────────────
  function createClass(className, password, students) {
    const data = load();
    const classId = 'class_' + Date.now();
    data.classes[classId] = {
      id: classId,
      name: className,
      password: password,
      created: Date.now(),
      students: students.map(name => ({
        id: 'student_' + Math.random().toString(36).slice(2),
        name: name.trim(),
        results: {}
      }))
    };
    save(data);
    return classId;
  }

  function getClasses() {
    return Object.values(load().classes);
  }

  function getClass(classId) {
    return load().classes[classId] || null;
  }

  function verifyPassword(classId, password) {
    const cls = getClass(classId);
    return cls && cls.password === password;
  }

  function addStudent(classId, name) {
    const data = load();
    if (!data.classes[classId]) return;
    data.classes[classId].students.push({
      id: 'student_' + Math.random().toString(36).slice(2),
      name: name.trim(),
      results: {}
    });
    save(data);
  }

  function removeStudent(classId, studentId) {
    const data = load();
    if (!data.classes[classId]) return;
    data.classes[classId].students = data.classes[classId].students.filter(s => s.id !== studentId);
    save(data);
  }

  // ── Session ──────────────────────────────────────────────────
  function startSession(classId, studentId, studentName) {
    saveSession({ classId, studentId, studentName, started: Date.now() });
  }

  function getSession() {
    return loadSession();
  }

  // endSession only used when student manually switches — NOT on skip
  function endSession() {
    clearSession();
  }

  // ── Recording attempts ────────────────────────────────────────
  function recordAttempt(activity, category, correct, timeMs) {
    const session = loadSession();
    if (!session) return; // no session = skipped login = no recording

    const data = load();
    const cls = data.classes[session.classId];
    if (!cls) return;

    const student = cls.students.find(s => s.id === session.studentId);
    if (!student) return;

    if (!student.results[activity]) student.results[activity] = {};
    if (!student.results[activity][category]) {
      student.results[activity][category] = { correct: 0, total: 0, totalTime: 0, attempts: [] };
    }

    const r = student.results[activity][category];
    r.total++;
    if (correct) r.correct++;
    r.totalTime += (timeMs || 0);
    r.attempts.push({ correct, timeMs: timeMs || 0, ts: Date.now() });
    if (r.attempts.length > 50) r.attempts = r.attempts.slice(-50);

    save(data);
  }

  // ── Analytics ─────────────────────────────────────────────────
  function getAccuracy(result) {
    if (!result || result.total === 0) return null;
    return Math.round((result.correct / result.total) * 100);
  }

  function getAvgTime(result) {
    if (!result || result.total === 0) return null;
    return Math.round(result.totalTime / result.total);
  }

  function isIntervention(result, threshold = 70, minAttempts = 3) {
    if (!result || result.total < minAttempts) return false;
    return getAccuracy(result) < threshold;
  }

  // ── Export CSV ────────────────────────────────────────────────
  function exportCSV(classId) {
    const cls = getClass(classId);
    if (!cls) return '';
    const activities = ['sound-sorter','phoneme-splitter','syllable-splitter','meaning-mode','mission-mode'];
    const rows = [['Student','Activity','Category','Correct','Total','Accuracy %','Avg Time (ms)']];
    cls.students.forEach(student => {
      activities.forEach(activity => {
        const actData = student.results[activity] || {};
        Object.entries(actData).forEach(([category, result]) => {
          rows.push([student.name, activity, category,
            result.correct, result.total,
            getAccuracy(result) ?? '', getAvgTime(result) ?? '']);
        });
      });
    });
    return rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  }

  // ── Shared login UI helper ────────────────────────────────────
  // Call this on any page to inject the login overlay + session pill
  // onLogin(studentName) called when student selects themselves
  function initLoginUI({ accentColor = '#4338ca', accentSoft = '#eef2ff', accentLine = '#c7d2fe', accentText = '#312e81' } = {}) {
    const session = loadSession();

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
      .wl-overlay{ position:fixed; inset:0; background:rgba(15,23,42,.65); z-index:9999; display:flex; align-items:center; justify-content:center; }
      .wl-overlay.wl-hidden{ display:none; }
      .wl-box{ background:#fff; border-radius:28px; padding:32px; max-width:440px; width:90vw; box-shadow:0 40px 80px rgba(15,23,42,.25); text-align:center; font-family:'Lexend',sans-serif; }
      .wl-icon{ font-size:44px; margin-bottom:10px; }
      .wl-title{ font-size:22px; font-weight:900; color:#312e81; margin:0 0 6px; }
      .wl-sub{ color:#64748b; font-size:14px; font-weight:700; margin-bottom:20px; }
      .wl-select{ width:100%; border:2px solid #e2e8f0; border-radius:14px; padding:12px 14px; font-size:14px; outline:none; margin-bottom:12px; font-family:'Lexend',sans-serif; font-weight:700; transition:border-color .15s; }
      .wl-select:focus{ border-color:${accentColor}; }
      .wl-students{ display:flex; flex-direction:column; gap:8px; max-height:260px; overflow-y:auto; margin-bottom:14px; text-align:left; }
      .wl-student-btn{ border:2px solid #e2e8f0; background:#fff; border-radius:14px; padding:12px 16px; font-weight:800; font-size:14px; cursor:pointer; color:#312e81; transition:all .15s; font-family:'Lexend',sans-serif; }
      .wl-student-btn:hover{ border-color:${accentColor}; background:${accentSoft}; color:${accentText}; }
      .wl-skip{ border:none; background:none; color:#94a3b8; font-size:12px; font-weight:700; cursor:pointer; text-decoration:underline; font-family:'Lexend',sans-serif; }
      .wl-pill{ background:${accentSoft}; border:1px solid ${accentLine}; border-radius:999px; padding:6px 14px; font-size:12px; font-weight:800; color:${accentText}; cursor:pointer; font-family:'Lexend',sans-serif; display:none; }
      .wl-no-classes{ color:#94a3b8; font-size:13px; font-weight:700; padding:8px 0; }
    `;
    document.head.appendChild(style);

    // Inject overlay HTML
    const overlay = document.createElement('div');
    overlay.className = 'wl-overlay' + (session ? ' wl-hidden' : '');
    overlay.id = 'wlOverlay';
    overlay.innerHTML = `
      <div class="wl-box">
        <div class="wl-icon">👋</div>
        <div class="wl-title">Who are you?</div>
        <div class="wl-sub">Pick your class and name — your results will be saved.</div>
        <select class="wl-select" id="wlClassSelect" onchange="wlLoadStudents()">
          <option value="">Select class...</option>
        </select>
        <div class="wl-students" id="wlStudentList"></div>
        <button class="wl-skip" onclick="wlSkip()">Skip — play without saving results</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Populate class select
    const classes = getClasses();
    const sel = document.getElementById('wlClassSelect');
    if(classes.length){
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id; opt.textContent = c.name;
        sel.appendChild(opt);
      });
      // If only one class, auto-select it
      if(classes.length === 1){
        sel.value = classes[0].id;
        wlLoadStudents();
      }
    } else {
      document.getElementById('wlStudentList').innerHTML =
        '<div class="wl-no-classes">No classes set up yet. Ask your teacher to set one up, or skip.</div>';
    }

    // Inject session pill into hud (looks for element with id "wlPillSlot" or appends to hud)
    const pillSlot = document.getElementById('wlPillSlot');
    if(pillSlot){
      pillSlot.innerHTML = `<span class="wl-pill" id="wlPill" onclick="wlShowOverlay()">${session ? '👤 '+session.studentName : ''}</span>`;
      if(session) document.getElementById('wlPill').style.display = 'inline-flex';
    }
  }

  // Expose global helpers used by the injected HTML
  window.wlLoadStudents = function(){
    const classId = document.getElementById('wlClassSelect').value;
    const list = document.getElementById('wlStudentList');
    if(!classId){ list.innerHTML=''; return; }
    const cls = getClass(classId);
    if(!cls){ list.innerHTML=''; return; }
    list.dataset.classId = classId;
    list.innerHTML = cls.students
      .sort((a,b) => a.name.localeCompare(b.name))
      .map(s => `<button class="wl-student-btn" onclick="wlSelectStudent('${s.id}','${s.name.replace(/'/g,"\'")}','${classId}')">${s.name}</button>`)
      .join('');
  };

  window.wlSelectStudent = function(studentId, studentName, classId){
    startSession(classId, studentId, studentName);
    document.getElementById('wlOverlay').classList.add('wl-hidden');
    const pill = document.getElementById('wlPill');
    if(pill){ pill.textContent = '👤 ' + studentName; pill.style.display = 'inline-flex'; }
  };

  window.wlSkip = function(){
    // Skip: just close overlay, don't clear any existing session, don't start a new one
    document.getElementById('wlOverlay').classList.add('wl-hidden');
  };

  window.wlShowOverlay = function(){
    document.getElementById('wlOverlay').classList.remove('wl-hidden');
  };

  return loadSession(); // returns current session for caller to use
}

  return {
    createClass, getClasses, getClass, verifyPassword,
    addStudent, removeStudent,
    startSession, getSession, endSession,
    recordAttempt,
    getAccuracy, getAvgTime, isIntervention,
    exportCSV, initLoginUI,
    load, save
  };
})();
