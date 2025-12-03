import { supabase } from '../../lib/supabase';
import { PublicChatbotEngine } from './publicChatbotEngine';

interface FacebookWebhookEvent {
  object: 'page';
  entry: Array<{
    id: string;
    time: number;
    messaging: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text: string;
        attachments?: any[];
      };
    }>;
  }>;
}

export class FacebookMessengerIntegration {
  private pageId: string;
  private userId: string;
  private chatbotSettings: any;

  constructor(userId: string, settings: any) {
    this.userId = userId;
    this.chatbotSettings = settings;
    this.pageId = settings.integrations?.facebook?.page_id || '';
  }

  /**
   * Process incoming webhook from Facebook Messenger
   */
  async processWebhook(event: FacebookWebhookEvent) {
    if (event.object !== 'page') {
      return { success: false, error: 'Invalid webhook object' };
    }

    const results = [];

    for (const entry of event.entry) {
      for (const messagingEvent of entry.messaging) {
        if (messagingEvent.message && messagingEvent.message.text) {
          const result = await this.handleMessage(messagingEvent);
          results.push(result);
        }
      }
    }

    return { success: true, results };
  }

  /**
   * Handle individual message from Facebook
   */
  private async handleMessage(event: any) {
    const senderId = event.sender.id;
    const messageText = event.message.text;

    try {
      // Get or create session for this Facebook user
      const session = await this.getOrCreateSession(senderId);

      // Save incoming message
      await supabase.from('public_chat_messages').insert({
        session_id: session.id,
        sender: 'visitor',
        message: messageText,
        external_id: event.message.mid,
        channel: 'messenger'
      });

      // Process with AI engine
      const engine = new PublicChatbotEngine(session.id, this.userId, this.chatbotSettings);
      const aiResponse = await engine.processMessage(messageText);

      // Save AI response
      await supabase.from('public_chat_messages').insert({
        session_id: session.id,
        sender: 'ai',
        message: aiResponse.response,
        ai_intent: aiResponse.intent,
        ai_buying_signals: aiResponse.buyingSignals,
        ai_emotion: aiResponse.emotion,
        channel: 'messenger'
      });

      // Send response back to Facebook
      await this.sendFacebookMessage(senderId, aiResponse.response);

      return {
        success: true,
        sessionId: session.id,
        response: aiResponse.response
      };
    } catch (error: any) {
      console.error('Facebook message handling error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get existing session or create new one for Facebook user
   */
  private async getOrCreateSession(facebookUserId: string) {
    // Check for existing session
    const { data: existing } = await supabase
      .from('public_chat_sessions')
      .select('*')
      .eq('user_id', this.userId)
      .eq('visitor_id', facebookUserId)
      .eq('channel', 'messenger')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    // Create new session
    const { data: newSession, error } = await supabase
      .from('public_chat_sessions')
      .insert({
        user_id: this.userId,
        visitor_id: facebookUserId,
        session_slug: `fb_${facebookUserId}_${Date.now()}`,
        channel: 'messenger',
        status: 'active',
        buying_intent_score: 0,
        qualification_score: 0,
        message_count: 0
      })
      .select()
      .single();

    if (error) throw error;
    return newSession;
  }

  /**
   * Send message to Facebook Messenger
   */
  private async sendFacebookMessage(recipientId: string, message: string) {
    const pageAccessToken = this.chatbotSettings.integrations?.facebook?.page_access_token;

    if (!pageAccessToken) {
      console.error('Facebook page access token not configured');
      return;
    }

    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: 'RESPONSE'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Facebook API error:', error);
      throw new Error(`Failed to send Facebook message: ${error.error?.message}`);
    }

    return await response.json();
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(signature: string, body: string, appSecret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(body)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }
}

/**
 * Setup Facebook Messenger integration
 */
export async function setupFacebookIntegration(userId: string, config: {
  pageId: string;
  pageAccessToken: string;
  appSecret: string;
  verifyToken: string;
}) {
  // Save to chatbot settings
  await supabase
    .from('chatbot_settings')
    .update({
      integrations: {
        facebook: {
          page_id: config.pageId,
          page_access_token: config.pageAccessToken,
          app_secret: config.appSecret,
          verify_token: config.verifyToken,
          enabled: true,
          connected_at: new Date().toISOString()
        }
      }
    })
    .eq('user_id', userId);

  return { success: true };
}

/**
 * Get Facebook integration status
 */
export async function getFacebookIntegrationStatus(userId: string) {
  const { data: settings } = await supabase
    .from('chatbot_settings')
    .select('integrations')
    .eq('user_id', userId)
    .single();

  const fbConfig = settings?.integrations?.facebook;

  return {
    connected: !!fbConfig?.enabled,
    pageId: fbConfig?.page_id,
    connectedAt: fbConfig?.connected_at
  };
}
