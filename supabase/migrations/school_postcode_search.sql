-- Add postcode column to schools
ALTER TABLE schools ADD COLUMN IF NOT EXISTS postcode text;

-- Enable trigram extension for search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for search performance
CREATE INDEX IF NOT EXISTS schools_name_search_idx ON schools USING gin (lower(name) gin_trgm_ops);

-- RPC function for anon-safe school search.
-- Returns only id, name, postcode — no sensitive fields exposed.
-- Minimum 3-char query enforced server-side.
CREATE OR REPLACE FUNCTION search_schools(query text)
RETURNS TABLE(id uuid, name text, postcode text)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT s.id, s.name, s.postcode
  FROM schools s
  WHERE length(query) >= 3
    AND lower(s.name) LIKE '%' || lower(query) || '%'
  ORDER BY s.name
  LIMIT 10;
$$;

-- Grant anon access to call the RPC
GRANT EXECUTE ON FUNCTION search_schools(text) TO anon;
GRANT EXECUTE ON FUNCTION search_schools(text) TO authenticated;
