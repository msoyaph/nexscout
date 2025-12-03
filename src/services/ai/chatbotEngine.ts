import { supabase } from '../../lib/supabase';
import { messagingEngine } from './messagingEngine';
import { pitchDeckGenerator } from './pitchDeckGenerator';
import { runChatbotProductFlow } from '../chatbot/publicChatbotProductFlowEngine';

/**
 * AI Chatbot Engine
 * Integrates with all AI engines and provides intelligent responses
 */

export interface ChatbotMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatbotConfig {
  personality: string;
  tone: string;
  response_length: string;
  language: string;
  use_company_data: boolean;
  use_prospect_data: boolean;
  auto_suggest_actions: boolean;
  max_context_messages: number;
}

export interface ChatbotResponse {
  message: string;
  actions?: Array<{
    type: string;
    label: string;
    data?: any;
  }>;
  confidence: number;
}

class ChatbotEngine {
  /**
   * Get user's chatbot configuration
   */
  async getConfig(userId: string): Promise<ChatbotConfig | null> {
    const { data, error } = await supabase
      .from('chatbot_configurations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      personality: data.personality,
      tone: data.tone,
      response_length: data.response_length,
      language: data.language,
      use_company_data: data.use_company_data,
      use_prospect_data: data.use_prospect_data,
      auto_suggest_actions: data.auto_suggest_actions,
      max_context_messages: data.max_context_messages
    };
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    userId: string,
    conversationId: string,
    limit: number = 10
  ): Promise<ChatbotMessage[]> {
    const { data, error } = await supabase
      .from('chatbot_messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.reverse().map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.created_at)
    }));
  }

  /**
   * Get or create conversation
   */
  async getOrCreateConversation(
    userId: string,
    contextType: string = 'general',
    contextId?: string
  ): Promise<string> {
    // Try to find active conversation
    const { data: existing } = await supabase
      .from('chatbot_conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('context_type', contextType)
      .maybeSingle();

    if (existing) {
      return existing.id;
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('chatbot_conversations')
      .insert({
        user_id: userId,
        context_type: contextType,
        context_id: contextId,
        title: `${contextType} conversation`
      })
      .select('id')
      .single();

    if (error || !newConv) {
      throw new Error('Failed to create conversation');
    }

    return newConv.id;
  }

  /**
   * Save message to database
   */
  async saveMessage(
    userId: string,
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: any
  ): Promise<void> {
    await supabase
      .from('chatbot_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role,
        content,
        metadata: metadata || {}
      });

    // Update conversation
    await supabase
      .from('chatbot_conversations')
      .update({
        message_count: supabase.rpc('increment', { x: 1 }),
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);
  }

  /**
   * Get custom training data for user
   */
  async getTrainingData(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('chatbot_training_data')
      .select('question, answer, category, tags')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(50);

    return data || [];
  }

  /**
   * Get company data for context
   */
  async getCompanyData(userId: string): Promise<any> {
    const { data } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return data;
  }

  /**
   * Get prospect data for context
   */
  async getProspectContext(userId: string, prospectId?: string): Promise<any> {
    if (!prospectId) {
      // Get recent prospects
      const { data } = await supabase
        .from('prospects')
        .select('full_name, bio_text, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      return data || [];
    }

    // Get specific prospect
    const { data } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .maybeSingle();

    return data;
  }

  /**
   * Generate AI response
   */
  async generateResponse(
    userId: string,
    userMessage: string,
    conversationId: string,
    config?: ChatbotConfig
  ): Promise<ChatbotResponse> {
    const startTime = Date.now();

    // Get config if not provided
    if (!config) {
      config = await this.getConfig(userId) || this.getDefaultConfig();
    }

    // Get conversation history
    const history = await this.getConversationHistory(userId, conversationId, config.max_context_messages);

    // Run product flow analysis (NEW)
    const productFlow = await runChatbotProductFlow({
      userId,
      channel: 'web',
      conversationContext: {
        messages: [...history, { role: 'user', text: userMessage }].map(m => ({
          role: m.role,
          text: m.content || m.text || ''
        }))
      }
    });

    // Build context
    const context = await this.buildContext(userId, config);

    // Check for custom training data match
    const trainingMatch = await this.findTrainingMatch(userId, userMessage);

    // Generate response
    let response: string;
    let actions: any[] = [];
    let confidence = 0.8;

    // Priority 1: Use product flow if products detected (NEW)
    if (productFlow.chosenProductId && productFlow.messageToUser) {
      response = productFlow.messageToUser;
      confidence = 0.9;

      // Add product-specific actions
      if (productFlow.suggestedActions) {
        actions = productFlow.suggestedActions.map(action => ({
          type: action,
          label: this.getActionLabel(action),
          data: { productId: productFlow.chosenProductId }
        }));
      }
    }
    // Priority 2: Use custom training data
    else if (trainingMatch) {
      response = trainingMatch.answer;
      confidence = 0.95;
    }
    // Priority 3: Use AI to generate response
    else {
      response = await this.generateAIResponse(userMessage, history, context, config);
    }

    // Suggest actions if enabled (and no product actions)
    if (config.auto_suggest_actions && actions.length === 0) {
      actions = this.suggestActions(userMessage, response);
    }

    // Save messages
    await this.saveMessage(userId, conversationId, 'user', userMessage);
    await this.saveMessage(userId, conversationId, 'assistant', response, {
      response_time_ms: Date.now() - startTime,
      confidence,
      actions
    });

    return {
      message: response,
      actions: actions.length > 0 ? actions : undefined,
      confidence
    };
  }

  /**
   * Build context from user data
   */
  private async buildContext(userId: string, config: ChatbotConfig): Promise<string> {
    let context = '';

    // Add company data
    if (config.use_company_data) {
      const companyData = await this.getCompanyData(userId);
      if (companyData) {
        context += `Company: ${companyData.company_name}\n`;
        context += `Industry: ${companyData.industry || 'N/A'}\n`;
        context += `Description: ${companyData.description || 'N/A'}\n\n`;
      }
    }

    // Add prospect context
    if (config.use_prospect_data) {
      const prospects = await this.getProspectContext(userId);
      if (prospects && prospects.length > 0) {
        context += `Recent Prospects: ${prospects.map((p: any) => p.full_name).join(', ')}\n\n`;
      }
    }

    return context;
  }

  /**
   * Find matching training data
   */
  private async findTrainingMatch(userId: string, message: string): Promise<any | null> {
    const trainingData = await this.getTrainingData(userId);
    const messageLower = message.toLowerCase();

    // Simple keyword matching
    for (const item of trainingData) {
      const questionLower = item.question.toLowerCase();
      const keywords = [...item.tags, ...questionLower.split(' ')];

      const matchCount = keywords.filter(keyword =>
        messageLower.includes(keyword.toLowerCase())
      ).length;

      if (matchCount >= 2 || questionLower === messageLower) {
        return item;
      }
    }

    return null;
  }

  /**
   * Generate AI response using patterns
   */
  private async generateAIResponse(
    userMessage: string,
    history: ChatbotMessage[],
    context: string,
    config: ChatbotConfig
  ): Promise<string> {
    const lowerMessage = userMessage.toLowerCase();

    // Sales tips
    if (lowerMessage.includes('tip') || lowerMessage.includes('advice') || lowerMessage.includes('help')) {
      return this.formatResponse(
        `Here are 3 powerful sales tips:\n\n1. **Lead with Value** - Focus on solving their problems, not just selling features.\n\n2. **Ask Better Questions** - Understand their needs deeply before pitching.\n\n3. **Follow Up Consistently** - Most sales happen after the 5th follow-up.\n\nWould you like specific strategies for any of these?`,
        config
      );
    }

    // Message writing
    if (lowerMessage.includes('message') || lowerMessage.includes('write') || lowerMessage.includes('script')) {
      return this.formatResponse(
        `I can help you craft a compelling message! Here's a proven template:\n\nHi [Name],\n\nI noticed [specific detail about them]. Many [their role] struggle with [pain point].\n\nWe help [solution in one line]. Would you be open to a quick chat about [specific benefit]?\n\nBest,\n[Your name]\n\nWould you like me to customize this for a specific prospect?`,
        config
      );
    }

    // Closing techniques
    if (lowerMessage.includes('close') || lowerMessage.includes('deal') || lowerMessage.includes('convert')) {
      return this.formatResponse(
        `Here's a powerful closing framework:\n\n**The Assumptive Close:**\n"Based on what we discussed, this seems like a great fit. When would you like to get started - this week or next?"\n\n**Key principles:**\n• Assume the sale\n• Give two positive options\n• Address objections confidently\n• Create urgency without pressure\n\nWhat stage is your prospect at?`,
        config
      );
    }

    // Objections
    if (lowerMessage.includes('objection') || lowerMessage.includes('no') || lowerMessage.includes('concern')) {
      return this.formatResponse(
        `Let me help you handle objections! Common ones:\n\n1. **"No time"** → "I understand. That's exactly why our solution saves [X] hours per week."\n\n2. **"Too expensive"** → "Let's look at the ROI. If this saves/earns you [X], doesn't it pay for itself?"\n\n3. **"Need to think"** → "I appreciate that. What specific concerns do you have? Let's address them now."\n\nWhich objection are you facing?`,
        config
      );
    }

    // Prospect analysis
    if (lowerMessage.includes('prospect') || lowerMessage.includes('lead') || lowerMessage.includes('analyze')) {
      return this.formatResponse(
        `I can help analyze your prospects! I have access to your prospect data and can provide:\n\n• ScoutScore analysis\n• Pain point identification\n• Best approach strategies\n• Personalized messaging\n\nWould you like me to analyze a specific prospect or show your top leads?`,
        config
      );
    }

    // Pipeline
    if (lowerMessage.includes('pipeline') || lowerMessage.includes('follow up') || lowerMessage.includes('reminder')) {
      return this.formatResponse(
        `Let me help you manage your pipeline!\n\nBest practices:\n• Follow up within 24 hours of first contact\n• Set reminders for every interaction\n• Move prospects through stages systematically\n• Track every touchpoint\n\nWould you like me to help you set up a follow-up sequence?`,
        config
      );
    }

    // Default response
    return this.formatResponse(
      `I'm here to help with:\n\n• Sales strategies and tips\n• Message and script writing\n• Prospect analysis\n• Objection handling\n• Pipeline management\n• Closing techniques\n\nWhat would you like help with today?`,
      config
    );
  }

  /**
   * Format response based on config
   */
  private formatResponse(response: string, config: ChatbotConfig): string {
    // Adjust length
    if (config.response_length === 'concise') {
      // Keep only first paragraph or shorten
      response = response.split('\n\n')[0];
    } else if (config.response_length === 'detailed') {
      // Response is already detailed
    }

    // Adjust tone
    if (config.tone === 'energetic') {
      response = response + ' 🚀';
    } else if (config.tone === 'empathetic') {
      response = `I understand where you're coming from. ${response}`;
    }

    return response;
  }

  /**
   * Suggest follow-up actions
   */
  private suggestActions(userMessage: string, response: string): any[] {
    const actions: any[] = [];
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('message') || lowerMessage.includes('write')) {
      actions.push({
        type: 'navigate',
        label: 'Open Message Generator',
        data: { page: 'messages' }
      });
    }

    if (lowerMessage.includes('prospect') || lowerMessage.includes('lead')) {
      actions.push({
        type: 'navigate',
        label: 'View Prospects',
        data: { page: 'prospects' }
      });
    }

    if (lowerMessage.includes('pitch') || lowerMessage.includes('deck')) {
      actions.push({
        type: 'navigate',
        label: 'Generate Pitch Deck',
        data: { page: 'pitch-decks' }
      });
    }

    if (lowerMessage.includes('scan') || lowerMessage.includes('analyze')) {
      actions.push({
        type: 'navigate',
        label: 'Start Scan',
        data: { page: 'scan-entry' }
      });
    }

    return actions;
  }

  /**
   * Get default config
   */
  private getDefaultConfig(): ChatbotConfig {
    return {
      personality: 'friendly',
      tone: 'helpful',
      response_length: 'medium',
      language: 'en',
      use_company_data: true,
      use_prospect_data: true,
      auto_suggest_actions: true,
      max_context_messages: 10
    };
  }

  /**
   * Get human-readable action label (NEW)
   */
  private getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'ask_more': 'Learn More',
      'offer_product': 'View Product',
      'share_link': 'Get Product Link',
      'book_call': 'Schedule Call',
      'upsell': 'See Premium Options',
      'cross_sell': 'View Related Products'
    };
    return labels[action] || action;
  }
}

export const chatbotEngine = new ChatbotEngine();
