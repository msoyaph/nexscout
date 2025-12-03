import { supabase } from '../../lib/supabase';
import { generateAvatarSeed } from '../../utils/avatarUtils';

export interface ConversationInput {
  userId: string;
  visitorId?: string;
  sessionId?: string;
  channel: 'web' | 'messenger' | 'whatsapp' | 'viber';
  message: string;
  attachments?: Array<{ url: string; type: string }>;
}

export interface AIResponse {
  reply: string;
  suggestedProducts?: string[];
  sendImage?: string;
  action: 'none' | 'collect_lead' | 'follow_up' | 'recommend' | 'close';
  confidence: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  intent?: string;
  leadScoreUpdate?: number;
}

export interface ConversationOutput {
  success: boolean;
  response: AIResponse;
  sessionId: string;
  prospectId?: string;
  error?: string;
}

class ConversationalAIEngine {
  /**
   * Process incoming message and generate AI response
   */
  async processMessage(input: ConversationInput): Promise<ConversationOutput> {
    try {
      // Get or create session
      const session = await this.getOrCreateSession(input);

      // Save incoming message
      await this.saveMessage({
        sessionId: session.id,
        userId: input.userId,
        prospectId: session.prospect_id,
        channel: input.channel,
        message: input.message,
        role: 'user',
        attachments: input.attachments || [],
      });

      // Load agent context
      const context = await this.loadAgentContext(input.userId);

      // Generate AI response
      const aiResponse = await this.generateResponse(input.message, context, session);

      // Save AI response
      await this.saveMessage({
        sessionId: session.id,
        userId: input.userId,
        prospectId: session.prospect_id,
        channel: input.channel,
        message: aiResponse.reply,
        role: 'bot',
        metadata: aiResponse,
      });

      // Update or create prospect
      const prospectId = await this.updateProspect(session, input.message, aiResponse);

      // Trigger deep scan if warranted
      if (aiResponse.action === 'collect_lead' && prospectId) {
        await this.triggerDeepScan(prospectId, input.userId);
      }

      return {
        success: true,
        response: aiResponse,
        sessionId: session.id,
        prospectId,
      };

    } catch (error: any) {
      console.error('AI Engine error:', error);
      return {
        success: false,
        response: {
          reply: "I apologize, I'm having trouble processing your message. Please try again.",
          action: 'none',
          confidence: 0,
          sentiment: 'neutral',
        },
        sessionId: input.sessionId || '',
        error: error.message,
      };
    }
  }

  /**
   * Get existing session or create new one
   */
  private async getOrCreateSession(input: ConversationInput): Promise<any> {
    if (input.sessionId) {
      const { data: existing } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('id', input.sessionId)
        .single();

      if (existing) {
        // Update last activity
        await supabase
          .from('ai_chat_sessions')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('id', existing.id);

        return existing;
      }
    }

    // Create new session with avatar seed
    const avatarSeed = generateAvatarSeed();
    const { data: newSession, error } = await supabase
      .from('ai_chat_sessions')
      .insert({
        user_id: input.userId,
        channel: input.channel,
        visitor_id: input.visitorId || `visitor_${Date.now()}`,
        visitor_avatar_seed: avatarSeed,
        status: 'active',
      })
      .select()
      .single();

    if (error || !newSession) {
      throw new Error('Failed to create chat session');
    }

    return newSession;
  }

  /**
   * Save message to database
   */
  private async saveMessage(data: {
    sessionId: string;
    userId: string;
    prospectId?: string;
    channel: string;
    message: string;
    role: string;
    attachments?: any[];
    metadata?: any;
  }): Promise<void> {
    const messageData: any = {
      session_id: data.sessionId,
      user_id: data.userId,
      prospect_id: data.prospectId,
      channel: data.channel,
      message: data.message,
      role: data.role,
      attachments: data.attachments || [],
    };

    if (data.metadata) {
      messageData.ai_response_metadata = data.metadata;
      messageData.sentiment = data.metadata.sentiment;
      messageData.intent = data.metadata.intent;
      messageData.confidence = data.metadata.confidence;
    }

    await supabase.from('ai_conversations').insert(messageData);
  }

  /**
   * Load agent context (profile, company, scripts)
   */
  private async loadAgentContext(userId: string): Promise<any> {
    // Load user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Load company intelligence
    const { data: company } = await supabase
      .from('company_intelligence_v2')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Load AI scripts
    const { data: scripts } = await supabase
      .from('ai_scripts_user_defined')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    // Load agent settings
    const { data: settings } = await supabase
      .from('ai_agent_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    return {
      profile,
      company,
      scripts,
      settings,
    };
  }

