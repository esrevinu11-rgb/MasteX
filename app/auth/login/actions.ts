"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Server-side ADMIN_EMAIL check — env var is available here
  if (email === process.env.ADMIN_EMAIL) {
    redirect("/admin");
  }

  redirect("/dashboard");
}
