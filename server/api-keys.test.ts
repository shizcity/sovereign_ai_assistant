import { describe, expect, it } from "vitest";
import { routeLLMRequest } from "./llm-router";

/**
 * API Key Validation Tests
 * 
 * These tests verify that the configured API keys are valid by making
 * lightweight API calls to each provider.
 */

describe("API Key Validation", () => {
  it.skip("validates OpenAI API key with a simple request (SKIPPED: No billing quota)", async () => {
    // OpenAI API key is valid but account has no billing/quota
    // User needs to add payment method at https://platform.openai.com/account/billing
    const messages = [
      { role: "user" as const, content: "Say 'test' and nothing else." },
    ];

    const response = await routeLLMRequest(messages, "gpt-3.5-turbo");

    console.log("OpenAI Response:", JSON.stringify(response, null, 2));

    expect(response).toBeDefined();
    expect(response.content).toBeTruthy();
    expect(response.provider).toBe("openai");
    expect(response.model).toBe("gpt-3.5-turbo");
    expect(typeof response.content).toBe("string");
    expect(response.content.length).toBeGreaterThan(0);
  }, 15000); // 15 second timeout for API call

  it("validates Google AI API key with a simple request", async () => {
    const messages = [
      { role: "user" as const, content: "Say 'test' and nothing else." },
    ];

    const response = await routeLLMRequest(messages, "gemini-pro");

    console.log("Google AI Response:", JSON.stringify(response, null, 2));

    expect(response).toBeDefined();
    expect(response.content).toBeTruthy();
    expect(response.provider).toBe("google");
    expect(response.model).toBe("gemini-flash-latest");
    expect(typeof response.content).toBe("string");
    expect(response.content.length).toBeGreaterThan(0);
  }, 15000); // 15 second timeout for API call

  it("falls back to Manus LLM when using unsupported model", async () => {
    const messages = [
      { role: "user" as const, content: "Say 'test' and nothing else." },
    ];

    const response = await routeLLMRequest(messages, "unknown-model");

    expect(response).toBeDefined();
    expect(response.content).toBeTruthy();
    expect(response.provider).toBe("manus");
    expect(typeof response.content).toBe("string");
  }, 15000);
});
