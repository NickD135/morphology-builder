#!/usr/bin/env node
// Sync stage tags from data.js into inline morpheme arrays in game pages.
//
// Mission Mode (mission-mode.html) and Meaning Match-Up (meaning-mode.html)
// both have fully inline PREFIXES / SUFFIXES / BASES arrays. They don't
// reference data.js directly, so stage tags applied via apply-stage-csv.js
// don't reach them. This script closes the gap.
//
// Usage: node scripts/sync-inline-stages.js

const fs = require('fs');

const DATA_JS = 'data.js';
const TARGETS = ['mission-mode.html', 'meaning-mode.html'];

// ── 1. Build id -> stage map from data.js ─────────────────────────────────

function buildStageMap() {
  const src = fs.readFileSync(DATA_JS, 'utf8');
  const map = new Map();

  // Pattern A: literal `{ id:"X", stage:"sXY" }` in PREFIXES, SUFFIXES, CORE_BASES
  const literalRe = /\{\s*id\s*:\s*["']([^"']+)["']\s*,\s*stage\s*:\s*(null|"[^"]*"|'[^']*')/g;
  for (const match of src.matchAll(literalRe)) {
    const id = match[1];
    const raw = match[2];
    const stage = raw === 'null' ? null : raw.slice(1, -1);
    map.set(id, stage);
  }

  // Pattern B: `<word>:{ stage:"sXY" }` inside ANGLO/LATIN/GREEK_BASE_INFO dicts
  // The dict key (bare identifier) IS the base word — same value used as id in
  // the inline arrays, so we can merge into the same map.
  const dictNames = ['ANGLO_BASE_INFO', 'LATIN_BASE_INFO', 'GREEK_BASE_INFO'];
  for (const dictName of dictNames) {
    const dictStart = src.indexOf('const ' + dictName + ' = {');
    if (dictStart === -1) continue;
    const dictEnd = src.indexOf('};', dictStart);
    if (dictEnd === -1) continue;
    const body = src.slice(dictStart, dictEnd);
    const dictRe = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\{\s*stage\s*:\s*(null|"[^"]*"|'[^']*')/g;
    for (const match of body.matchAll(dictRe)) {
      const id = match[1];
      const raw = match[2];
      const stage = raw === 'null' ? null : raw.slice(1, -1);
      // Don't overwrite literal matches (shouldn't overlap, but be safe)
      if (!map.has(id)) map.set(id, stage);
    }
  }

  return map;
}

// ── 2. Apply stages to inline arrays in a target HTML file ───────────────

function syncFile(filename, stageMap) {
  if (!fs.existsSync(filename)) {
    console.log('  SKIP ' + filename + ' (not found)');
    return { updated: 0, unchanged: 0, notFound: 0 };
  }
  let src = fs.readFileSync(filename, 'utf8');
  const original = src;

  let updated = 0;
  let unchanged = 0;
  let notFound = 0;

  // Match each `{id:"X", stage:(null|"sXY")` occurrence and rewrite the stage
  // value from the lookup. Leave the existing stage in place if the id isn't
  // in the map (shouldn't happen but defensive).
  src = src.replace(
    /(\{\s*id\s*:\s*["']([^"']+)["']\s*,\s*stage\s*:\s*)(null|"[^"]*"|'[^']*')/g,
    function(match, pre, id, oldVal) {
      if (!stageMap.has(id)) {
        notFound++;
        return match;
      }
      const newStage = stageMap.get(id);
      const newVal = newStage === null ? 'null' : '"' + newStage + '"';
      if (oldVal === newVal) {
        unchanged++;
        return match;
      }
      updated++;
      return pre + newVal;
    }
  );

  if (src !== original) {
    fs.writeFileSync(filename, src);
  }
  return { updated, unchanged, notFound };
}

// ── Main ─────────────────────────────────────────────────────────────────

const stageMap = buildStageMap();
console.log('Loaded ' + stageMap.size + ' stage entries from ' + DATA_JS);

let totalUpdated = 0;
let totalUnchanged = 0;
let totalNotFound = 0;

for (const target of TARGETS) {
  const r = syncFile(target, stageMap);
  console.log(
    '  ' + target + ': ' +
    r.updated + ' updated, ' +
    r.unchanged + ' unchanged, ' +
    r.notFound + ' not found in data.js'
  );
  totalUpdated += r.updated;
  totalUnchanged += r.unchanged;
  totalNotFound += r.notFound;
}

console.log('\nTotal: ' + totalUpdated + ' updated, ' + totalUnchanged + ' unchanged, ' + totalNotFound + ' not in data.js');
if (totalNotFound > 0) {
  console.log('\nNote: ids "not in data.js" either don\'t exist in the main data');
  console.log('or are inline-only morphemes (e.g. Mission Mode-specific variants).');
  console.log('Review manually if needed.');
}
console.log('\nNext: git diff && git commit');
