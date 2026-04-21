/**
 * Intelligent Sentinel Auto-Routing
 *
 * Uses a lightweight LLM classification call to match a user's query
 * to the best-fit Sentinel from the available pool.
 *
 * Design goals:
 * - Fast: single structured LLM call, no streaming
 * - Tier-aware: only suggests Sentinels the user can actually access
 * - Graceful: returns null on any failure so the UI degrades silently
 */

import { invokeLLM } from "./_core/llm";

// ─── Sentinel routing profiles ────────────────────────────────────────────────
// Keep in sync with DB slugs. These descriptions are used ONLY for the
// classification prompt — they are intentionally concise.

export const ROUTING_PROFILES = [
  {
    slug: "vixens-den",
    name: "Vixen's Den",
    emoji: "🦊",
    summary:
      "Structure, planning, project management, productivity, habits, systems, execution, organisation, to-do lists, workflows, goal-setting, time management, business operations.",
  },
  {
    slug: "mischief-exe",
    name: "Mischief.EXE",
    emoji: "⚡",
    summary:
      "Creative writing, brainstorming, ideation, storytelling, art, design, innovation, unconventional thinking, humour, marketing copy, naming, creative blocks, lateral thinking.",
  },
  {
    slug: "lunaris-vault",
    name: "Lunaris.Vault",
    emoji: "🌙",
    summary:
      "Research, learning, studying, history, science, philosophy, deep knowledge, summarising, explaining concepts, books, academia, analysis, fact-finding, technical documentation.",
  },
  {
    slug: "aetheris-flow",
    name: "Aetheris.Flow",
    emoji: "🌊",
    summary:
      "Personal growth, emotions, mental health, relationships, life transitions, self-reflection, journaling, mindfulness, values, purpose, wellbeing, coaching, motivation.",
  },
  {
    slug: "rift-exe",
    name: "Rift.EXE",
    emoji: "🌀",
    summary:
      "Identity, paradoxes, contradictions, complex decisions, bridging worlds, integration of opposites, navigating ambiguity, cross-cultural, liminal transitions, existential questions.",
  },
  {
    slug: "nyx",
    name: "Nyx",
    emoji: "✨",
    summary:
      "Cross-domain synthesis, pattern recognition, meta-thinking, connecting disparate ideas, accelerated learning, strategy at scale, coordinating multiple workstreams.",
  },
] as const;

export type SentinelSlug = (typeof ROUTING_PROFILES)[number]["slug"];

// ─── Main routing function ────────────────────────────────────────────────────

export interface RoutingResult {
  slug: SentinelSlug;
  name: string;
  emoji: string;
  reason: string; // 1-sentence explanation shown to the user
  confidence: "high" | "medium" | "low";
}

/**
 * Suggest the best Sentinel for a given query.
 *
 * @param query       The user's first message
 * @param allowedSlugs  Slugs the user can access (tier-gated). Pass all 6 for Pro/Creator.
 * @returns RoutingResult or null if classification fails / confidence is too low
 */
export async function suggestSentinel(
  query: string,
  allowedSlugs: string[]
): Promise<RoutingResult | null> {
  try {
    // Filter profiles to only those the user can access
    const available = ROUTING_PROFILES.filter((p) => allowedSlugs.includes(p.slug));
    if (available.length === 0) return null;

    const profileList = available
      .map((p) => `- ${p.slug} (${p.name} ${p.emoji}): ${p.summary}`)
      .join("\n");

    const systemPrompt = `You are a routing assistant. Given a user query, select the single best-matching AI Sentinel from the list below and explain why in one short sentence.

Available Sentinels:
${profileList}

Respond ONLY with valid JSON matching this schema exactly:
{
  "slug": "<one of the slugs above>",
  "reason": "<one sentence, max 15 words, starting with the Sentinel name>",
  "confidence": "<high|medium|low>"
}

Rules:
- Choose the slug that best matches the query's primary intent
- Use "low" confidence if the query is ambiguous or could fit multiple Sentinels equally
- Never suggest a slug not in the list above
- Keep reason concise and user-friendly`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `User query: "${query.slice(0, 500)}"` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentinel_routing",
          strict: true,
          schema: {
            type: "object",
            properties: {
              slug: { type: "string" },
              reason: { type: "string" },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
            },
            required: ["slug", "reason", "confidence"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response?.choices?.[0]?.message?.content;
    if (!rawContent) return null;
    const raw = typeof rawContent === "string" ? rawContent : (rawContent as Array<{type: string; text?: string}>).find(p => p.type === "text")?.text ?? null;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { slug: string; reason: string; confidence: string };

    // Validate the returned slug is actually in the allowed list
    const profile = available.find((p) => p.slug === parsed.slug);
    if (!profile) return null;

    // Drop low-confidence suggestions to avoid noise
    if (parsed.confidence === "low") return null;

    return {
      slug: profile.slug,
      name: profile.name,
      emoji: profile.emoji,
      reason: parsed.reason,
      confidence: parsed.confidence as "high" | "medium",
    };
  } catch {
    // Routing is best-effort — never throw
    return null;
  }
}
