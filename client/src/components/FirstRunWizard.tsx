import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Bot,
  MessageSquare,
  ArrowRight,
  X,
  Zap,
  Globe,
  Code2,
  Star,
} from "lucide-react";

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
const FIRST_RUN_KEY = "glow_first_run_done";
const WHATS_NEW_KEY = "glow_whats_new_seen_v2";

export function hasCompletedFirstRun(): boolean {
  try {
    return localStorage.getItem(FIRST_RUN_KEY) === "true";
  } catch {
    return false;
  }
}

export function markFirstRunDone(): void {
  try {
    localStorage.setItem(FIRST_RUN_KEY, "true");
  } catch {}
}

export function hasSeenWhatsNew(): boolean {
  try {
    return localStorage.getItem(WHATS_NEW_KEY) === "true";
  } catch {
    return false;
  }
}

export function markWhatsNewSeen(): void {
  try {
    localStorage.setItem(WHATS_NEW_KEY, "true");
  } catch {}
}

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "welcome",
    icon: <Sparkles className="w-10 h-10 text-violet-400" />,
    title: "Welcome to Glow",
    subtitle: "Your AI, Your Rules",
    body: "Glow lets you command a team of specialized AI Sentinels — each one customized to your workflow, voice, and goals. Let's get you started in 60 seconds.",
    cta: "Get started",
    accent: "from-violet-500/20 to-fuchsia-500/20",
  },
  {
    id: "sentinels",
    icon: <Bot className="w-10 h-10 text-fuchsia-400" />,
    title: "Meet your Sentinels",
    subtitle: "Specialized AI agents, built for you",
    body: "Each Sentinel has a unique personality, memory, and skill set. Pick one from the gallery or build your own in the Agent Builder — no code required.",
    cta: "Browse Sentinels",
    accent: "from-fuchsia-500/20 to-pink-500/20",
  },
  {
    id: "chat",
    icon: <MessageSquare className="w-10 h-10 text-sky-400" />,
    title: "Start your first conversation",
    subtitle: "Voice, text, or code — your choice",
    body: "Chat with any Sentinel using text or voice. They remember your preferences, learn from every session, and can even run real code in a secure sandbox.",
    cta: "Start chatting",
    accent: "from-sky-500/20 to-cyan-500/20",
  },
];

// ─── FirstRunWizard ───────────────────────────────────────────────────────────
interface FirstRunWizardProps {
  onClose: () => void;
}

export function FirstRunWizard({ onClose }: FirstRunWizardProps) {
  const [step, setStep] = useState(0);
  const [, navigate] = useLocation();

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function handleCta() {
    if (step === 1) {
      // Browse Sentinels
      onClose();
      navigate("/sentinels");
    } else if (isLast) {
      // Start chatting
      onClose();
      navigate("/chat");
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-white/10 bg-[#0f0f14]">
        {/* Progress dots */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-6 bg-violet-400"
                    : i < step
                    ? "w-3 bg-violet-400/60"
                    : "w-3 bg-white/10"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className={`mx-6 mt-5 mb-2 rounded-xl bg-gradient-to-br ${current.accent} p-6 flex flex-col items-center text-center`}>
          <div className="mb-4 p-3 rounded-2xl bg-white/5 backdrop-blur-sm">
            {current.icon}
          </div>
          <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-1">
            {current.subtitle}
          </p>
          <h2 className="text-xl font-bold text-white mb-3">{current.title}</h2>
          <p className="text-sm text-white/60 leading-relaxed">{current.body}</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-3 flex flex-col gap-2">
          <Button
            onClick={handleCta}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold"
          >
            {current.cta}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
          {!isLast && (
            <button
              onClick={onClose}
              className="text-xs text-white/30 hover:text-white/50 transition-colors py-1"
            >
              Skip for now
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── WhatsNewBanner ───────────────────────────────────────────────────────────
const WHATS_NEW_ITEMS = [
  { icon: <Globe className="w-3.5 h-3.5" />, label: "Blueprint Marketplace", color: "text-emerald-400" },
  { icon: <Code2 className="w-3.5 h-3.5" />, label: "Real code execution (E2B)", color: "text-sky-400" },
  { icon: <Star className="w-3.5 h-3.5" />, label: "Template ratings & saves", color: "text-amber-400" },
  { icon: <Zap className="w-3.5 h-3.5" />, label: "Agent progress tracking", color: "text-violet-400" },
];

interface WhatsNewBannerProps {
  onDismiss: () => void;
}

export function WhatsNewBanner({ onDismiss }: WhatsNewBannerProps) {
  return (
    <div className="mx-4 mb-3 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="text-xs font-semibold text-white/80">What's new in Glow</span>
            <Badge className="text-[10px] px-1.5 py-0 bg-violet-500/20 text-violet-300 border-violet-500/30">
              New
            </Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {WHATS_NEW_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={item.color}>{item.icon}</span>
                <span className="text-[11px] text-white/50">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/20 hover:text-white/50 transition-colors shrink-0 mt-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
