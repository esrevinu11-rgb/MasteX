import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

type Frame =
  | "definition"
  | "fill_blank"
  | "application"
  | "data_interpretation"
  | "comparison"
  | "evaluation";

const FRAME_CONFIGS: Record<
  Frame,
  { level: number; type: "mcq" | "fill_blank" | "short_answer"; xp: number; instruction: string }
> = {
  definition: {
    level: 1,
    type: "mcq",
    xp: 5,
    instruction: "Test knowledge of the definition or key terms. 4 options (A–D), one correct.",
  },
  fill_blank: {
    level: 1,
    type: "fill_blank",
    xp: 5,
    instruction:
      "A sentence with one key term/value missing, shown as ___. The answer is a single word or number.",
  },
  application: {
    level: 2,
    type: "mcq",
    xp: 8,
    instruction:
      "A real-world or WAEC-style problem applying the concept. 4 options (A–D), one correct.",
  },
  data_interpretation: {
    level: 2,
    type: "mcq",
    xp: 8,
    instruction:
      "Provide a small table, set, or data scenario. Ask a question about it. 4 options (A–D).",
  },
  comparison: {
    level: 2,
    type: "short_answer",
    xp: 8,
    instruction:
      "Ask the student to compare, distinguish, or relate two aspects. Short answer (2–4 sentences).",
  },
  evaluation: {
    level: 3,
    type: "short_answer",
    xp: 12,
    instruction:
      "A challenging WAEC-style problem requiring multi-step reasoning. Short answer with full working.",
  },
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
    // Verify admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.email !== process.env.ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { question_id, sub_topic_id, sub_topic_name, frame } = body as {
      question_id: string;
      sub_topic_id: string;
      sub_topic_name: string;
      frame: Frame;
    };

    if (!question_id || !sub_topic_id || !sub_topic_name || !frame) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const cfg = FRAME_CONFIGS[frame];
    if (!cfg) return NextResponse.json({ error: "Invalid frame" }, { status: 400 });

    // Fetch sub-topic topic name
    const { data: st } = await supabase
      .from("sub_topics")
      .select("topics(name)")
      .eq("id", sub_topic_id)
      .single();

    const topicName =
      (st?.topics as unknown as { name: string } | null)?.name ?? "Core Mathematics";

    const isMCQ = cfg.type === "mcq";
    const prompt = `You are an experienced Ghana SHS Mathematics teacher creating WAEC-aligned exam questions for the MasteX learning platform.

Sub-topic: ${sub_topic_name}
Topic: ${topicName}
Frame: ${frame}
Level: ${cfg.level} (${cfg.level === 1 ? "recall" : cfg.level === 2 ? "application" : "evaluation"})
Question type: ${cfg.type}

Instruction: ${cfg.instruction}

Return ONLY a valid JSON object — no markdown, no extra text:

${
  isMCQ
    ? `{
  "stem": "The question text",
  "options": ["A. option one", "B. option two", "C. option three", "D. option four"],
  "correct_answer": "A",
  "explanation": "Brief explanation of why this answer is correct. 1-2 sentences."
}`
    : cfg.type === "fill_blank"
    ? `{
  "stem": "A sentence with ___ where the answer goes.",
  "options": null,
  "correct_answer": "the missing word or number",
  "explanation": "Brief explanation. 1-2 sentences."
}`
    : `{
  "stem": "The question text",
  "options": null,
  "correct_answer": "Full model answer with all steps shown.",
  "explanation": "Mark scheme: what a full-marks answer must include."
}`
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return NextResponse.json({ error: "AI returned no text" }, { status: 500 });
    }

    let parsed: {
      stem: string;
      options: string[] | null;
      correct_answer: string;
      explanation: string;
    };

    try {
      parsed = JSON.parse(stripFences(block.text));
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Update in DB
    const { data: updated, error: updateErr } = await supabase
      .from("questions")
      .update({
        stem: parsed.stem,
        options: parsed.options,
        correct_answer: parsed.correct_answer,
        explanation: parsed.explanation,
      })
      .eq("id", question_id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ question: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
