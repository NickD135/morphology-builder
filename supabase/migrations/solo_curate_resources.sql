-- Optional resource CURATION for the SOLO tracker (Units 24/25), from the 2026-06-01 review.
-- These are quality improvements, NOT dead-link fixes — run only if you want them.
-- Nothing existing is removed; these ADD better-matched resources alongside what's there.

-- u25_r3 "Interpret integers on a timeline AND draw accurate timelines using a scale".
-- The current student-facing video ("Understanding Integers Using BC and AD") covers the
-- 'integers on a timeline' half but NOT 'draw a timeline with a scale'. Add two videos that do.
-- (Both verified live.)
insert into public.resources (unit_id, outcome_id, type, label, url, scope)
values
  ('u25','r3','video','Timelines for Kids — A Comprehensive Overview','https://www.youtube.com/watch?v=o50HA6QTxj0','global'),
  ('u25','r3','video','How to Draw a Timeline — Proportioning and Scale','https://www.youtube.com/watch?v=UF3yz0K0UjY','global');

-- OPTIONAL: a cleaner upper-primary bias/claims video for u25_y1 (bias) and/or u25_g4 (evaluate claims).
-- Verified live. Uncomment whichever you want.
-- insert into public.resources (unit_id, outcome_id, type, label, url, scope)
-- values ('u25','y1','video','Claims and Sampling — Bias, Valid Claims and Inferences','https://www.youtube.com/watch?v=pPnRcYKbnjk','global');
