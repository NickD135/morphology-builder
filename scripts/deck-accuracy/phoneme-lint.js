// scripts/deck-accuracy/phoneme-lint.js
const inv = require('../word-study/invariants.js');
const DIGRAPHS = ['sh','ch','th','ph','wh','ck','ng','qu'];
function flagWord(entry, taught){
  const reasons = [];
  const ph = entry.phonemes || [];
  const taughtSet = new Set(taught);
  // structural check via the real invariants (magic-e aware: strips '_', multiset match)
  if (!inv.checkPhonemes(entry).ok) reasons.push('joinback-fail');
  for (const g of ph) if (g.length > 1 && !taughtSet.has(g)) reasons.push('unknown-grapheme:'+g);
  // adjacent single letters that form a known digraph => likely wrongly split
  for (let i=0;i<ph.length-1;i++){
    if (ph[i].length===1 && ph[i+1].length===1 && DIGRAPHS.includes((ph[i]+ph[i+1]).toLowerCase()))
      reasons.push('split-digraph-broken');
  }
  return [...new Set(reasons)];
}
module.exports = { flagWord };
