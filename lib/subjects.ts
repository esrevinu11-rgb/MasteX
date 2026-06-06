export interface SubjectOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  isLive: boolean; // false = coming soon
}

export const COMPULSORY_SUBJECT_IDS = ["core_math", "english", "social_studies"] as const;

// All elective subjects students can freely choose — regardless of programme
export const ALL_ELECTIVE_SUBJECTS: SubjectOption[] = [
  // ── Live subjects ──────────────────────────────────────────────────────────
  { id: "integrated_science",   name: "Integrated Science",                       icon: "⚗",  color: "#34D399", isLive: true  },

  // ── Sciences ───────────────────────────────────────────────────────────────
  { id: "biology",              name: "Biology",                                   icon: "🧬", color: "#10B981", isLive: false },
  { id: "chemistry",            name: "Chemistry",                                 icon: "🧪", color: "#6EE7B7", isLive: false },
  { id: "physics",              name: "Physics",                                   icon: "⚡", color: "#60A5FA", isLive: false },
  { id: "elective_math",        name: "Additional Mathematics",                    icon: "∑",  color: "#F59E0B", isLive: false },
  { id: "computer_science",     name: "Computer Science",                          icon: "⌨",  color: "#06B6D4", isLive: false },
  { id: "ict",                  name: "ICT",                                       icon: "◧",  color: "#0EA5E9", isLive: false },

  // ── Humanities & Social Sciences ───────────────────────────────────────────
  { id: "economics",            name: "Economics",                                 icon: "📈", color: "#60A5FA", isLive: false },
  { id: "geography",            name: "Geography",                                 icon: "🌍", color: "#34D399", isLive: false },
  { id: "government",           name: "Government",                                icon: "🏛", color: "#A78BFA", isLive: false },
  { id: "history",              name: "History",                                   icon: "📜", color: "#F59E0B", isLive: false },
  { id: "literature",           name: "Literature in English",                     icon: "📚", color: "#F87171", isLive: false },

  // ── Languages ─────────────────────────────────────────────────────────────
  { id: "french",               name: "French",                                    icon: "◐",  color: "#EC4899", isLive: false },
  { id: "ghanaian_language",    name: "Ghanaian Language",                         icon: "⚹",  color: "#84CC16", isLive: false },
  { id: "arabic",               name: "Arabic",                                    icon: "◑",  color: "#1E40AF", isLive: false },
  { id: "spanish",              name: "Spanish",                                   icon: "◒",  color: "#B91C1C", isLive: false },

  // ── Business ─────────────────────────────────────────────────────────────
  { id: "business_management",  name: "Business Management",                       icon: "💼", color: "#60A5FA", isLive: false },
  { id: "accounting",           name: "Financial Accounting",                      icon: "📊", color: "#34D399", isLive: false },

  // ── Religious & Moral ─────────────────────────────────────────────────────
  { id: "crs",                  name: "Christian Religious Studies",               icon: "✟",  color: "#A855F7", isLive: false },
  { id: "irs",                  name: "Islamic Religious Studies",                 icon: "☪",  color: "#7C3AED", isLive: false },
  { id: "rme",                  name: "Religious and Moral Education",             icon: "◐",  color: "#9333EA", isLive: false },

  // ── Technical & Vocational ────────────────────────────────────────────────
  { id: "agriculture",          name: "Agriculture",                               icon: "◇",  color: "#16A34A", isLive: false },
  { id: "food_nutrition",       name: "Food and Nutrition",                        icon: "◯",  color: "#DC2626", isLive: false },
  { id: "clothing_textiles",    name: "Clothing and Textiles",                     icon: "◊",  color: "#F97316", isLive: false },
  { id: "management_living",    name: "Management in Living",                      icon: "◓",  color: "#0F766E", isLive: false },
  { id: "building_construction",name: "Building Construction & Wood Technology",   icon: "◰",  color: "#92400E", isLive: false },
  { id: "electrical_electronic",name: "Electrical & Electronic Technology",        icon: "⚡", color: "#FACC15", isLive: false },
  { id: "automobile_metal",     name: "Automobile and Metal Technology",           icon: "◯",  color: "#64748B", isLive: false },

  // ── Arts & Creative ───────────────────────────────────────────────────────
  { id: "art_design",           name: "Art & Design Foundation",                   icon: "🎨", color: "#F59E0B", isLive: false },
  { id: "art_design_studio",    name: "Art and Design Studio",                     icon: "◔",  color: "#BE185D", isLive: false },
  { id: "music",                name: "Music",                                     icon: "🎵", color: "#A78BFA", isLive: false },
  { id: "performing_arts",      name: "Performing Arts",                           icon: "🎭", color: "#60A5FA", isLive: false },
  { id: "design_tech",          name: "Design & Communication Technology",         icon: "🖥", color: "#34D399", isLive: false },

  // ── Other ────────────────────────────────────────────────────────────────
  { id: "peh_elective",         name: "PEH (Elective)",                            icon: "◌",  color: "#22C55E", isLive: false },
];

