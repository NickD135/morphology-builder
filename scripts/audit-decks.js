#!/usr/bin/env node
// ============================================================
//  WORD LABS — Slide Deck Audit Script
//  Parses all generated PPTX decks and checks for:
//    1. Word reuse between Day 2 and Day 3
//    2. Phoneme graphemes not joining to spell the word
//    3. Syllable count mismatches (basic heuristic)
//
//  Usage: node scripts/audit-decks.js
// ============================================================

const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

const OUTPUT_DIR = path.join(__dirname, "..", "output");

// Basic syllable counter heuristic (vowel groups)
function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  let count = w.match(/[aeiouy]+/g);
  if (!count) return 1;
  let n = count.length;
  if (w.endsWith("e") && !w.endsWith("le") && !w.endsWith("ee") && !w.endsWith("ye")) n--;
  if (w.endsWith("ed") && !w.endsWith("ted") && !w.endsWith("ded") && w.length > 4) n--;
  return Math.max(1, n);
}

// Validate from cached JSON data (best quality)
async function auditFromJSON(jsonPath) {
  const issues = [];
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const filename = path.basename(jsonPath);

  // 1. Check T/F answer pattern
  if (data.trueOrFalse) {
    const pattern = data.trueOrFalse.map(q => q.answer ? "T" : "F").join("");
    if (pattern === "TFTTF" || pattern === "TFTFT") {
      issues.push({
        type: "TF_FIXED_ORDER",
        detail: `T/F answers follow fixed prompt pattern: ${pattern}`,
      });
    }
  }

  // 2. Check word reuse between Day 2 and Day 3
  if (data.day2 && data.day3) {
    const d2words = data.day2.words.map(w => w.word.toLowerCase());
    const d3words = data.day3.words.map(w => w.word.toLowerCase());
    const overlap = d2words.filter(w => d3words.includes(w));
    if (overlap.length > 0) {
      issues.push({
        type: "WORD_REUSE",
        detail: `Day 2/3 share words: ${overlap.join(", ")}`,
      });
    }
  }

  // 3. Validate phoneme and syllable data
  const allWords = [
    ...(data.day2 ? data.day2.words : []),
    ...(data.day3 ? data.day3.words : []),
  ];
  for (const w of allWords) {
    if (w.phonemes && Array.isArray(w.phonemes)) {
      const joined = w.phonemes.map(p => p.g).join("");
      if (joined !== w.word) {
        issues.push({
          type: "PHONEME_MISMATCH",
          detail: `"${w.word}" — phonemes join to "${joined}"`,
        });
      }
    }

    if (w.syllables) {
      const parts = w.syllables.split("/");
      const expected = countSyllables(w.word);
      if (Math.abs(parts.length - expected) > 1) {
        issues.push({
          type: "SYLLABLE_COUNT",
          detail: `"${w.word}" — has ${parts.length} syllables (${w.syllables}), heuristic says ${expected}`,
        });
      }
      const syllJoined = parts.join("");
      if (syllJoined !== w.word) {
        issues.push({
          type: "SYLLABLE_MISMATCH",
          detail: `"${w.word}" — syllables join to "${syllJoined}" (${w.syllables})`,
        });
      }
    }

    if (w.morphemes) {
      const morphJoined = w.morphemes.map(m => m.part).join("");
      if (Math.abs(morphJoined.length - w.word.length) > 3) {
        issues.push({
          type: "MORPHEME_LENGTH",
          detail: `"${w.word}" — morpheme parts "${morphJoined}" differ significantly in length`,
        });
      }
    }
  }

  return { filename, issues };
}

