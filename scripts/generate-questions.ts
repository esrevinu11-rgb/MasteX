/**
 * MasteX — Question Generation Script (WAEC Paper Structure)
 *
 * Generates 6 WAEC-format questions per sub-topic for all 4 SHS Year 1
 * subjects. Each frame matches the actual WAEC paper and section structure.
 *
 * Frame sets per subject:
 *
 *   Core Mathematics (79 sub-topics × 6 = 474 questions)
 *     paper1 → mcq_objective
 *     paper2 → short_answer_theory, multi_step_theory,
 *              story_problem, data_interpretation, proof_justify
 *
 *   English Language (65 sub-topics × 6 = 390 questions)
 *     paper1 → mcq_objective, comprehension_factual,
 *              comprehension_inferential
 *     paper2 → essay_writing, letter_writing
 *     paper3 → oral_english
 *
 *   Integrated Science (56 sub-topics × 6 = 336 questions)
 *     paper1 → mcq_objective
 *     paper2 → short_structured, calculation,
 *              activity_of_integration, evaluate_discuss
 *     paper3 → practical_data
 *
 *   Social Studies (71 sub-topics × 6 = 426 questions)
 *     paper1 → mcq_objective
 *     paper2 → short_answer, explain_suggest, discuss_analyse,
 *              diagram_based, evaluate_assess
 *
 *   Total: 271 sub-topics × 6 = 1,626 questions
 *
 * Prerequisites:
 *   - Migration 006_waec_paper_structure.sql applied in Supabase
 *   - scripts/seed-curriculum.ts completed
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *     ANTHROPIC_API_KEY
 *
 * Run with:
 *   npx tsx scripts/generate-questions.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubTopic {
  id: string;
  topic_id: string;
  name: string;
  description: string | null;
  subject_id: string;
  subject_area: string | null;
  topics: { name: string; strand_name: string | null } | null;
}

// ─── Subject-area → allowed frames ───────────────────────────────────────────
// Determines which frames are valid for each sub-topic.
// When a sub-topic has a subject_area tag, only these frames are generated.
// If subject_area is null (untagged), all frames for the subject are used.

const SUBJECT_AREA_FRAMES: Record<string, string[]> = {
  // Core Mathematics
  number_algebra:    ["mcq_objective", "short_answer_theory", "multi_step_theory", "story_problem", "data_interpretation", "proof_justify"],
  geometry_trig:     ["mcq_objective", "short_answer_theory", "multi_step_theory", "proof_justify", "data_interpretation"],
  stats_probability: ["mcq_objective", "short_answer_theory", "multi_step_theory", "data_interpretation", "story_problem"],

  // English Language
  oral_english_topic:  ["mcq_objective", "oral_english"],
  comprehension_topic: ["mcq_objective", "comprehension_factual", "comprehension_inferential"],
  grammar_topic:       ["mcq_objective", "comprehension_factual"],
  writing_topic:       ["mcq_objective", "essay_writing", "letter_writing"],
  literature_topic:    ["mcq_objective", "essay_writing", "comprehension_inferential"],

  // Social Studies
  general_knowledge:  ["mcq_objective", "short_answer", "explain_suggest", "discuss_analyse"],
  history_geography:  ["mcq_objective", "short_answer", "diagram_based", "explain_suggest"],
  governance_rights:  ["mcq_objective", "short_answer", "explain_suggest", "discuss_analyse", "evaluate_assess"],
  financial_economic: ["mcq_objective", "short_answer", "explain_suggest", "evaluate_assess"],
  ethics_values:      ["mcq_objective", "short_answer", "discuss_analyse", "evaluate_assess"],

  // Integrated Science
  physics_calculation:    ["mcq_objective", "short_structured", "calculation", "practical_data"],
  chemistry_calculation:  ["mcq_objective", "short_structured", "calculation", "practical_data"],
  biology_concept:        ["mcq_objective", "short_structured", "activity_of_integration", "evaluate_discuss"],
  health_lifestyle:       ["mcq_objective", "short_structured", "activity_of_integration", "evaluate_discuss"],
  environmental:          ["mcq_objective", "short_structured", "activity_of_integration", "evaluate_discuss"],
  scientific_method:      ["mcq_objective", "short_structured", "practical_data", "activity_of_integration"],
  electronics:            ["mcq_objective", "short_structured", "calculation", "diagram_based"],
};

interface GeneratedQuestion {
  stem: string;
  options: string[] | null;
  correct_answer: string;
  mark_scheme: string | null;
  explanation: string | null;
}

type QuestionType = "mcq" | "short_answer" | "theory";

interface FrameConfig {
  paper: "paper1" | "paper2" | "paper3";
  level: 1 | 2 | 3;
  type: QuestionType;
  xp: number;
  shows_working: boolean;
  partial_marks: boolean;
  ghanaian_context: boolean;
}

// ─── Frame configs ────────────────────────────────────────────────────────────

const MATH_FRAMES: Record<string, FrameConfig> = {
  mcq_objective:       { paper: "paper1", level: 1, type: "mcq",          xp: 5,  shows_working: false, partial_marks: false, ghanaian_context: false },
  short_answer_theory: { paper: "paper2", level: 1, type: "short_answer", xp: 5,  shows_working: true,  partial_marks: false, ghanaian_context: false },
  multi_step_theory:   { paper: "paper2", level: 2, type: "theory",       xp: 8,  shows_working: true,  partial_marks: true,  ghanaian_context: false },
  story_problem:       { paper: "paper2", level: 2, type: "theory",       xp: 8,  shows_working: true,  partial_marks: true,  ghanaian_context: true  },
  data_interpretation: { paper: "paper2", level: 2, type: "theory",       xp: 8,  shows_working: true,  partial_marks: true,  ghanaian_context: true  },
  proof_justify:       { paper: "paper2", level: 3, type: "theory",       xp: 12, shows_working: true,  partial_marks: true,  ghanaian_context: false },
};

const ENGLISH_FRAMES: Record<string, FrameConfig> = {
  mcq_objective:             { paper: "paper1", level: 1, type: "mcq",          xp: 5,  shows_working: false, partial_marks: false, ghanaian_context: false },
  comprehension_factual:     { paper: "paper1", level: 1, type: "short_answer", xp: 5,  shows_working: false, partial_marks: false, ghanaian_context: true  },
  comprehension_inferential: { paper: "paper1", level: 2, type: "short_answer", xp: 8,  shows_working: false, partial_marks: true,  ghanaian_context: true  },
  essay_writing:             { paper: "paper2", level: 3, type: "theory",       xp: 12, shows_working: false, partial_marks: true,  ghanaian_context: true  },
  letter_writing:            { paper: "paper2", level: 2, type: "theory",       xp: 8,  shows_working: false, partial_marks: true,  ghanaian_context: true  },
  oral_english:              { paper: "paper3", level: 1, type: "mcq",          xp: 5,  shows_working: false, partial_marks: false, ghanaian_context: false },
};

const SCIENCE_FRAMES: Record<string, FrameConfig> = {
  mcq_objective:            { paper: "paper1", level: 1, type: "mcq",          xp: 5,  shows_working: false, partial_marks: false, ghanaian_context: false },
  short_structured:         { paper: "paper2", level: 1, type: "short_answer", xp: 5,  shows_working: false, partial_marks: false, ghanaian_context: false },
  calculation:              { paper: "paper2", level: 2, type: "theory",       xp: 8,  shows_working: true,  partial_marks: true,  ghanaian_context: false },
  activity_of_integration:  { paper: "paper2", level: 3, type: "theory",       xp: 12, shows_working: false, partial_marks: true,  ghanaian_context: true  },
  practical_data:           { paper: "paper3", level: 2, type: "theory",       xp: 8,  shows_working: false, partial_marks: true,  ghanaian_context: false },
  evaluate_discuss:         { paper: "paper2", level: 3, type: "theory",       xp: 12, shows_working: false, partial_marks: true,  ghanaian_context: true  },
  diagram_based:            { paper: "paper2", level: 2, type: "theory",       xp: 8,  shows_working: false, partial_marks: true,  ghanaian_context: false },
};

const SOCIAL_FRAMES: Record<string, FrameConfig> = {
  mcq_objective:   { paper: "paper1", level: 1, type: "mcq",          xp: 5,  shows_working: false, partial_marks: false, ghanaian_context: false },
  short_answer:    { paper: "paper2", level: 1, type: "short_answer", xp: 5,  shows_working: false, partial_marks: false, ghanaian_context: true  },
  explain_suggest: { paper: "paper2", level: 2, type: "theory",       xp: 8,  shows_working: false, partial_marks: true,  ghanaian_context: true  },
  discuss_analyse: { paper: "paper2", level: 2, type: "theory",       xp: 8,  shows_working: false, partial_marks: true,  ghanaian_context: true  },
  diagram_based:   { paper: "paper2", level: 2, type: "theory",       xp: 8,  shows_working: false, partial_marks: true,  ghanaian_context: true  },
  evaluate_assess: { paper: "paper2", level: 3, type: "theory",       xp: 12, shows_working: false, partial_marks: true,  ghanaian_context: true  },
};

const SUBJECT_FRAMES: Record<string, Record<string, FrameConfig>> = {
  core_math:          MATH_FRAMES,
  english:            ENGLISH_FRAMES,
  social_studies:     SOCIAL_FRAMES,
  integrated_science: SCIENCE_FRAMES,
};

const SUBJECT_NAMES: Record<string, string> = {
  core_math:          "Core Mathematics",
  english:            "English Language",
  social_studies:     "Social Studies",
  integrated_science: "Integrated Science",
};

const SUBJECT_IDS = ["core_math", "english", "social_studies", "integrated_science"];
const DELAY_MS = 3_000;
const QUESTIONS_PER_FRAME = 3; // target number of distinct questions per (sub_topic, frame)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

// ─── JSON format strings ──────────────────────────────────────────────────────

const MCQ_FORMAT = `{
  "stem": "The full question text",
  "options": ["A. option one", "B. option two", "C. option three", "D. option four"],
  "correct_answer": "A",
  "explanation": "Why this option is correct. Why each wrong option is incorrect. State the total: [1 mark]."
}`;

const SHORT_ANSWER_FORMAT = `{
  "stem": "The full question text",
  "options": null,
  "correct_answer": "Model answer showing all required steps or key points.",
  "explanation": "Mark scheme: list each point or step with its marks. State total marks available."
}`;

const THEORY_FORMAT = `{
  "stem": "The full question text (include any passage, table, scenario or data in full here)",
  "options": null,
  "correct_answer": "Complete model answer — all steps, arguments, or paragraphs written in full.",
  "explanation": "WAEC-style mark scheme. Each point/step on a new line with its marks: e.g. 'M1 — correct method shown', 'A1 — correct answer with units'. State total marks."
}`;

// ─── Shared context block ─────────────────────────────────────────────────────

const GHANAIAN_CONTEXT_RULES = `
GHANAIAN CONTEXT RULES (apply to scenario-based questions):
- Names: Kwame, Ama, Kofi, Abena, Yaw, Efua, Nana, Akua, Mensah, Asante
- Places: Accra, Kumasi, Tamale, Cape Coast, Tema, Takoradi, Sunyani, Bolgatanga
- Currency: Ghana Cedis (GHC)
- Industries: cocoa farming, gold mining, fishing, timber, petroleum, mobile money
- Institutions: GES, WAEC, Electoral Commission, Bank of Ghana, NHIS, Ghana Police Service
- Use local foods, plants, animals where relevant to the subject`;

const MARK_SCHEME_RULES = `
MARK SCHEME RULES (follow WAEC style):
- State total marks: e.g. [6 marks]
- For MCQ: [1 mark]
- For theory: use M1 (method mark), A1 (answer mark), B1 (statement mark)
- List acceptable alternative answers
- Note the most common student error where relevant`;

const DIFFICULTY_RULES = `
DIFFICULTY: SHS Year 1 level
- Recall (L1): straightforward — student should know this from study
- Application (L2): requires thinking — must apply concept to solve
- Analysis/Synthesis (L3): challenging — requires multi-step reasoning, but NOT SHS 3 difficulty`;

// ─── Prompt builders per subject ──────────────────────────────────────────────

function mathPrompt(st: SubTopic, frame: string): string {
  const topic = st.topics?.name ?? "Core Mathematics";
  const strand = st.topics?.strand_name ?? "";
  const desc = st.description ?? st.name;
  const cfg = MATH_FRAMES[frame];

  const frameInstructions: Record<string, string> = {
    mcq_objective: `Generate a Paper 1 WAEC Core Mathematics MCQ.
- Single best answer from 4 options (A–D)
- Test UNDERSTANDING and application, not just recall
- Use a Ghanaian context where the sub-topic allows
- All 4 options must be numerically or conceptually plausible — no obviously wrong distractors
- Distractors should reflect common student errors (wrong formula, sign error, order of operations)`,

    short_answer_theory: `Generate a Paper 2 Section A WAEC Core Mathematics short answer question.
- Worth 2–3 marks
- Student must show 1–2 clear steps of working
- Test direct application of a formula or basic operation from this sub-topic
- Numbers must be realistic and workable without a calculator
- correct_answer must show every working step`,

    multi_step_theory: `Generate a Paper 2 Section B WAEC Core Mathematics multi-step theory question.
- Worth 6–10 marks with marks awarded per step
- Requires at least 3 distinct steps of working
- Student can earn partial marks for correct method even with wrong final answer
- Mark scheme must clearly label each step:
  M1 for correct method applied
  A1 for correct answer
  B1 for a correct statement or identification
- Example structure: part (a) for setup, part (b) for calculation, part (c) for interpretation`,

    story_problem: `Generate a Paper 2 WAEC Core Mathematics story problem.
- MUST be set in a realistic Ghanaian scenario — choose ONE:
  • A market trader in Kumasi calculating profit/loss on goods sold
  • A farmer in Brong-Ahafo measuring and fencing a plot of land
  • A student saving money using MTN Mobile Money towards school fees
  • A builder in Tema calculating materials needed for a rectangular room
  • A taxi driver on the Accra–Kumasi highway calculating fuel costs
- Student must translate the scenario into mathematics and solve fully
- Show mark scheme step by step`,

    data_interpretation: `Generate a WAEC Core Mathematics data interpretation question.
- MUST include a described data set in the question stem:
  e.g. "The table below shows the marks scored by 8 students in a class test: Kofi 72, Ama 85, Yaw 60..."
  or "The frequency table shows the daily sales (in GHC) at a market stall..."
- Use Ghanaian data — school marks, market prices, crop yields, rainfall figures
- Ask 2–3 parts: e.g. (a) find the mean, (b) find the range, (c) draw a conclusion
- Multi-part structure with marks per part`,

    proof_justify: `Generate a Paper 2 WAEC Core Mathematics proof or justification question.
- Ask student to PROVE, SHOW or JUSTIFY a mathematical statement
- Must use the exact words "Prove that...", "Show that..." or "Hence justify..."
- Examples appropriate for SHS 1:
  • Prove two triangles are congruent
  • Show that a given expression simplifies to a stated result
  • Prove that the sum of angles in a triangle is 180°
  • Justify the number of solutions to a given equation
- Mark scheme shows marks for each logical step in the proof`,
  };

  const fmt = cfg.type === "mcq" ? MCQ_FORMAT : cfg.type === "short_answer" ? SHORT_ANSWER_FORMAT : THEORY_FORMAT;

  return `You are an experienced Ghana WAEC Core Mathematics examiner setting SHS Year 1 examination questions aligned with the Common Core Programme (CCP).

Subject: Core Mathematics | ${strand} | ${topic}
Sub-topic: ${st.name}
Description: ${desc}
Paper: ${cfg.paper.toUpperCase()} | Cognitive Level: ${cfg.level} | Frame: ${frame}
${DIFFICULTY_RULES}
${GHANAIAN_CONTEXT_RULES}
${MARK_SCHEME_RULES}

YOUR TASK:
${frameInstructions[frame]}

Return ONLY a valid JSON object — no markdown, no extra text:

${fmt}`;
}

function englishPrompt(st: SubTopic, frame: string): string {
  const topic = st.topics?.name ?? "English Language";
  const strand = st.topics?.strand_name ?? "";
  const desc = st.description ?? st.name;
  const cfg = ENGLISH_FRAMES[frame];

  const frameInstructions: Record<string, string> = {
    mcq_objective: `Generate a Paper 1 WAEC English Language objective question.
- Single best answer from 4 options (A–D)
- Test ONE of the following (choose the area most relevant to this sub-topic):
  • Lexis and Structure: vocabulary in context, synonyms, antonyms, word meaning
  • Grammar: subject-verb agreement, tenses, reported speech, prepositions, conjunctions, articles
  • Reading: tone, purpose, or meaning from a short 2–3 line extract
- ALL four options must be grammatically plausible — a student who does not truly understand must not be able to guess
- Base on Ghanaian English usage patterns where possible
- Do NOT test obscure vocabulary — test what SHS 1 students encounter`,

    comprehension_factual: `Generate a Paper 1 WAEC English comprehension question testing literal understanding.
- Write a passage of 80–120 words on a topic relevant to Ghanaian SHS students such as:
  education in Ghana, community life, environmental issues, youth and technology, Ghanaian culture, health
- INCLUDE THE FULL PASSAGE IN THE STEM
- Write ONE factual question whose answer is DIRECTLY STATED in the passage
- Do not ask for interpretation — the answer must be found word-for-word or close paraphrase
- Expected answer: 1–2 sentences
- Mark scheme: 2 marks for correct answer with reference to the text`,

    comprehension_inferential: `Generate a Paper 1 WAEC English comprehension question testing inferential understanding.
- Write a passage of 80–120 words on a Ghanaian topic
- INCLUDE THE FULL PASSAGE IN THE STEM
- Write ONE question whose answer is IMPLIED but NOT directly stated in the passage
- Example question types: "What does the writer's tone suggest about...?", "What can we infer about the character of...?", "What does the phrase '...' imply?"
- The student must read between the lines and reason from the text
- Expected answer: 2–3 sentences with reference to specific evidence in the text
- Mark scheme: 3 marks — 1 for inference, 2 for supporting evidence from text`,

    essay_writing: `Generate a Paper 2 WAEC English essay question.
- Choose ONE essay type (vary across questions for this subject):
  • Narrative: "Write a story about a time when..." — use Ghanaian setting and characters
  • Descriptive: "Describe your school/community/market..." — use vivid sensory details
  • Argumentative: "Write an essay arguing for or against..." — relevant Ghanaian issue
- In the STEM, state clearly:
  1. The essay type
  2. The exact title or topic
  3. Word count guide: "Write about 250–300 words"
- In the correct_answer, write a complete model essay with:
  • Introduction (hook + thesis)
  • 2–3 body paragraphs
  • Conclusion
- Mark scheme covers: Content (10), Organisation (5), Expression (5), Accuracy (5) = 25 marks`,

    letter_writing: `Generate a Paper 2 WAEC English letter writing question.
- Choose ONE type (vary across questions):
  • Formal letter: to a headmaster, newspaper editor, government official, company HR
  • Informal letter: to a friend or relative describing an experience or giving advice
- In the STEM, specify ALL of the following:
  1. Type: formal or informal
  2. Sender (give a Ghanaian name and location)
  3. Recipient and their position/relationship
  4. Purpose of the letter
  5. 3–4 specific points to cover
- Ghanaian scenario examples:
  • Write to your headmaster requesting permission to form a club
  • Write to a friend in Accra describing life in your Kumasi community
  • Write to the editor of the Daily Graphic about waste disposal in your town
- Correct_answer is a complete model letter with correct format and layout
- Mark scheme: Format (5), Content (10), Expression (5), Accuracy (5) = 25 marks`,

    oral_english: `Generate a Paper 3 WAEC English oral question.
- 4 options (A–D), one correct answer
- Test ONE of the following (vary across questions):
  • Vowel sounds: "Which word has a DIFFERENT vowel sound from the others?"
    — provide 4 words, 3 share a vowel sound, 1 is different
  • Word stress: "In which word is the stress on the SECOND syllable?"
    — provide 4 words with different stress patterns
  • Consonant clusters: "Which word contains a different consonant sound?"
  • Rhyme: "Which word rhymes with [given word]?"
- Use words common in Ghanaian English usage — words students encounter in texts
- The correct_answer states the letter AND explains the phonological rule
- This question tests practical oral phonology, not theory`,
  };

  const fmt = cfg.type === "mcq" ? MCQ_FORMAT : cfg.type === "short_answer" ? SHORT_ANSWER_FORMAT : THEORY_FORMAT;

  return `You are an experienced Ghana WAEC English Language examiner setting SHS Year 1 examination questions aligned with the Common Core Programme (CCP).

Subject: English Language | ${strand} | ${topic}
Sub-topic: ${st.name}
Description: ${desc}
Paper: ${cfg.paper.toUpperCase()} | Cognitive Level: ${cfg.level} | Frame: ${frame}
${DIFFICULTY_RULES}
${GHANAIAN_CONTEXT_RULES}
${MARK_SCHEME_RULES}

YOUR TASK:
${frameInstructions[frame]}

Return ONLY a valid JSON object — no markdown, no extra text:

${fmt}`;
}

function sciencePrompt(st: SubTopic, frame: string): string {
  const topic = st.topics?.name ?? "Integrated Science";
  const strand = st.topics?.strand_name ?? "";
  const desc = st.description ?? st.name;
  const cfg = SCIENCE_FRAMES[frame];

  const frameInstructions: Record<string, string> = {
    mcq_objective: `Generate a Paper 1 WAEC Integrated Science objective question.
- Single best answer from 4 options (A–D)
- Cover the sub-topic from the angle most relevant to ONE of: Biology, Chemistry, Physics, or Agricultural Science
- Test UNDERSTANDING and application — not just naming or defining
- Use Ghanaian examples where natural: local plants, animals, health issues, industries
- All 4 options must be scientifically plausible — distractors should reflect real misconceptions`,

    short_structured: `Generate a Paper 2 WAEC Integrated Science short structured question.
- Worth 2–4 marks (1 mark per correct point)
- Ask student to state, name, identify, give ONE example, or briefly describe
- Question should have 1–2 parts, e.g.: "(a) State two... (b) Give one example..."
- Use Ghanaian context where possible
- Mark scheme lists each expected point`,

    calculation: `Generate a Paper 2 WAEC Integrated Science calculation question.
- Involves a numerical calculation appropriate for SHS 1 Physics or Chemistry
- The correct_answer MUST follow this exact structure:
  Step 1: State the formula (e.g. v = d/t)
  Step 2: Substitute the given values with units
  Step 3: Calculate — state the final answer with correct units
- Use a Ghanaian real-world context where natural:
  e.g. a car travelling on the Accra–Kumasi highway, a solar panel in Tamale, a body of water in Lake Volta
- Numbers must give a clean, workable answer
- Mark scheme: 1 mark per step, state total`,

    activity_of_integration: `Generate an Activity of Integration — the most important WAEC Integrated Science question type.
- Provide a REAL Ghanaian scenario (3–5 sentences) such as:
  • A community in the Upper East Region facing a water contamination problem
  • A farmer in Ashanti dealing with a sudden crop disease outbreak
  • An outbreak of cholera affecting students in a school in the Northern Region
  • A factory in Tema releasing untreated waste into a nearby lagoon
  • Solar panels being installed in a remote village in the Volta Region
- Ask THREE parts:
  (a) Identify the scientific problem in the scenario [2 marks]
  (b) Explain the relevant scientific principles involved [4 marks]
  (c) Propose practical solutions the community/government could adopt [4 marks]
- This question tests all 4Cs — especially critical thinking and creativity
- Set the scenario firmly in Ghana`,

    practical_data: `Generate a Paper 3 WAEC Integrated Science practical or data question.
- Choose ONE type (vary across questions):
  TYPE A — Experiment design: "Describe an experiment to show/determine/investigate..."
    Structure: Aim → Materials/Apparatus → Procedure → Expected Result → Conclusion
  TYPE B — Data interpretation: provide a results table from a described experiment and ask:
    (a) State the trend shown in the data
    (b) Calculate a value from the data
    (c) Draw a conclusion
  TYPE C — Specimen identification: describe a specimen and ask student to identify it,
    state 3 observable features, and give 2 uses in Ghana
- Use specimens, materials and contexts familiar in Ghana`,

    evaluate_discuss: `Generate an evaluate or discuss question for Integrated Science.
- Ask student to EVALUATE or DISCUSS a scientific issue directly relevant to Ghana:
  • Effects of galamsey (illegal mining) on river water quality in Ghana
  • Impact of plastic waste on marine life along Ghana's coastline
  • Benefits and risks of using chemical fertilisers on Ghanaian farms
  • Effects of climate change on rainfall patterns and farming in Northern Ghana
  • The role of the NHIS in improving healthcare access in rural Ghana
- Requires critical analysis with scientific reasoning and real-world knowledge
- Expected answer: 4–6 sentences minimum with scientific vocabulary
- Mark scheme: award 2 marks per well-developed point, state total`,

    diagram_based: `Generate a diagram-based Integrated Science question (used for electronics/circuits).
- Choose ONE type relevant to this sub-topic:
  TYPE A — Circuit diagram: describe a simple circuit and ask the student to:
    (a) Identify the components labelled in the diagram
    (b) State what would happen if one component were changed (e.g. resistor added)
    (c) Calculate a value using Ohm's law or power formula
  TYPE B — Label a diagram: describe a device or system (e.g. solar panel setup,
    simple amplifier circuit) and ask the student to identify labelled parts and
    state the function of each
  TYPE C — Draw and explain: ask the student to draw a labelled diagram of a
    specified circuit or electronic system and explain how it works
- Include the full description of the diagram in the stem (since we cannot attach images)
- Describe component positions clearly: "Component A is connected in series with B..."
- Mark scheme: marks for correct labels, correct relationships, correct explanations
- Use Ghanaian contexts where natural: solar charging circuits in villages, radio circuits`,
  };

  const fmt = cfg.type === "mcq" ? MCQ_FORMAT : cfg.type === "short_answer" ? SHORT_ANSWER_FORMAT : THEORY_FORMAT;

  return `You are an experienced Ghana WAEC Integrated Science examiner setting SHS Year 1 examination questions aligned with the Common Core Programme (CCP).

Subject: Integrated Science | ${strand} | ${topic}
Sub-topic: ${st.name}
Description: ${desc}
Paper: ${cfg.paper.toUpperCase()} | Cognitive Level: ${cfg.level} | Frame: ${frame}
${DIFFICULTY_RULES}
${GHANAIAN_CONTEXT_RULES}
${MARK_SCHEME_RULES}

YOUR TASK:
${frameInstructions[frame]}

Return ONLY a valid JSON object — no markdown, no extra text:

${fmt}`;
}

function socialPrompt(st: SubTopic, frame: string): string {
  const topic = st.topics?.name ?? "Social Studies";
  const strand = st.topics?.strand_name ?? "";
  const desc = st.description ?? st.name;
  const cfg = SOCIAL_FRAMES[frame];

  const frameInstructions: Record<string, string> = {
    mcq_objective: `Generate a Paper 1 WAEC Social Studies objective question.
- Single best answer from 4 options (A–D)
- Test APPLICATION of knowledge — NOT just definitions or recall
- Questions should present a situation or scenario and ask the student to identify the concept, reason or correct response
- Use specific Ghanaian institutions, laws, events and current issues
- All 4 options must be plausible — no obviously wrong answers`,

    short_answer: `Generate a Paper 2 WAEC Social Studies short answer question.
- Worth 3–4 marks (1 mark per point)
- Ask student to IDENTIFY, STATE or LIST 2–3 points
- NEVER ask for a definition — always ask for application, examples, or reasons
- Examples:
  "State THREE functions of the Electoral Commission of Ghana." [3 marks]
  "Identify TWO causes of rural-urban migration in Ghana." [2 marks]
  "Give THREE examples of traditional governance structures in Ghana." [3 marks]
- Mark scheme lists each expected point`,

    explain_suggest: `Generate a Paper 2 WAEC Social Studies explain or suggest question.
- This is the core Paper 2 question type — the student must think and apply, not recall
- ALWAYS use one of these question starters:
  "Suggest THREE ways in which..."
  "Explain how the government can..."
  "Give THREE reasons why Ghana should/has..."
  "How can young Ghanaians contribute to..."
  "Explain the importance of... with THREE relevant points"
- Use a specific Ghanaian community, institution, or governance context
- Expected: 3–4 developed points, each 1–2 sentences
- Mark scheme: 2 marks per well-developed point`,

    discuss_analyse: `Generate a Paper 2 WAEC Social Studies discuss or analyse question.
- Ask student to DISCUSS an issue from multiple angles OR ANALYSE a situation in Ghana in depth
- The question must require BOTH positive and negative aspects, OR multiple perspectives
- Examples:
  "Discuss the effects of corruption on Ghana's development."
  "Analyse the role of traditional rulers in modern Ghanaian governance."
  "Discuss how colonialism has shaped Ghana's current economic situation."
  "Analyse the causes and consequences of child labour in Ghana."
- Expected: 5–6 developed points covering multiple angles
- Mark scheme: 2 marks per well-developed point, total 10–12 marks`,

    diagram_based: `Generate a Paper 2 WAEC Social Studies diagram-based question.
- WAEC Social Studies Paper 2 regularly awards marks for diagrams
- Choose ONE type:
  TYPE A — Describe a diagram and ask student to copy, label and explain it:
    e.g. structure of Ghana's government (3 arms), the water cycle, types of rainfall
  TYPE B — Provide described data and ask student to represent it in a suitable diagram:
    e.g. data on Ghana's exports, population distribution by region
  TYPE C — Ask student to draw a sketch map of Ghana showing specific features:
    e.g. major rivers, neighbouring countries, vegetation zones
- Mark scheme: marks for correct labels, correct relationships, and brief explanations`,

    evaluate_assess: `Generate a Paper 2 WAEC Social Studies evaluate or assess question.
- Ask student to make a REASONED JUDGEMENT about a Ghanaian issue with justification
- Examples:
  "To what extent has democracy improved Ghana's development since 1992?"
  "Assess the impact of Chinese investment on Ghana's economy."
  "How effective has the NHIS been in improving healthcare in Ghana?"
  "Evaluate the success of Ghana's free SHS policy."
- Requires: a clear position/judgement + at least 3 supporting points + consideration of the other side
- Expected: 6–8 developed sentences
- Mark scheme: Content (8), Organisation (4), Expression (3) = 15 marks`,
  };

  const fmt = cfg.type === "mcq" ? MCQ_FORMAT : cfg.type === "short_answer" ? SHORT_ANSWER_FORMAT : THEORY_FORMAT;

  return `You are an experienced Ghana WAEC Social Studies examiner setting SHS Year 1 examination questions aligned with the Common Core Programme (CCP).

Subject: Social Studies | ${strand} | ${topic}
Sub-topic: ${st.name}
Description: ${desc}
Paper: ${cfg.paper.toUpperCase()} | Cognitive Level: ${cfg.level} | Frame: ${frame}
${DIFFICULTY_RULES}
${GHANAIAN_CONTEXT_RULES}
${MARK_SCHEME_RULES}

YOUR TASK:
${frameInstructions[frame]}

Return ONLY a valid JSON object — no markdown, no extra text:

${fmt}`;
}

// ─── Route to subject prompt ──────────────────────────────────────────────────

function buildPrompt(st: SubTopic, frame: string, existingPrompts: string[]): string {
  let base: string;
  switch (st.subject_id) {
    case "core_math":          base = mathPrompt(st, frame);          break;
    case "english":            base = englishPrompt(st, frame);       break;
    case "social_studies":     base = socialPrompt(st, frame);        break;
    case "integrated_science": base = sciencePrompt(st, frame);       break;
    default: throw new Error(`Unknown subject_id: ${st.subject_id}`);
  }

  if (existingPrompts.length > 0) {
    base +=
      `\n\nEXISTING QUESTIONS FOR THIS SUB-TOPIC + FRAME (do not repeat these):\n` +
      existingPrompts.map((p, i) => `${i + 1}. ${p}`).join("\n") +
      `\n\nGenerate a NEW question that is MEANINGFULLY DIFFERENT from those above.` +
      ` Use a different scenario, different numbers, different context, or a different` +
      ` angle on the concept. Do not repeat the same question.`;
  }

  return base;
}

// ─── Generation ───────────────────────────────────────────────────────────────

async function generateQuestion(
  client: Anthropic,
  st: SubTopic,
  frame: string,
  existingPrompts: string[],
): Promise<GeneratedQuestion> {
  const cfg = SUBJECT_FRAMES[st.subject_id][frame];

  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1800,
    messages: [{ role: "user", content: buildPrompt(st, frame, existingPrompts) }],
  });

  const block = msg.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text block in response");

  let parsed: GeneratedQuestion;
  try {
    parsed = JSON.parse(stripFences(block.text));
  } catch {
    throw new Error(`JSON parse failed. Raw: ${block.text.slice(0, 300)}`);
  }

  if (!parsed.stem || !parsed.correct_answer || !parsed.explanation) {
    throw new Error("Response missing required fields");
  }
  if (cfg.type === "mcq") {
    if (!Array.isArray(parsed.options) || parsed.options.length !== 4) {
      throw new Error("MCQ response must have exactly 4 options");
    }
  }

  return parsed;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !serviceKey || !anthropicKey) {
    console.error(
      "❌  Missing env vars. Check .env.local for:\n" +
        "    NEXT_PUBLIC_SUPABASE_URL\n" +
        "    SUPABASE_SERVICE_ROLE_KEY\n" +
        "    ANTHROPIC_API_KEY"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // ── Fetch sub-topics ──────────────────────────────────────────────────────

  console.log("Fetching sub-topics…");
  const { data: subTopics, error } = await supabase
    .from("sub_topics")
    .select("id, topic_id, name, description, subject_id, subject_area, topics(name, strand_name)")
    .in("subject_id", SUBJECT_IDS)
    .order("subject_id", { ascending: true })
    .order("name",       { ascending: true });

  if (error || !subTopics?.length) {
    console.error("❌  Failed to fetch sub-topics:", error?.message ?? "empty result");
    process.exit(1);
  }

  const castTopics = subTopics as unknown as SubTopic[];

  // Group by subject (preserves SUBJECT_IDS ordering)
  const subtopicsBySubject: Record<string, SubTopic[]> = {};
  for (const subjectId of SUBJECT_IDS) {
    subtopicsBySubject[subjectId] = castTopics.filter((s) => s.subject_id === subjectId);
  }

  // Warn about untagged sub-topics (no live queries needed — just inspect fetched data)
  const untagged = castTopics.filter((s) => !s.subject_area).length;
  if (untagged > 0) {
    console.warn(`  ⚠ ${untagged} sub-topics have no subject_area — all frames used as fallback.`);
    console.warn(`    Run migrations 009 and 010 in Supabase to fix this.\n`);
  }

  // ── Pre-flight verification (Fix 5) ──────────────────────────────────────
  // Live DB count per subject — immune to Supabase's 1000-row default limit.

  console.log("\nCurrent state:");
  let totalGapsEstimate = 0;

  for (const subjectId of SUBJECT_IDS) {
    const sts = subtopicsBySubject[subjectId];
    const frameConfigs = SUBJECT_FRAMES[subjectId];

    // Live count — no row-limit issue since we only get the count
    const { count: existing } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("subject_id", subjectId);

    // Expected = sum of allowed-frame-count × QUESTIONS_PER_FRAME per sub-topic
    let expected = 0;
    for (const st of sts) {
      const allowed = st.subject_area
        ? (SUBJECT_AREA_FRAMES[st.subject_area] ?? Object.keys(frameConfigs))
        : Object.keys(frameConfigs);
      expected += allowed.length * QUESTIONS_PER_FRAME;
    }

    const existingCount = existing ?? 0;
    const gaps = Math.max(0, expected - existingCount);
    totalGapsEstimate += gaps;

    console.log(
      `  ${SUBJECT_NAMES[subjectId].padEnd(22)}: ${String(sts.length).padStart(3)} sub-topics, ` +
      `${String(existingCount).padStart(5)} questions, ~${gaps} gaps`
    );
  }

  const costEstimate = (totalGapsEstimate * 0.005).toFixed(2);
  console.log(`\n  Will generate approximately ${totalGapsEstimate} new questions.`);
  console.log(`  Estimated cost: $${costEstimate}`);
  console.log(`\n  Press Enter to continue or Ctrl+C to abort...`);

  // 5-second window for the user to review and abort
  await sleep(5_000);

  // ── Main generation loop ──────────────────────────────────────────────────

  let totalGenerated   = 0;
  let totalSkipped     = 0; // frame slots already at cap
  let totalFailed      = 0;
  let totalApiCalls    = 0;

  // Fix 4 — hard cap: never exceed QUESTIONS_PER_FRAME API calls per slot per run
  const apiCallsThisRun = new Map<string, number>();

  for (const subjectId of SUBJECT_IDS) {
    const sts = subtopicsBySubject[subjectId];

    console.log(`\n${"═".repeat(60)}`);
    console.log(`  Starting ${subjectId} (${sts.length} sub-topics)`);
    console.log(`${"═".repeat(60)}\n`);

    let subjectGenerated = 0;
    let subjectApiCalls  = 0;

    for (const st of sts) {
      console.log(`[${st.subject_id}] ${st.name}`);

      const frameConfigs = SUBJECT_FRAMES[st.subject_id];
      if (!frameConfigs) {
        console.log(`  ⚠ No frame config for ${st.subject_id} — skipping`);
        continue;
      }

      const allowedFrames: Set<string> = st.subject_area
        ? new Set(SUBJECT_AREA_FRAMES[st.subject_area] ?? Object.keys(frameConfigs))
        : new Set(Object.keys(frameConfigs));

      for (const [frame, cfg] of Object.entries(frameConfigs)) {
        if (!allowedFrames.has(frame)) continue;

        const slotKey = `${st.id}::${frame}`;

        // Fix 4 — hard cap check (before any DB round-trip)
        const callsMadeThisRun = apiCallsThisRun.get(slotKey) ?? 0;
        if (callsMadeThisRun >= QUESTIONS_PER_FRAME) {
          console.log(`  ↷ ${frame} — per-run cap reached (${callsMadeThisRun}/${QUESTIONS_PER_FRAME})`);
          totalSkipped++;
          continue;
        }

        // Fix 1 — live DB count: not affected by Supabase's 1000-row default limit
        // Fetching prompt too so we can pass it to Claude for deduplication.
        const { data: existingQs, count: liveCount } = await supabase
          .from("questions")
          .select("prompt", { count: "exact" })
          .eq("sub_topic_id", st.id)
          .eq("frame", frame);

        const have = liveCount ?? 0;

        if (have >= QUESTIONS_PER_FRAME) {
          console.log(
            `  ↷ ${st.name} | ${frame} (${have}/${QUESTIONS_PER_FRAME}) — full`
          );
          totalSkipped++;
          continue;
        }

        const existingPrompts = (existingQs ?? [])
          .map((q) => q.prompt as string)
          .filter(Boolean);

        // Generate only what's needed, bounded by both DB gap and per-run cap
        const needFromDb      = QUESTIONS_PER_FRAME - have;
        const remainingRunCap = QUESTIONS_PER_FRAME - callsMadeThisRun;
        const need = Math.min(needFromDb, remainingRunCap);

        const runningPrompts = [...existingPrompts]; // grows within this slot's loop

        for (let n = 0; n < need; n++) {
          const nth = have + n + 1;

          try {
            const result = await generateQuestion(anthropic, st, frame, runningPrompts);

            const { error: insertErr } = await supabase.from("questions").insert({
              sub_topic_id:     st.id,
              topic_id:         st.topic_id,
              subject_id:       st.subject_id,
              frame,
              type:             cfg.type,
              cognitive_level:  cfg.level,
              prompt:           result.stem,
              options:          result.options      ?? null,
              correct_answer:   result.correct_answer,
              mark_scheme:      result.mark_scheme  ?? "See explanation.",
              explanation:      result.explanation  ?? "See mark scheme.",
              xp_reward:        cfg.xp,
              paper:            cfg.paper,
              shows_working:    cfg.shows_working,
              partial_marks:    cfg.partial_marks,
              ghanaian_context: cfg.ghanaian_context,
            });

            if (insertErr) throw new Error(`DB: ${insertErr.message}`);

            console.log(`  ✓ ${frame} (${nth}/${QUESTIONS_PER_FRAME}) — generated`);
            runningPrompts.push(result.stem);

            subjectGenerated++;
            totalGenerated++;
            subjectApiCalls++;
            totalApiCalls++;
            apiCallsThisRun.set(slotKey, (apiCallsThisRun.get(slotKey) ?? 0) + 1);

          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.log(`  ✗ ${frame} (${nth}/${QUESTIONS_PER_FRAME}): ${msg}`);
            totalFailed++;
          }

          await sleep(DELAY_MS);
        }
      }
    }

    // Fix 4 — subject-level summary
    const subjectCost = (subjectApiCalls * 0.005).toFixed(2);
    console.log(`\n${"═".repeat(60)}`);
    console.log(
      `  Completed ${subjectId}: ${subjectGenerated} generated, ` +
      `${subjectApiCalls} API calls, ~$${subjectCost}`
    );
    console.log(`${"═".repeat(60)}\n`);
  }

  // ── Overall summary ───────────────────────────────────────────────────────

  const { count: finalTotal } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .in("sub_topic_id", castTopics.map((s) => s.id));

  const totalCost = (totalApiCalls * 0.005).toFixed(2);

  console.log("─".repeat(60));
  console.log("Done.");
  console.log(`  ✓ Generated this run : ${totalGenerated}`);
  console.log(`  ↷ Slots at cap       : ${totalSkipped} frame slots (${QUESTIONS_PER_FRAME}/${QUESTIONS_PER_FRAME})`);
  if (totalFailed > 0) console.log(`  ✗ Failed             : ${totalFailed}`);
  console.log(`  📡 Total API calls   : ${totalApiCalls}`);
  console.log(`  💰 Estimated cost    : $${totalCost}`);
  console.log(`  📊 Total in database : ${(finalTotal ?? 0).toLocaleString()} questions`);
  console.log("─".repeat(60));

  if (totalFailed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
