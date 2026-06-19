/**
 * Word Labs SOLO Tracker — Program Document Template Engine
 * ============================================================
 * Canonical layout engine, generalised from the Unit 27 build script
 * (build_u27.js), which Nicholas confirmed as the preferred reference
 * layout. This file contains ONLY the reusable rendering logic — no
 * unit-specific content. Unit data is supplied via a separate
 * `unit_data.json` / `unit_data.js` file matching the schema documented
 * at the bottom of this file (see UNIT DATA SCHEMA).
 *
 * Usage:
 *   node build_program.js path/to/unit_data.js
 *
 * Output:
 *   Maths_S3_YearB_Unit{NN}_SOLO_Full_Program.docx
 *   (written to the same directory the script is run from; the calling
 *   pipeline is responsible for moving it to /units/u{NN}/ and running
 *   the LibreOffice conversion + validate.py step per the pipeline spec)
 *
 * Do not hand-edit a unit's layout by copying this file and changing
 * values inline (that's what caused Units 24–27 to drift from each
 * other in small ways). Always edit unit_data instead, and if a genuine
 * new layout need shows up, extend the schema/engine here so every
 * future unit benefits from it.
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  LevelFormat, PageBreak, TableLayoutType, PageOrientation, ExternalHyperlink
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Fixed palette and layout constants (do not vary per unit) ─────────────
const NAVY = "1F3864", DKBLUE = "2E5F8A", MIDBLUE = "A9C4E0", LTBLUE = "D6E4F0";
const RED_BG = "FCDBD9", RED_HD = "C00000";
const YEL_BG = "FFF9E6", YEL_HD = "7F6000";
const GRN_BG = "EBF3E6", GRN_HD = "375623";
const GREY = "F5F5F5", WHITE = "FFFFFF";
const DOE_BG = "EEF2FF";

// Landscape A4 content width: 16838 - 900*2 margins
const PW = 15038;

const BAND_COLORS = {
  R: { bg: RED_BG, hd: RED_HD, label: "Red" },
  Y: { bg: YEL_BG, hd: YEL_HD, label: "Yellow" },
  G: { bg: GRN_BG, hd: GRN_HD, label: "Green" }
};

// ── Low-level cell/table helpers ───────────────────────────────────────────
const bdr = (c) => ({ style: BorderStyle.SINGLE, size: 4, color: c || "CCCCCC" });
const bdrs = (c) => { const b = bdr(c); return { top: b, bottom: b, left: b, right: b }; };
const thin = (c) => ({ style: BorderStyle.SINGLE, size: 2, color: c || "DDDDDD" });
const thins = (c) => { const b = thin(c); return { top: b, bottom: b, left: b, right: b }; };
const nobdr = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const nobdrs = { top: nobdr, bottom: nobdr, left: nobdr, right: nobdr };

function tc(content, width, fill, opts) {
  opts = opts || {}; fill = fill || WHITE;
  let kids;
  if (typeof content === 'string') {
    kids = [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT, spacing: { before: 0, after: 0 },
      children: [new TextRun({
        text: content, size: opts.size || 18, bold: opts.bold || false,
        italics: opts.italic || false, color: opts.color || "000000", font: "Arial"
      })]
    })];
  } else { kids = content; }
  const o = {
    borders: opts.borders || thins("DDDDDD"), width: { size: width, type: WidthType.DXA },
    shading: { fill: fill, type: ShadingType.CLEAR },
    margins: { top: opts.mt || 70, bottom: opts.mb || 70, left: opts.ml || 110, right: opts.mr || 110 },
    verticalAlign: opts.vAlign || VerticalAlign.TOP, children: kids
  };
  if (opts.colSpan) o.columnSpan = opts.colSpan;
  return new TableCell(o);
}

function hc(text, width, fill, opts) {
  opts = opts || {}; fill = fill || NAVY;
  const o = {
    borders: bdrs(fill), width: { size: width, type: WidthType.DXA },
    shading: { fill: fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 110, right: 110 }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.CENTER, spacing: { before: 0, after: 0 },
      children: [new TextRun({ text, bold: true, color: opts.color || "FFFFFF", size: opts.size || 17, font: "Arial" })]
    })]
  };
  if (opts.colSpan) o.columnSpan = opts.colSpan;
  return new TableCell(o);
}

function mkTable(cols, rows) {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: cols.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: cols, rows: rows
  });
}

function sp(b) { return new Paragraph({ spacing: { before: b || 120, after: 0 }, children: [new TextRun("")] }); }

// Page break that starts the FOLLOWING content on a new page via
// pageBreakBefore (not a free-standing PageBreak run). A free-standing
// PageBreak orphans onto — and blanks out — the next page whenever the
// preceding page is completely full; pageBreakBefore never does.
function pbPara() { return new Paragraph({ pageBreakBefore: true, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "", size: 2 })] }); }

function bandPara(text) {
  return new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text, size: 13, font: "Arial" })]
  });
}

// ── Page 1: Header, two-column program info ────────────────────────────────
function buildHeader(unit) {
  return mkTable([PW], [new TableRow({
    children: [new TableCell({
      borders: nobdrs, width: { size: PW, type: WidthType.DXA },
      shading: { fill: NAVY, type: ShadingType.CLEAR },
      margins: { top: 70, bottom: 70, left: 200, right: 200 },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 30 },
          children: [
            new TextRun({ text: `Mathematics Stage 3 -- Year B -- Unit ${unit.unit_number}  `, bold: true, size: 28, color: WHITE, font: "Arial" }),
            new TextRun({ text: unit.unit_title, size: 22, color: MIDBLUE, font: "Arial" })
          ]
        }),
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [new TextRun({
            text: `KLA: Mathematics  |  Stage 3  |  Year 6  |  Term: ${unit.term || "___________"}  |  Duration: ${unit.duration || "2 weeks"}  |  Teacher: _______________  |  Year: _______`,
            size: 15, color: MIDBLUE, font: "Arial"
          })]
        })
      ]
    })]
  })]);
}

function buildOutcomesTable(unit, leftWidth) {
  const rows = [new TableRow({ children: [hc("Code", 900, DKBLUE, { size: 14 }), hc("Outcome descriptor", leftWidth - 900, DKBLUE, { size: 14 })] })];
  unit.syllabus_outcomes.forEach((o, i) => {
    const bg = i % 2 === 0 ? WHITE : GREY;
    rows.push(new TableRow({ children: [tc(o.code, 900, LTBLUE, { bold: true, size: 15, mt: 36, mb: 36 }), tc(o.descriptor, leftWidth - 900, bg, { size: 15, mt: 36, mb: 36 })] }));
  });
  return mkTable([900, leftWidth - 900], rows);
}

function buildContentPointsTable(unit, leftWidth) {
  const CP = Math.floor(leftWidth / 3), CPR = leftWidth - CP * 2;
  const bandCell = (bandKey, width) => {
    const band = unit.content_points[bandKey];
    const colors = BAND_COLORS[bandKey[0]] || BAND_COLORS.G; // R1/Y1/etc not used here, bandKey is "red"/"yellow"/"green"
    return new TableCell({
      borders: thins("DDDDDD"), width: { size: width, type: WidthType.DXA },
      shading: { fill: band.bg, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 100, right: 100 }, verticalAlign: VerticalAlign.TOP,
      children: [
        new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: band.heading, bold: true, size: 13, color: band.hd, font: "Arial" })] }),
        ...band.points.map((pt, i) => new Paragraph({
          spacing: { before: i === 0 ? 20 : 0, after: i === band.points.length - 1 ? 0 : 8 },
          children: [new TextRun({ text: pt, size: 13, font: "Arial" })]
        }))
      ]
    });
  };

  return mkTable([CP, CP, CPR], [
    new TableRow({
      children: [
        hc(unit.content_points.red.heading_short || "Red -- Foundation", CP, RED_HD, { size: 14 }),
        hc(unit.content_points.yellow.heading_short || "Yellow -- On-level", CP, YEL_HD, { size: 14 }),
        hc(unit.content_points.green.heading_short || "Green -- Extension", CPR, GRN_HD, { size: 14 })
      ]
    }),
    new TableRow({
      children: [
        bandCell('red', CP),
        bandCell('yellow', CP),
        bandCell('green', CPR)
      ]
    })
  ]);
}

function buildLeftColumn(unit, leftWidth) {
  const kids = [];
  kids.push(new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: "Syllabus outcomes", bold: true, size: 17, color: NAVY, font: "Arial" })] }));
  kids.push(buildOutcomesTable(unit, leftWidth));
  kids.push(sp(16));

  kids.push(new Paragraph({ spacing: { before: 24, after: 30 }, children: [new TextRun({ text: "Syllabus content points (addressed through SOLO tracker)", bold: true, size: 17, color: NAVY, font: "Arial" })] }));
  kids.push(new Paragraph({
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: "All content points below are covered by students working independently through the SOLO tracker. Mini masterclasses target specific outcomes based on live tracker data.", size: 14, italic: true, color: "666666", font: "Arial" })]
  }));
  kids.push(buildContentPointsTable(unit, leftWidth));
  kids.push(sp(16));

  kids.push(new Paragraph({ spacing: { before: 24, after: 30 }, children: [new TextRun({ text: "Teaching model", bold: true, size: 17, color: NAVY, font: "Arial" })] }));
  kids.push(new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [new TextRun({
      text: "Students work independently through the Word Labs SOLO Tracker (wordlabs.app/solo) across differentiated bands -- Grow (resources), Know (practice), Show (auto-marked assessments). The teacher monitors live dashboard data and pulls small groups for targeted mini masterclasses (15-40 min) based on which outcomes have the most incomplete Show results. Remaining session time is used for incidental one-on-one and small group teaching in response to student questions and tracker data.",
      size: 14, font: "Arial", color: "333333"
    })]
  }));
  return kids;
}

function buildRightColumn(unit, rightWidth) {
  const kids = [];

  // Working Mathematically
  kids.push(new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: "Working Mathematically  (MAO-WM-01)", bold: true, size: 17, color: NAVY, font: "Arial" })] }));
  const wmRows = [new TableRow({ children: [hc("Process", rightWidth / 2, DKBLUE, { size: 14, align: AlignmentType.LEFT }), hc("How it appears in this unit", rightWidth / 2, DKBLUE, { size: 14, align: AlignmentType.LEFT })] })];
  unit.working_mathematically.forEach((w, i) => {
    const bg = i % 2 === 0 ? WHITE : GREY;
    wmRows.push(new TableRow({ cantSplit: true, children: [tc(w.process, rightWidth / 2, bg, { bold: true, size: 13, mt: 22, mb: 22 }), tc(w.description, rightWidth / 2, bg, { size: 13, mt: 22, mb: 22 })] }));
  });
  kids.push(mkTable([rightWidth / 2, rightWidth / 2], wmRows));
  kids.push(sp(16));

  // Differentiation (blank fields — filled in by teacher)
  kids.push(new Paragraph({ spacing: { before: 24, after: 30 }, children: [new TextRun({ text: "Differentiation", bold: true, size: 17, color: NAVY, font: "Arial" })] }));
  kids.push(mkTable([rightWidth / 2, rightWidth / 2], [
    new TableRow({ children: [hc("Support", rightWidth / 2, RED_HD, { size: 14 }), hc("HPGE / Extension", rightWidth / 2, GRN_HD, { size: 14 })] }),
    new TableRow({
      children: [
        new TableCell({ borders: thins("DDDDDD"), width: { size: rightWidth / 2, type: WidthType.DXA }, shading: { fill: RED_BG, type: ShadingType.CLEAR }, margins: { top: 45, bottom: 70, left: 110, right: 110 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "Students in this group:", size: 13, italic: true, color: "888888", font: "Arial" })] })] }),
        new TableCell({ borders: thins("DDDDDD"), width: { size: rightWidth / 2, type: WidthType.DXA }, shading: { fill: GRN_BG, type: ShadingType.CLEAR }, margins: { top: 45, bottom: 70, left: 110, right: 110 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "Students in this group:", size: 13, italic: true, color: "888888", font: "Arial" })] })] })
      ]
    })
  ]));
  kids.push(sp(16));

  // Pre-test (blank fields)
  kids.push(new Paragraph({ spacing: { before: 24, after: 30 }, children: [new TextRun({ text: "Pre-test", bold: true, size: 17, color: NAVY, font: "Arial" })] }));
  kids.push(mkTable([700, rightWidth - 700], [
    new TableRow({ cantSplit: true, children: [tc("Date", 700, LTBLUE, { bold: true, size: 14, mt: 24, mb: 24 }), tc("", rightWidth - 700, WHITE, { size: 14, mt: 24, mb: 24 })] }),
    new TableRow({ cantSplit: true, children: [tc("Format", 700, LTBLUE, { bold: true, size: 14, mt: 24, mb: 24 }), tc("", rightWidth - 700, WHITE, { size: 14, mt: 24, mb: 24 })] }),
    new TableRow({ cantSplit: true, children: [tc("Band placements / key findings", 700, LTBLUE, { bold: true, size: 14, mt: 24, mb: 24 }), tc("", rightWidth - 700, WHITE, { size: 14, mt: 24, mb: 36 })] })
  ]));
  kids.push(sp(16));

  // Post-test (blank fields)
  kids.push(new Paragraph({ spacing: { before: 24, after: 30 }, children: [new TextRun({ text: "Post-test / unit evaluation", bold: true, size: 17, color: NAVY, font: "Arial" })] }));
  kids.push(mkTable([700, rightWidth - 700], [
    new TableRow({ cantSplit: true, children: [tc("Date", 700, LTBLUE, { bold: true, size: 14, mt: 24, mb: 24 }), tc("", rightWidth - 700, WHITE, { size: 14, mt: 24, mb: 24 })] }),
    new TableRow({ cantSplit: true, children: [tc("Key findings", 700, LTBLUE, { bold: true, size: 14, mt: 24, mb: 24 }), tc("", rightWidth - 700, WHITE, { size: 14, mt: 24, mb: 24 })] }),
    new TableRow({ cantSplit: true, children: [tc("Students who need further consolidation", 700, LTBLUE, { bold: true, size: 14, mt: 24, mb: 24 }), tc("", rightWidth - 700, WHITE, { size: 14, mt: 24, mb: 24 })] }),
    new TableRow({ cantSplit: true, children: [tc("Next steps", 700, LTBLUE, { bold: true, size: 14, mt: 24, mb: 24 }), tc("", rightWidth - 700, WHITE, { size: 14, mt: 24, mb: 36 })] })
  ]));
  kids.push(sp(16));

  // Resources
  kids.push(new Paragraph({ spacing: { before: 24, after: 30 }, children: [new TextRun({ text: "Resources", bold: true, size: 17, color: NAVY, font: "Arial" })] }));
  if (unit.resource_appendix_attached) {
    // Set unit.resource_appendix_attached = true when the resource
    // appendix has been merged onto the end of this same document
    // (Nicholas's preferred workflow as of Unit 27 — appendix attached
    // to the bottom of the program file rather than kept as a separate
    // docx). Leave false/unset to omit this line for units distributed
    // with a standalone appendix file instead.
    kids.push(new Paragraph({
      spacing: { before: 0, after: 20 },
      children: [new TextRun({ text: "See Appendix for Resources", size: 13, italic: true, font: "Arial", color: "555555" })]
    }));
  }
  // When the appendix is attached, the "See Appendix" pointer already
  // adds a line, so keep the citation to ONE line (drop the long strand
  // summary — it's covered by the content-points headings + abbreviations
  // note) so page 1 still fits. Standalone-appendix units keep the full
  // citation.
  const citation = unit.resource_appendix_attached
    ? `Word Labs SOLO Tracker: wordlabs.app/solo  |  NSW DoE Stage 3 Year B Unit ${unit.unit_number}  |  NESA Mathematics K-10 Syllabus (2022)`
    : `Word Labs SOLO Tracker: wordlabs.app/solo  |  NSW DoE Mathematics Stage 3 Year B Unit ${unit.unit_number} (DOCX)  |  NSW Mathematics K-10 Syllabus (2022) -- ${unit.syllabus_strands_summary}`;
  kids.push(new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: citation, size: 13, font: "Arial", color: "555555" })]
  }));

  return kids;
}

function buildPage1(unit) {
  const children = [];
  children.push(buildHeader(unit));
  children.push(sp(20));

  const LEFT = 6700, RIGHT = PW - LEFT;
  const leftKids = buildLeftColumn(unit, LEFT);
  const rightKids = buildRightColumn(unit, RIGHT);

  children.push(new Table({
    layout: TableLayoutType.FIXED, width: { size: PW, type: WidthType.DXA }, columnWidths: [LEFT, RIGHT],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: { top: nobdr, bottom: nobdr, left: nobdr, right: { style: BorderStyle.SINGLE, size: 6, color: MIDBLUE } },
          width: { size: LEFT, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR },
          margins: { top: 0, bottom: 0, left: 0, right: 160 }, verticalAlign: VerticalAlign.TOP, children: leftKids
        }),
        new TableCell({
          borders: nobdrs, width: { size: RIGHT, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR },
          margins: { top: 0, bottom: 0, left: 160, right: 0 }, verticalAlign: VerticalAlign.TOP, children: rightKids
        })
      ]
    })]
  }));
  return children;
}

// ── Page 2: Outcome Teaching Record ────────────────────────────────────────
function buildPage2(unit) {
  const children = [];
  children.push(pbPara());

  children.push(mkTable([PW], [new TableRow({
    children: [new TableCell({
      borders: nobdrs, width: { size: PW, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR },
      margins: { top: 70, bottom: 70, left: 200, right: 200 },
      children: [new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({ text: `Unit ${unit.unit_number} -- Outcome Teaching Record  `, bold: true, size: 22, color: WHITE, font: "Arial" }),
          new TextRun({ text: "Find the outcome/s you taught, write your notes, sign and date. Order follows the outcome sequence, not your teaching calendar.", size: 14, color: MIDBLUE, font: "Arial" })
        ]
      })]
    })]
  })]));
  children.push(sp(24));

  const T1 = 460, T2 = 2400, T3 = 4400, T4 = PW - T1 - T2 - T3 - 700 - 600, T5 = 700, T6 = 600;

  const tRows = [new TableRow({
    tableHeader: true, cantSplit: true,
    children: [
      hc("Code", T1, DKBLUE, { size: 15 }), hc("Outcome", T2, DKBLUE, { size: 15 }),
      hc("Syllabus content point/s addressed", T3, DKBLUE, { size: 15 }),
      hc("Mini masterclass teaching notes", T4, DKBLUE, { size: 15 }),
      hc("Sign", T5, DKBLUE, { size: 15 }), hc("Date", T6, DKBLUE, { size: 15 })
    ]
  })];

  unit.outcomes.forEach((o, i) => {
    const band = BAND_COLORS[o.code[0]];
    const altBg = (i % 2 === 0) ? band.bg : WHITE;
    tRows.push(new TableRow({
      cantSplit: true,
      children: [
        new TableCell({ borders: thins("DDDDDD"), width: { size: T1, type: WidthType.DXA }, shading: { fill: band.bg, type: ShadingType.CLEAR }, margins: { top: 22, bottom: 22, left: 80, right: 80 }, verticalAlign: VerticalAlign.TOP, children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: o.code, bold: true, size: 17, font: "Arial", color: band.hd })] })] }),
        new TableCell({ borders: thins("DDDDDD"), width: { size: T2, type: WidthType.DXA }, shading: { fill: altBg, type: ShadingType.CLEAR }, margins: { top: 22, bottom: 22, left: 100, right: 100 }, verticalAlign: VerticalAlign.TOP, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: o.desc, size: 15, font: "Arial", color: "111111" })] })] }),
        new TableCell({ borders: thins("DDDDDD"), width: { size: T3, type: WidthType.DXA }, shading: { fill: altBg, type: ShadingType.CLEAR }, margins: { top: 22, bottom: 22, left: 100, right: 100 }, verticalAlign: VerticalAlign.TOP, children: o.content_point.split(" | ").map((pt, pi) => new Paragraph({ spacing: { before: pi === 0 ? 0 : 20, after: 0 }, children: [new TextRun({ text: pt, size: 13, font: "Arial", color: "444444" })] })) }),
        new TableCell({
          borders: thins("DDDDDD"), width: { size: T4, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 22, bottom: 22, left: 100, right: 100 }, verticalAlign: VerticalAlign.TOP,
          children: [
            new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: o.pairing_note || "", size: 12, italic: true, color: "BBBBBB", font: "Arial" })] }),
            new Paragraph({ spacing: { before: 20, after: 0 }, children: [new TextRun({ text: o.lesson_ref || "", bold: true, size: 15, color: "2E5F8A", font: "Arial" })] })
          ]
        }),
        new TableCell({ borders: thins("DDDDDD"), width: { size: T5, type: WidthType.DXA }, shading: { fill: GREY, type: ShadingType.CLEAR }, margins: { top: 22, bottom: 22, left: 80, right: 80 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "", size: 14, font: "Arial" })] })] }),
        new TableCell({ borders: thins("DDDDDD"), width: { size: T6, type: WidthType.DXA }, shading: { fill: GREY, type: ShadingType.CLEAR }, margins: { top: 22, bottom: 22, left: 80, right: 80 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "", size: 14, font: "Arial" })] })] })
      ]
    }));
  });

  children.push(mkTable([T1, T2, T3, T4, T5, T6], tRows));
  children.push(sp(24));
  children.push(new Paragraph({
    spacing: { before: 20, after: 0 },
    children: [new TextRun({
      text: `Syllabus outcomes and content from Mathematics K-10 Syllabus (2022) copyright NSW Education Standards Authority (NESA) for and on behalf of the Crown in right of the State of New South Wales, 2024. ${unit.strand_abbreviations_note || ""}`,
      size: 12, italic: true, color: "AAAAAA", font: "Arial"
    })]
  }));

  return children;
}

// ── Pages 3+: Mini Lesson Sequence ─────────────────────────────────────────
function buildLessonSequenceHeader(unit) {
  const children = [];
  children.push(pbPara());

  children.push(mkTable([PW], [new TableRow({
    children: [new TableCell({
      borders: nobdrs, width: { size: PW, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 200, right: 200 },
      children: [
        new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: `Unit ${unit.unit_number} -- Mini Lesson Sequence`, bold: true, size: 30, color: WHITE, font: "Arial" })] }),
        new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: `${unit.unit_title}  |  Stage 3 Year B`, bold: true, size: 22, color: MIDBLUE, font: "Arial" })] }),
        new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "Supplement to the SOLO Teacher Program (pages 1-2). Print pages 1-2 only for annotation. Reference these lesson plans when planning mini masterclasses or when a reviewer requires evidence of planned lesson content.", size: 16, color: "AAAAAA", font: "Arial" })] })
      ]
    })]
  })]));
  children.push(sp(120));

  // Band summary strip
  const bandCounts = { R: 0, Y: 0, G: 0 };
  unit.lessons.forEach(l => { bandCounts[l.band] = (bandCounts[l.band] || 0); });
  // Compute lesson ranges per band from the lesson list
  const bandLessonNums = { R: [], Y: [], G: [] };
  unit.lessons.forEach(l => bandLessonNums[l.band].push(l.num));
  const rangeStr = (nums) => nums.length ? `Mini Lessons ${Math.min(...nums)}-${Math.max(...nums)}` : "";

  const LG = Math.floor(PW / 3);
  children.push(mkTable([LG, LG, PW - LG * 2], [new TableRow({
    children: [
      new TableCell({ borders: thins("DDDDDD"), width: { size: LG, type: WidthType.DXA }, shading: { fill: RED_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 130, right: 130 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: `Red band -- Foundation -- ${rangeStr(bandLessonNums.R)}`, size: 16, bold: true, color: RED_HD, font: "Arial" })] })] }),
      new TableCell({ borders: thins("DDDDDD"), width: { size: LG, type: WidthType.DXA }, shading: { fill: YEL_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 130, right: 130 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: `Yellow band -- On-level -- ${rangeStr(bandLessonNums.Y)}`, size: 16, bold: true, color: YEL_HD, font: "Arial" })] })] }),
      new TableCell({ borders: thins("DDDDDD"), width: { size: PW - LG * 2, type: WidthType.DXA }, shading: { fill: GRN_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 130, right: 130 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: `Green band -- Extension -- ${rangeStr(bandLessonNums.G)}`, size: 16, bold: true, color: GRN_HD, font: "Arial" })] })] })
    ]
  })]));
  children.push(sp(80));

  children.push(mkTable([PW], [new TableRow({
    children: [new TableCell({
      borders: thins("BBBBFF"), width: { size: PW, type: WidthType.DXA }, shading: { fill: DOE_BG, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 160 },
      children: [new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({ text: "DoE lesson links:  ", bold: true, size: 17, color: DKBLUE, font: "Arial" }),
          new TextRun({ text: `Lessons marked DoE Lesson X draw directly from NSW DoE Mathematics Stage 3 Unit ${unit.unit_number}. Steps have been condensed to 20-40 minutes for mini masterclass delivery. Resources referenced by their original resource numbers from the DoE unit.`, size: 16, font: "Arial", color: "333333" })
        ]
      })]
    })]
  })]));
  children.push(sp(160));

  return children;
}

/**
 * Builds a single lesson card. `lesson.is_hands_on` (boolean) and
 * `lesson.materials` (array of strings, physical materials needed) are
 * optional fields — when present, the card surfaces them distinctly so
 * hands-on lessons read differently from written/digital ones, per the
 * pipeline spec's Stage 0c / Stage 2 hands-on guidance. A lesson without
 * these fields renders exactly as Units 24-27 did.
 */
