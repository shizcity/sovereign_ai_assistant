import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { X, Sparkles, MessageSquare, Globe, ArrowRight, CheckCircle2, Zap, Users, Code2 } from "lucide-react";

// ─── Storage helpers ──────────────────────────────────────────────────────────
const FIRST_RUN_KEY = "glow_first_run_done";
const WHATS_NEW_KEY = "glow_whats_new_seen_v2";

export function hasCompletedFirstRun(): boolean {
  try { return localStorage.getItem(FIRST_RUN_KEY) === "true"; } catch { return true; }
}
export function markFirstRunDone(): void {
  try { localStorage.setItem(FIRST_RUN_KEY, "true"); } catch { /* noop */ }
}
export function hasSeenWhatsNew(): boolean {
  try { return localStorage.getItem(WHATS_NEW_KEY) === "true"; } catch { return true; }
}
export function markWhatsNewSeen(): void {
  try { localStorage.setItem(WHATS_NEW_KEY, "true"); } catch { /* noop */ }
}

// ─── Step data ────────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "welcome",
    icon: <Sparkles className="w-8 h-8 text-violet-400" />,
    title: "Welcome to Glow",
    subtitle: "Your sovereign AI assistant — powered by a team of specialized Sentinels.",
    body: "Glow gives you 6 distinct AI personalities that think differently, debate perspectives, and deliver insights no single model can match.",
    cta: "Let's go →",
    skip: false,
  },
  {
    id: "sentinels",
    icon: <Users className="w-8 h-8 text-cyan-400" />,
    title: "Meet your Sentinels",
    subtitle: "Each Sentinel has a unique personality, expertise, and communication style.",
    body: "Pick the right Sentinel for your task — Sage for strategy, Nova for creativity, Bolt for execution, Cipher for security, Lyra for communication, or Nexus for research.",
    cta: "Next →",
    skip: false,
  },
  {
    id: "features",
    icon: <Zap className="w-8 h-8 text-amber-400" />,
    title: "What you can do",
    subtitle: "Beyond chat — build, create, and orchestrate.",
    features: [
      { icon: <MessageSquare className="w-4 h-4 text-violet-400" />, label: "Chat with any Sentinel or start a Round Table debate" },
      { icon: <Code2 className="w-4 h-4 text-cyan-400" />, label: "Run real code in the Playground with E2B sandboxes" },
      { icon: <Globe className="w-4 h-4 text-emerald-400" />, label: "Share agent blueprints on the Marketplace" },
    ],
    cta: "Start chatting",
    skip: false,
  },
];

// ─── FirstRunWizard ───────────────────────────────────────────────────────────
export default function FirstRunWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!hasCompletedFirstRun()) {
      // Small delay so the page renders first
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  function handleCta() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      markFirstRunDone();
      setOpen(false);
      navigate("/chat");
    }
  }

  function handleClose() {
    markFirstRunDone();
    setOpen(false);
  }

  if (!open) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0e1a] shadow-2xl shadow-violet-900/20 overflow-hidden"
        style={{ animation: "scale-in 0.25s ease" }}
      >
        {/* Gradient accent */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="px-6 pt-8 pb-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/8">
              {current.icon}
            </div>
          </div>

          {/* Text */}
          <h2 className="text-xl font-bold text-white text-center mb-1">{current.title}</h2>
          <p className="text-sm text-white/50 text-center mb-4">{current.subtitle}</p>

          {current.body && (
            <p className="text-sm text-white/40 text-center leading-relaxed mb-4">{current.body}</p>
          )}

          {current.features && (
            <ul className="space-y-2.5 mb-4">
              {current.features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 border border-white/5">
                  {f.icon}
                  <span className="text-sm text-white/60">{f.label}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-violet-500" : "w-1.5 bg-white/15"
                }`}
              />
            ))}
          </div>

          {/* CTA */}
          <Button
            onClick={handleCta}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium"
          >
            {current.cta}
            {step < STEPS.length - 1 && <ArrowRight className="w-4 h-4 ml-1.5" />}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── WhatsNewBanner ───────────────────────────────────────────────────────────
const WHATS_NEW_ITEMS = [
  "Blueprint Marketplace — discover & import community agent blueprints",
  "E2B real code execution in the Playground",
  "Multi-Agent Orchestration — chain blueprints into pipelines",
];

export function WhatsNewBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show to returning users who've completed first run
    if (hasCompletedFirstRun() && !hasSeenWhatsNew()) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  function handleDismiss() {
    markWhatsNewSeen();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-40 w-80 rounded-xl border border-violet-500/25 bg-[#0a0e1a]/95 backdrop-blur-sm shadow-xl shadow-violet-900/20 overflow-hidden"
      style={{ animation: "slide-up 0.3s ease" }}
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-white/80">What&apos;s New</span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <ul className="space-y-1.5">
          {WHATS_NEW_ITEMS.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-xs text-white/50 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
