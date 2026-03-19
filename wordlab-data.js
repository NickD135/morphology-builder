// ═══════════════════════════════════════════════════════════════
// WORD LAB — Shared Data Layer
// All student tracking, class management and storage logic
// ═══════════════════════════════════════════════════════════════

const WordLabData = (() => {

  const STORAGE_KEY = 'wordlab_data_v1';
  const SESSION_KEY = 'wordlab_session_v1';

  // ── Load / save ──────────────────────────────────────────────
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { classes: {} };
    } catch { return { classes: {} }; }
  }

  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function saveSession(session) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
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

  // ── Session (current student) ─────────────────────────────────
  function startSession(classId, studentId, studentName) {
    saveSession({ classId, studentId, studentName, started: Date.now() });
  }

  function getSession() {
    return loadSession();
  }

  function endSession() {
    clearSession();
  }

  // ── Recording attempts ────────────────────────────────────────
  // activity: 'sound-sorter' | 'phoneme-splitter' | 'syllable-splitter' | 'meaning-mode' | 'mission-mode'
  // category: the sound group / prefix / difficulty level being tested
  // correct: boolean
  // timeMs: milliseconds taken to answer
  function recordAttempt(activity, category, correct, timeMs) {
    const session = loadSession();
    if (!session) return;

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

    // Keep only last 50 attempts per category to limit storage
    if (r.attempts.length > 50) r.attempts = r.attempts.slice(-50);

    save(data);
  }

  // ── Analytics helpers ─────────────────────────────────────────
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

  // ── Export to CSV ─────────────────────────────────────────────
  function exportCSV(classId) {
    const cls = getClass(classId);
    if (!cls) return '';

    const activities = ['sound-sorter', 'phoneme-splitter', 'syllable-splitter', 'meaning-mode', 'mission-mode'];
    const rows = [['Student', 'Activity', 'Category', 'Correct', 'Total', 'Accuracy %', 'Avg Time (ms)']];

    cls.students.forEach(student => {
      activities.forEach(activity => {
        const actData = student.results[activity] || {};
        Object.entries(actData).forEach(([category, result]) => {
          rows.push([
            student.name,
            activity,
            category,
            result.correct,
            result.total,
            getAccuracy(result) ?? '',
            getAvgTime(result) ?? ''
          ]);
        });
      });
    });

    return rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  }

  return {
    createClass, getClasses, getClass, verifyPassword,
    addStudent, removeStudent,
    startSession, getSession, endSession,
    recordAttempt,
    getAccuracy, getAvgTime, isIntervention,
    exportCSV,
    load, save
  };
})();
