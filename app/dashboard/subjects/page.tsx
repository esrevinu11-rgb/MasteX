import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RankBadge } from "@/components/ui/rank-badge";
import { XPBar } from "@/components/ui/xp-bar";
import { SUBJECTS, MASTERY_STATES, type Student, type MasteryState } from "@/types";
import { ChevronRight, Zap } from "lucide-react";

export default async function SubjectsPage() {
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

  // Fetch topics for this year group
  const { data: topics } = await supabase
    .from("topics")
    .select("id, subject_id, name, waec_code, order_index")
    .eq("year_group", s.year_group)
    .order("order_index");

  // Fetch sub-topic progress for this student, joined with sub_topic's topic_id
  const { data: progressRows } = await supabase
    .from("sub_topic_progress")
    .select("sub_topic_id, topic_id, mastery_state, xp_earned_total, next_review_date")
    .eq("student_id", user.id);

  // Group progress by topic_id
  const progressByTopic = new Map<
    string,
    { state: MasteryState; due: boolean }[]
  >();
  for (const row of progressRows ?? []) {
    const list = progressByTopic.get(row.topic_id) ?? [];
    list.push({
      state: row.mastery_state as MasteryState,
      due: row.next_review_date
        ? new Date(row.next_review_date) <= new Date()
        : false,
    });
    progressByTopic.set(row.topic_id, list);
  }

  const subjectRank = {
    core_math: s.rank_core_math,
    english: s.rank_english,
    integrated_science: s.rank_integrated_science,
    social_studies: s.rank_social_studies,
  };

  const subjectXP = {
    core_math: s.xp_core_math,
    english: s.xp_english,
    integrated_science: s.xp_integrated_science,
    social_studies: s.xp_social_studies,
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
          const xp = subjectXP[subject.code as keyof typeof subjectXP] ?? 0;
          const rank = subjectRank[subject.code as keyof typeof subjectRank] ?? "F3";
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
          const xp = subjectXP[subject.code as keyof typeof subjectXP] ?? 0;
          const rank = subjectRank[subject.code as keyof typeof subjectRank] ?? "F3";
          const subjectTopics = (topics ?? []).filter(
            (t: Record<string, unknown>) => t.subject_id === subject.id
          );

          const masteredInSubject = subjectTopics.filter(
            (t: Record<string, unknown>) => {
              const rows = progressByTopic.get(t.id as string) ?? [];
              return rows.length > 0 && rows.every((r) =>
                r.state === "mastered" || r.state === "locked_in"
              );
            }
          ).length;

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
                        {masteredInSubject}/{subjectTopics.length} topics mastered
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
                    const rows = progressByTopic.get(topic.id as string) ?? [];
                    const hasDue = rows.some((r) => r.due);

                    // Derive a representative mastery state from sub-topic rows
                    let dominantState: MasteryState = "unseen";
                    if (rows.length > 0) {
                      const statePriority: MasteryState[] = [
                        "locked_in", "mastered", "consolidating",
                        "practicing", "introduced", "unseen",
                      ];
                      for (const sp of statePriority) {
                        if (rows.some((r) => r.state === sp)) {
                          dominantState = sp;
                          break;
                        }
                      }
                    }

                    const stateInfo = MASTERY_STATES[dominantState];

                    return (
                      <Link
                        key={topic.id as string}
                        href={`/dashboard/study?topic=${topic.id}`}
                        className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#252320] transition-colors group"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: stateInfo.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {String(topic.name ?? "")}
                          </div>
                          {topic.waec_code ? (
                            <div className="text-xs text-[#4B5563]">
                              {String(topic.waec_code)}
                            </div>
                          ) : null}
                        </div>
                        <div
                          className="text-xs font-medium px-2 py-1 rounded-lg"
                          style={{ color: stateInfo.color, backgroundColor: stateInfo.bgColor }}
                        >
                          {hasDue ? "Review due" : stateInfo.label}
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
