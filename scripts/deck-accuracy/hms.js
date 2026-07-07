// scripts/deck-accuracy/hms.js
function parseDivisions(html) {
  const out = [];
  const re = /class="Answer_Red"[^>]*>([^<]+)</g;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1].trim().toLowerCase());
  return out;
}
// Return the division (array of syllables) whose letters, de-hyphenated, equal `word`.
function pickDivision(html, word) {
  const target = String(word).toLowerCase();
  for (const d of parseDivisions(html)) {
    if (!/^[a-z]+(-[a-z]+)*$/.test(d)) continue;
    if (d.replace(/-/g, '') === target) return d.split('-');
  }
  return null;
}
module.exports = { parseDivisions, pickDivision };
