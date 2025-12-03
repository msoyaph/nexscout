/**
 * Real-time Engine Event Broadcasting
 * Broadcasts engine events via Supabase Realtime for live monitoring
 */

import { supabase } from '../../lib/supabase';

export interface EngineEvent {
  engine_id: string;
  event_type: 'STARTED' | 'COMPLETED' | 'FAILED' | 'QUEUED';
  job_id?: string;
  user_id?: string;
  payload?: any;
}

/**
 * Broadcast an engine event to realtime listeners
 */
export async function broadcastEngineEvent(event: EngineEvent): Promise<void> {
  try {
    await supabase.from('realtime_engine_events').insert({
      engine_id: event.engine_id,
      event_type: event.event_type,
      job_id: event.job_id,
      user_id: event.user_id,
      payload: event.payload || {},
    });
  } catch (error) {
    console.error('[RealtimeBroadcast] Failed to broadcast event:', error);
  }
}

/**
 * Get recent engine events (for initial page load)
 */
export async function getRecentEngineEvents(limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('realtime_engine_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[RealtimeBroadcast] Failed to get recent events:', error);
    return [];
  }
}

/**
 * Get orchestrator queue length
 */
export async function getQueueLength(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('orchestrator_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'QUEUED');

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('[RealtimeBroadcast] Failed to get queue length:', error);
    return 0;
  }
}

/**
 * Calculate engine metrics from recent events
 */
export async function calculateEngineMetrics(engineId: string, windowMinutes: number = 60) {
  try {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('realtime_engine_events')
      .select('event_type, created_at, payload')
      .eq('engine_id', engineId)
      .gte('created_at', since);

    if (error) throw error;

    const events = data || [];
    const total = events.length;
    const completed = events.filter(e => e.event_type === 'COMPLETED').length;
    const failed = events.filter(e => e.event_type === 'FAILED').length;
    const errorRate = total > 0 ? (failed / total) * 100 : 0;

    return {
      total,
      completed,
      failed,
      errorRate: Math.round(errorRate * 100) / 100,
      successRate: total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0,
    };
  } catch (error) {
    console.error('[RealtimeBroadcast] Failed to calculate metrics:', error);
    return null;
  }
}
