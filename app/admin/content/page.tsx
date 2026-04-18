"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveQuestion, saveExplanation } from "./actions";
import {
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubTopicRow {
  id: string;
  name: string;
  order_index: number;
}

interface TopicRow {
  id: string;
  name: string;
  order_index: number;
  sub_topics: SubTopicRow[];
}

interface Question {
  id: string;
  sub_topic_id: string;
  frame: string;
  question_type: string;
  level: number;
  stem: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
  xp_value: number;
}

interface Explanation {
  id: string;
  sub_topic_id: string;
  student_level: "beginner" | "intermediate" | "advanced";
  content: string;
  worked_example: string;
  guided_practice: string;
  guided_hints: string[];
  guided_answer: string;
  model_used: string | null;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const FRAME_ORDER = [
  "definition",
  "fill_blank",
  "application",
  "data_interpretation",
  "comparison",
  "evaluation",
];

const FRAME_LABELS: Record<string, string> = {
  definition: "Definition",
  fill_blank: "Fill in the Blank",
  application: "Application",
  data_interpretation: "Data Interpretation",
  comparison: "Comparison",
  evaluation: "Evaluation",
};

const LEVELS: Array<"beginner" | "intermediate" | "advanced"> = [
  "beginner",
  "intermediate",
  "advanced",
];

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, error }: { status: SaveStatus; error?: string }) {
  if (status === "idle") return null;
  if (status === "saving")
    return (
      <span className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
        <Loader2 size={12} className="animate-spin" /> Saving…
      </span>
    );
  if (status === "saved")
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-400">
        <CheckCircle size={12} /> Saved
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-xs text-red-400" title={error}>
      <AlertCircle size={12} /> Error
    </span>
  );
}

// ─── Question editor ──────────────────────────────────────────────────────────

function QuestionEditor({
  question,
  subTopicId,
  subTopicName,
}: {
  question: Question;
  subTopicId: string;
  subTopicName: string;
}) {
  const [stem, setStem] = useState(question.stem);
  const [options, setOptions] = useState<string[]>(question.options ?? []);
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer);
  const [explanation, setExplanation] = useState(question.explanation);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string>();
  const [regenLoading, setRegenLoading] = useState(false);

  const isDirty =
    stem !== question.stem ||
    correctAnswer !== question.correct_answer ||
    explanation !== question.explanation ||
    JSON.stringify(options) !== JSON.stringify(question.options ?? []);

  async function handleSave() {
    setSaveStatus("saving");
    const result = await saveQuestion({
      id: question.id,
      stem,
      options: question.question_type === "mcq" ? options : null,
      correct_answer: correctAnswer,
      explanation,
    });
    if ("error" in result && result.error) {
      setSaveStatus("error");
      setSaveError(result.error);
    } else {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  async function handleRegenerate() {
    setRegenLoading(true);
    try {
      const res = await fetch("/api/admin/content/regen-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: question.id,
          sub_topic_id: subTopicId,
          sub_topic_name: subTopicName,
          frame: question.frame,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.question) {
          setStem(data.question.stem);
          setOptions(data.question.options ?? []);
          setCorrectAnswer(data.question.correct_answer);
          setExplanation(data.question.explanation);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 3000);
        }
      }
    } finally {
      setRegenLoading(false);
    }
  }

  return (
    <div className="border border-[#2E2C28] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#2E2C28] text-[#9CA3AF] uppercase tracking-wide">
            {FRAME_LABELS[question.frame] ?? question.frame}
          </span>
          <span className="text-xs text-[#6B6860]">
            L{question.level} · {question.question_type} · {question.xp_value} XP
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={saveStatus} error={saveError} />
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#9CA3AF] hover:text-white border border-[#2E2C28] hover:border-[#3E3C38] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={11} className={regenLoading ? "animate-spin" : ""} />
            Regenerate
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 hover:bg-[#F59E0B]/20 transition-colors"
            >
              <Save size={11} /> Save
            </button>
          )}
        </div>
      </div>

      {/* Stem */}
      <div>
        <label className="text-xs text-[#6B6860] mb-1 block">Question</label>
        <textarea
          value={stem}
          onChange={(e) => setStem(e.target.value)}
          rows={3}
          className="w-full bg-[#0F0E0C] border border-[#2E2C28] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] resize-y focus:outline-none focus:border-[#F59E0B]/40"
        />
      </div>

      {/* MCQ options */}
      {question.question_type === "mcq" && (
        <div>
          <label className="text-xs text-[#6B6860] mb-1 block">Options</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-[#6B6860] w-5 flex-none">
                  {String.fromCharCode(65 + i)}.
                </span>
                <input
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  className="flex-1 bg-[#0F0E0C] border border-[#2E2C28] rounded-lg px-3 py-1.5 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#F59E0B]/40"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correct answer */}
      <div>
        <label className="text-xs text-[#6B6860] mb-1 block">Correct Answer</label>
        <textarea
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          rows={2}
          className="w-full bg-[#0F0E0C] border border-[#2E2C28] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] resize-y focus:outline-none focus:border-[#F59E0B]/40"
        />
      </div>

      {/* Explanation */}
      <div>
        <label className="text-xs text-[#6B6860] mb-1 block">Explanation</label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className="w-full bg-[#0F0E0C] border border-[#2E2C28] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] resize-y focus:outline-none focus:border-[#F59E0B]/40"
        />
      </div>
    </div>
  );
}

