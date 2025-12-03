/**
 * Human Takeover Detection Engine
 *
 * Automatically detects when AI should hand off conversation to human:
 * - Customer requests human
 * - AI detects frustration
 * - High buying intent (close the deal!)
 * - AI hits knowledge gap
 * - Low confidence (<60%)
 * - Complex pricing/negotiation
 * - Legal or sensitive queries
 */

import { supabase } from '../../lib/supabase';

export interface HandoffTrigger {
  should_handoff: boolean;
  trigger_type: 'customer_request' | 'frustration_detected' | 'high_intent' |
                 'knowledge_gap' | 'low_confidence' | 'complex_pricing' |
                 'legal_sensitive' | 'manual_override' | 'scheduled';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  suggested_human_response?: string;
  context_summary?: string;
  key_points?: string[];
}

export interface HandoffContext {
  user_id: string;
  session_id: string;
  prospect_id?: string;
  message: string;
  ai_confidence: number;
  frustration_level: number;
  buying_intent: number;
  conversation_history?: any[];
  detected_emotions?: string[];
}

export class HandoffDetectionEngine {
  /**
   * Analyze if conversation should be handed off to human
   */
  static async detectHandoff(context: HandoffContext): Promise<HandoffTrigger> {
    const { data } = await supabase.rpc('detect_handoff_trigger', {
      p_user_id: context.user_id,
      p_session_id: context.session_id,
      p_message: context.message,
      p_ai_confidence: context.ai_confidence,
      p_frustration_level: context.frustration_level,
      p_buying_intent: context.buying_intent
    });

    if (data) {
      return data as HandoffTrigger;
    }

    // Fallback client-side detection
    return this.clientSideDetection(context);
  }

  /**
   * Client-side handoff detection (backup)
   */
  private static clientSideDetection(context: HandoffContext): HandoffTrigger {
    const msg = context.message.toLowerCase();

    // Customer explicitly requests human
    if (this.matchesPattern(msg, [
      'talk to', 'speak with', 'connect me', 'real person',
      'human', 'agent', 'representative', 'manager'
    ])) {
      return {
        should_handoff: true,
        trigger_type: 'customer_request',
        urgency: 'high',
        reason: 'Customer explicitly requested to speak with a human',
        suggested_human_response: 'Hi! I\'m here to help you personally. What can I assist you with?'
      };
    }

    // High frustration detected
    if (context.frustration_level >= 0.7) {
      return {
        should_handoff: true,
        trigger_type: 'frustration_detected',
        urgency: 'high',
        reason: `High frustration detected (${(context.frustration_level * 100).toFixed(0)}%)`,
        suggested_human_response: 'I understand this may be frustrating. Let me personally help resolve this for you.',
        key_points: ['Acknowledge frustration', 'Show empathy', 'Offer immediate help']
      };
    }

    // Very high buying intent - human should close!
    if (context.buying_intent >= 0.85) {
      return {
        should_handoff: true,
        trigger_type: 'high_intent',
        urgency: 'critical',
        reason: `Very high buying intent (${(context.buying_intent * 100).toFixed(0)}%) - human should close this deal!`,
        suggested_human_response: 'Great! I\'d love to personally help you get started. Let me walk you through the next steps.',
        key_points: ['High intent buyer', 'Ready to close', 'Don\'t lose this opportunity']
      };
    }

    // AI confidence too low
    if (context.ai_confidence < 0.60) {
      return {
        should_handoff: true,
        trigger_type: 'low_confidence',
        urgency: 'medium',
        reason: `AI confidence too low (${(context.ai_confidence * 100).toFixed(0)}%)`,
        suggested_human_response: 'Let me connect you with someone who can answer that specifically for you.',
        key_points: ['Knowledge gap', 'Needs expert answer']
      };
    }

    // Complex pricing questions
    if (this.matchesPattern(msg, [
      'discount', 'negotiate', 'payment plan', 'custom pricing',
      'enterprise', 'bulk', 'volume pricing', 'can you lower'
    ])) {
      return {
        should_handoff: true,
        trigger_type: 'complex_pricing',
        urgency: 'medium',
        reason: 'Complex pricing negotiation detected',
        suggested_human_response: 'I can definitely work with you on pricing. Let me see what we can do.',
        key_points: ['Pricing negotiation', 'May need approval', 'Build value first']
      };
    }

    // Legal or sensitive topics
    if (this.matchesPattern(msg, [
      'legal', 'contract', 'lawyer', 'sue', 'complaint',
      'refund', 'cancel', 'gdpr', 'privacy', 'data breach',
      'violation', 'terms of service'
    ])) {
      return {
        should_handoff: true,
        trigger_type: 'legal_sensitive',
        urgency: 'high',
        reason: 'Legal or sensitive topic detected - requires human handling',
        suggested_human_response: 'I understand this is important. Let me personally address this with you.',
        key_points: ['Legal/sensitive', 'Handle carefully', 'Document everything']
      };
    }

    // No handoff needed
    return {
      should_handoff: false,
      trigger_type: 'manual_override',
      urgency: 'low',
      reason: 'No handoff triggers detected - AI can continue'
    };
  }

