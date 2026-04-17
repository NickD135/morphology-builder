#!/usr/bin/env node
// One-time generator: syllable + phoneme (grapheme) data for all valid-combo words.
// Uses morpheme boundaries from valid-combos.json to guide syllable splitting.
// Outputs word-phoneme-data.json — a lookup keyed by word.
//
// Usage: node scripts/generate-word-phoneme-data.js
//
// The output is checked into the repo and loaded by enrichWords() at save time.

'use strict';
var fs = require('fs');
var path = require('path');

var combos = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'valid-combos.json'), 'utf8'));

// Build word → combo lookup (first match, since we just need morpheme boundaries)
var comboMap = {};
combos.forEach(function(c){ if (!comboMap[c.word]) comboMap[c.word] = c; });
var uniqueWords = Object.keys(comboMap).sort();

// --- Helpers ---

var VOWELS = 'aeiouy';
function isVowel(ch){ return ch && VOWELS.indexOf(ch.toLowerCase()) !== -1; }
function isCons(ch){ return ch && /[a-z]/i.test(ch) && !isVowel(ch); }
function hasVowel(s){ for(var i=0;i<s.length;i++) if(isVowel(s[i])) return true; return false; }

var ONSET_CLUSTERS = new Set([
  'bl','br','ch','cl','cr','dr','dw','fl','fr','gl','gn','gr',
  'kn','ph','pl','pr','qu','sc','sh','sk','sl','sm','sn','sp','spr','spl',
  'sq','st','str','sw','th','tr','tw','wh','wr','scr','sch','shr','thr'
]);

// --- Morpheme-aware syllable splitter ---

// Split a morpheme part into syllables using vowel nuclei
function syllabifyPart(part){
  part = part.toLowerCase();
  if (part.length <= 2) return [part];
  if (!hasVowel(part)) return [part];

  // Detect trailing silent-e: VCe pattern at end (scope, hope, make, etc.)
  var effective = part;
  var trailingSilentE = false;
  if (part.length >= 3 && part[part.length - 1] === 'e' && isCons(part[part.length - 2])){
    // Check there's a vowel before the consonant (VCe pattern)
    var preConsIdx = part.length - 3;
    if (isVowel(part[preConsIdx]) || part.slice(-3) === 'ble' || part.slice(-3) === 'dle'
        || part.slice(-3) === 'gle' || part.slice(-3) === 'ple' || part.slice(-3) === 'tle'
        || part.slice(-3) === 'fle' || part.slice(-3) === 'cle' || part.slice(-3) === 'zle'){
      trailingSilentE = true;
    }
  }

  // Count vowel groups (excluding trailing silent e)
  var scanLen = trailingSilentE ? part.length - 1 : part.length;
  var groups = 0;
  var inVowel = false;
  for (var i = 0; i < scanLen; i++){
    if (isVowel(part[i])){
      if (!inVowel) groups++;
      inVowel = true;
    } else {
      inVowel = false;
    }
  }
  if (groups <= 1) return [part];

  // Find split points between vowel groups
  var splits = [];
  var vowelStarts = [];
  inVowel = false;
  for (var j = 0; j < scanLen; j++){
    if (isVowel(part[j])){
      if (!inVowel) vowelStarts.push(j);
      inVowel = true;
    } else {
      inVowel = false;
    }
  }

  for (var v = 0; v < vowelStarts.length - 1; v++){
    // Find consonant cluster between this vowel group end and next vowel group start
    var vEnd = vowelStarts[v];
    // Scan forward to end of current vowel group
    while (vEnd + 1 < part.length && isVowel(part[vEnd + 1])) vEnd++;
    var nextVowel = vowelStarts[v + 1];
    var cluster = part.slice(vEnd + 1, nextVowel);

    if (cluster.length === 0){
      splits.push(nextVowel);
    } else if (cluster.length === 1){
      splits.push(vEnd + 1);
    } else {
      // Maximize onset: find longest valid onset cluster for next syllable
      var splitAt = vEnd + 2;
      for (var k = 0; k < cluster.length; k++){
        var candidateOnset = cluster.slice(k);
        if (candidateOnset.length === 1 || ONSET_CLUSTERS.has(candidateOnset)){
          splitAt = vEnd + 1 + k;
          break;
        }
      }
      splits.push(splitAt);
    }
  }

  var syls = [];
  var prev = 0;
  splits.forEach(function(s){ syls.push(part.slice(prev, s)); prev = s; });
  syls.push(part.slice(prev));
  return syls.filter(function(s){ return s.length > 0; });
}

