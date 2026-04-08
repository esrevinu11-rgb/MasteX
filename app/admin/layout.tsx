import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (user.email !== adminEmail) redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-[#0F0E0C]">
      <AdminSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
