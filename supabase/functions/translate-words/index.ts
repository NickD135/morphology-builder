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

// Supported EALD languages
const LANGUAGES: Record<string, string> = {
  ar: 'Arabic (العربية)',
  zh: 'Mandarin Chinese (中文)',
  'zh-yue': 'Cantonese (廣東話)',
  vi: 'Vietnamese (Tiếng Việt)',
  hi: 'Hindi (हिन्दी)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  tl: 'Filipino/Tagalog',
  ko: 'Korean (한국어)',
  ja: 'Japanese (日本語)',
  th: 'Thai (ภาษาไทย)',
  bn: 'Bengali (বাংলা)',
  gu: 'Gujarati (ગુજરાતી)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  mr: 'Marathi (मराठी)',
  ne: 'Nepali (नेपाली)',
  ur: 'Urdu (اردو)',
  fa: 'Farsi/Persian (فارسی)',
  bo: 'Tibetan (བོད་སྐད)',
  dz: 'Dzongkha (རྫོང་ཁ)',
  my: 'Burmese (မြန်မာစာ)',
  km: 'Khmer (ភាសាខ្មែរ)',
  id: 'Indonesian (Bahasa Indonesia)',
  ms: 'Malay (Bahasa Melayu)',
  sm: 'Samoan (Gagana Sāmoa)',
  tr: 'Turkish (Türkçe)',
  he: 'Hebrew (עברית)',
  sw: 'Swahili (Kiswahili)',
  af: 'Afrikaans',
  es: 'Spanish (Español)',
  pt: 'Portuguese (Português)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  it: 'Italian (Italiano)',
  nl: 'Dutch (Nederlands)',
  pl: 'Polish (Polski)',
  ro: 'Romanian (Română)',
  cs: 'Czech (Čeština)',
  el: 'Greek (Ελληνικά)',
  hu: 'Hungarian (Magyar)',
  uk: 'Ukrainian (Українська)',
  ru: 'Russian (Русский)',
  sv: 'Swedish (Svenska)',
  nb: 'Norwegian (Norsk)',
  da: 'Danish (Dansk)',
  fi: 'Finnish (Suomi)',
  is: 'Icelandic (Íslenska)',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // GET-style request for supported languages list
  let body: { words?: string[]; language?: string; contexts?: string[]; listLanguages?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // Return supported languages list
  if (body.listLanguages) {
    return json({ languages: LANGUAGES });
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'AI not configured' }, 500);

  // No auth required — students call this and they don't have Supabase Auth sessions
  // Rate limiting handled by Supabase edge function limits

  const language = body.language;
  const words = body.words;
  const contexts = body.contexts; // optional parallel array of context strings

  if (!language || !words || !Array.isArray(words) || words.length === 0) {
    return json({ error: 'Missing language or words array' }, 400);
  }

  if (!LANGUAGES[language]) {
    return json({ error: 'Unsupported language: ' + language }, 400);
  }

  const langName = LANGUAGES[language];

  // Check cache first
  const adminSb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Build cache lookup
  const cacheKeys = words.map((w, i) => ({
    source_text: w.toLowerCase().trim(),
    target_language: language,
    context: (contexts && contexts[i]) || 'word',
  }));

  // Try to find cached translations
  const { data: cached } = await adminSb
    .from('translations')
    .select('source_text, translation, context')
    .eq('target_language', language)
    .in('source_text', cacheKeys.map(k => k.source_text));

  // Build lookup map from cache
  const cacheMap = new Map<string, string>();
  if (cached) {
    for (const row of cached) {
      cacheMap.set(row.source_text + '::' + (row.context || 'word'), row.translation);
    }
  }

  // Find which words still need translation
  const uncached: { word: string; context: string; index: number }[] = [];
  const results: { word: string; translation: string; context: string }[] = [];

  for (let i = 0; i < words.length; i++) {
    const key = words[i].toLowerCase().trim();
    const ctx = (contexts && contexts[i]) || 'word';
    const cacheKey = key + '::' + ctx;
    if (cacheMap.has(cacheKey)) {
      results.push({ word: words[i], translation: cacheMap.get(cacheKey)!, context: ctx });
    } else {
      uncached.push({ word: words[i], context: ctx, index: i });
      results.push({ word: words[i], translation: '', context: ctx });
    }
  }

  // If everything was cached, return immediately
  if (uncached.length === 0) {
    return json({ translations: results });
  }

  // Call Claude to translate uncached words
  const prompt = `You are a translator helping primary school students (ages 9-12) who speak ${langName} as their home language and are learning English.

Translate each English word or phrase below into ${langName}. Follow these rules:

RULES:
- Use simple, child-friendly language appropriate for 9-12 year olds
- For single words, give the most common/natural translation
- For definitions or meanings, translate the meaning naturally (don't transliterate)
- For morpheme meanings (like "not", "again", "one who"), translate the meaning
- Include the script/characters of the target language (e.g. Tibetan script for Tibetan, Arabic script for Arabic)
- If the target language uses a non-Latin script, provide BOTH the native script AND a romanisation/pronunciation guide
- Format: "native_script (romanisation)" — e.g. for Tibetan: "བདེ་སྐྱིད (de kyid)"
- Keep translations concise — max 6 words per translation
- If a word has no direct translation, give the closest natural equivalent

Return ONLY valid JSON — an array of objects:
[
  { "word": "happy", "translation": "བདེ་སྐྱིད (de kyid)", "context": "word" },
  { "word": "not; opposite of", "translation": "མིན་པ (min pa)", "context": "morpheme_meaning" }
]

Words to translate:
${uncached.map((u, i) => `${i + 1}. "${u.word}" (context: ${u.context})`).join('\n')}`;

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
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text().catch(() => '');
      console.error('Anthropic API error:', anthropicResp.status, errText);
      return json({ error: 'Translation API error' }, 502);
    }

    const data = await anthropicResp.json();
    const text: string = data.content?.[0]?.text || '';

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return json({ error: 'Could not parse translation response' }, 500);
    }

    const translated = JSON.parse(jsonMatch[0]);

    // Merge translations into results and cache them
    const toCache: { source_text: string; target_language: string; translation: string; context: string }[] = [];

    for (const t of translated) {
      const matchIdx = uncached.findIndex(u =>
        u.word.toLowerCase().trim() === (t.word || '').toLowerCase().trim()
      );
      if (matchIdx >= 0) {
        const u = uncached[matchIdx];
        results[u.index] = { word: u.word, translation: t.translation || '', context: u.context };
        toCache.push({
          source_text: u.word.toLowerCase().trim(),
          target_language: language,
          translation: t.translation || '',
          context: u.context,
        });
      }
    }

    // Cache new translations (ignore errors — cache is best-effort)
    if (toCache.length > 0) {
      await adminSb.from('translations').upsert(toCache, {
        onConflict: 'source_text,target_language,context',
      }).then(() => {}, (e: Error) => console.warn('Cache write error:', e));
    }

    return json({ translations: results });
  } catch (err) {
    return json({ error: (err as Error).message || 'Translation error' }, 500);
  }
});
