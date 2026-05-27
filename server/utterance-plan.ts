/**
 * VOX Phase 1 — Utterance Plan (UP)
 *
 * The Utterance Plan is a declarative contract that flows from the LLM output
 * through a prosody mapper before reaching the TTS renderer.
 *
 * Every acoustic decision is traceable to an upstream control signal:
 *   emotion → prosody → voice settings
 */

// ─── Schema ──────────────────────────────────────────────────────────────────

export type UtteranceIntent =
  | "narrate"
  | "reassure"
  | "instruct"
  | "teach"
  | "wonder"
  | "flirt"
  | "banter"
  | "joke"
  | "apologize"
  | "confess"
  | "lullaby"
  | "chant"
  | "announce"
  | "hype"
  | "story"
  | "oracle"
  | "default";

export type UtteranceMode = "speech" | "whisper" | "sing" | "chant" | "hum";

export interface UtteranceEmotion {
  valence: number;   // -1.0 (negative) to 1.0 (positive)
  arousal: number;   // 0.0 (calm) to 1.0 (excited)
  stability: number; // 0.0 (shaky) to 1.0 (steady)
}

export interface UtterancePlan {
  text: string;
  intent: UtteranceIntent;
  mode: UtteranceMode;
  emotion: UtteranceEmotion;
  stylePreset?: string; // e.g. "nyx.v1", "vixen.steady", "mischief.spark"
  seed?: number;        // deterministic reproducibility
}

// ─── Prosody Mapping ─────────────────────────────────────────────────────────

/**
 * Resolved voice settings passed to the TTS API.
 * Maps to OpenAI TTS / Forge TTS parameters.
 */
export interface ResolvedProsody {
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  speed: number;       // 0.25 – 4.0
  // Web Speech API extras (used by voice.ts)
  pitch: number;       // 0.0 – 2.0
  rate: number;        // 0.1 – 10.0
  volume: number;      // 0.0 – 1.0
}

/**
 * Maps emotion + intent → prosody parameters.
 *
 * Emotion→Prosody rules (from VOX V8.1D §5):
 *   valence ↑  → brighter tilt, faster attack, subtle pitch lift
 *   arousal ↑  → rate ↑, amplitude variance ↑, reduced pauses
 *   stability ↑ → vibrato depth ↓, consistent energy envelope
 */
export function mapEmotionToProsody(
  emotion: UtteranceEmotion,
  intent: UtteranceIntent,
  baseVoice: ResolvedProsody
): ResolvedProsody {
  const { valence, arousal, stability } = emotion;

  // Speed: arousal drives rate. High arousal = faster. Stability dampens variance.
  const arousalSpeedDelta = (arousal - 0.5) * 0.3; // ±0.15
  const stabilityDampening = stability * 0.05;
  let speed = baseVoice.speed + arousalSpeedDelta - stabilityDampening;

  // Pitch: valence lifts pitch slightly. Negative valence lowers it.
  const valencePitchDelta = (valence) * 0.1; // ±0.1
  let pitch = baseVoice.pitch + valencePitchDelta;

  // Rate (Web Speech): mirrors speed
  let rate = baseVoice.rate + arousalSpeedDelta;

  // Intent overrides
  switch (intent) {
    case "reassure":
    case "lullaby":
      speed = Math.min(speed, 0.88);
      pitch = Math.max(pitch - 0.05, 0.7);
      rate = Math.min(rate, 0.88);
      break;
    case "hype":
    case "announce":
      speed = Math.max(speed, 1.1);
      pitch = Math.min(pitch + 0.1, 1.5);
      rate = Math.max(rate, 1.1);
      break;
    case "confess":
      speed = Math.min(speed, 0.85);
      pitch = Math.max(pitch - 0.1, 0.7);
      rate = Math.min(rate, 0.85);
      break;
    case "wonder":
    case "oracle":
      speed = Math.min(speed, 0.92);
      pitch = pitch + 0.05;
      rate = Math.min(rate, 0.92);
      break;
    case "banter":
    case "joke":
    case "flirt":
      speed = Math.max(speed, 1.05);
      pitch = Math.min(pitch + 0.08, 1.4);
      rate = Math.max(rate, 1.05);
      break;
    case "instruct":
    case "teach":
      // Steady, clear delivery
      speed = clamp(speed, 0.9, 1.05);
      pitch = clamp(pitch, 0.9, 1.1);
      rate = clamp(rate, 0.9, 1.05);
      break;
  }

  return {
    voice: baseVoice.voice,
    speed: clamp(speed, 0.6, 1.4),
    pitch: clamp(pitch, 0.7, 1.5),
    rate: clamp(rate, 0.7, 1.4),
    volume: baseVoice.volume,
  };
}

// ─── UP Tag Parser ────────────────────────────────────────────────────────────

const UP_TAG_REGEX = /<up>([\s\S]*?)<\/up>/i;

/**
 * Extracts and parses an Utterance Plan tag from LLM output.
 * Returns { plan, cleanText } where cleanText has the <up>…</up> block removed.
 */
export function extractUtterancePlan(rawText: string): {
  plan: Partial<UtterancePlan> | null;
  cleanText: string;
} {
  const match = rawText.match(UP_TAG_REGEX);
  if (!match) {
    return { plan: null, cleanText: rawText };
  }

  const cleanText = rawText.replace(UP_TAG_REGEX, "").trim();

  try {
    const plan = JSON.parse(match[1]) as Partial<UtterancePlan>;
    return { plan, cleanText };
  } catch {
    // Malformed JSON — discard tag, keep text clean
    return { plan: null, cleanText };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Default neutral emotion for fallback */
export const DEFAULT_EMOTION: UtteranceEmotion = {
  valence: 0.5,
  arousal: 0.4,
  stability: 0.8,
};

/** Default neutral UP for fallback */
export const DEFAULT_UP: Omit<UtterancePlan, "text"> = {
  intent: "default",
  mode: "speech",
  emotion: DEFAULT_EMOTION,
};
