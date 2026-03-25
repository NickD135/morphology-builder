// ============================================================
//  WORD LABS — Batch Deck Generator
//  Generates 3-day PPTX teaching decks for multiple morphemes
//  using the Anthropic API to create content.
//
//  Usage: ANTHROPIC_API_KEY=sk-... node generate-all-decks.js
// ============================================================

const fs = require("fs");
const path = require("path");
const https = require("https");
const { buildDeck } = require("./wordlabs-deck-generator");

// ============================================================
//  MORPHEMES TO GENERATE
//  type: "base" | "prefix" | "suffix"
// ============================================================
const ALL_MORPHEMES = [
  // Bases
  { morpheme: "struct", type: "base" },
  { morpheme: "port",   type: "base" },
  // Prefixes
  { morpheme: "re",     type: "prefix" },
  { morpheme: "un",     type: "prefix" },
  // Suffixes
  { morpheme: "tion",   type: "suffix" },
  { morpheme: "ful",    type: "suffix" },
];

// Allow filtering via command line: node generate-all-decks.js struct port
// If no args, run all morphemes
const args = process.argv.slice(2);
const MORPHEMES = args.length > 0
  ? ALL_MORPHEMES.filter(m => args.includes(m.morpheme))
  : ALL_MORPHEMES;

const OUTPUT_DIR = path.join(__dirname, "output");
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";

// ============================================================
//  PROMPT BUILDERS — different formats for base/prefix/suffix
// ============================================================

