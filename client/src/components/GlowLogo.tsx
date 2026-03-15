import { cn } from "@/lib/utils";

interface GlowLogoProps {
  /** Size variant — controls icon and text scale */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether to show the wordmark next to the icon */
  showWordmark?: boolean;
  /** Whether to show the tagline below the wordmark */
  showTagline?: boolean;
  /** Extra class names for the wrapper */
  className?: string;
}

const sizeMap = {
  sm: {
    icon: "w-6 h-6",
    inner: "w-3 h-3",
    ring: "w-8 h-8",
    text: "text-base",
    tagline: "text-[10px]",
    gap: "gap-2",
  },
  md: {
    icon: "w-8 h-8",
    inner: "w-4 h-4",
    ring: "w-10 h-10",
    text: "text-xl",
    tagline: "text-[11px]",
    gap: "gap-2.5",
  },
  lg: {
    icon: "w-10 h-10",
    inner: "w-5 h-5",
    ring: "w-13 h-13",
    text: "text-2xl",
    tagline: "text-xs",
    gap: "gap-3",
  },
  xl: {
    icon: "w-14 h-14",
    inner: "w-7 h-7",
    ring: "w-18 h-18",
    text: "text-4xl",
    tagline: "text-sm",
    gap: "gap-4",
  },
};

export function GlowLogo({
  size = "md",
  showWordmark = true,
  showTagline = false,
  className,
}: GlowLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      {/* Icon with layered glow rings */}
      <div className="relative flex items-center justify-center flex-shrink-0">
        {/* Outer animated pulse ring */}
        <span
          className={cn(
            "absolute rounded-xl opacity-30 animate-ping",
            s.ring
          )}
          style={{
            background:
              "conic-gradient(from 0deg, oklch(0.75 0.2 200), oklch(0.65 0.22 280), oklch(0.75 0.2 200))",
            animationDuration: "2.5s",
          }}
        />
        {/* Static glow halo */}
        <span
          className={cn("absolute rounded-xl blur-md opacity-50", s.ring)}
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.22 200 / 0.7) 0%, oklch(0.55 0.2 260 / 0.3) 70%, transparent 100%)",
          }}
        />
        {/* Icon body */}
        <div
          className={cn(
            "relative rounded-xl flex items-center justify-center shadow-lg",
            s.icon
          )}
          style={{
            background:
              "linear-gradient(135deg, oklch(0.75 0.22 200) 0%, oklch(0.55 0.25 270) 100%)",
            boxShadow:
              "0 0 20px oklch(0.75 0.22 200 / 0.5), 0 0 40px oklch(0.55 0.25 270 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.2)",
          }}
        >
          {/* Sparkle / star icon drawn inline to avoid import coupling */}
          <svg
            className={cn(s.inner, "text-white drop-shadow-sm")}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
            <path
              d="M19 2l.9 2.7L22 5.6l-2.1.9L19 9l-.9-2.5L16 5.6l2.1-.9L19 2z"
              opacity="0.7"
            />
            <path
              d="M5 14l.6 1.8L7.4 16.4l-1.8.6L5 19l-.6-1.8L2.6 16.4l1.8-.6L5 14z"
              opacity="0.5"
            />
          </svg>
        </div>
      </div>

      {/* Wordmark + optional tagline */}
      {showWordmark && (
        <div className="min-w-0 leading-none">
          <span
            className={cn(
              "font-black tracking-tight bg-clip-text text-transparent block",
              s.text
            )}
            style={{
              backgroundImage:
                "linear-gradient(90deg, oklch(0.88 0.18 195) 0%, oklch(0.78 0.2 220) 40%, oklch(0.7 0.22 270) 100%)",
              WebkitBackgroundClip: "text",
              filter: "drop-shadow(0 0 12px oklch(0.75 0.22 200 / 0.4))",
            }}
          >
            Glow
          </span>
          {showTagline && (
            <span className={cn("text-white/40 font-medium mt-0.5 block truncate", s.tagline)}>
              Your AI. Your Rules.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
