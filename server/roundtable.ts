import { invokeLLM, invokeLLMStream } from "./_core/llm";
import { getDb } from "./db";
import {
  roundTableSessions,
  roundTableReasoning,
  sentinelMemoryEntries,
  sentinels,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { EventEmitter } from "events";
import crypto from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeliberationMode = "parallel" | "shared" | "synchronous";

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
  // Phase 2 additions
  dissentScore: number; // 0–1: how far this Sentinel diverges from group median
  isOutlier: boolean;   // true if dissentScore > 0.5
  // M4: Model Switch Log
  modelUsed: string;   // LLM model name returned by the API
  latencyMs: number;   // wall-clock ms for this Sentinel's LLM call
}

/** A single structured contradiction between two specific Sentinels */
export interface ContradictionFlag {
  sentinelA: string;
  sentinelB: string;
  claim: string;        // The specific claim they disagree on
  positionA: string;    // What Sentinel A says
  positionB: string;    // What Sentinel B says
  severity: "minor" | "moderate" | "major";
}

export interface InterruptionEvent {
  timestamp: string;
  message: string;
  afterSentinel: string | null; // Which Sentinel had just spoken when interrupted
  afterRound: number;
}

export interface RoundTableResult {
  sessionId: number;
  question: string;
  sentinels: RoundTableSentinel[];
  reasoningChains: SentinelReasoning[];
  consensusScore: number;
  hasContradiction: boolean;
  contradictionSummary: string | null;
  contradictions: ContradictionFlag[]; // Phase 2: structured flags
  finalAnswer: string;
  finalSentinelName: string;
  finalSentinelEmoji: string;
  routingReason: string; // Phase 2: why this Sentinel was chosen
  deliberationMode: DeliberationMode; // Phase 3
  interruptionLog: InterruptionEvent[]; // Phase 3
  streamId: string | null; // Phase 3: SSE channel ID
}

// ─── SSE Streaming Bus ────────────────────────────────────────────────────────

/**
 * Global in-process event bus for streaming reasoning tokens.
 * Key: streamId (uuid), Value: EventEmitter
 * Cleaned up when session completes or fails.
 */
export const streamBus = new Map<string, EventEmitter>();

/**
 * Pause flags for human interruption.
 * Key: sessionId, Value: { paused: boolean; injectedMessage: string | null }
 */
export const pauseFlags = new Map<number, { paused: boolean; injectedMessage: string | null }>();

function emitStreamEvent(
  streamId: string,
  event: "token" | "sentinel_start" | "sentinel_done" | "complete" | "error",
  data: Record<string, unknown>
) {
  const emitter = streamBus.get(streamId);
  if (emitter) emitter.emit("event", { event, data });
}

// ─── Memory Loading ───────────────────────────────────────────────────────────

