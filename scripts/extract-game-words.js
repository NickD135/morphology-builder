#!/usr/bin/env node
// Usage: node scripts/extract-game-words.js [output.csv]
//
// Extracts word entries from inline game pools that don't have a tagger UI:
//   - Breakdown Blitz     (breakdown-mode.html → MISSIONS = [...])
//   - Phoneme Splitter    (phoneme-mode.html   → WORDS = [...])
//   - Syllable Splitter   (syllable-mode.html  → WORDS = [...])
//   - Root Lab            (root-lab.html       → WORDS = [...], single-quoted)
//
// Emits a combined CSV with columns: game, word, difficulty, stage
//
//   game        = breakdown | phoneme | syllable | rootlab
//   word        = the word itself
//   difficulty  = phoneme's `diff` field (Starter / Level up / Challenge),
//                 root lab's `level` field (starter / levelup / challenge),
//                 or empty for breakdown + syllable (single-tier pools)
//   stage       = current stage tag (s2e / s2l / s3e / s3l / s4 or empty = null)
//
// Defaults to ./game-words-YYYY-MM-DD.csv if no output path is given.

const fs = require('fs');

const TARGETS = [
  { game: 'breakdown', file: 'breakdown-mode.html', arrayRe: /MISSIONS\s*=\s*\[/ },
  { game: 'phoneme',   file: 'phoneme-mode.html',   arrayRe: /WORDS\s*=\s*\[/ },
  { game: 'syllable',  file: 'syllable-mode.html',  arrayRe: /WORDS\s*=\s*\[/ },
  { game: 'rootlab',   file: 'root-lab.html',       arrayRe: /const\s+WORDS\s*=\s*\[/ },
];

function findArrayBounds(src, arrayRe) {
  const m = src.match(arrayRe);
  if (!m) return null;
  // Walk brackets from the opening `[` to find its matching `]`.
  let i = m.index + m[0].length - 1; // sits on the `[`
  let depth = 0;
  let inStr = false, strCh = '';
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strCh) inStr = false;
    } else {
      if (ch === '"' || ch === "'") { inStr = true; strCh = ch; }
      else if (ch === '[') depth++;
      else if (ch === ']') { depth--; if (depth === 0) return [m.index + m[0].length - 1, i]; }
    }
  }
  return null;
}

function extractEntries(src) {
  // Yields { word, stage, diff } for each top-level { ... } object found.
  // Accepts both single-quoted (root-lab) and double-quoted (game files) strings.
  const entries = [];
  let cursor = 0;
  // Match { word: "foo" or { word: 'foo' — captures the word regardless of quote style
  const findRe = /\{\s*word\s*:\s*(?:"([^"]*)"|'([^']*)')/;
  while (cursor < src.length) {
    const rest = src.slice(cursor);
    const m = rest.match(findRe);
    if (!m) break;
    const entryStart = cursor + m.index;
    const wordVal = m[1] !== undefined ? m[1] : m[2];
    // Walk to the matching `}` — respects nested braces and string literals.
    let depth = 0;
    let j = entryStart;
    let inStr = false, strCh = '';
    for (; j < src.length; j++) {
      const ch = src[j];
      if (inStr) {
        if (ch === '\\') { j++; continue; }
        if (ch === strCh) inStr = false;
      } else {
        if (ch === '"' || ch === "'") { inStr = true; strCh = ch; }
        else if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) break; }
      }
    }
    if (j >= src.length) break;
    const entryText = src.slice(entryStart, j + 1);
    // stage may be null, "sNN", or 'sNN'
    const stageMatch = entryText.match(/stage\s*:\s*(?:null|"([^"]*)"|'([^']*)')/);
    const stageVal = stageMatch ? (stageMatch[1] !== undefined ? stageMatch[1] : (stageMatch[2] !== undefined ? stageMatch[2] : '')) : '';
    // Phoneme's `diff` field, or Root Lab's `level` field — prefer diff, fall back to level
    const diffMatch = entryText.match(/diff\s*:\s*(?:"([^"]*)"|'([^']*)')/);
    const levelMatch = entryText.match(/level\s*:\s*(?:"([^"]*)"|'([^']*)')/);
    const diffVal = diffMatch ? (diffMatch[1] !== undefined ? diffMatch[1] : diffMatch[2])
                  : (levelMatch ? (levelMatch[1] !== undefined ? levelMatch[1] : levelMatch[2]) : '');
    entries.push({
      word: wordVal,
      stage: stageVal,
      diff: diffVal,
    });
    cursor = j + 1;
  }
  return entries;
}

function csvEscape(s) {
  s = String(s);
  if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const outPath = process.argv[2] || ('game-words-' + new Date().toISOString().slice(0, 10) + '.csv');

const rows = [['game', 'word', 'difficulty', 'stage']];
const summary = [];
for (const t of TARGETS) {
  if (!fs.existsSync(t.file)) {
    console.error('Skipping ' + t.game + ' — file not found: ' + t.file);
    continue;
  }
  const src = fs.readFileSync(t.file, 'utf8');
  const bounds = findArrayBounds(src, t.arrayRe);
  if (!bounds) {
    console.error('Skipping ' + t.game + ' — array not found in ' + t.file);
    continue;
  }
  const slice = src.slice(bounds[0], bounds[1] + 1);
  const entries = extractEntries(slice);
  summary.push({ game: t.game, count: entries.length });
  for (const e of entries) {
    rows.push([t.game, e.word, e.diff, e.stage]);
  }
}

const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n') + '\n';
fs.writeFileSync(outPath, csv);

console.log('Wrote ' + outPath);
for (const s of summary) {
  console.log('  ' + s.game.padEnd(10) + ' ' + s.count + ' entries');
}
console.log('  ' + 'total'.padEnd(10) + ' ' + summary.reduce((a, b) => a + b.count, 0) + ' entries');
