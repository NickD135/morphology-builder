// Unit 27 — Multiplicative Relations — resource data for the program Resource Appendix.
// NOTE: u27's full program docx predates the unit_data.js build pipeline, so this file
// carries ONLY the data needed to (re)generate the Resource Appendix via
// `node scripts/build_appendix_only.js units/u27/unit_data.js`.
// Resources mirror the SOLO tracker set exactly (solo/index.html + DB), matching
// u27_resources_fix.sql and u27_r6_split.sql. Every URL verified (oEmbed/curl) 2026-06-21.
module.exports = {
  unit_number: "27",
  unit_name: "Multiplicative Relations",
  resource_appendix_attached: false,
  outcomes: [
    { code: "R1", desc: "Use the area model to solve multiplication problems" },
    { code: "R6", desc: "Use a multiplication algorithm (the standard written method) to solve multiplication problems" },
    { code: "R2", desc: "Solve multiplication word problems using efficient strategies" },
    { code: "R3", desc: "Determine factors and products and identify prime, composite and other numbers" },
    { code: "R4", desc: "Use multiples to create tables of values and describe patterns using multiplication" },
    { code: "R5", desc: "Select and use efficient strategies to multiply whole numbers of up to 4 digits by 1- and 2-digit numbers" },
    { code: "Y1", desc: "Apply strategies to solve division problems and word problems involving division" },
    { code: "Y2", desc: "Use and interpret remainders in solutions to division problems" },
    { code: "Y3", desc: "Use grouping symbols and apply the order of operations to solve number sentences" },
    { code: "Y4", desc: "Use inverse operations to solve number sentences involving more than one operation" },
    { code: "Y5", desc: "Solve word problems involving rates using multiplication and division" },
    { code: "Y6", desc: "Recognise that division can be recorded using fractions" },
    { code: "G1", desc: "Multiply and divide positive and negative integers" },
    { code: "G2", desc: "Apply the order of operations and grouping symbols to evaluate expressions involving integers" },
    { code: "G3", desc: "Examine pronumerals and write algebraic expressions using concise notation" },
    { code: "G4", desc: "Create and evaluate algebraic expressions by substituting values for pronumerals" },
    { code: "G5", desc: "Identify like terms and simplify algebraic expressions by adding and subtracting" },
    { code: "G6", desc: "Apply the distributive law to expand and simplify algebraic expressions" },
  ],
  resources: {
    r1: [
      { type: "video", label: "Area Model (Box Method): 2-Digit × 2-Digit Multiplication | Math with Mr. J", url: "https://www.youtube.com/watch?v=n3q3XzzIGSY" },
      { type: "video", label: "Area Model (Box Method): 3-Digit × 2-Digit Multiplication | Math with Mr. J", url: "https://www.youtube.com/watch?v=zfYG9lzMmUo" },
      { type: "worksheet", label: "Corbettmaths — Multiplication 1 (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2018/01/multiplication-1-pdf.pdf" },
    ],
    r6: [
      { type: "video", label: "Standard Algorithm: 3-Digit × 1-Digit Multiplication | Math with Mr. J", url: "https://www.youtube.com/watch?v=od-tHGrudcA" },
      { type: "video", label: "Standard Algorithm: 2-Digit × 2-Digit (Long Multiplication) | Math with Mr. J", url: "https://www.youtube.com/watch?v=PZjIT9CH6bM" },
      { type: "worksheet", label: "Corbettmaths — Multiplication 2 (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2018/01/multiplication-2-pdf.pdf" },
    ],
    r2: [
      { type: "video", label: "Solve Multi-Step Word Problems with Multiplication and Division", url: "https://www.youtube.com/watch?v=CE7CRaYxzjg" },
      { type: "video", label: "Multiplication: A Step-By-Step Review (Efficient Strategies) | Math with Mr. J", url: "https://www.youtube.com/watch?v=g5TmDrXeiR8" },
      { type: "worksheet", label: "Corbettmaths — Multiplication Word Problems (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/multiplication-pdf1.pdf" },
    ],
    r3: [
      { type: "video", label: "Grade 5 — Multiples, Factors, Primes and Composites | WorksheetCloud", url: "https://www.youtube.com/watch?v=HVBTiNeLhPE" },
      { type: "video", label: "Prime and Composite Numbers", url: "https://www.youtube.com/watch?v=44jD-K2leEM" },
      { type: "video", label: "Mini Maths Lesson: Year 6 — Prime, Composite and Square Numbers", url: "https://www.youtube.com/watch?v=b-XavTWnTMY" },
      { type: "worksheet", label: "Corbettmaths — Multiples, Factors and Primes (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/multiples-factors-primes-pdf.pdf" },
    ],
    r4: [
      { type: "video", label: "Patterns & Algebra: Table of Values (Year 5 & 6 Maths)", url: "https://www.youtube.com/watch?v=xIcwyvvmx4A" },
      { type: "video", label: "Patterns and Sequences | Grade 6 Math", url: "https://www.youtube.com/watch?v=EYBy8Jrsy68" },
      { type: "worksheet", label: "Corbettmaths — Function Machines / Tables of Values (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2019/02/Function-Machines.pdf" },
    ],
    r5: [
      { type: "video", label: "Box Method Multiplication | 3-Digits × 2-Digits | Math with Mr. J", url: "https://www.youtube.com/watch?v=zfYG9lzMmUo" },
      { type: "video", label: "2-Digit Multiplication: A Step-By-Step Review | Math with Mr. J", url: "https://www.youtube.com/watch?v=yiZ3r9T_OJs" },
      { type: "worksheet", label: "Corbettmaths — Multiplication 2 (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2018/01/multiplication-2-pdf.pdf" },
    ],
    y1: [
      { type: "video", label: "Division Strategies | Multiplication and Division | Year 5", url: "https://www.youtube.com/watch?v=aTtuFEZVKaM" },
      { type: "video", label: "Learn 5th Grade Math — Long Division Word Problem", url: "https://www.youtube.com/watch?v=xD5Gl-mWRnk" },
      { type: "worksheet", label: "Corbettmaths — Division (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2018/01/division-pdf.pdf" },
    ],
    y2: [
      { type: "video", label: "Interpreting Remainders in Division Word Problems", url: "https://www.youtube.com/watch?v=0dPQEKjTFjg" },
      { type: "video", label: "5th Grade Math 2.7 — Interpret the Remainder in Division", url: "https://www.youtube.com/watch?v=FkRmFMwYcTA" },
      { type: "worksheet", label: "Corbettmaths — Division Remainders (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2018/11/Division-Remainders-pdf.pdf" },
    ],
    y3: [
      { type: "video", label: "Order of Operations (BODMAS) | Year 5 and 6 Home Learning", url: "https://www.youtube.com/watch?v=VY-Da9ZmFFs" },
      { type: "video", label: "Order of Operations | PEMDAS | 5th Grade Math", url: "https://www.youtube.com/watch?v=OdFXImly2-I" },
      { type: "worksheet", label: "Corbettmaths — Order of Operations Exercise (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2018/11/Order-of-Operations-Exercise-211-pdf.pdf" },
      { type: "worksheet", label: "Corbettmaths — Order of Operations (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/order-of-operations-pdf.pdf" },
    ],
    y4: [
      { type: "video", label: "Solve Missing Number Problems for Multiplication and Division", url: "https://www.youtube.com/watch?v=M5upWuCp4KA" },
      { type: "video", label: "Function Machines (Working Backwards, Two Steps) — Corbettmaths", url: "https://www.youtube.com/watch?v=akj9L0HaTY4" },
      { type: "worksheet", label: "Corbettmaths — Function Machines (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2019/02/Function-Machines.pdf" },
    ],
    y5: [
      { type: "video", label: "Solving Unit Rate Word Problems | Math with Mr. J", url: "https://www.youtube.com/watch?v=dcSYoFFSXQk" },
      { type: "video", label: "Rates and Unit Rates | Math with Mr. J", url: "https://www.youtube.com/watch?v=jC1K7fM91sE" },
      { type: "worksheet", label: "Corbettmaths — Unitary Method / Rates (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2018/11/Unitary-Method-pdf.pdf" },
    ],
    y6: [
      { type: "video", label: "Fractions as Division | MightyOwl Math | 5th Grade", url: "https://www.youtube.com/watch?v=gXotbzp5D0M" },
      { type: "video", label: "Numerator and Denominator of a Fraction | Khan Academy", url: "https://www.youtube.com/watch?v=3XOt1fjWKi8" },
    ],
    g1: [
      { type: "video", label: "Year 7 Directed Numbers — All Four Operations", url: "https://www.youtube.com/watch?v=4XC8QqgGWJ0" },
      { type: "video", label: "Multiplying Negative Numbers — Corbettmaths", url: "https://www.youtube.com/watch?v=ElAvJfpGD0w" },
      { type: "video", label: "Directed Numbers | Multiplication and Division", url: "https://www.youtube.com/watch?v=NUqAsCgdArM" },
      { type: "worksheet", label: "Corbettmaths — Negative Numbers: Multiplication and Division (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2018/11/Negatives-multiplication-and-division-pdf.pdf" },
    ],
    g2: [
      { type: "video", label: "Order of Operations using BODMAS", url: "https://www.youtube.com/watch?v=-ppkSPdMs5M" },
      { type: "video", label: "How To Use BODMAS for Order of Operations", url: "https://www.youtube.com/watch?v=nHXT8am9X0o" },
      { type: "worksheet", label: "Corbettmaths — Order of Operations (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/order-of-operations-pdf.pdf" },
      { type: "worksheet", label: "Corbettmaths — Arithmetic with Negatives Exam Questions (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/arithmetic-with-negatives-pdf.pdf" },
    ],
    g3: [
      { type: "video", label: "GRADE 7 MATH — Introduction to Algebra: Algebraic Expressions", url: "https://www.youtube.com/watch?v=A7cB5iglREI" },
      { type: "video", label: "Forming Algebraic Expressions — Corbettmaths", url: "https://www.youtube.com/watch?v=ZIv-ZCRzS80" },
      { type: "worksheet", label: "Corbettmaths — Forming Expressions (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/forming-expressions-pdf.pdf" },
    ],
    g4: [
      { type: "video", label: "Substitution into Expressions — Corbettmaths", url: "https://www.youtube.com/watch?v=ZkC2FX5TOJ8" },
      { type: "video", label: "Substitution into Expressions (part 2) — Corbettmaths", url: "https://www.youtube.com/watch?v=28DkE4vMN6o" },
      { type: "worksheet", label: "Corbettmaths — Substitution (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/substitution-pdf2.pdf" },
    ],
    g5: [
      { type: "video", label: "Simplifying Algebraic Expressions — Combining Like Terms | Math with Mr. J", url: "https://www.youtube.com/watch?v=1MmhAq-XVN0" },
      { type: "video", label: "Year 7 Maths — Collecting Like Terms", url: "https://www.youtube.com/watch?v=dxn2hdxejAo" },
      { type: "video", label: "Collecting Like Terms — Corbettmaths", url: "https://www.youtube.com/watch?v=zxJNJMDj2Ec" },
      { type: "worksheet", label: "Corbettmaths — Collecting Like Terms (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/collecting-like-terms-pdf3.pdf" },
    ],
    g6: [
      { type: "video", label: "How to Simplify Algebraic Expressions | Grade 7 Math", url: "https://www.youtube.com/watch?v=BqOf_1PI_lo" },
      { type: "video", label: "C1 Simplifying Expressions — Corbettmaths", url: "https://www.youtube.com/watch?v=0Nc22d2mdm8" },
      { type: "worksheet", label: "Corbettmaths — Expanding Brackets (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2019/10/Expanding-Brackets-pdf.pdf" },
      { type: "worksheet", label: "Corbettmaths — Expanding Brackets (Further) (PDF)", url: "https://corbettmaths.com/wp-content/uploads/2013/02/expanding-brackets-pdf1.pdf" },
    ],
  },
};
