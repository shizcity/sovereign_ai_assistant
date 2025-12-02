import { routeLLMRequest } from "./server/llm-router";

async function testGemini() {
  console.log("Testing Google Gemini API integration...\n");

  try {
    const result = await routeLLMRequest(
      [
        {
          role: "user",
          content: "Hello! Please introduce yourself and tell me what model you are.",
        },
      ],
      "gemini-pro"
    );

    console.log("✅ SUCCESS! Gemini API is working.\n");
    console.log("Response details:");
    console.log("- Model:", result.model);
    console.log("- Provider:", result.provider);
    console.log("- Prompt tokens:", result.usage?.promptTokens);
    console.log("- Completion tokens:", result.usage?.completionTokens);
    console.log("- Total tokens:", result.usage?.totalTokens);
    console.log("\nMessage content:");
    console.log(result.content);
  } catch (error) {
    console.error("❌ FAILED! Error testing Gemini:");
    console.error(error);
    process.exit(1);
  }
}

testGemini();
