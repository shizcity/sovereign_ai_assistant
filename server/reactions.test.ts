import { describe, it, expect, beforeEach } from "vitest";
import { addReaction, removeReaction, getReactionsByMessage } from "./reactions-db";
import { getDb } from "./db";
import { messageReactions, messages, conversations, users } from "../drizzle/schema";

describe("Message Reactions", () => {
  let testUserId: number;
  let testConversationId: number;
  let testMessageId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up test data
    await db.delete(messageReactions);
    await db.delete(messages);
    await db.delete(conversations);

    // Create test user (assuming user 1 exists from auth)
    testUserId = 1;

    // Create test conversation
    const [conversation] = await db.insert(conversations).values({
      userId: testUserId,
      title: "Test Conversation",
      defaultModel: "gpt-4",
    });
    testConversationId = conversation.insertId;

    // Create test message
    const [message] = await db.insert(messages).values({
      conversationId: testConversationId,
      role: "assistant",
      content: "This is a test AI response",
      model: "gpt-4",
    });
    testMessageId = message.insertId;
  });

  it("should add a reaction to a message", async () => {
    await addReaction(testMessageId, testUserId, "👍");

    const reactions = await getReactionsByMessage(testMessageId);
    expect(reactions).toHaveLength(1);
    expect(reactions[0].emoji).toBe("👍");
    expect(reactions[0].count).toBe(1);
    expect(reactions[0].userIds).toContain(testUserId);
  });

  it("should not add duplicate reactions", async () => {
    await addReaction(testMessageId, testUserId, "👍");
    await addReaction(testMessageId, testUserId, "👍"); // Try to add again

    const reactions = await getReactionsByMessage(testMessageId);
    expect(reactions).toHaveLength(1);
    expect(reactions[0].count).toBe(1);
  });

  it("should allow multiple users to react with the same emoji", async () => {
    const user2Id = 2;
    
    await addReaction(testMessageId, testUserId, "❤️");
    await addReaction(testMessageId, user2Id, "❤️");

    const reactions = await getReactionsByMessage(testMessageId);
    expect(reactions).toHaveLength(1);
    expect(reactions[0].emoji).toBe("❤️");
    expect(reactions[0].count).toBe(2);
    expect(reactions[0].userIds).toContain(testUserId);
    expect(reactions[0].userIds).toContain(user2Id);
  });

  it("should allow a user to add multiple different reactions", async () => {
    await addReaction(testMessageId, testUserId, "👍");
    await addReaction(testMessageId, testUserId, "❤️");
    await addReaction(testMessageId, testUserId, "😄");

    const reactions = await getReactionsByMessage(testMessageId);
    expect(reactions).toHaveLength(3);
    
    const emojis = reactions.map(r => r.emoji).sort();
    expect(emojis).toEqual(["👍", "❤️", "😄"].sort());
  });

  it("should remove a reaction from a message", async () => {
    await addReaction(testMessageId, testUserId, "👍");
    
    let reactions = await getReactionsByMessage(testMessageId);
    expect(reactions).toHaveLength(1);

    await removeReaction(testMessageId, testUserId, "👍");
    
    reactions = await getReactionsByMessage(testMessageId);
    expect(reactions).toHaveLength(0);
  });

  it("should only remove the specific user's reaction", async () => {
    const user2Id = 2;
    
    await addReaction(testMessageId, testUserId, "👍");
    await addReaction(testMessageId, user2Id, "👍");

    await removeReaction(testMessageId, testUserId, "👍");

    const reactions = await getReactionsByMessage(testMessageId);
    expect(reactions).toHaveLength(1);
    expect(reactions[0].count).toBe(1);
    expect(reactions[0].userIds).toContain(user2Id);
    expect(reactions[0].userIds).not.toContain(testUserId);
  });

  it("should aggregate reactions correctly", async () => {
    const user2Id = 2;
    const user3Id = 3;

    await addReaction(testMessageId, testUserId, "👍");
    await addReaction(testMessageId, user2Id, "👍");
    await addReaction(testMessageId, user3Id, "❤️");

    const reactions = await getReactionsByMessage(testMessageId);
    expect(reactions).toHaveLength(2);

    const thumbsUp = reactions.find(r => r.emoji === "👍");
    expect(thumbsUp?.count).toBe(2);

    const heart = reactions.find(r => r.emoji === "❤️");
    expect(heart?.count).toBe(1);
  });

  it("should return empty array for message with no reactions", async () => {
    const reactions = await getReactionsByMessage(testMessageId);
    expect(reactions).toEqual([]);
  });
});
