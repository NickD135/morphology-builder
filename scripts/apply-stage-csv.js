#!/usr/bin/env node
// Usage: node scripts/apply-stage-csv.js <csv-file> <data-file>
//
// Applies stage tags from a CSV to a JS data file. Two formats are supported,
// auto-detected by the CSV header:
//
//   1. MORPHEME format (type,group,id,stage,...) → targets data.js
//      Finds entries by id in PREFIXES / SUFFIXES / CORE_BASES / ANGLO_BASES /
//      LATIN_BASES / GREEK_BASES arrays and BASE_INFO dicts, rewriting their
//      existing `stage:` field value in place. The `group` column is optional —
//      when present it disambiguates bases shared across pools.
//
//   2. WORD format (word,sound,level,stage,...) → targets sound-sorter-data.js
//      Finds Sound Sorter word entries by composite key (word + sound + level)
//      and rewrites the `stage:` field on each matching line. Handles the few
//      legitimate duplicates (same word under multiple sounds) correctly.
//
// Stage values must be one of: s2e, s2l, s3e, s3l, s4, or empty (= null).
// In both formats, entries must already have a `stage:` field; this script
// only swaps the value.

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

// Auto-detect format. Word CSVs have a `word` column (morpheme CSVs have `type`+`id`).
const isWordFormat = header.indexOf('word') >= 0 && header.indexOf('level') >= 0;

if (isWordFormat) {
  applyWordCSV(lines, header);
  process.exit(0);
}

const typeIdx = header.indexOf('type');
const idIdx = header.indexOf('id');
const stageIdx = header.indexOf('stage');
const groupIdx = header.indexOf('group');     // optional
const displayIdx = header.indexOf('display'); // optional — used for BASE_INFO dict fallback
const formIdx = header.indexOf('form');       // optional — alternative key
if (typeIdx < 0 || idIdx < 0 || stageIdx < 0) {
  console.error('CSV must have columns: type, id, stage (group, display, form optional)');
  console.error('Or word-format columns: word, sound, level, stage');
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

// ─── Word CSV path (Sound Sorter) ──────────────────────────────────
// Finishes the process when done; called early before the morpheme path runs.
//
// Matches entries by composite key: (word, normalisedSoundLabel, level). We
// use soundLabel rather than the internal `sound` key because CSV sources
// disagree on the sound column format (the analytics tagger exports internal
// keys like "long-a", while AI-tagged CSVs may use IPA-style "/ai/"). The
// soundLabel column ("Long A", "AIR sound", etc.) is stable across sources.
//
// Normalisation: lowercase + strip trailing " sound" + trim. This handles the
// pre-existing inconsistency in sound-sorter-data.js where ~68 entries use the
// short label ("AIR") and others use the longer form ("AIR sound") for the
// same actual sound.
function applyWordCSV(lines, header) {
  const wordIdx = header.indexOf('word');
  const levelIdx = header.indexOf('level');
  const stageIdx = header.indexOf('stage');
  const labelIdx = header.indexOf('soundLabel');
  const soundIdx = header.indexOf('sound'); // legacy fallback
  if (wordIdx < 0 || levelIdx < 0 || stageIdx < 0) {
    console.error('Word CSV must have columns: word, level, stage (soundLabel strongly preferred)');
    process.exit(1);
  }
  if (labelIdx < 0 && soundIdx < 0) {
    console.error('Word CSV must have either soundLabel or sound column for disambiguation');
    process.exit(1);
  }

  const updates = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const parts = parseLine(lines[i]);
    const word = (parts[wordIdx] || '').trim();
    const level = (parts[levelIdx] || '').trim().toLowerCase();
    const stageRaw = (parts[stageIdx] || '').trim();
    const rawLabel = labelIdx >= 0 ? (parts[labelIdx] || '').trim() : '';
    const rawSound = soundIdx >= 0 ? (parts[soundIdx] || '').trim() : '';
    const disambig = rawLabel || rawSound;
    if (!word || !level || !disambig) { skipped++; continue; }
    if (stageRaw && !VALID_STAGES.has(stageRaw)) { skipped++; continue; }
    updates.push({
      word,
      level,
      disambig: normLabel(disambig),
      stage: stageRaw || null
    });
  }

  let js = fs.readFileSync(jsPath, 'utf8');
  let jsLines = js.split('\n');

  // Pre-index the data file: every line that looks like a SOUND_SORTER_WORDS
  // entry gets indexed by (word + normLabel(soundLabel) + level), with a
  // fallback index keyed on the internal `sound` field for CSVs that supplied
  // that instead.
  const lineIndex = {};
  const lineIndexBySound = {};
  for (let i = 0; i < jsLines.length; i++) {
    const line = jsLines[i];
    const wm = line.match(/word\s*:\s*"([^"]*)"/);
    const lvm = line.match(/level\s*:\s*"([^"]*)"/);
    if (!wm || !lvm) continue;
    const lblm = line.match(/soundLabel\s*:\s*"([^"]*)"/);
    if (lblm) {
      const key = wm[1] + '|' + normLabel(lblm[1]) + '|' + lvm[1].toLowerCase();
      (lineIndex[key] = lineIndex[key] || []).push(i);
    }
    const sm = line.match(/sound(?!Label)\s*:\s*"([^"]*)"/);
    if (sm) {
      const key = wm[1] + '|' + normLabel(sm[1]) + '|' + lvm[1].toLowerCase();
      (lineIndexBySound[key] = lineIndexBySound[key] || []).push(i);
    }
  }

  let changed = 0;
  let unchanged = 0;
  let notFound = 0;
  let multiMatches = 0;
  const stageOnLineRe = /stage\s*:\s*(null|"[^"]*"|'[^']*')/;

  for (const u of updates) {
    const newVal = u.stage === null ? 'null' : '"' + u.stage + '"';
    const key = u.word + '|' + u.disambig + '|' + u.level;
    let lineNums = lineIndex[key] || lineIndexBySound[key];
    if (!lineNums || !lineNums.length) { notFound++; continue; }

    let anyChanged = false;
    for (const ln of lineNums) {
      const before = jsLines[ln];
      if (!stageOnLineRe.test(before)) continue;
      const after = before.replace(stageOnLineRe, 'stage:' + newVal);
      if (after !== before) {
        jsLines[ln] = after;
        anyChanged = true;
      }
    }
    if (anyChanged) changed++;
    else unchanged++;
    if (lineNums.length > 1) multiMatches++;
  }

  fs.writeFileSync(jsPath, jsLines.join('\n'));

  console.log('Persisted stage tags to ' + path.relative(process.cwd(), jsPath));
  console.log('  CSV rows:    ' + updates.length);
  console.log('  Updated:     ' + changed);
  console.log('  Unchanged:   ' + unchanged);
  console.log('  Not found:   ' + notFound);
  if (multiMatches > 0) console.log('  Multi-match: ' + multiMatches + ' rows affected >1 entry (duplicates)');
  if (skipped > 0) console.log('  Skipped:     ' + skipped + ' (invalid stage / missing key fields)');
  console.log('\nNext: git diff ' + path.relative(process.cwd(), jsPath) + ' && git commit');
}

function normLabel(s) {
  return String(s || '').toLowerCase().replace(/\s*sound\s*$/, '').trim();
}
