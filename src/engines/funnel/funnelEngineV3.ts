/**
 * FUNNEL ENGINE V3 - FILIPINO SALES OPTIMIZED
 *
 * Makes funnel decisions based on:
 * - Intent (Filipino sales patterns)
 * - Lead temperature
 * - Funnel stage (awareness → closing)
 * - Member rank
 * - Compensation plan structure
 */

export type UserIntent =
  | "greeting"
  | "product_inquiry"
  | "benefits"
  | "price"
  | "ordering_process"
  | "shipping_cod"
  | "side_effects"
  | "objection"
  | "hesitation"
  | "earning_opportunity"
  | "business_details"
  | "ready_to_buy"
  | "follow_up"
  | "salesInquiry"
  | "productInterest"
  | "pricing"
  | "closingOpportunity"
  | "leadQualification"
  | "mlmRecruit"
  | "mlmTraining"
  | "leadFollowUp"
  | "customerSupport"
  | "techSupport"
  | "complaint"
  | "orderTracking"
  | "refund"
  | "productEducation"
  | "off_topic"
  | "default";

export type LeadTemperature = 'cold' | 'warm' | 'hot' | 'readyToBuy';

export type FunnelStage =
  | "awareness"
  | "interest"
  | "evaluation"
  | "decision"
  | "closing"
  | "followUp"
  | "revival";

/**
 * Detect funnel stage from user intent
 * Maps Filipino sales intents to appropriate funnel stages
 */
export function detectFunnelStage(intent: UserIntent): FunnelStage {
  switch (intent) {
    // Top of funnel: Awareness
    case "greeting":
    case "off_topic":
    case "default":
      return "awareness";

    // Interest stage: Asking questions
    case "product_inquiry":
    case "productInterest":
    case "benefits":
    case "productEducation":
      return "interest";

    // Evaluation stage: Comparing, checking details
    case "price":
    case "pricing":
    case "side_effects":
    case "business_details":
    case "hesitation":
    case "objection":
    case "leadQualification":
      return "evaluation";

    // Decision stage: Ready to move forward
    case "ordering_process":
    case "shipping_cod":
    case "earning_opportunity":
    case "mlmRecruit":
    case "salesInquiry":
      return "decision";

    // Closing stage: Ready to buy NOW
    case "ready_to_buy":
    case "closingOpportunity":
      return "closing";

    // Follow-up & revival
    case "follow_up":
    case "leadFollowUp":
      return "followUp";

    case "customerSupport":
    case "techSupport":
    case "complaint":
    case "orderTracking":
    case "refund":
      return "evaluation"; // Keep them engaged

    default:
      return "awareness";
  }
}

/**
 * Auto-progress stage based on confidence and signals
 * Ensures funnel only moves forward, never backwards
 */
export function autoProgressStage(current: FunnelStage, next: FunnelStage): FunnelStage {
  const order: FunnelStage[] = [
    "awareness",
    "interest",
    "evaluation",
    "decision",
    "closing",
    "followUp",
    "revival"
  ];

  const currentIndex = order.indexOf(current);
  const nextIndex = order.indexOf(next);

  // Only progress forward
  if (nextIndex > currentIndex) return next;
  return current;
}

/**
 * Get suggested strategy for each funnel stage + intent combo
 */
export function getSalesStrategy(stage: FunnelStage, intent: UserIntent): string {
  // Ready to buy - immediate action
  if (intent === 'ready_to_buy' || intent === 'closingOpportunity') {
    return 'CLOSE NOW: Confirm order, send payment link, walk through process';
  }

  // Stage-based strategies
  switch (stage) {
    case 'awareness':
      return 'Warm greeting + quick value prop + qualifying question';

    case 'interest':
      if (intent === 'benefits') return 'List 3-5 benefits + social proof + ask if interested';
      return 'Share key features + benefits + testimonial';

    case 'evaluation':
      if (intent === 'price') return 'Share price + value justification + bundle offer + CTA';
      if (intent === 'hesitation') return 'Empathize + address concern + create urgency';
      return 'Provide proof + address objections + build trust';

    case 'decision':
      if (intent === 'ordering_process') return 'Clear steps + make it easy + reassure';
      if (intent === 'shipping_cod') return 'Explain options + emphasize convenience';
      return 'Final push: urgency + guarantee + clear CTA';

    case 'closing':
      return 'Confirm choice + celebrate decision + easy checkout';

    case 'followUp':
      return 'Acknowledge + set expectation + leave door open';

    default:
      return 'Build relationship + provide value';
  }
}

export interface FunnelContext {
  intent: UserIntent;
  leadTemperature: LeadTemperature;
  memberRank: string;
  compPlan: any | null;
  currentStage: string;
}

export interface FunnelStepResult {
  stage: string;
  sequenceKey: string;
  persona: 'sales' | 'mlmLeader' | 'support' | 'productExpert' | 'default';
  goal: string;
  recommendedActions: string[];
}

