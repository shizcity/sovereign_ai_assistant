import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutGrid, Table, Crown, Lock, PartyPopper, BarChart3, Zap, TrendingDown, Clock, CheckCircle2, MessageSquare, Users } from "lucide-react";
import { SentinelComparison } from "@/components/SentinelComparison";
import { SentinelPreviewModal } from "@/components/SentinelPreviewModal";
import { ShareNudgeCard } from "@/components/ShareNudgeCard";
import { SentinelRelationshipCard } from "@/components/SentinelRelationshipCard";
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
  const { data: allRelationships } = trpc.sentinels.getAllRelationships.useQuery(undefined, { enabled: !!user });

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
  const [ctaVisible, setCtaVisible] = useState(false);
  const [gettingStartedVisible, setGettingStartedVisible] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const gettingStartedRef = useRef<HTMLDivElement>(null);
  const [previewSentinel, setPreviewSentinel] = useState<{
    id: number; slug: string; name: string; archetype: string; primaryFunction: string;
    symbolEmoji: string; primaryColor: string; personalityTraits: string[]; specialties: string[];
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    document.title = "Meet the Sentinels - Glow";
  }, []);

  // Scroll-triggered entrance animations
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const observe = (ref: React.RefObject<HTMLDivElement | null>, setter: (v: boolean) => void) => {
      if (!ref.current) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setter(true); obs.disconnect(); } },
        { threshold: 0.15 }
      );
      obs.observe(ref.current);
      observers.push(obs);
    };
    observe(ctaRef, setCtaVisible);
    observe(gettingStartedRef, setGettingStartedVisible);
    return () => observers.forEach(o => o.disconnect());
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
                  className={`group relative overflow-hidden border transition-all duration-300 card-interactive ${
                    isLocked
                      ? "border-yellow-500/20 cursor-pointer opacity-75 hover:opacity-95 hover:border-yellow-500/40"
                      : selectedSentinel === sentinel.id
                      ? "border-purple-400/70 shadow-2xl shadow-purple-500/40 scale-[1.02] cursor-pointer"
                      : "border-white/10 hover:border-white/25 cursor-pointer"
                  }`}
                  style={{
                    background: isLocked
                      ? `linear-gradient(135deg, ${sentinel.primaryColor}08 0%, rgba(15,15,25,0.95) 100%)`
                      : `linear-gradient(135deg, ${sentinel.primaryColor}18 0%, rgba(15,15,25,0.95) 100%)`,
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
                        className="text-4xl flex items-center justify-center w-16 h-16 rounded-full ring-2 ring-offset-2 ring-offset-transparent transition-all duration-300 group-hover:ring-4"
                        style={{
                          background: `linear-gradient(135deg, ${sentinel.primaryColor}40, ${sentinel.primaryColor}20)`,
                          boxShadow: `0 0 0 2px ${sentinel.primaryColor}35, 0 0 16px ${sentinel.primaryColor}15`,
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

                    {/* Track Record badge — only shown if sentinel has RT history */}
                    {(() => {
                      const stat = sentinelStats?.find(s => s.sentinelName === sentinel.name);
                      if (!stat || stat.totalRounds === 0) return null;
                      return (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/4 border border-white/8">
                          <BarChart3 className="w-3.5 h-3.5 text-cyan-400/70 shrink-0" />
                          <span className="text-xs text-white/50">
                            <span className={`font-semibold ${
                              stat.avgConfidence >= 80 ? "text-emerald-400" :
                              stat.avgConfidence >= 60 ? "text-cyan-400" :
                              "text-amber-400"
                            }`}>{stat.avgConfidence}% confidence</span>
                            <span className="text-white/30"> · </span>
                            <span className="text-white/45">{stat.totalRounds} round{stat.totalRounds !== 1 ? "s" : ""}</span>
                          </span>
                        </div>
                      );
                    })()}

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

                    {/* Chat CTA — shown for unlocked Sentinels */}
                    {!isLocked && (
                      <div className="mt-4 pt-4 border-t border-white/8">
                        <a
                          href="/chat"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200"
                          style={{
                            background: `linear-gradient(135deg, ${sentinel.primaryColor}30, ${sentinel.primaryColor}15)`,
                            border: `1px solid ${sentinel.primaryColor}40`,
                            color: sentinel.primaryColor,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = `linear-gradient(135deg, ${sentinel.primaryColor}50, ${sentinel.primaryColor}30)`;
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = `${sentinel.primaryColor}70`;
                            (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 20px ${sentinel.primaryColor}25`;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = `linear-gradient(135deg, ${sentinel.primaryColor}30, ${sentinel.primaryColor}15)`;
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = `${sentinel.primaryColor}40`;
                            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                          }}
                        >
                          <span style={{ fontSize: "1rem" }}>{sentinel.symbolEmoji}</span>
                          Chat with {sentinel.name}
                        </a>
                      </div>
                    )}

                    {/* Relationship depth bar */}
                    {(() => {
                      if (!user || isLocked) return null;
                      const rel = allRelationships?.find(r => r.sentinelId === sentinel.id);
                      const interactions = rel?.totalInteractions ?? 0;
                      if (interactions === 0) return null;
                      // Compute progress 0-100 toward next level
                      const progress = interactions >= 200 ? 100
                        : interactions >= 50  ? Math.round(((interactions - 50) / 150) * 100)
                        : interactions >= 10  ? Math.round(((interactions - 10) / 40) * 100)
                        : Math.round((interactions / 10) * 100);
                      const levelLabel = interactions >= 200 ? "Partner"
                        : interactions >= 50 ? "Trusted Advisor"
                        : interactions >= 10 ? "Colleague"
                        : "Acquaintance";
                      return (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: `${sentinel.primaryColor}90` }}>Rapport</span>
                            <span className="text-[10px] text-white/40">{levelLabel}</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${progress}%`,
                                background: `linear-gradient(90deg, ${sentinel.primaryColor}80, ${sentinel.primaryColor})`,
                                boxShadow: `0 0 8px ${sentinel.primaryColor}50`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Hover radial glow */}
                    {!isLocked && (
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${sentinel.primaryColor}, transparent 70%)`,
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
                sentinelStats={sentinelStats ?? []}
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

                  {/* Relationship depth card */}
                  <SentinelRelationshipCard sentinelId={selected.id} />

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

            {/* Mobile scroll hint */}
            <p className="text-xs text-white/25 mb-2 sm:hidden flex items-center gap-1">
              <span>←</span> Scroll to see all columns <span>→</span>
            </p>
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/3 backdrop-blur -mx-1 px-1">
              <table className="w-full text-sm min-w-[520px]">
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
                          style={{
                            animation: `rowSlideIn 0.4s ease both`,
                            animationDelay: `${i * 60}ms`,
                          }}
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

        {/* Round Table CTA — scroll-triggered entrance */}
        <div
          ref={ctaRef}
          className={`mt-16 transition-all duration-700 ease-out ${
            ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/25 p-8 md:p-12 text-center"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.06) 50%, rgba(139,92,246,0.08) 100%)" }}
          >
            {/* Ambient glow blobs */}
            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)" }} />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)" }} />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 text-xs font-semibold mb-5 tracking-wide uppercase">
                <span>⚡</span> Multi-Sentinel Feature
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Put them in a room together
              </h2>
              <p className="text-slate-300 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                Round Table lets multiple Sentinels debate a single question simultaneously — surfacing angles, contradictions, and insights no single AI can match.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/round-table"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-base text-white transition-all duration-200 shadow-lg hover:shadow-purple-500/40 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "linear-gradient(135deg, #8b5cf6, #6366f1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "linear-gradient(135deg, #7c3aed, #4f46e5)"; }}
                >
                  Start a Round Table →
                </a>
                <a
                  href="/chat"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-medium text-base text-white/70 hover:text-white border border-white/10 hover:border-white/25 transition-all duration-200"
                >
                  Or chat one-on-one
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started — two-column quick-start layout */}
        <div
          ref={gettingStartedRef}
          className={`mt-16 transition-all duration-700 ease-out delay-100 ${
            gettingStartedVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold heading-gradient mb-3">Ready to Begin?</h2>
            <p className="text-slate-400 text-lg">Three steps to your first insight.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Quick-start checklist */}
            <div className="space-y-0">
              {[
                { icon: <Users className="w-5 h-5" />, step: "01", title: "Pick a Sentinel", desc: "Choose the AI personality that matches your goal — analytical, creative, strategic, or disruptive.", color: "#22d3ee", href: "/sentinels" },
                { icon: <MessageSquare className="w-5 h-5" />, step: "02", title: "Ask a question", desc: "Start a one-on-one conversation. Your Sentinel adapts its tone and depth to your message.", color: "#a78bfa", href: "/chat" },
                { icon: <CheckCircle2 className="w-5 h-5" />, step: "03", title: "Start a Round Table", desc: "Bring multiple Sentinels into one debate to surface contradictions and deeper insights.", color: "#34d399", href: "/round-table" },
              ].map((item, i) => (
                <a key={i} href={item.href} className="group flex gap-5 p-4 rounded-xl hover:bg-white/4 transition-colors duration-200">
                  {/* Step indicator + connector */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-transform duration-200 group-hover:scale-110"
                      style={{ background: `${item.color}20`, border: `1.5px solid ${item.color}50`, color: item.color }}
                    >
                      {item.step}
                    </div>
                    {i < 2 && (
                      <div className="w-px flex-1 mt-1 mb-1" style={{ background: `linear-gradient(to bottom, ${item.color}40, transparent)`, minHeight: "28px" }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pt-1.5 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: item.color }}>{item.icon}</span>
                      <h3 className="font-semibold text-white group-hover:text-white/90">{item.title}</h3>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Right: Animated preview card */}
            <div className="relative">
              <div
                className="rounded-2xl border border-white/10 overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(15,15,30,0.95) 0%, rgba(10,10,25,0.98) 100%)" }}
              >
                {/* Card header */}
                <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.3)" }}>🧠</div>
                  <div>
                    <div className="text-sm font-semibold text-white">Lunaris.Vault</div>
                    <div className="text-xs text-slate-500">Strategic Analyst</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400/70">Online</span>
                  </div>
                </div>
                {/* Mock conversation */}
                <div className="p-5 space-y-4">
                  <div className="flex justify-end">
                    <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-white" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.7), rgba(79,70,229,0.8))" }}>
                      What's the core risk in my strategy?
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5" style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.2)" }}>🧠</div>
                    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-slate-200" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      Three hidden assumptions are load-bearing. Let me surface them…
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-cyan-400/70 rounded-sm animate-pulse align-middle" />
                    </div>
                  </div>
                </div>
                {/* Ambient glow */}
                <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)" }} />
              </div>
              {/* CTA below preview */}
              <div className="mt-5 flex gap-3">
                <a
                  href="/chat"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}
                >
                  Start Chatting →
                </a>
                <a
                  href="/round-table"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/25 transition-all duration-200"
                >
                  Round Table
                </a>
              </div>
            </div>
          </div>
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
