import { getRankInfo, ALL_RANKS } from "@/lib/ranking";
import { RankBadge } from "@/components/ui/rank-badge";

const mockLeaderboard = [
  { name: "Kwesi Boateng", school: "Presbyterian Boys' SHS", xp: 18450, rank: "S", pos: 1, year: 2 },
  { name: "Kweku Mensah", school: "Achimota School", xp: 17820, rank: "A1", pos: 2, year: 3 },
  { name: "Abena Osei", school: "Wesley Girls' SHS", xp: 16990, rank: "A1", pos: 3, year: 2 },
  { name: "Kofi Darko", school: "Prempeh College", xp: 15700, rank: "A2", pos: 4, year: 3 },
  { name: "Adjoa Asante", school: "GISS", xp: 14850, rank: "A2", pos: 5, year: 1 },
];

export function RankShowcase() {
  return (
    <section id="ranks" className="py-24 px-4 bg-[#0C0B09]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Climb the{" "}
            <span className="text-[#F59E0B]">national ranks</span>
          </h2>
          <p className="text-[#9CA3AF] text-lg max-w-xl mx-auto">
            Every student is ranked nationally. 19 tiers from F3 to S — where
            does your grind take you?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Rank ladder */}
          <div>
            <h3 className="text-sm font-semibold text-[#6B6860] uppercase tracking-widest mb-6">
              All Rank Tiers
            </h3>
            <div className="flex flex-wrap gap-2">
              {ALL_RANKS.map((rank) => {
                const info = getRankInfo(rank);
                return (
                  <div
                    key={rank}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border-2 rank-badge"
                      style={{
                        color: info.color,
                        backgroundColor: info.bgColor,
                        borderColor: info.borderColor,
                        boxShadow: rank === "S" ? `0 0 16px ${info.color}60` : undefined,
                      }}
                    >
                      {rank}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <span className="text-[#9CA3AF]">
                  <strong className="text-white">S rank</strong> — top 1% nationally
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-3 h-3 rounded-full bg-[#A78BFA]" />
                <span className="text-[#9CA3AF]">
                  <strong className="text-white">A rank</strong> — top 2–10%
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-3 h-3 rounded-full bg-[#60A5FA]" />
                <span className="text-[#9CA3AF]">
                  <strong className="text-white">B rank</strong> — top 11–25%
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-3 h-3 rounded-full bg-[#9CA3AF]" />
                <span className="text-[#9CA3AF]">
                  Ranks update every 24 hours. No XP decay.
                </span>
              </div>
            </div>
          </div>

          {/* Mock leaderboard */}
          <div>
            <h3 className="text-sm font-semibold text-[#6B6860] uppercase tracking-widest mb-6">
              National Leaderboard (Mock)
            </h3>
            <div className="space-y-3">
              {mockLeaderboard.map((student) => (
                <div
                  key={student.pos}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    student.rank === "S"
                      ? "bg-[#1A1916] border-[#F59E0B]/40 s-rank-glow"
                      : "bg-[#1A1916] border-[#2E2C28]"
                  }`}
                >
                  {/* Position */}
                  <span
                    className={`text-sm font-bold w-6 text-center ${
                      student.pos === 1
                        ? "text-[#F59E0B]"
                        : student.pos === 2
                        ? "text-[#9CA3AF]"
                        : student.pos === 3
                        ? "text-[#CD7F32]"
                        : "text-[#6B6860]"
                    }`}
                  >
                    #{student.pos}
                  </span>

                  {/* Rank badge */}
                  <RankBadge rank={student.rank} size="sm" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{student.name}</div>
                    <div className="text-xs text-[#6B6860] truncate">{student.school} · Year {student.year}</div>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#F59E0B]">
                      {student.xp.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#6B6860]">XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
