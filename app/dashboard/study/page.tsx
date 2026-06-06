import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SUBJECTS } from "@/types";
import { getElectivesForProgramme } from "@/lib/subjects";
import { type Student } from "@/types";

const LIVE_SUBJECT_IDS = new Set(["core_math", "english", "integrated_science", "social_studies"]);

export default async function StudyHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: student } = await supabase
    .from("students")
    .select("id, programme_id")
    .eq("id", user.id)
    .single();
  if (!student) redirect("/auth/login");

  const s = student as Pick<Student, "id" | "programme_id">;

  // Fetch the student's selected subjects
  const { data: studentSubjectRows } = await supabase
    .from("student_subjects")
    .select("subject_id, is_compulsory")
    .eq("student_id", user.id);

  // Fallback: show all 4 live subjects for pre-migration students
  const selectedIds: string[] =
    studentSubjectRows && studentSubjectRows.length > 0
      ? studentSubjectRows.map((r) => r.subject_id)
      : SUBJECTS.map((sub) => sub.id);

  // Split into live and coming-soon
  const liveSubjects = SUBJECTS.filter((sub) => selectedIds.includes(sub.id));

  // Coming-soon subjects: selected but not yet in SUBJECTS (live)
  const comingSoonIds = selectedIds.filter((id) => !SUBJECTS.find((s) => s.id === id));
  const allElectives = getElectivesForProgramme(s.programme_id ?? null);
  const comingSoonSubjects = comingSoonIds
    .map((id) => allElectives.find((e) => e.id === id))
    .filter(Boolean) as typeof allElectives;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Study</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">Choose a subject to begin</p>
      </div>

      {/* Live subject cards */}
      <div className="grid grid-cols-2 gap-4">
        {liveSubjects.map((subject) => (
          <Link
            key={subject.id}
            href={`/dashboard/study/${subject.id}`}
            className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-5 hover:border-[#3E3C38] transition-all group active:scale-[0.98]"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
              style={{ backgroundColor: `${subject.color}20` }}
            >
              {subject.icon}
            </div>
            <div className="text-sm font-bold text-[#F5F0E8] leading-snug">
              {subject.name}
            </div>
            <div className="text-xs text-[#6B6860] mt-1 leading-snug">
              {subject.description}
            </div>
            <div
              className="text-xs font-semibold mt-3 group-hover:opacity-80 transition-opacity"
              style={{ color: subject.color }}
            >
              Start studying →
            </div>
          </Link>
        ))}
      </div>

      {/* Coming-soon electives */}
      {comingSoonSubjects.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[#6B6860] uppercase tracking-widest mb-3">
            Coming Soon
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {comingSoonSubjects.map((sub) => (
              <div
                key={sub.id}
                className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-4 opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{sub.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#F5F0E8] truncate">
                      {sub.name}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-[#2E2C28] text-[#6B6860] px-1.5 py-0.5 rounded-full flex-none">
                    SOON
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {liveSubjects.length === 0 && comingSoonSubjects.length === 0 && (
        <div className="text-center py-16 text-[#6B6860]">
          <p className="text-sm">No subjects selected yet.</p>
          <Link
            href="/dashboard/subjects"
            className="text-xs text-[#F59E0B] hover:underline mt-2 inline-block"
          >
            Manage your subjects →
          </Link>
        </div>
      )}
    </div>
  );
}