function buildPromptForBase(morpheme) {
  return `You are a morphology expert creating teaching content for Australian primary school students (ages 9-12).

Generate a complete JSON DATA object for the root/base morpheme "${morpheme}".

The JSON must match this EXACT schema (no extra fields, no missing fields):

{
  "morpheme": "${morpheme}",
  "meaning": "short meaning (3-6 words)",
  "origin": "Latin: original_word OR Greek: original_word",
  "prefixes": ["prefix1", "prefix2", "prefix3", "prefix4", "prefix5"],
  "suffixes": ["suffix1", "suffix2", "suffix3", "suffix4", "suffix5"],
  "examples": [
    {"word": "word1", "definition": "Child-friendly definition."},
    {"word": "word2", "definition": "Child-friendly definition."},
    {"word": "word3", "definition": "Child-friendly definition."},
    {"word": "word4", "definition": "Child-friendly definition."},
    {"word": "word5", "definition": "Child-friendly definition."},
    {"word": "word6", "definition": "Child-friendly definition."},
    {"word": "word7", "definition": "Child-friendly definition."},
    {"word": "word8", "definition": "Child-friendly definition."}
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
    "sentence": "A dictation sentence containing exactly 2 focus words that use '${morpheme}'. Suitable for Year 4-6.",
    "punctuationCount": 1,
    "words": [
      {
        "word": "focusword1",
        "morphemes": [
          {"part": "prefix", "meaning": "meaning of prefix"},
          {"part": "${morpheme}", "meaning": "meaning of root"},
          {"part": "suffix", "meaning": "meaning of suffix"}
        ],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      },
      {
        "word": "focusword2",
        "morphemes": [
          {"part": "${morpheme}", "meaning": "meaning of root"},
          {"part": "suffix", "meaning": "meaning of suffix"}
        ],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      }
    ]
  },
  "day3": {
    "sentence": "A harder dictation sentence containing exactly 3 focus words that use '${morpheme}'. Suitable for Year 4-6.",
    "punctuationCount": 2,
    "words": [
      {
        "word": "focusword1",
        "morphemes": [{"part": "morpheme_part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      },
      {
        "word": "focusword2",
        "morphemes": [{"part": "morpheme_part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      },
      {
        "word": "focusword3",
        "morphemes": [{"part": "morpheme_part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      }
    ]
  }
}

RULES:
- All example words MUST contain the root "${morpheme}" as a morpheme
- prefixes: 5 prefixes that commonly combine with "${morpheme}" to form real English words
- suffixes: 5 suffixes that commonly combine with "${morpheme}" to form real English words
- examples: 8 real English words containing "${morpheme}", with child-friendly definitions
- trueOrFalse: mix of 3 true and 2 false statements about the morpheme and its words
- day1Sentences: 3 sentences a teacher might use in class, each containing a "${morpheme}" word
- day2: dictation sentence with EXACTLY 2 focus words containing "${morpheme}". Count commas, semicolons, colons, question marks, exclamation marks (NOT full stops) for punctuationCount
- day3: harder dictation sentence with EXACTLY 3 focus words containing "${morpheme}". Count punctuation the same way
- Each focus word needs a complete morpheme breakdown (every prefix + root + suffix as separate parts with meanings)

MORPHEME NOTES — the "note" field:
- Each morpheme object can have an OPTIONAL "note" field with a short rule explanation (shown as small grey text on the slide)
- Use "note" for:
  * ASSIMILATED PREFIXES: when a prefix changes spelling to match the following consonant. E.g. "con" → "col" before "l" (collection), "con" → "com" before "m/p" (complete), "in" → "im" before "m/p" (impossible), "ad" → "ac" before "c" (accept). Add note like: "note": "con → col before 'l'"
  * CONNECTING VOWELS: when a vowel appears between morphemes that isn't part of either morpheme. E.g. the "a" in "education" (educ + a + tion), the "i" in "horrific" (horr + i + fic). Show the connecting vowel as its own morpheme part: {"part": "a", "meaning": "connecting vowel", "note": "links base to suffix"}
  * SPELLING CHANGES: when a base word drops a letter before a suffix. E.g. "create" drops the "e" before "-ion" → "creation". Add note like: "note": "'e' dropped before vowel suffix"
- Only add "note" when there IS a rule to explain. Do NOT add "note" to straightforward morphemes

PHONEMES — CRITICAL RULES:
- phonemes: split using / — each segment is the GRAPHEME (the actual LETTERS from the word) that represent ONE sound
- You MUST use the exact letters from the word, NEVER substitute sound representations
- CORRECT: "recharge" = "r/e/ch/ar/ge" (every segment uses the actual letters from the word)
- WRONG: "recharge" = "r/e/ch/ar/j" (the "j" sound is spelled "ge" in this word — use "ge")
- CORRECT: "structure" = "s/t/r/u/c/t/u/re" (the final sound uses "re" not "er" or a phonetic symbol)
- CORRECT: "destructive" = "d/e/s/t/r/u/c/t/i/ve" (NOT "d/e/s/t/r/u/c/t/iv")
- Every consonant sound = its own grapheme segment
- Every vowel sound = its own grapheme segment
- Digraphs (two letters, one sound) stay together: "sh", "ch", "th", "ph", "wh", "ng", "ck"
- Vowel digraphs stay together: "ee", "ea", "oa", "ai", "ay", "oo", "ou", "ow", "oi", "oy", "ar", "er", "ir", "or", "ur"
- "tion" as a suffix = "t/io/n" (3 graphemes) or "sh/u/n" sound but written as "t/io/n"
- "ge" at end of word making /j/ sound = "ge" (one grapheme, e.g. "charge" = "ch/ar/ge")
- "ce" at end of word making /s/ sound = "ce" (one grapheme)
- Double consonants making one sound: "pp", "ll", "ss", "ff", "tt", "rr" = one segment
- Split vowels like hope = "h/o/p/e" (4 graphemes), make = "m/a/k/e" (4 graphemes)
- VALIDATION: join all phoneme segments together (remove "/") — the result MUST exactly equal the original word. If it doesn't, your phonemes are wrong
- Use Australian/British English spelling (e.g. "organise" not "organize")

Return ONLY the JSON object. No markdown, no backticks, no explanation.`;
}

