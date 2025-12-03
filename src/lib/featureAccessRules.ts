export type SubscriptionTier = 'free' | 'pro';

export interface FeatureAccess {
  scans: {
    daily_limit: number | 'unlimited';
    deep_scan: boolean;
  };
  messages: {
    daily_limit: number | 'unlimited';
    generation: boolean;
    sequences: boolean;
  };
  pitch_decks: {
    weekly_limit: number | 'unlimited';
    generation: boolean;
    editing: boolean;
  };
  company_intelligence: {
    level: 'basic' | 'v3' | 'v6' | 'enterprise';
    multi_site_crawl: boolean;
    knowledge_graph: boolean;
  };
  chatbot: {
    type: 'basic' | 'v2' | 'v3' | 'team' | 'enterprise';
    channels: string[];
    auto_responses: boolean;
    autonomous_closer: boolean;
    emotional_persuasion: boolean;
  };
  omni_channel: {
    enabled: boolean;
    channels: string[];
    auto_send: boolean;
  };
  pipeline: {
    stages: string[];
    full_access: boolean;
  };
  ai_models: {
    available: string[];
    priority_queue: boolean;
  };
  followup: {
    level: 'none' | '7-day' | '30-day' | 'custom';
    revival_engine: boolean;
    hot_lead_accelerator: boolean;
  };
  intelligence: {
    level: 'basic' | 'v3' | 'v6' | 'enterprise';
    behavioral_timeline: boolean;
    personality_profiling: boolean;
  };
  team_features: {
    enabled: boolean;
    dashboard: boolean;
    performance_reports: boolean;
    shared_pipelines: boolean;
    content_library: boolean;
    training_assistant: boolean;
    lead_routing: boolean;
  };
  energy: {
    daily_cap: number;
    regeneration: 'none' | 'auto' | 'unlimited';
    surge_pricing: boolean;
  };
  coins: {
    weekly_allocation: number;
    daily_bonus: number;
    ad_rewards: boolean;
  };
  analytics: {
    basic: boolean;
    advanced: boolean;
    team_wide: boolean;
    company_wide: boolean;
  };
}

export const FEATURE_ACCESS_RULES: Record<SubscriptionTier, FeatureAccess> = {
  free: {
    scans: {
      daily_limit: 3,
      deep_scan: false,
    },
    messages: {
      daily_limit: 3,
      generation: true,
      sequences: false,
    },
    pitch_decks: {
      weekly_limit: 1,
      generation: true,
      editing: false,
    },
    company_intelligence: {
      level: 'basic',
      multi_site_crawl: false,
      knowledge_graph: false,
    },
    chatbot: {
      type: 'basic',
      channels: ['web'],
      auto_responses: false,
      autonomous_closer: false,
      emotional_persuasion: false,
    },
    omni_channel: {
      enabled: false,
      channels: ['web'],
      auto_send: false,
    },
    pipeline: {
      stages: ['stage1', 'stage2', 'stage3'],
      full_access: false,
    },
    ai_models: {
      available: ['gpt-4o-mini'],
      priority_queue: false,
    },
    followup: {
      level: 'none',
      revival_engine: false,
      hot_lead_accelerator: false,
    },
    intelligence: {
      level: 'basic',
      behavioral_timeline: false,
      personality_profiling: false,
    },
    team_features: {
      enabled: false,
      dashboard: false,
      performance_reports: false,
      shared_pipelines: false,
      content_library: false,
      training_assistant: false,
      lead_routing: false,
    },
    energy: {
      daily_cap: 15,
      regeneration: 'none',
      surge_pricing: false,
    },
    coins: {
      weekly_allocation: 35,
      daily_bonus: 5,
      ad_rewards: true,
    },
    analytics: {
      basic: true,
      advanced: false,
      team_wide: false,
      company_wide: false,
    },
  },

  pro: {
    scans: {
      daily_limit: 'unlimited',
      deep_scan: true,
    },
    messages: {
      daily_limit: 'unlimited',
      generation: true,
      sequences: true,
    },
    pitch_decks: {
      weekly_limit: 'unlimited',
      generation: true,
      editing: true,
    },
    company_intelligence: {
      level: 'v6',
      multi_site_crawl: true,
      knowledge_graph: true,
    },
    chatbot: {
      type: 'v3',
      channels: ['web', 'messenger', 'instagram', 'whatsapp', 'viber', 'sms'],
      auto_responses: true,
      autonomous_closer: true,
      emotional_persuasion: true,
    },
    omni_channel: {
      enabled: true,
      channels: ['web', 'messenger', 'instagram', 'whatsapp', 'viber', 'sms'],
      auto_send: true,
    },
    pipeline: {
      stages: ['stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6', 'stage7', 'stage8'],
      full_access: true,
    },
    ai_models: {
      available: ['gpt-4o', 'gpt-4o-mini', 'o1-preview'],
      priority_queue: true,
    },
    followup: {
      level: '30-day',
      revival_engine: true,
      hot_lead_accelerator: true,
    },
    intelligence: {
      level: 'v6',
      behavioral_timeline: true,
      personality_profiling: true,
    },
    team_features: {
      enabled: false,
      dashboard: false,
      performance_reports: false,
      shared_pipelines: false,
      content_library: false,
      training_assistant: false,
      lead_routing: false,
    },
    energy: {
      daily_cap: 999999,
      regeneration: 'unlimited',
      surge_pricing: true,
    },
    coins: {
      weekly_allocation: 500,
      daily_bonus: 0,
      ad_rewards: false,
    },
    analytics: {
      basic: true,
      advanced: true,
      team_wide: false,
      company_wide: false,
    },
  },
};

