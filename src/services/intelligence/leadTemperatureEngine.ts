/**
 * LEAD TEMPERATURE & BUYER INTENT ML MODEL
 *
 * Used for:
 * - Smart follow-up
 * - Prioritizing leads
 * - Choosing which persona to use
 * - Choosing which funnel step to fire
 */

import { supabase } from '../../lib/supabase';

// ========================================
// TYPES & INTERFACES
// ========================================

export interface LeadSignals {
  messagesSent: number;
  replies: number;
  responseRate: number; // 0-1
  clickRate: number; // 0-1
  timeSinceLastReply: number; // hours
  linkClicks: number;
  openedEmails: number;
  productViews: number;
  expressedInterest: boolean;
  buyingLanguageScore: number; // 0-100 NLP sentiment
  objections: number;
  positiveBuyingSignals: number;
}

export interface LeadTemperatureResult {
  temperature: 'cold' | 'warm' | 'hot' | 'readyToBuy';
  score: number; // 0-100
  reasons: string[];
  recommendedNextStep: string;
  confidence: number; // 0-1
}

// ========================================
// LEAD TEMPERATURE ML ENGINE
// ========================================

class LeadTemperatureEngine {
  /**
   * Compute lead temperature using ML scoring model
   */
  computeLeadTemperature(signals: LeadSignals): LeadTemperatureResult {
    const reasons: string[] = [];

    // Weighted scoring algorithm
    let score = 0;

    // 1. Response Rate (25% weight)
    const responseComponent = signals.responseRate * 25;
    score += responseComponent;
    if (signals.responseRate > 0.7) {
      reasons.push('High response rate - actively engaged');
    }

    // 2. Buying Language Score (25% weight)
    const buyingComponent = (signals.buyingLanguageScore / 100) * 25;
    score += buyingComponent;
    if (signals.buyingLanguageScore > 60) {
      reasons.push('Strong buying intent detected in language');
    }

    // 3. Link Clicks (20% weight)
    const clickComponent = Math.min(signals.linkClicks / 5, 1) * 20;
    score += clickComponent;
    if (signals.linkClicks >= 3) {
      reasons.push('Multiple link clicks - high interest');
    }

    // 4. Expressed Interest (15% weight)
    const interestComponent = signals.expressedInterest ? 15 : 0;
    score += interestComponent;
    if (signals.expressedInterest) {
      reasons.push('Explicitly expressed interest');
    }

    // 5. Positive Buying Signals (15% weight)
    const signalComponent = Math.min(signals.positiveBuyingSignals / 3, 1) * 15;
    score += signalComponent;
    if (signals.positiveBuyingSignals >= 2) {
      reasons.push('Multiple positive buying signals detected');
    }

    // 6. Time Since Last Reply (negative 10% weight)
    const timeDecay = Math.min(signals.timeSinceLastReply / 72, 1) * 10; // 72 hours = full decay
    score -= timeDecay;
    if (signals.timeSinceLastReply < 12) {
      reasons.push('Recent engagement - still warm');
    } else if (signals.timeSinceLastReply > 48) {
      reasons.push('Going cold - needs re-engagement');
    }

    // Objections penalty
    if (signals.objections > 0) {
      score -= signals.objections * 5;
      reasons.push(`${signals.objections} objection(s) raised`);
    }

    // Normalize score to 0-100
    const normalized = Math.max(0, Math.min(100, Math.round(score)));

    // Determine temperature
    let temperature: LeadTemperatureResult['temperature'] = 'cold';
    let recommendedNextStep = 'Trigger cold lead revival sequence';

    if (normalized >= 75) {
      temperature = 'readyToBuy';
      recommendedNextStep = 'Send closing sequence immediately';
    } else if (normalized >= 55) {
      temperature = 'hot';
      recommendedNextStep = 'Send high-pressure CTA message';
    } else if (normalized >= 35) {
      temperature = 'warm';
      recommendedNextStep = 'Send nurturing value sequence';
    }

    // Calculate confidence
    const confidence = this.calculateConfidence(signals);

    return {
      temperature,
      score: normalized,
      reasons,
      recommendedNextStep,
      confidence
    };
  }

  /**
   * Calculate confidence in the temperature assessment
   */
  private calculateConfidence(signals: LeadSignals): number {
    let confidence = 0.5; // Base confidence

    // More messages = higher confidence
    if (signals.messagesSent > 5) confidence += 0.1;
    if (signals.messagesSent > 10) confidence += 0.1;

    // Replies indicate engagement certainty
    if (signals.replies > 3) confidence += 0.15;

    // Multiple data points
    const dataPoints = [
      signals.linkClicks > 0,
      signals.openedEmails > 0,
      signals.productViews > 0,
      signals.buyingLanguageScore > 0
    ].filter(Boolean).length;

    confidence += dataPoints * 0.05;

    return Math.min(confidence, 1);
  }

