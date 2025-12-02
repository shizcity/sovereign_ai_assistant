import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { upsertUser, getUserByOpenId } from "./db";

describe("Template Categories", () => {
  let testUserId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    // Create a test user
    const testOpenId = `test-categories-${Date.now()}`;
    await upsertUser({
      openId: testOpenId,
      name: "Test User",
      email: "test@example.com",
      role: "user" as const,
    });

    const user = await getUserByOpenId(testOpenId);
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;

    // Create caller with test user context
    caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: testOpenId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
      },
    });
  });

  it("creates a new category", async () => {
    const category = await caller.templates.createCategory({
      name: "Test Category",
      color: "#ff0000",
    });

    expect(category).toMatchObject({
      name: "Test Category",
      color: "#ff0000",
      userId: testUserId,
    });
    expect(category.id).toBeDefined();
  });

  it("lists user categories", async () => {
    // Create multiple categories
    await caller.templates.createCategory({
      name: "Category A",
      color: "#ff0000",
    });
    await caller.templates.createCategory({
      name: "Category B",
      color: "#00ff00",
    });

    const categories = await caller.templates.listCategories();
    expect(categories.length).toBeGreaterThanOrEqual(2);
    expect(categories.some((c) => c.name === "Category A")).toBe(true);
    expect(categories.some((c) => c.name === "Category B")).toBe(true);
  });

  it("updates a category", async () => {
    const category = await caller.templates.createCategory({
      name: "Original Name",
      color: "#ff0000",
    });

    await caller.templates.updateCategory({
      id: category.id,
      name: "Updated Name",
      color: "#00ff00",
    });

    const categories = await caller.templates.listCategories();
    const updated = categories.find((c) => c.id === category.id);
    expect(updated).toMatchObject({
      name: "Updated Name",
      color: "#00ff00",
    });
  });

  it("deletes a category", async () => {
    const category = await caller.templates.createCategory({
      name: "To Delete",
      color: "#ff0000",
    });

    await caller.templates.deleteCategory({ id: category.id });

    const categories = await caller.templates.listCategories();
    expect(categories.find((c) => c.id === category.id)).toBeUndefined();
  });

  it("creates default categories", async () => {
    const result = await caller.templates.createDefaultCategories();
    expect(result.length).toBeGreaterThan(0);

    const categories = await caller.templates.listCategories();
    expect(categories.some((c) => c.name === "Brainstorming")).toBe(true);
    expect(categories.some((c) => c.name === "Writing")).toBe(true);
    expect(categories.some((c) => c.name === "Development")).toBe(true);
  });

  it("does not create duplicate default categories", async () => {
    await caller.templates.createDefaultCategories();
    const firstCount = (await caller.templates.listCategories()).length;

    await caller.templates.createDefaultCategories();
    const secondCount = (await caller.templates.listCategories()).length;

    expect(firstCount).toBe(secondCount);
  });

  it("assigns category to template", async () => {
    const category = await caller.templates.createCategory({
      name: "Test Category",
      color: "#ff0000",
    });

    const template = await caller.templates.create({
      name: "Test Template",
      prompt: "Test prompt",
      categoryId: category.id,
    });

    expect(template.categoryId).toBe(category.id);
  });

  it("updates template category", async () => {
    const category1 = await caller.templates.createCategory({
      name: "Category 1",
      color: "#ff0000",
    });
    const category2 = await caller.templates.createCategory({
      name: "Category 2",
      color: "#00ff00",
    });

    const template = await caller.templates.create({
      name: "Test Template",
      prompt: "Test prompt",
      categoryId: category1.id,
    });

    await caller.templates.update({
      id: template.id,
      categoryId: category2.id,
    });

    const updated = await caller.templates.getById({ id: template.id });
    expect(updated?.categoryId).toBe(category2.id);
  });

  it("allows null categoryId for uncategorized templates", async () => {
    const template = await caller.templates.create({
      name: "Uncategorized Template",
      prompt: "Test prompt",
      categoryId: null,
    });

    expect(template.categoryId).toBeNull();
  });
});
