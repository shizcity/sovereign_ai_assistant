import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import confetti from "canvas-confetti";
import {
  Sparkles,
  MessageSquare,
  Users,
  TrendingUp,
  Mic,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSentinelId, setSelectedSentinelId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [createdConversationId, setCreatedConversationId] = useState<number | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const completeOnboardingMutation = trpc.auth.completeOnboarding.useMutation();
  const updateStepMutation = trpc.auth.updateOnboardingStep.useMutation();
  const createConversationMutation = trpc.conversations.create.useMutation();
  const sendMessageMutation = trpc.messages.send.useMutation();
  const { data: sentinels } = trpc.sentinels.list.useQuery();

  const totalSteps = 6;

  useEffect(() => {
    if (currentStep > 0) {
      updateStepMutation.mutate({ step: currentStep });
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setShowSkipConfirm(true);
  };

  const confirmSkip = async () => {
    await completeOnboardingMutation.mutateAsync();
    onComplete();
  };

  const handleComplete = async () => {
    // Fire confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    await completeOnboardingMutation.mutateAsync();
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  const handleSelectSentinel = (sentinelId: number) => {
    setSelectedSentinelId(sentinelId);
    // Auto-advance after selection
    setTimeout(() => {
      handleNext();
    }, 500);
  };

  const handleSendMessage = async () => {
    if (!message || !selectedSentinelId) {
      return;
    }

    try {
      // Create a conversation first
      const conv = await createConversationMutation.mutateAsync({
        title: "My First Conversation",
        defaultModel: "gpt-4",
      });
      setCreatedConversationId(conv.id);

      // Send the message
      await sendMessageMutation.mutateAsync({
        conversationId: conv.id,
        content: message,
        targetSentinelId: selectedSentinelId,
      });

      // Auto-advance after response
      setTimeout(() => {
        handleNext();
      }, 1500);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-3">Welcome to Sovereign AI</h2>
              <p className="text-lg text-muted-foreground">
                Your AI. Your Identity. Your Sovereignty.
              </p>
            </div>
            <div className="space-y-3 text-left max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Work with specialized AI personalities called "Sentinels"</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Have multi-perspective conversations with multiple Sentinels</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Access advanced features like Voice Mode and Analytics</p>
              </div>
            </div>
            <Button onClick={handleNext} size="lg" className="mt-4">
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6 py-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Meet the Sentinels</h2>
              <p className="text-muted-foreground">
                Each Sentinel has unique expertise, personality, and communication style
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sentinels?.slice(0, 3).map((sentinel) => (
                <div key={sentinel.id} className="border rounded-lg p-4 space-y-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: sentinel.primaryColor }}
                  >
                    {sentinel.symbolEmoji}
                  </div>
                  <h3 className="font-semibold">{sentinel.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {sentinel.archetype}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Button onClick={handleNext}>
                Choose Your Sentinel <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 py-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Choose Your First Sentinel</h2>
              <p className="text-muted-foreground">
                Select a Sentinel to start your first conversation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {sentinels?.slice(0, 4).map((sentinel) => (
                <button
                  key={sentinel.id}
                  onClick={() => handleSelectSentinel(sentinel.id)}
                  className={`border rounded-lg p-4 text-left transition-all hover:shadow-lg hover:scale-105 ${
                    selectedSentinelId === sentinel.id
                      ? "ring-2 ring-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                      style={{ backgroundColor: sentinel.primaryColor }}
                    >
                      {sentinel.symbolEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{sentinel.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {sentinel.primaryFunction}
                      </p>
                    </div>
                    {selectedSentinelId === sentinel.id && (
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedSentinelId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center max-w-md mx-auto">
                <Check className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800">
                  Great choice! Moving to next step...
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 py-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Start a Conversation</h2>
              <p className="text-muted-foreground">
                Ask your Sentinel a question to see them in action
              </p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Message</label>
                <Textarea
                  placeholder="e.g., What are the key principles of good data visualization?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={!message || !selectedSentinelId || sendMessageMutation.isPending}
                className="w-full"
              >
                {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
              </Button>

              {sendMessageMutation.isSuccess && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <Check className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-800">
                    Message sent! Your Sentinel is responding...
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 py-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Discover Pro Features</h2>
              <p className="text-muted-foreground">
                Unlock advanced capabilities with Sovereign AI Pro
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-6 space-y-3 text-center">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Mic className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="font-semibold">Voice-First Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Talk to your Sentinels with speech-to-text and text-to-speech
                </p>
              </div>

              <div className="border rounded-lg p-6 space-y-3 text-center">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="font-semibold">Multi-Sentinel Conversations</h3>
                <p className="text-sm text-muted-foreground">
                  Get multiple perspectives in a single conversation
                </p>
              </div>

              <div className="border rounded-lg p-6 space-y-3 text-center">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold">Advanced Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track usage, insights, and conversation trends
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleNext}>
                Continue with Free
              </Button>
              <Button onClick={handleNext}>
                Explore Pro <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-3">You're All Set!</h2>
              <p className="text-lg text-muted-foreground">
                You've successfully chosen a Sentinel and started a conversation
              </p>
            </div>

            <div className="bg-muted rounded-lg p-6 max-w-md mx-auto space-y-3 text-left">
              <h3 className="font-semibold mb-3">Quick Tips:</h3>
              <div className="space-y-2 text-sm">
                <p>
                  • Press <kbd className="px-2 py-1 bg-background rounded border">⌘K</kbd> to
                  search conversations
                </p>
                <p>
                  • Press <kbd className="px-2 py-1 bg-background rounded border">⌘N</kbd> to
                  create a new conversation
                </p>
                <p>
                  • Press <kbd className="px-2 py-1 bg-background rounded border">⌘↵</kbd> to send
                  messages
                </p>
                <p>• Visit Settings to customize your experience</p>
                <p>• Check out Templates for pre-built conversation starters</p>
                <p>• Explore "Meet the Sentinels" to discover all available Sentinels</p>
              </div>
            </div>

            <Button onClick={handleComplete} size="lg" className="mt-4">
              Start Exploring <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open && !showSkipConfirm} onOpenChange={() => {}}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? "w-8 bg-primary"
                      : index < currentStep
                      ? "w-2 bg-primary"
                      : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip Tutorial
            </Button>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">{renderStep()}</div>

          {/* Navigation Buttons */}
          {currentStep > 0 && currentStep < totalSteps - 1 && currentStep !== 2 && currentStep !== 3 && (
            <div className="flex justify-between mt-6 pt-6 border-t">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              <Button onClick={handleNext}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Skip Confirmation Dialog */}
      <Dialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold">Skip Tutorial?</h3>
                <p className="text-sm text-muted-foreground">
                  You can restart it anytime from Settings
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowSkipConfirm(false)}>
                Continue Tutorial
              </Button>
              <Button onClick={confirmSkip}>Skip</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
