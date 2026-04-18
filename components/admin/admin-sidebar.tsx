"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, BookOpen, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/content", label: "Content", icon: BookOpen },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <aside className="flex flex-col w-56 h-screen sticky top-0 bg-[#1A1916] border-r border-[#2E2C28]">
      <div className="p-5 border-b border-[#2E2C28]">
        <span className="text-lg font-black">
          <span className="text-[#F59E0B]">Maste</span>
          <span className="text-white">X</span>
        </span>
        <div className="text-xs text-[#6B6860] mt-1">Admin Panel</div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
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

      <div className="p-3 border-t border-[#2E2C28]">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[#6B6860] hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
