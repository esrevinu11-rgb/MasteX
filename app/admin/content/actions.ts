"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  if (user.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");
  return supabase;
}

export interface QuestionSavePayload {
  id: string;
  stem: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
}

export interface ExplanationSavePayload {
  id: string;
  content: string;
  worked_example: string;
  guided_practice: string;
  guided_hints: string[];
  guided_answer: string;
}

export async function saveQuestion(payload: QuestionSavePayload) {
  const supabase = await verifyAdmin();
  const { error } = await supabase
    .from("questions")
    .update({
      stem: payload.stem,
      options: payload.options,
      correct_answer: payload.correct_answer,
      explanation: payload.explanation,
    })
    .eq("id", payload.id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function saveExplanation(payload: ExplanationSavePayload) {
  const supabase = await verifyAdmin();
  const { error } = await supabase
    .from("explanations")
    .update({
      content: payload.content,
      worked_example: payload.worked_example,
      guided_practice: payload.guided_practice,
      guided_hints: payload.guided_hints,
      guided_answer: payload.guided_answer,
    })
    .eq("id", payload.id);
  if (error) return { error: error.message };
  return { ok: true };
}
