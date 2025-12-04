/**
 * Replay & Coaching Engine (AI Gong.io Clone)
 *
 * After every conversation:
 * - AI analyzes messages line-by-line
 * - Identifies mistakes
 * - Suggests improvements
 * - Scores: empathy, persuasion, objection handling, clarity, professionalism
 * - Generates "Coach Report"
 */

import { supabase } from '../../lib/supabase';

export interface CoachingReport {
  overall_score: number;
  dimension_scores: {
    empathy: number;
    persuasion: number;
    objection_handling: number;
    clarity: number;
    professionalism: number;
    company_alignment: number;
  };
  strengths: string[];
  weaknesses: string[];
  missed_opportunities: string[];
  improvement_tips: string[];
  best_messages: string[];
  worst_messages: string[];
  recommended_practice: string;
  key_moments: Array<{
    timestamp: string;
    message: string;
    analysis: string;
    score: number;
  }>;
}

export interface ConversationForCoaching {
  user_id: string;
  session_id: string;
  messages: Array<{
    id: string;
    sender: 'visitor' | 'ai' | 'human';
    message: string;
    timestamp: string;
  }>;
  outcome: 'converted' | 'qualified' | 'nurture' | 'lost';
  buying_intent_final: number;
  emotional_state_final: string;
}

export class CoachingEngine {
  /**
   * Generate comprehensive coaching report
   */
  static async generateCoachingReport(
    conversation: ConversationForCoaching
  ): Promise<CoachingReport> {
    // Analyze each human message
    const humanMessages = conversation.messages.filter(m => m.sender === 'human');
    const visitorMessages = conversation.messages.filter(m => m.sender === 'visitor');

    // Calculate dimension scores
    const empathy = this.scoreEmpathy(humanMessages, visitorMessages);
    const persuasion = this.scorePersuasion(humanMessages, conversation);
    const objection = this.scoreObjectionHandling(humanMessages, visitorMessages);
    const clarity = this.scoreClarity(humanMessages);
    const professionalism = this.scoreProfessionalism(humanMessages);
    const alignment = this.scoreCompanyAlignment(humanMessages);

    // Calculate overall (weighted average)
    const overall = (
      empathy * 0.20 +
      persuasion * 0.20 +
      objection * 0.20 +
      clarity * 0.15 +
      professionalism * 0.15 +
      alignment * 0.10
    );

    // Identify strengths and weaknesses
    const scores = { empathy, persuasion, objection, clarity, professionalism, alignment };
    const strengths = this.identifyStrengths(scores);
    const weaknesses = this.identifyWeaknesses(scores);

    // Find best and worst messages
    const messageAnalysis = this.analyzeMessages(humanMessages);
    const best_messages = messageAnalysis
      .filter(m => m.score >= 0.80)
      .map(m => m.message)
      .slice(0, 3);
    const worst_messages = messageAnalysis
      .filter(m => m.score < 0.50)
      .map(m => m.message)
      .slice(0, 3);

    // Identify missed opportunities
    const missed = this.identifyMissedOpportunities(conversation);

    // Generate improvement tips
    const tips = this.generateImprovementTips(scores, missed, conversation);

    // Recommended practice
    const practice = this.recommendPractice(scores, conversation);

    // Key moments
    const key_moments = this.identifyKeyMoments(conversation);

    // Store in database
    await this.storeCoachingFeedback(
      conversation.user_id,
      conversation.session_id,
      overall,
      scores,
      strengths,
      weaknesses,
      tips,
      practice,
      key_moments
    );

    return {
      overall_score: overall,
      dimension_scores: {
        empathy,
        persuasion,
        objection_handling: objection,
        clarity,
        professionalism,
        company_alignment: alignment
      },
      strengths,
      weaknesses,
      missed_opportunities: missed,
      improvement_tips: tips,
      best_messages,
      worst_messages,
      recommended_practice: practice,
      key_moments
    };
  }

