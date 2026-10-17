// Checks that Sound Sorter's Need Advice lines never give the answer away:
// for every word the game can show, neither line may contain the word itself
// or its target grapheme as a whole word.
// Run: node tests/test-sound-sorter-hints.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
global.window = {};
require(path.join(root, 'sound-sorter-data.js'));
const page = fs.readFileSync(path.join(root, 'sound-sorter.html'), 'utf8');

function grab(name) {
  const m = page.match(new RegExp('^function ' + name + '\\(.*$', 'm'));
  if (!m) throw new Error('Could not find ' + name + ' in sound-sorter.html');
  return new Function(m[0] + '\nreturn ' + name + ';')();
}
const strategy = grab('_ssStrategyHint');
const specific = grab('_ssSpecificHint');

// Words in the shared data file, plus any inline word objects in the page.
const inline = [...page.matchAll(/word:"([^"]+)"[^}]*grapheme:"([^"]+)"[^}]*before:"([^"]*)"[^}]*after:"([^"]*)"/g)]
  .map(m => ({ word: m[1], grapheme: m[2], before: m[3], after: m[4] }));
const words = window.SOUND_SORTER_WORDS.concat(inline);

let problems = 0;
const counts = { beginning: 0, middle: 0, end: 0 };
for (const w of words) {
  const lines = [strategy(), specific(w)];
  const where = specific(w).match(/its (beginning|middle|end)/)[1];
  counts[where]++;
  for (const line of lines) {
    const tokens = line.toLowerCase().match(/[a-z_]+/g);
    if (tokens.includes(String(w.word).toLowerCase()) || tokens.includes(String(w.grapheme).toLowerCase())) {
      problems++;
      console.log('GIVES IT AWAY:', w.word, w.grapheme, '->', line);
    }
  }
  // The gap position must match the word: before is empty only when the gap starts the word.
  const expect = !(w.before || '') ? 'beginning' : !(w.after || '') ? 'end' : 'middle';
  if (where !== expect) { problems++; console.log('WRONG PLACE:', w.word, where, 'expected', expect); }
}
console.log(words.length + ' words checked (' + counts.beginning + ' beginning, ' + counts.middle + ' middle, ' + counts.end + ' end), ' + problems + ' problems');
process.exit(problems ? 1 : 0);
