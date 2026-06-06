export type RankTier = "A" | "B" | "C" | "D" | "E" | "F";

export interface RankInfo {
  tier: RankTier;
  display: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowClass: string;
  label: string;
  description: string;
}

const RANK_DATA: Record<RankTier, Omit<RankInfo, "tier" | "display">> = {
  A: {
    color: "#FFD700",
    bgColor: "rgba(255,215,0,0.12)",
    borderColor: "#FFD700",
    glowClass: "",
    label: "Excellent",
    description: "Top 10%",
  },
  B: {
    color: "#10B981",
    bgColor: "rgba(16,185,129,0.12)",
    borderColor: "#10B981",
    glowClass: "",
    label: "Very Good",
    description: "Top 25%",
  },
  C: {
    color: "#3B82F6",
    bgColor: "rgba(59,130,246,0.12)",
    borderColor: "#3B82F6",
    glowClass: "",
    label: "Good",
    description: "Top 50%",
  },
  D: {
    color: "#8B5CF6",
    bgColor: "rgba(139,92,246,0.12)",
    borderColor: "#8B5CF6",
    glowClass: "",
    label: "Pass",
    description: "Top 75%",
  },
  E: {
    color: "#F59E0B",
    bgColor: "rgba(245,158,11,0.12)",
    borderColor: "#F59E0B",
    glowClass: "",
    label: "Weak",
    description: "Top 90%",
  },
  F: {
    color: "#EF4444",
    bgColor: "rgba(239,68,68,0.12)",
    borderColor: "#EF4444",
    glowClass: "",
    label: "Starting",
    description: "Bottom 10%",
  },
};

export function getRankInfo(rankDisplay: string): RankInfo {
  if (!rankDisplay) return { tier: "F", display: "F", ...RANK_DATA["F"] };
  // Handles both new format ("A") and old format ("A1", "F3", "S")
  let tier = rankDisplay[0] as string;
  if (tier === "S") tier = "A"; // S no longer exists — map to A
  if (!RANK_DATA[tier as RankTier]) tier = "F";
  return { tier: tier as RankTier, display: tier, ...RANK_DATA[tier as RankTier] };
}

export function getRankFromPercentile(percentile: number): RankInfo {
  // percentile = position from top as % (lower = better)
  // topPct = percentage of students below you (higher = better)
  const topPct = 100 - percentile;
  const tier: RankTier =
    topPct >= 90 ? "A" :
    topPct >= 75 ? "B" :
    topPct >= 50 ? "C" :
    topPct >= 25 ? "D" :
    topPct >= 10 ? "E" : "F";
  return getRankInfo(tier);
}

// Bottom to top — used for display in rank ladder / showcase
export const ALL_RANKS: string[] = ["F", "E", "D", "C", "B", "A"];

export function getNextRank(current: string): string | null {
  // Normalize old format
  const tier = current[0];
  const idx = ALL_RANKS.indexOf(tier);
  if (idx === -1 || idx === ALL_RANKS.length - 1) return null;
  return ALL_RANKS[idx + 1];
}
