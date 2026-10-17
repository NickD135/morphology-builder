// SOLO tracker: check that Know practice is fair practice, not a copy of the Show assessment.
//
//   node tests/test-solo-know-show.js            report every unit, check the fixed units
//   node tests/test-solo-know-show.js u36        check one unit in full
//
// For every unit it reports how many Know questions are word for word copies of a Show question.
// For the units in CHECKED (rewritten so far) it fails if:
//   - a Know question or a Grow try-it repeats a Show or pre-test question, or Know repeats a try-it
//   - a Know question, try-it, Grow hook or worked example uses the same numbers as a Show or pre-test
//     question in the same outcome (two or more different numbers, same signs, in any order)
//   - a Know question has no hint or no why line
//   - an mc question does not have 4 different options with the answer among them
//   - an order question's answer is not the same items as its tiles
//   - a hint contains the answer (whole word or number match)
// Data is read straight from the plain <script> block at the top of solo/index.html.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CHECKED = ['u36'];

const file = path.join(__dirname, '..', 'solo', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const start = html.indexOf('<script>', html.indexOf('babel.min.js')) + '<script>'.length;
const end = html.indexOf('</script>', start);
const ctx = { window: {}, document: {}, console };
vm.createContext(ctx);
vm.runInContext(html.slice(start, end) + '\n;this.__D={UNITS,PRETESTS,PRACTICE,LEARN};', ctx);
const { UNITS, PRETESTS, PRACTICE, LEARN } = ctx.__D;

const norm = s => String(s == null ? '' : s).toLowerCase().replace(/[…?.!:]+$/g, '').replace(/\s+/g, ' ').trim();
// Table and order questions share a text line, so the data is part of the key.
const key = q => norm(q.text || q.question) + (q.cols ? JSON.stringify(q.cols) : '') + (q.items ? JSON.stringify(q.items) : '');
// The numbers in a question (fractions, decimals, whole numbers), sorted. Two questions with the
// same numbers are the same sum in different words, e.g. "Compare ⅔ and ⅚" and "Which is bigger: ⅔ or ⅚?".
// Signs count too, so "½ + ¼" and "½ − ¼" are different sums. Only checked within one outcome.
const nums = t => { const m = String(t || '').match(/\d+\/\d+|\d*[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|\d+(\.\d+)?|[+−×÷]/g) || []; return new Set(m.filter(x => !/[+−×÷]/.test(x))).size >= 2 ? m.sort().join(' ') : ''; };
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const containsAnswer = (hint, ans) => {
  const a = String(ans).trim();
  if (!a || a === 'true' || a === 'false') return false;
  return new RegExp('(^|[^0-9A-Za-z/.])' + esc(a) + '($|[^0-9A-Za-z/])', 'i').test(hint);
};

const only = process.argv[2];
let problems = 0;
const fail = (u, msg) => { problems++; console.log('  ✗ ' + u + ' ' + msg); };

console.log('Know questions that copy a Show question word for word:');
for (const unit of UNITS) {
  if (only && unit.id !== only) continue;
  let know = 0, copies = 0;
  for (const o of unit.outcomes) {
    const P = PRACTICE[unit.id + '_' + o.id];
    if (!P) continue;
    const show = new Set(o.questions.map(key));
    for (const q of P.questions || []) { know++; if (show.has(key(q))) copies++; }
  }
  console.log('  ' + unit.id + ': ' + copies + ' of ' + know + (CHECKED.includes(unit.id) ? '  (checked)' : ''));
}

for (const unit of UNITS) {
  if (!CHECKED.includes(unit.id) && unit.id !== only) continue;
  if (only && unit.id !== only) continue;
  console.log('\nChecking ' + unit.id + ' in full');
  const assess = new Map();
  for (const o of unit.outcomes) for (const q of o.questions) assess.set(key(q), 'Show ' + o.id);
  for (const p of PRETESTS[unit.id] || []) for (const q of p.questions) assess.set(key(q), 'pre-test ' + p.outcomeId);
  const assessNums = new Map();
  for (const o of unit.outcomes) for (const q of o.questions) { const n = nums(q.text); if (n) assessNums.set(o.id + '|' + n, 'Show: ' + q.text); }
  for (const p of PRETESTS[unit.id] || []) for (const q of p.questions) { const n = nums(q.text); if (n) assessNums.set(p.outcomeId + '|' + n, 'pre-test: ' + q.text); }
  const sameSum = (where, t) => { const n = nums(t); if (n && assessNums.has(where + '|' + n)) fail(where, 'uses the same numbers as ' + assessNums.get(where + '|' + n) + '  <-  ' + t); };
  const tries = new Map();
  let count = 0;
  for (const o of unit.outcomes) {
    const k = unit.id + '_' + o.id;
    const L = LEARN[k];
    if (L && L.hook) sameSum(o.id, L.hook.question);
    if (L && L.workedExample) sameSum(o.id, L.workedExample.problem);
    for (const t of (L && L.tryIt) || []) {
      sameSum(o.id, t.question);
      const n = key(t);
      if (assess.has(n)) fail(o.id, 'Grow try-it repeats ' + assess.get(n) + ': ' + t.question);
      if (!t.hints || t.hints.length !== 3) fail(o.id, 'Grow try-it needs 3 hints: ' + t.question);
      tries.set(n, o.id);
    }
    const P = PRACTICE[k];
    if (!P) { fail(o.id, 'has no Know practice'); continue; }
    const seen = new Set();
    for (const q of P.questions) {
      count++;
      const n = key(q);
      if (assess.has(n)) fail(o.id, 'Know repeats ' + assess.get(n) + ': ' + q.text);
      if (tries.has(n)) fail(o.id, 'Know repeats a Grow try-it: ' + q.text);
      sameSum(o.id, q.text);
      if (seen.has(n)) fail(o.id, 'Know question appears twice: ' + q.text);
      seen.add(n);
      if (!q.hint) fail(o.id, 'no hint: ' + q.text);
      if (!q.why) fail(o.id, 'no why: ' + q.text);
      if (q.type === 'mc') {
        if (!q.options || q.options.length !== 4) fail(o.id, 'mc needs 4 options: ' + q.text);
        else if (new Set(q.options.map(norm)).size !== 4) fail(o.id, 'mc has a repeated option: ' + q.text);
        if (!q.options || !q.options.includes(q.answer)) fail(o.id, 'answer not in options: ' + q.text);
      }
      if (q.type === 'truefalse' && !['true', 'false'].includes(q.answer)) fail(o.id, 'true/false answer: ' + q.text);
      if (q.type === 'order' && JSON.stringify([...q.items].sort()) !== JSON.stringify([...q.answer].sort())) fail(o.id, 'order answer and tiles differ: ' + q.text);
      if (q.type === 'order' && JSON.stringify(q.items) === JSON.stringify(q.answer)) fail(o.id, 'order tiles already in order: ' + q.text);
      const answers = q.type === 'order' ? [] : [q.answer].concat(q.aliases || []);
      for (const a of answers) if (q.hint && containsAnswer(q.hint, a)) fail(o.id, 'hint contains the answer "' + a + '": ' + q.text);
    }
  }
  console.log('  ' + count + ' Know questions checked');
}

console.log(problems ? '\n' + problems + ' problem(s)' : '\n0 problems');
process.exit(problems ? 1 : 0);
