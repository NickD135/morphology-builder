-- Add priority column to class_word_lists
-- Values: 'mixed' (default), 'custom_first', 'custom_only'
ALTER TABLE class_word_lists
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'mixed';
