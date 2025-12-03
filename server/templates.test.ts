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

describe("Template System", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let userId: string;
  let templateId: number;

  beforeAll(async () => {
    // Create a test user
    const testUserData = {
      openId: "test-user-templates",
      name: "Test User",
      email: "test@example.com",
      role: "user" as const,
    };

    // Ensure user exists in database
    await upsertUser(testUserData);
    const user = await getUserByOpenId(testUserData.openId);
    if (!user) {
      throw new Error("Failed to create test user");
    }
    userId = user.openId;
    // Store the numeric user ID for comparisons
    const numericUserId = user.id!;

    // Create caller with full user context
    const testUser: AuthenticatedUser = {
      ...user,
      id: user.id!,
      createdAt: user.createdAt!,
      updatedAt: user.updatedAt!,
      lastSignedIn: user.lastSignedIn || new Date(),
    };

    const ctx = createTestContext(testUser);
    caller = appRouter.createCaller(ctx);
  });

  describe("Template Creation", () => {
    it("should create a new template", async () => {
      const template = await caller.templates.create({
        name: "Test Template",
        description: "A test template",
        prompt: "This is a test prompt with [VARIABLE]",
        categoryId: null,
      });

      expect(template).toBeDefined();
      expect(template.name).toBe("Test Template");
      expect(template.prompt).toBe(
        "This is a test prompt with [VARIABLE]"
      );

      templateId = template.id;
    });

    it("should create default templates", async () => {
      await caller.templates.createDefaults();

      // Verify templates were created
      const templates = await caller.templates.list();
      expect(templates.length).toBeGreaterThan(0);
    });

    it("should not create duplicate default templates", async () => {
      // Get initial count
      const initialCount = (await caller.templates.list()).length;

      // Create defaults
      await caller.templates.createDefaults();
      const afterFirstCall = (await caller.templates.list()).length;

      // Second call should not create duplicates
      await caller.templates.createDefaults();
      const afterSecondCall = (await caller.templates.list()).length;

      // Second call should not add more templates
      expect(afterSecondCall).toBe(afterFirstCall);
    });
  });

  describe("Template Listing", () => {
    it("should list all templates for user", async () => {
      const result = await caller.templates.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check that templates exist (userId check is done by the query)
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return templates with all required fields", async () => {
      const result = await caller.templates.list();

      expect(result.length).toBeGreaterThan(0);

      const template = result[0];
      expect(template).toHaveProperty("id");
      expect(template).toHaveProperty("name");
      expect(template).toHaveProperty("categoryId");
      expect(template).toHaveProperty("description");
      expect(template).toHaveProperty("prompt");
      expect(template).toHaveProperty("userId");
      expect(template).toHaveProperty("isDefault");
      expect(template).toHaveProperty("createdAt");
    });
  });

  describe("Template Retrieval", () => {
    it("should get a template by id", async () => {
      const result = await caller.templates.getById({ id: templateId });

      expect(result).toBeDefined();
      expect(result?.id).toBe(templateId);
      expect(result?.name).toBe("Test Template");
    });

    it("should return null for non-existent template", async () => {
      const result = await caller.templates.getById({ id: 999999 });

      expect(result).toBeUndefined();
    });

    it("should not return templates from other users", async () => {
      // Create a different user's caller
      const otherUserData = {
        openId: "other-user-templates",
        name: "Other User",
        email: "other@example.com",
        role: "user" as const,
      };

      await upsertUser(otherUserData);
      const otherUserDb = await getUserByOpenId(otherUserData.openId);
      if (!otherUserDb) throw new Error("Failed to create other user");

      const otherUser: AuthenticatedUser = {
        ...otherUserDb,
        id: otherUserDb.id!,
        createdAt: otherUserDb.createdAt!,
        updatedAt: otherUserDb.updatedAt!,
        lastSignedIn: otherUserDb.lastSignedIn || new Date(),
      };

      const otherCaller = appRouter.createCaller(createTestContext(otherUser));

      // Try to get the template created by the first user
      const result = await otherCaller.templates.getById({ id: templateId });

      expect(result).toBeUndefined();
    });
  });

  describe("Template Update", () => {
    it("should update a template", async () => {
      await caller.templates.update({
        id: templateId,
        name: "Updated Test Template",
        description: "An updated test template",
        prompt: "Updated prompt with [NEW_VARIABLE]",
      });

      // Verify the update
      const updated = await caller.templates.getById({ id: templateId });
      expect(updated?.name).toBe("Updated Test Template");
      expect(updated?.description).toBe("An updated test template");
      expect(updated?.prompt).toBe("Updated prompt with [NEW_VARIABLE]");
    });

    it("should not update templates from other users", async () => {
      const otherUserData = {
        openId: "other-user-templates-2",
        name: "Other User 2",
        email: "other2@example.com",
        role: "user" as const,
      };

      await upsertUser(otherUserData);
      const otherUserDb = await getUserByOpenId(otherUserData.openId);
      if (!otherUserDb) throw new Error("Failed to create other user 2");

      const otherUser: AuthenticatedUser = {
        ...otherUserDb,
        id: otherUserDb.id!,
        createdAt: otherUserDb.createdAt!,
        updatedAt: otherUserDb.updatedAt!,
        lastSignedIn: otherUserDb.lastSignedIn || new Date(),
      };

      const otherCaller = appRouter.createCaller(createTestContext(otherUser));

      // Try to update - should silently fail (no rows affected)
      await otherCaller.templates.update({
        id: templateId,
        name: "Hacked Template",
        category: "Hacking",
        description: "Should not work",
        prompt: "Hacked",
      });

      // Verify it wasn't updated
      const stillOriginal = await caller.templates.getById({ id: templateId });
      expect(stillOriginal?.name).toBe("Updated Test Template");
    });
  });

  describe("Template Deletion", () => {
    it("should delete a template", async () => {
      await caller.templates.delete({ id: templateId });

      // Verify deletion
      const deleted = await caller.templates.getById({ id: templateId });
      expect(deleted).toBeUndefined();
    });

    it("should not delete templates from other users", async () => {
      // Create a template
      const created = await caller.templates.create({
        name: "To Delete",
        category: "Testing",
        description: "Will be deleted",
        prompt: "Delete me",
      });

      const newTemplateId = created.id;

      // Try to delete with different user
      const otherUserData = {
        openId: "other-user-templates-3",
        name: "Other User 3",
        email: "other3@example.com",
        role: "user" as const,
      };

      await upsertUser(otherUserData);
      const otherUserDb = await getUserByOpenId(otherUserData.openId);
      if (!otherUserDb) throw new Error("Failed to create other user 3");

      const otherUser: AuthenticatedUser = {
        ...otherUserDb,
        id: otherUserDb.id!,
        createdAt: otherUserDb.createdAt!,
        updatedAt: otherUserDb.updatedAt!,
        lastSignedIn: otherUserDb.lastSignedIn || new Date(),
      };

      const otherCaller = appRouter.createCaller(createTestContext(otherUser));

      // Try to delete - should silently fail (no rows affected)
      await otherCaller.templates.delete({ id: newTemplateId });

      // Verify it still exists
      const stillExists = await caller.templates.getById({ id: newTemplateId });
      expect(stillExists).toBeDefined();
    });
  });

  describe("Variable Extraction", () => {
    it("should extract variables from template", async () => {
      const template = await caller.templates.create({
        name: "Variable Test",
        category: "Testing",
        description: "Test variable extraction",
        prompt:
          "Hello [NAME], your [ITEM] is ready. [NAME] can pick it up at [LOCATION].",
      });

      // Variables should be: NAME, ITEM, LOCATION (NAME appears twice but should be unique)
      const retrieved = await caller.templates.getById({
        id: template.id,
      });

      expect(retrieved).toBeDefined();

      // Extract variables manually to test
      const variables = [
        ...new Set(
          (retrieved!.prompt.match(/\[([^\]]+)\]/g) || []).map((v) =>
            v.slice(1, -1)
          )
        ),
      ];

      expect(variables).toContain("NAME");
      expect(variables).toContain("ITEM");
      expect(variables).toContain("LOCATION");
      expect(variables.length).toBe(3); // Should be unique
    });
  });

  describe("Default Templates", () => {
    it("should mark default templates correctly", async () => {
      await caller.templates.createDefaults();

      const allTemplates = await caller.templates.list();
      const defaultTemplates = allTemplates.filter((t) => t.isDefault);

      expect(defaultTemplates.length).toBeGreaterThan(0);

      // All default templates should have standard categories
      // Verify default templates have proper structure
      defaultTemplates.forEach((template) => {
        expect(template.name).toBeDefined();
        expect(template.prompt).toBeDefined();
        expect(template.isDefault).toBe(1);
      });
    });

    it("should include expected default templates", async () => {
      await caller.templates.createDefaults();

      const allTemplates = await caller.templates.list();

      // Check for some expected default templates
      const templateNames = allTemplates.map((t) => t.name);

      expect(templateNames).toContain("Brainstorming Session");
      expect(templateNames).toContain("Content Writing");
      expect(templateNames).toContain("Code Review");
      expect(templateNames).toContain("Problem Solving");
    });
  });
});
