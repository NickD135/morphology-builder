const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../');
const R = f => path.join(ROOT, f);

// 1. morpheme id -> meaning + stage, from data.js (needs a window shim)
global.window = {};
require(R('data.js'));
const M = global.window.MORPHEMES; // { prefixes:[], suffixes:[], bases:[] }
const MEANING = {};
const STAGE = {};
['prefixes','suffixes','bases'].forEach(group => (M[group]||[]).forEach(m => {
  MEANING[m.id] = m.meaning; STAGE[m.id] = m.stage;
}));

// 2. extract inline WORDS arrays from the game pages (trusted local code)
function extractArray(file, name){
  const s = fs.readFileSync(R(file),'utf8');
  const i = s.indexOf('const '+name+' = [');
  const start = s.indexOf('[', i);
  let d=0,j=start;
  for(; j<s.length; j++){ if(s[j]==='[')d++; else if(s[j]===']'){ d--; if(d===0){ j++; break; } } }
  return Function('return '+s.slice(start,j))();
}
const sylPool = {}; extractArray('syllable-mode.html','WORDS').forEach(w=>{ if(w.word&&w.syllables) sylPool[w.word]=w.syllables; });
const phoPool = {}; extractArray('phoneme-mode.html','WORDS').forEach(w=>{ if(w.word&&w.phonemes) phoPool[w.word]=w.phonemes; });

// 3. unique make-able words + their morpheme decomposition from valid-combos.json
const vc = require(R('valid-combos.json'));
const byWord = {};
(function walk(o){
  if(Array.isArray(o)) return o.forEach(walk);
  if(o && typeof o==='object'){
    if(o.word && !byWord[o.word]) byWord[o.word] = { prefix:o.p||'', base:o.b||'', suffix1:o.s1||'', suffix2:o.s2||'' };
    Object.values(o).forEach(walk);
  }
})(vc);

const STAGE_ORDER = ['s2e','s2l','s3e','s3l','s4'];
function wordStage(morphemes){
  const stages = ['prefix','base','suffix1','suffix2']
    .map(k=>morphemes[k]).filter(Boolean).map(id=>STAGE[id]).filter(Boolean);
  if(!stages.length) return 's2e';
  return stages.sort((a,b)=>STAGE_ORDER.indexOf(b)-STAGE_ORDER.indexOf(a))[0];
}

const manifest = Object.keys(byWord).sort().map(word => {
  const morphemes = byWord[word];
  const partMeanings = {};
  ['prefix','base','suffix1','suffix2'].forEach(k=>{
    const id = morphemes[k];
    if(id) partMeanings[id] = MEANING[id] || ('('+id+')'); // fallback marker, flagged below
  });
  const reuse = {};
  if(sylPool[word]) reuse.syllables = sylPool[word];
  if(phoPool[word]) reuse.phonemes = phoPool[word];
  return { word, stage: wordStage(morphemes), morphemes, partMeanings, reuse };
});

fs.writeFileSync(R('scripts/word-study/manifest.json'), JSON.stringify(manifest));
const missingMeaning = manifest.filter(m=>Object.values(m.partMeanings).some(v=>/^\(.*\)$/.test(v)));
console.log('manifest words:', manifest.length);
console.log('reuse syllables:', manifest.filter(m=>m.reuse.syllables).length, '| reuse phonemes:', manifest.filter(m=>m.reuse.phonemes).length);
console.log('words with an unresolved morpheme meaning:', missingMeaning.length, missingMeaning.slice(0,10).map(m=>m.word));
