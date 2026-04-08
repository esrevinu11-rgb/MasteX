import { createClient } from "@/lib/supabase/server";
import { calculateDiscount } from "@/lib/utils";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { method, reference } = body;

  if (!reference?.trim()) {
    return Response.json({ error: "Reference is required" }, { status: 400 });
  }

  // Get student discount
  const { data: student } = await supabase
    .from("students")
    .select("active_referral_count, discount_pct")
    .eq("id", user.id)
    .single();

  const discount = student?.discount_pct || 0;
  const baseAmount = 40;
  const amountPaid = baseAmount * (1 - discount / 100);
  const month = new Date().toISOString().slice(0, 7);

  const { error } = await supabase.from("payments").insert({
    student_id: user.id,
    amount: baseAmount,
    discount_pct: discount,
    amount_paid: amountPaid,
    method: method || "momo",
    reference: reference.trim(),
    month,
    status: "pending",
  });

  if (error) {
    return Response.json({ error: "Failed to record payment" }, { status: 500 });
  }

  return Response.json({ success: true, amountPaid, discount });
}
