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

// --- Task 3 tests ---

var FIXTURE_STAGE_MAP = {
  prefix: { tele:'s3l', micro:'s3l', re:'s2e', un:'s2e' },
  base:   { scope:'s3l', act:'s2e' },
  suffix: { s:'s2e', ed:'s2e', ing:'s2e', ion:'s3e', ive:'s3e' }
};

test('scoreCombo returns a number', function(){
  var c = { p:null, b:'act', s1:null, s2:null, word:'act' };
  assert.strictEqual(typeof WL.scoreCombo(c, FIXTURE_STAGE_MAP), 'number');
});

test('scoreCombo — higher stage scores higher', function(){
  var easy = { p:null, b:'act', s1:null, s2:null, word:'act' };
  var hard = { p:'tele', b:'scope', s1:null, s2:null, word:'telescope' };
  assert.ok(WL.scoreCombo(hard, FIXTURE_STAGE_MAP) > WL.scoreCombo(easy, FIXTURE_STAGE_MAP));
});

test('scoreCombo — ties on stage broken by length', function(){
  var short = { p:null, b:'act', s1:null,  s2:null, word:'act' };
  var long  = { p:null, b:'act', s1:'ing', s2:null, word:'acting' };
  assert.ok(WL.scoreCombo(long, FIXTURE_STAGE_MAP) > WL.scoreCombo(short, FIXTURE_STAGE_MAP));
});

test('scoreCombo — unknown stage defaults to idx 0 (easiest)', function(){
  var unknown = { p:null, b:'xxxx', s1:null, s2:null, word:'xxxx' };
  var known = { p:null, b:'scope', s1:null, s2:null, word:'scope' };
  assert.ok(WL.scoreCombo(unknown, FIXTURE_STAGE_MAP) < WL.scoreCombo(known, FIXTURE_STAGE_MAP),
    'unknown bases should sort before known s3l bases');
});

// --- Task 4 tests ---

test('distanceConfig — far below returns size 5 at easiest end', function(){
  assert.deepStrictEqual(WL.distanceConfig(-4), { size: 5, anchorRatio: 0.0 });
  assert.deepStrictEqual(WL.distanceConfig(-2), { size: 5, anchorRatio: 0.0 });
});

test('distanceConfig — d = -1 returns size 7 lower-biased', function(){
  var c = WL.distanceConfig(-1);
  assert.strictEqual(c.size, 7);
  assert.ok(c.anchorRatio > 0 && c.anchorRatio < 0.5);
});

test('distanceConfig — d = 0 returns size 8 centred', function(){
  assert.deepStrictEqual(WL.distanceConfig(0), { size: 8, anchorRatio: 0.5 });
});

test('distanceConfig — d = +1 returns size 9 upper-biased', function(){
  var c = WL.distanceConfig(1);
  assert.strictEqual(c.size, 9);
  assert.ok(c.anchorRatio > 0.5 && c.anchorRatio < 1.0);
});

test('distanceConfig — far above returns size 10 at hardest end', function(){
  assert.deepStrictEqual(WL.distanceConfig(2),  { size: 10, anchorRatio: 1.0 });
  assert.deepStrictEqual(WL.distanceConfig(4),  { size: 10, anchorRatio: 1.0 });
});

// --- Task 5 tests ---

function mockPool(n){
  var p = [];
  for (var i = 0; i < n; i++){
    p.push({ p:null, b:'x', s1:null, s2:null, word:'word'+i });
  }
  return p;
}

test('buildListForStage — far below picks easiest 5 from pool start', function(){
  var pool = mockPool(20);
  var list = WL.buildListForStage(pool, 's3l', 's2e');
  assert.deepStrictEqual(list, ['word0','word1','word2','word3','word4']);
});

test('buildListForStage — far above picks hardest 10 from pool end', function(){
  var pool = mockPool(20);
  var list = WL.buildListForStage(pool, 's2e', 's4');
  assert.deepStrictEqual(list, ['word10','word11','word12','word13','word14','word15','word16','word17','word18','word19']);
});

test('buildListForStage — same stage picks 8 centred', function(){
  // distance 0 → size 8, anchor 0.5. Pool 20: anchor=round(0.5*19)=10, start=10-4=6, end=14.
  var pool = mockPool(20);
  var list = WL.buildListForStage(pool, 's3e', 's3e');
  assert.strictEqual(list.length, 8);
  assert.strictEqual(list[0], 'word6');
  assert.strictEqual(list[7], 'word13');
});

test('buildListForStage — pool shorter than size returns whole pool', function(){
  var pool = mockPool(3);
  var list = WL.buildListForStage(pool, 's3l', 's2e');
  assert.strictEqual(list.length, 3);
});

test('buildListForStage — empty pool returns []', function(){
  assert.deepStrictEqual(WL.buildListForStage([], 's3e', 's3e'), []);
});

test('buildListForStage — adjacent levels overlap', function(){
  var pool = mockPool(20);
  var voy = WL.buildListForStage(pool, 's3e', 's2l'); // d = -1
  var wan = WL.buildListForStage(pool, 's3e', 's3e'); // d = 0
  var shared = voy.filter(function(w){ return wan.indexOf(w) !== -1; });
  assert.ok(shared.length > 0, 'adjacent levels should share at least one word');
});

// --- Task 6 tests ---

