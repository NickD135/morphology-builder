// Shared word source for the word-based worksheet generators
// (worksheet-breakdown, -rootlab, -analysis, -phoneme, -syllable).
//
// Every word, morpheme split, syllable split, phoneme split, meaning and sentence comes from
// word-study-data.js (window.WORD_STUDY_WORDS), the checked pool the games and slide decks use.
// That file is ~2.4 MB, so it is loaded here at runtime and only on the pages that include this
// script. Morpheme ids come from data.js (window.MORPHEMES) for labels and meanings.
//
// WSWords.ready()            -> Promise; resolves when the pool is loaded and indexed
// WSWords.all()              -> indexed entries (see makeEntry)
// WSWords.byWord(word)       -> entry or null
// WSWords.options(kind, fn)  -> morpheme options for 'prefix' | 'base' | 'suffix' with word counts
// WSWords.focusIndex(e, kind, key) -> index of the focus part in e.parts, or -1
// WSWords.select(pool, n, opts)    -> { words, widened } varied, shuffled pick
(function (root) {
  'use strict';

  var STAGES = ['s2e', 's2l', 's3e', 's3l', 's4'];
  var STAGE_YEAR = { s2e: 'Year 3', s2l: 'Year 4', s3e: 'Year 5', s3l: 'Year 6', s4: 'Year 7' };
  var SLOTS = ['prefix', 'base', 'suffix1', 'suffix2'];
  var INFL = { s: 1, es: 1, ed: 1, d: 1, ing: 1, est: 1 };

  // Year-level filter shared by the generators. Words outside the band are used only when the
  // band is too small, and the sheet says so.
  var LEVELS = {
    all: { label: 'Any level', min: 0, max: 4 },
    y34: { label: 'Years 3–4', min: 0, max: 1, preferCore: true },
    y56: { label: 'Years 5–6', min: 2, max: 3 },
    y7:  { label: 'Year 6–7 stretch', min: 3, max: 4 }
  };

  // Merged morphemes (same list as scripts/deck-accuracy/deck-list.json "forms"): spellings of one
  // morpheme that are taught together. A merge can take forms from the prefix or base slot.
  var MERGES = [
    { kind: 'base', key: 'move', label: 'move', forms: ['move', 'remove'] },
    { kind: 'base', key: 'dict', label: 'dic / dict', forms: ['dic', 'dict'] },
    { kind: 'base', key: 'struct', label: 'struct', forms: ['struct', 'structure'] },
    { kind: 'base', key: 'script', label: 'scrib / script', forms: ['scrib', 'script'] },
    { kind: 'base', key: 'spect', label: 'spec / spect', forms: ['spec', 'spect', 'spic'] },
    { kind: 'base', key: 'pend', label: 'pend / pens', forms: ['pend', 'pens'] },
    { kind: 'base', key: 'vis', label: 'vis / vid', forms: ['vis', 'vid'] },
    { kind: 'base', key: 'duct', label: 'duc / duct', forms: ['duc', 'duct'] },
    { kind: 'base', key: 'clos', label: 'clos / claus', forms: ['clos', 'claus'] },
    { kind: 'base', key: 'hydr', label: 'hydr / hydro', forms: ['hydr', 'hydro'] },
    { kind: 'base', key: 'therm', label: 'therm / thermo', forms: ['therm', 'thermo'] },
    { kind: 'base', key: 'phon', label: 'phon / phone', forms: ['phon', 'phone'] },
    { kind: 'base', key: 'chron', label: 'chron / chrono', forms: ['chron', 'chrono'] },
    { kind: 'base', key: 'grad', label: 'grad', forms: ['grad', 'graduate'] },
    { kind: 'prefix', key: 'micro', label: 'micro-', forms: ['micro'] },
    { kind: 'prefix', key: 'bio', label: 'bio-', forms: ['bio'] }
  ];
  var MERGE_BY_FORM = {};
  MERGES.forEach(function (m) { m.forms.forEach(function (f) { MERGE_BY_FORM[f] = m; }); });

  function kindOf(slot) { return /^suffix/.test(slot) ? 'suffix' : slot; }
  function stageRank(s) { var i = STAGES.indexOf(s); return i === -1 ? 2 : i; }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // ── data.js lookups ────────────────────────────────────────────
  var _info = null;
  function morphTables() {
    if (_info) return _info;
    var M = root.MORPHEMES || {};
    var t = { prefix: {}, suffix: {}, base: {} };
    (M.prefixes || []).forEach(function (m) { t.prefix[m.id] = t.prefix[m.id] || m; if (!t.prefix[m.form]) t.prefix[m.form] = m; });
    (M.suffixes || []).forEach(function (m) { t.suffix[m.id] = t.suffix[m.id] || m; if (!t.suffix[m.form]) t.suffix[m.form] = m; });
    // Bases: several entries can share a form; prefer a non-core entry with a meaning
    (M.bases || []).forEach(function (m) { var cur = t.base[m.form]; if (!cur || (!cur.meaning && m.meaning)) t.base[m.form] = m; });
    if ((M.prefixes || []).length) _info = t;
    return t;
  }
  function morphInfo(kind, form) { var t = morphTables(); return (t[kind] && t[kind][form]) || null; }

  // ── surface forms: how each part is spelled inside the word ────
  // Tries the spelling rules we can name (assimilated prefix, drop e, y to i, double the last
  // consonant, -le/-ble/-ic changes, -es). Returns { segs:[...], notes:[{idx,from,to,rule}] } or null.
  function segment(word, parts) {
    var target = word.toLowerCase();
    function dfs(i, segs, notes) {
      var S = segs.join('');
      if (i === parts.length) return S === target ? { segs: segs, notes: notes } : null;
      var p = parts[i], part = p.id.toLowerCase(), cands = [];
      if (i === 0) {
        cands.push({ segs: [part] });
        if (p.slot === 'prefix' && part.length > 1) {
          var seen = Object.create(null);
          var addA = function (a) {
            if (!a || a === part || seen[a]) return; seen[a] = 1;
            cands.push({ segs: [a], note: { idx: 0, from: part + '-', to: a + '-', rule: part + '- changes to ' + a + '- before ' + (target[a.length] || '') } });
          };
          var info = morphInfo('prefix', part);
          ((info && info.altForms) || []).forEach(addA);
          var c = target[part.length - 1];
          if (c && target[part.length] === c) addA(part.slice(0, -1) + c);
          addA(part.slice(0, -1));
        }
      } else {
        var prev = segs[segs.length - 1], head = segs.slice(0, -1), last = S.slice(-1);
        cands.push({ segs: segs.concat([part]) });
        if (last === 'e' && /^[aeiouy]/.test(part)) cands.push({ segs: head.concat([prev.slice(0, -1), part]), note: { idx: i - 1, from: prev, to: prev.slice(0, -1), rule: 'drop the e' } });
        if (last === 'y' && !/[aeiou]y$/.test(S) && part[0] !== 'i') cands.push({ segs: head.concat([prev.slice(0, -1) + 'i', part]), note: { idx: i - 1, from: prev, to: prev.slice(0, -1) + 'i', rule: 'y → i' } });
        if (/[bcdfgklmnprstvz]$/.test(S) && /^[aeiouy]/.test(part)) cands.push({ segs: head.concat([prev + last, part]), note: { idx: i - 1, from: prev, to: prev + last, rule: 'double the ' + last } });
        if (/le$/.test(prev) && part === 'ly') cands.push({ segs: head.concat([prev.slice(0, -2), 'ly']), note: { idx: i - 1, from: prev, to: prev.slice(0, -2), rule: 'drop the le before -ly' } });
        if (/ble$/.test(prev) && /^it/.test(part)) cands.push({ segs: head.concat([prev.slice(0, -3) + 'bil', part]), note: { idx: i - 1, from: prev, to: prev.slice(0, -3) + 'bil', rule: '-ble → -bil' } });
        if (/ic$/.test(prev) && part === 'ly') cands.push({ segs: segs.concat(['ally']), note: { idx: i, from: '-ly', to: '-ally', rule: '-ic + -ly → -ically' } });
        if (part === 's' && /(s|x|z|ch|sh)$/.test(S)) cands.push({ segs: segs.concat(['es']), note: { idx: i, from: '-s', to: '-es', rule: 'add -es after ' + S.match(/(s|x|z|ch|sh)$/)[0] } });
      }
      for (var k = 0; k < cands.length; k++) {
        var cd = cands[k], S2 = cd.segs.join('');
        if (i > 0 && !cd.segs[i]) continue;                     // a part that adds no letters
        if (i > 0 && cd.note && S.slice(-part.length) === part) continue;
        if (i === parts.length - 1 ? S2 !== target : target.indexOf(S2.slice(0, Math.max(0, S2.length - 3))) !== 0) continue;
        var r = dfs(i + 1, cd.segs, cd.note ? notes.concat([cd.note]) : notes);
        if (r) return r;
      }
      return null;
    }
    return dfs(0, [], []);
  }

  // A split digraph must keep a silent e: an e that a suffix has taken (located = l.o.c.a_e.t.d,
  // adviser, approves...) makes the phoneme answer wrong, so those words stay off phoneme keys.
  function phonemesOk(word, phonemes) {
    var w = word.toLowerCase(), letters = '', splitAt = {};
    phonemes.forEach(function (g) {
      if (/^[a-z]_e$/.test(g)) { splitAt[letters.length] = 1; letters += g[0]; }
      else letters += g;
    });
    var i = 0, j = 0, pending = 0, eAt = [];
    while (i < w.length) {
      if (j < letters.length && w[i] === letters[j]) { if (splitAt[j]) pending++; i++; j++; }
      else if (pending > 0 && w[i] === 'e') { eAt.push(i); pending--; i++; }
      else return false;
    }
    if (j !== letters.length || pending) return false;
    return eAt.every(function (k) { return !/^(d|r|rs|n|ns|st|ry|ries)$/.test(w.slice(k + 1)); });
  }

  // ── index ──────────────────────────────────────────────────────
  var _entries = null, _byWord = null, _ready = null;

  function makeEntry(w) {
    var m = w.morphemes || {};
    var parts = [];
    SLOTS.forEach(function (s) { if (m[s]) parts.push({ slot: s, kind: kindOf(s), id: m[s] }); });
    var seg = parts.length ? segment(w.word, parts) : null;
    var notes = [];
    parts.forEach(function (p, i) {
      p.surface = seg ? seg.segs[i] : p.id;
      p.meaning = (w.partMeanings && w.partMeanings[p.id]) || '';
    });
    if (seg) seg.notes.forEach(function (n) {
      notes.push(n.from + ' → ' + n.to + ' (' + n.rule + ')');
    });
    var get = function (k) { return parts.filter(function (p) { return p.slot === k; })[0] || null; };
    var pre = get('prefix'), base = get('base');
    var fam = parts.filter(function (p) { return !(p.kind === 'suffix' && INFL[p.id]); }).map(function (p) { return p.slot[0] + ':' + p.id; }).join('+');
    var suffixes = parts.filter(function (p) { return p.kind === 'suffix'; });
    return {
      word: w.word,
      ws: w,
      stage: w.stage,
      rank: stageRank(w.stage),
      band: w.band || 'core',
      parts: parts,
      notes: notes,
      ok: !!seg,
      stem: (pre ? pre.id : '') + '|' + (base ? base.id : ''),
      family: fam,
      inflOnly: !pre && suffixes.length > 0 && suffixes.every(function (p) { return INFL[p.id]; }),
      syllables: w.syllables || [],
      phonemes: w.phonemes || [],
      phonOk: !!(w.phonemes && w.phonemes.length) && phonemesOk(w.word, w.phonemes),
      sylOk: !!(w.syllables && w.syllables.length) && w.syllables.join('').toLowerCase() === w.word.toLowerCase()
    };
  }

  function build() {
    var src = root.WORD_STUDY_WORDS || [];
    _entries = [];
    _byWord = Object.create(null);
    src.forEach(function (w) {
      if (!w || !w.word) return;
      var e = makeEntry(w);
      _entries.push(e);
      _byWord[w.word.toLowerCase()] = e;
    });
    return _entries;
  }

  function ready() {
    if (_ready) return _ready;
    _ready = new Promise(function (resolve) {
      function done() { _info = null; resolve(build()); }
      if (root.WORD_STUDY_WORDS) return done();
      var sc = document.createElement('script');
      sc.src = 'word-study-data.js';
      sc.onload = done;
      sc.onerror = function () { root.WORD_STUDY_WORDS = root.WORD_STUDY_WORDS || []; done(); };
      document.head.appendChild(sc);
    });
    return _ready;
  }

  function all() { return _entries || []; }
  function byWord(word) { return _byWord ? (_byWord[String(word || '').toLowerCase()] || null) : null; }

  // ── morpheme options ───────────────────────────────────────────
  function keyFor(part) {
    if (part.kind !== 'suffix' && MERGE_BY_FORM[part.id]) {
      var m = MERGE_BY_FORM[part.id];
      return { kind: m.kind, key: m.key };
    }
    return { kind: part.kind, key: part.id };
  }

  // strict: the part must sit in the slot of its kind (a base-focus option only matches bases)
  function focusIndex(e, kind, key, strict) {
    for (var i = 0; i < e.parts.length; i++) {
      if (strict && e.parts[i].kind !== kind) continue;
      var k = keyFor(e.parts[i]);
      if (k.kind === kind && k.key === key) return i;
    }
    return -1;
  }

  // Returns [{ key, kind, label, meaning, group, stage, count }] sorted by label.
  function options(kind, filter, strict) {
    var map = Object.create(null);
    all().forEach(function (e) {
      if (filter && !filter(e)) return;
      var seenHere = Object.create(null);
      e.parts.forEach(function (p) {
        if (strict && p.kind !== kind) return;
        var k = keyFor(p);
        if (k.kind !== kind || seenHere[k.key]) return;
        seenHere[k.key] = 1;
        var o = map[k.key];
        if (!o) {
          var merge = MERGES.filter(function (m) { return m.key === k.key && m.kind === kind; })[0];
          var info = morphInfo(kind, k.key) || (kind === 'base' ? morphInfo('prefix', k.key) : null);
          var label = merge ? merge.label : info && info.display ? info.display
            : kind === 'prefix' ? k.key + '-' : kind === 'suffix' ? '-' + k.key : k.key;
          o = map[k.key] = {
            key: k.key, kind: kind, label: label,
            meaning: (info && info.meaning) || p.meaning || '',
            group: (info && info.group) || '',
            stage: info && info.stage ? info.stage : e.stage,
            count: 0, families: {}
          };
        }
        o.count++;
        o.families[e.family] = 1;
      });
    });
    return Object.keys(map).map(function (k) {
      var o = map[k]; o.familyCount = Object.keys(o.families).length; delete o.families; return o;
    }).sort(function (a, b) { return a.key.localeCompare(b.key); });
  }

  function optionInfo(kind, key) {
    var merge = MERGES.filter(function (m) { return m.key === key && m.kind === kind; })[0];
    var info = morphInfo(kind, key) || (kind === 'base' ? morphInfo('prefix', key) : null);
    return {
      key: key, kind: kind,
      label: merge ? merge.label : info && info.display ? info.display : kind === 'prefix' ? key + '-' : kind === 'suffix' ? '-' + key : key,
      meaning: (info && info.meaning) || '',
      group: (info && info.group) || '',
      stage: (info && info.stage) || ''
    };
  }

  // ── selection: varied, shuffled, level-aware ───────────────────
  // pool: entries; n: how many; opts: { level: key of LEVELS, preferCore, allowInfl }
  // Order of preference: words at the level, core before stretch (when preferCore), one per stem
  // (prefix + base), then one per word family, plain inflections (plays, played) last.
  function pickFrom(pool, n, opts, used) {
    var sh = shuffle(pool);
    if (opts.preferCore) sh = sh.filter(function (e) { return e.band === 'core'; }).concat(sh.filter(function (e) { return e.band !== 'core'; }));
    var out = [];
    function pass(cond) {
      for (var i = 0; i < sh.length && out.length < n; i++) {
        var e = sh[i];
        if (used.words[e.word]) continue;
        if (!cond(e)) continue;
        out.push(e);
        used.words[e.word] = 1; used.stems[e.stem] = 1; used.fams[e.family] = 1;
      }
    }
    var infl = function (e) { return opts.allowInfl || !e.inflOnly; };
    pass(function (e) { return !used.stems[e.stem] && !used.fams[e.family] && infl(e); });
    pass(function (e) { return !used.fams[e.family] && infl(e); });
    pass(function (e) { return !used.fams[e.family]; });
    pass(function () { return true; });
    return out;
  }

  function select(pool, n, opts) {
    opts = opts || {};
    var lv = LEVELS[opts.level || 'all'] || LEVELS.all;
    var preferCore = opts.preferCore != null ? opts.preferCore : !!lv.preferCore;
    var used = { words: {}, stems: {}, fams: {} };
    var o = { preferCore: preferCore, allowInfl: opts.allowInfl };
    pool = pool.filter(function (e) { return e.band !== 'rare'; });
    var inLevel = pool.filter(function (e) { return e.rank >= lv.min && e.rank <= lv.max; });
    var words = pickFrom(inLevel, n, o, used), widened = false;
    // Too few at this level: take the nearest levels next, one step out at a time.
    for (var step = 1; words.length < n && step <= 4; step++) {
      var ring = pool.filter(function (e) {
        return (e.rank === lv.min - step) || (e.rank === lv.max + step);
      });
      if (!ring.length) continue;
      var more = pickFrom(ring, n - words.length, o, used);
      if (more.length) { widened = true; words = words.concat(more); }
    }
    return { words: shuffle(words), widened: widened };
  }

  // ── display helpers ────────────────────────────────────────────
  // Split digraphs are stored a_e; on paper they read a–e (the two letters belong together).
  function showGrapheme(g) { return String(g).replace('_', '–'); }
  function showPhonemes(list, sep) { return list.map(showGrapheme).join(sep || ' / '); }
  function hasSplitDigraph(list) { return list.some(function (g) { return /_/.test(g); }); }

  // Puts ____ in place of the word (any capital kept) in one of its example sentences.
  function blankSentence(sentence, word) {
    var re = new RegExp('(^|[^A-Za-z])(' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![A-Za-z])', 'i');
    if (!re.test(sentence)) return null;
    return sentence.replace(re, '$1_______');
  }

  root.WSWords = {
    STAGES: STAGES, STAGE_YEAR: STAGE_YEAR, LEVELS: LEVELS, MERGES: MERGES,
    ready: ready, all: all, byWord: byWord,
    options: options, optionInfo: optionInfo, focusIndex: focusIndex,
    select: select, shuffle: shuffle,
    showGrapheme: showGrapheme, showPhonemes: showPhonemes, hasSplitDigraph: hasSplitDigraph,
    blankSentence: blankSentence, stageRank: stageRank,
    _segment: segment, _phonemesOk: phonemesOk, _build: build
  };
})(typeof window !== 'undefined' ? window : globalThis);
