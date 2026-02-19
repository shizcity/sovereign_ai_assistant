import { Mic, MicOff, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useVoice } from "@/hooks/useVoice";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface VoiceControlsProps {
  sentinelName?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onWakeWord?: (sentinel: string) => void;
}

export function VoiceControls({
  sentinelName,
  onTranscript,
  onWakeWord,
}: VoiceControlsProps) {
  const [isWakeWordMode, setIsWakeWordMode] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const {
    isListening,
    isSpeaking,
    transcript,
    isSupported,
    startListening,
    stopListening,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
  } = useVoice({
    onTranscript: (text, isFinal) => {
      setShowTranscript(true);
      onTranscript?.(text, isFinal);
      if (isFinal) {
        setTimeout(() => setShowTranscript(false), 3000);
      }
    },
    onWakeWord: (sentinel) => {
      toast.success(`Wake word detected: ${sentinel}`);
      onWakeWord?.(sentinel);
    },
    onError: (error) => {
      toast.error(`Voice error: ${error}`);
    },
  });

  // Only show warnings when user actually tries to use voice features
  // Removed automatic toast warnings on page load

  const toggleListening = () => {
    if (!isSupported.recognition) {
      toast.error("Speech recognition not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      stopListening();
      setIsWakeWordMode(false);
    } else {
      startListening();
    }
  };

  const toggleWakeWordMode = () => {
    if (!isSupported.recognition) {
      toast.error("Speech recognition not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    if (isWakeWordMode) {
      stopListening();
      setIsWakeWordMode(false);
      toast.info("Wake-word mode disabled");
    } else {
      startListening();
      setIsWakeWordMode(true);
      toast.success("Wake-word mode enabled. Say 'Hey Vixen', 'Hey Mischief', etc.");
    }
  };

  const [isPaused, setIsPaused] = useState(false);
  const togglePauseSpeaking = () => {
    if (isPaused) {
      resumeSpeaking();
      setIsPaused(false);
    } else {
      pauseSpeaking();
      setIsPaused(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Voice Controls */}
      <div className="flex items-center gap-2">
        {/* Microphone Control */}
        <Button
          variant={isListening ? "default" : "outline"}
          size="icon"
          onClick={toggleListening}
          disabled={!isSupported.recognition}
          className={isListening ? "animate-pulse" : ""}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>

        {/* Wake-Word Mode Toggle */}
        <Button
          variant={isWakeWordMode ? "default" : "outline"}
          size="sm"
          onClick={toggleWakeWordMode}
          disabled={!isSupported.recognition}
          title={isWakeWordMode ? "Disable wake-word mode" : "Enable wake-word mode"}
        >
          {isWakeWordMode ? "🎙️ Always Listening" : "🎙️ Wake Word"}
        </Button>

        {/* Speaker Control */}
        {isSpeaking && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={togglePauseSpeaking}
              title={isPaused ? "Resume speaking" : "Pause speaking"}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={stopSpeaking}
              title="Stop speaking"
            >
              <VolumeX className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isListening && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Listening...
            </span>
          )}
          {isSpeaking && (
            <span className="flex items-center gap-1">
              <Volume2 className="h-4 w-4 animate-pulse" />
              Speaking...
            </span>
          )}
          {!isListening && !isSpeaking && (
            <span className="text-muted-foreground">Idle</span>
          )}
        </div>
      </div>

      {/* Real-time Transcript */}
      {showTranscript && transcript && (
        <Card className="p-4 bg-muted/50 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-2">
            <Mic className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">You said:</p>
              <p className="text-sm text-muted-foreground italic">{transcript}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Waveform Animation */}
      {(isListening || isSpeaking) && (
        <div className="flex items-center justify-center gap-1 h-16">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 bg-primary rounded-full ${
                isListening ? "animate-pulse" : "animate-bounce"
              }`}
              style={{
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.05}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Wake-Word Help */}
      {isWakeWordMode && (
        <Card className="p-3 bg-primary/5 border-primary/20">
          <p className="text-xs text-muted-foreground">
            <strong>Wake-word mode active.</strong> Say one of these to activate a Sentinel:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Hey Vixen", "Hey Mischief", "Hey Lunaris", "Hey Aetheris", "Hey Rift", "Hey Nyx"].map(
              (wakeWord) => (
                <span
                  key={wakeWord}
                  className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium"
                >
                  "{wakeWord}"
                </span>
              )
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
