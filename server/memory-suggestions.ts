import { invokeLLM } from "./_core/llm";

export interface MemorySuggestion {
  content: string;
  category: "insight" | "decision" | "goal" | "milestone" | "achievement" | "preference" | "challenge" | "pattern";
  importance: number; // 0-100
  tags: string[];
  reasoning: string;
}

/**
 * Analyze a conversation exchange and suggest memories worth saving
 */
export async function detectMemorySuggestions(
  userMessage: string,
  aiResponse: string,
  conversationHistory: Array<{ role: string; content: string }>,
  sentinelName?: string
): Promise<MemorySuggestion[]> {
  const systemPrompt = `You are a memory detection assistant. Analyze conversations and identify moments worth saving as memories.

Focus on detecting:
- **Insights**: New realizations, understanding, or perspectives
- **Decisions**: Clear choices made or commitments
- **Goals**: Stated objectives or aspirations
- **Milestones**: Progress markers or achievements
- **Preferences**: Stated likes, dislikes, or working styles
- **Challenges**: Obstacles or difficulties mentioned
- **Patterns**: Recurring themes or behaviors

For each memory-worthy moment:
1. Extract the core content (1-2 sentences)
2. Categorize it appropriately
3. Score importance (0-100):
   - 80-100: Life-changing decisions, major goals, breakthrough insights
   - 60-79: Significant preferences, important milestones, key decisions
   - 40-59: Useful insights, minor goals, helpful patterns
   - 20-39: Casual preferences, small observations
   - 0-19: Trivial or redundant information
4. Add relevant tags for future retrieval
5. Explain why this is worth remembering

Only suggest memories that are:
- Specific and actionable
- Personally meaningful
- Not already obvious or redundant
- Worth recalling in future conversations

Return empty array if nothing significant is detected.`;

  const userPrompt = `Analyze this conversation exchange and suggest memories:

**User**: ${userMessage}

**${sentinelName || "AI"}**: ${aiResponse}

${conversationHistory.length > 0 ? `**Recent Context** (last ${Math.min(3, conversationHistory.length)} messages):\n${conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join("\n")}` : ""}

Return a JSON array of memory suggestions. Each suggestion must have:
- content: string (the memory text, 1-2 sentences)
- category: "insight" | "decision" | "goal" | "milestone" | "achievement" | "preference" | "challenge" | "pattern"
- importance: number (0-100)
- tags: string[] (2-5 relevant tags)
- reasoning: string (why this is worth remembering)

Example:
[
  {
    "content": "I work best in the morning and prefer to tackle creative tasks before noon.",
    "category": "preference",
    "importance": 65,
    "tags": ["productivity", "schedule", "creativity", "morning"],
    "reasoning": "Clear preference about optimal working time that can guide future task planning"
  }
]`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "memory_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    content: { type: "string" },
                    category: {
                      type: "string",
                      enum: ["insight", "decision", "goal", "milestone", "achievement", "preference", "challenge", "pattern"],
                    },
                    importance: { type: "number" },
                    tags: {
                      type: "array",
                      items: { type: "string" },
                    },
                    reasoning: { type: "string" },
                  },
                  required: ["content", "category", "importance", "tags", "reasoning"],
                  additionalProperties: false,
                },
              },
            },
            required: ["suggestions"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') return [];

    const parsed = JSON.parse(content);
    const suggestions = parsed.suggestions || [];

    // Deduplicate and filter low-quality suggestions
    const filtered = suggestions.filter((s: MemorySuggestion) => {
      // Must have meaningful content
      if (!s.content || s.content.length < 10) return false;
      
      // Must have reasonable importance score
      if (s.importance < 20) return false;
      
      // Must have at least one tag
      if (!s.tags || s.tags.length === 0) return false;
      
      return true;
    });

    // Sort by importance (highest first)
    filtered.sort((a: MemorySuggestion, b: MemorySuggestion) => b.importance - a.importance);

    // Return top 3 suggestions max to avoid overwhelming user
    return filtered.slice(0, 3);
  } catch (error) {
    console.error("Error detecting memory suggestions:", error);
    return [];
  }
}

/**
 * Calculate importance score based on conversation context
 */
export function calculateImportanceScore(
  content: string,
  category: string,
  conversationDepth: number,
  userEngagement: number
): number {
  let score = 50; // Base score

  // Category weights
  const categoryWeights: Record<string, number> = {
    goal: 15,
    decision: 15,
    milestone: 12,
    achievement: 12,
    insight: 10,
    challenge: 8,
    preference: 5,
    pattern: 5,
  };

  score += categoryWeights[category] || 0;

  // Conversation depth (longer conversations = more important)
  score += Math.min(conversationDepth * 2, 15);

  // User engagement (more back-and-forth = more important)
  score += Math.min(userEngagement * 3, 15);

  // Content length (more detailed = more important)
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 30) score += 10;
  else if (wordCount > 15) score += 5;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Check if a suggestion is similar to existing memories
 */
export function isSimilarToExisting(
  suggestion: string,
  existingMemories: string[]
): boolean {
  const suggestionWords = new Set(
    suggestion.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );

  for (const memory of existingMemories) {
    const memoryWords = new Set(
      memory.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    );

    // Calculate Jaccard similarity
    const intersection = new Set(Array.from(suggestionWords).filter(w => memoryWords.has(w)));
    const union = new Set([...Array.from(suggestionWords), ...Array.from(memoryWords)]);
    const similarity = intersection.size / union.size;

    // If more than 40% similar, consider it duplicate
    // Lowered from 0.6 to 0.4 to catch semantically similar phrases
    // that may use different words (e.g., "want" vs "decided")
    if (similarity > 0.4) return true;
  }

  return false;
}
