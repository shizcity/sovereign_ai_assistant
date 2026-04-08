/**
 * Voice Service for Speech Recognition and Synthesis
 * Uses Web Speech API for browser-native voice capabilities
 */

export interface VoiceConfig {
  sentinelName: string;
  pitch: number; // 0.0 to 2.0
  rate: number; // 0.1 to 10
  volume: number; // 0.0 to 1.0
  voiceName?: string; // Preferred voice name
  onEnd?: () => void; // Callback when speech finishes
}

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export type VoiceEventType =
  | "listening"
  | "speaking"
  | "idle"
  | "transcript"
  | "wake-word"
  | "error";

export interface VoiceEvent {
  type: VoiceEventType;
  data?: any;
}

// Sentinel-specific voice configurations
export const SENTINEL_VOICES: Record<string, Omit<VoiceConfig, "sentinelName">> = {
  "Vixen's Den": {
    pitch: 0.9, // Slightly lower, grounded
    rate: 0.95, // Steady, measured pace
    volume: 1.0,
    voiceName: "Google UK English Female", // Calm, authoritative
  },
  "Mischief.EXE": {
    pitch: 1.3, // Higher, energetic
    rate: 1.15, // Faster, excited
    volume: 1.0,
    voiceName: "Google US English", // Playful, dynamic
  },
  "Lunaris.Vault": {
    pitch: 0.8, // Lower, mysterious
    rate: 0.85, // Slower, deliberate
    volume: 0.9,
    voiceName: "Google UK English Male", // Deep, contemplative
  },
  "Aetheris.Flow": {
    pitch: 1.1, // Slightly higher, flowing
    rate: 1.0, // Natural pace
    volume: 1.0,
    voiceName: "Google US English Female", // Smooth, adaptive
  },
  "Rift.EXE": {
    pitch: 1.2, // Higher, intense
    rate: 1.1, // Faster, urgent
    volume: 1.0,
    voiceName: "Google US English Male", // Bold, disruptive
  },
  Nyx: {
    pitch: 0.85, // Lower, mysterious
    rate: 0.9, // Slower, ethereal
    volume: 0.95,
    voiceName: "Google UK English Female", // Soft, enigmatic
  },
};

