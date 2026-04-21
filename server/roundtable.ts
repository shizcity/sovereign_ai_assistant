import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import {
  roundTableSessions,
  roundTableReasoning,
  sentinelMemoryEntries,
  sentinels,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoundTableSentinel {
  id: number;
  name: string;
  slug: string;
  emoji: string;
  systemPrompt: string;
}

export interface SentinelReasoning {
  sentinelId: number;
  sentinelName: string;
  sentinelEmoji: string;
  round: number;
  thinkingChain: string;
  conclusion: string;
  confidence: number; // 0–1
  concerns: string[];
  dissent: string | null;
  memoriesUsed: string[];
}

export interface RoundTableResult {
  sessionId: number;
  question: string;
  sentinels: RoundTableSentinel[];
  reasoningChains: SentinelReasoning[];
  consensusScore: number;
  hasContradiction: boolean;
  contradictionSummary: string | null;
  finalAnswer: string;
  finalSentinelName: string;
  finalSentinelEmoji: string;
}

// ─── Memory Loading ───────────────────────────────────────────────────────────

/**
 * Load the most relevant memories for a given user and question context.
 * Uses keyword matching on tags and content since we don't have vector embeddings.
 */
async function loadRelevantMemories(
  userId: number,
  question: string,
  sentinelId: number,
  limit = 5
): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Extract keywords from the question (simple approach: words > 4 chars)
    const keywords = question
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 8);

    // Fetch recent high-importance memories for this user + sentinel
    const memories = await db
      .select()
      .from(sentinelMemoryEntries)
      .where(
        and(
          eq(sentinelMemoryEntries.userId, userId),
          eq(sentinelMemoryEntries.sentinelId, sentinelId),
          eq(sentinelMemoryEntries.isActive, 1)
        )
      )
      .orderBy(desc(sentinelMemoryEntries.importance))
      .limit(20);

    if (memories.length === 0) return [];

    // Score memories by keyword overlap with the question
    const scored = memories.map((m) => {
      const text = (m.content + " " + (m.context || "") + " " + (m.tags || "")).toLowerCase();
      const score = keywords.filter((kw) => text.includes(kw)).length;
      return { memory: m, score };
    });

    // Sort by score descending, take top `limit`
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit);

    return top
      .filter((s) => s.score > 0 || memories.length <= limit)
      .map((s) => `[${s.memory.category}] ${s.memory.content}`);
  } catch (err) {
    console.error("[RoundTable] Error loading memories:", err);
    return [];
  }
}

// ─── Single Sentinel Reasoning Step ──────────────────────────────────────────

