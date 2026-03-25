// ============================================================
//  WORD LABS — Morphology Teaching Deck Generator
//  Change the DATA object below to generate a new morpheme deck
//  Can also be required as a module: require('./wordlabs-deck-generator').buildDeck(data, outputPath)
// ============================================================

const pptxgen = require("pptxgenjs");

// ============================================================
//  DATA — edit this block to create a new morpheme deck
//  (overridden when used as a module via buildDeck)
// ============================================================
let DATA = {
  morpheme: "struct",
  type: "base",
  meaning: "to build or pile",
  origin: "Latin: struere",

  prefixes: ["re", "de", "con", "in", "un"],
  suffixes: ["ed", "ion", "ive", "ure", "ible"],

  examples: [
    { word: "construct",     definition: "To build or make something." },
    { word: "construction",  definition: "The act or process of building something." },
    { word: "destruct",      definition: "To break or destroy something." },
    { word: "destructive",   definition: "Something that causes damage or breaks things." },
    { word: "deconstruct",   definition: "To take something apart (opposite of construct)." },
    { word: "reconstruct",   definition: "To build something again." },
    { word: "unstructured",  definition: "Without a clear plan or order." },
    { word: "structure",     definition: "The way something is built or arranged." },
  ],

  trueOrFalse: [
    { statement: "'Construct' means 'to build together'.",         answer: true  },
    { statement: "'Reconstructed' means 'built again'.",           answer: true  },
    { statement: "Prefix 'con-' means 'down, away or opposite'.",  answer: false },
    { statement: "'Construction' means 'the act of building'.",    answer: true  },
    { statement: "Prefix 'de-' means 'with or together'.",         answer: false },
  ],

  day1Sentences: [
    "The storm caused a lot of destruction to our playground.",
    "The builders started the construction of the new school office.",
    "The scientists will reconstruct a dinosaur skeleton from the bones they dug up.",
  ],

  // DAY 2 DICTATION
  day2: {
    sentence: "After the fire, workers focused on reconstruction to restore the historic structure to its former glory.",
    punctuationCount: 1,
    words: [
      {
        word: "reconstruction",
        morphemes: [
          { part: "re",       meaning: "again"         },
          { part: "con",      meaning: "with/together" },
          { part: "struct",   meaning: "build"         },
          { part: "ion",      meaning: "act or process of" },
        ],
        syllables: "re/con/struc/tion",
        phonemes:  "r/e/c/o/n/s/t/r/u/c/t/io/n",
      },
      {
        word: "structure",
        morphemes: [
          { part: "struct",   meaning: "build"         },
          { part: "ure",      meaning: "result of"     },
        ],
        syllables: "struc/ture",
        phonemes:  "s/t/r/u/c/t/u/re",
      },
    ],
  },

  // DAY 3 DICTATION
  day3: {
    sentence: "The microstructure, which was small and delicate, became nonstructural after it was hit by the destructive power of a hair blower.",
    punctuationCount: 2,
    words: [
      {
        word: "microstructure",
        morphemes: [
          { part: "micro",    meaning: "small"         },
          { part: "struct",   meaning: "build"         },
          { part: "ure",      meaning: "result of"     },
        ],
        syllables: "mi/cro/struc/ture",
        phonemes:  "m/i/c/r/o/s/t/r/u/c/t/u/re",
      },
      {
        word: "nonstructural",
        morphemes: [
          { part: "non",      meaning: "not"           },
          { part: "struct",   meaning: "build"         },
          { part: "ur",       meaning: "result of"     },
          { part: "al",       meaning: "relating to"   },
        ],
        syllables: "non/struc/tur/al",
        phonemes:  "n/o/n/s/t/r/u/c/t/u/r/a/l",
      },
      {
        word: "destructive",
        morphemes: [
          { part: "de",       meaning: "undo/away"     },
          { part: "struct",   meaning: "build"         },
          { part: "ive",      meaning: "tending to"    },
        ],
        syllables: "de/struc/tive",
        phonemes:  "d/e/s/t/r/u/c/t/i/ve",
      },
    ],
  },
};

// ============================================================
//  THEME
// ============================================================
const C = {
  // Word Labs indigo/teal palette
  indigo:       "312e81",  // deep indigo — dark slides
  indigoMid:    "4338ca",  // indigo — headers, accents
  indigoLight:  "6366f1",  // lighter indigo
  indigoSoft:   "eef2ff",  // very light indigo — light slide bg
  teal:         "0d9488",  // teal — highlight, morpheme
  tealLight:    "ccfbf1",  // very light teal — chip bg
  amber:        "d97706",  // amber — warning/punctuation
  amberLight:   "fef3c7",  // light amber
  green:        "16a34a",  // correct/true
  red:          "dc2626",  // incorrect/false
  white:        "FFFFFF",
  offWhite:     "f8fafc",
  slate:        "475569",
  slateLight:   "e2e8f0",
  dark:         "0f172a",
};

const FONT = "Trebuchet MS";
const FONT_BODY = "Calibri";

// ============================================================
//  TYPE-AWARE LABEL HELPERS
//  DATA.type can be "base", "prefix", or "suffix"
// ============================================================
function morphemeType() { return (DATA.type || "base"); }
function morphemeLabel() {
  const t = morphemeType();
  if (t === "prefix") return "Prefix";
  if (t === "suffix") return "Suffix";
  return "Root";
}
function morphemeDisplay() {
  const t = morphemeType();
  if (t === "prefix") return `'${DATA.morpheme}-'`;
  if (t === "suffix") return `'-${DATA.morpheme}'`;
  return `'${DATA.morpheme}'`;
}
function matrixHeaders() {
  // For bases: Prefixes | 'root' | Suffixes
  // For prefixes: 'prefix-' | Bases | Suffixes  (prefixes field = bases, suffixes field = suffixes)
  // For suffixes: Prefixes | Bases | '-suffix'  (prefixes field = prefixes, suffixes field = bases)
  const t = morphemeType();
  if (t === "prefix") return ["Prefix: " + morphemeDisplay(), "Base Words", "Suffixes"];
  if (t === "suffix") return ["Prefixes", "Base Words", "Suffix: " + morphemeDisplay()];
  return ["Prefixes", morphemeDisplay(), "Suffixes"];
}
function matrixHeaderColors() {
  const t = morphemeType();
  if (t === "prefix") return ["7c3aed", C.teal, "db2777"];
  if (t === "suffix") return ["7c3aed", C.teal, "db2777"];
  return ["7c3aed", C.teal, "db2777"];
}
// What data goes in each matrix column
function matrixCol0Data() {
  const t = morphemeType();
  if (t === "prefix") return [DATA.morpheme]; // single prefix shown once
  return DATA.prefixes; // list of prefixes
}
function matrixCol1Data() {
  const t = morphemeType();
  if (t === "prefix") return DATA.prefixes; // "prefixes" field = base words for prefix decks
  if (t === "suffix") return DATA.suffixes; // "suffixes" field = base words for suffix decks
  return [DATA.morpheme]; // single root shown once
}
function matrixCol2Data() {
  const t = morphemeType();
  if (t === "suffix") return [DATA.morpheme]; // single suffix shown once
  if (t === "prefix") return DATA.suffixes; // suffixes list
  return DATA.suffixes; // suffixes list
}
function formatChip(text, colIdx) {
  // colIdx: 0=left, 1=middle, 2=right
  const t = morphemeType();
  if (colIdx === 0) {
    if (t === "prefix") return DATA.morpheme + "-";
    return text + "-";
  }
  if (colIdx === 2) {
    if (t === "suffix") return "-" + DATA.morpheme;
    return "-" + text;
  }
  return text; // middle column, no hyphen
}

