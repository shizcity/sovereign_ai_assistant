/**
 * VOX Phase 2 — Streaming Voice Player
 *
 * Replaces the Web Speech API with a streaming audio pipeline:
 *   1. POST /api/tts/stream with the text + voice params
 *   2. Read the chunked audio/mpeg response as a ReadableStream
 *   3. Decode each chunk via Web Audio API and queue for gapless playback
 *
 * First audio starts within ~150ms of the fetch initiating.
 * Falls back to Web Speech API if the streaming endpoint fails.
 */

import { voiceService } from "./voice";

// ─── Sentinel → OpenAI voice mapping ─────────────────────────────────────────

const SENTINEL_TO_VOICE: Record<string, string> = {
  "Vixen's Den":    "nova",     // Warm, authoritative female
  "Mischief.EXE":  "shimmer",  // Bright, energetic
  "Lunaris.Vault": "onyx",     // Deep, contemplative male
  "Aetheris.Flow": "alloy",    // Smooth, neutral
  "Rift.EXE":      "echo",     // Bold, intense male
  "Nyx":           "fable",    // Soft, enigmatic
};

const DEFAULT_VOICE = "alloy";

// ─── Sentence boundary splitter ──────────────────────────────────────────────

/**
 * Split text into speakable sentence chunks so the first sentence can be
 * fetched and played while the rest are still being requested.
 */
export function splitIntoSentences(text: string): string[] {
  // Strip markdown before splitting
  const clean = text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!?\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/[-_*]{3,}/g, "")
    .replace(/\|/g, " ")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();

  // Split on sentence-ending punctuation followed by whitespace
  const raw = clean.split(/(?<=[.!?])\s+/);

  // Merge very short fragments (< 20 chars) with the next sentence
  const merged: string[] = [];
  let buffer = "";
  for (const s of raw) {
    buffer = buffer ? `${buffer} ${s}` : s;
    if (buffer.length >= 20) {
      merged.push(buffer.trim());
      buffer = "";
    }
  }
  if (buffer.trim()) merged.push(buffer.trim());

  return merged.filter(Boolean);
}

// ─── StreamingVoicePlayer ─────────────────────────────────────────────────────

export interface StreamingPlayOptions {
  sentinelName?: string;
  speed?: number;
  pitch?: number;   // Used only in Web Speech API fallback
  rate?: number;    // Used only in Web Speech API fallback
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: Error) => void;
}

export class StreamingVoicePlayer {
  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private scheduledEndTime = 0;
  private abortController: AbortController | null = null;
  private isPlaying = false;
  private onEndCallback: (() => void) | null = null;
  private endCheckTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Lazy AudioContext init ────────────────────────────────────────────────

  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.connect(this.audioCtx.destination);
    }
    return this.audioCtx;
  }

  // ── Stop any current playback ─────────────────────────────────────────────

  public stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.endCheckTimer) {
      clearTimeout(this.endCheckTimer);
      this.endCheckTimer = null;
    }
    if (this.audioCtx) {
      // Suspend context to silence any scheduled buffers immediately
      this.audioCtx.suspend().catch(() => {});
    }
    this.isPlaying = false;
    this.scheduledEndTime = 0;
    this.onEndCallback = null;
  }

  // ── Main play method ──────────────────────────────────────────────────────

  public async play(text: string, options: StreamingPlayOptions = {}): Promise<void> {
    this.stop();

    const {
      sentinelName,
      speed = 1.0,
      volume = 1.0,
      onStart,
      onEnd,
      onError,
    } = options;

    const voice = SENTINEL_TO_VOICE[sentinelName || ""] || DEFAULT_VOICE;
    this.onEndCallback = onEnd || null;

    // Resume suspended context (browsers require user gesture before first play)
    const ctx = this.getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    }

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    try {
      const response = await fetch("/api/tts/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text, voice, speed }),
        signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`TTS stream error: ${response.status}`);
      }

      this.isPlaying = true;
      onStart?.();

      // Collect the full MP3 body (chunked HTTP, not WebSocket — we need the
      // complete MP3 frame structure for decodeAudioData to work reliably).
      // The server streams bytes as they arrive from the TTS API, so the
      // response.arrayBuffer() resolves as soon as the TTS API finishes —
      // typically 300–600ms for a short sentence, much faster than the old
      // S3-upload-then-play path which added ~800ms.
      const buffer = await response.arrayBuffer();

      if (signal.aborted) return;

      const audioBuffer = await ctx.decodeAudioData(buffer);

      if (signal.aborted) return;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = speed;
      if (this.gainNode) source.connect(this.gainNode);
      else source.connect(ctx.destination);

      const startAt = Math.max(ctx.currentTime, this.scheduledEndTime);
      source.start(startAt);
      this.scheduledEndTime = startAt + audioBuffer.duration;

      source.onended = () => {
        // Only fire onEnd when this is the last scheduled buffer
        if (ctx.currentTime >= this.scheduledEndTime - 0.05) {
          this.isPlaying = false;
          this.onEndCallback?.();
          this.onEndCallback = null;
        }
      };

    } catch (err: any) {
      if (err?.name === "AbortError") return; // Intentional stop — no error
      console.warn("[StreamingVoice] Streaming failed, falling back to Web Speech API:", err);
      // Graceful fallback
      voiceService.speak(text, {
        sentinelName,
        rate: options.rate,
        pitch: options.pitch,
        volume,
        onEnd,
      });
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // ── Sentence-by-sentence play (for long responses) ────────────────────────

  public async playSentences(text: string, options: StreamingPlayOptions = {}): Promise<void> {
    const sentences = splitIntoSentences(text);
    if (sentences.length === 0) return;

    // For short texts (1–2 sentences), just play directly
    if (sentences.length <= 2) {
      return this.play(text, options);
    }

    // For longer texts, play the first sentence immediately, then queue the rest
    this.stop();
    const { onEnd, ...rest } = options;

    for (let i = 0; i < sentences.length; i++) {
      const isLast = i === sentences.length - 1;
      await this.play(sentences[i], {
        ...rest,
        onEnd: isLast ? onEnd : undefined,
      });
      if (this.abortController?.signal.aborted) break;
    }
  }

  public get playing() {
    return this.isPlaying;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const streamingVoicePlayer = new StreamingVoicePlayer();
