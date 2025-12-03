/**
 * Adaptive Upgrade Nudge Engine v3.0
 *
 * Enhanced nudge system that adapts based on:
 * - User behavior patterns
 * - Emotional state (from DeepScan + Chatbot)
 * - Success metrics (deals closed, calls scheduled)
 * - Usage patterns (energy, inbox, pipeline)
 * - ROI signals (revenue generated)
 * - Peak motivation windows
 */

import { type TierId, type NudgeTrigger } from './nudgeEngine';

export type EmotionalState =
  | 'excited'
  | 'curious'
  | 'hesitant'
  | 'overwhelmed'
  | 'confident'
  | 'skeptical'
  | 'frustrated'
  | 'momentum'
  | 'fearOfMissingOut'
  | 'stressed'
  | 'optimistic'
  | 'eager';

export interface UserMetrics {
  closedDeals: number;
  scheduledCalls: number;
  activeDealValue: number;
  warmLeads: number;
  monthlyRevenue: number;
  winRate: number;
  averageDealSize: number;
  pipelineVelocity: number;
}

export interface UsagePatterns {
  dailyScans: number;
  weeklyScans: number;
  monthlyScans: number;
  dailyMessages: number;
  energy: number;
  coins: number;
  inboxActiveChats: number;
  pipelineSize: number;
  pipelineStages: number;
  averageSessionDuration: number;
  loginStreak: number;
  lastActiveHour: number;
}

export interface ROISignals {
  closedDeals: number;
  monthlyRevenueFromNexScout: number;
  revenuePerScan: number;
  costPerAcquisition: number;
  lifetimeValue: number;
  timeToFirstDeal: number;
  dealClosureRate: number;
}

export interface EmotionalProfile {
  primaryEmotion: EmotionalState;
  confidence: number; // 0-100
  urgency: number; // 0-100
  trust: number; // 0-100
  enthusiasm: number; // 0-100
  overwhelmLevel: number; // 0-100
  recentInteractions: Array<{
    emotion: EmotionalState;
    timestamp: string;
    trigger: string;
  }>;
}

export interface AdaptiveNudgeContext {
  tier: TierId;
  metrics: UserMetrics;
  usage: UsagePatterns;
  roi: ROISignals;
  emotional: EmotionalProfile;
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
}

export interface AdaptiveNudgeTrigger extends NudgeTrigger {
  // New adaptive triggers
  FREE_USER_MAKING_MONEY?: never;
  EMOTIONAL_MOMENTUM_PRO?: never;
  TEAM_REVENUE_UPSELL?: never;
  TEAM_SUPPORT_NUDGE?: never;
  ROI_MULTIPLIER_NUDGE?: never;
  PEAK_PERFORMANCE_NUDGE?: never;
  STRESS_RELIEF_TEAM?: never;
  FOMO_LIMITED_TIME?: never;
  SUCCESS_AMPLIFIER?: never;
  ENERGY_PACK_UPSELL?: never;
}

/**
 * Main adaptive nudge engine
 */
