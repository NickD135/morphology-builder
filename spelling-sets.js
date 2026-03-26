// ═══════════════════════════════════════════════════════════════
// NSW Department of Education — Spelling Diagnostic Assessment
// Sets 1–7 (Early Stage 1 through Stage 3)
//
// Tier mapping:
//   Sets 1-2 → "foundation" (Early Stage 1 / Stage 1 basics)
//   Sets 3-4 → "starter"    (Stage 1–2 core)
//   Set 5    → "levelup"    (Stage 2 advanced)
//   Sets 6-7 → "challenge"  (Stage 3)
// ═══════════════════════════════════════════════════════════════

const SPELLING_SETS = {

  // ═══════════════════════════════════════════════════════════
  // SET 1 — Early Stage 1 (ENE-SPELL-01)
  // ═══════════════════════════════════════════════════════════
  1: {
    label: "Set 1",
    stage: "Early Stage 1",
    code: "ENE-SPELL-01",
    tier: "foundation",
    sections: {
      A: {
        focus: "Graphemes for consonant phonemes",
        words: ["s","t","p","n","m","d","g","c","k","r","h","b","f","l","j","v","w","x","y","z","qu"]
      },
      B: {
        focus: "Consonant digraphs",
        words: ["sh","ch","th","ck"]
      },
      C: {
        focus: "Short vowel phonemes",
        words: ["a","e","i","o","u"]
      },
      D: {
        focus: "CVC words — initial, medial and final graphemes",
        words: ["sat","tub","vet","wag","cup","men","nut","dim","rod","hop","jig","yet","fox","zip","lap","kit"]
      },
      E: {
        focus: "CVC, CVCC and CCVC words with consonant blends",
        words: ["slip","lamp","plot","must","trap","help","swim","lent"]
      },
      F: {
        focus: "Consonant digraphs in words",
        words: ["ship","then","chop","song","ring","hang","moth","rush","much","quit"]
      },
      G: {
        focus: "Common high frequency words",
        words: ["I","was","are","the","to","she","day","today","of","he","for","all","they","is","said","you","this","my","have","play","come","like","going","do","what","give","look","see","very","we"]
      },
      H: {
        focus: "Inflectional suffixes — ing, ed, plurals with s",
        words: ["looked","looking","played","playing","jumped","jumping","cats","dogs","fans","crabs","lamps","pins"]
      }
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SET 2 — Stage 1 (EN1-SPELL-01)
  // ═══════════════════════════════════════════════════════════
  2: {
    label: "Set 2",
    stage: "Stage 1",
    code: "EN1-SPELL-01",
    tier: "foundation",
    sections: {
      A: {
        focus: "Consonant digraphs",
        words: ["shop","than","chop","wing","bang","hung","cloth","wish","rich","quiz"]
      },
      B: {
        focus: "Consonant clusters in single syllable words",
        words: ["splat","throb","strap","scrap","shrub","spring","squint"]
      },
      C: {
        focus: "Long vowel graphemes",
        words: ["snail","tray","deep","dream","coat","wood","zoom","flew","yawn","blow","town","about","enjoy","chair","coin","near"]
      },
      D: {
        focus: "Inflectional suffix -es to form plurals",
        words: ["boxes","buses","gases","dishes","lunches"]
      },
      E: {
        focus: "Inflectional suffixes — tense (ed, ing, s, es, en) with doubling/drop e rules",
        words: ["hopping","tipped","hitting","wagged","riding","poked","waving","hoped","given","eaten","kicks","pushes"]
      },
      F: {
        focus: "Inflectional suffixes — er (comparative) and est (superlative) with spelling rules",
        words: ["taller","colder","quickest","longest","bigger","thinnest","wider","cutest","happier","funniest"]
      },
      G: {
        focus: "Derivational prefixes — re, un, pre",
        words: ["remix","reopen","undo","unwell","preheat","premade"]
      }
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SET 3 — Stage 1 (EN1-SPELL-01)
  // ═══════════════════════════════════════════════════════════
  3: {
    label: "Set 3",
    stage: "Stage 1",
    code: "EN1-SPELL-01",
    tier: "starter",
    sections: {
      A: {
        focus: "Two syllable words with regular CVC-CVC patterns",
        words: ["magnet","piglet","helmet","kidnap","hotdog","cobweb","bedbug","sunset"]
      },
      B: {
        focus: "Two syllable words with consonant blends",
        words: ["froglet","trumpet","contest","himself","plastic","object","blanket","conquest"]
      },
      C: {
        focus: "Long vowel graphemes — split digraphs and r-controlled vowels",
        words: ["snake","these","slide","rope","rude","park","sort","turn","first","term"]
      },
      D: {
        focus: "Consonant doublets where two syllables meet",
        words: ["rabbit","pillow","parrot","bonnet","letter","middle"]
      },
      E: {
        focus: "Contractions",
        words: ["can't","haven't","here's","they'll","we've","hadn't","won't","don't"]
      },
      F: {
        focus: "Common high frequency words",
        words: ["after","again","because","before","came","could","down","friend","gave","give","have","how","little","love","made","make","over","people","our","saw","school","should","stayed","there","their","were","when","which","why","where","who","your","home","house"]
      },
      G: {
        focus: "Common prefixes — mid, mis, in/im, non",
        words: ["midday","midweek","misuse","mislead","inside","input","imprint","import","nonslip","nonliving"]
      },
      H: {
        focus: "Derivational suffixes — y, ly, ful, ish, ship, er/or with spelling rules",
        words: ["pushy","sunny","spiky","scary","friendly","slowly","happily","lovely","helpful","hopeful","foolish","reddish","friendship","leadership","teacher","leader","doctor","visitor"]
      },
      I: {
        focus: "Compound words with common base words",
        words: ["into","forget","myself","weekend","inside","somewhere","somehow","sometimes","beside","outside"]
      }
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SET 4 — Stage 2 (EN2-SPELL-01)
  // ═══════════════════════════════════════════════════════════
  4: {
    label: "Set 4",
    stage: "Stage 2",
    code: "EN2-SPELL-01",
    tier: "starter",
    sections: {
      A: {
        focus: "Consonant clusters in two syllable words",
        words: ["splinter","screaming","sprinkler","stronger","compress","monster","describe"]
      },
      B: {
        focus: "Consonant digraphs with silent letters — kn, mb, ft, st, wr, gh, gu, gn",
        words: ["knit","limb","soften","listen","ghost","wrist","guess","gnome"]
      },
      C: {
        focus: "High frequency words",
        words: ["which","against","since","although","among","question","sentence","litre","kilometre","month","tomorrow","office","idea","message","Aboriginal","history","community","country","earth","language","parent","computer","neighbour","religion","ingredient","breakfast","enough","false","flavour","recess","even","naughty","none","similar","different","special","correct"]
      },
      D: {
        focus: "Compound words",
        words: ["however","everyone","whoever","everything","everywhere","whenever","himself","herself","yourself","homework","classroom","notebook"]
      },
      E: {
        focus: "Plurals — ves and changing y to i + es",
        words: ["knives","halves","lives","shelves","families","babies","stories"]
      },
      F: {
        focus: "Common prefixes — dis, de, trans, anti, sub, super, semi, under, over, out",
        words: ["dislike","detangle","superpower","underground","overjoyed","outburst","semicircle","subheading","antibody","transform"]
      },
      G: {
        focus: "Common suffixes — ment, less, ness, hood, en, ly, ally, al, ial, ual, ess with spelling rules",
        words: ["enjoyment","measurement","joyless","careless","penniless","thickness","grumpiness","childhood","ashen","widen","countess","princess","logical","natural","actual","usual","denial","lastly","easily","bubbly","dramatically","usually"]
      },
      H: {
        focus: "Common homophones and near-homophones",
        words: ["which","witch","there","their","they're","hear","here","your","you're","wear","where","quite","quiet"]
      }
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SET 5 — Stage 2 (EN2-SPELL-01)
  // ═══════════════════════════════════════════════════════════
  5: {
    label: "Set 5",
    stage: "Stage 2",
    code: "EN2-SPELL-01",
    tier: "levelup",
    sections: {
      A: {
        focus: "Less common vowel digraphs",
        words: ["either","great","couple","vein","shield","cruise","feud","bread"]
      },
      B: {
        focus: "Less common digraphs, trigraphs and quadgraphs",
        words: ["large","phone","sight","enough","eight","match","picture","bridge","through","flair","brochure","doctor","favour","dollar"]
      },
      C: {
        focus: "High frequency words",
        words: ["during","towards","course","though","answer","dictionary","phrase","centre","whole","metre","money","material","dozen","group","feature","Australia","capital","choice","council","cycle","human","health","system","child","technology","culture","symbol","create","brought","measure","cylinder","prism","values","relationship","experiment","thousand"]
      },
      D: {
        focus: "Contractions",
        words: ["doesn't","they're","could've","mightn't","who'll","shouldn't","should've","who's"]
      },
      E: {
        focus: "Common homophones",
        words: ["accept","except","affect","effect","break","brake","grate","great","peace","piece","plain","plane","whether","weather"]
      },
      F: {
        focus: "Common prefixes — in, im, il, ir, be, by, co, tele, astro, mono",
        words: ["incorrect","impossible","illegal","irregular","bewitch","bicycle","co-pilot","television","astronomy","monotone"]
      },
      G: {
        focus: "Common suffixes — able, ible, ous, ure, ture, ion, an, ian, ean, ic, ist, ism",
        words: ["perishable","reliable","moveable","flexible","horrible","venomous","famous","furious","sculpture","closure","mixture","action","historian","musician","poetic","finalist","activist","geologist","heroism"]
      },
      H: {
        focus: "Irregular plurals",
        words: ["mice","children","people","women","diagnoses","axes","vertices"]
      }
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SET 6 — Stage 3 (EN3-SPELL-01)
  // ═══════════════════════════════════════════════════════════
  6: {
    label: "Set 6",
    stage: "Stage 3",
    code: "EN3-SPELL-01",
    tier: "challenge",
    sections: {
      A: {
        focus: "Less common letter patterns and phoneme/grapheme correspondences",
        words: ["watch","vary","nothing","leopard","haunted","laugh","brought","caught","shoulder","neighbour","certain","opinion","priest","receive","theatre","rhythm","coarse","island","debt","honest","receipt","chalk","autumn","muscle","answer"]
      },
      B: {
        focus: "Derivational prefixes — en, em, fore, inter, ex/e, intra, mal, post, pro, uni, tri",
        words: ["enslave","empower","forewarn","interchange","intranet","exclude","emerge","malfunction","postscript","provision","unicycle","triplets"]
      },
      C: {
        focus: "Derivational suffixes — ate, age, ty, ity, ety, ive, ative, itive, eous, ious, ery, ary, ory",
        words: ["fortunate","coverage","cruelty","technicality","variety","supportive","informative","spacious","righteous","trickery","honorary","directory"]
      },
      D: {
        focus: "Common homophones and near homophones",
        words: ["desert","dessert","aisle","isle","principal","principle","serial","cereal","guest","guessed","past","passed"]
      },
      E: {
        focus: "Words with Latin roots",
        words: ["centimetre","century","circle","circus","decimal","December","transport","export","octagon","octopus","project","reject","audition","audience","multiply","multimedia","fracture","fraction"]
      }
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SET 7 — Stage 3 (EN3-SPELL-01)
  // ═══════════════════════════════════════════════════════════
  7: {
    label: "Set 7",
    stage: "Stage 3",
    code: "EN3-SPELL-01",
    tier: "challenge",
    sections: {
      A: {
        focus: "Multisyllabic words with schwa phonemes",
        words: ["compliment","medicine","chemical","spectacular","instructor","helicopter","excellent","available","information","considerable","administration","international","development","comparison","magnificent","possibility","demonstrator","particular"]
      },
      B: {
        focus: "Less common letter patterns — words of French origin",
        words: ["apostrophe","neutral","premiere","recipient","naive","souvenir","silhouette","technique","tournament","camouflage","critique","bouquet","necessary","conscience"]
      },
      C: {
        focus: "Assimilated prefixes — ad, ac, af, as, al, at, an; en/em; con/com/col/cor/co",
        words: ["adjoin","accompany","affront","assign","allocate","attend","annihilate","combine","collaborate","correlate","cohabit","conform"]
      },
      D: {
        focus: "Derivational suffixes — ation, ition, sion/ssion, tion, ious, cious, tious, eous, ose, cial, tial, ise, ant, ent, ient, ence, ance, ee",
        words: ["explanation","definition","compulsion","commendation","confession","hilarious","atrocious","ambitious","courteous","verbose","fictitious","spatial","facial","merchandise","disinfectant","dependent","convenient","reference","brilliance","refugee"]
      },
      E: {
        focus: "Words with Greek roots",
        words: ["autobiography","microwave","epilogue","biological","chronicle","dynamite","dystopian","grammatical","paragraph","dehydration","hyperactive","hypothesis","geology","mechanical","megaphone","paralysis","arachnophobia","microphone","pseudonym","psychology","periscope","technology","thermometer"]
      },
      F: {
        focus: "Less common plurals",
        words: ["cacti","fungi","foci","octopi","nuclei","crises","analyses","criteria","phenomena","bacteria","indices","appendices"]
      }
    }
  }
};

// ── Helper functions ──────────────────────────────────────────

/**
 * Get all words for a specific set number
 * @param {number} setNum - Set number (1-7)
 * @returns {string[]} Array of all words in the set
 */
function getSetWords(setNum) {
  var set = SPELLING_SETS[setNum];
  if (!set) return [];
  var words = [];
  Object.values(set.sections).forEach(function(section) {
    words = words.concat(section.words);
  });
  return words;
}

/**
 * Get all words for a specific set and section
 * @param {number} setNum - Set number (1-7)
 * @param {string} sectionKey - Section letter (A, B, C, etc.)
 * @returns {{ focus: string, words: string[] }}
 */
function getSetSection(setNum, sectionKey) {
  var set = SPELLING_SETS[setNum];
  if (!set || !set.sections[sectionKey]) return { focus: '', words: [] };
  return set.sections[sectionKey];
}

/**
 * Get all words across multiple sets
 * @param {number[]} setNums - Array of set numbers
 * @returns {string[]} Combined array of all words (deduped)
 */
function getWordsForSets(setNums) {
  var all = new Set();
  setNums.forEach(function(n) {
    getSetWords(n).forEach(function(w) { all.add(w.toLowerCase()); });
  });
  return Array.from(all);
}

/**
 * Get words by difficulty tier
 * @param {string} tier - "foundation", "starter", "levelup", or "challenge"
 * @returns {string[]} All words at that tier
 */
function getWordsByTier(tier) {
  var words = [];
  Object.values(SPELLING_SETS).forEach(function(set) {
    if (set.tier === tier) {
      Object.values(set.sections).forEach(function(section) {
        words = words.concat(section.words);
      });
    }
  });
  return words;
}

/**
 * Get all sections across all sets, flattened with metadata
 * @returns {Array<{ set: number, section: string, focus: string, tier: string, words: string[] }>}
 */
function getAllSections() {
  var result = [];
  Object.entries(SPELLING_SETS).forEach(function(entry) {
    var setNum = parseInt(entry[0]);
    var set = entry[1];
    Object.entries(set.sections).forEach(function(sEntry) {
      result.push({
        set: setNum,
        section: sEntry[0],
        focus: sEntry[1].focus,
        tier: set.tier,
        stage: set.stage,
        words: sEntry[1].words
      });
    });
  });
  return result;
}

// ── Stats ─────────────────────────────────────────────────────
(function() {
  var totalWords = 0;
  var setCounts = {};
  for (var i = 1; i <= 7; i++) {
    var count = getSetWords(i).length;
    setCounts[i] = count;
    totalWords += count;
  }
  console.log("NSW Spelling Diagnostic loaded: " + totalWords + " words across 7 sets",
    Object.entries(setCounts).map(function(e) { return "Set " + e[0] + ": " + e[1]; }).join(", "));
})();
