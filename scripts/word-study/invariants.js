(function(root){
  var VOWELS = ['a','e','i','o','u'];
  function multiset(s){ return s.toLowerCase().split('').sort().join(''); }

  function checkMorphemes(w){
    var ids = ['prefix','base','suffix1','suffix2']
      .map(function(k){ return w.morphemes[k]; }).filter(Boolean);
    var missing = ids.filter(function(id){ return !w.partMeanings || !w.partMeanings[id]; });
    if(missing.length) return {ok:false, msg:'partMeanings missing: '+missing.join(',')};
    return {ok:true, msg:ids.join('·')};
  }
  function checkSyllables(w){
    if(!Array.isArray(w.syllables) || !w.syllables.length) return {ok:false,msg:'no syllables'};
    if(w.syllables.join('') !== w.word) return {ok:false,msg:'join="'+w.syllables.join('')+'" ≠ word'};
    var noVowel = w.syllables.filter(function(s){ return !/[aeiouy]/i.test(s); });
    if(noVowel.length) return {ok:false,msg:'syllable without vowel: '+noVowel.join(',')};
    return {ok:true, msg:w.syllables.join('·')};
  }
  function checkPhonemes(w){
    if(!Array.isArray(w.phonemes) || !w.phonemes.length) return {ok:false,msg:'no phonemes'};
    var hasMagic = w.phonemes.some(function(p){ return /_e$/.test(p); });
    if(!hasMagic && w.phonemes.join('') !== w.word) return {ok:false,msg:'join="'+w.phonemes.join('')+'" ≠ word'};
    var flat = w.phonemes.join('').replace(/_/g,'');
    if(multiset(flat) !== multiset(w.word)) return {ok:false,msg:'letter multiset ≠ word'};
    // magic-e must sit on a vowel; 'y' counts (byte -> "y_e"), consonants (v_e, s_e) do not
    var MAGIC_VOWELS = VOWELS.concat('y');
    var badMagic = w.phonemes.filter(function(p){ return /_e$/.test(p) && MAGIC_VOWELS.indexOf(p[0])===-1; });
    if(badMagic.length) return {ok:false,msg:'magic-e not on vowel: '+badMagic.join(',')};
    return {ok:true, msg:w.phonemes.join('·')};
  }
  // catches generator punts: "placeholder1", "lorem", empty, or "<word>-ish" self-reference
  function isJunk(text, word){
    if(text==null) return true;
    var t = String(text).trim();
    if(!t) return true;
    if(/placeholder|lorem|^n\/?a$|^tbd$|^todo$/i.test(t)) return true;
    if(word){
      var w = word.toLowerCase(), s = t.toLowerCase();
      if(s === w) return true;                          // synonym == the word
      if(s === w+'ish' || s === w+'-ish') return true;  // "<word>-ish" punt
    }
    return false;
  }
  function checkMeaning(w){
    if(!w.meaning || !Array.isArray(w.meaningDistractors) || w.meaningDistractors.length!==2) return {ok:false,msg:'meaning/distractors shape'};
    if(w.meaningDistractors.indexOf(w.meaning)!==-1) return {ok:false,msg:'meaning == a distractor'};
    if(isJunk(w.meaning)) return {ok:false,msg:'junk meaning'};
    if(w.meaningDistractors.some(function(d){ return isJunk(d); })) return {ok:false,msg:'junk meaning distractor'};
    return {ok:true,msg:'ok'};
  }
  function checkSentences(w){
    var s = w.sentences||{};
    if(!s.correct || !Array.isArray(s.wrong) || s.wrong.length!==2) return {ok:false,msg:'sentence shape'};
    var all = [s.correct].concat(s.wrong);
    var re = new RegExp('\\b'+w.word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
    var missing = all.filter(function(t){ return !re.test(t); });
    if(missing.length) return {ok:false,msg:'sentence missing the word'};
    return {ok:true,msg:'ok'};
  }
  function checkSynonym(w){
    if(!w.synonym || !Array.isArray(w.synonymDistractors) || w.synonymDistractors.length!==2) return {ok:false,msg:'synonym shape'};
    if(w.synonymDistractors.indexOf(w.synonym)!==-1) return {ok:false,msg:'synonym == a distractor'};
    if(isJunk(w.synonym, w.word)) return {ok:false,msg:'junk synonym'};
    if(w.synonymDistractors.some(function(d){ return isJunk(d, w.word); })) return {ok:false,msg:'junk synonym distractor'};
    return {ok:true,msg:'ok'};
  }
  function validateEntry(w){
    var fails = [];
    [['morphemes',checkMorphemes],['syllables',checkSyllables],['phonemes',checkPhonemes],
     ['meaning',checkMeaning],['sentences',checkSentences],['synonym',checkSynonym]]
      .forEach(function(pair){ var r=pair[1](w); if(!r.ok) fails.push(pair[0]+': '+r.msg); });
    return {ok:fails.length===0, fails:fails};
  }
  var api = {validateEntry:validateEntry, checkMorphemes:checkMorphemes, checkSyllables:checkSyllables,
    checkPhonemes:checkPhonemes, checkMeaning:checkMeaning, checkSentences:checkSentences, checkSynonym:checkSynonym};
  if(typeof module!=='undefined' && module.exports) module.exports = api;
  if(root) root.WSInvariants = api;
})(typeof window!=='undefined'?window:null);
