import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { FREE_TIER_SENTINEL_SLUGS, getSentinelLimit, getMessageLimit } from "./products";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockContext(user: any) {
  return { user, req: {} as any, res: {} as any };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Tier Enforcement", () => {
  let proUserId: number;
  let freeUserId: number;
  const proOpenId = `tier-test-pro-${Date.now()}`;
  const freeOpenId = `tier-test-free-${Date.now()}`;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [proUser] = await db
      .insert(users)
      .values({
        openId: proOpenId,
        name: "Pro Tier Test",
        email: `tier-pro-${Date.now()}@example.com`,
        loginMethod: "google",
        subscriptionTier: "pro",
        subscriptionStatus: "active",
      })
      .$returningId();
    proUserId = proUser.id;

    const [freeUser] = await db
      .insert(users)
      .values({
        openId: freeOpenId,
        name: "Free Tier Test",
        email: `tier-free-${Date.now()}@example.com`,
        loginMethod: "google",
        subscriptionTier: "free",
        subscriptionStatus: "active",
      })
      .$returningId();
    freeUserId = freeUser.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    await db.delete(users).where(eq(users.openId, proOpenId));
    await db.delete(users).where(eq(users.openId, freeOpenId));
  });

  // ── products.ts constants ──────────────────────────────────────────────────

  describe("products.ts constants", () => {
    it("should define exactly 3 Free-tier Sentinel slugs", () => {
      expect(FREE_TIER_SENTINEL_SLUGS).toHaveLength(3);
      expect(FREE_TIER_SENTINEL_SLUGS).toContain("vixens-den");
      expect(FREE_TIER_SENTINEL_SLUGS).toContain("mischief-exe");
      expect(FREE_TIER_SENTINEL_SLUGS).toContain("lunaris-vault");
    });

    it("should return 50 as the message limit for free tier", () => {
      expect(getMessageLimit("free")).toBe(50);
    });

    it("should return -1 (unlimited) as the message limit for pro tier", () => {
      expect(getMessageLimit("pro")).toBe(-1);
    });

    it("should return 3 as the Sentinel limit for free tier", () => {
      expect(getSentinelLimit("free")).toBe(3);
    });

    it("should return 6 as the Sentinel limit for pro tier", () => {
      expect(getSentinelLimit("pro")).toBe(6);
    });
  });

  // ── sentinels.list — tier filtering ───────────────────────────────────────

  describe("sentinels.list — tier filtering", () => {
    it("should return only 3 Sentinels for free-tier users", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const freeUser = await db.select().from(users).where(eq(users.id, freeUserId)).then(r => r[0]);

      const caller = appRouter.createCaller(createMockContext(freeUser));
      const result = await caller.sentinels.list();

      expect(result).toHaveLength(3);
    });

    it("should only include Free-tier Sentinels (vixens-den, mischief-exe, lunaris-vault) for free users", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const freeUser = await db.select().from(users).where(eq(users.id, freeUserId)).then(r => r[0]);

      const caller = appRouter.createCaller(createMockContext(freeUser));
      const result = await caller.sentinels.list();

      const slugs = result.map((s) => s.slug);
      expect(slugs).toContain("vixens-den");
      expect(slugs).toContain("mischief-exe");
      expect(slugs).toContain("lunaris-vault");

      // Pro-only Sentinels must NOT appear
      expect(slugs).not.toContain("aetheris-flow");
      expect(slugs).not.toContain("rift-exe");
      expect(slugs).not.toContain("nyx");
    });

    it("should return all 6 Sentinels for pro-tier users", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const proUser = await db.select().from(users).where(eq(users.id, proUserId)).then(r => r[0]);

      const caller = appRouter.createCaller(createMockContext(proUser));
      const result = await caller.sentinels.list();

      expect(result.length).toBeGreaterThanOrEqual(6);
    });

    it("should include all 6 Sentinel slugs for pro users", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const proUser = await db.select().from(users).where(eq(users.id, proUserId)).then(r => r[0]);

      const caller = appRouter.createCaller(createMockContext(proUser));
      const result = await caller.sentinels.list();

      const slugs = result.map((s) => s.slug);
      expect(slugs).toContain("vixens-den");
      expect(slugs).toContain("mischief-exe");
      expect(slugs).toContain("lunaris-vault");
      expect(slugs).toContain("aetheris-flow");
      expect(slugs).toContain("rift-exe");
      expect(slugs).toContain("nyx");
    });

    it("should treat unauthenticated callers as free tier (3 Sentinels)", async () => {
      const caller = appRouter.createCaller(createMockContext(null));
      const result = await caller.sentinels.list();

      expect(result).toHaveLength(3);
    });
  });

  // ── Multi-Sentinel gate ────────────────────────────────────────────────────

  describe("Multi-Sentinel gate", () => {
    it("should block free users from adding a second Sentinel to a conversation", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const freeUser = await db.select().from(users).where(eq(users.id, freeUserId)).then(r => r[0]);

      // Create a conversation for the free user
      const { createConversation } = await import("./db");
      const conversationId = await createConversation({
        userId: freeUserId,
        title: "Tier Test Conversation",
      });

      // Get two Sentinels
      const allSentinels = await db.select().from(await import("../drizzle/schema").then(m => m.sentinels)).limit(2);
      const [s1, s2] = allSentinels;

      // Add first Sentinel — should succeed
      const { addSentinelToConversation } = await import("./sentinels-db");
      await addSentinelToConversation(conversationId, s1.id, "primary");

      // Attempt to add second Sentinel — should fail with FORBIDDEN
      const caller = appRouter.createCaller(createMockContext(freeUser));
      await expect(
        caller.sentinels.addToConversation({
          conversationId,
          sentinelId: s2.id,
          role: "collaborator",
        })
      ).rejects.toThrow("Multi-Sentinel conversations are a Pro feature");

      // Cleanup
      const { conversations } = await import("../drizzle/schema");
      await db.delete(conversations).where(eq(conversations.id, conversationId));
    });

    it("should allow pro users to add multiple Sentinels to a conversation", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const proUser = await db.select().from(users).where(eq(users.id, proUserId)).then(r => r[0]);

      const { createConversation } = await import("./db");
      const conversationId = await createConversation({
        userId: proUserId,
        title: "Pro Multi-Sentinel Test",
      });

      const allSentinels = await db.select().from(await import("../drizzle/schema").then(m => m.sentinels)).limit(2);
      const [s1, s2] = allSentinels;

      const { addSentinelToConversation } = await import("./sentinels-db");
      await addSentinelToConversation(conversationId, s1.id, "primary");

      const caller = appRouter.createCaller(createMockContext(proUser));
      // Should NOT throw
      await expect(
        caller.sentinels.addToConversation({
          conversationId,
          sentinelId: s2.id,
          role: "collaborator",
        })
      ).resolves.toBeDefined();

      // Cleanup
      const { conversations } = await import("../drizzle/schema");
      await db.delete(conversations).where(eq(conversations.id, conversationId));
    });
  });
});
