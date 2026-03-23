/**
 * Unit tests for the SentinelComparison Pro lock indicator logic.
 *
 * The component determines whether a Sentinel column should be "locked"
 * based on isPro and proOnlySlugs props. These tests verify the pure
 * isLocked helper logic in isolation.
 */
import { describe, it, expect } from "vitest";

// ─── Pure helper (mirrors the logic in SentinelComparison.tsx) ────────────────

const PRO_ONLY_SLUGS = ["aetheris-flow", "rift-exe", "nyx"];

function isLocked(
  slug: string,
  isPro: boolean,
  proOnlySlugs: string[]
): boolean {
  return !isPro && proOnlySlugs.includes(slug);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SentinelComparison Pro lock logic", () => {
  describe("Free-tier user (isPro = false)", () => {
    it("locks aetheris-flow for free users", () => {
      expect(isLocked("aetheris-flow", false, PRO_ONLY_SLUGS)).toBe(true);
    });

    it("locks rift-exe for free users", () => {
      expect(isLocked("rift-exe", false, PRO_ONLY_SLUGS)).toBe(true);
    });

    it("locks nyx for free users", () => {
      expect(isLocked("nyx", false, PRO_ONLY_SLUGS)).toBe(true);
    });

    it("does not lock vixens-den for free users", () => {
      expect(isLocked("vixens-den", false, PRO_ONLY_SLUGS)).toBe(false);
    });

    it("does not lock mischief-exe for free users", () => {
      expect(isLocked("mischief-exe", false, PRO_ONLY_SLUGS)).toBe(false);
    });

    it("does not lock lunaris-vault for free users", () => {
      expect(isLocked("lunaris-vault", false, PRO_ONLY_SLUGS)).toBe(false);
    });
  });

  describe("Pro-tier user (isPro = true)", () => {
    it("does not lock any Sentinel for Pro users", () => {
      PRO_ONLY_SLUGS.forEach((slug) => {
        expect(isLocked(slug, true, PRO_ONLY_SLUGS)).toBe(false);
      });
    });

    it("does not lock free Sentinels for Pro users", () => {
      ["vixens-den", "mischief-exe", "lunaris-vault"].forEach((slug) => {
        expect(isLocked(slug, true, PRO_ONLY_SLUGS)).toBe(false);
      });
    });
  });

  describe("Edge cases", () => {
    it("does not lock when proOnlySlugs is empty", () => {
      expect(isLocked("aetheris-flow", false, [])).toBe(false);
    });

    it("does not lock an unknown slug", () => {
      expect(isLocked("unknown-sentinel", false, PRO_ONLY_SLUGS)).toBe(false);
    });

    it("locks correctly with a custom proOnlySlugs list", () => {
      expect(isLocked("custom-pro", false, ["custom-pro"])).toBe(true);
      expect(isLocked("custom-pro", true, ["custom-pro"])).toBe(false);
    });
  });
});
