/**
 * LLM Cost Calculator Service
 * 
 * Calculates the cost of LLM API calls based on token usage and provider pricing.
 * Pricing is updated as of December 2024 and should be reviewed periodically.
 */

import type { LLMProvider } from "./llm-router";

// ============================================================================
// Pricing Configuration (USD per 1M tokens)
// ============================================================================

/**
 * Pricing structure for LLM providers
 * All prices are in USD per 1 million tokens
 * Updated: December 2024
 */
export const LLM_PRICING: Record<
  string,
  {
    provider: LLMProvider;
    inputPricePer1M: number;
    outputPricePer1M: number;
    description: string;
  }
> = {
  "gpt-4": {
    provider: "openai",
    inputPricePer1M: 30.0,
    outputPricePer1M: 60.0,
    description: "OpenAI GPT-4 (8K context)",
  },
  "gpt-3.5-turbo": {
    provider: "openai",
    inputPricePer1M: 0.5,
    outputPricePer1M: 1.5,
    description: "OpenAI GPT-3.5 Turbo",
  },
  "claude-3-opus": {
    provider: "anthropic",
    inputPricePer1M: 15.0,
    outputPricePer1M: 75.0,
    description: "Anthropic Claude 3 Opus",
  },
  "claude-3-sonnet": {
    provider: "anthropic",
    inputPricePer1M: 3.0,
    outputPricePer1M: 15.0,
    description: "Anthropic Claude 3 Sonnet",
  },
  "gemini-pro": {
    provider: "google",
    inputPricePer1M: 0.5,
    outputPricePer1M: 1.5,
    description: "Google Gemini Pro (Flash)",
  },
  "grok-1": {
    provider: "xai",
    inputPricePer1M: 5.0,
    outputPricePer1M: 15.0,
    description: "xAI Grok-1 (estimated pricing)",
  },
  "manus-builtin": {
    provider: "manus",
    inputPricePer1M: 0.0,
    outputPricePer1M: 0.0,
    description: "Manus Built-in LLM (included with platform)",
  },
};

// ============================================================================
// Cost Calculation Functions
// ============================================================================

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
  model: string;
  provider: string;
  usage: TokenUsage;
}

/**
 * Calculate the cost of an LLM API call based on token usage
 * 
 * @param model - The model identifier (e.g., "gpt-4", "claude-3-opus")
 * @param usage - Token usage statistics from the API response
 * @returns Detailed cost breakdown
 * 
 * @example
 * const cost = calculateCost("gpt-4", {
 *   promptTokens: 100,
 *   completionTokens: 50,
 *   totalTokens: 150
 * });
 * console.log(cost.totalCost); // 0.006 (USD)
 */
export function calculateCost(model: string, usage: TokenUsage): CostBreakdown {
  const pricing = LLM_PRICING[model];

  if (!pricing) {
    // Unknown model - return zero cost
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: "USD",
      model,
      provider: "unknown",
      usage,
    };
  }

  // Calculate costs (pricing is per 1M tokens, so divide by 1,000,000)
  const inputCost = (usage.promptTokens / 1_000_000) * pricing.inputPricePer1M;
  const outputCost = (usage.completionTokens / 1_000_000) * pricing.outputPricePer1M;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    currency: "USD",
    model,
    provider: pricing.provider,
    usage,
  };
}

/**
 * Estimate the cost of a message before sending it
 * Uses a simple heuristic: ~4 characters per token
 * 
 * @param model - The model identifier
 * @param messageLength - Length of the message in characters
 * @param conversationTokens - Estimated tokens from conversation history
 * @returns Estimated cost breakdown
 */
export function estimateCost(
  model: string,
  messageLength: number,
  conversationTokens: number = 0
): CostBreakdown {
  const pricing = LLM_PRICING[model];

  if (!pricing) {
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: "USD",
      model,
      provider: "unknown",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  // Rough estimation: 4 characters per token
  const estimatedInputTokens = Math.ceil(messageLength / 4) + conversationTokens;
  const estimatedOutputTokens = Math.ceil(messageLength / 2); // Assume response is ~50% of input

  const usage: TokenUsage = {
    promptTokens: estimatedInputTokens,
    completionTokens: estimatedOutputTokens,
    totalTokens: estimatedInputTokens + estimatedOutputTokens,
  };

  return calculateCost(model, usage);
}

/**
 * Format cost as a human-readable string
 * 
 * @param cost - Cost in USD
 * @param showCurrency - Whether to include currency symbol
 * @returns Formatted cost string
 * 
 * @example
 * formatCost(0.006) // "$0.0060"
 * formatCost(0.000123) // "$0.00012"
 * formatCost(1.5) // "$1.50"
 */
export function formatCost(cost: number, showCurrency: boolean = true): string {
  const prefix = showCurrency ? "$" : "";
  
  if (cost === 0) {
    return `${prefix}0.00`;
  }
  
  if (cost < 0.0001) {
    return `${prefix}${cost.toFixed(6)}`;
  }
  
  if (cost < 0.01) {
    return `${prefix}${cost.toFixed(5)}`;
  }
  
  return `${prefix}${cost.toFixed(4)}`;
}

/**
 * Get pricing information for a specific model
 */
export function getModelPricing(model: string) {
  return LLM_PRICING[model] || null;
}

/**
 * Get all available pricing information
 */
export function getAllPricing() {
  return LLM_PRICING;
}

/**
 * Calculate total cost for multiple messages
 */
export function calculateTotalCost(costs: CostBreakdown[]): number {
  return costs.reduce((sum, cost) => sum + cost.totalCost, 0);
}

/**
 * Calculate average cost per message
 */
export function calculateAverageCost(costs: CostBreakdown[]): number {
  if (costs.length === 0) return 0;
  return calculateTotalCost(costs) / costs.length;
}

/**
 * Group costs by provider
 */
export function groupCostsByProvider(costs: CostBreakdown[]): Record<string, number> {
  const grouped: Record<string, number> = {};
  
  for (const cost of costs) {
    if (!grouped[cost.provider]) {
      grouped[cost.provider] = 0;
    }
    grouped[cost.provider] += cost.totalCost;
  }
  
  return grouped;
}

/**
 * Group costs by model
 */
export function groupCostsByModel(costs: CostBreakdown[]): Record<string, number> {
  const grouped: Record<string, number> = {};
  
  for (const cost of costs) {
    if (!grouped[cost.model]) {
      grouped[cost.model] = 0;
    }
    grouped[cost.model] += cost.totalCost;
  }
  
  return grouped;
}
