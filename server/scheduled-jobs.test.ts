import { describe, it, expect, beforeEach, vi } from "vitest";
import { triggerWeeklyDigestNow, triggerMonthlyDigestNow } from "./scheduled-jobs";
import { getDb } from "./db";
import { users, userSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as emailDigest from "./email-digest";

// Mock the email digest module
vi.mock("./email-digest", () => ({
  sendDigestEmail: vi.fn(),
}));

describe("Scheduled Email Digest Jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Weekly Digest Job", () => {
    it("should send weekly digests to users with 'weekly' preference", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get test user
      const testUsers = await db.select().from(users).limit(1);
      if (testUsers.length === 0) {
        console.log("No test users found, skipping test");
        return;
      }

      const testUser = testUsers[0];

      // Set user preference to 'weekly'
      await db.delete(userSettings).where(eq(userSettings.userId, testUser.id));
      await db.insert(userSettings).values({
        userId: testUser.id,
        emailDigestFrequency: "weekly",
      });

      // Mock sendDigestEmail to return success
      vi.mocked(emailDigest.sendDigestEmail).mockResolvedValue(true);

      // Trigger the job
      await triggerWeeklyDigestNow();

      // Verify sendDigestEmail was called with correct parameters
      expect(emailDigest.sendDigestEmail).toHaveBeenCalledWith(
        testUser.id,
        "weekly"
      );
    });

    it("should send weekly digests to users with 'both' preference", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const testUsers = await db.select().from(users).limit(1);
      if (testUsers.length === 0) {
        console.log("No test users found, skipping test");
        return;
      }

      const testUser = testUsers[0];

      // Set user preference to 'both'
      await db.delete(userSettings).where(eq(userSettings.userId, testUser.id));
      await db.insert(userSettings).values({
        userId: testUser.id,
        emailDigestFrequency: "both",
      });

      vi.mocked(emailDigest.sendDigestEmail).mockResolvedValue(true);

      await triggerWeeklyDigestNow();

      expect(emailDigest.sendDigestEmail).toHaveBeenCalledWith(
        testUser.id,
        "weekly"
      );
    });

    it("should NOT send weekly digests to users with 'monthly' preference", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const testUsers = await db.select().from(users).limit(1);
      if (testUsers.length === 0) {
        console.log("No test users found, skipping test");
        return;
      }

      const testUser = testUsers[0];

      // Set user preference to 'monthly'
      await db.delete(userSettings).where(eq(userSettings.userId, testUser.id));
      await db.insert(userSettings).values({
        userId: testUser.id,
        emailDigestFrequency: "monthly",
      });

      vi.mocked(emailDigest.sendDigestEmail).mockResolvedValue(true);

      await triggerWeeklyDigestNow();

      // Should not be called for this user
      expect(emailDigest.sendDigestEmail).not.toHaveBeenCalledWith(
        testUser.id,
        "weekly"
      );
    });

    it("should NOT send weekly digests to users with 'off' preference", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const testUsers = await db.select().from(users).limit(1);
      if (testUsers.length === 0) {
        console.log("No test users found, skipping test");
        return;
      }

      const testUser = testUsers[0];

      // Set user preference to 'off'
      await db.delete(userSettings).where(eq(userSettings.userId, testUser.id));
      await db.insert(userSettings).values({
        userId: testUser.id,
        emailDigestFrequency: "off",
      });

      vi.mocked(emailDigest.sendDigestEmail).mockResolvedValue(true);

      await triggerWeeklyDigestNow();

      // Should not be called for this user
      expect(emailDigest.sendDigestEmail).not.toHaveBeenCalledWith(
        testUser.id,
        "weekly"
      );
    });

    it("should handle email send failures gracefully", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const testUsers = await db.select().from(users).limit(1);
      if (testUsers.length === 0) {
        console.log("No test users found, skipping test");
        return;
      }

      const testUser = testUsers[0];

      await db.delete(userSettings).where(eq(userSettings.userId, testUser.id));
      await db.insert(userSettings).values({
        userId: testUser.id,
        emailDigestFrequency: "weekly",
      });

      // Mock sendDigestEmail to return failure
      vi.mocked(emailDigest.sendDigestEmail).mockResolvedValue(false);

      // Should not throw error
      await expect(triggerWeeklyDigestNow()).resolves.not.toThrow();
    });
  });

  describe("Monthly Digest Job", () => {
    it("should send monthly digests to users with 'monthly' preference", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const testUsers = await db.select().from(users).limit(1);
      if (testUsers.length === 0) {
        console.log("No test users found, skipping test");
        return;
      }

      const testUser = testUsers[0];

      // Set user preference to 'monthly'
      await db.delete(userSettings).where(eq(userSettings.userId, testUser.id));
      await db.insert(userSettings).values({
        userId: testUser.id,
        emailDigestFrequency: "monthly",
      });

      vi.mocked(emailDigest.sendDigestEmail).mockResolvedValue(true);

      await triggerMonthlyDigestNow();

      expect(emailDigest.sendDigestEmail).toHaveBeenCalledWith(
        testUser.id,
        "monthly"
      );
    });

    it("should send monthly digests to users with 'both' preference", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const testUsers = await db.select().from(users).limit(1);
      if (testUsers.length === 0) {
        console.log("No test users found, skipping test");
        return;
      }

      const testUser = testUsers[0];

      // Set user preference to 'both'
      await db.delete(userSettings).where(eq(userSettings.userId, testUser.id));
      await db.insert(userSettings).values({
        userId: testUser.id,
        emailDigestFrequency: "both",
      });

      vi.mocked(emailDigest.sendDigestEmail).mockResolvedValue(true);

      await triggerMonthlyDigestNow();

      expect(emailDigest.sendDigestEmail).toHaveBeenCalledWith(
        testUser.id,
        "monthly"
      );
    });

    it("should NOT send monthly digests to users with 'weekly' preference", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const testUsers = await db.select().from(users).limit(1);
      if (testUsers.length === 0) {
        console.log("No test users found, skipping test");
        return;
      }

      const testUser = testUsers[0];

      // Set user preference to 'weekly'
      await db.delete(userSettings).where(eq(userSettings.userId, testUser.id));
      await db.insert(userSettings).values({
        userId: testUser.id,
        emailDigestFrequency: "weekly",
      });

      vi.mocked(emailDigest.sendDigestEmail).mockResolvedValue(true);

      await triggerMonthlyDigestNow();

      // Should not be called for this user
      expect(emailDigest.sendDigestEmail).not.toHaveBeenCalledWith(
        testUser.id,
        "monthly"
      );
    });

    it("should NOT send monthly digests to users with 'off' preference", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const testUsers = await db.select().from(users).limit(1);
      if (testUsers.length === 0) {
        console.log("No test users found, skipping test");
        return;
      }

      const testUser = testUsers[0];

      // Set user preference to 'off'
      await db.delete(userSettings).where(eq(userSettings.userId, testUser.id));
      await db.insert(userSettings).values({
        userId: testUser.id,
        emailDigestFrequency: "off",
      });

      vi.mocked(emailDigest.sendDigestEmail).mockResolvedValue(true);

      await triggerMonthlyDigestNow();

      // Should not be called for this user
      expect(emailDigest.sendDigestEmail).not.toHaveBeenCalledWith(
        testUser.id,
        "monthly"
      );
    });

    it("should handle email send failures gracefully", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const testUsers = await db.select().from(users).limit(1);
      if (testUsers.length === 0) {
        console.log("No test users found, skipping test");
        return;
      }

      const testUser = testUsers[0];

      await db.delete(userSettings).where(eq(userSettings.userId, testUser.id));
      await db.insert(userSettings).values({
        userId: testUser.id,
        emailDigestFrequency: "monthly",
      });

      // Mock sendDigestEmail to return failure
      vi.mocked(emailDigest.sendDigestEmail).mockResolvedValue(false);

      // Should not throw error
      await expect(triggerMonthlyDigestNow()).resolves.not.toThrow();
    });
  });

  describe("Default Preference Handling", () => {
    it("should default to 'weekly' for users without explicit settings", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const testUsers = await db.select().from(users).limit(1);
      if (testUsers.length === 0) {
        console.log("No test users found, skipping test");
        return;
      }

      const testUser = testUsers[0];

      // Delete user settings to test default behavior
      await db.delete(userSettings).where(eq(userSettings.userId, testUser.id));

      vi.mocked(emailDigest.sendDigestEmail).mockResolvedValue(true);

      await triggerWeeklyDigestNow();

      // Should be called with default 'weekly' preference
      expect(emailDigest.sendDigestEmail).toHaveBeenCalledWith(
        testUser.id,
        "weekly"
      );
    });
  });
});
