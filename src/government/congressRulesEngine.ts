/**
 * Congress Rules Engine
 *
 * PURPOSE:
 * This is the legislative branch of NexScout Government. It defines all business rules:
 * - Tier definitions and pricing
 * - Permissions per tier
 * - Job costs (coins + energy)
 * - Rate limits
 * - Upgrade recommendations
 *
 * ROLE:
 * Every AI operation consults Congress to check permissions and costs.
 * Congress centralizes all business logic for tiers and pricing.
 *
 * INTEGRATION:
 * - Master Orchestrator calls Congress before every job
 * - UI components call Congress for feature availability
 * - Upgrade flows use Congress for recommendations
 */

import type {
  SubscriptionTier,
  OrchestratorJobType,
  CongressJobCost,
  CongressRateLimit,
  CongressPermissionResult,
  TierConfig,
  UsageStats,
  UpgradeRecommendation,
  ModelClass,
  JobPriority,
} from './types/government';

// ============================================================================
// TIER CONFIGURATIONS
// ============================================================================

/**
 * PURPOSE: Define all subscription tiers with features and limits
 * NOTE: These are the source of truth for tier capabilities
 */
const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  free: {
    tier: 'free',
    name: 'Free',
    monthlyPrice: 0,
    currency: 'PHP',
    description: 'Perfect for trying out NexScout',
    features: [
      '3 Scans per day',
      '3 AI Messages per day',
      '1 Pitch Deck per week',
      'Lite Company Intelligence',
      'Website Chatbot only',
      'Basic AI models',
      'Community support',
    ],
    limits: {
      scansPerDay: 3,
      messagesPerDay: 3,
      pitchDecksPerWeek: 1,
      companyIntelligence: 'lite',
      chatbotMode: 'website_only',
      modelQuality: 'CHEAP',
      priority: 'LOW',
    },
    energyCapacity: 100,
    energyRegenPerHour: 10,
  },

  pro: {
    tier: 'pro',
    name: 'Pro',
    monthlyPrice: 1299,
    currency: 'PHP',
    description: 'For serious sales professionals',
    features: [
      'Unlimited Scans',
      'Unlimited AI Messages',
      'Unlimited Pitch Decks',
      'Deep Scan v2',
      'Multi-channel Chatbot (Web + FB + IG)',
      'Standard AI models',
      'Company Intelligence',
      'Priority support',
    ],
    limits: {
      scansPerDay: 999,
      messagesPerDay: 999,
      pitchDecksPerWeek: 999,
      companyIntelligence: 'standard',
      chatbotMode: 'multi_channel',
      modelQuality: 'STANDARD',
      priority: 'NORMAL',
    },
    energyCapacity: 250,
    energyRegenPerHour: 25,
  },

  team: {
    tier: 'team',
    name: 'Team',
    monthlyPrice: 4990,
    currency: 'PHP',
    description: 'For growing sales teams',
    features: [
      'Everything in Pro',
      '5+ seats included',
      'Shared pipelines',
      'Team dashboards',
      'Pooled coins & energy',
      'Advanced Company Intelligence',
      'Team collaboration tools',
      'Priority support',
    ],
    limits: {
      scansPerDay: 999,
      messagesPerDay: 999,
      pitchDecksPerWeek: 999,
      companyIntelligence: 'advanced',
      chatbotMode: 'multi_channel',
      modelQuality: 'STANDARD',
      priority: 'HIGH',
      seatsIncluded: 5,
      teamFeatures: true,
    },
    energyCapacity: 400,
    energyRegenPerHour: 40,
  },

  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 30000,
    currency: 'PHP',
    description: 'For large organizations',
    features: [
      'Everything in Team',
      'Unlimited seats',
      'Custom limits',
      'Premium AI models',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'Bulk pricing',
    ],
    limits: {
      scansPerDay: 9999,
      messagesPerDay: 9999,
      pitchDecksPerWeek: 9999,
      companyIntelligence: 'advanced',
      chatbotMode: 'enterprise',
      modelQuality: 'PREMIUM',
      priority: 'CRITICAL',
      seatsIncluded: 999,
      teamFeatures: true,
    },
    energyCapacity: 1000,
    energyRegenPerHour: 100,
  },
};

