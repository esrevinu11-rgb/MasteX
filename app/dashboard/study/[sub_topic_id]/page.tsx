"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SUBJECTS } from "@/types";
import {
  saveStudySession,
  type SaveSessionPayload,
  type QuestionAttemptData,
} from "../actions";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  X,
  Lightbulb,
  BookOpen,
  Zap,
  Trophy,
  RotateCcw,
  Clock,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "loading"
  | "explanation"
  | "worked_example"
  | "practice"
  | "questions"
  | "saving"
  | "review";

interface SubTopicInfo {
  id: string;
  name: string;
  description: string | null;
  topic_id: string;
  subject_id: string;
  estimated_minutes: number;
  topics: { name: string; subject_id: string } | null;
}

interface Explanation {
  id: string;
  content: string;
  worked_example: string;
  guided_practice: string;
  guided_hints: string[];
  guided_answer: string;
}

interface Question {
  id: string;
  frame: string;
  cognitive_level: number;
  type: "mcq" | "short_answer" | "theory";
  paper: string | null;
  prompt: string;
  options: string[] | null;
  correct_answer: string | null;
  mark_scheme: string;
  explanation: string;
  xp_reward: number;
}

interface QuestionResult {
  question: Question;
  answer: string;
  is_correct: boolean;
  xp_awarded: number;
  time_seconds?: number;
  ai_score?: number;
  ai_feedback?: string;
  rubric_relevance?: number;
  rubric_accuracy?: number;
  rubric_depth?: number;
  rubric_clarity?: number;
}

interface AiGradeData {
  score: number;
  xp_awarded: number;
  feedback: string;
  rubric: {
    relevance: number;
    accuracy: number;
    depth: number;
    clarity: number;
  };
  flagged?: boolean;
  flag_reason?: string;
}

const FRAME_LABELS: Record<string, string> = {
  // Core Mathematics
  mcq_objective:             "Multiple Choice",
  short_answer_theory:       "Short Answer",
  multi_step_theory:         "Multi-Step Problem",
  story_problem:             "Story Problem",
  data_interpretation:       "Data Interpretation",
  proof_justify:             "Proof & Justify",
  // English Language
  comprehension_factual:     "Comprehension",
  comprehension_inferential: "Inference",
  essay_writing:             "Essay Writing",
  letter_writing:            "Letter Writing",
  oral_english:              "Oral English",
  // Integrated Science
  short_structured:          "Structured",
  calculation:               "Calculation",
  activity_of_integration:   "Application",
  evaluate_discuss:          "Evaluate & Discuss",
  practical_data:            "Practical",
  // Social Studies
  short_answer:              "Short Answer",
  explain_suggest:           "Explain & Suggest",
  discuss_analyse:           "Discuss & Analyse",
  diagram_based:             "Diagram",
  evaluate_assess:           "Evaluate & Assess",
};

const PAPER_LABELS: Record<string, string> = {
  paper1: "Paper 1 · Objective",
  paper2: "Paper 2 · Theory",
  paper3: "Paper 3 · Practical",
};

const PHASE_LABELS: Record<Exclude<Phase, "loading" | "saving">, string> = {
  explanation: "Learn",
  worked_example: "Example",
  practice: "Practice",
  questions: "Questions",
  review: "Review",
};

const PHASE_ORDER: Exclude<Phase, "loading" | "saving">[] = [
  "explanation",
  "worked_example",
  "practice",
  "questions",
  "review",
];

function phaseIndex(p: Phase): number {
  return PHASE_ORDER.indexOf(p as Exclude<Phase, "loading" | "saving">);
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function storageKey(subTopicId: string) {
  return `mastex_session_${subTopicId}`;
}

interface PersistedState {
  phase: Phase;
  hintsUsed: number;
  neededSolutionCount: number;
  questionResults: QuestionResult[];
  currentQIndex: number;
  startedAt: number;
}

function loadPersisted(subTopicId: string): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(storageKey(subTopicId));
    if (!raw) return {};
    return JSON.parse(raw) as PersistedState;
  } catch {
    return {};
  }
}

function savePersisted(subTopicId: string, state: PersistedState) {
  try {
    localStorage.setItem(storageKey(subTopicId), JSON.stringify(state));
  } catch {}
}

function clearPersisted(subTopicId: string) {
  try {
    localStorage.removeItem(storageKey(subTopicId));
  } catch {}
}

// ─── Phase progress bar ───────────────────────────────────────────────────────

