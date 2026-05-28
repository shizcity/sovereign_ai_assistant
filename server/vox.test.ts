/**
 * VOX Phase 2 — Server-side Utterance Plan Tests
 *
 * Tests the server-side utterance plan extraction and prosody mapping.
 * NOTE: Client-side StreamingVoicePlayer and splitIntoSentences use browser
 * APIs (window.speechSynthesis, AudioContext) and cannot be tested in Node.js.
 */

import { describe, it, expect } from "vitest";
import { extractUtterancePlan, mapEmotionToProsody } from "./utterance-plan";
import type { ResolvedProsody } from "./utterance-plan";

// Default base voice used across tests
const BASE_VOICE: ResolvedProsody = {
  voice: "shimmer",
  speed: 1.0,
  pitch: 1.0,
  rate: 1.0,
  volume: 0.95,
};

// ─── extractUtterancePlan ─────────────────────────────────────────────────────

describe("extractUtterancePlan", () => {
  it("extracts a valid UP tag from text", () => {
    const text = 'Hello world. <up>{"intent":"narrate","emotion":{"valence":0.7,"arousal":0.4,"stability":0.8}}</up>';
    const { plan, cleanText } = extractUtterancePlan(text);
    expect(plan).not.toBeNull();
    expect(plan?.intent).toBe("narrate");
    expect(plan?.emotion.valence).toBe(0.7);
    expect(plan?.emotion.arousal).toBe(0.4);
    expect(plan?.emotion.stability).toBe(0.8);
    expect(cleanText.trim()).toBe("Hello world.");
  });

  it("returns null plan when no UP tag is present", () => {
    const text = "Just a normal response with no utterance plan.";
    const { plan, cleanText } = extractUtterancePlan(text);
    expect(plan).toBeNull();
    expect(cleanText).toBe(text);
  });

  it("handles malformed JSON in UP tag gracefully", () => {
    const text = "Some text. <up>{invalid json}</up>";
    const { plan, cleanText } = extractUtterancePlan(text);
    expect(plan).toBeNull();
    // Clean text should still have the tag stripped
    expect(cleanText).not.toContain("<up>");
    expect(cleanText).not.toContain("</up>");
  });

  it("strips the UP tag from clean text", () => {
    const text = 'Response text. <up>{"intent":"reassure","emotion":{"valence":0.9,"arousal":0.2,"stability":0.9}}</up>';
    const { cleanText } = extractUtterancePlan(text);
    expect(cleanText).not.toContain("<up>");
    expect(cleanText).not.toContain("</up>");
    expect(cleanText.trim()).toBe("Response text.");
  });

  it("handles UP tag with extra whitespace around it", () => {
    const text = 'Hello. \n<up>{"intent":"teach","emotion":{"valence":0.4,"arousal":0.7,"stability":0.5}}</up>\n';
    const { plan, cleanText } = extractUtterancePlan(text);
    expect(plan?.intent).toBe("teach");
    expect(cleanText).not.toContain("<up>");
  });

  it("extracts all required emotion fields", () => {
    const text = '<up>{"intent":"instruct","emotion":{"valence":0.2,"arousal":0.8,"stability":0.3}}</up>';
    const { plan } = extractUtterancePlan(text);
    expect(plan).not.toBeNull();
    expect(typeof plan?.emotion.valence).toBe("number");
    expect(typeof plan?.emotion.arousal).toBe("number");
    expect(typeof plan?.emotion.stability).toBe("number");
  });
});

// ─── mapEmotionToProsody ──────────────────────────────────────────────────────

describe("mapEmotionToProsody", () => {
  it("returns valid prosody shape for neutral emotion", () => {
    const prosody = mapEmotionToProsody(
      { valence: 0.5, arousal: 0.5, stability: 0.7 },
      "default",
      BASE_VOICE
    );
    expect(prosody).toHaveProperty("rate");
    expect(prosody).toHaveProperty("pitch");
    expect(prosody).toHaveProperty("volume");
    expect(prosody.rate).toBeGreaterThan(0.5);
    expect(prosody.rate).toBeLessThan(2.0);
    expect(prosody.volume).toBeGreaterThan(0);
    expect(prosody.volume).toBeLessThanOrEqual(1.0);
  });

  it("returns slower rate for low arousal (calm) emotion", () => {
    const calm = mapEmotionToProsody(
      { valence: 0.8, arousal: 0.1, stability: 0.9 },
      "reassure",
      BASE_VOICE
    );
    const energetic = mapEmotionToProsody(
      { valence: 0.9, arousal: 0.9, stability: 0.6 },
      "hype",
      BASE_VOICE
    );
    expect(calm.rate).toBeLessThan(energetic.rate);
  });

  it("returns valid prosody for all known intents", () => {
    const intents = [
      "narrate", "reassure", "instruct", "teach", "wonder",
      "flirt", "banter", "joke", "apologize", "confess",
      "lullaby", "chant", "announce", "hype", "story",
      "oracle", "default"
    ] as const;
    for (const intent of intents) {
      const prosody = mapEmotionToProsody(
        { valence: 0.5, arousal: 0.5, stability: 0.7 },
        intent,
        BASE_VOICE
      );
      expect(prosody).toHaveProperty("rate");
      expect(prosody).toHaveProperty("pitch");
      expect(prosody).toHaveProperty("volume");
    }
  });

  it("returns higher pitch for high valence (positive) emotion", () => {
    const positive = mapEmotionToProsody(
      { valence: 0.95, arousal: 0.8, stability: 0.6 },
      "hype",
      BASE_VOICE
    );
    const negative = mapEmotionToProsody(
      { valence: 0.1, arousal: 0.8, stability: 0.3 },
      "confess",
      BASE_VOICE
    );
    // Positive emotion should have higher or equal pitch
    expect(positive.pitch).toBeGreaterThanOrEqual(negative.pitch);
  });

  it("clamps prosody values to valid ranges", () => {
    // Extreme emotion values should still produce valid prosody
    const extreme = mapEmotionToProsody(
      { valence: 1.0, arousal: 1.0, stability: 0.0 },
      "hype",
      BASE_VOICE
    );
    expect(extreme.rate).toBeGreaterThan(0);
    expect(extreme.rate).toBeLessThanOrEqual(2.0);
    expect(extreme.volume).toBeGreaterThan(0);
    expect(extreme.volume).toBeLessThanOrEqual(1.0);
  });
});
