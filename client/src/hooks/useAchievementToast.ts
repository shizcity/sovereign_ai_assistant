import { toast } from "sonner";

export interface AchievementUnlock {
  id: string;
  title: string;
  emoji: string;
  tier: string;
}

const TIER_COLORS: Record<string, string> = {
  bronze: "#b45309",
  silver: "#94a3b8",
  gold: "#d97706",
  platinum: "#22d3ee",
};

/**
 * Show a toast for each newly unlocked achievement.
 * Call this inside any mutation's onSuccess handler.
 */
export function showAchievementToasts(achievements: AchievementUnlock[] | undefined) {
  if (!achievements || achievements.length === 0) return;
  // Stagger toasts slightly so they don't all fire at once
  achievements.forEach((a, i) => {
    setTimeout(() => {
      toast(`${a.emoji} Achievement unlocked!`, {
        description: a.title,
        duration: 5000,
        style: {
          background: "#0f172a",
          border: `1px solid ${TIER_COLORS[a.tier] ?? "#6366f1"}40`,
          color: "#f1f5f9",
        },
      });
    }, i * 600);
  });
}
