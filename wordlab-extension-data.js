// ─────────────────────────────────────────────────────────────────────────────
// Word Lab — Extension Mode Data
// Loaded by every game page when a student has extensionMode: true
// Mirrors the exact structure of data.js and the inline arrays in each game.
// ─────────────────────────────────────────────────────────────────────────────

// ── PREFIXES ─────────────────────────────────────────────────────────────────

const EXT_PREFIXES = [
  { id:"ambi",   form:"ambi",   display:"ambi-",   meaning:"both; on both sides",        allowedPos:["noun","adj"],        examples:["<u>ambi</u>dextrous","<u>ambi</u>valent","<u>ambi</u>ance"] },
  { id:"amphi",  form:"amphi",  display:"amphi-",  meaning:"around; both",               allowedPos:["noun","adj"],        examples:["<u>amphi</u>theatre","<u>amphi</u>bian","<u>amphi</u>bious"] },
  { id:"ante",   form:"ante",   display:"ante-",   meaning:"before; in front of",        allowedPos:["noun","adj","verb"], examples:["<u>ante</u>cedent","<u>ante</u>room","<u>ante</u>date"] },
  { id:"bene",   form:"bene",   display:"bene-",   meaning:"good; well",                 allowedPos:["noun","adj","verb"], examples:["<u>bene</u>fit","<u>bene</u>factor","<u>bene</u>volent"] },
  { id:"bi",     form:"bi",     display:"bi-",     meaning:"two; twice",                 allowedPos:["noun","adj"],        examples:["<u>bi</u>cycle","<u>bi</u>lingual","<u>bi</u>annual"] },
  { id:"cata",   form:"cata",   display:"cata-",   meaning:"down; against; completely",  allowedPos:["noun","verb"],       examples:["<u>cata</u>logue","<u>cata</u>strophe","<u>cata</u>lyst"] },
  { id:"chrono", form:"chrono", display:"chrono-", meaning:"time",                       allowedPos:["noun","adj"],        examples:["<u>chrono</u>logy","<u>chrono</u>logical","<u>chrono</u>meter"] },
  { id:"circum", form:"circum", display:"circum-", meaning:"around",                     allowedPos:["noun","adj","verb"], examples:["<u>circum</u>ference","<u>circum</u>navigate","<u>circum</u>stance"] },
  { id:"crypto", form:"crypto", display:"crypto-", meaning:"hidden; secret",             allowedPos:["noun","adj"],        examples:["<u>crypto</u>graphy","<u>crypto</u>gam","<u>crypto</u>currency"] },
  { id:"demi",   form:"demi",   display:"demi-",   meaning:"half; partial",              allowedPos:["noun","adj"],        examples:["<u>demi</u>god","<u>demi</u>john","<u>demi</u>tasse"] },
  { id:"dia",    form:"dia",    display:"dia-",    meaning:"through; across",            allowedPos:["noun","adj"],        examples:["<u>dia</u>meter","<u>dia</u>lect","<u>dia</u>gnosis"] },
  { id:"eu",     form:"eu",     display:"eu-",     meaning:"good; well; pleasant",       allowedPos:["noun","adj"],        examples:["<u>eu</u>phemism","<u>eu</u>phoria","<u>eu</u>logy"] },
  { id:"geo",    form:"geo",    display:"geo-",    meaning:"earth",                      allowedPos:["noun","adj"],        examples:["<u>geo</u>graphy","<u>geo</u>logy","<u>geo</u>thermal"] },
  { id:"hemi",   form:"hemi",   display:"hemi-",   meaning:"half",                       allowedPos:["noun","adj"],        examples:["<u>hemi</u>sphere","<u>hemi</u>cycle","<u>hemi</u>plegia"] },
  { id:"hetero", form:"hetero", display:"hetero-", meaning:"different; other",           allowedPos:["noun","adj"],        examples:["<u>hetero</u>geneous","<u>hetero</u>dox","<u>hetero</u>phone"] },
  { id:"homo",   form:"homo",   display:"homo-",   meaning:"same",                       allowedPos:["noun","adj"],        examples:["<u>homo</u>geneous","<u>homo</u>phone","<u>homo</u>graph"] },
  { id:"hypo",   form:"hypo",   display:"hypo-",   meaning:"under; below normal",        allowedPos:["noun","adj"],        examples:["<u>hypo</u>thesis","<u>hypo</u>thetical","<u>hypo</u>thermia"] },
  { id:"infra",  form:"infra",  display:"infra-",  meaning:"below; beneath",             allowedPos:["noun","adj"],        examples:["<u>infra</u>red","<u>infra</u>structure","<u>infra</u>sonic"] },
  { id:"macro",  form:"macro",  display:"macro-",  meaning:"large; long",               allowedPos:["noun","adj"],        examples:["<u>macro</u>economics","<u>macro</u>cosm","<u>macro</u>biotic"] },
  { id:"meta",   form:"meta",   display:"meta-",   meaning:"beyond; about; change",     allowedPos:["noun","adj"],        examples:["<u>meta</u>morphosis","<u>meta</u>phor","<u>meta</u>data"] },
  { id:"mono",   form:"mono",   display:"mono-",   meaning:"one; single",               allowedPos:["noun","adj"],        examples:["<u>mono</u>logue","<u>mono</u>tone","<u>mono</u>lith"] },
  { id:"neo",    form:"neo",    display:"neo-",    meaning:"new; recent",               allowedPos:["noun","adj"],        examples:["<u>neo</u>classical","<u>neo</u>lithic","<u>neo</u>logism"] },
  { id:"omni",   form:"omni",   display:"omni-",   meaning:"all; every",               allowedPos:["noun","adj"],        examples:["<u>omni</u>vore","<u>omni</u>present","<u>omni</u>scient"] },
  { id:"para",   form:"para",   display:"para-",   meaning:"beside; beyond; against",  allowedPos:["noun","adj"],        examples:["<u>para</u>dox","<u>para</u>llel","<u>para</u>phrase"] },
  { id:"peri",   form:"peri",   display:"peri-",   meaning:"around; near",             allowedPos:["noun","adj"],        examples:["<u>peri</u>scope","<u>peri</u>meter","<u>peri</u>phery"] },
  { id:"phil",   form:"phil",   display:"phil-",   meaning:"love; fond of",            allowedPos:["noun","adj"],        examples:["<u>phil</u>osophy","<u>phil</u>anthropy","biblio<u>phil</u>e"] },
  { id:"poly",   form:"poly",   display:"poly-",   meaning:"many; much",               allowedPos:["noun","adj"],        examples:["<u>poly</u>gon","<u>poly</u>glot","<u>poly</u>syllabic"] },
  { id:"pseudo", form:"pseudo", display:"pseudo-", meaning:"false; fake",              allowedPos:["noun","adj"],        examples:["<u>pseudo</u>nym","<u>pseudo</u>science","<u>pseudo</u>code"] },
  { id:"retro",  form:"retro",  display:"retro-",  meaning:"backwards; behind",        allowedPos:["noun","adj","verb"], examples:["<u>retro</u>spect","<u>retro</u>active","<u>retro</u>grade"] },
  { id:"syn",    form:"syn",    display:"syn-",    meaning:"together; with; same",     allowedPos:["noun","adj"],        examples:["<u>syn</u>onym","<u>syn</u>thesis","<u>syn</u>chronise"] },
  { id:"tele",   form:"tele",   display:"tele-",   meaning:"far; at a distance",       allowedPos:["noun","adj"],        examples:["<u>tele</u>phone","<u>tele</u>scope","<u>tele</u>vision"] },
  { id:"tri",    form:"tri",    display:"tri-",    meaning:"three",                    allowedPos:["noun","adj"],        examples:["<u>tri</u>angle","<u>tri</u>cycle","<u>tri</u>lingual"] },
  { id:"ultra",  form:"ultra",  display:"ultra-",  meaning:"beyond; extreme",          allowedPos:["noun","adj"],        examples:["<u>ultra</u>violet","<u>ultra</u>sonic","<u>ultra</u>modern"] },
  { id:"uni",    form:"uni",    display:"uni-",    meaning:"one",                      allowedPos:["noun","adj"],        examples:["<u>uni</u>form","<u>uni</u>verse","<u>uni</u>lateral"] },
  { id:"vice",   form:"vice",   display:"vice-",   meaning:"in place of; deputy",      allowedPos:["noun"],              examples:["<u>vice</u>president","<u>vice</u>captain","<u>vice</u>principal"] },
  { id:"apo",    form:"apo",    display:"apo-",    meaning:"away from; separate",      allowedPos:["noun","adj"],        examples:["<u>apo</u>calypse","<u>apo</u>logy","<u>apo</u>strophe"] },
  { id:"arch",   form:"arch",   display:"arch-",   meaning:"chief; principal",         allowedPos:["noun","adj"],        examples:["<u>arch</u>enemy","<u>arch</u>bishop","<u>arch</u>rival"] },
  { id:"astro",  form:"astro",  display:"astro-",  meaning:"star; outer space",        allowedPos:["noun","adj"],        examples:["<u>astro</u>naut","<u>astro</u>nomy","<u>astro</u>physics"] },
  { id:"auto",   form:"auto",   display:"auto-",   meaning:"self; by itself",          allowedPos:["noun","adj"],        examples:["<u>auto</u>biography","<u>auto</u>matic","<u>auto</u>graph"] },
  { id:"bio",    form:"bio",    display:"bio-",    meaning:"life",                     allowedPos:["noun","adj"],        examples:["<u>bio</u>logy","<u>bio</u>graphy","<u>bio</u>metric"] },
  { id:"cardio", form:"cardio", display:"cardio-", meaning:"heart",                    allowedPos:["noun","adj"],        examples:["<u>cardio</u>vascular","<u>cardio</u>logy","<u>cardio</u>gram"] },
  { id:"cosmo",  form:"cosmo",  display:"cosmo-",  meaning:"universe; world",          allowedPos:["noun","adj"],        examples:["<u>cosmo</u>politan","<u>cosmo</u>logy","<u>cosmo</u>naut"] },
  { id:"cyber",  form:"cyber",  display:"cyber-",  meaning:"computers; internet",      allowedPos:["noun","adj"],        examples:["<u>cyber</u>security","<u>cyber</u>space","<u>cyber</u>crime"] },
  { id:"demo",   form:"demo",   display:"demo-",   meaning:"people",                   allowedPos:["noun","adj"],        examples:["<u>demo</u>cracy","<u>demo</u>graphic","<u>demo</u>crat"] },
  { id:"eco",    form:"eco",    display:"eco-",    meaning:"environment; ecology",     allowedPos:["noun","adj"],        examples:["<u>eco</u>system","<u>eco</u>logy","<u>eco</u>friendly"] },
  { id:"electro",form:"electro",display:"electro-",meaning:"electricity; electric",    allowedPos:["noun","adj"],        examples:["<u>electro</u>magnetic","<u>electro</u>lysis","<u>electro</u>nic"] },
  { id:"ethno",  form:"ethno",  display:"ethno-",  meaning:"people; culture; race",    allowedPos:["noun","adj"],        examples:["<u>ethno</u>graphy","<u>ethno</u>logy","<u>ethno</u>centric"] },
  { id:"gastro", form:"gastro", display:"gastro-", meaning:"stomach; food",            allowedPos:["noun","adj"],        examples:["<u>gastro</u>nomy","<u>gastro</u>enteritis","<u>gastro</u>pub"] },
  { id:"hydro",  form:"hydro",  display:"hydro-",  meaning:"water",                    allowedPos:["noun","adj"],        examples:["<u>hydro</u>electric","<u>hydro</u>logy","<u>hydro</u>gen"] },
  { id:"litho",  form:"litho",  display:"litho-",  meaning:"stone; rock",              allowedPos:["noun","adj"],        examples:["<u>litho</u>graphy","<u>litho</u>sphere","neo<u>litho</u>ic"] },
  { id:"logo",   form:"logo",   display:"logo-",   meaning:"word; reason; study",      allowedPos:["noun","adj"],        examples:["<u>logo</u>type","<u>logo</u>s","<u>logo</u>centric"] },
  { id:"micro",  form:"micro",  display:"micro-",  meaning:"small; tiny",              allowedPos:["noun","adj"],        examples:["<u>micro</u>scope","<u>micro</u>chip","<u>micro</u>biology"] },
  { id:"morpho", form:"morpho", display:"morpho-", meaning:"form; shape",              allowedPos:["noun","adj"],        examples:["<u>morpho</u>logy","<u>morpho</u>logical","geo<u>morpho</u>logy"] },
  { id:"narco",  form:"narco",  display:"narco-",  meaning:"sleep; numbness",          allowedPos:["noun","adj"],        examples:["<u>narco</u>lepsy","<u>narco</u>sis","<u>narco</u>tic"] },
  { id:"neuro",  form:"neuro",  display:"neuro-",  meaning:"nerve; nervous system",    allowedPos:["noun","adj"],        examples:["<u>neuro</u>logy","<u>neuro</u>science","<u>neuro</u>sis"] },
  { id:"ortho",  form:"ortho",  display:"ortho-",  meaning:"straight; correct",        allowedPos:["noun","adj"],        examples:["<u>ortho</u>dox","<u>ortho</u>graphy","<u>ortho</u>paedic"] },
  { id:"paleo",  form:"paleo",  display:"paleo-",  meaning:"ancient; early",           allowedPos:["noun","adj"],        examples:["<u>paleo</u>ntology","<u>paleo</u>lithic","<u>paleo</u>zoic"] },
  { id:"patho",  form:"patho",  display:"patho-",  meaning:"disease; suffering",       allowedPos:["noun","adj"],        examples:["<u>patho</u>logy","<u>patho</u>gen","<u>patho</u>logical"] },
  { id:"photo",  form:"photo",  display:"photo-",  meaning:"light",                    allowedPos:["noun","adj"],        examples:["<u>photo</u>synthesis","<u>photo</u>graph","<u>photo</u>electric"] },
  { id:"pneumo", form:"pneumo", display:"pneumo-", meaning:"air; lung; breath",        allowedPos:["noun","adj"],        examples:["<u>pneumo</u>nia","<u>pneumo</u>thorax","<u>pneumo</u>coccal"] },
  { id:"proto",  form:"proto",  display:"proto-",  meaning:"first; original",          allowedPos:["noun","adj"],        examples:["<u>proto</u>type","<u>proto</u>col","<u>proto</u>zoa"] },
  { id:"psycho", form:"psycho", display:"psycho-", meaning:"mind; mental",             allowedPos:["noun","adj"],        examples:["<u>psycho</u>logy","<u>psycho</u>analysis","<u>psycho</u>somatic"] },
  { id:"pyro",   form:"pyro",   display:"pyro-",   meaning:"fire",                     allowedPos:["noun","adj"],        examples:["<u>pyro</u>technics","<u>pyro</u>mania","<u>pyro</u>meter"] },
  { id:"socio",  form:"socio",  display:"socio-",  meaning:"society; social",          allowedPos:["noun","adj"],        examples:["<u>socio</u>logy","<u>socio</u>economic","<u>socio</u>path"] },
  { id:"techno", form:"techno", display:"techno-", meaning:"technology; skill",        allowedPos:["noun","adj"],        examples:["<u>techno</u>logy","<u>techno</u>phobe","<u>techno</u>crat"] },
  { id:"thermo", form:"thermo", display:"thermo-", meaning:"heat",                     allowedPos:["noun","adj"],        examples:["<u>thermo</u>meter","<u>thermo</u>stat","<u>thermo</u>dynamic"] },
  { id:"zoo",    form:"zoo",    display:"zoo-",    meaning:"animal; living creature",  allowedPos:["noun","adj"],        examples:["<u>zoo</u>logy","<u>zoo</u>plankton","<u>zoo</u>logical"] },
];

