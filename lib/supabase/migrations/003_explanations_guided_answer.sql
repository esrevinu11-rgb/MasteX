-- Migration 003: Add guided_answer column to explanations table
-- The study session Phase 3 (Guided Practice) needs to reveal the
-- full correct answer after a student has exhausted their hints.
-- Run in Supabase SQL Editor before using the explanation generation
-- script or the study session.

ALTER TABLE explanations
  ADD COLUMN IF NOT EXISTS guided_answer text NOT NULL DEFAULT '';
