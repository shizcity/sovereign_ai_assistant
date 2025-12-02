import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Folders and Tags", () => {
  it("should create a folder", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const folder = await caller.folders.create({
      name: "Work",
      color: "#3B82F6",
    });

    expect(folder).toBeDefined();
    expect(folder.name).toBe("Work");
    expect(folder.color).toBe("#3B82F6");
    expect(folder.userId).toBe(1);
  });

  it("should list user folders", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const folders = await caller.folders.list();

    expect(Array.isArray(folders)).toBe(true);
    expect(folders.length).toBeGreaterThan(0);
  });

  it("should create a tag", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tag = await caller.tags.create({
      name: "Urgent",
      color: "#EF4444",
    });

    expect(tag).toBeDefined();
    expect(tag.name).toBe("Urgent");
    expect(tag.color).toBe("#EF4444");
    expect(tag.userId).toBe(1);
  });

  it("should list user tags", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tags = await caller.tags.list();

    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
  });

  it("should assign folder to conversation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation
    const conversation = await caller.conversations.create({
      title: "Test Conversation",
      defaultModel: "gemini-pro",
    });

    // Create a folder
    const folder = await caller.folders.create({
      name: "Personal",
      color: "#10B981",
    });

    // Assign folder to conversation
    const result = await caller.conversations.assignFolder({
      conversationId: conversation.id,
      folderId: folder.id,
    });

    expect(result.success).toBe(true);
  });

  it("should assign tag to conversation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation
    const conversation = await caller.conversations.create({
      title: "Tagged Conversation",
      defaultModel: "gemini-pro",
    });

    // Create a tag
    const tag = await caller.tags.create({
      name: "Important",
      color: "#F59E0B",
    });

    // Assign tag to conversation
    const result = await caller.tags.assign({
      conversationId: conversation.id,
      tagId: tag.id,
    });

    expect(result.success).toBe(true);
  });

  it("should get tags for a conversation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation
    const conversation = await caller.conversations.create({
      title: "Multi-Tag Conversation",
      defaultModel: "gemini-pro",
    });

    // Create and assign multiple tags
    const tag1 = await caller.tags.create({
      name: "Research",
      color: "#8B5CF6",
    });

    const tag2 = await caller.tags.create({
      name: "Follow-up",
      color: "#EC4899",
    });

    await caller.tags.assign({
      conversationId: conversation.id,
      tagId: tag1.id,
    });

    await caller.tags.assign({
      conversationId: conversation.id,
      tagId: tag2.id,
    });

    // Get tags for conversation
    const conversationTags = await caller.tags.getForConversation({
      conversationId: conversation.id,
    });

    expect(Array.isArray(conversationTags)).toBe(true);
    expect(conversationTags.length).toBe(2);
    expect(conversationTags.some(t => t.name === "Research")).toBe(true);
    expect(conversationTags.some(t => t.name === "Follow-up")).toBe(true);
  });

  it("should remove tag from conversation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation
    const conversation = await caller.conversations.create({
      title: "Tag Removal Test",
      defaultModel: "gemini-pro",
    });

    // Create and assign a tag
    const tag = await caller.tags.create({
      name: "Temporary",
      color: "#6366F1",
    });

    await caller.tags.assign({
      conversationId: conversation.id,
      tagId: tag.id,
    });

    // Remove the tag
    const result = await caller.tags.remove({
      conversationId: conversation.id,
      tagId: tag.id,
    });

    expect(result.success).toBe(true);

    // Verify tag was removed
    const conversationTags = await caller.tags.getForConversation({
      conversationId: conversation.id,
    });

    expect(conversationTags.length).toBe(0);
  });
});
