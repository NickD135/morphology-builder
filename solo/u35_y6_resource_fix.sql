-- ============================================================================
-- Unit 35 (Add & Subtract Strategies, Decimals & Percentages) — fix broken y6 row.
-- Run in the Supabase SQL editor (project kdpavfrzmmzknqfpodrl).
--
-- The y6 "Multi-Step Word Problem" video row was corrupted on insert (a source
-- string was split on a comma, scattering the title across label/url): its
-- label is "Multi-Step Word Problem (Addition" and its url is literally
-- " Subtraction" — not a valid URL, so it fails to load for students.
-- This deletes that one broken row and inserts a verified live replacement
-- (YouTube oEmbed confirmed live, topic-matched, 2026-06-22). The other two
-- u35 y6 resources are fine and untouched.
-- ============================================================================

BEGIN;

DELETE FROM resources WHERE id = '0b1b7662-01b8-4d96-937c-58c0a18ec2c5';

INSERT INTO resources (id, unit_id, outcome_id, type, label, url, scope, class_id, question) VALUES
(gen_random_uuid(),'u35','y6','video','Multi-Step Word Problems | Growing Learners','https://www.youtube.com/watch?v=xnXlu4LJJcI','global',NULL,NULL);

COMMIT;

-- Sanity check (optional): should return 3 rows, all with valid YouTube/PDF URLs.
-- SELECT type, label, url FROM resources WHERE unit_id='u35' AND outcome_id='y6' AND scope='global' ORDER BY type;
