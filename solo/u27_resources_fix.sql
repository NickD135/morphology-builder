-- ============================================================================
-- Unit 27 (Multiplicative Relations) — resource realignment
-- Run in the Supabase SQL editor (project kdpavfrzmmzknqfpodrl).
-- Deletes the existing global u27 resource rows and re-inserts the corrected,
-- syllabus-aligned set. All videos verified live (YouTube oEmbed) and all PDFs
-- verified 200 on 2026-06-21. Class-scoped rows (scope <> 'global') are left
-- untouched. After running this, the hardcoded u27 RESOURCES block has been
-- removed from solo/index.html, so this table is the single source of truth.
-- ============================================================================

BEGIN;

DELETE FROM resources WHERE unit_id = 'u27' AND scope = 'global';

INSERT INTO resources (id, unit_id, outcome_id, type, label, url, scope, class_id, question) VALUES
-- R1 — Use the area model AND algorithms (labels now name each method) -------
(gen_random_uuid(),'u27','r1','video','Area Model (Box Method): 2-Digit × 2-Digit Multiplication | Math with Mr. J','https://www.youtube.com/watch?v=n3q3XzzIGSY','global',NULL,NULL),
(gen_random_uuid(),'u27','r1','video','Standard Algorithm: 2-Digit × 2-Digit Multiplication | Math with Mr. J','https://www.youtube.com/watch?v=PZjIT9CH6bM','global',NULL,NULL),
(gen_random_uuid(),'u27','r1','worksheet','Corbettmaths — Multiplication 1 (PDF)','https://corbettmaths.com/wp-content/uploads/2018/01/multiplication-1-pdf.pdf','global',NULL,NULL),
-- R2 — Multiplication WORD PROBLEMS using efficient strategies (replaced) ----
(gen_random_uuid(),'u27','r2','video','Solve Multi-Step Word Problems with Multiplication and Division','https://www.youtube.com/watch?v=CE7CRaYxzjg','global',NULL,NULL),
(gen_random_uuid(),'u27','r2','video','Multiplication: A Step-By-Step Review (Efficient Strategies) | Math with Mr. J','https://www.youtube.com/watch?v=g5TmDrXeiR8','global',NULL,NULL),
(gen_random_uuid(),'u27','r2','worksheet','Corbettmaths — Multiplication Word Problems (PDF)','https://corbettmaths.com/wp-content/uploads/2013/02/multiplication-pdf1.pdf','global',NULL,NULL),
-- R3 — Factors, products, primes & composites (kept) ------------------------
(gen_random_uuid(),'u27','r3','video','Grade 5 — Multiples, Factors, Primes and Composites | WorksheetCloud','https://www.youtube.com/watch?v=HVBTiNeLhPE','global',NULL,NULL),
(gen_random_uuid(),'u27','r3','video','Prime and Composite Numbers','https://www.youtube.com/watch?v=44jD-K2leEM','global',NULL,NULL),
(gen_random_uuid(),'u27','r3','video','Mini Maths Lesson: Year 6 — Prime, Composite and Square Numbers','https://www.youtube.com/watch?v=b-XavTWnTMY','global',NULL,NULL),
(gen_random_uuid(),'u27','r3','worksheet','Corbettmaths — Multiples, Factors and Primes (PDF)','https://corbettmaths.com/wp-content/uploads/2013/02/multiples-factors-primes-pdf.pdf','global',NULL,NULL),
-- R4 — Tables of values & patterns using multiplication (replaced) ----------
(gen_random_uuid(),'u27','r4','video','Patterns & Algebra: Table of Values (Year 5 & 6 Maths)','https://www.youtube.com/watch?v=xIcwyvvmx4A','global',NULL,NULL),
(gen_random_uuid(),'u27','r4','video','Patterns and Sequences | Grade 6 Math','https://www.youtube.com/watch?v=EYBy8Jrsy68','global',NULL,NULL),
(gen_random_uuid(),'u27','r4','worksheet','Corbettmaths — Function Machines / Tables of Values (PDF)','https://corbettmaths.com/wp-content/uploads/2019/02/Function-Machines.pdf','global',NULL,NULL),
-- R5 — Multiply up to 4 digits by 1- and 2-digit numbers (kept) -------------
(gen_random_uuid(),'u27','r5','video','Box Method Multiplication | 3-Digits × 2-Digits | Math with Mr. J','https://www.youtube.com/watch?v=zfYG9lzMmUo','global',NULL,NULL),
(gen_random_uuid(),'u27','r5','video','2-Digit Multiplication: A Step-By-Step Review | Math with Mr. J','https://www.youtube.com/watch?v=yiZ3r9T_OJs','global',NULL,NULL),
(gen_random_uuid(),'u27','r5','worksheet','Corbettmaths — Multiplication 2 (PDF)','https://corbettmaths.com/wp-content/uploads/2018/01/multiplication-2-pdf.pdf','global',NULL,NULL),
-- Y1 — Division strategies & word problems (kept) --------------------------
(gen_random_uuid(),'u27','y1','video','Division Strategies | Multiplication and Division | Year 5','https://www.youtube.com/watch?v=aTtuFEZVKaM','global',NULL,NULL),
(gen_random_uuid(),'u27','y1','video','Learn 5th Grade Math — Long Division Word Problem','https://www.youtube.com/watch?v=xD5Gl-mWRnk','global',NULL,NULL),
(gen_random_uuid(),'u27','y1','worksheet','Corbettmaths — Division (PDF)','https://corbettmaths.com/wp-content/uploads/2018/01/division-pdf.pdf','global',NULL,NULL),
-- Y2 — Remainders (kept) ---------------------------------------------------
(gen_random_uuid(),'u27','y2','video','Interpreting Remainders in Division Word Problems','https://www.youtube.com/watch?v=0dPQEKjTFjg','global',NULL,NULL),
(gen_random_uuid(),'u27','y2','video','5th Grade Math 2.7 — Interpret the Remainder in Division','https://www.youtube.com/watch?v=FkRmFMwYcTA','global',NULL,NULL),
(gen_random_uuid(),'u27','y2','worksheet','Corbettmaths — Division Remainders (PDF)','https://corbettmaths.com/wp-content/uploads/2018/11/Division-Remainders-pdf.pdf','global',NULL,NULL),
-- Y3 — Order of operations & grouping symbols (kept) -----------------------
(gen_random_uuid(),'u27','y3','video','Order of Operations (BODMAS) | Year 5 and 6 Home Learning','https://www.youtube.com/watch?v=VY-Da9ZmFFs','global',NULL,NULL),
(gen_random_uuid(),'u27','y3','video','Order of Operations | PEMDAS | 5th Grade Math','https://www.youtube.com/watch?v=OdFXImly2-I','global',NULL,NULL),
(gen_random_uuid(),'u27','y3','worksheet','Corbettmaths — Order of Operations Exercise (PDF)','https://corbettmaths.com/wp-content/uploads/2018/11/Order-of-Operations-Exercise-211-pdf.pdf','global',NULL,NULL),
(gen_random_uuid(),'u27','y3','worksheet','Corbettmaths — Order of Operations (PDF)','https://corbettmaths.com/wp-content/uploads/2013/02/order-of-operations-pdf.pdf','global',NULL,NULL),
-- Y4 — Inverse operations, more than one operation (replaced) --------------
(gen_random_uuid(),'u27','y4','video','Solve Missing Number Problems for Multiplication and Division','https://www.youtube.com/watch?v=M5upWuCp4KA','global',NULL,NULL),
(gen_random_uuid(),'u27','y4','video','Function Machines (Working Backwards, Two Steps) — Corbettmaths','https://www.youtube.com/watch?v=akj9L0HaTY4','global',NULL,NULL),
(gen_random_uuid(),'u27','y4','worksheet','Corbettmaths — Function Machines (PDF)','https://corbettmaths.com/wp-content/uploads/2019/02/Function-Machines.pdf','global',NULL,NULL),
-- Y5 — Rates word problems (replaced) -------------------------------------
(gen_random_uuid(),'u27','y5','video','Solving Unit Rate Word Problems | Math with Mr. J','https://www.youtube.com/watch?v=dcSYoFFSXQk','global',NULL,NULL),
(gen_random_uuid(),'u27','y5','video','Rates and Unit Rates | Math with Mr. J','https://www.youtube.com/watch?v=jC1K7fM91sE','global',NULL,NULL),
(gen_random_uuid(),'u27','y5','worksheet','Corbettmaths — Unitary Method / Rates (PDF)','https://corbettmaths.com/wp-content/uploads/2018/11/Unitary-Method-pdf.pdf','global',NULL,NULL),
-- Y6 — Division recorded as fractions (kept) ------------------------------
(gen_random_uuid(),'u27','y6','video','Fractions as Division | MightyOwl Math | 5th Grade','https://www.youtube.com/watch?v=gXotbzp5D0M','global',NULL,NULL),
(gen_random_uuid(),'u27','y6','video','Numerator and Denominator of a Fraction | Khan Academy','https://www.youtube.com/watch?v=3XOt1fjWKi8','global',NULL,NULL),
-- G1 — Multiply & divide integers (kept) ---------------------------------
(gen_random_uuid(),'u27','g1','video','Year 7 Directed Numbers — All Four Operations','https://www.youtube.com/watch?v=4XC8QqgGWJ0','global',NULL,NULL),
(gen_random_uuid(),'u27','g1','video','Multiplying Negative Numbers — Corbettmaths','https://www.youtube.com/watch?v=ElAvJfpGD0w','global',NULL,NULL),
(gen_random_uuid(),'u27','g1','video','Directed Numbers | Multiplication and Division','https://www.youtube.com/watch?v=NUqAsCgdArM','global',NULL,NULL),
(gen_random_uuid(),'u27','g1','worksheet','Corbettmaths — Negative Numbers: Multiplication and Division (PDF)','https://corbettmaths.com/wp-content/uploads/2018/11/Negatives-multiplication-and-division-pdf.pdf','global',NULL,NULL),
-- G2 — Order of operations with integers (kept) --------------------------
(gen_random_uuid(),'u27','g2','video','Order of Operations using BODMAS','https://www.youtube.com/watch?v=-ppkSPdMs5M','global',NULL,NULL),
(gen_random_uuid(),'u27','g2','video','How To Use BODMAS for Order of Operations','https://www.youtube.com/watch?v=nHXT8am9X0o','global',NULL,NULL),
(gen_random_uuid(),'u27','g2','worksheet','Corbettmaths — Order of Operations (PDF)','https://corbettmaths.com/wp-content/uploads/2013/02/order-of-operations-pdf.pdf','global',NULL,NULL),
(gen_random_uuid(),'u27','g2','worksheet','Corbettmaths — Arithmetic with Negatives Exam Questions (PDF)','https://corbettmaths.com/wp-content/uploads/2013/02/arithmetic-with-negatives-pdf.pdf','global',NULL,NULL),
-- G3 — Write algebraic expressions / notation (PDF & video corrected) -----
(gen_random_uuid(),'u27','g3','video','GRADE 7 MATH — Introduction to Algebra: Algebraic Expressions','https://www.youtube.com/watch?v=A7cB5iglREI','global',NULL,NULL),
(gen_random_uuid(),'u27','g3','video','Forming Algebraic Expressions — Corbettmaths','https://www.youtube.com/watch?v=ZIv-ZCRzS80','global',NULL,NULL),
(gen_random_uuid(),'u27','g3','worksheet','Corbettmaths — Forming Expressions (PDF)','https://corbettmaths.com/wp-content/uploads/2013/02/forming-expressions-pdf.pdf','global',NULL,NULL),
-- G4 — Evaluate by substitution (kept) -----------------------------------
(gen_random_uuid(),'u27','g4','video','Substitution into Expressions — Corbettmaths','https://www.youtube.com/watch?v=ZkC2FX5TOJ8','global',NULL,NULL),
(gen_random_uuid(),'u27','g4','video','Substitution into Expressions (part 2) — Corbettmaths','https://www.youtube.com/watch?v=28DkE4vMN6o','global',NULL,NULL),
(gen_random_uuid(),'u27','g4','worksheet','Corbettmaths — Substitution (PDF)','https://corbettmaths.com/wp-content/uploads/2013/02/substitution-pdf2.pdf','global',NULL,NULL),
-- G5 — Like terms (kept) -------------------------------------------------
(gen_random_uuid(),'u27','g5','video','Simplifying Algebraic Expressions — Combining Like Terms | Math with Mr. J','https://www.youtube.com/watch?v=1MmhAq-XVN0','global',NULL,NULL),
(gen_random_uuid(),'u27','g5','video','Year 7 Maths — Collecting Like Terms','https://www.youtube.com/watch?v=dxn2hdxejAo','global',NULL,NULL),
(gen_random_uuid(),'u27','g5','video','Collecting Like Terms — Corbettmaths','https://www.youtube.com/watch?v=zxJNJMDj2Ec','global',NULL,NULL),
(gen_random_uuid(),'u27','g5','worksheet','Corbettmaths — Collecting Like Terms (PDF)','https://corbettmaths.com/wp-content/uploads/2013/02/collecting-like-terms-pdf3.pdf','global',NULL,NULL),
-- G6 — Distributive law / expanding brackets (kept) ----------------------
(gen_random_uuid(),'u27','g6','video','How to Simplify Algebraic Expressions | Grade 7 Math','https://www.youtube.com/watch?v=BqOf_1PI_lo','global',NULL,NULL),
(gen_random_uuid(),'u27','g6','video','C1 Simplifying Expressions — Corbettmaths','https://www.youtube.com/watch?v=0Nc22d2mdm8','global',NULL,NULL),
(gen_random_uuid(),'u27','g6','worksheet','Corbettmaths — Expanding Brackets (PDF)','https://corbettmaths.com/wp-content/uploads/2019/10/Expanding-Brackets-pdf.pdf','global',NULL,NULL),
(gen_random_uuid(),'u27','g6','worksheet','Corbettmaths — Expanding Brackets (Further) (PDF)','https://corbettmaths.com/wp-content/uploads/2013/02/expanding-brackets-pdf1.pdf','global',NULL,NULL);

COMMIT;

-- Sanity check (optional): should return 56 rows.
-- SELECT outcome_id, type, label FROM resources WHERE unit_id='u27' AND scope='global' ORDER BY outcome_id;
