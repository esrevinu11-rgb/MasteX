"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateReferralCode } from "@/lib/utils";
import { deleteOrphanedAuthUser } from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2;

interface FormData {
  fullName: string;
  email: string;
  password: string;
  schoolName: string;
  yearGroup: "1" | "2" | "3" | "";
  referralCode: string;
}

const STEP_LABELS: Record<Step, string> = {
  1: "Account details",
  2: "School info",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    schoolName: "",
    yearGroup: "",
    referralCode: "",
  });

  // Generic field updater — clears error on change
  function setField(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError("");
    };
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateStep1(): string | null {
    if (!form.fullName.trim()) return "Please enter your full name.";
    if (form.fullName.trim().split(" ").length < 2)
      return "Please enter your first and last name.";
    if (!form.email.trim()) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return "Please enter a valid email address.";
    if (form.password.length < 8)
      return "Password must be at least 8 characters.";
    return null;
  }

  function validateStep2(): string | null {
    if (!form.schoolName.trim()) return "Please enter your school name.";
    if (!form.yearGroup) return "Please select your year group.";
    return null;
  }

  // ── Step 1 → 2 (pure client-side, no Supabase) ─────────────────────────────

  function handleContinue() {
    console.log("[Signup] Continue clicked — current step:", step);
    setError("");

    const err = validateStep1();
    if (err) {
      console.log("[Signup] Step 1 validation failed:", err);
      setError(err);
      return;
    }

    console.log("[Signup] Step 1 validated OK — moving to step 2");
    setStep(2);
  }

  // ── Timeout helper — rejects after ms if the wrapped promise hasn't settled ──
  // Accepts PromiseLike<T> (covers both native Promise and Supabase's
  // PostgrestFilterBuilder which is thenable but not a real Promise).

  function withTimeout<T>(promise: PromiseLike<T>, ms = 15_000): Promise<T> {
    const timer = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Something is taking too long. Please try again.")),
        ms
      )
    );
    // Promise.resolve converts any PromiseLike to a real Promise so
    // Promise.race can work with both operands correctly.
    return Promise.race([Promise.resolve(promise), timer]);
  }

  // ── Step 2 submit — creates auth user + student record ─────────────────────

  async function handleSubmit() {
    console.log("[Signup] Submit clicked — validating step 2");
    setError("");

    const err = validateStep2();
    if (err) {
      console.log("[Signup] Step 2 validation failed:", err);
      setError(err);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // ── CALL 1: supabase.auth.signUp() ─────────────────────────────────────
      console.log("[Signup] CALL 1: supabase.auth.signUp() — email:", form.email.trim());

      const authResult = await withTimeout(
        supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { data: { full_name: form.fullName.trim() } },
        })
      );

      console.log("[Signup] CALL 1 response:", {
        userId: authResult.data?.user?.id ?? null,
        sessionPresent: !!authResult.data?.session,
        error: authResult.error ?? null,
      });

      if (authResult.error) {
        setError(authResult.error.message);
        return;
      }
      if (!authResult.data.user) {
        setError("Account creation failed — no user was returned. Please try again.");
        return;
      }

      const userId = authResult.data.user.id;

      // ── CALL 2: supabase.from('students').insert() ─────────────────────────
      const myReferralCode = generateReferralCode(form.fullName.trim());
      console.log(
        "[Signup] CALL 2: supabase.from('students').insert() — userId:",
        userId,
        "referralCode:",
        myReferralCode
      );

      const insertResult = await withTimeout(
        supabase.from("students").insert({
          id: userId,
          full_name: form.fullName.trim(),
          email: form.email.trim(),
          school_name: form.schoolName.trim(),
          year_group: parseInt(form.yearGroup, 10),
          referral_code: myReferralCode,
          referred_by: form.referralCode.trim().toUpperCase() || null,
          subscription_status: "inactive",
          onboarding_completed: false,
        })
      );

      console.log("[Signup] CALL 2 response:", {
        data: insertResult.data,
        error: insertResult.error ?? null,
      });

      if (insertResult.error) {
        console.error("[Signup] CALL 2 failed — students insert error:", {
          message: insertResult.error.message,
          code:    insertResult.error.code,
          details: insertResult.error.details,
          hint:    insertResult.error.hint,
        });

        // Attempt to delete the orphaned auth user so the student can
        // retry signup with the same email without hitting "already registered".
        console.log("[Signup] attempting cleanup of orphaned auth user:", userId);
        const cleanup = await deleteOrphanedAuthUser();
        if ("success" in cleanup) {
          console.log("[Signup] cleanup succeeded — auth user deleted");
          setError(
            `Account setup failed: ${insertResult.error.message}. ` +
            `Your account has been removed — please try signing up again.`
          );
        } else {
          console.warn("[Signup] cleanup failed:", cleanup.error);
          setError(
            `Account setup failed: ${insertResult.error.message}. ` +
            `Please contact support — your email may be locked until we fix it.`
          );
        }
        return;
      }

      // Both calls succeeded — stop spinner before navigating so the
      // component doesn't try to update state after unmount
      setLoading(false);
      console.log("[Signup] Success — redirecting to /onboarding");
      router.push("/onboarding");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      console.error("[Signup] Caught error:", message, err);
      setError(message);
    } finally {
      // Guarantees spinner stops even if an unexpected throw skips the
      // explicit setLoading(false) above (e.g. the timeout rejection)
      setLoading(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

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
          {([1, 2] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  s < step
                    ? "bg-[#F59E0B] border-[#F59E0B] text-black"
                    : s === step
                    ? "border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10"
                    : "border-[#2E2C28] text-[#4B5563] bg-transparent"
                }`}
              >
                {s < step ? <Check size={13} /> : s}
              </div>
              {s < 2 && (
                <div
                  className={`flex-1 h-0.5 rounded-full transition-all ${
                    s < step ? "bg-[#F59E0B]" : "bg-[#2E2C28]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-6 sm:p-8">

          {/* ── Step 1: Account details ─────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h1 className="text-xl font-bold mb-1">Create your account</h1>
              <p className="text-sm text-[#9CA3AF] mb-6">
                Step 1 of 2 — {STEP_LABELS[1]}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ama Serwaa Mensah"
                    value={form.fullName}
                    onChange={setField("fullName")}
                    autoComplete="name"
                    className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={setField("email")}
                    autoComplete="email"
                    className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={form.password}
                      onChange={setField("password")}
                      autoComplete="new-password"
                      className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6860] hover:text-white transition-colors"
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <p className="text-xs text-[#4B5563] mt-1.5">
                    Must be at least 8 characters.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: School info ─────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <h1 className="text-xl font-bold mb-1">School information</h1>
              <p className="text-sm text-[#9CA3AF] mb-6">
                Step 2 of 2 — {STEP_LABELS[2]}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    School name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Achimota School"
                    value={form.schoolName}
                    onChange={setField("schoolName")}
                    autoComplete="organization"
                    className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Year group
                  </label>
                  <select
                    value={form.yearGroup}
                    onChange={setField("yearGroup")}
                    className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors text-[#F5F0E8]"
                  >
                    <option value="" disabled>
                      Select your year group
                    </option>
                    <option value="1">Year 1 (SHS 1)</option>
                    <option value="2">Year 2 (SHS 2)</option>
                    <option value="3">Year 3 (SHS 3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Referral code{" "}
                    <span className="text-[#4B5563] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AMS-X4F2"
                    value={form.referralCode}
                    onChange={setField("referralCode")}
                    className="w-full bg-[#252320] border border-[#2E2C28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder-[#4B5563] uppercase tracking-widest"
                  />
                  <p className="text-xs text-[#4B5563] mt-1.5">
                    Enter a friend&apos;s code — they earn a discount reward when
                    you join.
                  </p>
                </div>

                {/* Payment note */}
                <div className="bg-[#F59E0B]/08 border border-[#F59E0B]/20 rounded-xl p-4 text-xs text-[#F59E0B] leading-relaxed">
                  <span className="font-semibold">How activation works:</span>{" "}
                  Your account is created now. Send GHC 40 via MoMo to activate
                  study features — the admin confirms within 24 hours.
                </div>
              </div>
            </div>
          )}

          {/* ── Error display ───────────────────────────────────────────────── */}
          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3"
            >
              <span className="text-red-400 mt-0.5 flex-none text-base leading-none">
                ⚠
              </span>
              <p className="text-sm text-red-400 leading-snug">{error}</p>
            </div>
          )}

          {/* ── Navigation buttons ──────────────────────────────────────────── */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={() => {
                  console.log("[Signup] Back clicked — returning to step 1");
                  setError("");
                  setStep(1);
                }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-3 border border-[#2E2C28] rounded-xl text-sm hover:border-[#3E3C38] transition-colors disabled:opacity-40"
              >
                <ArrowLeft size={15} /> Back
              </button>
            )}

            {step === 1 ? (
              <button
                type="button"
                onClick={handleContinue}
                className="flex-1 flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] text-black font-bold py-3 rounded-xl text-sm transition-all"
              >
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl text-sm transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight size={15} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-[#6B6860] mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#F59E0B] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