  /**
   * Generate AI response
   */
  private async generateResponse(
    message: string,
    context: any,
    session: any
  ): Promise<AIResponse> {
    // Check if using custom AI instructions via edge function
    const { data: chatbotSettings } = await supabase
      .from('chatbot_settings')
      .select('use_custom_instructions, custom_system_instructions, instructions_override_intelligence')
      .eq('user_id', session.user_id)
      .maybeSingle();

    const useCustomInstructions = chatbotSettings?.use_custom_instructions || false;
    const hasCustomInstructions = !!(chatbotSettings?.custom_system_instructions || '').trim();

    // If custom instructions are enabled and exist, use the edge function
    if (useCustomInstructions && hasCustomInstructions) {
      try {
        console.log('[ConversationalAI] Using custom instructions via edge function');

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-chatbot-chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              sessionId: session.id,
              message: message,
              userId: session.user_id,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Edge function error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.response) {
          console.log('[ConversationalAI] Got AI response from custom instructions');
          return {
            reply: data.response,
            action: 'none',
            confidence: 0.90,
            sentiment: 'positive',
            intent: 'custom_ai_response',
          };
        }
      } catch (error) {
        console.error('[ConversationalAI] Error calling edge function:', error);
        // Fall through to rule-based fallback
      }
    }

    // FALLBACK: Rule-based responses
    const lowerMessage = message.toLowerCase();

    // Greeting detection
    if (this.isGreeting(lowerMessage)) {
      return {
        reply: context.settings?.auto_greeting ||
               `Hi! I'm ${context.settings?.agent_name || 'your AI assistant'}. How can I help you today?`,
        action: 'none',
        confidence: 0.95,
        sentiment: 'positive',
        intent: 'greeting',
      };
    }

    // Product inquiry
    if (this.isProductInquiry(lowerMessage)) {
      const products = this.extractProductInfo(context.company);
      return {
        reply: `Great question! ${products}. Would you like to know more about any specific product?`,
        action: 'recommend',
        confidence: 0.88,
        sentiment: 'positive',
        intent: 'product_inquiry',
        suggestedProducts: ['Product A', 'Product B'],
      };
    }

    // Business opportunity inquiry
    if (this.isBusinessInquiry(lowerMessage)) {
      return {
        reply: `I'd love to tell you about our business opportunity! It's perfect for someone looking to build additional income. Can I get your name and best contact info?`,
        action: 'collect_lead',
        confidence: 0.92,
        sentiment: 'positive',
        intent: 'business_opportunity',
        leadScoreUpdate: 15,
      };
    }

    // Pricing question
    if (this.isPricingQuestion(lowerMessage)) {
      return {
        reply: `Our products are competitively priced and we offer great value packages! The starter package begins at an affordable rate. Would you like me to share our full pricing details?`,
        action: 'recommend',
        confidence: 0.85,
        sentiment: 'neutral',
        intent: 'pricing',
      };
    }

    // Contact collection
    if (this.hasContactInfo(message)) {
      return {
        reply: `Thank you! I've saved your information. I'll follow up with you shortly with more details. Is there anything specific you'd like to know right now?`,
        action: 'collect_lead',
        confidence: 0.90,
        sentiment: 'positive',
        intent: 'contact_provided',
        leadScoreUpdate: 20,
      };
    }

    // Objection handling
    const objection = this.detectObjection(lowerMessage);
    if (objection) {
      const handler = this.getObjectionHandler(objection, context.scripts);
      return {
        reply: handler,
        action: 'follow_up',
        confidence: 0.80,
        sentiment: 'neutral',
        intent: 'objection',
      };
    }

