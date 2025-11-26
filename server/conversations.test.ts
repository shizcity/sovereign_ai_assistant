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

describe("conversations", () => {
  it("creates a new conversation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.conversations.create({
      title: "Test Conversation",
      defaultModel: "gpt-4",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("lists user conversations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation first
    await caller.conversations.create({
      title: "Test Conversation",
      defaultModel: "gpt-4",
    });

    const conversations = await caller.conversations.list();

    expect(Array.isArray(conversations)).toBe(true);
    expect(conversations.length).toBeGreaterThan(0);
    expect(conversations[0]).toHaveProperty("title");
    expect(conversations[0]).toHaveProperty("defaultModel");
  });

  it("updates conversation title", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation
    const created = await caller.conversations.create({
      title: "Original Title",
      defaultModel: "gpt-4",
    });

    // Update the title
    const result = await caller.conversations.updateTitle({
      id: created.id,
      title: "Updated Title",
    });

    expect(result.success).toBe(true);
  });

  it("deletes a conversation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation
    const created = await caller.conversations.create({
      title: "To Be Deleted",
      defaultModel: "gpt-4",
    });

    // Delete it
    const result = await caller.conversations.delete({ id: created.id });

    expect(result.success).toBe(true);
  });
});