// ============================================================================
// JOB COSTS BY TIER
// ============================================================================

/**
 * PURPOSE: Define costs for each job type per tier
 * NOTE: Lower tiers pay more, higher tiers pay less (incentive to upgrade)
 */
const JOB_COSTS: Record<OrchestratorJobType, Record<SubscriptionTier, CongressJobCost>> = {
  SCAN: {
    free: { coinCost: 5, energyCost: 20, modelClass: 'CHEAP', priority: 'LOW' },
    pro: { coinCost: 0, energyCost: 15, modelClass: 'STANDARD', priority: 'NORMAL' },
    team: { coinCost: 0, energyCost: 12, modelClass: 'STANDARD', priority: 'HIGH' },
    enterprise: { coinCost: 0, energyCost: 10, modelClass: 'PREMIUM', priority: 'CRITICAL' },
  },

  MESSAGE: {
    free: { coinCost: 3, energyCost: 15, modelClass: 'CHEAP', priority: 'LOW' },
    pro: { coinCost: 0, energyCost: 10, modelClass: 'STANDARD', priority: 'NORMAL' },
    team: { coinCost: 0, energyCost: 8, modelClass: 'STANDARD', priority: 'HIGH' },
    enterprise: { coinCost: 0, energyCost: 6, modelClass: 'PREMIUM', priority: 'CRITICAL' },
  },

  PITCH_DECK: {
    free: { coinCost: 50, energyCost: 40, modelClass: 'CHEAP', priority: 'LOW' },
    pro: { coinCost: 30, energyCost: 30, modelClass: 'STANDARD', priority: 'NORMAL' },
    team: { coinCost: 20, energyCost: 25, modelClass: 'STANDARD', priority: 'HIGH' },
    enterprise: { coinCost: 0, energyCost: 20, modelClass: 'PREMIUM', priority: 'CRITICAL' },
  },

  CHATBOT: {
    free: { coinCost: 0, energyCost: 10, modelClass: 'CHEAP', priority: 'LOW' },
    pro: { coinCost: 0, energyCost: 8, modelClass: 'STANDARD', priority: 'NORMAL' },
    team: { coinCost: 0, energyCost: 6, modelClass: 'STANDARD', priority: 'HIGH' },
    enterprise: { coinCost: 0, energyCost: 5, modelClass: 'PREMIUM', priority: 'CRITICAL' },
  },

  FOLLOW_UP: {
    free: { coinCost: 2, energyCost: 12, modelClass: 'CHEAP', priority: 'LOW' },
    pro: { coinCost: 0, energyCost: 10, modelClass: 'STANDARD', priority: 'NORMAL' },
    team: { coinCost: 0, energyCost: 8, modelClass: 'STANDARD', priority: 'HIGH' },
    enterprise: { coinCost: 0, energyCost: 6, modelClass: 'PREMIUM', priority: 'CRITICAL' },
  },

  COMPANY_INTELLIGENCE: {
    free: { coinCost: 10, energyCost: 25, modelClass: 'CHEAP', priority: 'LOW' },
    pro: { coinCost: 0, energyCost: 20, modelClass: 'STANDARD', priority: 'NORMAL' },
    team: { coinCost: 0, energyCost: 15, modelClass: 'STANDARD', priority: 'HIGH' },
    enterprise: { coinCost: 0, energyCost: 12, modelClass: 'PREMIUM', priority: 'CRITICAL' },
  },

  PUBLIC_CHATBOT: {
    free: { coinCost: 0, energyCost: 5, modelClass: 'CHEAP', priority: 'LOW' },
    pro: { coinCost: 0, energyCost: 4, modelClass: 'STANDARD', priority: 'NORMAL' },
    team: { coinCost: 0, energyCost: 3, modelClass: 'STANDARD', priority: 'HIGH' },
    enterprise: { coinCost: 0, energyCost: 2, modelClass: 'PREMIUM', priority: 'CRITICAL' },
  },

  ANALYTICS_QUERY: {
    free: { coinCost: 2, energyCost: 8, modelClass: 'CHEAP', priority: 'LOW' },
    pro: { coinCost: 0, energyCost: 6, modelClass: 'STANDARD', priority: 'NORMAL' },
    team: { coinCost: 0, energyCost: 5, modelClass: 'STANDARD', priority: 'HIGH' },
    enterprise: { coinCost: 0, energyCost: 4, modelClass: 'PREMIUM', priority: 'CRITICAL' },
  },
};

