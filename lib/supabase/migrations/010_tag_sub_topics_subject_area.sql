-- ============================================================
-- MasteX — Tag All Sub-topics with subject_area
-- Migration 010
--
-- Tags all 271 sub-topics by joining on topic name.
-- Run AFTER migration 009.
--
-- Counts per area after this migration:
--   Core Mathematics (79 sub-topics)
--     number_algebra   : 44  (Numbers + Algebraic Reasoning strands)
--     geometry_trig    : 20  (Geometry Around Us strand)
--     stats_probability: 15  (Making Sense of and Using Data strand)
--
--   English Language (65 sub-topics)
--     oral_english_topic  : 13  (Oral Language strand)
--     comprehension_topic : 12  (Reading and Summary strand)
--     grammar_topic       : 17  (Grammar strand)
--     writing_topic       : 14  (Writing strand)
--     literature_topic    :  9  (Literature strand)
--
--   Social Studies (71 sub-topics)
--     history_geography  : 14  (Geographical + Historical Sketch + African Civilisations)
--     general_knowledge  :  5  (National Identity and Cohesion)
--     governance_rights  : 15  (Civic Ideals + Law Enforcement + Rights & Responsibilities)
--     ethics_values      :  9  (Indigenous Knowledge + Ethics and Moral Values)
--     financial_economic : 28  (Economic Activities + Entrepreneurship + Productivity +
--                                Consumer Rights + Savings Culture + Financial Security)
--
--   Integrated Science (56 sub-topics)
--     scientific_method     :  5  (Characteristics of Science)
--     chemistry_calculation :  4  (Periodic Table Properties)
--     physics_calculation   : 14  (Solar Energy + Types of Forces + Speed/Velocity)
--     electronics           :  8  (Electronic Components + Circuit Design)
--     biology_concept       :  5  (Reproductive Systems)
--     health_lifestyle      :  8  (Lifestyle Diseases + Drug Use and Hazards)
--     environmental         : 12  (Fossil Fuels + Technology in Local Industries +
--                                   Environmental Impact of Technology)
-- ============================================================

-- ── CORE MATHEMATICS ─────────────────────────────────────────

-- number_algebra: Numbers for Everyday Life + Algebraic Reasoning strands
UPDATE sub_topics
SET subject_area = 'number_algebra'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Real Number System',
    'Sets and Operations',
    'Ratio, Rates and Percentages',
    'Surds, Indices and Logarithms',
    'Number Bases',
    'Algebraic Expressions',
    'Linear Equations and Inequalities',
    'Relations and Functions',
    'Number Patterns'
  )
);

-- geometry_trig: Geometry Around Us strand
UPDATE sub_topics
SET subject_area = 'geometry_trig'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Plane Geometry',
    'Trigonometry',
    'Mensuration',
    'Vectors and Transformation'
  )
);

-- stats_probability: Making Sense of and Using Data strand
UPDATE sub_topics
SET subject_area = 'stats_probability'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Statistical Reasoning',
    'Data Representation',
    'Probability'
  )
);

-- ── ENGLISH LANGUAGE ─────────────────────────────────────────

-- oral_english_topic: Oral Language strand
UPDATE sub_topics
SET subject_area = 'oral_english_topic'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Vowel and Consonant Segments',
    'Word Stress',
    'Intonation Patterns'
  )
);

-- comprehension_topic: Reading and Summary strand
UPDATE sub_topics
SET subject_area = 'comprehension_topic'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Skimming and Scanning',
    'Purposeful Reading',
    'Summary Writing'
  )
);

-- grammar_topic: Grammar strand
UPDATE sub_topics
SET subject_area = 'grammar_topic'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Parts of Speech and Phrases',
    'Clauses and Sentence Structure',
    'Tense and Aspect',
    'Reported Speech and Conditionals'
  )
);

-- writing_topic: Writing strand
UPDATE sub_topics
SET subject_area = 'writing_topic'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Paragraph Development',
    'Argumentative and Descriptive Essays',
    'Letters and Reports'
  )
);

-- literature_topic: Literature strand
UPDATE sub_topics
SET subject_area = 'literature_topic'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Introduction to Literary Genres',
    'Oral Literature and Text Analysis'
  )
);

-- ── SOCIAL STUDIES ────────────────────────────────────────────

-- history_geography: physical/historical geography topics
UPDATE sub_topics
SET subject_area = 'history_geography'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Geographical Sketch of Africa',
    'Historical Sketch of Africa',
    'African Civilisations'
  )
);

-- general_knowledge: national identity
UPDATE sub_topics
SET subject_area = 'general_knowledge'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'National Identity and Cohesion'
  )
);

-- governance_rights: civic and legal topics
UPDATE sub_topics
SET subject_area = 'governance_rights'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Civic Ideals and Practices',
    'Law Enforcement in Ghana',
    'Rights and Responsibilities'
  )
);

-- ethics_values: ethics and indigenous knowledge
UPDATE sub_topics
SET subject_area = 'ethics_values'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Indigenous Knowledge Systems',
    'Ethics and Moral Values'
  )
);

-- financial_economic: production, entrepreneurship, finance literacy
UPDATE sub_topics
SET subject_area = 'financial_economic'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Economic Activities in Africa',
    'Entrepreneurship and Workplace Culture',
    'Productivity and Innovation',
    'Consumer Rights and Protection',
    'Savings Culture',
    'Financial Security'
  )
);

-- ── INTEGRATED SCIENCE ────────────────────────────────────────

-- scientific_method: Characteristics of Science
UPDATE sub_topics
SET subject_area = 'scientific_method'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Characteristics of Science'
  )
);

-- chemistry_calculation: Periodic Table
UPDATE sub_topics
SET subject_area = 'chemistry_calculation'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Periodic Table Properties'
  )
);

-- physics_calculation: Solar Energy, Forces, Motion
UPDATE sub_topics
SET subject_area = 'physics_calculation'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Solar Energy in Ghana',
    'Types of Forces',
    'Speed, Velocity and Acceleration'
  )
);

-- electronics: Electronic Components, Circuit Design
UPDATE sub_topics
SET subject_area = 'electronics'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Electronic Components',
    'Circuit Design'
  )
);

-- biology_concept: Reproductive Systems
UPDATE sub_topics
SET subject_area = 'biology_concept'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Reproductive Systems'
  )
);

-- health_lifestyle: Lifestyle Diseases, Drug Use
UPDATE sub_topics
SET subject_area = 'health_lifestyle'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Lifestyle Diseases',
    'Drug Use and Hazards'
  )
);

-- environmental: Fossil Fuels, Technology + Environment
UPDATE sub_topics
SET subject_area = 'environmental'
WHERE topic_id IN (
  SELECT id FROM topics
  WHERE name IN (
    'Fossil Fuels and Energy Sources',
    'Technology in Local Industries',
    'Environmental Impact of Technology'
  )
);

-- ── Sanity check ──────────────────────────────────────────────
-- Run this SELECT after the UPDATEs to verify 271 rows are tagged
-- and 0 remain NULL:
--
-- SELECT subject_area, COUNT(*) AS n
-- FROM sub_topics
-- GROUP BY subject_area
-- ORDER BY subject_area;
--
-- SELECT COUNT(*) AS untagged FROM sub_topics WHERE subject_area IS NULL;