export const COIN_COSTS = {
  scan: 10,
  deep_scan: 20,
  message_generation: 5,
  pitch_deck: 30,
  revival: 10,
  omni_channel_send: {
    web: 0,
    messenger: 3,
    instagram: 3,
    whatsapp: 5,
    viber: 4,
    sms: 5,
    email: 2,
  },
  ai_analysis: 8,
  voice_closer: 15,
};

export function hasFeatureAccess(
  tier: SubscriptionTier,
  feature: string
): boolean {
  const access = FEATURE_ACCESS_RULES[tier];
  const parts = feature.split('.');

  let current: any = access;
  for (const part of parts) {
    if (current[part] === undefined) return false;
    current = current[part];
  }

  return current === true || current === 'unlimited';
}

export function getFeatureLimit(
  tier: SubscriptionTier,
  feature: string
): number | 'unlimited' {
  const access = FEATURE_ACCESS_RULES[tier];
  const parts = feature.split('.');

  let current: any = access;
  for (const part of parts) {
    if (current[part] === undefined) return 0;
    current = current[part];
  }

  return current;
}

export function canAccessChannel(
  tier: SubscriptionTier,
  channel: string
): boolean {
  const access = FEATURE_ACCESS_RULES[tier];
  return access.omni_channel.channels.includes(channel);
}

export function canUseAIModel(
  tier: SubscriptionTier,
  model: string
): boolean {
  const access = FEATURE_ACCESS_RULES[tier];
  return access.ai_models.available.includes(model);
}

export function getEnergyConfig(tier: SubscriptionTier) {
  return FEATURE_ACCESS_RULES[tier].energy;
}

export function getCoinConfig(tier: SubscriptionTier) {
  return FEATURE_ACCESS_RULES[tier].coins;
}

// Helper to normalize old tier names to new tier structure
export function normalizeTier(tier: string): SubscriptionTier {
  const lowerTier = tier.toLowerCase();

  // Map old tiers to new tiers
  if (lowerTier === 'free' || lowerTier === 'starter') return 'free';
  if (lowerTier === 'pro' || lowerTier === 'elite' || lowerTier === 'team' || lowerTier === 'enterprise') return 'pro';

  return 'free';
}
