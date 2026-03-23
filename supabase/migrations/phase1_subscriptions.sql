-- Phase 1: Teacher accounts, subscription tiers, daily usage, feedback
-- Run this in Supabase SQL editor

-- Teacher accounts and subscription tiers
CREATE TABLE IF NOT EXISTS teacher_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  tier text NOT NULL DEFAULT 'free',
  student_cap integer NOT NULL DEFAULT 5,
  trial_ends_at timestamptz,
  subscription_started_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Link classes to teacher accounts
ALTER TABLE classes ADD COLUMN IF NOT EXISTS teacher_account_id uuid REFERENCES teacher_accounts(id);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS student_count integer DEFAULT 0;

-- Daily usage tracking for free tier limits
CREATE TABLE IF NOT EXISTS daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id),
  usage_date date NOT NULL DEFAULT current_date,
  activity_count integer DEFAULT 0,
  question_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, usage_date)
);

-- Feedback and suggestions
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  role text,
  category text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);
