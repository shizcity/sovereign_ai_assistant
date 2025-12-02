import { eq, and } from "drizzle-orm";
import { sentinels, sentinelMemory, conversationSentinels } from "../drizzle/schema";
import { getDb } from "./db";

export async function getAllSentinels() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sentinels).where(eq(sentinels.isActive, 1));
}

export async function getSentinelById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(sentinels).where(eq(sentinels.id, id)).limit(1);
  return result[0] || null;
}

export async function getSentinelBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(sentinels).where(eq(sentinels.slug, slug)).limit(1);
  return result[0] || null;
}

export async function getSentinelMemory(userId: number, sentinelId: number) {
  const db = await getDb();
  if (!db) return null;
  
  let memory = await db
    .select()
    .from(sentinelMemory)
    .where(and(eq(sentinelMemory.userId, userId), eq(sentinelMemory.sentinelId, sentinelId)))
    .limit(1);

  if (memory.length === 0) {
    await db.insert(sentinelMemory).values({
      userId,
      sentinelId,
      interactionCount: 0,
      lastInteraction: new Date(),
      collaborationAreas: JSON.stringify([]),
      keyInsights: JSON.stringify([]),
    });

    memory = await db
      .select()
      .from(sentinelMemory)
      .where(and(eq(sentinelMemory.userId, userId), eq(sentinelMemory.sentinelId, sentinelId)))
      .limit(1);
  }

  return memory[0] || null;
}

export async function getAllSentinelMemories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sentinelMemory).where(eq(sentinelMemory.userId, userId));
}

export async function updateSentinelMemory(
  userId: number,
  sentinelId: number,
  updates: {
    interactionCount?: number;
    lastInteraction?: Date;
    collaborationAreas?: string[];
    keyInsights?: string[];
  }
) {
  const db = await getDb();
  if (!db) return null;
  
  const updateData: any = {};

  if (updates.interactionCount !== undefined) {
    updateData.interactionCount = updates.interactionCount;
  }
  if (updates.lastInteraction) {
    updateData.lastInteraction = updates.lastInteraction;
  }
  if (updates.collaborationAreas) {
    updateData.collaborationAreas = JSON.stringify(updates.collaborationAreas);
  }
  if (updates.keyInsights) {
    updateData.keyInsights = JSON.stringify(updates.keyInsights);
  }

  await db
    .update(sentinelMemory)
    .set(updateData)
    .where(and(eq(sentinelMemory.userId, userId), eq(sentinelMemory.sentinelId, sentinelId)));

  return getSentinelMemory(userId, sentinelId);
}

export async function addSentinelToConversation(
  conversationId: number,
  sentinelId: number,
  role: "primary" | "collaborator"
) {
  const db = await getDb();
  if (!db) return { success: false };
  
  await db.insert(conversationSentinels).values({
    conversationId,
    sentinelId,
    role,
    messageCount: 0,
  });

  return { success: true };
}

export async function getConversationSentinels(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(conversationSentinels)
    .where(eq(conversationSentinels.conversationId, conversationId));
}

export async function removeSentinelFromConversation(conversationId: number, sentinelId: number) {
  const db = await getDb();
  if (!db) return { success: false };
  
  await db
    .delete(conversationSentinels)
    .where(
      and(
        eq(conversationSentinels.conversationId, conversationId),
        eq(conversationSentinels.sentinelId, sentinelId)
      )
    );

  return { success: true };
}
