-- Unit 26 (Representing Numbers & Decimals) — remove one dead y3 video.
-- The video 1W3LHcHRhd4 ("Negative Numbers Video Lessons for Year 5") now returns
-- 403 (removed/made private). y3 still keeps two on-topic videos ("Negative Numbers
-- in Real Life — Temperature and Elevation" and "Year 6: Use Negative Numbers in
-- Context") plus two Corbettmaths worksheets, so the outcome stays well-resourced.
-- Run in the Supabase SQL editor (the anon key cannot write to the resources table).

BEGIN;
DELETE FROM resources
WHERE unit_id = 'u26'
  AND outcome_id = 'y3'
  AND scope = 'global'
  AND url = 'https://www.youtube.com/watch?v=1W3LHcHRhd4';
COMMIT;

-- Sanity: SELECT outcome_id,type,label,url FROM resources
--   WHERE unit_id='u26' AND outcome_id='y3' AND scope='global' ORDER BY type,label;
