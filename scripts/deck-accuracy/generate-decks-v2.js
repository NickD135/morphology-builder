// scripts/deck-accuracy/generate-decks-v2.js
// Deterministic teaching-deck batch runner. For each morpheme in generate-all-decks.js's
// ALL_MORPHEMES list, derive DATA from verified word-study data, validate it, and render the
// PPTX via the existing renderer. Resumable via state-decks.json; no AI.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '../..');
const { buildDeckData, validateDeckData } = require('./deck-data');
const { buildDeck } = require(path.join(ROOT, 'wordlabs-deck-generator'));
const STATE = path.join(__dirname, 'state-decks.json');
const BATCH = Number((process.argv.find(a=>a.startsWith('--batch='))||'--batch=20').split('=')[1]) || 20;

// Extract the morpheme list WITHOUT requiring generate-all-decks.js (its main() needs an API key).
function loadMorphemes(){
  const src = fs.readFileSync(path.join(ROOT,'generate-all-decks.js'),'utf8');
  const start = src.indexOf('ALL_MORPHEMES');
  const body = src.slice(start, src.indexOf('\n]', start));
  return [...body.matchAll(/morpheme:\s*"([^"]+)"(?:\s*,\s*type:\s*"([^"]+)")?/g)]
    .map(m=>({morpheme:m[1], type:m[2]||'base'}));
}
// Some combining forms are real PREFIXES in data.js but the old deck list types them "base",
// so a base lookup finds nothing. Build them as prefixes (content) while keeping the listed
// filename so teacher-resources links still resolve. `remove` is re+move — not a morpheme; skip.
const OVERRIDE_TYPE = { tele:'prefix', photo:'prefix', chrono:'prefix', horo:'prefix', thermo:'prefix' };
const SKIP = new Set(['remove']);
function deckFile(morpheme, type){
  const tag = type==='prefix' ? '-prefix' : type==='suffix' ? '-suffix' : '';
  return path.join(ROOT,'output',`wordlabs-${morpheme}${tag}-3day.pptx`);
}
function loadState(){ return fs.existsSync(STATE)?JSON.parse(fs.readFileSync(STATE,'utf8')):{}; }
function meaningOf(MORPH, m, type){
  const arr = type==='prefix'?MORPH.prefixes : type==='suffix'?MORPH.suffixes : MORPH.bases;
  const e = arr.find(x=>x.form===m); return e ? e.meaning : '';
}

(async () => {
  global.window = {}; require(path.join(ROOT,'data.js')); const MORPH = global.window.MORPHEMES;
  require(path.join(ROOT,'word-study-data.js')); const words = global.window.WORD_STUDY_WORDS;
  const morphemes = loadMorphemes();
  const state = loadState();
  const key = s => s.type+':'+s.morpheme;
  const pending = morphemes.filter(s => state[key(s)] !== 'generated').slice(0, BATCH);
  let generated=0, failed=0;
  for (const spec of pending){
    if (SKIP.has(spec.morpheme)){ state[key(spec)]='SKIPPED:not-a-morpheme'; continue; }
    const buildType = OVERRIDE_TYPE[spec.morpheme] || spec.type;   // content type (may differ from filename type)
    let data=null;
    try { data = buildDeckData({morpheme:spec.morpheme, type:buildType}, {words, morphemeMeaning: meaningOf(MORPH, spec.morpheme, buildType)}); }
    catch(e){ state[key(spec)]='FAILED:build-error:'+e.message.slice(0,40); failed++; continue; }
    if (!data){ state[key(spec)]='FAILED:insufficient-words'; failed++; continue; }
    const v = validateDeckData(data);
    if (!v.ok){ state[key(spec)]='FAILED:'+(v.errors[0]||'gate'); failed++; continue; }
    try { await buildDeck(data, deckFile(spec.morpheme, spec.type)); state[key(spec)]='generated'; generated++; }
    catch(e){ state[key(spec)]='FAILED:render:'+e.message.slice(0,40); failed++; }
  }
  fs.writeFileSync(STATE, JSON.stringify(state,null,0));
  const remaining = morphemes.filter(s => state[key(s)] !== 'generated' && !String(state[key(s)]||'').startsWith('FAILED')).length;
  console.log(JSON.stringify({processed: pending.length, generated, failed, remaining, totalMorphemes: morphemes.length}));
})();
