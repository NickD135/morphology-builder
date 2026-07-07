// scripts/deck-accuracy/deck-data.js
function wsToDeckWord(ws){
  const m = ws.morphemes || {};
  const parts = [m.prefix, m.base, m.suffix1, m.suffix2].filter(Boolean);
  return {
    word: ws.word,
    morphemes: parts.map(p => ({ part: p, meaning: (ws.partMeanings && ws.partMeanings[p]) || '' })),
    syllables: (ws.syllables||[]).join('/'),
    phonemes: (ws.phonemes||[]).map(g => ({ g })),
  };
}
function matrixFor(morpheme, type, words){
  const col = new Set(), col2 = new Set();  // col -> prefixes field, col2 -> suffixes field
  for (const w of words){
    const m = w.morphemes || {};
    if (type === 'base' && m.base === morpheme){ if (m.prefix) col.add(m.prefix); if (m.suffix1) col2.add(m.suffix1); }
    else if (type === 'prefix' && m.prefix === morpheme){ if (m.base) col.add(m.base); if (m.suffix1) col2.add(m.suffix1); }
    else if (type === 'suffix' && (m.suffix1 === morpheme || m.suffix2 === morpheme)){ if (m.prefix) col.add(m.prefix); if (m.base) col2.add(m.base); }
  }
  return { prefixes: [...col].slice(0,6), suffixes: [...col2].slice(0,6) };
}
module.exports = { wsToDeckWord, matrixFor };
