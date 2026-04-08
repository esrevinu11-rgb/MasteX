export type RankTier = "S" | "A" | "B" | "C" | "D" | "E" | "F";

export interface RankInfo {
  tier: RankTier;
  subrank: 1 | 2 | 3 | null; // S has no subrank
  display: string; // e.g. "C2", "S", "A1"
  color: string;
  bgColor: string;
  borderColor: string;
  glowClass: string;
}

const RANK_TIERS: Array<{ tier: RankTier; minPct: number; maxPct: number }> = [
  { tier: "S", minPct: 99, maxPct: 100 },
  { tier: "A", minPct: 90, maxPct: 99 },
  { tier: "B", minPct: 75, maxPct: 90 },
  { tier: "C", minPct: 55, maxPct: 75 },
  { tier: "D", minPct: 35, maxPct: 55 },
  { tier: "E", minPct: 15, maxPct: 35 },
  { tier: "F", minPct: 0, maxPct: 15 },
];

export function getRankFromPercentile(percentile: number): RankInfo {
  // percentile = (position from top / total) * 100, so lower = better
  const topPct = 100 - percentile;

  let tier: RankTier = "F";
  for (const t of RANK_TIERS) {
    if (topPct >= t.minPct) {
      tier = t.tier;
      break;
    }
  }

  return buildRankInfo(tier, percentile);
}

function buildRankInfo(tier: RankTier, percentile?: number): RankInfo {
  if (tier === "S") {
    return {
      tier: "S",
      subrank: null,
      display: "S",
      color: "#F59E0B",
      bgColor: "rgba(245,158,11,0.15)",
      borderColor: "#F59E0B",
      glowClass: "s-rank-glow",
    };
  }

  // Determine subrank within tier (1 = top third, 3 = bottom third)
  let subrank: 1 | 2 | 3 = 3;
  if (percentile !== undefined) {
    const tierData = RANK_TIERS.find((t) => t.tier === tier);
    if (tierData) {
      const tierRange = tierData.maxPct - tierData.minPct;
      const posInTier = 100 - (percentile ?? 0) - tierData.minPct;
      const fraction = posInTier / tierRange;
      if (fraction >= 0.67) subrank = 1;
      else if (fraction >= 0.33) subrank = 2;
      else subrank = 3;
    }
  }

  const colors: Record<RankTier, { color: string; bg: string; border: string }> = {
    S: { color: "#F59E0B", bg: "rgba(245,158,11,0.15)", border: "#F59E0B" },
    A: { color: "#A78BFA", bg: "rgba(167,139,250,0.12)", border: "#7C3AED" },
    B: { color: "#60A5FA", bg: "rgba(96,165,250,0.12)", border: "#2563EB" },
    C: { color: "#34D399", bg: "rgba(52,211,153,0.12)", border: "#059669" },
    D: { color: "#FBBF24", bg: "rgba(251,191,36,0.12)", border: "#D97706" },
    E: { color: "#F87171", bg: "rgba(248,113,113,0.12)", border: "#DC2626" },
    F: { color: "#9CA3AF", bg: "rgba(156,163,175,0.1)", border: "#4B5563" },
  };

  return {
    tier,
    subrank,
    display: `${tier}${subrank}`,
    color: colors[tier].color,
    bgColor: colors[tier].bg,
    borderColor: colors[tier].border,
    glowClass: "",
  };
}

export function getRankInfo(rankDisplay: string): RankInfo {
  if (rankDisplay === "S") return buildRankInfo("S");
  const tier = rankDisplay[0] as RankTier;
  const subrank = parseInt(rankDisplay[1]) as 1 | 2 | 3;
  return {
    ...buildRankInfo(tier),
    subrank,
    display: rankDisplay,
  };
}

export const ALL_RANKS = [
  "F3", "F2", "F1",
  "E3", "E2", "E1",
  "D3", "D2", "D1",
  "C3", "C2", "C1",
  "B3", "B2", "B1",
  "A3", "A2", "A1",
  "S",
];

export function getNextRank(current: string): string | null {
  const idx = ALL_RANKS.indexOf(current);
  if (idx === -1 || idx === ALL_RANKS.length - 1) return null;
  return ALL_RANKS[idx + 1];
}
