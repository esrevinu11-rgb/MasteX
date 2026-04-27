export type SubscriptionStatus = "active" | "inactive" | "paused";
export type MasteryState =
  | "unseen"
  | "introduced"
  | "practicing"
  | "consolidating"
  | "mastered"
  | "locked_in";
export type QuestionFrame =
  | "definition"
  | "fill_blank"
  | "application"
  | "data_interpretation"
  | "comparison"
  | "evaluation";
export type CognitiveLevel = 1 | 2 | 3;
export type QuestGrade = "needs_work" | "good" | "excellent" | "outstanding";
export type PaymentMethod = "momo" | "bank" | "paystack";
export type PaymentStatus = "pending" | "confirmed" | "failed";

export interface Student {
  id: string;
  full_name: string;
  email: string;
  school_name: string;
  year_group: 1 | 2 | 3;
  referral_code: string;
  referred_by: string | null;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  discount_pct: number;
  active_referral_count: number;
  xp_core_math: number;
  xp_english: number;
  xp_integrated_science: number;
  xp_social_studies: number;
  xp_year: number;
  xp_overall: number;
  rank_core_math: string;
  rank_english: string;
  rank_integrated_science: string;
  rank_social_studies: string;
  rank_year: string;
  rank_overall: string;
  rank_position_year: number;
  rank_position_overall: number;
  study_streak_days: number;
  longest_streak: number;
  last_study_date: string | null;
  daily_goal_xp: number;
  daily_xp_today: number;
  learning_pace: "slow" | "medium" | "fast";
  onboarding_completed: boolean;
  focus_subject: string | null;
  programme_id: string | null;
  subscription_tier: "core" | "programme" | "full" | null;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: "core_math" | "english" | "integrated_science" | "social_studies";
  color: string;
  icon: string;
  description: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  waec_code: string | null;
  year_group: 1 | 2 | 3;
  order_index: number;
  prerequisite_ids: string[];
}

export interface TopicProgress {
  student_id: string;
  topic_id: string;
  mastery_state: MasteryState;
  frames_completed: string[];
  spaced_sessions_passed: number;
  next_review_date: string | null;
  xp_earned: number;
}

export interface Question {
  id: string;
  topic_id: string;
  subject_id: string;
  frame: QuestionFrame;
  cognitive_level: CognitiveLevel;
  type: "mcq" | "fill_blank";
  prompt: string;
  options: string[] | null;
  correct_answer: string;
  mark_scheme: string;
  explanation: string;
  xp_reward: number;
  difficulty: "easy" | "medium" | "hard";
  generated_by_ai: boolean;
}

export interface QuestionAttempt {
  id: string;
  student_id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
  xp_awarded: number;
  used_hint: boolean;
  attempted_at: string;
}

export interface WeeklyQuest {
  id: string;
  subject_id: string;
  year_group: 1 | 2 | 3;
  week_start: string;
  week_end: string;
  title: string;
  topic_id: string;
  part_a: QuestPart;
  part_b: QuestPart;
  part_c: QuestPart;
}

export interface QuestPart {
  prompt: string;
  word_limit: number;
  xp_base: number;
  cognitive_level: CognitiveLevel;
}

export interface QuestSubmission {
  id: string;
  quest_id: string;
  student_id: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  grade_a: GradingResult | null;
  grade_b: GradingResult | null;
  grade_c: GradingResult | null;
  overall_score: number;
  total_xp: number;
  submitted_at: string;
  graded_at: string | null;
}

export interface GradingResult {
  score: number; // 0-100
  grade: QuestGrade;
  xp_awarded: number;
  relevance: number; // 0-25
  accuracy: number; // 0-25
  depth: number; // 0-25
  clarity: number; // 0-25
  feedback: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  discount_pct: number;
  amount_paid: number;
  method: PaymentMethod;
  reference: string;
  month: string;
  status: PaymentStatus;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  student_id: string;
  full_name: string;
  school_name: string;
  year_group: number;
  xp_overall: number;
  rank_overall: string;
  rank_overall_position: number;
}

export const SUBJECTS: Subject[] = [
  {
    id: "core_math",
    name: "Core Mathematics",
    code: "core_math",
    color: "#F59E0B",
    icon: "∑",
    description: "Numbers, algebra, geometry, and statistics",
  },
  {
    id: "english",
    name: "English Language",
    code: "english",
    color: "#A78BFA",
    icon: "✎",
    description: "Reading, writing, comprehension, and grammar",
  },
  {
    id: "integrated_science",
    name: "Integrated Science",
    code: "integrated_science",
    color: "#34D399",
    icon: "⚗",
    description: "Physics, chemistry, biology, and earth science",
  },
  {
    id: "social_studies",
    name: "Social Studies",
    code: "social_studies",
    color: "#60A5FA",
    icon: "◎",
    description: "History, geography, civics, and economics",
  },
];

export const MASTERY_STATES: Record<MasteryState, { label: string; color: string; bgColor: string }> = {
  unseen: { label: "Unseen", color: "#4B5563", bgColor: "rgba(75,85,99,0.2)" },
  introduced: { label: "Introduced", color: "#9CA3AF", bgColor: "rgba(156,163,175,0.15)" },
  practicing: { label: "Practicing", color: "#F59E0B", bgColor: "rgba(245,158,11,0.15)" },
  consolidating: { label: "Consolidating", color: "#60A5FA", bgColor: "rgba(96,165,250,0.15)" },
  mastered: { label: "Mastered", color: "#34D399", bgColor: "rgba(52,211,153,0.15)" },
  locked_in: { label: "Locked In", color: "#A78BFA", bgColor: "rgba(167,139,250,0.15)" },
};

export const QUESTION_FRAMES: Record<QuestionFrame, { label: string; level: CognitiveLevel }> = {
  definition: { label: "Definition", level: 1 },
  fill_blank: { label: "Fill in the Blank", level: 1 },
  application: { label: "Application", level: 2 },
  data_interpretation: { label: "Data Interpretation", level: 2 },
  comparison: { label: "Comparison", level: 2 },
  evaluation: { label: "Evaluation", level: 3 },
};

export const XP_REWARDS = {
  COMPLETE_SESSION: 10,
  MCQ_CORRECT: 5,
  MCQ_CORRECT_NO_HINT: 8,
  DAILY_STREAK_5Q: 25,
  STREAK_7_DAYS: 30,
  REVISIT_PASS: 20,
  REFERRAL: 50,
  MOCK_EXAM: 35,
  QUEST_NEEDS_WORK: 40,
  QUEST_GOOD: 60,
  QUEST_EXCELLENT: 80,
  QUEST_OUTSTANDING: 120,
  MCQ_DAILY_CAP: 100,
};
