-- Migration 002: Unique constraint on (sub_topic_id, frame)
-- Required so the question-generation script can use
-- INSERT ... ON CONFLICT (sub_topic_id, frame) DO NOTHING,
-- making it safe to re-run without creating duplicates.
--
-- Run this in the Supabase SQL Editor before executing
-- scripts/generate-questions.ts

ALTER TABLE questions
  ADD CONSTRAINT questions_sub_topic_frame_unique
  UNIQUE (sub_topic_id, frame);
