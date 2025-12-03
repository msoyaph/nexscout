import { supabase } from '../../lib/supabase';
import { calculateScoutScoreV5 } from '../scoutScoreV5';
import { AIPipelineAutomationService } from '../aiPipelineAutomation';
import { OperatingModeService } from '../operatingModeService';

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;
}

export interface ChatQualificationData {
  buyingIntentScore: number;
  leadTemperature: 'cold' | 'warm' | 'hot' | 'readyToBuy';
  conversationLength: number;
  hasContactInfo: boolean;
  detectedSignals: string[];
  intents: string[];
  sessionDuration: number;
}

export class ChatbotProspectCreationService {
  /**
   * Extract contact information from conversation history
   */
  static extractContactInfo(messages: Array<{ sender: string; message: string }>): ContactInfo {
    const contactInfo: ContactInfo = {};

    // Combine all visitor messages
    const visitorText = messages
      .filter(m => m.sender === 'visitor')
      .map(m => m.message)
      .join(' ');

    // Extract email (various patterns)
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = visitorText.match(emailPattern);
    if (emailMatch) {
      contactInfo.email = emailMatch[0];
    }

    // Extract phone (Philippine format and international)
    const phonePattern = /(\+?63|0)?[-.\s]?9\d{2}[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,15}/;
    const phoneMatch = visitorText.match(phonePattern);
    if (phoneMatch) {
      contactInfo.phone = phoneMatch[0].replace(/[-.\s]/g, '');
    }

    // Extract name (look for "I'm", "My name is", "This is", etc.)
    const namePattern = /(?:I'm|I am|My name is|This is|Call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
    const nameMatch = visitorText.match(namePattern);
    if (nameMatch) {
      contactInfo.name = nameMatch[1].trim();
    }

    // Extract company (look for "from", "work at", "company is")
    const companyPattern = /(?:from|work at|company is|represent)\s+([A-Z][A-Za-z0-9\s&,.-]+(?:Inc|LLC|Corp|Ltd|Co)?)/i;
    const companyMatch = visitorText.match(companyPattern);
    if (companyMatch) {
      contactInfo.company = companyMatch[1].trim();
    }

    return contactInfo;
  }

  /**
   * Determine if chat session qualifies for prospect creation
   */
  static isQualifiedLead(qualificationData: ChatQualificationData, contactInfo: ContactInfo): boolean {
    // Must have at least email or phone
    if (!contactInfo.email && !contactInfo.phone) {
      return false;
    }

    // At least one of these conditions:
    const conditions = [
      qualificationData.buyingIntentScore >= 50, // Moderate buying intent
      qualificationData.leadTemperature === 'hot' || qualificationData.leadTemperature === 'readyToBuy',
      qualificationData.conversationLength >= 5, // At least 5 messages
      qualificationData.detectedSignals.some(s => ['demo_request', 'pricing_inquiry', 'purchase_intent'].includes(s)),
      qualificationData.sessionDuration >= 120000, // 2+ minutes engaged
    ];

    // Need at least 2 qualifying conditions
    const qualifyingCount = conditions.filter(c => c).length;
    return qualifyingCount >= 2;
  }

  /**
   * Create prospect from chat session
   */
  static async createProspectFromChat(
    userId: string,
    sessionId: string,
    contactInfo: ContactInfo,
    qualificationData: ChatQualificationData,
    conversationSummary?: string
  ): Promise<string | null> {
    try {
      console.log('[Chatbot Prospect] Creating prospect from session:', sessionId);

      // Calculate ScoutScore based on chat data
      const scoutScore = this.calculateChatbasedScoutScore(qualificationData, contactInfo);

      // Prepare prospect data
      const prospectData = {
        user_id: userId,
        full_name: contactInfo.name || 'Chat Visitor',
        email: contactInfo.email || null,
        phone: contactInfo.phone || null,
        company: contactInfo.company || null,
        location: contactInfo.location || null,
        platform: 'web_chat',
        source: 'public_chatbot',
        bio_text: conversationSummary || null,
        scout_score: scoutScore,
        lead_temperature: qualificationData.leadTemperature,
        buying_intent_score: qualificationData.buyingIntentScore,
        pipeline_stage: this.getInitialPipelineStage(qualificationData),
        is_unlocked: true,
        unlocked_at: new Date().toISOString(),
        metadata: {
          chat_session_id: sessionId,
          conversation_length: qualificationData.conversationLength,
          session_duration: qualificationData.sessionDuration,
          detected_signals: qualificationData.detectedSignals,
          intents: qualificationData.intents,
          created_from: 'chatbot',
          created_at: new Date().toISOString(),
        },
      };

      // Insert prospect
      const { data: prospect, error: prospectError } = await supabase
        .from('prospects')
        .insert(prospectData)
        .select()
        .single();

      if (prospectError) throw prospectError;

      console.log('[Chatbot Prospect] Created prospect:', prospect.id);

      // Link chat session to prospect
      await this.linkChatToProspect(sessionId, prospect.id);

      // Create notification
      await this.notifyUserOfNewProspect(userId, prospect.id, contactInfo);

      // Trigger AI pipeline based on operating mode
      await this.triggerAIPipeline(userId, prospect.id, qualificationData);

      return prospect.id;
    } catch (error) {
      console.error('[Chatbot Prospect] Error creating prospect:', error);
      return null;
    }
  }

  /**
   * Calculate ScoutScore based on chat qualification data
   */
  private static calculateChatbasedScoutScore(
    qualificationData: ChatQualificationData,
    contactInfo: ContactInfo
  ): number {
    let score = 0;

    // Base score from buying intent (0-40 points)
    score += qualificationData.buyingIntentScore * 0.4;

    // Lead temperature bonus (0-25 points)
    const tempScores = { cold: 0, warm: 10, hot: 20, readyToBuy: 25 };
    score += tempScores[qualificationData.leadTemperature] || 0;

    // Contact completeness (0-15 points)
    if (contactInfo.email) score += 5;
    if (contactInfo.phone) score += 5;
    if (contactInfo.company) score += 3;
    if (contactInfo.name) score += 2;

    // Engagement level (0-15 points)
    if (qualificationData.conversationLength >= 10) score += 8;
    else if (qualificationData.conversationLength >= 5) score += 5;
    else if (qualificationData.conversationLength >= 3) score += 2;

    if (qualificationData.sessionDuration >= 300000) score += 7; // 5+ minutes
    else if (qualificationData.sessionDuration >= 120000) score += 4; // 2+ minutes

    // Buying signals bonus (0-5 points)
    const highValueSignals = ['demo_request', 'pricing_inquiry', 'purchase_intent'];
    const hasHighValueSignal = qualificationData.detectedSignals.some(s => highValueSignals.includes(s));
    if (hasHighValueSignal) score += 5;

    return Math.min(Math.round(score), 100);
  }

  /**
   * Determine initial pipeline stage based on qualification data
   */
  private static getInitialPipelineStage(qualificationData: ChatQualificationData): string {
    if (qualificationData.leadTemperature === 'readyToBuy') return 'ready_to_close';
    if (qualificationData.leadTemperature === 'hot') return 'interested';
    if (qualificationData.buyingIntentScore >= 70) return 'qualified';
    if (qualificationData.conversationLength >= 5) return 'contacted';
    return 'new';
  }

  /**
   * Link chat session to prospect record
   */
  private static async linkChatToProspect(sessionId: string, prospectId: string): Promise<void> {
    try {
      // Update chat session with prospect_id
      const { error: sessionError } = await supabase
        .from('public_chat_sessions')
        .update({ prospect_id: prospectId })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Create explicit link record if chat_session_prospects table exists
      const { error: linkError } = await supabase
        .from('chat_session_prospects')
        .insert({
          chat_session_id: sessionId,
          prospect_id: prospectId,
          created_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      // Ignore error if table doesn't exist
      if (linkError && !linkError.message.includes('does not exist')) {
        console.warn('[Chatbot Prospect] Link table error:', linkError);
      }
    } catch (error) {
      console.error('[Chatbot Prospect] Error linking chat to prospect:', error);
    }
  }

  /**
   * Notify user of new prospect from chat
   */
  private static async notifyUserOfNewProspect(
    userId: string,
    prospectId: string,
    contactInfo: ContactInfo
  ): Promise<void> {
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'new_prospect',
        title: 'New Lead from Website Chat',
        message: `${contactInfo.name || 'A visitor'} just qualified as a lead through your chatbot${contactInfo.email ? `: ${contactInfo.email}` : ''}`,
        data: {
          prospect_id: prospectId,
          source: 'chatbot',
          contact_info: contactInfo,
        },
        read: false,
      });
    } catch (error) {
      console.error('[Chatbot Prospect] Error creating notification:', error);
    }
  }

