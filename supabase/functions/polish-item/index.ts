import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function buildPrompt(name?: string, itemType?: string, description?: string): string {
  const typeLabels: Record<string, string> = {
    coat: 'lab coat overlay',
    head: 'head accessory (hat/hair/crown)',
    face: 'face accessory (glasses/mask/nose)',
    background: 'background scene',
  };
  const typeLabel = (itemType && typeLabels[itemType]) || 'cosmetic item';
  const namePart  = name        ? `The item is called "${name}". ` : '';
  const descPart  = description ? `Teacher's description: "${description}". ` : '';

  return (
    `This image contains a rough hand-drawn design for a ${typeLabel} in an educational game called Word Lab. ` +
    namePart + descPart +
    'Word Lab has a friendly cartoon science-lab aesthetic (indigo/teal/amber palette, rounded shapes, clean outlines, primary-school audience). ' +
    'IMPORTANT: Draw ONLY the item itself — do NOT draw the scientist character/person underneath. ' +
    'The item will be layered on top of the scientist as a transparent PNG overlay, so only show the item design on a transparent background. ' +
    'Return: (1) a one-sentence description of what you drew, then (2) the complete SVG code for the item only, ' +
    'with a transparent background (no <rect fill="white"> backgrounds), viewBox="0 0 80 120", clean vector shapes.'
  );
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  let body: { image: string; name?: string; itemType?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  if (!body.image) {
    return new Response(JSON.stringify({ error: 'Missing image field (base64 PNG)' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const prompt = buildPrompt(body.name, body.itemType, body.description);

  // Detect media type: images from canvas are PNG; uploaded/pasted images may be JPEG
  const mediaType = body.image.startsWith('/9j') ? 'image/jpeg' : 'image/png';

  const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20251101',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: body.image } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });

  if (!anthropicResp.ok) {
    const err = await anthropicResp.json().catch(() => ({}));
    return new Response(JSON.stringify({ error: (err as any)?.error?.message || 'Anthropic API error ' + anthropicResp.status }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const data = await anthropicResp.json();
  const text: string = (data.content?.[0]?.text) || '';

  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
