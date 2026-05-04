/**
 * SentinelRelationshipCard
 *
 * Displays the evolving relationship between the user and a specific Sentinel:
 * - Relationship level badge (Acquaintance → Colleague → Trusted Advisor → Partner)
 * - Progress bar toward the next level
 * - User model (preferences, recurring themes, current focus)
 * - Topic summary and interaction count
 */

import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, TrendingUp, Target, MessageSquare, Zap } from "lucide-react";

type RelationshipLevel = "acquaintance" | "colleague" | "trusted_advisor" | "partner";

const LEVEL_LABELS: Record<RelationshipLevel, string> = {
  acquaintance:    "Acquaintance",
  colleague:       "Colleague",
  trusted_advisor: "Trusted Advisor",
  partner:         "Partner",
};

const LEVEL_COLORS: Record<RelationshipLevel, string> = {
  acquaintance:    "text-gray-400 border-gray-600 bg-gray-800/50",
  colleague:       "text-blue-400 border-blue-600 bg-blue-900/30",
  trusted_advisor: "text-purple-400 border-purple-600 bg-purple-900/30",
  partner:         "text-amber-400 border-amber-600 bg-amber-900/30",
};

const LEVEL_GLOW: Record<RelationshipLevel, string> = {
  acquaintance:    "",
  colleague:       "shadow-[0_0_12px_rgba(59,130,246,0.3)]",
  trusted_advisor: "shadow-[0_0_12px_rgba(139,92,246,0.3)]",
  partner:         "shadow-[0_0_16px_rgba(245,158,11,0.4)]",
};

const LEVEL_THRESHOLDS: Record<RelationshipLevel, [number, number]> = {
  acquaintance:    [0, 10],
  colleague:       [10, 50],
  trusted_advisor: [50, 200],
  partner:         [200, 200],
};

function levelProgress(level: RelationshipLevel, totalInteractions: number): number {
  if (level === "partner") return 100;
  const [min, max] = LEVEL_THRESHOLDS[level];
  return Math.min(100, Math.round(((totalInteractions - min) / (max - min)) * 100));
}

function nextLevelLabel(level: RelationshipLevel): string {
  const order: RelationshipLevel[] = ["acquaintance", "colleague", "trusted_advisor", "partner"];
  const idx = order.indexOf(level);
  return idx < order.length - 1 ? LEVEL_LABELS[order[idx + 1]] : "Max Level";
}

function nextLevelAt(level: RelationshipLevel): number {
  const [, max] = LEVEL_THRESHOLDS[level];
  return max;
}

interface Props {
  sentinelId: number;
  compact?: boolean; // compact mode for sidebar/card use
}

export function SentinelRelationshipCard({ sentinelId, compact = false }: Props) {
  const { data, isLoading } = trpc.sentinels.getRelationship.useQuery(
    { sentinelId },
    { staleTime: 30_000 }
  );

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg bg-white/5 p-3 h-16" />
    );
  }

  if (!data || data.totalInteractions === 0) return null;

  const level = (data.relationshipLevel as RelationshipLevel) ?? "acquaintance";
  const progress = levelProgress(level, data.totalInteractions);
  const isPartner = level === "partner";

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${LEVEL_COLORS[level]} ${LEVEL_GLOW[level]} cursor-default`}>
              <Zap className="w-3 h-3" />
              {LEVEL_LABELS[level]}
              <span className="opacity-60">· {data.totalInteractions}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-xs font-semibold mb-1">{data.sentinelName} relationship</p>
            {data.topicSummary && (
              <p className="text-xs text-muted-foreground">{data.topicSummary}</p>
            )}
            {!isPartner && (
              <p className="text-xs text-muted-foreground mt-1">
                {nextLevelAt(level) - data.totalInteractions} more to {nextLevelLabel(level)}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`rounded-xl border bg-card p-4 space-y-3 ${LEVEL_GLOW[level]}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Relationship</span>
        </div>
        <Badge variant="outline" className={`text-xs font-semibold ${LEVEL_COLORS[level]}`}>
          {LEVEL_LABELS[level]}
        </Badge>
      </div>

      {/* Progress toward next level */}
      {!isPartner && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.totalInteractions} interactions</span>
            <span>{nextLevelAt(level) - data.totalInteractions} to {nextLevelLabel(level)}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {isPartner && (
        <p className="text-xs text-amber-400 font-medium">
          ✦ Maximum relationship depth reached
        </p>
      )}

      {/* Topic summary */}
      {data.topicSummary && (
        <div className="flex items-start gap-2">
          <Target className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">{data.topicSummary}</p>
        </div>
      )}

      {/* User model — preferences and themes */}
      {data.userModel && (
        <div className="space-y-2 pt-1 border-t border-border/50">
          {data.userModel.currentFocus && (
            <div className="flex items-start gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground/70 font-medium">Current focus: </span>
                {data.userModel.currentFocus}
              </p>
            </div>
          )}

          {data.userModel.preferences?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.userModel.preferences.slice(0, 3).map((pref, i) => (
                <span
                  key={i}
                  className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-muted-foreground border border-white/10"
                >
                  {pref}
                </span>
              ))}
            </div>
          )}

          {data.userModel.recurringThemes?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground">
                {data.userModel.recurringThemes.slice(0, 3).join(" · ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Round Table count if any */}
      {data.roundTableCount > 0 && (
        <p className="text-[10px] text-muted-foreground">
          ⚡ {data.roundTableCount} Round Table session{data.roundTableCount === 1 ? "" : "s"} together
        </p>
      )}
    </div>
  );
}
