import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { GradingResult, QuestGrade } from "@/types";
import { XP_REWARDS } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function gradePart(
  prompt: string,
  answer: string,
  partLabel: string,
  cognitiveLevel: number,
  xpBase: number
): Promise<GradingResult> {
  const systemPrompt = `You are an expert WAEC examiner for Ghana Senior High School.
Grade student answers fairly and constructively using the provided rubric.
Always respond with valid JSON only.`;

  const userPrompt = `Grade this student's answer to a ${partLabel} question.

Question prompt: ${prompt}
Student's answer: ${answer}
Cognitive level: ${cognitiveLevel === 1 ? "Knowledge/Recall (L1)" : cognitiveLevel === 2 ? "Application/Analysis (L2)" : "Evaluation/Synthesis (L3)"}

Grade on 4 criteria, each out of 25 points (total 100):
1. Relevance: Does the answer address the question?
2. Accuracy: Are the facts/concepts correct?
3. Depth: Does the answer show understanding beyond surface level?
4. Clarity: Is the answer well-expressed and organised?

XP tiers:
- Needs Work (0-49): ${XP_REWARDS.QUEST_NEEDS_WORK} XP
- Good (50-69): ${XP_REWARDS.QUEST_GOOD} XP
- Excellent (70-84): ${XP_REWARDS.QUEST_EXCELLENT} XP
- Outstanding (85-100): ${XP_REWARDS.QUEST_OUTSTANDING} XP

Return JSON:
{
  "relevance": <0-25>,
  "accuracy": <0-25>,
  "depth": <0-25>,
  "clarity": <0-25>,
  "score": <total 0-100>,
  "grade": "needs_work" | "good" | "excellent" | "outstanding",
  "feedback": "2-3 sentences of constructive, encouraging feedback specific to this answer"
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response");

  let data;
  try {
    data = JSON.parse(content.text.trim());
  } catch {
    const match = content.text.match(/\{[\s\S]*\}/);
    if (match) {
      data = JSON.parse(match[0]);
    } else {
      throw new Error("Could not parse grading response");
    }
  }

  const grade: QuestGrade = data.grade || "needs_work";
  const xpMap: Record<QuestGrade, number> = {
    needs_work: XP_REWARDS.QUEST_NEEDS_WORK,
    good: XP_REWARDS.QUEST_GOOD,
    excellent: XP_REWARDS.QUEST_EXCELLENT,
    outstanding: XP_REWARDS.QUEST_OUTSTANDING,
  };

  // Apply multiplier for Excellent
  let xpAwarded = xpMap[grade];
  if (grade === "excellent") xpAwarded = Math.round(xpAwarded * 1.5);

  return {
    score: data.score || 0,
    grade,
    xp_awarded: xpAwarded,
    relevance: data.relevance || 0,
    accuracy: data.accuracy || 0,
    depth: data.depth || 0,
    clarity: data.clarity || 0,
    feedback: data.feedback || "Good effort!",
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questId, submissionId, quest, answers } = body;

    if (!questId || !answers) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Grade all 3 parts in parallel
    const [gradeA, gradeB, gradeC] = await Promise.all([
      gradePart(
        quest.part_a?.prompt || "Describe the concept.",
        answers.a,
        "Part A (Knowledge Recall)",
        1,
        quest.part_a?.xp_base || 10
      ),
      gradePart(
        quest.part_b?.prompt || "Apply the concept.",
        answers.b,
        "Part B (Application)",
        2,
        quest.part_b?.xp_base || 25
      ),
      gradePart(
        quest.part_c?.prompt || "Evaluate critically.",
        answers.c,
        "Part C (Critical Thinking)",
        3,
        quest.part_c?.xp_base || 45
      ),
    ]);

    const totalXP = gradeA.xp_awarded + gradeB.xp_awarded + gradeC.xp_awarded;
    const overallScore = (gradeA.score + gradeB.score + gradeC.score) / 3;

    // Update submission with grades
    const { data: updated, error } = await supabase
      .from("quest_submissions")
      .update({
        grade_a: gradeA,
        grade_b: gradeB,
        grade_c: gradeC,
        overall_score: overallScore,
        total_xp: totalXP,
        graded_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .eq("student_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("DB update error:", error);
      // Return grades even if DB update fails
      return Response.json({
        id: submissionId,
        quest_id: questId,
        student_id: user.id,
        grade_a: gradeA,
        grade_b: gradeB,
        grade_c: gradeC,
        overall_score: overallScore,
        total_xp: totalXP,
        graded_at: new Date().toISOString(),
      });
    }

    // Award XP to student
    const xpField = `xp_${quest.subject_id === "maths" ? "maths" : quest.subject_id === "english" ? "english" : quest.subject_id === "science" ? "science" : "social"}`;
    await supabase.rpc("update_student_xp_totals", { p_student_id: user.id });

    return Response.json(updated);
  } catch (error) {
    console.error("Quest grading error:", error);
    return Response.json({ error: "Failed to grade quest" }, { status: 500 });
  }
}
