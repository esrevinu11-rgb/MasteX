import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

const features = [
  "All 4 core WAEC subjects",
  "AI-generated WAEC-aligned questions",
  "6 question frames per topic",
  "Spaced repetition reviews",
  "Weekly AI-graded quests",
  "National ranking system",
  "Referral discounts up to 50%",
  "Mobile-first interface",
  "Progress analytics",
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            One plan.{" "}
            <span className="text-[#F59E0B]">Everything included.</span>
          </h2>
          <p className="text-[#9CA3AF] text-lg max-w-xl mx-auto">
            No tiers. No hidden fees. Just full access for GHC 40 a month — less
            than a textbook.
          </p>
        </div>

        <div className="max-w-sm mx-auto">
          <div className="bg-[#1A1916] border-2 border-[#F59E0B]/40 rounded-2xl p-8 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#F59E0B] rounded-full blur-sm" />

            {/* Badge */}
            <div className="inline-block bg-[#F59E0B]/10 text-[#F59E0B] text-xs font-semibold px-3 py-1 rounded-full border border-[#F59E0B]/30 mb-6">
              Full Access
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-[#9CA3AF]">GHC</span>
                <span className="text-5xl font-black text-white">40</span>
                <span className="text-[#9CA3AF]">/month</span>
              </div>
              <p className="text-sm text-[#6B6860] mt-1">
                Refer friends — get up to 50% off
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-[#F59E0B]/15 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-[#F59E0B]" />
                  </div>
                  <span className="text-[#D1D5DB]">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href="/auth/signup"
              className="flex items-center justify-center gap-2 w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-4 rounded-xl transition-all duration-200 hover:scale-105"
            >
              Start Now — GHC 40/month
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Payment note */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-[#6B6860]">
              Pay via MoMo or bank transfer. Manual confirmation by admin.
            </p>
            <p className="text-xs text-[#6B6860]">
              Paystack integration coming soon for instant activation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
