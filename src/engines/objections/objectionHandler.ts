/**
 * OBJECTION HANDLER ENGINE
 *
 * Detects and handles objections with pre-crafted Filipino rebuttals
 * Empathetic, persuasive, and strategic
 * 
 * UPDATED: Industry-isolated objection handling to prevent cross-industry leakage
 */

import type { UserIntent } from '../messaging/intentRouter';
import objectionHandlers from '../sequences/objection-handlers.json';
import type { Industry } from '../../config/scout/industryWeights';

export type ObjectionType =
  | "price"
  | "hesitation"
  | "needsMoreInfo"
  | "tooExpensive"
  | "decisionDelay"
  | "skepticism"
  | "competition"
  | "timing"
  | "none";

export interface ObjectionDetectionResult {
  objectionType: ObjectionType;
  confidence: number;
  rebuttal: string;
  strategy: string;
}

/**
 * Detect objection type from message
 */
export function detectObjection(message: string): ObjectionType {
  const m = message.toLowerCase();

  // Price objection
  if (/\b(mahal|expensive|pricey|ang presyo|too much|sobrang mahal)\b/.test(m)) {
    return "price";
  }

  // Too expensive (stronger version)
  if (/\b(sobra|grabe|ang mahal|very expensive|too expensive|di kaya|afford)\b/.test(m)) {
    return "tooExpensive";
  }

  // Hesitation
  if (/\b(think about|pag isipan|babalikan|di pa sure|not sure|uncertain|maybe)\b/.test(m)) {
    return "hesitation";
  }

  // Decision delay
  if (/\b(later|next time|tom|bukas|next week|next month|sa susunod)\b/.test(m)) {
    return "decisionDelay";
  }

  // Needs more info
  if (/\b(more info|details|explain|ano ba|paano|tell me more|elaborate)\b/.test(m)) {
    return "needsMoreInfo";
  }

  // Skepticism
  if (/\b(legit ba|scam|totoo ba|believable|trust|sketchy|doubtful|panig)\b/.test(m)) {
    return "skepticism";
  }

  // Competition mention
  if (/\b(other|compare|competitor|ibang brand|alternative|vs|versus)\b/.test(m)) {
    return "competition";
  }

  // Timing objection
  if (/\b(not now|bad timing|busy|di pa|wala pang|hindi pa)\b/.test(m)) {
    return "timing";
  }

  return "none";
}

/**
 * Get rebuttal for objection
 * @param objectionType - Type of objection
 * @param activeIndustry - Active industry (for industry-specific rebuttals)
 */
export function getObjectionRebuttal(objectionType: ObjectionType, activeIndustry?: Industry): string {
  const handlers = objectionHandlers as Record<ObjectionType, string[]>;
  
  // If industry-specific handlers exist, use them; otherwise fall back to generic
  // Note: Current objection-handlers.json is generic, but structure supports industry-specific expansion
  const rebuttals = handlers[objectionType];

  if (!rebuttals || rebuttals.length === 0) {
    // Industry-specific fallback messages
    const fallbackByIndustry: Record<Industry, string> = {
      mlm: "I understand your concern po. Let me help address that for you 😊",
      insurance: "I understand your concern. Let me help you find the best solution for your needs.",
      real_estate: "I understand your concern. Let me address that and show you how we can work around it.",
      ecommerce: "Gets ko yung concern mo! Let me help you find the best option for you 😊",
      direct_selling: "I understand your concern po. Let me help address that for you 😊",
    };
    
    return activeIndustry 
      ? (fallbackByIndustry[activeIndustry] || fallbackByIndustry.mlm)
      : "I understand your concern po. Let me help address that for you 😊";
  }

  // Return random rebuttal (filtered by industry if industry-specific handlers exist)
  return rebuttals[Math.floor(Math.random() * rebuttals.length)];
}

/**
 * Detect objection with full analysis
 * @param message - User message to analyze
 * @param intent - User intent context
 * @param activeIndustry - Active industry for industry-specific strategies
 */
