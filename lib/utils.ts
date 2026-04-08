import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function generateReferralCode(name: string): string {
  const initials = name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 3)
    .padEnd(3, "X");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${initials}-${random}`;
}

export function getWeekBounds(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

export function getDaysUntil(date: Date | string): number {
  const target = new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calculateDiscount(activeReferrals: number): {
  pct: number;
  tier: string;
} {
  if (activeReferrals >= 20) return { pct: 50, tier: "S-Tier" };
  if (activeReferrals >= 15) return { pct: 40, tier: "Elite" };
  if (activeReferrals >= 10) return { pct: 30, tier: "Legend" };
  if (activeReferrals >= 7) return { pct: 20, tier: "Grinder" };
  if (activeReferrals >= 5) return { pct: 15, tier: "Hustler" };
  if (activeReferrals >= 3) return { pct: 10, tier: "Booster" };
  if (activeReferrals >= 1) return { pct: 5, tier: "Starter" };
  return { pct: 0, tier: "None" };
}
