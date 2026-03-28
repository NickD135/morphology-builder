import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function buildPrompt(name?: string, itemType?: string, description?: string): string {
  const typeLabels: Record<string, string> = {
    coat: 'lab coat / body clothing overlay',
    head: 'head accessory (hat, hair, crown, helmet, headband)',
    face: 'face accessory (glasses, mask, goggles, nose, beard)',
    background: 'background scene',
  };
  const typeLabel = (itemType && typeLabels[itemType]) || 'cosmetic item';

  const typeGuidance: Record<string, string> = {
    coat: `Draw ONLY the clothing/coat item — the shape should roughly fit a torso area (wider at shoulders, narrower at waist).
Include details like patterns, buttons, pockets, badges, or decorations on the coat.
The coat should be a flat front-facing view, like a paper doll cutout.
Do NOT draw arms, hands, head, face, legs, or any body parts.`,
    head: `Draw ONLY the head accessory — hats, crowns, hair, helmets, headbands, etc.
The item should sit on top of or around a head shape, but do NOT draw the head/face itself.
Show the accessory as if floating, viewed from the front.
Do NOT draw any face, eyes, mouth, body, or person.`,
    face: `Draw ONLY the face accessory — glasses, goggles, masks, moustaches, etc.
The item should be positioned as if worn on a face, but do NOT draw the face itself.
Show just the accessory item floating on transparent background.
Do NOT draw any head, eyes (unless they're part of the goggles), body, or person.`,
    background: `Draw a full background scene that fills the entire viewBox.
This will appear behind a scientist character, so make it a complete scene.
Think: lab settings, space, underwater, jungle, classroom, etc.
This is the ONE type where you can fill the whole area.`,
  };

  const guidance = (itemType && typeGuidance[itemType]) || typeGuidance.coat;
  const namePart  = name        ? `The item is called "${name}". ` : '';
  const descPart  = description ? `The teacher described it as: "${description}". This description is very important — follow it closely for colors, patterns, and design details. ` : '';

  return `You are designing a ${typeLabel} for an educational science game for primary school children (ages 9-12).

${namePart}${descPart}

CRITICAL RULES:
1. Draw ONLY the item itself — absolutely NO people, NO scientist character, NO human body parts
2. The item will be overlaid on top of a cartoon scientist character as a transparent PNG
3. Use a transparent background — no white/colored rectangle backgrounds
4. Style: friendly cartoon, clean bold outlines (2-3px), bright saturated colors, rounded shapes
5. Palette preference: indigo (#4338ca), teal (#0d9488), amber (#d97706), but use whatever colors the description calls for

ITEM-SPECIFIC GUIDANCE:
${guidance}

OUTPUT FORMAT:
First write a one-sentence description of what you created.
Then output the complete SVG code with:
- viewBox="0 0 80 120"
- No <rect> backgrounds (transparent)
- Clean vector paths with stroke and fill
- Reasonably detailed but not overly complex (keep under 100 elements)

${descPart ? 'Remember: the teacher specifically asked for "' + description + '" — make sure the design matches this description closely.' : ''}`;
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
