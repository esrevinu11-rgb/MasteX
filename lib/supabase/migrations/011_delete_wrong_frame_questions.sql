-- ============================================================
-- MasteX — Delete Wrong-Frame Questions
-- Migration 011
--
-- Deletes questions whose frame is not valid for the sub-topic's
-- subject_area. Run AFTER migrations 009 and 010.
--
-- IMPORTANT: Run the diagnostic SELECT first to preview what will
-- be deleted before committing the DELETE.
--
-- Step 1 — Preview (no changes):
--   Run the SELECT block below.
--
-- Step 2 — Delete (irreversible):
--   Run the DELETE block below.
--
-- Step 3 — Regenerate:
--   npx tsx scripts/generate-questions.ts
-- ============================================================

-- ── Allowed (subject_area, frame) pairs ──────────────────────
-- This CTE mirrors SUBJECT_AREA_FRAMES in generate-questions.ts.

WITH allowed AS (
  -- Core Mathematics
  SELECT 'number_algebra'    AS sa, 'mcq_objective'         AS frame UNION ALL
  SELECT 'number_algebra',          'short_answer_theory'            UNION ALL
  SELECT 'number_algebra',          'multi_step_theory'              UNION ALL
  SELECT 'number_algebra',          'story_problem'                  UNION ALL
  SELECT 'number_algebra',          'data_interpretation'            UNION ALL
  SELECT 'number_algebra',          'proof_justify'                  UNION ALL

  SELECT 'geometry_trig',           'mcq_objective'                  UNION ALL
  SELECT 'geometry_trig',           'short_answer_theory'            UNION ALL
  SELECT 'geometry_trig',           'multi_step_theory'              UNION ALL
  SELECT 'geometry_trig',           'proof_justify'                  UNION ALL
  SELECT 'geometry_trig',           'data_interpretation'            UNION ALL

  SELECT 'stats_probability',       'mcq_objective'                  UNION ALL
  SELECT 'stats_probability',       'short_answer_theory'            UNION ALL
  SELECT 'stats_probability',       'multi_step_theory'              UNION ALL
  SELECT 'stats_probability',       'data_interpretation'            UNION ALL
  SELECT 'stats_probability',       'story_problem'                  UNION ALL

  -- English Language
  SELECT 'oral_english_topic',      'mcq_objective'                  UNION ALL
  SELECT 'oral_english_topic',      'oral_english'                   UNION ALL

  SELECT 'comprehension_topic',     'mcq_objective'                  UNION ALL
  SELECT 'comprehension_topic',     'comprehension_factual'          UNION ALL
  SELECT 'comprehension_topic',     'comprehension_inferential'      UNION ALL

  SELECT 'grammar_topic',           'mcq_objective'                  UNION ALL
  SELECT 'grammar_topic',           'comprehension_factual'          UNION ALL

  SELECT 'writing_topic',           'mcq_objective'                  UNION ALL
  SELECT 'writing_topic',           'essay_writing'                  UNION ALL
  SELECT 'writing_topic',           'letter_writing'                 UNION ALL

  SELECT 'literature_topic',        'mcq_objective'                  UNION ALL
  SELECT 'literature_topic',        'essay_writing'                  UNION ALL
  SELECT 'literature_topic',        'comprehension_inferential'      UNION ALL

  -- Social Studies
  SELECT 'general_knowledge',       'mcq_objective'                  UNION ALL
  SELECT 'general_knowledge',       'short_answer'                   UNION ALL
  SELECT 'general_knowledge',       'explain_suggest'                UNION ALL
  SELECT 'general_knowledge',       'discuss_analyse'                UNION ALL

  SELECT 'history_geography',       'mcq_objective'                  UNION ALL
  SELECT 'history_geography',       'short_answer'                   UNION ALL
  SELECT 'history_geography',       'diagram_based'                  UNION ALL
  SELECT 'history_geography',       'explain_suggest'                UNION ALL

  SELECT 'governance_rights',       'mcq_objective'                  UNION ALL
  SELECT 'governance_rights',       'short_answer'                   UNION ALL
  SELECT 'governance_rights',       'explain_suggest'                UNION ALL
  SELECT 'governance_rights',       'discuss_analyse'                UNION ALL
  SELECT 'governance_rights',       'evaluate_assess'                UNION ALL

  SELECT 'financial_economic',      'mcq_objective'                  UNION ALL
  SELECT 'financial_economic',      'short_answer'                   UNION ALL
  SELECT 'financial_economic',      'explain_suggest'                UNION ALL
  SELECT 'financial_economic',      'evaluate_assess'                UNION ALL

  SELECT 'ethics_values',           'mcq_objective'                  UNION ALL
  SELECT 'ethics_values',           'short_answer'                   UNION ALL
  SELECT 'ethics_values',           'discuss_analyse'                UNION ALL
  SELECT 'ethics_values',           'evaluate_assess'                UNION ALL

  -- Integrated Science
  SELECT 'physics_calculation',     'mcq_objective'                  UNION ALL
  SELECT 'physics_calculation',     'short_structured'               UNION ALL
  SELECT 'physics_calculation',     'calculation'                    UNION ALL
  SELECT 'physics_calculation',     'practical_data'                 UNION ALL

  SELECT 'chemistry_calculation',   'mcq_objective'                  UNION ALL
  SELECT 'chemistry_calculation',   'short_structured'               UNION ALL
  SELECT 'chemistry_calculation',   'calculation'                    UNION ALL
  SELECT 'chemistry_calculation',   'practical_data'                 UNION ALL

  SELECT 'biology_concept',         'mcq_objective'                  UNION ALL
  SELECT 'biology_concept',         'short_structured'               UNION ALL
  SELECT 'biology_concept',         'activity_of_integration'        UNION ALL
  SELECT 'biology_concept',         'evaluate_discuss'               UNION ALL

  SELECT 'health_lifestyle',        'mcq_objective'                  UNION ALL
  SELECT 'health_lifestyle',        'short_structured'               UNION ALL
  SELECT 'health_lifestyle',        'activity_of_integration'        UNION ALL
  SELECT 'health_lifestyle',        'evaluate_discuss'               UNION ALL

  SELECT 'environmental',           'mcq_objective'                  UNION ALL
  SELECT 'environmental',           'short_structured'               UNION ALL
  SELECT 'environmental',           'activity_of_integration'        UNION ALL
  SELECT 'environmental',           'evaluate_discuss'               UNION ALL

  SELECT 'scientific_method',       'mcq_objective'                  UNION ALL
  SELECT 'scientific_method',       'short_structured'               UNION ALL
  SELECT 'scientific_method',       'practical_data'                 UNION ALL
  SELECT 'scientific_method',       'activity_of_integration'        UNION ALL

  SELECT 'electronics',             'mcq_objective'                  UNION ALL
  SELECT 'electronics',             'short_structured'               UNION ALL
  SELECT 'electronics',             'calculation'                    UNION ALL
  SELECT 'electronics',             'practical_data'
),

