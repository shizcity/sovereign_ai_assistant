/**
 * Sentinel Relationship Engine
 *
 * Tracks per-user per-Sentinel interaction depth and builds an evolving
 * user model that is injected into every LLM call, making each Sentinel
 * feel genuinely different based on your history with them.
 *
 * Relationship levels (based on totalInteractions):
 *   Acquaintance  :   0–9   messages
 *   Colleague     :  10–49  messages
 *   Trusted Advisor: 50–199 messages
 *   Partner       : 200+    messages
 */

import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

export type RelationshipLevel = "acquaintance" | "colleague" | "trusted_advisor" | "partner";

export interface UserModel {
  preferences: string[];          // e.g. ["prefers direct answers", "dislikes hedging"]
  communicationStyle: string;     // e.g. "concise and data-driven"
  recurringThemes: string[];      // e.g. ["Series A fundraising", "product-market fit"]
  decisionPatterns: string[];     // e.g. ["weighs risk carefully", "moves fast on conviction"]
  currentFocus: string;           // e.g. "preparing for Series A in Q2 2025"
}

export interface RelationshipData {
  sentinelId: number;
  sentinelName: string;
  sentinelEmoji: string;
  sentinelColor: string;
  totalInteractions: number;
  roundTableCount: number;
  relationshipLevel: RelationshipLevel;
  userModel: UserModel | null;
  topicSummary: string | null;
  lastInteraction: Date | null;
  collaborationAreas: string[];
}

// ─── Level computation ────────────────────────────────────────────────────────

export function computeRelationshipLevel(totalInteractions: number): RelationshipLevel {
  if (totalInteractions >= 200) return "partner";
  if (totalInteractions >= 50)  return "trusted_advisor";
  if (totalInteractions >= 10)  return "colleague";
  return "acquaintance";
}

export const LEVEL_LABELS: Record<RelationshipLevel, string> = {
  acquaintance:    "Acquaintance",
  colleague:       "Colleague",
  trusted_advisor: "Trusted Advisor",
  partner:         "Partner",
};

export const LEVEL_COLORS: Record<RelationshipLevel, string> = {
  acquaintance:    "#6b7280", // gray
  colleague:       "#3b82f6", // blue
  trusted_advisor: "#8b5cf6", // purple
  partner:         "#f59e0b", // amber/gold
};

export const LEVEL_THRESHOLDS: Record<RelationshipLevel, number> = {
  acquaintance:    0,
  colleague:       10,
  trusted_advisor: 50,
  partner:         200,
};

/** Returns progress toward the next level as 0–100 */
export function levelProgress(totalInteractions: number): number {
  if (totalInteractions >= 200) return 100;
  if (totalInteractions >= 50) {
    return Math.round(((totalInteractions - 50) / (200 - 50)) * 100);
  }
  if (totalInteractions >= 10) {
    return Math.round(((totalInteractions - 10) / (50 - 10)) * 100);
  }
  return Math.round((totalInteractions / 10) * 100);
}

// ─── DB helpers (raw SQL to avoid schema/table mismatch) ─────────────────────

async function getRawMemory(userId: number, sentinelId: number) {
  const db = await getDb();
  if (!db) return null;
  const [rows] = await (db as any).execute(
    "SELECT * FROM sentinelMemory WHERE userId = ? AND sentinelId = ? LIMIT 1",
    [userId, sentinelId]
  );
  return (rows as any[])[0] || null;
}

async function upsertRawMemory(userId: number, sentinelId: number, fields: Record<string, any>) {
  const db = await getDb();
  if (!db) return;

  const existing = await getRawMemory(userId, sentinelId);
  if (!existing) {
    // Insert new row
    const cols = ["userId", "sentinelId", "totalInteractions", "firstInteraction", "lastInteraction", ...Object.keys(fields)];
    const vals = [userId, sentinelId, 0, new Date(), new Date(), ...Object.values(fields)];
    const placeholders = cols.map(() => "?").join(", ");
    await (db as any).execute(
      `INSERT INTO sentinelMemory (${cols.join(", ")}) VALUES (${placeholders})`,
      vals
    );
  } else {
    // Update existing row
    const setClauses = Object.keys(fields).map(k => `\`${k}\` = ?`).join(", ");
    await (db as any).execute(
      `UPDATE sentinelMemory SET ${setClauses} WHERE userId = ? AND sentinelId = ?`,
      [...Object.values(fields), userId, sentinelId]
    );
  }
}

// ─── Core update function (called after every message) ───────────────────────

/**
 * Called after each message exchange. Increments the interaction counter,
 * updates the relationship level, and triggers user model extraction every
 * 10 interactions.
 */
