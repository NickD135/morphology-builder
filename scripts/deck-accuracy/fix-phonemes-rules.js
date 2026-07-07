// scripts/deck-accuracy/fix-phonemes-rules.js
// Deterministic reconciliation of phoneme grapheme-splits to the app's taught grapheme set
// (scripts/word-study/taught-graphemes.json). Fixes two systematic word-study conventions:
//   1. -tion/-sion/-cian /sh/ ending  -> ti/si/ci + o/a + n   (action = a/c/ti/o/n)
//   2. word-final /ng/                 -> "ng"                 (believing = ...i/ng)
// Every change is gated by invariants.checkPhonemes; if a rewrite fails the gate it is skipped
// (left for fable QA). Magic-e words (grapheme contains '_') are skipped here — grapheme order
// doesn't track letter order for them, so they go to fable. Run with --dry to preview counts.
const fs = require('fs'), path = require('path');
const inv = require('../word-study/invariants.js');
const WS = path.join(__dirname, '../../word-study-data.js');
const DRY = process.argv.includes('--dry');

// /sh/-making grapheme patterns: replace the tio/sio/cia grouping wherever it occurs
// (handles inflections: actions, national, functioning, mansions, musicians).
// Anchored on the "...n"/"...a" so it only matches the reliable /sh/ spellings, not patio/radio.
const SH_PATTERNS = [
  [['t','io','n'], ['ti','o','n']],
  [['t','i','o','n'], ['ti','o','n']],
  [['s','io','n'], ['si','o','n']],
  [['s','i','o','n'], ['si','o','n']],
  [['c','ia','n'], ['ci','a','n']],
  [['c','i','a','n'], ['ci','a','n']],
];
function seqEq(a, b, i){ for (let k=0;k<b.length;k++) if (a[i+k]!==b[k]) return false; return true; }
function fixSh(word, ph){
  let out = ph.slice(), changed = false;
  for (const [from, to] of SH_PATTERNS){
    for (let i=0;i+from.length<=out.length;i++){
      if (seqEq(out, from, i)){ out = out.slice(0,i).concat(to, out.slice(i+from.length)); changed = true; i += to.length-1; }
    }
  }
  return changed ? out : null;
}

// word-final /ng/: last two graphemes n,g -> ng
function fixNg(word, ph){
  if (!word.endsWith('ng')) return null;
  if (ph.length>=2 && ph[ph.length-1]==='g' && ph[ph.length-2]==='n')
    return ph.slice(0,-2).concat(['ng']);
  return null;
}

const t = fs.readFileSync(WS,'utf8');
const lines = t.split('\n');
let sh=0, ng=0, skippedGate=0, skippedMagicE=0;
for (let i=0;i<lines.length;i++){
  const m = lines[i].match(/^  (\{.*\}),?$/); if(!m) continue;
  const obj = JSON.parse(m[1]);
  const ph = obj.phonemes; if(!Array.isArray(ph)) continue;
  const word = String(obj.word).toLowerCase();
  if (ph.some(g=>String(g).includes('_'))) { // magic-e: leave to fable
    if (word.endsWith('tion')||word.endsWith('sion')||word.endsWith('cian')||word.endsWith('ng')) skippedMagicE++;
    continue;
  }
  if (ph.join('') !== word) continue;        // only touch clean joinable splits
  let next = fixSh(word, ph);
  let kind = next ? 'sh' : null;
  if (!next){ next = fixNg(word, ph); kind = next ? 'ng' : null; }
  if (!next) continue;
  const trial = Object.assign({}, obj, {phonemes: next});
  if (!inv.checkPhonemes(trial).ok){ skippedGate++; continue; }
  if (kind==='sh') sh++; else ng++;
  obj.phonemes = next;
  if (!DRY) lines[i] = '  '+JSON.stringify(obj)+(lines[i].endsWith(',')?',':'');
}
if (!DRY) fs.writeFileSync(WS, lines.join('\n'));
console.log(JSON.stringify({dry:DRY, shFixed:sh, ngFixed:ng, skippedGate, skippedMagicE}));
