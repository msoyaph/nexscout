/**
 * Premium Add-Ons System
 * 
 * Features that cost coins (not energy)
 * Available to all users, but Pro users get weekly coins automatically
 * 
 * Economic Model:
 * - Coins used ONLY for premium add-ons (not core AI features)
 * - High profit margin (95-100%)
 * - Creates ongoing monetization
 */

export interface PremiumAddOn {
  id: string;
  name: string;
  description: string;
  coinCost: number;
  phpValue: number; // Approximate PHP value (at ₱2/coin)
  category: 'ai_tools' | 'integrations' | 'cosmetic' | 'data_tools' | 'support';
  isOneTime: boolean; // One-time purchase vs recurring use
  icon: string;
  requiredTier?: 'free' | 'pro'; // Minimum tier required
  estimatedAICost: number; // Your actual AI cost in PHP
  profitMargin: number; // Percentage
}

export const PREMIUM_ADD_ONS: Record<string, PremiumAddOn> = {
  // AI Tools (Recurring Use)
  AI_VIDEO_SCRIPT: {
    id: 'ai_video_script',
    name: 'AI Video Script Generator',
    description: 'Generate engaging TikTok/Reel scripts for your products',
    coinCost: 50,
    phpValue: 100,
    category: 'ai_tools',
    isOneTime: false,
    icon: 'video',
    estimatedAICost: 2,
    profitMargin: 98,
  },
  
  COMPETITOR_ANALYSIS: {
    id: 'competitor_analysis',
    name: 'AI Competitor Analysis',
    description: 'Deep analysis of competitor strategies and weaknesses',
    coinCost: 40,
    phpValue: 80,
    category: 'ai_tools',
    isOneTime: false,
    icon: 'target',
    estimatedAICost: 1.5,
    profitMargin: 98,
  },
  
  SOCIAL_SCHEDULER: {
    id: 'social_scheduler',
    name: 'AI Social Media Scheduler',
    description: 'Generate and schedule 7 days of social media posts',
    coinCost: 30,
    phpValue: 60,
    category: 'ai_tools',
    isOneTime: false,
    icon: 'calendar',
    estimatedAICost: 1,
    profitMargin: 98,
  },
  
  OBJECTION_LIBRARY: {
    id: 'objection_library',
    name: 'Custom Objection Library',
    description: 'AI generates 50+ objection handlers for your niche',
    coinCost: 80,
    phpValue: 160,
    category: 'ai_tools',
    isOneTime: false,
    icon: 'shield',
    estimatedAICost: 3,
    profitMargin: 98,
  },
  
  TESTIMONIAL_GENERATOR: {
    id: 'testimonial_generator',
    name: 'AI Testimonial Generator',
    description: 'Transform customer feedback into compelling testimonials',
    coinCost: 25,
    phpValue: 50,
    category: 'ai_tools',
    isOneTime: false,
    icon: 'star',
    estimatedAICost: 1,
    profitMargin: 98,
  },
  
  // Integrations (One-Time Unlocks)
  WHATSAPP_INTEGRATION: {
    id: 'whatsapp_integration',
    name: 'WhatsApp Integration',
    description: 'Send AI messages directly to WhatsApp (one-time unlock)',
    coinCost: 100,
    phpValue: 200,
    category: 'integrations',
    isOneTime: true,
    icon: 'message-circle',
    estimatedAICost: 0,
    profitMargin: 100,
  },
  
  VIBER_INTEGRATION: {
    id: 'viber_integration',
    name: 'Viber Integration',
    description: 'Send AI messages to Viber (one-time unlock)',
    coinCost: 80,
    phpValue: 160,
    category: 'integrations',
    isOneTime: true,
    icon: 'message-square',
    estimatedAICost: 0,
    profitMargin: 100,
  },
  
  CRM_EXPORT: {
    id: 'crm_export',
    name: 'CRM Export',
    description: 'Export prospects to CSV/Excel (per export)',
    coinCost: 20,
    phpValue: 40,
    category: 'data_tools',
    isOneTime: false,
    icon: 'download',
    estimatedAICost: 0,
    profitMargin: 100,
  },
  
  API_ACCESS: {
    id: 'api_access',
    name: 'API Access (Monthly)',
    description: 'Access NexScout API for integrations',
    coinCost: 300,
    phpValue: 600,
    category: 'integrations',
    isOneTime: false, // Monthly renewal
    icon: 'code',
    estimatedAICost: 0,
    profitMargin: 100,
  },
  
  // Cosmetic (One-Time)
  REMOVE_BRANDING: {
    id: 'remove_branding',
    name: 'Remove NexScout Branding',
    description: 'White-label: remove "Powered by NexScout" from chatbot',
    coinCost: 200,
    phpValue: 400,
    category: 'cosmetic',
    isOneTime: true,
    icon: 'eye-off',
    estimatedAICost: 0,
    profitMargin: 100,
  },
  
  CUSTOM_DOMAIN: {
    id: 'custom_domain',
    name: 'Custom Chatbot Domain',
    description: 'Use your own domain for public chatbot (chat.yourdomain.com)',
    coinCost: 250,
    phpValue: 500,
    category: 'cosmetic',
    isOneTime: true,
    icon: 'globe',
    requiredTier: 'pro',
    estimatedAICost: 0,
    profitMargin: 100,
  },
  
  // Data Tools
  BULK_OPERATIONS: {
    id: 'bulk_operations',
    name: 'Bulk Operations',
    description: 'Process 100+ prospects at once (import, tag, export)',
    coinCost: 50,
    phpValue: 100,
    category: 'data_tools',
    isOneTime: false,
    icon: 'layers',
    estimatedAICost: 0,
    profitMargin: 100,
  },
  
  ADVANCED_FILTERS: {
    id: 'advanced_filters',
    name: 'Advanced Filters & Search',
    description: 'Unlock advanced filtering (score ranges, custom fields, saved filters)',
    coinCost: 60,
    phpValue: 120,
    category: 'data_tools',
    isOneTime: true,
    icon: 'filter',
    estimatedAICost: 0,
    profitMargin: 100,
  },
  
  // Support
  PRIORITY_SUPPORT: {
    id: 'priority_support',
    name: 'Priority Support Ticket',
    description: '1-hour response guarantee (per ticket)',
    coinCost: 30,
    phpValue: 60,
    category: 'support',
    isOneTime: false,
    icon: 'headphones',
    estimatedAICost: 0,
    profitMargin: 100,
  },
  
  CUSTOM_TRAINING: {
    id: 'custom_training',
    name: 'Custom AI Training Session',
    description: '1-on-1 AI optimization with expert (1 hour)',
    coinCost: 150,
    phpValue: 300,
    category: 'support',
    isOneTime: false,
    icon: 'graduation-cap',
    estimatedAICost: 10, // Human cost
    profitMargin: 97,
  },
};

