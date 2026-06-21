-- Unit 21 — resource inserts for the Supabase `resources` table.
-- Generated from units/u21/03_resources_staged.csv (every URL verified live in Stage 3 via oEmbed/curl).
-- DB-CANONICAL: these rows override any hardcoded RESOURCES. Run in the Supabase SQL editor (anon key cannot write).
-- Gated workflow: Nick runs this. DO NOT auto-execute.

DELETE FROM resources WHERE unit_id = 'u21';

INSERT INTO resources (unit_id, outcome_id, type, label, url, scope, class_id) VALUES
  ('u21', 'r1', 'video', 'Place Value to Millions | Mrs Roberts Resources', 'https://www.youtube.com/watch?v=yzw3j-O9AYY', 'global', NULL),
  ('u21', 'r1', 'video', 'Reading and Writing Numbers to the Hundred Millions | Easy Math with Mrs. Easley', 'https://www.youtube.com/watch?v=nMvHx_ctugw', 'global', NULL),
  ('u21', 'r1', 'worksheet', 'Corbettmaths — Place Value (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf', 'global', NULL),
  ('u21', 'r2', 'video', 'Comparing and Ordering Decimals | Math with Mr. J', 'https://www.youtube.com/watch?v=KWsLyjXKhrM', 'global', NULL),
  ('u21', 'r2', 'video', 'How to Order Decimals | Math with Mr. J', 'https://www.youtube.com/watch?v=1dfedgVxA54', 'global', NULL),
  ('u21', 'r2', 'worksheet', 'Corbettmaths — Ordering Decimals (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/ordering-decimals-pdf.pdf', 'global', NULL),
  ('u21', 'r3', 'video', 'Multiplying Multiples of 10 — Fast Mental Math | Math with Mr. J', 'https://www.youtube.com/watch?v=lY7q52L3yN0', 'global', NULL),
  ('u21', 'r3', 'video', 'Multiplying and Dividing by Powers of 10 | Math with Mr. J', 'https://www.youtube.com/watch?v=HH-yrNS80Cg', 'global', NULL),
  ('u21', 'r3', 'worksheet', 'Corbettmaths — Place Value (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf', 'global', NULL),
  ('u21', 'y1', 'video', 'Whole Number Expanded Form, Word Form and Standard Form | Math with Mr. J', 'https://www.youtube.com/watch?v=NOx6jlVSSpU', 'global', NULL),
  ('u21', 'y1', 'video', 'Writing Numbers in Expanded Form (Millions) | Elementary Math with Mr. J', 'https://www.youtube.com/watch?v=Ok_zzg75hO8', 'global', NULL),
  ('u21', 'y1', 'worksheet', 'Corbettmaths — Place Value (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf', 'global', NULL),
  ('u21', 'y2', 'video', 'Multiplying Decimals by 10, 100, 1000 | Lets Do Math', 'https://www.youtube.com/watch?v=GfL0s6tCNV4', 'global', NULL),
  ('u21', 'y2', 'video', 'Dividing by Powers of Ten | Math with Mr. J', 'https://www.youtube.com/watch?v=E8b5pDvt2AE', 'global', NULL),
  ('u21', 'y2', 'worksheet', 'Corbettmaths — Place Value (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf', 'global', NULL),
  ('u21', 'y3', 'video', 'Adding and Subtracting Decimals (How to) | Math with Mr. J', 'https://www.youtube.com/watch?v=PnwLv6khwk8', 'global', NULL),
  ('u21', 'y3', 'video', 'How to Add and Subtract Decimals (Step-by-Step Examples) | Math with Mr. J', 'https://www.youtube.com/watch?v=Cg-_TeiaSa8', 'global', NULL),
  ('u21', 'y3', 'worksheet', 'Corbettmaths — Adding Decimals (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/adding-decimals-pdf.pdf', 'global', NULL),
  ('u21', 'y3', 'worksheet', 'Corbettmaths — Subtracting Decimals (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/subtracting-decimals-pdf.pdf', 'global', NULL),
  ('u21', 'y4', 'video', 'Estimating Whole Number Products | Multiplication Estimation | Math with Mr. J', 'https://www.youtube.com/watch?v=mBWr8c0Lsx4', 'global', NULL),
  ('u21', 'y4', 'video', 'Estimating Whole Number Sums and Differences | Math with Mr. J', 'https://www.youtube.com/watch?v=EvQf38lnAJc', 'global', NULL),
  ('u21', 'y4', 'worksheet', 'Corbettmaths — Estimation (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/estimation-pdf.pdf', 'global', NULL),
  ('u21', 'g1', 'video', 'What are Powers of 10? Exponential, Expanded and Standard Form | Math with Mr. J', 'https://www.youtube.com/watch?v=SKrujXYeFcI', 'global', NULL),
  ('u21', 'g1', 'video', 'What is an Exponent? An Intro to Exponents | Math with Mr. J', 'https://www.youtube.com/watch?v=NS4vHqJIPiE', 'global', NULL),
  ('u21', 'g1', 'worksheet', 'Corbettmaths — Indices (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/indices-pdf.pdf', 'global', NULL),
  ('u21', 'g2', 'video', 'Multiply a Whole Number by a Decimal | Math with Mr. J', 'https://www.youtube.com/watch?v=tsOibhsgYoQ', 'global', NULL),
  ('u21', 'g2', 'video', 'Multiplying and Dividing by Powers of 10 | Math with Mr. J', 'https://www.youtube.com/watch?v=HH-yrNS80Cg', 'global', NULL),
  ('u21', 'g2', 'worksheet', 'Corbettmaths — Multiplying and Dividing Decimals (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/decimals-multiplying-and-dividing.pdf', 'global', NULL),
  ('u21', 'g3', 'video', 'Order of Operations — A Step-By-Step Guide | PEMDAS | Math with Mr. J', 'https://www.youtube.com/watch?v=x41BCrYh8Kc', 'global', NULL),
  ('u21', 'g3', 'video', 'Order of Operations — Parentheses, Brackets and Braces | PEMDAS | Math with Mr. J', 'https://www.youtube.com/watch?v=u7Lack4Tmx8', 'global', NULL),
  ('u21', 'g3', 'worksheet', 'Corbettmaths — Order of Operations (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/order-of-operations-pdf.pdf', 'global', NULL);