  /**
   * Score empathy (0-100)
   */
  private static scoreEmpathy(humanMessages: any[], visitorMessages: any[]): number {
    let score = 50; // baseline

    humanMessages.forEach((msg) => {
      const text = msg.message.toLowerCase();

      // Positive indicators
      if (text.includes('understand') || text.includes('hear you')) score += 5;
      if (text.includes('appreciate') || text.includes('thank')) score += 3;
      if (text.includes('i see') || text.includes('makes sense')) score += 3;
      if (text.match(/[😊😀🙂👍]/)) score += 2;

      // Negative indicators
      if (text.includes('just') || text.includes('simply')) score -= 2;
      if (text.includes('but') && !text.includes('and')) score -= 3;
      if (text.length < 20) score -= 1; // too short, not empathetic
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score persuasion effectiveness (0-100)
   */
  private static scorePersuasion(humanMessages: any[], conversation: any): number {
    let score = 50;

    humanMessages.forEach((msg) => {
      const text = msg.message.toLowerCase();

      // Strong persuasion techniques
      if (text.includes('imagine') || text.includes('picture this')) score += 5;
      if (text.includes('benefit') || text.includes('value')) score += 4;
      if (text.includes('proven') || text.includes('results')) score += 4;
      if (text.includes('others like you') || text.includes('clients')) score += 3;

      // Weak persuasion
      if (text.includes('maybe') || text.includes('perhaps')) score -= 2;
      if (!text.includes('you') && text.length > 50) score -= 3; // not customer-focused
    });

    // Outcome bonus
    if (conversation.outcome === 'converted') score += 15;
    else if (conversation.outcome === 'qualified') score += 8;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score objection handling (0-100)
   */
  private static scoreObjectionHandling(humanMessages: any[], visitorMessages: any[]): number {
    let score = 70;

    // Find objections in visitor messages
    const objections = visitorMessages.filter(v =>
      v.message.toLowerCase().includes('but') ||
      v.message.toLowerCase().includes('expensive') ||
      v.message.toLowerCase().includes('not sure')
    );

    if (objections.length === 0) return score; // no objections to handle

    objections.forEach((obj) => {
      const objIndex = visitorMessages.indexOf(obj);
      const nextHuman = humanMessages.find((h, i) => i > objIndex);

      if (!nextHuman) {
        score -= 10; // didn't respond to objection
        return;
      }

      const response = nextHuman.message.toLowerCase();

      // Good objection handling
      if (response.includes('understand') || response.includes('hear you')) score += 5;
      if (response.includes('many clients') || response.includes('others felt')) score += 5;
      if (response.includes('actually') || response.includes('in fact')) score += 3;

      // Poor objection handling
      if (response.includes('but') && !response.includes('and')) score -= 5;
      if (response.length < 30) score -= 3; // too brief
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score clarity (0-100)
   */
  private static scoreClarity(humanMessages: any[]): number {
    let score = 70;

    humanMessages.forEach((msg) => {
      const text = msg.message;

      // Positive indicators
      if (text.split('.').length >= 2 && text.split('.').length <= 4) score += 3; // good structure
      if (text.includes('1.') || text.includes('2.')) score += 5; // numbered lists
      if (text.length >= 50 && text.length <= 200) score += 3; // optimal length

      // Negative indicators
      if (text.length > 300) score -= 5; // too long
      if (text.length < 20) score -= 3; // too short
      if (!text.includes('.') && text.length > 50) score -= 3; // no punctuation
      if (text.split(',').length > 5) score -= 2; // run-on sentence
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score professionalism (0-100)
   */
  private static scoreProfessionalism(humanMessages: any[]): number {
    let score = 80;

    humanMessages.forEach((msg) => {
      const text = msg.message;

      // Positive indicators
      if (text.match(/^[A-Z]/)) score += 2; // starts with capital
      if (text.match(/[.!?]$/)) score += 2; // ends with punctuation

      // Negative indicators
      if (text.match(/[A-Z]{3,}/)) score -= 5; // ALL CAPS
      if (text.includes('!!!')) score -= 3; // excessive punctuation
      if (text.toLowerCase().includes('lol') || text.toLowerCase().includes('haha')) score -= 5;
      if (text.match(/\s{2,}/)) score -= 2; // multiple spaces
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score company alignment (0-100)
   */
  private static scoreCompanyAlignment(humanMessages: any[]): number {
    // This would check against company materials
    // For now, use simplified scoring
    let score = 75;

    humanMessages.forEach((msg) => {
      const text = msg.message.toLowerCase();

      // Good alignment indicators
      if (text.includes('we') || text.includes('our')) score += 2;
      if (text.includes('mission') || text.includes('value')) score += 3;

      // Off-brand indicators
      if (text.includes('cheap') || text.includes('discount') without context) score -= 3;
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Identify strengths
   */
  private static identifyStrengths(scores: any): string[] {
    const strengths: string[] = [];

    if (scores.empathy >= 80) strengths.push('Excellent empathy and active listening');
    if (scores.persuasion >= 80) strengths.push('Strong persuasive communication');
    if (scores.objection >= 80) strengths.push('Great objection handling');
    if (scores.clarity >= 85) strengths.push('Clear and concise messaging');
    if (scores.professionalism >= 90) strengths.push('Highly professional tone');

    if (strengths.length === 0) {
      strengths.push('Maintained conversation flow', 'Engaged with prospect');
    }

    return strengths;
  }

  /**
   * Identify weaknesses
   */
  private static identifyWeaknesses(scores: any): string[] {
    const weaknesses: string[] = [];

    if (scores.empathy < 60) weaknesses.push('Needs more empathy and understanding');
    if (scores.persuasion < 60) weaknesses.push('Weak persuasion techniques');
    if (scores.objection < 60) weaknesses.push('Poor objection handling');
    if (scores.clarity < 65) weaknesses.push('Messages lack clarity');
    if (scores.professionalism < 70) weaknesses.push('Tone could be more professional');

    return weaknesses;
  }

  /**
   * Identify missed opportunities
   */
  private static identifyMissedOpportunities(conversation: any): string[] {
    const missed: string[] = [];

    const visitorMessages = conversation.messages.filter((m: any) => m.sender === 'visitor');

    visitorMessages.forEach((msg: any) => {
      const text = msg.message.toLowerCase();

      if (text.includes('when') || text.includes('timeline')) {
        missed.push('Prospect asked about timeline - could have suggested appointment');
      }
      if ((text.includes('price') || text.includes('cost')) && conversation.outcome !== 'converted') {
        missed.push('Pricing discussion - could have framed value better');
      }
      if (text.includes('interested') && conversation.outcome !== 'converted') {
        missed.push('Expressed interest - could have closed more directly');
      }
    });

    return [...new Set(missed)]; // remove duplicates
  }

  /**
   * Generate improvement tips
   */
  private static generateImprovementTips(scores: any, missed: string[], conversation: any): string[] {
    const tips: string[] = [];

    if (scores.empathy < 70) {
      tips.push('Use more empathetic phrases like "I understand" and "I hear you"');
      tips.push('Ask follow-up questions to show you\'re listening');
    }

    if (scores.persuasion < 70) {
      tips.push('Use success stories and social proof');
      tips.push('Focus on benefits, not just features');
    }

    if (scores.objection < 70) {
      tips.push('Acknowledge objections before addressing them');
      tips.push('Use the "Feel, Felt, Found" technique');
    }

    if (scores.clarity < 70) {
      tips.push('Keep messages between 50-200 characters');
      tips.push('Use numbered lists for multiple points');
    }

    if (missed.length > 2) {
      tips.push('Listen for buying signals and act on them immediately');
      tips.push('When prospect shows interest, move to close quickly');
    }

    if (tips.length === 0) {
      tips.push('Continue your strong performance!');
      tips.push('Focus on building rapport even faster');
    }

    return tips;
  }

  /**
   * Recommend practice
   */
  private static recommendPractice(scores: any, conversation: any): string {
    if (scores.objection < 65) {
      return 'Practice objection handling with Script #7: Price Objections';
    }
    if (scores.persuasion < 65) {
      return 'Review persuasive techniques in Module 3: Value Selling';
    }
    if (scores.empathy < 65) {
      return 'Practice empathetic listening in Training: Active Listening';
    }
    if (conversation.outcome === 'lost') {
      return 'Review closing techniques in Script #12: Soft Close';
    }

    return 'Great job! Review top performer conversations for inspiration';
  }

  /**
   * Identify key moments in conversation
   */
  private static identifyKeyMoments(conversation: any) {
    // Placeholder - would analyze critical turning points
    return [
      {
        timestamp: '10:32',
        message: 'Prospect asked about pricing',
        analysis: 'Good value positioning, but could have closed stronger',
        score: 0.75
      }
    ];
  }

  /**
   * Analyze individual messages
   */
  private static analyzeMessages(humanMessages: any[]) {
    return humanMessages.map(msg => ({
      message: msg.message,
      score: Math.random() * 0.4 + 0.6 // Placeholder scoring
    }));
  }

  /**
   * Store coaching feedback in database
   */
  private static async storeCoachingFeedback(
    user_id: string,
    session_id: string,
    overall: number,
    scores: any,
    strengths: string[],
    weaknesses: string[],
    tips: string[],
    practice: string,
    key_moments: any[]
  ) {
    const { error } = await supabase.from('coaching_feedback').insert({
      user_id,
      session_id,
      overall_score: overall,
      empathy_score: scores.empathy,
      persuasion_score: scores.persuasion,
      objection_handling_score: scores.objection,
      clarity_score: scores.clarity,
      professionalism_score: scores.professionalism,
      company_alignment_score: scores.alignment,
      strengths,
      weaknesses,
      improvement_tips: tips,
      recommended_practice: practice,
      key_moments
    });

    if (error) {
      console.error('Failed to store coaching feedback:', error);
    }
  }

  /**
   * Get coaching history for user
   */
  static async getCoachingHistory(user_id: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('coaching_feedback')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to load coaching history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get performance trends
   */
  static async getPerformanceTrends(user_id: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('coaching_feedback')
      .select('*')
      .eq('user_id', user_id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    return {
      avg_overall: data.reduce((sum, d) => sum + d.overall_score, 0) / data.length,
      avg_empathy: data.reduce((sum, d) => sum + d.empathy_score, 0) / data.length,
      avg_persuasion: data.reduce((sum, d) => sum + d.persuasion_score, 0) / data.length,
      trend: data[data.length - 1].overall_score > data[0].overall_score ? 'improving' : 'declining',
      total_sessions: data.length
    };
  }
}
