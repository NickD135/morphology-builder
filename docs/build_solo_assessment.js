/* ============================================================================
   SOLO WRITTEN PRE/POST TEST  —  reusable generator engine
   ----------------------------------------------------------------------------
   Produces a printable A4 pre/post test + answer key in the Word Labs SOLO
   house style: one band per page (Red / Yellow / Green), two-column 2x3 grid,
   program palette, written-response questions with the right scaffolds.

   TO MAKE A NEW UNIT: edit ONLY the "EDIT PER UNIT" block (UNIT, ORDER, BOXES).
   Everything below the engine line is fixed and should not be changed, so every
   unit comes out looking identical.

   RUN (in this container):
     node build_solo_assessment.js
   then validate + render-check (see SOLO_Assessment_Builder.md).

   NOTE: docx is required from the global path used in this environment.
============================================================================ */
const fs = require("fs");
const D = require("/home/claude/.npm-global/lib/node_modules/docx");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign, PageBreak,
  Footer, PageNumber, TabStopType } = D;

/* ===========================================================================
   ============================  EDIT PER UNIT  ==============================
   =========================================================================== */

const UNIT = {
  stage:    "Stage 3 \u00b7 Year B",
  number:   "27",
  name:     "Multiplicative Relations",
  type:     "Pre-test / Post-test",
  syllabus: "NSW Mathematics K\u201310 Syllabus (2022)",
  outfile:  "/mnt/user-data/outputs/Unit_27_Multiplicative_Relations_PRE_POST_TEST.docx",
};

// Order the six boxes appear in each band's 2x3 grid (left-right, top-bottom).
// Put structure-heavy / most-formal outcomes LAST so they are not crammed
// beside the first box (e.g. the algorithm R6 sits bottom-right, not next to R1).
const ORDER = ["R1","R2","R3","R4","R5","R6","Y1","Y2","Y3","Y4","Y5","Y6","G1","G2","G3","G4","G5","G6"];