  /**
   * Extract lead signals from prospect data
   */
  async extractLeadSignals(prospectId: string, userId: string): Promise<LeadSignals> {
    // Get prospect data
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*, prospect_profiles(*), prospect_events(*)')
      .eq('id', prospectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    // Get messaging history
    const { data: messages } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('prospect_id', prospectId)
      .eq('user_id', userId);

    const messagesSent = messages?.length || 0;
    const replies = messages?.filter(m => m.reply_received).length || 0;
    const responseRate = messagesSent > 0 ? replies / messagesSent : 0;

    // Get link clicks
    const linkClicks = messages?.filter(m => m.link_clicked).length || 0;
    const openedEmails = messages?.filter(m => m.opened).length || 0;

    // Calculate time since last reply
    const lastReply = messages?.filter(m => m.reply_received).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    const timeSinceLastReply = lastReply
      ? (Date.now() - new Date(lastReply.created_at).getTime()) / (1000 * 60 * 60)
      : 999;

    // Analyze sentiment for buying language
    const buyingLanguageScore = this.analyzeBuyingLanguage(prospect, messages || []);

    // Count positive buying signals
    const positiveBuyingSignals = this.countPositiveBuyingSignals(prospect, messages || []);

    // Count objections
    const objections = this.countObjections(messages || []);

    return {
      messagesSent,
      replies,
      responseRate,
      clickRate: messagesSent > 0 ? linkClicks / messagesSent : 0,
      timeSinceLastReply,
      linkClicks,
      openedEmails,
      productViews: prospect.product_views || 0,
      expressedInterest: prospect.expressed_interest || false,
      buyingLanguageScore,
      objections,
      positiveBuyingSignals
    };
  }

  /**
   * Analyze buying language in messages
   */
  private analyzeBuyingLanguage(prospect: any, messages: any[]): number {
    const buyingKeywords = [
      'ready', 'interested', 'yes', 'okay', 'sure', 'sign up', 'buy', 'purchase',
      'how much', 'price', 'cost', 'payment', 'checkout', 'when can i start',
      'interested na', 'sige', 'game', 'go', 'magkano', 'presyo'
    ];

    let score = 0;
    const allText = [
      prospect.bio || '',
      ...messages.map(m => m.message_text || '')
    ].join(' ').toLowerCase();

    for (const keyword of buyingKeywords) {
      if (allText.includes(keyword)) {
        score += 5;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Count positive buying signals
   */
  private countPositiveBuyingSignals(prospect: any, messages: any[]): number {
    let signals = 0;

    if (prospect.product_views > 2) signals++;
    if (prospect.expressed_interest) signals++;
    if (messages.some(m => m.link_clicked)) signals++;
    if (messages.filter(m => m.reply_received).length >= 3) signals++;
    if (prospect.booking_requested) signals++;

    return signals;
  }

  /**
   * Count objections raised
   */
  private countObjections(messages: any[]): number {
    const objectionKeywords = [
      'expensive', 'mahal', 'no money', 'walang pera', 'no time', 'walang oras',
      'not interested', 'hindi interested', 'scam', 'not sure', 'hindi sigurado',
      'think about it', 'isipin ko', 'maybe later', 'mamaya na'
    ];

    let objections = 0;
    for (const message of messages) {
      const text = (message.message_text || '').toLowerCase();
      for (const keyword of objectionKeywords) {
        if (text.includes(keyword)) {
          objections++;
          break; // Count once per message
        }
      }
    }

    return objections;
  }

  /**
   * Calculate and save lead temperature
   */
  async calculateAndSaveTemperature(prospectId: string, userId: string): Promise<LeadTemperatureResult> {
    // Extract signals
    const signals = await this.extractLeadSignals(prospectId, userId);

    // Compute temperature
    const result = this.computeLeadTemperature(signals);

    // Save to database
    await supabase.from('lead_temperature_scores').insert({
      user_id: userId,
      prospect_id: prospectId,
      temperature: result.temperature,
      score: result.score,
      signals,
      recommended_next_step: result.recommendedNextStep,
      reasons: result.reasons,
      calculated_at: new Date().toISOString()
    });

    return result;
  }

  /**
   * Get latest temperature for a prospect
   */
  async getLatestTemperature(prospectId: string, userId: string): Promise<LeadTemperatureResult | null> {
    const { data } = await supabase
      .from('lead_temperature_scores')
      .select('*')
      .eq('prospect_id', prospectId)
      .eq('user_id', userId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return {
      temperature: data.temperature as LeadTemperatureResult['temperature'],
      score: data.score,
      reasons: data.reasons,
      recommendedNextStep: data.recommended_next_step,
      confidence: 0.8 // From stored data
    };
  }

  /**
   * Get all prospects by temperature
   */
  async getProspectsByTemperature(
    userId: string,
    temperature: LeadTemperatureResult['temperature']
  ): Promise<string[]> {
    const { data } = await supabase
      .from('lead_temperature_scores')
      .select('prospect_id')
      .eq('user_id', userId)
      .eq('temperature', temperature)
      .order('calculated_at', { ascending: false });

    return data?.map(d => d.prospect_id) || [];
  }
}

// Export singleton instance
export const leadTemperatureEngine = new LeadTemperatureEngine();
