import { getDb } from "./db";
import { messageReactions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Add a reaction to a message
 */
export async function addReaction(messageId: number, userId: number, emoji: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if reaction already exists
  const existing = await db
    .select()
    .from(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      )
    )
    .limit(1);

  // If reaction doesn't exist, add it
  if (existing.length === 0) {
    await db.insert(messageReactions).values({
      messageId,
      userId,
      emoji,
    });
  }
}

/**
 * Remove a reaction from a message
 */
export async function removeReaction(messageId: number, userId: number, emoji: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      )
    );
}

/**
 * Get all reactions for a message with aggregated counts
 */
export async function getReactionsByMessage(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const reactions = await db
    .select()
    .from(messageReactions)
    .where(eq(messageReactions.messageId, messageId));

  // Aggregate reactions by emoji
  const aggregated: Record<string, { count: number; userIds: number[] }> = {};
  
  for (const reaction of reactions) {
    if (!aggregated[reaction.emoji]) {
      aggregated[reaction.emoji] = { count: 0, userIds: [] };
    }
    aggregated[reaction.emoji].count++;
    aggregated[reaction.emoji].userIds.push(reaction.userId);
  }

  // Convert to array format
  return Object.entries(aggregated).map(([emoji, data]) => ({
    emoji,
    count: data.count,
    userIds: data.userIds,
  }));
}
