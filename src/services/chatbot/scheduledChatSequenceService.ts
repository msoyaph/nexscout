/**
 * Scheduled Chat Sequence Service
 * 
 * Handles saving and scheduling message sequences for public chat sessions
 * Supports both web chat and Facebook Messenger channels
 */

import { supabase } from '../../lib/supabase';
import { PublicChatbotEngine } from './publicChatbotEngine';
import { FacebookMessengerIntegration } from './facebookMessengerIntegration';

export interface ScheduledMessage {
  id: string;
  session_id: string;
  user_id: string;
  channel: 'web' | 'messenger';
  message_text: string;
  subject?: string;
  scheduled_for: string; // ISO timestamp
  day_number: number; // Day in sequence (1, 2, 3, etc.)
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

export interface ChatSequence {
  id: string;
  session_id: string;
  user_id: string;
  sequence_name: string;
  sequence_type: 'nurture' | 'push' | 'aggressive';
  total_steps: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  messages: ScheduledMessage[];
}

export class ScheduledChatSequenceService {
  /**
   * Save and schedule a message sequence for a chat session
   */
  static async saveAndScheduleSequence(
    sessionId: string,
    userId: string,
    sequenceData: {
      approachName: string;
      approachDescription: string;
      messages: Array<{
        day: number;
        subject: string;
        message: string;
      }>;
      sequenceType: string;
      totalSteps: number;
    }
  ): Promise<{ success: boolean; sequenceId?: string; error?: string }> {
    try {
      console.log('[ScheduledSequence] Saving sequence for session:', sessionId);

      // Get session info to determine channel
      const { data: session, error: sessionError } = await supabase
        .from('public_chat_sessions')
        .select('id, channel, user_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found');
      }

      const channel = (session.channel as 'web' | 'messenger') || 'web';

      // Create scheduled messages directly in public_chat_messages with metadata
      const scheduledMessages = sequenceData.messages.map((msg) => {
        // Calculate scheduled time: Day 1 = now + 1 day, Day 2 = now + 2 days, etc.
        const scheduledFor = new Date();
        scheduledFor.setDate(scheduledFor.getDate() + msg.day);
        scheduledFor.setHours(9, 0, 0, 0); // 9 AM each day

        return {
          session_id: sessionId,
          sender: 'ai',
          message: msg.message,
          channel: channel,
          status: 'scheduled',
          metadata: {
            scheduled_for: scheduledFor.toISOString(),
            day_number: msg.day,
            subject: msg.subject,
            is_scheduled: true,
            user_id: userId,
            sequence_name: sequenceData.approachName,
            sequence_type: sequenceData.sequenceType
          },
          created_at: new Date().toISOString()
        };
      });

      const { error } = await supabase
        .from('public_chat_messages')
        .insert(scheduledMessages);

      if (error) {
        throw error;
      }

      console.log('[ScheduledSequence] ✅ Created', scheduledMessages.length, 'scheduled messages');

      return {
        success: true
      };
    } catch (error: any) {
      console.error('[ScheduledSequence] Error saving sequence:', error);
      return {
        success: false,
        error: error.message || 'Failed to save sequence'
      };
    }
  }
}
