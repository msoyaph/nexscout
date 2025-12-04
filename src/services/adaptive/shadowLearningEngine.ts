/**
 * Shadow Learning Engine
 *
 * Learns from top-performing human closers:
 * - Analyzes successful conversations
 * - Extracts style vectors & tone signatures
 * - Identifies closing patterns
 * - Learns objection handling techniques
 * - Adapts to cultural & linguistic preferences
 */

import { supabase } from '../../lib/supabase';

export interface CloserProfile {
  user_id: string;
  win_rate: number;
  avg_time_to_close_days: number;
  style_vector: StyleVector;
  tone_signature: ToneSignature;
  closing_patterns: ClosingPattern[];
  objection_patterns: ObjectionPattern[];
}

export interface StyleVector {
  formality: number; // 0-1
  enthusiasm: number;
  directness: number;
  empathy: number;
  urgency: number;
  technical_depth: number;
}

export interface ToneSignature {
  greeting_style: string;
  question_style: string;
  objection_style: string;
  closing_style: string;
  language_preference: 'english' | 'filipino' | 'taglish';
}

export interface ClosingPattern {
  pattern_type: string;
  trigger_conditions: string[];
  message_template: string;
  success_rate: number;
  avg_time_to_close: number;
}

export interface ObjectionPattern {
  objection_type: string;
  common_phrases: string[];
  response_template: string;
  resolution_rate: number;
}

export class ShadowLearningEngine {
  /**
   * Learn from a top closer's conversations
   */
  static async learnFromCloser(
    user_id: string,
    closer_id: string,
    sessions: any[]
  ): Promise<CloserProfile> {
    // Analyze all sessions
    const analysis = this.analyzeCloserSessions(sessions);

    // Extract style vector
    const style_vector = this.extractStyleVector(sessions);

    // Extract tone signature
    const tone_signature = this.extractToneSignature(sessions);

    // Identify closing patterns
    const closing_patterns = this.identifyClosingPatterns(sessions);

    // Identify objection patterns
    const objection_patterns = this.identifyObjectionPatterns(sessions);

    // Store learning profile
    await this.storeLearningProfile(user_id, closer_id, {
      style_vector,
      tone_signature,
      closing_patterns,
      objection_patterns,
      analysis
    });

    return {
      user_id: closer_id,
      win_rate: analysis.win_rate,
      avg_time_to_close_days: analysis.avg_time_to_close,
      style_vector,
      tone_signature,
      closing_patterns,
      objection_patterns
    };
  }

  /**
   * Analyze closer's sessions for patterns
   */
  private static analyzeCloserSessions(sessions: any[]) {
    const total = sessions.length;
    const conversions = sessions.filter(s => s.outcome === 'converted').length;
    const win_rate = conversions / total;

    const times_to_close = sessions
      .filter(s => s.outcome === 'converted')
      .map(s => s.duration_days || 7);

    const avg_time_to_close = times_to_close.reduce((a, b) => a + b, 0) / times_to_close.length;

    return {
      total_sessions: total,
      conversions,
      win_rate,
      avg_time_to_close,
      avg_messages: sessions.reduce((sum, s) => sum + (s.message_count || 0), 0) / total
    };
  }

  /**
   * Extract style vector from messages
   */
  private static extractStyleVector(sessions: any[]): StyleVector {
    // Analyze all human messages across sessions
    const messages = sessions.flatMap(s =>
      (s.messages || []).filter((m: any) => m.sender === 'human')
    );

    if (messages.length === 0) {
      return {
        formality: 0.5,
        enthusiasm: 0.7,
        directness: 0.6,
        empathy: 0.8,
        urgency: 0.5,
        technical_depth: 0.5
      };
    }

    // Formality: check for formal language
    const formality = this.calculateFormality(messages);

    // Enthusiasm: check for exclamation marks, caps, emojis
    const enthusiasm = this.calculateEnthusiasm(messages);

    // Directness: check for question-to-statement ratio
    const directness = this.calculateDirectness(messages);

    // Empathy: check for empathetic phrases
    const empathy = this.calculateEmpathy(messages);

    // Urgency: check for time-sensitive language
    const urgency = this.calculateUrgency(messages);

    // Technical depth: check for technical terms
    const technical_depth = this.calculateTechnicalDepth(messages);

    return {
      formality,
      enthusiasm,
      directness,
      empathy,
      urgency,
      technical_depth
    };
  }

