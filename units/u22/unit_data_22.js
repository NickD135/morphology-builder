/**
 * Unit 22 — Addition & Subtraction Strategies and Decimals (Stage 3 Year B).
 * Deliverable B. Built from units/u22/00_rubric_draft.md + 01_mapping_review.md.
 * Matches the UNIT DATA SCHEMA at the bottom of scripts/build_program_template.js.
 *
 * Decimal place value to thousandths (interpret/partition); decimals on a number line + approximate;
 * round to estimate and check for errors; add 3+ numbers with place value; choose/compare/justify
 * efficient strategies; multistep word problems; add/subtract decimals to 3 dp; decimal word problems
 * with justification. Green = Stage 4 ×/÷ decimals, integers, order of operations.
 *
 * Banding: cognitive demand (A-heavy early Year B unit). A/B group labelled on every content point.
 *
 * Program has the resource appendix merged; a standalone Unit22_Resource_Appendix.docx is also emitted.
 * Every resource URL verified live in Stage 3 (units/u22/03_resources_staged.csv) and is DB-CANONICAL
 * in the Supabase `resources` table (units/u22/04_insert.sql inserted + verified, 35 rows).
 *
 * Outcome -> Mini Lesson map: R1->1 R2->2 R3->3 R4->4 Y1->5 Y2->6 Y3->7 Y4->8 G1->9 G2->10 G3->11
 */
