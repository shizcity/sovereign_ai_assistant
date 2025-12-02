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

describe("Category Sharing System", () => {
  let user1Caller: ReturnType<typeof appRouter.createCaller>;
  let user2Caller: ReturnType<typeof appRouter.createCaller>;
  let user1Id: number;
  let user2Id: number;
  let sharedCategoryId: number;

  beforeAll(async () => {
    // Create two test users
    const user1Data = {
      openId: "test-user-cat-sharing-1",
      name: "Alice",
      email: "alice@example.com",
      role: "user" as const,
    };

    const user2Data = {
      openId: "test-user-cat-sharing-2",
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

  describe("Category Creation with Attribution", () => {
    it("should create a category with creator name", async () => {
      const category = await user1Caller.templates.createCategory({
        name: "Shared Category Test",
        color: "#3b82f6",
      });

      expect(category).toBeDefined();
      expect(category.name).toBe("Shared Category Test");
      expect(category.userId).toBe(user1Id);
      sharedCategoryId = category.id;
    });
  });

  describe("Category Visibility Toggle", () => {
    it("should toggle category to public", async () => {
      await user1Caller.templates.toggleCategoryPublic({
        id: sharedCategoryId,
        isPublic: true,
      });

      const publicCategories = await user1Caller.templates.listPublicCategories();
      const sharedCategory = publicCategories.find((c) => c.id === sharedCategoryId);
      
      expect(sharedCategory).toBeDefined();
      expect(sharedCategory?.isPublic).toBe(1);
    });

    it("should toggle category back to private", async () => {
      await user1Caller.templates.toggleCategoryPublic({
        id: sharedCategoryId,
        isPublic: false,
      });

      const publicCategories = await user1Caller.templates.listPublicCategories();
      const sharedCategory = publicCategories.find((c) => c.id === sharedCategoryId);
      
      expect(sharedCategory).toBeUndefined();
    });

    // Make it public again for import tests
    it("should make category public for import tests", async () => {
      await user1Caller.templates.toggleCategoryPublic({
        id: sharedCategoryId,
        isPublic: true,
      });
    });
  });

  describe("Public Category Browsing", () => {
    it("should list all public categories", async () => {
      const publicCategories = await user2Caller.templates.listPublicCategories();
      
      expect(publicCategories).toBeDefined();
      expect(Array.isArray(publicCategories)).toBe(true);
      
      const sharedCategory = publicCategories.find((c) => c.id === sharedCategoryId);
      expect(sharedCategory).toBeDefined();
      expect(sharedCategory?.name).toBe("Shared Category Test");
    });

    it("should not include private categories in public list", async () => {
      // Create a private category
      const privateCategory = await user1Caller.templates.createCategory({
        name: "Private Category",
        color: "#ef4444",
      });

      const publicCategories = await user2Caller.templates.listPublicCategories();
      const foundPrivate = publicCategories.find((c) => c.id === privateCategory.id);
      
      expect(foundPrivate).toBeUndefined();
    });
  });

  describe("Category Import", () => {
    it("should import a public category with all templates", async () => {
      // First, add some templates to the shared category
      await user1Caller.templates.create({
        name: "Template 1 in Shared Category",
        description: "First template",
        prompt: "Test prompt 1",
        categoryId: sharedCategoryId,
      });

      await user1Caller.templates.create({
        name: "Template 2 in Shared Category",
        description: "Second template",
        prompt: "Test prompt 2",
        categoryId: sharedCategoryId,
      });

      // User 2 imports the category
      const result = await user2Caller.templates.importCategory({
        categoryId: sharedCategoryId,
      });

      expect(result).toBeDefined();
      expect(result.categoryId).toBeDefined();

      // Verify the category was imported
      const user2Categories = await user2Caller.templates.listCategories();
      const importedCategory = user2Categories.find((c) => c.id === result.categoryId);
      
      expect(importedCategory).toBeDefined();
      expect(importedCategory?.name).toBe("Shared Category Test");
      expect(importedCategory?.userId).toBe(user2Id);
      expect(importedCategory?.isPublic).toBe(0); // Imported as private

      // Verify templates were imported
      const user2Templates = await user2Caller.templates.list();
      const importedTemplates = user2Templates.filter((t) => t.categoryId === result.categoryId);
      
      expect(importedTemplates.length).toBe(2);
      expect(importedTemplates[0].userId).toBe(user2Id);
      expect(importedTemplates[1].userId).toBe(user2Id);
    });

    it("should not allow importing private categories", async () => {
      // Create a private category
      const privateCategory = await user1Caller.templates.createCategory({
        name: "Private Category for Import Test",
        color: "#10b981",
      });

      // Try to import it (should fail)
      await expect(
        user2Caller.templates.importCategory({
          categoryId: privateCategory.id,
        })
      ).rejects.toThrow();
    });
  });

  describe("Category Import Edge Cases", () => {
    it("should handle importing empty categories", async () => {
      // Create an empty public category
      const emptyCategory = await user1Caller.templates.createCategory({
        name: "Empty Category",
        color: "#f59e0b",
      });

      await user1Caller.templates.toggleCategoryPublic({
        id: emptyCategory.id,
        isPublic: true,
      });

      // Import it
      const result = await user2Caller.templates.importCategory({
        categoryId: emptyCategory.id,
      });

      expect(result).toBeDefined();
      expect(result.categoryId).toBeDefined();

      // Verify no templates were imported
      const user2Templates = await user2Caller.templates.list();
      const importedTemplates = user2Templates.filter((t) => t.categoryId === result.categoryId);
      
      expect(importedTemplates.length).toBe(0);
    });
  });
});
