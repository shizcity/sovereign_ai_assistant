import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, Route, AlertTriangle, MessageSquarePlus, ExternalLink, Clock, Zap } from "lucide-react";
import { Streamdown } from "streamdown";
import ConsensusGauge from "@/components/ConsensusGauge";
import { Helmet } from "react-helmet-async";

// ─── Reusable read-only reasoning card ───────────────────────────────────────

function ReadonlyReasoningCard({ r }: { r: {
  sentinelName: string; sentinelEmoji: string; confidence: number;
  thinkingChain: string; conclusion: string; dissent?: string | null;
  concerns: string[]; modelUsed?: string | null; latencyMs?: number | null;
} }) {
  const confPct = Math.round(r.confidence * 100);
  return (
    <div className="border border-white/10 rounded-xl bg-white/3 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{r.sentinelEmoji}</span>
        <span className="font-semibold text-white/85 text-sm">{r.sentinelName}</span>
        <span className={`ml-auto text-xs font-mono px-2 py-0.5 rounded-full ${
          confPct >= 80 ? "bg-emerald-500/15 text-emerald-400" :
          confPct >= 60 ? "bg-cyan-500/15 text-cyan-400" :
          "bg-amber-500/15 text-amber-400"
        }`}>{confPct}%</span>
      </div>
      {r.modelUsed && (
        <div className="flex items-center gap-1.5 text-[11px] text-white/30 font-mono">
          <Zap className="w-3 h-3" />
          {r.modelUsed}
          {r.latencyMs && r.latencyMs > 0 && (
            <span className="text-white/20">· {r.latencyMs >= 1000 ? `${(r.latencyMs/1000).toFixed(1)}s` : `${r.latencyMs}ms`}</span>
          )}
        </div>
      )}
      <details className="group">
        <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60 select-none list-none flex items-center gap-1">
          <Brain className="w-3 h-3" />
          Reasoning chain
          <span className="ml-auto text-white/25 group-open:hidden">▸</span>
          <span className="ml-auto text-white/25 hidden group-open:inline">▾</span>
        </summary>
        <p className="mt-2 text-xs text-white/55 leading-relaxed">{r.thinkingChain}</p>
      </details>
      <p className="text-sm text-white/80 leading-relaxed">{r.conclusion}</p>
      {r.dissent && (
        <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300/80 leading-relaxed">{r.dissent}</p>
        </div>
      )}
      {r.concerns.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {r.concerns.map((c, i) => (
            <span key={i} className="text-[11px] text-amber-300/60 bg-amber-500/8 border border-amber-500/15 rounded-full px-2 py-0.5">{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SharedSession() {
  const params = useParams<{ shareId: string }>();
  const shareId = params.shareId ?? "";

  const { data: session, isLoading, error } = trpc.roundTable.getSharedSession.useQuery(
    { shareId },
    { enabled: shareId.length >= 6, retry: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080910] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#080910] flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertTriangle className="w-12 h-12 text-amber-400/60" />
        <h1 className="text-2xl font-bold text-white">Session not found</h1>
        <p className="text-white/50 max-w-sm">This shared session link may have expired or the session doesn't exist.</p>
        <Link href="/">
          <span className="text-cyan-400 hover:text-cyan-300 text-sm underline underline-offset-4">Go to Glow</span>
        </Link>
      </div>
    );
  }

  const rounds = Array.from(new Set(session.reasoningChains.map(r => r.round))).sort();
  const consensusPct = Math.round(session.consensusScore * 100);
  const contradictions = session.contradictions ?? [];

  // Build OG meta values
  const sentinelNames = session.sentinels.map((s: any) => `${s.emoji} ${s.name}`).join(" · ");
  const ogTitle = `Round Table: ${session.question.slice(0, 80)}${session.question.length > 80 ? "…" : ""}`;
  const ogDescription = `${consensusPct}% consensus · ${session.sentinels.length} Sentinels (${sentinelNames}) · ${session.deliberationMode} mode · Powered by Glow`;
  const canonicalUrl = typeof window !== "undefined" ? window.location.href : `https://glow.manus.space/session/${shareId}`;
  const ogImage = `https://files.manuscdn.com/user_upload_by_module/session_file/86706373/XMimnGTKzlpUegGs.png`;

  return (
    <div className="min-h-screen bg-[#080910] text-white">
      <Helmet>
        <title>{ogTitle} | Glow</title>
        <meta name="description" content={ogDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Glow" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={ogTitle} />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={ogTitle} />
      </Helmet>
      {/* Header */}
      <div className="border-b border-white/8 bg-[#080910]/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">🔮</span>
            <span className="font-bold text-white/90 text-sm">Glow</span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-xs text-white/40 truncate">Round Table · Shared Session</span>
          </div>
          <Link href="/">
            <span className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
              Try Glow
            </span>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Question + meta */}
        <div className="space-y-4">
          <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
            <div className="text-xs text-white/35 uppercase tracking-wider mb-2">Question</div>
            <p className="text-white/90 text-base leading-relaxed font-medium">{session.question}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Mode badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50">
              <span className="capitalize">{session.deliberationMode}</span>
              <span className="text-white/20">mode</span>
            </div>
            {/* Sentinels */}
            {session.sentinels.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                <span>{s.emoji}</span>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Consensus gauge */}
        <div className="flex flex-col items-center gap-3 py-6 border border-white/8 rounded-2xl bg-white/2">
          <ConsensusGauge score={session.consensusScore} size={160} />
          <div className="text-center">
            <div className="text-sm font-semibold text-white/70">Consensus Score</div>
            <div className={`text-3xl font-bold font-mono mt-1 ${
              consensusPct >= 75 ? "text-emerald-400" :
              consensusPct >= 50 ? "text-cyan-400" :
              "text-amber-400"
            }`}>{consensusPct}%</div>
          </div>
        </div>

        {/* Human Interruptions */}
        {session.interruptionLog && session.interruptionLog.length > 0 && (
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquarePlus className="w-4 h-4 text-amber-400/80" />
              <span className="text-sm font-semibold text-amber-300/80">Human Interruptions</span>
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-xs">
                {session.interruptionLog.length}
              </Badge>
            </div>
            <div className="relative pl-6 space-y-3">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-amber-500/20" />
              {session.interruptionLog.map((entry, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full bg-amber-500/40 border-2 border-amber-400/60" />
                  <div className="text-xs text-amber-400/60 font-mono mb-1">After Round {entry.afterRound}</div>
                  <div className="bg-amber-500/8 border border-amber-500/15 rounded-lg px-3 py-2">
                    <p className="text-sm text-amber-100/80 leading-relaxed">{entry.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deliberation Chains */}
        <div>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            Deliberation Chains
          </h2>
          <div className="space-y-6">
            {rounds.map(round => (
              <div key={round}>
                <div className="text-xs text-white/30 uppercase tracking-wider mb-2 pl-1">Round {round}</div>
                <div className="space-y-3">
                  {session.reasoningChains
                    .filter(r => r.round === round)
                    .map((r, i) => (
                      <ReadonlyReasoningCard key={`${r.sentinelId}-${round}-${i}`} r={r} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contradictions */}
        {contradictions.length > 0 && (
          <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400/80" />
              <span className="text-sm font-semibold text-red-300/80">Contradiction Report</span>
              <Badge variant="secondary" className="bg-red-500/10 text-red-300 border-red-500/20 text-xs">
                {contradictions.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {contradictions.map((c, i) => (
                <div key={i} className="border border-red-500/15 rounded-xl p-3 bg-red-500/5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-red-300/70">{c.sentinelA} vs {c.sentinelB}</span>
                    <Badge variant="secondary" className={`text-[10px] border ${
                      c.severity === "major" ? "bg-red-500/15 text-red-300 border-red-500/30" :
                      c.severity === "moderate" ? "bg-amber-500/15 text-amber-300 border-amber-500/30" :
                      "bg-white/5 text-white/40 border-white/10"
                    }`}>{c.severity}</Badge>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">{c.claim}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Answer */}
        <div className="bg-gradient-to-br from-indigo-950/60 to-cyan-950/40 border border-cyan-500/25 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl shrink-0 mt-0.5">{session.finalSentinelEmoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-cyan-400/70 uppercase tracking-wider">Final Answer</div>
              <div className="text-sm font-semibold text-white">Delivered by {session.finalSentinelName}</div>
              {session.routingReason && (
                <div className="flex items-start gap-1.5 mt-2 bg-cyan-500/8 border border-cyan-500/15 rounded-lg px-2.5 py-1.5">
                  <Route className="w-3 h-3 text-cyan-400/70 shrink-0 mt-0.5" />
                  <p className="text-xs text-cyan-300/60 leading-relaxed">{session.routingReason}</p>
                </div>
              )}
            </div>
          </div>
          <div className="text-white/85 text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
            <Streamdown>{session.finalAnswer}</Streamdown>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/6 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/25">
            <Clock className="w-3 h-3" />
            Shared via Glow · Round Table
          </div>
          <Link href="/">
            <span className="flex items-center gap-1.5 text-xs text-cyan-400/70 hover:text-cyan-300 transition-colors">
              <ExternalLink className="w-3 h-3" />
              Start your own deliberation
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
