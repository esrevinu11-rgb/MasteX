"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle, AlertCircle, ChevronRight, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUBJECTS, type WeeklyQuest, type QuestSubmission, type GradingResult } from "@/types";
import { cn, formatDate } from "@/lib/utils";

type Tab = "active" | "past";

const GRADE_COLORS: Record<string, string> = {
  needs_work: "#9CA3AF",
  good: "#60A5FA",
  excellent: "#34D399",
  outstanding: "#F59E0B",
};

const GRADE_LABELS: Record<string, string> = {
  needs_work: "Needs Work",
  good: "Good",
  excellent: "Excellent",
  outstanding: "Outstanding",
};

export default function QuestsPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [quests, setQuests] = useState<WeeklyQuest[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, QuestSubmission>>({});
  const [activeQuest, setActiveQuest] = useState<WeeklyQuest | null>(null);
  const [answers, setAnswers] = useState({ a: "", b: "", c: "" });
  const [submitting, setSubmitting] = useState(false);
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<QuestSubmission | null>(null);
  const [pastSubmissions, setPastSubmissions] = useState<QuestSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [yearGroup, setYearGroup] = useState<number>(1);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setStudentId(user.id);

      const { data: student } = await supabase
        .from("students").select("year_group").eq("id", user.id).single();
      const yr = student?.year_group || 1;
      setYearGroup(yr);

      const today = new Date().toISOString().split("T")[0];

      // Active quests (current week)
      const { data: activeQ } = await supabase
        .from("weekly_quests")
        .select("*")
        .eq("year_group", yr)
        .gte("week_end", today)
        .lte("week_start", today);
      setQuests(activeQ || []);

      // Student's existing submissions
      const { data: subs } = await supabase
        .from("quest_submissions")
        .select("*")
        .eq("student_id", user.id)
        .order("submitted_at", { ascending: false });

      const subsMap: Record<string, QuestSubmission> = {};
      (subs || []).forEach((s: QuestSubmission) => {
        subsMap[s.quest_id] = s;
      });
      setSubmissions(subsMap);
      setPastSubmissions((subs || []).filter((s: QuestSubmission) => !subsMap[s.quest_id] || s.submitted_at !== subsMap[s.quest_id].submitted_at ? false : true).slice(5));

      setLoading(false);
    }
    load();
  }, []);

  async function submitQuest() {
    if (!activeQuest || !studentId) return;
    setSubmitting(true);
    try {
      const { data: sub, error } = await supabase
        .from("quest_submissions")
        .upsert({
          quest_id: activeQuest.id,
          student_id: studentId,
          answer_a: answers.a,
          answer_b: answers.b,
          answer_c: answers.c,
        })
        .select()
        .single();

      if (error) throw error;

      // Grade via AI
      setGrading(true);
      const res = await fetch("/api/quests/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId: activeQuest.id,
          submissionId: sub.id,
          quest: activeQuest,
          answers,
        }),
      });

      if (res.ok) {
        const graded = await res.json();
        setGradeResult(graded);
        setSubmissions((prev) => ({ ...prev, [activeQuest.id]: graded }));
      }
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
      setGrading(false);
      setActiveQuest(null);
    }
  }

  // ─── GRADE RESULT VIEW ────────────────────────────────────────────────────
  if (gradeResult) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in">
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-8 text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#F59E0B]/15 flex items-center justify-center mx-auto mb-4">
            <Star size={36} className="text-[#F59E0B]" />
          </div>
          <h1 className="text-2xl font-black mb-1">Quest Graded!</h1>
          <p className="text-[#9CA3AF] text-sm mb-6">Here&apos;s your AI feedback</p>

          <div className="text-4xl font-black text-[#F59E0B] mb-2">
            +{gradeResult.total_xp} XP
          </div>
          <div className="text-sm text-[#9CA3AF] mb-8">
            Overall score: {Math.round(gradeResult.overall_score || 0)}/100
          </div>

          {/* Part grades */}
          {["a", "b", "c"].map((part) => {
            const grade = gradeResult[`grade_${part}` as keyof QuestSubmission] as GradingResult | null;
            if (!grade) return null;
            const color = GRADE_COLORS[grade.grade] || "#9CA3AF";
            return (
              <div key={part} className="bg-[#252320] rounded-xl p-4 mb-3 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold">Part {part.toUpperCase()}</span>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color, backgroundColor: `${color}20` }}>
                    {GRADE_LABELS[grade.grade]} · +{grade.xp_awarded} XP
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: "Relevance", val: grade.relevance },
                    { label: "Accuracy", val: grade.accuracy },
                    { label: "Depth", val: grade.depth },
                    { label: "Clarity", val: grade.clarity },
                  ].map((m) => (
                    <div key={m.label} className="text-center">
                      <div className="text-sm font-bold" style={{ color }}>{m.val}/25</div>
                      <div className="text-xs text-[#6B6860]">{m.label}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">{grade.feedback}</p>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setGradeResult(null)}
          className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-4 rounded-xl"
        >
          Back to Quests
        </button>
      </div>
    );
  }

  // ─── QUEST ANSWER FORM ────────────────────────────────────────────────────
  if (activeQuest) {
    const quest = activeQuest as WeeklyQuest & { part_a: { prompt: string; word_limit: number; xp_base: number }; part_b: { prompt: string; word_limit: number; xp_base: number }; part_c: { prompt: string; word_limit: number; xp_base: number } };
    const parts = [
      { key: "a" as const, label: "Part A — Knowledge Recall", data: quest.part_a, level: "L1" },
      { key: "b" as const, label: "Part B — Application", data: quest.part_b, level: "L2" },
      { key: "c" as const, label: "Part C — Critical Thinking", data: quest.part_c, level: "L3" },
    ];

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveQuest(null)}
            className="text-[#9CA3AF] hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-black">{activeQuest.title}</h1>
            <p className="text-xs text-[#6B6860] mt-0.5">
              Due {formatDate(activeQuest.week_end)}
            </p>
          </div>
        </div>

        <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl p-4 text-xs text-[#F59E0B]">
          <strong>AI Grading criteria:</strong> Relevance (25pts) · Accuracy (25pts) · Depth (25pts) · Clarity (25pts)
        </div>

        {parts.map(({ key, label, data, level }) => (
          <div key={key} className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2E2C28] flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">{label}</h3>
                <span className="text-xs text-[#6B6860]">Max {data.xp_base} XP base</span>
              </div>
              <span className="text-xs bg-[#252320] text-[#9CA3AF] px-2 py-1 rounded">{level}</span>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-[#D1D5DB] leading-relaxed">{data.prompt}</p>
              <textarea
                value={answers[key]}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={`Write your answer here... (max ${data.word_limit} words)`}
                rows={5}
                className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563] resize-none"
              />
              <div className="text-xs text-[#6B6860] text-right">
                {answers[key].trim().split(/\s+/).filter(Boolean).length} / {data.word_limit} words
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={submitQuest}
          disabled={submitting || grading || !answers.a.trim() || !answers.b.trim() || !answers.c.trim()}
          className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-black font-bold py-4 rounded-xl text-sm transition-colors"
        >
          {grading ? "AI grading your answers..." : submitting ? "Submitting..." : "Submit Quest for Grading"}
        </button>
      </div>
    );
  }

  // ─── MAIN LIST ────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Weekly Quests</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">New quests every Monday. Due by Sunday.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1A1916] border border-[#2E2C28] rounded-xl p-1">
        {(["active", "past"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors capitalize",
              tab === t
                ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
                : "text-[#6B6860] hover:text-white"
            )}
          >
            {t === "active" ? "This Week" : "Past Quests"}
          </button>
        ))}
      </div>

      {tab === "active" && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-[#6B6860]">Loading quests...</div>
          ) : quests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="text-[#2E2C28] mx-auto mb-4" />
              <div className="text-[#6B6860]">No quests available this week yet.</div>
              <div className="text-sm text-[#4B5563] mt-1">Check back on Monday!</div>
            </div>
          ) : (
            quests.map((quest) => {
              const sub = submissions[quest.id];
              const subject = SUBJECTS.find((s) => s.id === quest.subject_id);
              const isSubmitted = !!sub;

              return (
                <div
                  key={quest.id}
                  className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl overflow-hidden"
                >
                  <div className="p-5 flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: `${subject?.color}20` }}
                    >
                      {subject?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold">{quest.title}</h3>
                        {isSubmitted ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/20 px-2 py-1 rounded-lg flex-shrink-0">
                            <CheckCircle size={12} />
                            {sub.total_xp > 0 ? `+${sub.total_xp} XP` : "Submitted"}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2 py-1 rounded-lg flex-shrink-0">
                            <Clock size={12} />
                            Due soon
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[#6B6860] mt-1">{subject?.name}</p>
                      <div className="flex gap-3 mt-3 text-xs text-[#9CA3AF]">
                        <span>Part A: {(quest.part_a as {xp_base: number}).xp_base} XP</span>
                        <span>Part B: {(quest.part_b as {xp_base: number}).xp_base} XP</span>
                        <span>Part C: {(quest.part_c as {xp_base: number}).xp_base} XP</span>
                      </div>
                    </div>
                  </div>
                  {!isSubmitted && (
                    <div className="px-5 pb-5">
                      <button
                        onClick={() => {
                          setActiveQuest(quest);
                          setAnswers({ a: "", b: "", c: "" });
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[#F59E0B] font-semibold py-3 rounded-xl text-sm transition-colors"
                      >
                        Start Quest <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "past" && (
        <div className="space-y-4">
          {pastSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle size={48} className="text-[#2E2C28] mx-auto mb-4" />
              <div className="text-[#6B6860]">No past quest submissions yet.</div>
            </div>
          ) : (
            pastSubmissions.map((sub) => (
              <div key={sub.id} className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-semibold">Quest submission</div>
                    <div className="text-xs text-[#6B6860]">{formatDate(sub.submitted_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-[#F59E0B]">+{sub.total_xp} XP</div>
                    <div className="text-xs text-[#6B6860]">{Math.round(sub.overall_score || 0)}/100</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
