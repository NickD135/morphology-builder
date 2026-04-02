import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://wordlabs.app',
  'https://morphology-builder.vercel.app',
  'https://nickd135.github.io',
  'http://localhost:8080',
  'http://localhost:3000',
];

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function corsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

Deno.serve(async (req: Request) => {
  const headers = corsHeaders(req);
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'AI not configured — ANTHROPIC_API_KEY not found in env' }, 500);

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
    console.log('Anthropic response stop_reason:', data.stop_reason, 'content blocks:', data.content?.length);
    const text: string = data.content?.[0]?.text || '';
    console.log('Raw AI text length:', text.length, 'first 200:', text.slice(0, 200));

    if (!text) {
      return json({ error: 'AI returned empty response (stop_reason: ' + (data.stop_reason || 'unknown') + ')' }, 500);
    }

    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return json({ error: 'Could not extract JSON array from AI response. First 300 chars: ' + text.slice(0, 300) }, 500);
    }

    let analyzed;
    try {
      analyzed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      return json({ error: 'JSON parse failed: ' + (parseErr as Error).message + '. First 300 chars: ' + jsonMatch[0].slice(0, 300) }, 500);
    }

    if (!Array.isArray(analyzed) || analyzed.length === 0) {
      return json({ error: 'AI returned empty array. Raw text length: ' + text.length }, 500);
    }

    return json({ words: analyzed });
  } catch (err) {
    console.error('analyze-words error:', err);
    return json({ error: (err as Error).message || 'Internal error' }, 500);
  }
});
