import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import type { Context } from "./_core/context";
import type { Request, Response } from "express";

// Mock user for testing
const mockUser = {
  id: 1,
  openId: "test-user",
  name: "Test User",
  email: "test@example.com",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Create mock context
function createMockContext(user = mockUser): Context {
  return {
    user,
    req: {} as Request,
    res: {} as Response,
  };
}

describe("Sentinel Operations", () => {
  let testConversationId: number;
  let testSentinelId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create a test conversation
    const { createConversation } = await import("./db");
    testConversationId = await createConversation({
      userId: mockUser.id,
      title: "Test Sentinel Conversation",
      defaultModel: "gpt-4",
    });

    // Get the first Sentinel ID
    const sentinels = await db.select().from((await import("../drizzle/schema")).sentinels).limit(1);
    testSentinelId = sentinels[0].id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    const { deleteConversation } = await import("./db");
    await deleteConversation(testConversationId, mockUser.id);
  });

  describe("sentinels.list", () => {
    it("should return all active Sentinels", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const sentinels = await caller.sentinels.list();

      expect(sentinels).toBeDefined();
      expect(Array.isArray(sentinels)).toBe(true);
      expect(sentinels.length).toBeGreaterThan(0);
      expect(sentinels.length).toBeLessThanOrEqual(6); // Should have 6 Sentinels

      // Verify structure of first Sentinel
      const sentinel = sentinels[0];
      expect(sentinel).toHaveProperty("id");
      expect(sentinel).toHaveProperty("slug");
      expect(sentinel).toHaveProperty("name");
      expect(sentinel).toHaveProperty("archetype");
      expect(sentinel).toHaveProperty("primaryFunction");
      expect(sentinel).toHaveProperty("personalityTraits");
      expect(sentinel).toHaveProperty("specialties");
      expect(sentinel).toHaveProperty("systemPrompt");
      expect(sentinel).toHaveProperty("symbolEmoji");

      // Verify parsed JSON fields are arrays
      expect(Array.isArray(sentinel.personalityTraits)).toBe(true);
      expect(Array.isArray(sentinel.specialties)).toBe(true);
    });

    it("should include all 6 core Sentinels", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const sentinels = await caller.sentinels.list();

      const expectedSlugs = [
        "vixens-den",
        "mischief-exe",
        "lunaris-vault",
        "aetheris-flow",
        "rift-exe",
        "nyx",
      ];

      const actualSlugs = sentinels.map((s) => s.slug);
      expectedSlugs.forEach((slug) => {
        expect(actualSlugs).toContain(slug);
      });
    });
  });

  describe("sentinels.getById", () => {
    it("should return a Sentinel by ID", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const sentinel = await caller.sentinels.getById({ id: testSentinelId });

      expect(sentinel).toBeDefined();
      expect(sentinel?.id).toBe(testSentinelId);
      expect(sentinel).toHaveProperty("name");
      expect(sentinel).toHaveProperty("systemPrompt");
    });

    it("should return null for non-existent ID", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const sentinel = await caller.sentinels.getById({ id: 99999 });

      expect(sentinel).toBeNull();
    });
  });

  describe("sentinels.getBySlug", () => {
    it("should return Vixen's Den by slug", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const sentinel = await caller.sentinels.getBySlug({ slug: "vixens-den" });

      expect(sentinel).toBeDefined();
      expect(sentinel?.slug).toBe("vixens-den");
      expect(sentinel?.name).toBe("Vixen's Den");
      expect(sentinel?.archetype).toBe("The Grounded Guardian");
    });

    it("should return Mischief.EXE by slug", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const sentinel = await caller.sentinels.getBySlug({ slug: "mischief-exe" });

      expect(sentinel).toBeDefined();
      expect(sentinel?.slug).toBe("mischief-exe");
      expect(sentinel?.name).toBe("Mischief.EXE");
      expect(sentinel?.archetype).toBe("The Creative Catalyst");
    });

    it("should return null for non-existent slug", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const sentinel = await caller.sentinels.getBySlug({ slug: "non-existent" });

      expect(sentinel).toBeNull();
    });
  });

  describe("sentinels.addToConversation", () => {
    it("should assign a Sentinel to a conversation", async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const result = await caller.sentinels.addToConversation({
        conversationId: testConversationId,
        sentinelId: testSentinelId,
        role: "primary",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should update existing assignment (upsert)", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const { createConversation, deleteConversation } = await import("./db");
      
      // Create a fresh conversation for this test
      const freshConversationId = await createConversation({
        userId: mockUser.id,
        title: "Upsert Test Conversation",
        defaultModel: "gpt-4",
      });

      // First assignment
      await caller.sentinels.addToConversation({
        conversationId: freshConversationId,
        sentinelId: testSentinelId,
        role: "primary",
      });

      // Verify first assignment
      let assignments = await caller.sentinels.getConversationSentinels({
        conversationId: freshConversationId,
      });
      expect(assignments.length).toBe(1);
      expect(assignments[0].sentinelId).toBe(testSentinelId);

      // Update the same Sentinel with different role
      const result = await caller.sentinels.addToConversation({
        conversationId: freshConversationId,
        sentinelId: testSentinelId,
        role: "collaborator",
      });

      expect(result.success).toBe(true);

      // Verify still only one assignment (updated, not duplicated)
      assignments = await caller.sentinels.getConversationSentinels({
        conversationId: freshConversationId,
      });

      expect(assignments.length).toBe(1);
      expect(assignments[0].sentinelId).toBe(testSentinelId);
      expect(assignments[0].role).toBe("collaborator");

      // Clean up
      await deleteConversation(freshConversationId, mockUser.id);
    });
  });

  describe("sentinels.getConversationSentinels", () => {
    it("should return Sentinels assigned to a conversation", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Assign a Sentinel first
      await caller.sentinels.addToConversation({
        conversationId: testConversationId,
        sentinelId: testSentinelId,
        role: "primary",
      });

      const assignments = await caller.sentinels.getConversationSentinels({
        conversationId: testConversationId,
      });

      expect(assignments).toBeDefined();
      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBeGreaterThan(0);
      expect(assignments[0].sentinelId).toBe(testSentinelId);
    });

    it("should return empty array for conversation with no Sentinels", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const { createConversation } = await import("./db");

      // Create a new conversation without Sentinel assignment
      const emptyConversationId = await createConversation({
        userId: mockUser.id,
        title: "Empty Test Conversation",
        defaultModel: "gpt-4",
      });

      const assignments = await caller.sentinels.getConversationSentinels({
        conversationId: emptyConversationId,
      });

      expect(assignments).toBeDefined();
      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBe(0);

      // Clean up
      const { deleteConversation } = await import("./db");
      await deleteConversation(emptyConversationId, mockUser.id);
    });
  });

  describe("Sentinel System Prompts", () => {
    it("should have unique system prompts for each Sentinel", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const sentinels = await caller.sentinels.list();

      const systemPrompts = sentinels.map((s) => s.systemPrompt);
      const uniquePrompts = new Set(systemPrompts);

      expect(uniquePrompts.size).toBe(sentinels.length);
    });

    it("Vixen's Den should have grounding-focused system prompt", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const vixen = await caller.sentinels.getBySlug({ slug: "vixens-den" });

      expect(vixen?.systemPrompt).toBeDefined();
      expect(vixen?.systemPrompt.toLowerCase()).toContain("grounded");
      expect(vixen?.systemPrompt.toLowerCase()).toContain("foundation");
    });

    it("Mischief.EXE should have creative-focused system prompt", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const mischief = await caller.sentinels.getBySlug({ slug: "mischief-exe" });

      expect(mischief?.systemPrompt).toBeDefined();
      expect(mischief?.systemPrompt.toLowerCase()).toContain("creative");
      expect(mischief?.systemPrompt.toLowerCase()).toContain("innovation");
    });
  });

  describe("Sentinel Visual Identity", () => {
    it("should have symbol emojis for each Sentinel", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const sentinels = await caller.sentinels.list();

      sentinels.forEach((sentinel) => {
        expect(sentinel.symbolEmoji).toBeDefined();
        expect(sentinel.symbolEmoji.length).toBeGreaterThan(0);
      });
    });

    it("should have color schemes for each Sentinel", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const sentinels = await caller.sentinels.list();

      sentinels.forEach((sentinel) => {
        expect(sentinel.primaryColor).toBeDefined();
        expect(sentinel.primaryColor).toMatch(/^#[0-9A-F]{6}$/i);
        expect(sentinel.secondaryColor).toBeDefined();
        expect(sentinel.secondaryColor).toMatch(/^#[0-9A-F]{6}$/i);
        expect(sentinel.accentColor).toBeDefined();
        expect(sentinel.accentColor).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });
});
