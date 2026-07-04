export const meta = {
  name: 'word-study-phoneme-regen',
  description: 'Re-segment phonemes for words whose splits bundled suffixes/blends, to house grapheme style',
  phases: [{ title: 'Regen' }],
}

// args = { dir, count } — directory of batch-<i>.json files, each an array of {word, syllables}.
const cfg = typeof args === 'string' ? JSON.parse(args) : args;
const DIR = cfg.dir;
const COUNT = cfg.count;
log(`Re-segmenting phonemes from ${COUNT} batch files`);

const SCHEMA = {
  type: 'object',
  properties: {
    entries: {
      type: 'array',
      items: {
        type: 'object',
        properties: { word: { type: 'string' }, phonemes: { type: 'array', items: { type: 'string' } } },
        required: ['word', 'phonemes'],
      },
    },
  },
  required: ['entries'],
};

const RULES = [
  'Re-split each word into GRAPHEMES for a UK/Australian primary phonics activity (ages 9-12).',
  'A grapheme is the letter(s) that spell ONE sound. Segment to single graphemes — do NOT bundle',
  'multiple sounds into one box. HARD INVARIANT: the letters of phonemes.join("") (with any "_"',
  'removed) must exactly equal the letters of the word, in order.',
  '',
  'KEEP THESE DIGRAPHS/TRIGRAPHS TOGETHER (one sound):',
  '  consonant: sh ch th ng ck ph wh qu tch dge',
  '  vowel teams: ai ay ee ea oa ow oo ew ue oi oy ou au aw igh ie or ir ar er ur air ear',
  '  double letters (one sound): ss ll ff zz nn pp tt rr dd cc mm bb gg',
  '  consonant-le ending: "le" (e.g. table -> t,a,b,le ; circle -> c,ir,c,le)',
  '  split-digraph magic-e: vowel + "_e" (a_e e_e i_e o_e u_e y_e), e.g. cake -> c,a_e,k',
  '',
  'SPLIT THESE (they are NOT single graphemes — this is the whole point):',
  '  BLENDS are separate letters: pr -> p,r ; gr -> g,r ; cl -> c,l ; st -> s,t ; sp -> s,p ; bl -> b,l (etc.)',
  '  SUFFIXES segment into graphemes: -ment -> m,e,n,t ; -less -> l,e,ss ; -ness -> n,e,ss ;',
  '    -ful -> f,u,l ; -ly -> l,y ; -ing -> i,ng ; -ance -> a,n,ce ; -ence -> e,n,ce ; -er -> er ; -ist -> i,s,t',
  '  The /shun/ endings SPLIT into smaller graphemes (never one box):',
  '    -tion -> t,io,n ; -sion -> s,io,n ; -ssion -> ss,io,n ; -cian -> c,ia,n ; -tial -> t,ia,l ; -cial -> c,ia,l',
  '  Never output "ing", "tion", "sion", "ment", "less", "ble", or a blend as a single grapheme.',
  '',
  'The word\'s syllables are given as a rough guide only; segment by SOUND, not syllable.',
  'Return {entries:[{word, phonemes:[...]}]} — one entry per input word, same order.',
].join('\n');

const idx = Array.from({ length: COUNT }, (_, i) => i);
const results = await parallel(idx.map((i) => () =>
  agent(
    RULES + '\n\nRead this JSON file (array of {word, syllables}) and re-segment each word:\n' + DIR + '/batch-' + i + '.json',
    { label: 'ph:' + i, phase: 'Regen', schema: SCHEMA, model: 'sonnet', effort: 'medium' }
  )
));

const entries = results.filter(Boolean).flatMap(r => (r && r.entries) || []);
log(`Re-segmented ${entries.length} words`);
return entries;