// ============================================================================
// RATE LIMITS BY JOB TYPE AND TIER
// ============================================================================

/**
 * PURPOSE: Define rate limits to prevent abuse
 * NOTE: Higher tiers get higher limits
 */
const RATE_LIMITS: Record<OrchestratorJobType, Record<SubscriptionTier, CongressRateLimit>> = {
  SCAN: {
    free: { maxPerDay: 3, maxPerHour: 2 },
    pro: { maxPerDay: 200, maxPerHour: 50 },
    team: { maxPerDay: 500, maxPerHour: 100 },
    enterprise: { maxPerDay: 5000, maxPerHour: 500 },
  },

  MESSAGE: {
    free: { maxPerDay: 3, maxPerHour: 2 },
    pro: { maxPerDay: 500, maxPerHour: 100 },
    team: { maxPerDay: 1000, maxPerHour: 200 },
    enterprise: { maxPerDay: 10000, maxPerHour: 1000 },
  },

  PITCH_DECK: {
    free: { maxPerDay: 1, maxPerHour: 1 },
    pro: { maxPerDay: 50, maxPerHour: 10 },
    team: { maxPerDay: 100, maxPerHour: 25 },
    enterprise: { maxPerDay: 1000, maxPerHour: 100 },
  },

  CHATBOT: {
    free: { maxPerDay: 100, maxPerHour: 20 },
    pro: { maxPerDay: 1000, maxPerHour: 200 },
    team: { maxPerDay: 2500, maxPerHour: 500 },
    enterprise: { maxPerDay: 20000, maxPerHour: 2000 },
  },

  FOLLOW_UP: {
    free: { maxPerDay: 10, maxPerHour: 5 },
    pro: { maxPerDay: 400, maxPerHour: 100 },
    team: { maxPerDay: 800, maxPerHour: 200 },
    enterprise: { maxPerDay: 10000, maxPerHour: 1000 },
  },

  COMPANY_INTELLIGENCE: {
    free: { maxPerDay: 2, maxPerHour: 1 },
    pro: { maxPerDay: 100, maxPerHour: 20 },
    team: { maxPerDay: 250, maxPerHour: 50 },
    enterprise: { maxPerDay: 2000, maxPerHour: 200 },
  },

  PUBLIC_CHATBOT: {
    free: { maxPerDay: 200, maxPerHour: 50 },
    pro: { maxPerDay: 2000, maxPerHour: 500 },
    team: { maxPerDay: 5000, maxPerHour: 1000 },
    enterprise: { maxPerDay: 50000, maxPerHour: 5000 },
  },

  ANALYTICS_QUERY: {
    free: { maxPerDay: 20, maxPerHour: 10 },
    pro: { maxPerDay: 200, maxPerHour: 50 },
    team: { maxPerDay: 500, maxPerHour: 100 },
    enterprise: { maxPerDay: 5000, maxPerHour: 500 },
  },
};

// ============================================================================
// TIER PERMISSIONS
// ============================================================================

/**
 * PURPOSE: Define which job types are allowed per tier
 * NOTE: Some features require higher tiers
 */
const TIER_PERMISSIONS: Record<OrchestratorJobType, { minimumTier: SubscriptionTier; reason: string }> = {
  SCAN: {
    minimumTier: 'free',
    reason: 'Scanning is available on all tiers',
  },
  MESSAGE: {
    minimumTier: 'free',
    reason: 'AI messaging is available on all tiers',
  },
  PITCH_DECK: {
    minimumTier: 'free',
    reason: 'Pitch decks are available on all tiers with limits',
  },
  CHATBOT: {
    minimumTier: 'free',
    reason: 'Basic chatbot available on Free tier',
  },
  FOLLOW_UP: {
    minimumTier: 'free',
    reason: 'Follow-ups available on all tiers',
  },
  COMPANY_INTELLIGENCE: {
    minimumTier: 'free',
    reason: 'Lite company intelligence on Free, full on Pro+',
  },
  PUBLIC_CHATBOT: {
    minimumTier: 'free',
    reason: 'Public chatbot available on all tiers',
  },
  ANALYTICS_QUERY: {
    minimumTier: 'free',
    reason: 'Analytics available on all tiers',
  },
};

