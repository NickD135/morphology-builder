/**
 * Unit 21 — Number: Place Value, Decimals & Powers of 10 (Stage 3 Year B).
 * Deliverable B. Built from units/u21/00_rubric_draft.md + 01_mapping_review.md.
 * Matches the UNIT DATA SCHEMA at the bottom of scripts/build_program_template.js.
 *
 * Read/order numbers in the millions (to 1 billion); compare/order decimals to 3 dp (trailing zeros,
 * number line, approximate); multiply by 10/100/1000 mentally; partition/regroup in non-standard forms;
 * 10/100 times (and one-tenth/one-hundredth of) a decimal; add/subtract decimals to 3 dp; estimate
 * products and check reasonableness. Green = Stage 4 indices, ×/÷ decimals by powers of 10, order of ops.
 *
 * Banding: cognitive demand (this is the first Year B unit and is ~all Group A — see 00_rubric_draft.md).
 * The A/B group is labelled on every content point regardless.
 *
 * Program has the resource appendix merged (resource_appendix_attached: true); a standalone
 * Unit21_Resource_Appendix.docx is also emitted (Stage 5). Every resource URL verified live in Stage 3
 * (units/u21/03_resources_staged.csv — videos oEmbed-verified, worksheets curl HTTP 200) and is now
 * DB-CANONICAL in the Supabase `resources` table (units/u21/04_insert.sql inserted + verified, 31 rows).
 *
 * Outcome -> Mini Lesson map (teaching sequence, then Stage-4 Green cards):
 *   R1->1 R2->2 R3->3 Y1->4 Y2->5 Y3->6 Y4->7 G1->8 G2->9 G3->10
 */