// Wake-word patterns for each Sentinel
const WAKE_WORDS = [
  { pattern: /hey\s+vixen/i, sentinel: "Vixen's Den" },
  { pattern: /hey\s+mischief/i, sentinel: "Mischief.EXE" },
  { pattern: /hey\s+lunaris/i, sentinel: "Lunaris.Vault" },
  { pattern: /hey\s+aetheris/i, sentinel: "Aetheris.Flow" },
  { pattern: /hey\s+rift/i, sentinel: "Rift.EXE" },
  { pattern: /hey\s+nyx/i, sentinel: "Nyx" },
];

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isListening = false;
  private isSpeaking = false;
  private eventListeners: Map<VoiceEventType, Set<(event: VoiceEvent) => void>> = new Map();
  private currentConfig: VoiceConfig | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeRecognition();
    this.loadVoices();
  }

  private initializeRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      this.isListening = true;
      this.emit({ type: "listening" });
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const latestResult = results[results.length - 1];
      const transcript = latestResult[0].transcript;
      const isFinal = latestResult.isFinal;
      const confidence = latestResult[0].confidence;

      this.emit({
        type: "transcript",
        data: { transcript, isFinal, confidence },
      });

      // Check for wake words
      if (isFinal) {
        this.checkWakeWord(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      this.emit({ type: "error", data: { error: event.error } });
    };

    recognition.onend = () => {
      this.isListening = false;
      if (!this.isSpeaking) {
        this.emit({ type: "idle" });
      }
    };

    this.recognition = recognition;
  }

  private loadVoices() {
    const loadVoicesImpl = () => {
      this.availableVoices = this.synthesis.getVoices();
    };

    loadVoicesImpl();

    // Chrome loads voices asynchronously
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoicesImpl;
    }
  }

  private checkWakeWord(transcript: string) {
    for (const { pattern, sentinel } of WAKE_WORDS) {
      if (pattern.test(transcript)) {
        this.emit({
          type: "wake-word",
          data: { sentinel, transcript },
        });
        break;
      }
    }
  }

  private emit(event: VoiceEvent) {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
  }

  public on(eventType: VoiceEventType, listener: (event: VoiceEvent) => void) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
  }

  public off(eventType: VoiceEventType, listener: (event: VoiceEvent) => void) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  public startListening() {
    if (!this.recognition) {
      console.error("Speech recognition not available");
      return;
    }

    if (this.isListening) {
      console.warn("Already listening");
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
    }
  }

  public stopListening() {
    if (!this.recognition || !this.isListening) {
      return;
    }

    try {
      this.recognition.stop();
    } catch (error) {
      console.error("Failed to stop recognition:", error);
    }
  }

  /**
   * Strip markdown formatting from text before TTS synthesis
   * so symbols like ** and _ are not read aloud.
   */
  private stripMarkdown(text: string): string {
    return text
      .replace(/#{1,6}\s+/g, "")           // headings
      .replace(/\*\*(.+?)\*\*/g, "$1")     // bold
      .replace(/\*(.+?)\*/g, "$1")         // italic *
      .replace(/_(.+?)_/g, "$1")           // italic _
      .replace(/~~(.+?)~~/g, "$1")         // strikethrough
      .replace(/`{1,3}[^`]*`{1,3}/g, "")  // inline code / code blocks
      .replace(/```[\s\S]*?```/g, "")      // fenced code blocks
      .replace(/!?\[([^\]]+)\]\([^)]+\)/g, "$1") // links and images
      .replace(/^[-*+]\s+/gm, "")         // unordered list markers
      .replace(/^\d+\.\s+/gm, "")         // ordered list markers
      .replace(/^>\s+/gm, "")             // blockquotes
      .replace(/[-_*]{3,}/g, "")          // horizontal rules
      .replace(/\|/g, " ")               // table pipes
      .replace(/\n{2,}/g, ". ")           // multiple newlines to pause
      .replace(/\n/g, " ")               // single newlines to space
      .trim();
  }

  public speak(text: string, config?: Partial<VoiceConfig>) {
    const finalConfig: VoiceConfig = {
      sentinelName: config?.sentinelName || this.currentConfig?.sentinelName || "Default",
      ...SENTINEL_VOICES[config?.sentinelName || this.currentConfig?.sentinelName || "Default"],
      ...config,
    };

    this.currentConfig = finalConfig;

    // Cancel any ongoing speech
    this.synthesis.cancel();

    // Strip markdown formatting so symbols are not read aloud
    const cleanText = this.stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.pitch = finalConfig.pitch;
    utterance.rate = finalConfig.rate;
    utterance.volume = finalConfig.volume;

    // Try to find the preferred voice
    if (finalConfig.voiceName) {
      const voice = this.availableVoices.find(
        (v) =>
          v.name.includes(finalConfig.voiceName!) || v.name === finalConfig.voiceName
      );
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.currentUtterance = utterance;
      this.emit({ type: "speaking" });
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (finalConfig.onEnd) finalConfig.onEnd();
      if (!this.isListening) {
        this.emit({ type: "idle" });
      }
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.emit({ type: "error", data: { error: event.error } });
    };

    this.synthesis.speak(utterance);
  }

  public stopSpeaking() {
    this.synthesis.cancel();
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  public pauseSpeaking() {
    if (this.isSpeaking) {
      this.synthesis.pause();
    }
  }

  public resumeSpeaking() {
    if (this.isSpeaking && this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  public getState() {
    return {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      isIdle: !this.isListening && !this.isSpeaking,
    };
  }

  public isSupported() {
    return {
      recognition: !!this.recognition,
      synthesis: !!this.synthesis,
    };
  }

  public getAvailableVoices() {
    return this.availableVoices;
  }
}

// Singleton instance
export const voiceService = new VoiceService();