export async function updateRelationship(
  userId: number,
  sentinelId: number,
  recentMessages: Array<{ role: string; content: string }>,
  sentinelName: string
): Promise<{ level: RelationshipLevel; leveledUp: boolean; newLevel?: RelationshipLevel }> {
  try {
    const existing = await getRawMemory(userId, sentinelId);
    const prevCount = existing?.totalInteractions ?? 0;
    const newCount = prevCount + 1;

    const prevLevel = computeRelationshipLevel(prevCount);
    const newLevel = computeRelationshipLevel(newCount);
    const leveledUp = newLevel !== prevLevel;

    const updates: Record<string, any> = {
      totalInteractions: newCount,
      lastInteraction: new Date(),
      relationshipLevel: newLevel,
    };

    // Build/refresh user model every 10 interactions (async, non-blocking)
    if (newCount % 10 === 0 && recentMessages.length >= 4) {
      buildUserModel(userId, sentinelId, recentMessages, sentinelName, existing).catch(
        (e) => console.error("[RelationshipEngine] buildUserModel error:", e)
      );
    }

    await upsertRawMemory(userId, sentinelId, updates);

    return { level: newLevel, leveledUp, newLevel: leveledUp ? newLevel : undefined };
  } catch (e) {
    console.error("[RelationshipEngine] updateRelationship error:", e);
    return { level: "acquaintance", leveledUp: false };
  }
}

// ─── User model extraction ────────────────────────────────────────────────────

/**
 * Uses an LLM to extract a structured user model from recent conversation history.
 * Runs asynchronously and does not block the message response.
 */
async function buildUserModel(
  userId: number,
  sentinelId: number,
  recentMessages: Array<{ role: string; content: string }>,
  sentinelName: string,
  existing: any
): Promise<void> {
  const conversationText = recentMessages
    .slice(-30) // last 30 messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "user" ? "User" : sentinelName}: ${m.content.slice(0, 500)}`)
    .join("\n");

  const existingModel = existing?.userModel ? JSON.parse(existing.userModel) : null;
  const existingContext = existingModel
    ? `\n\nPrevious user model (update/refine this, don't discard):\n${JSON.stringify(existingModel, null, 2)}`
    : "";

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert at understanding people from their conversations. Extract a structured user model from the conversation below. Return ONLY valid JSON, no markdown.${existingContext}`,
      },
      {
        role: "user",
        content: `Analyze this conversation between a user and ${sentinelName} and extract a user model:\n\n${conversationText}\n\nReturn JSON with exactly these fields:
{
  "preferences": ["array of 3-6 specific preferences or working styles observed"],
  "communicationStyle": "one sentence describing how they communicate",
  "recurringThemes": ["array of 3-5 topics or domains they keep returning to"],
  "decisionPatterns": ["array of 2-4 patterns in how they make decisions"],
  "currentFocus": "one sentence about what they seem focused on right now"
}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "user_model",
        strict: true,
        schema: {
          type: "object",
          properties: {
            preferences: { type: "array", items: { type: "string" } },
            communicationStyle: { type: "string" },
            recurringThemes: { type: "array", items: { type: "string" } },
            decisionPatterns: { type: "array", items: { type: "string" } },
            currentFocus: { type: "string" },
          },
          required: ["preferences", "communicationStyle", "recurringThemes", "decisionPatterns", "currentFocus"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices?.[0]?.message?.content;
  const raw = typeof rawContent === "string" ? rawContent : "{}";
  let userModel: UserModel;
  try {
    userModel = JSON.parse(raw);
  } catch {
    return;
  }

  // Also build a topic summary
  const topicSummary = [
    ...(userModel.recurringThemes || []).slice(0, 3),
    userModel.currentFocus,
  ]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 500);

  await upsertRawMemory(userId, sentinelId, {
    userModel: JSON.stringify(userModel),
    topicSummary,
  });
}

// ─── Relationship context injection ──────────────────────────────────────────

/**
 * Builds the adaptive relationship context block to inject into the Sentinel's
 * system prompt. This is what makes the Sentinel feel like it knows you.
 */
export async function buildRelationshipContext(
  userId: number,
  sentinelId: number,
  sentinelName: string
): Promise<string> {
  try {
    const memory = await getRawMemory(userId, sentinelId);
    if (!memory) return "";

    const count = memory.totalInteractions ?? 0;
    if (count < 3) return ""; // Don't inject for brand-new relationships

    const level = computeRelationshipLevel(count);
    const levelLabel = LEVEL_LABELS[level];

    let userModel: UserModel | null = null;
    if (memory.userModel) {
      try { userModel = JSON.parse(memory.userModel); } catch { /* ignore */ }
    }

    const collaborationAreas: string[] = (() => {
      try { return JSON.parse(memory.collaborationAreas || "[]"); } catch { return []; }
    })();

    // Build the context block
    const lines: string[] = [
      `\n\n## Your Relationship with This User`,
      ``,
      `You have worked with this user across ${count} conversation${count === 1 ? "" : "s"} — your relationship level is **${levelLabel}**.`,
    ];

    if (userModel) {
      if (userModel.communicationStyle) {
        lines.push(``, `**Their communication style:** ${userModel.communicationStyle}`);
      }
      if (userModel.currentFocus) {
        lines.push(`**What they're focused on right now:** ${userModel.currentFocus}`);
      }
      if (userModel.preferences?.length) {
        lines.push(``, `**Their preferences (adapt to these):**`);
        userModel.preferences.slice(0, 4).forEach((p) => lines.push(`- ${p}`));
      }
      if (userModel.recurringThemes?.length) {
        lines.push(``, `**Topics they return to often:** ${userModel.recurringThemes.slice(0, 4).join(", ")}`);
      }
      if (userModel.decisionPatterns?.length) {
        lines.push(``, `**How they make decisions:**`);
        userModel.decisionPatterns.slice(0, 3).forEach((p) => lines.push(`- ${p}`));
      }
    } else if (collaborationAreas.length > 0) {
      lines.push(``, `**Areas you've worked on together:** ${collaborationAreas.slice(0, 4).join(", ")}`);
    }

    // Level-specific tone guidance
    const toneGuidance: Record<RelationshipLevel, string> = {
      acquaintance:
        "You are getting to know this user. Be warm and professional, ask clarifying questions to understand their context.",
      colleague:
        "You know this user reasonably well. You can skip basic explanations, reference prior context naturally, and be more direct.",
      trusted_advisor:
        "You have a deep working relationship with this user. Speak frankly, challenge their assumptions when warranted, and proactively surface things they may not have considered.",
      partner:
        "You and this user have an exceptional depth of history. Communicate as a true thought partner — anticipate their needs, reference your shared history, and don't hesitate to push back with conviction.",
    };

    lines.push(``, `**How to engage:** ${toneGuidance[level]}`);
    lines.push(``, `Use this context naturally — don't announce it, just let it shape how you respond.`);

    return lines.join("\n");
  } catch (e) {
    console.error("[RelationshipEngine] buildRelationshipContext error:", e);
    return "";
  }
}

// ─── Public query helpers ─────────────────────────────────────────────────────

export async function getRelationshipData(
  userId: number,
  sentinelId: number
): Promise<RelationshipData | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const [rows] = await (db as any).execute(
      `SELECT sm.*, s.name as sentinelName, s.symbolEmoji, s.primaryColor, s.slug
       FROM sentinelMemory sm
       JOIN sentinels s ON s.id = sm.sentinelId
       WHERE sm.userId = ? AND sm.sentinelId = ?
       LIMIT 1`,
      [userId, sentinelId]
    );
    const row = (rows as any[])[0];
    if (!row) return null;

    return parseRelationshipRow(row);
  } catch (e) {
    console.error("[RelationshipEngine] getRelationshipData error:", e);
    return null;
  }
}