module.exports = {
  unit_number: "22",
  unit_title: "Addition & Subtraction Strategies and Decimals",
  term: null,
  duration: "2-3 weeks",

  resource_appendix_attached: true,

  // Every URL verified live in Stage 3 (videos oEmbed-verified, worksheets curl HTTP 200);
  // see units/u22/03_resources_staged.csv. DB-canonical (units/u22/04_insert.sql).
  resources: {
    r1: [
      { type: "video", label: "Place Value to the Thousandths — Representing Decimal Numbers | Miacademy", url: "https://www.youtube.com/watch?v=BsZJGMRWEK0" },
      { type: "video", label: "Expanded Form with Decimals | Math with Mr. J", url: "https://www.youtube.com/watch?v=GX8o-S6Vxig" },
      { type: "worksheet", label: "Corbettmaths — Place Value (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf" },
    ],
    r2: [
      { type: "video", label: "Writing Tenths and Hundredths (Decimals and Fractions) | Math with Mr. J", url: "https://www.youtube.com/watch?v=ibR_iBxnITE" },
      { type: "video", label: "Comparing and Ordering Decimals | Math with Mr. J", url: "https://www.youtube.com/watch?v=KWsLyjXKhrM" },
      { type: "worksheet", label: "Corbettmaths — Ordering Decimals (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/ordering-decimals-pdf.pdf" },
    ],
    r3: [
      { type: "video", label: "Estimating Whole Number Sums and Differences | Math with Mr. J", url: "https://www.youtube.com/watch?v=EvQf38lnAJc" },
      { type: "video", label: "Estimating Decimal Sums | Math with Mr. J", url: "https://www.youtube.com/watch?v=x05LHZJNKQ0" },
      { type: "worksheet", label: "Corbettmaths — Rounding (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/rounding-pdf.pdf" },
      { type: "worksheet", label: "Corbettmaths — Estimation (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/estimation-pdf.pdf" },
    ],
    r4: [
      { type: "video", label: "How to Add and Subtract Large Numbers | Math with Mr. J", url: "https://www.youtube.com/watch?v=186wdnoAYJc" },
      { type: "video", label: "Adding Large Numbers — A Quick Review | Math with Mr. J", url: "https://www.youtube.com/watch?v=T9asFgfN5bg" },
      { type: "worksheet", label: "Corbettmaths — Place Value (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf" },
    ],
    y1: [
      { type: "video", label: "How to Use Bridging to Support Mental Addition and Subtraction | Third Space Learning", url: "https://www.youtube.com/watch?v=oDDC1thyc2Q" },
      { type: "video", label: "Addition and Subtraction — The Compensation Strategy | Charlotte Dooley", url: "https://www.youtube.com/watch?v=X3kgzlb8VrM" },
      { type: "worksheet", label: "Corbettmaths — Place Value (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf" },
    ],
    y2: [
      { type: "video", label: "Multi-Step Word Problem (Addition, Subtraction, Multiplication) | Khan Academy", url: "https://www.youtube.com/watch?v=-sSDb_wZqKQ" },
      { type: "video", label: "How to Add and Subtract Large Numbers | Math with Mr. J", url: "https://www.youtube.com/watch?v=186wdnoAYJc" },
      { type: "worksheet", label: "Corbettmaths — Estimation (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/estimation-pdf.pdf" },
    ],
    y3: [
      { type: "video", label: "Adding and Subtracting Decimals (How to) | Math with Mr. J", url: "https://www.youtube.com/watch?v=PnwLv6khwk8" },
      { type: "video", label: "How to Add and Subtract Decimals (Step-by-Step Examples) | Math with Mr. J", url: "https://www.youtube.com/watch?v=Cg-_TeiaSa8" },
      { type: "worksheet", label: "Corbettmaths — Adding Decimals (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/adding-decimals-pdf.pdf" },
      { type: "worksheet", label: "Corbettmaths — Subtracting Decimals (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/subtracting-decimals-pdf.pdf" },
    ],
    y4: [
      { type: "video", label: "How to Add and Subtract Decimals (Step-by-Step Examples) | Math with Mr. J", url: "https://www.youtube.com/watch?v=Cg-_TeiaSa8" },
      { type: "video", label: "Estimating Decimal Sums | Math with Mr. J", url: "https://www.youtube.com/watch?v=x05LHZJNKQ0" },
      { type: "worksheet", label: "Corbettmaths — Adding Decimals (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/adding-decimals-pdf.pdf" },
    ],
    g1: [
      { type: "video", label: "Multiply a Whole Number by a Decimal | Math with Mr. J", url: "https://www.youtube.com/watch?v=tsOibhsgYoQ" },
      { type: "video", label: "How to Multiply a Whole Number and a Decimal | Math with Mr. J", url: "https://www.youtube.com/watch?v=FbZr5br9ZOg" },
      { type: "worksheet", label: "Corbettmaths — Multiplying and Dividing Decimals (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/decimals-multiplying-and-dividing.pdf" },
    ],
    g2: [
      { type: "video", label: "How to Add Negative Numbers (Integers) | Math with Mr. J", url: "https://www.youtube.com/watch?v=1VFj_coqKQU" },
      { type: "video", label: "Subtracting Integers Using a Number Line | Math with Mr. J", url: "https://www.youtube.com/watch?v=Dfytkh_lYME" },
      { type: "worksheet", label: "Corbettmaths — Negative Numbers (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2018/11/Negative-Numbers.pdf" },
    ],
    g3: [
      { type: "video", label: "Order of Operations — A Step-By-Step Guide | PEMDAS | Math with Mr. J", url: "https://www.youtube.com/watch?v=x41BCrYh8Kc" },
      { type: "video", label: "Order of Operations — Parentheses, Brackets and Braces | PEMDAS | Math with Mr. J", url: "https://www.youtube.com/watch?v=u7Lack4Tmx8" },
      { type: "worksheet", label: "Corbettmaths — Order of Operations (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/order-of-operations-pdf.pdf" },
    ],
  },

  beyond_resources: [
    { type: "video", label: "Multiply a Whole Number by a Decimal | Math with Mr. J", url: "https://www.youtube.com/watch?v=tsOibhsgYoQ" },
    { type: "video", label: "How to Add Negative Numbers (Integers) | Math with Mr. J", url: "https://www.youtube.com/watch?v=1VFj_coqKQU" },
    { type: "video", label: "Order of Operations — A Step-By-Step Guide | PEMDAS | Math with Mr. J", url: "https://www.youtube.com/watch?v=x41BCrYh8Kc" },
    { type: "worksheet", label: "Corbettmaths — Multiplying and Dividing Decimals (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/decimals-multiplying-and-dividing.pdf" },
    { type: "worksheet", label: "Corbettmaths — Negative Numbers (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2018/11/Negative-Numbers.pdf" },
  ],

  syllabus_strands_summary: "Additive Relations A & B, Represents Numbers A",
  strand_abbreviations_note: "AR = Additive relations. RN = Represents numbers. A/B = syllabus content group (Year A ~ Year 5; Year B ~ Year 6).",

  syllabus_outcomes: [
    { code: "MAO-WM-01", descriptor: "Develops understanding and fluency in mathematics through exploring and connecting mathematical concepts, choosing and applying mathematical techniques to solve problems, and communicating their thinking and reasoning coherently and clearly." },
    { code: "MA3-AR-01", descriptor: "Selects and applies appropriate strategies to solve addition and subtraction problems." },
    { code: "MA3-RN-01", descriptor: "Applies an understanding of place value and the role of zero to represent the properties of numbers." },
    { code: "MA3-RN-02", descriptor: "Compares and orders decimals up to 3 decimal places." },
  ],

  content_points: {
    red: {
      heading: "Decimal place value (RN-A) + estimation & multi-number addition (AR-A)",
      heading_short: "Red -- Foundation",
      points: [
        "Express thousandths as decimals; interpret decimal notation; indicate the place value of digits to 3 dp; partition decimals using place value (RN-A).",
        "Place decimals to 3 dp on a number line; approximate the size of decimals (RN-A).",
        "Round numbers appropriately when estimating; use place value to check calculations for errors (AR-A).",
        "Use place value to add 3 or more numbers with different numbers of digits (AR-A).",
      ],
    },
    yellow: {
      heading: "Efficient strategies, multistep problems & decimal operations (applying)",
      heading_short: "Yellow -- Applying",
      points: [
        "Choose, compare, evaluate and communicate efficient strategies for addition and subtraction (AR-B).",
        "Solve multistep word problems, including problems that require more than one operation (AR-B).",
        "Model the addition and subtraction of decimals up to 3 decimal places (AR-B).",
        "Solve decimal add/subtract word problems and justify why the strategy is appropriate (AR-B).",
      ],
    },
    green: {
      heading: "Extended -- Stage 4 Decimals, Integers & Order of Operations",
      heading_short: "Green -- Extension",
      points: [
        "Multiply and divide decimals by powers of 10; round decimals to a specified number of places (MA4-FRC-C-01).",
        "Compare, order, add and subtract positive and negative integers (MA4-INT-C-01).",
        "Apply the order of operations to evaluate expressions (MA4-INT-C-01).",
      ],
    },
  },

  working_mathematically: [
    { process: "Communicating", description: "Students explain and compare addition and subtraction strategies, read and write decimals to thousandths, and justify why a strategy is appropriate." },
    { process: "Understanding and fluency", description: "Students interpret decimal place value, place decimals on a number line, add 3+ numbers, round to estimate, and add/subtract decimals to 3 dp." },
    { process: "Reasoning", description: "Students reason about which strategy is most efficient, use place value to check for errors, and judge whether an answer is reasonable." },
    { process: "Problem solving", description: "Students solve multistep and decimal word problems, and (Stage 4) work with decimal multiplication/division, integers and the order of operations." },
  ],

  outcomes: [
    { code: "R1", desc: "Decimal place value to thousandths.", content_point: "RN-A: express thousandths as decimals; interpret decimal notation; indicate place value to 3 dp; partition decimals | MA3-RN-01 | Year A", lesson_ref: "Mini Lesson 1" },
    { code: "R2", desc: "Place decimals on a number line and approximate.", content_point: "RN-A: place decimals to 3 dp on a number line; approximate the size of decimals | MA3-RN-02 | Year A", lesson_ref: "Mini Lesson 2" },
    { code: "R3", desc: "Round to estimate and check calculations.", content_point: "AR-A: round numbers when estimating; use place value to check for errors in calculations | MA3-AR-01 | Year A", lesson_ref: "Mini Lesson 3" },
    { code: "R4", desc: "Add three or more numbers using place value.", content_point: "AR-A: use place value to add or subtract 3 or more numbers with different numbers of digits | MA3-AR-01 | Year A", lesson_ref: "Mini Lesson 4" },
    { code: "Y1", desc: "Choose, compare and explain efficient strategies.", content_point: "AR-B: choose and use efficient strategies; compare, evaluate and communicate strategies | MA3-AR-01 | Year B", lesson_ref: "Mini Lesson 5" },
    { code: "Y2", desc: "Solve multistep word problems.", content_point: "AR-B: solve multistep word problems, including problems requiring more than one operation | MA3-AR-01 | Year B", lesson_ref: "Mini Lesson 6" },
    { code: "Y3", desc: "Add and subtract decimals to 3 dp.", content_point: "AR-B: model the addition and subtraction of decimals up to 3 dp using appropriate representations | MA3-AR-01 | Year B", lesson_ref: "Mini Lesson 7" },
    { code: "Y4", desc: "Solve decimal word problems and justify the strategy.", content_point: "AR-B: solve decimal add/subtract word problems; justify why the strategy is appropriate | MA3-AR-01 | Year B", lesson_ref: "Mini Lesson 8" },
    { code: "G1", desc: "Multiply and divide decimals.", content_point: "Stage 4 FRC: multiply and divide decimals by powers of 10; round to a specified number of places | MA4-FRC-C-01 | Stage 4 (Core)", lesson_ref: "Mini Lesson 9" },
    { code: "G2", desc: "Add and subtract integers.", content_point: "Stage 4 INT: compare and order integers; add and subtract positive and negative integers | MA4-INT-C-01 | Stage 4 (Core)", lesson_ref: "Mini Lesson 10" },
    { code: "G3", desc: "Order of operations.", content_point: "Stage 4 INT: apply the order of operations to evaluate expressions | MA4-INT-C-01 | Stage 4 (Core)", lesson_ref: "Mini Lesson 11" },
  ],

  lessons: [
    {
      num: 1, band: "R",
      title: "Decimal place value to thousandths",
      outcomes: ["R1"], duration: "25-30 min",
      syllabus: "MA3-RN-01, MAO-WM-01 | RN-A: thousandths; place value; partition decimals",
      source: "DoE Lesson 5 (adapted)",
      doeLink: "Lesson 5 -- Decimal place value",
      resources: "Place value charts (to thousandths), decimal expander cards",
      li: "read, interpret and partition decimals to thousandths using place value",
      sc: [
        "I can express thousandths as decimals (e.g. 7 thousandths = 0.007).",
        "I can say the place value of each digit in a decimal to 3 dp.",
        "I can partition a decimal using place value (e.g. 0.346 = 0.3 + 0.04 + 0.006).",
      ],
      steps: [
        { label: "Activate (4 min):", content: "Where is the thousandths place in 0.346? What does the 6 stand for?" },
        { label: "Model (10 min):", content: "On a place value chart show tenths, hundredths, thousandths. 0.346 = 3 tenths + 4 hundredths + 6 thousandths. Write 7 thousandths as 0.007." },
        { label: "Guided practice (10 min):", content: "Students name the place value of digits and partition decimals to 3 dp." },
        { label: "Check (4 min):", content: "Exit question: partition 0.582 and say what the 2 stands for." },
      ],
      vocab: "decimal, tenths, hundredths, thousandths, place value, partition, digit",
      support: "Use a place value chart so each digit sits in the right column.",
      extension: "Write a decimal in expanded form using fractions (e.g. 3/10 + 4/100 + 6/1000).",
      assessment: "Students interpret and partition decimals — links to R1 in the SOLO Show task.",
      is_hands_on: true,
      materials: ["place value charts", "decimal expander cards"],
    },
    {
      num: 2, band: "R",
      title: "Decimals on a number line",
      outcomes: ["R2"], duration: "25 min",
      syllabus: "MA3-RN-02, MAO-WM-01 | RN-A: decimals on a number line; approximate",
      source: "DoE Lesson 5 (adapted)",
      doeLink: "Lesson 5 -- Decimal place value",
      resources: "Decimal number lines",
      li: "place decimals to 3 dp on a number line and approximate their size",
      sc: [
        "I can place a decimal to 3 dp on a number line between two whole numbers.",
        "I can split an interval into tenths and hundredths to locate a decimal.",
        "I can approximate the size of a decimal (e.g. 0.62 is about 0.6).",
      ],
      steps: [
        { label: "Activate (3 min):", content: "Where would 0.6 go on a line from 0 to 1?" },
        { label: "Model (10 min):", content: "Divide 0 to 1 into tenths; place 0.6. Zoom into 0.6-0.7 in hundredths to place 0.62. Approximate: 0.62 is close to 0.6." },
        { label: "Guided practice (8 min):", content: "Students place decimals on number lines and approximate their size." },
        { label: "Check (4 min):", content: "Exit question: place 0.45 on a number line and say which tenth it is closest to." },
      ],
      vocab: "decimal, number line, interval, tenths, hundredths, approximate, between",
      support: "Provide a pre-marked number line in tenths.",
      extension: "Place three decimals to 3 dp on the same line and order them.",
      assessment: "Students place and approximate decimals — links to R2 in the SOLO Show task.",
      is_hands_on: true,
      materials: ["decimal number lines"],
    },
    {
      num: 3, band: "R",
      title: "Rounding to estimate and check",
      outcomes: ["R3"], duration: "25-30 min",
      syllabus: "MA3-AR-01, MAO-WM-01 | AR-A: round to estimate; check for errors",
      source: "DoE Lesson 2 (adapted)",
      doeLink: "Lesson 2 -- Estimate and check the reasonableness of a solution",
      resources: "Rounding number lines",
      li: "round numbers to estimate and use place value to check calculations",
      sc: [
        "I can round numbers to the nearest 10, 100 or 1000 to make an estimate.",
        "I can estimate a sum or difference before calculating.",
        "I can use place value to spot an error in a calculation.",
      ],
      steps: [
        { label: "Activate (4 min):", content: "Roughly, what is 412 + 389? Estimate before adding." },
        { label: "Model (10 min):", content: "Round 412 → 400 and 389 → 400, so the sum is about 800 (exact 801). If someone got 80 or 8010, place value shows it is wrong." },
        { label: "Guided practice (10 min):", content: "Students estimate sums/differences and check given answers for place-value errors." },
        { label: "Check (4 min):", content: "Exit question: estimate 596 + 207. Is 803 reasonable?" },
      ],
      vocab: "round, estimate, nearest, reasonable, place value, check, error",
      support: "Provide a number line to round on.",
      extension: "Estimate a 3-number sum and explain how close the estimate is.",
      assessment: "Students round to estimate and check — links to R3 in the SOLO Show task.",
    },
    {
      num: 4, band: "R",
      title: "Adding three or more numbers",
      outcomes: ["R4"], duration: "25 min",
      syllabus: "MA3-AR-01, MAO-WM-01 | AR-A: add 3+ numbers with place value",
      source: "DoE Lesson 3 (adapted)",
      doeLink: "Lesson 3 -- Solving problems with efficient strategies",
      resources: "Place value charts",
      li: "use place value to add 3 or more numbers with different numbers of digits",
      sc: [
        "I can line up numbers by place value before adding.",
        "I can add 3 or more numbers with different numbers of digits.",
        "I can regroup (carry) when a column totals 10 or more.",
      ],
      steps: [
        { label: "Activate (3 min):", content: "How would you set out 248 + 19 + 1305 to add them?" },
        { label: "Model (10 min):", content: "Line up ones under ones, tens under tens, etc. Add each column, regrouping when needed: 248 + 19 + 1305 = 1572." },
        { label: "Guided practice (8 min):", content: "Students add 3 or more numbers with different numbers of digits using place value." },
        { label: "Check (4 min):", content: "Exit question: 56 + 408 + 9 = ?" },
      ],
      vocab: "place value, column, regroup, carry, sum, line up, digit",
      support: "Use a place value chart / grid paper so columns line up.",
      extension: "Add four numbers including a 4-digit number, then estimate to check.",
      assessment: "Students add 3+ numbers using place value — links to R4 in the SOLO Show task.",
    },
    {
      num: 5, band: "Y",
      title: "Choosing and comparing efficient strategies",
      outcomes: ["Y1"], duration: "30 min",
      syllabus: "MA3-AR-01, MAO-WM-01 | AR-B: choose, compare and evaluate strategies",
      source: "DoE Lesson 4 (adapted)",
      doeLink: "Lesson 4 -- Comparing and evaluating strategies",
      resources: "Strategy cards (jump, split, compensation, bridging)",
      li: "choose an efficient strategy and compare which works best",
      sc: [
        "I can use strategies like bridging and compensation for addition and subtraction.",
        "I can choose an efficient strategy for a given problem.",
        "I can compare two strategies and explain which is better.",
      ],
      steps: [
        { label: "Activate (4 min):", content: "What is 199 + 47? Is there a quicker way than column addition?" },
        { label: "Model (12 min):", content: "Compensation: 199 + 47 = 200 + 47 − 1 = 246. Bridging: 47 + 199 → 47 + 200 then back 1. Compare which is more efficient and why." },
        { label: "Guided practice (10 min):", content: "Students solve problems two ways and decide which strategy is most efficient." },
        { label: "Check (4 min):", content: "Exit question: solve 502 − 48 using an efficient strategy and explain your choice." },
      ],
      vocab: "strategy, efficient, bridging, compensation, jump, split, evaluate, compare",
      support: "Provide a menu of strategies to choose from.",
      extension: "Invent a problem where compensation is clearly the best strategy.",
      assessment: "Students choose and compare strategies — links to Y1 in the SOLO Show task.",
    },
    {
      num: 6, band: "Y",
      title: "Multistep word problems",
      outcomes: ["Y2"], duration: "30 min",
      syllabus: "MA3-AR-01, MAO-WM-01 | AR-B: multistep word problems",
      source: "DoE Lesson 1 (adapted)",
      doeLink: "Lesson 1 -- Solving multistep word problems",
      resources: "Word problem cards",
      li: "solve multistep word problems requiring more than one operation",
      sc: [
        "I can break a problem into steps and decide which operation each step needs.",
        "I can carry out the steps in order to reach the answer.",
        "I can check my answer is reasonable.",
      ],
      steps: [
        { label: "Activate (4 min):", content: "Read a 2-step problem aloud. Ask: what do we work out first?" },
        { label: "Model (12 min):", content: "Model a multistep problem: buy 3 items at $4 then pay with $20 — first multiply (3 × 4 = 12), then subtract (20 − 12 = 8)." },
        { label: "Guided practice (10 min):", content: "Students solve multistep word problems, showing each step." },
        { label: "Check (4 min):", content: "Exit question: a 2-step problem with addition then subtraction." },
      ],
      vocab: "multistep, operation, step, multiply, add, subtract, estimate, reasonable",
      support: "Provide a step-by-step planning frame (Step 1 …, Step 2 …).",
      extension: "Write a multistep problem of your own and solve it.",
      assessment: "Students solve multistep word problems — links to Y2 in the SOLO Show task.",
    },
    {
      num: 7, band: "Y",
      title: "Adding and subtracting decimals",
      outcomes: ["Y3"], duration: "30 min",
      syllabus: "MA3-AR-01, MAO-WM-01 | AR-B: add/subtract decimals to 3 dp",
      source: "DoE Lesson 6 & 7 (adapted)",
      doeLink: "Lesson 6 -- Adding decimals; Lesson 7 -- Subtracting decimals",
      resources: "Place value charts, number lines",
      li: "add and subtract decimals up to 3 decimal places",
      sc: [
        "I can line up the decimal points to add or subtract decimals.",
        "I can use zeros as place holders so both numbers have the same decimal places.",
        "I can add and subtract decimals to 3 dp.",
      ],
      steps: [
        { label: "Activate (4 min):", content: "Add $3.50 and $2.75. How do you set it out?" },
        { label: "Model (12 min):", content: "Line up the decimal points; add place by place ($6.25). Pad zeros: 3.25 + 1.4 = 3.250 + 1.400 = 4.650. Subtract: 7.5 − 3.25 = 4.25." },
        { label: "Guided practice (10 min):", content: "Students add and subtract decimals to 3 dp, lining up the points." },
        { label: "Check (4 min):", content: "Exit question: 6.4 − 2.75 = ?" },
      ],
      vocab: "decimal, add, subtract, line up, decimal point, place holder, place value",
      support: "Use a place value chart so points and columns line up.",
      extension: "Solve a 3-decimal calculation that needs regrouping across the decimal point.",
      assessment: "Students add and subtract decimals — links to Y3 in the SOLO Show task.",
      is_hands_on: true,
      materials: ["place value charts", "number lines"],
    },
    {
      num: 8, band: "Y",
      title: "Decimal word problems and justifying",
      outcomes: ["Y4"], duration: "30 min",
      syllabus: "MA3-AR-01, MAO-WM-01 | AR-B: decimal word problems; justify",
      source: "DoE Lesson 8 (adapted)",
      doeLink: "Lesson 8 -- Decimal problem solving",
      resources: "Money/measurement problem cards (AUD)",
      li: "solve decimal word problems and justify why the strategy is appropriate",
      sc: [
        "I can solve word problems by adding and subtracting decimals to 3 dp.",
        "I can choose an appropriate strategy for the problem.",
        "I can justify why my strategy is effective.",
      ],
      steps: [
        { label: "Activate (4 min):", content: "You spend $7.45 and $2.80. How much change from $20?" },
        { label: "Model (12 min):", content: "Add 7.45 + 2.80 = 10.25, then 20 − 10.25 = 9.75. Explain why adding first, then subtracting, is the efficient order." },
        { label: "Guided practice (10 min):", content: "Students solve decimal word problems and write a sentence justifying their strategy." },
        { label: "Check (4 min):", content: "Exit question: a 2-step money problem; justify your method." },
      ],
      vocab: "decimal, word problem, strategy, justify, efficient, change, total, AUD",
      support: "Provide a sentence starter for the justification ('I chose … because …').",
      extension: "Solve a measurement decimal problem (e.g. lengths in metres) and justify.",
      assessment: "Students solve and justify decimal problems — links to Y4 in the SOLO Show task.",
    },
    {
      num: 9, band: "G",
      title: "Multiplying and dividing decimals",
      outcomes: ["G1"], duration: "30 min",
      syllabus: "MA4-FRC-C-01, MAO-WM-01 | Stage 4: ×/÷ decimals by powers of 10; round",
      source: "Original mini lesson (Stage 4 extension)",
      li: "multiply and divide decimals by powers of 10 and round to a given number of places",
      sc: [
        "I can multiply a decimal by 10, 100 and 1000 (shift digits left).",
        "I can divide a decimal by 10, 100 and 1000 (shift digits right).",
        "I can round a decimal to 1 or 2 decimal places.",
      ],
      steps: [
        { label: "Activate (3 min):", content: "What is 3.45 × 100? Predict the digit shift." },
        { label: "Model (12 min):", content: "× 100 shifts two places left (3.45 → 345). ÷ 10 shifts one place right (3.45 → 0.345). Round 3.456 to 2 dp → 3.46." },
        { label: "Guided practice (10 min):", content: "Students multiply and divide decimals by powers of 10 and round." },
        { label: "Check (4 min):", content: "Exit question: 0.7 × 1000 = ? and round 2.358 to 1 dp." },
      ],
      vocab: "decimal, multiply, divide, powers of 10, round, decimal place, shift",
      support: "Use a place value chart and move every digit the same number of places.",
      extension: "Divide a decimal by 1000 and round the result to 2 dp.",
      assessment: "Students multiply/divide decimals and round — extends R1 and Y3.",
    },
    {
      num: 10, band: "G",
      title: "Adding and subtracting integers",
      outcomes: ["G2"], duration: "30 min",
      syllabus: "MA4-INT-C-01, MAO-WM-01 | Stage 4: compare/order/add/subtract integers",
      source: "Original mini lesson (Stage 4 extension)",
      li: "compare, order, add and subtract positive and negative integers",
      sc: [
        "I can compare and order integers using < and >.",
        "I can add a negative integer (move left on the number line).",
        "I can subtract to cross zero into negative numbers.",
      ],
      steps: [
        { label: "Activate (4 min):", content: "Which is greater, −5 or −2? Use a number line to decide." },
        { label: "Model (12 min):", content: "On a number line: 3 + (−5) = −2 (move left 5); −1 − 3 = −4. Order a set like −4, 2, −1, 3." },
        { label: "Guided practice (10 min):", content: "Students compare, order, add and subtract positive and negative integers." },
        { label: "Check (4 min):", content: "Exit question: work out −3 + 5 and 2 − 6." },
      ],
      vocab: "integer, positive, negative, less than, greater than, add, subtract, number line",
      support: "Use a number line for every calculation to make direction concrete.",
      extension: "Solve a real-life integer problem (temperature change or money owed).",
      assessment: "Students work with integers — extends R3 and R4.",
    },
    {
      num: 11, band: "G",
      title: "Order of operations",
      outcomes: ["G3"], duration: "30 min",
      syllabus: "MA4-INT-C-01, MAO-WM-01 | Stage 4: order of operations",
      source: "Original mini lesson (Stage 4 extension)",
      li: "use the order of operations to evaluate expressions",
      sc: [
        "I know we agree on an order so everyone gets the same answer.",
        "I can do brackets first, then multiplication and division, then addition and subtraction.",
        "I can evaluate expressions with and without brackets.",
      ],
      steps: [
        { label: "Activate (4 min):", content: "Work out 2 + 3 × 4 two different ways. Why do we need an agreed order?" },
        { label: "Model (12 min):", content: "Order of operations: brackets, then × and ÷, then + and −. So 2 + 3 × 4 = 14, but (2 + 3) × 4 = 20 — brackets change the answer." },
        { label: "Guided practice (10 min):", content: "Students evaluate expressions with and without brackets." },
        { label: "Check (4 min):", content: "Exit question: work out 10 − (2 + 3) × 1 and 20 ÷ (5 − 1)." },
      ],
      vocab: "order of operations, brackets, grouping symbols, evaluate, expression",
      support: "Provide the operation order as a checklist to follow.",
      extension: "Place brackets in a number sentence to make it equal a given target.",
      assessment: "Students apply the order of operations — extends Y2.",
    },
  ],
};
