// scripts/combo-coverage.js — reports how many buildable words each prefix/suffix has.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');

// Load window.MORPHEMES from data.js in a sandbox.
const sandbox = { window:{}, document:{ createElement:()=>({}) } };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,'data.js'),'utf8'), sandbox);
const M = sandbox.window.MORPHEMES;

const combos = JSON.parse(fs.readFileSync(path.join(ROOT,'valid-combos.json'),'utf8'));
function tally(list, key){
  const count = {}; list.forEach(x=>count[x.id]=0);
  combos.forEach(c=>{ if(key==='p'){ if(c.p) count[c.p]=(count[c.p]||0)+1; }
    else { if(c.s1) count[c.s1]=(count[c.s1]||0)+1; if(c.s2) count[c.s2]=(count[c.s2]||0)+1; } });
  return count;
}
function report(name, list, key){
  const c = tally(list, key);
  const rows = list.map(x=>[x.form||x.id, c[x.id]||0]).sort((a,b)=>a[1]-b[1]);
  const b0 = rows.filter(r=>r[1]===0).length;
  const b13 = rows.filter(r=>r[1]>=1&&r[1]<=3).length;
  const b4 = rows.filter(r=>r[1]>=4).length;
  console.log(`\n=== ${name} (${list.length}) — buckets: 0=${b0}  1-3=${b13}  4+=${b4} ===`);
  console.log('BELOW TARGET (<4):');
  rows.filter(r=>r[1]<4).forEach(r=>console.log(`  ${r[0].padEnd(12)} ${r[1]}`));
}
console.log(`Total combos: ${combos.length}`);
report('PREFIXES', M.prefixes, 'p');
report('SUFFIXES', M.suffixes, 's');
