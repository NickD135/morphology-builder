-- Add EALD (English as an Additional Language or Dialect) support
-- eald_language is null when EALD is not enabled, ISO 639-1 code when enabled (e.g. 'bo' for Tibetan)

ALTER TABLE students ADD COLUMN IF NOT EXISTS eald_language text DEFAULT NULL;

-- Cache table for translations to avoid repeated API calls
CREATE TABLE IF NOT EXISTS translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text text NOT NULL,
  target_language text NOT NULL,
  translation text NOT NULL,
  context text,  -- e.g. 'morpheme_meaning', 'word', 'definition'
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_text, target_language, context)
);

-- RLS for translations - readable by anyone, writable by service role only
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Translations are readable by everyone"
  ON translations FOR SELECT
  USING (true);
