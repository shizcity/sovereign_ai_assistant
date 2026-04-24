import { useState, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Users,
  ChevronDown,
  ChevronRight,
  Crown,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Brain,
  Clock,
  History,
  Zap,
  GitFork,
  Route,
  TrendingDown,
  Pause,
  Share2,
  Link2,
  Layers,
  ArrowRight,
  MessageSquarePlus,
  ShieldAlert,
  GitBranch,
  RefreshCw,
  Play,
  Download,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { showAchievementToasts } from "@/hooks/useAchievementToast";
import OrbitalDiagram from "@/components/OrbitalDiagram";
import ConsensusGauge from "@/components/ConsensusGauge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SentinelReasoning {
  sentinelId: number;
  sentinelName: string;
  sentinelEmoji: string;
  round: number;
  thinkingChain: string;
  conclusion: string;
  confidence: number;
  concerns: string[];
  dissent: string | null;
  memoriesUsed: string[];
  dissentScore: number;
  isOutlier: boolean;
  // M4
  modelUsed?: string;
  latencyMs?: number;
}

interface ContradictionFlag {
  sentinelA: string;
  sentinelB: string;
  claim: string;
  positionA: string;
  positionB: string;
  severity: "minor" | "moderate" | "major";
}

interface RoundTableResult {
  sessionId: number;
  question: string;
  sentinels: Array<{ id: number; name: string; emoji: string }>;
  reasoningChains: SentinelReasoning[];
  consensusScore: number;
  hasContradiction: boolean;
  contradictionSummary: string | null;
  contradictions: ContradictionFlag[];
  finalAnswer: string;
  finalSentinelName: string;
  finalSentinelEmoji: string;
  routingReason: string;
  deliberationMode?: string;
  interruptionLog?: Array<{ message: string; timestamp: string; afterRound: number }>;
}

interface StreamEvent {
  event: "connected" | "sentinel_start" | "sentinel_token" | "sentinel_complete" | "round_complete" | "paused" | "complete" | "error";
  data: Record<string, unknown>;
}

type DeliberationMode = "parallel" | "shared" | "synchronous";

const DELIBERATION_MODES: {
  id: DeliberationMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  creatorOnly: boolean;
}[] = [
  {
    id: "parallel",
    label: "Turn-Based",
    description: "Sentinels reason sequentially, each reading the prior round's conclusions.",
    icon: <Layers className="w-4 h-4" />,
    creatorOnly: false,
  },
  {
    id: "shared",
    label: "Shared Context",
    description: "Sentinels collaboratively build a live scratchpad, reading each other's contributions in real time.",
    icon: <Share2 className="w-4 h-4" />,
    creatorOnly: true,
  },
  {
    id: "synchronous",
    label: "Synchronous",
    description: "All Sentinels reason in parallel each round. Conclusions are revealed simultaneously.",
    icon: <ArrowRight className="w-4 h-4" />,
    creatorOnly: true,
  },
];

// ─── Side Panel ───────────────────────────────────────────────────────────────

