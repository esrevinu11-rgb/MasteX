-- MasteX Seed Data v2.0
-- Run AFTER schema.sql.
-- Idempotent: safe to run multiple times.

-- ══════════════════════════════════════════════════════════════
-- SUBJECTS
-- ══════════════════════════════════════════════════════════════

insert into subjects (id, name, short_name, icon, color, order_index)
values
  ('core_math',           'Core Mathematics',    'Maths',   '∑',  '#3B82F6', 1),
  ('english',             'English Language',    'English', '✎',  '#10B981', 2),
  ('integrated_science',  'Integrated Science',  'Science', '⚗',  '#8B5CF6', 3),
  ('social_studies',      'Social Studies',      'Social',  '◎',  '#F59E0B', 4)
on conflict (id) do nothing;


-- ══════════════════════════════════════════════════════════════
-- CORE MATHEMATICS — YEAR 1
-- Topics + sub-topics seeded in a single DO block so we can
-- capture UUIDs for prerequisite chains without hard-coding them.
-- ══════════════════════════════════════════════════════════════

do $$
declare
  -- Topic IDs
  t_number        uuid;
  t_algebra       uuid;
  t_linear        uuid;
  t_simultaneous  uuid;
  t_quadratic     uuid;
  t_indices       uuid;
  t_sequences     uuid;
  t_geometry      uuid;
  t_mensuration   uuid;
  t_trig          uuid;
  t_statistics    uuid;
  t_probability   uuid;

