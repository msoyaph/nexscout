/**
 * AI-POWERED MESSAGE ANALYSIS SERVICE
 * 
 * Analyzes prospect messages across all channels using OpenAI
 * - Sentiment analysis (positive/neutral/negative)
 * - Intent detection (interested/questioning/objecting/etc.)
 * - Buying signal detection
 * - Objection identification
 * - Engagement level scoring
 * - ScoutScore impact calculation
 */

import { supabase } from '../../lib/supabase';
import { aiOrchestrator } from '../ai/AIOrchestrator';

export interface MessageAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  sentimentScore: number; // 0.00 to 1.00
  intent: 'interested' | 'questioning' | 'objecting' | 'scheduling' | 'buying' | 'declining' | 'neutral';
  engagementLevel: 'high' | 'medium' | 'low';
  buyingSignals: string[];
  objections: string[];
  questionsAsked: string[];
  keyPhrases: string[];
  scoutScoreImpact: number; // +/- points
  reasoning: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  prospectId: string;
  userId: string;
  direction: 'sent' | 'received';
  channelType: string;
  messageContent: string;
  status: string;
  sentAt?: Date;
  readAt?: Date;
}

export class MessageAnalysisService {
  /**
   * Analyze a message using AI
   */
  static async analyzeMessage(
    message: string,
    context?: {
      userId?: string; // Required for AIOrchestrator
      prospectName?: string;
      previousMessages?: string[];
      prospectProfile?: any;
    }
  ): Promise<MessageAnalysisResult> {
    try {
      const systemPrompt = `You are an expert sales message analyzer for a Filipino MLM/direct sales platform.

Analyze the prospect's message and provide:
1. **Sentiment**: positive, neutral, negative, or mixed
2. **Sentiment Score**: 0.00 (very negative) to 1.00 (very positive)
3. **Intent**: What is the prospect trying to do?
   - interested: Shows interest in product/opportunity
   - questioning: Asking questions to learn more
   - objecting: Raising concerns or objections
   - scheduling: Wants to set up a meeting/call
   - buying: Ready to purchase or sign up
   - declining: Not interested, saying no
   - neutral: Just responding, no clear intent
4. **Engagement Level**: high, medium, or low
5. **Buying Signals**: Phrases that indicate readiness to buy (e.g., "How much?", "When can I start?")
6. **Objections**: Concerns or hesitations (e.g., "Too expensive", "No time")
7. **Questions Asked**: List of questions in the message
8. **Key Phrases**: Important words/phrases that indicate mindset
9. **ScoutScore Impact**: How many points (+/-) should this message change their ScoutScore? (-20 to +20)
10. **Reasoning**: Brief explanation of your analysis

Consider Filipino/Taglish context:
- "Magkano?" = "How much?"
- "Pwede ba?" = "Is it possible?"
- "Sige" = "Okay/Yes"
- "Hindi pa sigurado" = "Not sure yet"
- "Interested ako" = "I'm interested"

Respond in JSON format only.`;

      const userPrompt = `Analyze this message from ${context?.prospectName || 'a prospect'}:

"${message}"

${context?.previousMessages ? `Previous conversation:\n${context.previousMessages.join('\n')}` : ''}

${context?.prospectProfile ? `Prospect info: ${JSON.stringify(context.prospectProfile)}` : ''}

Provide analysis in this exact JSON format:
{
  "sentiment": "positive|neutral|negative|mixed",
  "sentimentScore": 0.75,
  "intent": "interested|questioning|objecting|scheduling|buying|declining|neutral",
  "engagementLevel": "high|medium|low",
  "buyingSignals": ["signal1", "signal2"],
  "objections": ["objection1"],
  "questionsAsked": ["question1"],
  "keyPhrases": ["phrase1", "phrase2"],
  "scoutScoreImpact": 10,
  "reasoning": "Brief explanation"
}`;

      // Use AIOrchestrator for centralized AI calls
      if (!context?.userId) {
        console.warn('[MessageAnalysis] No userId provided, using fallback analysis');
        return this.fallbackAnalysis(message);
      }

      const result = await aiOrchestrator.generate({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        config: {
          userId: context.userId,
          action: 'ai_message',
          model: 'gpt-4-turbo',
          temperature: 0.3, // Lower for more consistent analysis
          maxTokens: 1000,
          autoSelectModel: true,
        }
      });

      if (!result.success || !result.content) {
        console.error('[MessageAnalysis] AI generation failed:', result.error);
        return this.fallbackAnalysis(message);
      }

      const analysis = JSON.parse(result.content);

      return {
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        intent: analysis.intent,
        engagementLevel: analysis.engagementLevel,
        buyingSignals: analysis.buyingSignals || [],
        objections: analysis.objections || [],
        questionsAsked: analysis.questionsAsked || [],
        keyPhrases: analysis.keyPhrases || [],
        scoutScoreImpact: analysis.scoutScoreImpact || 0,
        reasoning: analysis.reasoning || '',
      };
    } catch (error) {
      console.error('Message analysis error:', error);
      
      // Fallback to simple keyword-based analysis
      return this.fallbackAnalysis(message);
    }
  }