// ── SUFFIXES ─────────────────────────────────────────────────────────────────

const EXT_SUFFIXES = [
  { id:"archy",   form:"archy",  display:"-archy",  meaning:"rule; government",         allowedPos:["noun"],             hint:"monarchy, hierarchy",        examples:["mon<u>archy</u>","hier<u>archy</u>","an<u>archy</u>"] },
  { id:"chrome",  form:"chrome", display:"-chrome", meaning:"colour",                   allowedPos:["noun"],             hint:"monochrome",                  examples:["mono<u>chrome</u>","poly<u>chrome</u>"] },
  { id:"cide",    form:"cide",   display:"-cide",   meaning:"killing; killer",          allowedPos:["noun"],             hint:"homicide, pesticide",         examples:["homi<u>cide</u>","pesti<u>cide</u>","sui<u>cide</u>"] },
  { id:"cracy",   form:"cracy",  display:"-cracy",  meaning:"rule; power",              allowedPos:["noun"],             hint:"democracy, bureaucracy",      examples:["demo<u>cracy</u>","bureau<u>cracy</u>","aristo<u>cracy</u>"] },
  { id:"dox",     form:"dox",    display:"-dox",    meaning:"belief; opinion",          allowedPos:["adj"],              hint:"orthodox, paradox",           examples:["orth<u>odox</u>","para<u>dox</u>","heter<u>odox</u>"] },
  { id:"gamy",    form:"gamy",   display:"-gamy",   meaning:"marriage; union",          allowedPos:["noun"],             hint:"monogamy",                    examples:["mono<u>gamy</u>","poly<u>gamy</u>","bi<u>gamy</u>"] },
  { id:"gen",     form:"gen",    display:"-gen",    meaning:"producing; origin",        allowedPos:["noun"],             hint:"oxygen, hydrogen",            examples:["oxy<u>gen</u>","hydro<u>gen</u>","patho<u>gen</u>"] },
  { id:"genic",   form:"genic",  display:"-genic",  meaning:"producing; suitable for",  allowedPos:["adj"],              hint:"photogenic, carcinogenic",    examples:["photo<u>genic</u>","carci<u>nogenic</u>","patho<u>genic</u>"] },
  { id:"gram",    form:"gram",   display:"-gram",   meaning:"written; recorded",        allowedPos:["noun"],             hint:"telegram, diagram",           examples:["tele<u>gram</u>","dia<u>gram</u>","pro<u>gram</u>"] },
  { id:"graph",   form:"graph",  display:"-graph",  meaning:"writing; recording",       allowedPos:["noun","verb"],      hint:"autograph, photograph",       examples:["auto<u>graph</u>","photo<u>graph</u>","para<u>graph</u>"] },
  { id:"itis",    form:"itis",   display:"-itis",   meaning:"inflammation of",          allowedPos:["noun"],             hint:"appendicitis, tonsillitis",   examples:["append<u>icitis</u>","tonsill<u>itis</u>","arthr<u>itis</u>"] },
  { id:"logue",   form:"logue",  display:"-logue",  meaning:"word; speech",             allowedPos:["noun"],             hint:"monologue, dialogue",         examples:["mono<u>logue</u>","dia<u>logue</u>","pro<u>logue</u>"] },
  { id:"lysis",   form:"lysis",  display:"-lysis",  meaning:"breaking down",            allowedPos:["noun"],             hint:"analysis, paralysis",         examples:["ana<u>lysis</u>","para<u>lysis</u>","dia<u>lysis</u>"] },
  { id:"morph",   form:"morph",  display:"-morph",  meaning:"form; shape",              allowedPos:["noun"],             hint:"morphology",                  examples:["poly<u>morph</u>","iso<u>morph</u>","meta<u>morph</u>osis"] },
  { id:"nomy",    form:"nomy",   display:"-nomy",   meaning:"law; management of",       allowedPos:["noun"],             hint:"astronomy, economy",          examples:["astro<u>nomy</u>","eco<u>nomy</u>","auto<u>nomy</u>"] },
  { id:"oid",     form:"oid",    display:"-oid",    meaning:"resembling; like",         allowedPos:["adj","noun"],       hint:"humanoid, asteroid",          examples:["human<u>oid</u>","aster<u>oid</u>","android"] },
  { id:"ology",   form:"ology",  display:"-ology",  meaning:"study of",                 allowedPos:["noun"],             hint:"biology, psychology",         examples:["bi<u>ology</u>","psycho<u>logy</u>","techno<u>logy</u>"] },
  { id:"pathy",   form:"pathy",  display:"-pathy",  meaning:"feeling; disease",         allowedPos:["noun"],             hint:"sympathy, telepathy",         examples:["sym<u>pathy</u>","tele<u>pathy</u>","empa<u>thy</u>"] },
  { id:"phile",   form:"phile",  display:"-phile",  meaning:"lover of",                 allowedPos:["noun","adj"],       hint:"bibliophile",                 examples:["biblio<u>phile</u>","franco<u>phile</u>","anglo<u>phile</u>"] },
  { id:"phobia",  form:"phobia", display:"-phobia", meaning:"fear of",                  allowedPos:["noun"],             hint:"claustrophobia",              examples:["claustro<u>phobia</u>","agora<u>phobia</u>","xeno<u>phobia</u>"] },
  { id:"phone",   form:"phone",  display:"-phone",  meaning:"sound; voice",             allowedPos:["noun"],             hint:"microphone, telephone",       examples:["micro<u>phone</u>","tele<u>phone</u>","franco<u>phone</u>"] },
  { id:"scope",   form:"scope",  display:"-scope",  meaning:"instrument for viewing",   allowedPos:["noun"],             hint:"telescope, microscope",       examples:["tele<u>scope</u>","micro<u>scope</u>","peri<u>scope</u>"] },
  { id:"tude",    form:"tude",   display:"-tude",   meaning:"state; condition",         allowedPos:["noun"],             hint:"gratitude, magnitude",        examples:["grati<u>tude</u>","magni<u>tude</u>","soli<u>tude</u>"] },
  { id:"vore",    form:"vore",   display:"-vore",   meaning:"feeding on",               allowedPos:["noun"],             hint:"carnivore, herbivore",        examples:["carni<u>vore</u>","herbi<u>vore</u>","omni<u>vore</u>"] },
  { id:"ward",    form:"ward",   display:"-ward",   meaning:"direction; towards",       allowedPos:["adj","adv"],        hint:"onward, inward",              examples:["on<u>ward</u>","in<u>ward</u>","up<u>ward</u>"] },
  { id:"emia",    form:"emia",   display:"-emia",   meaning:"blood condition",          allowedPos:["noun"],             hint:"anaemia, leukaemia",          examples:["an<u>emia</u>","leuk<u>emia</u>","sep<u>emia</u>"] },
  { id:"ase",     form:"ase",    display:"-ase",    meaning:"enzyme",                   allowedPos:["noun"],             hint:"amylase, lipase",             examples:["amyl<u>ase</u>","lip<u>ase</u>","prot<u>ease</u>"] },
  { id:"cyte",    form:"cyte",   display:"-cyte",   meaning:"cell",                     allowedPos:["noun"],             hint:"leucocyte",                   examples:["leuco<u>cyte</u>","erythro<u>cyte</u>","lympho<u>cyte</u>"] },
  { id:"derm",    form:"derm",   display:"-derm",   meaning:"skin layer",               allowedPos:["noun"],             hint:"epiderm",                     examples:["epi<u>derm</u>is","ecto<u>derm</u>","endo<u>derm</u>"] },
  { id:"genesis", form:"genesis",display:"-genesis",meaning:"origin; creation",         allowedPos:["noun"],             hint:"biogenesis",                  examples:["bio<u>genesis</u>","patho<u>genesis</u>","onto<u>genesis</u>"] },
  { id:"hedron",  form:"hedron", display:"-hedron", meaning:"geometric solid face",     allowedPos:["noun"],             hint:"polyhedron, tetrahedron",     examples:["poly<u>hedron</u>","tetra<u>hedron</u>","octa<u>hedron</u>"] },
  { id:"kinesis", form:"kinesis",display:"-kinesis",meaning:"movement; motion",         allowedPos:["noun"],             hint:"telekinesis",                 examples:["tele<u>kinesis</u>","cyto<u>kinesis</u>","hyper<u>kinesis</u>"] },
  { id:"latry",   form:"latry",  display:"-latry",  meaning:"worship; devotion",        allowedPos:["noun"],             hint:"idolatry",                    examples:["idol<u>atry</u>","hero<u>latry</u>","biblio<u>latry</u>"] },
  { id:"mancy",   form:"mancy",  display:"-mancy",  meaning:"divination; prediction",   allowedPos:["noun"],             hint:"necromancy",                  examples:["necro<u>mancy</u>","pyro<u>mancy</u>","geo<u>mancy</u>"] },
  { id:"nym",     form:"nym",    display:"-nym",    meaning:"word; name",               allowedPos:["noun"],             hint:"synonym, antonym",            examples:["syn<u>onym</u>","ant<u>onym</u>","pseud<u>onym</u>"] },
  { id:"plasm",   form:"plasm",  display:"-plasm",  meaning:"form; living substance",   allowedPos:["noun"],             hint:"cytoplasm",                   examples:["cyto<u>plasm</u>","proto<u>plasm</u>","neo<u>plasm</u>"] },
  { id:"pod",     form:"pod",    display:"-pod",    meaning:"foot; leg",                allowedPos:["noun"],             hint:"tripod, arthropod",           examples:["tri<u>pod</u>","artho<u>pod</u>","gastro<u>pod</u>"] },
  { id:"sophy",   form:"sophy",  display:"-sophy",  meaning:"wisdom; knowledge",        allowedPos:["noun"],             hint:"philosophy",                  examples:["philo<u>sophy</u>","theo<u>sophy</u>","anthro<u>posophy</u>"] },
  { id:"stasis",  form:"stasis", display:"-stasis", meaning:"standing still; stability",allowedPos:["noun"],             hint:"homeostasis",                 examples:["homeo<u>stasis</u>","hemo<u>stasis</u>","meta<u>stasis</u>"] },
  { id:"tomy",    form:"tomy",   display:"-tomy",   meaning:"cutting; incision",        allowedPos:["noun"],             hint:"anatomy, lobotomy",           examples:["ana<u>tomy</u>","lobo<u>tomy</u>","dichotomy"] },
  { id:"trophy",  form:"trophy", display:"-trophy", meaning:"nourishment; growth",      allowedPos:["noun"],             hint:"atrophy, hypertrophy",        examples:["a<u>trophy</u>","hyper<u>trophy</u>","photo<u>trophy</u>"] },
  { id:"type",    form:"type",   display:"-type",   meaning:"model; pattern; kind",     allowedPos:["noun"],             hint:"prototype, archetype",        examples:["proto<u>type</u>","arche<u>type</u>","stereo<u>type</u>"] },
  { id:"uria",    form:"uria",   display:"-uria",   meaning:"urine condition",          allowedPos:["noun"],             hint:"glycosuria",                  examples:["glycos<u>uria</u>","hematur<u>ia</u>","poly<u>uria</u>"] },
];

// ── BASES ─────────────────────────────────────────────────────────────────────

