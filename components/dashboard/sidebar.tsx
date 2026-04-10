"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Zap,
  Trophy,
  Share2,
  LogOut,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RankBadge } from "@/components/ui/rank-badge";
import { XPBar } from "@/components/ui/xp-bar";
import type { Student } from "@/types";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen },
  { href: "/dashboard/study", label: "Study", icon: Zap },
  { href: "/dashboard/quests", label: "Weekly Quests", icon: Users },
  { href: "/dashboard/rankings", label: "Rankings", icon: Trophy },
];

interface SidebarProps {
  student: Student;
}

export function Sidebar({ student }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  // XP to next rank (simplified: show overall XP progress out of 1000 intervals)
  const xpInLevel = student.xp_overall % 500;
  const xpToNext = 500;

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-[#1A1916] border-r border-[#2E2C28] overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-[#2E2C28]">
        <Link href="/">
          <span className="text-xl font-black">
            <span className="text-[#F59E0B]">Maste</span>
            <span className="text-white">X</span>
          </span>
        </Link>
      </div>

      {/* Student info */}
      <div className="p-4 border-b border-[#2E2C28]">
        <div className="flex items-center gap-3 mb-3">
          <RankBadge rank={student.rank_overall} size="md" />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{student.full_name}</div>
            <div className="text-xs text-[#6B6860]">Year {student.year_group} · #{student.rank_position_overall}</div>
          </div>
        </div>
        <XPBar current={xpInLevel} max={xpToNext} showValues={false} />
        <div className="text-xs text-[#6B6860] mt-1">
          {student.xp_overall.toLocaleString()} XP total
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
                  : "text-[#9CA3AF] hover:bg-[#252320] hover:text-white"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Referral code */}
      <div className="p-4 mx-3 mb-2 bg-[#252320] rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <Share2 size={13} className="text-[#6B6860]" />
          <span className="text-xs text-[#6B6860]">Referral code</span>
        </div>
        <span className="text-sm font-bold text-[#F59E0B] tracking-widest">
          {student.referral_code}
        </span>
        <div className="text-xs text-[#6B6860] mt-0.5">
          {student.active_referral_count} active referral{student.active_referral_count !== 1 ? "s" : ""}
          {student.discount_pct > 0 && ` · ${student.discount_pct}% off`}
        </div>
      </div>

      {/* Sign out */}
      <div className="p-3 border-t border-[#2E2C28]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[#6B6860] hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
