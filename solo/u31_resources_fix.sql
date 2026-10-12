-- Unit 31: student-facing Grow resource fixes (SOLO `resources` table, scope = 'global').
-- Written by the improvement agent on 2026-10-12. REVIEW, THEN RUN BY HAND in the Supabase SQL editor.
--
-- This is a targeted change: it only deletes the specific rows named below (matched on unit,
-- outcome and URL) and inserts the replacements. Every other u31 row stays as it is, so it is safe
-- even if the live table has drifted from units/u31/04_insert.sql.
--
-- Why each change (full detail in the PR):
--   r1  replace a second "standard form" video with one on standard AND non-standard partitioning
--   r2  remove the Corbettmaths whole-number place value PDF (one decimal question; nothing on thousandths)
--   r4  replace a repeat long-division video with one on interpreting remainders in word problems
--   y1  add Maths is Fun Percentages (percent = out of 100, percent to fraction and decimal); moved from y2
--   y2  replace a general "percent of a number" video and the general Maths is Fun page with a video on using 10%
--   y3  remove two rule-finding videos that are y4's topic (they stay in y4)
--   y5  remove the place value PDF and the general decimals page (neither covers × ÷ by 10, 100, 1000);
--       add a Twinkl video on multiplying and dividing decimals by 10, 100 and 1000
--   y6  replace an input/output table video (y4's topic) with a missing-number video
--   g1  add a video on one quantity as a percentage of another (named in the outcome, not covered)
--   g2  replace two US "PEMDAS" videos (exponents, "parentheses") with a Corbettmaths primary video;
--       relabel the worksheet to say which questions to skip (some use powers)
--   g3  relabel the equations worksheet to say which questions match the outcome
--
-- Every new YouTube link was checked live with YouTube oEmbed on 2026-10-12 (exact title and channel below).
-- Worksheets and websites were opened and their content checked the same day.

BEGIN;

-- ── Removals ────────────────────────────────────────────────────────────────
DELETE FROM resources WHERE unit_id='u31' AND scope='global' AND outcome_id='r1' AND url='https://www.youtube.com/watch?v=H6ndRKigay8';
DELETE FROM resources WHERE unit_id='u31' AND scope='global' AND outcome_id='r2' AND url='https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf';
DELETE FROM resources WHERE unit_id='u31' AND scope='global' AND outcome_id='r4' AND url='https://www.youtube.com/watch?v=HJYHNxS64f0';
DELETE FROM resources WHERE unit_id='u31' AND scope='global' AND outcome_id='y2' AND url IN ('https://www.youtube.com/watch?v=5CAncQ4TZD4','https://www.mathsisfun.com/percentage.html');
DELETE FROM resources WHERE unit_id='u31' AND scope='global' AND outcome_id='y3' AND url IN ('https://www.youtube.com/watch?v=d1COIcRoSgo','https://www.youtube.com/watch?v=Z7UPvsKz4Kw');
DELETE FROM resources WHERE unit_id='u31' AND scope='global' AND outcome_id='y5' AND url IN ('https://corbettmaths.com/wp-content/uploads/2013/02/place-value-pdf.pdf','https://www.mathsisfun.com/decimals.html');
DELETE FROM resources WHERE unit_id='u31' AND scope='global' AND outcome_id='y6' AND url='https://www.youtube.com/watch?v=Z7UPvsKz4Kw';
DELETE FROM resources WHERE unit_id='u31' AND scope='global' AND outcome_id='g2' AND url IN ('https://www.youtube.com/watch?v=x41BCrYh8Kc','https://www.youtube.com/watch?v=dzwDTEej8MU');

-- ── Relabels (same URL, clearer instructions) ───────────────────────────────
UPDATE resources SET label='Corbettmaths — Order of Operations (PDF; skip questions with powers like 3²)'
  WHERE unit_id='u31' AND scope='global' AND outcome_id='g2' AND url='https://corbettmaths.com/wp-content/uploads/2013/02/order-of-operations-pdf.pdf';
UPDATE resources SET label='Corbettmaths — Equations (PDF; questions 1–14 are one- and two-step)'
  WHERE unit_id='u31' AND scope='global' AND outcome_id='g3' AND url='https://corbettmaths.com/wp-content/uploads/2013/02/equations-pdf.pdf';
UPDATE resources SET label='Corbettmaths — Percentage of an Amount (PDF; start with the 10% questions)'
  WHERE unit_id='u31' AND scope='global' AND outcome_id='y2' AND url='https://corbettmaths.com/wp-content/uploads/2018/11/Percentages-of-amounts-234-pdf.pdf';

-- ── Additions ───────────────────────────────────────────────────────────────
INSERT INTO resources (id, unit_id, outcome_id, type, label, url, scope, class_id, question) VALUES
-- oEmbed: "Partitioning Numbers: Standard and Non-Standard Forms" / Learn and Play Online!
(gen_random_uuid(),'u31','r1','video','Partitioning Numbers in Standard and Non-Standard Forms | Learn and Play Online!','https://www.youtube.com/watch?v=vZcR6VY9pDg','global',NULL,NULL),
-- oEmbed: "Interpreting Remainders in Division Word Problems" / LaFountaine of Knowledge
(gen_random_uuid(),'u31','r4','video','Interpreting Remainders in Division Word Problems | LaFountaine of Knowledge','https://www.youtube.com/watch?v=0dPQEKjTFjg','global',NULL,NULL),
-- Page checked: percent as "per 100", converting percents to decimals and fractions
(gen_random_uuid(),'u31','y1','website','Maths is Fun — Percentages (out of 100, as fractions and decimals)','https://www.mathsisfun.com/percentage.html','global',NULL,NULL),
-- oEmbed: "Using 10% to Work Out Percentages Explained Clearly" / Maths with Mrs B.
(gen_random_uuid(),'u31','y2','video','Using 10% to Work Out Percentages | Maths with Mrs B','https://www.youtube.com/watch?v=EM8X3SzReTs','global',NULL,NULL),
-- oEmbed: "How Do You Multiply and Divide Decimals by 10, 100 and 1000? | KS2 Maths Concept for Kids" / Twinkl Educational Publishing
(gen_random_uuid(),'u31','y5','video','Multiplying and Dividing Decimals by 10, 100 and 1000 | Twinkl','https://www.youtube.com/watch?v=TIlAg3Aa5rA','global',NULL,NULL),
-- oEmbed: "Solve 'Find the Missing Number' Problems | Maths Junction" / Mrs. Briggs' Maths Junction
(gen_random_uuid(),'u31','y6','video','Solving Find the Missing Number Problems | Maths Junction','https://www.youtube.com/watch?v=rdzDsbKXA3Q','global',NULL,NULL),
-- oEmbed: "Finding What Percent One Number is of Another | Math with Mr. J" / Math with Mr. J
(gen_random_uuid(),'u31','g1','video','Finding What Percent One Number Is of Another | Math with Mr. J','https://www.youtube.com/watch?v=Y3g3mourmwQ','global',NULL,NULL),
-- oEmbed: "Order of Operations - Primary" / corbettmaths
(gen_random_uuid(),'u31','g2','video','Order of Operations (Primary) | Corbettmaths','https://www.youtube.com/watch?v=IKQgvJda7TE','global',NULL,NULL);

COMMIT;

-- Sanity check after running:
-- SELECT outcome_id, type, label, url FROM resources WHERE unit_id='u31' AND scope='global' ORDER BY outcome_id, type;
