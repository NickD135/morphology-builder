// Build a STANDALONE Resource Appendix docx from a unit_data.js, without the
// full lesson program. Useful for units whose program docx predate the
// unit_data.js pipeline (e.g. u27) but still need their resource list refreshed.
//
//   node scripts/build_appendix_only.js units/u27/unit_data.js
//
// Writes Unit{NN}_Resource_Appendix.docx to the current directory.
const path = require("path");
const fs = require("fs");
const { Document, Packer, PageOrientation } = require("docx");
const { buildAppendix } = require("./build_program_template.js");

const unitDataPath = process.argv[2];
if (!unitDataPath) { console.error("Usage: node scripts/build_appendix_only.js <unit_data.js>"); process.exit(1); }
const unit = require(path.resolve(unitDataPath));
const m = 900;

// buildAppendix()'s first child is a page break (for when it's attached to a
// program); drop it for the standalone document so there's no blank first page.
const children = buildAppendix(unit).slice(1);

const doc = new Document({
  styles: { default: { document: { run: { font: "Arial", size: 18 } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: m, right: m, bottom: m, left: m } } },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const out = `Unit${unit.unit_number}_Resource_Appendix.docx`;
  fs.writeFileSync(out, buf);
  console.log("wrote " + out + " (" + buf.length + " bytes)");
});
