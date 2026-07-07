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
// howmanysyllables.com only publishes a hyphenated DIVISION for a subset of words;
// for the rest it publishes only a COUNT (e.g. "3&nbsp;syllables" in the Answer_Red span).
// parseCount extracts that authoritative count so we can at least verify the split's length.
function parseCount(html){
  const m = html.match(/class="Answer_Red"[^>]*>\s*(\d+)[^<]*syllab/i);
  return m ? Number(m[1]) : null;
}

(async () => {
  const state = loadState();
  const {lines, rows} = loadWS();
  // Words previously marked no-hms-entry under the division-only logic get re-tried with the count fallback.
  for (const w of Object.keys(state)) if (state[w]==='no-hms-entry') delete state[w];
  const todo = rows.filter(r => (r.obj.syllablesSource==='agent') && !state[r.obj.word]);
  const single = todo.filter(r => (r.obj.syllables||[]).length <= 1);
  // 1-syllable agent words: split is the whole word, trivially correct.
  for (const r of single){ state[r.obj.word]='trivial-1syl'; }
  const multi = todo.filter(r => (r.obj.syllables||[]).length > 1).slice(0, BATCH);
  let division=0, countVerified=0, mismatch=0, noEntry=0;
  for (const r of multi){
    let html=''; let div=null;
    try { html = await fetchHtml(r.obj.word); div = pickDivision(html, r.obj.word); } catch(e){}
    if (div){
      // Tier 1: authoritative hyphenated division — use it directly.
      const prev = r.obj.syllables; r.obj.syllables = div; r.obj.syllablesSource='hms';
      if (inv.checkSyllables(r.obj).ok){ lines[r.i] = '  '+JSON.stringify(r.obj)+ (lines[r.i].endsWith(',')?',':''); state[r.obj.word]='hms'; division++; }
      else { r.obj.syllables=prev; r.obj.syllablesSource='agent'; div=null; }
    }
    if (!div){
      // Tier 2: no division — use the authoritative COUNT to verify the existing split's length.
      const count = parseCount(html);
      if (count == null){ state[r.obj.word]='no-count'; noEntry++; }
      else if (count === (r.obj.syllables||[]).length && inv.checkSyllables(r.obj).ok){
        r.obj.syllablesSource='hms-count'; // right count, split points not authority-verified but consistent
        lines[r.i] = '  '+JSON.stringify(r.obj)+ (lines[r.i].endsWith(',')?',':''); state[r.obj.word]='hms-count'; countVerified++;
      } else {
        // Wrong number of syllables → the split is genuinely wrong. Flag for fable re-split (Phase 1b).
        state[r.obj.word]='count-mismatch:'+count; mismatch++;
      }
    }
    await sleep(1200);
  }
  saveWS(lines);
  fs.writeFileSync(STATE, JSON.stringify(state,null,0));
  const remaining = rows.filter(r => r.obj.syllablesSource==='agent' && (r.obj.syllables||[]).length>1 && !state[r.obj.word]).length;
  console.log(JSON.stringify({processed: multi.length, division, countVerified, mismatch, noEntry, trivial: single.length, remaining}));
})();
