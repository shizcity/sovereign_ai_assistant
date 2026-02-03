import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const STORAGE_KEY = "usage_warning_dismissed";

export function UsageWarningBanner() {
  const [, setLocation] = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);
  const { data: warningState } = trpc.subscription.getWarningState.useQuery(undefined, {
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Debug logging
  useEffect(() => {
    console.log('[UsageWarningBanner] Warning state:', warningState);
  }, [warningState]);

  useEffect(() => {
    // Check if user has dismissed this warning level
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === "soft") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "soft");
    setIsDismissed(true);
  };

  const handleUpgrade = () => {
    setLocation("/settings");
  };

  // Only show for soft warning level
  if (!warningState || warningState.level !== "soft" || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 backdrop-blur-sm">
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-200 flex-1">
            You've used <span className="font-semibold">{warningState.used} of {warningState.limit}</span> free messages this month.{" "}
            <span className="text-amber-100 font-medium">Upgrade to Pro for unlimited conversations.</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="default"
            onClick={handleUpgrade}
            className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
          >
            Upgrade to Pro
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-amber-200 hover:text-amber-100 hover:bg-amber-500/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