// One object per success criterion. band: RED|YELLOW|GREEN. code: tracker code.
// sc: success-criterion wording (MATCH THE RUBRIC). build(a): array of children,
// where `a` is true on the answer-key pass. Use the scaffold helpers (qLine,
// instr, lines, longAnswer, areaModel, algoBox/workingBox, tableOfValues,
// numberGrid). Keep all maths correct; Australian spelling; no multiple choice.
const BOXES = [
  // ---- RED ----
  { band:"RED", code:"R1", sc:"use the area model to solve multiplication problems", build:(a)=>[
    instr("Use the area model to find each product. Fill in each part, then add."),
    q("a)  34 \u00d7 26"), ...areaModel([30,4],[20,6],884,a),
    q("b)  47 \u00d7 23",{before:170}), ...areaModel([40,7],[20,3],1081,a),
  ]},
  { band:"RED", code:"R6", sc:"use a multiplication algorithm (the standard written method) to solve multiplication problems", build:(a)=>[
    instr("Use the standard algorithm to solve each problem. Show your working in the box."),
    ...algoBox("a)  274 \u00d7 3","822",a), gapPara(), ...algoBox("b)  36 \u00d7 24","864",a),
  ]},
  { band:"RED", code:"R2", sc:"solve multiplication word problems using efficient strategies", build:(a)=>[
    instr("Solve each word problem. Show your working."),
    q("a)  A school orders 28 boxes of pencils. Each box holds 36 pencils. How many pencils altogether?"),
    ...lines(2), longAnswer("28 \u00d7 36 = 1008 pencils",a),
    q("b)  A theatre has 45 rows with 32 seats in each row. How many seats are there in total?",{before:120}),
    ...lines(2), longAnswer("45 \u00d7 32 = 1440 seats",a),
  ]},
  { band:"RED", code:"R3", sc:"determine factors and products, and identify prime, composite and other numbers", build:(a)=>[
    instr("Answer the following."),
    qLine("a)  List all the factors of 24.","1, 2, 3, 4, 6, 8, 12, 24",a,40),
    qLine("b)  List all the factors of 36.","1, 2, 3, 4, 6, 9, 12, 18, 36",a,40),
    a ? para([run("c)  Circle the prime numbers:  "),run("7",{bold:true,color:ANS}),run("   9   "),
             run("11",{bold:true,color:ANS}),run("   15   21   "),run("23",{bold:true,color:ANS})])
      : para([run("c)  Circle the prime numbers:   7    9    11    15    21    23")]),
    qLine("d)  Is 1 prime, composite or neither?","neither",a,20),
  ]},
  { band:"RED", code:"R4", sc:"use multiples to create tables of values and describe patterns using multiplication", build:(a)=>[
    instr("Each shape is made from 6 sticks. Complete the table of values."),
    tableOfValues("Shapes",[1,2,3,4,5,10],"Sticks",[6,12,18,24,30,60],a),
    qLine("a)  Write the rule:  Sticks = Shapes \u00d7","6",a,8),
    qLine("b)  How many sticks are needed for 100 shapes?","600",a,12),
  ]},
  { band:"RED", code:"R5", sc:"select and use efficient strategies to multiply whole numbers of up to 4 digits by 1- and 2-digit numbers", build:(a)=>[
    instr("Solve each problem, showing your working."),
    qLine("a)  1254 \u00d7 6 =","7524",a), ...lines(1),
    qLine("b)  27 \u00d7 345 =","9315",a), ...lines(1),
    q("c)  Estimate first, then solve:  48 \u00d7 2736"),
    qLine("      Estimate:","\u2248 50 \u00d7 2700 = 135 000",a,16),
    qLine("      Exact answer:","131 328",a,14),
  ]},
  // ---- YELLOW ----
  { band:"YELLOW", code:"Y1", sc:"apply strategies to solve division problems and word problems involving division", build:(a)=>[
    instr("Solve each problem. Show your working."),
    qLine("a)  624 \u00f7 8 =","78",a), ...lines(1),
    q("b)  Lily has 456 stickers. She shares them equally into 8 albums. How many stickers per album?"),
    ...lines(2), longAnswer("456 \u00f7 8 = 57 stickers",a),
  ]},
  { band:"YELLOW", code:"Y2", sc:"use and interpret remainders in solutions to division problems", build:(a)=>[
    instr("Solve each problem and interpret the remainder."),
    qLine("a)  453 \u00f7 7 =","64 remainder 5",a),
    q("b)  23 students need to travel by minibus. Each minibus holds 4 students. How many minibuses are needed?",{before:60}),
    qLine("      Answer:","6 minibuses (23 \u00f7 4 = 5 r 3, so round up)",a,14),
    qLine("c)  Write 19 \u00f7 5 as a mixed number.","3 4/5",a,12),
  ]},
  { band:"YELLOW", code:"Y3", sc:"use grouping symbols and apply the order of operations to solve number sentences", build:(a)=>[
    instr("Use the order of operations (BODMAS) to evaluate each."),
    qLine("a)  4 + 5 \u00d7 8 =","44",a),
    qLine("b)  (6 + 8) \u00d7 3 \u2212 4 \u00f7 2 =","40",a),
    qLine("c)  7 + 5 \u00d7 (6 \u2212 9 \u00f7 3) =","22",a),
  ]},
  { band:"YELLOW", code:"Y4", sc:"use inverse operations to solve number sentences involving more than one operation", build:(a)=>[
    instr("Find the missing number in each number sentence."),
    qLine("a)  4 \u00d7 \u25a1 = 36 \u00f7 3        \u25a1 =","3",a,8),
    qLine("b)  \u25a1 \u00f7 6 = 9              \u25a1 =","54",a,8),
    qLine("c)  5 \u00d7 8 = \u25a1 \u00d7 4        \u25a1 =","10",a,8),
  ]},
  { band:"YELLOW", code:"Y5", sc:"solve word problems involving rates using multiplication and division", build:(a)=>[
    instr("Solve each rate problem. Show your working."),
    q("a)  A machine makes 10 toys every minute. How long will it take to make 600 toys?"),
    qLine("      Answer:","600 \u00f7 10 = 60 minutes",a,14),
    q("b)  A soup recipe uses 3 L of stock for 12 people. How much stock is needed for 60 people?",{before:60}),
    qLine("      Answer:","60 \u00f7 12 = 5, so 5 \u00d7 3 = 15 L",a,14),
    qLine("c)  A car travels at 75 km/h. How far does it travel in 3 hours?","75 \u00d7 3 = 225 km",a,14),
  ]},
  { band:"YELLOW", code:"Y6", sc:"recognise that division can be recorded using fractions", build:(a)=>[
    instr("Answer the following."),
    qLine("a)  Write 3 \u00f7 5 as a fraction.","3/5",a,10),
    qLine("b)  3 pizzas are shared equally between 4 people. Each person gets","3/4 of a pizza",a,12),
    qLine("c)  Write 19 \u00f7 5 as a mixed number.","3 4/5",a,10),
    qLine("d)  In the fraction 7/8, what is being divided by what?","7 divided by 8",a,14),
  ]},
  // ---- GREEN ----
  { band:"GREEN", code:"G1", sc:"multiply and divide positive and negative integers", build:(a)=>[
    instr("Work out each answer."),
    qLine("a)  (\u22125) \u00d7 3 =","\u221215",a,8), qLine("b)  (\u22126) \u00d7 (\u22124) =","24",a,8),
    qLine("c)  (\u221224) \u00f7 6 =","\u22124",a,8), qLine("d)  30 \u00f7 (\u22125) =","\u22126",a,8),
  ]},
  { band:"GREEN", code:"G2", sc:"apply the order of operations and grouping symbols to evaluate expressions involving integers", build:(a)=>[
    instr("Evaluate each expression. Show your working."),
    qLine("a)  (\u22125) + 3 \u00d7 (\u22124) =","\u221217",a),
    qLine("b)  (\u22122) \u00d7 6 \u2212 (\u22128) \u00f7 4 =","\u221210",a),
    qLine("c)  ((\u22123) + 7) \u00d7 (\u22125) =","\u221220",a),
  ]},
  { band:"GREEN", code:"G3", sc:"examine pronumerals and write algebraic expressions using concise notation", build:(a)=>[
    instr("Write each using concise algebraic notation."),
    qLine("a)  A number multiplied by 6","6n",a,12),
    qLine("b)  Five less than three times a number","3n \u2212 5",a,12),
    qLine("c)  n + n + n written concisely","3n",a,12),
    qLine("d)  In 3n + 5, name the coefficient and the constant.","coefficient 3, constant 5",a,16),
  ]},
  { band:"GREEN", code:"G4", sc:"create and evaluate algebraic expressions by substituting values for pronumerals", build:(a)=>[
    instr("Substitute the given values and evaluate."),
    qLine("a)  If n = 5, evaluate 3n + 7.","22",a,10),
    qLine("b)  Evaluate 2x + 3y \u2212 5 when x = 4 and y = 2.","9",a,10),
    q("c)  A plumber charges a $60 call-out fee plus $45 per hour. Write an expression for the cost of h hours, then find the cost of 3 hours.",{before:60}),
    qLine("      Expression:","60 + 45h",a,14),
    qLine("      Cost of 3 hours:","$195",a,12),
  ]},
  { band:"GREEN", code:"G5", sc:"identify like terms and simplify algebraic expressions by adding and subtracting", build:(a)=>[
    instr("Simplify each expression by collecting like terms."),
    qLine("a)  3x + 5y \u2212 2x + y =","x + 6y",a,14),
    qLine("b)  4m + 3n \u2212 m + 2n \u2212 5 =","3m + 5n \u2212 5",a,16),
    q("c)  Can 3x + 2 be simplified to 5x? Explain your answer.",{before:60}),
    longAnswer("No \u2014 3x and 2 are unlike terms, so they cannot be added together.",a),
  ]},
  { band:"GREEN", code:"G6", sc:"apply the distributive law to expand and simplify algebraic expressions", build:(a)=>[
    instr("Expand each expression. Simplify where possible."),
    qLine("a)  3(x + 4) =","3x + 12",a,12), qLine("b)  2(3n \u2212 5) =","6n \u2212 10",a,12),
    qLine("c)  \u22123(m + 4) =","\u22123m \u2212 12",a,12),
    qLine("d)  Expand and simplify:  2(x + 3) + 3(x \u2212 1) =","5x + 3",a,12),
  ]},
];

