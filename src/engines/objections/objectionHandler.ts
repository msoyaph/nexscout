/**
 * OBJECTION HANDLER ENGINE
 *
 * Detects and handles objections with pre-crafted Filipino rebuttals
 * Empathetic, persuasive, and strategic
 */

import type { UserIntent } from '../messaging/intentRouter';
import objectionHandlers from '../sequences/objection-handlers.json';

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
 */
export function getObjectionRebuttal(objectionType: ObjectionType): string {
  const handlers = objectionHandlers as Record<ObjectionType, string[]>;
  const rebuttals = handlers[objectionType];

  if (!rebuttals || rebuttals.length === 0) {
    return "I understand your concern po. Let me help address that for you 😊";
  }

  // Return random rebuttal
  return rebuttals[Math.floor(Math.random() * rebuttals.length)];
}

/**
 * Detect objection with full analysis
 */
export function detectObjectionWithAnalysis(message: string, intent: UserIntent): ObjectionDetectionResult {
  const objectionType = detectObjection(message);
  const m = message.toLowerCase();

  let confidence = 0.7;
  let strategy = '';

  switch (objectionType) {
    case "price":
    case "tooExpensive":
      confidence = 0.85;
      strategy = "Focus on VALUE not price. Show ROI, break down daily cost, offer bundles.";
      break;

    case "hesitation":
      confidence = 0.8;
      strategy = "Ask qualifying questions. Find the ROOT concern. Address it specifically.";
      break;

    case "decisionDelay":
      confidence = 0.8;
      strategy = "Create soft urgency. Mention limited stocks. Offer to hold reservation.";
      break;

    case "needsMoreInfo":
      confidence = 0.75;
      strategy = "Provide specific info they need. Keep it concise. Ask if they need more.";
      break;

    case "skepticism":
      confidence = 0.85;
      strategy = "Build TRUST. Show testimonials, guarantees, FDA registration, reviews.";
      break;

    case "competition":
      confidence = 0.8;
      strategy = "Highlight unique benefits. Don't badmouth competitors. Focus on YOUR strengths.";
      break;

    case "timing":
      confidence = 0.75;
      strategy = "Acknowledge timing. Ask WHEN is better. Offer to follow up. Create urgency gently.";
      break;

    default:
      confidence = 0.5;
      strategy = "General empathy and qualification.";
  }

  // Boost confidence if clear objection words
  if (/mahal|expensive|later|scam|legit/.test(m)) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  const rebuttal = getObjectionRebuttal(objectionType);

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
    tooExpensive: "ANCHOR VALUE: Social proof, results, satisfaction guarantee, payment plans",
    hesitation: "QUALIFY DEEPER: Ask questions, find root concern, address specifically, soften close",
    decisionDelay: "CREATE URGENCY: Limited stocks, promo ending, reservation option, FOMO gently",
    needsMoreInfo: "EDUCATE CONCISELY: Answer specific question, provide proof, ask if clear",
    skepticism: "BUILD TRUST: Testimonials, guarantees, FDA/certs, reviews, transparent process",
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
