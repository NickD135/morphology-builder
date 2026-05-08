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

const SYSTEM_PROMPT = `You are an expert literacy diagnostician working with Australian primary school teachers. You will be given a student's spelling attempt history. Analyse the data and return a JSON object only — no preamble, no markdown — with this exact structure:
{
  "summary": "2-3 sentence overall diagnostic summary",
  "strengths": [
    { "title": "short title", "detail": "explanation" }
  ],
  "improvements": [
    { "title": "short title", "detail": "explanation", "tag": "Persistent or Recent" }
  ],
  "nextSteps": "1-2 concrete teaching strategies the teacher can use this week"
}

When identifying patterns, categorise errors explicitly as: phonological (vowel sounds, blends, digraphs), morphological (prefixes, suffixes, base words, inflectional endings), or orthographic (silent letters, double consonants, common letter sequences). Name the pattern type in each improvement's title (e.g. "Orthographic: double consonants", "Morphological: -ed suffix dropping").

Tag each improvement as "Persistent" if the error pattern appears across older and recent sessions, or "Recent" if it has emerged in the last 1-2 sessions.

Use Australian English spelling throughout.`;

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

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  let body: { history: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (!body.history || typeof body.history !== 'string' || !body.history.trim()) {
    return json({ error: 'Missing or empty history string' }, 400);
  }

  try {
    const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: body.history }],
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text().catch(() => '');
      console.error('Anthropic API error:', anthropicResp.status, errText);
      return json({ error: 'AI API error (HTTP ' + anthropicResp.status + '): ' + errText.slice(0, 500) }, 502);
    }

    const data = await anthropicResp.json();
    const text: string = data.content?.[0]?.text || '';
    if (!text) return json({ error: 'Empty response from AI' }, 500);

    let feedback: unknown;
    try {
      feedback = JSON.parse(text);
    } catch {
      console.error('JSON parse failed, raw:', text.slice(0, 500));
      return json({ error: 'Could not parse AI response as JSON' }, 500);
    }

    return json({ feedback });
  } catch (e) {
    console.error('spelling-feedback error:', e);
    return json({ error: 'Internal server error' }, 500);
  }
});
