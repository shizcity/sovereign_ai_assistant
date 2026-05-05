import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";
import { ArrowRight, Check, Brain, Table2, BookMarked, X } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const STEP_META = [
  {
    icon: Brain,
    color: "from-indigo-600 to-cyan-500",
    label: "Choose Your Sentinel",
    subtitle: "Every practice begins with a guide.",
  },
  {
    icon: Table2,
    color: "from-violet-600 to-indigo-500",
    label: "Convene the Round Table",
    subtitle: "Bring multiple perspectives to a single question.",
  },
  {
    icon: BookMarked,
    color: "from-cyan-600 to-teal-500",
    label: "Anchor Your First Memory",
    subtitle: "What you record, you own.",
  },
];

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [selectedSentinelId, setSelectedSentinelId] = useState<number | null>(null);
  const [memoryContent, setMemoryContent] = useState("");
  const [memorySaved, setMemorySaved] = useState(false);
  const [, navigate] = useLocation();

  const { data: sentinels } = trpc.sentinels.list.useQuery();
  const completeOnboarding = trpc.auth.completeOnboarding.useMutation();
  const updateStep = trpc.auth.updateOnboardingStep.useMutation();
  const saveMemory = trpc.sentinels.memories.create.useMutation();

  // Persist step progress
  useEffect(() => {
    if (step > 0) updateStep.mutate({ step });
  }, [step]);

  const handleComplete = async () => {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.55 } });
    await completeOnboarding.mutateAsync();
    onComplete();
  };

  const handleSkip = async () => {
    await completeOnboarding.mutateAsync();
    onComplete();
  };

  const handleSaveMemory = async () => {
    if (!memoryContent.trim() || !selectedSentinelId) return;
    const firstSentinelId = selectedSentinelId ?? sentinels?.[0]?.id;
    if (!firstSentinelId) return;
    await saveMemory.mutateAsync({
      sentinelId: firstSentinelId,
      category: "insight",
      content: memoryContent.trim(),
      context: "First memory — saved during onboarding.",
      importance: 70,
    });
    setMemorySaved(true);
  };

  const selectedSentinel = sentinels?.find(s => s.id === selectedSentinelId);

  const renderStep = () => {
    switch (step) {
      // ─── Step 0: Welcome ──────────────────────────────────────────────────────
      case 0:
        return (
          <div className="text-center space-y-8 py-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/30">
              <span className="text-4xl">✦</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">Begin Your Practice</h2>
              <p className="text-white/55 max-w-sm mx-auto leading-relaxed">
                Glow is a thinking environment. Three steps will orient you — then the work is yours.
              </p>
            </div>
            <div className="flex flex-col gap-3 max-w-xs mx-auto text-left">
              {STEP_META.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}>
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">{s.label}</p>
                    <p className="text-xs text-white/40">{s.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setStep(1)}
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white border-0 px-8"
            >
              Enter <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      // ─── Step 1: Pick a Sentinel ──────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Choose Your Sentinel</h2>
              <p className="text-white/50 text-sm">
                Each Sentinel thinks differently. Pick the one that matches your current focus.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {(sentinels ?? []).slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSentinelId(s.id)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    selectedSentinelId === s.id
                      ? "border-cyan-500/60 bg-cyan-500/10 ring-1 ring-cyan-500/40"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: s.primaryColor + "33", border: `1px solid ${s.primaryColor}55` }}
                    >
                      {s.symbolEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-white">{s.name}</p>
                        {selectedSentinelId === s.id && (
                          <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-white/45 mt-0.5 line-clamp-2">{s.archetype}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2">
              <button onClick={() => setStep(0)} className="text-xs text-white/30 hover:text-white/60 transition-colors">← Back</button>
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedSentinelId}
                className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white border-0"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      // ─── Step 2: Round Table ──────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Convene the Round Table</h2>
              <p className="text-white/50 text-sm max-w-sm mx-auto">
                Bring 2–4 Sentinels to deliberate on a question. Each argues from their own frame.
                You get a consensus — and the contradictions.
              </p>
            </div>
            <div className="rounded-2xl border border-violet-500/20 bg-violet-950/30 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center">
                  <Table2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Your free trial session is waiting</p>
                  <p className="text-xs text-white/45">One complimentary Round Table — no subscription required</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-white/60">
                {[
                  "Multiple Sentinels reason in parallel",
                  "Contradictions are surfaced explicitly",
                  "Final answer delivered by the best-fit Sentinel",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between items-center">
              <button onClick={() => setStep(1)} className="text-xs text-white/30 hover:text-white/60 transition-colors">← Back</button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="border-white/15 text-white/60 hover:text-white hover:border-white/30 bg-transparent"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={() => {
                    setStep(3);
                    setTimeout(() => navigate("/round-table"), 200);
                  }}
                  className="bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white border-0"
                >
                  Open Round Table <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        );

      // ─── Step 3: Save First Memory ────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Anchor Your First Memory</h2>
              <p className="text-white/50 text-sm max-w-sm mx-auto">
                Memories persist across conversations. Write something worth keeping — an insight,
                a decision, a pattern you've noticed.
              </p>
            </div>
            {selectedSentinel && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="text-base">{selectedSentinel.symbolEmoji}</span>
                <span>Saved to <span className="text-white/70">{selectedSentinel.name}</span>'s memory layer</span>
              </div>
            )}
            <Textarea
              placeholder="e.g., I work best when I break large problems into three sub-questions before asking for help."
              value={memoryContent}
              onChange={(e) => setMemoryContent(e.target.value)}
              rows={4}
              className="bg-white/5 border-white/15 text-white placeholder:text-white/25 resize-none focus:border-cyan-500/50"
            />
            {memorySaved && (
              <div className="flex items-center gap-2 text-sm text-cyan-400">
                <Check className="w-4 h-4" />
                Memory anchored. It will surface in future conversations.
              </div>
            )}
            <div className="flex justify-between items-center">
              <button onClick={() => setStep(2)} className="text-xs text-white/30 hover:text-white/60 transition-colors">← Back</button>
              <div className="flex gap-2">
                {!memorySaved ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleComplete}
                      className="border-white/15 text-white/60 hover:text-white hover:border-white/30 bg-transparent"
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={handleSaveMemory}
                      disabled={!memoryContent.trim() || saveMemory.isPending}
                      className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white border-0"
                    >
                      {saveMemory.isPending ? "Saving…" : "Save & Finish"}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleComplete}
                    className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white border-0"
                  >
                    Enter Glow <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg bg-[#0d0f1a] border border-white/10 text-white shadow-2xl shadow-indigo-950/50 p-6">
        {/* Header: progress dots + skip */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-6 bg-gradient-to-r from-indigo-500 to-cyan-400"
                    : i < step
                    ? "w-1.5 bg-indigo-500/60"
                    : "w-1.5 bg-white/15"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-white/25 hover:text-white/60 transition-colors p-1"
            aria-label="Skip onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step content */}
        <div className="min-h-[340px]">{renderStep()}</div>
      </DialogContent>
    </Dialog>
  );
}
