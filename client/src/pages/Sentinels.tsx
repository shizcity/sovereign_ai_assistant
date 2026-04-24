import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutGrid, Table, Crown, Lock, PartyPopper, BarChart3, Zap, TrendingDown, Clock } from "lucide-react";
import { SentinelComparison } from "@/components/SentinelComparison";
import { SentinelPreviewModal } from "@/components/SentinelPreviewModal";
import { ShareNudgeCard } from "@/components/ShareNudgeCard";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// The 3 Pro-only Sentinel slugs (mirrors server/products.ts FREE_TIER_SENTINEL_SLUGS complement)
const PRO_ONLY_SENTINEL_SLUGS = ["aetheris-flow", "rift-exe", "nyx"];

export default function Sentinels() {
  const { user } = useAuth();
  const isPro = user?.subscriptionTier === "pro" || user?.subscriptionTier === "creator";

  const { data: sentinels, isLoading } = trpc.sentinels.list.useQuery();
  const { data: sentinelStats } = trpc.sentinels.stats.useQuery(undefined, { enabled: !!user });

  // Pro-only Sentinels are shown as locked cards for free users
  // We fetch all 6 for the gallery display (the backend filters for chat use)
  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.info("Redirecting to Stripe checkout…");
      }
    },
    onError: (error) => {
      toast.error(`Failed to start checkout: ${error.message}`);
    },
  });

  const [selectedSentinel, setSelectedSentinel] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "comparison">("grid");
  const [showShareNudge, setShowShareNudge] = useState(false);
  const [previewSentinel, setPreviewSentinel] = useState<{
    id: number; slug: string; name: string; archetype: string; primaryFunction: string;
    symbolEmoji: string; primaryColor: string; personalityTraits: string[]; specialties: string[];
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    document.title = "Meet the Sentinels - Glow";
  }, []);

  // Detect post-upgrade redirect from Stripe and show celebration
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgraded = params.get("upgraded");
    if (upgraded === "pro") {
      // Clean up the URL immediately
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);

      // Small delay so the page renders before the celebration fires
      const timer = setTimeout(() => {
        // Confetti burst
        confetti({
          particleCount: 160,
          spread: 80,
          origin: { y: 0.55 },
          colors: ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ec4899", "#f9a8d4", "#fbbf24"],
        });
        // Second burst for extra flair
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: ["#8b5cf6", "#ec4899", "#fbbf24"],
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: ["#8b5cf6", "#ec4899", "#fbbf24"],
          });
        }, 250);

        // Toast notification
        toast.success("You're now Pro — all 6 Sentinels are unlocked!", {
          duration: 6000,
          icon: <PartyPopper className="w-5 h-5 text-yellow-400" />,
          description: "Choose any Sentinel below and start a conversation.",
          style: {
            background: "linear-gradient(135deg, #1e0a3c, #2d1060)",
            border: "1px solid rgba(139,92,246,0.4)",
            color: "#fff",
          },
        });

        // Show share nudge 3 seconds after celebration — only once per upgrade
        const nudgeKey = "glow_share_nudge_shown";
        if (!localStorage.getItem(nudgeKey)) {
          const nudgeTimer = setTimeout(() => {
            setShowShareNudge(true);
          }, 3000);
          // Store cleanup ref on window to avoid stale closure issues
          (window as unknown as Record<string, unknown>).__glowNudgeTimer = nudgeTimer;
        }
      }, 600);

      return () => {
        clearTimeout(timer);
        const t = (window as unknown as Record<string, unknown>).__glowNudgeTimer;
        if (typeof t === "number") clearTimeout(t);
      };
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // For the gallery we want to show all 6 — free users see 3 unlocked + 3 locked.
  // The backend already filters for chat; here we supplement with locked stubs for the 3 Pro ones.
  const proOnlyStubs = [
    {
      id: -1,
      slug: "aetheris-flow",
      name: "Aetheris.Flow",
      archetype: "The Adaptive Weaver",
      primaryFunction: "Guides you through change, transitions, and fluid thinking with emotional intelligence and creative adaptability.",
      symbolEmoji: "🌊",
      primaryColor: "#06b6d4",
      personalityTraits: ["Adaptive", "Empathetic", "Creative"],
      specialties: ["Change management", "Emotional intelligence", "Creative flow"],
      systemPrompt: "",
    },
    {
      id: -2,
      slug: "rift-exe",
      name: "Rift.EXE",
      archetype: "The Boundary Breaker",
      primaryFunction: "Challenges the status quo, disrupts stagnation, and opens radical new possibilities for those who dare to think differently.",
      symbolEmoji: "⚡",
      primaryColor: "#f59e0b",
      personalityTraits: ["Disruptive", "Bold", "Unconventional"],
      specialties: ["Breaking barriers", "Radical thinking", "Innovation"],
      systemPrompt: "",
    },
    {
      id: -3,
      slug: "nyx",
      name: "Nyx",
      archetype: "The Shadow Guide",
      primaryFunction: "Guides deep introspection, shadow work, and personal transformation through the unknown.",
      symbolEmoji: "🌑",
      primaryColor: "#8b5cf6",
      personalityTraits: ["Introspective", "Mysterious", "Transformative"],
      specialties: ["Shadow work", "Personal transformation", "Deep introspection"],
      systemPrompt: "",
    },
  ];

  // Merge: free users see their 3 + 3 locked stubs; pro users see all 6 from backend
  const displaySentinels = isPro
    ? sentinels ?? []
    : [...(sentinels ?? []), ...proOnlyStubs];

  const selected = (sentinels ?? []).find((s) => s.id === selectedSentinel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Hero Section */}
      <div className="container max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Meet the Sentinels
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Your AI companions, each with a unique personality, expertise, and approach to helping you think, create, and grow.
          </p>
          {!isPro && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
              <Crown className="w-4 h-4" />
              3 of 6 Sentinels included on Free — upgrade to unlock all
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => {
              setViewMode("grid");
              setSelectedSentinel(null);
            }}
            className="gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            Grid View
          </Button>
          <Button
            variant={viewMode === "comparison" ? "default" : "outline"}
            onClick={() => {
              setViewMode("comparison");
              setSelectedSentinel(null);
            }}
            className="gap-2"
          >
            <Table className="w-4 h-4" />
            Comparison Table
          </Button>
        </div>

        {/* Conditional View Rendering */}
        {viewMode === "grid" ? (
          /* Sentinels Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {displaySentinels.map((sentinel) => {
              const isLocked = !isPro && PRO_ONLY_SENTINEL_SLUGS.includes(sentinel.slug);

              return (
                <Card
                  key={sentinel.id}
                  className={`group relative overflow-hidden border-2 transition-all duration-300 ${
                    isLocked
                      ? "border-yellow-500/20 cursor-pointer opacity-70 hover:opacity-90 hover:border-yellow-500/40"
                      : selectedSentinel === sentinel.id
                      ? "border-purple-400 shadow-2xl shadow-purple-500/50 scale-105 cursor-pointer"
                      : "border-slate-700 hover:border-slate-500 hover:shadow-xl cursor-pointer"
                  }`}
                  style={{
                    background: isLocked
                      ? `linear-gradient(135deg, ${sentinel.primaryColor}08 0%, ${sentinel.primaryColor}03 100%)`
                      : `linear-gradient(135deg, ${sentinel.primaryColor}15 0%, ${sentinel.primaryColor}05 100%)`,
                  }}
                  onClick={() => {
                    if (isLocked) {
                      setPreviewSentinel(sentinel as any);
                      setPreviewOpen(true);
                    } else {
                      setSelectedSentinel(selectedSentinel === sentinel.id ? null : sentinel.id);
                    }
                  }}
                >
                  {/* Pro lock overlay */}
                  {isLocked && (
                    <>
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-semibold shadow-lg">
                        <Lock className="w-3 h-3" />
                        Pro
                      </div>
                      {/* Hover reveal hint */}
                      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-[inherit]" style={{ background: `linear-gradient(135deg, ${sentinel.primaryColor}22, ${sentinel.primaryColor}10)` }}>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white text-sm font-medium shadow-xl">
                          <Crown className="w-4 h-4 text-yellow-400" />
                          Click to preview
                        </div>
                      </div>
                    </>
                  )}

                  <div className={`p-6 ${isLocked ? "filter grayscale-[30%]" : ""}`}>
                    {/* Icon and Name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="text-4xl flex items-center justify-center w-16 h-16 rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${sentinel.primaryColor}40, ${sentinel.primaryColor}20)`,
                        }}
                      >
                        {sentinel.symbolEmoji}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{sentinel.name}</h3>
                        <p className="text-sm text-slate-400">{sentinel.archetype}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-300 mb-4 leading-relaxed">{sentinel.primaryFunction}</p>

                    {/* Personality Traits */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {sentinel.personalityTraits.map((trait: string, idx: number) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs bg-white/10 text-white border-white/20 hover:bg-white/15"
                        >
                          {trait}
                        </Badge>
                      ))}
                    </div>

                    {/* Specialties */}
                    <div className="text-sm text-slate-400">
                      <span className="font-semibold">Best for:</span>{" "}
                      {sentinel.specialties.join(", ")}
                    </div>

                    {/* Unlock CTA for locked Sentinels */}
                    {isLocked && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewSentinel(sentinel as any);
                            setPreviewOpen(true);
                          }}
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Preview &amp; Unlock
                        </Button>
                      </div>
                    )}

                    {/* Hover Effect */}
                    {!isLocked && (
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at center, ${sentinel.primaryColor}, transparent)`,
                        }}
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Comparison Table */
          <div className="mb-16">
            {sentinels && (
              <SentinelComparison
                sentinels={sentinels}
                isPro={isPro || user?.subscriptionTier === "creator"}
                proOnlySlugs={PRO_ONLY_SENTINEL_SLUGS}
                onUpgrade={() => createCheckout.mutate({ tier: "pro" })}
              />
            )}
          </div>
        )}

        {/* Selected Sentinel Detail View */}
        {viewMode === "grid" && selected && (
          <div className="mt-12 animate-in fade-in duration-500">
            <Card
              className="border-2 p-8 md:p-12"
              style={{
                borderColor: selected.primaryColor,
                background: `linear-gradient(135deg, ${selected.primaryColor}10 0%, ${selected.primaryColor}02 100%)`,
              }}
            >
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Icon and Core Info */}
                <div className="flex-shrink-0 text-center md:text-left">
                  <div
                    className="inline-flex items-center justify-center w-32 h-32 rounded-full text-6xl mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${selected.primaryColor}60, ${selected.primaryColor}30)`,
                    }}
                  >
                    {selected.symbolEmoji}
                  </div>
                  <h2 className="text-3xl font-bold mb-2">{selected.name}</h2>
                  <p className="text-lg text-slate-400 mb-4">{selected.archetype}</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {selected.personalityTraits.map((trait: string, idx: number) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-white/10 text-white border-white/20 hover:bg-white/15"
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Right: Detailed Info */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: selected.primaryColor }}>
                      About {selected.name}
                    </h3>
                    <p className="text-slate-300 leading-relaxed">{selected.primaryFunction}</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: selected.primaryColor }}>
                      Specialties
                    </h3>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {selected.specialties.map((specialty: string, idx: number) => (
                        <li key={idx}>{specialty}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: selected.primaryColor }}>
                      Communication Style
                    </h3>
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                      <p className="text-slate-300 italic leading-relaxed">
                        {selected.systemPrompt.split("\n\n")[0]}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: selected.primaryColor }}>
                      When to Choose {selected.name}
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                      {selected.name === "Vixen's Den" &&
                        "Choose Vixen when you need practical, grounded advice. She excels at breaking down complex problems into manageable steps, creating sustainable systems, and helping you build solid foundations for long-term success."}
                      {selected.name === "Mischief.EXE" &&
                        "Choose Mischief when you're stuck in conventional thinking and need creative disruption. She thrives on challenging assumptions, exploring unconventional solutions, and turning chaos into innovation."}
                      {selected.name === "Lunaris.Vault" &&
                        "Choose Lunaris when you need deep analysis, strategic planning, or knowledge synthesis. She excels at connecting disparate ideas, uncovering hidden patterns, and providing comprehensive insights."}
                      {selected.name === "Aetheris.Flow" &&
                        "Choose Aetheris when you need to navigate change, adapt to new circumstances, or find creative solutions. She specializes in fluid thinking, emotional intelligence, and helping you flow through transitions."}
                      {selected.name === "Rift.EXE" &&
                        "Choose Rift when you need to break through barriers, challenge the status quo, or explore radical alternatives. He excels at disrupting stagnation and opening new possibilities."}
                      {selected.name === "Nyx" &&
                        "Choose Nyx when you need introspection, shadow work, or deep personal transformation. She guides you through the unknown, helping you integrate hidden aspects of yourself and emerge stronger."}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Track Record — Sentinel Performance Leaderboard */}
        {sentinelStats && sentinelStats.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Track Record</h2>
                <p className="text-sm text-slate-400">Your Sentinels' performance across all Round Table sessions</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/3 backdrop-blur">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Sentinel</th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1"><Zap className="w-3 h-3" />Rounds</span>
                    </th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1"><BarChart3 className="w-3 h-3" />Avg Confidence</span>
                    </th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1"><Clock className="w-3 h-3" />Avg Latency</span>
                    </th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1"><TrendingDown className="w-3 h-3" />Dissent Rate</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...sentinelStats]
                    .sort((a, b) => b.avgConfidence - a.avgConfidence)
                    .map((stat, i) => {
                      const sentinel = sentinels?.find(s => s.name === stat.sentinelName);
                      const color = sentinel?.primaryColor ?? "#8b5cf6";
                      return (
                        <tr
                          key={stat.sentinelName}
                          className={`border-b border-white/5 transition-colors hover:bg-white/4 ${
                            i === 0 ? "bg-gradient-to-r from-yellow-500/5 to-transparent" : ""
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {i === 0 && (
                                <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-2 py-0.5">TOP</span>
                              )}
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
                                style={{ background: `${color}25`, border: `1px solid ${color}40` }}
                              >
                                {stat.sentinelEmoji}
                              </div>
                              <span className="font-semibold text-white/85">{stat.sentinelName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-white/60 font-mono">{stat.totalRounds}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-semibold font-mono ${
                                stat.avgConfidence >= 80 ? "text-emerald-400" :
                                stat.avgConfidence >= 60 ? "text-cyan-400" :
                                "text-amber-400"
                              }`}>{stat.avgConfidence}%</span>
                              <div className="w-16 h-1 rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${stat.avgConfidence}%`,
                                    background: stat.avgConfidence >= 80 ? "#34d399" : stat.avgConfidence >= 60 ? "#22d3ee" : "#fbbf24",
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-white/50 font-mono text-xs">
                              {stat.avgLatencyMs >= 1000
                                ? `${(stat.avgLatencyMs / 1000).toFixed(1)}s`
                                : stat.avgLatencyMs > 0 ? `${stat.avgLatencyMs}ms` : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-mono text-xs ${
                              stat.dissentRate >= 40 ? "text-red-400" :
                              stat.dissentRate >= 20 ? "text-amber-400" :
                              "text-white/40"
                            }`}>
                              {stat.dissentRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-white/25 mt-3 text-center">Sorted by average confidence · Only Sentinels used in Round Table sessions appear here</p>
          </div>
        )}

        {/* Getting Started Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Begin?</h2>
          <p className="text-lg text-slate-300 mb-8">
            Start a new conversation and select a Sentinel to guide your journey.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
          >
            Start Chatting
          </a>
        </div>
      </div>

      {/* Sentinel Preview Modal for locked Pro Sentinels */}
      <SentinelPreviewModal
        sentinel={previewSentinel}
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewSentinel(null);
        }}
        isPro={isPro || user?.subscriptionTier === "creator"}
        onUpgrade={() => createCheckout.mutate({ tier: "pro" })}
      />

      {/* Share nudge card — appears 3s after post-upgrade confetti */}
      {showShareNudge && (
        <ShareNudgeCard
          onDismiss={() => {
            setShowShareNudge(false);
            localStorage.setItem("glow_share_nudge_shown", "1");
          }}
        />
      )}
    </div>
  );
}
