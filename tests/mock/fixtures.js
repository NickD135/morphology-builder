/*
 * Word Labs mock mode: FAKE data only.
 *
 * Everything here is invented. No real student, teacher, school or class
 * data may ever be added to this file. Served by tests/mock/server.js as part
 * of /__mock/supabase-mock.js and loaded in place of the real Supabase client.
 *
 * The four students are chosen to cover the agent's Year 5/6 student lens:
 *   Ava   typical Year 5/6 student (stage s3e)
 *   Ben   reads below level, Support Mode on (stage s2l)
 *   Chloe finishes early, extension on (stage s4)
 *   Dev   EAL/D learner, Vietnamese translations (stage s3l)
 */
(function (root) {
  var NOW = '2026-10-01T09:00:00.000Z';
  var SCHOOL = 'mock-school-0001';
  var TEACHER_AUTH = 'mock-auth-teacher-0001';
  var CLASS = 'mock-class-0006a';

  function student(id, name, code, extra) {
    var s = {
      id: id, class_id: CLASS, name: name, student_code: code,
      extension_mode: false, extension_activities: [], support_mode: false,
      eald_language: null, stage: 's3e', stage_overrides: {}, focus_words: []
    };
    for (var k in extra) s[k] = extra[k];
    return s;
  }

  function character(id, quarks, xp, badges) {
    return {
      student_id: id, quarks: quarks, xp: xp, badges: badges,
      scientist: { skinTone: '#E0AC69', owned: [] },
      stats: null, updated_at: NOW
    };
  }

  function progress(sid, activity, category, correct, total) {
    return {
      id: 'mock-prog-' + sid.slice(-4) + '-' + activity + '-' + category.replace(/[^a-z0-9]/gi, ''),
      student_id: sid, activity: activity, category: category,
      correct: correct, total: total, total_time: total * 6000,
      is_extension: false, updated_at: NOW
    };
  }

  var AVA = 'mock-student-0001', BEN = 'mock-student-0002',
      CHLOE = 'mock-student-0003', DEV = 'mock-student-0004';

  root.__WL_MOCK_FIXTURES__ = {
    teacher: {
      authUserId: TEACHER_AUTH,
      email: 'mock.teacher@example.test'
    },
    // Logins for the helper and for manual testing.
    logins: {
      classCode: 'MOCK6A',
      students: {
        ava:   { id: AVA,   name: 'Ava',   code: 'AVA' },
        ben:   { id: BEN,   name: 'Ben',   code: 'BEN' },
        chloe: { id: CHLOE, name: 'Chloe', code: 'CHL' },
        dev:   { id: DEV,   name: 'Dev',   code: 'DEV' }
      }
    },
    tables: {
      schools: [{
        id: SCHOOL, name: 'Mock Primary School (fake data)', postcode: '2000',
        plan: 'active', trial_ends_at: null, stripe_customer_id: null,
        student_limit: 200, invite_code: 'MOCKINV', created_at: NOW
      }],
      teachers: [{
        id: 'mock-teacher-0001', auth_user_id: TEACHER_AUTH, school_id: SCHOOL,
        email: 'mock.teacher@example.test', plan: 'active', scientist: null, created_at: NOW
      }],
      teacher_accounts: [],
      classes: [{
        id: CLASS, name: 'Mock Class 6A', class_code: 'MOCK6A',
        auth_user_id: TEACHER_AUTH, school_id: SCHOOL, teacher_password: null,
        settings: {}, created_at: NOW
      }],
      students: [
        student(AVA,   'Ava',   'AVA', { stage: 's3e' }),
        student(BEN,   'Ben',   'BEN', { stage: 's2l', support_mode: true }),
        student(CHLOE, 'Chloe', 'CHL', { stage: 's4',  extension_mode: true }),
        student(DEV,   'Dev',   'DEV', { stage: 's3l', eald_language: 'vi' })
      ],
      student_character: [
        character(AVA, 320, 1450, ['first_correct', 'answered_50', 'quarks_100']),
        character(BEN, 60, 240, ['first_correct']),
        character(CHLOE, 910, 4200, ['first_correct', 'answered_50', 'answered_100', 'quarks_100', 'quarks_500', 'xp_level5']),
        character(DEV, 150, 700, ['first_correct', 'answered_50'])
      ],
      student_progress: [
        progress(AVA, 'breakdown-blitz', 'unhappiness', 3, 4),
        progress(AVA, 'meaning-mode', 'prefix:re', 5, 6),
        progress(AVA, 'phoneme-splitter', 'Starter:bridge', 2, 3),
        progress(BEN, 'syllable-splitter', '2 syllables:tiger', 1, 3),
        progress(BEN, 'sound-sorter', 'Long A:ai', 2, 5),
        progress(CHLOE, 'root-lab', 'Challenge:telescope', 4, 4),
        progress(CHLOE, 'mission-mode', 'suffix:ness', 6, 6),
        progress(DEV, 'homophone-hunter', "mode1:there/their/they're", 2, 4)
      ],
      daily_usage: [],
      class_word_lists: [],
      word_list_assignments: [],
      class_morphemes: [],
      morpheme_set_assignments: [],
      class_spelling_sets: [],
      spelling_set_assignments: [],
      spelling_check_in_results: [],
      word_corrections: [],
      shop_items: [],
      translations: [],
      feedback: [],
      resources: [],
      solo_resources: [],
      solo_progress: [],
      solo_show_completions: [],
      solo_show_attempts: [],
      solo_test_snapshots: [],
      solo_review_results: [],
      solo_reflections: [],
      solo_assessment_reflections: [],
      solo_hidden_students: []
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
