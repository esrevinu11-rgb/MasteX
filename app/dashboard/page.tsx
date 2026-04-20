import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RankBadge } from "@/components/ui/rank-badge";
import { XPBar } from "@/components/ui/xp-bar";
import { GoalRing } from "@/components/ui/goal-ring";
import { SUBJECTS, type Student } from "@/types";
import {
  Flame,
  Star,
  BookCheck,
  AlertCircle,
  ArrowRight,
  Calendar,
  Target,
} from "lucide-react";

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

  const today = new Date().toISOString().split("T")[0];

  // Mastered sub-topics count (overall)
  const { count: masteredCount } = await supabase
    .from("sub_topic_progress")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id)
    .in("mastery_state", ["mastered", "locked_in"]);

  // Per-subject mastered counts
  const subjectIds = ["core_math", "english", "integrated_science", "social_studies"];
  const masteredBySubjectResults = await Promise.all(
    subjectIds.map((sid) =>
      supabase
        .from("sub_topic_progress")
        .select("*", { count: "exact", head: true })
        .eq("student_id", user.id)
        .eq("subject_id", sid)
        .in("mastery_state", ["mastered", "locked_in"])
    )
  );
  const masteredBySubject: Record<string, number> = {};
  subjectIds.forEach((sid, i) => {
    masteredBySubject[sid] = masteredBySubjectResults[i].count ?? 0;
  });

  // Recent activity (last 5 study sessions)
  const { data: recentSessions } = await supabase
    .from("study_sessions")
    .select("id, subject_id, sub_topic_id, xp_earned, questions_correct, questions_attempted, created_at, sub_topics(name)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Due for review today
  const { data: dueItems } = await supabase
    .from("sub_topic_progress")
    .select("*, sub_topics(name, subject_id)")
    .eq("student_id", user.id)
    .lte("next_review_date", today)
    .neq("mastery_state", "unseen")
    .order("next_review_date", { ascending: true })
    .limit(5);

  // Active quest this week
  const { data: activeQuests } = await supabase
    .from("weekly_quests")
    .select("id")
    .eq("year_group", s.year_group)
    .lte("week_start", today)
    .gte("week_end", today)
    .limit(1);

  const hasActiveQuest = (activeQuests?.length ?? 0) > 0;

  // ── Derived values ──────────────────────────────────────────────────────────

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = s.full_name.split(" ")[0];

  const dailyGoalXp = s.daily_goal_xp || 100;
  const dailyXpToday = s.daily_xp_today || 0;
  const goalMet = dailyXpToday >= dailyGoalXp;

  const subjectXP = {
    core_math: s.xp_core_math,
    english: s.xp_english,
    integrated_science: s.xp_integrated_science,
    social_studies: s.xp_social_studies,
  };
  const subjectRank = {
    core_math: s.rank_core_math,
    english: s.rank_english,
    integrated_science: s.rank_integrated_science,
    social_studies: s.rank_social_studies,
  };

  const focusSubjectInfo = s.focus_subject
    ? SUBJECTS.find((sub) => sub.id === s.focus_subject)
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[#9CA3AF] text-sm">{greeting},</p>
          <h1 className="text-2xl font-black mt-0.5 text-[#F5F0E8]">
            {firstName} <span>👋</span>
          </h1>
          <p className="text-sm text-[#6B6860] mt-1">
            Year {s.year_group} · {s.school_name}
          </p>
        </div>

        {/* Overall rank */}
        <div className="flex items-center gap-3 bg-[#1A1916] border border-[#2E2C28] rounded-2xl px-4 py-3 flex-none">
          <RankBadge rank={s.rank_overall} size="md" />
          <div>
            <div className="text-xs text-[#6B6860]">Overall rank</div>
            <div className="text-sm font-bold">
              {s.rank_position_overall ? `#${s.rank_position_overall}` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Daily goal ring + stats row ──────────────────────────────────────── */}
      <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5 flex items-center gap-5">
        {/* Ring */}
        <div className="relative flex-none">
          <GoalRing
            current={dailyXpToday}
            goal={dailyGoalXp}
            size={80}
            strokeWidth={7}
            color={goalMet ? "#34D399" : "#F59E0B"}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black text-[#F5F0E8] leading-none">
              {dailyXpToday}
            </span>
            <span className="text-[9px] text-[#6B6860] leading-none mt-0.5">XP</span>
          </div>
        </div>

        {/* Goal info */}
        <div className="flex-1 min-w-0">
          {goalMet ? (
            <div className="text-base font-bold text-[#34D399]">Goal met! 🎉</div>
          ) : (
            <div className="text-base font-bold text-[#F5F0E8]">
              {dailyXpToday} / {dailyGoalXp} XP today
            </div>
          )}
          <div className="text-xs text-[#6B6860] mt-1">
            {goalMet
              ? "Amazing — come back tomorrow to keep your streak!"
              : `${dailyGoalXp - dailyXpToday} XP to hit your daily goal`}
          </div>
          <div className="mt-2 h-1.5 bg-[#2E2C28] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((dailyXpToday / dailyGoalXp) * 100, 100)}%`,
                backgroundColor: goalMet ? "#34D399" : "#F59E0B",
              }}
            />
          </div>
        </div>

        {/* Quick stats */}
        <div className="hidden sm:flex flex-col gap-2 flex-none">
          <div className="flex items-center gap-2 text-sm">
            <Flame size={14} className="text-[#F87171]" />
            <span className="font-bold">{s.study_streak_days}</span>
            <span className="text-[#6B6860] text-xs">day streak</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Star size={14} className="text-[#F59E0B]" />
            <span className="font-bold">{s.xp_overall.toLocaleString()}</span>
            <span className="text-[#6B6860] text-xs">total XP</span>
          </div>
        </div>
      </div>

      {/* ── Mobile stat pills ────────────────────────────────────────────────── */}
      <div className="flex gap-3 sm:hidden">
        <div className="flex-1 bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-3 flex items-center gap-2">
          <Flame size={16} className="text-[#F87171]" />
          <div>
            <div className="text-base font-black">{s.study_streak_days}</div>
            <div className="text-[10px] text-[#6B6860]">Day streak</div>
          </div>
        </div>
        <div className="flex-1 bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-3 flex items-center gap-2">
          <Star size={16} className="text-[#F59E0B]" />
          <div>
            <div className="text-base font-black">{s.xp_overall.toLocaleString()}</div>
            <div className="text-[10px] text-[#6B6860]">Total XP</div>
          </div>
        </div>
        <div className="flex-1 bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-3 flex items-center gap-2">
          <BookCheck size={16} className="text-[#34D399]" />
          <div>
            <div className="text-base font-black">{masteredCount ?? 0}</div>
            <div className="text-[10px] text-[#6B6860]">Mastered</div>
          </div>
        </div>
      </div>

      {/* ── Focus subject banner ─────────────────────────────────────────────── */}
      {focusSubjectInfo && (
        <Link href={`/dashboard/study?subject=${focusSubjectInfo.id}`}>
          <div
            className="rounded-2xl p-4 border flex items-center gap-4 hover:opacity-90 transition-opacity"
            style={{
              borderColor: `${focusSubjectInfo.color}30`,
              backgroundColor: `${focusSubjectInfo.color}08`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-none"
              style={{ backgroundColor: `${focusSubjectInfo.color}20` }}
            >
              {focusSubjectInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: focusSubjectInfo.color }}
              >
                Your focus
              </div>
              <div className="text-sm font-bold text-[#F5F0E8] mt-0.5">
                {focusSubjectInfo.name}
              </div>
              <div className="text-xs text-[#6B6860] mt-0.5 truncate">
                We&apos;ve prioritised this in your study plan
              </div>
            </div>
            <div className="flex items-center gap-1 flex-none">
              <span className="text-xs font-medium" style={{ color: focusSubjectInfo.color }}>
                Study now
              </span>
              <ArrowRight size={14} style={{ color: focusSubjectInfo.color }} />
            </div>
          </div>
        </Link>
      )}

      {/* ── Inactive subscription banner ─────────────────────────────────────── */}
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

      {/* ── Weekly quest alert ───────────────────────────────────────────────── */}
      {hasActiveQuest && (
        <Link href="/dashboard/quests">
          <div className="bg-[#34D399]/10 border border-[#34D399]/30 rounded-2xl p-4 flex items-center gap-3 hover:border-[#34D399]/50 transition-colors">
            <div className="w-10 h-10 bg-[#34D399]/15 rounded-xl flex items-center justify-center flex-none">
              <Calendar size={18} className="text-[#34D399]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#34D399]">
                Weekly quest available!
              </div>
              <div className="text-xs text-[#9CA3AF] mt-0.5">
                New quests are up — complete all 4 subjects for max XP.
              </div>
            </div>
            <ArrowRight size={16} className="text-[#34D399] flex-none" />
          </div>
        </Link>
      )}

      {/* ── Subject cards ────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-[#6B6860] uppercase tracking-widest mb-4">
          Your Subjects
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SUBJECTS.map((subject) => {
            const xp = subjectXP[subject.code as keyof typeof subjectXP] ?? 0;
            const rank = subjectRank[subject.code as keyof typeof subjectRank] ?? "F3";
            const isFocus = s.focus_subject === subject.id;
            return (
              <Link
                key={subject.id}
                href={`/dashboard/study?subject=${subject.id}`}
                className={`bg-[#1A1916] border rounded-2xl p-5 hover:border-[#3E3C38] transition-all group ${
                  isFocus ? "border-opacity-60" : "border-[#2E2C28]"
                }`}
                style={isFocus ? { borderColor: `${subject.color}50` } : {}}
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
                      <div className="text-sm font-semibold text-[#F5F0E8]">
                        {subject.name}
                      </div>
                      <div className="text-xs text-[#6B6860]">
                        {xp.toLocaleString()} XP
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-none">
                    {isFocus && (
                      <Target size={12} style={{ color: subject.color }} />
                    )}
                    <RankBadge rank={rank} size="sm" />
                  </div>
                </div>
                <XPBar
                  current={xp % 500}
                  max={500}
                  showValues={false}
                  color={subject.color}
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-[#6B6860]">
                    {masteredBySubject[subject.id] ?? 0} sub-topics mastered
                  </span>
                  <span
                    className="text-xs font-medium group-hover:opacity-80 transition-opacity"
                    style={{ color: subject.color }}
                  >
                    Study now →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Recent activity ──────────────────────────────────────────────────── */}
      {recentSessions && recentSessions.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[#6B6860] uppercase tracking-widest mb-4">
            Recent Activity
          </h2>
          <div className="space-y-2">
            {recentSessions.map((session: Record<string, unknown>) => {
              const subTopicName =
                (session.sub_topics as { name: string } | null)?.name ?? "Session";
              const subject = SUBJECTS.find((s) => s.id === (session.subject_id as string));
              const accuracy =
                (session.questions_attempted as number) > 0
                  ? Math.round(
                      ((session.questions_correct as number) /
                        (session.questions_attempted as number)) *
                        100
                    )
                  : 0;
              const date = new Date(session.created_at as string);
              const dateLabel = date.toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              return (
                <div
                  key={session.id as string}
                  className="flex items-center gap-4 bg-[#1A1916] border border-[#2E2C28] rounded-xl px-4 py-3"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-none"
                    style={{ backgroundColor: `${subject?.color ?? "#6B6860"}20` }}
                  >
                    {subject?.icon ?? "📖"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-[#F5F0E8]">
                      {subTopicName}
                    </div>
                    <div className="text-xs text-[#6B6860] mt-0.5">
                      {subject?.name} · {dateLabel}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-none">
                    <span className="text-xs font-bold text-[#F59E0B]">
                      +{session.xp_earned as number} XP
                    </span>
                    <span className="text-[10px] text-[#6B6860]">{accuracy}% correct</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Due for review ───────────────────────────────────────────────────── */}
      {dueItems && dueItems.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[#6B6860] uppercase tracking-widest mb-4">
            Due for Review Today
          </h2>
          <div className="space-y-2">
            {dueItems.map((item: Record<string, unknown>) => {
              const subTopic = item.sub_topics as { name: string; subject_id: string } | null;
              const subject = SUBJECTS.find((s) => s.id === subTopic?.subject_id);
              return (
                <Link
                  key={item.id as string}
                  href={`/dashboard/study?subtopic=${item.sub_topic_id}&mode=review`}
                  className="flex items-center gap-4 bg-[#1A1916] border border-[#2E2C28] rounded-xl px-4 py-3 hover:border-[#3E3C38] transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-none"
                    style={{ backgroundColor: `${subject?.color ?? "#6B6860"}20` }}
                  >
                    {subject?.icon ?? "📖"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-[#F5F0E8]">
                      {subTopic?.name ?? "Sub-topic"}
                    </div>
                    <div className="text-xs text-[#6B6860] mt-0.5">
                      {subject?.name} · Review due
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-[#6B6860] flex-none" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
