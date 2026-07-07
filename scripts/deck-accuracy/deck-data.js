// scripts/deck-accuracy/deck-data.js
function wsToDeckWord(ws){
  const m = ws.morphemes || {};
  const parts = [m.prefix, m.base, m.suffix1, m.suffix2].filter(Boolean);
  return {
    word: ws.word,
    morphemes: parts.map(p => ({ part: p, meaning: (ws.partMeanings && ws.partMeanings[p]) || '' })),
    syllables: (ws.syllables||[]).join('/'),
    phonemes: (ws.phonemes||[]).map(g => ({ g })),
  };
}
function matrixFor(morpheme, type, words){
  const col = new Set(), col2 = new Set();  // col -> prefixes field, col2 -> suffixes field
  for (const w of words){
    const m = w.morphemes || {};
    if (type === 'base' && m.base === morpheme){ if (m.prefix) col.add(m.prefix); if (m.suffix1) col2.add(m.suffix1); }
    else if (type === 'prefix' && m.prefix === morpheme){ if (m.base) col.add(m.base); if (m.suffix1) col2.add(m.suffix1); }
    else if (type === 'suffix' && (m.suffix1 === morpheme || m.suffix2 === morpheme)){ if (m.prefix) col.add(m.prefix); if (m.base) col2.add(m.base); }
  }
  return { prefixes: [...col].slice(0,6), suffixes: [...col2].slice(0,6) };
}
// ------------------------------------------------------------------
// buildDeckData / validateDeckData
// Assembles a full teaching-deck DATA object (as consumed by
// wordlabs-deck-generator.js) entirely from verified word-study data —
// no AI, no invented facts. See docs/superpowers/sdd/task-2-brief.md.
// ------------------------------------------------------------------

var STAGE_ORDER = ['s2e', 's2l', 's3e', 's3l', 's4'];
function stageRank(stage) {
  var i = STAGE_ORDER.indexOf(stage);
  return i === -1 ? STAGE_ORDER.length : i;
}

function slotMatch(w, morpheme, type) {
  var m = w.morphemes || {};
  if (type === 'base') return m.base === morpheme;
  if (type === 'prefix') return m.prefix === morpheme;
  if (type === 'suffix') return m.suffix1 === morpheme || m.suffix2 === morpheme;
  return false;
}

function distinctByWord(list) {
  var map = new Map();
  list.forEach(function (w) { if (!map.has(w.word)) map.set(w.word, w); });
  return Array.from(map.values());
}

function countPunctuation(sentence) {
  if (!sentence) return 0;
  var m = sentence.match(/[,;:]/g);
  return m ? m.length : 0;
}

// Optional, defensive lookup into window.MORPHEMES (data.js) for a little
// extra flavour (origin group). Never required — ctx.morphemeMeaning is the
// authoritative meaning source, and this must degrade gracefully if the
// global `window` isn't populated (or isn't the same object) at call time.
function lookupMorphemeEntry(morpheme, type) {
  try {
    var W = (typeof window !== 'undefined') ? window : null;
    if (!W || !W.MORPHEMES) return null;
    var key = type === 'base' ? 'bases' : (type === 'prefix' ? 'prefixes' : 'suffixes');
    var list = W.MORPHEMES[key];
    if (!Array.isArray(list)) return null;
    return list.find(function (e) { return e.form === morpheme || e.id === morpheme; }) || null;
  } catch (e) {
    return null;
  }
}

function originFor(entry, type) {
  var group = entry && entry.group;
  if (type === 'base') {
    if (group === 'latin') return 'Latin root';
    if (group === 'greek') return 'Greek root';
    if (group === 'anglo') return 'Anglo-Saxon (Old English) root';
    if (group === 'core') return 'Core English root';
  }
  if (type === 'prefix') return 'Prefix';
  if (type === 'suffix') return 'Suffix';
  return 'English morpheme';
}

function sentencesFor(words) {
  return words
    .map(function (w) { return w.sentences && w.sentences.correct; })
    .filter(Boolean);
}

function buildTrueOrFalse(morpheme, meaning, source) {
  var stmts = [];
  if (meaning) {
    stmts.push({ statement: "'" + morpheme + "' means '" + meaning + "'.", answer: true });
  }
  var withMeaning = source.filter(function (w) { return w.meaning; });
  for (var i = 0; i < Math.min(2, withMeaning.length); i++) {
    stmts.push({
      statement: "'" + withMeaning[i].word + "' means '" + withMeaning[i].meaning + "'.",
      answer: true,
    });
  }
  var falseCount = 0;
  for (var j = 0; j < withMeaning.length && falseCount < 2; j++) {
    var w = withMeaning[j];
    if (w.meaningDistractors && w.meaningDistractors[0]) {
      stmts.push({
        statement: "'" + w.word + "' means '" + w.meaningDistractors[0] + "'.",
        answer: false,
      });
      falseCount++;
    }
  }
  return stmts;
}

