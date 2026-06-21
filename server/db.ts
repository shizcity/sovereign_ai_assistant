import { eq, and, inArray, gt, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  conversations, 
  InsertConversation,
  messages,
  InsertMessage,
  userSettings,
  InsertUserSettings,
  notifications,
  InsertNotification,
  sentinelCustomisations,
  InsertSentinelCustomisation,
  agentBuilderSessions,
  InsertAgentBuilderSession,
  templateInteractions,
  InsertTemplateInteraction,
  agentBuilderProgress,
  agentBlueprints,
  InsertAgentBlueprint
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Conversation queries
export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(conversations).values(data);
  return result[0].insertId;
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(conversations.updatedAt);
}

export async function getConversationById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);
  
  if (result.length === 0 || result[0].userId !== userId) return undefined;
  return result[0];
}

export async function updateConversation(id: number, userId: number, data: Partial<InsertConversation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(conversations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(conversations.id, id));
}

export async function deleteConversation(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First verify ownership
  const conversation = await getConversationById(id, userId);
  if (!conversation) throw new Error("Conversation not found or access denied");
  
  // Delete messages first
  await db.delete(messages).where(eq(messages.conversationId, id));
  // Then delete conversation
  await db.delete(conversations).where(eq(conversations.id, id));
}

// Message queries
export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(messages).values(data);
  return result[0].insertId;
}

export async function getConversationMessages(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Verify conversation ownership
  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) return [];
  
  return db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

export async function getMessageById(messageId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);
  
  return result[0] || null;
}

export async function updateMessage(messageId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(messages)
    .set({ content })
    .where(eq(messages.id, messageId));
}

export async function deleteMessagesAfter(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the message to find its conversation and creation time
  const message = await getMessageById(messageId);
  if (!message) return;
  
  // Delete all messages in the same conversation that were created after this message
  await db.delete(messages)
    .where(
      and(
        eq(messages.conversationId, message.conversationId),
        gt(messages.createdAt, message.createdAt)
      )
    );
}

export async function deleteEmptyConversations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Find conversations with no messages
  const userConvos = await getUserConversations(userId);
  const emptyConvos = [];
  
  for (const convo of userConvos) {
    const msgs = await db.select().from(messages)
      .where(eq(messages.conversationId, convo.id))
      .limit(1);
    
    if (msgs.length === 0) {
      emptyConvos.push(convo.id);
    }
  }
  
  // Delete empty conversations
  if (emptyConvos.length > 0) {
    await db.delete(conversations)
      .where(and(
        eq(conversations.userId, userId),
        inArray(conversations.id, emptyConvos)
      ));
  }
  
  return emptyConvos.length;
}

// User settings queries
export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserSettings(userId: number, data: Partial<InsertUserSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserSettings(userId);
  
  if (existing) {
    await db.update(userSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({ userId, ...data });
  }
}

// ─── Notification helpers ─────────────────────────────────────────────────────

export async function createNotification(data: Omit<InsertNotification, "id" | "createdAt" | "read">): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ ...data, read: false });
}

export async function getNotifications(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return rows.length;
}

export async function markNotificationRead(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}

// ─── Sentinel Customisation helpers ──────────────────────────────────────────

