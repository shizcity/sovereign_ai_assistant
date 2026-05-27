/**
 * Tier utility helpers — single source of truth for subscription tier checks.
 * Import from here instead of inlining tier string comparisons across the codebase.
 */

export type SubscriptionTier = "free" | "pro" | "creator";

/** Returns true for Pro and Creator subscribers. */
export function isProOrAbove(tier: string | null | undefined): boolean {
  const t = (tier ?? "free").toLowerCase();
  return t === "pro" || t === "creator";
}

/** Returns true for Creator subscribers only. */
export function isCreatorOrAbove(tier: string | null | undefined): boolean {
  return (tier ?? "free").toLowerCase() === "creator";
}

/** Human-readable tier label with capitalisation. */
export function getTierLabel(tier: string | null | undefined): string {
  const t = (tier ?? "free").toLowerCase();
  if (t === "creator") return "Creator";
  if (t === "pro") return "Pro";
  return "Free";
}

/** Returns the next upgrade tier, or null if already at the top. */
export function getNextTier(tier: string | null | undefined): SubscriptionTier | null {
  const t = (tier ?? "free").toLowerCase();
  if (t === "free") return "pro";
  if (t === "pro") return "creator";
  return null;
}
