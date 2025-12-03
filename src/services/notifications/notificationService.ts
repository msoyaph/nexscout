import { supabase } from '../../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  action_url?: string;
  related_prospect_id?: string;
  related_sequence_id?: string;
  metadata?: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  read_at?: string;
  created_at: string;
  expires_at?: string;
}

export type NotificationType =
  | 'hot_lead'
  | 'followup_due'
  | 'sequence_action'
  | 'lead_cooling'
  | 'streak_reminder'
  | 'mission_alert'
  | 'weekly_report'
  | 'ai_insight'
  | 'scan_complete'
  | 'coin_earned'
  | 'achievement';

export interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  enable_hot_lead: boolean;
  enable_followup: boolean;
  enable_sequences: boolean;
  enable_missions: boolean;
  enable_weekly_reports: boolean;
  enable_streak_reminders: boolean;
  enable_ai_insights: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  daily_digest: boolean;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  prospectId?: string;
  sequenceId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: any;
}

export const notificationService = {
  async getNotifications(userId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          prospects:related_prospect_id (
            id,
            full_name,
            profile_image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        notifications: data as Notification[],
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        notifications: [],
      };
    }
  },

  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return {
        success: true,
        count: count || 0,
      };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return {
        success: false,
        count: 0,
      };
    }
  },

  async createNotification(params: CreateNotificationParams) {
    try {
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: params.userId,
        p_type: params.type,
        p_title: params.title,
        p_message: params.message,
        p_icon: params.icon || null,
        p_prospect_id: params.prospectId || null,
        p_sequence_id: params.sequenceId || null,
        p_priority: params.priority || 'normal',
        p_metadata: params.metadata || {},
      });

      if (error) throw error;

      return {
        success: true,
        notificationId: data,
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase.rpc('mark_all_read', {
        p_user_id: userId,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking all as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async getSettings(userId: string) {
    try {
      let { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newSettings, error: insertError } = await supabase
          .from('notification_settings')
          .insert({ user_id: userId })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newSettings;
      } else if (error) {
        throw error;
      }

      return {
        success: true,
        settings: data as NotificationSettings,
      };
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        settings: null,
      };
    }
  },

  async updateSettings(userId: string, settings: Partial<NotificationSettings>) {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async createFollowUpReminder(params: {
    userId: string;
    prospectId: string;
    reminderDate: string;
    message?: string;
    sequenceId?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('follow_up_reminders')
        .insert({
          user_id: params.userId,
          prospect_id: params.prospectId,
          sequence_id: params.sequenceId || null,
          reminder_type: params.sequenceId ? 'sequence_step' : 'manual',
          reminder_date: params.reminderDate,
          message: params.message || null,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        reminder: data,
      };
    } catch (error) {
      console.error('Error creating follow-up reminder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async getStreak(userId: string) {
    try {
      let { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newStreak, error: insertError } = await supabase
          .from('user_streaks')
          .insert({ user_id: userId })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newStreak;
      } else if (error) {
        throw error;
      }

      return {
        success: true,
        streak: data,
      };
    } catch (error) {
      console.error('Error fetching streak:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        streak: null,
      };
    }
  },

  async updateStreak(userId: string, activityDate?: string) {
    try {
      const { error } = await supabase.rpc('update_user_streak', {
        p_user_id: userId,
        p_activity_date: activityDate || new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating streak:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      hot_lead: '🔥',
      followup_due: '🕒',
      sequence_action: '📨',
      lead_cooling: '❄️',
      streak_reminder: '⭐',
      mission_alert: '🎯',
      weekly_report: '📊',
      ai_insight: '🧠',
      scan_complete: '✅',
      coin_earned: '🪙',
      achievement: '🏆',
    };

    return icons[type] || '🔔';
  },

  getNotificationColor(type: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      hot_lead: 'from-red-500 to-orange-500',
      followup_due: 'from-blue-500 to-cyan-500',
      sequence_action: 'from-purple-500 to-pink-500',
      lead_cooling: 'from-gray-500 to-slate-500',
      streak_reminder: 'from-yellow-500 to-amber-500',
      mission_alert: 'from-green-500 to-emerald-500',
      weekly_report: 'from-indigo-500 to-blue-500',
      ai_insight: 'from-violet-500 to-purple-500',
      scan_complete: 'from-green-500 to-teal-500',
      coin_earned: 'from-yellow-500 to-orange-500',
      achievement: 'from-pink-500 to-rose-500',
    };

    return colors[type] || 'from-gray-500 to-gray-600';
  },

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