const EXT_BASES = [
  { id:"anthrop", form:"anthrop", display:"anthrop", meaning:"human being",          pos:["noun"],        group:"greek", examples:["<u>anthrop</u>ology","philan<u>throp</u>y","<u>anthrop</u>oid"] },
  { id:"arch",    form:"arch",    display:"arch",    meaning:"ancient; chief",       pos:["noun","adj"],  group:"greek", examples:["mon<u>arch</u>","<u>arch</u>ive","<u>arch</u>aeology"] },
  { id:"aster",   form:"aster",   display:"aster",   meaning:"star",                 pos:["noun"],        group:"greek", examples:["<u>aster</u>oid","<u>aster</u>isk","dis<u>aster</u>"] },
  { id:"auto",    form:"auto",    display:"auto",    meaning:"self",                 pos:["adj","noun"],  group:"greek", examples:["<u>auto</u>biography","<u>auto</u>matic","<u>auto</u>graph"] },
  { id:"bio",     form:"bio",     display:"bio",     meaning:"life",                 pos:["noun"],        group:"greek", examples:["<u>bio</u>logy","<u>bio</u>graphy","<u>bio</u>metric"] },
  { id:"cardi",   form:"cardi",   display:"cardi",   meaning:"heart",                pos:["noun"],        group:"greek", examples:["<u>cardi</u>ac","<u>cardi</u>ology","electro<u>cardi</u>ogram"] },
  { id:"chron",   form:"chron",   display:"chron",   meaning:"time",                 pos:["noun"],        group:"greek", examples:["<u>chron</u>icle","<u>chron</u>ological","ana<u>chron</u>ism"] },
  { id:"cosm",    form:"cosm",    display:"cosm",    meaning:"universe; order",      pos:["noun"],        group:"greek", examples:["<u>cosm</u>ology","micro<u>cosm</u>","<u>cosm</u>opolitan"] },
  { id:"dem",     form:"dem",     display:"dem",     meaning:"people",               pos:["noun"],        group:"greek", examples:["<u>dem</u>ocracy","epi<u>dem</u>ic","<u>dem</u>ographic"] },
  { id:"derm",    form:"derm",    display:"derm",    meaning:"skin",                 pos:["noun"],        group:"greek", examples:["<u>derm</u>atology","epi<u>derm</u>is","hypo<u>derm</u>ic"] },
  { id:"dyn",     form:"dyn",     display:"dyn",     meaning:"power; force",         pos:["noun"],        group:"greek", examples:["<u>dyn</u>amic","<u>dyn</u>asty","aero<u>dyn</u>amic"] },
  { id:"gen",     form:"gen",     display:"gen",     meaning:"origin; birth",        pos:["noun","verb"], group:"latin", examples:["<u>gen</u>erate","patho<u>gen</u>","<u>gen</u>etic"] },
  { id:"geo",     form:"geo",     display:"geo",     meaning:"earth",                pos:["noun"],        group:"greek", examples:["<u>geo</u>graphy","<u>geo</u>logy","<u>geo</u>thermal"] },
  { id:"grav",    form:"grav",    display:"grav",    meaning:"heavy; serious",       pos:["adj","noun"],  group:"latin", examples:["<u>grav</u>ity","<u>grav</u>itate","<u>grav</u>elly"] },
  { id:"greg",    form:"greg",    display:"greg",    meaning:"group; flock",         pos:["noun"],        group:"latin", examples:["ag<u>greg</u>ate","con<u>greg</u>ate","seg<u>reg</u>ate"] },
  { id:"luc",     form:"luc",     display:"luc",     meaning:"light",                pos:["noun"],        group:"latin", examples:["<u>luc</u>id","e<u>luc</u>idate","trans<u>luc</u>ent"] },
  { id:"mand",    form:"mand",    display:"mand",    meaning:"order; command",       pos:["verb"],        group:"latin", examples:["com<u>mand</u>","de<u>mand</u>","<u>mand</u>atory"] },
  { id:"morph",   form:"morph",   display:"morph",   meaning:"form; shape",          pos:["noun"],        group:"greek", examples:["<u>morph</u>ology","meta<u>morph</u>osis","poly<u>morph</u>ic"] },
  { id:"mut",     form:"mut",     display:"mut",     meaning:"change",               pos:["verb"],        group:"latin", examples:["<u>mut</u>ate","com<u>mut</u>e","trans<u>mut</u>e"] },
  { id:"nav",     form:"nav",     display:"nav",     meaning:"ship; sail",           pos:["noun","verb"], group:"latin", examples:["<u>nav</u>igate","<u>nav</u>al","circum<u>nav</u>igate"] },
  { id:"nom",     form:"nom",     display:"nom",     meaning:"law; rule; name",      pos:["noun"],        group:"greek", examples:["astro<u>nom</u>y","eco<u>nom</u>y","<u>nom</u>enclature"] },
  { id:"path",    form:"path",    display:"path",    meaning:"feeling; disease",     pos:["noun"],        group:"greek", examples:["em<u>path</u>y","sym<u>path</u>y","tele<u>path</u>y"] },
  { id:"phil",    form:"phil",    display:"phil",    meaning:"love; fondness",       pos:["noun"],        group:"greek", examples:["<u>phil</u>osophy","<u>phil</u>anthropy","biblio<u>phil</u>e"] },
  { id:"phob",    form:"phob",    display:"phob",    meaning:"fear",                 pos:["noun"],        group:"greek", examples:["<u>phob</u>ia","xeno<u>phob</u>ia","claustro<u>phob</u>ia"] },
  { id:"pneum",   form:"pneum",   display:"pneum",   meaning:"breath; air; lung",    pos:["noun"],        group:"greek", examples:["<u>pneum</u>onia","<u>pneum</u>atic","<u>pneum</u>ology"] },
  { id:"poli",    form:"poli",    display:"poli",    meaning:"city; state",          pos:["noun"],        group:"greek", examples:["<u>poli</u>tics","metro<u>polis</u>","cos<u>mopolis</u>"] },
  { id:"psych",   form:"psych",   display:"psych",   meaning:"mind; soul",           pos:["noun"],        group:"greek", examples:["<u>psych</u>ology","<u>psych</u>iatry","<u>psych</u>ic"] },
  { id:"rupt",    form:"rupt",    display:"rupt",    meaning:"break",                pos:["verb"],        group:"latin", examples:["e<u>rupt</u>","inter<u>rupt</u>","dis<u>rupt</u>"] },
  { id:"sol",     form:"sol",     display:"sol",     meaning:"sun; alone",           pos:["noun"],        group:"latin", examples:["<u>sol</u>ar","<u>sol</u>itude","<u>sol</u>stice"] },
  { id:"soph",    form:"soph",    display:"soph",    meaning:"wisdom; knowledge",    pos:["noun"],        group:"greek", examples:["<u>soph</u>isticated","philo<u>soph</u>y","<u>soph</u>omore"] },
  { id:"terr",    form:"terr",    display:"terr",    meaning:"earth; land",          pos:["noun"],        group:"latin", examples:["<u>terr</u>ain","<u>terr</u>itory","Medi<u>terr</u>anean"] },
  { id:"theo",    form:"theo",    display:"theo",    meaning:"god",                  pos:["noun"],        group:"greek", examples:["<u>theo</u>logy","<u>theo</u>rem","apo<u>theo</u>sis"] },
  { id:"therm",   form:"therm",   display:"therm",   meaning:"heat",                 pos:["noun"],        group:"greek", examples:["<u>therm</u>ometer","geo<u>therm</u>al","hypo<u>therm</u>ia"] },
  { id:"tox",     form:"tox",     display:"tox",     meaning:"poison",               pos:["noun"],        group:"greek", examples:["<u>tox</u>ic","<u>tox</u>in","anti<u>tox</u>in"] },
  { id:"typ",     form:"typ",     display:"typ",     meaning:"type; impression",     pos:["noun"],        group:"greek", examples:["arche<u>typ</u>e","proto<u>typ</u>e","stereo<u>typ</u>e"] },
  { id:"zoo",     form:"zoo",     display:"zoo",     meaning:"animal; living being", pos:["noun"],        group:"greek", examples:["<u>zoo</u>logy","<u>zoo</u>plankton","proto<u>zoa</u>"] },
  // Additional bases
  { id:"aqu",     form:"aqu",     display:"aqu",     meaning:"water",                pos:["noun"],        group:"latin", examples:["<u>aqu</u>atic","<u>aqu</u>educt","<u>aqu</u>arium"] },
  { id:"brev",    form:"brev",    display:"brev",    meaning:"short; brief",         pos:["adj"],         group:"latin", examples:["ab<u>brev</u>iate","<u>brev</u>ity","<u>brev</u>iary"] },
  { id:"capit",   form:"capit",   display:"capit",   meaning:"head; chief",          pos:["noun"],        group:"latin", examples:["<u>capit</u>al","de<u>capit</u>ate","<u>capit</u>ulate"] },
  { id:"celer",   form:"celer",   display:"celer",   meaning:"swift; fast",          pos:["adj"],         group:"latin", examples:["ac<u>celer</u>ate","de<u>celer</u>ate","<u>celer</u>ity"] },
  { id:"corp",    form:"corp",    display:"corp",    meaning:"body",                 pos:["noun"],        group:"latin", examples:["<u>corp</u>oral","in<u>corp</u>orate","<u>corp</u>se"] },
  { id:"curs",    form:"curs",    display:"curs",    meaning:"run; go",              pos:["verb"],        group:"latin", examples:["<u>curs</u>or","cur<u>rent</u>","<u>curs</u>ive"] },
  { id:"dent",    form:"dent",    display:"dent",    meaning:"tooth",                pos:["noun"],        group:"latin", examples:["<u>dent</u>ist","in<u>dent</u>","tri<u>dent</u>"] },
  { id:"dom",     form:"dom",     display:"dom",     meaning:"house; master; rule",  pos:["noun"],        group:"latin", examples:["<u>dom</u>estic","free<u>dom</u>","<u>dom</u>inant"] },
  { id:"fid",     form:"fid",     display:"fid",     meaning:"faith; trust",         pos:["noun"],        group:"latin", examples:["con<u>fid</u>ent","in<u>fid</u>el","per<u>fid</u>y"] },
  { id:"fin",     form:"fin",     display:"fin",     meaning:"end; limit",           pos:["noun","verb"], group:"latin", examples:["<u>fin</u>al","de<u>fin</u>e","in<u>fin</u>ite"] },
  { id:"flu",     form:"flu",     display:"flu",     meaning:"flow",                 pos:["verb"],        group:"latin", examples:["<u>flu</u>id","in<u>flu</u>ence","af<u>flu</u>ent"] },
  { id:"fract",   form:"fract",   display:"fract",   meaning:"break",                pos:["verb"],        group:"latin", examples:["<u>fract</u>ure","re<u>fract</u>","in<u>fract</u>ion"] },
  { id:"grad",    form:"grad",    display:"grad",    meaning:"step; degree; go",     pos:["verb","noun"], group:"latin", examples:["<u>grad</u>ual","up<u>grad</u>e","retro<u>grad</u>e"] },
  { id:"junct",   form:"junct",   display:"junct",   meaning:"join",                 pos:["verb"],        group:"latin", examples:["con<u>junct</u>ion","in<u>junct</u>ion","dis<u>junct</u>"] },
  { id:"lateral", form:"lateral", display:"lateral", meaning:"side",                 pos:["adj"],         group:"latin", examples:["uni<u>lateral</u>","bi<u>lateral</u>","col<u>lateral</u>"] },
  { id:"liber",   form:"liber",   display:"liber",   meaning:"free",                 pos:["adj","verb"],  group:"latin", examples:["<u>liber</u>ty","<u>liber</u>ate","<u>liber</u>al"] },
  { id:"liter",   form:"liter",   display:"liter",   meaning:"letter; writing",      pos:["noun"],        group:"latin", examples:["<u>liter</u>ature","<u>liter</u>al","il<u>liter</u>ate"] },
  { id:"loc",     form:"loc",     display:"loc",     meaning:"place",                pos:["noun"],        group:"latin", examples:["<u>loc</u>ation","re<u>loc</u>ate","dis<u>loc</u>ate"] },
  { id:"magn",    form:"magn",    display:"magn",    meaning:"great; large",         pos:["adj"],         group:"latin", examples:["<u>magn</u>ify","<u>magn</u>itude","<u>magn</u>ificent"] },
  { id:"man",     form:"man",     display:"man",     meaning:"hand",                 pos:["noun"],        group:"latin", examples:["<u>man</u>uscript","<u>man</u>ual","mani<u>pul</u>ate"] },
  { id:"mar",     form:"mar",     display:"mar",     meaning:"sea",                  pos:["noun"],        group:"latin", examples:["<u>mar</u>ine","sub<u>mar</u>ine","<u>mar</u>itime"] },
  { id:"mem",     form:"mem",     display:"mem",     meaning:"memory; remember",     pos:["noun","verb"], group:"latin", examples:["<u>mem</u>ory","com<u>mem</u>orate","<u>mem</u>oir"] },
  { id:"min",     form:"min",     display:"min",     meaning:"small; lessen",        pos:["adj","verb"],  group:"latin", examples:["<u>min</u>iature","<u>min</u>imum","di<u>min</u>ish"] },
  { id:"miss",    form:"miss",    display:"miss",    meaning:"send",                 pos:["verb"],        group:"latin", examples:["dis<u>miss</u>","<u>miss</u>ion","re<u>miss</u>"] },
  { id:"mob",     form:"mob",     display:"mob",     meaning:"move",                 pos:["verb"],        group:"latin", examples:["im<u>mob</u>ile","<u>mob</u>ilise","auto<u>mob</u>ile"] },
  { id:"mort",    form:"mort",    display:"mort",    meaning:"death",                pos:["noun"],        group:"latin", examples:["<u>mort</u>al","im<u>mort</u>al","<u>mort</u>uary"] },
  { id:"narr",    form:"narr",    display:"narr",    meaning:"tell; story",          pos:["verb","noun"], group:"latin", examples:["<u>narr</u>ate","<u>narr</u>ative","<u>narr</u>ator"] },
  { id:"neg",     form:"neg",     display:"neg",     meaning:"deny; no",             pos:["verb","adj"],  group:"latin", examples:["<u>neg</u>ate","<u>neg</u>ative","<u>neg</u>lect"] },
  { id:"nov",     form:"nov",     display:"nov",     meaning:"new",                  pos:["adj"],         group:"latin", examples:["in<u>nov</u>ate","<u>nov</u>el","re<u>nov</u>ate"] },
  { id:"numer",   form:"numer",   display:"numer",   meaning:"number",               pos:["noun"],        group:"latin", examples:["<u>numer</u>ical","<u>numer</u>ator","in<u>numer</u>able"] },
  { id:"omn",     form:"omn",     display:"omn",     meaning:"all; every",           pos:["adj"],         group:"latin", examples:["<u>omn</u>ivore","<u>omn</u>ipotent","<u>omn</u>iscient"] },
  { id:"ped",     form:"ped",     display:"ped",     meaning:"foot; child",          pos:["noun"],        group:"latin", examples:["<u>ped</u>estrian","<u>ped</u>al","ortho<u>ped</u>ic"] },
  { id:"pel",     form:"pel",     display:"pel",     meaning:"drive; push",          pos:["verb"],        group:"latin", examples:["re<u>pel</u>","com<u>pel</u>","pro<u>pel</u>"] },
  { id:"plac",    form:"plac",    display:"plac",    meaning:"please; calm",         pos:["verb","adj"],  group:"latin", examples:["<u>plac</u>id","im<u>plac</u>able","com<u>plac</u>ent"] },
  { id:"popul",   form:"popul",   display:"popul",   meaning:"people",               pos:["noun"],        group:"latin", examples:["<u>popul</u>ation","<u>popul</u>ar","de<u>popul</u>ate"] },
  { id:"pot",     form:"pot",     display:"pot",     meaning:"power; able",          pos:["adj","noun"],  group:"latin", examples:["<u>pot</u>ent","om<u>nip</u>otent","im<u>pot</u>ent"] },
  { id:"prim",    form:"prim",    display:"prim",    meaning:"first",                pos:["adj","noun"],  group:"latin", examples:["<u>prim</u>ary","<u>prim</u>itive","<u>prim</u>acy"] },
  { id:"pub",     form:"pub",     display:"pub",     meaning:"people; public",       pos:["noun","adj"],  group:"latin", examples:["<u>pub</u>lic","re<u>pub</u>lic","<u>pub</u>lish"] },
  { id:"quer",    form:"quer",    display:"quer",    meaning:"seek; ask",            pos:["verb"],        group:"latin", examples:["<u>quer</u>y","in<u>quer</u>y","<u>quer</u>ulous"] },
  { id:"reg",     form:"reg",     display:"reg",     meaning:"rule; govern",         pos:["verb","noun"], group:"latin", examples:["<u>reg</u>ulate","<u>reg</u>ime","ir<u>reg</u>ular"] },
  { id:"rog",     form:"rog",     display:"rog",     meaning:"ask; propose",         pos:["verb"],        group:"latin", examples:["inter<u>rog</u>ate","ab<u>rog</u>ate","ar<u>rog</u>ant"] },
  { id:"sacr",    form:"sacr",    display:"sacr",    meaning:"holy; sacred",         pos:["adj"],         group:"latin", examples:["<u>sacr</u>ed","<u>sacr</u>ifice","con<u>sacr</u>ate"] },
  { id:"scend",   form:"scend",   display:"scend",   meaning:"climb; go",            pos:["verb"],        group:"latin", examples:["a<u>scend</u>","de<u>scend</u>","tran<u>scend</u>"] },
  { id:"sequ",    form:"sequ",    display:"sequ",    meaning:"follow",               pos:["verb"],        group:"latin", examples:["<u>sequ</u>ence","con<u>sequ</u>ent","sub<u>sequ</u>ent"] },
  { id:"simil",   form:"simil",   display:"simil",   meaning:"like; similar",        pos:["adj"],         group:"latin", examples:["<u>simil</u>ar","<u>simil</u>e","as<u>simil</u>ate"] },
  { id:"sonor",   form:"sonor",   display:"sonor",   meaning:"sound",                pos:["noun"],        group:"latin", examples:["<u>sonor</u>ous","<u>sonor</u>ity","re<u>sonor</u>ate"] },
  { id:"spher",   form:"spher",   display:"spher",   meaning:"ball; globe",          pos:["noun"],        group:"greek", examples:["atmo<u>spher</u>e","hemi<u>spher</u>e","bio<u>spher</u>e"] },
  { id:"spir",    form:"spir",    display:"spir",    meaning:"breathe; coil",        pos:["verb","noun"], group:"latin", examples:["in<u>spir</u>e","con<u>spir</u>e","re<u>spir</u>ation"] },
  { id:"tempor",  form:"tempor",  display:"tempor",  meaning:"time",                 pos:["noun"],        group:"latin", examples:["<u>tempor</u>ary","con<u>tempor</u>ary","<u>tempor</u>al"] },
  { id:"ten",     form:"ten",     display:"ten",     meaning:"hold; keep",           pos:["verb"],        group:"latin", examples:["re<u>ten</u>tion","sus<u>ten</u>ance","con<u>ten</u>t"] },
  { id:"termin",  form:"termin",  display:"termin",  meaning:"end; boundary",        pos:["noun","verb"], group:"latin", examples:["<u>termin</u>ate","de<u>termin</u>e","in<u>termin</u>able"] },
  { id:"turb",    form:"turb",    display:"turb",    meaning:"disturb; agitate",     pos:["verb"],        group:"latin", examples:["<u>turb</u>ulent","per<u>turb</u>","dis<u>turb</u>"] },
  { id:"vac",     form:"vac",     display:"vac",     meaning:"empty",                pos:["adj","verb"],  group:"latin", examples:["<u>vac</u>uum","<u>vac</u>ant","e<u>vac</u>uate"] },
  { id:"ven",     form:"ven",     display:"ven",     meaning:"come",                 pos:["verb"],        group:"latin", examples:["inter<u>ven</u>e","pre<u>ven</u>t","con<u>ven</u>e"] },
  { id:"ver",     form:"ver",     display:"ver",     meaning:"truth",                pos:["noun","adj"],  group:"latin", examples:["<u>ver</u>ify","<u>ver</u>ity","<u>ver</u>batim"] },
  { id:"vita",    form:"vita",    display:"vita",    meaning:"life",                 pos:["noun"],        group:"latin", examples:["<u>vita</u>l","<u>vita</u>min","re<u>vita</u>lise"] },
  { id:"voc",     form:"voc",     display:"voc",     meaning:"call; voice",          pos:["verb","noun"], group:"latin", examples:["<u>voc</u>al","e<u>voc</u>ate","pro<u>voc</u>ative"] },
  { id:"volv",    form:"volv",    display:"volv",    meaning:"roll; turn",           pos:["verb"],        group:"latin", examples:["re<u>volv</u>e","e<u>volv</u>e","in<u>volv</u>e"] },
];

