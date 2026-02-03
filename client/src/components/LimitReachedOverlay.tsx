import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function LimitReachedOverlay() {
  const [, setLocation] = useLocation();
  const { data: warningState } = trpc.subscription.getWarningState.useQuery(undefined, {
    refetchInterval: 30000, // Check every 30 seconds
  });

  const handleUpgrade = () => {
    setLocation("/settings");
  };

  // Only show for blocked warning level
  if (!warningState || warningState.level !== "blocked") {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 p-8 rounded-lg border-2 border-red-500/20 bg-card text-center">
        <div className="inline-flex p-4 rounded-full bg-red-500/10 mb-4">
          <Ban className="h-12 w-12 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Message Limit Reached</h2>
        
        <p className="text-muted-foreground mb-6">
          You've used all <span className="font-semibold text-foreground">{warningState.limit} free messages</span> this month.
          Upgrade to Pro for unlimited conversations and premium features.
        </p>

        <Button
          size="lg"
          onClick={handleUpgrade}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold"
        >
          Upgrade to Pro - $19/month
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          Your limit will reset in {Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
        </p>
      </div>
    </div>
  );
}
