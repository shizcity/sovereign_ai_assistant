import { useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

/**
 * Detects `?upgraded=<tier>` in the URL after a Stripe checkout redirect
 * and fires a tier-appropriate welcome toast. Cleans the param from the URL
 * so the toast only fires once per navigation.
 */
export function useUpgradeToast() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const url = new URL(window.location.href);
    const upgraded = url.searchParams.get("upgraded");
    if (!upgraded) return;

    // Remove the param so the toast doesn't re-fire on refresh
    url.searchParams.delete("upgraded");
    const cleanPath = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "");
    window.history.replaceState(null, "", cleanPath);

    const tier = upgraded.toLowerCase();

    if (tier === "creator") {
      toast.success("Welcome to Creator! 🎉", {
        description: "All 6 Sentinels are unlocked and you can now build up to 5 custom AI Sentinels.",
        duration: 6000,
      });
    } else if (tier === "pro") {
      toast.success("Welcome to Pro! 🎉", {
        description: "Unlimited messages, all 6 Sentinels, and voice features are now unlocked.",
        duration: 6000,
      });
    } else {
      // Generic fallback
      toast.success("Upgrade successful! 🎉", {
        description: "Your new features are ready to use.",
        duration: 5000,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
