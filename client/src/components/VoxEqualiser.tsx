/**
 * VoxEqualiser — 3-bar animated equaliser icon
 *
 * Shown in the Chat header while VOX audio is streaming.
 * Uses pure CSS keyframe animations (no JS timers) for smooth,
 * GPU-accelerated bar bounce. Each bar has a different delay so
 * they appear to dance independently.
 */

import { cn } from "@/lib/utils";

interface VoxEqualiserProps {
  /** Whether audio is currently playing */
  active: boolean;
  className?: string;
}

export function VoxEqualiser({ active, className }: VoxEqualiserProps) {
  if (!active) return null;

  return (
    <span
      className={cn("inline-flex items-end gap-[2px] h-4", className)}
      aria-label="Voice playing"
      title="Voice is playing"
    >
      {/* Bar 1 — tallest, slowest */}
      <span
        className="w-[3px] rounded-full bg-cyan-400"
        style={{
          height: "100%",
          animation: "vox-bar 0.9s ease-in-out infinite alternate",
          animationDelay: "0ms",
        }}
      />
      {/* Bar 2 — medium, medium speed */}
      <span
        className="w-[3px] rounded-full bg-cyan-300"
        style={{
          height: "60%",
          animation: "vox-bar 0.7s ease-in-out infinite alternate",
          animationDelay: "150ms",
        }}
      />
      {/* Bar 3 — shortest, fastest */}
      <span
        className="w-[3px] rounded-full bg-cyan-400"
        style={{
          height: "80%",
          animation: "vox-bar 0.8s ease-in-out infinite alternate",
          animationDelay: "75ms",
        }}
      />
    </span>
  );
}
