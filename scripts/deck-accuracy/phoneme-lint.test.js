// scripts/deck-accuracy/phoneme-lint.test.js
const assert = require('assert');
const { flagWord } = require('./phoneme-lint');
const taught = ['a','b','c','d','e','s','h','sh','t','r','u_e','i','o','n','p'];
assert.deepStrictEqual(flagWord({word:'ship', phonemes:['sh','i','p']}, taught), []);
assert.ok(flagWord({word:'ship', phonemes:['s','h','i','p']}, taught).includes('split-digraph-broken'));
assert.ok(flagWord({word:'cat', phonemes:['c','a']}, taught).includes('joinback-fail'));
// magic-e word must NOT be flagged as joinback-fail (invariants strips the _)
assert.deepStrictEqual(flagWord({word:'abused', phonemes:['a','b','u_e','s','d']}, taught), []);
console.log('phoneme-lint.test OK');