// ── MEANING MATCH-UP / MISSION MODE ─────────────────────────────────────────

const EXT_MEANING_PREFIXES = [
  {id:"ambi",   form:"ambi",   meaning:"both sides"},
  {id:"ante",   form:"ante",   meaning:"before or in front of"},
  {id:"apo",    form:"apo",    meaning:"away from or separate"},
  {id:"astro",  form:"astro",  meaning:"star or outer space"},
  {id:"auto",   form:"auto",   meaning:"self or by itself"},
  {id:"bene",   form:"bene",   meaning:"good or well"},
  {id:"bi",     form:"bi",     meaning:"two or twice"},
  {id:"bio",    form:"bio",    meaning:"life"},
  {id:"cardio", form:"cardio", meaning:"heart"},
  {id:"cata",   form:"cata",   meaning:"down or completely"},
  {id:"chrono", form:"chrono", meaning:"time"},
  {id:"circum", form:"circum", meaning:"around"},
  {id:"cosmo",  form:"cosmo",  meaning:"universe or world"},
  {id:"crypto", form:"crypto", meaning:"hidden or secret"},
  {id:"cyber",  form:"cyber",  meaning:"computers or internet"},
  {id:"demo",   form:"demo",   meaning:"people"},
  {id:"dia",    form:"dia",    meaning:"through or across"},
  {id:"eco",    form:"eco",    meaning:"environment or ecology"},
  {id:"electro",form:"electro",meaning:"electricity"},
  {id:"eu",     form:"eu",     meaning:"good or well or pleasant"},
  {id:"ethno",  form:"ethno",  meaning:"people or culture"},
  {id:"geo",    form:"geo",    meaning:"earth"},
  {id:"hemi",   form:"hemi",   meaning:"half"},
  {id:"hetero", form:"hetero", meaning:"different or other"},
  {id:"homo",   form:"homo",   meaning:"same"},
  {id:"hydro",  form:"hydro",  meaning:"water"},
  {id:"hypo",   form:"hypo",   meaning:"under or below normal"},
  {id:"infra",  form:"infra",  meaning:"below or beneath"},
  {id:"litho",  form:"litho",  meaning:"stone or rock"},
  {id:"macro",  form:"macro",  meaning:"large or long"},
  {id:"meta",   form:"meta",   meaning:"beyond or change"},
  {id:"micro",  form:"micro",  meaning:"small or tiny"},
  {id:"mono",   form:"mono",   meaning:"one or single"},
  {id:"morpho", form:"morpho", meaning:"form or shape"},
  {id:"neo",    form:"neo",    meaning:"new or recent"},
  {id:"neuro",  form:"neuro",  meaning:"nerve or nervous system"},
  {id:"omni",   form:"omni",   meaning:"all or every"},
  {id:"ortho",  form:"ortho",  meaning:"straight or correct"},
  {id:"paleo",  form:"paleo",  meaning:"ancient or early"},
  {id:"para",   form:"para",   meaning:"beside or beyond"},
  {id:"patho",  form:"patho",  meaning:"disease or suffering"},
  {id:"peri",   form:"peri",   meaning:"around or near"},
  {id:"phil",   form:"phil",   meaning:"love or fond of"},
  {id:"photo",  form:"photo",  meaning:"light"},
  {id:"poly",   form:"poly",   meaning:"many or much"},
  {id:"proto",  form:"proto",  meaning:"first or original"},
  {id:"pseudo", form:"pseudo", meaning:"false or fake"},
  {id:"psycho", form:"psycho", meaning:"mind or mental"},
  {id:"pyro",   form:"pyro",   meaning:"fire"},
  {id:"retro",  form:"retro",  meaning:"backwards or behind"},
  {id:"socio",  form:"socio",  meaning:"society or social"},
  {id:"syn",    form:"syn",    meaning:"together or with"},
  {id:"techno", form:"techno", meaning:"technology or skill"},
  {id:"tele",   form:"tele",   meaning:"far or at a distance"},
  {id:"thermo", form:"thermo", meaning:"heat"},
  {id:"tri",    form:"tri",    meaning:"three"},
  {id:"ultra",  form:"ultra",  meaning:"beyond or extreme"},
  {id:"uni",    form:"uni",    meaning:"one"},
  {id:"zoo",    form:"zoo",    meaning:"animal or living creature"},
];

const EXT_MEANING_SUFFIXES = [
  {id:"archy",   form:"archy",   meaning:"rule or government"},
  {id:"ase",     form:"ase",     meaning:"enzyme"},
  {id:"cide",    form:"cide",    meaning:"killing or killer"},
  {id:"cracy",   form:"cracy",   meaning:"rule or power"},
  {id:"cyte",    form:"cyte",    meaning:"cell"},
  {id:"derm",    form:"derm",    meaning:"skin layer"},
  {id:"gamy",    form:"gamy",    meaning:"marriage or union"},
  {id:"gen",     form:"gen",     meaning:"producing or origin"},
  {id:"genesis", form:"genesis", meaning:"origin or creation"},
  {id:"genic",   form:"genic",   meaning:"producing or suitable for"},
  {id:"gram",    form:"gram",    meaning:"written or recorded"},
  {id:"graph",   form:"graph",   meaning:"writing or recording"},
  {id:"hedron",  form:"hedron",  meaning:"geometric solid face"},
  {id:"itis",    form:"itis",    meaning:"inflammation of"},
  {id:"kinesis", form:"kinesis", meaning:"movement or motion"},
  {id:"latry",   form:"latry",   meaning:"worship or devotion"},
  {id:"logue",   form:"logue",   meaning:"word or speech"},
  {id:"lysis",   form:"lysis",   meaning:"breaking down"},
  {id:"mancy",   form:"mancy",   meaning:"divination or prediction"},
  {id:"morph",   form:"morph",   meaning:"form or shape"},
  {id:"nomy",    form:"nomy",    meaning:"law or management of"},
  {id:"nym",     form:"nym",     meaning:"word or name"},
  {id:"oid",     form:"oid",     meaning:"resembling or like"},
  {id:"ology",   form:"ology",   meaning:"study of"},
  {id:"pathy",   form:"pathy",   meaning:"feeling or disease"},
  {id:"phile",   form:"phile",   meaning:"lover of"},
  {id:"phobia",  form:"phobia",  meaning:"fear of"},
  {id:"phone",   form:"phone",   meaning:"sound or voice"},
  {id:"plasm",   form:"plasm",   meaning:"form or living substance"},
  {id:"pod",     form:"pod",     meaning:"foot or leg"},
  {id:"scope",   form:"scope",   meaning:"instrument for viewing"},
  {id:"sophy",   form:"sophy",   meaning:"wisdom or knowledge"},
  {id:"stasis",  form:"stasis",  meaning:"standing still or stability"},
  {id:"tomy",    form:"tomy",    meaning:"cutting or incision"},
  {id:"trophy",  form:"trophy",  meaning:"nourishment or growth"},
  {id:"tude",    form:"tude",    meaning:"state or condition"},
  {id:"type",    form:"type",    meaning:"model or pattern"},
  {id:"vore",    form:"vore",    meaning:"feeding on"},
  {id:"ward",    form:"ward",    meaning:"direction or towards"},
];

// ── MEANING-MODE: BASE POOL ───────────────────────────────────────────────────
// Used for the "base" quiz mode in meaning-mode — student identifies which
// root/combining form matches a given meaning.

const EXT_MEANING_BASES = [
  // Greek roots
  {id:"anthrop", form:"anthrop", meaning:"human being"},
  {id:"bio",     form:"bio",     meaning:"life"},
  {id:"chron",   form:"chron",   meaning:"time"},
  {id:"cosm",    form:"cosm",    meaning:"universe or order"},
  {id:"dem",     form:"dem",     meaning:"people"},
  {id:"derm",    form:"derm",    meaning:"skin"},
  {id:"dyn",     form:"dyn",     meaning:"power or force"},
  {id:"gen",     form:"gen",     meaning:"origin or birth"},
  {id:"geo",     form:"geo",     meaning:"earth"},
  {id:"morph",   form:"morph",   meaning:"form or shape"},
  {id:"path",    form:"path",    meaning:"feeling or disease"},
  {id:"phil",    form:"phil",    meaning:"love or fondness"},
  {id:"phob",    form:"phob",    meaning:"fear"},
  {id:"psych",   form:"psych",   meaning:"mind or soul"},
  {id:"soph",    form:"soph",    meaning:"wisdom or knowledge"},
  {id:"therm",   form:"therm",   meaning:"heat"},
  {id:"tox",     form:"tox",     meaning:"poison"},
  {id:"zoo",     form:"zoo",     meaning:"animal or living being"},
  // Latin roots
  {id:"aqu",     form:"aqu",     meaning:"water"},
  {id:"capit",   form:"capit",   meaning:"head or chief"},
  {id:"corp",    form:"corp",    meaning:"body"},
  {id:"fin",     form:"fin",     meaning:"end or limit"},
  {id:"flu",     form:"flu",     meaning:"flow"},
  {id:"man",     form:"man",     meaning:"hand"},
  {id:"mar",     form:"mar",     meaning:"sea"},
  {id:"mort",    form:"mort",    meaning:"death"},
  {id:"nov",     form:"nov",     meaning:"new"},
  {id:"sol",     form:"sol",     meaning:"sun or alone"},
  {id:"termin",  form:"termin",  meaning:"end or boundary"},
  {id:"vita",    form:"vita",    meaning:"life"},
  {id:"voc",     form:"voc",     meaning:"call or voice"},
  // Combining forms
  {id:"astro",   form:"astro",   meaning:"star or outer space"},
  {id:"eco",     form:"eco",     meaning:"environment or household"},
  {id:"hydro",   form:"hydro",   meaning:"water"},
  {id:"photo",   form:"photo",   meaning:"light"},
  {id:"poly",    form:"poly",    meaning:"many or much"},
  {id:"pyro",    form:"pyro",    meaning:"fire"},
  {id:"geno",    form:"geno",    meaning:"origin or race"},
  {id:"oxy",     form:"oxy",     meaning:"sharp or acid"},
  {id:"techno",  form:"techno",  meaning:"technology or skill"},
];

// ── MISSION-MODE: PREFIX BASES ────────────────────────────────────────────────
// For the prefix drag-and-drop game — the base stays still, student drags
// an extension prefix onto it. validPrefixes lists IDs from EXT_MEANING_PREFIXES.

const EXT_MISSION_BASES = [
  {id:"logy",   form:"logy",   meaning:"study or science of",         pos:["noun"], validPrefixes:["bio","geo","astro","psycho","neuro","cardio","zoo","eco","socio","cosmo","patho","hydro","techno","morpho","chrono","ethno"]},
  {id:"graphy", form:"graphy", meaning:"writing or visual recording",  pos:["noun"], validPrefixes:["bio","auto","geo","photo","litho","tele","crypto","ethno"]},
  {id:"scope",  form:"scope",  meaning:"instrument for viewing",       pos:["noun"], validPrefixes:["tele","micro","peri"]},
  {id:"phone",  form:"phone",  meaning:"device for sound or voice",    pos:["noun"], validPrefixes:["tele","micro","mega"]},
  {id:"naut",   form:"naut",   meaning:"voyager or traveller",         pos:["noun"], validPrefixes:["astro","cosmo"]},
  {id:"cracy",  form:"cracy",  meaning:"system of rule or power",      pos:["noun"], validPrefixes:["demo","techno","auto"]},
  {id:"gram",   form:"gram",   meaning:"written or drawn record",      pos:["noun"], validPrefixes:["tele","mono","electro"]},
  {id:"pathy",  form:"pathy",  meaning:"feeling or disease",           pos:["noun"], validPrefixes:["tele","psycho"]},
  {id:"nomy",   form:"nomy",   meaning:"system of rules or management",pos:["noun"], validPrefixes:["astro","eco","gastro"]},
  {id:"meter",  form:"meter",  meaning:"instrument for measuring",     pos:["noun"], validPrefixes:["thermo","hydro","chrono"]},
  {id:"phobia", form:"phobia", meaning:"extreme fear of something",    pos:["noun"], validPrefixes:["techno","hydro"]},
];

// ── MISSION-MODE: SUFFIX BASES ────────────────────────────────────────────────
// For the suffix drag-and-drop game — the combining form stays still, student
// drags an extension suffix onto it. validSuffixes lists IDs from EXT_MEANING_SUFFIXES.

const EXT_MISSION_SUFFIX_BASES = [
  {id:"bio",    form:"bio",    meaning:"life",                pos:["noun"], validSuffixes:["ology","graph","type","genesis","lysis"]},
  {id:"geo",    form:"geo",    meaning:"earth",               pos:["noun"], validSuffixes:["ology","graph","nomy","morph"]},
  {id:"astro",  form:"astro",  meaning:"star or outer space", pos:["noun"], validSuffixes:["ology","nomy","phile"]},
  {id:"psycho", form:"psycho", meaning:"mind",                pos:["noun"], validSuffixes:["ology","pathy","sophy"]},
  {id:"demo",   form:"demo",   meaning:"people",              pos:["noun"], validSuffixes:["cracy","graph"]},
  {id:"techno", form:"techno", meaning:"technology",          pos:["noun"], validSuffixes:["cracy","ology","phobia","phile"]},
  {id:"hydro",  form:"hydro",  meaning:"water",               pos:["noun"], validSuffixes:["ology","phobia","lysis","phone"]},
  {id:"neuro",  form:"neuro",  meaning:"nerve system",        pos:["noun"], validSuffixes:["ology","pathy"]},
  {id:"photo",  form:"photo",  meaning:"light",               pos:["noun"], validSuffixes:["graph","lysis","type","phone"]},
  {id:"auto",   form:"auto",   meaning:"self",                pos:["noun"], validSuffixes:["cracy","graph","nomy"]},
  {id:"tele",   form:"tele",   meaning:"far or at a distance",pos:["noun"], validSuffixes:["phone","scope","gram","graph","pathy"]},
  {id:"eco",    form:"eco",    meaning:"environment",         pos:["noun"], validSuffixes:["ology","nomy","type"]},
  {id:"zoo",    form:"zoo",    meaning:"animals",             pos:["noun"], validSuffixes:["ology","morph","phile","type"]},
  {id:"poly",   form:"poly",   meaning:"many or much",        pos:["noun"], validSuffixes:["graph","gamy","morph"]},
  {id:"electro",form:"electro",meaning:"electricity",         pos:["noun"], validSuffixes:["lysis","gram","scope","type"]},
];

