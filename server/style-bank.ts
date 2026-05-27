/**
 * VOX Phase 1 — Style Bank
 *
 * Named voice presets per Sentinel. Each preset defines:
 *   - Base TTS voice (OpenAI/Forge voice ID)
 *   - Default prosody (speed, pitch, rate, volume)
 *   - Default emotion profile (valence, arousal, stability)
 *   - Default intent
 *
 * Presets are resolved at TTS call time and then modulated by the
 * Utterance Plan's emotion/intent before being sent to the API.
 */

import type { ResolvedProsody, UtteranceEmotion, UtteranceIntent } from "./utterance-plan";

export interface StylePreset {
  id: string;
  label: string;
  sentinelSlug: string;
  description: string;
  base: ResolvedProsody;
  defaultEmotion: UtteranceEmotion;
  defaultIntent: UtteranceIntent;
}

// ─── Preset Definitions ───────────────────────────────────────────────────────

export const STYLE_PRESETS: StylePreset[] = [
  // ── Nyx ──────────────────────────────────────────────────────────────────
  {
    id: "nyx.v1",
    label: "Nyx — Sovereign",
    sentinelSlug: "nyx",
    description: "Soft, enigmatic, deliberate. The default sovereign voice.",
    base: { voice: "shimmer", speed: 0.9, pitch: 0.85, rate: 0.9, volume: 0.95 },
    defaultEmotion: { valence: 0.6, arousal: 0.3, stability: 0.9 },
    defaultIntent: "oracle",
  },
  {
    id: "nyx.litany",
    label: "Nyx — Litany",
    sentinelSlug: "nyx",
    description: "Slower, more ceremonial. Used for reflective or philosophical responses.",
    base: { voice: "shimmer", speed: 0.82, pitch: 0.8, rate: 0.82, volume: 0.9 },
    defaultEmotion: { valence: 0.5, arousal: 0.2, stability: 0.95 },
    defaultIntent: "wonder",
  },

  // ── Vixen's Den ──────────────────────────────────────────────────────────
  {
    id: "vixen.steady",
    label: "Vixen — Steady",
    sentinelSlug: "vixens-den",
    description: "Grounded, authoritative, measured. Default strategic voice.",
    base: { voice: "nova", speed: 0.95, pitch: 0.9, rate: 0.95, volume: 1.0 },
    defaultEmotion: { valence: 0.55, arousal: 0.4, stability: 0.9 },
    defaultIntent: "instruct",
  },
  {
    id: "vixen.command",
    label: "Vixen — Command",
    sentinelSlug: "vixens-den",
    description: "Sharper, more direct. For decisive, high-stakes guidance.",
    base: { voice: "nova", speed: 1.0, pitch: 0.95, rate: 1.0, volume: 1.0 },
    defaultEmotion: { valence: 0.4, arousal: 0.6, stability: 0.85 },
    defaultIntent: "announce",
  },

  // ── Mischief.EXE ─────────────────────────────────────────────────────────
  {
    id: "mischief.spark",
    label: "Mischief — Spark",
    sentinelSlug: "mischief-exe",
    description: "Energetic, playful, slightly faster. Default creative voice.",
    base: { voice: "alloy", speed: 1.1, pitch: 1.2, rate: 1.1, volume: 1.0 },
    defaultEmotion: { valence: 0.85, arousal: 0.75, stability: 0.65 },
    defaultIntent: "banter",
  },
  {
    id: "mischief.hype",
    label: "Mischief — Hype",
    sentinelSlug: "mischief-exe",
    description: "Maximum energy. For brainstorm launches and creative breakthroughs.",
    base: { voice: "alloy", speed: 1.2, pitch: 1.3, rate: 1.2, volume: 1.0 },
    defaultEmotion: { valence: 0.95, arousal: 0.9, stability: 0.55 },
    defaultIntent: "hype",
  },

  // ── Lunaris.Vault ─────────────────────────────────────────────────────────
  {
    id: "lunaris.deep",
    label: "Lunaris — Deep",
    sentinelSlug: "lunaris-vault",
    description: "Low, slow, contemplative. Default memory and reflection voice.",
    base: { voice: "onyx", speed: 0.85, pitch: 0.8, rate: 0.85, volume: 0.9 },
    defaultEmotion: { valence: 0.45, arousal: 0.25, stability: 0.95 },
    defaultIntent: "narrate",
  },
  {
    id: "lunaris.whisper",
    label: "Lunaris — Whisper",
    sentinelSlug: "lunaris-vault",
    description: "Quieter, more intimate. For confessional or sensitive reflections.",
    base: { voice: "onyx", speed: 0.8, pitch: 0.75, rate: 0.8, volume: 0.85 },
    defaultEmotion: { valence: 0.4, arousal: 0.2, stability: 0.9 },
    defaultIntent: "confess",
  },

  // ── Aetheris.Flow ─────────────────────────────────────────────────────────
  {
    id: "aetheris.flow",
    label: "Aetheris — Flow",
    sentinelSlug: "aetheris-flow",
    description: "Smooth, adaptive, natural pace. Default analytical voice.",
    base: { voice: "echo", speed: 1.0, pitch: 1.05, rate: 1.0, volume: 1.0 },
    defaultEmotion: { valence: 0.6, arousal: 0.45, stability: 0.85 },
    defaultIntent: "teach",
  },
  {
    id: "aetheris.wonder",
    label: "Aetheris — Wonder",
    sentinelSlug: "aetheris-flow",
    description: "Slightly slower, more curious. For exploratory and speculative responses.",
    base: { voice: "echo", speed: 0.93, pitch: 1.1, rate: 0.93, volume: 1.0 },
    defaultEmotion: { valence: 0.7, arousal: 0.35, stability: 0.8 },
    defaultIntent: "wonder",
  },

  // ── Rift.EXE ──────────────────────────────────────────────────────────────
  {
    id: "rift.bold",
    label: "Rift — Bold",
    sentinelSlug: "rift-exe",
    description: "Intense, urgent, forward-leaning. Default disruptive voice.",
    base: { voice: "fable", speed: 1.08, pitch: 1.15, rate: 1.08, volume: 1.0 },
    defaultEmotion: { valence: 0.5, arousal: 0.7, stability: 0.7 },
    defaultIntent: "announce",
  },
  {
    id: "rift.challenge",
    label: "Rift — Challenge",
    sentinelSlug: "rift-exe",
    description: "Sharper, more confrontational. For devil's advocate and stress-test responses.",
    base: { voice: "fable", speed: 1.05, pitch: 1.1, rate: 1.05, volume: 1.0 },
    defaultEmotion: { valence: 0.35, arousal: 0.65, stability: 0.75 },
    defaultIntent: "instruct",
  },
];

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

