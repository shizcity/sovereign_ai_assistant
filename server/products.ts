/**
 * Stripe product and pricing configuration
 * Defines subscription tiers and their features
 */

export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: "Free",
    price: 0,
    stripePriceId: "", // No Stripe price for free tier
    features: {
      messagesPerMonth: 50,
      sentinelsAccess: 3, // Vixen, Mischief, Lunaris
      multiSentinelConversations: false,
      voiceMode: false,
      memoryRetentionDays: 30,
      templateCreation: false,
      prioritySupport: false,
    },
  },
  PRO: {
    name: "Pro",
    price: 19, // $19/month
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "", // Will be created dynamically if empty
    features: {
      messagesPerMonth: -1, // Unlimited
      sentinelsAccess: 6, // All Sentinels
      multiSentinelConversations: true,
      voiceMode: true,
      memoryRetentionDays: -1, // Unlimited
      templateCreation: true,
      prioritySupport: true,
    },
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

/**
 * Check if a user has access to a specific feature based on their tier
 */
export function hasFeatureAccess(
  tier: string,
  feature: keyof typeof SUBSCRIPTION_TIERS.FREE.features
): boolean {
  const tierData = SUBSCRIPTION_TIERS[tier as SubscriptionTier];
  if (!tierData) return false;
  
  const featureValue = tierData.features[feature];
  if (typeof featureValue === "boolean") return featureValue;
  if (typeof featureValue === "number") return featureValue > 0 || featureValue === -1;
  
  return false;
}

/**
 * Get the message limit for a tier (-1 means unlimited)
 */
export function getMessageLimit(tier: string): number {
  const tierData = SUBSCRIPTION_TIERS[tier as SubscriptionTier];
  return tierData?.features.messagesPerMonth ?? SUBSCRIPTION_TIERS.FREE.features.messagesPerMonth;
}