function PhaseBar({ phase }: { phase: Phase }) {
  const current = phaseIndex(phase);
  if (current < 0) return null;
  return (
    <div className="flex items-center gap-1 mb-6">
      {PHASE_ORDER.map((p, i) => (
        <div key={p} className="flex items-center gap-1 flex-1">
          <div
            className={cn(
              "flex-1 h-1.5 rounded-full transition-all duration-500",
              i <= current ? "bg-[#F59E0B]" : "bg-[#2E2C28]"
            )}
          />
          {i === PHASE_ORDER.length - 1 && null}
        </div>
      ))}
      <span className="text-xs text-[#6B6860] ml-2 flex-none">
        Phase {current + 1} of 5 — {PHASE_LABELS[PHASE_ORDER[current]]}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StudySessionPage() {
  const { sub_topic_id } = useParams<{ sub_topic_id: string }>();
  const router = useRouter();
  const supabase = createClient();

  // ── Core data ────────────────────────────────────────────────────────────
  const [subTopic, setSubTopic] = useState<SubTopicInfo | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [studentLevel, setStudentLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");

  // ── Session state ─────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Practice state
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [practiceText, setPracticeText] = useState("");
  const [practiceChecked, setPracticeChecked] = useState(false);
  const [selfAssessmentPractice, setSelfAssessmentPractice] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [neededSolutionCount, setNeededSolutionCount] = useState(0);

  // Question state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [checkedAnswer, setCheckedAnswer] = useState(false);
  const [gradingQ, setGradingQ] = useState(false);
  const [aiGradeResult, setAiGradeResult] = useState<AiGradeData | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);

  // Review state
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<{
    newMasteryState: string;
    prevMasteryState: string;
    nextReviewDate: string;
    intervalDays: number;
  } | null>(null);

  const startedAtRef = useRef<number>(Date.now());
  const questionStartTimeRef = useRef<number>(Date.now());

  // ── Load everything on mount ───────────────────────────────────────────────

  const load = useCallback(async () => {
    setPhase("loading");
    setLoadError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    // Fetch sub-topic
    const { data: st, error: stErr } = await supabase
      .from("sub_topics")
      .select("id, name, description, topic_id, subject_id, estimated_minutes, topics(name, subject_id)")
      .eq("id", sub_topic_id)
      .single();

    if (stErr || !st) { setLoadError("Sub-topic not found."); return; }
    setSubTopic(st as unknown as SubTopicInfo);

    // Determine student level from onboarding diagnostic
    const { data: onboarding } = await supabase
      .from("onboarding_profiles")
      .select(
        "diagnostic_core_math, diagnostic_english, diagnostic_integrated_science, diagnostic_social_studies"
      )
      .eq("student_id", user.id)
      .single();

    const { data: stp } = await supabase
      .from("sub_topic_progress")
      .select("support_mode_active")
      .eq("student_id", user.id)
      .eq("sub_topic_id", sub_topic_id)
      .single();

    let level: "beginner" | "intermediate" | "advanced" = "intermediate";
    if (stp?.support_mode_active) {
      level = "beginner";
    } else if (onboarding) {
      const scoreMap: Record<string, number> = {
        core_math: onboarding.diagnostic_core_math ?? 50,
        english: onboarding.diagnostic_english ?? 50,
        integrated_science: onboarding.diagnostic_integrated_science ?? 50,
        social_studies: onboarding.diagnostic_social_studies ?? 50,
      };
      const score = scoreMap[st.subject_id] ?? 50;
      if (score <= 33) level = "beginner";
      else if (score >= 67) level = "advanced";
      else level = "intermediate";
    }
    setStudentLevel(level);

    // Check for persisted session
    const persisted = loadPersisted(sub_topic_id);
    if (persisted.phase && persisted.phase !== "loading" && persisted.phase !== "saving") {
      if (persisted.questionResults) setQuestionResults(persisted.questionResults);
      if (persisted.hintsUsed != null) setHintsUsed(persisted.hintsUsed);
      if (persisted.neededSolutionCount != null)
        setNeededSolutionCount(persisted.neededSolutionCount);
      if (persisted.currentQIndex != null) setCurrentQIndex(persisted.currentQIndex);
      if (persisted.startedAt) startedAtRef.current = persisted.startedAt;
    }

    // Fetch explanation (or generate)
    const { data: expRow } = await supabase
      .from("explanations")
      .select("id, content, worked_example, guided_practice, guided_hints, guided_answer")
      .eq("sub_topic_id", sub_topic_id)
      .eq("student_level", level)
      .single();

    if (expRow) {
      setExplanation(expRow as Explanation);
    } else {
      // Generate on-demand
      const res = await fetch("/api/explanations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sub_topic_id, student_level: level }),
      });
      if (res.ok) {
        const { explanation: gen } = await res.json();
        setExplanation(gen as Explanation);
      } else {
        setLoadError("Could not load the explanation. Please try again.");
        return;
      }
    }

    // Fetch questions ordered by cognitive_level (easiest first)
    const { data: qs } = await supabase
      .from("questions")
      .select(
        "id, frame, cognitive_level, type, paper, prompt, options, correct_answer, mark_scheme, explanation, xp_reward"
      )
      .eq("sub_topic_id", sub_topic_id)
      .order("cognitive_level", { ascending: true })
      .limit(6);

    setQuestions((qs ?? []) as Question[]);

    // Resume at persisted phase or start from explanation
    const resumePhase = persisted.phase ?? "explanation";
    setPhase(resumePhase === "saving" ? "explanation" : resumePhase);
  }, [sub_topic_id, router, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // Persist state on every phase change
  useEffect(() => {
    if (phase === "loading" || !sub_topic_id) return;
    savePersisted(sub_topic_id, {
      phase,
      hintsUsed,
      neededSolutionCount,
      questionResults,
      currentQIndex,
      startedAt: startedAtRef.current,
    });
  }, [phase, hintsUsed, neededSolutionCount, questionResults, currentQIndex, sub_topic_id]);

  // ── Question helpers ───────────────────────────────────────────────────────

  const currentQ = questions[currentQIndex];
  const isLastQ = currentQIndex >= questions.length - 1;

  // MCQ XP already earned this session (capped at 100 total)
  const sessionMcqXp = questionResults
    .filter((r, i) => r && questions[i]?.type === "mcq")
    .reduce((s, r) => s + (r?.xp_awarded ?? 0), 0);

  function checkAnswer() {
    if (!currentQ) return;
    const answer =
      currentQ.type === "mcq" ? selectedOption ?? "" : textAnswer.trim();
    if (!answer) return;

    const timeSecs = Math.round((Date.now() - questionStartTimeRef.current) / 1000);

    if (currentQ.type !== "mcq") {
      // Kick off AI grading
      gradeWithAI(answer, timeSecs);
      return;
    }

    // MCQ — auto grade with anti-cheat time check and daily session cap
    const correct = currentQ.correct_answer
      ? answer.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase()
      : false;
    const rawXp = correct ? currentQ.xp_reward : 0;
    // Time < 3s → 0 XP; also cap total MCQ XP this session at 100
    const xp =
      timeSecs < 3 ? 0 : correct ? Math.max(0, Math.min(rawXp, 100 - sessionMcqXp)) : 0;
    commitResult({ answer, is_correct: correct, xp_awarded: xp, time_seconds: timeSecs });
  }

  async function gradeWithAI(answer: string, timeSecs: number) {
    if (!currentQ) return;
    setCheckedAnswer(true);
    setGradingQ(true);

    try {
      const res = await fetch("/api/questions/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: currentQ.id,
          answer,
          time_seconds: timeSecs,
        }),
      });

      if (!res.ok) throw new Error("Grading failed");
      const grade = (await res.json()) as AiGradeData;
      setAiGradeResult(grade);
      commitResult({
        answer,
        is_correct: grade.score >= 50,
        xp_awarded: grade.xp_awarded,
        time_seconds: timeSecs,
        ai_score: grade.score,
        ai_feedback: grade.feedback,
        rubric_relevance: grade.rubric.relevance,
        rubric_accuracy: grade.rubric.accuracy,
        rubric_depth: grade.rubric.depth,
        rubric_clarity: grade.rubric.clarity,
      });
    } catch {
      // Fallback: award 0 XP and show a generic message
      setAiGradeResult({
        score: 0,
        xp_awarded: 0,
        feedback: "Grading service unavailable — no XP awarded for this question.",
        rubric: { relevance: 0, accuracy: 0, depth: 0, clarity: 0 },
        flagged: false,
      });
      commitResult({ answer, is_correct: false, xp_awarded: 0, time_seconds: timeSecs });
    } finally {
      setGradingQ(false);
    }
  }

  function commitResult({
    answer,
    is_correct,
    xp_awarded,
    time_seconds,
    ai_score,
    ai_feedback,
    rubric_relevance,
    rubric_accuracy,
    rubric_depth,
    rubric_clarity,
  }: {
    answer: string;
    is_correct: boolean;
    xp_awarded: number;
    time_seconds?: number;
    ai_score?: number;
    ai_feedback?: string;
    rubric_relevance?: number;
    rubric_accuracy?: number;
    rubric_depth?: number;
    rubric_clarity?: number;
  }) {
    if (!currentQ) return;
    const result: QuestionResult = {
      question: currentQ,
      answer,
      is_correct,
      xp_awarded,
      time_seconds,
      ai_score,
      ai_feedback,
      rubric_relevance,
      rubric_accuracy,
      rubric_depth,
      rubric_clarity,
    };
    setQuestionResults((prev) => {
      const updated = [...prev];
      updated[currentQIndex] = result;
      return updated;
    });
    setCheckedAnswer(true);
  }

  function nextQuestion() {
    if (isLastQ) {
      goToReview();
    } else {
      setCurrentQIndex((i) => i + 1);
      setSelectedOption(null);
      setTextAnswer("");
      setCheckedAnswer(false);
      setGradingQ(false);
      setAiGradeResult(null);
      questionStartTimeRef.current = Date.now();
    }
  }

  // ── Save & show review ────────────────────────────────────────────────────

  async function goToReview() {
    if (!subTopic) return;
    setPhase("saving");

    const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
    const correct = questionResults.filter((r) => r?.is_correct).length;
    const totalXp = questionResults.reduce((s, r) => s + (r?.xp_awarded ?? 0), 0);
    const frames = questionResults.map((r) => r?.question?.frame).filter(Boolean) as string[];

    const attempts: QuestionAttemptData[] = questionResults
      .filter(Boolean)
      .map((r, i) => ({
        question_id: r.question.id,
        answer: r.answer,
        is_correct: r.is_correct,
        xp_awarded: r.xp_awarded,
        time_seconds: r.time_seconds ?? 0,
        attempt_number: i + 1,
        ai_score: r.ai_score ?? null,
        ai_feedback: r.ai_feedback ?? null,
        rubric_relevance: r.rubric_relevance ?? null,
        rubric_accuracy: r.rubric_accuracy ?? null,
        rubric_depth: r.rubric_depth ?? null,
        rubric_clarity: r.rubric_clarity ?? null,
      }));

    const payload: SaveSessionPayload = {
      sub_topic_id: subTopic.id,
      topic_id: subTopic.topic_id,
      subject_id: subTopic.subject_id,
      questions_attempted: questionResults.filter(Boolean).length,
      questions_correct: correct,
      xp_earned: totalXp,
      time_spent_seconds: elapsed,
      hints_used: hintsUsed,
      support_mode_triggered: neededSolutionCount >= 3,
      question_attempts: attempts,
      frames_completed: frames,
      self_assessment_needed_solution: neededSolutionCount >= 3,
    };

    try {
      const result = await saveStudySession(payload);
      setReviewData({
        newMasteryState: result.newMasteryState,
        prevMasteryState: result.prevMasteryState,
        nextReviewDate: result.nextReviewDate,
        intervalDays: result.intervalDays,
      });
      clearPersisted(sub_topic_id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save session.");
    }

    setPhase("review");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const subject = subTopic
    ? (SUBJECTS.find((s) => s.id === subTopic.subject_id) ?? SUBJECTS[0])
    : SUBJECTS[0];

  // LOADING
  if (phase === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        {loadError ? (
          <div className="text-center space-y-4">
            <p className="text-[#F87171]">{loadError}</p>
            <button
              type="button"
              onClick={load}
              className="px-4 py-2 bg-[#F59E0B] text-black rounded-xl font-bold text-sm"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#6B6860] text-sm">Loading your session…</p>
          </>
        )}
      </div>
    );
  }

  const header = (
    <div className="mb-2">
      <Link
        href="/dashboard/study"
        className="inline-flex items-center gap-1.5 text-xs text-[#6B6860] hover:text-[#9CA3AF] mb-4"
      >
        <ArrowLeft size={12} /> Back to study
      </Link>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="text-base px-2 py-0.5 rounded"
          style={{ color: subject.color }}
        >
          {subject.icon}
        </span>
        <span className="text-xs text-[#6B6860]">
          {(subTopic?.topics as { name: string } | null)?.name}
        </span>
      </div>
      <h1 className="text-xl font-black text-[#F5F0E8]">{subTopic?.name}</h1>
    </div>
  );

  const wrap = (children: React.ReactNode) => (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-5 animate-fade-in">
      {header}
      <PhaseBar phase={phase} />
      {children}
    </div>
  );

  // ── PHASE 1: EXPLANATION ──────────────────────────────────────────────────
  if (phase === "explanation") {
    if (!explanation) return wrap(
      <div className="text-[#6B6860] text-sm">Loading explanation…</div>
    );

    // Bold **key terms** between double asterisks
    function renderText(text: string) {
      return text.split("\n").map((line, i) => {
        const parts = line.split(/\*\*(.+?)\*\*/g);
        return (
          <p key={i} className={line.trim() === "" ? "my-2" : "leading-relaxed"}>
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <span key={j} className="font-semibold text-[#F59E0B]">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </p>
        );
      });
    }

    return wrap(
      <>
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={16} className="text-[#F59E0B]" />
            <span className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider">
              Understanding {subTopic?.name}
            </span>
            <span className="ml-auto text-xs text-[#4B5563] capitalize">{studentLevel}</span>
          </div>
          <div className="text-sm text-[#D1D5DB] space-y-1">
            {renderText(explanation.content)}
          </div>
        </div>

        {/* Key point callout */}
        <div className="bg-[#F59E0B]/08 border border-[#F59E0B]/25 rounded-xl px-5 py-4">
          <div className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-1">
            Key point
          </div>
          <p className="text-sm text-[#F5F0E8] leading-relaxed">
            {explanation.content
              .split(/[.!?]/)[0]
              ?.trim()
              .replace(/\*\*/g, "") + "."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPhase("worked_example")}
          className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
        >
          See worked example <ChevronRight size={18} />
        </button>
      </>
    );
  }

  // ── PHASE 2: WORKED EXAMPLE ──────────────────────────────────────────────
  if (phase === "worked_example") {
    if (!explanation) return null;

    const exLines = explanation.worked_example.split("\n");
    const questionLine = exLines.find((l) => l.toLowerCase().startsWith("question:"));
    const solutionStart = exLines.findIndex((l) => l.toLowerCase().startsWith("solution"));
    const noteStart = exLines.findIndex((l) => l.toLowerCase().startsWith("note:"));
    const steps = exLines.slice(
      solutionStart + 1,
      noteStart > 0 ? noteStart : undefined
    );
    const note = noteStart > 0 ? exLines[noteStart] : null;

    return wrap(
      <>
        <div className="bg-[#15140F] border border-[#3E3C38] rounded-2xl overflow-hidden">
          {/* Worked example header */}
          <div className="px-6 py-4 border-b border-[#2E2C28] flex items-center gap-2">
            <Target size={15} className="text-[#F59E0B]" />
            <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
              Worked Example
            </span>
          </div>

          <div className="p-6 space-y-4">
            {/* Problem */}
            {questionLine && (
              <div className="bg-[#1A1916] border border-[#2E2C28] rounded-xl px-4 py-3">
                <p className="text-sm font-medium text-[#F5F0E8]">
                  {questionLine.replace(/^question:\s*/i, "")}
                </p>
              </div>
            )}

            {/* Steps */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#6B6860] uppercase tracking-wider">
                Solution
              </div>
              {steps
                .filter((l) => l.trim())
                .map((line, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-[#F59E0B] font-bold flex-none w-5">{i + 1}.</span>
                    <span className="text-[#D1D5DB] leading-relaxed">
                      {line.replace(/^step\s*\d+:\s*/i, "")}
                    </span>
                  </div>
                ))}
            </div>

            {/* Final answer */}
            {exLines.find((l) => l.toLowerCase().startsWith("final answer")) && (
              <div className="bg-[#34D399]/10 border border-[#34D399]/25 rounded-xl px-4 py-3">
                <span className="text-xs font-semibold text-[#34D399] uppercase tracking-wider">
                  Final Answer:{" "}
                </span>
                <span className="text-sm text-[#34D399] font-bold">
                  {exLines
                    .find((l) => l.toLowerCase().startsWith("final answer"))
                    ?.replace(/^final answer:\s*/i, "")}
                </span>
              </div>
            )}

            {/* Watch out */}
            {note && (
              <div className="bg-[#F59E0B]/08 border border-[#F59E0B]/20 rounded-xl px-4 py-3 text-xs text-[#F59E0B]">
                <span className="font-bold">Watch out: </span>
                {note.replace(/^note:\s*/i, "")}
              </div>
            )}
          </div>
        </div>

        {/* Did you follow? */}
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5">
          <p className="text-sm font-semibold mb-3">Did you follow that?</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPhase("practice")}
              className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-3 rounded-xl text-sm transition-all"
            >
              Yes, I understand →
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-4 py-3 border border-[#2E2C28] hover:border-[#3E3C38] text-sm rounded-xl transition-colors text-[#9CA3AF]"
            >
              Show again
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPhase("practice")}
          className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-4 rounded-2xl transition-all"
        >
          Now let&apos;s practice <ChevronRight size={18} />
        </button>
      </>
    );
  }

  // ── PHASE 3: GUIDED PRACTICE ─────────────────────────────────────────────
  if (phase === "practice") {
    if (!explanation) return null;
    const hints = explanation.guided_hints ?? [];
    const canShowMoreHints = hintsShown < hints.length;
    const allHintsShown = hintsShown >= hints.length;

    return wrap(
      <>
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-6 space-y-4">
          <div className="text-base font-black text-[#F5F0E8]">Your turn! 🎯</div>
          <div className="bg-[#252320] rounded-xl p-4">
            <p className="text-sm text-[#F5F0E8] leading-relaxed">
              {explanation.guided_practice}
            </p>
          </div>

          <textarea
            value={practiceText}
            onChange={(e) => setPracticeText(e.target.value)}
            placeholder="Write your answer here…"
            rows={4}
            className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563] resize-none"
          />

          {/* Hints */}
          <div className="space-y-2">
            {hints.slice(0, hintsShown).map((hint, i) => (
              <div
                key={i}
                className="flex gap-3 bg-[#F59E0B]/08 border border-[#F59E0B]/20 rounded-xl px-4 py-3 animate-fade-in"
              >
                <Lightbulb size={14} className="text-[#F59E0B] flex-none mt-0.5" />
                <p className="text-xs text-[#F5F0E8] leading-relaxed">{hint}</p>
              </div>
            ))}

            {showSolution && (
              <div className="bg-[#34D399]/10 border border-[#34D399]/25 rounded-xl p-4 animate-fade-in space-y-2">
                <div className="text-xs font-bold text-[#34D399] uppercase tracking-wider">
                  Full Solution
                </div>
                <p className="text-sm text-[#D1D5DB] whitespace-pre-line leading-relaxed">
                  {explanation.guided_answer}
                </p>
              </div>
            )}
          </div>

          {/* Hint / Solution button */}
          {!showSolution && (
            <button
              type="button"
              onClick={() => {
                if (canShowMoreHints) {
                  const next = hintsShown + 1;
                  setHintsShown(next);
                  setHintsUsed((h) => h + 1);
                } else if (allHintsShown) {
                  setShowSolution(true);
                }
              }}
              className="flex items-center gap-2 text-xs text-[#6B6860] hover:text-[#F59E0B] transition-colors"
            >
              <Lightbulb size={12} />
              {canShowMoreHints
                ? hintsShown === 0
                  ? "I'm stuck — show a hint"
                  : "Show another hint"
                : "Show full solution"}
            </button>
          )}
        </div>

        {/* Self-assessment */}
        {(practiceChecked || showSolution) && !selfAssessmentPractice && (
          <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5 space-y-3 animate-fade-in">
            <p className="text-sm font-semibold">How did you do?</p>
            {[
              { id: "correct", label: "I got it right ✓", color: "#34D399" },
              { id: "close", label: "I was close but made an error", color: "#F59E0B" },
              { id: "needed", label: "I needed the full solution", color: "#F87171" },
            ].map(({ id, label, color }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSelfAssessmentPractice(id);
                  if (id === "needed") {
                    setNeededSolutionCount((n) => n + 1);
                  }
                }}
                className="w-full text-left px-4 py-3 rounded-xl border border-[#2E2C28] text-sm hover:border-[#3E3C38] transition-colors flex items-center gap-3"
              >
                <span
                  className="w-2 h-2 rounded-full flex-none"
                  style={{ backgroundColor: color }}
                />
                {label}
              </button>
            ))}
          </div>
        )}

        {selfAssessmentPractice && (
          <button
            type="button"
            onClick={() => {
              questionStartTimeRef.current = Date.now();
              setPhase("questions");
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-4 rounded-2xl transition-all"
          >
            Start the questions <ChevronRight size={18} />
          </button>
        )}

        {!practiceChecked && !showSolution && selfAssessmentPractice === null && (
          <button
            type="button"
            onClick={() => setPracticeChecked(true)}
            disabled={!practiceText.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-black font-bold py-4 rounded-2xl transition-all"
          >
            Check my answer <ChevronRight size={18} />
          </button>
        )}
      </>
    );
  }

  // ── PHASE 4: QUESTIONS ────────────────────────────────────────────────────
  if (phase === "questions") {
    if (questions.length === 0) {
      return wrap(
        <div className="text-center py-12 space-y-4">
          <p className="text-[#9CA3AF] text-sm">
            No questions found for this sub-topic yet.
          </p>
          <p className="text-xs text-[#4B5563]">
            Run <code className="bg-[#252320] px-1 rounded">npx tsx scripts/generate-questions.ts</code> to generate them.
          </p>
          <button
            type="button"
            onClick={goToReview}
            className="mt-4 px-6 py-3 bg-[#F59E0B] text-black font-bold rounded-xl text-sm"
          >
            Skip to review →
          </button>
        </div>
      );
    }

    const result = questionResults[currentQIndex];
    const isChecked = !!result || checkedAnswer;
    const isCorrect = result?.is_correct ?? false;

    return wrap(
      <>
        {/* Q progress */}
        <div className="flex items-center gap-2 text-xs text-[#6B6860] mb-4">
          <span>Question {currentQIndex + 1} of {questions.length}</span>
          <div className="flex-1 h-1 bg-[#2E2C28] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F59E0B] rounded-full"
              style={{ width: `${((currentQIndex) / questions.length) * 100}%` }}
            />
          </div>
          <span>
            {questionResults.reduce((s, r) => s + (r?.xp_awarded ?? 0), 0)} XP
          </span>
        </div>

        {/* Frame label + paper + XP */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#252320] text-[#9CA3AF]">
            {FRAME_LABELS[currentQ?.frame] ?? currentQ?.frame}
          </span>
          {currentQ?.paper && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#1A1916] text-[#6B6860] border border-[#2E2C28]">
              {PAPER_LABELS[currentQ.paper] ?? currentQ.paper}
            </span>
          )}
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
            +{currentQ?.xp_reward} XP
          </span>
        </div>

        {/* Question */}
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5">
          <p className="text-base leading-relaxed font-medium text-[#F5F0E8]">
            {currentQ?.prompt}
          </p>
        </div>

        {/* Answer area */}
        {currentQ?.type === "mcq" && currentQ.options && !isChecked && (
          <div className="space-y-2">
            {currentQ.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedOption(opt)}
                className={cn(
                  "w-full text-left px-5 py-4 rounded-xl border-2 text-sm transition-all active:scale-[0.99]",
                  selectedOption === opt
                    ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#F5F0E8]"
                    : "border-[#2E2C28] bg-[#1A1916] hover:border-[#3E3C38] text-[#D1D5DB]"
                )}
              >
                <span className="text-[#6B6860] mr-3">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {(currentQ?.type === "short_answer" || currentQ?.type === "theory") && !isChecked && (
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder={
              currentQ.type === "theory"
                ? "Write your full answer here. Show all working where required…"
                : "Write your answer in 2-4 sentences…"
            }
            rows={currentQ.type === "theory" ? 6 : 4}
            className="w-full bg-[#1A1916] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors resize-none"
          />
        )}

        {/* Feedback after check */}
        {isChecked && (
          <div className="space-y-3 animate-fade-in">
            {/* MCQ result */}
            {currentQ?.type === "mcq" && (
              <div
                className={cn(
                  "rounded-2xl p-5 border-2 space-y-3",
                  isCorrect
                    ? "bg-[#34D399]/10 border-[#34D399]/40"
                    : "bg-[#F87171]/10 border-[#F87171]/30"
                )}
              >
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <Check size={18} className="text-[#34D399]" />
                  ) : (
                    <X size={18} className="text-[#F87171]" />
                  )}
                  <span
                    className={cn(
                      "font-bold",
                      isCorrect ? "text-[#34D399]" : "text-[#F87171]"
                    )}
                  >
                    {isCorrect ? "Correct!" : "Not quite"}
                  </span>
                </div>
                {!isCorrect && currentQ?.correct_answer && (
                  <div className="text-sm">
                    <span className="text-xs text-[#6B6860]">Correct answer: </span>
                    <span className="font-medium text-[#34D399]">{currentQ.correct_answer}</span>
                  </div>
                )}
                <p className="text-sm text-[#D1D5DB] leading-relaxed">
                  {currentQ?.explanation}
                </p>
              </div>
            )}

            {/* Non-MCQ: AI grading */}
            {(currentQ?.type === "short_answer" || currentQ?.type === "theory") && (
              <div className="rounded-2xl border border-[#2E2C28] bg-[#1A1916] overflow-hidden">
                {gradingQ ? (
                  <div className="flex items-center gap-3 p-5 text-sm text-[#9CA3AF]">
                    <div className="w-4 h-4 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin flex-none" />
                    Grading your answer…
                  </div>
                ) : aiGradeResult ? (
                  <div className="p-5 space-y-4">
                    {/* Score header */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#6B6860] uppercase tracking-wider">
                        AI Grade
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-lg font-black",
                            aiGradeResult.score >= 70
                              ? "text-[#34D399]"
                              : aiGradeResult.score >= 50
                              ? "text-[#F59E0B]"
                              : "text-[#F87171]"
                          )}
                        >
                          {aiGradeResult.score}/100
                        </span>
                        <span className="text-xs font-bold text-[#F59E0B]">
                          +{aiGradeResult.xp_awarded} XP
                        </span>
                      </div>
                    </div>

                    {/* Rubric bars */}
                    <div className="space-y-2">
                      {(
                        [
                          { key: "relevance", label: "Relevance" },
                          { key: "accuracy",  label: "Accuracy" },
                          { key: "depth",     label: "Depth" },
                          { key: "clarity",   label: "Clarity" },
                        ] as const
                      ).map(({ key, label }) => {
                        const val = aiGradeResult.rubric[key];
                        const pct = Math.round((val / 25) * 100);
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <span className="text-xs text-[#6B6860] w-16 flex-none">{label}</span>
                            <div className="flex-1 h-1.5 bg-[#2E2C28] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#F59E0B] transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#9CA3AF] w-8 text-right flex-none">
                              {val}/25
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Feedback */}
                    <p className="text-sm text-[#D1D5DB] leading-relaxed border-t border-[#2E2C28] pt-3">
                      {aiGradeResult.feedback}
                    </p>

                    {/* Mark scheme (collapsed toggle) */}
                    <details className="group">
                      <summary className="text-xs text-[#6B6860] hover:text-[#9CA3AF] cursor-pointer select-none transition-colors">
                        View mark scheme
                      </summary>
                      <p className="text-sm text-[#9CA3AF] leading-relaxed mt-2">
                        {currentQ?.mark_scheme}
                      </p>
                    </details>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Check / Next */}
        {!isChecked ? (
          <button
            type="button"
            onClick={checkAnswer}
            disabled={
              currentQ?.type === "mcq" ? !selectedOption : !textAnswer.trim()
            }
            className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-black font-bold py-4 rounded-2xl transition-all"
          >
            Check answer <ChevronRight size={18} />
          </button>
        ) : (
          isChecked && !gradingQ && (
            <button
              type="button"
              onClick={nextQuestion}
              className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-4 rounded-2xl transition-all"
            >
              {isLastQ ? "See your results" : "Next question"}
              <ChevronRight size={18} />
            </button>
          )
        )}
      </>
    );
  }

  // ── SAVING ────────────────────────────────────────────────────────────────
  if (phase === "saving") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#6B6860] text-sm">Saving your session…</p>
      </div>
    );
  }

  // ── PHASE 5: REVIEW ───────────────────────────────────────────────────────
  if (phase === "review") {
    const totalXp = questionResults.reduce((s, r) => s + (r?.xp_awarded ?? 0), 0);
    const correct = questionResults.filter((r) => r?.is_correct).length;
    const attempted = questionResults.filter(Boolean).length;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    const prevState = reviewData?.prevMasteryState ?? "unseen";
    const newState = reviewData?.newMasteryState ?? "introduced";

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-5 animate-fade-in">
        {header}
        <PhaseBar phase="review" />

        {/* Save error */}
        {saveError && (
          <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-xl px-4 py-3 text-sm text-[#F87171]">
            {saveError}
          </div>
        )}

        {/* Summary card */}
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F59E0B]/15 border-2 border-[#F59E0B]/40 flex items-center justify-center mx-auto">
            <Trophy size={28} className="text-[#F59E0B]" />
          </div>
          <div>
            <h2 className="text-xl font-black">Session Complete!</h2>
            <p className="text-[#6B6860] text-sm mt-1">{subTopic?.name}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#252320] rounded-xl p-3">
              <div className="text-2xl font-black text-[#F59E0B]">{totalXp}</div>
              <div className="text-xs text-[#6B6860] mt-0.5">XP earned</div>
            </div>
            <div className="bg-[#252320] rounded-xl p-3">
              <div className="text-2xl font-black text-[#34D399]">
                {correct}/{attempted}
              </div>
              <div className="text-xs text-[#6B6860] mt-0.5">Correct</div>
            </div>
            <div className="bg-[#252320] rounded-xl p-3">
              <div className="text-2xl font-black">{accuracy}%</div>
              <div className="text-xs text-[#6B6860] mt-0.5">Accuracy</div>
            </div>
          </div>

          <div className="text-xs text-[#4B5563] flex items-center justify-center gap-1">
            <Clock size={11} />
            {minutes}m {seconds}s
          </div>
        </div>

        {/* Mastery update */}
        {reviewData && (
          <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5 space-y-3">
            <div className="text-xs font-semibold text-[#6B6860] uppercase tracking-wider">
              Mastery update
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm px-3 py-1.5 rounded-lg bg-[#252320] text-[#6B6860] font-medium capitalize">
                {prevState.replace(/_/g, " ")}
              </span>
              <ChevronRight size={16} className="text-[#F59E0B]" />
              <span className="text-sm px-3 py-1.5 rounded-lg font-bold capitalize"
                style={{ backgroundColor: "#F59E0B20", color: "#F59E0B" }}>
                {newState.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6B6860]">
              <RotateCcw size={11} />
              Come back in {reviewData.intervalDays} day{reviewData.intervalDays !== 1 ? "s" : ""} to review
              ({new Date(reviewData.nextReviewDate).toLocaleDateString("en-GB", {
                weekday: "short", day: "numeric", month: "short"
              })})
            </div>
          </div>
        )}

        {/* Question breakdown */}
        {questionResults.filter(Boolean).length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#6B6860] uppercase tracking-wider">
              Question breakdown
            </div>
            {questionResults.filter(Boolean).map((r, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border",
                  r.is_correct
                    ? "bg-[#34D399]/05 border-[#34D399]/20"
                    : "bg-[#F87171]/05 border-[#F87171]/15"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-none mt-0.5",
                    r.is_correct ? "bg-[#34D399]/20" : "bg-[#F87171]/20"
                  )}
                >
                  {r.is_correct ? (
                    <Check size={12} className="text-[#34D399]" />
                  ) : (
                    <X size={12} className="text-[#F87171]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#9CA3AF] mb-0.5 capitalize">
                    {FRAME_LABELS[r.question.frame]}
                  </div>
                  <div className="text-sm text-[#F5F0E8] truncate">{r.question.prompt}</div>
                  {!r.is_correct && r.question.type === "mcq" && r.question.correct_answer && (
                    <div className="text-xs text-[#34D399] mt-1">
                      ✓ {r.question.correct_answer}
                    </div>
                  )}
                  {!r.is_correct && r.question.type === "mcq" && (
                    <div className="text-xs text-[#6B6860] mt-1 leading-snug">
                      {r.question.explanation}
                    </div>
                  )}
                  {(r.question.type === "short_answer" || r.question.type === "theory") && r.ai_score !== undefined && (
                    <div className="text-xs text-[#6B6860] mt-1">
                      AI score:{" "}
                      <span
                        className={
                          r.ai_score >= 70
                            ? "text-[#34D399]"
                            : r.ai_score >= 50
                            ? "text-[#F59E0B]"
                            : "text-[#F87171]"
                        }
                      >
                        {r.ai_score}/100
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs font-bold text-[#F59E0B] flex-none">
                  +{r.xp_awarded} XP
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/dashboard/study"
            className="flex-1 flex items-center justify-center gap-2 border border-[#2E2C28] hover:border-[#3E3C38] text-sm font-medium py-4 rounded-2xl transition-colors"
          >
            <Zap size={14} /> Study another
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-4 rounded-2xl text-sm transition-all"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