    // Default response
    return {
      reply: `That's a great point! ${this.generateContextualResponse(message, context)}. What else would you like to know?`,
      action: 'follow_up',
      confidence: 0.70,
      sentiment: 'neutral',
      intent: 'general_inquiry',
    };
  }

  private isGreeting(message: string): boolean {
    return /^(hi|hello|hey|good\s+(morning|afternoon|evening)|greetings)/i.test(message);
  }

  private isProductInquiry(message: string): boolean {
    return message.includes('product') || message.includes('what do you sell') ||
           message.includes('what do you offer') || message.includes('item');
  }

  private isBusinessInquiry(message: string): boolean {
    return message.includes('business') || message.includes('opportunity') ||
           message.includes('join') || message.includes('how to start') ||
           message.includes('become a member') || message.includes('distributor');
  }

  private isPricingQuestion(message: string): boolean {
    return message.includes('price') || message.includes('cost') ||
           message.includes('how much') || message.includes('payment');
  }

  private hasContactInfo(message: string): boolean {
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const phoneRegex = /[\d\s\-\(\)]{10,}/;
    return emailRegex.test(message) || phoneRegex.test(message);
  }

  private detectObjection(message: string): string | null {
    if (message.includes('expensive') || message.includes('too much')) return 'price';
    if (message.includes('not sure') || message.includes('think about')) return 'hesitation';
    if (message.includes('no time')) return 'time';
    if (message.includes('not interested')) return 'rejection';
    return null;
  }

  private getObjectionHandler(objection: string, scripts: any): string {
    const handlers: Record<string, string> = {
      price: "I understand budget is important! Many of our successful members started exactly where you are. The investment pays for itself quickly. Would you like to see how others have done it?",
      hesitation: "That's totally normal! It's a big decision. What specific concerns do you have? I'm here to answer any questions.",
      time: "I hear you! That's actually why this works so well - you can do this in your spare time, even just a few hours a week. Want to see how flexible it really is?",
      rejection: "No problem at all! Would you at least like to stay connected for future updates? We're always launching new products and offers.",
    };

    return handlers[objection] || scripts?.objection_handlers?.[objection] ||
           "I appreciate your honesty. What would make this a better fit for you?";
  }

  private extractProductInfo(company: any): string {
    if (company?.enriched_json?.products) {
      return `We offer ${company.enriched_json.products.slice(0, 3).join(', ')} and more`;
    }
    return "We have an amazing range of products that have helped thousands of people";
  }

  private generateContextualResponse(message: string, context: any): string {
    const companyName = context.company?.company_name || 'our company';
    return `At ${companyName}, we pride ourselves on helping people like you. Let me connect you with more information`;
  }

  /**
   * Update or create AI prospect
   */
  private async updateProspect(session: any, message: string, aiResponse: AIResponse): Promise<string | undefined> {
    // Extract potential contact info
    const email = this.extractEmail(message);
    const phone = this.extractPhone(message);
    const name = this.extractName(message);

    let prospectId = session.prospect_id;

    if (email || phone || name) {
      // Create or update AI prospect
      const { data: aiProspect, error } = await supabase
        .from('ai_prospects')
        .upsert({
          user_id: session.user_id,
          session_id: session.id,
          name: name || 'Chat Visitor',
          email: email,
          phone: phone,
          sentiment_avg: aiResponse.sentiment,
          buying_temperature: this.calculateBuyingTemp(aiResponse),
          lead_score: aiResponse.leadScoreUpdate || 0,
          conversation_count: 1,
          last_interaction: new Date().toISOString(),
        }, {
          onConflict: 'session_id',
        })
        .select()
        .single();

      if (!error && aiProspect) {
        // Create full prospect record
        const { data: prospect } = await supabase
          .from('prospects')
          .insert({
            user_id: session.user_id,
            name: name || 'Chat Visitor',
            email: email || '',
            phone: phone || '',
            source: `ai_chat_${session.channel}`,
            status: 'new',
            scout_score: aiResponse.leadScoreUpdate || 50,
            tags: [session.channel, 'ai_generated', aiResponse.intent || 'chat'],
            metadata: {
              ai_conversation: true,
              session_id: session.id,
              sentiment: aiResponse.sentiment,
              buying_temperature: this.calculateBuyingTemp(aiResponse),
            },
          })
          .select()
          .single();

        if (prospect) {
          prospectId = prospect.id;

          // Link AI prospect to full prospect
          await supabase
            .from('ai_prospects')
            .update({ prospect_id: prospect.id })
            .eq('id', aiProspect.id);

          // Update session
          await supabase
            .from('ai_chat_sessions')
            .update({ prospect_id: prospect.id })
            .eq('id', session.id);
        }
      }
    }

    return prospectId;
  }

  private extractEmail(text: string): string | null {
    const match = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    return match ? match[0] : null;
  }

  private extractPhone(text: string): string | null {
    const match = text.match(/[\d\s\-\(\)]{10,}/);
    return match ? match[0].replace(/\D/g, '') : null;
  }

  private extractName(text: string): string | null {
    // Simple name extraction (in production, use NLP)
    const patterns = [
      /(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  private calculateBuyingTemp(response: AIResponse): number {
    let temp = 50;

    if (response.sentiment === 'positive') temp += 20;
    if (response.sentiment === 'negative') temp -= 20;
    if (response.action === 'collect_lead') temp += 15;
    if (response.confidence > 0.8) temp += 10;

    return Math.max(0, Math.min(100, temp));
  }

  /**
   * Trigger deep scan for prospect
   */
  private async triggerDeepScan(prospectId: string, userId: string): Promise<void> {
    try {
      // In production, this would call the deep scan service
      console.log(`Triggering deep scan for prospect ${prospectId}`);

      // Update prospect to indicate scan is pending
      await supabase
        .from('prospects')
        .update({
          metadata: { deep_scan_triggered: true, scan_triggered_at: new Date().toISOString() }
        })
        .eq('id', prospectId);
    } catch (error) {
      console.error('Failed to trigger deep scan:', error);
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId: string): Promise<any[]> {
    const { data } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    return data || [];
  }

  /**
   * Initialize chat with greeting
   */
  async initializeChat(userId: string, channel: string, visitorId?: string): Promise<ConversationOutput> {
    const context = await this.loadAgentContext(userId);

    const greeting = context.settings?.auto_greeting ||
                    `Hi! Welcome to ${context.profile?.full_name || 'our chat'}. How can I help you today?`;

    const session = await this.getOrCreateSession({
      userId,
      channel: channel as any,
      visitorId,
      message: '',
    });

    await this.saveMessage({
      sessionId: session.id,
      userId,
      channel,
      message: greeting,
      role: 'bot',
    });

    return {
      success: true,
      response: {
        reply: greeting,
        action: 'none',
        confidence: 1.0,
        sentiment: 'positive',
      },
      sessionId: session.id,
    };
  }
}

export const conversationalAIEngine = new ConversationalAIEngine();
