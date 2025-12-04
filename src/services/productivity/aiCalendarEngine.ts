import { supabase } from '../../lib/supabase';

interface CalendarEventTrigger {
  userId: string;
  prospectId?: string;
  companyId?: string;
  title: string;
  description?: string;
  eventType: 'follow_up' | 'meeting' | 'task' | 'alert' | 'review' | 'revive' | 'close_attempt' | 'presentation' | 'demo' | 'training' | 'payment_due' | 'referral';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
  location?: string;
  attendees?: any[];
  aiReasoning?: string;
  color?: string;
  linkedPage?: string;
  navigationData?: any;
}

export class AICalendarEngine {
  static async createEvent(trigger: CalendarEventTrigger) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: trigger.userId,
          prospect_id: trigger.prospectId,
          company_id: trigger.companyId,
          title: trigger.title,
          description: trigger.description,
          event_type: trigger.eventType,
          priority: trigger.priority,
          source: trigger.source,
          start_time: trigger.startTime.toISOString(),
          end_time: trigger.endTime.toISOString(),
          all_day: trigger.allDay || false,
          location: trigger.location,
          attendees: trigger.attendees ? JSON.stringify(trigger.attendees) : null,
          auto_ai_generated: true,
          ai_reasoning: trigger.aiReasoning,
          color: trigger.color || this.getEventColor(trigger.eventType),
          linked_page: trigger.linkedPage,
          navigation_data: trigger.navigationData,
        })
        .select()
        .single();

      if (error) throw error;

      await this.logAITask(trigger.userId, 'calendar_event', data.id, trigger.source, trigger.aiReasoning || '');

      await this.scheduleEventReminder(trigger.userId, data.id, trigger.startTime);

      return data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  static getEventColor(eventType: string): string {
    const colorMap: Record<string, string> = {
      follow_up: '#3B82F6',
      meeting: '#10B981',
      task: '#F59E0B',
      alert: '#EF4444',
      review: '#8B5CF6',
      revive: '#EC4899',
      close_attempt: '#06B6D4',
      presentation: '#6366F1',
      demo: '#14B8A6',
      training: '#84CC16',
      payment_due: '#F97316',
      referral: '#A855F7',
    };
    return colorMap[eventType] || '#3B82F6';
  }

  static async createFollowUpEvent(userId: string, prospectId: string, prospectName: string, followUpDate: Date) {
    const endTime = new Date(followUpDate);
    endTime.setMinutes(endTime.getMinutes() + 30);

    return this.createEvent({
      userId,
      prospectId,
      title: `Follow-up: ${prospectName}`,
      description: `Scheduled follow-up with ${prospectName}`,
      eventType: 'follow_up',
      priority: 'medium',
      source: 'ai',
      startTime: followUpDate,
      endTime,
      aiReasoning: `AI scheduled follow-up based on prospect engagement patterns`,
      linkedPage: 'prospect-detail',
      navigationData: { prospectId },
    });
  }

  static async createMeetingEvent(userId: string, prospectId: string, prospectName: string, meetingTime: Date, duration: number = 60) {
    const endTime = new Date(meetingTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    return this.createEvent({
      userId,
      prospectId,
      title: `Meeting: ${prospectName}`,
      description: `Scheduled meeting with ${prospectName}`,
      eventType: 'meeting',
      priority: 'high',
      source: 'appointment_scheduler',
      startTime: meetingTime,
      endTime,
      location: 'Online',
      aiReasoning: `Meeting scheduled via appointment system`,
      linkedPage: 'prospect-detail',
      navigationData: { prospectId },
    });
  }

  static async createPresentationEvent(userId: string, prospectId: string, prospectName: string, presentationTime: Date) {
    const endTime = new Date(presentationTime);
    endTime.setMinutes(endTime.getMinutes() + 45);

    return this.createEvent({
      userId,
      prospectId,
      title: `Presentation: ${prospectName}`,
      description: `Product presentation for ${prospectName}`,
      eventType: 'presentation',
      priority: 'high',
      source: 'ai',
      startTime: presentationTime,
      endTime,
      aiReasoning: `Prospect qualified for product presentation`,
      linkedPage: 'pitch-decks',
      navigationData: { prospectId },
    });
  }

  static async createDemoEvent(userId: string, prospectId: string, prospectName: string, demoTime: Date) {
    const endTime = new Date(demoTime);
    endTime.setMinutes(endTime.getMinutes() + 60);

    return this.createEvent({
      userId,
      prospectId,
      title: `Demo: ${prospectName}`,
      description: `Product demo for ${prospectName}`,
      eventType: 'demo',
      priority: 'high',
      source: 'ai',
      startTime: demoTime,
      endTime,
      location: 'Zoom',
      aiReasoning: `Demo scheduled based on high buying signals`,
      linkedPage: 'prospect-detail',
      navigationData: { prospectId },
    });
  }

  static async getEventsForDateRange(userId: string, startDate: Date, endDate: Date) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*, prospects(full_name, profile_image_url)')
        .eq('user_id', userId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  static async getEventsForDay(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getEventsForDateRange(userId, startOfDay, endOfDay);
  }

  static async getEventsForWeek(userId: string, weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return this.getEventsForDateRange(userId, weekStart, weekEnd);
  }

  static async getEventsForMonth(userId: string, year: number, month: number) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    return this.getEventsForDateRange(userId, startDate, endDate);
  }

  static async updateEvent(eventId: string, userId: string, updates: {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    location?: string;
  }) {
    try {
      const updateData: any = {};

      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.startTime) updateData.start_time = updates.startTime.toISOString();
      if (updates.endTime) updateData.end_time = updates.endTime.toISOString();
      if (updates.location) updateData.location = updates.location;

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', eventId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  }

  static async deleteEvent(eventId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }

  private static async scheduleEventReminder(userId: string, eventId: string, eventTime: Date) {
    try {
      const reminderTime = new Date(eventTime);
      reminderTime.setMinutes(reminderTime.getMinutes() - 15);

      if (reminderTime > new Date()) {
        await supabase
          .from('notification_queue')
          .insert({
            user_id: userId,
            notification_type: 'event_starting',
            title: 'Event starting soon',
            message: 'Your event starts in 15 minutes',
            channels: ['push'],
            priority: 'high',
            linked_item_type: 'calendar_event',
            linked_item_id: eventId,
          });
      }
    } catch (error) {
      console.error('Error scheduling event reminder:', error);
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
          trigger_event: 'auto_event_created',
          ai_reasoning: aiReasoning,
          confidence_score: 0.80,
        });
    } catch (error) {
      console.error('Error logging AI task:', error);
    }
  }

  static async exportToICS(eventIds: string[], userId: string): Promise<string> {
    try {
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .in('id', eventIds);

      if (error) throw error;

      let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//NexScout//Calendar//EN\n';

      for (const event of events || []) {
        const startTime = new Date(event.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endTime = new Date(event.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        ics += 'BEGIN:VEVENT\n';
        ics += `UID:${event.id}@nexscout.com\n`;
        ics += `DTSTART:${startTime}\n`;
        ics += `DTEND:${endTime}\n`;
        ics += `SUMMARY:${event.title}\n`;
        if (event.description) ics += `DESCRIPTION:${event.description}\n`;
        if (event.location) ics += `LOCATION:${event.location}\n`;
        ics += 'END:VEVENT\n';
      }

      ics += 'END:VCALENDAR';

      return ics;
    } catch (error) {
      console.error('Error exporting to ICS:', error);
      return '';
    }
  }

  static async getUpcomingEvents(userId: string, limit: number = 5) {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*, prospects(full_name, profile_image_url)')
        .eq('user_id', userId)
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  }
}
