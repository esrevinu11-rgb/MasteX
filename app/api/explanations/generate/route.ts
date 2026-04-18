import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

type Level = "beginner" | "intermediate" | "advanced";

const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  beginner:
    "A student who struggles with this subject. Use very simple words, short sentences, break into tiny steps, and relate to everyday Ghana life.",
  intermediate:
    "An average SHS Year 1 student. Use standard clear explanations with good examples.",
  advanced:
    "A strong student who grasps concepts quickly. Be concise with more technical depth.",
};

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sub_topic_id, student_level, force } = body as {
      sub_topic_id: string;
      student_level: Level;
      force?: boolean;
    };

    if (
      !sub_topic_id ||
      !["beginner", "intermediate", "advanced"].includes(student_level)
    ) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if explanation already exists
    const { data: existing } = await supabase
      .from("explanations")
      .select("*")
      .eq("sub_topic_id", sub_topic_id)
      .eq("student_level", student_level)
      .single();

    if (existing && !force) {
      return NextResponse.json({ explanation: existing });
    }

    // Fetch sub-topic details
    const { data: subTopic, error: stErr } = await supabase
      .from("sub_topics")
      .select("id, name, description, topics(name)")
      .eq("id", sub_topic_id)
      .single();

    if (stErr || !subTopic) {
      return NextResponse.json({ error: "Sub-topic not found" }, { status: 404 });
    }

    const topicName = (subTopic.topics as unknown as { name: string } | null)?.name ?? "Core Mathematics";
    const desc = subTopic.description ?? subTopic.name;

    const prompt = `You are an experienced Ghana SHS Mathematics teacher creating study content for the MasteX learning platform.

Sub-topic: ${subTopic.name}
Topic: ${topicName}
Sub-topic description: ${desc}
Student level: ${student_level}

${LEVEL_DESCRIPTIONS[student_level]}

Generate a complete learning package. Return ONLY a valid JSON object — no markdown, no extra text:

{
  "explanation": "Clear explanation of the concept. 150-250 words.",

  "worked_example": "A fully solved WAEC-style problem. Format:\\nQuestion: [the problem]\\nSolution:\\nStep 1: [step]\\nStep 2: [step]\\n...\\nFinal Answer: [answer]\\nNote: [one thing to watch out for].",

  "guided_practice": "A similar problem for the student to solve. Do NOT give the answer here.",

  "guided_hints": [
    "Hint 1: a gentle first nudge",
    "Hint 2: a more specific direction",
    "Hint 3: the final step described without giving the answer"
  ],

  "guided_answer": "The complete correct answer with every step shown clearly."
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return NextResponse.json({ error: "AI returned no text" }, { status: 500 });
    }

    let parsed: {
      explanation: string;
      worked_example: string;
      guided_practice: string;
      guided_hints: string[];
      guided_answer: string;
    };

    try {
      parsed = JSON.parse(stripFences(block.text));
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const { data: saved, error: saveErr } = await supabase
      .from("explanations")
      .upsert(
        {
          sub_topic_id,
          student_level,
          content: parsed.explanation,
          worked_example: parsed.worked_example,
          guided_practice: parsed.guided_practice,
          guided_hints: parsed.guided_hints,
          guided_answer: parsed.guided_answer,
          model_used: "claude-sonnet-4-20250514",
        },
        { onConflict: "sub_topic_id,student_level" }
      )
      .select()
      .single();

    if (saveErr) {
      return NextResponse.json({ error: saveErr.message }, { status: 500 });
    }

    return NextResponse.json({ explanation: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