async function runSentinelReasoning(
  sentinel: RoundTableSentinel,
  question: string,
  previousReasoning: SentinelReasoning[],
  round: number,
  memories: string[]
): Promise<SentinelReasoning> {
  const memoriesContext =
    memories.length > 0
      ? `\n\nRelevant memories from your history with this user:\n${memories.map((m) => `• ${m}`).join("\n")}`
      : "";

  const previousContext =
    previousReasoning.length > 0
      ? `\n\nPrevious reasoning from other Sentinels:\n${previousReasoning
          .map(
            (r) =>
              `**${r.sentinelName}** (Round ${r.round}):\nReasoning: ${r.thinkingChain}\nConclusion: ${r.conclusion}\nConfidence: ${r.confidence}`
          )
          .join("\n\n")}`
      : "";

  const systemPrompt = `${sentinel.systemPrompt}

You are participating in a Round Table deliberation — a structured multi-Sentinel reasoning process where multiple AI perspectives collaborate to reach the best possible answer.

Your role: Think deeply and honestly. Show your full reasoning chain. Do not just agree with previous Sentinels — challenge, refine, or build upon their thinking. Your unique perspective matters.${memoriesContext}`;

  const userPrompt = `Round ${round} of deliberation.

Question: ${question}${previousContext}

Respond with your full reasoning in this exact JSON structure:
{
  "thinkingChain": "Step-by-step reasoning process (3-6 sentences showing HOW you arrived at your conclusion)",
  "conclusion": "Your clear, direct conclusion (2-3 sentences)",
  "confidence": 0.85,
  "concerns": ["Any caveats or limitations", "Things you're uncertain about"],
  "dissent": null or "If you strongly disagree with a previous Sentinel's conclusion, state why here"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentinel_reasoning",
          strict: true,
          schema: {
            type: "object",
            properties: {
              thinkingChain: { type: "string" },
              conclusion: { type: "string" },
              confidence: { type: "number" },
              concerns: { type: "array", items: { type: "string" } },
              dissent: { type: ["string", "null"] },
            },
            required: ["thinkingChain", "conclusion", "confidence", "concerns", "dissent"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

    return {
      sentinelId: sentinel.id,
      sentinelName: sentinel.name,
      sentinelEmoji: sentinel.emoji,
      round,
      thinkingChain: parsed.thinkingChain || "",
      conclusion: parsed.conclusion || "",
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7)),
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      dissent: parsed.dissent || null,
      memoriesUsed: memories,
    };
  } catch (err) {
    console.error(`[RoundTable] Error in ${sentinel.name} reasoning:`, err);
    return {
      sentinelId: sentinel.id,
      sentinelName: sentinel.name,
      sentinelEmoji: sentinel.emoji,
      round,
      thinkingChain: "I encountered an issue processing this question.",
      conclusion: "Unable to complete reasoning for this round.",
      confidence: 0,
      concerns: ["Technical error during reasoning"],
      dissent: null,
      memoriesUsed: [],
    };
  }
}

// ─── Consensus Judge ──────────────────────────────────────────────────────────

async function judgeConsensus(
  question: string,
  reasoningChains: SentinelReasoning[]
): Promise<{
  consensusScore: number;
  hasContradiction: boolean;
  contradictionSummary: string | null;
  bestSentinelForAnswer: string;
  bestSentinelReason: string;
}> {
  const conclusionsSummary = reasoningChains
    .filter((r) => r.round === Math.max(...reasoningChains.map((x) => x.round)))
    .map((r) => `**${r.sentinelName}**: ${r.conclusion}`)
    .join("\n\n");

  const sentinelNames = Array.from(new Set(reasoningChains.map((r) => r.sentinelName)));

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a neutral consensus judge evaluating the degree of agreement between multiple AI Sentinels who have each reasoned about the same question.",
        },
        {
          role: "user",
          content: `Question: ${question}

Final conclusions from each Sentinel:
${conclusionsSummary}

Evaluate:
1. How much do these conclusions agree? (consensusScore: 0.0 = complete disagreement, 1.0 = perfect alignment)
2. Is there a meaningful contradiction that the user should know about?
3. Which Sentinel's perspective is best suited to deliver the final synthesized answer, and why?

Available Sentinels: ${sentinelNames.join(", ")}

Respond in JSON:
{
  "consensusScore": 0.82,
  "hasContradiction": false,
  "contradictionSummary": null,
  "bestSentinelForAnswer": "Sentinel Name",
  "bestSentinelReason": "Why this Sentinel is best suited to deliver the final answer"
}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "consensus_judgment",
          strict: true,
          schema: {
            type: "object",
            properties: {
              consensusScore: { type: "number" },
              hasContradiction: { type: "boolean" },
              contradictionSummary: { type: ["string", "null"] },
              bestSentinelForAnswer: { type: "string" },
              bestSentinelReason: { type: "string" },
            },
            required: [
              "consensusScore",
              "hasContradiction",
              "contradictionSummary",
              "bestSentinelForAnswer",
              "bestSentinelReason",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

    return {
      consensusScore: Math.min(1, Math.max(0, parsed.consensusScore || 0.7)),
      hasContradiction: parsed.hasContradiction || false,
      contradictionSummary: parsed.contradictionSummary || null,
      bestSentinelForAnswer: parsed.bestSentinelForAnswer || sentinelNames[0],
      bestSentinelReason: parsed.bestSentinelReason || "",
    };
  } catch (err) {
    console.error("[RoundTable] Consensus judge error:", err);
    return {
      consensusScore: 0.7,
      hasContradiction: false,
      contradictionSummary: null,
      bestSentinelForAnswer: sentinelNames[0],
      bestSentinelReason: "Default selection due to judge error",
    };
  }
}

// ─── Final Answer Synthesis ───────────────────────────────────────────────────

async function synthesizeFinalAnswer(
  deliveringSentinel: RoundTableSentinel,
  question: string,
  reasoningChains: SentinelReasoning[],
  consensusScore: number,
  hasContradiction: boolean,
  contradictionSummary: string | null
): Promise<string> {
  const allConclusions = reasoningChains
    .filter((r) => r.round === Math.max(...reasoningChains.map((x) => x.round)))
    .map((r) => `${r.sentinelName}: ${r.conclusion}`)
    .join("\n");

  const contradictionNote = hasContradiction
    ? `\n\nNote: There was meaningful disagreement in the deliberation: ${contradictionSummary}`
    : "";

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `${deliveringSentinel.systemPrompt}

You have just participated in a Round Table deliberation with other Sentinels. You are now delivering the final synthesized answer on behalf of the council. Speak in your authentic voice, but integrate the collective wisdom of the deliberation.`,
        },
        {
          role: "user",
          content: `Question: ${question}

The council reached consensus (score: ${(consensusScore * 100).toFixed(0)}%).

All Sentinel conclusions:
${allConclusions}${contradictionNote}

Deliver the final answer. Synthesize the collective reasoning into a clear, useful response. Be direct and speak in your authentic voice. You may acknowledge where the council had different perspectives if relevant.`,
        },
      ],
    });

    const content = response.choices[0].message.content;
    return typeof content === "string" ? content : "The council has reached its conclusion.";
  } catch (err) {
    console.error("[RoundTable] Final answer synthesis error:", err);
    return "The Round Table deliberation is complete. Please review the reasoning chains above for the council's conclusions.";
  }
}

