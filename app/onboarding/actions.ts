"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateReferralCode } from "@/lib/utils";

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
  programmeId: string | null;
}

const GOAL_XP: Record<string, number> = {
  light: 50,
  standard: 100,
  intense: 150,
};

function logSupabaseError(label: string, error: unknown) {
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    console.error(`[onboarding] ${label} failed:`, {
      message: e.message,
      code: e.code,
      details: e.details,
      hint: e.hint,
    });
  } else {
    console.error(`[onboarding] ${label} failed:`, error);
  }
}

export async function saveOnboarding(payload: OnboardingPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  console.log("[onboarding] saveOnboarding called for user:", user.id);

  const goalXp = GOAL_XP[payload.dailyGoalLevel];

  // Determine weak / strong subjects
  const subjects = ["core_math", "english", "integrated_science", "social_studies"] as const;
  const weakSubjects = subjects.filter(
    (s) => payload.confidence[s] <= 2 || payload.diagnosticScores[s] <= 33
  );
  const strongSubjects = subjects.filter(
    (s) => payload.confidence[s] >= 3 && payload.diagnosticScores[s] >= 67
  );

  // Focus subject = subject with lowest combined score
  // Combined score = confidence (1–4) × 25 + diagnostic (0–100)
  const focusSubject = subjects.reduce((worst, s) => {
    const scoreA = payload.confidence[worst] * 25 + payload.diagnosticScores[worst];
    const scoreB = payload.confidence[s] * 25 + payload.diagnosticScores[s];
    return scoreB < scoreA ? s : worst;
  });

  const overallDiagnostic = Math.round(
    subjects.reduce((sum, s) => sum + payload.diagnosticScores[s], 0) / 4
  );

  // ── Safety check: ensure the students row exists ─────────────
  // If signup created the auth user but the students insert failed,
  // the onboarding_profiles FK would violate without a parent row.
  // We attempt to create a minimal row here so onboarding can proceed.
  const { data: existingStudent } = await supabase
    .from("students")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!existingStudent) {
    console.warn("[onboarding] no students row for user:", user.id, "— creating minimal record");

    const fallbackName: string =
      (user.user_metadata?.full_name as string | undefined) ??
      user.email ??
      "Student";

    const { error: createErr } = await supabase.from("students").insert({
      id:                   user.id,
      full_name:            fallbackName,
      email:                user.email!,
      school_name:          "Not set",
      year_group:           1,
      referral_code:        generateReferralCode(fallbackName),
      subscription_status:  "inactive",
      onboarding_completed: false,
    });

    if (createErr) {
      console.error("[onboarding] failed to create missing students row:", {
        message: createErr.message,
        code:    createErr.code,
        details: createErr.details,
        hint:    createErr.hint,
      });
      return {
        error:
          "Your account profile is missing and could not be created. " +
          `Please sign out and sign up again. (${createErr.message})`,
      };
    }

    console.log("[onboarding] minimal students row created for:", user.id);
  }

  // Track errors from each step — all steps always attempt regardless of earlier failures
  const stepErrors: string[] = [];

  // ── Step 1: Upsert onboarding_profiles ──────────────────────
  console.log("[onboarding] step 1: upsert onboarding_profiles");
  try {
    const { error } = await supabase
      .from("onboarding_profiles")
      .upsert(
        {
          student_id:                         user.id,
          confidence_core_math:               payload.confidence.core_math,
          confidence_english:                 payload.confidence.english,
          confidence_integrated_science:      payload.confidence.integrated_science,
          confidence_social_studies:          payload.confidence.social_studies,
          diagnostic_core_math:               payload.diagnosticScores.core_math,
          diagnostic_english:                 payload.diagnosticScores.english,
          diagnostic_integrated_science:      payload.diagnosticScores.integrated_science,
          diagnostic_social_studies:          payload.diagnosticScores.social_studies,
          prefers_examples_first:             payload.prefersExamplesFirst,
          focus_duration_minutes:             payload.focusDurationMinutes,
          preferred_study_time:               payload.preferredStudyTime,
          main_goal:                          payload.mainGoal,
          study_days_per_week:                payload.studyDaysPerWeek,
          daily_goal_level:                   payload.dailyGoalLevel,
          weak_subjects:                      weakSubjects,
          strong_subjects:                    strongSubjects,
        },
        { onConflict: "student_id" }
      );

    if (error) {
      logSupabaseError("onboarding_profiles upsert", error);
      stepErrors.push(
        `Preferences: ${(error as { message?: string }).message ?? "unknown error"}`
      );
    } else {
      console.log("[onboarding] step 1: OK");
    }
  } catch (e) {
    console.error("[onboarding] onboarding_profiles upsert threw unexpectedly:", e);
    stepErrors.push("Preferences: unexpected error — check server logs");
  }

  // ── Step 2: Update students ──────────────────────────────────
  console.log("[onboarding] step 2: update students");
  try {
    const { error } = await supabase
      .from("students")
      .update({
        onboarding_completed: true,
        focus_subject:        focusSubject,
        daily_goal_xp:        goalXp,
        learning_pace:        "medium",
        programme_id:         payload.programmeId ?? null,
      })
      .eq("id", user.id);

    if (error) {
      logSupabaseError("students update", error);
      stepErrors.push(
        `Profile: ${(error as { message?: string }).message ?? "unknown error"}`
      );
    } else {
      console.log("[onboarding] step 2: OK");
    }
  } catch (e) {
    console.error("[onboarding] students update threw unexpectedly:", e);
    stepErrors.push("Profile: unexpected error — check server logs");
  }

  // ── Step 3: Upsert daily_goals ───────────────────────────────
  console.log("[onboarding] step 3: upsert daily_goals");
  const today = new Date().toISOString().split("T")[0];
  try {
    const { error } = await supabase
      .from("daily_goals")
      .upsert(
        {
          student_id: user.id,
          date:       today,
          goal_xp:    goalXp,
        },
        { onConflict: "student_id,date" }
      );

    if (error) {
      logSupabaseError("daily_goals upsert", error);
      // Non-fatal: daily goal is best-effort — don't block the user
      console.warn("[onboarding] step 3 failed (non-fatal):", error);
    } else {
      console.log("[onboarding] step 3: OK");
    }
  } catch (e) {
    console.error("[onboarding] daily_goals upsert threw unexpectedly:", e);
  }

  // Return errors from steps 1 & 2 only (step 3 is non-fatal)
  if (stepErrors.length > 0) {
    return { error: stepErrors.join(" | ") };
  }

  console.log("[onboarding] all steps complete — focusSubject:", focusSubject);

  return {
    success: true,
    focusSubject,
    overallDiagnostic,
    weakSubjects,
    goalXp,
    dailyGoalLevel: payload.dailyGoalLevel,
  };
}
