import { Users, X, Plus, Crown } from "lucide-react";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface MultiSentinelManagerProps {
  conversationId: number;
}

export function MultiSentinelManager({ conversationId }: MultiSentinelManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const isPro = user?.subscriptionTier === "pro";

  // Get conversation Sentinels using new endpoint
  const { data: conversationSentinels = [] } = trpc.conversations.listSentinels.useQuery({
    conversationId,
  });

  // Get all available Sentinels for adding
  const { data: allSentinels = [] } = trpc.sentinels.list.useQuery();

  // Add Sentinel mutation with Pro gating
  const addSentinel = trpc.conversations.addSentinel.useMutation({
    onSuccess: () => {
      utils.conversations.listSentinels.invalidate({ conversationId });
      toast.success("Sentinel added to conversation");
      setShowAddDialog(false);
    },
    onError: (error) => {
      if (error.message.includes("Pro feature")) {
        toast.error("Multi-Sentinel conversations require Pro", {
          description: "Upgrade to Pro to add multiple Sentinels to your conversations.",
          action: {
            label: "Upgrade",
            onClick: () => window.location.href = "/settings",
          },
        });
      } else {
        toast.error(`Failed to add Sentinel: ${error.message}`);
      }
    },
  });

  // Remove Sentinel mutation
  const removeSentinel = trpc.conversations.removeSentinel.useMutation({
    onSuccess: () => {
      utils.conversations.listSentinels.invalidate({ conversationId });
      toast.success("Sentinel removed from conversation");
    },
    onError: (error) => {
      toast.error(`Failed to remove Sentinel: ${error.message}`);
    },
  });

  const handleAddSentinel = (sentinelId: number) => {
    addSentinel.mutate({
      conversationId,
      sentinelId,
    });
  };

  const handleRemoveSentinel = (sentinelId: number) => {
    // Don't allow removing the last Sentinel
    if (conversationSentinels.length === 1) {
      toast.error("Cannot remove the last Sentinel from conversation");
      return;
    }

    removeSentinel.mutate({
      conversationId,
      sentinelId,
    });
  };

  // Filter out Sentinels already in the conversation
  const availableSentinels = allSentinels.filter(
    (s: any) => !conversationSentinels.some((cs: any) => cs.sentinelId === s.id)
  );

  if (conversationSentinels.length === 0) {
    return null; // Don't show if no Sentinels assigned
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>Active Sentinels:</span>
      </div>

      {conversationSentinels.map((cs: any) => (
        <div
          key={cs.id}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm"
        >
          <span>{cs.symbolEmoji}</span>
          <span>{cs.sentinelName}</span>
          {cs.role === 'primary' && (
            <span className="text-xs opacity-70">(primary)</span>
          )}
          {conversationSentinels.length > 1 && (
            <button
              onClick={() => handleRemoveSentinel(cs.sentinelId)}
              className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
              title="Remove Sentinel"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAddDialog(true)}
        className="h-7"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Sentinel
      </Button>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Add Sentinel to Conversation
              {!isPro && (
                <span className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Pro
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {isPro
                ? "Select a Sentinel to add as a collaborator. Multiple Sentinels will automatically rotate responses."
                : "Multi-Sentinel conversations are a Pro feature. You can have one Sentinel per conversation on the Free plan."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-4">
            {availableSentinels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                All available Sentinels are already in this conversation.
              </p>
            ) : (
              availableSentinels.map((sentinel: any) => (
                <Button
                  key={sentinel.id}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => handleAddSentinel(sentinel.id)}
                  disabled={addSentinel.isPending}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sentinel.symbolEmoji}</span>
                    <div className="text-left">
                      <div className="font-medium">{sentinel.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {sentinel.tagline}
                      </div>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