/** Get all presets for a given Sentinel slug */
export function getPresetsForSentinel(slug: string): StylePreset[] {
  return STYLE_PRESETS.filter((p) => p.sentinelSlug === slug);
}

/** Get a specific preset by ID, falling back to the first matching Sentinel preset */
export function resolvePreset(
  presetId: string | undefined,
  sentinelSlug: string | undefined
): StylePreset {
  if (presetId) {
    const found = STYLE_PRESETS.find((p) => p.id === presetId);
    if (found) return found;
  }

  if (sentinelSlug) {
    const sentinelPresets = getPresetsForSentinel(sentinelSlug);
    if (sentinelPresets.length > 0) return sentinelPresets[0];
  }

  // Ultimate fallback — Nyx v1
  return STYLE_PRESETS[0];
}

/** Map Sentinel name (display name) to slug */
const SENTINEL_NAME_TO_SLUG: Record<string, string> = {
  "Nyx": "nyx",
  "Vixen's Den": "vixens-den",
  "Mischief.EXE": "mischief-exe",
  "Lunaris.Vault": "lunaris-vault",
  "Aetheris.Flow": "aetheris-flow",
  "Rift.EXE": "rift-exe",
};

export function sentinelNameToSlug(name: string): string {
  return SENTINEL_NAME_TO_SLUG[name] ?? name.toLowerCase().replace(/[^a-z0-9]/g, "-");
}
