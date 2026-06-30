// Static integrity check: every new effect id has an EFFECTS entry, a _fns
// registration, and a fx function. No browser needed — parses the source text.
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'wordlab-effects.js'), 'utf8');

const NEW = ['hearts-fx', 'snow', 'petals', 'smoke', 'lasers', 'quark-rain', 'blackhole'];
const FN = { 'hearts-fx':'fxHearts', 'snow':'fxSnow', 'petals':'fxPetals', 'smoke':'fxSmoke',
             'lasers':'fxLasers', 'quark-rain':'fxQuarkRain', 'blackhole':'fxBlackhole' };

let fail = 0;
for (const id of NEW) {
  const inCatalogue = new RegExp(`['"]?${id.replace('-','\\-')}['"]?\\s*:\\s*\\{`).test(src)
                   || src.includes(`'${id}'`) || src.includes(`"${id}"`);
  const inFns = new RegExp(`['"]?${id}['"]?\\s*:\\s*${FN[id]}\\b`).test(src)
             || src.includes(`${id}: ${FN[id]}`) || src.includes(`'${id}': ${FN[id]}`);
  const hasFn = new RegExp(`function\\s+${FN[id]}\\s*\\(`).test(src);
  if (!inCatalogue) { console.error(`MISSING catalogue entry: ${id}`); fail++; }
  if (!inFns)       { console.error(`MISSING _fns mapping: ${id} -> ${FN[id]}`); fail++; }
  if (!hasFn)       { console.error(`MISSING function: ${FN[id]}`); fail++; }
}
if (fail) { console.error(`\n${fail} failure(s)`); process.exit(1); }
console.log(`OK — all ${NEW.length} new effects present in catalogue, _fns, and functions`);
