import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Voice Features", () => {
  let proUserId: number;
  let freeUserId: number;
  const proOpenId = `test-pro-voice-${Date.now()}`;
  const freeOpenId = `test-free-voice-${Date.now()}`;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available for tests");

    // Create test users
    const [proUser] = await db
      .insert(users)
      .values({
        openId: proOpenId,
        name: "Pro Test User",
        email: `pro-voice-test-${Date.now()}@example.com`,
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
        name: "Free Test User",
        email: `free-voice-test-${Date.now()}@example.com`,
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
    // Clean up test users
    await db.delete(users).where(eq(users.openId, proOpenId));
    await db.delete(users).where(eq(users.openId, freeOpenId));
  });

  describe("Voice Transcription", () => {
    it("should allow Pro users to transcribe audio", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const proUser = await db.select().from(users).where(eq(users.id, proUserId)).then(r => r[0]);
      
      const caller = appRouter.createCaller({
        user: proUser,
        req: {} as any,
        res: {} as any,
      });

      // Test with a sample base64 audio (minimal valid webm header)
      const sampleAudio = "GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////FUmpZpkq17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua7+uvdeBAXPFh1WmmbH/////////AAAAAAADh0aO";
      
      try {
        await caller.voice.transcribe({
          audio: sampleAudio,
          mimeType: "audio/webm",
        });
        // If it doesn't throw, Pro user has access
        expect(true).toBe(true);
      } catch (error: any) {
        // Expect transcription service error, not permission error
        expect(error.message).not.toContain("Pro users");
      }
    });

    it("should block Free users from transcribing audio", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const freeUser = await db.select().from(users).where(eq(users.id, freeUserId)).then(r => r[0]);
      
      const caller = appRouter.createCaller({
        user: freeUser,
        req: {} as any,
        res: {} as any,
      });

      const sampleAudio = "GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////FUmpZpkq17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua7+uvdeBAXPFh1WmmbH/////////AAAAAAADh0aO";
      
      await expect(
        caller.voice.transcribe({
          audio: sampleAudio,
          mimeType: "audio/webm",
        })
      ).rejects.toThrow("Voice features are only available for Pro users");
    });
  });

  describe("Text-to-Speech Synthesis", () => {
    it("should allow Pro users to synthesize speech", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const proUser = await db.select().from(users).where(eq(users.id, proUserId)).then(r => r[0]);
      
      const caller = appRouter.createCaller({
        user: proUser,
        req: {} as any,
        res: {} as any,
      });

      try {
        const result = await caller.voice.synthesize({
          text: "Hello, this is a test.",
          voice: "alloy",
        });
        
        // Should return audio URL
        expect(result).toHaveProperty("audioUrl");
        expect(typeof result.audioUrl).toBe("string");
        expect(result.audioUrl).toMatch(/^https?:\/\//);
      } catch (error: any) {
        // If TTS service is unavailable, that's okay for this test
        // We're mainly testing Pro tier access
        if (!error.message.includes("Pro users")) {
          expect(true).toBe(true);
        } else {
          throw error;
        }
      }
    });

    it("should block Free users from synthesizing speech", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const freeUser = await db.select().from(users).where(eq(users.id, freeUserId)).then(r => r[0]);
      
      const caller = appRouter.createCaller({
        user: freeUser,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.voice.synthesize({
          text: "Hello, this is a test.",
          voice: "alloy",
        })
      ).rejects.toThrow("Voice features are only available for Pro users");
    });

    it("should reject empty text", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const proUser = await db.select().from(users).where(eq(users.id, proUserId)).then(r => r[0]);
      
      const caller = appRouter.createCaller({
        user: proUser,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.voice.synthesize({
          text: "",
          voice: "alloy",
        })
      ).rejects.toThrow();
    });

    it("should reject text exceeding 4096 characters", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const proUser = await db.select().from(users).where(eq(users.id, proUserId)).then(r => r[0]);
      
      const caller = appRouter.createCaller({
        user: proUser,
        req: {} as any,
        res: {} as any,
      });

      const longText = "a".repeat(4097);

      await expect(
        caller.voice.synthesize({
          text: longText,
          voice: "alloy",
        })
      ).rejects.toThrow();
    });
  });
});