function buildLessonCard(lesson) {
  const band = BAND_COLORS[lesson.band];
  const isDoE = (lesson.source || "").indexOf("DoE") >= 0;
  const rows = [];

  const bannerCell = new TableCell({
    borders: bdrs("FFFFFF"), width: { size: PW, type: WidthType.DXA },
    shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
    columnSpan: 4,
    children: [
      new Paragraph({
        spacing: { before: 0, after: 30 },
        children: [
          new TextRun({ text: `Mini Lesson ${lesson.num}  `, bold: true, color: WHITE, size: 24, font: "Arial" }),
          new TextRun({ text: lesson.title, color: "DDDDDD", size: 20, font: "Arial" }),
          ...(lesson.is_hands_on ? [new TextRun({ text: "   [HANDS-ON]", bold: true, color: "FFD966", size: 16, font: "Arial" })] : [])
        ]
      }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({ text: `${lesson.outcomes.join(", ")}  |  `, bold: true, color: band.bg, size: 17, font: "Arial" }),
          new TextRun({ text: `${band.label} band  |  `, color: "AAAAAA", size: 16, font: "Arial" }),
          new TextRun({ text: lesson.source, color: isDoE ? "AACCFF" : "AAFFCC", size: 16, italic: true, font: "Arial" })
        ]
      })
    ]
  });
  rows.push(new TableRow({ children: [bannerCell] }));

  const M1 = 1600, M2 = 1600, M3 = PW - M1 - M2;
  rows.push(new TableRow({
    children: [
      tc(`Duration: ${lesson.duration}`, M1, LTBLUE, { bold: true, size: 17 }),
      tc(`Outcomes: ${lesson.outcomes.join(", ")}`, M2, LTBLUE, { bold: true, size: 17 }),
      tc(`Syllabus: ${lesson.syllabus}`, M3, LTBLUE, { size: 17, colSpan: 2 })
    ]
  }));

  if (isDoE) {
    rows.push(new TableRow({
      children: [new TableCell({
        borders: thins("DDDDDD"), width: { size: PW, type: WidthType.DXA }, shading: { fill: DOE_BG, type: ShadingType.CLEAR },
        margins: { top: 70, bottom: 70, left: 130, right: 130 }, columnSpan: 4,
        children: [new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            new TextRun({ text: "Linked to: ", bold: true, size: 17, color: DKBLUE, font: "Arial" }),
            new TextRun({ text: `${lesson.source} -- ${lesson.doeLink}`, size: 17, color: DKBLUE, font: "Arial" }),
            new TextRun({ text: `  |  Key resources: ${lesson.resources}`, size: 16, italic: true, color: "555555", font: "Arial" })
          ]
        })]
      })]
    }));
  }

  // Materials list — only rendered if present (hands-on lessons)
  if (lesson.materials && lesson.materials.length) {
    rows.push(new TableRow({
      children: [new TableCell({
        borders: thins("DDDDDD"), width: { size: PW, type: WidthType.DXA }, shading: { fill: "FFF4D6", type: ShadingType.CLEAR },
        margins: { top: 70, bottom: 70, left: 130, right: 130 }, columnSpan: 4,
        children: [new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            new TextRun({ text: "Physical materials needed: ", bold: true, size: 17, color: "7F6000", font: "Arial" }),
            new TextRun({ text: lesson.materials.join(", "), size: 17, font: "Arial", color: "333333" })
          ]
        })]
      })]
    }));
  }

  const LC = Math.floor(PW / 2), LC2 = PW - LC;
  rows.push(new TableRow({ children: [hc("Learning intention", LC, DKBLUE, { size: 18, colSpan: 3 }), hc("Success criteria", LC2, DKBLUE, { size: 18 })] }));
  rows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        borders: thins("DDDDDD"), width: { size: LC, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 130, right: 130 },
        children: [
          new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: "Students are learning to:", size: 17, italic: true, color: "666666", font: "Arial" })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: lesson.li, size: 18, font: "Arial" })] })
        ]
      }),
      new TableCell({
        borders: thins("DDDDDD"), width: { size: LC2, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 130, right: 130 },
        children: [
          new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: "Students can:", size: 17, italic: true, color: "666666", font: "Arial" })] }),
          ...lesson.sc.map(s => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { before: 0, after: 30 }, children: [new TextRun({ text: s, size: 17, font: "Arial" })] }))
        ]
      })
    ]
  }));

  rows.push(new TableRow({ children: [hc(`Mini masterclass structure (${lesson.duration})`, PW, DKBLUE, { size: 18, colSpan: 4 })] }));
  rows.push(new TableRow({
    children: [new TableCell({
      borders: thins("DDDDDD"), width: { size: PW, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR },
      margins: { top: 90, bottom: 90, left: 130, right: 130 }, columnSpan: 4,
      children: lesson.steps.reduce((acc, step) => {
        acc.push(new Paragraph({
          spacing: { before: acc.length === 0 ? 0 : 60, after: 20 },
          children: [
            new TextRun({ text: `${step.label}  `, bold: true, size: 18, color: NAVY, font: "Arial" }),
            new TextRun({ text: step.content, size: 18, font: "Arial" })
          ]
        }));
        return acc;
      }, [])
    })]
  }));

  const KV = Math.floor(PW / 2), DIFF = PW - KV;
  rows.push(new TableRow({ children: [hc("Key vocabulary", KV, DKBLUE, { size: 18, colSpan: 3 }), hc("Differentiation", DIFF, DKBLUE, { size: 18 })] }));
  rows.push(new TableRow({
    children: [
      new TableCell({ columnSpan: 3, borders: thins("DDDDDD"), width: { size: KV, type: WidthType.DXA }, shading: { fill: band.bg, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 130, right: 130 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: lesson.vocab, size: 17, font: "Arial" })] })] }),
      new TableCell({
        borders: thins("DDDDDD"), width: { size: DIFF, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 130, right: 130 },
        children: [
          new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: "Support:  ", bold: true, size: 17, color: RED_HD, font: "Arial" }), new TextRun({ text: lesson.support, size: 17, font: "Arial" })] }),
          new Paragraph({ spacing: { before: 20, after: 0 }, children: [new TextRun({ text: "Extension:  ", bold: true, size: 17, color: GRN_HD, font: "Arial" }), new TextRun({ text: lesson.extension, size: 17, font: "Arial" })] })
        ]
      })
    ]
  }));

  const AS = Math.floor(PW / 2), TN = PW - AS;
  rows.push(new TableRow({ children: [hc("Assessment", AS, DKBLUE, { size: 18, colSpan: 3 }), hc("Teaching notes (annotate here)", TN, DKBLUE, { size: 18 })] }));
  rows.push(new TableRow({
    children: [
      new TableCell({ columnSpan: 3, borders: thins("DDDDDD"), width: { size: AS, type: WidthType.DXA }, shading: { fill: GREY, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 130, right: 130 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: lesson.assessment, size: 17, font: "Arial" })] })] }),
      new TableCell({ borders: thins("DDDDDD"), width: { size: TN, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 130, right: 130 }, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "Taught as described / adapted / replaced -- note here:", size: 15, italic: true, color: "AAAAAA", font: "Arial" })] })] })
    ]
  }));

  // 4-column grid shared by every row so the tblGrid is valid in Word
  // (Word obeys the declared grid strictly; LibreOffice silently rebuilt
  // it, which masked this). Column boundaries: M1, M2, then the page
  // midpoint, then the rest. Every row's column spans sum to 4:
  // full-width = colSpan 4; metadata = 1 + 1 + 2; half-splits = 3 + 1
  // (cols 1-3 reach the midpoint, col 4 is the second half).
  const CARD_GRID = [M1, M2, LC - M1 - M2, PW - LC];
  return mkTable([PW], [new TableRow({
    children: [new TableCell({
      borders: nobdrs, width: { size: PW, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 0, bottom: 0, left: 0, right: 0 },
      children: [mkTable(CARD_GRID, rows)]
    })]
  })]);
}

