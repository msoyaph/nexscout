/**
 * Upgrade Nudge System v2 - Core Engine
 *
 * Detects when users should see upgrade nudges based on:
 * - Feature access attempts
 * - Usage limits
 * - AI-detected patterns
 * - Team growth signals
 */

export type TierId = 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';

export type NudgeTrigger =
  // Feature-gated triggers
  | 'FEATURE_LOCKED_PRO'
  | 'FEATURE_LOCKED_TEAM'
  | 'OMNI_CHATBOT_LOCKED'
  | 'DEEP_SCAN_LOCKED'
  | 'AUTO_FOLLOWUP_LOCKED'
  | 'APPOINTMENT_LOCKED'
  | 'EMOTIONAL_SELLING_LOCKED'
  | 'PRODUCT_INTEL_LOCKED'
  | 'COMPANY_INTEL_LOCKED'
  | 'TEAM_DASHBOARD_LOCKED'
  | 'RECRUITING_AI_LOCKED'
  // Usage-based triggers (Free → Pro)
  | 'LIMIT_REACHED_SCAN'
  | 'LIMIT_REACHED_MSG'
  | 'LIMIT_REACHED_PITCH_DECK'
  | 'LIMIT_REACHED_PIPELINE'
  | 'LOW_ENERGY'
  | 'LOW_COINS'
  // Intelligence triggers (Pro → Team)
  | 'TEAM_UPSELL_INBOX'
  | 'TEAM_UPSELL_PIPELINE'
  | 'TEAM_UPSELL_PROSPECTS'
  | 'TEAM_UPSELL_SHARING'
  | 'HIGH_ENGAGEMENT';

export type NudgeType =
  | 'inline'      // Button overlays, locked content
  | 'banner'      // Top floating banner
  | 'modal'       // Full modal popup
  | 'paywall';    // Full-screen paywall

export interface NudgeContext {
  tier: TierId;
  scansToday?: number;
  messagesToday?: number;
  pitchDecksThisWeek?: number;
  energy?: number;
  coins?: number;
  activeConversations?: number;
  pipelineCount?: number;
  prospectCount?: number;
  featureAttempted?: string;
  pipelineStages?: number;
}

export interface NudgeConfig {
  trigger: NudgeTrigger;
  type: NudgeType;
  targetTier: 'PRO' | 'TEAM';
  urgency: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  benefits: string[];
  ctaText: string;
  dismissible: boolean;
}

/**
 * Feature access map - what tier is required for each feature
 */
export const FEATURE_TIER_MAP: Record<string, TierId> = {
  'omni-chatbot': 'PRO',
  'deep-scan': 'PRO',
  'auto-followup': 'PRO',
  'appointment-scheduler': 'PRO',
  'emotional-selling': 'PRO',
  'product-intelligence': 'PRO',
  'company-intelligence': 'PRO',
  'team-dashboard': 'TEAM',
  'recruiting-ai': 'TEAM',
  'lead-distribution': 'TEAM',
  'team-analytics': 'TEAM',
  'shared-pipelines': 'TEAM',
};

/**
 * Main nudge detection function
 */
export function shouldTriggerNudge(context: NudgeContext): NudgeTrigger | null {
  const {
    tier,
    scansToday = 0,
    messagesToday = 0,
    pitchDecksThisWeek = 0,
    energy = 0,
    coins = 0,
    activeConversations = 0,
    pipelineCount = 0,
    prospectCount = 0,
    featureAttempted,
    pipelineStages = 3,
  } = context;

  // Feature-gated triggers
  if (featureAttempted) {
    const requiredTier = FEATURE_TIER_MAP[featureAttempted];

    if (requiredTier === 'PRO' && tier === 'FREE') {
      switch (featureAttempted) {
        case 'omni-chatbot': return 'OMNI_CHATBOT_LOCKED';
        case 'deep-scan': return 'DEEP_SCAN_LOCKED';
        case 'auto-followup': return 'AUTO_FOLLOWUP_LOCKED';
        case 'appointment-scheduler': return 'APPOINTMENT_LOCKED';
        case 'emotional-selling': return 'EMOTIONAL_SELLING_LOCKED';
        case 'product-intelligence': return 'PRODUCT_INTEL_LOCKED';
        case 'company-intelligence': return 'COMPANY_INTEL_LOCKED';
        default: return 'FEATURE_LOCKED_PRO';
      }
    }

    if (requiredTier === 'TEAM' && (tier === 'FREE' || tier === 'PRO')) {
      switch (featureAttempted) {
        case 'team-dashboard': return 'TEAM_DASHBOARD_LOCKED';
        case 'recruiting-ai': return 'RECRUITING_AI_LOCKED';
        default: return 'FEATURE_LOCKED_TEAM';
      }
    }
  }

  // FREE tier usage-based triggers
  if (tier === 'FREE') {
    if (scansToday >= 3) return 'LIMIT_REACHED_SCAN';
    if (messagesToday >= 3) return 'LIMIT_REACHED_MSG';
    if (pitchDecksThisWeek >= 1) return 'LIMIT_REACHED_PITCH_DECK';
    if (pipelineCount >= pipelineStages) return 'LIMIT_REACHED_PIPELINE';
    if (energy < 2) return 'LOW_ENERGY';
    if (coins < 10) return 'LOW_COINS';
  }

  // PRO tier upsell triggers (to TEAM)
  if (tier === 'PRO') {
    if (prospectCount > 100) return 'TEAM_UPSELL_PROSPECTS';
    if (activeConversations > 20) return 'TEAM_UPSELL_INBOX';
    if (pipelineCount > 100) return 'TEAM_UPSELL_PIPELINE';
  }

  // High engagement trigger (FREE with lots of activity)
  if (tier === 'FREE' && scansToday >= 2 && messagesToday >= 2 && energy < 5) {
    return 'HIGH_ENGAGEMENT';
  }

  return null;
}

