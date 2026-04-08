import { createClient } from "@/lib/supabase/server";
import { Users, CreditCard, TrendingUp, Tag, Check } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function AdminOverview() {
  const supabase = await createClient();

  // Stats
  const { count: totalStudents } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true });

  const { count: activeStudents } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("subscription_status", "active");

  const { data: payments } = await supabase
    .from("payments")
    .select("amount_paid, discount_pct, status, created_at")
    .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

  const monthlyRevenue = (payments || [])
    .filter((p: { status: string }) => p.status === "confirmed")
    .reduce((sum: number, p: { amount_paid: number }) => sum + p.amount_paid, 0);

  const avgDiscount =
    (payments || []).length > 0
      ? (payments || []).reduce((sum: number, p: { discount_pct: number }) => sum + p.discount_pct, 0) /
        (payments || []).length
      : 0;

  // Pending payments
  const { data: pendingPayments } = await supabase
    .from("payments")
    .select("*, students(full_name, email, school_name, year_group)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);

  // Recent signups
  const { data: recentSignups } = await supabase
    .from("students")
    .select("id, full_name, school_name, year_group, subscription_status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Year group breakdown
  const { data: yearBreakdown } = await supabase
    .from("students")
    .select("year_group");

  const yearCounts = { 1: 0, 2: 0, 3: 0 };
  (yearBreakdown || []).forEach((s: { year_group: number }) => {
    yearCounts[s.year_group as 1 | 2 | 3]++;
  });

  const paystackTarget = 50;
  const paystackProgress = Math.min(100, ((activeStudents || 0) / paystackTarget) * 100);

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Admin Overview</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: totalStudents || 0, icon: Users, color: "#60A5FA" },
          { label: "Active Subs", value: activeStudents || 0, icon: CreditCard, color: "#34D399" },
          { label: "Monthly Revenue", value: `GHC ${monthlyRevenue.toFixed(0)}`, icon: TrendingUp, color: "#F59E0B" },
          { label: "Avg Discount", value: `${avgDiscount.toFixed(1)}%`, icon: Tag, color: "#A78BFA" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                <stat.icon size={17} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-xs text-[#6B6860] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Paystack milestone */}
      <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold">Paystack Integration Milestone</h2>
          <span className="text-sm font-bold text-[#F59E0B]">
            {activeStudents}/{paystackTarget} students
          </span>
        </div>
        <div className="h-3 bg-[#252320] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${paystackProgress}%`, background: "linear-gradient(90deg, #F59E0B, #FBBF24)" }}
          />
        </div>
        <p className="text-xs text-[#6B6860] mt-2">
          Reach 50 active students to enable automatic Paystack payment processing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending payments */}
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2E2C28] flex justify-between items-center">
            <h2 className="font-bold">Pending Payments</h2>
            <Link href="/admin/payments" className="text-xs text-[#F59E0B] hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#2E2C28]">
            {!pendingPayments || pendingPayments.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-[#6B6860]">No pending payments</div>
            ) : (
              pendingPayments.map((payment: Record<string, unknown>) => {
                const student = payment.students as { full_name: string; email: string; year_group: number } | null;
                return (
                  <div key={payment.id as string} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{student?.full_name}</div>
                      <div className="text-xs text-[#6B6860]">
                        GHC {(payment.amount_paid as number).toFixed(0)} · {payment.method as string} · {formatDate(payment.created_at as string)}
                      </div>
                    </div>
                    <form action="/api/admin/confirm-payment" method="POST">
                      <input type="hidden" name="paymentId" value={payment.id as string} />
                      <input type="hidden" name="studentId" value={payment.student_id as string} />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 text-xs bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/30 px-3 py-1.5 rounded-lg hover:bg-[#34D399]/20 transition-colors"
                      >
                        <Check size={12} /> Confirm
                      </button>
                    </form>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent signups + year breakdown */}
        <div className="space-y-4">
          {/* Year group breakdown */}
          <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5">
            <h2 className="font-bold mb-4">Students by Year Group</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((yr) => {
                const count = yearCounts[yr as 1 | 2 | 3];
                const total = totalStudents || 1;
                const pct = (count / total) * 100;
                return (
                  <div key={yr}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#9CA3AF]">Year {yr}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-[#252320] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#F59E0B]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent signups */}
          <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2E2C28] flex justify-between">
              <h2 className="font-bold">Recent Signups</h2>
              <Link href="/admin/students" className="text-xs text-[#F59E0B] hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-[#2E2C28]">
              {(recentSignups || []).map((s: Record<string, unknown>) => (
                <div key={s.id as string} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{s.full_name as string}</div>
                    <div className="text-xs text-[#6B6860]">{s.school_name as string} · Year {s.year_group as number}</div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-lg ${
                      s.subscription_status === "active"
                        ? "bg-[#34D399]/10 text-[#34D399]"
                        : "bg-[#F59E0B]/10 text-[#F59E0B]"
                    }`}
                  >
                    {s.subscription_status as string}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
