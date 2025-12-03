import { getDb } from "./db";
import { sentinelMemoryEntries, sentinels } from "../drizzle/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

export interface TimelineDataPoint {
  date: string;
  count: number;
  category: string;
  memories: Array<{
    id: number;
    content: string;
    sentinelName: string;
    importance: number;
  }>;
}

export interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
  avgImportance: number;
  totalImportance: number;
}

export interface SentinelStats {
  sentinelId: number;
  sentinelName: string;
  symbolEmoji: string;
  memoryCount: number;
  categories: Record<string, number>;
  avgImportance: number;
  topTags: string[];
}

export interface EvolutionPath {
  topic: string;
  memories: Array<{
    id: number;
    category: string;
    content: string;
    createdAt: Date;
    importance: number;
    sentinelName: string;
  }>;
  progression: {
    hasIdea: boolean;
    hasGoal: boolean;
    hasMilestone: boolean;
    hasAchievement: boolean;
  };
}

export interface TrendInsight {
  type: "pattern" | "preference" | "collaboration" | "progress";
  title: string;
  description: string;
  confidence: number;
  data: any;
}

/**
 * Get timeline data for memory visualization
 */
export async function getMemoryTimeline(
  userId: number,
  startDate?: Date,
  endDate?: Date,
  granularity: "day" | "week" | "month" = "day"
): Promise<TimelineDataPoint[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Build where conditions
  const conditions = [eq(sentinelMemoryEntries.userId, userId)];
  if (startDate) {
    conditions.push(gte(sentinelMemoryEntries.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(sentinelMemoryEntries.createdAt, endDate));
  }

  const memories = await db
    .select({
      id: sentinelMemoryEntries.id,
      content: sentinelMemoryEntries.content,
      category: sentinelMemoryEntries.category,
      importance: sentinelMemoryEntries.importance,
      createdAt: sentinelMemoryEntries.createdAt,
      sentinelName: sentinels.name,
    })
    .from(sentinelMemoryEntries)
    .leftJoin(sentinels, eq(sentinelMemoryEntries.sentinelId, sentinels.id))
    .where(and(...conditions))
    .orderBy(desc(sentinelMemoryEntries.createdAt));

  // Group by date and category
  const grouped = memories.reduce((acc, memory) => {
    const date = new Date(memory.createdAt);
    let dateKey: string;

    if (granularity === "day") {
      dateKey = date.toISOString().split("T")[0];
    } else if (granularity === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      dateKey = weekStart.toISOString().split("T")[0];
    } else {
      dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    const key = `${dateKey}-${memory.category}`;

    if (!acc[key]) {
      acc[key] = {
        date: dateKey,
        category: memory.category,
        count: 0,
        memories: [],
      };
    }

    acc[key].count++;
    acc[key].memories.push({
      id: memory.id,
      content: memory.content,
      sentinelName: memory.sentinelName || "Unknown",
      importance: memory.importance,
    });

    return acc;
  }, {} as Record<string, TimelineDataPoint>);

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get category distribution statistics
 */
export async function getCategoryStats(
  userId: number,
  sentinelId?: number
): Promise<CategoryStats[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  let whereClause = eq(sentinelMemoryEntries.userId, userId);
  if (sentinelId) {
    whereClause = and(
      eq(sentinelMemoryEntries.userId, userId),
      eq(sentinelMemoryEntries.sentinelId, sentinelId)
    ) as any;
  }

  const memories = await db
    .select({
      category: sentinelMemoryEntries.category,
      importance: sentinelMemoryEntries.importance,
    })
    .from(sentinelMemoryEntries)
    .where(whereClause);

  const total = memories.length;
  const categoryMap = memories.reduce((acc, memory) => {
    if (!acc[memory.category]) {
      acc[memory.category] = {
        count: 0,
        totalImportance: 0,
      };
    }
    acc[memory.category].count++;
    acc[memory.category].totalImportance += memory.importance;
    return acc;
  }, {} as Record<string, { count: number; totalImportance: number }>);

  return Object.entries(categoryMap).map(([category, data]) => ({
    category,
    count: data.count,
    percentage: (data.count / total) * 100,
    avgImportance: data.totalImportance / data.count,
    totalImportance: data.totalImportance,
  })).sort((a, b) => b.count - a.count);
}

/**
 * Get Sentinel collaboration statistics
 */
export async function getSentinelCollaborationStats(
  userId: number
): Promise<SentinelStats[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const memories = await db
    .select({
      sentinelId: sentinelMemoryEntries.sentinelId,
      sentinelName: sentinels.name,
      symbolEmoji: sentinels.symbolEmoji,
      category: sentinelMemoryEntries.category,
      importance: sentinelMemoryEntries.importance,
      tags: sentinelMemoryEntries.tags,
    })
    .from(sentinelMemoryEntries)
    .leftJoin(sentinels, eq(sentinelMemoryEntries.sentinelId, sentinels.id))
    .where(eq(sentinelMemoryEntries.userId, userId));

  const sentinelMap = memories.reduce((acc, memory) => {
    const id = memory.sentinelId;
    if (!acc[id]) {
      acc[id] = {
        sentinelId: id,
        sentinelName: memory.sentinelName || "Unknown",
        symbolEmoji: memory.symbolEmoji || "🤖",
        memoryCount: 0,
        categories: {},
        totalImportance: 0,
        allTags: [] as string[],
      };
    }

    acc[id].memoryCount++;
    acc[id].totalImportance += memory.importance;
    acc[id].categories[memory.category] = (acc[id].categories[memory.category] || 0) + 1;
    if (memory.tags && Array.isArray(memory.tags)) {
      acc[id].allTags.push(...memory.tags);
    }

    return acc;
  }, {} as Record<number, any>);

  return Object.values(sentinelMap).map((sentinel) => {
    // Count tag frequency
    const tagCounts = sentinel.allTags.reduce((acc: Record<string, number>, tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([tag]) => tag);

    return {
      sentinelId: sentinel.sentinelId,
      sentinelName: sentinel.sentinelName,
      symbolEmoji: sentinel.symbolEmoji,
      memoryCount: sentinel.memoryCount,
      categories: sentinel.categories,
      avgImportance: sentinel.totalImportance / sentinel.memoryCount,
      topTags,
    };
  }).sort((a, b) => b.memoryCount - a.memoryCount);
}

/**
 * Track evolution of goals and topics
 */
export async function getEvolutionPaths(
  userId: number,
  minMemories: number = 2
): Promise<EvolutionPath[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const memories = await db
    .select({
      id: sentinelMemoryEntries.id,
      category: sentinelMemoryEntries.category,
      content: sentinelMemoryEntries.content,
      tags: sentinelMemoryEntries.tags,
      importance: sentinelMemoryEntries.importance,
      createdAt: sentinelMemoryEntries.createdAt,
      sentinelName: sentinels.name,
    })
    .from(sentinelMemoryEntries)
    .leftJoin(sentinels, eq(sentinelMemoryEntries.sentinelId, sentinels.id))
    .where(eq(sentinelMemoryEntries.userId, userId))
    .orderBy(sentinelMemoryEntries.createdAt);

  // Group by tags to find related memories
  const tagGroups = memories.reduce((acc, memory) => {
    const tags = memory.tags && Array.isArray(memory.tags) ? memory.tags : [];
    tags.forEach((tag: string) => {
      if (!acc[tag]) {
        acc[tag] = [];
      }
      acc[tag].push(memory);
    });
    return acc;
  }, {} as Record<string, typeof memories>);

  // Create evolution paths for tags with multiple memories
  const paths: EvolutionPath[] = [];

  for (const [tag, tagMemories] of Object.entries(tagGroups)) {
    if (tagMemories.length >= minMemories) {
      const categories = new Set(tagMemories.map((m) => m.category));

      paths.push({
        topic: tag,
        memories: tagMemories.map((m) => ({
          id: m.id,
          category: m.category,
          content: m.content,
          createdAt: m.createdAt,
          importance: m.importance,
          sentinelName: m.sentinelName || "Unknown",
        })),
        progression: {
          hasIdea: categories.has("insight") || categories.has("preference"),
          hasGoal: categories.has("goal"),
          hasMilestone: categories.has("milestone"),
          hasAchievement: categories.has("achievement"),
        },
      });
    }
  }

  return paths.sort((a, b) => b.memories.length - a.memories.length);
}

/**
 * Generate trend insights from memory data
 */
export async function generateTrendInsights(
  userId: number
): Promise<TrendInsight[]> {
  const insights: TrendInsight[] = [];

  const [categoryStats, sentinelStats, evolutionPaths] = await Promise.all([
    getCategoryStats(userId),
    getSentinelCollaborationStats(userId),
    getEvolutionPaths(userId),
  ]);

  // Insight 1: Most common memory category
  if (categoryStats.length > 0) {
    const topCategory = categoryStats[0];
    insights.push({
      type: "pattern",
      title: `${topCategory.category.charAt(0).toUpperCase() + topCategory.category.slice(1)}s Drive Your Growth`,
      description: `${topCategory.percentage.toFixed(0)}% of your memories are ${topCategory.category}s, showing a strong focus on ${topCategory.category === "insight" ? "understanding and learning" : topCategory.category === "goal" ? "setting and achieving objectives" : topCategory.category === "decision" ? "making thoughtful choices" : "tracking progress"}.`,
      confidence: Math.min(topCategory.percentage / 100, 1),
      data: { category: topCategory.category, count: topCategory.count },
    });
  }

  // Insight 2: Most collaborative Sentinel
  if (sentinelStats.length > 0) {
    const topSentinel = sentinelStats[0];
    insights.push({
      type: "collaboration",
      title: `${topSentinel.sentinelName} Is Your Primary Guide`,
      description: `You've built ${topSentinel.memoryCount} memories with ${topSentinel.sentinelName}, making them your most trusted collaborator. Top areas: ${Object.entries(topSentinel.categories).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 2).map(([cat]) => cat).join(", ")}.`,
      confidence: topSentinel.memoryCount / (sentinelStats.reduce((sum, s) => sum + s.memoryCount, 0)),
      data: { sentinel: topSentinel.sentinelName, memoryCount: topSentinel.memoryCount },
    });
  }

  // Insight 3: Goal progression
  const goalsWithProgress = evolutionPaths.filter((p) => p.progression.hasGoal);
  const achievedGoals = goalsWithProgress.filter((p) => p.progression.hasAchievement);
  
  if (goalsWithProgress.length > 0) {
    const progressRate = (achievedGoals.length / goalsWithProgress.length) * 100;
    insights.push({
      type: "progress",
      title: `${achievedGoals.length} of ${goalsWithProgress.length} Goals Achieved`,
      description: `You're making tangible progress! ${progressRate.toFixed(0)}% of your tracked goals have reached achievement status. ${goalsWithProgress.length - achievedGoals.length} goals are still in progress.`,
      confidence: Math.min(goalsWithProgress.length / 5, 1),
      data: { total: goalsWithProgress.length, achieved: achievedGoals.length },
    });
  }

  // Insight 4: Preference patterns
  const preferences = categoryStats.find((c) => c.category === "preference");
  if (preferences && preferences.count >= 3) {
    insights.push({
      type: "preference",
      title: "Your Preferences Are Taking Shape",
      description: `You've documented ${preferences.count} preferences, helping Sentinels understand your style and approach. This creates more personalized guidance over time.`,
      confidence: Math.min(preferences.count / 10, 1),
      data: { count: preferences.count },
    });
  }

  return insights.sort((a, b) => b.confidence - a.confidence);
}
