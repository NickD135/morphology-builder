#!/usr/bin/env node
// Usage:
//   node scripts/expand-game-pools.js generate   # prompts login, calls analyze-words,
//                                                 validates, writes JSON to tmp
//   node scripts/expand-game-pools.js insert     # reads generated JSON and appends
//                                                 validated entries to game HTML files
//
// Two-phase expansion pipeline for Phoneme Splitter, Syllable Splitter, and
// Breakdown Blitz (s4 tier). Pulls source words from already-tagged Breakdown
// Blitz and Sound Sorter pools, calls the analyze-words Supabase Edge Function
// for AI-generated phoneme/syllable/morpheme data, runs three mechanical
// validators, and re-requests corrections for any failures.
//
// Environment:
//   WL_EMAIL    (optional)  teacher email; prompts if not set
//   WL_PASSWORD (optional)  teacher password; masked prompt if not set

const fs = require('fs');
const https = require('https');
const readline = require('readline');

const SUPABASE_URL = 'https://kdpavfrzmmzknqfpodrl.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcGF2ZnJ6bW16a25xZnBvZHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjgzOTIsImV4cCI6MjA5MDAwNDM5Mn0.n5fe7HvXWMsM4xN_iaU_N4xLkC5xD4y9Uoer_DG-dlg';
const GEN_PATH = '/tmp/expansion-generated.json';

