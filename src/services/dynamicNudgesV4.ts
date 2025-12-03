/**
 * Dynamic Nudge System v4.0
 *
 * Features:
 * - Behavioral fingerprinting
 * - Dynamic pricing
 * - Real-time ROI predictions
 * - Surge detection
 * - Emotional microcopy generation
 * - Next-best-offer logic
 */

import { supabase } from '../lib/supabase';
import { type EmotionalState } from '../utils/adaptiveNudgeEngine';

export interface BehavioralFingerprint {
  userId: string;
  patterns: {
    highActivity: boolean;
    disciplined: boolean;
    heavySeller: boolean;
    roiFocused: boolean;
    confused: boolean;
    powerUser: boolean;
  };
  usage: {
    dailyLogins: number;
    avgScansPerDay: number;
    avgMessagesPerDay: number;
    energyBurnRate: number;
    featureAdoption: number;
  };
  signals: {
    abandonmentRate: number;
    conversionReadiness: number;
    pricesentitivity: number;
  };
}

export interface DynamicOffer {
  originalPrice: number;
  finalPrice: number;
  discount: number;
  discountReason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  expiresIn: number; // minutes
  roi_estimate: number;
  copyVariant: string;
}

export interface SurgeEvent {
  type: 'scans' | 'messages' | 'energy' | 'leads' | 'inbox' | 'closing';
  value: number;
  threshold: number;
  intensity: 'mild' | 'moderate' | 'strong';
}

/**
 * Detect behavioral fingerprint from user activity
 */
export async function detectBehavioralFingerprint(userId: string): Promise<BehavioralFingerprint> {
  // In production, would analyze actual database records
  // This is a simplified version

  const { data: fingerprints } = await supabase
    .from('upgrade_behavior_fingerprints')
    .select('*')
    .eq('user_id', userId)
    .order('detected_at', { ascending: false })
    .limit(10);

  // Analyze patterns
  const patterns = {
    highActivity: (fingerprints?.filter(f => f.metric_key === 'daily_logins').length ?? 0) > 5,
    disciplined: (fingerprints?.filter(f => f.metric_key === 'mission_completion').length ?? 0) > 3,
    heavySeller: (fingerprints?.filter(f => f.metric_key === 'energy_usage').length ?? 0) > 5,
    roiFocused: (fingerprints?.filter(f => f.metric_key === 'closed_deals').length ?? 0) > 0,
    confused: (fingerprints?.filter(f => f.metric_key === 'feature_abandonment').length ?? 0) > 2,
    powerUser: (fingerprints?.filter(f => f.metric_key === 'feature_adoption').length ?? 0) > 7,
  };

  return {
    userId,
    patterns,
    usage: {
      dailyLogins: 4,
      avgScansPerDay: 8,
      avgMessagesPerDay: 12,
      energyBurnRate: 0.7,
      featureAdoption: 0.6,
    },
    signals: {
      abandonmentRate: 0.2,
      conversionReadiness: patterns.highActivity && patterns.roiFocused ? 0.8 : 0.4,
      pricesensitivity: 0.5,
    },
  };
}

/**
 * Track behavioral metric
 */
export async function trackBehavioralMetric(
  userId: string,
  metricKey: string,
  metricValue: any,
  patternType?: string
): Promise<void> {
  await supabase.from('upgrade_behavior_fingerprints').insert({
    user_id: userId,
    metric_key: metricKey,
    metric_value: typeof metricValue === 'object' ? metricValue : { value: metricValue },
    pattern_type: patternType,
    confidence_score: 0.8,
  });
}

/**
 * Detect surge event
 */
export async function detectSurgeEvent(
  userId: string,
  surgeType: string,
  currentValue: number,
  threshold: number
): Promise<SurgeEvent | null> {
  if (currentValue < threshold) return null;

  const intensity =
    currentValue >= threshold * 2 ? 'strong' :
    currentValue >= threshold * 1.5 ? 'moderate' :
    'mild';

  // Call database function
  const { data, error } = await supabase.rpc('detect_surge_event', {
    p_user_id: userId,
    p_surge_type: surgeType,
    p_metric_value: currentValue,
    p_threshold: threshold,
  });

  if (error || !data) return null;

  return {
    type: surgeType as any,
    value: currentValue,
    threshold,
    intensity,
  };
}