// ============================================================================
// CONGRESS API
// ============================================================================

/**
 * PURPOSE: Get tier configuration
 * INPUT: SubscriptionTier
 * OUTPUT: TierConfig with all tier details
 */
function getTierConfig(tier: SubscriptionTier): TierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * PURPOSE: Check if user can run a specific job type
 * INPUT: jobType and user's tier
 * OUTPUT: Permission result with allowed status and reason
 */
function canUserRunJob(
  jobType: OrchestratorJobType,
  tier: SubscriptionTier
): CongressPermissionResult {
  const permission = TIER_PERMISSIONS[jobType];

  if (!permission) {
    return {
      allowed: false,
      reason: `Job type ${jobType} is not configured`,
    };
  }

  const tierOrder: SubscriptionTier[] = ['free', 'pro', 'team', 'enterprise'];
  const userTierIndex = tierOrder.indexOf(tier);
  const requiredTierIndex = tierOrder.indexOf(permission.minimumTier);

  if (userTierIndex < requiredTierIndex) {
    return {
      allowed: false,
      reason: permission.reason,
      requiredTier: permission.minimumTier,
      upgradeMessage: `Upgrade to ${permission.minimumTier} to unlock this feature`,
    };
  }

  return {
    allowed: true,
    reason: permission.reason,
  };
}

/**
 * PURPOSE: Get job costs for a specific job type and tier
 * INPUT: jobType, tier, optional payloadSize
 * OUTPUT: CongressJobCost with coin, energy, model, and priority
 */
function getJobCosts(
  jobType: OrchestratorJobType,
  tier: SubscriptionTier,
  payloadSize?: number
): CongressJobCost {
  const baseCost = JOB_COSTS[jobType]?.[tier];

  if (!baseCost) {
    return {
      coinCost: 10,
      energyCost: 20,
      modelClass: 'CHEAP',
      priority: 'LOW',
    };
  }

  let adjustedCost = { ...baseCost };

  if (payloadSize && payloadSize > 10000) {
    const multiplier = 1 + Math.floor(payloadSize / 10000) * 0.1;
    adjustedCost.energyCost = Math.ceil(adjustedCost.energyCost * multiplier);
  }

  return adjustedCost;
}

/**
 * PURPOSE: Get rate limits for a job type and tier
 * INPUT: jobType and tier
 * OUTPUT: CongressRateLimit with daily and hourly limits
 */
function getRateLimits(
  jobType: OrchestratorJobType,
  tier: SubscriptionTier
): CongressRateLimit {
  const limits = RATE_LIMITS[jobType]?.[tier];

  if (!limits) {
    return {
      maxPerDay: 10,
      maxPerHour: 5,
    };
  }

  return limits;
}

/**
 * PURPOSE: Determine if user should see upgrade nudge
 * INPUT: jobType, tier, and current usage stats
 * OUTPUT: Boolean indicating if upgrade nudge should show
 */
function shouldShowUpgradeNudge(
  jobType: OrchestratorJobType,
  tier: SubscriptionTier,
  usageStats: UsageStats
): boolean {
  if (tier === 'enterprise') return false;

  const limits = TIER_CONFIGS[tier].limits;

  if (jobType === 'SCAN' && usageStats.scansToday >= limits.scansPerDay * 0.8) {
    return true;
  }

  if (jobType === 'MESSAGE' && usageStats.messagesToday >= limits.messagesPerDay * 0.8) {
    return true;
  }

  if (jobType === 'PITCH_DECK' && usageStats.pitchDecksThisWeek >= limits.pitchDecksPerWeek * 0.8) {
    return true;
  }

  if (usageStats.energyRemaining < 30) {
    return true;
  }

  if (usageStats.coinsRemaining < 20 && tier === 'free') {
    return true;
  }

  return false;
}

/**
 * PURPOSE: Suggest which tier user should upgrade to
 * INPUT: jobType and current tier
 * OUTPUT: Recommended tier or null if already at max
 */
