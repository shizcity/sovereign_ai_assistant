/**
 * Gamification Engine
 * Handles XP awards, daily streaks, and achievement unlocks.
 * All functions are fire-and-forget safe — they never throw to callers.
 */
import { getDb } from "./db";
import { xpLedger, userStreaks, userAchievements } from "../drizzle/schema";
import { eq, sum, count } from "drizzle-orm";

// ─────────────────────────────────────────────
// XP ACTION DEFINITIONS
// ─────────────────────────────────────────────
export const XP_ACTIONS = {
  message_sent: 5,
  voice_message: 15,
  memory_saved: 20,
  round_table_completed: 100,
  custom_sentinel_created: 75,
  template_used: 10,
  template_created: 50,
  streak_day: 25,         // bonus per streak day maintained
  streak_7: 100,          // bonus at 7-day streak
  streak_30: 500,         // bonus at 30-day streak
  first_login: 50,
} as const;

export type XpAction = keyof typeof XP_ACTIONS;

// ─────────────────────────────────────────────
// LEVEL SYSTEM
// ─────────────────────────────────────────────
export const LEVELS = [
  { level: 1, title: "Initiate",       minXp: 0 },
  { level: 2, title: "Seeker",         minXp: 100 },
  { level: 3, title: "Apprentice",     minXp: 300 },
  { level: 4, title: "Adept",          minXp: 600 },
  { level: 5, title: "Practitioner",   minXp: 1000 },
  { level: 6, title: "Specialist",     minXp: 1500 },
  { level: 7, title: "Expert",         minXp: 2200 },
  { level: 8, title: "Architect",      minXp: 3000 },
  { level: 9, title: "Sovereign",      minXp: 4000 },
  { level: 10, title: "Luminary",      minXp: 5500 },
];

export function getLevelFromXp(totalXp: number) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXp >= lvl.minXp) current = lvl;
    else break;
  }
  const nextLevel = LEVELS.find(l => l.level === current.level + 1);
  const xpForNext = nextLevel ? nextLevel.minXp - totalXp : 0;
  const progressPct = nextLevel
    ? Math.round(((totalXp - current.minXp) / (nextLevel.minXp - current.minXp)) * 100)
    : 100;
  return { ...current, nextLevel, xpForNext, progressPct };
}

// ─────────────────────────────────────────────
// ACHIEVEMENT DEFINITIONS
// ─────────────────────────────────────────────
export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  emoji: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  xpReward: number;
  check: (stats: UserStats) => boolean;
}