/* ===========================================================================
   ==============================  ENGINE  ===================================
   ============  (fixed house style — do not edit below this line)  ===========
   =========================================================================== */

// --- palette (sampled from the SOLO programs) ---
const FONT="Arial", INK="1A1A1A", GREY="5C5C5C";
const NAVY="1F3864", NAVY_SUB="AFC3DA";
const RED="C00000", YELLOW="7F6000", GREEN="375623", WHITE="FFFFFF";
const ANS="375623";                                  // answer-key ink (green)
const BAND={
  RED:   {bar:RED,    tint:"FCDBD9", label:"RED \u2014 Foundation",  codes:"R1\u2013R6"},
  YELLOW:{bar:YELLOW, tint:"FFF9E6", label:"YELLOW \u2014 On-level", codes:"Y1\u2013Y6"},
  GREEN: {bar:GREEN,  tint:"EBF3E6", label:"GREEN \u2014 Extension", codes:"G1\u2013G6"},
};
const GRIDHEAD="D6E4F0", INFOFILL="F2F4F7", KEYFILL="FFF9E6";

// --- page geometry (A4, 0.2 inch margins) ---
const MARGIN=288, PAGE_W=11906, PAGE_H=16838;
const CONTENT=PAGE_W-2*MARGIN, COLW=Math.floor(CONTENT/2);

