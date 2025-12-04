/**
 * FOLLOW-UP AUTOMATION ENGINE
 *
 * Automates follow-up messages based on:
 * - Funnel stage
 * - Lead temperature
 * - Time elapsed
 * - Previous interactions
 * - Buying signals
 */

import type { FunnelStage } from '../funnel/funnelEngineV3';
import type { BuyingSignal } from '../signals/buyingSignals';
import funnelSequences from '../sequences/funnel-sequences.json';

export interface FollowUpContext {
  funnelStage: FunnelStage;
  leadTemperature: 'cold' | 'warm' | 'hot' | 'readyToBuy';
  lastMessageTimestamp: number;
  buyingSignals: BuyingSignal[];
  messageCount: number;
  hasOrderIntent: boolean;
}

export interface FollowUpResult {
  shouldFollowUp: boolean;
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  delayHours: number;
  reason: string;
}

/**
 * Get follow-up message for a funnel stage
 */
export function getFollowUpMessage(stage: FunnelStage): string {
  const sequences = funnelSequences as Record<FunnelStage, string[]>;
  const messages = sequences[stage] || sequences['awareness'];

  // Return random message from the stage's sequences
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Determine if follow-up is needed
 */
export function shouldFollowUp(
  lastMessageTimestamp: number,
  stage: FunnelStage,
  temperature: 'cold' | 'warm' | 'hot' | 'readyToBuy'
): boolean {
  const hoursElapsed = (Date.now() - lastMessageTimestamp) / 3600000;

  // Temperature-based thresholds
  if (temperature === 'readyToBuy') {
    return hoursElapsed >= 0.5; // 30 minutes for hot leads!
  }

  if (temperature === 'hot') {
    return hoursElapsed >= 2; // 2 hours for hot leads
  }

  // Stage-based thresholds
  switch (stage) {
    case 'closing':
      return hoursElapsed >= 1; // Very aggressive follow-up
    case 'decision':
      return hoursElapsed >= 3; // Quick follow-up
    case 'evaluation':
      return hoursElapsed >= 6; // Same day follow-up
    case 'interest':
      return hoursElapsed >= 12; // Half day follow-up
    case 'awareness':
      return hoursElapsed >= 24; // Next day follow-up
    case 'followUp':
      return hoursElapsed >= 48; // 2 days later
    case 'revival':
      return hoursElapsed >= 168; // 1 week for revival
    default:
      return hoursElapsed >= 24;
  }
}

/**
 * Calculate follow-up priority and get message
 */
export function calculateFollowUp(context: FollowUpContext): FollowUpResult {
  const {
    funnelStage,
    leadTemperature,
    lastMessageTimestamp,
    buyingSignals,
    messageCount,
    hasOrderIntent
  } = context;

  const hoursElapsed = (Date.now() - lastMessageTimestamp) / 3600000;

  // Determine if should follow up
  const needsFollowUp = shouldFollowUp(lastMessageTimestamp, funnelStage, leadTemperature);

  if (!needsFollowUp) {
    return {
      shouldFollowUp: false,
      message: '',
      urgency: 'low',
      delayHours: 0,
      reason: 'Too soon to follow up'
    };
  }

  // Calculate urgency
  let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let delayHours = 24;
  let reason = '';

  // CRITICAL: Ready to buy but didn't complete
  if (leadTemperature === 'readyToBuy' && hasOrderIntent) {
    urgency = 'critical';
    delayHours = 0.5; // 30 minutes
    reason = 'Hot lead showed buying intent but didn\'t complete order';
  }
  // HIGH: Hot lead in closing stage
  else if (leadTemperature === 'hot' || funnelStage === 'closing') {
    urgency = 'high';
    delayHours = 2;
    reason = 'Hot lead in closing stage - needs immediate attention';
  }
  // MEDIUM: Warm lead or decision stage
  else if (leadTemperature === 'warm' || funnelStage === 'decision') {
    urgency = 'medium';
    delayHours = 6;
    reason = 'Warm lead in decision stage - good timing to nudge';
  }
  // LOW: Cold lead or early stage
  else {
    urgency = 'low';
    delayHours = 24;
    reason = 'Cold lead or early stage - gentle nurture';
  }

  // Boost urgency if buying signals present
  if (buyingSignals.includes('priceCheck' as BuyingSignal) ||
      buyingSignals.includes('codInterest' as BuyingSignal)) {
    if (urgency === 'low') urgency = 'medium';
    else if (urgency === 'medium') urgency = 'high';
  }

  // Get appropriate follow-up message
  const message = getFollowUpMessage(funnelStage);

  return {
    shouldFollowUp: true,
    message,
    urgency,
    delayHours,
    reason
  };
}

/**
 * Get follow-up sequence (multiple messages over time)
 */
export function getFollowUpSequence(
  stage: FunnelStage,
  temperature: 'cold' | 'warm' | 'hot' | 'readyToBuy'
): Array<{ delayHours: number; message: string }> {
  const sequences = funnelSequences as Record<FunnelStage, string[]>;
  const messages = sequences[stage] || sequences['awareness'];

  // Define sequence timing based on temperature
  const timings = temperature === 'hot'
    ? [1, 6, 24]       // Hot: 1hr, 6hrs, 24hrs
    : temperature === 'warm'
    ? [6, 24, 72]      // Warm: 6hrs, 1day, 3days
    : [24, 72, 168];   // Cold: 1day, 3days, 1week

  return timings.map((delay, index) => ({
    delayHours: delay,
    message: messages[index % messages.length]
  }));
}

/**
 * Smart follow-up message selector
 * Chooses message based on previous attempts
 */
export function selectSmartFollowUpMessage(
  stage: FunnelStage,
  attemptNumber: number,
  previousMessages: string[]
): string {
  const sequences = funnelSequences as Record<FunnelStage, string[]>;
  const messages = sequences[stage] || sequences['awareness'];

  // Filter out already sent messages
  const availableMessages = messages.filter(msg => !previousMessages.includes(msg));

  // If all messages used, restart with variation
  if (availableMessages.length === 0) {
    return messages[attemptNumber % messages.length];
  }

  // Return new message
  return availableMessages[0];
}

/**
 * Determine optimal follow-up channel
 */
export function getOptimalFollowUpChannel(
  context: FollowUpContext
): 'web' | 'facebook' | 'email' | 'sms' | 'whatsapp' {
  const { funnelStage, leadTemperature, messageCount } = context;

  // Critical/hot leads - use fastest channel
  if (leadTemperature === 'readyToBuy' || leadTemperature === 'hot') {
    return 'facebook'; // Messenger is fastest for Filipino market
  }

  // Warm leads - alternate between channels
  if (leadTemperature === 'warm') {
    return messageCount % 2 === 0 ? 'facebook' : 'web';
  }

  // Cold leads - use less intrusive channels
  if (funnelStage === 'awareness' || funnelStage === 'interest') {
    return 'email';
  }

  return 'facebook'; // Default to Facebook Messenger
}

/**
 * Generate follow-up analytics data
 */
export interface FollowUpAnalytics {
  totalFollowUps: number;
  responseRate: number;
  conversionRate: number;
  averageResponseTime: number;
  bestPerformingStage: FunnelStage;
}

/**
 * Calculate when next follow-up should happen
 */
export function calculateNextFollowUpTime(
  lastFollowUp: number,
  stage: FunnelStage,
  temperature: 'cold' | 'warm' | 'hot' | 'readyToBuy',
  attemptNumber: number
): Date {
  const baseDelays: Record<typeof temperature, number> = {
    readyToBuy: 0.5,  // 30 minutes
    hot: 2,           // 2 hours
    warm: 6,          // 6 hours
    cold: 24          // 24 hours
  };

  // Get base delay
  let delayHours = baseDelays[temperature];

  // Increase delay with each attempt (exponential backoff)
  delayHours = delayHours * Math.pow(1.5, attemptNumber - 1);

  // Cap maximum delay at 7 days
  delayHours = Math.min(delayHours, 168);

  const nextTime = new Date(lastFollowUp);
  nextTime.setHours(nextTime.getHours() + delayHours);

  return nextTime;
}
