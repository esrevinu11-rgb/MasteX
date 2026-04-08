"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Zap, Users, Trophy } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen },
  { href: "/dashboard/study", label: "Study", icon: Zap },
  { href: "/dashboard/quests", label: "Quests", icon: Users },
  { href: "/dashboard/rankings", label: "Ranks", icon: Trophy },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#1A1916] border-t border-[#2E2C28]">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                active ? "text-[#F59E0B]" : "text-[#6B6860]"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
