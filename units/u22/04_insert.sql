-- Unit 22 — resource inserts for the Supabase `resources` table.
-- Generated from units/u22/03_resources_staged.csv (every URL verified live in Stage 3 via oEmbed/curl).
-- DB-CANONICAL: these rows override any hardcoded RESOURCES. Run in the Supabase SQL editor (anon key cannot write).
-- Gated workflow: Nick runs this. DO NOT auto-execute.

DELETE FROM resources WHERE unit_id = 'u22';

INSERT INTO resources (unit_id, outcome_id, type, label, url, scope, class_id) VALUES
  ('u22', 'r1', 'video', 'Place Value to the Thousandths — Representing Decimal Numbers | Miacademy', 'https://www.youtube.com/watch?v=BsZJGMRWEK0', 'global', NULL),
  ('u22', 'r1', 'video', 'Expanded Form with Decimals | Math with Mr. J', 'https://www.youtube.com/watch?v=GX8o-S6Vxig', 'global', NULL),
  ('u22', 'r1', 'worksheet', 'Corbettmaths — Place Value (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf', 'global', NULL),
  ('u22', 'r2', 'video', 'Writing Tenths and Hundredths (Decimals and Fractions) | Math with Mr. J', 'https://www.youtube.com/watch?v=ibR_iBxnITE', 'global', NULL),
  ('u22', 'r2', 'video', 'Comparing and Ordering Decimals | Math with Mr. J', 'https://www.youtube.com/watch?v=KWsLyjXKhrM', 'global', NULL),
  ('u22', 'r2', 'worksheet', 'Corbettmaths — Ordering Decimals (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/ordering-decimals-pdf.pdf', 'global', NULL),
  ('u22', 'r3', 'video', 'Estimating Whole Number Sums and Differences | Math with Mr. J', 'https://www.youtube.com/watch?v=EvQf38lnAJc', 'global', NULL),
  ('u22', 'r3', 'video', 'Estimating Decimal Sums | Math with Mr. J', 'https://www.youtube.com/watch?v=x05LHZJNKQ0', 'global', NULL),
  ('u22', 'r3', 'worksheet', 'Corbettmaths — Rounding (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/rounding-pdf.pdf', 'global', NULL),
  ('u22', 'r3', 'worksheet', 'Corbettmaths — Estimation (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/estimation-pdf.pdf', 'global', NULL),
  ('u22', 'r4', 'video', 'How to Add and Subtract Large Numbers | Math with Mr. J', 'https://www.youtube.com/watch?v=186wdnoAYJc', 'global', NULL),
  ('u22', 'r4', 'video', 'Adding Large Numbers — A Quick Review | Math with Mr. J', 'https://www.youtube.com/watch?v=T9asFgfN5bg', 'global', NULL),
  ('u22', 'r4', 'worksheet', 'Corbettmaths — Place Value (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf', 'global', NULL),
  ('u22', 'y1', 'video', 'How to Use Bridging to Support Mental Addition and Subtraction | Third Space Learning', 'https://www.youtube.com/watch?v=oDDC1thyc2Q', 'global', NULL),
  ('u22', 'y1', 'video', 'Addition and Subtraction — The Compensation Strategy | Charlotte Dooley', 'https://www.youtube.com/watch?v=X3kgzlb8VrM', 'global', NULL),
  ('u22', 'y1', 'worksheet', 'Corbettmaths — Place Value (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf', 'global', NULL),
  ('u22', 'y2', 'video', 'Multi-Step Word Problem (Addition, Subtraction, Multiplication) | Khan Academy', 'https://www.youtube.com/watch?v=-sSDb_wZqKQ', 'global', NULL),
  ('u22', 'y2', 'video', 'How to Add and Subtract Large Numbers | Math with Mr. J', 'https://www.youtube.com/watch?v=186wdnoAYJc', 'global', NULL),
  ('u22', 'y2', 'worksheet', 'Corbettmaths — Estimation (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/estimation-pdf.pdf', 'global', NULL),
  ('u22', 'y3', 'video', 'Adding and Subtracting Decimals (How to) | Math with Mr. J', 'https://www.youtube.com/watch?v=PnwLv6khwk8', 'global', NULL),
  ('u22', 'y3', 'video', 'How to Add and Subtract Decimals (Step-by-Step Examples) | Math with Mr. J', 'https://www.youtube.com/watch?v=Cg-_TeiaSa8', 'global', NULL),
  ('u22', 'y3', 'worksheet', 'Corbettmaths — Adding Decimals (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/adding-decimals-pdf.pdf', 'global', NULL),
  ('u22', 'y3', 'worksheet', 'Corbettmaths — Subtracting Decimals (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/subtracting-decimals-pdf.pdf', 'global', NULL),
  ('u22', 'y4', 'video', 'How to Add and Subtract Decimals (Step-by-Step Examples) | Math with Mr. J', 'https://www.youtube.com/watch?v=Cg-_TeiaSa8', 'global', NULL),
  ('u22', 'y4', 'video', 'Estimating Decimal Sums | Math with Mr. J', 'https://www.youtube.com/watch?v=x05LHZJNKQ0', 'global', NULL),
  ('u22', 'y4', 'worksheet', 'Corbettmaths — Adding Decimals (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/adding-decimals-pdf.pdf', 'global', NULL),
  ('u22', 'g1', 'video', 'Multiply a Whole Number by a Decimal | Math with Mr. J', 'https://www.youtube.com/watch?v=tsOibhsgYoQ', 'global', NULL),
  ('u22', 'g1', 'video', 'How to Multiply a Whole Number and a Decimal | Math with Mr. J', 'https://www.youtube.com/watch?v=FbZr5br9ZOg', 'global', NULL),
  ('u22', 'g1', 'worksheet', 'Corbettmaths — Multiplying and Dividing Decimals (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/decimals-multiplying-and-dividing.pdf', 'global', NULL),
  ('u22', 'g2', 'video', 'How to Add Negative Numbers (Integers) | Math with Mr. J', 'https://www.youtube.com/watch?v=1VFj_coqKQU', 'global', NULL),
  ('u22', 'g2', 'video', 'Subtracting Integers Using a Number Line | Math with Mr. J', 'https://www.youtube.com/watch?v=Dfytkh_lYME', 'global', NULL),
  ('u22', 'g2', 'worksheet', 'Corbettmaths — Negative Numbers (PDF)', 'https://corbettmaths.com/wp-content/uploads/2018/11/Negative-Numbers.pdf', 'global', NULL),
  ('u22', 'g3', 'video', 'Order of Operations — A Step-By-Step Guide | PEMDAS | Math with Mr. J', 'https://www.youtube.com/watch?v=x41BCrYh8Kc', 'global', NULL),
  ('u22', 'g3', 'video', 'Order of Operations — Parentheses, Brackets and Braces | PEMDAS | Math with Mr. J', 'https://www.youtube.com/watch?v=u7Lack4Tmx8', 'global', NULL),
  ('u22', 'g3', 'worksheet', 'Corbettmaths — Order of Operations (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/order-of-operations-pdf.pdf', 'global', NULL);
