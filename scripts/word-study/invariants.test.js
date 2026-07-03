const assert = require('assert');
const V = require('./invariants');

const good = {
  word:"unhelpful", stage:"s2e",
  morphemes:{prefix:"un",base:"help",suffix1:"ful",suffix2:""},
  syllables:["un","help","ful"],
  phonemes:["u","n","h","e","l","p","f","u","l"],
  meaning:"not giving help", meaningDistractors:["full of help","helping a lot"],
  sentences:{correct:"The unhelpful map got us lost.", wrong:["She was unhelpful and fixed it fast.","Thanks for being so unhelpful and kind."]},
  synonym:"useless", synonymDistractors:["helpful","kind"],
  partMeanings:{un:"not",help:"to help",ful:"full of"},
  syllablesSource:"agent"
};
// magic-e word: rejoin via letter-multiset, not string concat
const magicE = Object.assign({}, good, {
  word:"rewrite", morphemes:{prefix:"re",base:"write",suffix1:"",suffix2:""},
  syllables:["re","write"], phonemes:["r","e","wr","i_e","t"],
  meaning:"to write again", meaningDistractors:["to read","to erase"],
  sentences:{correct:"Please rewrite the messy note.", wrong:["Rewrite this apple.","The dog will rewrite loudly."]},
  synonym:"redo", synonymDistractors:["erase","read"],
  partMeanings:{re:"again or back",write:"to write"}
});

assert.deepStrictEqual(V.validateEntry(good), {ok:true, fails:[]});
assert.deepStrictEqual(V.validateEntry(magicE), {ok:true, fails:[]});

// bad: syllables don't rejoin
const badSyl = Object.assign({}, good, {syllables:["un","helped"]});
assert.strictEqual(V.validateEntry(badSyl).ok, false);
assert.ok(V.validateEntry(badSyl).fails.some(f=>/syll/i.test(f)));

// bad: phoneme letter-multiset mismatch (missing final l)
const badPho = Object.assign({}, good, {phonemes:["u","n","h","e","l","p","f","u"]});
assert.strictEqual(V.validateEntry(badPho).ok, false);

// bad: synonym equals a distractor
const badSyn = Object.assign({}, good, {synonymDistractors:["useless","kind"]});
assert.strictEqual(V.validateEntry(badSyn).ok, false);

// bad: a wrong sentence doesn't contain the word
const badSent = Object.assign({}, good, {sentences:{correct:"The unhelpful map got us lost.", wrong:["No target word here.","Also missing it."]}});
assert.strictEqual(V.validateEntry(badSent).ok, false);

console.log("invariants.test OK");
