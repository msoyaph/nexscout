export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro'
} as const;

export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS];

export interface TierLimits {
  dailyScans: number | 'unlimited';
  dailyMessages: number | 'unlimited';
  weeklyPresentations: number | 'unlimited';
  maxAdsPerDay: number;
  coinsPerAd: number;
  visibleSwipeCards: number | 'unlimited';
  pipelineStages: number;
  hasDeepScan: boolean;
  hasAffordabilityScore: boolean;
  hasLeadershipScore: boolean;
  hasMultiStepSequences: boolean;
  hasAdvancedInsights: boolean;
  hasTeamFeatures: boolean;
  hasNoAds: boolean;
  hasPriorityQueue: boolean;
  hasOmniChannel: boolean;
  hasAutonomousCloser: boolean;
  hasEmotionalPersuasion: boolean;
  hasCompanyIntelligenceV3: boolean;
  hasCompanyIntelligenceV6: boolean;
  hasFollowUp: boolean;
  followUpDuration: '7-day' | '30-day' | 'custom' | 'none';
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  [SUBSCRIPTION_TIERS.FREE]: {
    dailyScans: 3,
    dailyMessages: 3,
    weeklyPresentations: 1,
    maxAdsPerDay: 2,
    coinsPerAd: 2,
    visibleSwipeCards: 1,
    pipelineStages: 3,
    hasDeepScan: false,
    hasAffordabilityScore: false,
    hasLeadershipScore: false,
    hasMultiStepSequences: false,
    hasAdvancedInsights: false,
    hasTeamFeatures: false,
    hasNoAds: false,
    hasPriorityQueue: false,
    hasOmniChannel: false,
    hasAutonomousCloser: false,
    hasEmotionalPersuasion: false,
    hasCompanyIntelligenceV3: false,
    hasCompanyIntelligenceV6: false,
    hasFollowUp: false,
    followUpDuration: 'none'
  },
  [SUBSCRIPTION_TIERS.PRO]: {
    dailyScans: 'unlimited',
    dailyMessages: 'unlimited',
    weeklyPresentations: 'unlimited',
    maxAdsPerDay: 0,
    coinsPerAd: 0,
    visibleSwipeCards: 'unlimited',
    pipelineStages: 8,
    hasDeepScan: true,
    hasAffordabilityScore: true,
    hasLeadershipScore: true,
    hasMultiStepSequences: true,
    hasAdvancedInsights: true,
    hasTeamFeatures: false,
    hasNoAds: true,
    hasPriorityQueue: true,
    hasOmniChannel: true,
    hasAutonomousCloser: true,
    hasEmotionalPersuasion: true,
    hasCompanyIntelligenceV3: true,
    hasCompanyIntelligenceV6: true,
    hasFollowUp: true,
    followUpDuration: '30-day'
  }
};

export interface TierPricing {
  monthly: number;
  annual: number;
  currency: string;
  weeklyCoins: number;
  displayName: string;
  badge: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

export const TIER_PRICING: Record<SubscriptionTier, TierPricing> = {
  [SUBSCRIPTION_TIERS.FREE]: {
    monthly: 0,
    annual: 0,
    currency: '₱',
    weeklyCoins: 35,
    displayName: 'Free',
    badge: 'Free Forever',
    color: '#6B7280',
    gradientFrom: '#9CA3AF',
    gradientTo: '#6B7280'
  },
  [SUBSCRIPTION_TIERS.PRO]: {
    monthly: 1299,
    annual: 12990,
    currency: '₱',
    weeklyCoins: 500,
    displayName: 'Pro – AI Power Closer',
    badge: 'Best Value',
    color: '#9333EA',
    gradientFrom: '#A855F7',
    gradientTo: '#EC4899'
  }
};

export const COIN_COSTS = {
  SCAN: 10,
  DEEP_SCAN: 20,
  MESSAGE_GENERATION: 5,
  PITCH_DECK: 30,
  REVIVAL: 10,
  OMNI_CHANNEL_WEB: 0,
  OMNI_CHANNEL_MESSENGER: 3,
  OMNI_CHANNEL_INSTAGRAM: 3,
  OMNI_CHANNEL_WHATSAPP: 5,
  OMNI_CHANNEL_VIBER: 4,
  OMNI_CHANNEL_SMS: 5,
  OMNI_CHANNEL_EMAIL: 2,
  AI_ANALYSIS: 8,
  VOICE_CLOSER: 15,
  REVEAL_PROSPECT: 10,
  EXTRA_MESSAGE: 5,
  EXTRA_PRESENTATION: 15,
  SPEED_SCAN: 8,
  UNLOCK_ADDON: 20,
  UNLOCK_DEEP_SCAN: 25,
  UNLOCK_PRO_TEMPLATE: 20
};

export const getTierLimits = (tier: string): TierLimits => {
  const normalizedTier = normalizeTier(tier);
  return TIER_LIMITS[normalizedTier] || TIER_LIMITS[SUBSCRIPTION_TIERS.FREE];
};

export const getTierPricing = (tier: string): TierPricing => {
  const normalizedTier = normalizeTier(tier);
  return TIER_PRICING[normalizedTier] || TIER_PRICING[SUBSCRIPTION_TIERS.FREE];
};

export const canAccessFeature = (tier: string, feature: keyof TierLimits): boolean => {
  const limits = getTierLimits(tier);
  return limits[feature] as boolean;
};

export const hasReachedLimit = (
  tier: string,
  limitType: 'dailyScans' | 'dailyMessages' | 'weeklyPresentations',
  currentUsage: number
): boolean => {
  const limits = getTierLimits(tier);
  const limit = limits[limitType];
  if (limit === 'unlimited') return false;
  return currentUsage >= (limit as number);
};

export const normalizeTier = (tier: string): SubscriptionTier => {
  const lowerTier = tier.toLowerCase();

  // Map old tiers to new tiers
  if (lowerTier === 'free' || lowerTier === 'starter') return 'free';
  if (lowerTier === 'pro' || lowerTier === 'elite' || lowerTier === 'team' || lowerTier === 'enterprise') return 'pro';

  return 'free';
};
