// Extracts generated entries from a workflow journal.jsonl into raw-generated.json.
// Usage: node scripts/word-study/from-journal.js <path-to-journal.jsonl>
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../');
const R = f => path.join(ROOT, f);

const journalPath = process.argv[2];
if (!journalPath) { console.error('usage: from-journal.js <journal.jsonl>'); process.exit(1); }

const lines = fs.readFileSync(journalPath, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const results = lines.filter(l => l.type === 'result');

const byWord = {};
let dupes = 0;
results.forEach(r => {
  const v = r.result || r.value || r.data || r.output;
  if (v && Array.isArray(v.entries)) v.entries.forEach(e => {
    if (e && e.word) { if (byWord[e.word]) dupes++; else byWord[e.word] = e; }
  });
});
const entries = Object.values(byWord);
fs.writeFileSync(R('scripts/word-study/raw-generated.json'), JSON.stringify(entries));
console.log('result lines:', results.length, '| unique entries:', entries.length, '| duplicate words skipped:', dupes);
