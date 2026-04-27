-- ============================================================
-- MasteX — Sub-topic Subject Area Tag
-- Migration 009
--
-- Adds subject_area column to sub_topics. This tag controls
-- which question frames are valid for each sub-topic, so the
-- question generator never creates e.g. essay_writing questions
-- for phonology sub-topics like "Pure vowel sounds".
--
-- Safe to run multiple times (idempotent).
-- RUN IN SUPABASE SQL EDITOR before running migration 010.
-- ============================================================

ALTER TABLE sub_topics
  ADD COLUMN IF NOT EXISTS subject_area TEXT;

-- Valid values (for documentation — no CHECK to allow future areas):
-- Core Mathematics:
--   number_algebra, geometry_trig, stats_probability
-- English Language:
--   oral_english_topic, comprehension_topic, grammar_topic,
--   writing_topic, literature_topic
-- Social Studies:
--   general_knowledge, history_geography, governance_rights,
--   financial_economic, ethics_values
-- Integrated Science:
--   physics_calculation, chemistry_calculation, biology_concept,
--   health_lifestyle, environmental, scientific_method, electronics
