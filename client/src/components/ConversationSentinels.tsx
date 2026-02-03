import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AddSentinelDialog } from "./AddSentinelDialog";

interface ConversationSentinelsProps {
  conversationId: number;
}

export function ConversationSentinels({ conversationId }: ConversationSentinelsProps) {
  const utils = trpc.useUtils();
  
  const { data: conversationSentinels, isLoading } = trpc.conversations.listSentinels.useQuery(
    { conversationId }
  );

  const { data: allSentinels } = trpc.sentinels.list.useQuery();

  const removeSentinel = trpc.conversations.removeSentinel.useMutation({
    onSuccess: () => {
      toast.success("Sentinel removed from conversation");
      utils.conversations.listSentinels.invalidate({ conversationId });
    },
    onError: (error) => {
      toast.error(`Failed to remove Sentinel: ${error.message}`);
    },
  });

  const handleRemove = (sentinelId: number) => {
    if (conversationSentinels && conversationSentinels.length <= 1) {
      toast.error("Cannot remove the last Sentinel from a conversation");
      return;
    }
    removeSentinel.mutate({ conversationId, sentinelId });
  };

  const handleSentinelAdded = () => {
    utils.conversations.listSentinels.invalidate({ conversationId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading Sentinels...</span>
      </div>
    );
  }

  if (!conversationSentinels || conversationSentinels.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">No Sentinels assigned</span>
        <AddSentinelDialog conversationId={conversationId} onSentinelAdded={handleSentinelAdded} />
      </div>
    );
  }

  const sentinelMap = new Map(allSentinels?.map(s => [s.id, s]));

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Sentinels:</span>
      {conversationSentinels.map((cs) => {
        const sentinel = sentinelMap.get(cs.sentinelId);
        if (!sentinel) return null;

        return (
          <div
            key={cs.id}
            className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
          >
            <span>{sentinel.name}</span>
            {cs.role === "primary" && (
              <span className="text-xs opacity-70">(Primary)</span>
            )}
            {conversationSentinels.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                onClick={() => handleRemove(cs.sentinelId)}
                disabled={removeSentinel.isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      })}
      <AddSentinelDialog conversationId={conversationId} onSentinelAdded={handleSentinelAdded} />
    </div>
  );
}
