// ═══════════════════════════════════════════════════════════════
// WORD LAB — Shared Data Layer v4 (Supabase)
// ═══════════════════════════════════════════════════════════════

const WordLabData = (() => {

  const SUPABASE_URL  = 'https://qutsbcfkgiihcwaktsaz.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dHNiY2ZrZ2lpaGN3YWt0c2F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NDE1NDksImV4cCI6MjA4OTUxNzU0OX0.h1N26KCcyHDrW4FRk6iBNmJUMQcFCYi8eHpOC818B8E';
  const SESSION_KEY   = 'wordlab_session_v1';

  const CODE_LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ'; // no I, O, Q

  function generateStudentCode(existingCodes) {
    existingCodes = (existingCodes || []).map(function(c){ return (c||'').toUpperCase(); });
    for (var attempts = 0; attempts < 500; attempts++) {
      var code = '';
      for (var i = 0; i < 3; i++) {
        code += CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)];
      }
      if (!existingCodes.includes(code)) return code;
    }
    throw new Error('Could not generate unique student code');
  }

  // Lazy Supabase client — avoids errors if CDN loads after this file
  let _sbClient = null;
  function sb() {
    if (!_sbClient) {
      _sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    }
    return _sbClient;
  }

  // ── Constants ─────────────────────────────────────────────────
  const LEVEL_TITLES = ['Quark Cadet','Lab Apprentice','Lab Assistant','Junior Scientist','Morpheme Scientist','Word Chemist','Senior Researcher','Lead Scientist','Word Professor','Linguistic Expert','Etymology Scholar','Morpheme Master','Word Architect','Language Scientist','Quark Commander','Grand Researcher','Word Alchemist','Linguistic Professor','Grand Etymologist','Word Labs Legend'];
  const LEVEL_XP = [0,100,250,500,900,1400,2000,2800,3800,5000,6500,8500,11000,14000,18000,23000,29000,36000,45000,55000];

  const ALL_BADGES = [
    // ── First steps ──
    {id:'first_correct',   label:'First Discovery',      icon:'⚗️',  desc:'Answer your first question correctly'},
    {id:'answered_10',     label:'First Steps',          icon:'👟',  desc:'Answer 10 questions'},
    {id:'answered_25',     label:'Getting Started',      icon:'🔬',  desc:'Get 25 correct answers'},
    {id:'answered_50',     label:'Lab Regular',          icon:'💯',  desc:'Answer 50 questions'},
    {id:'answered_100',    label:'Century',              icon:'🧬',  desc:'100 correct answers'},
    {id:'answered_200',    label:'Dedicated Scientist',  icon:'🔭',  desc:'200 correct answers'},
    {id:'answered_500',    label:'Word Scientist',       icon:'🥈',  desc:'500 correct answers'},
    {id:'answered_750',    label:'Elite Scientist',      icon:'🥇',  desc:'750 correct answers'},
    // ── Streaks ──
    {id:'streak_3',        label:'Warming Up',           icon:'🌡️', desc:'Get a streak of 3'},
    {id:'streak_5',        label:'On a Roll',            icon:'🔥',  desc:'Reach a streak of 5'},
    {id:'streak_10',       label:'Unstoppable',          icon:'⚡',  desc:'Reach a streak of 10'},
    {id:'streak_15',       label:'On Fire',              icon:'🌋',  desc:'Reach a streak of 15'},
    {id:'streak_20',       label:'Unstoppable Force',    icon:'🌪️', desc:'Reach a streak of 20'},
    {id:'perfect_session', label:'Flawless',             icon:'✨',  desc:'10 correct in a row with no mistakes'},
    // ── Sessions ──
    {id:'sessions_5',      label:'Dedicated Learner',    icon:'📅',  desc:'Complete 5 sessions'},
    {id:'sessions_10',     label:'Regular Visitor',      icon:'📆',  desc:'Complete 10 sessions'},
    {id:'sessions_20',     label:'Word Labs Veteran',     icon:'🏆',  desc:'Complete 20 sessions'},
    {id:'sessions_30',     label:'Committed Learner',    icon:'🗓️', desc:'Complete 30 sessions'},
    // ── Exploration ──
    {id:'all_activities',  label:'Polymath',             icon:'🌟',  desc:'Play every activity at least once'},
    // ── Levels ──
    {id:'xp_level3',       label:'Apprentice',           icon:'🧪',  desc:'Reach Level 3'},
    {id:'xp_level5',       label:'Rising Scientist',     icon:'📈',  desc:'Reach Level 5'},
    {id:'xp_level10',      label:'Senior Researcher',    icon:'🎓',  desc:'Reach Level 10'},
    {id:'xp_level15',      label:'Expert Researcher',    icon:'📡',  desc:'Reach Level 15'},
    {id:'xp_level20',      label:'Master Scientist',     icon:'🎯',  desc:'Reach Level 20'},
    // ── Quarks ──
    {id:'quarks_100',      label:'Quark Collector',      icon:'⚛️',  desc:'Earn 100 quarks'},
    {id:'quarks_250',      label:'Quark Accumulator',    icon:'💫',  desc:'Earn 250 quarks'},
    {id:'quarks_500',      label:'Quark Hoarder',        icon:'💎',  desc:'Earn 500 quarks'},
    {id:'quarks_1000',     label:'Quark Magnate',        icon:'💰',  desc:'Earn 1000 quarks'},
  ];
  const LEGENDARY_BADGES = [
    {id:'legend_morpheme',  label:'Morpheme Master',   icon:'👑',  desc:'1000 correct answers'},
    {id:'legend_sessions',  label:'Grand Etymologist', icon:'🔱',  desc:'50 sessions'},
    {id:'legend_streak',    label:'Streak Legend',     icon:'🌩️', desc:'Achieve a streak of 30'},
    {id:'legend_collector', label:'Master Collector',  icon:'💎',  desc:'Own 10 or more shop items'},
    {id:'legend_polymath',  label:'Word Labs Legend',   icon:'🌈',  desc:'Earn every other badge'},
  ];

  // ── Session (sessionStorage) ──────────────────────────────────
  function loadSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
  }
  function saveSession(s) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
  }
  function getSession() {
    const s = loadSession();
    if (!s) return null;
    s.extensionMode = sessionStorage.getItem('wl_extension_mode') === 'true';
    return s;
  }
  function endSession() { try { sessionStorage.removeItem(SESSION_KEY); } catch {} }

  // ── Pure computation ──────────────────────────────────────────
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

  // ── Character field defaults ──────────────────────────────────
  function ensureCharFields(char) {
    if (!char) char = {};
    if (!char.quarks) char.quarks = 0;
    if (!char.xp)     char.xp = 0;
    if (!char.badges) char.badges = [];
    if (!char.scientist) char.scientist = {
      skinTone:'#FDBCB4', coatColor:'#ffffff', coatPattern:'plain',
      head:null, face:null, background:'lab', effect:null, owned:[], customSlots:{}
    };
    if (typeof char.scientist.effect === 'undefined') char.scientist.effect = null;
    if (!char.scientist.customSlots) char.scientist.customSlots = {};
    if (!char.stats) char.stats = {
      totalCorrect:0, totalAnswered:0, sessions:0, activitiesPlayed:[], bestStreak:0
    };
    if (typeof char.stats.bestStreak === 'undefined') char.stats.bestStreak = 0;
    return char;
  }

  function checkBadges(student) {
    const s = student.stats;
    const earned = student.badges;
    const lvl = getLevel(student.xp).level;
    const newBadges = [];
    const checks = [
      // First steps
      {id:'first_correct',   ok: () => s.totalCorrect >= 1},
      {id:'answered_10',     ok: () => s.totalAnswered >= 10},
      {id:'answered_25',     ok: () => s.totalCorrect >= 25},
      {id:'answered_50',     ok: () => s.totalAnswered >= 50},
      {id:'answered_100',    ok: () => s.totalCorrect >= 100},
      {id:'answered_200',    ok: () => s.totalCorrect >= 200},
      {id:'answered_500',    ok: () => s.totalCorrect >= 500},
      {id:'answered_750',    ok: () => s.totalCorrect >= 750},
      // Streaks
      {id:'streak_3',        ok: () => (s.bestStreak||0) >= 3},
      {id:'streak_5',        ok: () => (s.bestStreak||0) >= 5},
      {id:'streak_10',       ok: () => (s.bestStreak||0) >= 10},
      {id:'streak_15',       ok: () => (s.bestStreak||0) >= 15},
      {id:'streak_20',       ok: () => (s.bestStreak||0) >= 20},
      {id:'perfect_session', ok: () => (s.bestStreak||0) >= 10},
      // Sessions
      {id:'sessions_5',      ok: () => s.sessions >= 5},
      {id:'sessions_10',     ok: () => s.sessions >= 10},
      {id:'sessions_20',     ok: () => s.sessions >= 20},
      {id:'sessions_30',     ok: () => s.sessions >= 30},
      // Exploration
      {id:'all_activities',  ok: () => (s.activitiesPlayed||[]).length >= 6},
      // Levels
      {id:'xp_level3',       ok: () => lvl >= 3},
      {id:'xp_level5',       ok: () => lvl >= 5},
      {id:'xp_level10',      ok: () => lvl >= 10},
      {id:'xp_level15',      ok: () => lvl >= 15},
      {id:'xp_level20',      ok: () => lvl >= 20},
      // Quarks
      {id:'quarks_100',      ok: () => student.quarks >= 100},
      {id:'quarks_250',      ok: () => student.quarks >= 250},
      {id:'quarks_500',      ok: () => student.quarks >= 500},
      {id:'quarks_1000',     ok: () => student.quarks >= 1000},
      // Legendary
      {id:'legend_morpheme',  ok: () => s.totalCorrect >= 1000},
      {id:'legend_sessions',  ok: () => s.sessions >= 50},
      {id:'legend_streak',    ok: () => (s.bestStreak||0) >= 30},
      {id:'legend_collector', ok: () => ((student.scientist||{}).owned||[]).length >= 10},
      {id:'legend_polymath',  ok: () => ALL_BADGES.every(b => earned.includes(b.id))},
    ];
    checks.forEach(c => { if (!earned.includes(c.id) && c.ok()) { earned.push(c.id); newBadges.push(c.id); } });
    return newBadges;
  }

  // ── Teacher Auth ──────────────────────────────────────────────
  async function getTeacherSession() {
    const { data: { session } } = await sb().auth.getSession();
    return session ? session.user : null;
  }

  async function requireTeacherAuth(fallbackUrl) {
    const { data: { session } } = await sb().auth.getSession();
    if (!session) {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = (fallbackUrl || 'teacher-login.html') + '?returnTo=' + returnTo;
      return null;
    }
    return session.user;
  }

  async function teacherSignOut() {
    await sb().auth.signOut();
    window.location.href = 'teacher-login.html';
  }

  // ── Classes ───────────────────────────────────────────────────
  async function createClass(name, password, classCode, students) {
    // Check if class_code already taken (case-insensitive)
    var { data: existing } = await sb()
      .from('classes')
      .select('id')
      .ilike('class_code', classCode)
      .maybeSingle();
    if (existing) {
      throw { code: 'CLASS_CODE_TAKEN', message: 'That class code is already in use. Please choose a different one.' };
    }
    const { data: { session: _authSess } } = await sb().auth.getSession();
    const _teacher = _authSess ? await getTeacherRecord() : null;
    var { data: cls, error: clsErr } = await sb()
      .from('classes')
      .insert({
        name: name,
        teacher_password: password,
        class_code: classCode.toUpperCase(),
        auth_user_id: _authSess ? _authSess.user.id : null,
        school_id: _teacher ? _teacher.school_id : null
      })
      .select('id')
      .single();
    if (clsErr) throw clsErr;
    var classId = cls.id;
    // Generate unique codes for each student
    var usedCodes = [];
    var rows = students.map(function(n) {
      var code = generateStudentCode(usedCodes);
      usedCodes.push(code);
      return { class_id: classId, name: n.trim(), student_code: code };
    });
    var { error: stuErr } = await sb().from('students').insert(rows);
    if (stuErr) throw stuErr;
    return classId;
  }

  // Cache teacher record to avoid repeated DB calls
  let _teacherRecord = null;
  async function getTeacherRecord() {
    if (_teacherRecord) return _teacherRecord;
    const { data: { session } } = await sb().auth.getSession();
    if (!session) return null;
    var { data } = await sb()
      .from('teachers')
      .select('id, school_id, email, plan')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();

    // Auto-create school + teacher record if missing (handles edge cases
    // where signup created the auth user but records weren't created yet)
    if (!data) {
      try {
        var { data: school } = await sb()
          .from('schools')
          .insert({ name: 'My School', plan: 'trial', trial_ends_at: new Date(Date.now() + 30 * 86400000).toISOString() })
          .select('id')
          .single();
        if (school) {
          await sb().from('teachers').insert({
            auth_user_id: session.user.id,
            school_id: school.id,
            email: session.user.email
          });
          var { data: newTeacher } = await sb()
            .from('teachers')
            .select('id, school_id, email, plan')
            .eq('auth_user_id', session.user.id)
            .maybeSingle();
          data = newTeacher;
        }
      } catch (e) {
        console.warn('Auto-create school/teacher failed:', e);
      }
    }

    _teacherRecord = data || null;
    return _teacherRecord;
  }

  async function getClasses() {
    const { data: { session: _sess } } = await sb().auth.getSession();
    let query = sb()
      .from('classes')
      .select('id, name, class_code, created_at, students!students_class_id_fkey(id, name, student_code, extension_mode)')
      .order('name');
    if (_sess) {
      const teacher = await getTeacherRecord();
      if (teacher?.school_id) {
        query = query.eq('school_id', teacher.school_id);
      } else {
        // Fallback for accounts without a school record yet
        query = query.eq('auth_user_id', _sess.user.id);
      }
    }
    var { data, error } = await query;
    if (error) throw error;
    return (data || []).map(function(c) {
      return {
        id: c.id,
        name: c.name,
        class_code: c.class_code || '',
        created: new Date(c.created_at).getTime(),
        students: (c.students || []).map(function(s) { return { id: s.id, name: s.name, student_code: s.student_code || '', extension_mode: !!s.extension_mode }; })
      };
    });
  }

  async function getClass(id) {
    const { data: cls, error: clsErr } = await sb()
      .from('classes')
      .select('id, name, teacher_password, created_at')
      .eq('id', id)
      .single();
    if (clsErr) throw clsErr;

    const { data: studs, error: stuErr } = await sb()
      .from('students')
      .select('id, name, student_code, extension_mode')
      .eq('class_id', id)
      .order('name');
    if (stuErr) throw stuErr;

    const studentIds = (studs || []).map(s => s.id);
    let progressRows = [];
    let charRows = [];

    if (studentIds.length) {
      const [progResult, charResult] = await Promise.all([
        sb().from('student_progress')
          .select('student_id, activity, category, correct, total, total_time, updated_at')
          .in('student_id', studentIds),
        sb().from('student_character')
          .select('student_id, quarks, xp, badges, scientist, stats')
          .in('student_id', studentIds)
      ]);
      if (progResult.error) throw progResult.error;
      if (charResult.error) throw charResult.error;
      progressRows = progResult.data || [];
      charRows = charResult.data || [];
    }

    const charMap = {};
    charRows.forEach(c => { charMap[c.student_id] = c; });

    const progressMap = {};
    const lastActiveMap = {};
    progressRows.forEach(row => {
      if (!progressMap[row.student_id]) progressMap[row.student_id] = {};
      if (!progressMap[row.student_id][row.activity]) progressMap[row.student_id][row.activity] = {};
      progressMap[row.student_id][row.activity][row.category] = {
        correct: row.correct,
        total: row.total,
        totalTime: row.total_time
      };
      if (row.updated_at) {
        var ts = new Date(row.updated_at).getTime();
        if (!lastActiveMap[row.student_id] || ts > lastActiveMap[row.student_id]) {
          lastActiveMap[row.student_id] = ts;
        }
      }
    });

    const students = (studs || []).map(s => ({
      id: s.id,
      name: s.name,
      student_code: s.student_code || '',
      extension_mode: !!s.extension_mode,
      results: progressMap[s.id] || {},
      lastActive: lastActiveMap[s.id] || null
    }));

    return {
      id: cls.id,
      name: cls.name,
      password: cls.teacher_password,
      created: new Date(cls.created_at).getTime(),
      students
    };
  }

  async function verifyPassword(id, pw) {
    const { data, error } = await sb()
      .from('classes')
      .select('teacher_password')
      .eq('id', id)
      .single();
    if (error || !data) return false;
    return data.teacher_password === pw;
  }

  async function addStudent(classId, name) {
    var { data: existing } = await sb()
      .from('students')
      .select('student_code')
      .eq('class_id', classId);
    var usedCodes = (existing || []).map(function(s){ return s.student_code || ''; });
    var code = generateStudentCode(usedCodes);
    var { error } = await sb().from('students').insert({ class_id: classId, name: name.trim(), student_code: code });
    if (error) throw error;
    return code;
  }

  async function addStudentsBulk(classId, names) {
    var { data: existing } = await sb()
      .from('students')
      .select('student_code')
      .eq('class_id', classId);
    var usedCodes = (existing || []).map(function(s){ return s.student_code || ''; });
    var rows = names.map(function(n) {
      var code = generateStudentCode(usedCodes);
      usedCodes.push(code);
      return { class_id: classId, name: n.trim(), student_code: code };
    });
    var { data, error } = await sb().from('students').insert(rows).select('id, name, student_code');
    if (error) throw error;
    return data;
  }

  async function removeStudent(classId, studentId) {
    const { error } = await sb()
      .from('students')
      .delete()
      .eq('id', studentId)
      .eq('class_id', classId);
    if (error) throw error;
  }

  async function deleteClass(classId) {
    const { data: studs } = await sb()
      .from('students')
      .select('id')
      .eq('class_id', classId);
    const studentIds = (studs || []).map(s => s.id);
    if (studentIds.length) {
      await sb().from('student_progress').delete().in('student_id', studentIds);
      await sb().from('student_character').delete().in('student_id', studentIds);
      await sb().from('students').delete().in('id', studentIds);
    }
    await sb().from('classes').delete().eq('id', classId);
  }

  async function regenerateStudentCode(classId, studentId) {
    var { data: students } = await sb()
      .from('students')
      .select('id, student_code')
      .eq('class_id', classId);
    var usedCodes = (students || [])
      .filter(function(s){ return s.id !== studentId; })
      .map(function(s){ return s.student_code || ''; });
    var newCode = generateStudentCode(usedCodes);
    await sb().from('students').update({ student_code: newCode }).eq('id', studentId);
    return newCode;
  }

  async function lookupClassByCode(code) {
    var { data } = await sb()
      .from('classes')
      .select('id, name')
      .ilike('class_code', code)
      .maybeSingle();
    return data || null;
  }

  async function verifyStudentCode(studentId, code) {
    var { data } = await sb()
      .from('students')
      .select('student_code, extension_mode')
      .eq('id', studentId)
      .maybeSingle();
    if (!data || !data.student_code) return { ok: false, extensionMode: false };
    var ok = data.student_code.toUpperCase() === code.toUpperCase();
    return { ok, extensionMode: ok ? !!data.extension_mode : false };
  }

  // ── Session ───────────────────────────────────────────────────
  async function startSession(classId, studentId, studentName) {
    saveSession({ classId, studentId, studentName, started: Date.now() });
    try {
      const { data: existing } = await sb()
        .from('student_character')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();
      const char = ensureCharFields(existing ? { ...existing } : { student_id: studentId });
      char.stats.sessions++;
      checkBadges(char);
      await sb().from('student_character').upsert(
        { student_id: studentId, quarks: char.quarks, xp: char.xp,
          badges: char.badges, scientist: char.scientist, stats: char.stats },
        { onConflict: 'student_id' }
      );
    } catch(e) { console.warn('startSession character update failed', e); }
  }

  // ── Extension mode ────────────────────────────────────────────
  function isExtensionMode() {
    return sessionStorage.getItem('wl_extension_mode') === 'true';
  }

  // ── Record attempt ────────────────────────────────────────────
  async function recordAttempt(activity, category, correct, timeMs, streak) {
    streak = streak || 0;
    const session = loadSession();
    if (!session) return {};
    const studentId = session.studentId;

    // Atomic progress increment via Postgres RPC (no race condition)
    // and fetch character data in parallel
    const [_rpcResult, charResult] = await Promise.all([
      sb().rpc('increment_progress', {
        p_student_id: studentId,
        p_activity: activity,
        p_category: category,
        p_correct: !!correct,
        p_time_ms: timeMs || 0,
        p_is_extension: isExtensionMode()
      }),
      sb().from('student_character')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle()
    ]);
    const existingChar = charResult.data;
    const char = ensureCharFields(existingChar ? { ...existingChar } : { student_id: studentId });

    char.stats.totalAnswered++;
    if (correct) {
      char.stats.totalCorrect++;
      if (streak > (char.stats.bestStreak || 0)) char.stats.bestStreak = streak;
    }
    if (!char.stats.activitiesPlayed.includes(activity)) char.stats.activitiesPlayed.push(activity);

    let quarksEarned = 0, xpEarned = 0;
    if (correct) {
      quarksEarned = 2;
      if (streak >= 10) quarksEarned += 25;
      else if (streak >= 5) quarksEarned += 10;
      else if (streak >= 3) quarksEarned += 5;
      char.quarks += quarksEarned;
      xpEarned = 10 + (streak >= 3 ? 5 : 0);
      char.xp += xpEarned;
    }

    const newBadges = checkBadges(char);
    await sb().from('student_character').upsert(
      { student_id: studentId, quarks: char.quarks, xp: char.xp,
        badges: char.badges, scientist: char.scientist, stats: char.stats,
        updated_at: new Date().toISOString() },
      { onConflict: 'student_id' }
    );

    // Track daily usage for free tier limits
    try { incrementDailyUsage(); } catch(e) {}

    return { quarks: char.quarks, xp: char.xp, quarksEarned, xpEarned, newBadges, level: getLevel(char.xp) };
  }

  // ── Student data ──────────────────────────────────────────────
  async function getStudentData() {
    const session = loadSession();
    if (!session) return null;
    const [stuResult, charResult, isTeacher] = await Promise.all([
      sb().from('students').select('extension_mode').eq('id', session.studentId).maybeSingle(),
      sb().from('student_character').select('*').eq('student_id', session.studentId).maybeSingle(),
      isStudentTeacher(session.classId, session.studentId)
    ]);
    const data = stuResult.data;
    if (data && data.extension_mode !== undefined) {
      if (!sessionStorage.getItem('wl_ext_pinned')) {
        sessionStorage.setItem('wl_extension_mode', data.extension_mode ? 'true' : 'false');
      }
    }
    const char = ensureCharFields(charResult.data ? { ...charResult.data } : {});
    return {
      quarks: char.quarks, xp: char.xp, badges: char.badges,
      scientist: char.scientist, stats: char.stats,
      level: getLevel(char.xp), name: session.studentName,
      is_teacher: isTeacher
    };
  }

  async function getScientist() {
    const d = await getStudentData();
    return d ? d.scientist : null;
  }

  async function saveScientist(updates) {
    const session = loadSession();
    if (!session) return;
    const { data: existing } = await sb()
      .from('student_character')
      .select('*')
      .eq('student_id', session.studentId)
      .maybeSingle();
    const char = ensureCharFields(existing ? { ...existing } : { student_id: session.studentId });
    Object.assign(char.scientist, updates);
    await sb().from('student_character').upsert(
      { student_id: session.studentId, quarks: char.quarks, xp: char.xp,
        badges: char.badges, scientist: char.scientist, stats: char.stats },
      { onConflict: 'student_id' }
    );
  }

  async function purchase(itemId, cost) {
    const session = loadSession();
    if (!session) return { success: false, reason: 'No session' };
    const { data: existing } = await sb()
      .from('student_character')
      .select('*')
      .eq('student_id', session.studentId)
      .maybeSingle();
    const char = ensureCharFields(existing ? { ...existing } : { student_id: session.studentId });
    if (char.quarks < cost) return { success: false, reason: 'Not enough quarks' };
    char.quarks -= cost;
    if (!char.scientist.owned.includes(itemId)) char.scientist.owned.push(itemId);
    await sb().from('student_character').upsert(
      { student_id: session.studentId, quarks: char.quarks, xp: char.xp,
        badges: char.badges, scientist: char.scientist, stats: char.stats },
      { onConflict: 'student_id' }
    );
    return { success: true, quarks: char.quarks };
  }

  // ── Export ────────────────────────────────────────────────────
  function exportCSV(cls) {
    if (!cls) return '';
    const activities = ['sound-sorter','phoneme-splitter','syllable-splitter','breakdown-blitz','meaning-mode','mission-mode','root-lab','homophone-hunter','word-spectrum'];
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
  // Module-level login state
  var _loginClassId = null;
  var _loginStudentId = null;
  var _loginStudentName = null;
  var _onLoginCallback = null;

  function initLoginUI(opts) {
    opts = opts || {};
    _onLoginCallback = opts.onLogin || null;
    var accent     = opts.accentColor || '#4338ca';
    var accentSoft = opts.accentSoft  || '#eef2ff';
    var accentLine = opts.accentLine  || '#c7d2fe';
    var accentText = opts.accentText  || '#312e81';

    if (document.getElementById('wlOverlay')) return;

    var style = document.createElement('style');
    style.textContent =
      '.wl-ov{position:fixed;inset:0;background:rgba(15,23,42,.65);z-index:9999;display:flex;align-items:center;justify-content:center;}' +
      '.wl-ov.wl-hide{display:none;}' +
      '.wl-box{background:#fff;border-radius:28px;padding:32px;max-width:440px;width:90vw;box-shadow:0 40px 80px rgba(15,23,42,.25);text-align:center;font-family:\'Lexend\',sans-serif;}' +
      '.wl-icon{font-size:44px;margin-bottom:10px;}' +
      '.wl-title{font-size:22px;font-weight:900;color:#312e81;margin:0 0 6px;}' +
      '.wl-sub{color:#64748b;font-size:14px;font-weight:700;margin-bottom:20px;}' +
      '.wl-inp{width:100%;border:2px solid #e2e8f0;border-radius:14px;padding:12px 14px;font-size:18px;font-weight:800;outline:none;margin-bottom:10px;font-family:\'Lexend\',sans-serif;text-align:center;letter-spacing:.08em;transition:border-color .15s;}' +
      '.wl-inp:focus{border-color:' + accent + ';}' +
      '.wl-list{display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto;margin-bottom:14px;text-align:left;}' +
      '.wl-sbtn{border:2px solid #e2e8f0;background:#fff;border-radius:14px;padding:12px 16px;font-weight:800;font-size:14px;cursor:pointer;color:#312e81;transition:all .15s;font-family:\'Lexend\',sans-serif;width:100%;text-align:left;}' +
      '.wl-sbtn:hover{border-color:' + accent + ';background:' + accentSoft + ';color:' + accentText + ';}' +
      '.wl-primary-btn{border:none;background:' + accent + ';color:#fff;border-radius:14px;padding:13px;font-size:14px;font-weight:900;cursor:pointer;width:100%;font-family:\'Lexend\',sans-serif;margin-bottom:10px;transition:background .15s;}' +
      '.wl-primary-btn:hover{background:#3730a3;}' +
      '.wl-back{color:#94a3b8;font-size:12px;font-weight:700;cursor:pointer;text-align:left;margin-bottom:16px;display:inline-block;}' +
      '.wl-back:hover{color:#475569;}' +
      '.wl-err{color:#dc2626;font-size:13px;font-weight:800;margin-bottom:10px;min-height:18px;}' +
      '.wl-skip{border:none;background:none;color:#94a3b8;font-size:12px;font-weight:700;cursor:pointer;text-decoration:underline;font-family:\'Lexend\',sans-serif;}' +
      '.wl-no{color:#94a3b8;font-size:13px;font-weight:700;padding:8px 0;}';
    document.head.appendChild(style);

    var ov = document.createElement('div');
    ov.id = 'wlOverlay';
    ov.className = 'wl-ov wl-hide';
    ov.innerHTML =
      '<div class="wl-box" style="position:relative;">' +
        '<button id="wlCloseBtn" onclick="document.getElementById(\'wlOverlay\').classList.add(\'wl-hide\')" style="position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:10px;border:2px solid #e2e8f0;background:#fff;cursor:pointer;font-size:16px;color:#94a3b8;display:flex;align-items:center;justify-content:center;font-family:Lexend,sans-serif;transition:all .15s;z-index:1;" onmouseover="this.style.background=\'#f1f5f9\';this.style.color=\'#475569\'" onmouseout="this.style.background=\'#fff\';this.style.color=\'#94a3b8\'">&times;</button>' +
        // Step 1: class code
        '<div id="wlStep1">' +
          '<div class="wl-icon">🔑</div>' +
          '<div class="wl-title">Enter class code</div>' +
          '<div class="wl-sub">Type the code your teacher gave you</div>' +
          '<input class="wl-inp" id="wlCodeInput" placeholder="e.g. 3B" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase;" onkeydown="if(event.key===\'Enter\') WordLabData._stepClassCode()">' +
          '<div class="wl-err" id="wlCodeErr"></div>' +
          '<button class="wl-primary-btn" onclick="WordLabData._stepClassCode()">Next \u2192</button>' +
          '<button class="wl-skip" onclick="WordLabData._skip()">Skip \u2014 play without saving results</button>' +
        '</div>' +
        // Step 2: student name list
        '<div id="wlStep2" style="display:none;">' +
          '<div class="wl-back" onclick="WordLabData._backToStep1()">\u2190 Back</div>' +
          '<div class="wl-icon">👋</div>' +
          '<div class="wl-title">Who are you?</div>' +
          '<div class="wl-sub" id="wlClassNameDisplay">Pick your name</div>' +
          '<div class="wl-list" id="wlStudentList"></div>' +
          '<button class="wl-skip" onclick="WordLabData._skip()">Skip \u2014 play without saving results</button>' +
        '</div>' +
        // Step 3: student code
        '<div id="wlStep3" style="display:none;">' +
          '<div class="wl-back" onclick="WordLabData._backToStep2()">\u2190 Back</div>' +
          '<div class="wl-icon">🔐</div>' +
          '<div class="wl-title">Enter your code</div>' +
          '<div class="wl-sub" id="wlPinNameDisplay">Type your 3-letter code</div>' +
          '<input class="wl-inp" id="wlPinInput" placeholder="ABC" maxlength="3" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase;font-size:28px;letter-spacing:.25em;" onkeydown="if(event.key===\'Enter\') WordLabData._stepStudentCode()">' +
          '<div class="wl-err" id="wlPinErr"></div>' +
          '<button class="wl-primary-btn" onclick="WordLabData._stepStudentCode()">Log in \u2192</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    window.wlShowLogin = function() {
      // Always start at step 1 when opening
      _wlShowStep(1);
      document.getElementById('wlOverlay').classList.remove('wl-hide');
    };

    var session = loadSession();
    _updatePill(session ? session.studentName : null);
  }

  function _wlShowStep(n) {
    var s1 = document.getElementById('wlStep1');
    var s2 = document.getElementById('wlStep2');
    var s3 = document.getElementById('wlStep3');
    if (s1) s1.style.display = n === 1 ? '' : 'none';
    if (s2) s2.style.display = n === 2 ? '' : 'none';
    if (s3) s3.style.display = n === 3 ? '' : 'none';
    if (n === 1) { var inp = document.getElementById('wlCodeInput'); if (inp) { inp.value = ''; setTimeout(function(){ inp.focus(); }, 50); } }
    if (n === 3) { var pin = document.getElementById('wlPinInput'); if (pin) { pin.value = ''; setTimeout(function(){ pin.focus(); }, 50); } }
  }

  function _backToStep1() {
    var err = document.getElementById('wlCodeErr');
    if (err) err.textContent = '';
    _wlShowStep(1);
  }

  function _backToStep2() {
    var err = document.getElementById('wlPinErr');
    if (err) err.textContent = '';
    _wlShowStep(2);
  }

  function _stepClassCode() {
    var inp = document.getElementById('wlCodeInput');
    var err = document.getElementById('wlCodeErr');
    var code = (inp ? inp.value.trim() : '');
    if (!code) { if (err) err.textContent = 'Please enter your class code.'; return; }
    if (err) err.textContent = '';
    if (inp) inp.disabled = true;
    (async function() {
      try {
        var cls = await lookupClassByCode(code);
        if (!cls) {
          if (err) err.textContent = 'Class not found \u2014 check your code.';
          if (inp) inp.disabled = false;
          return;
        }
        _loginClassId = cls.id;
        // Load student list
        var nameDisplay = document.getElementById('wlClassNameDisplay');
        if (nameDisplay) nameDisplay.textContent = cls.name + ' \u2014 pick your name';
        var list = document.getElementById('wlStudentList');
        if (list) list.innerHTML = '<div class="wl-no">Loading...</div>';
        _wlShowStep(2);
        var { data: students, error: stuErr } = await sb()
          .from('students')
          .select('id, name')
          .eq('class_id', cls.id)
          .order('name');
        if (stuErr || !students || !students.length) {
          if (list) list.innerHTML = '<div class="wl-no">No students in this class.</div>';
          return;
        }
        if (list) list.innerHTML = students.map(function(s) {
          return '<button class="wl-sbtn" onclick="WordLabData._pickStudent(\'' + s.id + '\',\'' + s.name.replace(/'/g,"\\'") + '\')">' + s.name + '</button>';
        }).join('');
      } catch(e) {
        if (err) err.textContent = 'Error connecting \u2014 try again.';
        if (inp) inp.disabled = false;
      }
    })();
  }

  function _pickStudent(studentId, studentName) {
    _loginStudentId = studentId;
    _loginStudentName = studentName;
    var nameDisplay = document.getElementById('wlPinNameDisplay');
    if (nameDisplay) nameDisplay.textContent = 'Hi ' + studentName + '! Enter your 3-letter code.';
    var err = document.getElementById('wlPinErr');
    if (err) err.textContent = '';
    _wlShowStep(3);
  }

  function _stepStudentCode() {
    var inp = document.getElementById('wlPinInput');
    var err = document.getElementById('wlPinErr');
    var code = (inp ? inp.value.trim() : '');
    if (!code || code.length !== 3) { if (err) err.textContent = 'Please enter your 3-letter code.'; return; }
    if (err) err.textContent = '';
    if (inp) inp.disabled = true;
    (async function() {
      try {
        var result = await verifyStudentCode(_loginStudentId, code);
        if (!result.ok) {
          if (err) err.textContent = 'Incorrect code \u2014 try again.';
          if (inp) { inp.disabled = false; inp.value = ''; inp.focus(); }
          return;
        }
        // Store extension mode synchronously before session starts so pages can read it immediately
        // Clear any previous student choice so the DB value is used as the fresh default on login
        sessionStorage.removeItem('wl_ext_pinned');
        sessionStorage.setItem('wl_extension_mode', result.extensionMode ? 'true' : 'false');
        // Success
        startSession(_loginClassId, _loginStudentId, _loginStudentName);
        document.getElementById('wlOverlay').classList.add('wl-hide');
        _updatePill(_loginStudentName);
        var btn = document.getElementById('wlLoginBtn');
        if (btn) btn.style.display = 'none';
        var cb = _onLoginCallback;
        _loginClassId = null; _loginStudentId = null; _loginStudentName = null;
        if (cb) cb();
      } catch(e) {
        if (err) err.textContent = 'Error \u2014 try again.';
        if (inp) inp.disabled = false;
      }
    })();
  }

  // Legacy stubs — kept for backward compat with any direct callers
  function _loadStudents() { /* replaced by new step flow */ }
  function _pick(studentId, studentName, classId) {
    _loginClassId = classId;
    _pickStudent(studentId, studentName);
  }

  var AUDIO_PREF_KEY = 'wordlab_sound_v1';

  function _isAudioOn() {
    try { return localStorage.getItem(AUDIO_PREF_KEY) === 'on'; } catch { return false; }
  }

  function _toggleAudio() {
    var newVal = !_isAudioOn();
    try { localStorage.setItem(AUDIO_PREF_KEY, newVal ? 'on' : 'off'); } catch {}
    if (window.WLAudio && window.WLAudio.setEnabled) window.WLAudio.setEnabled(newVal);
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
    var loginBtn = document.getElementById('wlLoginBtn');
    if (loginBtn) loginBtn.style.display = name ? 'none' : '';
    var on = _isAudioOn();
    var audioBtn =
      '<button id="wlAudioBtn" onclick="WordLabData._toggleAudio()"' +
      ' title="' + (on ? 'Sound on — click to mute' : 'Sound off — click to enable') + '"' +
      ' style="border:2px solid ' + (on ? '#c7d2fe' : '#e2e8f0') + ';background:' + (on ? '#eef2ff' : '#fff') + ';border-radius:999px;width:36px;height:36px;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s,border-color .15s;">' +
      (on ? '🔊' : '🔇') +
      '</button>';
    var studentPill = name
      ? '<span style="display:inline-flex;align-items:center;gap:0;background:#eef2ff;border:1px solid #c7d2fe;border-radius:999px;font-family:Lexend,sans-serif;">' +
          '<span style="padding:6px 4px 6px 14px;font-size:12px;font-weight:800;color:#4338ca;cursor:pointer;" onclick="wlShowLogin()">👤 ' + name + '</span>' +
          '<button onclick="WordLabData._logoutStudent()" title="Log out" style="background:none;border:none;cursor:pointer;padding:6px 10px 6px 4px;font-size:13px;color:#94a3b8;display:inline-flex;align-items:center;transition:color .15s;" onmouseover="this.style.color=\'#dc2626\'" onmouseout="this.style.color=\'#94a3b8\'">✕</button>' +
        '</span>'
      : '';
    slot.style.display = 'inline-flex';
    slot.style.alignItems = 'center';
    slot.style.gap = '6px';
    slot.innerHTML = audioBtn + studentPill;
  }

  function _skip() {
    document.getElementById('wlOverlay').classList.add('wl-hide');
    // On the landing page, scroll to the activities section so the guest can find games
    var trySection = document.querySelector('.play-hub-container');
    if (trySection) {
      setTimeout(function(){ trySection.scrollIntoView({behavior:'smooth', block:'center'}); }, 300);
    }
  }

  function _logoutStudent() {
    endSession();
    sessionStorage.removeItem('wl_extension_mode');
    sessionStorage.removeItem('wl_ext_pinned');
    sessionStorage.removeItem('wl_teacher_preview');
    _updatePill(null);
    var btn = document.getElementById('wlLoginBtn');
    if (btn) { btn.style.display = ''; btn.textContent = '👤 Log in'; }
    window.location.reload();
  }

  // ── Crown Leader ──────────────────────────────────────────────
  async function getClassLeader(classId) {
    try {
      var { data: students } = await sb()
        .from('students').select('id').eq('class_id', classId);
      if (!students || !students.length) return null;
      var studentIds = students.map(function(s){ return s.id; });
      var { data: chars } = await sb()
        .from('student_character').select('student_id, stats').in('student_id', studentIds);
      if (!chars || !chars.length) return null;
      var leader = null, maxCorrect = 0;
      chars.forEach(function(c) {
        var n = (c.stats && c.stats.totalCorrect) || 0;
        if (n > maxCorrect) { maxCorrect = n; leader = c.student_id; }
      });
      return leader;
    } catch(e) { console.warn('getClassLeader failed', e); return null; }
  }

  async function getClassCrownEnabled(classId) {
    try {
      var { data, error } = await sb()
        .from('classes').select('settings').eq('id', classId).maybeSingle();
      if (!error && data && data.settings) return !!data.settings.crownEnabled;
    } catch {}
    try { return !!JSON.parse(localStorage.getItem('wl_crown_' + classId)); } catch {}
    return false;
  }

  async function setClassCrownEnabled(classId, enabled) {
    try {
      var { data: existing, error: fetchErr } = await sb()
        .from('classes').select('settings').eq('id', classId).maybeSingle();
      if (!fetchErr) {
        var settings = (existing && existing.settings) ? Object.assign({}, existing.settings) : {};
        settings.crownEnabled = enabled;
        await sb().from('classes').update({ settings: settings }).eq('id', classId);
      }
    } catch {}
    try { localStorage.setItem('wl_crown_' + classId, JSON.stringify(enabled)); } catch {}
  }

  // ── Teacher IDs ───────────────────────────────────────────────
  async function getClassTeacherIds(classId) {
    try {
      var { data, error } = await sb()
        .from('classes').select('settings').eq('id', classId).maybeSingle();
      if (!error && data && data.settings && data.settings.teacherIds) {
        return data.settings.teacherIds;
      }
    } catch {}
    return [];
  }

  async function isStudentTeacher(classId, studentId) {
    if (!classId || !studentId) return false;
    const ids = await getClassTeacherIds(classId);
    return ids.includes(studentId);
  }

  async function setStudentTeacher(classId, studentId, isTeacher) {
    try {
      var { data: existing, error: fetchErr } = await sb()
        .from('classes').select('settings').eq('id', classId).maybeSingle();
      if (!fetchErr) {
        var settings = (existing && existing.settings) ? Object.assign({}, existing.settings) : {};
        var ids = settings.teacherIds || [];
        if (isTeacher && !ids.includes(studentId)) ids = ids.concat([studentId]);
        if (!isTeacher) ids = ids.filter(function(id){ return id !== studentId; });
        settings.teacherIds = ids;
        await sb().from('classes').update({ settings: settings }).eq('id', classId);
      }
    } catch(e) { console.warn('setStudentTeacher failed', e); }
  }

  // ── Teacher-as-Student helpers ──────────────────────────────
  async function createTeacherStudent(classId, gameName) {
    var { data: existing } = await sb()
      .from('students').select('student_code').eq('class_id', classId);
    var existingCodes = (existing || []).map(function(s){ return s.student_code; });
    var code = generateStudentCode(existingCodes);
    var { data: row, error: insErr } = await sb()
      .from('students')
      .insert({ class_id: classId, name: gameName, student_code: code, extension_mode: false })
      .select('id')
      .single();
    if (insErr) throw insErr;
    var newStudentId = row.id;
    await setStudentTeacher(classId, newStudentId, true);
    try {
      localStorage.setItem('wl_teacher_student_' + classId, JSON.stringify({
        studentId: newStudentId, studentName: gameName, studentCode: code
      }));
    } catch(e) {}
    return { studentId: newStudentId, studentCode: code };
  }

  async function getTeacherStudent(classId) {
    // 1. Check localStorage cache
    try {
      var cached = localStorage.getItem('wl_teacher_student_' + classId);
      if (cached) {
        var info = JSON.parse(cached);
        var { data: row } = await sb()
          .from('students').select('id, name, student_code')
          .eq('id', info.studentId).maybeSingle();
        if (row) {
          return { studentId: row.id, studentName: row.name, studentCode: row.student_code };
        }
        // Cached student no longer exists — remove stale cache
        localStorage.removeItem('wl_teacher_student_' + classId);
      }
    } catch(e) {}
    // 2. Check if any student in class is in the teacherIds list
    var teacherIds = await getClassTeacherIds(classId);
    if (teacherIds.length === 0) return null;
    var { data: students } = await sb()
      .from('students').select('id, name, student_code').eq('class_id', classId);
    if (!students) return null;
    for (var i = 0; i < students.length; i++) {
      if (teacherIds.includes(students[i].id)) {
        var found = { studentId: students[i].id, studentName: students[i].name, studentCode: students[i].student_code };
        try {
          localStorage.setItem('wl_teacher_student_' + classId, JSON.stringify(found));
        } catch(e) {}
        return found;
      }
    }
    return null;
  }

  async function enterStudentMode(classId) {
    var ts = await getTeacherStudent(classId);
    if (!ts) return false;
    await startSession(classId, ts.studentId, ts.studentName);
    try { sessionStorage.setItem('wl_teacher_preview', 'true'); } catch(e) {}
    return true;
  }

  function exitStudentMode() {
    endSession();
    try { sessionStorage.removeItem('wl_teacher_preview'); } catch(e) {}
    return true;
  }

  function isTeacherPreview() {
    return sessionStorage.getItem('wl_teacher_preview') === 'true';
  }

  // Single-write: merges all settings fields at once — no race condition
  async function saveClassSettings(classId, updates) {
    var { data: existing, error: fetchErr } = await sb()
      .from('classes').select('settings').eq('id', classId).maybeSingle();
    if (fetchErr) throw new Error('Read failed: ' + fetchErr.message);
    var settings = (existing && existing.settings) ? Object.assign({}, existing.settings) : {};
    Object.assign(settings, updates);
    var { data: updated, error: updateErr } = await sb()
      .from('classes').update({ settings: settings }).eq('id', classId).select('id');
    if (updateErr) throw new Error('Save failed: ' + updateErr.message);
    if (!updated || updated.length === 0) throw new Error('No rows updated — check Supabase RLS policies allow UPDATE on the classes table');
  }

  // ── Daily usage limits (free tier) ───────────────────────────
  const FREE_DAILY_LIMIT = 30;

  async function checkDailyLimit() {
    const session = loadSession();
    if (!session) return { blocked: false, count: 0 };
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [usageResult, clsResult] = await Promise.all([
        sb().from('daily_usage').select('question_count')
          .eq('student_id', session.studentId).eq('usage_date', today).maybeSingle(),
        sb().from('classes').select('teacher_account_id')
          .eq('id', session.classId).maybeSingle()
      ]);
      const count = (usageResult.data && usageResult.data.question_count) || 0;
      const cls = clsResult.data;
      if (cls && cls.teacher_account_id) {
        const { data: teacher } = await sb()
          .from('teacher_accounts')
          .select('tier')
          .eq('id', cls.teacher_account_id)
          .maybeSingle();
        if (teacher && teacher.tier !== 'free') {
          return { blocked: false, count: count };
        }
      }
      return { blocked: count >= FREE_DAILY_LIMIT, count: count };
    } catch(e) {
      console.warn('checkDailyLimit error', e);
      return { blocked: false, count: 0 };
    }
  }

  async function incrementDailyUsage() {
    const session = loadSession();
    if (!session) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await sb()
        .from('daily_usage')
        .select('id, question_count')
        .eq('student_id', session.studentId)
        .eq('usage_date', today)
        .maybeSingle();
      if (existing) {
        await sb().from('daily_usage').update({
          question_count: (existing.question_count || 0) + 1,
          updated_at: new Date().toISOString()
        }).eq('id', existing.id);
      } else {
        await sb().from('daily_usage').insert({
          student_id: session.studentId,
          usage_date: today,
          question_count: 1,
          activity_count: 1
        });
      }
    } catch(e) { console.warn('incrementDailyUsage error', e); }
  }

  // ── Custom word lists loader ────────────────────────────────
  // Returns words from teacher-created lists filtered by game and student assignment
  let _customWordsCache = null;
  async function getCustomWords(gameName) {
    var session = getSession();
    if (!session) return [];
    try {
      // Cache all lists for this class on first call
      if (!_customWordsCache) {
        var { data: lists } = await sb().from('class_word_lists')
          .select('id, words, games')
          .eq('class_id', session.classId);
        if (!lists || lists.length === 0) { _customWordsCache = []; return []; }

        // Check assignments for each list
        var listIds = lists.map(function(l) { return l.id; });
        var { data: assignments } = await sb().from('word_list_assignments')
          .select('word_list_id, student_id')
          .in('word_list_id', listIds);
        var assignMap = {};
        (assignments || []).forEach(function(a) {
          if (!assignMap[a.word_list_id]) assignMap[a.word_list_id] = [];
          assignMap[a.word_list_id].push(a.student_id);
        });

        // Flatten all words with their game tags, filtering by student assignment
        _customWordsCache = [];
        lists.forEach(function(list) {
          var assigned = assignMap[list.id];
          // If list has specific assignments and this student isn't in them, skip
          if (assigned && assigned.length > 0 && assigned.indexOf(session.studentId) === -1) return;
          var games = list.games || ['breakdown'];
          (list.words || []).forEach(function(w) {
            w._games = games;
            _customWordsCache.push(w);
          });
        });
      }

      // Filter for requested game
      return _customWordsCache.filter(function(w) {
        return w._games && w._games.indexOf(gameName) !== -1;
      });
    } catch(e) {
      console.warn('getCustomWords error:', e);
      return [];
    }
  }

  // ── Lazy-load extension data ────────────────────────────────
  let _extLoaded = false;
  let _extLoading = null;
  function loadExtensionData() {
    if (_extLoaded || window.WL_EXTENSION) { _extLoaded = true; return Promise.resolve(); }
    if (_extLoading) return _extLoading;
    _extLoading = new Promise(function(resolve) {
      var s = document.createElement('script');
      s.src = 'wordlab-extension-data.js';
      s.onload = function() { _extLoaded = true; resolve(); };
      s.onerror = function() { console.warn('Failed to load extension data'); resolve(); };
      document.head.appendChild(s);
    });
    return _extLoading;
  }

  return {
    getTeacherSession, getTeacherRecord, requireTeacherAuth, teacherSignOut, _sb: sb,
    createClass, getClasses, getClass, verifyPassword,
    addStudent, addStudentsBulk, removeStudent, deleteClass, regenerateStudentCode,
    lookupClassByCode, verifyStudentCode,
    startSession, getSession, endSession,
    recordAttempt,
    getAccuracy, getAvgTime, isIntervention,
    exportCSV, initLoginUI,
    _loadStudents, _pick, _pickStudent, _stepClassCode, _stepStudentCode,
    _backToStep1, _backToStep2, _skip, _toggleAudio, _logoutStudent,
    getStudentData, getLevel, ALL_BADGES, LEGENDARY_BADGES,
    getScientist, saveScientist, purchase,
    getClassLeader, getClassCrownEnabled, setClassCrownEnabled,
    getClassTeacherIds, isStudentTeacher, setStudentTeacher, saveClassSettings,
    createTeacherStudent, getTeacherStudent, enterStudentMode, exitStudentMode, isTeacherPreview,
    isExtensionMode, loadExtensionData,
    checkDailyLimit, incrementDailyUsage,
    getCustomWords
  };

})();

// ── Offline / connection detection ────────────────────────────
(function() {
  var banner = null;
  function showOffline() {
    if (banner) return;
    banner = document.createElement('div');
    banner.id = 'wlOfflineBanner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#dc2626;color:#fff;text-align:center;padding:10px 16px;font-family:Lexend,sans-serif;font-size:13px;font-weight:700;';
    banner.textContent = 'No internet connection — some features may not work until you reconnect.';
    document.body.appendChild(banner);
  }
  function hideOffline() {
    if (banner) { banner.remove(); banner = null; }
  }
  window.addEventListener('offline', showOffline);
  window.addEventListener('online', hideOffline);
  if (!navigator.onLine) showOffline();
})();

// Auto-load extension data if student is in extension mode.
// Uses document.write during initial page parse so it loads synchronously
// (same as the old static <script> tag, but only when needed).
if (sessionStorage.getItem('wl_extension_mode') === 'true') {
  document.write('<script src="wordlab-extension-data.js"><\/script>');
}