// ─── Main Round Table Orchestrator ───────────────────────────────────────────

export async function runRoundTable(
  userId: number,
  question: string,
  selectedSentinelIds: number[],
  maxRounds = 2
): Promise<RoundTableResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Load Sentinel definitions
  const sentinelRows = await db
    .select()
    .from(sentinels)
    .where(eq(sentinels.isActive, 1));

  const selectedSentinels: RoundTableSentinel[] = sentinelRows
    .filter((s) => selectedSentinelIds.includes(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      emoji: s.symbolEmoji || "🤖",
      systemPrompt: s.systemPrompt,
    }));

  if (selectedSentinels.length < 2) {
    throw new Error("At least 2 Sentinels are required for a Round Table");
  }

  // Create session record
  const [sessionResult] = await db.insert(roundTableSessions).values({
    userId,
    question,
    sentinelIds: JSON.stringify(selectedSentinels.map((s) => s.id)),
    sentinelNames: JSON.stringify(selectedSentinels.map((s) => s.name)),
    status: "running",
    rounds: 0,
  });

  const sessionId = (sessionResult as any).insertId as number;

  const allReasoning: SentinelReasoning[] = [];

  try {
    // Load memories for each Sentinel
    const memoriesBySentinel: Record<number, string[]> = {};
    for (const sentinel of selectedSentinels) {
      memoriesBySentinel[sentinel.id] = await loadRelevantMemories(userId, question, sentinel.id);
    }

    // Run deliberation rounds
    for (let round = 1; round <= maxRounds; round++) {
      for (const sentinel of selectedSentinels) {
        // Each Sentinel sees all previous reasoning (from all Sentinels, all rounds)
        const previousReasoning = allReasoning.filter(
          (r) => !(r.sentinelId === sentinel.id && r.round === round)
        );

        const reasoning = await runSentinelReasoning(
          sentinel,
          question,
          previousReasoning,
          round,
          memoriesBySentinel[sentinel.id] || []
        );

        allReasoning.push(reasoning);

        // Save reasoning to DB
        await db.insert(roundTableReasoning).values({
          sessionId,
          sentinelId: sentinel.id,
          sentinelName: sentinel.name,
          sentinelEmoji: sentinel.emoji,
          round,
          thinkingChain: reasoning.thinkingChain,
          conclusion: reasoning.conclusion,
          confidence: reasoning.confidence.toFixed(2),
          concerns: JSON.stringify(reasoning.concerns),
          dissent: reasoning.dissent,
          memoriesUsed: JSON.stringify(reasoning.memoriesUsed),
        });
      }
    }

    // Judge consensus
    const judgment = await judgeConsensus(question, allReasoning);

    // Find the delivering Sentinel
    const deliveringSentinel =
      selectedSentinels.find((s) => s.name === judgment.bestSentinelForAnswer) ||
      selectedSentinels[0];

    // Synthesize final answer
    const finalAnswer = await synthesizeFinalAnswer(
      deliveringSentinel,
      question,
      allReasoning,
      judgment.consensusScore,
      judgment.hasContradiction,
      judgment.contradictionSummary
    );

    // Update session as completed
    await db
      .update(roundTableSessions)
      .set({
        status: "completed",
        rounds: maxRounds,
        consensusScore: judgment.consensusScore.toFixed(2),
        hasContradiction: judgment.hasContradiction ? 1 : 0,
        contradictionSummary: judgment.contradictionSummary,
        finalAnswer,
        finalSentinelId: deliveringSentinel.id,
        finalSentinelName: deliveringSentinel.name,
        completedAt: new Date(),
      })
      .where(eq(roundTableSessions.id, sessionId));

    return {
      sessionId,
      question,
      sentinels: selectedSentinels,
      reasoningChains: allReasoning,
      consensusScore: judgment.consensusScore,
      hasContradiction: judgment.hasContradiction,
      contradictionSummary: judgment.contradictionSummary,
      finalAnswer,
      finalSentinelName: deliveringSentinel.name,
      finalSentinelEmoji: deliveringSentinel.emoji,
    };
  } catch (err) {
    // Mark session as failed
    await db
      .update(roundTableSessions)
      .set({ status: "failed" })
      .where(eq(roundTableSessions.id, sessionId));
    throw err;
  }
}

// ─── Session History ──────────────────────────────────────────────────────────

export async function getRoundTableHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(roundTableSessions)
    .where(eq(roundTableSessions.userId, userId))
    .orderBy(desc(roundTableSessions.createdAt))
    .limit(limit);
}

export async function getRoundTableSession(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [session] = await db
    .select()
    .from(roundTableSessions)
    .where(
      and(eq(roundTableSessions.id, sessionId), eq(roundTableSessions.userId, userId))
    )
    .limit(1);

  if (!session) return null;

  const reasoning = await db
    .select()
    .from(roundTableReasoning)
    .where(eq(roundTableReasoning.sessionId, sessionId))
    .orderBy(roundTableReasoning.round, roundTableReasoning.sentinelId);

  return { session, reasoning };
}
