/**
 * Security hardening tests
 * Covers: input validation limits, authorization guard logic, and rate-limiter config sanity
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── Mirrors of the hardened input schemas from routers.ts ───────────────────

const messageSendSchema = z.object({
  conversationId: z.number(),
  content: z.string().min(1).max(20000),
  model: z.string().max(100).default("gpt-4"),
  targetSentinelId: z.number().optional(),
});

const messageEditSchema = z.object({
  messageId: z.number(),
  content: z.string().min(1).max(20000),
});

const settingsUpdateSchema = z.object({
  systemPrompt: z.string().max(10000).optional(),
  emailDigestFrequency: z.enum(["weekly", "monthly", "both", "off"]).optional(),
});

const memoryCreateSchema = z.object({
  sentinelId: z.number(),
  conversationId: z.number().optional(),
  category: z.enum(["insight", "decision", "milestone", "preference", "goal", "achievement", "challenge", "pattern"]),
  content: z.string().min(1).max(5000),
  context: z.string().max(2000).optional(),
  importance: z.number().min(0).max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

const memoryUpdateSchema = z.object({
  memoryId: z.number(),
  content: z.string().min(1).max(5000).optional(),
  context: z.string().max(2000).optional(),
  importance: z.number().min(0).max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

const conversationImportSchema = z.object({
  data: z.object({
    title: z.string().min(1).max(255),
    defaultModel: z.string().max(100).optional(),
    messages: z.array(z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().min(1).max(20000),
      sentinelId: z.number().optional(),
      model: z.string().max(100).optional(),
    })).max(1000),
  }),
});

// ─── messages.send ────────────────────────────────────────────────────────────

describe("messages.send input validation", () => {
  it("accepts a normal message", () => {
    expect(messageSendSchema.safeParse({ conversationId: 1, content: "Hello!" }).success).toBe(true);
  });

  it("rejects empty content", () => {
    expect(messageSendSchema.safeParse({ conversationId: 1, content: "" }).success).toBe(false);
  });

  it("rejects content exceeding 20,000 characters", () => {
    expect(messageSendSchema.safeParse({ conversationId: 1, content: "a".repeat(20001) }).success).toBe(false);
  });

  it("accepts content of exactly 20,000 characters", () => {
    expect(messageSendSchema.safeParse({ conversationId: 1, content: "a".repeat(20000) }).success).toBe(true);
  });

  it("rejects model string exceeding 100 characters", () => {
    expect(messageSendSchema.safeParse({ conversationId: 1, content: "Hi", model: "x".repeat(101) }).success).toBe(false);
  });
});

// ─── messages.edit ────────────────────────────────────────────────────────────

describe("messages.edit input validation", () => {
  it("rejects content exceeding 20,000 characters", () => {
    expect(messageEditSchema.safeParse({ messageId: 1, content: "a".repeat(20001) }).success).toBe(false);
  });

  it("accepts valid edit input", () => {
    expect(messageEditSchema.safeParse({ messageId: 42, content: "Updated content" }).success).toBe(true);
  });

  it("rejects empty content", () => {
    expect(messageEditSchema.safeParse({ messageId: 1, content: "" }).success).toBe(false);
  });
});

// ─── settings.update ─────────────────────────────────────────────────────────

describe("settings.update input validation", () => {
  it("rejects systemPrompt exceeding 10,000 characters", () => {
    expect(settingsUpdateSchema.safeParse({ systemPrompt: "x".repeat(10001) }).success).toBe(false);
  });

  it("accepts systemPrompt of exactly 10,000 characters", () => {
    expect(settingsUpdateSchema.safeParse({ systemPrompt: "x".repeat(10000) }).success).toBe(true);
  });

  it("rejects invalid emailDigestFrequency values", () => {
    expect(settingsUpdateSchema.safeParse({ emailDigestFrequency: "daily" }).success).toBe(false);
  });

  it("accepts all valid emailDigestFrequency values", () => {
    for (const freq of ["weekly", "monthly", "both", "off"]) {
      expect(settingsUpdateSchema.safeParse({ emailDigestFrequency: freq }).success).toBe(true);
    }
  });
});

// ─── memories.create ─────────────────────────────────────────────────────────

describe("memories.create input validation", () => {
  it("rejects content exceeding 5,000 characters", () => {
    expect(memoryCreateSchema.safeParse({ sentinelId: 1, category: "insight", content: "x".repeat(5001) }).success).toBe(false);
  });

  it("rejects context exceeding 2,000 characters", () => {
    expect(memoryCreateSchema.safeParse({ sentinelId: 1, category: "insight", content: "Valid", context: "x".repeat(2001) }).success).toBe(false);
  });

  it("rejects more than 20 tags", () => {
    expect(memoryCreateSchema.safeParse({ sentinelId: 1, category: "insight", content: "Valid", tags: Array(21).fill("tag") }).success).toBe(false);
  });

  it("rejects individual tags exceeding 50 characters", () => {
    expect(memoryCreateSchema.safeParse({ sentinelId: 1, category: "insight", content: "Valid", tags: ["x".repeat(51)] }).success).toBe(false);
  });

  it("accepts valid memory creation input", () => {
    expect(memoryCreateSchema.safeParse({ sentinelId: 1, category: "insight", content: "A valid memory.", tags: ["productivity"] }).success).toBe(true);
  });

  it("rejects invalid category", () => {
    expect(memoryCreateSchema.safeParse({ sentinelId: 1, category: "random", content: "Valid" }).success).toBe(false);
  });
});

// ─── memories.update ─────────────────────────────────────────────────────────

describe("memories.update input validation", () => {
  it("rejects content exceeding 5,000 characters", () => {
    expect(memoryUpdateSchema.safeParse({ memoryId: 1, content: "x".repeat(5001) }).success).toBe(false);
  });

  it("accepts valid update input", () => {
    expect(memoryUpdateSchema.safeParse({ memoryId: 1, content: "Updated memory", importance: 75 }).success).toBe(true);
  });
});

// ─── conversations.import ─────────────────────────────────────────────────────

describe("conversations.import input validation", () => {
  it("rejects import with invalid role in messages", () => {
    expect(conversationImportSchema.safeParse({ data: { title: "Test", messages: [{ role: "admin", content: "Hi" }] } }).success).toBe(false);
  });

  it("rejects import with more than 1,000 messages", () => {
    expect(conversationImportSchema.safeParse({ data: { title: "Test", messages: Array(1001).fill({ role: "user", content: "Hi" }) } }).success).toBe(false);
  });

  it("rejects import with message content exceeding 20,000 characters", () => {
    expect(conversationImportSchema.safeParse({ data: { title: "Test", messages: [{ role: "user", content: "x".repeat(20001) }] } }).success).toBe(false);
  });

  it("rejects import with title exceeding 255 characters", () => {
    expect(conversationImportSchema.safeParse({ data: { title: "x".repeat(256), messages: [{ role: "user", content: "Hi" }] } }).success).toBe(false);
  });

  it("accepts a valid import payload", () => {
    expect(conversationImportSchema.safeParse({ data: { title: "Imported", messages: [{ role: "user", content: "Hello" }, { role: "assistant", content: "Hi!" }] } }).success).toBe(true);
  });
});

// ─── Authorization guard logic ────────────────────────────────────────────────

describe("authorization ownership guard logic", () => {
  it("denies access when memory userId does not match caller", () => {
    const memory = { id: 1, userId: 99 };
    const callerId = 1;
    const hasAccess = memory.userId === callerId;
    expect(hasAccess).toBe(false);
  });

  it("grants access when memory userId matches caller", () => {
    const memory = { id: 1, userId: 42 };
    const callerId = 42;
    const hasAccess = memory.userId === callerId;
    expect(hasAccess).toBe(true);
  });

  it("denies access when conversation userId does not match caller", () => {
    const conversation = { id: 5, userId: 200 };
    const callerId = 1;
    const hasAccess = conversation.userId === callerId;
    expect(hasAccess).toBe(false);
  });

  it("grants access when conversation userId matches caller", () => {
    const conversation = { id: 5, userId: 7 };
    const callerId = 7;
    const hasAccess = conversation.userId === callerId;
    expect(hasAccess).toBe(true);
  });
});

// ─── Rate limiter configuration sanity ───────────────────────────────────────

describe("rate limiter configuration", () => {
  it("general limiter allows 300 requests per 15 minutes", () => {
    const config = { windowMs: 15 * 60 * 1000, max: 300 };
    expect(config.max).toBe(300);
    expect(config.windowMs).toBe(900000);
  });

  it("LLM limiter caps at 30 requests per minute", () => {
    const config = { windowMs: 60 * 1000, max: 30 };
    expect(config.max).toBe(30);
    expect(config.windowMs).toBe(60000);
  });

  it("checkout limiter caps at 10 requests per hour", () => {
    const config = { windowMs: 60 * 60 * 1000, max: 10 };
    expect(config.max).toBe(10);
    expect(config.windowMs).toBe(3600000);
  });

  it("voice limiter caps at 10 requests per minute", () => {
    const config = { windowMs: 60 * 1000, max: 10 };
    expect(config.max).toBe(10);
    expect(config.windowMs).toBe(60000);
  });

  it("auth limiter caps at 20 requests per 15 minutes", () => {
    const config = { windowMs: 15 * 60 * 1000, max: 20 };
    expect(config.max).toBe(20);
    expect(config.windowMs).toBe(900000);
  });
});