  /**
   * Simple keyword-based analysis fallback
   */
  private static fallbackAnalysis(message: string): MessageAnalysisResult {
    const lowerMessage = message.toLowerCase();

    // Buying signals keywords
    const buyingKeywords = ['magkano', 'how much', 'price', 'presyo', 'bili', 'buy', 'purchase', 'gusto ko', 'i want', 'interested'];
    const questionKeywords = ['paano', 'how', 'what', 'ano', 'kailan', 'when', 'saan', 'where', 'bakit', 'why'];
    const objectionKeywords = ['mahal', 'expensive', 'walang pera', 'no money', 'busy', 'abala', 'hindi sigurado', 'not sure'];
    const positiveKeywords = ['yes', 'oo', 'sige', 'okay', 'gusto', 'interested', 'salamat', 'thank you'];
    const negativeKeywords = ['no', 'hindi', 'ayaw', 'wala', 'never mind'];

    const buyingSignals = buyingKeywords.filter(kw => lowerMessage.includes(kw));
    const objections = objectionKeywords.filter(kw => lowerMessage.includes(kw));
    const questions = questionKeywords.filter(kw => lowerMessage.includes(kw));
    const positiveCount = positiveKeywords.filter(kw => lowerMessage.includes(kw)).length;
    const negativeCount = negativeKeywords.filter(kw => lowerMessage.includes(kw)).length;

    let sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' = 'neutral';
    let sentimentScore = 0.5;
    let scoutScoreImpact = 0;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      sentimentScore = 0.7 + (positiveCount * 0.1);
      scoutScoreImpact += 5;
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      sentimentScore = 0.3 - (negativeCount * 0.1);
      scoutScoreImpact -= 5;
    }

    if (buyingSignals.length > 0) {
      scoutScoreImpact += buyingSignals.length * 3;
    }

    if (objections.length > 0) {
      scoutScoreImpact -= objections.length * 2;
    }

    const intent: any = 
      buyingSignals.length > 0 ? 'buying' :
      objections.length > 0 ? 'objecting' :
      questions.length > 0 ? 'questioning' :
      positiveCount > 0 ? 'interested' :
      'neutral';

    const engagementLevel: 'high' | 'medium' | 'low' =
      message.length > 100 ? 'high' :
      message.length > 30 ? 'medium' :
      'low';

