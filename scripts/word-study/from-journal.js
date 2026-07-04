// Extracts generated entries from one or more workflow journals into raw-generated.json.
// Later journals win on word conflicts (so a backfill retry overwrites a bad first attempt).
// Usage: node scripts/word-study/from-journal.js <journal.jsonl> [<journal2.jsonl> ...]
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../');
const R = f => path.join(ROOT, f);

const journalPaths = process.argv.slice(2);
if (!journalPaths.length) { console.error('usage: from-journal.js <journal.jsonl> [more...]'); process.exit(1); }

const byWord = {};
let total = 0, overwrites = 0;
journalPaths.forEach(jp => {
  const lines = fs.readFileSync(jp, 'utf8').trim().split('\n').map(l => JSON.parse(l));
  lines.filter(l => l.type === 'result').forEach(r => {
    const v = r.result || r.value || r.data || r.output;
    if (v && Array.isArray(v.entries)) v.entries.forEach(e => {
      if (e && e.word) { total++; if (byWord[e.word]) overwrites++; byWord[e.word] = e; }
    });
  });
});
const entries = Object.values(byWord);
fs.writeFileSync(R('scripts/word-study/raw-generated.json'), JSON.stringify(entries));
console.log('journals:', journalPaths.length, '| entries seen:', total, '| unique:', entries.length, '| overwritten (later-wins):', overwrites);
