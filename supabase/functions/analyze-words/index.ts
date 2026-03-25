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
  if (!apiKey) return json({ error: 'AI not configured — ANTHROPIC_API_KEY not found in env' }, 500);
  console.log('API key prefix:', apiKey.slice(0, 12) + '...');

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

  let body: { words: string[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (!body.words || !Array.isArray(body.words) || body.words.length === 0) {
    return json({ error: 'Missing words array' }, 400);
  }

  // Limit to 30 words per request
  const words = body.words.slice(0, 30);

  const prompt = `You are a linguistics expert helping primary school teachers (ages 9-12, Australian English).

For each word below, provide:
1. A short clue/definition (child-friendly, max 8 words)
2. Morpheme breakdown: prefix (if any), base word, suffix (if any), suffix2 (if any)
3. Syllable breakdown
4. Grapheme-phoneme breakdown: split the word into its sound units using the ACTUAL LETTERS from the word
5. Sound Sorter analysis: identify the most notable grapheme-sound pattern

CRITICAL RULES:
- If a word is misspelled, CORRECT IT. Use the correctly spelled version in your response.
- If a word is not a real English word, replace it with the closest real word.
- Use Australian/British English spelling (e.g. colour not color)
- If there is no prefix, use empty string ""
- If there is no suffix, use empty string ""

PHONEME RULES (VERY IMPORTANT):
- The phonemes array must use the ACTUAL LETTERS from the word, grouped by sound
- When you join all phonemes together, they MUST exactly spell the original word
- Examples:
  - "ship" → ["sh","i","p"] (joins to "ship" ✓)
  - "rain" → ["r","ai","n"] (joins to "rain" ✓)
  - "night" → ["n","igh","t"] (joins to "night" ✓)
  - "happy" → ["h","a","pp","y"] (joins to "happy" ✓)
  - "cheese" → ["ch","ee","se"] (joins to "cheese" ✓)
  - "unhappiness" → ["u","n","h","a","pp","i","n","e","ss"] (joins to "unhappiness" ✓)
- WRONG: "happy" → ["h","a","p","ee"] — this does NOT spell "happy"
- Common graphemes: sh, ch, th, wh, ck, ng, ai, ee, oo, ar, or, er, ir, ur, ow, oi, ea, igh, oa, ay, ey, ou, ph, kn, wr, mb, pp, tt, ll, ss, ff, zz

SOUND SORTER RULES:
- Pick the most interesting or teachable grapheme-sound pattern in the word
- "sound" must be one of these exact IDs: long-a, long-e, long-i, long-o, long-u, short-a, short-e, short-i, short-o, short-u, oo-long, oo-short, ow, oy, or, ar, er, air, ear, sh, ch, th, f, k, j, z, n, r, m, s, ng, w
- "soundLabel" is the display name (e.g. "Long A", "SH sound", "OW sound", "AR sound")
- "grapheme" is the specific spelling in this word (e.g. "ai", "ay", "a_e", "sh", "ch", "igh")
- "before" is the letters BEFORE the grapheme, "after" is the letters AFTER
- before + grapheme + after MUST exactly spell the word
- "ssLevel": "starter" for very common spellings, "levelup" for less common, "challenge" for unusual
- "ssType": "vowel" or "consonant"
- "distractors": 2-3 other graphemes that make the SAME sound (wrong answer options)
  - e.g. for "rain" (grapheme "ai", sound long-a): distractors ["ay","a_e"]
  - e.g. for "ship" (grapheme "sh", sound sh): distractors ["ti","ci"]
- "explain": one child-friendly sentence about this spelling pattern

Return ONLY valid JSON — an array of objects with this exact structure:
[
  {
    "word": "unhappiness",
    "clue": "the state of not being happy",
    "prefix": "un",
    "base": "happy",
    "suffix1": "ness",
    "suffix2": "",
    "syllables": ["un", "hap", "pi", "ness"],
    "phonemes": ["u", "n", "h", "a", "pp", "i", "n", "e", "ss"],
    "sound": "short-a",
    "soundLabel": "Short A",
    "grapheme": "a",
    "before": "unh",
    "after": "ppiness",
    "ssLevel": "starter",
    "ssType": "vowel",
    "distractors": ["e", "u"],
    "explain": "The letter 'a' makes the short a sound in the middle of 'happy'."
  }
]

Here are the words to analyze:
${words.map((w, i) => `${i + 1}. ${w}`).join('\n')}`;

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

    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return json({ error: 'Could not parse AI response', raw: text }, 500);
    }

    const analyzed = JSON.parse(jsonMatch[0]);
    return json({ words: analyzed });
  } catch (err) {
    return json({ error: (err as Error).message || 'Internal error' }, 500);
  }
});