/**
 * Get nudge configuration for a trigger
 */
export function getNudgeConfig(trigger: NudgeTrigger): NudgeConfig {
  const configs: Record<NudgeTrigger, NudgeConfig> = {
    // Feature-locked PRO triggers
    FEATURE_LOCKED_PRO: {
      trigger,
      type: 'modal',
      targetTier: 'PRO',
      urgency: 'high',
      title: 'Unlock Your AI Sales Partner',
      message: 'This powerful feature is available with PRO.',
      benefits: [
        'Unlimited AI Scanning',
        'Omni-channel Chatbot (Web, Messenger, IG)',
        'DeepScan v3 (Intent, Personality, Buying Score)',
        'Auto Follow-Ups & Auto-Closing',
        'Smart Appointment Booking',
        'Product & Company Intelligence',
      ],
      ctaText: 'Upgrade to PRO — ₱1,299/mo',
      dismissible: true,
    },

    OMNI_CHATBOT_LOCKED: {
      trigger,
      type: 'paywall',
      targetTier: 'PRO',
      urgency: 'high',
      title: 'Omni-Channel Chatbot',
      message: 'Connect with prospects across Website, Facebook Messenger, and Instagram with AI-powered conversations.',
      benefits: [
        'Website widget with auto-responses',
        'Facebook Messenger integration',
        'Instagram DM automation',
        'Auto-closing mode',
        'Lead qualification AI',
        'Multi-language support',
      ],
      ctaText: 'Unlock Omni-Channel — ₱1,299/mo',
      dismissible: false,
    },

    DEEP_SCAN_LOCKED: {
      trigger,
      type: 'paywall',
      targetTier: 'PRO',
      urgency: 'high',
      title: 'DeepScan v3 - Advanced Intelligence',
      message: 'Unlock buying intent, personality analysis, emotional triggers, financial capability, and timeline predictions.',
      benefits: [
        'Buying intent score (0-100)',
        'Personality profiling (DISC)',
        'Emotional trigger detection',
        'Financial capability assessment',
        'Timeline prediction',
        'Objection mapping',
      ],
      ctaText: 'Upgrade to PRO — ₱1,299/mo',
      dismissible: false,
    },

    AUTO_FOLLOWUP_LOCKED: {
      trigger,
      type: 'modal',
      targetTier: 'PRO',
      urgency: 'medium',
      title: 'Auto Follow-Up Sequences',
      message: 'Never miss a prospect. AI automatically follows up at optimal times.',
      benefits: [
        'Automated follow-up scheduling',
        'Personalized message generation',
        'Optimal timing detection',
        'Multi-channel follow-ups',
        'Response tracking',
      ],
      ctaText: 'Unlock Auto Follow-Ups — ₱1,299/mo',
      dismissible: true,
    },

    APPOINTMENT_LOCKED: {
      trigger,
      type: 'modal',
      targetTier: 'PRO',
      urgency: 'medium',
      title: 'Smart Appointment Scheduler',
      message: 'Let AI book appointments automatically based on your calendar.',
      benefits: [
        'Calendar integration',
        'Smart scheduling AI',
        'Automatic reminders',
        'Timezone handling',
        'Booking confirmations',
      ],
      ctaText: 'Upgrade to PRO — ₱1,299/mo',
      dismissible: true,
    },

    EMOTIONAL_SELLING_LOCKED: {
      trigger,
      type: 'modal',
      targetTier: 'PRO',
      urgency: 'medium',
      title: 'Emotional Selling Layer',
      message: 'Understand emotional buying triggers and tailor your approach.',
      benefits: [
        'Emotion detection AI',
        'Persuasion patterns',
        'Trigger word analysis',
        'Sentiment tracking',
        'Closing signal detection',
      ],
      ctaText: 'Upgrade to PRO — ₱1,299/mo',
      dismissible: true,
    },

    PRODUCT_INTEL_LOCKED: {
      trigger,
      type: 'modal',
      targetTier: 'PRO',
      urgency: 'medium',
      title: 'Product Intelligence',
      message: 'Deep AI analysis of your products and how to position them.',
      benefits: [
        'Product-market fit analysis',
        'Competitive positioning',
        'Feature-benefit mapping',
        'Pricing intelligence',
        'Objection handling guides',
      ],
      ctaText: 'Upgrade to PRO — ₱1,299/mo',
      dismissible: true,
    },

    COMPANY_INTEL_LOCKED: {
      trigger,
      type: 'modal',
      targetTier: 'PRO',
      urgency: 'medium',
      title: 'Company Intelligence',
      message: 'AI-powered company knowledge graph for perfect personalization.',
      benefits: [
        'Automated company profiling',
        'Value proposition generation',
        'Industry insights',
        'Competitive analysis',
        'Pitch customization',
      ],
      ctaText: 'Upgrade to PRO — ₱1,299/mo',
      dismissible: true,
    },

    // Usage limit triggers
    LIMIT_REACHED_SCAN: {
      trigger,
      type: 'banner',
      targetTier: 'PRO',
      urgency: 'high',
      title: 'Daily Scan Limit Reached',
      message: "You've reached your 3 free scans today. Upgrade to PRO for unlimited scanning.",
      benefits: ['Unlimited prospect scanning', 'Higher quality AI analysis', 'Batch processing'],
      ctaText: 'Get Unlimited Scans',
      dismissible: true,
    },

    LIMIT_REACHED_MSG: {
      trigger,
      type: 'banner',
      targetTier: 'PRO',
      urgency: 'high',
      title: 'Message Limit Reached',
      message: "You've used your 3 daily AI messages. PRO unlocks unlimited messaging.",
      benefits: ['Unlimited AI message generation', 'Higher quality responses', 'Custom templates'],
      ctaText: 'Upgrade for Unlimited',
      dismissible: true,
    },

    LIMIT_REACHED_PITCH_DECK: {
      trigger,
      type: 'banner',
      targetTier: 'PRO',
      urgency: 'medium',
      title: 'Weekly Pitch Deck Limit',
      message: "You've created your 1 free pitch deck this week. PRO unlocks unlimited decks.",
      benefits: ['Unlimited pitch decks', 'Premium templates', 'Custom branding'],
      ctaText: 'Unlock Unlimited',
      dismissible: true,
    },

    LIMIT_REACHED_PIPELINE: {
      trigger,
      type: 'banner',
      targetTier: 'PRO',
      urgency: 'medium',
      title: 'Pipeline Full',
      message: 'Your free 3-stage pipeline is full. Upgrade for unlimited pipeline power.',
      benefits: ['Unlimited pipeline stages', 'Advanced automation', 'Team collaboration'],
      ctaText: 'Upgrade Now',
      dismissible: true,
    },

    LOW_ENERGY: {
      trigger,
      type: 'banner',
      targetTier: 'PRO',
      urgency: 'medium',
      title: 'Low Energy',
      message: 'Running low on energy. PRO gives you 200 energy/day!',
      benefits: ['200 energy daily', 'Faster regeneration', 'Energy boost packs'],
      ctaText: 'Get More Energy',
      dismissible: true,
    },

    LOW_COINS: {
      trigger,
      type: 'banner',
      targetTier: 'PRO',
      urgency: 'low',
      title: 'Low Coins',
      message: 'Coins running low. PRO gives you 80 coins weekly!',
      benefits: ['80 coins per week', 'Coin packs available', 'No ads for coins'],
      ctaText: 'Get More Coins',
      dismissible: true,
    },

    HIGH_ENGAGEMENT: {
      trigger,
      type: 'modal',
      targetTier: 'PRO',
      urgency: 'high',
      title: "You're on Fire! 🔥",
      message: "You're using NexScout like a pro closer. Ready to unlock full power?",
      benefits: [
        'Unlimited everything',
        'Advanced AI features',
        'Priority support',
        'Team collaboration',
        'Custom integrations',
      ],
      ctaText: 'Upgrade to PRO — ₱1,299/mo',
      dismissible: true,
    },

    // Team upsell triggers
    FEATURE_LOCKED_TEAM: {
      trigger,
      type: 'modal',
      targetTier: 'TEAM',
      urgency: 'medium',
      title: 'Team Features Unlocked',
      message: 'Scale your sales with team collaboration.',
      benefits: [
        'Team dashboard & analytics',
        'Shared chatbots',
        'Lead distribution AI',
        'Team performance tracking',
        'Shared scripts & templates',
      ],
      ctaText: 'Upgrade to Team — ₱4,990/mo',
      dismissible: true,
    },

    TEAM_DASHBOARD_LOCKED: {
      trigger,
      type: 'paywall',
      targetTier: 'TEAM',
      urgency: 'medium',
      title: 'Team Dashboard',
      message: 'Monitor and manage your entire sales team in one place.',
      benefits: [
        'Real-time team performance',
        'Lead distribution',
        'Team training AI',
        'Shared pipelines',
        'Cross-member calendar',
      ],
      ctaText: 'Upgrade to Team',
      dismissible: false,
    },

    RECRUITING_AI_LOCKED: {
      trigger,
      type: 'paywall',
      targetTier: 'TEAM',
      urgency: 'medium',
      title: 'Recruiting AI Assistant',
      message: 'Build and train your sales team with AI-powered recruiting.',
      benefits: [
        'Automated recruiting chatbot',
        'Candidate screening',
        'Training programs',
        'Performance tracking',
        'Team onboarding',
      ],
      ctaText: 'Upgrade to Team',
      dismissible: false,
    },

    TEAM_UPSELL_PROSPECTS: {
      trigger,
      type: 'banner',
      targetTier: 'TEAM',
      urgency: 'medium',
      title: 'Managing 100+ Prospects?',
      message: "You're crushing it! Time to build a team and distribute leads.",
      benefits: ['Automatic lead distribution', 'Team analytics', 'Shared resources'],
      ctaText: 'Build Your Team',
      dismissible: true,
    },

    TEAM_UPSELL_INBOX: {
      trigger,
      type: 'banner',
      targetTier: 'TEAM',
      urgency: 'high',
      title: 'Inbox Overload?',
      message: 'Managing 20+ conversations? Team mode lets you distribute chats.',
      benefits: ['Shared inbox', 'Auto-assignment', 'Team chat'],
      ctaText: 'Get Team Mode',
      dismissible: true,
    },

    TEAM_UPSELL_PIPELINE: {
      trigger,
      type: 'banner',
      targetTier: 'TEAM',
      urgency: 'medium',
      title: 'Pipeline Growing Fast',
      message: '100+ prospects in pipeline. Time to add team members!',
      benefits: ['Team pipeline', 'Lead routing', 'Collaborative selling'],
      ctaText: 'Add Team Members',
      dismissible: true,
    },

    TEAM_UPSELL_SHARING: {
      trigger,
      type: 'modal',
      targetTier: 'TEAM',
      urgency: 'low',
      title: 'Share with Your Team',
      message: 'Want to share scripts, templates, and chatbots with others?',
      benefits: [
        'Shared resources library',
        'Team templates',
        'Collaborative chatbot',
        'Training materials',
      ],
      ctaText: 'Upgrade to Team',
      dismissible: true,
    },
  };

  return configs[trigger] || configs.FEATURE_LOCKED_PRO;
}