/**
 * Rough relative "size" estimate for a lesson card, used only to decide
 * page-break placement (not for layout itself — DXA/table sizing is
 * unaffected). This is intentionally crude: it counts content units
 * (steps, success criteria, vocab length, presence of a DoE link bar
 * and/or a materials strip) rather than measuring actual rendered
 * height, because docx-js can't know real height before LibreOffice
 * lays the page out. The goal is "good enough to stop short lessons
 * needlessly forcing a page break" — not pixel-perfect pagination.
 */
function estimateLessonWeight(lesson) {
  let weight = 0;
  weight += (lesson.steps || []).length * 2;
  weight += (lesson.sc || []).length;
  weight += (lesson.vocab || "").length > 120 ? 2 : 1;
  weight += (lesson.support || "").length > 150 ? 1 : 0;
  weight += (lesson.extension || "").length > 150 ? 1 : 0;
  weight += ((lesson.source || "").indexOf("DoE") >= 0) ? 1 : 0;  // DoE link bar adds a row
  weight += (lesson.materials && lesson.materials.length) ? 1 : 0; // materials strip adds a row
  return weight;
}

/**
 * A lesson card this size or larger reliably fills close to a full
 * landscape A4 page on its own at the standard 900 DXA margins used by
 * this template (confirmed against Units 24-27 and Nicholas's manually
 * resized Unit 27 copy, where lessons of this approximate length were
 * the ones that needed their own page to avoid an awkward split).
 * Tune this threshold here if a future unit's lessons are consistently
 * running noticeably longer or shorter than this baseline.
 */
