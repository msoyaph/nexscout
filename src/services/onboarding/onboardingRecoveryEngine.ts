import { supabase } from '../../lib/supabase';
import { notificationService } from '../notifications/notificationService';
import { onboardingRecoveryTemplates } from './onboardingRecoveryTemplates';

export interface OnboardingState {
  state: any;
  tasksCompleted: number;
  lastActivity: any;
}

export interface OnboardingRiskResult {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  risk_reasons: string[];
  missing_steps: string[];
  recommended_channel: 'in_app' | 'push' | 'email';
  recommended_template_segment: string;
}

export interface RecoveryPlan {
  userId: string;
  channel: 'in_app' | 'push' | 'email';
  templateKey: string;
  riskLevel: string;
  sendDelayMinutes: number;
  meta?: Record<string, any>;
}

export interface ExecutionReport {
  total: number;
  success: number;
  failed: number;
  skipped: number;
}

export const onboardingRecoveryEngine = {
  async getOnboardingState(userId: string): Promise<OnboardingState> {
    try {
      const { data: state } = await supabase
        .from('mentor_journey_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: tasks } = await supabase
        .from('mentor_tasks')
        .select('*')
        .eq('user_id', userId);

      const { data: completionStatus } = await supabase.rpc(
        'get_onboarding_completion_status',
        { p_user_id: userId }
      );

      return {
        state: state || {},
        tasksCompleted: tasks?.filter(t => t.status === 'completed')?.length ?? 0,
        lastActivity: completionStatus?.last_active || null
      };
    } catch (error) {
      console.error('Error getting onboarding state:', error);
      return {
        state: {},
        tasksCompleted: 0,
        lastActivity: null
      };
    }
  },

  async detectOnboardingRisk(userId: string): Promise<OnboardingRiskResult> {
    try {
      const { data: riskScore } = await supabase.rpc(
        'calculate_onboarding_risk_score',
        { p_user_id: userId }
      );

      const { data: completionStatus } = await supabase.rpc(
        'get_onboarding_completion_status',
        { p_user_id: userId }
      );

      const risk_reasons: string[] = [];
      const missing_steps: string[] = [];

      const score = riskScore || 0;

      const lastActive = completionStatus?.last_active
        ? new Date(completionStatus.last_active)
        : new Date();
      const hoursSinceLastActive =
        (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastActive > 48) {
        risk_reasons.push('User inactive >48h (critical)');
      } else if (hoursSinceLastActive > 24) {
        risk_reasons.push('User inactive >24h (likely stuck)');
      } else if (hoursSinceLastActive > 12) {
        risk_reasons.push('User inactive >12h');
      }

      if (!completionStatus?.has_company_data) {
        missing_steps.push('company_data');
        risk_reasons.push('No company data added');
      }
      if (!completionStatus?.has_products) {
        missing_steps.push('product_data');
        risk_reasons.push('No products added');
      }
      if (!completionStatus?.chatbot_active) {
        missing_steps.push('chatbot_activation');
        risk_reasons.push('Chatbot not activated');
      }
      if (!completionStatus?.has_prospects) {
        missing_steps.push('prospects_import');
        risk_reasons.push('No prospects imported');
      }
      if (!completionStatus?.has_scans) {
        missing_steps.push('first_scan');
        risk_reasons.push('No scans completed');
      }
      if (!completionStatus?.has_sent_messages) {
        missing_steps.push('first_message');
        risk_reasons.push('No messages sent');
      }

      let risk_level: OnboardingRiskResult['risk_level'] = 'low';
      if (score >= 76) risk_level = 'critical';
      else if (score >= 51) risk_level = 'high';
      else if (score >= 26) risk_level = 'medium';

      const recommended_channel =
        hoursSinceLastActive < 4
          ? 'in_app'
          : hoursSinceLastActive < 24
          ? 'push'
          : 'email';

      let recommended_template_segment = 'onboarding_default';
      if (missing_steps.includes('company_data'))
        recommended_template_segment = 'onboarding_no_company_data';
      else if (missing_steps.includes('product_data'))
        recommended_template_segment = 'onboarding_no_products';
      else if (missing_steps.includes('chatbot_activation'))
        recommended_template_segment = 'onboarding_no_chatbot';
      else if (missing_steps.includes('first_scan'))
        recommended_template_segment = 'onboarding_no_first_win';
      else if (hoursSinceLastActive > 24)
        recommended_template_segment = 'onboarding_stuck';

      await supabase.from('onboarding_risk_assessments').insert({
        user_id: userId,
        risk_level,
        risk_score: score,
        risk_reasons,
        missing_steps,
        recommended_channel,
        assessment_data: completionStatus
      });

      return {
        risk_level,
        risk_score: score,
        risk_reasons,
        missing_steps,
        recommended_channel,
        recommended_template_segment
      };
    } catch (error) {
      console.error('Error detecting onboarding risk:', error);
      return {
        risk_level: 'low',
        risk_score: 0,
        risk_reasons: [],
        missing_steps: [],
        recommended_channel: 'in_app',
        recommended_template_segment: 'onboarding_default'
      };
    }
  },

  buildRecoveryPlan(
    userId: string,
    risk: OnboardingRiskResult
  ): RecoveryPlan {
    let delay = 30;
    if (risk.risk_level === 'medium') delay = 60;
    if (risk.risk_level === 'high') delay = 120;
    if (risk.risk_level === 'critical') delay = 240;

    return {
      userId,
      channel: risk.recommended_channel,
      templateKey: risk.recommended_template_segment,
      riskLevel: risk.risk_level,
      sendDelayMinutes: delay,
      meta: {
        missing_steps: risk.missing_steps,
        risk_reasons: risk.risk_reasons
      }
    };
  },

  async scheduleRecoveryReminders(plan: RecoveryPlan): Promise<void> {
    try {
      const plannedAt = new Date();
      plannedAt.setMinutes(plannedAt.getMinutes() + plan.sendDelayMinutes);

      const { data: existing } = await supabase
        .from('onboarding_reminder_jobs')
        .select('id')
        .eq('user_id', plan.userId)
        .eq('status', 'pending')
        .eq('template_key', plan.templateKey)
        .maybeSingle();

      if (existing) {
        console.log('Reminder already scheduled for user:', plan.userId);
        return;
      }

      await supabase.from('onboarding_reminder_jobs').insert({
        user_id: plan.userId,
        channel: plan.channel,
        template_key: plan.templateKey,
        risk_level: plan.riskLevel,
        planned_at: plannedAt.toISOString(),
        metadata: plan.meta,
        status: 'pending'
      });

      console.log('Scheduled reminder:', plan);
    } catch (error) {
      console.error('Error scheduling recovery reminder:', error);
    }
  },

  async executeDueReminders(): Promise<ExecutionReport> {
    const report: ExecutionReport = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0
    };

    try {
      const { data: jobs } = await supabase.rpc('get_due_reminders');

      if (!jobs || jobs.length === 0) {
        return report;
      }

      report.total = jobs.length;

      for (const job of jobs) {
        try {
          const template = onboardingRecoveryTemplates[job.template_key];
          if (!template) {
            console.warn('Template not found:', job.template_key);
            report.skipped++;
            continue;
          }

          const startTime = Date.now();

          if (job.channel === 'in_app') {
            await this.sendInAppReminder(job.user_id, template);
          } else if (job.channel === 'push') {
            await this.sendPushReminder(job.user_id, template);
          } else if (job.channel === 'email') {
            await this.sendEmailReminder(job.user_id, template);
          }

          const executionTime = Date.now() - startTime;

          await supabase.rpc('mark_reminder_sent', {
            p_reminder_id: job.id,
            p_success: true,
            p_error_message: null
          });

          await supabase.from('onboarding_reminder_logs').update({
            execution_time_ms: executionTime
          }).eq('reminder_id', job.id);

          report.success++;
        } catch (error: any) {
          console.error('Error executing reminder:', error);

          await supabase.rpc('mark_reminder_sent', {
            p_reminder_id: job.id,
            p_success: false,
            p_error_message: error.message
          });

          report.failed++;
        }
      }

      return report;
    } catch (error) {
      console.error('Error executing due reminders:', error);
      return report;
    }
  },

  async sendInAppReminder(userId: string, template: any): Promise<void> {
    await supabase.from('mentor_conversations').insert({
      user_id: userId,
      role: 'system',
      message: template.in_app_message,
      message_type: 'system',
      metadata: {
        source: 'recovery_engine',
        template_key: template.key
      }
    });

    await notificationService.create({
      userId,
      type: 'onboarding_reminder',
      title: template.notification_title,
      body: template.in_app_message,
      actionUrl: template.deep_link || '/onboarding/mentor-chat'
    });
  },

  async sendPushReminder(userId: string, template: any): Promise<void> {
    await notificationService.create({
      userId,
      type: 'onboarding_reminder',
      title: template.notification_title,
      body: template.push_message,
      actionUrl: template.deep_link || '/onboarding/mentor-chat',
      priority: 'high'
    });
  },

  async sendEmailReminder(userId: string, template: any): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!profile?.email) {
      throw new Error('User email not found');
    }

    console.log('Email would be sent to:', profile.email, 'Template:', template.key);
  },

  async handleUserEvent(
    userId: string,
    eventType: string,
    payload?: any
  ): Promise<void> {
    try {
      await supabase.from('onboarding_events_v2').insert({
        user_id: userId,
        event_type: eventType,
        event_data: payload ?? {},
        source: 'system'
      });

      const resolvableEvents = [
        'company_data_added',
        'product_data_added',
        'chatbot_activated',
        'first_scan_done',
        'first_message_sent',
        'prospects_imported'
      ];

      if (resolvableEvents.includes(eventType)) {
        await supabase
          .from('onboarding_reminder_jobs')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('status', 'pending');
      }

      if (eventType === 'user_returned_from_reminder') {
        await supabase.from('onboarding_events_v2').insert({
          user_id: userId,
          event_type: 'user_returned_from_reminder',
          event_data: { ...payload, returned_at: new Date().toISOString() }
        });
      }
    } catch (error) {
      console.error('Error handling user event:', error);
    }
  },

  async assessAllUsersAtRisk(limitUsers: number = 100): Promise<void> {
    try {
      const { data: users } = await supabase
        .from('mentor_journey_state')
        .select('user_id')
        .neq('current_state', 'ONBOARDING_COMPLETE')
        .limit(limitUsers);

      if (!users) return;

      for (const user of users) {
        const risk = await this.detectOnboardingRisk(user.user_id);

        if (risk.risk_level !== 'low') {
          const plan = this.buildRecoveryPlan(user.user_id, risk);
          await this.scheduleRecoveryReminders(plan);
        }
      }
    } catch (error) {
      console.error('Error assessing users at risk:', error);
    }
  },

  async getRecoveryAnalytics(): Promise<any> {
    try {
      const { data: totalReminders } = await supabase
        .from('onboarding_reminder_jobs')
        .select('id', { count: 'exact' });

      const { data: sentReminders } = await supabase
        .from('onboarding_reminder_jobs')
        .select('id', { count: 'exact' })
        .eq('status', 'sent');

      const { data: resolvedReminders } = await supabase
        .from('onboarding_reminder_jobs')
        .select('id', { count: 'exact' })
        .eq('status', 'resolved');

      const { data: channelStats } = await supabase
        .from('onboarding_reminder_jobs')
        .select('channel, status')
        .eq('status', 'sent');

      return {
        total: totalReminders?.length || 0,
        sent: sentReminders?.length || 0,
        resolved: resolvedReminders?.length || 0,
        returnRate:
          sentReminders && resolvedReminders
            ? (resolvedReminders.length / sentReminders.length) * 100
            : 0,
        channelStats
      };
    } catch (error) {
      console.error('Error getting recovery analytics:', error);
      return {
        total: 0,
        sent: 0,
        resolved: 0,
        returnRate: 0,
        channelStats: []
      };
    }
  }
};
