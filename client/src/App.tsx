import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { showAchievementToasts } from "@/hooks/useAchievementToast";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { UsageWarningBanner } from "@/components/UsageWarningBanner";
import { UsageWarningModal } from "@/components/UsageWarningModal";
import { LimitReachedOverlay } from "@/components/LimitReachedOverlay";
import { OnboardingModal } from "@/components/OnboardingModal";
import { WhatsNewModal, shouldShowWhatsNew } from "@/components/WhatsNewModal";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import Templates from "@/pages/Templates";
import TemplateGallery from "@/pages/TemplateGallery";
import CategoryGallery from "@/pages/CategoryGallery";
import Sentinels from "@/pages/Sentinels";
import Memories from "@/pages/Memories";
import Insights from "@/pages/Insights";
import VoiceChat from "@/pages/VoiceChat";
import Landing from "@/pages/Landing";
import MySentinels from "@/pages/MySentinels";
import RoundTable from "@/pages/RoundTable";
import Achievements from "@/pages/Achievements";
import Referrals from "@/pages/Referrals";


function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Landing} />
      <Route path={"/chat"} component={Chat} />
      <Route path="/settings" component={Settings} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/templates" component={Templates} />
      <Route path="/template-gallery" component={TemplateGallery} />
      <Route path="/category-gallery" component={CategoryGallery} />
      <Route path="/sentinels" component={Sentinels} />
      <Route path="/memories" component={Memories} />
      <Route path="/insights" component={Insights} />
      <Route path="/voice" component={VoiceChat} />
      <Route path="/my-sentinels" component={MySentinels} />
      <Route path="/round-table" component={RoundTable} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/referrals" component={Referrals} />

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const { data: user } = trpc.auth.me.useQuery();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [location] = useLocation();

  // Referral claim logic — store ?ref= code on landing, claim once user is authenticated
  const claimReferral = trpc.referral.claim.useMutation();
  useEffect(() => {
    // Capture ?ref= from URL and persist to localStorage
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode) {
      localStorage.setItem("pendingReferralCode", refCode.toUpperCase());
    }
  }, []);
  useEffect(() => {
    // Once the user is logged in, claim any pending referral code
    if (!user) return;
    const code = localStorage.getItem("pendingReferralCode");
    if (!code) return;
    localStorage.removeItem("pendingReferralCode");
    claimReferral.mutate({ code }, {
      onSuccess: (result) => {
        if (result.success && 'refereeXp' in result) {
          toast.success(`🎁 Welcome bonus! +${result.refereeXp} XP added to your account.`);
        }
        // Show achievement toasts for the referee (if they unlocked any)
        if ('newAchievements' in result && result.newAchievements?.length) {
          showAchievementToasts(result.newAchievements);
        }
      },
    });
  }, [user]);

  useEffect(() => {
    // Only show onboarding on authenticated routes (not landing page)
    if (user && !user.onboardingCompleted && location !== "/") {
      setShowOnboarding(true);
    }
  }, [user, location]);

  useEffect(() => {
    // Show What's New modal once per version, only for logged-in users on non-landing routes
    if (user && user.onboardingCompleted && location !== "/" && shouldShowWhatsNew()) {
      // Small delay so the page renders first before the modal pops
      const timer = setTimeout(() => setShowWhatsNew(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user, location]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          {/* Usage Warning Components - Global Level */}
          <UsageWarningBanner />
          <UsageWarningModal />
          <LimitReachedOverlay />
          {/* Onboarding Modal */}
          <OnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} />
          {/* What's New Modal */}
          <WhatsNewModal open={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
