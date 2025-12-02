/**
 * Multi-LLM Router Service
 * 
 * This service provides a unified interface for routing requests to different LLM providers
 * based on the selected model. It abstracts away provider-specific API differences.
 * 
 * Supported Providers:
 * - OpenAI (GPT-4, GPT-3.5 Turbo)
 * - Anthropic (Claude 3 Opus, Claude 3 Sonnet)
 * - Google AI (Gemini Pro)
 * - xAI (Grok-1)
 * - Manus Built-in (fallback)
 */

import { invokeLLM as manusLLM } from "./_core/llm";

// ============================================================================
// Types
// ============================================================================

export type LLMMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type LLMResponse = {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

export type LLMProvider = "openai" | "anthropic" | "google" | "xai" | "manus";

// ============================================================================
// Model Configuration
// ============================================================================

export const MODEL_CONFIG: Record<string, { provider: LLMProvider; apiModel: string }> = {
  "gpt-4": { provider: "openai", apiModel: "gpt-4" },
  "gpt-3.5-turbo": { provider: "openai", apiModel: "gpt-3.5-turbo" },
  "claude-3-opus": { provider: "anthropic", apiModel: "claude-3-opus-20240229" },
  "claude-3-sonnet": { provider: "anthropic", apiModel: "claude-3-sonnet-20240229" },
  "gemini-pro": { provider: "google", apiModel: "gemini-flash-latest" },
  "grok-1": { provider: "xai", apiModel: "grok-1" },
};

// ============================================================================
// API Key Management
// ============================================================================

export function getAPIKey(provider: LLMProvider): string | undefined {
  const envKeys: Record<LLMProvider, string> = {
    openai: process.env.OPENAI_API_KEY || "",
    anthropic: process.env.ANTHROPIC_API_KEY || "",
    google: process.env.GOOGLE_AI_API_KEY || "",
    xai: process.env.XAI_API_KEY || "",
    manus: process.env.BUILT_IN_FORGE_API_KEY || "",
  };

  return envKeys[provider] || undefined;
}

// ============================================================================
// Provider-Specific Implementations
// ============================================================================

/**
 * OpenAI API Integration
 */
async function callOpenAI(
  messages: LLMMessage[],
  model: string
): Promise<LLMResponse> {
  const apiKey = getAPIKey("openai");
  
  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to secrets.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content || "No response",
    model,
    provider: "openai",
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

/**
 * Anthropic API Integration
 */
async function callAnthropic(
  messages: LLMMessage[],
  model: string
): Promise<LLMResponse> {
  const apiKey = getAPIKey("anthropic");
  
  if (!apiKey) {
    throw new Error("Anthropic API key not configured. Please add ANTHROPIC_API_KEY to secrets.");
  }

  // Anthropic requires system messages to be separate
  const systemMessage = messages.find(m => m.role === "system")?.content;
  const conversationMessages = messages.filter(m => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemMessage,
      messages: conversationMessages.map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    content: data.content[0]?.text || "No response",
    model,
    provider: "anthropic",
    usage: {
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    },
  };
}

/**
 * Google AI API Integration
 */
async function callGoogle(
  messages: LLMMessage[],
  model: string
): Promise<LLMResponse> {
  const apiKey = getAPIKey("google");
  
  if (!apiKey) {
    throw new Error("Google AI API key not configured. Please add GOOGLE_AI_API_KEY to secrets.");
  }

  // Google Gemini uses a different message format
  const contents = messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    content: data.candidates[0]?.content?.parts[0]?.text || "No response",
    model,
    provider: "google",
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata?.totalTokenCount || 0,
    },
  };
}

/**
 * xAI API Integration
 */
async function callXAI(
  messages: LLMMessage[],
  model: string
): Promise<LLMResponse> {
  const apiKey = getAPIKey("xai");
  
  if (!apiKey) {
    throw new Error("xAI API key not configured. Please add XAI_API_KEY to secrets.");
  }

  // xAI uses OpenAI-compatible API
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`xAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content || "No response",
    model,
    provider: "xai",
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

/**
 * Manus Built-in LLM (Fallback)
 */
async function callManus(
  messages: LLMMessage[],
  _model: string
): Promise<LLMResponse> {
  const response = await manusLLM({
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  });

  const content = response.choices[0]?.message?.content;
  const contentString = typeof content === "string" ? content : "No response";

  return {
    content: contentString,
    model: "gpt-4",
    provider: "manus",
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  };
}

// ============================================================================
// Main Router Function
// ============================================================================

/**
 * Route an LLM request to the appropriate provider based on the selected model.
 * 
 * @param messages - Array of conversation messages
 * @param model - The model identifier (e.g., "gpt-4", "claude-3-opus")
 * @returns LLM response with content, model, and provider information
 * 
 * @example
 * const response = await routeLLMRequest([
 *   { role: "user", content: "Hello!" }
 * ], "claude-3-opus");
 * console.log(response.content); // AI response
 * console.log(response.provider); // "anthropic"
 */
export async function routeLLMRequest(
  messages: LLMMessage[],
  model: string
): Promise<LLMResponse> {
  const config = MODEL_CONFIG[model];

  if (!config) {
    console.warn(`Unknown model: ${model}, falling back to Manus built-in LLM`);
    return callManus(messages, model);
  }

  try {
    switch (config.provider) {
      case "openai":
        return await callOpenAI(messages, config.apiModel);
      
      case "anthropic":
        return await callAnthropic(messages, config.apiModel);
      
      case "google":
        return await callGoogle(messages, config.apiModel);
      
      case "xai":
        return await callXAI(messages, config.apiModel);
      
      case "manus":
        return await callManus(messages, config.apiModel);
      
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  } catch (error) {
    // If external API fails, fall back to Manus built-in LLM
    console.error(`Error calling ${config.provider} for model ${model}:`, error);
    console.log("Falling back to Manus built-in LLM");
    return callManus(messages, model);
  }
}

/**
 * Check which providers have valid API keys configured
 */
export function getConfiguredProviders(): Record<LLMProvider, boolean> {
  return {
    openai: !!getAPIKey("openai"),
    anthropic: !!getAPIKey("anthropic"),
    google: !!getAPIKey("google"),
    xai: !!getAPIKey("xai"),
    manus: !!getAPIKey("manus"),
  };
}

/**
 * Get list of available models based on configured API keys
 */
export function getAvailableModels(): string[] {
  const configured = getConfiguredProviders();
  
  return Object.entries(MODEL_CONFIG)
    .filter(([_, config]) => configured[config.provider])
    .map(([model]) => model);
}
