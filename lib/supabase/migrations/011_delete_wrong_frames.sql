-- ============================================================
-- MasteX — Delete Wrong-Frame Questions
-- Migration 011
--
-- Deletes every question whose frame is not in the allowed list
-- for that sub-topic's subject_area.
--
-- Prerequisites:
--   ✓ Migration 009 (subject_area column exists)
--   ✓ Migration 010 (all sub-topics are tagged)
--
-- Run order:
--   1. Run this file in Supabase SQL Editor
--   2. Run the COUNT query at the bottom to verify
--   3. npx tsx scripts/generate-questions.ts
-- ============================================================

-- ── DELETE all wrong-frame questions ─────────────────────────

WITH allowed (subject_area, frame) AS (
  VALUES
    -- oral_english_topic
    ('oral_english_topic',    'mcq_objective'),
    ('oral_english_topic',    'oral_english'),
    -- comprehension_topic
    ('comprehension_topic',   'mcq_objective'),
    ('comprehension_topic',   'comprehension_factual'),
    ('comprehension_topic',   'comprehension_inferential'),
    -- grammar_topic
    ('grammar_topic',         'mcq_objective'),
    ('grammar_topic',         'comprehension_factual'),
    -- writing_topic
    ('writing_topic',         'mcq_objective'),
    ('writing_topic',         'essay_writing'),
    ('writing_topic',         'letter_writing'),
    -- literature_topic
    ('literature_topic',      'mcq_objective'),
    ('literature_topic',      'essay_writing'),
    ('literature_topic',      'comprehension_inferential'),
    -- number_algebra
    ('number_algebra',        'mcq_objective'),
    ('number_algebra',        'short_answer_theory'),
    ('number_algebra',        'multi_step_theory'),
    ('number_algebra',        'story_problem'),
    ('number_algebra',        'data_interpretation'),
    ('number_algebra',        'proof_justify'),
    -- geometry_trig
    ('geometry_trig',         'mcq_objective'),
    ('geometry_trig',         'short_answer_theory'),
    ('geometry_trig',         'multi_step_theory'),
    ('geometry_trig',         'proof_justify'),
    ('geometry_trig',         'data_interpretation'),
    -- stats_probability
    ('stats_probability',     'mcq_objective'),
    ('stats_probability',     'short_answer_theory'),
    ('stats_probability',     'multi_step_theory'),
    ('stats_probability',     'data_interpretation'),
    ('stats_probability',     'story_problem'),
    -- general_knowledge
    ('general_knowledge',     'mcq_objective'),
    ('general_knowledge',     'short_answer'),
    ('general_knowledge',     'explain_suggest'),
    ('general_knowledge',     'discuss_analyse'),
    -- history_geography
    ('history_geography',     'mcq_objective'),
    ('history_geography',     'short_answer'),
    ('history_geography',     'diagram_based'),
    ('history_geography',     'explain_suggest'),
    -- governance_rights
    ('governance_rights',     'mcq_objective'),
    ('governance_rights',     'short_answer'),
    ('governance_rights',     'explain_suggest'),
    ('governance_rights',     'discuss_analyse'),
    ('governance_rights',     'evaluate_assess'),
    -- financial_economic
    ('financial_economic',    'mcq_objective'),
    ('financial_economic',    'short_answer'),
    ('financial_economic',    'explain_suggest'),
    ('financial_economic',    'evaluate_assess'),
    -- ethics_values
    ('ethics_values',         'mcq_objective'),
    ('ethics_values',         'short_answer'),
    ('ethics_values',         'discuss_analyse'),
    ('ethics_values',         'evaluate_assess'),
    -- physics_calculation
    ('physics_calculation',   'mcq_objective'),
    ('physics_calculation',   'short_structured'),
    ('physics_calculation',   'calculation'),
    ('physics_calculation',   'practical_data'),
    -- chemistry_calculation
    ('chemistry_calculation', 'mcq_objective'),
    ('chemistry_calculation', 'short_structured'),
    ('chemistry_calculation', 'calculation'),
    ('chemistry_calculation', 'practical_data'),
    -- biology_concept
    ('biology_concept',       'mcq_objective'),
    ('biology_concept',       'short_structured'),
    ('biology_concept',       'activity_of_integration'),
    ('biology_concept',       'evaluate_discuss'),
    -- health_lifestyle
    ('health_lifestyle',      'mcq_objective'),
    ('health_lifestyle',      'short_structured'),
    ('health_lifestyle',      'activity_of_integration'),
    ('health_lifestyle',      'evaluate_discuss'),
    -- environmental
    ('environmental',         'mcq_objective'),
    ('environmental',         'short_structured'),
    ('environmental',         'activity_of_integration'),
    ('environmental',         'evaluate_discuss'),
    -- scientific_method
    ('scientific_method',     'mcq_objective'),
    ('scientific_method',     'short_structured'),
    ('scientific_method',     'practical_data'),
    ('scientific_method',     'activity_of_integration'),
    -- electronics
    ('electronics',           'mcq_objective'),
    ('electronics',           'short_structured'),
    ('electronics',           'calculation'),
    ('electronics',           'diagram_based')
)
DELETE FROM questions
WHERE id IN (
  SELECT q.id
  FROM   questions    q
  JOIN   sub_topics   st ON st.id = q.sub_topic_id
  WHERE  st.subject_area IS NOT NULL
    AND  NOT EXISTS (
      SELECT 1
      FROM   allowed a
      WHERE  a.subject_area = st.subject_area
        AND  a.frame        = q.frame
    )
);

-- ── COUNT query — run after the DELETE ───────────────────────
-- Shows actual vs expected question counts per subject_area,
-- and how many still need to be generated.

WITH allowed_counts (subject_area, frames_allowed) AS (
  VALUES
    ('oral_english_topic',    2),
    ('comprehension_topic',   3),
    ('grammar_topic',         2),
    ('writing_topic',         3),
    ('literature_topic',      3),
    ('number_algebra',        6),
    ('geometry_trig',         5),
    ('stats_probability',     5),
    ('general_knowledge',     4),
    ('history_geography',     4),
    ('governance_rights',     5),
    ('financial_economic',    4),
    ('ethics_values',         4),
    ('physics_calculation',   4),
    ('chemistry_calculation', 4),
    ('biology_concept',       4),
    ('health_lifestyle',      4),
    ('environmental',         4),
    ('scientific_method',     4),
    ('electronics',           4)
),
sub_counts AS (
  SELECT subject_area, COUNT(*) AS sub_topic_count
  FROM   sub_topics
  WHERE  subject_area IS NOT NULL
  GROUP BY subject_area
),
existing AS (
  SELECT st.subject_area, COUNT(*) AS questions_actual
  FROM   questions q
  JOIN   sub_topics st ON st.id = q.sub_topic_id
  WHERE  st.subject_area IS NOT NULL
  GROUP BY st.subject_area
)
SELECT
  s.subject_area,
  s.sub_topic_count,
  ac.frames_allowed,
  (s.sub_topic_count * ac.frames_allowed)       AS questions_expected,
  COALESCE(e.questions_actual, 0)               AS questions_actual,
  (s.sub_topic_count * ac.frames_allowed)
    - COALESCE(e.questions_actual, 0)           AS to_generate
FROM      sub_counts   s
JOIN      allowed_counts ac ON ac.subject_area = s.subject_area
LEFT JOIN existing       e  ON e.subject_area  = s.subject_area
ORDER BY  s.subject_area;
