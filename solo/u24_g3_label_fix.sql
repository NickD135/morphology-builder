-- Unit 24 (Fractions) — fix one mislabeled g3 resource.
-- The video NJ31kZey01I is titled "Converting Decimals to Percents" (Math with Mr J)
-- but was labelled "Comparing Fractions, Decimals and Percents". Converting between
-- forms is a legitimate g3 sub-skill (you convert before you compare), and g3 already
-- has true comparison resources (the "Comparing and Ordering Fractions" video, the
-- Math is Fun page, and the Decention matching game) — so relabel to the accurate title.
-- Run in the Supabase SQL editor (the anon key cannot write to the resources table).

BEGIN;
UPDATE resources
SET label = 'Converting Decimals to Percentages — Math with Mr J'
WHERE unit_id = 'u24'
  AND outcome_id = 'g3'
  AND scope = 'global'
  AND url = 'https://www.youtube.com/watch?v=NJ31kZey01I';
COMMIT;

-- Sanity: SELECT outcome_id,type,label,url FROM resources
--   WHERE unit_id='u24' AND outcome_id='g3' AND scope='global' ORDER BY type,label;
