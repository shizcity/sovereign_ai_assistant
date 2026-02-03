import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Crown, Loader2, Sparkles, Settings } from "lucide-react";
import { toast } from "sonner";

export function SubscriptionCard() {
  const { data: subscriptionStatus, isLoading: statusLoading } = trpc.subscription.getStatus.useQuery();
  const { data: usage, isLoading: usageLoading } = trpc.subscription.getUsage.useQuery();
  
  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      // Open Stripe checkout in new tab
      if (data.url) {
        window.open(data.url, '_blank');
        toast.info("Redirecting to Stripe checkout...");
      }
    },
    onError: (error) => {
      toast.error(`Failed to create checkout: ${error.message}`);
    },
  });

  const createPortalSession = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      // Open Stripe Customer Portal in new tab
      if (data.url) {
        window.open(data.url, '_blank');
        toast.info("Opening subscription management...");
      }
    },
    onError: (error) => {
      toast.error(`Failed to open portal: ${error.message}`);
    },
  });

  if (statusLoading || usageLoading) {
    return (
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Loading subscription information...</CardDescription>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isFree = subscriptionStatus?.tier === 'free';
  const usagePercent = usage ? (usage.used / usage.limit) * 100 : 0;
  const daysUntilReset = usage?.daysUntilReset || 0;

  return (
    <Card className={`bg-card text-card-foreground border-border ${!isFree ? 'border-yellow-500/50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isFree ? (
                <>
                  <Sparkles className="h-5 w-5" />
                  Free Tier
                </>
              ) : (
                <>
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Pro Tier
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isFree
                ? "50 messages per month included"
                : "Unlimited messages and all features"}
            </CardDescription>
          </div>
          {isFree ? (
            <Button
              onClick={() => createCheckout.mutate()}
              disabled={createCheckout.isPending}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              {createCheckout.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => createPortalSession.mutate()}
              disabled={createPortalSession.isPending}
              variant="outline"
            >
              {createPortalSession.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Subscription
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFree && usage && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Messages Used</span>
                <span className="font-medium">
                  {usage.used} / {usage.limit}
                </span>
              </div>
              <Progress value={usagePercent} className="h-2" />
              {usagePercent >= 80 && (
                <p className="text-sm text-orange-500">
                  ⚠️ You're running low on messages. Upgrade to Pro for unlimited conversations!
                </p>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Resets in {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}
            </div>
          </>
        )}

        {!isFree && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Crown className="h-4 w-4" />
              <span>You have unlimited access to all features</span>
            </div>
            
            <div className="space-y-1 text-sm">
              {subscriptionStatus?.status && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">
                    {subscriptionStatus.status === 'active' && '✓ Active'}
                    {subscriptionStatus.status === 'trialing' && '🎁 Trial'}
                    {subscriptionStatus.status === 'past_due' && '⚠️ Past Due'}
                    {subscriptionStatus.status === 'canceled' && '❌ Canceled'}
                    {subscriptionStatus.status === 'unpaid' && '❌ Unpaid'}
                  </span>
                </div>
              )}
              
              {subscriptionStatus?.currentPeriodEnd && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {subscriptionStatus.status === 'canceled' ? 'Access until:' : 'Next billing:'}
                  </span>
                  <span className="font-medium">
                    {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {subscriptionStatus?.status === 'canceled' && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <p className="text-sm text-orange-600">
                  Your subscription has been canceled. You'll retain Pro access until {new Date(subscriptionStatus.currentPeriodEnd!).toLocaleDateString()}.
                </p>
              </div>
            )}

            {subscriptionStatus?.status === 'past_due' && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-600">
                  Your payment is past due. Please update your payment method to continue your Pro subscription.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <h4 className="font-medium mb-2">Pro Features</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ Unlimited messages</li>
            <li>✓ Access to all 6 Sentinels</li>
            <li>✓ Multi-Sentinel conversations</li>
            <li>✓ Unlimited memory storage</li>
            <li>✓ Voice-first mode</li>
            <li>✓ Priority support</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
