export interface SubjectOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  isLive: boolean; // false = coming soon
}

export const COMPULSORY_SUBJECT_IDS = ["core_math", "english", "social_studies"] as const;

// Elective pool per programme (shown in Step 3 after plan selection)
const PROGRAMME_ELECTIVE_POOL: Record<string, SubjectOption[]> = {
  science: [
    { id: "integrated_science", name: "Integrated Science", icon: "⚗",  color: "#34D399", isLive: true  },
    { id: "biology",            name: "Biology",              icon: "🧬", color: "#10B981", isLive: false },
    { id: "chemistry",          name: "Chemistry",            icon: "🧪", color: "#6EE7B7", isLive: false },
    { id: "physics",            name: "Physics",              icon: "⚡", color: "#34D399", isLive: false },
    { id: "elective_math",      name: "Additional Maths",    icon: "∑",  color: "#F59E0B", isLive: false },
  ],
  general_arts: [
    { id: "integrated_science", name: "Integrated Science",  icon: "⚗",  color: "#34D399", isLive: true  },
    { id: "economics",          name: "Economics",            icon: "📈", color: "#60A5FA", isLive: false },
    { id: "geography",          name: "Geography",            icon: "🌍", color: "#34D399", isLive: false },
    { id: "government",         name: "Government",           icon: "🏛", color: "#A78BFA", isLive: false },
    { id: "literature",         name: "Literature in English",icon: "📚", color: "#F87171", isLive: false },
    { id: "history",            name: "History",              icon: "📜", color: "#F59E0B", isLive: false },
  ],
  business: [
    { id: "integrated_science",   name: "Integrated Science",    icon: "⚗",  color: "#34D399", isLive: true  },
    { id: "business_management",  name: "Business Management",   icon: "💼", color: "#60A5FA", isLive: false },
    { id: "accounting",           name: "Financial Accounting",  icon: "📊", color: "#34D399", isLive: false },
    { id: "economics",            name: "Economics",             icon: "📈", color: "#F59E0B", isLive: false },
    { id: "elective_math",        name: "Additional Maths",      icon: "∑",  color: "#A78BFA", isLive: false },
  ],
  vapa: [
    { id: "integrated_science", name: "Integrated Science",           icon: "⚗",  color: "#34D399", isLive: true  },
    { id: "art_design",         name: "Art & Design Foundation",      icon: "🎨", color: "#F59E0B", isLive: false },
    { id: "music",              name: "Music",                        icon: "🎵", color: "#A78BFA", isLive: false },
    { id: "performing_arts",    name: "Performing Arts",              icon: "🎭", color: "#60A5FA", isLive: false },
    { id: "design_tech",        name: "Design & Communication Tech",  icon: "🖥", color: "#34D399", isLive: false },
  ],
};

const DEFAULT_ELECTIVE_POOL: SubjectOption[] = [
  { id: "integrated_science", name: "Integrated Science", icon: "⚗", color: "#34D399", isLive: true },
];

export function getElectivesForProgramme(programmeId: string | null): SubjectOption[] {
  if (!programmeId) return DEFAULT_ELECTIVE_POOL;
  return PROGRAMME_ELECTIVE_POOL[programmeId] ?? DEFAULT_ELECTIVE_POOL;
}

// All possible subject IDs (for migration / subjects table seeding)
export const ALL_SUBJECT_IDS = [
  "core_math", "english", "social_studies", "integrated_science",
  "biology", "chemistry", "physics", "elective_math",
  "economics", "geography", "government", "literature", "history",
  "business_management", "accounting",
  "art_design", "music", "performing_arts", "design_tech",
] as const;
