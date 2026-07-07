// scripts/deck-accuracy/apply-qa.js
// Merge fable QA corrections (scripts/deck-accuracy/qa-out.json) into word-study-data.js,
// each gated by the real invariants. Phonemes applied if checkPhonemes passes; syllables
// applied (syllablesSource='fable') if checkSyllables passes. Anything that fails the gate
// is left unchanged and reported.
const fs = require('fs'), path = require('path');
const inv = require('../word-study/invariants.js');
const WS = path.join(__dirname, '../../word-study-data.js');
const OUT = path.join(__dirname, 'qa-out.json');
const INPUT = path.join(__dirname, 'qa-input.json');

const corrections = JSON.parse(fs.readFileSync(OUT, 'utf8'));
const byWord = new Map(corrections.map(c => [c.word, c]));
const fixSpec = new Map(JSON.parse(fs.readFileSync(INPUT,'utf8')).map(x => [x.word, x.fix]));

const lines = fs.readFileSync(WS, 'utf8').split('\n');
let phApplied=0, phRej=0, sylApplied=0, sylRej=0;
const rejects = [];
for (let i=0;i<lines.length;i++){
  const m = lines[i].match(/^  (\{.*\}),?$/); if(!m) continue;
  const obj = JSON.parse(m[1]);
  const c = byWord.get(obj.word); if(!c) continue;
  const fix = fixSpec.get(obj.word) || [];
  let touched = false;
  if (fix.includes('phonemes') && Array.isArray(c.phonemes)){
    const prev = obj.phonemes; obj.phonemes = c.phonemes;
    if (inv.checkPhonemes(obj).ok){ phApplied++; touched=true; }
    else { obj.phonemes = prev; phRej++; rejects.push(obj.word+':phon'); }
  }
  if (fix.includes('syllables') && Array.isArray(c.syllables)){
    const prev = obj.syllables, prevSrc = obj.syllablesSource;
    obj.syllables = c.syllables; obj.syllablesSource = 'fable';
    if (inv.checkSyllables(obj).ok){ sylApplied++; touched=true; }
    else { obj.syllables = prev; obj.syllablesSource = prevSrc; sylRej++; rejects.push(obj.word+':syl'); }
  }
  if (touched) lines[i] = '  '+JSON.stringify(obj)+(lines[i].endsWith(',')?',':'');
}
fs.writeFileSync(WS, lines.join('\n'));
console.log(JSON.stringify({phApplied, phRej, sylApplied, sylRej, rejects}));
