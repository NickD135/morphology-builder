-- Add invite_code column to schools for multi-teacher (job-share) support
ALTER TABLE schools ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

-- Generate invite codes for existing schools that don't have one
-- Uses 8-char uppercase alphanumeric (no ambiguous chars I/O/0/1)
UPDATE schools SET invite_code = upper(substr(replace(replace(replace(replace(
  encode(gen_random_bytes(6), 'base64'),
  '/', ''), '+', ''), 'O', 'X'), '0', 'Y'), 1, 8))
WHERE invite_code IS NULL;