/**
 * Get all add-ons by category
 */
export const getAddOnsByCategory = (category: PremiumAddOn['category']): PremiumAddOn[] => {
  return Object.values(PREMIUM_ADD_ONS).filter(addon => addon.category === category);
};

/**
 * Get add-ons available for user's tier
 */
export const getAvailableAddOns = (userTier: string): PremiumAddOn[] => {
  return Object.values(PREMIUM_ADD_ONS).filter(addon => {
    if (!addon.requiredTier) return true;
    if (userTier === 'pro' || userTier === 'team' || userTier === 'enterprise') return true;
    return addon.requiredTier === userTier;
  });
};

/**
 * Check if user can afford add-on
 */
export const canAffordAddOn = (coinBalance: number, addOnId: string): boolean => {
  const addon = PREMIUM_ADD_ONS[addOnId];
  if (!addon) return false;
  return coinBalance >= addon.coinCost;
};

/**
 * Get recommended add-ons for user based on usage
 */
export const getRecommendedAddOns = (userUsage: {
  hasProspects: boolean;
  usesPublicChatbot: boolean;
  isHeavyUser: boolean;
  tier: string;
}): PremiumAddOn[] => {
  const recommendations: PremiumAddOn[] = [];
  
  if (userUsage.hasProspects) {
    recommendations.push(PREMIUM_ADD_ONS.BULK_OPERATIONS);
    recommendations.push(PREMIUM_ADD_ONS.CRM_EXPORT);
  }
  
  if (userUsage.usesPublicChatbot && userUsage.tier === 'pro') {
    recommendations.push(PREMIUM_ADD_ONS.REMOVE_BRANDING);
    recommendations.push(PREMIUM_ADD_ONS.CUSTOM_DOMAIN);
  }
  
  if (userUsage.isHeavyUser) {
    recommendations.push(PREMIUM_ADD_ONS.WHATSAPP_INTEGRATION);
    recommendations.push(PREMIUM_ADD_ONS.ADVANCED_FILTERS);
  }
  
  // Always show some AI tools
  recommendations.push(PREMIUM_ADD_ONS.AI_VIDEO_SCRIPT);
  recommendations.push(PREMIUM_ADD_ONS.COMPETITOR_ANALYSIS);
  
  return recommendations;
};

/**
 * Calculate total value saved vs buying individually
 */
export const calculateBundleValue = (addOnIds: string[]): {
  totalCoins: number;
  totalPhpValue: number;
  savings: number;
} => {
  const addOns = addOnIds.map(id => PREMIUM_ADD_ONS[id]).filter(Boolean);
  
  const totalCoins = addOns.reduce((sum, addon) => sum + addon.coinCost, 0);
  const totalPhpValue = addOns.reduce((sum, addon) => sum + addon.phpValue, 0);
  
  // If buying coins at ₱2/coin
  const coinPurchaseCost = totalCoins * 2;
  const savings = totalPhpValue - coinPurchaseCost;
  
  return {
    totalCoins,
    totalPhpValue,
    savings: Math.max(0, savings),
  };
};