// ── BREAKDOWN BLITZ ──────────────────────────────────────────────────────────

const EXT_MISSIONS = [
  {word:"metamorphosis",     clue:"a complete transformation in form",                  answers:{prefix:"meta",   base:"morph",    suffix1:"osis",   suffix2:""}},
  {word:"autobiography",     clue:"the story of your own life written by yourself",     answers:{prefix:"auto",   base:"bio",      suffix1:"graph",  suffix2:"y"}},
  {word:"circumnavigate",    clue:"to sail or travel completely around something",      answers:{prefix:"circum", base:"navig",    suffix1:"ate",    suffix2:""}},
  {word:"philanthropy",      clue:"love of humanity shown through charity",             answers:{prefix:"phil",   base:"anthrop",  suffix1:"y",      suffix2:""}},
  {word:"psychology",        clue:"the scientific study of the mind and behaviour",     answers:{prefix:"psych",  base:"ology",    suffix1:"",       suffix2:""}},
  {word:"geothermal",        clue:"relating to heat produced inside the earth",         answers:{prefix:"geo",    base:"therm",    suffix1:"al",     suffix2:""}},
  {word:"omnivorous",        clue:"eating both plants and animals",                     answers:{prefix:"omni",   base:"vor",      suffix1:"ous",    suffix2:""}},
  {word:"democracy",         clue:"a system where people choose their government",      answers:{prefix:"demo",   base:"cracy",    suffix1:"",       suffix2:""}},
  {word:"hypothesis",        clue:"a proposed explanation to be tested",                answers:{prefix:"hypo",   base:"thesis",   suffix1:"",       suffix2:""}},
  {word:"synonym",           clue:"a word with the same meaning as another",            answers:{prefix:"syn",    base:"onym",     suffix1:"",       suffix2:""}},
  {word:"chronological",     clue:"arranged in order of time",                          answers:{prefix:"chrono", base:"log",      suffix1:"ical",   suffix2:""}},
  {word:"pseudoscience",     clue:"ideas that claim to be scientific but are not",      answers:{prefix:"pseudo", base:"science",  suffix1:"",       suffix2:""}},
  {word:"retrospective",     clue:"looking back at past events",                        answers:{prefix:"retro",  base:"spect",    suffix1:"ive",    suffix2:""}},
  {word:"perimeter",         clue:"the distance around the outside of a shape",         answers:{prefix:"peri",   base:"meter",    suffix1:"",       suffix2:""}},
  {word:"monologue",         clue:"a long speech by one person",                        answers:{prefix:"mono",   base:"logue",    suffix1:"",       suffix2:""}},
  {word:"ultrasonic",        clue:"sound waves with frequencies too high for humans",   answers:{prefix:"ultra",  base:"son",      suffix1:"ic",     suffix2:""}},
  {word:"xenophobia",        clue:"fear or dislike of people from other countries",     answers:{prefix:"xeno",   base:"phob",     suffix1:"ia",     suffix2:""}},
  {word:"biodiversity",      clue:"the variety of living things in an area",            answers:{prefix:"bio",    base:"divers",   suffix1:"ity",    suffix2:""}},
  {word:"omnipresent",       clue:"present everywhere at the same time",                answers:{prefix:"omni",   base:"pres",     suffix1:"ent",    suffix2:""}},
  {word:"polysyllabic",      clue:"having more than three syllables",                   answers:{prefix:"poly",   base:"syllab",   suffix1:"ic",     suffix2:""}},
  {word:"thermodynamics",    clue:"the branch of physics dealing with heat and energy", answers:{prefix:"thermo", base:"dynam",    suffix1:"ics",    suffix2:""}},
  {word:"microbiology",      clue:"the study of microscopic living organisms",          answers:{prefix:"micro",  base:"bio",      suffix1:"logy",   suffix2:""}},
  {word:"neologism",         clue:"a newly invented word or expression",                answers:{prefix:"neo",    base:"log",      suffix1:"ism",    suffix2:""}},
  {word:"philanthropist",    clue:"a person who promotes human welfare",                answers:{prefix:"phil",   base:"anthrop",  suffix1:"ist",    suffix2:""}},
  {word:"bibliography",      clue:"a list of books and sources used",                   answers:{prefix:"biblio", base:"graph",    suffix1:"y",      suffix2:""}},
  {word:"homogeneous",       clue:"of the same kind throughout",                        answers:{prefix:"homo",   base:"gen",      suffix1:"eous",   suffix2:""}},
  {word:"heterogeneous",     clue:"made up of different kinds",                         answers:{prefix:"hetero", base:"gen",      suffix1:"eous",   suffix2:""}},
  {word:"hydrology",         clue:"the study of water on and under the earth",          answers:{prefix:"hydro",  base:"logy",     suffix1:"",       suffix2:""}},
  {word:"circumference",     clue:"the distance around a circle",                       answers:{prefix:"circum", base:"fer",      suffix1:"ence",   suffix2:""}},
  {word:"astrobiology",      clue:"the study of life in outer space",                   answers:{prefix:"astro",  base:"bio",      suffix1:"logy",   suffix2:""}},
  {word:"neuroscience",      clue:"the study of the nervous system",                    answers:{prefix:"neuro",  base:"science",  suffix1:"",       suffix2:""}},
  {word:"geopolitical",      clue:"relating to politics and geography",                 answers:{prefix:"geo",    base:"polit",    suffix1:"ical",   suffix2:""}},
  {word:"thermostat",        clue:"a device that regulates temperature",                answers:{prefix:"thermo", base:"stat",     suffix1:"",       suffix2:""}},
  {word:"pseudonym",         clue:"a false name used instead of a real one",            answers:{prefix:"pseudo", base:"nym",      suffix1:"",       suffix2:""}},
  {word:"photosynthesis",    clue:"how plants make food from sunlight",                  answers:{prefix:"photo",  base:"synth",    suffix1:"esis",   suffix2:""}},
  {word:"cardiovascular",    clue:"relating to the heart and blood vessels",            answers:{prefix:"cardio", base:"vascul",   suffix1:"ar",     suffix2:""}},
  {word:"anthropology",      clue:"the study of humanity and human societies",          answers:{prefix:"anthrop",base:"ology",    suffix1:"",       suffix2:""}},
  {word:"telekinesis",       clue:"the supposed ability to move objects with the mind", answers:{prefix:"tele",   base:"kines",    suffix1:"is",     suffix2:""}},
  {word:"pyrotechnics",      clue:"the art of making fireworks",                        answers:{prefix:"pyro",   base:"techn",    suffix1:"ics",    suffix2:""}},
  {word:"telescope",         clue:"an instrument for viewing distant objects",          answers:{prefix:"tele",   base:"scope",    suffix1:"",       suffix2:""}},
  {word:"omniscient",        clue:"knowing everything",                                 answers:{prefix:"omni",   base:"sci",      suffix1:"ent",    suffix2:""}},
  {word:"telecommunications",clue:"communication over long distances",                  answers:{prefix:"tele",   base:"commun",   suffix1:"ic",     suffix2:"ation"}},
  {word:"chronometer",       clue:"an instrument for measuring time precisely",         answers:{prefix:"chrono", base:"meter",    suffix1:"",       suffix2:""}},
  {word:"contradict",        clue:"to say the opposite of what someone else said",      answers:{prefix:"contra", base:"dict",     suffix1:"",       suffix2:""}},
  {word:"infrastructure",    clue:"the basic systems and structures of an organisation",answers:{prefix:"infra",  base:"struct",   suffix1:"ure",    suffix2:""}},
  {word:"ultraviolet",       clue:"light beyond the visible spectrum",                  answers:{prefix:"ultra",  base:"violet",   suffix1:"",       suffix2:""}},
  {word:"autocratic",        clue:"ruling with absolute power",                         answers:{prefix:"auto",   base:"crat",     suffix1:"ic",     suffix2:""}},
  {word:"geomorphology",     clue:"the study of the shape and form of the earth",       answers:{prefix:"geo",    base:"morph",    suffix1:"ology",  suffix2:""}},
  {word:"hyperventilate",    clue:"to breathe excessively fast",                        answers:{prefix:"hyper",  base:"ventil",   suffix1:"ate",    suffix2:""}},
  {word:"pathology",         clue:"the study of disease",                               answers:{prefix:"patho",  base:"logy",     suffix1:"",       suffix2:""}},
  {word:"sociology",         clue:"the study of human society",                         answers:{prefix:"socio",  base:"logy",     suffix1:"",       suffix2:""}},
  {word:"ecosystem",         clue:"a community of living things in an environment",     answers:{prefix:"eco",    base:"syst",     suffix1:"em",     suffix2:""}},
  {word:"electrochemistry",  clue:"chemistry involving electricity",                    answers:{prefix:"electro",base:"chem",     suffix1:"istry",  suffix2:""}},
  {word:"demographics",      clue:"statistical data about a population",                answers:{prefix:"demo",   base:"graph",    suffix1:"ics",    suffix2:""}},
  {word:"lithosphere",       clue:"the rigid outer layer of the earth",                 answers:{prefix:"litho",  base:"sphere",   suffix1:"",       suffix2:""}},
  {word:"cyberspace",        clue:"the virtual world of computer networks",             answers:{prefix:"cyber",  base:"space",    suffix1:"",       suffix2:""}},
  {word:"prototype",         clue:"a first or original model of something",             answers:{prefix:"proto",  base:"type",     suffix1:"",       suffix2:""}},
  {word:"cosmopolitan",      clue:"including people from many countries",               answers:{prefix:"cosmo",  base:"polit",    suffix1:"an",     suffix2:""}},
  {word:"orthodontics",      clue:"dentistry dealing with the alignment of teeth",      answers:{prefix:"ortho",  base:"dont",     suffix1:"ics",    suffix2:""}},
  {word:"zoology",           clue:"the study of animals",                               answers:{prefix:"zoo",    base:"logy",     suffix1:"",       suffix2:""}},
  {word:"cryptography",      clue:"the study of writing in secret codes",              answers:{prefix:"crypto", base:"graph",    suffix1:"y",      suffix2:""}},
];

// ── SYLLABLE SPLITTER ────────────────────────────────────────────────────────

const EXT_SYLLABLE_WORDS = [
  // 2 syllables — tricky patterns and loanwords
  {word:"rhythm",        syllables:["rhy","thm"]},
  {word:"subtle",        syllables:["sub","tle"]},
  {word:"colonel",       syllables:["col","onel"]},
  {word:"genre",         syllables:["gen","re"]},
  {word:"chaos",         syllables:["cha","os"]},
  {word:"naive",         syllables:["na","ive"]},
  {word:"depot",         syllables:["de","pot"]},
  {word:"chalet",        syllables:["cha","let"]},
  {word:"bureau",        syllables:["bu","reau"]},
  {word:"debris",        syllables:["deb","ris"]},
  {word:"cliché",        syllables:["cli","ché"]},
  {word:"ballet",        syllables:["bal","let"]},
  {word:"bouquet",       syllables:["bou","quet"]},
  {word:"buffet",        syllables:["buf","fet"]},
  {word:"crochet",       syllables:["cro","chet"]},
  {word:"ricochet",      syllables:["ric","o","chet"]},
  {word:"vague",         syllables:["vague"]},
  {word:"queue",         syllables:["queue"]},
  {word:"opaque",        syllables:["o","paque"]},
  {word:"unique",        syllables:["u","nique"]},
  {word:"antique",       syllables:["an","tique"]},
  {word:"physique",      syllables:["phy","sique"]},
  {word:"brusque",       syllables:["brusque"]},
  {word:"esquire",       syllables:["es","quire"]},
  // 3–4 syllables — academic
  {word:"curriculum",    syllables:["cur","ric","u","lum"]},
  {word:"phenomenon",    syllables:["phe","nom","e","non"]},
  {word:"democracy",     syllables:["de","moc","ra","cy"]},
  {word:"hypothesis",    syllables:["hy","poth","e","sis"]},
  {word:"trajectory",    syllables:["tra","jec","to","ry"]},
  {word:"apocalypse",    syllables:["a","poc","a","lypse"]},
  {word:"melancholy",    syllables:["mel","an","chol","y"]},
  {word:"catastrophe",   syllables:["ca","tas","tro","phe"]},
  {word:"philanthropy",  syllables:["phi","lan","thro","py"]},
  {word:"renaissance",   syllables:["ren","ais","sance"]},
  {word:"bureaucracy",   syllables:["bu","reau","cra","cy"]},
  {word:"circumference", syllables:["cir","cum","fer","ence"]},
  {word:"psychology",    syllables:["psy","chol","o","gy"]},
  {word:"archaeology",   syllables:["ar","chae","ol","o","gy"]},
  {word:"metabolism",    syllables:["me","tab","o","lism"]},
  {word:"omnivorous",    syllables:["om","niv","o","rous"]},
  {word:"indigenous",    syllables:["in","dig","e","nous"]},
  {word:"contemporary",  syllables:["con","tem","po","rar","y"]},
  {word:"aristocracy",   syllables:["ar","is","toc","ra","cy"]},
  {word:"choreography",  syllables:["cho","re","og","ra","phy"]},
  {word:"bibliography",  syllables:["bib","li","og","ra","phy"]},
  {word:"metamorphosis", syllables:["met","a","mor","pho","sis"]},
  {word:"perpendicular", syllables:["per","pen","dic","u","lar"]},
  {word:"extraterrestrial",syllables:["ex","tra","ter","res","tri","al"]},
  {word:"electromagnetic",syllables:["e","lec","tro","mag","net","ic"]},
  {word:"photosynthesis", syllables:["pho","to","syn","the","sis"]},
  {word:"cardiovascular", syllables:["car","di","o","vas","cu","lar"]},
  {word:"geomorphology",  syllables:["ge","o","mor","phol","o","gy"]},
  {word:"telecommunications",syllables:["tel","e","com","mu","ni","ca","tions"]},
  {word:"autobiographical",syllables:["au","to","bi","o","graph","i","cal"]},
  {word:"biodegradable",  syllables:["bi","o","de","grad","a","ble"]},
  {word:"anthropological",syllables:["an","thro","po","log","i","cal"]},
  {word:"unconstitutional",syllables:["un","con","sti","tu","tion","al"]},
  {word:"misrepresentation",syllables:["mis","rep","re","sen","ta","tion"]},
  {word:"oversimplification",syllables:["o","ver","sim","pli","fi","ca","tion"]},
  // Unusual stress/origin
  {word:"paradigm",      syllables:["par","a","digm"]},
  {word:"archipelago",   syllables:["ar","chi","pel","a","go"]},
  {word:"epiphany",      syllables:["e","piph","a","ny"]},
  {word:"camaraderie",   syllables:["cam","a","ra","de","rie"]},
  {word:"entrepreneur",  syllables:["en","tre","pre","neur"]},
  {word:"bureaucratic",  syllables:["bu","reau","crat","ic"]},
  {word:"idiosyncratic", syllables:["id","i","o","syn","crat","ic"]},
  {word:"onomatopoeia",  syllables:["on","o","mat","o","poe","ia"]},
  {word:"mnemonic",      syllables:["mne","mon","ic"]},
  {word:"conscientious", syllables:["con","sci","en","tious"]},
];

// ── PHONEME SPLITTER ─────────────────────────────────────────────────────────

