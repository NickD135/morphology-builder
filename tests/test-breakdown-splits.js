// Checks that every Breakdown Blitz word can be rebuilt from its own answer parts.
// Run: node tests/test-breakdown-splits.js
// A word passes when prefix + base + suffix1 + suffix2 gives the word, allowing only the
// spelling changes the game explains to students: drop the final e before a vowel suffix,
// change y to i, or double the final consonant.
'use strict';
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'breakdown-mode.html'), 'utf8');
const m = html.match(/const MISSIONS=(\[[\s\S]*?\]);\s*\n/);
if (!m) { console.error('Could not find MISSIONS in breakdown-mode.html'); process.exit(1); }
const MISSIONS = Function('"use strict";return (' + m[1] + ');')();

const VOWEL = /^[aeiouy]/;
// Every way the end of `left` can join onto `right`.
function joins(left, right) {
  if (!right) return [left];
  const out = [left + right];
  if (/e$/.test(left) && VOWEL.test(right)) out.push(left.slice(0, -1) + right);
  if (/[^aeiou]y$/.test(left) && !/^i/.test(right)) out.push(left.slice(0, -1) + 'i' + right);
  if (/[aeiou][bdgklmnprt]$/.test(left) && VOWEL.test(right)) out.push(left + left.slice(-1) + right);
  return out;
}

function rebuilds(q) {
  const a = q.answers;
  let forms = [(a.prefix || '') + a.base];
  for (const s of [a.suffix1, a.suffix2]) {
    if (!s) continue;
    forms = forms.flatMap(f => joins(f, s));
  }
  return forms.includes(q.word);
}

let fail = 0;
const seen = new Set();
for (const q of MISSIONS) {
  if (!q.answers || !q.answers.base) { console.log('NO BASE   ', q.word); fail++; continue; }
  if (seen.has(q.word)) { console.log('DUPLICATE ', q.word); fail++; }
  seen.add(q.word);
  if (!q.answers.suffix1 && q.answers.suffix2) { console.log('GAP       ', q.word, '(suffix2 without suffix1)'); fail++; }
  if (!rebuilds(q)) {
    const a = q.answers;
    console.log('NO REBUILD', q.word.padEnd(20), [a.prefix, a.base, a.suffix1, a.suffix2].join(' + '));
    fail++;
  }
}
console.log(`${MISSIONS.length} words checked, ${fail} problem(s).`);
process.exit(fail ? 1 : 0);
