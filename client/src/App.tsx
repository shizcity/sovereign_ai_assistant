import { Toaster } from "@/components/ui/sonner";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { UsageWarningBanner } from "@/components/UsageWarningBanner";
import { UsageWarningModal } from "@/components/UsageWarningModal";
import { LimitReachedOverlay } from "@/components/LimitReachedOverlay";
import { OnboardingModal } from "@/components/OnboardingModal";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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


function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Chat} />
      <Route path="/settings" component={Settings} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/templates" component={Templates} />
      <Route path="/template-gallery" component={TemplateGallery} />
      <Route path="/category-gallery" component={CategoryGallery} />
      <Route path="/sentinels" component={Sentinels} />
      <Route path="/memories" component={Memories} />
      <Route path="/insights" component={Insights} />
      <Route path="/voice" component={VoiceChat} />

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

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          {/* Usage Warning Components - Global Level */}
          <UsageWarningBanner />
          <UsageWarningModal />
          <LimitReachedOverlay />
          {/* Onboarding Modal */}
          <OnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
