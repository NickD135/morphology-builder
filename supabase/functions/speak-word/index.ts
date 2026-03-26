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

// Google Cloud TTS language codes (BCP-47) and preferred voice names
const VOICE_MAP: Record<string, { lang: string; voice?: string; gender: string }> = {
  'en':     { lang: 'en-AU',  voice: 'en-AU-Neural2-A', gender: 'FEMALE' },
  'ar':     { lang: 'ar-XA',  voice: 'ar-XA-Neural2-A', gender: 'FEMALE' },
  'zh':     { lang: 'cmn-CN', voice: 'cmn-CN-Neural2-A', gender: 'FEMALE' },
  'zh-yue': { lang: 'yue-HK', gender: 'FEMALE' },
  'vi':     { lang: 'vi-VN',  voice: 'vi-VN-Neural2-A', gender: 'FEMALE' },
  'hi':     { lang: 'hi-IN',  voice: 'hi-IN-Neural2-A', gender: 'FEMALE' },
  'pa':     { lang: 'pa-IN',  gender: 'FEMALE' },
  'tl':     { lang: 'fil-PH', voice: 'fil-PH-Neural2-A', gender: 'FEMALE' },
  'ko':     { lang: 'ko-KR',  voice: 'ko-KR-Neural2-A', gender: 'FEMALE' },
  'ja':     { lang: 'ja-JP',  voice: 'ja-JP-Neural2-B', gender: 'FEMALE' },
  'th':     { lang: 'th-TH',  voice: 'th-TH-Neural2-C', gender: 'FEMALE' },
  'ne':     { lang: 'ne-NP',  gender: 'FEMALE' },
  'fa':     { lang: 'fa-IR',  gender: 'FEMALE' },
  'ur':     { lang: 'ur-PK',  gender: 'FEMALE' },
  'sw':     { lang: 'sw-KE',  gender: 'FEMALE' },
  'my':     { lang: 'my-MM',  gender: 'FEMALE' },
  'km':     { lang: 'km-KH',  gender: 'FEMALE' },
  'bo':     { lang: 'bo-CN',  gender: 'FEMALE' },
  'dz':     { lang: 'dz',     gender: 'FEMALE' },
  'sm':     { lang: 'sm',     gender: 'FEMALE' },
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = Deno.env.get('GOOGLE_TTS_API_KEY');
  if (!apiKey) return json({ error: 'TTS not configured' }, 500);

  let body: { text: string; language: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { text, language } = body;
  if (!text || !language) return json({ error: 'Missing text or language' }, 400);
  if (text.length > 200) return json({ error: 'Text too long (max 200 chars)' }, 400);

  // Build a cache key from text + language
  const cacheKey = `tts/${language}/${text.toLowerCase().trim().replace(/[^a-z0-9\u0080-\uffff]+/g, '_')}.mp3`;

  // Check Supabase Storage cache first
  const adminSb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Try to get existing cached audio URL
  const { data: existingFile } = await adminSb.storage.from('tts-cache').createSignedUrl(cacheKey, 3600);
  if (existingFile?.signedUrl) {
    return json({ audioUrl: existingFile.signedUrl, cached: true });
  }

  // Not cached — call Google Cloud TTS
  const voiceConfig = VOICE_MAP[language] || VOICE_MAP['en'];

  const ttsBody: Record<string, unknown> = {
    input: { text },
    voice: {
      languageCode: voiceConfig.lang,
      ssmlGender: voiceConfig.gender,
      ...(voiceConfig.voice ? { name: voiceConfig.voice } : {}),
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.9,
      pitch: 0,
    },
  };

  try {
    const ttsResp = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ttsBody),
      },
    );

    if (!ttsResp.ok) {
      const errText = await ttsResp.text().catch(() => '');
      console.error('Google TTS error:', ttsResp.status, errText);

      // If language not supported, try falling back to English
      if (ttsResp.status === 400 && language !== 'en') {
        return json({ error: 'Language not supported by Google TTS', unsupported: true }, 400);
      }
      return json({ error: 'TTS API error' }, 502);
    }

    const data = await ttsResp.json();
    const audioBase64: string = data.audioContent;

    if (!audioBase64) {
      return json({ error: 'No audio returned' }, 500);
    }

    // Decode base64 to bytes
    const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));

    // Upload to Supabase Storage cache
    await adminSb.storage.from('tts-cache').upload(cacheKey, audioBytes, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

    // Get a signed URL for the cached file
    const { data: signedData } = await adminSb.storage.from('tts-cache').createSignedUrl(cacheKey, 3600);

    if (signedData?.signedUrl) {
      return json({ audioUrl: signedData.signedUrl, cached: false });
    }

    // Fallback: return audio as base64 data URL
    return json({ audioUrl: `data:audio/mpeg;base64,${audioBase64}`, cached: false });
  } catch (err) {
    console.error('speak-word error:', err);
    return json({ error: (err as Error).message || 'TTS error' }, 500);
  }
});
