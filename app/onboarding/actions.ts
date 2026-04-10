"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface OnboardingPayload {
  confidence: {
    core_math: number;
    english: number;
    integrated_science: number;
    social_studies: number;
  };
  prefersExamplesFirst: boolean;
  focusDurationMinutes: 10 | 20 | 30;
  preferredStudyTime: "morning" | "afternoon" | "evening" | null;
  diagnosticScores: {
    core_math: number;
    english: number;
    integrated_science: number;
    social_studies: number;
  };
  mainGoal: "pass_waec" | "excellent_grades" | "improve_specific";
  studyDaysPerWeek: number;
  dailyGoalLevel: "light" | "standard" | "intense";
}

const GOAL_XP: Record<string, number> = {
  light: 50,
  standard: 100,
  intense: 150,
};

export async function saveOnboarding(payload: OnboardingPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const goalXp = GOAL_XP[payload.dailyGoalLevel];

  // Determine weak / strong subjects
  const subjects = ["core_math", "english", "integrated_science", "social_studies"] as const;
  const weakSubjects = subjects.filter(
    (s) =>
      payload.confidence[s] <= 2 ||
      payload.diagnosticScores[s] <= 33
  );
  const strongSubjects = subjects.filter(
    (s) =>
      payload.confidence[s] >= 3 &&
      payload.diagnosticScores[s] >= 67
  );

  // Focus subject = subject with lowest combined score
  // Combined score = confidence (1-4, scaled to 0-100 → ×25) + diagnostic (0-100)
  const focusSubject = subjects.reduce((worst, s) => {
    const scoreA = payload.confidence[worst] * 25 + payload.diagnosticScores[worst];
    const scoreB = payload.confidence[s] * 25 + payload.diagnosticScores[s];
    return scoreB < scoreA ? s : worst;
  });

  const overallDiagnostic = Math.round(
    subjects.reduce((sum, s) => sum + payload.diagnosticScores[s], 0) / 4
  );

  // 1. Upsert onboarding_profiles
  const { error: profileError } = await supabase
    .from("onboarding_profiles")
    .upsert(
      {
        student_id: user.id,
        confidence_core_math: payload.confidence.core_math,
        confidence_english: payload.confidence.english,
        confidence_integrated_science: payload.confidence.integrated_science,
        confidence_social_studies: payload.confidence.social_studies,
        diagnostic_core_math: payload.diagnosticScores.core_math,
        diagnostic_english: payload.diagnosticScores.english,
        diagnostic_integrated_science: payload.diagnosticScores.integrated_science,
        diagnostic_social_studies: payload.diagnosticScores.social_studies,
        prefers_examples_first: payload.prefersExamplesFirst,
        focus_duration_minutes: payload.focusDurationMinutes,
        preferred_study_time: payload.preferredStudyTime,
        main_goal: payload.mainGoal,
        study_days_per_week: payload.studyDaysPerWeek,
        daily_goal_level: payload.dailyGoalLevel,
        weak_subjects: weakSubjects,
        strong_subjects: strongSubjects,
      },
      { onConflict: "student_id" }
    );

  if (profileError) {
    console.error("Onboarding profile error:", profileError);
    return { error: "Failed to save your preferences. Please try again." };
  }

  // 2. Update students: mark onboarding complete + set focus subject + daily goal
  const { error: studentError } = await supabase
    .from("students")
    .update({
      onboarding_completed: true,
      focus_subject: focusSubject,
      daily_goal_xp: goalXp,
      learning_pace: "medium",
    })
    .eq("id", user.id);

  if (studentError) {
    console.error("Student update error:", studentError);
    return { error: "Failed to update your profile. Please try again." };
  }

  // 3. Upsert today's daily_goals row
  const today = new Date().toISOString().split("T")[0];
  await supabase.from("daily_goals").upsert(
    {
      student_id: user.id,
      date: today,
      goal_xp: goalXp,
    },
    { onConflict: "student_id,date" }
  );

  return {
    success: true,
    focusSubject,
    overallDiagnostic,
    weakSubjects,
    goalXp,
    dailyGoalLevel: payload.dailyGoalLevel,
  };
}
