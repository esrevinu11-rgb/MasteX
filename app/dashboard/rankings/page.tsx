"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { RankBadge } from "@/components/ui/rank-badge";
import { XPBar } from "@/components/ui/xp-bar";
import { SUBJECTS, type Student } from "@/types";
import { cn } from "@/lib/utils";
import { Trophy, Crown } from "lucide-react";

type Scope = "overall" | "year" | "subject";

interface LeaderEntry {
  student_id: string;
  full_name: string;
  school_name: string;
  year_group: number;
  xp: number;
  rank: string;
  position: number;
}

export default function RankingsPage() {
  const [scope, setScope] = useState<Scope>("overall");
  const [subjectFilter, setSubjectFilter] = useState("core_math");
  const [yearFilter, setYearFilter] = useState<"" | "1" | "2" | "3">("");
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: s } = await supabase
        .from("students").select("*").eq("id", user.id).single();
      setStudent(s as Student);

      let query = supabase
        .from("students")
        .select("id, full_name, school_name, year_group, xp_overall, xp_year, xp_core_math, xp_english, xp_integrated_science, xp_social_studies, rank_overall, rank_year, rank_core_math, rank_english, rank_integrated_science, rank_social_studies, rank_position_overall, rank_position_year, subscription_status")
        .eq("subscription_status", "active");

      if (yearFilter) query = query.eq("year_group", yearFilter);

      let xpField = "xp_overall";
      let rankField = "rank_overall";
      let posField = "rank_position_overall";

      if (scope === "year") {
        xpField = "xp_year";
        rankField = "rank_year";
        posField = "rank_position_year";
      } else if (scope === "subject") {
        xpField = `xp_${subjectFilter}`;
        rankField = `rank_${subjectFilter}`;
        posField = "rank_position_overall"; // approximate
      }

      const { data: students } = await query
        .order(xpField as string, { ascending: false })
        .limit(50);

      const entries: LeaderEntry[] = (students || []).map((s: Record<string, unknown>, i: number) => ({
        student_id: s.id as string,
        full_name: s.full_name as string,
        school_name: s.school_name as string,
        year_group: s.year_group as number,
        xp: (s[xpField] as number) || 0,
        rank: (s[rankField] as string) || "F3",
        position: (s[posField] as number) || (i + 1),
      }));

      setLeaderboard(entries);
      setLoading(false);
    }
    load();
  }, [scope, subjectFilter, yearFilter]);

  const myEntry = student
    ? leaderboard.find((e) => e.student_id === student.id)
    : null;

  const myRank = scope === "overall"
    ? student?.rank_overall
    : scope === "year"
    ? student?.rank_year
    : student?.[`rank_${subjectFilter}` as keyof Student] as string;

  const myXP = scope === "overall"
    ? student?.xp_overall
    : scope === "year"
    ? student?.xp_year
    : student?.[`xp_${subjectFilter}` as keyof Student] as number;

  const myPos = scope === "overall"
    ? student?.rank_position_overall
    : student?.rank_position_year;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Rankings</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">Updated every 24 hours</p>
      </div>

      {/* My rank card */}
      {student && (
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-6">
          <div className="text-xs text-[#6B6860] mb-4 uppercase tracking-widest">Your Rank</div>
          <div className="flex items-center gap-4 mb-4">
            <RankBadge rank={myRank || "F3"} size="lg" />
            <div>
              <div className="text-2xl font-black">#{myPos || "—"}</div>
              <div className="text-sm text-[#9CA3AF]">{(myXP || 0).toLocaleString()} XP</div>
            </div>
          </div>
          <XPBar
            current={(myXP || 0) % 500}
            max={500}
            label="Progress to next rank"
          />
        </div>
      )}

      {/* Scope tabs */}
      <div className="flex gap-1 bg-[#1A1916] border border-[#2E2C28] rounded-xl p-1">
        {(["overall", "year", "subject"] as Scope[]).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors capitalize",
              scope === s
                ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
                : "text-[#6B6860] hover:text-white"
            )}
          >
            {s === "overall" ? "Overall" : s === "year" ? "Year Group" : "By Subject"}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {(scope === "overall" || scope === "year") && (
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value as "" | "1" | "2" | "3")}
            className="bg-[#1A1916] border border-[#2E2C28] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F59E0B]"
          >
            <option value="">All years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
          </select>
        )}

        {scope === "subject" && (
          <div className="flex gap-2 flex-wrap">
            {SUBJECTS.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSubjectFilter(sub.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-colors",
                  subjectFilter === sub.id
                    ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]"
                    : "border-[#2E2C28] text-[#9CA3AF] hover:border-[#3E3C38]"
                )}
              >
                {sub.icon} {sub.name.split(" ")[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="text-center py-12 text-[#6B6860]">Loading rankings...</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <Trophy size={48} className="text-[#2E2C28] mx-auto mb-4" />
          <div className="text-[#6B6860]">No active students to rank yet.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Podium top 3 */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
                const positions = [2, 1, 3];
                const pos = positions[i];
                const heights = ["pt-6", "pt-0", "pt-10"];
                const colors = ["#9CA3AF", "#F59E0B", "#CD7F32"];
                const isMe = entry?.student_id === student?.id;

                return (
                  <div
                    key={entry?.student_id || i}
                    className={cn("flex flex-col items-center", heights[i])}
                  >
                    <div
                      className={cn(
                        "w-full bg-[#1A1916] border rounded-2xl p-4 text-center",
                        isMe ? "border-[#F59E0B]/40" : "border-[#2E2C28]"
                      )}
                    >
                      {pos === 1 && <Crown size={20} className="text-[#F59E0B] mx-auto mb-2" />}
                      <RankBadge rank={entry?.rank || "F3"} size="sm" className="mx-auto mb-2" />
                      <div className="text-xs font-semibold truncate">
                        {entry?.full_name.split(" ")[0]}
                      </div>
                      <div className="text-xs text-[#F59E0B] font-bold mt-1">
                        #{pos}
                      </div>
                      <div className="text-xs text-[#6B6860]">
                        {(entry?.xp || 0).toLocaleString()} XP
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full list */}
          {leaderboard.map((entry, idx) => {
            const isMe = entry.student_id === student?.id;
            const podiumColors: Record<number, string> = { 1: "#F59E0B", 2: "#9CA3AF", 3: "#CD7F32" };
            const pos = idx + 1;

            return (
              <div
                key={entry.student_id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-all",
                  isMe
                    ? "bg-[#F59E0B]/5 border-[#F59E0B]/30"
                    : "bg-[#1A1916] border-[#2E2C28]"
                )}
              >
                <span
                  className="text-sm font-bold w-7 text-center flex-shrink-0"
                  style={{ color: podiumColors[pos] || "#6B6860" }}
                >
                  #{pos}
                </span>

                <RankBadge rank={entry.rank} size="xs" />

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    {entry.full_name}
                    {isMe && (
                      <span className="text-xs text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#6B6860]">
                    {entry.school_name} · Year {entry.year_group}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-[#F59E0B]">
                    {entry.xp.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#6B6860]">XP</div>
                </div>
              </div>
            );
          })}

          {/* My position if outside top 10 */}
          {myEntry && leaderboard.indexOf(myEntry) > 9 && (
            <div className="mt-4 flex items-center gap-4 p-4 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5">
              <span className="text-sm font-bold text-[#F59E0B] w-7 text-center">
                #{myEntry.position}
              </span>
              <RankBadge rank={myEntry.rank} size="xs" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{myEntry.full_name} <span className="text-xs text-[#F59E0B]">You</span></div>
              </div>
              <div className="text-sm font-bold text-[#F59E0B]">{myEntry.xp.toLocaleString()} XP</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