/**
 * buildDeckData(spec, ctx) -> DATA|null
 * spec = { morpheme, type } — type is 'base' | 'prefix' | 'suffix'
 * ctx  = { words, morphemeMeaning } — words is the full word-study array
 *
 * Selects focus words where the morpheme appears in the matching
 * `morphemes` slot, dedupes into examples (<=7) / day2 (2) / day3 (3) with
 * no word repeated across those three groups, and builds each day's
 * dictation sentence by joining the chosen words' verified
 * `sentences.correct`. Returns null if fewer than 3 distinct verified
 * words exist for the morpheme.
 */
function buildDeckData(spec, ctx) {
  var morpheme = spec && spec.morpheme;
  var type = spec && spec.type;
  var allWords = (ctx && ctx.words) || [];

  var pool = distinctByWord(allWords.filter(function (w) { return slotMatch(w, morpheme, type); }));
  if (pool.length < 3) return null;

  pool.sort(function (a, b) {
    var sa = stageRank(a.stage), sb = stageRank(b.stage);
    if (sa !== sb) return sa - sb;
    return a.word.length - b.word.length;
  });

  // Hardest/longest words go to day3, next to day2, remainder (easiest
  // first) become the Monday example list — a simple, defensible ramp of
  // difficulty across the week.
  var remaining = pool.slice();
  var day3Pool = remaining.splice(Math.max(0, remaining.length - 3), 3);
  var day2Pool = remaining.splice(Math.max(0, remaining.length - 2), 2);
  var examplePool = remaining.slice(0, 7);

  var morphemeEntry = lookupMorphemeEntry(morpheme, type);
  var meaning = (ctx && ctx.morphemeMeaning) || (morphemeEntry && morphemeEntry.meaning) || '';
  var origin = originFor(morphemeEntry, type);

  var matrix = matrixFor(morpheme, type, allWords);

  var examples = examplePool.map(function (w) {
    return { word: w.word, definition: w.meaning || '' };
  });

  var day2Sentence = sentencesFor(day2Pool).join(' ');
  var day3Sentence = sentencesFor(day3Pool).join(' ');

  var day1Sentences = sentencesFor(pool).slice(0, 3);

  var trueOrFalse = buildTrueOrFalse(morpheme, meaning, examplePool.length ? examplePool : pool);

  return {
    morpheme: morpheme,
    type: type,
    meaning: meaning,
    origin: origin,
    prefixes: matrix.prefixes,
    suffixes: matrix.suffixes,
    examples: examples,
    trueOrFalse: trueOrFalse,
    day1Sentences: day1Sentences,
    day2: {
      sentence: day2Sentence,
      punctuationCount: countPunctuation(day2Sentence),
      words: day2Pool.map(wsToDeckWord),
    },
    day3: {
      sentence: day3Sentence,
      punctuationCount: countPunctuation(day3Sentence),
      words: day3Pool.map(wsToDeckWord),
    },
  };
}

/**
 * validateDeckData(data) -> { ok, errors:[str] }
 * Re-verifies every day2/day3 word against the same invariants used to
 * gate word-study data (syllable join + phoneme join/multiset, magic-e
 * aware), requires the example/day2/day3 word sets to be pairwise
 * disjoint (no repeats across the week), and requires a non-empty
 * prefix/suffix matrix (proof the morpheme actually combines with other
 * morphemes in real word-study words).
 */
function validateDeckData(data) {
  var errors = [];
  if (!data) { errors.push('no data'); return { ok: false, errors: errors }; }

  var invariants = require('../word-study/invariants.js');

  function checkDayWords(dayKey) {
    var day = data[dayKey];
    if (!day || !Array.isArray(day.words)) { errors.push(dayKey + ': missing words'); return; }
    day.words.forEach(function (dw) {
      var recon = {
        word: dw.word,
        syllables: (dw.syllables || '').split('/'),
        phonemes: (dw.phonemes || []).map(function (p) { return p.g; }),
      };
      var sy = invariants.checkSyllables(recon);
      if (!sy.ok) errors.push(dayKey + ' "' + dw.word + '" syllables: ' + sy.msg);
      var ph = invariants.checkPhonemes(recon);
      if (!ph.ok) errors.push(dayKey + ' "' + dw.word + '" phonemes: ' + ph.msg);
    });
  }
  checkDayWords('day2');
  checkDayWords('day3');

  var exampleSet = new Set((data.examples || []).map(function (w) { return w.word; }));
  var day2Set = new Set(((data.day2 && data.day2.words) || []).map(function (w) { return w.word; }));
  var day3Set = new Set(((data.day3 && data.day3.words) || []).map(function (w) { return w.word; }));
  var overlap = new Set();
  day2Set.forEach(function (w) { if (exampleSet.has(w) || day3Set.has(w)) overlap.add(w); });
  day3Set.forEach(function (w) { if (exampleSet.has(w) || day2Set.has(w)) overlap.add(w); });
  if (overlap.size) errors.push('word repeated across example/day2/day3: ' + Array.from(overlap).join(', '));

  if (!Array.isArray(data.prefixes) || !data.prefixes.length) errors.push('prefixes matrix is empty');
  if (!Array.isArray(data.suffixes) || !data.suffixes.length) errors.push('suffixes matrix is empty');

  return { ok: errors.length === 0, errors: errors };
}

module.exports = { wsToDeckWord, matrixFor, buildDeckData, validateDeckData };
