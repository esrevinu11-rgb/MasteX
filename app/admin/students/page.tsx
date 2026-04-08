"use client";

import { useState, useEffect } from "react";
import { Search, X, Check, RefreshCw, Ban } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RankBadge } from "@/components/ui/rank-badge";
import { formatDate } from "@/lib/utils";
import type { Student } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    let result = students;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.school_name.toLowerCase().includes(q) ||
          s.referral_code.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter((s) => s.subscription_status === statusFilter);
    if (yearFilter) result = result.filter((s) => s.year_group === parseInt(yearFilter));
    setFiltered(result);
  }, [students, search, statusFilter, yearFilter]);

  async function loadStudents() {
    setLoading(true);
    const { data } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    setStudents(data || []);
    setLoading(false);
  }

  async function confirmPayment(studentId: string) {
    setActionLoading(true);
    const month = new Date().toISOString().slice(0, 7);
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);

    // Create payment record
    await supabase.from("payments").insert({
      student_id: studentId,
      amount: 40,
      discount_pct: 0,
      amount_paid: 40,
      method: "momo",
      reference: `ADM-${Date.now()}`,
      month,
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirmed_by: "admin",
    });

    // Activate student
    await supabase
      .from("students")
      .update({
        subscription_status: "active",
        subscription_expires_at: expires.toISOString(),
      })
      .eq("id", studentId);

    await loadStudents();
    setActionLoading(false);
  }

  async function deactivateStudent(studentId: string) {
    if (!confirm("Deactivate this student's subscription?")) return;
    setActionLoading(true);
    await supabase
      .from("students")
      .update({ subscription_status: "inactive" })
      .eq("id", studentId);
    await loadStudents();
    if (selected?.id === studentId) setSelected(null);
    setActionLoading(false);
  }

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Students</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">{students.length} total registered</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6860]" />
          <input
            type="text"
            placeholder="Search name, email, school, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1A1916] border border-[#2E2C28] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1A1916] border border-[#2E2C28] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="paused">Paused</option>
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="bg-[#1A1916] border border-[#2E2C28] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]"
        >
          <option value="">All years</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
        </select>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Table */}
        <div className="flex-1 min-w-0 overflow-auto bg-[#1A1916] border border-[#2E2C28] rounded-2xl">
          {loading ? (
            <div className="text-center py-12 text-[#6B6860]">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2E2C28]">
                  {["Name", "School", "Yr", "Rank", "Status", "Refs", "Code"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-[#6B6860] font-semibold uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => setSelected(student)}
                    className={cn(
                      "border-b border-[#2E2C28] cursor-pointer hover:bg-[#252320] transition-colors",
                      selected?.id === student.id && "bg-[#252320]"
                    )}
                  >
                    <td className="px-4 py-3 font-medium">{student.full_name}</td>
                    <td className="px-4 py-3 text-[#9CA3AF] max-w-32 truncate">{student.school_name}</td>
                    <td className="px-4 py-3 text-[#9CA3AF]">{student.year_group}</td>
                    <td className="px-4 py-3">
                      <RankBadge rank={student.rank_overall} size="xs" />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-lg",
                          student.subscription_status === "active"
                            ? "bg-[#34D399]/10 text-[#34D399]"
                            : student.subscription_status === "paused"
                            ? "bg-[#F59E0B]/10 text-[#F59E0B]"
                            : "bg-[#6B6860]/10 text-[#6B6860]"
                        )}
                      >
                        {student.subscription_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#9CA3AF]">{student.active_referral_count}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#F59E0B]">{student.referral_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 flex-shrink-0 bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5 overflow-y-auto animate-slide-in">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold">{selected.full_name}</h3>
              <button onClick={() => setSelected(null)} className="text-[#6B6860] hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <div>
                <div className="text-xs text-[#6B6860]">Email</div>
                <div className="truncate">{selected.email}</div>
              </div>
              <div>
                <div className="text-xs text-[#6B6860]">School</div>
                <div>{selected.school_name}</div>
              </div>
              <div className="flex gap-4">
                <div>
                  <div className="text-xs text-[#6B6860]">Year</div>
                  <div>{selected.year_group}</div>
                </div>
                <div>
                  <div className="text-xs text-[#6B6860]">Status</div>
                  <div
                    className={cn(
                      selected.subscription_status === "active" ? "text-[#34D399]" : "text-[#F59E0B]"
                    )}
                  >
                    {selected.subscription_status}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-[#6B6860]">Overall rank</div>
                <RankBadge rank={selected.rank_overall} size="sm" className="mt-1" />
              </div>
              <div>
                <div className="text-xs text-[#6B6860]">Total XP</div>
                <div className="font-bold text-[#F59E0B]">{selected.xp_overall.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-[#6B6860]">Referral code</div>
                <div className="font-mono text-[#F59E0B]">{selected.referral_code}</div>
              </div>
              <div>
                <div className="text-xs text-[#6B6860]">Active referrals</div>
                <div>{selected.active_referral_count} ({selected.discount_pct}% discount)</div>
              </div>
              <div>
                <div className="text-xs text-[#6B6860]">Joined</div>
                <div>{formatDate(selected.created_at)}</div>
              </div>
              {selected.subscription_expires_at && (
                <div>
                  <div className="text-xs text-[#6B6860]">Expires</div>
                  <div>{formatDate(selected.subscription_expires_at)}</div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {selected.subscription_status !== "active" && (
                <button
                  onClick={() => confirmPayment(selected.id)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#34D399]/10 hover:bg-[#34D399]/20 border border-[#34D399]/30 text-[#34D399] font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  <Check size={14} /> Confirm Payment
                </button>
              )}
              {selected.subscription_status === "active" && (
                <button
                  onClick={() => deactivateStudent(selected.id)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  <Ban size={14} /> Deactivate
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