const EXT_PHONEME_WORDS = [
  // Complex consonant clusters
  {word:"strength",      phonemes:["str","e","ng","th"],               diff:"Starter"},
  {word:"thought",       phonemes:["th","ough","t"],                   diff:"Starter"},
  {word:"through",       phonemes:["thr","ough"],                      diff:"Starter"},
  {word:"scheme",        phonemes:["sch","ee","m"],                    diff:"Starter"},
  {word:"phrase",        phonemes:["ph","r","ay","z"],                 diff:"Starter"},
  {word:"knight",        phonemes:["n","igh","t"],                     diff:"Starter"},
  {word:"wreck",         phonemes:["r","e","k"],                       diff:"Starter"},
  {word:"gnome",         phonemes:["n","oh","m"],                      diff:"Starter"},
  {word:"knife",         phonemes:["n","igh","f"],                     diff:"Starter"},
  {word:"whole",         phonemes:["h","oh","l"],                      diff:"Starter"},
  {word:"write",         phonemes:["r","igh","t"],                     diff:"Starter"},
  {word:"wrist",         phonemes:["r","i","s","t"],                   diff:"Starter"},
  {word:"kneel",         phonemes:["n","ee","l"],                      diff:"Starter"},
  {word:"gnarl",         phonemes:["n","ar","l"],                      diff:"Starter"},
  // Level up — more complex
  {word:"pneumonia",     phonemes:["n","yoo","m","oh","n","ia"],       diff:"Level up"},
  {word:"psychology",    phonemes:["ps","y","ch","o","l","o","gy"],          diff:"Level up"},
  {word:"rhythmic",      phonemes:["r","i","th","m","i","k"],          diff:"Level up"},
  {word:"sphinx",        phonemes:["s","f","i","ng","ks"],             diff:"Level up"},
  {word:"mnemonic",      phonemes:["n","e","m","o","n","i","k"],       diff:"Level up"},
  {word:"queue",         phonemes:["k","yoo"],                         diff:"Level up"},
  {word:"choir",         phonemes:["k","w","igh","r"],                 diff:"Level up"},
  {word:"phlegm",        phonemes:["f","l","e","m"],                   diff:"Level up"},
  {word:"island",        phonemes:["igh","l","a","n","d"],             diff:"Level up"},
  {word:"aisle",         phonemes:["igh","l"],                         diff:"Level up"},
  {word:"yacht",         phonemes:["y","o","t"],                       diff:"Level up"},
  {word:"subtle",        phonemes:["s","u","t","l"],                   diff:"Level up"},
  {word:"sword",         phonemes:["s","or","d"],                      diff:"Level up"},
  {word:"answer",        phonemes:["an","s","er"],                     diff:"Level up"},
  // French-influenced English
  {word:"genre",         phonemes:["zh","on","r","uh"],                diff:"Level up"},
  {word:"debris",        phonemes:["d","e","b","r","ee"],              diff:"Level up"},
  {word:"plateau",       phonemes:["p","l","a","t","oh"],              diff:"Level up"},
  {word:"silhouette",    phonemes:["s","i","l","oo","e","t"],          diff:"Level up"},
  {word:"bureau",        phonemes:["b","yoo","r","oh"],                diff:"Level up"},
  {word:"bouquet",       phonemes:["b","oo","k","ay"],                 diff:"Level up"},
  {word:"baguette",      phonemes:["b","a","g","e","t"],               diff:"Level up"},
  {word:"charade",       phonemes:["sh","a","r","ay","d"],             diff:"Level up"},
  {word:"chef",          phonemes:["sh","e","f"],                      diff:"Level up"},
  {word:"chalet",        phonemes:["sh","a","l","ay"],                 diff:"Level up"},
  {word:"brochure",      phonemes:["b","r","oh","sh","er"],            diff:"Level up"},
  {word:"chauffeur",     phonemes:["sh","oh","f","er"],                diff:"Level up"},
  {word:"crochet",       phonemes:["k","r","oh","sh","ay"],            diff:"Level up"},
  {word:"cachet",        phonemes:["k","a","sh","ay"],                 diff:"Level up"},
  // Challenge — highly unusual patterns
  {word:"chrysanthemum", phonemes:["k","r","i","s","a","n","th","e","m","u","m"], diff:"Challenge"},
  {word:"quiche",        phonemes:["k","ee","sh"],                     diff:"Challenge"},
  {word:"lieutenant",    phonemes:["l","e","f","t","e","n","a","n","t"],          diff:"Challenge"},
  {word:"isthmus",       phonemes:["i","s","m","u","s"],               diff:"Challenge"},
  {word:"colonel",       phonemes:["k","er","n","l"],                  diff:"Challenge"},
  {word:"rendezvous",    phonemes:["r","o","n","d","e","v","oo"],      diff:"Challenge"},
  {word:"conscientious", phonemes:["k","o","n","sh","i","e","n","sh","u","s"],    diff:"Challenge"},
  {word:"epitome",       phonemes:["e","p","i","t","o","m","ee"],      diff:"Challenge"},
  {word:"hyperbole",     phonemes:["h","igh","p","er","b","o","l","ee"],          diff:"Challenge"},
  {word:"paradigm",      phonemes:["p","a","r","a","d","igh","m"],     diff:"Challenge"},
  {word:"phenomenon",    phonemes:["f","e","n","o","m","e","n","o","n"],          diff:"Challenge"},
  {word:"archaeology",   phonemes:["ar","k","ee","o","l","o","j","ee"],           diff:"Challenge"},
  {word:"diphtheria",    phonemes:["d","i","f","th","eer","ia"],       diff:"Challenge"},
  {word:"omniscient",    phonemes:["o","m","n","i","sh","e","n","t"],  diff:"Challenge"},
  {word:"onomatopoeia",  phonemes:["o","n","o","m","a","t","o","p","ee","a"],     diff:"Challenge"},
  {word:"mnemosyne",     phonemes:["n","e","m","o","z","i","n","ee"],  diff:"Challenge"},
];

// ── SOUND SORTER ─────────────────────────────────────────────────────────────

const EXT_SOUND_WORDS = [
  // ── French-origin ch = sh ──────────────────────────────────────────────
  {word:"chalet",    sound:"sh-sound", soundLabel:"SH sound",  grapheme:"ch",   before:"",     after:"alet",   clue:"a wooden mountain cabin",            level:"levelup",   type:"consonant", distractors:["sh","s","ss"],       explain:"In French-origin words, 'ch' makes a /sh/ sound, not /ch/."},
  {word:"chef",      sound:"sh-sound", soundLabel:"SH sound",  grapheme:"ch",   before:"",     after:"ef",     clue:"a professional cook",                level:"levelup",   type:"consonant", distractors:["sh","s"],            explain:"'ch' in French-origin words like 'chef' says /sh/."},
  {word:"machine",   sound:"sh-sound", soundLabel:"SH sound",  grapheme:"ch",   before:"ma",   after:"ine",    clue:"a mechanical device",                level:"levelup",   type:"consonant", distractors:["sh","s","ti"],       explain:"French-origin 'ch' says /sh/ in the middle of 'machine'."},
  {word:"brochure",  sound:"sh-sound", soundLabel:"SH sound",  grapheme:"ch",   before:"bro",  after:"ure",    clue:"an informational booklet",           level:"challenge", type:"consonant", distractors:["sh","s","ti"],       explain:"'ch' in French-origin 'brochure' says /sh/."},
  {word:"parachute", sound:"sh-sound", soundLabel:"SH sound",  grapheme:"ch",   before:"para", after:"ute",    clue:"a device that slows a fall",         level:"challenge", type:"consonant", distractors:["sh","s","t"],        explain:"'ch' says /sh/ in French-origin words like 'parachute'."},
  {word:"charade",   sound:"sh-sound", soundLabel:"SH sound",  grapheme:"ch",   before:"",     after:"arade",  clue:"a guessing game using mime",         level:"challenge", type:"consonant", distractors:["sh","s","j"],        explain:"'ch' makes /sh/ in French-origin 'charade'."},
  {word:"chauffeur", sound:"sh-sound", soundLabel:"SH sound",  grapheme:"ch",   before:"",     after:"auffeur",clue:"a professional driver",              level:"challenge", type:"consonant", distractors:["sh","s","f"],        explain:"'ch' says /sh/ at the start of French-origin 'chauffeur'."},
  {word:"crochet",   sound:"sh-sound", soundLabel:"SH sound",  grapheme:"ch",   before:"cro",  after:"et",     clue:"craft using a hooked needle",        level:"challenge", type:"consonant", distractors:["sh","s","t"],        explain:"'ch' in French-origin 'crochet' says /sh/."},
  // ── Greek ph = f ───────────────────────────────────────────────────────
  {word:"phone",     sound:"f-sound",  soundLabel:"F sound",   grapheme:"ph",   before:"",     after:"one",    clue:"a device for talking",               level:"starter",   type:"consonant", distractors:["f","ff","gh"],       explain:"'ph' in Greek-origin words makes an /f/ sound."},
  {word:"photo",     sound:"f-sound",  soundLabel:"F sound",   grapheme:"ph",   before:"",     after:"oto",    clue:"a picture taken by a camera",        level:"starter",   type:"consonant", distractors:["f","ff"],            explain:"'ph' in Greek-origin words like 'photo' says /f/."},
  {word:"dolphin",   sound:"f-sound",  soundLabel:"F sound",   grapheme:"ph",   before:"dol",  after:"in",     clue:"a clever ocean mammal",              level:"levelup",   type:"consonant", distractors:["f","ff","gh"],       explain:"'ph' says /f/ in 'dolphin'."},
  {word:"alphabet",  sound:"f-sound",  soundLabel:"F sound",   grapheme:"ph",   before:"al",   after:"abet",   clue:"the set of letters in a language",   level:"levelup",   type:"consonant", distractors:["f","ff"],            explain:"'ph' in the middle of 'alphabet' says /f/."},
  {word:"triumph",   sound:"f-sound",  soundLabel:"F sound",   grapheme:"ph",   before:"trium",after:"",       clue:"a great victory",                    level:"challenge", type:"consonant", distractors:["f","ff","gh"],       explain:"'ph' at the end of 'triumph' says /f/."},
  {word:"pamphlet",  sound:"f-sound",  soundLabel:"F sound",   grapheme:"ph",   before:"pam",  after:"let",    clue:"a small informational booklet",      level:"levelup",   type:"consonant", distractors:["f","ff"],            explain:"'ph' in the middle of 'pamphlet' says /f/."},
  {word:"emphasis",  sound:"f-sound",  soundLabel:"F sound",   grapheme:"ph",   before:"em",   after:"asis",   clue:"special importance or stress",       level:"challenge", type:"consonant", distractors:["f","v","gh"],        explain:"'ph' in Greek-origin 'emphasis' says /f/."},
  {word:"phantom",   sound:"f-sound",  soundLabel:"F sound",   grapheme:"ph",   before:"",     after:"antom",  clue:"a ghost or ghostly figure",          level:"levelup",   type:"consonant", distractors:["f","gh","ff"],       explain:"'ph' at the start of 'phantom' says /f/."},
  {word:"orphan",    sound:"f-sound",  soundLabel:"F sound",   grapheme:"ph",   before:"or",   after:"an",     clue:"a child whose parents have died",    level:"levelup",   type:"consonant", distractors:["f","ff","v"],        explain:"'ph' in the middle of 'orphan' says /f/."},
  // ── Silent letters ─────────────────────────────────────────────────────
  {word:"psychology",sound:"s-sound",  soundLabel:"S sound",   grapheme:"ps",   before:"",     after:"ychology",clue:"the study of the mind",             level:"challenge", type:"consonant", distractors:["s","ss","c"],        explain:"'ps' at the start of Greek words has a silent 'p'."},
  {word:"pneumonia", sound:"n-sound",  soundLabel:"N sound",   grapheme:"pn",   before:"",     after:"eumonia",clue:"a serious lung infection",            level:"challenge", type:"consonant", distractors:["n","kn","gn"],       explain:"'pn' at the start of Greek words has a silent 'p'."},
  {word:"gnome",     sound:"n-sound",  soundLabel:"N sound",   grapheme:"gn",   before:"",     after:"ome",    clue:"a small mythical creature",           level:"levelup",   type:"consonant", distractors:["n","kn","pn"],       explain:"'gn' at the start of words has a silent 'g'."},
  {word:"knight",    sound:"n-sound",  soundLabel:"N sound",   grapheme:"kn",   before:"",     after:"ight",   clue:"a medieval warrior",                 level:"levelup",   type:"consonant", distractors:["n","gn","pn"],       explain:"'kn' at the start of words has a silent 'k'."},
  {word:"wreck",     sound:"r-sound",  soundLabel:"R sound",   grapheme:"wr",   before:"",     after:"eck",    clue:"a destroyed vehicle or ship",        level:"levelup",   type:"consonant", distractors:["r","rr"],            explain:"'wr' at the start of Old English words has a silent 'w'."},
  {word:"kneel",     sound:"n-sound",  soundLabel:"N sound",   grapheme:"kn",   before:"",     after:"eel",    clue:"to rest on your knees",              level:"levelup",   type:"consonant", distractors:["n","gn","nn"],       explain:"'kn' has a silent 'k' in 'kneel'."},
  {word:"wrist",     sound:"r-sound",  soundLabel:"R sound",   grapheme:"wr",   before:"",     after:"ist",    clue:"the joint between your hand and arm", level:"levelup",  type:"consonant", distractors:["r","rr","wr"],       explain:"'wr' has a silent 'w' in 'wrist'."},
  {word:"gnarl",     sound:"n-sound",  soundLabel:"N sound",   grapheme:"gn",   before:"",     after:"arl",    clue:"twisted and knobbly",                level:"challenge", type:"consonant", distractors:["n","kn","nr"],       explain:"'gn' has a silent 'g' in 'gnarl'."},
  {word:"debt",      sound:"t-sound",  soundLabel:"T sound",   grapheme:"bt",   before:"de",   after:"",       clue:"money that is owed",                 level:"levelup",   type:"consonant", distractors:["t","tt","d"],        explain:"The 'b' in 'debt' is silent — it comes from the Latin 'debitum'."},
  {word:"island",    sound:"igh-sound",soundLabel:"Long I",    grapheme:"i",    before:"",     after:"sland",  clue:"land surrounded by water",           level:"levelup",   type:"vowel",     distractors:["igh","ie","eye"],    explain:"The 's' in 'island' is silent — it was added by mistake from a Latin word."},
  {word:"sword",     sound:"or-sound", soundLabel:"OR sound",  grapheme:"wor",  before:"s",    after:"d",      clue:"a long bladed weapon",               level:"challenge", type:"vowel",     distractors:["or","oor","aw"],     explain:"The 'w' in 'sword' is silent — 'wor' makes the /or/ sound here."},
  {word:"castle",    sound:"s-sound",  soundLabel:"S sound",   grapheme:"st",   before:"ca",   after:"le",     clue:"a large fortified building",         level:"levelup",   type:"consonant", distractors:["ss","s","sc"],       explain:"The 't' in 'castle' is silent — a common pattern in words like 'whistle' and 'fasten'."},
  {word:"listen",    sound:"s-sound",  soundLabel:"S sound",   grapheme:"st",   before:"li",   after:"en",     clue:"to pay attention to sounds",         level:"levelup",   type:"consonant", distractors:["s","ss","c"],        explain:"The 't' in 'listen' is silent — same pattern as 'fasten' and 'glisten'."},
  // ── Unusual vowels from loanwords ──────────────────────────────────────
  {word:"quiche",    sound:"ee-sound", soundLabel:"Long E",    grapheme:"i",    before:"qu",   after:"che",    clue:"a baked egg and pastry dish",        level:"challenge", type:"vowel",     distractors:["ee","ea","ie"],      explain:"French-origin 'quiche' has an 'i' that says /ee/."},
  {word:"ski",       sound:"ee-sound", soundLabel:"Long E",    grapheme:"i",    before:"sk",   after:"",       clue:"to glide on snow on long boards",    level:"levelup",   type:"vowel",     distractors:["ee","ea","y"],       explain:"Scandinavian-origin 'ski' ends in an 'i' that says /ee/."},
  {word:"bureau",    sound:"oh-sound", soundLabel:"Long O",    grapheme:"eau",  before:"bur",  after:"",       clue:"a chest of drawers",                 level:"challenge", type:"vowel",     distractors:["o","ow","oa"],       explain:"French 'eau' makes a long o sound at the end of 'bureau'."},
  {word:"plateau",   sound:"oh-sound", soundLabel:"Long O",    grapheme:"eau",  before:"plat", after:"",       clue:"a flat-topped highland",             level:"challenge", type:"vowel",     distractors:["o","ow","oa"],       explain:"'eau' at the end of French words says /oh/."},
  {word:"naive",     sound:"ee-sound", soundLabel:"Long E",    grapheme:"ai",   before:"n",    after:"ve",     clue:"showing a lack of experience",       level:"challenge", type:"vowel",     distractors:["ee","ea","ie"],      explain:"In French-origin 'naive', 'ai' says /ee/ — unusual in English."},
  {word:"chateau",   sound:"oh-sound", soundLabel:"Long O",    grapheme:"eau",  before:"chat", after:"",       clue:"a large French country house",       level:"challenge", type:"vowel",     distractors:["o","ow","au"],       explain:"'eau' at the end of French-origin 'chateau' says /oh/."},
  {word:"gateau",    sound:"oh-sound", soundLabel:"Long O",    grapheme:"eau",  before:"gat",  after:"",       clue:"a rich layered cake",                level:"challenge", type:"vowel",     distractors:["o","ow","au"],       explain:"'eau' says /oh/ at the end of French-origin 'gateau'."},
  {word:"ballet",    sound:"ay-sound", soundLabel:"Long A",    grapheme:"et",   before:"ball", after:"",       clue:"a form of artistic dance",           level:"challenge", type:"vowel",     distractors:["ay","a","ey"],       explain:"In French-origin 'ballet', the 't' is silent and 'et' makes /ay/."},
  {word:"bouquet",   sound:"ay-sound", soundLabel:"Long A",    grapheme:"et",   before:"bouqu",after:"",       clue:"a bunch of flowers",                 level:"challenge", type:"vowel",     distractors:["ay","a","ey"],       explain:"In French-origin 'bouquet', 'et' makes /ay/ and the final 't' is silent."},
  {word:"cachet",    sound:"ay-sound", soundLabel:"Long A",    grapheme:"et",   before:"cach", after:"",       clue:"a mark of distinction or quality",   level:"challenge", type:"vowel",     distractors:["ay","a","ey"],       explain:"'et' makes /ay/ in French-origin 'cachet'."},
  // ── Schwa sounds ────────────────────────────────────────────────────────
  {word:"banana",    sound:"schwa",    soundLabel:"Schwa (uh)",grapheme:"a",    before:"ban",  after:"na",     clue:"a yellow tropical fruit",            level:"levelup",   type:"vowel",     distractors:["u","e","o"],         explain:"The middle 'a' in 'banana' is a schwa — an unstressed /uh/ sound."},
  {word:"sofa",      sound:"schwa",    soundLabel:"Schwa (uh)",grapheme:"a",    before:"sof",  after:"",       clue:"a comfortable seat for several people",level:"levelup", type:"vowel",     distractors:["u","e","o"],         explain:"The final 'a' in 'sofa' is a schwa — an unstressed /uh/ sound."},
  {word:"doctor",    sound:"schwa",    soundLabel:"Schwa (uh)",grapheme:"or",   before:"doct", after:"",       clue:"a medical professional",             level:"levelup",   type:"vowel",     distractors:["er","ar","ur"],      explain:"Unstressed '-or' at the end of words often makes a schwa sound."},
  {word:"about",     sound:"schwa",    soundLabel:"Schwa (uh)",grapheme:"a",    before:"",     after:"bout",   clue:"on the subject of",                  level:"levelup",   type:"vowel",     distractors:["u","o","uh"],        explain:"The unstressed 'a' at the start of 'about' is a schwa."},
  {word:"particular",sound:"schwa",    soundLabel:"Schwa (uh)",grapheme:"u",    before:"partic",after:"lar",   clue:"a specific one",                     level:"challenge", type:"vowel",     distractors:["a","e","o"],         explain:"The unstressed 'u' in 'particular' is a schwa sound."},
  {word:"animal",    sound:"schwa",    soundLabel:"Schwa (uh)",grapheme:"a",    before:"anim", after:"l",      clue:"a living creature",                  level:"levelup",   type:"vowel",     distractors:["u","e","o"],         explain:"The unstressed final 'a' in 'animal' is a schwa."},
  {word:"pencil",    sound:"schwa",    soundLabel:"Schwa (uh)",grapheme:"i",    before:"penc", after:"l",      clue:"a writing tool",                     level:"levelup",   type:"vowel",     distractors:["u","e","a"],         explain:"The unstressed 'i' in 'pencil' is a schwa — it sounds like /ul/."},
  {word:"national",  sound:"schwa",    soundLabel:"Schwa (uh)",grapheme:"a",    before:"nation",after:"l",     clue:"belonging to a whole country",       level:"challenge", type:"vowel",     distractors:["u","e","o"],         explain:"The second 'a' in 'national' is a schwa — reduced in unstressed syllables."},
  // ── -ough spellings ─────────────────────────────────────────────────────
  {word:"though",    sound:"oh-sound", soundLabel:"Long O",    grapheme:"ough", before:"th",   after:"",       clue:"despite the fact that",              level:"challenge", type:"vowel",     distractors:["o","ow","oa"],       explain:"'ough' says /oh/ in 'though'."},
  {word:"through",   sound:"oo-sound", soundLabel:"Long OO",   grapheme:"ough", before:"thr",  after:"",       clue:"from one side to the other",         level:"challenge", type:"vowel",     distractors:["oo","ew","ue"],      explain:"'ough' says /oo/ in 'through'."},
  {word:"thought",   sound:"aw-sound", soundLabel:"AW sound",  grapheme:"ough", before:"th",   after:"t",      clue:"past tense of think",                level:"challenge", type:"vowel",     distractors:["aw","or","au"],      explain:"'ough' says /aw/ in 'thought'."},
  {word:"tough",     sound:"uff-sound",soundLabel:"UF sound",  grapheme:"ough", before:"t",    after:"",       clue:"strong and resilient",               level:"challenge", type:"vowel",     distractors:["uff","uf","u"],      explain:"'ough' says /uff/ in 'tough' — same as in 'rough' and 'enough'."},
  {word:"cough",     sound:"off-sound",soundLabel:"OFF sound", grapheme:"ough", before:"c",    after:"",       clue:"a sudden noisy clearing of the throat",level:"challenge",type:"vowel",    distractors:["off","of","o"],      explain:"'ough' says /off/ in 'cough' — one of its rarest sounds."},
  {word:"bough",     sound:"ow-sound", soundLabel:"OW sound",  grapheme:"ough", before:"b",    after:"",       clue:"a large branch of a tree",           level:"challenge", type:"vowel",     distractors:["ow","ou","aw"],      explain:"'ough' says /ow/ in 'bough' — same as in 'plough'."},
];