export interface UserStats {
  totalMessages: number;
  totalVoiceMessages: number;
  totalMemories: number;
  totalRoundTables: number;
  totalCustomSentinels: number;
  totalTemplatesUsed: number;
  totalTemplatesCreated: number;
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  totalReferrals: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // First steps
  { id: "first_message",        title: "First Words",          description: "Send your first message",                emoji: "💬", tier: "bronze",   xpReward: 50,  check: s => s.totalMessages >= 1 },
  { id: "first_voice",          title: "Speak Up",             description: "Use voice mode for the first time",      emoji: "🎙️", tier: "bronze",   xpReward: 75,  check: s => s.totalVoiceMessages >= 1 },
  { id: "first_memory",         title: "Remember Me",          description: "Save your first memory",                 emoji: "🧠", tier: "bronze",   xpReward: 75,  check: s => s.totalMemories >= 1 },
  { id: "first_round_table",    title: "Convene the Council",  description: "Complete your first Round Table",        emoji: "⚡", tier: "silver",   xpReward: 150, check: s => s.totalRoundTables >= 1 },
  { id: "first_custom_sentinel",title: "Architect",            description: "Build your first custom Sentinel",       emoji: "🔧", tier: "silver",   xpReward: 150, check: s => s.totalCustomSentinels >= 1 },
  // Message milestones
  { id: "messages_10",          title: "Getting Started",      description: "Send 10 messages",                       emoji: "🌱", tier: "bronze",   xpReward: 50,  check: s => s.totalMessages >= 10 },
  { id: "messages_50",          title: "Conversationalist",    description: "Send 50 messages",                       emoji: "🗣️", tier: "bronze",   xpReward: 100, check: s => s.totalMessages >= 50 },
  { id: "messages_100",         title: "Deep Thinker",         description: "Send 100 messages",                      emoji: "💡", tier: "silver",   xpReward: 200, check: s => s.totalMessages >= 100 },
  { id: "messages_500",         title: "Philosopher",          description: "Send 500 messages",                      emoji: "🔮", tier: "gold",     xpReward: 500, check: s => s.totalMessages >= 500 },
  // Voice milestones
  { id: "voice_10",             title: "Voice of Reason",      description: "Send 10 voice messages",                 emoji: "🎵", tier: "silver",   xpReward: 150, check: s => s.totalVoiceMessages >= 10 },
  // Memory milestones
  { id: "memories_10",          title: "Archivist",            description: "Save 10 memories",                       emoji: "📚", tier: "silver",   xpReward: 150, check: s => s.totalMemories >= 10 },
  { id: "memories_50",          title: "Memory Keeper",        description: "Save 50 memories",                       emoji: "🗄️", tier: "gold",     xpReward: 300, check: s => s.totalMemories >= 50 },
  // Round Table milestones
  { id: "round_tables_5",       title: "Council Regular",      description: "Complete 5 Round Tables",                emoji: "🏛️", tier: "silver",   xpReward: 200, check: s => s.totalRoundTables >= 5 },
  { id: "round_tables_25",      title: "Grand Deliberator",    description: "Complete 25 Round Tables",               emoji: "👑", tier: "gold",     xpReward: 500, check: s => s.totalRoundTables >= 25 },
  // Streak milestones
  { id: "streak_3",             title: "Consistent",           description: "Maintain a 3-day streak",                emoji: "🔥", tier: "bronze",   xpReward: 75,  check: s => s.longestStreak >= 3 },
  { id: "streak_7",             title: "Week Warrior",         description: "Maintain a 7-day streak",                emoji: "⚡", tier: "silver",   xpReward: 150, check: s => s.longestStreak >= 7 },
  { id: "streak_30",            title: "Unstoppable",          description: "Maintain a 30-day streak",               emoji: "🌟", tier: "gold",     xpReward: 500, check: s => s.longestStreak >= 30 },
  // XP milestones
  { id: "xp_1000",              title: "Rising Force",         description: "Earn 1,000 total XP",                    emoji: "✨", tier: "bronze",   xpReward: 100, check: s => s.totalXp >= 1000 },
  { id: "xp_5000",              title: "Power User",           description: "Earn 5,000 total XP",                    emoji: "💎", tier: "silver",   xpReward: 250, check: s => s.totalXp >= 5000 },
  { id: "xp_10000",             title: "Sovereign Mind",       description: "Earn 10,000 total XP",                   emoji: "🏆", tier: "platinum", xpReward: 1000, check: s => s.totalXp >= 10000 },
  // Template milestones
  { id: "template_creator",     title: "Template Artisan",     description: "Create your first template",             emoji: "🎨", tier: "bronze",   xpReward: 75,  check: s => s.totalTemplatesCreated >= 1 },
  { id: "templates_used_10",    title: "Workflow Master",      description: "Use templates 10 times",                 emoji: "⚙️", tier: "silver",   xpReward: 150, check: s => s.totalTemplatesUsed >= 10 },
  // Referral milestones
  { id: "referral_first",       title: "First Invite",         description: "Successfully invite your first friend",  emoji: "🤝", tier: "bronze",   xpReward: 100, check: s => s.totalReferrals >= 1 },
  { id: "referral_5",           title: "Community Builder",    description: "Invite 5 friends to Glow",               emoji: "🌐", tier: "silver",   xpReward: 300, check: s => s.totalReferrals >= 5 },
  { id: "referral_10",          title: "Growth Champion",      description: "Invite 10 friends to Glow",              emoji: "🚀", tier: "gold",     xpReward: 750, check: s => s.totalReferrals >= 10 },
];

// ─────────────────────────────────────────────
// CORE ENGINE FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Award XP to a user for a specific action.
 * Returns newly unlocked achievements (if any).
 */
export async function awardXp(
  userId: number,
  action: XpAction,
  metadata?: Record<string, unknown>
): Promise<{ xpAwarded: number; newAchievements: AchievementDef[] }> {
  try {
    const db = await getDb();
    if (!db) return { xpAwarded: 0, newAchievements: [] };
    const xpAmount = XP_ACTIONS[action];

    // Record XP event
    await db.insert(xpLedger).values({
      userId,
      action,
      xpAwarded: xpAmount,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    // Update streak
    await updateStreak(userId);

    // Check for newly unlocked achievements
    const newAchievements = await checkAndUnlockAchievements(userId);

    return { xpAwarded: xpAmount, newAchievements };
  } catch (err) {
    console.error("[Gamification] awardXp error:", err);
    return { xpAwarded: 0, newAchievements: [] };
  }
}

/**
 * Update the user's daily streak.
 */
async function updateStreak(userId: number): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const existing = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      // First activity ever
      await db.insert(userStreaks).values({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
        updatedAt: new Date(),
      });
      // Award streak day XP
      await db.insert(xpLedger).values({ userId, action: "streak_day", xpAwarded: XP_ACTIONS.streak_day });
      return;
    }

    const streak = existing[0];
    const last = streak.lastActiveDate;

    if (last === today) return; // Already active today, no update needed

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let newStreak = last === yesterdayStr ? streak.currentStreak + 1 : 1;
    const newLongest = Math.max(newStreak, streak.longestStreak);

    await db
      .update(userStreaks)
      .set({ currentStreak: newStreak, longestStreak: newLongest, lastActiveDate: today, updatedAt: new Date() })
      .where(eq(userStreaks.userId, userId));

    // Award streak day XP
    await db.insert(xpLedger).values({ userId, action: "streak_day", xpAwarded: XP_ACTIONS.streak_day });

    // Award streak milestone bonuses
    if (newStreak === 7) {
      await db.insert(xpLedger).values({ userId, action: "streak_7", xpAwarded: XP_ACTIONS.streak_7 });
    }
    if (newStreak === 30) {
      await db.insert(xpLedger).values({ userId, action: "streak_30", xpAwarded: XP_ACTIONS.streak_30 });
    }
  } catch (err) {
    console.error("[Gamification] updateStreak error:", err);
  }
}