/**
 * Check if a feature is accessible for the given tier
 */
export function canAccessFeature(feature: string, tier: TierId): boolean {
  const requiredTier = FEATURE_TIER_MAP[feature];
  if (!requiredTier) return true; // Unknown feature, allow access

  const tierLevels: Record<TierId, number> = {
    FREE: 0,
    PRO: 1,
    TEAM: 2,
    ENTERPRISE: 3,
  };

  return tierLevels[tier] >= tierLevels[requiredTier];
}

/**
 * Get user-friendly feature name
 */
export function getFeatureName(featureKey: string): string {
  const names: Record<string, string> = {
    'omni-chatbot': 'Omni-Channel Chatbot',
    'deep-scan': 'DeepScan v3',
    'auto-followup': 'Auto Follow-Ups',
    'appointment-scheduler': 'Smart Appointments',
    'emotional-selling': 'Emotional Selling Layer',
    'product-intelligence': 'Product Intelligence',
    'company-intelligence': 'Company Intelligence',
    'team-dashboard': 'Team Dashboard',
    'recruiting-ai': 'Recruiting AI',
    'lead-distribution': 'Lead Distribution',
    'team-analytics': 'Team Analytics',
    'shared-pipelines': 'Shared Pipelines',
  };

  return names[featureKey] || 'This Feature';
}