function buildPromptForPrefix(morpheme) {
  return `You are a morphology expert creating teaching content for Australian primary school students (ages 9-12).

Generate a complete JSON DATA object for the PREFIX "${morpheme}-".

For a PREFIX deck, the "prefixes" field should contain 5 BASE WORDS that this prefix commonly attaches to.
The "suffixes" field should contain 5 SUFFIXES that commonly appear on words using this prefix.
This allows the word matrix slide to show: prefix + base + suffix combinations.

The JSON must match this EXACT schema:

{
  "morpheme": "${morpheme}",
  "meaning": "short meaning of this prefix (3-6 words)",
  "origin": "Latin: original_word OR Greek: original_word OR Old English: original_word",
  "prefixes": ["base1", "base2", "base3", "base4", "base5"],
  "suffixes": ["suffix1", "suffix2", "suffix3", "suffix4", "suffix5"],
  "examples": [
    {"word": "word1", "definition": "Child-friendly definition."},
    {"word": "word2", "definition": "Child-friendly definition."},
    {"word": "word3", "definition": "Child-friendly definition."},
    {"word": "word4", "definition": "Child-friendly definition."},
    {"word": "word5", "definition": "Child-friendly definition."},
    {"word": "word6", "definition": "Child-friendly definition."},
    {"word": "word7", "definition": "Child-friendly definition."},
    {"word": "word8", "definition": "Child-friendly definition."}
  ],
  "trueOrFalse": [
    {"statement": "Statement about this prefix.", "answer": true},
    {"statement": "Statement about this prefix.", "answer": false},
    {"statement": "Statement about this prefix.", "answer": true},
    {"statement": "Statement about this prefix.", "answer": true},
    {"statement": "Statement about this prefix.", "answer": false}
  ],
  "day1Sentences": [
    "Example sentence using a word with the prefix '${morpheme}-'.",
    "Another example sentence.",
    "A third example sentence."
  ],
  "day2": {
    "sentence": "Dictation sentence with EXACTLY 2 focus words using prefix '${morpheme}-'. Suitable for Year 4-6.",
    "punctuationCount": 1,
    "words": [
      {
        "word": "focusword1",
        "morphemes": [
          {"part": "${morpheme}", "meaning": "meaning of prefix"},
          {"part": "base", "meaning": "meaning of base"},
          {"part": "suffix", "meaning": "meaning of suffix"}
        ],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      },
      {
        "word": "focusword2",
        "morphemes": [
          {"part": "${morpheme}", "meaning": "meaning of prefix"},
          {"part": "base", "meaning": "meaning of base"}
        ],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      }
    ]
  },
  "day3": {
    "sentence": "Harder dictation sentence with EXACTLY 3 focus words using prefix '${morpheme}-'. Suitable for Year 4-6.",
    "punctuationCount": 2,
    "words": [
      {
        "word": "focusword1",
        "morphemes": [{"part": "part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      },
      {
        "word": "focusword2",
        "morphemes": [{"part": "part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      },
      {
        "word": "focusword3",
        "morphemes": [{"part": "part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      }
    ]
  }
}

RULES:
- All example words MUST start with the prefix "${morpheme}-"
- prefixes field: 5 base words this prefix attaches to (e.g. for "re": ["build", "write", "play", "connect", "view"])
- suffixes field: 5 suffixes commonly found on words with this prefix (e.g. "ed", "ing", "ion", "able", "ment")
- examples: 8 real English words starting with "${morpheme}-", with child-friendly definitions
- trueOrFalse: mix of 3 true and 2 false statements
- day1Sentences: 3 classroom sentences each containing a "${morpheme}-" word
- day2: dictation with EXACTLY 2 focus words starting with "${morpheme}-"
- day3: harder dictation with EXACTLY 3 focus words starting with "${morpheme}-"
- Each focus word: full morpheme breakdown (prefix + base + any suffixes), syllables, grapheme-based phonemes

MORPHEME NOTES — the "note" field:
- Each morpheme object can have an OPTIONAL "note" field with a short rule explanation (shown as small grey text on the slide)
- Use "note" for:
  * ASSIMILATED PREFIXES: when a prefix changes spelling to match the following consonant. E.g. "con" → "col" before "l" (collection), "con" → "com" before "m/p" (complete), "in" → "im" before "m/p" (impossible), "ad" → "ac" before "c" (accept). Add note like: "note": "con → col before 'l'"
  * CONNECTING VOWELS: when a vowel appears between morphemes that isn't part of either morpheme. Show as its own part: {"part": "a", "meaning": "connecting vowel", "note": "links base to suffix"}
  * SPELLING CHANGES: when a base word drops a letter before a suffix. E.g. "create" drops "e" before "-ion". Add note like: "note": "'e' dropped before vowel suffix"
- Only add "note" when there IS a rule to explain

PHONEMES — CRITICAL RULES:
- phonemes: split using / — each segment is the GRAPHEME (the actual LETTERS from the word) that represent ONE sound
- You MUST use the exact letters from the word, NEVER substitute sound representations
- CORRECT: "recharge" = "r/e/ch/ar/ge" (every segment uses the actual letters)
- WRONG: "recharge" = "r/e/ch/ar/j" (the "j" sound is spelled "ge" — use "ge")
- CORRECT: "destructive" = "d/e/s/t/r/u/c/t/i/ve" (NOT "d/e/s/t/r/u/c/t/iv")
- Every consonant sound = its own grapheme segment
- Every vowel sound = its own grapheme segment
- Digraphs stay together: "sh", "ch", "th", "ph", "wh", "ng", "ck"
- Vowel digraphs stay together: "ee", "ea", "oa", "ai", "ay", "oo", "ou", "ow", "oi", "oy", "ar", "er", "ir", "or", "ur"
- "ge" at end of word making /j/ sound = "ge" (one grapheme)
- "ce" at end of word making /s/ sound = "ce" (one grapheme)
- Double consonants = one segment: "pp", "ll", "ss", "ff", "tt", "rr"
- Split vowels: hope = "h/o/p/e", make = "m/a/k/e"
- VALIDATION: join all phoneme segments (remove "/") — must exactly equal the original word
- Use Australian/British English spelling

Return ONLY the JSON object. No markdown, no backticks, no explanation.`;
}

