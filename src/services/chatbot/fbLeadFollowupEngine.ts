/**
 * FB Lead Follow-Up Engine
 *
 * Automatically schedules and sends follow-up messages to FB leads.
 * 7-day Taglish sequence with intelligent condition-based sending.
 */

import { supabase } from '../../lib/supabase';

interface ScheduleFollowupsInput {
  userId: string;
  prospectId: string;
  source: 'facebook_lead_ad';
}

interface ProspectStatus {
  hasAnyReply: boolean;
  hasMeetingScheduled: boolean;
  hasClosedWon: boolean;
  hasOpenedMessage: boolean;
  agentName: string;
  firstName: string;
  productName: string;
  userGoal: string;
  bookingLink: string;
}

export class FbLeadFollowupEngine {
  /**
   * Schedule follow-up sequence for new FB lead
   */
  static async scheduleForNewLead(input: ScheduleFollowupsInput): Promise<void> {
    const { userId, prospectId } = input;

    console.log('[FB Follow-Up] Scheduling sequence for prospect:', prospectId);

    try {
      // 1. Find active sequence for user
      const { data: sequence } = await supabase
        .from('fb_lead_followup_sequences')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sequence) {
        console.warn('[FB Follow-Up] No active sequence for user:', userId);
        return;
      }

      // 2. Get all steps
      const { data: steps } = await supabase
        .from('fb_lead_followup_steps')
        .select('*')
        .eq('sequence_id', sequence.id)
        .order('step_order', { ascending: true });

      if (!steps || steps.length === 0) {
        console.warn('[FB Follow-Up] No steps in sequence');
        return;
      }

      // 3. Schedule each step (create placeholder logs in pending state)
      const now = new Date();

      for (const step of steps) {
        const scheduledTime = new Date(now.getTime() + step.delay_minutes * 60 * 1000);

        // Create log entry in pending state
        await supabase.from('fb_lead_followup_logs').insert({
          prospect_id: prospectId,
          step_id: step.id,
          sequence_id: sequence.id,
          user_id: userId,
          channel: step.channel_override || 'messenger',
          delivery_status: 'pending',
          metadata: {
            scheduled_for: scheduledTime.toISOString(),
            condition_type: step.condition_type,
            template_key: step.template_key,
          },
        });
      }

      // 4. Update sequence stats
      await supabase
        .from('fb_lead_followup_sequences')
        .update({ total_started: supabase.raw('total_started + 1') })
        .eq('id', sequence.id);

      // 5. Initialize prospect status
      await supabase.from('fb_lead_prospect_status').insert({
        prospect_id: prospectId,
        user_id: userId,
        has_any_reply: false,
        has_meeting_scheduled: false,
        has_closed_won: false,
        has_opened_message: false,
      });

      console.log('[FB Follow-Up] Successfully scheduled', steps.length, 'steps');
    } catch (error: any) {
      console.error('[FB Follow-Up] Error scheduling:', error);
      throw error;
    }
  }

  /**
   * Process pending follow-up step (called by cron/worker)
   */
  static async processPendingSteps(): Promise<void> {
    console.log('[FB Follow-Up] Processing pending steps...');

    try {
      // Find all pending logs that are due
      const { data: pending } = await supabase
        .from('fb_lead_followup_logs')
        .select(`
          id,
          prospect_id,
          step_id,
          sequence_id,
          user_id,
          channel,
          metadata,
          fb_lead_followup_steps (
            template_key,
            condition_type
          )
        `)
        .eq('delivery_status', 'pending')
        .lte('metadata->>scheduled_for', new Date().toISOString())
        .limit(100);

      if (!pending || pending.length === 0) {
        console.log('[FB Follow-Up] No pending steps to process');
        return;
      }

      console.log('[FB Follow-Up] Found', pending.length, 'pending steps');

      // Process each step
      for (const log of pending) {
        await this.processStep(log);
      }
    } catch (error: any) {
      console.error('[FB Follow-Up] Error processing steps:', error);
    }
  }

  /**
   * Process individual step
   */
  private static async processStep(log: any): Promise<void> {
    const { id, prospect_id, user_id, channel, metadata, fb_lead_followup_steps } = log;
    const step = fb_lead_followup_steps;

    try {
      // 1. Check conditions
      const status = await this.getProspectStatus(prospect_id);
      const shouldSend = this.shouldSendBasedOnCondition(step.condition_type, status);

      if (!shouldSend) {
        // Skip this message
        await supabase
          .from('fb_lead_followup_logs')
          .update({
            delivery_status: 'skipped',
            metadata: {
              ...metadata,
              skip_reason: `Condition not met: ${step.condition_type}`,
            },
          })
          .eq('id', id);

        console.log('[FB Follow-Up] Skipped step due to condition:', step.condition_type);
        return;
      }

      // 2. Get template and render message
      const { data: template } = await supabase
        .from('fb_lead_message_templates')
        .select('content')
        .eq('template_key', step.template_key)
        .single();

      if (!template) {
        throw new Error(`Template not found: ${step.template_key}`);
      }

      const message = await this.renderTemplate(template.content, prospect_id, user_id, status);

      // 3. Send message
      await this.sendMessage(prospect_id, channel, message);

      // 4. Update log
      await supabase
        .from('fb_lead_followup_logs')
        .update({
          delivery_status: 'sent',
          message_content: message,
          sent_at: new Date().toISOString(),
        })
        .eq('id', id);

      console.log('[FB Follow-Up] Successfully sent step:', step.template_key);
    } catch (error: any) {
      console.error('[FB Follow-Up] Error processing step:', error);

      await supabase
        .from('fb_lead_followup_logs')
        .update({
          delivery_status: 'failed',
          metadata: {
            ...metadata,
            error_message: error.message,
          },
        })
        .eq('id', id);
    }
  }

  /**
   * Get prospect status for condition checking
   */
  private static async getProspectStatus(prospectId: string): Promise<ProspectStatus> {
    const { data: status } = await supabase
      .from('fb_lead_prospect_status')
      .select('*')
      .eq('prospect_id', prospectId)
      .maybeSingle();

    const { data: prospect } = await supabase
      .from('prospects')
      .select('name, metadata')
      .eq('id', prospectId)
      .single();

    return {
      hasAnyReply: status?.has_any_reply || false,
      hasMeetingScheduled: status?.has_meeting_scheduled || false,
      hasClosedWon: status?.has_closed_won || false,
      hasOpenedMessage: status?.has_opened_message || false,
      agentName: 'Your Agent', // TODO: Get from user profile
      firstName: prospect?.name?.split(' ')[0] || 'Friend',
      productName: 'Our Product', // TODO: Get from lead source
      userGoal: 'your goal', // TODO: Get from prospect metadata
      bookingLink: 'https://calendly.com/your-link', // TODO: Get from user settings
    };
  }

  /**
   * Check if message should be sent based on condition
   */
  private static shouldSendBasedOnCondition(
    conditionType: string,
    status: ProspectStatus
  ): boolean {
    switch (conditionType) {
      case 'always':
        return true;
      case 'no_reply':
        return !status.hasAnyReply;
      case 'no_meeting':
        return !status.hasMeetingScheduled;
      case 'no_sale':
        return !status.hasClosedWon;
      case 'no_open':
        return !status.hasOpenedMessage;
      default:
        return true;
    }
  }

  /**
   * Render template with variables
   */
  private static async renderTemplate(
    template: string,
    prospectId: string,
    userId: string,
    status: ProspectStatus
  ): Promise<string> {
    let rendered = template;

    // Replace variables
    const variables = {
      first_name: status.firstName,
      agent_name: status.agentName,
      product_name: status.productName,
      user_goal: status.userGoal,
      booking_link: status.bookingLink,
      product_core_benefits: 'Amazing benefits', // TODO: Load from product intelligence
      client_example_name: 'Maria', // TODO: Load from case studies
      client_pain_point: 'wanted to save for the future', // TODO: Load
      client_result: 'saved ₱50k in 6 months', // TODO: Load
      timeframe: '6 months', // TODO: Load
    };

    Object.entries(variables).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return rendered;
  }

  /**
   * Send message via appropriate channel
   */
  private static async sendMessage(
    prospectId: string,
    channel: string,
    message: string
  ): Promise<void> {
    // Get prospect contact info
    const { data: prospect } = await supabase
      .from('prospects')
      .select('phone, email, source_id')
      .eq('id', prospectId)
      .single();

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    // For now, log the message
    // TODO: Integrate with actual messaging services
    console.log('[FB Follow-Up] Would send via', channel, ':', message);

    if (channel === 'messenger' && prospect.source_id) {
      // TODO: Send via Facebook Messenger API
      console.log('[FB Follow-Up] Send to Facebook PSID:', prospect.source_id);
    } else if (channel === 'sms' && prospect.phone) {
      // TODO: Send via SMS API
      console.log('[FB Follow-Up] Send to phone:', prospect.phone);
    } else if (channel === 'email' && prospect.email) {
      // TODO: Send via Email API
      console.log('[FB Follow-Up] Send to email:', prospect.email);
    }
  }
}
