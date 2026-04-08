import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import type { Student } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!student) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen bg-[#0F0E0C]">
      <Sidebar student={student as Student} />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
