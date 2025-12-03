import { UserIntent } from "../messaging/intentRouter";
import { BuyingSignal } from "../signals/buyingSignals";
import { FunnelStage } from "../funnel/funnelEngineV3";

export type LeadTemperature = "cold" | "warm" | "hot" | "ready";

export interface LeadSignals {
  intents: UserIntent[];        // history of intents this session
  buyingSignals: BuyingSignal[]; // history of buying signals
  funnelStage: FunnelStage;
  messagesCount: number;
  lastReplyMsAgo: number;       // ms since user last replied
}

export function computeLeadScore(signals: LeadSignals): number {
  let score = 0;

  // Base on funnel stage
  switch (signals.funnelStage) {
    case "awareness":
      score += 5;
      break;
    case "interest":
      score += 15;
      break;
    case "evaluation":
      score += 25;
      break;
    case "decision":
      score += 35;
      break;
    case "closing":
      score += 45;
      break;
    case "followUp":
      score += 20;
      break;
    case "revival":
      score += 10;
      break;
  }

  // Intents
  for (const intent of signals.intents) {
    if (intent === "price") score += 10;
    if (intent === "ordering_process") score += 15;
    if (intent === "shipping_cod") score += 15;
    if (intent === "earning_opportunity") score += 10;
    if (intent === "benefits" || intent === "product_inquiry") score += 5;
    if (intent === "hesitation" || intent === "objection") score -= 5;
  }

  // Buying signals
  for (const bs of signals.buyingSignals) {
    if (bs === "priceCheck") score += 8;
    if (bs === "readyToOrder") score += 30;
    if (bs === "codInterest") score += 15;
    if (bs === "deliveryCheck") score += 10;
    if (bs === "promoInterest") score += 8;
    if (bs === "validation") score += 5;
  }

  // Engagement — more messages usually = more interest
  if (signals.messagesCount >= 3) score += 5;
  if (signals.messagesCount >= 6) score += 10;

  // Time decay (if matagal nang di nag-reply, bawas heat)
  const hoursAgo = signals.lastReplyMsAgo / 3600000;
  if (hoursAgo > 12) score -= 10;
  if (hoursAgo > 24) score -= 20;

  // Clamp
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return score;
}

export function classifyLeadTemperature(signals: LeadSignals): LeadTemperature {
  const score = computeLeadScore(signals);

  if (score >= 70) return "ready";
  if (score >= 45) return "hot";
  if (score >= 20) return "warm";
  return "cold";
}

export interface LeadTemperatureResult {
  temperature: LeadTemperature;
  score: number;
  signals: LeadSignals;
}

export function analyzeLeadTemperature(signals: LeadSignals): LeadTemperatureResult {
  const score = computeLeadScore(signals);
  const temperature = classifyLeadTemperature(signals);

  return {
    temperature,
    score,
    signals
  };
}
