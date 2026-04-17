// Word Labs — Suggested Spelling Sets module
// Pure logic (no DOM, no Supabase). Given morphemes + valid-combos, builds
// stage-graded word lists per morpheme. Loaded via <script> in dashboard.html.
//
// Public API (on window.WLSuggested):
//   buildMorphemeIndex(morphemes) → [{ id, type, display, meaning, homeStage, examples }]
//   getCombosForMorpheme(id, type, combos) → combo[]
//   scoreCombo(combo, stageMap) → number (lower = easier)
//   distanceConfig(distance) → { size: int, anchorRatio: float }
//   buildListForStage(sortedPool, homeStage, targetStage) → string[]  (words)
//   buildAllLevels(morphemeId, type, ctx) → { s2e: string[], s2l: string[], s3e: string[], s3l: string[], s4: string[], meta: {...} }
//     where ctx = { morphemes, combos } — morphemes is the flat object from data.js,
//     combos is the parsed valid-combos.json array

(function(global){
  'use strict';

  var STAGE_ORDER = ['s2e','s2l','s3e','s3l','s4'];

  function stageIndex(stage){
    return STAGE_ORDER.indexOf(stage);
  }

  function buildMorphemeIndex(morphemes){
    if (!morphemes) return [];
    var out = [];
    var typeMap = { prefixes: 'prefix', bases: 'base', suffixes: 'suffix' };
    Object.keys(typeMap).forEach(function(key){
      var list = morphemes[key] || [];
      list.forEach(function(m){
        out.push({
          id: m.id,
          type: typeMap[key],
          display: m.display || m.form || m.id,
          meaning: m.meaning || '',
          homeStage: m.stage || null,
          examples: Array.isArray(m.examples) ? m.examples : []
        });
      });
    });
    return out;
  }

  function getCombosForMorpheme(id, type, combos){
    if (!id || !combos) return [];
    return combos.filter(function(c){
      if (type === 'prefix') return c.p === id;
      if (type === 'base')   return c.b === id;
      if (type === 'suffix') return c.s1 === id || c.s2 === id;
      return false;
    });
  }

  function scoreCombo(combo, stageMap){
    if (!combo) return 0;
    var maxIdx = 0;
    var tryStage = function(id, kind){
      if (!id) return;
      var stage = stageMap[kind] && stageMap[kind][id];
      if (!stage) return;
      var idx = stageIndex(stage);
      if (idx > maxIdx) maxIdx = idx;
    };
    tryStage(combo.p,  'prefix');
    tryStage(combo.b,  'base');
    tryStage(combo.s1, 'suffix');
    tryStage(combo.s2, 'suffix');

    var morphCount = 0;
    if (combo.p)  morphCount++;
    if (combo.b)  morphCount++;
    if (combo.s1) morphCount++;
    if (combo.s2) morphCount++;
    var word = combo.word || '';
    var len = word.length;
    var firstChar = word.length ? word.charCodeAt(0) : 97;

    return maxIdx * 1e6 + len * 1e3 + morphCount * 100 + (firstChar / 1000);
  }

  function distanceConfig(distance){
    if (distance <= -2) return { size: 5,  anchorRatio: 0.0 };
    if (distance === -1) return { size: 7,  anchorRatio: 0.3 };
    if (distance === 0)  return { size: 8,  anchorRatio: 0.5 };
    if (distance === 1)  return { size: 9,  anchorRatio: 0.7 };
    return { size: 10, anchorRatio: 1.0 };
  }

  function buildListForStage(sortedPool, homeStage, targetStage){
    if (!sortedPool || sortedPool.length === 0) return [];
    var homeIdx = stageIndex(homeStage);
    var targetIdx = stageIndex(targetStage);
    if (homeIdx < 0) homeIdx = 2;
    if (targetIdx < 0) return sortedPool.map(function(c){ return c.word; });

    var distance = targetIdx - homeIdx;
    var cfg = distanceConfig(distance);
    var L = sortedPool.length;
    var N = Math.min(cfg.size, L);

    var anchor = Math.round(cfg.anchorRatio * (L - 1));
    var start = anchor - Math.floor(N / 2);
    start = Math.max(0, Math.min(start, L - N));
    var end = start + N;

    return sortedPool.slice(start, end).map(function(c){ return c.word; });
  }

  global.WLSuggested = {
    STAGE_ORDER: STAGE_ORDER,
    stageIndex: stageIndex,
    buildMorphemeIndex: buildMorphemeIndex,
    getCombosForMorpheme: getCombosForMorpheme,
    scoreCombo: scoreCombo,
    distanceConfig: distanceConfig,
    buildListForStage: buildListForStage
  };
})(typeof window !== 'undefined' ? window : global);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : global).WLSuggested;
}
