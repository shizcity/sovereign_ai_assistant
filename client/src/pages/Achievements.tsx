import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Trophy, Flame, Zap, Star, Lock } from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  bronze: "from-amber-700 to-amber-500",
  silver: "from-slate-400 to-slate-300",
  gold: "from-yellow-500 to-yellow-300",
  platinum: "from-cyan-400 to-indigo-400",
};

const TIER_BORDER: Record<string, string> = {
  bronze: "border-amber-600/40",
  silver: "border-slate-400/40",
  gold: "border-yellow-400/40",
  platinum: "border-cyan-400/40",
};

const TIER_GLOW: Record<string, string> = {
  bronze: "shadow-amber-600/20",
  silver: "shadow-slate-400/20",
  gold: "shadow-yellow-400/30",
  platinum: "shadow-cyan-400/40",
};

export default function Achievements() {
  const { data: progress, isLoading: progressLoading } = trpc.gamification.getProgress.useQuery();
  const { data: achievements, isLoading: achievementsLoading } = trpc.gamification.getAchievements.useQuery();

  const unlockedCount = achievements?.filter((a) => a.unlocked).length ?? 0;
  const totalCount = achievements?.length ?? 0;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0a0b14] text-white px-4 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          </div>
          <p className="text-slate-400 text-sm ml-13">
            Track your progress and earn badges as you explore Glow.
          </p>
        </div>

        {/* Progress Card */}
        {progressLoading ? (
          <div className="h-40 rounded-2xl bg-white/5 animate-pulse mb-8" />
        ) : progress ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Level Badge */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/30">
                <span className="text-3xl font-black">{progress.level}</span>
                <span className="text-xs font-semibold tracking-widest uppercase text-white/80 mt-1">
                  {progress.levelTitle}
                </span>
              </div>

              {/* XP + Streak */}
              <div className="flex-1 space-y-4">
                {/* XP Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-300">
                      <Zap className="inline w-3.5 h-3.5 mr-1 text-cyan-400" />
                      {progress.xp.toLocaleString()} XP
                    </span>
                    <span className="text-xs text-slate-500">
                      Next level: {progress.nextLevelXp.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700"
                      style={{ width: `${Math.min(progress.progressPct, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{progress.progressPct}% to level {progress.level + 1}</div>
                </div>

                {/* Streak + Achievements count */}
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <div>
                      <div className="text-lg font-bold leading-none">{progress.streak}</div>
                      <div className="text-xs text-slate-500">day streak</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <div>
                      <div className="text-lg font-bold leading-none">{progress.longestStreak}</div>
                      <div className="text-xs text-slate-500">best streak</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-lg font-bold leading-none">{unlockedCount}/{totalCount}</div>
                      <div className="text-xs text-slate-500">badges</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Stats Grid */}
        {progress?.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Messages", value: progress.stats.totalMessages, icon: "💬" },
              { label: "Memories", value: progress.stats.totalMemories, icon: "🧠" },
              { label: "Round Tables", value: progress.stats.totalRoundTables, icon: "⚡" },
              { label: "Custom Sentinels", value: progress.stats.totalCustomSentinels, icon: "🔧" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-center"
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-xl font-bold">{stat.value.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Achievements Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-slate-200">Badges</h2>
          {achievementsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-36 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {achievements?.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`relative rounded-xl border p-4 flex flex-col items-center text-center transition-all duration-200 ${
                    achievement.unlocked
                      ? `${TIER_BORDER[achievement.tier]} bg-white/5 shadow-lg ${TIER_GLOW[achievement.tier]}`
                      : "border-white/5 bg-white/[0.02] opacity-50 grayscale"
                  }`}
                >
                  {/* Tier accent bar */}
                  {achievement.unlocked && (
                    <div
                      className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r ${TIER_COLORS[achievement.tier]}`}
                    />
                  )}

                  {/* Lock overlay */}
                  {!achievement.unlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-3 h-3 text-slate-600" />
                    </div>
                  )}

                  <div className="text-3xl mb-2 mt-1">{achievement.emoji}</div>
                  <div className="text-sm font-semibold text-white leading-tight mb-1">
                    {achievement.title}
                  </div>
                  <div className="text-xs text-slate-500 leading-snug mb-2">
                    {achievement.description}
                  </div>

                  {/* Tier badge */}
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r ${TIER_COLORS[achievement.tier]} text-white`}
                  >
                    {achievement.tier}
                  </div>

                  {/* XP reward */}
                  <div className="text-xs text-cyan-400 mt-1.5 font-medium">
                    +{achievement.xpReward} XP
                  </div>

                  {/* Unlocked date */}
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="text-[10px] text-slate-600 mt-1">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
