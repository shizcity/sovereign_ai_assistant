/**
 * Direct API Key Test Script
 * Tests API keys without fallback logic to see actual errors
 */

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log("\n=== Testing OpenAI API ===");
  console.log("API Key exists:", !!apiKey);
  console.log("API Key prefix:", apiKey?.substring(0, 10) + "...");
  
  if (!apiKey) {
    console.log("❌ No OpenAI API key found");
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Say 'test'" }],
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log("❌ OpenAI API Error:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log("✅ OpenAI API Success!");
      console.log("Response:", data.choices[0]?.message?.content);
    }
  } catch (error) {
    console.log("❌ OpenAI API Exception:", error);
  }
}

async function testGoogleAI() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  console.log("\n=== Testing Google AI API ===");
  console.log("API Key exists:", !!apiKey);
  console.log("API Key prefix:", apiKey?.substring(0, 10) + "...");
  
  if (!apiKey) {
    console.log("❌ No Google AI API key found");
    return;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: "Say 'test'" }],
          }],
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.log("❌ Google AI API Error:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log("✅ Google AI API Success!");
      console.log("Response:", data.candidates[0]?.content?.parts[0]?.text);
    }
  } catch (error) {
    console.log("❌ Google AI API Exception:", error);
  }
}

async function main() {
  console.log("Testing API Keys...\n");
  await testOpenAI();
  await testGoogleAI();
  console.log("\n=== Test Complete ===\n");
}

main();
