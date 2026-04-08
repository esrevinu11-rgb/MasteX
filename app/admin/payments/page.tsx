"use client";

import { useState, useEffect } from "react";
import { Check, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PaymentRow {
  id: string;
  student_id: string;
  amount: number;
  discount_pct: number;
  amount_paid: number;
  method: string;
  reference: string;
  month: string;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  students: { full_name: string; email: string; school_name: string } | null;
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [filtered, setFiltered] = useState<PaymentRow[]>([]);
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    if (!monthFilter) {
      setFiltered(payments);
    } else {
      setFiltered(payments.filter((p) => p.month === monthFilter));
    }
  }, [payments, monthFilter]);

  async function loadPayments() {
    setLoading(true);
    const { data } = await supabase
      .from("payments")
      .select("*, students(full_name, email, school_name)")
      .order("created_at", { ascending: false });
    setPayments(data || []);
    setLoading(false);
  }

  async function confirmPayment(payment: PaymentRow) {
    setConfirming(payment.id);
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);

    await supabase
      .from("payments")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString(), confirmed_by: "admin" })
      .eq("id", payment.id);

    await supabase
      .from("students")
      .update({ subscription_status: "active", subscription_expires_at: expires.toISOString() })
      .eq("id", payment.student_id);

    await loadPayments();
    setConfirming(null);
  }

  const confirmed = filtered.filter((p) => p.status === "confirmed");
  const pending = filtered.filter((p) => p.status === "pending");
  const grossRevenue = confirmed.reduce((s, p) => s + p.amount, 0);
  const netRevenue = confirmed.reduce((s, p) => s + p.amount_paid, 0);
  const discounts = confirmed.reduce((s, p) => s + (p.amount - p.amount_paid), 0);

  // Generate month options
  const months: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Payments</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">Track and confirm student subscriptions</p>
      </div>

      {/* Month filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-[#9CA3AF]">Month:</label>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="bg-[#1A1916] border border-[#2E2C28] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F59E0B]"
        >
          <option value="">All time</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {new Date(m + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gross Revenue", value: `GHC ${grossRevenue.toFixed(0)}`, color: "#F59E0B" },
          { label: "Net Revenue", value: `GHC ${netRevenue.toFixed(0)}`, color: "#34D399" },
          { label: "Discounts Given", value: `GHC ${discounts.toFixed(0)}`, color: "#A78BFA" },
          { label: "Pending", value: pending.length, color: "#F87171" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5">
            <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-[#6B6860] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Paystack note */}
      <div className="flex items-start gap-3 bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-4">
        <Info size={16} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#9CA3AF]">
          <strong className="text-white">Paystack integration:</strong> Will auto-activate at 50 active students.
          Set <code className="bg-[#252320] px-1 rounded text-xs">NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY</code> and{" "}
          <code className="bg-[#252320] px-1 rounded text-xs">PAYSTACK_SECRET_KEY</code> in your environment variables.
        </p>
      </div>

      {/* Payments table */}
      <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2E2C28]">
          <h2 className="font-bold">Payment Records</h2>
        </div>
        {loading ? (
          <div className="text-center py-12 text-[#6B6860]">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-[#6B6860]">No payments for this period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2E2C28]">
                  {["Student", "Amount", "Method", "Reference", "Date", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-[#6B6860] font-semibold uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2C28]">
                {filtered.map((payment) => (
                  <tr key={payment.id} className="hover:bg-[#252320] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{payment.students?.full_name || "—"}</div>
                      <div className="text-xs text-[#6B6860]">{payment.students?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">GHC {payment.amount_paid.toFixed(0)}</div>
                      {payment.discount_pct > 0 && (
                        <div className="text-xs text-[#A78BFA]">{payment.discount_pct}% off</div>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-[#9CA3AF]">{payment.method}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">{payment.reference}</td>
                    <td className="px-4 py-3 text-[#9CA3AF] whitespace-nowrap">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-lg",
                          payment.status === "confirmed"
                            ? "bg-[#34D399]/10 text-[#34D399]"
                            : payment.status === "failed"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-[#F59E0B]/10 text-[#F59E0B]"
                        )}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {payment.status === "pending" && (
                        <button
                          onClick={() => confirmPayment(payment)}
                          disabled={confirming === payment.id}
                          className="flex items-center gap-1.5 text-xs bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/30 px-3 py-1.5 rounded-lg hover:bg-[#34D399]/20 disabled:opacity-50 transition-colors"
                        >
                          <Check size={12} />
                          {confirming === payment.id ? "..." : "Confirm"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
