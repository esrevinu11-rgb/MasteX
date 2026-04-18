/**
 * MasteX — CCP Curriculum Seed Script
 *
 * Seeds all topics and sub-topics for all 4 SHS Year 1 subjects
 * aligned with Ghana's New Common Core Programme (CCP).
 *
 * Prerequisites:
 *   - Migration 004_ccp_rebuild.sql applied in Supabase
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Run with:
 *   npx tsx scripts/seed-curriculum.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CurriculumSubTopic {
  name: string;
  description: string;
  difficulty_level: 1 | 2 | 3;
}

interface CurriculumTopic {
  subject_id: string;
  name: string;
  description: string;
  strand_name: string;
  strand_order: number;
  order_index: number;
  sub_topics: CurriculumSubTopic[];
}

// ─── Curriculum Data ──────────────────────────────────────────────────────────

const CURRICULUM: CurriculumTopic[] = [

  // ══════════════════════════════════════════════════════════════
  // CORE MATHEMATICS
  // ══════════════════════════════════════════════════════════════

  // STRAND 1: Numbers for Everyday Life
  {
    subject_id: "core_math", strand_name: "Numbers for Everyday Life", strand_order: 1,
    name: "Real Number System", order_index: 1,
    description: "Understanding and performing operations on rational and irrational numbers.",
    sub_topics: [
      { name: "Rational and irrational numbers", difficulty_level: 1, description: "Identifying and classifying rational and irrational numbers on the number line." },
      { name: "Operations on real numbers", difficulty_level: 2, description: "Adding, subtracting, multiplying and dividing rational and irrational numbers." },
      { name: "Ordering and comparing real numbers", difficulty_level: 2, description: "Arranging real numbers in ascending and descending order." },
      { name: "Real numbers in everyday contexts", difficulty_level: 2, description: "Applying real number operations to solve practical problems in finance and measurement." },
      { name: "Word problems on real numbers", difficulty_level: 3, description: "Solving real-world problems using properties of rational and irrational numbers." },
    ],
  },
  {
    subject_id: "core_math", strand_name: "Numbers for Everyday Life", strand_order: 1,
    name: "Sets and Operations", order_index: 2,
    description: "Using Venn diagrams to solve real-world problems involving two and three sets.",
    sub_topics: [
      { name: "Types of sets", difficulty_level: 1, description: "Identifying finite, infinite, empty, universal and subsets." },
      { name: "Set operations (union, intersection, complement)", difficulty_level: 2, description: "Performing union, intersection and complement operations on sets." },
      { name: "Venn diagrams with two sets", difficulty_level: 2, description: "Drawing and interpreting Venn diagrams involving two sets." },
      { name: "Venn diagrams with three sets", difficulty_level: 3, description: "Solving problems using Venn diagrams involving three overlapping sets." },
      { name: "Real-world applications of sets", difficulty_level: 3, description: "Using set theory to solve practical problems involving grouping and classification." },
    ],
  },
  {
    subject_id: "core_math", strand_name: "Numbers for Everyday Life", strand_order: 1,
    name: "Ratio, Rates and Percentages", order_index: 3,
    description: "Applying ratio, rates and percentages to business transactions including interest and VAT.",
    sub_topics: [
      { name: "Ratio and proportion", difficulty_level: 1, description: "Understanding and simplifying ratios and applying proportion to everyday situations." },
      { name: "Rates in everyday life", difficulty_level: 2, description: "Calculating and interpreting rates such as speed, unit price and exchange rates." },
      { name: "Percentages and their applications", difficulty_level: 2, description: "Converting between fractions, decimals and percentages and applying to real situations." },
      { name: "Simple interest", difficulty_level: 2, description: "Calculating simple interest on loans and savings using the SI formula." },
      { name: "Compound interest and VAT", difficulty_level: 3, description: "Calculating compound interest and Value Added Tax in business and financial contexts." },
    ],
  },
  {
    subject_id: "core_math", strand_name: "Numbers for Everyday Life", strand_order: 1,
    name: "Surds, Indices and Logarithms", order_index: 4,
    description: "Simplifying surds, solving exponential equations and performing basic logarithmic operations.",
    sub_topics: [
      { name: "Simplifying surds", difficulty_level: 2, description: "Simplifying radical expressions and performing operations on surds." },
      { name: "Laws of indices", difficulty_level: 2, description: "Applying the laws of indices to simplify expressions with positive, negative and fractional powers." },
      { name: "Solving exponential equations", difficulty_level: 3, description: "Using laws of indices to solve equations where the unknown is in the exponent." },
      { name: "Introduction to logarithms", difficulty_level: 2, description: "Understanding logarithms as the inverse of exponents and converting between forms." },
      { name: "Laws of logarithms", difficulty_level: 3, description: "Applying the product, quotient and power laws of logarithms to simplify expressions." },
    ],
  },
  {
    subject_id: "core_math", strand_name: "Numbers for Everyday Life", strand_order: 1,
    name: "Number Bases", order_index: 5,
    description: "Performing addition, subtraction and multiplication in number bases from base 2 to base 12.",
    sub_topics: [
      { name: "Understanding number bases", difficulty_level: 1, description: "Understanding place value in different number bases and converting between bases." },
      { name: "Addition in different bases", difficulty_level: 2, description: "Adding numbers in bases 2, 5, 8 and other non-decimal bases." },
      { name: "Subtraction in different bases", difficulty_level: 2, description: "Subtracting numbers in various bases with and without borrowing." },
      { name: "Multiplication in different bases", difficulty_level: 3, description: "Multiplying numbers in non-decimal bases using place value principles." },
      { name: "Real-world applications of number bases", difficulty_level: 3, description: "Applying number base conversions to computing and digital systems contexts." },
    ],
  },

  // STRAND 2: Algebraic Reasoning
  {
    subject_id: "core_math", strand_name: "Algebraic Reasoning", strand_order: 2,
    name: "Algebraic Expressions", order_index: 1,
    description: "Expanding and factorising algebraic expressions including perfect squares and algebraic fractions.",
    sub_topics: [
      { name: "Simplification of algebraic expressions", difficulty_level: 1, description: "Collecting like terms and simplifying algebraic expressions." },
      { name: "Expansion of brackets", difficulty_level: 2, description: "Expanding single and double brackets including perfect squares." },
      { name: "Factorisation (common factor and grouping)", difficulty_level: 2, description: "Factorising expressions using common factors and grouping method." },
      { name: "Factorisation (difference of squares and trinomials)", difficulty_level: 3, description: "Factorising difference of two squares and quadratic trinomials." },
      { name: "Algebraic fractions", difficulty_level: 3, description: "Simplifying, adding and subtracting algebraic fractions." },
    ],
  },
  {
    subject_id: "core_math", strand_name: "Algebraic Reasoning", strand_order: 2,
    name: "Linear Equations and Inequalities", order_index: 2,
    description: "Solving single and simultaneous linear equations and changing the subject of a formula.",
    sub_topics: [
      { name: "Solving simple linear equations", difficulty_level: 1, description: "Solving one-step and two-step linear equations with one unknown." },
      { name: "Solving linear equations with fractions", difficulty_level: 2, description: "Solving linear equations involving fractions and decimals." },
      { name: "Simultaneous linear equations", difficulty_level: 3, description: "Solving pairs of simultaneous equations using elimination and substitution methods." },
      { name: "Changing the subject of a formula", difficulty_level: 3, description: "Rearranging formulas to make a specified variable the subject." },
      { name: "Linear inequalities", difficulty_level: 2, description: "Solving and representing linear inequalities on a number line." },
    ],
  },
  {
    subject_id: "core_math", strand_name: "Algebraic Reasoning", strand_order: 2,
    name: "Relations and Functions", order_index: 3,
    description: "Distinguishing between types of mappings and plotting linear graphs.",
    sub_topics: [
      { name: "Relations and mappings", difficulty_level: 1, description: "Understanding relations and identifying one-to-one and many-to-one mappings." },
      { name: "Functions and function notation", difficulty_level: 2, description: "Defining functions, using function notation and finding values of functions." },
      { name: "Plotting linear graphs", difficulty_level: 2, description: "Drawing linear graphs from tables of values and equations." },
      { name: "Gradient and intercept", difficulty_level: 2, description: "Finding the gradient and y-intercept of a straight line graph." },
      { name: "Real-world applications of linear graphs", difficulty_level: 3, description: "Using linear graphs to model and interpret real-life situations." },
    ],
  },
  {
    subject_id: "core_math", strand_name: "Algebraic Reasoning", strand_order: 2,
    name: "Number Patterns", order_index: 4,
    description: "Identifying sequences and understanding the rules behind number growth patterns.",
    sub_topics: [
      { name: "Identifying number patterns", difficulty_level: 1, description: "Recognising and extending number patterns and sequences." },
      { name: "Arithmetic sequences", difficulty_level: 2, description: "Finding terms and the nth term of arithmetic progressions." },
      { name: "Geometric sequences", difficulty_level: 3, description: "Finding terms and the nth term of geometric progressions." },
      { name: "Real-world applications of sequences", difficulty_level: 3, description: "Applying sequences to model population growth, savings and other real-life contexts." },
    ],
  },

  // STRAND 3: Geometry Around Us
  {
    subject_id: "core_math", strand_name: "Geometry Around Us", strand_order: 3,
    name: "Plane Geometry", order_index: 1,
    description: "Understanding properties of polygons and circle theorems involving angles and chords.",
    sub_topics: [
      { name: "Properties of triangles and polygons", difficulty_level: 1, description: "Identifying and applying properties of triangles, quadrilaterals and other polygons." },
      { name: "Angles in parallel lines", difficulty_level: 2, description: "Identifying and calculating alternate, corresponding and co-interior angles." },
      { name: "Circle theorems (angles and arcs)", difficulty_level: 3, description: "Applying circle theorems involving angles subtended by arcs at the centre and circumference." },
      { name: "Circle theorems (chords and tangents)", difficulty_level: 3, description: "Applying theorems involving chords, tangents and cyclic quadrilaterals." },
      { name: "Geometric proofs", difficulty_level: 3, description: "Writing simple geometric proofs using angle properties and circle theorems." },
    ],
  },
  {
    subject_id: "core_math", strand_name: "Geometry Around Us", strand_order: 3,
    name: "Trigonometry", order_index: 2,
    description: "Understanding sine, cosine and tangent ratios and solving problems involving elevation and depression.",
    sub_topics: [
      { name: "Trigonometric ratios (SOHCAHTOA)", difficulty_level: 1, description: "Defining and calculating sine, cosine and tangent ratios in right-angled triangles." },
      { name: "Finding sides using trigonometry", difficulty_level: 2, description: "Using trigonometric ratios to find unknown sides in right-angled triangles." },
      { name: "Finding angles using trigonometry", difficulty_level: 2, description: "Using inverse trigonometric ratios to find unknown angles." },
      { name: "Angles of elevation and depression", difficulty_level: 2, description: "Solving real-world problems involving angles of elevation and depression." },
      { name: "Bearings and trigonometry", difficulty_level: 3, description: "Using trigonometry to solve problems involving bearings and distances." },
    ],
  },
  {
    subject_id: "core_math", strand_name: "Geometry Around Us", strand_order: 3,
    name: "Mensuration", order_index: 3,
    description: "Calculating perimeter and area of plane shapes and volume of prisms.",
    sub_topics: [
      { name: "Perimeter of plane shapes", difficulty_level: 1, description: "Calculating the perimeter of rectangles, triangles, circles and composite shapes." },
      { name: "Area of plane shapes", difficulty_level: 2, description: "Calculating the area of triangles, quadrilaterals, circles and composite shapes." },
      { name: "Volume of prisms", difficulty_level: 2, description: "Calculating the volume of cuboids, cylinders and triangular prisms." },
      { name: "Surface area of solids", difficulty_level: 3, description: "Calculating the surface area of cubes, cuboids, cylinders and other prisms." },
      { name: "Real-world mensuration problems", difficulty_level: 3, description: "Solving practical problems involving area, perimeter and volume in Ghanaian contexts." },
    ],
  },
  {
    subject_id: "core_math", strand_name: "Geometry Around Us", strand_order: 3,
    name: "Vectors and Transformation", order_index: 4,
    description: "Representing vectors in a 2D plane and performing rigid motion transformations.",
    sub_topics: [
      { name: "Introduction to vectors", difficulty_level: 1, description: "Understanding vectors as quantities with magnitude and direction in a 2D plane." },
      { name: "Vector operations", difficulty_level: 2, description: "Adding, subtracting and multiplying vectors by scalars." },
      { name: "Reflection", difficulty_level: 2, description: "Performing reflections in the x-axis, y-axis and the line y=x." },
      { name: "Rotation and translation", difficulty_level: 2, description: "Performing rotations about the origin and translations using column vectors." },
      { name: "Combined transformations", difficulty_level: 3, description: "Performing and describing combined transformations on shapes." },
    ],
  },

  // STRAND 4: Making Sense of and Using Data
  {
    subject_id: "core_math", strand_name: "Making Sense of and Using Data", strand_order: 4,
    name: "Statistical Reasoning", order_index: 1,
    description: "Collecting data and organising it using frequency distribution tables.",
    sub_topics: [
      { name: "Data collection methods", difficulty_level: 1, description: "Understanding primary and secondary data collection methods including surveys and experiments." },
      { name: "Frequency distribution tables", difficulty_level: 1, description: "Organising raw data into ungrouped and grouped frequency distribution tables." },
      { name: "Measures of central tendency", difficulty_level: 2, description: "Calculating mean, median and mode from raw data and frequency tables." },
      { name: "Measures of dispersion", difficulty_level: 3, description: "Calculating range, variance and standard deviation to describe spread of data." },
      { name: "Real-world statistical problems", difficulty_level: 3, description: "Using statistical measures to analyse and interpret data from Ghanaian contexts." },
    ],
  },
  {
    subject_id: "core_math", strand_name: "Making Sense of and Using Data", strand_order: 4,
    name: "Data Representation", order_index: 2,
    description: "Interpreting various charts and graphs to make inferences and draw conclusions.",
    sub_topics: [
      { name: "Bar charts and pie charts", difficulty_level: 1, description: "Drawing and interpreting bar charts and pie charts from given data." },
      { name: "Histograms and frequency polygons", difficulty_level: 2, description: "Drawing histograms and frequency polygons from frequency distribution tables." },
      { name: "Cumulative frequency graphs", difficulty_level: 3, description: "Drawing ogives and using them to find median, quartiles and percentiles." },
      { name: "Interpreting statistical graphs", difficulty_level: 2, description: "Reading, interpreting and drawing conclusions from various statistical graphs." },
      { name: "Misleading graphs and critical analysis", difficulty_level: 3, description: "Identifying misleading representations of data and critically evaluating statistics." },
    ],
  },
  {
    subject_id: "core_math", strand_name: "Making Sense of and Using Data", strand_order: 4,
    name: "Probability", order_index: 3,
    description: "Understanding likelihood of independent events and using sample spaces to predict outcomes.",
    sub_topics: [
      { name: "Basic probability concepts", difficulty_level: 1, description: "Understanding probability as a measure of likelihood and expressing it as a fraction." },
      { name: "Sample spaces and events", difficulty_level: 1, description: "Listing sample spaces and identifying events for simple experiments." },
      { name: "Probability of single events", difficulty_level: 2, description: "Calculating the probability of simple events using the probability formula." },
      { name: "Independent events", difficulty_level: 3, description: "Calculating the probability of two independent events occurring together." },
      { name: "Real-world probability problems", difficulty_level: 3, description: "Applying probability to make predictions in real-life Ghanaian contexts." },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // ENGLISH LANGUAGE
  // ══════════════════════════════════════════════════════════════

  // STRAND 1: Oral Language
  {
    subject_id: "english", strand_name: "Oral Language", strand_order: 1,
    name: "Vowel and Consonant Segments", order_index: 1,
    description: "Identifying and producing vowel and consonant sounds in English.",
    sub_topics: [
      { name: "Pure vowel sounds", difficulty_level: 1, description: "Identifying and producing the 12 pure vowel sounds in English." },
      { name: "Diphthong sounds", difficulty_level: 2, description: "Identifying and producing the 8 diphthong sounds in English." },
      { name: "Consonant sounds", difficulty_level: 1, description: "Identifying and producing all consonant sounds including problematic ones for Ghanaians." },
      { name: "Minimal pairs", difficulty_level: 2, description: "Distinguishing between words that differ by only one sound." },
      { name: "Sounds in context", difficulty_level: 3, description: "Identifying and producing sounds correctly in connected speech." },
    ],
  },
  {
    subject_id: "english", strand_name: "Oral Language", strand_order: 1,
    name: "Word Stress", order_index: 2,
    description: "Understanding and applying word stress patterns in English.",
    sub_topics: [
      { name: "Stress in two-syllable words", difficulty_level: 1, description: "Identifying the stressed syllable in two-syllable nouns and verbs." },
      { name: "Stress in multi-syllable words", difficulty_level: 2, description: "Applying stress rules to words with three or more syllables." },
      { name: "Stress shift in related words", difficulty_level: 3, description: "Understanding how stress shifts when words change their grammatical class." },
      { name: "Contrastive stress", difficulty_level: 3, description: "Using stress to emphasise and contrast ideas in speech." },
    ],
  },
  {
    subject_id: "english", strand_name: "Oral Language", strand_order: 1,
    name: "Intonation Patterns", order_index: 3,
    description: "Using rising and falling intonation patterns correctly in speech.",
    sub_topics: [
      { name: "Falling intonation", difficulty_level: 1, description: "Using falling intonation in statements and wh-questions." },
      { name: "Rising intonation", difficulty_level: 2, description: "Using rising intonation in yes/no questions and incomplete utterances." },
      { name: "Intonation in lists", difficulty_level: 2, description: "Applying correct intonation when listing items in speech." },
      { name: "Intonation and meaning", difficulty_level: 3, description: "Understanding how intonation changes the meaning of utterances." },
    ],
  },

  // STRAND 2: Reading and Summary
  {
    subject_id: "english", strand_name: "Reading and Summary", strand_order: 2,
    name: "Skimming and Scanning", order_index: 1,
    description: "Using skimming and scanning strategies to read texts efficiently.",
    sub_topics: [
      { name: "Skimming for gist", difficulty_level: 1, description: "Reading quickly to get the general idea of a text." },
      { name: "Scanning for specific information", difficulty_level: 1, description: "Reading to locate specific facts, names or figures in a text." },
      { name: "Predicting content from headings", difficulty_level: 2, description: "Using titles, headings and subheadings to predict text content." },
      { name: "Reading strategies in combination", difficulty_level: 3, description: "Using multiple reading strategies together to comprehend complex texts." },
    ],
  },
  {
    subject_id: "english", strand_name: "Reading and Summary", strand_order: 2,
    name: "Purposeful Reading", order_index: 2,
    description: "Reading and comprehending texts of up to 350 words for specific purposes.",
    sub_topics: [
      { name: "Reading for literal meaning", difficulty_level: 1, description: "Identifying facts and details explicitly stated in a text." },
      { name: "Reading for implied meaning", difficulty_level: 2, description: "Making inferences about ideas not directly stated in a text." },
      { name: "Understanding writer's purpose and tone", difficulty_level: 3, description: "Identifying the writer's purpose, attitude and tone in a passage." },
      { name: "Critical evaluation of texts", difficulty_level: 3, description: "Evaluating the effectiveness and credibility of a written text." },
    ],
  },
  {
    subject_id: "english", strand_name: "Reading and Summary", strand_order: 2,
    name: "Summary Writing", order_index: 3,
    description: "Writing concise and accurate summaries of passages.",
    sub_topics: [
      { name: "Identifying main ideas", difficulty_level: 1, description: "Distinguishing between main ideas and supporting details in a text." },
      { name: "Paraphrasing effectively", difficulty_level: 2, description: "Restating ideas in your own words without changing the meaning." },
      { name: "Writing a structured summary", difficulty_level: 3, description: "Writing a coherent summary that captures all key points within a word limit." },
      { name: "Avoiding common summary errors", difficulty_level: 2, description: "Identifying and avoiding lifting, padding and irrelevant details in summaries." },
    ],
  },

  // STRAND 3: Grammar
  {
    subject_id: "english", strand_name: "Grammar", strand_order: 3,
    name: "Parts of Speech and Phrases", order_index: 1,
    description: "Identifying and using parts of speech and phrases correctly in sentences.",
    sub_topics: [
      { name: "Nouns, pronouns and adjectives", difficulty_level: 1, description: "Identifying and using nouns, pronouns and adjectives correctly." },
      { name: "Verbs, adverbs and prepositions", difficulty_level: 1, description: "Identifying and using verbs, adverbs and prepositions correctly." },
      { name: "Conjunctions and interjections", difficulty_level: 2, description: "Using conjunctions to join clauses and sentences effectively." },
      { name: "Noun phrases and verb phrases", difficulty_level: 2, description: "Identifying and constructing noun and verb phrases." },
      { name: "Prepositional and adverbial phrases", difficulty_level: 3, description: "Using prepositional and adverbial phrases to add detail to sentences." },
    ],
  },
  {
    subject_id: "english", strand_name: "Grammar", strand_order: 3,
    name: "Clauses and Sentence Structure", order_index: 2,
    description: "Understanding clause types and constructing varied sentence structures.",
    sub_topics: [
      { name: "Main and subordinate clauses", difficulty_level: 2, description: "Identifying main and subordinate clauses in complex sentences." },
      { name: "Types of sentences", difficulty_level: 1, description: "Identifying and constructing simple, compound and complex sentences." },
      { name: "Relative clauses", difficulty_level: 3, description: "Using defining and non-defining relative clauses correctly." },
      { name: "Sentence combining", difficulty_level: 3, description: "Combining simple sentences into more complex structures." },
    ],
  },
  {
    subject_id: "english", strand_name: "Grammar", strand_order: 3,
    name: "Tense and Aspect", order_index: 3,
    description: "Using tenses and aspects correctly to express time and duration.",
    sub_topics: [
      { name: "Simple tenses", difficulty_level: 1, description: "Using simple present, past and future tenses correctly." },
      { name: "Continuous aspect", difficulty_level: 2, description: "Using present, past and future continuous tenses correctly." },
      { name: "Perfect aspect", difficulty_level: 2, description: "Using present, past and future perfect tenses correctly." },
      { name: "Mixed tenses in context", difficulty_level: 3, description: "Using appropriate tenses in extended writing and speech." },
    ],
  },
  {
    subject_id: "english", strand_name: "Grammar", strand_order: 3,
    name: "Reported Speech and Conditionals", order_index: 4,
    description: "Converting between direct and reported speech and using conditional sentences.",
    sub_topics: [
      { name: "Direct and reported speech", difficulty_level: 2, description: "Converting statements, questions and commands from direct to reported speech." },
      { name: "Tense changes in reported speech", difficulty_level: 2, description: "Applying correct tense backshift when converting to reported speech." },
      { name: "Zero and first conditionals", difficulty_level: 2, description: "Using zero and first conditional sentences for facts and real possibilities." },
      { name: "Second and third conditionals", difficulty_level: 3, description: "Using second and third conditional sentences for hypothetical situations." },
    ],
  },

  // STRAND 4: Writing
  {
    subject_id: "english", strand_name: "Writing", strand_order: 4,
    name: "Paragraph Development", order_index: 1,
    description: "Writing well-structured paragraphs with clear topic sentences and supporting details.",
    sub_topics: [
      { name: "Topic sentence and supporting details", difficulty_level: 1, description: "Writing a clear topic sentence and developing it with relevant supporting details." },
      { name: "Paragraph unity and coherence", difficulty_level: 2, description: "Ensuring all sentences in a paragraph relate to the main idea." },
      { name: "Linking ideas within paragraphs", difficulty_level: 2, description: "Using transition words and phrases to connect ideas smoothly." },
      { name: "Concluding sentences", difficulty_level: 3, description: "Writing effective concluding sentences that reinforce the paragraph's main idea." },
    ],
  },
  {
    subject_id: "english", strand_name: "Writing", strand_order: 4,
    name: "Argumentative and Descriptive Essays", order_index: 2,
    description: "Planning and composing argumentative and descriptive essays.",
    sub_topics: [
      { name: "Structure of an argumentative essay", difficulty_level: 1, description: "Understanding the introduction, body and conclusion structure of argument essays." },
      { name: "Writing a thesis statement", difficulty_level: 2, description: "Crafting a clear and arguable thesis statement for an essay." },
      { name: "Building arguments with evidence", difficulty_level: 3, description: "Supporting arguments with relevant examples, facts and logical reasoning." },
      { name: "Descriptive writing techniques", difficulty_level: 2, description: "Using sensory details, vivid language and figurative devices in descriptive writing." },
      { name: "Planning and drafting essays", difficulty_level: 3, description: "Using planning strategies to organise and draft well-structured essays." },
    ],
  },
  {
    subject_id: "english", strand_name: "Writing", strand_order: 4,
    name: "Letters and Reports", order_index: 3,
    description: "Writing formal and informal letters and structured reports.",
    sub_topics: [
      { name: "Format of formal letters", difficulty_level: 1, description: "Applying the correct format and conventions of formal letter writing." },
      { name: "Format of informal letters", difficulty_level: 1, description: "Applying appropriate tone and structure in informal letter writing." },
      { name: "Writing a formal letter", difficulty_level: 2, description: "Composing a formal letter for a specific purpose such as application or complaint." },
      { name: "Structure of a report", difficulty_level: 2, description: "Understanding and applying the structure of a formal report." },
      { name: "Writing a report", difficulty_level: 3, description: "Composing a well-structured report on a given topic or situation." },
    ],
  },

  // STRAND 5: Literature
  {
    subject_id: "english", strand_name: "Literature", strand_order: 5,
    name: "Introduction to Literary Genres", order_index: 1,
    description: "Understanding the characteristics of prose, poetry and drama as literary genres.",
    sub_topics: [
      { name: "Features of prose", difficulty_level: 1, description: "Identifying the key features of prose fiction including plot, character and setting." },
      { name: "Features of poetry", difficulty_level: 1, description: "Identifying key features of poetry including rhyme, rhythm and imagery." },
      { name: "Features of drama", difficulty_level: 1, description: "Identifying key features of drama including dialogue, stage directions and acts." },
      { name: "Comparing genres", difficulty_level: 3, description: "Comparing how different genres treat similar themes and ideas." },
    ],
  },
  {
    subject_id: "english", strand_name: "Literature", strand_order: 5,
    name: "Oral Literature and Text Analysis", order_index: 2,
    description: "Analysing oral literature and selected written texts.",
    sub_topics: [
      { name: "Folktales and their features", difficulty_level: 1, description: "Identifying the features and moral lessons of Ghanaian folktales." },
      { name: "Myths and legends", difficulty_level: 2, description: "Distinguishing between myths, legends and folktales in African oral tradition." },
      { name: "Themes in oral literature", difficulty_level: 2, description: "Identifying themes of justice, community and wisdom in oral literary texts." },
      { name: "Analysis of selected prose text", difficulty_level: 3, description: "Analysing plot, character, theme and style in a selected prose text." },
      { name: "Analysis of selected poem", difficulty_level: 3, description: "Analysing theme, imagery, tone and poetic devices in a selected poem." },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // SOCIAL STUDIES
  // ══════════════════════════════════════════════════════════════

  // STRAND 1: Identity and Purpose
  {
    subject_id: "social_studies", strand_name: "Identity and Purpose", strand_order: 1,
    name: "Geographical Sketch of Africa", order_index: 1,
    description: "Understanding the physical geography of Africa and Ghana's place within it.",
    sub_topics: [
      { name: "Location and size of Africa", difficulty_level: 1, description: "Describing Africa's location, size and position relative to other continents." },
      { name: "Physical features of Africa", difficulty_level: 1, description: "Identifying major physical features of Africa including rivers, mountains and deserts." },
      { name: "Climate and vegetation zones", difficulty_level: 2, description: "Describing Africa's major climate and vegetation zones and their characteristics." },
      { name: "Ghana's geographical features", difficulty_level: 2, description: "Identifying Ghana's location, physical features, regions and neighbouring countries." },
      { name: "Human geography of Africa", difficulty_level: 3, description: "Analysing how geography influences settlement, economic activity and culture." },
    ],
  },
  {
    subject_id: "social_studies", strand_name: "Identity and Purpose", strand_order: 1,
    name: "Historical Sketch of Africa", order_index: 2,
    description: "Understanding key periods in African history and their significance.",
    sub_topics: [
      { name: "Ancient African civilisations", difficulty_level: 1, description: "Describing the achievements of ancient African civilisations including Egypt and Mali." },
      { name: "Pre-colonial Ghana", difficulty_level: 2, description: "Describing the major pre-colonial states of Ghana including Asante and Fante." },
      { name: "The slave trade and its impact", difficulty_level: 2, description: "Explaining the causes and effects of the transatlantic slave trade on Africa." },
      { name: "Colonialism in Africa", difficulty_level: 2, description: "Describing the causes and effects of European colonisation of Africa." },
      { name: "Independence movements", difficulty_level: 3, description: "Analysing the factors that led to African independence movements." },
    ],
  },
  {
    subject_id: "social_studies", strand_name: "Identity and Purpose", strand_order: 1,
    name: "National Identity and Cohesion", order_index: 3,
    description: "Understanding Ghanaian national identity and the importance of national cohesion.",
    sub_topics: [
      { name: "Elements of national identity", difficulty_level: 1, description: "Identifying the symbols, values and institutions that define Ghanaian identity." },
      { name: "Ghana's national symbols", difficulty_level: 1, description: "Describing the significance of Ghana's flag, coat of arms, anthem and currency." },
      { name: "Unity in diversity", difficulty_level: 2, description: "Appreciating how ethnic, religious and cultural diversity enriches Ghana." },
      { name: "Threats to national cohesion", difficulty_level: 3, description: "Identifying and analysing threats to national unity in Ghana." },
      { name: "Building national cohesion", difficulty_level: 3, description: "Proposing strategies for promoting national unity and cohesion in Ghana." },
    ],
  },

  // STRAND 2: Law and Order
  {
    subject_id: "social_studies", strand_name: "Law and Order", strand_order: 2,
    name: "Civic Ideals and Practices", order_index: 1,
    description: "Understanding civic values and democratic practices in Ghana.",
    sub_topics: [
      { name: "Meaning and importance of civic ideals", difficulty_level: 1, description: "Explaining civic ideals such as justice, equality and freedom." },
      { name: "Democratic values in Ghana", difficulty_level: 2, description: "Identifying and explaining the core democratic values practised in Ghana." },
      { name: "Rights and responsibilities of citizens", difficulty_level: 2, description: "Distinguishing between rights and responsibilities of Ghanaian citizens." },
      { name: "Civic participation", difficulty_level: 3, description: "Analysing ways citizens can participate in governance and community development." },
      { name: "Youth and civic responsibility", difficulty_level: 3, description: "Evaluating the role of young people in promoting civic values in Ghana." },
    ],
  },
  {
    subject_id: "social_studies", strand_name: "Law and Order", strand_order: 2,
    name: "Law Enforcement in Ghana", order_index: 2,
    description: "Understanding law enforcement institutions and mechanisms in Ghana.",
    sub_topics: [
      { name: "The rule of law", difficulty_level: 1, description: "Explaining the meaning and importance of the rule of law in Ghana." },
      { name: "Law enforcement agencies", difficulty_level: 1, description: "Identifying and describing the roles of Ghana Police, Military and other agencies." },
      { name: "The court system in Ghana", difficulty_level: 2, description: "Describing the structure and functions of Ghana's court system." },
      { name: "Human rights and law enforcement", difficulty_level: 3, description: "Analysing the balance between law enforcement and human rights protection." },
      { name: "Community policing", difficulty_level: 3, description: "Evaluating the effectiveness of community policing in Ghana." },
    ],
  },
  {
    subject_id: "social_studies", strand_name: "Law and Order", strand_order: 2,
    name: "Rights and Responsibilities", order_index: 3,
    description: "Understanding the rights and responsibilities of citizens under Ghana's constitution.",
    sub_topics: [
      { name: "Fundamental human rights", difficulty_level: 1, description: "Identifying the fundamental human rights guaranteed by Ghana's constitution." },
      { name: "Constitutional responsibilities", difficulty_level: 2, description: "Describing the responsibilities of citizens as outlined in the constitution." },
      { name: "Children's rights", difficulty_level: 2, description: "Identifying and explaining the rights of children in Ghana." },
      { name: "Women's rights and gender equality", difficulty_level: 3, description: "Analysing the status of women's rights and gender equality in Ghana." },
      { name: "Protecting human rights", difficulty_level: 3, description: "Evaluating the role of institutions like CHRAJ in protecting human rights." },
    ],
  },

  // STRAND 3: Ethics and Human Development
  {
    subject_id: "social_studies", strand_name: "Ethics and Human Development", strand_order: 3,
    name: "Indigenous Knowledge Systems", order_index: 1,
    description: "Understanding and appreciating indigenous knowledge systems in Ghana and Africa.",
    sub_topics: [
      { name: "Meaning of indigenous knowledge", difficulty_level: 1, description: "Defining indigenous knowledge and explaining its importance to communities." },
      { name: "Forms of indigenous knowledge in Ghana", difficulty_level: 2, description: "Identifying forms of indigenous knowledge including farming, medicine and crafts." },
      { name: "Indigenous knowledge and science", difficulty_level: 3, description: "Comparing indigenous knowledge with modern scientific knowledge." },
      { name: "Preserving indigenous knowledge", difficulty_level: 3, description: "Proposing strategies for documenting and preserving indigenous knowledge systems." },
    ],
  },
  {
    subject_id: "social_studies", strand_name: "Ethics and Human Development", strand_order: 3,
    name: "Ethics and Moral Values", order_index: 2,
    description: "Understanding ethical principles and moral values in Ghanaian society.",
    sub_topics: [
      { name: "Meaning of ethics and morality", difficulty_level: 1, description: "Defining ethics and morality and explaining their importance in society." },
      { name: "Ghanaian moral values", difficulty_level: 1, description: "Identifying core moral values in Ghanaian culture such as respect and honesty." },
      { name: "Ethics in everyday life", difficulty_level: 2, description: "Applying ethical principles to everyday situations in school and community." },
      { name: "Ethical dilemmas", difficulty_level: 3, description: "Analysing ethical dilemmas and proposing reasoned solutions." },
      { name: "Ethics and national development", difficulty_level: 3, description: "Evaluating how ethical behaviour contributes to national development." },
    ],
  },
  {
    subject_id: "social_studies", strand_name: "Ethics and Human Development", strand_order: 3,
    name: "African Civilisations", order_index: 3,
    description: "Studying the achievements and contributions of African civilisations.",
    sub_topics: [
      { name: "Ancient Egypt", difficulty_level: 1, description: "Describing the achievements of ancient Egyptian civilisation in science and culture." },
      { name: "Mali and Songhai Empires", difficulty_level: 2, description: "Describing the political and economic achievements of the Mali and Songhai empires." },
      { name: "Great Zimbabwe", difficulty_level: 2, description: "Explaining the significance of Great Zimbabwe as an African civilisation." },
      { name: "Contributions of African civilisations", difficulty_level: 3, description: "Analysing Africa's contributions to world civilisation and knowledge." },
    ],
  },

  // STRAND 4: Production and Exchange
  {
    subject_id: "social_studies", strand_name: "Production and Exchange", strand_order: 4,
    name: "Economic Activities in Africa", order_index: 1,
    description: "Understanding the main economic activities in Africa and their significance.",
    sub_topics: [
      { name: "Types of economic activities", difficulty_level: 1, description: "Classifying economic activities into primary, secondary and tertiary sectors." },
      { name: "Agriculture in Africa", difficulty_level: 1, description: "Describing the importance and types of agriculture practised across Africa." },
      { name: "Mining and natural resources", difficulty_level: 2, description: "Explaining the role of mining and natural resources in African economies." },
      { name: "Trade in Africa", difficulty_level: 2, description: "Describing traditional and modern trade patterns within Africa." },
      { name: "Economic challenges in Africa", difficulty_level: 3, description: "Analysing the major economic challenges facing African countries." },
    ],
  },
  {
    subject_id: "social_studies", strand_name: "Production and Exchange", strand_order: 4,
    name: "Entrepreneurship and Workplace Culture", order_index: 2,
    description: "Understanding entrepreneurship and professional workplace values.",
    sub_topics: [
      { name: "Meaning of entrepreneurship", difficulty_level: 1, description: "Defining entrepreneurship and identifying qualities of a successful entrepreneur." },
      { name: "Types of businesses in Ghana", difficulty_level: 1, description: "Identifying and describing different types of businesses operating in Ghana." },
      { name: "Starting a small business", difficulty_level: 2, description: "Describing the basic steps involved in starting a small business in Ghana." },
      { name: "Workplace culture and ethics", difficulty_level: 2, description: "Explaining the importance of professionalism and ethics in the workplace." },
      { name: "Youth entrepreneurship", difficulty_level: 3, description: "Evaluating opportunities and challenges for young entrepreneurs in Ghana." },
    ],
  },
  {
    subject_id: "social_studies", strand_name: "Production and Exchange", strand_order: 4,
    name: "Productivity and Innovation", order_index: 3,
    description: "Understanding the importance of productivity and innovation in development.",
    sub_topics: [
      { name: "Meaning of productivity", difficulty_level: 1, description: "Defining productivity and explaining its importance to individuals and nations." },
      { name: "Factors affecting productivity", difficulty_level: 2, description: "Identifying factors that increase or decrease productivity in the workplace." },
      { name: "Innovation and technology", difficulty_level: 2, description: "Explaining how innovation and technology improve productivity and quality of life." },
      { name: "Ghana's productivity challenges", difficulty_level: 3, description: "Analysing the factors that limit productivity in Ghana and proposing solutions." },
    ],
  },

  // STRAND 5: Financial Literacy
  {
    subject_id: "social_studies", strand_name: "Financial Literacy", strand_order: 5,
    name: "Consumer Rights and Protection", order_index: 1,
    description: "Understanding consumer rights and mechanisms for consumer protection in Ghana.",
    sub_topics: [
      { name: "Rights of consumers", difficulty_level: 1, description: "Identifying the basic rights of consumers in Ghana." },
      { name: "Consumer responsibilities", difficulty_level: 1, description: "Describing the responsibilities of consumers in the marketplace." },
      { name: "Consumer protection agencies in Ghana", difficulty_level: 2, description: "Identifying agencies like Ghana Standards Authority that protect consumers." },
      { name: "Dealing with consumer complaints", difficulty_level: 2, description: "Describing how to make a consumer complaint effectively." },
      { name: "Online consumer protection", difficulty_level: 3, description: "Identifying risks and protections for consumers in online transactions." },
    ],
  },
  {
    subject_id: "social_studies", strand_name: "Financial Literacy", strand_order: 5,
    name: "Savings Culture", order_index: 2,
    description: "Understanding the importance of saving and developing good savings habits.",
    sub_topics: [
      { name: "Importance of saving", difficulty_level: 1, description: "Explaining why saving money is important for individuals and families." },
      { name: "Methods of saving in Ghana", difficulty_level: 1, description: "Identifying different ways of saving including banks, susu and mobile money." },
      { name: "Factors affecting saving", difficulty_level: 2, description: "Analysing factors that encourage or discourage saving behaviour." },
      { name: "Developing a savings plan", difficulty_level: 3, description: "Creating a personal savings plan based on income and financial goals." },
    ],
  },
  {
    subject_id: "social_studies", strand_name: "Financial Literacy", strand_order: 5,
    name: "Financial Security", order_index: 3,
    description: "Understanding financial planning and strategies for achieving financial security.",
    sub_topics: [
      { name: "Meaning of financial security", difficulty_level: 1, description: "Explaining financial security and why it matters for individuals and families." },
      { name: "Budgeting and financial planning", difficulty_level: 2, description: "Creating a simple budget to manage income and expenses effectively." },
      { name: "Insurance and risk management", difficulty_level: 2, description: "Explaining how insurance protects against financial risk." },
      { name: "Investment options in Ghana", difficulty_level: 3, description: "Identifying and evaluating investment options available to young Ghanaians." },
      { name: "Financial security for young people", difficulty_level: 3, description: "Developing strategies for achieving financial security as a young Ghanaian." },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // INTEGRATED SCIENCE
  // ══════════════════════════════════════════════════════════════

  // STRAND 1: Exploring Materials
  {
    subject_id: "integrated_science", strand_name: "Exploring Materials", strand_order: 1,
    name: "Characteristics of Science", order_index: 1,
    description: "Understanding the nature of science and the scientific method.",
    sub_topics: [
      { name: "What is science", difficulty_level: 1, description: "Defining science and describing its characteristics and branches." },
      { name: "Scientific method", difficulty_level: 1, description: "Identifying and applying the steps of the scientific method." },
      { name: "Scientific project design", difficulty_level: 2, description: "Designing a simple scientific investigation with hypothesis and variables." },
      { name: "Data collection and analysis", difficulty_level: 2, description: "Collecting, recording and analysing data from scientific investigations." },
      { name: "Science safety and ethics", difficulty_level: 2, description: "Applying safety rules and ethical principles in scientific investigations." },
    ],
  },
  {
    subject_id: "integrated_science", strand_name: "Exploring Materials", strand_order: 1,
    name: "Periodic Table Properties", order_index: 2,
    description: "Understanding the organisation and properties of elements in the periodic table.",
    sub_topics: [
      { name: "Structure of the periodic table", difficulty_level: 1, description: "Describing how elements are organised in periods and groups." },
      { name: "Properties of metals and non-metals", difficulty_level: 2, description: "Comparing the physical and chemical properties of metals and non-metals." },
      { name: "Trends in the periodic table", difficulty_level: 3, description: "Describing trends in atomic radius, ionisation energy and electronegativity." },
      { name: "Uses of elements in Ghana", difficulty_level: 2, description: "Identifying uses of common elements in Ghanaian industries and everyday life." },
    ],
  },

  // STRAND 2: Energy Forms
  {
    subject_id: "integrated_science", strand_name: "Energy Forms", strand_order: 2,
    name: "Solar Energy in Ghana", order_index: 1,
    description: "Understanding solar energy and its applications in Ghana.",
    sub_topics: [
      { name: "The sun as an energy source", difficulty_level: 1, description: "Explaining how the sun produces energy and its importance to life on earth." },
      { name: "Solar energy technology", difficulty_level: 2, description: "Describing how solar panels convert sunlight into electrical energy." },
      { name: "Solar energy installation in Ghana", difficulty_level: 2, description: "Describing the process of installing and maintaining solar energy systems." },
      { name: "Benefits of solar energy for Ghana", difficulty_level: 3, description: "Evaluating the economic and environmental benefits of solar energy adoption in Ghana." },
    ],
  },
  {
    subject_id: "integrated_science", strand_name: "Energy Forms", strand_order: 2,
    name: "Fossil Fuels and Energy Sources", order_index: 2,
    description: "Understanding fossil fuels and comparing different energy sources.",
    sub_topics: [
      { name: "Types of fossil fuels", difficulty_level: 1, description: "Identifying coal, oil and natural gas as fossil fuels and explaining their formation." },
      { name: "Uses of fossil fuels in Ghana", difficulty_level: 1, description: "Describing how fossil fuels are used in Ghana for energy and industry." },
      { name: "Environmental impact of fossil fuels", difficulty_level: 2, description: "Explaining the environmental problems caused by burning fossil fuels." },
      { name: "Comparing energy sources", difficulty_level: 3, description: "Comparing renewable and non-renewable energy sources in terms of cost and impact." },
    ],
  },

  // STRAND 3: Forces and Mechanisms
  {
    subject_id: "integrated_science", strand_name: "Forces and Mechanisms", strand_order: 3,
    name: "Types of Forces", order_index: 1,
    description: "Understanding different types of forces and their effects on objects.",
    sub_topics: [
      { name: "Contact and non-contact forces", difficulty_level: 1, description: "Distinguishing between contact forces and non-contact forces with examples." },
      { name: "Gravity and weight", difficulty_level: 2, description: "Explaining gravity and calculating weight using W = mg." },
      { name: "Friction", difficulty_level: 2, description: "Explaining friction, its types and its effects on motion." },
      { name: "Effects of forces on objects", difficulty_level: 2, description: "Describing how forces change the shape, speed or direction of objects." },
      { name: "Forces in Ghanaian contexts", difficulty_level: 3, description: "Analysing how forces are applied in local industries and everyday activities." },
    ],
  },
  {
    subject_id: "integrated_science", strand_name: "Forces and Mechanisms", strand_order: 3,
    name: "Speed, Velocity and Acceleration", order_index: 2,
    description: "Calculating and interpreting speed, velocity and acceleration.",
    sub_topics: [
      { name: "Distance and displacement", difficulty_level: 1, description: "Distinguishing between scalar and vector quantities using distance and displacement." },
      { name: "Speed and velocity", difficulty_level: 2, description: "Calculating speed and velocity using the formula v = d/t." },
      { name: "Acceleration", difficulty_level: 2, description: "Calculating acceleration using a = (v-u)/t and interpreting its meaning." },
      { name: "Distance-time and velocity-time graphs", difficulty_level: 3, description: "Drawing and interpreting distance-time and velocity-time graphs." },
      { name: "Real-world motion problems", difficulty_level: 3, description: "Solving problems involving speed, velocity and acceleration in real contexts." },
    ],
  },

  // STRAND 4: Consumer Electronics
  {
    subject_id: "integrated_science", strand_name: "Consumer Electronics", strand_order: 4,
    name: "Electronic Components", order_index: 1,
    description: "Identifying and understanding the functions of basic electronic components.",
    sub_topics: [
      { name: "Basic electronic components", difficulty_level: 1, description: "Identifying resistors, capacitors, diodes and transistors." },
      { name: "Functions of electronic components", difficulty_level: 2, description: "Explaining the functions of basic electronic components in circuits." },
      { name: "Reading circuit diagrams", difficulty_level: 2, description: "Interpreting standard circuit symbols and diagrams." },
      { name: "Electronic components in everyday devices", difficulty_level: 3, description: "Identifying electronic components in everyday devices used in Ghana." },
    ],
  },
  {
    subject_id: "integrated_science", strand_name: "Consumer Electronics", strand_order: 4,
    name: "Circuit Design", order_index: 2,
    description: "Designing and building simple electronic circuits.",
    sub_topics: [
      { name: "Series and parallel circuits", difficulty_level: 2, description: "Comparing series and parallel circuits and calculating current and voltage." },
      { name: "Ohm's law", difficulty_level: 2, description: "Applying Ohm's law to calculate resistance, voltage and current." },
      { name: "Simple circuit design", difficulty_level: 3, description: "Designing simple circuits for specific purposes using standard components." },
      { name: "Electrical safety", difficulty_level: 2, description: "Identifying electrical hazards and applying safety measures at home and school." },
    ],
  },

  // STRAND 5: Human Body and Health
  {
    subject_id: "integrated_science", strand_name: "Human Body and Health", strand_order: 5,
    name: "Reproductive Systems", order_index: 1,
    description: "Understanding the structure and function of human reproductive systems.",
    sub_topics: [
      { name: "Male reproductive system", difficulty_level: 1, description: "Identifying and describing the organs and functions of the male reproductive system." },
      { name: "Female reproductive system", difficulty_level: 1, description: "Identifying and describing the organs and functions of the female reproductive system." },
      { name: "Fertilisation and pregnancy", difficulty_level: 2, description: "Explaining the processes of fertilisation, implantation and foetal development." },
      { name: "Reproductive health", difficulty_level: 2, description: "Describing practices that promote reproductive health and prevent STIs." },
      { name: "Family planning", difficulty_level: 3, description: "Evaluating different family planning methods and their effectiveness." },
    ],
  },
  {
    subject_id: "integrated_science", strand_name: "Human Body and Health", strand_order: 5,
    name: "Lifestyle Diseases", order_index: 2,
    description: "Understanding lifestyle diseases, their prevention and management.",
    sub_topics: [
      { name: "Types of lifestyle diseases", difficulty_level: 1, description: "Identifying common lifestyle diseases such as diabetes, hypertension and obesity." },
      { name: "Causes of lifestyle diseases", difficulty_level: 2, description: "Explaining how diet, exercise and habits contribute to lifestyle diseases." },
      { name: "Prevention of lifestyle diseases", difficulty_level: 2, description: "Describing strategies for preventing lifestyle diseases through healthy living." },
      { name: "Management of lifestyle diseases", difficulty_level: 3, description: "Evaluating approaches to managing lifestyle diseases in Ghanaian communities." },
    ],
  },
  {
    subject_id: "integrated_science", strand_name: "Human Body and Health", strand_order: 5,
    name: "Drug Use and Hazards", order_index: 3,
    description: "Understanding the effects and dangers of drug use on health and society.",
    sub_topics: [
      { name: "Types of drugs", difficulty_level: 1, description: "Classifying drugs as medicinal, recreational and illegal." },
      { name: "Effects of drug abuse", difficulty_level: 2, description: "Describing the physical and social effects of drug abuse on individuals." },
      { name: "Drug abuse in Ghana", difficulty_level: 2, description: "Identifying common drugs abused in Ghana and their effects on communities." },
      { name: "Prevention of drug abuse", difficulty_level: 3, description: "Proposing strategies for preventing drug abuse among young people in Ghana." },
    ],
  },

  // STRAND 6: Relationships with Environment
  {
    subject_id: "integrated_science", strand_name: "Relationships with Environment", strand_order: 6,
    name: "Technology in Local Industries", order_index: 1,
    description: "Understanding how technology is applied in Ghanaian local industries.",
    sub_topics: [
      { name: "Technology in agriculture", difficulty_level: 1, description: "Identifying technologies used to improve farming in Ghana." },
      { name: "Technology in mining", difficulty_level: 2, description: "Describing technologies used in Ghana's mining industry." },
      { name: "Technology in manufacturing", difficulty_level: 2, description: "Explaining how technology improves manufacturing processes in Ghana." },
      { name: "Appropriate technology", difficulty_level: 3, description: "Evaluating the use of appropriate technology in Ghanaian industries." },
    ],
  },
  {
    subject_id: "integrated_science", strand_name: "Relationships with Environment", strand_order: 6,
    name: "Environmental Impact of Technology", order_index: 2,
    description: "Analysing the environmental impact of technology in Ghana.",
    sub_topics: [
      { name: "Positive impacts of technology", difficulty_level: 1, description: "Identifying ways technology has improved the environment and quality of life." },
      { name: "Negative impacts of technology", difficulty_level: 2, description: "Describing how technology contributes to pollution and environmental degradation." },
      { name: "E-waste in Ghana", difficulty_level: 2, description: "Explaining the problem of electronic waste and its effects in Ghana." },
      { name: "Sustainable technology", difficulty_level: 3, description: "Evaluating strategies for using technology sustainably in Ghana." },
    ],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error(
      "❌  Missing env vars. Check .env.local for:\n" +
        "    NEXT_PUBLIC_SUPABASE_URL\n" +
        "    SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let topicsInserted = 0;
  let subTopicsInserted = 0;
  let failed = 0;

  console.log(`Seeding ${CURRICULUM.length} topics across 4 subjects…\n`);

  for (const topicData of CURRICULUM) {
    const { data: topic, error: topicErr } = await supabase
      .from("topics")
      .insert({
        subject_id: topicData.subject_id,
        name: topicData.name,
        description: topicData.description,
        strand_name: topicData.strand_name,
        strand_order: topicData.strand_order,
        order_index: topicData.order_index,
        year_group: 1,
        prerequisite_ids: [],
        waec_code: null,
      })
      .select("id")
      .single();

    if (topicErr || !topic) {
      console.error(`  ✗ [${topicData.subject_id}] ${topicData.name}: ${topicErr?.message ?? "no id returned"}`);
      failed++;
      continue;
    }

    topicsInserted++;

    const subRows = topicData.sub_topics.map((st, i) => ({
      topic_id: topic.id,
      subject_id: topicData.subject_id,
      name: st.name,
      description: st.description,
      order_index: i + 1,
      difficulty_level: st.difficulty_level,
      estimated_minutes: 20,
      year_group: 1,
    }));

    const { error: stErr } = await supabase.from("sub_topics").insert(subRows);

    if (stErr) {
      console.error(`  ✗ sub-topics for "${topicData.name}": ${stErr.message}`);
      failed++;
    } else {
      subTopicsInserted += subRows.length;
      console.log(`  ✓ [${topicData.subject_id}] ${topicData.strand_name} › ${topicData.name} (${subRows.length} sub-topics)`);
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log("Done.");
  console.log(`  ✓ Topics inserted    : ${topicsInserted}`);
  console.log(`  ✓ Sub-topics inserted: ${subTopicsInserted}`);
  if (failed > 0) console.log(`  ✗ Failed             : ${failed}`);
  console.log("─".repeat(60));
  console.log("\nNext steps:");
  console.log("  npx tsx scripts/generate-questions.ts");
  console.log("  npx tsx scripts/generate-explanations.ts");

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
