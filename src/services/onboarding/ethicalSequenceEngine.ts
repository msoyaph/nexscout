import { supabase } from '../../lib/supabase';

export interface SequenceAction {
  type: 'email' | 'push' | 'in_app' | 'skip';
  templateKey: string;
  delayMinutes?: number;
  triggerReason: string;
  priority: number;
}

export interface SequenceDayConfig {
  day: number;
  triggers: {
    condition: (userData: any) => boolean;
    actions: SequenceAction[];
  }[];
}

export interface ThrottleResult {
  allowed: boolean;
  reason?: string;
  nextAvailableAt?: Date;
}

export const ethicalSequenceEngine = {
  async checkAntiSpam(
    userId: string,
    channel: 'email' | 'push' | 'in_app' | 'sms'
  ): Promise<ThrottleResult> {
    try {
      const { data: canSend } = await supabase.rpc('can_send_communication', {
        p_user_id: userId,
        p_channel: channel,
        p_check_time: new Date().toISOString()
      });

      if (!canSend) {
        let nextAvailableAt = new Date();
        if (channel === 'email') {
          nextAvailableAt.setHours(nextAvailableAt.getHours() + 24);
        } else if (channel === 'push') {
          nextAvailableAt.setHours(nextAvailableAt.getHours() + 12);
        }

        return {
          allowed: false,
          reason: `${channel} throttled - too many recent communications`,
          nextAvailableAt
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking anti-spam:', error);
      return { allowed: false, reason: 'Error checking throttle' };
    }
  },

  async isQuietHours(userId: string): Promise<boolean> {
    try {
      const { data: prefs } = await supabase
        .from('user_communication_preferences')
        .select('quiet_hours_start, quiet_hours_end, timezone')
        .eq('user_id', userId)
        .maybeSingle();

      if (!prefs) return false;

      const now = new Date();
      const userHour = now.getHours();

      if (
        userHour >= prefs.quiet_hours_start ||
        userHour < prefs.quiet_hours_end
      ) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false;
    }
  },

  async getUserSequenceState(userId: string): Promise<any> {
    try {
      const { data } = await supabase
        .from('onboarding_sequence_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!data) {
        const { data: newState } = await supabase
          .from('onboarding_sequence_state')
          .insert({
            user_id: userId,
            sequence_day: 0,
            sequence_started_at: new Date().toISOString()
          })
          .select()
          .single();

        return newState;
      }

      const daysSinceStart = Math.floor(
        (Date.now() - new Date(data.sequence_started_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const currentDay = Math.min(daysSinceStart, 7);

      if (currentDay !== data.sequence_day) {
        await supabase
          .from('onboarding_sequence_state')
          .update({ sequence_day: currentDay, updated_at: new Date().toISOString() })
          .eq('user_id', userId);

        data.sequence_day = currentDay;
      }

      return data;
    } catch (error) {
      console.error('Error getting sequence state:', error);
      return null;
    }
  },

  async updateSequenceState(
    userId: string,
    updates: Partial<any>
  ): Promise<void> {
    try {
      await supabase
        .from('onboarding_sequence_state')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating sequence state:', error);
    }
  },

  async logCommunicationSent(
    userId: string,
    channel: 'email' | 'push' | 'in_app' | 'sms',
    templateKey: string
  ): Promise<void> {
    try {
      await supabase.rpc('log_communication_sent', {
        p_user_id: userId,
        p_channel: channel,
        p_template_key: templateKey
      });
    } catch (error) {
      console.error('Error logging communication:', error);
    }
  },

  async logSequenceAction(
    userId: string,
    sequenceDay: number,
    action: SequenceAction,
    wasThrottled: boolean,
    throttleReason?: string,
    sentSuccessfully?: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase.from('sequence_action_history').insert({
        user_id: userId,
        sequence_day: sequenceDay,
        action_type: action.type,
        trigger_reason: action.triggerReason,
        template_key: action.templateKey,
        channel_used: action.type === 'skip' ? null : action.type,
        was_throttled: wasThrottled,
        throttle_reason: throttleReason,
        sent_successfully: sentSuccessfully,
        error_message: errorMessage
      });
    } catch (error) {
      console.error('Error logging sequence action:', error);
    }
  },

  async checkReactionBasedSuppression(userId: string): Promise<boolean> {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: recentEmails } = await supabase
        .from('communication_throttle_log')
        .select('*')
        .eq('user_id', userId)
        .eq('channel', 'email')
        .gte('sent_at', threeDaysAgo.toISOString())
        .order('sent_at', { ascending: false })
        .limit(3);

      if (!recentEmails || recentEmails.length < 3) {
        return false;
      }

      const allIgnored = recentEmails.every(
        email => !email.opened && !email.clicked
      );

      if (allIgnored) {
        return true;
      }

      const anyMarkedAsSpam = recentEmails.some(email => email.marked_as_spam);
      if (anyMarkedAsSpam) {
        await supabase
          .from('user_communication_preferences')
          .update({ email_enabled: false })
          .eq('user_id', userId);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking reaction-based suppression:', error);
      return false;
    }
  },

  async getUserGuidanceLevel(userId: string): Promise<string> {
    try {
      const { data: prefs } = await supabase
        .from('user_communication_preferences')
        .select('guidance_level')
        .eq('user_id', userId)
        .maybeSingle();

      return prefs?.guidance_level || 'normal';
    } catch (error) {
      console.error('Error getting guidance level:', error);
      return 'normal';
    }
  },

  async shouldSendCommunication(
    userId: string,
    channel: 'email' | 'push' | 'in_app' | 'sms'
  ): Promise<ThrottleResult> {
    if (channel === 'in_app') {
      return { allowed: true };
    }

    const throttleCheck = await this.checkAntiSpam(userId, channel);
    if (!throttleCheck.allowed) {
      return throttleCheck;
    }

    if (channel === 'push' || channel === 'sms') {
      const isQuiet = await this.isQuietHours(userId);
      if (isQuiet) {
        return {
          allowed: false,
          reason: 'Quiet hours (9PM-8AM PH time)'
        };
      }
    }

    if (channel === 'email') {
      const suppressionCheck = await this.checkReactionBasedSuppression(
        userId
      );
      if (suppressionCheck) {
        return {
          allowed: false,
          reason: 'User ignored last 3 emails - reaction-based suppression'
        };
      }
    }

    const guidanceLevel = await this.getUserGuidanceLevel(userId);
    if (guidanceLevel === 'quiet_mode' && channel !== 'in_app') {
      return {
        allowed: false,
        reason: 'User preference: quiet mode'
      };
    }

    return { allowed: true };
  },

  async executeSequenceAction(
    userId: string,
    action: SequenceAction,
    sequenceDay: number
  ): Promise<boolean> {
    try {
      const canSend = await this.shouldSendCommunication(userId, action.type as any);

      if (!canSend.allowed) {
        await this.logSequenceAction(
          userId,
          sequenceDay,
          action,
          true,
          canSend.reason,
          false
        );
        return false;
      }

      console.log(`Executing ${action.type} action for user ${userId}:`, action);

      await this.logCommunicationSent(
        userId,
        action.type as any,
        action.templateKey
      );

      await this.logSequenceAction(
        userId,
        sequenceDay,
        action,
        false,
        undefined,
        true
      );

      return true;
    } catch (error: any) {
      console.error('Error executing sequence action:', error);
      await this.logSequenceAction(
        userId,
        sequenceDay,
        action,
        false,
        undefined,
        false,
        error.message
      );
      return false;
    }
  },

  async processUserSequence(userId: string, userData: any): Promise<void> {
    try {
      const sequenceState = await this.getUserSequenceState(userId);
      if (!sequenceState || sequenceState.is_complete) {
        return;
      }

      const currentDay = sequenceState.sequence_day;
      const dayConfig = this.getSequenceDayConfig(currentDay);

      if (!dayConfig) {
        return;
      }

      for (const trigger of dayConfig.triggers) {
        if (trigger.condition(userData)) {
          for (const action of trigger.actions) {
            if (action.delayMinutes && action.delayMinutes > 0) {
              continue;
            }

            const success = await this.executeSequenceAction(
              userId,
              action,
              currentDay
            );

            if (success && action.type !== 'in_app') {
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing user sequence:', error);
    }
  },

  getSequenceDayConfig(day: number): SequenceDayConfig | null {
    const configs = this.getAllSequenceConfigs();
    return configs.find(c => c.day === day) || null;
  },

  getAllSequenceConfigs(): SequenceDayConfig[] {
    return sequenceDayConfigs;
  }
};

const sequenceDayConfigs: SequenceDayConfig[] = [
  {
    day: 0,
    triggers: [
      {
        condition: (userData: any) => true,
        actions: [
          {
            type: 'email',
            templateKey: 'welcome_quickstart',
            triggerReason: 'User just signed up',
            priority: 10
          },
          {
            type: 'in_app',
            templateKey: 'welcome_mentor_intro',
            triggerReason: 'Welcome new user',
            priority: 10
          }
        ]
      }
    ]
  },
  {
    day: 1,
    triggers: [
      {
        condition: (userData: any) =>
          !userData.has_company_data &&
          userData.hours_since_signup >= 4 &&
          userData.hours_since_last_activity >= 4,
        actions: [
          {
            type: 'push',
            templateKey: 'push_onboarding_no_company_data',
            triggerReason: 'No company data 4 hours after signup',
            priority: 8
          },
          {
            type: 'in_app',
            templateKey: 'onboarding_no_company_data',
            triggerReason: 'Guide user to company setup',
            priority: 9
          },
          {
            type: 'email',
            templateKey: 'onboarding_no_company_data',
            delayMinutes: 480,
            triggerReason: 'No action 8 hours after push',
            priority: 7
          }
        ]
      },
      {
        condition: (userData: any) =>
          userData.has_company_data &&
          !userData.has_products &&
          userData.hours_since_last_activity >= 4,
        actions: [
          {
            type: 'push',
            templateKey: 'push_onboarding_no_products',
            triggerReason: 'Company added but no products',
            priority: 8
          },
          {
            type: 'in_app',
            templateKey: 'onboarding_no_products',
            triggerReason: 'Guide to product setup',
            priority: 9
          },
          {
            type: 'email',
            templateKey: 'onboarding_no_products',
            delayMinutes: 720,
            triggerReason: 'Still no products after 12 hours',
            priority: 7
          }
        ]
      }
    ]
  },
  {
    day: 2,
    triggers: [
      {
        condition: (userData: any) =>
          !userData.has_products &&
          userData.hours_since_signup >= 24,
        actions: [
          {
            type: 'email',
            templateKey: 'onboarding_no_products_social_proof',
            triggerReason: '24 hours, still no products - social proof',
            priority: 7
          }
        ]
      },
      {
        condition: (userData: any) =>
          userData.has_products &&
          !userData.chatbot_active &&
          userData.hours_since_last_activity >= 6,
        actions: [
          {
            type: 'push',
            templateKey: 'push_onboarding_no_chatbot',
            triggerReason: 'Products added, chatbot not activated',
            priority: 8
          },
          {
            type: 'in_app',
            templateKey: 'onboarding_no_chatbot',
            triggerReason: 'Show chatbot tutorial',
            priority: 9
          },
          {
            type: 'email',
            templateKey: 'onboarding_no_chatbot',
            delayMinutes: 360,
            triggerReason: 'Chatbot value explanation',
            priority: 7
          }
        ]
      }
    ]
  },
  {
    day: 3,
    triggers: [
      {
        condition: (userData: any) =>
          !userData.has_scans &&
          userData.hours_since_signup >= 48,
        actions: [
          {
            type: 'push',
            templateKey: 'push_onboarding_no_first_scan',
            triggerReason: '48 hours, no first scan',
            priority: 8
          },
          {
            type: 'in_app',
            templateKey: 'onboarding_no_first_win',
            triggerReason: 'First win encouragement',
            priority: 9
          },
          {
            type: 'email',
            templateKey: 'onboarding_no_first_win',
            delayMinutes: 480,
            triggerReason: 'AI-assisted scan offer',
            priority: 7
          }
        ]
      }
    ]
  },
  {
    day: 4,
    triggers: [
      {
        condition: (userData: any) =>
          userData.hours_since_last_activity >= 48 &&
          userData.hours_since_last_activity < 72,
        actions: [
          {
            type: 'push',
            templateKey: 'push_onboarding_stuck',
            triggerReason: 'User inactive 48-72 hours - gentle recovery',
            priority: 7
          },
          {
            type: 'in_app',
            templateKey: 'onboarding_stuck',
            triggerReason: 'Personalized coach help',
            priority: 9
          },
          {
            type: 'email',
            templateKey: 'onboarding_user_confused',
            delayMinutes: 360,
            triggerReason: 'Troubleshooting common issues',
            priority: 6
          }
        ]
      }
    ]
  },
  {
    day: 5,
    triggers: [
      {
        condition: (userData: any) =>
          userData.scans_last_7_days >= 10 &&
          userData.messages_last_7_days >= 10 &&
          userData.plan === 'free',
        actions: [
          {
            type: 'push',
            templateKey: 'push_free_high_usage',
            triggerReason: 'High usage free user - upgrade opportunity',
            priority: 8
          },
          {
            type: 'in_app',
            templateKey: 'onboarding_free_high_usage',
            triggerReason: 'ROI calculator',
            priority: 9
          },
          {
            type: 'email',
            templateKey: 'onboarding_free_high_usage',
            delayMinutes: 240,
            triggerReason: 'Upgrade value proposition',
            priority: 7
          }
        ]
      }
    ]
  },
  {
    day: 6,
    triggers: [
      {
        condition: (userData: any) =>
          userData.completed_steps_count >= 1 &&
          userData.completed_steps_count < 4,
        actions: [
          {
            type: 'push',
            templateKey: 'push_onboarding_stuck',
            triggerReason: 'Partial progress - encouragement',
            priority: 6
          },
          {
            type: 'in_app',
            templateKey: 'onboarding_stuck',
            triggerReason: 'Highlight next step',
            priority: 8
          }
        ]
      }
    ]
  },
  {
    day: 7,
    triggers: [
      {
        condition: (userData: any) => !userData.onboarding_complete,
        actions: [
          {
            type: 'email',
            templateKey: 'onboarding_final_recovery',
            triggerReason: '7 days incomplete - final recovery offer',
            priority: 7
          },
          {
            type: 'push',
            templateKey: 'push_onboarding_stuck',
            delayMinutes: 120,
            triggerReason: 'Push if mentor opened',
            priority: 6
          }
        ]
      }
    ]
  }
];
