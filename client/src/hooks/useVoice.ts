import { useEffect, useState, useCallback, useRef } from "react";
import { voiceService, type VoiceConfig, type VoiceEvent } from "@/lib/voice";

export interface UseVoiceOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onWakeWord?: (sentinel: string) => void;
  onError?: (error: any) => void;
  autoStart?: boolean;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState({ recognition: false, synthesis: false });
  
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    // Check support
    const support = voiceService.isSupported();
    setIsSupported(support);

    // Set up event listeners
    const handleListening = () => setIsListening(true);
    const handleSpeaking = () => setIsSpeaking(true);
    const handleIdle = () => {
      setIsListening(false);
      setIsSpeaking(false);
    };

    const handleTranscript = (event: VoiceEvent) => {
      const { transcript, isFinal } = event.data;
      setTranscript(transcript);
      optionsRef.current.onTranscript?.(transcript, isFinal);
    };

    const handleWakeWord = (event: VoiceEvent) => {
      const { sentinel } = event.data;
      optionsRef.current.onWakeWord?.(sentinel);
    };

    const handleError = (event: VoiceEvent) => {
      optionsRef.current.onError?.(event.data.error);
    };

    voiceService.on("listening", handleListening);
    voiceService.on("speaking", handleSpeaking);
    voiceService.on("idle", handleIdle);
    voiceService.on("transcript", handleTranscript);
    voiceService.on("wake-word", handleWakeWord);
    voiceService.on("error", handleError);

    // Auto-start if requested
    if (options.autoStart && support.recognition) {
      voiceService.startListening();
    }

    return () => {
      voiceService.off("listening", handleListening);
      voiceService.off("speaking", handleSpeaking);
      voiceService.off("idle", handleIdle);
      voiceService.off("transcript", handleTranscript);
      voiceService.off("wake-word", handleWakeWord);
      voiceService.off("error", handleError);
    };
  }, []);

  const startListening = useCallback(() => {
    voiceService.startListening();
  }, []);

  const stopListening = useCallback(() => {
    voiceService.stopListening();
  }, []);

  const speak = useCallback((text: string, config?: Partial<VoiceConfig>) => {
    voiceService.speak(text, config);
  }, []);

  const stopSpeaking = useCallback(() => {
    voiceService.stopSpeaking();
  }, []);

  const pauseSpeaking = useCallback(() => {
    voiceService.pauseSpeaking();
  }, []);

  const resumeSpeaking = useCallback(() => {
    voiceService.resumeSpeaking();
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
  };
}
