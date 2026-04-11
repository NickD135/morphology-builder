#!/usr/bin/env node
// Usage: node scripts/apply-stage-csv.js <csv-file> <data-file>
//
// Applies stage tags from a CSV (type,group,id,stage) to a JS file
// containing PREFIXES / SUFFIXES / CORE_BASES / ANGLO_BASES / LATIN_BASES /
// GREEK_BASES arrays. Finds entries by id and rewrites their existing
// `stage:` field value in place. Entries must already have a stage field
// (added in Phase 1 via Task 6); this script only swaps the value.
//
// The `group` column is optional — when present it disambiguates base
// entries that share an id across the core/anglo/latin/greek arrays.
// Stage values must be one of: s2e, s2l, s3e, s3l, s4, or empty (= null).

const fs = require('fs');
const path = require('path');

const VALID_STAGES = new Set(['s2e', 's2l', 's3e', 's3l', 's4']);

if (process.argv.length < 4) {
  console.error('Usage: node scripts/apply-stage-csv.js <csv-file> <data-file>');
  process.exit(1);
}

const csvPath = process.argv[2];
const jsPath = process.argv[3];

if (!fs.existsSync(csvPath)) {
  console.error('CSV file not found:', csvPath);
  process.exit(1);
}
if (!fs.existsSync(jsPath)) {
  console.error('Data file not found:', jsPath);
  process.exit(1);
}

function parseLine(line) {
  const fields = [];
  let cur = '';
  let inQ = false;
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (inQ) {
      if (ch === '"' && line[j + 1] === '"') { cur += '"'; j++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === ',') { fields.push(cur); cur = ''; }
      else if (ch === '"') inQ = true;
      else cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.split(/\r?\n/).filter(l => l.trim());
if (lines.length < 2) {
  console.error('CSV has no data rows');
  process.exit(1);
}

const header = parseLine(lines[0]);
const typeIdx = header.indexOf('type');
const idIdx = header.indexOf('id');
const stageIdx = header.indexOf('stage');
const groupIdx = header.indexOf('group');     // optional
const displayIdx = header.indexOf('display'); // optional — used for BASE_INFO dict fallback
const formIdx = header.indexOf('form');       // optional — alternative key
if (typeIdx < 0 || idIdx < 0 || stageIdx < 0) {
  console.error('CSV must have columns: type, id, stage (group, display, form optional)');
  process.exit(1);
}

// Collect target updates
const updates = [];
let skipped = 0;
for (let i = 1; i < lines.length; i++) {
  const parts = parseLine(lines[i]);
  const type = (parts[typeIdx] || '').trim();
  const id = (parts[idIdx] || '').trim();
  const group = groupIdx >= 0 ? (parts[groupIdx] || '').trim() : '';
  const display = displayIdx >= 0 ? (parts[displayIdx] || '').trim() : '';
  const form = formIdx >= 0 ? (parts[formIdx] || '').trim() : '';
  const stageRaw = (parts[stageIdx] || '').trim();
  if (!id) { skipped++; continue; }
  if (stageRaw && !VALID_STAGES.has(stageRaw)) { skipped++; continue; }
  // Word key for BASE_INFO dict lookup: prefer explicit form, then display
  // (stripping hyphens/dashes), then fall back to id.
  const word = form || display.replace(/[-\s]/g, '') || id;
  updates.push({ type, id, group, stage: stageRaw || null, word });
}

let js = fs.readFileSync(jsPath, 'utf8');
let changed = 0;
let notFound = 0;
let matchedViaDict = 0;

// Map groups to the dict names used in data.js
const BASE_INFO_DICTS = {
  anglo: 'ANGLO_BASE_INFO',
  latin: 'LATIN_BASE_INFO',
  greek: 'GREEK_BASE_INFO',
};

for (const u of updates) {
  const newVal = u.stage === null ? 'null' : '"' + u.stage + '"';

  // Pass 1: literal id lookup (prefixes, suffixes, CORE_BASES)
  const escapedId = u.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const literalRe = new RegExp(
    '(\\{\\s*id\\s*:\\s*["\']' + escapedId + '["\']\\s*,\\s*stage\\s*:\\s*)(null|"[^"]*"|\'[^\']*\')',
    'g'
  );
  let hit = false;
  let wasUnchanged = true;
  js = js.replace(literalRe, (match, pre, oldVal) => {
    hit = true;
    if (oldVal === newVal) return match;
    wasUnchanged = false;
    changed++;
    return pre + newVal;
  });
  if (hit) continue;

  // Pass 2: BASE_INFO dict lookup for anglo/latin/greek bases
  // Pattern: `<word>:{ stage:... , ...}` — key is bare identifier, not quoted.
  // We scope the search to the correct dict to avoid cross-dict collisions.
  if (u.type === 'base' && BASE_INFO_DICTS[u.group]) {
    const dictName = BASE_INFO_DICTS[u.group];
    const dictStart = js.indexOf('const ' + dictName + ' = {');
    if (dictStart !== -1) {
      // Find the matching closing brace for this dict (first `};` after start)
      const dictEnd = js.indexOf('};', dictStart);
      if (dictEnd !== -1) {
        const before = js.slice(0, dictStart);
        const dictBody = js.slice(dictStart, dictEnd);
        const after = js.slice(dictEnd);

        const escapedWord = u.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match `<word>:{ stage:(null|"...") `  — flexible whitespace, bare identifier key
        const dictRe = new RegExp(
          '(\\b' + escapedWord + '\\s*:\\s*\\{\\s*stage\\s*:\\s*)(null|"[^"]*"|\'[^\']*\')',
          'g'
        );
        let dictHit = false;
        const newBody = dictBody.replace(dictRe, (match, pre, oldVal) => {
          dictHit = true;
          if (oldVal === newVal) return match;
          changed++;
          matchedViaDict++;
          return pre + newVal;
        });
        if (dictHit) {
          js = before + newBody + after;
          continue;
        }
      }
    }
  }

  notFound++;
}

fs.writeFileSync(jsPath, js);

const unchanged = updates.length - changed - notFound;

console.log('Persisted stage tags to ' + path.relative(process.cwd(), jsPath));
console.log('  CSV rows:    ' + updates.length);
console.log('  Updated:     ' + changed + (matchedViaDict > 0 ? ' (' + matchedViaDict + ' via BASE_INFO dict)' : ''));
console.log('  Unchanged:   ' + unchanged);
console.log('  Not found:   ' + notFound);
if (skipped > 0) console.log('  Skipped:     ' + skipped + ' (invalid stage / missing id)');
console.log('\nNext: git diff ' + path.relative(process.cwd(), jsPath) + ' && git commit');
