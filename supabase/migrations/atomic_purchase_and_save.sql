-- Migration: atomic_purchase and save_scientist_field RPC functions
-- Fixes race conditions in purchase() and saveScientist() by doing atomic updates

-- ============================================================
-- 1. atomic_purchase(p_student_id, p_item_key, p_cost)
-- ============================================================
-- Atomically deducts quarks and appends item to scientist->'owned'.
-- Returns JSON: { success: bool, quarks: int, reason?: string }

CREATE OR REPLACE FUNCTION atomic_purchase(
  p_student_id uuid,
  p_item_key text,
  p_cost int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row student_character%ROWTYPE;
  v_owned jsonb;
  v_new_quarks int;
BEGIN
  -- Lock the row for update to prevent concurrent modifications
  SELECT * INTO v_row
    FROM student_character
    WHERE student_id = p_student_id
    FOR UPDATE;

  -- If no row exists, the student has no character yet (0 quarks)
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Not enough quarks', 'quarks', 0);
  END IF;

  -- Check if already owned
  v_owned := COALESCE(v_row.scientist->'owned', '[]'::jsonb);
  IF v_owned @> to_jsonb(p_item_key) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Already owned', 'quarks', v_row.quarks);
  END IF;

  -- Check sufficient quarks
  IF v_row.quarks < p_cost THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Not enough quarks', 'quarks', v_row.quarks);
  END IF;

  -- Atomic update: deduct quarks and append item to owned array
  v_new_quarks := v_row.quarks - p_cost;
  UPDATE student_character
    SET quarks = v_new_quarks,
        scientist = jsonb_set(
          COALESCE(scientist, '{}'::jsonb),
          '{owned}',
          COALESCE(scientist->'owned', '[]'::jsonb) || to_jsonb(p_item_key)
        )
    WHERE student_id = p_student_id;

  RETURN jsonb_build_object('success', true, 'quarks', v_new_quarks);
END;
$$;

-- ============================================================
-- 2. save_scientist_field(p_student_id, p_field, p_value)
-- ============================================================
-- Atomically sets a single field within the scientist JSONB column.
-- Creates the row with defaults if it doesn't exist.
-- Returns JSON: { success: bool }

CREATE OR REPLACE FUNCTION save_scientist_field(
  p_student_id uuid,
  p_field text,
  p_value jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_default_scientist jsonb := jsonb_build_object(
    'skinTone', '#FDBCB4',
    'coatColor', '#ffffff',
    'coatPattern', 'plain',
    'head', null,
    'face', null,
    'pet', null,
    'background', 'lab',
    'effect', null,
    'owned', '[]'::jsonb,
    'customSlots', '{}'::jsonb,
    'displayBadges', '[]'::jsonb,
    'dances', '{}'::jsonb
  );
  v_exists boolean;
BEGIN
  -- Check if row exists
  SELECT EXISTS(
    SELECT 1 FROM student_character WHERE student_id = p_student_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Update just the one field within the scientist JSONB
    UPDATE student_character
      SET scientist = jsonb_set(
            COALESCE(scientist, v_default_scientist),
            ARRAY[p_field],
            p_value
          )
      WHERE student_id = p_student_id;
  ELSE
    -- Insert new row with defaults + the requested field set
    INSERT INTO student_character (student_id, quarks, xp, badges, scientist, stats)
      VALUES (
        p_student_id,
        0,
        0,
        '[]'::jsonb,
        jsonb_set(v_default_scientist, ARRAY[p_field], p_value),
        jsonb_build_object(
          'totalCorrect', 0,
          'totalAnswered', 0,
          'sessions', 0,
          'activitiesPlayed', '[]'::jsonb,
          'bestStreak', 0
        )
      );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
