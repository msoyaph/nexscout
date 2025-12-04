import { supabase } from '../../lib/supabase';

export interface AIEventInput {
  userId: string;
  companyId?: string;
  contentType: string;
  contentId?: string;
  prospectId?: string;
  eventType: 'viewed' | 'sent' | 'opened' | 'replied' | 'clicked' | 'booked_meeting' | 'closed_deal' | 'unsubscribed';
  source?: string;
  metadata?: Record<string, any>;
}

export interface AIEvent {
  id: string;
  userId: string;
  companyId?: string;
  contentType: string;
  contentId?: string;
  prospectId?: string;
  eventType: string;
  source: string;
  metadata: Record<string, any>;
  createdAt: string;
}

/**
 * Log AI content performance event
 */
export async function logCompanyEvent(event: AIEventInput): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('company_ai_events').insert({
      user_id: event.userId,
      company_id: event.companyId || null,
      content_type: event.contentType,
      content_id: event.contentId || null,
      prospect_id: event.prospectId || null,
      event_type: event.eventType,
      source: event.source || 'app',
      metadata: event.metadata || {},
    });

    if (error) {
      console.error('Log company event error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Log company event error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Batch log multiple events
 */
export async function logCompanyEventsBatch(events: AIEventInput[]): Promise<{ success: boolean; count: number }> {
  try {
    const records = events.map((event) => ({
      user_id: event.userId,
      company_id: event.companyId || null,
      content_type: event.contentType,
      content_id: event.contentId || null,
      prospect_id: event.prospectId || null,
      event_type: event.eventType,
      source: event.source || 'app',
      metadata: event.metadata || {},
    }));

    const { error, count } = await supabase.from('company_ai_events').insert(records);

    if (error) {
      console.error('Batch log events error:', error);
      return { success: false, count: 0 };
    }

    return { success: true, count: count || records.length };
  } catch (error) {
    console.error('Batch log events error:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Get events for analysis
 */
export async function getCompanyEvents(
  userId: string,
  filters?: {
    companyId?: string;
    contentType?: string;
    eventType?: string;
    prospectId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<AIEvent[]> {
  try {
    let query = supabase
      .from('company_ai_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId);
    }
    if (filters?.contentType) {
      query = query.eq('content_type', filters.contentType);
    }
    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }
    if (filters?.prospectId) {
      query = query.eq('prospect_id', filters.prospectId);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get company events error:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      companyId: row.company_id,
      contentType: row.content_type,
      contentId: row.content_id,
      prospectId: row.prospect_id,
      eventType: row.event_type,
      source: row.source,
      metadata: row.metadata || {},
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Get company events error:', error);
    return [];
  }
}

/**
 * Get event counts by type
 */
export async function getEventCounts(
  userId: string,
  companyId?: string
): Promise<Record<string, number>> {
  try {
    let query = supabase
      .from('company_ai_events')
      .select('event_type')
      .eq('user_id', userId);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get event counts error:', error);
      return {};
    }

    const counts: Record<string, number> = {};
    data?.forEach((row) => {
      counts[row.event_type] = (counts[row.event_type] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('Get event counts error:', error);
    return {};
  }
}

/**
 * Get performance metrics for content
 */
export async function getContentPerformance(
  userId: string,
  contentType: string,
  contentId?: string
): Promise<{
  sent: number;
  opened: number;
  replied: number;
  bookedMeetings: number;
  closedDeals: number;
  unsubscribed: number;
  openRate: number;
  replyRate: number;
}> {
  try {
    let query = supabase
      .from('company_ai_events')
      .select('event_type')
      .eq('user_id', userId)
      .eq('content_type', contentType);

    if (contentId) {
      query = query.eq('content_id', contentId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const counts = {
      sent: 0,
      opened: 0,
      replied: 0,
      bookedMeetings: 0,
      closedDeals: 0,
      unsubscribed: 0,
    };

    data?.forEach((row) => {
      const type = row.event_type;
      if (type === 'sent') counts.sent++;
      else if (type === 'opened') counts.opened++;
      else if (type === 'replied') counts.replied++;
      else if (type === 'booked_meeting') counts.bookedMeetings++;
      else if (type === 'closed_deal') counts.closedDeals++;
      else if (type === 'unsubscribed') counts.unsubscribed++;
    });

    const openRate = counts.sent > 0 ? (counts.opened / counts.sent) * 100 : 0;
    const replyRate = counts.sent > 0 ? (counts.replied / counts.sent) * 100 : 0;

    return {
      ...counts,
      openRate: Math.round(openRate * 10) / 10,
      replyRate: Math.round(replyRate * 10) / 10,
    };
  } catch (error) {
    console.error('Get content performance error:', error);
    return {
      sent: 0,
      opened: 0,
      replied: 0,
      bookedMeetings: 0,
      closedDeals: 0,
      unsubscribed: 0,
      openRate: 0,
      replyRate: 0,
    };
  }
}
