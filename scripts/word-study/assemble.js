// Merges generated entries with the manifest, runs invariants, writes the shipped data file
// plus rejects (hard-invariant failures) and review-flags (content to eyeball, still shipped).
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../');
const R = f => path.join(ROOT, f);
const V = require('./invariants');

// Deterministic phonics corrections applied to every phoneme list at assembly time — a bundled
// grapheme is expanded into its taught constituent graphemes (all still real graphemes: ng, le,
// ew, y). Keeps letters/order identical, so the rejoin invariant is unaffected.
const GRAPHEME_SPLITS = {
  ing: ['i', 'ng'],   // short i + ng digraph
  ble: ['b', 'le'],   // consonant-le
  bly: ['b', 'l', 'y'],
  ly:  ['l', 'y'],
  iew: ['i', 'ew'],   // ew is the taught grapheme
};
function normalizePhonemes(phonemes){
  const out = [];
  phonemes.forEach(p => {
    const split = GRAPHEME_SPLITS[p];
    if (split) out.push(...split); else out.push(p);
  });
  return out;
}

const manifest = JSON.parse(fs.readFileSync(R('scripts/word-study/manifest.json'), 'utf8'));
const raw = JSON.parse(fs.readFileSync(R('scripts/word-study/raw-generated.json'), 'utf8'));
const genByWord = {};
raw.forEach(e => { genByWord[e.word] = e; });

// Fake / non-word DROP list from the vetting pass (word-vet.workflow.js). If absent, only the
// self-description heuristic below drops words. Fakes are removed entirely — Nick's call: a fake
// word never reaches a student, and the pool already spans every real make-able word so nothing
// needs swapping in.
let FAKES = new Set();
try { FAKES = new Set(JSON.parse(fs.readFileSync(R('scripts/word-study/fakes.json'), 'utf8'))); } catch (e) {}
// the agent sometimes betrays a non-word in its own definition:
const RED_MEANING = /informal|short form|not a (real|standard|proper|word)|abbreviation|misspell|mashed|slang|typo|\bnon-?word\b/i;
// sensitive words: NOT dropped, just flagged for Nick to eyeball in review.
const SENSITIVE = /\b(abus|drug|kill|hate|sex|death|dead|violen|weapon|gun|suicide)/i;

const shipped = [], rejects = [], review = [], dropped = [];
manifest.forEach(m => {
  const g = genByWord[m.word];
  if (!g) { rejects.push({ word: m.word, reason: 'no generated entry' }); return; }
  // scrap fakes/non-words before they can ship
  if (FAKES.has(m.word)) { dropped.push({ word: m.word, reason: 'vetted non-word' }); return; }
  if (g.meaning && RED_MEANING.test(g.meaning)) { dropped.push({ word: m.word, reason: 'self-described non-word: ' + g.meaning }); return; }
  const entry = {
    word: m.word, stage: m.stage, morphemes: m.morphemes,
    syllables: (m.reuse && m.reuse.syllables) || g.syllables,
    phonemes: normalizePhonemes((m.reuse && m.reuse.phonemes) || g.phonemes),
    meaning: g.meaning, meaningDistractors: g.meaningDistractors,
    sentences: g.sentences, synonym: g.synonym, synonymDistractors: g.synonymDistractors,
    partMeanings: m.partMeanings,
    syllablesSource: (m.reuse && m.reuse.syllables) ? 'pool' : (g.syllablesSource || 'agent'),
  };
  const v = V.validateEntry(entry);
  if (!v.ok) { rejects.push({ word: m.word, reason: v.fails.join(' | ') }); return; }
  shipped.push(entry);
  const flags = [];
  if (entry.word.length <= 3) flags.push('very-short');
  if (SENSITIVE.test(entry.word)) flags.push('sensitive-word');
  if (flags.length) review.push({ word: m.word, flags, meaning: entry.meaning });
});

shipped.sort((a, b) => a.word < b.word ? -1 : 1);
const header =
  '// ═══ WORD STUDY — full make-able-word pool (v2) — see docs/superpowers/specs/2026-07-03-word-study-full-pool-design.md\n' +
  '// Auto-generated: ' + shipped.length + ' words. Invariant-verified. Fixes flow via content-editor (word_corrections).\n' +
  'window.WORD_STUDY_WORDS = [\n';
const body = shipped.map(e => '  ' + JSON.stringify(e)).join(',\n');
fs.writeFileSync(R('word-study-data.js'), header + body + '\n];\n');
fs.writeFileSync(R('word-study-rejects.json'), JSON.stringify(rejects, null, 2));
fs.writeFileSync(R('word-study-review.json'), JSON.stringify(review, null, 2));
fs.writeFileSync(R('word-study-dropped.json'), JSON.stringify(dropped, null, 2));

const src = {}; shipped.forEach(e => src[e.syllablesSource] = (src[e.syllablesSource] || 0) + 1);
const unverified = shipped.filter(e => e.syllablesSource === 'agent' && e.syllables.length > 1).length;
console.log('shipped:', shipped.length, '| rejects:', rejects.length, '| dropped(fake):', dropped.length, '| review-flags:', review.length);
console.log('syllablesSource:', JSON.stringify(src), '| multi-syllable unverified:', unverified);