begin

  -- ── Insert topics ───────────────────────────────────────────

  insert into topics (subject_id, name, description, waec_code, year_group, order_index)
  values ('core_math', 'Number & Numeration',
    'Understanding the properties and types of numbers, bases, and fundamental numerical operations.',
    'CM-Y1-01', 1, 1)
  returning id into t_number;

  insert into topics (subject_id, name, description, waec_code, year_group, order_index)
  values ('core_math', 'Algebraic Expressions',
    'Manipulating symbolic expressions through simplification, expansion, and factorisation.',
    'CM-Y1-02', 1, 2)
  returning id into t_algebra;

  insert into topics (subject_id, name, description, waec_code, year_group, order_index)
  values ('core_math', 'Linear Equations & Inequalities',
    'Solving equations and inequalities with one unknown and applying them to real-world problems.',
    'CM-Y1-03', 1, 3)
  returning id into t_linear;

  insert into topics (subject_id, name, description, waec_code, year_group, order_index)
  values ('core_math', 'Simultaneous Linear Equations',
    'Solving systems of two linear equations using algebraic and graphical methods.',
    'CM-Y1-04', 1, 4)
  returning id into t_simultaneous;

  insert into topics (subject_id, name, description, waec_code, year_group, order_index)
  values ('core_math', 'Quadratic Equations',
    'Solving second-degree equations and understanding their graphical and algebraic properties.',
    'CM-Y1-05', 1, 5)
  returning id into t_quadratic;

  insert into topics (subject_id, name, description, waec_code, year_group, order_index)
  values ('core_math', 'Indices & Logarithms',
    'Applying the laws of indices and logarithms to simplify and solve exponential expressions.',
    'CM-Y1-06', 1, 6)
  returning id into t_indices;

  insert into topics (subject_id, name, description, waec_code, year_group, order_index)
  values ('core_math', 'Sequences & Series',
    'Identifying and working with arithmetic and geometric progressions and their sums.',
    'CM-Y1-07', 1, 7)
  returning id into t_sequences;

  insert into topics (subject_id, name, description, waec_code, year_group, order_index)
  values ('core_math', 'Plane Geometry',
    'Properties of angles, triangles, polygons, and circles with formal geometric reasoning.',
    'CM-Y1-08', 1, 8)
  returning id into t_geometry;

  insert into topics (subject_id, name, description, waec_code, year_group, order_index)
  values ('core_math', 'Mensuration',
    'Calculating perimeters, areas, surface areas, and volumes of plane and solid figures.',
    'CM-Y1-09', 1, 9)
  returning id into t_mensuration;

  insert into topics (subject_id, name, description, waec_code, year_group, order_index)
  values ('core_math', 'Trigonometry',
    'Using trigonometric ratios and rules to solve problems involving angles and distances.',
    'CM-Y1-10', 1, 10)
  returning id into t_trig;

  insert into topics (subject_id, name, description, waec_code, year_group, order_index)
  values ('core_math', 'Statistics',
    'Collecting, organising, and interpreting data using measures of central tendency and dispersion.',
    'CM-Y1-11', 1, 11)
  returning id into t_statistics;

  insert into topics (subject_id, name, description, waec_code, year_group, order_index)
  values ('core_math', 'Probability',
    'Quantifying uncertainty using sample spaces, events, and probability rules.',
    'CM-Y1-12', 1, 12)
  returning id into t_probability;


  -- ── Set topic prerequisite chains ───────────────────────────

  update topics set prerequisite_ids = array[t_number]
    where id = t_algebra;

  update topics set prerequisite_ids = array[t_algebra]
    where id = t_linear;

  update topics set prerequisite_ids = array[t_linear]
    where id = t_simultaneous;

  update topics set prerequisite_ids = array[t_simultaneous, t_algebra]
    where id = t_quadratic;

  update topics set prerequisite_ids = array[t_algebra]
    where id = t_indices;

  update topics set prerequisite_ids = array[t_indices]
    where id = t_sequences;

  update topics set prerequisite_ids = array[t_geometry]
    where id = t_mensuration;

  update topics set prerequisite_ids = array[t_mensuration, t_geometry]
    where id = t_trig;

  update topics set prerequisite_ids = array[t_number]
    where id = t_statistics;

  update topics set prerequisite_ids = array[t_statistics]
    where id = t_probability;


  -- ── Sub-topics: Number & Numeration ─────────────────────────

  insert into sub_topics (topic_id, subject_id, name, description, order_index, difficulty_level, estimated_minutes)
  values
    (t_number, 'core_math',
     'Types of numbers (integers, rationals, irrationals)',
     'Classifying numbers into natural, whole, integer, rational, irrational, and real sets. Understanding the number line.',
     1, 1, 20),
    (t_number, 'core_math',
     'Number bases (binary, octal, denary, hexadecimal)',
     'Converting between number bases and performing arithmetic in non-denary bases.',
     2, 2, 25),
    (t_number, 'core_math',
     'Fractions, decimals and percentages',
     'Interconverting fractions, decimals, and percentages. Operations with fractions and mixed numbers.',
     3, 1, 20),
    (t_number, 'core_math',
     'Ratio and proportion',
     'Expressing and simplifying ratios. Solving problems involving direct and inverse proportion.',
     4, 2, 20),
    (t_number, 'core_math',
     'Approximation and significant figures',
     'Rounding to decimal places and significant figures. Estimating results and computing percentage error.',
     5, 1, 15);


  -- ── Sub-topics: Algebraic Expressions ───────────────────────

  insert into sub_topics (topic_id, subject_id, name, description, order_index, difficulty_level, estimated_minutes)
  values
    (t_algebra, 'core_math',
     'Simplification of algebraic expressions',
     'Collecting like terms and simplifying expressions involving addition and subtraction of algebraic terms.',
     1, 1, 20),
    (t_algebra, 'core_math',
     'Expansion of brackets',
     'Expanding single and double brackets including the square of a binomial and difference of two squares.',
     2, 1, 20),
    (t_algebra, 'core_math',
     'Factorisation (common factor, grouping)',
     'Factorising by removing the highest common factor and by grouping terms.',
     3, 2, 25),
    (t_algebra, 'core_math',
     'Factorisation (difference of two squares, trinomials)',
     'Applying special factorisation identities and factorising quadratic trinomials.',
     4, 2, 25),
    (t_algebra, 'core_math',
     'Substitution and evaluation',
     'Substituting numerical values into algebraic expressions and evaluating the results.',
     5, 1, 20);


  -- ── Sub-topics: Linear Equations & Inequalities ─────────────

  insert into sub_topics (topic_id, subject_id, name, description, order_index, difficulty_level, estimated_minutes)
  values
    (t_linear, 'core_math',
     'Solving simple linear equations',
     'Solving one-step and two-step linear equations using inverse operations.',
     1, 1, 20),
    (t_linear, 'core_math',
     'Solving linear equations with fractions',
     'Clearing denominators and solving linear equations that contain fractions or decimals.',
     2, 2, 25),
    (t_linear, 'core_math',
     'Word problems involving linear equations',
     'Translating real-world situations into linear equations and solving them.',
     3, 2, 25),
    (t_linear, 'core_math',
     'Linear inequalities and number line',
     'Solving linear inequalities, representing solutions on a number line, and combining inequalities.',
     4, 2, 20),
    (t_linear, 'core_math',
     'Absolute value equations',
     'Understanding and solving equations and inequalities involving absolute value.',
     5, 2, 25);


  -- ── Sub-topics: Simultaneous Linear Equations ───────────────

  insert into sub_topics (topic_id, subject_id, name, description, order_index, difficulty_level, estimated_minutes)
  values
    (t_simultaneous, 'core_math',
     'Elimination method',
     'Solving simultaneous equations by adding or subtracting multiples of the equations to eliminate one variable.',
     1, 2, 25),
    (t_simultaneous, 'core_math',
     'Substitution method',
     'Expressing one variable in terms of the other and substituting to find both unknowns.',
     2, 2, 25),
    (t_simultaneous, 'core_math',
     'Graphical method',
     'Plotting two linear equations on the same axes and identifying the point of intersection as the solution.',
     3, 2, 30),
    (t_simultaneous, 'core_math',
     'Word problems involving simultaneous equations',
     'Formulating and solving real-world problems that require two equations and two unknowns.',
     4, 3, 30);


  -- ── Sub-topics: Quadratic Equations ─────────────────────────

  insert into sub_topics (topic_id, subject_id, name, description, order_index, difficulty_level, estimated_minutes)
  values
    (t_quadratic, 'core_math',
     'Solving by factorisation',
     'Factorising quadratic expressions and applying the zero-product property to find roots.',
     1, 2, 25),
    (t_quadratic, 'core_math',
     'Solving by completing the square',
     'Rewriting a quadratic in vertex form by completing the square and solving for the roots.',
     2, 2, 30),
    (t_quadratic, 'core_math',
     'Solving by quadratic formula',
     'Applying the quadratic formula x = (−b ± √(b²−4ac)) / 2a to find exact roots.',
     3, 2, 25),
    (t_quadratic, 'core_math',
     'Nature of roots (discriminant)',
     'Using the discriminant b²−4ac to determine whether roots are real, equal, or complex.',
     4, 2, 25),
    (t_quadratic, 'core_math',
     'Word problems involving quadratics',
     'Modelling and solving real-world problems that lead to quadratic equations.',
     5, 3, 30),
    (t_quadratic, 'core_math',
     'Graphical interpretation of quadratics',
     'Sketching parabolas, identifying vertex, axis of symmetry, intercepts, and maximum/minimum values.',
     6, 3, 30);


  -- ── Sub-topics: Indices & Logarithms ────────────────────────

  insert into sub_topics (topic_id, subject_id, name, description, order_index, difficulty_level, estimated_minutes)
  values
    (t_indices, 'core_math',
     'Laws of indices',
     'Applying the product, quotient, and power rules for indices in simplification problems.',
     1, 2, 20),
    (t_indices, 'core_math',
     'Negative and fractional indices',
     'Understanding and evaluating expressions with negative exponents and fractional (radical) exponents.',
     2, 2, 25),
    (t_indices, 'core_math',
     'Introduction to logarithms',
     'Understanding the relationship between logarithms and exponentials: log_b(x) = y ↔ b^y = x.',
     3, 2, 20),
    (t_indices, 'core_math',
     'Laws of logarithms',
     'Applying the product, quotient, and power laws of logarithms to expand and condense expressions.',
     4, 2, 25),
    (t_indices, 'core_math',
     'Solving exponential equations',
     'Using logarithms to solve equations where the unknown is an exponent.',
     5, 2, 25),
    (t_indices, 'core_math',
     'Change of base',
     'Converting logarithms from one base to another using the change-of-base formula.',
     6, 2, 25);


  -- ── Sub-topics: Sequences & Series ──────────────────────────

  insert into sub_topics (topic_id, subject_id, name, description, order_index, difficulty_level, estimated_minutes)
  values
    (t_sequences, 'core_math',
     'Arithmetic progressions (AP)',
     'Identifying the common difference, finding the nth term (Tn = a + (n−1)d), and working with APs.',
     1, 2, 25),
    (t_sequences, 'core_math',
     'Geometric progressions (GP)',
     'Identifying the common ratio, finding the nth term (Tn = ar^(n−1)), and working with GPs.',
     2, 2, 25),
    (t_sequences, 'core_math',
     'Sum of AP and GP',
     'Calculating partial sums of arithmetic and geometric series using the sum formulas.',
     3, 2, 30),
    (t_sequences, 'core_math',
     'Word problems on sequences',
     'Translating real-world scenarios (savings plans, population growth, etc.) into sequence problems.',
     4, 3, 30);


  -- ── Sub-topics: Plane Geometry ──────────────────────────────

  insert into sub_topics (topic_id, subject_id, name, description, order_index, difficulty_level, estimated_minutes)
  values
    (t_geometry, 'core_math',
     'Angles (types, properties, parallel lines)',
     'Classifying angles, applying angle properties on straight lines, and using parallel line theorems.',
     1, 1, 20),
    (t_geometry, 'core_math',
     'Triangles (types, properties, congruence)',
     'Classifying triangles, applying angle-sum and exterior angle theorems, and proving congruence (SSS, SAS, ASA, RHS).',
     2, 2, 25),
    (t_geometry, 'core_math',
     'Polygons (interior and exterior angles)',
     'Calculating interior and exterior angles of regular and irregular polygons.',
     3, 2, 20),
    (t_geometry, 'core_math',
     'Circles (theorems, arcs, chords)',
     'Applying circle theorems: angle at centre, angles in same segment, cyclic quadrilaterals, tangents.',
     4, 2, 30),
    (t_geometry, 'core_math',
     'Loci',
     'Constructing and describing the locus of points satisfying given geometric conditions.',
     5, 2, 25);


  -- ── Sub-topics: Mensuration ──────────────────────────────────

  insert into sub_topics (topic_id, subject_id, name, description, order_index, difficulty_level, estimated_minutes)
  values
    (t_mensuration, 'core_math',
     'Perimeter and area of plane shapes',
     'Calculating perimeters and areas of rectangles, triangles, circles, trapezoids, and parallelograms.',
     1, 1, 25),
    (t_mensuration, 'core_math',
     'Surface area of solids',
     'Finding the total and lateral surface area of prisms, cylinders, pyramids, cones, and spheres.',
     2, 2, 30),
    (t_mensuration, 'core_math',
     'Volume of solids',
     'Calculating volumes of prisms, cylinders, pyramids, cones, spheres, and frustums.',
     3, 2, 30),
    (t_mensuration, 'core_math',
     'Area and volume of composite shapes',
     'Breaking complex 2D and 3D shapes into simpler components to find total area and volume.',
     4, 3, 30);


  -- ── Sub-topics: Trigonometry ─────────────────────────────────

  insert into sub_topics (topic_id, subject_id, name, description, order_index, difficulty_level, estimated_minutes)
  values
    (t_trig, 'core_math',
     'Trigonometric ratios (SOHCAHTOA)',
     'Defining sin, cos, and tan using right-angled triangles and solving for unknown sides and angles.',
     1, 2, 25),
    (t_trig, 'core_math',
     'Angles of elevation and depression',
     'Setting up and solving problems involving looking up or down at an angle from horizontal.',
     2, 2, 25),
    (t_trig, 'core_math',
     'Bearings and distances',
     'Using three-figure bearings and trigonometry to solve navigation and distance problems.',
     3, 2, 30),
    (t_trig, 'core_math',
     'Sine and cosine rules',
     'Applying the sine rule (a/sin A = b/sin B) and cosine rule (c² = a² + b² − 2ab cos C) in non-right triangles.',
     4, 2, 30),
    (t_trig, 'core_math',
     'Area of triangle using trigonometry',
     'Computing the area of any triangle using Area = ½ab sin C.',
     5, 2, 25);


  -- ── Sub-topics: Statistics ───────────────────────────────────

  insert into sub_topics (topic_id, subject_id, name, description, order_index, difficulty_level, estimated_minutes)
  values
    (t_statistics, 'core_math',
     'Data collection and presentation',
     'Types of data, methods of collection, and presenting data using pictograms, bar charts, and pie charts.',
     1, 1, 20),
    (t_statistics, 'core_math',
     'Frequency tables and histograms',
     'Constructing frequency distribution tables and drawing histograms and frequency polygons.',
     2, 2, 25),
    (t_statistics, 'core_math',
     'Measures of central tendency (mean, median, mode)',
     'Calculating mean (including from grouped data), median, and mode. Understanding when to use each.',
     3, 2, 25),
    (t_statistics, 'core_math',
     'Measures of dispersion (range, variance, standard deviation)',
     'Computing range, mean deviation, variance, and standard deviation for ungrouped and grouped data.',
     4, 2, 30),
    (t_statistics, 'core_math',
     'Cumulative frequency and ogive',
     'Drawing cumulative frequency curves (ogives) and using them to estimate median, quartiles, and percentiles.',
     5, 2, 30),
    (t_statistics, 'core_math',
     'Interpretation of statistical graphs',
     'Reading and critically interpreting bar charts, histograms, pie charts, ogives, and box-and-whisker plots.',
     6, 2, 25);


  -- ── Sub-topics: Probability ──────────────────────────────────

  insert into sub_topics (topic_id, subject_id, name, description, order_index, difficulty_level, estimated_minutes)
  values
    (t_probability, 'core_math',
     'Basic probability concepts',
     'Defining probability, the classical definition, and expressing probability as a fraction, decimal, or percentage.',
     1, 1, 20),
    (t_probability, 'core_math',
     'Sample space and events',
     'Listing sample spaces using tables and diagrams. Defining events, complements, and favourable outcomes.',
     2, 1, 20),
    (t_probability, 'core_math',
     'Addition and multiplication rules',
     'Applying P(A ∪ B) = P(A) + P(B) − P(A ∩ B) and P(A ∩ B) = P(A) × P(B|A).',
     3, 2, 25),
    (t_probability, 'core_math',
     'Mutually exclusive events',
     'Identifying mutually exclusive events and applying the simplified addition rule P(A ∪ B) = P(A) + P(B).',
     4, 2, 25),
    (t_probability, 'core_math',
     'Independent events',
     'Testing for independence and applying P(A ∩ B) = P(A) × P(B) for independent events.',
     5, 2, 25),
    (t_probability, 'core_math',
     'Tree diagrams',
     'Constructing tree diagrams for multi-stage experiments and reading probabilities along branches.',
     6, 2, 25);


end;
$$;
