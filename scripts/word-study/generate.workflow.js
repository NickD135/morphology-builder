export const meta = {
  name: 'word-study-generate',
  description: 'Author + syllable-verify full six-stage Word Study data for all make-able words',
  phases: [{ title: 'Generate' }],
}

// args = { dir, count } — the batch directory (absolute) and number of batch files.
const cfg = typeof args === 'string' ? JSON.parse(args) : args;
const DIR = cfg.dir;
const COUNT = cfg.count;
log(`Generating from ${COUNT} batch files in ${DIR}`);

const ENTRY = {
  type: 'object',
  properties: {
    word: { type: 'string' },
    syllables: { type: 'array', items: { type: 'string' } },
    phonemes: { type: 'array', items: { type: 'string' } },
    meaning: { type: 'string' },
    meaningDistractors: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 },
    sentences: {
      type: 'object',
      properties: {
        correct: { type: 'string' },
        wrong: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 },
      },
      required: ['correct', 'wrong'],
    },
    synonym: { type: 'string' },
    synonymDistractors: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 },
    syllablesSource: { type: 'string', enum: ['hms', 'pool', 'agent'] },
  },
  required: ['word', 'syllables', 'phonemes', 'meaning', 'meaningDistractors', 'sentences', 'synonym', 'synonymDistractors', 'syllablesSource'],
};
const SCHEMA = {
  type: 'object',
  properties: { entries: { type: 'array', items: ENTRY } },
  required: ['entries'],
};

const RULES = [
  'You are authoring data for "Word Study", a UK/Australian primary spelling activity for ages 9-12.',
  'Use British/Australian English spelling and vocabulary. Keep language concrete and child-friendly.',
  'For EACH word in the list, produce one entry with these fields:',
  '',
  'meaning: a short, plain definition of the whole word (one clause).',
  'meaningDistractors: EXACTLY 2 plausible-but-WRONG meanings (a child might pick them; they must be clearly wrong). Never placeholders.',
  '',
  'sentences.correct: one natural sentence that uses the word CORRECTLY and contains the exact word.',
  'sentences.wrong: EXACTLY 2 sentences that each CONTAIN the exact word but use it INCORRECTLY',
  '  (wrong meaning or wrong part of speech). Every sentence (correct + both wrong) MUST contain the word.',
  '',
  'synonym: one real word (or short 2-word phrase) that could swap in for this word.',
  '  NEVER output placeholders, "N/A", numbered fillers, or the word itself with "-ish" added.',
  '  Hard words still have a near-synonym: e.g. unhelpful -> "useless"; powerless -> "helpless";',
  '  nonfiction -> "factual". Always give a genuine best-effort word.',
  'synonymDistractors: EXACTLY 2 REAL words that are NOT synonyms of it (clearly different meaning).',
  '  The synonym must not appear among the distractors. Never use placeholders or fillers.',
  '',
  'phonemes: split the word into GRAPHEMES using the grapheme model (letters grouped by the sound they spell).',
  '  Examples: "ship" -> ["sh","i","p"]; "teacher" -> ["t","ea","ch","er"]; "night" -> ["n","igh","t"].',
  '  Split-digraph magic-e is written as vowel + "_e": "rewrite" -> ["r","e","wr","i_e","t"]; "misplace" -> ["m","i","s","p","l","a_e","c"].',
  '  The "-ing" ending is TWO graphemes, not one: the short i is its own sound and ng is a digraph -> ["i","ng"] (e.g. "running" -> [...,"i","ng"]). Never output "ing" as a single grapheme.',
  '  INVARIANT: the letters of phonemes.join("") with "_" removed must be exactly the letters of the word.',
  '  If the input provides reuse.phonemes, use it verbatim.',
  '',
  'syllables + syllablesSource:',
  '  - If the input provides reuse.syllables, use it verbatim and set syllablesSource="pool".',
  '  - Else if the word is ONE syllable, set syllables=[word] and syllablesSource="agent".',
  '  - Else (2+ syllables): WebFetch https://www.howmanysyllables.com/syllables/<word> and take the',
  '    hyphenated division it shows (e.g. "un-hap-pi-ness" -> ["un","hap","pi","ness"]) exactly, and set',
  '    syllablesSource="hms". If the fetch fails, is blocked, or 404s, syllabify the word yourself and set',
  '    syllablesSource="agent". INVARIANT: syllables.join("") must equal the word exactly, and every',
  '    syllable must contain a vowel letter (a,e,i,o,u,y).',
  '',
  'Return ONLY the schema object {entries:[...]} with one entry per input word, in the same order.',
].join('\n');

const idx = Array.from({ length: COUNT }, (_, i) => i);
await parallel(idx.map((i) => () =>
  agent(
    RULES + '\n\nRead this JSON file (an array of {word, stage, reuse}) and author an entry for every word in it:\n' +
      DIR + '/batch-' + i + '.json',
    { label: 'gen:' + i, phase: 'Generate', schema: SCHEMA, model: 'sonnet', effort: 'medium' }
  )
));

// Entries are recorded per-agent in journal.jsonl; assemble from there (avoids a multi-MB return).
return { batches: COUNT, note: 'entries in journal.jsonl' };