function suggestUpgradePlan(
  jobType: OrchestratorJobType,
  currentTier: SubscriptionTier
): SubscriptionTier | null {
  const tierOrder: SubscriptionTier[] = ['free', 'pro', 'team', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === tierOrder.length - 1) {
    return null;
  }

  if (currentTier === 'free') {
    return 'pro';
  }

  if (currentTier === 'pro' && jobType === 'COMPANY_INTELLIGENCE') {
    return 'team';
  }

  return tierOrder[currentIndex + 1];
}

/**
 * PURPOSE: Get tier feature summary for UI cards
 * INPUT: SubscriptionTier
 * OUTPUT: Formatted feature list for display
 */
function getTierFeatureSummary(tier: SubscriptionTier): string[] {
  return TIER_CONFIGS[tier].features;
}

/**
 * PURPOSE: Get upgrade reasons for paywall
 * INPUT: tier and jobType
 * OUTPUT: Array of compelling reasons to upgrade
 */
function getUpgradeReasons(tier: SubscriptionTier, jobType: OrchestratorJobType): string[] {
  const reasons: string[] = [];

  if (tier === 'free') {
    reasons.push('Remove daily limits on scans and messages');
    reasons.push('Get unlimited AI-generated pitch decks');
    reasons.push('Access multi-channel chatbot (Facebook + Instagram)');
    reasons.push('Use better AI models for higher quality results');
    reasons.push('Get priority support');
  }

  if (tier === 'pro') {
    reasons.push('Add team members and collaborate');
    reasons.push('Get pooled coins and energy for your team');
    reasons.push('Access advanced company intelligence');
    reasons.push('Use team dashboards and shared pipelines');
  }

  if (tier === 'team') {
    reasons.push('Get unlimited seats');
    reasons.push('Access premium AI models');
    reasons.push('Get dedicated support with SLA');
    reasons.push('Custom integrations available');
  }

  if (jobType === 'COMPANY_INTELLIGENCE') {
    reasons.push('Deep company research with AI');
    reasons.push('Extract value propositions automatically');
    reasons.push('Build knowledge graphs of companies');
  }

  return reasons;
}

/**
 * PURPOSE: Get comprehensive upgrade recommendation
 * INPUT: current tier, job type, and usage stats
 * OUTPUT: Full upgrade recommendation with benefits
 */
function getUpgradeRecommendation(
  currentTier: SubscriptionTier,
  jobType: OrchestratorJobType,
  usageStats: UsageStats
): UpgradeRecommendation {
  const suggestedTier = suggestUpgradePlan(jobType, currentTier);

  if (!suggestedTier) {
    return {
      shouldUpgrade: false,
      suggestedTier: currentTier,
      reasons: ['You are already on the highest tier'],
      benefits: [],
    };
  }

  const currentConfig = TIER_CONFIGS[currentTier];
  const suggestedConfig = TIER_CONFIGS[suggestedTier];

  const shouldUpgrade = shouldShowUpgradeNudge(jobType, currentTier, usageStats);
  const reasons = getUpgradeReasons(currentTier, jobType);
  const benefits: string[] = [];

  if (suggestedConfig.limits.scansPerDay > currentConfig.limits.scansPerDay) {
    benefits.push(`${suggestedConfig.limits.scansPerDay}x more scans per day`);
  }

  if (suggestedConfig.energyCapacity > currentConfig.energyCapacity) {
    benefits.push(`${suggestedConfig.energyCapacity - currentConfig.energyCapacity} more energy capacity`);
  }

  if (suggestedConfig.limits.modelQuality !== currentConfig.limits.modelQuality) {
    benefits.push(`Upgrade to ${suggestedConfig.limits.modelQuality} AI models`);
  }

  return {
    shouldUpgrade,
    suggestedTier,
    reasons,
    benefits,
    savings: currentTier === 'free' ? 'Save time and close more deals' : undefined,
  };
}

// ============================================================================
// EXPORT CONGRESS API
// ============================================================================

export const Congress = {
  getTierConfig,
  canUserRunJob,
  getJobCosts,
  getRateLimits,
  shouldShowUpgradeNudge,
  suggestUpgradePlan,
  getTierFeatureSummary,
  getUpgradeReasons,
  getUpgradeRecommendation,
};

// Export for external use
export {
  TIER_CONFIGS,
  JOB_COSTS,
  RATE_LIMITS,
  TIER_PERMISSIONS,
};
