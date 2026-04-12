#!/usr/bin/env node
/**
 * extract-meaning-patterns.js
 *
 * Reads mission-mode.html, extracts id->meaningPattern pairs from the
 * inline PREFIXES and SUFFIXES arrays, and prints two JS const objects
 * to stdout ready to paste into the file.
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '..', 'mission-mode.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const lines = html.split('\n');

// Lines are 0-indexed internally; the task says line 755/756 (1-indexed)
const prefixLine = lines[754]; // let PREFIXES=[...]
const suffixLine = lines[755]; // let SUFFIXES=[...]

function extractPatterns(line) {
  const pairs = {};
  // Match every object's id and meaningPattern fields
  const re = /id:"([^"]+)"[^}]*?meaningPattern:"([^"]+)"/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    pairs[m[1]] = m[2];
  }
  return pairs;
}

const prefixPatterns = extractPatterns(prefixLine);
const suffixPatterns = extractPatterns(suffixLine);

function formatObject(name, pairs) {
  const entries = Object.entries(pairs)
    .map(([id, pat]) => `    "${id}": "${pat}"`)
    .join(',\n');
  return `  const ${name} = {\n${entries}\n  };`;
}

console.log(formatObject('MISSION_PREFIX_PATTERNS', prefixPatterns));
console.log('');
console.log(formatObject('MISSION_SUFFIX_PATTERNS', suffixPatterns));

// Also print counts to stderr so the caller can verify
process.stderr.write('Extracted ' + Object.keys(prefixPatterns).length + ' prefix patterns\n');
process.stderr.write('Extracted ' + Object.keys(suffixPatterns).length + ' suffix patterns\n');
