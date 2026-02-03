import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function UsageWarningModal() {
  const [, setLocation] = useLocation();
  const { data: warningState } = trpc.subscription.getWarningState.useQuery(undefined, {
    refetchInterval: 30000, // Check every 30 seconds
  });

  const handleUpgrade = () => {
    setLocation("/settings");
  };

  const handleRemindLater = () => {
    // Modal will reappear on next session or page refresh
    // We don't permanently dismiss urgent warnings
  };

  // Only show for urgent warning level
  const isOpen = warningState?.level === "urgent";

  if (!warningState) {
    return null;
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-orange-500/10">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
            <DialogTitle className="text-xl">Almost Out of Messages</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            You've used <span className="font-semibold text-foreground">{warningState.used} of {warningState.limit}</span> free messages this month.
            {" "}Only <span className="font-semibold text-orange-500">{warningState.remaining} messages left</span>!
            <br /><br />
            Upgrade to Pro now to continue chatting without interruption.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleRemindLater}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Remind Me Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-medium order-1 sm:order-2"
          >
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
