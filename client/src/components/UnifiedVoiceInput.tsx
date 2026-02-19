import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, Clock, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface UnifiedVoiceInputProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

const MAX_RECORDING_TIME = 120; // 2 minutes in seconds
const WAKE_PHRASES = ["hey glow", "hi glow", "hello glow"];

export function UnifiedVoiceInput({ onTranscriptionComplete, disabled }: UnifiedVoiceInputProps) {
  // Mode state
  const [continuousMode, setContinuousMode] = useState(false);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));
  
  // Continuous listening state
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const transcribeMutation = trpc.voice.transcribe.useMutation({
    onSuccess: (data) => {
      if (data && data.text && data.text.trim()) {
        onTranscriptionComplete(data.text);
        toast.success("Voice transcribed successfully");
      } else {
        toast.error("Transcription returned empty result");
      }
      setIsProcessing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to transcribe audio");
      setIsProcessing(false);
    },
  });

  // Manual recording functions
  const startManualRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up Web Audio API for visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 64;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start visualizing audio levels
      visualizeAudio();
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Upload to storage and transcribe
        await uploadAndTranscribe(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= MAX_RECORDING_TIME) {
            stopManualRecording();
            toast.warning("Maximum recording time reached");
            return MAX_RECORDING_TIME;
          }
          return newTime;
        });
      }, 1000);
      
      toast.info("Recording... Click again to stop");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  };

  const stopManualRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      // Stop audio visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Reset audio levels
      setAudioLevels(Array(20).fill(0));
    }
  };

  const uploadAndTranscribe = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        // Remove data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Data = base64Audio.split(',')[1];
        
        // Call backend to upload and transcribe
        transcribeMutation.mutate({
          audio: base64Data,
          mimeType: "audio/webm",
        });
      };
      reader.onerror = () => {
        throw new Error("Failed to read audio file");
      };
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Failed to process audio");
      setIsProcessing(false);
    }
  };

  // Continuous listening functions
  const startContinuousListening = () => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Listening for 'Hey Glow'...");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = (finalTranscript + interimTranscript).toLowerCase();
      setLastTranscript(fullTranscript);

      // Check for wake phrase
      const containsWakePhrase = WAKE_PHRASES.some(phrase => 
        fullTranscript.includes(phrase)
      );

      if (containsWakePhrase && finalTranscript) {
        // Remove wake phrase from transcript
        let cleanedTranscript = finalTranscript;
        WAKE_PHRASES.forEach(phrase => {
          cleanedTranscript = cleanedTranscript.replace(phrase, '').trim();
        });

        if (cleanedTranscript) {
          toast.success("Wake phrase detected!");
          onTranscriptionComplete(cleanedTranscript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== 'no-speech') {
        toast.error(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Restart if continuous mode is still enabled
      if (continuousMode) {
        recognition.start();
      } else {
        setIsListening(false);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopContinuousListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setLastTranscript("");
  };

  // Visualize audio levels
  const visualizeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevels = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Sample 20 frequency bins and normalize to 0-1 range
      const levels = Array.from({ length: 20 }, (_, i) => {
        const index = Math.floor((i / 20) * dataArray.length);
        return dataArray[index] / 255;
      });
      
      setAudioLevels(levels);
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };
    
    updateLevels();
  };

  // Handle mode toggle
  const handleModeToggle = (enabled: boolean) => {
    setContinuousMode(enabled);
    
    if (enabled) {
      startContinuousListening();
    } else {
      stopContinuousListening();
    }
  };

  // Handle manual recording toggle
  const handleManualToggle = () => {
    if (isRecording) {
      stopManualRecording();
    } else {
      startManualRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (recordingTime / MAX_RECORDING_TIME) * 100;
  
  return (
    <div className="space-y-3 w-full">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Radio className={`h-4 w-4 ${isListening ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
          <Label htmlFor="continuous-mode" className="text-sm cursor-pointer">
            Continuous Listening {isListening && "(Active)"}
          </Label>
        </div>
        <Switch
          id="continuous-mode"
          checked={continuousMode}
          onCheckedChange={handleModeToggle}
          disabled={disabled || isRecording || isProcessing}
        />
      </div>

      {/* Status indicator for continuous mode */}
      {isListening && (
        <div className="text-xs text-muted-foreground text-center p-2 bg-green-500/10 rounded animate-in fade-in">
          🎤 Say "Hey Glow" followed by your message
        </div>
      )}

      {/* Manual Recording Button */}
      <Button
        onClick={handleManualToggle}
        disabled={disabled || isProcessing || continuousMode}
        variant={isRecording ? "destructive" : "default"}
        size="lg"
        className={`w-full ${
          isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : ""
        } ${
          isProcessing ? "opacity-50 cursor-not-allowed" : ""
        } ${
          continuousMode ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : isRecording ? (
          <>
            <MicOff className="h-5 w-5 mr-2" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="h-5 w-5 mr-2" />
            {continuousMode ? "Manual Recording (Disabled)" : "Click to Record"}
          </>
        )}
      </Button>
      
      {/* Recording Visualization */}
      {isRecording && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          {/* Audio Waveform Visualization */}
          <div className="flex items-center justify-center gap-1 h-16 bg-muted/30 rounded-lg p-3">
            {audioLevels.map((level, i) => (
              <div
                key={i}
                className="flex-1 bg-primary rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(level * 100, 10)}%`,
                  opacity: 0.5 + level * 0.5,
                }}
              />
            ))}
          </div>
          
          {/* Timer and Progress */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(recordingTime)}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatTime(MAX_RECORDING_TIME - recordingTime)} remaining
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
        </div>
      )}
    </div>
  );
}
