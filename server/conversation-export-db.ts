import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { conversations, messages, InsertConversation, InsertMessage } from "../drizzle/schema";

export async function exportConversationAsJSON(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get conversation
  const convos = await db.select().from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  
  if (convos.length === 0 || convos[0].userId !== userId) {
    throw new Error("Conversation not found or access denied");
  }

  const conversation = convos[0];

  // Get messages
  const msgs = await db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    conversation: {
      title: conversation.title,
      defaultModel: conversation.defaultModel,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    },
    messages: msgs.map(msg => ({
      role: msg.role,
      content: msg.content,
      model: msg.model,
      createdAt: msg.createdAt,
    })),
  };
}

export async function exportConversationAsMarkdown(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get conversation
  const convos = await db.select().from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  
  if (convos.length === 0 || convos[0].userId !== userId) {
    throw new Error("Conversation not found or access denied");
  }

  const conversation = convos[0];

  // Get messages
  const msgs = await db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  // Build markdown
  let markdown = `# ${conversation.title}\n\n`;
  markdown += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
  markdown += `**Model:** ${conversation.defaultModel}\n\n`;
  markdown += `---\n\n`;

  for (const msg of msgs) {
    const roleLabel = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
    markdown += `## ${roleLabel}\n\n`;
    markdown += `${msg.content}\n\n`;
    markdown += `*${new Date(msg.createdAt).toLocaleString()}*\n\n`;
    markdown += `---\n\n`;
  }

  return markdown;
}

export async function exportAllConversations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all user conversations
  const convos = await db.select().from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(conversations.createdAt);

  const exports = [];

  for (const convo of convos) {
    const msgs = await db.select().from(messages)
      .where(eq(messages.conversationId, convo.id))
      .orderBy(messages.createdAt);

    exports.push({
      conversation: {
        title: convo.title,
        defaultModel: convo.defaultModel,
        createdAt: convo.createdAt,
        updatedAt: convo.updatedAt,
      },
      messages: msgs.map(msg => ({
        role: msg.role,
        content: msg.content,
        model: msg.model,
        createdAt: msg.createdAt,
      })),
    });
  }

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    conversations: exports,
  };
}

export async function importConversation(data: any, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate data structure
  if (!data.conversation || !data.messages || !Array.isArray(data.messages)) {
    throw new Error("Invalid conversation data format");
  }

  // Create conversation
  const result = await db.insert(conversations).values({
    userId,
    title: data.conversation.title || "Imported Conversation",
    defaultModel: data.conversation.defaultModel || "gpt-4",
  });

  const conversationId = result[0].insertId;

  // Import messages
  if (data.messages.length > 0) {
    const messageValues = data.messages.map((msg: any) => ({
      conversationId,
      role: msg.role || 'user',
      content: msg.content || '',
      model: msg.model || data.conversation.defaultModel || 'gpt-4',
    }));

    await db.insert(messages).values(messageValues);
  }

  return conversationId;
}
