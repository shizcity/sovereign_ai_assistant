import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type VoiceMode = "off" | "manual" | "continuous";

interface VoiceModeToggleProps {
  voiceMode: VoiceMode;
  onToggle: (mode: VoiceMode) => void;
}

export function VoiceModeToggle({ voiceMode, onToggle }: VoiceModeToggleProps) {
  const [, setLocation] = useLocation();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { data: subscriptionStatus } = trpc.subscription.getStatus.useQuery();

  const isPro = subscriptionStatus?.tier === "pro" || subscriptionStatus?.tier === "creator";
  const isActive = voiceMode !== "off";

  const handleToggle = () => {
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }

    // Toggle between off and manual mode
    if (voiceMode === "off") {
      onToggle("manual");
    } else {
      onToggle("off");
    }
  };

  return (
    <>
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        className={isActive ? "bg-blue-600 hover:bg-blue-700" : ""}
      >
        {isActive ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
        Voice Mode
      </Button>

      {/* Upgrade Modal for Free Users */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-blue-500" />
              Unlock Voice Mode with Pro
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p>
                Voice Mode is a premium feature that lets you have natural, hands-free conversations with your AI Sentinels.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-blue-900 dark:text-blue-100">Pro Features Include:</p>
                <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
                  <li>✓ Voice input (speech-to-text)</li>
                  <li>✓ Voice output (text-to-speech)</li>
                  <li>✓ Hands-free continuous mode</li>
                  <li>✓ Unlimited messages</li>
                  <li>✓ Multi-Sentinel conversations</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>

              <p className="text-center font-bold text-lg">
                Only $19/month
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
            >
              Maybe Later
            </Button>
            <Button
              onClick={() => {
                setShowUpgradeModal(false);
                setLocation("/settings");
              }}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              Upgrade to Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
