/**
 * Standalone Resource Appendix builder (Deliverable B, Stage 5).
 *
 * Renders ONLY the resource appendix (the same buildAppendix() used inside
 * the merged program) as its own landscape-A4 docx, so a unit can ship the
 * appendix as a separate file (units/u{NN}/Unit{NN}_Resource_Appendix.docx)
 * matching the Units 24-27 format. Uses the shared engine — no layout is
 * duplicated here.
 *
 * Usage: node scripts/build_appendix_standalone.js path/to/unit_data.js
 */
const { Document, Packer, PageOrientation } = require('docx');
const { buildAppendix } = require('./build_program_template.js');
const fs = require('fs');
const path = require('path');

const unitDataPath = process.argv[2];
if (!unitDataPath) { console.error('Usage: node build_appendix_standalone.js path/to/unit_data.js'); process.exit(1); }
const unit = require(path.resolve(unitDataPath));
if (!unit.resources) { console.error('unit_data has no `resources` — nothing to render.'); process.exit(1); }

// buildAppendix() leads with a page break (it normally follows the program).
// For a standalone file, drop that leading break so the appendix starts on page 1.
const children = buildAppendix(unit).slice(1);

const doc = new Document({
  styles: { default: { document: { run: { font: 'Arial', size: 18 } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 900, right: 900, bottom: 900, left: 900 } } },
    children
  }]
});

const outName = `Unit${unit.unit_number}_Resource_Appendix.docx`;
Packer.toBuffer(doc).then(buf => { fs.writeFileSync(outName, buf); console.log(`Done: ${outName}`); });