const HEAVY_LESSON_THRESHOLD = 11;

function buildLessonSequence(unit) {
  const children = buildLessonSequenceHeader(unit);
  unit.lessons.forEach((lesson, i) => {
    children.push(buildLessonCard(lesson));

    const isLast = i === unit.lessons.length - 1;
    if (!isLast) {
      const thisWeight = estimateLessonWeight(lesson);
      const nextWeight = estimateLessonWeight(unit.lessons[i + 1]);
      // Force a page break only when either this lesson or the next one
      // is "heavy" — i.e. likely to fill most/all of a page on its own,
      // so letting it flow would either overflow awkwardly or strand a
      // small fragment of the next lesson at the top of a new page.
      // Two light lessons are left to flow onto the same page, which is
      // the behaviour Nicholas was manually achieving by hand for Unit 27.
      if (thisWeight >= HEAVY_LESSON_THRESHOLD || nextWeight >= HEAVY_LESSON_THRESHOLD) {
        children.push(sp(200));
        children.push(pbPara());
      } else {
        // Still separate consecutive lessons visually with a rule and
        // spacing when they're sharing a page (matches Nicholas's manual
        // edit, which used a thin horizontal rule between lessons that
        // flow onto the same page rather than a full page break).
        children.push(sp(120));
        children.push(new Paragraph({
          spacing: { before: 0, after: 120 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } },
          children: [new TextRun("")]
        }));
      }
    }
  });
  children.push(new Paragraph({
    spacing: { before: 100, after: 0 },
    children: [new TextRun({
      text: "Syllabus outcomes and content from Mathematics K-10 Syllabus (2022) copyright NSW Education Standards Authority (NESA) for and on behalf of the Crown in right of the State of New South Wales, 2024.",
      size: 13, italic: true, color: "AAAAAA", font: "Arial"
    })]
  }));
  return children;
}