/**
 * Calculate dynamic pricing
 */
export async function calculateDynamicPrice(
  userId: string,
  basePrice: number,
  tier: string,
  context: {
    hasSurge?: boolean;
    emotionalState?: EmotionalState;
    behavior?: BehavioralFingerprint;
  }
): Promise<DynamicOffer> {
  const { data } = await supabase.rpc('calculate_dynamic_price', {
    p_user_id: userId,
    p_base_price: basePrice,
    p_tier: tier,
  });

  const pricing = data as any || {
    original_price: basePrice,
    discount: 0,
    final_price: basePrice,
  };

  // Determine urgency
  let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (context.hasSurge) urgency = 'critical';
  else if (context.emotionalState === 'excited' || context.emotionalState === 'eager') urgency = 'high';

  // Calculate ROI estimate
  const roiEstimate = await estimateUpgradeROI(userId, tier);

  return {
    originalPrice: pricing.original_price,
    finalPrice: pricing.final_price,
    discount: pricing.discount,
    discountReason: pricing.discount_reason || (context.hasSurge ? 'Surge Activity Bonus!' : 'Limited Time Offer'),
    urgency,
    expiresIn: urgency === 'critical' ? 30 : urgency === 'high' ? 60 : 120,
    roi_estimate: roiEstimate,
    copyVariant: generateEmotionalCopy(context.emotionalState || 'curious', pricing.discount > 0),
  };
}

/**
 * Estimate upgrade ROI
 */
export async function estimateUpgradeROI(userId: string, toTier: string): Promise<number> {
  const { data } = await supabase.rpc('predict_upgrade_roi', {
    p_user_id: userId,
    p_from_tier: 'FREE',
    p_to_tier: toTier,
  });

  return (data as any)?.predicted_monthly_revenue || 5000;
}

/**
 * Generate emotional microcopy
 */
