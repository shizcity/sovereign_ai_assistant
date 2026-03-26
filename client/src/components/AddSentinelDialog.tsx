import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Plus, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface AddSentinelDialogProps {
  conversationId: number;
  onSentinelAdded?: () => void;
}

export function AddSentinelDialog({ conversationId, onSentinelAdded }: AddSentinelDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const isPro = user?.subscriptionTier === "pro" || user?.subscriptionTier === "creator";

  const { data: allSentinels, isLoading: sentinelsLoading } = trpc.sentinels.list.useQuery();
  const { data: conversationSentinels } = trpc.conversations.listSentinels.useQuery(
    { conversationId },
    { enabled: open }
  );

  const addSentinel = trpc.conversations.addSentinel.useMutation({
    onSuccess: () => {
      toast.success("Sentinel added to conversation");
      setOpen(false);
      onSentinelAdded?.();
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

  const handleAddSentinel = (sentinelId: number) => {
    addSentinel.mutate({ conversationId, sentinelId });
  };

  const assignedSentinelIds = new Set(conversationSentinels?.map(cs => cs.sentinelId) || []);
  const availableSentinels = allSentinels?.filter(s => !assignedSentinelIds.has(s.id)) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Sentinel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
              ? "Choose a Sentinel to add to this conversation. Multiple Sentinels will take turns responding."
              : "Multi-Sentinel conversations are a Pro feature. You can have one Sentinel per conversation on the Free plan."}
          </DialogDescription>
        </DialogHeader>

        {sentinelsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : availableSentinels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            All available Sentinels are already in this conversation.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableSentinels.map((sentinel) => (
              <div
                key={sentinel.id}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{sentinel.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {sentinel.primaryFunction}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleAddSentinel(sentinel.id)}
                  disabled={addSentinel.isPending}
                  size="sm"
                  className="w-full mt-2"
                >
                  {addSentinel.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
