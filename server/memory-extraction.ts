import { invokeLLM } from "./_core/llm";

export type MemoryCategory = "insight" | "decision" | "milestone" | "preference" | "goal" | "achievement" | "challenge" | "pattern";

export interface ExtractedMemory {
  category: MemoryCategory;
  content: string;
  context: string;
  importance: number; // 0-100
  tags: string[];
}

/**
 * Extract memories from a conversation using LLM analysis
 * @param conversationMessages Array of messages from the conversation
 * @param sentinelName Name of the Sentinel involved in the conversation
 * @returns Array of extracted memories
 */
export async function extractMemoriesFromConversation(
  conversationMessages: Array<{ role: string; content: string }>,
  sentinelName: string
): Promise<ExtractedMemory[]> {
  // Only extract from conversations with at least 3 messages (user + AI + user minimum)
  if (conversationMessages.length < 3) {
    return [];
  }

  // Take the last 10 messages for context (to avoid token limits)
  const recentMessages = conversationMessages.slice(-10);

  const extractionPrompt = `You are a memory extraction system for ${sentinelName}, an AI Sentinel. Analyze this conversation and extract key memories that should be remembered for future interactions.

Extract memories in these categories:
- **insight**: Important realizations or understanding gained
- **decision**: Decisions made by the user
- **milestone**: Significant achievements or progress markers
- **preference**: User preferences, likes, dislikes
- **goal**: Goals or aspirations mentioned
- **achievement**: Accomplishments or successes
- **challenge**: Difficulties or obstacles faced
- **pattern**: Recurring themes or behaviors

For each memory, provide:
1. category (one of the above)
2. content (concise description of the memory, 1-2 sentences)
3. context (when/why this is important)
4. importance (0-100, how significant is this memory)
5. tags (3-5 relevant keywords)

Only extract memories that are:
- Specific and actionable
- Likely to be relevant in future conversations
- Not trivial or overly generic

Return a JSON array of memories. If no significant memories found, return an empty array.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: extractionPrompt },
        { role: "user", content: `Conversation to analyze:\n\n${recentMessages.map((m) => `${m.role}: ${m.content}`).join("\n\n")}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "memory_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              memories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: {
                      type: "string",
                      enum: ["insight", "decision", "milestone", "preference", "goal", "achievement", "challenge", "pattern"],
                    },
                    content: {
                      type: "string",
                      description: "Concise description of the memory (1-2 sentences)",
                    },
                    context: {
                      type: "string",
                      description: "When/why this is important",
                    },
                    importance: {
                      type: "integer",
                      description: "Importance score from 0-100",
                      minimum: 0,
                      maximum: 100,
                    },
                    tags: {
                      type: "array",
                      items: { type: "string" },
                      description: "3-5 relevant keywords",
                    },
                  },
                  required: ["category", "content", "context", "importance", "tags"],
                  additionalProperties: false,
                },
              },
            },
            required: ["memories"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      console.error("Unexpected response format from LLM");
      return [];
    }
    const result = JSON.parse(content);
    return result.memories || [];
  } catch (error) {
    console.error("Error extracting memories:", error);
    return [];
  }
}

/**
 * Deduplicate memories by checking for similar content
 * @param newMemories Newly extracted memories
 * @param existingMemories Existing memories from database
 * @returns Filtered array of unique memories
 */
export function deduplicateMemories(
  newMemories: ExtractedMemory[],
  existingMemories: Array<{ content: string }>
): ExtractedMemory[] {
  const existingContents = new Set(existingMemories.map((m) => m.content.toLowerCase().trim()));

  return newMemories.filter((newMem) => {
    const newContent = newMem.content.toLowerCase().trim();
    
    // Check for exact duplicates
    if (existingContents.has(newContent)) {
      return false;
    }

    // Check for very similar content (simple word overlap check)
    const newWords = new Set(newContent.split(/\s+/));
    for (const existingContent of Array.from(existingContents)) {
      const existingWords = new Set(existingContent.split(/\s+/));
      const overlap = Array.from(newWords).filter((w) => existingWords.has(w)).length;
      const similarity = overlap / Math.max(newWords.size, existingWords.size);

      // If more than 70% similar, consider it a duplicate
      if (similarity > 0.7) {
        return false;
      }
    }

    return true;
  });
}