module.exports = {
  unit_number: "21",
  unit_title: "Number: Place Value, Decimals & Powers of 10",
  term: null,
  duration: "2-3 weeks",

  resource_appendix_attached: true,

  // Every URL verified live in Stage 3 (videos oEmbed-verified, worksheets curl HTTP 200);
  // see units/u21/03_resources_staged.csv. DB-canonical (units/u21/04_insert.sql).
  resources: {
    r1: [
      { type: "video", label: "Place Value to Millions | Mrs Roberts Resources", url: "https://www.youtube.com/watch?v=yzw3j-O9AYY" },
      { type: "video", label: "Reading and Writing Numbers to the Hundred Millions | Easy Math with Mrs. Easley", url: "https://www.youtube.com/watch?v=nMvHx_ctugw" },
      { type: "worksheet", label: "Corbettmaths — Place Value (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf" },
    ],
    r2: [
      { type: "video", label: "Comparing and Ordering Decimals | Math with Mr. J", url: "https://www.youtube.com/watch?v=KWsLyjXKhrM" },
      { type: "video", label: "How to Order Decimals | Math with Mr. J", url: "https://www.youtube.com/watch?v=1dfedgVxA54" },
      { type: "worksheet", label: "Corbettmaths — Ordering Decimals (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/ordering-decimals-pdf.pdf" },
    ],
    r3: [
      { type: "video", label: "Multiplying Multiples of 10 — Fast Mental Math | Math with Mr. J", url: "https://www.youtube.com/watch?v=lY7q52L3yN0" },
      { type: "video", label: "Multiplying and Dividing by Powers of 10 | Math with Mr. J", url: "https://www.youtube.com/watch?v=HH-yrNS80Cg" },
      { type: "worksheet", label: "Corbettmaths — Place Value (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf" },
    ],
    y1: [
      { type: "video", label: "Whole Number Expanded Form, Word Form and Standard Form | Math with Mr. J", url: "https://www.youtube.com/watch?v=NOx6jlVSSpU" },
      { type: "video", label: "Writing Numbers in Expanded Form (Millions) | Elementary Math with Mr. J", url: "https://www.youtube.com/watch?v=Ok_zzg75hO8" },
      { type: "worksheet", label: "Corbettmaths — Place Value (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf" },
    ],
    y2: [
      { type: "video", label: "Multiplying Decimals by 10, 100, 1000 | Lets Do Math", url: "https://www.youtube.com/watch?v=GfL0s6tCNV4" },
      { type: "video", label: "Dividing by Powers of Ten | Math with Mr. J", url: "https://www.youtube.com/watch?v=E8b5pDvt2AE" },
      { type: "worksheet", label: "Corbettmaths — Place Value (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf" },
    ],
    y3: [
      { type: "video", label: "Adding and Subtracting Decimals (How to) | Math with Mr. J", url: "https://www.youtube.com/watch?v=PnwLv6khwk8" },
      { type: "video", label: "How to Add and Subtract Decimals (Step-by-Step Examples) | Math with Mr. J", url: "https://www.youtube.com/watch?v=Cg-_TeiaSa8" },
      { type: "worksheet", label: "Corbettmaths — Adding Decimals (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/adding-decimals-pdf.pdf" },
      { type: "worksheet", label: "Corbettmaths — Subtracting Decimals (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/subtracting-decimals-pdf.pdf" },
    ],
    y4: [
      { type: "video", label: "Estimating Whole Number Products | Multiplication Estimation | Math with Mr. J", url: "https://www.youtube.com/watch?v=mBWr8c0Lsx4" },
      { type: "video", label: "Estimating Whole Number Sums and Differences | Math with Mr. J", url: "https://www.youtube.com/watch?v=EvQf38lnAJc" },
      { type: "worksheet", label: "Corbettmaths — Estimation (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/estimation-pdf.pdf" },
    ],
    g1: [
      { type: "video", label: "What are Powers of 10? Exponential, Expanded and Standard Form | Math with Mr. J", url: "https://www.youtube.com/watch?v=SKrujXYeFcI" },
      { type: "video", label: "What is an Exponent? An Intro to Exponents | Math with Mr. J", url: "https://www.youtube.com/watch?v=NS4vHqJIPiE" },
      { type: "worksheet", label: "Corbettmaths — Indices (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/indices-pdf.pdf" },
    ],
    g2: [
      { type: "video", label: "Multiply a Whole Number by a Decimal | Math with Mr. J", url: "https://www.youtube.com/watch?v=tsOibhsgYoQ" },
      { type: "video", label: "Multiplying and Dividing by Powers of 10 | Math with Mr. J", url: "https://www.youtube.com/watch?v=HH-yrNS80Cg" },
      { type: "worksheet", label: "Corbettmaths — Multiplying and Dividing Decimals (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/decimals-multiplying-and-dividing.pdf" },
    ],
    g3: [
      { type: "video", label: "Order of Operations — A Step-By-Step Guide | PEMDAS | Math with Mr. J", url: "https://www.youtube.com/watch?v=x41BCrYh8Kc" },
      { type: "video", label: "Order of Operations — Parentheses, Brackets and Braces | PEMDAS | Math with Mr. J", url: "https://www.youtube.com/watch?v=u7Lack4Tmx8" },
      { type: "worksheet", label: "Corbettmaths — Order of Operations (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/order-of-operations-pdf.pdf" },
    ],
  },

  beyond_resources: [
    { type: "video", label: "What are Powers of 10? Exponential, Expanded and Standard Form | Math with Mr. J", url: "https://www.youtube.com/watch?v=SKrujXYeFcI" },
    { type: "video", label: "Multiply a Whole Number by a Decimal | Math with Mr. J", url: "https://www.youtube.com/watch?v=tsOibhsgYoQ" },
    { type: "video", label: "Order of Operations — A Step-By-Step Guide | PEMDAS | Math with Mr. J", url: "https://www.youtube.com/watch?v=x41BCrYh8Kc" },
    { type: "worksheet", label: "Corbettmaths — Indices (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/indices-pdf.pdf" },
    { type: "worksheet", label: "Corbettmaths — Multiplying and Dividing Decimals (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/decimals-multiplying-and-dividing.pdf" },
  ],

  syllabus_strands_summary: "Represents Numbers A, Additive Relations B, Multiplicative Relations A",
  strand_abbreviations_note: "RN = Represents numbers. AR = Additive relations. MR = Multiplicative relations. A/B = syllabus content group (Year A ~ Year 5; Year B ~ Year 6).",

  syllabus_outcomes: [
    { code: "MAO-WM-01", descriptor: "Develops understanding and fluency in mathematics through exploring and connecting mathematical concepts, choosing and applying mathematical techniques to solve problems, and communicating their thinking and reasoning coherently and clearly." },
    { code: "MA3-RN-01", descriptor: "Applies an understanding of place value and the role of zero to represent the properties of numbers." },
    { code: "MA3-RN-02", descriptor: "Compares and orders decimals up to 3 decimal places." },
    { code: "MA3-AR-01", descriptor: "Selects and applies appropriate strategies to solve addition and subtraction problems." },
    { code: "MA3-MR-01", descriptor: "Selects and applies appropriate strategies to solve multiplication and division problems." },
  ],

  content_points: {
    red: {
      heading: "Place value & decimals (RN-A) + ×10/100/1000 (MR-A)",
      heading_short: "Red -- Foundation",
      points: [
        "Arrange numbers in the millions in ascending and descending order using place value; recognise 1000 thousands is 1 million and 1000 millions is 1 billion (RN-A).",
        "Compare and order decimals to 3 dp; interpret trailing zeros; approximate the size of decimals; place decimals on a number line (RN-A).",
        "Use mental strategies to multiply one-digit numbers by 10, 100 and 1000 and their multiples (MR-A).",
      ],
    },
    yellow: {
      heading: "Partitioning, place-value shifts & decimal operations (applying)",
      heading_short: "Yellow -- Applying",
      points: [
        "Regroup numbers in different forms and partition numbers to 1 billion in non-standard forms (RN-A).",
        "Determine numbers that are 10 or 100 times a decimal, and one-tenth or one-hundredth of it, using place value (RN-A).",
        "Model the addition and subtraction of decimals up to 3 decimal places (AR-B).",
        "Estimate the product of 2 numbers using multiples of 10 or 100, and use estimation to check the reasonableness of answers (MR-A).",
      ],
    },
    green: {
      heading: "Extended -- Stage 4 Indices, Decimals & Order of Operations",
      heading_short: "Green -- Extension",
      points: [
        "Represent numbers in index notation (positive powers) and evaluate powers of 10 (MA4-IND-C-01).",
        "Multiply and divide decimals by powers of 10; round decimals to a specified number of decimal places (MA4-FRC-C-01).",
        "Apply the order of operations to evaluate expressions; use estimation and rounding to check answers (MA4-INT-C-01).",
      ],
    },
  },

  working_mathematically: [
    { process: "Communicating", description: "Students read, write and say large numbers and decimals, and explain their place-value reasoning and chosen strategies." },
    { process: "Understanding and fluency", description: "Students order numbers and decimals, multiply by 10/100/1000, partition numbers, shift decimals by powers of 10 and add/subtract decimals." },
    { process: "Reasoning", description: "Students reason about the value of trailing zeros, why a place-value shift changes a digit's value, and whether an estimate is reasonable." },
    { process: "Problem solving", description: "Students partition in non-standard forms, estimate products to check answers, and (Stage 4) work with index notation, decimal multiplication/division and the order of operations." },
  ],

  outcomes: [
    { code: "R1", desc: "Read and order numbers in the millions.", content_point: "RN-A: arrange numbers in the millions in ascending/descending order; 1000 thousands = 1 million, 1000 millions = 1 billion | MA3-RN-01 | Year A", lesson_ref: "Mini Lesson 1" },
    { code: "R2", desc: "Compare and order decimals to 3 decimal places.", content_point: "RN-A: compare/order decimals to 3 dp; interpret trailing zeros; approximate decimal size; place on a number line | MA3-RN-02 | Year A", lesson_ref: "Mini Lesson 2" },
    { code: "R3", desc: "Multiply by 10, 100 and 1000 using mental strategies.", content_point: "MR-A: use mental strategies to multiply one-digit numbers by 10, 100, 1000 and their multiples | MA3-MR-01 | Year A", lesson_ref: "Mini Lesson 3" },
    { code: "Y1", desc: "Partition and regroup numbers in non-standard forms.", content_point: "RN-A: regroup numbers in different forms; partition numbers to 1 billion in non-standard forms | MA3-RN-01 | Year A", lesson_ref: "Mini Lesson 4" },
    { code: "Y2", desc: "Find 10/100 times (and one-tenth/one-hundredth of) a decimal.", content_point: "RN-A: determine numbers that are 10 or 100 times the original decimal, and one-tenth or one-hundredth of it | MA3-RN-02 | Year A", lesson_ref: "Mini Lesson 5" },
    { code: "Y3", desc: "Add and subtract decimals to 3 decimal places.", content_point: "AR-B: model the addition and subtraction of decimals up to 3 dp using appropriate representations | MA3-AR-01 | Year B", lesson_ref: "Mini Lesson 6" },
    { code: "Y4", desc: "Estimate products and check the reasonableness of answers.", content_point: "MR-A: estimate the product of 2 numbers using multiples of 10 or 100; use estimation to check reasonableness | MA3-MR-01 | Year A", lesson_ref: "Mini Lesson 7" },
    { code: "G1", desc: "Powers of 10 and index notation.", content_point: "Stage 4 IND: represent numbers in index notation (positive powers); evaluate numbers in index notation, including powers of 10 | MA4-IND-C-01 | Stage 4 (Core)", lesson_ref: "Mini Lesson 8" },
    { code: "G2", desc: "Multiply and divide decimals.", content_point: "Stage 4 FRC: multiply and divide decimals by powers of 10; round decimals to a specified number of places | MA4-FRC-C-01 | Stage 4 (Core)", lesson_ref: "Mini Lesson 9" },
    { code: "G3", desc: "Order of operations with whole numbers and decimals.", content_point: "Stage 4 INT: apply the order of operations to evaluate expressions; estimate/round to check answers | MA4-INT-C-01 | Stage 4 (Core)", lesson_ref: "Mini Lesson 10" },
  ],

  lessons: [
    {
      num: 1, band: "R",
      title: "Reading and ordering numbers in the millions",
      outcomes: ["R1"], duration: "25-30 min",
      syllabus: "MA3-RN-01, MAO-WM-01 | RN-A: order numbers in the millions",
      source: "DoE Lesson 1 (adapted)",
      doeLink: "Lesson 1 -- Applying place value (numbers in the millions)",
      resources: "Place value charts (to hundred-millions), digit cards",
      li: "read and order numbers in the millions using place value",
      sc: [
        "I can read a number in the millions using a place value chart.",
        "I can order numbers in the millions in ascending and descending order.",
        "I know 1000 thousands is 1 million and 1000 millions is 1 billion.",
      ],
      steps: [
        { label: "Activate (4 min):", content: "Write 3 450 000 on the board. How do we read it? Which digit is in the millions place?" },
        { label: "Model (10 min):", content: "Use a place value chart with periods (millions, thousands, ones). Compare numbers by the highest place value first. Build up: 1000 thousands = 1 million; 1000 millions = 1 billion." },
        { label: "Guided practice (10 min):", content: "Students order sets of numbers in the millions (ascending and descending) using place value." },
        { label: "Check (4 min):", content: "Exit question: order 1 200 000, 1 020 000 and 1 002 000 from smallest to largest." },
      ],
      vocab: "place value, millions, billion, period, digit, ascending, descending, order",
      support: "Provide a place value chart with labelled columns so digits line up.",
      extension: "Order numbers up to 1 billion, including numbers with internal zeros.",
      assessment: "Students read and order numbers in the millions — links to R1 in the SOLO Show task.",
    },
    {
      num: 2, band: "R",
      title: "Comparing and ordering decimals",
      outcomes: ["R2"], duration: "25-30 min",
      syllabus: "MA3-RN-02, MAO-WM-01 | RN-A: compare/order decimals to 3 dp",
      source: "DoE Lesson 4 (adapted)",
      doeLink: "Lesson 4 -- Place value and positioning of decimals",
      resources: "Decimal number lines, place value charts",
      li: "compare and order decimals to 3 decimal places and place them on a number line",
      sc: [
        "I can compare decimals digit by digit using place value.",
        "I know a zero at the end of a decimal (e.g. 0.40) does not change its value.",
        "I can place decimals to 3 decimal places on a number line and approximate their size.",
      ],
      steps: [
        { label: "Activate (4 min):", content: "Which is bigger, 0.4 or 0.39? Ask students to justify using place value." },
        { label: "Model (10 min):", content: "Line up the decimal points; compare tenths, then hundredths, then thousandths. Show 0.4 = 0.40 = 0.400. Place several decimals on a number line and approximate (0.62 is close to 0.6)." },
        { label: "Guided practice (10 min):", content: "Students order sets of decimals to 3 dp and place them on a number line." },
        { label: "Check (4 min):", content: "Exit question: order 0.7, 0.07, 0.77 and 0.707 from smallest to largest." },
      ],
      vocab: "decimal, place value, tenths, hundredths, thousandths, compare, order, number line, approximate",
      support: "Use a place value chart so digits line up under the right column.",
      extension: "Name a decimal that lies between two given decimals (e.g. between 0.4 and 0.5).",
      assessment: "Students compare and order decimals — links to R2 in the SOLO Show task.",
      is_hands_on: true,
      materials: ["decimal number lines", "place value charts"],
    },
    {
      num: 3, band: "R",
      title: "Multiplying by 10, 100 and 1000",
      outcomes: ["R3"], duration: "25 min",
      syllabus: "MA3-MR-01, MAO-WM-01 | MR-A: multiply by 10, 100, 1000 mentally",
      source: "DoE Lesson 5 (adapted)",
      doeLink: "Lesson 5 -- Multiplying and dividing whole numbers and decimals by 10, 100 and 1000",
      resources: "Place value charts",
      li: "use mental strategies to multiply one-digit numbers by 10, 100 and 1000",
      sc: [
        "I know multiplying by 10 shifts each digit one place to the left.",
        "I can multiply one-digit numbers by 10, 100 and 1000.",
        "I can multiply by multiples like 30, 200 or 4000.",
      ],
      steps: [
        { label: "Activate (3 min):", content: "What is 7 × 10? Ask students to explain what happens to the 7 on a place value chart." },
        { label: "Model (10 min):", content: "On a place value chart, × 10 shifts a digit one place left (6 → 60), × 100 two places (6 → 600), × 1000 three places (6 → 6000). Extend to multiples: 4 × 30 = 120; 3 × 200 = 600." },
        { label: "Guided practice (8 min):", content: "Students multiply one-digit numbers by 10, 100, 1000 and their multiples." },
        { label: "Check (4 min):", content: "Exit question: 8 × 1000 = ? and 7 × 200 = ?" },
      ],
      vocab: "place value, multiply, powers of 10, multiple, shift, mental strategy",
      support: "Use a place value chart and physically move the digit left.",
      extension: "Multiply two-digit numbers by 10, 100 and 1000 (e.g. 24 × 100).",
      assessment: "Students multiply by 10, 100 and 1000 — links to R3 in the SOLO Show task.",
    },
    {
      num: 4, band: "Y",
      title: "Partitioning and regrouping in non-standard forms",
      outcomes: ["Y1"], duration: "30 min",
      syllabus: "MA3-RN-01, MAO-WM-01 | RN-A: regroup; partition in non-standard forms",
      source: "DoE Lesson 2 (adapted)",
      doeLink: "Lesson 2 -- Partitioning numbers in non-standard forms",
      resources: "Place value charts, expander cards",
      li: "partition and regroup numbers in standard and non-standard forms",
      sc: [
        "I can partition a number in standard form (e.g. 4500 = 4000 + 500).",
        "I can partition a number in non-standard forms that show the same value.",
        "I can regroup a number in different ways without changing its value.",
      ],
      steps: [
        { label: "Activate (4 min):", content: "Partition 2300 in the usual way (2000 + 300). Is there another way to make 2300?" },
        { label: "Model (12 min):", content: "Standard: 4500 = 4000 + 500. Non-standard: 4500 = 3000 + 1500 = 45 hundreds = 4000 + 400 + 100. Show each is still 4500 by recombining." },
        { label: "Guided practice (10 min):", content: "Students write numbers (to 1 billion) in two or more non-standard forms and check they regroup to the same value." },
        { label: "Check (4 min):", content: "Exit question: write 5200 in two different non-standard forms." },
      ],
      vocab: "partition, regroup, standard form, non-standard form, place value, expanded form",
      support: "Use place value expander cards so parts physically recombine into the whole.",
      extension: "Partition a 7-digit number (millions) in non-standard form.",
      assessment: "Students partition and regroup numbers — links to Y1 in the SOLO Show task.",
    },
    {
      num: 5, band: "Y",
      title: "Ten and one hundred times a decimal",
      outcomes: ["Y2"], duration: "25-30 min",
      syllabus: "MA3-RN-02, MAO-WM-01 | RN-A: 10/100 times a decimal; one-tenth/one-hundredth",
      source: "DoE Lesson 5 (adapted)",
      doeLink: "Lesson 5 -- Multiplying and dividing whole numbers and decimals by 10, 100 and 1000",
      resources: "Place value charts",
      li: "find the number that is 10 or 100 times a decimal, and one-tenth or one-hundredth of it",
      sc: [
        "I know 10 times a decimal shifts each digit one place to the left.",
        "I know one-tenth of a decimal shifts each digit one place to the right.",
        "I can find 100 times and one-hundredth of a decimal.",
      ],
      steps: [
        { label: "Activate (3 min):", content: "What is 10 times 0.6? Ask students to predict and explain." },
        { label: "Model (12 min):", content: "On a place value chart: 0.06 → 0.6 → 6 → 60 (each × 10 shifts left). One-tenth of 0.6 = 0.06 (shift right). 100 times 0.35 = 35; one-hundredth of 0.35 = 0.0035." },
        { label: "Guided practice (10 min):", content: "Students find 10 and 100 times a decimal, and one-tenth/one-hundredth of it, using place value." },
        { label: "Check (4 min):", content: "Exit question: 10 times 0.35 = ? and one-tenth of 0.35 = ?" },
      ],
      vocab: "place value, decimal, ten times, one hundred times, one-tenth, one-hundredth, shift",
      support: "Use a place value chart and slide a digit card left or right.",
      extension: "Chain shifts: find 1000 times a decimal, then one-thousandth of the result.",
      assessment: "Students apply place-value shifts to decimals — links to Y2 in the SOLO Show task.",
    },
    {
      num: 6, band: "Y",
      title: "Adding and subtracting decimals",
      outcomes: ["Y3"], duration: "30 min",
      syllabus: "MA3-AR-01, MAO-WM-01 | AR-B: model add/subtract decimals to 3 dp",
      source: "DoE Lesson 6 (adapted)",
      doeLink: "Lesson 6 -- Operations with decimals",
      resources: "Place value charts, number lines",
      li: "add and subtract decimals up to 3 decimal places, lining up the decimal points",
      sc: [
        "I can line up the decimal points to add or subtract decimals.",
        "I can use zeros as place holders so both numbers have the same number of decimal places.",
        "I can add and subtract decimals to 3 dp to solve problems.",
      ],
      steps: [
        { label: "Activate (4 min):", content: "Buy items for $3.50 and $2.75. How much altogether? How would you set it out?" },
        { label: "Model (12 min):", content: "Line up the decimal points and add place by place ($6.25). Pad with zeros: 3.25 + 1.4 = 3.250 + 1.400 = 4.650. Subtract: 7.5 − 3.25 = 4.25, modelled on a place value chart." },
        { label: "Guided practice (10 min):", content: "Students add and subtract decimals to 3 dp, including money problems, lining up the points." },
        { label: "Check (4 min):", content: "Exit question: 7.5 − 3.25 = ? Show how you lined it up." },
      ],
      vocab: "decimal, add, subtract, line up, decimal point, place holder, place value",
      support: "Use a place value chart so the decimal points and columns line up.",
      extension: "Solve a two-step money problem mixing addition and subtraction of decimals.",
      assessment: "Students add and subtract decimals — links to Y3 in the SOLO Show task.",
      is_hands_on: true,
      materials: ["place value charts", "number lines"],
    },
    {
      num: 7, band: "Y",
      title: "Estimating products and checking reasonableness",
      outcomes: ["Y4"], duration: "25-30 min",
      syllabus: "MA3-MR-01, MAO-WM-01 | MR-A: estimate products; check reasonableness",
      source: "DoE Lesson 8 (adapted)",
      doeLink: "Lesson 8 -- Using a range of strategies to solve problems",
      resources: "Rounding number lines",
      li: "estimate the product of two numbers and use estimation to check answers",
      sc: [
        "I can round a 2- or 3-digit number to the nearest 10 or 100.",
        "I can estimate a product using multiples of 10 or 100.",
        "I can use an estimate to check whether an answer is reasonable.",
      ],
      steps: [
        { label: "Activate (3 min):", content: "Roughly how much is 6 × 49? Ask for a quick estimate before any working." },
        { label: "Model (12 min):", content: "Round 49 → 50, so 6 × 49 ≈ 6 × 50 = 300 (exact 294 — close, so reasonable). Round 280 → 300, so 3 × 280 ≈ 3 × 300 = 900. Compare estimate to exact." },
        { label: "Guided practice (10 min):", content: "Students estimate products by rounding, then check given answers for reasonableness." },
        { label: "Check (4 min):", content: "Exit question: estimate 7 × 62. Is 7 × 62 = 434 reasonable?" },
      ],
      vocab: "estimate, product, round, multiple, reasonable, approximate, check",
      support: "Provide the rounded numbers so students focus on the estimate.",
      extension: "Estimate a 2-digit by 2-digit product and explain how close the estimate is.",
      assessment: "Students estimate products and check reasonableness — links to Y4 in the SOLO Show task.",
    },
    {
      num: 8, band: "G",
      title: "Powers of 10 and index notation",
      outcomes: ["G1"], duration: "30 min",
      syllabus: "MA4-IND-C-01, MAO-WM-01 | Stage 4: index notation; powers of 10",
      source: "Original mini lesson (Stage 4 extension)",
      li: "write powers of 10 in index notation and use them to write large numbers",
      sc: [
        "I can write a power of 10 in index notation (e.g. 10 × 10 = 10²).",
        "I know the index tells me how many tens are multiplied (and how many zeros 10 to that power has).",
        "I can write and evaluate powers of 10 up to 10⁶ = 1 000 000.",
      ],
      steps: [
        { label: "Activate (4 min):", content: "10 × 10 = 100. Is there a shorter way to write 'ten multiplied by itself'?" },
        { label: "Model (12 min):", content: "Introduce the base and index: 10² = 100, 10³ = 1000, 10⁶ = 1 000 000. The index = the number of tens multiplied = the number of zeros. Evaluate 10⁴ = 10 000." },
        { label: "Guided practice (10 min):", content: "Students write powers of 10 in index notation and evaluate them in standard form." },
        { label: "Check (4 min):", content: "Exit question: write 10⁴ in standard form, and write 1 000 000 as a power of 10." },
      ],
      vocab: "index notation, power, exponent, base, powers of 10, standard form, evaluate",
      support: "Build a table linking the index, the zeros and the standard-form number.",
      extension: "Write a large number such as 4 000 000 as 4 × 10⁶.",
      assessment: "Students use index notation for powers of 10 — extends R1 and R3.",
    },
    {
      num: 9, band: "G",
      title: "Multiplying and dividing decimals",
      outcomes: ["G2"], duration: "30 min",
      syllabus: "MA4-FRC-C-01, MAO-WM-01 | Stage 4: ×/÷ decimals by powers of 10; round to a given dp",
      source: "Original mini lesson (Stage 4 extension)",
      li: "multiply and divide decimals by powers of 10 and round to a given number of places",
      sc: [
        "I can multiply a decimal by 10, 100 and 1000 (shift digits left).",
        "I can divide a decimal by 10, 100 and 1000 (shift digits right).",
        "I can round a decimal to 1 or 2 decimal places.",
      ],
      steps: [
        { label: "Activate (3 min):", content: "What is 3.45 × 100? Ask students to predict the digit shift." },
        { label: "Model (12 min):", content: "× 100 shifts digits two places left (3.45 → 345). ÷ 10 shifts one place right (3.45 → 0.345). Round 3.456 to 2 dp → 3.46 (look at the third place)." },
        { label: "Guided practice (10 min):", content: "Students multiply and divide decimals by powers of 10 and round answers to a given number of places." },
        { label: "Check (4 min):", content: "Exit question: 0.7 × 1000 = ? and round 2.358 to 1 decimal place." },
      ],
      vocab: "decimal, multiply, divide, powers of 10, round, decimal place, shift",
      support: "Use a place value chart and move every digit the same number of places.",
      extension: "Divide a decimal by 1000 and round the result to 2 dp.",
      assessment: "Students multiply/divide decimals and round — extends R2, R3 and Y3.",
    },
    {
      num: 10, band: "G",
      title: "Order of operations with whole numbers and decimals",
      outcomes: ["G3"], duration: "30 min",
      syllabus: "MA4-INT-C-01, MAO-WM-01 | Stage 4: order of operations; check with estimation",
      source: "Original mini lesson (Stage 4 extension)",
      li: "use the order of operations to evaluate expressions",
      sc: [
        "I know we agree on an order so everyone gets the same answer.",
        "I can do brackets first, then multiplication and division, then addition and subtraction.",
        "I can use estimation to check that my answer is reasonable.",
      ],
      steps: [
        { label: "Activate (4 min):", content: "Work out 2 + 3 × 4 two different ways. Why do we need an agreed order?" },
        { label: "Model (12 min):", content: "Order of operations: brackets, then × and ÷, then + and −. So 2 + 3 × 4 = 14, but (2 + 3) × 4 = 20 — brackets change the answer. Estimate to check a longer expression is reasonable." },
        { label: "Guided practice (10 min):", content: "Students evaluate expressions with and without brackets, including simple decimals." },
        { label: "Check (4 min):", content: "Exit question: work out 10 − (2 + 3) × 1 and 20 ÷ (5 − 1)." },
      ],
      vocab: "order of operations, brackets, grouping symbols, evaluate, expression, estimate",
      support: "Provide the operation order as a checklist to follow each time.",
      extension: "Place brackets in a number sentence to make it equal a given target.",
      assessment: "Students apply the order of operations — extends Y4.",
    },
  ],
};
