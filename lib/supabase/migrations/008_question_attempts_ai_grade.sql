-- ============================================================
-- MasteX — Question Attempts AI Grade Columns
-- Migration 008
--
-- Adds AI grading result columns to question_attempts so that
-- short_answer and theory responses graded by Claude can be
-- stored alongside the attempt.
--
-- Safe to run multiple times (all statements are idempotent).
-- RUN IN SUPABASE SQL EDITOR before testing AI grading.
-- ============================================================

ALTER TABLE question_attempts
  ADD COLUMN IF NOT EXISTS ai_score         INTEGER
    CHECK (ai_score BETWEEN 0 AND 100);

ALTER TABLE question_attempts
  ADD COLUMN IF NOT EXISTS ai_feedback      TEXT;

ALTER TABLE question_attempts
  ADD COLUMN IF NOT EXISTS rubric_relevance INTEGER
    CHECK (rubric_relevance BETWEEN 0 AND 25);

ALTER TABLE question_attempts
  ADD COLUMN IF NOT EXISTS rubric_accuracy  INTEGER
    CHECK (rubric_accuracy BETWEEN 0 AND 25);

ALTER TABLE question_attempts
  ADD COLUMN IF NOT EXISTS rubric_depth     INTEGER
    CHECK (rubric_depth BETWEEN 0 AND 25);

ALTER TABLE question_attempts
  ADD COLUMN IF NOT EXISTS rubric_clarity   INTEGER
    CHECK (rubric_clarity BETWEEN 0 AND 25);
