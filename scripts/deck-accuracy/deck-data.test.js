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
