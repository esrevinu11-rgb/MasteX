import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function GET() {
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Generate exactly 10 diagnostic multiple-choice questions for Ghana SHS Year 1 WAEC preparation.

Distribution: 3 Core Mathematics, 3 English Language, 2 Integrated Science, 2 Social Studies.

Each question tests fundamental concepts a Form 1 student might know from JHS. Keep difficulty at foundation level.

Return a valid JSON array only — no markdown, no preamble. Each object must have:
{
  "id": <number 1-10>,
  "subject": "core_math" | "english" | "integrated_science" | "social_studies",
  "question": "<question text>",
  "options": ["A. <text>", "B. <text>", "C. <text>", "D. <text>"],
  "correct": "A" | "B" | "C" | "D"
}`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      throw new Error("Unexpected response type from AI");
    }

    const questions = JSON.parse(block.text.trim());
    return NextResponse.json({ questions });
  } catch {
    // Fallback questions if AI call fails
    return NextResponse.json({ questions: FALLBACK_QUESTIONS });
  }
}

const FALLBACK_QUESTIONS = [
  {
    id: 1,
    subject: "core_math",
    question: "What is the value of 5² + 3²?",
    options: ["A. 34", "B. 64", "C. 25", "D. 16"],
    correct: "A",
  },
  {
    id: 2,
    subject: "core_math",
    question: "Simplify: 3x + 2x − x",
    options: ["A. 4x", "B. 5x", "C. 6x", "D. 3x"],
    correct: "A",
  },
  {
    id: 3,
    subject: "core_math",
    question: "A rectangle has length 8 cm and width 5 cm. What is its area?",
    options: ["A. 40 cm²", "B. 26 cm²", "C. 13 cm²", "D. 80 cm²"],
    correct: "A",
  },
  {
    id: 4,
    subject: "english",
    question: "Choose the correct plural of 'child':",
    options: ["A. childs", "B. childes", "C. children", "D. child's"],
    correct: "C",
  },
  {
    id: 5,
    subject: "english",
    question: "Which sentence is written in the passive voice?",
    options: [
      "A. The dog chased the cat.",
      "B. The cat was chased by the dog.",
      "C. The dog is chasing the cat.",
      "D. The dog had chased the cat.",
    ],
    correct: "B",
  },
  {
    id: 6,
    subject: "english",
    question: "What figure of speech is used in 'The wind howled angrily'?",
    options: [
      "A. Simile",
      "B. Metaphor",
      "C. Personification",
      "D. Hyperbole",
    ],
    correct: "C",
  },
  {
    id: 7,
    subject: "integrated_science",
    question:
      "Which of the following is NOT a renewable source of energy?",
    options: ["A. Solar", "B. Wind", "C. Coal", "D. Hydroelectric"],
    correct: "C",
  },
  {
    id: 8,
    subject: "integrated_science",
    question: "What is the chemical formula for water?",
    options: ["A. CO₂", "B. H₂O", "C. NaCl", "D. O₂"],
    correct: "B",
  },
  {
    id: 9,
    subject: "social_studies",
    question: "Which river is the longest in Ghana?",
    options: ["A. Ankobra", "B. Pra", "C. Volta", "D. Densu"],
    correct: "C",
  },
  {
    id: 10,
    subject: "social_studies",
    question: "Ghana gained independence from Britain in which year?",
    options: ["A. 1957", "B. 1960", "C. 1966", "D. 1945"],
    correct: "A",
  },
];
