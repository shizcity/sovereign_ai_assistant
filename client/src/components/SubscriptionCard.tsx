import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Crown, Loader2, Settings, Sparkles, Wand2, Zap, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

// ─── Tier config ──────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  free: {
    label: "Free",
    icon: Sparkles,
    badgeClass: "bg-slate-700/60 text-slate-300 border border-slate-600/40",
    cardBorder: "border-border",
    accentClass: "text-slate-400",
    description: "50 messages / month · 3 Sentinels",
    price: null,
  },
  pro: {
    label: "Pro",
    icon: Crown,
    badgeClass: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
    cardBorder: "border-yellow-500/40",
    accentClass: "text-yellow-400",
    description: "Unlimited messages · All 6 Sentinels · Voice mode",
    price: "$19/mo",
  },
  creator: {
    label: "Creator",
    icon: Wand2,
    badgeClass: "bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30",
    cardBorder: "border-cyan-500/40",
    accentClass: "text-cyan-400",
    description: "Everything in Pro · Custom Sentinels · Template builder",
    price: "$29/mo",
  },
} as const;

type TierKey = keyof typeof TIER_CONFIG;

// ─── Feature comparison ───────────────────────────────────────────────────────

const FEATURES: { label: string; free: boolean; pro: boolean; creator: boolean }[] = [
  { label: "Unlimited messages",          free: false, pro: true,  creator: true  },
  { label: "All 6 Sentinels",             free: false, pro: true,  creator: true  },
  { label: "Multi-Sentinel conversations",free: false, pro: true,  creator: true  },
  { label: "Voice mode",                  free: false, pro: true,  creator: true  },
  { label: "Unlimited memory",            free: false, pro: true,  creator: true  },
  { label: "Template builder",            free: false, pro: true,  creator: true  },
  { label: "Custom Sentinels (up to 5)",  free: false, pro: false, creator: true  },
  { label: "Round Table deliberation",    free: false, pro: true,  creator: true  },
  { label: "Priority support",            free: false, pro: true,  creator: true  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function SubscriptionCard() {
  const { data: subscriptionStatus, isLoading: statusLoading } = trpc.subscription.getStatus.useQuery();
  const { data: usage, isLoading: usageLoading } = trpc.subscription.getUsage.useQuery();

  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.info("Redirecting to Stripe checkout…");
      }
    },
    onError: (error) => toast.error(`Failed to create checkout: ${error.message}`),
  });

  const createPortalSession = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.info("Opening subscription management…");
      }
    },
    onError: (error) => toast.error(`Failed to open portal: ${error.message}`),
  });

  if (statusLoading || usageLoading) {
    return (
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const rawTier = (subscriptionStatus?.tier ?? "free").toLowerCase() as TierKey;
  const tier = TIER_CONFIG[rawTier] ?? TIER_CONFIG.free;
  const TierIcon = tier.icon;
  const isFree = rawTier === "free";
  const isPro = rawTier === "pro";
  const isCreator = rawTier === "creator";

  const usagePercent = usage ? Math.min((usage.used / usage.limit) * 100, 100) : 0;
  const daysUntilReset = usage?.daysUntilReset ?? 0;

  return (
    <Card className={`bg-card text-card-foreground ${tier.cardBorder} overflow-hidden`}>
      {/* Tier accent bar */}
      <div
        className={`h-1 w-full ${
          isCreator
            ? "bg-gradient-to-r from-indigo-500 to-cyan-400"
            : isPro
            ? "bg-gradient-to-r from-yellow-500 to-orange-400"
            : "bg-gradient-to-r from-slate-600 to-slate-500"
        }`}
      />

      <CardHeader className="pb-3">
        {/* Title row with tier badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <CardTitle className="text-lg">Subscription</CardTitle>
              {/* Tier pill badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${tier.badgeClass}`}
              >
                <TierIcon className="w-3 h-3" />
                {tier.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{tier.description}</p>
          </div>

          {/* Action button */}
          <div className="flex-shrink-0">
            {isFree ? (
              <Button
                size="sm"
                onClick={() => createCheckout.mutate({ tier: "pro" })}
                disabled={createCheckout.isPending}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg shadow-yellow-500/20"
              >
                {createCheckout.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="mr-1.5 h-3.5 w-3.5" />
                    Upgrade
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => createPortalSession.mutate()}
                disabled={createPortalSession.isPending}
              >
                {createPortalSession.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Settings className="mr-1.5 h-3.5 w-3.5" />
                    Manage
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Free tier: usage bar */}
        {isFree && usage && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Messages used</span>
              <span className="font-medium tabular-nums">
                {usage.used} / {usage.limit}
              </span>
            </div>
            <Progress value={usagePercent} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Resets in {daysUntilReset} {daysUntilReset === 1 ? "day" : "days"}</span>
              {usagePercent >= 80 && (
                <span className="text-orange-400 font-medium">⚠ Running low</span>
              )}
            </div>
          </div>
        )}

        {/* Pro/Creator: subscription status */}
        {!isFree && (
          <div className="space-y-2 text-sm">
            {subscriptionStatus?.status && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">
                  {subscriptionStatus.status === "active" && (
                    <span className="text-green-400">✓ Active</span>
                  )}
                  {subscriptionStatus.status === "trialing" && "🎁 Trial"}
                  {subscriptionStatus.status === "past_due" && (
                    <span className="text-yellow-400">⚠ Past Due</span>
                  )}
                  {subscriptionStatus.status === "canceled" && (
                    <span className="text-red-400">✕ Canceled</span>
                  )}
                  {subscriptionStatus.status === "unpaid" && (
                    <span className="text-red-400">✕ Unpaid</span>
                  )}
                </span>
              </div>
            )}
            {subscriptionStatus?.currentPeriodEnd && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {subscriptionStatus.status === "canceled" ? "Access until" : "Next billing"}
                </span>
                <span className="font-medium">
                  {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}
            {subscriptionStatus?.status === "canceled" && (
              <div className="mt-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400">
                Your subscription is canceled. Access continues until{" "}
                {new Date(subscriptionStatus.currentPeriodEnd!).toLocaleDateString()}.
              </div>
            )}
            {subscriptionStatus?.status === "past_due" && (
              <div className="mt-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
                Payment past due — please update your payment method to keep access.
              </div>
            )}
          </div>
        )}

        {/* Feature comparison table */}
        <div className="pt-1 border-t border-border space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            What's included
          </p>
          {FEATURES.map((f) => {
            const included =
              isCreator ? f.creator : isPro ? f.pro : f.free;
            return (
              <div
                key={f.label}
                className={`flex items-center gap-2 text-sm ${
                  included ? "text-foreground" : "text-muted-foreground/40 line-through"
                }`}
              >
                <Check
                  className={`h-3.5 w-3.5 flex-shrink-0 ${
                    included ? tier.accentClass : "text-muted-foreground/30"
                  }`}
                />
                {f.label}
              </div>
            );
          })}
        </div>

        {/* Upgrade CTAs for Free and Pro users */}
        {isFree && (
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3">
            <div className="text-sm font-semibold text-yellow-300">
              Unlock the full Glow experience
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => createCheckout.mutate({ tier: "pro" })}
                disabled={createCheckout.isPending}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm font-semibold shadow-md shadow-yellow-500/20 transition-all active:scale-[0.98]"
              >
                <span className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Pro — $19/mo
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => createCheckout.mutate({ tier: "creator" })}
                disabled={createCheckout.isPending}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-sm font-semibold transition-all active:scale-[0.98]"
              >
                <span className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Creator — $29/mo
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cancel anytime. No hidden fees.
            </p>
          </div>
        )}

        {/* Pro → Creator upsell */}
        {isPro && (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <Wand2 className="w-4 h-4" />
              Upgrade to Creator
            </div>
            <p className="text-xs text-muted-foreground">
              Build up to 5 custom AI Sentinels with your own personality, expertise, and system prompt.
            </p>
            <button
              onClick={() => createCheckout.mutate({ tier: "creator" })}
              disabled={createCheckout.isPending}
              className="mt-1 w-full flex items-center justify-between px-4 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-sm font-semibold transition-all active:scale-[0.98]"
            >
              <span>Creator — $29/mo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Creator: celebration message */}
        {isCreator && (
          <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300 mb-1">
              <Wand2 className="w-4 h-4" />
              You're on the Creator tier
            </div>
            <p className="text-xs text-muted-foreground">
              Full platform access, custom Sentinels, and every feature Glow has to offer. Thank you for building with us.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
