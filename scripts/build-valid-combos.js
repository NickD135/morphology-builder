#!/usr/bin/env node
/**
 * build-valid-combos.js
 *
 * Pre-computes every valid morpheme combination for the Morpheme Builder.
 * Outputs valid-combos.json (standard) and valid-combos-ext.json (extension).
 *
 * Usage: node scripts/build-valid-combos.js
 *
 * NOTE: This script uses vm.runInNewContext to load data.js and
 * wordlab-extension-data.js, which are browser-targeted IIFE scripts
 * that assign to global variables. This is a build-time tool run
 * locally by the developer, not a production server — the files
 * loaded are our own trusted source files from the repository.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

// ── Load data.js in a sandboxed context ──────────────────────────────────────
function loadDataFile(filename) {
  const code = fs.readFileSync(path.join(ROOT, filename), 'utf8');
  const sandbox = { window: {}, console, WL_EXTENSION: {} };
  vm.runInNewContext(code, sandbox, { filename });
  return sandbox;
}

const dataSandbox = loadDataFile('data.js');
const MORPHEMES = dataSandbox.window.MORPHEMES;
if (!MORPHEMES) { console.error('Failed to load MORPHEMES from data.js'); process.exit(1); }

// ── Load dictionary ──────────────────────────────────────────────────────────
const dictText = fs.readFileSync(path.join(ROOT, 'dictionary.txt'), 'utf8');
const DICT = new Set();
for (const line of dictText.split(/\r?\n/)) {
  const w = line.trim().toLowerCase();
  if (w && !w.startsWith('#')) DICT.add(w);
}
console.log(`Dictionary: ${DICT.size} words`);

// ── Spelling rule helpers ────────────────────────────────────────────────────
function isVowel(ch) { return 'aeiou'.includes(String(ch || '').toLowerCase()); }
function isConsonant(ch) {
  const c = String(ch || '').toLowerCase();
  return c >= 'a' && c <= 'z' && !isVowel(c);
}
function isCVC(word) {
  const w = String(word || '').toLowerCase();
  if (w.length < 3) return false;
  const a = w[w.length - 3], b = w[w.length - 2], c = w[w.length - 1];
  if (!isConsonant(a) || !isVowel(b) || !isConsonant(c)) return false;
  if ('wxy'.includes(c)) return false;
  return true;
}

// ── Prefix rules (assimilation) ──────────────────────────────────────────────
function applyPrefixRules(prefixForm, baseForm) {
  const p = String(prefixForm || '').toLowerCase();
  const first = String(baseForm || '')[0]?.toLowerCase() || '';

  if (p === 'ad') {
    const map = { c: 'ac', f: 'af', l: 'al', p: 'ap', s: 'as', t: 'at' };
    return map[first] || p;
  }
  if (p === 'in') {
    if ('pbm'.includes(first)) return 'im';
    if (first === 'l') return 'il';
    if (first === 'r') return 'ir';
    return p;
  }
  if (p === 'con' && 'pbm'.includes(first)) return 'com';
  if (p === 'en' && 'pbm'.includes(first)) return 'em';
  if (p === 'sub') {
    const map = { c: 'suc', f: 'suf', g: 'sug', p: 'sup', s: 'sus', t: 'subt' };
    return map[first] || p;
  }
  if (p === 'ob') {
    const map = { c: 'oc', f: 'of', p: 'op', s: 'os', t: 'obt' };
    return map[first] || p;
  }
  return p;
}

// ── Suffix rules ─────────────────────────────────────────────────────────────
function applySuffix(baseForm, suffixForm) {
  const base = String(baseForm || '');
  const suff = String(suffixForm || '');
  if (!suff) return base;

  const last = base.slice(-1).toLowerCase();
  const prev = base.slice(-2, -1).toLowerCase();
  const first = suff[0]?.toLowerCase() || '';
  const suffLower = suff.toLowerCase();

  // ie -> y before ing
  if (suffLower === 'ing' && base.toLowerCase().endsWith('ie')) {
    return base.slice(0, -2) + 'y' + suff;
  }
  // drop silent e before vowel suffix
  if (last === 'e' && isVowel(first)) {
    return base.slice(0, -1) + suff;
  }
  // y -> i before most suffixes (not ing, not when vowel before y)
  if (last === 'y' && prev && isConsonant(prev) && suffLower !== 'ing') {
    return base.slice(0, -1) + 'i' + suff;
  }
  // CVC doubling before vowel suffix
  if (isCVC(base) && isVowel(first)) {
    return base + base.slice(-1) + suff;
  }
  // default: just join
  return base + suff;
}

// ── Build word from morpheme combo ───────────────────────────────────────────
function computeWord(prefix, base, suffix1, suffix2) {
  const pAdj = prefix ? applyPrefixRules(prefix.form, base.form) : '';
  let word = pAdj + base.form;
  if (suffix1) word = applySuffix(word, suffix1.form);
  if (suffix2) word = applySuffix(word, suffix2.form);
  return word.toLowerCase();
}

// ── Generate combos ──────────────────────────────────────────────────────────
function generateCombos(prefixes, bases, suffixes) {
  const combos = [];
  const seen = new Set();
  let checked = 0;

  const prefixOptions = [null, ...prefixes];
  const suffixOptions = [null, ...suffixes];

  for (const base of bases) {
    for (const prefix of prefixOptions) {
      for (const s1 of suffixOptions) {
        for (const s2 of suffixOptions) {
          // Skip duplicate suffix combos
          if (s1 && s2 && s1.id === s2.id) continue;
          // If no s1, skip s2
          if (!s1 && s2) continue;

          checked++;
          const word = computeWord(prefix, base, s1, s2);
          if (!word || word.length < 2) continue;

          if (!DICT.has(word)) continue;

          const key = `${prefix?.id || ''}|${base.id}|${s1?.id || ''}|${s2?.id || ''}`;
          if (seen.has(key)) continue;
          seen.add(key);

          combos.push({
            p: prefix?.id || null,
            b: base.id,
            s1: s1?.id || null,
            s2: s2?.id || null,
            word
          });
        }
      }
    }

    if (checked % 500000 === 0) process.stdout.write(`  ${checked.toLocaleString()} checked...\r`);
  }

  console.log(`  ${checked.toLocaleString()} combinations checked, ${combos.length} valid words found`);
  return combos;
}

// ── Standard build ───────────────────────────────────────────────────────────
console.log('\n=== Building standard valid-combos.json ===');
const stdCombos = generateCombos(MORPHEMES.prefixes, MORPHEMES.bases, MORPHEMES.suffixes);

const stdPath = path.join(ROOT, 'valid-combos.json');
fs.writeFileSync(stdPath, JSON.stringify(stdCombos));
const stdSize = fs.statSync(stdPath).size;
console.log(`  Written: ${stdPath} (${(stdSize / 1024).toFixed(1)} KB)\n`);

// ── Extension build ──────────────────────────────────────────────────────────
console.log('=== Building extension valid-combos-ext.json ===');

let extPrefixes = MORPHEMES.prefixes;
let extSuffixes = MORPHEMES.suffixes;
let extBases = MORPHEMES.bases;

try {
  const extSandbox = loadDataFile('wordlab-extension-data.js');
  const ext = extSandbox.WL_EXTENSION || extSandbox.window.WL_EXTENSION;
  if (ext && ext.prefixes) extPrefixes = ext.prefixes;
  if (ext && ext.suffixes) extSuffixes = ext.suffixes;
  if (ext && ext.bases) extBases = ext.bases;
  console.log(`  Extension: ${extPrefixes.length} prefixes, ${extBases.length} bases, ${extSuffixes.length} suffixes`);
} catch (e) {
  console.error('  Failed to load extension data, using standard:', e.message);
}

const extCombos = generateCombos(extPrefixes, extBases, extSuffixes);

const extPath = path.join(ROOT, 'valid-combos-ext.json');
fs.writeFileSync(extPath, JSON.stringify(extCombos));
const extSize = fs.statSync(extPath).size;
console.log(`  Written: ${extPath} (${(extSize / 1024).toFixed(1)} KB)\n`);

console.log('Done!');