/**
 * Check all achievements and unlock any newly earned ones.
 * Returns array of newly unlocked achievements.
 */
async function checkAndUnlockAchievements(userId: number): Promise<AchievementDef[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const stats = await getUserStats(userId);
    const alreadyUnlocked = await db
      .select({ achievementId: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
    const unlockedIds = new Set(alreadyUnlocked.map(a => a.achievementId));

    const newlyUnlocked: AchievementDef[] = [];
    for (const achievement of ACHIEVEMENTS) {
      if (!unlockedIds.has(achievement.id) && achievement.check(stats)) {
        await db.insert(userAchievements).values({ userId, achievementId: achievement.id });
        // Award XP for the achievement itself
        await db.insert(xpLedger).values({
          userId,
          action: "achievement_unlocked" as XpAction,
          xpAwarded: achievement.xpReward,
          metadata: JSON.stringify({ achievementId: achievement.id }),
        });
        newlyUnlocked.push(achievement);
      }
    }
    return newlyUnlocked;
  } catch (err) {
    console.error("[Gamification] checkAndUnlockAchievements error:", err);
    return [];
  }
}

/**
 * Get aggregated stats for a user (used for achievement checks).
 */
export async function getUserStats(userId: number): Promise<UserStats> {
  try {
    const db = await getDb();
    if (!db) throw new Error('DB unavailable');
    // Total XP
    const xpResult = await db
      .select({ total: sum(xpLedger.xpAwarded) })
      .from(xpLedger)
      .where(eq(xpLedger.userId, userId));
    const totalXp = Number(xpResult[0]?.total ?? 0);

    // Action counts
    const actionCounts = await db
      .select({ action: xpLedger.action, cnt: count() })
      .from(xpLedger)
      .where(eq(xpLedger.userId, userId))
      .groupBy(xpLedger.action);

    const countMap: Record<string, number> = {};
    for (const row of actionCounts) {
      countMap[row.action] = Number(row.cnt);
    }

    // Streak
    const streakResult = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId))
      .limit(1);
    const streak = streakResult[0];

    // Referral count (claimed referrals where this user is the referrer)
    const { referrals: referralsTable } = await import("../drizzle/schema");
    const { isNotNull, and: drizzleAnd } = await import("drizzle-orm");
    const [refResult] = await db
      .select({ cnt: count() })
      .from(referralsTable)
      .where(drizzleAnd(eq(referralsTable.referrerId, userId), isNotNull(referralsTable.claimedAt)));
    const totalReferrals = Number(refResult?.cnt ?? 0);

    return {
      totalMessages: countMap["message_sent"] ?? 0,
      totalVoiceMessages: countMap["voice_message"] ?? 0,
      totalMemories: countMap["memory_saved"] ?? 0,
      totalRoundTables: countMap["round_table_completed"] ?? 0,
      totalCustomSentinels: countMap["custom_sentinel_created"] ?? 0,
      totalTemplatesUsed: countMap["template_used"] ?? 0,
      totalTemplatesCreated: countMap["template_created"] ?? 0,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      totalXp,
      totalReferrals,
    };
  } catch (err) {
    console.error("[Gamification] getUserStats error:", err);
    return {
      totalMessages: 0, totalVoiceMessages: 0, totalMemories: 0,
      totalRoundTables: 0, totalCustomSentinels: 0, totalTemplatesUsed: 0,
      totalTemplatesCreated: 0, currentStreak: 0, longestStreak: 0, totalXp: 0,
      totalReferrals: 0,
    };
  }
}

/**
 * Check and unlock referral-specific achievements for a user.
 * Called after a successful referral claim to give the referrer their milestone badges.
 * Returns newly unlocked achievements.
 */
export async function checkReferralAchievements(userId: number): Promise<AchievementDef[]> {
  return checkAndUnlockAchievements(userId);
}

/**
 * Get the full gamification profile for a user.
 */
export async function getGamificationProfile(userId: number) {
  const db = await getDb();
  if (!db) return { stats: await getUserStats(userId), level: getLevelFromXp(0), achievements: [] };
  const stats = await getUserStats(userId);
  const level = getLevelFromXp(stats.totalXp);

  const unlockedRows = await db
    .select({ achievementId: userAchievements.achievementId, unlockedAt: userAchievements.unlockedAt })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  const unlockedMap = new Map(unlockedRows.map((r: { achievementId: string; unlockedAt: Date }) => [r.achievementId, r.unlockedAt]));

  const achievements = ACHIEVEMENTS.map((a: AchievementDef) => ({
    ...a,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id) ?? null,
  }));

  return { stats, level, achievements };
}
