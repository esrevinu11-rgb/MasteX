-- ============================================================
-- MasteX — WAEC Paper Structure Migration
-- Migration 006
--
-- RUN IN SUPABASE SQL EDITOR before running the
-- question generation script.
-- ============================================================

-- ── 1. Drop old constraints ───────────────────────────────────
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_frame_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_sub_topic_frame_unique;

-- ── 2. Add new columns ────────────────────────────────────────
ALTER TABLE questions ADD COLUMN IF NOT EXISTS paper           TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS shows_working   BOOLEAN DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS partial_marks   BOOLEAN DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS ghanaian_context BOOLEAN DEFAULT false;

-- ── 3. Clear existing questions (frames have changed) ─────────
DELETE FROM question_attempts;
DELETE FROM questions;

-- ── 4. New frame constraint ───────────────────────────────────
ALTER TABLE questions ADD CONSTRAINT questions_frame_check CHECK (frame IN (
  -- Core Mathematics
  'mcq_objective',
  'short_answer_theory',
  'multi_step_theory',
  'story_problem',
  'data_interpretation',
  'proof_justify',
  -- English Language  (mcq_objective shared)
  'comprehension_factual',
  'comprehension_inferential',
  'essay_writing',
  'letter_writing',
  'oral_english',
  -- Integrated Science  (mcq_objective shared)
  'short_structured',
  'calculation',
  'activity_of_integration',
  'practical_data',
  'evaluate_discuss',
  -- Social Studies  (mcq_objective shared)
  'short_answer',
  'explain_suggest',
  'discuss_analyse',
  'diagram_based',
  'evaluate_assess'
));

-- ── 5. Unique constraint ──────────────────────────────────────
ALTER TABLE questions ADD CONSTRAINT questions_sub_topic_frame_unique
  UNIQUE (sub_topic_id, frame);
