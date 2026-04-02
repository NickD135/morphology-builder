-- Atomic class deletion via Postgres transaction
-- Replaces the 4 sequential client-side DELETEs with a single atomic operation.
-- Also adds missing CASCADE on daily_usage.student_id.

-- Fix missing CASCADE on daily_usage
ALTER TABLE daily_usage DROP CONSTRAINT IF EXISTS daily_usage_student_id_fkey;
ALTER TABLE daily_usage ADD CONSTRAINT daily_usage_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION delete_class(p_class_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_ids uuid[];
BEGIN
  -- Collect student IDs for this class
  SELECT array_agg(id) INTO v_student_ids
  FROM students WHERE class_id = p_class_id;

  -- Delete student-related data (if there are students)
  IF v_student_ids IS NOT NULL AND array_length(v_student_ids, 1) > 0 THEN
    DELETE FROM student_progress WHERE student_id = ANY(v_student_ids);
    DELETE FROM student_character WHERE student_id = ANY(v_student_ids);
    DELETE FROM students WHERE class_id = p_class_id;
  END IF;

  -- Delete the class (cascades to class_word_lists, class_spelling_sets, etc.)
  DELETE FROM classes WHERE id = p_class_id;
END;
$$;

-- Grant to authenticated role only (teachers delete classes)
GRANT EXECUTE ON FUNCTION delete_class(uuid) TO authenticated;
