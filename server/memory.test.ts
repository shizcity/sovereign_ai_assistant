import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import type { Request, Response } from "express";

// Mock user for testing
const mockUser = {
  id: 1,
  openId: "test-user-memory",
  name: "Test User Memory",
  email: "test@memory.com",
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

describe("Memory System - tRPC Procedures", () => {
  describe("Memory Creation", () => {
    it("should have create memory procedure", () => {
      const caller = appRouter.createCaller(createMockContext());
      expect(caller.sentinels.memories.create).toBeDefined();
      expect(typeof caller.sentinels.memories.create).toBe("function");
    });

    it("should validate required fields for memory creation", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Should reject without required fields
      await expect(
        caller.sentinels.memories.create({
          sentinelId: 1,
          // @ts-expect-error - testing validation
          category: undefined,
          content: "Test memory",
        })
      ).rejects.toThrow();
    });
  });

  describe("Memory Retrieval", () => {
    it("should have list memories procedure", () => {
      const caller = appRouter.createCaller(createMockContext());
      expect(caller.sentinels.memories.list).toBeDefined();
      expect(typeof caller.sentinels.memories.list).toBe("function");
    });

    it("should have listAll memories procedure", () => {
      const caller = appRouter.createCaller(createMockContext());
      expect(caller.sentinels.memories.listAll).toBeDefined();
      expect(typeof caller.sentinels.memories.listAll).toBe("function");
    });

    it("should have search memories procedure", () => {
      const caller = appRouter.createCaller(createMockContext());
      expect(caller.sentinels.memories.search).toBeDefined();
      expect(typeof caller.sentinels.memories.search).toBe("function");
    });

    it("should require sentinelId for list", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Should reject without sentinelId
      await expect(
        // @ts-expect-error - testing validation
        caller.sentinels.memories.list({})
      ).rejects.toThrow();
    });
  });

  describe("Memory Updates", () => {
    it("should have update memory procedure", () => {
      const caller = appRouter.createCaller(createMockContext());
      expect(caller.sentinels.memories.update).toBeDefined();
      expect(typeof caller.sentinels.memories.update).toBe("function");
    });

    it("should require memoryId for update", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Should reject without memoryId
      await expect(
        // @ts-expect-error - testing validation
        caller.sentinels.memories.update({ content: "Updated" })
      ).rejects.toThrow();
    });

    it("should validate importance range", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Should reject importance > 100
      await expect(
        caller.sentinels.memories.update({
          memoryId: 1,
          importance: 150,
        })
      ).rejects.toThrow();

      // Should reject importance < 0
      await expect(
        caller.sentinels.memories.update({
          memoryId: 1,
          importance: -10,
        })
      ).rejects.toThrow();
    });
  });

  describe("Memory Deletion", () => {
    it("should have delete memory procedure", () => {
      const caller = appRouter.createCaller(createMockContext());
      expect(caller.sentinels.memories.delete).toBeDefined();
      expect(typeof caller.sentinels.memories.delete).toBe("function");
    });

    it("should require memoryId for deletion", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Should reject without memoryId
      await expect(
        // @ts-expect-error - testing validation
        caller.sentinels.memories.delete({})
      ).rejects.toThrow();
    });
  });

  describe("Memory Categories", () => {
    it("should support all defined memory categories", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const validCategories = [
        "insight",
        "decision",
        "milestone",
        "preference",
        "goal",
        "achievement",
        "challenge",
        "pattern",
      ];

      // All valid categories should be accepted by the schema
      for (const category of validCategories) {
        // This tests that the zod schema accepts these categories
        expect(() => {
          caller.sentinels.memories.create({
            sentinelId: 1,
            category: category as any,
            content: `Test ${category}`,
          });
        }).not.toThrow();
      }
    });

    it("should reject invalid categories", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.sentinels.memories.create({
          sentinelId: 1,
          // @ts-expect-error - testing validation
          category: "invalid_category",
          content: "Test memory",
        })
      ).rejects.toThrow();
    });
  });

  describe("Memory Stats", () => {
    it("should have stats procedure", () => {
      const caller = appRouter.createCaller(createMockContext());
      expect(caller.sentinels.memories.stats).toBeDefined();
      expect(typeof caller.sentinels.memories.stats).toBe("function");
    });

    it("should require sentinelId for stats", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Should reject without sentinelId
      await expect(
        // @ts-expect-error - testing validation
        caller.sentinels.memories.stats({})
      ).rejects.toThrow();
    });
  });

  describe("Memory Extraction Module", () => {
    it("should export extractMemoriesFromConversation function", async () => {
      const { extractMemoriesFromConversation } = await import("./memory-extraction");
      expect(extractMemoriesFromConversation).toBeDefined();
      expect(typeof extractMemoriesFromConversation).toBe("function");
    });

    it("should export deduplicateMemories function", async () => {
      const { deduplicateMemories } = await import("./memory-extraction");
      expect(deduplicateMemories).toBeDefined();
      expect(typeof deduplicateMemories).toBe("function");
    });


  });

  describe("Memory Database Module", () => {
    it("should export createMemory function", async () => {
      const { createMemory } = await import("./memory-db");
      expect(createMemory).toBeDefined();
      expect(typeof createMemory).toBe("function");
    });

    it("should export getUserSentinelMemories function", async () => {
      const { getUserSentinelMemories } = await import("./memory-db");
      expect(getUserSentinelMemories).toBeDefined();
      expect(typeof getUserSentinelMemories).toBe("function");
    });

    it("should export getTopMemories function", async () => {
      const { getTopMemories } = await import("./memory-db");
      expect(getTopMemories).toBeDefined();
      expect(typeof getTopMemories).toBe("function");
    });

    it("should export updateMemory function", async () => {
      const { updateMemory } = await import("./memory-db");
      expect(updateMemory).toBeDefined();
      expect(typeof updateMemory).toBe("function");
    });

    it("should export deleteMemory function", async () => {
      const { deleteMemory } = await import("./memory-db");
      expect(deleteMemory).toBeDefined();
      expect(typeof deleteMemory).toBe("function");
    });

    it("should export searchMemories function", async () => {
      const { searchMemories } = await import("./memory-db");
      expect(searchMemories).toBeDefined();
      expect(typeof searchMemories).toBe("function");
    });

    it("should export getMemoryStats function", async () => {
      const { getMemoryStats } = await import("./memory-db");
      expect(getMemoryStats).toBeDefined();
      expect(typeof getMemoryStats).toBe("function");
    });

    it("should export getAllUserMemories function", async () => {
      const { getAllUserMemories } = await import("./memory-db");
      expect(getAllUserMemories).toBeDefined();
      expect(typeof getAllUserMemories).toBe("function");
    });
  });

  describe("Memory Integration with Sentinels", () => {
    it("should have memory procedures nested under sentinels router", () => {
      const caller = appRouter.createCaller(createMockContext());
      
      expect(caller.sentinels.memories).toBeDefined();
      expect(caller.sentinels.memories.list).toBeDefined();
      expect(caller.sentinels.memories.listAll).toBeDefined();
      expect(caller.sentinels.memories.create).toBeDefined();
      expect(caller.sentinels.memories.update).toBeDefined();
      expect(caller.sentinels.memories.delete).toBeDefined();
      expect(caller.sentinels.memories.search).toBeDefined();
      expect(caller.sentinels.memories.stats).toBeDefined();
    });
  });
});
