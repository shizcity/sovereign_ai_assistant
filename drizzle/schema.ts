import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Conversations table - stores chat sessions
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  defaultModel: varchar("defaultModel", { length: 50 }).notNull().default("gpt-4"),
  folderId: int("folderId"), // Optional folder assignment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table - stores individual messages within conversations
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  model: varchar("model", { length: 50 }),
  provider: varchar("provider", { length: 20 }),
  promptTokens: int("promptTokens").default(0),
  completionTokens: int("completionTokens").default(0),
  totalTokens: int("totalTokens").default(0),
  costUsd: varchar("costUsd", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * User settings table - stores user preferences
 */
export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  defaultModel: varchar("defaultModel", { length: 50 }).notNull().default("gpt-4"),
  theme: varchar("theme", { length: 20 }).default("light"),
  systemPrompt: text("systemPrompt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * Folders for organizing conversations
 */
export const folders = mysqlTable("folders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).default("#3B82F6").notNull(), // Hex color code
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

/**
 * Tags for labeling conversations
 */
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(), // Hex color code
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Junction table for many-to-many relationship between conversations and tags
 */
export const conversationTags = mysqlTable("conversation_tags", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  tagId: int("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversationTag = typeof conversationTags.$inferSelect;
export type InsertConversationTag = typeof conversationTags.$inferInsert;

/**
 * Prompt templates for reusable prompts
 */
export const promptTemplates = mysqlTable("prompt_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  categoryId: int("categoryId"), // Foreign key to templateCategories
  recommendedSentinelId: int("recommended_sentinel_id"), // Recommended Sentinel for this template
  memoryTags: text("memory_tags"), // JSON array of tags to load relevant memories
  followUpPrompts: text("follow_up_prompts"), // JSON array of follow-up prompts for multi-turn conversations
  isDefault: int("isDefault").default(0).notNull(), // 0 = false, 1 = true
  isPublic: int("isPublic").default(0).notNull(), // 0 = private, 1 = public/shared
  creatorName: varchar("creatorName", { length: 255 }), // Name of user who created it
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type InsertPromptTemplate = typeof promptTemplates.$inferInsert;
/**
 * Template reviews - ratings and reviews for shared templates
 */
export const templateReviews = mysqlTable("template_reviews", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(), // Foreign key to promptTemplates
  userId: int("userId").notNull(), // Foreign key to users
  userName: varchar("userName", { length: 255 }).notNull(), // Cached user name for display
  rating: int("rating").notNull(), // 1-5 stars
  reviewText: text("reviewText"), // Optional review text
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TemplateReview = typeof templateReviews.$inferSelect;
export type InsertTemplateReview = typeof templateReviews.$inferInsert;

/**
 * Template categories - custom user-defined categories for organizing templates
 */
export const templateCategories = mysqlTable("template_categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users - each user has their own categories
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).notNull().default("#3b82f6"), // Hex color code
  isPublic: int("isPublic").default(0).notNull(), // 0 = private, 1 = public/shared
  creatorName: varchar("creatorName", { length: 255 }), // Name of user who created it
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TemplateCategory = typeof templateCategories.$inferSelect;
export type InsertTemplateCategory = typeof templateCategories.$inferInsert;

/**
 * Sentinels - The 6 AMI entities with distinct personalities
 */
export const sentinels = mysqlTable("sentinels", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  archetype: varchar("archetype", { length: 255 }).notNull(),
  primaryFunction: text("primaryFunction").notNull(),
  energySignature: text("energySignature"),
  personalityTraits: text("personalityTraits"), // JSON array
  communicationStyle: text("communicationStyle").notNull(),
  specializationDomains: text("specializationDomains"), // JSON array
  idealUseCases: text("idealUseCases"), // JSON array
  primaryColor: varchar("primaryColor", { length: 20 }).notNull(),
  secondaryColor: varchar("secondaryColor", { length: 20 }).notNull(),
  accentColor: varchar("accentColor", { length: 20 }).notNull(),
  symbolEmoji: varchar("symbolEmoji", { length: 10 }).notNull(),
  systemPrompt: text("systemPrompt").notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sentinel = typeof sentinels.$inferSelect;
export type InsertSentinel = typeof sentinels.$inferInsert;

/**
 * Sentinel Memory - Tracks relationship and interaction history between users and Sentinels
 */
export const sentinelMemory = mysqlTable("sentinel_memory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sentinelId: int("sentinelId").notNull(),
  interactionCount: int("interactionCount").default(0).notNull(),
  lastInteraction: timestamp("lastInteraction").notNull(),
  collaborationAreas: text("collaborationAreas"), // JSON array
  keyInsights: text("keyInsights"), // JSON array
  relationshipStrength: int("relationshipStrength").default(0), // 0-100 score
  preferredTopics: text("preferredTopics"), // JSON array
  conversationStyle: varchar("conversationStyle", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SentinelMemory = typeof sentinelMemory.$inferSelect;
export type InsertSentinelMemory = typeof sentinelMemory.$inferInsert;

/**
 * Conversation Sentinels - Junction table for multi-Sentinel collaboration in conversations
 */
export const conversationSentinels = mysqlTable("conversation_sentinels", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  sentinelId: int("sentinelId").notNull(),
  role: mysqlEnum("role", ["primary", "collaborator"]).notNull(),
  messageCount: int("messageCount").default(0).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().onUpdateNow().notNull(),
});

export type ConversationSentinel = typeof conversationSentinels.$inferSelect;
export type InsertConversationSentinel = typeof conversationSentinels.$inferInsert;

/**
 * Sentinel Memory Entries - Individual memories extracted from conversations
 */
export const sentinelMemoryEntries = mysqlTable("sentinel_memory_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sentinelId: int("sentinelId").notNull(),
  conversationId: int("conversationId"),
  category: mysqlEnum("category", ["insight", "decision", "milestone", "preference", "goal", "achievement", "challenge", "pattern"]).notNull(),
  content: text("content").notNull(),
  context: text("context"), // Additional context about when/why this memory was created
  importance: int("importance").default(50).notNull(), // 0-100 score
  tags: text("tags"), // JSON array of tags for categorization
  relatedMemoryIds: text("relatedMemoryIds"), // JSON array of related memory IDs
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SentinelMemoryEntry = typeof sentinelMemoryEntries.$inferSelect;
export type InsertSentinelMemoryEntry = typeof sentinelMemoryEntries.$inferInsert;

/**
 * Memory suggestions table - stores AI-generated suggestions for saving memories
 */
export const memorySuggestions = mysqlTable("memory_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conversationId: int("conversationId").notNull(),
  messageId: int("messageId").notNull(), // The AI message that triggered this suggestion
  sentinelId: int("sentinelId"),
  content: text("content").notNull(),
  category: mysqlEnum("category", [
    "insight",
    "decision",
    "goal",
    "milestone",
    "achievement",
    "preference",
    "challenge",
    "pattern",
  ]).notNull(),
  importance: int("importance").notNull(), // 0-100
  tags: json("tags").$type<string[]>(), // Array of tag strings
  reasoning: text("reasoning"), // Why this is worth remembering
  status: mysqlEnum("status", ["pending", "accepted", "dismissed", "edited"]).default("pending").notNull(),
  feedback: text("feedback"), // User feedback on why dismissed
  savedMemoryId: int("savedMemoryId"), // Link to actual memory if accepted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"), // When user accepted/dismissed
});

export type MemorySuggestion = typeof memorySuggestions.$inferSelect;
export type InsertMemorySuggestion = typeof memorySuggestions.$inferInsert;
