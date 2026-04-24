/**
 * OrbitalDiagram — circular constellation of Sentinels with connecting lines.
 * Matches the visual spec from the Agentic Round Table design.
 */
import { useMemo } from "react";

interface SentinelNode {
  id: number;
  name: string;
  emoji: string;
  color?: string;
  isActive?: boolean;
  isDelivering?: boolean;
}

interface OrbitalDiagramProps {
  sentinels: SentinelNode[];
  /** Which sentinel name is currently reasoning (shows glow pulse) */
  activeName?: string | null;
  /** Which sentinel delivered the final answer */
  deliveringSentinelName?: string | null;
  size?: number;
}

// Fallback colors per position
const ORBIT_COLORS = [
  "#22d3ee", // cyan
  "#a78bfa", // violet
  "#fbbf24", // amber
  "#f472b6", // pink
  "#34d399", // emerald
  "#f87171", // red
];

export default function OrbitalDiagram({
  sentinels,
  activeName,
  deliveringSentinelName,
  size = 280,
}: OrbitalDiagramProps) {
  const cx = size / 2;
  const cy = size / 2;
  const orbitR = size * 0.36;
  const nodeR = size * 0.09;
  const centerR = size * 0.08;

  // Compute positions around the orbit
  const nodes = useMemo(() => {
    return sentinels.map((s, i) => {
      const angle = (2 * Math.PI * i) / sentinels.length - Math.PI / 2;
      return {
        ...s,
        x: cx + orbitR * Math.cos(angle),
        y: cy + orbitR * Math.sin(angle),
        color: s.color ?? ORBIT_COLORS[i % ORBIT_COLORS.length],
      };
    });
  }, [sentinels, cx, cy, orbitR]);

  // Draw lines between every pair
  const lines = useMemo(() => {
    const result: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        result.push({
          x1: nodes[i].x,
          y1: nodes[i].y,
          x2: nodes[j].x,
          y2: nodes[j].y,
          key: `${i}-${j}`,
        });
      }
    }
    return result;
  }, [nodes]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="overflow-visible"
      style={{ display: "block" }}
    >
      <defs>
        {/* Glow filter for active node */}
        <filter id="orbital-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Subtle glow for orbit ring */}
        <filter id="ring-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Orbit ring */}
      <circle
        cx={cx}
        cy={cy}
        r={orbitR}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
        strokeDasharray="4 4"
        filter="url(#ring-glow)"
      />

      {/* Connection lines between all pairs */}
      {lines.map((l) => (
        <line
          key={l.key}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
      ))}

      {/* Center hub */}
      <circle
        cx={cx}
        cy={cy}
        r={centerR}
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={centerR * 0.9}
        style={{ userSelect: "none" }}
      >
        ⚡
      </text>

      {/* Sentinel nodes */}
      {nodes.map((node) => {
        const isActive = activeName === node.name;
        const isDelivering = deliveringSentinelName === node.name;
        const glowColor = node.color;

        return (
          <g key={node.id}>
            {/* Active pulse ring */}
            {isActive && (
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeR + 8}
                fill="none"
                stroke={glowColor}
                strokeWidth="1.5"
                strokeOpacity="0.4"
                className="animate-ping"
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
            )}

            {/* Delivering ring (final answer) */}
            {isDelivering && (
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeR + 5}
                fill="none"
                stroke={glowColor}
                strokeWidth="2"
                strokeOpacity="0.7"
              />
            )}

            {/* Node background */}
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeR}
              fill={`${glowColor}18`}
              stroke={glowColor}
              strokeWidth={isActive || isDelivering ? 2 : 1.5}
              strokeOpacity={isActive || isDelivering ? 1 : 0.5}
              filter={isActive ? "url(#orbital-glow)" : undefined}
            />

            {/* Emoji */}
            <text
              x={node.x}
              y={node.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={nodeR * 1.1}
              style={{ userSelect: "none" }}
            >
              {node.emoji}
            </text>

            {/* Name label */}
            <text
              x={node.x}
              y={node.y + nodeR + 13}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill={isActive || isDelivering ? glowColor : "rgba(255,255,255,0.45)"}
              fontFamily="Inter, sans-serif"
              fontWeight={isActive || isDelivering ? "600" : "400"}
              style={{ userSelect: "none" }}
            >
              {node.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
