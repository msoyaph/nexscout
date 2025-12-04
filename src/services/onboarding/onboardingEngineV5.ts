import { supabase } from '../../lib/supabase';
import { renderTemplate } from './templateRenderer';

export interface OnboardingTriggerEvent {
  userId: string;
  eventKey: string;
  payload?: Record<string, any>;
  occurredAt?: Date;
}

export interface OnboardingMessage {
  id: string;
  step_id: string;
  channel: 'email' | 'push' | 'mentor' | 'sms';
  subject?: string;
  title?: string;
  body: string;
  delay_hours: number;
  locale: string;
  action_url?: string;
  metadata: Record<string, any>;
}

export class OnboardingEngineV5 {
  async handleEvent(event: OnboardingTriggerEvent): Promise<void> {
    const occurredAt = event.occurredAt ?? new Date();

    try {
      await supabase.from('onboarding_events').insert({
        user_id: event.userId,
        event_key: event.eventKey,
        event_payload: event.payload ?? {},
        occurred_at: occurredAt.toISOString()
      });

      const { data: sequences } = await supabase
        .from('onboarding_sequences')
        .select('id, sequence_key, version')
        .eq('is_active', true);

      if (!sequences || sequences.length === 0) {
        return;
      }

      for (const seq of sequences) {
        const { data: steps } = await supabase
          .from('onboarding_steps')
          .select('id, day_number, scenario_id, trigger_key')
          .eq('sequence_id', seq.id)
          .eq('trigger_key', event.eventKey);

        if (!steps || steps.length === 0) {
          continue;
        }

        for (const step of steps) {
          const { data: messages } = await supabase
            .from('onboarding_messages')
            .select('*')
            .eq('step_id', step.id);

          if (!messages || messages.length === 0) {
            continue;
          }

          for (const msg of messages) {
            const scheduledFor = new Date(
              occurredAt.getTime() + (msg.delay_hours ?? 0) * 60 * 60 * 1000
            );

            const { data: existing } = await supabase
              .from('onboarding_reminder_jobs_v2')
              .select('id')
              .eq('user_id', event.userId)
              .eq('message_id', msg.id)
              .eq('status', 'pending')
              .maybeSingle();

            if (existing) {
              continue;
            }

            await supabase.from('onboarding_reminder_jobs_v2').insert({
              user_id: event.userId,
              message_id: msg.id,
              scheduled_for: scheduledFor.toISOString(),
              status: 'pending',
              channel: msg.channel,
              context: event.payload ?? {}
            });
          }
        }
      }
    } catch (error) {
      console.error('Error handling onboarding event:', error);
      throw error;
    }
  }

