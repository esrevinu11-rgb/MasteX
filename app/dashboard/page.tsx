import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RankBadge } from "@/components/ui/rank-badge";
import { XPBar } from "@/components/ui/xp-bar";
import { SUBJECTS, MASTERY_STATES, type Student } from "@/types";
import { Flame, Star, BookCheck, AlertCircle, ArrowRight, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function DashboardHome() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!student) redirect("/auth/login");

  const s = student as Student;

  // Fetch topic progress for reviews due today
  const today = new Date().toISOString().split("T")[0];
  const { data: dueTopics } = await supabase
    .from("topic_progress")
    .select("*, topics(name, subject_id)")
    .eq("student_id", user.id)
    .lte("next_review_date", today)
    .neq("mastery_state", "unseen")
    .limit(5);

  // Fetch active quest for current week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const { data: activeQuests } = await supabase
    .from("weekly_quests")
    .select("*")
    .eq("year_group", s.year_group)
    .gte("week_end", today)
    .lte("week_start", today)
    .limit(1);

  const hasActiveQuest = activeQuests && activeQuests.length > 0;

  // Subject cards data
  const subjectXP = {
    maths: s.xp_maths,
    english: s.xp_english,
    science: s.xp_science,
    social: s.xp_social,
  };
  const subjectRank = {
    maths: s.rank_maths,
    english: s.rank_english,
    science: s.rank_science,
    social: s.rank_social,
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = s.full_name.split(" ")[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[#9CA3AF] text-sm">{greeting},</p>
          <h1 className="text-2xl font-black mt-0.5">
            {firstName} <span className="text-[#F59E0B]">👋</span>
          </h1>
          <p className="text-sm text-[#6B6860] mt-1">
            Year {s.year_group} · {s.school_name}
          </p>
        </div>

        {/* Overall rank */}
        <div className="flex items-center gap-3 bg-[#1A1916] border border-[#2E2C28] rounded-2xl px-4 py-3">
          <RankBadge rank={s.rank_overall} size="md" />
          <div>
            <div className="text-xs text-[#6B6860]">Overall rank</div>
            <div className="text-sm font-bold">#{s.rank_overall_position}</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-4 text-center">
          <Star size={20} className="text-[#F59E0B] mx-auto mb-2" />
          <div className="text-xl font-black">{s.xp_overall.toLocaleString()}</div>
          <div className="text-xs text-[#6B6860] mt-0.5">Total XP</div>
        </div>
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-4 text-center">
          <Flame size={20} className="text-[#F87171] mx-auto mb-2" />
          <div className="text-xl font-black">{s.study_streak_days}</div>
          <div className="text-xs text-[#6B6860] mt-0.5">Day streak</div>
        </div>
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-4 text-center">
          <BookCheck size={20} className="text-[#34D399] mx-auto mb-2" />
          <div className="text-xl font-black">0</div>
          <div className="text-xs text-[#6B6860] mt-0.5">Mastered</div>
        </div>
      </div>

      {/* Inactive subscription banner */}
      {s.subscription_status === "inactive" && (
        <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#F59E0B]">Payment pending</div>
            <div className="text-xs text-[#9CA3AF] mt-0.5">
              Your account is inactive. Pay GHC 40 via MoMo and the admin will confirm within 24h.
            </div>
          </div>
        </div>
      )}

      {/* Quest alert */}
      {hasActiveQuest && (
        <Link href="/dashboard/quests">
          <div className="bg-[#34D399]/10 border border-[#34D399]/30 rounded-2xl p-4 flex items-center gap-3 hover:border-[#34D399]/50 transition-colors">
            <div className="w-10 h-10 bg-[#34D399]/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-[#34D399]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#34D399]">Weekly quest available!</div>
              <div className="text-xs text-[#9CA3AF] mt-0.5">
                New quests are up — complete all 4 subjects for max XP.
              </div>
            </div>
            <ArrowRight size={16} className="text-[#34D399]" />
          </div>
        </Link>
      )}

      {/* Subject cards */}
      <div>
        <h2 className="text-sm font-semibold text-[#6B6860] uppercase tracking-widest mb-4">
          Your Subjects
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SUBJECTS.map((subject) => {
            const xp = subjectXP[subject.code as keyof typeof subjectXP] || 0;
            const rank = subjectRank[subject.code as keyof typeof subjectRank] || "F3";
            return (
              <Link
                key={subject.id}
                href={`/dashboard/study?subject=${subject.id}`}
                className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5 hover:border-[#3E3C38] transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${subject.color}20` }}
                    >
                      {subject.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{subject.name}</div>
                      <div className="text-xs text-[#6B6860]">{xp.toLocaleString()} XP</div>
                    </div>
                  </div>
                  <RankBadge rank={rank} size="sm" />
                </div>
                <XPBar
                  current={xp % 500}
                  max={500}
                  showValues={false}
                  color={subject.color}
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-[#6B6860]">0 topics mastered</span>
                  <span className="text-xs font-medium group-hover:text-[#F59E0B] transition-colors" style={{ color: subject.color }}>
                    Study now →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Due for review */}
      {dueTopics && dueTopics.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#6B6860] uppercase tracking-widest mb-4">
            Due for Review Today
          </h2>
          <div className="space-y-2">
            {dueTopics.map((tp: Record<string, unknown>) => {
              const topic = tp.topics as { name: string; subject_id: string } | null;
              const subject = SUBJECTS.find((s) => s.id === topic?.subject_id);
              const state = MASTERY_STATES[tp.mastery_state as keyof typeof MASTERY_STATES];
              return (
                <Link
                  key={tp.topic_id as string}
                  href={`/dashboard/study?topic=${tp.topic_id}&mode=review`}
                  className="flex items-center gap-4 bg-[#1A1916] border border-[#2E2C28] rounded-xl px-4 py-3 hover:border-[#3E3C38] transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: `${subject?.color}20` }}
                  >
                    {subject?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{topic?.name}</div>
                    <div className="text-xs" style={{ color: state?.color }}>
                      {state?.label}
                    </div>
                  </div>
                  <div className="text-xs text-[#6B6860]">Review</div>
                  <ArrowRight size={14} className="text-[#6B6860]" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
