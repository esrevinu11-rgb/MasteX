"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { getElectivesForProgramme } from "@/lib/subjects";
import { addSubject, removeSubject } from "@/app/dashboard/actions";

interface StudentSubject {
  subject_id: string;
  is_compulsory: boolean;
}

interface Props {
  studentSubjects: StudentSubject[];
  programmeId: string | null;
  subscriptionTier: "core" | "programme" | "full" | null;
}

export function ManageSubjectsPanel({ studentSubjects, programmeId, subscriptionTier }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null); // subject being modified

  const currentIds = studentSubjects.map((s) => s.subject_id);
  const electives = getElectivesForProgramme(programmeId);
  const notYetAdded = electives.filter((e) => !currentIds.includes(e.id));

  const maxExtra = subscriptionTier === "full" ? 99 : subscriptionTier === "programme" ? 5 : 1;
  const extraCount = studentSubjects.filter((s) => !s.is_compulsory).length;
  const canAddMore = extraCount < maxExtra;

  const handleAdd = async (subjectId: string) => {
    if (!canAddMore) return;
    setLoading(subjectId);
    await addSubject(subjectId);
    router.refresh();
    setLoading(null);
  };

  const handleRemove = async (subjectId: string) => {
    setLoading(subjectId);
    await removeSubject(subjectId);
    router.refresh();
    setLoading(null);
  };

  return (
    <div className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#252320] transition-colors"
      >
        <div>
          <div className="text-sm font-semibold text-[#F5F0E8] text-left">
            Manage Subjects
          </div>
          <div className="text-xs text-[#6B6860] mt-0.5 text-left">
            {extraCount} elective{extraCount !== 1 ? "s" : ""} selected ·{" "}
            {canAddMore ? `${maxExtra - extraCount} slot${maxExtra - extraCount !== 1 ? "s" : ""} available` : "slots full"}
          </div>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-[#6B6860]" />
        ) : (
          <ChevronDown size={16} className="text-[#6B6860]" />
        )}
      </button>

      {open && (
        <div className="border-t border-[#2E2C28] px-6 py-4 space-y-4">
          {/* Current selections */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#6B6860] uppercase tracking-widest">
              Your subjects
            </div>
            {studentSubjects.map((ss) => {
              const el = electives.find((e) => e.id === ss.subject_id);
              const name = el?.name ?? ss.subject_id.replace(/_/g, " ");
              const icon = el?.icon ?? "📚";
              return (
                <div
                  key={ss.subject_id}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl bg-[#252320]"
                >
                  <span className="text-base">{icon}</span>
                  <span className="text-sm text-[#F5F0E8] flex-1 capitalize">{name}</span>
                  {ss.is_compulsory ? (
                    <span className="flex items-center gap-1 text-[10px] text-[#4B5563]">
                      <Lock size={10} /> Required
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRemove(ss.subject_id)}
                      disabled={loading === ss.subject_id}
                      className="text-[#F87171] hover:text-[#EF4444] transition-colors disabled:opacity-40"
                    >
                      {loading === ss.subject_id ? (
                        <div className="w-3 h-3 border border-[#F87171] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add more */}
          {notYetAdded.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#6B6860] uppercase tracking-widest">
                Add subjects
                {!canAddMore && (
                  <span className="ml-2 font-normal text-[#F59E0B]">
                    (upgrade plan to add more)
                  </span>
                )}
              </div>
              {notYetAdded.map((el) => (
                <div
                  key={el.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl bg-[#252320]"
                >
                  <span className="text-base">{el.icon}</span>
                  <span className="text-sm text-[#F5F0E8] flex-1">{el.name}</span>
                  {!el.isLive && (
                    <span className="text-[9px] font-bold bg-[#2E2C28] text-[#6B6860] px-1.5 py-0.5 rounded-full mr-1">
                      SOON
                    </span>
                  )}
                  <button
                    onClick={() => handleAdd(el.id)}
                    disabled={!canAddMore || loading === el.id}
                    className="text-[#34D399] hover:text-[#10B981] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {loading === el.id ? (
                      <div className="w-3 h-3 border border-[#34D399] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus size={15} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