export function adaptiveNudgeEngine(context: AdaptiveNudgeContext): string | null {
  const { tier, metrics, usage, roi, emotional, timeOfDay } = context;

  // Peak motivation windows (9-11am, 2-4pm)
  const isPeakWindow = (timeOfDay >= 9 && timeOfDay <= 11) || (timeOfDay >= 14 && timeOfDay <= 16);

  // FREE TIER ADAPTIVE NUDGES
  if (tier === 'FREE') {
    // ROI-based: User making money with free tier
    if (roi.closedDeals > 0 && roi.monthlyRevenueFromNexScout > 0) {
      return 'FREE_USER_MAKING_MONEY';
    }

    // Success amplifier: User has warm leads
    if (metrics.warmLeads >= 3 && metrics.winRate > 0.2) {
      return 'SUCCESS_AMPLIFIER';
    }

    // Emotional momentum: Excited/Optimistic users
    if (
      (emotional.primaryEmotion === 'excited' || emotional.primaryEmotion === 'optimistic') &&
      emotional.enthusiasm > 70
    ) {
      return 'EMOTIONAL_MOMENTUM_PRO';
    }

    // FOMO trigger: High usage + peak window
    if (usage.dailyScans >= 2 && isPeakWindow && emotional.urgency > 60) {
      return 'FOMO_LIMITED_TIME';
    }

    // Usage limits
    if (usage.dailyScans >= 3) {
      return 'LIMIT_REACHED_SCAN';
    }

    // Low energy during active session
    if (usage.energy < 2 && usage.dailyScans > 0) {
      return 'LOW_ENERGY_PRO_UPSELL';
    }

    // Frustrated user hitting limits
    if (
      (emotional.primaryEmotion === 'frustrated' || emotional.primaryEmotion === 'overwhelmed') &&
      (usage.dailyScans >= 2 || usage.dailyMessages >= 2)
    ) {
      return 'STRESS_RELIEF_PRO';
    }
  }

  // PRO TIER ADAPTIVE NUDGES
  if (tier === 'PRO') {
    // Revenue-based team upsell
    if (roi.monthlyRevenueFromNexScout > 20000 && metrics.closedDeals >= 5) {
      return 'TEAM_REVENUE_UPSELL';
    }

    // Inbox overload
    if (usage.inboxActiveChats > 20) {
      return 'TEAM_INBOX_UPSELL';
    }

    // Pipeline growth
    if (usage.pipelineSize > 100 && metrics.warmLeads > 30) {
      return 'TEAM_UPSELL_PIPELINE';
    }

    // Overwhelmed emotional state
    if (
      (emotional.primaryEmotion === 'overwhelmed' || emotional.primaryEmotion === 'stressed') &&
      emotional.overwhelmLevel > 70
    ) {
      return 'TEAM_SUPPORT_NUDGE';
    }

    // High performer during peak window
    if (isPeakWindow && metrics.winRate > 0.4 && roi.revenuePerScan > 1000) {
      return 'PEAK_PERFORMANCE_NUDGE';
    }

    // Energy pack upsell
    if (usage.energy < 10 && usage.dailyScans > 5) {
      return 'ENERGY_PACK_UPSELL';
    }

    // ROI multiplier for successful users
    if (
      roi.closedDeals >= 10 &&
      roi.dealClosureRate > 0.3 &&
      emotional.confidence > 80
    ) {
      return 'ROI_MULTIPLIER_NUDGE';
    }
  }

  return null;
}

/**
 * Get emotional nudge personalization
 */
export function getEmotionalNudgeStyle(emotion: EmotionalState): {
  tone: string;
  urgency: 'low' | 'medium' | 'high';
  style: 'opportunity' | 'reassurance' | 'support' | 'roi' | 'empowering';
  messageTemplate: string;
} {
  const styles: Record<EmotionalState, ReturnType<typeof getEmotionalNudgeStyle>> = {
    excited: {
      tone: 'enthusiastic',
      urgency: 'high',
      style: 'opportunity',
      messageTemplate: "You're on fire! 🔥 {feature} will multiply your momentum!",
    },
    curious: {
      tone: 'informative',
      urgency: 'medium',
      style: 'opportunity',
      messageTemplate: "Discover how {feature} can unlock even more opportunities",
    },
    hesitant: {
      tone: 'reassuring',
      urgency: 'low',
      style: 'reassurance',
      messageTemplate: "Try {feature} risk-free for 7 days. Cancel anytime.",
    },
    overwhelmed: {
      tone: 'supportive',
      urgency: 'medium',
      style: 'support',
      messageTemplate: "{feature} helps distribute the workload so you can focus on closing",
    },
    confident: {
      tone: 'empowering',
      urgency: 'medium',
      style: 'roi',
      messageTemplate: "You're crushing it! {feature} will amplify your results",
    },
    skeptical: {
      tone: 'proof-based',
      urgency: 'low',
      style: 'roi',
      messageTemplate: "Hundreds of closers like you increased sales by 3x with {feature}",
    },
    frustrated: {
      tone: 'empowering',
      urgency: 'high',
      style: 'empowering',
      messageTemplate: "Never hit limits again. {feature} gives you unlimited power.",
    },
    momentum: {
      tone: 'amplifying',
      urgency: 'high',
      style: 'roi',
      messageTemplate: "You closed {deals} deals this week. {feature} will help you close more daily.",
    },
    fearOfMissingOut: {
      tone: 'urgent',
      urgency: 'high',
      style: 'opportunity',
      messageTemplate: "Don't miss out! Top closers are using {feature} to scale fast.",
    },
    stressed: {
      tone: 'calming',
      urgency: 'medium',
      style: 'support',
      messageTemplate: "{feature} automates the hard parts so you can breathe easier",
    },
    optimistic: {
      tone: 'encouraging',
      urgency: 'medium',
      style: 'opportunity',
      messageTemplate: "Perfect timing! {feature} will help you reach your goals faster",
    },
    eager: {
      tone: 'action-oriented',
      urgency: 'high',
      style: 'opportunity',
      messageTemplate: "Ready to level up? {feature} unlocks your full potential",
    },
  };

  return styles[emotion];
}

