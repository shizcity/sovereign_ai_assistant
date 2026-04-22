import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Users,
  ChevronDown,
  ChevronUp,
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
  Play,
  Share2,
  Link2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { showAchievementToasts } from "@/hooks/useAchievementToast";
import { useRef } from "react";

// ─── Deliberation Mode ───────────────────────────────────────────────────────

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
    label: "Parallel",
    description: "All Sentinels reason independently at the same time",
    icon: <Layers className="w-4 h-4" />,
    creatorOnly: false,
  },
  {
    id: "shared",
    label: "Shared Context",
    description: "Each Sentinel sees prior rounds before responding",
    icon: <Share2 className="w-4 h-4" />,
    creatorOnly: true,
  },
  {
    id: "synchronous",
    label: "Synchronous",
    description: "Sequential chain — each Sentinel builds on the previous",
    icon: <ArrowRight className="w-4 h-4" />,
    creatorOnly: true,
  },
];

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

// ─── Streaming Event Types ────────────────────────────────────────────────────

interface StreamEvent {
  event: "connected" | "sentinel_start" | "sentinel_token" | "sentinel_complete" | "round_complete" | "paused" | "complete" | "error";
  data: Record<string, unknown>;
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

// ─── Reasoning Card (Phase 2: dissent meter, outlier badge, improved expand) ──

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

  // Find contradictions involving this Sentinel
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
      {/* Header */}
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
                <GitFork className="w-2.5 h-2.5" /> {myContradictions.length} conflict{myContradictions.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <p className="text-xs text-white/55 mt-0.5 line-clamp-2">{reasoning.conclusion}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-mono font-bold ${confidenceColor}`}>{confidencePct}%</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </div>
      </button>

      {/* Dissent meter — always visible when score > 0 */}
      {dissentPct > 0 && (
        <div className="px-4 pb-2 flex items-center gap-2">
          <span className="text-xs text-white/30 w-16 shrink-0">Divergence</span>
          <div className="flex-1 bg-white/8 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all duration-500 ${
                dissentPct > 50 ? "bg-amber-500" : dissentPct > 25 ? "bg-yellow-500/70" : "bg-white/25"
              }`}
              style={{ width: `${dissentPct}%` }}
            />
          </div>
          <span className="text-xs text-white/30 w-8 text-right">{dissentPct}%</span>
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/8 pt-3">
          <div>
            <div className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wider mb-1.5">
              Reasoning Chain
            </div>
            <p className="text-sm text-white/75 leading-relaxed">{reasoning.thinkingChain}</p>
          </div>

          <div>
            <div className="text-xs font-semibold text-indigo-400/80 uppercase tracking-wider mb-1.5">
              Conclusion
            </div>
            <p className="text-sm text-white/85 leading-relaxed">{reasoning.conclusion}</p>
          </div>