async function loadRelevantMemories(
  userId: number,
  question: string,
  sentinelId: number,
  limit = 5
): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const keywords = question
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 8);

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

    const scored = memories.map((m) => {
      const text = (m.content + " " + (m.context || "") + " " + (m.tags || "")).toLowerCase();
      const score = keywords.filter((kw) => text.includes(kw)).length;
      return { memory: m, score };
    });

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
  memories: string[],
  mode: DeliberationMode,
  streamId: string | null,
  injectedMessage: string | null = null
): Promise<SentinelReasoning> {
  const memoriesContext =
    memories.length > 0
      ? `\n\nRelevant memories from your history with this user:\n${memories.map((m) => `• ${m}`).join("\n")}`
      : "";

  // In "parallel" mode: only see prior rounds' reasoning (original behaviour)
  // In "shared" mode: see all prior reasoning including current round from other Sentinels
  // In "synchronous" mode: see all reasoning from Sentinels that ran before you in this round
  const previousContext =
    previousReasoning.length > 0
      ? `\n\nPrevious reasoning from other Sentinels:\n${previousReasoning
          .map(
            (r) =>
              `**${r.sentinelName}** (Round ${r.round}):\nReasoning: ${r.thinkingChain}\nConclusion: ${r.conclusion}\nConfidence: ${r.confidence}`
          )
          .join("\n\n")}`
      : "";

  const modeInstruction =
    mode === "synchronous"
      ? "\n\nIMPORTANT: You are responding AFTER the Sentinels listed above. Explicitly acknowledge their perspectives, then build upon, challenge, or synthesize their reasoning. Your response should show clear intellectual progression from what came before."
      : mode === "shared"
      ? "\n\nIMPORTANT: You have full visibility into all prior Sentinel reasoning. Use this shared context to avoid redundancy — focus on what you uniquely contribute that others have not covered."
      : "";

  const injectionContext = injectedMessage
    ? `\n\n⚡ HUMAN INTERRUPTION: The user has injected this message mid-deliberation:\n"${injectedMessage}"\nAddress this directly in your reasoning.`
    : "";

  const systemPrompt = `${sentinel.systemPrompt}

You are participating in a Round Table deliberation — a structured multi-Sentinel reasoning process where multiple AI perspectives collaborate to reach the best possible answer.

Your role: Think deeply and honestly. Show your full reasoning chain. Do not just agree with previous Sentinels — challenge, refine, or build upon their thinking. Your unique perspective matters.${memoriesContext}`;

  const userPrompt = `Round ${round} of deliberation.

Question: ${question}${previousContext}${modeInstruction}${injectionContext}

Respond with your full reasoning in this EXACT JSON structure (no markdown, no code fences, raw JSON only):
{
  "thinkingChain": "Step-by-step reasoning process (3-6 sentences showing HOW you arrived at your conclusion)",
  "conclusion": "Your clear, direct conclusion (2-3 sentences)",
  "confidence": 0.85,
  "concerns": ["Any caveats or limitations", "Things you're uncertain about"],
  "dissent": null
}

IMPORTANT: Output ONLY the JSON object. Do not wrap it in markdown or add any text before or after.`;

  // Emit sentinel_start event for streaming
  if (streamId) {
    emitStreamEvent(streamId, "sentinel_start", {
      sentinelId: sentinel.id,
      sentinelName: sentinel.name,
      sentinelEmoji: sentinel.emoji,
      round,
    });
  }

  try {
    const t0 = Date.now();

    // Accumulate tokens as they stream in
    let streamedText = "";

    const { text: assembledText, model: streamedModel } = await invokeLLMStream(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      },
      (token: string) => {
        streamedText += token;
        // Emit each token chunk over SSE so the frontend can render it live
        if (streamId) {
          emitStreamEvent(streamId, "token", {
            sentinelId: sentinel.id,
            sentinelName: sentinel.name,
            sentinelEmoji: sentinel.emoji,
            round,
            token,
          });
        }
      }
    );

    // Parse JSON from the assembled plain-text response
    // Strip any accidental markdown code fences the model may add
    const jsonText = assembledText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    const parsed = JSON.parse(jsonText);

    const latencyMs = Date.now() - t0;
    const modelUsed: string = streamedModel ?? "gemini-2.5-flash";
    const result: SentinelReasoning = {
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
      dissentScore: 0,  // computed later by computeDissentScores
      isOutlier: false,
      modelUsed,
      latencyMs,
    };

    // Emit sentinel_done with full reasoning for streaming display
    if (streamId) {
      emitStreamEvent(streamId, "sentinel_done", {
        sentinelId: sentinel.id,
        sentinelName: sentinel.name,
        sentinelEmoji: sentinel.emoji,
        round,
        thinkingChain: result.thinkingChain,
        conclusion: result.conclusion,
        confidence: result.confidence,
        concerns: result.concerns,
        dissent: result.dissent,
      });
    }

    return result;
  } catch (err) {
    console.error(`[RoundTable] Error in ${sentinel.name} reasoning:`, err);
    const fallback: SentinelReasoning = {
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
      dissentScore: 0,
      isOutlier: false,
      modelUsed: "gemini-2.5-flash",
      latencyMs: 0,
    };
    if (streamId) {
      emitStreamEvent(streamId, "sentinel_done", {
        sentinelId: sentinel.id,
        sentinelName: sentinel.name,
        sentinelEmoji: sentinel.emoji,
        round,
        thinkingChain: fallback.thinkingChain,
        conclusion: fallback.conclusion,
        confidence: 0,
        concerns: fallback.concerns,
        dissent: null,
      });
    }
    return fallback;
  }
}

