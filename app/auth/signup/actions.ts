"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Deletes the auth user that was just created during signup when the
 * subsequent students-table insert fails, so the student can retry with
 * the same email address without hitting "user already registered".
 *
 * Safety guards:
 *  - Caller must be authenticated as the very user being deleted.
 *  - Deletion is blocked if a students row already exists (i.e. the
 *    account is actually usable — don't destroy working accounts).
 */
export async function deleteOrphanedAuthUser(): Promise<{ success: true } | { error: string }> {
  // 1. Verify the caller is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated — cannot delete." };
  }

  console.log("[cleanup] deleteOrphanedAuthUser called for:", user.id);

  // 2. Confirm there is genuinely no students row (extra safety)
  const { data: existingStudent } = await supabase
    .from("students")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existingStudent) {
    console.warn("[cleanup] students row EXISTS — refusing to delete auth user:", user.id);
    return { error: "Account has a profile — not deleting." };
  }

  // 3. Sign out first so the session cookie is cleared before we delete the user
  await supabase.auth.signOut();

  // 4. Delete via admin client (service-role key required)
  try {
    const admin = await createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("[cleanup] admin.deleteUser failed:", error);
      return { error: error.message };
    }
    console.log("[cleanup] orphaned auth user deleted:", user.id);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[cleanup] admin.deleteUser threw:", e);
    return { error: msg };
  }
}
