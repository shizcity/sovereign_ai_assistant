import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  category: varchar("category", { length: 100 }),
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
