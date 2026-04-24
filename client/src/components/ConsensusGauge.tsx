/**
 * ConsensusGauge — animated circular SVG dial showing agreement score 0–1.
 * Matches the visual spec from the Agentic Round Table design.
 */
interface ConsensusGaugeProps {
  score: number;          // 0–1
  isRunning?: boolean;    // show pulsing animation while deliberating
  size?: number;
}

export default function ConsensusGauge({ score, isRunning = false, size = 160 }: ConsensusGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeW = size * 0.055;

  // Arc parameters — full circle
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score));
  const dashOffset = circumference * (1 - pct);

  // Color based on score
  const trackColor = "rgba(255,255,255,0.06)";
  const arcColor =
    pct >= 0.7 ? "#22d3ee"   // cyan — consensus
    : pct >= 0.5 ? "#fbbf24" // amber — partial
    : "#f87171";             // red — low

  const labelColor =
    pct >= 0.7 ? "#22d3ee"
    : pct >= 0.5 ? "#fbbf24"
    : "#f87171";

  const statusText =
    isRunning ? "Deliberating"
    : pct >= 0.7 ? "Consensus"
    : pct >= 0.5 ? "Partial"
    : pct > 0 ? "Divergent"
    : "Awaiting";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
    >
      <defs>
        <filter id="gauge-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeW}
      />

      {/* Progress arc — starts at top (−90°) */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={arcColor}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
        filter={pct > 0 ? "url(#gauge-glow)" : undefined}
        style={{
          transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease",
        }}
      />

      {/* Running pulse ring */}
      {isRunning && (
        <circle
          cx={cx}
          cy={cy}
          r={r + strokeW}
          fill="none"
          stroke="rgba(6,182,212,0.15)"
          strokeWidth="2"
          className="animate-ping"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      )}

      {/* Score number */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.22}
        fontWeight="700"
        fontFamily="'JetBrains Mono', 'Fira Code', monospace"
        fill={labelColor}
        style={{ transition: "fill 0.4s ease" }}
      >
        {pct.toFixed(2)}
      </text>

      {/* Status label */}
      <text
        x={cx}
        y={cy + size * 0.14}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.085}
        fontFamily="Inter, sans-serif"
        fill="rgba(255,255,255,0.35)"
        letterSpacing="0.08em"
        style={{ textTransform: "uppercase" }}
      >
        {statusText.toUpperCase()}
      </text>
    </svg>
  );
}
