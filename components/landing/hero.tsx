import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-4 overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F59E0B]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#A78BFA]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
        {/* Tag */}
        <div className="inline-flex items-center gap-2 bg-[#1A1916] border border-[#2E2C28] rounded-full px-4 py-1.5">
          <Zap size={13} className="text-[#F59E0B]" fill="#F59E0B" />
          <span className="text-xs text-[#9CA3AF] font-medium">AI-Powered WAEC Mastery for Ghana SHS</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-black leading-tight tracking-tight">
          Stop memorising.{" "}
          <span className="text-[#F59E0B] s-rank-text-glow">
            Start mastering.
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-[#9CA3AF] max-w-2xl mx-auto leading-relaxed">
          MasteX uses spaced repetition, 6 question frames, and weekly AI-graded
          quests to take you from F rank to S rank — and ace your WASSCE.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-base px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105"
          >
            Start Mastering — GHC 40/month
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 bg-[#1A1916] hover:bg-[#252320] border border-[#2E2C28] text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors"
          >
            Login to Dashboard
          </Link>
        </div>

        {/* Social proof */}
        <p className="text-sm text-[#6B6860]">
          No contracts. Cancel anytime. Designed for Ghana SHS Year 1, 2 &amp; 3.
        </p>
      </div>

      {/* Stats bar */}
      <div className="relative z-10 mt-16 w-full max-w-3xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#2E2C28] rounded-2xl overflow-hidden border border-[#2E2C28]">
          {[
            { value: "4", label: "Core Subjects" },
            { value: "6", label: "Question Frames" },
            { value: "19", label: "Rank Tiers" },
            { value: "GHC 40", label: "Per Month" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#1A1916] px-6 py-5 text-center"
            >
              <div className="text-2xl font-black text-[#F59E0B]">{stat.value}</div>
              <div className="text-xs text-[#6B6860] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
