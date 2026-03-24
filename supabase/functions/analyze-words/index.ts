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
3. Syllable breakdown (separated by ·)
4. Phoneme breakdown (individual sounds separated by ·, use digraphs like sh, ch, th, ai, ee, oo, etc.)

IMPORTANT RULES:
- Use Australian/British English spelling and pronunciation
- For phonemes, represent sounds not letters. "sh" is one sound, "th" is one sound, "igh" is one sound
- Common digraphs: sh, ch, th, wh, ck, ng, ai, ee, oo, ar, or, er, ir, ur, ow, oi, ea, igh, oa
- If there is no prefix, leave it empty
- If there is no suffix, leave it empty
- The base is the root/stem word

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
    "phonemes": ["u", "n", "h", "a", "p", "ee", "n", "e", "s"]
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
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text().catch(() => '');
      let errMsg = 'AI API error (HTTP ' + anthropicResp.status + ')';
      try {
        const errObj = JSON.parse(errText);
        errMsg = errObj?.error?.message || errMsg;
      } catch { errMsg += ': ' + errText.slice(0, 200); }
      return json({ error: errMsg }, 502);
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