  async processPendingJobs(now = new Date()): Promise<{
    total: number;
    success: number;
    failed: number;
    skipped: number;
  }> {
    const { data: jobs } = await supabase.rpc(
      'get_pending_onboarding_jobs_v2',
      { p_limit: 100 }
    );

    if (!jobs || jobs.length === 0) {
      return { total: 0, success: 0, failed: 0, skipped: 0 };
    }

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const job of jobs) {
      try {
        const canSend = await this.checkAntiSpam(job.user_id, job.channel);
        if (!canSend) {
          await supabase.rpc('mark_job_processed_v2', {
            p_job_id: job.id,
            p_status: 'skipped',
            p_error_message: 'Anti-spam throttle'
          });
          skipped++;
          continue;
        }

        const { data: message } = await supabase
          .from('onboarding_messages')
          .select('*')
          .eq('id', job.message_id)
          .single();

        if (!message) {
          await supabase.rpc('mark_job_processed_v2', {
            p_job_id: job.id,
            p_status: 'failed',
            p_error_message: 'Message not found'
          });
          failed++;
          continue;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name, first_name, locale')
          .eq('id', job.user_id)
          .single();

        const rendered = renderTemplate(message.channel, {
          subject: message.subject,
          title: message.title,
          body: message.body,
          user: profile,
          context: job.context
        });

        if (message.channel === 'email') {
          await this.sendEmail(
            profile?.email,
            rendered.subject || '',
            rendered.body,
            message.action_url
          );
        } else if (message.channel === 'push') {
          await this.sendPush(
            job.user_id,
            rendered.title || '',
            rendered.body,
            message.action_url
          );
        } else if (message.channel === 'mentor') {
          await this.sendMentorMessage(job.user_id, rendered.body);
        }

        await supabase.rpc('mark_job_processed_v2', {
          p_job_id: job.id,
          p_status: 'sent'
        });

        await supabase.from('onboarding_reminder_logs_v2').insert({
          user_id: job.user_id,
          message_id: job.message_id,
          channel: message.channel,
          status: 'sent',
          sent_at: now.toISOString()
        });

        await supabase.rpc('log_communication_sent', {
          p_user_id: job.user_id,
          p_channel: message.channel,
          p_template_key: message.metadata?.template_key || 'unknown'
        });

        success++;
      } catch (error: any) {
        console.error('Failed to process job:', job.id, error);

        await supabase.rpc('mark_job_processed_v2', {
          p_job_id: job.id,
          p_status: 'failed',
          p_error_message: error.message
        });

        await supabase.from('onboarding_reminder_logs_v2').insert({
          user_id: job.user_id,
          message_id: job.message_id,
          channel: job.channel,
          status: 'failed',
          error_message: error.message
        });

        failed++;
      }
    }

    return {
      total: jobs.length,
      success,
      failed,
      skipped
    };
  }

  private async checkAntiSpam(
    userId: string,
    channel: 'email' | 'push' | 'mentor' | 'sms'
  ): Promise<boolean> {
    if (channel === 'mentor') {
      return true;
    }

    try {
      const { data: canSend } = await supabase.rpc('can_send_communication', {
        p_user_id: userId,
        p_channel: channel,
        p_check_time: new Date().toISOString()
      });

      return canSend === true;
    } catch (error) {
      console.error('Error checking anti-spam:', error);
      return false;
    }
  }

  private async sendEmail(
    to: string | null | undefined,
    subject: string,
    body: string,
    actionUrl?: string | null
  ): Promise<void> {
    if (!to) {
      throw new Error('No email address provided');
    }

    console.log('Sending email:', { to, subject, actionUrl });
  }

  private async sendPush(
    userId: string,
    title: string,
    body: string,
    actionUrl?: string | null
  ): Promise<void> {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'onboarding_sequence',
      title,
      body,
      action_url: actionUrl || '/onboarding',
      priority: 'normal',
      read: false
    });

    console.log('Sent push notification:', { userId, title });
  }

  private async sendMentorMessage(
    userId: string,
    message: string
  ): Promise<void> {
    await supabase.from('mentor_conversations').insert({
      user_id: userId,
      role: 'assistant',
      message,
      message_type: 'onboarding_sequence',
      metadata: {
        source: 'onboarding_engine_v5',
        timestamp: new Date().toISOString()
      }
    });

    console.log('Sent mentor message:', { userId });
  }

  async assignUserToSequence(
    userId: string,
    sequenceKey: string
  ): Promise<void> {
    const { data: sequence } = await supabase
      .from('onboarding_sequences')
      .select('id')
      .eq('sequence_key', sequenceKey)
      .eq('is_active', true)
      .single();

    if (!sequence) {
      throw new Error(`Sequence not found: ${sequenceKey}`);
    }

    const { data: existing } = await supabase
      .from('user_sequence_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('sequence_id', sequence.id)
      .maybeSingle();

    if (existing) {
      return;
    }

    await supabase.from('user_sequence_assignments').insert({
      user_id: userId,
      sequence_id: sequence.id,
      is_active: true
    });
  }

  async getUserActiveSequences(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('user_sequence_assignments')
      .select(`
        *,
        sequence:onboarding_sequences(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    return data || [];
  }
}

export const onboardingEngineV5 = new OnboardingEngineV5();
