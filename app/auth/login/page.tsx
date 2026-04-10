"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, {});
  const [showPass, setShowPass] = useState(false);

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
          <p className="text-sm text-[#9CA3AF] mb-6">Login to your MasteX account</p>

          <form action={action} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                required
                className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6860] hover:text-white"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {state?.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-60 text-black font-bold py-3.5 rounded-xl text-sm transition-colors"
            >
              {pending ? "Logging in..." : "Login to Dashboard"}
              {!pending && <ArrowRight size={15} />}
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