// --- borders (fine ~0.2pt hairline) ---
const hair={style:BorderStyle.SINGLE,size:2,color:"BFBFBF"}, NB={style:BorderStyle.NONE};
const cellB={top:hair,bottom:hair,left:hair,right:hair};
const allHair={top:hair,bottom:hair,left:hair,right:hair,insideHorizontal:hair,insideVertical:hair};
const noEdges={top:NB,bottom:NB,left:NB,right:NB,insideHorizontal:NB,insideVertical:NB};

// --- box row heights (stretch rows to fill the page; ceiling ~4400/4760) ---
const ROWH_INFO=4380, ROWH_PLAIN=4740;
// --- question spacing (spread questions down the box; ceiling ~380) ---
const Q_AFTER=370, PARA_AFTER=185, INSTR_AFTER=166, LINE_BEFORE=205;

// ---------------------------------------------------------------- text helpers
function run(t,o={}){return new TextRun({text:t,font:FONT,size:o.size||19,bold:!!o.bold,italics:!!o.italics,color:o.color||INK});}
function para(ch,o={}){return new Paragraph({children:Array.isArray(ch)?ch:[ch],
  spacing:{before:o.before??0,after:o.after??PARA_AFTER,line:o.line||248},alignment:o.align||AlignmentType.LEFT});}
// plain question/prompt line (wraps); pass {before} to add a gap above
function q(text,o={}){return para([run(text)],o);}
// single-line question with an inline answer blank (filled green on the key)
function qLine(text,ans,showA,bl=11){const k=[run(text+" ")];
  if(showA&&ans!=null)k.push(run(String(ans),{bold:true,color:ANS}));else k.push(run("_".repeat(bl),{color:GREY}));
  return para(k,{after:Q_AFTER});}
