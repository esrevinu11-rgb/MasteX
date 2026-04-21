import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

// XP awarded based on 0–100 AI score, scaled against the question's xp_reward
function scoreToXp(score: number, xpReward: number): number {
  if (score >= 90) return xpReward;
  if (score >= 70) return Math.round(xpReward * 0.8);
  if (score >= 50) return Math.round(xpReward * 0.6);
  if (score >= 30) return Math.round(xpReward * 0.3);
  return 0;
}

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export async function POST(request: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const body = await request.json();
  const { question_id, answer, time_seconds } = body as {
    question_id: string;
    answer: string;
    time_seconds: number;
  };

  if (!question_id || typeof answer !== "string") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // ── Anti-cheat: minimum time ──────────────────────────────────────────────
  if (typeof time_seconds === "number" && time_seconds < 3) {
    return NextResponse.json({
      score: 0,
      xp_awarded: 0,
      feedback: "Answer submitted too quickly — slow down and think it through.",
      rubric: { relevance: 0, accuracy: 0, depth: 0, clarity: 0 },
      flagged: true,
      flag_reason: "too_fast",
    });
  }

  // ── Anti-cheat: minimum answer length ────────────────────────────────────
  if (answer.trim().length < 5) {
    return NextResponse.json({
      score: 0,
      xp_awarded: 0,
      feedback: "Answer is too short to grade. Write a proper response.",
      rubric: { relevance: 0, accuracy: 0, depth: 0, clarity: 0 },
      flagged: true,
      flag_reason: "too_short",
    });
  }

  // ── Fetch question ────────────────────────────────────────────────────────
  const { data: question, error: qErr } = await supabase
    .from("questions")
    .select("id, prompt, mark_scheme, cognitive_level, xp_reward")
    .eq("id", question_id)
    .single();

  if (qErr || !question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const cogLabel =
    question.cognitive_level === 1
      ? "Knowledge/Recall (L1)"
      : question.cognitive_level === 2
      ? "Application/Analysis (L2)"
      : "Evaluation/Synthesis (L3)";

  // ── Grade with Claude ─────────────────────────────────────────────────────
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 350,
    system: `You are an expert WAEC examiner for Ghana Senior High School.
Grade student answers against the mark scheme fairly and constructively.
Respond with valid JSON only — no markdown fences, no extra text.`,
    messages: [
      {
        role: "user",
        content: `Grade this student's answer.

Question: ${question.prompt}
Mark Scheme: ${question.mark_scheme}
Cognitive Level: ${cogLabel}
Student's Answer: ${answer.trim()}

Grade on 4 criteria, each 0–25 (total 100):
1. relevance — Does the answer address what the question asks?
2. accuracy  — Are the facts, concepts, or calculations correct?
3. depth     — Does the answer show understanding beyond surface recall?
4. clarity   — Is the answer well-structured and clearly expressed?

Return ONLY this JSON (no fences):
{
  "relevance": <0-25>,
  "accuracy": <0-25>,
  "depth": <0-25>,
  "clarity": <0-25>,
  "score": <sum of above, 0-100>,
  "feedback": "<2-3 sentences of constructive, encouraging feedback specific to this answer>"
}`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== "text") {
    return NextResponse.json({ error: "Unexpected AI response" }, { status: 500 });
  }

  // ── Parse response ────────────────────────────────────────────────────────
  let data: {
    relevance: number;
    accuracy: number;
    depth: number;
    clarity: number;
    score: number;
    feedback: string;
  };

  try {
    data = JSON.parse(stripFences(textContent.text));
  } catch {
    const match = textContent.text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        data = JSON.parse(match[0]);
      } catch {
        return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
    }
  }

  const score = Math.max(0, Math.min(100, data.score ?? 0));
  const xp_awarded = scoreToXp(score, question.xp_reward ?? 20);

  return NextResponse.json({
    score,
    xp_awarded,
    feedback: data.feedback ?? "Good effort! Keep practising.",
    rubric: {
      relevance: Math.max(0, Math.min(25, data.relevance ?? 0)),
      accuracy: Math.max(0, Math.min(25, data.accuracy ?? 0)),
      depth: Math.max(0, Math.min(25, data.depth ?? 0)),
      clarity: Math.max(0, Math.min(25, data.clarity ?? 0)),
    },
    flagged: false,
  });
}
