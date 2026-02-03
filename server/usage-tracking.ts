import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";
import { getMessageLimit } from "./products";

/**
 * Check if user has exceeded their monthly message limit
 * Returns true if user can send messages, false if limit exceeded
 */
export async function checkMessageLimit(userId: number): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  // Get user's subscription tier
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  const tier = user.subscriptionTier || "free";
  const limit = getMessageLimit(tier);

  // Unlimited for pro tier
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  // Count messages sent this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Query messages table to count user's messages this month
  // Need to join with conversations to filter by userId
  const { messages, conversations } = await import("../drizzle/schema");
  const { count } = await import("drizzle-orm");
  
  const result = await db
    .select({ count: count() })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.userId, userId),
        eq(messages.role, "user"),
        gte(messages.createdAt, startOfMonth)
      )
    );

  const messageCount = result[0]?.count || 0;
  const remaining = Math.max(0, limit - messageCount);
  const allowed = messageCount < limit;

  return { allowed, remaining, limit };
}

/**
 * Get current usage stats for a user
 */
export async function getUsageStats(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  const tier = user.subscriptionTier || "free";
  const limit = getMessageLimit(tier);

  // Count messages this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { messages, conversations } = await import("../drizzle/schema");
  const { count } = await import("drizzle-orm");
  
  const result = await db
    .select({ count: count() })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.userId, userId),
        eq(messages.role, "user"),
        gte(messages.createdAt, startOfMonth)
      )
    );

  const used = result[0]?.count || 0;
  const remaining = limit === -1 ? -1 : Math.max(0, limit - used);

  const resetDate = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1);
  const now = new Date();
  const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    tier,
    limit,
    used,
    remaining,
    resetDate,
    daysUntilReset,
  };
}

/**
 * Get warning state based on usage percentage
 * Returns warning level and metadata for UI display
 */
export async function getWarningState(userId: number): Promise<{
  level: 'none' | 'soft' | 'urgent' | 'blocked';
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}> {
  const stats = await getUsageStats(userId);
  
  // Pro users never see warnings
  if (stats.limit === -1) {
    return {
      level: 'none',
      used: stats.used,
      limit: -1,
      remaining: -1,
      percentage: 0,
    };
  }
  
  const percentage = stats.limit > 0 ? (stats.used / stats.limit) * 100 : 0;
  
  let level: 'none' | 'soft' | 'urgent' | 'blocked';
  
  if (stats.used >= stats.limit) {
    level = 'blocked'; // 100% - cannot send messages
  } else if (percentage >= 96) {
    level = 'urgent'; // 96%+ - modal warning (48/50)
  } else if (percentage >= 80) {
    level = 'soft'; // 80%+ - dismissible banner (40/50)
  } else {
    level = 'none'; // Below 80% - no warning
  }
  
  return {
    level,
    used: stats.used,
    limit: stats.limit,
    remaining: stats.remaining,
    percentage: Math.round(percentage),
  };
}