// ── EXTRA BASES (dual-role combining forms for the morpheme builder) ──────────
// These appear as BASE tiles in the morpheme builder when extension mode is on.
// They are separate from EXT_PREFIXES so they don't duplicate prefix tiles.

const EXT_EXTRA_BASES = [
  // ── Original dual-role combining forms ───────────────────────────────────
  { id:"tele",    form:"tele",    display:"tele",    meaning:"far; at a distance",      pos:["noun","adj"], group:"greek", examples:["<u>tele</u>scope","<u>tele</u>phone","<u>tele</u>gram"] },
  { id:"mono",    form:"mono",    display:"mono",    meaning:"one; single",             pos:["noun","adj"], group:"greek", examples:["<u>mono</u>logue","<u>mono</u>chrome","<u>mono</u>gamy"] },
  { id:"demo",    form:"demo",    display:"demo",    meaning:"people",                  pos:["noun"],       group:"greek", examples:["<u>demo</u>cracy","<u>demo</u>graphic"] },
  { id:"astro",   form:"astro",   display:"astro",   meaning:"star; outer space",       pos:["noun","adj"], group:"greek", examples:["<u>astro</u>nomy","<u>astro</u>naut"] },
  { id:"eco",     form:"eco",     display:"eco",     meaning:"environment; household",  pos:["noun"],       group:"greek", examples:["<u>eco</u>nomy","<u>eco</u>system"] },
  { id:"micro",   form:"micro",   display:"micro",   meaning:"small; tiny",             pos:["noun","adj"], group:"greek", examples:["<u>micro</u>scope","<u>micro</u>phone"] },
  { id:"peri",    form:"peri",    display:"peri",    meaning:"around; near",            pos:["noun","adj"], group:"greek", examples:["<u>peri</u>scope","<u>peri</u>meter"] },
  { id:"omni",    form:"omni",    display:"omni",    meaning:"all; every",              pos:["adj"],        group:"latin", examples:["<u>omni</u>vore","<u>omni</u>present"] },
  { id:"carni",   form:"carni",   display:"carni",   meaning:"flesh; meat",             pos:["adj"],        group:"latin", examples:["<u>carni</u>vore","<u>carni</u>val"] },
  { id:"herbi",   form:"herbi",   display:"herbi",   meaning:"plant; vegetation",       pos:["adj"],        group:"latin", examples:["<u>herbi</u>vore","<u>herbi</u>cide"] },
  { id:"pseudo",  form:"pseudo",  display:"pseudo",  meaning:"false; fake",             pos:["adj","noun"], group:"greek", examples:["<u>pseudo</u>nym","<u>pseudo</u>science"] },
  { id:"proto",   form:"proto",   display:"proto",   meaning:"first; original",         pos:["noun","adj"], group:"greek", examples:["<u>proto</u>type","<u>proto</u>plasm"] },
  { id:"tri",     form:"tri",     display:"tri",     meaning:"three",                   pos:["noun","adj"], group:"greek", examples:["<u>tri</u>pod","<u>tri</u>angle"] },
  { id:"photo",   form:"photo",   display:"photo",   meaning:"light",                   pos:["noun","adj"], group:"greek", examples:["<u>photo</u>graph","<u>photo</u>genic"] },
  // ── Additional combining forms ────────────────────────────────────────────
  { id:"poly",    form:"poly",    display:"poly",    meaning:"many; much",              pos:["noun","adj"], group:"greek", examples:["<u>poly</u>graph","<u>poly</u>gamy","<u>poly</u>hedron"] },
  { id:"dia",     form:"dia",     display:"dia",     meaning:"through; across",         pos:["noun","adj"], group:"greek", examples:["<u>dia</u>gram","<u>dia</u>logue","<u>dia</u>lysis"] },
  { id:"mega",    form:"mega",    display:"mega",    meaning:"large; great",            pos:["noun","adj"], group:"greek", examples:["<u>mega</u>phone","<u>mega</u>byte"] },
  { id:"homo",    form:"homo",    display:"homo",    meaning:"same",                    pos:["adj"],        group:"greek", examples:["<u>homo</u>nym","<u>homo</u>geneous"] },
  { id:"acro",    form:"acro",    display:"acro",    meaning:"top; highest point",      pos:["noun","adj"], group:"greek", examples:["<u>acro</u>nym","<u>acro</u>bat"] },
  { id:"litho",   form:"litho",   display:"litho",   meaning:"stone; rock",             pos:["noun"],       group:"greek", examples:["<u>litho</u>graph","<u>litho</u>sphere"] },
  { id:"pyro",    form:"pyro",    display:"pyro",    meaning:"fire",                    pos:["noun"],       group:"greek", examples:["<u>pyro</u>mancy","<u>pyro</u>technics"] },
  { id:"socio",   form:"socio",   display:"socio",   meaning:"society; social",         pos:["noun","adj"], group:"latin", examples:["<u>socio</u>pathy","<u>socio</u>logy"] },
  { id:"hydro",   form:"hydro",   display:"hydro",   meaning:"water",                   pos:["noun","adj"], group:"greek", examples:["<u>hydro</u>lysis","<u>hydro</u>electric"] },
  { id:"electro", form:"electro", display:"electro", meaning:"electricity; electric",   pos:["noun","adj"], group:"greek", examples:["<u>electro</u>lysis","<u>electro</u>magnetic"] },
  { id:"ortho",   form:"ortho",   display:"ortho",   meaning:"straight; correct",       pos:["adj"],        group:"greek", examples:["<u>ortho</u>dox","<u>ortho</u>graphy"] },
  { id:"gastro",  form:"gastro",  display:"gastro",  meaning:"stomach; food",           pos:["noun"],       group:"greek", examples:["<u>gastro</u>nomy","<u>gastro</u>pod"] },
  { id:"para",    form:"para",    display:"para",    meaning:"beside; beyond; against", pos:["noun","adj"], group:"greek", examples:["<u>para</u>dox","<u>para</u>lysis"] },
  { id:"soci",    form:"soci",    display:"soci",    meaning:"society; companion",      pos:["noun"],       group:"latin", examples:["<u>soci</u>ology","<u>soci</u>al"] },
  { id:"neur",    form:"neur",    display:"neur",    meaning:"nerve; nervous system",   pos:["noun"],       group:"greek", examples:["<u>neur</u>ology","<u>neur</u>al"] },
  { id:"entom",   form:"entom",   display:"entom",   meaning:"insect",                  pos:["noun"],       group:"greek", examples:["<u>entom</u>ology","<u>entom</u>ologist"] },
  { id:"ornith",  form:"ornith",  display:"ornith",  meaning:"bird",                    pos:["noun"],       group:"greek", examples:["<u>ornith</u>ology","<u>ornith</u>ologist"] },
  { id:"ana",     form:"ana",     display:"ana",     meaning:"up; back; again",         pos:["noun","verb"],group:"greek", examples:["<u>ana</u>lysis","<u>ana</u>tomy"] },
  { id:"geno",    form:"geno",    display:"geno",    meaning:"origin; race; kind",      pos:["noun"],       group:"greek", examples:["<u>geno</u>type","<u>geno</u>me"] },
  { id:"arthro",  form:"arthro",  display:"arthro",  meaning:"joint",                   pos:["noun"],       group:"greek", examples:["<u>arthro</u>pod","<u>arthro</u>scopy"] },
  { id:"gyro",    form:"gyro",    display:"gyro",    meaning:"circle; rotation",        pos:["noun"],       group:"greek", examples:["<u>gyro</u>scope","<u>gyro</u>compass"] },
  { id:"tetra",   form:"tetra",   display:"tetra",   meaning:"four",                    pos:["noun","adj"], group:"greek", examples:["<u>tetra</u>hedron","<u>tetra</u>gon"] },
  { id:"oxy",     form:"oxy",     display:"oxy",     meaning:"sharp; acid; oxygen",     pos:["noun","adj"], group:"greek", examples:["<u>oxy</u>gen","<u>oxy</u>moron"] },
  { id:"nitro",   form:"nitro",   display:"nitro",   meaning:"nitrogen; nitric",        pos:["noun"],       group:"greek", examples:["<u>nitro</u>gen","<u>nitro</u>glycerin"] },
  { id:"techno",  form:"techno",  display:"techno",  meaning:"technology; skill",       pos:["noun","adj"], group:"greek", examples:["<u>techno</u>cracy","<u>techno</u>logy"] },
  { id:"cata",    form:"cata",    display:"cata",    meaning:"down; against; completely",pos:["noun","verb"],group:"greek", examples:["<u>cata</u>lysis","<u>cata</u>logue"] },
];

