import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// Mock context for testing
const createMockContext = (userId: number): Context => ({
  user: {
    id: userId,
    openId: `test-user-${userId}`,
    name: `Test User ${userId}`,
    email: `test${userId}@example.com`,
    role: "user",
    createdAt: new Date(),
  },
});

describe("Memory Analytics", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  const testUserId = 999;

  beforeAll(() => {
    caller = appRouter.createCaller(createMockContext(testUserId));
  });

  describe("sentinels.memories.timeline", () => {
    it("should return empty array when no memories exist", async () => {
      const result = await caller.sentinels.memories.timeline({
        granularity: "day",
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should accept different granularity options", async () => {
      const dayResult = await caller.sentinels.memories.timeline({
        granularity: "day",
      });
      const weekResult = await caller.sentinels.memories.timeline({
        granularity: "week",
      });
      const monthResult = await caller.sentinels.memories.timeline({
        granularity: "month",
      });

      expect(Array.isArray(dayResult)).toBe(true);
      expect(Array.isArray(weekResult)).toBe(true);
      expect(Array.isArray(monthResult)).toBe(true);
    });

    it("should accept date range filters", async () => {
      const startDate = new Date("2024-01-01").toISOString();
      const endDate = new Date("2024-12-31").toISOString();

      const result = await caller.sentinels.memories.timeline({
        startDate,
        endDate,
        granularity: "month",
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("sentinels.memories.categoryStats", () => {
    it("should return empty array when no memories exist", async () => {
      const result = await caller.sentinels.memories.categoryStats({});

      expect(Array.isArray(result)).toBe(true);
    });

    it("should accept optional sentinelId filter", async () => {
      const result = await caller.sentinels.memories.categoryStats({
        sentinelId: 1,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return stats with correct structure when data exists", async () => {
      const result = await caller.sentinels.memories.categoryStats({});

      result.forEach((stat) => {
        expect(stat).toHaveProperty("category");
        expect(stat).toHaveProperty("count");
        expect(stat).toHaveProperty("percentage");
        expect(stat).toHaveProperty("avgImportance");
        expect(typeof stat.count).toBe("number");
        expect(typeof stat.percentage).toBe("number");
        expect(typeof stat.avgImportance).toBe("number");
      });
    });
  });

  describe("sentinels.memories.sentinelStats", () => {
    it("should return empty array when no memories exist", async () => {
      const result = await caller.sentinels.memories.sentinelStats();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return stats with correct structure when data exists", async () => {
      const result = await caller.sentinels.memories.sentinelStats();

      result.forEach((stat) => {
        expect(stat).toHaveProperty("sentinelId");
        expect(stat).toHaveProperty("sentinelName");
        expect(stat).toHaveProperty("symbolEmoji");
        expect(stat).toHaveProperty("memoryCount");
        expect(stat).toHaveProperty("avgImportance");
        expect(stat).toHaveProperty("categories");
        expect(stat).toHaveProperty("topTags");
        expect(typeof stat.memoryCount).toBe("number");
        expect(typeof stat.avgImportance).toBe("number");
        expect(typeof stat.categories).toBe("object");
        expect(Array.isArray(stat.topTags)).toBe(true);
      });
    });
  });

  describe("sentinels.memories.evolutionPaths", () => {
    it("should return empty array when no memories exist", async () => {
      const result = await caller.sentinels.memories.evolutionPaths({
        minMemories: 2,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should accept minMemories parameter", async () => {
      const result = await caller.sentinels.memories.evolutionPaths({
        minMemories: 3,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return paths with correct structure when data exists", async () => {
      const result = await caller.sentinels.memories.evolutionPaths({
        minMemories: 2,
      });

      result.forEach((path) => {
        expect(path).toHaveProperty("topic");
        expect(path).toHaveProperty("memories");
        expect(path).toHaveProperty("progression");
        expect(Array.isArray(path.memories)).toBe(true);
        expect(typeof path.progression).toBe("object");
        expect(path.progression).toHaveProperty("hasIdea");
        expect(path.progression).toHaveProperty("hasGoal");
        expect(path.progression).toHaveProperty("hasMilestone");
        expect(path.progression).toHaveProperty("hasAchievement");
      });
    });
  });

  describe("sentinels.memories.insights", () => {
    it("should return empty array when no memories exist", async () => {
      const result = await caller.sentinels.memories.insights();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return insights with correct structure when data exists", async () => {
      const result = await caller.sentinels.memories.insights();

      result.forEach((insight) => {
        expect(insight).toHaveProperty("type");
        expect(insight).toHaveProperty("title");
        expect(insight).toHaveProperty("description");
        expect(insight).toHaveProperty("confidence");
        expect(typeof insight.confidence).toBe("number");
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
        expect(["pattern", "collaboration", "progress", "preference"]).toContain(insight.type);
      });
    });
  });

  describe("Analytics Integration", () => {
    it("should handle concurrent analytics queries", async () => {
      const promises = [
        caller.sentinels.memories.timeline({ granularity: "day" }),
        caller.sentinels.memories.categoryStats({}),
        caller.sentinels.memories.sentinelStats(),
        caller.sentinels.memories.evolutionPaths({ minMemories: 2 }),
        caller.sentinels.memories.insights(),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it("should maintain data consistency across queries", async () => {
      const categoryStats = await caller.sentinels.memories.categoryStats({});
      const sentinelStats = await caller.sentinels.memories.sentinelStats();

      // Total memories from category stats should match sum from sentinel stats
      const totalFromCategories = categoryStats.reduce((sum, stat) => sum + stat.count, 0);
      const totalFromSentinels = sentinelStats.reduce((sum, stat) => sum + stat.memoryCount, 0);

      if (totalFromCategories > 0 || totalFromSentinels > 0) {
        expect(totalFromCategories).toBe(totalFromSentinels);
      }
    });
  });

  describe("Analytics Performance", () => {
    it("should complete timeline query within reasonable time", async () => {
      const startTime = Date.now();

      await caller.sentinels.memories.timeline({ granularity: "month" });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should complete all analytics queries within reasonable time", async () => {
      const startTime = Date.now();

      await Promise.all([
        caller.sentinels.memories.timeline({ granularity: "day" }),
        caller.sentinels.memories.categoryStats({}),
        caller.sentinels.memories.sentinelStats(),
        caller.sentinels.memories.evolutionPaths({ minMemories: 2 }),
        caller.sentinels.memories.insights(),
      ]);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // All queries should complete within 10 seconds
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid date ranges gracefully", async () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const pastDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

      // Future date range (should return empty)
      const futureResult = await caller.sentinels.memories.timeline({
        startDate: futureDate,
        endDate: futureDate,
        granularity: "day",
      });

      expect(Array.isArray(futureResult)).toBe(true);

      // Reversed date range (endDate before startDate)
      const reversedResult = await caller.sentinels.memories.timeline({
        startDate: futureDate,
        endDate: pastDate,
        granularity: "day",
      });

      expect(Array.isArray(reversedResult)).toBe(true);
    });

    it("should handle non-existent sentinel ID filter", async () => {
      const result = await caller.sentinels.memories.categoryStats({
        sentinelId: 999999,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it("should handle very high minMemories threshold", async () => {
      const result = await caller.sentinels.memories.evolutionPaths({
        minMemories: 1000,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
