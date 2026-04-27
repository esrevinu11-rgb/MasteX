-- ============================================================
-- MasteX — Programme Selection
-- Migration 013
--
-- Creates programmes lookup table, adds programme_id and
-- subscription_tier to students.
--
-- Safe to run multiple times (IF NOT EXISTS / ON CONFLICT).
-- RUN IN SUPABASE SQL EDITOR before deploying the programme
-- selection UI.
-- ============================================================

CREATE TABLE IF NOT EXISTS programmes (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  emoji             TEXT NOT NULL DEFAULT '📚',
  is_available      BOOLEAN NOT NULL DEFAULT true,
  elective_subjects TEXT[] NOT NULL DEFAULT '{}'
);

INSERT INTO programmes (id, name, description, emoji, is_available, elective_subjects) VALUES
  ('science',              'General Science',       'Elective Maths, Physics, Chemistry, Biology',                 '🔬', true,  ARRAY['Elective Maths', 'Physics', 'Chemistry', 'Biology']),
  ('general_arts',         'General Arts',          'Literature, History/Government, Geography, Economics',        '🎭', true,  ARRAY['Literature in English', 'History/Government', 'Geography', 'Economics']),
  ('business',             'Business',              'Financial Accounting, Cost Accounting, Economics, Biz Mgmt', '📊', true,  ARRAY['Financial Accounting', 'Cost Accounting', 'Economics', 'Business Management']),
  ('vapa',                 'Visual Arts',           'Graphic Design, Textiles, Picture Making, Music',            '🎨', true,  ARRAY['Graphic Design', 'Textiles', 'Picture Making', 'Music']),
  ('technical',            'Technical',             'Building Construction, Technical Drawing, Auto Mechanics',   '⚙️', false, ARRAY['Building Construction', 'Technical Drawing', 'Auto Mechanics']),
  ('home_economics',       'Home Economics',        'Food & Nutrition, Management in Living, Clothing & Textiles','🏡', false, ARRAY['Food & Nutrition', 'Management in Living', 'Clothing & Textiles']),
  ('agricultural_science', 'Agricultural Science',  'Animal Husbandry, Farm Management, Agric Economics',        '🌾', false, ARRAY['Animal Husbandry', 'Farm Management', 'Agric Economics']),
  ('vocational_skills',    'Vocational Skills',     'Electronics, Welding & Fabrication, Plumbing',              '🔧', false, ARRAY['Electronics', 'Welding & Fabrication', 'Plumbing']),
  ('general',              'General',               'Mixed electives depending on your school',                  '📚', false, ARRAY['Mixed electives depending on school'])
ON CONFLICT (id) DO NOTHING;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS programme_id      TEXT REFERENCES programmes(id),
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'core'
    CHECK (subscription_tier IN ('core', 'programme', 'full'));

ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'programmes' AND policyname = 'programmes_readable'
  ) THEN
    CREATE POLICY "programmes_readable" ON programmes
      FOR SELECT USING (true);
  END IF;
END
$$;
