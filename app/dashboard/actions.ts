"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addSubject(subjectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase.from("student_subjects").upsert(
    { student_id: user.id, subject_id: subjectId, is_compulsory: false },
    { onConflict: "student_id,subject_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/dashboard/subjects");
  return { success: true };
}

export async function removeSubject(subjectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase
    .from("student_subjects")
    .delete()
    .eq("student_id", user.id)
    .eq("subject_id", subjectId)
    .eq("is_compulsory", false); // safety: never delete compulsory rows

  if (error) return { error: error.message };
  revalidatePath("/dashboard/subjects");
  return { success: true };
}

export async function saveProgramme(programmeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase
    .from("students")
    .update({ programme_id: programmeId })
    .eq("id", user.id);

  if (error) {
    console.error("[dashboard] saveProgramme failed:", error.message);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
