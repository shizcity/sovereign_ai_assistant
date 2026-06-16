import { useState, useEffect } from "react";
import { Sliders, Lock, Sparkles, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Props {
  sentinelId: number;
  sentinelName: string;
  sentinelEmoji?: string;
  open: boolean;
  onClose: () => void;
}

export function SentinelCustomiseModal({ sentinelId, sentinelName, sentinelEmoji, open, onClose }: Props) {
  const { user } = useAuth();
  const isPro = (user as any)?.subscriptionTier && (user as any).subscriptionTier !== "free";

  const [customTone, setCustomTone] = useState("");
  const [customFocus, setCustomFocus] = useState("");

  const { data: existing, isLoading } = trpc.sentinelCustomisation.get.useQuery(
    { sentinelId },
    { enabled: open && isPro }
  );

  useEffect(() => {
    if (existing) {
      setCustomTone(existing.customTone ?? "");
      setCustomFocus(existing.customFocus ?? "");
    } else if (!isLoading) {
      setCustomTone("");
      setCustomFocus("");
    }
  }, [existing, isLoading]);

  const utils = trpc.useUtils();
  const save = trpc.sentinelCustomisation.save.useMutation({
    onSuccess: () => {
      utils.sentinelCustomisation.get.invalidate({ sentinelId });
      toast.success("Customisation saved", { description: `${sentinelName} will now adapt to your preferences.` });
      onClose();
    },
    onError: (err) => {
      toast.error("Could not save", { description: err.message });
    },
  });

  const handleSave = () => {
    save.mutate({
      sentinelId,
      customTone: customTone.trim() || null,
      customFocus: customFocus.trim() || null,
    });
  };

  const handleClear = () => {
    save.mutate({ sentinelId, customTone: null, customFocus: null });
    setCustomTone("");
    setCustomFocus("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#0d0d0f] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <span className="text-xl">{sentinelEmoji ?? "🤖"}</span>
            Customise {sentinelName}
            <Badge className="ml-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              Pro
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-white/50 text-sm">
            Adjust how {sentinelName} communicates with you. These preferences are injected into every conversation.
          </DialogDescription>
        </DialogHeader>

        {!isPro ? (
          /* Locked state for free users */
          <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white/30" />
            </div>
            <div>
              <p className="text-white/70 font-medium mb-1">Pro feature</p>
              <p className="text-sm text-white/40">
                Upgrade to Pro to customise how each Sentinel speaks and what it focuses on.
              </p>
            </div>
            <Button
              className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-0 hover:opacity-90"
              onClick={onClose}
            >
              Upgrade to Pro
            </Button>
          </div>
        ) : (
          <div className="space-y-5 pt-1">
            {/* Tone */}
            <div className="space-y-2">
              <Label className="text-white/80 text-sm font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Communication Style
              </Label>
              <Textarea
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                placeholder="e.g. Be more concise and direct. Use bullet points when listing steps. Avoid jargon."
                className="bg-white/4 border-white/12 text-white placeholder:text-white/25 resize-none min-h-[90px] focus:border-cyan-500/50 text-sm"
                maxLength={1000}
              />
              <p className="text-[10px] text-white/25 text-right">{customTone.length}/1000</p>
            </div>

            {/* Focus */}
            <div className="space-y-2">
              <Label className="text-white/80 text-sm font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Focus Areas
              </Label>
              <Textarea
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                placeholder="e.g. Focus on Python, data engineering, and system design. Prioritise practical examples over theory."
                className="bg-white/4 border-white/12 text-white placeholder:text-white/25 resize-none min-h-[90px] focus:border-purple-500/50 text-sm"
                maxLength={1000}
              />
              <p className="text-[10px] text-white/25 text-right">{customFocus.length}/1000</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleClear}
                disabled={save.isPending || (!customTone && !customFocus && !existing)}
                className="text-xs text-white/30 hover:text-red-400 transition-colors disabled:opacity-30"
              >
                Clear customisation
              </button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="text-white/50 hover:text-white border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={save.isPending}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 text-white border-0 hover:opacity-90"
                >
                  {save.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
