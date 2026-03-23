/**
 * Unit tests for the ShareNudgeCard visibility and localStorage guard logic.
 *
 * The nudge card is shown once per upgrade — guarded by a localStorage key
 * "glow_share_nudge_shown". These tests verify the pure guard logic and the
 * Twitter share URL construction in isolation.
 */
import { describe, it, expect, beforeEach } from "vitest";

// ─── Pure helpers (mirrors the logic in Sentinels.tsx / ShareNudgeCard.tsx) ───

const NUDGE_KEY = "glow_share_nudge_shown";

function shouldShowNudge(storage: Record<string, string>): boolean {
  return !storage[NUDGE_KEY];
}

function markNudgeDismissed(storage: Record<string, string>): Record<string, string> {
  return { ...storage, [NUDGE_KEY]: "1" };
}

function buildTwitterUrl(shareUrl: string, text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ShareNudgeCard visibility logic", () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
  });

  it("shows nudge when localStorage key is absent", () => {
    expect(shouldShowNudge(storage)).toBe(true);
  });

  it("hides nudge after it has been dismissed", () => {
    storage = markNudgeDismissed(storage);
    expect(shouldShowNudge(storage)).toBe(false);
  });

  it("markNudgeDismissed sets the correct key", () => {
    const updated = markNudgeDismissed(storage);
    expect(updated[NUDGE_KEY]).toBe("1");
  });

  it("does not mutate the original storage object", () => {
    const original = { ...storage };
    markNudgeDismissed(storage);
    expect(storage).toEqual(original);
  });

  it("nudge stays hidden across multiple checks after dismissal", () => {
    storage = markNudgeDismissed(storage);
    expect(shouldShowNudge(storage)).toBe(false);
    expect(shouldShowNudge(storage)).toBe(false);
  });
});

describe("ShareNudgeCard Twitter URL construction", () => {
  const SHARE_TEXT =
    "Just upgraded to Glow Pro 🚀 — command a whole team of specialized AI Sentinels that think differently and debate perspectives. Check it out:";

  it("builds a valid Twitter intent URL", () => {
    const url = buildTwitterUrl("https://glow.manus.space", SHARE_TEXT);
    expect(url).toContain("https://twitter.com/intent/tweet");
    expect(url).toContain("text=");
    expect(url).toContain("url=");
  });

  it("encodes the share URL correctly", () => {
    const url = buildTwitterUrl("https://glow.manus.space", SHARE_TEXT);
    expect(url).toContain(encodeURIComponent("https://glow.manus.space"));
  });

  it("encodes the share text correctly", () => {
    const url = buildTwitterUrl("https://glow.manus.space", SHARE_TEXT);
    expect(url).toContain(encodeURIComponent(SHARE_TEXT));
  });

  it("handles URLs with query params correctly", () => {
    const url = buildTwitterUrl("https://glow.manus.space?ref=nudge", SHARE_TEXT);
    expect(url).toContain(encodeURIComponent("https://glow.manus.space?ref=nudge"));
  });
});
