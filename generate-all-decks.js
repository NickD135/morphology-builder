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
  // ── CORE BASES (97) ──
  { morpheme: "act", type: "base" },
  { morpheme: "appear", type: "base" },
  { morpheme: "apply", type: "base" },
  { morpheme: "argue", type: "base" },
  { morpheme: "assist", type: "base" },
  { morpheme: "attract", type: "base" },
  { morpheme: "behave", type: "base" },
  { morpheme: "believe", type: "base" },
  { morpheme: "build", type: "base" },
  { morpheme: "care", type: "base" },
  { morpheme: "collect", type: "base" },
  { morpheme: "communicate", type: "base" },
  { morpheme: "connect", type: "base" },
  { morpheme: "construct", type: "base" },
  { morpheme: "create", type: "base" },
  { morpheme: "decide", type: "base" },
  { morpheme: "develop", type: "base" },
  { morpheme: "direct", type: "base" },
  { morpheme: "educate", type: "base" },
  { morpheme: "employ", type: "base" },
  { morpheme: "encourage", type: "base" },
  { morpheme: "enjoy", type: "base" },
  { morpheme: "excite", type: "base" },
  { morpheme: "expect", type: "base" },
  { morpheme: "explore", type: "base" },
  { morpheme: "express", type: "base" },
  { morpheme: "extend", type: "base" },
  { morpheme: "form", type: "base" },
  { morpheme: "friend", type: "base" },
  { morpheme: "govern", type: "base" },
  { morpheme: "grow", type: "base" },
  { morpheme: "help", type: "base" },
  { morpheme: "inform", type: "base" },
  { morpheme: "inspire", type: "base" },
  { morpheme: "introduce", type: "base" },
  { morpheme: "invest", type: "base" },
  { morpheme: "join", type: "base" },
  { morpheme: "judge", type: "base" },
  { morpheme: "learn", type: "base" },
  { morpheme: "locate", type: "base" },
  { morpheme: "manage", type: "base" },
  { morpheme: "measure", type: "base" },
  { morpheme: "migrate", type: "base" },
  { morpheme: "motivate", type: "base" },
  { morpheme: "move", type: "base" },
  { morpheme: "observe", type: "base" },
  { morpheme: "operate", type: "base" },
  { morpheme: "organise", type: "base" },
  { morpheme: "participate", type: "base" },
  { morpheme: "perform", type: "base" },
  { morpheme: "persuade", type: "base" },
  { morpheme: "predict", type: "base" },
  { morpheme: "prepare", type: "base" },
  { morpheme: "prevent", type: "base" },
  { morpheme: "produce", type: "base" },
  { morpheme: "protect", type: "base" },
  { morpheme: "react", type: "base" },
  { morpheme: "reduce", type: "base" },
  { morpheme: "reflect", type: "base" },
  { morpheme: "reject", type: "base" },
  { morpheme: "relate", type: "base" },
  { morpheme: "remove", type: "base" },
  { morpheme: "repair", type: "base" },
  { morpheme: "replace", type: "base" },
  { morpheme: "report", type: "base" },
  { morpheme: "respect", type: "base" },
  { morpheme: "respond", type: "base" },
  { morpheme: "return", type: "base" },
  { morpheme: "reveal", type: "base" },
  { morpheme: "review", type: "base" },
  { morpheme: "revise", type: "base" },
  { morpheme: "rotate", type: "base" },
  { morpheme: "solve", type: "base" },
  { morpheme: "structure", type: "base" },
  { morpheme: "suggest", type: "base" },
  { morpheme: "support", type: "base" },
  { morpheme: "transport", type: "base" },
  { morpheme: "trust", type: "base" },
  { morpheme: "use", type: "base" },
  { morpheme: "value", type: "base" },
  { morpheme: "visit", type: "base" },
  { morpheme: "watch", type: "base" },
  { morpheme: "write", type: "base" },
  { morpheme: "legal", type: "base" },
  { morpheme: "logical", type: "base" },
  { morpheme: "literate", type: "base" },
  { morpheme: "regular", type: "base" },
  { morpheme: "rational", type: "base" },
  { morpheme: "responsible", type: "base" },
  { morpheme: "typical", type: "base" },
  { morpheme: "hero", type: "base" },
  { morpheme: "market", type: "base" },
  { morpheme: "power", type: "base" },
  { morpheme: "fast", type: "base" },

  // ── ANGLO BASES (42) ──
  { morpheme: "teach", type: "base" },
  { morpheme: "meet", type: "base" },
  { morpheme: "rest", type: "base" },
  { morpheme: "go", type: "base" },
  { morpheme: "tall", type: "base" },
  { morpheme: "ask", type: "base" },
  { morpheme: "eat", type: "base" },
  { morpheme: "train", type: "base" },
  { morpheme: "usual", type: "base" },
  { morpheme: "end", type: "base" },
  { morpheme: "turn", type: "base" },
  { morpheme: "open", type: "base" },
  { morpheme: "make", type: "base" },
  { morpheme: "jump", type: "base" },
  { morpheme: "bad", type: "base" },
  { morpheme: "lock", type: "base" },
  { morpheme: "like", type: "base" },
  { morpheme: "happy", type: "base" },
  { morpheme: "push", type: "base" },
  { morpheme: "zip", type: "base" },
  { morpheme: "take", type: "base" },
  { morpheme: "see", type: "base" },
  { morpheme: "brisk", type: "base" },
  { morpheme: "wake", type: "base" },
  { morpheme: "send", type: "base" },
  { morpheme: "round", type: "base" },
  { morpheme: "cloud", type: "base" },
  { morpheme: "pay", type: "base" },
  { morpheme: "lift", type: "base" },
  { morpheme: "pack", type: "base" },
  { morpheme: "sound", type: "base" },
  { morpheme: "correct", type: "base" },
  { morpheme: "part", type: "base" },
  { morpheme: "live", type: "base" },
  { morpheme: "sad", type: "base" },
  { morpheme: "merge", type: "base" },
  { morpheme: "run", type: "base" },
  { morpheme: "plan", type: "base" },
  { morpheme: "hop", type: "base" },

  // ── LATIN BASES (47) ──
  { morpheme: "rupt", type: "base" },
  { morpheme: "tract", type: "base" },
  { morpheme: "cred", type: "base" },
  { morpheme: "dic", type: "base" },
  { morpheme: "dict", type: "base" },
  { morpheme: "struct", type: "base" },
  { morpheme: "scrib", type: "base" },
  { morpheme: "script", type: "base" },
  { morpheme: "port", type: "base" },
  { morpheme: "aud", type: "base" },
  { morpheme: "flex", type: "base" },
  { morpheme: "flect", type: "base" },
  { morpheme: "ject", type: "base" },
  { morpheme: "spec", type: "base" },
  { morpheme: "spect", type: "base" },
  { morpheme: "spic", type: "base" },
  { morpheme: "miss", type: "base" },
  { morpheme: "mit", type: "base" },
  { morpheme: "sci", type: "base" },
  { morpheme: "pend", type: "base" },
  { morpheme: "pens", type: "base" },
  { morpheme: "vis", type: "base" },
  { morpheme: "vid", type: "base" },
  { morpheme: "fer", type: "base" },
  { morpheme: "vers", type: "base" },
  { morpheme: "vert", type: "base" },
  { morpheme: "duc", type: "base" },
  { morpheme: "duct", type: "base" },
  { morpheme: "sec", type: "base" },
  { morpheme: "sect", type: "base" },
  { morpheme: "claus", type: "base" },
  { morpheme: "clos", type: "base" },
  { morpheme: "vit", type: "base" },
  { morpheme: "viv", type: "base" },
  { morpheme: "cept", type: "base" },
  { morpheme: "cess", type: "base" },
  { morpheme: "fect", type: "base" },
  { morpheme: "fix", type: "base" },
  { morpheme: "sign", type: "base" },
  { morpheme: "tend", type: "base" },
  { morpheme: "press", type: "base" },
  { morpheme: "gress", type: "base" },
  { morpheme: "cede", type: "base" },
  { morpheme: "claim", type: "base" },
  { morpheme: "prove", type: "base" },
  { morpheme: "ply", type: "base" },
  { morpheme: "spire", type: "base" },

  // ── GREEK BASES (15) ──
  { morpheme: "graph", type: "base" },
  { morpheme: "gram", type: "base" },
  { morpheme: "micro", type: "base" },
  { morpheme: "hydr", type: "base" },
  { morpheme: "hydro", type: "base" },
  { morpheme: "therm", type: "base" },
  { morpheme: "thermo", type: "base" },
  { morpheme: "phon", type: "base" },
  { morpheme: "logy", type: "base" },
  { morpheme: "chron", type: "base" },
  { morpheme: "chrono", type: "base" },
  { morpheme: "photo", type: "base" },
  { morpheme: "scope", type: "base" },
  { morpheme: "meter", type: "base" },
  { morpheme: "aero", type: "base" },

  // ── PREFIXES ──
  { morpheme: "re",     type: "prefix" },
  { morpheme: "un",     type: "prefix" },

  // ── SUFFIXES ──
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
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
      },
      {
        "word": "focusword2",
        "morphemes": [
          {"part": "${morpheme}", "meaning": "meaning of root"},
          {"part": "suffix", "meaning": "meaning of suffix"}
        ],
        "syllables": "syl/la/bles",
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
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
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
      },
      {
        "word": "focusword2",
        "morphemes": [{"part": "morpheme_part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
      },
      {
        "word": "focusword3",
        "morphemes": [{"part": "morpheme_part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
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

PHONEMES — NEW FORMAT (CRITICAL):
- phonemes is now an ARRAY OF OBJECTS, not a string
- Each object has: "g" (the grapheme — the actual LETTERS from the word) and optionally "s" (the sound it makes, only when non-obvious)
- "g" = the exact letters from the word that represent one sound. ALWAYS use the real letters, never substitute sound representations
- "s" = the sound annotation (e.g. "/sh/", "/k/", "/j/", "/z/", "/f/") — ONLY include this when the grapheme makes an unexpected or non-obvious sound
- CORRECT: "unsure" = [{"g":"u"},{"g":"n"},{"g":"s","s":"/sh/"},{"g":"u"},{"g":"re"}] — the "s" makes a /sh/ sound so it gets an "s" annotation
- CORRECT: "recharge" = [{"g":"r"},{"g":"e"},{"g":"ch"},{"g":"ar"},{"g":"ge","s":"/j/"}] — "ge" makes /j/ sound
- CORRECT: "structure" = [{"g":"s"},{"g":"t"},{"g":"r"},{"g":"u"},{"g":"c"},{"g":"t"},{"g":"u"},{"g":"re"}] — no surprising sounds, so no "s" fields
- CORRECT: "education" = [{"g":"e"},{"g":"d"},{"g":"u"},{"g":"c","s":"/k/"},{"g":"a"},{"g":"t","s":"/sh/"},{"g":"io"},{"g":"n"}]
- Every consonant sound = its own grapheme
- Every vowel sound = its own grapheme
- Digraphs (two letters, one sound) stay together: "sh", "ch", "th", "ph", "wh", "ng", "ck"
- Vowel digraphs stay together: "ee", "ea", "oa", "ai", "ay", "oo", "ou", "ow", "oi", "oy", "ar", "er", "ir", "or", "ur"
- "ge" at end of word making /j/ sound = {"g":"ge","s":"/j/"}
- "ce" at end of word making /s/ sound = {"g":"ce","s":"/s/"}
- Double consonants making one sound: "pp", "ll", "ss", "ff", "tt", "rr" = one grapheme
- Split vowels: hope = [{"g":"h"},{"g":"o"},{"g":"p"},{"g":"e"}]
- WHEN TO ADD "s" (sound annotation): only when the letters don't obviously make the sound they look like. E.g. "s" making /sh/, "c" making /s/ or /sh/, "g" making /j/, "ti" making /sh/, "ph" making /f/, silent letters, etc.
- DO NOT add "s" for straightforward sounds like "t" making /t/, "m" making /m/, etc.
- VALIDATION: join all "g" values together — the result MUST exactly equal the original word
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
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
      },
      {
        "word": "focusword2",
        "morphemes": [
          {"part": "${morpheme}", "meaning": "meaning of prefix"},
          {"part": "base", "meaning": "meaning of base"}
        ],
        "syllables": "syl/la/bles",
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
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
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
      },
      {
        "word": "focusword2",
        "morphemes": [{"part": "part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
      },
      {
        "word": "focusword3",
        "morphemes": [{"part": "part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
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
- phonemes is now an ARRAY OF OBJECTS, not a string
- Each object has: "g" (grapheme — actual letters from the word) and optionally "s" (sound, only when non-obvious)
- CORRECT: "unsure" = [{"g":"u"},{"g":"n"},{"g":"s","s":"/sh/"},{"g":"u"},{"g":"re"}]
- CORRECT: "recharge" = [{"g":"r"},{"g":"e"},{"g":"ch"},{"g":"ar"},{"g":"ge","s":"/j/"}]
- CORRECT: "structure" = [{"g":"s"},{"g":"t"},{"g":"r"},{"g":"u"},{"g":"c"},{"g":"t"},{"g":"u"},{"g":"re"}] — no "s" fields needed
- Digraphs stay together: "sh", "ch", "th", "ph", "wh", "ng", "ck"
- Vowel digraphs stay together: "ee", "ea", "oa", "ai", "ay", "oo", "ou", "ow", "oi", "oy", "ar", "er", "ir", "or", "ur"
- "ge" at end = {"g":"ge","s":"/j/"}, "ce" at end = {"g":"ce","s":"/s/"}
- Double consonants = one grapheme: "pp", "ll", "ss", "ff", "tt", "rr"
- WHEN TO ADD "s": only when letters don't obviously make the sound they look like (s→/sh/, c→/s/, g→/j/, ti→/sh/, ph→/f/, etc.)
- DO NOT add "s" for straightforward sounds
- VALIDATION: join all "g" values — must exactly equal the original word
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
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
      },
      {
        "word": "focusword2",
        "morphemes": [
          {"part": "base", "meaning": "meaning"},
          {"part": "${morpheme}", "meaning": "meaning of suffix"}
        ],
        "syllables": "syl/la/bles",
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
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
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
      },
      {
        "word": "focusword2",
        "morphemes": [{"part": "part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
      },
      {
        "word": "focusword3",
        "morphemes": [{"part": "part", "meaning": "meaning"}],
        "syllables": "syl/la/bles",
        "phonemes": [{"g":"ph"},{"g":"o"},{"g":"n"},{"g":"e"},{"g":"m"},{"g":"es"}]
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
- phonemes is now an ARRAY OF OBJECTS, not a string
- Each object has: "g" (grapheme — actual letters from the word) and optionally "s" (sound, only when non-obvious)
- CORRECT: "education" = [{"g":"e"},{"g":"d"},{"g":"u"},{"g":"c","s":"/k/"},{"g":"a"},{"g":"t","s":"/sh/"},{"g":"io"},{"g":"n"}]
- CORRECT: "recharge" = [{"g":"r"},{"g":"e"},{"g":"ch"},{"g":"ar"},{"g":"ge","s":"/j/"}]
- CORRECT: "helpful" = [{"g":"h"},{"g":"e"},{"g":"l"},{"g":"p"},{"g":"f"},{"g":"u"},{"g":"l"}] — no "s" fields needed
- Digraphs stay together: "sh", "ch", "th", "ph", "wh", "ng", "ck"
- Vowel digraphs stay together: "ee", "ea", "oa", "ai", "ay", "oo", "ou", "ow", "oi", "oy", "ar", "er", "ir", "or", "ur"
- "ge" at end = {"g":"ge","s":"/j/"}, "ce" at end = {"g":"ce","s":"/s/"}
- Double consonants = one grapheme: "pp", "ll", "ss", "ff", "tt", "rr"
- WHEN TO ADD "s": only when letters don't obviously make the sound they look like (s→/sh/, c→/s/, g→/j/, ti→/sh/, ph→/f/, etc.)
- DO NOT add "s" for straightforward sounds
- VALIDATION: join all "g" values — must exactly equal the original word
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