  /**
   * Trigger AI pipeline based on operating mode
   */
  private static async triggerAIPipeline(
    userId: string,
    prospectId: string,
    qualificationData: ChatQualificationData
  ): Promise<void> {
    try {
      // Get user's operating mode
      const modeData = await OperatingModeService.getUserMode(userId);
      if (!modeData) {
        console.warn('[Chatbot Prospect] Could not fetch operating mode');
        return;
      }

      const { mode, preferences } = modeData;

      // Manual mode: Don't trigger automation
      if (mode === 'manual') {
        console.log('[Chatbot Prospect] Manual mode - no automation triggered');
        return;
      }

      // Autopilot or Hybrid mode: Trigger automation
      console.log(`[Chatbot Prospect] ${mode} mode - triggering automation`);

      // Get AI pipeline settings
      const settings = await AIPipelineAutomationService.getSettings(userId);
      if (!settings) {
        console.warn('[Chatbot Prospect] No AI pipeline settings found');
        return;
      }

      // Queue smart scan if enabled
      if (settings.smart_scan_enabled) {
        await AIPipelineAutomationService.queueJob(userId, 'smart_scan', {
          prospect_id: prospectId,
          priority: qualificationData.leadTemperature === 'hot' ? 'high' : 'normal',
        });
      }

      // Queue follow-up if enabled and lead is warm+
      if (settings.auto_follow_up && qualificationData.leadTemperature !== 'cold') {
        await AIPipelineAutomationService.queueJob(userId, 'follow_up', {
          prospect_id: prospectId,
          delay_minutes: mode === 'autopilot' ? 5 : 30, // Autopilot faster
          message_type: 'initial_followup',
        });
      }

      // Queue qualification if enabled and buying intent is high
      if (settings.auto_qualify && qualificationData.buyingIntentScore >= 60) {
        await AIPipelineAutomationService.queueJob(userId, 'qualify', {
          prospect_id: prospectId,
        });
      }

      console.log('[Chatbot Prospect] AI pipeline jobs queued successfully');
    } catch (error) {
      console.error('[Chatbot Prospect] Error triggering AI pipeline:', error);
    }
  }