function syllabify(word){
  word = word.toLowerCase();
  var combo = comboMap[word];
  if (!combo) return syllabifyPart(word);

  // Split word into morpheme parts and syllabify each independently
  var parts = [];
  var assembled = '';

  // Build the morpheme parts in order: prefix, base, suffix1, suffix2
  // We need to figure out where each morpheme's letters are in the word.
  // The word is the assembled result of applying spelling rules to the morphemes,
  // so we can't just concatenate p+b+s1+s2. Instead, we use the morpheme IDs
  // as boundary hints and split the word at likely boundaries.

  var morphemes = [];
  if (combo.p) morphemes.push({ id: combo.p, type: 'prefix' });
  if (combo.b) morphemes.push({ id: combo.b, type: 'base' });
  if (combo.s1) morphemes.push({ id: combo.s1, type: 'suffix' });
  if (combo.s2) morphemes.push({ id: combo.s2, type: 'suffix' });

  if (morphemes.length <= 1){
    return syllabifyPart(word);
  }

  // Strategy: try to find morpheme boundaries in the word.
  // Start from suffixes (right side) since they're more predictable after spelling rules.
  var remaining = word;
  var suffixParts = [];

  // Strip suffix2 first (from right)
  if (combo.s2){
    var s2Candidates = _findSuffixInWord(remaining, combo.s2);
    if (s2Candidates){
      suffixParts.unshift(s2Candidates.suffix);
      remaining = s2Candidates.stem;
    }
  }
  // Strip suffix1
  if (combo.s1){
    var s1Candidates = _findSuffixInWord(remaining, combo.s1);
    if (s1Candidates){
      suffixParts.unshift(s1Candidates.suffix);
      remaining = s1Candidates.stem;
    }
  }

  // Strip prefix (from left of remaining)
  var prefixPart = null;
  if (combo.p){
    var pLen = combo.p.length;
    // Prefix is usually preserved as-is at the start
    if (remaining.slice(0, pLen) === combo.p){
      prefixPart = combo.p;
      remaining = remaining.slice(pLen);
    } else if (remaining.slice(0, pLen + 1).indexOf(combo.p) === 0){
      prefixPart = remaining.slice(0, pLen);
      remaining = remaining.slice(pLen);
    }
  }

  // What's left is the base (possibly modified by spelling rules)
  var basePart = remaining;

  // Build parts list
  var allParts = [];
  if (prefixPart) allParts.push(prefixPart);
  if (basePart) allParts.push(basePart);
  suffixParts.forEach(function(sp){ if(sp) allParts.push(sp); });

  // Validate: parts should join to the original word
  if (allParts.join('') !== word){
    // Fallback: just syllabify the whole word without morpheme awareness
    return syllabifyPart(word);
  }

  // Syllabify each part, then flatten
  var syllables = [];
  allParts.forEach(function(part){
    var partSyls = syllabifyPart(part);
    syllables = syllables.concat(partSyls);
  });

  // Merge any parts that have no vowel into their neighbor
  var merged = [];
  for (var m = 0; m < syllables.length; m++){
    if (!hasVowel(syllables[m]) && merged.length > 0){
      merged[merged.length - 1] += syllables[m];
    } else {
      merged.push(syllables[m]);
    }
  }
  if (merged.length > 1 && !hasVowel(merged[merged.length - 1])){
    merged[merged.length - 2] += merged.pop();
  }

  return merged.length > 0 ? merged : [word];
}

