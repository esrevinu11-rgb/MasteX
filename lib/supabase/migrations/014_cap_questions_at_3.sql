-- ============================================================
-- MasteX — Cap questions at 3 per (sub_topic_id, frame)
-- Migration 014
--
-- Deletes excess questions keeping only the 3 oldest per slot.
-- Run ONCE in Supabase SQL Editor before re-running the
-- generate-questions script.
-- ============================================================

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY sub_topic_id, frame
      ORDER BY created_at ASC
    ) AS rn
  FROM questions
)
DELETE FROM questions
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 3
);
