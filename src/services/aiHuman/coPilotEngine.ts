/**
 * AI Co-Pilot Engine (Teleprompter Mode)
 *
 * Runs ONLY when human is typing:
 * - Real-time AI suggested responses
 * - Auto-draft based on conversation
 * - 3 variations: Friendly, Persuasive, Closing
 * - Human chooses one or writes custom
 * - AI corrects tone & grammar
 */

import { supabase } from '../../lib/supabase';

export interface CoPilotSuggestion {
  draft_id: string;
  friendly: string;
  persuasive: string;
  closing: string;
  recommended: 'friendly' | 'persuasive' | 'closing';
  confidence: number;
  context: {
    detected_intent?: string;
    detected_emotion?: string;
    buying_signals?: string[];
    objections?: string[];
  };
}

export interface ConversationContext {
  user_id: string;
  session_id: string;
  prospect_id?: string;
  prospect_name?: string;
  last_messages: Array<{
    sender: 'visitor' | 'ai' | 'human';
    message: string;
    timestamp: string;
  }>;
  buying_intent: number;
  emotional_state: string;
  conversation_stage: string;
  company_context?: {
    product_name?: string;
    pricing?: any;
    key_benefits?: string[];
  };
}

export class CoPilotEngine {
  /**
   * Generate AI co-pilot suggestions (3 variations)
   */
  static async generateSuggestions(context: ConversationContext): Promise<CoPilotSuggestion> {
    const lastMessage = context.last_messages[context.last_messages.length - 1];
    const visitorMessage = lastMessage?.message || '';

    // Analyze intent and emotion
    const analysis = this.analyzeMessage(visitorMessage, context);

    // Generate 3 draft variations
    const drafts = this.generateDraftVariations(visitorMessage, context, analysis);

    // Store in database
    const { data, error } = await supabase
      .from('ai_drafted_messages')
      .insert({
        user_id: context.user_id,
        session_id: context.session_id,
        prospect_id: context.prospect_id,
        draft_friendly: drafts.friendly,
        draft_persuasive: drafts.persuasive,
        draft_closing: drafts.closing,
        confidence: drafts.confidence,
        recommended_tone: drafts.recommended,
        detected_intent: analysis.intent,
        detected_emotion: analysis.emotion,
        buying_signals: analysis.buying_signals,
        objections_detected: analysis.objections,
        conversation_context: {
          stage: context.conversation_stage,
          buying_intent: context.buying_intent,
          emotional_state: context.emotional_state
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to store co-pilot suggestions:', error);
    }

    return {
      draft_id: data?.id || '',
      ...drafts,
      context: analysis
    };
  }

  /**
   * Analyze visitor message
   */
  private static analyzeMessage(message: string, context: ConversationContext) {
    const msg = message.toLowerCase();

    // Detect intent
    let intent = 'inquiry';
    if (msg.includes('price') || msg.includes('cost') || msg.includes('magkano')) {
      intent = 'pricing_question';
    } else if (msg.includes('yes') || msg.includes('interested') || msg.includes('go ahead')) {
      intent = 'positive_signal';
    } else if (msg.includes('but') || msg.includes('however') || msg.includes('concern')) {
      intent = 'objection';
    } else if (msg.includes('think about') || msg.includes('later') || msg.includes('maybe')) {
      intent = 'stalling';
    }

    // Detect emotion
    let emotion = 'neutral';
    if (msg.includes('excited') || msg.includes('great') || msg.includes('perfect')) {
      emotion = 'excited';
    } else if (msg.includes('confused') || msg.includes('understand') || msg.includes('not sure')) {
      emotion = 'confused';
    } else if (msg.includes('frustrated') || msg.includes('disappointed')) {
      emotion = 'frustrated';
    }

    // Detect buying signals
    const buying_signals: string[] = [];
    if (msg.includes('start') || msg.includes('begin') || msg.includes('sign up')) {
      buying_signals.push('ready_to_start');
    }
    if (msg.includes('payment') || msg.includes('pay') || msg.includes('credit card')) {
      buying_signals.push('payment_discussion');
    }
    if (msg.includes('when can') || msg.includes('timeline') || msg.includes('how soon')) {
      buying_signals.push('timeline_question');
    }

    // Detect objections
    const objections: string[] = [];
    if (msg.includes('expensive') || msg.includes('too much') || msg.includes('budget')) {
      objections.push('price_concern');
    }
    if (msg.includes('not sure') || msg.includes('hesitant') || msg.includes('doubt')) {
      objections.push('uncertainty');
    }
    if (msg.includes('competitor') || msg.includes('other option') || msg.includes('comparing')) {
      objections.push('comparison_shopping');
    }

    return {
      intent,
      emotion,
      buying_signals,
      objections
    };
  }

  /**
   * Generate 3 draft variations
   */
  private static generateDraftVariations(
    visitorMessage: string,
    context: ConversationContext,
    analysis: any
  ) {
    const prospectName = context.prospect_name || 'there';

    let friendly: string;
    let persuasive: string;
    let closing: string;
    let recommended: 'friendly' | 'persuasive' | 'closing' = 'friendly';
    let confidence = 0.75;

    // Generate based on intent
    if (analysis.intent === 'pricing_question') {
      friendly = `Hi ${prospectName}! Great question about pricing. Let me share the details with you. 😊`;
      persuasive = `${prospectName}, here's the great news about our pricing - it's designed to give you maximum value. Let me explain how it works for you.`;
      closing = `Perfect timing ${prospectName}! Our pricing is very competitive, and I can get you started today with a special offer. Shall we move forward?`;
      recommended = 'persuasive';
      confidence = 0.85;
    } else if (analysis.intent === 'positive_signal') {
      friendly = `That's wonderful ${prospectName}! I'm excited to help you get started. 🎉`;
      persuasive = `Excellent decision ${prospectName}! You're going to love the results. Let me walk you through the next steps.`;
      closing = `Perfect! Let's get you started right now ${prospectName}. I'll send over the payment link and we can have you up and running today. Sound good?`;
      recommended = 'closing';
      confidence = 0.90;
    } else if (analysis.intent === 'objection') {
      friendly = `I completely understand ${prospectName}. Let me address that concern for you.`;
      persuasive = `${prospectName}, I hear you - and that's actually one of the reasons our clients love us. Here's why...`;
      closing = `${prospectName}, I appreciate you bringing that up. Many of our best clients had the same concern initially. Let me show you how we solve that, and then we can move forward. Deal?`;
      recommended = 'persuasive';
      confidence = 0.80;
    } else if (analysis.intent === 'stalling') {
      friendly = `No rush ${prospectName}! Take your time to think it over. I'm here if you have any questions.`;
      persuasive = `${prospectName}, I understand wanting to think it through. May I ask what specific aspects you'd like to consider? I can help clarify anything.`;
      closing = `${prospectName}, I totally get it - this is an important decision. How about this: let's schedule a quick 15-minute call to address any final questions, and then you can decide. Does tomorrow work?`;
      recommended = 'persuasive';
      confidence = 0.70;
    } else {
      // General inquiry
      friendly = `Hi ${prospectName}! Thanks for your message. I'd be happy to help with that. 😊`;
      persuasive = `Great question ${prospectName}! Here's what you need to know...`;
      closing = `${prospectName}, I can definitely help with that. And while we're chatting, would you like me to show you how this can work for your specific needs?`;
      recommended = 'friendly';
      confidence = 0.75;
    }

    // Adjust based on buying intent
    if (context.buying_intent >= 0.80) {
      recommended = 'closing';
      confidence = Math.min(confidence + 0.10, 1.0);
    } else if (context.buying_intent >= 0.60) {
      recommended = 'persuasive';
    }

    return {
      friendly,
      persuasive,
      closing,
      recommended,
      confidence
    };
  }

  /**
   * Track which draft was selected
   */
  static async trackDraftSelection(
    draft_id: string,
    selected_draft: 'friendly' | 'persuasive' | 'closing' | 'custom',
    was_edited: boolean,
    final_message: string
  ) {
    const { error } = await supabase
      .from('ai_drafted_messages')
      .update({
        selected_draft,
        was_edited,
        final_message_sent: final_message,
        used_at: new Date().toISOString()
      })
      .eq('id', draft_id);

    if (error) {
      console.error('Failed to track draft selection:', error);
    }
  }

  /**
   * Track response effectiveness
   */
  static async trackResponseEffectiveness(
    draft_id: string,
    response_received: boolean,
    response_sentiment: number
  ) {
    // Calculate effectiveness: response_received (50%) + positive_sentiment (50%)
    const effectiveness = (
      (response_received ? 0.5 : 0) +
      (response_sentiment * 0.5)
    );

    const { error } = await supabase
      .from('ai_drafted_messages')
      .update({
        response_received,
        response_sentiment,
        effectiveness_score: effectiveness
      })
      .eq('id', draft_id);

    if (error) {
      console.error('Failed to track effectiveness:', error);
    }
  }

  /**
   * Get co-pilot statistics for user
   */
  static async getCoPilotStats(user_id: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('ai_drafted_messages')
      .select('*')
      .eq('user_id', user_id)
      .gte('created_at', startDate.toISOString())
      .not('selected_draft', 'is', null);

    if (error || !data) {
      return null;
    }

    const total = data.length;
    const friendlySelected = data.filter(d => d.selected_draft === 'friendly').length;
    const persuasiveSelected = data.filter(d => d.selected_draft === 'persuasive').length;
    const closingSelected = data.filter(d => d.selected_draft === 'closing').length;
    const customSelected = data.filter(d => d.selected_draft === 'custom').length;
    const edited = data.filter(d => d.was_edited).length;
    const avgEffectiveness = data
      .filter(d => d.effectiveness_score !== null)
      .reduce((sum, d) => sum + (d.effectiveness_score || 0), 0) / total;

    return {
      total_suggestions: total,
      friendly_selected: friendlySelected,
      persuasive_selected: persuasiveSelected,
      closing_selected: closingSelected,
      custom_selected: customSelected,
      edit_rate: edited / total,
      avg_effectiveness: avgEffectiveness,
      response_rate: data.filter(d => d.response_received).length / total
    };
  }
}
