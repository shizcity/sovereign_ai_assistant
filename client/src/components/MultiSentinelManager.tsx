import { Users, X, Plus, Crown, Wand2, AlertTriangle, Info } from "lucide-react";
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

// Sentinel shape returned by sentinels.list (built-in + custom merged)
interface SentinelItem {
  id: number;
  name: string;
  symbolEmoji: string;
  tagline?: string;
  primaryColor?: string;
  isCustom?: boolean; // set by the list merge for Creator users
}

export function MultiSentinelManager({ conversationId }: MultiSentinelManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [customWarningAccepted, setCustomWarningAccepted] = useState(false);
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const tier = (user?.subscriptionTier ?? "free").toLowerCase();
  const isPro = tier === "pro" || tier === "creator";
  const isCreator = tier === "creator";

  // Get conversation Sentinels
  const { data: conversationSentinels = [] } = trpc.conversations.listSentinels.useQuery({
    conversationId,
  });

  // Get all available Sentinels (includes custom for Creator users)
  const { data: allSentinels = [] } = trpc.sentinels.list.useQuery();

  // Add Sentinel mutation
  const addSentinel = trpc.conversations.addSentinel.useMutation({
    onSuccess: () => {
      utils.conversations.listSentinels.invalidate({ conversationId });
      toast.success("Sentinel added to conversation");
      setShowAddDialog(false);
      setCustomWarningAccepted(false);
    },
    onError: (error) => {
      if (error.message.includes("Pro feature")) {
        toast.error("Multi-Sentinel conversations require Pro", {
          description: "Upgrade to Pro to add multiple Sentinels to your conversations.",
          action: {
            label: "Upgrade",
            onClick: () => (window.location.href = "/settings"),
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
    addSentinel.mutate({ conversationId, sentinelId });
  };

  const handleRemoveSentinel = (sentinelId: number) => {
    if (conversationSentinels.length === 1) {
      toast.error("Cannot remove the last Sentinel from conversation");
      return;
    }
    removeSentinel.mutate({ conversationId, sentinelId });
  };

  // Split available Sentinels into built-in and custom groups
  const availableSentinels = (allSentinels as SentinelItem[]).filter(
    (s) => !conversationSentinels.some((cs: any) => cs.sentinelId === s.id)
  );
  const builtInAvailable = availableSentinels.filter((s) => !s.isCustom);
  const customAvailable = availableSentinels.filter((s) => s.isCustom);
  const hasCustomAvailable = isCreator && customAvailable.length > 0;

  if (conversationSentinels.length === 0) return null;

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
          {cs.role === "primary" && (
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
        onClick={() => { setShowAddDialog(true); setCustomWarningAccepted(false); }}
        className="h-7"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Sentinel
      </Button>

      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) setCustomWarningAccepted(false); }}>
        <DialogContent className="max-w-md">
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

          <div className="space-y-3 py-2">
            {/* Built-in Sentinels */}
            {builtInAvailable.length > 0 && (
              <div className="space-y-1.5">
                {hasCustomAvailable && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    Built-in Sentinels
                  </p>
                )}
                {builtInAvailable.map((sentinel) => (
                  <Button
                    key={sentinel.id}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => handleAddSentinel(sentinel.id)}
                    disabled={addSentinel.isPending}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{sentinel.symbolEmoji}</span>
                      <div className="text-left">
                        <div className="font-medium">{sentinel.name}</div>
                        <div className="text-xs text-muted-foreground">{sentinel.tagline}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {/* Custom Sentinels (Creator only) */}
            {hasCustomAvailable && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                  <Wand2 className="h-3 w-3 text-amber-400" />
                  My Custom Sentinels
                </p>

                {/* Responsibility disclaimer */}
                {!customWarningAccepted && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-amber-300">Custom Sentinel Notice</p>
                      <p className="text-xs text-amber-200/80 leading-relaxed">
                        Custom Sentinels use system prompts you wrote. In multi-Sentinel conversations,
                        conflicting or poorly scoped prompts may produce inconsistent or unexpected responses.
                        You are responsible for the quality and behavior of your custom Sentinels.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/20 bg-transparent mt-1"
                        onClick={() => setCustomWarningAccepted(true)}
                      >
                        I understand — show my Sentinels
                      </Button>
                    </div>
                  </div>
                )}

                {customWarningAccepted && customAvailable.map((sentinel) => (
                  <Button
                    key={sentinel.id}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 border-amber-500/30 hover:border-amber-500/60"
                    onClick={() => handleAddSentinel(sentinel.id)}
                    disabled={addSentinel.isPending}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-2xl">{sentinel.symbolEmoji}</span>
                      <div className="text-left flex-1">
                        <div className="font-medium flex items-center gap-1.5">
                          {sentinel.name}
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${sentinel.primaryColor ?? "#f59e0b"}22`,
                              color: sentinel.primaryColor ?? "#f59e0b",
                              border: `1px solid ${sentinel.primaryColor ?? "#f59e0b"}55`,
                            }}
                          >
                            Custom
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{sentinel.tagline ?? "Custom AI Persona"}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {availableSentinels.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                All available Sentinels are already in this conversation.
              </p>
            )}

            {/* Info note about custom Sentinels for non-Creator Pro users */}
            {isPro && !isCreator && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex gap-2">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Custom Sentinels are available on the Creator plan ($29/month).{" "}
                  <a href="/my-sentinels" className="text-amber-400 hover:underline">Learn more →</a>
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