const RANK_ORDER = ['Starter', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

function rankIndex(rank: string): number {
  const idx = RANK_ORDER.indexOf(rank);
  return idx === -1 ? 0 : idx;
}

/**
 * Main funnel decision engine
 */
export function nextFunnelStepRankAware(ctx: FunnelContext): FunnelStepResult {
  const { intent, leadTemperature, memberRank, currentStage } = ctx;
  const isLeader = rankIndex(memberRank) >= rankIndex('Silver');

  // Detect next stage from intent
  const suggestedStage = detectFunnelStage(intent);

  // Auto-progress (never go backwards)
  let nextStage = autoProgressStage(currentStage as FunnelStage, suggestedStage);

  // Override for hot/readyToBuy - skip to closing
  if (leadTemperature === 'hot' || leadTemperature === 'readyToBuy') {
    nextStage = 'closing';
  }

  // Override for cold leads - stay in awareness/interest
  if (leadTemperature === 'cold' && nextStage !== 'awareness' && nextStage !== 'interest') {
    nextStage = 'interest';
  }

  // Persona selection based on intent and rank
  let persona: FunnelStepResult['persona'] = 'sales';
  if (intent === 'mlmTraining' || intent === 'mlmRecruit') {
    persona = isLeader ? 'mlmLeader' : 'sales';
  } else if (
    intent === 'customerSupport' ||
    intent === 'techSupport' ||
    intent === 'complaint'
  ) {
    persona = 'support';
  } else if (intent === 'productEducation') {
    persona = 'productExpert';
  }

  // Build sequence key for message templates
  const sequenceKey = [
    'mlm',
    intent,
    nextStage,
    leadTemperature,
    isLeader ? 'leader' : 'member',
  ]
    .join('_')
    .toLowerCase();

  // Goal setting
  let goal = 'Move the lead one step forward in the funnel.';
  if (nextStage === 'closing') {
    goal = 'Get clear yes/no decision and move to activation.';
  } else if (nextStage === 'decision') {
    goal = 'Address final objections and build urgency.';
  } else if (nextStage === 'evaluation') {
    goal = 'Provide proof and build trust.';
  } else if (nextStage === 'interest') {
    goal = 'Build curiosity and qualify needs.';
  }

  // Recommended actions based on stage and rank
  const recommendedActions = getRecommendedActions(nextStage, isLeader, leadTemperature);

  return {
    stage: nextStage,
    sequenceKey,
    persona,
    goal,
    recommendedActions,
  };
}

/**
 * Get recommended actions for the funnel stage
 */
function getRecommendedActions(
  stage: string,
  isLeader: boolean,
  temperature: LeadTemperature
): string[] {
  const actions: string[] = [];

  switch (stage) {
    case 'awareness':
      actions.push('Share value-focused content');
      actions.push('Ask qualifying questions');
      if (isLeader) actions.push('Invite to team event or webinar');
      break;

    case 'interest':
      actions.push('Share success stories');
      actions.push('Provide product/opportunity overview');
      actions.push('Schedule discovery call');
      break;

    case 'evaluation':
      actions.push('Share testimonials and proof');
      actions.push('Address specific objections');
      actions.push('Compare to alternatives');
      if (isLeader) actions.push('Introduce upline mentor');
      break;

    case 'decision':
      actions.push('Create urgency with limited-time offer');
      actions.push('Clarify investment and ROI');
      actions.push('Get commitment date');
      break;

    case 'closing':
      if (temperature === 'readyToBuy' || temperature === 'hot') {
        actions.push('Send enrollment link NOW');
        actions.push('Walk through sign-up process');
        actions.push('Schedule onboarding call');
      } else {
        actions.push('Address final concerns');
        actions.push('Offer trial or guarantee');
        actions.push('Set clear next step');
      }
      break;

    default:
      actions.push('Continue building relationship');
  }

  return actions;
}

/**
 * Get next rank based on current rank
 */
export function nextRank(currentRank: string): string {
  const idx = RANK_ORDER.indexOf(currentRank);
  return idx === -1 || idx === RANK_ORDER.length - 1 ? currentRank : RANK_ORDER[idx + 1];
}

/**
 * Calculate rank progress percentage
 */
export function calculateRankProgress(
  currentVolume: number,
  currentRank: string,
  compPlan: any
): { progress: number; nextRank: string; volumeNeeded: number } {
  const next = nextRank(currentRank);

  if (next === currentRank || !compPlan?.rankRules) {
    return { progress: 100, nextRank: currentRank, volumeNeeded: 0 };
  }

  const nextRankRule = compPlan.rankRules.find((r: any) => r.rank === next);
  if (!nextRankRule) {
    return { progress: 100, nextRank: currentRank, volumeNeeded: 0 };
  }

  const volumeNeeded = nextRankRule.minVolume - currentVolume;
  const progress = Math.min(100, (currentVolume / nextRankRule.minVolume) * 100);

  return {
    progress,
    nextRank: next,
    volumeNeeded: Math.max(0, volumeNeeded),
  };
}
