-- ============================================================
-- MasteX — Allow Multiple Questions Per Frame
-- Migration 012
--
-- Drops the unique constraint on (sub_topic_id, frame) so the
-- question generator can create 3 distinct questions per frame
-- slot (different scenarios, numbers, contexts).
--
-- Safe to run multiple times (DROP CONSTRAINT IF EXISTS).
-- RUN IN SUPABASE SQL EDITOR before re-running the generator.
-- ============================================================

ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS questions_sub_topic_frame_unique;
