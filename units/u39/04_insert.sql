-- Unit 39 — resource inserts for the Supabase `resources` table.
-- Generated from units/u39/03_resources_staged.csv (every URL verified live in Stage 3).
-- NOTE: Unit 39 ships CODE-CANONICAL (hardcoded RESOURCES in solo/index.html) because the SQL
-- was not inserted this session. These rows are IDENTICAL to the code block; running them is
-- OPTIONAL (DB rows would override the identical hardcoded ones). DO NOT auto-execute.

DELETE FROM resources WHERE unit_id = 'u39';

INSERT INTO resources (unit_id, outcome_id, type, label, url, scope, class_id) VALUES
  ('u39', 'r1', 'video', 'Types of Angles — Acute / Obtuse / Right / Straight / Reflex | Math with Mr. J', 'https://www.youtube.com/watch?v=UsE1hu-q0Cs', 'global', NULL),
  ('u39', 'r1', 'video', 'How to Use a Protractor to Measure an Angle | Math with Mr. J', 'https://www.youtube.com/watch?v=N8TGOMH5Y50', 'global', NULL),
  ('u39', 'r1', 'worksheet', 'Corbettmaths — Types of Angles (PDF)', 'https://corbettmaths.com/wp-content/uploads/2018/09/Types-of-Angle-pdf.pdf', 'global', NULL),
  ('u39', 'r2', 'video', 'How to Measure Angles Using a Protractor | Math with Mr. J', 'https://www.youtube.com/watch?v=j5D7acsExxw', 'global', NULL),
  ('u39', 'r2', 'video', 'How to Use a Protractor — Measuring and Drawing Angles | Math with Mr. J', 'https://www.youtube.com/watch?v=2on99N5jBJ4', 'global', NULL),
  ('u39', 'r2', 'worksheet', 'Corbettmaths — Measuring Angles (PDF)', 'https://corbettmaths.com/wp-content/uploads/2018/02/measuring-angles.pdf', 'global', NULL),
  ('u39', 'r3', 'video', 'How to Draw Angles with a Protractor | Math with Mr. J', 'https://www.youtube.com/watch?v=zh-tj7oTQlc', 'global', NULL),
  ('u39', 'r3', 'video', 'Drawing an Angle with a Protractor — 60° | Math with Mr. J', 'https://www.youtube.com/watch?v=qYfH4NN0b-4', 'global', NULL),
  ('u39', 'r3', 'worksheet', 'Corbettmaths — Constructing / Drawing Angles (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/constructing-angles-pdf.pdf', 'global', NULL),
  ('u39', 'r4', 'video', 'Angles at a Point | Corbettmaths', 'https://www.youtube.com/watch?v=mdAwUsf0k1s', 'global', NULL),
  ('u39', 'r4', 'video', 'Angles in a Straight Line | Corbettmaths', 'https://www.youtube.com/watch?v=q5tV5V56Hr0', 'global', NULL),
  ('u39', 'r4', 'worksheet', 'Corbettmaths — Angle Facts (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/angle-facts-pdf1.pdf', 'global', NULL),
  ('u39', 'y1', 'video', 'Angles on a Straight Line and About a Point | Mr Mathematics', 'https://www.youtube.com/watch?v=juix_jB1pss', 'global', NULL),
  ('u39', 'y1', 'video', 'Finding the Missing Angle of a Triangle | Math with Mr. J', 'https://www.youtube.com/watch?v=LAlQnW6-6c4', 'global', NULL),
  ('u39', 'y1', 'worksheet', 'Corbettmaths — Missing Angles (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/missing-angles-pdf1.pdf', 'global', NULL),
  ('u39', 'y2', 'video', 'Transformations — Translations / Reflections / Rotations | Math Defined', 'https://www.youtube.com/watch?v=YD3HIMUae_4', 'global', NULL),
  ('u39', 'y2', 'video', '3 Types of Transformations — Translations Reflections & Rotations | Turtlediary', 'https://www.youtube.com/watch?v=VJTxv-tRKj0', 'global', NULL),
  ('u39', 'y2', 'worksheet', 'Corbettmaths — Reflections (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/reflections-pdf.pdf', 'global', NULL),
  ('u39', 'y3', 'video', 'Compose and Decompose 2D Shapes | Underwater Math', 'https://www.youtube.com/watch?v=KbDXgDeFoG4', 'global', NULL),
  ('u39', 'y3', 'video', '3 Types of Transformations — Translations Reflections & Rotations | Turtlediary', 'https://www.youtube.com/watch?v=VJTxv-tRKj0', 'global', NULL),
  ('u39', 'y3', 'worksheet', 'Corbettmaths — Rotations (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/rotations-pdf.pdf', 'global', NULL),
  ('u39', 'y4', 'video', 'Elapsed Time — T-Chart Strategy | Sally Osborne', 'https://www.youtube.com/watch?v=4Eucvb7qFpk', 'global', NULL),
  ('u39', 'y4', 'worksheet', 'Corbettmaths — Time Calculations (PDF)', 'https://corbettmaths.com/wp-content/uploads/2019/10/Time-Calculations-pdf.pdf', 'global', NULL),
  ('u39', 'y4', 'worksheet', 'Corbettmaths Primary — Time (PDF)', 'https://corbettmathsprimary.com/wp-content/uploads/2018/07/time-pdf.pdf', 'global', NULL),
  ('u39', 'y5', 'video', 'Converting Fractions and Decimals to Hours and Minutes | FountainMath', 'https://www.youtube.com/watch?v=r6Z48Iv1HCI', 'global', NULL),
  ('u39', 'y5', 'video', 'How To Convert Decimal Time To Hours And Minutes | OnTheClock', 'https://www.youtube.com/watch?v=IPaPdf9ck8M', 'global', NULL),
  ('u39', 'y5', 'worksheet', 'Corbettmaths — Time Calculations (PDF)', 'https://corbettmaths.com/wp-content/uploads/2019/10/Time-Calculations-pdf.pdf', 'global', NULL),
  ('u39', 'y6', 'video', 'The 24-Hour Clock | Mathematics Grade 5 | Periwinkle', 'https://www.youtube.com/watch?v=Lj4YxVZWLVU', 'global', NULL),
  ('u39', 'y6', 'video', 'Understanding the 24-Hour Clock | Smartli', 'https://www.youtube.com/watch?v=dQ5vIHA4L5s', 'global', NULL),
  ('u39', 'y6', 'worksheet', 'Corbettmaths — Timetables and Time (PDF)', 'https://corbettmaths.com/wp-content/uploads/2025/03/Timetables-and-Time-Practice-Questions.pdf', 'global', NULL),
  ('u39', 'g1', 'video', 'Complementary Angles & Supplementary Angles | Math with Mr. J', 'https://www.youtube.com/watch?v=Qpq_XEeBBZw', 'global', NULL),
  ('u39', 'g1', 'video', 'Complementary and Supplementary Angles — How to Find Missing Angles | Math with Mr. J', 'https://www.youtube.com/watch?v=E_ulN2FjJac', 'global', NULL),
  ('u39', 'g1', 'worksheet', 'Corbettmaths — Angle Facts (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/angle-facts-pdf1.pdf', 'global', NULL),
  ('u39', 'g2', 'video', 'Angles in Parallel Lines | Corbettmaths', 'https://www.youtube.com/watch?v=5NfXvBdwKJE', 'global', NULL),
  ('u39', 'g2', 'video', 'Parallel Lines — Angle Examples | Corbettmaths', 'https://www.youtube.com/watch?v=ARsZDZlPDhM', 'global', NULL),
  ('u39', 'g2', 'worksheet', 'Corbettmaths — Angles in Parallel Lines (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/angles-in-parallel-lines-pdf1.pdf', 'global', NULL),
  ('u39', 'g3', 'video', 'What are Complementary Angles? — Find Missing Angles | Math with Mr. J', 'https://www.youtube.com/watch?v=odR4R_BPiH0', 'global', NULL),
  ('u39', 'g3', 'video', 'What are Supplementary Angles? — Find Missing Angles | Math with Mr. J', 'https://www.youtube.com/watch?v=rkGQ7O2i4-U', 'global', NULL),
  ('u39', 'g3', 'worksheet', 'Corbettmaths — Missing Angles (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/missing-angles-pdf1.pdf', 'global', NULL);
