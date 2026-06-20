-- Unit 36 — resource inserts for the Supabase `resources` table.
-- Generated from units/u36/03_resources_staged.csv (every URL verified live in Stage 3:
-- YouTube videos oEmbed-verified, all worksheets curl-verified HTTP 200).
-- Run in the Supabase SQL editor (anon key cannot write). DO NOT auto-execute.

DELETE FROM resources WHERE unit_id = 'u36';

INSERT INTO resources (unit_id, outcome_id, type, label, url, scope, class_id) VALUES
  ('u36', 'r1', 'video', 'Fractions — Understanding the Language | Math with Mr. J', 'https://www.youtube.com/watch?v=38KfKBpwAv4', 'global', NULL),
  ('u36', 'r1', 'video', 'Fractions — A Mini Review Course | Math with Mr. J', 'https://www.youtube.com/watch?v=9UFyLHY8yPc', 'global', NULL),
  ('u36', 'r1', 'worksheet', 'Corbettmaths — Fractions (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/fractions-pdf.pdf', 'global', NULL),
  ('u36', 'r2', 'video', 'Converting Between Fractions, Decimals, and Percents | Math with Mr. J', 'https://www.youtube.com/watch?v=2vjbNZaFz3c', 'global', NULL),
  ('u36', 'r2', 'video', 'Modeling Equivalent Fractions | Math with Mr. J', 'https://www.youtube.com/watch?v=pIognJLah-I', 'global', NULL),
  ('u36', 'r2', 'worksheet', 'Corbettmaths — Fractions, Decimals, Percentages (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/fractions-decimals-percentages-pdf.pdf', 'global', NULL),
  ('u36', 'r3', 'video', 'How to Find Fractions of Amounts (Step-by-Step) | Maths with Mrs B', 'https://www.youtube.com/watch?v=Md4Oeb_xDUk', 'global', NULL),
  ('u36', 'r3', 'video', 'How to Find a Fraction of a Whole Number | The Organic Chemistry Tutor', 'https://www.youtube.com/watch?v=ZPtxMHtXCM4', 'global', NULL),
  ('u36', 'r3', 'worksheet', 'Corbettmaths — Fractions of Amounts (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/fractions-of-amounts-pdf.pdf', 'global', NULL),
  ('u36', 'r4', 'video', 'Subtracting a Fraction from a Whole Number | Math with Mr. J', 'https://www.youtube.com/watch?v=xCcld_YyVhM', 'global', NULL),
  ('u36', 'r4', 'video', 'Subtracting Fractions with Like Denominators | Math with Mr. J', 'https://www.youtube.com/watch?v=QL4KiVVmreI', 'global', NULL),
  ('u36', 'r4', 'worksheet', 'Corbettmaths — Fractions (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/fractions-pdf.pdf', 'global', NULL),
  ('u36', 'y1', 'video', 'Fractions: Finding the Original | Corbettmaths', 'https://www.youtube.com/watch?v=pdUg0UwXBHk', 'global', NULL),
  ('u36', 'y1', 'video', 'Fractions of Numbers: Finding the Whole | Partners in Prime', 'https://www.youtube.com/watch?v=x0ljSSMfZXw', 'global', NULL),
  ('u36', 'y1', 'worksheet', 'Corbettmaths — Fractions of Amounts (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/fractions-of-amounts-pdf.pdf', 'global', NULL),
  ('u36', 'y2', 'video', 'Comparing Fractions | How to Compare Fractions | Math with Mr. J', 'https://www.youtube.com/watch?v=u_QTuWj107o', 'global', NULL),
  ('u36', 'y2', 'video', 'Modeling Equivalent Fractions | Math with Mr. J', 'https://www.youtube.com/watch?v=pIognJLah-I', 'global', NULL),
  ('u36', 'y2', 'worksheet', 'Corbettmaths — Equivalent Fractions (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/equivalent-fractions-pdf.pdf', 'global', NULL),
  ('u36', 'y3', 'video', 'Ordering Fractions | Math with Mr. J', 'https://www.youtube.com/watch?v=i2PfHDs88YE', 'global', NULL),
  ('u36', 'y3', 'video', 'Comparing Fractions | How to Compare Fractions | Math with Mr. J', 'https://www.youtube.com/watch?v=u_QTuWj107o', 'global', NULL),
  ('u36', 'y3', 'worksheet', 'Corbettmaths — Ordering Fractions (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/ordering-fractions-pdf.pdf', 'global', NULL),
  ('u36', 'y4', 'video', 'Subtracting Fractions with Common Denominators (Step by Step) | Math with Mr. J', 'https://www.youtube.com/watch?v=VTCOHFJOAA8', 'global', NULL),
  ('u36', 'y4', 'video', 'Adding & Subtracting Fractions with Unlike Denominators | Math with Mr. J', 'https://www.youtube.com/watch?v=XsW8HJutIgM', 'global', NULL),
  ('u36', 'y4', 'worksheet', 'Corbettmaths — Adding Fractions: Same Denominators (PDF)', 'https://corbettmaths.com/wp-content/uploads/2018/11/Fractions-Addition-1-pdf.pdf', 'global', NULL),
  ('u36', 'y5', 'video', 'Adding and Subtracting Fractions Word Problems | Math with Mr. J', 'https://www.youtube.com/watch?v=JgQSMwNOWCI', 'global', NULL),
  ('u36', 'y5', 'video', 'Subtracting Fractions — Fraction Word Problems | Math with Mr. J', 'https://www.youtube.com/watch?v=sxu_i1_SMqM', 'global', NULL),
  ('u36', 'y5', 'worksheet', 'Corbettmaths — Fractions (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/fractions-pdf.pdf', 'global', NULL),
  ('u36', 'y6', 'video', 'An Intro to Probability | Basic Probability | Math with Mr. J', 'https://www.youtube.com/watch?v=6IdNYdA6no8', 'global', NULL),
  ('u36', 'y6', 'video', 'An Intro to Finding Probability | Math with Mr. J', 'https://www.youtube.com/watch?v=zE-Y_QCHOt8', 'global', NULL),
  ('u36', 'y6', 'worksheet', 'Corbettmaths — Probability (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/probability-pdf.pdf', 'global', NULL),
  ('u36', 'g1', 'video', 'Adding & Subtracting Fractions with Unlike Denominators | Math with Mr. J', 'https://www.youtube.com/watch?v=XsW8HJutIgM', 'global', NULL),
  ('u36', 'g1', 'video', 'Adding Fractions with Unlike Denominators | Math with Mr. J', 'https://www.youtube.com/watch?v=CoCmsyFQ_Xc', 'global', NULL),
  ('u36', 'g1', 'worksheet', 'Corbettmaths — Adding Fractions (Different Denominators) (PDF)', 'https://corbettmaths.com/wp-content/uploads/2024/01/Adding-Fractions.pdf', 'global', NULL),
  ('u36', 'g2', 'video', 'Multiplying Whole Numbers and Fractions | Math with Mr. J', 'https://www.youtube.com/watch?v=2gFCEY9Hxas', 'global', NULL),
  ('u36', 'g2', 'video', 'How to Multiply a Whole Number by a Fraction | Math with Mr. J', 'https://www.youtube.com/watch?v=Z6liyRWnLv4', 'global', NULL),
  ('u36', 'g2', 'worksheet', 'Corbettmaths — Multiplying Fractions (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/multiplying-fractions-pdf.pdf', 'global', NULL),
  ('u36', 'g3', 'video', 'Calculating Probability (Practice Problems Included) | Math with Mr. J', 'https://www.youtube.com/watch?v=m95FVOfCx44', 'global', NULL),
  ('u36', 'g3', 'video', 'Complementary Events in Probability | Math and Stats Help', 'https://www.youtube.com/watch?v=hJbj7UQIJNw', 'global', NULL),
  ('u36', 'g3', 'worksheet', 'Corbettmaths — Probability (PDF)', 'https://corbettmaths.com/wp-content/uploads/2013/02/probability-pdf.pdf', 'global', NULL);
