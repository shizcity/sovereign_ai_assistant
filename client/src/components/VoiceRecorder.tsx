import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";


interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscriptionComplete, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      variant={isRecording ? "destructive" : "default"}
      size="lg"
      className={`
        ${isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : ""}
        ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
      `}
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
  );
}