// italic grey instruction line
function instr(text){return para([run(text,{italics:true,color:GREY,size:15})],{after:INSTR_AFTER});}
// n blank writing lines (working space)
function lines(n){const o=[];for(let i=0;i<(n||1);i++)o.push(para([run(" ")],{after:0,before:LINE_BEFORE}));return o;}
// full-width ruled answer line for explanations (green arrow + text on the key)
function longAnswer(ans,showA){return showA
  ? para([run("\u2192 ",{bold:true,color:ANS}),run(ans,{bold:true,color:ANS})])
  : para([run("_".repeat(44),{color:GREY})]);}
function gapPara(){return para([run(" ")],{after:0});}

// ----------------------------------------------------------- scaffold builders
// Multiplication area model. top/left = partitions; products auto-computed.
function areaModel(top,left,total,showA){const cw=1230;
  const mk=(t,h,a)=>new TableCell({width:{size:cw,type:WidthType.DXA},borders:cellB,margins:{top:54,bottom:54,left:30,right:30},
    shading:h?{fill:GRIDHEAD,type:ShadingType.CLEAR}:undefined,verticalAlign:VerticalAlign.CENTER,
    children:[para([run(t,{bold:h,size:17,color:a?ANS:INK})],{align:AlignmentType.CENTER,after:0})]});
  const rows=[new TableRow({children:[mk("\u00d7",true),...top.map(t=>mk(String(t),true))]})];
  left.forEach(lp=>rows.push(new TableRow({children:[mk(String(lp),true),...top.map(tp=>mk(showA?String(lp*tp):"",false,true))]})));
  const grid=new Table({width:{size:cw*(top.length+1),type:WidthType.DXA},columnWidths:Array(top.length+1).fill(cw),borders:allHair,rows});
  const tp=para([run("Total = ",{bold:true,size:17}),showA?run(String(total),{bold:true,color:ANS,size:17}):run("_".repeat(10),{color:GREY})],{before:42,after:14});
  return [grid,tp];}
// Bordered working box with a problem label (algorithms, diagrams, drawings...).
// = workingBox; pass width/height to resize.
function algoBox(problem,answer,showA,w=4500,h=760){const p=para([run(problem,{bold:true})],{after:24});
  const box=new Table({width:{size:w,type:WidthType.DXA},columnWidths:[w],borders:allHair,
    rows:[new TableRow({height:{value:h,rule:"atLeast"},children:[new TableCell({width:{size:w,type:WidthType.DXA},borders:cellB,
      margins:{top:34,bottom:34,left:100,right:100},verticalAlign:VerticalAlign.TOP,
      children:showA?[para([run("= ",{bold:true,color:ANS}),run(answer,{bold:true,color:ANS})],{after:0})]:[para([run(" ")],{after:0})]})]})]});
  return [p,box];}
const workingBox=algoBox;
// Table of values for patterns / data. headers + data arrays (data shown on key).
function tableOfValues(hLabel,headers,dLabel,data,showA){const labelW=1080,valW=720;
  const mk=(t,h,a)=>new TableCell({width:{size:valW,type:WidthType.DXA},borders:cellB,margins:{top:48,bottom:48,left:20,right:20},
    shading:h?{fill:GRIDHEAD,type:ShadingType.CLEAR}:undefined,verticalAlign:VerticalAlign.CENTER,
    children:[para([run(t,{bold:h,size:16,color:a?ANS:INK})],{align:AlignmentType.CENTER,after:0})]});
  const lab=t=>new TableCell({width:{size:labelW,type:WidthType.DXA},borders:cellB,margins:{top:48,bottom:48,left:60,right:20},
    shading:{fill:GRIDHEAD,type:ShadingType.CLEAR},verticalAlign:VerticalAlign.CENTER,children:[para([run(t,{bold:true,size:16})],{after:0})]});
  return new Table({width:{size:labelW+valW*headers.length,type:WidthType.DXA},columnWidths:[labelW,...headers.map(()=>valW)],borders:allHair,
    rows:[new TableRow({children:[lab(hLabel),...headers.map(h=>mk(String(h),true))]}),
          new TableRow({children:[lab(dLabel),...data.map(d=>mk(showA?String(d):"",false,true))]})]});}
