-- Migration: gift_owned_item RPC
-- Atomically appends an item key to scientist->'owned' without touching any other fields.
-- Used by the teacher dashboard reward function so gifting an item never overwrites
-- the student's equipped costume slots, skin tone, or other scientist settings.

CREATE OR REPLACE FUNCTION gift_owned_item(
  p_student_id uuid,
  p_item_key   text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists boolean;
  v_owned  jsonb;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM student_character WHERE student_id = p_student_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Only append if not already owned
    SELECT scientist->'owned' INTO v_owned
      FROM student_character WHERE student_id = p_student_id;
    v_owned := COALESCE(v_owned, '[]'::jsonb);
    IF NOT (v_owned @> to_jsonb(p_item_key)) THEN
      UPDATE student_character
        SET scientist = jsonb_set(
              COALESCE(scientist, '{}'::jsonb),
              '{owned}',
              v_owned || to_jsonb(p_item_key)
            )
        WHERE student_id = p_student_id;
    END IF;
  ELSE
    -- No character row yet — create one with just this item in owned
    INSERT INTO student_character (student_id, quarks, xp, badges, scientist, stats)
      VALUES (
        p_student_id, 0, 0, '[]'::jsonb,
        jsonb_build_object(
          'skinTone', '#FDBCB4', 'coatColor', '#ffffff', 'coatPattern', 'plain',
          'head', null, 'face', null, 'pet', null, 'background', 'lab',
          'effect', null, 'owned', jsonb_build_array(p_item_key),
          'customSlots', '{}'::jsonb, 'displayBadges', '[]'::jsonb, 'dances', '{}'::jsonb
        ),
        jsonb_build_object(
          'totalCorrect', 0, 'totalAnswered', 0, 'sessions', 0,
          'activitiesPlayed', '[]'::jsonb, 'bestStreak', 0
        )
      );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
