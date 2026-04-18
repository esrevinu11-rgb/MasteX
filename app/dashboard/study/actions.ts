"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface QuestionAttemptData {
  question_id: string;
  answer: string;
  is_correct: boolean;
  xp_awarded: number;
  time_seconds: number;
  attempt_number: number;
}

export interface SaveSessionPayload {
  sub_topic_id: string;
  topic_id: string;
  subject_id: string;
  questions_attempted: number;
  questions_correct: number;
  xp_earned: number;
  time_spent_seconds: number;
  hints_used: number;
  support_mode_triggered: boolean;
  question_attempts: QuestionAttemptData[];
  frames_completed: string[];
  self_assessment_needed_solution: boolean; // true if student clicked "needed full solution"
}

const REVIEW_INTERVALS = [1, 3, 7, 21]; // days, indexed by 0-based session count

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export async function saveStudySession(payload: SaveSessionPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const studentId = user.id;
  const today = new Date().toISOString().split("T")[0];
  const accuracy =
    payload.questions_attempted > 0
      ? Math.round((payload.questions_correct / payload.questions_attempted) * 100)
      : 0;

  // ── 1. Fetch existing sub_topic_progress ───────────────────────────────────
  const { data: existingProgress } = await supabase
    .from("sub_topic_progress")
    .select("*")
    .eq("student_id", studentId)
    .eq("sub_topic_id", payload.sub_topic_id)
    .single();

  const sessionsPrev = existingProgress?.sessions_completed ?? 0;
  const passedPrev = existingProgress?.sessions_passed ?? 0;
  const framesPrev: string[] = existingProgress?.frames_completed ?? [];
  const consecutiveWrongPrev = existingProgress?.consecutive_wrong ?? 0;

  const sessionNumber = sessionsPrev + 1;
  const sessionPassed = accuracy >= 70;
  const passedNew = passedPrev + (sessionPassed ? 1 : 0);
  const framesNew = Array.from(new Set([...framesPrev, ...payload.frames_completed]));

  // Spaced repetition interval
  const intervalIndex = Math.min(sessionsPrev, REVIEW_INTERVALS.length - 1);
  const nextReviewDate = addDays(REVIEW_INTERVALS[intervalIndex]);

  // Support mode: triggered if student needed full solution 3 sessions in a row
  const consecutiveWrongNew = payload.self_assessment_needed_solution
    ? consecutiveWrongPrev + 1
    : 0;
  const supportModeActive = consecutiveWrongNew >= 3;

  // Mastery state calculation
  function calcMasteryState(): string {
    const allFramesDone = framesNew.length >= 6;
    if (passedNew >= 4 && accuracy >= 80) return "mastered";
    if (passedNew >= 3 && allFramesDone) return "consolidating";
    if (passedNew >= 2 && accuracy >= 70) return "practicing";
    if (sessionNumber >= 1) return "introduced";
    return existingProgress?.mastery_state ?? "unseen";
  }

  const newMasteryState = calcMasteryState();
  const prevMasteryState = existingProgress?.mastery_state ?? "unseen";

  // ── 2. Upsert sub_topic_progress ──────────────────────────────────────────
  await supabase.from("sub_topic_progress").upsert(
    {
      student_id: studentId,
      sub_topic_id: payload.sub_topic_id,
      topic_id: payload.topic_id,
      subject_id: payload.subject_id,
      mastery_state: newMasteryState,
      frames_completed: framesNew,
      sessions_completed: sessionNumber,
      sessions_passed: passedNew,
      consecutive_correct: sessionPassed ? (existingProgress?.consecutive_correct ?? 0) + 1 : 0,
      consecutive_wrong: consecutiveWrongNew,
      support_mode_active: supportModeActive,
      xp_earned_total: (existingProgress?.xp_earned_total ?? 0) + payload.xp_earned,
      next_review_date: nextReviewDate,
      last_reviewed_date: today,
    },
    { onConflict: "student_id,sub_topic_id" }
  );

  // ── 3. Insert study_sessions ───────────────────────────────────────────────
  const { data: sessionRow } = await supabase
    .from("study_sessions")
    .insert({
      student_id: studentId,
      sub_topic_id: payload.sub_topic_id,
      topic_id: payload.topic_id,
      subject_id: payload.subject_id,
      session_number: sessionNumber,
      phase_reached: "review",
      completed: true,
      questions_attempted: payload.questions_attempted,
      questions_correct: payload.questions_correct,
      accuracy_pct: accuracy,
      xp_earned: payload.xp_earned,
      time_spent_seconds: payload.time_spent_seconds,
      support_mode_triggered: payload.support_mode_triggered,
      hints_used: payload.hints_used,
      next_review_date: nextReviewDate,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const sessionId = sessionRow?.id;

  // ── 4. Insert question_attempts ────────────────────────────────────────────
  if (sessionId && payload.question_attempts.length > 0) {
    await supabase.from("question_attempts").insert(
      payload.question_attempts.map((qa) => ({
        student_id: studentId,
        question_id: qa.question_id,
        session_id: sessionId,
        sub_topic_id: payload.sub_topic_id,
        answer: qa.answer,
        is_correct: qa.is_correct,
        xp_awarded: qa.xp_awarded,
        used_hint: false,
        time_seconds: qa.time_seconds,
        attempt_number: qa.attempt_number,
      }))
    );

    // Update question stats
    for (const qa of payload.question_attempts) {
      try {
        await supabase.rpc("increment_question_stats", {
          p_question_id: qa.question_id,
          p_is_correct: qa.is_correct,
        }).throwOnError();
      } catch {
        // rpc may not exist yet — skip silently
      }
    }
  }

  // ── 5. Update students table ───────────────────────────────────────────────
  const { data: student } = await supabase
    .from("students")
    .select(
      "xp_core_math, xp_english, xp_integrated_science, xp_social_studies, xp_overall, xp_year, study_streak_days, longest_streak, last_study_date, daily_xp_today, daily_goal_xp"
    )
    .eq("id", studentId)
    .single();

  if (student) {
    const xpField = (
      {
        core_math: "xp_core_math",
        english: "xp_english",
        integrated_science: "xp_integrated_science",
        social_studies: "xp_social_studies",
      } as Record<string, string>
    )[payload.subject_id] ?? "xp_core_math";

    const currentSubjectXp = (student[xpField as keyof typeof student] as number) ?? 0;
    const newSubjectXp = currentSubjectXp + payload.xp_earned;

    // Streak logic
    const lastStudy = student.last_study_date;
    const yesterday = addDays(-1);
    let newStreak = student.study_streak_days ?? 0;
    if (lastStudy === yesterday) newStreak += 1;
    else if (lastStudy !== today) newStreak = 1;
    // if lastStudy === today, no change

    const newLongest = Math.max(student.longest_streak ?? 0, newStreak);
    const newDailyXp = (student.daily_xp_today ?? 0) + payload.xp_earned;
    const newXpOverall = (student.xp_overall ?? 0) + payload.xp_earned;

    await supabase
      .from("students")
      .update({
        [xpField]: newSubjectXp,
        xp_overall: newXpOverall,
        xp_year:
          (student.xp_core_math ?? 0) +
          (student.xp_english ?? 0) +
          (student.xp_integrated_science ?? 0) +
          (student.xp_social_studies ?? 0) +
          payload.xp_earned,
        study_streak_days: newStreak,
        longest_streak: newLongest,
        last_study_date: today,
        daily_xp_today: newDailyXp,
      })
      .eq("id", studentId);
  }

  // ── 6. Update daily_goals ──────────────────────────────────────────────────
  const { data: goalRow } = await supabase
    .from("daily_goals")
    .select("earned_xp, goal_xp, sessions_completed")
    .eq("student_id", studentId)
    .eq("date", today)
    .single();

  if (goalRow) {
    const newEarned = (goalRow.earned_xp ?? 0) + payload.xp_earned;
    await supabase
      .from("daily_goals")
      .update({
        earned_xp: newEarned,
        sessions_completed: (goalRow.sessions_completed ?? 0) + 1,
        goal_met: newEarned >= (goalRow.goal_xp ?? 100),
      })
      .eq("student_id", studentId)
      .eq("date", today);
  } else {
    // Create today's goal row (shouldn't usually be needed)
    const { data: studentGoal } = await supabase
      .from("students")
      .select("daily_goal_xp")
      .eq("id", studentId)
      .single();
    await supabase.from("daily_goals").insert({
      student_id: studentId,
      date: today,
      goal_xp: studentGoal?.daily_goal_xp ?? 100,
      earned_xp: payload.xp_earned,
      sessions_completed: 1,
      goal_met: payload.xp_earned >= (studentGoal?.daily_goal_xp ?? 100),
    });
  }

  return {
    sessionId,
    newMasteryState,
    prevMasteryState,
    nextReviewDate,
    intervalDays: REVIEW_INTERVALS[intervalIndex],
    supportModeActive,
    accuracy,
  };
}