// ── Top-level build ─────────────────────────────────────────────────────────
/**
 * `marginDxa` controls page margins on all four sides, in DXA (1440 = 1
 * inch). Defaults to 900 DXA (0.625"), matching Units 24-27. Nicholas
 * found he needed to manually drop this to ~0.2" (288 DXA) for Unit 27
 * to make everything fit — that was compensating for the old
 * force-a-break-every-lesson behaviour, which this template no longer
 * does by default. Try the default margin first; only tighten it via
 * this parameter if a specific unit's page-1 annotation grid or lesson
 * count genuinely needs it — tight margins make the page-1 sign/date
 * grid cramped to handwrite in, which works against the point of that
 * page, so treat shrinking margins as a fallback, not the first fix.
 */
// ── Resource Appendix (optional, appended to the end of the program) ───────
// Rendered when unit.resources is present. A full per-outcome resource
// table (3-column grid: Type | Resource | Link, with clickable links) plus
// a worksheet download checklist (Corbettmaths PDFs can't be fetched
// server-side, so the teacher ticks them off as they download). Grid is
// kept strictly valid for Word: every row spans exactly 3 columns
// (resource rows = 3 cells; band sub-headers = 1 cell colSpan 3).
const TYPE_LABEL = { video: "Video", worksheet: "Worksheet (print)", website: "Website" };

