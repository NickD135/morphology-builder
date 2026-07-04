export const meta = {
  name: 'word-study-vet',
  description: 'Flag fake / non-words in the make-able pool so they can be dropped before shipping',
  phases: [{ title: 'Vet' }],
}

// args = array of words (or its JSON string).
const words = typeof args === 'string' ? JSON.parse(args) : args;
const BATCH = 150;
const batches = [];
for (let i = 0; i < words.length; i += BATCH) batches.push(words.slice(i, i + BATCH));
log(`Vetting ${words.length} words in ${batches.length} batches`);

const SCHEMA = {
  type: 'object',
  properties: { fakes: { type: 'array', items: { type: 'string' } } },
  required: ['fakes'],
};

const PROMPT = [
  'Below is a list of candidate spelling words for a UK/Australian PRIMARY school program (ages 9-12).',
  'Some are not genuine standalone English words — e.g. two words mashed together ("abit" = a bit),',
  'bare fragments, or strings that are not real dictionary words on their own.',
  'Return ONLY the entries that are NOT genuine, real, standalone English words suitable to teach.',
  'Be conservative: do NOT flag real but uncommon/technical words (e.g. "periscope", "malfunction",',
  'inflected forms like "abuses", "rebuilt"). Only flag things that are genuinely not real words.',
  'Return {"fakes": [...]} — the exact strings to drop (possibly an empty array).',
].join('\n');

const results = await parallel(batches.map((b, idx) => () =>
  agent(PROMPT + '\n\nWords: ' + JSON.stringify(b), { label: 'vet:' + idx, phase: 'Vet', schema: SCHEMA, model: 'sonnet', effort: 'low' })
));

const fakes = results.filter(Boolean).flatMap(r => (r && r.fakes) || []);
log(`Flagged ${fakes.length} non-words`);
return fakes;
