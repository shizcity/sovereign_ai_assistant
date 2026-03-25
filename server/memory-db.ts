import { eq, and, desc, sql } from "drizzle-orm";
import { sentinelMemoryEntries } from "../drizzle/schema";
import { getDb } from "./db";
import type { MemoryCategory } from "./memory-extraction";

export interface CreateMemoryInput {
  userId: number;
  sentinelId: number;
  conversationId?: number;
  category: MemoryCategory;
  content: string;
  context?: string;
  importance?: number;
  tags?: string[];
  relatedMemoryIds?: number[];
}

/**
 * Create a new memory entry
 */
export async function createMemory(input: CreateMemoryInput) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(sentinelMemoryEntries).values({
    userId: input.userId,
    sentinelId: input.sentinelId,
    conversationId: input.conversationId,
    category: input.category,
    content: input.content,
    context: input.context || null,
    importance: input.importance || 50,
    tags: input.tags ? JSON.stringify(input.tags) : null,
    relatedMemoryIds: input.relatedMemoryIds ? JSON.stringify(input.relatedMemoryIds) : null,
    isActive: 1,
  });

  return true;
}

/**
 * Get all memories for a user and Sentinel
 */
export async function getUserSentinelMemories(userId: number, sentinelId: number) {
  const db = await getDb();
  if (!db) return [];

  const memories = await db
    .select()
    .from(sentinelMemoryEntries)
    .where(
      and(
        eq(sentinelMemoryEntries.userId, userId),
        eq(sentinelMemoryEntries.sentinelId, sentinelId),
        eq(sentinelMemoryEntries.isActive, 1)
      )
    )
    .orderBy(desc(sentinelMemoryEntries.importance), desc(sentinelMemoryEntries.createdAt));

  return memories.map((m) => ({
    ...m,
    tags: m.tags ? JSON.parse(m.tags) : [],
    relatedMemoryIds: m.relatedMemoryIds ? JSON.parse(m.relatedMemoryIds) : [],
  }));
}

/**
 * Get all active memories for a user (across all Sentinels)
 */
export async function getAllUserMemories(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const memories = await db
    .select()
    .from(sentinelMemoryEntries)
    .where(and(eq(sentinelMemoryEntries.userId, userId), eq(sentinelMemoryEntries.isActive, 1)))
    .orderBy(desc(sentinelMemoryEntries.importance), desc(sentinelMemoryEntries.createdAt));

  return memories.map((m) => ({
    ...m,
    tags: m.tags ? JSON.parse(m.tags) : [],
    relatedMemoryIds: m.relatedMemoryIds ? JSON.parse(m.relatedMemoryIds) : [],
  }));
}

/**
 * Get memories for a specific conversation
 */
export async function getConversationMemories(conversationId: number) {
  const db = await getDb();
  if (!db) return [];

  const memories = await db
    .select()
    .from(sentinelMemoryEntries)
    .where(
      and(
        eq(sentinelMemoryEntries.conversationId, conversationId),
        eq(sentinelMemoryEntries.isActive, 1)
      )
    )
    .orderBy(desc(sentinelMemoryEntries.createdAt));

  return memories.map((m) => ({
    ...m,
    tags: m.tags ? JSON.parse(m.tags) : [],
    relatedMemoryIds: m.relatedMemoryIds ? JSON.parse(m.relatedMemoryIds) : [],
  }));
}

/**
 * Search memories by content (simple text search)
 */
export async function searchMemories(userId: number, sentinelId: number, searchTerm: string) {
  const db = await getDb();
  if (!db) return [];

  const memories = await db
    .select()
    .from(sentinelMemoryEntries)
    .where(
      and(
        eq(sentinelMemoryEntries.userId, userId),
        eq(sentinelMemoryEntries.sentinelId, sentinelId),
        eq(sentinelMemoryEntries.isActive, 1),
        sql`${sentinelMemoryEntries.content} LIKE ${`%${searchTerm}%`}`
      )
    )
    .orderBy(desc(sentinelMemoryEntries.importance));

  return memories.map((m) => ({
    ...m,
    tags: m.tags ? JSON.parse(m.tags) : [],
    relatedMemoryIds: m.relatedMemoryIds ? JSON.parse(m.relatedMemoryIds) : [],
  }));
}

/**
 * Get top N most important memories for context injection
 */
export async function getTopMemories(userId: number, sentinelId: number, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  const memories = await db
    .select()
    .from(sentinelMemoryEntries)
    .where(
      and(
        eq(sentinelMemoryEntries.userId, userId),
        eq(sentinelMemoryEntries.sentinelId, sentinelId),
        eq(sentinelMemoryEntries.isActive, 1)
      )
    )
    .orderBy(desc(sentinelMemoryEntries.importance))
    .limit(limit);

  return memories.map((m) => ({
    ...m,
    tags: m.tags ? JSON.parse(m.tags) : [],
    relatedMemoryIds: m.relatedMemoryIds ? JSON.parse(m.relatedMemoryIds) : [],
  }));
}

/**
 * Update a memory entry
 */
export async function updateMemory(
  memoryId: number,
  updates: {
    content?: string;
    context?: string;
    importance?: number;
    tags?: string[];
    isActive?: number;
  }
) {
  const db = await getDb();
  if (!db) return null;

  const updateData: any = {};

  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.context !== undefined) updateData.context = updates.context;
  if (updates.importance !== undefined) updateData.importance = updates.importance;
  if (updates.tags !== undefined) updateData.tags = JSON.stringify(updates.tags);
  if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

  await db.update(sentinelMemoryEntries).set(updateData).where(eq(sentinelMemoryEntries.id, memoryId));

  return memoryId;
}

/**
 * Delete a memory (soft delete by setting isActive = 0)
 */
export async function deleteMemory(memoryId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.update(sentinelMemoryEntries).set({ isActive: 0 }).where(eq(sentinelMemoryEntries.id, memoryId));

  return true;
}

/**
 * Get memory statistics for a user-Sentinel relationship
 */
export async function getMemoryStats(userId: number, sentinelId: number) {
  const db = await getDb();
  if (!db) return null;

  const memories = await getUserSentinelMemories(userId, sentinelId);

  const stats = {
    totalMemories: memories.length,
    byCategory: {} as Record<MemoryCategory, number>,
    averageImportance: 0,
    mostRecentMemory: memories[0]?.createdAt || null,
  };

  let totalImportance = 0;

  memories.forEach((m) => {
    stats.byCategory[m.category] = (stats.byCategory[m.category] || 0) + 1;
    totalImportance += m.importance;
  });

  stats.averageImportance = memories.length > 0 ? Math.round(totalImportance / memories.length) : 0;

  return stats;
}

/**
 * Get a single memory entry by ID (used for ownership verification before update/delete)
 */
export async function getMemoryById(memoryId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(sentinelMemoryEntries)
    .where(eq(sentinelMemoryEntries.id, memoryId))
    .limit(1);

  return result[0] || null;
}