// ============================================================
//  HELPERS
// ============================================================
function makeShadow() {
  return { type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.12 };
}

function slideHeader(slide, dayLabel, title) {
  // Dark indigo header bar
  slide.addShape("rect", {
    x: 0, y: 0, w: 10, h: 0.72,
    fill: { color: C.indigoMid },
    line: { color: C.indigoMid },
  });
  // Day pill
  slide.addShape("rect", {
    x: 0.3, y: 0.13, w: 1.1, h: 0.44,
    fill: { color: C.teal },
    line: { color: C.teal },
    rectRadius: 0.08,
  });
  slide.addText(dayLabel, {
    x: 0.3, y: 0.13, w: 1.1, h: 0.44,
    fontSize: 10, bold: true, color: C.white,
    fontFace: FONT, align: "center", valign: "middle", margin: 0,
  });
  // Title
  slide.addText(title, {
    x: 1.55, y: 0, w: 8.1, h: 0.72,
    fontSize: 16, bold: true, color: C.white,
    fontFace: FONT, align: "left", valign: "middle", margin: 0,
  });
  // Morpheme badge top right
  slide.addShape("rect", {
    x: 8.6, y: 0.1, w: 1.1, h: 0.5,
    fill: { color: C.indigo },
    line: { color: C.indigoLight },
    rectRadius: 0.1,
  });
  slide.addText(`'${DATA.morpheme}'`, {
    x: 8.6, y: 0.1, w: 1.1, h: 0.5,
    fontSize: 12, bold: true, color: C.indigoLight,
    fontFace: FONT, align: "center", valign: "middle", margin: 0,
  });
}

function darkSlide(pres, dayLabel, title) {
  const slide = pres.addSlide();
  slide.background = { color: C.indigo };
  // Subtle dot texture via repeated small shapes would be too heavy; use clean dark bg
  slide.addShape("rect", { x: 0, y: 0, w: 10, h: 0.72, fill: { color: "1e1b4b" }, line: { color: "1e1b4b" } });
  slide.addShape("rect", {
    x: 0.3, y: 0.13, w: 1.1, h: 0.44,
    fill: { color: C.teal }, line: { color: C.teal }, rectRadius: 0.08,
  });
  slide.addText(dayLabel, {
    x: 0.3, y: 0.13, w: 1.1, h: 0.44,
    fontSize: 10, bold: true, color: C.white,
    fontFace: FONT, align: "center", valign: "middle", margin: 0,
  });
  slide.addText(title, {
    x: 1.55, y: 0, w: 8.1, h: 0.72,
    fontSize: 16, bold: true, color: C.white,
    fontFace: FONT, align: "left", valign: "middle", margin: 0,
  });
  slide.addShape("rect", {
    x: 8.6, y: 0.1, w: 1.1, h: 0.5,
    fill: { color: "ffffff20" }, line: { color: C.indigoLight }, rectRadius: 0.1,
  });
  slide.addText(`'${DATA.morpheme}'`, {
    x: 8.6, y: 0.1, w: 1.1, h: 0.5,
    fontSize: 12, bold: true, color: C.indigoLight,
    fontFace: FONT, align: "center", valign: "middle", margin: 0,
  });
  return slide;
}

function sectionDivider(pres, dayLabel, sectionTitle, subtitle) {
  const slide = pres.addSlide();
  slide.background = { color: C.indigo };
  // Left accent stripe
  slide.addShape("rect", { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { color: C.teal } });
  // Day pill
  slide.addShape("rect", {
    x: 0.5, y: 1.8, w: 1.2, h: 0.45,
    fill: { color: C.teal }, line: { color: C.teal }, rectRadius: 0.08,
  });
  slide.addText(dayLabel, {
    x: 0.5, y: 1.8, w: 1.2, h: 0.45,
    fontSize: 11, bold: true, color: C.white,
    fontFace: FONT, align: "center", valign: "middle", margin: 0,
  });
  slide.addText(sectionTitle, {
    x: 0.5, y: 2.35, w: 9.2, h: 1.4,
    fontSize: 44, bold: true, color: C.white,
    fontFace: FONT, align: "left", valign: "top", margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 3.8, w: 9.0, h: 0.6,
      fontSize: 16, color: "a5b4fc",
      fontFace: FONT_BODY, align: "left", valign: "top", margin: 0,
    });
  }
  // Bottom teal bar
  slide.addShape("rect", { x: 0, y: 5.2, w: 10, h: 0.425, fill: { color: "0f172a" }, line: { color: "0f172a" } });
  slide.addText("Word Labs  •  wordlabs.app", {
    x: 0, y: 5.2, w: 10, h: 0.425,
    fontSize: 10, color: "64748b",
    fontFace: FONT_BODY, align: "center", valign: "middle", margin: 0,
  });
  return slide;
}

function lightSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: C.offWhite };
  return slide;
}

function footer(slide) {
  slide.addShape("rect", { x: 0, y: 5.325, w: 10, h: 0.3, fill: { color: C.slateLight }, line: { color: C.slateLight } });
  slide.addText(`Word Labs  •  wordlabs.app  •  ${morphemeLabel()}: ${morphemeDisplay()} = ${DATA.meaning}`, {
    x: 0, y: 5.325, w: 10, h: 0.3,
    fontSize: 8, color: C.slate,
    fontFace: FONT_BODY, align: "center", valign: "middle", margin: 0,
  });
}

// Morpheme chip — coloured pill for a morpheme part
function morphemeChip(slide, text, chipType, x, y, w, h) {
  // chipType: 'prefix' | 'base' | 'suffix' | 'neutral'
  const fills = { prefix: "ddd6fe", base: C.tealLight, suffix: "fce7f3", neutral: C.slateLight };
  const borders = { prefix: "7c3aed", base: C.teal, suffix: "db2777", neutral: C.slate };
  const textColors = { prefix: "4c1d95", base: "0f766e", suffix: "9d174d", neutral: C.dark };

  slide.addShape("rect", {
    x, y, w, h,
    fill: { color: fills[chipType] },
    line: { color: borders[chipType], width: 1.5 },
    rectRadius: 0.08,
    shadow: makeShadow(),
  });
  slide.addText(text, {
    x, y, w, h,
    fontSize: 13, bold: true, color: textColors[chipType],
    fontFace: FONT, align: "center", valign: "middle", margin: 0,
  });
}

// ============================================================
//  SLIDE BUILDERS
// ============================================================

