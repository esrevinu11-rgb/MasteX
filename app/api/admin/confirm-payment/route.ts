import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || user.email !== adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const paymentId = formData.get("paymentId") as string;
  const studentId = formData.get("studentId") as string;

  const expires = new Date();
  expires.setMonth(expires.getMonth() + 1);

  await supabase
    .from("payments")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirmed_by: user.email,
    })
    .eq("id", paymentId);

  await supabase
    .from("students")
    .update({
      subscription_status: "active",
      subscription_expires_at: expires.toISOString(),
    })
    .eq("id", studentId);

  return NextResponse.redirect(new URL("/admin", request.url));
}
