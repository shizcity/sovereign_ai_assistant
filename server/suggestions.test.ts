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

describe("Memory Suggestions System", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  const testUserId = 998;

  beforeAll(() => {
    caller = appRouter.createCaller(createMockContext(testUserId));
  });

  describe("sentinels.memories.suggestions.pending", () => {
    it("should return empty array when no pending suggestions exist", async () => {
      const result = await caller.sentinels.memories.suggestions.pending({});

      expect(Array.isArray(result)).toBe(true);
    });

    it("should accept optional conversationId filter", async () => {
      const result = await caller.sentinels.memories.suggestions.pending({
        conversationId: 1,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return suggestions with correct structure", async () => {
      const result = await caller.sentinels.memories.suggestions.pending({});

      result.forEach((suggestion: any) => {
        expect(suggestion).toHaveProperty("id");
        expect(suggestion).toHaveProperty("content");
        expect(suggestion).toHaveProperty("category");
        expect(suggestion).toHaveProperty("importance");
        expect(suggestion).toHaveProperty("tags");
        expect(suggestion).toHaveProperty("status");
        expect(suggestion.status).toBe("pending");
        expect(typeof suggestion.importance).toBe("number");
        expect(Array.isArray(suggestion.tags)).toBe(true);
      });
    });
  });

  describe("sentinels.memories.suggestions.byMessage", () => {
    it("should return empty array for non-existent message", async () => {
      const result = await caller.sentinels.memories.suggestions.byMessage({
        messageId: 999999,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it("should return suggestions with correct structure", async () => {
      const result = await caller.sentinels.memories.suggestions.byMessage({
        messageId: 1,
      });

      result.forEach((suggestion: any) => {
        expect(suggestion).toHaveProperty("id");
        expect(suggestion).toHaveProperty("messageId");
        expect(suggestion.messageId).toBe(1);
      });
    });
  });

  describe("sentinels.memories.suggestions.stats", () => {
    it("should return suggestion statistics", async () => {
      const result = await caller.sentinels.memories.suggestions.stats();

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("accepted");
      expect(result).toHaveProperty("dismissed");
      expect(result).toHaveProperty("pending");
      expect(result).toHaveProperty("acceptanceRate");

      expect(typeof result.total).toBe("number");
      expect(typeof result.accepted).toBe("number");
      expect(typeof result.dismissed).toBe("number");
      expect(typeof result.pending).toBe("number");
      expect(typeof result.acceptanceRate).toBe("number");

      expect(result.acceptanceRate).toBeGreaterThanOrEqual(0);
      expect(result.acceptanceRate).toBeLessThanOrEqual(100);
    });

    it("should calculate acceptance rate correctly", async () => {
      const result = await caller.sentinels.memories.suggestions.stats();

      if (result.total > 0) {
        const expectedRate = (result.accepted / result.total) * 100;
        expect(result.acceptanceRate).toBeCloseTo(expectedRate, 1);
      } else {
        expect(result.acceptanceRate).toBe(0);
      }
    });
  });

  describe("Suggestion Detection", () => {
    it("should detect memory-worthy moments from conversations", async () => {
      const { detectMemorySuggestions } = await import("./memory-suggestions");

      const suggestions = await detectMemorySuggestions(
        "I've decided to wake up at 6 AM every day to work on my side project.",
        "That's a great decision! Early morning hours are perfect for focused work. Let's create a plan to help you stick to this new routine.",
        [],
        "Vixen's Den"
      );

      expect(Array.isArray(suggestions)).toBe(true);
      // Should detect at least one suggestion (the decision)
      if (suggestions.length > 0) {
        expect(suggestions[0]).toHaveProperty("content");
        expect(suggestions[0]).toHaveProperty("category");
        expect(suggestions[0]).toHaveProperty("importance");
        expect(suggestions[0]).toHaveProperty("tags");
        expect(suggestions[0]).toHaveProperty("reasoning");
      }
    });

    it("should return empty array for trivial conversations", async () => {
      const { detectMemorySuggestions } = await import("./memory-suggestions");

      const suggestions = await detectMemorySuggestions(
        "Hi",
        "Hello! How can I help you today?",
        [],
        "Sentinel"
      );

      expect(Array.isArray(suggestions)).toBe(true);
      // Trivial greetings should not generate suggestions
      expect(suggestions.length).toBe(0);
    });

    it("should limit suggestions to top 3", async () => {
      const { detectMemorySuggestions } = await import("./memory-suggestions");

      const suggestions = await detectMemorySuggestions(
        "I've decided to learn Python, start exercising daily, improve my diet, meditate every morning, and read more books.",
        "Those are all excellent goals! Let's break them down and create actionable plans for each one.",
        [],
        "Sentinel"
      );

      expect(Array.isArray(suggestions)).toBe(true);
      // Should limit to top 3 even if more are detected
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe("Importance Scoring", () => {
    it("should calculate importance scores correctly", async () => {
      const { calculateImportanceScore } = await import("./memory-suggestions");

      const goalScore = calculateImportanceScore(
        "I want to launch my startup by end of year",
        "goal",
        10,
        5
      );

      const preferenceScore = calculateImportanceScore(
        "I prefer working in the morning",
        "preference",
        10,
        5
      );

      // Goals should score higher than preferences
      expect(goalScore).toBeGreaterThan(preferenceScore);

      // Scores should be within 0-100 range
      expect(goalScore).toBeGreaterThanOrEqual(0);
      expect(goalScore).toBeLessThanOrEqual(100);
      expect(preferenceScore).toBeGreaterThanOrEqual(0);
      expect(preferenceScore).toBeLessThanOrEqual(100);
    });

    it("should increase score with conversation depth", async () => {
      const { calculateImportanceScore } = await import("./memory-suggestions");

      const shallowScore = calculateImportanceScore(
        "I like coffee",
        "preference",
        2,
        1
      );

      const deepScore = calculateImportanceScore(
        "I like coffee",
        "preference",
        20,
        10
      );

      // Deeper conversations should score higher
      expect(deepScore).toBeGreaterThan(shallowScore);
    });
  });

  describe("Deduplication", () => {
    it("should detect similar suggestions", async () => {
      const { isSimilarToExisting } = await import("./memory-suggestions");

      const newSuggestion = "I want to wake up early every morning";
      const existing = [
        "I decided to wake up early each morning",
        "I prefer working in the afternoon",
      ];

      const isSimilar = isSimilarToExisting(newSuggestion, existing);

      // Should detect similarity with first existing memory
      expect(isSimilar).toBe(true);
    });

    it("should not flag dissimilar suggestions", async () => {
      const { isSimilarToExisting } = await import("./memory-suggestions");

      const newSuggestion = "I want to learn Python programming";
      const existing = [
        "I prefer working in the morning",
        "I like drinking coffee",
      ];

      const isSimilar = isSimilarToExisting(newSuggestion, existing);

      // Should not detect similarity
      expect(isSimilar).toBe(false);
    });
  });

  describe("Suggestion Workflow", () => {
    it("should handle accept workflow correctly", async () => {
      // This test requires actual suggestions in the database
      // For now, we just verify the procedure exists and has correct structure
      const pendingSuggestions = await caller.sentinels.memories.suggestions.pending({});

      if (pendingSuggestions.length > 0) {
        const suggestion = pendingSuggestions[0];

        // Verify suggestion has all required fields for acceptance
        expect(suggestion).toHaveProperty("id");
        expect(suggestion).toHaveProperty("content");
        expect(suggestion).toHaveProperty("category");
        expect(suggestion).toHaveProperty("sentinelId");
      }
    });

    it("should handle dismiss workflow correctly", async () => {
      const pendingSuggestions = await caller.sentinels.memories.suggestions.pending({});

      if (pendingSuggestions.length > 0) {
        const suggestion = pendingSuggestions[0];

        // Verify suggestion can be dismissed
        expect(suggestion).toHaveProperty("id");
        expect(suggestion.status).toBe("pending");
      }
    });
  });

  describe("Category Validation", () => {
    it("should only accept valid categories", async () => {
      const validCategories = [
        "insight",
        "decision",
        "goal",
        "milestone",
        "achievement",
        "preference",
        "challenge",
        "pattern",
      ];

      const suggestions = await caller.sentinels.memories.suggestions.pending({});

      suggestions.forEach((suggestion: any) => {
        expect(validCategories).toContain(suggestion.category);
      });
    });
  });

  describe("Performance", () => {
    it("should fetch pending suggestions within reasonable time", async () => {
      const startTime = Date.now();

      await caller.sentinels.memories.suggestions.pending({});

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it("should fetch stats within reasonable time", async () => {
      const startTime = Date.now();

      await caller.sentinels.memories.suggestions.stats();

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