function buildPromptForSuffix(morpheme) {
  return `You are a morphology expert creating teaching content for Australian primary school students (ages 9-12).

Generate a complete JSON DATA object for the SUFFIX "-${morpheme}".

For a SUFFIX deck, the "prefixes" field should contain 5 PREFIXES that commonly appear on words ending with this suffix.
The "suffixes" field should contain 5 BASE WORDS that this suffix commonly attaches to.
This allows the word matrix slide to show: prefix + base + suffix combinations.

The JSON must match this EXACT schema:

{
  "morpheme": "${morpheme}",
  "meaning": "short meaning of this suffix (3-6 words)",
  "origin": "Latin: original_word OR Greek: original_word OR Old English: original_word",
  "prefixes": ["prefix1", "prefix2", "prefix3", "prefix4", "prefix5"],
  "suffixes": ["base1", "base2", "base3", "base4", "base5"],
  "examples": [
    {"word": "word1", "definition": "Child-friendly definition."},
    {"word": "word2", "definition": "Child-friendly definition."},
    {"word": "word3", "definition": "Child-friendly definition."},
    {"word": "word4", "definition": "Child-friendly definition."},
    {"word": "word5", "definition": "Child-friendly definition."},
    {"word": "word6", "definition": "Child-friendly definition."},
    {"word": "word7", "definition": "Child-friendly definition."},
    {"word": "word8", "definition": "Child-friendly definition."}
  ],
  "trueOrFalse": [
    {"statement": "Statement about this suffix.", "answer": true},
    {"statement": "Statement about this suffix.", "answer": false},
    {"statement": "Statement about this suffix.", "answer": true},
    {"statement": "Statement about this suffix.", "answer": true},
    {"statement": "Statement about this suffix.", "answer": false}
  ],
  "day1Sentences": [
    "Example sentence using a word ending in '-${morpheme}'.",
    "Another example sentence.",
    "A third example sentence."
  ],
  "day2": {
    "sentence": "Dictation sentence with EXACTLY 2 focus words ending in '-${morpheme}'. Suitable for Year 4-6.",
    "punctuationCount": 1,
    "words": [
      {
        "word": "focusword1",
        "morphemes": [
          {"part": "prefix", "meaning": "meaning"},
          {"part": "base", "meaning": "meaning"},
          {"part": "${morpheme}", "meaning": "meaning of suffix"}
        ],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      },
      {
        "word": "focusword2",
        "morphemes": [
          {"part": "base", "meaning": "meaning"},
          {"part": "${morpheme}", "meaning": "meaning of suffix"}
        ],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      }
    ]
  },
  "day3": {
    "sentence": "Harder dictation sentence with EXACTLY 3 focus words ending in '-${morpheme}'. Suitable for Year 4-6.",
    "punctuationCount": 2,
    "words": [
      {
        "word": "focusword1",
        "morphemes": [{"part": "part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      },
      {
        "word": "focusword2",
        "morphemes": [{"part": "part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      },
      {
        "word": "focusword3",
        "morphemes": [{"part": "part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": "ph/o/n/e/m/es"
      }
    ]
  }
}

RULES:
- All example words MUST end with the suffix "-${morpheme}" (or its inflected form)
- prefixes field: 5 prefixes commonly found on words ending in "-${morpheme}" (e.g. "re", "un", "dis", "pre", "over")
- suffixes field: 5 base words this suffix attaches to (e.g. for "-ful": ["help", "power", "hope", "care", "play"])
- examples: 8 real English words ending in "-${morpheme}", with child-friendly definitions
- trueOrFalse: mix of 3 true and 2 false statements
- day1Sentences: 3 classroom sentences each containing a "-${morpheme}" word
- day2: dictation with EXACTLY 2 focus words ending in "-${morpheme}"
- day3: harder dictation with EXACTLY 3 focus words ending in "-${morpheme}"
- Each focus word: full morpheme breakdown (any prefixes + base + suffix), syllables, grapheme-based phonemes

MORPHEME NOTES — the "note" field:
- Each morpheme object can have an OPTIONAL "note" field with a short rule explanation (shown as small grey text on the slide)
- Use "note" for:
  * ASSIMILATED PREFIXES: when a prefix changes spelling. E.g. "con" → "col" before "l", "in" → "im" before "m/p". Add note like: "note": "con → col before 'l'"
  * CONNECTING VOWELS: when a vowel appears between morphemes that isn't part of either. E.g. the "a" in "education" (educ + a + tion). Show as its own part: {"part": "a", "meaning": "connecting vowel", "note": "links base to suffix"}
  * SPELLING CHANGES: when a base drops a letter before a suffix. E.g. "create" → "creation" drops "e". Add note: "note": "'e' dropped before vowel suffix"
- Only add "note" when there IS a rule to explain

PHONEMES — CRITICAL RULES:
- phonemes: split using / — each segment is the GRAPHEME (the actual LETTERS from the word) that represent ONE sound
- You MUST use the exact letters from the word, NEVER substitute sound representations
- CORRECT: "recharge" = "r/e/ch/ar/ge" (every segment uses actual letters)
- WRONG: "recharge" = "r/e/ch/ar/j" ("j" sound is spelled "ge" — use "ge")
- CORRECT: "education" = "e/d/u/c/a/t/io/n" (NOT "e/d/u/k/a/sh/u/n")
- Every consonant sound = its own grapheme segment
- Every vowel sound = its own grapheme segment
- Digraphs stay together: "sh", "ch", "th", "ph", "wh", "ng", "ck"
- Vowel digraphs stay together: "ee", "ea", "oa", "ai", "ay", "oo", "ou", "ow", "oi", "oy", "ar", "er", "ir", "or", "ur"
- "ge" at end of word making /j/ sound = "ge" (one grapheme)
- "ce" at end of word making /s/ sound = "ce" (one grapheme)
- Double consonants = one segment: "pp", "ll", "ss", "ff", "tt", "rr"
- Split vowels: hope = "h/o/p/e", make = "m/a/k/e"
- VALIDATION: join all phoneme segments (remove "/") — must exactly equal the original word
- Use Australian/British English spelling

Return ONLY the JSON object. No markdown, no backticks, no explanation.`;
}

