/**
 * Rapid-fire recordAttempt race condition test
 *
 * Run this in the browser console while logged in as a student.
 * It fires N concurrent increment_progress RPC calls and checks
 * that the final DB count matches exactly.
 *
 * Usage:
 *   1. Open any game page (e.g. phoneme-mode.html) as a logged-in student
 *   2. Open DevTools console
 *   3. Paste this entire script and press Enter
 *   4. Wait for results (~5 seconds)
 */
(async function testRapidFire() {
  'use strict';

  const N = 20; // number of concurrent calls
  const TEST_ACTIVITY = '__racetest__';
  const TEST_CATEGORY = '__racetest_cat__';

  // Get Supabase client and student session
  var sb = WordLabData._sb();
  var session = JSON.parse(sessionStorage.getItem('wordlab_session_v1'));
  if (!sb) { console.error('ERROR: Supabase client not found'); return; }
  if (!session || !session.studentId) { console.error('ERROR: No student session — log in first'); return; }

  var studentId = session.studentId;
  console.log('--- Rapid-fire test: ' + N + ' concurrent calls ---');
  console.log('Student ID:', studentId);

  // Step 1: Clean up any previous test data
  // (increment_progress uses SECURITY DEFINER so we use RPC, but we can read via select)
  var { data: before } = await sb.from('student_progress')
    .select('correct, total')
    .eq('student_id', studentId)
    .eq('activity', TEST_ACTIVITY)
    .eq('category', TEST_CATEGORY)
    .maybeSingle();

  var startCorrect = before ? before.correct : 0;
  var startTotal = before ? before.total : 0;
  console.log('Before: correct=' + startCorrect + ', total=' + startTotal);

  // Step 2: Fire N concurrent calls — all "correct"
  var correctCalls = N;
  var promises = [];
  for (var i = 0; i < N; i++) {
    promises.push(
      sb.rpc('increment_progress', {
        p_student_id: studentId,
        p_activity: TEST_ACTIVITY,
        p_category: TEST_CATEGORY,
        p_correct: true,
        p_time_ms: 100,
        p_is_extension: false
      })
    );
  }

  var results = await Promise.allSettled(promises);
  var failed = results.filter(function(r) { return r.status === 'rejected' || (r.value && r.value.error); });
  if (failed.length) {
    console.error('FAILED calls:', failed.length);
    failed.forEach(function(f) { console.error(f); });
  }

  // Step 3: Read final counts
  var { data: after } = await sb.from('student_progress')
    .select('correct, total')
    .eq('student_id', studentId)
    .eq('activity', TEST_ACTIVITY)
    .eq('category', TEST_CATEGORY)
    .maybeSingle();

  var endCorrect = after ? after.correct : 0;
  var endTotal = after ? after.total : 0;
  var diffCorrect = endCorrect - startCorrect;
  var diffTotal = endTotal - startTotal;

  console.log('After:  correct=' + endCorrect + ', total=' + endTotal);
  console.log('Delta:  correct=+' + diffCorrect + ', total=+' + diffTotal);

  // Step 4: Verify
  if (diffCorrect === correctCalls && diffTotal === N) {
    console.log('%c PASS: All ' + N + ' increments landed correctly. No race condition.', 'color: green; font-weight: bold;');
  } else {
    console.error('FAIL: Expected +' + correctCalls + ' correct, +' + N + ' total. Got +' + diffCorrect + ' correct, +' + diffTotal + ' total.');
    console.error('Lost ' + (N - diffTotal) + ' total increments and ' + (correctCalls - diffCorrect) + ' correct increments.');
  }

  // Step 5: Clean up test data
  // We can't delete via client (RLS blocks anon deletes on student_progress).
  // Leave it — the __racetest__ activity won't appear in any game or dashboard.
  console.log('Note: test data left in DB under activity "' + TEST_ACTIVITY + '" (harmless, won\'t show in UI)');
  console.log('--- Test complete ---');
})();
