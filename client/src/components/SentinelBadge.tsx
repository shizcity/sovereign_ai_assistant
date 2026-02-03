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

  return (
    <span className="flex items-center gap-1 text-primary">
      <Sparkles className="h-3 w-3" />
      {sentinel.name}
    </span>
  );
}
