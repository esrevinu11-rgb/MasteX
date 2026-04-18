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
  topics: { name: string; strand_name: string | null } | null;
}

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

function buildPrompt(st: SubTopic, frame: string): string {
  switch (st.subject_id) {
    case "core_math":          return mathPrompt(st, frame);
    case "english":            return englishPrompt(st, frame);
    case "social_studies":     return socialPrompt(st, frame);
    case "integrated_science": return sciencePrompt(st, frame);
    default: throw new Error(`Unknown subject_id: ${st.subject_id}`);
  }
}

// ─── Generation ───────────────────────────────────────────────────────────────

async function generateQuestion(
  client: Anthropic,
  st: SubTopic,
  frame: string
): Promise<GeneratedQuestion> {
  const cfg = SUBJECT_FRAMES[st.subject_id][frame];

  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1800,
    messages: [{ role: "user", content: buildPrompt(st, frame) }],
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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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

  console.log("Fetching sub-topics for all subjects…");
  const { data: subTopics, error } = await supabase
    .from("sub_topics")
    .select("id, topic_id, name, description, subject_id, topics(name, strand_name)")
    .in("subject_id", SUBJECT_IDS)
    .order("subject_id")
    .order("topic_id")
    .order("order_index");

  if (error || !subTopics?.length) {
    console.error("❌  Failed to fetch sub-topics:", error?.message ?? "empty result");
    process.exit(1);
  }

  // Fetch existing questions to skip
  const { data: existing } = await supabase
    .from("questions")
    .select("sub_topic_id, frame")
    .in("sub_topic_id", subTopics.map((s) => s.id));

  const existingSet = new Set(
    (existing ?? []).map((q) => `${q.sub_topic_id}::${q.frame}`)
  );

  const totalNeeded = subTopics.length * 6;
  console.log(`Found ${subTopics.length} sub-topics × 6 frames = ${totalNeeded} questions needed.`);
  if (existingSet.size > 0) console.log(`  ↷ Skipping ${existingSet.size} already generated.\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const st of subTopics as unknown as SubTopic[]) {
    console.log(`[${st.subject_id}] ${st.name}`);

    const frameConfigs = SUBJECT_FRAMES[st.subject_id];
    if (!frameConfigs) {
      console.log(`  ⚠ No frame config for ${st.subject_id} — skipping`);
      continue;
    }

    for (const [frame, cfg] of Object.entries(frameConfigs)) {
      const key = `${st.id}::${frame}`;
      if (existingSet.has(key)) {
        console.log(`  ↷ ${frame}`);
        skipped++;
        continue;
      }

      try {
        const result = await generateQuestion(anthropic, st, frame);

        const { error: insertErr } = await supabase.from("questions").upsert(
          {
            sub_topic_id:    st.id,
            topic_id:        st.topic_id,
            subject_id:      st.subject_id,
            frame,
            type:            cfg.type             ?? "mcq",
            cognitive_level: cfg.level,
            prompt:          result.stem,
            options:         result.options        ?? null,
            correct_answer:  result.correct_answer,
            mark_scheme:     result.mark_scheme    ?? "See explanation.",
            explanation:     result.explanation    ?? "See mark scheme.",
            xp_reward:       cfg.xp               ?? 5,
            paper:           cfg.paper,
            shows_working:   cfg.shows_working,
            partial_marks:   cfg.partial_marks,
            ghanaian_context: cfg.ghanaian_context,
          },
          { onConflict: "sub_topic_id,frame", ignoreDuplicates: true }
        );

        if (insertErr) throw new Error(`DB: ${insertErr.message}`);

        console.log(`  ✓ ${frame} (${cfg.paper})`);
        generated++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`  ✗ ${frame}: ${msg}`);
        failed++;
      }

      await sleep(DELAY_MS);
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log("Done.");
  console.log(`  ✓ Generated : ${generated}`);
  if (skipped > 0) console.log(`  ↷ Skipped   : ${skipped}`);
  if (failed > 0) console.log(`  ✗ Failed    : ${failed}`);
  console.log("─".repeat(60));

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
