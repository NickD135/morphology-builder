-- class_word_lists import
INSERT INTO class_word_lists (id, class_id, name, words, created_at, updated_at, games, priority) VALUES (
  'b217fb06-242f-418e-b69a-93378b331a01', 'b01deec0-ffe9-43e5-94c8-d95863461f70', 'Test', '[{"base":"happy","clue":"the state of being unhappy","word":"unhappiness","prefix":"un","suffix1":"ness","suffix2":"un.happi.ness","phonemes":["u","n","h","a","pp","i","n","e","ss"],"syllables":["u","n","h","a","pp","i","n","e","ss"]},{"base":"dount","clue":"to take responsibility for ones actions","word":"accountability","prefix":"ac","suffix1":"ability","suffix2":"ac.count.a.bil.i.ty","phonemes":["a","cc","ou","n","t","a","b","i","l","i","t","y"],"syllables":["a","cc","ou","n","t","a","b","i","l","i","t","y"]}]'::jsonb,
  '2026-03-24 05:59:20.597269+00', '2026-03-24 05:59:20.597269+00', '["breakdown","syllable","phoneme"]'::jsonb, 'mixed
'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO class_word_lists (id, class_id, name, words, created_at, updated_at, games, priority) VALUES (
  '500cd949-a2b0-411e-9a85-96ef4b1f5202', 'b01deec0-ffe9-43e5-94c8-d95863461f70', 'Test 2', '[{"base":"happy","clue":"feeling sad or not pleased","word":"unhappy","prefix":"un","suffix1":"","suffix2":"","phonemes":["u","n","h","a","pp","y"],"syllables":["un","hap","py"]},{"base":"continue","clue":"kept going without stopping","word":"continued","prefix":"","suffix1":"ed","suffix2":"","phonemes":["c","o","n","t","i","n","u","ed"],"syllables":["con","tin","ued"]},{"base":"friend","clue":"a close bond between two friends","word":"friendship","prefix":"","suffix1":"ship","suffix2":"","phonemes":["fr","ie","n","d","sh","i","p"],"syllables":["friend","ship"]},{"base":"partner","clue":"working closely together with someone","word":"partnership","prefix":"","suffix1":"ship","suffix2":"","phonemes":["p","ar","t","n","er","sh","i","p"],"syllables":["part","ner","ship"]},{"base":"delight","clue":"in a way that brings great joy","word":"delightfully","prefix":"","suffix1":"ful","suffix2":"ly","phonemes":["d","e","l","igh","t","f","u","ll","y"],"syllables":["de","light","ful","ly"]},{"base":"peace","clue":"in a calm and quiet way","word":"peacefully","prefix":"","suffix1":"ful","suffix2":"ly","phonemes":["p","ea","ce","f","u","ll","y"],"syllables":["peace","ful","ly"]}]'::jsonb,
  '2026-03-24 06:44:46.034506+00', '2026-03-24 06:44:46.034506+00', '["breakdown","syllable","phoneme"]'::jsonb, 'mixed'
) ON CONFLICT (id) DO NOTHING;

-- word_list_assignments
INSERT INTO word_list_assignments (id, word_list_id, student_id, assigned_at) VALUES
  ('3c6a50a5-9e76-4f3f-8f04-bea58e1e3096', 'b217fb06-242f-418e-b69a-93378b331a01', 'd28cb3b6-07b3-40eb-8610-3eb61bdb03cb', '2026-03-24 06:00:55.412534+00')
ON CONFLICT (id) DO NOTHING;
