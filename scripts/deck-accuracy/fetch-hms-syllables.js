// scripts/deck-accuracy/fetch-hms-syllables.js
const fs = require('fs'), https = require('https'), path = require('path');
const { pickDivision } = require('./hms');
const inv = require('../word-study/invariants.js');
const WS = path.join(__dirname, '../../word-study-data.js');
const STATE = path.join(__dirname, 'state-syllables.json');
const BATCH = Number((process.argv.find(a=>a.startsWith('--batch='))||'--batch=50').split('=')[1]) || 50;

function loadWS(){ const t=fs.readFileSync(WS,'utf8'); const lines=t.split('\n');
  const rows=lines.map((l,i)=>{const m=l.match(/^  (\{.*\}),?$/); return m?{i,obj:JSON.parse(m[1])}:null;}).filter(Boolean);
  return {lines, rows}; }
function saveWS(lines){ fs.writeFileSync(WS, lines.join('\n')); }
function loadState(){ return fs.existsSync(STATE)?JSON.parse(fs.readFileSync(STATE,'utf8')):{}; }
function fetchHtml(word){ return new Promise((res,rej)=>{
  https.get('https://www.howmanysyllables.com/syllables/'+encodeURIComponent(word),
    {headers:{'User-Agent':'Mozilla/5.0 WordLabs-syllable-verify'}},
    r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej); }); }
const sleep = ms => new Promise(r=>setTimeout(r,ms));

(async () => {
  const state = loadState();
  const {lines, rows} = loadWS();
  const todo = rows.filter(r => (r.obj.syllablesSource==='agent') && !state[r.obj.word]);
  const single = todo.filter(r => (r.obj.syllables||[]).length <= 1);
  // 1-syllable agent words: split is the whole word, trivially correct.
  for (const r of single){ state[r.obj.word]='trivial-1syl'; }
  const multi = todo.filter(r => (r.obj.syllables||[]).length > 1).slice(0, BATCH);
  let changed = 0;
  for (const r of multi){
    let div=null;
    try { div = pickDivision(await fetchHtml(r.obj.word), r.obj.word); } catch(e){}
    if (div){
      const prev = r.obj.syllables; r.obj.syllables = div; r.obj.syllablesSource='hms';
      if (inv.checkSyllables(r.obj).ok){ lines[r.i] = '  '+JSON.stringify(r.obj)+ (lines[r.i].endsWith(',')?',':''); state[r.obj.word]='hms'; changed++; }
      else { r.obj.syllables=prev; r.obj.syllablesSource='agent'; state[r.obj.word]='no-hms-entry'; }
    } else { state[r.obj.word]='no-hms-entry'; }
    await sleep(1200);
  }
  saveWS(lines);
  fs.writeFileSync(STATE, JSON.stringify(state,null,0));
  const remaining = rows.filter(r => r.obj.syllablesSource==='agent' && (r.obj.syllables||[]).length>1 && !state[r.obj.word]).length;
  console.log(JSON.stringify({processed: multi.length, changed, trivial: single.length, remaining}));
})();
