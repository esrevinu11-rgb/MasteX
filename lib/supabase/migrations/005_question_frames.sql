-- ============================================================
-- MasteX — Subject-specific WAEC question frames
-- Migration 005
--
-- RUN IN SUPABASE SQL EDITOR before running the
-- question generation script.
-- ============================================================

-- ── 1. Drop old constraints ───────────────────────────────────
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_frame_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_sub_topic_frame_unique;

-- ── 2. Delete old questions (frames have changed) ─────────────
DELETE FROM question_attempts;
DELETE FROM questions;

-- ── 3. Add new frame check ────────────────────────────────────
ALTER TABLE questions ADD CONSTRAINT questions_frame_check CHECK (frame IN (
  -- Core Mathematics
  'mcq_objective',
  'short_structured',
  'multi_step_theory',
  'word_problem',
  'data_interpretation',
  'proof_justify',
  -- English Language
  'comprehension_factual',
  'comprehension_inferential',
  'summary_writing',
  'essay_writing',
  'letter_report',
  -- Social Studies (shares mcq_objective, data_interpretation)
  'short_answer',
  'explain_question',
  'discuss_analyse',
  'evaluate_assess',
  'case_study',
  -- Integrated Science (shares mcq_objective, short_structured, data_interpretation)
  'calculation',
  'diagram_label',
  'experiment_investigation',
  'evaluate_discuss'
));

-- ── 4. Re-add unique constraint ───────────────────────────────
ALTER TABLE questions ADD CONSTRAINT questions_sub_topic_frame_unique
  UNIQUE (sub_topic_id, frame);