  private static calculateFormality(messages: any[]): number {
    let score = 0.5;
    messages.forEach(msg => {
      const text = msg.message.toLowerCase();
      // Formal indicators
      if (text.match(/\b(please|kindly|would you|could you)\b/)) score += 0.02;
      if (text.match(/\b(sir|ma'am|mr|ms)\b/)) score += 0.03;
      // Informal indicators
      if (text.match(/\b(hey|gonna|wanna|yeah)\b/)) score -= 0.02;
      if (text.match(/😊|😀|👍/)) score -= 0.01;
    });
    return Math.max(0, Math.min(1, score));
  }

  private static calculateEnthusiasm(messages: any[]): number {
    let score = 0.5;
    messages.forEach(msg => {
      const text = msg.message;
      if (text.includes('!')) score += 0.03;
      if (text.match(/[😊😀🎉🚀💪]/)) score += 0.04;
      if (text.match(/[A-Z]{2,}/)) score += 0.02;
      if (text.includes('amazing') || text.includes('fantastic')) score += 0.03;
    });
    return Math.max(0, Math.min(1, score));
  }

  private static calculateDirectness(messages: any[]): number {
    const questions = messages.filter(m => m.message.includes('?')).length;
    const statements = messages.length - questions;
    return statements / messages.length;
  }

  private static calculateEmpathy(messages: any[]): number {
    let score = 0.5;
    messages.forEach(msg => {
      const text = msg.message.toLowerCase();
      if (text.match(/\b(understand|hear you|appreciate|feel)\b/)) score += 0.05;
      if (text.match(/\b(sorry|apologize)\b/)) score += 0.03;
      if (text.includes('i see') || text.includes('makes sense')) score += 0.04;
    });
    return Math.max(0, Math.min(1, score));
  }

  private static calculateUrgency(messages: any[]): number {
    let score = 0.3;
    messages.forEach(msg => {
      const text = msg.message.toLowerCase();
      if (text.match(/\b(today|now|urgent|limited|hurry)\b/)) score += 0.05;
      if (text.match(/\b(deadline|expires|last chance)\b/)) score += 0.06;
    });
    return Math.max(0, Math.min(1, score));
  }

  private static calculateTechnicalDepth(messages: any[]): number {
    let score = 0.4;
    messages.forEach(msg => {
      const text = msg.message.toLowerCase();
      if (text.match(/\b(api|integration|feature|dashboard)\b/)) score += 0.03;
      if (text.match(/\b(roi|kpi|metric|data)\b/)) score += 0.02;
    });
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Extract tone signature
   */
  private static extractToneSignature(sessions: any[]): ToneSignature {
    const messages = sessions.flatMap(s =>
      (s.messages || []).filter((m: any) => m.sender === 'human')
    );

    // Detect greeting style
    const greetings = messages.filter(m =>
      m.position === 0 || m.message.toLowerCase().match(/^(hi|hello|hey)/)
    );
    const greeting_style = this.detectGreetingStyle(greetings);

    // Detect language preference
    const language_preference = this.detectLanguage(messages);

    return {
      greeting_style,
      question_style: 'open_ended',
      objection_style: 'empathetic_resolution',
      closing_style: 'consultative_close',
      language_preference
    };
  }

  private static detectGreetingStyle(greetings: any[]): string {
    if (greetings.length === 0) return 'friendly';

    const sample = greetings[0].message.toLowerCase();
    if (sample.includes('😊') || sample.includes('!')) return 'enthusiastic';
    if (sample.match(/\b(sir|ma'am)\b/)) return 'formal';
    return 'friendly';
  }

  private static detectLanguage(messages: any[]): 'english' | 'filipino' | 'taglish' {
    const text = messages.map(m => m.message).join(' ').toLowerCase();

    const tagalogWords = ['po', 'opo', 'magkano', 'pwede', 'sige', 'kasi', 'lang', 'naman'];
    const tagalogCount = tagalogWords.filter(word => text.includes(word)).length;

    if (tagalogCount >= 3) return 'taglish';
    if (tagalogCount >= 1) return 'filipino';
    return 'english';
  }

  /**
   * Identify closing patterns
   */
  private static identifyClosingPatterns(sessions: any[]): ClosingPattern[] {
    const patterns: ClosingPattern[] = [];

    // Pattern 1: Direct close
    patterns.push({
      pattern_type: 'direct_close',
      trigger_conditions: ['buying_intent > 0.8', 'objections_resolved'],
      message_template: 'Perfect! Let\'s get you started today. Shall I send the payment link?',
      success_rate: 0.75,
      avg_time_to_close: 2
    });

    // Pattern 2: Soft close
    patterns.push({
      pattern_type: 'soft_close',
      trigger_conditions: ['buying_intent > 0.6', 'engagement_high'],
      message_template: 'Based on what we discussed, this seems like a great fit for you. Would you like to move forward?',
      success_rate: 0.60,
      avg_time_to_close: 5
    });

    // Pattern 3: Taglish close
    patterns.push({
      pattern_type: 'taglish_close',
      trigger_conditions: ['language = taglish', 'buying_intent > 0.7'],
      message_template: 'Perfect! Ready na po ba kayo to start? I can process this now para makapag-start na kayo agad.',
      success_rate: 0.80,
      avg_time_to_close: 3
    });

    return patterns;
  }

  /**
   * Identify objection patterns
   */
  private static identifyObjectionPatterns(sessions: any[]): ObjectionPattern[] {
    return [
      {
        objection_type: 'price_concern',
        common_phrases: ['expensive', 'too much', 'budget', 'mahal'],
        response_template: 'I understand the investment is important. Let me show you the ROI and how this pays for itself.',
        resolution_rate: 0.70
      },
      {
        objection_type: 'timing',
        common_phrases: ['not now', 'maybe later', 'think about it', 'isip ko muna'],
        response_template: 'I totally understand. May I ask what specific aspects you\'d like to consider?',
        resolution_rate: 0.55
      },
      {
        objection_type: 'comparison',
        common_phrases: ['competitor', 'other options', 'comparing', 'iba pa'],
        response_template: 'Smart to compare! Here\'s what makes us different...',
        resolution_rate: 0.65
      }
    ];
  }

  /**
   * Store learning profile in database
   */
  private static async storeLearningProfile(
    user_id: string,
    closer_id: string,
    profile: any
  ) {
    const { error } = await supabase
      .from('shadow_learning_profiles')
      .insert({
        user_id,
        learned_from_user_id: closer_id,
        training_data: profile.analysis,
        style_vector: profile.style_vector,
        tone_signature: profile.tone_signature,
        closing_patterns: profile.closing_patterns,
        objection_patterns: profile.objection_patterns,
        total_samples: profile.analysis.total_sessions,
        success_rate: profile.analysis.win_rate,
        confidence_score: 0.85
      });

    if (error) {
      console.error('Failed to store learning profile:', error);
    }
  }

  /**
   * Get learned profile for AI to use
   */
  static async getLearnedProfile(user_id: string) {
    const { data, error } = await supabase
      .from('shadow_learning_profiles')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .order('confidence_score', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Apply learned style to AI message generation
   */
  static applyLearnedStyle(
    message: string,
    style_vector: StyleVector,
    tone_signature: ToneSignature
  ): string {
    let adapted = message;

    // Apply formality
    if (style_vector.formality > 0.7) {
      adapted = adapted.replace(/hey/gi, 'Hello');
      adapted = adapted.replace(/gonna/gi, 'going to');
    }

    // Apply enthusiasm
    if (style_vector.enthusiasm > 0.7) {
      if (!adapted.includes('!')) adapted += '!';
      if (Math.random() > 0.7) adapted += ' 😊';
    }

    // Apply language preference
    if (tone_signature.language_preference === 'taglish') {
      adapted = adapted.replace(/right\?/gi, 'diba?');
      adapted = adapted.replace(/okay/gi, 'okay po');
    }

    return adapted;
  }
}
