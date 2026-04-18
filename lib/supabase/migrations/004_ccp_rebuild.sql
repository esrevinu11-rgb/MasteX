-- ============================================================
-- MasteX — CCP Curriculum Rebuild
-- Migration 004
--
-- RUN IN SUPABASE SQL EDITOR IN ORDER.
-- Then run: npx tsx scripts/seed-curriculum.ts
-- Then run: npx tsx scripts/generate-questions.ts
-- Then run: npx tsx scripts/generate-explanations.ts
-- ============================================================

-- ── 1. CLEANUP (respect FK order) ───────────────────────────
DELETE FROM question_attempts;
DELETE FROM quest_submissions;
DELETE FROM study_sessions;
DELETE FROM sub_topic_progress;
DELETE FROM explanations;
DELETE FROM questions;
DELETE FROM sub_topics;
DELETE FROM topics;
DELETE FROM subjects;

-- ── 2. ALTER topics table ────────────────────────────────────
ALTER TABLE topics ADD COLUMN IF NOT EXISTS strand_name  TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS strand_order INTEGER DEFAULT 1;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS waec_code    TEXT;

-- ── 3. SEED subjects ─────────────────────────────────────────
INSERT INTO subjects (id, name, short_name, icon, color, order_index)
VALUES
  ('core_math',          'Core Mathematics',    'Maths',   '∑', '#3B82F6', 1),
  ('english',            'English Language',    'English', '✎', '#10B981', 2),
  ('social_studies',     'Social Studies',      'Social',  '◎', '#F59E0B', 3),
  ('integrated_science', 'Integrated Science',  'Science', '⚗', '#8B5CF6', 4)
ON CONFLICT (id) DO NOTHING;