// Try to find where a suffix's letters end up in a word (accounting for spelling rules).
// Returns {stem, suffix} where stem + suffix === word, or null.
function _findSuffixInWord(word, suffixId){
  // Build candidate suffixes sorted longest-first.
  // Variants account for spelling changes at morpheme boundaries
  // (e.g. -ion in 'action' becomes -tion, -ive in 'active' becomes -tive).
  var VARIANT_MAP = {
    ion: ['ation','ition','ution','tion','sion','ion'],
    ive: ['ative','itive','sive','tive','ive'],
    ous: ['ious','eous','uous','ous'],
    al: ['ual','ial','al'],
    ity: ['ity','ety'],
    ance: ['ence','ance'],
    ent: ['ent','ant'],
    able: ['ible','able'],
    or: ['ator','itor','or'],
    er: ['ier','er'],
    ary: ['ionary','ary'],
    ory: ['atory','itory','ory'],
    ic: ['tic','sic','ic'],
    age: ['age'],
    ise: ['ise','ize'],
    ment: ['ment'],
    ness: ['ness'],
    less: ['less'],
    ful: ['ful'],
    ing: ['ing'],
    ed: ['ed'],
    ly: ['ly'],
    s: ['es','s'],
    es: ['es'],
    est: ['est'],
    ish: ['ish'],
    ist: ['ist'],
    ism: ['ism'],
    ship: ['ship'],
    hood: ['hood'],
    ent: ['ent','ant'],
    ence: ['ence','ance']
  };

  var candidates = VARIANT_MAP[suffixId] || [suffixId];

  for (var vi = 0; vi < candidates.length; vi++){
    var sv = candidates[vi];
    if (word.endsWith(sv) && word.length > sv.length){
      return { stem: word.slice(0, -sv.length), suffix: sv };
    }
  }

  // Last resort: direct match
  if (word.endsWith(suffixId) && word.length > suffixId.length){
    return { stem: word.slice(0, -suffixId.length), suffix: suffixId };
  }

  return null;
}

// --- Phoneme (grapheme) splitter ---

// Ordered longest-first for greedy matching
var GRAPHEMES = [
  'eigh','ough','tch','dge',
  'air','ear','igh','ore','ure',
  'sh','ch','th','wh','ph','ck','ng','gh','wr','kn','gn',
  'ai','ay','ea','ee','ie','oa','oo','ou','ow','ue','ew','oi','oy',
  'au','aw','ar','er','ir','or','ur','ey','ei',
  'qu'
];

function phonemeSplit(word){
  word = word.toLowerCase();
  var phonemes = [];
  var i = 0;
  while (i < word.length){
    var matched = false;
    for (var g = 0; g < GRAPHEMES.length; g++){
      var graph = GRAPHEMES[g];
      if (i + graph.length <= word.length && word.substr(i, graph.length) === graph){
        // Context check: don't match 'er' in the middle of 'every' where e and r are separate phonemes
        // But DO match 'er' at end of 'teacher', 'er' in 'fern'
        // Heuristic: vowel digraphs in the middle need at least one consonant neighbor
        phonemes.push(graph);
        i += graph.length;
        matched = true;
        break;
      }
    }
    if (!matched){
      // Doubled consonants = one phoneme
      if (i + 1 < word.length && word[i] === word[i+1] && isCons(word[i])){
        phonemes.push(word[i] + word[i+1]);
        i += 2;
      } else {
        phonemes.push(word[i]);
        i++;
      }
    }
  }
  return phonemes;
}

// --- Generate ---

var data = {};
uniqueWords.forEach(function(w){
  data[w] = {
    syllables: syllabify(w),
    phonemes: phonemeSplit(w)
  };
});

// Validation: syllables and phonemes must join back to the original word
var errors = [];
Object.keys(data).forEach(function(w){
  var d = data[w];
  if (d.syllables.join('') !== w) errors.push('syllable: ' + w + ' → ' + d.syllables.join('|'));
  if (d.phonemes.join('') !== w) errors.push('phoneme: ' + w + ' → ' + d.phonemes.join('|'));
});

if (errors.length){
  console.error('Validation errors (' + errors.length + '):');
  errors.slice(0, 20).forEach(function(e){ console.error('  ' + e); });
  if (errors.length > 20) console.error('  ... and ' + (errors.length - 20) + ' more');
  process.exit(1);
}

var outPath = path.join(__dirname, '..', 'word-phoneme-data.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 0));
console.log('Generated ' + Object.keys(data).length + ' entries → ' + outPath);
console.log('File size: ' + (fs.statSync(outPath).size / 1024).toFixed(1) + ' KB');

// Spot check — wide variety of morpheme patterns
var samples = [
  'telescope','unhappiness','microscope','extension','playing','unkindness',
  'comfortable','reacting','disagreement','invisible','exported','reconstruction',
  'hopeful','fearless','kindness','untested','discovering','misspelling',
  'preview','submarine','hyperactive','extraordinary','encouragement'
];
console.log('\n--- Spot check ---');
samples.forEach(function(w){
  if (data[w]) console.log(w + ': syl=' + data[w].syllables.join('|') + '  ph=' + data[w].phonemes.join('|'));
  else console.log(w + ': NOT FOUND');
});
