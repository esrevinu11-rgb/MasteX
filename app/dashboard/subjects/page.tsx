import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RankBadge } from "@/components/ui/rank-badge";
import { XPBar } from "@/components/ui/xp-bar";
import { SUBJECTS, MASTERY_STATES, type Student, type MasteryState } from "@/types";
import { ChevronRight, Zap } from "lucide-react";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: student } = await supabase
    .from("students").select("*").eq("id", user.id).single();
  if (!student) redirect("/auth/login");
  const s = student as Student;

  // Fetch all topics with progress for this student
  const { data: topics } = await supabase
    .from("topics")
    .select("*, topic_progress!left(student_id, mastery_state, xp_earned, next_review_date)")
    .eq("year_group", s.year_group)
    .order("order_index");

  const subjectRank = {
    maths: s.rank_maths,
    english: s.rank_english,
    science: s.rank_science,
    social: s.rank_social,
  };

  const subjectXP = {
    maths: s.xp_maths,
    english: s.xp_english,
    science: s.xp_science,
    social: s.xp_social,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Subjects</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">Year {s.year_group} curriculum</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SUBJECTS.map((subject) => {
          const xp = subjectXP[subject.code as keyof typeof subjectXP] || 0;
          const rank = subjectRank[subject.code as keyof typeof subjectRank] || "F3";
          return (
            <div
              key={subject.id}
              className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-4 text-center"
            >
              <div className="text-2xl mb-2">{subject.icon}</div>
              <RankBadge rank={rank} size="sm" className="mx-auto mb-2" />
              <div className="text-xs font-semibold truncate">{subject.name.split(" ")[0]}</div>
              <div className="text-xs text-[#6B6860]">{xp.toLocaleString()} XP</div>
            </div>
          );
        })}
      </div>

      {/* Subject detail cards */}
      <div className="space-y-6">
        {SUBJECTS.map((subject) => {
          const xp = subjectXP[subject.code as keyof typeof subjectXP] || 0;
          const rank = subjectRank[subject.code as keyof typeof subjectRank] || "F3";
          const subjectTopics = (topics || []).filter((t: Record<string, unknown>) => t.subject_id === subject.id);

          const masteredCount = subjectTopics.filter((t: Record<string, unknown>) => {
            const prog = Array.isArray(t.topic_progress) ? t.topic_progress[0] : null;
            return prog?.mastery_state === "mastered" || prog?.mastery_state === "locked_in";
          }).length;

          return (
            <div
              key={subject.id}
              className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl overflow-hidden"
            >
              {/* Subject header */}
              <div
                className="px-6 py-5 border-b border-[#2E2C28]"
                style={{ borderLeftColor: subject.color, borderLeftWidth: 3 }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{subject.icon}</span>
                    <div>
                      <h2 className="font-bold">{subject.name}</h2>
                      <p className="text-xs text-[#6B6860]">
                        {masteredCount}/{subjectTopics.length} topics mastered
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RankBadge rank={rank} size="sm" />
                    <Link
                      href={`/dashboard/study?subject=${subject.id}`}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                    >
                      <Zap size={12} /> Study
                    </Link>
                  </div>
                </div>
                <div className="mt-4">
                  <XPBar current={xp % 500} max={500} showValues={false} color={subject.color} />
                  <div className="text-xs text-[#6B6860] mt-1">{xp.toLocaleString()} XP earned</div>
                </div>
              </div>

              {/* Topic list */}
              <div className="divide-y divide-[#2E2C28]">
                {subjectTopics.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-[#6B6860]">
                    No topics loaded yet.
                  </div>
                ) : (
                  subjectTopics.map((topic: Record<string, unknown>) => {
                    const prog = Array.isArray(topic.topic_progress) ? topic.topic_progress[0] : null;
                    const state: MasteryState = prog?.mastery_state || "unseen";
                    const stateInfo = MASTERY_STATES[state];
                    const isReviewDue =
                      prog?.next_review_date &&
                      new Date(prog.next_review_date) <= new Date();

                    return (
                      <Link
                        key={topic.id as string}
                        href={`/dashboard/study?topic=${topic.id}`}
                        className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#252320] transition-colors group"
                      >
                        {/* Mastery dot */}
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: stateInfo.color }}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{String(topic.name ?? "")}</div>
                          {topic.waec_code ? (
                            <div className="text-xs text-[#4B5563]">{String(topic.waec_code)}</div>
                          ) : null}
                        </div>

                        {/* State label */}
                        <div
                          className="text-xs font-medium px-2 py-1 rounded-lg"
                          style={{
                            color: stateInfo.color,
                            backgroundColor: stateInfo.bgColor,
                          }}
                        >
                          {isReviewDue ? "Review due" : stateInfo.label}
                        </div>

                        <ChevronRight
                          size={14}
                          className="text-[#4B5563] group-hover:text-[#9CA3AF] flex-shrink-0"
                        />
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