export function detectObjectionWithAnalysis(
  message: string, 
  intent: UserIntent,
  activeIndustry?: Industry
): ObjectionDetectionResult {
  const objectionType = detectObjection(message);
  const m = message.toLowerCase();

  let confidence = 0.7;
  let strategy = '';

  // Industry-specific strategies
  const strategiesByIndustry: Partial<Record<Industry, Record<ObjectionType, string>>> = {
    mlm: {
      price: "Focus on VALUE not price. Show ROI potential, break down daily cost, highlight income opportunity.",
      tooExpensive: "Emphasize low starter cost, installment options, and value proposition.",
      timing: "Acknowledge timing. Ask WHEN is better. Offer to follow up. Mention opportunity window.",
      spouse: "Offer info packet for spouse, success stories, or invite couple to orientation.",
    },
    insurance: {
      price: "Break down coverage value vs. cost. Show long-term benefits and flexible payment plans.",
      tooExpensive: "Discuss different coverage tiers and payment options (monthly, quarterly, annual).",
      timing: "Discuss urgency of protection. 'Better safe than sorry' - but no pressure.",
      spouse: "Offer comprehensive proposal they can review together, including benefits breakdown.",
    },
    real_estate: {
      price: "Show financing options, payment plans, investment value, and appreciation potential.",
      tooExpensive: "Discuss bank financing, in-house payment plans, and property value over time.",
      timing: "Discuss market timing, property availability, and early bird discounts if applicable.",
      spouse: "Offer property viewing together, comprehensive portfolio, and financing consultation.",
    },
    ecommerce: {
      price: "Highlight product value, promotions, discounts, and bundle deals.",
      tooExpensive: "Offer COD, installment via GCash, or payment plans if available.",
      timing: "Acknowledge timing. Offer to hold item or send reminder when ready.",
      spouse: "Offer product catalog they can review together, with pricing and payment options.",
    },
  };

  // Use industry-specific strategy if available
  const industryStrategies = activeIndustry ? strategiesByIndustry[activeIndustry] : undefined;
  const industryStrategy = industryStrategies?.[objectionType];

  switch (objectionType) {
    case "price":
    case "tooExpensive":
      confidence = 0.85;
      strategy = industryStrategy || "Focus on VALUE not price. Show ROI, break down daily cost, offer bundles.";
      break;

    case "hesitation":
      confidence = 0.8;
      strategy = "Ask qualifying questions. Find the ROOT concern. Address it specifically.";
      break;

    case "decisionDelay":
      confidence = 0.8;
      strategy = activeIndustry === 'ecommerce' 
        ? "Create soft urgency. Mention limited stock. Offer to hold item for 24 hours."
        : "Create soft urgency. Mention limited availability. Offer to hold reservation.";
      break;

    case "needsMoreInfo":
      confidence = 0.75;
      strategy = "Provide specific info they need. Keep it concise. Ask if they need more.";
      break;

    case "skepticism":
      confidence = 0.85;
      strategy = activeIndustry === 'mlm' || activeIndustry === 'direct_selling'
        ? "Build TRUST. Show testimonials, certifications, FDA registration, reviews, proven results."
        : "Build TRUST. Show testimonials, certifications, reviews, proven results.";
      break;

    case "competition":
      confidence = 0.8;
      strategy = "Highlight unique benefits. Don't badmouth competitors. Focus on YOUR strengths.";
      break;

    case "timing":
      confidence = 0.75;
      strategy = industryStrategy || "Acknowledge timing. Ask WHEN is better. Offer to follow up. Create urgency gently.";
      break;

    default:
      confidence = 0.5;
      strategy = "General empathy and qualification.";
  }

  // Boost confidence if clear objection words
  if (/mahal|expensive|later|scam|legit/.test(m)) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  const rebuttal = getObjectionRebuttal(objectionType, activeIndustry);

  return {
    objectionType,
    confidence,
    rebuttal,
    strategy
  };
}

