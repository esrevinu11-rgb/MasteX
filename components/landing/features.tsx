import { Brain, BookOpen, Trophy, BarChart3, Layers, Smartphone } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Spaced Repetition",
    description:
      "Science-backed review schedule. Topics come back at 1, 3, 7, and 21 days — just when you're about to forget them. No cramming needed.",
    color: "#A78BFA",
  },
  {
    icon: BookOpen,
    title: "Real WAEC Questions",
    description:
      "Every question is WAEC-aligned and tagged by cognitive level (L1, L2, L3). Practice exactly what the exam will test.",
    color: "#F59E0B",
  },
  {
    icon: Trophy,
    title: "Weekly Quests",
    description:
      "New quests every Monday. Write real answers graded by AI across 3 cognitive levels. Earn up to 120 XP per quest.",
    color: "#34D399",
  },
  {
    icon: BarChart3,
    title: "National Rankings",
    description:
      "Compete nationally with a live rank from F3 to S. Rankings update every 24 hours across all subjects and year groups.",
    color: "#60A5FA",
  },
  {
    icon: Layers,
    title: "6 Question Frames",
    description:
      "Every topic tested 6 ways: Definition, Fill-in-the-blank, Application, Data interpretation, Comparison, and Evaluation.",
    color: "#F87171",
  },
  {
    icon: Smartphone,
    title: "Mobile-First",
    description:
      "Designed for your phone first. Study anywhere, track your streak, and climb the rankings between classes.",
    color: "#FBBF24",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Everything you need to{" "}
            <span className="text-[#F59E0B]">ace WAEC</span>
          </h2>
          <p className="text-[#9CA3AF] text-lg max-w-xl mx-auto">
            No more re-reading the same notes. MasteX uses the same methods top
            students use — systematically.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-[#1A1916] border border-[#2E2C28] rounded-2xl p-6 hover:border-[#3E3C38] transition-all duration-200 group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${feature.color}20` }}
              >
                <feature.icon
                  size={22}
                  style={{ color: feature.color }}
                />
              </div>
              <h3 className="text-base font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
