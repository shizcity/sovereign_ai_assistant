import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { conversations, conversationSentinels, sentinels } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Multi-Sentinel Conversations", () => {
  let testUserId: number;
  let conversationId: number;
  let sentinel1Id: number;
  let sentinel2Id: number;
  let sentinel3Id: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    testUserId = 1; // Assuming user with ID 1 exists from auth tests

    // Get existing Sentinels (Vixen, Mischief.EXE, Lunaris.Vault)
    const allSentinels = await db.select().from(sentinels).limit(3);
    sentinel1Id = allSentinels[0].id;
    sentinel2Id = allSentinels[1].id;
    sentinel3Id = allSentinels[2].id;

    // Create a test conversation using the helper function
    const { createConversation } = await import("./db");
    conversationId = await createConversation({
      userId: testUserId,
      title: "Multi-Sentinel Test",
      defaultModel: "gpt-4",
    });
  });

  it("should add multiple Sentinels to a conversation", async () => {
    const caller = appRouter.createCaller({ user: { id: testUserId, role: "user" } } as any);

    // Add first Sentinel as primary
    await caller.sentinels.addToConversation({
      conversationId,
      sentinelId: sentinel1Id,
      role: "primary",
    });

    // Add second Sentinel as collaborator
    await caller.sentinels.addToConversation({
      conversationId,
      sentinelId: sentinel2Id,
      role: "collaborator",
    });

    // Add third Sentinel as collaborator
    await caller.sentinels.addToConversation({
      conversationId,
      sentinelId: sentinel3Id,
      role: "collaborator",
    });

    // Verify all three Sentinels are added
    const result = await caller.sentinels.getConversationSentinels({ conversationId });
    expect(result).toHaveLength(3);
    expect(result.find((cs: any) => cs.sentinelId === sentinel1Id)?.role).toBe("primary");
    expect(result.find((cs: any) => cs.sentinelId === sentinel2Id)?.role).toBe("collaborator");
    expect(result.find((cs: any) => cs.sentinelId === sentinel3Id)?.role).toBe("collaborator");
  });

  it("should rotate Sentinels based on message count", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const caller = appRouter.createCaller({ user: { id: testUserId, role: "user" } } as any);

    // Add two Sentinels
    await caller.sentinels.addToConversation({
      conversationId,
      sentinelId: sentinel1Id,
      role: "primary",
    });
    await caller.sentinels.addToConversation({
      conversationId,
      sentinelId: sentinel2Id,
      role: "collaborator",
    });

    // Simulate message count updates
    const { updateSentinelMessageCount } = await import("./sentinels-db");
    
    // Sentinel 1 responds twice
    await updateSentinelMessageCount(conversationId, sentinel1Id);
    await updateSentinelMessageCount(conversationId, sentinel1Id);
    
    // Sentinel 2 responds once
    await updateSentinelMessageCount(conversationId, sentinel2Id);

    // Check message counts
    const sentinelsAfter = await caller.sentinels.getConversationSentinels({ conversationId });
    const s1 = sentinelsAfter.find((cs: any) => cs.sentinelId === sentinel1Id);
    const s2 = sentinelsAfter.find((cs: any) => cs.sentinelId === sentinel2Id);

    expect(s1?.messageCount).toBe(2);
    expect(s2?.messageCount).toBe(1);

    // The rotation logic in routers.ts will select s2 next (lowest count)
  });

  it("should remove a Sentinel from conversation", async () => {
    const caller = appRouter.createCaller({ user: { id: testUserId, role: "user" } } as any);

    // Add two Sentinels
    await caller.sentinels.addToConversation({
      conversationId,
      sentinelId: sentinel1Id,
      role: "primary",
    });
    await caller.sentinels.addToConversation({
      conversationId,
      sentinelId: sentinel2Id,
      role: "collaborator",
    });

    // Verify both are added
    let result = await caller.sentinels.getConversationSentinels({ conversationId });
    expect(result).toHaveLength(2);

    // Remove second Sentinel
    await caller.sentinels.removeFromConversation({
      conversationId,
      sentinelId: sentinel2Id,
    });

    // Verify only one remains
    result = await caller.sentinels.getConversationSentinels({ conversationId });
    expect(result).toHaveLength(1);
    expect(result[0].sentinelId).toBe(sentinel1Id);
  });

  it("should list all Sentinels in a conversation", async () => {
    const caller = appRouter.createCaller({ user: { id: testUserId, role: "user" } } as any);

    // Add three Sentinels
    await caller.sentinels.addToConversation({
      conversationId,
      sentinelId: sentinel1Id,
      role: "primary",
    });
    await caller.sentinels.addToConversation({
      conversationId,
      sentinelId: sentinel2Id,
      role: "collaborator",
    });
    await caller.sentinels.addToConversation({
      conversationId,
      sentinelId: sentinel3Id,
      role: "collaborator",
    });

    const result = await caller.sentinels.getConversationSentinels({ conversationId });
    
    expect(result).toHaveLength(3);
    expect(result.every((cs: any) => cs.sentinelName)).toBe(true); // Has joined Sentinel data
    expect(result.every((cs: any) => cs.symbolEmoji)).toBe(true); // Has emoji
    expect(result.every((cs: any) => cs.systemPrompt)).toBe(true); // Has system prompt
  });

  it("should track message count per Sentinel", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const caller = appRouter.createCaller({ user: { id: testUserId, role: "user" } } as any);

    // Add Sentinel
    await caller.sentinels.addToConversation({
      conversationId,
      sentinelId: sentinel1Id,
      role: "primary",
    });

    // Initial message count should be 0
    let result = await caller.sentinels.getConversationSentinels({ conversationId });
    expect(result[0].messageCount).toBe(0);

    // Update message count
    const { updateSentinelMessageCount } = await import("./sentinels-db");
    await updateSentinelMessageCount(conversationId, sentinel1Id);
    await updateSentinelMessageCount(conversationId, sentinel1Id);
    await updateSentinelMessageCount(conversationId, sentinel1Id);

    // Check updated count
    result = await caller.sentinels.getConversationSentinels({ conversationId });
    expect(result[0].messageCount).toBe(3);
  });
});
