import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const FRAME_INSTRUCTIONS: Record<string, string> = {
  definition:
    "Create a DEFINITION question: ask the student to define a concept, state a law or rule, or identify a term. This is WAEC Level 1 (recall).",
  fill_blank:
    "Create a FILL-IN-THE-BLANK question: provide a sentence with a key term removed, represented as '___'. The student must supply the missing word or phrase. WAEC Level 1.",
  application:
    "Create an APPLICATION question: present a real-world scenario or practical problem that requires applying the concept. WAEC Level 2.",
  data_interpretation:
    "Create a DATA INTERPRETATION question: include a small data set, table, or describe a graph/chart, and ask the student to analyse or interpret it. WAEC Level 2.",
  comparison:
    "Create a COMPARISON question: ask the student to compare, contrast, or distinguish between two related concepts. WAEC Level 2.",
  evaluation:
    "Create an EVALUATION question: ask the student to evaluate, justify, assess, or argue a position on a topic. Open-ended critical thinking. WAEC Level 3.",
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      subjectId,
      topicName,
      topicId,
      frame,
      cognitiveLevel,
      waecSyllabusCode,
      existingQuestions = [],
    } = body;

    if (!subjectId || !topicName || !frame) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subjectNames: Record<string, string> = {
      maths: "Core Mathematics",
      english: "English Language",
      science: "Integrated Science",
      social: "Social Studies",
    };

    const frameInstruction = FRAME_INSTRUCTIONS[frame] || FRAME_INSTRUCTIONS.definition;
    const xpReward = cognitiveLevel === 3 ? 8 : cognitiveLevel === 2 ? 6 : 5;

    const systemPrompt = `You are an expert WAEC (West Africa Examinations Council) question writer for Ghana Senior High School students.
You generate high-quality, curriculum-aligned questions that test genuine understanding.
Always respond with valid JSON only — no markdown, no explanation, just the JSON object.`;

    const userPrompt = `Generate a WAEC-aligned question for:
- Subject: ${subjectNames[subjectId] || subjectId}
- Topic: ${topicName}
- Frame type: ${frame}
- Cognitive level: ${cognitiveLevel} (${cognitiveLevel === 1 ? "recall/knowledge" : cognitiveLevel === 2 ? "comprehension/application" : "evaluation/synthesis"})
${waecSyllabusCode ? `- WAEC syllabus code: ${waecSyllabusCode}` : ""}

${frameInstruction}

${existingQuestions.length > 0 ? `Avoid these questions (already asked): ${existingQuestions.slice(0, 3).join(" | ")}` : ""}

Return a JSON object with exactly these fields:
{
  "type": "mcq",
  "prompt": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "The exact text of the correct option",
  "mark_scheme": "Brief hint / key points to mention",
  "explanation": "Clear, educational explanation of the correct answer (2-3 sentences)",
  "difficulty": "easy" | "medium" | "hard"
}

For fill_blank frame, set type to "fill_blank" and options to null.
For evaluation frame, set type to "fill_blank" (open-ended text input) and options to null.
Make questions appropriate for Ghanaian SHS students. Use Ghana-specific examples where relevant.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    let questionData;
    try {
      questionData = JSON.parse(content.text.trim());
    } catch {
      // Try to extract JSON from response
      const match = content.text.match(/\{[\s\S]*\}/);
      if (match) {
        questionData = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse Claude response as JSON");
      }
    }

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from("questions")
      .insert({
        topic_id: topicId,
        subject_id: subjectId,
        frame,
        cognitive_level: cognitiveLevel,
        type: questionData.type || "mcq",
        prompt: questionData.prompt,
        options: questionData.options,
        correct_answer: questionData.correct_answer,
        mark_scheme: questionData.mark_scheme,
        explanation: questionData.explanation,
        xp_reward: xpReward,
        difficulty: questionData.difficulty || "medium",
        generated_by_ai: true,
      })
      .select()
      .single();

    if (saveError) {
      // Return without saving if DB insert fails (topic may not exist yet)
      return Response.json({
        id: `temp-${Date.now()}`,
        topic_id: topicId,
        subject_id: subjectId,
        frame,
        cognitive_level: cognitiveLevel,
        type: questionData.type || "mcq",
        prompt: questionData.prompt,
        options: questionData.options,
        correct_answer: questionData.correct_answer,
        mark_scheme: questionData.mark_scheme,
        explanation: questionData.explanation,
        xp_reward: xpReward,
        difficulty: questionData.difficulty || "medium",
        generated_by_ai: true,
      });
    }

    return Response.json(saved);
  } catch (error) {
    console.error("Question generation error:", error);
    return Response.json(
      { error: "Failed to generate question" },
      { status: 500 }
    );
  }
}
