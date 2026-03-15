import { trpc } from "@/lib/trpc";

interface SentinelAvatarProps {
  sentinelId: number | null | undefined;
}

// Map sentinel name → accent color for the avatar ring and glow
const SENTINEL_COLORS: Record<string, string> = {
  Sage:    "#22d3ee", // cyan-400
  Nova:    "#c084fc", // purple-400
  Bolt:    "#60a5fa", // blue-400
  Vixen:   "#f472b6", // pink-400
  Mischief:"#fb923c", // orange-400
  Lunaris: "#a78bfa", // violet-400
};

export function SentinelAvatar({ sentinelId }: SentinelAvatarProps) {
  const { data: allSentinels } = trpc.sentinels.list.useQuery();

  const sentinel = allSentinels?.find((s) => s.id === sentinelId);

  // Fallback avatar when sentinel is unknown
  const emoji = (sentinel as any)?.emoji ?? "✦";
  const name  = sentinel?.name ?? "AI";
  const color = SENTINEL_COLORS[name] ?? ((sentinel as any)?.primaryColor ?? "#22d3ee");

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1 font-semibold select-none"
      style={{
        background: `${color}22`,
        border: `1.5px solid ${color}55`,
        boxShadow: `0 0 10px ${color}33`,
        color,
      }}
      title={name}
    >
      {emoji}
    </div>
  );
}