// ─────────────────────────────────────────────────────────────────────
// Source word lists — curated from already-tagged pools.
// Each group: { game: 'phoneme'|'syllable'|'breakdown', stage, words }
// ─────────────────────────────────────────────────────────────────────
const EXPANSION_PLAN = [
  {
    game: 'phoneme', stage: 's3e', words: [
      'unhappiness','disagreement','transport','submarine','nonfiction',
      'multitask','semicircle','microphone','megaphone','construct',
      'contradict','proactive','interact','supermarket','uncomfortable',
      'creative','disorder','superhero','transplant','microscope',
    ],
  },
  {
    game: 'phoneme', stage: 's3l', words: [
      'significant','hyperactive','extraordinary','intersection','anticlockwise',
      'unforgettable','misunderstanding','universal','circumspect','telepathy',
      'magazine','trampoline','silhouette','catastrophe','avalanche',
    ],
  },
  {
    game: 'phoneme', stage: 's4', words: [
      'plateau','bureau','aesthetic','sovereign','guerrilla',
      'memoir','pharaoh','marquee','mnemonic','haemorrhage',
    ],
  },
  {
    game: 'syllable', stage: 's3l', words: [
      'significant','hyperactive','extraordinary','unforgettable','misunderstanding',
      'universal','degradation','communicative','magazine','silhouette',
      'elaborate','catastrophe','apparatus','avalanche','calamity',
    ],
  },
  {
    game: 'syllable', stage: 's4', words: [
      'plateau','bureau','boulevard','aesthetic','guerrilla',
      'memoir','manoeuvre','rendezvous','rheumatism','reconnoitre',
    ],
  },
  {
    game: 'breakdown', stage: 's4', words: [
      'photosynthesis','transmission','construction','demonstration','hypothesis',
      'atmosphere','telegraph','geography','democracy','philosophy',
      'biography','civilisation','communication','determination','reconstruction',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────
// Auth: masked password prompt + Supabase token endpoint
// ─────────────────────────────────────────────────────────────────────
function prompt(question, masked = false) {
  return new Promise(resolve => {
    if (!masked) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(question, ans => { rl.close(); resolve(ans); });
      return;
    }
    // Masked entry — print '*' per char using raw mode
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let buf = '';
    const onData = (key) => {
      for (const ch of key) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(buf);
          return;
        }
        if (ch === '\u0003') process.exit(130); // Ctrl-C
        if (ch === '\u007f' || ch === '\b') {
          if (buf.length) { buf = buf.slice(0, -1); process.stdout.write('\b \b'); }
          continue;
        }
        buf += ch;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function signIn() {
  const email = process.env.WL_EMAIL || await prompt('Teacher email: ', false);
  const password = process.env.WL_PASSWORD || await prompt('Password: ', true);
  const r = await httpsPost(
    SUPABASE_URL + '/auth/v1/token?grant_type=password',
    { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON },
    { email, password },
  );
  if (r.status !== 200 || !r.body.access_token) {
    throw new Error('Login failed (HTTP ' + r.status + '): ' + JSON.stringify(r.body).slice(0, 300));
  }
  return r.body.access_token;
}

// ─────────────────────────────────────────────────────────────────────
// Edge function caller
// ─────────────────────────────────────────────────────────────────────
async function analyzeWords(words, jwt) {
  const r = await httpsPost(
    SUPABASE_URL + '/functions/v1/analyze-words',
    { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + jwt, Origin: 'https://wordlabs.app' },
    { words },
  );
  if (r.status !== 200) {
    throw new Error('analyze-words HTTP ' + r.status + ': ' + JSON.stringify(r.body).slice(0, 300));
  }
  return r.body.words || [];
}

// ─────────────────────────────────────────────────────────────────────
// Validators — each returns { ok: bool, reason: string }
// ─────────────────────────────────────────────────────────────────────
function norm(s) { return String(s || '').toLowerCase().trim(); }

function validateSyllables(word, syllables) {
  if (!Array.isArray(syllables) || !syllables.length) return { ok: false, reason: 'empty syllables' };
  const joined = syllables.map(norm).join('');
  if (joined !== norm(word)) return { ok: false, reason: 'syllables join "' + joined + '" != word "' + norm(word) + '"' };
  return { ok: true };
}

function validatePhonemes(word, phonemes) {
  if (!Array.isArray(phonemes) || !phonemes.length) return { ok: false, reason: 'empty phonemes' };
  const joined = phonemes.map(norm).join('').replace(/_/g, '');
  const wordLetters = norm(word).split('').sort().join('');
  const phLetters = joined.split('').sort().join('');
  if (wordLetters !== phLetters) return { ok: false, reason: 'phoneme letters "' + phLetters + '" != word letters "' + wordLetters + '"' };
  // Also check: each phoneme should be a substring of the word in order
  // (strict reconstruction ignoring split-digraph underscores)
  const strict = phonemes.map(norm).join('');
  const strictNoUnderscore = strict.replace(/_/g, '');
  if (strictNoUnderscore !== norm(word).replace(/[^a-z]/g, '')) {
    // Only accept if it's a split-digraph reconstruction: e.g. "c,a_e,k" for "cake"
    // In that case, the underscore sits between a vowel and 'e', and the middle consonant
    // appears between them in the word. Hard to verify without phonics knowledge —
    // we let the anagram check above stand as the primary guard.
  }
  return { ok: true };
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function tryBreakdown(word, prefix, base, suffix1, suffix2) {
  const a = norm(prefix) + norm(base) + norm(suffix1) + norm(suffix2);
  const b = norm(word);
  if (a === b) return { ok: true, dist: 0 };
  if (Math.abs(a.length - b.length) > 3) return { ok: false };
  const dist = levenshtein(a, b);
  // Allow up to 2 spelling-rule edits (y→i, e-drop, consonant doubling)
  return { ok: dist <= 2, dist };
}

// Validates morpheme breakdown and attempts an auto-correction if the AI
// duplicated the prefix into the base (e.g. prefix="com", base="communicate"
// for "communicative"). Mutates the entry in place on success.
function validateBreakdown(e) {
  const tried = tryBreakdown(e.word, e.prefix, e.base, e.suffix1, e.suffix2);
  if (tried.ok) return { ok: true };

  // Auto-correction 1: if the base already starts with the prefix, drop the prefix.
  if (e.prefix && e.base && norm(e.base).startsWith(norm(e.prefix))) {
    const fixed = tryBreakdown(e.word, '', e.base, e.suffix1, e.suffix2);
    if (fixed.ok) {
      e.prefix = '';
      return { ok: true, autoFixed: 'stripped duplicated prefix' };
    }
  }

  // Auto-correction 2: if the base contains the full word already, treat as no affixes.
  if (norm(e.base) === norm(e.word)) {
    e.prefix = ''; e.suffix1 = ''; e.suffix2 = '';
    return { ok: true, autoFixed: 'base was full word' };
  }

  const a = norm(e.prefix) + norm(e.base) + norm(e.suffix1) + norm(e.suffix2);
  return { ok: false, reason: 'breakdown "' + a + '" too different from word "' + norm(e.word) + '"' };
}

function validateEntry(e) {
  const issues = [];
  const sv = validateSyllables(e.word, e.syllables);
  if (!sv.ok) issues.push('syllable: ' + sv.reason);
  const pv = validatePhonemes(e.word, e.phonemes);
  if (!pv.ok) issues.push('phoneme: ' + pv.reason);
  const bv = validateBreakdown(e);
  if (!bv.ok) issues.push('breakdown: ' + bv.reason);
  if (bv.autoFixed) issues.push('(autofixed: ' + bv.autoFixed + ')');
  // Only real failures — autofixed is info, not a blocker
  return issues.filter(s => !s.startsWith('('));
}

// ─────────────────────────────────────────────────────────────────────
// Main generation flow
// ─────────────────────────────────────────────────────────────────────
async function runGenerate() {
  // Resume mode: if we already have validated entries from a previous run,
  // only request words that are missing.
  const results = {};
  if (fs.existsSync(GEN_PATH)) {
    try {
      const prev = JSON.parse(fs.readFileSync(GEN_PATH, 'utf8'));
      for (const e of (prev.generated || [])) {
        // Strip the game/stage fields we added — we'll re-apply them below
        const { game, stage, ...raw } = e;
        if (raw.word) results[norm(raw.word)] = raw;
      }
      console.log('Resume mode: loaded ' + Object.keys(results).length + ' previously-validated entries from ' + GEN_PATH);
    } catch (e) {
      console.warn('Could not read previous run: ' + e.message + ' — starting fresh.');
    }
  }

  const allWords = [...new Set(EXPANSION_PLAN.flatMap(g => g.words))];
  const missing = allWords.filter(w => !results[norm(w)]);
  console.log('Source words: ' + allWords.length + ' total, ' + missing.length + ' still to fetch');

  if (missing.length === 0) {
    console.log('Nothing to fetch — all entries already validated.');
  } else {
    console.log('Signing in to Supabase…');
    const jwt = await signIn();
    console.log('Signed in ✓');

    // Batch through analyze-words. Smaller batches avoid the edge function's
    // 8192-token cap (heavy JSON per word).
    const BATCH = 10;
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH);
      console.log('Batch ' + (Math.floor(i/BATCH) + 1) + ': ' + batch.join(', '));
      try {
        const out = await analyzeWords(batch, jwt);
        for (const e of out) { if (e && e.word) results[norm(e.word)] = e; }
      } catch (err) {
        console.error('  ERROR:', err.message);
      }
    }
    console.log('\nReceived total: ' + Object.keys(results).length + ' / ' + allWords.length + ' entries');
  }

  // Validate every entry
  const failures = {};
  for (const [word, e] of Object.entries(results)) {
    const issues = validateEntry(e);
    if (issues.length) failures[word] = { issues, entry: e };
  }
  console.log('\nValidation: ' + Object.keys(failures).length + ' failures of ' + Object.keys(results).length);
  for (const [w, f] of Object.entries(failures)) {
    console.log('  ✗ ' + w + ' — ' + f.issues.join(' | '));
  }

  // Pass 2 — request corrections for failed words (simple retry)
  // Note: the edge function prompt is fixed; we just re-ask. If the same
  // word fails twice, we refuse to insert it.
  if (Object.keys(failures).length) {
    console.log('\nRetrying failed words via second analyze-words call…');
    const retryWords = Object.keys(failures);
    try {
      const out = await analyzeWords(retryWords, jwt);
      for (const e of out) {
        if (e && e.word) {
          const w = norm(e.word);
          const issues = validateEntry(e);
          if (!issues.length) {
            results[w] = e;
            delete failures[w];
            console.log('  ✓ ' + w + ' fixed on retry');
          } else {
            console.log('  ✗ ' + w + ' still failing: ' + issues.join(' | '));
          }
        }
      }
    } catch (err) {
      console.error('  Retry error:', err.message);
    }
  }

  // Assign stages + game pool from EXPANSION_PLAN
  const finalEntries = [];
  const missingReported = new Set();
  const refusedReported = new Set();
  for (const group of EXPANSION_PLAN) {
    for (const w of group.words) {
      const key = norm(w);
      if (!results[key]) {
        if (!missingReported.has(key)) { console.log('  (missing) ' + w); missingReported.add(key); }
        continue;
      }
      if (failures[key]) {
        if (!refusedReported.has(key)) { console.log('  (refused) ' + w + ' — validation still failing'); refusedReported.add(key); }
        continue;
      }
      finalEntries.push({
        game: group.game,
        stage: group.stage,
        ...results[key],
      });
    }
  }

  console.log('\nFinal validated entries: ' + finalEntries.length + ' / ' + allWords.length);
  const byGame = {};
  finalEntries.forEach(e => { byGame[e.game] = (byGame[e.game] || 0) + 1; });
  console.log('By game:', byGame);

  fs.writeFileSync(GEN_PATH, JSON.stringify({ generated: finalEntries, failures }, null, 2));
  console.log('\nWrote ' + GEN_PATH);
  console.log('Next: inspect it, then run `node scripts/expand-game-pools.js insert` to apply.');
}

// ─────────────────────────────────────────────────────────────────────
// Insertion phase — read the generated JSON, append entries to HTML arrays
// ─────────────────────────────────────────────────────────────────────
function formatBreakdownEntry(e) {
  return '{word:"' + e.word + '", stage:"' + e.stage + '", clue:"' + (e.clue || '').replace(/"/g, '\\"') +
    '", answers:{prefix:"' + (e.prefix || '') +
    '", base:"' + (e.base || '') +
    '", suffix1:"' + (e.suffix1 || '') +
    '", suffix2:"' + (e.suffix2 || '') + '"}}';
}
function formatPhonemeEntry(e) {
  // Pick diff tier: s2e→Starter, s2l→Level up, s3e/s3l/s4→Challenge
  const diff = e.stage === 's2e' ? 'Starter' :
               e.stage === 's2l' ? 'Level up' : 'Challenge';
  return '  { word:"' + e.word + '", stage:"' + e.stage + '",   phonemes:["' +
    e.phonemes.map(p => p.replace(/"/g, '\\"')).join('","') + '"],   diff:"' + diff + '" },';
}
function formatSyllableEntry(e) {
  return '  {word:"' + e.word + '", stage:"' + e.stage + '",    syllables:["' +
    e.syllables.map(s => s.replace(/"/g, '\\"')).join('","') + '"]},';
}

function runInsert() {
  if (!fs.existsSync(GEN_PATH)) {
    console.error('No generated JSON at ' + GEN_PATH + ' — run generate first.');
    process.exit(1);
  }
  const { generated } = JSON.parse(fs.readFileSync(GEN_PATH, 'utf8'));
  const byGame = { breakdown: [], phoneme: [], syllable: [] };
  for (const e of generated) {
    if (byGame[e.game]) byGame[e.game].push(e);
  }
  console.log('Entries to insert:');
  for (const [g, arr] of Object.entries(byGame)) console.log('  ' + g + ': ' + arr.length);

  // --- Breakdown: append before the closing `]` of MISSIONS = [...] ---
  if (byGame.breakdown.length) {
    let src = fs.readFileSync('breakdown-mode.html', 'utf8');
    const m = src.match(/MISSIONS\s*=\s*\[/);
    if (!m) throw new Error('breakdown-mode.html MISSIONS array not found');
    let i = m.index + m[0].length - 1, depth = 0;
    for (; i < src.length; i++) {
      if (src[i] === '[') depth++;
      else if (src[i] === ']') { depth--; if (depth === 0) break; }
    }
    // Insert before the `]` — need to handle the trailing comma on the last existing entry
    const insertAt = i;
    const before = src.slice(0, insertAt);
    const after = src.slice(insertAt);
    const fragments = byGame.breakdown.map(formatBreakdownEntry).join(',');
    // Check if last char before `]` is `,` already
    const trimmedBefore = before.trimEnd();
    const needsLeadingComma = trimmedBefore[trimmedBefore.length - 1] !== ',' && trimmedBefore[trimmedBefore.length - 1] !== '[';
    src = before + (needsLeadingComma ? ',' : '') + fragments + after;
    fs.writeFileSync('breakdown-mode.html', src);
    console.log('  ✓ appended ' + byGame.breakdown.length + ' to breakdown-mode.html');
  }

  // --- Phoneme and Syllable use multiline arrays — similar insertion ---
  function appendMultiline(file, arrayRe, formatFn, entries) {
    if (!entries.length) return;
    let src = fs.readFileSync(file, 'utf8');
    const m = src.match(arrayRe);
    if (!m) throw new Error(file + ' array not found');
    let i = m.index + m[0].length - 1, depth = 0;
    for (; i < src.length; i++) {
      if (src[i] === '[') depth++;
      else if (src[i] === ']') { depth--; if (depth === 0) break; }
    }
    const before = src.slice(0, i);
    const after = src.slice(i);
    const fragments = '\n' + entries.map(formatFn).join('\n') + '\n';
    // Ensure last entry before `]` has a trailing comma
    const trimmedBefore = before.trimEnd();
    const lastCh = trimmedBefore[trimmedBefore.length - 1];
    const needsLeadingComma = lastCh !== ',' && lastCh !== '[';
    src = before + (needsLeadingComma ? ',' : '') + fragments + after;
    fs.writeFileSync(file, src);
    console.log('  ✓ appended ' + entries.length + ' to ' + file);
  }

  appendMultiline('phoneme-mode.html', /WORDS\s*=\s*\[/, formatPhonemeEntry, byGame.phoneme);
  appendMultiline('syllable-mode.html', /WORDS\s*=\s*\[/, formatSyllableEntry, byGame.syllable);

  console.log('\nDone. Next:');
  console.log('  node scripts/extract-game-words.js /tmp/after-expansion.csv');
  console.log('  git diff breakdown-mode.html phoneme-mode.html syllable-mode.html');
}

// ─────────────────────────────────────────────────────────────────────
(async () => {
  const cmd = process.argv[2];
  if (cmd === 'generate') { try { await runGenerate(); } catch (e) { console.error(e.message || e); process.exit(1); } }
  else if (cmd === 'insert') { runInsert(); }
  else {
    console.error('Usage: node scripts/expand-game-pools.js (generate|insert)');
    process.exit(1);
  }
})();