function resLink(url) {
  return new ExternalHyperlink({ link: url, children: [new TextRun({ text: url, size: 13, color: "0563C1", underline: {}, font: "Arial" })] });
}

function buildAppendix(unit) {
  const children = [];
  children.push(pbPara());

  // Banner
  children.push(mkTable([PW], [new TableRow({
    children: [new TableCell({
      borders: nobdrs, width: { size: PW, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR },
      margins: { top: 90, bottom: 90, left: 200, right: 200 },
      children: [
        new Paragraph({ spacing: { before: 0, after: 30 }, children: [new TextRun({ text: `Unit ${unit.unit_number} -- Resource Appendix`, bold: true, size: 28, color: WHITE, font: "Arial" })] }),
        new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "Every link verified. Videos open in a browser; worksheets are print-ready PDFs (see the download checklist at the end).", size: 15, color: MIDBLUE, font: "Arial" })] })
      ]
    })]
  })]));
  children.push(sp(50));

  // Resource table — 3-column grid
  const RT = 1700, RL = 6000, RU = PW - RT - RL;   // Type | Resource | Link
  const rows = [new TableRow({ tableHeader: true, cantSplit: true, children: [
    hc("Type", RT, DKBLUE, { size: 15, align: AlignmentType.LEFT }),
    hc("Resource", RL, DKBLUE, { size: 15, align: AlignmentType.LEFT }),
    hc("Link", RU, DKBLUE, { size: 15, align: AlignmentType.LEFT })
  ] })];

  const addGroup = (title, band, list) => {
    if (!list || !list.length) return;
    rows.push(new TableRow({ cantSplit: true, children: [new TableCell({
      columnSpan: 3, borders: thins("DDDDDD"), width: { size: PW, type: WidthType.DXA },
      shading: { fill: band.bg, type: ShadingType.CLEAR }, margins: { top: 50, bottom: 50, left: 110, right: 110 },
      children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: title, bold: true, size: 15, color: band.hd, font: "Arial" })] })]
    })] }));
    list.forEach(r => {
      rows.push(new TableRow({ cantSplit: true, children: [
        tc(TYPE_LABEL[r.type] || r.type, RT, WHITE, { size: 13, mt: 40, mb: 40 }),
        tc(r.label, RL, WHITE, { size: 14, mt: 40, mb: 40 }),
        new TableCell({ borders: thins("DDDDDD"), width: { size: RU, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 40, bottom: 40, left: 110, right: 110 }, verticalAlign: VerticalAlign.TOP, children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [resLink(r.url)] })] })
      ] }));
    });
  };

  (unit.outcomes || []).forEach(o => {
    const band = BAND_COLORS[o.code[0]];
    addGroup(`${o.code} -- ${o.desc}`, band, unit.resources[o.code.toLowerCase()]);
  });
  if (unit.beyond_resources && unit.beyond_resources.length) {
    addGroup("Beyond SOLO -- Stage 4 extension", BAND_COLORS.G, unit.beyond_resources);
  }
  children.push(mkTable([RT, RL, RU], rows));

  // Worksheet download checklist — unique worksheet URLs
  const seen = new Set();
  const sheets = [];
  const collect = (list) => (list || []).forEach(r => { if (r.type === "worksheet" && !seen.has(r.url)) { seen.add(r.url); sheets.push(r); } });
  (unit.outcomes || []).forEach(o => collect(unit.resources[o.code.toLowerCase()]));
  collect(unit.beyond_resources);

  if (sheets.length) {
    children.push(sp(120));
    children.push(new Paragraph({ spacing: { before: 0, after: 30 }, children: [new TextRun({ text: "Worksheet download checklist", bold: true, size: 18, color: NAVY, font: "Arial" })] }));
    children.push(new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: "Download and print these PDFs before the unit (or save to your class drive). Tick each as you go.", size: 14, italic: true, color: "666666", font: "Arial" })] }));
    sheets.forEach(s => {
      children.push(new Paragraph({ spacing: { before: 0, after: 40 }, children: [
        new TextRun({ text: "❑  ", size: 18, font: "Arial", color: "888888" }),
        new TextRun({ text: `${s.label}  --  `, size: 14, font: "Arial" }),
        resLink(s.url)
      ] }));
    });
  }

  return children;
}