// ============================================================
//  ANTHROPIC API CALL
// ============================================================

function callAnthropicAPI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API returned ${res.statusCode}: ${data}`));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const text = parsed.content[0].text;
          // Strip any accidental markdown fencing
          const cleaned = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
          const result = JSON.parse(cleaned);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse API response: ${e.message}\nRaw: ${data.slice(0, 500)}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ============================================================
//  MAIN
// ============================================================

async function main() {
  if (!API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY environment variable not set.");
    console.error("Usage: ANTHROPIC_API_KEY=sk-... node generate-all-decks.js");
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`\n=== Word Labs Batch Deck Generator ===`);
  console.log(`Morphemes: ${MORPHEMES.length}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of MORPHEMES) {
    const { morpheme, type } = entry;
    const filename = `wordlabs-${morpheme}-3day.pptx`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`SKIP  ${morpheme} (${type}) — ${filename} already exists`);
      skipped++;
      continue;
    }

    console.log(`\nGEN   ${morpheme} (${type})`);
    console.log(`  → Calling Anthropic API for content...`);

    try {
      // Build the right prompt for the morpheme type
      let prompt;
      if (type === "prefix") {
        prompt = buildPromptForPrefix(morpheme);
      } else if (type === "suffix") {
        prompt = buildPromptForSuffix(morpheme);
      } else {
        prompt = buildPromptForBase(morpheme);
      }

      const data = await callAnthropicAPI(prompt);

      // Validate key fields exist
      const required = ["morpheme", "meaning", "origin", "prefixes", "suffixes",
                        "examples", "trueOrFalse", "day1Sentences", "day2", "day3"];
      const missing = required.filter((k) => !data[k]);
      if (missing.length > 0) {
        throw new Error(`API response missing fields: ${missing.join(", ")}`);
      }

      // Inject the morpheme type so the generator can adapt labels
      data.type = type;

      console.log(`  → Content received: ${data.examples.length} examples, day2: ${data.day2.words.length} words, day3: ${data.day3.words.length} words`);
      console.log(`  → Generating PPTX...`);

      await buildDeck(data, outputPath);
      console.log(`  ✓ ${filename} (${(fs.statSync(outputPath).size / 1024).toFixed(0)}KB)`);
      generated++;

    } catch (err) {
      console.error(`  ✗ FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Generated: ${generated}  Skipped: ${skipped}  Failed: ${failed}\n`);
}

main().catch(console.error);
