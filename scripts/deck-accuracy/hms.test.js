// scripts/deck-accuracy/hms.test.js
const assert = require('assert');
const { parseDivisions, pickDivision } = require('./hms');
const html = '<span class="Answer_Red" data-nosnippet>re-con-struc-tion</span> junk ' +
             '<span class="Answer_Red" data-nosnippet>ree-kun-struhk-shun</span>';
assert.deepStrictEqual(parseDivisions(html), ['re-con-struc-tion','ree-kun-struhk-shun']);
assert.deepStrictEqual(pickDivision(html, 'reconstruction'), ['re','con','struc','tion']);
assert.strictEqual(pickDivision(html, 'nothere'), null);            // no division joins to the word
assert.strictEqual(pickDivision('<p>no spans</p>', 'x'), null);
console.log('hms.test OK');
