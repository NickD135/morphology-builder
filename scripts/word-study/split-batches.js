// Splits manifest.json into per-agent batch files the generation workflow's agents Read directly.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../');
const R = f => path.join(ROOT, f);
const BATCH = 25;

const manifest = JSON.parse(fs.readFileSync(R('scripts/word-study/manifest.json'), 'utf8'));
const dir = R('scripts/word-study/batches');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

let count = 0;
for (let i = 0; i < manifest.length; i += BATCH) {
  // agents only need word + stage + reuse to author; keep batch files lean
  const slice = manifest.slice(i, i + BATCH).map(m => ({ word: m.word, stage: m.stage, reuse: m.reuse }));
  fs.writeFileSync(path.join(dir, 'batch-' + count + '.json'), JSON.stringify(slice));
  count++;
}
fs.writeFileSync(path.join(dir, '_meta.json'), JSON.stringify({ count, batch: BATCH, dir }));
console.log('wrote', count, 'batch files of up to', BATCH, 'words to', dir);
