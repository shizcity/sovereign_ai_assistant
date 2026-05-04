/**
 * Pre-built Round Table configurations.
 * Each preset defines a deliberation mode, a curated Sentinel lineup by slug,
 * a suggested question placeholder, and a short description.
 *
 * Sentinel slugs (from ROUTING_PROFILES):
 *   vixens-den | mischief-exe | lunaris-vault | aetheris-flow | rift-exe | nyx
 */

export type DeliberationMode = "turn-based" | "shared-context" | "synchronous";

export interface RoundTablePreset {
  id: string;
  label: string;
  icon: string;
  tagline: string;
  description: string;
  sentinelSlugs: string[];
  mode: DeliberationMode;
  maxRounds: number;
  questionPlaceholder: string;
  accentColor: string; // Tailwind color token for the card accent
}

export const ROUND_TABLE_PRESETS: RoundTablePreset[] = [
  {
    id: "strategy-session",
    label: "Strategy Session",
    icon: "♟️",
    tagline: "Structure meets synthesis",
    description:
      "Vixen brings execution rigour, Nyx connects the big picture, and Lunaris grounds decisions in research. Best for business decisions, roadmaps, and goal-setting.",
    sentinelSlugs: ["vixens-den", "lunaris-vault", "nyx"],
    mode: "shared-context",
    maxRounds: 3,
    questionPlaceholder: "What should our Q3 priorities be given the current market conditions?",
    accentColor: "cyan",
  },
  {
    id: "devils-advocate",
    label: "Devil's Advocate",
    icon: "🌀",
    tagline: "Challenge every assumption",
    description:
      "Rift and Mischief attack your idea from opposite angles while Vixen stress-tests the plan. Best for pressure-testing decisions before you commit.",
    sentinelSlugs: ["rift-exe", "mischief-exe", "vixens-den"],
    mode: "turn-based",
    maxRounds: 4,
    questionPlaceholder: "Here's my plan — what are the strongest arguments against it?",
    accentColor: "rose",
  },
  {
    id: "creative-brainstorm",
    label: "Creative Brainstorm",
    icon: "⚡",
    tagline: "Diverge before you converge",
    description:
      "Mischief generates wild ideas, Aetheris brings emotional resonance, and Nyx synthesises patterns. Best for naming, campaigns, product concepts, and creative blocks.",
    sentinelSlugs: ["mischief-exe", "aetheris-flow", "nyx"],
    mode: "synchronous",
    maxRounds: 2,
    questionPlaceholder: "Generate 10 unexpected angles for our new product launch campaign.",
    accentColor: "violet",
  },
  {
    id: "deep-research",
    label: "Deep Research",
    icon: "🌙",
    tagline: "Know before you act",
    description:
      "Lunaris leads the research, Nyx finds cross-domain patterns, and Rift surfaces the contradictions. Best for due diligence, learning a new domain, or building a knowledge base.",
    sentinelSlugs: ["lunaris-vault", "nyx", "rift-exe"],
    mode: "shared-context",
    maxRounds: 3,
    questionPlaceholder: "What do I need to understand about [topic] before making a decision?",
    accentColor: "indigo",
  },
  {
    id: "life-decision",
    label: "Life Decision",
    icon: "🌊",
    tagline: "Head, heart, and horizon",
    description:
      "Aetheris holds the emotional truth, Vixen maps the practical path, and Lunaris provides context. Best for career pivots, relationships, and major life choices.",
    sentinelSlugs: ["aetheris-flow", "vixens-den", "lunaris-vault"],
    mode: "turn-based",
    maxRounds: 3,
    questionPlaceholder: "I'm considering a major change — help me think through all dimensions.",
    accentColor: "emerald",
  },
];
