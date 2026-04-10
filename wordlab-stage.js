// Word Labs — Stage utility module
// Provides stage definitions, filtering, and mastery calculation
// Loaded via <script src="wordlab-stage.js"></script> before game scripts

(function(global){
  'use strict';

  var STAGE_ORDER = ['s2e','s2l','s3e','s3l','s4'];

  var STAGE_NAMES = {
    s2e: 'Explorer',
    s2l: 'Voyager',
    s3e: 'Wanderer',
    s3l: 'Trailblazer',
    s4:  'Pioneer'
  };

  var STAGE_LABELS = {
    s2e: 'Stage 2 Early (~Y3)',
    s2l: 'Stage 2 Late (~Y4)',
    s3e: 'Stage 3 Early (~Y5)',
    s3l: 'Stage 3 Late (~Y6)',
    s4:  'Beyond curriculum'
  };

  var STAGE_SHORT = {
    s2e: 'EXP',
    s2l: 'VOY',
    s3e: 'WAN',
    s3l: 'TRL',
    s4:  'PIO'
  };

  var CORE_GAMES = [
    'sound-sorter',
    'phoneme-splitter',
    'syllable-splitter',
    'breakdown-blitz',
    'meaning-mode',
    'mission-mode'
  ];

  function stageIndex(stage){
    if (!stage) return -1;
    return STAGE_ORDER.indexOf(stage);
  }

  function nextStage(stage){
    var i = stageIndex(stage);
    if (i < 0 || i >= STAGE_ORDER.length - 1) return null;
    return STAGE_ORDER[i + 1];
  }

  function stagesAtOrBelow(stage){
    var i = stageIndex(stage);
    if (i < 0) return [];
    return STAGE_ORDER.slice(0, i + 1);
  }

  function visibleStages(stage, extEnabled){
    var stages = stagesAtOrBelow(stage);
    if (extEnabled) {
      var next = nextStage(stage);
      if (next) stages.push(next);
    }
    return stages;
  }

  function isItemVisible(itemStage, studentStage, extEnabled){
    if (itemStage == null) return true;     // untagged = always visible
    if (!studentStage) return true;          // student has no stage = show everything
    var visible = visibleStages(studentStage, extEnabled);
    return visible.indexOf(itemStage) !== -1;
  }

  function isCurrentStage(itemStage, studentStage, extEnabled){
    if (itemStage == null) return false;
    if (!studentStage) return false;
    if (itemStage === studentStage) return true;
    if (extEnabled && itemStage === nextStage(studentStage)) return true;
    return false;
  }

  function shuffle(arr){
    for (var i = arr.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  // Head-weighted shuffle: the first ~N items of the returned array follow a
  // 4:1 ratio of current-stage to below-stage items (80/20), with untagged
  // items blended into the current-stage slots. Once current-stage items are
  // exhausted, the remainder of the output is filled with untagged and below-
  // stage items in fallback order. Games typically consume only the first N
  // items per round, so the head region is what matters for the 80/20 target.
  //
  // Do NOT re-shuffle the returned array — that discards the weighting.
  function weightPool(items, studentStage, extEnabled){
    if (!studentStage) return items.slice();
    var current = [];
    var below = [];
    var untagged = [];
    for (var i=0; i<items.length; i++){
      var it = items[i];
      var s = it.stage;
      if (s == null) untagged.push(it);
      else if (isCurrentStage(s, studentStage, extEnabled)) current.push(it);
      else below.push(it);
    }
    shuffle(current); shuffle(below); shuffle(untagged);

    var out = [];
    var curIdx = 0, belowIdx = 0, untIdx = 0;
    var totalLen = current.length + below.length + untagged.length;
    for (var k=0; k<totalLen; k++){
      var slot = k % 5;
      if (slot === 4 && belowIdx < below.length) {
        out.push(below[belowIdx++]);
      } else if (curIdx < current.length) {
        out.push(current[curIdx++]);
      } else if (untIdx < untagged.length) {
        out.push(untagged[untIdx++]);
      } else if (belowIdx < below.length) {
        out.push(below[belowIdx++]);
      }
    }
    return out;
  }

  // Calculate per-game mastery for a student at their current stage.
  // progressRows: rows from student_progress
  // taggedCategories: { activity: Set<category> } of categories at student's stage
  // Returns: { overall: 0-1, perGame: { [activity]: 0-1 or null } }
  //
  // DESIGN NOTE: A game with no attempts returns `null` in perGame but counts
  // as 0 in the overall average. This is intentional — it penalises students
  // who ignore some of the 6 core games, and drives the "Try this one!" nudge
  // on the landing page mastery panel. A student who plays only 3 of 6 games
  // at 100% accuracy has overall = 0.5, same as a student who plays all 6 at
  // 50%. Do NOT "fix" this by excluding null games from the denominator.
  function calcMastery(progressRows, studentStage, taggedCategories){
    var perGame = {};
    CORE_GAMES.forEach(function(g){ perGame[g] = null; });

    if (!studentStage || !taggedCategories) {
      return { overall: 0, perGame: perGame };
    }

    var totals = {};
    progressRows.forEach(function(row){
      if (CORE_GAMES.indexOf(row.activity) === -1) return;
      var tagged = taggedCategories[row.activity];
      if (!tagged || !tagged.has(row.category)) return;
      if (!totals[row.activity]) totals[row.activity] = { correct: 0, total: 0 };
      totals[row.activity].correct += row.correct || 0;
      totals[row.activity].total += row.total || 0;
    });

    CORE_GAMES.forEach(function(g){
      var t = totals[g];
      if (t && t.total > 0) {
        perGame[g] = t.correct / t.total;
      }
    });

    var sum = 0;
    CORE_GAMES.forEach(function(g){
      sum += (perGame[g] || 0);
    });
    var overall = sum / CORE_GAMES.length;

    return { overall: overall, perGame: perGame };
  }

  function subLevel(mastery){
    if (mastery >= 0.75) return 4;
    if (mastery >= 0.50) return 3;
    if (mastery >= 0.25) return 2;
    return 1;
  }

  function levelLabel(stage, mastery){
    if (!stage) return '';
    return STAGE_NAMES[stage] + ' ' + subLevel(mastery);
  }

  Object.freeze(STAGE_ORDER);
  Object.freeze(STAGE_NAMES);
  Object.freeze(STAGE_LABELS);
  Object.freeze(STAGE_SHORT);
  Object.freeze(CORE_GAMES);

  global.WLStage = {
    STAGE_ORDER: STAGE_ORDER,
    STAGE_NAMES: STAGE_NAMES,
    STAGE_LABELS: STAGE_LABELS,
    STAGE_SHORT: STAGE_SHORT,
    CORE_GAMES: CORE_GAMES,
    stageIndex: stageIndex,
    nextStage: nextStage,
    stagesAtOrBelow: stagesAtOrBelow,
    visibleStages: visibleStages,
    isItemVisible: isItemVisible,
    isCurrentStage: isCurrentStage,
    weightPool: weightPool,
    calcMastery: calcMastery,
    subLevel: subLevel,
    levelLabel: levelLabel
  };
})(window);