function buildProgramDocument(unit, opts) {
  opts = opts || {};
  const marginDxa = opts.marginDxa || 900;

  const children = [
    ...buildPage1(unit),
    ...buildPage2(unit),
    ...buildLessonSequence(unit),
    ...(unit.resources ? buildAppendix(unit) : [])
  ];

  return new Document({
    numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "*", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 240 } } } }] }] },
    styles: { default: { document: { run: { font: "Arial", size: 18 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: marginDxa, right: marginDxa, bottom: marginDxa, left: marginDxa } } },
      children: children
    }]
  });
}

// ── CLI entry point ─────────────────────────────────────────────────────────
if (require.main === module) {
  const unitDataPath = process.argv[2];
  const marginInches = process.argv[3] ? parseFloat(process.argv[3]) : null;

  if (!unitDataPath) {
    console.error("Usage: node build_program_template.js path/to/unit_data.js [marginInches]");
    console.error("  marginInches is optional, defaults to 0.625\" (matches Units 24-27).");
    console.error("  Only pass this if a specific unit genuinely needs tighter margins —");
    console.error("  try the default first; the content-aware page-break logic should");
    console.error("  remove most of the need for manual margin tightening.");
    process.exit(1);
  }
  const unit = require(path.resolve(unitDataPath));
  const opts = marginInches ? { marginDxa: Math.round(marginInches * 1440) } : {};
  const doc = buildProgramDocument(unit, opts);
  const outName = `Maths_S3_YearB_Unit${unit.unit_number}_SOLO_Full_Program.docx`;
  Packer.toBuffer(doc).then(buf => {
    fs.writeFileSync(outName, buf);
    console.log(`Done: ${outName}`);
  });
}