  /**
   * Check if prospect already exists for this contact
   */
  static async findExistingProspect(
    userId: string,
    contactInfo: ContactInfo
  ): Promise<string | null> {
    try {
      if (!contactInfo.email && !contactInfo.phone) return null;

      const query = supabase
        .from('prospects')
        .select('id')
        .eq('user_id', userId);

      if (contactInfo.email) {
        query.eq('email', contactInfo.email);
      } else if (contactInfo.phone) {
        query.eq('phone', contactInfo.phone);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('[Chatbot Prospect] Error finding existing prospect:', error);
      return null;
    }
  }

  /**
   * Update existing prospect with new chat data
   */
  static async updateProspectFromChat(
    prospectId: string,
    qualificationData: ChatQualificationData,
    sessionId: string
  ): Promise<void> {
    try {
      // Get current prospect data
      const { data: prospect, error: fetchError } = await supabase
        .from('prospects')
        .select('scout_score, lead_temperature, buying_intent_score, metadata')
        .eq('id', prospectId)
        .single();

      if (fetchError) throw fetchError;

      // Update if new data is better
      const updates: any = {};

      const newScore = this.calculateChatbasedScoutScore(qualificationData, {});
      if (newScore > (prospect.scout_score || 0)) {
        updates.scout_score = newScore;
      }

      if (qualificationData.buyingIntentScore > (prospect.buying_intent_score || 0)) {
        updates.buying_intent_score = qualificationData.buyingIntentScore;
      }

      const tempOrder = { cold: 0, warm: 1, hot: 2, readyToBuy: 3 };
      if (tempOrder[qualificationData.leadTemperature] > tempOrder[prospect.lead_temperature || 'cold']) {
        updates.lead_temperature = qualificationData.leadTemperature;
      }

      // Add chat session to metadata
      const metadata = prospect.metadata || {};
      const chatSessions = metadata.chat_sessions || [];
      chatSessions.push(sessionId);
      updates.metadata = { ...metadata, chat_sessions: chatSessions };

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('prospects')
          .update(updates)
          .eq('id', prospectId);

        if (updateError) throw updateError;

        console.log('[Chatbot Prospect] Updated existing prospect:', prospectId);
      }

      // Link session to prospect
      await this.linkChatToProspect(sessionId, prospectId);
    } catch (error) {
      console.error('[Chatbot Prospect] Error updating prospect:', error);
    }
  }
}
