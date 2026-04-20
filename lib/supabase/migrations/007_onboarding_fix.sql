-- ============================================================
-- MasteX — Onboarding Save Fix
-- Migration 007
--
-- Ensures all columns required by saveOnboarding() exist and
-- that the RLS policies that allow students to write their own
-- onboarding_profiles row are in place.
--
-- Safe to run multiple times (all statements are idempotent).
-- RUN IN SUPABASE SQL EDITOR before testing onboarding.
-- ============================================================

-- ── 1. onboarding_profiles — ensure all columns exist ────────

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS confidence_core_math           INTEGER
    CHECK (confidence_core_math BETWEEN 1 AND 4);

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS confidence_english             INTEGER
    CHECK (confidence_english BETWEEN 1 AND 4);

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS confidence_integrated_science  INTEGER
    CHECK (confidence_integrated_science BETWEEN 1 AND 4);

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS confidence_social_studies      INTEGER
    CHECK (confidence_social_studies BETWEEN 1 AND 4);

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS diagnostic_core_math           INTEGER
    CHECK (diagnostic_core_math BETWEEN 0 AND 100);

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS diagnostic_english             INTEGER
    CHECK (diagnostic_english BETWEEN 0 AND 100);

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS diagnostic_integrated_science  INTEGER
    CHECK (diagnostic_integrated_science BETWEEN 0 AND 100);

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS diagnostic_social_studies      INTEGER
    CHECK (diagnostic_social_studies BETWEEN 0 AND 100);

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS prefers_examples_first         BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS focus_duration_minutes         INTEGER NOT NULL DEFAULT 20
    CHECK (focus_duration_minutes IN (10, 20, 30));

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS preferred_study_time           TEXT
    CHECK (preferred_study_time IN ('morning', 'afternoon', 'evening'));

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS main_goal                      TEXT
    CHECK (main_goal IN ('pass_waec', 'excellent_grades', 'improve_specific'));

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS study_days_per_week            INTEGER NOT NULL DEFAULT 5
    CHECK (study_days_per_week BETWEEN 1 AND 7);

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS daily_goal_level               TEXT NOT NULL DEFAULT 'standard'
    CHECK (daily_goal_level IN ('light', 'standard', 'intense'));

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS weak_subjects                  TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS strong_subjects                TEXT[] NOT NULL DEFAULT '{}';


-- ── 2. students — ensure all columns used in saveOnboarding exist ─

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS daily_goal_xp        INTEGER NOT NULL DEFAULT 50;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS focus_subject         TEXT;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS learning_pace         TEXT NOT NULL DEFAULT 'medium'
    CHECK (learning_pace IN ('slow', 'medium', 'fast'));


-- ── 3. RLS policies for onboarding_profiles ──────────────────
-- Drop and recreate so this migration is safe to re-run.

DROP POLICY IF EXISTS "onboarding_insert_own"  ON onboarding_profiles;
DROP POLICY IF EXISTS "onboarding_select_own"  ON onboarding_profiles;
DROP POLICY IF EXISTS "onboarding_update_own"  ON onboarding_profiles;

-- Students can SELECT their own row
CREATE POLICY "onboarding_select_own"
  ON onboarding_profiles FOR SELECT
  USING (auth.uid() = student_id);

-- Students can INSERT their own row (first-time onboarding)
CREATE POLICY "onboarding_insert_own"
  ON onboarding_profiles FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can UPDATE their own row (re-running onboarding)
CREATE POLICY "onboarding_update_own"
  ON onboarding_profiles FOR UPDATE
  USING (auth.uid() = student_id);


-- ── 4. RLS policy for students UPDATE (in case it is missing) ─

DROP POLICY IF EXISTS "students_update_own" ON students;

CREATE POLICY "students_update_own"
  ON students FOR UPDATE
  USING (auth.uid() = id);


-- ── 5. RLS policy for daily_goals (insert + update) ──────────

DROP POLICY IF EXISTS "daily_goals_insert_own" ON daily_goals;
DROP POLICY IF EXISTS "daily_goals_update_own" ON daily_goals;

CREATE POLICY "daily_goals_insert_own"
  ON daily_goals FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "daily_goals_update_own"
  ON daily_goals FOR UPDATE
  USING (auth.uid() = student_id);