// Blank c-by-r grid (coordinate plane, place-value chart, hundreds-chart slice).
function numberGrid(cols,rows,cellH=420,cellW=560){
  const trs=[];for(let r=0;r<rows;r++){const cells=[];
    for(let c=0;c<cols;c++)cells.push(new TableCell({width:{size:cellW,type:WidthType.DXA},borders:cellB,children:[para([run(" ")],{after:0})]}));
    trs.push(new TableRow({height:{value:cellH,rule:"atLeast"},children:cells}));}
  return new Table({width:{size:cellW*cols,type:WidthType.DXA},columnWidths:Array(cols).fill(cellW),borders:allHair,rows:trs});}

// -------------------------------------------------------------- layout helpers
function boxCell(b,showA){const s=BAND[b.band];
  const head=new Paragraph({shading:{fill:s.tint,type:ShadingType.CLEAR},spacing:{before:0,after:46,line:228},
    children:[run(b.code+"  ",{bold:true,size:19,color:s.bar}),run(b.sc,{bold:true,size:17})]});
  return new TableCell({width:{size:COLW,type:WidthType.DXA},borders:cellB,margins:{top:56,bottom:90,left:120,right:120},
    verticalAlign:VerticalAlign.TOP,children:[head,...b.build(showA)]});}
function pairRow(b1,b2,showA,rowH){const c2=b2?boxCell(b2,showA):new TableCell({width:{size:COLW,type:WidthType.DXA},borders:cellB,children:[para([run(" ")])]});
  return new TableRow({height:rowH?{value:rowH,rule:"atLeast"}:undefined,children:[boxCell(b1,showA),c2]});}
function bandRow(band){const s=BAND[band];
  return new TableRow({children:[new TableCell({columnSpan:2,width:{size:CONTENT,type:WidthType.DXA},borders:cellB,
    shading:{fill:s.bar,type:ShadingType.CLEAR},margins:{top:54,bottom:54,left:170,right:170},verticalAlign:VerticalAlign.CENTER,
    children:[para([run(s.label,{bold:true,size:22,color:WHITE}),run("        "+s.codes,{bold:true,size:17,color:WHITE})],{after:0})]})]});}
function bandTable(band,showA,rowH){
  const items=BOXES.filter(b=>b.band===band).sort((a,b)=>ORDER.indexOf(a.code)-ORDER.indexOf(b.code));
  const rows=[bandRow(band)];
  for(let i=0;i<items.length;i+=2) rows.push(pairRow(items[i],items[i+1],showA,rowH));
  return new Table({width:{size:CONTENT,type:WidthType.DXA},columnWidths:[COLW,COLW],borders:allHair,rows});}
function titleBar(){
  const left=new TableCell({width:{size:CONTENT-2300,type:WidthType.DXA},borders:noEdges,shading:{fill:NAVY,type:ShadingType.CLEAR},
    margins:{top:86,bottom:86,left:200,right:100},verticalAlign:VerticalAlign.CENTER,
    children:[para([run("STAGE 3 \u00b7 YEAR B \u00b7 UNIT "+UNIT.number+"    ",{size:14,bold:true,color:NAVY_SUB}),
      run(UNIT.name,{size:21,bold:true,color:WHITE}),run("   \u00b7  "+UNIT.type,{size:15,bold:true,color:WHITE})],{after:0})]});
  const right=new TableCell({width:{size:2300,type:WidthType.DXA},borders:noEdges,shading:{fill:NAVY,type:ShadingType.CLEAR},
    margins:{top:86,bottom:86,left:100,right:200},verticalAlign:VerticalAlign.CENTER,
    children:[para([run("WORD LABS SOLO",{size:15,bold:true,color:WHITE})],{after:0,align:AlignmentType.RIGHT})]});
  return new Table({width:{size:CONTENT,type:WidthType.DXA},columnWidths:[CONTENT-2300,2300],borders:noEdges,rows:[new TableRow({children:[left,right]})]});}
