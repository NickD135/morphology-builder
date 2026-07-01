// wordlab-shop-data.js — shared Lab Shop catalogue
// Source: SHOP object in scientist.html (~lines 629–773), copied verbatim.
// Arrays renamed to match the WLShopData interface:
//   coatColors      → colours    (24 items)
//   coatPatterns    → patterns   (10 items)
//   headAccessories → heads      (27 items)
//   faceAccessories → faces      (19 items)
//   wings           → wings       (5 items)
// SHOP.dances is a tier-keyed object in the source; flattened into an array of 22
// items here, each item gaining a `tier` property (e.g. 'correct', 'streak3', …).
// rarityOf: item.rarity || (item.legendary ? 'legendary' : 'common'), matching
// the implicit rarity logic used throughout scientist.html.
(function(){
  const SHOP = {
    coatColors: [
      {id:'#ffffff',   name:'Classic White',    cost:0,   free:true},
      {id:'#bfdbfe',   name:'Lab Blue',         cost:50},
      {id:'#bbf7d0',   name:'Mint Green',       cost:50},
      {id:'#ddd6fe',   name:'Lavender',         cost:50},
      {id:'#fed7aa',   name:'Peach',            cost:50},
      {id:'#fef08a',   name:'Sunshine Yellow',  cost:50},
      {id:'#fecaca',   name:'Red Alert',        cost:80},
      {id:'#1e1b4b',   name:'Midnight Black',   cost:150},
      {id:'#fbbf24',   name:'Gold Rush',        cost:200},
      {id:'#d1fae5',   name:'Emerald Glow',     cost:80},
      {id:'#fce7f3',   name:'Bubble Gum',       cost:80},
      {id:'#374151',   name:'Graphite',         cost:150},
      {id:'#7c3aed',   name:'Deep Purple',      cost:150},
      {id:'#fef3c7',   name:'Cream',            cost:50},
      {id:'#0ea5e9',   name:'Ocean Blue',       cost:80},
      {id:'#f43f5e',   name:'Coral',            cost:80},
      {id:'#14b8a6',   name:'Turquoise',        cost:100},
      {id:'#84cc16',   name:'Lime Zest',        cost:80},
      {id:'#f97316',   name:'Flame Orange',     cost:100},
      {id:'#06b6d4',   name:'Ice Blue',         cost:120},
      {id:'#166534',   name:'Forest Green',     cost:150},
      {id:'#be185d',   name:'Hot Pink',         cost:150},
      {id:'holographic',name:'Holographic',     cost:800, legendary:true},
      {id:'rainbow',   name:'Rainbow Lab',      cost:500, legendary:true},
    ],
    coatPatterns: [
      {id:'plain',     name:'Plain',      cost:0,   free:true},
      {id:'stripes',   name:'Stripes',    cost:100},
      {id:'molecules', name:'Molecules',  cost:150},
      {id:'stars',     name:'Stars',      cost:120},
      {id:'dots',      name:'Polka Dots',  cost:100},
      {id:'chevrons',  name:'Chevrons',    cost:120},
      {id:'hearts',    name:'Hearts',      cost:100},
      {id:'lightning', name:'Lightning',   cost:150},
      {id:'dna',       name:'DNA Helix',   cost:200},
      {id:'plaid',     name:'Plaid',       cost:120},
    ],
    // Skin tones — always FREE (identity, not a purchasable cosmetic). An
    // inclusive light→deep range plus two playful fantasy tones. Every value is
    // a plain hex the dimensional shading derives from at render time, so all
    // tones shade correctly. Default is Peaches (#FDBCB4 — buildSVG's fallback).
    skinTones: [
      {id:'#FBE3D6', name:'Porcelain',     cost:0, free:true},
      {id:'#FDBCB4', name:'Peaches',       cost:0, free:true},
      {id:'#F5CBA7', name:'Fair',          cost:0, free:true},
      {id:'#E8B78D', name:'Warm Beige',    cost:0, free:true},
      {id:'#D6A06A', name:'Honey',         cost:0, free:true},
      {id:'#C68642', name:'Golden',        cost:0, free:true},
      {id:'#A9744F', name:'Chestnut',      cost:0, free:true},
      {id:'#8D5524', name:'Caramel',       cost:0, free:true},
      {id:'#6F4530', name:'Cocoa',         cost:0, free:true},
      {id:'#4E3324', name:'Espresso',      cost:0, free:true},
      {id:'#7FBF7F', name:'Alien Green',   cost:0, free:true},
      {id:'#B39DDB', name:'Cosmic Violet', cost:0, free:true},
    ],
    headAccessories: [
      {id:'none',        name:'None',           cost:0,  free:true,  icon:'❌'},
      {id:'goggles_head',name:'Goggles',        cost:80,             icon:'🥽'},
      {id:'grad_cap',    name:'Grad Cap',       cost:120,            icon:'🎓'},
      {id:'top_hat',     name:'Top Hat',        cost:150,            icon:'🎩'},
      {id:'hard_hat',    name:'Hard Hat',       cost:100,            icon:'⛑️'},
      {id:'beanie',        name:'Beanie',         cost:80,              icon:'🧢'},
      {id:'party_hat',     name:'Party Hat',      cost:50,              icon:'🎉'},
      {id:'wizard_hat',    name:'Wizard Hat',     cost:200,             icon:'🪄'},
      {id:'space_helmet',  name:'Space Helmet',  cost:250,            icon:'🪐'},
      {id:'chef_hat',      name:'Chef Hat',      cost:100,            icon:'👨‍🍳'},
      {id:'pirate_hat',    name:'Pirate Hat',    cost:150,            icon:'🏴‍☠️'},
      {id:'headphones',    name:'Headphones',    cost:120,            icon:'🎧'},
      {id:'cat_ears',      name:'Cat Ears',      cost:80,             icon:'😺'},
      {id:'bunny_ears',    name:'Bunny Ears',    cost:100,            icon:'🐰'},
      {id:'dino_spikes',   name:'Dino Spikes',   cost:150,            icon:'🦕'},
      {id:'unicorn_horn',  name:'Unicorn Horn',  cost:200,            icon:'🦄'},
      {id:'propeller_cap', name:'Propeller Cap', cost:60,             icon:'🧢'},
      {id:'tiara',         name:'Tiara',         cost:180,            icon:'👸'},
      {id:'viking_helmet', name:'Viking Helmet', cost:200,            icon:'⚔️'},
      {id:'antenna',       name:'Antenna',       cost:300,            icon:'👽'},
      {id:'flower_crown',  name:'Flower Crown',   cost:0,  requiresBadge:'all_activities', icon:'🌸'},
      {id:'halo',          name:'Halo',           cost:0,  requiresBadge:'answered_200',   icon:'😇'},
      {id:'ninja_headband',name:'Ninja Headband', cost:0,  requiresBadge:'streak_15',      icon:'🥷'},
      {id:'crown',         name:'Crown',          cost:0,  legendary:true, requiresBadge:'legend_morpheme', icon:'👑'},
      {id:'flame_crown',   name:'Flame Crown',    cost:600, legendary:true, requiresBadge:'streak_20',       icon:'🔥'},
      {id:'ice_crown',     name:'Ice Crown',      cost:500, legendary:true, requiresBadge:'answered_500',    icon:'❄️'},
      {id:'galaxy_halo',   name:'Galaxy Halo',    cost:800, legendary:true, requiresBadge:'legend_sessions', icon:'🌌'},
    ],
    faceAccessories: [
      {id:'none',           name:'None',          cost:0, free:true,  icon:'❌'},
      {id:'glasses',        name:'Glasses',       cost:60,            icon:'👓'},
      {id:'monocle',        name:'Monocle',       cost:100,           icon:'🧐'},
      {id:'safety_goggles', name:'Safety Goggles',cost:80,            icon:'🥽'},
      {id:'mask',             name:'Lab Mask',        cost:60,                            icon:'😷'},
      {id:'sunglasses',       name:'Sunglasses',      cost:80,                            icon:'🕶️'},
      {id:'star_sticker',     name:'Star Sticker',    cost:50,                            icon:'⭐'},
      {id:'eye_patch',     name:'Eye Patch',     cost:60,             icon:'🏴‍☠️'},
      {id:'moustache',     name:'Moustache',     cost:80,             icon:'🥸'},
      {id:'round_glasses', name:'Round Glasses',  cost:70,             icon:'🤓'},
      {id:'bandaid',       name:'Bandaid',        cost:40,             icon:'🩹'},
      {id:'blush',         name:'Rosy Cheeks',    cost:50,             icon:'😊'},
      {id:'face_paint',    name:'Face Paint',     cost:100,            icon:'⚡'},
      {id:'bubble_gum',    name:'Bubble Gum',     cost:60,             icon:'🫧'},
      {id:'nose_bandage',  name:'Lab Accident',   cost:40,             icon:'🤕'},
      {id:'magnifying_glass', name:'Magnifying Glass',cost:0, requiresBadge:'answered_100', icon:'🔍'},
      {id:'laser_eyes',      name:'Laser Eyes',      cost:700, legendary:true, requiresBadge:'legend_streak',    icon:'🔴'},
      {id:'diamond_monocle', name:'Diamond Monocle', cost:500, legendary:true, requiresBadge:'quarks_1000',      icon:'💎'},
      {id:'glowing_mask',    name:'Glowing Mask',    cost:400, legendary:true, requiresBadge:'legend_collector', icon:'🎭'},
    ],
    wings: [
      {id:'none',          name:'None',           cost:0,   free:true,  icon:'❌'},
      {id:'angel_wings',   name:'Angel Wings',    cost:600, legendary:true, requiresBadge:'answered_750',     icon:'🪽'},
      {id:'fire_wings',    name:'Fire Wings',     cost:800, legendary:true, requiresBadge:'legend_streak',    icon:'🔥'},
      {id:'crystal_wings', name:'Crystal Wings',  cost:700, legendary:true, requiresBadge:'legend_morpheme',  icon:'💎'},
      {id:'shadow_wings',  name:'Shadow Wings',   cost:900, legendary:true, requiresBadge:'legend_polymath',  icon:'🖤'},
    ],
  };

  // SHOP.dances in scientist.html is a tier-keyed object, not a flat array.
  // Flattened here into an array of 22 items; each item gains a `tier` property
  // so that Task 6 (dances tab) can reconstruct per-tier sections if needed.
  const DANCES = [
    // tier: correct (3)
    {id:'bounce',   name:'Bounce',     cost:0,   free:true, icon:'⬆️',  desc:'Simple bounce (default)',         tier:'correct'},
    {id:'nod',      name:'Nod',        cost:30,             icon:'😄',  desc:'Happy nod side to side',          tier:'correct'},
    {id:'wink',     name:'Wink',       cost:50,             icon:'😉',  desc:'Playful wink and scale',          tier:'correct'},
    // tier: streak3 (3)
    {id:'default3', name:'Excited',    cost:0,   free:true, icon:'😃',  desc:'Default streak reaction',         tier:'streak3'},
    {id:'spin',     name:'Spin',       cost:60,             icon:'🌀',  desc:'Full 360 spin',                   tier:'streak3'},
    {id:'hop',      name:'Hop',        cost:80,             icon:'🦘',  desc:'Happy multi-hop',                 tier:'streak3'},
    // tier: streak5 (4)
    {id:'default5', name:'Streak Bounce',cost:0, free:true, icon:'✨',  desc:'Default bounce',                  tier:'streak5'},
    {id:'backflip', name:'Backflip',   cost:120,            icon:'🤸',  desc:'Full rotation flip',              tier:'streak5'},
    {id:'moonwalk', name:'Moonwalk',   cost:150,            icon:'🕺',  desc:'Slide left and right',            tier:'streak5'},
    {id:'wave',     name:'Wave',       cost:100,            icon:'👋',  desc:'Excited wave',                    tier:'streak5'},
    // tier: streak10 (4)
    {id:'default10',name:'Big Bounce', cost:0,   free:true, icon:'⚡',  desc:'Default big bounce',              tier:'streak10'},
    {id:'rocket',   name:'Rocket Launch',cost:200,          icon:'🚀',  desc:'Fly up and back down',            tier:'streak10'},
    {id:'disco',    name:'Disco',      cost:250,            icon:'🪩',  desc:'Flash rainbow colours',           tier:'streak10'},
    {id:'breakdance',name:'Breakdance',cost:220,            icon:'🤖',  desc:'Spin and scale',                  tier:'streak10'},
    // tier: streak15 (4)
    {id:'default15',name:'Celebration',cost:0,   free:true, icon:'🎉',  desc:'Default celebration',             tier:'streak15'},
    {id:'fireworks',name:'Fireworks',  cost:400,            icon:'🎆',  desc:'Burst and scale',                 tier:'streak15'},
    {id:'victory',  name:'Victory Lap',cost:350,            icon:'🏆',  desc:'Triumphant orbit',                tier:'streak15'},
    {id:'supersaiyan',name:'Super Saiyan',cost:450,         icon:'💥',  desc:'Power up glow',                  tier:'streak15'},
    // tier: streak30 (4)
    {id:'default30',name:'Legendary',  cost:0,   free:true, icon:'🌈',  desc:'Default legendary',               tier:'streak30'},
    {id:'portal',   name:'Portal Warp',cost:800,  legendary:true, icon:'🌀',  desc:'Warp in and out of existence', tier:'streak30'},
    {id:'quantum',  name:'Quantum Dance',cost:1000,legendary:true,icon:'⚛️', desc:'Glitch through dimensions',   tier:'streak30'},
    {id:'supernova',name:'Supernova',  cost:900,  legendary:true, icon:'🌟',  desc:'Explode and reform',          tier:'streak30'},
  ];

  function buildWorlds() {
    if (typeof WLWorlds === 'undefined' || !WLWorlds.WORLDS) return [];
    return Object.entries(WLWorlds.WORLDS).map(function (e) {
      var id = e[0], w = e[1];
      return { id:id, name:w.name, cost:w.cost||0, free:(w.cost||0)===0,
               rarity:w.rarity||'common', wall:w.wall };
    });
  }

  window.WLShopData = {
    colours:  SHOP.coatColors,
    skinTones: SHOP.skinTones,
    patterns: SHOP.coatPatterns,
    heads:    SHOP.headAccessories,
    faces:    SHOP.faceAccessories,
    wings:    SHOP.wings,
    dances:   DANCES,
    // Mirror of the tier-keyed object from scientist.html, for code that needs
    // per-tier section access (e.g. Task 6 dance section renderer).
    dancesByTier: {
      correct:  DANCES.filter(d => d.tier === 'correct'),
      streak3:  DANCES.filter(d => d.tier === 'streak3'),
      streak5:  DANCES.filter(d => d.tier === 'streak5'),
      streak10: DANCES.filter(d => d.tier === 'streak10'),
      streak15: DANCES.filter(d => d.tier === 'streak15'),
      streak30: DANCES.filter(d => d.tier === 'streak30'),
    },
    rarityOf: function(item){
      // Matches scientist.html's implicit rarity logic:
      // DB shop_items carry an explicit rarity string; inline SHOP items use
      // legendary:true (legendary) or nothing (common).
      return item.rarity || (item.legendary ? 'legendary' : 'common');
    },
    get worlds(){ return buildWorlds(); }
  };
})();