module.exports = { buildProgramDocument, BAND_COLORS };

/**
 * ============================================================
 * UNIT DATA SCHEMA
 * ============================================================
 * The object passed to buildProgramDocument() / required via the CLI
 * must match this shape. Every unit (Units 24-27 retrofitted, and all
 * future units from Unit 28 onward) should produce a unit_data file in
 * exactly this shape — this is what makes program output consistent
 * across units instead of drifting.
 *
 * {
 *   unit_number: "27",                    // string, no "u" prefix here (that's the Supabase format, different context)
 *   unit_title: "Multiplicative Relations",
 *   term: "3",                            // or null/omit to leave blank on the page
 *   duration: "2 weeks",                  // optional, defaults to "2 weeks"
 *
 *   syllabus_strands_summary: "Multiplicative Relations A and B",  // used in the Resources line
 *   strand_abbreviations_note: "MR-A = Multiplicative Relations A. MR-B = Multiplicative Relations B.", // footer note on page 2
 *
 *   syllabus_outcomes: [
 *     { code: "MAO-WM-01", descriptor: "Develops understanding and fluency through..." },
 *     { code: "MA3-MR-01", descriptor: "Selects and applies appropriate strategies..." },
 *     // ...
 *   ],
 *
 *   content_points: {
 *     red:    { heading: "Multiplicative relations A", heading_short: "Red -- Foundation", points: ["...", "..."] },
 *     yellow: { heading: "Multiplicative relations B", heading_short: "Yellow -- On-level", points: ["...", "..."] },
 *     green:  { heading: "Extended -- Stage 4 content", heading_short: "Green -- Extension", points: ["...", "..."] }
 *   },
 *
 *   working_mathematically: [
 *     { process: "Communicating", description: "Students explain reasoning when..." },
 *     { process: "Understanding and fluency", description: "..." },
 *     { process: "Reasoning", description: "..." },
 *     { process: "Problem solving", description: "..." }
 *   ],
 *
 *   outcomes: [   // for the Page 2 Outcome Teaching Record — one entry per rubric outcome (Rn/Yn/Gn)
 *     {
 *       code: "R1",
 *       desc: "Use the area model and algorithms to solve multiplication problems",
 *       content_point: "MR-A: Use area model for 2-digit by 2-digit multiplication | Use multiplication algorithm | MA3-MR-01",
 *       lesson_ref: "Mini Lesson 1",
 *       pairing_note: "Suggested: pair with R2"   // optional
 *     },
 *     // ...
 *   ],
 *
 *   lessons: [    // for Pages 3+ — one entry per Mini Lesson card, in the order they should appear
 *     {
 *       num: 1,
 *       band: "R",                         // "R" | "Y" | "G" — drives all band colouring on this card
 *       title: "Area model and algorithms for multiplication",
 *       outcomes: ["R1", "R2"],            // which rubric outcomes this lesson addresses
 *       duration: "20-30 min",
 *       syllabus: "MA3-MR-01, MAO-WM-01 | MR-A: ...",
 *       source: "DoE Lesson 1 (adapted)",  // or "Original mini lesson" for Green-band content with no DoE source
 *       doeLink: "Lesson 1 -- Constructing column graphs using digital technologies",  // only used if source contains "DoE"
 *       resources: "Resource 2, Resource 3, Microsoft Excel or Google Sheets",          // only used if source contains "DoE"
 *       li: "use the area model and an algorithm to multiply 2-digit numbers",
 *       sc: ["...", "...", "..."],         // success criteria bullet list
 *       steps: [                            // the 4-step (or more) teaching structure
 *         { label: "Activate (3 min):", content: "..." },
 *         { label: "Model (10 min):", content: "..." },
 *         { label: "Guided practice (10 min):", content: "..." },
 *         { label: "Check (3 min):", content: "..." }
 *       ],
 *       vocab: "comma-separated key vocabulary list",
 *       support: "support differentiation text",
 *       extension: "extension differentiation text",
 *       assessment: "what gets assessed and how this links back to the outcome",
 *
 *       // OPTIONAL — only set these for hands-on-required / hands-on-preferred
 *       // outcomes per pipeline spec Stage 0c. Omitting them renders the card
 *       // exactly as Units 24-27 did.
 *       is_hands_on: true,                  // adds a [HANDS-ON] tag to the banner
 *       materials: ["grid paper", "counting squares", "ruler"]  // renders as a distinct materials strip
 *     },
 *     // ...
 *   ],
 *
 *   // OPTIONAL — resource appendix appended to the end of the program.
 *   // Present `resources` → buildAppendix() renders a per-outcome resource
 *   // table (Type | Resource | clickable Link) + a worksheet download
 *   // checklist. Set resource_appendix_attached: true so page 1's Resources
 *   // line points to it (and the page-1 citation stays one line).
 *   resource_appendix_attached: true,
 *   resources: {                      // keyed by outcome code, lowercase
 *     r1: [ { type: "video"|"worksheet"|"website", label: "...", url: "..." }, ... ],
 *     // ... one key per outcome (r1, r2, y1, g1, ...)
 *   },
 *   beyond_resources: [ { type, label, url }, ... ]   // Stage 4 extension links
 * }
 */