function SidePanel({
  title,
  icon,
  count,
  accentColor,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  accentColor: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: `${accentColor}25`, background: `${accentColor}06` }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/4 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span style={{ color: `${accentColor}cc` }}>{icon}</span>
          <span className="text-sm font-semibold" style={{ color: `${accentColor}cc` }}>
            {title}
          </span>
          <span
            className="text-xs rounded-full px-2 py-0.5 font-mono"
            style={{ background: `${accentColor}18`, color: `${accentColor}aa` }}
          >
            {count}
          </span>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-white/25" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/25" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4">
          {count === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 className="w-5 h-5" style={{ color: `${accentColor}60` }} />
              <p className="text-xs text-white/30 text-center">
                {title === "Dissent Records"
                  ? "All Sentinels are aligned"
                  : title === "Contradiction Report"
                  ? "No contradictions detected"
                  : "No model switches"}
              </p>
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sentinel Select Card ─────────────────────────────────────────────────────

function SentinelSelectCard({
  sentinel,
  selected,
  onToggle,
  disabled,
}: {
  sentinel: { id: number; name: string; symbolEmoji: string; archetype: string; primaryColor: string };
  selected: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left w-full
        ${selected
          ? "border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          : "border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/6"
        }
        ${disabled && !selected ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span className="text-2xl shrink-0">{sentinel.symbolEmoji}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-white truncate">{sentinel.name}</div>
        <div className="text-xs text-white/45 truncate">{sentinel.archetype}</div>
      </div>
      {selected && (
        <div className="shrink-0 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
          <CheckCircle2 className="w-3 h-3 text-black" />
        </div>
      )}
    </button>
  );
}

// ─── Reasoning Card ───────────────────────────────────────────────────────────

function ReasoningCard({
  reasoning,
  contradictions,
  isBestFit,
}: {
  reasoning: SentinelReasoning;
  contradictions: ContradictionFlag[];
  isBestFit: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const confidencePct = Math.round(reasoning.confidence * 100);
  const confidenceColor =
    confidencePct >= 80 ? "text-emerald-400" : confidencePct >= 60 ? "text-amber-400" : "text-red-400";
  const myContradictions = contradictions.filter(
    (c) => c.sentinelA === reasoning.sentinelName || c.sentinelB === reasoning.sentinelName
  );
  const dissentPct = Math.round((reasoning.dissentScore ?? 0) * 100);

  const severityColor = (s: ContradictionFlag["severity"]) =>
    s === "major" ? "text-red-400 border-red-500/40 bg-red-500/8" :
    s === "moderate" ? "text-amber-400 border-amber-500/40 bg-amber-500/8" :
    "text-yellow-400/80 border-yellow-500/30 bg-yellow-500/5";

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
      isBestFit
        ? "border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 to-indigo-950/20 shadow-[0_0_16px_rgba(6,182,212,0.1)]"
        : reasoning.isOutlier
        ? "border-amber-500/25 bg-white/3"
        : "border-white/10 bg-white/3"
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/4 transition-colors text-left"
      >
        <span className="text-xl shrink-0">{reasoning.sentinelEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{reasoning.sentinelName}</span>
            <Badge variant="outline" className="text-xs border-white/15 text-white/50 py-0">
              Round {reasoning.round}
            </Badge>
            {isBestFit && (
              <Badge className="text-xs bg-cyan-500/20 text-cyan-300 border-cyan-500/40 py-0 gap-1">
                <Route className="w-2.5 h-2.5" /> Best Fit
              </Badge>
            )}
            {reasoning.isOutlier && (
              <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-400 py-0 gap-1">
                <TrendingDown className="w-2.5 h-2.5" /> Outlier
              </Badge>
            )}
            {reasoning.dissent && (
              <Badge variant="outline" className="text-xs border-orange-500/40 text-orange-400 py-0">
                Dissent
              </Badge>
            )}
            {myContradictions.length > 0 && (
              <Badge variant="outline" className="text-xs border-red-500/40 text-red-400 py-0 gap-1">
                <GitFork className="w-2.5 h-2.5" /> {myContradictions.length} conflict
              </Badge>
            )}
          </div>
          {/* Dissent meter */}
          {dissentPct > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${dissentPct > 50 ? "bg-orange-500" : "bg-amber-400/60"}`}
                  style={{ width: `${dissentPct}%` }}
                />
              </div>
              <span className="text-[10px] text-white/30 font-mono">{dissentPct}% dissent</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-sm font-mono font-bold ${confidenceColor}`}>{confidencePct}%</span>
          {expanded ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/6">
          {/* Thinking chain */}
          <div>
            <div className="text-xs text-white/35 uppercase tracking-wider mb-1.5 mt-3">Reasoning Chain</div>
            <div className="text-sm text-white/75 leading-relaxed bg-white/3 rounded-lg p-3">
              <Streamdown>{reasoning.thinkingChain}</Streamdown>
            </div>
          </div>
          {/* Conclusion */}
          <div>
            <div className="text-xs text-white/35 uppercase tracking-wider mb-1.5">Conclusion</div>
            <p className="text-sm text-white/85 leading-relaxed">{reasoning.conclusion}</p>
          </div>
          {/* Concerns */}
          {reasoning.concerns?.length > 0 && (
            <div>
              <div className="text-xs text-white/35 uppercase tracking-wider mb-1.5">Concerns</div>
              <ul className="space-y-1">
                {reasoning.concerns.map((c, i) => (
                  <li key={i} className="text-xs text-amber-300/70 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Dissent */}
          {reasoning.dissent && (
            <div className="bg-orange-950/30 border border-orange-500/20 rounded-lg p-3">
              <div className="text-xs text-orange-400/70 uppercase tracking-wider mb-1">Dissenting Opinion</div>
              <p className="text-sm text-orange-200/80 leading-relaxed">{reasoning.dissent}</p>
            </div>
          )}
          {/* Contradictions */}
          {myContradictions.map((c, i) => (
            <div key={i} className={`border rounded-lg p-3 text-xs ${severityColor(c.severity)}`}>
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                <GitFork className="w-3 h-3" />
                Conflict with {c.sentinelA === reasoning.sentinelName ? c.sentinelB : c.sentinelA}
                <Badge variant="outline" className={`ml-auto text-[10px] py-0 ${severityColor(c.severity)}`}>
                  {c.severity}
                </Badge>
              </div>
              <p className="text-white/50 mb-1.5">{c.claim}</p>
              <p className="leading-relaxed">{c.sentinelA === reasoning.sentinelName ? c.positionA : c.positionB}</p>
            </div>
          ))}
          {/* Memories used */}
          {reasoning.memoriesUsed?.length > 0 && (
            <div>
              <div className="text-xs text-white/35 uppercase tracking-wider mb-1.5">Memories Referenced</div>
              <div className="flex flex-wrap gap-1.5">
                {reasoning.memoriesUsed.map((m, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300/70">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Results View ─────────────────────────────────────────────────────────────

function ResultsView({
  result,
  onReset,
}: {
  result: RoundTableResult;
  onReset: () => void;
}) {
  const consensusPct = Math.round(result.consensusScore * 100);
  const rounds = Array.from(new Set(result.reasoningChains.map((r) => r.round))).sort();
  const contradictions = result.contradictions ?? [];
  const [exportFormat, setExportFormat] = useState<"markdown" | "json">("markdown");
  const [downloading, setDownloading] = useState(false);

  const exportQuery = trpc.roundTable.exportSession.useQuery(
    { sessionId: result.sessionId, format: exportFormat },
    { enabled: false }
  );

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const data = await exportQuery.refetch();
      if (!data.data) return;
      const blob = new Blob([data.data.content], {
        type: exportFormat === "json" ? "application/json" : "text/markdown",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.data.filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Question recap */}
      <div className="bg-white/4 border border-white/10 rounded-xl p-4">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Question</div>
        <p className="text-white/85 text-sm leading-relaxed">{result.question}</p>
      </div>

      {/* Interruption log */}
      {result.interruptionLog && result.interruptionLog.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquarePlus className="w-4 h-4 text-amber-400/80" />
            <span className="text-sm font-semibold text-amber-300/80">Human Interruptions</span>
            <span className="text-xs text-amber-400/50 bg-amber-500/10 rounded-full px-2 py-0.5">
              {result.interruptionLog.length}
            </span>
          </div>
          <div className="relative pl-6 space-y-3">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-amber-500/20" />
            {result.interruptionLog.map((entry, i) => (
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

      {/* Deliberation chains */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          Deliberation Chains
          <span className="text-white/25 font-normal text-xs">(click to expand)</span>
        </h3>
        <div className="space-y-4">
          {rounds.map((round) => (
            <div key={round}>
              <div className="text-xs text-white/35 uppercase tracking-wider mb-2 pl-1">Round {round}</div>
              <div className="space-y-2">
                {result.reasoningChains
                  .filter((r) => r.round === round)
                  .map((r, i) => (
                    <ReasoningCard
                      key={`${r.sentinelId}-${round}-${i}`}
                      reasoning={r}
                      contradictions={contradictions}
                      isBestFit={r.sentinelName === result.finalSentinelName && round === Math.max(...rounds)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final answer */}
      <div className="bg-gradient-to-br from-indigo-950/60 to-cyan-950/40 border border-cyan-500/25 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-xl shrink-0 mt-0.5">{result.finalSentinelEmoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-cyan-400/70 uppercase tracking-wider">Final Answer</div>
            <div className="text-sm font-semibold text-white">Delivered by {result.finalSentinelName}</div>
            {result.routingReason && (
              <div className="flex items-start gap-1.5 mt-1.5 bg-cyan-500/8 border border-cyan-500/15 rounded-lg px-2.5 py-1.5">
                <Route className="w-3 h-3 text-cyan-400/70 shrink-0 mt-0.5" />
                <p className="text-xs text-cyan-300/60 leading-relaxed">{result.routingReason}</p>
              </div>
            )}
          </div>
        </div>
        <div className="text-white/85 text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
          <Streamdown>{result.finalAnswer}</Streamdown>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {/* Export row */}
        <div className="flex items-center gap-2 p-3 rounded-xl border border-white/8 bg-white/3">
          <Download className="w-4 h-4 text-white/40 shrink-0" />
          <span className="text-xs text-white/50 flex-1">Export session</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExportFormat("markdown")}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                exportFormat === "markdown"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              .md
            </button>
            <button
              onClick={() => setExportFormat("json")}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                exportFormat === "json"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              .json
            </button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={downloading}
            className="border-white/15 text-white/70 hover:text-white hover:border-white/30 h-7 px-3 text-xs"
          >
            {downloading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onReset}
            variant="outline"
            className="flex-1 border-white/15 text-white/70 hover:text-white hover:border-white/30"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            New Session
          </Button>
          <Link href="/chat">
            <Button variant="ghost" className="text-white/50 hover:text-white/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── History Item ─────────────────────────────────────────────────────────────

function HistoryItem({
  session,
  onClick,
}: {
  session: {
    id: number;
    question: string;
    sentinelNames: string;
    consensusScore: string | null;
    status: string;
    createdAt: Date;
  };
  onClick: () => void;
}) {
  const names = JSON.parse(session.sentinelNames || "[]") as string[];
  const score = session.consensusScore ? Math.round(parseFloat(session.consensusScore) * 100) : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-white/75 line-clamp-2 flex-1">{session.question}</p>
        {score !== null && (
          <span className="text-xs font-mono text-cyan-400 shrink-0">{score}%</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-xs text-white/35">{names.slice(0, 3).join(", ")}</span>
        <span className="text-white/20">·</span>
        <span className="text-xs text-white/30 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(session.createdAt).toLocaleDateString()}
        </span>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoundTable() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [result, setResult] = useState<RoundTableResult | null>(null);
  const [loadingSessionId, setLoadingSessionId] = useState<number | null>(null);
  const [deliberationMode, setDeliberationMode] = useState<DeliberationMode>("parallel");
  const [streamingEvents, setStreamingEvents] = useState<StreamEvent[]>([]);
  const [activeSentinelName, setActiveSentinelName] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [interruptMessage, setInterruptMessage] = useState("");
  const [showInterruptPanel, setShowInterruptPanel] = useState(false);
  const [maxRounds, setMaxRounds] = useState(3);
  const sseRef = useRef<EventSource | null>(null);

  const { data: sentinelList } = trpc.sentinels.list.useQuery();
  const { data: history, refetch: refetchHistory } = trpc.roundTable.history.useQuery();

  const startMutation = trpc.roundTable.start.useMutation({
    onSuccess: (data) => {
      setResult(data as RoundTableResult);
      setActiveSessionId(null);
      setStreamingEvents([]);
      setActiveSentinelName(null);
      setIsPaused(false);
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
      refetchHistory();
      showAchievementToasts((data as any)?.newAchievements);
    },
  });

  const interruptMutation = trpc.roundTable.interrupt.useMutation({
    onSuccess: () => {
      setIsPaused(true);
      setShowInterruptPanel(false);
      setInterruptMessage("");
    },
  });

  const resumeMutation = trpc.roundTable.resume.useMutation({
    onSuccess: () => setIsPaused(false),
  });

  const isCreator = user?.subscriptionTier === "creator";
  const isPro = user?.subscriptionTier === "pro" || user?.subscriptionTier === "creator";

  const toggleSentinel = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 6 ? [...prev, id] : prev
    );
  };

  const canStart = question.trim().length >= 10 && selectedIds.length >= 2 && !startMutation.isPending;

  const handleStart = () => {
    if (!canStart) return;
    setStreamingEvents([]);
    setActiveSentinelName(null);
    startMutation.mutate({ question: question.trim(), sentinelIds: selectedIds, maxRounds, deliberationMode });
  };

  const handleInterrupt = () => {
    if (!activeSessionId || !interruptMessage.trim()) return;
    interruptMutation.mutate({ sessionId: activeSessionId, message: interruptMessage.trim() });
  };

  const handleResume = () => {
    if (!activeSessionId) return;
    resumeMutation.mutate({ sessionId: activeSessionId });
  };

  const handleReset = () => {
    setResult(null);
    setQuestion("");
    setSelectedIds([]);
    startMutation.reset();
  };

  const { data: sessionData } = trpc.roundTable.getSession.useQuery(
    { sessionId: loadingSessionId ?? 0 },
    { enabled: loadingSessionId !== null }
  );

  const prevSessionData = useState<typeof sessionData>(undefined);
  if (sessionData && sessionData !== prevSessionData[0]) {
    prevSessionData[1](sessionData);
    setResult(sessionData as RoundTableResult);
    setLoadingSessionId(null);
  }

  // Build orbital nodes from selected sentinels
  const orbitalNodes = useMemo(() => {
    if (!sentinelList) return [];
    return selectedIds
      .map((id) => sentinelList.find((s) => s.id === id))
      .filter(Boolean)
      .map((s) => ({
        id: s!.id,
        name: s!.name,
        emoji: (s as any).symbolEmoji ?? "🤖",
        color: (s as any).primaryColor ?? undefined,
      }));
  }, [selectedIds, sentinelList]);

  // Dissent records from result
  const dissentRecords = useMemo(() => {
    if (!result) return [];
    return result.reasoningChains.filter((r) => r.dissent || r.dissentScore > 0.3);
  }, [result]);

  // Model switch log — unique model+sentinel combos per round
  const modelSwitchLog = useMemo(() => {
    if (!result) return [];
    return result.reasoningChains.map((r) => ({
      sentinelName: r.sentinelName,
      sentinelEmoji: r.sentinelEmoji,
      round: r.round,
      modelUsed: r.modelUsed ?? "gemini-2.5-flash",
      latencyMs: r.latencyMs ?? 0,
    }));
  }, [result]);

  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<"history" | "table" | "panels">("table");

  // ── Gate: Pro/Creator only ──
  if (!isPro) {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Round Table</h1>
          <p className="text-white/55 text-sm leading-relaxed">
            Convene a council of Sentinels to deliberate on your question. Each Sentinel reasons
            independently, challenges the others, and the council reaches a consensus answer.
          </p>
          <div className="bg-white/4 border border-white/10 rounded-xl p-4 text-left space-y-2">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Available on</div>
            {["Pro — $19/month", "Creator — $29/month"].map((tier) => (
              <div key={tier} className="flex items-center gap-2 text-sm text-white/70">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                {tier}
              </div>
            ))}
          </div>
          <Link href="/settings">
            <Button className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold">
              Upgrade to Unlock
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="ghost" className="w-full text-white/40 hover:text-white/70">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isRunning = startMutation.isPending;
  const liveConsensus = isRunning ? 0 : (result?.consensusScore ?? 0);

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0b14]/95 backdrop-blur border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <Link href="/chat">
          <Button variant="ghost" size="icon" className="text-white/50 hover:text-white h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Agentic Round Table
          </h1>
          <p className="text-xs text-white/40">Multi-Sentinel deliberation · {selectedIds.length > 0 ? `${selectedIds.length} Sentinels Active` : "No session"}</p>
        </div>
        {/* Version badge */}
        <span className="hidden sm:inline text-xs text-white/20 font-mono">M4 · Model Tracking</span>
      </div>

      {/* Mobile tab bar */}
      <div className="flex sm:hidden border-b border-white/8 bg-[#080910]">
        {(["history", "table", "panels"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              mobileTab === tab
                ? "text-cyan-400 border-b-2 border-cyan-500"
                : "text-white/35 hover:text-white/60"
            }`}
          >
            {tab === "history" ? "History" : tab === "table" ? "Table" : "Panels"}
          </button>
        ))}
      </div>

      {/* Three-column layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Session History ── */}
        <div className={`w-56 shrink-0 border-r border-white/8 flex-col bg-[#080910] hidden sm:flex ${mobileTab === "history" ? "!flex w-full sm:w-56" : ""}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Session History</span>
            </div>
            <span className="text-xs font-mono text-white/25">{history?.length ?? 0}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!history || history.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Clock className="w-6 h-6 text-white/15" />
                <p className="text-xs text-white/25 text-center leading-relaxed">
                  No sessions yet<br />Convene your first table
                </p>
              </div>
            ) : (
              history.map((s) => (
                <HistoryItem
                  key={s.id}
                  session={s as any}
                  onClick={() => setLoadingSessionId(s.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── CENTER: Main form / results ── */}
        <div className={`flex-1 overflow-y-auto ${mobileTab !== "table" ? "hidden sm:block" : ""}`}>
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

            {result ? (
              <ResultsView result={result} onReset={handleReset} />
            ) : (
              <>
                {/* Deliberation Mode */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-white/70">Session Mode</label>
                    {!isCreator && (
                      <span className="text-xs text-amber-400/70 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Creator unlocks 2 more modes
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {DELIBERATION_MODES.map((mode) => {
                      const locked = mode.creatorOnly && !isCreator;
                      const active = deliberationMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => !locked && setDeliberationMode(mode.id)}
                          disabled={locked}
                          className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all
                            ${active
                              ? "border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.12)]"
                              : locked
                              ? "border-white/6 bg-white/2 opacity-40 cursor-not-allowed"
                              : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5 cursor-pointer"
                            }`}
                        >
                          <div className={`flex items-center gap-1.5 text-sm font-medium ${
                            active ? "text-cyan-300" : locked ? "text-white/30" : "text-white/70"
                          }`}>
                            {mode.icon}
                            {mode.label}
                            {locked && <Crown className="w-3 h-3 text-amber-400/60 ml-auto" />}
                          </div>
                          <p className="text-xs text-white/35 leading-snug">{mode.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/70">Question for the Table</label>
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What question should the Sentinels reason through together?"
                    className="bg-white/4 border-white/12 text-white placeholder:text-white/25 resize-none min-h-[100px] focus:border-cyan-500/50 focus:ring-cyan-500/20"
                    disabled={isRunning}
                  />
                  <p className="text-xs text-white/30">
                    {question.trim().length < 10 ? `${10 - question.trim().length} more characters needed` : `${question.trim().length} characters`}
                  </p>
                </div>

                {/* Sentinel selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-white/70">Sentinels</label>
                    <span className="text-xs text-white/35">{selectedIds.length}/6 selected (min 2)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {sentinelList?.map((s) => (
                      <SentinelSelectCard
                        key={s.id}
                        sentinel={s as any}
                        selected={selectedIds.includes(s.id)}
                        onToggle={() => toggleSentinel(s.id)}
                        disabled={selectedIds.length >= 6 && !selectedIds.includes(s.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Max rounds */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/70">Max Rounds</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setMaxRounds(n)}
                        className={`w-9 h-9 rounded-lg border text-sm font-mono font-semibold transition-all ${
                          maxRounds === n
                            ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-300"
                            : "border-white/10 bg-white/3 text-white/45 hover:border-white/25"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Human interruptions queue */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/70 flex items-center gap-2">
                    <MessageSquarePlus className="w-4 h-4 text-amber-400/70" />
                    Human Interruptions
                  </label>
                  <p className="text-xs text-white/35">
                    Queue thoughts to inject into the session. All Sentinels will integrate your perspective into their reasoning.
                  </p>
                  <Textarea
                    value={interruptMessage}
                    onChange={(e) => setInterruptMessage(e.target.value)}
                    placeholder="Type a thought, constraint, or new angle to inject…"
                    className="bg-white/4 border-white/12 text-white placeholder:text-white/25 resize-none min-h-[70px] focus:border-amber-500/40"
                    disabled={isRunning && !activeSessionId}
                  />
                  {activeSessionId && interruptMessage.trim() && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleInterrupt}
                        disabled={interruptMutation.isPending}
                        className="h-8 text-xs bg-amber-600/80 hover:bg-amber-500 text-white"
                      >
                        {interruptMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
                        Pause & Inject
                      </Button>
                      {isPaused && (
                        <Button
                          size="sm"
                          onClick={handleResume}
                          disabled={resumeMutation.isPending}
                          className="h-8 text-xs bg-emerald-600/80 hover:bg-emerald-500 text-white"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Resume
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Convene button */}
                <Button
                  onClick={handleStart}
                  disabled={!canStart}
                  className={`w-full h-12 font-semibold text-base transition-all duration-200
                    ${canStart
                      ? "bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                      : "bg-white/8 text-white/30 cursor-not-allowed"
                    }
                  `}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isPaused ? "Session paused…" : activeSentinelName ? `${activeSentinelName} is reasoning…` : "Council convening…"}
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Convene the Table
                    </>
                  )}
                </Button>

                {startMutation.isError && (
                  <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300/80">
                      {startMutation.error.message || "The council encountered an error. Please try again."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: Orbital diagram + consensus gauge + side panels ── */}
        <div className={`w-72 shrink-0 border-l border-white/8 flex-col bg-[#080910] overflow-y-auto hidden sm:flex ${mobileTab === "panels" ? "!flex w-full sm:w-72" : ""}`}>

          {/* Orbital diagram */}
          <div className="flex flex-col items-center pt-6 pb-2 px-4 border-b border-white/6">
            {orbitalNodes.length >= 2 ? (
              <OrbitalDiagram
                sentinels={orbitalNodes}
                activeName={isRunning ? activeSentinelName : null}
                deliveringSentinelName={result?.finalSentinelName ?? null}
                size={220}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-16 h-16 rounded-full border border-dashed border-white/15 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-xs text-white/25 text-center leading-relaxed">
                  Select 2+ Sentinels<br />to see the constellation
                </p>
              </div>
            )}
          </div>

          {/* Consensus gauge */}
          <div className="flex flex-col items-center py-5 border-b border-white/6">
            <ConsensusGauge
              score={liveConsensus}
              isRunning={isRunning}
              size={150}
            />
            {result && (
              <div className="flex items-center gap-3 mt-2 text-xs text-white/35">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {result.reasoningChains.length} chains
                </span>
                <span className="flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  {Array.from(new Set(result.reasoningChains.map(r => r.round))).length} rounds
                </span>
              </div>
            )}
          </div>

          {/* Side panels */}
          <div className="p-4 space-y-3">

            {/* Dissent Records */}
            <SidePanel
              title="Dissent Records"
              icon={<ShieldAlert className="w-4 h-4" />}
              count={dissentRecords.length}
              accentColor="#22d3ee"
              defaultOpen={dissentRecords.length > 0}
            >
              <div className="space-y-2 mt-2">
                {dissentRecords.map((r, i) => (
                  <div key={i} className="border border-cyan-500/15 rounded-lg p-2.5 bg-cyan-500/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{r.sentinelEmoji}</span>
                      <span className="text-xs font-semibold text-cyan-300/80">{r.sentinelName}</span>
                      <span className="text-[10px] text-white/30 ml-auto font-mono">
                        {Math.round(r.dissentScore * 100)}%
                      </span>
                    </div>
                    {r.dissent && (
                      <p className="text-xs text-white/55 leading-relaxed line-clamp-3">{r.dissent}</p>
                    )}
                  </div>
                ))}
              </div>
            </SidePanel>

            {/* Contradiction Report */}
            <SidePanel
              title="Contradiction Report"
              icon={<GitBranch className="w-4 h-4" />}
              count={result?.contradictions?.length ?? 0}
              accentColor="#f87171"
              defaultOpen={(result?.contradictions?.length ?? 0) > 0}
            >
              <div className="space-y-2 mt-2">
                {result?.contradictions?.map((c, i) => (
                  <div key={i} className="border border-red-500/20 rounded-lg p-2.5 bg-red-500/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold text-red-300/80">
                        {c.sentinelA} vs {c.sentinelB}
                      </span>
                      <Badge variant="outline" className={`ml-auto text-[10px] py-0 ${
                        c.severity === "major" ? "border-red-500/40 text-red-400" :
                        c.severity === "moderate" ? "border-amber-500/40 text-amber-400" :
                        "border-yellow-500/30 text-yellow-400"
                      }`}>
                        {c.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{c.claim}</p>
                  </div>
                ))}
              </div>
            </SidePanel>

            {/* Model Switch Log — M4 live data */}
            <SidePanel
              title="Model Switch Log"
              icon={<RefreshCw className="w-4 h-4" />}
              count={modelSwitchLog.length}
              accentColor="#a78bfa"
              defaultOpen={modelSwitchLog.length > 0}
            >
              <div className="space-y-1.5 mt-2">
                {modelSwitchLog.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-2">No session data yet</p>
                ) : (
                  modelSwitchLog.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 border border-violet-500/15 rounded-lg px-2.5 py-2 bg-violet-500/5">
                      <span className="text-sm shrink-0">{entry.sentinelEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-violet-300/80 truncate">{entry.sentinelName}</span>
                          <span className="text-[10px] text-white/30 font-mono shrink-0">R{entry.round}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-white/45 font-mono truncate">{entry.modelUsed}</span>
                          {entry.latencyMs > 0 && (
                            <span className="text-[10px] text-white/25 font-mono shrink-0">{entry.latencyMs >= 1000 ? `${(entry.latencyMs / 1000).toFixed(1)}s` : `${entry.latencyMs}ms`}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SidePanel>

          </div>
        </div>
      </div>
    </div>
  );
}
