import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  // Stripe subscription fields
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionTier: varchar("subscriptionTier", { length: 20 }).default("free"),
  subscriptionStatus: varchar("subscriptionStatus", { length: 20 }).default("active"),
  subscriptionCurrentPeriodEnd: timestamp("subscriptionCurrentPeriodEnd"),
  // Onboarding fields
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  onboardingStep: int("onboardingStep").default(0).notNull(),
  // Referral system
  referralCode: varchar("referralCode", { length: 16 }).unique(),
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
  sentinelId: int("sentinelId"), // Track which Sentinel responded (for multi-Sentinel conversations)
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
  emailDigestFrequency: varchar("emailDigestFrequency", { length: 20 }).default("weekly"), // 'weekly' | 'monthly' | 'both' | 'off'
  lastDigestSent: timestamp("lastDigestSent"),
  ttsEnabled: boolean("ttsEnabled").default(false),
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

/**
 * Custom Sentinels - User-created AI personas (Creator tier only)
 */
export const customSentinels = mysqlTable("custom_sentinels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  archetype: varchar("archetype", { length: 255 }).notNull(),
  primaryFunction: text("primaryFunction").notNull(),
  personalityTraits: text("personalityTraits").notNull(), // JSON array
  communicationStyle: text("communicationStyle").notNull(),
  specializationDomains: text("specializationDomains").notNull(), // JSON array
  primaryColor: varchar("primaryColor", { length: 20 }).notNull().default("#8b5cf6"),
  symbolEmoji: varchar("symbolEmoji", { length: 10 }).notNull().default("✨"),
  systemPrompt: text("systemPrompt").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomSentinel = typeof customSentinels.$inferSelect;
export type InsertCustomSentinel = typeof customSentinels.$inferInsert;

/**
 * Round Table Sessions - Multi-Sentinel deliberation sessions
 */
export const roundTableSessions = mysqlTable("round_table_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  question: text("question").notNull(),
  sentinelIds: text("sentinelIds").notNull(), // JSON array of sentinel IDs used
  sentinelNames: text("sentinelNames").notNull(), // JSON array of sentinel names
  status: mysqlEnum("status", ["running", "completed", "failed"]).default("running").notNull(),
  rounds: int("rounds").default(2).notNull(), // Number of deliberation rounds completed
  consensusScore: varchar("consensusScore", { length: 10 }), // 0.00–1.00 as string
  hasContradiction: int("hasContradiction").default(0).notNull(), // 0 or 1
  contradictionSummary: text("contradictionSummary"),
  finalAnswer: text("finalAnswer"),
  finalSentinelId: int("finalSentinelId"), // Which Sentinel delivered the final answer
  finalSentinelName: varchar("finalSentinelName", { length: 100 }),
  memoryIds: text("memoryIds"), // JSON array of memory IDs loaded for context
  savedMemoryId: int("savedMemoryId"), // Memory ID if session was saved to memory layer
  contradictions: text("contradictions"), // JSON array of structured contradiction objects
  routingReason: text("routingReason"), // Why the best-fit Sentinel was chosen
  // Phase 3 columns
  deliberationMode: varchar("deliberationMode", { length: 20 }).default("parallel").notNull(), // parallel | shared | synchronous
  interruptionLog: text("interruptionLog"), // JSON array of human interruption events
  streamId: varchar("streamId", { length: 64 }), // SSE channel ID for streaming
  isPaused: int("isPaused").default(0).notNull(), // 1 if session is paused for human input
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type RoundTableSession = typeof roundTableSessions.$inferSelect;
export type InsertRoundTableSession = typeof roundTableSessions.$inferInsert;

/**
 * Round Table Reasoning - Individual Sentinel reasoning steps per round
 */
export const roundTableReasoning = mysqlTable("round_table_reasoning", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  sentinelId: int("sentinelId").notNull(),
  sentinelName: varchar("sentinelName", { length: 100 }).notNull(),
  sentinelEmoji: varchar("sentinelEmoji", { length: 10 }).default("🤖"),
  round: int("round").notNull(), // 1-based round number
  thinkingChain: text("thinkingChain").notNull(), // Full step-by-step reasoning
  conclusion: text("conclusion").notNull(),
  confidence: varchar("confidence", { length: 10 }).notNull(), // 0.00–1.00 as string
  concerns: text("concerns"), // JSON array of caveats
  dissent: text("dissent"), // If this Sentinel disagrees with consensus
  dissentScore: varchar("dissentScore", { length: 10 }), // 0.00–1.00 how far this Sentinel diverges from group
  isOutlier: int("isOutlier").default(0).notNull(), // 1 if dissentScore > 0.5
  memoriesUsed: text("memoriesUsed"), // JSON array of memory snippets used
  // M4: Model Switch Log
  modelUsed: varchar("modelUsed", { length: 100 }), // e.g. "gpt-4o", "claude-3-5-sonnet"
  latencyMs: int("latencyMs"), // time in ms for this Sentinel's LLM call
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoundTableReasoning = typeof roundTableReasoning.$inferSelect;
export type InsertRoundTableReasoning = typeof roundTableReasoning.$inferInsert;

// ─────────────────────────────────────────────
// GAMIFICATION
// ─────────────────────────────────────────────

/**
 * XP Ledger - every XP award event is recorded here
 */
export const xpLedger = mysqlTable("xp_ledger", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  xpAwarded: int("xpAwarded").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type XpLedger = typeof xpLedger.$inferSelect;
export type InsertXpLedger = typeof xpLedger.$inferInsert;

/**
 * User Streaks - tracks daily activity streaks
 */
export const userStreaks = mysqlTable("user_streaks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActiveDate: varchar("lastActiveDate", { length: 10 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type UserStreak = typeof userStreaks.$inferSelect;
export type InsertUserStreak = typeof userStreaks.$inferInsert;

/**
 * User Achievements - unlocked badges per user
 */
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: varchar("achievementId", { length: 100 }).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

/**
 * Referrals - tracks invite relationships and XP rewards
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  /** The user who shared the invite link */
  referrerId: int("referrerId").notNull(),
  /** The new user who signed up via the link (null until claimed) */
  refereeId: int("refereeId"),
  /** The unique invite code used */
  code: varchar("code", { length: 16 }).notNull(),
  /** XP awarded to the referrer (0 until claimed) */
  xpAwarded: int("xpAwarded").default(0).notNull(),
  /** When the referee signed up and the referral was completed */
  claimedAt: timestamp("claimedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;
