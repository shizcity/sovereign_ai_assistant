import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Zap, TrendingUp } from "lucide-react";

/**
 * UsageWidget — shown in the chat sidebar.
 * Free users see a progress bar with messages used / limit and an upgrade CTA.
 * Pro/Creator users see a compact "Unlimited" badge with their tier name.
 */
export function UsageWidget() {
  const { user } = useAuth();
  const tier = (user?.subscriptionTier ?? "free").toLowerCase();
  const isPro = tier === "pro" || tier === "creator";

  const { data: usage, isLoading } = trpc.subscription.getUsage.useQuery(undefined, {
    // Refresh every 2 minutes so the count stays reasonably fresh
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data: { url: string | null }) => {
      if (data.url) window.open(data.url, "_blank");
      toast.info("Redirecting to checkout…");
    },
    onError: () => toast.error("Could not start checkout. Please try again."),
  });

  if (isLoading || !usage) return null;

  // Pro / Creator — show a compact unlimited badge
  if (isPro) {
    return (
      <div className="mx-3 mb-2 rounded-lg px-3 py-2 bg-white/5 border border-white/10 flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-white capitalize">{tier} Plan</p>
          <p className="text-[11px] text-gray-500">Unlimited messages</p>
        </div>
      </div>
    );
  }

  // Free tier — show progress bar
  const limit = usage.limit > 0 ? usage.limit : 50;
  const used = usage.used ?? 0;
  const pct = Math.min(100, Math.round((used / limit) * 100));

  // Colour ramp: green → amber → red
  const barColor =
    pct >= 96 ? "bg-red-500" : pct >= 80 ? "bg-amber-400" : "bg-cyan-500";
  const textColor =
    pct >= 96 ? "text-red-400" : pct >= 80 ? "text-amber-400" : "text-gray-400";

  return (
    <div className="mx-3 mb-2 rounded-lg px-3 py-2.5 bg-white/5 border border-white/10 space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-300 font-medium">Monthly Usage</span>
        </div>
        <span className={`text-[11px] font-semibold tabular-nums ${textColor}`}>
          {used} / {limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Sub-row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500">
          {usage.daysUntilReset != null
            ? `Resets in ${usage.daysUntilReset}d`
            : "Resets monthly"}
        </span>
        {pct >= 60 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => createCheckout.mutate({ tier: "pro" })}
            disabled={createCheckout.isPending}
            className="h-5 px-2 text-[11px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
          >
            Upgrade
          </Button>
        )}
      </div>
    </div>
  );
}
