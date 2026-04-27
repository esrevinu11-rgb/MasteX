import Link from "next/link";
import { Check, ArrowRight, Lock } from "lucide-react";

const CORE_FEATURES = [
  "Core Mathematics",
  "English Language",
  "Integrated Science",
  "Social Studies",
  "AI-generated WASSCE-aligned questions",
  "6 question frames per topic",
  "Spaced repetition reviews",
  "Weekly AI-graded quests",
  "National ranking system",
  "Referral discounts up to 50%",
];

const PROGRAMME_EXTRAS = [
  "Elective subjects for your chosen programme",
  "e.g. Science: Physics, Chemistry, Biology, Elective Maths",
  "e.g. Arts: Literature, Government, Geography, Economics",
  "Programme-specific question banks (coming soon)",
];

const FULL_EXTRAS = [
  "All 9 SHS programmes",
  "Switch programme any time",
  "All elective subjects across every programme",
  "Priority access to new features",
];

interface FeatureItemProps {
  text: string;
  muted?: boolean;
}

function FeatureItem({ text, muted }: FeatureItemProps) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          muted ? "bg-[#2E2C28]" : "bg-[#F59E0B]/15"
        }`}
      >
        {muted ? (
          <Lock size={10} className="text-[#4B5563]" />
        ) : (
          <Check size={12} className="text-[#F59E0B]" />
        )}
      </div>
      <span className={muted ? "text-[#4B5563]" : "text-[#D1D5DB]"}>{text}</span>
    </li>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Simple pricing.{" "}
            <span className="text-[#F59E0B]">Pick your plan.</span>
          </h2>
          <p className="text-[#9CA3AF] text-lg max-w-xl mx-auto">
            Start with core subjects and upgrade when electives launch. No
            contracts — cancel or change plans any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

          {/* ── Core ────────────────────────────────────────────────────────── */}
          <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-7 flex flex-col">
            <div className="inline-block bg-[#2E2C28] text-[#9CA3AF] text-xs font-semibold px-3 py-1 rounded-full mb-6 self-start">
              Core
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-[#9CA3AF]">GHC</span>
                <span className="text-5xl font-black text-white">40</span>
                <span className="text-[#9CA3AF]">/month</span>
              </div>
              <p className="text-sm text-[#6B6860] mt-1">4 core WASSCE subjects</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {CORE_FEATURES.map((f) => (
                <FeatureItem key={f} text={f} />
              ))}
              {PROGRAMME_EXTRAS.map((f) => (
                <FeatureItem key={f} text={f} muted />
              ))}
            </ul>
            <Link
              href="/auth/signup"
              className="flex items-center justify-center gap-2 w-full border border-[#2E2C28] hover:border-[#3E3C38] text-[#F5F0E8] font-bold py-4 rounded-xl transition-all duration-200 text-sm"
            >
              Get started
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* ── Programme ───────────────────────────────────────────────────── */}
          <div className="bg-[#1A1916] border-2 border-[#F59E0B]/50 rounded-2xl p-7 flex flex-col relative overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#F59E0B] rounded-full blur-sm" />

            <div className="inline-block bg-[#F59E0B]/10 text-[#F59E0B] text-xs font-semibold px-3 py-1 rounded-full border border-[#F59E0B]/30 mb-6 self-start">
              Programme — Recommended
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-[#9CA3AF]">GHC</span>
                <span className="text-5xl font-black text-white">80</span>
                <span className="text-[#9CA3AF]">/month</span>
              </div>
              <p className="text-sm text-[#6B6860] mt-1">
                Core + your elective subjects
              </p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {CORE_FEATURES.map((f) => (
                <FeatureItem key={f} text={f} />
              ))}
              {PROGRAMME_EXTRAS.map((f) => (
                <FeatureItem key={f} text={f} />
              ))}
            </ul>
            <Link
              href="/auth/signup"
              className="flex items-center justify-center gap-2 w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-4 rounded-xl transition-all duration-200 hover:scale-105 text-sm"
            >
              Start with Programme
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* ── Full Access ──────────────────────────────────────────────────── */}
          <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-7 flex flex-col">
            <div className="inline-block bg-[#A78BFA]/10 text-[#A78BFA] text-xs font-semibold px-3 py-1 rounded-full border border-[#A78BFA]/30 mb-6 self-start">
              Full Access
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-[#9CA3AF]">GHC</span>
                <span className="text-5xl font-black text-white">150</span>
                <span className="text-[#9CA3AF]">/month</span>
              </div>
              <p className="text-sm text-[#6B6860] mt-1">
                All programmes &amp; all electives
              </p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {CORE_FEATURES.map((f) => (
                <FeatureItem key={f} text={f} />
              ))}
              {FULL_EXTRAS.map((f) => (
                <FeatureItem key={f} text={f} />
              ))}
            </ul>
            <Link
              href="/auth/signup"
              className="flex items-center justify-center gap-2 w-full border border-[#A78BFA]/40 hover:border-[#A78BFA]/70 text-[#A78BFA] font-bold py-4 rounded-xl transition-all duration-200 text-sm"
            >
              Get Full Access
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Footer notes */}
        <div className="mt-10 text-center space-y-2">
          <p className="text-xs text-[#6B6860]">
            Pay via MoMo or bank transfer. Manual confirmation by admin within 24 hours.
          </p>
          <p className="text-xs text-[#6B6860]">
            Paystack integration coming soon for instant activation. Refer friends — get up to 50% off.
          </p>
        </div>
      </div>
    </section>
  );
}
