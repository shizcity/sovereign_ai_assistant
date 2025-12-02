import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { upsertUser, getUserByOpenId } from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Template Sharing System", () => {
  let user1Caller: ReturnType<typeof appRouter.createCaller>;
  let user2Caller: ReturnType<typeof appRouter.createCaller>;
  let user1Id: number;
  let user2Id: number;
  let sharedTemplateId: number;

  beforeAll(async () => {
    // Create two test users
    const user1Data = {
      openId: "test-user-sharing-1",
      name: "Alice",
      email: "alice@example.com",
      role: "user" as const,
    };

    const user2Data = {
      openId: "test-user-sharing-2",
      name: "Bob",
      email: "bob@example.com",
      role: "user" as const,
    };

    await upsertUser(user1Data);
    await upsertUser(user2Data);

    const user1Db = await getUserByOpenId(user1Data.openId);
    const user2Db = await getUserByOpenId(user2Data.openId);

    if (!user1Db || !user2Db) {
      throw new Error("Failed to create test users");
    }

    user1Id = user1Db.id!;
    user2Id = user2Db.id!;

    const testUser1: AuthenticatedUser = {
      ...user1Db,
      id: user1Id,
      createdAt: user1Db.createdAt!,
      updatedAt: user1Db.updatedAt!,
      lastSignedIn: user1Db.lastSignedIn || new Date(),
    };

    const testUser2: AuthenticatedUser = {
      ...user2Db,
      id: user2Id,
      createdAt: user2Db.createdAt!,
      updatedAt: user2Db.updatedAt!,
      lastSignedIn: user2Db.lastSignedIn || new Date(),
    };

    user1Caller = appRouter.createCaller(createTestContext(testUser1));
    user2Caller = appRouter.createCaller(createTestContext(testUser2));
  });

  describe("Template Creation with Attribution", () => {
    it("should create a template with creator name", async () => {
      const template = await user1Caller.templates.create({
        name: "Shared Template Test",
        description: "A template to be shared",
        prompt: "This is a test prompt for sharing",
        category: "Testing",
      });

      expect(template).toBeDefined();
      expect(template.creatorName).toBe("Alice");
      expect(template.isPublic).toBe(0); // Default is private

      sharedTemplateId = template.id;
    });
  });

  describe("Making Templates Public", () => {
    it("should toggle a template to public", async () => {
      await user1Caller.templates.togglePublic({
        id: sharedTemplateId,
        isPublic: true,
      });

      const template = await user1Caller.templates.getById({
        id: sharedTemplateId,
      });

      expect(template?.isPublic).toBe(1);
    });

    it("should not allow other users to toggle public status", async () => {
      // User 2 tries to make User 1's template private
      await user2Caller.templates.togglePublic({
        id: sharedTemplateId,
        isPublic: false,
      });

      // Check that it's still public (no change)
      const template = await user1Caller.templates.getById({
        id: sharedTemplateId,
      });

      expect(template?.isPublic).toBe(1); // Still public
    });
  });

  describe("Public Template Gallery", () => {
    it("should list public templates for all users", async () => {
      const publicTemplates = await user2Caller.templates.listPublic();

      expect(publicTemplates.length).toBeGreaterThan(0);
      
      const sharedTemplate = publicTemplates.find(
        (t) => t.id === sharedTemplateId
      );
      expect(sharedTemplate).toBeDefined();
      expect(sharedTemplate?.name).toBe("Shared Template Test");
      expect(sharedTemplate?.creatorName).toBe("Alice");
    });

    it("should not list private templates in public gallery", async () => {
      // Create a private template
      const privateTemplate = await user1Caller.templates.create({
        name: "Private Template",
        description: "This should not appear in gallery",
        prompt: "Private content",
        category: "Testing",
      });

      const publicTemplates = await user2Caller.templates.listPublic();

      const foundPrivate = publicTemplates.find(
        (t) => t.id === privateTemplate.id
      );
      expect(foundPrivate).toBeUndefined();
    });
  });

  describe("Importing Templates", () => {
    it("should allow users to import public templates", async () => {
      const imported = await user2Caller.templates.import({
        templateId: sharedTemplateId,
      });

      expect(imported).toBeDefined();
      expect(imported.name).toBe("Shared Template Test");
      expect(imported.userId).toBe(user2Id);
      expect(imported.creatorName).toBe("Alice"); // Preserves original creator
      expect(imported.isPublic).toBe(0); // Imported as private
    });

    it("should not allow importing private templates", async () => {
      // Create a private template
      const privateTemplate = await user1Caller.templates.create({
        name: "Private Template 2",
        description: "Cannot be imported",
        prompt: "Private",
        category: "Testing",
      });

      // Try to import it
      await expect(
        user2Caller.templates.import({ templateId: privateTemplate.id })
      ).rejects.toThrow();
    });

    it("should create a separate copy when importing", async () => {
      // User 2 already imported the template
      const user2Templates = await user2Caller.templates.list();
      const importedTemplate = user2Templates.find(
        (t) => t.name === "Shared Template Test"
      );

      expect(importedTemplate).toBeDefined();
      expect(importedTemplate?.id).not.toBe(sharedTemplateId); // Different ID
      expect(importedTemplate?.userId).toBe(user2Id); // Owned by user 2
    });
  });

  describe("Template Ownership and Isolation", () => {
    it("should allow users to modify their imported templates", async () => {
      const user2Templates = await user2Caller.templates.list();
      const importedTemplate = user2Templates.find(
        (t) => t.name === "Shared Template Test"
      );

      if (!importedTemplate) throw new Error("Imported template not found");

      await user2Caller.templates.update({
        id: importedTemplate.id,
        name: "My Modified Template",
        prompt: "I changed this",
      });

      const updated = await user2Caller.templates.getById({
        id: importedTemplate.id,
      });

      expect(updated?.name).toBe("My Modified Template");
      expect(updated?.prompt).toBe("I changed this");
    });

    it("should not affect original template when modifying imported copy", async () => {
      const original = await user1Caller.templates.getById({
        id: sharedTemplateId,
      });

      expect(original?.name).toBe("Shared Template Test");
      expect(original?.prompt).toBe("This is a test prompt for sharing");
    });
  });

  describe("Public/Private Toggle", () => {
    it("should toggle a template back to private", async () => {
      await user1Caller.templates.togglePublic({
        id: sharedTemplateId,
        isPublic: false,
      });

      const template = await user1Caller.templates.getById({
        id: sharedTemplateId,
      });

      expect(template?.isPublic).toBe(0);
    });

    it("should remove private templates from public gallery", async () => {
      const publicTemplates = await user2Caller.templates.listPublic();

      const foundTemplate = publicTemplates.find(
        (t) => t.id === sharedTemplateId
      );
      expect(foundTemplate).toBeUndefined();
    });
  });
});
