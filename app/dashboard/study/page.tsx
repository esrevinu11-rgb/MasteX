"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SUBJECTS, MASTERY_STATES, type MasteryState } from "@/types";
import {
  ChevronRight,
  ChevronDown,
  Lock,
  Clock,
  Zap,
  RotateCcw,
} from "lucide-react";

interface Topic {
  id: string;
  subject_id: string;
  name: string;
  description: string | null;
  order_index: number;
  strand_name: string | null;
  strand_order: number;
  prerequisite_ids: string[];
  year_group: number;
  sub_topics: SubTopicRow[];
}

interface SubTopicRow {
  id: string;
  topic_id: string;
  name: string;
  description: string | null;
  estimated_minutes: number;
  order_index: number;
  difficulty_level: number;
}

interface ProgressMap {
  [sub_topic_id: string]: {
    mastery_state: MasteryState;
    next_review_date: string | null;
  };
}

interface TopicMastery {
  [topic_id: string]: number; // 0-1
}

export default function StudySelectPage() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<string>("core_math");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [topicMastery, setTopicMastery] = useState<TopicMastery>({});
  const [masteredTopics, setMasteredTopics] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadTopics(selectedSubject);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject]);

  async function loadTopics(subjectId: string) {
    setLoading(true);
    setExpandedTopic(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch topics with sub_topics
    const { data: topicsData } = await supabase
      .from("topics")
      .select("*, strand_name, strand_order, sub_topics(id, topic_id, name, description, estimated_minutes, order_index, difficulty_level)")
      .eq("subject_id", subjectId)
      .eq("year_group", 1)
      .order("strand_order")
      .order("order_index");

    if (!topicsData) { setLoading(false); return; }

    // Fetch student's sub_topic_progress
    const subTopicIds = topicsData.flatMap((t) =>
      (t.sub_topics ?? []).map((st: SubTopicRow) => st.id)
    );

    const { data: progressData } = await supabase
      .from("sub_topic_progress")
      .select("sub_topic_id, mastery_state, next_review_date, topic_id")
      .eq("student_id", user.id)
      .in("sub_topic_id", subTopicIds);

    // Build progress map
    const prog: ProgressMap = {};
    const topicProgress: { [tid: string]: { total: number; mastered: number } } = {};

    for (const row of progressData ?? []) {
      prog[row.sub_topic_id] = {
        mastery_state: row.mastery_state as MasteryState,
        next_review_date: row.next_review_date,
      };
      if (!topicProgress[row.topic_id]) {
        topicProgress[row.topic_id] = { total: 0, mastered: 0 };
      }
      topicProgress[row.topic_id].total++;
      if (row.mastery_state === "mastered" || row.mastery_state === "locked_in") {
        topicProgress[row.topic_id].mastered++;
      }
    }

    // Compute mastery ratios
    const mastery: TopicMastery = {};
    const masteredSet = new Set<string>();
    for (const t of topicsData) {
      const stCount = (t.sub_topics ?? []).length;
      const tp = topicProgress[t.id];
      mastery[t.id] = stCount > 0 && tp ? tp.mastered / stCount : 0;
      if (mastery[t.id] === 1 && stCount > 0) masteredSet.add(t.id);
    }

    setTopics(topicsData as Topic[]);
    setProgress(prog);
    setTopicMastery(mastery);
    setMasteredTopics(masteredSet);
    setLoading(false);
  }

  function hasUnmetPrerequisite(topic: Topic): boolean {
    if (!topic.prerequisite_ids?.length) return false;
    return topic.prerequisite_ids.some((pid) => !masteredTopics.has(pid));
  }

  function getMasteryColor(state: MasteryState | undefined): string {
    if (!state) return "#2E2C28";
    return MASTERY_STATES[state]?.color ?? "#2E2C28";
  }

  // Group topics by strand_name (preserving order)
  const strandMap = new Map<string, Topic[]>();
  for (const t of topics) {
    const sn = t.strand_name ?? "General";
    if (!strandMap.has(sn)) strandMap.set(sn, []);
    strandMap.get(sn)!.push(t);
  }

  const DIFFICULTY_LABELS: Record<number, string> = { 1: "Easy", 2: "Med", 3: "Hard" };
  const DIFFICULTY_COLORS: Record<number, string> = { 1: "#34D399", 2: "#F59E0B", 3: "#F87171" };

  const subject = SUBJECTS.find((s) => s.id === selectedSubject) ?? SUBJECTS[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Study</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          Select a subject and sub-topic to begin a session
        </p>
      </div>

      {/* Subject selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SUBJECTS.map((s) => (
          <button
            type="button"
            key={s.id}
            onClick={() => setSelectedSubject(s.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
              selectedSubject === s.id
                ? "border-opacity-60"
                : "border-[#2E2C28] hover:border-[#3E3C38]"
            }`}
            style={
              selectedSubject === s.id
                ? { borderColor: s.color, backgroundColor: `${s.color}10` }
                : {}
            }
          >
            <span
              className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl"
              style={{ backgroundColor: `${s.color}20` }}
            >
              {s.icon}
            </span>
            <span className="text-xs font-semibold text-center leading-tight">
              {s.name.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Topics list */}
      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#6B6860] text-sm">Loading topics…</p>
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-16 text-[#6B6860]">
          No topics found for this subject yet.
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(strandMap.entries()).map(([strandName, strandTopics]) => (
            <div key={strandName}>
              {/* Strand header */}
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg"
                  style={{ color: subject.color, backgroundColor: `${subject.color}15` }}
                >
                  {strandName}
                </span>
                <div className="flex-1 h-px bg-[#2E2C28]" />
              </div>

              <div className="space-y-3">
                {strandTopics.map((topic) => {
                  const prereqWarning = hasUnmetPrerequisite(topic);
                  const mastery = topicMastery[topic.id] ?? 0;
                  const isExpanded = expandedTopic === topic.id;
                  const subTopics: SubTopicRow[] = topic.sub_topics ?? [];

                  return (
                    <div
                      key={topic.id}
                      className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl overflow-hidden"
                    >
                      {/* Topic header */}
                      <button
                        type="button"
                        onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-[#252320] transition-colors"
                      >
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-none"
                          style={{ backgroundColor: `${subject.color}20` }}
                        >
                          <span style={{ color: subject.color }}>{subject.icon}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[#F5F0E8]">
                              {topic.name}
                            </span>
                            {prereqWarning && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] uppercase tracking-wider flex items-center gap-1">
                                <Lock size={8} /> Prereq not met
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            {/* Progress bar */}
                            <div className="flex-1 h-1.5 bg-[#2E2C28] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${mastery * 100}%`,
                                  backgroundColor: subject.color,
                                }}
                              />
                            </div>
                            <span className="text-xs text-[#6B6860] flex-none">
                              {subTopics.length} sub-topics
                            </span>
                          </div>
                        </div>

                        <ChevronDown
                          size={16}
                          className={`text-[#6B6860] flex-none transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Sub-topics */}
                      {isExpanded && (
                        <div className="border-t border-[#2E2C28] divide-y divide-[#2E2C28]">
                          {subTopics.map((st) => {
                            const prog = progress[st.id];
                            const state = prog?.mastery_state;
                            const isDue =
                              prog?.next_review_date &&
                              prog.next_review_date <= today;
                            const stateInfo = state ? MASTERY_STATES[state] : null;
                            const diff = st.difficulty_level ?? 1;

                            return (
                              <div
                                key={st.id}
                                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#252320] transition-colors"
                              >
                                {/* Mastery dot */}
                                <div
                                  className="w-2.5 h-2.5 rounded-full flex-none"
                                  style={{ backgroundColor: getMasteryColor(state) }}
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-[#F5F0E8] font-medium truncate">
                                    {st.name}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <Clock size={10} className="text-[#4B5563]" />
                                    <span className="text-xs text-[#6B6860]">
                                      {st.estimated_minutes} min
                                    </span>
                                    {/* Difficulty badge */}
                                    <span
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                      style={{
                                        color: DIFFICULTY_COLORS[diff],
                                        backgroundColor: `${DIFFICULTY_COLORS[diff]}18`,
                                      }}
                                    >
                                      {DIFFICULTY_LABELS[diff]}
                                    </span>
                                    {stateInfo && (
                                      <span
                                        className="text-xs font-medium px-1.5 py-0.5 rounded"
                                        style={{
                                          color: stateInfo.color,
                                          backgroundColor: stateInfo.bgColor,
                                        }}
                                      >
                                        {stateInfo.label}
                                      </span>
                                    )}
                                    {isDue && (
                                      <span className="text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/15 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <RotateCcw size={9} />
                                        Review due
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <Link
                                  href={`/dashboard/study/${st.id}`}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex-none"
                                  style={{
                                    backgroundColor: isDue
                                      ? "#F59E0B"
                                      : `${subject.color}20`,
                                    color: isDue ? "black" : subject.color,
                                  }}
                                >
                                  {isDue ? (
                                    <>
                                      <RotateCcw size={11} /> Review
                                    </>
                                  ) : (
                                    <>
                                      <Zap size={11} /> Start
                                    </>
                                  )}
                                  <ChevronRight size={11} />
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
