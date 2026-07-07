// scripts/deck-accuracy/fetch-sc-syllables.js
// Second authoritative-division pass using syllablecount.com, for the words
// howmanysyllables.com only gave a COUNT for (syllablesSource 'agent' or 'hms-count').
// syllablecount.com publishes a hyphenated division (e.g. "ac-count-ants") for most words.
const fs = require('fs'), https = require('https'), path = require('path');
const inv = require('../word-study/invariants.js');
const WS = path.join(__dirname, '../../word-study-data.js');
const STATE = path.join(__dirname, 'state-sc.json');
const BATCH = Number((process.argv.find(a=>a.startsWith('--batch='))||'--batch=50').split('=')[1]) || 50;

function loadWS(){ const t=fs.readFileSync(WS,'utf8'); const lines=t.split('\n');
  const rows=lines.map((l,i)=>{const m=l.match(/^  (\{.*\}),?$/); return m?{i,obj:JSON.parse(m[1])}:null;}).filter(Boolean);
  return {lines, rows}; }
function saveWS(lines){ fs.writeFileSync(WS, lines.join('\n')); }
function loadState(){ return fs.existsSync(STATE)?JSON.parse(fs.readFileSync(STATE,'utf8')):{}; }
function fetchHtml(word){ return new Promise((res,rej)=>{
  https.get('https://www.syllablecount.com/syllables/'+encodeURIComponent(word),
    {headers:{'User-Agent':'Mozilla/5.0'}},
    r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej); }); }
const sleep = ms => new Promise(r=>setTimeout(r,ms));

// Parse the hyphenated division (the token whose de-hyphenated letters equal the word).
function scDivision(html, word){
  const text=html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ');
  const toks=text.match(/[A-Za-z]+(?:-[A-Za-z]+)+/g)||[];
  for(const t of toks){ if(t.toLowerCase().replace(/-/g,'')===word.toLowerCase()) return t.toLowerCase().split('-'); }
  return null;
}
// Fallback: authoritative count from "... is N syllables" or "N Syllables in ...".
function scCount(html, word){
  const text=html.replace(/<[^>]+>/g,' ');
  let m=text.match(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s+is\\s+(\\d+)\\s+syllab','i'))
      || text.match(/(\d+)\s+Syllables?\s+in\b/i);
  return m?Number(m[1]):null;
}

(async () => {
  const state = loadState();
  const {lines, rows} = loadWS();
  // Target: multi-syllable words not yet authoritatively division-verified (hms) or already sc-done.
  const todo = rows.filter(r => (r.obj.syllables||[]).length > 1
    && (r.obj.syllablesSource==='agent' || r.obj.syllablesSource==='hms-count')
    && !state[r.obj.word]).slice(0, BATCH);
  let division=0, countKept=0, mismatch=0, noDiv=0;
  for (const r of todo){
    let html=''; let div=null;
    try { html = await fetchHtml(r.obj.word); div = scDivision(html, r.obj.word); } catch(e){}
    if (div){
      const prev=r.obj.syllables, prevSrc=r.obj.syllablesSource;
      r.obj.syllables=div; r.obj.syllablesSource='sc';
      if (inv.checkSyllables(r.obj).ok){ lines[r.i]='  '+JSON.stringify(r.obj)+(lines[r.i].endsWith(',')?',':''); state[r.obj.word]='sc'; division++; }
      else { r.obj.syllables=prev; r.obj.syllablesSource=prevSrc; div=null; }
    }
    if (!div){
      const count=scCount(html, r.obj.word);
      if (count==null){ state[r.obj.word]='sc-no-division'; noDiv++; }
      else if (count===(r.obj.syllables||[]).length && inv.checkSyllables(r.obj).ok){
        if (r.obj.syllablesSource!=='hms-count'){ r.obj.syllablesSource='hms-count'; lines[r.i]='  '+JSON.stringify(r.obj)+(lines[r.i].endsWith(',')?',':''); }
        state[r.obj.word]='sc-count'; countKept++;
      } else { state[r.obj.word]='count-mismatch:'+count; mismatch++; }
    }
    await sleep(1100);
  }
  saveWS(lines);
  fs.writeFileSync(STATE, JSON.stringify(state,null,0));
  const remaining = rows.filter(r => (r.obj.syllables||[]).length>1
    && (r.obj.syllablesSource==='agent' || r.obj.syllablesSource==='hms-count')
    && !state[r.obj.word]).length;
  console.log(JSON.stringify({processed: todo.length, division, countKept, mismatch, noDiv, remaining}));
})();
