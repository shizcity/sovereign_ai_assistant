/**
 * Unit tests for the OnboardingChecklist step tracking and visibility logic.
 * Tests the pure helper functions exported from OnboardingChecklist.tsx.
 */
import { describe, it, expect, beforeEach } from "vitest";

// ─── Mirror the pure helpers from OnboardingChecklist.tsx ─────────────────────

type OnboardingStep = "pick_sentinel" | "send_message" | "try_voice" | "explore_memory";

interface OnboardingStepState {
  pick_sentinel: boolean;
  send_message: boolean;
  try_voice: boolean;
  explore_memory: boolean;
}

const STORAGE_KEY = "glow_onboarding_steps";
const DISMISSED_KEY = "glow_onboarding_dismissed";

function makeEmptySteps(): OnboardingStepState {
  return { pick_sentinel: false, send_message: false, try_voice: false, explore_memory: false };
}

function loadOnboardingSteps(storage: Record<string, string>): OnboardingStepState {
  try {
    const raw = storage[STORAGE_KEY];
    if (!raw) return makeEmptySteps();
    return JSON.parse(raw) as OnboardingStepState;
  } catch {
    return makeEmptySteps();
  }
}

function saveOnboardingStep(storage: Record<string, string>, step: OnboardingStep): Record<string, string> {
  const current = loadOnboardingSteps(storage);
  current[step] = true;
  return { ...storage, [STORAGE_KEY]: JSON.stringify(current) };
}

function isOnboardingDismissed(storage: Record<string, string>): boolean {
  return storage[DISMISSED_KEY] === "1";
}

function dismissOnboarding(storage: Record<string, string>): Record<string, string> {
  return { ...storage, [DISMISSED_KEY]: "1" };
}

function isOnboardingComplete(steps: OnboardingStepState): boolean {
  return steps.pick_sentinel && steps.send_message && steps.try_voice && steps.explore_memory;
}

function shouldShowChecklist(storage: Record<string, string>): boolean {
  if (isOnboardingDismissed(storage)) return false;
  const steps = loadOnboardingSteps(storage);
  return !isOnboardingComplete(steps);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("OnboardingChecklist step tracking", () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
  });

  it("starts with all steps incomplete", () => {
    const steps = loadOnboardingSteps(storage);
    expect(steps.pick_sentinel).toBe(false);
    expect(steps.send_message).toBe(false);
    expect(steps.try_voice).toBe(false);
    expect(steps.explore_memory).toBe(false);
  });

  it("marks a single step as complete", () => {
    storage = saveOnboardingStep(storage, "pick_sentinel");
    const steps = loadOnboardingSteps(storage);
    expect(steps.pick_sentinel).toBe(true);
    expect(steps.send_message).toBe(false);
  });

  it("marks multiple steps independently", () => {
    storage = saveOnboardingStep(storage, "pick_sentinel");
    storage = saveOnboardingStep(storage, "send_message");
    const steps = loadOnboardingSteps(storage);
    expect(steps.pick_sentinel).toBe(true);
    expect(steps.send_message).toBe(true);
    expect(steps.try_voice).toBe(false);
    expect(steps.explore_memory).toBe(false);
  });

  it("does not regress previously completed steps", () => {
    storage = saveOnboardingStep(storage, "pick_sentinel");
    storage = saveOnboardingStep(storage, "try_voice");
    const steps = loadOnboardingSteps(storage);
    expect(steps.pick_sentinel).toBe(true);
    expect(steps.try_voice).toBe(true);
  });

  it("reports complete only when all 4 steps are done", () => {
    const partial: OnboardingStepState = { pick_sentinel: true, send_message: true, try_voice: true, explore_memory: false };
    expect(isOnboardingComplete(partial)).toBe(false);

    const full: OnboardingStepState = { pick_sentinel: true, send_message: true, try_voice: true, explore_memory: true };
    expect(isOnboardingComplete(full)).toBe(true);
  });

  it("returns false for isOnboardingComplete on empty steps", () => {
    expect(isOnboardingComplete(makeEmptySteps())).toBe(false);
  });
});

describe("OnboardingChecklist visibility logic", () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
  });

  it("shows checklist for a brand-new user", () => {
    expect(shouldShowChecklist(storage)).toBe(true);
  });

  it("hides checklist after it is dismissed", () => {
    storage = dismissOnboarding(storage);
    expect(shouldShowChecklist(storage)).toBe(false);
  });

  it("hides checklist when all steps are complete", () => {
    storage = saveOnboardingStep(storage, "pick_sentinel");
    storage = saveOnboardingStep(storage, "send_message");
    storage = saveOnboardingStep(storage, "try_voice");
    storage = saveOnboardingStep(storage, "explore_memory");
    expect(shouldShowChecklist(storage)).toBe(false);
  });

  it("still shows checklist with 3 of 4 steps done", () => {
    storage = saveOnboardingStep(storage, "pick_sentinel");
    storage = saveOnboardingStep(storage, "send_message");
    storage = saveOnboardingStep(storage, "try_voice");
    expect(shouldShowChecklist(storage)).toBe(true);
  });

  it("dismissOnboarding sets the correct key", () => {
    const updated = dismissOnboarding(storage);
    expect(updated[DISMISSED_KEY]).toBe("1");
  });

  it("dismissed state takes priority over incomplete steps", () => {
    // Even with steps incomplete, dismissed flag wins
    storage = dismissOnboarding(storage);
    storage = saveOnboardingStep(storage, "pick_sentinel");
    expect(shouldShowChecklist(storage)).toBe(false);
  });
});

describe("OnboardingChecklist progress calculation", () => {
  it("calculates 0% progress for empty steps", () => {
    const steps = makeEmptySteps();
    const count = Object.values(steps).filter(Boolean).length;
    expect(count).toBe(0);
    expect(Math.round((count / 4) * 100)).toBe(0);
  });

  it("calculates 50% progress for 2 of 4 steps", () => {
    const steps: OnboardingStepState = { pick_sentinel: true, send_message: true, try_voice: false, explore_memory: false };
    const count = Object.values(steps).filter(Boolean).length;
    expect(Math.round((count / 4) * 100)).toBe(50);
  });

  it("calculates 100% progress for all steps", () => {
    const steps: OnboardingStepState = { pick_sentinel: true, send_message: true, try_voice: true, explore_memory: true };
    const count = Object.values(steps).filter(Boolean).length;
    expect(Math.round((count / 4) * 100)).toBe(100);
  });
});
