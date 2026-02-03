import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VoiceModeToggle } from "@/components/VoiceModeToggle";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Mic, Volume2, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type VoiceMode = "off" | "manual" | "continuous";

export default function VoiceChat() {
  const { user } = useAuth();
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("off");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; audioUrl?: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const synthesizeMutation = trpc.voice.synthesize.useMutation({
    onSuccess: (data) => {
      setCurrentAudioUrl(data.audioUrl);
      setIsProcessing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate speech");
      setIsProcessing(false);
    },
  });

  const sendMessageMutation = trpc.messages.send.useMutation({
    onSuccess: (data) => {
      // Add assistant message
      const assistantMessage = {
        role: "assistant" as const,
        content: data.content,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // If voice mode is active, synthesize speech
      if (voiceMode !== "off") {
        setIsProcessing(true);
        synthesizeMutation.mutate({
          text: data.content,
          voice: "alloy",
        });
      } else {
        setIsProcessing(false);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
      setIsProcessing(false);
    },
  });

  const handleTranscriptionComplete = (text: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setIsProcessing(true);

    // Send to AI (using a temporary conversation for demo)
    // In production, you'd create/select a conversation
    sendMessageMutation.mutate({
      conversationId: 1, // TODO: Create dedicated voice conversation
      content: text,
      model: "gemini-2.0-flash-exp",
    });
  };

  const handleAudioPlaybackComplete = () => {
    setCurrentAudioUrl(null);
    
    // If continuous mode, automatically start recording again
    if (voiceMode === "continuous") {
      // Small delay before auto-recording
      setTimeout(() => {
        // Trigger recording via ref or state
        toast.info("Ready for next message...");
      }, 500);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isPro = user?.subscriptionTier === "pro";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chat
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Voice Chat
              </h1>
              <p className="text-sm text-gray-400">Hands-free AI conversation</p>
            </div>
          </div>

          <VoiceModeToggle voiceMode={voiceMode} onToggle={setVoiceMode} />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {!isPro ? (
          <Card className="p-8 text-center bg-white/5 border-white/10">
            <Mic className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Voice Chat is a Pro Feature</h2>
            <p className="text-gray-400 mb-6">
              Upgrade to Pro to unlock hands-free AI conversations with speech-to-text and text-to-speech.
            </p>
            <Link href="/settings">
              <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                Upgrade to Pro - $19/month
              </Button>
            </Link>
          </Card>
        ) : voiceMode === "off" ? (
          <Card className="p-8 text-center bg-white/5 border-white/10">
            <Volume2 className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Enable Voice Mode</h2>
            <p className="text-gray-400 mb-6">
              Click "Voice Mode" in the header to start your hands-free conversation.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Messages */}
            <div className="space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <Card className="p-8 text-center bg-white/5 border-white/10">
                  <Mic className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-400">
                    Start speaking to begin your conversation...
                  </p>
                </Card>
              ) : (
                messages.map((message, index) => (
                  <Card
                    key={index}
                    className={`p-4 ${
                      message.role === "user"
                        ? "bg-blue-950/30 border-blue-500/20 ml-12"
                        : "bg-white/5 border-white/10 mr-12"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        message.role === "user" ? "bg-blue-500" : "bg-cyan-500"
                      }`}>
                        {message.role === "user" ? (
                          <Mic className="h-4 w-4 text-white" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-300 mb-1">
                          {message.role === "user" ? "You" : "AI Assistant"}
                        </p>
                        <div className="text-white prose prose-invert max-w-none">
                          <Streamdown>{message.content}</Streamdown>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Audio Player */}
            {currentAudioUrl && (
              <AudioPlayer
                audioUrl={currentAudioUrl}
                onPlaybackComplete={handleAudioPlaybackComplete}
              />
            )}

            {/* Voice Recorder */}
            <div className="flex justify-center">
              {isProcessing ? (
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <VoiceRecorder
                  onTranscriptionComplete={handleTranscriptionComplete}
                  disabled={isProcessing}
                />
              )}
            </div>

            {/* Mode Indicator */}
            <div className="text-center text-sm text-gray-400">
              {voiceMode === "continuous" ? (
                <p>🔄 Continuous mode: Recording will start automatically after AI responds</p>
              ) : (
                <p>🎤 Manual mode: Click "Hold to Talk" to record each message</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
