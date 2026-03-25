import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  // Verify teacher auth
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  let body: { morphemes: { form: string; type: string }[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (!body.morphemes || !Array.isArray(body.morphemes) || body.morphemes.length === 0) {
    return json({ error: 'Missing morphemes array' }, 400);
  }

  const morphemes = body.morphemes.slice(0, 30);

  const prompt = `You are a linguistics expert helping primary school teachers (ages 9-12, Australian English).

For each morpheme below, generate data for two educational games:

**Meaning Mode:** Students match morphemes to their meanings (simple multiple choice).
**Mission Mode:** Students combine morphemes with base words to form real words.

For each morpheme, provide:
1. id: the morpheme form in lowercase, no hyphens
2. form: the morpheme exactly as entered
3. type: "prefix", "suffix", or "base" (as specified)
4. meaning: child-friendly definition (max 6 words)
5. display: with hyphen indicator — prefix: "un-", suffix: "-ness", base: "happy" (no hyphen)
6. examples: array of 3-4 real English words that use this morpheme (with the morpheme underlined using <u> tags)

ADDITIONALLY for prefixes and suffixes:
7. validBases: array of 4-6 base word objects that combine with this morpheme to form real words.
   Each base object: { "id": "happy", "form": "happy", "meaning": "feeling good", "pos": ["adj"] }
   - pos can include: "noun", "verb", "adj"
   - The base + morpheme combination MUST be a real English word
   - e.g. prefix "un" → validBases: [{"id":"happy","form":"happy","meaning":"feeling good","pos":["adj"]}, {"id":"kind","form":"kind","meaning":"caring","pos":["adj"]}]

ADDITIONALLY for bases:
7. validPrefixes: array of prefix ID strings that combine with this base to form real words
8. validSuffixes: array of suffix ID strings that combine with this base to form real words
   - Only include morphemes where base + morpheme = real English word
   - Use standard morpheme IDs: un, re, dis, pre, mis, over, under, non, anti, de, en, em, ex, fore, inter, mid, multi, semi, sub, super, trans, pro, con, ad, ob, mal, mega, micro, hyper, extra, contra (prefixes)
   - Standard suffix IDs: s, es, ed, ing, en, er, or, est, ly, ion, able, ible, y, ful, less, ish, ness, ment, al, ty, ity, ous, ist, ive, ance, ence, ant, ent, ate, hood, ic, ize, ship (suffixes)

CRITICAL: Every base+morpheme combination MUST form a real English word. Do not invent combinations.

Return ONLY valid JSON — an array of objects:
[
  {
    "id": "un",
    "form": "un",
    "type": "prefix",
    "meaning": "not; opposite of",
    "display": "un-",
    "examples": ["<u>un</u>happy", "<u>un</u>kind", "<u>un</u>fair", "<u>un</u>do"],
    "validBases": [
      {"id":"happy","form":"happy","meaning":"feeling good","pos":["adj"]},
      {"id":"kind","form":"kind","meaning":"caring","pos":["adj"]},
      {"id":"fair","form":"fair","meaning":"just and right","pos":["adj"]},
      {"id":"do","form":"do","meaning":"perform","pos":["verb"]}
    ]
  },
  {
    "id": "act",
    "form": "act",
    "type": "base",
    "meaning": "do or perform",
    "display": "act",
    "examples": ["re<u>act</u>", "<u>act</u>ion", "<u>act</u>ive", "<u>act</u>or"],
    "validPrefixes": ["re", "inter", "trans", "over", "en"],
    "validSuffixes": ["ion", "ive", "or", "ing", "ed"]
  }
]

Here are the morphemes to analyze:
${morphemes.map((m, i) => `${i + 1}. "${m.form}" (${m.type})`).join('\n')}`;

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
      return json({ error: 'AI API error (HTTP ' + anthropicResp.status + '): ' + errText.slice(0, 500) }, 502);
    }

    const data = await anthropicResp.json();
    const text: string = data.content?.[0]?.text || '';

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return json({ error: 'Could not parse AI response', raw: text }, 500);
    }

    const analyzed = JSON.parse(jsonMatch[0]);
    return json({ morphemes: analyzed });
  } catch (err) {
    return json({ error: (err as Error).message || 'Internal error' }, 500);
  }
});