    return {
      sentiment,
      sentimentScore: Math.max(0, Math.min(1, sentimentScore)),
      intent,
      engagementLevel,
      buyingSignals,
      objections,
      questionsAsked: questions,
      keyPhrases: [...buyingSignals, ...objections],
      scoutScoreImpact: Math.max(-20, Math.min(20, scoutScoreImpact)),
      reasoning: 'Keyword-based fallback analysis',
    };
  }

  /**
   * Save message and trigger AI analysis
   */
  static async saveAndAnalyzeMessage(
    channelId: string,
    prospectId: string,
    userId: string,
    messageData: {
      direction: 'sent' | 'received';
      channelType: string;
      messageContent: string;
      status?: string;
    }
  ): Promise<{ messageId: string; analysis?: MessageAnalysisResult }> {
    try {
      // Save message to database
      const { data: message, error: insertError } = await supabase
        .from('omnichannel_messages')
        .insert({
          channel_id: channelId,
          prospect_id: prospectId,
          user_id: userId,
          direction: messageData.direction,
          channel_type: messageData.channelType,
          message_content: messageData.messageContent,
          message_preview: messageData.messageContent.substring(0, 200),
          status: messageData.status || 'sent',
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Only analyze received messages (from prospect)
      if (messageData.direction === 'received' && message) {
        // Get prospect info for context
        const { data: prospect } = await supabase
          .from('prospects')
          .select('full_name, metadata')
          .eq('id', prospectId)
          .single();

        // Get previous messages for context
        const { data: previousMessages } = await supabase
          .from('omnichannel_messages')
          .select('message_content, direction')
          .eq('prospect_id', prospectId)
          .order('created_at', { ascending: false })
          .limit(5);

        // Analyze message
        const analysis = await this.analyzeMessage(
          messageData.messageContent,
          {
            userId: userId, // Pass userId for AIOrchestrator
            prospectName: prospect?.full_name,
            previousMessages: previousMessages?.map(m => 
              `${m.direction === 'sent' ? 'You' : prospect?.full_name}: ${m.message_content}`
            ),
            prospectProfile: prospect?.metadata,
          }
        );

        // Update message with analysis
        await supabase
          .from('omnichannel_messages')
          .update({
            sentiment: analysis.sentiment,
            sentiment_score: analysis.sentimentScore,
            intent: analysis.intent,
            engagement_level: analysis.engagementLevel,
            buying_signals: analysis.buyingSignals,
            objections_detected: analysis.objections,
            questions_asked: analysis.questionsAsked,
          })
          .eq('id', message.id);

        // Trigger ScoutScore update via database function
        await supabase.rpc('analyze_message_engagement', {
          p_message_id: message.id,
          p_sentiment: analysis.sentiment,
          p_sentiment_score: analysis.sentimentScore,
          p_intent: analysis.intent,
          p_engagement_level: analysis.engagementLevel,
          p_buying_signals: analysis.buyingSignals,
          p_objections: analysis.objections,
        });

        return { messageId: message.id, analysis };
      }

      return { messageId: message.id };
    } catch (error) {
      console.error('Save and analyze message error:', error);
      throw error;
    }
  }

  /**
   * Get engagement analytics for a prospect
   */
  static async getProspectEngagementAnalytics(prospectId: string) {
    try {
      const { data, error } = await supabase
        .from('prospect_engagement_analytics')
        .select('*')
        .eq('prospect_id', prospectId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found"

      return data;
    } catch (error) {
      console.error('Get engagement analytics error:', error);
      return null;
    }
  }

  /**
   * Get all channels for a prospect
   */
  static async getProspectChannels(prospectId: string) {
    try {
      const { data, error } = await supabase
        .from('conversation_channels')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Get prospect channels error:', error);
      return [];
    }
  }

  /**
   * Get recent messages for a prospect
   */
  static async getRecentMessages(prospectId: string, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('omnichannel_messages')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Get recent messages error:', error);
      return [];
    }
  }

  /**
   * Get engagement events for timeline
   */
  static async getEngagementEvents(prospectId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('engagement_events')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Get engagement events error:', error);
      return [];
    }
  }
}

export const messageAnalysisService = new MessageAnalysisService();

