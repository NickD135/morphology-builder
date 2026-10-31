// ═══════════════════════════════════════════════════════════════
// WORD LAB — Shared Data Layer v4 (Supabase)
// ═══════════════════════════════════════════════════════════════

const WordLabData = (() => {

  const SUPABASE_URL  = 'https://kdpavfrzmmzknqfpodrl.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcGF2ZnJ6bW16a25xZnBvZHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjgzOTIsImV4cCI6MjA5MDAwNDM5Mn0.n5fe7HvXWMsM4xN_iaU_N4xLkC5xD4y9Uoer_DG-dlg';
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

  // ── Supabase retry wrapper ───────────────────────────────────
  // Wraps a Supabase query builder or RPC call with retry-on-transient-failure.
  // Only retries errors that are likely to succeed on a second attempt:
  //   - Raw network/fetch failures (flaky wifi, brief DNS hiccup, edge restart)
  //   - HTTP 5xx responses from Supabase
  //   - PostgREST transient error codes
  // Never retries:
  //   - 4xx errors (auth, validation, not found — retrying won't help)
  //   - Offline state (detected via navigator.onLine — fast-fail)
  //   - The final attempt (always propagates the last error)
  //
  // Caller pattern:
  //   const { data, error } = await sbCall(() => sb().from('students').select('*').eq(...));
  //
  // Safe for: reads, atomic RPCs, idempotent writes with server-side dedup.
  // NOT safe for: client-composed .insert() / .update() without idempotency keys,
  // where a partial success followed by a retry could duplicate rows.
  function _sbIsTransient(err) {
    if (!err) return false;
    // Offline: retry is futile
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
    // Raw fetch errors throw TypeError
    if (typeof TypeError !== 'undefined' && err instanceof TypeError) return true;
    const msg = String(err.message || '').toLowerCase();
    if (msg.indexOf('fetch') !== -1) return true;
    if (msg.indexOf('network') !== -1) return true;
    if (msg.indexOf('timeout') !== -1) return true;
    if (msg.indexOf('timed out') !== -1) return true;
    if (msg.indexOf('econnreset') !== -1) return true;
    // HTTP status (Supabase JS client surfaces this on some error paths)
    const status = err.status || (err.code && /^\d+$/.test(String(err.code)) ? parseInt(err.code, 10) : null);
    if (status !== null && status >= 500 && status < 600) return true;
    // PostgREST occasional transient — connection exhausted, statement timeout
    if (err.code === '57014' || err.code === '57P03' || err.code === '08006') return true;
    return false;
  }
  function _sbSleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }
  async function sbCall(builderFn, opts) {
    opts = opts || {};
    const maxAttempts = opts.maxAttempts || 3;
    const baseDelay = opts.baseDelay || 300;
    let lastErr;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await builderFn();
        // Supabase returns errors in the .error field rather than throwing.
        // If it's a transient error and we have retries left, back off and try again.
        if (result && result.error && _sbIsTransient(result.error) && attempt < maxAttempts - 1) {
          await _sbSleep(baseDelay * Math.pow(3, attempt));
          continue;
        }
        return result;
      } catch (e) {
        lastErr = e;
        if (!_sbIsTransient(e) || attempt === maxAttempts - 1) throw e;
        await _sbSleep(baseDelay * Math.pow(3, attempt));
      }
    }
    throw lastErr;
  }

  // Fetch every row of a query, paging past PostgREST's server-side row cap
  // (responses are capped at ~1000 rows regardless of .limit(), which silently
  // dropped whole students' progress on busy classes). makeRangeQuery(from,to)
  // must return a query builder with a stable .order() applied.
  async function sbFetchAllRows(makeRangeQuery, pageSize) {
    pageSize = pageSize || 1000;
    var out = [], from = 0;
    for (;;) {
      var res = await sbCall(function() { return makeRangeQuery(from, from + pageSize - 1); });
      if (res && res.error) throw res.error;
      var data = (res && res.data) || [];
      out = out.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return out;
  }

  // ── HTML escaping (XSS prevention) ───────────────────────────
  const _ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) { return _ESC_MAP[c]; }); }

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
    {id:'variety_5',       label:'Explorer',             icon:'🧭',  desc:'Play 5 different games in one week'},
    {id:'variety_8',       label:'Adventurer',           icon:'🗺️', desc:'Play 8 different games in one week'},
    {id:'variety_11',      label:'Grand Explorer',       icon:'🏅',  desc:'Play all 11 games in one week'},
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
    // ── Daily play streaks ──
    {id:'day_streak_3',    label:'Three-Day Streak',     icon:'📅',  desc:'Play 10+ minutes for 3 days in a row'},
    {id:'day_streak_7',    label:'Week Warrior',         icon:'🗓️',  desc:'Play 10+ minutes for 7 days in a row'},
    {id:'day_streak_14',   label:'Fortnight Focus',      icon:'🔥',  desc:'Play 10+ minutes for 14 days in a row'},
    {id:'day_streak_30',   label:'Monthly Champion',     icon:'🏅',  desc:'Play 10+ minutes for 30 days in a row'},
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
  // ── Student session token ─────────────────────────────────────
  // verify_student_login (and teacher_student_token for "View as Student") hand back
  // a secret token that lives in the session. Every student save sends it and the
  // database works out who the student is from it. Sessions from before the update
  // have no token and use the old calls until the student logs in again.
  var _pendingLogin = null;      // { studentId, token } between verifyStudentCode and startSession
  var _expiredHandled = false;
  function _sessionToken() {
    var s = loadSession();
    if (s && s.token) return s.token;
    // Between verifyStudentCode and startSession (loadSupportMode runs there)
    return (_pendingLogin && _pendingLogin.token) || null;
  }
  function _isMissingFn(err) {
    return !!err && (err.code === 'PGRST202' || err.code === '42883' ||
      /could not find the function/i.test(String(err.message || '')));
  }
  function _isSessionErr(err) {
    return !!err && /student_session_expired/.test(String(err.message || '') + ' ' + String(err.details || ''));
  }
  function _isPermErr(err) {
    return !!err && (err.code === '42501' || /permission denied|row-level security/i.test(String(err.message || '')));
  }
  // The login has run out (or was ended elsewhere): back to the login screen with a
  // short message, instead of quietly losing the student's work.
  function _sessionExpired() {
    if (_expiredHandled) return;
    _expiredHandled = true;
    var preview = isTeacherPreview();
    endSession(true);
    ['wl_extension_mode', 'wl_extension_activities', 'wl_stage', 'wl_stage_overrides', 'wl_ext_pinned',
     'wl_teacher_preview', 'wl_eald_language', 'wl_low_stim', 'wl_support_mode'].forEach(function(k) {
      try { sessionStorage.removeItem(k); } catch (e) {}
    });
    if (!preview) {
      try { sessionStorage.setItem('wl_login_msg', 'Your login has timed out. Please log in again so your work saves.'); } catch (e) {}
    }
    try { window.location.href = 'landing.html'; } catch (e) {}
  }
  // One student save. With a token: the token function (falls back to the old call only
  // if the database hasn't been updated yet). Without a token (logged in before the
  // update): the old call; if the database now refuses it, the student logs in again.
  async function _studentWrite(rpcName, args, legacy, opts) {
    opts = opts || {};
    var token = _sessionToken();
    var run = function(fn) { return opts.retry ? sbCall(fn) : fn(); };
    if (token) {
      var res = await run(function() { return sb().rpc(rpcName, Object.assign({ p_token: token }, args)); });
      if (res && res.error) {
        if (_isSessionErr(res.error)) { _sessionExpired(); return res; }
        if (_isMissingFn(res.error) && legacy) {
          var lr = await run(legacy);
          if (lr && lr.error && _isPermErr(lr.error)) _sessionExpired();
          return lr;
        }
      }
      return res;
    }
    if (!legacy) return { data: null, error: null };
    var r = await run(legacy);
    if (r && r.error && _isPermErr(r.error)) _sessionExpired();
    return r;
  }
  // ── Student reads ─────────────────────────────────────────────
  // Since close_student_reads.sql a student can't read the student tables directly:
  // every read of their own rows goes through student_session_read (token in, only
  // that student's rows out), the class leaderboard through student_class_roster and
  // the school's plan through get_school_public. Same fallbacks as _studentWrite: a
  // session without a token, or a database without the functions yet, uses the old
  // direct reads; once the reads are closed those are refused and the student logs
  // in again.
  var _studentRead = _studentWrite;
  // The old direct reads, shaped like student_session_read's result.
  async function _legacyRead(parts, studentId, classId) {
    var out = {}, err = null;
    var has = function(p) { return parts.indexOf(p) !== -1; };
    var keep = function(res) { if (res && res.error && !err) err = res.error; return res && !res.error ? res.data : null; };
    if (has('student')) {
      out.student = keep(await sb().from('students')
        .select('id, name, class_id, extension_mode, extension_activities, support_mode, eald_language, stage, stage_overrides, focus_words')
        .eq('id', studentId).maybeSingle());
    }
    if (has('character')) {
      out.character = keep(await sb().from('student_character')
        .select('student_id, quarks, xp, badges, scientist, stats').eq('student_id', studentId).maybeSingle());
    }
    if (has('class')) {
      out['class'] = classId ? keep(await sb().from('classes').select('id, name, class_code, settings, school_id').eq('id', classId).maybeSingle()) : null;
    }
    if (has('school')) {
      var cls = classId ? keep(await sb().from('classes').select('school_id').eq('id', classId).maybeSingle()) : null;
      out.school = cls && cls.school_id ? keep(await sb().from('schools').select('plan').eq('id', cls.school_id).maybeSingle()) : null;
    }
    if (has('progress')) {
      out.progress = keep(await sb().from('student_progress')
        .select('activity, category, correct, total, total_time, is_extension, updated_at').eq('student_id', studentId)) || [];
    }
    if (has('usage')) {
      var today = new Date().toISOString().slice(0, 10);
      var u = keep(await sb().from('daily_usage').select('question_count').eq('student_id', studentId).eq('usage_date', today).maybeSingle());
      out.usage = { question_count: (u && u.question_count) || 0 };
    }
    if (has('checkins')) {
      out.checkins = keep(await sb().from('spelling_check_in_results')
        .select('id, spelling_set_id, score, total, results, session_started_at, created_at')
        .eq('student_id', studentId).order('created_at', { ascending: false }).limit(5)) || [];
    }
    return { data: out, error: err };
  }
  // The logged-in student's own rows: { data: { student, character, class, school,
  // progress, usage, checkins }, error }. Only the parts asked for are filled.
  async function _sessionRead(parts, studentIdHint) {
    var session = loadSession();
    var studentId = (session && session.studentId) || studentIdHint;
    if (!studentId) return { data: null, error: null };
    var classId = session && session.classId;
    var r = await _studentRead('student_session_read', { p_parts: parts },
      function() { return _legacyRead(parts, studentId, classId); }, { retry: true });
    return r || { data: null, error: null };
  }
  // True only when the signed-in teacher's school has AI features switched on. Any problem counts as off.
  async function isAiEnabled() {
    try {
      var r = await sb().rpc('get_my_school_ai');
      return !r.error && r.data === true;
    } catch (e) { return false; }
  }
  // Plan status of the student's school ('active', 'trial', 'expired', ...), or null.
  async function getSchoolPlan() {
    var session = loadSession();
    if (!session) return null;
    try {
      if (session.classCode) {
        var r = await sbCall(function() { return sb().rpc('get_school_public', { p_class_code: session.classCode }); });
        if (r && !r.error) return (r.data && r.data.plan) || null;
        if (r && r.error && !_isMissingFn(r.error)) return null;
      }
      var sr = await _sessionRead(['school']);
      return (sr.data && sr.data.school && sr.data.school.plan) || null;
    } catch (e) { return null; }
  }
  // Class leaderboard for the logged-in student: [{ name, xp, total_correct, is_me }].
  // First names, XP and totals only; no ids.
  async function getClassRoster() {
    var session = loadSession();
    if (!session) return [];
    var r = await _studentRead('student_class_roster', {}, function() {
      return sb().from('students').select('id, name').eq('class_id', session.classId).then(function(sr) {
        if (sr.error || !sr.data) return { data: null, error: sr.error };
        var ids = sr.data.map(function(s) { return s.id; });
        return sb().from('student_character').select('student_id, xp, stats').in('student_id', ids).then(function(cr) {
          var m = {};
          (cr.data || []).forEach(function(c) { m[c.student_id] = c; });
          return { data: sr.data.map(function(s) {
            var c = m[s.id] || {};
            return { name: s.name, xp: c.xp || 0, total_correct: (c.stats && c.stats.totalCorrect) || 0, is_me: s.id === session.studentId };
          }), error: null };
        });
      });
    }, { retry: true });
    return (r && !r.error && Array.isArray(r.data)) ? r.data : [];
  }
  // Ends the token on the server. Resolves within 1.5 s whatever happens.
  function _revokeToken(token) {
    if (!token) return Promise.resolve();
    return new Promise(function(resolve) {
      var done = false;
      var finish = function() { if (!done) { done = true; resolve(); } };
      setTimeout(finish, 1500);
      try { Promise.resolve(sb().rpc('student_logout', { p_token: token })).then(finish, finish); } catch (e) { finish(); }
    });
  }

  function endSession(skipRevoke) {
    var revoke = Promise.resolve();
    try {
      var session = loadSession();
      var studentId = session ? session.studentId : null;
      if (session && session.token && skipRevoke !== true) revoke = _revokeToken(session.token);
      sessionStorage.removeItem(SESSION_KEY);
      // Clean up student-specific localStorage keys
      if (studentId) {
        var keysToRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key && key.indexOf(studentId) !== -1 && (
            key.indexOf('wl_challenges_') === 0 ||
            key.indexOf('wl_featured_') === 0 ||
            key.indexOf('wl_focus_game_') === 0 ||
            key.indexOf('wl_crown_') === 0 ||
            key.indexOf('wl_checkin_done_') === 0
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
      }
    } catch {}
    return revoke;
  }

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
      head:null, face:null, pet:null, background:'lab', effect:null, owned:[], customSlots:{}
    };
    if (typeof char.scientist.effect === 'undefined') char.scientist.effect = null;
    if (!char.scientist.customSlots) char.scientist.customSlots = {};
    if (!char.scientist.displayBadges) char.scientist.displayBadges = [];
    if (!char.scientist.dances) char.scientist.dances = {};
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
      {id:'variety_5',       ok: () => { try { var d = _loadChallengeData(student.student_id); return (d.weekGames||[]).length >= 5; } catch(e) { return false; } }},
      {id:'variety_8',       ok: () => { try { var d = _loadChallengeData(student.student_id); return (d.weekGames||[]).length >= 8; } catch(e) { return false; } }},
      {id:'variety_11',      ok: () => { try { var d = _loadChallengeData(student.student_id); return (d.weekGames||[]).length >= 11; } catch(e) { return false; } }},
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
      // Daily play streaks (read from localStorage challenge data)
      {id:'day_streak_3',    ok: () => { try { var d = _loadChallengeData(student.student_id); return d.streak && d.streak.count >= 3; } catch(e) { return false; } }},
      {id:'day_streak_7',    ok: () => { try { var d = _loadChallengeData(student.student_id); return d.streak && d.streak.count >= 7; } catch(e) { return false; } }},
      {id:'day_streak_14',   ok: () => { try { var d = _loadChallengeData(student.student_id); return d.streak && d.streak.count >= 14; } catch(e) { return false; } }},
      {id:'day_streak_30',   ok: () => { try { var d = _loadChallengeData(student.student_id); return d.streak && d.streak.count >= 30; } catch(e) { return false; } }},
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
  function _generateClassCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
    var code = '';
    for (var i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  async function createClass(name, password, classCode, students) {
    // Auto-generate a unique class code if not provided
    if (!classCode) {
      for (var attempts = 0; attempts < 10; attempts++) {
        classCode = _generateClassCode();
        var { data: dup } = await sb().from('classes').select('id').ilike('class_code', classCode).maybeSingle();
        if (!dup) break;
      }
    }
    // Check if class_code already taken (case-insensitive)
    var { data: existing } = await sb()
      .from('classes')
      .select('id')
      .ilike('class_code', classCode)
      .maybeSingle();
    if (existing) {
      throw { code: 'CLASS_CODE_TAKEN', message: 'That class code is already in use. Please try again.' };
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
      .select('id, school_id, email, plan, scientist')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();

    // Auto-create school + teacher record if missing (handles edge cases
    // where signup created the auth user but records weren't created yet).
    // Done on the server: joining an existing school needs its invite code.
    if (!data) {
      try {
        var _meta = session.user.user_metadata || {};
        var _ens = await sb().rpc('ensure_my_school', {
          p_school_name: _meta.school_name || 'My School',
          p_postcode: _meta.school_postcode || null,
          p_invite_code: _meta.join_invite_code || null
        });
        if (_ens.error) console.warn('ensure_my_school failed:', _ens.error);
        else if (_ens.data && _ens.data.error) console.warn('ensure_my_school:', _ens.data.error);
        var { data: newTeacher } = await sb()
          .from('teachers')
          .select('id, school_id, email, plan, scientist')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
        data = newTeacher;
      } catch (e) {
        console.warn('Auto-create school/teacher failed:', e);
      }
    }

    _teacherRecord = data || null;
    return _teacherRecord;
  }

  // Student login codes are not readable through the API (2026-10-19 hardening).
  // Teachers get their own school's codes from the get_my_student_codes RPC.
  // classIds: one class id, or an array of them. Returns { studentId: code }.
  // strict=true throws instead of returning {} (used before writing new codes,
  // so a failed lookup can never produce duplicate codes in a class).
  function _rpcMissing(err) {
    return !!err && (err.code === 'PGRST202' || /could not find the function|does not exist/i.test(String(err.message || '')));
  }
  async function _studentCodeMap(classIds, strict) {
    var ids = Array.isArray(classIds) ? classIds : (classIds ? [classIds] : []);
    var m = {};
    var r = await sb().rpc('get_my_student_codes', ids.length === 1 ? { p_class_id: ids[0] } : {});
    if (r.error && _rpcMissing(r.error) && ids.length) {
      // Database not updated yet (migration security_hardening_2026_10_19.sql):
      // codes are still readable directly. Remove this fallback once it has run.
      r = await sb().from('students').select('id, class_id, student_code').in('class_id', ids);
    }
    if (r.error) {
      console.warn('get_my_student_codes failed', r.error);
      if (strict) throw new Error('Could not load the class\'s existing login codes. Please try again.');
      return m;
    }
    (r.data || []).forEach(function(x) {
      if (!ids.length || ids.indexOf(x.class_id) !== -1) m[x.id] = x.student_code || '';
    });
    return m;
  }

  // The classes this teacher is on. null means the database has no class_teachers table yet.
  async function _myClassIds(authUserId) {
    var { data, error } = await sb().from('class_teachers').select('class_id').eq('auth_user_id', authUserId);
    if (error) return null;
    return (data || []).map(function(r) { return r.class_id; });
  }

  // Teachers on a class (class_membership_part1.sql). Each one is refused on the server unless the
  // caller is on the class, and only teachers from the class's own school can be added.
  async function getClassTeachers(classId) {
    var { data, error } = await sb().rpc('class_teacher_list', { p_class_id: classId });
    if (error) throw error;
    return data || [];
  }
  async function getClassTeacherCandidates(classId) {
    var { data, error } = await sb().rpc('class_teacher_candidates', { p_class_id: classId });
    if (error) throw error;
    return data || [];
  }
  async function getClassTeacherHistory(classId) {
    var { data, error } = await sb().rpc('class_teacher_history', { p_class_id: classId });
    if (error) throw error;
    return data || [];
  }
  async function addClassTeacher(classId, authUserId) {
    var { data, error } = await sb().rpc('class_teacher_add', { p_class_id: classId, p_auth_user_id: authUserId });
    if (error) throw error;
    return data || {};
  }
  async function removeClassTeacher(classId, authUserId) {
    var { data, error } = await sb().rpc('class_teacher_remove', { p_class_id: classId, p_auth_user_id: authUserId });
    if (error) throw error;
    return data || {};
  }

  async function getClasses() {
    const { data: { session: _sess } } = await sb().auth.getSession();
    let query = sb()
      .from('classes')
      .select('id, name, class_code, created_at, students!students_class_id_fkey(id, name, extension_mode, eald_language, support_mode)')
      .order('name');
    if (_sess) {
      const teacher = await getTeacherRecord();
      const _mine = await _myClassIds(_sess.user.id);
      if (_mine) {
        query = query.in('id', _mine);
      } else if (teacher?.school_id) {
        // Database without class_membership_part1.sql
        query = query.eq('school_id', teacher.school_id);
      } else {
        // Fallback for accounts without a school record yet
        query = query.eq('auth_user_id', _sess.user.id);
      }
    }
    var { data, error } = await query;
    if (error) throw error;
    var _codes = _sess ? await _studentCodeMap((data || []).map(function(c) { return c.id; })) : {};
    return (data || []).map(function(c) {
      return {
        id: c.id,
        name: c.name,
        class_code: c.class_code || '',
        created: new Date(c.created_at).getTime(),
        students: (c.students || []).map(function(s) { return { id: s.id, name: s.name, student_code: _codes[s.id] || '', extension_mode: !!s.extension_mode, eald_language: s.eald_language || null, support_mode: !!s.support_mode }; })
      };
    });
  }

  async function getClass(id) {
    const { data: cls, error: clsErr } = await sbCall(() => sb()
      .from('classes')
      .select('id, name, teacher_password, created_at')
      .eq('id', id)
      .single());
    if (clsErr) throw clsErr;

    var { data: studs, error: stuErr } = await sbCall(() => sb()
      .from('students')
      .select('id, name, extension_mode, eald_language, support_mode')
      .eq('class_id', id)
      .order('name'));
    if (stuErr) throw stuErr;
    var _codes = await _studentCodeMap(id);
    (studs || []).forEach(function(s) { s.student_code = _codes[s.id] || ''; });
    // Load extension_activities separately (column may not be in PostgREST schema cache yet)
    try {
      var _extActRes = await sb().from('students').select('id, extension_activities').eq('class_id', id);
      if (_extActRes && !_extActRes.error && _extActRes.data) {
        var extMap = {};
        _extActRes.data.forEach(function(s) { extMap[s.id] = s.extension_activities; });
        studs.forEach(function(s) { s.extension_activities = extMap[s.id] || []; });
      }
    } catch(e) { /* column not available yet */ }
    // Load stage fields separately for the same schema-cache reason
    try {
      var _stageRes = await sb().from('students').select('id, stage, stage_overrides').eq('class_id', id);
      if (_stageRes && !_stageRes.error && _stageRes.data) {
        var stageMap = {};
        _stageRes.data.forEach(function(s) { stageMap[s.id] = s; });
        studs.forEach(function(s) {
          var row = stageMap[s.id];
          s.stage = row ? (row.stage || null) : null;
          s.stage_overrides = row ? (row.stage_overrides || {}) : {};
        });
      }
    } catch(e) { /* columns not available yet */ }

    const studentIds = (studs || []).map(s => s.id);
    let progressRows = [];
    let charRows = [];

    if (studentIds.length) {
      // PostgREST caps responses at ~1000 rows regardless of .limit(), so a busy
      // class (8000+ progress rows) must be paged through or whole students are
      // silently dropped from the dashboard. Page with .range() until exhausted.
      const [charResult, allProgress] = await Promise.all([
        sbCall(() => sb().from('student_character')
          .select('student_id, quarks, xp, badges, scientist, stats')
          .in('student_id', studentIds)),
        sbFetchAllRows(function(from, to) {
          return sb().from('student_progress')
            .select('student_id, activity, category, correct, total, total_time, updated_at, is_extension')
            .in('student_id', studentIds)
            .order('student_id')
            .range(from, to);
        })
      ]);
      if (charResult.error) throw charResult.error;
      charRows = charResult.data || [];
      progressRows = allProgress;
    }

    const charMap = {};
    charRows.forEach(c => { charMap[c.student_id] = c; });

    const progressMap = {};
    const lastActiveMap = {};
    progressRows.forEach(row => {
      // Progress keys end up in dashboard headers and titles; skip anything that could carry markup.
      if (/[<>"`]/.test(String(row.activity)) || /[<>"`]/.test(String(row.category))) return;
      // Track last active from ALL rows (base + extension)
      if (row.updated_at) {
        var ts = new Date(row.updated_at).getTime();
        if (!lastActiveMap[row.student_id] || ts > lastActiveMap[row.student_id]) {
          lastActiveMap[row.student_id] = ts;
        }
      }
      // Only include base (non-extension) data in student.results
      // Extension data is loaded separately by the dashboard
      if (row.is_extension) return;
      if (!progressMap[row.student_id]) progressMap[row.student_id] = {};
      if (!progressMap[row.student_id][row.activity]) progressMap[row.student_id][row.activity] = {};
      progressMap[row.student_id][row.activity][row.category] = {
        correct: row.correct,
        total: row.total,
        totalTime: row.total_time
      };
    });

    const students = (studs || []).map(s => ({
      id: s.id,
      name: s.name,
      student_code: s.student_code || '',
      extension_mode: !!s.extension_mode,
      extension_activities: s.extension_activities || [],
      eald_language: s.eald_language || null,
      support_mode: !!s.support_mode,
      stage: s.stage || null,
      stage_overrides: s.stage_overrides || {},
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
    var usedCodes = Object.values(await _studentCodeMap(classId, true));
    var code = generateStudentCode(usedCodes);
    var { error } = await sb().from('students').insert({ class_id: classId, name: name.trim(), student_code: code });
    if (error) throw error;
    return code;
  }

  async function addStudentsBulk(classId, names) {
    var usedCodes = Object.values(await _studentCodeMap(classId, true));
    var rows = names.map(function(n) {
      var code = generateStudentCode(usedCodes);
      usedCodes.push(code);
      return { class_id: classId, name: n.trim(), student_code: code };
    });
    var { data, error } = await sb().from('students').insert(rows).select('id, name');
    if (error) throw error;
    // Attach codes by student id (row order from the API isn't guaranteed).
    var _after = await _studentCodeMap(classId);
    return (data || []).map(function(r) { return { id: r.id, name: r.name, student_code: _after[r.id] || '' }; });
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
    const { error } = await sb().rpc('delete_class', { p_class_id: classId });
    if (error) throw error;
  }

  async function regenerateStudentCode(classId, studentId) {
    var _codes = await _studentCodeMap(classId, true);
    var usedCodes = Object.keys(_codes)
      .filter(function(id){ return id !== studentId; })
      .map(function(id){ return _codes[id] || ''; });
    var newCode = generateStudentCode(usedCodes);
    var res = await sb().from('students').update({ student_code: newCode }).eq('id', studentId).select('id');
    if (res.error) throw res.error;
    if (!res.data || !res.data.length) throw new Error("Couldn't change that code. Refresh the page and try again.");
    return newCode;
  }

  // Login step 1. get_class_public (guess-limited) is the only way a student reaches a
  // class by its code: anon can't read classes.class_code any more. The old direct read
  // is kept only for a database without the function yet.
  async function lookupClassByCode(code) {
    var classCode = String(code || '').trim().toUpperCase();
    if (!classCode) return null;
    try {
      var r = await sbCall(function() { return sb().rpc('get_class_public', { p_class_code: classCode }); });
      if (r && !r.error) {
        if (!r.data || !r.data.id) return null;
        return { id: r.data.id, name: r.data.name, class_code: classCode, plan: r.data.plan || null };
      }
      if (!_isMissingFn(r.error)) return null;
    } catch (e) { return null; }
    var { data } = await sb().from('classes').select('id, name').ilike('class_code', classCode).maybeSingle();
    if (!data) return null;
    return { id: data.id, name: data.name, class_code: classCode, plan: null };
  }

  async function verifyStudentCode(studentId, code, classId) {
    // Use server-side RPC to verify code — never exposes student_code to the client
    var { data, error } = await sb().rpc('verify_student_login', {
      p_class_id: classId,
      p_student_id: studentId,
      p_student_code: code
    });
    if (error || !data || !data.success) return { ok: false, extensionMode: false, ealdLanguage: null };
    // Kept until startSession for this student (the database only sends a token
    // once student_sessions_part1.sql has run).
    _pendingLogin = data.session_token ? { studentId: studentId, token: data.session_token } : null;
    return {
      ok: true,
      extensionMode: !!data.extension_mode,
      ealdLanguage: data.eald_language || null,
      token: data.session_token || null
    };
  }

  // Login step 3 by name + code: the roster carries no ids, the login itself returns
  // the student's id (and token). On a database without student_login_by_name the id is
  // looked up the old way and verify_student_login runs.
  async function verifyStudentByName(classId, name, code) {
    var fail = { ok: false, extensionMode: false, ealdLanguage: null };
    var r = await sb().rpc('student_login_by_name', { p_class_id: classId, p_name: name, p_student_code: code });
    if (r && r.error && _isMissingFn(r.error)) {
      var { data: rows } = await sb().from('students').select('id, name').eq('class_id', classId).ilike('name', String(name || '').trim());
      var hit = (rows || [])[0];
      if (!hit) return fail;
      var v = await verifyStudentCode(hit.id, code, classId);
      v.studentId = hit.id; v.name = hit.name;
      return v;
    }
    var data = r && r.data;
    if (!r || r.error || !data || !data.success) return Object.assign(fail, { reason: data && data.reason });
    _pendingLogin = data.session_token ? { studentId: data.student_id, token: data.session_token } : null;
    return {
      ok: true, studentId: data.student_id, name: data.name || name,
      extensionMode: !!data.extension_mode, ealdLanguage: data.eald_language || null,
      token: data.session_token || null
    };
  }

  // ── Session ───────────────────────────────────────────────────
  async function startSession(classId, studentId, studentName, token, classInfo) {
    if (!token && _pendingLogin && _pendingLogin.studentId === studentId) token = _pendingLogin.token;
    _pendingLogin = null;
    _expiredHandled = false;
    var sess = { classId, studentId, studentName, started: Date.now() };
    if (token) sess.token = token;
    // Class code (for get_school_public) and the plan seen at login, from lookupClassByCode
    if (classInfo && classInfo.class_code) sess.classCode = classInfo.class_code;
    if (classInfo && classInfo.plan) sess.schoolPlan = classInfo.plan;
    saveSession(sess);
    try {
      const cr = await _sessionRead(['character']);
      const charErr = cr.error;
      const existing = cr.data ? cr.data.character : null;
      // If the read errored, bail — don't overwrite existing data with blank defaults
      if (charErr) { console.warn('startSession character read failed', charErr); return; }
      const char = ensureCharFields(existing ? { ...existing } : { student_id: studentId });
      char.stats.sessions++;
      checkBadges(char);
      // Never write scientist here — saveScientist/purchase use their own atomic RPCs for that
      await _saveCharacter(studentId, char, false);
    } catch(e) { console.warn('startSession character update failed', e); }
  }

  // Quarks, XP, badges and stats (never the outfit). Token function, or the old
  // upsert for sessions without a token.
  function _saveCharacter(studentId, char, withUpdatedAt) {
    var badges = (char.badges || []).filter(function(b) { return typeof b === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(b); });
    var quarks = Math.max(0, Math.round(char.quarks || 0));
    var xp = Math.max(0, Math.round(char.xp || 0));
    return _studentWrite('student_save_character',
      { p_quarks: quarks, p_xp: xp, p_badges: badges, p_stats: char.stats || {} },
      function() {
        var row = { student_id: studentId, quarks: char.quarks, xp: char.xp, badges: char.badges, stats: char.stats };
        if (withUpdatedAt) row.updated_at = new Date().toISOString();
        return sb().from('student_character').upsert(row, { onConflict: 'student_id' });
      }).then(function(res) {
        if (res && res.error) console.warn('Character not saved:', res.error.message || res.error);
        return res;
      });
  }

  // ── Low-stim mode ─────────────────────────────────────────────
  // Suppresses sounds, animations, effects, gamification UI.
  // Set per-class by teacher in dashboard, stored in classes.settings.lowStimMode.
  function isLowStimMode() {
    return sessionStorage.getItem('wl_low_stim') === 'true';
  }

  // Load low-stim setting from class and store in sessionStorage.
  // Called after login and on page load.
  async function loadLowStimMode(classId) {
    classId = classId || (loadSession() || {}).classId;
    if (!classId) return false;
    try {
      var { data } = await sb().from('classes').select('settings').eq('id', classId).maybeSingle();
      var on = !!(data && data.settings && data.settings.lowStimMode);
      sessionStorage.setItem('wl_low_stim', on ? 'true' : 'false');
      _applyLowStimClass(on);
      return on;
    } catch(e) { return false; }
  }

  function _applyLowStimClass(on) {
    var targets = [document.documentElement, document.body].filter(Boolean);
    targets.forEach(function(el) {
      if (on) el.classList.add('low-stim');
      else el.classList.remove('low-stim');
    });
  }

  // ── Support mode ───────────────────────────────────────────────
  // Per-student scaffolding: slower timers, fewer options, hints, visual scaffolds.
  // Set by teacher in dashboard (stored in students.support_mode) or toggled by student.
  function isSupportMode() {
    return sessionStorage.getItem('wl_support_mode') === 'true';
  }

  function setSupportMode(on) {
    sessionStorage.setItem('wl_support_mode', on ? 'true' : 'false');
    _applySupportClass(on);
  }

  async function loadSupportMode(studentId) {
    studentId = studentId || (loadSession() || {}).studentId;
    if (!studentId) return false;
    try {
      var sr = await _sessionRead(['student'], studentId);
      var data = sr.data && sr.data.student;
      var on = !!(data && data.support_mode);
      sessionStorage.setItem('wl_support_mode', on ? 'true' : 'false');
      // Track whether teacher set it (so student can't disable)
      sessionStorage.setItem('wl_support_teacher', on ? 'true' : 'false');
      _applySupportClass(on);
      return on;
    } catch(e) { return false; }
  }

  function _applySupportClass(on) {
    var targets = [document.documentElement, document.body].filter(Boolean);
    targets.forEach(function(el) {
      if (on) el.classList.add('support-mode');
      else el.classList.remove('support-mode');
    });
  }

  // ── Extension mode ────────────────────────────────────────────
  // If activity is provided, checks per-activity extension.
  // extension_activities=[] means all activities (backward compatible).
  // extension_activities=['phoneme-splitter','root-lab'] means only those.
  //
  // Under the stage system, extension means "+1 stage": when this returns
  // true for an activity, content tagged with the next stage up becomes
  // visible via WLStage.visibleStages(baseStage, true). A Voyager with
  // extension on sees Explorer + Voyager + Wanderer content; a Pioneer
  // already at the top is unaffected. In games with difficulty tiers
  // (Sound Sorter, Phoneme Splitter, Root Lab) extension also locks the
  // tier selector to Challenge — see Task 21 and the game pages for
  // that wiring.
  function isExtensionMode(activity) {
    if (sessionStorage.getItem('wl_extension_mode') !== 'true') return false;
    if (!activity) return true; // global check
    var raw = sessionStorage.getItem('wl_extension_activities');
    if (!raw) return true; // no per-activity data = all
    try {
      var activities = JSON.parse(raw);
      if (!activities || !activities.length) return true; // empty = all
      return activities.indexOf(activity) !== -1;
    } catch(e) { return true; }
  }

  // ── Stage progression ─────────────────────────────────────────
  // Return the student's current stage for a given activity (or global if no activity)
  // Checks per-activity override first, then falls back to the student's base stage
  // Returns null if no stage set
  function getStudentStage(activity){
    var overridesRaw = sessionStorage.getItem('wl_stage_overrides');
    if (overridesRaw && activity) {
      try {
        var overrides = JSON.parse(overridesRaw);
        if (overrides && overrides[activity]) return overrides[activity];
      } catch(e){}
    }
    return sessionStorage.getItem('wl_stage') || null;
  }

  // Filter an array of items by the student's stage for a given activity.
  // Items must have a `stage` field (or null/undefined = untagged).
  // Returns a new array with items the student should see.
  // Untagged items (stage null/undefined) always pass. Students with no stage
  // set see everything (no filter applied).
  // Safety net: if filtering reduces the pool below MIN_POOL_SIZE, fall back to
  // the full input so games always have enough content to be playable.
  var MIN_POOL_SIZE = 5;
  function filterByStage(items, activity){
    if (!items || !items.length) return items;
    var stage = getStudentStage(activity);
    if (!stage) return items.slice(); // no stage set = show everything
    var ext = isExtensionMode(activity);
    var filtered = items.filter(function(it){
      return WLStage.isItemVisible(it.stage, stage, ext);
    });
    // Safety net: never return a pool so small that the game is unplayable
    if (filtered.length < MIN_POOL_SIZE && items.length >= MIN_POOL_SIZE) return items.slice();
    return filtered;
  }

  // Apply 80/20 head-weighting on top of stage filtering.
  // Items are filtered by stage first, then passed through WLStage.weightPool
  // so the first ~N items of the returned array are 80% current-stage and
  // 20% revision from below. Games should consume items from the front of
  // the returned array and NOT re-shuffle (that would discard the weighting).
  function weightByStage(items, activity){
    var filtered = filterByStage(items, activity);
    var stage = getStudentStage(activity);
    if (!stage) return filtered;
    var ext = isExtensionMode(activity);
    return WLStage.weightPool(filtered, stage, ext);
  }

  // Pick the next question in 80/20 stage order. Games that choose one item
  // at a time (Math.random over a pool) call this instead, so the weighting
  // from weightPool isn't thrown away. It keeps one weighted order per `slot`
  // (default: the activity) and walks it like a cursor: each call returns
  // the earliest item in that order that is in `pool` and not yet served this
  // cycle. When the current-stage part of the order is used up (or the pool
  // has items the order doesn't know about), it makes a fresh weighted order,
  // so long sessions keep the 80/20 mix. Never returns `avoid` (the item just
  // shown) unless it is the only choice.
  // `pool` can be a subset of earlier pools (e.g. with used words removed).
  // Returns null when the student has no stage: the game keeps its own random pick.
  var _stageCursors = {};
  function nextByStage(pool, activity, slot, avoid){
    if (!pool || !pool.length) return null;
    var stage = getStudentStage(activity);
    if (!stage || typeof WLStage === 'undefined') return null;
    var ext = isExtensionMode(activity);
    var key = slot || activity;
    var c = _stageCursors[key];
    function rebuild(keepOld){
      // A new cycle keeps items the game left out of this call's pool (e.g.
      // the word just shown), so they come back in the fresh order
      var items = pool;
      if (keepOld && c){
        var inPool = new Set(pool);
        items = pool.concat(Array.from(c.rank.keys()).filter(function(it){ return !inPool.has(it); }));
      }
      c = _stageCursors[key] = { rank: new Map(), head: 0, served: new Set() };
      WLStage.weightPool(items, stage, ext).forEach(function(it, i){
        if (!c.rank.has(it)) c.rank.set(it, i);
        if (it.stage == null || WLStage.isCurrentStage(it.stage, stage, ext)) c.head = i + 1;
      });
      // weightPool puts a revision item in every 5th slot; keep the one that
      // follows the last current-stage item so small pools still get it
      if (c.head % 5 === 4) c.head++;
      if (!c.head) c.head = Infinity; // nothing at this stage: just walk the order
    }
    function pick(useHead){
      var best = null, bestRank = Infinity;
      for (var i = 0; i < pool.length; i++){
        var it = pool[i], r = c.rank.get(it);
        if (c.served.has(it) || it === avoid) continue;
        if (useHead && r >= c.head) continue;
        if (r < bestRank){ bestRank = r; best = it; }
      }
      return best;
    }
    if (!c || pool.some(function(it){ return !c.rank.has(it); })) rebuild();
    var item = pick(true);
    if (!item){ rebuild(true); item = pick(true) || pick(false); }
    if (!item) item = pool[0] === avoid && pool.length > 1 ? pool[1] : pool[0];
    c.served.add(item);
    return item;
  }

  // Order a list for games that build their questions up front: 80/20 stage
  // order when the student has a stage, otherwise null (game shuffles as before).
  function orderByStage(items, activity){
    if (!getStudentStage(activity)) return null;
    return weightByStage(items, activity);
  }

  // ── Word corrections (teacher overrides) ─────────────────────
  // Games call getWordCorrections('phoneme') on load, then
  // applyCorrections(WORDS, corrections, 'word') to patch defaults.
  function _stripMarkupDeep(v) {
    if (typeof v === 'string') return v.replace(/[<>`]/g, '').replace(/javascript:/gi, '');
    if (Array.isArray(v)) return v.map(_stripMarkupDeep);
    if (v && typeof v === 'object') {
      var o = {};
      Object.keys(v).forEach(function(k) { if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype') o[k] = _stripMarkupDeep(v[k]); });
      return o;
    }
    return v;
  }

  async function getWordCorrections(game) {
    var cacheKey = 'wl_corrections_' + game;
    try {
      var cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < 300000) return parsed.data; // 5-min TTL
      }
    } catch(e) {}
    try {
      var result = await sb().from('word_corrections')
        .select('word_key, corrections')
        .eq('game', game);
      // Corrections are plain text (clues, splits, sentences). Games put some of it
      // straight into the page, so strip anything that could be markup.
      var data = (result.data || []).map(function(row) {
        return { word_key: row.word_key, corrections: _stripMarkupDeep(row.corrections) };
      });
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: data })); } catch(e) {}
      return data;
    } catch(e) {
      return []; // fallback: no corrections
    }
  }

  function applyCorrections(items, corrections, keyField) {
    if (!corrections || !corrections.length || !items || !items.length) return;
    var map = {};
    corrections.forEach(function(c) { map[c.word_key] = c.corrections; });
    items.forEach(function(item) {
      var fix = map[item[keyField]];
      if (!fix) return;
      Object.keys(fix).forEach(function(k) {
        // Handle array fields stored as strings (syllables, phonemes, etc.)
        var val = fix[k];
        if (typeof val === 'string' && Array.isArray(item[k])) {
          item[k] = val.split('·').map(function(s){ return s.trim(); });
        } else if (k === 'answers' && typeof val === 'object' && typeof item[k] === 'object') {
          Object.assign(item[k], val);
        } else {
          item[k] = val;
        }
      });
    });
  }

  // ── Record attempt ────────────────────────────────────────────
  async function recordAttempt(activity, category, correct, timeMs, streak) {
    streak = streak || 0;
    const session = loadSession();
    if (!session) return {};
    const studentId = session.studentId;

    // Atomic progress increment via Postgres RPC (no race condition)
    // and fetch character data in parallel. Both wrapped in sbCall for
    // retry on transient network failures — the RPC is atomic so retry
    // is safe, and the character fetch is a pure read.
    const _progArgs = {
      p_activity: activity,
      p_category: category,
      p_correct: !!correct,
      p_time_ms: timeMs || 0,
      p_is_extension: isExtensionMode()
    };
    const [_rpcResult, charResult] = await Promise.all([
      _studentWrite('increment_progress', _progArgs,
        () => sb().rpc('increment_progress', Object.assign({ p_student_id: studentId }, _progArgs)),
        { retry: true }),
      _sessionRead(['character'])
    ]);
    const existingChar = charResult.data ? charResult.data.character : null;
    const char = ensureCharFields(existingChar ? { ...existingChar } : { student_id: studentId });

    char.stats.totalAnswered++;
    if (correct) {
      char.stats.totalCorrect++;
      if (streak > (char.stats.bestStreak || 0)) char.stats.bestStreak = streak;
    }
    if (!char.stats.activitiesPlayed.includes(activity)) char.stats.activitiesPlayed.push(activity);

    let quarksEarned = 0, xpEarned = 0;
    var varietyBonus = 0, varietyXpBonus = 0, featuredBonus = false, dayBonus = false;
    // Per-activity reward scaling (default 1.0)
    var rewardScale = 1.0;
    if (activity === 'homophone-hunter' || activity === 'breakdown-blitz' || activity === 'word-spectrum') rewardScale = 0.5;
    if (correct) {
      quarksEarned = Math.round(2 * rewardScale);
      var streakBonus = 0;
      if (streak >= 10) streakBonus = 25;
      else if (streak >= 5) streakBonus = 10;
      else if (streak >= 3) streakBonus = 5;
      quarksEarned += Math.round(streakBonus * rewardScale);
      xpEarned = Math.round((10 + (streak >= 3 ? 5 : 0)) * rewardScale);

      // ── Variety bonus: reward playing different games today ──
      try {
        var chData = _loadChallengeData(studentId);
        var todayGames = chData.todayGames || [];
        if (todayGames.indexOf(activity) === -1) {
          var gamesCount = todayGames.length + 1;
          if (gamesCount >= 2) {
            varietyBonus = gamesCount * 5;
            varietyXpBonus = gamesCount * 5;
          }
        }
      } catch(e) {}

      // ── Featured Game: 2× quarks & XP ──
      // Teacher focus overrides auto-pick; both give the same 2x bonus
      try {
        var featured = getFeaturedGame();
        if (featured && activity === featured.key) {
          quarksEarned = quarksEarned * 2;
          xpEarned = xpEarned * 2;
          featuredBonus = true;
        }
      } catch(e) {}

      // ── Bonus day: weekends & Wednesdays ──
      var dayMult = getBonusDayMultiplier();
      if (dayMult.active) {
        quarksEarned = Math.round(quarksEarned * dayMult.quarkMult);
        xpEarned = Math.round(xpEarned * dayMult.xpMult);
        dayBonus = true;
      }

      quarksEarned += varietyBonus;
      xpEarned += varietyXpBonus;
      char.quarks += quarksEarned;
      char.xp += xpEarned;
    }

    const newBadges = checkBadges(char);
    // Don't include scientist — that field is only written by saveScientist/purchase (atomic RPCs)
    await _saveCharacter(studentId, char, true);

    // Track daily usage for free tier limits
    try { incrementDailyUsage(); } catch(e) {}

    // Update daily/weekly challenge progress
    var challengeResult = null;
    try { challengeResult = updateChallengeProgress(activity, correct, streak); } catch(e) {}

    // Show variety bonus toast (only on first answer in a new game)
    if (varietyBonus > 0) {
      try { _showBonusToast('🧭', 'Variety Bonus!', 'Playing a new game today', '+' + varietyBonus + ' quarks · +' + varietyXpBonus + ' XP', '#059669', '#d1fae5'); } catch(e) {}
    }
    // Show featured game toast (only on first correct answer)
    if (featuredBonus && streak <= 1) {
      try {
        var feat = getFeaturedGame();
        var featLabel = feat && feat.source === 'teacher' ? 'Teacher Focus — 2x Rewards!' : 'Featured Game — 2x Rewards!';
        var featSub = feat && feat.source === 'teacher' ? 'Your teacher boosted this game' : 'This game was picked for you';
        _showBonusToast('⭐', featLabel, featSub, 'Double quarks & XP', '#d97706', '#fef3c7');
      } catch(e) {}
    }
    // Show bonus day toast (only on first correct answer of the session)
    if (dayBonus && streak <= 1 && char.stats.totalCorrect <= 1) {
      var dayLabel = getBonusDayMultiplier().label || 'Bonus Day';
      try { _showBonusToast('🎉', dayLabel + ' Bonus!', '2x XP & 1.5x quarks today', 'Play more to earn extra rewards!', '#dc2626', '#fee2e2'); } catch(e) {}
    }

    return { quarks: char.quarks, xp: char.xp, quarksEarned, xpEarned, varietyBonus, featuredBonus, dayBonus, newBadges, level: getLevel(char.xp), challengeResult };
  }

  // ── Student data ──────────────────────────────────────────────
  async function getStudentData() {
    const session = loadSession();
    if (!session) return null;
    var [readResult, isTeacher] = await Promise.all([
      _sessionRead(['student', 'character']),
      isStudentTeacher(session.classId, session.studentId)
    ]);
    var stuResult = { data: readResult.data ? readResult.data.student : null };
    var charResult = { data: readResult.data ? readResult.data.character : null };
    const data = stuResult.data;
    if (data && data.extension_mode !== undefined) {
      if (!sessionStorage.getItem('wl_ext_pinned')) {
        sessionStorage.setItem('wl_extension_mode', data.extension_mode ? 'true' : 'false');
      }
    }
    if (data && data.extension_activities && data.extension_activities.length) {
      sessionStorage.setItem('wl_extension_activities', JSON.stringify(data.extension_activities));
    } else {
      sessionStorage.removeItem('wl_extension_activities');
    }
    // Cache stage + overrides in sessionStorage for quick access during gameplay
    if (data && data.stage !== undefined) {
      if (data.stage) {
        sessionStorage.setItem('wl_stage', data.stage);
      } else {
        sessionStorage.removeItem('wl_stage');
      }
    }
    if (data && data.stage_overrides) {
      sessionStorage.setItem('wl_stage_overrides', JSON.stringify(data.stage_overrides));
    } else {
      sessionStorage.removeItem('wl_stage_overrides');
    }
    if (data && data.eald_language) {
      sessionStorage.setItem('wl_eald_language', data.eald_language);
    }
    const char = ensureCharFields(charResult.data ? { ...charResult.data } : {});
    return {
      quarks: char.quarks, xp: char.xp, badges: char.badges,
      scientist: char.scientist, stats: char.stats,
      level: getLevel(char.xp), name: session.studentName,
      is_teacher: isTeacher,
      extension_mode: !!(data && data.extension_mode)
    };
  }

  async function getScientist() {
    const d = await getStudentData();
    return d ? d.scientist : null;
  }

  async function saveScientist(updates) {
    const session = loadSession();
    if (!session) return;
    const keys = Object.keys(updates);
    // For single-field updates, use atomic RPC to avoid read-modify-write race
    if (keys.length === 1) {
      const field = keys[0];
      const value = updates[field];
      try {
        const _a = { p_field: field, p_value: value === undefined ? null : value };
        const { error } = await _studentWrite('save_scientist_field', _a,
          () => sb().rpc('save_scientist_field', Object.assign({ p_student_id: session.studentId }, _a)));
        if (error) console.warn('save_scientist_field RPC error', error);
        _syncTeacherScientist(session, updates);
        return;
      } catch (e) {
        console.warn('save_scientist_field failed, falling back', e);
      }
    }
    // Multi-field update or RPC fallback: use sequential RPC calls per field
    // This is still better than read-modify-write since each field is set atomically
    try {
      for (const field of keys) {
        const _a = { p_field: field, p_value: updates[field] === undefined ? null : updates[field] };
        const { error } = await _studentWrite('save_scientist_field', _a,
          () => sb().rpc('save_scientist_field', Object.assign({ p_student_id: session.studentId }, _a)));
        if (error) console.warn('save_scientist_field error for', field, error);
      }
    } catch (e) {
      console.warn('saveScientist RPC fallback failed', e);
    }
    _syncTeacherScientist(session, updates);
  }

  // When a teacher customises their scientist in student preview mode,
  // mirror the changes to the teachers.scientist column so the dashboard
  // loading screen shows their personalised character.
  async function _syncTeacherScientist(session, updates) {
    // Sync to teacher record if this is a teacher in student preview mode
    // OR if there's an authenticated teacher session (covers edge cases)
    try {
      var { data: { session: authSess } } = await sb().auth.getSession();
      if (!authSess) return;
      var { data: teacher } = await sb().from('teachers')
        .select('id, scientist')
        .eq('auth_user_id', authSess.user.id)
        .maybeSingle();
      if (!teacher) return;
      var sci = teacher.scientist || {};
      Object.keys(updates).forEach(function(k) { sci[k] = updates[k]; });
      var { error } = await sb().from('teachers').update({ scientist: sci }).eq('id', teacher.id);
      if (error) console.warn('Teacher scientist update error:', error);
      if (_teacherRecord) _teacherRecord.scientist = sci;
    } catch(e) { console.warn('Teacher scientist sync failed:', e); }
  }

  async function purchase(itemId, cost) {
    const session = loadSession();
    if (!session) return { success: false, reason: 'No session' };
    try {
      const _a = { p_item_key: itemId, p_cost: cost };
      const { data, error } = await _studentWrite('atomic_purchase', _a,
        () => sb().rpc('atomic_purchase', Object.assign({ p_student_id: session.studentId }, _a)),
        { retry: true });
      if (error) {
        console.warn('atomic_purchase RPC error', error);
        return { success: false, reason: error.message };
      }
      return { success: data.success, quarks: data.quarks, reason: data.reason };
    } catch (e) {
      console.warn('purchase failed', e);
      return { success: false, reason: 'Purchase failed' };
    }
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
  var _loginClassInfo = null;   // { id, name, class_code, plan } from lookupClassByCode
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
      '.wl-back{color:#64748b;font-size:12px;font-weight:700;cursor:pointer;text-align:left;margin-bottom:16px;display:inline-block;}' +
      '.wl-back:hover{color:#475569;}' +
      '.wl-err{color:#dc2626;font-size:13px;font-weight:800;margin-bottom:10px;min-height:18px;}' +
      '.wl-skip{border:none;background:none;color:#64748b;font-size:12px;font-weight:700;cursor:pointer;text-decoration:underline;font-family:\'Lexend\',sans-serif;}' +
      '.wl-no{color:#64748b;font-size:13px;font-weight:700;padding:8px 0;}';
    document.head.appendChild(style);

    var ov = document.createElement('div');
    ov.id = 'wlOverlay';
    ov.className = 'wl-ov wl-hide';
    ov.innerHTML =
      '<div class="wl-box" style="position:relative;">' +
        '<button id="wlCloseBtn" onclick="document.getElementById(\'wlOverlay\').classList.add(\'wl-hide\')" style="position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:10px;border:2px solid #e2e8f0;background:#fff;cursor:pointer;font-size:16px;color:#64748b;display:flex;align-items:center;justify-content:center;font-family:Lexend,sans-serif;transition:all .15s;z-index:1;" onmouseover="this.style.background=\'#f1f5f9\';this.style.color=\'#475569\'" onmouseout="this.style.background=\'#fff\';this.style.color=\'#64748b\'">&times;</button>' +
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

    // Sent here because the login timed out: open the login box with a short note.
    try {
      var loginMsg = sessionStorage.getItem('wl_login_msg');
      if (loginMsg && !session) {
        sessionStorage.removeItem('wl_login_msg');
        window.wlShowLogin();
        var msgEl = document.getElementById('wlCodeErr');
        if (msgEl) msgEl.textContent = loginMsg;
      }
    } catch (e) {}
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
        _loginClassInfo = cls;
        // Load student list (first names of this class, by its code)
        var nameDisplay = document.getElementById('wlClassNameDisplay');
        if (nameDisplay) nameDisplay.textContent = cls.name + ' \u2014 pick your name';
        var list = document.getElementById('wlStudentList');
        if (list) list.innerHTML = '<div class="wl-no">Loading...</div>';
        _wlShowStep(2);
        var { data: students, error: stuErr } = await sbCall(function() {
          return sb().rpc('student_login_roster', { p_class_code: code });
        });
        if (stuErr && _isMissingFn(stuErr)) {
          // Database not updated yet (close_student_reads.sql): the old direct read
          ({ data: students, error: stuErr } = await sb().from('students').select('id, name').eq('class_id', cls.id).order('name'));
        }
        if (stuErr || !students || !students.length) {
          if (list) list.innerHTML = '<div class="wl-no">No students in this class.</div>';
          return;
        }
        if (list) list.innerHTML = students.map(function(s) {
          // Roster rows carry a name only; the id comes back from the login itself
          var idArg = s.id ? '\'' + escapeHtml(String(s.id)).replace(/'/g,"&#39;") + '\',' : 'null,';
          return '<button class="wl-sbtn" onclick="WordLabData._pickStudent(' + idArg + '\'' + escapeHtml(s.name).replace(/'/g,"&#39;") + '\')">' + escapeHtml(s.name) + '</button>';
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
        var result = _loginStudentId
          ? await verifyStudentCode(_loginStudentId, code, _loginClassId)
          : await verifyStudentByName(_loginClassId, _loginStudentName, code);
        if (!result.ok) {
          if (err) err.textContent = result.reason === 'too_many_attempts'
            ? 'Too many tries \u2014 wait 10 minutes and try again.'
            : 'Incorrect code \u2014 try again.';
          if (inp) { inp.disabled = false; inp.value = ''; inp.focus(); }
          return;
        }
        if (result.studentId) _loginStudentId = result.studentId;
        if (result.name) _loginStudentName = result.name;
        // Store extension mode synchronously before session starts so pages can read it immediately
        // Clear any previous student choice so the DB value is used as the fresh default on login
        sessionStorage.removeItem('wl_ext_pinned');
        sessionStorage.setItem('wl_extension_mode', result.extensionMode ? 'true' : 'false');
        if (result.ealdLanguage) {
          sessionStorage.setItem('wl_eald_language', result.ealdLanguage);
        } else {
          sessionStorage.removeItem('wl_eald_language');
        }
        // Success — load per-class and per-student settings
        loadLowStimMode(_loginClassId);
        loadSupportMode(_loginStudentId);
        startSession(_loginClassId, _loginStudentId, _loginStudentName, null, _loginClassInfo);
        document.getElementById('wlOverlay').classList.add('wl-hide');
        _updatePill(_loginStudentName);
        var btn = document.getElementById('wlLoginBtn');
        if (btn) btn.style.display = 'none';
        var cb = _onLoginCallback;
        _loginClassId = null; _loginStudentId = null; _loginStudentName = null; _loginClassInfo = null;
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
      ? '<span class="wl-student-pill" style="display:inline-flex;align-items:center;gap:0;background:#eef2ff;border:1px solid #c7d2fe;border-radius:999px;font-family:Lexend,sans-serif;">' +
          '<span style="padding:6px 4px 6px 14px;font-size:12px;font-weight:800;color:#4338ca;cursor:pointer;white-space:nowrap;" onclick="wlShowLogin()">👤 ' + escapeHtml(name) + '</span>' +
          '<button onclick="WordLabData._logoutStudent()" title="Log out" style="background:none;border:none;cursor:pointer;padding:6px 10px 6px 4px;font-size:13px;color:#64748b;display:inline-flex;align-items:center;transition:color .15s;" onmouseover="this.style.color=\'#dc2626\'" onmouseout="this.style.color=\'#64748b\'">✕</button>' +
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

  async function _logoutStudent() {
    var revoke = endSession();
    sessionStorage.removeItem('wl_extension_mode');
    sessionStorage.removeItem('wl_extension_activities');
    sessionStorage.removeItem('wl_stage');
    sessionStorage.removeItem('wl_stage_overrides');
    sessionStorage.removeItem('wl_ext_pinned');
    sessionStorage.removeItem('wl_teacher_preview');
    sessionStorage.removeItem('wl_eald_language');
    sessionStorage.removeItem('wl_low_stim');
    sessionStorage.removeItem('wl_support_mode');
    _applyLowStimClass(false);
    _applySupportClass(false);
    _updatePill(null);
    var btn = document.getElementById('wlLoginBtn');
    if (btn) { btn.style.display = ''; btn.textContent = '👤 Log in'; }
    try { await revoke; } catch (e) {}
    window.location.reload();
  }

  // ── Crown Leader ──────────────────────────────────────────────
  async function getClassLeader(classId) {
    // A logged-in student only learns whether the leader is them: the roster
    // function returns first names, XP and totals, never ids.
    var session = loadSession();
    if (session && session.token && session.classId === classId) {
      try {
        var roster = await getClassRoster();
        var top = null, best = 0;
        roster.forEach(function(r) { if ((r.total_correct || 0) > best) { best = r.total_correct || 0; top = r; } });
        return top && top.is_me ? session.studentId : null;
      } catch (e) { return null; }
    }
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
    var existingCodes = Object.values(await _studentCodeMap(classId, true));
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
          .from('students').select('id, name')
          .eq('id', info.studentId).maybeSingle();
        if (row) {
          var _c1 = await _studentCodeMap(classId);
          return { studentId: row.id, studentName: row.name, studentCode: _c1[row.id] || info.studentCode || '' };
        }
        // Cached student no longer exists — remove stale cache
        localStorage.removeItem('wl_teacher_student_' + classId);
      }
    } catch(e) {}
    // 2. Check if any student in class is in the teacherIds list
    var teacherIds = await getClassTeacherIds(classId);
    if (teacherIds.length === 0) return null;
    var { data: students } = await sb()
      .from('students').select('id, name').eq('class_id', classId);
    if (!students) return null;
    var _c2 = await _studentCodeMap(classId);
    for (var i = 0; i < students.length; i++) {
      if (teacherIds.includes(students[i].id)) {
        var found = { studentId: students[i].id, studentName: students[i].name, studentCode: _c2[students[i].id] || '' };
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
    // A student session token for the teacher's preview student (checked against the
    // teacher's login and school). Without it the preview uses the old calls.
    var token = null;
    try {
      var tr = await sb().rpc('teacher_student_token', { p_student_id: ts.studentId });
      if (tr && !tr.error && tr.data && tr.data.session_token) token = tr.data.session_token;
      else if (tr && tr.error && !_isMissingFn(tr.error)) console.warn('teacher_student_token failed', tr.error);
    } catch(e) { console.warn('teacher_student_token failed', e); }
    await startSession(classId, ts.studentId, ts.studentName, token);
    try { sessionStorage.setItem('wl_teacher_preview', 'true'); } catch(e) {}
    return true;
  }

  // Returns a promise (resolves true once the preview token has been ended).
  function exitStudentMode() {
    var revoke = endSession();
    try { sessionStorage.removeItem('wl_teacher_preview'); } catch(e) {}
    return Promise.resolve(revoke).then(function() { return true; }, function() { return true; });
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
      const sr = await _sessionRead(['usage', 'school']);
      const count = (sr.data && sr.data.usage && sr.data.usage.question_count) || 0;
      var plan = (sr.data && sr.data.school && sr.data.school.plan) || null;
      if (!plan) plan = await getSchoolPlan();
      if (plan && plan !== 'trial' && plan !== 'expired') {
        return { blocked: false, count: count };
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
      await _studentWrite('student_daily_usage', { p_usage_date: today }, async function() {
        const { data: existing } = await sb()
          .from('daily_usage')
          .select('id, question_count')
          .eq('student_id', session.studentId)
          .eq('usage_date', today)
          .maybeSingle();
        if (existing) {
          return sb().from('daily_usage').update({
            question_count: (existing.question_count || 0) + 1,
            updated_at: new Date().toISOString()
          }).eq('id', existing.id);
        }
        return sb().from('daily_usage').insert({
          student_id: session.studentId,
          usage_date: today,
          question_count: 1,
          activity_count: 1
        });
      });
    } catch(e) { console.warn('incrementDailyUsage error', e); }
  }

  // ── Focus Game (teacher-set) ────────────────────────────────
  // Cached in localStorage to avoid DB call on every recordAttempt
  function _getFocusGameCacheKey() {
    var session = loadSession();
    return session ? 'wl_focus_game_' + session.classId : null;
  }

  function getFocusGame() {
    var key = _getFocusGameCacheKey();
    if (!key) return null;
    try {
      var cached = JSON.parse(localStorage.getItem(key) || '{}');
      // Cache for 5 minutes
      if (cached.game !== undefined && cached.ts && (Date.now() - cached.ts) < 300000) return cached.game;
    } catch(e) {}
    return null; // will be loaded async
  }

  async function loadFocusGame() {
    var session = loadSession();
    if (!session) return null;
    var key = _getFocusGameCacheKey();
    try {
      var { data } = await sb().from('classes').select('settings').eq('id', session.classId).maybeSingle();
      var game = (data && data.settings && data.settings.focusGame) || null;
      if (key) localStorage.setItem(key, JSON.stringify({ game: game, ts: Date.now() }));
      return game;
    } catch(e) { return null; }
  }

  // ── Bonus day check (weekends + Wednesdays) ───────────────
  function getBonusDayMultiplier() {
    var day = new Date().getDay(); // 0=Sun, 3=Wed, 6=Sat
    if (day === 0 || day === 6 || day === 3) {
      return { active: true, xpMult: 2, quarkMult: 1.5, label: day === 3 ? 'Wednesday' : 'Weekend' };
    }
    return { active: false, xpMult: 1, quarkMult: 1, label: null };
  }

  // ── Daily Challenges System ─────────────────────────────────
  // Generates 3 daily challenges (easy/medium/hard) + 1 weekly challenge
  // Tracks daily play streak (consecutive days with 10+ min activity)

  const CHALLENGE_GAMES = [
    { key: 'phoneme-splitter',  name: 'Phoneme Splitter', icon: '🔊' },
    { key: 'syllable-splitter', name: 'Syllable Splitter', icon: '✂️' },
    { key: 'breakdown-blitz',   name: 'Breakdown Blitz',  icon: '🧩' },
    { key: 'mission-mode',      name: 'Mission Mode',     icon: '🚀' },
    { key: 'meaning-mode',      name: 'Meaning Mode',     icon: '💡' },
    { key: 'sound-sorter',      name: 'Sound Sorter',     icon: '🎧' },
    { key: 'speed-mode',        name: 'Speed Builder',    icon: '⚡' },
    { key: 'root-lab',          name: 'Root Lab',         icon: '🌿' },
    { key: 'homophone-hunter',  name: 'Homophone Hunter', icon: '👯' },
    { key: 'word-refinery',     name: 'The Refinery',     icon: '🏭' },
    { key: 'word-spectrum',     name: 'Word Spectrum',    icon: '🌈' },
  ];

  // ── Featured Game system ────────────────────────────────────
  // Teacher focus overrides auto-pick. Auto-pick chooses the game
  // the student has played least or has lowest accuracy in.
  // Both give the same 2x reward and gold glow.

  function _findGameInfo(key) {
    for (var i = 0; i < CHALLENGE_GAMES.length; i++) {
      if (CHALLENGE_GAMES[i].key === key) return CHALLENGE_GAMES[i];
    }
    return null;
  }

  // Synchronous — reads from cache set by loadFeaturedGame()
  function getFeaturedGame() {
    var session = loadSession();
    if (!session) return null;
    try {
      var cached = JSON.parse(localStorage.getItem('wl_featured_' + session.studentId) || '{}');
      if (cached.key && cached.ts && (Date.now() - cached.ts) < 300000) return cached;
    } catch(e) {}
    return null;
  }

  // Async — loads teacher focus + student progress, caches result
  async function loadFeaturedGame() {
    var session = loadSession();
    if (!session) return null;

    // 1. Check teacher focus (overrides auto)
    var teacherFocus = null;
    try {
      var { data } = await sb().from('classes').select('settings').eq('id', session.classId).maybeSingle();
      teacherFocus = (data && data.settings && data.settings.focusGame) || null;
    } catch(e) {}

    if (teacherFocus) {
      var info = _findGameInfo(teacherFocus);
      var result = { key: teacherFocus, source: 'teacher', name: info ? info.name : teacherFocus, icon: info ? info.icon : '🎯' };
      try { localStorage.setItem('wl_featured_' + session.studentId, JSON.stringify({ ...result, ts: Date.now() })); } catch(e) {}
      return result;
    }

    // 2. Auto-pick: least played or lowest accuracy
    try {
      var _pr = await _sessionRead(['progress']);
      var progRows = (_pr.data && _pr.data.progress) || [];

      // Aggregate per activity
      var actStats = {};
      CHALLENGE_GAMES.forEach(function(g) { actStats[g.key] = { correct: 0, total: 0 }; });
      (progRows || []).forEach(function(r) {
        if (actStats[r.activity]) {
          actStats[r.activity].correct += r.correct || 0;
          actStats[r.activity].total += r.total || 0;
        }
      });

      // Score each game: never played = highest priority, then lowest accuracy, then least played
      var scored = CHALLENGE_GAMES.map(function(g) {
        var s = actStats[g.key];
        var acc = s.total > 0 ? s.correct / s.total : -1; // -1 = never played
        return { key: g.key, name: g.name, icon: g.icon, total: s.total, acc: acc };
      });

      scored.sort(function(a, b) {
        // Never played first
        if (a.acc === -1 && b.acc !== -1) return -1;
        if (b.acc === -1 && a.acc !== -1) return 1;
        // Both never played — random tiebreak
        if (a.acc === -1 && b.acc === -1) return 0;
        // Lowest accuracy first
        if (a.acc !== b.acc) return a.acc - b.acc;
        // Least played as tiebreak
        return a.total - b.total;
      });

      var pick = scored[0];
      var result = { key: pick.key, source: 'auto', name: pick.name, icon: pick.icon };
      try { localStorage.setItem('wl_featured_' + session.studentId, JSON.stringify({ ...result, ts: Date.now() })); } catch(e) {}
      return result;
    } catch(e) {
      return null;
    }
  }

  // ── Least-played games for "Try me" nudges ────────────────────
  function getLeastPlayedGames(activitiesPlayed) {
    var counts = {};
    CHALLENGE_GAMES.forEach(function(g) { counts[g.key] = 0; });
    (activitiesPlayed || []).forEach(function(a) {
      if (counts[a] !== undefined) counts[a]++;
      else counts[a] = 1;
    });
    return CHALLENGE_GAMES.filter(function(g) { return counts[g.key] === 0; });
  }

  const CHALLENGE_TEMPLATES = {
    easy: [
      { type: 'correct_in_game', count: 15, label: 'Get {count} correct in {game}', quarks: 15, xp: 30 },
      { type: 'correct_in_game', count: 20, label: 'Get {count} correct in {game}', quarks: 18, xp: 35 },
      { type: 'correct_any',     count: 25, label: 'Answer {count} questions correctly in any activity', quarks: 15, xp: 30 },
      { type: 'play_different',  count: 2,  label: 'Play {count} different activities today', quarks: 12, xp: 25 },
      { type: 'streak_in_game',  count: 3,  label: 'Get a streak of {count} in {game}', quarks: 15, xp: 30 },
    ],
    medium: [
      { type: 'correct_in_game', count: 30, label: 'Get {count} correct in {game}', quarks: 30, xp: 60 },
      { type: 'correct_in_game', count: 25, label: 'Get {count} correct in {game}', quarks: 25, xp: 50 },
      { type: 'streak_in_game',  count: 7,  label: 'Get a streak of {count} in {game}', quarks: 35, xp: 60 },
      { type: 'play_different',  count: 4,  label: 'Play {count} different activities today', quarks: 30, xp: 55 },
      { type: 'correct_any',     count: 50, label: 'Answer {count} questions correctly today', quarks: 30, xp: 55 },
    ],
    hard: [
      { type: 'correct_in_game', count: 50, label: 'Get {count} correct in {game}', quarks: 60, xp: 120 },
      { type: 'streak_in_game',  count: 12, label: 'Get a streak of {count} in {game}', quarks: 75, xp: 120 },
      { type: 'play_different',  count: 6,  label: 'Play {count} different activities today', quarks: 60, xp: 100 },
      { type: 'correct_any',     count: 80, label: 'Answer {count} questions correctly today', quarks: 55, xp: 100 },
      { type: 'perfect_run',     count: 10, label: 'Get {count} in a row correct in {game}',  quarks: 75, xp: 120 },
    ]
  };

  const WEEKLY_TEMPLATES = [
    { type: 'correct_any',    count: 250, label: 'Answer {count} questions correctly this week', quarks: 200, xp: 400 },
    { type: 'play_different', count: 9,   label: 'Play {count} different activities this week',  quarks: 150, xp: 300 },
    { type: 'correct_any',    count: 175, label: 'Answer {count} questions correctly this week', quarks: 150, xp: 300 },
    { type: 'play_days',      count: 5,   label: 'Play on {count} different days this week',     quarks: 200, xp: 400 },
  ];

  function _seededRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function _getTodayStr() { return new Date().toISOString().slice(0, 10); }

  function _getWeekStr() {
    var d = new Date();
    var day = d.getDay(); // 0=Sun
    var monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7)); // back to Monday
    return monday.toISOString().slice(0, 10);
  }

  function _challengeStorageKey(studentId) { return 'wl_challenges_' + studentId; }

  function _loadChallengeData(studentId) {
    try {
      var raw = localStorage.getItem(_challengeStorageKey(studentId));
      return raw ? JSON.parse(raw) : {};
    } catch(e) { return {}; }
  }

  function _saveChallengeData(studentId, data) {
    try { localStorage.setItem(_challengeStorageKey(studentId), JSON.stringify(data)); }
    catch(e) { console.warn('saveChallengeData error', e); }
  }

  function _generateDailyChallenges(studentId, dateStr) {
    // Use date + studentId hash as seed for deterministic daily challenges per student
    var seed = 0;
    for (var i = 0; i < dateStr.length; i++) seed = seed * 31 + dateStr.charCodeAt(i);
    for (var j = 0; j < studentId.length; j++) seed = seed * 31 + studentId.charCodeAt(j);

    var challenges = [];
    var usedGames = [];

    ['easy', 'medium', 'hard'].forEach(function(difficulty, idx) {
      var templates = CHALLENGE_TEMPLATES[difficulty];
      var tIdx = Math.floor(_seededRandom(seed + idx * 1000) * templates.length);
      var template = templates[tIdx];

      // Pick a game not already used
      var available = CHALLENGE_GAMES.filter(function(g) { return usedGames.indexOf(g.key) === -1; });
      var gIdx = Math.floor(_seededRandom(seed + idx * 2000 + 1) * available.length);
      var game = available[gIdx] || CHALLENGE_GAMES[0];
      if (template.type === 'correct_in_game' || template.type === 'streak_in_game' || template.type === 'perfect_run') {
        usedGames.push(game.key);
      }

      var label = template.label.replace('{count}', template.count).replace('{game}', game.name);
      challenges.push({
        id: difficulty + '_' + dateStr,
        difficulty: difficulty,
        type: template.type,
        game: game.key,
        gameName: game.name,
        gameIcon: game.icon,
        count: template.count,
        label: label,
        quarks: template.quarks,
        xp: template.xp,
        progress: 0,
        claimed: false
      });
    });
    return challenges;
  }

  function _generateWeeklyChallenge(studentId, weekStr) {
    var seed = 0;
    for (var i = 0; i < weekStr.length; i++) seed = seed * 31 + weekStr.charCodeAt(i);
    for (var j = 0; j < studentId.length; j++) seed = seed * 31 + studentId.charCodeAt(j);
    seed += 99999; // offset from daily seed

    var tIdx = Math.floor(_seededRandom(seed) * WEEKLY_TEMPLATES.length);
    var template = WEEKLY_TEMPLATES[tIdx];
    var label = template.label.replace('{count}', template.count);
    return {
      id: 'weekly_' + weekStr,
      difficulty: 'weekly',
      type: template.type,
      count: template.count,
      label: label,
      quarks: template.quarks,
      xp: template.xp,
      progress: 0,
      claimed: false,
      daysPlayed: []
    };
  }

  function getDailyChallenges() {
    var session = loadSession();
    if (!session) return { daily: [], weekly: null, streak: 0 };
    var studentId = session.studentId;
    var today = _getTodayStr();
    var week = _getWeekStr();
    var data = _loadChallengeData(studentId);

    // Generate or load daily challenges
    if (!data.dailyDate || data.dailyDate !== today) {
      data.daily = _generateDailyChallenges(studentId, today);
      data.dailyDate = today;
      // Track today's session data
      data.todayGames = [];
      data.todayCorrect = 0;
      data.todayBestStreaks = {};
    }

    // Generate or load weekly challenge
    if (!data.weeklyWeek || data.weeklyWeek !== week) {
      data.weekly = _generateWeeklyChallenge(studentId, week);
      data.weeklyWeek = week;
    }

    // Load streak
    if (!data.streak) data.streak = { count: 0, lastDate: null };

    _saveChallengeData(studentId, data);
    return { daily: data.daily, weekly: data.weekly, streak: data.streak };
  }

  function updateChallengeProgress(activity, correct, streak) {
    var session = loadSession();
    if (!session) return null;
    var studentId = session.studentId;
    var today = _getTodayStr();
    var data = _loadChallengeData(studentId);
    if (!data.daily || data.dailyDate !== today) return null; // no challenges loaded

    // Update daily tracking
    if (!data.todayGames) data.todayGames = [];
    if (data.todayGames.indexOf(activity) === -1) data.todayGames.push(activity);

    // Track weekly game variety (for variety badges)
    var weekStr = _getWeekStr();
    if (data.weekGamesWeek !== weekStr) { data.weekGames = []; data.weekGamesWeek = weekStr; }
    if (!data.weekGames) data.weekGames = [];
    if (data.weekGames.indexOf(activity) === -1) data.weekGames.push(activity);
    if (correct) data.todayCorrect = (data.todayCorrect || 0) + 1;
    if (!data.todayBestStreaks) data.todayBestStreaks = {};
    if (streak > (data.todayBestStreaks[activity] || 0)) data.todayBestStreaks[activity] = streak;

    // Update play time tracking for streak
    if (!data.todayPlayStart) data.todayPlayStart = Date.now();
    data.todayLastAction = Date.now();

    var completed = [];

    // Update each daily challenge
    data.daily.forEach(function(ch) {
      if (ch.claimed) return;
      var oldProgress = ch.progress;

      if (ch.type === 'correct_in_game' && correct && activity === ch.game) {
        ch.progress = Math.min((ch.progress || 0) + 1, ch.count);
      } else if (ch.type === 'correct_any' && correct) {
        ch.progress = data.todayCorrect;
      } else if (ch.type === 'streak_in_game' && activity === ch.game) {
        ch.progress = Math.max(ch.progress || 0, data.todayBestStreaks[activity] || 0);
      } else if (ch.type === 'perfect_run' && activity === ch.game) {
        ch.progress = Math.max(ch.progress || 0, data.todayBestStreaks[activity] || 0);
      } else if (ch.type === 'play_game' && activity === ch.game) {
        ch.progress = 1;
      } else if (ch.type === 'play_different') {
        ch.progress = data.todayGames.length;
      }

      if (ch.progress >= ch.count && oldProgress < ch.count) {
        completed.push(ch);
      }
    });

    // Update weekly challenge
    if (data.weekly && !data.weekly.claimed) {
      var wk = data.weekly;
      if (wk.type === 'correct_any' && correct) {
        wk.progress = (wk.progress || 0) + 1;
      } else if (wk.type === 'play_different') {
        if (!wk.gamesPlayed) wk.gamesPlayed = [];
        if (wk.gamesPlayed.indexOf(activity) === -1) wk.gamesPlayed.push(activity);
        wk.progress = wk.gamesPlayed.length;
      } else if (wk.type === 'play_days') {
        if (!wk.daysPlayed) wk.daysPlayed = [];
        if (wk.daysPlayed.indexOf(today) === -1) wk.daysPlayed.push(today);
        wk.progress = wk.daysPlayed.length;
      }
      if (wk.progress >= wk.count && !completed.includes(wk)) {
        completed.push(wk);
      }
    }

    _saveChallengeData(studentId, data);

    // Show toast for newly completed challenges
    if (completed.length > 0) {
      completed.forEach(function(ch) { _showChallengeToast(ch); });
    }

    return { daily: data.daily, weekly: data.weekly, completed: completed };
  }

  function _showChallengeToast(challenge) {
    // Inject toast CSS once
    if (!document.getElementById('wlChallengeToastStyle')) {
      var s = document.createElement('style');
      s.id = 'wlChallengeToastStyle';
      s.textContent =
        '.wl-challenge-toast{position:fixed;top:20px;right:20px;z-index:99998;background:linear-gradient(135deg,#1e1b4b,#312e81);border:2px solid rgba(99,102,241,0.5);border-radius:16px;padding:14px 20px;font-family:Lexend,sans-serif;color:#e0e7ff;box-shadow:0 20px 40px rgba(0,0,0,0.4);animation:wlToastIn .4s ease,wlToastOut .4s ease 3.6s forwards;display:flex;align-items:center;gap:12px;max-width:340px;}' +
        '.wl-challenge-toast-icon{font-size:28px;flex-shrink:0;}' +
        '.wl-challenge-toast-text{font-size:12px;font-weight:700;line-height:1.4;}' +
        '.wl-challenge-toast-title{font-size:13px;font-weight:900;color:#a5b4fc;margin-bottom:2px;}' +
        '.wl-challenge-toast-reward{font-size:11px;font-weight:800;color:#818cf8;}' +
        '@keyframes wlToastIn{0%{opacity:0;transform:translateX(60px) scale(.9)}100%{opacity:1;transform:translateX(0) scale(1)}}' +
        '@keyframes wlToastOut{0%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(60px)}}';
      document.head.appendChild(s);
    }
    var toast = document.createElement('div');
    toast.className = 'wl-challenge-toast';
    var diffLabel = challenge.difficulty === 'weekly' ? 'Weekly Challenge' : challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1) + ' Challenge';
    toast.innerHTML =
      '<div class="wl-challenge-toast-icon">🎯</div>' +
      '<div class="wl-challenge-toast-text">' +
        '<div class="wl-challenge-toast-title">' + diffLabel + ' Complete!</div>' +
        '<div>' + escapeHtml(challenge.label) + '</div>' +
        '<div class="wl-challenge-toast-reward">⚛️ ' + challenge.quarks + ' quarks · +' + challenge.xp + ' XP ready to claim</div>' +
      '</div>';
    document.body.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 4200);
  }

  function _showBonusToast(icon, title, body, reward, color, bgColor) {
    if (!document.getElementById('wlBonusToastStyle')) {
      var s = document.createElement('style');
      s.id = 'wlBonusToastStyle';
      s.textContent =
        '.wl-bonus-toast{position:fixed;top:80px;right:20px;z-index:99997;border-radius:14px;padding:12px 18px;font-family:Lexend,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,0.2);animation:wlToastIn .4s ease,wlToastOut .4s ease 3.1s forwards;display:flex;align-items:center;gap:10px;max-width:320px;}' +
        '.wl-bonus-toast-icon{font-size:24px;flex-shrink:0;}' +
        '.wl-bonus-toast-title{font-size:12px;font-weight:900;margin-bottom:1px;}' +
        '.wl-bonus-toast-body{font-size:11px;font-weight:600;opacity:.8;}' +
        '.wl-bonus-toast-reward{font-size:10px;font-weight:800;margin-top:2px;}';
      document.head.appendChild(s);
    }
    var toast = document.createElement('div');
    toast.className = 'wl-bonus-toast';
    toast.style.cssText = 'background:' + bgColor + ';border:2px solid ' + color + ';color:' + color + ';';
    toast.innerHTML =
      '<div class="wl-bonus-toast-icon">' + icon + '</div>' +
      '<div>' +
        '<div class="wl-bonus-toast-title">' + escapeHtml(title) + '</div>' +
        '<div class="wl-bonus-toast-body">' + escapeHtml(body) + '</div>' +
        '<div class="wl-bonus-toast-reward">' + escapeHtml(reward) + '</div>' +
      '</div>';
    document.body.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3700);
  }

  async function claimChallengeReward(challengeId) {
    var session = loadSession();
    if (!session) return null;
    var studentId = session.studentId;
    var data = _loadChallengeData(studentId);

    // Find the challenge
    var challenge = null;
    if (data.daily) {
      challenge = data.daily.find(function(c) { return c.id === challengeId; });
    }
    if (!challenge && data.weekly && data.weekly.id === challengeId) {
      challenge = data.weekly;
    }
    if (!challenge || challenge.claimed || challenge.progress < challenge.count) return null;

    challenge.claimed = true;
    _saveChallengeData(studentId, data);

    // Award quarks and XP
    var _cr = await _sessionRead(['character']);
    var existing = _cr.data ? _cr.data.character : null, claimReadErr = _cr.error;
    if (claimReadErr) { console.warn('claimChallengeReward read failed', claimReadErr); return null; }
    var char = ensureCharFields(existing ? { ...existing } : { student_id: studentId });
    char.quarks += challenge.quarks;
    char.xp += challenge.xp;
    var newBadges = checkBadges(char);
    // Don't write scientist — it's only managed by saveScientist/purchase atomic RPCs
    await _saveCharacter(studentId, char, true);

    return { quarks: char.quarks, xp: char.xp, quarksEarned: challenge.quarks,
             xpEarned: challenge.xp, newBadges: newBadges, level: getLevel(char.xp) };
  }

  function updateDailyStreak() {
    var session = loadSession();
    if (!session) return { count: 0 };
    var studentId = session.studentId;
    var today = _getTodayStr();
    var data = _loadChallengeData(studentId);
    if (!data.streak) data.streak = { count: 0, lastDate: null };

    // Check if student played 10+ min today
    var playMs = 0;
    if (data.todayPlayStart && data.todayLastAction) {
      playMs = data.todayLastAction - data.todayPlayStart;
    }
    var playedEnough = playMs >= 10 * 60 * 1000; // 10 minutes

    if (playedEnough && data.streak.lastDate !== today) {
      // Check if yesterday was the last streak day
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      var yesterdayStr = yesterday.toISOString().slice(0, 10);

      if (data.streak.lastDate === yesterdayStr) {
        data.streak.count++;
      } else if (!data.streak.lastDate) {
        data.streak.count = 1;
      } else {
        data.streak.count = 1; // reset
      }
      data.streak.lastDate = today;
      _saveChallengeData(studentId, data);
    }

    return data.streak;
  }

  // ── Custom word lists loader ────────────────────────────────
  // Returns words from teacher-created lists filtered by game and student assignment
  let _customWordsCache = null;
  var _customWordsPriorityCache = null; // { gameName: 'mixed'|'custom_first'|'custom_only' }

  // Suggested spelling sets used to save base morpheme ids (latin_25, anglo_19) instead of the base
  // itself (vers, care). Turn any id back into its form when words are loaded, so sets saved before
  // the fix still work. data.js holds the forms; pages that don't load it get it here.
  var _MORPH_ID_RE = /\b(?:anglo|latin|greek)_\d+\b/g, _baseForms = null, _morphLoad = null;
  function _loadMorphemes() {
    if (window.MORPHEMES) return Promise.resolve();
    if (_morphLoad) return _morphLoad;
    _morphLoad = new Promise(function(res) {
      var sc = document.createElement('script'); sc.src = 'data.js';
      sc.onload = res; sc.onerror = res; document.head.appendChild(sc);
    });
    return _morphLoad;
  }
  async function _fixMorphemeIds(words) {
    if (!Array.isArray(words) || !words.length) return words;
    _MORPH_ID_RE.lastIndex = 0;
    if (!_MORPH_ID_RE.test(JSON.stringify(words))) return words;
    await _loadMorphemes();
    if (!_baseForms && window.MORPHEMES && window.MORPHEMES.bases) {
      _baseForms = Object.create(null);
      window.MORPHEMES.bases.forEach(function(b) { _baseForms[b.id] = b.form; });
    }
    if (!_baseForms) return words;
    var fix = function(v) { return typeof v === 'string' ? v.replace(_MORPH_ID_RE, function(id) { return _baseForms[id] || id; }) : v; };
    words.forEach(function(w) {
      if (!w || typeof w !== 'object') return;
      ['prefix', 'base', 'suffix1', 'suffix2', 'clue'].forEach(function(k) { if (w[k]) w[k] = fix(w[k]); });
      if (w.answers && typeof w.answers === 'object') ['prefix', 'base', 'suffix1', 'suffix2'].forEach(function(k) { if (w.answers[k]) w.answers[k] = fix(w.answers[k]); });
    });
    return words;
  }

  async function getCustomWords(gameName) {
    var session = getSession();
    if (!session) return [];
    try {
      // Cache all lists for this class on first call
      if (!_customWordsCache) {
        var { data: lists } = await sbCall(() => sb().from('class_word_lists')
          .select('id, words, games, priority, stage_group')
          .eq('class_id', session.classId));
        if (!lists || lists.length === 0) { _customWordsCache = []; _customWordsPriorityCache = {}; return []; }

        // Check assignments for each list
        var listIds = lists.map(function(l) { return l.id; });
        var { data: assignments } = await sbCall(() => sb().from('word_list_assignments')
          .select('word_list_id, student_id')
          .in('word_list_id', listIds));
        var assignMap = {};
        (assignments || []).forEach(function(a) {
          if (!assignMap[a.word_list_id]) assignMap[a.word_list_id] = [];
          assignMap[a.word_list_id].push(a.student_id);
        });

        // Flatten all words with their game tags, filtering by student assignment
        // Also track highest priority per game
        _customWordsCache = [];
        _customWordsPriorityCache = {};
        var priorityRank = { custom_only: 3, custom_first: 2, mixed: 1 };
        var studentStage = getStudentStage();
        lists.forEach(function(list) {
          var assigned = assignMap[list.id];
          var hasIndividual = assigned && assigned.length > 0;
          var individualMatch = hasIndividual && assigned.indexOf(session.studentId) !== -1;
          // Stage-group match: list is auto-assigned to every student at this stage
          var stageMatch = list.stage_group && studentStage && list.stage_group === studentStage;
          if (hasIndividual) {
            // If this list has explicit student assignments, individual match OR
            // stage-group match is required (stage group is additive, not
            // restrictive, so it can widen but never narrow individual picks).
            if (!individualMatch && !stageMatch) return;
          } else if (list.stage_group) {
            // No explicit assignments, but stage-group set: student must match
            if (!stageMatch) return;
          }
          // Otherwise (no assignments, no stage_group): list applies to everyone
          var games = list.games || ['breakdown'];
          var listPriority = list.priority || 'mixed';
          // Track highest priority per game
          games.forEach(function(g) {
            var current = _customWordsPriorityCache[g] || 'mixed';
            if ((priorityRank[listPriority] || 1) > (priorityRank[current] || 1)) {
              _customWordsPriorityCache[g] = listPriority;
            }
          });
          (list.words || []).forEach(function(w) {
            w._games = games;
            _customWordsCache.push(w);
          });
        });
      }

      // Filter for requested game
      await _fixMorphemeIds(_customWordsCache);
      return _customWordsCache.filter(function(w) {
        return w._games && w._games.indexOf(gameName) !== -1;
      });
    } catch(e) {
      console.warn('getCustomWords error:', e);
      return [];
    }
  }

  // Returns the effective priority for a game: 'custom_only', 'custom_first', or 'mixed'
  function getCustomWordPriority(gameName) {
    if (!_customWordsPriorityCache) return 'mixed';
    return _customWordsPriorityCache[gameName] || 'mixed';
  }

  // ── Custom morphemes (for Mission Mode / Meaning Mode) ─────
  var _customMorphemesCache = null;
  var _customMorphemesPriorityCache = null;

  async function getCustomMorphemes(gameName) {
    var session = getSession();
    if (!session) return [];
    try {
      if (!_customMorphemesCache) {
        var { data: sets } = await sb().from('class_morphemes')
          .select('id, morphemes, games, priority')
          .eq('class_id', session.classId);
        if (!sets || sets.length === 0) { _customMorphemesCache = []; _customMorphemesPriorityCache = {}; return []; }

        var setIds = sets.map(function(s) { return s.id; });
        var { data: assignments } = await sb().from('morpheme_set_assignments')
          .select('morpheme_set_id, student_id')
          .in('morpheme_set_id', setIds);
        var assignMap = {};
        (assignments || []).forEach(function(a) {
          if (!assignMap[a.morpheme_set_id]) assignMap[a.morpheme_set_id] = [];
          assignMap[a.morpheme_set_id].push(a.student_id);
        });

        _customMorphemesCache = [];
        _customMorphemesPriorityCache = {};
        var priorityRank = { custom_only: 3, custom_first: 2, mixed: 1 };
        sets.forEach(function(set) {
          var assigned = assignMap[set.id];
          if (assigned && assigned.length > 0 && assigned.indexOf(session.studentId) === -1) return;
          var games = set.games || ['meaning'];
          var setPriority = set.priority || 'mixed';
          games.forEach(function(g) {
            var current = _customMorphemesPriorityCache[g] || 'mixed';
            if ((priorityRank[setPriority] || 1) > (priorityRank[current] || 1)) {
              _customMorphemesPriorityCache[g] = setPriority;
            }
          });
          (set.morphemes || []).forEach(function(m) {
            m._games = games;
            _customMorphemesCache.push(m);
          });
        });
      }

      return _customMorphemesCache.filter(function(m) {
        return m._games && m._games.indexOf(gameName) !== -1;
      });
    } catch(e) {
      console.warn('getCustomMorphemes error:', e);
      return [];
    }
  }

  function getCustomMorphemePriority(gameName) {
    if (!_customMorphemesPriorityCache) return 'mixed';
    return _customMorphemesPriorityCache[gameName] || 'mixed';
  }

  // ── Spelling set words loader ──────────────────────────────────
  // Loads AI-analyzed words from the student's assigned spelling set(s)
  var _spellingSetWordsCache = null;

  async function getSpellingSetWords(opts) {
    var session = loadSession();
    if (!session) return [];
    var skipRepetition = opts && opts.skipRepetition;
    if (!skipRepetition && _spellingSetWordsCache) return _spellingSetWordsCache;
    try {
      // Get all spelling sets for this class
      var { data: sets } = await sb().from('class_spelling_sets')
        .select('id, words, stage_group')
        .eq('class_id', session.classId);
      if (!sets || !sets.length) { _spellingSetWordsCache = []; return []; }

      // Get this student's active assignments
      var setIds = sets.map(function(s) { return s.id; });
      var { data: assigns } = await sb().from('spelling_set_assignments')
        .select('spelling_set_id')
        .eq('student_id', session.studentId)
        .eq('active', true)
        .in('spelling_set_id', setIds);

      var individualSetIds = (assigns || []).map(function(a) { return a.spelling_set_id; });

      // Stage-group matches: any set whose stage_group === student's stage
      var studentStage = getStudentStage();
      var stageGroupSetIds = [];
      if (studentStage) {
        sets.forEach(function(s) {
          if (s.stage_group && s.stage_group === studentStage) stageGroupSetIds.push(s.id);
        });
      }

      // Merge individual + stage-group assignments, dedup
      var assignedMap = {};
      individualSetIds.forEach(function(id) { assignedMap[id] = true; });
      stageGroupSetIds.forEach(function(id) { assignedMap[id] = true; });
      var assignedSetIds = Object.keys(assignedMap);

      // Collect words from assigned sets
      var words = [];
      if (assignedSetIds.length) {
        sets.forEach(function(set) {
          if (assignedSetIds.indexOf(set.id) === -1) return;
          (set.words || []).forEach(function(w) {
            if (typeof w === 'object' && w.word) {
              w._spellingSetId = set.id;
              words.push(w);
            }
          });
        });
      }

      // Load focus words — always, even when no sets are assigned
      // Look up full word data (syllables, phonemes, etc.) from the source set
      try {
        var focusWords = await getFocusWords();
        if (focusWords && focusWords.length) {
          var setWordKeys = {};
          words.forEach(function(w) { setWordKeys[w.word.toLowerCase()] = true; });
          // Build lookup of full word data from all sets in this class
          var _allSetWords = {};
          (sets || []).forEach(function(s) {
            (s.words || []).forEach(function(w) {
              if (typeof w === 'object' && w.word) _allSetWords[w.word.toLowerCase()] = w;
            });
          });
          focusWords.forEach(function(fw) {
            if (!setWordKeys[fw.word.toLowerCase()]) {
              // Merge focus word with full set data (syllables, phonemes, etc.)
              var fullData = _allSetWords[fw.word.toLowerCase()] || {};
              var merged = { word: fw.word, base: fw.base || fullData.base || '', prefix: fw.prefix || fullData.prefix || '', suffix1: fw.suffix1 || fullData.suffix1 || '', suffix2: fullData.suffix2 || '', clue: fw.clue || fullData.clue || '', syllables: fullData.syllables || null, phonemes: fullData.phonemes || null, sound: fullData.sound || null, soundLabel: fullData.soundLabel || null, grapheme: fullData.grapheme || null, before: fullData.before || null, after: fullData.after || null, ssLevel: fullData.ssLevel || null, ssType: fullData.ssType || null, distractors: fullData.distractors || null, explain: fullData.explain || null, _spellingSetId: fw.source_set || '', _isFocusWord: true };
              words.push(merged);
            }
          });
        }
      } catch(e) { /* non-critical */ }

      if (!words.length) { _spellingSetWordsCache = []; return []; }

      // Prioritise and repeat words based on accuracy (skip for check-in/assessment mode)
      if (!skipRepetition) {
        // - Words never practised: appear 3x
        // - Words below 50% accuracy: appear 3x
        // - Words 50-79% accuracy: appear 2x
        // - Words 80%+ accuracy: appear 1x
        try {
          var _spr = await _sessionRead(['progress']);
          var prog = ((_spr.data && _spr.data.progress) || []).filter(function(p) { return p.activity === 'spelling-set'; });
          var progMap = {};
          if (prog && prog.length) {
            prog.forEach(function(p) { progMap[p.category] = p; });
          }

          var boosted = [];
          words.forEach(function(w) {
            var key = 'ss:' + w._spellingSetId.slice(0, 8) + ':' + w.word.toLowerCase();
            var p = progMap[key];
            var acc = p && p.total > 0 ? (p.correct / p.total) * 100 : -1;
            var repeats = acc < 0 ? 3 : acc < 50 ? 3 : acc < 80 ? 2 : 1;
            for (var i = 0; i < repeats; i++) boosted.push(w);
          });

          // Sort: lowest accuracy first
          boosted.sort(function(a, b) {
            var keyA = 'ss:' + a._spellingSetId.slice(0, 8) + ':' + a.word.toLowerCase();
            var keyB = 'ss:' + b._spellingSetId.slice(0, 8) + ':' + b.word.toLowerCase();
            var pA = progMap[keyA];
            var pB = progMap[keyB];
            var accA = pA && pA.total > 0 ? pA.correct / pA.total : -1;
            var accB = pB && pB.total > 0 ? pB.correct / pB.total : -1;
            return accA - accB;
          });

          words = boosted;
        } catch(e) { /* non-critical — unsorted is fine */ }
      }

      await _fixMorphemeIds(words);
      _spellingSetWordsCache = words;
      return words;
    } catch(e) {
      console.warn('getSpellingSetWords error:', e);
      _spellingSetWordsCache = [];
      return [];
    }
  }

  // ── Focus words (words students got wrong in check-ins) ────────
  async function getFocusWords() {
    var session = loadSession();
    if (!session) return [];
    try {
      var sr = await _sessionRead(['student']);
      var data = sr.data && sr.data.student;
      return await _fixMorphemeIds((data && data.focus_words) || []);
    } catch(e) { return []; }
  }

  async function addFocusWords(newWords) {
    var session = loadSession();
    if (!session || !newWords || !newWords.length) return;
    try {
      var existing = await getFocusWords();
      var existingSet = {};
      existing.forEach(function(w) { existingSet[w.word.toLowerCase()] = true; });
      var toAdd = newWords.filter(function(w) { return w.word && !existingSet[w.word.toLowerCase()]; });
      if (!toAdd.length) return;
      var merged = existing.concat(toAdd.map(function(w) {
        return { word: w.word, base: w.base || '', prefix: w.prefix || '', suffix1: w.suffix1 || '', clue: w.clue || '', source_set: w._spellingSetId || '', added_at: new Date().toISOString() };
      }));
      await _setFocusWords(session, merged);
    } catch(e) { console.warn('addFocusWords error:', e); }
  }

  // The student's whole focus-word list (token function, or the old update).
  async function _setFocusWords(session, list) {
    list = _stripMarkupDeep(list || []);
    var res = await _studentWrite('student_set_focus_words', { p_words: list },
      () => sb().from('students').update({ focus_words: list }).eq('id', session.studentId));
    if (res && res.error) console.warn('Focus words not saved:', res.error.message || res.error);
    return res;
  }

  // One finished spelling check-in (spelling-test.html). Returns { error }.
  async function saveCheckInResult(setId, results, score, total, sessionStartedAt) {
    var session = loadSession();
    if (!session || !session.studentId || !setId) return { error: null };
    return _studentWrite('student_save_check_in',
      { p_set_id: setId, p_results: results, p_score: score, p_total: total, p_session_started_at: sessionStartedAt || null },
      async function() {
        var payload = { spelling_set_id: setId, student_id: session.studentId, results: results, score: score, total: total };
        // Stamp the session anchor so the dashboard can group results from the same
        // check-in even when multiple check-ins happen the same morning.
        if (sessionStartedAt) payload.session_started_at = sessionStartedAt;
        var r = await sb().from('spelling_check_in_results').insert(payload);
        // Fallback if the column hasn't been added yet
        if (r.error && r.error.code === 'PGRST204') {
          delete payload.session_started_at;
          r = await sb().from('spelling_check_in_results').insert(payload);
        }
        return r;
      });
  }

  async function removeFocusWords(wordsToRemove) {
    var session = loadSession();
    if (!session) return;
    try {
      var existing = await getFocusWords();
      var removeSet = {};
      wordsToRemove.forEach(function(w) { removeSet[(typeof w === 'string' ? w : w.word).toLowerCase()] = true; });
      var filtered = existing.filter(function(w) { return !removeSet[w.word.toLowerCase()]; });
      await _setFocusWords(session, filtered);
    } catch(e) { console.warn('removeFocusWords error:', e); }
  }

  async function clearFocusWords() {
    var session = loadSession();
    if (!session) return;
    try {
      await _setFocusWords(session, []);
    } catch(e) { console.warn('clearFocusWords error:', e); }
  }

  // Record a spelling set attempt — uses special activity key so dashboard heatmap picks it up
  async function recordSpellingAttempt(setId, word, correct, timeMs) {
    var session = loadSession();
    if (!session) return {};
    var category = 'ss:' + setId.slice(0, 8) + ':' + word.toLowerCase();
    return recordAttempt('spelling-set', category, correct, timeMs);
  }

  // ── EALD (English as an Additional Language or Dialect) ─────
  const EALD_LANGUAGES = {
    // — High-priority for Australian schools —
    ar: 'Arabic (العربية)',
    zh: 'Mandarin Chinese (中文)',
    'zh-yue': 'Cantonese (廣東話)',
    vi: 'Vietnamese (Tiếng Việt)',
    hi: 'Hindi (हिन्दी)',
    pa: 'Punjabi (ਪੰਜਾਬੀ)',
    tl: 'Filipino/Tagalog',
    ko: 'Korean (한국어)',
    ja: 'Japanese (日本語)',
    th: 'Thai (ภาษาไทย)',
    // — South & Central Asian —
    bn: 'Bengali (বাংলা)',
    gu: 'Gujarati (ગુજરાતી)',
    ta: 'Tamil (தமிழ்)',
    te: 'Telugu (తెలుగు)',
    kn: 'Kannada (ಕನ್ನಡ)',
    ml: 'Malayalam (മലയാളം)',
    mr: 'Marathi (मराठी)',
    ne: 'Nepali (नेपाली)',
    ur: 'Urdu (اردو)',
    fa: 'Farsi/Persian (فارسی)',
    bo: 'Tibetan (བོད་སྐད)',
    dz: 'Dzongkha (རྫོང་ཁ)',
    my: 'Burmese (မြန်မာစာ)',
    km: 'Khmer (ភាសាខ្មែរ)',
    lo: 'Lao (ພາສາລາວ)',
    // — Southeast Asian & Pacific —
    id: 'Indonesian (Bahasa Indonesia)',
    ms: 'Malay (Bahasa Melayu)',
    sm: 'Samoan (Gagana Sāmoa)',
    to: 'Tongan (Lea Fakatonga)',
    // — Middle Eastern & African —
    tr: 'Turkish (Türkçe)',
    he: 'Hebrew (עברית)',
    sw: 'Swahili (Kiswahili)',
    so: 'Somali (Soomaali)',
    af: 'Afrikaans',
    si: 'Sinhala (සිංහල)',
    hr: 'Croatian (Hrvatski)',
    // — European —
    es: 'Spanish (Español)',
    pt: 'Portuguese (Português)',
    fr: 'French (Français)',
    de: 'German (Deutsch)',
    it: 'Italian (Italiano)',
    nl: 'Dutch (Nederlands)',
    pl: 'Polish (Polski)',
    ro: 'Romanian (Română)',
    cs: 'Czech (Čeština)',
    el: 'Greek (Ελληνικά)',
    hu: 'Hungarian (Magyar)',
    uk: 'Ukrainian (Українська)',
    ru: 'Russian (Русский)',
    sv: 'Swedish (Svenska)',
    nb: 'Norwegian (Norsk)',
    da: 'Danish (Dansk)',
    fi: 'Finnish (Suomi)',
    is: 'Icelandic (Íslenska)',
  };

  function getEALDLanguage() {
    return sessionStorage.getItem('wl_eald_language') || null;
  }

  function getEALDLanguageName() {
    var lang = getEALDLanguage();
    return lang ? (EALD_LANGUAGES[lang] || lang) : null;
  }

  // Translation cache (in-memory for current session)
  var _translationCache = {};

  async function getTranslations(words, contexts) {
    var lang = getEALDLanguage();
    if (!lang || !words || words.length === 0) return null;

    // Check in-memory cache first
    var uncachedWords = [];
    var uncachedContexts = [];
    var results = {};
    for (var i = 0; i < words.length; i++) {
      var key = (words[i] || '').toLowerCase().trim() + '::' + ((contexts && contexts[i]) || 'word') + '::' + lang;
      if (_translationCache[key]) {
        results[words[i]] = _translationCache[key];
      } else {
        uncachedWords.push(words[i]);
        uncachedContexts.push((contexts && contexts[i]) || 'word');
      }
    }

    if (uncachedWords.length === 0) return results;

    try {
      var resp = await fetch(SUPABASE_URL + '/functions/v1/translate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: uncachedWords, language: lang, contexts: uncachedContexts }),
      });
      if (!resp.ok) return results;
      var data = await resp.json();
      if (data.translations) {
        data.translations.forEach(function(t) {
          if (t.translation) {
            var cacheKey = (t.word || '').toLowerCase().trim() + '::' + (t.context || 'word') + '::' + lang;
            _translationCache[cacheKey] = t.translation;
            results[t.word] = t.translation;
          }
        });
      }
      return results;
    } catch(e) {
      console.warn('getTranslations error:', e);
      return results;
    }
  }

  // Shared UI: create an EALD translation pill element
  function createEALDPill(translation, extraClass) {
    if (!translation) return null;
    var pill = document.createElement('div');
    pill.className = 'eald-translation-pill' + (extraClass ? ' ' + extraClass : '');
    pill.setAttribute('aria-label', 'Translation: ' + translation);
    pill.innerHTML = '<span class="eald-flag">🌐</span> ' + escapeHtml(translation);
    return pill;
  }

  // BCP 47 language tags for TTS
  var EALD_TTS_CODES = {
    ar: 'ar-SA', zh: 'zh-CN', 'zh-yue': 'zh-HK', vi: 'vi-VN', hi: 'hi-IN',
    pa: 'pa-IN', tl: 'fil-PH', ko: 'ko-KR', ja: 'ja-JP', th: 'th-TH',
    bn: 'bn-IN', gu: 'gu-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN',
    ml: 'ml-IN', mr: 'mr-IN', ne: 'ne-NP', ur: 'ur-PK', fa: 'fa-IR',
    bo: 'bo', dz: 'dz', my: 'my-MM', km: 'km-KH',
    id: 'id-ID', ms: 'ms-MY', sm: 'sm',
    tr: 'tr-TR', he: 'he-IL', sw: 'sw-KE', af: 'af-ZA',
    es: 'es-ES', pt: 'pt-BR', fr: 'fr-FR', de: 'de-DE', it: 'it-IT',
    nl: 'nl-NL', pl: 'pl-PL', ro: 'ro-RO', cs: 'cs-CZ', el: 'el-GR',
    hu: 'hu-HU', uk: 'uk-UA', ru: 'ru-RU', sv: 'sv-SE', nb: 'nb-NO',
    da: 'da-DK', fi: 'fi-FI', is: 'is-IS'
  };

  // Speak a word via Google Cloud TTS (falls back to browser TTS)
  var _ttsAudio = null;
  var _ttsCache = {}; // client-side URL cache: "lang:text" → Audio object

  // Preload audio for a word so it's ready when the user clicks speak
  function preloadTTS(text, langCode) {
    if (!text) return;
    var ealdCode = (langCode === 'en-AU' || langCode === 'en') ? 'en' : langCode;
    var key = ealdCode + ':' + text.toLowerCase().trim();
    if (_ttsCache[key]) return; // already cached or loading
    _ttsCache[key] = 'loading';
    // speak-word verifies a teacher JWT OR a valid student_id+class_id. Students log in
    // anonymously, so pass the session ids or the request 401s and cloud TTS is lost.
    var _sess = getSession();
    var _ttsBody = { text: text, language: ealdCode };
    if (_sess && _sess.studentId && _sess.classId) {
      _ttsBody.student_id = _sess.studentId;
      _ttsBody.class_id = _sess.classId;
    }
    fetch(SUPABASE_URL + '/functions/v1/speak-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_ANON },
      body: JSON.stringify(_ttsBody),
    }).then(function(resp) {
      if (!resp.ok) throw new Error('TTS API ' + resp.status);
      return resp.json();
    }).then(function(data) {
      if (data.audioUrl) {
        var a = new Audio();
        a.preload = 'auto';
        a.src = data.audioUrl;
        _ttsCache[key] = a;
      }
    }).catch(function() {
      // Preload failed silently — speakInLanguage will use browser TTS
      delete _ttsCache[key];
    });
  }

  function speakInLanguage(text, langCode) {
    if (!text) return;
    // Stop any current playback
    if (_ttsAudio) { _ttsAudio.pause(); _ttsAudio = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    var ealdCode = (langCode === 'en-AU' || langCode === 'en') ? 'en' : langCode;
    var key = ealdCode + ':' + text.toLowerCase().trim();

    // 1. If preloaded audio is ready, play it instantly
    var cached = _ttsCache[key];
    if (cached && cached !== 'loading' && cached.readyState >= 2) {
      _ttsAudio = cached;
      _ttsAudio.currentTime = 0;
      _ttsAudio.play().catch(function() {
        _fallbackBrowserTTS(text, langCode);
      });
      return;
    }

    // 2. Use browser TTS immediately (no lag)
    _fallbackBrowserTTS(text, langCode);

    // 3. Warm the cache in the background for next time
    preloadTTS(text, langCode);
  }

  function _fallbackBrowserTTS(text, langCode) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = langCode || 'en-AU';
    u.rate = 0.85;
    // Pick the best Australian voice available
    var voices = window.speechSynthesis.getVoices();
    if (voices.length && (!langCode || langCode === 'en-AU' || langCode === 'en')) {
      var auVoice = voices.find(function(v){ return v.lang === 'en-AU' && v.name.indexOf('Google') !== -1; }) ||
                    voices.find(function(v){ return v.lang === 'en-AU' && v.name.indexOf('Neural') !== -1; }) ||
                    voices.find(function(v){ return v.lang === 'en-AU' && v.name.indexOf('Enhanced') !== -1; }) ||
                    voices.find(function(v){ return v.lang === 'en-AU'; });
      if (auVoice) u.voice = auVoice;
    }
    window.speechSynthesis.speak(u);
  }

  // Build EALD speak buttons HTML (English + home language)
  // wordElId = ID of an element whose dataset.ealdWord holds the English word
  function buildEALDSpeakButtons() {
    var lang = getEALDLanguage();
    if (!lang) return '';
    var langName = (EALD_LANGUAGES[lang] || lang).split(' (')[0];
    return '<span class="eald-speak-group">' +
      '<button class="eald-speak-btn" onclick="WordLabData._speakEALD(\'en\')" title="Hear in English" aria-label="Hear word in English">🔊 English</button>' +
      '<button class="eald-speak-btn eald-speak-home" onclick="WordLabData._speakEALD(\'home\')" title="Hear in ' + escapeHtml(langName) + '" aria-label="Hear word in ' + escapeHtml(langName) + '">🔊 ' + escapeHtml(langName) + '</button>' +
      '</span>';
  }

  // Internal: speak English word or translated word
  function _speakEALD(which) {
    var el = document.getElementById('ealdTranslation');
    var englishWord = el ? (el.dataset.englishWord || '') : '';
    var translatedWord = el ? (el.dataset.translatedWord || '') : '';
    if (which === 'en') {
      speakInLanguage(englishWord, 'en-AU');
    } else {
      var lang = getEALDLanguage();
      var ttsCode = EALD_TTS_CODES[lang] || lang;
      speakInLanguage(translatedWord || englishWord, ttsCode);
    }
  }

  // Build a reveal button + hidden translation container
  function buildEALDRevealButton(idSuffix) {
    var lang = getEALDLanguage();
    if (!lang) return '';
    var langName = (EALD_LANGUAGES[lang] || lang).split(' (')[0];
    var suffix = idSuffix || '';
    var contentId = 'ealdTranslationContent' + suffix;
    var btnId = 'ealdRevealBtn' + suffix;
    return '<div class="eald-reveal-wrap" id="ealdRevealWrap' + suffix + '">' +
      '<button class="eald-reveal-btn" id="' + btnId + '" onclick="var c=document.getElementById(\'' + contentId + '\');c.classList.toggle(\'show\');this.textContent=this.textContent.indexOf(\'Show\')!==-1?\'Hide \'+this.dataset.lang:\'Show in \'+this.dataset.lang" data-lang="' + escapeHtml(langName) + '">Show in ' + escapeHtml(langName) + '</button>' +
      '<div class="eald-reveal-content" id="' + contentId + '"></div>' +
      '</div>';
  }

  // Inject shared EALD CSS into the page (called once per page)
  var _ealdCssInjected = false;
  function injectEALDStyles() {
    if (_ealdCssInjected) return;
    _ealdCssInjected = true;
    var style = document.createElement('style');
    style.textContent = [
      '.eald-translation-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(99,102,241,.1);border:1.5px solid rgba(99,102,241,.25);border-radius:10px;padding:5px 12px;font-size:14px;font-weight:600;color:#4338ca;font-family:"Lexend",sans-serif;margin-top:6px;animation:ealdFadeIn .3s ease;}',
      '.eald-translation-pill .eald-flag{font-size:15px;}',
      '.eald-translation-pill.eald-large{font-size:17px;padding:8px 16px;border-radius:12px;}',
      '.eald-translation-pill.eald-inline{display:inline-flex;margin:0 0 0 8px;font-size:12px;padding:3px 8px;vertical-align:middle;}',
      '.eald-translation-pill.eald-dark{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.2);color:#c7d2fe;}',
      '@keyframes ealdFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}',
      '.eald-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);border-radius:6px;padding:2px 7px;font-size:11px;font-weight:700;color:#6366f1;}',
      '.eald-speak-group{display:inline-flex;gap:4px;margin-left:6px;vertical-align:middle;}',
      '.eald-speak-btn{border:1.5px solid rgba(99,102,241,.25);background:rgba(99,102,241,.06);color:#4338ca;font-family:"Lexend",sans-serif;font-size:11px;font-weight:800;padding:4px 10px;border-radius:8px;cursor:pointer;transition:all .15s;}',
      '.eald-speak-btn:hover{background:rgba(99,102,241,.15);border-color:#818cf8;}',
      '.eald-speak-btn.eald-speak-home{background:rgba(99,102,241,.12);border-color:#a5b4fc;}',
      '.eald-reveal-wrap{text-align:center;margin-top:8px;}',
      '.eald-reveal-btn{border:1.5px solid rgba(99,102,241,.3);background:rgba(99,102,241,.08);color:#4338ca;font-family:"Lexend",sans-serif;font-size:12px;font-weight:800;padding:6px 16px;border-radius:10px;cursor:pointer;transition:all .15s;}',
      '.eald-reveal-btn:hover{background:rgba(99,102,241,.18);border-color:#818cf8;transform:translateY(-1px);}',
      '.eald-reveal-content{max-height:0;overflow:hidden;transition:max-height .3s ease,opacity .3s ease;opacity:0;}',
      '.eald-reveal-content.show{max-height:200px;opacity:1;margin-top:6px;}',
      '.eald-definition{text-align:center;margin-top:4px;}',
      '.eald-def-btn{border:1.5px solid rgba(99,102,241,.25);background:rgba(99,102,241,.06);color:#4338ca;font-family:"Lexend",sans-serif;font-size:11px;font-weight:800;padding:5px 14px;border-radius:8px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}',
      '.eald-def-btn:hover{background:rgba(99,102,241,.15);border-color:#818cf8;transform:translateY(-1px);}',
      '.eald-def-btn .eald-def-front,.eald-def-btn .eald-def-back{transition:opacity .25s ease;}',
      '.eald-def-btn .eald-def-back{display:none;}',
      '.eald-def-btn.flipped .eald-def-front{display:none;}',
      '.eald-def-btn.flipped .eald-def-back{display:inline;}',
      '.eald-def-btn.flipped{background:rgba(99,102,241,.12);border-color:#a5b4fc;}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // loadExtensionData — removed (wordlab-extension-data.js deleted, all content in data.js)
  function loadExtensionData() { return Promise.resolve(); }

  // ── Word of the Week ─────────────────────────────────────────
  // 52 curated words, one per week, cycling yearly.
  // Each entry feeds into Breakdown Blitz, Syllable Splitter, Phoneme Splitter, and Sound Sorter.
  var WOTW_LIST = [
    { word:'extraordinary', prefix:'extra', base:'ordinary', suffix1:'', suffix2:'', meaning:'Beyond what is ordinary or usual', syllables:['ex','tra','or','di','na','ry'], phonemes:['e','x','t','r','a','or','d','i','n','a','r','y'], clue:'Far beyond what is normal' },
    { word:'misconception', prefix:'mis', base:'concept', suffix1:'ion', suffix2:'', meaning:'A wrong or mistaken idea about something', syllables:['mis','con','cep','tion'], phonemes:['m','i','s','c','o','n','c','e','p','t','i','o','n'], clue:'A misunderstanding or wrong belief' },
    { word:'unforgettable', prefix:'un', base:'forget', suffix1:'able', suffix2:'', meaning:'Impossible to forget; very memorable', syllables:['un','for','get','ta','ble'], phonemes:['u','n','f','or','g','e','tt','a','b','le'], clue:'So amazing you will always remember it' },
    { word:'transportation', prefix:'trans', base:'port', suffix1:'ation', suffix2:'', meaning:'The act of carrying people or goods from place to place', syllables:['trans','por','ta','tion'], phonemes:['t','r','a','n','s','p','or','t','a','ti','o','n'], clue:'Moving things from one place to another' },
    { word:'disagreement', prefix:'dis', base:'agree', suffix1:'ment', suffix2:'', meaning:'A difference of opinion; not agreeing', syllables:['dis','a','gree','ment'], phonemes:['d','i','s','a','g','r','ee','m','e','n','t'], clue:'When people do not see eye to eye' },
    { word:'encouragement', prefix:'en', base:'courage', suffix1:'ment', suffix2:'', meaning:'Words or actions that give someone confidence', syllables:['en','cour','age','ment'], phonemes:['e','n','c','our','a','ge','m','e','n','t'], clue:'Giving someone support and confidence' },
    { word:'international', prefix:'inter', base:'nation', suffix1:'al', suffix2:'', meaning:'Involving two or more countries', syllables:['in','ter','na','tion','al'], phonemes:['i','n','t','er','n','a','ti','o','n','a','l'], clue:'Between different countries' },
    { word:'uncomfortable', prefix:'un', base:'comfort', suffix1:'able', suffix2:'', meaning:'Not physically or mentally at ease', syllables:['un','com','fort','a','ble'], phonemes:['u','n','c','o','m','f','or','t','a','b','le'], clue:'Not feeling relaxed or at ease' },
    { word:'independence', prefix:'in', base:'depend', suffix1:'ence', suffix2:'', meaning:'The state of being free and self-reliant', syllables:['in','de','pen','dence'], phonemes:['i','n','d','e','p','e','n','d','e','n','ce'], clue:'Freedom to take care of yourself' },
    { word:'responsibility', prefix:'', base:'response', suffix1:'ible', suffix2:'ity', meaning:'A duty to deal with something or take care of someone', syllables:['re','spon','si','bil','i','ty'], phonemes:['r','e','s','p','o','n','s','i','b','i','l','i','t','y'], clue:'Being trusted to do the right thing' },
    { word:'disappearance', prefix:'dis', base:'appear', suffix1:'ance', suffix2:'', meaning:'The act of vanishing or ceasing to be visible', syllables:['dis','ap','pear','ance'], phonemes:['d','i','s','a','pp','ear','a','n','ce'], clue:'When something vanishes from sight' },
    { word:'environment', prefix:'en', base:'viron', suffix1:'ment', suffix2:'', meaning:'The natural world around us, or surrounding conditions', syllables:['en','vi','ron','ment'], phonemes:['e','n','v','i','r','o','n','m','e','n','t'], clue:'The world of nature around us' },
    { word:'communication', prefix:'', base:'communicate', suffix1:'ion', suffix2:'', meaning:'The sharing of information between people', syllables:['com','mu','ni','ca','tion'], phonemes:['c','o','mm','u','n','i','c','a','ti','o','n'], clue:'Sharing ideas with others' },
    { word:'overreaction', prefix:'over', base:'react', suffix1:'ion', suffix2:'', meaning:'A more emotional response than the situation calls for', syllables:['o','ver','re','ac','tion'], phonemes:['o','v','e','rr','ea','c','t','i','o','n'], clue:'Responding too strongly to something' },
    { word:'prediction', prefix:'pre', base:'dict', suffix1:'ion', suffix2:'', meaning:'A statement about what will happen in the future', syllables:['pre','dic','tion'], phonemes:['p','r','e','d','i','c','ti','o','n'], clue:'Saying what you think will happen next' },
    { word:'submarine', prefix:'sub', base:'marine', suffix1:'', suffix2:'', meaning:'A vessel that travels underwater', syllables:['sub','ma','rine'], phonemes:['s','u','b','m','a','r','i_e','n'], clue:'A boat that goes under the sea' },
    { word:'microscope', prefix:'micro', base:'scope', suffix1:'', suffix2:'', meaning:'An instrument for seeing very small things', syllables:['mi','cro','scope'], phonemes:['m','i','c','r','o','s','c','o_e','p'], clue:'A tool for looking at tiny things' },
    { word:'telephone', prefix:'tele', base:'phone', suffix1:'', suffix2:'', meaning:'A device for speaking to someone far away', syllables:['tel','e','phone'], phonemes:['t','e','l','e','ph','o_e','n'], clue:'A device for talking across distances' },
    { word:'invisible', prefix:'in', base:'vis', suffix1:'ible', suffix2:'', meaning:'Unable to be seen', syllables:['in','vis','i','ble'], phonemes:['i','n','v','i','s','i','b','le'], clue:'Something you cannot see' },
    { word:'supermarket', prefix:'super', base:'market', suffix1:'', suffix2:'', meaning:'A large shop selling food and household items', syllables:['su','per','mar','ket'], phonemes:['s','u','p','er','m','ar','k','e','t'], clue:'A big store where you buy groceries' },
    { word:'unhappiness', prefix:'un', base:'happy', suffix1:'ness', suffix2:'', meaning:'The state of not being happy; sadness', syllables:['un','hap','pi','ness'], phonemes:['u','n','h','a','pp','i','n','e','ss'], clue:'The feeling of being sad' },
    { word:'reconstruction', prefix:'re', base:'construct', suffix1:'ion', suffix2:'', meaning:'Building something again after it was damaged', syllables:['re','con','struc','tion'], phonemes:['r','e','c','o','n','s','t','r','u','c','ti','o','n'], clue:'Putting something back together' },
    { word:'autobiography', prefix:'auto', base:'bio', suffix1:'graphy', suffix2:'', meaning:'A book someone writes about their own life', syllables:['au','to','bi','og','ra','phy'], phonemes:['au','t','o','b','i','o','g','r','a','ph','y'], clue:'The story of your life, written by you' },
    { word:'malfunction', prefix:'mal', base:'function', suffix1:'', suffix2:'', meaning:'A failure to work correctly', syllables:['mal','func','tion'], phonemes:['m','a','l','f','u','n','c','ti','o','n'], clue:'When something stops working properly' },
    { word:'hyperactive', prefix:'hyper', base:'active', suffix1:'', suffix2:'', meaning:'Extremely active or energetic beyond normal levels', syllables:['hy','per','ac','tive'], phonemes:['h','y','p','er','a','c','t','i','ve'], clue:'Being extremely full of energy' },
    { word:'semicircle', prefix:'semi', base:'circle', suffix1:'', suffix2:'', meaning:'Half of a circle', syllables:['sem','i','cir','cle'], phonemes:['s','e','m','i','c','ir','c','le'], clue:'Exactly half of a round shape' },
    { word:'multicoloured', prefix:'multi', base:'colour', suffix1:'ed', suffix2:'', meaning:'Having many different colours', syllables:['mul','ti','col','oured'], phonemes:['m','u','l','t','i','c','o','l','our','ed'], clue:'Made up of lots of different colours' },
    { word:'nonfiction', prefix:'non', base:'fiction', suffix1:'', suffix2:'', meaning:'Writing based on real facts, not made-up stories', syllables:['non','fic','tion'], phonemes:['n','o','n','f','i','c','ti','o','n'], clue:'Books about real things, not stories' },
    { word:'forewarning', prefix:'fore', base:'warn', suffix1:'ing', suffix2:'', meaning:'Advance notice of something bad that might happen', syllables:['fore','warn','ing'], phonemes:['f','or','e','w','ar','n','i','ng'], clue:'Letting someone know danger is coming' },
    { word:'prehistoric', prefix:'pre', base:'histor', suffix1:'ic', suffix2:'', meaning:'From a time before written records', syllables:['pre','his','tor','ic'], phonemes:['p','r','e','h','i','s','t','or','i','c'], clue:'From a very, very long time ago' },
    { word:'export', prefix:'ex', base:'port', suffix1:'', suffix2:'', meaning:'To send goods to another country for sale', syllables:['ex','port'], phonemes:['e','x','p','or','t'], clue:'Sending products to other countries' },
    { word:'construct', prefix:'con', base:'struct', suffix1:'', suffix2:'', meaning:'To build or put together', syllables:['con','struct'], phonemes:['c','o','n','s','t','r','u','c','t'], clue:'To build something from parts' },
    { word:'transform', prefix:'trans', base:'form', suffix1:'', suffix2:'', meaning:'To change completely in form or appearance', syllables:['trans','form'], phonemes:['t','r','a','n','s','f','or','m'], clue:'To change into something different' },
    { word:'incredible', prefix:'in', base:'cred', suffix1:'ible', suffix2:'', meaning:'Too extraordinary to be believed; amazing', syllables:['in','cred','i','ble'], phonemes:['i','n','c','r','e','d','i','b','le'], clue:'So amazing it is hard to believe' },
    { word:'discovery', prefix:'dis', base:'cover', suffix1:'y', suffix2:'', meaning:'The act of finding something for the first time', syllables:['dis','cov','er','y'], phonemes:['d','i','s','c','o','v','er','y'], clue:'Finding something new or unknown' },
    { word:'impossible', prefix:'im', base:'possible', suffix1:'', suffix2:'', meaning:'Not able to happen or be done', syllables:['im','pos','si','ble'], phonemes:['i','m','p','o','ss','i','b','le'], clue:'Something that cannot be done' },
    { word:'adventure', prefix:'ad', base:'venture', suffix1:'', suffix2:'', meaning:'An exciting or unusual experience', syllables:['ad','ven','ture'], phonemes:['a','d','v','e','n','t','ure'], clue:'An exciting journey or experience' },
    { word:'photograph', prefix:'', base:'photo', suffix1:'graph', suffix2:'', meaning:'An image captured by a camera', syllables:['pho','to','graph'], phonemes:['ph','o','t','o','g','r','a','ph'], clue:'A picture taken with a camera' },
    { word:'benevolent', prefix:'bene', base:'vol', suffix1:'ent', suffix2:'', meaning:'Well-meaning and kind; wanting to help others', syllables:['be','nev','o','lent'], phonemes:['b','e','n','e','v','o','l','e','n','t'], clue:'Kind and wanting to do good' },
    { word:'unbreakable', prefix:'un', base:'break', suffix1:'able', suffix2:'', meaning:'Impossible to break', syllables:['un','break','a','ble'], phonemes:['u','n','b','r','ea','k','a','b','le'], clue:'So strong it cannot be broken' },
    { word:'misbehave', prefix:'mis', base:'behave', suffix1:'', suffix2:'', meaning:'To behave badly or break the rules', syllables:['mis','be','have'], phonemes:['m','i','s','b','e','h','a_e','v'], clue:'To act badly or break rules' },
    { word:'recycle', prefix:'re', base:'cycle', suffix1:'', suffix2:'', meaning:'To process used materials so they can be used again', syllables:['re','cy','cle'], phonemes:['r','e','c','y','c','le'], clue:'Using materials again instead of throwing them away' },
    { word:'anticlockwise', prefix:'anti', base:'clock', suffix1:'wise', suffix2:'', meaning:'In the opposite direction to clock hands', syllables:['an','ti','clock','wise'], phonemes:['a','n','t','i','c','l','o','ck','w','i_e','s'], clue:'The opposite direction to a clock' },
    { word:'underestimate', prefix:'under', base:'estimate', suffix1:'', suffix2:'', meaning:'To think something is less than it really is', syllables:['un','der','es','ti','mate'], phonemes:['u','n','d','er','e','s','t','i','m','a_e','t'], clue:'Guessing too low about something' },
    { word:'proactive', prefix:'pro', base:'active', suffix1:'', suffix2:'', meaning:'Creating or controlling a situation rather than just reacting', syllables:['pro','ac','tive'], phonemes:['p','r','o','a','c','t','i','ve'], clue:'Taking action before problems happen' },
    { word:'contradict', prefix:'contra', base:'dict', suffix1:'', suffix2:'', meaning:'To say the opposite of what someone else said', syllables:['con','tra','dict'], phonemes:['c','o','n','t','r','a','d','i','c','t'], clue:'To say the opposite of another person' },
    { word:'midpoint', prefix:'mid', base:'point', suffix1:'', suffix2:'', meaning:'The exact middle of something', syllables:['mid','point'], phonemes:['m','i','d','p','oi','n','t'], clue:'Exactly halfway between two things' },
    { word:'empowerment', prefix:'em', base:'power', suffix1:'ment', suffix2:'', meaning:'The process of becoming stronger and more confident', syllables:['em','pow','er','ment'], phonemes:['e','m','p','ow','er','m','e','n','t'], clue:'Gaining strength and confidence' },
    { word:'inspection', prefix:'in', base:'spect', suffix1:'ion', suffix2:'', meaning:'A careful examination or check of something', syllables:['in','spec','tion'], phonemes:['i','n','s','p','e','c','ti','o','n'], clue:'Looking closely to check something' },
    { word:'destruction', prefix:'de', base:'struct', suffix1:'ion', suffix2:'', meaning:'The act of destroying or being destroyed', syllables:['de','struc','tion'], phonemes:['d','e','s','t','r','u','c','ti','o','n'], clue:'Completely breaking or ruining something' },
    { word:'bilingual', prefix:'bi', base:'lingu', suffix1:'al', suffix2:'', meaning:'Able to speak two languages fluently', syllables:['bi','lin','gual'], phonemes:['b','i','l','i','n','g','u','a','l'], clue:'Speaking two languages well' },
    { word:'megaphone', prefix:'mega', base:'phone', suffix1:'', suffix2:'', meaning:'A cone-shaped device for making your voice louder', syllables:['meg','a','phone'], phonemes:['m','e','g','a','ph','o_e','n'], clue:'A device that makes your voice louder' },
  ];

  function getWordOfTheWeek() {
    var now = new Date();
    var start = new Date(2026, 0, 5);
    var weekNum = Math.floor((now - start) / (7 * 86400000));
    var idx = ((weekNum % WOTW_LIST.length) + WOTW_LIST.length) % WOTW_LIST.length;
    return WOTW_LIST[idx];
  }

  return {
    getTeacherSession, getTeacherRecord, requireTeacherAuth, teacherSignOut, _sb: sb,
    sbFetchAllRows,
    createClass, getClasses, getClass, verifyPassword,
    addStudent, addStudentsBulk, removeStudent, deleteClass, regenerateStudentCode,
    getClassTeachers, getClassTeacherCandidates, getClassTeacherHistory, addClassTeacher, removeClassTeacher,
    lookupClassByCode, verifyStudentCode, verifyStudentByName,
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
    getStudentStage, filterByStage, weightByStage, nextByStage, orderByStage,
    isLowStimMode, loadLowStimMode,
    isSupportMode, setSupportMode, loadSupportMode,
    checkDailyLimit, incrementDailyUsage, getSchoolPlan, isAiEnabled, getClassRoster, _sessionRead,
    getDailyChallenges, updateChallengeProgress, claimChallengeReward, updateDailyStreak, CHALLENGE_GAMES,
    getFeaturedGame, loadFeaturedGame, getLeastPlayedGames, getBonusDayMultiplier,
    getWordCorrections, applyCorrections,
    getCustomWords, getCustomWordPriority,
    getCustomMorphemes, getCustomMorphemePriority,
    getSpellingSetWords, recordSpellingAttempt,
    getFocusWords, addFocusWords, removeFocusWords, clearFocusWords, saveCheckInResult,
    fixMorphemeIds: _fixMorphemeIds,
    getEALDLanguage, getEALDLanguageName, getTranslations, createEALDPill, injectEALDStyles, EALD_LANGUAGES, EALD_TTS_CODES,
    speakInLanguage, preloadTTS, buildEALDSpeakButtons, buildEALDRevealButton, _speakEALD,
    escapeHtml,
    getWordOfTheWeek,
    sbCall,
    _sb: sb,
    _sbCall: sbCall
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

// Auto-apply low-stim mode CSS class and inject suppression stylesheet.
// Adds a <style> element rather than using document.write: most game pages load this file with
// `defer`, and browsers ignore document.write from deferred scripts, so the low-stim styles were
// never added on those pages. Appending works whether this file runs during parse or deferred.
if (sessionStorage.getItem('wl_low_stim') === 'true') {
  document.documentElement.classList.add('low-stim');
  // Pages also check body.low-stim (Word Study's scene, the calm scroll in Meaning Match-Up and
  // Mission Mode, landing celebrations); add it to body as well, once body exists.
  if (document.body) document.body.classList.add('low-stim');
  else document.addEventListener('DOMContentLoaded', function () {
    if (sessionStorage.getItem('wl_low_stim') === 'true') document.body.classList.add('low-stim');
  });
  (function (css) {
    if (document.getElementById('wlLowStimCSS')) return;
    var st = document.createElement('style');
    st.id = 'wlLowStimCSS';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  })(
    /* Hide gamification UI across all pages */
    '.low-stim .pill.score,' +
    '.low-stim .pill.streak,' +
    '.low-stim .bonus-strip,' +
    '.low-stim .tryme-badge,' +
    '.low-stim .top3-block,' +
    '.low-stim .strip-challenges-block,' +
    '.low-stim .hub-flame-wrap { display:none !important; }' +

    /* Suppress scientist animations but keep character visible */
    '.low-stim #sciCharWrap { animation:none !important; }' +
    '.low-stim #sciCharWrap.sci-correct,' +
    '.low-stim #sciCharWrap.sci-wrong,' +
    '.low-stim #sciCharWrap.sci-streak { animation:none !important; }' +

    /* Suppress pet idle bob (pet reactions already gated in react()) */
    '.low-stim #petCharWrap { animation:none !important; }' +

    /* Suppress focus game glow */
    '.low-stim .act-card.focus-glow { box-shadow:none !important; animation:none !important; }' +
    '.low-stim .act-card { animation:none !important; }' +

    /* Tone down correct/wrong feedback to simple subtle bg */
    '.low-stim .correct-flash { animation:none !important; }' +
    '.low-stim .wrong-flash { animation:none !important; }' +

    /* Hide quarks/XP stat pills on landing hub */
    '.low-stim .stat-pill-item:nth-child(1),' +
    '.low-stim .stat-pill-item:nth-child(2) { display:none !important; }' +

    /* Hide scientist avatar in landing status strip */
    '.low-stim .student-sci-avatar { display:none !important; }' +

    /* Suppress confetti canvas */
    '.low-stim canvas.confetti-canvas { display:none !important; }'
  );
}

// Auto-apply support mode CSS class on page load.
if (sessionStorage.getItem('wl_support_mode') === 'true') {
  document.documentElement.classList.add('support-mode');
}
