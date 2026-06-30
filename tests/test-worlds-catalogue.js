const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'wordlab-worlds.js'), 'utf8');
const IDS = ['lab','galaxy','underwater','sunset','forest','neon','candy','volcano'];
let fail = 0;
for (const id of IDS) {
  if (!new RegExp(`\\b${id}\\s*:\\s*\\{`).test(src)) { console.error(`MISSING world: ${id}`); fail++; }
}
for (const api of ['start','stop','preview','WORLDS','wallOf']) {
  if (!src.includes(api)) { console.error(`MISSING api: ${api}`); fail++; }
}
if (fail) { console.error(`\n${fail} failure(s)`); process.exit(1); }
console.log(`OK — 8 worlds + full WLWorlds API present`);
