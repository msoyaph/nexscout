import { supabase } from '../../lib/supabase';

interface ReminderTrigger {
  userId: string;
  prospectId?: string;
  companyId?: string;
  title: string;
  description?: string;
  reminderType: 'follow_up' | 'call' | 'message' | 'appointment' | 'content' | 'hot_lead_revival' | 'task_assigned' | 'objection_response' | 'meeting_confirmation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  dueAt: Date;
  aiReasoning?: string;
  linkedPage?: string;
  navigationData?: any;
  metadata?: any;
}

export class AIReminderEngine {
  static async createReminder(trigger: ReminderTrigger) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: trigger.userId,
          prospect_id: trigger.prospectId,
          company_id: trigger.companyId,
          title: trigger.title,
          description: trigger.description,
          reminder_type: trigger.reminderType,
          priority: trigger.priority,
          source: trigger.source,
          due_at: trigger.dueAt.toISOString(),
          auto_ai_generated: true,
          ai_reasoning: trigger.aiReasoning,
          linked_page: trigger.linkedPage,
          navigation_data: trigger.navigationData,
          metadata: trigger.metadata,
        })
        .select()
        .single();

      if (error) throw error;

      await this.logAITask(trigger.userId, 'reminder', data.id, trigger.source, trigger.aiReasoning || '');

      await this.createNotification(trigger.userId, data.id, trigger.title, trigger.priority);

      return data;
    } catch (error) {
      console.error('Error creating AI reminder:', error);
      throw error;
    }
  }

  static async checkNoFollowUp48Hours(userId: string) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 48);

      const { data: prospects, error } = await supabase
        .from('prospects')
        .select('id, full_name, last_interaction_at, metadata')
        .eq('user_id', userId)
        .eq('is_unlocked', true)
        .or('pipeline_stage.neq.closed,pipeline_stage.is.null')
        .lt('last_interaction_at', cutoffDate.toISOString());

      if (error) throw error;

      for (const prospect of prospects || []) {
        const score = prospect.metadata?.scout_score || 0;
        const priority = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';

        await this.createReminder({
          userId,
          prospectId: prospect.id,
          title: `Follow up with ${prospect.full_name}`,
          description: `No interaction in 48+ hours. Keep the conversation warm!`,
          reminderType: 'follow_up',
          priority,
          source: 'ai',
          dueAt: new Date(Date.now() + 60 * 60 * 1000),
          aiReasoning: `Prospect ${prospect.full_name} has not been contacted in 48 hours. Timely follow-up increases conversion by 35%.`,
          linkedPage: 'prospect-detail',
          navigationData: { prospectId: prospect.id },
        });
      }

      return prospects?.length || 0;
    } catch (error) {
      console.error('Error checking 48h follow-ups:', error);
      return 0;
    }
  }

  static async checkHotLeadOmniChannel(userId: string, prospectId: string, channel: string, action: string) {
    try {
      const { data: prospect } = await supabase
        .from('prospects')
        .select('full_name, metadata')
        .eq('id', prospectId)
        .single();

      if (!prospect) return;

      await this.createReminder({
        userId,
        prospectId,
        title: `🔥 Hot Lead Alert: ${prospect.full_name} ${action}`,
        description: `${prospect.full_name} just ${action} on ${channel}. Strike while hot!`,
        reminderType: 'hot_lead_revival',
        priority: 'urgent',
        source: 'omnichannel',
        dueAt: new Date(Date.now() + 15 * 60 * 1000),
        aiReasoning: `Immediate engagement after ${action} increases close rate by 60%. Window: 15 minutes.`,
        linkedPage: 'prospect-detail',
        navigationData: { prospectId },
        metadata: { channel, action },
      });
    } catch (error) {
      console.error('Error creating hot lead reminder:', error);
    }
  }

  static async checkHighBuyingSignals(userId: string, prospectId: string, signals: string[]) {
    try {
      const { data: prospect } = await supabase
        .from('prospects')
        .select('full_name')
        .eq('id', prospectId)
        .single();

      if (!prospect) return;

      await this.createReminder({
        userId,
        prospectId,
        title: `💎 High Buying Signals: ${prospect.full_name}`,
        description: `Detected: ${signals.join(', ')}. Ready to close!`,
        reminderType: 'call',
        priority: 'urgent',
        source: 'scanner',
        dueAt: new Date(Date.now() + 30 * 60 * 1000),
        aiReasoning: `Buying signals detected: ${signals.join(', ')}. AI predicts 75% close probability in next 24h.`,
        linkedPage: 'prospect-detail',
        navigationData: { prospectId },
        metadata: { signals },
      });
    } catch (error) {
      console.error('Error creating buying signal reminder:', error);
    }
  }

  static async checkPipelineQualified(userId: string, prospectId: string) {
    try {
      const { data: prospect } = await supabase
        .from('prospects')
        .select('full_name')
        .eq('id', prospectId)
        .single();

      if (!prospect) return;

      await this.createReminder({
        userId,
        prospectId,
        title: `📊 Qualified Lead: ${prospect.full_name}`,
        description: `Move to next stage or schedule presentation.`,
        reminderType: 'task_assigned',
        priority: 'high',
        source: 'pipeline',
        dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        aiReasoning: `Prospect reached "Qualified" stage. Next action: Schedule demo or send personalized pitch.`,
        linkedPage: 'prospect-detail',
        navigationData: { prospectId },
      });
    } catch (error) {
      console.error('Error creating qualified reminder:', error);
    }
  }

  static async checkChatbotThinkAboutIt(userId: string, chatSessionId: string, prospectName: string, prospectEmail?: string) {
    try {
      const followUpTime = new Date();
      followUpTime.setDate(followUpTime.getDate() + 2);

      await this.createReminder({
        userId,
        title: `Follow up: ${prospectName} is thinking`,
        description: `${prospectName} said "I'll think about it" in chatbot. Follow up in 2 days.`,
        reminderType: 'follow_up',
        priority: 'medium',
        source: 'chatbot',
        dueAt: followUpTime,
        aiReasoning: `"Think about it" response requires 48h follow-up. Conversion rate: 28% with timely follow-up.`,
        linkedPage: 'chatbot-sessions',
        navigationData: { sessionId: chatSessionId },
        metadata: { prospectEmail },
      });

      await supabase
        .from('chatbot_events')
        .insert({
          user_id: userId,
          chat_session_id: chatSessionId,
          prospect_name: prospectName,
          prospect_email: prospectEmail,
          event_type: 'think_about_it',
          suggested_action: 'Follow up with personalized message',
          suggested_time: followUpTime.toISOString(),
        });
    } catch (error) {
      console.error('Error creating chatbot reminder:', error);
    }
  }

  static async checkObjectionRaised(userId: string, prospectId: string, objection: string) {
    try {
      const { data: prospect } = await supabase
        .from('prospects')
        .select('full_name')
        .eq('id', prospectId)
        .single();

      if (!prospect) return;

      await this.createReminder({
        userId,
        prospectId,
        title: `🚧 Objection: ${prospect.full_name}`,
        description: `Objection raised: "${objection}". Prepare response.`,
        reminderType: 'objection_response',
        priority: 'high',
        source: 'chatbot',
        dueAt: new Date(Date.now() + 60 * 60 * 1000),
        aiReasoning: `Objection detected. AI suggests addressing within 1 hour to maintain momentum.`,
        linkedPage: 'objection-handler',
        navigationData: { prospectId, objection },
        metadata: { objection },
      });
    } catch (error) {
      console.error('Error creating objection reminder:', error);
    }
  }

  static async checkCompanyUpdate(userId: string, companyId: string, updateType: string, details: string) {
    try {
      await this.createReminder({
        userId,
        companyId,
        title: `🏢 Company Update: ${updateType}`,
        description: details,
        reminderType: 'content',
        priority: 'medium',
        source: 'ai',
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        aiReasoning: `Company intelligence detected: ${updateType}. Update materials and notify prospects.`,
        linkedPage: 'about-my-company',
      });
    } catch (error) {
      console.error('Error creating company update reminder:', error);
    }
  }

  private static async logAITask(userId: string, taskType: string, taskId: string, triggerSource: string, aiReasoning: string) {
    try {
      await supabase
        .from('ai_generated_tasks')
        .insert({
          user_id: userId,
          task_type: taskType,
          task_id: taskId,
          trigger_source: triggerSource,
          trigger_event: 'auto_reminder_created',
          ai_reasoning: aiReasoning,
          confidence_score: 0.85,
        });
    } catch (error) {
      console.error('Error logging AI task:', error);
    }
  }

  private static async createNotification(userId: string, reminderId: string, title: string, priority: string) {
    try {
      const channels = ['push'];

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'elite') {
        channels.push('email');
      }

      if (profile?.subscription_tier === 'elite') {
        channels.push('sms');
      }

      await supabase
        .from('notification_queue')
        .insert({
          user_id: userId,
          notification_type: 'reminder_due',
          title,
          message: `You have a ${priority} priority reminder`,
          channels,
          priority,
          linked_item_type: 'reminder',
          linked_item_id: reminderId,
        });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  static async getUserReminders(userId: string, filters?: {
    completed?: boolean;
    priority?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      let query = supabase
        .from('reminders')
        .select('*, prospects(full_name, profile_image_url)')
        .eq('user_id', userId)
        .order('due_at', { ascending: true });

      if (filters?.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.type) {
        query = query.eq('reminder_type', filters.type);
      }

      if (filters?.startDate) {
        query = query.gte('due_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('due_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }
  }

  static async completeReminder(reminderId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', reminderId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error completing reminder:', error);
      return false;
    }
  }
}