function infoStrip(){
  const cell=(l)=>new TableCell({width:{size:Math.floor(CONTENT/3),type:WidthType.DXA},borders:noEdges,
    shading:{fill:INFOFILL,type:ShadingType.CLEAR},margins:{top:78,bottom:78,left:170,right:80},verticalAlign:VerticalAlign.CENTER,
    children:[para([run(l,{bold:true,size:18,color:"33475B"}),run("  "+"_".repeat(18),{color:GREY})],{after:0})]});
  return new Table({width:{size:CONTENT,type:WidthType.DXA},columnWidths:[Math.floor(CONTENT/3),Math.floor(CONTENT/3),CONTENT-2*Math.floor(CONTENT/3)],
    borders:noEdges,rows:[new TableRow({children:[cell("Name"),cell("Class"),cell("Date")]})]});}
function answerBar(){return new Table({width:{size:CONTENT,type:WidthType.DXA},columnWidths:[CONTENT],borders:noEdges,
  rows:[new TableRow({children:[new TableCell({width:{size:CONTENT,type:WidthType.DXA},borders:cellB,
    shading:{fill:KEYFILL,type:ShadingType.CLEAR},margins:{top:56,bottom:56,left:180,right:180},
    children:[para([run("ANSWER KEY",{bold:true,size:20,color:"7F6000"}),run("    \u00b7    teacher reference \u2014 do not print for students",{italics:true,size:15,color:GREY})],{after:0})]})]})]});}
const gap=(h)=>para([run(" ",{size:10})],{after:0,before:h||60});
function pb(){return new Paragraph({children:[new PageBreak()],spacing:{after:0,before:0}});}

function buildChildren(){
  return [
    titleBar(),gap(36),infoStrip(),gap(54),bandTable("RED",false,ROWH_INFO),pb(),
    titleBar(),gap(54),bandTable("YELLOW",false,ROWH_PLAIN),pb(),
    titleBar(),gap(54),bandTable("GREEN",false,ROWH_PLAIN),pb(),
    titleBar(),gap(36),answerBar(),gap(54),bandTable("RED",true,ROWH_INFO),pb(),
    titleBar(),gap(54),bandTable("YELLOW",true,ROWH_PLAIN),pb(),
    titleBar(),gap(54),bandTable("GREEN",true,ROWH_PLAIN),
  ];
}
const footer=new Footer({children:[new Paragraph({tabStops:[{type:TabStopType.RIGHT,position:CONTENT}],
  border:{top:{style:BorderStyle.SINGLE,size:2,color:"DDDDDD",space:4}},
  children:[run("Word Labs SOLO  \u00b7  "+UNIT.stage+"  \u00b7  Unit "+UNIT.number+" "+UNIT.name,{size:14,color:GREY}),
    new TextRun({text:"\tPage ",font:FONT,size:14,color:GREY}),new TextRun({children:[PageNumber.CURRENT],font:FONT,size:14,color:GREY})]})]});

const doc=new Document({styles:{default:{document:{run:{font:FONT,size:19,color:INK}}}},
  sections:[{properties:{page:{size:{width:PAGE_W,height:PAGE_H},margin:{top:MARGIN,bottom:430,left:MARGIN,right:MARGIN}}},
    footers:{default:footer},children:buildChildren()}]});

Packer.toBuffer(doc).then(buf=>{fs.writeFileSync(UNIT.outfile,buf);console.log("Wrote",UNIT.outfile);});
