import { describe, it, expect, beforeAll } from "vitest";
import { getWarningState, getUsageStats } from "./usage-tracking";
import { getDb } from "./db";
import { users, conversations, messages } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Usage Warning System", () => {
  let testUserId: number;
  let testConversationId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create test user with free tier
    const [user] = await db
      .insert(users)
      .values({
        openId: "test_warning_user",
        name: "Test Warning User",
        email: "warning@test.com",
        loginMethod: "google",
        subscriptionTier: "free",
        subscriptionStatus: "active",
      })
      .$returningId();

    testUserId = user.id;

    // Create test conversation
    const [conv] = await db
      .insert(conversations)
      .values({
        userId: testUserId,
        title: "Test Conversation",
      })
      .$returningId();

    testConversationId = conv.id;
  });

  it("should return 'none' level for 0% usage (0/50 messages)", async () => {
    const result = await getWarningState(testUserId);
    
    expect(result.level).toBe("none");
    expect(result.used).toBe(0);
    expect(result.limit).toBe(50);
    expect(result.remaining).toBe(50);
    expect(result.percentage).toBe(0);
  });

  it("should return 'soft' level for 80% usage (40/50 messages)", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Insert 40 messages
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    for (let i = 0; i < 40; i++) {
      await db.insert(messages).values({
        conversationId: testConversationId,
        role: "user",
        content: `Test message ${i + 1}`,
        model: null,
        createdAt: new Date(startOfMonth.getTime() + i * 60000),
      });
    }

    const result = await getWarningState(testUserId);
    
    expect(result.level).toBe("soft");
    expect(result.used).toBe(40);
    expect(result.limit).toBe(50);
    expect(result.remaining).toBe(10);
    expect(result.percentage).toBe(80);
  });

  it("should return 'urgent' level for 96% usage (48/50 messages)", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Insert 8 more messages to reach 48 total
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    for (let i = 40; i < 48; i++) {
      await db.insert(messages).values({
        conversationId: testConversationId,
        role: "user",
        content: `Test message ${i + 1}`,
        model: null,
        createdAt: new Date(startOfMonth.getTime() + i * 60000),
      });
    }

    const result = await getWarningState(testUserId);
    
    expect(result.level).toBe("urgent");
    expect(result.used).toBe(48);
    expect(result.limit).toBe(50);
    expect(result.remaining).toBe(2);
    expect(result.percentage).toBe(96);
  });

  it("should return 'blocked' level for 100% usage (50/50 messages)", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Insert 2 more messages to reach 50 total
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    for (let i = 48; i < 50; i++) {
      await db.insert(messages).values({
        conversationId: testConversationId,
        role: "user",
        content: `Test message ${i + 1}`,
        model: null,
        createdAt: new Date(startOfMonth.getTime() + i * 60000),
      });
    }

    const result = await getWarningState(testUserId);
    
    expect(result.level).toBe("blocked");
    expect(result.used).toBe(50);
    expect(result.limit).toBe(50);
    expect(result.remaining).toBe(0);
    expect(result.percentage).toBe(100);
  });

  it("should return 'none' level for Pro users regardless of usage", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Upgrade user to Pro
    await db
      .update(users)
      .set({ subscriptionTier: "pro" })
      .where(eq(users.id, testUserId));

    const result = await getWarningState(testUserId);
    
    expect(result.level).toBe("none");
    expect(result.limit).toBe(-1); // Unlimited
    expect(result.remaining).toBe(-1);
  });
});
