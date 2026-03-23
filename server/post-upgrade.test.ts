/**
 * Unit tests for the post-upgrade redirect detection logic.
 *
 * The Sentinels page reads the `upgraded` query param from the URL after a
 * successful Stripe checkout, shows a celebration toast, fires confetti, and
 * then removes the param from the browser history. These tests exercise the
 * pure URL-parsing logic in isolation.
 */
import { describe, it, expect } from "vitest";

// ─── Pure helpers (mirrors the logic in Sentinels.tsx) ────────────────────────

function getUpgradeParam(search: string): string | null {
  return new URLSearchParams(search).get("upgraded");
}

function shouldCelebrate(search: string): boolean {
  return getUpgradeParam(search) === "pro";
}

function getCleanPath(pathname: string): string {
  // Strips query string — mirrors window.location.pathname
  return pathname.split("?")[0];
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Post-upgrade redirect detection", () => {
  it("detects upgraded=pro param correctly", () => {
    expect(shouldCelebrate("?upgraded=pro")).toBe(true);
  });

  it("does not trigger celebration for upgraded=creator", () => {
    expect(shouldCelebrate("?upgraded=creator")).toBe(false);
  });

  it("does not trigger celebration when param is absent", () => {
    expect(shouldCelebrate("")).toBe(false);
  });

  it("does not trigger celebration for unrelated query params", () => {
    expect(shouldCelebrate("?foo=bar")).toBe(false);
  });

  it("returns the raw upgraded value via getUpgradeParam", () => {
    expect(getUpgradeParam("?upgraded=pro")).toBe("pro");
    expect(getUpgradeParam("?upgraded=creator")).toBe("creator");
    expect(getUpgradeParam("")).toBeNull();
  });

  it("getCleanPath strips query string from pathname", () => {
    expect(getCleanPath("/sentinels")).toBe("/sentinels");
    expect(getCleanPath("/sentinels?upgraded=pro")).toBe("/sentinels");
  });

  it("works with multiple query params present", () => {
    expect(shouldCelebrate("?ref=email&upgraded=pro&utm_source=stripe")).toBe(true);
  });
});