  /**
   * Check if message matches any pattern
   */
  private static matchesPattern(message: string, patterns: string[]): boolean {
    return patterns.some(pattern => message.includes(pattern));
  }

  /**
   * Execute handoff to human
   */
  static async executeHandoff(context: HandoffContext, trigger: HandoffTrigger) {
    const { error } = await supabase.from('human_takeover_sessions').insert({
      user_id: context.user_id,
      session_id: context.session_id,
      prospect_id: context.prospect_id,
      status: 'handoff',
      handoff_reason: trigger.reason,
      trigger_type: trigger.trigger_type,
      ai_confidence_at_handoff: context.ai_confidence,
      buying_intent_at_handoff: context.buying_intent,
      frustration_level: context.frustration_level,
      urgency_level: trigger.urgency,
      ai_suggested_response: trigger.suggested_human_response,
      key_points: trigger.key_points || []
    });

    if (error) {
      console.error('Failed to execute handoff:', error);
      throw error;
    }

    return { success: true, trigger };
  }

  /**
   * Get current session status (AI/Human/Shared)
   */
  static async getSessionStatus(user_id: string, session_id: string) {
    const { data, error } = await supabase
      .from('human_takeover_sessions')
      .select('*')
      .eq('user_id', user_id)
      .eq('session_id', session_id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to get session status:', error);
      return { status: 'ai' };
    }

    return data || { status: 'ai' };
  }

  /**
   * Switch mode (AI → Human, Human → AI, or Shared)
   */
  static async switchMode(
    user_id: string,
    session_id: string,
    new_status: 'ai' | 'human' | 'shared' | 'ai_supervised'
  ) {
    const current = await this.getSessionStatus(user_id, session_id);

    if (current.id) {
      // Update existing session
      const { error } = await supabase
        .from('human_takeover_sessions')
        .update({
          status: new_status,
          previous_status: current.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', current.id);

      if (error) throw error;
    } else {
      // Create new session
      const { error } = await supabase
        .from('human_takeover_sessions')
        .insert({
          user_id,
          session_id,
          status: new_status,
          handoff_reason: 'Manual mode switch'
        });

      if (error) throw error;
    }

    return { success: true, new_status };
  }

  /**
   * End takeover session
   */
  static async endTakeover(
    session_id: string,
    outcome: 'converted' | 'qualified' | 'nurture' | 'lost' | 'ongoing',
    notes?: string
  ) {
    const { error } = await supabase
      .from('human_takeover_sessions')
      .update({
        status: 'ai',
        ended_at: new Date().toISOString(),
        outcome,
        outcome_notes: notes
      })
      .eq('session_id', session_id)
      .is('ended_at', null);

    if (error) throw error;

    return { success: true };
  }
}
