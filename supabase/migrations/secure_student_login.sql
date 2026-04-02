-- Secure student login: verify student code server-side
-- Replaces client-side SELECT of student_code which exposed all codes via anon key
--
-- Returns JSON: { success, student_id, name, class_id, extension_mode, support_mode }
-- or { success: false, reason: 'invalid_class' | 'invalid_credentials' }
--
-- SECURITY DEFINER runs as the function owner (postgres), bypassing RLS,
-- so anon callers can verify a code without being able to read the student_code column.

CREATE OR REPLACE FUNCTION verify_student_login(
  p_class_id uuid,
  p_student_id uuid,
  p_student_code text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student record;
BEGIN
  -- Verify the student exists in the given class and the code matches
  SELECT id, name, class_id, extension_mode, support_mode, eald_language
  INTO v_student
  FROM students
  WHERE id = p_student_id
    AND class_id = p_class_id
    AND UPPER(student_code) = UPPER(p_student_code);

  IF v_student IS NULL THEN
    RETURN json_build_object('success', false, 'reason', 'invalid_credentials');
  END IF;

  RETURN json_build_object(
    'success', true,
    'student_id', v_student.id,
    'name', v_student.name,
    'class_id', v_student.class_id,
    'extension_mode', COALESCE(v_student.extension_mode, false),
    'support_mode', COALESCE(v_student.support_mode, false),
    'eald_language', v_student.eald_language
  );
END;
$$;

-- Grant anon and authenticated roles permission to call this function
GRANT EXECUTE ON FUNCTION verify_student_login(uuid, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION verify_student_login(uuid, uuid, text) TO authenticated;
