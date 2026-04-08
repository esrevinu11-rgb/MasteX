"use client";

import { cn } from "@/lib/utils";

interface XPBarProps {
  current: number;
  max: number;
  label?: string;
  showValues?: boolean;
  color?: string;
  className?: string;
}

export function XPBar({
  current,
  max,
  label,
  showValues = true,
  color = "#F59E0B",
  className,
}: XPBarProps) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  return (
    <div className={cn("w-full", className)}>
      {(label || showValues) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-[#9CA3AF]">{label}</span>}
          {showValues && (
            <span className="text-xs text-[#9CA3AF] ml-auto">
              {current.toLocaleString()} / {max.toLocaleString()} XP
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-[#2E2C28] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          }}
        />
      </div>
    </div>
  );
}
