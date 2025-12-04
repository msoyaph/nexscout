/**
 * Crisis Detection Service
 * Monitors engine health and triggers fallback mechanisms
 */

import { supabase } from '../lib/supabase';
import { broadcastEngineEvent } from './realtime/broadcastEngineEvent';

export type EngineStatus = 'GREEN' | 'YELLOW' | 'RED';
export type CrisisSeverity = 'YELLOW' | 'RED' | 'BLACKOUT';

export interface EngineMetrics {
  errorRate: number;
  avgLatencyMs: number;
  queueLength: number;
  totalJobs: number;
  failedJobs: number;
}

export interface CrisisPolicy {
  engine_id: string;
  threshold_error_rate: number;
  threshold_latency_ms: number;
  threshold_queue_length: number;
  action_on_yellow: string;
  action_on_red: string;
  fallback_engine_ids: string[];
  allow_degraded: boolean;
}

/**
 * Update engine state based on current metrics
 */
export async function updateEngineStateFromMetrics(
  engineId: string
): Promise<void> {
  try {
    const metrics = await calculateEngineMetrics(engineId);
    const policy = await getCrisisPolicy(engineId);

    if (!policy) {
      console.log(`[CrisisDetection] No policy for engine: ${engineId}`);
      return;
    }

    const status = determineStatus(metrics, policy);
    const currentState = await getEngineState(engineId);

    if (currentState.status !== status) {
      await updateEngineStatus(engineId, status, metrics);

      if (status === 'YELLOW' || status === 'RED') {
        await openCrisisIncident(engineId, status, metrics);
      } else if (status === 'GREEN' && currentState.status !== 'GREEN') {
        await resolveOpenIncidents(engineId);
      }

      await broadcastEngineEvent({
        engine_id: engineId,
        event_type: 'STARTED',
        payload: {
          statusChange: `${currentState.status} → ${status}`,
          metrics,
        },
      });
    }
  } catch (error) {
    console.error('[CrisisDetection] Error updating engine state:', error);
  }
}

/**
 * Calculate current metrics for an engine
 */
async function calculateEngineMetrics(
  engineId: string
): Promise<EngineMetrics> {
  try {
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: events } = await supabase
      .from('orchestrator_events')
      .select('status, duration_ms')
      .eq('engine_used', engineId)
      .gte('created_at', since);

    const { count: queueCount } = await supabase
      .from('orchestrator_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'QUEUED');

    const totalJobs = events?.length || 0;
    const failedJobs = events?.filter((e) => e.status === 'FAILED').length || 0;
    const errorRate = totalJobs > 0 ? failedJobs / totalJobs : 0;

    const durations =
      events
        ?.filter((e) => e.duration_ms)
        .map((e) => e.duration_ms as number) || [];
    const avgLatencyMs =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    return {
      errorRate,
      avgLatencyMs,
      queueLength: queueCount || 0,
      totalJobs,
      failedJobs,
    };
  } catch (error) {
    console.error('[CrisisDetection] Error calculating metrics:', error);
    return {
      errorRate: 0,
      avgLatencyMs: 0,
      queueLength: 0,
      totalJobs: 0,
      failedJobs: 0,
    };
  }
}

/**
 * Determine engine status based on metrics and policy
 */
function determineStatus(
  metrics: EngineMetrics,
  policy: CrisisPolicy
): EngineStatus {
  const isRed =
    metrics.errorRate >= policy.threshold_error_rate ||
    metrics.avgLatencyMs >= policy.threshold_latency_ms ||
    metrics.queueLength >= policy.threshold_queue_length;

  if (isRed) return 'RED';

  const isYellow =
    metrics.errorRate >= policy.threshold_error_rate * 0.7 ||
    metrics.avgLatencyMs >= policy.threshold_latency_ms * 0.8 ||
    metrics.queueLength >= policy.threshold_queue_length * 0.8;

  if (isYellow) return 'YELLOW';

  return 'GREEN';
}

/**
 * Get crisis policy for an engine
 */
async function getCrisisPolicy(
  engineId: string
): Promise<CrisisPolicy | null> {
  try {
    const { data, error } = await supabase
      .from('crisis_policies')
      .select('*')
      .eq('engine_id', engineId)
      .maybeSingle();

    if (error || !data) return null;
    return data as CrisisPolicy;
  } catch (error) {
    console.error('[CrisisDetection] Error getting policy:', error);
    return null;
  }
}

/**
 * Get current engine state
 */
export async function getEngineState(engineId: string): Promise<{
  status: EngineStatus;
  activeFallbackEngineId?: string;
}> {
  try {
    const { data } = await supabase
      .from('engine_states')
      .select('*')
      .eq('engine_id', engineId)
      .maybeSingle();

    return {
      status: (data?.status as EngineStatus) || 'GREEN',
      activeFallbackEngineId: data?.active_fallback_engine_id,
    };
  } catch (error) {
    console.error('[CrisisDetection] Error getting engine state:', error);
    return { status: 'GREEN' };
  }
}

/**
 * Update engine status in database
 */
async function updateEngineStatus(
  engineId: string,
  status: EngineStatus,
  metrics: EngineMetrics
): Promise<void> {
  try {
    await supabase.from('engine_states').upsert({
      engine_id: engineId,
      status,
      last_updated: new Date().toISOString(),
      last_reason: `Error rate: ${(metrics.errorRate * 100).toFixed(1)}%, Latency: ${Math.round(metrics.avgLatencyMs)}ms, Queue: ${metrics.queueLength}`,
      metrics: metrics as any,
    });
  } catch (error) {
    console.error('[CrisisDetection] Error updating engine status:', error);
  }
}

/**
 * Open a crisis incident
 */
async function openCrisisIncident(
  engineId: string,
  severity: CrisisSeverity,
  metrics: EngineMetrics
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('crisis_incidents')
      .select('id')
      .eq('engine_id', engineId)
      .eq('status', 'OPEN')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('crisis_incidents')
        .update({
          severity,
          reason: `Error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
          meta: metrics as any,
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('crisis_incidents').insert({
        engine_id: engineId,
        status: 'OPEN',
        severity,
        reason: `Error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
        meta: metrics as any,
      });
    }
  } catch (error) {
    console.error('[CrisisDetection] Error opening incident:', error);
  }
}

/**
 * Resolve open incidents for an engine
 */
async function resolveOpenIncidents(engineId: string): Promise<void> {
  try {
    await supabase
      .from('crisis_incidents')
      .update({
        status: 'RESOLVED',
        resolved_at: new Date().toISOString(),
      })
      .eq('engine_id', engineId)
      .eq('status', 'OPEN');
  } catch (error) {
    console.error('[CrisisDetection] Error resolving incidents:', error);
  }
}

/**
 * Get all engine states
 */
export async function getAllEngineStates() {
  try {
    const { data, error } = await supabase
      .from('engine_states')
      .select('*')
      .order('status', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[CrisisDetection] Error getting all states:', error);
    return [];
  }
}

/**
 * Get active crisis incidents
 */
export async function getActiveCrisisIncidents() {
  try {
    const { data, error } = await supabase
      .from('crisis_incidents')
      .select('*')
      .eq('status', 'OPEN')
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[CrisisDetection] Error getting incidents:', error);
    return [];
  }
}
