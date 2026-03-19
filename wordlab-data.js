// ═══════════════════════════════════════════════════════════════
// WORD LAB — Shared Data Layer v3
// ═══════════════════════════════════════════════════════════════

const WordLabData = (() => {

  const STORAGE_KEY = 'wordlab_data_v1';
  const SESSION_KEY = 'wordlab_session_v1';

  const LEVEL_TITLES = ['Quark Cadet','Lab Apprentice','Lab Assistant','Junior Scientist','Morpheme Scientist','Word Chemist','Senior Researcher','Lead Scientist','Word Professor','Linguistic Expert','Etymology Scholar','Morpheme Master','Word Architect','Language Scientist','Quark Commander','Grand Researcher','Word Alchemist','Linguistic Professor','Grand Etymologist','Word Lab Legend'];
  const LEVEL_XP = [0,100,250,500,900,1400,2000,2800,3800,5000,6500,8500,11000,14000,18000,23000,29000,36000,45000,55000];

  const ALL_BADGES = [
    {id:'first_correct',   label:'First Discovery',     icon:'⚗️',  desc:'Answer your first question correctly'},
    {id:'streak_5',        label:'On a Roll',            icon:'🔥',  desc:'Reach a streak of 5'},
    {id:'streak_10',       label:'Unstoppable',          icon:'⚡',  desc:'Reach a streak of 10'},
    {id:'answered_50',     label:'Lab Regular',          icon:'🔬',  desc:'Answer 50 questions'},
    {id:'answered_100',    label:'Century',              icon:'💯',  desc:'100 correct answers'},
    {id:'answered_500',    label:'Word Scientist',       icon:'🧬',  desc:'500 correct answers'},
    {id:'all_activities',  label:'Polymath',             icon:'🌟',  desc:'Play every activity'},
    {id:'sessions_5',      label:'Dedicated Learner',    icon:'📅',  desc:'5 sessions'},
    {id:'sessions_20',     label:'Word Lab Veteran',     icon:'🏆',  desc:'20 sessions'},
    {id:'quarks_100',      label:'Quark Collector',      icon:'⚛️',  desc:'Earn 100 quarks'},
    {id:'quarks_500',      label:'Quark Hoarder',        icon:'💎',  desc:'Earn 500 quarks'},
    {id:'xp_level5',       label:'Rising Scientist',     icon:'📈',  desc:'Reach Level 5'},
    {id:'xp_level10',      label:'Senior Researcher',    icon:'🎓',  desc:'Reach Level 10'},
    {id:'perfect_session', label:'Flawless',             icon:'✨',  desc:'10 correct in a row'},
  ];
  const LEGENDARY_BADGES = [
    {id:'legend_morpheme', label:'Morpheme Master',      icon:'👑',  desc:'1000 correct answers'},
    {id:'legend_sessions', label:'Grand Etymologist',    icon:'🔱',  desc:'50 sessions'},
    {id:'legend_polymath', label:'Word Lab Legend',      icon:'🌈',  desc:'Earn every other badge'},
  ];

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
    try {
      const data = load();
      const cls = data.classes[classId];
      if (cls) {
        const student = cls.students.find(s => s.id === studentId);
        if (student) { ensureStudentFields(student); student.stats.sessions++; checkBadges(student); save(data); }
      }
    } catch(e) {}
  }
  function getSession() { return loadSession(); }
  function endSession() { try { sessionStorage.removeItem(SESSION_KEY); } catch {} }

  // ── Student reward fields ─────────────────────────────────────
  function ensureStudentFields(student) {
    if (!student.quarks) student.quarks = 0;
    if (!student.xp)     student.xp = 0;
    if (!student.badges) student.badges = [];
    if (!student.scientist) student.scientist = {
      skinTone:'#FDBCB4', coatColor:'#ffffff', coatPattern:'plain',
      head:null, face:null, background:'lab', owned:[]
    };
    if (!student.stats) student.stats = {
      totalCorrect:0, totalAnswered:0, sessions:0, activitiesPlayed:[], bestStreak:0
    };
    if (typeof student.stats.bestStreak === 'undefined') student.stats.bestStreak = 0;
  }

  function getLevel(xp) {
    xp = xp || 0;
    let level = 1;
    for (let i = 1; i < LEVEL_XP.length; i++) {
      if (xp >= LEVEL_XP[i]) level = i + 1; else break;
    }
    const xpStart = LEVEL_XP[level - 1];
    const xpNext  = level < 20 ? LEVEL_XP[level] : LEVEL_XP[19] + 10000;
    const progress = Math.min(100, Math.round(((xp - xpStart) / (xpNext - xpStart)) * 100));
    return { level, title: LEVEL_TITLES[level - 1], progress, xpToNext: Math.max(0, xpNext - xp) };
  }

  function checkBadges(student) {
    const s = student.stats;
    const earned = student.badges;
    const lvl = getLevel(student.xp).level;
    const newBadges = [];
    const checks = [
      {id:'first_correct',   ok: () => s.totalCorrect >= 1},
      {id:'streak_5',        ok: () => (s.bestStreak||0) >= 5},
      {id:'streak_10',       ok: () => (s.bestStreak||0) >= 10},
      {id:'answered_50',     ok: () => s.totalAnswered >= 50},
      {id:'answered_100',    ok: () => s.totalCorrect >= 100},
      {id:'answered_500',    ok: () => s.totalCorrect >= 500},
      {id:'all_activities',  ok: () => (s.activitiesPlayed||[]).length >= 6},
      {id:'sessions_5',      ok: () => s.sessions >= 5},
      {id:'sessions_20',     ok: () => s.sessions >= 20},
      {id:'quarks_100',      ok: () => student.quarks >= 100},
      {id:'quarks_500',      ok: () => student.quarks >= 500},
      {id:'xp_level5',       ok: () => lvl >= 5},
      {id:'xp_level10',      ok: () => lvl >= 10},
      {id:'perfect_session', ok: () => (s.bestStreak||0) >= 10},
      {id:'legend_morpheme', ok: () => s.totalCorrect >= 1000},
      {id:'legend_sessions', ok: () => s.sessions >= 50},
      {id:'legend_polymath', ok: () => ALL_BADGES.every(b => earned.includes(b.id))},
    ];
    checks.forEach(c => { if (!earned.includes(c.id) && c.ok()) { earned.push(c.id); newBadges.push(c.id); } });
    return newBadges;
  }

  function getStudentData() {
    const session = loadSession();
    if (!session) return null;
    const data = load();
    const cls = data.classes[session.classId];
    if (!cls) return null;
    const student = cls.students.find(s => s.id === session.studentId);
    if (!student) return null;
    ensureStudentFields(student);
    return { quarks: student.quarks, xp: student.xp, badges: student.badges,
             scientist: student.scientist, stats: student.stats,
             level: getLevel(student.xp), name: session.studentName };
  }

  function getScientist() {
    const d = getStudentData();
    return d ? d.scientist : null;
  }

  function saveScientist(updates) {
    const session = loadSession();
    if (!session) return;
    const data = load();
    const cls = data.classes[session.classId];
    if (!cls) return;
    const student = cls.students.find(s => s.id === session.studentId);
    if (!student) return;
    ensureStudentFields(student);
    Object.assign(student.scientist, updates);
    save(data);
  }

  function purchase(itemId, cost) {
    const session = loadSession();
    if (!session) return { success:false, reason:'No session' };
    const data = load();
    const cls = data.classes[session.classId];
    if (!cls) return { success:false, reason:'No class' };
    const student = cls.students.find(s => s.id === session.studentId);
    if (!student) return { success:false, reason:'No student' };
    ensureStudentFields(student);
    if (student.quarks < cost) return { success:false, reason:'Not enough quarks' };
    student.quarks -= cost;
    if (!student.scientist.owned.includes(itemId)) student.scientist.owned.push(itemId);
    save(data);
    return { success:true, quarks: student.quarks };
  }

  // ── Recording ─────────────────────────────────────────────────
  function recordAttempt(activity, category, correct, timeMs, streak) {
    streak = streak || 0;
    const session = loadSession();
    if (!session) return {};
    const data = load();
    const cls = data.classes[session.classId];
    if (!cls) return {};
    const student = cls.students.find(s => s.id === session.studentId);
    if (!student) return {};
    ensureStudentFields(student);
    if (!student.results[activity]) student.results[activity] = {};
    if (!student.results[activity][category])
      student.results[activity][category] = { correct:0, total:0, totalTime:0, attempts:[] };
    const r = student.results[activity][category];
    r.total++;
    if (correct) r.correct++;
    r.totalTime += (timeMs || 0);
    r.attempts.push({ correct, timeMs: timeMs||0, ts: Date.now() });
    if (r.attempts.length > 50) r.attempts = r.attempts.slice(-50);
    student.stats.totalAnswered++;
    if (correct) {
      student.stats.totalCorrect++;
      if (streak > (student.stats.bestStreak || 0)) student.stats.bestStreak = streak;
    }
    if (!student.stats.activitiesPlayed.includes(activity)) student.stats.activitiesPlayed.push(activity);
    let quarksEarned = 0, xpEarned = 0;
    if (correct) {
      quarksEarned = 2;
      if (streak >= 10) quarksEarned += 25;
      else if (streak >= 5) quarksEarned += 10;
      else if (streak >= 3) quarksEarned += 5;
      student.quarks += quarksEarned;
      xpEarned = 10 + (streak >= 3 ? 5 : 0);
      student.xp += xpEarned;
    }
    const newBadges = checkBadges(student);
    save(data);
    return { quarks: student.quarks, xp: student.xp, quarksEarned, xpEarned, newBadges, level: getLevel(student.xp) };
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
    const activities = ['sound-sorter','phoneme-splitter','syllable-splitter','breakdown-blitz','meaning-mode','mission-mode'];
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

  var AUDIO_PREF_KEY = 'wordlab_sound_v1';

  function _isAudioOn() {
    try { return localStorage.getItem(AUDIO_PREF_KEY) === 'on'; } catch { return false; }
  }

  function _toggleAudio() {
    var newVal = !_isAudioOn();
    try { localStorage.setItem(AUDIO_PREF_KEY, newVal ? 'on' : 'off'); } catch {}
    // Sync with WLAudio engine if loaded
    if (window.WLAudio && window.WLAudio.setEnabled) window.WLAudio.setEnabled(newVal);
    // Update button in place
    var btn = document.getElementById('wlAudioBtn');
    if (btn) {
      btn.textContent = newVal ? '🔊' : '🔇';
      btn.title = newVal ? 'Sound on — click to mute' : 'Sound off — click to enable';
      btn.style.background = newVal ? '#eef2ff' : '#fff';
      btn.style.borderColor = newVal ? '#c7d2fe' : '#e2e8f0';
    }
  }

  function _updatePill(name) {
    var slot = document.getElementById('wlPillSlot');
    if (!slot) return;
    var on = _isAudioOn();
    var audioBtn =
      '<button id="wlAudioBtn" onclick="WordLabData._toggleAudio()"' +
      ' title="' + (on ? 'Sound on — click to mute' : 'Sound off — click to enable') + '"' +
      ' style="border:2px solid ' + (on ? '#c7d2fe' : '#e2e8f0') + ';background:' + (on ? '#eef2ff' : '#fff') + ';border-radius:999px;width:36px;height:36px;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s,border-color .15s;">' +
      (on ? '🔊' : '🔇') +
      '</button>';
    var studentPill = name
      ? '<span style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:800;color:#4338ca;cursor:pointer;font-family:Lexend,sans-serif;" onclick="wlShowLogin()">👤 ' + name + '</span>'
      : '';
    slot.style.display = 'inline-flex';
    slot.style.alignItems = 'center';
    slot.style.gap = '6px';
    slot.innerHTML = audioBtn + studentPill;
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
    _loadStudents, _pick, _skip, _toggleAudio,
    load, save,
    getStudentData, getLevel, ALL_BADGES, LEGENDARY_BADGES,
    getScientist, saveScientist, purchase
  };

})();