// ── TITLE SLIDE ──────────────────────────────────────────────
function addTitleSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: C.indigo };
  slide.addShape("rect", { x: 0, y: 0, w: 0.22, h: 5.625, fill: { color: C.teal }, line: { color: C.teal } });
  slide.addShape("rect", { x: 0, y: 4.3, w: 10, h: 1.325, fill: { color: "0f172a" }, line: { color: "0f172a" } });

  slide.addText("WORD LABS", {
    x: 0.5, y: 0.55, w: 9, h: 0.55,
    fontSize: 13, bold: true, color: C.teal, charSpacing: 8,
    fontFace: FONT, align: "left", valign: "middle", margin: 0,
  });
  slide.addText(`${morphemeLabel()}: ${morphemeDisplay()}`, {
    x: 0.5, y: 1.1, w: 9, h: 1.4,
    fontSize: 64, bold: true, color: C.white,
    fontFace: FONT, align: "left", valign: "top", margin: 0,
  });
  slide.addText(`"${DATA.meaning}"`, {
    x: 0.5, y: 2.55, w: 9, h: 0.6,
    fontSize: 22, color: "a5b4fc", italic: true,
    fontFace: FONT_BODY, align: "left", valign: "middle", margin: 0,
  });
  slide.addText(`Origin: ${DATA.origin}`, {
    x: 0.5, y: 3.2, w: 5, h: 0.4,
    fontSize: 13, color: "6366f1",
    fontFace: FONT_BODY, align: "left", valign: "middle", margin: 0,
  });

  // Three day pills
  const days = ["Day 1 — Morpheme Meaning", "Day 2 — Dictation & Breakdown", "Day 3 — Dictation & Word Matrix"];
  days.forEach((d, i) => {
    slide.addShape("rect", {
      x: 0.5, y: 3.75 + i * 0.15, w: 4.4, h: 0.38,
      fill: { color: i === 0 ? C.teal : "1e1b4b" },
      line: { color: i === 0 ? C.teal : "4338ca" },
      rectRadius: 0.06,
    });
    slide.addText(d, {
      x: 0.5, y: 3.75 + i * 0.15, w: 4.4, h: 0.38,
      fontSize: 11, bold: i === 0, color: C.white,
      fontFace: FONT_BODY, align: "center", valign: "middle", margin: 0,
    });
    // adjust spacing
    if (i === 0) { /* already set */ }
  });

  // Overwrite with proper spacing
  slide.addShape("rect", { x: 0.5, y: 3.72, w: 4.4, h: 0.38, fill: { color: C.teal }, line: { color: C.teal }, rectRadius: 0.06 });
  slide.addText("Day 1 — Morpheme Meaning", { x: 0.5, y: 3.72, w: 4.4, h: 0.38, fontSize: 11, bold: true, color: C.white, fontFace: FONT_BODY, align: "center", valign: "middle", margin: 0 });
  slide.addShape("rect", { x: 0.5, y: 4.14, w: 4.4, h: 0.38, fill: { color: "1e1b4b" }, line: { color: C.indigoLight }, rectRadius: 0.06 });
  slide.addText("Day 2 — Dictation & Breakdown", { x: 0.5, y: 4.14, w: 4.4, h: 0.38, fontSize: 11, color: "a5b4fc", fontFace: FONT_BODY, align: "center", valign: "middle", margin: 0 });
  slide.addShape("rect", { x: 0.5, y: 4.56, w: 4.4, h: 0.38, fill: { color: "1e1b4b" }, line: { color: C.indigoLight }, rectRadius: 0.06 });
  slide.addText("Day 3 — Dictation & Word Matrix", { x: 0.5, y: 4.56, w: 4.4, h: 0.38, fontSize: 11, color: "a5b4fc", fontFace: FONT_BODY, align: "center", valign: "middle", margin: 0 });

  slide.addText("wordlabs.app", { x: 0.5, y: 4.4, w: 9, h: 0.35, fontSize: 10, color: "475569", fontFace: FONT_BODY, align: "right", valign: "middle", margin: 0 });
}

