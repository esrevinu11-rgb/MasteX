"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, X, Check } from "lucide-react";
import { PROGRAMMES } from "@/lib/programmes";
import { saveProgramme } from "@/app/dashboard/actions";

export function ProgrammeSelectBanner() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const selectedProg = PROGRAMMES.find((p) => p.id === selected);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const result = await saveProgramme(selected);
    if (result && "error" in result) {
      setError((result as { error: string }).error ?? "Failed to save programme");
      setSaving(false);
      return;
    }
    router.refresh();
  };

  return (
    <div className="bg-[#A78BFA]/10 border border-[#A78BFA]/30 rounded-2xl p-4">
      {!open ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#A78BFA]/15 rounded-xl flex items-center justify-center flex-none text-xl">
            🎓
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[#A78BFA]">
              Select your SHS programme
            </div>
            <div className="text-xs text-[#9CA3AF] mt-0.5">
              Unlock elective subject tracking tailored to your programme.
            </div>
          </div>
          <div className="flex items-center gap-2 flex-none">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1 text-xs font-semibold text-[#A78BFA] hover:text-[#C4B5FD] transition-colors"
            >
              Select <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-[#4B5563] hover:text-[#6B7280] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-[#F5F0E8]">
              Choose your SHS programme
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[#4B5563] hover:text-[#6B7280] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PROGRAMMES.map((prog) => (
              <button
                key={prog.id}
                onClick={() => setSelected(prog.id)}
                className={`relative text-left p-3 rounded-xl border transition-all ${
                  selected === prog.id
                    ? "border-[#A78BFA] bg-[#A78BFA]/10"
                    : "border-[#2E2C28] bg-[#1A1916] hover:border-[#3E3C38]"
                }`}
              >
                {!prog.isAvailable && (
                  <span className="absolute top-1.5 right-1.5 text-[8px] font-bold bg-[#2E2C28] text-[#6B6860] px-1 py-0.5 rounded-full">
                    SOON
                  </span>
                )}
                {selected === prog.id && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#A78BFA] rounded-full flex items-center justify-center">
                    <Check size={9} className="text-black" />
                  </span>
                )}
                <div className="text-lg mb-1">{prog.emoji}</div>
                <div className="text-[11px] font-semibold text-[#F5F0E8] leading-tight">
                  {prog.name}
                </div>
              </button>
            ))}
          </div>

          {selected && !selectedProg?.isAvailable && (
            <div className="text-xs text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl px-3 py-2">
              Elective subjects for {selectedProg?.name} are coming soon. Your
              4 core subjects are fully available now.
            </div>
          )}

          {error && (
            <div className="text-xs text-[#F87171] bg-[#F87171]/10 border border-[#F87171]/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="w-full bg-[#A78BFA] hover:bg-[#9171E8] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              "Save Programme"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