/**
 * Get objection handling strategy
 */
export function getObjectionStrategy(objectionType: ObjectionType): string {
  const strategies: Record<ObjectionType, string> = {
    price: "VALUE OVER PRICE: Show ROI, daily cost breakdown, compare to alternatives, bundle savings",
      tooExpensive: "ANCHOR VALUE: Social proof, results, testimonials, payment plans",
    hesitation: "QUALIFY DEEPER: Ask questions, find root concern, address specifically, soften close",
    decisionDelay: "CREATE URGENCY: Limited stocks, promo ending, reservation option, FOMO gently",
    needsMoreInfo: "EDUCATE CONCISELY: Answer specific question, provide proof, ask if clear",
    skepticism: "BUILD TRUST: Testimonials, certifications, FDA/certs, reviews, proven results, transparent process",
    competition: "DIFFERENTIATE: Unique benefits, customer success, quality focus, don't bash others",
    timing: "SCHEDULE FOLLOW-UP: Acknowledge timing, ask when better, offer reminder, gentle urgency",
    none: "GENERAL EMPATHY: Listen, understand, ask qualifying questions"
  };

  return strategies[objectionType] || strategies.none;
}

/**
 * Map objection to intent
 */
export function mapObjectionToIntent(objectionType: ObjectionType): UserIntent {
  const mapping: Record<ObjectionType, UserIntent> = {
    price: "price",
    tooExpensive: "hesitation",
    hesitation: "hesitation",
    decisionDelay: "follow_up",
    needsMoreInfo: "product_inquiry",
    skepticism: "business_details",
    competition: "product_inquiry",
    timing: "follow_up",
    none: "off_topic"
  };

  return mapping[objectionType] || "off_topic";
}

/**
 * Get multiple rebuttals for A/B testing
 */
export function getAllRebuttals(objectionType: ObjectionType): string[] {
  const handlers = objectionHandlers as Record<ObjectionType, string[]>;
  return handlers[objectionType] || [];
}

/**
 * Select best rebuttal based on context
 */
export function selectContextualRebuttal(
  objectionType: ObjectionType,
  leadTemperature: 'cold' | 'warm' | 'hot' | 'readyToBuy',
  messageLength: number
): string {
  const rebuttals = getAllRebuttals(objectionType);

  if (rebuttals.length === 0) {
    return getObjectionRebuttal(objectionType);
  }

  // Hot leads get shorter, more direct rebuttals
  if (leadTemperature === 'hot' || leadTemperature === 'readyToBuy') {
    return rebuttals[0]; // First rebuttal is usually most direct
  }

  // Cold leads get longer, more educational rebuttals
  if (leadTemperature === 'cold') {
    return rebuttals[rebuttals.length - 1]; // Last rebuttal is usually most detailed
  }

  // Warm leads get balanced approach
  const midIndex = Math.floor(rebuttals.length / 2);
  return rebuttals[midIndex];
}

/**
 * Track objection handling effectiveness
 */
export interface ObjectionMetrics {
  objectionType: ObjectionType;
  rebuttalUsed: string;
  wasResolved: boolean;
  ledToConversion: boolean;
  responseTime: number;
}

/**
 * Get objection description for humans
 */
export function getObjectionDescription(objectionType: ObjectionType): string {
  const descriptions: Record<ObjectionType, string> = {
    price: "Price concern - wants to know if worth the cost",
    tooExpensive: "Strong price objection - thinks it's too expensive",
    hesitation: "Hesitating - unsure about decision",
    decisionDelay: "Delaying decision - wants to decide later",
    needsMoreInfo: "Needs more information before deciding",
    skepticism: "Skeptical - questioning legitimacy/effectiveness",
    competition: "Comparing with competitors",
    timing: "Bad timing - not right moment to buy",
    none: "No objection detected"
  };

  return descriptions[objectionType] || objectionType;
}
