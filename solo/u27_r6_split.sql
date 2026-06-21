-- ============================================================================
-- Unit 27 — split R1 (area model) and new R6 (standard algorithm) resources.
-- Run in the Supabase SQL editor AFTER u27_resources_fix.sql.
-- R1 now = area model only; R6 = the standard written algorithm.
-- The standard-algorithm video moves out of R1 into R6.
-- All videos verified live and PDFs 200 on 2026-06-21.
-- ============================================================================

BEGIN;

DELETE FROM resources WHERE unit_id = 'u27' AND scope = 'global' AND outcome_id IN ('r1','r6');

INSERT INTO resources (id, unit_id, outcome_id, type, label, url, scope, class_id, question) VALUES
-- R1 — Area model only -----------------------------------------------------
(gen_random_uuid(),'u27','r1','video','Area Model (Box Method): 2-Digit × 2-Digit Multiplication | Math with Mr. J','https://www.youtube.com/watch?v=n3q3XzzIGSY','global',NULL,NULL),
(gen_random_uuid(),'u27','r1','video','Area Model (Box Method): 3-Digit × 2-Digit Multiplication | Math with Mr. J','https://www.youtube.com/watch?v=zfYG9lzMmUo','global',NULL,NULL),
(gen_random_uuid(),'u27','r1','worksheet','Corbettmaths — Multiplication 1 (PDF)','https://corbettmaths.com/wp-content/uploads/2018/01/multiplication-1-pdf.pdf','global',NULL,NULL),
-- R6 — Standard written algorithm ------------------------------------------
(gen_random_uuid(),'u27','r6','video','Standard Algorithm: 3-Digit × 1-Digit Multiplication | Math with Mr. J','https://www.youtube.com/watch?v=od-tHGrudcA','global',NULL,NULL),
(gen_random_uuid(),'u27','r6','video','Standard Algorithm: 2-Digit × 2-Digit (Long Multiplication) | Math with Mr. J','https://www.youtube.com/watch?v=PZjIT9CH6bM','global',NULL,NULL),
(gen_random_uuid(),'u27','r6','worksheet','Corbettmaths — Multiplication 2 (PDF)','https://corbettmaths.com/wp-content/uploads/2018/01/multiplication-2-pdf.pdf','global',NULL,NULL);

COMMIT;

-- Sanity check (optional): should return 6 rows (3 for r1, 3 for r6).
-- SELECT outcome_id, type, label FROM resources WHERE unit_id='u27' AND outcome_id IN ('r1','r6') ORDER BY outcome_id, type;
