-- Phase 6: Infrastructure Hardening
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════
-- 6.1  Add image_url column to shop_items (keep image_data for now)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS image_url text;

-- ═══════════════════════════════════════════════════════════════
-- 6.2  Atomic increment_progress RPC function
--      Replaces the SELECT-then-UPSERT pattern in recordAttempt
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION increment_progress(
  p_student_id uuid,
  p_activity text,
  p_category text,
  p_correct boolean,
  p_time_ms bigint,
  p_is_extension boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO student_progress (student_id, activity, category, correct, total, total_time, is_extension, updated_at)
  VALUES (
    p_student_id,
    p_activity,
    p_category,
    CASE WHEN p_correct THEN 1 ELSE 0 END,
    1,
    COALESCE(p_time_ms, 0),
    p_is_extension,
    now()
  )
  ON CONFLICT (student_id, activity, category)
  DO UPDATE SET
    correct    = student_progress.correct + CASE WHEN p_correct THEN 1 ELSE 0 END,
    total      = student_progress.total + 1,
    total_time = student_progress.total_time + COALESCE(p_time_ms, 0),
    is_extension = p_is_extension,
    updated_at = now();
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION increment_progress TO anon;
GRANT EXECUTE ON FUNCTION increment_progress TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- 6.1  Create storage bucket for shop item images
-- ═══════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-items', 'shop-items', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read shop item images (they're public)
CREATE POLICY "Public read shop-items" ON storage.objects
  FOR SELECT USING (bucket_id = 'shop-items');

-- Allow authenticated users (teachers) to upload shop item images
CREATE POLICY "Teachers upload shop-items" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'shop-items' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Teachers delete shop-items" ON storage.objects
  FOR DELETE USING (bucket_id = 'shop-items' AND auth.role() = 'authenticated');