// ─── Explanation editor ───────────────────────────────────────────────────────

function ExplanationEditor({
  explanation,
  subTopicId,
  onRegenSuccess,
}: {
  explanation: Explanation;
  subTopicId: string;
  onRegenSuccess: (updated: Explanation) => void;
}) {
  const [content, setContent] = useState(explanation.content);
  const [workedExample, setWorkedExample] = useState(explanation.worked_example);
  const [guidedPractice, setGuidedPractice] = useState(explanation.guided_practice);
  const [hints, setHints] = useState<string[]>(explanation.guided_hints ?? ["", "", ""]);
  const [guidedAnswer, setGuidedAnswer] = useState(explanation.guided_answer);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string>();
  const [regenLoading, setRegenLoading] = useState(false);

  const isDirty =
    content !== explanation.content ||
    workedExample !== explanation.worked_example ||
    guidedPractice !== explanation.guided_practice ||
    guidedAnswer !== explanation.guided_answer ||
    JSON.stringify(hints) !== JSON.stringify(explanation.guided_hints);

  async function handleSave() {
    setSaveStatus("saving");
    const result = await saveExplanation({
      id: explanation.id,
      content,
      worked_example: workedExample,
      guided_practice: guidedPractice,
      guided_hints: hints,
      guided_answer: guidedAnswer,
    });
    if ("error" in result && result.error) {
      setSaveStatus("error");
      setSaveError(result.error);
    } else {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  async function handleRegenerate() {
    setRegenLoading(true);
    try {
      const res = await fetch("/api/explanations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sub_topic_id: subTopicId,
          student_level: explanation.student_level,
          force: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.explanation) {
          const ex: Explanation = data.explanation;
          setContent(ex.content);
          setWorkedExample(ex.worked_example);
          setGuidedPractice(ex.guided_practice);
          setHints(ex.guided_hints ?? ["", "", ""]);
          setGuidedAnswer(ex.guided_answer);
          onRegenSuccess(ex);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 3000);
        }
      }
    } finally {
      setRegenLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#F5F0E8]">
          {LEVEL_LABELS[explanation.student_level]}
        </span>
        <div className="flex items-center gap-3">
          <StatusBadge status={saveStatus} error={saveError} />
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#9CA3AF] hover:text-white border border-[#2E2C28] hover:border-[#3E3C38] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={11} className={regenLoading ? "animate-spin" : ""} />
            Regenerate
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 hover:bg-[#F59E0B]/20 transition-colors"
            >
              <Save size={11} /> Save
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs text-[#6B6860] mb-1 block">Explanation</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full bg-[#0F0E0C] border border-[#2E2C28] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] resize-y focus:outline-none focus:border-[#F59E0B]/40"
        />
      </div>

      <div>
        <label className="text-xs text-[#6B6860] mb-1 block">Worked Example</label>
        <textarea
          value={workedExample}
          onChange={(e) => setWorkedExample(e.target.value)}
          rows={8}
          className="w-full bg-[#0F0E0C] border border-[#2E2C28] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] font-mono resize-y focus:outline-none focus:border-[#F59E0B]/40"
        />
      </div>

      <div>
        <label className="text-xs text-[#6B6860] mb-1 block">Guided Practice Problem</label>
        <textarea
          value={guidedPractice}
          onChange={(e) => setGuidedPractice(e.target.value)}
          rows={3}
          className="w-full bg-[#0F0E0C] border border-[#2E2C28] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] resize-y focus:outline-none focus:border-[#F59E0B]/40"
        />
      </div>

      <div>
        <label className="text-xs text-[#6B6860] mb-1 block">Hints (3)</label>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs text-[#6B6860] mt-2 w-12 flex-none">
                Hint {i + 1}
              </span>
              <textarea
                value={hints[i] ?? ""}
                onChange={(e) => {
                  const next = [...hints];
                  next[i] = e.target.value;
                  setHints(next);
                }}
                rows={2}
                className="flex-1 bg-[#0F0E0C] border border-[#2E2C28] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] resize-y focus:outline-none focus:border-[#F59E0B]/40"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-[#6B6860] mb-1 block">Full Answer</label>
        <textarea
          value={guidedAnswer}
          onChange={(e) => setGuidedAnswer(e.target.value)}
          rows={8}
          className="w-full bg-[#0F0E0C] border border-[#2E2C28] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] font-mono resize-y focus:outline-none focus:border-[#F59E0B]/40"
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminContentPage() {
  const supabase = createClient();

  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState<SubTopicRow | null>(null);
  const [activeTab, setActiveTab] = useState<"questions" | "explanations">("questions");
  const [activeLevel, setActiveLevel] = useState<"beginner" | "intermediate" | "advanced">(
    "beginner"
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [explanations, setExplanations] = useState<Record<string, Explanation>>({});
  const [loadingContent, setLoadingContent] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(true);

  // Load topics on mount
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("topics")
        .select(
          "id, name, order_index, sub_topics(id, name, order_index)"
        )
        .eq("subject_id", "core_math")
        .eq("year_group", 1)
        .order("order_index");
      if (data) setTopics(data as TopicRow[]);
      setTopicsLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadContent = useCallback(
    async (st: SubTopicRow) => {
      setLoadingContent(true);
      setQuestions([]);
      setExplanations({});

      const [qRes, exRes] = await Promise.all([
        supabase
          .from("questions")
          .select(
            "id, sub_topic_id, frame, question_type, level, stem, options, correct_answer, explanation, xp_value"
          )
          .eq("sub_topic_id", st.id),
        supabase
          .from("explanations")
          .select(
            "id, sub_topic_id, student_level, content, worked_example, guided_practice, guided_hints, guided_answer, model_used"
          )
          .eq("sub_topic_id", st.id),
      ]);

      if (qRes.data) {
        const sorted = [...qRes.data].sort(
          (a, b) =>
            FRAME_ORDER.indexOf(a.frame) - FRAME_ORDER.indexOf(b.frame)
        );
        setQuestions(sorted as Question[]);
      }

      if (exRes.data) {
        const map: Record<string, Explanation> = {};
        for (const ex of exRes.data as Explanation[]) {
          map[ex.student_level] = ex;
        }
        setExplanations(map);
      }

      setLoadingContent(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function selectSubTopic(st: SubTopicRow) {
    setSelectedSubTopic(st);
    setActiveTab("questions");
    setActiveLevel("beginner");
    loadContent(st);
  }

  const currentExplanation = selectedSubTopic ? explanations[activeLevel] : undefined;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left sidebar ─────────────────────────────────── */}
      <div className="w-72 flex-none h-full overflow-y-auto border-r border-[#2E2C28] bg-[#0F0E0C]">
        <div className="p-4 border-b border-[#2E2C28]">
          <h2 className="text-sm font-bold text-[#F5F0E8]">Core Mathematics · Y1</h2>
          <p className="text-xs text-[#6B6860] mt-0.5">Select a sub-topic to edit</p>
        </div>

        {topicsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-[#6B6860]" />
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {topics.map((topic) => {
              const isExpanded = expandedTopic === topic.id;
              const subs: SubTopicRow[] = topic.sub_topics ?? [];
              return (
                <div key={topic.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedTopic(isExpanded ? null : topic.id)
                    }
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#9CA3AF] hover:text-white hover:bg-[#1A1916] transition-colors text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} className="flex-none text-[#6B6860]" />
                    ) : (
                      <ChevronRight size={14} className="flex-none text-[#6B6860]" />
                    )}
                    <span className="truncate">{topic.name}</span>
                    <span className="ml-auto text-xs text-[#4B5563] flex-none">
                      {subs.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="ml-4 pl-2 border-l border-[#2E2C28] space-y-0.5 mb-1">
                      {subs.map((st) => {
                        const isSelected = selectedSubTopic?.id === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => selectSubTopic(st)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors truncate ${
                              isSelected
                                ? "bg-[#F59E0B]/10 text-[#F59E0B] font-semibold"
                                : "text-[#9CA3AF] hover:text-white hover:bg-[#1A1916]"
                            }`}
                          >
                            {st.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Right panel ──────────────────────────────────── */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto bg-[#0F0E0C]">
        {!selectedSubTopic ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#4B5563] gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#1A1916] flex items-center justify-center text-2xl">
              📝
            </div>
            <div>
              <p className="text-sm font-semibold text-[#6B6860]">No sub-topic selected</p>
              <p className="text-xs mt-1">Pick a sub-topic from the left panel</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-w-4xl">
            {/* Header */}
            <div>
              <h1 className="text-xl font-black text-[#F5F0E8]">
                {selectedSubTopic.name}
              </h1>
              <p className="text-xs text-[#6B6860] mt-1">
                Sub-topic ID: {selectedSubTopic.id}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#1A1916] p-1 rounded-xl w-fit border border-[#2E2C28]">
              {(["questions", "explanations"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                    activeTab === tab
                      ? "bg-[#F59E0B] text-black"
                      : "text-[#9CA3AF] hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {loadingContent ? (
              <div className="flex items-center gap-3 py-12 text-[#6B6860]">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Loading content…</span>
              </div>
            ) : activeTab === "questions" ? (
              /* ── Questions tab ── */
              <div className="space-y-4">
                {questions.length === 0 ? (
                  <div className="text-center py-16 text-[#4B5563] text-sm">
                    No questions found. Run the generation script first.
                  </div>
                ) : (
                  questions.map((q) => (
                    <QuestionEditor
                      key={q.id}
                      question={q}
                      subTopicId={selectedSubTopic.id}
                      subTopicName={selectedSubTopic.name}
                    />
                  ))
                )}
              </div>
            ) : (
              /* ── Explanations tab ── */
              <div className="space-y-6">
                {/* Level selector */}
                <div className="flex gap-1 bg-[#1A1916] p-1 rounded-xl w-fit border border-[#2E2C28]">
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setActiveLevel(lvl)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        activeLevel === lvl
                          ? "bg-[#252320] text-[#F5F0E8] border border-[#3E3C38]"
                          : "text-[#9CA3AF] hover:text-white"
                      }`}
                    >
                      {LEVEL_LABELS[lvl]}
                    </button>
                  ))}
                </div>

                {currentExplanation ? (
                  <ExplanationEditor
                    key={`${selectedSubTopic.id}-${activeLevel}`}
                    explanation={currentExplanation}
                    subTopicId={selectedSubTopic.id}
                    onRegenSuccess={(updated) => {
                      setExplanations((prev) => ({
                        ...prev,
                        [activeLevel]: updated,
                      }));
                    }}
                  />
                ) : (
                  <div className="text-center py-16 text-[#4B5563] text-sm">
                    No {activeLevel} explanation found. Run the generation script first.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