// ── DAY 1: LEARNING INTENTION ────────────────────────────────
function addLearningIntention(pres) {
  const slide = lightSlide(pres);
  slideHeader(slide, "Day 1", "Learning Intention & Success Criteria");
  footer(slide);

  slide.addShape("rect", { x: 0.4, y: 0.9, w: 9.2, h: 1.35, fill: { color: C.indigoSoft }, line: { color: C.indigoLight }, rectRadius: 0.1, shadow: makeShadow() });
  slide.addText(`We are learning that the ${morphemeLabel().toLowerCase()} ${morphemeDisplay()} means '${DATA.meaning}'.`, {
    x: 0.55, y: 0.95, w: 8.9, h: 1.2,
    fontSize: 20, bold: true, color: C.indigoMid,
    fontFace: FONT, align: "left", valign: "middle",
  });

  slide.addText("Success Criteria", {
    x: 0.4, y: 2.4, w: 9.2, h: 0.4,
    fontSize: 14, bold: true, color: C.dark,
    fontFace: FONT, align: "left", valign: "middle", margin: 0,
  });

  const criteria = [
    `I can explain the meaning of the ${morphemeLabel().toLowerCase()} ${morphemeDisplay()}.`,
    `I can use ${morphemeType() === "base" ? "prefixes and suffixes" : "base words and other morphemes"} to build and decode ${morphemeDisplay()} words.`,
    `I can read and spell ${morphemeDisplay()} words effectively in sentences.`,
  ];
  criteria.forEach((c, i) => {
    slide.addShape("rect", {
      x: 0.4, y: 2.88 + i * 0.72, w: 0.42, h: 0.42,
      fill: { color: C.tealLight }, line: { color: C.teal }, rectRadius: 0.06,
    });
    slide.addText("✓", { x: 0.4, y: 2.88 + i * 0.72, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: C.teal, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
    slide.addText(c, {
      x: 0.92, y: 2.88 + i * 0.72, w: 8.6, h: 0.42,
      fontSize: 14, color: C.dark,
      fontFace: FONT_BODY, align: "left", valign: "middle",
    });
  });
}

// ── DAY 1: VOCABULARY ────────────────────────────────────────
function addVocabularySlide(pres) {
  const slide = lightSlide(pres);
  slideHeader(slide, "Day 1", "Key Vocabulary");
  footer(slide);

  const ex0 = DATA.examples[0] ? DATA.examples[0].word : DATA.morpheme;
  const ex1 = DATA.examples[1] ? DATA.examples[1].word : DATA.morpheme;
  const terms = morphemeType() === "prefix" ? [
    { term: "Prefix", color: "7c3aed", textCol: "4c1d95", bgCol: "ddd6fe", def: `A meaningful word part added to the beginning of a root to change its meaning. The prefix '${DATA.morpheme}-' means '${DATA.meaning}'.` },
    { term: "Root", color: C.teal, textCol: "0f766e", bgCol: C.tealLight, def: `The core part of a word carrying its basic meaning. In '${ex0}', the root is the part after the prefix '${DATA.morpheme}-'.` },
    { term: "Suffix", color: "db2777", textCol: "9d174d", bgCol: "fce7f3", def: `A meaningful word part added to the end of a word to change its meaning or form. E.g. '-ed' changes a verb to past tense.` },
  ] : morphemeType() === "suffix" ? [
    { term: "Suffix", color: "db2777", textCol: "9d174d", bgCol: "fce7f3", def: `A meaningful word part added to the end of a word to change its meaning or form. The suffix '-${DATA.morpheme}' means '${DATA.meaning}'.` },
    { term: "Root", color: C.teal, textCol: "0f766e", bgCol: C.tealLight, def: `The core part of a word carrying its basic meaning. In '${ex0}', the root is the part before the suffix '-${DATA.morpheme}'.` },
    { term: "Prefix", color: "7c3aed", textCol: "4c1d95", bgCol: "ddd6fe", def: `A meaningful word part added to the beginning of a root to change its meaning. E.g. 'un-' in '${ex1}' means 'not'.` },
  ] : [
    { term: "Root", color: C.teal, textCol: "0f766e", bgCol: C.tealLight, def: `The core part of a word carrying its basic meaning. For example, '${DATA.morpheme}' means '${DATA.meaning}'.` },
    { term: "Prefix", color: "7c3aed", textCol: "4c1d95", bgCol: "ddd6fe", def: `A meaningful word part added to the beginning of a root to change its meaning. E.g. a prefix before '${DATA.morpheme}' changes the word's meaning.` },
    { term: "Suffix", color: "db2777", textCol: "9d174d", bgCol: "fce7f3", def: `A meaningful word part added to the end of a word to change its meaning or form. E.g. a suffix after '${DATA.morpheme}' can make a noun or adjective.` },
  ];

  terms.forEach((t, i) => {
    const y = 0.88 + i * 1.45;
    slide.addShape("rect", { x: 0.4, y, w: 9.2, h: 1.28, fill: { color: t.bgCol }, line: { color: t.color }, rectRadius: 0.1, shadow: makeShadow() });
    slide.addShape("rect", { x: 0.4, y, w: 1.4, h: 1.28, fill: { color: t.color }, line: { color: t.color }, rectRadius: 0.1 });
    // Cover right edge of left shape to make sharp right border
    slide.addShape("rect", { x: 1.62, y, w: 0.1, h: 1.28, fill: { color: t.color }, line: { color: t.color } });
    slide.addText(t.term, { x: 0.4, y, w: 1.4, h: 1.28, fontSize: 16, bold: true, color: C.white, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
    slide.addText(t.def, { x: 1.85, y: y + 0.04, w: 7.6, h: 1.2, fontSize: 13.5, color: t.textCol, fontFace: FONT_BODY, align: "left", valign: "middle" });
  });
}

// ── DAY 1: TRUE OR FALSE ─────────────────────────────────────
function addTrueFalseSlide(pres) {
  const slide = lightSlide(pres);
  slideHeader(slide, "Day 1", "True or False?");
  footer(slide);

  slide.addText("Are the following statements true or false?", {
    x: 0.4, y: 0.8, w: 9.2, h: 0.45,
    fontSize: 14, color: C.slate, fontFace: FONT_BODY, align: "left", valign: "middle",
  });

  DATA.trueOrFalse.forEach((item, i) => {
    const y = 1.32 + i * 0.76;
    const isTrue = item.answer;
    slide.addShape("rect", {
      x: 0.4, y, w: 8.0, h: 0.62,
      fill: { color: C.offWhite }, line: { color: C.slateLight }, rectRadius: 0.08, shadow: makeShadow(),
    });
    slide.addText(`${i + 1}.  ${item.statement}`, {
      x: 0.6, y, w: 7.6, h: 0.62,
      fontSize: 13, color: C.dark, fontFace: FONT_BODY, align: "left", valign: "middle",
    });
    // Answer box (show answer)
    slide.addShape("rect", {
      x: 8.5, y, w: 1.1, h: 0.62,
      fill: { color: isTrue ? "dcfce7" : "fee2e2" }, line: { color: isTrue ? C.green : C.red }, rectRadius: 0.08,
    });
    slide.addText(isTrue ? "TRUE" : "FALSE", {
      x: 8.5, y, w: 1.1, h: 0.62,
      fontSize: 11, bold: true, color: isTrue ? C.green : C.red,
      fontFace: FONT, align: "center", valign: "middle", margin: 0,
    });
  });
}

// ── DAY 1: ROOT MEANING ──────────────────────────────────────
function addRootMeaningSlide(pres) {
  const slide = lightSlide(pres);
  slideHeader(slide, "Day 1", `${morphemeLabel()} ${morphemeDisplay()} — Meaning & Origin`);
  footer(slide);

  // Central meaning card
  slide.addShape("rect", {
    x: 0.4, y: 0.85, w: 9.2, h: 1.5,
    fill: { color: C.teal }, line: { color: C.teal }, rectRadius: 0.12, shadow: makeShadow(),
  });
  slide.addText(`'${DATA.morpheme}'`, {
    x: 0.4, y: 0.85, w: 3.2, h: 1.5,
    fontSize: 52, bold: true, color: C.white,
    fontFace: FONT, align: "center", valign: "middle", margin: 0,
  });
  slide.addShape("rect", { x: 3.55, y: 0.85, w: 0.04, h: 1.5, fill: { color: "312e81" }, line: { color: "312e81" } });
  slide.addText(DATA.meaning, {
    x: 3.75, y: 0.85, w: 4.0, h: 1.5,
    fontSize: 20, bold: true, color: C.white,
    fontFace: FONT, align: "left", valign: "middle",
  });
  slide.addText(`Origin: ${DATA.origin}`, {
    x: 7.8, y: 0.85, w: 1.75, h: 1.5,
    fontSize: 11, color: "99f6e4", italic: true,
    fontFace: FONT_BODY, align: "center", valign: "middle",
  });

  // Examples label
  slide.addText(`Words using this ${morphemeLabel().toLowerCase()}:`, {
    x: 0.4, y: 2.55, w: 9.2, h: 0.38,
    fontSize: 13, bold: true, color: C.dark,
    fontFace: FONT, align: "left", valign: "middle", margin: 0,
  });

  // Example word chips
  const words = DATA.examples.slice(0, 7);
  const cols = 4;
  words.forEach((ex, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 0.4 + col * 2.35;
    const y = 3.0 + row * 0.72;
    slide.addShape("rect", {
      x, y, w: 2.2, h: 0.55,
      fill: { color: C.indigoSoft }, line: { color: C.indigoLight }, rectRadius: 0.08,
    });
    slide.addText(ex.word, {
      x, y, w: 2.2, h: 0.55,
      fontSize: 13, bold: true, color: C.indigoMid,
      fontFace: FONT, align: "center", valign: "middle", margin: 0,
    });
  });
}

// ── DAY 1: WORD MATRIX ───────────────────────────────────────
function addWordMatrixSlide(pres) {
  const slide = lightSlide(pres);
  slideHeader(slide, "Day 1", `Word Matrix — Build with ${morphemeDisplay()}`);
  footer(slide);

  // Instructions
  slide.addText("Use the matrix below. Choose morpheme parts to build a word. Not all combinations work!", {
    x: 0.4, y: 0.82, w: 9.2, h: 0.44,
    fontSize: 12, color: C.slate, fontFace: FONT_BODY, align: "left", valign: "middle",
  });

  // Matrix header row
  const colW = [1.6, 1.8, 1.6];
  const colX = [0.7, 3.6, 6.5];
  const headers = matrixHeaders();
  const headerColors = ["7c3aed", C.teal, "db2777"];
  const chipFills = ["ddd6fe", C.tealLight, "fce7f3"];
  const chipTexts = ["4c1d95", "0f766e", "9d174d"];
  const col0 = matrixCol0Data();
  const col1 = matrixCol1Data();
  const col2 = matrixCol2Data();

  headers.forEach((h, i) => {
    slide.addShape("rect", { x: colX[i], y: 1.35, w: colW[i], h: 0.5, fill: { color: headerColors[i] }, line: { color: headerColors[i] }, rectRadius: 0.06 });
    slide.addText(h, { x: colX[i], y: 1.35, w: colW[i], h: 0.5, fontSize: 12, bold: true, color: C.white, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
  });

  // Rows
  const rows = Math.max(col0.length, col1.length, col2.length);
  for (let r = 0; r < rows; r++) {
    const y = 1.92 + r * 0.5;
    const bg = r % 2 === 0 ? C.offWhite : "f1f5f9";
    // Column 0
    slide.addShape("rect", { x: colX[0], y, w: colW[0], h: 0.46, fill: { color: r < col0.length ? chipFills[0] : bg }, line: { color: "e5e7eb" } });
    if (r < col0.length) slide.addText(formatChip(col0[r], 0), { x: colX[0], y, w: colW[0], h: 0.46, fontSize: 13, bold: true, color: chipTexts[0], fontFace: FONT, align: "center", valign: "middle", margin: 0 });
    // Column 1
    slide.addShape("rect", { x: colX[1], y, w: colW[1], h: 0.46, fill: { color: r < col1.length ? chipFills[1] : bg }, line: { color: "e5e7eb" } });
    if (r < col1.length) slide.addText(col1[r], { x: colX[1], y, w: colW[1], h: 0.46, fontSize: 13, bold: true, color: chipTexts[1], fontFace: FONT, align: "center", valign: "middle", margin: 0 });
    // Column 2
    slide.addShape("rect", { x: colX[2], y, w: colW[2], h: 0.46, fill: { color: r < col2.length ? chipFills[2] : bg }, line: { color: "e5e7eb" } });
    if (r < col2.length) slide.addText(formatChip(col2[r], 2), { x: colX[2], y, w: colW[2], h: 0.46, fontSize: 13, bold: true, color: chipTexts[2], fontFace: FONT, align: "center", valign: "middle", margin: 0 });
  }

  // Example build — use first example word and its morpheme breakdown if available
  const exY = 1.92 + rows * 0.5 + 0.15;
  slide.addText("Example:", { x: 0.4, y: exY, w: 1.2, h: 0.46, fontSize: 12, bold: true, color: C.slate, fontFace: FONT_BODY, align: "left", valign: "middle", margin: 0 });

  // Use the first example word for the example build
  const exWord = DATA.examples[0] ? DATA.examples[0].word : DATA.morpheme;
  // Build chip display from available data
  const exParts = [];
  if (col0.length > 0) exParts.push({ text: formatChip(col0[0], 0), type: morphemeType() === "prefix" ? "prefix" : "prefix" });
  exParts.push({ text: morphemeType() === "base" ? morphemeDisplay() : (col1[0] || "base"), type: "base" });
  if (col2.length > 0) exParts.push({ text: formatChip(col2[0], 2), type: "suffix" });

  let chipX = 1.65;
  exParts.forEach((p, i) => {
    if (i > 0) {
      slide.addText("+", { x: chipX, y: exY, w: 0.35, h: 0.46, fontSize: 14, color: C.slate, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
      chipX += 0.38;
    }
    const cw = Math.max(0.9, p.text.length * 0.16 + 0.4);
    morphemeChip(slide, p.text, p.type, chipX, exY, cw, 0.46);
    chipX += cw + 0.03;
  });
  slide.addText("=", { x: chipX + 0.05, y: exY, w: 0.4, h: 0.46, fontSize: 18, bold: true, color: C.teal, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
  slide.addShape("rect", { x: chipX + 0.5, y: exY, w: 2.4, h: 0.46, fill: { color: C.teal }, line: { color: C.teal }, rectRadius: 0.08 });
  slide.addText(exWord, { x: chipX + 0.5, y: exY, w: 2.4, h: 0.46, fontSize: 14, bold: true, color: C.white, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
}

// ── DAY 1: WORD MEANINGS (DEFINITIONS) ──────────────────────
function addDefinitionsSlide(pres) {
  const slide = lightSlide(pres);
  slideHeader(slide, "Day 1", `'${DATA.morpheme}' Word Definitions`);
  footer(slide);

  slide.addText("Match the word to its meaning:", {
    x: 0.4, y: 0.82, w: 9.2, h: 0.4,
    fontSize: 13, color: C.slate, fontFace: FONT_BODY, align: "left", valign: "middle",
  });

  const shown = DATA.examples.slice(0, 7);
  // Shuffle definitions so students actually have to match
  const shuffledDefs = shown.map(ex => ex.definition).slice();
  for (let i = shuffledDefs.length - 1; i > 0; i--) {
    // Use a deterministic seed based on morpheme so shuffles are consistent
    const j = (DATA.morpheme.charCodeAt(0) * 7 + i * 13) % (i + 1);
    [shuffledDefs[i], shuffledDefs[j]] = [shuffledDefs[j], shuffledDefs[i]];
  }
  shown.forEach((ex, i) => {
    const y = 1.3 + i * 0.58;
    slide.addShape("rect", { x: 0.4, y, w: 2.2, h: 0.5, fill: { color: C.indigoSoft }, line: { color: C.indigoLight }, rectRadius: 0.06, shadow: makeShadow() });
    slide.addText(ex.word, { x: 0.4, y, w: 2.2, h: 0.5, fontSize: 12, bold: true, color: C.indigoMid, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
    slide.addShape("rect", { x: 2.75, y, w: 6.85, h: 0.5, fill: { color: C.offWhite }, line: { color: C.slateLight }, rectRadius: 0.06 });
    slide.addText(shuffledDefs[i], { x: 2.9, y, w: 6.6, h: 0.5, fontSize: 12, color: C.dark, fontFace: FONT_BODY, align: "left", valign: "middle" });
  });
}

// ── DAY 1: SENTENCES PRACTICE ────────────────────────────────
function addSentencesSlide(pres) {
  const slide = lightSlide(pres);
  slideHeader(slide, "Day 1", `Using ${morphemeDisplay()} Words in Sentences`);
  footer(slide);

  slide.addText(`Read these example sentences. Underline the ${morphemeDisplay()} word and discuss its meaning.`, {
    x: 0.4, y: 0.82, w: 9.2, h: 0.44,
    fontSize: 13, color: C.slate, fontFace: FONT_BODY, align: "left", valign: "middle",
  });

  DATA.day1Sentences.forEach((s, i) => {
    const y = 1.38 + i * 1.32;
    slide.addShape("rect", { x: 0.4, y, w: 9.2, h: 1.1, fill: { color: C.offWhite }, line: { color: C.slateLight }, rectRadius: 0.1, shadow: makeShadow() });
    slide.addShape("rect", { x: 0.4, y, w: 0.55, h: 1.1, fill: { color: C.indigoMid }, line: { color: C.indigoMid }, rectRadius: 0.1 });
    slide.addShape("rect", { x: 0.78, y, w: 0.1, h: 1.1, fill: { color: C.indigoMid }, line: { color: C.indigoMid } });
    slide.addText(`${i + 1}`, { x: 0.4, y, w: 0.55, h: 1.1, fontSize: 20, bold: true, color: C.white, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
    slide.addText(s, { x: 1.05, y: y + 0.05, w: 8.35, h: 1.0, fontSize: 15, color: C.dark, fontFace: FONT_BODY, align: "left", valign: "middle" });
  });
}

// ═══════════════════════════════════════════════════════════════
//  DAY 2 — DICTATION SLIDES
// ═══════════════════════════════════════════════════════════════

// Slide 1: Teacher reads the dictation — students listen and write
function addDictationListenSlide(pres, day, dictData) {
  const slide = lightSlide(pres);
  slideHeader(slide, `Day ${day}`, "Dictation — Listen & Write");
  footer(slide);

  slide.addShape("rect", { x: 0.4, y: 0.85, w: 9.2, h: 0.58, fill: { color: C.amberLight }, line: { color: C.amber }, rectRadius: 0.08 });
  slide.addText(`📢  Teacher reads aloud. Students write the sentence in their books.`, {
    x: 0.55, y: 0.85, w: 9.0, h: 0.58,
    fontSize: 13, bold: true, color: "92400e",
    fontFace: FONT_BODY, align: "left", valign: "middle",
  });

  // Blank sentence writing lines (3 lines)
  for (let i = 0; i < 3; i++) {
    slide.addShape("line", {
      x: 0.4, y: 1.75 + i * 0.65, w: 9.2, h: 0,
      line: { color: C.slateLight, width: 1.5 },
    });
  }

  slide.addText("Write your sentence here ↑", {
    x: 0.4, y: 3.7, w: 9.2, h: 0.38,
    fontSize: 11, color: C.slate, italic: true,
    fontFace: FONT_BODY, align: "center", valign: "middle",
  });

  // Word + punctuation count hint
  const wCount = dictData.words.length;
  const pCount = dictData.punctuationCount;
  slide.addShape("rect", { x: 2.2, y: 4.18, w: 2.5, h: 0.72, fill: { color: C.indigoSoft }, line: { color: C.indigoLight }, rectRadius: 0.1, shadow: makeShadow() });
  slide.addText([
    { text: `${wCount}`, options: { fontSize: 28, bold: true, color: C.indigoMid, breakLine: false } },
    { text: `  focus word${wCount > 1 ? "s" : ""}`, options: { fontSize: 12, color: C.slate, breakLine: false } },
  ], { x: 2.2, y: 4.18, w: 2.5, h: 0.72, fontFace: FONT, align: "center", valign: "middle" });
  slide.addShape("rect", { x: 5.3, y: 4.18, w: 2.5, h: 0.72, fill: { color: C.amberLight }, line: { color: C.amber }, rectRadius: 0.1, shadow: makeShadow() });
  slide.addText([
    { text: `${pCount}`, options: { fontSize: 28, bold: true, color: "92400e", breakLine: false } },
    { text: `  punctuation mark${pCount > 1 ? "s" : ""}`, options: { fontSize: 12, color: C.slate, breakLine: false } },
  ], { x: 5.3, y: 4.18, w: 2.5, h: 0.72, fontFace: FONT, align: "center", valign: "middle" });
}

// Slide 2: Sentence revealed with focus words highlighted
function addDictationRevealSlide(pres, day, dictData) {
  const slide = lightSlide(pres);
  slideHeader(slide, `Day ${day}`, "Dictation — Reveal & Underline");
  footer(slide);

  slide.addText("Check your sentence. Underline the focus words.", {
    x: 0.4, y: 0.82, w: 9.2, h: 0.4,
    fontSize: 13, color: C.slate, fontFace: FONT_BODY, align: "left", valign: "middle",
  });

  // Sentence card — we highlight focus words in the sentence text
  slide.addShape("rect", { x: 0.4, y: 1.3, w: 9.2, h: 1.7, fill: { color: C.offWhite }, line: { color: C.slateLight }, rectRadius: 0.12, shadow: makeShadow() });

  // Build rich text for sentence — highlight focus words
  const sentence = dictData.sentence;
  const focusWords = dictData.words.map(w => w.word);
  const richText = buildHighlightedSentence(sentence, focusWords);

  slide.addText(richText, {
    x: 0.6, y: 1.38, w: 8.8, h: 1.54,
    fontSize: 18, fontFace: FONT_BODY, align: "left", valign: "middle",
  });

  // Rewrite instruction
  slide.addShape("rect", { x: 0.4, y: 3.12, w: 9.2, h: 0.52, fill: { color: C.tealLight }, line: { color: C.teal }, rectRadius: 0.08 });
  slide.addText("Now rewrite each focus word below with space between letters — leave room for your breakdown.", {
    x: 0.55, y: 3.12, w: 9.0, h: 0.52,
    fontSize: 12, bold: true, color: "0f766e",
    fontFace: FONT_BODY, align: "left", valign: "middle",
  });

  // Word boxes for student writing
  const wordCount = dictData.words.length;
  const boxW = Math.min(2.8, 8.8 / wordCount - 0.2);
  const startX = (10 - wordCount * (boxW + 0.3)) / 2;
  dictData.words.forEach((w, i) => {
    const x = startX + i * (boxW + 0.3);
    slide.addShape("rect", { x, y: 3.78, w: boxW, h: 1.1, fill: { color: C.offWhite }, line: { color: C.slateLight, width: 1 }, rectRadius: 0.08 });
    slide.addShape("line", { x, y: 4.35, w: boxW, h: 0, line: { color: C.slateLight, width: 1, dashType: "dash" } });
    slide.addText(w.word, { x, y: 3.78, w: boxW, h: 0.55, fontSize: 14, bold: true, color: C.teal, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
    slide.addText("write your breakdown below", { x, y: 4.38, w: boxW, h: 0.5, fontSize: 9, color: C.slate, italic: true, fontFace: FONT_BODY, align: "center", valign: "middle", margin: 0 });
  });
}

function buildHighlightedSentence(sentence, focusWords) {
  // Build rich text array with focus words highlighted in teal
  const result = [];
  let remaining = sentence;

  // Simple approach: split sentence by focus words
  const sortedFocusWords = [...focusWords].sort((a, b) => b.length - a.length); // longest first
  const parts = [];
  let i = 0;
  const sentLower = sentence.toLowerCase();

  while (i < sentence.length) {
    let matched = false;
    for (const fw of sortedFocusWords) {
      if (sentLower.slice(i, i + fw.length) === fw.toLowerCase()) {
        parts.push({ text: sentence.slice(i, i + fw.length), highlight: true });
        i += fw.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (parts.length === 0 || parts[parts.length - 1].highlight) parts.push({ text: "", highlight: false });
      parts[parts.length - 1].text += sentence[i];
      i++;
    }
  }

  return parts.map(p => ({
    text: p.text,
    options: p.highlight
      ? { color: C.teal, bold: true, highlight: "ccfbf1" }
      : { color: C.dark },
  }));
}

// Slides 3+: Word-by-word breakdown reveal
// Each word gets: blank → morphemes → + syllables → + phonemes
function addBreakdownRevealSlides(pres, day, dictData) {
  dictData.words.forEach((wordData, wi) => {
    const wordCount = dictData.words.length;

    // Step 0: student attempt slide — just the word, blank rows below
    addBreakdownStep(pres, day, dictData, wi, "attempt");
    // Step 1: morpheme reveal
    addBreakdownStep(pres, day, dictData, wi, "morphemes");
    // Step 2: + syllables
    addBreakdownStep(pres, day, dictData, wi, "syllables");
    // Step 3: + phonemes
    addBreakdownStep(pres, day, dictData, wi, "phonemes");
  });
}

function addBreakdownStep(pres, day, dictData, wordIndex, step) {
  const wordData = dictData.words[wordIndex];
  const slide = lightSlide(pres);

  const stepLabels = {
    attempt:   `Breakdown — Attempt (Word ${wordIndex + 1} of ${dictData.words.length})`,
    morphemes: `Breakdown — Morphemes Revealed`,
    syllables: `Breakdown — + Syllables`,
    phonemes:  `Breakdown — + Phonemes`,
  };
  slideHeader(slide, `Day ${day}`, stepLabels[step]);
  footer(slide);

  // Instruction banner per step
  const instructions = {
    attempt:   "Write the morpheme breakdown, syllables, and phonemes for this word. Check your work on the next slides.",
    morphemes: "✓ Check your morpheme breakdown. Morphemes are the meaningful parts.",
    syllables: "✓ Now check your syllable split. Syllables are the beats in the word.",
    phonemes:  "✓ Now check your phonemes. Phonemes are the individual sounds.",
  };
  const bannerColor = { attempt: C.amberLight, morphemes: "ddd6fe", syllables: C.tealLight, phonemes: "fce7f3" };
  const bannerBorder = { attempt: C.amber, morphemes: "7c3aed", syllables: C.teal, phonemes: "db2777" };
  const bannerText = { attempt: "92400e", morphemes: "4c1d95", syllables: "0f766e", phonemes: "9d174d" };

  slide.addShape("rect", { x: 0.4, y: 0.82, w: 9.2, h: 0.52, fill: { color: bannerColor[step] }, line: { color: bannerBorder[step] }, rectRadius: 0.08 });
  slide.addText(instructions[step], { x: 0.55, y: 0.82, w: 9.0, h: 0.52, fontSize: 12, bold: step !== "attempt", color: bannerText[step], fontFace: FONT_BODY, align: "left", valign: "middle" });

  // Focus word header
  slide.addShape("rect", { x: 3.0, y: 1.45, w: 4.0, h: 0.8, fill: { color: C.indigoMid }, line: { color: C.indigoMid }, rectRadius: 0.1, shadow: makeShadow() });
  slide.addText(wordData.word, { x: 3.0, y: 1.45, w: 4.0, h: 0.8, fontSize: 28, bold: true, color: C.white, fontFace: FONT, align: "center", valign: "middle", margin: 0 });

  // MORPHEMES row (taller to fit notes about assimilated prefixes, connecting vowels etc.)
  const showMorphemes = step !== "attempt";
  addBreakdownRow(slide, "Morphemes", 2.45,
    showMorphemes ? wordData.morphemes : null, "morpheme");

  // SYLLABLES row
  const showSyllables = step === "syllables" || step === "phonemes";
  addBreakdownRow(slide, "Syllables", 3.58,
    showSyllables ? wordData.syllables : null, "syllable");

  // PHONEMES row
  const showPhonemes = step === "phonemes";
  addBreakdownRow(slide, "Phonemes", 4.48,
    showPhonemes ? wordData.phonemes : null, "phoneme");
}

function addBreakdownRow(slide, label, y, data, type) {
  // Morpheme rows are taller to fit rule notes
  const rowH = type === "morpheme" ? 0.92 : 0.72;
  // Row label
  slide.addShape("rect", { x: 0.4, y, w: 1.5, h: rowH, fill: { color: C.slateLight }, line: { color: C.slateLight }, rectRadius: 0.06 });
  slide.addText(label, { x: 0.4, y, w: 1.5, h: rowH, fontSize: 11, bold: true, color: C.slate, fontFace: FONT, align: "center", valign: "middle", margin: 0 });

  if (!data) {
    // Blank writing area
    slide.addShape("rect", { x: 2.05, y, w: 7.55, h: rowH, fill: { color: C.offWhite }, line: { color: C.slateLight, dashType: "dash" }, rectRadius: 0.06 });
    slide.addText("Write here...", { x: 2.05, y, w: 7.55, h: rowH, fontSize: 11, color: "cbd5e1", italic: true, fontFace: FONT_BODY, align: "center", valign: "middle" });
    return;
  }

  if (type === "morpheme") {
    // data is array of {part, meaning, note?}
    const n = data.length;
    const chipW = Math.min(2.0, 7.4 / n - 0.12);
    const gap = (7.4 - n * chipW) / (n + 1);
    data.forEach((m, i) => {
      const x = 2.08 + gap + i * (chipW + gap);
      const partIsMorpheme = DATA.morpheme.startsWith(m.part) || m.part === DATA.morpheme;
      const chipType = m.part === DATA.morpheme ? "base" : (i < data.length - 1 && i === 0 || m.meaning.includes("again") || m.meaning.includes("with") || m.meaning.includes("undo") || m.meaning.includes("not") || m.meaning.includes("small") ? "prefix" : "suffix");
      morphemeChip(slide, m.part, chipType, x, y + 0.02, chipW, 0.32);
      slide.addText(m.meaning, { x, y: y + 0.36, w: chipW, h: 0.22, fontSize: 8.5, color: C.slate, fontFace: FONT_BODY, align: "center", valign: "top", margin: 0 });
      // Show rule note (assimilated prefix, connecting vowel, etc.) in small grey italic
      if (m.note) {
        slide.addText(m.note, { x, y: y + 0.56, w: chipW, h: 0.2, fontSize: 7, color: "94a3b8", italic: true, fontFace: FONT_BODY, align: "center", valign: "top", margin: 0 });
      }
    });
  } else if (type === "syllable") {
    // data is string like "re/con/struc/tion"
    slide.addShape("rect", { x: 2.05, y, w: 7.55, h: 0.72, fill: { color: C.tealLight }, line: { color: C.teal }, rectRadius: 0.06 });
    const parts = data.split("/");
    const n = parts.length;
    const chipW = Math.min(1.8, 7.2 / n - 0.1);
    const gap = (7.2 - n * chipW) / (n + 1);
    parts.forEach((p, i) => {
      const x = 2.08 + gap + i * (chipW + gap);
      slide.addShape("rect", { x, y: y + 0.1, w: chipW, h: 0.52, fill: { color: C.white }, line: { color: C.teal }, rectRadius: 0.05 });
      slide.addText(p, { x, y: y + 0.1, w: chipW, h: 0.52, fontSize: 14, bold: true, color: C.teal, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
      if (i < n - 1) slide.addText("·", { x: x + chipW, y: y + 0.1, w: gap, h: 0.52, fontSize: 16, bold: true, color: C.teal, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
    });
  } else if (type === "phoneme") {
    // data is string like "r/e/c/o/n/..."
    slide.addShape("rect", { x: 2.05, y, w: 7.55, h: 0.72, fill: { color: "fce7f3" }, line: { color: "db2777" }, rectRadius: 0.06 });
    const parts = data.split("/");
    const n = parts.length;
    const chipW = Math.min(0.75, 7.2 / n - 0.06);
    const gap = Math.max(0.02, (7.2 - n * chipW) / (n + 1));
    parts.forEach((p, i) => {
      const x = 2.08 + gap + i * (chipW + gap);
      slide.addShape("rect", { x, y: y + 0.1, w: chipW, h: 0.52, fill: { color: C.white }, line: { color: "db2777" }, rectRadius: 0.04 });
      slide.addText(p, { x, y: y + 0.1, w: chipW, h: 0.52, fontSize: Math.max(9, 13 - n), bold: true, color: "9d174d", fontFace: FONT, align: "center", valign: "middle", margin: 0 });
    });
  }
}

// ═══════════════════════════════════════════════════════════════
//  DAY 3 — WORD MATRIX WORKSHEET SLIDE
// ═══════════════════════════════════════════════════════════════
function addWordMatrixWorksheetSlide(pres) {
  const slide = lightSlide(pres);
  slideHeader(slide, "Day 3", "Word Matrix — Build Your Own Words");
  footer(slide);

  slide.addText("Use the Word Labs Morpheme Builder to find words, then fill in the matrix below.", {
    x: 0.4, y: 0.82, w: 9.2, h: 0.4,
    fontSize: 12, color: C.slate, fontFace: FONT_BODY, align: "left", valign: "middle",
  });

  // Name + Date fields
  slide.addText("Name:", { x: 0.4, y: 1.28, w: 0.8, h: 0.36, fontSize: 11, bold: true, color: C.dark, fontFace: FONT, align: "left", valign: "middle", margin: 0 });
  slide.addShape("line", { x: 1.25, y: 1.5, w: 3.2, h: 0, line: { color: C.slate, width: 1 } });
  slide.addText("Date:", { x: 5.1, y: 1.28, w: 0.7, h: 0.36, fontSize: 11, bold: true, color: C.dark, fontFace: FONT, align: "left", valign: "middle", margin: 0 });
  slide.addShape("line", { x: 5.85, y: 1.5, w: 3.55, h: 0, line: { color: C.slate, width: 1 } });

  // Matrix — Prefixes | BASE | Suffixes
  const matX = [0.4, 3.25, 6.5];
  const matW = [2.7, 3.1, 3.1];
  const wsHeaders = matrixHeaders();
  const wsHeaderColors = ["7c3aed", C.teal, "db2777"];

  wsHeaders.forEach((h, i) => {
    slide.addShape("rect", { x: matX[i], y: 1.75, w: matW[i], h: 0.48, fill: { color: wsHeaderColors[i] }, line: { color: wsHeaderColors[i] }, rectRadius: 0.06 });
    slide.addText(h, { x: matX[i], y: 1.75, w: matW[i], h: 0.48, fontSize: 10, bold: true, color: C.white, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
  });

  // 4 blank rows (compressed)
  for (let r = 0; r < 4; r++) {
    const y = 2.26 + r * 0.37;
    const rowBg = r % 2 === 0 ? C.offWhite : "f1f5f9";
    matX.forEach((x, i) => {
      slide.addShape("rect", { x, y, w: matW[i], h: 0.35, fill: { color: rowBg }, line: { color: C.slateLight } });
    });
  }

  // "Words I made" section
  slide.addText("Words I made:", { x: 0.4, y: 3.8, w: 9.2, h: 0.32, fontSize: 12, bold: true, color: C.dark, fontFace: FONT, align: "left", valign: "middle", margin: 0 });

  // 3x3 word grid with lines (6 words, 2 rows, 3 cols)
  const wordCols = 3;
  const wordRows = 2;
  for (let r = 0; r < wordRows; r++) {
    for (let c = 0; c < wordCols; c++) {
      const x = 0.4 + c * 3.1;
      const y = 4.16 + r * 0.38;
      slide.addShape("line", { x, y, w: 2.85, h: 0, line: { color: C.slate, width: 0.75 } });
    }
  }

  // Sentences section
  slide.addText("Choose 3 words and write a sentence for each:", { x: 0.4, y: 4.96, w: 9.2, h: 0.3, fontSize: 10, bold: true, color: C.dark, fontFace: FONT, align: "left", valign: "middle", margin: 0 });
}

// Same slide with "teacher answer" visible
function addWordMatrixAnswersSlide(pres) {
  const slide = lightSlide(pres);
  slideHeader(slide, "Day 3", "Word Matrix — Review Answers");
  footer(slide);

  slide.addText("Here are some words you could have made. Check your list!", {
    x: 0.4, y: 0.82, w: 9.2, h: 0.4,
    fontSize: 13, color: C.slate, fontFace: FONT_BODY, align: "left", valign: "middle",
  });

  // Matrix with filled-in answers
  const ansX = [0.4, 3.25, 6.5];
  const ansW = [2.7, 3.1, 3.1];
  const ansHeaders = matrixHeaders();
  const ansHeaderColors = ["7c3aed", C.teal, "db2777"];
  const ansChipFill = ["ddd6fe", C.tealLight, "fce7f3"];
  const ansChipText = ["4c1d95", "0f766e", "9d174d"];
  const ansCol0 = matrixCol0Data();
  const ansCol1 = matrixCol1Data();
  const ansCol2 = matrixCol2Data();

  ansHeaders.forEach((h, i) => {
    slide.addShape("rect", { x: ansX[i], y: 1.22, w: ansW[i], h: 0.46, fill: { color: ansHeaderColors[i] }, line: { color: ansHeaderColors[i] }, rectRadius: 0.06 });
    slide.addText(h, { x: ansX[i], y: 1.22, w: ansW[i], h: 0.46, fontSize: 10, bold: true, color: C.white, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
  });

  const rows = Math.max(ansCol0.length, ansCol1.length, ansCol2.length);
  for (let r = 0; r < rows; r++) {
    const y = 1.71 + r * 0.46;
    const rowBg = r % 2 === 0 ? C.offWhite : "f1f5f9";

    slide.addShape("rect", { x: ansX[0], y, w: ansW[0], h: 0.44, fill: { color: r < ansCol0.length ? ansChipFill[0] : rowBg }, line: { color: C.slateLight } });
    if (r < ansCol0.length) slide.addText(formatChip(ansCol0[r], 0), { x: ansX[0], y, w: ansW[0], h: 0.44, fontSize: 13, bold: true, color: ansChipText[0], fontFace: FONT, align: "center", valign: "middle", margin: 0 });

    slide.addShape("rect", { x: ansX[1], y, w: ansW[1], h: 0.44, fill: { color: r < ansCol1.length ? ansChipFill[1] : rowBg }, line: { color: C.slateLight } });
    if (r < ansCol1.length) slide.addText(ansCol1[r], { x: ansX[1], y, w: ansW[1], h: 0.44, fontSize: 13, bold: true, color: ansChipText[1], fontFace: FONT, align: "center", valign: "middle", margin: 0 });

    slide.addShape("rect", { x: ansX[2], y, w: ansW[2], h: 0.44, fill: { color: r < ansCol2.length ? ansChipFill[2] : rowBg }, line: { color: C.slateLight } });
    if (r < ansCol2.length) slide.addText(formatChip(ansCol2[r], 2), { x: ansX[2], y, w: ansW[2], h: 0.44, fontSize: 13, bold: true, color: ansChipText[2], fontFace: FONT, align: "center", valign: "middle", margin: 0 });
  }

  slide.addText("Sample words:", { x: 0.4, y: 3.95, w: 2.0, h: 0.38, fontSize: 12, bold: true, color: C.dark, fontFace: FONT, align: "left", valign: "middle", margin: 0 });

  // Sample words grid
  const sampleWords = DATA.examples.map(e => e.word);
  const cols = 4;
  sampleWords.forEach((w, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 0.4 + col * 2.38;
    const y = 4.4 + row * 0.52;
    slide.addShape("rect", { x, y, w: 2.2, h: 0.44, fill: { color: C.indigoSoft }, line: { color: C.indigoLight }, rectRadius: 0.06 });
    slide.addText(w, { x, y, w: 2.2, h: 0.44, fontSize: 12, bold: true, color: C.indigoMid, fontFace: FONT, align: "center", valign: "middle", margin: 0 });
  });
}

// ═══════════════════════════════════════════════════════════════
//  MAIN — BUILD THE DECK
// ═══════════════════════════════════════════════════════════════
async function buildDeck(externalData, outputPath) {
  if (externalData) DATA = externalData;
  if (!outputPath) outputPath = "/home/claude/struct-deck/wordlabs-struct-3day.pptx";
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title = `Word Labs — ${morphemeLabel()} ${morphemeDisplay()} — 3-Day Teaching Deck`;
  pres.author = "Word Labs";

  // ── TITLE ─────────────────────────────────────────────────
  addTitleSlide(pres);

  // ── DAY 1 ─────────────────────────────────────────────────
  sectionDivider(pres, "Day 1", "Morpheme Meaning", `${morphemeLabel()} ${morphemeDisplay()} — ${DATA.meaning}`);
  addLearningIntention(pres);
  addVocabularySlide(pres);
  addTrueFalseSlide(pres);
  addRootMeaningSlide(pres);
  addWordMatrixSlide(pres);
  addDefinitionsSlide(pres);
  addSentencesSlide(pres);

  // ── DAY 2 ─────────────────────────────────────────────────
  sectionDivider(pres, "Day 2", "Dictation &\nBreakdown", "Listen → Write → Reveal → Check");
  addDictationListenSlide(pres, 2, DATA.day2);
  addDictationRevealSlide(pres, 2, DATA.day2);
  addBreakdownRevealSlides(pres, 2, DATA.day2);

  // ── DAY 3 ─────────────────────────────────────────────────
  sectionDivider(pres, "Day 3", "Dictation &\nWord Matrix", "Listen → Write → Reveal → Build");
  addDictationListenSlide(pres, 3, DATA.day3);
  addDictationRevealSlide(pres, 3, DATA.day3);
  addBreakdownRevealSlides(pres, 3, DATA.day3);
  addWordMatrixWorksheetSlide(pres);
  addWordMatrixAnswersSlide(pres);

  await pres.writeFile({ fileName: outputPath });
  console.log("Done: " + outputPath);
}

// Support both standalone and module usage
if (require.main === module) {
  buildDeck().catch(console.error);
} else {
  module.exports = { buildDeck };
}
