// scripts/deck-accuracy/deck-data.test.js
const assert = require('assert');
const { wsToDeckWord, matrixFor } = require('./deck-data');
const ws = { word:'reconstruction',
  morphemes:{prefix:'re',base:'construct',suffix1:'ion',suffix2:''},
  partMeanings:{re:'again',construct:'build',ion:'act or result of'},
  syllables:['re','con','struc','tion'], phonemes:['r','e','c','o','n','s','t','r','u','c','ti','o','n'] };
const dw = wsToDeckWord(ws);
assert.strictEqual(dw.syllables, 're/con/struc/tion');
assert.deepStrictEqual(dw.morphemes, [{part:'re',meaning:'again'},{part:'construct',meaning:'build'},{part:'ion',meaning:'act or result of'}]);
assert.deepStrictEqual(dw.phonemes.slice(0,2), [{g:'r'},{g:'e'}]);
const words = [
  {word:'a', morphemes:{prefix:'re', base:'x', suffix1:'ion', suffix2:''}},
  {word:'b', morphemes:{prefix:'un', base:'x', suffix1:'',    suffix2:''}},
  {word:'c', morphemes:{prefix:'',   base:'x', suffix1:'ed',  suffix2:''}},
];
const mx = matrixFor('x','base',words);
assert.ok(mx.prefixes.includes('re') && mx.prefixes.includes('un'));
assert.ok(mx.suffixes.includes('ion') && mx.suffixes.includes('ed'));
console.log('deck-data.test OK');

// ---- assembler + validation gate ----
const { buildDeckData, validateDeckData } = require('./deck-data');
global.window = {}; require('../../data.js');
const wsAll = (()=>{ global.window={}; require('../../word-study-data.js'); return window.WORD_STUDY_WORDS; })();
const ctx = { words: wsAll, morphemeMeaning: 'build' };
const data = buildDeckData({morpheme:'struct', type:'base'}, ctx);
const dayWords = new Set([...data.day2.words, ...data.day3.words].map(w=>w.word));
assert.strictEqual(dayWords.size, data.day2.words.length + data.day3.words.length); // no repeats across days
assert.ok(data.prefixes.length && data.suffixes.length);
assert.strictEqual(validateDeckData(data).ok, true);
const broken = JSON.parse(JSON.stringify(data)); broken.day2.words[0].syllables = 'zzz/zzz';
assert.strictEqual(validateDeckData(broken).ok, false);
console.log('assembler.test OK');