export function generateEmotionalCopy(emotion: EmotionalState, hasDiscount: boolean): string {
  const copies: Record<EmotionalState, string[]> = {
    excited: [
      "Strike while it's hot — boost your selling power now! 🔥",
      "You're on fire! Unlock unlimited potential!",
      "Perfect timing! Level up your game right now!",
    ],
    overwhelmed: [
      "Let AI automate the heavy lifting for you.",
      "Simplify your workflow — we'll handle the rest.",
      "Take the pressure off. Upgrade to autopilot mode.",
    ],
    curious: [
      "Want to see what's possible? Unlock full insights.",
      "Discover the hidden power of PRO features.",
      "Ready to explore unlimited possibilities?",
    ],
    frustrated: [
      "No more limits. PRO removes all restrictions.",
      "Stop hitting walls. Unlock unlimited access.",
      "Break free from limitations. Upgrade now.",
    ],
    confident: [
      "You're ready for PRO mode. Level up!",
      "Amplify your success with PRO power.",
      "You've got this. PRO makes it even better.",
    ],
    momentum: [
      `You closed deals this week. Let's multiply that! ${hasDiscount ? '💰' : ''}`,
      "Keep the momentum going with unlimited tools.",
      "You're winning. PRO helps you win more.",
    ],
    fearOfMissingOut: [
      "Top closers are scaling with PRO. Join them!",
      "Don't miss out on unlimited growth potential.",
      "Everyone's upgrading. Don't get left behind.",
    ],
    stressed: [
      "Breathe easier. PRO automates the hard parts.",
      "Reduce stress with AI-powered automation.",
      "Let us handle the details. You focus on closing.",
    ],
    optimistic: [
      "Perfect timing! PRO helps you reach goals faster.",
      "Your positive energy + PRO tools = unstoppable!",
      "Great things ahead. PRO accelerates the journey.",
    ],
    eager: [
      "Ready to unlock your full potential? Let's go!",
      "Your enthusiasm + PRO power = amazing results!",
      "Let's do this! Upgrade and dominate.",
    ],
    hesitant: [
      hasDiscount ? "Try PRO risk-free. Special offer just for you!" : "Try PRO for 7 days risk-free.",
      "No commitment needed. Cancel anytime.",
      "Join hundreds of satisfied users. Risk-free trial.",
    ],
    skeptical: [
      "Hundreds of closers increased sales by 3x with PRO.",
      "See the proof: Real results from real users.",
      "Data-backed success. PRO delivers results.",
    ],
  };

  const options = copies[emotion] || copies.curious;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Determine next best offer
 */
export function determineNextBestOffer(
  fingerprint: BehavioralFingerprint,
  currentTier: string
): {
  targetTier: string;
  primaryFeature: string;
  secondaryFeatures: string[];
  reasoning: string;
} {
  // FREE → PRO logic
  if (currentTier === 'FREE') {
    if (fingerprint.patterns.heavySeller) {
      return {
        targetTier: 'PRO',
        primaryFeature: 'Unlimited Scans & Energy',
        secondaryFeatures: ['Auto Follow-Ups', 'DeepScan v3', 'Priority Support'],
        reasoning: 'High usage detected - remove limits',
      };
    }

    if (fingerprint.patterns.roiFocused) {
      return {
        targetTier: 'PRO',
        primaryFeature: 'Auto-Closing AI',
        secondaryFeatures: ['Smart Appointments', 'Revenue Tracking', 'Deal Intelligence'],
        reasoning: 'Revenue-focused user - show ROI tools',
      };
    }

    if (fingerprint.patterns.confused) {
      return {
        targetTier: 'PRO',
        primaryFeature: 'Full DeepScan Intelligence',
        secondaryFeatures: ['Step-by-Step Guides', 'AI Coach', 'Training Materials'],
        reasoning: 'Needs clarity - offer insights & guidance',
      };
    }
  }

  // PRO → TEAM logic
  if (currentTier === 'PRO') {
    if (fingerprint.usage.avgScansPerDay > 20) {
      return {
        targetTier: 'TEAM',
        primaryFeature: 'Team Management & Lead Distribution',
        secondaryFeatures: ['Shared Pipelines', 'Team Analytics', 'Recruiting AI'],
        reasoning: 'High volume - ready to scale with team',
      };
    }
  }

  // Default
  return {
    targetTier: 'PRO',
    primaryFeature: 'Unlimited Everything',
    secondaryFeatures: ['All Features', 'No Limits', 'Priority Support'],
    reasoning: 'Standard upgrade path',
  };
}

/**
 * Generate surge nudge message
 */
export function generateSurgeNudgeMessage(surge: SurgeEvent, hasDiscount: boolean): string {
  const intensityEmoji = surge.intensity === 'strong' ? '🔥🔥🔥' :
                        surge.intensity === 'moderate' ? '🔥🔥' : '🔥';

  const messages = {
    scans: `${intensityEmoji} Surge Mode! You scanned ${surge.value} prospects in 2 hours. Unlock PRO for unlimited scanning!`,
    messages: `${intensityEmoji} You're messaging like a pro! ${surge.value} messages sent. Upgrade for unlimited AI power!`,
    energy: `${intensityEmoji} Energy surge detected! You're on fire. PRO gives 200 energy daily!`,
    leads: `${intensityEmoji} ${surge.value} hot leads detected! Don't lose momentum. Upgrade to close them all!`,
    inbox: `${intensityEmoji} Inbox explosion! ${surge.value} conversations. Team mode helps distribute the load!`,
    closing: `${intensityEmoji} You're in closing mode! ${surge.value} deals in progress. PRO accelerates conversions!`,
  };

  let message = messages[surge.type] || `${intensityEmoji} High activity detected! Upgrade to handle the volume!`;

  if (hasDiscount) {
    message += ` ⚡ TODAY ONLY: Special surge discount!`;
  }

  return message;
}

/**
 * Track dynamic offer shown
 */
export async function trackDynamicOffer(params: {
  userId: string;
  offerVariant: string;
  emotionState?: string;
  roiEstimate: number;
  behaviorPattern?: string;
  discount: number;
  finalPrice: number;
  originalPrice: number;
  surgeTriggered: boolean;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('upgrade_offer_events')
    .insert({
      user_id: params.userId,
      offer_variant: params.offerVariant,
      emotion_state: params.emotionState,
      roi_estimate: params.roiEstimate,
      behavior_pattern: params.behaviorPattern,
      discount_amount: params.discount,
      final_price: params.finalPrice,
      original_price: params.originalPrice,
      surge_triggered: params.surgeTriggered,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error tracking dynamic offer:', error);
    return null;
  }

  return data?.id;
}
