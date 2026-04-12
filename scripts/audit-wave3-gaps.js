#!/usr/bin/env node
/**
 * Wave 3 pre-flight gap audit
 * Diffs morpheme IDs across data.js, wordlab-extension-data.js,
 * meaning-mode.html, and mission-mode.html to find what is missing from data.js.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Walk from startIdx (the '[') to find the matching ']', then pull id values.
 */
function extractIds(src, startIdx) {
  let depth = 0;
  let start = -1;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === '[') {
      if (depth === 0) start = i;
      depth++;
    } else if (src[i] === ']') {
      depth--;
      if (depth === 0) {
        const block = src.slice(start, i + 1);
        const ids = [];
        const re = /\bid\s*:\s*["']([^"']+)["']/g;
        let m;
        while ((m = re.exec(block)) !== null) ids.push(m[1]);
        return ids;
      }
    }
  }
  return [];
}

/**
 * Find the '[' that opens a named array declaration (const/let/var NAME = [).
 * Returns the index, or -1.
 */
function findArrayStart(src, arrayName) {
  const re = new RegExp(
    '(?:const|let|var)\\s+' + arrayName + '\\s*=\\s*\\[|\\b' + arrayName + '\\s*=\\s*\\['
  );
  const m = re.exec(src);
  if (!m) return -1;
  let i = m.index + m[0].length - 1;
  while (i < src.length && src[i] !== '[') i++;
  return i;
}

function parseArray(src, arrayName) {
  const idx = findArrayStart(src, arrayName);
  if (idx === -1) return null;
  return extractIds(src, idx);
}

/** Parse a plain string array (no id: fields) — used for ANGLO/LATIN/GREEK_BASE_LIST */
function parseStringArray(src, arrayName) {
  const idx = findArrayStart(src, arrayName);
  if (idx === -1) return null;
  let depth = 0;
  let start = -1;
  for (let i = idx; i < src.length; i++) {
    if (src[i] === '[') { if (depth === 0) start = i; depth++; }
    else if (src[i] === ']') {
      depth--;
      if (depth === 0) {
        const block = src.slice(start, i + 1);
        return [...block.matchAll(/["']([^"']+)["']/g)].map(m => m[1]);
      }
    }
  }
  return [];
}

// ── 1. Parse data.js ─────────────────────────────────────────────────────────

const dataSrc = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');

const dataPrefixes    = parseArray(dataSrc, 'PREFIXES');
const dataSuffixes    = parseArray(dataSrc, 'SUFFIXES');
const dataCoreBaseIds = parseArray(dataSrc, 'CORE_BASES');
const angloBaseList   = parseStringArray(dataSrc, 'ANGLO_BASE_LIST');
const latinBaseList   = parseStringArray(dataSrc, 'LATIN_BASE_LIST');
const greekBaseList   = parseStringArray(dataSrc, 'GREEK_BASE_LIST');

const dataIds = new Set([
  ...dataPrefixes,
  ...dataSuffixes,
  ...dataCoreBaseIds,
  ...angloBaseList,
  ...latinBaseList,
  ...greekBaseList,
]);

console.log('data.js: ' + dataPrefixes.length + ' prefixes, ' +
  dataSuffixes.length + ' suffixes, ' +
  dataCoreBaseIds.length + ' core bases, ' +
  angloBaseList.length + ' anglo bases, ' +
  latinBaseList.length + ' latin bases, ' +
  greekBaseList.length + ' greek bases');
console.log('data.js total unique IDs: ' + dataIds.size + '\n');

// ── 2. Parse wordlab-extension-data.js ───────────────────────────────────────

const extSrc = fs.readFileSync(path.join(ROOT, 'wordlab-extension-data.js'), 'utf8');

const extArrays = {
  EXT_MEANING_PREFIXES:     parseArray(extSrc, 'EXT_MEANING_PREFIXES'),
  EXT_MEANING_SUFFIXES:     parseArray(extSrc, 'EXT_MEANING_SUFFIXES'),
  EXT_MEANING_BASES:        parseArray(extSrc, 'EXT_MEANING_BASES'),
  EXT_MISSION_BASES:        parseArray(extSrc, 'EXT_MISSION_BASES'),
  EXT_MISSION_SUFFIX_BASES: parseArray(extSrc, 'EXT_MISSION_SUFFIX_BASES'),
};

// ── 3. Parse meaning-mode.html inline arrays ─────────────────────────────────

const meaningHtml = fs.readFileSync(path.join(ROOT, 'meaning-mode.html'), 'utf8');

const meaningArrays = {
  'meaning PREFIXES': parseArray(meaningHtml, 'PREFIXES'),
  'meaning SUFFIXES': parseArray(meaningHtml, 'SUFFIXES'),
  'meaning BASES':    parseArray(meaningHtml, 'BASES'),
};

// ── 4. Parse mission-mode.html inline arrays ─────────────────────────────────

const missionHtml = fs.readFileSync(path.join(ROOT, 'mission-mode.html'), 'utf8');

const missionArrays = {
  'mission PREFIXES':     parseArray(missionHtml, 'PREFIXES'),
  'mission SUFFIXES':     parseArray(missionHtml, 'SUFFIXES'),
  'mission SUFFIX_BASES': parseArray(missionHtml, 'SUFFIX_BASES'),
  'mission BASES':        parseArray(missionHtml, 'BASES'),
};

// ── 5. Report ─────────────────────────────────────────────────────────────────

function reportGroup(title, arrays) {
  console.log('=== ' + title + ' ===');
  let groupMissing = 0;
  for (const [name, ids] of Object.entries(arrays)) {
    if (!ids) { console.log('  ' + name + ': NOT FOUND in source'); continue; }
    const missing = ids.filter(id => !dataIds.has(id));
    groupMissing += missing.length;
    if (missing.length === 0) {
      console.log('  ' + name + ': ' + ids.length + ' total, 0 missing');
    } else {
      console.log('  ' + name + ': ' + ids.length + ' total, ' + missing.length + ' missing');
      console.log('    Missing: ' + missing.join(', '));
    }
  }
  console.log();
  return groupMissing;
}

let totalMissing = 0;
totalMissing += reportGroup('Extension arrays missing from data.js', extArrays);
totalMissing += reportGroup('Meaning Mode inline missing from data.js', meaningArrays);
totalMissing += reportGroup('Mission Mode inline missing from data.js', missionArrays);

console.log('=== TOTAL GAPS: ' + totalMissing + ' morpheme IDs need adding to data.js ===');