var FIXTURE_MORPHEMES_FULL = {
  prefixes: [
    { id:'un',    stage:'s2e', display:'un-',    meaning:'not',     examples:[] },
    { id:'tele',  stage:'s3l', display:'tele-',  meaning:'far',     examples:[] },
    { id:'micro', stage:'s3l', display:'micro-', meaning:'small',   examples:[] }
  ],
  bases: [
    { id:'act',   stage:'s2e', display:'act',    meaning:'do',      examples:[] },
    { id:'scope', stage:'s3l', display:'scope',  meaning:'look at', examples:[] }
  ],
  suffixes: [
    { id:'s',   stage:'s2e', display:'-s',   meaning:'plural', examples:[] },
    { id:'ed',  stage:'s2e', display:'-ed',  meaning:'past',   examples:[] },
    { id:'ing', stage:'s2e', display:'-ing', meaning:'doing',  examples:[] },
    { id:'ion', stage:'s3e', display:'-ion', meaning:'state',  examples:[] }
  ]
};

var SCOPE_COMBOS = [
  { p:null,   b:'scope', s1:null, s2:null, word:'scope' },
  { p:null,   b:'scope', s1:'s',  s2:null, word:'scopes' },
  { p:null,   b:'scope', s1:'ed', s2:null, word:'scoped' },
  { p:null,   b:'scope', s1:'ing',s2:null, word:'scoping' },
  { p:'tele', b:'scope', s1:null, s2:null, word:'telescope' },
  { p:'tele', b:'scope', s1:'s',  s2:null, word:'telescopes' },
  { p:'micro',b:'scope', s1:null, s2:null, word:'microscope' },
  { p:'micro',b:'scope', s1:'s',  s2:null, word:'microscopes' }
];

test('buildAllLevels — returns 5 stage keys', function(){
  var res = WL.buildAllLevels('scope', 'base', {
    morphemes: FIXTURE_MORPHEMES_FULL,
    combos: SCOPE_COMBOS
  });
  ['s2e','s2l','s3e','s3l','s4'].forEach(function(s){
    assert.ok(Array.isArray(res[s]), s + ' present');
  });
});

test('buildAllLevels — s2e for s3l-home morpheme is 5 easiest', function(){
  var res = WL.buildAllLevels('scope', 'base', {
    morphemes: FIXTURE_MORPHEMES_FULL,
    combos: SCOPE_COMBOS
  });
  assert.strictEqual(res.s2e.length, 5);
  assert.ok(res.s2e.indexOf('scope') !== -1);
});

test('buildAllLevels — s3l for s3l-home morpheme uses whole pool when pool<=size', function(){
  var res = WL.buildAllLevels('scope', 'base', {
    morphemes: FIXTURE_MORPHEMES_FULL,
    combos: SCOPE_COMBOS
  });
  assert.strictEqual(res.s3l.length, 8);
});

test('buildAllLevels — meta carries homeStage + poolSize + morpheme', function(){
  var res = WL.buildAllLevels('scope', 'base', {
    morphemes: FIXTURE_MORPHEMES_FULL,
    combos: SCOPE_COMBOS
  });
  assert.strictEqual(res.meta.homeStage, 's3l');
  assert.strictEqual(res.meta.poolSize, 8);
  assert.strictEqual(res.meta.morpheme.id, 'scope');
});

test('buildAllLevels — unknown morpheme returns empty lists', function(){
  var res = WL.buildAllLevels('zzz', 'base', {
    morphemes: FIXTURE_MORPHEMES_FULL,
    combos: SCOPE_COMBOS
  });
  assert.deepStrictEqual(res.s2e, []);
  assert.strictEqual(res.meta.poolSize, 0);
});

// --- enrichWords tests ---

test('enrichWords — known combo gets structured object with clue', function(){
  var combos = [{ p:'un', b:'happy', s1:'ness', s2:null, word:'unhappiness' }];
  var morphemes = {
    prefixes: [{ id:'un', stage:'s2e', meaning:'not' }],
    bases: [{ id:'happy', stage:'s2e', meaning:'feeling good' }],
    suffixes: [{ id:'ness', stage:'s2e', meaning:'state of' }]
  };
  var result = WL.enrichWords(['unhappiness'], { morphemes: morphemes, combos: combos });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].word, 'unhappiness');
  assert.strictEqual(result[0].prefix, 'un');
  assert.strictEqual(result[0].base, 'happy');
  assert.strictEqual(result[0].suffix1, 'ness');
  assert.strictEqual(result[0].suffix2, '');
  assert.ok(result[0].clue.indexOf('not') !== -1, 'clue contains prefix meaning');
  assert.ok(result[0].clue.indexOf('feeling good') !== -1, 'clue contains base meaning');
});

test('enrichWords — unknown word gets minimal {word} object', function(){
  var result = WL.enrichWords(['xylophone'], { morphemes: FIXTURE_MORPHEMES_FULL, combos: SCOPE_COMBOS });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].word, 'xylophone');
  assert.strictEqual(result[0].prefix, undefined);
});

test('enrichWords — merges phonemeData when provided', function(){
  var combos = [{ p:null, b:'happy', s1:null, s2:null, word:'happy' }];
  var morphemes = { prefixes:[], bases:[{id:'happy',stage:'s2e',meaning:'feeling good'}], suffixes:[] };
  var pd = { happy: { syllables:['hap','py'], phonemes:['h','a','pp','y'] } };
  var result = WL.enrichWords(['happy'], { morphemes:morphemes, combos:combos, phonemeData:pd });
  assert.deepStrictEqual(result[0].syllables, ['hap','py']);
  assert.deepStrictEqual(result[0].phonemes, ['h','a','pp','y']);
  assert.strictEqual(result[0].base, 'happy');
});

test('enrichWords — mixed known and unknown', function(){
  var result = WL.enrichWords(['scope', 'xylophone'], {
    morphemes: FIXTURE_MORPHEMES_FULL,
    combos: SCOPE_COMBOS
  });
  assert.strictEqual(result[0].base, 'scope');
  assert.strictEqual(result[1].word, 'xylophone');
  assert.strictEqual(result[1].base, undefined);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