// Kept for backward compat (study homepage coming-soon cards use this)
const PROGRAMME_ELECTIVE_POOL: Record<string, SubjectOption[]> = {
  science: [
    { id: "integrated_science", name: "Integrated Science",          icon: "⚗",  color: "#34D399", isLive: true  },
    { id: "biology",            name: "Biology",                      icon: "🧬", color: "#10B981", isLive: false },
    { id: "chemistry",          name: "Chemistry",                    icon: "🧪", color: "#6EE7B7", isLive: false },
    { id: "physics",            name: "Physics",                      icon: "⚡", color: "#34D399", isLive: false },
    { id: "elective_math",      name: "Additional Mathematics",       icon: "∑",  color: "#F59E0B", isLive: false },
  ],
  general_arts: [
    { id: "integrated_science", name: "Integrated Science",           icon: "⚗",  color: "#34D399", isLive: true  },
    { id: "economics",          name: "Economics",                     icon: "📈", color: "#60A5FA", isLive: false },
    { id: "geography",          name: "Geography",                     icon: "🌍", color: "#34D399", isLive: false },
    { id: "government",         name: "Government",                    icon: "🏛", color: "#A78BFA", isLive: false },
    { id: "literature",         name: "Literature in English",         icon: "📚", color: "#F87171", isLive: false },
    { id: "history",            name: "History",                       icon: "📜", color: "#F59E0B", isLive: false },
  ],
  business: [
    { id: "integrated_science",  name: "Integrated Science",          icon: "⚗",  color: "#34D399", isLive: true  },
    { id: "business_management", name: "Business Management",          icon: "💼", color: "#60A5FA", isLive: false },
    { id: "accounting",          name: "Financial Accounting",         icon: "📊", color: "#34D399", isLive: false },
    { id: "economics",           name: "Economics",                    icon: "📈", color: "#F59E0B", isLive: false },
    { id: "elective_math",       name: "Additional Mathematics",       icon: "∑",  color: "#A78BFA", isLive: false },
  ],
  vapa: [
    { id: "integrated_science", name: "Integrated Science",           icon: "⚗",  color: "#34D399", isLive: true  },
    { id: "art_design",         name: "Art & Design Foundation",      icon: "🎨", color: "#F59E0B", isLive: false },
    { id: "music",              name: "Music",                        icon: "🎵", color: "#A78BFA", isLive: false },
    { id: "performing_arts",    name: "Performing Arts",              icon: "🎭", color: "#60A5FA", isLive: false },
    { id: "design_tech",        name: "Design & Communication Technology", icon: "🖥", color: "#34D399", isLive: false },
  ],
};

const DEFAULT_ELECTIVE_POOL: SubjectOption[] = [
  { id: "integrated_science", name: "Integrated Science", icon: "⚗", color: "#34D399", isLive: true },
];

export function getElectivesForProgramme(programmeId: string | null): SubjectOption[] {
  if (!programmeId) return DEFAULT_ELECTIVE_POOL;
  return PROGRAMME_ELECTIVE_POOL[programmeId] ?? DEFAULT_ELECTIVE_POOL;
}

// Lookup helper: find display info for any subject by ID
export function getSubjectInfo(subjectId: string): SubjectOption | undefined {
  return ALL_ELECTIVE_SUBJECTS.find((s) => s.id === subjectId);
}

// All possible subject IDs
export const ALL_SUBJECT_IDS = [
  "core_math", "english", "social_studies",
  ...ALL_ELECTIVE_SUBJECTS.map((s) => s.id),
] as const;