-- ── Wrong questions: frame not in allowed list for this sub-topic's area ─
wrong_questions AS (
  SELECT
    q.id,
    q.frame,
    st.name     AS sub_topic_name,
    st.subject_area
  FROM questions q
  JOIN sub_topics st ON q.sub_topic_id = st.id
  WHERE st.subject_area IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM allowed a
      WHERE a.sa    = st.subject_area
        AND a.frame = q.frame
    )
)

-- ── Step 1: PREVIEW — run this first ─────────────────────────
-- Shows every question that will be deleted and why.
-- Comment out this block and uncomment the DELETE below when ready.

SELECT
  sub_topic_name,
  subject_area,
  frame,
  COUNT(*) AS questions_to_delete
FROM wrong_questions
GROUP BY sub_topic_name, subject_area, frame
ORDER BY subject_area, sub_topic_name, frame;

-- ── Step 2: DELETE — uncomment when ready ────────────────────
-- Deletes all wrong-frame questions identified above.
-- Dependent question_attempts rows are cascade-deleted automatically
-- if the FK has ON DELETE CASCADE; otherwise delete attempts first.

-- DELETE FROM question_attempts
-- WHERE question_id IN (
--   SELECT q.id
--   FROM questions q
--   JOIN sub_topics st ON q.sub_topic_id = st.id
--   WHERE st.subject_area IS NOT NULL
--     AND NOT EXISTS (
--       SELECT 1 FROM allowed a
--       WHERE a.sa = st.subject_area AND a.frame = q.frame
--     )
-- );

-- WITH allowed AS ( ... paste full CTE above ... )
-- DELETE FROM questions
-- WHERE id IN (SELECT id FROM wrong_questions);
