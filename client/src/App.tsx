import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { showAchievementToasts } from "@/hooks/useAchievementToast";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { CommandPalette } from "@/components/CommandPalette";
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
// Critical routes — eager loaded
import Chat from "./pages/Chat";
import Landing from "@/pages/Landing";
// Secondary routes — lazy loaded for bundle splitting
const Settings = lazy(() => import("./pages/Settings"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Templates = lazy(() => import("@/pages/Templates"));
const TemplateGallery = lazy(() => import("@/pages/TemplateGallery"));
const CategoryGallery = lazy(() => import("@/pages/CategoryGallery"));
const Sentinels = lazy(() => import("@/pages/Sentinels"));
const Memories = lazy(() => import("@/pages/Memories"));
const Insights = lazy(() => import("@/pages/Insights"));
const VoiceChat = lazy(() => import("@/pages/VoiceChat"));
const MySentinels = lazy(() => import("@/pages/MySentinels"));
const RoundTable = lazy(() => import("@/pages/RoundTable"));
const Achievements = lazy(() => import("@/pages/Achievements"));
const Referrals = lazy(() => import("@/pages/Referrals"));
const SharedSession = lazy(() => import("@/pages/SharedSession"));
const AgentBuilder = lazy(() => import("@/pages/AgentBuilder"));
const AgentTemplates = lazy(() => import("@/pages/AgentTemplates"));


function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    }>
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
      <Route path="/agent-builder" component={AgentBuilder} />
      <Route path="/agent-templates" component={AgentTemplates} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/session/:shareId" component={SharedSession} />

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
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
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  // Global ⌘K / Ctrl+K shortcut to open command palette
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setCmdPaletteOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

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
          {/* Global ⌘K Command Palette */}
          <CommandPalette open={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
