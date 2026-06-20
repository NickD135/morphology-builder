-- Unit 40 — resource inserts for the Supabase `resources` table.
-- Generated from units/u40/03_resources_staged.csv (every URL verified live in Stage 3).
-- NOTE: Unit 40 ships CODE-CANONICAL (hardcoded RESOURCES in solo/index.html) because Nick is away
-- and the SQL may not be inserted this session. These rows are IDENTICAL to the code block; running
-- them is OPTIONAL — if run, the DB rows override the identical hardcoded ones. DO NOT auto-execute.

DELETE FROM resources WHERE unit_id = 'u40';

INSERT INTO resources (unit_id, outcome_id, type, label, url, scope, class_id) VALUES
  ('u40', 'r1', 'video', 'Comparing and Ordering Decimals | Math with Mr. J', 'https://www.youtube.com/watch?v=KWsLyjXKhrM', 'global', NULL),
  ('u40', 'r1', 'video', 'How to Order Decimals | Math with Mr. J', 'https://www.youtube.com/watch?v=1dfedgVxA54', 'global', NULL),
  ('u40', 'r1', 'worksheet', 'Corbettmaths — Ordering Decimals (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/ordering-decimals-pdf.pdf', 'global', NULL),
  ('u40', 'r2', 'video', 'Integers on a Number Line — Missing Numbers | Math with Mr. J', 'https://www.youtube.com/watch?v=lKZp-jEvGqM', 'global', NULL),
  ('u40', 'r2', 'video', 'How to Compare and Order Integers (Positives & Negatives) | Math with Mr. J', 'https://www.youtube.com/watch?v=2FbafvAGhZ0', 'global', NULL),
  ('u40', 'r2', 'worksheet', 'Corbettmaths — Negative Numbers (PDF)', 'https://corbettmaths.com/wp-content/uploads/2018/11/Negative-Numbers.pdf', 'global', NULL),
  ('u40', 'r3', 'video', 'How to Find a Percent of a Number | Math with Mr. J', 'https://www.youtube.com/watch?v=5CAncQ4TZD4', 'global', NULL),
  ('u40', 'r3', 'video', 'Converting Between Fractions / Decimals / Percents — Mini Course | Math with Mr. J', 'https://www.youtube.com/watch?v=2vjbNZaFz3c', 'global', NULL),
  ('u40', 'r3', 'worksheet', 'Corbettmaths — Fractions / Decimals / Percentages (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/fractions-decimals-percentages-pdf.pdf', 'global', NULL),
  ('u40', 'r4', 'video', 'Multiplying and Dividing by Powers of 10 | Math with Mr. J', 'https://www.youtube.com/watch?v=HH-yrNS80Cg', 'global', NULL),
  ('u40', 'r4', 'video', 'Dividing by Powers of Ten | Math with Mr. J', 'https://www.youtube.com/watch?v=E8b5pDvt2AE', 'global', NULL),
  ('u40', 'r4', 'worksheet', 'Corbettmaths — Place Value (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf', 'global', NULL),
  ('u40', 'r5', 'video', 'How to Plot Points on a Coordinate Plane — Positive and Negative Coordinates | Math with Mr. J', 'https://www.youtube.com/watch?v=5NyuamsbLMo', 'global', NULL),
  ('u40', 'r5', 'video', 'Quadrants of the Coordinate Plane — What are the Four Quadrants? | Math with Mr. J', 'https://www.youtube.com/watch?v=uc9hWu73Phw', 'global', NULL),
  ('u40', 'r5', 'worksheet', 'Corbettmaths — Coordinates (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/coordinates-pdf1.pdf', 'global', NULL),
  ('u40', 'y1', 'video', 'How to Calculate a Discount and Sale Price | Math with Mr. J', 'https://www.youtube.com/watch?v=5qxX222sLtE', 'global', NULL),
  ('u40', 'y1', 'video', 'How to Calculate a Discount without a Calculator | Math with Mr. J', 'https://www.youtube.com/watch?v=og9bDI2XJfA', 'global', NULL),
  ('u40', 'y1', 'worksheet', 'Corbettmaths — Percentage of an Amount (Non-Calculator) (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/percentage-of-an-amount-non-calculator-pdf1.pdf', 'global', NULL),
  ('u40', 'y2', 'video', 'Adding and Subtracting Decimals (How to) | Math with Mr. J', 'https://www.youtube.com/watch?v=PnwLv6khwk8', 'global', NULL),
  ('u40', 'y2', 'video', 'How to Add and Subtract Decimals — Step-by-Step Examples | Math with Mr. J', 'https://www.youtube.com/watch?v=Cg-_TeiaSa8', 'global', NULL),
  ('u40', 'y2', 'worksheet', 'Corbettmaths — Ordering Decimals (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/ordering-decimals-pdf.pdf', 'global', NULL),
  ('u40', 'y3', 'video', 'Multi-Step Problems With All Operations (Road Trip Math) | Easy Math with Mrs. Easley', 'https://www.youtube.com/watch?v=z0LbNsZN71w', 'global', NULL),
  ('u40', 'y3', 'worksheet', 'Corbettmaths — Order of Operations (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/order-of-operations-pdf.pdf', 'global', NULL),
  ('u40', 'y3', 'worksheet', 'Corbettmaths — Place Value (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf', 'global', NULL),
  ('u40', 'y4', 'video', 'Multiply a Whole Number by a Decimal | Math with Mr. J', 'https://www.youtube.com/watch?v=tsOibhsgYoQ', 'global', NULL),
  ('u40', 'y4', 'video', 'How to Multiply a Whole Number and a Decimal | Math with Mr. J', 'https://www.youtube.com/watch?v=FbZr5br9ZOg', 'global', NULL),
  ('u40', 'y4', 'worksheet', 'Corbettmaths — Multiplying and Dividing Decimals (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/decimals-multiplying-and-dividing.pdf', 'global', NULL),
  ('u40', 'y5', 'video', 'Order of Operations — A Step-By-Step Guide | PEMDAS | Math with Mr. J', 'https://www.youtube.com/watch?v=x41BCrYh8Kc', 'global', NULL),
  ('u40', 'y5', 'video', 'Order of Operations — Parentheses / Brackets / Braces | PEMDAS | Math with Mr. J', 'https://www.youtube.com/watch?v=u7Lack4Tmx8', 'global', NULL),
  ('u40', 'y5', 'worksheet', 'Corbettmaths — Order of Operations (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/order-of-operations-pdf.pdf', 'global', NULL),
  ('u40', 'g1', 'video', 'How to Add Negative Numbers (Integers) | Math with Mr. J', 'https://www.youtube.com/watch?v=1VFj_coqKQU', 'global', NULL),
  ('u40', 'g1', 'video', 'Subtracting Integers Using a Number Line | Math with Mr. J', 'https://www.youtube.com/watch?v=Dfytkh_lYME', 'global', NULL),
  ('u40', 'g1', 'worksheet', 'Corbettmaths — Negative Numbers (PDF)', 'https://corbettmaths.com/wp-content/uploads/2018/11/Negative-Numbers.pdf', 'global', NULL),
  ('u40', 'g2', 'video', 'Percent Change — A Step-By-Step Guide | Math with Mr. J', 'https://www.youtube.com/watch?v=ZL2ILv98IZU', 'global', NULL),
  ('u40', 'g2', 'video', 'How to Find a Percent of a Number | Math with Mr. J', 'https://www.youtube.com/watch?v=5CAncQ4TZD4', 'global', NULL),
  ('u40', 'g2', 'worksheet', 'Corbettmaths — Percentage Change (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/percentage-change-pdf.pdf', 'global', NULL),
  ('u40', 'g3', 'video', 'Plotting Points on a Coordinate Plane — All 4 Quadrants | Math with Mr. J', 'https://www.youtube.com/watch?v=pl9nSVzRWvA', 'global', NULL),
  ('u40', 'g3', 'video', 'Graphing Linear Equations (using a Table of Values) | Math Help Videos', 'https://www.youtube.com/watch?v=ct1dRi7IcQw', 'global', NULL),
  ('u40', 'g3', 'worksheet', 'Corbettmaths — Drawing Linear Graphs (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/drawing-linear-graphs-pdf.pdf', 'global', NULL);
