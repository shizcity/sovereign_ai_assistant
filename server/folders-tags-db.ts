import { eq, and } from "drizzle-orm";
import { folders, tags, conversationTags, conversations, type Folder, type Tag, type InsertFolder, type InsertTag } from "../drizzle/schema";
import { getDb } from "./db";

// ===== Folder Operations =====

export async function getUserFolders(userId: number): Promise<Folder[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(folders).where(eq(folders.userId, userId));
  return result;
}

export async function createFolder(data: InsertFolder): Promise<Folder> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [folder] = await db.insert(folders).values(data).$returningId();
  const [newFolder] = await db.select().from(folders).where(eq(folders.id, folder.id));
  return newFolder!;
}

export async function updateFolder(id: number, userId: number, data: { name?: string; color?: string }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(folders)
    .set(data)
    .where(and(eq(folders.id, id), eq(folders.userId, userId)));
}

export async function deleteFolder(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Remove folder assignment from conversations
  await db.update(conversations)
    .set({ folderId: null })
    .where(eq(conversations.folderId, id));
  
  // Delete the folder
  await db.delete(folders)
    .where(and(eq(folders.id, id), eq(folders.userId, userId)));
}

// ===== Tag Operations =====

export async function getUserTags(userId: number): Promise<Tag[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(tags).where(eq(tags.userId, userId));
  return result;
}

export async function createTag(data: InsertTag): Promise<Tag> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [tag] = await db.insert(tags).values(data).$returningId();
  const [newTag] = await db.select().from(tags).where(eq(tags.id, tag.id));
  return newTag!;
}

export async function updateTag(id: number, userId: number, data: { name?: string; color?: string }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(tags)
    .set(data)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)));
}

export async function deleteTag(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Remove tag assignments from conversations
  await db.delete(conversationTags)
    .where(eq(conversationTags.tagId, id));
  
  // Delete the tag
  await db.delete(tags)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)));
}

// ===== Conversation-Tag Assignment Operations =====

export async function getConversationTags(conversationId: number): Promise<Tag[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: tags.id,
      userId: tags.userId,
      name: tags.name,
      color: tags.color,
      createdAt: tags.createdAt,
    })
    .from(conversationTags)
    .innerJoin(tags, eq(conversationTags.tagId, tags.id))
    .where(eq(conversationTags.conversationId, conversationId));
  
  return result;
}

export async function assignTagToConversation(conversationId: number, tagId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already assigned
  const existing = await db.select()
    .from(conversationTags)
    .where(and(
      eq(conversationTags.conversationId, conversationId),
      eq(conversationTags.tagId, tagId)
    ));
  
  if (existing.length === 0) {
    await db.insert(conversationTags).values({ conversationId, tagId });
  }
}

export async function removeTagFromConversation(conversationId: number, tagId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(conversationTags)
    .where(and(
      eq(conversationTags.conversationId, conversationId),
      eq(conversationTags.tagId, tagId)
    ));
}

export async function assignFolderToConversation(conversationId: number, userId: number, folderId: number | null): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(conversations)
    .set({ folderId })
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));
}
