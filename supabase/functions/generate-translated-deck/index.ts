const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'AI not configured' }, 500);

  let body: { morpheme: string; type: string; language: string; languageName: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { morpheme, type, language, languageName } = body;
  if (!morpheme || !type || !language || !languageName) {
    return json({ error: 'Missing morpheme, type, language, or languageName' }, 400);
  }

  const typeLabel = type === 'prefix' ? 'prefix' : type === 'suffix' ? 'suffix' : 'root/base';
  const morphemeDisplay = type === 'prefix' ? `${morpheme}-` : type === 'suffix' ? `-${morpheme}` : morpheme;

  const prompt = `You are a morphology expert creating TRANSLATED teaching content for Australian primary school students (ages 9-12) who speak ${languageName} as their home language.

Generate a complete JSON DATA object for the ${typeLabel} morpheme "${morpheme}" with ${languageName} translations for EALD (English as an Additional Language or Dialect) students.

The JSON must match this EXACT schema. "t_" prefixed fields contain ${languageName} translations:

{
  "morpheme": "${morpheme}",
  "type": "${type}",
  "meaning": "short English meaning (3-6 words)",
  "t_meaning": "${languageName} translation of the meaning",
  "origin": "Latin: original_word OR Greek: original_word",
  "prefixes": ["prefix1", "prefix2", "prefix3", "prefix4", "prefix5"],
  "suffixes": ["suffix1", "suffix2", "suffix3", "suffix4", "suffix5"],
  "examples": [
    {"word": "word1", "definition": "Child-friendly English definition.", "t_word": "${languageName} translation of word1", "t_definition": "${languageName} translation of definition"},
    {"word": "word2", "definition": "Child-friendly English definition.", "t_word": "${languageName} translation", "t_definition": "${languageName} translation"},
    {"word": "word3", "definition": "...", "t_word": "...", "t_definition": "..."},
    {"word": "word4", "definition": "...", "t_word": "...", "t_definition": "..."},
    {"word": "word5", "definition": "...", "t_word": "...", "t_definition": "..."},
    {"word": "word6", "definition": "...", "t_word": "...", "t_definition": "..."},
    {"word": "word7", "definition": "...", "t_word": "...", "t_definition": "..."}
  ],
  "trueOrFalse": [
    {"statement": "Statement about this morpheme.", "answer": true},
    {"statement": "Statement about this morpheme.", "answer": false},
    {"statement": "Statement about this morpheme.", "answer": true},
    {"statement": "Statement about this morpheme.", "answer": true},
    {"statement": "Statement about this morpheme.", "answer": false}
  ],
  "day1Sentences": [
    "Example sentence using a word with '${morpheme}' suitable for Year 4-6 students.",
    "Another example sentence.",
    "A third example sentence."
  ],
  "day2": {
    "sentence": "A dictation sentence containing exactly 2 focus words that use '${morpheme}'.",
    "punctuationCount": 1,
    "words": [
      {
        "word": "reconstruction",
        "t_word": "${languageName} translation",
        "morphemes": [
          {"part": "re", "meaning": "again", "t_meaning": "${languageName} translation"},
          {"part": "con", "meaning": "with/together", "t_meaning": "${languageName} translation"},
          {"part": "struct", "meaning": "build", "t_meaning": "${languageName} translation"},
          {"part": "ion", "meaning": "act of", "t_meaning": "${languageName} translation"}
        ],
        "syllables": "re/con/struc/tion",
        "phonemes": [{"g":"r"},{"g":"e"},{"g":"c"},{"g":"o"},{"g":"n"},{"g":"s"},{"g":"t"},{"g":"r"},{"g":"u"},{"g":"c"},{"g":"t"},{"g":"io","s":"/sh/"},{"g":"n"}]
      },
      {
        "word": "structure",
        "t_word": "${languageName} translation",
        "morphemes": [
          {"part": "struct", "meaning": "build", "t_meaning": "${languageName} translation"},
          {"part": "ure", "meaning": "result of", "t_meaning": "${languageName} translation"}
        ],
        "syllables": "struc/ture",
        "phonemes": [{"g":"s"},{"g":"t"},{"g":"r"},{"g":"u"},{"g":"c"},{"g":"t"},{"g":"u"},{"g":"re"}]
      }
    ]
  },
  "day3": {
    "sentence": "A harder dictation sentence containing exactly 3 focus words that use '${morpheme}'.",
    "punctuationCount": 2,
    "words": [
      {
        "word": "microstructure",
        "t_word": "${languageName} translation",
        "morphemes": [
          {"part": "micro", "meaning": "small", "t_meaning": "${languageName} translation"},
          {"part": "struct", "meaning": "build", "t_meaning": "${languageName} translation"},
          {"part": "ure", "meaning": "result of", "t_meaning": "${languageName} translation"}
        ],
        "syllables": "mi/cro/struc/ture",
        "phonemes": [{"g":"m"},{"g":"i"},{"g":"c"},{"g":"r"},{"g":"o"},{"g":"s"},{"g":"t"},{"g":"r"},{"g":"u"},{"g":"c"},{"g":"t"},{"g":"u"},{"g":"re"}]
      },
      {
        "word": "destructive",
        "t_word": "${languageName} translation",
        "morphemes": [
          {"part": "de", "meaning": "down/away", "t_meaning": "${languageName} translation"},
          {"part": "struct", "meaning": "build", "t_meaning": "${languageName} translation"},
          {"part": "ive", "meaning": "having quality of", "t_meaning": "${languageName} translation"}
        ],
        "syllables": "de/struc/tive",
        "phonemes": [{"g":"d"},{"g":"e"},{"g":"s"},{"g":"t"},{"g":"r"},{"g":"u"},{"g":"c"},{"g":"t"},{"g":"i"},{"g":"ve"}]
      },
      {
        "word": "constructed",
        "t_word": "${languageName} translation",
        "morphemes": [
          {"part": "con", "meaning": "with/together", "t_meaning": "${languageName} translation"},
          {"part": "struct", "meaning": "build", "t_meaning": "${languageName} translation"},
          {"part": "ed", "meaning": "past tense", "t_meaning": "${languageName} translation"}
        ],
        "syllables": "con/struc/ted",
        "phonemes": [{"g":"c"},{"g":"o"},{"g":"n"},{"g":"s"},{"g":"t"},{"g":"r"},{"g":"u"},{"g":"c"},{"g":"t"},{"g":"e"},{"g":"d"}]
      }
    ]
  }
}

TRANSLATION RULES:
- t_meaning: translate the morpheme meaning naturally (e.g. "to build" → natural ${languageName} equivalent)
- t_word: translate each example/focus word. Use the most common, child-friendly translation
- t_definition: translate the English definition naturally into ${languageName}
- t_meaning on morphemes: translate each morpheme's meaning (e.g. "again" → ${languageName} for "again")
- If ${languageName} uses non-Latin script, provide BOTH native script AND romanisation: "native_script (romanisation)"
- Keep translations concise and age-appropriate (9-12 year olds)

MORPHEME BREAKDOWN RULES:
- In the "morphemes" arrays for day2/day3 focus words, "part" must be the ACTUAL MORPHEME TEXT (e.g. "re", "struct", "ion"), NEVER the morpheme type label (e.g. "prefix", "root", "suffix"). The parts must join together to spell the word.
- Example: "application" → [{"part":"ap","meaning":"toward"},{"part":"plic","meaning":"fold"},{"part":"at","meaning":"connecting vowel"},{"part":"ion","meaning":"act of"}] — NOT [{"part":"prefix","meaning":"toward"},{"part":"root","meaning":"fold"}]

CONTENT RULES:
- All example words MUST contain the ${typeLabel} "${morpheme}" as a morpheme
- ${type === 'base' ? `prefixes: 5 prefixes that commonly combine with "${morpheme}"` : type === 'prefix' ? `prefixes: 5 base words that commonly take the prefix "${morpheme}-"` : `suffixes: 5 base words that commonly take the suffix "-${morpheme}"`}
- ${type === 'base' ? `suffixes: 5 suffixes that commonly combine with "${morpheme}"` : type === 'prefix' ? `suffixes: 5 suffixes that can be added after the prefix + base` : `prefixes: 5 prefixes that can be added before the base + suffix`}
- examples: 7 real English words containing "${morpheme}", with child-friendly definitions
- trueOrFalse: mix of 3 true and 2 false statements
- day2: dictation with EXACTLY 2 focus words. Count commas/semicolons/colons/question marks/exclamation marks (NOT full stops) for punctuationCount
- day3: harder dictation with EXACTLY 3 focus words

PHONEME RULES:
- phonemes is an ARRAY OF OBJECTS: {"g": "grapheme"} and optionally {"g": "grapheme", "s": "/sound/"}
- "g" = actual letters from the word. Joining all "g" values MUST exactly spell the word
- "s" = sound annotation, only when non-obvious (e.g. "s" making /sh/, "c" making /s/, "ge" making /j/)
- Digraphs stay together: "sh", "ch", "th", "ph", "wh", "ng", "ck", "ee", "ea", "oa", "ai", "ay", "oo", "ou", "ow", "ar", "er", "ir", "or", "ur"
- Double consonants = one grapheme: "pp", "ll", "ss", "ff", "tt"

MORPHEME NOTES (optional "note" field):
- Assimilated prefixes: "con" → "col" before "l", "in" → "im" before "m/p", etc.
- Connecting vowels: the "a" in "education" → {"part": "a", "meaning": "connecting vowel", "note": "links base to suffix"}
- Spelling changes: "create" drops "e" before "-ion" → "creation"

Use Australian/British English spelling.
Return ONLY the JSON object. No markdown, no backticks, no explanation.`;

  try {
    const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text().catch(() => '');
      console.error('Anthropic API error:', anthropicResp.status, errText);
      return json({ error: 'AI API error (HTTP ' + anthropicResp.status + ')' }, 502);
    }

    const data = await anthropicResp.json();
    const text: string = data.content?.[0]?.text || '';

    if (!text) {
      return json({ error: 'AI returned empty response' }, 500);
    }

    // Extract JSON object from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return json({ error: 'Could not extract JSON from AI response' }, 500);
    }

    let deckData;
    try {
      deckData = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      return json({ error: 'JSON parse failed: ' + (parseErr as Error).message }, 500);
    }

    return json({ deck: deckData });
  } catch (err) {
    console.error('generate-translated-deck error:', err);
    return json({ error: (err as Error).message || 'Internal error' }, 500);
  }
});
