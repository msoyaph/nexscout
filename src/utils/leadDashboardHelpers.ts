/**
 * Lead Dashboard Helper Functions
 * Colors, badges, and recommendation logic
 */

import type { LeadTemperature, FunnelStage, LeadDashboardData } from '../types/LeadDashboard';

/**
 * Get temperature badge colors (Tailwind classes)
 */
export function temperatureColor(temp: LeadTemperature): string {
  switch (temp) {
    case "ready":
      return "bg-red-500 text-white";
    case "hot":
      return "bg-orange-500 text-white";
    case "warm":
      return "bg-yellow-500 text-black";
    case "cold":
      return "bg-blue-200 text-gray-700";
    default:
      return "bg-gray-300 text-black";
  }
}

/**
 * Get temperature icon
 */
export function temperatureIcon(temp: LeadTemperature): string {
  switch (temp) {
    case "ready":
      return "🔥🔥🔥";
    case "hot":
      return "🔥🔥";
    case "warm":
      return "🔥";
    case "cold":
      return "❄️";
    default:
      return "⚪";
  }
}

/**
 * Get funnel stage badge colors
 */
export function stageColor(stage: FunnelStage): string {
  const colors: Record<FunnelStage, string> = {
    awareness: "bg-gray-200 text-gray-700",
    interest: "bg-blue-200 text-blue-700",
    evaluation: "bg-indigo-200 text-indigo-700",
    decision: "bg-purple-200 text-purple-700",
    closing: "bg-green-200 text-green-700",
    followUp: "bg-yellow-200 text-yellow-700",
    revival: "bg-pink-200 text-pink-700"
  };
  return colors[stage] || "bg-gray-200 text-gray-700";
}

/**
 * Get funnel stage emoji
 */
export function stageEmoji(stage: FunnelStage): string {
  const emojis: Record<FunnelStage, string> = {
    awareness: "👀",
    interest: "✨",
    evaluation: "🤔",
    decision: "⚖️",
    closing: "🎯",
    followUp: "📞",
    revival: "🔄"
  };
  return emojis[stage] || "📊";
}

/**
 * Get offer type badge color
 */
export function offerTypeColor(type: string): string {
  switch (type) {
    case "upsell":
      return "bg-green-100 text-green-700 border-green-300";
    case "downsell":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "crossSell":
      return "bg-purple-100 text-purple-700 border-purple-300";
    case "stay":
      return "bg-gray-100 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

/**
 * Calculate recommended next action based on lead data
 */
export function getNextAction(lead: LeadDashboardData): string {
  // Priority 1: Ready to buy
  if (lead.leadTemperature === "ready") {
    return "🎯 Send Checkout Link / Collect Delivery Details NOW";
  }

  // Priority 2: Hot leads
  if (lead.leadTemperature === "hot") {
    if (lead.buyingSignals.includes("codInterest")) {
      return "📦 Offer COD + Ask for Location / Close the Sale";
    }
    if (lead.buyingSignals.includes("readyToOrder")) {
      return "💳 Send Payment Link + Confirm Order Details";
    }
    return "🔥 Encourage Quick Order / Create Urgency";
  }

  // Priority 3: Warm leads needing nurture
  if (lead.leadTemperature === "warm") {
    if (lead.funnelStage === "evaluation") {
      return "⭐ Share Testimonials + Ask About Specific Health Goals";
    }
    if (lead.funnelStage === "decision") {
      return "💡 Address Concerns + Highlight Value Proposition";
    }
    return "🤝 Build Trust / Share Success Stories";
  }

  // Priority 4: Offer-specific actions
  if (lead.offerSuggestion.type === "downsell") {
    return "💰 Offer Starter Pack / Lower Barrier Option";
  }

  if (lead.offerSuggestion.type === "upsell") {
    return "📈 Highlight Savings & Value of Bundle";
  }

  if (lead.offerSuggestion.type === "crossSell") {
    return "💼 Introduce Business Opportunity Path";
  }

  // Default: Re-engage
  return "📬 Re-engage with Soft Follow-up Message";
}

/**
 * Get urgency level based on temperature and signals
 */
export function getUrgencyLevel(lead: LeadDashboardData): "high" | "medium" | "low" {
  if (lead.leadTemperature === "ready") return "high";
  if (lead.leadTemperature === "hot") return "high";
  if (lead.leadTemperature === "warm" && lead.leadScore >= 40) return "medium";
  return "low";
}

/**
 * Get urgency color
 */
export function urgencyColor(urgency: "high" | "medium" | "low"): string {
  switch (urgency) {
    case "high":
      return "bg-red-100 text-red-700 border-red-300";
    case "medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "low":
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

/**
 * Calculate conversion probability
 */
export function calculateConversionProbability(lead: LeadDashboardData): number {
  let probability = lead.leadScore;

  // Boost for hot/ready
  if (lead.leadTemperature === "ready") probability += 20;
  if (lead.leadTemperature === "hot") probability += 10;

  // Boost for closing stage
  if (lead.funnelStage === "closing") probability += 15;
  if (lead.funnelStage === "decision") probability += 10;

  // Boost for strong buying signals
  if (lead.buyingSignals.includes("readyToOrder")) probability += 15;
  if (lead.buyingSignals.includes("codInterest")) probability += 10;

  return Math.min(100, Math.max(0, probability));
}
