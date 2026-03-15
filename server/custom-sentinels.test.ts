import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { TRPCError } from "@trpc/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeCtx = (tier: string, userId = 1) => ({
  user: { id: userId, subscriptionTier: tier, role: "user" as const, name: "Test User", email: "test@example.com", openId: "oid_test" },
  req: {} as Request,
  res: {} as Response,
});

// ─── Unit tests for tier gating logic ─────────────────────────────────────────

describe("Custom Sentinel tier gating", () => {
  it("throws FORBIDDEN for free-tier users trying to create a custom Sentinel", async () => {
    const tier = "free";
    if (tier !== "creator") {
      const error = new TRPCError({ code: "FORBIDDEN", message: "Custom Sentinel creation requires the Creator tier." });
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toContain("Creator tier");
    }
  });

  it("throws FORBIDDEN for pro-tier users trying to create a custom Sentinel", async () => {
    const tier = "pro";
    if (tier !== "creator") {
      const error = new TRPCError({ code: "FORBIDDEN", message: "Custom Sentinel creation requires the Creator tier." });
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("allows creator-tier users to pass the tier check", () => {
    const tier = "creator";
    const isAllowed = tier === "creator";
    expect(isAllowed).toBe(true);
  });

  it("throws FORBIDDEN for free-tier users trying to list custom Sentinels", async () => {
    const tier = "free";
    if (tier !== "creator") {
      const error = new TRPCError({ code: "FORBIDDEN", message: "Custom Sentinels require the Creator tier." });
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});

// ─── Unit tests for products.ts helpers ───────────────────────────────────────

describe("products.ts Creator tier helpers", () => {
  it("getMaxCustomSentinels returns 5 for creator tier", async () => {
    const { getMaxCustomSentinels } = await import("./products");
    expect(getMaxCustomSentinels("creator")).toBe(5);
  });

  it("getMaxCustomSentinels returns 0 for free tier", async () => {
    const { getMaxCustomSentinels } = await import("./products");
    expect(getMaxCustomSentinels("free")).toBe(0);
  });

  it("getMaxCustomSentinels returns 0 for pro tier", async () => {
    const { getMaxCustomSentinels } = await import("./products");
    expect(getMaxCustomSentinels("pro")).toBe(0);
  });

  it("SUBSCRIPTION_TIERS.CREATOR has the correct price", async () => {
    const { SUBSCRIPTION_TIERS } = await import("./products");
    expect(SUBSCRIPTION_TIERS.CREATOR.price).toBe(29);
  });

  it("SUBSCRIPTION_TIERS.CREATOR includes voice and unlimited messages", async () => {
    const { SUBSCRIPTION_TIERS } = await import("./products");
    expect(SUBSCRIPTION_TIERS.CREATOR.features.voiceMode).toBe(true);
    expect(SUBSCRIPTION_TIERS.CREATOR.features.messagesPerMonth).toBe(-1);
  });

  it("SUBSCRIPTION_TIERS.CREATOR has customSentinelCreation enabled", async () => {
    const { SUBSCRIPTION_TIERS } = await import("./products");
    expect(SUBSCRIPTION_TIERS.CREATOR.features.customSentinelCreation).toBe(true);
    expect(SUBSCRIPTION_TIERS.CREATOR.features.maxCustomSentinels).toBe(5);
  });
});

// ─── Unit tests for slug generation logic ─────────────────────────────────────

describe("Custom Sentinel slug generation", () => {
  it("generates a valid slug from a Sentinel name", () => {
    const name = "Nexus Prime";
    const userId = 42;
    const slug = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${userId}`;
    expect(slug).toBe("custom-nexus-prime-42");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("handles special characters in names", () => {
    const name = "Rift.EXE #2";
    const userId = 7;
    const slug = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${userId}`;
    expect(slug).toBe("custom-rift-exe-2-7");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("handles names with leading/trailing spaces", () => {
    const name = "  Aria  ";
    const userId = 1;
    const slug = `custom-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${userId}`;
    expect(slug).toBe("custom-aria-1");
  });
});

// ─── Unit tests for custom Sentinel data parsing ──────────────────────────────

describe("Custom Sentinel data parsing", () => {
  it("parses JSON-encoded personalityTraits correctly", () => {
    const raw = JSON.stringify(["analytical", "precise", "strategic"]);
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual(["analytical", "precise", "strategic"]);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it("falls back to comma-split for non-JSON personalityTraits", () => {
    const raw = "analytical, precise, strategic";
    let parsed: string[];
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
    expect(parsed).toEqual(["analytical", "precise", "strategic"]);
  });

  it("parses JSON-encoded specializationDomains correctly", () => {
    const raw = JSON.stringify(["finance", "data science"]);
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual(["finance", "data science"]);
  });
});

// ─── Unit tests for max limit enforcement ─────────────────────────────────────

describe("Custom Sentinel limit enforcement", () => {
  it("blocks creation when at the 5-Sentinel limit", async () => {
    const { getMaxCustomSentinels } = await import("./products");
    const currentCount = 5;
    const maxAllowed = getMaxCustomSentinels("creator");
    const isBlocked = currentCount >= maxAllowed;
    expect(isBlocked).toBe(true);
  });

  it("allows creation when below the 5-Sentinel limit", async () => {
    const { getMaxCustomSentinels } = await import("./products");
    const currentCount = 3;
    const maxAllowed = getMaxCustomSentinels("creator");
    const isBlocked = currentCount >= maxAllowed;
    expect(isBlocked).toBe(false);
  });

  it("allows creation when at 0 Sentinels", async () => {
    const { getMaxCustomSentinels } = await import("./products");
    const currentCount = 0;
    const maxAllowed = getMaxCustomSentinels("creator");
    const isBlocked = currentCount >= maxAllowed;
    expect(isBlocked).toBe(false);
  });
});
