"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateReferralCode } from "@/lib/utils";

type Step = 1 | 2 | 3;

interface FormData {
  fullName: string;
  email: string;
  password: string;
  schoolName: string;
  yearGroup: "1" | "2" | "3" | "";
  referralCode: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myReferralCode, setMyReferralCode] = useState("");

  const [form, setForm] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    schoolName: "",
    yearGroup: "",
    referralCode: "",
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  function validateStep1() {
    if (!form.fullName.trim()) return "Full name is required";
    if (!form.email.trim() || !form.email.includes("@")) return "Valid email is required";
    if (form.password.length < 8) return "Password must be at least 8 characters";
    return null;
  }

  function validateStep2() {
    if (!form.schoolName.trim()) return "School name is required";
    if (!form.yearGroup) return "Year group is required";
    return null;
  }

  function nextStep() {
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      const code = generateReferralCode(form.fullName);
      setMyReferralCode(code);
      setStep(3);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!data.user) throw new Error("Signup failed");

      // Insert student profile
      const { error: insertError } = await supabase.from("students").insert({
        id: data.user.id,
        full_name: form.fullName,
        email: form.email,
        school_name: form.schoolName,
        year_group: parseInt(form.yearGroup),
        referral_code: myReferralCode,
        referred_by: form.referralCode || null,
        subscription_status: "inactive",
      });

      if (insertError) throw insertError;

      router.push("/dashboard?new=1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyRef() {
    navigator.clipboard.writeText(myReferralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  s < step
                    ? "bg-[#F59E0B] border-[#F59E0B] text-black"
                    : s === step
                    ? "border-[#F59E0B] text-[#F59E0B]"
                    : "border-[#2E2C28] text-[#4B5563]"
                }`}
              >
                {s < step ? <Check size={13} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-0.5 ${s < step ? "bg-[#F59E0B]" : "bg-[#2E2C28]"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-6 sm:p-8">
          {/* Step 1: Account details */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h1 className="text-xl font-bold mb-1">Create your account</h1>
              <p className="text-sm text-[#9CA3AF] mb-6">Step 1 of 3 — Account details</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ama Serwaa Mensah"
                    value={form.fullName}
                    onChange={set("fullName")}
                    className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email address</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={set("email")}
                    className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={form.password}
                      onChange={set("password")}
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
              </div>
            </div>
          )}

          {/* Step 2: School info */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h1 className="text-xl font-bold mb-1">School information</h1>
              <p className="text-sm text-[#9CA3AF] mb-6">Step 2 of 3 — Your school details</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">School name</label>
                  <input
                    type="text"
                    placeholder="e.g. Achimota School"
                    value={form.schoolName}
                    onChange={set("schoolName")}
                    className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Year group</label>
                  <select
                    value={form.yearGroup}
                    onChange={set("yearGroup")}
                    className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors"
                  >
                    <option value="">Select your year group</option>
                    <option value="1">Year 1 (SHS 1)</option>
                    <option value="2">Year 2 (SHS 2)</option>
                    <option value="3">Year 3 (SHS 3)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Referral code{" "}
                    <span className="text-[#6B6860] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KAB-X4F2"
                    value={form.referralCode}
                    onChange={set("referralCode")}
                    className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563] uppercase"
                  />
                  <p className="text-xs text-[#6B6860] mt-1.5">
                    Enter a friend&apos;s code and give them a discount reward.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h1 className="text-xl font-bold mb-1">Payment instructions</h1>
              <p className="text-sm text-[#9CA3AF] mb-6">Step 3 of 3 — Complete your payment</p>

              {/* Referral code */}
              <div className="bg-[#252320] border border-[#2E2C28] rounded-xl p-4 mb-6">
                <p className="text-xs text-[#6B6860] mb-2">Your referral code (share to earn discounts)</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-bold text-[#F59E0B] tracking-widest">{myReferralCode}</span>
                  <button
                    onClick={copyRef}
                    className="flex items-center gap-1.5 text-xs bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 px-3 py-1.5 rounded-lg hover:bg-[#F59E0B]/20 transition-colors"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Payment steps */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">How to activate your account:</h3>

                <div className="space-y-3">
                  {[
                    {
                      step: "1",
                      title: "Send GHC 40 via MoMo",
                      desc: "Send to 0XX-XXX-XXXX (MasteX). Use your email as reference.",
                    },
                    {
                      step: "2",
                      title: "Or bank transfer",
                      desc: "Account: 1234567890 · Bank: GCB · Name: MasteX Ghana",
                    },
                    {
                      step: "3",
                      title: "Admin confirms your payment",
                      desc: "Within 24 hours. Your account activates and you can start studying.",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3 p-4 bg-[#252320] rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-xs font-bold text-[#F59E0B] flex-shrink-0 mt-0.5">
                        {item.step}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-xs text-[#6B6860] mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl p-4 text-xs text-[#F59E0B]">
                  Your account will be created now. You&apos;ll see the dashboard but study features
                  unlock after payment is confirmed.
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="flex items-center gap-2 px-4 py-3 border border-[#2E2C28] rounded-xl text-sm hover:border-[#3E3C38] transition-colors"
              >
                <ArrowLeft size={15} /> Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={nextStep}
                className="flex-1 flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-3 rounded-xl text-sm transition-colors"
              >
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-60 text-black font-bold py-3 rounded-xl text-sm transition-colors"
              >
                {loading ? "Creating account..." : "Create Account"}
                {!loading && <ArrowRight size={15} />}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-[#6B6860] mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#F59E0B] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
