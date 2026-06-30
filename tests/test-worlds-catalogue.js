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
// Scene engine: SCENES must exist and (by end of Plan 1) cover all 8 worlds.
// Task 1 only adds 'underwater'; the per-world tasks add the rest. This block
// asserts the engine + at least the Aquatic reference scene are present.
if (!/\bSCENES\s*=/.test(src)) { console.error('MISSING SCENES map'); fail++; }
if (!src.includes('_buildScene')) { console.error('MISSING _buildScene'); fail++; }
if (!src.includes('_placeSprites')) { console.error('MISSING _placeSprites'); fail++; }
if (!/underwater\s*:\s*\{\s*props/.test(src.replace(/\s+/g,' '))) { console.error('MISSING underwater scene'); fail++; }
if (fail) { console.error(`\n${fail} failure(s)`); process.exit(1); }
console.log(`OK — 8 worlds + full WLWorlds API present`);
