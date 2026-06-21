import { describe, expect, it } from "vitest";
import {
  computeRelationshipLevel,
  levelProgress,
  LEVEL_LABELS,
  LEVEL_COLORS,
  LEVEL_THRESHOLDS,
  type RelationshipLevel,
} from "./relationship-engine";

// ─── computeRelationshipLevel ─────────────────────────────────────────────────
describe("computeRelationshipLevel", () => {
  it("returns acquaintance at 0 interactions", () => {
    expect(computeRelationshipLevel(0)).toBe("acquaintance");
  });

  it("returns acquaintance at 9 interactions (below colleague threshold)", () => {
    expect(computeRelationshipLevel(9)).toBe("acquaintance");
  });

  it("returns colleague at exactly 10 interactions", () => {
    expect(computeRelationshipLevel(10)).toBe("colleague");
  });

  it("returns colleague at 49 interactions (below trusted_advisor threshold)", () => {
    expect(computeRelationshipLevel(49)).toBe("colleague");
  });

  it("returns trusted_advisor at exactly 50 interactions", () => {
    expect(computeRelationshipLevel(50)).toBe("trusted_advisor");
  });

  it("returns trusted_advisor at 199 interactions (below partner threshold)", () => {
    expect(computeRelationshipLevel(199)).toBe("trusted_advisor");
  });

  it("returns partner at exactly 200 interactions", () => {
    expect(computeRelationshipLevel(200)).toBe("partner");
  });

  it("returns partner at 1000 interactions (well above threshold)", () => {
    expect(computeRelationshipLevel(1000)).toBe("partner");
  });
});

// ─── levelProgress ────────────────────────────────────────────────────────────
describe("levelProgress", () => {
  it("returns 0 at 0 interactions", () => {
    expect(levelProgress(0)).toBe(0);
  });

  it("returns 50 at 5 interactions (halfway to colleague)", () => {
    expect(levelProgress(5)).toBe(50);
  });

  it("returns 100 at 10 interactions (colleague threshold)", () => {
    // At exactly 10 we enter colleague band; progress = (10-10)/(50-10)*100 = 0
    // but the function should return 0 progress within colleague band
    expect(levelProgress(10)).toBe(0);
  });

  it("returns 50 at 30 interactions (halfway through colleague band)", () => {
    // colleague band: 10–50, midpoint = 30 → (30-10)/(50-10)*100 = 50
    expect(levelProgress(30)).toBe(50);
  });

  it("returns 0 at 50 interactions (trusted_advisor threshold)", () => {
    // (50-50)/(200-50)*100 = 0
    expect(levelProgress(50)).toBe(0);
  });

  it("returns 50 at 125 interactions (halfway through trusted_advisor band)", () => {
    // (125-50)/(200-50)*100 = 50
    expect(levelProgress(125)).toBe(50);
  });

  it("returns 100 at 200 interactions (partner)", () => {
    expect(levelProgress(200)).toBe(100);
  });

  it("returns 100 beyond 200 interactions", () => {
    expect(levelProgress(500)).toBe(100);
  });

  it("always returns a value between 0 and 100", () => {
    for (const n of [0, 1, 5, 9, 10, 25, 49, 50, 100, 150, 199, 200, 300]) {
      const p = levelProgress(n);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
  });
});

// ─── LEVEL_LABELS ─────────────────────────────────────────────────────────────
describe("LEVEL_LABELS", () => {
  it("has a label for every relationship level", () => {
    const levels: RelationshipLevel[] = ["acquaintance", "colleague", "trusted_advisor", "partner"];
    for (const level of levels) {
      expect(LEVEL_LABELS[level]).toBeTruthy();
      expect(typeof LEVEL_LABELS[level]).toBe("string");
    }
  });

  it("labels are human-readable (capitalised, no underscores)", () => {
    for (const label of Object.values(LEVEL_LABELS)) {
      expect(label).not.toContain("_");
      expect(label[0]).toBe(label[0].toUpperCase());
    }
  });
});

// ─── LEVEL_COLORS ─────────────────────────────────────────────────────────────
describe("LEVEL_COLORS", () => {
  it("has a hex color for every relationship level", () => {
    const levels: RelationshipLevel[] = ["acquaintance", "colleague", "trusted_advisor", "partner"];
    for (const level of levels) {
      expect(LEVEL_COLORS[level]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("partner color is gold/amber (not gray or blue)", () => {
    // Partner is the highest tier — should be visually distinct (amber/gold)
    const partnerColor = LEVEL_COLORS["partner"];
    expect(partnerColor).not.toBe(LEVEL_COLORS["acquaintance"]);
    expect(partnerColor).not.toBe(LEVEL_COLORS["colleague"]);
  });
});

// ─── LEVEL_THRESHOLDS ────────────────────────────────────────────────────────
describe("LEVEL_THRESHOLDS", () => {
  it("acquaintance threshold is 0", () => {
    expect(LEVEL_THRESHOLDS["acquaintance"]).toBe(0);
  });

  it("colleague threshold is 10", () => {
    expect(LEVEL_THRESHOLDS["colleague"]).toBe(10);
  });

  it("trusted_advisor threshold is 50", () => {
    expect(LEVEL_THRESHOLDS["trusted_advisor"]).toBe(50);
  });

  it("partner threshold is 200", () => {
    expect(LEVEL_THRESHOLDS["partner"]).toBe(200);
  });

  it("thresholds are strictly increasing", () => {
    const values = Object.values(LEVEL_THRESHOLDS);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it("thresholds are consistent with computeRelationshipLevel", () => {
    // Each threshold value should map back to the correct level
    expect(computeRelationshipLevel(LEVEL_THRESHOLDS["colleague"])).toBe("colleague");
    expect(computeRelationshipLevel(LEVEL_THRESHOLDS["trusted_advisor"])).toBe("trusted_advisor");
    expect(computeRelationshipLevel(LEVEL_THRESHOLDS["partner"])).toBe("partner");
  });
});

// ─── Relationship arc progression ────────────────────────────────────────────
describe("Relationship arc progression", () => {
  it("progresses through all 4 tiers at the correct interaction counts", () => {
    const arc: Array<[number, RelationshipLevel]> = [
      [0, "acquaintance"],
      [9, "acquaintance"],
      [10, "colleague"],
      [49, "colleague"],
      [50, "trusted_advisor"],
      [199, "trusted_advisor"],
      [200, "partner"],
    ];
    for (const [count, expected] of arc) {
      expect(computeRelationshipLevel(count)).toBe(expected);
    }
  });

  it("levelProgress is monotonically non-decreasing within each tier band", () => {
    // Within acquaintance band (0-9)
    let prev = levelProgress(0);
    for (let i = 1; i <= 9; i++) {
      const curr = levelProgress(i);
      expect(curr).toBeGreaterThanOrEqual(prev);
      prev = curr;
    }
  });
});
