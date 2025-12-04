/**
 * Government Admin API
 * Client-side API helpers for government dashboard data
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// ORCHESTRATOR EVENTS API
// ============================================================================

export interface OrchestratorEventsQuery {
  limit?: number;
  offset?: number;
  jobType?: string;
  status?: 'STARTED' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
}

export async function getOrchestratorEvents(query: OrchestratorEventsQuery = {}) {
  try {
    const {
      limit = 50,
      offset = 0,
      jobType,
      status,
    } = query;

    let supabaseQuery = supabase
      .from('orchestrator_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (jobType) {
      supabaseQuery = supabaseQuery.eq('job_type', jobType);
    }

    if (status) {
      supabaseQuery = supabaseQuery.eq('status', status);
    }

    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error('[GovernmentAPI] getOrchestratorEvents error:', error);
      return { rows: [], total: 0, error: error.message };
    }

    return { rows: data || [], total: count || 0, error: null };
  } catch (err: any) {
    console.error('[GovernmentAPI] getOrchestratorEvents exception:', err);
    return { rows: [], total: 0, error: err.message };
  }
}

export async function getOrchestratorStats(timeframe: '24h' | '7d' | '30d' = '24h') {
  try {
    const hoursBack = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const { data: events } = await supabase
      .from('orchestrator_events')
      .select('status, energy_cost, coin_cost, duration_ms')
      .gte('created_at', since);

    if (!events) return null;

    const total = events.length;
    const completed = events.filter(e => e.status === 'COMPLETED').length;
    const failed = events.filter(e => e.status === 'FAILED').length;
    const blocked = events.filter(e => e.status === 'BLOCKED').length;

    const totalEnergy = events.reduce((sum, e) => sum + (e.energy_cost || 0), 0);
    const totalCoins = events.reduce((sum, e) => sum + (e.coin_cost || 0), 0);
    const avgDuration = events.length > 0
      ? events.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / events.length
      : 0;

    return {
      total,
      completed,
      failed,
      blocked,
      successRate: total > 0 ? (completed / total) * 100 : 0,
      totalEnergy,
      totalCoins,
      avgDuration: Math.round(avgDuration),
    };
  } catch (err: any) {
    console.error('[GovernmentAPI] getOrchestratorStats error:', err);
    return null;
  }
}

// ============================================================================
// AUDIT JOBS API
// ============================================================================

export interface AuditJobsQuery {
  limit?: number;
  offset?: number;
  status?: string;
  jobType?: string;
}

export async function getAuditJobs(query: AuditJobsQuery = {}) {
  try {
    const {
      limit = 100,
      offset = 0,
      status,
      jobType,
    } = query;

    let supabaseQuery = supabase
      .from('audit_jobs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      supabaseQuery = supabaseQuery.eq('status', status);
    }

    if (jobType) {
      supabaseQuery = supabaseQuery.eq('job_type', jobType);
    }

    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error('[GovernmentAPI] getAuditJobs error:', error);
      return { rows: [], total: 0, error: error.message };
    }

    return { rows: data || [], total: count || 0, error: null };
  } catch (err: any) {
    console.error('[GovernmentAPI] getAuditJobs exception:', err);
    return { rows: [], total: 0, error: err.message };
  }
}

export async function getAuditStats(timeframe: '24h' | '7d' | '30d' = '24h') {
  try {
    const hoursBack = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const { data: audits } = await supabase
      .from('audit_jobs')
      .select('precheck_blocked, postcheck_blocked, risk_score')
      .gte('created_at', since);

    if (!audits) return null;

    const total = audits.length;
    const preBlocked = audits.filter(a => a.precheck_blocked).length;
    const postBlocked = audits.filter(a => a.postcheck_blocked).length;
    const avgRisk = audits.length > 0
      ? audits.reduce((sum, a) => sum + (a.risk_score || 0), 0) / audits.length
      : 0;

    return {
      total,
      preBlocked,
      postBlocked,
      totalBlocked: preBlocked + postBlocked,
      blockRate: total > 0 ? ((preBlocked + postBlocked) / total) * 100 : 0,
      avgRisk: Math.round(avgRisk * 100) / 100,
    };
  } catch (err: any) {
    console.error('[GovernmentAPI] getAuditStats error:', err);
    return null;
  }
}

// ============================================================================
// HEALTH CHECKS API
// ============================================================================

export async function getHealthChecks(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('system_health_checks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[GovernmentAPI] getHealthChecks error:', error);
      return { rows: [], error: error.message };
    }

    return { rows: data || [], error: null };
  } catch (err: any) {
    console.error('[GovernmentAPI] getHealthChecks exception:', err);
    return { rows: [], error: err.message };
  }
}

export async function getLatestHealthCheck() {
  try {
    const { data, error } = await supabase
      .from('system_health_checks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[GovernmentAPI] getLatestHealthCheck error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('[GovernmentAPI] getLatestHealthCheck exception:', err);
    return { data: null, error: err.message };
  }
}

// ============================================================================
// TELEMETRY API
// ============================================================================

export async function getTelemetryData(timeframe: '1h' | '24h' | '7d' = '24h') {
  try {
    const hoursBack = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : 168;
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const [events, audits, health] = await Promise.all([
      supabase
        .from('orchestrator_events')
        .select('created_at, status, duration_ms, engine_used')
        .gte('created_at', since)
        .order('created_at', { ascending: true }),
      supabase
        .from('audit_jobs')
        .select('created_at, precheck_blocked, postcheck_blocked, risk_score')
        .gte('created_at', since)
        .order('created_at', { ascending: true }),
      supabase
        .from('system_health_checks')
        .select('created_at, overall_status, error_rate_24h')
        .gte('created_at', since)
        .order('created_at', { ascending: true }),
    ]);

    return {
      events: events.data || [],
      audits: audits.data || [],
      health: health.data || [],
    };
  } catch (err: any) {
    console.error('[GovernmentAPI] getTelemetryData error:', err);
    return { events: [], audits: [], health: [] };
  }
}

// ============================================================================
// ENGINE PERFORMANCE API
// ============================================================================

export async function getEnginePerformance(timeframe: '24h' | '7d' = '24h') {
  try {
    const hoursBack = timeframe === '24h' ? 24 : 168;
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const { data: events } = await supabase
      .from('orchestrator_events')
      .select('engine_used, status, duration_ms')
      .gte('created_at', since)
      .not('engine_used', 'is', null);

    if (!events) return {};

    const engineStats: Record<string, any> = {};

    events.forEach(event => {
      const engine = event.engine_used;
      if (!engine) return;

      if (!engineStats[engine]) {
        engineStats[engine] = {
          total: 0,
          successful: 0,
          failed: 0,
          totalDuration: 0,
          avgDuration: 0,
        };
      }

      engineStats[engine].total++;
      if (event.status === 'COMPLETED') engineStats[engine].successful++;
      if (event.status === 'FAILED') engineStats[engine].failed++;
      if (event.duration_ms) engineStats[engine].totalDuration += event.duration_ms;
    });

    Object.keys(engineStats).forEach(engine => {
      const stats = engineStats[engine];
      stats.avgDuration = stats.total > 0 ? Math.round(stats.totalDuration / stats.total) : 0;
      stats.successRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;
    });

    return engineStats;
  } catch (err: any) {
    console.error('[GovernmentAPI] getEnginePerformance error:', err);
    return {};
  }
}
