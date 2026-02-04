import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Onboarding Procedures", () => {
  let testUserId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-onboarding-${Date.now()}`,
        name: "Test User",
        email: "test@example.com",
        onboardingCompleted: false,
        onboardingStep: 0,
      })
      .$returningId();

    testUserId = user.id;

    // Create a caller with the test user context
    caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: `test-onboarding-${Date.now()}`,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        onboardingCompleted: false,
        onboardingStep: 0,
      },
      req: {} as any,
      res: {} as any,
    });
  });

  it("should update onboarding step", async () => {
    // Update to step 3
    const result = await caller.auth.updateOnboardingStep({ step: 3 });
    expect(result.success).toBe(true);

    // Verify in database
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.onboardingStep).toBe(3);
    expect(user.onboardingCompleted).toBe(false);
  });

  it("should complete onboarding", async () => {
    // Complete onboarding
    const result = await caller.auth.completeOnboarding();
    expect(result.success).toBe(true);

    // Verify in database
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.onboardingCompleted).toBe(true);
    expect(user.onboardingStep).toBe(6);
  });

  it("should reset onboarding", async () => {
    // First complete onboarding
    await caller.auth.completeOnboarding();

    // Then reset it
    const result = await caller.auth.resetOnboarding();
    expect(result.success).toBe(true);

    // Verify in database
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.onboardingCompleted).toBe(false);
    expect(user.onboardingStep).toBe(0);
  });

  it("should handle step progression correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Progress through steps
    for (let step = 1; step <= 5; step++) {
      await caller.auth.updateOnboardingStep({ step });

      const [user] = await db.select().from(users).where(eq(users.id, testUserId));
      expect(user.onboardingStep).toBe(step);
      expect(user.onboardingCompleted).toBe(false);
    }

    // Complete onboarding
    await caller.auth.completeOnboarding();

    const [finalUser] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(finalUser.onboardingCompleted).toBe(true);
    expect(finalUser.onboardingStep).toBe(6);
  });

  it("should validate step range (0-6)", async () => {
    // Valid steps should work
    await expect(caller.auth.updateOnboardingStep({ step: 0 })).resolves.toBeDefined();
    await expect(caller.auth.updateOnboardingStep({ step: 6 })).resolves.toBeDefined();

    // Invalid steps should fail
    await expect(caller.auth.updateOnboardingStep({ step: -1 })).rejects.toThrow();
    await expect(caller.auth.updateOnboardingStep({ step: 7 })).rejects.toThrow();
  });

  it("should allow multiple resets", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Complete and reset multiple times
    for (let i = 0; i < 3; i++) {
      await caller.auth.completeOnboarding();
      let [user] = await db.select().from(users).where(eq(users.id, testUserId));
      expect(user.onboardingCompleted).toBe(true);

      await caller.auth.resetOnboarding();
      [user] = await db.select().from(users).where(eq(users.id, testUserId));
      expect(user.onboardingCompleted).toBe(false);
      expect(user.onboardingStep).toBe(0);
    }
  });

  it("should handle concurrent step updates", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Simulate concurrent updates
    await Promise.all([
      caller.auth.updateOnboardingStep({ step: 1 }),
      caller.auth.updateOnboardingStep({ step: 2 }),
      caller.auth.updateOnboardingStep({ step: 3 }),
    ]);

    // Final state should be consistent (last write wins)
    const [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.onboardingStep).toBeGreaterThanOrEqual(1);
    expect(user.onboardingStep).toBeLessThanOrEqual(3);
  });

  it("should preserve other user fields during onboarding updates", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get initial user state
    const [initialUser] = await db.select().from(users).where(eq(users.id, testUserId));

    // Update onboarding
    await caller.auth.updateOnboardingStep({ step: 3 });
    await caller.auth.completeOnboarding();

    // Verify other fields unchanged
    const [updatedUser] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(updatedUser.name).toBe(initialUser.name);
    expect(updatedUser.email).toBe(initialUser.email);
    expect(updatedUser.openId).toBe(initialUser.openId);
    expect(updatedUser.role).toBe(initialUser.role);
  });
});
