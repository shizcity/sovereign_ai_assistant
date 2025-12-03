import { describe, it, expect } from "vitest";
import { generateConversationPDF } from "./pdf-export";

describe("PDF Export", () => {
  it("should generate a PDF buffer from conversation data", async () => {
    const testData = {
      title: "Test Conversation",
      createdAt: new Date("2025-12-02T10:00:00Z"),
      sentinelName: "Vixen's Den",
      modelName: "gemini-flash-latest",
      totalTokens: 1544,
      totalCost: 0.0002,
      messages: [
        {
          id: 1,
          conversationId: 1,
          role: "user" as const,
          content: "Hello, I need help with a project.",
          model: "gemini-flash-latest",
          provider: "google",
          promptTokens: 10,
          completionTokens: 0,
          totalTokens: 10,
          costUsd: "0.0001",
          createdAt: new Date("2025-12-02T10:00:00Z"),
        },
        {
          id: 2,
          conversationId: 1,
          role: "assistant" as const,
          content: "Of course! I'd be happy to help. What kind of project are you working on?",
          model: "gemini-flash-latest",
          provider: "google",
          promptTokens: 20,
          completionTokens: 15,
          totalTokens: 35,
          costUsd: "0.0001",
          createdAt: new Date("2025-12-02T10:00:05Z"),
        },
      ],
    };

    const pdfBuffer = await generateConversationPDF(testData);

    // Verify it's a valid buffer
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    
    // Verify it's not empty
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    // Verify it starts with PDF magic bytes
    const pdfHeader = pdfBuffer.toString("utf-8", 0, 4);
    expect(pdfHeader).toBe("%PDF");
  });

  it("should handle conversations without sentinel", async () => {
    const testData = {
      title: "Conversation Without Sentinel",
      createdAt: new Date("2025-12-02T10:00:00Z"),
      modelName: "gpt-4",
      totalTokens: 100,
      totalCost: 0.001,
      messages: [
        {
          id: 1,
          conversationId: 1,
          role: "user" as const,
          content: "Test message",
          model: "gpt-4",
          provider: "openai",
          promptTokens: 5,
          completionTokens: 0,
          totalTokens: 5,
          costUsd: "0.0005",
          createdAt: new Date(),
        },
      ],
    };

    const pdfBuffer = await generateConversationPDF(testData);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it("should handle long conversations with multiple messages", async () => {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      conversationId: 1,
      role: (i % 2 === 0 ? "user" : "assistant") as const,
      content: `Message ${i + 1}: This is a test message with some content.`,
      model: "gemini-pro",
      provider: "google",
      promptTokens: 10,
      completionTokens: 10,
      totalTokens: 20,
      costUsd: "0.0001",
      createdAt: new Date(),
    }));

    const testData = {
      title: "Long Conversation Test",
      createdAt: new Date(),
      sentinelName: "Mischief.EXE",
      modelName: "gemini-pro",
      totalTokens: 400,
      totalCost: 0.002,
      messages,
    };

    const pdfBuffer = await generateConversationPDF(testData);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    // Long conversation should produce a larger PDF
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });

  it("should handle markdown formatting in messages", async () => {
    const testData = {
      title: "Markdown Test",
      createdAt: new Date(),
      modelName: "claude-3-opus",
      totalTokens: 50,
      totalCost: 0.0005,
      messages: [
        {
          id: 1,
          conversationId: 1,
          role: "user" as const,
          content: "Can you format this with **bold** and *italic*?",
          model: "claude-3-opus",
          provider: "anthropic",
          promptTokens: 10,
          completionTokens: 0,
          totalTokens: 10,
          costUsd: "0.0002",
          createdAt: new Date(),
        },
        {
          id: 2,
          conversationId: 1,
          role: "assistant" as const,
          content: "Sure! Here's a list:\n- Item 1\n- Item 2\n\nAnd some `code`.",
          model: "claude-3-opus",
          provider: "anthropic",
          promptTokens: 20,
          completionTokens: 20,
          totalTokens: 40,
          costUsd: "0.0003",
          createdAt: new Date(),
        },
      ],
    };

    const pdfBuffer = await generateConversationPDF(testData);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
