import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";


interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

const MAX_RECORDING_TIME = 120; // 2 minutes in seconds

export function VoiceRecorder({ onTranscriptionComplete, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  const startRecording = async () => {
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
            stopRecording();
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

  const stopRecording = () => {
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

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
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
      <Button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        variant={isRecording ? "destructive" : "default"}
        size="lg"
        className={`w-full ${
          isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : ""
        } ${
          isProcessing ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : isRecording ? (
          <>
            <Square className="h-5 w-5 mr-2" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="h-5 w-5 mr-2" />
            Hold to Talk
          </>
        )}
      </Button>
      
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