/**
 * Get adaptive nudge message based on context
 */
export function getAdaptiveNudgeMessage(
  trigger: string,
  context: AdaptiveNudgeContext
): {
  title: string;
  message: string;
  benefits: string[];
  ctaText: string;
  urgency: 'low' | 'medium' | 'high';
} {
  const { emotional, metrics, roi } = context;
  const emotionalStyle = getEmotionalNudgeStyle(emotional.primaryEmotion);

  const messages: Record<string, ReturnType<typeof getAdaptiveNudgeMessage>> = {
    FREE_USER_MAKING_MONEY: {
      title: "You're Already Making Money! 💰",
      message: `You've closed ${roi.closedDeals} deal${roi.closedDeals > 1 ? 's' : ''} with FREE. PRO will help you close ${roi.closedDeals * 3}+ monthly.`,
      benefits: [
        `3x your current ₱${roi.monthlyRevenueFromNexScout.toLocaleString()} monthly revenue`,
        'Unlimited scans = more prospects = more deals',
        'Auto follow-ups close deals while you sleep',
        'DeepScan reveals buying intent instantly',
      ],
      ctaText: 'Scale to PRO — ₱1,299/mo',
      urgency: 'high',
    },

    EMOTIONAL_MOMENTUM_PRO: {
      title: emotionalStyle.messageTemplate.replace('{feature}', 'PRO'),
      message: "You're using NexScout like a professional closer. Time to unlock full power!",
      benefits: [
        'Unlimited everything (no more waiting)',
        'Auto-closing AI assistant',
        'Advanced DeepScan intelligence',
        'Priority support',
      ],
      ctaText: 'Upgrade to PRO',
      urgency: 'high',
    },

    SUCCESS_AMPLIFIER: {
      title: 'Amplify Your Success 📈',
      message: `You have ${metrics.warmLeads} warm leads ready to close. PRO gives you the tools to close them faster.`,
      benefits: [
        'Auto follow-ups nurture all your warm leads',
        'Smart scheduling books calls automatically',
        'Emotional selling guides maximize conversions',
        'Unlimited energy to engage everyone',
      ],
      ctaText: 'Close More Deals with PRO',
      urgency: 'high',
    },

    TEAM_REVENUE_UPSELL: {
      title: "Scale Beyond ₱20K/Month 🚀",
      message: `You're generating ₱${roi.monthlyRevenueFromNexScout.toLocaleString()}/mo. Team mode helps you build a sales team and 10x that.`,
      benefits: [
        'Build and manage your own sales team',
        'Automatic lead distribution',
        'Team training AI',
        'Shared pipelines and resources',
        'Team performance analytics',
      ],
      ctaText: 'Build Your Team — ₱4,990/mo',
      urgency: 'high',
    },

    TEAM_SUPPORT_NUDGE: {
      title: 'Let Your Team Help 🤝',
      message: emotionalStyle.messageTemplate.replace('{feature}', 'Team mode'),
      benefits: [
        'Distribute leads to team members',
        'Shared inbox reduces your workload',
        'Team collaboration tools',
        'Focus on closing, not managing',
      ],
      ctaText: 'Get Team Support',
      urgency: 'medium',
    },

    PEAK_PERFORMANCE_NUDGE: {
      title: 'You're in the Zone! ⚡',
      message: `${metrics.winRate * 100}% win rate! Team mode will help you scale this performance.`,
      benefits: [
        'Clone your success with a trained team',
        'Handle 10x more leads',
        'Team analytics track performance',
        'Recruiting AI finds top closers',
      ],
      ctaText: 'Scale Your Success',
      urgency: 'high',
    },

    ENERGY_PACK_UPSELL: {
      title: 'Running Low on Energy',
      message: "You're actively selling. Don't let energy limits slow you down.",
      benefits: [
        'PRO gives 200 energy daily',
        'Faster regeneration',
        'Energy boost packs available',
        'Never wait again',
      ],
      ctaText: 'Get Unlimited Energy',
      urgency: 'medium',
    },

    ROI_MULTIPLIER_NUDGE: {
      title: 'Multiply Your ROI 📊',
      message: `${roi.closedDeals} deals closed with ${(roi.dealClosureRate * 100).toFixed(0)}% rate. Team mode will 5x your capacity.`,
      benefits: [
        'Handle 5x more prospects',
        'Team members = parallel selling',
        'Shared best practices',
        'Revenue scales linearly',
      ],
      ctaText: 'Scale Your Revenue',
      urgency: 'high',
    },

    STRESS_RELIEF_PRO: {
      title: 'Eliminate the Friction',
      message: emotionalStyle.messageTemplate.replace('{feature}', 'PRO'),
      benefits: [
        'No more daily limits',
        'Auto-everything features',
        'AI handles repetitive tasks',
        'Focus only on closing',
      ],
      ctaText: 'Upgrade for Peace of Mind',
      urgency: 'high',
    },

    FOMO_LIMITED_TIME: {
      title: "Don't Miss This Window! ⏰",
      message: "You're in the zone right now. PRO unlocks unlimited capacity during peak hours.",
      benefits: [
        'Scan all your prospects now',
        'Unlimited AI messages',
        'Auto follow-ups work 24/7',
        'Never lose momentum again',
      ],
      ctaText: 'Unlock Now',
      urgency: 'high',
    },
  };

  return messages[trigger] || {
    title: 'Unlock More Features',
    message: 'Upgrade to access premium features',
    benefits: ['Unlimited access', 'Advanced features', 'Priority support'],
    ctaText: 'Upgrade Now',
    urgency: 'medium',
  };
}

