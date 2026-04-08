"use client";

import { getRankInfo } from "@/lib/ranking";
import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  xs: "w-7 h-7 text-xs",
  sm: "w-9 h-9 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-3xl",
};

export function RankBadge({ rank, size = "md", className }: RankBadgeProps) {
  const info = getRankInfo(rank);

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg font-bold border-2 rank-badge",
        sizes[size],
        info.glowClass,
        className
      )}
      style={{
        color: info.color,
        backgroundColor: info.bgColor,
        borderColor: info.borderColor,
      }}
    >
      {info.display}
    </div>
  );
}
