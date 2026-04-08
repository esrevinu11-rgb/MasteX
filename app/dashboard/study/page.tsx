"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  Lightbulb,
  Check,
  X,
  ChevronRight,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUBJECTS, QUESTION_FRAMES, XP_REWARDS, type Question } from "@/types";
import { cn } from "@/lib/utils";

type Phase = "intro" | "question" | "feedback" | "complete";

interface SessionQuestion extends Question {
  topic_name?: string;
}

interface SessionResult {
  correct: number;
  total: number;
  xpEarned: number;
}

export default function StudyPage() {
  const params = useSearchParams();
  const router = useRouter();
  const subjectId = params.get("subject") || "maths";
  const topicId = params.get("topic");

  const subject = SUBJECTS.find((s) => s.id === subjectId) || SUBJECTS[0];

  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [usedHint, setUsedHint] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SessionResult>({ correct: 0, total: 0, xpEarned: 0 });
  const [studentId, setStudentId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setStudentId(data.user.id);
    });
  }, []);

  const currentQ = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0;

  async function generateSession() {
    setGenerating(true);
    try {
      // Fetch existing questions from DB, or generate new ones
      let query = supabase
        .from("questions")
        .select("*, topics(name)")
        .eq("subject_id", subjectId)
        .limit(10);

      if (topicId) query = query.eq("topic_id", topicId);

      const { data: existing } = await query;

      if (existing && existing.length >= 5) {
        const shuffled = existing.sort(() => Math.random() - 0.5).slice(0, 8);
        setQuestions(
          shuffled.map((q) => ({
            ...q,
            topic_name: (q.topics as { name: string } | null)?.name,
          }))
        );
      } else {
        // Generate questions via AI
        const topicsRes = await supabase
          .from("topics")
          .select("*")
          .eq("subject_id", subjectId)
          .eq("year_group", 1)
          .limit(3);

        const topics = topicsRes.data || [];
        const generated: SessionQuestion[] = [];

        for (const topic of topics.slice(0, 2)) {
          for (const frame of ["definition", "application"] as const) {
            const res = await fetch("/api/questions/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subjectId,
                topicName: topic.name,
                topicId: topic.id,
                frame,
                cognitiveLevel: frame === "definition" ? 1 : 2,
                existingQuestions: [],
              }),
            });
            if (res.ok) {
              const q = await res.json();
              generated.push({ ...q, topic_name: topic.name });
            }
          }
        }

        setQuestions(generated.slice(0, 8));
      }
    } catch (err) {
      console.error("Error loading questions:", err);
    } finally {
      setGenerating(false);
      setPhase("question");
    }
  }

  function startSession() {
    generateSession();
  }

  async function checkAnswer() {
    if (!currentQ) return;
    const userAnswer = currentQ.type === "mcq" ? (selectedOption || "") : answer;
    if (!userAnswer.trim()) return;

    const correct =
      userAnswer.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase() ||
      (currentQ.type === "mcq" && userAnswer === currentQ.correct_answer);

    setIsCorrect(correct);

    const xpAwarded = correct
      ? usedHint
        ? Math.round(currentQ.xp_reward * 0.6)
        : currentQ.xp_reward
      : 0;

    setResult((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
      xpEarned: prev.xpEarned + xpAwarded,
    }));

    // Save attempt
    if (studentId && currentQ.id) {
      await supabase.from("question_attempts").insert({
        student_id: studentId,
        question_id: currentQ.id,
        answer: userAnswer,
        is_correct: correct,
        xp_awarded: xpAwarded,
        used_hint: usedHint,
      });
    }

    setPhase("feedback");
  }

  function nextQuestion() {
    if (currentIdx + 1 >= questions.length) {
      finishSession();
    } else {
      setCurrentIdx((i) => i + 1);
      setAnswer("");
      setSelectedOption(null);
      setIsCorrect(null);
      setUsedHint(false);
      setShowHint(false);
      setPhase("question");
    }
  }

  async function finishSession() {
    // Update student XP
    if (studentId) {
      const xpField = `xp_${subjectId === "maths" ? "maths" : subjectId === "english" ? "english" : subjectId === "science" ? "science" : "social"}`;
      await supabase.rpc("update_student_xp_totals", { p_student_id: studentId });
    }
    setPhase("complete");
  }

  const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + 1);

  // ─── INTRO ────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-white mb-8"
        >
          <ArrowLeft size={15} /> Back to dashboard
        </Link>

        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-8 text-center animate-fade-in">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6"
            style={{ backgroundColor: `${subject.color}20` }}
          >
            {subject.icon}
          </div>

          <h1 className="text-2xl font-black mb-2">{subject.name}</h1>
          <p className="text-[#9CA3AF] text-sm mb-8">
            {topicId ? "Topic review session" : "Mixed session — all topics"}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#252320] rounded-xl p-4">
              <div className="text-xl font-bold">~8</div>
              <div className="text-xs text-[#6B6860] mt-1">Questions</div>
            </div>
            <div className="bg-[#252320] rounded-xl p-4">
              <div className="text-xl font-bold text-[#F59E0B]">~80</div>
              <div className="text-xs text-[#6B6860] mt-1">Max XP</div>
            </div>
            <div className="bg-[#252320] rounded-xl p-4">
              <div className="text-xl font-bold">6</div>
              <div className="text-xs text-[#6B6860] mt-1">Frames</div>
            </div>
          </div>

          <button
            onClick={startSession}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-60 text-black font-bold py-4 rounded-xl text-base transition-colors"
          >
            {generating ? (
              <>Loading questions...</>
            ) : (
              <>
                <Zap size={18} fill="black" />
                Start Session
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── QUESTION ─────────────────────────────────────────────────────────────
  if (phase === "question" && currentQ) {
    const frameInfo = QUESTION_FRAMES[currentQ.frame];

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-[#6B6860] mb-2">
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <span>{result.xpEarned} XP earned</span>
          </div>
          <div className="h-2 bg-[#2E2C28] rounded-full overflow-hidden">
            <div
              className="h-full xp-bar rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
          >
            {subject.name}
          </span>
          {currentQ.topic_name && (
            <span className="text-xs text-[#9CA3AF] bg-[#252320] px-2.5 py-1 rounded-lg">
              {currentQ.topic_name}
            </span>
          )}
          <span className="text-xs text-[#9CA3AF] bg-[#252320] px-2.5 py-1 rounded-lg capitalize">
            {frameInfo?.label || currentQ.frame}
          </span>
          <span className="text-xs text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2.5 py-1 rounded-lg">
            +{currentQ.xp_reward} XP
          </span>
          {usedHint && (
            <span className="text-xs text-[#9CA3AF] bg-[#252320] px-2.5 py-1 rounded-lg line-through">
              -40% XP penalty
            </span>
          )}
        </div>

        {/* Question */}
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-6">
          <p className="text-base leading-relaxed font-medium">{currentQ.prompt}</p>
        </div>

        {/* Answer input */}
        {currentQ.type === "mcq" && currentQ.options ? (
          <div className="space-y-3">
            {currentQ.options.map((opt: string, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedOption(opt)}
                className={cn(
                  "w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all",
                  selectedOption === opt
                    ? "border-[#F59E0B] bg-[#F59E0B]/10 text-white"
                    : "border-[#2E2C28] bg-[#1A1916] hover:border-[#3E3C38] text-[#D1D5DB]"
                )}
              >
                <span className="text-[#6B6860] mr-3">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={3}
            className="w-full bg-[#1A1916] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563] resize-none"
          />
        )}

        {/* Hint */}
        {showHint && (
          <div className="bg-[#252320] border border-[#2E2C28] rounded-xl p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-[#F59E0B]" />
              <span className="text-xs font-semibold text-[#F59E0B]">Hint (−40% XP)</span>
            </div>
            <p className="text-sm text-[#9CA3AF]">{currentQ.mark_scheme}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!showHint && (
            <button
              onClick={() => { setShowHint(true); setUsedHint(true); }}
              className="flex items-center gap-2 px-4 py-3 border border-[#2E2C28] rounded-xl text-sm text-[#6B6860] hover:text-[#F59E0B] hover:border-[#F59E0B]/30 transition-colors"
            >
              <Lightbulb size={14} /> Hint
            </button>
          )}
          <button
            onClick={checkAnswer}
            disabled={!answer.trim() && !selectedOption}
            className="flex-1 flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm transition-colors"
          >
            Check Answer <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ─── FEEDBACK ─────────────────────────────────────────────────────────────
  if (phase === "feedback" && currentQ) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Result panel */}
        <div
          className={cn(
            "rounded-2xl p-6 border-2",
            isCorrect
              ? "bg-[#10B981]/10 border-[#10B981]/40"
              : "bg-red-500/10 border-red-500/40"
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isCorrect ? "bg-[#10B981]/20" : "bg-red-500/20"
              )}
            >
              {isCorrect ? (
                <Check size={20} className="text-[#10B981]" />
              ) : (
                <X size={20} className="text-red-400" />
              )}
            </div>
            <div>
              <div className={cn("font-bold", isCorrect ? "text-[#10B981]" : "text-red-400")}>
                {isCorrect ? "Correct!" : "Not quite"}
              </div>
              <div className="text-xs text-[#9CA3AF]">
                {isCorrect
                  ? `+${usedHint ? Math.round(currentQ.xp_reward * 0.6) : currentQ.xp_reward} XP earned`
                  : "0 XP — keep going!"}
              </div>
            </div>
          </div>

          {!isCorrect && (
            <div className="mb-4">
              <div className="text-xs text-[#6B6860] mb-1">Correct answer</div>
              <div className="text-sm font-medium bg-[#10B981]/10 text-[#10B981] px-3 py-2 rounded-lg">
                {currentQ.correct_answer}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs text-[#6B6860] mb-1">Explanation</div>
            <p className="text-sm text-[#D1D5DB] leading-relaxed">{currentQ.explanation}</p>
          </div>
        </div>

        <button
          onClick={nextQuestion}
          className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-4 rounded-xl text-sm transition-colors"
        >
          {currentIdx + 1 >= questions.length ? "See Results" : "Next Question"}
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  // ─── COMPLETE ─────────────────────────────────────────────────────────────
  if (phase === "complete") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in">
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F59E0B]/15 border-2 border-[#F59E0B]/40 flex items-center justify-center mx-auto mb-6">
            <Trophy size={36} className="text-[#F59E0B]" />
          </div>

          <h1 className="text-2xl font-black mb-2">Session Complete!</h1>
          <p className="text-[#9CA3AF] text-sm mb-8">Great work. Keep the streak going!</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#252320] rounded-xl p-4">
              <div className="text-2xl font-black text-[#F59E0B]">{result.xpEarned}</div>
              <div className="text-xs text-[#6B6860] mt-1">XP Earned</div>
            </div>
            <div className="bg-[#252320] rounded-xl p-4">
              <div className="text-2xl font-black text-[#34D399]">
                {result.correct}/{result.total}
              </div>
              <div className="text-xs text-[#6B6860] mt-1">Correct</div>
            </div>
            <div className="bg-[#252320] rounded-xl p-4">
              <div className="text-2xl font-black">{accuracy}%</div>
              <div className="text-xs text-[#6B6860] mt-1">Accuracy</div>
            </div>
          </div>

          <div className="bg-[#252320] rounded-xl p-4 mb-6 text-left">
            <div className="text-xs text-[#6B6860] mb-1">Next review</div>
            <div className="text-sm font-medium">
              Tomorrow ({nextReview.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })})
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setPhase("intro");
                setCurrentIdx(0);
                setResult({ correct: 0, total: 0, xpEarned: 0 });
                setQuestions([]);
              }}
              className="flex-1 flex items-center justify-center gap-2 border border-[#2E2C28] hover:border-[#3E3C38] text-sm font-medium py-3 rounded-xl transition-colors"
            >
              <RotateCcw size={14} /> Study again
            </button>
            <Link
              href="/dashboard"
              className="flex-1 flex items-center justify-center bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-3 rounded-xl text-sm transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
