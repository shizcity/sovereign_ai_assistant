import { trpc } from "@/lib/trpc";
import { Sparkles } from "lucide-react";

interface SentinelBadgeProps {
  sentinelId: number | null | undefined;
}

export function SentinelBadge({ sentinelId }: SentinelBadgeProps) {
  const { data: allSentinels } = trpc.sentinels.list.useQuery();

  if (!sentinelId) return null;

  const sentinel = allSentinels?.find(s => s.id === sentinelId);
  if (!sentinel) return null;

  // Map sentinel names to glow classes
  const glowClass = {
    'Sage': 'glow-sage',
    'Nova': 'glow-nova',
    'Bolt': 'glow-bolt'
  }[sentinel.name] || '';

  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${glowClass}`} style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
        <Sparkles className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium">{sentinel.name}</span>
    </div>
  );
}