export async function getSentinelCustomisation(userId: number, sentinelId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(sentinelCustomisations)
    .where(and(eq(sentinelCustomisations.userId, userId), eq(sentinelCustomisations.sentinelId, sentinelId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertSentinelCustomisation(
  userId: number,
  sentinelId: number,
  data: { customTone?: string | null; customFocus?: string | null }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await getSentinelCustomisation(userId, sentinelId);
  if (existing) {
    await db.update(sentinelCustomisations)
      .set({ customTone: data.customTone ?? null, customFocus: data.customFocus ?? null })
      .where(and(eq(sentinelCustomisations.userId, userId), eq(sentinelCustomisations.sentinelId, sentinelId)));
  } else {
    await db.insert(sentinelCustomisations).values({
      userId,
      sentinelId,
      customTone: data.customTone ?? null,
      customFocus: data.customFocus ?? null,
    });
  }
}

// ─── Agent Builder Session helpers (Feature 2) ───────────────────────────────

export async function getAgentBuilderSession(userId: number, sentinelId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(agentBuilderSessions)
    .where(and(eq(agentBuilderSessions.userId, userId), eq(agentBuilderSessions.sentinelId, sentinelId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertAgentBuilderSession(
  userId: number,
  sentinelId: number,
  data: Partial<InsertAgentBuilderSession>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await getAgentBuilderSession(userId, sentinelId);
  if (existing) {
    await db.update(agentBuilderSessions)
      .set({ ...data })
      .where(and(eq(agentBuilderSessions.userId, userId), eq(agentBuilderSessions.sentinelId, sentinelId)));
  } else {
    await db.insert(agentBuilderSessions).values({ userId, sentinelId, ...data });
  }
}

export async function clearAgentBuilderSession(userId: number, sentinelId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(agentBuilderSessions)
    .where(and(eq(agentBuilderSessions.userId, userId), eq(agentBuilderSessions.sentinelId, sentinelId)));
}

// ─── Template Interaction helpers (Feature 3) ────────────────────────────────

export async function saveTemplate(userId: number, templateId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(templateInteractions)
    .values({ userId, templateId, action: "save" })
    .onDuplicateKeyUpdate({ set: { action: "save" } });
}

export async function unsaveTemplate(userId: number, templateId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(templateInteractions)
    .where(and(
      eq(templateInteractions.userId, userId),
      eq(templateInteractions.templateId, templateId),
      eq(templateInteractions.action, "save")
    ));
}

export async function rateTemplate(userId: number, templateId: string, rating: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(templateInteractions)
    .values({ userId, templateId, action: "rate", rating })
    .onDuplicateKeyUpdate({ set: { rating } });
}

export async function getUserTemplateInteractions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(templateInteractions)
    .where(eq(templateInteractions.userId, userId));
}

export async function getTemplateStats(): Promise<Record<string, { saves: number; avgRating: number | null }>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(templateInteractions);
  const stats: Record<string, { saves: number; ratings: number[]; avgRating: number | null }> = {};
  for (const row of rows) {
    if (!stats[row.templateId]) stats[row.templateId] = { saves: 0, ratings: [], avgRating: null };
    if (row.action === "save") stats[row.templateId].saves++;
    if (row.action === "rate" && row.rating != null) stats[row.templateId].ratings.push(row.rating);
  }
  const result: Record<string, { saves: number; avgRating: number | null }> = {};
  for (const [id, s] of Object.entries(stats)) {
    result[id] = {
      saves: s.saves,
      avgRating: s.ratings.length > 0 ? Math.round((s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length) * 10) / 10 : null,
    };
  }
  return result;
}

// ─── Agent Builder Progress helpers (Feature 4) ──────────────────────────────

export async function incrementAgentProgress(userId: number, metric: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  await db.insert(agentBuilderProgress)
    .values({ userId, metric, value: 1 })
    .onDuplicateKeyUpdate({ set: { value: db.$count(agentBuilderProgress) } });
  // Re-fetch the updated value
  const rows = await db.select().from(agentBuilderProgress)
    .where(and(eq(agentBuilderProgress.userId, userId), eq(agentBuilderProgress.metric, metric)))
    .limit(1);
  return rows[0]?.value ?? 1;
}

export async function getAgentProgress(userId: number): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(agentBuilderProgress)
    .where(eq(agentBuilderProgress.userId, userId));
  const result: Record<string, number> = {};
  for (const row of rows) result[row.metric] = row.value;
  return result;
}

// ─── Agent Blueprints helpers ─────────────────────────────────────────────────
export async function createAgentBlueprint(data: InsertAgentBlueprint) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(agentBlueprints).values(data);
  const rows = await db.select().from(agentBlueprints)
    .where(eq(agentBlueprints.shareToken, data.shareToken))
    .limit(1);
  return rows[0] ?? null;
}

export async function getBlueprintByToken(shareToken: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(agentBlueprints)
    .where(and(eq(agentBlueprints.shareToken, shareToken), eq(agentBlueprints.isPublic, true)))
    .limit(1);
  if (rows[0]) {
    await db.update(agentBlueprints)
      .set({ viewCount: (rows[0].viewCount ?? 0) + 1 })
      .where(eq(agentBlueprints.shareToken, shareToken));
  }
  return rows[0] ?? null;
}

export async function getUserBlueprints(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentBlueprints)
    .where(eq(agentBlueprints.userId, userId))
    .orderBy(agentBlueprints.createdAt);
}

export async function deleteAgentBlueprint(userId: number, blueprintId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(agentBlueprints)
    .where(and(eq(agentBlueprints.id, blueprintId), eq(agentBlueprints.userId, userId)));
}

export async function toggleBlueprintVisibility(userId: number, blueprintId: number, isPublic: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(agentBlueprints)
    .set({ isPublic })
    .where(and(eq(agentBlueprints.id, blueprintId), eq(agentBlueprints.userId, userId)));
}

// ─── Blueprint helpers — canonical names used by routers.ts ──────────────────

/** Create a blueprint, generating a cryptographically random share token. */
export async function createBlueprint(
  userId: number,
  data: {
    title: string;
    description?: string;
    code: string;
    language?: string;
    framework?: string;
    sentinelId?: number;
    isPublic?: boolean;
  }
) {
  const crypto = await import("crypto");
  const shareToken = crypto.randomBytes(24).toString("hex");
  return createAgentBlueprint({
    userId,
    title: data.title,
    description: data.description ?? null,
    code: data.code,
    language: data.language ?? "python",
    framework: data.framework ?? "custom",
    sentinelId: data.sentinelId ?? null,
    shareToken,
    isPublic: data.isPublic ?? true,
    viewCount: 0,
  } as InsertAgentBlueprint);
}

/** List all blueprints owned by a user, newest first. */
export async function listUserBlueprints(userId: number) {
  return getUserBlueprints(userId);
}

/** Delete a blueprint (ownership-checked). */
export async function deleteBlueprint(userId: number, blueprintId: number) {
  return deleteAgentBlueprint(userId, blueprintId);
}

/** List public blueprints for the marketplace with optional search + language filter. */
export async function listPublicBlueprints(opts: {
  search?: string;
  language?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [] as (typeof agentBlueprints.$inferSelect)[], total: 0 };

  const { limit = 24, offset = 0, search, language } = opts;

  let rows = await db
    .select()
    .from(agentBlueprints)
    .where(eq(agentBlueprints.isPublic, true))
    .orderBy(desc(agentBlueprints.viewCount), desc(agentBlueprints.createdAt));

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
    );
  }
  if (language) {
    rows = rows.filter((r) => r.language === language);
  }

  const total = rows.length;
  const items = rows.slice(offset, offset + limit);
  return { items, total };
}