const ALL_EXT_BASES = [...EXT_BASES, ...EXT_EXTRA_BASES];

// ── VALID COMBOS (curated word list for the morpheme builder) ─────────────────
// Each entry: { prefix, base, suffix1, suffix2, word }
// prefix/suffix1/suffix2 are ids (strings) or null. base is an id (string).
// "word" is the correct English spelling — overrides naive concatenation.

const EXT_VALID_COMBOS = [

  // ── -ology ────────────────────────────────────────────────────────────────
  { prefix:null,    base:"anthrop", suffix1:"ology",    suffix2:null, word:"anthropology"   },
  { prefix:null,    base:"bio",     suffix1:"ology",    suffix2:null, word:"biology"        },
  { prefix:null,    base:"cardi",   suffix1:"ology",    suffix2:null, word:"cardiology"     },
  { prefix:null,    base:"chron",   suffix1:"ology",    suffix2:null, word:"chronology"     },
  { prefix:null,    base:"cosm",    suffix1:"ology",    suffix2:null, word:"cosmology"      },
  { prefix:null,    base:"geo",     suffix1:"ology",    suffix2:null, word:"geology"        },
  { prefix:null,    base:"morph",   suffix1:"ology",    suffix2:null, word:"morphology"     },
  { prefix:null,    base:"path",    suffix1:"ology",    suffix2:null, word:"pathology"      },
  { prefix:null,    base:"psych",   suffix1:"ology",    suffix2:null, word:"psychology"     },
  { prefix:null,    base:"theo",    suffix1:"ology",    suffix2:null, word:"theology"       },
  { prefix:null,    base:"typ",     suffix1:"ology",    suffix2:null, word:"typology"       },
  { prefix:null,    base:"zoo",     suffix1:"ology",    suffix2:null, word:"zoology"        },

  // ── tele- ─────────────────────────────────────────────────────────────────
  { prefix:null,    base:"tele",    suffix1:"graph",    suffix2:null, word:"telegraph"      },
  { prefix:null,    base:"tele",    suffix1:"scope",    suffix2:null, word:"telescope"      },
  { prefix:null,    base:"tele",    suffix1:"phone",    suffix2:null, word:"telephone"      },
  { prefix:null,    base:"tele",    suffix1:"gram",     suffix2:null, word:"telegram"       },

  // ── micro- ────────────────────────────────────────────────────────────────
  { prefix:null,    base:"micro",   suffix1:"scope",    suffix2:null, word:"microscope"     },
  { prefix:null,    base:"micro",   suffix1:"phone",    suffix2:null, word:"microphone"     },
  { prefix:null,    base:"micro",   suffix1:"graph",    suffix2:null, word:"micrograph"     },

  // ── auto- ─────────────────────────────────────────────────────────────────
  { prefix:null,    base:"auto",    suffix1:"graph",    suffix2:null, word:"autograph"      },
  { prefix:null,    base:"auto",    suffix1:"nomy",     suffix2:null, word:"autonomy"       },
  { prefix:null,    base:"auto",    suffix1:"cracy",    suffix2:null, word:"autocracy"      },

  // ── peri- ─────────────────────────────────────────────────────────────────
  { prefix:null,    base:"peri",    suffix1:"scope",    suffix2:null, word:"periscope"      },

  // ── photo- ────────────────────────────────────────────────────────────────
  { prefix:null,    base:"photo",   suffix1:"graph",    suffix2:null, word:"photograph"     },
  { prefix:null,    base:"photo",   suffix1:"genic",    suffix2:null, word:"photogenic"     },

  // ── governance / society ──────────────────────────────────────────────────
  { prefix:null,    base:"demo",    suffix1:"cracy",    suffix2:null, word:"democracy"      },
  { prefix:null,    base:"theo",    suffix1:"cracy",    suffix2:null, word:"theocracy"      },
  { prefix:null,    base:"astro",   suffix1:"nomy",     suffix2:null, word:"astronomy"      },
  { prefix:null,    base:"eco",     suffix1:"nomy",     suffix2:null, word:"economy"        },
  { prefix:null,    base:"mono",    suffix1:"archy",    suffix2:null, word:"monarchy"       },
  { prefix:null,    base:"mono",    suffix1:"logue",    suffix2:null, word:"monologue"      },

  // ── -oid ─────────────────────────────────────────────────────────────────
  { prefix:null,    base:"anthrop", suffix1:"oid",      suffix2:null, word:"anthropoid"     },
  { prefix:null,    base:"aster",   suffix1:"oid",      suffix2:null, word:"asteroid"       },

  // ── -genesis ─────────────────────────────────────────────────────────────
  { prefix:null,    base:"bio",     suffix1:"genesis",  suffix2:null, word:"biogenesis"     },
  { prefix:null,    base:"path",    suffix1:"genesis",  suffix2:null, word:"pathogenesis"   },

  // ── -vore ────────────────────────────────────────────────────────────────
  { prefix:null,    base:"omni",    suffix1:"vore",     suffix2:null, word:"omnivore"       },
  { prefix:null,    base:"carni",   suffix1:"vore",     suffix2:null, word:"carnivore"      },
  { prefix:null,    base:"herbi",   suffix1:"vore",     suffix2:null, word:"herbivore"      },

  // ── other base + suffix ───────────────────────────────────────────────────
  { prefix:null,    base:"phil",    suffix1:"sophy",    suffix2:null, word:"philosophy"     },
  { prefix:null,    base:"sol",     suffix1:"tude",     suffix2:null, word:"solitude"       },
  { prefix:null,    base:"magn",    suffix1:"tude",     suffix2:null, word:"magnitude"      },
  { prefix:null,    base:"pseudo",  suffix1:"nym",      suffix2:null, word:"pseudonym"      },
  { prefix:null,    base:"proto",   suffix1:"type",     suffix2:null, word:"prototype"      },
  { prefix:null,    base:"tri",     suffix1:"pod",      suffix2:null, word:"tripod"         },

  // ── prefix + base (no suffix) ─────────────────────────────────────────────
  { prefix:"poly",  base:"morph",   suffix1:null,       suffix2:null, word:"polymorph"      },
  { prefix:"micro", base:"cosm",    suffix1:null,       suffix2:null, word:"microcosm"      },
  { prefix:"patho", base:"gen",     suffix1:null,       suffix2:null, word:"pathogen"       },
  { prefix:"hydro", base:"gen",     suffix1:null,       suffix2:null, word:"hydrogen"       },

  // ── -graph ────────────────────────────────────────────────────────────────
  { prefix:null,    base:"poly",    suffix1:"graph",    suffix2:null, word:"polygraph"      },
  { prefix:null,    base:"litho",   suffix1:"graph",    suffix2:null, word:"lithograph"     },
  { prefix:null,    base:"mono",    suffix1:"graph",    suffix2:null, word:"monograph"      },

  // ── -gram ─────────────────────────────────────────────────────────────────
  { prefix:null,    base:"dia",     suffix1:"gram",     suffix2:null, word:"diagram"        },
  { prefix:null,    base:"cardi",   suffix1:"gram",     suffix2:null, word:"cardiogram"     },

  // ── -logue ────────────────────────────────────────────────────────────────
  { prefix:null,    base:"dia",     suffix1:"logue",    suffix2:null, word:"dialogue"       },

  // ── -gamy ─────────────────────────────────────────────────────────────────
  { prefix:null,    base:"mono",    suffix1:"gamy",     suffix2:null, word:"monogamy"       },
  { prefix:null,    base:"poly",    suffix1:"gamy",     suffix2:null, word:"polygamy"       },

  // ── -chrome ───────────────────────────────────────────────────────────────
  { prefix:null,    base:"mono",    suffix1:"chrome",   suffix2:null, word:"monochrome"     },
  { prefix:null,    base:"poly",    suffix1:"chrome",   suffix2:null, word:"polychrome"     },

  // ── -hedron ───────────────────────────────────────────────────────────────
  { prefix:null,    base:"poly",    suffix1:"hedron",   suffix2:null, word:"polyhedron"     },
  { prefix:null,    base:"tetra",   suffix1:"hedron",   suffix2:null, word:"tetrahedron"    },

  // ── -phone (extra) ────────────────────────────────────────────────────────
  { prefix:null,    base:"mega",    suffix1:"phone",    suffix2:null, word:"megaphone"      },

  // ── -nym ──────────────────────────────────────────────────────────────────
  { prefix:null,    base:"homo",    suffix1:"nym",      suffix2:null, word:"homonym"        },
  { prefix:null,    base:"acro",    suffix1:"nym",      suffix2:null, word:"acronym"        },

  // ── -dox ──────────────────────────────────────────────────────────────────
  { prefix:null,    base:"ortho",   suffix1:"dox",      suffix2:null, word:"orthodox"       },
  { prefix:null,    base:"para",    suffix1:"dox",      suffix2:null, word:"paradox"        },

  // ── -lysis ────────────────────────────────────────────────────────────────
  { prefix:null,    base:"hydro",   suffix1:"lysis",    suffix2:null, word:"hydrolysis"     },
  { prefix:null,    base:"electro", suffix1:"lysis",    suffix2:null, word:"electrolysis"   },
  { prefix:null,    base:"ana",     suffix1:"lysis",    suffix2:null, word:"analysis"       },
  { prefix:null,    base:"para",    suffix1:"lysis",    suffix2:null, word:"paralysis"      },
  { prefix:null,    base:"dia",     suffix1:"lysis",    suffix2:null, word:"dialysis"       },
  { prefix:null,    base:"cata",    suffix1:"lysis",    suffix2:null, word:"catalysis"      },

  // ── -pathy ────────────────────────────────────────────────────────────────
  { prefix:null,    base:"tele",    suffix1:"pathy",    suffix2:null, word:"telepathy"      },
  { prefix:null,    base:"socio",   suffix1:"pathy",    suffix2:null, word:"sociopathy"     },

  // ── -mancy ────────────────────────────────────────────────────────────────
  { prefix:null,    base:"pyro",    suffix1:"mancy",    suffix2:null, word:"pyromancy"      },
  { prefix:null,    base:"geo",     suffix1:"mancy",    suffix2:null, word:"geomancy"       },

  // ── -pod ──────────────────────────────────────────────────────────────────
  { prefix:null,    base:"gastro",  suffix1:"pod",      suffix2:null, word:"gastropod"      },
  { prefix:null,    base:"arthro",  suffix1:"pod",      suffix2:null, word:"arthropod"      },

  // ── -nomy (extra) ─────────────────────────────────────────────────────────
  { prefix:null,    base:"gastro",  suffix1:"nomy",     suffix2:null, word:"gastronomy"     },

  // ── -kinesis ──────────────────────────────────────────────────────────────
  { prefix:null,    base:"tele",    suffix1:"kinesis",  suffix2:null, word:"telekinesis"    },

  // ── -scope (extra) ────────────────────────────────────────────────────────
  { prefix:null,    base:"gyro",    suffix1:"scope",    suffix2:null, word:"gyroscope"      },

  // ── -plasm ────────────────────────────────────────────────────────────────
  { prefix:null,    base:"proto",   suffix1:"plasm",    suffix2:null, word:"protoplasm"     },

  // ── -sophy ────────────────────────────────────────────────────────────────
  { prefix:null,    base:"theo",    suffix1:"sophy",    suffix2:null, word:"theosophy"      },

  // ── -ology (extra) ────────────────────────────────────────────────────────
  { prefix:null,    base:"soci",    suffix1:"ology",    suffix2:null, word:"sociology"      },
  { prefix:null,    base:"neur",    suffix1:"ology",    suffix2:null, word:"neurology"      },
  { prefix:null,    base:"entom",   suffix1:"ology",    suffix2:null, word:"entomology"     },
  { prefix:null,    base:"ornith",  suffix1:"ology",    suffix2:null, word:"ornithology"    },

  // ── -cide ─────────────────────────────────────────────────────────────────
  { prefix:null,    base:"herbi",   suffix1:"cide",     suffix2:null, word:"herbicide"      },

  // ── -type (extra) ─────────────────────────────────────────────────────────
  { prefix:null,    base:"geno",    suffix1:"type",     suffix2:null, word:"genotype"       },
  { prefix:null,    base:"arch",    suffix1:"type",     suffix2:null, word:"archetype"      },

  // ── -tomy ─────────────────────────────────────────────────────────────────
  { prefix:null,    base:"ana",     suffix1:"tomy",     suffix2:null, word:"anatomy"        },

  // ── -cracy (extra) ────────────────────────────────────────────────────────
  { prefix:null,    base:"techno",  suffix1:"cracy",    suffix2:null, word:"technocracy"    },

  // ── -gen (used as suffix) ─────────────────────────────────────────────────
  { prefix:null,    base:"oxy",     suffix1:"gen",      suffix2:null, word:"oxygen"         },
  { prefix:null,    base:"nitro",   suffix1:"gen",      suffix2:null, word:"nitrogen"       },

  // ── prefix + base (extra) ────────────────────────────────────────────────
  { prefix:"psycho",base:"path",    suffix1:null,       suffix2:null, word:"psychopath"     },
  { prefix:"pyro",  base:"gen",     suffix1:null,       suffix2:null, word:"pyrogen"        },

  // ── prefix + base + suffix ────────────────────────────────────────────────
  { prefix:"geo",   base:"morph",   suffix1:"ology",    suffix2:null, word:"geomorphology"  },
  { prefix:"micro", base:"bio",     suffix1:"ology",    suffix2:null, word:"microbiology"   },
  { prefix:"neuro", base:"path",    suffix1:"ology",    suffix2:null, word:"neuropathology" },
  { prefix:"psycho",base:"path",    suffix1:"ology",    suffix2:null, word:"psychopathology"},
  { prefix:"geo",   base:"chron",   suffix1:"ology",    suffix2:null, word:"geochronology"  },
  { prefix:"neuro", base:"bio",     suffix1:"ology",    suffix2:null, word:"neurobiology"   },

];

// ── EXPORT ────────────────────────────────────────────────────────────────────

window.WL_EXTENSION = {
  prefixes:        EXT_PREFIXES,
  suffixes:        EXT_SUFFIXES,
  bases:           ALL_EXT_BASES,
  validCombos:     EXT_VALID_COMBOS,
  meaningPrefixes:    EXT_MEANING_PREFIXES,
  meaningSuffixes:    EXT_MEANING_SUFFIXES,
  meaningBases:       EXT_MEANING_BASES,
  missionBases:       EXT_MISSION_BASES,
  missionSuffixBases: EXT_MISSION_SUFFIX_BASES,
  missions:        EXT_MISSIONS,
  syllableWords:   EXT_SYLLABLE_WORDS,
  phonemeWords:    EXT_PHONEME_WORDS,
  soundWords:      EXT_SOUND_WORDS,
};

console.log("[Word Lab] Extension data loaded — " +
  EXT_PREFIXES.length        + " prefixes, " +
  EXT_SUFFIXES.length        + " suffixes, " +
  ALL_EXT_BASES.length       + " bases, " +
  EXT_VALID_COMBOS.length    + " valid combos, " +
  EXT_MISSIONS.length        + " missions, " +
  EXT_SYLLABLE_WORDS.length  + " syllable words, " +
  EXT_PHONEME_WORDS.length   + " phoneme words, " +
  EXT_SOUND_WORDS.length     + " sound words.");
