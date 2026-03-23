import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles, MessageSquare, Mic, Brain } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OnboardingStep = "pick_sentinel" | "send_message" | "try_voice" | "explore_memory";

export interface OnboardingStepState {
  pick_sentinel: boolean;
  send_message: boolean;
  try_voice: boolean;
  explore_memory: boolean;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = "glow_onboarding_steps";
const DISMISSED_KEY = "glow_onboarding_dismissed";

export function loadOnboardingSteps(): OnboardingStepState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { pick_sentinel: false, send_message: false, try_voice: false, explore_memory: false };
    return JSON.parse(raw) as OnboardingStepState;
  } catch {
    return { pick_sentinel: false, send_message: false, try_voice: false, explore_memory: false };
  }
}

export function saveOnboardingStep(step: OnboardingStep): void {
  const current = loadOnboardingSteps();
  current[step] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function isOnboardingDismissed(): boolean {
  return localStorage.getItem(DISMISSED_KEY) === "1";
}

export function dismissOnboarding(): void {
  localStorage.setItem(DISMISSED_KEY, "1");
}

export function isOnboardingComplete(steps: OnboardingStepState): boolean {
  return steps.pick_sentinel && steps.send_message && steps.try_voice && steps.explore_memory;
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS: {
  key: OnboardingStep;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    key: "pick_sentinel",
    label: "Pick a Sentinel",
    description: "Choose your AI companion for this conversation",
    icon: <Sparkles className="w-3.5 h-3.5" />,
    color: "#8b5cf6",
  },
  {
    key: "send_message",
    label: "Send your first message",
    description: "Start a conversation with your Sentinel",
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    color: "#06b6d4",
  },
  {
    key: "try_voice",
    label: "Try voice mode",
    description: "Speak to your Sentinel hands-free",
    icon: <Mic className="w-3.5 h-3.5" />,
    color: "#ec4899",
  },
  {
    key: "explore_memory",
    label: "Explore memory",
    description: "See what your Sentinels remember about you",
    icon: <Brain className="w-3.5 h-3.5" />,
    color: "#f59e0b",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface OnboardingChecklistProps {
  steps: OnboardingStepState;
  onDismiss: () => void;
}

export function OnboardingChecklist({ steps, onDismiss }: OnboardingChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);

  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalCount = STEPS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  // Auto-collapse when all steps complete, then auto-dismiss after a short delay
  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => {
        onDismiss();
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [allDone, onDismiss]);

  return (
    <div
      className="mx-3 my-2 rounded-xl overflow-hidden flex-shrink-0 animate-in slide-in-from-top-2 fade-in duration-400"
      style={{
        background: "linear-gradient(135deg, rgba(20,8,50,0.95) 0%, rgba(30,12,70,0.95) 100%)",
        border: "1px solid rgba(139,92,246,0.25)",
        boxShadow: "0 4px 16px rgba(139,92,246,0.12)",
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        {/* Progress ring / icon */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{
            background: allDone
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
            boxShadow: allDone
              ? "0 2px 8px rgba(16,185,129,0.4)"
              : "0 2px 8px rgba(139,92,246,0.4)",
          }}
        >
          {allDone ? (
            <CheckCircle2 className="w-4 h-4 text-white" />
          ) : (
            <span className="text-white">{completedCount}/{totalCount}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold leading-none">
            {allDone ? "You're all set! 🎉" : "Getting Started"}
          </p>
          {!allDone && (
            <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #8b5cf6, #06b6d4)",
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((c) => !c);
            }}
            className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="w-5 h-5 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
            aria-label="Dismiss onboarding checklist"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Steps list */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-1.5">
          {STEPS.map((step) => {
            const done = steps[step.key];
            return (
              <div
                key={step.key}
                className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors"
                style={{
                  background: done ? "rgba(255,255,255,0.04)" : "transparent",
                }}
              >
                {/* Check icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {done ? (
                    <CheckCircle2
                      className="w-4 h-4"
                      style={{ color: step.color }}
                    />
                  ) : (
                    <Circle className="w-4 h-4 text-white/20" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium leading-none ${
                      done ? "line-through text-white/35" : "text-white/80"
                    }`}
                  >
                    {step.label}
                  </p>
                  {!done && (
                    <p className="text-[10px] text-white/30 mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Step icon badge */}
                <div
                  className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5"
                  style={{
                    background: done
                      ? "rgba(255,255,255,0.05)"
                      : `${step.color}22`,
                    color: done ? "rgba(255,255,255,0.2)" : step.color,
                  }}
                >
                  {step.icon}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