/**
 * Determine if now is a peak motivation window
 */
export function isPeakMotivationWindow(hour: number, dayOfWeek: number): boolean {
  // Weekend: 10am-12pm, 7pm-9pm
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return (hour >= 10 && hour <= 12) || (hour >= 19 && hour <= 21);
  }

  // Weekday: 9-11am, 2-4pm, 8-9pm
  return (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16) || (hour >= 20 && hour <= 21);
}

/**
 * Calculate nudge priority score (0-100)
 */
export function calculateNudgePriority(context: AdaptiveNudgeContext, trigger: string): number {
  let score = 50; // Base score

  const { emotional, roi, usage, timeOfDay, dayOfWeek } = context;

  // Emotional multipliers
  if (emotional.primaryEmotion === 'excited' || emotional.primaryEmotion === 'eager') {
    score += 15;
  }
  if (emotional.urgency > 70) {
    score += 10;
  }
  if (emotional.confidence > 80) {
    score += 10;
  }

  // ROI multipliers
  if (roi.closedDeals > 0) {
    score += 20;
  }
  if (roi.monthlyRevenueFromNexScout > 10000) {
    score += 15;
  }

  // Usage multipliers
  if (usage.loginStreak > 7) {
    score += 10;
  }
  if (usage.averageSessionDuration > 900) {
    // > 15 minutes
    score += 5;
  }

  // Time-based multipliers
  if (isPeakMotivationWindow(timeOfDay, dayOfWeek)) {
    score += 10;
  }

  // Cap at 100
  return Math.min(100, score);
}
