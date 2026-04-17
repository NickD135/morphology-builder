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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