// ─── Dissent Scoring ──────────────────────────────────────────────────────────

function computeDissentScores(chains: SentinelReasoning[]): SentinelReasoning[] {
  const maxRound = Math.max(...chains.map((r) => r.round));
  const finalRound = chains.filter((r) => r.round === maxRound);

  if (finalRound.length < 2) {
    return chains.map((r) => ({ ...r, dissentScore: 0, isOutlier: false }));
  }

  const meanConfidence =
    finalRound.reduce((sum, r) => sum + r.confidence, 0) / finalRound.length;

  const scored = new Map<number, number>();
  for (const r of finalRound) {
    const confidenceDelta = Math.abs(r.confidence - meanConfidence);
    const dissentBonus = r.dissent ? 0.3 : 0;
    const rawScore = Math.min(1, confidenceDelta * 2 + dissentBonus);
    scored.set(r.sentinelId, rawScore);
  }

  return chains.map((r) => {
    const dissentScore = scored.get(r.sentinelId) ?? 0;
    return {
      ...r,
      dissentScore,
      isOutlier: dissentScore > 0.4,
    };
  });
}

// ─── Structured Contradiction Detection ──────────────────────────────────────

async function detectContradictions(
  question: string,
  reasoningChains: SentinelReasoning[]
): Promise<ContradictionFlag[]> {
  const maxRound = Math.max(...reasoningChains.map((r) => r.round));
  const finalRound = reasoningChains.filter((r) => r.round === maxRound);

  if (finalRound.length < 2) return [];

  const conclusionsSummary = finalRound
    .map((r) => `**${r.sentinelName}**: ${r.conclusion}`)
    .join("\n\n");

  const sentinelNames = finalRound.map((r) => r.sentinelName);

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a contradiction analyst. Your job is to identify specific factual or logical disagreements between multiple AI perspectives. Be precise and only flag genuine contradictions, not mere differences in emphasis.",
        },
        {
          role: "user",
          content: `Question: ${question}

Final conclusions from each Sentinel:
${conclusionsSummary}

Identify any specific contradictions where two Sentinels take genuinely opposing positions on the same claim. For each contradiction, identify:
1. Which two Sentinels contradict each other
2. The specific claim they disagree on
3. Each Sentinel's position on that claim
4. Severity: "minor" (different emphasis), "moderate" (different conclusions), "major" (directly opposing facts)

Available Sentinels: ${sentinelNames.join(", ")}

Return a JSON array. If there are no meaningful contradictions, return an empty array [].

{
  "contradictions": [
    {
      "sentinelA": "Sentinel Name",
      "sentinelB": "Other Sentinel Name",
      "claim": "The specific point they disagree on",
      "positionA": "What Sentinel A says",
      "positionB": "What Sentinel B says",
      "severity": "moderate"
    }
  ]
}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "contradiction_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              contradictions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sentinelA: { type: "string" },
                    sentinelB: { type: "string" },
                    claim: { type: "string" },
                    positionA: { type: "string" },
                    positionB: { type: "string" },
                    severity: { type: "string", enum: ["minor", "moderate", "major"] },
                  },
                  required: ["sentinelA", "sentinelB", "claim", "positionA", "positionB", "severity"],
                  additionalProperties: false,
                },
              },
            },
            required: ["contradictions"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    return Array.isArray(parsed.contradictions) ? parsed.contradictions : [];
  } catch (err) {
    console.error("[RoundTable] Contradiction detection error:", err);
    return [];
  }
}

// ─── Consensus Judge + Output Routing ────────────────────────────────────────

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
3. Which Sentinel's perspective is best suited to deliver the final synthesized answer, and why? Consider which Sentinel's domain expertise, reasoning style, and conclusion best serves this specific question.

Available Sentinels: ${sentinelNames.join(", ")}

Respond in JSON:
{
  "consensusScore": 0.82,
  "hasContradiction": false,
  "contradictionSummary": null,
  "bestSentinelForAnswer": "Sentinel Name",
  "bestSentinelReason": "Why this Sentinel is best suited to deliver the final answer — be specific about their domain fit and reasoning quality"
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
  contradictionSummary: string | null,
  interruptionLog: InterruptionEvent[]
): Promise<string> {
  const allConclusions = reasoningChains
    .filter((r) => r.round === Math.max(...reasoningChains.map((x) => x.round)))
    .map((r) => `${r.sentinelName}: ${r.conclusion}`)
    .join("\n");

  const contradictionNote = hasContradiction
    ? `\n\nNote: There was meaningful disagreement in the deliberation: ${contradictionSummary}`
    : "";

  const interruptionNote =
    interruptionLog.length > 0
      ? `\n\nThe user interrupted the deliberation with the following message(s):\n${interruptionLog.map((e) => `• "${e.message}"`).join("\n")}\nAddress these points in your final answer.`
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
${allConclusions}${contradictionNote}${interruptionNote}

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
  maxRounds = 2,
  mode: DeliberationMode = "parallel"
): Promise<RoundTableResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate a stream ID for SSE
  const streamId = crypto.randomUUID();
  const emitter = new EventEmitter();
  streamBus.set(streamId, emitter);

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
    streamBus.delete(streamId);
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
    deliberationMode: mode,
    streamId,
    isPaused: 0,
    interruptionLog: JSON.stringify([]),
  });

  const sessionId = (sessionResult as any).insertId as number;

  // Initialize pause flag
  pauseFlags.set(sessionId, { paused: false, injectedMessage: null });

  let allReasoning: SentinelReasoning[] = [];
  const interruptionLog: InterruptionEvent[] = [];

  try {
    // Load memories for each Sentinel
    const memoriesBySentinel: Record<number, string[]> = {};
    for (const sentinel of selectedSentinels) {
      memoriesBySentinel[sentinel.id] = await loadRelevantMemories(userId, question, sentinel.id);
    }

    // Run deliberation rounds
    for (let round = 1; round <= maxRounds; round++) {
      if (mode === "synchronous") {
        // SYNCHRONOUS MODE: each Sentinel runs in sequence and sees all prior output in this round
        for (const sentinel of selectedSentinels) {
          // Check for pause / interruption
          const flag = pauseFlags.get(sessionId);
          if (flag?.paused) {
            // Wait for resume (poll every 500ms, max 5 minutes)
            let waited = 0;
            while (pauseFlags.get(sessionId)?.paused && waited < 300_000) {
              await new Promise((r) => setTimeout(r, 500));
              waited += 500;
            }
          }

          const currentFlag = pauseFlags.get(sessionId);
          const injectedMessage = currentFlag?.injectedMessage ?? null;
          if (injectedMessage) {
            interruptionLog.push({
              timestamp: new Date().toISOString(),
              message: injectedMessage,
              afterSentinel: allReasoning.length > 0 ? allReasoning[allReasoning.length - 1].sentinelName : null,
              afterRound: round,
            });
            // Clear the injection after recording
            pauseFlags.set(sessionId, { paused: false, injectedMessage: null });
          }

          // In synchronous mode: each Sentinel sees ALL prior reasoning (all rounds + current round so far)
          const previousReasoning = allReasoning.filter(
            (r) => !(r.sentinelId === sentinel.id && r.round === round)
          );

          const reasoning = await runSentinelReasoning(
            sentinel,
            question,
            previousReasoning,
            round,
            memoriesBySentinel[sentinel.id] || [],
            mode,
            streamId,
            injectedMessage
          );

          allReasoning.push(reasoning);
        }
      } else if (mode === "shared") {
        // SHARED CONTEXT MODE: all Sentinels run in parallel per round, but each sees
        // the full reasoning from ALL prior rounds (not just their own prior rounds)
        const previousReasoning = allReasoning; // all prior rounds
        const roundResults = await Promise.all(
          selectedSentinels.map((sentinel) => {
            const sentinelPrior = previousReasoning.filter((r) => r.sentinelId !== sentinel.id);
            return runSentinelReasoning(
              sentinel,
              question,
              sentinelPrior,
              round,
              memoriesBySentinel[sentinel.id] || [],
              mode,
              streamId,
              null
            );
          })
        );
        allReasoning.push(...roundResults);
      } else {
        // PARALLEL MODE (original): all Sentinels run in parallel, each sees only prior rounds
        const roundResults = await Promise.all(
          selectedSentinels.map((sentinel) => {
            const previousReasoning = allReasoning.filter(
              (r) => !(r.sentinelId === sentinel.id && r.round === round)
            );
            return runSentinelReasoning(
              sentinel,
              question,
              previousReasoning,
              round,
              memoriesBySentinel[sentinel.id] || [],
              mode,
              streamId,
              null
            );
          })
        );
        allReasoning.push(...roundResults);
      }
    }

    // Phase 2: Compute dissent scores across all reasoning chains
    allReasoning = computeDissentScores(allReasoning);

    // Phase 2: Detect structured contradictions (runs in parallel with consensus judge)
    const [judgment, contradictions] = await Promise.all([
      judgeConsensus(question, allReasoning),
      detectContradictions(question, allReasoning),
    ]);

    // Save all reasoning to DB (with dissent scores)
    for (const reasoning of allReasoning) {
      await db.insert(roundTableReasoning).values({
        sessionId,
        sentinelId: reasoning.sentinelId,
        sentinelName: reasoning.sentinelName,
        sentinelEmoji: reasoning.sentinelEmoji,
        round: reasoning.round,
        thinkingChain: reasoning.thinkingChain,
        conclusion: reasoning.conclusion,
        confidence: reasoning.confidence.toFixed(2),
        concerns: JSON.stringify(reasoning.concerns),
        dissent: reasoning.dissent,
        dissentScore: reasoning.dissentScore.toFixed(2),
        isOutlier: reasoning.isOutlier ? 1 : 0,
        memoriesUsed: JSON.stringify(reasoning.memoriesUsed),
        modelUsed: reasoning.modelUsed ?? "gemini-2.5-flash",
        latencyMs: reasoning.latencyMs ?? 0,
      });
    }

    // Find the delivering Sentinel
    const deliveringSentinel =
      selectedSentinels.find((s) => s.name === judgment.bestSentinelForAnswer) ||
      selectedSentinels[0];

    // Synthesize final answer (now includes interruption context)
    const finalAnswer = await synthesizeFinalAnswer(
      deliveringSentinel,
      question,
      allReasoning,
      judgment.consensusScore,
      judgment.hasContradiction,
      judgment.contradictionSummary,
      interruptionLog
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
        contradictions: JSON.stringify(contradictions),
        finalAnswer,
        finalSentinelId: deliveringSentinel.id,
        finalSentinelName: deliveringSentinel.name,
        routingReason: judgment.bestSentinelReason,
        interruptionLog: JSON.stringify(interruptionLog),
        isPaused: 0,
        completedAt: new Date(),
      })
      .where(eq(roundTableSessions.id, sessionId));

    // Emit completion event
    emitStreamEvent(streamId, "complete", {
      sessionId,
      finalSentinelName: deliveringSentinel.name,
      finalSentinelEmoji: deliveringSentinel.emoji,
      consensusScore: judgment.consensusScore,
    });

    // Cleanup
    setTimeout(() => streamBus.delete(streamId), 30_000);
    pauseFlags.delete(sessionId);

    return {
      sessionId,
      question,
      sentinels: selectedSentinels,
      reasoningChains: allReasoning,
      consensusScore: judgment.consensusScore,
      hasContradiction: judgment.hasContradiction,
      contradictionSummary: judgment.contradictionSummary,
      contradictions,
      finalAnswer,
      finalSentinelName: deliveringSentinel.name,
      finalSentinelEmoji: deliveringSentinel.emoji,
      routingReason: judgment.bestSentinelReason,
      deliberationMode: mode,
      interruptionLog,
      streamId,
    };
  } catch (err) {
    // Mark session as failed
    await db
      .update(roundTableSessions)
      .set({ status: "failed" })
      .where(eq(roundTableSessions.id, sessionId));

    emitStreamEvent(streamId, "error", { message: String(err) });
    setTimeout(() => streamBus.delete(streamId), 5_000);
    pauseFlags.delete(sessionId);
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

export async function getRoundTableSession(sessionId: number, userId: number): Promise<RoundTableResult | null> {
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

  const reasoningRows = await db
    .select()
    .from(roundTableReasoning)
    .where(eq(roundTableReasoning.sessionId, sessionId))
    .orderBy(roundTableReasoning.round, roundTableReasoning.sentinelId);

  // Parse sentinel list from session
  const sentinelIds: number[] = JSON.parse(session.sentinelIds || "[]");
  const sentinelNames: string[] = JSON.parse(session.sentinelNames || "[]");

  // Build sentinel list from reasoning rows (deduplicated by id)
  const sentinelMap = new Map<number, { id: number; name: string; slug: string; emoji: string; systemPrompt: string }>();
  for (const r of reasoningRows) {
    if (!sentinelMap.has(r.sentinelId)) {
      sentinelMap.set(r.sentinelId, {
        id: r.sentinelId,
        name: r.sentinelName,
        slug: r.sentinelName.toLowerCase().replace(/\s+/g, "-"),
        emoji: r.sentinelEmoji ?? "🤖",
        systemPrompt: "",
      });
    }
  }
  // Fallback: build from sentinelIds/sentinelNames if reasoning is empty
  if (sentinelMap.size === 0) {
    sentinelIds.forEach((id, i) => {
      sentinelMap.set(id, { id, name: sentinelNames[i] ?? `Sentinel ${id}`, slug: "", emoji: "🤖", systemPrompt: "" });
    });
  }

  // Transform reasoning rows
  const reasoningChains: SentinelReasoning[] = reasoningRows.map((r) => ({
    sentinelId: r.sentinelId,
    sentinelName: r.sentinelName,
    sentinelEmoji: r.sentinelEmoji ?? "🤖",
    round: r.round,
    thinkingChain: r.thinkingChain,
    conclusion: r.conclusion,
    confidence: parseFloat(r.confidence ?? "0.7"),
    concerns: JSON.parse(r.concerns ?? "[]") as string[],
    dissent: r.dissent ?? null,
    memoriesUsed: JSON.parse(r.memoriesUsed ?? "[]") as string[],
    dissentScore: parseFloat(r.dissentScore ?? "0"),
    isOutlier: r.isOutlier === 1,
    modelUsed: r.modelUsed ?? "gemini-2.5-flash",
    latencyMs: r.latencyMs ?? 0,
  }));

  // Parse structured contradictions
  let contradictions: ContradictionFlag[] = [];
  try {
    contradictions = JSON.parse(session.contradictions ?? "[]") as ContradictionFlag[];
  } catch {
    contradictions = [];
  }

  // Parse interruption log
  let interruptionLog: InterruptionEvent[] = [];
  try {
    interruptionLog = JSON.parse(session.interruptionLog ?? "[]") as InterruptionEvent[];
  } catch {
    interruptionLog = [];
  }

  return {
    sessionId: session.id,
    question: session.question,
    sentinels: Array.from(sentinelMap.values()),
    reasoningChains,
    consensusScore: parseFloat(session.consensusScore ?? "0.5"),
    hasContradiction: session.hasContradiction === 1,
    contradictionSummary: session.contradictionSummary ?? null,
    contradictions,
    finalAnswer: session.finalAnswer ?? "",
    finalSentinelName: session.finalSentinelName ?? "",
    finalSentinelEmoji: reasoningRows.find((r) => r.sentinelName === session.finalSentinelName)?.sentinelEmoji ?? "🤖",
    routingReason: session.routingReason ?? "",
    deliberationMode: (session.deliberationMode as DeliberationMode) ?? "parallel",
    interruptionLog,
    streamId: session.streamId ?? null,
  };
}