// Parse PPTX and extract text from slides for validation
async function auditDeck(pptxPath) {
  const filename = path.basename(pptxPath);
  const issues = [];

  try {
    const buf = fs.readFileSync(pptxPath);
    const zip = await JSZip.loadAsync(buf);

    const slideFiles = Object.keys(zip.files)
      .filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/i))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)/)[1]);
        const nb = parseInt(b.match(/slide(\d+)/)[1]);
        return na - nb;
      });

    // Extract text from each slide
    const slideTexts = [];
    for (const sf of slideFiles) {
      const xml = await zip.files[sf].async("text");
      const texts = [];
      const regex = /<a:t>(.*?)<\/a:t>/g;
      let match;
      while ((match = regex.exec(xml)) !== null) {
        texts.push(match[1]);
      }
      slideTexts.push(texts.join(" | "));
    }

    // Find Day 2 and Day 3 focus words by looking at breakdown slides
    // Breakdown slides contain "Morpheme Breakdown" and the word as a heading
    const day2Words = [];
    const day3Words = [];
    let currentDay = 0;

    for (let i = 0; i < slideTexts.length; i++) {
      const text = slideTexts[i];

      // Track which day we're in
      if (/Day 2/.test(text) && !/Day 3/.test(text)) currentDay = 2;
      if (/Day 3/.test(text)) currentDay = 3;

      // Breakdown slides have "Morpheme Breakdown" or "Morphemes" + "Syllables" + "Phonemes"
      const isBreakdown = (text.includes("Morpheme") && text.includes("Breakdown")) ||
                          (text.includes("Morphemes") && text.includes("Syllables") && text.includes("Phonemes"));

      if (isBreakdown && currentDay >= 2) {
        // The focus word is typically a large-text heading — look for it
        // In the XML text dump, it appears before "Morphemes"
        const parts = text.split(/\|/);
        // Find the part that looks like a single word (the focus word heading)
        for (const part of parts) {
          const trimmed = part.trim().toLowerCase();
          // Focus word: single word, 4+ chars, not a label
          if (/^[a-z]{4,}$/.test(trimmed) &&
              !["morpheme", "morphemes", "syllable", "syllables", "phoneme", "phonemes",
                "breakdown", "meaning", "prefix", "suffix", "base", "root",
                "dictation", "sentence", "word"].includes(trimmed)) {
            if (currentDay === 2) day2Words.push(trimmed);
            if (currentDay === 3) day3Words.push(trimmed);
          }
        }
      }
    }

    // Check for word overlap
    const overlap = day2Words.filter(w => day3Words.includes(w));
    if (overlap.length > 0) {
      issues.push({
        type: "WORD_REUSE",
        detail: `Day 2/3 share words: ${[...new Set(overlap)].join(", ")}`,
      });
    }

    // Check T/F pattern from True or False slide
    for (const text of slideTexts) {
      if (text.includes("True or False")) {
        // Count TRUE and FALSE labels and their order
        const labels = [];
        const parts = text.split(/\|/);
        for (const p of parts) {
          const t = p.trim();
          if (t === "TRUE") labels.push("T");
          if (t === "FALSE") labels.push("F");
        }
        if (labels.length >= 4) {
          const pattern = labels.join("");
          if (pattern === "TFTTF" || pattern === "TFTFT" || pattern === "TTTFF" || pattern === "FFTTT") {
            issues.push({
              type: "TF_FIXED_ORDER",
              detail: `T/F pattern: ${pattern}`,
            });
          }
        }
        break;
      }
    }

  } catch (err) {
    issues.push({ type: "PARSE_ERROR", detail: err.message });
  }

  return { filename, issues };
}

// ============================================================
//  MAIN
// ============================================================
async function main() {
  const jsonCacheDir = path.join(OUTPUT_DIR, ".json-cache");

  const pptxFiles = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith(".pptx"))
    .map(f => path.join(OUTPUT_DIR, f))
    .sort();

  console.log(`\n=== Word Labs Deck Audit ===`);
  console.log(`Found ${pptxFiles.length} PPTX files\n`);

  // Check for JSON cache
  let useJson = false;
  let jsonFiles = [];
  if (fs.existsSync(jsonCacheDir)) {
    jsonFiles = fs.readdirSync(jsonCacheDir).filter(f => f.endsWith(".json"));
    if (jsonFiles.length > 0) {
      useJson = true;
      console.log(`Found ${jsonFiles.length} cached JSON files — using structured validation\n`);
    }
  }

  if (!useJson) {
    console.log("No JSON cache found — parsing PPTX files directly.");
    console.log("(Phoneme/syllable validation requires JSON cache — only word reuse + T/F order checked)\n");
  }

  const results = [];
  let issueCount = 0;
  const issueCounts = {};

  if (useJson) {
    for (const jf of jsonFiles.sort()) {
      const result = await auditFromJSON(path.join(jsonCacheDir, jf));
      results.push(result);
      if (result.issues.length > 0) {
        issueCount += result.issues.length;
        result.issues.forEach(i => { issueCounts[i.type] = (issueCounts[i.type] || 0) + 1; });
      }
    }
  } else {
    for (const pf of pptxFiles) {
      const result = await auditDeck(pf);
      results.push(result);
      if (result.issues.length > 0) {
        issueCount += result.issues.length;
        result.issues.forEach(i => { issueCounts[i.type] = (issueCounts[i.type] || 0) + 1; });
      }
    }
  }

  // Print results
  const withIssues = results.filter(r => r.issues.length > 0);
  const clean = results.filter(r => r.issues.length === 0);

  console.log(`\n=== Summary ===`);
  console.log(`Total decks: ${results.length}`);
  console.log(`Clean: ${clean.length}`);
  console.log(`With issues: ${withIssues.length}`);
  console.log(`Total issues: ${issueCount}`);
  if (Object.keys(issueCounts).length > 0) {
    console.log(`\nBy type:`);
    Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
  }

  if (withIssues.length > 0) {
    console.log(`\n=== Issues ===`);
    for (const r of withIssues) {
      console.log(`\n${r.filename}:`);
      r.issues.forEach(i => {
        console.log(`  [${i.type}] ${i.detail}`);
      });
    }
  }

  // Write list of decks needing regeneration
  const regenList = withIssues.map(r => {
    const base = r.filename.replace(".json", "").replace(".pptx", "");
    return base;
  });
  if (regenList.length > 0) {
    const regenPath = path.join(OUTPUT_DIR, "needs-regen.txt");
    fs.writeFileSync(regenPath, regenList.join("\n") + "\n");
    console.log(`\nRegeneration list written to: ${regenPath}`);
  }

  console.log("");
}

main().catch(console.error);
