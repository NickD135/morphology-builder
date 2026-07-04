// Patches regenerated phonemes into raw-generated.json, but ONLY when the new split still passes
// the phoneme invariant (letter multiset + magic-e). Bad re-segments keep their original phonemes.
// Usage: node scripts/word-study/patch-phonemes.js <regen-journal.jsonl>
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../');
const R = f => path.join(ROOT, f);
const V = require('./invariants');

const journalPath = process.argv[2];
if (!journalPath) { console.error('usage: patch-phonemes.js <regen-journal.jsonl>'); process.exit(1); }

// collect regenerated {word -> phonemes}
const newPhon = {};
fs.readFileSync(journalPath, 'utf8').trim().split('\n').map(l => JSON.parse(l))
  .filter(l => l.type === 'result')
  .forEach(r => { const v = r.result; if (v && Array.isArray(v.entries)) v.entries.forEach(e => { if (e.word && Array.isArray(e.phonemes)) newPhon[e.word] = e.phonemes; }); });

const raw = JSON.parse(fs.readFileSync(R('scripts/word-study/raw-generated.json'), 'utf8'));
let applied = 0, skipped = 0;
const skippedWords = [];
raw.forEach(e => {
  const np = newPhon[e.word];
  if (!np) return;
  const check = V.checkPhonemes({ word: e.word, phonemes: np });
  if (check.ok) { e.phonemes = np; applied++; }
  else { skipped++; skippedWords.push(e.word + ' (' + check.msg + ')'); }
});
fs.writeFileSync(R('scripts/word-study/raw-generated.json'), JSON.stringify(raw));
console.log('regenerated words:', Object.keys(newPhon).length, '| applied:', applied, '| skipped (kept original):', skipped);
if (skippedWords.length) console.log('skipped:', skippedWords.slice(0, 20).join(', '));
