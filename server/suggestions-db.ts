import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { memorySuggestions } from "../drizzle/schema";

export async function createMemorySuggestion(data: {
  userId: number;
  conversationId: number;
  messageId: number;
  sentinelId?: number;
  content: string;
  category: string;
  importance: number;
  tags: string[];
  reasoning?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db.insert(memorySuggestions).values({
    userId: data.userId,
    conversationId: data.conversationId,
    messageId: data.messageId,
    sentinelId: data.sentinelId,
    content: data.content,
    category: data.category as any,
    importance: data.importance,
    tags: data.tags as any,
    reasoning: data.reasoning,
    status: "pending",
  });

  return true;
}

export async function getPendingSuggestions(userId: number, conversationId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const conditions = [
    eq(memorySuggestions.userId, userId),
    eq(memorySuggestions.status, "pending" as any),
  ];

  if (conversationId) {
    conditions.push(eq(memorySuggestions.conversationId, conversationId));
  }

  const suggestions = await db
    .select()
    .from(memorySuggestions)
    .where(and(...conditions))
    .orderBy(desc(memorySuggestions.importance), desc(memorySuggestions.createdAt));

  return suggestions.map((s) => ({
    ...s,
    tags: typeof s.tags === "string" ? JSON.parse(s.tags) : s.tags || [],
  }));
}

export async function getSuggestionsByMessage(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const suggestions = await db
    .select()
    .from(memorySuggestions)
    .where(eq(memorySuggestions.messageId, messageId))
    .orderBy(desc(memorySuggestions.importance));

  return suggestions.map((s) => ({
    ...s,
    tags: typeof s.tags === "string" ? JSON.parse(s.tags) : s.tags || [],
  }));
}

export async function acceptSuggestion(
  suggestionId: number,
  userId: number,
  savedMemoryId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(memorySuggestions)
    .set({
      status: "accepted" as any,
      savedMemoryId,
      respondedAt: new Date(),
    })
    .where(
      and(
        eq(memorySuggestions.id, suggestionId),
        eq(memorySuggestions.userId, userId)
      )
    );

  return true;
}

export async function dismissSuggestion(
  suggestionId: number,
  userId: number,
  feedback?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(memorySuggestions)
    .set({
      status: "dismissed" as any,
      feedback,
      respondedAt: new Date(),
    })
    .where(
      and(
        eq(memorySuggestions.id, suggestionId),
        eq(memorySuggestions.userId, userId)
      )
    );

  return true;
}

export async function editAndAcceptSuggestion(
  suggestionId: number,
  userId: number,
  newContent: string,
  newCategory?: string,
  newTags?: string[],
  savedMemoryId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const updateData: any = {
    status: "edited",
    content: newContent,
    savedMemoryId,
    respondedAt: new Date(),
  };

  if (newCategory) {
    updateData.category = newCategory;
  }

  if (newTags) {
    updateData.tags = newTags;
  }

  await db
    .update(memorySuggestions)
    .set(updateData)
    .where(
      and(
        eq(memorySuggestions.id, suggestionId),
        eq(memorySuggestions.userId, userId)
      )
    );

  return true;
}

export async function getSuggestionStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const allSuggestions = await db
    .select()
    .from(memorySuggestions)
    .where(eq(memorySuggestions.userId, userId));

  const total = allSuggestions.length;
  const accepted = allSuggestions.filter((s) => s.status === "accepted").length;
  const dismissed = allSuggestions.filter((s) => s.status === "dismissed").length;
  const pending = allSuggestions.filter((s) => s.status === "pending").length;

  const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;

  return {
    total,
    accepted,
    dismissed,
    pending,
    acceptanceRate,
  };
}
