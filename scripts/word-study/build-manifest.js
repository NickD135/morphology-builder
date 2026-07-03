const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../');
const R = f => path.join(ROOT, f);

// 1. morpheme id -> meaning + stage, from data.js (needs a window shim)
global.window = {};
require(R('data.js'));
const M = global.window.MORPHEMES; // { prefixes:[], suffixes:[], bases:[] }
// valid-combos.json stores morpheme IDs (e.g. base "anglo_73"); word-study.html renders/grades
// the surface FORM ("dark"), so resolve id -> form and key part-meanings by form (matches v1 data).
const FORM = {};
const MEANING = {};   // keyed by surface form
const STAGE = {};     // keyed by id
['prefixes','suffixes','bases'].forEach(group => (M[group]||[]).forEach(m => {
  FORM[m.id] = m.form; MEANING[m.form] = m.meaning; STAGE[m.id] = m.stage;
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
  const ids = byWord[word]; // {prefix,base,suffix1,suffix2} as morpheme IDs
  const morphemes = {
    prefix:  ids.prefix  ? FORM[ids.prefix]  : '',
    base:    ids.base    ? FORM[ids.base]    : '',
    suffix1: ids.suffix1 ? FORM[ids.suffix1] : '',
    suffix2: ids.suffix2 ? FORM[ids.suffix2] : '',
  };
  const partMeanings = {};
  ['prefix','base','suffix1','suffix2'].forEach(k=>{
    const form = morphemes[k];
    if(form) partMeanings[form] = MEANING[form] || ('('+form+')'); // fallback marker, flagged below
  });
  const reuse = {};
  if(sylPool[word]) reuse.syllables = sylPool[word];
  if(phoPool[word]) reuse.phonemes = phoPool[word];
  return { word, stage: wordStage(ids), morphemes, partMeanings, reuse };
});

fs.writeFileSync(R('scripts/word-study/manifest.json'), JSON.stringify(manifest));
const missingMeaning = manifest.filter(m=>Object.values(m.partMeanings).some(v=>/^\(.*\)$/.test(v)));
console.log('manifest words:', manifest.length);
console.log('reuse syllables:', manifest.filter(m=>m.reuse.syllables).length, '| reuse phonemes:', manifest.filter(m=>m.reuse.phonemes).length);
console.log('words with an unresolved morpheme meaning:', missingMeaning.length, missingMeaning.slice(0,10).map(m=>m.word));
