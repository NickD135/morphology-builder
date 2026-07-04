export const meta = {
  name: 'word-study-vet',
  description: 'Flag fake / non-words in the make-able pool so they can be dropped before shipping',
  phases: [{ title: 'Vet' }],
}

// args = { dir, count } — a directory of batch-<i>.json files, each a JSON array of words.
const cfg = typeof args === 'string' ? JSON.parse(args) : args;
const DIR = cfg.dir;
const COUNT = cfg.count;
log(`Vetting from ${COUNT} batch files in ${DIR}`);

const SCHEMA = {
  type: 'object',
  properties: { fakes: { type: 'array', items: { type: 'string' } } },
  required: ['fakes'],
};

const PROMPT = [
  'The file below contains candidate spelling words for a UK/Australian PRIMARY school program (ages 9-12).',
  'Some are NOT genuine standalone English words — e.g. two words mashed together ("abit" = a bit),',
  'bare fragments, proper nouns/place names/brand names ("aviv", "philly"), or informal abbreviations',
  '("secs", "regs", "dems"). Return ONLY the entries that are NOT genuine, real, standalone common',
  'English words suitable to teach primary children.',
  'Be conservative: do NOT flag real but uncommon/technical words (e.g. "periscope", "malfunction")',
  'or normal inflections ("rebuilt", "teachers"). Only flag things that are genuinely not real,',
  'teachable words. Return {"fakes": [...]} with the exact strings to drop (may be empty).',
].join('\n');

const idx = Array.from({ length: COUNT }, (_, i) => i);
const results = await parallel(idx.map((i) => () =>
  agent(
    PROMPT + '\n\nRead this JSON file (an array of words) and vet them:\n' + DIR + '/batch-' + i + '.json',
    { label: 'vet:' + i, phase: 'Vet', schema: SCHEMA, model: 'sonnet', effort: 'low' }
  )
));

const fakes = results.filter(Boolean).flatMap(r => (r && r.fakes) || []);
log(`Flagged ${fakes.length} non-words`);
return fakes;
