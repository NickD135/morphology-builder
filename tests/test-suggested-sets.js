// Run with: node tests/test-suggested-sets.js
// Exits 0 if all pass, 1 if any fail.

'use strict';

var assert = require('assert');
var path = require('path');

var WL = require(path.join(__dirname, '..', 'wordlab-suggested-sets.js'));
if (!WL) throw new Error('WLSuggested not exported');

var passed = 0, failed = 0;
function test(name, fn){
  try { fn(); console.log('\u2713 ' + name); passed++; }
  catch(e){ console.error('\u2717 ' + name + '\n  ' + e.message); failed++; }
}

// --- Task 1 tests ---

test('buildMorphemeIndex flattens prefixes/bases/suffixes', function(){
  var idx = WL.buildMorphemeIndex({
    prefixes: [{ id:'un', stage:'s2e', display:'un-', meaning:'not', examples:['unhappy'] }],
    bases:    [{ id:'scope', stage:'s3l', display:'scope', meaning:'look at', examples:['telescope'] }],
    suffixes: [{ id:'ing', stage:'s2e', display:'-ing', meaning:'doing', examples:['running'] }]
  });
  assert.strictEqual(idx.length, 3);
  assert.strictEqual(idx[0].id, 'un');
  assert.strictEqual(idx[0].type, 'prefix');
  assert.strictEqual(idx[0].homeStage, 's2e');
  assert.strictEqual(idx[1].type, 'base');
  assert.strictEqual(idx[2].type, 'suffix');
});

test('buildMorphemeIndex tolerates missing fields', function(){
  var idx = WL.buildMorphemeIndex({ prefixes: [{ id:'x' }], bases: [], suffixes: [] });
  assert.strictEqual(idx.length, 1);
  assert.strictEqual(idx[0].homeStage, null);
  assert.deepStrictEqual(idx[0].examples, []);
});

test('buildMorphemeIndex handles null input', function(){
  assert.deepStrictEqual(WL.buildMorphemeIndex(null), []);
});

// --- Task 2 tests ---

var FIXTURE_COMBOS = [
  { p:null,   b:'scope', s1:null, s2:null, word:'scope' },
  { p:null,   b:'scope', s1:'s',  s2:null, word:'scopes' },
  { p:null,   b:'scope', s1:'ed', s2:null, word:'scoped' },
  { p:'tele', b:'scope', s1:null, s2:null, word:'telescope' },
  { p:'micro',b:'scope', s1:null, s2:null, word:'microscope' },
  { p:null,   b:'act',   s1:null, s2:null, word:'act' },
  { p:'re',   b:'act',   s1:null, s2:null, word:'react' },
  { p:null,   b:'act',   s1:'ing',s2:null, word:'acting' }
];

test('getCombosForMorpheme base — returns only combos with b === id', function(){
  var out = WL.getCombosForMorpheme('scope', 'base', FIXTURE_COMBOS);
  assert.strictEqual(out.length, 5);
  assert.ok(out.every(function(c){ return c.b === 'scope'; }));
});

test('getCombosForMorpheme prefix — returns only combos with p === id', function(){
  var out = WL.getCombosForMorpheme('re', 'prefix', FIXTURE_COMBOS);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].word, 'react');
});

test('getCombosForMorpheme suffix — matches s1 OR s2', function(){
  var combos = [
    { p:null, b:'act', s1:'ion', s2:null, word:'action' },
    { p:null, b:'nat', s1:'ion', s2:'s',  word:'nations' },
    { p:null, b:'act', s1:'ive', s2:'ion',word:'activation' }
  ];
  var out = WL.getCombosForMorpheme('ion', 'suffix', combos);
  assert.strictEqual(out.length, 3);
});

test('getCombosForMorpheme returns [] for unknown id', function(){
  assert.deepStrictEqual(WL.getCombosForMorpheme('nope', 'base', FIXTURE_COMBOS), []);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