export async function getAllRelationships(userId: number): Promise<RelationshipData[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const [rows] = await (db as any).execute(
      `SELECT sm.*, s.name as sentinelName, s.symbolEmoji, s.primaryColor, s.slug
       FROM sentinelMemory sm
       JOIN sentinels s ON s.id = sm.sentinelId
       WHERE sm.userId = ?
       ORDER BY sm.totalInteractions DESC`,
      [userId]
    );
    return (rows as any[]).map(parseRelationshipRow);
  } catch (e) {
    console.error("[RelationshipEngine] getAllRelationships error:", e);
    return [];
  }
}

function parseRelationshipRow(row: any): RelationshipData {
  let userModel: UserModel | null = null;
  if (row.userModel) {
    try { userModel = JSON.parse(row.userModel); } catch { /* ignore */ }
  }

  let collaborationAreas: string[] = [];
  if (row.collaborationAreas) {
    try { collaborationAreas = JSON.parse(row.collaborationAreas); } catch { /* ignore */ }
  }

  const totalInteractions = row.totalInteractions ?? 0;

  return {
    sentinelId: row.sentinelId,
    sentinelName: row.sentinelName,
    sentinelEmoji: row.symbolEmoji,
    sentinelColor: row.primaryColor,
    totalInteractions,
    roundTableCount: row.roundTableCount ?? 0,
    relationshipLevel: (row.relationshipLevel as RelationshipLevel) ?? computeRelationshipLevel(totalInteractions),
    userModel,
    topicSummary: row.topicSummary || null,
    lastInteraction: row.lastInteraction ? new Date(row.lastInteraction) : null,
    collaborationAreas,
  };
}
