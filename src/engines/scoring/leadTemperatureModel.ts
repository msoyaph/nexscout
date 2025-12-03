/**
 * LEAD TEMPERATURE MODEL
 *
 * Computes lead temperature score based on signals
 */

export interface LeadSignals {
  messagesSent?: number;
  repliesReceived?: number;
  lastReplyDaysAgo?: number;
  clickRate?: number;
  responseRate?: number;
  engagementScore?: number;
  daysInFunnel?: number;
}

export interface LeadTemperatureResult {
  temperature: 'cold' | 'warm' | 'hot' | 'readyToBuy';
  score: number;
  reasons: string[];
  recommendedNextStep: string;
}

/**
 * Compute lead temperature
 */
export function computeLeadTemperature(signals: LeadSignals): LeadTemperatureResult {
  let score = 0;
  const reasons: string[] = [];

  // Response rate scoring (30 points max)
  if (signals.responseRate !== undefined) {
    if (signals.responseRate > 0.7) {
      score += 30;
      reasons.push('Very high response rate');
    } else if (signals.responseRate > 0.4) {
      score += 20;
      reasons.push('Good response rate');
    } else if (signals.responseRate > 0.2) {
      score += 10;
      reasons.push('Moderate response rate');
    } else {
      reasons.push('Low response rate');
    }
  }

  // Recent engagement (25 points max)
  if (signals.lastReplyDaysAgo !== undefined) {
    if (signals.lastReplyDaysAgo <= 1) {
      score += 25;
      reasons.push('Replied very recently');
    } else if (signals.lastReplyDaysAgo <= 3) {
      score += 20;
      reasons.push('Replied recently');
    } else if (signals.lastReplyDaysAgo <= 7) {
      score += 10;
      reasons.push('Replied this week');
    } else if (signals.lastReplyDaysAgo <= 14) {
      score += 5;
    } else {
      reasons.push('No recent engagement');
    }
  }

  // Click rate scoring (20 points max)
  if (signals.clickRate !== undefined) {
    if (signals.clickRate > 0.5) {
      score += 20;
      reasons.push('High click-through rate');
    } else if (signals.clickRate > 0.2) {
      score += 10;
      reasons.push('Moderate interest signals');
    }
  }

  // Engagement score (15 points max)
  if (signals.engagementScore !== undefined) {
    score += Math.min(15, signals.engagementScore * 15);
  }

  // Message volume (10 points max)
  if (signals.repliesReceived !== undefined && signals.messagesSent !== undefined) {
    const ratio = signals.messagesSent > 0 ? signals.repliesReceived / signals.messagesSent : 0;
    if (ratio > 0.5) {
      score += 10;
      reasons.push('Active conversation');
    } else if (ratio > 0.2) {
      score += 5;
    }
  }

  // Determine temperature
  let temperature: LeadTemperatureResult['temperature'];
  let recommendedNextStep: string;

  if (score >= 75) {
    temperature = 'readyToBuy';
    recommendedNextStep = 'Send enrollment link NOW. Schedule onboarding call.';
  } else if (score >= 50) {
    temperature = 'hot';
    recommendedNextStep = 'Address final objections. Create urgency. Ask for commitment.';
  } else if (score >= 25) {
    temperature = 'warm';
    recommendedNextStep = 'Share proof and testimonials. Build trust. Qualify needs.';
  } else {
    temperature = 'cold';
    recommendedNextStep = 'Build rapport. Ask qualifying questions. Share value.';
  }

  return {
    temperature,
    score: Math.round(score),
    reasons: reasons.slice(0, 3), // Top 3 reasons
    recommendedNextStep,
  };
}
