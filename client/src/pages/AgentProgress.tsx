import { useLocation } from "wouter";
import { ArrowLeft, Bot, Zap, BookOpen, Code2, MessageSquare, Trophy, Star, Target, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

// ─── XP milestones ────────────────────────────────────────────────────────────

const MILESTONES = [
  { xp: 0,   label: "Curious Mind",     color: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/20" },
  { xp: 50,  label: "Builder",          color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20" },
  { xp: 150, label: "Architect",        color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  { xp: 350, label: "Agent Engineer",   color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { xp: 700, label: "Sovereign Builder",color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
];

const METRIC_CONFIG: Record<string, { label: string; icon: React.ReactNode; xpEach: number; description: string }> = {
  agents_built:        { label: "Agents Built",        icon: <Bot className="w-4 h-4" />,            xpEach: 25, description: "Complete an agent build session with a Sentinel" },
  templates_explored:  { label: "Templates Explored",  icon: <BookOpen className="w-4 h-4" />,        xpEach: 5,  description: "Open and view a template in the library" },
  playground_runs:     { label: "Playground Runs",     icon: <Code2 className="w-4 h-4" />,           xpEach: 10, description: "Analyse code in the Code Playground" },
  debug_sessions:      { label: "Debug Sessions",      icon: <Zap className="w-4 h-4" />,             xpEach: 15, description: "Debug an agent error with a Sentinel" },
  round_table_designs: { label: "Round Table Designs", icon: <MessageSquare className="w-4 h-4" />,   xpEach: 20, description: "Run an Agent Design session in the Round Table" },
};

function xpFromProgress(progress: Record<string, number>): number {
  return Object.entries(progress).reduce((total, [key, val]) => {
    const cfg = METRIC_CONFIG[key];
    return total + (cfg ? cfg.xpEach * val : 0);
  }, 0);
}

function getCurrentMilestone(xp: number) {
  let current = MILESTONES[0];
  for (const m of MILESTONES) {
    if (xp >= m.xp) current = m;
  }
  return current;
}

function getNextMilestone(xp: number) {
  return MILESTONES.find(m => m.xp > xp) ?? null;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, xpEach, description }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  xpEach: number;
  description: string;
}) {
  return (
    <div className="p-5 rounded-2xl border border-white/10 bg-white/3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          {icon}
        </div>
        <span className="text-xs text-amber-400 font-medium">+{xpEach} XP each</span>
      </div>
      <div>
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="text-sm text-gray-400 mt-0.5">{label}</div>
        <div className="text-xs text-gray-600 mt-1">{description}</div>
      </div>
    </div>
  );
}

// ─── Achievement Badge ────────────────────────────────────────────────────────

function AchievementBadge({ milestone, isUnlocked }: { milestone: typeof MILESTONES[0]; isUnlocked: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${isUnlocked ? `${milestone.bg} ${milestone.border}` : "bg-white/2 border-white/5 opacity-40"} flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-full ${isUnlocked ? milestone.bg : "bg-white/5"} border ${isUnlocked ? milestone.border : "border-white/10"} flex items-center justify-center`}>
        <Trophy className={`w-5 h-5 ${isUnlocked ? milestone.color : "text-gray-600"}`} />
      </div>
      <div>
        <div className={`text-sm font-semibold ${isUnlocked ? "text-white" : "text-gray-600"}`}>{milestone.label}</div>
        <div className="text-xs text-gray-500">{milestone.xp} XP required</div>
      </div>
      {isUnlocked && <Star className={`w-4 h-4 ml-auto ${milestone.color}`} fill="currentColor" />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentProgress() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: progressData, isLoading } = trpc.agentProgress.getProgress.useQuery(undefined, { enabled: !!user });

  const progress: Record<string, number> = (progressData as Record<string, number> | null) ?? {};
  const totalXp = xpFromProgress(progress);
  const currentMilestone = getCurrentMilestone(totalXp);
  const nextMilestone = getNextMilestone(totalXp);
  const progressToNext = nextMilestone
    ? Math.round(((totalXp - currentMilestone.xp) / (nextMilestone.xp - currentMilestone.xp)) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-[oklch(0.08_0.012_268)] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => setLocation("/chat")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Chat
        </button>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-white">Agent Builder Progress</span>
        </div>
        <button
          onClick={() => setLocation("/agent-builder")}
          className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Bot className="w-4 h-4" /> Build Agent
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* XP Summary Card */}
        <div className={`p-8 rounded-3xl border ${currentMilestone.border} ${currentMilestone.bg} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-white to-transparent pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <Target className={`w-10 h-10 ${currentMilestone.color}`} />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Rank</div>
              <div className={`text-3xl font-bold ${currentMilestone.color}`}>{currentMilestone.label}</div>
              <div className="text-gray-400 text-sm mt-1">{totalXp} XP earned</div>

              {nextMilestone && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Progress to {nextMilestone.label}</span>
                    <span>{progressToNext}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700`}
                      style={{ width: `${progressToNext}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{nextMilestone.xp - totalXp} XP to go</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" /> Your Activity
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.keys(METRIC_CONFIG).map(k => (
                <div key={k} className="h-32 rounded-2xl bg-white/3 border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(METRIC_CONFIG).map(([key, cfg]) => (
                <StatCard
                  key={key}
                  label={cfg.label}
                  value={progress[key] ?? 0}
                  icon={cfg.icon}
                  xpEach={cfg.xpEach}
                  description={cfg.description}
                />
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Ranks & Achievements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MILESTONES.map((m) => (
              <AchievementBadge key={m.label} milestone={m} isUnlocked={totalXp >= m.xp} />
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            onClick={() => setLocation("/agent-builder")}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center gap-2"
          >
            <Bot className="w-4 h-4" /> Build an Agent
          </Button>
          <Button
            onClick={() => setLocation("/agent-templates")}
            variant="outline"
            className="bg-transparent border-white/20 text-gray-300 hover:text-white hover:bg-white/10 flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" /> Browse Templates
          </Button>
          <Button
            onClick={() => setLocation("/code-playground")}
            variant="outline"
            className="bg-transparent border-white/20 text-gray-300 hover:text-white hover:bg-white/10 flex items-center justify-center gap-2"
          >
            <Code2 className="w-4 h-4" /> Code Playground
          </Button>
        </div>

      </div>
    </div>
  );
}
