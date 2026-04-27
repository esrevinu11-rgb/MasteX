"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
