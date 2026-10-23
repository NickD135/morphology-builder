// ============================================================
//  WORD LABS — Client-Side Translated Deck Builder
//  Uses pptxgenjs in the browser to generate PPTX with EALD translations
//  Requires: <script src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"></script>
// ============================================================

var WLDeckBuilder = (function() {
  'use strict';

  // Theme colours (same as Node.js generator)
  var C = {
    indigo: '312e81', indigoMid: '4338ca', indigoLight: '6366f1', indigoSoft: 'eef2ff',
    teal: '0d9488', tealLight: 'ccfbf1',
    amber: 'd97706', amberLight: 'fef3c7',
    green: '16a34a', red: 'dc2626',
    white: 'FFFFFF', offWhite: 'f8fafc',
    slate: '475569', slateLight: 'e2e8f0', dark: '0f172a',
  };
  var FONT = 'Trebuchet MS';
  var FONT_BODY = 'Calibri';

  // Translation colour — a warm amber for translated text
  var T_COLOR = 'b45309';
  var T_BG = 'fffbeb';

  var DATA; // set per build

  // ── Type helpers ──
  function morphemeType() { return DATA.type || 'base'; }
  function morphemeLabel() {
    var t = morphemeType();
    return t === 'prefix' ? 'Prefix' : t === 'suffix' ? 'Suffix' : 'Root';
  }
  function morphemeDisplay() {
    var t = morphemeType();
    return t === 'prefix' ? "'" + DATA.morpheme + "-'" : t === 'suffix' ? "'-" + DATA.morpheme + "'" : "'" + DATA.morpheme + "'";
  }
  function matrixHeaders() {
    var t = morphemeType();
    if (t === 'prefix') return ['Prefix: ' + morphemeDisplay(), 'Base Words', 'Suffixes'];
    if (t === 'suffix') return ['Prefixes', 'Base Words', 'Suffix: ' + morphemeDisplay()];
    return ['Prefixes', morphemeDisplay(), 'Suffixes'];
  }
  function matrixCol0() {
    return morphemeType() === 'prefix' ? [DATA.morpheme] : DATA.prefixes;
  }
  function matrixCol1() {
    var t = morphemeType();
    return t === 'prefix' ? DATA.prefixes : t === 'suffix' ? DATA.suffixes : [DATA.morpheme];
  }
  function matrixCol2() {
    return morphemeType() === 'suffix' ? [DATA.morpheme] : DATA.suffixes;
  }
  function formatChip(text, colIdx) {
    var t = morphemeType();
    if (colIdx === 0) return t === 'prefix' ? DATA.morpheme + '-' : text + '-';
    if (colIdx === 2) return t === 'suffix' ? '-' + DATA.morpheme : '-' + text;
    return text;
  }

  // ── Slide helpers ──
  function makeShadow() {
    return { type: 'outer', color: '000000', blur: 8, offset: 3, angle: 135, opacity: 0.12 };
  }

  function slideHeader(slide, dayLabel, title) {
    slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.72, fill: { color: C.indigoMid }, line: { color: C.indigoMid } });
    slide.addShape('rect', { x: 0.3, y: 0.13, w: 1.1, h: 0.44, fill: { color: C.teal }, line: { color: C.teal }, rectRadius: 0.08 });
    slide.addText(dayLabel, { x: 0.3, y: 0.13, w: 1.1, h: 0.44, fontSize: 10, bold: true, color: C.white, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
    slide.addText(title, { x: 1.55, y: 0, w: 8.1, h: 0.72, fontSize: 16, bold: true, color: C.white, fontFace: FONT, align: 'left', valign: 'middle', margin: 0 });
    slide.addShape('rect', { x: 8.6, y: 0.1, w: 1.1, h: 0.5, fill: { color: C.indigo }, line: { color: C.indigoLight }, rectRadius: 0.1 });
    slide.addText("'" + DATA.morpheme + "'", { x: 8.6, y: 0.1, w: 1.1, h: 0.5, fontSize: 12, bold: true, color: C.indigoLight, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
  }

  function footer(slide) {
    slide.addShape('rect', { x: 0, y: 5.325, w: 10, h: 0.3, fill: { color: C.slateLight }, line: { color: C.slateLight } });
    slide.addText('Word Labs  \u2022  wordlabs.app  \u2022  ' + morphemeLabel() + ': ' + morphemeDisplay() + ' = ' + DATA.meaning, {
      x: 0, y: 5.325, w: 10, h: 0.3, fontSize: 8, color: C.slate, fontFace: FONT_BODY, align: 'center', valign: 'middle', margin: 0,
    });
  }

  function lightSlide(pres) {
    var slide = pres.addSlide();
    slide.background = { color: C.offWhite };
    return slide;
  }

  function sectionDivider(pres, dayLabel, sectionTitle, subtitle) {
    var slide = pres.addSlide();
    slide.background = { color: C.indigo };
    slide.addShape('rect', { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { color: C.teal } });
    slide.addShape('rect', { x: 0.5, y: 1.8, w: 1.2, h: 0.45, fill: { color: C.teal }, line: { color: C.teal }, rectRadius: 0.08 });
    slide.addText(dayLabel, { x: 0.5, y: 1.8, w: 1.2, h: 0.45, fontSize: 11, bold: true, color: C.white, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
    slide.addText(sectionTitle, { x: 0.5, y: 2.35, w: 9.2, h: 1.4, fontSize: 44, bold: true, color: C.white, fontFace: FONT, align: 'left', valign: 'top', margin: 0 });
    if (subtitle) {
      slide.addText(subtitle, { x: 0.5, y: 3.8, w: 9.0, h: 0.6, fontSize: 16, color: 'a5b4fc', fontFace: FONT_BODY, align: 'left', valign: 'top', margin: 0 });
    }
    slide.addShape('rect', { x: 0, y: 5.2, w: 10, h: 0.425, fill: { color: '0f172a' }, line: { color: '0f172a' } });
    slide.addText('Word Labs  \u2022  wordlabs.app', { x: 0, y: 5.2, w: 10, h: 0.425, fontSize: 10, color: '64748b', fontFace: FONT_BODY, align: 'center', valign: 'middle', margin: 0 });
  }

  function morphemeChip(slide, text, chipType, x, y, w, h) {
    var fills = { prefix: 'ddd6fe', base: C.tealLight, suffix: 'fce7f3', neutral: C.slateLight };
    var borders = { prefix: '7c3aed', base: C.teal, suffix: 'db2777', neutral: C.slate };
    var textColors = { prefix: '4c1d95', base: '0f766e', suffix: '9d174d', neutral: C.dark };
    slide.addShape('rect', { x: x, y: y, w: w, h: h, fill: { color: fills[chipType] }, line: { color: borders[chipType], width: 1.5 }, rectRadius: 0.08, shadow: makeShadow() });
    slide.addText(text, { x: x, y: y, w: w, h: h, fontSize: 13, bold: true, color: textColors[chipType], fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
  }

  // Helper: add small translation text below or beside English text
  function addTranslation(slide, text, x, y, w, h, opts) {
    if (!text) return;
    var defaults = { fontSize: 9, color: T_COLOR, italic: true, fontFace: FONT_BODY, align: 'left', valign: 'top', margin: 0 };
    var merged = {};
    for (var k in defaults) merged[k] = defaults[k];
    if (opts) for (var k2 in opts) merged[k2] = opts[k2];
    merged.x = x; merged.y = y; merged.w = w; merged.h = h;
    slide.addText(text, merged);
  }

  // ══════════════════════════════════════════════════════════════
  //  SLIDE BUILDERS (with translations)
  // ══════════════════════════════════════════════════════════════

  function addTitleSlide(pres, langName) {
    var slide = pres.addSlide();
    slide.background = { color: C.indigo };
    slide.addShape('rect', { x: 0, y: 0, w: 0.22, h: 5.625, fill: { color: C.teal }, line: { color: C.teal } });
    slide.addShape('rect', { x: 0, y: 4.3, w: 10, h: 1.325, fill: { color: '0f172a' }, line: { color: '0f172a' } });

    slide.addText('WORD LABS', { x: 0.5, y: 0.55, w: 9, h: 0.55, fontSize: 13, bold: true, color: C.teal, charSpacing: 8, fontFace: FONT, align: 'left', valign: 'middle', margin: 0 });
    slide.addText(morphemeLabel() + ': ' + morphemeDisplay(), { x: 0.5, y: 1.1, w: 9, h: 1.2, fontSize: 56, bold: true, color: C.white, fontFace: FONT, align: 'left', valign: 'top', margin: 0 });

    // English meaning + translation
    slide.addText('"' + DATA.meaning + '"', { x: 0.5, y: 2.35, w: 9, h: 0.5, fontSize: 22, color: 'a5b4fc', italic: true, fontFace: FONT_BODY, align: 'left', valign: 'middle', margin: 0 });
    if (DATA.t_meaning) {
      slide.addText('\ud83c\udf10 ' + DATA.t_meaning, { x: 0.5, y: 2.85, w: 9, h: 0.4, fontSize: 16, color: 'fbbf24', italic: true, fontFace: FONT_BODY, align: 'left', valign: 'middle', margin: 0 });
    }

    slide.addText('Origin: ' + DATA.origin, { x: 0.5, y: 3.3, w: 5, h: 0.35, fontSize: 13, color: '6366f1', fontFace: FONT_BODY, align: 'left', valign: 'middle', margin: 0 });

    // EALD badge
    slide.addShape('rect', { x: 5.5, y: 4.5, w: 4.2, h: 0.8, fill: { color: '1e1b4b' }, line: { color: C.indigoLight }, rectRadius: 0.1 });
    slide.addText('\ud83c\udf10 EALD Translation: ' + langName, { x: 5.5, y: 4.5, w: 4.2, h: 0.8, fontSize: 12, bold: true, color: 'fbbf24', fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });

    // Day overview
    var days = ['Day 1 \u2014 Morpheme Meaning', 'Day 2 \u2014 Dictation & Breakdown', 'Day 3 \u2014 Dictation & Word Matrix'];
    slide.addShape('rect', { x: 0.5, y: 3.72, w: 4.4, h: 0.38, fill: { color: C.teal }, line: { color: C.teal }, rectRadius: 0.06 });
    slide.addText(days[0], { x: 0.5, y: 3.72, w: 4.4, h: 0.38, fontSize: 11, bold: true, color: C.white, fontFace: FONT_BODY, align: 'center', valign: 'middle', margin: 0 });
    slide.addShape('rect', { x: 0.5, y: 4.14, w: 4.4, h: 0.38, fill: { color: '1e1b4b' }, line: { color: C.indigoLight }, rectRadius: 0.06 });
    slide.addText(days[1], { x: 0.5, y: 4.14, w: 4.4, h: 0.38, fontSize: 11, color: 'a5b4fc', fontFace: FONT_BODY, align: 'center', valign: 'middle', margin: 0 });
    slide.addShape('rect', { x: 0.5, y: 4.56, w: 4.4, h: 0.38, fill: { color: '1e1b4b' }, line: { color: C.indigoLight }, rectRadius: 0.06 });
    slide.addText(days[2], { x: 0.5, y: 4.56, w: 4.4, h: 0.38, fontSize: 11, color: 'a5b4fc', fontFace: FONT_BODY, align: 'center', valign: 'middle', margin: 0 });
  }

  function addLearningIntention(pres) {
    var slide = lightSlide(pres);
    slideHeader(slide, 'Day 1', 'Learning Intention & Success Criteria');
    footer(slide);
    slide.addShape('rect', { x: 0.4, y: 0.9, w: 9.2, h: 1.35, fill: { color: C.indigoSoft }, line: { color: C.indigoLight }, rectRadius: 0.1, shadow: makeShadow() });
    slide.addText('We are learning that the ' + morphemeLabel().toLowerCase() + ' ' + morphemeDisplay() + " means '" + DATA.meaning + "'.", {
      x: 0.55, y: 0.95, w: 8.9, h: 0.7, fontSize: 20, bold: true, color: C.indigoMid, fontFace: FONT, align: 'left', valign: 'middle',
    });
    if (DATA.t_meaning) {
      addTranslation(slide, '\ud83c\udf10 ' + morphemeDisplay() + ' = ' + DATA.t_meaning, 0.55, 1.65, 8.9, 0.4, { fontSize: 14, color: T_COLOR });
    }
    slide.addText('Success Criteria', { x: 0.4, y: 2.4, w: 9.2, h: 0.4, fontSize: 14, bold: true, color: C.dark, fontFace: FONT, align: 'left', valign: 'middle', margin: 0 });
    var criteria = [
      'I can explain the meaning of the ' + morphemeLabel().toLowerCase() + ' ' + morphemeDisplay() + '.',
      'I can use ' + (morphemeType() === 'base' ? 'prefixes and suffixes' : 'base words and other morphemes') + ' to build and decode ' + morphemeDisplay() + ' words.',
      'I can read and spell ' + morphemeDisplay() + ' words effectively in sentences.',
    ];
    criteria.forEach(function(c, i) {
      slide.addShape('rect', { x: 0.4, y: 2.88 + i * 0.72, w: 0.42, h: 0.42, fill: { color: C.tealLight }, line: { color: C.teal }, rectRadius: 0.06 });
      slide.addText('\u2713', { x: 0.4, y: 2.88 + i * 0.72, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: C.teal, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
      slide.addText(c, { x: 0.92, y: 2.88 + i * 0.72, w: 8.6, h: 0.42, fontSize: 14, color: C.dark, fontFace: FONT_BODY, align: 'left', valign: 'middle' });
    });
  }

  function addRootMeaningSlide(pres) {
    var slide = lightSlide(pres);
    slideHeader(slide, 'Day 1', morphemeLabel() + ' ' + morphemeDisplay() + ' \u2014 Meaning & Origin');
    footer(slide);
    // Central meaning card
    slide.addShape('rect', { x: 0.4, y: 0.85, w: 9.2, h: 1.5, fill: { color: C.teal }, line: { color: C.teal }, rectRadius: 0.12, shadow: makeShadow() });
    slide.addText("'" + DATA.morpheme + "'", { x: 0.4, y: 0.85, w: 3.2, h: 1.0, fontSize: 48, bold: true, color: C.white, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
    slide.addShape('rect', { x: 3.55, y: 0.85, w: 0.04, h: 1.5, fill: { color: '312e81' }, line: { color: '312e81' } });
    slide.addText(DATA.meaning, { x: 3.75, y: 0.85, w: 4.0, h: 0.8, fontSize: 20, bold: true, color: C.white, fontFace: FONT, align: 'left', valign: 'middle' });
    // Translation of meaning
    if (DATA.t_meaning) {
      slide.addText('\ud83c\udf10 ' + DATA.t_meaning, { x: 3.75, y: 1.6, w: 4.0, h: 0.45, fontSize: 14, color: 'fef08a', italic: true, fontFace: FONT_BODY, align: 'left', valign: 'middle' });
    }
    slide.addText('Origin: ' + DATA.origin, { x: 7.8, y: 0.85, w: 1.75, h: 1.5, fontSize: 11, color: '99f6e4', italic: true, fontFace: FONT_BODY, align: 'center', valign: 'middle' });

    // Example words with translations
    slide.addText('Words using this ' + morphemeLabel().toLowerCase() + ':', { x: 0.4, y: 2.55, w: 9.2, h: 0.38, fontSize: 13, bold: true, color: C.dark, fontFace: FONT, align: 'left', valign: 'middle', margin: 0 });
    var words = DATA.examples.slice(0, 7);
    words.forEach(function(ex, i) {
      var col = i % 4;
      var row = Math.floor(i / 4);
      var x = 0.4 + col * 2.35;
      var y = 3.0 + row * 1.0;
      slide.addShape('rect', { x: x, y: y, w: 2.2, h: 0.48, fill: { color: C.indigoSoft }, line: { color: C.indigoLight }, rectRadius: 0.08 });
      slide.addText(ex.word, { x: x, y: y, w: 2.2, h: 0.48, fontSize: 13, bold: true, color: C.indigoMid, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
      if (ex.t_word) {
        slide.addText(ex.t_word, { x: x, y: y + 0.48, w: 2.2, h: 0.32, fontSize: 9, color: T_COLOR, italic: true, fontFace: FONT_BODY, align: 'center', valign: 'top', margin: 0 });
      }
    });
  }

  function addDefinitionsSlide(pres) {
    var slide = lightSlide(pres);
    slideHeader(slide, 'Day 1', "'" + DATA.morpheme + "' Word Definitions");
    footer(slide);
    slide.addText('Match the word to its meaning:', { x: 0.4, y: 0.82, w: 9.2, h: 0.4, fontSize: 13, color: C.slate, fontFace: FONT_BODY, align: 'left', valign: 'middle' });

    var shown = DATA.examples.slice(0, 6);
    shown.forEach(function(ex, i) {
      var y = 1.3 + i * 0.68;
      // Word chip
      slide.addShape('rect', { x: 0.4, y: y, w: 2.0, h: 0.36, fill: { color: C.indigoSoft }, line: { color: C.indigoLight }, rectRadius: 0.06, shadow: makeShadow() });
      slide.addText(ex.word, { x: 0.4, y: y, w: 2.0, h: 0.36, fontSize: 11, bold: true, color: C.indigoMid, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
      // Translation of word below chip
      if (ex.t_word) {
        slide.addText(ex.t_word, { x: 0.4, y: y + 0.36, w: 2.0, h: 0.24, fontSize: 8, color: T_COLOR, italic: true, fontFace: FONT_BODY, align: 'center', valign: 'top', margin: 0 });
      }
      // Definition
      slide.addShape('rect', { x: 2.5, y: y, w: 5.2, h: 0.36, fill: { color: C.offWhite }, line: { color: C.slateLight }, rectRadius: 0.06 });
      slide.addText(ex.definition, { x: 2.6, y: y, w: 5.0, h: 0.36, fontSize: 11, color: C.dark, fontFace: FONT_BODY, align: 'left', valign: 'middle' });
      // Translation of definition
      if (ex.t_definition) {
        slide.addText('\ud83c\udf10 ' + ex.t_definition, { x: 2.6, y: y + 0.36, w: 5.0, h: 0.24, fontSize: 8, color: T_COLOR, italic: true, fontFace: FONT_BODY, align: 'left', valign: 'top', margin: 0 });
      }
    });
  }

  function addTrueFalseSlide(pres) {
    var slide = lightSlide(pres);
    slideHeader(slide, 'Day 1', 'True or False?');
    footer(slide);
    slide.addText('Are the following statements true or false?', { x: 0.4, y: 0.8, w: 9.2, h: 0.45, fontSize: 14, color: C.slate, fontFace: FONT_BODY, align: 'left', valign: 'middle' });
    (DATA.trueOrFalse || []).forEach(function(item, i) {
      var y = 1.32 + i * 0.76;
      slide.addShape('rect', { x: 0.4, y: y, w: 8.0, h: 0.62, fill: { color: C.offWhite }, line: { color: C.slateLight }, rectRadius: 0.08, shadow: makeShadow() });
      slide.addText((i + 1) + '.  ' + item.statement, { x: 0.6, y: y, w: 7.6, h: 0.62, fontSize: 13, color: C.dark, fontFace: FONT_BODY, align: 'left', valign: 'middle' });
      slide.addShape('rect', { x: 8.5, y: y, w: 1.1, h: 0.62, fill: { color: item.answer ? 'dcfce7' : 'fee2e2' }, line: { color: item.answer ? C.green : C.red }, rectRadius: 0.08 });
      slide.addText(item.answer ? 'TRUE' : 'FALSE', { x: 8.5, y: y, w: 1.1, h: 0.62, fontSize: 11, bold: true, color: item.answer ? C.green : C.red, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
    });
  }

  function addWordMatrixSlide(pres) {
    var slide = lightSlide(pres);
    slideHeader(slide, 'Day 1', 'Word Matrix \u2014 Build with ' + morphemeDisplay());
    footer(slide);
    slide.addText('Use the matrix below. Choose morpheme parts to build a word. Not all combinations work!', { x: 0.4, y: 0.82, w: 9.2, h: 0.44, fontSize: 12, color: C.slate, fontFace: FONT_BODY, align: 'left', valign: 'middle' });
    var colW = [1.6, 1.8, 1.6]; var colX = [0.7, 3.6, 6.5];
    var headers = matrixHeaders();
    var headerColors = ['7c3aed', C.teal, 'db2777'];
    var chipFills = ['ddd6fe', C.tealLight, 'fce7f3'];
    var chipTexts = ['4c1d95', '0f766e', '9d174d'];
    var col0 = matrixCol0(); var col1 = matrixCol1(); var col2 = matrixCol2();
    headers.forEach(function(h, i) {
      slide.addShape('rect', { x: colX[i], y: 1.35, w: colW[i], h: 0.5, fill: { color: headerColors[i] }, line: { color: headerColors[i] }, rectRadius: 0.06 });
      slide.addText(h, { x: colX[i], y: 1.35, w: colW[i], h: 0.5, fontSize: 12, bold: true, color: C.white, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
    });
    var rows = Math.max(col0.length, col1.length, col2.length);
    for (var r = 0; r < rows; r++) {
      var y = 1.92 + r * 0.5;
      var bg = r % 2 === 0 ? C.offWhite : 'f1f5f9';
      slide.addShape('rect', { x: colX[0], y: y, w: colW[0], h: 0.46, fill: { color: r < col0.length ? chipFills[0] : bg }, line: { color: 'e5e7eb' } });
      if (r < col0.length) slide.addText(formatChip(col0[r], 0), { x: colX[0], y: y, w: colW[0], h: 0.46, fontSize: 13, bold: true, color: chipTexts[0], fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
      slide.addShape('rect', { x: colX[1], y: y, w: colW[1], h: 0.46, fill: { color: r < col1.length ? chipFills[1] : bg }, line: { color: 'e5e7eb' } });
      if (r < col1.length) slide.addText(col1[r], { x: colX[1], y: y, w: colW[1], h: 0.46, fontSize: 13, bold: true, color: chipTexts[1], fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
      slide.addShape('rect', { x: colX[2], y: y, w: colW[2], h: 0.46, fill: { color: r < col2.length ? chipFills[2] : bg }, line: { color: 'e5e7eb' } });
      if (r < col2.length) slide.addText(formatChip(col2[r], 2), { x: colX[2], y: y, w: colW[2], h: 0.46, fontSize: 13, bold: true, color: chipTexts[2], fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
    }
  }

  function addSentencesSlide(pres) {
    var slide = lightSlide(pres);
    slideHeader(slide, 'Day 1', 'Using ' + morphemeDisplay() + ' Words in Sentences');
    footer(slide);
    slide.addText('Read these example sentences. Underline the ' + morphemeDisplay() + ' word and discuss its meaning.', { x: 0.4, y: 0.82, w: 9.2, h: 0.44, fontSize: 13, color: C.slate, fontFace: FONT_BODY, align: 'left', valign: 'middle' });
    (DATA.day1Sentences || []).forEach(function(s, i) {
      var y = 1.38 + i * 1.32;
      slide.addShape('rect', { x: 0.4, y: y, w: 9.2, h: 1.1, fill: { color: C.offWhite }, line: { color: C.slateLight }, rectRadius: 0.1, shadow: makeShadow() });
      slide.addShape('rect', { x: 0.4, y: y, w: 0.55, h: 1.1, fill: { color: C.indigoMid }, line: { color: C.indigoMid }, rectRadius: 0.1 });
      slide.addShape('rect', { x: 0.78, y: y, w: 0.1, h: 1.1, fill: { color: C.indigoMid }, line: { color: C.indigoMid } });
      slide.addText('' + (i + 1), { x: 0.4, y: y, w: 0.55, h: 1.1, fontSize: 20, bold: true, color: C.white, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
      slide.addText(s, { x: 1.05, y: y + 0.05, w: 8.35, h: 1.0, fontSize: 15, color: C.dark, fontFace: FONT_BODY, align: 'left', valign: 'middle' });
    });
  }

  // ── Dictation slides ──
  function addDictationListenSlide(pres, day, dictData) {
    var slide = lightSlide(pres);
    slideHeader(slide, 'Day ' + day, 'Dictation \u2014 Listen & Write');
    footer(slide);
    slide.addShape('rect', { x: 0.4, y: 0.85, w: 9.2, h: 0.58, fill: { color: C.amberLight }, line: { color: C.amber }, rectRadius: 0.08 });
    slide.addText('\ud83d\udce2  Teacher reads aloud. Students write the sentence in their books.', { x: 0.55, y: 0.85, w: 9.0, h: 0.58, fontSize: 13, bold: true, color: '92400e', fontFace: FONT_BODY, align: 'left', valign: 'middle' });
    for (var i = 0; i < 3; i++) {
      slide.addShape('line', { x: 0.4, y: 1.75 + i * 0.65, w: 9.2, h: 0, line: { color: C.slateLight, width: 1.5 } });
    }
    var wCount = dictData.words.length;
    var pCount = dictData.punctuationCount || 0;
    slide.addShape('rect', { x: 2.2, y: 4.18, w: 2.5, h: 0.72, fill: { color: C.indigoSoft }, line: { color: C.indigoLight }, rectRadius: 0.1, shadow: makeShadow() });
    slide.addText([
      { text: '' + wCount, options: { fontSize: 28, bold: true, color: C.indigoMid, breakLine: false } },
      { text: '  focus word' + (wCount > 1 ? 's' : ''), options: { fontSize: 12, color: C.slate, breakLine: false } },
    ], { x: 2.2, y: 4.18, w: 2.5, h: 0.72, fontFace: FONT, align: 'center', valign: 'middle' });
    slide.addShape('rect', { x: 5.3, y: 4.18, w: 2.5, h: 0.72, fill: { color: C.amberLight }, line: { color: C.amber }, rectRadius: 0.1, shadow: makeShadow() });
    slide.addText([
      { text: '' + pCount, options: { fontSize: 28, bold: true, color: '92400e', breakLine: false } },
      { text: '  punctuation', options: { fontSize: 12, color: C.slate, breakLine: false } },
    ], { x: 5.3, y: 4.18, w: 2.5, h: 0.72, fontFace: FONT, align: 'center', valign: 'middle' });
  }

  function addDictationRevealSlide(pres, day, dictData) {
    var slide = lightSlide(pres);
    slideHeader(slide, 'Day ' + day, 'Dictation \u2014 Reveal & Underline');
    footer(slide);
    slide.addText('Check your sentence. Underline the focus words.', { x: 0.4, y: 0.82, w: 9.2, h: 0.4, fontSize: 13, color: C.slate, fontFace: FONT_BODY, align: 'left', valign: 'middle' });
    slide.addShape('rect', { x: 0.4, y: 1.3, w: 9.2, h: 1.4, fill: { color: C.offWhite }, line: { color: C.slateLight }, rectRadius: 0.12, shadow: makeShadow() });
    slide.addText(dictData.sentence, { x: 0.6, y: 1.38, w: 8.8, h: 1.24, fontSize: 18, fontFace: FONT_BODY, color: C.dark, align: 'left', valign: 'middle' });

    // Focus word boxes with translations
    var wordCount = dictData.words.length;
    var boxW = Math.min(2.8, 8.8 / wordCount - 0.2);
    var startX = (10 - wordCount * (boxW + 0.3)) / 2;
    dictData.words.forEach(function(w, i) {
      var x = startX + i * (boxW + 0.3);
      slide.addShape('rect', { x: x, y: 2.9, w: boxW, h: 1.2, fill: { color: C.offWhite }, line: { color: C.slateLight, width: 1 }, rectRadius: 0.08 });
      slide.addText(w.word, { x: x, y: 2.9, w: boxW, h: 0.55, fontSize: 14, bold: true, color: C.teal, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
      if (w.t_word) {
        slide.addText('\ud83c\udf10 ' + w.t_word, { x: x, y: 3.45, w: boxW, h: 0.35, fontSize: 10, color: T_COLOR, italic: true, fontFace: FONT_BODY, align: 'center', valign: 'middle', margin: 0 });
      }
      slide.addText('write your breakdown below', { x: x, y: 3.78, w: boxW, h: 0.3, fontSize: 9, color: C.slate, italic: true, fontFace: FONT_BODY, align: 'center', valign: 'middle', margin: 0 });
    });
  }

  function addBreakdownSlides(pres, day, dictData) {
    dictData.words.forEach(function(wordData, wi) {
      ['attempt', 'morphemes', 'syllables', 'phonemes'].forEach(function(step) {
        var slide = lightSlide(pres);
        var stepLabels = {
          attempt: 'Breakdown \u2014 Attempt (Word ' + (wi + 1) + ' of ' + dictData.words.length + ')',
          morphemes: 'Breakdown \u2014 Morphemes Revealed',
          syllables: 'Breakdown \u2014 + Syllables',
          phonemes: 'Breakdown \u2014 + Phonemes',
        };
        slideHeader(slide, 'Day ' + day, stepLabels[step]);
        footer(slide);

        // Instruction banner
        var instructions = {
          attempt: 'Write the morpheme breakdown, syllables, and phonemes for this word.',
          morphemes: '\u2713 Check your morpheme breakdown. Morphemes are the meaningful parts.',
          syllables: '\u2713 Now check your syllable split. Syllables are the beats in the word.',
          phonemes: '\u2713 Now check your phonemes. Phonemes are the individual sounds.',
        };
        var bannerFill = { attempt: C.amberLight, morphemes: 'ddd6de', syllables: C.tealLight, phonemes: 'fce7f3' };
        var bannerBorder = { attempt: C.amber, morphemes: '7c3aed', syllables: C.teal, phonemes: 'db2777' };
        var bannerTextC = { attempt: '92400e', morphemes: '4c1d95', syllables: '0f766e', phonemes: '9d174d' };
        slide.addShape('rect', { x: 0.4, y: 0.82, w: 9.2, h: 0.52, fill: { color: bannerFill[step] }, line: { color: bannerBorder[step] }, rectRadius: 0.08 });
        slide.addText(instructions[step], { x: 0.55, y: 0.82, w: 9.0, h: 0.52, fontSize: 12, bold: step !== 'attempt', color: bannerTextC[step], fontFace: FONT_BODY, align: 'left', valign: 'middle' });

        // Focus word
        slide.addShape('rect', { x: 3.0, y: 1.45, w: 4.0, h: 0.7, fill: { color: C.indigoMid }, line: { color: C.indigoMid }, rectRadius: 0.1, shadow: makeShadow() });
        slide.addText(wordData.word, { x: 3.0, y: 1.45, w: 4.0, h: 0.7, fontSize: 26, bold: true, color: C.white, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
        if (wordData.t_word) {
          slide.addText('\ud83c\udf10 ' + wordData.t_word, { x: 3.0, y: 2.15, w: 4.0, h: 0.3, fontSize: 11, color: T_COLOR, italic: true, fontFace: FONT_BODY, align: 'center', valign: 'top', margin: 0 });
        }

        // Morphemes row
        var rowY = 2.55;
        slide.addShape('rect', { x: 0.4, y: rowY, w: 1.5, h: 0.8, fill: { color: C.slateLight }, line: { color: C.slateLight }, rectRadius: 0.06 });
        slide.addText('Morphemes', { x: 0.4, y: rowY, w: 1.5, h: 0.8, fontSize: 11, bold: true, color: C.slate, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
        if (step !== 'attempt' && wordData.morphemes) {
          var n = wordData.morphemes.length;
          var chipW = Math.min(2.0, 7.4 / n - 0.12);
          var gap = (7.4 - n * chipW) / (n + 1);
          wordData.morphemes.forEach(function(m, mi) {
            var cx = 2.08 + gap + mi * (chipW + gap);
            var chipType = m.part === DATA.morpheme ? 'base' : mi === 0 ? 'prefix' : 'suffix';
            morphemeChip(slide, m.part, chipType, cx, rowY + 0.02, chipW, 0.32);
            var meaningText = m.meaning + (m.t_meaning ? ' (' + m.t_meaning + ')' : '');
            slide.addText(meaningText, { x: cx, y: rowY + 0.36, w: chipW, h: 0.28, fontSize: 8, color: C.slate, fontFace: FONT_BODY, align: 'center', valign: 'top', margin: 0 });
            if (m.note) slide.addText(m.note, { x: cx, y: rowY + 0.6, w: chipW, h: 0.18, fontSize: 7, color: '94a3b8', italic: true, fontFace: FONT_BODY, align: 'center', valign: 'top', margin: 0 });
          });
        } else {
          slide.addShape('rect', { x: 2.05, y: rowY, w: 7.55, h: 0.8, fill: { color: C.offWhite }, line: { color: C.slateLight, dashType: 'dash' }, rectRadius: 0.06 });
          slide.addText('Write here...', { x: 2.05, y: rowY, w: 7.55, h: 0.8, fontSize: 11, color: 'cbd5e1', italic: true, fontFace: FONT_BODY, align: 'center', valign: 'middle' });
        }

        // Syllables row
        var sylY = 3.48;
        slide.addShape('rect', { x: 0.4, y: sylY, w: 1.5, h: 0.6, fill: { color: C.slateLight }, line: { color: C.slateLight }, rectRadius: 0.06 });
        slide.addText('Syllables', { x: 0.4, y: sylY, w: 1.5, h: 0.6, fontSize: 11, bold: true, color: C.slate, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
        if ((step === 'syllables' || step === 'phonemes') && wordData.syllables) {
          var parts = wordData.syllables.split('/');
          var sn = parts.length;
          var sw = Math.min(1.8, 7.2 / sn - 0.1);
          var sg = (7.2 - sn * sw) / (sn + 1);
          slide.addShape('rect', { x: 2.05, y: sylY, w: 7.55, h: 0.6, fill: { color: C.tealLight }, line: { color: C.teal }, rectRadius: 0.06 });
          parts.forEach(function(p, pi) {
            var sx = 2.08 + sg + pi * (sw + sg);
            slide.addShape('rect', { x: sx, y: sylY + 0.06, w: sw, h: 0.48, fill: { color: C.white }, line: { color: C.teal }, rectRadius: 0.05 });
            slide.addText(p, { x: sx, y: sylY + 0.06, w: sw, h: 0.48, fontSize: 14, bold: true, color: C.teal, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
          });
        } else {
          slide.addShape('rect', { x: 2.05, y: sylY, w: 7.55, h: 0.6, fill: { color: C.offWhite }, line: { color: C.slateLight, dashType: 'dash' }, rectRadius: 0.06 });
          slide.addText('Write here...', { x: 2.05, y: sylY, w: 7.55, h: 0.6, fontSize: 11, color: 'cbd5e1', italic: true, fontFace: FONT_BODY, align: 'center', valign: 'middle' });
        }

        // Phonemes row
        var phY = 4.2;
        slide.addShape('rect', { x: 0.4, y: phY, w: 1.5, h: 0.7, fill: { color: C.slateLight }, line: { color: C.slateLight }, rectRadius: 0.06 });
        slide.addText('Phonemes', { x: 0.4, y: phY, w: 1.5, h: 0.7, fontSize: 11, bold: true, color: C.slate, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
        if (step === 'phonemes' && wordData.phonemes) {
          var phonemes = Array.isArray(wordData.phonemes) ? wordData.phonemes : wordData.phonemes.split('/').map(function(g) { return { g: g }; });
          var pn = phonemes.length;
          var pw = Math.min(0.75, 7.2 / pn - 0.06);
          var pg = Math.max(0.02, (7.2 - pn * pw) / (pn + 1));
          slide.addShape('rect', { x: 2.05, y: phY, w: 7.55, h: 0.7, fill: { color: 'fce7f3' }, line: { color: 'db2777' }, rectRadius: 0.06 });
          phonemes.forEach(function(p, pi) {
            var px = 2.08 + pg + pi * (pw + pg);
            slide.addShape('rect', { x: px, y: phY + 0.06, w: pw, h: 0.38, fill: { color: C.white }, line: { color: 'db2777' }, rectRadius: 0.04 });
            slide.addText(p.g, { x: px, y: phY + 0.06, w: pw, h: 0.38, fontSize: Math.max(9, 13 - pn), bold: true, color: '9d174d', fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
            if (p.s) slide.addText(p.s, { x: px, y: phY + 0.46, w: pw, h: 0.2, fontSize: 7.5, color: '94a3b8', italic: true, fontFace: FONT_BODY, align: 'center', valign: 'top', margin: 0 });
          });
        } else {
          slide.addShape('rect', { x: 2.05, y: phY, w: 7.55, h: 0.7, fill: { color: C.offWhite }, line: { color: C.slateLight, dashType: 'dash' }, rectRadius: 0.06 });
          slide.addText('Write here...', { x: 2.05, y: phY, w: 7.55, h: 0.7, fontSize: 11, color: 'cbd5e1', italic: true, fontFace: FONT_BODY, align: 'center', valign: 'middle' });
        }
      });
    });
  }

  function addWordMatrixWorksheetSlide(pres) {
    var slide = lightSlide(pres);
    slideHeader(slide, 'Day 3', 'Word Matrix \u2014 Build Your Own Words');
    footer(slide);
    slide.addText('Use the Word Labs Morpheme Builder to find words, then fill in the matrix below.', { x: 0.4, y: 0.82, w: 9.2, h: 0.4, fontSize: 12, color: C.slate, fontFace: FONT_BODY, align: 'left', valign: 'middle' });
    slide.addText('Name:', { x: 0.4, y: 1.28, w: 0.8, h: 0.36, fontSize: 11, bold: true, color: C.dark, fontFace: FONT, align: 'left', valign: 'middle', margin: 0 });
    slide.addShape('line', { x: 1.25, y: 1.5, w: 3.2, h: 0, line: { color: C.slate, width: 1 } });
    slide.addText('Date:', { x: 5.1, y: 1.28, w: 0.7, h: 0.36, fontSize: 11, bold: true, color: C.dark, fontFace: FONT, align: 'left', valign: 'middle', margin: 0 });
    slide.addShape('line', { x: 5.85, y: 1.5, w: 3.55, h: 0, line: { color: C.slate, width: 1 } });

    var matX = [0.4, 3.25, 6.5]; var matW = [2.7, 3.1, 3.1];
    var wsHeaders = matrixHeaders(); var wsColors = ['7c3aed', C.teal, 'db2777'];
    wsHeaders.forEach(function(h, i) {
      slide.addShape('rect', { x: matX[i], y: 1.75, w: matW[i], h: 0.48, fill: { color: wsColors[i] }, line: { color: wsColors[i] }, rectRadius: 0.06 });
      slide.addText(h, { x: matX[i], y: 1.75, w: matW[i], h: 0.48, fontSize: 10, bold: true, color: C.white, fontFace: FONT, align: 'center', valign: 'middle', margin: 0 });
    });
    for (var r = 0; r < 4; r++) {
      var y = 2.26 + r * 0.37;
      matX.forEach(function(x, i) {
        slide.addShape('rect', { x: x, y: y, w: matW[i], h: 0.35, fill: { color: r % 2 === 0 ? C.offWhite : 'f1f5f9' }, line: { color: C.slateLight } });
      });
    }
    slide.addText('Words I made:', { x: 0.4, y: 3.8, w: 9.2, h: 0.32, fontSize: 12, bold: true, color: C.dark, fontFace: FONT, align: 'left', valign: 'middle', margin: 0 });
    for (var wr = 0; wr < 2; wr++) {
      for (var wc = 0; wc < 3; wc++) {
        slide.addShape('line', { x: 0.4 + wc * 3.1, y: 4.16 + wr * 0.38, w: 2.85, h: 0, line: { color: C.slate, width: 0.75 } });
      }
    }
    slide.addText('Choose 3 words and write a sentence for each:', { x: 0.4, y: 4.96, w: 9.2, h: 0.3, fontSize: 10, bold: true, color: C.dark, fontFace: FONT, align: 'left', valign: 'middle', margin: 0 });
  }

  // ══════════════════════════════════════════════════════════════
  //  MAIN BUILD FUNCTION
  // ══════════════════════════════════════════════════════════════
  function buildDeck(deckData, langName) {
    DATA = deckData;
    var pres = new PptxGenJS();
    pres.layout = 'LAYOUT_16x9';
    pres.title = 'Word Labs \u2014 ' + morphemeLabel() + ' ' + morphemeDisplay() + ' \u2014 EALD ' + langName;
    pres.author = 'Word Labs';

    // Title
    addTitleSlide(pres, langName);

    // Day 1
    sectionDivider(pres, 'Day 1', 'Morpheme Meaning', morphemeLabel() + ' ' + morphemeDisplay() + ' \u2014 ' + DATA.meaning);
    addLearningIntention(pres);
    addRootMeaningSlide(pres);
    addTrueFalseSlide(pres);
    addWordMatrixSlide(pres);
    addDefinitionsSlide(pres);
    addSentencesSlide(pres);

    // Day 2
    sectionDivider(pres, 'Day 2', 'Dictation &\nBreakdown', 'Listen \u2192 Write \u2192 Reveal \u2192 Check');
    if (DATA.day2) {
      addDictationListenSlide(pres, 2, DATA.day2);
      addDictationRevealSlide(pres, 2, DATA.day2);
      addBreakdownSlides(pres, 2, DATA.day2);
    }

    // Day 3
    sectionDivider(pres, 'Day 3', 'Dictation &\nWord Matrix', 'Listen \u2192 Write \u2192 Reveal \u2192 Build');
    if (DATA.day3) {
      addDictationListenSlide(pres, 3, DATA.day3);
      addDictationRevealSlide(pres, 3, DATA.day3);
      addBreakdownSlides(pres, 3, DATA.day3);
    }
    addWordMatrixWorksheetSlide(pres);

    return pres;
  }

  return { buildDeck: buildDeck };
})();
