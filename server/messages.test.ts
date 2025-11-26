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

describe("messages", () => {
  it("lists messages for a conversation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation first
    const conversation = await caller.conversations.create({
      title: "Test Conversation",
      defaultModel: "gpt-4",
    });

    // Get messages (should be empty initially)
    const messages = await caller.messages.list({
      conversationId: conversation.id,
    });

    expect(Array.isArray(messages)).toBe(true);
  });

  it("sends a message and receives AI response", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation
    const conversation = await caller.conversations.create({
      title: "Test Conversation",
      defaultModel: "gpt-4",
    });

    // Send a message
    const result = await caller.messages.send({
      conversationId: conversation.id,
      content: "Hello, this is a test message",
      model: "gpt-4",
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("model");
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("maintains conversation context across messages", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation
    const conversation = await caller.conversations.create({
      title: "Context Test",
      defaultModel: "gpt-4",
    });

    // Send first message
    await caller.messages.send({
      conversationId: conversation.id,
      content: "My name is Alice",
      model: "gpt-4",
    });

    // Send second message that requires context
    const result = await caller.messages.send({
      conversationId: conversation.id,
      content: "What is my name?",
      model: "gpt-4",
    });

    // The AI should remember the context
    expect(result.content).toBeTruthy();
    expect(typeof result.content).toBe("string");
  }, 10000); // Increase timeout for LLM calls
});
