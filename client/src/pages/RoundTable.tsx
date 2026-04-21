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
} from "lucide-react";
import { Streamdown } from "streamdown";
import { showAchievementToasts } from "@/hooks/useAchievementToast";

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
}

interface RoundTableResult {
  sessionId: number;
  question: string;
  sentinels: Array<{ id: number; name: string; emoji: string }>;
  reasoningChains: SentinelReasoning[];
  consensusScore: number;
  hasContradiction: boolean;
  contradictionSummary: string | null;
  finalAnswer: string;
  finalSentinelName: string;
  finalSentinelEmoji: string;
}

// ─── Sentinel Card ────────────────────────────────────────────────────────────

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

function ReasoningCard({ reasoning }: { reasoning: SentinelReasoning }) {
  const [expanded, setExpanded] = useState(false);

  const confidencePct = Math.round(reasoning.confidence * 100);
  const confidenceColor =
    confidencePct >= 80 ? "text-emerald-400" : confidencePct >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="border border-white/10 rounded-xl bg-white/3 overflow-hidden">
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
            {reasoning.dissent && (
              <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-400 py-0">
                Dissent
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
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg p-3">
              <div className="text-xs font-semibold text-amber-400 mb-1">Dissent</div>
              <p className="text-xs text-amber-200/70">{reasoning.dissent}</p>
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

  return (
    <div className="space-y-6">
      {/* Question recap */}
      <div className="bg-white/4 border border-white/10 rounded-xl p-4">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Question</div>
        <p className="text-white/85 text-sm leading-relaxed">{result.question}</p>
      </div>

      {/* Consensus bar */}
      <div className="bg-white/4 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
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
        {result.hasContradiction && result.contradictionSummary && (
          <div className="mt-3 flex items-start gap-2 bg-amber-500/8 border border-amber-500/20 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/75">{result.contradictionSummary}</p>
          </div>
        )}
      </div>

      {/* Reasoning chains by round */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          Deliberation Chains
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
                    <ReasoningCard key={`${r.sentinelId}-${round}-${i}`} reasoning={r} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final answer */}
      <div className="bg-gradient-to-br from-indigo-950/60 to-cyan-950/40 border border-cyan-500/25 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{result.finalSentinelEmoji}</span>
          <div>
            <div className="text-xs text-cyan-400/70 uppercase tracking-wider">Final Answer</div>
            <div className="text-sm font-semibold text-white">Delivered by {result.finalSentinelName}</div>
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

  const { data: sentinelList } = trpc.sentinels.list.useQuery();
  const { data: history, refetch: refetchHistory } = trpc.roundTable.history.useQuery();

  const startMutation = trpc.roundTable.start.useMutation({
    onSuccess: (data) => {
      setResult(data as RoundTableResult);
      refetchHistory();
      showAchievementToasts((data as any)?.newAchievements);
    },
  });

  const getSessionQuery = trpc.roundTable.getSession.useQuery(
    { sessionId: result?.sessionId ?? 0 },
    { enabled: false }
  );

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
    startMutation.mutate({ question: question.trim(), sentinelIds: selectedIds, maxRounds: 2 });
  };

  const handleReset = () => {
    setResult(null);
    setQuestion("");
    setSelectedIds([]);
    startMutation.reset();
  };

  const loadHistorySession = async (sessionId: number) => {
    // Navigate to a past session — for now, just show a toast
    // Full session replay can be added in Phase 2
    setShowHistory(false);
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
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-4 text-center space-y-2">
                <div className="flex justify-center gap-1">
                  {selectedIds.map((id) => {
                    const s = sentinelList?.find((x) => x.id === id);
                    return s ? <span key={id} className="text-xl">{(s as any).symbolEmoji}</span> : null;
                  })}
                </div>
                <p className="text-sm text-indigo-300/70">
                  The council is deliberating. This takes 30–90 seconds depending on complexity.
                </p>
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
