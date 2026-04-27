"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SUBJECTS } from "@/types";
import { PROGRAMMES } from "@/lib/programmes";
import { saveOnboarding, type OnboardingPayload } from "./actions";
import {
  Brain,
  Zap,
  Trophy,
  Target,
  ChevronRight,
  ChevronLeft,
  Check,
  Star,
  Clock,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "mastex_onboarding";

const GOAL_LEVEL_INFO = {
  light: {
    label: "Light",
    sessions: "1 session per day",
    time: "~20 minutes",
    xp: 50,
    forWho: "Busy students",
  },
  standard: {
    label: "Standard",
    sessions: "2 sessions per day",
    time: "~40 minutes",
    xp: 100,
    forWho: "Most students",
    recommended: true,
  },
  intense: {
    label: "Intense",
    sessions: "3 sessions per day",
    time: "~60 minutes",
    xp: 150,
    forWho: "Motivated students",
  },
} as const;

const MAIN_GOALS = [
  { id: "pass_waec", emoji: "🎓", label: "Pass WASSCE with good grades", desc: "Aim for at least C6 in every subject" },
  { id: "excellent_grades", emoji: "⭐", label: "Get excellent grades (A's and B's)", desc: "Top performance in all subjects" },
  { id: "improve_specific", emoji: "🎯", label: "Improve in specific subjects I'm weak in", desc: "Targeted help where you need it most" },
] as const;

const STUDY_DAYS_OPTIONS = [
  { value: 3, label: "3 days" },
  { value: 4, label: "4 days" },
  { value: 5, label: "5 days" },
  { value: 7, label: "Every day" },
];

const CONFIDENCE_OPTIONS = [
  { value: 1, emoji: "😰", label: "I struggle a lot" },
  { value: 2, emoji: "🤔", label: "I understand some parts" },
  { value: 3, emoji: "🙂", label: "I'm fairly comfortable" },
  { value: 4, emoji: "💪", label: "I'm strong in this" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type StepId = 1 | 2 | 3 | 4 | 5 | 6;
type PhaseId = StepId | "analysing" | "results";

interface DiagQuestion {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correct: string;
}

interface SavedState {
  confidence: Record<string, number>;
  prefersExamplesFirst: boolean | null;
  focusDurationMinutes: 10 | 20 | 30;
  preferredStudyTime: "morning" | "afternoon" | "evening" | null;
  mainGoal: "pass_waec" | "excellent_grades" | "improve_specific" | null;
  studyDaysPerWeek: number | null;
  dailyGoalLevel: "light" | "standard" | "intense";
  programmeId: string | null;
}

interface ResultData {
  focusSubject: string;
  overallDiagnostic: number;
  goalXp: number;
  dailyGoalLevel: "light" | "standard" | "intense";
}

const DEFAULT_STATE: SavedState = {
  confidence: { core_math: 0, english: 0, integrated_science: 0, social_studies: 0 },
  prefersExamplesFirst: null,
  focusDurationMinutes: 20,
  preferredStudyTime: null,
  mainGoal: null,
  studyDaysPerWeek: null,
  dailyGoalLevel: "standard",
  programmeId: null,
};

// ─── Root Component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [phase, setPhase] = useState<PhaseId>(1);
  const [studentName, setStudentName] = useState("");
  const [saved, setSaved] = useState<SavedState>(DEFAULT_STATE);
  const [diagQuestions, setDiagQuestions] = useState<DiagQuestion[]>([]);
  const [diagAnswers, setDiagAnswers] = useState<Record<number, string>>({});
  const [diagScores, setDiagScores] = useState<Record<string, number>>({});
  const [currentDiagIndex, setCurrentDiagIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<ResultData | null>(null);

  // Load from localStorage + fetch student name on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSaved(JSON.parse(stored));
      } catch {
        // ignore corrupt data
      }
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("students")
        .select("full_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) {
            setStudentName(data.full_name.split(" ")[0]);
          }
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage on every state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved]);

  const updateSaved = (patch: Partial<SavedState>) => {
    setSaved((s) => ({ ...s, ...patch }));
  };

  // Fetch diagnostic questions from API
  const fetchDiagnostic = useCallback(async () => {
    if (diagQuestions.length > 0) return;
    try {
      const res = await fetch("/api/diagnostic");
      if (!res.ok) throw new Error("API error");
      const { questions } = await res.json();
      setDiagQuestions(questions);
    } catch {
      setSaveError("Could not load the diagnostic test. Please refresh and try again.");
    }
  }, [diagQuestions.length]);

  const goTo = (next: PhaseId) => {
    setSaveError(null);
    if (next === 5) fetchDiagnostic();
    setPhase(next);
  };

  // Handle a diagnostic answer — auto-advance or finish
  const handleDiagAnswer = (letter: string) => {
    const q = diagQuestions[currentDiagIndex];
    if (!q || diagAnswers[q.id]) return;

    const newAnswers = { ...diagAnswers, [q.id]: letter };
    setDiagAnswers(newAnswers);

    if (currentDiagIndex < diagQuestions.length - 1) {
      setTimeout(() => setCurrentDiagIndex((i) => i + 1), 350);
    } else {
      // Compute per-subject scores
      const correct: Record<string, number> = {};
      const total: Record<string, number> = {};
      diagQuestions.forEach((dq) => {
        total[dq.subject] = (total[dq.subject] || 0) + 1;
        if (newAnswers[dq.id] === dq.correct) {
          correct[dq.subject] = (correct[dq.subject] || 0) + 1;
        }
      });
      const scores: Record<string, number> = {};
      for (const subj of Object.keys(total)) {
        scores[subj] = Math.round(((correct[subj] || 0) / total[subj]) * 100);
      }
      setDiagScores(scores);
      goTo("analysing");
      setTimeout(() => goTo(6), 2500);
    }
  };

  // Final submission
  const handleSubmit = async () => {
    if (!saved.mainGoal || !saved.studyDaysPerWeek) return;
    setSaving(true);
    setSaveError(null);

    const payload: OnboardingPayload = {
      confidence: saved.confidence as OnboardingPayload["confidence"],
      prefersExamplesFirst: saved.prefersExamplesFirst ?? true,
      focusDurationMinutes: saved.focusDurationMinutes,
      preferredStudyTime: saved.preferredStudyTime,
      diagnosticScores: {
        core_math: diagScores["core_math"] ?? 0,
        english: diagScores["english"] ?? 0,
        integrated_science: diagScores["integrated_science"] ?? 0,
        social_studies: diagScores["social_studies"] ?? 0,
      },
      mainGoal: saved.mainGoal,
      studyDaysPerWeek: saved.studyDaysPerWeek,
      dailyGoalLevel: saved.dailyGoalLevel,
      programmeId: saved.programmeId,
    };

    const result = await saveOnboarding(payload);

    if (!result || "error" in result) {
      setSaveError(
        (result as { error: string } | undefined)?.error ??
          "Something went wrong. Please try again."
      );
      setSaving(false);
      return;
    }

    // Clear localStorage on success
    localStorage.removeItem(STORAGE_KEY);

    setResultData({
      focusSubject: result.focusSubject,
      overallDiagnostic: result.overallDiagnostic,
      goalXp: result.goalXp,
      dailyGoalLevel: result.dailyGoalLevel,
    });
    setSaving(false);
    goTo("results");
    setTimeout(() => router.push("/dashboard"), 4000);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (phase === "analysing") {
    return <AnalysingScreen />;
  }

  if (phase === "results" && resultData) {
    return (
      <ResultsScreen name={studentName} result={resultData} diagScores={diagScores} />
    );
  }

  const stepPhase = phase as StepId;

  return (
    <div className="min-h-screen bg-[#0F0E0C] flex flex-col">
      {/* Step indicator */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0F0E0C]/90 backdrop-blur-sm border-b border-[#1A1916]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  n < stepPhase
                    ? "bg-[#F59E0B] text-black"
                    : n === stepPhase
                    ? "bg-[#F59E0B]/20 border-2 border-[#F59E0B] text-[#F59E0B]"
                    : "bg-[#1A1916] border border-[#2E2C28] text-[#4B5563]"
                }`}
              >
                {n < stepPhase ? <Check size={12} /> : n}
              </div>
              {n < 6 && (
                <div
                  className={`flex-1 h-0.5 rounded-full transition-all ${
                    n < stepPhase ? "bg-[#F59E0B]" : "bg-[#2E2C28]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-8">
        <div className="w-full max-w-lg">
          {stepPhase === 1 && (
            <StepWelcome name={studentName} onNext={() => goTo(2)} />
          )}
          {stepPhase === 2 && (
            <StepProgramme
              selected={saved.programmeId}
              onSelect={(id) => updateSaved({ programmeId: id })}
              onNext={() => goTo(3)}
              onBack={() => goTo(1)}
            />
          )}
          {stepPhase === 3 && (
            <StepConfidence
              confidence={saved.confidence}
              onChange={(subj, val) =>
                updateSaved({ confidence: { ...saved.confidence, [subj]: val } })
              }
              onNext={() => goTo(4)}
              onBack={() => goTo(2)}
            />
          )}
          {stepPhase === 4 && (
            <StepLearningStyle
              prefersExamples={saved.prefersExamplesFirst}
              focusDuration={saved.focusDurationMinutes}
              studyTime={saved.preferredStudyTime}
              onChange={updateSaved}
              onNext={() => goTo(5)}
              onBack={() => goTo(3)}
            />
          )}
          {stepPhase === 5 && (
            <StepDiagnostic
              questions={diagQuestions}
              currentIndex={currentDiagIndex}
              answers={diagAnswers}
              onAnswer={handleDiagAnswer}
              onBack={() => {
                setCurrentDiagIndex(0);
                setDiagAnswers({});
                goTo(4);
              }}
            />
          )}
          {stepPhase === 6 && (
            <StepGoals
              mainGoal={saved.mainGoal}
              studyDays={saved.studyDaysPerWeek}
              goalLevel={saved.dailyGoalLevel}
              onChange={updateSaved}
              onBack={() => {
                setCurrentDiagIndex(0);
                goTo(5);
              }}
              onSubmit={handleSubmit}
              saving={saving}
              error={saveError}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function StepWelcome({ name, onNext }: { name: string; onNext: () => void }) {
  const cards = [
    {
      icon: <Brain size={22} className="text-[#F59E0B]" />,
      bg: "#F59E0B",
      title: "Learn at your pace",
      desc: "The system adapts to you — faster or slower based on how you perform.",
    },
    {
      icon: <Target size={22} className="text-[#A78BFA]" />,
      bg: "#A78BFA",
      title: "WAEC-aligned questions",
      desc: "Every question maps directly to the Ghana SHS syllabus.",
    },
    {
      icon: <Trophy size={22} className="text-[#34D399]" />,
      bg: "#34D399",
      title: "Climb the ranks",
      desc: "Start at F3. Work your way up to S rank on the national leaderboard.",
    },
    {
      icon: <Zap size={22} className="text-[#60A5FA]" />,
      bg: "#60A5FA",
      title: "Daily goals",
      desc: "Short, focused sessions every day keep you sharp without burning out.",
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <div className="text-center">
        <div className="text-5xl mb-5">🎉</div>
        <h1 className="text-3xl font-black text-[#F5F0E8]">
          Welcome to MasteX{name ? `, ${name}` : ""}!
        </h1>
        <p className="text-[#9CA3AF] mt-3 leading-relaxed">
          Let&apos;s personalise your learning journey.
          <br />
          This takes about 3 minutes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div
            key={c.title}
            className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-4 space-y-2"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${c.bg}20` }}
            >
              {c.icon}
            </div>
            <div className="text-sm font-semibold text-[#F5F0E8]">{c.title}</div>
            <div className="text-xs text-[#6B6860] leading-snug">{c.desc}</div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-base"
      >
        Let&apos;s get started <ChevronRight size={18} />
      </button>
    </div>
  );
}

// ─── Step 2: Programme Selection ─────────────────────────────────────────────

function StepProgramme({
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const selectedProg = PROGRAMMES.find((p) => p.id === selected);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#F5F0E8]">
          What&apos;s your SHS programme?
        </h2>
        <p className="text-[#9CA3AF] mt-2 text-sm leading-relaxed">
          This helps us tailor your study plan and unlock elective subjects as
          they become available.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {PROGRAMMES.map((prog) => (
          <button
            key={prog.id}
            onClick={() => onSelect(prog.id)}
            className={`relative text-left p-4 rounded-2xl border transition-all ${
              selected === prog.id
                ? "border-[#A78BFA] bg-[#A78BFA]/10"
                : "border-[#2E2C28] bg-[#1A1916] hover:border-[#3E3C38]"
            }`}
          >
            {!prog.isAvailable && (
              <span className="absolute top-2 right-2 text-[8px] font-bold bg-[#2E2C28] text-[#6B6860] px-1.5 py-0.5 rounded-full">
                SOON
              </span>
            )}
            <div className="text-2xl mb-2">{prog.emoji}</div>
            <div className="text-xs font-semibold text-[#F5F0E8] leading-tight">
              {prog.name}
            </div>
          </button>
        ))}
      </div>

      {selected && selectedProg && (
        <div
          className={`rounded-xl px-4 py-3 text-xs border ${
            selectedProg.isAvailable
              ? "bg-[#A78BFA]/10 border-[#A78BFA]/20 text-[#A78BFA]"
              : "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]"
          }`}
        >
          {selectedProg.isAvailable ? (
            <>
              <span className="font-bold">{selectedProg.name}</span> —{" "}
              {selectedProg.description}
            </>
          ) : (
            <>
              Elective subjects for{" "}
              <span className="font-bold">{selectedProg.name}</span> are coming
              soon. You can still select it — your core subjects are fully ready
              now.
            </>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-none px-5 py-4 rounded-2xl border border-[#2E2C28] text-[#9CA3AF] hover:border-[#3E3C38] transition-colors flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selected}
          className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Subject Confidence ───────────────────────────────────────────────

function StepConfidence({
  confidence,
  onChange,
  onNext,
  onBack,
}: {
  confidence: Record<string, number>;
  onChange: (subj: string, val: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const allRated = SUBJECTS.every((s) => confidence[s.id] > 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#F5F0E8]">
          How do you feel about each subject?
        </h2>
        <p className="text-[#9CA3AF] mt-2 text-sm leading-relaxed">
          Be honest — this helps us give you the right support.
          <br />
          No judgment here.
        </p>
      </div>

      <div className="space-y-3">
        {SUBJECTS.map((subject) => {
          const selected = confidence[subject.id] || 0;
          return (
            <div
              key={subject.id}
              className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${subject.color}20` }}
                >
                  {subject.icon}
                </div>
                <div className="text-sm font-semibold text-[#F5F0E8]">
                  {subject.name}
                </div>
                {selected > 0 && (
                  <span
                    className="ml-auto text-xs font-medium"
                    style={{ color: subject.color }}
                  >
                    {CONFIDENCE_OPTIONS.find((o) => o.value === selected)?.emoji}{" "}
                    {CONFIDENCE_OPTIONS.find((o) => o.value === selected)?.label}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CONFIDENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChange(subject.id, opt.value)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all text-left flex items-center gap-2 ${
                      selected === opt.value
                        ? "border-transparent text-black font-bold"
                        : "border-[#2E2C28] text-[#6B6860] hover:border-[#3E3C38] hover:text-[#9CA3AF]"
                    }`}
                    style={
                      selected === opt.value
                        ? { backgroundColor: subject.color }
                        : {}
                    }
                  >
                    <span>{opt.emoji}</span>
                    <span className="leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-none px-5 py-4 rounded-2xl border border-[#2E2C28] text-[#9CA3AF] hover:border-[#3E3C38] transition-colors flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!allRated}
          className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Learning Style ───────────────────────────────────────────────────

function StepLearningStyle({
  prefersExamples,
  focusDuration,
  studyTime,
  onChange,
  onNext,
  onBack,
}: {
  prefersExamples: boolean | null;
  focusDuration: number;
  studyTime: string | null;
  onChange: (patch: Partial<SavedState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const allAnswered = prefersExamples !== null && studyTime !== undefined;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#F5F0E8]">How do you like to learn?</h2>
        <p className="text-[#9CA3AF] mt-2 text-sm leading-relaxed">
          We&apos;ll set up your sessions the way that works best for you.
        </p>
      </div>

      {/* Q1 */}
      <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-[#F5F0E8]">
          When learning something new, do you prefer:
        </p>
        <div className="space-y-2">
          {[
            { val: true, label: "See a worked example first, then try it myself" },
            { val: false, label: "Try it myself first, then see the solution" },
          ].map(({ val, label }) => (
            <button
              key={String(val)}
              onClick={() => onChange({ prefersExamplesFirst: val })}
              className={`w-full text-left py-3 px-4 rounded-xl text-sm border transition-all flex items-center gap-3 ${
                prefersExamples === val
                  ? "bg-[#F59E0B] border-[#F59E0B] text-black font-semibold"
                  : "border-[#2E2C28] text-[#9CA3AF] hover:border-[#3E3C38]"
              }`}
            >
              {prefersExamples === val && <Check size={14} className="flex-none" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Q2 */}
      <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-[#F5F0E8]">
          How long can you focus in one sitting?
        </p>
        <div className="flex gap-2">
          {([10, 20, 30] as const).map((mins) => (
            <button
              key={mins}
              onClick={() => onChange({ focusDurationMinutes: mins })}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
                focusDuration === mins
                  ? "bg-[#A78BFA] border-[#A78BFA] text-black font-bold"
                  : "border-[#2E2C28] text-[#9CA3AF] hover:border-[#3E3C38]"
              }`}
            >
              {mins === 30 ? "30+ min" : `${mins} min`}
            </button>
          ))}
        </div>
      </div>

      {/* Q3 */}
      <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-[#F5F0E8]">
          When do you usually study?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { val: "morning", emoji: "🌅", label: "Morning (before school)" },
            { val: "afternoon", emoji: "☀️", label: "Afternoon (after school)" },
            { val: "evening", emoji: "🌙", label: "Evening (after dinner)" },
            { val: null, emoji: "🔀", label: "It varies" },
          ].map(({ val, emoji, label }) => (
            <button
              key={label}
              onClick={() => onChange({ preferredStudyTime: val as SavedState["preferredStudyTime"] })}
              className={`py-3 px-3 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${
                studyTime === val
                  ? "bg-[#60A5FA] border-[#60A5FA] text-black font-bold"
                  : "border-[#2E2C28] text-[#9CA3AF] hover:border-[#3E3C38]"
              }`}
            >
              <span>{emoji}</span>
              <span className="leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-none px-5 py-4 rounded-2xl border border-[#2E2C28] text-[#9CA3AF] hover:border-[#3E3C38] transition-colors flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!allAnswered}
          className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Diagnostic ───────────────────────────────────────────────────────

function StepDiagnostic({
  questions,
  currentIndex,
  answers,
  onAnswer,
  onBack,
}: {
  questions: DiagQuestion[];
  currentIndex: number;
  answers: Record<number, string>;
  onAnswer: (letter: string) => void;
  onBack: () => void;
}) {
  if (questions.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 space-y-5">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 border-4 border-[#F59E0B]/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-[#9CA3AF] text-sm">Loading your diagnostic test…</p>
        <button
          onClick={onBack}
          className="text-xs text-[#6B6860] hover:text-[#9CA3AF] underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const q = questions[currentIndex];
  const subjectInfo = SUBJECTS.find((s) => s.id === q.subject);
  const progressPct = (currentIndex / questions.length) * 100;
  const isAnswered = !!answers[q.id];

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-2xl font-black text-[#F5F0E8]">
          Let&apos;s see where you&apos;re at 🎯
        </h2>
        <p className="text-[#9CA3AF] mt-2 text-sm leading-relaxed">
          10 quick questions across your subjects. This is{" "}
          <span className="text-[#F5F0E8] font-semibold">NOT graded</span> — it
          just helps us understand what you already know.
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-[#6B6860]">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span style={{ color: subjectInfo?.color }}>{subjectInfo?.name}</span>
        </div>
        <div className="h-1.5 bg-[#1A1916] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: subjectInfo?.color || "#F59E0B" }}
          />
        </div>
      </div>

      {/* Reassurance note */}
      {currentIndex === 0 && (
        <div className="bg-[#34D399]/10 border border-[#34D399]/20 rounded-xl px-4 py-3 text-xs text-[#34D399]">
          No pressure. Wrong answers just help us figure out where to start you.
        </div>
      )}

      {/* Question */}
      <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5">
        <p className="text-[#F5F0E8] font-medium leading-relaxed">{q.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt) => {
          const letter = opt.charAt(0);
          const selected = answers[q.id] === letter;
          return (
            <button
              key={letter}
              onClick={() => !isAnswered && onAnswer(letter)}
              disabled={isAnswered}
              className={`w-full text-left px-4 py-4 rounded-xl border text-sm transition-all active:scale-[0.99] ${
                selected
                  ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#F5F0E8] font-medium"
                  : "border-[#2E2C28] text-[#9CA3AF] hover:border-[#3E3C38] hover:text-[#F5F0E8]"
              } disabled:cursor-default`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {currentIndex === 0 && (
        <button
          onClick={onBack}
          className="text-xs text-[#6B6860] hover:text-[#9CA3AF] flex items-center gap-1 transition-colors"
        >
          <ChevronLeft size={12} /> Back to learning style
        </button>
      )}
    </div>
  );
}

// ─── Step 5: Goals ────────────────────────────────────────────────────────────

function StepGoals({
  mainGoal,
  studyDays,
  goalLevel,
  onChange,
  onBack,
  onSubmit,
  saving,
  error,
}: {
  mainGoal: string | null;
  studyDays: number | null;
  goalLevel: "light" | "standard" | "intense";
  onChange: (patch: Partial<SavedState>) => void;
  onBack: () => void;
  onSubmit: () => void;
  saving: boolean;
  error: string | null;
}) {
  const allAnswered = !!mainGoal && !!studyDays;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#F5F0E8]">
          Almost there! Set your daily goal 🎯
        </h2>
        <p className="text-[#9CA3AF] mt-2 text-sm leading-relaxed">
          Consistency beats cramming every time. Even 20 minutes a day will
          get you to S rank.
        </p>
      </div>

      {/* Q1: Main goal */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[#F5F0E8]">What is your main goal?</p>
        {MAIN_GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => onChange({ mainGoal: g.id })}
            className={`w-full text-left px-4 py-4 rounded-xl border transition-all flex items-center gap-4 ${
              mainGoal === g.id
                ? "border-[#F59E0B] bg-[#F59E0B]/10"
                : "border-[#2E2C28] hover:border-[#3E3C38]"
            }`}
          >
            <span className="text-2xl flex-none">{g.emoji}</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#F5F0E8]">{g.label}</div>
              <div className="text-xs text-[#6B6860] mt-0.5">{g.desc}</div>
            </div>
            {mainGoal === g.id && (
              <Check size={16} className="text-[#F59E0B] flex-none" />
            )}
          </button>
        ))}
      </div>

      {/* Q2: Study days */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[#F5F0E8]">
          How many days per week can you study?
        </p>
        <div className="grid grid-cols-4 gap-2">
          {STUDY_DAYS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ studyDaysPerWeek: value })}
              className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                studyDays === value
                  ? "bg-[#F59E0B] border-[#F59E0B] text-black font-bold"
                  : "border-[#2E2C28] text-[#9CA3AF] hover:border-[#3E3C38]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Q3: Daily goal level */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[#F5F0E8]">
          Choose your daily study goal:
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["light", "standard", "intense"] as const).map((level) => {
            const info = GOAL_LEVEL_INFO[level];
            const active = goalLevel === level;
            return (
              <button
                key={level}
                onClick={() => onChange({ dailyGoalLevel: level })}
                className={`py-4 px-3 rounded-2xl border transition-all flex flex-col items-center gap-1 relative ${
                  active
                    ? "border-[#F59E0B] bg-[#F59E0B]/10"
                    : "border-[#2E2C28] hover:border-[#3E3C38]"
                }`}
              >
                {"recommended" in info && (
                  <div className="absolute -top-2.5 left-0 right-0 flex justify-center">
                    <span className="bg-[#F59E0B] text-black text-[9px] font-bold px-2 py-0.5 rounded-full">
                      RECOMMENDED
                    </span>
                  </div>
                )}
                <div className={`text-xs font-bold ${active ? "text-[#F59E0B]" : "text-[#9CA3AF]"}`}>
                  {info.label}
                </div>
                <div className="text-[10px] text-[#6B6860] text-center leading-tight">
                  {info.sessions}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={10} className="text-[#6B6860]" />
                  <span className="text-[10px] text-[#6B6860]">{info.time}</span>
                </div>
                <div
                  className={`text-sm font-black mt-1 ${active ? "text-[#F59E0B]" : "text-[#F5F0E8]"}`}
                >
                  {info.xp} XP
                </div>
                <div className="text-[10px] text-[#4B5563]">{info.forWho}</div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="text-sm text-[#F87171] bg-[#F87171]/10 border border-[#F87171]/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          disabled={saving}
          className="flex-none px-5 py-4 rounded-2xl border border-[#2E2C28] text-[#9CA3AF] hover:border-[#3E3C38] transition-colors flex items-center gap-1 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!allAnswered || saving}
          className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Start learning <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Analysing Screen ─────────────────────────────────────────────────────────

function AnalysingScreen() {
  return (
    <div className="min-h-screen bg-[#0F0E0C] flex flex-col items-center justify-center px-4 space-y-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-[#F59E0B]/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain size={26} className="text-[#F59E0B]" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-black text-[#F5F0E8]">Analysing your results…</h2>
        <p className="text-[#6B6860] text-sm mt-2">Building your personalised learning plan</p>
      </div>
    </div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  name,
  result,
  diagScores,
}: {
  name: string;
  result: ResultData;
  diagScores: Record<string, number>;
}) {
  const focusInfo = SUBJECTS.find((s) => s.id === result.focusSubject);
  const goalLevelInfo = GOAL_LEVEL_INFO[result.dailyGoalLevel];

  return (
    <div className="min-h-screen bg-[#0F0E0C] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center animate-fade-in">
        <div>
          <div className="text-5xl mb-4">✨</div>
          <h1 className="text-2xl font-black text-[#F5F0E8]">
            Your personalised plan is ready{name ? `, ${name}` : ""}!
          </h1>
          <p className="text-[#9CA3AF] text-sm mt-2">
            We&apos;ve set everything up. Redirecting to your dashboard…
          </p>
        </div>

        {/* 3 summary cards */}
        <div className="space-y-3 text-left">
          {/* Focus subject */}
          {focusInfo && (
            <div
              className="rounded-2xl p-4 border flex items-center gap-4"
              style={{ borderColor: `${focusInfo.color}30`, backgroundColor: `${focusInfo.color}08` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-none"
                style={{ backgroundColor: `${focusInfo.color}20` }}
              >
                {focusInfo.icon}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: focusInfo.color }}>
                  Focus subject
                </div>
                <div className="text-sm font-bold text-[#F5F0E8] mt-0.5">
                  {focusInfo.name}
                </div>
                <div className="text-xs text-[#6B6860] mt-0.5">
                  Prioritised in your daily sessions
                </div>
              </div>
            </div>
          )}

          {/* Daily goal */}
          <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center flex-none">
              <Star size={18} className="text-[#F59E0B]" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[#F59E0B]">
                Daily goal
              </div>
              <div className="text-sm font-bold text-[#F5F0E8] mt-0.5">
                {goalLevelInfo.label} — {result.goalXp} XP per day
              </div>
              <div className="text-xs text-[#6B6860] mt-0.5">{goalLevelInfo.time}</div>
            </div>
          </div>

          {/* Starting rank */}
          <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/20 flex items-center justify-center flex-none">
              <Trophy size={18} className="text-[#A78BFA]" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[#A78BFA]">
                Starting rank
              </div>
              <div className="text-sm font-bold text-[#F5F0E8] mt-0.5">
                F3 — Let&apos;s get you to S rank!
              </div>
              <div className="text-xs text-[#6B6860] mt-0.5">
                Diagnostic score: {result.overallDiagnostic}% overall
              </div>
            </div>
          </div>
        </div>

        {/* Per-subject diagnostic bars */}
        {Object.keys(diagScores).length > 0 && (
          <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-4 space-y-3 text-left">
            <div className="text-xs text-[#6B6860] uppercase tracking-widest">
              Diagnostic breakdown
            </div>
            {SUBJECTS.map((subj) => {
              const score = diagScores[subj.id] ?? 0;
              return (
                <div key={subj.id} className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm flex-none">{subj.icon}</span>
                  <div className="flex-1 h-1.5 bg-[#2E2C28] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${score}%`, backgroundColor: subj.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[#9CA3AF] w-7 text-right flex-none">
                    {score}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-[#6B6860] text-sm">
          <div className="w-3 h-3 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
          Taking you to your dashboard…
        </div>
      </div>
    </div>
  );
}
