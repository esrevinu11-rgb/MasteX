-- ============================================================
-- MasteX — Student Subjects
-- Migration 015
--
-- Creates a subjects lookup table (required for the FK) and
-- the student_subjects join table that stores each student's
-- selected subjects after onboarding.
--
-- Run in Supabase SQL Editor before deploying the updated
-- onboarding flow.
-- ============================================================

-- ── subjects lookup ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subjects (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  is_live    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO subjects (id, name, is_live) VALUES
  ('core_math',           'Core Mathematics',               true),
  ('english',             'English Language',               true),
  ('social_studies',      'Social Studies',                 true),
  ('integrated_science',  'Integrated Science',             true),
  ('biology',             'Biology',                        false),
  ('chemistry',           'Chemistry',                      false),
  ('physics',             'Physics',                        false),
  ('elective_math',       'Additional Mathematics',         false),
  ('economics',           'Economics',                      false),
  ('geography',           'Geography',                      false),
  ('government',          'Government',                     false),
  ('literature',          'Literature in English',          false),
  ('history',             'History',                        false),
  ('business_management', 'Business Management',            false),
  ('accounting',          'Financial Accounting',           false),
  ('art_design',          'Art & Design Foundation',        false),
  ('music',               'Music',                         false),
  ('performing_arts',     'Performing Arts',                false),
  ('design_tech',         'Design & Communication Technology', false)
ON CONFLICT (id) DO NOTHING;

-- ── student_subjects ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_subjects (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id   TEXT        NOT NULL REFERENCES subjects(id),
  is_compulsory BOOLEAN    NOT NULL DEFAULT false,
  selected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_student_subjects_student ON student_subjects (student_id);

ALTER TABLE student_subjects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'student_subjects' AND policyname = 'students_own_subjects'
  ) THEN
    CREATE POLICY "students_own_subjects" ON student_subjects
      FOR ALL USING (auth.uid() = student_id);
  END IF;
END
$$;