          {reasoning.concerns.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-1.5">
                Caveats
              </div>
              <ul className="space-y-1">
                {reasoning.concerns.map((concern, i) => (
                  <li key={i} className="text-xs text-white/55 flex items-start gap-1.5">
                    <span className="text-amber-400/60 mt-0.5 shrink-0">•</span>
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reasoning.dissent && (
            <div className="bg-orange-500/8 border border-orange-500/20 rounded-lg p-3">
              <div className="text-xs font-semibold text-orange-400 mb-1">Dissent</div>
              <p className="text-xs text-orange-200/70">{reasoning.dissent}</p>
            </div>
          )}

          {/* Contradiction details for this Sentinel */}
          {myContradictions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-red-400/80 uppercase tracking-wider flex items-center gap-1">
                <GitFork className="w-3 h-3" /> Conflicts Detected
              </div>
              {myContradictions.map((c, i) => (
                <div key={i} className={`border rounded-lg p-3 text-xs ${severityColor(c.severity)}`}>
                  <div className="font-semibold mb-1">{c.claim}</div>
                  <div className="text-white/50 space-y-1">
                    <div><span className="font-medium text-white/70">{c.sentinelA}:</span> {c.positionA}</div>
                    <div><span className="font-medium text-white/70">{c.sentinelB}:</span> {c.positionB}</div>
                  </div>
                  <div className="mt-1.5 text-right capitalize opacity-70">{c.severity} conflict</div>
                </div>
              ))}
            </div>
          )}

          {reasoning.memoriesUsed.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-purple-400/80 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Brain className="w-3 h-3" /> Memories Used
              </div>
              <ul className="space-y-1">
                {reasoning.memoriesUsed.map((mem, i) => (
                  <li key={i} className="text-xs text-white/45 italic">
                    "{mem}"
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Contradiction Panel ──────────────────────────────────────────────────────

function ContradictionPanel({ contradictions }: { contradictions: ContradictionFlag[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!contradictions || contradictions.length === 0) return null;

  const majorCount = contradictions.filter((c) => c.severity === "major").length;
  const moderateCount = contradictions.filter((c) => c.severity === "moderate").length;

  return (
    <div className="bg-red-950/20 border border-red-500/25 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-red-500/5 transition-colors text-left"
      >
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-red-300">
            {contradictions.length} Contradiction{contradictions.length > 1 ? "s" : ""} Detected
          </div>
          <div className="text-xs text-red-400/60 mt-0.5">
            {majorCount > 0 && `${majorCount} major`}
            {majorCount > 0 && moderateCount > 0 && " · "}
            {moderateCount > 0 && `${moderateCount} moderate`}
            {majorCount === 0 && moderateCount === 0 && "Minor differences in emphasis"}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-red-400/50" /> : <ChevronDown className="w-4 h-4 text-red-400/50" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-red-500/15 pt-3">
          {contradictions.map((c, i) => (
            <div key={i} className={`rounded-lg p-3 border text-xs ${
              c.severity === "major" ? "bg-red-500/8 border-red-500/30" :
              c.severity === "moderate" ? "bg-amber-500/8 border-amber-500/25" :
              "bg-yellow-500/5 border-yellow-500/20"
            }`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-semibold text-white/85">{c.claim}</span>
                <span className={`shrink-0 capitalize text-xs px-1.5 py-0.5 rounded ${
                  c.severity === "major" ? "bg-red-500/20 text-red-300" :
                  c.severity === "moderate" ? "bg-amber-500/20 text-amber-300" :
                  "bg-yellow-500/15 text-yellow-300"
                }`}>{c.severity}</span>
              </div>
              <div className="space-y-1.5 text-white/55">
                <div className="flex gap-2">
                  <span className="font-medium text-white/70 shrink-0 w-24 truncate">{c.sentinelA}:</span>
                  <span>{c.positionA}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-white/70 shrink-0 w-24 truncate">{c.sentinelB}:</span>
                  <span>{c.positionB}</span>
                </div>
              </div>
            </div>
          ))}
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
  const consensusColor =
    consensusPct >= 80 ? "text-emerald-400" : consensusPct >= 60 ? "text-amber-400" : "text-red-400";

  // Group reasoning by round
  const rounds = Array.from(new Set(result.reasoningChains.map((r) => r.round))).sort();
  const contradictions: ContradictionFlag[] = result.contradictions ?? [];

  // Count outliers
  const outlierCount = result.reasoningChains.filter(
    (r) => r.round === Math.max(...result.reasoningChains.map((x) => x.round)) && r.isOutlier
  ).length;

  return (
    <div className="space-y-6">
      {/* Question recap */}
      <div className="bg-white/4 border border-white/10 rounded-xl p-4">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Question</div>
        <p className="text-white/85 text-sm leading-relaxed">{result.question}</p>
      </div>

      {/* Consensus + stats bar */}
      <div className="bg-white/4 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-white">Council Consensus</span>
          <span className={`text-lg font-bold font-mono ${consensusColor}`}>{consensusPct}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              consensusPct >= 80 ? "bg-emerald-500" : consensusPct >= 60 ? "bg-amber-500" : "bg-red-500"
            }`}
            style={{ width: `${consensusPct}%` }}
          />
        </div>
        {/* Stats row */}
        <div className="flex items-center gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Users className="w-3 h-3" />
            {result.sentinels.length} Sentinels
          </div>
          {contradictions.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-400/70">
              <GitFork className="w-3 h-3" />
              {contradictions.length} contradiction{contradictions.length > 1 ? "s" : ""}
            </div>
          )}
          {outlierCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400/70">
              <TrendingDown className="w-3 h-3" />
              {outlierCount} outlier{outlierCount > 1 ? "s" : ""}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Zap className="w-3 h-3" />
            {rounds.length} round{rounds.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Structured contradictions panel */}
      {contradictions.length > 0 && (
        <ContradictionPanel contradictions={contradictions} />
      )}

      {/* Reasoning chains by round */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          Deliberation Chains
          <span className="text-white/25 font-normal text-xs">(click to expand)</span>
        </h3>
        <div className="space-y-4">
          {rounds.map((round) => (
            <div key={round}>
              <div className="text-xs text-white/35 uppercase tracking-wider mb-2 pl-1">
                Round {round}
              </div>
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

      {/* Final answer — with routing reason */}
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
  const [showHistory, setShowHistory] = useState(false);
  const [loadingSessionId, setLoadingSessionId] = useState<number | null>(null);
  const [deliberationMode, setDeliberationMode] = useState<DeliberationMode>("parallel");
  // Streaming state
  const [streamingEvents, setStreamingEvents] = useState<StreamEvent[]>([]);
  const [activeSentinelName, setActiveSentinelName] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [interruptMessage, setInterruptMessage] = useState("");
  const [showInterruptPanel, setShowInterruptPanel] = useState(false);
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
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 6
        ? [...prev, id]
        : prev
    );
  };

  const canStart = question.trim().length >= 10 && selectedIds.length >= 2 && !startMutation.isPending;

  const handleStart = () => {
    if (!canStart) return;
    setStreamingEvents([]);
    setActiveSentinelName(null);
    startMutation.mutate({
      question: question.trim(),
      sentinelIds: selectedIds,
      maxRounds: 2,
      deliberationMode,
    });
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

  const { data: sessionData, isFetching: sessionLoading } = trpc.roundTable.getSession.useQuery(
    { sessionId: loadingSessionId ?? 0 },
    { enabled: loadingSessionId !== null }
  );

  // When session data arrives, display it in ResultsView
  const prevSessionData = useState<typeof sessionData>(undefined);
  if (sessionData && sessionData !== prevSessionData[0]) {
    prevSessionData[1](sessionData);
    setResult(sessionData as RoundTableResult);
    setLoadingSessionId(null);
    setShowHistory(false);
  }

  const loadHistorySession = (sessionId: number) => {
    setLoadingSessionId(sessionId);
  };

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

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white">
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
            Round Table
          </h1>
          <p className="text-xs text-white/40">Multi-Sentinel deliberation</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="text-white/50 hover:text-white/80 text-xs gap-1.5"
        >
          <History className="w-3.5 h-3.5" />
          History
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* History panel */}
        {showHistory && (
          <div className="bg-white/3 border border-white/10 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Past Sessions
            </div>
            {!history || history.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-4">No sessions yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((s) => (
                  <HistoryItem
                    key={s.id}
                    session={s as any}
                    onClick={() => loadHistorySession(s.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results view */}
        {result ? (
          <ResultsView result={result} onReset={handleReset} />
        ) : (
          <>
            {/* Deliberation Mode Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white/70">Deliberation Mode</label>
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
                        ${
                          active
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

            {/* Question input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/70">Your Question</label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a complex question that benefits from multiple perspectives…"
                className="bg-white/4 border-white/12 text-white placeholder:text-white/25 resize-none min-h-[100px] focus:border-cyan-500/50 focus:ring-cyan-500/20"
                disabled={startMutation.isPending}
              />
              <p className="text-xs text-white/30">
                {question.trim().length < 10 ? `${10 - question.trim().length} more characters needed` : `${question.trim().length} characters`}
              </p>
            </div>

            {/* Sentinel selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white/70">
                  Select Sentinels
                </label>
                <span className="text-xs text-white/35">
                  {selectedIds.length}/6 selected (min 2)
                </span>
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

            {/* Start button */}
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
              {startMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Council deliberating…
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Convene the Council
                </>
              )}
            </Button>

            {startMutation.isPending && (
              <div className="space-y-3">
                {/* Live progress panel */}
                <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      <span className="text-sm text-indigo-300/80 font-medium">
                        {isPaused ? "Session paused" : activeSentinelName ? `${activeSentinelName} is reasoning…` : "Council convening…"}
                      </span>
                    </div>
                    {/* Mode badge */}
                    <span className="text-xs text-white/30 capitalize">{deliberationMode}</span>
                  </div>

                  {/* Sentinel emoji row */}
                  <div className="flex justify-center gap-1.5">
                    {selectedIds.map((id) => {
                      const s = sentinelList?.find((x) => x.id === id);
                      const isActive = s && (s as any).name === activeSentinelName;
                      return s ? (
                        <span
                          key={id}
                          className={`text-xl transition-all duration-300 ${
                            isActive ? "scale-125 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "opacity-40"
                          }`}
                        >
                          {(s as any).symbolEmoji}
                        </span>
                      ) : null;
                    })}
                  </div>

                  {/* Streaming token preview */}
                  {streamingEvents.filter(e => e.event === "sentinel_token").slice(-1).map((e, i) => (
                    <div key={i} className="text-xs text-white/35 italic line-clamp-2 border-l-2 border-cyan-500/20 pl-2">
                      {String(e.data.token ?? "")}
                    </div>
                  ))}

                  <div className="flex justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Interrupt panel */}
                {activeSessionId && (
                  <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2">
                    {!showInterruptPanel ? (
                      <button
                        onClick={() => setShowInterruptPanel(true)}
                        className="flex items-center gap-2 text-xs text-white/40 hover:text-amber-400/80 transition-colors"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Interrupt & inject a message
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-amber-400/80">
                          <Pause className="w-3.5 h-3.5" />
                          Inject a message into the deliberation
                        </div>
                        <textarea
                          value={interruptMessage}
                          onChange={(e) => setInterruptMessage(e.target.value)}
                          placeholder="e.g. Focus on the ethical implications"
                          className="w-full bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-white/25 p-2 resize-none h-16 focus:outline-none focus:border-amber-500/40"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleInterrupt}
                            disabled={!interruptMessage.trim() || interruptMutation.isPending}
                            className="flex-1 h-7 text-xs bg-amber-600/80 hover:bg-amber-500 text-white"
                          >
                            {interruptMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3 mr-1" />}
                            Pause & Inject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowInterruptPanel(false)}
                            className="h-7 text-xs text-white/40"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
  );
}
