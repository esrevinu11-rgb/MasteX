"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const set = (field: "email" | "password") => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      // Check if admin
      if (form.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0E0C] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <span className="text-2xl font-black">
          <span className="text-[#F59E0B]">Maste</span>
          <span className="text-white">X</span>
        </span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-6 sm:p-8">
          <h1 className="text-xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-[#9CA3AF] mb-6">Login to your MasteX dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
                className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Your password"
                  value={form.password}
                  onChange={set("password")}
                  autoComplete="current-password"
                  className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6860] hover:text-white"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-60 text-black font-bold py-3.5 rounded-xl text-sm transition-colors"
            >
              {loading ? "Logging in..." : "Login to Dashboard"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B6860] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-[#F59E0B] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
